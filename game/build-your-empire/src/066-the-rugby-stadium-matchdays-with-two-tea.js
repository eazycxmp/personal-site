// ------------------------------------------------------------------ the rugby stadium: matchdays with two teams, a ball and a roaring crowd
const RUGBY = {at:[71.5, 82], t:60, on:0, players:[], ball:null, score:[0, 0], crowd:null, board:null};
function stadiumFx(anim) {
  const [cx, cz] = RUGBY.at;
  clearForest({x0:65, x1:78.5, z0:74, z1:90});
  slab(0x8a8478, 13, 15, cx, cz, .004);
  AREAS.push({x0:60.4, x1:66.6, z0:89, z1:90.2}, {x0:65, x1:78, z0:74.6, z1:90.2});
  for (const sx of [-1, 1]) boxes.push({x0:cx + Math.min(sx*4, sx*6.5), x1:cx + Math.max(sx*4, sx*6.5), z0:cz - 5, z1:cz + 5});
  boxes.push({x0:cx - 7.2, x1:cx - 6.8, z0:cz - 1.6, z1:cz + 1.6});
  const g = new THREE.Group(); g.position.set(cx, 0, cz); scene.add(g); RUGBY.g = g;
  // the pitch with stripes, lines and H posts at each end
  for (let i = 0; i < 8; i++) mesh(G.box, i % 2 ? 0x3f9a3a : 0x4aa844, [7.2, .02, 1.2], [0, .03, -4.2 + i*1.2], g);
  for (const z of [-4.6, 0, 4.6]) mesh(G.box, 0xf4f4f4, [7.2, .03, .05], [0, .045, z], g);
  for (const x of [-3.6, 3.6]) mesh(G.box, 0xf4f4f4, [.05, .03, 9.6], [x, .045, 0], g);
  for (const z of [-4.8, 4.8]) { for (const x of [-.45, .45]) mesh(G.cyl, 0xf4f4f4, [.04, 2.6, .04], [x, 1.3, z], g); mesh(G.box, 0xf4f4f4, [.9, .05, .05], [0, .9, z], g); }
  // stands on both long sides, full of fans
  const fans = [];
  for (const sx of [-1, 1]) for (let r = 0; r < 4; r++) {
    mesh(G.box, 0x9aa0a8, [1, .35, 10], [sx*(4.4 + r*.6), .18 + r*.35, 0], g);
    for (let k = 0; k < 16; k++) fans.push([sx*(4.4 + r*.6), .55 + r*.35, -4.6 + k*.6]);
  }
  const crowd = RUGBY.crowd = new THREE.InstancedMesh(G.box, new THREE.MeshStandardMaterial({color:0xffffff, roughness:.8}), fans.length), o = new THREE.Object3D(), c = new THREE.Color();
  fans.forEach(([x, y, z], i) => { o.position.set(x, y, z); o.scale.set(.25, .4, .25); o.updateMatrix(); crowd.setMatrixAt(i, o.matrix); crowd.setColorAt(i, c.set(R() < .5 ? 0xd9443a : 0x1f5fb8).offsetHSL(0, 0, (R() - .5)*.2)); });
  crowd.userData.fans = fans; g.add(crowd);
  for (const [x, z] of [[-6.4, -6], [6.4, -6], [-6.4, 6], [6.4, 6]]) { mesh(G.cyl, 0x8a8f96, [.08, 5, .08], [x, 2.5, z], g, {metalness:.5}); mesh(G.box, 0x2a2e36, [.9, .5, .2], [x, 5.1, z], g); bulb(g, x, 5.1, z + .12*Math.sign(-z), 0xffffff, .2); }
  // the scoreboard
  const sc = document.createElement('canvas'); sc.width = 256; sc.height = 96; RUGBY.board = {c:sc, t:new THREE.CanvasTexture(sc)};
  const s = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:RUGBY.board.t, toneMapped:false})); s.scale.set(3, 1.1, 1); s.rotation.y = -Math.PI/2; s.position.set(-6.9, 3.4, 0); g.add(s);
  mesh(G.box, 0x1a1a1e, [.15, 1.3, 3.2], [-7, 3.4, 0], g); mesh(G.cyl, 0x3a3e44, [.08, 2.8, .08], [-7, 1.4, 0], g);
  drawBoard();
  fader(g, 13, 5);
  if (anim) popIn(g);
}
function drawBoard() {
  const b = RUGBY.board; if (!b) return; const g = b.c.getContext('2d');
  g.fillStyle = '#0a0f18'; g.fillRect(0, 0, 256, 96); g.font = '900 44px ui-monospace,monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#ff6a5a'; g.fillText(String(RUGBY.score[0]), 64, 52); g.fillStyle = '#ffffff'; g.fillText('–', 128, 50); g.fillStyle = '#6ab0ff'; g.fillText(String(RUGBY.score[1]), 192, 52);
  b.t.needsUpdate = true;
}
function kickoff() {
  for (const p of RUGBY.players) scene.remove(p.c.g); RUGBY.players = [];
  const [cx, cz] = RUGBY.at;
  for (let t = 0; t < 2; t++) for (let i = 0; i < 6; i++) {
    const c = makeChar({civ:0, top:'stripes', body:t ? 0x1f5fb8 : 0xd9443a, body2:0xf4f4f4, pants:0xf4f4f4, shorts:true, hair:'short', hairCol:HAIRC[(i + t*3) % 8], skin:SKINS[(i*2 + t) % 5]});
    const p = {c, t, x:cx - 2.4 + (i % 3)*2.4, z:cz + (t ? 1.2 : -1.2) + Math.floor(i / 3)*(t ? 1 : -1)}; c.g.position.set(p.x, 0, p.z); RUGBY.players.push(p);
  }
  if (!RUGBY.ball) { RUGBY.ball = mesh(G.sph, 0x8a5a2b, [.14, .1, .1], [0, 0, 0], scene); }
  RUGBY.carrier = RUGBY.players[R()*12|0];
}
function updRugby(dt) {
  if (!RUGBY.g || !started) return;
  if (RUGBY.on <= 0 && ARENA.go === 'game') { ARENA.go = ''; RUGBY.on = 35; RUGBY.t = 140 + R()*80; RUGBY.score = [0, 0]; drawBoard(); kickoff(); banner('🏉 Matchday at the stadium!', 'Two teams, one ball and a sold-out crowd.'); }
  const crowd = RUGBY.crowd, live = RUGBY.on > 0;
  if (crowd && (live || RUGBY.cheer > 0)) {
    RUGBY.cheer = Math.max(0, (RUGBY.cheer || 0) - dt);
    const o = new THREE.Object3D(), f = crowd.userData.fans;
    for (let i = 0; i < f.length; i += 1) { const [x, y, z] = f[i]; o.position.set(x, y + Math.max(0, Math.sin(time*(RUGBY.cheer > 0 ? 14 : 4) + i))*(RUGBY.cheer > 0 ? .2 : .05), z); o.scale.set(.25, .4, .25); o.updateMatrix(); crowd.setMatrixAt(i, o.matrix); }
    crowd.instanceMatrix.needsUpdate = true;
  }
  if (!live) { for (const p of RUGBY.players) p.c.g.visible = false; if (RUGBY.ball) RUGBY.ball.visible = false; return; }
  RUGBY.on -= dt;
  const [cx, cz] = RUGBY.at, car = RUGBY.carrier, goalZ = cz + (car.t ? -4.6 : 4.6);
  for (const p of RUGBY.players) {
    p.c.g.visible = true;
    let tx, tz;
    if (p === car) { tx = clamp(p.x + Math.sin(time*2 + p.t)*.5, cx - 3.3, cx + 3.3); tz = goalZ; }
    else if (p.t === car.t) { tx = car.x + (p.x > car.x ? 1.4 : -1.4); tz = car.z - (car.t ? -1 : 1)*.8; }
    else { tx = car.x; tz = car.z + (car.t ? -1 : 1)*.2; }
    const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz), sp = p === car ? 3.2 : 3.5;
    if (d > .05) { p.x += dx/d*Math.min(d, sp*dt); p.z += dz/d*Math.min(d, sp*dt); p.c.g.rotation.y = Math.atan2(dx, dz); }
    const s = Math.sin(time*13 + p.x*3); p.c.legL.rotation.x = s*.8; p.c.legR.rotation.x = -s*.8; p.c.armL.rotation.x = -s*.6; p.c.armR.rotation.x = p === car ? -1.2 : s*.6;
    p.c.g.position.set(p.x, Math.abs(s)*.05, p.z);
    // a tackle turns the ball over
    if (p.t !== car.t && Math.hypot(p.x - car.x, p.z - car.z) < .45 && R() < dt*2.5) { RUGBY.carrier = p; snd(140, .08, 'square', .03); break; }
  }
  RUGBY.ball.position.set(RUGBY.carrier.x + .15, 1, RUGBY.carrier.z + .1); RUGBY.ball.visible = true;
  if (Math.abs(RUGBY.carrier.z - goalZ) < .3) {
    RUGBY.score[RUGBY.carrier.t] += 5; drawBoard(); RUGBY.cheer = 2.5;
    popText('🏉 TRY!', new THREE.Vector3(RUGBY.carrier.x, 3, RUGBY.carrier.z), '#ffe06b'); [523, 659, 784].forEach((f, i) => setTimeout(() => snd(f, .15, 'triangle', .04), i*90));
    kickoff();
  }
  if (RUGBY.on <= 0) {
    const pay = 2500 + 300*W.era; W.coins += pay; W.earned += pay;
    popText(`🎟️ +${pay} gate takings`, new THREE.Vector3(60, 3, 82), '#ffe06b');
    news(`Rugby: ${RUGBY.score[0]}–${RUGBY.score[1]} in front of a full house`);
  }
}

