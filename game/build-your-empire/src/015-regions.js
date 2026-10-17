// ------------------------------------------------------------------ regions
const REGIONS = {
  north:{name:'the Northern Quarry', rect:{x0:-10.3, x1:13.4, z0:-47.6, z1:-30.9}, gap:['n', -9.2, -6.2], gate:[[-7.7, -12.1], [-7.7, -32.9]], ground:0xbfa57a},
  east:{name:'the Market Quarter', rect:{x0:33.4, x1:50.6, z0:-12.9, z1:13.9}, gate:[[12.6, 1.6], [35.4, 1.6]], ground:0xcfae78},
  south:{name:'the Military Grounds', rect:{x0:-10.3, x1:13.4, z0:34, z1:78.6}, gap:['s', 1.5, 4.5], gate:[[3, 13.2], [3, 63.8]], ground:0xc4a070},
  farm:{name:'the Farmlands', rect:{x0:33.4, x1:50.6, z0:61.9, z1:78.6}, ground:0xb9a865},
  downtown:{name:'Downtown', rect:{x0:33.4, x1:50.6, z0:-47.6, z1:-30.9}, ground:0x9ea3ad},
  airfield:{name:'the Airfield', rect:{x0:-39, x1:-22.6, z0:-12.9, z1:28.633}, extra:{x0:-20.7, x1:-10.2, z0:8.85, z1:10.35}, ground:0x8fa86a},
  ranch:{name:'the Ranch', rect:{x0:-39, x1:-22.6, z0:-48, z1:-32}, extra:{x0:-20.8, x1:-10.2, z0:-39.68, z1:-38.32}, ground:0x9fb06a},
};
// how regions connect, with the waypoints to cross between them
const EDGES = [
  ['camp', 'north', [[-7.7, -12.1], [-7.7, -32.9]]], ['camp', 'east', [[12.6, 1.6], [35.4, 1.6]]], ['camp', 'south', [[3, 13.2], [3, 63.8]]],
  ['east', 'farm', [[39.6, 12.9], [39.6, 63]]], ['south', 'farm', [[12.4, 70.8], [34.6, 70.8]]],
  ['east', 'downtown', [[35, -12.2], [35, -32]]], ['camp', 'airfield', [[-9.6, 9.6], [-23.4, 9.6]]], ['north', 'downtown', [[12.8, -40.5], [34.4, -40.5]]],
  ['north', 'ranch', [[-9.8, -39], [-23.4, -39]]],
];
const regionOpen = id => id === 'camp' || W.unlocked.has(id + 'Gate');
function regionOf(x, z) {
  if (inRect(BOUNDS, x, z)) return 'camp';
  for (const [id, r] of Object.entries(REGIONS)) if (inRect(r.rect, x, z)) return id;
  return 'camp';
}
function clearForest(r) {
  const o = new THREE.Object3D(); o.scale.setScalar(0); o.updateMatrix();
  FOREST.spots.forEach(([x, z], i) => {
    if (x > r.x0 - 1.2 && x < r.x1 + 1.2 && z > r.z0 - 1.2 && z < r.z1 + 1.2) { if (FOREST.hideAt) FOREST.hideAt(i); else FOREST.meshes.forEach(m => m.setMatrixAt(i, o.matrix)); }
  });
  FOREST.meshes.forEach(m => { m.instanceMatrix.needsUpdate = true; });
}
function openRegion(id, anim) {
  const r = REGIONS[id];
  AREAS.push(r.rect); if (r.extra) AREAS.push(r.extra);
  if (r.gap) GAPS[r.gap[0]] = [r.gap[1], r.gap[2]];
  clearForest(r.rect);
  const R0 = r.rect;
  const paved = W.flags.roads && PAVED(r);
  r.slab = slab(r.ground, R0.x1 - R0.x0, R0.z1 - R0.z0, (R0.x0 + R0.x1)/2, (R0.z0 + R0.z1)/2, -.004);
  if (paved) pave(r.slab);
  fence(false);
  if (id === 'north') spawnRocks();
  if (id === 'farm') { windmill(); AREAS.push({x0:50.4, x1:53, z0:59.5, z1:67.3}); }   // the strip by the railway
  if (id === 'downtown') downtownStreets();
  if (id === 'airfield') airfieldFx();
  gapRoads();
  if (anim) {
    banner('🗺️ New land!', `You opened ${r.name}.`);
    for (let i = 0; i < 10; i++) puff(R0.x0 + R()*(R0.x1 - R0.x0), R0.z0 + R()*(R0.z1 - R0.z0));
    [392, 523, 659, 784].forEach((f, i) => setTimeout(() => snd(f, .2, 'triangle', .05), i*120));
  }
}
// old (compact) map position -> spread-out map position, for old saves
function spreadPt(x, z) {
  const camp = x >= -11 && x <= 14.6 && z >= -14 && z <= 14.9;
  if (camp) return [x, z];
  const OLD = [[-10.3, 13.4, -29.6, -12.9, 0, -1], [13.4, 30.6, -12.9, 13.9, 1, 0], [-10.3, 13.4, 13.9, 30.6, 0, 1], [13.4, 30.6, 13.9, 30.6, 1, 1], [13.4, 30.6, -29.6, -12.9, 1, -1], [-34, -17.6, -12.9, 13.9, -1, 0], [-34, -17.6, -30, -14, -1, -1]];
  const r = OLD.find(o => x >= o[0] && x <= o[1] && z >= o[2] && z <= o[3]);
  const sx = r ? r[4] : x > 13.4 ? 1 : x < -17.65 ? -1 : 0, sz = r ? r[5] : z > 13.95 ? 1 : z < -12.95 ? -1 : 0;
  return [x + sx*(sx > 0 ? 30 : 60), z + sz*(sz > 0 ? 60 : 30)];
}
function closerPt(x, z) {
  const cx = x >= 73.4 ? x - 30 : x > 14.6 ? 14.6 + (x - 14.6)*(28.8/58.8) : x;
  const cz = z <= -72.9 ? z + 30 : z < -14 ? -14 + (z + 14)*(28.9/58.9) : z;
  return [cx, cz];
}
// the open country between regions: a dirt road across each gap once both sides are yours
const GAP_ROADS = {};
function gapRoads() {
  EDGES.forEach(([u, v, [[ax, az], [bx, bz]]], i) => {
    if (GAP_ROADS[i] || !regionOpen(u) || !regionOpen(v)) return;
    const flat = Math.abs(az - bz) < .01, r = flat ? {x0:Math.min(ax, bx), x1:Math.max(ax, bx), z0:az - 1.8, z1:az + 1.8} : {x0:ax - 1.8, x1:ax + 1.8, z0:Math.min(az, bz), z1:Math.max(az, bz)};
    GAP_ROADS[i] = r; AREAS.push(flat ? {...r, z0:r.z0 + .3, z1:r.z1 - .3} : {...r, x0:r.x0 + .3, x1:r.x1 - .3}); clearForest({x0:r.x0 - 1, x1:r.x1 + 1, z0:r.z0 - 1, z1:r.z1 + 1});
    const g = slab(0xb98f5c, r.x1 - r.x0, r.z1 - r.z0, (r.x0 + r.x1)/2, (r.z0 + r.z1)/2, .01);
    // milestones and lamps along the way, so the long road reads as a road
    const len = flat ? r.x1 - r.x0 : r.z1 - r.z0;
    for (let d = 6; d < len - 4; d += 9) {
      const x = flat ? r.x0 + d : r.x1 + .5, z = flat ? r.z1 + .5 : r.z0 + d;
      mesh(G.cyl, 0x3a3a3e, [.06, 1.8, .06], [x, .9, z], scene); bulb(scene, x, 1.85, z, 0xffd890, .09);
    }
  });
}
// fast travel: hop to any open part of your land
function travelSpots() {
  const out = [['🏕️ The camp', 1.6, 6]];
  for (const [id, r] of Object.entries(REGIONS)) {
    if (!regionOpen(id)) continue;
    const e = EDGES.find(([u, v]) => (u === id || v === id) && regionOpen(u === id ? v : u)); if (!e) continue;
    const p = e[0] === id ? e[2][0] : e[2][1];
    out.push([`${{north:'⛏️', east:'💰', south:'⚔️', farm:'🌾', downtown:'🏙️', airfield:'✈️', ranch:'🐄'}[id] || '🗺️'} ${r.name.replace(/^the /, 'The ')}`, p[0], p[1]]);
  }
  if (typeof DISTRICT !== 'undefined' && DISTRICT.ferry) out.push(['⛵ The coast', -9, -78.4]);
  return out;
}
function openWorldMap() {
  const m = $('modal'); m.hidden = false; m.dataset.panel = 'map';
  const Wd = Math.min(880, innerWidth - 40), Hd = Math.round(Wd * .625);
  m.innerHTML = `<div class="card" style="max-width:${Wd + 40}px"><h1 style="font-size:24px">🌍 The world</h1><canvas id="wmap" width="${Wd*2}" height="${Hd*2}" style="width:${Wd}px;height:${Hd}px;border-radius:10px;display:block"></canvas>
    <p style="font-size:13px;margin:8px 0 0">Clouds hide what you have not explored. Sail east far enough and you come back from the west.</p><button class="ghost" id="wmClose">Close</button></div>`;
  $('wmClose').onclick = () => { m.hidden = true; };
  const cv = $('wmap'), g = cv.getContext('2d'), sx = cv.width/960, sz = cv.height/600, X = x => (wrapX(x) + 480)*sx, Z = z => (z + 320)*sz;
  g.fillStyle = '#2a6fa8'; g.fillRect(0, 0, cv.width, cv.height);
  g.fillStyle = '#e2cf98'; g.fillRect(X(WORLD.cx0) - 6, Z(WORLD.cz0) - 6, (WORLD.cx1 - WORLD.cx0)*sx + 12, (WORLD.cz1 - WORLD.cz0)*sz + 12);
  g.fillStyle = '#5f8a3e'; g.fillRect(X(WORLD.cx0), Z(WORLD.cz0), (WORLD.cx1 - WORLD.cx0)*sx, (WORLD.cz1 - WORLD.cz0)*sz);
  for (const I of WORLD.islands) { g.fillStyle = '#e2cf98'; g.beginPath(); g.arc(X(I.x), Z(I.z), (I.r + 4)*sx, 0, 7); g.fill(); g.fillStyle = '#5f8a3e'; g.beginPath(); g.arc(X(I.x), Z(I.z), (I.r - 1)*sx, 0, 7); g.fill(); }
  g.fillStyle = '#4a8fd0'; g.fillRect(X(-19.6), Z(WORLD.cz0), 9*sx, (WORLD.cz1 - WORLD.cz0)*sz);   // the river
  g.fillStyle = '#c9a26a'; for (const r of [...WORLD.roads, ...Object.values(GAP_ROADS)]) g.fillRect(X(r.x0), Z(r.z0), (r.x1 - r.x0)*sx, Math.max(2, (r.z1 - r.z0)*sz));
  for (const [id, r] of Object.entries(REGIONS)) if (regionOpen(id)) { g.fillStyle = 'rgba(240,220,160,.85)'; g.fillRect(X(r.rect.x0), Z(r.rect.z0), (r.rect.x1 - r.rect.x0)*sx, (r.rect.z1 - r.rect.z0)*sz); }
  g.fillStyle = 'rgba(250,235,190,.95)'; g.fillRect(X(BOUNDS.x0), Z(BOUNDS.z0), (BOUNDS.x1 - BOUNDS.x0)*sx, (BOUNDS.z1 - BOUNDS.z0)*sz);
  const pin = (x, z, t, size = 26) => { if (!seen(x, z)) return; g.font = `${size}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, X(x), Z(z)); };
  pin(1.5, .5, '🏠', 30);
  for (const [style, S] of Object.entries(STYLE_SPOTS)) if (DISTRICT.built[style]) { const c = S.centre || (S.site ? [COAST.sites[S.site].x, -72] : [0, 0]); pin(c[0], c[1], S.flag); }
  if (typeof RTOWN !== 'undefined') for (const r of EMP.list) { const T = RTOWN[r.id], c = r.at || (STYLE_SPOTS[RT_STYLE[r.id]] || {}).centre; if (T && T.lvl >= 0 && c && seen(c[0], c[1])) { pin(c[0], c[1], r.icon, 30); g.font = '20px system-ui'; g.fillStyle = '#fff'; g.fillText(`${r.n} (${TIERS[T.lvl][1]})`, X(c[0]), Z(c[1]) + 26); } }
  if (typeof AIRSTRIPS !== 'undefined') for (const A of Object.values(AIRSTRIPS)) pin(A.tile[0], A.tile[1], '✈️', 18);
  // the campaign targets: the places your army fights (a flag once taken)
  CAMPAIGNS.forEach((c, ci) => { const p = campPlace(ci); if (!p || !seen(p[0], p[1])) return; pin(p[0], p[1], ci < W.conquests ? '🚩' : c.icon, 24);
    g.font = 'bold 18px system-ui'; g.fillStyle = '#1a1410'; g.fillText(c.name, X(p[0]), Z(p[1]) + 26); });
  if (BOAT.docked) for (const d of DOCKS) pin(d.land[0], d.land[1], '⚓', 18);
  if (BOAT.g && !BOAT.on) pin(BOAT.pos.x, BOAT.pos.z, '🛥️', 20);
  // the cloud over everything unexplored
  { const fc = document.createElement('canvas'); fc.width = FOG.nx; fc.height = FOG.nz; const fg = fc.getContext('2d'), im = fg.createImageData(FOG.nx, FOG.nz);
    for (let k = 0; k < FOG.data.length; k++) { const v = 214 + ((k*37) % 17); im.data[k*4] = v; im.data[k*4 + 1] = v + 4; im.data[k*4 + 2] = v + 12; im.data[k*4 + 3] = FOG.data[k] ? 0 : 250; }
    fg.putImageData(im, 0, 0); g.save(); g.imageSmoothingEnabled = true; g.filter = 'blur(5px)'; g.drawImage(fc, 0, 0, cv.width, cv.height); g.filter = 'none'; g.drawImage(fc, 0, 0, cv.width, cv.height); g.restore(); }
  // where you are
  g.fillStyle = '#ff3b30'; g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.arc(X(player.pos.x), Z(player.pos.z), 10, 0, 7); g.fill(); g.stroke();
}
function openTravel() {
  const m = $('modal'); m.hidden = false; m.dataset.panel = 'travel';
  const spots = travelSpots();
  m.innerHTML = `<div class="card"><h1 style="font-size:24px">🧭 Travel</h1><p>Hop to any part of your land. Walk the roads to see the country between.</p>
    <div class="trades">${spots.map(([n], i) => `<div><b style="width:auto;flex:1">${n}</b><button data-i="${i}">Go</button></div>`).join('')}</div>
    <button class="ghost" id="tvClose">Close</button></div>`;
  m.querySelectorAll('button[data-i]').forEach(b => b.onclick = () => {
    const [n, x, z] = spots[+b.dataset.i]; m.hidden = true;
    for (let i = 0; i < 14; i++) particle(0xe8f8ff, player.pos.clone().setY(.4), new THREE.Vector3((R() - .5)*3, 1 + R()*2, (R() - .5)*3), .6, .15, {grav:1});
    player.pos.set(x, 0, z); camera.position.set(x + 11.8, 19, z + 11.8); note(`🧭 ${n}`, 'You travel by road.');
  });
  $('tvClose').onclick = () => { m.hidden = true; };
}
// walkers cross between regions through the gates, by the shortest chain of open regions
function route(from, tx, tz) {
  const a = regionOf(from.x, from.z), b = regionOf(tx, tz);
  if (a === b) return [[tx, tz]];
  const prev = {[a]:null}, q = [a];
  while (q.length && !(b in prev)) {
    const r = q.shift();
    for (const [u, v, pts] of EDGES) for (const [p, n, gp] of [[u, v, pts], [v, u, [...pts].reverse()]])
      if (p === r && regionOpen(n) && !(n in prev)) { prev[n] = [r, gp]; q.push(n); }
  }
  if (!(b in prev)) return [[tx, tz]];
  const pts = []; let r = b;
  while (prev[r]) { const [pr, gp] = prev[r]; pts.unshift(...gp); r = pr; }
  pts.push([tx, tz]);
  return pts;
}
function goTo(e, x, z, dt) {
  const key = x + ',' + z;
  if (e.routeKey !== key) { e.routeKey = key; e.route = route(e.pos, x, z); }
  while (e.route.length > 1 && Math.hypot(e.route[0][0] - e.pos.x, e.route[0][1] - e.pos.z) < .3) e.route.shift();
  return moveTo(e, e.route[0][0], e.route[0][1], dt) && e.route.length === 1;
}

// rocks in the quarry, mined like trees are chopped
const rocks = [];
function spawnRocks() {
  seed = 23;
  const avoid = [[-7.7, -32.5], [-7.7, -35], [0, -45.2], [6.5, -40], [4.1, -40], [8.9, -40], [-6, -35.5], [-6, -37.2], [-2.5, -41], [-2.6, -35.4], [9.6, -34.6], [7.2, -34.6], [12, -34.6], [10, -44.5], [10, -42.1], [12, -38], [6.5, -37.4], [9.6, -32.4], [12.4, -44.5]];
  for (let n = 0; n < 3000 && rocks.length < 10; n++) {
    const x = -9 + rnd()*21, z = -44.5 + rnd()*11.5;
    if (avoid.some(([ax, az]) => Math.hypot(ax - x, az - z) < 2.7)) continue;
    if (rocks.some(r => Math.hypot(r.x - x, r.z - z) < 2.1)) continue;
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    const s = .8 + rnd()*.4, top = new THREE.Group(); g.add(top);
    mesh(G.ico, 0x8d9096, [.85*s, .65*s, .75*s], [0, .45*s, 0], top);
    mesh(G.ico, 0xa3a6ab, [.45*s, .4*s, .45*s], [.4*s, .72*s, .2*s], top);
    mesh(G.ico, 0x7a7e84, [.35*s, .3*s, .3*s], [-.45*s, .3*s, -.2*s], top);
    const rubble = mesh(G.ico, 0x7d8086, [.38, .16, .3], [0, .08, 0], g); rubble.visible = false;
    rocks.push({x, z, g, top, rubble, s, item:'stone', logs:5, regrow:0, shake:0});
    circles.push({x, z, r:.6});
  }
}
const nodes = () => trees.concat(rocks);
function setNode(t, full) {
  if (t.item === 'stone') { t.top.visible = full; t.rubble.visible = !full; }
  else { t.top.visible = t.trunk.visible = full; t.stump.visible = !full; }
}
// a swing of the axe for trees, a pickaxe for rock
function chopTool(e, stone) {
  const key = stone ? 'pick' : 'axe';
  if (!e.tools) e.tools = {};
  if (!e.tools[key]) {
    const g = new THREE.Group(), hand = e.char.bones && e.char.bones.handR;
    // on the realistic bodies the tool goes in the hand itself, sized back up from the bone's scale
    if (hand) {
      // in the hand's own frame the fingers point along +y and index to pinky runs along -z: the handle passes through
      // the curled fingers along z, the head sits out past the index finger
      hand.updateWorldMatrix(true, false); const ws = hand.getWorldScale(new THREE.Vector3()).x / (e.char.g.getWorldScale(new THREE.Vector3()).x || 1); g.scale.setScalar(1/ws);
      mesh(G.cyl, 0x6b4526, [.022, .72, .022], [.01, .075, .2], g).rotation.x = Math.PI/2;
      if (stone) mesh(G.box, 0x8a8f96, [.05, .4, .05], [.01, .075, .54], g, {metalness:.6});
      else { mesh(G.box, 0x9aa0a8, [.17, .035, .13], [.09, .075, .5], g, {metalness:.7, roughness:.3}); mesh(G.box, 0xdfe4ea, [.03, .04, .15], [.18, .075, .5], g, {metalness:.8, roughness:.2}); }
      hand.add(g); e.tools[key] = g; for (const k in e.tools) e.tools[k].visible = k === key; return;
    }
    g.position.set(0, -.48, .04); e.char.armR.add(g);
    mesh(G.cyl, 0x6b4526, [.025, .62, .025], [0, -.05, .18], g).rotation.x = Math.PI/2.4;
    if (stone) { const h = mesh(G.box, 0x8a8f96, [.04, .05, .42], [0, .1, .42], g, {metalness:.6}); h.rotation.x = .2; }
    else { mesh(G.box, 0x9aa0a8, [.04, .2, .16], [0, .02, .44], g, {metalness:.7, roughness:.3}); mesh(G.box, 0xdfe4ea, [.045, .2, .03], [0, .02, .53], g, {metalness:.8, roughness:.2}); }
    e.tools[key] = g;
  }
  for (const k in e.tools) e.tools[k].visible = k === key;
}
function poseChop(e, dt) {
  if (!(e.chopT > 0)) { if (e.tools) for (const k in e.tools) e.tools[k].visible = false; return; }
  if (e.char.armR !== e.toolArm) { e.tools = null; e.toolArm = e.char.armR; }
  chopTool(e, e.chopItem === 'stone');
  e.chopT -= dt;
  const u = 1 - Math.max(0, e.chopT) / e.chopDur, swing = u < .55 ? u/.55 : 1 - (u - .55)/.45;
  e.char.armR.rotation.x = -2.8 + Math.min(1, swing*1.1)*2.4; e.char.armL.rotation.x = e.char.armR.rotation.x + .15;
  e.yaw = Math.atan2(e.chopAt[0] - e.pos.x, e.chopAt[1] - e.pos.z); e.char.g.rotation.y = e.yaw;
  if (u > .5 && u < .58) e.char.g.position.y -= .03;
}
function harvest(t, e) {
  if (t.logs <= 0 || e.stack.length >= e.cap) return false;
  t.logs--; t.shake = .3;
  e.chopT = e.chopDur = e === player ? (t.item === 'stone' ? .4 : .32) : .45; e.chopAt = [t.x, t.z]; e.chopItem = t.item;
  qnAct(e.char, t.item === 'stone' ? 'mine' : 'chop', e.chopDur + .5);
  spawnItem(t.item, new THREE.Vector3(t.x, 1.2, t.z), e.stack);
  if (t.item === 'stone') snd(300 + R()*80, .05, 'square', .03); else snd(170 + R()*50, .06, 'square', .035);
  if (t.logs <= 0) { t.regrow = t.item === 'stone' ? 30 : 25; setNode(t, false); }
  return true;
}

