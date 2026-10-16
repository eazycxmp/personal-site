// ------------------------------------------------------------------ monsters: a Godzilla-like kaiju (and the dragon before it) against the forces you actually own
function kaijuModel() {
  const src = MODELS.kaiju; if (!src) return null;
  const g = new THREE.Group(), m = src.clone(true); g.add(m);
  const bb = MODEL_BB.kaiju ||= new THREE.Box3().setFromObject(src), s = 9 / (bb.max.y - bb.min.y);
  m.position.y = -bb.min.y; g.scale.setScalar(s);
  const P = {}; m.traverse(o => { if (o.name) P[o.name] = o; });
  // the dorsal plates get their own material so they can glow before the atomic breath
  m.traverse(o => { if (o.isMesh) { const mats = Array.isArray(o.material) ? o.material : [o.material]; mats.forEach((mt, i) => { if (mt.name === 'plates') { const c = mt.clone(); c.emissive = new THREE.Color(0x3ab0ff); c.emissiveIntensity = 0; P.plateMat = c; if (Array.isArray(o.material)) o.material[i] = c; else o.material = c; } }); } });
  g.parts = P; return g;
}
// what you can throw at it, and how hard each hits per second
function bossForces() {
  const troop = 1 + .15*(W.troop || 0), guns = W.unlocked.has('guns') ? 1.5 : 1;
  return {
    soldiers:(Math.min(24, W.army) + 2*Math.sqrt(Math.max(0, W.army - 24))) * .07 * troop * guns,
    tanks:W.unlocked.has('tanks') ? 3 * 1.4 : 0,
    planes:planesBuilt() * 1.6,
    warship:W.unlocked.has('warship') ? 1 : 0,
    castle:(W.castle || 0) >= 4 ? 1.5 : (W.castle || 0) >= 3 ? 1 : 0};
}
const BOSS_UNITS = {tanks:[], jets:[]};
function startBoss() {
  // in the modern age the kaiju and the dragon take turns
  const kind = W.era >= 8 && (W.flags.bossN = (W.flags.bossN || 0) + 1) % 2 ? 'kaiju' : 'dragon', g = kind === 'kaiju' ? (kaijuModel() || makeBoss(kind)) : (dragonModel() || makeBoss(kind));
  if (SKYD.g) { scene.remove(SKYD.g); if (SKYD.fx.g) { scene.remove(SKYD.fx.g); scene.remove(SKYD.fx.light); } SKYD.g = null; SKYD.t = 200; }
  scene.add(g);
  const hp = kind === 'kaiju' ? 90 + 15*W.era : 50 + 8*W.era, F = bossForces(), dps = Object.values(F).reduce((a, b) => a + b, 0);
  const tough = Math.max(hp, Math.round(dps*40));
  BOSS.on = {kind, g, hp:tough, maxHp:tough, t:0, burnT:6, shotT:0, F, dps, pos:new THREE.Vector3(-13.6, -9, -48), target:null, breath:0};
  $('bossBar').hidden = false; $('bossName').textContent = kind === 'dragon' ? '🐉 The Red Dragon' : '🦖 The Kaiju';
  const have = Object.entries(F).filter(([, v]) => v > 0).map(([k]) => ({soldiers:'🪖 soldiers', tanks:'🛡️ tanks', planes:'✈️ planes', warship:'⚓ warship', castle:'🏰 castle guns'})[k]);
  banner(kind === 'dragon' ? '🐉 A dragon attacks!' : '🦖 A kaiju rises from the river!', have.length ? `Fighting back: ${have.join(', ')}.` : 'You have nothing that can fight it. It will wreck the town until it leaves.');
  snd(70, 1.2, 'sawtooth', .07, .5); shakeCam(.6);
  // tanks roll out through the south gate, jets scramble from the airfield
  if (F.tanks) for (let i = 0; i < 3; i++) { const t = model('tank', 2.4, 'z'); if (!t) break; if (BASE.tanks[i]) BASE.tanks[i].visible = false; t.position.set(BASE.tanks[i] ? BASE.tanks[i].position.x : 3 + (i - 1)*1.6, 0, BASE.tanks[i] ? BASE.tanks[i].position.z : 76 + i); scene.add(t); BOSS_UNITS.tanks.push({g:t, cd:R()*2, ph:i}); }
}
function bossHit(from, to, color, size, dur, arc) {
  const b = new THREE.Mesh(G.sph, new THREE.MeshBasicMaterial({color, toneMapped:false})); b.scale.setScalar(size); b.position.copy(from); scene.add(b);
  flyers.push({m:b, from:from.clone(), to:to.clone(), t:0, dur, arc, done:() => { for (let i = 0; i < 6; i++) particle(i % 2 ? 0xff7a2a : 0xffd040, to, new THREE.Vector3((R() - .5)*3, 2 + R()*2, (R() - .5)*3), .6, .3, {grav:1}); }});
}
function updBoss(dt) {
  if (!started) return;
  if (!BOSS.on) { if (W.era >= 4 && !W.camp && !W.raid && (BOSS.t -= dt) <= 0) { BOSS.t = 780 + R()*480; startBoss(); } return; }
  const B = BOSS.on, g = B.g; B.t += dt;
  if (B.kind === 'dragon') {
    // wide loops over the kingdom; every few seconds it picks a building, swoops low and burns it
    B.fx ||= {}; B.vel ||= new THREE.Vector3(); B.mode ||= 'loop';
    if (B.t < .05) g.position.set(-60, 14, -40);
    let want, sp = 11;
    if (B.mode === 'loop') {
      const a = B.t*.22; want = new THREE.Vector3(10 + Math.cos(a)*34, 7.5 + Math.sin(B.t*.9)*1.5, 14 + Math.sin(a*2)*26);
      if (B.t > 8 && (B.burnT -= dt) <= 0) {
        B.target = Object.values(ST).filter(s => s.inZ && !s.ruin && s.id !== 'grill').sort(() => R() - .5)[0] || null;
        if (B.target) B.mode = 'swoop'; else B.burnT = 6;
      }
    }
    let to = null;
    if (B.mode !== 'loop' && B.target) {
      to = new THREE.Vector3(B.target.inZ[0], 1, B.target.inZ[1]);
      const from = g.position, dx = from.x - to.x, dz = from.z - to.z, d = Math.hypot(dx, dz) || 1;
      want = new THREE.Vector3(to.x + dx/d*8, 6.5, to.z + dz/d*8);
      if (B.mode === 'swoop' && g.position.distanceTo(want) < 2.5) { B.mode = 'burn'; B.breath = 2.6; }
      if (B.mode === 'burn') { sp = 1.5; B.breath -= dt;
        if (B.breath <= 0) { ruinStation(B.target, rebuildCost(B.target)); W.flags.dragonBurns = (W.flags.dragonBurns || 0) + 1; shakeCam(.4); snd(60, .5, 'sawtooth', .05, .5); B.target = null; B.mode = 'loop'; B.burnT = 9 + R()*5; } }
    } else if (B.mode !== 'loop') B.mode = 'loop';
    // fly toward it: steer the velocity, bank into the turns
    const dv = want.clone().sub(g.position), dd = dv.length();
    B.vel.lerp(dv.normalize().multiplyScalar(Math.min(sp, dd*1.5)), Math.min(1, dt*1.6)); g.position.addScaledVector(B.vel, dt);
    const yaw = B.mode === 'burn' && to ? Math.atan2(to.x - g.position.x, to.z - g.position.z) : Math.atan2(B.vel.x, B.vel.z);
    let dy = yaw - g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); g.rotation.order = 'YXZ'; g.rotation.y += dy*Math.min(1, dt*2.5);
    g.rotation.z += (-dy*.9 - g.rotation.z)*Math.min(1, dt*2); g.rotation.x = B.mode === 'burn' ? .32 : -B.vel.y*.04;
    flapDragon(g, B.t, B.mode === 'burn' ? 7 : 4.5);
    const P = g.parts || {}; if (P.jaw) P.jaw.rotation.x = B.mode === 'burn' ? .5 : 0;
    g.updateMatrixWorld(true); const mouth = new THREE.Vector3(0, 1.5, 4.6).applyMatrix4(g.matrixWorld);
    flameJet(B.fx, mouth, to || mouth, B.mode === 'burn' && B.breath < 2.3, dt);
  } else {
    // it wades out of the river, then stomps toward whatever is standing
    const P = g.parts || {}, rise = Math.min(1, B.t/4);
    if (!B.target || B.target.ruin) B.target = Object.values(ST).filter(s => s.inZ && !s.ruin && s.id !== 'grill').sort((a, b) => Math.hypot(a.inZ[0] - B.pos.x, a.inZ[1] - B.pos.z) - Math.hypot(b.inZ[0] - B.pos.x, b.inZ[1] - B.pos.z))[0] || null;
    const tx = B.target ? B.target.inZ[0] : 3, tz = B.target ? B.target.inZ[1] : 0, dx = tx - B.pos.x, dz = tz - B.pos.z, d = Math.hypot(dx, dz);
    const walking = B.t > 4 && d > 3.5 && B.breath <= 0;
    if (walking) { B.pos.x += dx/d*dt*1.3; B.pos.z += dz/d*dt*1.3; }
    B.pos.y = -9 + rise*9;
    g.position.copy(B.pos); g.rotation.y += (Math.atan2(dx, dz) - g.rotation.y) * Math.min(1, dt*2);
    const w = B.t*2.2;
    if (P.legL) { P.legL.rotation.x = walking ? Math.sin(w)*.35 : 0; P.legR.rotation.x = walking ? -Math.sin(w)*.35 : 0; }
    if (P.tail) P.tail.rotation.z = Math.sin(B.t*1.3)*.25;
    if (P.armL) { P.armL.rotation.x = -.4 + Math.sin(B.t*3)*.2; P.armR.rotation.x = -.4 - Math.sin(B.t*3)*.2; }
    if (walking && (B.stomp = (B.stomp || 0) - dt) <= 0) { B.stomp = Math.PI/2.2; shakeCam(.25); snd(45, .3, 'sawtooth', .05); }
    // the atomic breath: the plates glow blue, the jaw drops, a beam wrecks a building
    if (!walking && B.t > 5 && (B.burnT -= dt) <= 0 && B.breath <= 0) B.breath = 2.4;
    if (B.breath > 0) {
      B.breath -= dt;
      if (P.plateMat) P.plateMat.emissiveIntensity = 2.5 * Math.min(1, (2.4 - B.breath)*2);
      if (P.jaw) P.jaw.rotation.x = .5;
      if (B.breath < 1.2 && B.target) {
        const mouth = new THREE.Vector3(0, 6.2, -1.6).applyMatrix4(g.matrixWorld), to = new THREE.Vector3(B.target.inZ[0], 1, B.target.inZ[1]);
        B.fx ||= {}; B.fxOn = true; flameJet(B.fx, mouth, to, true, dt); for (const c of B.fx.cones) c.scale.x = c.scale.y = c.userData.r*1.5;
      }
      if (B.breath <= 0) {
        if (B.fx) flameJet(B.fx, null, null, false, dt); if (P.plateMat) P.plateMat.emissiveIntensity = 0; if (P.jaw) P.jaw.rotation.x = 0;
        B.burnT = 7 + R()*4;
        if (B.target) { ruinStation(B.target, rebuildCost(B.target)); W.flags.kaijuRuins = (W.flags.kaijuRuins || 0) + 1; shakeCam(.5); snd(60, .6, 'sawtooth', .06, .5); B.target = null; }
      }
    }
  }
  // your forces fight back, each with its own fire
  const F = B.F, aim = () => g.position.clone().add(new THREE.Vector3((R() - .5)*2, B.kind === 'kaiju' ? 3 + R()*4 : (R() - .5), (R() - .5)*2));
  B.hp -= B.dps * dt;
  if (F.soldiers && soldiers.length && (B.shotT -= dt) <= 0) { B.shotT = .15; bossHit(soldiers[R()*soldiers.length|0].pos.clone().setY(1.4), aim(), 0xffe08a, .06, .35, 0); }
  BOSS_UNITS.tanks.forEach((t, i) => {
    const p = t.g.position, dx = g.position.x - p.x, dz = g.position.z - p.z, d = Math.hypot(dx, dz);
    if (d > 9) { p.x += dx/d*dt*2.4; p.z += dz/d*dt*2.4; }
    t.g.rotation.y = Math.atan2(dx, dz);
    if ((t.cd -= dt) <= 0 && d < 16) { t.cd = 1.8 + R(); const muzzle = p.clone().add(new THREE.Vector3(dx/d*1.6, 1.1, dz/d*1.6)); particle(0xffb040, muzzle, new THREE.Vector3(0, .5, 0), .2, .35); bossHit(muzzle, aim(), 0x2a2a2e, .12, .5, .6); snd(80, .15, 'square', .04); }
  });
  for (const p of planes) if ((p.alt || 0) > 3 && (p.bossCd = (p.bossCd || 0) - dt) <= 0) { p.bossCd = 1.2; bossHit(p.g.position.clone(), aim(), 0xff6a2a, .1, .45, .2); }
  BOSS_UNITS.jets.forEach(j => {
    j.a += dt*.9; const r = 13, c = g.position;
    j.g.position.set(c.x + Math.cos(j.a)*r, 9 + Math.sin(j.a*2)*1.5, c.z + Math.sin(j.a)*r); j.g.rotation.set(0, -j.a, -.6);
    if ((j.cd -= dt) <= 0) { j.cd = 1.4; bossHit(j.g.position, aim(), 0xff6a2a, .1, .45, .2); }
  });
  if (F.warship && R() < dt*.8) { const w = boats.find(b => b.kind === 'war'); if (w) broadside(w.g.position, aim(), true); }
  $('bossFill').style.width = Math.max(0, B.hp / B.maxHp * 100) + '%';
  if (B.hp <= 0 || B.t > 80) {
    const won = B.hp <= 0, pay = won ? 5000 + 2500*W.era : 0;
    if (won) { W.coins += pay; W.earned += pay; W.flags.boss = (W.flags.boss || 0) + 1; for (let i = 0; i < 30; i++) particle([0xffd84a, 0xff6a2a, 0xffffff][i % 3], g.position.clone().setY(4), new THREE.Vector3((R() - .5)*8, 4 + R()*6, (R() - .5)*8), 1.4, .3, {grav:1}); }
    if (B.fx && B.fx.g) { scene.remove(B.fx.g); scene.remove(B.fx.light); }
    banner(won ? `🏆 The ${B.kind} is defeated!` : `The ${B.kind} ${B.kind === 'kaiju' ? 'sinks back into the sea' : 'flies off'}…`, won ? `Your empire takes ${pay} 💵 in treasure.` : 'Buy tanks, planes and bigger walls before it comes back.');
    scene.remove(g); if (B.beam) scene.remove(B.beam);
    for (const u of [...BOSS_UNITS.tanks, ...BOSS_UNITS.jets]) scene.remove(u.g); BOSS_UNITS.tanks = []; BOSS_UNITS.jets = []; BASE.tanks.forEach(t => { t.visible = true; });
    BOSS.on = null; $('bossBar').hidden = true; save();
  }
}

