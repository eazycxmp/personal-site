// ------------------------------------------------------------------ the Senate: a dome on the town hall, where you send governors to your provinces
let senateZone = null;
function senateFx(anim) {
  const hg = ST.flag && ST.flag.parent;
  if (hg && !hg.senate) {
    hg.senate = true;
    hg.children.forEach(c => { if (c.geometry === G.cone4) c.visible = false; });
    mesh(G.box, 0xf4f0e6, [3.2, .9, 2.4], [0, 2.75, 0], hg);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI*2, 0, Math.PI/2), mat(0xc8d8e0, {metalness:.35, roughness:.3})); dome.position.y = 3.2; dome.castShadow = true; hg.add(dome);
    mesh(G.cyl, 0xf4f0e6, [1.05, .3, 1.05], [0, 3.2, 0], hg); mesh(G.sph, 0xf2c200, [.18, .18, .18], [0, 4.3, 0], hg, {metalness:.7, roughness:.2});
    for (let i = -2; i <= 2; i++) mesh(G.cyl, 0xf8f4ec, [.1, 2, .1], [i*.62, 1.3, 1.32], hg);
    const ped = mesh(G.cone4, 0xf4f0e6, [3.5, .55, .5], [0, 2.55, 1.3], hg); ped.rotation.y = Math.PI/4; ped.scale.set(2.6, .55, .4);
    for (const x of [-1.9, 1.9]) { mesh(G.cyl, 0x5e3f22, [.03, 1.4, .03], [x, 3.9, 1], hg); mesh(G.box, 0x7a2a8a, [.5, .3, .02], [x + .26, 4.4, 1], hg); }
  }
  if (!senateZone) senateZone = addZone({kind:'senate', x:9, z:13.3, icon:'🏛️', tile:{alpha:1, size:84, label:'Senate', fill:'rgba(90,60,140,.6)'}});
  if (anim) banner('🏛️ The Senate!', 'Provinces grow more loyal. Stand on the Senate tile to send a governor to a province.');
}
function govTarget() { return landKeys().filter(k => !land(k).lost && !land(k).gov).sort((a, b) => land(a).loy - land(b).loy)[0]; }
function paySenate(zn, e) {
  const k = govTarget();
  if (!k || W.coins <= 0) { e.tick = .4; return; }
  const cost = govCost(), amt = Math.min(cost - (zn.paid || 0), W.coins, Math.ceil(cost/28));
  spend(amt); zn.paid = (zn.paid || 0) + amt; e.tick = .045; snd(600 + zn.paid/cost*400, .03, 'triangle', .025);
  if (zn.paid >= cost) {
    zn.paid = 0; const L = land(k); L.gov = true; L.loy = Math.min(100, L.loy + 10);
    banner(`🏛️ A governor for ${landName(k)}`, 'They build roads and listen to the people. Loyalty climbs steadily.'); save();
  }
}
function empireObjective() {
  if (senateZone && W.unlocked.has('senate')) {
    const k = govTarget();
    if (k && land(k).loy < 60 && W.coins >= govCost()) return {txt:`🏛️ Send a governor to ${landName(k)} (loyalty ${Math.round(land(k).loy)}%)`, z:senateZone};
  }
  return null;
}
function empireChips() {
  let h = '';
  const war = EMP.list.filter(r => W.flags.emp?.[r.id]?.stance === 'war');
  if (war.length) h += `<span class="chip angry">⚔️ ${war.map(r => r.icon).join('')}</span>`;
  if (FRONTS.list.length) h += `<span class="chip">🔥 ${FRONTS.list.map(f => `${EMP.list[f.i].icon}${Math.ceil(f.t)}s`).join(' ')}</span>`;
  const low = landKeys().filter(k => !land(k).lost).sort((a, b) => land(a).loy - land(b).loy)[0];
  if (low && land(low).loy < 30) h += `<span class="chip angry">🏛️ ${Math.round(land(low).loy)}%</span>`;
  return h;
}
function empireHTML() {
  if (!EMP.list.some(r => es(r).met)) return '<p class="empHint">🧭 No rivals found yet. Follow the roads east and west, or sail the oceans, to find them.</p>';
  const P = powerParts(), mine = myPower(), d = s => s.rel >= 60 ? '❤️ friendly' : s.rel >= 0 ? '😐 wary' : s.rel > -50 ? '😠 hostile' : '💢 furious';
  const cards = EMP.list.map((r, i) => {
    if (!es(r).met) {
      const where = r.via === 'sea' ? 'across the ocean' : r.via === 'south' ? 'to the south' : `along the ${r.via} road`, sc = scoutState(r);
      const act = r.sky && !W.unlocked.has('moonLanding') ? '<em>Beyond the sky: reach the Moon first</em>'
        : sc.out ? `<em>🧭 Scouts on the way · ${sc.left}s</em>`
        : W.conquests < 2 ? '<em>🧭 Scouts can go after your second campaign</em>'
        : `<button data-sc="${i}" ${W.coins < scoutCost(r) ? 'disabled' : ''}>🧭 Send scouts · ${scoutCost(r)} 💵</button>`;
      return `<div class="ec dim"><b>❔ Unexplored</b><span>Somewhere ${where}. Send scouts to find them, or go there yourself.</span><div class="eb">${act}</div></div>`;
    }
    const s = es(r), B = (a, t, dis) => `<button data-e="${i}" data-a="${a}" ${dis ? 'disabled' : ''}>${t}</button>`;
    const busy = !!(W.camp || W.raid), fleetOk = r.sea && W.unlocked.has('tradeShip') && (s.fleetT || 0) <= W.playT;
    let btns = '';
    if (s.owned) btns = '<em>🏴 Part of your empire</em>';
    else if (s.by) { const o = EMP.list.find(q => q.id === s.by), F = FRONTS.at(i), free = BRANCH.some(q => !frontWhy(r, q.b) && branchPow(q.b) > 0);
      btns = `<em>🏴 Held by ${o.icon} ${o.n}</em>` + (F ? `<em>⚔️ Fighting · ${Math.ceil(F.t)}s</em>` : `<button data-pa="${i}" ${free ? '' : 'disabled'}>🏴 Liberate</button>`); }
    else if (s.stance === 'ally') btns = B('gift', `🎁 Gift ${giftCost()}`, W.coins < giftCost()) + (r.sea ? B('fleet', '⛵ Trade fleet', !fleetOk) : '') + B('unally', '💔 Break');
    else if (s.stance === 'peace') btns = B('gift', `🎁 Gift ${giftCost()}`, W.coins < giftCost()) + B('ally', '🤝 Ally', s.rel < 60) + (r.sea ? B('fleet', '⛵ Trade fleet', !fleetOk) : '') + B('war', '⚔️ War', busy);
    else { const F = FRONTS.at(i), free = BRANCH.some(q => !frontWhy(r, q.b) && branchPow(q.b) > 0);
      btns = B('peace', `🕊️ Peace ${peaceCost(r)}`, W.coins < peaceCost(r)) + (F ? `<em>⚔️ Fighting · ${Math.ceil(F.t)}s</em>` : `<button data-pa="${i}" ${free ? '' : 'disabled'}>⚔️ Plan attack</button>`); }
    return `<div class="ec ${s.stance}"><b>${r.icon} ${r.n}</b>${SPEC[r.id] ? `<small style="display:block;opacity:.8">${SPEC[r.id].icon} ${SPEC[r.id].n}</small>` : ''}<span>⚔️ ${Math.round(s.pow)} · ${tierOf(s.pow)} · ${s.owned ? 'yours' : s.by ? '<i>occupied</i>' : s.stance === 'war' ? '<i>at war</i>' : s.stance === 'ally' ? '🤝 ally' : d(s)}</span>
      <div class="rel"><i style="width:${(s.rel + 100)/2}%"></i></div><div class="eb">${btns}</div></div>`;
  }).join('');
  const lands = landKeys().map(k => { const L = land(k);
    return `<div class="ec ${L.lost ? 'war' : ''}"><b>${landName(k)}</b><span>${L.lost ? `🏳️ lost to ${L.by === 'rebels' ? 'rebels' : EMP.list.find(r => r.id === L.by)?.n || 'rivals'}` : `loyalty ${Math.round(L.loy)}% (${loyRate(k) >= 0 ? '+' : ''}${loyRate(k).toFixed(1)}/min)${L.gov ? ' · 🏛️ governor' : ''}`}</span>
      ${L.lost ? `<div class="eb"><button data-l="${k}" ${W.camp || W.raid || W.army < 5 ? 'disabled' : ''}>⚔️ Retake</button></div>` : `<div class="rel loy"><i style="width:${L.loy}%"></i></div>${landSupplyHTML(k)}
      <div class="eb">${L.gov ? '<em>🏛️ Governor in office</em>' : `<button data-g="${k}" ${!W.unlocked.has('senate') || W.coins < govCost() ? 'disabled' : ''}>🏛️ Send governor · ${govCost()} 💵</button>${W.unlocked.has('senate') ? '' : '<em>Build the Senate first</em>'}`}</div>`}</div>`; }).join('');
  return `<div class="emp"><div class="pow">Your strength <b>⚔️ ${mine}</b><small>🛡️ army ${P.army}${P.cav ? ` · ${W.unlocked.has('tanks') ? '🪖' : '🐎'} ${cavName().toLowerCase()} ${P.cav}` : ''} · 🏰 castle ${P.castle} · 🔬 science ${P.science} · ✈️ air ${P.air} · ⚓ navy ${P.navy}${P.allies ? ` · 🤝 allies ${P.allies}` : ''}</small></div>${cards}
    ${lands ? `<h2 class="trh">🏛️ Your provinces</h2><p class="empHint">${W.unlocked.has('senate') ? 'Governors and the Senate win hearts; soldiers alone only keep order.' : 'Soldiers alone only keep order. Build the 🏛️ Senate to win hearts.'}</p>${lands}` : ''}</div>`;
}
function bindEmpire(m) {
  const again = () => { if (m.dataset.panel === 'empire' && !m.hidden) openEmpire(); };
  m.querySelectorAll('.emp button[data-e]').forEach(b => b.onclick = () => { empAct(+b.dataset.e, b.dataset.a); if (!m.hidden && m.dataset.panel === 'trade') openEmpire(); else again(); });
  m.querySelectorAll('.emp button[data-l]').forEach(b => b.onclick = () => retake(b.dataset.l));
  m.querySelectorAll('.emp button[data-sc]').forEach(b => b.onclick = () => { sendScouts(+b.dataset.sc); again(); });
  m.querySelectorAll('.emp button[data-pa]').forEach(b => b.onclick = () => planAttack(+b.dataset.pa));
  m.querySelectorAll('.emp button[data-g]').forEach(b => b.onclick = () => sendGovernor(b.dataset.g));
  m.querySelectorAll('.emp button[data-up]').forEach(b => b.onclick = () => { growLand(b.dataset.up); again(); });
}
// send a governor from the Empire panel: they build roads and listen, so loyalty climbs
function sendGovernor(k) {
  const L = land(k), cost = govCost();
  if (!L || L.gov || L.lost || !W.unlocked.has('senate') || W.coins < cost) return;
  spend(cost); L.gov = true; L.loy = Math.min(100, L.loy + 10);
  banner(`🏛️ A governor for ${landName(k)}`, 'They build roads and listen to the people. Loyalty climbs steadily.'); save(); openEmpire();
}
function openEmpire() {
  const m = $('modal'); m.hidden = false; m.dataset.panel = 'empire';
  m.innerHTML = `<div class="card" style="max-width:520px"><h1 style="font-size:26px">🏛️ Empire &amp; diplomacy</h1>${empireHTML()}<button class="ghost" id="empClose">Close</button></div>`;
  bindEmpire(m); $('empClose').onclick = () => { m.hidden = true; m.dataset.panel = ''; };
}

// ------------------------------------------------------------------ scouts: they ride out and come back with a rival's whereabouts
const scoutDist = r => Math.hypot(r.at[0], r.at[1]);
const scoutCost = r => Math.round(400 + scoutDist(r)*12 + 150*W.era);
function scoutState(r) { const t = (W.flags.scouts || {})[r.id]; return t ? {out:true, left:Math.max(0, Math.ceil(t - W.playT))} : {out:false}; }
function sendScouts(i) {
  const r = EMP.list[i], c = scoutCost(r); if (W.coins < c || scoutState(r).out) return;
  spend(c); (W.flags.scouts ||= {})[r.id] = W.playT + Math.round(30 + scoutDist(r)*.25);
  banner(`🧭 Scouts ride out`, `They follow the ${r.via === 'sea' ? 'coast by boat' : r.via + ' road'} to find whoever lives there.`);
}
function updScouts() {
  const S = W.flags.scouts; if (!S) return;
  for (const [id, t] of Object.entries(S)) {
    if (W.playT < t) continue;
    delete S[id]; const r = EMP.list.find(q => q.id === id); if (!r) continue;
    // what they saw: the city, and the way there
    reveal(r.at[0], r.at[1], 36);
    if (r.via === 'east' || r.via === 'west') for (let x = 0; Math.abs(x) < Math.abs(r.at[0]); x += Math.sign(r.at[0])*20) reveal(x, r.via === 'east' ? 1.9 : 12.1, 14);
    FOG.dirty = true;
  }
}
// ------------------------------------------------------------------ planning an attack on a rival: who goes, against what, and the odds
