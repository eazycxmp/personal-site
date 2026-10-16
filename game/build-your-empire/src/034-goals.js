// ------------------------------------------------------------------ goals
const GOAL_TXT = {fed:n => `Feed ${n} guests`, earned:n => `Earn ${n} 💵`, unlocks:n => `Build ${n} new things`, upgrades:n => `Upgrade buildings ${n}×`,
  fish:n => `Catch ${n} fish yourself`, army:n => `Train ${n} more soldiers`, conquest:() => 'Win a campaign'};
const goalCount = type => ({fed:W.fed, earned:W.earned, unlocks:W.unlocked.size, upgrades:W.flags.upgrades || 0, fish:W.caught, army:W.army, conquest:W.conquests})[type];
function newGoal() {
  const k = 1 + W.era, have = W.goals.map(g => g.type);
  const pool = [['fed', 8*k], ['earned', Math.round(150*k*k/50)*50], ['fish', 15 + 5*k]];
  if (PADS.some(p => !p.hidden && !W.unlocked.has(p.id))) pool.push(['unlocks', 2]);
  if (Object.keys(upZones).length) pool.push(['upgrades', 2]);
  if (W.unlocked.has('mess')) pool.push(['army', 5]);
  if (warZone && W.conquests < CAMPAIGNS.length) pool.push(['conquest', 1]);
  const opts = pool.filter(([t]) => !have.includes(t));
  const [type, n] = opts[R()*opts.length|0];
  const reward = Math.round(30 * Math.pow(k, 1.7) * (type === 'conquest' ? 4 : type === 'army' ? 2 : 1) / 5) * 5;
  return {type, n, base:goalCount(type), reward};
}
let goalT = 0, goalsHtml = '';
function updGoals(dt) {
  if (W.tut < TUT.length || (goalT -= dt) > 0) return;
  goalT = .5;
  while (W.goals.length < 3) W.goals.push(newGoal());
  for (const g of [...W.goals]) {
    if (goalCount(g.type) - g.base < g.n) continue;
    W.coins += g.reward; W.earned += g.reward;
    banner(`🎯 ${GOAL_TXT[g.type](g.n)}!`, `Goal complete: +${g.reward} 💵`);
    flyCash(110, stage.clientHeight * .35, 6);
    [659, 880, 1175].forEach((f, i) => setTimeout(() => snd(f, .12, 'triangle', .045), i*90));
    W.goals.splice(W.goals.indexOf(g), 1, newGoal());
    save();
  }
}
function renderGoals() {
  const html = W.tut < TUT.length ? '' : W.goals.map(g => {
    const prog = Math.min(g.n, goalCount(g.type) - g.base);
    return `<div class="goal">🎯 ${GOAL_TXT[g.type](g.n)}<small>${prog}/${g.n} · reward ${g.reward} 💵</small><i><b style="width:${Math.round(prog/g.n*100)}%"></b></i></div>`;
  }).join('');
  if (html !== goalsHtml) { goalsHtml = html; $('goals').innerHTML = html; }
}

