// ------------------------------------------------------------------ footbridges over the railway, so nobody walks in front of a train
const XING = {h:2.7, list:[{zc:1.9, z0:.35, z1:3.45, sn:-.15, ss:3.95}, {zc:89.6, z0:88.95, z1:90.25, sn:88.6, ss:90.6}],
  foot:[{z0:5.0, z1:6.1}, {z0:87.15, z1:88.25}], built:false, blink:0};
const OV_H = 2.35, OVERPASS = [{x0:60.8, x1:62.4, x2:64.8, x3:66.4, z0:.15, z1:4.95}, {x0:60.8, x1:62.4, x2:64.8, x3:66.4, z0:88.9, z1:90.3}];
function elevAt(x, z) {
  if (railsG && x > 61.4 && x < 62.95 && Math.abs(z - RAIL.stop) < 4) return .36;   // the station platform
  if (x < -10.25 && x > -14.8 && z > .1 && z < 1.9) return .29;   // the fishing dock
  if (W.bridge && x > BR.x0 && x < BR.x1 && Math.abs(z - BR.z) < 1) return DECK[W.bridge];
  if (railsG) for (const f of XING.foot) if (z > f.z0 && z < f.z1 && x > 59.6 && x < 67.6)
    return x < 61.8 ? XING.h * (x - 59.6) / 2.2 : x > 65.4 ? XING.h * (67.6 - x) / 2.2 : XING.h;
  return 0;
}
function stripeTex() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 16; const g = c.getContext('2d');
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#111111' : '#f2c200'; g.beginPath(); g.moveTo(i*16, 0); g.lineTo(i*16 + 16, 0); g.lineTo(i*16 + 8, 16); g.lineTo(i*16 - 8, 16); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function diamondTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.translate(64, 64); g.rotate(Math.PI/4); g.fillStyle = '#111'; g.fillRect(-44, -44, 88, 88); g.fillStyle = '#f2c200'; g.fillRect(-39, -39, 78, 78); g.setTransform(1, 0, 0, 1, 0, 0);
  g.strokeStyle = '#111'; g.lineWidth = 9; g.beginPath(); g.moveTo(40, 40); g.lineTo(88, 88); g.moveTo(88, 40); g.lineTo(40, 88); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function levelCrossings(anim) {
  if (XING.built) return; XING.built = true;
  const g = new THREE.Group(); scene.add(g); XING.g = g; XING.posts = [];
  const STRIPE = new THREE.MeshStandardMaterial({map:stripeTex(), roughness:.6}), DIA = new THREE.MeshBasicMaterial({map:diamondTex(), transparent:true, side:THREE.DoubleSide, toneMapped:false});
  for (const X of XING.list) {
    // rubber crossing panels over the rails, flush with the road
    mesh(G.box, 0x2e3034, [3.2, .1, X.z1 - X.z0 - .1], [RAIL.x, .12, (X.z0 + X.z1)/2], g);
    for (const dx of [-.72, .72]) mesh(G.box, 0x8a8f96, [.08, .11, X.z1 - X.z0 - .1], [RAIL.x + dx, .13, (X.z0 + X.z1)/2], g, {metalness:.7});
    // a signal post on each approach (on the driver's right): crossbuck, warning diamond, two red lamps, a striped arm
    for (const [px, pz, side] of [[RAIL.x - 2.3, X.sn, -1], [RAIL.x + 2.3, X.ss, 1]]) {
      const p = new THREE.Group(); p.position.set(px, 0, pz); g.add(p);
      const pole = new THREE.Mesh(G.cyl, STRIPE); pole.scale.set(.07, 2.6, .07); pole.position.y = 1.3; p.add(pole);
      for (const a of [.6, -.6]) { const b = new THREE.Mesh(G.box, STRIPE); b.scale.set(1.15, .17, .03); b.position.set(0, 2.45, 0); b.rotation.z = a; b.rotation.y = Math.PI/2; p.add(b); }
      const dia = new THREE.Mesh(G.plane, DIA); dia.scale.set(.75, .75, 1); dia.position.set(-side*.06, 1.85, 0); dia.rotation.y = side > 0 ? Math.PI/2 : -Math.PI/2; p.add(dia);
      mesh(G.box, 0x111111, [.1, .3, .95], [0, 1.5, 0], p);
      const lamps = [-.32, .32].map(dz => { const l = new THREE.Mesh(G.sph, new THREE.MeshBasicMaterial({color:0x3a0a0a, toneMapped:false})); l.scale.setScalar(.12); l.position.set(-side*.08, 1.5, dz); p.add(l); return l; });
      const arm = new THREE.Group(); arm.position.set(0, .95, 0); p.add(arm);
      const bar = new THREE.Mesh(G.box, STRIPE); bar.scale.set(.08, .08, 2.9); bar.position.z = -side*1.55; bar.rotation.x = 0; arm.add(bar);
      mesh(G.box, 0x333333, [.22, .3, .3], [0, .95, 0], p);
      arm.rotation.x = side*1.45;   // raised
      XING.posts.push({p, lamps, arm, side, X});
      boxes.push({x0:px - .2, x1:px + .2, z0:pz - .2, z1:pz + .2});
    }
  }
  // the footbridges: stairs up, a fenced deck over the rails, stairs down
  for (const f of XING.foot) {
    const zc = (f.z0 + f.z1)/2, wz = f.z1 - f.z0, H = XING.h;
    mesh(G.box, 0xb8b2a6, [3.6, .18, wz], [63.6, H - .09, zc], g);
    for (const [a, b] of [[59.6, 61.8], [67.6, 65.4]]) for (let i = 0; i < 9; i++) { const h = H*(i + 1)/9; mesh(G.box, i % 2 ? 0xc9c4ba : 0xbdb8ae, [Math.abs(b - a)/9 + .01, .16, wz], [a + (b - a)*(i + .5)/9, h - .08, zc], g); }
    for (const x of [62.0, 65.2]) for (const z of [f.z0 + .15, f.z1 - .15]) mesh(G.box, 0x9a958c, [.2, H, .2], [x, H/2, z], g);
    for (const z of [f.z0 + .03, f.z1 - .03]) { mesh(G.box, 0x3a6a5a, [3.6, .05, .05], [63.6, H + .9, z], g, {metalness:.5}); for (let x = 61.9; x <= 65.4; x += .5) mesh(G.box, 0x3a6a5a, [.04, .9, .04], [x, H + .45, z], g, {metalness:.5}); }
    AREAS.push({x0:59.4, x1:67.8, z0:f.z0 - .3, z1:f.z1 + .3});
  }
  if (anim) popIn(g);
}
const onXing = (X, x, z) => x > RAIL.x - 2.1 && x < RAIL.x + 2.1 && z > X.z0 - .1 && z < X.z1 + .1;
function xingBusy(X) {
  // anyone on the crossing, or just stepping onto it
  if (onXing(X, player.pos.x, player.pos.z) && (player.rideY || 0) < 1.5 && !TRIP.on) return true;
  const at = q => q.pos || (q.c && q.c.g && q.c.g.position) || (q.char && q.char.g.position) || (q.g && q.g.position);
  for (const L of [movers, strollers, workers, soldiers, walkers]) for (const q of L) { const p = at(q); if (p && onXing(X, p.x, p.z)) return true; }
  return false;
}
function updCrossings(dt) {
  if (!railsG || !XING.built) { if (railsG && !XING.built) levelCrossings(false); return; }
  const T = railTrain, len = T ? T.lens.reduce((a, b) => a + b, 0) : 0;
  XING.blink += dt;
  for (const X of XING.list) {
    X.busy = xingBusy(X);
    // the bells and lights run from the moment a train is near until its last car is past
    let near = false;
    if (T) { const dir = T.dir || 1, head = T.z, tail = T.z - dir*len, lo = Math.min(head, tail) - (dir > 0 ? 6 : 26), hi = Math.max(head, tail) + (dir > 0 ? 26 : 6); near = X.zc > lo && X.zc < hi && (T.v !== 0 || T.held); }
    X.on = near;
  }
  for (const P of XING.posts) {
    const on = P.X.on, ph = Math.floor(XING.blink*2.2) % 2;
    P.lamps.forEach((l, i) => l.material.color.set(on && ph === i ? 0xff2a1a : 0x3a0a0a));
    const want = on ? 0 : P.side*1.45; P.arm.rotation.x += (want - P.arm.rotation.x)*Math.min(1, dt*2.5);
  }
  const X0 = XING.list.find(X => X.on && Math.hypot(player.pos.x - RAIL.x, player.pos.z - X.zc) < 14);
  if (X0 && (XING.bell = (XING.bell || 0) - dt) <= 0) { XING.bell = .9; snd(1400, .06, 'triangle', .02); }
}
// the train brakes for a crossing with people on it, and waits until it is clear
function xingLimit(T, dir) {
  let lim = Infinity;
  for (const X of XING.list) {
    if (!X.busy) continue;
    const d = (X.zc - T.z)*dir - 3.6;
    if (d > -1.2 && d < 40) lim = Math.min(lim, d <= 0 ? 0 : Math.sqrt(2*2.5*d));
  }
  return lim;
}
function overpasses(anim) {
  levelCrossings(anim);
  clearForest({x0:75.5, x1:79.2, z0:0, z1:15.2}); slab(0xb98f5c, 2.4, 14.4, 77.3, 7.6, .01); AREAS.push({x0:76, x1:78.6, z0:.35, z1:14.8}, {x0:66.4, x1:76.4, z0:.35, z1:14.8}, {x0:60.4, x1:66.6, z0:.35, z1:4.75}, {x0:60.4, x1:66.6, z0:89, z1:90.2}, {x0:60.4, x1:62.9, z0:71.5, z1:79.3});
  const g = new THREE.Group(); scene.add(g);
  const IRON = 0x3a6a5a;
  for (const o of []) {   // (the old ramps over the tracks: replaced by level crossings and footbridges)
    const zc = (o.z0 + o.z1)/2, wz = o.z1 - o.z0;
    mesh(G.box, 0xb8b2a6, [o.x2 - o.x1, .2, wz], [(o.x1 + o.x2)/2, OV_H - .1, zc], g);
    for (const [a, b] of [[o.x0, o.x1], [o.x3, o.x2]]) {
      for (let i = 0; i < 8; i++) { const h = OV_H*(i + 1)/8; mesh(G.box, i % 2 ? 0xc9c4ba : 0xbdb8ae, [Math.abs(b - a)/8 + .01, h, wz], [a + (b - a)*(i + .5)/8, h/2, zc], g); }
      const len = Math.hypot(b - a, OV_H), ang = Math.atan2(OV_H, b - a);
      for (const z of [o.z0 + .05, o.z1 - .05]) { const r = mesh(G.box, IRON, [len, .06, .06], [(a + b)/2, OV_H/2 + .9, z], g, {metalness:.5}); r.rotation.z = ang; }
    }
    for (const z of [o.z0 + .05, o.z1 - .05]) {
      mesh(G.box, IRON, [o.x2 - o.x1, .06, .06], [(o.x1 + o.x2)/2, OV_H + .9, z], g, {metalness:.5});
      for (let x = o.x1; x <= o.x2 + .01; x += .6) mesh(G.box, IRON, [.05, .9, .05], [x, OV_H + .45, z], g, {metalness:.5});
    }
    for (const x of [o.x1 + .15, o.x2 - .15]) for (const z of [o.z0 + .25, o.z1 - .25]) mesh(G.box, 0x9a958c, [.25, OV_H - .2, .25], [x, (OV_H - .2)/2, z], g);
  }
  if (anim) popIn(g);
}

