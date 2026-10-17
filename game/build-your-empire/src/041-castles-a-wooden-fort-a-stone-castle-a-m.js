// ------------------------------------------------------------------ castles: a wooden fort, a stone castle, a moat with a drawbridge, then a bunker
let castleG = null, drawbridge = null, turrets = [];
const CASTLE_NAMES = ['', '🪵 Wooden fort!', '🏯 Stone castle!', '🏰 Moat and drawbridge!', '🪖 Bunker complex!'];
function castleStage(n, anim) {
  W.castle = n;
  if (castleG) { scene.remove(castleG); const i = FADERS.findIndex(f => f.g === castleG); if (i >= 0) FADERS.splice(i, 1); }
  drawbridge = null; turrets = [];
  const cx = -4.2, cz = 75.85, g = new THREE.Group(); g.position.set(cx, 0, cz); scene.add(g); castleG = g;
  const P = (geo, c, s, p, o) => mesh(geo, c, s, p, g, o);
  const torch = (x, y, z) => { P(G.cyl, 0x3a2a1a, [.03, .35, .03], [x, y, z]); bulb(g, x, y + .25, z, 0xffa040, .07); };
  const banner = (x, y, z, c, ry = 0) => { const b = P(G.box, c, [.42, .9, .03], [x, y, z]); b.rotation.y = ry; P(G.box, 0xf2c200, [.43, .06, .035], [x, y + .42, z]).rotation.y = ry; };
  let w, d, top;
  if (n === 1) {
    // a stockade of sharpened logs, watchtowers and a longhouse
    w = 7; d = 4.4;
    const log = (x, z) => { const h = 2 + Math.sin(x*7 + z*3)*.15; P(G.cyl, 0x7a5232, [.15, h, .15], [x, h/2, z]); P(G.cone, 0x6a4428, [.15, .32, .15], [x, h + .16, z]); };
    for (let x = -w/2; x <= w/2 + .01; x += .3) { log(x, -d/2); log(x, d/2); }
    for (let z = -d/2 + .3; z < d/2; z += .3) { log(-w/2, z); if (Math.abs(z) > .6) log(w/2, z); }
    for (const z of [-d/2 + .25, d/2 - .25]) P(G.box, 0x6b4526, [w, .08, .3], [0, 1.5, z]);
    for (const [x, z] of [[-w/2, -d/2], [w/2, -d/2], [-w/2, d/2], [w/2, d/2]]) {
      for (const [a, b] of [[-.4, -.4], [.4, -.4], [-.4, .4], [.4, .4]]) P(G.cyl, 0x5e3f22, [.07, 3, .07], [x + a, 1.5, z + b]);
      P(G.box, 0x8a5a2b, [1.1, .1, 1.1], [x, 3, z]); for (const s of [-1, 1]) { P(G.box, 0x7a4f2a, [1.1, .4, .06], [x, 3.25, z + s*.53]); P(G.box, 0x7a4f2a, [.06, .4, 1.1], [x + s*.53, 3.25, z]); }
      P(G.cone4, 0x5a3a20, [.95, .7, .95], [x, 3.85, z]).rotation.y = Math.PI/4; torch(x + .5, 3.2, z + .5);
    }
    P(G.box, 0x5e3f22, [.3, 2.6, 1.6], [w/2 + .05, 1.3, 0]); P(G.box, 0x4a2a14, [.1, 1.5, 1.1], [w/2 + .2, .75, 0]);
    P(G.box, 0x8a5d36, [3, 1.4, 1.8], [-.6, .7, 0]); const r = P(G.cone4, 0x6a4a2a, [2.2, 1.3, 1.4], [-.6, 2, 0]); r.rotation.y = Math.PI/4; r.scale.set(2.3, 1.3, 1.35);
    P(G.box, 0x4a2a14, [.04, .8, .5], [.92, .4, 0]); for (const z of [-.5, .5]) P(G.box, 0x5e3f22, [.12, .12, 1.9], [-.6 + z*2.4, 2.65, 0]);
    banner(w/2 + .25, 2, -.95, 0xb8322a, Math.PI/2); banner(w/2 + .25, 2, .95, 0xb8322a, Math.PI/2);
    top = 4.2;
  } else if (n === 2 || n === 3) {
    const big = n === 3, STONE = big ? 0xd9d2c2 : 0xa9a59d, TOWER = big ? 0xe6dfcf : 0xb4b0a8, ROOF = big ? 0x2d4fa8 : 0x8a2e2a, DARK = 0x1e1a16;
    w = big ? 7.2 : 8; d = big ? 3.9 : 4.6;
    if (big) {
      // the moat, with stone banks, all the way round
      const wat = mat(0x2a7ab0, {roughness:.1, metalness:.2});
      for (const [a, b, sw, sd] of [[0, -d/2 - .75, w + 2.1, .55], [0, d/2 + .75, w + 2.1, .55], [-w/2 - .75, 0, .55, d + 2.1], [w/2 + .75, 0, .55, d + 2.1]]) {
        mesh(G.box, 0x7d776c, [sw + .2, .1, sd + .2], [a, .02, b], g); const m = new THREE.Mesh(G.box, wat); m.scale.set(sw, .05, sd); m.position.set(a, .06, b); g.add(m);
      }
    }
    const wall = (len, x, z, alongX) => {
      P(G.box, STONE, alongX ? [len, 2.5, .6] : [.6, 2.5, len], [x, 1.25, z]);
      P(G.box, shade(STONE, .85), alongX ? [len + .02, .12, .64] : [.64, .12, len + .02], [x, 2.45, z]);
      for (let t = -len/2 + .25; t <= len/2 - .25; t += .55) P(G.box, STONE, alongX ? [.3, .36, .64] : [.64, .36, .3], [alongX ? x + t : x, 2.7, alongX ? z : z + t]);
      for (let t = -len/2 + .9; t < len/2 - .5; t += 1.4) {
        P(G.box, DARK, alongX ? [.07, .4, .62] : [.62, .4, .07], [alongX ? x + t : x, 1.5, alongX ? z : z + t]);
        P(G.box, shade(STONE, .9), alongX ? [.35, 1.6, .14] : [.14, 1.6, .35], [alongX ? x + t + .7 : x + Math.sign(x)*.32, .8, alongX ? z + Math.sign(z)*.32 : z + t + .7]);
      }
    };
    wall(w, 0, -d/2, true); wall(w, 0, d/2, true); wall(d, -w/2, 0, false); wall(d, w/2, 0, false);
    const towers = [[-w/2, -d/2], [w/2, -d/2], [-w/2, d/2], [w/2, d/2]];
    if (big) towers.push([0, -d/2], [0, d/2]);
    for (const [x, z] of towers) {
      const h = big ? 4.4 : 3.8;
      P(G.cyl, TOWER, [.66, h, .66], [x, h/2, z]); P(G.cyl, shade(TOWER, .85), [.72, .14, .72], [x, h - .05, z]);
      for (let i = 0; i < 10; i++) { const a = i/10*Math.PI*2; P(G.box, TOWER, [.2, .32, .2], [x + Math.cos(a)*.62, h + .16, z + Math.sin(a)*.62]); }
      P(G.cone, ROOF, [.78, 1.6, .78], [x, h + 1.12, z]); P(G.cyl, 0x3a2a1a, [.025, .5, .025], [x, h + 2.1, z]); P(G.box, ROOF, [.3, .18, .02], [x + .15, h + 2.25, z]);
      for (const y of [h*.4, h*.7]) { P(G.box, DARK, [.12, .32, .05], [x + .48, y, z + .48]).rotation.y = Math.PI/4; }
      torch(x + .55, 2.2, z + .55);
    }
    // the gatehouse, with a portcullis and flanking turrets
    P(G.box, STONE, [1, 3.3, 2], [w/2, 1.65, 0]); for (let t = -.8; t <= .8; t += .4) P(G.box, STONE, [1, .32, .26], [w/2, 3.45, t]);
    P(G.box, DARK, [.1, 1.7, 1.1], [w/2 + .51, .85, 0]); const arch = P(G.cyl, DARK, [.55, .1, .55], [w/2 + .51, 1.7, 0]); arch.rotation.z = Math.PI/2;
    for (let i = 0; i < 5; i++) P(G.box, 0x3a3a3e, [.04, 1.6, .04], [w/2 + .56, .9, -.4 + i*.2], {metalness:.6});
    for (const z of [-1.05, 1.05]) { P(G.cyl, TOWER, [.42, 3.8, .42], [w/2 + .1, 1.9, z]); P(G.cone, ROOF, [.5, 1.1, .5], [w/2 + .1, 4.35, z]); }
    banner(w/2 + .58, 2.2, -.6, big ? 0x2d4fa8 : 0xb8322a, Math.PI/2); banner(w/2 + .58, 2.2, .6, big ? 0x2d4fa8 : 0xb8322a, Math.PI/2);
    if (big) {
      // the drawbridge, hinged at the gate, lowered over the moat
      drawbridge = new THREE.Group(); drawbridge.position.set(w/2 + .55, .12, 0); g.add(drawbridge);
      mesh(G.box, 0x7a5232, [1.25, .1, 1], [.62, 0, 0], drawbridge); for (let i = 0; i < 5; i++) mesh(G.box, 0x5e3f22, [.06, .12, 1.02], [.12 + i*.25, .02, 0], drawbridge);
      drawbridge.chains = [];
      for (const z of [-.45, .45]) { const ch = P(G.cyl, 0x4a4a4e, [.02, 1, .02], [w/2 + 1, 1.5, z], {metalness:.6}); drawbridge.chains.push(ch); }
    }
    // the keep, with floors of lit windows and a wall-walk
    const kh = big ? 6.2 : 5, kw = big ? 3 : 3.2, kx = big ? -.9 : -.6;
    P(G.box, TOWER, [kw, kh, 2.4], [kx, kh/2, 0]);
    for (let f = 1; f < kh/1.4; f++) P(G.box, shade(TOWER, .88), [kw + .04, .08, 2.44], [kx, f*1.4, 0]);
    for (let x = -kw/2 + .22; x <= kw/2 - .2; x += .5) for (const z of [-1.2, 1.2]) P(G.box, TOWER, [.26, .34, .28], [kx + x, kh + .17, z]);
    for (let f = 1; f < kh/1.4; f++) for (let x = -kw/2 + .45; x <= kw/2 - .4; x += .65) { P(G.box, WIN, [.2, .4, .05], [kx + x, f*1.4 - .6, 1.21]); P(G.cone4, TOWER, [.14, .14, .04], [kx + x, f*1.4 - .32, 1.22]).rotation.y = Math.PI/4; }
    if (big) {
      for (const [x, z] of [[-kw/2, -1.2], [kw/2, -1.2], [-kw/2, 1.2], [kw/2, 1.2]]) { P(G.cyl, TOWER, [.3, 1.6, .3], [kx + x, kh + .8, z]); P(G.cone, ROOF, [.36, 1.3, .36], [kx + x, kh + 2.25, z]); }
      P(G.cyl, TOWER, [.75, 2, .75], [kx, kh + 1, 0]);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(.8, 16, 10, 0, Math.PI*2, 0, Math.PI/2), mat(0xf2c200, {metalness:.8, roughness:.25})); dome.position.set(kx, kh + 2, 0); dome.castShadow = true; g.add(dome);
    } else P(G.cone4, ROOF, [2.3, 1.4, 1.8], [kx, kh + 1.1, 0]).rotation.y = Math.PI/4;
    top = kh + (big ? 3 : 1.8);
  } else {
    // a modern bunker complex: concrete, gun turrets, radar and a helipad
    w = 8; d = 4.6;
    const CON = 0x8d8f8a, CON2 = 0x777a74, CAMO = [0x5a6448, 0x4a5238, 0x6e6a4a];
    for (const [a, b, sw, sd] of [[0, -d/2, w, .8], [0, d/2, w, .8], [-w/2, 0, .8, d], [w/2, 0, .8, d]]) {
      P(G.box, CON, [sw, 1.3, sd], [a, .65, b]); const lip = P(G.box, CON2, [sw + .1, .2, sd + .1], [a, 1.35, b]);
      for (let t = -.4; t <= .4; t += .2) { const sand = P(G.sph, 0xb8a878, [.28, .14, .2], [a + (sw > 1 ? t*sw : 0), 1.52, b + (sd > 1 ? t*sd : 0)]); }
    }
    for (let t = -w/2 + .8; t < w/2; t += 1.3) P(G.box, 0x111114, [.5, .1, .82], [t, .95, d/2]);
    const bunker = (x, z, s) => {
      P(G.box, CON, [2.2*s, 1.2*s, 1.8*s], [x, .6*s, z]); const r = P(G.box, CON2, [2.4*s, .25*s, 2*s], [x, 1.3*s, z]);
      P(G.box, 0x111114, [1.4*s, .14*s, .05], [x, .85*s, z + .91*s]);
      for (let i = 0; i < 6; i++) P(G.box, CAMO[i % 3], [.7*s, .03, .6*s], [x - .8*s + (i % 3)*.8*s, 1.45*s, z - .4*s + Math.floor(i / 3)*.8*s]).rotation.y = i*.7;
    };
    bunker(-1.8, -.4, 1.2); bunker(1.6, -.8, .9);
    for (const [x, z] of [[-w/2 + .2, -d/2 + .2], [w/2 - .2, d/2 - .2], [-w/2 + .2, d/2 - .2]]) {
      const t = new THREE.Group(); t.position.set(x, 1.5, z); g.add(t);
      mesh(G.cyl, CON2, [.45, .4, .45], [0, .2, 0], t); const head = new THREE.Group(); head.position.y = .45; t.add(head);
      mesh(G.box, 0x4a5238, [.5, .3, .6], [0, .1, 0], head); for (const x2 of [-.1, .1]) mesh(G.cyl, 0x2a2a2e, [.04, .9, .04], [x2, .15, .6], head, {metalness:.6}).rotation.x = Math.PI/2;
      turrets.push(head);
    }
    const radar = new THREE.Group(); radar.position.set(-1.8, 2, -.4); g.add(radar);
    mesh(G.sph, 0xf4f6f8, [.7, .7, .7], [0, .5, 0], radar, {roughness:.4});
    const dish = new THREE.Group(); dish.position.set(1.6, 1.8, -.8); g.add(dish); mesh(G.cyl, 0x9aa0a8, [.05, .5, .05], [0, .25, 0], dish);
    const dd = mesh(G.sph, 0xeef0f4, [.5, .16, .5], [0, .6, 0], dish, {metalness:.3}); dd.rotation.x = -.7; turrets.push(dish);
    P(G.cyl, 0x5a5e66, [1.1, .05, 1.1], [1.9, .03, 1.2]); P(G.box, 0xf4f4f4, [.12, .01, .7], [1.65, .065, 1.2]); P(G.box, 0xf4f4f4, [.12, .01, .7], [2.15, .065, 1.2]); P(G.box, 0xf4f4f4, [.5, .01, .12], [1.9, .065, 1.2]);
    for (const [x, z] of [[-w/2, -d/2], [w/2, -d/2], [-w/2, d/2], [w/2, d/2]]) { P(G.cyl, 0x3a3e44, [.05, 3, .05], [x, 1.5, z], {metalness:.5}); bulb(g, x, 3.05, z, 0xffffff, .12); }
    for (let t = -w/2; t < w/2; t += .5) P(G.cyl, 0x2a2a2e, [.012, .5, .012], [t, 1.75, -d/2 - .45]).rotation.z = .8;
    P(G.box, 0x111114, [.15, 1.2, 1.4], [w/2 + .05, .6, 0]);
    top = 3.6;
  }
  const kxF = n === 4 ? 2.6 : -.6;
  P(G.cyl, 0x5e3f22, [.06, 2.4, .06], [kxF, top + 1.2, 0]);
  ST.flag3 = P(G.box, n >= 3 ? 0xf2c200 : 0xd9443a, [1.1, .6, .03], [kxF + .56, top + 2.05, 0]);
  // the outer edge of the moat or walls is the footprint you walk around
  const ex = w/2 + (n === 3 ? 1.1 : .75), ez = d/2 + (n === 3 ? 1.1 : .5);
  const b = boxes.find(b => b.castle); if (b) Object.assign(b, {x0:cx - ex, x1:cx + ex + (n === 3 ? .4 : 0), z0:Math.max(72.95, cz - ez), z1:78.6});
  fader(g, w + 1, top + 1.5);
  if (anim) { popIn(g); banner(CASTLE_NAMES[n], `Your stronghold now earns ${[0, 1, 1.5, 2, 2.5][n]}× the tribute from every soldier.`); }
}
function updCastle(dt) {
  if (drawbridge) {
    // lowered when the army marches or now and then for visitors, raised the rest of the time
    const open = !!(W.camp || (W.raid && !W.raid.siege)) || Math.sin(time*.25) > .3, want = open ? 0 : -1.45;
    drawbridge.rotation.z += (want - drawbridge.rotation.z) * Math.min(1, dt*1.5);
    const k = -drawbridge.rotation.z / 1.45; drawbridge.chains.forEach(c => { c.scale.y = .5 + k*.6; c.position.y = 1.6 - k*.3; });
  }
  turrets.forEach((t, i) => { t.rotation.y = Math.sin(time*.4 + i*2) * 1.2; });
}

