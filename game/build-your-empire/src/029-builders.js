// ------------------------------------------------------------------ builders
// Builders carry stone, logs, tools and scrolls from the piles to whatever unlock is waiting for them.
// builders work tiles that earn before the world wonders, stone and wood before tools and scrolls, and with you: the tile the guide is pointing at first, then tiles near you, then the ones closest to done;
// they fetch from the nearest pile that can fill the load, and two builders never haul for a tile one load will finish
const BSTAT = {items:0, dist:0, loads:0, goal:0};
// military technology is the player's own decision: builders and masons never pay for these tiles
const MIL_PADS = new Set(['hangar', 'warship', 'mess', 'barracks', 'siegeWorks', 'troop1', 'troop2', 'troop3', 'guns', 'castle', 'castle2', 'castle3', 'castle4', 'tanks', 'troop5', 'cav1', 'cav2', 'cav3', 'nav2', 'nav3', 'nav4', 'bows', 'rifles', 'semiAuto',
  'plane1', 'plane2', 'plane3', 'plane4', 'plane5', 'armorer', 'quartermaster', 'warTable', 'smith', 'hauler']);
function builderJob(w, only) {
  const piles = cur => zones.filter(z => z.kind === 'out' && z.stack.count([cur]));
  let open = Object.values(padZones).filter(z => !z.locked && z.pad.cur !== 'coin' && !MIL_PADS.has(z.pad.id) && (!only || z.pad.cur === only) && (w.stack.count([z.pad.cur]) || piles(z.pad.cur).length));
  if (!open.length) return null;
  // what earns first: the world wonders wait until nothing else is left, then stone and wood before tools and scrolls
  const wonder = z => WONDERS.some(q => q.id === z.pad.id), earn = open.filter(z => !wonder(z));
  if (earn.length) open = earn;
  const raw = open.filter(z => z.pad.cur === 'stone' || z.pad.cur === 'log');
  if (raw.length) open = raw;
  const others = workers.filter(o => o !== w && (o.kind === 'builder' || o.hauling) && o.job);
  const need = z => z.pad.cost - (W.paid[z.pad.id] || 0) - others.filter(o => o.job === z.pad).reduce((a, o) => a + Math.min(o.cap, o.job.cost), 0);
  const goal = OBJ.z && OBJ.z.pad ? OBJ.z : null;
  const score = z => {
    const rem = z.pad.cost - (W.paid[z.pad.id] || 0), dPlayer = Math.hypot(z.x - player.pos.x, z.z - player.pos.z), dMe = Math.hypot(z.x - w.pos.x, z.z - w.pos.z);
    return (z === goal ? -1000 : 0) + dPlayer*2 + dMe + rem*.5;
  };
  const free = open.filter(z => need(z) > 0);
  const pick = (free.length ? free : open).sort((a, b) => score(a) - score(b))[0];
  return pick ? pick.pad : null;
}
function builderPile(w, cur, want, pz) {
  const piles = zones.filter(z => z.kind === 'out' && z.stack.count([cur]));
  const taken = new Set(workers.filter(o => o !== w && o.kind === 'builder' && o.pile).map(o => o.pile));
  // the shortest walk there and on to the tile, but a pile that can fill the whole load is worth a detour
  return piles.map(z => ({z, cost:Math.hypot(z.x - w.pos.x, z.z - w.pos.z) + Math.hypot(z.x - pz.x, z.z - pz.z) + (z.stack.count([cur]) >= want ? 0 : 6) + (taken.has(z) && z.stack.count([cur]) < want*2 ? 5 : 0)}))
    .sort((a, b) => a.cost - b.cost)[0]?.z || null;
}
function updBuilder(w, dt, only) {
  if (w.lastP) BSTAT.dist += Math.hypot(w.pos.x - w.lastP.x, w.pos.z - w.lastP.z); else w.lastP = new THREE.Vector3();
  w.lastP.copy(w.pos);
  // look again every few seconds in case you moved on to something else
  if ((w.rethink = (w.rethink || 0) - dt) <= 0 && w.mode === 'fetch' && !w.stack.length) { w.rethink = 4; w.job = null; }
  if (!w.job || !padZones[w.job.id] || padZones[w.job.id].locked) {
    w.job = builderJob(w, only);
    w.mode = 'fetch'; w.wait = 0; w.pile = null;
    if (!w.job) { if (!only && crewWork(w, dt)) return; if (!only) { maintainRound(w, dt); return; } goTo(w, ...w.home, dt); return; }
  }
  const p = w.job, cur = p.cur, pz = padZones[p.id], rem = p.cost - (W.paid[p.id] || 0);
  while (w.stack.length > w.stack.count([cur])) { const it = w.stack.take(Object.keys(ITEM).filter(k => k !== cur)); flyAway(it.mesh, w.pos.clone().setY(0), .3); }
  const carried = w.stack.count([cur]), want = Math.max(1, Math.min(rem, w.cap));
  if (w.mode === 'fetch') {
    if (carried >= want) { w.mode = 'deliver'; return; }
    if (!w.pile || !zones.includes(w.pile) || (!w.pile.stack.count([cur]) && !carried)) { w.pile = builderPile(w, cur, want - carried, pz); w.wait = 0; }
    if (!w.pile) { if (carried) w.mode = 'deliver'; else w.job = null; return; }
    if (goTo(w, w.pile.x, w.pile.z, dt) && (w.tick -= dt) <= 0) {
      w.tick = .05;
      if (w.pile.stack.count([cur])) { transfer(w.pile.stack, w.stack, [cur]); w.wait = 0; }
      // the pile ran dry: try the next nearest, or bring what we have
      else if ((w.wait += .05) > 1) { const nx = builderPile(w, cur, want - carried, pz); if (nx && nx !== w.pile) { w.pile = nx; w.wait = 0; } else w.mode = 'deliver'; }
    }
  } else {
    if (!carried) { w.mode = 'fetch'; w.pile = null; return; }
    if (goTo(w, pz.x, pz.z, dt) && (w.tick -= dt) <= 0) {
      w.tick = .04;
      const it = w.stack.take([cur]);
      flyAway(it.mesh, new THREE.Vector3(pz.x, .1, pz.z), .25);
      W.paid[p.id] = (W.paid[p.id] || 0) + 1; BSTAT.items++; if (OBJ.z && OBJ.z.pad === p) BSTAT.goal++; snd(200 + carried*15, .04, 'square', .02);
      if (!w.stack.count([cur])) BSTAT.loads++;
      if (W.paid[p.id] >= p.cost) { w.job = null; unlock(p.id, true); } else refreshPads();
    }
  }
}
// treasurers split the cash piles between them, going for the most money per step
function treasurerPile(w) {
  const taken = new Set(workers.filter(o => o !== w && o.kind === 'treasurer' && o.pile).map(o => o.pile));
  return Object.values(CASH).filter(c => c.value > 0 && !taken.has(c)).sort((a, b) => b.value/(Math.hypot(b.x - w.pos.x, b.z - w.pos.z) + 4) - a.value/(Math.hypot(a.x - w.pos.x, a.z - w.pos.z) + 4))[0] || null;
}

// stonemasons with a full stone pile don't stand about: they carry the stone to whatever tile is waiting for it,
// then go back to the quarry once nothing needs it
// The iron hauler and the tinker: when their own run is stuck (nothing to fetch, or the smith or workshop has no room)
// they carry ingots or tools to a tile waiting on them, then go back to their run.
const IDLE_HAUL = {hauler:['ingot'], tinker:['tools', 'ingot']};
// Nobody stands around: a worker whose own job is blocked (their station full, or nothing to fetch) finds another use.
// They take what they hold to another station with room, help the builders with stone and wood, sell surplus at the
// market, or failing all that keep busy at their own station (stacking, sweeping, mending) until their job frees up.
const PURPOSE_HAUL = ['stone', 'log'];
const SELL_AT = () => zones.find(z => z.kind === 'sell');
function sellRun(w, dt) {
  const zn = SELL_AT(); if (!zn || !w.stack.length) { w.hauling = false; w.state = 'idle'; return; }
  if (!goTo(w, zn.x, zn.z, dt)) return;
  if ((w.tick -= dt) > 0) return; w.tick = .12;
  const it = w.stack.take(SELLABLE);
  if (!it) { w.hauling = false; w.state = 'idle'; return; }
  const v = ITEM[it.type].sell; W.coins += v; W.earned += v; flyAway(it.mesh, new THREE.Vector3(zn.x, 1, zn.z - 2.2), .25);
  if (dist2(player, zn.x, zn.z) < 25) popText(`+${v}`, w.pos.clone().setY(2.4 + R()*.4), '#ffe06b');
  qnAct(w.char, 'serve', .6);
}
// a builder with nothing to build does the rounds of the town, mending and checking what is already up
function maintainRound(w, dt) {
  if (!w.mend || (w.mendT -= dt) <= 0) {
    const done = Object.values(padZones).filter(z => W.unlocked.has(z.pad.id) && Math.hypot(z.x - w.home[0], z.z - w.home[1]) < 45);
    const z = done[R()*done.length|0]; w.mend = z ? [z.x + (R() - .5)*2, z.z + 1.2] : [w.home[0] + (R() - .5)*6, w.home[1] + (R() - .5)*6]; w.mendT = 14;
  }
  if (goTo(w, w.mend[0], w.mend[1], dt)) { if ((w.tick -= dt) <= 0) { w.tick = .9 + R()*.5; qnAct(w.char, 'fix', 1); if (R() < .2) w.mend = null; } }
}
// busy at the station: step between a couple of spots by it and work with their hands, then look for the job again
function tendStation(w, dt) {
  const [hx, hz] = w.home;
  w.tendSpot ||= [hx + (R() - .5)*2.4, hz + (R() - .5)*2.4];
  if (goTo(w, w.tendSpot[0], w.tendSpot[1], dt) && (w.tick -= dt) <= 0) { w.tick = 1.1 + R()*.8; qnAct(w.char, R() < .5 ? 'fix' : 'pick', 1); if (R() < .35) w.tendSpot = null; }
  // back to their own job the moment there is something to fetch (customers never wait on a busy-looking cook)
  if (!w.stack.length && (w.readyT = (w.readyT || 0) - dt) <= 0) { w.readyT = .5; const r = ROUTES[w.kind]; if (r && r.dst() && r.src().some(z => z && (z.stack ? z.stack.length : 1))) w.tendT = 0; }
  if ((w.tendT -= dt) <= 0) { w.hauling = false; w.tendSpot = null; w.state = w.stack.length ? 'toDst' : 'idle'; w.wait = 0; }
}
function idleHaul(w, dt, curs) {
  if (!w.hauling) {
    // stuck: standing idle, or waiting at a pickup or drop-off where nothing has changed hands for a while
    if (w.stack.length !== w.prevN) { w.prevN = w.stack.length; w.noProg = 0; } else w.noProg = (w.noProg || 0) + dt;
    const stuck = (w.state === 'idle' && !w.stack.length) || (w.state === 'unload' && w.wait > 4) || ((w.state === 'load' || w.state === 'unload' || w.state === 'idle') && w.noProg > 5);
    if (!stuck) { w.idleT = 0; return false; }
    w.idleT = (w.idleT || 0) + dt;
    if (w.idleT < 3 || (w.haulCheck = (w.haulCheck || 0) - dt) > 0) return false;
    w.haulCheck = 2;
    // what it holds decides what it can take; empty-handed, the first currency some tile needs
    const held = w.stack.length ? w.stack.items[0].type : null;
    // holding goods its own station has no room for: any other station that takes them and has room gets them
    if (held) {
      const takes = s => s.ins ? s.ins.flat().includes(held) : s.in === held;
      const alt = zones.filter(z => z.kind === 'in' && z !== w.dst && ST[z.st] && !ST[z.st].ruin && takes(ST[z.st]) && ST[z.st].inStack.length < ST[z.st].inStack.cap - 2)
        .sort((a, b) => dist2(w, a.x, a.z) - dist2(w, b.x, b.z))[0];
      if (alt) { w.dst = alt; w.state = 'toDst'; w.wait = 0; w.idleT = 0; return false; }
    }
    const cur = curs.find(c => (held ? held === c && w.stack.count([c]) === w.stack.length : true) && builderJob(w, c));
    if (cur) { w.hauling = cur; w.job = null; w.idleT = 0; w.state = 'idle'; }
    // goods nobody has room for go to the market and are sold
    else if (held && supplyOn() && SUP.zone && landKeys().some(k => !land(k).lost && tierOfLand(k).wants.includes(held))) { w.hauling = 'depot'; w.idleT = 0; }
    else if (held && SELLABLE.includes(held) && SELL_AT()) { w.hauling = 'sell'; w.idleT = 0; }
    // nothing to fetch or carry: get on with the work at their own station
    else { w.hauling = 'tend'; w.tendT = 6 + R()*4; w.idleT = 0; }
  }
  if (w.hauling === 'sell') { sellRun(w, dt); return true; }
  if (w.hauling === 'depot') { const zn = SUP.zone; if (!zn || !w.stack.length) { w.hauling = false; w.state = 'idle'; return true; } if (goTo(w, zn.x, zn.z, dt)) { const n0 = w.stack.length; zoneAct(w, zn, dt); if (w.stack.length === n0 && w.tick > .2) w.hauling = SELLABLE.includes(w.stack.items[0]?.type) && SELL_AT() ? 'sell' : false; } return true; }
  if (w.hauling === 'tend') { tendStation(w, dt); return true; }
  updBuilder(w, dt, w.hauling);
  if (!w.job && !w.stack.count([w.hauling])) { w.hauling = false; w.state = 'idle'; }
  return true;
}
function masonHaul(w, dt) {
  const pile = GATHER[w.kind].pile().outStack;
  if (!w.hauling) {
    if (pile.length < pile.cap - 2 || (w.haulCheck = (w.haulCheck || 0) - dt) > 0) return false;
    w.haulCheck = 2;
    if (!builderJob(w, 'stone')) return false;
    w.hauling = true; w.job = null;
  }
  updBuilder(w, dt, 'stone');
  if (!w.job && !w.stack.count(['stone'])) { w.hauling = false; w.state = 'idle'; }
  return true;
}

// The extra builders grow into new jobs as the ages advance. When no tile needs materials, the 3rd builder becomes a
// repair crew (from the Town: burned and ruined buildings at home and abroad), the 4th an upgrade crew (from the
// Stronghold: building levels, but only while you have three times the price to spare) and the 5th a supply driver
// (from the Empire: food to the supply depot). Building always comes first.
const CREW = [{era:3, n:'repair crew', icon:'🛠️'}, {era:5, n:'upgrade crew', icon:'🏗️'}, {era:7, n:'supply driver', icon:'🚚'}];
function crewRole(w) {
  const k = workers.filter(o => o.kind === 'builder').indexOf(w) - 2, c = CREW[k];
  if (!c || W.era < c.era) return null;
  const seen = W.flags.crews ||= {};
  if (!seen[k] && started) { seen[k] = 1; banner(`${c.icon} Your ${['3rd', '4th', '5th'][k]} builder becomes a ${c.n}`, k === 0 ? 'When nothing needs building they rebuild what burned or was ruined.' : k === 1 ? 'When nothing needs building they buy building levels with your spare cash.' : 'When nothing needs building they carry food to the supply depot.'); }
  return k;
}
function crewWork(w, dt) {
  const k = crewRole(w); if (k == null) return false;
  const near = list => list.sort((a, b) => dist2(w, a.x, a.z) - dist2(w, b.x, b.z))[0];
  if (k === 0) {
    const z = near(zones.filter(q => q.kind === 'rebuild' || q.kind === 'fix')); if (!z || W.coins <= 0) return false;
    // the crew only spends your money on repairs once you have said they may (the 💵 panel); until then they say they're ready
    if (!W.flags.autoRepair) { if (!W.flags.repairAsked) { W.flags.repairAsked = true; note('🔨 Your repair crew is ready', 'There are buildings to repair. Tap 💵 and turn on automatic repairs to let them pay and rebuild for you.'); } return false; }
    if (goTo(w, z.x, z.z, dt) && (w.tick -= dt) <= 0) { if (z.kind === 'rebuild') payRebuild(z, w); else payFix(z, w); qnAct(w.char, 'fix', 1); }
    return true;
  }
  if (k === 1) {
    const z = near(Object.values(upZones).filter(q => q.active !== false && upCost(q.st) - (W.upPaid[q.st] || 0) > 0 && W.coins >= 3*(upCost(q.st) - (W.upPaid[q.st] || 0))));
    if (!z) return false;
    if (goTo(w, z.x, z.z, dt) && (w.tick -= dt) <= 0) { payUpgrade(z, w); qnAct(w.char, 'fix', 1); }
    return true;
  }
  // the supply driver: from the station your lands want most to the depot
  if (!SUP.zone) return false;
  if (!w.stack.length || (w.crewSrc && w.stack.length < w.cap && w.crewSrc.stack.length)) {
    const src = w.crewSrc && w.crewSrc.stack.length ? w.crewSrc : (w.crewSrc = clerkSrc()[0]); if (!src) { if (!w.stack.length) return false; }
    else if (w.stack.length < w.cap) { if (goTo(w, src.x, src.z, dt)) zoneAct(w, src, dt); return true; }
  }
  w.crewSrc = null;
  if (goTo(w, SUP.zone.x, SUP.zone.z, dt)) zoneAct(w, SUP.zone, dt);
  return true;
}
