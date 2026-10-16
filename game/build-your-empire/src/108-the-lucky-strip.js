// ------------------------------------------------------------------ the Lucky Strip
const STRIP = {walk:{x0:-102, x1:-50, z0:102.8, z1:117.2}, path:{x0:-77.2, x1:-74.3, z0:66.5, z1:103}, spur:{x0:-80.6, x1:-74.3, z0:66.5, z1:69.5}, g:null, lots:{}, neon:[], beams:[], jets:[], tourists:[], gondola:null, t:10, spinT:0};
// lot centres: four on the north side (facing south onto the boulevard), four on the south side (facing north)
const STRIP_LOTS = {slots:[-96, 97.1], casino1:[-82.5, 97.1], casino2:[-69, 97.1], casino3:[-55.5, 97.1], chapel:[-96, 122.9], fountains:[-82.5, 122.9], stripHotel:[-69, 122.9], casino4:[-55.5, 122.9]};
const STRIP_PAY = {slots:1, chapel:.5, casino1:3, casino2:7, casino3:14, casino4:28, stripHotel:4};
function stripNeonTex(text, col, w = 512, h = 128) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = '#120a1e'; g.fillRect(0, 0, w, h); g.strokeStyle = col; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
  g.font = `bold ${Math.floor(h*.5)}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = col; g.shadowBlur = 24; g.fillStyle = '#ffffff'; g.fillText(text, w/2, h/2 + 2); g.shadowBlur = 12; g.fillStyle = col; g.fillText(text, w/2, h/2 + 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function stripSign(parent, text, col, w, h, x, y, z, ry = 0) {
  const m = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:stripNeonTex(text, col), toneMapped:false, side:THREE.DoubleSide}));
  m.scale.set(w, h, 1); m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); STRIP.neon.push({m, ph:R()*6}); return m;
}
// lit windows that glow after dark
function stripWinTex(cols, rows, base) {
  const c = document.createElement('canvas'); c.width = cols*8; c.height = rows*8; const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { g.fillStyle = R() < .65 ? '#ffd890' : '#2a3040'; g.fillRect(i*8 + 2, j*8 + 2, 4, 5); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; return t;
}
function stripTower(parent, w, h, d, x, z, base, cols, y0 = 0) {
  const t = stripWinTex(cols, Math.round(h*1.6), base), m = new THREE.Mesh(G.box, new THREE.MeshStandardMaterial({map:t, emissiveMap:t, emissive:0xffffff, emissiveIntensity:.15, roughness:.35, metalness:.3}));
  m.scale.set(w, h, d); m.position.set(x, y0 + h/2, z); m.castShadow = true; parent.add(m); STRIP.windows = (STRIP.windows || []).concat(m); return m;
}
function stripFx(anim) {
  if (STRIP.g) return;
  if (typeof wondersPark === 'function') wondersPark();
  const g = STRIP.g = new THREE.Group(); scene.add(g);
  const W0 = STRIP.walk, P0 = STRIP.path, S0 = STRIP.spur;
  clearForest({x0:-103, x1:-49.5, z0:90, z1:130}); clearForest({x0:-81, x1:-73.5, z0:65.5, z1:103});
  // the desert floor, the walk in from the wonders park, the boulevard and its sidewalks
  slab(0xd8b47a, 53, 39, -76, 110.4, .003);
  for (const q of [P0, S0]) slab(0xd8d4cc, q.x1 - q.x0, q.z1 - q.z0, (q.x0 + q.x1)/2, (q.z0 + q.z1)/2, .01);
  slab(0x34373c, 52, 5, -76, 110, .008); slab(0xd8d4cc, 52, 4.7, -76, 105.15, .012); slab(0xd8d4cc, 52, 4.7, -76, 114.85, .012);
  for (let x = -101; x < -50; x += 2.2) mesh(G.box, 0xf2c200, [1.1, .02, .12], [x, .02, 110], g);
  AREAS.push(W0, P0, S0);
  // palms between the lots on both sidewalks, streetlights in front of them
  for (const x of [-101.3, -89.25, -62.25, -50.7]) for (const z of [103.6, 116.4]) { palm(g, x, z); circles.push({x, z, r:.25}); }
  for (const x of [-92.6, -79.1, -65.6, -59]) for (const z of [107.2, 112.8]) { mesh(G.cyl, 0x2a2a2e, [.05, 3.2, .05], [x, 1.6, z], g); STRIP.lamps = (STRIP.lamps || []).concat(bulb(g, x, 3.15, z + (z < 110 ? .35 : -.35), 0xfff2c8, .12)); circles.push({x, z, r:.15}); }
  // the welcome sign, across from the walk in
  const sg = new THREE.Group(); sg.position.set(-75.75, 0, 117.9); g.add(sg);
  for (const x of [-.9, .9]) mesh(G.cyl, 0xd8d4cc, [.08, 2.6, .08], [x, 1.3, 0], sg);
  const board = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:(() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 320; const q = c.getContext('2d');
    q.fillStyle = '#f4f0e6'; q.beginPath(); q.moveTo(256, 4); q.lineTo(508, 120); q.lineTo(500, 250); q.lineTo(256, 316); q.lineTo(12, 250); q.lineTo(4, 120); q.closePath(); q.fill();
    q.strokeStyle = '#e8b030'; q.lineWidth = 10; q.stroke();
    q.textAlign = 'center'; q.fillStyle = '#d0302a'; q.font = 'bold 44px system-ui'; q.fillText('WELCOME TO', 256, 92);
    q.fillStyle = '#1e5aa8'; q.font = 'italic bold 52px Georgia, serif'; q.fillText('Fabulous', 256, 160);
    q.fillStyle = '#d0302a'; q.font = 'bold 60px system-ui'; q.fillText('LUCKY STRIP', 256, 232);
    for (let i = 0; i < 24; i++) { const a = i/24*Math.PI*2; q.fillStyle = '#ffd040'; q.beginPath(); q.arc(256 + Math.cos(a)*235, 165 + Math.sin(a)*140, 6, 0, 7); q.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })(), transparent:true, toneMapped:false, side:THREE.DoubleSide}));
  board.scale.set(3.2, 2, 1); board.position.set(0, 3.2, 0); sg.add(board); STRIP.neon.push({m:board, ph:0});
  STRIP.cash = makeCash('vegas', -78.9, 105.2);
  if (anim) popIn(g);
}
function stripLot(id, anim) {
  if (STRIP.lots[id]) return; if (!STRIP.g) stripFx(false);
  const [cx, cz] = STRIP_LOTS[id], north = cz < 110, sz = north ? 1 : -1;   // sz: toward the boulevard
  // each lot is built in its own frame (front toward local +z), then turned to face the boulevard
  const g = new THREE.Group(); g.position.set(cx, 0, cz); g.rotation.y = north ? 0 : Math.PI; scene.add(g); STRIP.lots[id] = g;
  const box = (hw, hd) => boxes.push({x0:cx - hw, x1:cx + hw, z0:cz - hd, z1:cz + hd});
  const W2 = (lx, lz) => [cx + lx*sz, cz + lz*sz];   // local to world
  slab(0xc9b48a, 11, 10.6, cx, cz, .01);
  // the name in neon, readable from the street side and from the camera (south) side
  const name = (text, col, w, h, y, z) => { stripSign(g, text, col, w, h, 0, y, z, 0); if (!north) stripSign(g, text, col, w, h, 0, y, -z, Math.PI); };
  if (id === 'slots') {
    mesh(G.box, 0x5a1e8a, [9, 3.4, 8.6], [0, 1.7, 0], g); mesh(G.box, 0x2a0a4a, [9.4, .4, 9], [0, 3.6, 0], g);
    for (let k = 0; k < 14; k++) bulb(g, -4.2 + k*.64, 2.9, 4.35, 0xffd040, .07);
    name('SLOTS', '#ff3ad8', 6, 1.5, 4.8, 3.6); box(4.6, 4.4);
    const [zx, zz] = W2(3, 6.3); STRIP.spin = addZone({kind:'spin', x:zx, z:zz, icon:'🎰', tile:{alpha:1, size:84, label:'Play the slots', fill:'rgba(120,30,140,.6)'}});
  } else if (id === 'chapel') {
    mesh(G.box, 0xf6f2ea, [7, 3, 5], [0, 1.5, 0], g); const roof = mesh(G.cone4, 0xe8a0b8, [5.4, 1.8, 4.4], [0, 3.9, 0], g); roof.rotation.y = Math.PI/4;
    mesh(G.box, 0xf6f2ea, [1.4, 3, 1.4], [0, 4.2, 2.2], g); mesh(G.cone4, 0xe8a0b8, [1.2, 2, 1.2], [0, 6.7, 2.2], g).rotation.y = Math.PI/4;
    mesh(G.box, 0xffd040, [.08, .9, .08], [0, 8.1, 2.2], g); mesh(G.box, 0xffd040, [.5, .08, .08], [0, 8.3, 2.2], g);
    name('♥ LITTLE CHAPEL ♥', '#ff5aa0', 5, 1, 2.2, 3.4); box(3.8, 3);
  } else if (id === 'casino1') {
    mesh(G.box, 0x1e5a3a, [10, 3, 9.6], [0, 1.5, 0], g, {metalness:.5, roughness:.25});
    const t = stripTower(g, 6, 14, 6, 0, -1.2, '#8a6a1a', 6, 3); t.material.color.set(0xffd27a); t.material.metalness = .7;
    name('GOLDEN LION', '#ffd040', 8, 1.6, 3.7, 4.85);
    const L = new THREE.Group(); L.position.set(3.6, 0, 5.2); g.add(L); const GOLD = {metalness:.9, roughness:.25};
    mesh(G.box, 0x6a6a6a, [1.2, .8, 1.2], [0, .4, 0], L); mesh(G.sph, 0xd8b04a, [.5, .5, .75], [0, 1.25, 0], L, GOLD); mesh(G.sph, 0xd8b04a, [.42, .42, .42], [0, 1.7, .45], L, GOLD); mesh(G.sph, 0xc8962a, [.55, .55, .3], [0, 1.72, .3], L, GOLD);
    box(4.9, 5.3);
  } else if (id === 'fountains') {
    mesh(G.box, 0xd8d4cc, [10.6, .5, 10], [0, .25, 0], g); mesh(G.box, 0x2a8ac8, [9.8, .1, 9.2], [0, .48, 0], g, {roughness:.05, metalness:.3});
    const JM = new THREE.MeshBasicMaterial({color:0xe8f6ff, transparent:true, opacity:.75, toneMapped:false});
    for (let i = 0; i < 5; i++) for (let k = 0; k < 5; k++) { const j = new THREE.Mesh(G.cyl, JM); j.position.set(-4 + i*2, .5, -3.6 + k*1.8); g.add(j); STRIP.jets.push({m:j, i, k}); }
    box(5.3, 5);
  } else if (id === 'casino2') {
    const P = mesh(G.cone4, 0x14141a, [7.4, 11, 7.4], [0, 5.5, -.4], g, {metalness:.85, roughness:.12}); P.rotation.y = Math.PI/4;
    mesh(G.box, 0xc8a85a, [3, 2.2, 1.6], [0, 1.1, 4.4], g); name('THE PYRAMID', '#40c8ff', 6, 1.2, 2.8, 5.25);
    const beam = new THREE.Mesh(G.cyl, new THREE.MeshBasicMaterial({color:0xfff6d0, transparent:true, opacity:.25, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false}));
    beam.scale.set(.35, 80, .35); beam.position.set(0, 51, -.4); g.add(beam); STRIP.beams.push(beam);
    const S = new THREE.Group(); S.position.set(-3.6, 0, 4.6); g.add(S);
    mesh(G.box, 0xd8c08a, [1.1, .8, 2], [0, .4, 0], S); mesh(G.box, 0xd8c08a, [.9, 1, .8], [0, 1.1, .7], S); mesh(G.box, 0x2a5a9a, [1.05, .7, .3], [0, 1.25, .5], S);
    box(5.3, 5.3);
  } else if (id === 'casino3') {
    mesh(G.box, 0xe8e4dc, [9, 3, 8.6], [0, 1.5, 0], g); name('SKY TOWER', '#ff6a3a', 7, 1.4, 3.5, 4.35);
    mesh(G.cyl, 0xd8d4cc, [1, 20, 1], [0, 13, -1], g); for (const a of [0, 2.1, 4.2]) mesh(G.box, 0xd8d4cc, [.3, 18, 2.4], [Math.cos(a)*.9, 12, -1 + Math.sin(a)*.9], g).rotation.y = -a;
    mesh(G.cyl, 0x3a4a5a, [3, 1.6, 3], [0, 23.8, -1], g, {metalness:.6, roughness:.2}); mesh(G.cyl, 0xe8e4dc, [3.2, .4, 3.2], [0, 24.8, -1], g);
    mesh(G.cone, 0xe8e4dc, [.3, 5, .3], [0, 27.5, -1], g); bulb(g, 0, 30.1, -1, 0xff3a2a, .2);
    box(4.6, 4.4);
  } else if (id === 'stripHotel') {
    for (const a of [0, 2.094, 4.189]) { const t = stripTower(g, 2.6, 16, 6, Math.sin(a)*2.4, -.6 + Math.cos(a)*2.4, '#e8e2d4', 4); t.rotation.y = a; }
    mesh(G.box, 0xc8a85a, [10, 2.4, 9.6], [0, 1.2, 0], g); name('RESORT', '#ffd040', 6, 1.4, 3, 4.85);
    box(5.1, 5);
  } else if (id === 'casino4') {
    mesh(G.box, 0xf0e2c4, [10.4, 5, 6.6], [0, 2.5, -1.6], g);
    for (let k = 0; k < 6; k++) { mesh(G.box, 0x6a4a3a, [.9, 1.4, .1], [-4 + k*1.6, 1.2, 1.72], g); mesh(G.box, 0x6a4a3a, [.7, 1, .1], [-4 + k*1.6, 3.4, 1.72], g); }
    mesh(G.box, 0xa83a2a, [1.8, 13, 1.8], [-4.2, 6.5, -3.4], g); mesh(G.cone4, 0x3a8a6a, [1.5, 2.6, 1.5], [-4.2, 14.3, -3.4], g).rotation.y = Math.PI/4;
    mesh(G.box, 0xf0e2c4, [2, 1.4, 2], [-4.2, 12.3, -3.4], g);
    mesh(G.box, 0x2a8a9a, [10.6, .1, 2.2], [0, .06, 3.4], g, {roughness:.05, metalness:.3});
    const gd = new THREE.Group(); g.add(gd); mesh(G.box, 0x111111, [2.2, .25, .5], [0, .2, 0], gd); mesh(G.box, 0x111111, [.12, .5, .12], [1.05, .45, 0], gd);
    mesh(G.box, 0xf4f4f4, [.2, .6, .25], [-.7, .65, 0], gd); mesh(G.box, 0x6b4526, [.04, 1.4, .04], [-.7, .7, .2], gd).rotation.z = .3;
    STRIP.gondola = {g:gd, z:3.4, x0:-4.6, x1:4.6};
    name('CANAL PALACE', '#5ad0ff', 7, 1.3, 4.6, 1.85);
    box(5.4, 5.2);
  }
  // tall ones fade while you walk behind them, so they never hide you from the camera
  const H = {casino1:17, casino2:11, casino3:30, stripHotel:16, casino4:15}[id]; if (H) fader(g, 11, H);
  if (anim) { popIn(g); puff(cx, cz); }
}
const stripTake = () => { let m = 0; for (const [k, v] of Object.entries(STRIP_PAY)) if (STRIP.lots[k]) m += v; return m * (STRIP.lots.fountains ? 1.25 : 1); };
function updStrip(dt) {
  if (!STRIP.g) return;
  const night = 1 - (FX.day.value ?? 1);
  // the neon flickers and glows brighter after dark; the pyramid's beam shows at night
  for (const n of STRIP.neon) { const b = .75 + .25*Math.sin(time*3 + n.ph) + night*.5; n.m.material.color.setScalar(Math.min(1.4, b)); }
  for (const b of STRIP.beams) b.material.opacity = .06 + night*.35;
  for (const m of STRIP.windows || []) m.material.emissiveIntensity = .15 + night*1.1;
  for (const l of STRIP.lamps || []) l.visible = night > .3;
  // the fountains: rows rise and fall in turn
  for (const j of STRIP.jets) { const h = Math.max(.1, 2.6*Math.max(0, Math.sin(time*1.6 + (Math.sin(time*.3) > 0 ? j.i : j.k)*.7))); j.m.scale.set(.09, h, .09); j.m.position.y = .5 + h/2; }
  if (STRIP.gondola) { const G0 = STRIP.gondola, u = (Math.sin(time*.25) + 1)/2; G0.g.position.set(G0.x0 + (G0.x1 - G0.x0)*u, 0, G0.z); G0.g.rotation.y = Math.cos(time*.25) > 0 ? 0 : Math.PI; }
  // the takings
  const take = stripTake();
  if (started && take && (STRIP.t -= dt) <= 0) {
    STRIP.t = 10; const v = Math.round((800 + 300*W.era) * take * .7);   // casinos pay well, not wildly
    addCash(STRIP.cash, v, {x:-76, z:110});
    if (Math.hypot(player.pos.x + 76, player.pos.z - 110) < 40) popText(`🎰 +${v.toLocaleString()} casino takings`, new THREE.Vector3(-76, 4, 110), '#ffe06b');
  }
  // tourists stroll the Strip
  const want = Math.min(16, 4 + Object.keys(STRIP.lots).length*2);
  if (STRIP.tourists.length < want && R() < dt) {
    const c = makeChar({civ:true}), side = R() < .5 ? 105.4 : 114.6; c.g.position.set(-100 + R()*48, 0, side); STRIP.tourists.push({c, tx:-100 + R()*48, tz:side, sp:1.2 + R()*.6, wait:0});
  }
  for (const t of STRIP.tourists) {
    const c = t.c, p = c.g.position;
    if (t.wait > 0) { t.wait -= dt; c.legL.rotation.x = c.legR.rotation.x = 0; continue; }
    const dx = t.tx - p.x, dz = t.tz - p.z, dd = Math.hypot(dx, dz);
    if (dd < .15) { t.wait = R() < .4 ? 1 + R()*3 : 0; t.tz = R() < .15 ? (p.z < 110 ? 114.6 : 105.4) : p.z; t.tx = -100 + R()*48; continue; }
    const st = Math.min(dd, t.sp*dt); p.x += dx/dd*st; p.z += dz/dd*st; c.g.rotation.y = Math.atan2(dx, dz);
    const sw = Math.sin(time*8 + t.sp*10); c.legL.rotation.x = sw*.6; c.legR.rotation.x = -sw*.6; c.armL.rotation.x = -sw*.4; c.armR.rotation.x = sw*.4;
  }
}
// the slots: every pull costs a stake; most lose, many double, a few pay big, and once in a while the jackpot
const SPIN = ['🍒', '🍋', '🔔', '⭐', '7️⃣', '💎'];
function playSlots(zn, e) {
  if (player.zoneT < .9) return;
  player.zoneT = 0;
  const bet = 400*(1 + W.era);
  if (W.coins < bet) { popText(`Need ${bet} 💵`, e.pos.clone().setY(2.6), '#ffb0a0'); return; }
  W.coins -= bet;
  // pays back a little over the stake on average (2x 30%, 3x 8%, 10x 1.2%, 60x 0.1%)
  const r = R(), mult = r < .001 ? 60 : r < .013 ? 10 : r < .093 ? 3 : r < .393 ? 2 : 0;
  const pick = () => SPIN[R()*SPIN.length|0], reel = mult >= 60 ? '💎💎💎' : mult >= 10 ? '7️⃣7️⃣7️⃣' : mult >= 3 ? '⭐⭐⭐' : mult ? (() => { const a = pick(); return a + a + pick(); })() : (() => { let a, b, c; do { a = pick(); b = pick(); c = pick(); } while (a === b && b === c); return a + b + c; })();
  const win = bet*mult; W.coins += win; if (win) W.earned += win - bet;
  popText(`${reel} ${win ? '+' + win.toLocaleString() : '−' + bet.toLocaleString()}`, e.pos.clone().setY(2.8), win ? '#ffe06b' : '#ffb0a0');
  if (mult >= 10) { banner(mult >= 60 ? '💎 JACKPOT!' : '7️⃣ Big win!', `The slots pay ${win.toLocaleString()} 💵.`); for (let i = 0; i < 20; i++) particle([0xffd84a, 0xff6ad8, 0xffffff][i % 3], e.pos.clone().setY(2), new THREE.Vector3((R() - .5)*6, 4 + R()*4, (R() - .5)*6), 1.2, .2, {grav:1}); }
  if (win) snd(880 + mult*20, .1, 'triangle', .04);
  save();
}
