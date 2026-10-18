// ------------------------------------------------------------------ banners over every rival city, and the rivals' own wars
// Each rival flies its own banner on a tall pole in the middle of its city, waving in the wind. When you conquer it
// the flag comes down and yours goes up; lose it to rebels or a rival and theirs goes up instead. Rivals also fight each
// other: a strong one can occupy a much weaker neighbour (its flag rises over that city), and you can liberate it.
const FLAG_DRAW = {
  // Ostberg, the timber builders: three pines on green over a white band
  ostberg(g, w, h) { g.fillStyle = '#2f6b3a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2efe4'; g.fillRect(0, h*.72, w, h*.12);
    g.fillStyle = '#f2efe4'; for (const [x, s] of [[.3, .8], [.5, 1.05], [.7, .8]]) { const cx = w*x, base = h*.64;
      g.fillRect(cx - h*.02*s, base - h*.06*s, h*.04*s, h*.07*s);
      for (const [y0, hw] of [[.1, .13], [.22, .1], [.33, .07]]) { g.beginPath(); g.moveTo(cx, base - h*(y0 + .2)*s); g.lineTo(cx + h*hw*s, base - h*y0*s); g.lineTo(cx - h*hw*s, base - h*y0*s); g.fill(); } } },
  // Port Azul, the seafarers: a white anchor on deep blue, a gold wave beneath
  azul(g, w, h) { g.fillStyle = '#0f4c81'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f2c94c'; g.lineWidth = h*.05; g.beginPath(); for (let x = 0; x <= w; x += 4) g.lineTo(x, h*.84 + Math.sin(x/18)*h*.03); g.stroke();
    g.strokeStyle = '#fff'; g.lineWidth = h*.05; g.beginPath(); g.moveTo(w/2, h*.2); g.lineTo(w/2, h*.68); g.moveTo(w/2 - h*.12, h*.3); g.lineTo(w/2 + h*.12, h*.3); g.stroke();
    g.beginPath(); g.arc(w/2, h*.5, h*.18, Math.PI*.15, Math.PI*.85); g.stroke(); g.beginPath(); g.arc(w/2, h*.16, h*.05, 0, Math.PI*2); g.stroke(); },
  // Kumo, the miners: gold peaks on dark crimson
  kumo(g, w, h) { g.fillStyle = '#7a1a1a'; g.fillRect(0, 0, w, h); g.fillStyle = '#e0b040';
    g.beginPath(); g.moveTo(w*.25, h*.72); g.lineTo(w*.42, h*.3); g.lineTo(w*.52, h*.48); g.lineTo(w*.62, h*.22); g.lineTo(w*.8, h*.72); g.fill();
    g.fillStyle = '#7a1a1a'; g.beginPath(); g.moveTo(w*.57, h*.33); g.lineTo(w*.62, h*.22); g.lineTo(w*.67, h*.33); g.fill(); },
  // the Nile Kingdom: a rising sun over a blue river on sand
  nile(g, w, h) { g.fillStyle = '#d9b46a'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8762a'; g.beginPath(); g.arc(w/2, h*.55, h*.22, Math.PI, 0); g.fill();
    for (let i = 0; i < 9; i++) { const a = Math.PI + i/8*Math.PI; g.fillRect(w/2 + Math.cos(a)*h*.28 - 2, h*.55 + Math.sin(a)*h*.28 - 2, 4, 4); }
    g.fillStyle = '#1f6fa8'; g.beginPath(); for (let x = 0; x <= w; x += 4) g.lineTo(x, h*.66 + Math.sin(x/22)*h*.04); g.lineTo(w, h*.78); for (let x = w; x >= 0; x -= 4) g.lineTo(x, h*.78 + Math.sin(x/22)*h*.04); g.fill(); },
  // Aztlan, the farmers: a corn-gold sun on green and orange
  aztlan(g, w, h) { g.fillStyle = '#2e7d32'; g.fillRect(0, 0, w, h/2); g.fillStyle = '#e8762a'; g.fillRect(0, h/2, w, h/2);
    g.fillStyle = '#f2d04c'; for (let i = 0; i < 12; i++) { const a = i/12*Math.PI*2; g.save(); g.translate(w/2, h/2); g.rotate(a); g.beginPath(); g.moveTo(h*.12, -h*.04); g.lineTo(h*.27, 0); g.lineTo(h*.12, h*.04); g.fill(); g.restore(); }
    g.beginPath(); g.arc(w/2, h/2, h*.13, 0, Math.PI*2); g.fill(); },
  // Hellas, the coast-dwellers: a white column on aqua with a gold stripe
  hellas(g, w, h) { g.fillStyle = '#2aa6b8'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2c94c'; g.fillRect(0, h*.08, w, h*.06); g.fillRect(0, h*.86, w, h*.06);
    g.fillStyle = '#fff'; g.fillRect(w/2 - h*.2, h*.24, h*.4, h*.06); g.fillRect(w/2 - h*.2, h*.7, h*.4, h*.06); for (let k = -1; k <= 1; k++) g.fillRect(w/2 + k*h*.12 - h*.035, h*.3, h*.07, h*.4); },
  // Rajpur, the island kingdom: a white elephant on maroon with a saffron border
  rajpur(g, w, h) { g.fillStyle = '#e8902a'; g.fillRect(0, 0, w, h); g.fillStyle = '#7a1f3a'; g.fillRect(w*.04, h*.06, w*.92, h*.88);
    g.fillStyle = '#f2efe4'; g.beginPath(); g.ellipse(w/2, h*.52, h*.2, h*.14, 0, 0, Math.PI*2); g.fill(); g.beginPath(); g.arc(w/2 + h*.2, h*.42, h*.09, 0, Math.PI*2); g.fill();
    for (const dx of [-.12, -.04, .06, .14]) g.fillRect(w/2 + dx*h - h*.03, h*.6, h*.06, h*.16);
    g.lineWidth = h*.045; g.strokeStyle = '#f2efe4'; g.beginPath(); g.moveTo(w/2 + h*.28, h*.45); g.quadraticCurveTo(w/2 + h*.34, h*.66, w/2 + h*.26, h*.72); g.stroke(); },
  // the Sky Citadel: a silver winged star on night blue
  nordheim(g, w, h) { g.fillStyle = '#1a2340'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8dee8'; star(g, w/2, h/2, h*.14, -Math.PI/2);
    for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(w/2 + sx*h*.12, h*.48); g.quadraticCurveTo(w/2 + sx*h*.42, h*.22, w/2 + sx*h*.5, h*.4); g.quadraticCurveTo(w/2 + sx*h*.36, h*.42, w/2 + sx*h*.14, h*.56); g.fill(); } },
  rebels(g, w, h) { g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e8e8e8'; g.lineWidth = h*.06; g.beginPath(); g.arc(w/2, h/2, h*.22, 0, Math.PI*2); g.stroke(); g.beginPath(); g.moveTo(w/2, h*.28); g.lineTo(w/2, h*.72); g.stroke(); },
};
function star(g, x, y, r, rot) { g.beginPath(); for (let p = 0; p < 10; p++) { const a = rot + p*Math.PI/5, rr = p % 2 ? r*.4 : r; g.lineTo(x + Math.cos(a)*rr, y + Math.sin(a)*rr); } g.fill(); }
// a flag that waves: the same cloth (and shader) as our own flag, with each nation's design painted on
const FLAG_MATS = {};
function flagMat(style) {
  if (style === 'us') return US_FLAG.mat;
  if (FLAG_MATS[style]) return FLAG_MATS[style];
  const c = document.createElement('canvas'); c.width = 300; c.height = 200; const g = c.getContext('2d');
  (FLAG_DRAW[style] || FLAG_DRAW.rebels)(g, c.width, c.height);
  const gr = g.createLinearGradient(0, 0, c.width, 0); for (let i = 0; i <= 6; i++) gr.addColorStop(i/6, i % 2 ? 'rgba(0,0,0,.10)' : 'rgba(255,255,255,.06)');
  g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const m = US_FLAG.mat.clone(); m.map = t; m.onBeforeCompile = US_FLAG.mat.onBeforeCompile; m.customProgramCacheKey = US_FLAG.mat.customProgramCacheKey;
  return FLAG_MATS[style] = m;
}
// each rival's own banner (invented, in the spirit of the nation it is styled on)
const RIVAL_FLAG = Object.fromEntries(['ostberg', 'azul', 'kumo', 'nile', 'aztlan', 'hellas', 'rajpur', 'nordheim'].map(k => [k, k]));
const occupier = r => { const by = es(r).by; return by ? EMP.list.find(q => q.id === by) : null; };
// whose flag flies over a rival's city now
function flagOwner(r) {
  const s = es(r);
  if (s.owned) { const L = land('r:' + r.id); return L && L.lost ? (L.by && L.by !== 'rebels' ? RIVAL_FLAG[L.by] : 'rebels') : 'us'; }
  const o = occupier(r); return o ? RIVAL_FLAG[o.id] : RIVAL_FLAG[r.id];
}
const POLES = {};
function updFlags(dt) {
  for (const r of EMP.list) {
    if (!r.at || (r.sky && !W.unlocked.has('moonLanding'))) continue;
    let P = POLES[r.id];
    if (!P) {
      // a tall pole in the middle of their city
      const g = new THREE.Group(); g.position.set(r.at[0], 0, r.at[1]); scene.add(g);
      mesh(G.cyl, 0xd8dce2, [.09, 8, .09], [0, 4, 0], g, {metalness:.6, roughness:.35}); mesh(G.sph, 0xd9a52a, [.18, .18, .18], [0, 8.1, 0], g, {metalness:.7, roughness:.3});
      mesh(G.cyl, 0x8a8478, [.5, .4, .5], [0, .2, 0], g);
      const f = new THREE.Mesh(US_FLAG.geo, flagMat(flagOwner(r))); f.castShadow = true; g.add(f);
      P = POLES[r.id] = {g, f, style:flagOwner(r), y:7.2, phase:'up'};
      setFlag(P, P.style);
    }
    // a new owner: the old flag comes down, the new one goes up
    const want = flagOwner(r);
    if (want !== P.style && P.phase === 'up') P.phase = 'down';
    if (P.phase === 'down') { P.y -= dt*4.5; if (P.y <= 1.2) { P.y = 1.2; P.style = want; setFlag(P, want); P.phase = 'raise'; } }
    else if (P.phase === 'raise') { P.y += dt*2.6; if (P.y >= 7.2) { P.y = 7.2; P.phase = 'up'; } }
    const w = P.f.scale.x; P.f.position.set(w/2 + .09, P.y, 0);
  }
}
function setFlag(P, style) { P.f.material = flagMat(style); P.f.scale.set(style === 'us' ? 2.9 : 2.4, style === 'us' ? 1.55 : 1.6, 1); }
// ------------------------------------------------------------------ the rivals' wars among themselves
// Now and then (after your third campaign, every five to eight minutes, never more than two at once) a strong rival
// may march on a much weaker neighbour you have not conquered and occupy it.
// An occupied city stops growing and fighting on its own; you can liberate it by beating the occupier's garrison.
function updRivalWars(dt) {
  if (!started || W.conquests < 3 || (EMP.rwT = (EMP.rwT ?? 300) - dt) > 0) return;
  EMP.rwT = 300 + R()*180;
  if (EMP.list.filter(r => es(r).by).length >= 2) return;
  const free = EMP.list.filter(r => !(r.sky && !W.unlocked.has('moonLanding')) && !es(r).owned && !es(r).by);
  const strong = free.filter(r => es(r).stance !== 'ally').sort((a, b) => es(b).pow - es(a).pow);
  for (const a of strong) {
    const victims = free.filter(v => v !== a && es(v).pow < es(a).pow*.45).sort((p, q) => Math.hypot(p.at[0] - a.at[0], p.at[1] - a.at[1]) - Math.hypot(q.at[0] - a.at[0], q.at[1] - a.at[1]));
    const v = victims[0]; if (!v || R() < .6) continue;
    const sv = es(v); sv.by = a.id; sv.stance = 'occupied'; es(a).pow += sv.pow*.35;
    if (es(a).met || sv.met) banner(`🏴 ${a.icon} ${a.n} occupies ${v.icon} ${v.n}`, `Their flag flies over ${v.n} now. Liberate it from the 🗺️ map, if you can beat the garrison.`);
    return;
  }
}
