// ------------------------------------------------------------------ envoys: rivals send ambassadors with offers and demands
// Every few minutes a rival's envoy walks into the town square under their banner. They bring a trade pact, a demand
// for tribute, an offer of alliance, or (at war) gold for peace. Answer on the card; an unanswered offer is withdrawn
// after half a minute.
const ENVOY = {t:240, cur:null, fig:null, card:null};
function envoyOffer(r) {
  const s = es(r), gold = Math.round(600 + s.pow*25);
  if (s.stance === 'war') return {kind:'peace', title:`🕊️ ${r.icon} ${r.n} sues for peace`, text:`They will pay ${gold} 💵 to end the war.`, yes:'Accept their gold', no:'Fight on',
    ok:() => { W.coins += gold; W.earned += gold; s.stance = 'peace'; s.rel = Math.max(s.rel, 0); banner(`🕊️ Peace with ${r.n}`, `+${gold} 💵`); }, refuse:() => { s.rel -= 5; }};
  if (s.rel >= 35 && R() < .4) return {kind:'ally', title:`🤝 ${r.icon} ${r.n} proposes an alliance`, text:'They would pay tribute and fight beside you.', yes:'Become allies', no:'Not now',
    ok:() => { medal('pact'); empAct(EMP.list.indexOf(r), 'ally'); }, refuse:() => { s.rel -= 10; }};
  if (s.pow > myPower()*.9 && R() < .5) return {kind:'tribute', title:`👑 ${r.icon} ${r.n} demands tribute`, text:`Pay ${gold} 💵, or they will take it by force.`, yes:`Pay ${gold} 💵`, no:'Refuse',
    ok:() => { if (W.coins < gold) { s.rel -= 30; banner(`😠 You cannot pay ${r.n}`, 'They take it as an insult.'); return; } spend(gold); s.rel = Math.min(100, s.rel + 15); }, refuse:() => { s.rel -= 30; if (s.rel <= -50 && s.stance === 'peace') { s.stance = 'war'; s.atkT = 90 + R()*60; banner(`⚔️ ${r.n} declares war!`, 'You refused their demand.'); } }};
  const per = Math.round(80 + s.pow*3);
  return {kind:'trade', title:`📜 ${r.icon} ${r.n} offers a trade pact`, text:`${per} 💵 a minute for five minutes, and better relations.`, yes:'Sign the pact', no:'Decline',
    ok:() => { medal('pact'); s.pactT = W.playT + 300; s.pactPer = per; s.rel = Math.min(100, s.rel + 15); }, refuse:() => { s.rel -= 5; }};
}
function envoyCard(o) {
  let c = ENVOY.card;
  if (!c) { c = ENVOY.card = document.createElement('div'); c.style.cssText = 'position:absolute;left:50%;bottom:86px;transform:translateX(-50%);z-index:35;background:rgba(20,24,34,.94);color:#fff;border-radius:16px;padding:14px 18px;font:15px system-ui;max-width:min(92%,420px);box-shadow:0 8px 30px rgba(0,0,0,.4);text-align:center'; $('stage').appendChild(c); }
  c.hidden = !o; if (!o) return;
  c.innerHTML = `<b style="font-size:17px">${o.title}</b><div style="margin:6px 0 10px;opacity:.9">${o.text}</div>
    <button data-v="1" style="font:600 14px system-ui;padding:8px 14px;border-radius:12px;border:0;background:#3fae5a;color:#fff;margin:0 4px;cursor:pointer">${o.yes}</button><button data-v="0" style="font:600 14px system-ui;padding:8px 14px;border-radius:12px;border:0;background:#8a3a3a;color:#fff;margin:0 4px;cursor:pointer">${o.no}</button>`;
  c.querySelectorAll('button').forEach(b => b.onclick = () => answerEnvoy(b.dataset.v === '1'));
}
function answerEnvoy(yes) { const E = ENVOY.cur; if (!E) return; (yes ? E.o.ok : E.o.refuse)(); ENVOY.cur = null; envoyCard(null); E.leaving = true; snd(yes ? 523 : 220, .15, 'triangle', .04); }
function updEnvoys(dt) {
  if (!started) return;
  // a signed pact pays out every minute it lasts
  for (const r of EMP.list) { const s = es(r); if ((s.pactT || 0) > W.playT && (s.pactPayT = (s.pactPayT ?? 60) - dt) <= 0) { s.pactPayT = 60; W.coins += s.pactPer; W.earned += s.pactPer; popText(`📜 +${s.pactPer} from ${r.n}`, player.pos.clone().setY(3.2), '#c8f0a0'); } }
  const E = ENVOY.cur;
  if (E) {
    // the envoy walks up to the square under their banner, waits for your answer, then goes home
    const f = E.fig, tx = E.leaving ? E.from[0] : 3, tz = E.leaving ? E.from[1] : 5.2, dx = tx - f.g.position.x, dz = tz - f.g.position.z, d = Math.hypot(dx, dz);
    if (d > .2) { const k = Math.min(1, 2.4*dt/d); f.g.position.x += dx*k; f.g.position.z += dz*k; f.g.rotation.y = Math.atan2(dx, dz); f.legL.rotation.x = Math.sin(time*9)*.6; f.legR.rotation.x = -Math.sin(time*9)*.6; }
    else { f.legL.rotation.x = f.legR.rotation.x = 0; if (E.leaving) { scene.remove(f.g); ENVOY.cur = null; } }
    if (!E.leaving && (E.t -= dt) <= 0) { answerEnvoy(false); note('📜 The envoy leaves unanswered', 'They take it as a refusal.'); }
    return;
  }
  if ((ENVOY.t -= dt) > 0 || W.camp || W.raid || BOSS.on) return;
  ENVOY.t = 240 + R()*120;
  const pool = EMP.list.filter(r => es(r).met && !es(r).owned && !es(r).by && !(r.sky && !W.unlocked.has('moonLanding')));
  if (!pool.length) return;
  const r = pool[R()*pool.length|0], o = envoyOffer(r), from = r.at[0] > 0 ? [32, 1.6] : [-9, 1.6];
  const fig = makeChar({body:0x6a2a6a, trim:0xf2c200, hat:'tricorne', pants:0xf0ece0}); fig.g.position.set(from[0], 0, from[1]);
  // their banner on a pole over the envoy's shoulder
  const pole = new THREE.Group(); pole.position.set(.35, 0, -.1); fig.g.add(pole); mesh(G.cyl, 0x5e3f22, [.03, 2.6, .03], [0, 1.3, 0], pole);
  const fl = new THREE.Mesh(US_FLAG.geo, flagMat(RIVAL_FLAG[r.id])); fl.scale.set(.9, .6, 1); fl.position.set(.47, 2.25, 0); pole.add(fl);
  ENVOY.cur = {r, o, fig, from, t:30, leaving:false};
  envoyCard(o); snd(392, .2, 'triangle', .04); setTimeout(() => snd(523, .25, 'triangle', .04), 160);
}
