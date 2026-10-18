// ------------------------------------------------------------------ spies: sabotage and theft behind the lines
// From a rival's card send a spy: to sabotage them (their garrison fights 15% weaker for five minutes) or to steal from
// their treasury. A cloaked figure slips out of town down the road; the news comes back in about 25 seconds. Science makes
// your spies better; a spy who is caught angers that rival, and can start a war.
const SPY_MISSIONS = {sab:{icon:'🔥', n:'Sabotage'}, steal:{icon:'💰', n:'Steal gold'}};
const spyCost = () => 400 + 150*W.era;
const spyOdds = () => clamp(.55 + powerParts().science*.012, .55, .9);
const spies = () => W.flags.spies ||= [];
const sabotaged = r => (es(r).sabT || 0) > W.playT;
function sendSpy(i, kind) {
  const r = EMP.list[i], s = es(r);
  if (W.coins < spyCost() || spies().some(q => q.i === i) || (s.spyT || 0) > W.playT) return;
  spend(spyCost()); s.spyT = W.playT + 90;
  spies().push({i, kind, t:25});
  // a cloaked figure heads out of town on the road toward them
  const c = makeChar({body:0x1a1a1e, pants:0x1a1a1e, hat:'hood', hatCol:0x101014}), toE = r.at[0] > 0;
  c.g.position.set(toE ? 30 : -9, 0, 1.6); SPYFIG.push({c, vx:toE ? 2.6 : -2.6, t:8});
  note(`🕵️ A spy sets out for ${r.n}`, `${SPY_MISSIONS[kind].icon} ${SPY_MISSIONS[kind].n}: news in about 25 seconds.`);
}
const SPYFIG = [];
function updSpies(dt) {
  for (const f of [...SPYFIG]) { f.t -= dt; f.c.g.position.x += f.vx*dt; f.c.g.rotation.y = f.vx > 0 ? Math.PI/2 : -Math.PI/2; f.c.legL.rotation.x = Math.sin(time*9)*.6; f.c.legR.rotation.x = -Math.sin(time*9)*.6; if (f.t <= 0) { scene.remove(f.c.g); SPYFIG.splice(SPYFIG.indexOf(f), 1); } }
  for (const m of [...spies()]) {
    if ((m.t -= dt) > 0) continue;
    spies().splice(spies().indexOf(m), 1);
    const r = EMP.list[m.i], s = es(r); if (s.owned) continue;
    if (R() < spyOdds()) {
      medal('spy');
      if (m.kind === 'sab') { s.sabT = W.playT + 300; banner(`🔥 Sabotage in ${r.n}!`, 'Their stores burn and their gates are weakened: their garrison fights 15% weaker for 5 minutes.'); }
      else { const g = Math.round(s.pow*40 + 300); W.coins += g; W.earned += g; banner(`💰 Your spy robs ${r.n}`, `+${g} 💵 from their treasury.`); }
    } else {
      s.rel = Math.max(-100, s.rel - 25);
      banner(`🚨 Your spy is caught in ${r.n}`, s.stance === 'peace' && s.rel <= -50 ? 'They are furious, and may declare war.' : 'Relations suffer.');
    }
  }
}
