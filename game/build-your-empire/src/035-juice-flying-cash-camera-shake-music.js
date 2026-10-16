// ------------------------------------------------------------------ juice: flying cash, camera shake, music
function flyCash(x, y, n) {
  const chip = document.querySelector('.chip.money'); if (!chip) return;
  const sr = stage.getBoundingClientRect(), cr = chip.getBoundingClientRect();
  const tx = cr.left - sr.left + 12, ty = cr.top - sr.top + 6;
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div'); el.className = 'flycash'; el.textContent = '💵';
    const sx = x + (R() - .5)*36, sy = y + (R() - .5)*24;
    el.style.left = sx + 'px'; el.style.top = sy + 'px'; stage.appendChild(el);
    setTimeout(() => { el.style.transform = `translate(${tx - sx}px, ${ty - sy}px) scale(.6)`; el.style.opacity = '.4'; }, 30 + i*45);
    setTimeout(() => { el.remove(); chip.classList.add('bump'); setTimeout(() => chip.classList.remove('bump'), 140); }, 720 + i*45);
  }
}
let camShake = 0;
const shakeCam = a => { camShake = Math.max(camShake, a); };
// a gentle generated tune: a bass note per bar, pentatonic plucks on top
let musicT = null;
function startMusic() {
  if (musicT) return;
  const N = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784];
  const BARS = [[0, 2, 4], [4, 6, 8], [3, 5, 7], [1, 3, 5]];
  let beat = 0;
  musicT = setInterval(() => {
    if (muted || document.hidden || !started || paused) return;
    const ch = BARS[Math.floor(beat / 8) % 4], step = beat % 8;
    if (step === 0) snd(N[ch[0]] / 2, 1.8, 'sine', .022, 0, true);
    if (step % 2 === 0 ? R() < .85 : R() < .3) snd(N[ch[R()*3|0]] * (R() < .2 ? 2 : 1), .4, 'triangle', .012, 0, true);
    beat++;
  }, 280);
}

