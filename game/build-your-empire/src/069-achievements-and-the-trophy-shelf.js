// ------------------------------------------------------------------ achievements and the trophy shelf
const ACH = [
  ['fish', '🎣', 'First catch', 'Catch a fish', () => W.caught >= 1],
  ['fed100', '😋', 'Busy kitchen', 'Feed 100 travelers', () => W.fed >= 100],
  ['fed1k', '🍽️', 'Famous kitchen', 'Feed 1,000 travelers', () => W.fed >= 1000],
  ['fed5k', '👨‍🍳', 'Legendary kitchen', 'Feed 5,000 travelers', () => W.fed >= 5000],
  ['win1', '⚔️', 'First victory', 'Win a campaign', () => W.conquests >= 1],
  ['winAll', '🌍', 'World conqueror', 'Win every campaign', () => W.conquests >= CAMPAIGNS.length],
  ['army50', '🛡️', 'Standing army', 'Train 50 soldiers', () => W.army >= 50],
  ['army1000', '🎖️', 'Grand army', 'Field 1,000 soldiers', () => W.army >= 1000],
  ['castle', '🏰', 'Stronghold', 'Build the bunker complex', () => (W.castle || 0) >= 4],
  ['water', '💧', 'Clean water', 'Build the modern water plant', () => (W.water || 0) >= 5],
  ['bridge', '🌁', 'Golden gate', 'Build the suspension bridge', () => (W.bridge || 0) >= 4],
  ['train', '🚄', 'Bullet time', 'Run a bullet train', () => (W.train || 0) >= 3],
  ['sky', '🏙️', 'Skyline', 'Build a skyscraper', () => lotStage.some(s => s === 4)],
  ['pop100', '🏠', 'Big city', 'Reach 100 residents', () => population() >= 100],
  ['rich', '💰', 'Millionaire', 'Earn 1,000,000 in total', () => W.earned >= 1e6],
  ['tycoon', '🤑', 'Tycoon', 'Earn 10,000,000 in total', () => W.earned >= 1e7],
  ['fund', '📈', 'Investor', 'Grow your fund past 100,000', () => (W.fund || 0) >= 1e5],
  ['coaster', '🎢', 'Thrill seeker', 'Build a roller coaster', () => (W.decor || []).some(d => d.k === 'coaster')],
  ['cop', '🚓', 'Law and order', 'Catch a robber', () => W.flags.caught],
  ['moon', '🌕', 'One small step', 'Land on the Moon', () => W.flags.moon],
  ['boss', '🐉', 'Monster slayer', 'Defeat a dragon or a kaiju', () => W.flags.boss],
  ['wonders', '🗺️', 'Wonders of the world', 'Build all six wonders', () => wonderCount() >= 6],
  ['jet', '🎒', 'Rocket man', 'Fly with a jetpack', () => W.mount >= 5],
  ['menu', '🍣', 'Full menu', 'Serve ice cream, pizza and sushi', () => !!(ST.creamery && ST.pizzeria && ST.sushi)],
  ['mars', '🔴', 'Red planet', 'Found a colony on Mars', () => W.flags.mars],
];
let achT = 2;
function updAch(dt) {
  if (!started || (achT -= dt) > 0) return; achT = 2;
  const got = W.flags.ach ||= {};
  for (const [id, icon, name, , test] of ACH) if (!got[id] && test()) {
    got[id] = true; banner(`${icon} Trophy: ${name}!`, 'It is on your trophy shelf now.'); news(`Trophy unlocked: ${name}`);
    [659, 784, 988].forEach((f, i) => setTimeout(() => snd(f, .15, 'triangle', .05), i*100));
  }
}
function openTrophies() {
  const got = W.flags.ach || {}, m = $('modal'); m.hidden = false; m.dataset.panel = '';
  m.innerHTML = `<div class="card"><h1 style="font-size:26px">🏆 Trophy shelf</h1><p>${Object.keys(got).length} of ${ACH.length} won</p>
    <div class="shelf">${ACH.map(([id, icon, name, how]) => `<div class="${got[id] ? 'won' : ''}" title="${how}"><span>${got[id] ? icon : '🔒'}</span><b>${name}</b><small>${how}</small></div>`).join('')}</div>
    <button class="ghost" id="trClose">Close</button></div>`;
  $('trClose').onclick = () => { m.hidden = true; };
}

