// Drum & bass / jungle DJ engine. Drums are real TR-909 / TR-808 recordings (assets/drums)
// chopped into breakbeats; sub bass plays the tuned 808 sample pitched per note; reese,
// wobble and growl basses are distorted Web Audio synths. Everything is in A minor so the
// DJ-style blends between tracks stay in key.
//   town   - liquid DnB, 172 BPM
//   route  - jungle, 168 BPM (chopped break, rolling 808 subs, reese stabs)
//   wild   - dancefloor DnB, 174 BPM (two-step, hard wobble reese) - wild monsters in grass
//   battle - ragga jungle, 170 BPM (chopped break, 808 slides, air horns) - trainers
//   boss   - neurofunk / jump-up, 176 BPM (growl bass, hoover stabs) - gym leaders, Champion
//   win    - liquid roller, 172 BPM
//   chill  - lo-fi beats, 82 BPM (home, starting town, centers, marts)
//   funky  - funky house, 122 BPM (Ember City, Ember/Tide gyms); funkboss = leader fights
//   mystery - dark Phrygian half-time, 96 BPM (Shade Hollow, Shade gym, Champion's Hall)
//   darkboss - dark techno, 132 BPM (Shade leader fight)
// Cymbals are mixed low on purpose (see CYMBAL).
window.HouseDJ = (function () {
  let ac = null, master = null, noise = null, curve = null, meter = null, muted = false;
  const decks = [];
  const S = {};
  let wanted = null;
  const B808_MIDI = 31.04; // measured fundamental of 808/BD2510-g1.wav (49.1 Hz)

  const SAMPLES = {
    kick: "909/BT3AADA.WAV", kickHard: "909/BT7AADA.WAV", snare: "909/ST7T7S7.WAV", snareShort: "909/STAT3S3.WAV",
    clap: "909/HANDCLP1.WAV", hat: "909/HHCD2.WAV", openHat: "909/HHOD4.WAV",
    crash: "909/CSHD0.WAV", ride: "909/RIDED2.WAV", rim: "909/RIM127.WAV",
    boom: "808/BD2510-g1.wav", clap808: "808/CP.WAV", cowbell: "808/CB.WAV", rim808: "808/RS.WAV",
    hat808: "808/CH.WAV", shaker: "808/MA.WAV",
  };
  const mtof = (n) => 440 * Math.pow(2, (n - 69) / 12);

  function init() {
    if (ac) return;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -12; comp.ratio.value = 5; comp.attack.value = 0.002; comp.release.value = 0.1;
    master = ac.createGain();
    master.gain.value = muted ? 0 : 0.5;
    // bus compressor -> makeup -> brick-wall limiter -> clip guard
    const limiter = ac.createDynamicsCompressor();
    limiter.threshold.value = -8; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.001; limiter.release.value = 0.08;
    const trim = ac.createGain(); trim.gain.value = 0.7;
    const guard = ac.createWaveShaper();
    const gc = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; gc[i] = Math.max(-0.98, Math.min(0.98, x)); }
    guard.curve = gc;
    master.connect(comp); comp.connect(limiter); limiter.connect(trim); trim.connect(guard); guard.connect(ac.destination);
    meter = ac.createAnalyser(); meter.fftSize = 2048; guard.connect(meter);
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * 5) * 0.9; }
    setInterval(schedule, 25);
  }
  async function load(base) {
    init();
    await Promise.all(Object.entries(SAMPLES).map(async ([k, f]) => {
      try { S[k] = await ac.decodeAudioData(await (await fetch(base + f)).arrayBuffer()); }
      catch (e) { console.warn("drum sample failed", f, e); }
    }));
  }

  // ------------------------------------------------------------ decks
  function makeDeck(name) {
    const tr = TRACKS[name];
    const dk = { name, tr, step: 0, stepDur: 60 / tr.bpm / 4, nextTime: ac.currentTime + 0.06, dead: false };
    dk.drums = ac.createGain();
    dk.duck = ac.createGain();
    dk.lp = ac.createBiquadFilter(); dk.lp.type = "lowpass"; dk.lp.frequency.value = 20000;
    dk.hp = ac.createBiquadFilter(); dk.hp.type = "highpass"; dk.hp.frequency.value = 10;
    dk.vol = ac.createGain();
    dk.delay = ac.createDelay(2); dk.delay.delayTime.value = dk.stepDur * 3;
    const fb = ac.createGain(); fb.gain.value = 0.3;
    const dlp = ac.createBiquadFilter(); dlp.type = "lowpass"; dlp.frequency.value = 3000;
    dk.delay.connect(dlp); dlp.connect(fb); fb.connect(dk.delay); dlp.connect(dk.duck);
    dk.drums.connect(dk.lp); dk.duck.connect(dk.lp); dk.lp.connect(dk.hp); dk.hp.connect(dk.vol); dk.vol.connect(master);
    return dk;
  }
  function schedule() {
    const horizon = ac.currentTime + 0.12;
    for (const dk of decks) {
      while (!dk.stopped && dk.nextTime < horizon) {
        dk.tr.play(dk, dk.step, dk.nextTime);
        dk.nextTime += dk.stepDur;
        dk.step++;
      }
    }
  }

  // ------------------------------------------------------------ voices
  const CYMBAL = { hat: 0.45, openHat: 0.3, crash: 0.3, ride: 0, hat808: 0.45, shaker: 0.6 };
  function smp(dk, name, t, { gain = 1, rate = 1, dest, len, glideTo, glideTime } = {}) {
    const buf = S[name];
    if (!buf) return;
    gain *= CYMBAL[name] ?? 1;
    if (gain <= 0) return;
    const s = ac.createBufferSource(), g = ac.createGain();
    s.buffer = buf;
    s.playbackRate.setValueAtTime(rate, t);
    if (glideTo) s.playbackRate.exponentialRampToValueAtTime(glideTo, t + glideTime);
    g.gain.setValueAtTime(gain, t);
    if (len) { g.gain.setValueAtTime(gain, t + len); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.05); }
    s.connect(g); g.connect(dest || dk.drums);
    s.start(t); s.stop(t + (len ? len + 0.1 : buf.duration / rate + 0.05));
  }
  function pump(dk, t, depth = 0.5) {
    dk.duck.gain.cancelScheduledValues(t);
    dk.duck.gain.setValueAtTime(depth, t);
    dk.duck.gain.linearRampToValueAtTime(1, t + dk.stepDur * 2);
  }
  const kick = (dk, t, gain = 1, hard) => { smp(dk, hard ? "kickHard" : "kick", t, { gain }); pump(dk, t); };
  // tight, bright DnB snare: 909 snare pitched up, layered with clap
  function snare(dk, t, gain = 0.6, ghost) {
    if (ghost) { smp(dk, "snareShort", t, { gain: gain * 0.35, rate: 1.35 }); return; }
    smp(dk, "snare", t, { gain, rate: 1.18 });
    smp(dk, "clap", t, { gain: gain * 0.35, rate: 1.1 });
  }
  // 808 sub: the tuned boom sample pitched to the note, optional slide
  function sub(dk, note, t, len, { gain = 0.8, slideTo } = {}) {
    const r = (n) => Math.pow(2, (n - B808_MIDI) / 12);
    smp(dk, "boom", t, { gain, rate: r(note), len, glideTo: slideTo ? r(slideTo) : 0, glideTime: len * 0.5 });
  }
  // reese / wobble bass: detuned saws -> distortion -> LFO'd lowpass (+ clean sine sub)
  function reese(dk, t, note, len, { cutoff = 500, lfoRate = 0, lfoDepth = 0, q = 6, gain = 0.16, drive = 1, subGain = 0.22, square = false } = {}) {
    const sh = ac.createWaveShaper(); sh.curve = curve; sh.oversample = "2x";
    const pre = ac.createGain(); pre.gain.value = drive;
    const f = ac.createBiquadFilter(); f.type = "lowpass"; f.Q.value = q; f.frequency.setValueAtTime(cutoff, t);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.setValueAtTime(gain, t + Math.max(0.01, len - 0.02));
    g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.05);
    const oscs = [];
    for (const [det, type] of [[-16, "sawtooth"], [16, "sawtooth"], [0, square ? "square" : "sawtooth"]]) {
      const o = ac.createOscillator(); o.type = type; o.frequency.value = mtof(note); o.detune.value = det;
      o.connect(pre); oscs.push(o);
    }
    if (lfoRate) {
      const l = ac.createOscillator(), lg = ac.createGain();
      l.type = "sine"; l.frequency.value = lfoRate; lg.gain.value = lfoDepth;
      l.connect(lg); lg.connect(f.frequency); l.start(t); l.stop(t + len + 0.1);
    }
    pre.connect(sh); sh.connect(f); f.connect(g); g.connect(dk.duck);
    for (const o of oscs) { o.start(t); o.stop(t + len + 0.1); }
    if (subGain) {
      const so = ac.createOscillator(), sg = ac.createGain();
      so.type = "sine"; so.frequency.value = mtof(note);
      sg.gain.setValueAtTime(0.0001, t); sg.gain.exponentialRampToValueAtTime(subGain, t + 0.01);
      sg.gain.setValueAtTime(subGain, t + Math.max(0.01, len - 0.02)); sg.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.05);
      so.connect(sg); sg.connect(dk.drums); so.start(t); so.stop(t + len + 0.1);
    }
  }
  function riser(dk, t, dur, peak = 0.08) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise; s.loop = true; f.type = "bandpass"; f.Q.value = 3;
    f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(10000, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + 0.02);
    s.connect(f); f.connect(g); g.connect(dk.drums); s.start(t); s.stop(t + dur + 0.05);
  }
  function synth(dk, t, note, len, { wave = "sawtooth", cutoff = 1200, q = 1, peak = 0.1, a = 0.005, envAmt = 2,
    detune = 0, voices = 1, toDelay = 0, fdec, pitchFrom, dest } = {}) {
    const f = ac.createBiquadFilter(), g = ac.createGain();
    f.type = "lowpass"; f.Q.value = q;
    f.frequency.setValueAtTime(Math.min(20000, cutoff * envAmt), t);
    f.frequency.exponentialRampToValueAtTime(cutoff, t + (fdec || Math.min(len, 0.25)));
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, t + Math.max(a, len - 0.03));
    g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.08);
    for (let v = 0; v < voices; v++) {
      const o = ac.createOscillator();
      o.type = wave;
      if (pitchFrom) { o.frequency.setValueAtTime(mtof(pitchFrom), t); o.frequency.exponentialRampToValueAtTime(mtof(note), t + 0.12); }
      else o.frequency.value = mtof(note);
      o.detune.value = voices > 1 ? (v - (voices - 1) / 2) * detune : 0;
      o.connect(f); o.start(t); o.stop(t + len + 0.1);
    }
    f.connect(g); g.connect(dest || dk.duck);
    if (toDelay) { const s = ac.createGain(); s.gain.value = toDelay; g.connect(s); s.connect(dk.delay); }
  }
  const chord = (dk, t, notes, len, o) => notes.forEach((n) => synth(dk, t, n, len, o));
  // electric-piano chord (sine + soft triangle with a bell attack)
  const rhodes = (dk, t, notes, len, peak = 0.03) => notes.forEach((n) => {
    synth(dk, t, n, len, { wave: "sine", cutoff: 3000, peak, a: 0.01, envAmt: 1, toDelay: 0.25 });
    synth(dk, t, n + 12, 0.25, { wave: "triangle", cutoff: 4000, peak: peak * 0.4, envAmt: 1 });
  });
  function airhorn(dk, t, len = 0.3) {
    for (const n of [70, 70.12, 77, 58]) synth(dk, t, n, len, { voices: 2, detune: 20, cutoff: 2600, peak: 0.045, envAmt: 1.2, pitchFrom: n + 3, dest: dk.drums });
  }
  // hoover: detuned saws with a pitch dip, rave staple
  const hoover = (dk, t, note, len) => synth(dk, t, note, len, { voices: 5, detune: 35, cutoff: 2400, q: 2, peak: 0.035, envAmt: 1.5, pitchFrom: note - 5, toDelay: 0.2 });

  // ------------------------------------------------------------ breakbeats (32 steps = 2 bars)
  // jungle break: k = kick, s = snare, g = ghost snare, h = hat, o = open hat
  const BREAKS = {
    jungle: [
      "k.k.s..g.gk.s..g" + "..k.s..g.gkks.go",
      "k.k.s..g.gk.s.g." + "g.k.s.gs..k.s.gg", // chopped variation
    ],
    twostep: ["k.h.s.h.h.k.s.h." + "k.h.s.h.hkk.s.ho"],
  };
  function playBreak(dk, pat, s, t, { gain = 1, hats = true } = {}) {
    const c = pat[s % 32];
    if (c === "k") kick(dk, t, 0.95 * gain);
    else if (c === "s") snare(dk, t, 0.6 * gain);
    else if (c === "g") snare(dk, t, 0.6 * gain, true);
    else if (c === "o") smp(dk, "openHat", t, { gain: 0.16 * gain });
    if (hats && s % 4 === 2 && c !== "o") smp(dk, "hat", t, { gain: 0.12 * gain });
  }

  // ------------------------------------------------------------ tracks (A minor)
  const pos = (s) => s % 16, bar = (s) => Math.floor(s / 16);
  const PROG = [
    { c: [57, 60, 64, 67], r: 33 }, // Am7
    { c: [53, 57, 60, 64], r: 29 }, // Fmaj7
    { c: [55, 60, 62, 67], r: 31 }, // Gsus
    { c: [52, 55, 59, 64], r: 28 }, // Em7
  ];

  const TRACKS = {
    town: { // liquid DnB
      bpm: 172,
      play(dk, s, t) {
        const p = pos(s), b = bar(s), ch = PROG[(b >> 1) % 4];
        playBreak(dk, BREAKS.twostep[0], s, t, { gain: 0.75 });
        smp(dk, "shaker", t, { gain: p % 2 ? 0.07 : 0.03 });
        if (p === 0 && b % 2 === 0) rhodes(dk, t, ch.c, dk.stepDur * 30, 0.022);
        if ((p === 10 || p === 14) && b % 2 === 1) rhodes(dk, t, ch.c.map((n) => n + 12), dk.stepDur * 3, 0.014);
        if (p === 0 && b % 2 === 0) reese(dk, t, ch.r + 12, dk.stepDur * 14, { cutoff: 380, q: 3, gain: 0.1, drive: 0.6, subGain: 0.25 });
        if (p === 0 && b % 2 === 1) reese(dk, t, ch.r + 12 + (b % 4 === 3 ? 7 : 0), dk.stepDur * 10, { cutoff: 420, q: 3, gain: 0.1, drive: 0.6, subGain: 0.25 });
      },
    },

    route: { // jungle
      bpm: 168,
      play(dk, s, t) {
        const p = pos(s), b = bar(s), ph = b % 16, ch = PROG[(b >> 1) % 4];
        const breakdown = ph >= 14;
        if (ph === 0 && p === 0) smp(dk, "crash", t, { gain: 0.3 });
        if (!breakdown) playBreak(dk, BREAKS.jungle[b % 4 === 3 ? 1 : 0], s, t);
        else if (ph === 14 && p === 0) riser(dk, t, dk.stepDur * 32);
        // rolling 808 sub with slides
        if (p === 0) sub(dk, ch.r + 12, t, dk.stepDur * 6, { gain: 0.8 });
        if (p === 7) sub(dk, ch.r + 12, t, dk.stepDur * 3, { gain: 0.7, slideTo: ch.r + 24 });
        if (p === 11 && b % 2) sub(dk, ch.r + 24, t, dk.stepDur * 4, { gain: 0.65, slideTo: ch.r + 12 });
        // reese stabs
        if (!breakdown && (p === 4 || p === 12) && b % 2) reese(dk, t, ch.r + 24, dk.stepDur * 1.5, { cutoff: 900, q: 8, gain: 0.12, drive: 3, subGain: 0 });
        if (p === 0 && b % 4 === 0) chord(dk, t, ch.c, dk.stepDur * 60, { cutoff: 1100, peak: 0.013, a: 0.8, voices: 3, detune: 14, envAmt: 1 });
      },
    },

    wild: { // dancefloor DnB: two-step + hard wobble reese
      bpm: 174,
      // [step, semitones above A1, length in steps, lfo rate in steps per cycle]
      riff: [[0, 12, 3, 2], [4, 12, 2, 0], [7, 15, 3, 1], [10, 12, 2, 0], [12, 10, 4, 4]],
      play(dk, s, t) {
        const p = pos(s), b = bar(s), roots = [0, 0, -4, -2][(b >> 1) % 4];
        const ph = b % 8, build = ph === 7;
        if (ph === 0 && p === 0) smp(dk, "crash", t, { gain: 0.32 });
        if (!build) playBreak(dk, BREAKS.twostep[0], s, t, { gain: 1.05 });
        else { if (p % (p < 8 ? 2 : 1) === 0) snare(dk, t, 0.15 + p * 0.03); if (p === 0) riser(dk, t, dk.stepDur * 16); }
        if (p % 2 === 1 && !build) smp(dk, "hat808", t, { gain: 0.06 });
        for (const [st, n, len, lfo] of this.riff) {
          if (st !== p || build) continue;
          const rate = lfo ? 1 / (dk.stepDur * lfo) : 0;
          reese(dk, t, 33 + n + roots, dk.stepDur * len, { cutoff: 700, lfoRate: rate, lfoDepth: rate ? 650 : 0, q: 9, gain: 0.17, drive: 4, subGain: 0.3 });
        }
        if (b % 4 === 3 && (p === 0 || p === 6 || p === 12)) hoover(dk, t, 69 + roots, dk.stepDur * 3);
      },
    },

    battle: { // ragga jungle: chopped break, 808 slides, air horns
      bpm: 170,
      bass: [[0, 0, 5, null], [6, 0, 2, 12], [10, 7, 3, null], [14, 3, 2, 0]],
      play(dk, s, t) {
        const p = pos(s), b = bar(s), roots = [0, -4, -2, -5][(b >> 1) % 4];
        playBreak(dk, BREAKS.jungle[(b % 4 === 3 || b % 8 === 6) ? 1 : 0], s, t, { gain: 1.05 });
        if (p % 4 === 2) smp(dk, "rim808", t, { gain: 0.14 });
        for (const [st, n, len, slide] of this.bass) {
          if (st !== p) continue;
          sub(dk, 33 + 12 + n + roots, t, dk.stepDur * len, { gain: 0.9, slideTo: slide == null ? 0 : 33 + 12 + slide + roots });
        }
        if (p === 0 && b % 2 === 1) reese(dk, t, 45 + roots, dk.stepDur * 3, { cutoff: 1100, q: 10, gain: 0.13, drive: 5, subGain: 0, lfoRate: 1 / (dk.stepDur * 1.5), lfoDepth: 800 });
        if (b % 8 === 0 && (p === 0 || p === 3 || p === 6)) airhorn(dk, t, p === 6 ? 0.45 : 0.16);
        if (p === 0 && b % 8 === 0) smp(dk, "crash", t, { gain: 0.3 });
        if (b % 4 === 2 && (p === 4 || p === 8)) smp(dk, "cowbell", t, { gain: 0.08, rate: 1.2 });
      },
    },

    boss: { // neurofunk / jump-up: two-step, growl bass, hoovers
      bpm: 176,
      growl: [[0, 0, 2, 1], [3, 0, 1, 0], [4, 12, 2, 0.5], [6, 0, 1, 0], [8, 3, 2, 1], [11, 0, 1, 0], [12, 7, 3, 0.75], [15, 12, 1, 0]],
      play(dk, s, t) {
        const p = pos(s), b = bar(s), roots = [0, 0, -4, -2][(b >> 1) % 4];
        if (p === 0 && b % 8 === 0) smp(dk, "crash", t, { gain: 0.35 });
        playBreak(dk, BREAKS.twostep[0], s, t, { gain: 1.1 });
        if (s % 32 === 26) kick(dk, t, 1, true);
        for (const [st, n, len, lfo] of this.growl) {
          if (st !== p) continue;
          const rate = lfo ? 1 / (dk.stepDur * lfo) : 0;
          reese(dk, t, 33 + n + roots, dk.stepDur * len, { cutoff: 900, lfoRate: rate, lfoDepth: rate ? 900 : 0, q: 14, gain: 0.18, drive: 7, subGain: 0.28, square: true });
        }
        if (b % 2 === 1 && (p === 0 || p === 10)) hoover(dk, t, 69 + roots + (p === 10 ? 3 : 0), dk.stepDur * 4);
      },
    },

    win: { // liquid roller, major lift
      bpm: 172,
      play(dk, s, t) {
        const p = pos(s), b = bar(s);
        const prog = [[60, 64, 67, 71, 36], [57, 60, 64, 67, 33], [53, 57, 60, 64, 29], [55, 59, 62, 67, 31]][(b >> 1) % 4];
        playBreak(dk, BREAKS.twostep[0], s, t, { gain: 0.85 });
        if (p === 0 && b === 0) smp(dk, "crash", t, { gain: 0.35 });
        if (p === 0 && b % 2 === 0) rhodes(dk, t, prog.slice(0, 4), dk.stepDur * 28, 0.026);
        if ([3, 6, 10].includes(p)) synth(dk, t, prog[p % 4] + 12, dk.stepDur * 1.5, { wave: "triangle", cutoff: 3000, peak: 0.03, envAmt: 1, toDelay: 0.35 });
        if (p === 0) sub(dk, prog[4] + 12, t, dk.stepDur * 8, { gain: 0.7 });
      },
    },

    caught: { // congrats fanfare: 4-bar triumphant melody once, then a soft celebratory loop
      bpm: 132,
      mel: [[0, 67, 2], [2, 72, 2], [4, 76, 2], [6, 79, 2], [8, 84, 6], [14, 83, 2],
        [16, 81, 2], [18, 79, 2], [20, 76, 2], [22, 77, 2], [24, 79, 8],
        [32, 77, 2], [34, 76, 2], [36, 74, 2], [38, 76, 2], [40, 72, 4], [44, 74, 2], [46, 76, 2],
        [48, 79, 4], [52, 84, 12]],
      chords: [[60, 64, 67, 72, 36], [53, 57, 60, 65, 41], [55, 59, 62, 65, 43], [60, 64, 67, 72, 36]],
      play(dk, s, t) {
        const p = pos(s), b = bar(s);
        if (s < 64) {
          const ch = this.chords[b];
          if (p === 0) { smp(dk, "crash", t, { gain: 0.35 }); rhodes(dk, t, ch.slice(0, 4), dk.stepDur * 15, 0.03); sub(dk, ch[4] + 12, t, dk.stepDur * 14, { gain: 0.6 }); }
          if (p % 4 === 0) kick(dk, t, 0.8);
          if (p === 4 || p === 12) smp(dk, "clap", t, { gain: 0.35 });
          for (const [st, n, len] of this.mel) if (st === s) {
            synth(dk, t, n, dk.stepDur * len, { wave: "square", cutoff: 3500, peak: 0.045, a: 0.004, envAmt: 1.5, toDelay: 0.3 });
            synth(dk, t, n - 12, dk.stepDur * len, { wave: "triangle", cutoff: 4000, peak: 0.035, envAmt: 1 });
          }
          return;
        }
        // afterglow: gentle chords and a light groove while you read about your new monster
        const ch = this.chords[[0, 1, 0, 2][(b >> 1) % 4]];
        if (p === 0 && b % 2 === 0) rhodes(dk, t, ch.slice(0, 4), dk.stepDur * 28, 0.02);
        if (p === 0 || p === 10) kick(dk, t, 0.5);
        if (p === 8) smp(dk, "rim", t, { gain: 0.15 });
        if (p % 4 === 2) smp(dk, "hat808", t, { gain: 0.06 });
        if (p === 0) sub(dk, ch[4] + 12, t, dk.stepDur * 8, { gain: 0.45 });
        if ([0, 3, 6].includes(p) && b % 2 === 1) synth(dk, t, ch[p / 3 | 0] + 12, dk.stepDur * 2, { wave: "triangle", cutoff: 3000, peak: 0.025, envAmt: 1, toDelay: 0.35 });
      },
    },

    chill: { // lo-fi: lazy swung drums, dusty snare, Rhodes 9ths, soft 808
      bpm: 82,
      prog: [{ c: [57, 60, 64, 67, 71], r: 33 }, { c: [50, 57, 60, 64, 65], r: 38 }, { c: [52, 55, 59, 62, 66], r: 40 }, { c: [53, 57, 60, 64, 67], r: 41 }],
      mel: [76, 0, 0, 74, 0, 72, 0, 0, 71, 0, 0, 0, 69, 0, 72, 0],
      play(dk, s, t) {
        const p = pos(s), b = bar(s), ch = this.prog[b % 4];
        const swing = p % 2 ? dk.stepDur * 0.18 : 0, tt = t + swing;
        if (p === 0 || p === 7 || p === 10) kick(dk, tt, p === 0 ? 0.6 : 0.45);
        if (p === 4 || p === 12) { smp(dk, "snareShort", tt, { gain: 0.32, rate: 0.82 }); smp(dk, "rim808", tt, { gain: 0.12 }); }
        if (p % 4 === 2) smp(dk, "hat808", tt, { gain: 0.08 });
        if (p === 0) rhodes(dk, t, ch.c, dk.stepDur * 15, 0.02);
        if (p === 10 && b % 2) rhodes(dk, tt, ch.c.slice(2), dk.stepDur * 5, 0.014);
        if (p === 0) sub(dk, ch.r + 12, t, dk.stepDur * 7, { gain: 0.45 });
        if (p === 10) sub(dk, ch.r + 12 + (b % 2 ? 7 : 0), tt, dk.stepDur * 5, { gain: 0.35 });
        if (b % 4 >= 2 && this.mel[p]) synth(dk, tt, this.mel[p], dk.stepDur * 2.5, { wave: "sine", cutoff: 2500, peak: 0.03, a: 0.02, envAmt: 1, toDelay: 0.4 });
      },
    },

    funky: { // funky house: disco octave bass, chord stabs, muted guitar plucks
      bpm: 122,
      prog: [{ c: [57, 60, 64, 67, 71], r: 33 }, { c: [54, 57, 60, 64, 62], r: 38 }],
      bass: [[0, 0], [3, 12], [6, 0], [7, 12], [10, 0], [11, 10], [13, 12], [14, 7]],
      play(dk, s, t, hard) {
        const p = pos(s), b = bar(s), ch = this.prog[(b >> 1) % 2];
        if (p % 4 === 0) kick(dk, t, hard ? 1 : 0.85, hard);
        if (p === 4 || p === 12) { smp(dk, "clap", t, { gain: 0.4 }); if (hard) snare(dk, t, 0.25); }
        if (p % 4 === 2) smp(dk, "openHat", t, { gain: 0.25 });
        if (p === 6 || p === 14) smp(dk, "cowbell", t, { gain: 0.04, rate: 1.5 });
        for (const [st, n] of this.bass) if (st === p) synth(dk, t, ch.r + 12 + n, dk.stepDur * 1.1, { wave: "square", cutoff: 380, q: 7, peak: hard ? 0.2 : 0.16, envAmt: 5, fdec: 0.08 });
        if (p === 3 || p === 6 || p === 11) chord(dk, t, ch.c.map((n) => n + 12), dk.stepDur * 0.9, { voices: 2, detune: 10, cutoff: 1800, q: 3, peak: 0.022, envAmt: 2.5, toDelay: 0.25 });
        if (p % 2 === 1) synth(dk, t, ch.c[(s >> 1) % 5] + 12, dk.stepDur * 0.4, { wave: "triangle", cutoff: 2400, q: 4, peak: 0.02, envAmt: 2 });
        if (hard && b % 4 === 3 && (p === 0 || p === 8)) hoover(dk, t, 69, dk.stepDur * 3);
      },
    },
    funkboss: { bpm: 126, play(dk, s, t) { TRACKS.funky.play(dk, s, t, true); } },

    mystery: { // dark Phrygian half-time: drone, eerie bells, sparse percussion
      bpm: 96,
      bells: [81, 0, 0, 82, 0, 0, 77, 0, 0, 0, 76, 0, 0, 74, 0, 0],
      play(dk, s, t, hard) {
        const p = pos(s), b = bar(s);
        if (p === 0 || (hard && p % 4 === 0)) { kick(dk, t, hard ? 0.95 : 0.7, hard); if (!hard || p === 0) sub(dk, 33, t, dk.stepDur * (hard ? 3 : 6), { gain: 0.6 }); }
        if (p === 8 || (hard && p === 4) || (hard && p === 12)) smp(dk, hard ? "clap808" : "snareShort", t, { gain: hard ? 0.3 : 0.25, rate: hard ? 1 : 0.7 });
        if (p === 6 || p === 11 || (hard && p % 4 === 2)) smp(dk, "rim", t, { gain: 0.12, rate: 0.9 });
        if (p === 0 && b % 2 === 0) reese(dk, t, 33 + (b % 4 === 2 ? 1 : 0), dk.stepDur * 31, { cutoff: hard ? 600 : 260, q: 4, gain: 0.09, drive: hard ? 3 : 1, subGain: 0.1, lfoRate: 0.25, lfoDepth: 120 });
        if (this.bells[p] && b % 2 === 1) synth(dk, t, this.bells[p] - 12 + (b % 4 === 3 ? -2 : 0), dk.stepDur * 3, { wave: "sine", cutoff: 3000, peak: 0.035, envAmt: 1, toDelay: 0.55 });
        if (p === 0 && b % 4 === 0) chord(dk, t, [57, 58, 64], dk.stepDur * 60, { cutoff: 700, peak: 0.012, a: 1.5, voices: 3, detune: 18, envAmt: 1 });
        if (hard && p % 2 === 1) synth(dk, t, 45 + [0, 1, 0, 3, 0, 1, 7, 5][(s >> 1) % 8], dk.stepDur * 0.7, { cutoff: 500 + 400 * Math.sin(s / 20), q: 14, peak: 0.08, envAmt: 3, fdec: 0.08 });
      },
    },
    darkboss: { bpm: 132, play(dk, s, t) { TRACKS.mystery.play(dk, s, t, true); } },
  };

  // ------------------------------------------------------------ DJ mixing
  function play(name) {
    wanted = name;
    if (!ac || ac.state !== "running") return;
    const live = decks.filter((d) => !d.dead);
    if (live.length && live[live.length - 1].name === name) return;
    const now = ac.currentTime;
    const cut = ["battle", "wild", "boss", "funkboss", "darkboss", "win"].includes(name) || !name;
    const mix = cut ? 0.3 : 2.8; // hard drop into battles, ~2-bar blend between towns/routes
    for (const old of live) {
      old.dead = true;
      old.hp.frequency.cancelScheduledValues(now);
      old.hp.frequency.setValueAtTime(Math.max(10, old.hp.frequency.value), now);
      old.hp.frequency.exponentialRampToValueAtTime(cut ? 2500 : 900, now + mix);
      old.vol.gain.cancelScheduledValues(now);
      old.vol.gain.setValueAtTime(old.vol.gain.value, now);
      old.vol.gain.linearRampToValueAtTime(0, now + mix);
      setTimeout(() => {
        old.stopped = true;
        const i = decks.indexOf(old); if (i >= 0) decks.splice(i, 1);
        setTimeout(() => { try { old.vol.disconnect(); } catch (e) { /* gone */ } }, 3000);
      }, mix * 1000 + 50);
    }
    if (!name || !TRACKS[name]) return;
    const dk = makeDeck(name);
    if (cut) {
      dk.vol.gain.value = 1;
      if (name !== "win") { smp(dk, "kickHard", now + 0.05, { gain: 1 }); sub(dk, 45, now + 0.05, 0.6, { gain: 0.8, slideTo: 33 }); }
    } else {
      dk.vol.gain.setValueAtTime(0.0001, now);
      dk.vol.gain.exponentialRampToValueAtTime(1, now + mix * 0.6);
      dk.lp.frequency.setValueAtTime(250, now);
      dk.lp.frequency.exponentialRampToValueAtTime(20000, now + mix);
    }
    decks.push(dk);
  }

  return {
    load,
    play,
    unlock() {
      init();
      const go = () => { if (wanted) { const w = wanted; wanted = null; play(w); } };
      if (ac.state !== "running") ac.resume().then(go); else go();
    },
    setMuted(m) {
      muted = m;
      if (master) master.gain.setTargetAtTime(m ? 0 : 0.5, ac.currentTime, 0.05);
    },
    get current() { const l = decks.filter((d) => !d.dead); return l.length ? l[l.length - 1].name : null; },
    get state() { return ac ? ac.state : "none"; },
    _tracks: () => Object.keys(TRACKS),
    // peak and RMS of the current output (debug/verification)
    _level() {
      if (!meter) return null;
      const d = new Float32Array(meter.fftSize); meter.getFloatTimeDomainData(d);
      let pk = 0, sq = 0; for (const v of d) { pk = Math.max(pk, Math.abs(v)); sq += v * v; }
      return { peak: +pk.toFixed(3), rms: +Math.sqrt(sq / d.length).toFixed(4) };
    },
  };
})();
