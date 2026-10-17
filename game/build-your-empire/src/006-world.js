// ------------------------------------------------------------------ world
const BOUNDS = {x0:-10.3, x1:13.4, z0:-12.9, z1:13.9};
// The player may walk anywhere inside the camp or an opened region.
const AREAS = [BOUNDS, {x0:-14.2, x1:-10.2, z0:.4, z1:1.6}];   // the camp, and the fishing dock
for (const r of WORLD.roads) AREAS.push(r);
for (const r of LAND.camp) { AREAS.push(r); LAND.rects.push(r); }
AREAS.push({x0:14.6, x1:30, z0:-1.6, z1:4.8}, {x0:-9.4, x1:14, z0:15.1, z1:16.6}, {x0:-6.4, x1:-4.9, z0:-24, z1:-14});
AREAS.push(ZOOPARK.path, {x0:ZOOPARK.x0, x1:ZOOPARK.x1, z0:ZOOPARK.z0, z1:ZOOPARK.z1});
for (const I of WORLD.islands) AREAS.push({x0:I.x - 21, x1:I.x + 21, z0:I.z - 21, z1:I.z + 21, island:true});
const inRect = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
const inArea = (x, z) => AREAS.some(r => inRect(r, x, z));
const boxes = [], circles = [];
const GY = -.26;   // grass level, below the slabs
const DETAIL_N = (() => {
  // a height field of layered noise, turned into a normal map
  const N = 256, h = new Float32Array(N*N); let sd = 7; const r = () => (sd = sd*16807 % 2147483647) / 2147483647;
  for (const [cells, amp] of [[8, 1], [16, .55], [32, .3], [64, .16]]) {
    const g = []; for (let i = 0; i <= cells; i++) { g.push([]); for (let j = 0; j <= cells; j++) g[i].push(r()); }
    for (let i = 0; i < cells; i++) g[i][cells] = g[i][0]; for (let j = 0; j <= cells; j++) g[cells][j] = g[0][j];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const fx = x/N*cells, fy = y/N*cells, ix = fx|0, iy = fy|0, tx = fx - ix, ty = fy - iy, sx = tx*tx*(3 - 2*tx), sy = ty*ty*(3 - 2*ty);
      const a = g[iy][ix] + (g[iy][ix + 1] - g[iy][ix])*sx, b = g[iy + 1][ix] + (g[iy + 1][ix + 1] - g[iy + 1][ix])*sx;
      h[y*N + x] += (a + (b - a)*sy) * amp;
    }
  }
  const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), im = g.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = (h[y*N + (x + 1) % N] - h[y*N + (x - 1 + N) % N]) * 3, dy = (h[((y + 1) % N)*N + x] - h[((y - 1 + N) % N)*N + x]) * 3, l = Math.hypot(dx, dy, 1), k = (y*N + x)*4;
    im.data[k] = (-dx/l*.5 + .5)*255; im.data[k + 1] = (-dy/l*.5 + .5)*255; im.data[k + 2] = (1/l*.5 + .5)*255; im.data[k + 3] = 255;
  }
  g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4; return t;
})();
const grassPlane = ground(0x5f7a38, WORLD.cx1 - WORLD.cx0, WORLD.cz1 - WORLD.cz0, (WORLD.cx0 + WORLD.cx1)/2, (WORLD.cz0 + WORLD.cz1)/2, GY); grassPlane.material.map = groundTex([68, 68]);
if (!MOBILE) { const n = DETAIL_N.clone(); n.repeat.set(140, 140); grassPlane.material.normalMap = n; grassPlane.material.normalScale.set(.9, .9); grassPlane.material.roughness = .92; grassPlane.material.needsUpdate = true; }
phDress(grassPlane.material, 0x557133, WORLD.cx1 - WORLD.cx0, WORLD.cz1 - WORLD.cz0, 'aerial_grass_rock', 8, .45);
const campSlab = slab(0xc29a62, 25, 27.6, 1.6, 0.5);
slab(0xb98f5c, 40, 2.4, 45, 1.6, .012);
slab(0xb98f5c, 16, 1.8, 58, 3.6, .012);
slab(0xb98f5c, 1.8, 16.4, -9.5, 86.8, .012);   // the recruits' road, west of the battlefield
// river
const water = ground(0x2fb0e2, 9, 320, -15.1, 0, -.2);
water.material = new THREE.MeshStandardMaterial({color:0x2fb0e2, roughness:.15, metalness:.15});
ground(0xe8d49a, .8, 320, -10.5, 0, -.215);
ground(0xe8d49a, .8, 320, -19.7, 0, -.215);
const ripples = [];
for (let i = 0; i < 110; i++) {
  const m = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.35}));
  m.rotation.x = -Math.PI/2; m.scale.set(.08, .6 + R()*.6, 1);
  m.position.set(-19 + R()*7.8, -.19, -150 + R()*300); scene.add(m); ripples.push(m);
}
// pier by the fishing spot
for (let i = 0; i < 9; i++) mesh(G.box, i % 2 ? 0x9a6b40 : 0x8a5d36, [.5, .14, 1.8], [-14.5 + i*.52, .22, 1], scene);
[[-14.7, .2], [-14.7, 1.8], [-12.4, .2], [-12.4, 1.8]].forEach(([x, z]) => mesh(G.cyl, 0x5e3f22, [.09, .7, .09], [x, .1, z], scene));

// open land in the spread-out world: every region, the roads between them and the plots kept for later growth
const OPEN_LAND = [{x0:-76, x1:-49.5, z0:79.5, z1:99}, ...LAND.camp, {x0:ZOOPARK.x0 - 2, x1:ZOOPARK.x1 + 2, z0:ZOOPARK.z0 - 2, z1:ZOOPARK.z1 + 2}, {x0:77, x1:83, z0:3, z1:23}, ...WORLD.roads.map(r => ({x0:r.x0, x1:r.x1, z0:r.z0 - 1, z1:r.z1 + 1})), {x0:-9.5, x1:-5.9, z0:-32.9, z1:-12.1}, {x0:12.6, x1:35.4, z0:-0.2, z1:3.4}, {x0:1.2, x1:4.8, z0:13.2, z1:63.8}, {x0:37.8, x1:41.4, z0:12.9, z1:63}, {x0:12.4, x1:34.6, z0:69, z1:82.6}, {x0:33.2, x1:36.8, z0:-32, z1:-12.2}, {x0:-23.4, x1:-9.6, z0:7.8, z1:11.4}, {x0:12.8, x1:34.4, z0:-42.3, z1:-38.7}, {x0:-23.4, x1:-9.8, z0:-40.8, z1:-37.2}];
// decorative forest (instanced) outside the camp
const FOREST = {};
// tree colours: bright, warm greens and a soft brown bark
const TREE_MAT = {};
function treeMat(m) {
  const k = m.name || 'x';
  return TREE_MAT[k] ||= (() => { const c = m.clone(); if (/leaf/i.test(k)) c.color.set(/Dark/.test(k) ? 0x4cb43a : 0x6fcf48); if (/wood|bark/i.test(k)) c.color.set(0x8a5a2b); c.roughness = .85; c.metalness = 0; return c; })();
}
{
  const spots = []; seed = 11;
  const GRIDF = new Map(), gk = (x, z) => (Math.floor(x/1.65) + 1000)*4000 + Math.floor(z/1.65) + 1000;
  for (let n = 0; n < 120000 && spots.length < (MOBILE ? 1700 : 3800); n++) {
    const x = WORLD.cx0 + 10 + rnd()*(WORLD.cx1 - WORLD.cx0 - 20), z = -72 + rnd()*(WORLD.cz1 + 64);
    if (!(x > -150 && x < 120 && z < 156) && rnd() < .6) continue;      // thick woods at home, thinner wilds beyond
    { let near = false; for (let dx = -1; dx <= 1 && !near; dx++) for (let dz = -1; dz <= 1 && !near; dz++) for (const q of GRIDF.get(gk(x + dx*1.65, z + dz*1.65)) || []) if (Math.hypot(q[0] - x, q[1] - z) < 1.65) { near = true; break; } if (near) continue; }
    if (x > -11 && x < 15 && z > -14 && z < 15.2) continue;          // the camp
    if (x > -21 && x < -9.6) continue;                                // the river
    if (OPEN_LAND.some(r => x > r.x0 - 1.4 && x < r.x1 + 1.4 && z > r.z0 - 1.4 && z < r.z1 + 1.4)) continue;   // regions, roads and plots
    const sp = [x, z, .8 + rnd()*.6]; spots.push(sp); const kk = gk(x, z); if (!GRIDF.has(kk)) GRIDF.set(kk, []); GRIDF.get(kk).push(sp);
  }
  const KN = ['pineR', 'spruceR', 'oakR'].every(k => MODELS[k]);
  if (KN) {
    // shared materials, so the seasons recolour every tree at once; the baked shading rides in the vertex colours
    const LEAFC = new THREE.MeshStandardMaterial({color:0x2f6e2c, vertexColors:true, roughness:.88}), LEAFB = new THREE.MeshStandardMaterial({color:0x4a8a3a, vertexColors:true, roughness:.85});
    const BARKM = new THREE.MeshStandardMaterial({color:0xc8a27a, vertexColors:true, roughness:.95});
    FOREST.matFor = m => /leafBroad/.test(m.name) ? LEAFB : /leaf/i.test(m.name) ? LEAFC : BARKM;
    const KINDS = [['pineR', 3.7], ['spruceR', 3.3], ['oakR', 3.1], ['oakL', 3.1]].filter(k => MODELS[k[0]]);
    // the detailed broadleaf at home, its lighter twin out in the wilds where you only pass by
    const kindOf = i => { const h = (i*2654435761 >>> 0) % 10, x = spots[i][0], z = spots[i][1]; return h < 4 ? 0 : h < 7 ? 1 : (KINDS[3] && !(x > -150 && x < 120 && z < 156)) ? 3 : 2; };
    // one instanced mesh per kind per east-west strip of the map, so whole strips off screen are skipped
    // blocks of 44 x 44 so the camera only draws the woods near it
    const NBX = 16, NBZ = 8, NCH = NBX*NBZ, chunkOf = (x, z) => Math.max(0, Math.min(NBX - 1, Math.floor((x + 352) / 44))) + NBX*Math.max(0, Math.min(NBZ - 1, Math.floor((z + 92) / 44)));
    const local = KINDS.map(() => Array.from({length:NCH}, () => []));
    FOREST.where = spots.map((sp, i) => { const k = kindOf(i), c = chunkOf(sp[0], sp[1]); local[k][c].push(i); return [k, c, local[k][c].length - 1]; });
    const o = new THREE.Object3D(), m4 = new THREE.Matrix4(); FOREST.byKind = [];
    const leafC = [], leafB = [], barks = [];
    KINDS.forEach(([k, H], ki) => {
      const src = MODELS[k], bb = new THREE.Box3().setFromObject(src), h = bb.max.y - bb.min.y; src.updateMatrixWorld(true);
      const lists = Array.from({length:NCH}, () => []); FOREST.byKind.push(lists);
      src.traverse(c => {
        if (!c.isMesh) return;
        for (let ci = 0; ci < NCH; ci++) {
          const ids = local[ki][ci]; if (!ids.length) continue;
          const im = new THREE.InstancedMesh(c.geometry, FOREST.matFor(c.material), ids.length);
          ids.forEach((i, j) => {
            const [x, z, sz] = spots[i], sc = H * sz / h;
            o.position.set(x, GY - bb.min.y*sc, z); o.rotation.set(0, (x*7 + z*3) % 6.28, 0); o.scale.set(sc*(.9 + (i % 7)*.03), sc, sc*(.9 + (i % 5)*.04)); o.updateMatrix();
            im.setMatrixAt(j, m4.multiplyMatrices(o.matrix, c.matrixWorld));
          });
          im.computeBoundingSphere(); im.castShadow = true; im.receiveShadow = true; scene.add(im); lists[ci].push(im);
          (im.material === LEAFC ? leafC : im.material === LEAFB ? leafB : barks).push(im);
        }
      });
    });
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    FOREST.hideAt = i => { const [k, c, j] = FOREST.where[i]; FOREST.byKind[k][c].forEach(m => { m.setMatrixAt(j, zero); m.instanceMatrix.needsUpdate = true; }); };
    FOREST.spots = spots; FOREST.meshes = [barks[0], leafC[0], leafB[0], ...barks.slice(1), ...leafC.slice(1), ...leafB.slice(1)];
  } else {
  const KT = ['pineA', 'pineC', 'pineE', 'treeD'].filter(k => MODELS[k]);
  if (KT.length) {
    const meshes = [], o = new THREE.Object3D(), hide = new THREE.Matrix4().makeScale(0, 0, 0), m4 = new THREE.Matrix4();
    KT.forEach((k, vi) => {
      const src = MODELS[k], bb = new THREE.Box3().setFromObject(src), h = bb.max.y - bb.min.y; src.updateMatrixWorld(true);
      src.traverse(c => {
        if (!c.isMesh) return;
        const im = new THREE.InstancedMesh(c.geometry, treeMat(c.material), spots.length);
        spots.forEach(([x, z, s], i) => {
          if (i % KT.length !== vi) { im.setMatrixAt(i, hide); return; }
          const sc = (k === 'treeD' ? 2.6 : 3.1) * s / h;
          o.position.set(x, GY - bb.min.y*sc, z); o.rotation.set(0, (x*7 + z*3) % 6.28, 0); o.scale.setScalar(sc); o.updateMatrix();
          im.setMatrixAt(i, m4.multiplyMatrices(o.matrix, c.matrixWorld));
        });
        im.castShadow = true; im.receiveShadow = true; scene.add(im); meshes.push(im);
      });
    });
    FOREST.spots = spots; FOREST.meshes = meshes;
  } else {
  const trunk = new THREE.InstancedMesh(G.cyl, mat(0x6b4526), spots.length);
  const c1 = new THREE.InstancedMesh(G.cone, mat(0x3b9a3a), spots.length);
  const c2 = new THREE.InstancedMesh(G.cone, mat(0x5ec04c), spots.length);
  const o = new THREE.Object3D();
  spots.forEach(([x, z, s], i) => {
    o.position.set(x, .4*s + GY, z); o.scale.set(.18*s, .8*s, .18*s); o.updateMatrix(); trunk.setMatrixAt(i, o.matrix);
    o.position.set(x, 1.4*s + GY, z); o.scale.set(1.1*s, 1.6*s, 1.1*s); o.updateMatrix(); c1.setMatrixAt(i, o.matrix);
    o.position.set(x, 2.3*s + GY, z); o.scale.set(.8*s, 1.3*s, .8*s); o.updateMatrix(); c2.setMatrixAt(i, o.matrix);
  });
  [trunk, c1, c2].forEach(m => { m.castShadow = true; scene.add(m); });
  FOREST.spots = spots; FOREST.meshes = [trunk, c1, c2];
  }
  }
}
// mountains and the cliff the mine is dug into, north of everything
{
  seed = 31;
  for (let x = -50; x <= 64; x += 5 + rnd()*3) {
    const h = 8 + rnd()*8, r = 5 + rnd()*3, z = -56 - rnd()*6;
    if (Math.abs(x + 13.6) < r + 2.5) continue;   // the river runs north between the mountains
    mesh(G.cone, rnd() < .5 ? 0x8a8f96 : 0x7d838a, [r, h, r], [x, h/2 - .5, z], scene, {flatShading:true});
    mesh(G.cone, 0xf4f7fa, [r*.38, h*.38, r*.38], [x, h - h*.19 - .5, z], scene);
  }
  for (let x = -9.4; x <= 16; x += 1.6) {
    const h = 2.6 + rnd()*1.6;
    mesh(G.box, rnd() < .5 ? 0x8b8f96 : 0x9a9ea5, [1.9, h, 1.6 + rnd()], [x, h/2 - .24, -49.4 - rnd()*.5], scene, {flatShading:true}).rotation.y = (rnd() - .5)*.3;
  }
}

// choppable grove inside camp
const trees = [];
{
  seed = 5;
  for (let n = 0; n < 2000 && trees.length < 11; n++) {
    const x = .8 + rnd()*12, z = -12.5 + rnd()*3;
    if (Math.hypot(x - 9, z + 7) < 2.6) continue;
    if (trees.some(t => Math.hypot(t.x - x, t.z - z) < 1.7)) continue;
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const s = .85 + rnd()*.3;
    const trunk = mesh(G.cyl, 0x6b4526, [.2*s, .9*s, .2*s], [0, .45*s, 0], g);
    const top = new THREE.Group(); g.add(top);
    mesh(G.cone, 0x3b9a3a, [1.05*s, 1.6*s, 1.05*s], [0, 1.6*s, 0], top);
    mesh(G.cone, 0x5ec04c, [.75*s, 1.3*s, .75*s], [0, 2.45*s, 0], top);
    const stump = mesh(G.cyl, logMats, [.24*s, .3, .24*s], [0, .15, 0], g);
    stump.visible = false;
    const km = FOREST.matFor ? model(['pineR', 'spruceR', 'oakR'][trees.length % 3], [3.6, 3.2, 3.0][trees.length % 3]*s, 'y') : model(['pineA', 'pineC', 'pineE'][trees.length % 3], 3.1*s, 'y');
    if (km) { top.children.forEach(c => c.visible = false); trunk.visible = false; km.traverse(c => { if (c.isMesh) c.material = FOREST.matFor ? FOREST.matFor(c.material) : treeMat(c.material); }); top.add(km); }
    scene.add(g);
    trees.push({x, z, g, top, trunk, stump, s, item:'log', logs:4, regrow:0, shake:0});
    circles.push({x, z, r:.35});
  }
}

for (const r of WORLD.roads) { slab(0xb98f5c, r.x1 - r.x0, r.z1 - r.z0, (r.x0 + r.x1)/2, (r.z0 + r.z1)/2, .01); for (let x = r.x0 + 12; x < r.x1; x += 24) { const p = mesh(G.cyl, 0x6a4a2a, [.07, 1.1, .07], [x, .55, r.z0 - .4], scene); } }
