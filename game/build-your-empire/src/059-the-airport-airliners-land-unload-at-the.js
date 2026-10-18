// ------------------------------------------------------------------ the airport: airliners land, unload at the gate and take off again
const JETS = [];
function terminalFx(anim) {
  const g = new THREE.Group(); g.position.set(-37.1, 0, -4); scene.add(g);
  mesh(G.box, 0xeef1f4, [3, 2, 6], [0, 1, 0], g); mesh(G.box, 0x8fc6e8, [3.02, 1.1, 5.6], [0, 1.15, 0], g, {metalness:.5, roughness:.1});
  const roof = mesh(G.box, 0xdfe4ea, [3.6, .2, 6.6], [0, 2.1, 0], g); roof.rotation.x = .04;
  for (const z of [-2.2, 0, 2.2]) mesh(G.cyl, 0xdfe4ea, [.12, 2, .12], [1.6, 1, z], g);
  // the jet bridge out to the gate
  mesh(G.box, 0xb8bcc2, [1.6, .7, .7], [2.2, 1.6, -1], g, {metalness:.4}); mesh(G.cyl, 0x8a8f96, [.12, 1.3, .12], [2.8, .65, -1], g);
  const sign = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('AIRPORT', '#0a2a5a', '#ffffff'), toneMapped:false}));
  sign.scale.set(2, .6, 1); sign.rotation.y = Math.PI/2; sign.position.set(1.52, 2.45, 0); g.add(sign);
  slab(0x6a6e76, 3.2, 10, -34.6, -4, .006);
  boxes.push({x0:-38.6, x1:-35.6, z0:-7, z1:-1});
  fader(g, 3.4, 2.6);
  if (anim) popIn(g);
}
function makeJet(big, kind = 'pax', slot = 0) {
  if (JETS[slot]) scene.remove(JETS[slot].g);
  const g = new THREE.Group(); g.rotation.order = 'YXZ'; scene.add(g);
  const cargo = kind === 'cargo', s = cargo ? 1.45 : big ? 1.35 : 1, b = new THREE.Group(); b.scale.setScalar(s); b.position.y = .55; g.add(b);
  const WH = cargo ? 0xc8ccd2 : 0xf4f6f8, BL = cargo ? 0xf2a21a : slot === 1 ? 0x3f9a6a : big ? 0xd9443a : 0x1f5fb8;
  if (!jetModel(b, big, cargo, BL)) {
  mesh(G.cyl, WH, [.36, 4.2, .36], [0, .2, 0], b, {roughness:.35}).rotation.x = Math.PI/2;
  mesh(G.sph, WH, [.36, .36, .6], [0, .2, 2.1], b, {roughness:.35}); mesh(G.cone, WH, [.36, .9, .36], [0, .28, -2.5], b).rotation.x = -Math.PI/2;
  mesh(G.box, 0x1a2a3a, [.5, .1, .2], [0, .4, 2.25], b);
  for (const sx of [-1, 1]) {
    const wg = mesh(G.box, WH, [2.2, .06, .8], [sx*1.2, cargo ? .5 : .05, .2], b); wg.rotation.y = sx*.35;
    mesh(G.cyl, 0xb8bcc2, [.16, .55, .16], [sx*1, cargo ? .3 : -.12, .45], b, {metalness:.5}).rotation.x = Math.PI/2;
    if (big || cargo) mesh(G.cyl, 0xb8bcc2, [.15, .5, .15], [sx*1.7, cargo ? .34 : -.08, .15], b, {metalness:.5}).rotation.x = Math.PI/2;
    mesh(G.box, WH, [.8, .05, .35], [sx*.45, .3, -2.35], b).rotation.y = sx*.3;
  }
  mesh(G.box, BL, [.06, .9, .7], [0, .75, -2.25], b).rotation.x = -.35;
  mesh(G.box, BL, [.74, .08, 3.2], [0, .2, .1], b);
  if (!cargo) for (let i = 0; i < 10; i++) for (const sx of [-1, 1]) mesh(G.box, 0x1a2a3a, [.02, .08, .1], [sx*.36, .32, -1.4 + i*.3], b);
  else { const t = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('CARGO', '#c8ccd2', '#d97a10'), side:THREE.DoubleSide})); t.scale.set(1.4, .4, 1); t.rotation.y = Math.PI/2; t.position.set(.37, .25, .2); b.add(t); }
  }
  for (const [x, z] of [[0, 1.6], [-.5, 0], [.5, 0]]) mesh(G.cyl, 0x1a1a1a, [.1, .08, .1], [x, -.25, z], b).rotation.z = Math.PI/2;
  const gate = [[-33.6, -2.6], [-33.6, -10.4], [-28.4, -12.6]][slot];
  JETS[slot] = {g, big, cargo, slot, gate, t:0, leg:'away', wait:6 + slot*9};
  g.visible = false;
}
const JET = {hold:[-32, 12], top:[-32, -12]};
// airliners fly like the fighters do (see flyPose): smoothed along their legs, nose along the way they go, banking in turns
function jetPose(J, x, y, z, nx, ny, nz) { flyPose(J, [x, y, z], [nx, ny, nz], JET.dt || 1/60); }
// one plane at a time on the runway; the others hold at the gate or circle out of sight
const RUNWAY_LEGS = new Set(['approach', 'rollout', 'toHold', 'takeoff']);
function updJet(dt) {
  for (const J of JETS) if (J) updOneJet(J, dt);
}
function updOneJet(J, dt) {
  JET.dt = dt;
  const L = (a, b, u) => a + (b - a)*clamp(u, 0, 1), G0 = J.gate;
  if (W.camp && W.camp.type === 'air' && J.leg === 'away') return;
  const runwayFree = !JETS.some(o => o && o !== J && RUNWAY_LEGS.has(o.leg));
  J.t += dt;
  const legs = {
    away:() => { J.g.visible = false; if (J.t > J.wait && runwayFree) next('approach'); },
    approach:() => { const u = J.t/6; if (!J.g.visible) J.fly = null; /* appears on the approach, not sliding in from where it vanished */ J.g.visible = true; jetPose(J, RUNWAY.x, L(14, .2, u), L(-70, -12, u), RUNWAY.x, L(14, .2, u + .02), L(-70, -12, u + .02)); if (u >= 1) next('rollout'); },
    rollout:() => { const u = J.t/3.2, e = 1 - (1 - u)*(1 - u); jetPose(J, RUNWAY.x, .2*(1 - u), L(-12, 9, e), RUNWAY.x, 0, L(-12, 9, e) + 1); if (u >= 1) next('toGate'); },
    toGate:() => { const u = J.t/3; jetPose(J, L(RUNWAY.x, G0[0], u), 0, L(9, G0[1], u), L(RUNWAY.x, G0[0], u + .05), 0, L(9, G0[1], u + .05)); if (u >= 1) { next('gate'); landed(J); } },
    gate:() => {
      if (J.t === dt && !J.cargo) for (let i = 0; i < (J.big ? 5 : 3) && movers.length < MAX_MOVERS; i++) spawnMover([[-31.2, G0[1] - 3 + i*.3], [-29.9, G0[1] - 2.4], [G0[0] - .3, G0[1] - .8]], null, R() < .6);
      if (J.t > (J.cargo ? 8 : 6) && runwayFree) next('toHold');
    },
    toHold:() => { const u = J.t/3; jetPose(J, L(G0[0], RUNWAY.x, u), 0, L(G0[1], 12, u), L(G0[0], RUNWAY.x, u + .05), 0, L(G0[1], 12, u + .05)); if (u >= 1) next('takeoff'); },
    takeoff:() => { const u = J.t/5, e = u*u; const z = L(12, -60, e), y = u > .4 ? (u - .4)/.6*14 : 0; jetPose(J, RUNWAY.x, y, z, RUNWAY.x, y + (u > .4 ? .4 : 0), z - 1); if (u >= 1) { next('away'); J.wait = 14 + R()*10; } },
  };
  legs[J.leg]();
  function next(l) { J.leg = l; J.t = 0; }
}
function landed(J) {
  const [gx, gz] = J.gate;
  if (J.cargo) {
    // the freighter unloads crates for the container yard: the best-paying flight
    const pay = 12000 + 800*W.era;
    addCash(CASH.airport, pay, {x:gx, z:gz});
    popText(`📦 +${pay} air freight`, new THREE.Vector3(gx, 3.4, gz), '#ffe06b');
    for (let i = 0; i < 8; i++) setTimeout(() => particle([0xd9443a, 0x3f7cc0, 0xf2a21a, 0x3f9a6a][i % 4], new THREE.Vector3(gx + 1, 1.2, gz), new THREE.Vector3(2.4, 1.2, (R() - .5)), 1, .16, {grav:1}), i*200);
    snd(330, .3, 'triangle', .05); return;
  }
  const fare = (J.big ? 4000 + 400*W.era : 1500 + 200*W.era);
  addCash(CASH.airport, fare, {x:gx, z:gz});
  popText(`✈️ +${fare} fares`, new THREE.Vector3(gx, 3.2, gz), '#ffe06b');
  snd(523, .2, 'triangle', .05); setTimeout(() => snd(784, .25, 'triangle', .05), 180);
  // arrivals come down the jet bridge and walk into town to eat, over the river bridge if there is one
  for (let i = 0; i < (J.big ? 4 : 2); i++) {
    const Ln = LINES.main; if (!Ln || Ln.q.length >= Ln.max) break;
    spawnIn(Ln); const c = Ln.q[Ln.q.length - 1];
    c.pos.set(gx - .3, 0, gz - .8 - i*.4);
    c.pre = W.bridge ? [[-34.9, -1], [-34.9, 4.6], [BR.x0 - .4, BR.z], ...WEST_PATH()] : [[-34.9, -1], [-34.9, 9.6], [-23.4, 9.6], [-9.6, 9.6], [-1, 4.6], [5.6, 4.6], [7.2, 2.4]];
  }
}
function terminal2Fx(anim) {
  const g = new THREE.Group(); g.position.set(-37.1, 0, -10.6); scene.add(g);
  mesh(G.box, 0xeef1f4, [3, 2.2, 4.4], [0, 1.1, 0], g); mesh(G.box, 0x8fc6e8, [3.02, 1.2, 4], [0, 1.25, 0], g, {metalness:.5, roughness:.1});
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 4.6, 16, 1, false, 0, Math.PI), mat(0xdfe4ea, {metalness:.3})); roof.rotation.set(0, 0, Math.PI/2); roof.rotation.order = 'ZYX'; roof.rotation.set(Math.PI/2, 0, Math.PI/2); roof.scale.set(.65, 1, .25); roof.position.y = 2.2; g.add(roof);
  mesh(G.box, 0x8fc6e8, [1.2, 1, 1.6], [0, 1, 3.1], g, {metalness:.5, roughness:.1});
  mesh(G.box, 0xb8bcc2, [1.6, .7, .7], [2.2, 1.6, .2], g, {metalness:.4}); mesh(G.cyl, 0x8a8f96, [.12, 1.3, .12], [2.8, .65, .2], g);
  const sign = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('TERMINAL 2', '#0a2a5a', '#ffffff'), toneMapped:false}));
  sign.scale.set(2.2, .55, 1); sign.rotation.y = Math.PI/2; sign.position.set(1.52, 2.5, 0); g.add(sign);
  slab(0x6a6e76, 3.2, 5, -34.6, -10.6, .006);
  boxes.push({x0:-38.6, x1:-35.6, z0:-12.8, z1:-8.4});
  fader(g, 3.4, 2.8);
  if (anim) popIn(g);
}
function cargoApronFx(anim) {
  const g = new THREE.Group(); scene.add(g);
  slab(0x6a6e76, 5, 3.6, -28.4, -12.4, .006);
  for (let i = 0; i < 6; i++) mesh(G.box, [0xd9443a, 0x3f7cc0, 0xf2a21a][i % 3], [.6, .45, .45], [-21.4 + (i % 3)*.7, .22 + Math.floor(i / 3)*.45, -10.4], g);
  if (anim) popIn(g);
}

