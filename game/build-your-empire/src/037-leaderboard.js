// ------------------------------------------------------------------ leaderboard
const LB_URL = '/api/build-your-empire/leaderboard';
function lbList(el, rows, unit) {
  el.textContent = '';
  if (!rows.length) { const li = document.createElement('li'); li.textContent = 'No scores yet'; el.appendChild(li); return; }
  for (const r of rows) { const li = document.createElement('li'); li.textContent = `${r.name} · ${r.value} ${unit}`; el.appendChild(li); }
}
async function lbLoad() {
  try {
    const res = await fetch(LB_URL); if (!res.ok) throw 0;
    const d = await res.json(); lbList($('lbFed'), d.fed || [], 'fed'); lbList($('lbEmp'), d.empire || [], 'min');
  } catch (e) { $('lbMsg').textContent = 'The leaderboard only works on espencampbell.com.'; }
}
async function lbPost(board, value) {
  const name = $('lbName').value.trim() || 'Anon';
  try { localStorage.setItem('bye.name', name); } catch (e) {}
  $('lbMsg').textContent = 'Posting…';
  try {
    const res = await fetch(LB_URL, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name, board, value})});
    if (!res.ok) throw 0;
    const d = await res.json(); lbList($('lbFed'), d.fed || [], 'fed'); lbList($('lbEmp'), d.empire || [], 'min');
    $('lbMsg').textContent = 'Posted!';
  } catch (e) { $('lbMsg').textContent = 'Could not post right now.'; }
}
function openBoard() {
  const m = $('modal'); m.hidden = false;
  m.innerHTML = `<div class="card"><h1 style="font-size:26px">🏆 Leaderboard</h1>
    <div class="board"><div><h3>😋 Most guests fed</h3><ol id="lbFed"><li>Loading…</li></ol></div>
    <div><h3>🌍 Fastest to Empire</h3><ol id="lbEmp"><li>Loading…</li></ol></div></div>
    <p><input id="lbName" maxlength="12" placeholder="Your name"></p>
    <button class="big" id="lbPostFed">Post ${W.fed} fed</button>
    ${W.flags.empireMin ? `<button class="big" id="lbPostEmp">Post ${W.flags.empireMin} min</button>` : ''}
    <p id="lbMsg" class="keys"></p><button class="ghost" id="lbClose">Close</button></div>`;
  try { $('lbName').value = (localStorage.getItem('bye.name') ?? localStorage.getItem('riverfeast.name')) || ''; } catch (e) {}
  $('lbPostFed').onclick = () => lbPost('fed', W.fed);
  if ($('lbPostEmp')) $('lbPostEmp').onclick = () => lbPost('empire', W.flags.empireMin);
  $('lbClose').onclick = () => { m.hidden = true; };
  lbLoad();
}

