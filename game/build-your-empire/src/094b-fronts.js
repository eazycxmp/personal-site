// ------------------------------------------------------------------ fronts: wars on several rivals at once, each fought by the branches you send
// You choose who goes: the army, the cavalry (later tanks), the navy and the air force. A branch fights on one front at a
// time, so splitting your forces lets you fight in several places at once. The first front with the army or cavalry (or the navy)
// is fought on screen; the others are fought far away while their city burns, and you hear how it went.
const BRANCH = [
  {b:'army', icon:() => '🪖', n:() => 'Army'},
  {b:'cav', icon:() => W.unlocked.has('tanks') ? '🪖' : '🐎', n:() => cavName()},
  {b:'navy', icon:() => navLvl() ? NAVY[navLvl()].icon : '⚓', n:() => navName()},
  {b:'air', icon:() => '✈️', n:() => 'Air force'}];
const FRONT_DUR = 55;
const FRONTS = {
  get list() { return W.flags.fronts ||= []; },
  // a branch is busy on a front, or away in the battle on screen
  busy(b) {
    if (FRONTS.list.some(f => f.br.includes(b))) return true;
    const C = W.camp; if (!C) return false;
    if (C.br) return C.br.includes(b);
    return C.branch ? C.branch === b : C.side && (C.type === 'land' ? b === 'army' : C.type === 'sea' ? b === 'navy' : false);
  },
  at(i) { return FRONTS.list.find(f => f.i === i) || (W.camp && W.camp.side && W.camp.rival === i ? W.camp : null); },
};
const branchPow = b => { const P = powerParts(); return b === 'army' ? (W.army >= 5 ? P.army : 0) : P[b] || 0; };
// science and allies back every front
const supportPow = () => { const P = powerParts(); return P.science + P.allies; };
const frontPow = br => br.reduce((a, b) => a + branchPow(b), 0) + supportPow();
// an occupied city is held by the occupier's garrison
const frontNeed = (r, br) => Math.round((occupier(r) ? es(occupier(r)).pow*.6 : es(r).pow) * spec(r, br.length && br.every(b => b === 'navy') ? 'navy' : 'army'));
function frontWhy(r, b) {
  const walled = r.bf && r.id !== 'ostberg', boats = r.via !== 'sea' || W.unlocked.has('boatyard') || W.unlocked.has('warship');
  if (FRONTS.busy(b)) return 'Away fighting on another front';
  if (b === 'army' || b === 'cav') {
    if (b === 'army' && W.army < 5) return 'Train at least 5 soldiers';
    if (b === 'cav' && !cavLvl() && !W.unlocked.has('tanks')) return 'Buy cavalry in the military grounds';
    if (!r.land) return 'No way in by land';
    if (walled && !W.unlocked.has('siegeWorks')) return 'Their city is walled: build the Siege workshop';
    if (!boats) return 'Across the sea: build a boatyard for troop boats';
  }
  if (b === 'navy') { if (!navLvl()) return 'Build a warship first'; if (!r.sea) return 'No coast to sail to'; }
  if (b === 'air' && !planesBuilt()) return 'Build a fighter plane first';
  return '';
}
function launchFront(i, br) {
  const r = EMP.list[i], s = es(r); if (!br.length || br.some(b => frontWhy(r, b)) || FRONTS.at(i)) return;
  const win = frontPow(br) >= frontNeed(r, br);
  if (s.stance !== 'war' && !s.by) empAct(i, 'war');
  // on screen when the stage is free: the army and the cavalry march (or sail over) to fight, or the navy bombards their harbour
  const onLand = br.includes('army') || br.includes('cav');
  // the air force alone: the squadron flies to their city and bombs it, and you can watch
  if (!W.camp && !W.raid && !onLand && !br.includes('navy')) { airStrike(i, win); return; }
  if (!W.camp && !W.raid && (onLand || br.includes('navy'))) { empAct(i, onLand ? 'land' : 'sea', {win, br}); return; }
  FRONTS.list.push({i, br, t:FRONT_DUR, dur:FRONT_DUR, win});
  banner(`⚔️ A new front: ${br.map(b => BRANCH.find(q => q.b === b).icon()).join('')} against ${r.icon} ${r.n}`, win ? 'Your forces should carry the day. Watch their city burn from the map.' : 'They are stronger than what you sent: expect to be driven back.');
  snd(196, .3, 'square', .05); setTimeout(() => snd(262, .3, 'square', .05), 200);
}
function airStrike(i, win) {
  const r = EMP.list[i], n = planesBuilt(), dur = 42 + .7*Math.max(0, n - 1);
  W.camp = {t:dur, dur, type:'air', side:true, rival:i, win, tx:r.at[0], tz:r.at[1], n, br:['air'], id:Math.random()};
  banner(`✈️ ${n} plane${n > 1 ? 's' : ''} fly against ${r.icon} ${r.n}`, 'Tap 🎥 Follow the army (or press F) to ride along.');
  snd(196, .3, 'square', .05); setTimeout(() => snd(262, .3, 'square', .05), 200);
}
function updFronts(dt) {
  for (const f of [...FRONTS.list]) {
    const r = EMP.list[f.i];
    // smoke and fire rise over their city while the fighting lasts
    if (r.at && R() < dt*6) { const x = r.at[0] + (R() - .5)*14, z = r.at[1] + (R() - .5)*14; particle(R() < .4 ? 0xff7a2a : 0x4a4a4a, new THREE.Vector3(x, 1 + R()*2, z), new THREE.Vector3(0, 2.5 + R()*2, 0), 2.4, .5, {grow:1.2, op:.7}); }
    if ((f.t -= dt) > 0) continue;
    FRONTS.list.splice(FRONTS.list.indexOf(f), 1);
    const s = es(r); if (s.owned) continue;
    if (f.win) conquer(r);
    else { s.pow *= 1.1; s.rel -= 10; s.atkT = Math.min(s.atkT, 90); banner(`🏳️ ${r.n} holds the front`, `Their ⚔️${Math.round(s.pow)} was too much for what you sent. Expect a counter-attack.`); }
  }
}
function planAttack(i) {
  const r = EMP.list[i], m = $('modal'); m.hidden = false; m.dataset.panel = 'front';
  const sel = new Set(BRANCH.filter(q => !frontWhy(r, q.b) && branchPow(q.b) > 0).map(q => q.b));
  const draw = () => {
    const br = [...sel], pow = frontPow(br), need = frontNeed(r, br);
    const occ = occupier(r);
    m.innerHTML = `<div class="card"><h1 style="font-size:24px">${occ ? `🏴 Liberate ${r.icon} ${r.n}` : `⚔️ Attack ${r.icon} ${r.n}`}</h1>${occ ? `<p>Held by ${occ.icon} ${occ.n}: you fight their garrison.</p>` : ''}
      <p>Choose who goes. Forces you keep at home can fight on another front at the same time.</p>
      <div class="votes">${BRANCH.map(q => { const why = frontWhy(r, q.b), on = sel.has(q.b);
        return `<button data-br="${q.b}" ${why ? 'disabled style="opacity:.45;cursor:default"' : on ? 'style="outline:3px solid #f2c200"' : ''}><b>${on ? '✅' : '⬜'} ${q.icon()} ${q.n()}</b><small>Strength ${branchPow(q.b)}</small>${why ? `<small>🔒 ${why}</small>` : ''}</button>`; }).join('')}</div>
      <p>You send ⚔️ <b>${pow}</b>${supportPow() ? ` (with 🔬🤝 ${supportPow()} from science and allies)` : ''} against their ⚔️ <b>${need}</b>: ${!br.length ? 'choose at least one' : pow >= need ? '✅ you should win' : '⚠️ you will probably lose'}</p>
      <button id="frGo" ${br.length ? '' : 'disabled'}>⚔️ Attack</button> <button class="ghost" id="frClose">Not now</button></div>`;
    m.querySelectorAll('button[data-br]').forEach(b => b.onclick = () => { if (b.disabled) return; const k = b.dataset.br; if (sel.has(k)) sel.delete(k); else sel.add(k); draw(); });
    $('frGo').onclick = () => { if (!sel.size) return; m.hidden = true; m.dataset.panel = ''; launchFront(i, [...sel]); };
    $('frClose').onclick = () => { m.hidden = true; m.dataset.panel = ''; };
  };
  draw();
}
