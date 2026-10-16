// ------------------------------------------------------------------ the aquarium and the zoo, east of the railway
const ZOO = {fish:[], animals:[]};
function zooPark() {
  if (ZOO.park) return; ZOO.park = true;
  const P = ZOOPARK, cx = (P.x0 + P.x1)/2, cz = (P.z0 + P.z1)/2;
  clearForest({x0:P.x0 - 1, x1:P.x1 + 1, z0:P.z0 - 1, z1:P.z1 + 1}); clearForest({x0:87, x1:93, z0:3, z1:23});
  slab(0x8fb862, P.x1 - P.x0, P.z1 - P.z0, cx, cz, .004);
  slab(0xc9b48a, P.path.x1 - P.path.x0, P.path.z1 - P.path.z0, (P.path.x0 + P.path.x1)/2, (P.path.z0 + P.path.z1)/2, .008);
  slab(0xc9b48a, P.x1 - P.x0 - 2, 2.6, cx, 36, .009);    // the main walk across the park
  slab(0xc9b48a, 2.6, P.z1 - P.z0 - 2, 90, cz, .009);    // and the walk in from the gate
  // the gate: two pillars and a sign over the walk
  for (const sx of [-1, 1]) mesh(G.box, 0x6a4a2e, [.5, 3.4, .5], [90 + sx*1.8, 1.7, P.z0 + .2], scene);
  mesh(G.box, 0x6a4a2e, [4.2, .5, .4], [90, 3.5, P.z0 + .2], scene);
  const sign = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('ZOO & AQUARIUM', '#2f6a3a', '#ffffff'), toneMapped:false, side:THREE.DoubleSide})); sign.scale.set(3.8, .6, 1); sign.position.set(90, 3.5, P.z0 - .02); scene.add(sign);
  // a hedge round the park, open at the gate
  for (let x = P.x0; x <= P.x1; x += 1.6) { if (Math.abs(x - 90) > 2.4) mesh(G.box, 0x3f6a2e, [1.6, .9, .7], [x, .45, P.z0], scene); mesh(G.box, 0x3f6a2e, [1.6, .9, .7], [x, .45, P.z1], scene); }
  for (let z = P.z0; z <= P.z1; z += 1.6) for (const x of [P.x0, P.x1]) mesh(G.box, 0x3f6a2e, [.7, .9, 1.6], [x, .45, z], scene);
  for (const [x, z] of [[86, 34], [122, 34], [86, 48], [122, 24], [110, 48]]) { const t = model('treeD', 3.2, 'y') || null; if (t) { t.position.set(x, 0, z); scene.add(t); } }
}
function aquariumFx(anim) {
  zooPark();
  if (MODELS.aqua && aquariumTank(anim)) return;
  const g = new THREE.Group(); g.position.set(69, 0, 12.2); scene.add(g);
  mesh(G.box, 0xeef1f4, [3.8, 2.2, 2.6], [0, 1.1, 0], g);
  const tank = new THREE.Mesh(G.box, new THREE.MeshStandardMaterial({color:0x3a9ad0, transparent:true, opacity:.55, roughness:.05, metalness:.2})); tank.scale.set(3.2, 1.5, .5); tank.position.set(0, 1.05, 1.32); g.add(tank);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.2, 18, 10, 0, Math.PI*2, 0, Math.PI/2), mat(0x8fc6e8, {metalness:.4, roughness:.1, transparent:true, opacity:.8})); dome.position.y = 2.2; g.add(dome);
  const sign = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('AQUARIUM', '#1f5fb8', '#ffffff'), toneMapped:false})); sign.scale.set(2.2, .5, 1); sign.position.set(0, 2.05, 1.32); g.add(sign);
  for (let i = 0; i < 8; i++) { const f = itemMesh('fish', i % 3); f.scale.setScalar(.6); scene.remove(f); g.add(f); ZOO.fish.push({m:f, ph:R()*6, y:.6 + R()*.8}); }
  boxes.push({x0:67.1, x1:70.9, z0:10.9, z1:13.5}); AREAS.push({x0:66.4, x1:76.4, z0:9.6, z1:14.8}, {x0:76, x1:78.6, z0:.35, z1:14.8}); clearForest({x0:75.5, x1:79.2, z0:0, z1:15.2}); slab(0xb98f5c, 2.4, 14.4, 77.3, 7.6, .01);
  fader(g, 3.8, 2.6); if (anim) popIn(g);
}
// the glass tank: reef, tunnel and water from the Blender kit, with swimmers on lazy loops
function aquariumTank(anim) {
  const tank = MODELS.aqua.getObjectByName('aquariumTank'), water = MODELS.aqua.getObjectByName('aquariumWater'); if (!tank || !water) return false;
  const g = new THREE.Group(); g.position.set(98, 0, 28.5); scene.add(g);
  const inner = new THREE.Group(); inner.scale.setScalar(12 / 9.6); g.add(inner);
  const t = tank.clone(true), w = water.clone(true); t.position.set(0, 0, 0); w.position.set(0, 0, 0); inner.add(t, w);
  // the water and the tunnel glass are see-through
  w.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshStandardMaterial({color:0x2a90c8, transparent:true, opacity:.3, roughness:.05, metalness:.1, depthWrite:false}); o.renderOrder = 2; o.castShadow = false; } });
  t.traverse(o => { if (!o.isMesh) return; o.castShadow = true; o.receiveShadow = true;
    const ms = [].concat(o.material).map(m => /tunnelGlass/.test(m.name) ? Object.assign(m.clone(), {transparent:true, opacity:.3, depthWrite:false}) : m); o.material = Array.isArray(o.material) ? ms : ms[0]; });
  const add = (name, n, rx, rz, y0, sp) => { const src = MODELS.aqua.getObjectByName(name); if (!src) return;
    for (let i = 0; i < n; i++) { const m = src.clone(true); inner.add(m); const tail = m.children.find(c => /_tail/.test(c.name));
      ZOO.fish.push({m, tail, mdl:true, ph:i/n*Math.PI*2 + R()*.3, rx:rx*(.85 + R()*.3), rz:rz*(.8 + R()*.3), y:y0 + R()*.6, sp:sp*(.85 + R()*.3), dir:i % 2 ? 1 : -1}); } };
  add('sharkFish', 2, 3.2, 1.9, 2.2, .22); add('clownFish', 12, 3.6, 2.2, 1.0, .45); add('tangFish', 12, 3.4, 2.0, 2.6, .4);
  boxes.push({x0:92, x1:104, z0:23.5, z1:33.4}); AREAS.push({x0:66.4, x1:76.4, z0:9.6, z1:14.8}, {x0:76, x1:78.6, z0:.35, z1:14.8}); clearForest({x0:75.5, x1:79.2, z0:0, z1:15.2}); slab(0xb98f5c, 2.4, 14.4, 77.3, 7.6, .01);
  { const sg = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('AQUARIUM', '#1f5fb8', '#ffffff'), toneMapped:false})); sg.scale.set(3.6, .8, 1); sg.position.set(98, 5.6, 34.1); sg.rotation.y = Math.PI; scene.add(sg); }
  if (anim) popIn(g);
  return true;
}
const ZOO_ANIMALS = [['🐘', 0x9aa0a8, 1.4], ['🦒', 0xe0b050, 1], ['🦁', 0xd9a050, .8], ['🐧', 0x1e1e22, .45], ['🐻', 0x6a4426, .9], ['🦓', 0xf4f4f4, .9], ['🐼', 0xf4f4f4, .8], ['🐯', 0xe0802a, .8]];
const ZOO_KIND = {'🐘':'elephant', '🦒':'giraffe', '🦁':'lion', '🐧':'penguin', '🐻':'bear', '🦓':'zebra', '🐼':'panda', '🐯':'tiger'};
const PENS = [[108, 27, 'savanna'], [116, 27, 'savanna'], [108, 44, 'savanna'], [116, 44, 'ice'], [100, 44, 'bamboo'], [92.5, 44, 'forest'], [124, 27, 'savanna'], [86.5, 27, 'jungle']];
const PEN_ORDER = [0, 1, 2, 3, 5, 6, 4, 7];   // elephant, giraffe, lion (savanna), penguin (ice), bear (forest), zebra (savanna), panda (bamboo), tiger (jungle)   // which pen each zoo animal gets, in the order they arrive
function zooFx(anim) {
  zooPark();
  const g = new THREE.Group(); scene.add(g); ZOO.g = g; ZOO.pens = [];
  const looks = {savanna:[0xd8c088, 0xb89a5a], ice:[0xeef4f8, 0x9ac8e0], bamboo:[0x7aa05a, 0x4a7a3a], forest:[0x6a8a4a, 0x4a3a2a], jungle:[0x4a8a3a, 0x2a5a2a]};
  PENS.forEach(([x, z, kind], i) => {
    if (kind === 'none') return;
    const w = 6.6, d = 6.4, [ground, deco] = looks[kind];
    ZOO.pens[i] = {x, z, w, d};
    slab(ground, w, d, x, z, .02);
    // a low wooden fence with posts
    for (let k = 0; k <= 10; k++) for (const sz of [-1, 1]) mesh(G.box, 0x6b4526, [.08, .8, .08], [x - w/2 + k*w/10, .4, z + sz*d/2], g);
    for (let k = 0; k <= 10; k++) for (const sx of [-1, 1]) mesh(G.box, 0x6b4526, [.08, .8, .08], [x + sx*w/2, .4, z - d/2 + k*d/10], g);
    for (const sz of [-1, 1]) mesh(G.box, 0x7a5232, [w, .06, .06], [x, .7, z + sz*d/2], g);
    for (const sx of [-1, 1]) mesh(G.box, 0x7a5232, [.06, .06, d], [x + sx*w/2, .7, z], g);
    boxes.push({x0:x - w/2 - .1, x1:x + w/2 + .1, z0:z - d/2 - .1, z1:z + d/2 + .1});
    // the habitat
    if (kind === 'savanna') { const t = mesh(G.cyl, 0x5e3f22, [.12, 1.6, .12], [x + 2, .8, z - 1.6], g); mesh(G.cyl, 0x6a8a3a, [1.2, .25, 1.2], [x + 2, 1.7, z - 1.6], g); mesh(G.ico, 0x9a8a72, [.6, .4, .5], [x - 2, .2, z + 1.8], g); }
    if (kind === 'ice') { const pool = mesh(G.cyl, 0x4aa0d0, [1.6, .05, 1.2], [x + 1, .05, z + 1], g); pool.material = new THREE.MeshStandardMaterial({color:0x4aa0d0, roughness:.1}); for (const [dx, dz] of [[-2, -1.8], [-1.2, 2]]) mesh(G.ico, 0xf4f8fa, [.8, .6, .7], [x + dx, .3, z + dz], g); }
    if (kind === 'bamboo') for (let k = 0; k < 9; k++) mesh(G.cyl, 0x7ab05a, [.05, 2.2 + (k % 3)*.4, .05], [x - 2.6 + (k % 3)*.3, 1.1, z - 2.4 + Math.floor(k / 3)*.4], g);
    if (kind === 'forest') { for (const [dx, dz] of [[-2, -2], [2.2, 1.8]]) { mesh(G.cyl, 0x4a3420, [.15, 1.8, .15], [x + dx, .9, z + dz], g); mesh(G.cone, 0x2f5a2a, [.9, 1.8, .9], [x + dx, 2.4, z + dz], g); } mesh(G.ico, 0x7a7a72, [.9, .7, .8], [x, .35, z - 2.2], g); }
    if (kind === 'jungle') { for (const [dx, dz] of [[-2.2, -2], [2.2, -2], [0, 2.2]]) { const p = model('palm', 3.2, 'y'); if (p) { p.position.set(x + dx, 0, z + dz); g.add(p); } } const pool = mesh(G.cyl, 0x3a8ab0, [1.2, .05, .9], [x + 1, .05, z + .6], g); pool.material = new THREE.MeshStandardMaterial({color:0x3a8ab0, roughness:.1}); }
  });
  if (false) for (let i = 0; i < 2; i++) { const x = 72.6 + i*2.4; for (let k = 0; k < 7; k++) mesh(G.box, 0x6b4526, [.06, .7, .06], [x - 1 + k*.33, .35, 10.4], g); for (let k = 0; k < 7; k++) mesh(G.box, 0x6b4526, [.06, .7, .06], [x - 1 + k*.33, .35, 13.8], g); mesh(G.box, 0x6b4526, [2, .05, .05], [x, .6, 10.4], g); mesh(G.box, 0x6b4526, [2, .05, .05], [x, .6, 13.8], g); }

  if (anim) popIn(g);
  zooAnimals();
}
function zooAnimals() {
  if (!ZOO.g) return;
  while (ZOO.animals.length < Math.min(ZOO_ANIMALS.length, W.conquests + 1)) {
    const [icon, col, s] = ZOO_ANIMALS[ZOO.animals.length], kind = ZOO_KIND[icon], bst = beast(kind, BEAST_H[kind] * .8);
    const pen = ZOO.pens && ZOO.pens[PEN_ORDER[ZOO.animals.length]];
    if (bst) { ZOO.g.add(bst); const x = pen ? pen.x : 108, z = pen ? pen.z : 27; bst.position.set(x, 0, z); ZOO.animals.push({g:bst, x, z, pen, t:0, tx:x, tz:z, ph:R()*6}); continue; }
    const a = new THREE.Group(); a.scale.setScalar(s); ZOO.g.add(a);
    mesh(G.box, col, [.45, .4, .8], [0, .45, 0], a); mesh(G.box, col, [.3, .3, .3], [0, icon === '🦒' ? 1.3 : .7, .45], a);
    if (icon === '🦒') mesh(G.box, col, [.12, .8, .12], [0, .9, .35], a);
    if (icon === '🐘') { mesh(G.box, col, [.1, .45, .1], [0, .5, .65], a); for (const x of [-.22, .22]) mesh(G.box, col, [.05, .3, .25], [x, .7, .35], a); }
    for (const [x, z] of [[-.15, -.28], [.15, -.28], [-.15, .28], [.15, .28]]) mesh(G.box, col, [.09, .3, .09], [x, .15, z], a);
    { const x = pen ? pen.x : 108, z = pen ? pen.z : 27; a.position.set(x, 0, z); ZOO.animals.push({g:a, x, z, pen, t:0, tx:x, tz:z}); }
  }
}
let zooT = 25;
function updZoo(dt) {
  ZOO.fish.forEach((f, i) => {
    if (f.mdl) { const a = time*f.sp*f.dir + f.ph, x = Math.cos(a)*f.rx, z = Math.sin(a)*f.rz;
      f.m.position.set(x, f.y + Math.sin(time*.8 + f.ph)*.15, z); f.m.rotation.y = Math.atan2(-Math.sin(a)*f.dir, Math.cos(a)*f.dir);
      if (f.tail) f.tail.rotation.y = Math.sin(time*(f.rx > 3.3 ? 4 : 11) + f.ph)*.45; return; }
    const a = time*.6 + f.ph; f.m.position.set(Math.sin(a)*1.4, f.y + Math.sin(a*2)*.1, 1.32); f.m.rotation.y = Math.cos(a) > 0 ? Math.PI/2 : -Math.PI/2; });
  zooAnimals();
  for (const a of ZOO.animals) { if ((a.t -= dt) <= 0) { a.t = 2 + R()*3; const pw = a.pen ? a.pen.w/2 - .9 : .7, pd = a.pen ? a.pen.d/2 - .9 : 1.1; a.tx = a.x + (R()*2 - 1)*pw; a.tz = a.z + (R()*2 - 1)*pd; } const p = a.g.position, dx = a.tx - p.x, dz = a.tz - p.z, d = Math.hypot(dx, dz); if (d > .05) { p.x += dx/d*Math.min(d, .5*dt); p.z += dz/d*Math.min(d, .5*dt); a.g.rotation.y = Math.atan2(dx, dz); } if (a.g.userData.legs) { a.ph = (a.ph || 0) + dt*(d > .05 ? 6 : 0); stride(a.g, a.ph, d > .05 ? .4 : 0); } }
  if (!started || (zooT -= dt) > 0) return; zooT = 25;
  const aq = W.unlocked.has('aquarium') ? 200 + Math.min(3000, W.caught*2) : 0, zoo = W.unlocked.has('zoo') ? ZOO.animals.length*(250 + 40*W.era) : 0, pay = aq + zoo;
  if (pay) { W.coins += pay; W.earned += pay; popText(`🐠 +${pay} visitors`, new THREE.Vector3(90, 4, 24), '#ffe06b'); }
}

