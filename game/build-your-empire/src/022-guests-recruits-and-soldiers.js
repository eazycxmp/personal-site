// ------------------------------------------------------------------ guests, recruits and soldiers
const LINES = {};
const CLOTHES = [0x3f7cc0, 0xd08a2b, 0x7c4fb0, 0x3f9a6a, 0xb04f86, 0x5a6a7a, 0xc0533f, 0x2a8a9a];
const SKINS = [0xf1c9a5, 0xd9a47a, 0xb07a52, 0x8a5a3a, 0xe8b892];
const count = ids => ids.filter(h => W.unlocked.has(h)).length;
const huts = () => Object.values(hutStage).reduce((a, s) => a + (s === 3 ? 4 : s), 0), houses = () => count(['house1', 'house2', 'house3']) + lotStage.reduce((a, b) => a + b, 0)*.5;
function availableDishes() {
  const d = ['grilled'];
  if (ST.spit && ST.lodge) d.push('roast');
  if ((ST.oven && ST.field) || (ST.oven2 && ST.field2)) d.push('bread');
  if (ST.creamery && ST.dairy) d.push('icecream');
  if (ST.pizzeria && ST.tomatoes) d.push('pizza');
  if (ST.sushi && RANCH.pier) d.push('sushi');
  return d;
}
const travelerOrder = (min, spread) => { const d = availableDishes(); return [{type:d[R()*d.length|0], need:min + (R()*(spread + Math.min(W.era, 3)*1.5)|0)}]; };
function stool(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  mesh(G.cyl, 0x8a5a2b, [.26, .08, .26], [0, .44, 0], g); mesh(G.cyl, 0x5e3f22, [.07, .42, .07], [0, .21, 0], g);
}
function makeLine(id, o) { if (!o.noStool) { const [sx, sz] = o.slot(0); stool(sx, sz); } return LINES[id] = {id, q:[], leaving:[], spawnT:2, mult:1, ...o}; }
makeLine('main', {table:TB.main, cash, face:-Math.PI/2, max:9, spawn:[70, 1],
  slot:k => k === 0 ? [5.75, 1] : [6.5 + k*1.3, 1], exit:[[7, 2.4], [72, 2.4]],
  active:() => W.tut >= 1, interval:() => 7 / (1 + .45*huts() + .3*W.era + .35*houses() + .3*(W.bridge || 0) + .4*(W.train || 0)), order:() => travelerOrder(2, 2)});
function spawnIn(L) {
  const recruit = L.id === 'mess', col = recruit ? 0x8a7a5a : CLOTHES[R()*CLOTHES.length|0];
  const c = entity(recruit ? {body:col, hat:'beanie', hatCol:0x6a5a3a, skin:SKINS[R()*SKINS.length|0], pants:0x3a3a4a, hair:'short', hairCol:HAIRC[R()*6|0]} : {civ:true},
    L.spawn[0], L.spawn[1], 3.2, 0);
  c.wants = L.order().map(w => ({...w, total:w.need})); c.waitT = 0; c.eatT = 0;
  if (L.entry) c.pre = L.entry.map(pt => [...pt]);
  // with a bridge, some travelers come from the west over the river
  if (L.id === 'main' && W.bridge && R() < .35) { c.pos.set(-85, 0, BR.z); c.pre = WEST_PATH(); }
  c.el = document.createElement('div'); c.el.className = 'bub'; $('labels').appendChild(c.el);
  L.q.push(c);
}
function updLine(L, dt) {
  if (L.custom) return L.custom(L, dt);
  if ((L.spawnT -= dt) <= 0) { L.spawnT = L.interval() * (.7 + R()*.6); if (L.active() && L.q.length < L.max) spawnIn(L); }
  for (const c of [...L.q]) {
    if (c.pre && c.pre.length) { if (moveTo(c, c.pre[0][0], c.pre[0][1], dt)) c.pre.shift(); continue; }
    const k = L.q.indexOf(c), [x, z] = L.slot(k), arrived = moveTo(c, x, z, dt);
    if (k !== 0 || !arrived) continue;
    c.waitT += dt;
    // guests who wait too long storm off; enough of them start a revolt
    if (L.id !== 'mess' && c.waitT > PATIENCE * BOOST.patience * (1 + .1*(W.water || 0) + (W.unlocked.has('hospital') ? .15 : 0))) { stormOff(c, L); continue; }
    let d = L.face - c.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); c.yaw += d * Math.min(1, dt*8);
    const w = c.wants.find(w => w.need > 0);
    if (w && (c.eatT -= dt) <= 0 && L.table.stack.count([w.type])) {
      c.eatT = .22 / (L.serve || 1); c.waitT = 0;
      const it = L.table.stack.take([w.type]);
      flyAway(it.mesh, () => new THREE.Vector3(c.pos.x, 1.6, c.pos.z), .25);
      w.need--; snd(520 + (w.total - w.need)*40, .05, 'triangle', .04);
      if (c.wants.every(w => w.need <= 0)) (L.done || payOut)(c, L);
    }
  }
  for (const c of [...L.leaving]) {
    if (!c.route) c.route = L.exit.map(p => [...p]);
    if (moveTo(c, c.route[0][0], c.route[0][1], dt)) {
      c.route.shift();
      if (!c.route.length) { scene.remove(c.char.g); c.el.remove(); L.leaving.splice(L.leaving.indexOf(c), 1); stacks.delete(c.stack); }
    }
  }
}
const PATIENCE = 60;
function stormOff(c, L) {
  c.el.className = 'bub done angry'; c.el.innerHTML = '😡';
  popText('Too slow!', new THREE.Vector3(c.pos.x, 2.6, c.pos.z), '#ff8a75');
  L.q.splice(L.q.indexOf(c), 1); L.leaving.push(c);
  W.unrest++; snd(150, .25, 'sawtooth', .04, .7);
  if (W.unrest >= 3) revolt();
}
const soldiersHome = () => W.camp ? 0 : W.army;
function revolt() {
  W.unrest = 0;
  if (soldiersHome() >= 5) { banner('🛡️ Your guards calmed an angry crowd', 'Keep the tables full and nobody gets angry.'); return; }
  const targets = Object.values(ST).filter(s => s.in && !s.broken);
  if (!targets.length) return;
  const s = targets[R()*targets.length|0], [x, z] = s.inZ;
  s.broken = true; s.busy = false;
  s.repairZone = addZone({kind:'repair', st:s.id, x, z, icon:'🔨', tile:{alpha:1, size:92, label:'Repair', fill:'rgba(160,40,30,.6)'}});
  banner(`🔥 Angry guests set the ${s.name} on fire!`, 'Stand on the red tile to repair it.');
  snd(110, .5, 'sawtooth', .05, .6);
}
function payOut(c, L) {
  const value = Math.round(c.wants.reduce((a, w) => a + w.total * (ITEM[w.type].price || 0), 0) * L.mult * (1 + .06*(W.water || 0)) * appealMult() * happyMult() * (W.festival > 0 ? 2 : 1));
  addCash(L.cash, value, c.pos);
  W.fed++;
  popText(`+${value} 💵`, new THREE.Vector3(c.pos.x, 2.4, c.pos.z), '#ffe06b');
  c.el.className = 'bub done'; c.el.innerHTML = '😋';
  snd(990, .08, 'sine', .05); setTimeout(() => snd(1320, .1, 'sine', .04), 70);
  L.q.splice(L.q.indexOf(c), 1); L.leaving.push(c);
}
// a fed and armed recruit becomes a soldier drilling in the yard
const soldiers = [];
const BASE_SLOTS = [
  ...[...Array(12)].map((_, k) => [-4.4 + (k % 3)*1.6, 65.2 + Math.floor(k / 3)*1.7]),          // the drill yard
  [-5.4, 50.2], [-5.4, 51.4], [-5.4, 56.2], [-5.4, 57.4], [-5.4, 62.2], [-5.4, 63.4],              // by the tents
  [-8, 48.6], [11.2, 48.6], [-8.2, 72.4], [11.4, 72.4],                                              // guards at the towers
  [7.4, 60.8], [8.6, 60.8]];                                                                          // hands at the depot
const yardSlot = i => BASE_SLOTS[i % BASE_SLOTS.length];
function makeSoldier(x, z) {
  if (soldiers.length >= 24) return null;
  const s = entity(ARMS(), x, z, 3.4, 0);
  s.slot = yardSlot(soldiers.length); s.drill = R()*6; soldiers.push(s);
  return s;
}
function enlist(c, L) {
  L.q.splice(L.q.indexOf(c), 1); c.el.remove(); scene.remove(c.char.g); stacks.delete(c.stack);
  W.army++; W.fed++;
  makeSoldier(c.pos.x, c.pos.z);
  popText('+1 🛡️ soldier', new THREE.Vector3(c.pos.x, 2.6, c.pos.z), '#b8d4ff');
  snd(392, .1, 'square', .04); setTimeout(() => snd(523, .14, 'square', .04), 90);
  refreshPads(); save();
}
let tributeT = 10;
const CAMPAIGNS = [
  {name:'Bandit camp', icon:'🏚️', army:5, reward:1500},
  {name:'Rival village', icon:'🏘️', army:8, reward:3000},
  {name:'Pirate cove', icon:'🏴‍☠️', army:10, ships:1, reward:5000},
  {name:'Hill clans', icon:'⛰️', army:14, reward:8000},
  {name:'The old empire', icon:'🏯', army:20, ships:1, reward:15000},
  {name:'Mountain fortress', icon:'🏰', army:18, planes:1, reward:30000, target:0},
  {name:'Far continent', icon:'🗺️', army:24, planes:2, reward:60000, target:1},
];
const campType = c => c.planes ? 'air' : c.ships ? 'sea' : 'land';
const planesBuilt = () => count(['plane1', 'plane2', 'plane3', 'plane4', 'plane5']);
const campNeed = c => Math.ceil(c.army * BOOST.tactics * (W.unlocked.has('guns') ? .8 : 1) * (1 - .04*Math.min(3, W.troop || 0) - (W.troop >= 5 ? .1 : 0)));
const campReward = c => Math.round(c.reward * (W.unlocked.has('guns') ? 1.5 : 1));
let warZone = null;
function warTile() {
  const c = CAMPAIGNS[W.conquests];
  const label = !c ? 'All lands won' : W.camp ? `${W.camp.type === 'air' ? 'Planes' : W.camp.type === 'sea' ? 'Fleet' : 'Army'} away · ${Math.ceil(W.camp.t)}s` : `${c.name} · ${campNeed(c)}🛡️${c.ships ? ' ⛵' : ''}${c.planes ? ' ✈️'.repeat(c.planes) : ''}`;
  if (warZone.label === label) return;
  warZone.label = label;
  drawTile(warZone.tc.g, c ? c.icon : '🏆', {alpha:1, size:84, label, fill:'rgba(120,30,30,.55)'}); warZone.tc.t.needsUpdate = true;
}
// who can go: the army marches (or lands from the boats on a coast), the navy needs a coast, planes reach anywhere
function forcePower(branch) {
  if (branch === 'army') return W.army + (W.unlocked.has('tanks') ? 10 : 0);
  if (branch === 'navy') return W.unlocked.has('warship') ? 14 + Math.min(10, Math.floor(W.army / 3)) : 0;
  return planesBuilt() * 6;
}
function forceOptions(c) {
  const goal = campType(c), need = campNeed(c);
  return [
    {b:'army', icon:'🪖', n:'Army', pow:forcePower('army'), ok:true, how:goal === 'sea' ? 'Lands from troop boats' : goal === 'air' ? 'Marches over the hills' : 'Marches out the south gate'},
    {b:'navy', icon:'⚓', n:'Navy', pow:forcePower('navy'), ok:goal === 'sea', how:goal === 'sea' ? (W.unlocked.has('warship') ? 'Warship and marines' : 'Build a warship first') : 'No coast to sail to'},
    {b:'air', icon:'✈️', n:'Air force', pow:forcePower('air'), ok:planesBuilt() > 0, how:planesBuilt() ? `${planesBuilt()} plane${planesBuilt() > 1 ? 's' : ''} fly the raid` : 'Build a fighter plane first'},
  ].map(o => ({...o, need, win:o.ok && o.pow >= need}));
}
function warAct(zn, e) {
  e.tick = .5;
  const c = CAMPAIGNS[W.conquests];
  if (!c || W.camp || W.raid) return;
  if (zn.asked) return;            // the picker opens once each time you step on the table
  zn.asked = true;
  if (e !== player) { const best = forceOptions(c).filter(o => o.win).sort((a, b) => b.pow - a.pow)[0]; if (best) launchCamp(c, best.b); return; }
  openForcePicker(c);
}
function openForcePicker(c) {
  const m = $('modal'); m.hidden = false; m.dataset.panel = 'attack';
  const opts = forceOptions(c);
  m.innerHTML = `<div class="card"><h1 style="font-size:24px">${c.icon} Attack the ${c.name}</h1><p>Who goes? You need strength ${opts[0].need} to win.</p>
    <div class="votes">${opts.map(o => `<button data-b="${o.b}" ${o.win ? '' : 'disabled style="opacity:.45;cursor:default"'}><b>${o.icon} ${o.n}</b><small>Strength ${o.pow}${o.ok && !o.win ? ' · not enough' : ''}</small><small>${o.how}</small></button>`).join('')}</div>
    <button class="ghost" id="fpClose">Not now</button></div>`;
  m.querySelectorAll('button[data-b]').forEach(bt => bt.onclick = () => { if (bt.disabled) return; m.hidden = true; launchCamp(c, bt.dataset.b); });
  $('fpClose').onclick = () => { m.hidden = true; };
}
// the attack itself: the branch decides how it looks, the target decides what you win
function launchCamp(c, branch) {
  if (W.camp || W.raid) return;
  const goal = campType(c), site = c.ci === 4 || W.conquests === 4 ? 'empire' : 'cove';
  const type = branch === 'air' ? 'air' : branch === 'navy' || goal === 'sea' ? 'sea' : 'land';
  const at = goal === 'air' ? AIR_TARGETS[c.target] : goal === 'sea' ? [COAST.sites[site].x, COAST.z] : [BF.x, BF.z + 4];
  const n = type === 'air' ? planesBuilt() : 0, dur = {land:30, sea:44, air:42 + .7*Math.max(0, n - 1)}[type];
  W.camp = {t:dur, dur, type, goal, branch, ships:type === 'sea', ci:W.conquests, tx:at[0], tz:at[1], n};
  if (goal === 'air') startAir(c);
  if (type === 'land') startBattle(c); else if (type === 'sea') startSea(); else if (goal === 'sea') { COAST.cur = coastFort(site); fortReset(COAST.cur); }
  banner(type === 'air' ? `✈️ ${n} plane${n > 1 ? 's' : ''} fly against the ${c.name}` : branch === 'navy' ? `⚓ Your fleet sails against the ${c.name}` : type === 'sea' ? `🪖 Your army sails to land at the ${c.name}` : `⚔️ Your army marches on the ${c.name}`,
    'Tap 🎥 Follow the army (or press F) to ride along.');
  snd(196, .3, 'square', .05); setTimeout(() => snd(262, .3, 'square', .05), 200);
}
function updWar(dt) {
  if (warZone) { warTile(); if (player.zone !== warZone) warZone.asked = false; }
  if (!W.camp || (W.camp.t -= dt) > 0) return;
  if (W.camp.side) { endSideCamp(); return; }
  const c = CAMPAIGNS[W.conquests];
  const type = W.camp.type, goal = W.camp.goal || type;
  W.camp = null; W.conquests++;
  if (type === 'land') setTimeout(endBattle, 2500);
  if (goal === 'land') outpost(W.conquests - 1, true);
  if (type === 'sea' || goal === 'sea') endSea();
  if (goal === 'air') endAir(c);
  addCash(CASH.spoils, campReward(c), {x:12.3, z:84.8});
  banner(`🏆 Victory over the ${c.name}!`, `Your army brings home ${campReward(c)} 💵 in spoils.`);
  [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => snd(f, .2, 'triangle', .05), i*110));
  if (W.conquests >= CAMPAIGNS.length) setEra(10, true);
  else if (W.conquests === 5) {
    setEra(7, true);
    W.flags.empireMin = Math.max(1, Math.round(W.playT / 60));
    setTimeout(() => banner(`🌍 Empire in ${W.flags.empireMin} minutes!`, 'Post your time on the 🏆 leaderboard.'), 4200);
  }
  save();
}

