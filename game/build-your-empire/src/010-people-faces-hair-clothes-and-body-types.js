// ------------------------------------------------------------------ people: faces, hair, clothes and body types, merged so a crowd stays cheap
const G2 = {sph:new THREE.SphereGeometry(1, 12, 9), sphS:new THREE.SphereGeometry(1, 7, 5), cyl:new THREE.CylinderGeometry(1, 1, 1, 10),
  flare:new THREE.CylinderGeometry(.55, 1, 1, 12), ring:new THREE.TorusGeometry(1, .1, 4, 14), cap:new THREE.CapsuleGeometry(.3, .42, 3, 10)};
const HAIRC = [0x1a1410, 0x2a1a10, 0x3a2414, 0x6a4422, 0x9a6a3a, 0xc89a5a, 0xe8c87a, 0x9a3a1a, 0xb8b8b8, 0xd8d8d8, 0x7a2a8a, 0xd9443a];
const TOPC = [0xf4f4f4, 0x1e1e22, 0xd9443a, 0x3f7cc0, 0xf2a21a, 0x3f9a6a, 0xb04f86, 0x8fc6e8, 0xe8d8b0, 0x7c4fb0, 0xf0c030, 0x2a8a9a, 0xff8a6a, 0x5a6a7a];
const PANTC = [0x2a3a5a, 0x3a3a4a, 0x1e1e22, 0x6a5a4a, 0xd8cfb8, 0x4a5a3a, 0x8a2a2a, 0x5a7aa8];
function civLook(i) {
  let s = (i + 1) * 7919; const r = () => (s = s * 16807 % 2147483647) / 2147483647, pick = a => a[r()*a.length|0];
  const dress = r() < .18, top = dress ? 'dress' : pick(['tee', 'tee', 'shirt', 'hawaii', 'tank', 'jacket', 'hoodie', 'stripes', 'suit', 'tee']);
  const hair = pick(dress || r() < .4 ? ['long', 'bun', 'ponytail', 'bangs', 'long', 'afro', 'short'] : ['short', 'buzz', 'sidepart', 'afro', 'bald', 'mohawk', 'short', 'sidepart']);
  return {civ:0, skin:pick(SKINS), body:pick(TOPC), body2:pick(TOPC), pants:pick(PANTC), shorts:!dress && r() < .25, top, hair, hairCol:pick(HAIRC),
    face:!dress && !['long', 'bun', 'ponytail', 'bangs'].includes(hair) && r() < .4 ? pick(['beard', 'mustache', 'goatee', 'beard']) : null,
    acc:pick([null, null, 'sunglasses', 'glasses', 'cap', 'bucket', 'necklace', 'sunglasses', null]), shoe:pick([0x2a1d12, 0xf4f4f4, 0x1e1e22, 0xd9443a, 0x8a5a2b]),
    bw:.9 + r()*.28, belly:r() < .15};
}
const CHAR_MAT = new THREE.MeshStandardMaterial({vertexColors:true, roughness:.66});
const CHAR_METAL = new THREE.MeshStandardMaterial({vertexColors:true, metalness:.6, roughness:.35});
const CHAR_GEO = {};
function mergeParts(grp) {
  const buckets = [[], []];
  for (const m of grp.children) if (m.isMesh && !m.material.isMeshBasicMaterial) buckets[m.material.metalness > .3 ? 1 : 0].push(m);
  return buckets.map(list => {
    if (!list.length) return null;
    const pos = [], nor = [], col = [];
    for (const m of list) {
      m.updateMatrix();
      const geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); geo.applyMatrix4(m.matrix);
      const c = m.material.color, p = geo.attributes.position, n = geo.attributes.normal;
      for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); col.push(c.r, c.g, c.b); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeBoundingSphere(); return g;
  });
}
const shade = (c, k) => new THREE.Color(c).multiplyScalar(k).getHex();
function buildBody(o, P) {
  const {g, legL, legR, armL, armR} = P, skin = o.skin || 0xf1c9a5, top = o.body, pants = o.pants || 0x3b3b4a, bw = o.bw || 1;
  const hairC = o.hairCol ?? 0x2a1a10, shoe = o.shoe ?? 0x2a1d12, dark = shade(skin, .8);
  // legs and shoes
  for (const leg of [legL, legR]) {
    if (o.top === 'dress') mesh(G2.cyl, skin, [.06, .44, .065], [0, -.24, 0], leg);
    else if (o.shorts) { mesh(PART.rbox || G.box, pants, [.19, .24, .21], [0, -.08, 0], leg); mesh(G2.cyl, skin, [.065, .28, .07], [0, -.32, 0], leg); }
    else mesh(PART.limb || G.box, pants, [.19, .5, .21], [0, -.22, 0], leg);
    mesh(PART.shoe || G.box, shoe, [.19, .13, .31], [0, -.465, .05], leg); mesh(G.box, shade(shoe, .6), [.18, .03, .28], [0, -.505, .04], leg);
  }
  // hips, torso and the clothes on it
  if (o.top === 'dress') mesh(G2.flare, top, [.32*bw, .55, .27], [0, .52, 0], g);
  else { mesh(PART.rbox || G.box, pants, [.38*bw, .2, .25], [0, .58, 0], g); mesh(G.box, 0x2a1d12, [.37*bw, .04, .24], [0, .65, 0], g); }
  mesh(G2.cap, top, [.95*bw, .78, .74], [0, .98, 0], g, o.metal ? {metalness:.6, roughness:.35} : undefined);
  if (o.belly) mesh(G2.sph, top, [.24*bw, .2, .16], [0, .86, .1], g);
  const front = .225;
  if (o.top === 'stripes') for (const y of [.8, .94, 1.08]) mesh(G2.cyl, o.body2, [.29*bw, .045, .225], [0, y, 0], g);
  if (o.top === 'hawaii') { let k = 0; for (const [x, y] of [[-.12, .82], [.1, .9], [-.05, 1.05], [.13, 1.12], [-.15, 1.15], [.02, .75]]) { mesh(G2.sphS, k++ % 2 ? o.body2 : 0xf4ecd8, [.05, .045, .02], [x*bw, y, front], g); mesh(G2.sphS, o.body2, [.045, .04, .02], [x*bw, y, -front], g); } }
  if (o.top === 'jacket' || o.top === 'suit') {
    const jc = o.top === 'suit' ? 0x1e1e26 : o.body2;
    mesh(G2.cap, jc, [1*bw, .8, .78], [0, .98, -.01], g);
    mesh(G.box, o.top === 'suit' ? 0xf4f4f4 : top, [.13, .42, .02], [0, 1, front + .03], g);
    if (o.top === 'suit') mesh(G.box, 0xb8322a, [.04, .3, .015], [0, .98, front + .045], g);
  }
  if (o.top === 'hoodie') { mesh(G2.sph, top, [.2, .14, .12], [0, 1.28, -.16], g); mesh(G.box, shade(top, .8), [.22, .12, .02], [0, .82, front + .01], g); }
  if (o.top === 'tank') mesh(G.box, shade(top, .85), [.3*bw, .03, .02], [0, 1.18, front], g);
  if (o.top === 'shirt') { mesh(G.box, shade(top, .85), [.025, .45, .015], [0, .98, front + .01], g); for (const y of [.86, .98, 1.1]) mesh(G2.sphS, 0xf4f4f4, [.015, .015, .01], [0, y, front + .02], g); }
  if (o.apron) mesh(G.box, o.apron, [.42, .5, .05], [0, .9, .25], g);
  if (o.trim) mesh(G2.cyl, o.trim, [.33*bw, .1, .29], [0, .62, 0], g);
  if (o.acc === 'necklace') { const n = mesh(G2.ring, 0xf2c200, [.11, .11, .11], [0, 1.22, .1], g, {metalness:.8, roughness:.25}); n.rotation.x = Math.PI/2.4; }
  mesh(G2.cyl, skin, [.085, .14, .085], [0, 1.33, 0], g);
  // arms: sleeves, forearms and hands
  const bare = o.top === 'tank' || o.top === 'dress', long = ['hoodie', 'jacket', 'suit'].includes(o.top) || o.long;
  const sleeve = o.top === 'jacket' ? o.body2 : o.top === 'suit' ? 0x1e1e26 : top;
  for (const arm of [armL, armR]) {
    mesh(PART.limb || G.box, bare ? skin : sleeve, [.15, .3, .16], [0, -.1, 0], arm);
    mesh(PART.limb || G.box, long ? sleeve : skin, [.125, .27, .135], [0, -.33, 0], arm);
    mesh(PART.hand || G2.sphS, skin, PART.hand ? [.12, .16, .1] : [.07, .075, .07], [0, -.49, 0], arm);
  }
  if (o.hat === 'hood') { mesh(G2.sph, o.hatCol || top, [.29, .3, .29], [0, 1.64, -.05], g); }
  // the head: skull, jaw, ears, nose, eyes with whites, brows and a mouth
  const hy = o.hero ? .04 : 0, hs = o.hero ? 1.14 : 1, H = (x, y, z) => [x*hs, 1.58 + hy + (y - 1.58)*hs, z*hs];
  mesh(G2.sph, skin, [.235*hs, .25*hs, .24*hs], H(0, 1.6, 0), g);
  mesh(G2.sph, skin, [.19*hs, .13*hs, .19*hs], H(0, 1.48, .03), g);
  for (const sx of [-1, 1]) mesh(G2.sphS, dark, [.04*hs, .06*hs, .03*hs], H(sx*.235, 1.58, 0), g);
  mesh(G.box, shade(skin, .9), [.05*hs, .075*hs, .07*hs], H(0, 1.55, .22), g);
  for (const sx of [-1, 1]) {
    mesh(G2.sphS, 0xffffff, [.05*hs, .042*hs, .02*hs], H(sx*.085, 1.61, .205), g);
    mesh(G2.sphS, o.hero ? 0x2a4a7a : 0x2a1a10, [.028*hs, .032*hs, .015*hs], H(sx*.085, 1.61, .222), g);
    mesh(G.box, o.hero ? 0x4a2a14 : hairC, [.085*hs, .02*hs, .02*hs], H(sx*.09, 1.675, .21), g).rotation.z = -sx*.12;
  }
  mesh(G.box, o.hero ? 0x9a3a2a : 0x8a3a2a, [.085*hs, .022*hs, .015*hs], H(0, 1.47, .2), g);
  if (o.hero) for (const sx of [-1, 1]) mesh(G2.sphS, 0xff9a8a, [.045, .028, .02], H(sx*.15, 1.52, .17), g);
  // hair
  const hc = hairC, st = o.hair ?? 'short';
  if (st && st !== 'bald' && st !== 'afro' && st !== 'mohawk') mesh(G2.sph, hc, [.25, st === 'buzz' ? .17 : .2, .255], [0, 1.67, -.03], g);
  if (st === 'long') { mesh(G.box, hc, [.44, .44, .14], [0, 1.44, -.13], g); for (const sx of [-1, 1]) mesh(G.box, hc, [.06, .32, .16], [sx*.22, 1.5, -.02], g); }
  if (st === 'bun') mesh(G2.sph, hc, [.11, .1, .11], [0, 1.88, -.12], g);
  if (st === 'ponytail') { const p = mesh(G.box, hc, [.08, .32, .08], [0, 1.5, -.27], g); p.rotation.x = .3; }
  if (st === 'afro') mesh(G2.sph, hc, [.34, .31, .34], [0, 1.72, -.03], g);
  if (st === 'mohawk') mesh(G.box, hc, [.06, .14, .42], [0, 1.83, -.02], g);
  if (st === 'sidepart') mesh(G.box, hc, [.22, .07, .14], [.06, 1.79, .1], g).rotation.z = -.25;
  if (st === 'bangs') mesh(G.box, hc, [.42, .08, .1], [0, 1.72, .17], g);
  if (o.face === 'beard') { mesh(G2.sph, hc, [.2, .12, .19], [0, 1.44, .05], g); mesh(G.box, hc, [.13, .03, .03], [0, 1.505, .215], g); }
  if (o.face === 'mustache') mesh(G.box, hc, [.13, .03, .03], [0, 1.505, .218], g);
  if (o.face === 'goatee') { mesh(G.box, hc, [.07, .08, .05], [0, 1.43, .2], g); mesh(G.box, hc, [.12, .025, .03], [0, 1.505, .215], g); }
  if (o.acc === 'sunglasses') { for (const sx of [-1, 1]) mesh(G.box, 0x111114, [.09, .055, .02], [sx*.085, 1.61, .232], g); mesh(G.box, 0x111114, [.06, .015, .015], [0, 1.625, .232], g); }
  if (o.acc === 'glasses') { for (const sx of [-1, 1]) { mesh(G.box, 0x2a2a2e, [.09, .012, .012], [sx*.085, 1.64, .232], g); mesh(G.box, 0x2a2a2e, [.09, .012, .012], [sx*.085, 1.58, .232], g); } mesh(G.box, 0x2a2a2e, [.27, .012, .012], [0, 1.635, .2], g); }
  if (o.acc === 'cap') { mesh(G2.sph, o.body2, [.26, .16, .26], [0, 1.73, -.01], g); mesh(G.box, o.body2, [.26, .025, .18], [0, 1.73, .24], g); }
  if (o.acc === 'bucket') { mesh(G2.flare, o.body2, [.27, .16, .27], [0, 1.8, 0], g); mesh(G2.cyl, o.body2, [.34, .02, .34], [0, 1.73, 0], g); }
  if (o.acc === 'earrings') for (const sx of [-1, 1]) mesh(G2.sphS, 0xf2c200, [.025, .025, .025], [sx*.235, 1.5, .02], g, {metalness:.8});
}

// soft contact shadows: a dark blur under people, and around the foot of every building and tree
const BLOB = (() => {
  const tex = (rect) => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    if (rect) { g.filter = 'blur(7px)'; g.fillStyle = '#fff'; g.fillRect(12, 12, 40, 40); }
    else { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.55, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }
    return new THREE.CanvasTexture(c);
  };
  const m = o => new THREE.MeshBasicMaterial({color:0x000000, transparent:true, depthWrite:false, ...o});
  return {mat:m({map:tex(false), opacity:.34}), rect:m({map:tex(true), opacity:.3}), round:m({map:tex(false), opacity:.32})};
})();
function makeHero(o) {
  const i = Math.max(0, Math.min(5, o.stage || 0)), part = n => MODELS.hero.getObjectByName(`hero${i}_${n}`);
  const g = new THREE.Group(), c = {g, bob:0};
  const legL = new THREE.Group(), legR = new THREE.Group(), armL = new THREE.Group(), armR = new THREE.Group();
  legL.position.set(-.12, 1.0, 0); legR.position.set(.12, 1.0, 0); armL.position.set(-.25, 1.64, 0); armR.position.set(.25, 1.64, 0);
  g.add(legL, legR, armL, armR);
  for (const [n, p] of [['body', g], ['legL', legL], ['legR', legR], ['armL', armL], ['armR', armR]]) {
    const src = part(n); if (!src) continue;
    const m = src.clone(true); m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); m.scale.set(1, 1, 1);
    m.traverse(q => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); p.add(m);
  }
  c.crown = new THREE.Group(); c.crown.position.y = 2.1; g.add(c.crown); c.crown.visible = !!o.crown; c.wantCrown = !!o.crown;
  mesh(G.cyl, 0xf2c200, [.15, .1, .15], [0, 0, 0], c.crown, {metalness:.7, roughness:.3});
  for (let k = 0; k < 5; k++) { const a = k/5*Math.PI*2; mesh(G.cone, 0xf2c200, [.035, .1, .035], [Math.cos(a)*.12, .1, Math.sin(a)*.12], c.crown, {metalness:.7, roughness:.3}); }
  if (o.glow) { c.halo = new THREE.Mesh(new THREE.TorusGeometry(.22, .02, 6, 32), new THREE.MeshBasicMaterial({color:0x8fe8ff, toneMapped:false})); c.halo.rotation.x = Math.PI/2.2; c.halo.position.y = 2.32; g.add(c.halo); }
  // the fishing rod, held out over the water
  c.rod = new THREE.Group(); c.rod.position.set(.36, 1.2, .25); c.rod.rotation.x = .9; c.rod.visible = false; g.add(c.rod);
  mesh(G.cyl, 0x6b4526, [.028, 2.2, .028], [0, 1.1, 0], c.rod); mesh(G.cyl, 0x3a2a1a, [.05, .3, .05], [0, .15, 0], c.rod);
  const tip = new THREE.Group(); tip.position.y = 2.2; tip.rotation.x = -.9; c.rod.add(tip);
  const line = new THREE.Mesh(G.cyl, new THREE.MeshBasicMaterial({color:0xf4f4f4})); line.scale.set(.008, 2.35, .008); line.position.y = -1.18; tip.add(line);
  mesh(G.sph, 0xe03a2a, [.07, .07, .07], [0, -2.35, 0], tip); mesh(G.sph, 0xffffff, [.05, .04, .05], [0, -2.29, 0], tip);
  if (!MOBILE) { const sh = new THREE.Mesh(G.plane, BLOB.mat); sh.rotation.x = -Math.PI/2; sh.position.y = .035; sh.scale.set(.8, .8, 1); sh.renderOrder = 1; g.add(sh); }
  Object.assign(c, {legL, legR, armL, armR, real:true});
  scene.add(g);
  return c;
}
