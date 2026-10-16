// ------------------------------------------------------------------ earnings while you were away
let offline = 0, awayS = 0, rateT = 0, rateBase = 0;
function trackRate(dt) {
  if ((rateT += dt) < 15) return;
  const d = (W.earned - rateBase) / rateT;
  W.rate = W.rate ? W.rate*.7 + d*.3 : d;
  rateT = 0; rateBase = W.earned;
}
const fmtAway = s => s >= 3600 ? `${Math.floor(s/3600)}h ${Math.floor(s % 3600 / 60)}m` : `${Math.floor(s/60)}m`;
function showOffline() {
  if (offline <= 0) return;
  const m = $('modal'); m.hidden = false;
  m.innerHTML = `<div class="card"><h1 style="font-size:28px">🌙 Welcome back!</h1>
    <p>While you were away for <b>${fmtAway(awayS)}</b>, your helpers kept cooking and serving.</p>
    <p style="font-size:30px;font-weight:900;color:#2f9e44;margin:6px 0">+${offline} 💵</p>
    <button class="big" id="bCollect">Collect</button></div>`;
  $('bCollect').onclick = () => {
    W.coins += offline; W.earned += offline; offline = 0; m.hidden = true;
    flyCash(stage.clientWidth/2, stage.clientHeight/2, 8); snd(1046, .1, 'triangle', .05); save();
  };
}

