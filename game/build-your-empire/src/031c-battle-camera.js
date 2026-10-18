// ------------------------------------------------------------------ the battle camera: slow motion, a circling camera, and leading the charge
// While you watch a battle the camera slowly circles it, and at the big moments (the charge, the gate giving way, their
// headquarters falling) time slows for a breath while the camera drops in low. Or lead the charge yourself: your hero
// rides into the fight, strikes hard, and comes home when it is won.
const SLOW = {t:0, k:1};
function slowmo(dur) { if (watchingWar()) SLOW.t = Math.max(SLOW.t, dur); }
// the game clock's speed this frame (real seconds in, game seconds out)
function slowScale(real) {
  if (SLOW.t > 0) SLOW.t -= real;
  SLOW.k += ((SLOW.t > 0 ? .3 : 1) - SLOW.k) * Math.min(1, real*6);
  return SLOW.k;
}
const CINE = {a:0, d:1, h:1};
// how the watching camera sits: drifting round the field, lower and closer in slow motion
function cineCam(dt) {
  CINE.a += dt*.09;
  const low = SLOW.t > 0 || SLOW.k < .8;
  CINE.d += ((low ? .62 : 1) - CINE.d)*Math.min(1, dt*2.5); CINE.h += ((low ? .5 : 1) - CINE.h)*Math.min(1, dt*2.5);
  return {yaw:Math.sin(CINE.a)*.75, d:CINE.d, h:CINE.h};
}
// ------------------------------------------------------------------ leading the charge
const LEAD = {on:false, home:null, id:null, cd:0, backT:0};
const leadable = C => !!C && C.type === 'land' && (armyGoes(C) || cavGoes(C)) && C.t > 9;
function startLead() {
  const C = W.camp; if (!leadable(C) || LEAD.on) return;
  LEAD.on = true; LEAD.home = player.pos.clone(); LEAD.id = C.id ||= Math.random(); LEAD.backT = 0;
  // to the front at once: your hero joins the army where it stands
  const [fx, fz] = [BF.x - 1, BF.z - 6]; puff(player.pos.x, player.pos.z); player.pos.set(fx, 0, fz); puff(fx, fz);
  setWatch(true); banner('⚔️ You lead the charge!', 'Your hero fights at the front. Stay with your army until the battle is won.');
}
function updLead(dt) {
  const b = $('bLead'); if (b) b.hidden = !leadable(W.camp) || LEAD.on || !started;
  if (!LEAD.on) return;
  const C = W.camp, live = C && C.id === LEAD.id;
  // the battle is over: a moment to cheer, then home again
  if (!live || C.t <= 7.5) {
    testIn.x = testIn.y = 0;
    if ((LEAD.backT += dt) > 2.5) { puff(player.pos.x, player.pos.z); player.pos.copy(LEAD.home); puff(LEAD.home.x, LEAD.home.z); LEAD.on = false; setWatch(false); note('🏠 Home from the battle', 'Your hero rides back to your city.'); }
    return;
  }
  // where to go: the front of the line, the nearest enemy, or (storming a city) on to their headquarters
  const alive = enemies.filter(e => e.alive), AD = C.assault && DEF[EMP.list[C.rival]?.id];
  let tx = BF.x - 1, tz = BF.z - 4.5, foe = null;
  if (AD) [tx, tz] = assaultSpot(AD, 30, C.t);
  else if (C.t <= 22 && alive.length) { foe = nearest(player, alive); tx = foe.pos.x; tz = foe.pos.z; }
  const dx = tx - player.pos.x, dz = tz - player.pos.z, d = Math.hypot(dx, dz);
  if (d > (foe ? 1.1 : .4)) { testIn.x = dx/d; testIn.y = dz/d; } else { testIn.x = testIn.y = 0; }
  if (foe && d < 1.4 && (LEAD.cd -= dt) <= 0) {
    LEAD.cd = .45; strike(player, foe, false, 4);
    const kd = d || 1; foe.pos.x += dx/kd*.5; foe.pos.z += dz/kd*.5;
    if (!foe.alive) { popText('💥', new THREE.Vector3(foe.pos.x, 2.4, foe.pos.z), '#ffe06b'); if (R() < .3) slowmo(.6); }
  }
}
