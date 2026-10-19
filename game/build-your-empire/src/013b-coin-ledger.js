// ------------------------------------------------------------------ the coin ledger: where your money goes
// Every coin that leaves is booked with what took it (found from the code that spent it). Drops show for a moment
// beside the money chip ("-1,200 📈 Brokers' auto-invest"), and tapping 💵 opens the last five minutes: spent by
// reason, and earned, so money never just vanishes.
const LEDGER = {on:false, log:[], gain:[], pend:{}, flushT:0, el:null};
const SPEND_WHY = {
  payPad:'🏗️ Building', payUpgrade:'⬆️ Upgrading buildings', placeDecor:'🌳 Decorations', updMarket:"📈 Brokers' auto-invest", invest:'📈 Invested in the fund',
  payGas:'⛽ Gas station', payRebuild:'🔨 Rebuilding burned buildings', paySenate:'🏛️ The senate', payFix:'🔧 Repairs in your lands', playSlots:'🎰 The slots',
  payRecruit:'🪖 Recruiting soldiers', growLand:'🏙️ Growing a land', sendGovernor:'👑 Sending a governor', sendScouts:'🔭 Scouts', empAct:'🤝 Gifts and peace deals',
  sendSpy:'🕵️ Spies', payLandMarket:'🧺 Building a land\'s market', ok:'📜 Paying an envoy', updEvents:'🔥 Raiders carried it off', endSiege:'🔥 Looted in a siege',
};
const LEDGER_SKIP = new Set(['set', 'coins', 'whySpent', 'ledgerSpend', 'ledgerIncome', 'spend', 'addCash', 'Error']);
// and where the money comes in from (cash piles count when they are earned, not again when they are picked up)
const INCOME_WHY = {
  update:'🍽️ Customers paying for meals', payOut:'🍽️ Customers paying for meals', zoneAct:'💰 Selling at the market', sellRun:'💰 Workers selling surplus',
  updHomes:'🏠 Rent', updCitizens:'🧑 Townsfolk shopping', landed:'✈️ Airport fares and freight', trainArrives:'🚂 Train freight', updBoats:'⛵ Boats and fishing', boatStep:'⛵ Boats and fishing',
  updOil:'⛽ Oil and fuel', updTrade:'🗺️ Trade routes', updEnvoys:'📜 Trade pacts', updEmpires:'👑 Tribute from your lands', updMarkets:'🛒 Market stalls abroad',
  conquer:'⚔️ Spoils of conquest', updWar:'⚔️ Battle spoils', updEvents:'🛡️ Raiders beaten off', endSiege:'🛡️ Sieges broken', updBoss:'🐉 Monster bounties', updSpies:'🕵️ Spy loot',
  envoyOffer:'🕊️ Peace payments', empAct:'🤝 Diplomacy', updZoo:'🦁 Zoo tickets', updWonders:'🏛️ World wonders', updStrip:'🎰 The Strip', playSlots:'🎰 Slot wins',
  updConcert:'🎤 Concerts', updRugby:'🏉 Rugby', updRideIncome:'🎡 Rides and parks', updInterstate:'🛣️ Road tolls', updHighways:'🛣️ Road tolls', updHighway:'🛣️ Road tolls', updBridge:'🌉 Bridge tolls',
  updSpace:'🚀 Space', updSpaceMining:'☄️ Asteroid mining', updGoals:'🎯 Goal rewards', showOffline:'🌙 Earned while you were away', cashOut:'📈 Cashing out the fund',
  refundWholesaler:'↩️ Refunds', openBuild:'↩️ Refunds'};
const incomeLabel = n => INCOME_WHY[n] || `💵 ${n.replace(/^upd/, '').replace(/([a-z])([A-Z])/g, '$1 $2')}`;
function ledgerIncome(amt, why) {
  if (!LEDGER.on || !(amt > 0)) return;
  why ||= incomeLabel(whySpent());
  const last = LEDGER.gain[LEDGER.gain.length - 1];
  if (last && last.why === why && W.playT - last.t < 2) last.amt += amt; else LEDGER.gain.push({t:W.playT, why, amt});
}
function whySpent() {
  const st = String(new Error().stack || '').split('\n');
  for (const line of st) {
    const m = line.match(/at (?:Object\.|W\.)?([\w$]+)[ (]/) || line.match(/^([\w$]+)@/);
    if (m && !LEDGER_SKIP.has(m[1])) return m[1];
  }
  return '?';
}
const spendLabel = n => SPEND_WHY[n] || `💸 ${n}`;
function ledgerSpend(amt) {
  const why = spendLabel(whySpent()), t = W.playT;
  const last = LEDGER.log[LEDGER.log.length - 1];
  if (last && last.why === why && t - last.t < 1) last.amt += amt; else LEDGER.log.push({t, why, amt});
  LEDGER.pend[why] = (LEDGER.pend[why] || 0) + amt;
}
{
  let coins = W.coins;
  Object.defineProperty(W, 'coins', {enumerable:true, get:() => coins, set:v => {
    const d = v - coins; coins = v;
    if (!LEDGER.on || !d) return;
    if (d < 0) ledgerSpend(-d); else if (!LEDGER.collecting) ledgerIncome(d);
  }});
}
function updLedger(dt) {
  if (!started) return; LEDGER.on = true;
  const old = W.playT - 300; while (LEDGER.log.length && LEDGER.log[0].t < old) LEDGER.log.shift(); while (LEDGER.gain.length && LEDGER.gain[0].t < old) LEDGER.gain.shift();
  if ((LEDGER.flushT -= dt) > 0) return; LEDGER.flushT = 1.2;
  const items = Object.entries(LEDGER.pend).filter(([, a]) => a >= 1); LEDGER.pend = {};
  if (!items.length) return;
  // one pill just left of the money chip, naming the biggest drops of the last moment
  const chip = document.querySelector('#hudR .chip.money'); if (!chip) return;
  const r = chip.getBoundingClientRect(), sr = $('stage').getBoundingClientRect();
  const d = document.createElement('div');
  d.style.cssText = `position:absolute;z-index:6;pointer-events:none;right:${Math.round(sr.right - r.left + 6)}px;top:${Math.round(r.top - sr.top)}px;background:#2b2118e6;color:#ffb3a6;font:800 13px/1 ui-rounded,system-ui,sans-serif;padding:${Math.round((r.height - 13)/2)}px 10px;border-radius:999px;white-space:nowrap;max-width:60vw;overflow:hidden;text-overflow:ellipsis;transition:opacity .6s`;
  d.textContent = items.sort((p, q) => q[1] - p[1]).slice(0, 2).map(([why, a]) => `−${Math.round(a).toLocaleString()} ${why}`).join(' · ');
  if (LEDGER.el) LEDGER.el.remove(); LEDGER.el = d; $('stage').appendChild(d);
  setTimeout(() => { d.style.opacity = '0'; }, 2600); setTimeout(() => d.remove(), 3300);
}
function openLedger() {
  const m = $('modal'); m.hidden = false; m.dataset.panel = 'ledger';
  const by = {}; for (const e of LEDGER.log) by[e.why] = (by[e.why] || 0) + e.amt;
  const inc = {}; for (const g of LEDGER.gain) inc[g.why || '💵 Other'] = (inc[g.why || '💵 Other'] || 0) + g.amt;
  const spent = Object.values(by).reduce((a, b) => a + b, 0), earned = LEDGER.gain.reduce((a, g) => a + g.amt, 0), fmt = n => Math.round(n).toLocaleString();
  const row = (w, a, plus) => `<div style="display:flex;justify-content:space-between;gap:16px;padding:4px 0;border-bottom:1px solid #0001"><span>${w}</span><b style="color:${plus ? '#2f9e44' : '#b83a2a'}">${plus ? '+' : '−'}${fmt(a)}</b></div>`;
  const rows = Object.entries(by).sort((a, b) => b[1] - a[1]).map(([w, a]) => row(w, a)).join('');
  const inRows = Object.entries(inc).sort((a, b) => b[1] - a[1]).map(([w, a]) => row(w, a, true)).join('');
  m.innerHTML = `<div class="card"><h1 style="font-size:24px">💵 Where your money went</h1><p>The last five minutes: earned <b style="color:#2f9e44">+${fmt(earned)}</b>, spent <b style="color:#b83a2a">−${fmt(spent)}</b>.</p>
    <div style="text-align:left;max-height:56vh;overflow:auto"><h3 style="margin:6px 0 2px;font-size:15px">Money in</h3>${inRows || '<p>Nothing came in.</p>'}<h3 style="margin:12px 0 2px;font-size:15px">Money out</h3>${rows || '<p>Nothing spent in the last five minutes.</p>'}</div>
    ${W.autoInvest ? `<p class="keys">Your brokers invest 5% of spare cash for you (your fund holds ${fmt(W.fund || 0)} 💵). <button class="ghost" id="lgAuto">Stop auto-investing</button></p>` : ''}
    <p class="keys">🔨 Repair crew: ${W.flags.autoRepair ? 'repairs automatically, paying from your coins' : 'waits for you (repairs are yours to pay for)'}. <button class="ghost" id="lgRepair">${W.flags.autoRepair ? 'Stop automatic repairs' : 'Let them repair for me'}</button></p>
    <button class="ghost" id="lgClose">Close</button></div>`;
  $('lgClose').onclick = () => { m.hidden = true; };
  $('lgRepair').onclick = () => { W.flags.autoRepair = !W.flags.autoRepair; save(); openLedger(); };
  if ($('lgAuto')) $('lgAuto').onclick = () => { W.autoInvest = false; save(); openLedger(); };
}
$('hudR').addEventListener('click', e => { if (e.target.closest('.money')) openLedger(); });
