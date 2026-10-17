// ------------------------------------------------------------------ trade routes to the other empires
const TRADE = {cities:[
  {n:'Ostberg', icon:'🏰', far:30}, {n:'Sahra', icon:'🐪', far:40}, {n:'Port Azul', icon:'⚓', far:35}, {n:'Kumo', icon:'🏯', far:55}, {n:'New Avalon', icon:'🌆', far:45}],
  goods:['grilled', 'bread', 'beer', 'ingot', 'sword', 'tools', 'roast'], deals:[], trips:[], t:0};
function tradeDeals() {
  // every city wants something different, and the prices drift
  TRADE.deals = TRADE.cities.map((c, i) => { const good = TRADE.goods[(i*3 + Math.floor(W.playT / 180)) % TRADE.goods.length]; return {c, i, good, qty:6 + ((i*5 + Math.floor(W.playT / 60)) % 10), mult:+(2 + ((i*7 + Math.floor(W.playT / 90)) % 9)*.35).toFixed(2)}; });
}
const pileOf = item => Object.values(ST).filter(s => s.outStack && (s.out === item || s.gen === item || s.pile === item));
const stockOf = item => pileOf(item).reduce((a, s) => a + s.outStack.count([item]), 0);
function openTrade() {
  tradeDeals();
  const rel = W.flags.rel || {}, m = $('modal'); m.hidden = false; m.dataset.panel = 'trade';
  m.innerHTML = `<div class="card"><h1 style="font-size:26px">🗺️ Empires &amp; trade</h1>${empireHTML()}<h2 class="trh">🚚 Trade routes</h2><p>Ship your surplus to other empires. Allies (3 trades) pay 25% more.</p>
    <div class="trades">${TRADE.deals.map(d => { const have = stockOf(d.good), ally = (rel[d.c.n] || 0) >= 3, price = Math.round(d.qty * (ITEM[d.good].sell || 2) * d.mult * (ally ? 1.25 : 1) * (1 + W.era*.15)), busy = TRADE.trips.some(t => t.city === d.c.n);
      return `<div><b>${d.c.icon} ${d.c.n}${ally ? ' 🤝' : ''}</b><span>wants ${d.qty} ${ITEM[d.good].icon} · pays ${price} 💵</span><button data-i="${d.i}" ${have < d.qty || busy ? 'disabled' : ''}>${busy ? 'On the road…' : have < d.qty ? `You have ${have}` : 'Ship it'}</button></div>`; }).join('')}</div>
    <button class="ghost" id="trdClose">Close</button></div>`;
  m.querySelectorAll('.trades button').forEach(b => b.onclick = () => ship(+b.dataset.i));
  bindEmpire(m);
  $('trdClose').onclick = () => { m.hidden = true; m.dataset.panel = ''; };
}
function ship(i) {
  const d = TRADE.deals[i], rel = W.flags.rel || {}, ally = (rel[d.c.n] || 0) >= 3; let left = d.qty;
  for (const s of pileOf(d.good)) while (left > 0 && s.outStack.count([d.good])) { const it = s.outStack.take([d.good]); scene.remove(it.mesh); left--; }
  const hr = EMP.list.find(r => r.n.replace(/^the /, '') === d.c.n.replace(/^the /, '')), onHwy = !!(hr && HWY.built[hr.id]);
  const pay = Math.round(d.qty * (ITEM[d.good].sell || 2) * d.mult * (ally ? 1.25 : 1) * (1 + W.era*.15) * (onHwy ? 1.3 : 1));
  // a caravan, then a truck, rolls off down the east road
  const v = vehicle(W.era >= 6 ? 0x3f7cc0 : 0x8a5d36, 14, 1.6, W.era >= 6 ? 'car' : 'bus'); v.speed = 5;
  driveTo(v, [[66, 1.6]], () => { v.g.visible = false; });
  TRADE.trips.push({city:d.c.n, t:onHwy ? Math.round(d.c.far*.5) : d.c.far, pay, v});
  banner(`🚚 Shipment to ${d.c.icon} ${d.c.n}`, `${d.qty} ${ITEM[d.good].n.toLowerCase()} on the road. Back in ${d.c.far}s with ${pay} 💵.`);
  openTrade();
}
function updTrade(dt) {
  for (const tr of [...TRADE.trips]) {
    updVehicle(tr.v, dt);
    if ((tr.t -= dt) > 0) continue;
    TRADE.trips.splice(TRADE.trips.indexOf(tr), 1); scene.remove(tr.v.g);
    W.coins += tr.pay; W.earned += tr.pay; const rel = W.flags.rel ||= {}; rel[tr.city] = (rel[tr.city] || 0) + 1;
    const er = EMP.list.find(r => r.n === tr.city); if (er && W.flags.emp?.[er.id]) es(er).rel = Math.min(100, es(er).rel + 8);
    banner(`💰 Trade with ${tr.city}: +${tr.pay}`, rel[tr.city] === 3 ? `${tr.city} is now your ally: better prices from here on.` : 'The caravan is home.');
    snd(880, .15, 'triangle', .05);
  }
}

