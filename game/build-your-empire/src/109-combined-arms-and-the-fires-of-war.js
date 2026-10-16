// ------------------------------------------------------------------ combined arms, and the fires of war
const WARFIRE = {list:[], t:8, tanks:[], navyT:0, was:false, flames:[]};
const FLAME_MAT = [0xff5a1f, 0xff9d2e, 0xffd75e].map(c => new THREE.MeshBasicMaterial({color:c, transparent:true, opacity:.9, toneMapped:false}));
// a fire with no light of its own (lots of them burn at once)
function warFlame(x, y, z, sz = 1, life = 30) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(sz); scene.add(g);
  FLAME_MAT.forEach((m, i) => { const c = new THREE.Mesh(G.cone, m); c.scale.set(.5 - i*.13, 1.2 - i*.28, .5 - i*.13); c.position.set((R() - .5)*.3, .55 - i*.1, (R() - .5)*.3); g.add(c); });
  const F = {g, t:life, ph:R()*6, x, z}; WARFIRE.list.push(F); return F;
}
// who is attacking right now, and where
function foesNow() {
  if (INV.on) return INV.units;
  if (W.raid && W.raid.siege) return SIEGE.foes.filter(f => f.alive);
  const C = W.camp; if (C && C.away && C.type === 'land' && C.t <= 24 && C.t > 9) return enemies.filter(e => e.alive);
  return null;
}
function sortieTarget() {
  if (BOSS.on) return {x:BOSS.on.g.position.x, z:BOSS.on.g.position.z};
  const F = foesNow(); if (!F || !F.length) return null;
  return {x:F.reduce((a, f) => a + f.pos.x, 0)/F.length, z:F.reduce((a, f) => a + f.pos.z, 0)/F.length, foes:F};
}
// a bomb or shell lands: a blast, a fire, and whoever is close is down
function warHit(to, r, dmg, burn) {
  for (let k = 0; k < 12; k++) particle([0xffd040, 0xff7a2a, 0x555555][k % 3], to.clone().setY(.4), new THREE.Vector3((R() - .5)*6, 2 + R()*4, (R() - .5)*6), .9, .3, {grow:.6, op:.85});
  if (burn && R() < .6) warFlame(to.x, 0, to.z, .7 + R()*.5, 18 + R()*14);
  if (watchingWar() || Math.hypot(to.x - player.pos.x, to.z - player.pos.z) < 30) shakeCam(.2);
  if (INV.on) { for (let k = INV.units.length - 1; k >= 0; k--) { const e = INV.units[k]; if (Math.hypot(e.pos.x - to.x, e.pos.z - to.z) < r && R() < .7) { scene.remove(e.char.g); stacks.delete(e.stack); const q = ENTS.indexOf(e); if (q >= 0) ENTS.splice(q, 1); INV.units.splice(k, 1); } } return; }
  for (const f of [...SIEGE.foes, ...enemies]) if (f.alive && Math.hypot(f.pos.x - to.x, f.pos.z - to.z) < r) { f.hp -= dmg; if (f.hp <= 0) knockOut(f); }
}
// set one of your buildings alight; left burning, it burns down
function setAblaze(st) {
  if (!st || st.broken || st.ruin || !st.inZ) return;
  const [x, z] = st.inZ; st.broken = true; st.busy = false; st.warFire = 75;
  st.repairZone = addZone({kind:'repair', st:st.id, x, z, icon:'🔨', tile:{alpha:1, size:92, label:'Put out', fill:'rgba(160,40,30,.6)'}});
  st.flame = warFlame(x + (R() - .5), .3, z - 1.2, 1.4, 999);
  banner(`🔥 The ${st.name} is on fire!`, W.unlocked.has('fireStation') ? 'The fire brigade is on its way. If they are too slow it burns down.' : 'Stand on the red tile to put it out before it burns down. A fire station would send trucks.');
}
function updWarArms(dt) {
  if (!started) return;
  const tgt = sortieTarget(), C = W.camp;
  // the branches set out together
  if (tgt && tgt.foes && !WARFIRE.was) {
    WARFIRE.was = true;
    const go = [planesBuilt() ? `✈️ ${planesBuilt()} fighter${planesBuilt() > 1 ? 's' : ''}` : '', W.unlocked.has('tanks') && !BOSS.on && !(C && C.away) ? '🪖 tanks' : '', W.unlocked.has('warship') && SIEGE.ships.length ? '⚓ the navy' : ''].filter(Boolean);
    if (go.length && !BOSS.on) banner('⚔️ Every branch goes!', `${go.join(', ')} ${go.length > 1 ? 'set' : 'sets'} out with the army.`);
  }
  if (!tgt) WARFIRE.was = false;
  // the tanks roll out against an army at the gates (the monsters have their own)
  const home = !BOSS.on && tgt && tgt.foes && !(C && C.away) && W.unlocked.has('tanks');
  if (home && !WARFIRE.tanks.length) BASE.tanks.forEach((b, i) => { const t = model('tank', 2.4, 'z'); if (!t) return; b.visible = false; t.position.copy(b.position); t.rotation.y = b.rotation.y; scene.add(t); WARFIRE.tanks.push({g:t, base:b, cd:1 + i*.6}); });
  for (const T of WARFIRE.tanks) {
    const p = T.g.position, [gx, gz] = home ? [tgt.x + (WARFIRE.tanks.indexOf(T) - 1)*3, tgt.z - 8] : [T.base.position.x, T.base.position.z];
    const dx = gx - p.x, dz = gz - p.z, d = Math.hypot(dx, dz);
    if (d > .4) { p.x += dx/d*Math.min(d, 4*dt); p.z += dz/d*Math.min(d, 4*dt); T.g.rotation.y = Math.atan2(dx, dz); }
    if (home && d < 12 && (T.cd -= dt) <= 0) {
      T.cd = 1.8 + R(); const f = tgt.foes[R()*tgt.foes.length|0]; if (!f) continue;
      const muzzle = p.clone().setY(1.1), to = new THREE.Vector3(f.pos.x, 0, f.pos.z);
      particle(0xffb040, muzzle, new THREE.Vector3(0, .5, 0), .2, .35);
      const sh = new THREE.Mesh(G.sph, mat(0x2a2a2e)); sh.scale.setScalar(.12); sh.position.copy(muzzle); scene.add(sh);
      flyers.push({m:sh, from:muzzle.clone(), to, t:0, dur:.5, arc:.6, done:() => warHit(to, 2, 4, true)});
      snd(80, .15, 'square', .03);
    }
  }
  if (!home && WARFIRE.tanks.length && WARFIRE.tanks.every(T => Math.hypot(T.g.position.x - T.base.position.x, T.g.position.z - T.base.position.z) < .5)) { for (const T of WARFIRE.tanks) { scene.remove(T.g); T.base.visible = true; } WARFIRE.tanks = []; }
  // the warship broadsides their ships on the river
  const ws = W.unlocked.has('warship') && boats.find(b => b.kind === 'war'), afloat = SIEGE.ships.filter(q => !q.sink && q.hp > 0);
  if (ws && afloat.length && W.raid && W.raid.siege && (WARFIRE.navyT -= dt) <= 0) {
    WARFIRE.navyT = 2.4; const q = afloat[R()*afloat.length|0];
    broadside(ws.g.position, q.g.position.clone().setY(.6), true, () => { q.hp -= 3; if (q.hp <= 0) q.sink = .01; if (R() < .5) warFlame(q.g.position.x, .3, q.g.position.z, .9, 12); });
  }
  // enemies at your walls set buildings on fire
  if (W.raid && W.raid.siege && WARFIRE.raid !== W.raid) { WARFIRE.raid = W.raid; WARFIRE.t = 3 + R()*2; WARFIRE.first = true; }
  if (W.raid && W.raid.siege && SIEGE.foes.filter(f => f.alive).length > 1 && (WARFIRE.t -= dt) <= 0) {
    WARFIRE.t = SIEGE.win ? 22 : 12; const first = WARFIRE.first; WARFIRE.first = false;
    const near = Object.values(ST).filter(st => st.inZ && !st.broken && !st.ruin).sort((a, b) => Math.hypot(a.inZ[0] - 3, a.inZ[1] - 80) - Math.hypot(b.inZ[0] - 3, b.inZ[1] - 80)).slice(0, 6);
    if (near.length && (first || R() < (SIEGE.win ? .5 : .9))) setAblaze(near[R()*near.length|0]);
  }
  // the fire truck hoses down a burning building once it is beside it
  for (const TR of [typeof CIVIC !== 'undefined' && CIVIC.truck, ...MILFIRE.trucks].filter(Boolean)) for (const st of Object.values(ST)) if (st.warFire != null && st.broken && st.inZ && Math.hypot(TR.g.position.x - st.inZ[0], TR.g.position.z - st.inZ[1]) < 3.4) {
    st.hose = (st.hose || 0) + dt;
    if (R() < dt*25) particle(0xcfefff, TR.g.position.clone().setY(1.3), new THREE.Vector3((st.inZ[0] - TR.g.position.x)*.9 + (R() - .5), 2, (st.inZ[1] - TR.g.position.z)*.9 + (R() - .5)), .6, .09, {grav:1});
    if (st.hose > 2.5) { st.hose = 0; st.broken = false; if (st.repairZone) { removeZone(st.repairZone); st.repairZone = null; } popText(`🚒 Fire out at the ${st.name}`, new THREE.Vector3(st.inZ[0], 2.8, st.inZ[1]), '#b8f0a0'); }
  }
  // burning buildings: put out, or burnt down
  for (const st of Object.values(ST)) {
    if (st.warFire == null) continue;
    if (!st.broken) { delete st.warFire; if (st.flame) st.flame.t = 0; continue; }
    if ((st.warFire -= dt) <= 0) {
      delete st.warFire; if (st.flame) st.flame.t = 0; if (st.repairZone) { removeZone(st.repairZone); st.repairZone = null; } st.broken = false;
      ruinStation(st, rebuildCost(st)); W.flags.burnedDown = (W.flags.burnedDown || 0) + 1;
      banner(`🔥 The ${st.name} burned down`, 'Rebuild it on the brown tile. Fire stations put fires out before they spread.');
    }
  }
  // a win at a rival's walls leaves their city burning
  if (C && C.away && C.win && C.t <= 9 && !C.burned && C.rival != null) {
    C.burned = true; const r = EMP.list[C.rival], K = r && CITY[r.id];
    if (K && C.bf) { const cells = K.plan.cells.slice(0, K.n).sort((a, b) => Math.hypot(a.x - C.bf[0], a.z - C.bf[1]) - Math.hypot(b.x - C.bf[0], b.z - C.bf[1])).slice(0, 8);
      for (const c of cells) for (let k = 0; k < 2; k++) warFlame(c.x + (R() - .5)*4, K.plan.y + .2, c.z + (R() - .5)*4, 1.2 + R()*.8, 60 + R()*40); }
  }
  // the flames flicker, smoke rises, and they die down in time
  for (let i = WARFIRE.list.length - 1; i >= 0; i--) {
    const F = WARFIRE.list[i]; F.t -= dt;
    if (F.t <= 0) { scene.remove(F.g); WARFIRE.list.splice(i, 1); continue; }
    const fl = 1 + Math.sin(time*13 + F.ph)*.15, fade = Math.min(1, F.t/3);
    F.g.children.forEach((c, k) => { c.scale.y = (1.2 - k*.28)*fl*fade; });
    if (R() < dt*1.5 && Math.hypot(F.x - player.pos.x, F.z - player.pos.z) < 45) particle(0x3a3a3a, F.g.position.clone().setY(F.g.position.y + 1.4*F.g.scale.y), new THREE.Vector3((R() - .5)*.4, 1.6, (R() - .5)*.4), 2.2, .45*F.g.scale.y, {grow:1.4, op:.5});
  }
}
