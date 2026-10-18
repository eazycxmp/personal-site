// ------------------------------------------------------------------ battle music
// While you watch a battle: a slow drum and horn on the march, then the drums double, a snare cracks and brass chords
// swell over a minor bass once the fighting starts. Its own little synth (the sound effects are rate-limited), scheduled
// a moment ahead on the audio clock so the beat stays steady, at the music volume.
const MUSIC = {on:false, next:0, beat:0, gain:null, noise:null, level:0};
const NOTE = n => 440*Math.pow(2, (n - 69)/12);
// D minor: Dm, Bb, C, A (with its major third, for the pull back home)
const PROG = [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]];
function musicOut() {
  if (!AC) return null;
  if (!MUSIC.gain) { MUSIC.gain = AC.createGain(); MUSIC.gain.gain.value = 0; MUSIC.gain.connect(AC.destination);
    const b = AC.createBuffer(1, AC.sampleRate*.3, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1; MUSIC.noise = b; }
  return MUSIC.gain;
}
function tone(t, f, d, type, v, slide, filt) {
  const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(f*slide, t + d);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  let n = o.connect(g); if (filt) { const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = filt; n = n.connect(lp); } n.connect(MUSIC.gain); o.start(t); o.stop(t + d + .05);
}
function snare(t, v) { const s = AC.createBufferSource(), g = AC.createGain(), bp = AC.createBiquadFilter(); s.buffer = MUSIC.noise; bp.type = 'bandpass'; bp.frequency.value = 1800; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .14); s.connect(bp).connect(g).connect(MUSIC.gain); s.start(t); s.stop(t + .16); }
function updMusic(dt) {
  const C = W.camp || W.raid, want = !!C && watchingWar() && !muted && SET.music > 0;
  const out = musicOut(); if (!out) return;
  const fight = C && ((C.type === 'land' && C.t <= 22 && C.t > 9) || C.assault || (C.type !== 'land' && C.dur - C.t > 15));
  MUSIC.level += ((want ? (fight ? 1 : .6) : 0) - MUSIC.level)*Math.min(1, dt*1.5);
  out.gain.setTargetAtTime(MUSIC.level*.22*SET.music*SOUND.vol*3, AC.currentTime, .3);
  if (MUSIC.level < .02) { MUSIC.next = 0; return; }
  // schedule the beats that fall in the next fifth of a second
  const beatLen = .5; if (!MUSIC.next || MUSIC.next < AC.currentTime) MUSIC.next = AC.currentTime + .05;
  while (MUSIC.next < AC.currentTime + .2) {
    const t = MUSIC.next, b = MUSIC.beat++, bar = Math.floor(b/4) % 4, inBar = b % 4, chord = PROG[bar];
    tone(t, 75, .3, 'sine', .5, .5);                                                        // the drum on every beat
    if (fight) { tone(t + beatLen/2, 75, .2, 'sine', .3, .5); if (inBar % 2) snare(t, .25); }   // doubled, with a snare, in the fight
    if (inBar === 0) {
      tone(t, NOTE(chord[0] - 12), beatLen*4, 'triangle', .28);                            // the bass holds the bar
      for (const n of chord) tone(t, NOTE(n), beatLen*(fight ? 1.6 : 3.4), 'sawtooth', fight ? .09 : .05, 0, fight ? 2200 : 1100);   // brass
    }
    if (fight && inBar === 2) for (const n of chord) tone(t, NOTE(n + 12), beatLen*.9, 'sawtooth', .05, 0, 2600);
    if (!fight && inBar === 2 && bar % 2 === 0) tone(t, NOTE(chord[2]), beatLen*1.8, 'square', .05, 0, 900);   // a horn call on the march
    MUSIC.next += beatLen;
  }
}
