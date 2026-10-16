// ------------------------------------------------------------------ graphics: static batching
// The town is thousands of small meshes that never move. Every half second we look for meshes that have stayed
// put for a few seconds, and per 12x12 patch of ground merge the ones sharing a material into one mesh, so
// the GPU draws each patch's stone, wood or roof in one go. The originals stay in the scene (hidden by layer), and
// if any of them moves, changes material, shows or hides, its batch is taken apart and merged again later.
const BAKE = {cell:12, wait:3.5, clock:0, cap:15000, budget:MOBILE ? 8000 : 16000, batches:new Map(), solos:new Map(), seen:new WeakMap(), on:true, group:new THREE.Group(), merges:0, breaks:0};
BAKE.group.name = 'bake'; scene.add(BAKE.group);
{
  const OBR = THREE.Object3D.prototype.onBeforeRender, OBC = THREE.Material.prototype.onBeforeCompile;
  const PLAIN = new Set(['MeshStandardMaterial', 'MeshPhysicalMaterial', 'MeshLambertMaterial', 'MeshPhongMaterial', 'MeshBasicMaterial', 'MeshToonMaterial']);
  const TEX = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap', 'bumpMap', 'lightMap'];
  const v = new THREE.Vector3(), nm = new THREE.Matrix3();
  // can this mesh ever be merged? (things that animate in a shader, skin, sort or draw part of a geometry cannot)
  // people and carried items come and go all the time: they are already merged per person and per item
  const MOVERS = new Set([itemMat, CHAR_MAT, CHAR_METAL]);
  const ANIM = {has:m => winMats.includes(m) || lampMats.includes(m)};
  BAKE.kind = o => {
    if (MOVERS.has(o.material) || !o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || o.morphTargetInfluences || o.renderOrder || o.onBeforeRender !== OBR || !o.frustumCulled || o.userData.noBake) return null;
    const m = o.material, g = o.geometry;
    if (!m || Array.isArray(m) || !PLAIN.has(m.type) || m.transparent || m.onBeforeCompile !== OBC) return null;
    if (!g.attributes.position || !g.attributes.normal || g.drawRange.count !== Infinity || g.drawRange.start || Object.keys(g.morphAttributes).length) return null;
    const uv = TEX.some(k => m[k]), col = !!m.vertexColors;
    if (uv && !g.attributes.uv || col && !g.attributes.color) return null;
    return (uv ? 'u' : '') + (col ? 'c' : '');
  };
  // where a mesh is and how it looks, to notice any change
  const shown = o => { let p = o; while (p && p !== scene) { if (!p.visible) return 0; p = p.parent; } return p ? 1 : -1; };   // -1: left the scene
  const newRec = () => ({vis:0, mat:null, geo:null, pv:0, nv:0, sh:0, m:new Float32Array(16)});
  function snap(o, r) {
    const vis = shown(o), g = o.geometry, e = o.matrixWorld.elements, sh = (o.castShadow ? 1 : 0) + (o.receiveShadow ? 2 : 0);
    let ch = vis !== r.vis || o.material !== r.mat || g !== r.geo || g.attributes.position.version !== r.pv || g.attributes.normal.version !== r.nv || sh !== r.sh;
    for (let i = 0; i < 16; i++) if (r.m[i] !== Math.fround(e[i])) { ch = true; r.m[i] = e[i]; }
    r.vis = vis; r.mat = o.material; r.geo = g; r.pv = g.attributes.position.version; r.nv = g.attributes.normal.version; r.sh = sh;
    return ch;
  }
  // how a material looks, so copies of the same material can share one draw
  const look = m => [m.type, m.color?.r, m.color?.g, m.color?.b, m.emissive?.r, m.emissive?.g, m.emissive?.b, m.emissiveIntensity, m.opacity, m.roughness, m.metalness, m.map?.id, m.normalMap?.id, m.emissiveMap?.id,
    m.flatShading, m.side, m.vertexColors, m.visible, m.toneMapped, m.fog, m.envMapIntensity, m.alphaTest, m.depthWrite, m.depthTest, m.wireframe, m.colorWrite].join();
  // glue the members of one material into one world-space geometry
  function merge(list, kind) {
    let nv = 0, ni = 0;
    for (const o of list) { const g = o.geometry; nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
    const pos = new Float32Array(nv*3), nor = new Float32Array(nv*3), uv = kind.includes('u') ? new Float32Array(nv*2) : null, col = kind.includes('c') ? new Float32Array(nv*3) : null;
    const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    let bv = 0, bi = 0;
    for (const o of list) {
      const g = o.geometry, P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, C = g.attributes.color, M = o.matrixWorld, n = P.count;
      nm.getNormalMatrix(M);
      for (let i = 0; i < n; i++) {
        v.fromBufferAttribute(P, i).applyMatrix4(M); pos[(bv + i)*3] = v.x; pos[(bv + i)*3 + 1] = v.y; pos[(bv + i)*3 + 2] = v.z;
        v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor[(bv + i)*3] = v.x; nor[(bv + i)*3 + 1] = v.y; nor[(bv + i)*3 + 2] = v.z;
        if (uv) { uv[(bv + i)*2] = U.getX(i); uv[(bv + i)*2 + 1] = U.getY(i); }
        if (col) { col[(bv + i)*3] = C.getX(i); col[(bv + i)*3 + 1] = C.getY(i); col[(bv + i)*3 + 2] = C.getZ(i); }
      }
      // a mirrored mesh has its triangles wound the other way: turn them back so they still face out
      const flip = M.determinant() < 0, I = g.index, cnt = I ? I.count : n;
      for (let t = 0; t < cnt; t += 3) {
        const a = I ? I.getX(t) : t, b = I ? I.getX(t + 1) : t + 1, c = I ? I.getX(t + 2) : t + 2;
        idx[bi++] = bv + a; idx[bi++] = bv + (flip ? c : b); idx[bi++] = bv + (flip ? b : c);
      }
      bv += n;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    if (uv) geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); if (col) geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeBoundingSphere(); geo.computeBoundingBox();
    return geo;
  }
  // a batch is one merged mesh: the still meshes of one patch that look the same
  function unbake(key) {
    const b = BAKE.batches.get(key); if (!b) return;
    for (const o of b.members) { o.layers.mask = o.userData.bakeMask ?? 1; delete o.userData.bakeMask; const s = BAKE.seen.get(o); if (s) s.batch = null; }
    BAKE.group.remove(b.mesh); b.mesh.geometry.dispose();
    BAKE.batches.delete(key);
  }
  function bake(key, arr) {
    const s0 = BAKE.seen.get(arr[0]), m = new THREE.Mesh(merge(arr, s0.kind), arr[0].material);
    m.castShadow = arr[0].castShadow; m.receiveShadow = arr[0].receiveShadow; m.matrixAutoUpdate = false; m.userData.noBake = true;
    BAKE.group.add(m);
    // copies of a material are checked by look each tick; a shared material is the same object, so any change shows anyway
    const multi = arr.some(o => o.material !== arr[0].material), b = {members:arr, mesh:m, looks:multi ? new Map(arr.map(o => [o, look(o.material)])) : null};
    for (const o of arr) { o.userData.bakeMask = o.layers.mask; o.layers.mask = 0; const s = BAKE.seen.get(o); s.batch = key; s.solo = null; }
    BAKE.batches.set(key, b); BAKE.merges++;
  }
  // The work is spread over frames: each frame gets a few milliseconds of it, so a pass over the whole town never
  // stalls one frame (doing it all at once every half second made the game hitch twice a second).
  let acc = 0, job = null, deadline = 0;
  const SLICE = 3;   // ms per frame
  const over = () => performance.now() > deadline;
  BAKE.tick = (dt, force) => {
    BAKE.clock += dt;
    if (!job) { acc += dt; if (!force && acc < .5) return; acc = 0; job = pass(); }
    deadline = force ? Infinity : performance.now() + SLICE;
    if (job.next().done) job = null;
  };
  function* pass() {
    const now = BAKE.clock, ready = new Map();
    // a batch whose members moved, hid, or changed their look comes apart
    for (const [key, b] of BAKE.batches) {
      let broke = false;
      for (const o of b.members) {
        const s = BAKE.seen.get(o);
        const why = snap(o, s.rec) ? 'snap' : s.rec.vis !== 1 ? 'vis' : b.looks && look(o.material) !== b.looks.get(o) ? 'look' : '';
        if (!why) continue;
        broke = true; s.t = now; if (BAKE.log) BAKE.log.push([why, o]);
        if (why === 'look') s.vol = true;      // a material that keeps changing only batches with meshes sharing it
        if (++s.nb >= 2) s.never = true;       // something that keeps moving now and then is left as it is
      }
      if (broke) { unbake(key); BAKE.breaks++; }
      if (over()) yield;
    }
    if (!BAKE.on) { for (const k of [...BAKE.batches.keys()]) unbake(k); return; }
    const stack = [...scene.children];
    let n = 0;
    while (stack.length) {
      if ((++n & 255) === 0 && over()) yield;
      const o = stack.pop();
      if (o === BAKE.group || CHARS.has(o)) continue;
      for (let i = 0; i < o.children.length; i++) stack.push(o.children[i]);
      if (!o.isMesh) continue;
      let s = BAKE.seen.get(o);
      if (s) {
        if (s.batch) continue;
        if (snap(o, s.rec)) { s.t = now; s.kind = s.never ? null : BAKE.kind(o); if (s.solo && BAKE.solos.get(s.solo) === o) BAKE.solos.delete(s.solo); s.solo = null; continue; }
      } else {
        const kind = BAKE.kind(o); BAKE.seen.set(o, s = {rec:newRec(), t:now, kind, batch:null, solo:null, nb:0}); snap(o, s.rec); continue;
      }
      if (s.kind === null || s.solo || s.rec.vis !== 1 || now - s.t < BAKE.wait) continue;
      const e = o.matrixWorld.elements, key = Math.floor(e[12] / BAKE.cell) + ',' + Math.floor(e[14] / BAKE.cell) + '|' + s.kind + s.rec.sh + '|' + (s.vol || ANIM.has(o.material) ? '#' + o.material.id : look(o.material));
      (ready.get(key) || ready.set(key, []).get(key)).push(o);
    }
    // new still meshes join their batch (or a lone mesh waiting for company); a vertex budget keeps each tick short
    let budget = BAKE.budget;
    for (const [key, list0] of ready) {
      if (budget <= 0) { acc = .5; break; }          // more to do: carry on next frame
      if (over()) yield;
      // the walk took a few frames: anything that moved meanwhile waits for the next pass
      const list = list0.filter(o => { const s = BAKE.seen.get(o); if (snap(o, s.rec) || s.rec.vis !== 1) { s.t = BAKE.clock; return false; } return true; });
      if (!list.length) continue;
      const b = BAKE.batches.get(key), all = list.slice();
      // a batch is capped in size, so taking one apart and merging it again never stalls a frame
      if (b && b.mesh.geometry.attributes.position.count + list.reduce((n, o) => n + o.geometry.attributes.position.count, 0) > BAKE.cap) { for (const o of list) BAKE.seen.get(o).solo = key + '#full'; continue; }
      if (b) { unbake(key); for (const o of b.members) { const s = BAKE.seen.get(o); if (!snap(o, s.rec) && s.rec.vis === 1) all.push(o); else s.t = now; } }
      const solo = BAKE.solos.get(key);
      if (solo && !all.includes(solo)) { const s = BAKE.seen.get(solo); BAKE.solos.delete(key); if (s && s.solo === key && !snap(solo, s.rec) && s.rec.vis === 1) all.push(solo); else if (s) { s.solo = null; s.t = now; } }
      let nv = 0; const keep = all.filter(o => (nv += o.geometry.attributes.position.count) <= BAKE.cap || o === all[0]);
      for (const o of all) if (!keep.includes(o)) BAKE.seen.get(o).solo = key + '#full';
      all.length = 0; all.push(...keep);
      if (all.length < 2) { BAKE.solos.set(key, all[0]); BAKE.seen.get(all[0]).solo = key; continue; }
      for (const o of all) budget -= o.geometry.attributes.position.count;
      bake(key, all);
    }
  };
  BAKE.stats = () => { let m = 0; for (const b of BAKE.batches.values()) m += b.members.length; return {batches:BAKE.batches.size, members:m, solos:BAKE.solos.size, merges:BAKE.merges, breaks:BAKE.breaks}; };
}

// If frames come in slowly, drop to low quality once: lower resolution and no shadows.
const perf = {t:0, n:0, low:false};
function adapt(real) {
  if (perf.low || !started || document.hidden || real > .25) return;
  perf.t += real; perf.n++;
  if (perf.t < 4) return;
  const fps = perf.n / perf.t; perf.t = perf.n = 0;
  if (fps >= 38) return;
  perf.low = true;
  renderer.setPixelRatio(1); renderer.shadowMap.enabled = false; sun.castShadow = false; POST.on = false;
  scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => { m.needsUpdate = true; }); });
  fit();
}
function frame(now) {
  const real = (now - last) / 1000, dt = Math.min(.05, real); last = now;
  if (paused) { requestAnimationFrame(frame); return; }      // the last frame stays on screen; no time passes
  adapt(real);
  update(dt); updQN(dt); render(dt); BAKE.tick(real);
  requestAnimationFrame(frame);
}
function fit() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  if (rtS) postSize();
}
new ResizeObserver(fit).observe(stage);

