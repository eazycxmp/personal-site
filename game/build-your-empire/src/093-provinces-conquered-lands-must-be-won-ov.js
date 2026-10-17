// ------------------------------------------------------------------ provinces: conquered lands must be won over, or they revolt
const landKeys = () => [...CAMPAIGNS.slice(0, W.conquests).map((c, i) => 'c' + i), ...EMP.list.filter(r => W.flags.emp?.[r.id]?.owned).map(r => 'r:' + r.id)];
const landName = k => k[0] === 'c' ? CAMPAIGNS[+k.slice(1)].icon + ' ' + CAMPAIGNS[+k.slice(1)].name : (r => r.icon + ' ' + r.n)(EMP.list.find(r => 'r:' + r.id === k));
const land = k => (W.flags.lands ||= {})[k] ||= {loy:k[0] === 'r' ? 25 : 40, gov:false, lost:false};
const govCost = () => 1500 + 600*W.era;
function loyParts(k) {
  const L = land(k), n = landKeys().length;
  return {base:-4, garrison:Math.min(3, W.army / (4 + 2*n)), senate:W.unlocked.has('senate') ? 2.5 : 0, governor:L.gov ? 3.5 : 0,
    festival:W.festival > 0 ? 2 : 0, policy:policy('happy')/6, ruins:DSTYLE[k] && DPARTS[DSTYLE[k]] ? -.6*((W.flags.dmg || {})[DSTYLE[k]] || []).length : 0,
    markets:DSTYLE[k] && DPARTS[DSTYLE[k]] ? .5*DPARTS[DSTYLE[k]].filter((p, i) => p.stall && !(((W.flags.dmg || {})[DSTYLE[k]] || []).includes(i))).length : 0, war:EMP.list.some(r => W.flags.emp?.[r.id]?.stance === 'war') ? -1 : 0};
}
const loyRate = k => Object.values(loyParts(k)).reduce((a, b) => a + b, 0);
function updLands(t) {
  EMP.revoltCd -= t;
  for (const k of landKeys()) {
    const L = land(k); if (L.lost) continue;
    L.loy = clamp(L.loy + loyRate(k)*t/60, 0, 100);
    if (L.loy < 12 && EMP.revoltCd <= 0 && !W.camp && !W.raid && !BOSS.on) { EMP.revoltCd = 90; startRevolt(k); }
  }
}
function startRevolt(k) {
  const L = land(k), need = Math.min(14, 5 + 2*landKeys().length);
  W.flags.revolts = (W.flags.revolts || 0) + 1;
  if (W.army >= need) {
    W.raid = {t:30, dur:30, type:'land', raid:true, revolt:k};
    startBattle({army:Math.min(12, need), name:'Rebels'});
    banner(`🔥 ${landName(k)} revolts!`, 'Rebels take up arms. Your army marches out to restore order.');
  } else {
    L.lost = true; L.by = 'rebels'; W.flags.landsLost = (W.flags.landsLost || 0) + 1;
    banner(`🏳️ ${landName(k)} breaks away!`, 'Your garrison was too small. Retake it from the 🗺️ map, then win them over with the Senate and a governor.');
  }
}
function endRevolt(k) {
  land(k).loy = 35;
  banner(`🛡️ The revolt in ${landName(k)} is crushed`, 'Order is back, but fear is not loyalty: send a governor from the Senate.');
}
function landTribute() {
  return Math.round(landKeys().reduce((a, k) => { const L = land(k); return a + (L.lost ? 0 : (k[0] === 'r' ? 90 : 30) * (.4 + L.loy/100*.9) * tierOfLand(k).mult * fedFactor(landSup(k))); }, 0) + shopIncome());
}
function retake(k) {
  if (W.camp || W.raid) return;
  const need = 10 + 4*landKeys().length, win = myPower() >= need;
  W.camp = {t:30, dur:30, type:'land', side:true, retake:k, win};
  startBattle({army:Math.min(14, 6 + Math.round(need/8)), name:'Rebels'}); if (!win) loseFight();
  banner(`⚔️ Your army marches to retake ${landName(k)}`, 'Stand on the war table to watch.');
  $('modal').hidden = true; $('modal').dataset.panel = '';
}

