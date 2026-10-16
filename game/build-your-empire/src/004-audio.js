// ------------------------------------------------------------------ audio
let AC = null, muted = false;
const SOUND = {vol:.34, last:new Map(), recent:[]};
// settings live apart from the saves: sound and music volume, graphics, which save slot is in use, the tutorial
const SET_KEY = 'buildyourempire.settings';
const SET = Object.assign({sfx:1, music:1, gfx:'auto', slot:1, tutDone:false}, (() => { try { return JSON.parse(localStorage.getItem(SET_KEY)) || {}; } catch (e) { return {}; } })());
function saveSettings() { try { localStorage.setItem(SET_KEY, JSON.stringify(SET)); } catch (e) {} }
function snd(f = 440, d = 0.08, type = 'sine', v = 0.05, slide = 0, music = false) {
  if (muted) return;
  v *= music ? SET.music : SET.sfx; if (v <= 0) return;
  // keep it calm: the same note never stacks on itself, and only a few sounds play in any second
  const now = performance.now(), key = type + Math.round(f / 20);
  if (now - (SOUND.last.get(key) || -1e9) < 320) return;
  SOUND.recent = SOUND.recent.filter(t => now - t < 1000); if (SOUND.recent.length >= 4) return;
  SOUND.last.set(key, now); SOUND.recent.push(now); v *= SOUND.vol;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + 0.02);
  } catch (e) {}
}

