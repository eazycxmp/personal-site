// ------------------------------------------------------------------ brokers: once nothing is left to build, builders put on suits and play the market
const BROKER = {top:'suit', body:0xf4f4f4, body2:0x1e1e26, pants:0x1e1e26, hair:'sidepart', hairCol:0x2a1a10, acc:'sunglasses', shoe:0x111114, skin:0xe8b892};
const MKT = {t:2, idx:[100], ex:null, led:null, ledT:0};
const brokers = () => workers.filter(w => w.kind === 'broker');
const exchangeAt = () => [37, -9.3];
function buildingDone() { return PADS.every(p => p.cur === 'coin' || W.unlocked.has(p.id)); }
function exchangeFx(anim) {
  // a grand exchange: marble steps, columns, a pediment, a ticker board and a golden bull
  const g = new THREE.Group(); g.position.set(39, 0, -11.4); g.scale.z = .82; scene.add(g); MKT.ex = g;
  const MARB = 0xeee8dc, MARB2 = 0xd9d2c2;
  for (let i = 0; i < 3; i++) mesh(G.box, MARB2, [4.4 - i*.2, .14, 3.2 - i*.2], [0, .07 + i*.14, .1 - i*.05], g);
  mesh(G.box, MARB, [3.8, 2.6, 2.2], [0, 1.72, -.3], g);
  for (let i = 0; i < 6; i++) { mesh(G.cyl, 0xf8f4ec, [.13, 2.5, .13], [-1.6 + i*.64, 1.67, 1.1], g); mesh(G.box, MARB2, [.32, .12, .32], [-1.6 + i*.64, 2.95, 1.1], g); }
  mesh(G.box, MARB2, [4.1, .3, 2.7], [0, 3.1, -.05], g);
  const ped = mesh(G.cone4, MARB, [1, .9, 1], [0, 3.65, .2], g); ped.rotation.y = Math.PI/4; ped.scale.set(3.1, .9, 2);
  const name = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('EXCHANGE', '#eee8dc', '#3a2a10')})); name.scale.set(2.6, .42, 1); name.position.set(0, 3.12, 1.27); g.add(name);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(.9, 18, 10, 0, Math.PI*2, 0, Math.PI/2), mat(0x3f7a6a, {metalness:.5, roughness:.35})); dome.position.set(0, 3.25, -.6); dome.castShadow = true; g.add(dome);
  mesh(G.box, 0x2a1d12, [.8, 1.4, .05], [0, 1.1, .81], g);
  // the live ticker across the front, and big boards on the side
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; MKT.led = {c, t:new THREE.CanvasTexture(c)}; MKT.led.t.colorSpace = THREE.SRGBColorSpace;
  const led = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:MKT.led.t, toneMapped:false})); led.scale.set(2.8, .45, 1); led.position.set(0, 2.55, .82); g.add(led);
  const side = new THREE.Mesh(G.plane, led.material); side.scale.set(1.8, .45, 1); side.rotation.y = Math.PI/2; side.position.set(1.91, 2.2, -.3); g.add(side);
  // a golden bull out front
  const bull = new THREE.Group(); bull.position.set(-1.6, .42, 1.9); bull.rotation.y = .5; g.add(bull);
  const GOLD = {metalness:.85, roughness:.25};
  mesh(G.box, 0xd9a52a, [.5, .4, .9], [0, .5, 0], bull, GOLD); mesh(G.box, 0xd9a52a, [.36, .34, .3], [0, .62, .58], bull, GOLD);
  for (const sx of [-1, 1]) { mesh(G.cone, 0xd9a52a, [.06, .28, .06], [sx*.2, .86, .66], bull, GOLD).rotation.z = -sx*.9; for (const zz of [-.3, .3]) mesh(G.box, 0xd9a52a, [.1, .32, .1], [sx*.16, .16, zz], bull, GOLD); }
  mesh(G.box, 0x8a8478, [.9, .1, 1.3], [0, -.02, 0], bull);
  boxes.push({x0:36.9, x1:41.1, z0:-12.75, z1:-10.05});
  fader(g, 4.4, 4);
  if (anim) popIn(g);
  drawLed();
}
function drawLed() {
  if (!MKT.led) return;
  const h = MKT.idx, ch = h.length > 1 ? (h[h.length - 1] / h[Math.max(0, h.length - 31)] - 1) * 100 : 0, g = MKT.led.c.getContext('2d');
  g.fillStyle = '#0a0f18'; g.fillRect(0, 0, 256, 64); g.font = '900 36px ui-monospace,monospace'; g.textBaseline = 'middle';
  g.fillStyle = ch >= 0 ? '#5aff9a' : '#ff5a5a'; g.fillText(`BYE ${ch >= 0 ? '▲' : '▼'}${Math.abs(ch).toFixed(1)}%`, 10, 34);
  MKT.led.t.needsUpdate = true;
}
function addTraders(n) {
  for (let i = 0; i < n; i++) {
    const w = addWorker('broker', 6.1 + i*1.2, 65.6, false);
    scene.remove(w.char.g); w.char = makeChar(BROKER); w.char.g.position.set(w.pos.x, 0, w.pos.z);
    mesh(G.box, 0x2a1a10, [.08, .26, .36], [0, -.58, 0], w.char.armR); w.state = 'walk';
  }
  investTile();
}
function becomeBroker(w) {
  for (const it of w.stack.items) scene.remove(it.mesh); w.stack.items.length = 0;
  const old = w.char; scene.remove(old.g);
  w.char = makeChar(BROKER); w.char.g.position.copy(old.g.position);
  mesh(G.box, 0x2a1a10, [.08, .26, .36], [0, -.58, 0], w.char.armR);
  w.kind = 'broker'; w.state = 'walk'; w.goal = null; w.wait = 0;
  puff(w.pos.x, w.pos.z);
  if (started && !W.flags.brokers) banner('📈 Your builders became stockbrokers!', 'Nothing is left to build, so they trade instead. Tap 📈 Invest to grow your cash.');
  investTile(); W.flags.brokers = true;
}
function updBroker(w, dt) {
  if (w.wait > 0) { w.wait -= dt; w.vel.set(0, 0, 0); w.char.armL.rotation.x = -2.2 + Math.sin(time*6)*.2; return; }
  if (!w.goal) { const [x, z] = exchangeAt(); w.goal = R() < .5 ? [x - .9, z + .9] : [x + (R() - .5)*9, z + (R() - .5)*.8]; }   // stay on the street
  if (goTo(w, w.goal[0], w.goal[1], dt)) { w.goal = null; w.wait = 2 + R()*3; }
}
// every level of the university, and its research lab, makes the brokers smarter
const uniBoost = () => !W.unlocked.has('library') ? 0 : (W.unlocked.has('aiLab') ? .00005 : 0) + (W.unlocked.has('superAI') ? .00008 : 0) + .000015*lvl('library') + (W.unlocked.has('university') ? .00003 : 0) + (W.unlocked.has('labs') ? .00005 : 0);
const gauss = () => (R() + R() + R() + R() - 2) * 1.2;
function updMarket(dt) {
  if (!started) return;
  // brokers need somewhere to work: the stock exchange
  if (W.unlocked.has('exchange') && workers.some(w => w.kind === 'builder') && buildingDone()) for (const w of workers) if (w.kind === 'builder') becomeBroker(w);
  // with every war won and the rival at peace, some soldiers hang up their gear and trade instead
  if (W.unlocked.has('exchange') && W.conquests >= CAMPAIGNS.length && (W.rivalAlly || W.conquests >= CAMPAIGNS.length && !W.rival) && !W.flags.traders && !W.camp && !W.raid && W.army >= 6) {
    const n = Math.min(6, Math.floor(W.army / 2));
    W.army -= n; W.flags.traders = n;
    while (soldiers.length > Math.min(W.army, 24)) { const s = soldiers.pop(); scene.remove(s.char.g); stacks.delete(s.stack); if (s.bar) scene.remove(s.bar); puff(s.pos.x, s.pos.z); }
    addTraders(n);
    if (started) banner('📈 Soldiers turn stock traders!', `With every war won, ${n} soldiers trade on the market instead. Better returns for your fund.`);
  }
  if ((MKT.t -= dt) > 0) return;
  MKT.t = 2;
  const n = brokers().length; if (!n && !W.fund) return;
  let r = .00012 + .00004*Math.min(12, n) + uniBoost()*(policy('fund') || 1) + gauss()*.006;
  if (R() < .002) { r -= .12; if (W.fund) banner('📉 Market crash!', 'Your fund drops. Markets go up and down: hold on, or cash out.'); }
  else if (R() < .002) { r += .1; if (W.fund) banner('📈 Market boom!', 'Your fund jumps.'); }
  MKT.idx.push(MKT.idx[MKT.idx.length - 1] * (1 + r)); if (MKT.idx.length > 120) MKT.idx.shift();
  if (W.fund) { const d = Math.round(W.fund * r); W.fund = Math.max(0, W.fund + d); W.earned += d; }
  // brokers trusted with spare cash invest a slice of it each tick
  if (W.autoInvest) {
    // only cash beyond what the next build needs: saving up is never blocked
    const next = PADS.filter(p => p.cur === 'coin' && !W.unlocked.has(p.id)).map(p => p.cost - (W.paid[p.id] || 0)), keep = Math.max(8000, next.length ? Math.max(...next) : 0);
    if (W.coins > keep) { const a = Math.floor((W.coins - keep) * .05); W.coins -= a; W.fund = (W.fund || 0) + a; W.fundIn = (W.fundIn || 0) + a; }
  }
  drawLed();
  if (!$('modal').hidden && $('modal').dataset.panel === 'invest') openInvest(true);
}
function invest(frac) { const a = Math.floor(W.coins * frac); if (a <= 0) return; W.coins -= a; W.fund = (W.fund || 0) + a; W.fundIn = (W.fundIn || 0) + a; snd(660, .1, 'triangle', .05); save(); openInvest(true); }
function cashOut() { if (!W.fund) return; W.coins += W.fund; popText(`+${W.fund} 💵`, player.pos.clone().setY(2.8), '#ffe06b'); W.fund = 0; W.fundIn = 0; snd(880, .15, 'triangle', .05); save(); openInvest(true); }
function openInvest(refresh) {
  const m = $('modal'); m.hidden = false; m.dataset.panel = 'invest';
  const gain = (W.fund || 0) - (W.fundIn || 0), n = brokers().length;
  m.innerHTML = `<div class="card"><h1 style="font-size:26px">📈 Empire Fund</h1>
    <p>${n} broker${n === 1 ? '' : 's'} trade for you. More brokers, better returns, but markets can fall too.</p>
    <p class="keys">🎓 ${W.unlocked.has('labs') ? 'Research lab' : W.unlocked.has('university') ? 'University' : 'Library'} Lv ${lvl('library')}: +${Math.round(uniBoost()*30*100*10)/10}% a minute. Upgrade it for better returns.</p>
    <canvas id="mktChart" width="380" height="120" style="width:100%;max-width:380px;border-radius:10px;background:#0a0f18"></canvas>
    <p style="font-size:20px;font-weight:900;margin:6px 0">${(W.fund || 0).toLocaleString()} 💵 <small style="color:${gain >= 0 ? '#2f9e44' : '#c0392b'}">${gain >= 0 ? '+' : ''}${gain.toLocaleString()}</small></p>
    <p><button class="big" id="iv25">Invest 25%</button> <button class="big" id="iv100">Invest all</button></p>
    <p><button class="big" id="ivOut" ${W.fund ? '' : 'disabled'}>Cash out</button></p>
    <p class="keys"><label><input type="checkbox" id="ivAuto" ${W.autoInvest ? 'checked' : ''}> Let the brokers invest 5% of spare cash for me</label></p>
    <button class="ghost" id="ivClose">Close</button></div>`;
  const cv = $('mktChart'), g = cv.getContext('2d'), h = MKT.idx, lo = Math.min(...h), hi = Math.max(...h);
  g.strokeStyle = h[h.length - 1] >= h[0] ? '#5aff9a' : '#ff5a5a'; g.lineWidth = 3; g.beginPath();
  h.forEach((v, i) => { const x = i / Math.max(1, h.length - 1) * 370 + 5, y = 110 - (v - lo) / Math.max(1e-6, hi - lo) * 100; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
  $('iv25').onclick = () => invest(.25); $('iv100').onclick = () => invest(1); $('ivOut').onclick = cashOut;
  $('ivAuto').onchange = e => { W.autoInvest = e.target.checked; save(); };
  $('ivClose').onclick = () => { m.hidden = true; m.dataset.panel = ''; };
}

