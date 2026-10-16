// ------------------------------------------------------------------ trains: ore carts in the mine, and a line to the next towns
const MINE_PATH = [[-1.4, -59.6], [3.35, -59.6], [3.35, -53.3]];
function polyAt(P, s) {
  for (let i = 0; i < P.length - 1; i++) {
    const [ax, az] = P[i], [bx, bz] = P[i + 1], l = Math.hypot(bx - ax, bz - az);
    if (s <= l || i === P.length - 2) { const t = clamp(s / l, 0, 1); return [ax + (bx - ax)*t, az + (bz - az)*t, Math.atan2(bx - ax, bz - az)]; }
    s -= l;
  }
}
const polyLen = P => P.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - P[i][0], p[1] - P[i][1]), 0);
function railsAlong(P, parent, gauge = .5) {
  for (let i = 0; i < P.length - 1; i++) {
    const [ax, az] = P[i], [bx, bz] = P[i + 1], l = Math.hypot(bx - ax, bz - az), a = Math.atan2(bx - ax, bz - az);
    const nx = Math.cos(a), nz = -Math.sin(a);
    for (const s of [-1, 1]) { const r = mesh(G.box, 0x8a8f96, [.05, .06, l + gauge], [(ax + bx)/2 + nx*s*gauge/2, .06, (az + bz)/2 + nz*s*gauge/2], parent, {metalness:.7, roughness:.35}); r.rotation.y = a; }
    for (let t = .2; t < l; t += .45) { const sl = mesh(G.box, 0x6b4526, [gauge + .35, .05, .16], [ax + (bx - ax)*t/l, .025, az + (bz - az)*t/l], parent); sl.rotation.y = a; }
  }
}
let mineTrain = null;
function buildMineRail(anim) {
  const g = new THREE.Group(); scene.add(g);
  railsAlong(MINE_PATH, g);
  const cars = [];
  const loco = new THREE.Group(); g.add(loco); cars.push(loco);
  mesh(G.box, 0xd9a21a, [.55, .45, .8], [0, .4, 0], loco); mesh(G.box, 0x3a3a3e, [.5, .35, .35], [0, .78, -.15], loco);
  mesh(G.cyl, 0x2a2a2e, [.07, .35, .07], [0, .8, .25], loco); mesh(G.sph, 0xfff2b0, [.07, .07, .03], [0, .5, .41], loco);
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Group(); g.add(c); cars.push(c);
    mesh(G.box, 0x6a6e74, [.55, .38, .7], [0, .38, 0], c, {metalness:.5, roughness:.5});
    c.load = mesh(G.ico, 0x5a4a44, [.3, .16, .3], [0, .6, 0], c);
    for (const [x, z] of [[.1, .1], [-.12, -.08]]) mesh(G.sph, 0xd9792b, [.05, .05, .05], [x, .7, z], c);
  }
  for (const c of cars) for (const x of [-.25, .25]) for (const z of [-.25, .25]) mesh(G.cyl, 0x2a2a2e, [.1, .06, .1], [x, .12, z], c).rotation.z = Math.PI/2;
  mineTrain = {g, cars, L:polyLen(MINE_PATH), s:3, state:'load', t:2, ore:0};
  if (anim) popIn(g);
}
function updMineTrain(dt) {
  const m = mineTrain; if (!m) return;
  const minS = 2.9, sp = 2.4 * BOOST.metal;
  if (m.state === 'load') { if ((m.t -= dt) <= 0) { m.ore = 6; m.state = 'go'; } }
  else if (m.state === 'go') { m.s += sp*dt; if (m.s >= m.L) { m.s = m.L; m.state = 'unload'; m.t = .25; } }
  else if (m.state === 'unload') {
    if ((m.t -= dt) <= 0) {
      m.t = .2;
      const st = ST.smelter, room = st && st.inStack.length < st.inStack.cap;
      if (m.ore > 0 && room) { const [x, z] = polyAt(MINE_PATH, m.s - 1.2); spawnItem('ore', new THREE.Vector3(x, .9, z), st.inStack); m.ore--; snd(300, .03, 'square', .02); }
      else { m.state = 'back'; }
    }
  } else if (m.state === 'back') { m.s -= sp*dt; if (m.s <= minS) { m.s = minS; m.state = 'load'; m.t = 2.4; } }
  m.cars.forEach((c, i) => {
    const [x, z, a] = polyAt(MINE_PATH, m.s - i*.95);
    c.position.set(x, 0, z); c.rotation.y = a;
    if (c.load) c.load.visible = m.ore > 0 || m.state === 'load';
  });
}
// the main line runs north to south past the farms, from a mountain tunnel to the next town
const RAIL = {x:63.6, z0:-67.5, z1:118, stop:75.4};
let railTrain = null;
function makeTrain(kind) {
  if (railTrain) { scene.remove(railTrain.g); }
  const g = new THREE.Group(); scene.add(g);
  const cars = [];
  const car = () => { const c = new THREE.Group(); g.add(c); cars.push(c); return c; };
  if (kind === 0) makeWagon(g, cars);
  else if (kind === 1) {
    const l = car();
    mesh(G.cyl, 0x1e1e22, [.48, 2, .48], [0, .9, .2], l, {metalness:.5, roughness:.4}).rotation.x = Math.PI/2;
    mesh(G.box, 0x8a1e1a, [1.1, 1.2, .9], [0, 1.15, -1.05], l); mesh(G.box, 0x1e1e22, [1.2, .1, 1.1], [0, 1.8, -1.05], l);
    mesh(G.cyl, 0x1e1e22, [.16, .7, .16], [0, 1.6, .85], l); mesh(G.cyl, 0x1e1e22, [.24, .15, .24], [0, 1.98, .85], l);
    mesh(G.sph, 0xc8a040, [.2, .2, .2], [0, 1.45, .2], l, {metalness:.8});
    mesh(G.sph, 0xfff2b0, [.14, .14, .05], [0, 1.05, 1.22], l);
    mesh(G.cone4, 0x8a1e1a, [.55, .4, .3], [0, .3, 1.25], l).rotation.x = -Math.PI/2;
    for (const z of [-1, -.2, .6]) for (const x of [-.5, .5]) mesh(G.cyl, 0xb8322a, [.32, .1, .32], [x, .35, z], l).rotation.z = Math.PI/2;
    const t = car(); mesh(G.box, 0x1e1e22, [1.1, .8, 1.4], [0, .7, 0], t); mesh(G.ico, 0x2a2420, [.5, .2, .55], [0, 1.15, 0], t);
    for (let i = 0; i < 3; i++) {
      const c = car(), col = [0x2f6a4a, 0x8a2a2a, 0x2f4a7a][i];
      mesh(G.box, col, [1.15, 1.2, 2.6], [0, .95, 0], c); mesh(G.box, 0x3a3a3e, [1.25, .12, 2.7], [0, 1.6, 0], c);
      for (let k = 0; k < 4; k++) mesh(G.box, WIN, [1.17, .38, .38], [0, 1.1, -.95 + k*.63], c);
      for (const z of [-.9, .9]) for (const x of [-.5, .5]) mesh(G.cyl, 0x2a2a2e, [.22, .1, .22], [x, .3, z], c).rotation.z = Math.PI/2;
    }
  } else {
    for (let i = 0; i < 4; i++) {
      const c = car();
      mesh(G.box, 0xf4f6f8, [1.15, 1.15, 2.7], [0, .95, 0], c, {metalness:.3, roughness:.3});
      mesh(G.box, 0x1f5fb8, [1.17, .16, 2.72], [0, .62, 0], c);
      mesh(G.box, 0x2a3440, [1.17, .32, 2.5], [0, 1.15, 0], c, {metalness:.5, roughness:.15});
      if (i === 0) { const n = mesh(G.sph, 0xf4f6f8, [.58, .55, 1.4], [0, .95, 1.3], c, {metalness:.3, roughness:.3}); mesh(G.box, 0x2a3440, [.8, .3, .5], [0, 1.25, 1.55], c, {metalness:.5, roughness:.15}).rotation.x = .5; }
    }
  }
  const lens = kind === 0 ? [1.5, 2.3] : kind === 1 ? [2.9, 1.6, 2.8, 2.8, 2.8] : [3.4, 2.8, 2.8, 2.8];
  railTrain = {g, cars, lens, kind, z:RAIL.z0 - 8, v:0, leg:0, wait:0, smokeT:0};
}
// stops: the station, the town in the south, the station, the tunnel in the north
const TRAIN_STOPS = [RAIL.stop, 116, RAIL.stop, RAIL.z0 - 8];
function updTrain(dt) {
  const T = railTrain; if (!T) return;
  const want = TRAIN_STOPS[T.leg], top = [3.2, 7, 15][T.kind], d = want - T.z;
  if (T.wait > 0) { T.wait -= dt; T.v = 0; }
  else if (Math.abs(d) < .05) {
    T.z = want; T.leg = (T.leg + 1) % TRAIN_STOPS.length; T.wait = want === RAIL.stop ? 5 : 3;
    if (want === RAIL.stop) trainArrives(T);
  } else {
    const sp = Math.min(top, Math.sqrt(2 * 2.5 * Math.abs(d)) + .3, xingLimit(T, Math.sign(d)));
    T.held = sp < .05; T.v = T.held ? 0 : Math.sign(d) * sp; T.z += T.v*dt;
    if (Math.sign(want - T.z) !== Math.sign(d)) T.z = want;
  }
  // the head leads in whichever direction the train travels
  const dir = T.v ? Math.sign(T.v) : (T.dir || 1); T.dir = dir;
  let off = 0;
  T.cars.forEach((c, i) => {
    if (i) off += (T.lens[i - 1] + T.lens[i]) / 2;
    c.position.set(RAIL.x, 0, T.z - dir*off); c.rotation.y = dir > 0 ? 0 : Math.PI;
    c.visible = c.position.z > RAIL.z0 - .2 && c.position.z < RAIL.z1;
  });
  if (T.kind === 0) for (const [i, l] of T.cars[0].legs.entries()) l.rotation.x = T.v ? Math.sin(time*11 + i*1.7) * .55 : 0;
  if (T.kind === 1 && T.v && (T.smokeT -= dt) <= 0 && T.cars[0].visible) {
    T.smokeT = .12;
    particle(0xe8e8e8, new THREE.Vector3(RAIL.x, 2.1, T.z + dir*.85), new THREE.Vector3((R() - .5)*.4, 1.4, -dir*1.2), 1.6, .22, {grow:.5, op:.55});
  }
}
function trainArrives(T) {
  const fare = [50, 120, 420][T.kind] + 30*W.era;
  addCash(CASH.rail, fare, {x:62, z:RAIL.stop});
  popText(`+${fare} 🚉 fares`, new THREE.Vector3(32, 3.4, RAIL.stop), '#ffe06b');
  snd(660, .25, 'triangle', .05); setTimeout(() => snd(550, .35, 'triangle', .05), 260);
  // riders step off with their bags and head into town, while others board
  const doorX = T.kind === 0 ? RAIL.x - 1 : RAIL.x - .58;
  for (let i = 0; i < [2, 4, 6][T.kind] && movers.length < MAX_MOVERS; i++) {
    const z = RAIL.stop - 3 + i*1.1 + R()*.4;
    spawnMover([[doorX, z], [RAIL.x - 1.4, z], [RAIL.x - 1.4, RAIL.stop - 4.6], [61.3, 4.6]], null, R() < .7);
  }
  for (let i = 0; i < [1, 3, 5][T.kind] && movers.length < MAX_MOVERS; i++) {
    const z = RAIL.stop - 2.6 + i*1.2;
    spawnMover([[RAIL.x - 1.7, RAIL.stop + 3.6 - i*.3], [RAIL.x - 1.4, z], [doorX, z]], null, R() < .5);
  }
  // passengers walk from the platform to the tables
  const n = [1, 2, 4][T.kind];
  for (let i = 0; i < n; i++) {
    const L = i % 2 && LINES.hall ? LINES.hall : LINES.main;
    if (!L || !L.active() || L.q.length >= L.max) continue;
    spawnIn(L); const c = L.q[L.q.length - 1];
    c.pos.set(RAIL.x - 1.6, 0, RAIL.stop - 2 + i); c.pre = [[RAIL.x - 2.2, L === LINES.hall ? 4.2 : 2]];
  }
}

// a citizen of a busy town: people strolling between the sights, like a little sim
const strollers = [];
const STROLL = [[1, -3.4], [6.4, -1.8], [10.6, 2.4], [7.2, 8.4], [-1.2, 4.4], [-7.4, -1.6], [2.4, -9.6], [10.6, -10.2]];
function updStrollers(dt) {
  const want = Math.min(12, Math.floor(W.era * .9) + (W.water || 0) + Math.min(3, (W.decor || []).length));
  while (strollers.length < want) {
    const s = entity({civ:true}, ...STROLL[R()*STROLL.length|0], 1.4 + R()*.6, 0);
    s.goal = STROLL[R()*STROLL.length|0]; s.rest = 0; strollers.push(s);
  }
  for (const s of strollers) {
    if (s.rest > 0) { s.rest -= dt; s.vel.set(0, 0, 0); }
    else {
      const px = s.pos.x, pz = s.pos.z;
      if (moveTo(s, s.goal[0], s.goal[1], dt)) { s.rest = 1.5 + R()*4; if (s.plan) { s.doing = s.plan; s.plan = null; s.rest = 2.5 + R()*2; } s.goal = STROLL[R()*STROLL.length|0]; }
    }
    animEntity(s, dt);
  }
}

