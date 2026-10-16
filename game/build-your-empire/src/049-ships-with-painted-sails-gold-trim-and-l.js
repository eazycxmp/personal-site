// ------------------------------------------------------------------ ships with painted sails, gold trim and long pennants
const SHIP_ANIM = [];
function sailTex(bg, fg, emblem, glow) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 128, 128);
  for (let x = 0; x < 128; x += 16) { g.fillStyle = 'rgba(0,0,0,.09)'; g.fillRect(x, 0, 2, 128); }
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(255,255,255,${Math.random()*.05})`; g.fillRect(Math.random()*128, Math.random()*128, 3, 1); }
  g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 5; g.strokeRect(2, 2, 124, 124);
  g.save(); g.translate(64, 62);
  if (glow) { g.shadowColor = glow; g.shadowBlur = 12; }
  g.fillStyle = fg; g.strokeStyle = fg; g.lineWidth = 7; g.lineCap = 'round';
  if (emblem === 'skull') {
    g.beginPath(); g.arc(0, -8, 22, 0, Math.PI*2); g.fill(); g.fillRect(-13, 6, 26, 15);
    g.fillStyle = bg; for (const x of [-9, 9]) { g.beginPath(); g.arc(x, -8, 6.5, 0, 7); g.fill(); } g.fillRect(-2, 3, 4, 6);
    g.beginPath(); g.moveTo(-34, 24); g.lineTo(34, 46); g.moveTo(34, 24); g.lineTo(-34, 46); g.stroke();
  } else if (emblem === 'compass') {
    g.beginPath(); for (let i = 0; i < 16; i++) { const a = i*Math.PI/8 - Math.PI/2, r = i % 4 === 0 ? 42 : i % 2 ? 11 : 24; g.lineTo(Math.cos(a)*r, Math.sin(a)*r); } g.closePath(); g.fill();
    g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 30, 0, 7); g.stroke();
  } else if (emblem === 'owl') {
    g.lineWidth = 6; for (const x of [-16, 16]) { g.beginPath(); g.arc(x, -10, 13, 0, 7); g.stroke(); g.beginPath(); g.arc(x, -10, 4, 0, 7); g.fill(); }
    g.beginPath(); g.moveTo(-6, 4); g.lineTo(6, 4); g.lineTo(0, 14); g.fill();
    g.beginPath(); g.arc(0, 18, 30, Math.PI*1.1, Math.PI*1.9, true); g.stroke();
    for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(-18 + i*12, 34, 6, 0, Math.PI); g.stroke(); }
  } else if (emblem === 'anchor') {
    g.beginPath(); g.moveTo(0, -30); g.lineTo(0, 32); g.moveTo(-18, -14); g.lineTo(18, -14); g.stroke();
    g.beginPath(); g.arc(0, -36, 7, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 8, 26, .3, Math.PI - .3); g.stroke();
  } else if (emblem === 'stripes') {
    g.fillStyle = fg; for (let x = 0; x < 128; x += 32) g.fillRect(x - 64, -64, 16, 128);
  }
  g.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const SAIL_CACHE = {};
function sailMat(key, ...args) { return SAIL_CACHE[key] ||= new THREE.MeshStandardMaterial({map:sailTex(...args), side:THREE.DoubleSide, roughness:.85}); }
function sail(g, w, h, m, x, y, z) {
  const r = w / 1.29, s = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 10, 1, true, -.7, 1.4), m);
  s.position.set(x, y, z - r*.765 + .06); s.castShadow = true; g.add(s); return s;
}
function galleon(g, o) {
  if (o.model && shipModel(g, o)) return;
  const L = o.len, Wd = o.wid, H = o.hull, H2 = o.hull2 ?? H, T = o.trim ?? 0xd9a52a, WOOD = 0xb58a52;
  mesh(G.box, H, [Wd*.55, .22, L*.78], [0, .06, -.05], g);
  mesh(G.box, H, [Wd*.86, .22, L*.94], [0, .26, 0], g);
  mesh(G.box, H2, [Wd, .16, L], [0, .44, 0], g);
  for (const y of [.35, .53]) mesh(G.box, T, [Wd + .03, .04, L + .02], [0, y, 0], g, {metalness:.6, roughness:.35});
  const prow = mesh(G.cone4, H2, [Wd*.5, L*.3, .28], [0, .36, L/2 + L*.13], g); prow.rotation.x = Math.PI/2; prow.rotation.y = Math.PI/4;
  mesh(G.box, WOOD, [Wd*.92, .04, L*.92], [0, .53, 0], g);
  for (const x of [-Wd/2, Wd/2]) mesh(G.box, T, [.05, .12, L*.86], [x, .62, .05], g, {metalness:.6, roughness:.35});
  // a raised stern with lit windows and a lantern
  mesh(G.box, H2, [Wd*.96, .5, L*.24], [0, .78, -L*.38], g);
  mesh(G.box, T, [Wd + .02, .05, L*.25], [0, 1.04, -L*.38], g, {metalness:.6, roughness:.35});
  for (const x of [-.3, 0, .3]) bulb(g, x*Wd, .78, -L/2 - .005, 0xffc870, .07);
  mesh(G.cyl, 0x3a3a3e, [.02, .4, .02], [0, 1.25, -L/2 + .05], g); bulb(g, 0, 1.47, -L/2 + .05, 0xffd890, .08);
  // bowsprit and a golden figurehead
  mesh(G.cyl, 0x5e3f22, [.045, L*.42, .045], [0, .9, L/2 + L*.14], g).rotation.x = 1.15;
  mesh(G.sph, T, [.11, .14, .11], [0, .55, L/2 + L*.24], g, {metalness:.7, roughness:.3});
  for (let i = 0; i < (o.guns || 0); i++) for (const sx of [-1, 1]) {
    const z = -L*.2 + i * L*.4 / Math.max(1, (o.guns || 1) - 1);
    mesh(G.box, T, [.03, .16, .2], [sx*(Wd/2 + .01), .38, z], g, {metalness:.6});
    mesh(G.cyl, 0x1a1a1e, [.06, .2, .06], [sx*(Wd/2 + .08), .38, z], g, {metalness:.6}).rotation.z = Math.PI/2;
  }
  const top = Math.max(...o.masts.map(m => m[1]));
  o.masts.forEach(([z, h], i) => {
    mesh(G.cyl, 0x4a3220, [.06, h, .06], [0, .5 + h/2, z], g);
    const lo = o.sails[0], hi = o.sails[1] || o.sails[0];
    sail(g, Wd*1.25, h*.36, lo, 0, .5 + h*.4, z); mesh(G.cyl, 0x4a3220, [.035, Wd*1.35, .035], [0, .5 + h*.59, z], g).rotation.z = Math.PI/2;
    if (h > 2.6) { sail(g, Wd*.95, h*.24, hi, 0, .5 + h*.74, z); mesh(G.cyl, 0x4a3220, [.03, Wd*1.05, .03], [0, .5 + h*.87, z], g).rotation.z = Math.PI/2; }
    if (h === top) { mesh(G.cyl, 0x4a3220, [.2, .16, .2], [0, .5 + h*.9, z], g); mesh(G.cyl, T, [.21, .03, .21], [0, .5 + h*.9 + .08, z], g); }
    // a long streamer from every masthead
    const p = new THREE.Group(); p.position.set(0, .5 + h + .02, z); g.add(p);
    for (let k = 0; k < 6; k++) mesh(G.box, o.pen[k % o.pen.length], [.02, .07 - k*.008, .24], [0, 0, -.12 - k*.24], p).castShadow = false;
    SHIP_ANIM.push({p, ph:i + z});
  });
  if (o.flag) mesh(G.box, o.flag, [.02, .3, .45], [0, 1.6, -L/2 - .18], g);
}
const SHIPS = {
  fish:() => ({model:'shipS', len:2.4, wid:1, hull:0xb0402a, hull2:0x8a2a1e, masts:[[.2, 2.4]], sails:[sailMat('fish', '#f4ecd8', '#d9443a', 'stripes')], pen:[0xd9443a, 0xf4f4f4]}),
  trade:() => ({model:'shipM', len:3.8, wid:1.35, hull:0x6a4428, hull2:0x8a5a34, guns:2, masts:[[.8, 3.6], [-.6, 3.1]], sails:[sailMat('trade', '#efe2bf', '#b8322a', 'compass'), sailMat('trade2', '#efe2bf', '#b8322a', null)], pen:[0xd9443a, 0xf2c200], flag:0xd9443a}),
  war:() => ({model:'shipL', len:4, wid:1.4, hull:0x3a2a5a, hull2:0x5a3a7a, guns:4, masts:[[1.1, 3.4], [-.1, 4.2], [-1.2, 3.1]], sails:[sailMat('war', '#1f4fa8', '#f2c200', 'owl', '#ffe680'), sailMat('war2', '#f2c200', '#1f4fa8', null)], pen:[0x1f4fa8, 0xf2c200, 0xf4f4f4], flag:0x1f4fa8}),
  troop:() => ({model:'shipM', len:3.4, wid:1.3, hull:0x5a3a2a, hull2:0x7a5034, guns:2, masts:[[.6, 3.4], [-.7, 3]], sails:[sailMat('troop', '#e8e4da', '#1f4fa8', 'anchor'), sailMat('troop2', '#1f4fa8', '#e8e4da', null)], pen:[0x1f4fa8, 0xf4f4f4]}),
  pirate:() => ({model:'shipP', len:3.8, wid:1.35, hull:0x2a2024, hull2:0x4a1e2a, trim:0x3ad0b0, guns:3, masts:[[.9, 3.8], [-.5, 3.4]], sails:[sailMat('pirate', '#2a1a20', '#4af0c8', 'skull', '#4af0c8'), sailMat('pirate2', '#7a1a2a', '#4af0c8', null)], pen:[0x9a1a1a, 0x1a1a1a, 0x4af0c8], flag:0x111114}),
};
function updShips(dt) {
  for (const s of SHIP_ANIM) s.p.children.forEach((m, k) => { m.position.x = Math.sin(time*5 + s.ph + k*.9) * .05 * k; m.rotation.y = Math.sin(time*5 + s.ph + k*.9) * .25; });
}

