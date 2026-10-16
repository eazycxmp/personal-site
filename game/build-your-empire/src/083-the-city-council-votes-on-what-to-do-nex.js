// ------------------------------------------------------------------ the city council votes on what to do next
const VOTES = [
  [['💸 Lower taxes', 'Happier people, 10% less rent', {happy:12, rent:.9}], ['🏛️ Raise taxes', '20% more rent, grumpier people', {happy:-12, rent:1.2}]],
  [['🌳 More parks', 'Parks and rides count 50% more', {appeal:1.5}], ['🛡️ Bigger army', 'Five new soldiers join', {army:5}]],
  [['🎓 Fund schools', 'The fund grows faster', {fund:1.5}], ['🛣️ Fix the roads', 'You walk 15% faster', {speed:1.15}]],
  [['🎉 Festival week', 'A festival starts now', {festival:40}], ['🏭 Work week', 'Everything produces 20% faster', {work:1.2}]],
];
const POL = {until:0, eff:{}};
const policy = k => (W.playT < POL.until && POL.eff[k]) || 0;
let voteT = 420, vote = null;
function startVote() {
  vote = {opts:VOTES[(W.flags.votes || 0) % VOTES.length], t:30};
  const m = $('modal'); m.hidden = false; m.dataset.panel = 'vote';
  m.innerHTML = `<div class="card"><h1 style="font-size:24px">🗳️ The city council votes</h1><p>Pick one. If you don't, the council decides in 30 seconds.</p>
    <div class="votes">${vote.opts.map((o, i) => `<button data-i="${i}"><b>${o[0]}</b><small>${o[1]}</small></button>`).join('')}</div></div>`;
  m.querySelectorAll('.votes button').forEach(b => b.onclick = () => decide(+b.dataset.i));
}
function decide(i) {
  if (!vote) return;
  const [name, , eff] = vote.opts[i]; vote = null; W.flags.votes = (W.flags.votes || 0) + 1;
  POL.until = W.playT + 300; POL.eff = {...eff};
  if (eff.army) { W.army += eff.army; for (let k = 0; k < eff.army; k++) { const sl = yardSlot(soldiers.length); makeSoldier(sl[0], sl[1]); } }
  if (eff.festival) W.festival = eff.festival;
  const m = $('modal'); if (m.dataset.panel === 'vote') { m.hidden = true; m.dataset.panel = ''; }
  banner(`🗳️ The council chose: ${name}`, 'It lasts five minutes.'); snd(660, .15, 'triangle', .05);
}
function updCouncil(dt) {
  if (!started || !W.unlocked.has('townhall')) return;
  if (vote) { if ((vote.t -= dt) <= 0) decide(R() < .5 ? 0 : 1); return; }
  if ((voteT -= dt) <= 0) { voteT = 420 + R()*240; startVote(); }
}

