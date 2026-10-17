// ------------------------------------------------------------------ robbers, and the police and soldiers who chase them
let robber = null, lastRobCaught = false;
const ROB = {t:600};
function robberLook() { return {body:0x1e1e22, body2:0xf4f4f4, top:'stripes', pants:0x1e1e22, hair:'buzz', hairCol:0x1a1410, acc:'sunglasses', hat:'beanie', hatCol:0x1e1e22}; }
function startRobbery() {
  const piles = Object.values(CASH).filter(c => c.value > 60 && inRect(BOUNDS, c.x, c.z) || (c.value > 60 && regionOf(c.x, c.z) !== 'camp' && regionOpen(regionOf(c.x, c.z))));
  const pile = piles.sort((a, b) => b.value - a.value)[0]; if (!pile) return;
  const e = entity(robberLook(), 60, 0, 4.4, 0);
  mesh(G.sph, 0xd8c8a0, [.22, .26, .2], [0, .9, -.35], e.char.g);   // the swag bag
  robber = e; e.pile = pile; e.state = 'in'; e.loot = 0; lastRobCaught = false;
  banner('🦹 A robber is after your cash!', W.unlocked.has('police') || W.army ? 'Your police and soldiers give chase.' : 'Hire police or raise an army to catch robbers.');
  snd(880, .2, 'square', .04); setTimeout(() => snd(660, .3, 'square', .04), 200);
  // the chase: police from the station, soldiers from the yard
  const chasers = [];
  if (W.unlocked.has('police')) for (let i = 0; i < 2; i++) chasers.push(entity({body:0x1f3a7a, body2:0x1f3a7a, top:'shirt', pants:0x1a2440, hat:'helmet', hatCol:0x1f3a7a, hair:'short'}, 56.5 + i*.6, 4, 6.4, 0));
  if (W.army) for (let i = 0; i < 2; i++) chasers.push(entity(ARMS(), 7 + i*1.2, 65.5, 5.6, 0));
  e.chasers = chasers;
}
function updRobber(dt) {
  if (!started) return;
  if (!robber) {
    if (W.era >= 2 && Object.values(CASH).some(c => c.value > 60) && (ROB.t -= dt) <= 0) { ROB.t = 480 + R()*420; startRobbery(); }
    return;
  }
  const e = robber;
  if (e.state === 'in') {
    if (moveTo(e, e.pile.x, e.pile.z, dt)) {
      const take = Math.min(e.pile.value, 120 + 60*W.era);
      e.pile.value -= take; W.earned -= take; e.loot = take;
      for (let i = 0; i < 6 && e.pile.stack.items.length; i++) { const it = e.pile.stack.items.pop(); scene.remove(it.mesh); }
      popText(`💸 -${take}`, e.pos.clone().setY(2.6), '#ffb0a0');
      e.state = 'out'; e.speed = 4.8;
    }
  } else if (e.state === 'out') {
    if (moveTo(e, 54, 1.6, dt) || e.pos.x > 61) { endRobbery(false); return; }
  } else if (e.state === 'caught') {
    e.vel.set(0, 0, 0); e.char.armL.rotation.x = e.char.armR.rotation.x = -2.9;
    if ((e.t -= dt) <= 0) { endRobbery(true); return; }
  }
  animEntity(e, dt);
  for (const c of e.chasers) {
    if (e.state !== 'caught') {
      moveTo(c, e.pos.x, e.pos.z, dt);
      if (Math.hypot(c.pos.x - e.pos.x, c.pos.z - e.pos.z) < .75 && e.state === 'out') {
        e.state = 'caught'; e.t = 2.5;
        if (e.loot) { e.pile.value += e.loot; W.earned += e.loot; popText(`🚓 +${e.loot} back`, e.pos.clone().setY(2.8), '#b8f0a0'); }
        W.flags.caught = true; banner('🚓 Robber caught!', 'Your cash is back where it belongs.'); snd(523, .15, 'triangle', .05); setTimeout(() => snd(784, .2, 'triangle', .05), 150);
      }
    } else c.vel.set(0, 0, 0);
    animEntity(c, dt);
  }
}
function endRobbery(caught) {
  const e = robber; robber = null; lastRobCaught = caught;
  if (!caught && e.loot) banner(`💸 The robber got away with ${e.loot}!`, W.unlocked.has('police') ? 'Your police were too slow this time.' : 'Build a police station to stop the next one.');
  for (const c of [e, ...e.chasers]) { scene.remove(c.char.g); stacks.delete(c.stack); }
}

