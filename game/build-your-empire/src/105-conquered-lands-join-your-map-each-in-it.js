// ------------------------------------------------------------------ conquered lands join your map, each in its own style
const STYLE_SPOTS = {
  austria:{n:'Ostberg', flag:'🏰', rect:{x0:-9, x1:14, z0:99, z1:110.5}, centre:[2.5, 104.5]},
  canada:{n:'the Northern Frontier', flag:'🌲', rect:{x0:34, x1:48.5, z0:98, z1:109.5}, centre:[41.2, 103.8]},
  mideast:{n:'Pirate cove', flag:'🕌', site:'cove'}, russia:{n:'The old empire', flag:'⛪', site:'empire'},
  brazil:{n:'Port Azul', flag:'⚓'}, china:{n:'Kumo', flag:'🏯'}, egypt:{n:'the Nile Kingdom', flag:'🐪'}, greece:{n:'Hellas', flag:'🏛️'},
  mexico:{n:'Aztlan', flag:'🌵'}, india:{n:'Rajpur', flag:'🐘'}, norway:{n:'the Sky Citadel', flag:'🛸'}};
// every rival's land: a rectangle round its town (the road runs through the ones on the roads)
for (const r of EMP.list) if (r.at && STYLE_SPOTS[r.style] && r.id !== 'ostberg') { const [x, z] = r.at; Object.assign(STYLE_SPOTS[r.style], {centre:[x, z], rect:{x0:x - 15, x1:x + 15, z0:z - 15, z1:z + 13}}); }
const DISTRICT = {built:{}, enter:{}, ferry:null, back:null};
function styleModel(name, h, ry = 0) {
  const src = MODELS.styles && MODELS.styles.getObjectByName(name); if (!src) return null;
  const m = src.clone(true); m.position.set(0, 0, 0); m.rotation.set(0, 0, 0);
  const bb = new THREE.Box3().setFromObject(m), s = h / (bb.max.y - bb.min.y), g = new THREE.Group(); m.position.y = -bb.min.y; g.add(m); g.scale.setScalar(s); g.rotation.y = ry;
  m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
const WALLS = {brazil:[0xf2c200, 0x3f9a6a, 0xf28a9a, 0x5aa8e0, 0xf4f4f4, 0xe0703a], austria:[0xf4efe4, 0xf8f0d0, 0xf4e0c8]};
function recolor(g, cols, i) { if (!cols) return; g.traverse(o => { if (o.isMesh) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((mt, k) => { if (/^wall/.test(mt.name)) { const c = mt.clone(); c.color.set(cols[i % cols.length]); if (Array.isArray(o.material)) o.material[k] = c; else o.material = c; } }); } }); }
// place a landmark, block its footprint and remember it
function plant(name, h, x, z, ry, style, i, list) {
  const g = styleModel(name, h, ry); if (!g) return null;
  g.position.set(x, 0, z); scene.add(g); recolor(g, WALLS[style], i); list.push(g);
  const bb = new THREE.Box3().setFromObject(g); boxes.push({x0:bb.min.x + .1, x1:bb.max.x - .1, z0:bb.min.z + .1, z1:bb.max.z - .1});
  return g;
}
const LAYOUT = {
  austria:[['baroqueChurch', 5.5, 2.5, 59.5, Math.PI], ['chalet', 3.2, -5.5, 54, Math.PI], ['chalet', 3.2, -1.6, 54, Math.PI], ['chalet', 3.2, 6.6, 54, Math.PI], ['chalet', 3.2, 10.4, 54, Math.PI], ['chalet', 3.2, -5.5, 60.4, 0], ['chalet', 3.2, 10.4, 60.4, 0]],
  canada:[['logCabin', 2.8, 17.5, 53, Math.PI], ['logCabin', 2.8, 21.5, 53, Math.PI], ['logCabin', 2.8, 25.5, 53, Math.PI], ['logCabin', 2.8, 19.5, 59.5, 0], ['logCabin', 2.8, 24, 59.5, 0], ['maple', 3.4, 16, 57, 0], ['maple', 3.4, 27.5, 56.5, 0]],
  mideast:[['mosque', 4.6, 0, -53.5, 0], ['souk', 2, -4.5, -56, 0], ['souk', 2, 4.5, -56, 0], ['souk', 2, -4.5, -52.5, 0], ['souk', 2, 4.5, -52.5, 0]],
  russia:[['onionChurch', 5.2, 0, -53.5, 0], ['kremlinTower', 6, -4.6, -56, 0], ['kremlinTower', 6, 4.6, -56, 0], ['kremlinWall', 1.8, -2.4, -57, 0], ['kremlinWall', 1.8, 2.4, -57, 0]],
  brazil:[['statue', 5.2, 0, -52.6, 0], ['colonial', 3, -4.4, -56, 0], ['colonial', 3, -1.4, -56, 0], ['colonial', 3, 1.6, -56, 0], ['colonial', 3, 4.6, -56, 0]],
  china:[['pagoda', 6.5, 0, -53.2, 0], ['paifang', 3, 0, -57.2, 0], ['chineseHouse', 2.4, -4.6, -55, 0], ['chineseHouse', 2.4, 4.6, -55, 0], ['chineseHouse', 2.4, -4.6, -51.8, 0], ['chineseHouse', 2.4, 4.6, -51.8, 0]]};
// [kit ('c' castles, 'n' new nations, 's' styles), model, height, dx, dz, faces +z?]
const TOWN_PLANS = {
  brazil:[['c', 'cTropic', 7, 0, -10, 1], ['s', 'colonial', 3, -9, -6, 1], ['s', 'colonial', 3, 9, -6, 1], ['s', 'colonial', 3, -8, 8, 0], ['s', 'colonial', 3, 8, 8, 0], ['c', 'stall', 2.2, -3.5, 5, 0], ['c', 'stall', 2.2, 3.5, 5, 0], ['c', 'stall', 2.2, 0, -5, 1]],
  china:[['c', 'cHimeji', 8, 0, -10, 1], ['s', 'chineseHouse', 2.4, -9, -6, 1], ['s', 'chineseHouse', 2.4, 9, -6, 1], ['s', 'chineseHouse', 2.4, -8, 8, 0], ['s', 'chineseHouse', 2.4, 8, 8, 0], ['c', 'stall', 2.2, -3.5, 5, 0], ['c', 'stall', 2.2, 3.5, 5, 0], ['c', 'stall', 2.2, 0, -5, 1]],
  egypt:[['n', 'cTempleEG', 7, 0, -10, 1], ['n', 'mudHouseEG', 2.6, -9, -6, 1], ['n', 'mudHouseEG', 2.6, 9, -6, 1], ['n', 'mudHouseEG', 2.6, -8, 8, 0], ['n', 'mudHouseEG', 2.6, 8, 8, 0], ['c', 'stall', 2.2, -3.5, 5, 0], ['c', 'stall', 2.2, 3.5, 5, 0], ['n', 'mudHouseEG', 2.6, 0, 9, 0]],
  greece:[['n', 'cTempleGR', 7, 0, -10, 1], ['n', 'whiteHouseGR', 3.2, -9, -6, 1], ['n', 'whiteHouseGR', 3.2, 9, -6, 1], ['n', 'whiteHouseGR', 3.2, -8, 8, 0], ['n', 'whiteHouseGR', 3.2, 8, 8, 0], ['c', 'stall', 2.2, -3.5, 5, 0], ['c', 'stall', 2.2, 3.5, 5, 0], ['n', 'whiteHouseGR', 3.2, 0, 9, 0]],
  mexico:[['n', 'cPyramidMX', 8, 0, -10, 1], ['n', 'adobeMX', 2.6, -9, -6, 1], ['n', 'adobeMX', 2.6, 9, -6, 1], ['n', 'adobeMX', 2.6, -8, 8, 0], ['n', 'adobeMX', 2.6, 8, 8, 0], ['c', 'stall', 2.2, -3.5, 5, 0], ['c', 'stall', 2.2, 3.5, 5, 0], ['n', 'adobeMX', 2.6, 0, 9, 0]],
  // island towns: the landmark in the middle, homes round it, stalls by the dock
  india:[['n', 'cMahalIN', 9, 0, -4, 1], ['n', 'haveliIN', 3.4, -10, 2, 1], ['n', 'haveliIN', 3.4, 10, 2, 1], ['n', 'haveliIN', 3.4, -8, 10, 0], ['n', 'haveliIN', 3.4, 8, 10, 0], ['c', 'stall', 2.2, -14, -4, 1], ['c', 'stall', 2.2, 14, -4, 1], ['n', 'haveliIN', 3.4, 0, 12, 0]],
  norway:[['n', 'cStaveNO', 7, 0, -4, 1], ['n', 'longhouseNO', 3, -10, 2, 1], ['n', 'longhouseNO', 3, 10, 2, 1], ['n', 'longhouseNO', 3, -8, 10, 0], ['n', 'longhouseNO', 3, 8, 10, 0], ['c', 'stall', 2.2, -14, -4, 1], ['c', 'stall', 2.2, 14, -4, 1], ['n', 'longhouseNO', 3, 0, 12, 0]]};
// every building of a style's town, placed in the world: {kit, name, h, x, z, south (faces +z)}
function layoutOf(style) {
  const S = STYLE_SPOTS[style];
  if (TOWN_PLANS[style] && S.centre) return TOWN_PLANS[style].map(([kit, name, h, dx, dz, south]) => ({kit, name, h, x:S.centre[0] + dx, z:S.centre[1] + dz, south:!!south}));
  const ox = S.site ? COAST.sites[S.site].x : 0;
  return (LAYOUT2[style] || []).map(([kit, name, h, x0, z]) => ({kit, name, h, x:x0 + ox, z, south:false}));
}
function kitModel(kit, name, h) {
  if (kit === 'n') { const src = MODELS.styles2 && MODELS.styles2.getObjectByName(name); if (!src) return null; const m = src.clone(true); m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); const bb = new THREE.Box3().setFromObject(m), g = new THREE.Group(); m.position.set(-(bb.min.x + bb.max.x)/2, -bb.min.y, -(bb.min.z + bb.max.z)/2); g.add(m); g.scale.setScalar(h / (bb.max.y - bb.min.y)); m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; }
  return kit === 'c' ? castleModel(name, h) : styleModel(name, h, 0);
}
const LAYOUT2 = {
  austria:[['c', 'cSpires', 7, 2.5, 106.6], ['s', 'chalet', 3.2, -6.5, 101.6], ['s', 'chalet', 3.2, 11.5, 101.6], ['s', 'chalet', 3.2, -6.5, 107.5], ['c', 'stall', 2.2, -2.2, 100.6], ['c', 'stall', 2.2, 7.4, 100.6], ['c', 'stall', 2.2, 10.8, 107.5]],
  canada:[['s', 'logCabin', 3, 38, 105.5], ['s', 'logCabin', 3, 44.5, 105.5], ['s', 'maple', 3.6, 36, 100.5], ['s', 'maple', 3.6, 47, 101], ['c', 'stall', 2.2, 41.2, 100.6], ['c', 'stall', 2.2, 41.2, 107.6]],
  mideast:[['c', 'cPalace', 6.5, 0, -72], ['s', 'souk', 2, -5.6, -70.5], ['c', 'stall', 2.2, 5.6, -71.4], ['c', 'stall', 2.2, -5.6, -74]],
  russia:[['s', 'onionChurch', 5.5, 0, -71.8], ['s', 'kremlinTower', 6, -5.4, -71], ['c', 'stall', 2.2, 5.4, -71.4], ['c', 'stall', 2.2, 5.4, -74.2]],
  brazil:[['c', 'cTropic', 7, 0, -72.2], ['s', 'colonial', 3, -5.6, -70.6], ['c', 'stall', 2.2, 5.6, -71.4], ['c', 'stall', 2.2, -5.6, -74.2]],
  china:[['c', 'cHimeji', 8, 0, -72], ['s', 'chineseHouse', 2.4, -5.6, -70.6], ['c', 'stall', 2.2, 5.6, -71.4], ['c', 'stall', 2.2, -5.6, -74.2]]};
const DSTYLE = {c2:'mideast', c4:'russia', c5:'canada', ...Object.fromEntries(EMP.list.map(r => ['r:' + r.id, r.style]))};
const DPARTS = {};   // style -> [{g, x, z, name, zone, stall}]
function castleModel(name, h) {
  const src = MODELS.castles && MODELS.castles.getObjectByName(name); if (!src) return null;
  const m = src.clone(true); m.position.set(0, 0, 0); m.rotation.set(0, 0, 0);
  const bb = new THREE.Box3().setFromObject(m), g = new THREE.Group(); m.position.y = -bb.min.y; g.add(m); g.scale.setScalar(h / (bb.max.y - bb.min.y));
  m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g;
}
// damage: darkened, leaning, smoking; repaired: as built
function setRuined(p, on) {
  p.g.rotation.z = on ? .06 * (p.x > 0 ? 1 : -1) : 0;
  p.g.traverse(o => { if (!o.isMesh) return; const ms = [].concat(o.material);
    const nm = ms.map(m => { if (on) { if (!m.userData.burnt) { const c = m.clone(); c.color.multiplyScalar(.42); c.userData.burnt = true; c.userData.orig = m; return c; } return m; } return m.userData.orig || m; });
    o.material = Array.isArray(o.material) ? nm : nm[0]; });
  if (on && !p.flame && typeof warFlame === 'function') p.flame = warFlame(p.x, .2, p.front + (p.fdir || -1)*.7, 1.2, 1e9);
  if (!on && p.flame) { p.flame.t = 0; p.flame = null; }
  if (on && !p.rubble) { p.rubble = new THREE.Group(); for (let i = 0; i < 5; i++) mesh(G.ico, 0x5a5650, [.35 + R()*.3, .25, .35 + R()*.3], [p.x + (R() - .5)*2.4, .1, p.front + (p.fdir || -1)*(.4 + R()*.6)], p.rubble); scene.add(p.rubble); }
  if (!on && p.rubble) { scene.remove(p.rubble); p.rubble = null; }
}
const fixCost = p => Math.round((p.name[0] === 'c' && p.name !== 'stall' ? 3 : 1) * (1200 + 350*W.era));
// the repair tile goes on open, walkable ground near the building: in front if there is room, else beside or behind it
function fixSpot(p) {
  const bb = new THREE.Box3().setFromObject(p.g), d = p.fdir || -1, w = (bb.max.x - bb.min.x)/2 + 1.1;
  const ok = (x, z) => AREAS.some(a => x - .7 >= a.x0 && x + .7 <= a.x1 && z - .7 >= a.z0 && z + .7 <= a.z1) && !boxes.some(b => x + .75 > b.x0 && x - .75 < b.x1 && z + .75 > b.z0 && z - .75 < b.z1) && !zones.some(q => q.active !== false && Math.abs(q.x - x) < 1.7 && Math.abs(q.z - z) < 1.7);
  const back = d > 0 ? bb.min.z : bb.max.z;
  for (const [x, z] of [[p.x, p.front + d*1.2], [p.x, p.front + d*2.2], [bb.min.x - 1.1, p.z], [bb.max.x + 1.1, p.z], [p.x - w, p.front + d*1.2], [p.x + w, p.front + d*1.2], [p.x, back - d*1.2]]) if (ok(x, z)) return [x, z];
  for (let r = 1.5; r <= 9; r += .75) for (let k = 0; k < 16; k++) { const a = k/16*Math.PI*2, x = p.x + Math.cos(a)*r, z = p.front + Math.sin(a)*r; if (ok(x, z)) return [x, z]; }   // spiral out to the nearest free ground
  return [p.x, p.front + d*1.2];
}
function fixZones(style) {
  const broken = (W.flags.dmg || {})[style] || [];
  for (const [i, p] of (DPARTS[style] || []).entries()) {
    const want = broken.includes(i);
    if (want && !p.zone) { const [fx, fz] = fixSpot(p); p.zone = addZone({kind:'fix', style, idx:i, x:fx, z:fz, w:1.5, d:1.5, icon:'🔨', tile:{}}); p.zone.key = ''; }
    if (!want && p.zone) { removeZone(p.zone); p.zone = null; }
    if (p.zone) { const paid = (W.flags.fixPaid || {})[style + i] || 0, cost = fixCost(p), key = paid + ':' + cost;
      if (p.zone.key !== key) { p.zone.key = key; drawTile(p.zone.tc.g, '🔨', {cost:cost - paid, cur:'💵', prog:paid/cost, title:'Repair'}); p.zone.tc.t.needsUpdate = true; } }
  }
}
function payFix(zn, e) {
  const p = DPARTS[zn.style][zn.idx], cost = fixCost(p), fp = (W.flags.fixPaid ||= {}), key = zn.style + zn.idx, paid = fp[key] || 0;
  if (W.coins <= 0) { e.tick = .3; return; }
  const amt = Math.min(cost - paid, W.coins, Math.max(1, Math.ceil(cost / 20)));
  W.coins -= amt; W.upSpent += amt; fp[key] = paid + amt; e.tick = .05; snd(500 + paid/cost*400, .03, 'square', .025);
  if (fp[key] >= cost) {
    delete fp[key]; W.flags.dmg[zn.style] = W.flags.dmg[zn.style].filter(i => i !== zn.idx); setRuined(p, false); puff(p.x, p.front);
    const k = Object.keys(DSTYLE).find(q => DSTYLE[q] === zn.style); if (k) land(k).loy = Math.min(100, land(k).loy + 8);
    banner(p.stall ? '🛒 A market stall reopens' : '🔨 Rebuilt', p.stall ? 'Trade is back: the stall pays you, and the people cheer up.' : 'The people see you rebuilding. Their morale rises.');
    save();
  }
  fixZones(zn.style);
}
// open stalls pay, and every ruin still standing weighs on the people
let stallT = 30;
function updMarkets(dt) {
  if (!started || (stallT -= dt) > 0) return; stallT = 30;
  let pay = 0; const dmg = W.flags.dmg || {};
  for (const [style, parts] of Object.entries(DPARTS)) parts.forEach((p, i) => { if (p.stall && !(dmg[style] || []).includes(i)) pay += 150 + 40*W.era; });
  if (pay && CASH.spoils) addCash(CASH.spoils, pay, {x:12.3, z:72.8});
  for (const [style, parts] of Object.entries(DPARTS)) for (const i of (dmg[style] || [])) if (R() < .6) { const p = parts[i]; if (p) for (let k = 0; k < 4; k++) particle(0x555555, new THREE.Vector3(p.x + (R() - .5)*2, 2 + R()*2, p.front - (p.fdir || -1)*1), new THREE.Vector3(0, 1.6, 0), 2.2, .5, {grow:.8, op:.55}); }
}
function buildDistrict(style, anim) {
  if (DISTRICT.built[style] || !MODELS.styles) return;
  const S = STYLE_SPOTS[style], list = DISTRICT.built[style] = [];
  let ox = 0, rect = S.rect;
  if (S.site) {
    // coastal lands: the old fort comes down and the town grows behind the beach
    const f = coastFort(S.site); f.g.visible = false; ox = COAST.sites[S.site].x;
    rect = {x0:ox - 7.5, x1:ox + 7.5, z0:-79.6, z1:-68.5};
    clearForest({x0:rect.x0, x1:rect.x1, z0:-80, z1:-68});
    slab(0xd8c49a, 15, 6, ox, -72, .004);
    DISTRICT.ferryBack ||= addZone({kind:'ferry', back:true, x:-9, z:-77.2, icon:'⛵', tile:{alpha:1, size:84, label:'Sail home', fill:'rgba(30,90,140,.65)'}});
    AREAS.push({x0:-65, x1:100, z0:-79.6, z1:-75.9});
    if (!DISTRICT.sandbar) { DISTRICT.sandbar = true; for (let i = 0; i < 17; i++) mesh(G.box, i % 2 ? 0x9a6b40 : 0x8a5d36, [.55, .12, 2.2], [-19.6 + i*.56, -.1, -89.7], scene); }
  } else {
    clearForest({x0:rect.x0 - 1, x1:rect.x1 + 1, z0:rect.z0 - 1, z1:rect.z1 + 1});
    slab(style === 'austria' ? 0xc8c0b0 : 0xa89a78, rect.x1 - rect.x0, rect.z1 - rect.z0, (rect.x0 + rect.x1)/2, (rect.z0 + rect.z1)/2, .004);
    // the road south across the old battlefield (to the southern lands)
    if (style === 'austria' || style === 'canada') { AREAS.push({x0:-6, x1:12, z0:78.4, z1:96.8}, {x0:1.5, x1:4.5, z0:96.5, z1:99.5}); slab(0xb98f5c, 3, 3.2, 3, 98, .006); }
    if (style === 'austria' && EV.rivalG) { scene.remove(EV.rivalG); EV.rivalG = null; EV.noRival = true; }
  }
  AREAS.push(rect);
  // one great castle, a market and homes; everything faces the way you arrive (-z)
  const parts = DPARTS[style] = [];
  if (MODELS.castles) for (const p of layoutOf(style)) {
    const {x, z, name, kit} = p, g = kitModel(kit, name, p.h); if (!g) continue;
    g.rotation.y = p.south ? 0 : Math.PI; g.position.set(x, 0, z); scene.add(g); if (kit === 's') recolor(g, WALLS[style], parts.length); list.push(g);
    const bb = new THREE.Box3().setFromObject(g); boxes.push({x0:bb.min.x + .15, x1:bb.max.x - .15, z0:bb.min.z + .15, z1:bb.max.z - .15});
    parts.push({g, x, z, name, front:p.south ? bb.max.z : bb.min.z, fdir:p.south ? 1 : -1, stall:name === 'stall'});   // the facade, and the side it faces if (anim) { g.userData.lvScale = g.scale.x; popIn(g); }   // pop up to the model's own size
  } else LAYOUT[style].forEach(([name, h, x, z, ry], i) => { const g = plant(name, h, x + ox, z, ry, style, i, list); if (g && anim) popIn(g); });
  // taken by war: the town is damaged when you first take it (older saves count as already rebuilt)
  const dmg = (W.flags.dmg ||= {});
  if (!(style in dmg)) dmg[style] = anim ? parts.map((_, i) => i) : [];
  for (const i of dmg[style]) if (parts[i]) setRuined(parts[i], true);
  fixZones(style);
  // your flags over the new province
  for (const [x, z] of [[rect.x0 + 1, rect.z1 - 1], [rect.x1 - 1, rect.z1 - 1]]) { mesh(G.cyl, 0x5e3f22, [.05, 3, .05], [x, 1.5, z], scene); mesh(G.box, 0xf2c200, [.9, .55, .03], [x + .46, 2.7, z], scene); }
  if (anim) banner(`${S.flag} ${S.n} joins your map!`, S.site ? 'Take the ferry from the harbour to walk its streets.' : style === 'austria' || style === 'canada' ? 'Walk south across the old battlefield to visit.' : 'Its streets are yours now. Repair the war damage to win the people over.');
}
function styleFor(r) { return r.style; }
function updLand() {
  for (const [id, rg] of Object.entries(REGIONS)) {
    if (LAND.open.has(id) || !regionOpen(id)) continue; LAND.open.add(id);
    const r = rg.rect, north = id === 'north' || id === 'downtown' || id === 'ranch';   // no climbing into the northern cliffs
    const L = {x0:r.x0 - 8, x1:r.x1 + 8, z0:north ? r.z0 : r.z0 - 8, z1:r.z1 + 8};
    LAND.rects.push(L); AREAS.push(L); clearForest({x0:L.x0, x1:L.x1, z0:L.z0, z1:L.z1});
  }
}
