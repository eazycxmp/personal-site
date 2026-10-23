// ------------------------------------------------------------------ fx
const parts = [];
function particle(color, pos, v, life, s, o = {}) {
  if (parts.length > 160) return;   // keep effects cheap on slow devices
  const m = new THREE.Mesh(G.sph, new THREE.MeshBasicMaterial({color, transparent:true, opacity:o.op || .9, depthWrite:false}));
  m.position.copy(pos); m.scale.setScalar(s); scene.add(m);
  parts.push({m, v, t:0, life, s, op:o.op || .9, ...o});
}
function puff(x, z) {
  for (let i = 0; i < 16; i++) {
    const a = R()*Math.PI*2;
    particle(0xffffff, new THREE.Vector3(x, .4, z), new THREE.Vector3(Math.cos(a)*3, 1.5 + R()*2, Math.sin(a)*3), .7, .25 + R()*.3);
  }
}
function splashAt(x, z) {
  for (let i = 0; i < 5; i++) particle(0xe8f8ff, new THREE.Vector3(x, -.12, z), new THREE.Vector3((R() - .5)*2, 2 + R()*2, (R() - .5)*2), .45, .1, {grav:1});
}
function splash() { const p = waterPt(); splashAt(p.x, p.z); }
let smokeT = 0;
function smoke(dt) {
  if ((smokeT -= dt) > 0) return; smokeT = .35;
  for (const s of smokers) particle(0xcfcfcf, new THREE.Vector3(s.x + (R() - .5)*.3, s.y, s.z), new THREE.Vector3(.2, 1, -.1), 2.2, .2, {grow:.35, op:.4});
}
function updParts(dt) {
  for (const p of [...parts]) {
    p.t += dt;
    if (p.grav) p.v.y -= 12*dt;
    p.m.position.addScaledVector(p.v, dt);
    if (p.grow) p.m.scale.setScalar(p.s + p.t*p.grow);
    p.m.material.opacity = p.op * (1 - p.t/p.life);
    if (p.t >= p.life) { scene.remove(p.m); p.m.material.dispose(); parts.splice(parts.indexOf(p), 1); }
  }
}
const pops = [];
function popText(txt, pos, color) {
  const income = /^[^A-Za-z]*\+|tribute|tolls|tickets|rides|takings/.test(txt);
  if (pops.length > (MOBILE ? 4 : 7) || income && pops.length > (MOBILE ? 1 : 3)) return;
  const el = document.createElement('div'); el.className = 'pop'; el.textContent = txt; el.style.color = color;
  $('labels').appendChild(el); pops.push({el, pos, t:0});
}
const URGENT = /⚔️|🏰|🔥|🐉|🦖|🏳️|🏴|💔|🏆|siege|declares|revolts|breaks|overran|Victory/;
function banner(title, sub) {
  try { if (started) news(title); } catch (e) {}
  note(title, sub, URGENT.test(title));
}
// the side feed: newest on top, a repeat bumps a counter instead of adding a card, and when it is full the
// oldest everyday card makes room (wars, sieges and monsters stay up longer and are the last to go)
const FEED = {max:MOBILE ? 2 : 4, items:[]};
function note(title, sub = '', urgent = false) {
  const key = String(title).replace(/<[^>]+>/g, '').replace(/[\d,.]+/g, '#');
  const same = FEED.items.find(n => n.key === key);
  if (same) {
    same.n++; same.el.innerHTML = `${title}<i>×${same.n}</i><small>${sub}</small>`;
    clearTimeout(same.timer); same.timer = setTimeout(() => dropNote(same), same.urgent ? 9000 : 5000); return;
  }
  const el = document.createElement('div'); el.className = 'note' + (urgent ? ' urgent' : ''); el.innerHTML = `${title}<small>${sub}</small>`;
  $('feed').prepend(el); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
  const it = {key, el, n:1, urgent}; FEED.items.unshift(it);
  it.timer = setTimeout(() => dropNote(it), urgent ? 9000 : 5000);
  while (FEED.items.length > FEED.max) dropNote([...FEED.items].reverse().find(n => !n.urgent) || FEED.items[FEED.items.length - 1]);
}
function dropNote(it) {
  const i = FEED.items.indexOf(it); if (i < 0) return;
  FEED.items.splice(i, 1); clearTimeout(it.timer); it.el.classList.remove('in'); setTimeout(() => it.el.remove(), 400);
}

// guidance: a bouncing arrow over the goal and a pointer at the player's feet
const arrow = new THREE.Group();
const arrowMat = new THREE.MeshBasicMaterial({color:0xffd33c});
const ah = new THREE.Mesh(G.cone, arrowMat); ah.scale.set(.35, .6, .35); ah.rotation.x = Math.PI; arrow.add(ah);
const as = new THREE.Mesh(G.cyl, arrowMat); as.scale.set(.14, .5, .14); as.position.y = .5; arrow.add(as);
scene.add(arrow);
const pointerG = new THREE.Group();
const pointer = new THREE.Mesh(new THREE.ConeGeometry(.28, .7, 3), new THREE.MeshBasicMaterial({color:0xffd33c, transparent:true, opacity:.85}));
pointer.rotation.x = Math.PI/2; pointerG.add(pointer); scene.add(pointerG);

const TUT = [
  {txt:'Walk onto the 🎣 fishing spot by the river', z:() => fishZone, done:() => player.stack.count(['fish']) >= 4 || W.flags.fedGrill},
  {txt:'Bring the fish to the 🔥 campfire', z:() => inZone('grill'), done:() => W.flags.fedGrill},
  {txt:'Pick up the grilled fish', z:() => outZone('grill'), done:() => player.stack.count(['grilled']) > 0 || table.length > 0 || W.fed > 0},
  // a guest only pays once their whole order is served, so keep pointing along the chain until someone pays
  {txt:() => player.stack.count(['grilled']) ? 'Put it on the table for the hungry travelers' : 'Keep serving until the guest is full. ' + (obtain('grilled')?.txt || ''),
    z:() => player.stack.count(['grilled']) ? tableZone : obtain('grilled')?.z, done:() => W.fed > 0},
  {txt:'Collect your cash', z:() => cashZone, done:() => W.flags.collected},
];
const zdist = z => Math.hypot(z.x - player.pos.x, z.z - player.pos.z);
// One step toward getting a `type` into the pack, following its supply chain back.
function obtain(type, depth = 0) {
  if (depth > 5) return null;
  const ic = ITEM[type].icon, full = player.stack.length >= W.cap;
  // the bin keeps what you are collecting and throws out the rest
  const binStep = () => player.stack.count([type]) >= player.stack.length ? null
    : (binZone.keep = type, {txt:`Your pack is full. Drop the extras in the 🗑️ bin (keeps ${ic})`, z:binZone});
  const ready = zones.filter(z => z.kind === 'out' && z.stack.count([type])).sort((a, b) => zdist(a) - zdist(b))[0];
  if (ready) return full ? binStep() : {txt:`Pick up ${ic} at the ${ST[ready.st].name}`, z:ready};
  const conv = Object.values(ST).find(s => s.out === type);
  if (conv) {
    if (player.stack.count([conv.in]) && conv.inStack.length < conv.inStack.cap) return {txt:`Put ${ITEM[conv.in].icon} in the ${conv.name}`, z:inZone(conv.id)};
    if (conv.busy || conv.inStack.length) return {txt:`The ${conv.name} is making ${ic}…`, z:outZone(conv.id), wait:1};
    return obtain(conv.in, depth + 1);
  }
  const src = zones.find(z => z.kind === 'source' && z.item === type);
  if (src) return full ? binStep() : {txt:`Gather ${ic} at the ${src.icon}`, z:src};
  const node = nodes().filter(t => t.item === type && t.logs > 0).sort((a, b) => Math.hypot(a.x - player.pos.x, a.z - player.pos.z) - Math.hypot(b.x - player.pos.x, b.z - player.pos.z))[0];
  if (node) return full ? binStep() : {txt:type === 'log' ? 'Chop trees for 🪵' : 'Mine rocks for 🪨', z:{x:node.x, z:node.z + 1, tree:1}};
  const gen = Object.values(ST).find(s => s.gen === type);
  if (gen) return {txt:`Wait for ${ic} at the ${gen.name}`, z:outZone(gen.id), wait:1};
  return null;
}
// When the one at the front of a line waits on something nobody is bringing,
// walk the player back along that thing's supply chain.
function supplyStep() {
  for (const L of Object.values(LINES)) {
    const c = L.q[0];
    if (!c || c.waitT < 4) continue;
    const w = c.wants.find(w => w.need > 0 && !L.table.stack.count([w.type]));
    if (!w) continue;
    const who = L.id === 'mess' ? 'A recruit needs' : 'A guest wants';
    if (player.stack.count([w.type])) return {txt:`${who} ${ITEM[w.type].icon}. Bring it to the table`, z:L.table.zone};
    const st = obtain(w.type);
    if (st && !st.wait) return {txt:`${who} ${ITEM[w.type].icon}. ${st.txt}`, z:st.z};
  }
  return null;
}
function objective() {
  binZone.keep = null;
  if (W.tut < TUT.length) {
    while (W.tut < TUT.length && TUT[W.tut].done()) W.tut++;
    if (W.tut < TUT.length) { const T = TUT[W.tut]; return {txt:typeof T.txt === 'function' ? T.txt() : T.txt, z:T.z() || null}; }
  }
  if (!W.unlocked.has('tut0')) { unlock('tut0', false); save(); }
  const broken = Object.values(ST).find(s => s.broken && (!s.ruin || W.coins >= Math.min(s.ruin, 500)));
  if (broken) return {txt:broken.ruin ? `🏗️ Rebuild the ${broken.name} (${broken.ruin} 💵)` : `🔥 Angry guests set the ${broken.name} on fire. Repair it!`, z:broken.repairZone};
  const eo = FORTRESS ? null : empireObjective(); if (eo) return eo;
  const camp = FORTRESS ? null : CAMPAIGNS[W.conquests];
  if (W.camp && warZone && zdist(warZone) < 14) return {txt:`${W.camp.type === 'air' ? '✈️ Air strike' : W.camp.type === 'sea' ? '⚓ Sea battle' : '⚔️ Battle'} against ${W.camp.side ? sideName() : 'the ' + camp.name}! Stand on the war table to watch`, z:warZone};
  if (warZone && camp && !W.camp && !W.raid && W.army >= campNeed(camp) && (!camp.ships || W.unlocked.has('warship')) && (!camp.planes || planesBuilt() >= camp.planes))
    return {txt:`⚔️ Lead your army against the ${camp.name}`, z:warZone};
  const pads = Object.values(padZones).filter(z => !z.locked);
  const rem = z => z.pad.cost - (W.paid[z.pad.id] || 0);
  const afford = pads.filter(z => z.pad.cur === 'coin' ? W.coins >= Math.min(rem(z), z.pad.cost*.5) : player.stack.count([z.pad.cur]) >= Math.min(rem(z), 4))
    .sort((a, b) => a.pad.cost - b.pad.cost);
  if (afford.length) { const p = afford[0].pad; return {txt:`Unlock ${p.icon} ${p.label}`, z:afford[0]}; }
  const coinPads = pads.filter(z => z.pad.cur === 'coin');
  const cheapest = coinPads.length ? Math.min(...coinPads.map(rem)) : Infinity;
  const needCoins = W.coins < cheapest;
  const pile = Object.values(CASH).filter(c => c.value >= 10).sort((a, b) => zdist(a) - zdist(b))[0];
  const piled = Object.values(CASH).reduce((a, c) => a + c.value, 0);
  // picking up cash that already buys something beats any errand
  if (pile && needCoins && W.coins + piled >= cheapest) return {txt:'Collect your cash', z:pile.zone};
  // spare cash goes into building levels
  const up = Object.values(upZones).map(z => ({z, rem:upCost(z.st) - (W.upPaid[z.st] || 0)})).sort((a, b) => a.rem - b.rem)[0];
  if (up && W.coins >= up.rem && (!coinPads.length || W.coins - up.rem >= cheapest))
    return {txt:`Upgrade the ${ST[up.z.st].name} to Lv ${lvl(up.z.st) + 1}`, z:up.z};
  // gather for the material unlock whose chain is quickest right now
  const TIER = {log:0, stone:1, scroll:2, tools:3, ingot:3};
  const mats = pads.filter(z => z.pad.cur !== 'coin').sort((a, b) => (TIER[a.pad.cur] - TIER[b.pad.cur]) || (rem(a) - rem(b)));
  if (mats.length && (W.unlocked.has('fisher') || W.coins < 15)) {
    for (const mat of mats) {
      const st = obtain(mat.pad.cur);
      if (st && !st.wait) return {txt:`${st.txt} (${mat.pad.label} needs ${rem(mat)} ${CUR_ICON[mat.pad.cur]})`, z:st.z};
    }
  }
  if (pile && needCoins) return {txt:'Collect your cash', z:pile.zone};
  const sup = supplyStep(); if (sup) return sup;
  if (pile && !W.unlocked.has('treasurer')) return {txt:'Collect your cash', z:pile.zone};
  if (!pads.length) {
    const lock = Object.values(padZones).find(z => z.pad.army);
    if (lock) return {txt:`Train soldiers: ${W.army}/${lock.pad.army} 🛡️ for the ${lock.pad.label}`, z:null};
    if (W.camp) return {txt:`⚔️ Your army is at war… back in ${Math.ceil(W.camp.t)}s`, z:null};
    if (camp && warZone) return {txt:`Train soldiers: ${W.army}/${campNeed(camp)} 🛡️ to attack the ${camp.name}`, z:null};
    return {txt:'Keep the whole empire fed!', z:null};
  }
  const next = pads.filter(z => z.pad.cur === 'coin').sort((a, b) => rem(a) - rem(b))[0];
  return {txt:next ? `Feed travelers to earn 💵 for ${next.pad.icon} ${next.pad.label}` : 'Feed the travelers', z:null};
}

