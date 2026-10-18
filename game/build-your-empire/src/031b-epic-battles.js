// ------------------------------------------------------------------ the spectacle of a land battle
// A war horn as the lines face off, a standard on each side, volleys of arrows (a rolling musket volley once you have
// guns), artillery behind your line, a cry of "Charge!" with dust kicked up by the running ranks, drums through the
// fight, haze over the field, and a fanfare when they break. Looks only: who wins is still decided by the odds.
const EPIC = {id:null, g:null, last:99, drumT:0, gunT:0, hazeT:0, dust:new Map()};
const epicOn = C => !!C && C.type === 'land' && !C.assault && (armyGoes(C) || cavGoes(C));
function banner3d(col, trim) {
  const g = new THREE.Group();
  mesh(G.cyl, 0x5e3f22, [.05, 3.4, .05], [0, 1.7, 0], g); mesh(G.sph, 0xd9a52a, [.1, .1, .1], [0, 3.45, 0], g, {metalness:.7, roughness:.3});
  const flag = new THREE.Group(); flag.position.set(0, 3.05, 0); g.add(flag);
  mesh(G.box, col, [.04, .7, 1], [0, 0, -.5], flag); mesh(G.box, trim, [.05, .12, 1], [0, -.29, -.5], flag);
  g.flag = flag; return g;
}
function epicStart(C) {
  epicEnd(); EPIC.id = C.id ||= Math.random(); EPIC.last = 99;
  const g = EPIC.g = new THREE.Group(); scene.add(g);
  EPIC.ours = banner3d(0x2d4fa8, 0xf2c200); EPIC.theirs = banner3d(0x9a1a1a, 0x2a1a10); g.add(EPIC.ours, EPIC.theirs);
  EPIC.ours.position.set(BF.x, 0, BF.z - 6); EPIC.theirs.position.set(BF.x, 0, BF.z + 6);
  // artillery behind your line: catapults, or cannon once you have guns
  EPIC.guns = W.unlocked.has('siegeWorks') || wepLvl() >= 2 ? [-5, 5].map(dx => {
    const a = new THREE.Group(); a.position.set(BF.x + dx, 0, BF.z - 10); g.add(a);
    if (wepLvl() >= 2) { mesh(G.cyl, 0x2a2a2e, [.22, 1.5, .22], [0, .55, .2], a, {metalness:.6}).rotation.x = Math.PI/2 - .35; for (const sx of [-.3, .3]) mesh(G.cyl, 0x5e3f22, [.4, .08, .4], [sx, .4, 0], a).rotation.z = Math.PI/2; }
    else { mesh(G.box, 0x6b4526, [.9, .3, 1.4], [0, .3, 0], a); const arm = new THREE.Group(); arm.position.set(0, .5, -.3); a.add(arm); mesh(G.box, 0x8a5a2b, [.12, .12, 1.8], [0, .4, .7], arm).rotation.x = -.5; a.arm = arm; }
    a.cd = 1 + R(); return a;
  }) : [];
}
function epicEnd() { if (EPIC.g) scene.remove(EPIC.g); EPIC.g = null; EPIC.id = null; EPIC.dust.clear(); }
const mid = list => { let x = 0, z = 0, n = 0; for (const e of list) { x += e.pos.x; z += e.pos.z; n++; } return n ? [x/n, z/n] : null; };
// a volley: arrows (or musket balls) arcing from one line onto the other; a few find their mark
function volley(fromList, toList, n, hitEnemies) {
  if (!fromList.length || !toList.length) return;
  const guns = wepLvl() >= 2 && hitEnemies;
  for (let i = 0; i < n; i++) {
    const a = fromList[i % fromList.length], t = toList[(i*7) % toList.length];
    const from = new THREE.Vector3(a.pos.x + (R() - .5)*.6, 1.4, a.pos.z), to = new THREE.Vector3(t.pos.x + (R() - .5)*2.4, .1, t.pos.z + (R() - .5)*2.4);
    if (guns) { particle(0xe8e8e8, from, new THREE.Vector3((R() - .5)*.4, .5, .6), 1.6, .45, {grow:1.1, op:.55}); particle(0xffd070, from, new THREE.Vector3(0, .2, 0), .1, .18); }
    const m = new THREE.Mesh(G.cyl, mat(0x3a2a1a)); m.scale.set(.03, .5, .03); m.rotation.x = Math.PI/2; m.position.copy(from); scene.add(m);
    flyers.push({m, from, to, t:0, dur:guns ? .3 + R()*.15 : 1 + R()*.5, arc:guns ? .2 : 3.2, done:() => {
      particle(0xc8b48a, to, new THREE.Vector3(0, .8, 0), .5, .18, {grow:.6, op:.6});
      if (hitEnemies) { const e = enemies.find(q => q.alive && Math.hypot(q.pos.x - to.x, q.pos.z - to.z) < .7); if (e && R() < .3) { e.hp -= .5; e.hit = .18; if (e.hp <= 0) knockOut(e); } }
    }});
  }
  snd(guns ? 120 : 700, guns ? .15 : .25, guns ? 'sawtooth' : 'triangle', .03, guns ? .5 : -.6);
}
function updEpic(dt) {
  const C = W.camp || W.raid;
  if (!epicOn(C)) { if (EPIC.g) epicEnd(); return; }
  const ph = C.t; if (ph > 24) return;
  if (EPIC.id !== (C.id ||= Math.random())) epicStart(C);
  const near = camera.position.distanceToSquared(new THREE.Vector3(BF.x, 0, BF.z)) < 90*90;
  const ours = soldiers.filter(s => !s.down && atBattle(s)).concat(CHARGE.riders.filter(r => r.g.visible && atBattle(r))), foes = enemies.filter(e => e.alive);
  const crossed = t => EPIC.last > t && ph <= t;
  // the standards follow their lines and stream in the wind
  const mo = mid(ours), mf = mid(foes);
  if (mo) EPIC.ours.position.lerp(new THREE.Vector3(mo[0] - 1.2, 0, mo[1] - 1.6), Math.min(1, dt*2));
  if (mf) EPIC.theirs.position.lerp(new THREE.Vector3(mf[0] + 1.2, 0, mf[1] + 1.6), Math.min(1, dt*2));
  EPIC.theirs.visible = !!mf;
  for (const b of [EPIC.ours, EPIC.theirs]) b.flag.rotation.y = Math.sin(time*3 + b.position.x)*.35 - .4;
  // the horn as the lines face off; arrows (or the first volley) before the charge
  if (crossed(23.5)) { snd(98, .9, 'sawtooth', .05, .1); setTimeout(() => snd(131, 1.1, 'sawtooth', .05, .05), 900); }
  if (crossed(22.6)) volley(ours, foes, wepLvl() >= 2 ? Math.min(14, ours.length) : 16, true);
  if (crossed(22.1) && !wepLvl() >= 2) volley(foes, ours, 12, false);
  if (crossed(21.6)) volley(ours, foes, wepLvl() >= 2 ? Math.min(14, ours.length) : 14, true);
  if (crossed(21)) { slowmo(1.1); popText('⚔️ CHARGE!', new THREE.Vector3(BF.x, 3.2, BF.z), '#ffe06b'); snd(147, .5, 'square', .05, .2); if (watchingWar()) shakeCam(.25); }
  if (ph <= 22 && ph > 9) {
    // drums through the fight, and haze over the field
    if ((EPIC.drumT -= dt) <= 0) { EPIC.drumT = .5; snd(58, .14, 'sine', .07, -.3); }
    // (the haze is unlit, so it thins away after dark instead of glowing)
    if (near && nightK() < .5 && (EPIC.hazeT -= dt) <= 0) { EPIC.hazeT = .18; particle(0xd8c8a0, new THREE.Vector3(BF.x + (R() - .5)*14, .5, BF.z + (R() - .5)*8), new THREE.Vector3((R() - .5)*.4, .25, 0), 3, .9, {grow:1.4, op:.18}); }
    // dust kicked up by anyone running
    if (near) for (const u of [...ours, ...foes]) {
      const p = EPIC.dust.get(u) || u.pos.clone(), moved = Math.hypot(u.pos.x - p.x, u.pos.z - p.z);
      if (moved > dt*2.5 && R() < .35) particle(0xc8b48a, new THREE.Vector3(u.pos.x, .15, u.pos.z), new THREE.Vector3((R() - .5)*.6, .6, (R() - .5)*.6), .6, .2, {grow:.9, op:.5});
      EPIC.dust.set(u, u.pos.clone());
    }
    // the artillery lobs shot into the enemy ranks
    for (const a of EPIC.guns) if ((a.cd -= dt) <= 0 && foes.length) {
      a.cd = 1.6 + R()*.8;
      const t = foes[R()*foes.length|0], from = a.position.clone().setY(1.1), to = new THREE.Vector3(t.pos.x + (R() - .5)*1.6, .1, t.pos.z + (R() - .5)*1.6), gun = wepLvl() >= 2;
      if (gun) { particle(0xffb040, from.clone().setZ(from.z + .8), new THREE.Vector3(0, .4, 1), .12, .35); particle(0xdddddd, from, new THREE.Vector3(0, .8, .4), 1.6, .5, {grow:1, op:.6}); snd(70, .35, 'sawtooth', .06, .5); }
      else if (a.arm) { a.arm.rotation.x = -1.4; setTimeout(() => { if (a.arm) a.arm.rotation.x = 0; }, 400); snd(240, .1, 'triangle', .04); }
      const ball = new THREE.Mesh(G.sph, mat(gun ? 0x2a2a2a : 0x8a8478)); ball.scale.setScalar(gun ? .12 : .2); ball.position.copy(from); scene.add(ball);
      flyers.push({m:ball, from, to, t:0, dur:gun ? .8 : 1.3, arc:gun ? 3 : 5, done:() => {
        for (let k = 0; k < 12; k++) particle(gun ? [0xffd040, 0xff7a2a, 0x555555][k % 3] : [0x9a8a6a, 0x6a5a4a][k % 2], to.clone().setY(.3), new THREE.Vector3((R() - .5)*5, 1.5 + R()*3, (R() - .5)*5), .8, .25, {grow:.5, op:.85});
        snd(gun ? 50 : 80, .4, 'sawtooth', .05, .4); if (watchingWar()) shakeCam(.12);
        for (const e of enemies) if (e.alive && Math.hypot(e.pos.x - to.x, e.pos.z - to.z) < 1.4) { e.hp -= 1.2; e.hit = .18; const kx = e.pos.x - to.x, kz = e.pos.z - to.z, kd = Math.hypot(kx, kz) || 1; e.pos.x += kx/kd*.6; e.pos.z += kz/kd*.6; if (e.hp <= 0) knockOut(e); }
      }});
    }
  }
  // they break: a fanfare and the cry of victory
  if (crossed(9) && C.win !== false && !BT.lose) { popText('🏆 VICTORY!', new THREE.Vector3(BF.x, 3.6, BF.z + 2), '#ffe06b'); [392, 523, 659, 784].forEach((f, i) => setTimeout(() => snd(f, .3, 'triangle', .05), i*140)); }
  EPIC.last = ph;
}
