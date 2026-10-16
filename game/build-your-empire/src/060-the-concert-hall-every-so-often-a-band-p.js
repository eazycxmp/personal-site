// ------------------------------------------------------------------ the concert hall: every so often a band plays to a crowd
const GIG = {at:[51, 94.2], t:40, on:0, band:[], lights:[], noteT:0, beat:0};
function concertFx(anim) {
  clearForest({x0:44, x1:58, z0:91, z1:101});
  slab(0x8a8478, 13, 8.6, GIG.at[0], 96.4, .004);
  slab(0x8a8478, 3, 2.2, GIG.at[0] + 4, 91.5, .004);   // a path down from the farms
  AREAS.push({x0:44.6, x1:57.4, z0:90.4, z1:100.6});
  boxes.push({x0:GIG.at[0] - 3.6, x1:GIG.at[0] + 3.6, z0:GIG.at[1] - 1.6, z1:GIG.at[1] + 1.6}, {x0:GIG.at[0] - 4.4, x1:GIG.at[0] - 3.4, z0:GIG.at[1] + .4, z1:GIG.at[1] + 1.4}, {x0:GIG.at[0] + 3.4, x1:GIG.at[0] + 4.4, z0:GIG.at[1] + .4, z1:GIG.at[1] + 1.4});
  const g = new THREE.Group(); g.position.set(GIG.at[0], 0, GIG.at[1]); scene.add(g); GIG.g = g;
  mesh(G.box, 0x2a2a30, [7, .8, 3], [0, .4, 0], g); mesh(G.box, 0x3a3a42, [7.2, .08, 3.2], [0, .82, 0], g);
  // the shell: a curved backdrop and a roof truss of lights
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 4.2, 20, 1, true, Math.PI*.6, Math.PI*.8), mat(0xf4f0e6, {side:THREE.DoubleSide}));
  shell.position.set(0, 2.9, .4); shell.castShadow = true; g.add(shell);
  for (const x of [-3.4, 3.4]) mesh(G.box, 0x3a3e44, [.18, 4.6, .18], [x, 2.3, 1.3], g, {metalness:.5});
  mesh(G.box, 0x3a3e44, [7, .18, .18], [0, 4.6, 1.3], g, {metalness:.5});
  for (const x of [-3.9, 3.9]) { mesh(G.box, 0x1a1a1e, [.8, 1.6, .8], [x, 1.6, .9], g); mesh(G.cyl, 0x3a3a42, [.28, .05, .28], [x, 1.9, 1.31], g).rotation.x = Math.PI/2; }
  const sign = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('LIVE', '#14101a', '#ff4fb0'), toneMapped:false})); sign.scale.set(2.2, .7, 1); sign.position.set(0, 5.1, 1.3); g.add(sign);
  // the band: a singer, two guitars and a drummer
  const looks = [{civ:3}, {civ:11}, {civ:17}, {civ:23}];
  [[0, 1.6], [-1.8, 1.2], [1.8, 1.2], [0, .3]].forEach(([x, z], i) => {
    const c = makeChar(looks[i]); scene.remove(c.g); c.g.position.set(x, .86, z); g.add(c.g);
    if (i === 0) { mesh(G.cyl, 0x2a2a2e, [.02, 1.3, .02], [0, .65, .45], c.g, {metalness:.6}); mesh(G.sph, 0x2a2a2e, [.06, .08, .06], [0, 1.35, .45], c.g); }
    if (i === 1 || i === 2) { const gt = new THREE.Group(); gt.position.set(0, .95, .3); gt.rotation.z = .7; c.g.add(gt); mesh(G.box, i === 1 ? 0xd9443a : 0x1f5fb8, [.34, .42, .08], [0, -.1, 0], gt); mesh(G.box, 0x5e3f22, [.06, .55, .05], [0, .35, 0], gt); }
    if (i === 3) { mesh(G.cyl, 0xd9d9d9, [.32, .3, .32], [0, .45, .55], c.g); for (const x2 of [-.45, .45]) mesh(G.cyl, 0xf2c200, [.22, .03, .22], [x2, .9, .45], c.g, {metalness:.8}); }
    GIG.band.push(c);
  });
  // spotlights that sweep the crowd during a show
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(new THREE.ConeGeometry(.55, 5, 16, 1, true), new THREE.MeshBasicMaterial({color:[0xff4fb0, 0x5af0ff, 0xffd36b, 0xb78cff][i], transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false, side:THREE.DoubleSide}));
    s.position.set(-2.6 + i*1.75, 2.1, 3.2); g.add(s); GIG.lights.push(s);
  }
  fader(g, 7, 5);
  if (anim) popIn(g);
}
const SCALE = [392, 440, 523, 587, 659, 784];
function updConcert(dt) {
  if (!GIG.g || !started) return;
  if (GIG.on <= 0 && ARENA.go === 'concert') {
    ARENA.go = '';
    GIG.on = 30; GIG.t = 100 + R()*60; GIG.fans = 0;
    banner(ARENA.lv >= 2 ? '🎤 Stadium concert tonight!' : '🎸 Concert tonight!', 'The band takes the stage at the arena. Fans dance down the front and the whole town cheers up.');
    for (let i = 0; i < 14 && movers.length < MAX_MOVERS; i++) {
      const x = GIG.at[0] - 3 + (i % 7)*1, z = GIG.at[1] + 3.6 + Math.floor(i / 7)*1.1;
      spawnMover([[59.5 - R()*8, 90.4], [x + (R() - .5)*.4, z]], null, false);
      const m = movers[movers.length - 1]; m.fan = true; m.path.push([x, z]); GIG.fans++;
    }
  }
  const live = GIG.on > 0;
  GIG.lights.forEach((s, i) => { s.material.opacity += ((live ? .15 : 0) - s.material.opacity) * Math.min(1, dt*3); s.rotation.z = Math.sin(time*1.3 + i*1.7) * .45; s.rotation.x = -.5 + Math.sin(time*.9 + i)*.25; });
  GIG.band.forEach((c, i) => {
    const b = live ? Math.sin(time*8 + i) : 0;
    c.g.position.y = .86 + Math.max(0, b)*.08;
    if (i === 1 || i === 2) c.armR.rotation.x = live ? -1 + Math.sin(time*14 + i)*.4 : -.3;
    if (i === 3) { c.armL.rotation.x = live ? -1.2 + Math.sin(time*16)*.5 : -.3; c.armR.rotation.x = live ? -1.2 - Math.sin(time*16)*.5 : -.3; }
    if (i === 0) c.armR.rotation.x = live ? -2.6 + Math.sin(time*3)*.3 : -.2;
  });
  if (!live) return;
  GIG.on -= dt;
  // the crowd jumps along, notes float up, and the music plays if you are close enough to hear
  for (const m of movers) if (m.fan && m.i >= m.path.length - 1) { m.wait = 1; m.c.g.position.y = Math.max(0, Math.sin(time*8 + m.c.g.position.x*3))*.25; m.c.armL.rotation.x = m.c.armR.rotation.x = -2.6; m.c.g.rotation.y = Math.PI; }
  if ((GIG.noteT -= dt) <= 0) {
    GIG.noteT = .25;
    particle([0xff4fb0, 0x5af0ff, 0xffd36b][R()*3|0], new THREE.Vector3(GIG.at[0] + (R() - .5)*5, 2.2, GIG.at[1] + 1), new THREE.Vector3((R() - .5), 1.4, .4), 1.6, .09);
    const near = Math.hypot(player.pos.x - GIG.at[0], player.pos.z - GIG.at[1]) < 22;
    if (near) { GIG.beat++; snd(SCALE[(GIG.beat*3 + (GIG.beat >> 3)) % SCALE.length], .18, 'triangle', .025); if (GIG.beat % 2 === 0) snd(65, .08, 'square', .03); }
  }
  if (GIG.on <= 0) {
    const pay = Math.round(GIG.fans * (150 + 30*W.era) * [1, 1, 2, 3][ARENA.lv]);
    addCash(CASH.concert, pay, {x:57.6, z:90.1});
    popText(`🎟️ +${pay} tickets`, new THREE.Vector3(57.6, 3, 90.1), '#ffe06b');
    for (const s of strollers) if (s.need) s.need.fun = 100;
    // fans head home
    for (const m of movers) if (m.fan) { m.fan = false; m.wait = 0; m.path.push([59.5 - R()*8, 90.4], [61, 90.4]); }
  }
}

