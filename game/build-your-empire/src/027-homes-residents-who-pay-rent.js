// ------------------------------------------------------------------ homes: residents who pay rent
const HOMES = [];
function addHome(x, z, kind) {
  const r = entity({body:CLOTHES[HOMES.length*3 % CLOTHES.length], hat:kind === 'house' ? 'beanie' : 'hood', hatCol:CLOTHES[(HOMES.length*5 + 2) % CLOTHES.length],
    skin:SKINS[HOMES.length % SKINS.length], pants:0x3a3a4a}, x + .95, z + 1.45, 2, 0);
  r.yaw = 0.3;
  HOMES.push({x, z, kind, r, t:6 + HOMES.length*3});
  smokers.push({x:x + .1, y:kind === 'house' ? 2.9 : 2.6, z:kind === 'house' ? z - .4 : z});
}
// Everyone who lives here has a job. Every other home's resident goes out to work: they walk to the nearest place of
// work, put in a shift there, and walk home again. The rest work round their own home: the garden, the fence, the step.
function residentJob(h, dt) {
  const e = h.r, i = HOMES.indexOf(h);
  h.job ||= i % 2 ? 'yard' : 'work';
  if (h.jt == null) { h.jt = 1 + (i % 5); h.phase = 'home'; }
  let goal = null;
  if (h.job === 'work') {
    if (h.phase === 'home' && (h.jt -= dt) <= 0) {
      const sts = Object.values(ST).filter(st => st.inZ && !st.broken && !st.ruin && Math.hypot(st.inZ[0] - h.x, st.inZ[1] - h.z) < 40);
      const st = sts.sort((a, b) => Math.hypot(a.inZ[0] - h.x, a.inZ[1] - h.z) - Math.hypot(b.inZ[0] - h.x, b.inZ[1] - h.z))[i % Math.max(1, Math.min(3, sts.length))];
      if (st) { h.phase = 'toWork'; h.at = [st.inZ[0] + (R() - .5)*1.6, st.inZ[1] + .9 + R()*.6]; } else h.jt = 5;
    }
    if (h.phase === 'toWork') { goal = h.at; if (goTo(e, ...h.at, dt)) { h.phase = 'shift'; h.jt = 9 + R()*7; } }
    else if (h.phase === 'shift') { goal = null; if ((h.jt -= dt) <= 0) h.phase = 'goHome'; }
    else if (h.phase === 'goHome') { goal = [h.x + .95, h.z + 1.45]; if (goTo(e, ...goal, dt)) { h.phase = 'home'; h.jt = 4 + R()*4; } }
    else { goal = null; }
    if (!goal || h.phase === 'shift' || h.phase === 'home') {
      // at work, or at home between shifts: busy with their hands (a broom on the step at home)
      e.vel.set(0, 0, 0);
      if ((h.act = (h.act || 0) - dt) <= 0) { h.act = 1.2 + R()*.8; qnAct(e.char, h.phase === 'shift' ? (R() < .5 ? 'fix' : 'pick') : 'pick', 1); }
    }
  } else {
    // the yard: a few spots round the house, a little work at each
    if (!h.spot || (h.phase === 'yardWork' && (h.jt -= dt) <= 0)) { const a = R()*Math.PI*2; h.spot = [h.x + Math.cos(a)*1.9, h.z + 1.6 + Math.abs(Math.sin(a))*1.1]; h.phase = 'yardGo'; }
    if (h.phase === 'yardGo') { if (goTo(e, ...h.spot, dt)) { h.phase = 'yardWork'; h.jt = 2.5 + R()*2.5; } }
    else { e.vel.set(0, 0, 0); if ((h.act = (h.act || 0) - dt) <= 0) { h.act = 1.1 + R()*.7; qnAct(e.char, R() < .6 ? 'fix' : 'pick', 1); } }
  }
  animEntity(e, dt);
}
let lotRentT = 20;
const RENT = {small:0, last:0};
function updHomes(dt) {
  if (started && (lotStage.some(s => s) || RENT.small || STRIP.lots.stripHotel) && (lotRentT -= dt) <= 0) {
    lotRentT = 20; let roll = 0;
    // the Strip's resort rooms rent out too
    if (STRIP.lots.stripHotel) { const r = Math.round(3000*(1 + .45*W.era)); W.coins += r; W.earned += r; roll += r; }
    for (const d of dwellings()) {
      if (!d.k.startsWith('lot')) continue;
      const rent = rentFor(d); if (!rent) continue;
      W.coins += rent; W.earned += rent; roll += rent;
      popText(`+${rent} rent · ${OCC[d.k]} 🧑`, new THREE.Vector3(d.x, d.top, d.z), '#ffe06b');
    }
    // homes and huts pay on their own clocks; add what they paid since the last roll
    roll += RENT.small; RENT.small = 0; RENT.last = roll;
    if (roll) popText(`🏠 +${roll.toLocaleString()} rent`, player.pos.clone().setY(3.4), '#c8f0a0');
  }
  for (const h of HOMES) {
    residentJob(h, dt);
    if (!started || (h.t -= dt) > 0) continue;
    h.t = 20;
    const hs = h.kind === 'hut' ? (Object.entries(HUTS).find(([, H]) => H.x === h.x && H.z === h.z)?.[0]) : `h${h.x},${h.z}`;
    const d = dwellings().find(d => d.k === hs), rent = d ? rentFor(d) : 0;
    if (!rent) continue;
    W.coins += rent; W.earned += rent; RENT.small += rent;
    popText(`+${rent} rent · ${OCC[d.k]} 🧑`, new THREE.Vector3(h.x, 3, h.z), '#ffe06b');
  }
}

