// ------------------------------------------------------------------ the coast: the river runs into the sea, with a fort or a town on every beach
const COAST = {z:-77.6, sites:{
  cove:{x:4, n:'Pirate cove'}, empire:{x:-37, n:'The old empire'}, azul:{x:32, n:'Port Azul'}, kumo:{x:52, n:'Kumo'}}, forts:{}, cur:null, fleets:[]};
clearForest({x0:-95, x1:130, z0:-118, z1:-75});
{
  const sea = ground(0x2fb0e2, 3000, 1408, 0, -784, -.2); sea.material = water.material; self.SEA_MESH = sea;
  self.SEA_MORE = [ground(0x2fb0e2, 3000, 1270, 0, WORLD.cz1 + 635, -.2), ground(0x2fb0e2, 1170, WORLD.cz1 + 92, WORLD.cx1 + 585, (WORLD.cz1 - 92)/2, -.2), ground(0x2fb0e2, 1170, WORLD.cz1 + 92, WORLD.cx0 - 585, (WORLD.cz1 - 92)/2, -.2)];
  for (const m of self.SEA_MORE) m.material = water.material;
  ground(0xe8d49a, WORLD.cx1 - WORLD.cx0, 4.6, (WORLD.cx0 + WORLD.cx1)/2, -78.1, -.215);
  for (const sx of [-1, 1]) ground(0xe8d49a, 8, WORLD.cz1 + 92, sx > 0 ? WORLD.cx1 - 4 : WORLD.cx0 + 4, (WORLD.cz1 - 92)/2, -.215);
  ground(0xe8d49a, WORLD.cx1 - WORLD.cx0, 5, (WORLD.cx0 + WORLD.cx1)/2, WORLD.cz1 - 2.5, -.215);
  for (const I of WORLD.islands) for (const dx of [0, I.x > 0 ? -WORLD.w : WORLD.w]) {
    const sand = new THREE.Mesh(new THREE.CircleGeometry(I.r + 4, 48), new THREE.MeshStandardMaterial({color:0xe8d49a, roughness:1}));
    phDress(sand.material, 0xe8d49a, (I.r + 4)*2, (I.r + 4)*2, 'coast_sand_01', 5); sand.rotation.x = -Math.PI/2; sand.position.set(I.x + dx, -.17, I.z); sand.receiveShadow = true; scene.add(sand);
    const turf = new THREE.Mesh(new THREE.CircleGeometry(I.r - 1, 48), new THREE.MeshStandardMaterial({color:0x557133, roughness:1}));
    phDress(turf.material, 0x557133, I.r*2, I.r*2, 'aerial_grass_rock', 8, .45); turf.rotation.x = -Math.PI/2; turf.position.set(I.x + dx, -.14, I.z); turf.receiveShadow = true; scene.add(turf);
    for (let k = 0; k < 9; k++) { const a = k/9*Math.PI*2 + .3, p = model('palm', 3.6 + (k % 3)*.6, 'y'); if (p) { p.position.set(I.x + dx + Math.cos(a)*(I.r - 3), -.14, I.z + Math.sin(a)*(I.r - 3)); p.rotation.y = a*2; scene.add(p); } }
  }
  const foam = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.5})); foam.rotation.x = -Math.PI/2; foam.scale.set(320, .35, 1); foam.position.set(0, -.19, -80.5); scene.add(foam); COAST.foam = foam;
  for (let i = 0; i < 26; i++) { const r = mesh(G.ico, 0x8a8478, [.5 + R()*.6, .3 + R()*.3, .5 + R()*.5], [-150 + i*11.6 + R()*2, -.1, -88.4 - R()*.6], scene); r.rotation.y = R()*3; }
}
function coastFort(id) {
  if (COAST.forts[id]) return COAST.forts[id];
  const S = COAST.sites[id], ours = !!(W.flags.coast || {})[id], g = new THREE.Group(); g.position.set(S.x, 0, COAST.z); scene.add(g);
  const P = (geo, c, s, p, o) => mesh(geo, c, s, p, g, o), towers = [], guns = [];
  const gun = (x, z) => { const t = new THREE.Group(); t.position.set(x, 1.25, z); g.add(t); mesh(G.cyl, 0x2a2a2e, [.13, .9, .13], [0, 0, -.35], t, {metalness:.6}).rotation.x = Math.PI/2; guns.push(t); };
  if (id === 'cove') {
    // a pirate stockade on the sand: log walls, two lookouts and the shacks behind
    for (let x = -4; x <= 4; x += .42) { const h = 1.6 + Math.sin(x*5)*.15; P(G.cyl, 0x7a5232, [.17, h, .17], [x, h/2, -1.6]); P(G.cone, 0x6a4428, [.17, .3, .17], [x, h + .15, -1.6]); }
    for (const x of [-4.2, 4.2]) { const t = new THREE.Group(); t.position.set(x, 0, -1.4); g.add(t); for (const [a, b] of [[-.45, -.45], [.45, -.45], [-.45, .45], [.45, .45]]) mesh(G.box, 0x6b4526, [.14, 3, .14], [a, 1.5, b], t); mesh(G.box, 0x8a5a2b, [1.3, .16, 1.3], [0, 3, 0], t); mesh(G.cone4, 0x4a3a2a, [1.3, .8, 1.3], [0, 3.6, 0], t).rotation.y = Math.PI/4; towers.push(t); }
    for (const [x, c] of [[-2.4, 0x8a6a4a], [0, 0x7a5a3a], [2.4, 0x9a7a5a]]) { P(G.box, c, [1.7, 1.2, 1.4], [x, .6, .9]); P(G.cone4, 0x5a3a22, [1.5, .7, 1.3], [x, 1.55, .9]).rotation.y = Math.PI/4; }
    gun(-1.5, -1.9); gun(1.5, -1.9);
  } else if (id === 'empire') {
    // an old stone sea fort with round towers
    for (const [a, b, w, d] of [[0, -1.8, 8, .6], [-4, 0, .6, 3.6], [4, 0, .6, 3.6]]) P(G.box, 0x9a958c, [w, 2, d], [a, 1, b]);
    for (let x = -3.8; x <= 3.8; x += .55) P(G.box, 0x9a958c, [.3, .3, .62], [x, 2.15, -1.8]);
    for (const x of [-4, 4, 0]) { const t = new THREE.Group(); t.position.set(x, 0, x ? -1.8 : .8); g.add(t); mesh(G.cyl, 0x8a857c, [.9, 3.2, .9], [0, 1.6, 0], t); mesh(G.cone, 0x7a2a22, [1.1, 1.3, 1.1], [0, 3.85, 0], t); towers.push(t); }
    P(G.box, 0x7a756c, [3, 2.6, 2], [0, 1.3, 1.2]);
    gun(-2.4, -2.2); gun(0, -2.2); gun(2.4, -2.2);
  } else if (id === 'azul') {
    // a white and blue harbour town behind a sea wall, with a lighthouse
    P(G.box, 0xb8b2a6, [9, 1, .6], [0, .5, -1.9]);
    [0x3f7cc0, 0xf4f4f4, 0xf2c200, 0xf4f4f4, 0x3f7cc0, 0xe0a070].forEach((c, i) => { const x = -3.6 + i*1.45, h = 1.3 + (i % 3)*.5; P(G.box, 0xf4f0e6, [1.3, h, 1.3], [x, h/2, .3 + (i % 2)*.5]); P(G.box, c, [1.32, .25, 1.32], [x, h + .12, .3 + (i % 2)*.5]); });
    const lh = new THREE.Group(); lh.position.set(4.6, 0, -1.4); g.add(lh); mesh(G.cyl, 0xf4f4f4, [.45, 4, .45], [0, 2, 0], lh); mesh(G.cyl, 0xd9443a, [.47, .5, .47], [0, 2.8, 0], lh); bulb(lh, 0, 4.25, 0, 0xfff2a0, .14); towers.push(lh);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(.8, 14, 8, 0, Math.PI*2, 0, Math.PI/2), mat(0x3f7cc0)); dome.position.set(-.8, 2.4, 1.6); g.add(dome); P(G.box, 0xf4f0e6, [1.8, 2.4, 1.8], [-.8, 1.2, 1.6]);
    const t2 = new THREE.Group(); t2.position.set(-4.6, 0, -1.6); g.add(t2); mesh(G.cyl, 0xb8b2a6, [.6, 2.4, .6], [0, 1.2, 0], t2); towers.push(t2);
    gun(-2.5, -2.2); gun(0, -2.2); gun(2.5, -2.2);
  } else {
    // Kumo: a pagoda castle on a stone base
    P(G.box, 0x8a857c, [7, 1.2, 3.6], [0, .6, 0]);
    for (const [x, s] of [[0, 1], [-2.6, .6], [2.6, .6]]) { const t = new THREE.Group(); t.position.set(x, 1.2, .2); g.add(t); for (let k = 0; k < (s === 1 ? 4 : 2); k++) { mesh(G.box, 0xf4f0e6, [1.6*s - k*.25, .7, 1.4*s - k*.2], [0, .35 + k*.9, 0], t); mesh(G.cone4, 0x2a4a3a, [2.2*s - k*.3, .45, 2*s - k*.3], [0, .85 + k*.9, 0], t).rotation.y = Math.PI/4; } towers.push(t); }
    gun(-2, -1.9); gun(2, -1.9);
  }
  P(G.cyl, 0x3a2a1a, [.05, 2.4, .05], [0, 3.6, -.4]);
  const flag = P(G.box, ours ? 0xf2c200 : 0x9a1a1a, [.9, .5, .03], [.47, 4.5, -.4]);
  const f = COAST.forts[id] = {g, towers, guns, flag, hp:20, max:20, id};
  return f;
}
for (const id of Object.keys(COAST.sites)) coastFort(id);
function broadside(from, to, hit, onHit) {
  const dir = to.clone().sub(from).setY(0).normalize(), muzzle = from.clone().addScaledVector(dir, .9).setY(from.y + .9);
  particle(0xffb040, muzzle, new THREE.Vector3(0, .5, 0), .14, .4);
  particle(0xa8a8a8, muzzle, new THREE.Vector3((R() - .5), .8, 0), 1.4, .3, {grow:.9, op:.55});
  const tgt = hit ? to.clone() : to.clone().add(new THREE.Vector3((R() - .5)*5, -to.y - .2, (R() - .5)*4));
  const ball = new THREE.Mesh(G.sph, ballMat); ball.scale.setScalar(.13); ball.position.copy(muzzle); scene.add(ball);
  flyers.push({m:ball, from:muzzle, to:tgt, t:0, dur:.8, arc:2.4, done:() => {
    if (hit) { for (let i = 0; i < 9; i++) particle(i % 2 ? 0xff7a2a : 0x6a5a4a, tgt, new THREE.Vector3((R() - .5)*4, 2 + R()*3, (R() - .5)*4), .8, .16, {grav:1}); onHit?.(); if (watchingWar() || player.pos.distanceTo(tgt) < 14) shakeCam(.15); }
    else if (tgt.y < .2) splashAt(tgt.x, tgt.z);
  }});
  snd(70 + R()*40, .28, 'sawtooth', .045, .4);
}
// what lands where a shot comes down: a blast on a hit (and the hit itself), a splash in the water on a miss
function shotLands(tgt, hit, onHit, col = 0xff7a2a) {
  if (hit) { for (let i = 0; i < 9; i++) particle(i % 2 ? col : 0x6a5a4a, tgt, new THREE.Vector3((R() - .5)*4, 2 + R()*3, (R() - .5)*4), .8, .16, {grav:1}); onHit?.(); if (watchingWar() || player.pos.distanceTo(tgt) < 14) shakeCam(.15); }
  else if (tgt.y < .2) splashAt(tgt.x, tgt.z);
}
// Your warships fire the weapons of their age: the wooden galleon its cannonballs, ironclads fast flat explosive shells,
// dreadnoughts missiles that climb on a smoke trail and dive, and the carrier fleet laser beams that strike at once.
const BEAM_MAT = new THREE.MeshBasicMaterial({color:0x8ff8ff, transparent:true, opacity:.85, toneMapped:false, depthWrite:false, fog:false});
const BEAM_CORE = new THREE.MeshBasicMaterial({color:0xffffff, toneMapped:false, fog:false});
const MISSILE_MAT = new THREE.MeshBasicMaterial({color:0xffc070, toneMapped:false});
const SHELL_MAT = new THREE.MeshStandardMaterial({color:0x2a2a2e, metalness:.6, roughness:.4});
const UP3 = new THREE.Vector3(0, 1, 0);
function navyShot(from, to, hit, onHit) {
  const lv = navLvl();
  if (lv <= 1) return broadside(from, to, hit, onHit);
  const dir = to.clone().sub(from).setY(0).normalize(), muzzle = from.clone().addScaledVector(dir, .9).setY(from.y + 1.1);
  const tgt = hit ? to.clone() : to.clone().add(new THREE.Vector3((R() - .5)*5, -to.y - .2, (R() - .5)*4));
  if (lv >= 4) {
    // a laser: a beam with a white-hot core for a blink, a burst where it strikes
    const d = tgt.clone().sub(muzzle), len = d.length(), q = new THREE.Quaternion().setFromUnitVectors(UP3, d.clone().normalize()), mid = muzzle.clone().addScaledVector(d, .5);
    const beam = new THREE.Mesh(G.cyl, BEAM_MAT), core = new THREE.Mesh(G.cyl, BEAM_CORE);
    beam.scale.set(.09, len, .09); core.scale.set(.03, len, .03);
    for (const b of [beam, core]) { b.position.copy(mid); b.quaternion.copy(q); scene.add(b); }
    setTimeout(() => { scene.remove(beam); scene.remove(core); }, 140);
    particle(0x8ff8ff, muzzle, new THREE.Vector3(0, .3, 0), .18, .35);
    for (let i = 0; i < 4; i++) particle(0xbffcff, tgt, new THREE.Vector3((R() - .5)*2, 1 + R(), (R() - .5)*2), .35, .12);
    shotLands(tgt, hit, onHit, 0x8ff8ff);
    snd(1500, .16, 'sawtooth', .03, .25);
    return;
  }
  if (lv === 3) {
    // a missile: a glowing head that climbs high on a trail of smoke and dives onto the target
    const m = new THREE.Mesh(G.sph, MISSILE_MAT); m.scale.setScalar(.1); m.position.copy(muzzle); scene.add(m);
    particle(0xd8d8d8, muzzle, new THREE.Vector3(0, .6, 0), 1, .35, {grow:1.2, op:.5});
    flyers.push({m, from:muzzle, to:tgt, t:0, dur:1.15, arc:6, tick:f => { if (R() < .7) particle(0xe0e0e0, f.m.position.clone(), new THREE.Vector3((R() - .5)*.2, .15, (R() - .5)*.2), .9, .13, {grow:1.3, op:.5}); },
      done:() => shotLands(tgt, hit, onHit)});
    snd(220, .35, 'sawtooth', .03, 2.2);
    return;
  }
  // an explosive shell: a big muzzle flash and a fast, flat shot
  particle(0xffd070, muzzle, new THREE.Vector3(0, .5, 0), .14, .55); particle(0xb0b0b0, muzzle, new THREE.Vector3((R() - .5), .8, 0), 1.2, .38, {grow:.9, op:.55});
  const sh = new THREE.Mesh(G.sph, SHELL_MAT); sh.scale.setScalar(.1); sh.position.copy(muzzle); scene.add(sh);
  flyers.push({m:sh, from:muzzle, to:tgt, t:0, dur:.45, arc:.9, done:() => shotLands(tgt, hit, onHit, 0xffb040)});
  snd(55 + R()*30, .3, 'square', .045, .4);
}
function fortReset(f) { f.hp = f.max; f.towers.forEach(t => { t.rotation.z = 0; t.position.y = 0; }); }
// a fort takes the pounding: towers lean and sink, and fires break out
function fortHit(f) {
  f.hp = Math.max(0, f.hp - 1);
  const k = 1 - f.hp / f.max;
  f.towers.forEach((t, i) => { const lose = clamp(k*f.towers.length - i, 0, 1); t.rotation.z = lose*.35*(i % 2 ? 1 : -1); t.position.y = -lose*1.2; });
}

