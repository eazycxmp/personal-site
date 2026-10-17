// ------------------------------------------------------------------ builders
// Builders carry stone, logs, tools and scrolls from the piles to whatever unlock is waiting for them.
// builders work with you: the tile the guide is pointing at first, then tiles near you, then the ones closest to done;
// they fetch from the nearest pile that can fill the load, and two builders never haul for a tile one load will finish
const BSTAT = {items:0, dist:0, loads:0, goal:0};
// military technology is the player's own decision: builders and masons never pay for these tiles
const MIL_PADS = new Set(['hangar', 'warship', 'mess', 'barracks', 'siegeWorks', 'troop1', 'troop2', 'troop3', 'guns', 'castle', 'castle2', 'castle3', 'castle4', 'tanks', 'troop5',
  'plane1', 'plane2', 'plane3', 'plane4', 'plane5', 'armorer', 'quartermaster', 'warTable', 'smith', 'hauler']);
function builderJob(w, only) {
  const piles = cur => zones.filter(z => z.kind === 'out' && z.stack.count([cur]));
  const open = Object.values(padZones).filter(z => !z.locked && z.pad.cur !== 'coin' && !MIL_PADS.has(z.pad.id) && (!only || z.pad.cur === only) && (w.stack.count([z.pad.cur]) || piles(z.pad.cur).length));
  if (!open.length) return null;
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
    if (!w.job) { goTo(w, ...w.home, dt); return; }
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
function idleHaul(w, dt, curs) {
  if (!w.hauling) {
    const stuck = (w.state === 'idle' && !w.stack.length) || (w.state === 'unload' && w.wait > 4);
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
    if (!cur) return false;
    w.hauling = cur; w.job = null; w.idleT = 0; w.state = 'idle';
  }
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
