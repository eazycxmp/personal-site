// ------------------------------------------------------------------ each land's own depot and market
// The caravans from home unload at a depot in each land; from there the land's market hands the food out to the people
// who live there. The market has to be built on the spot: travel to the land and stand on its 🧺 tile. Until then only
// a trickle reaches the people by themselves, so a land without its market stays half fed (and pays that way).
const LMK = {at:{}, depot:{}, hall:{}, zone:{}, chk:0, told:{}};
const landMarketCost = k => Math.round(4000*(1 + landSup(k).tier)*(1 + .15*W.era));
const hasLandMarket = k => !!land(k).market;
// two free spots near the land's middle (walkable if the land has walkable ground there): the depot and the market
function landMarketSpots(k) {
  if (LMK.at[k]) return LMK.at[k];
  // on ground you can walk to (the land's own walkable ground), clear of buildings, tiles and each other
  const [cx, cz] = landAt(k), walk = (x, z) => AREAS.some(a => x - 1.4 >= a.x0 && x + 1.4 <= a.x1 && z - 1.4 >= a.z0 && z + 1.4 <= a.z1);
  const ok = (x, z, taken) => freeSpot(x, z, 1.8) && walk(x, z) && !zones.some(q => Math.hypot(q.x - x, q.z - z) < 2.6) && !taken.some(([tx, tz]) => Math.hypot(tx - x, tz - z) < 5.5);
  const found = [];
  for (let r = 5; r <= 40 && found.length < 2; r += 1.5) for (let i = 0; i < 24 && found.length < 2; i++) { const a = i/24*Math.PI*2 + r, x = cx + Math.cos(a)*r, z = cz + Math.sin(a)*r; if (ok(x, z, found)) found.push([x, z]); }
  if (found.length < 2) return null;   // nowhere yet (its land not laid out): try again later
  return LMK.at[k] = found;
}
function landDepotFx(k) {
  const [[x, z]] = landMarketSpots(k), g = new THREE.Group(); g.position.set(x, elevAt(x, z), z); scene.add(g);
  mesh(G.box, 0x8a6a42, [3, 1.8, 2.2], [0, .9, 0], g); mesh(G.box, 0x6a3a22, [3.3, .3, 2.5], [0, 1.95, 0], g);
  mesh(G.box, 0x2a2018, [1.1, 1.2, .08], [0, .6, 1.12], g);
  for (const [px, pz, s] of [[-1.2, 1.5, .5], [-.7, 1.6, .45], [1.2, 1.5, .5]]) mesh(G.box, 0xb08a5a, [s, s, s], [px, s/2, pz], g);
  const sign = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('DEPOT', '#3a2a1a', '#ffe9a8'), toneMapped:false})); sign.scale.set(1.8, .45, 1); sign.position.set(0, 2.4, 1.14); g.add(sign);
  boxes.push({x0:x - 1.6, x1:x + 1.6, z0:z - 1.2, z1:z + 1.2});
  LMK.depot[k] = g;
}
function landMarketFx(k, anim) {
  const [, [x, z]] = landMarketSpots(k), g = new THREE.Group(); g.position.set(x, elevAt(x, z), z); scene.add(g);
  mesh(G.box, 0xa88a62, [4, .2, 2.6], [0, .1, 0], g);
  for (const [px, pz] of [[-1.8, -1.1], [1.8, -1.1], [-1.8, 1.1], [1.8, 1.1]]) mesh(G.cyl, 0x6b4526, [.08, 2.1, .08], [px, 1.1, pz], g);
  [0xd9443a, 0x3f9a5a, 0xf2a21a].forEach((c, i) => mesh(G.box, i % 2 ? 0xfdf6ee : c, [1.3, .08, 2.5], [-1.3 + i*1.3, 2.2, 0], g).rotation.z = (i - 1)*.08);
  for (let i = 0; i < 3; i++) { const sx = -1.3 + i*1.3; mesh(G.box, 0x8a6a42, [1.05, .65, .6], [sx, .52, .65], g); for (let n = 0; n < 4; n++) mesh(G.sph, [0xd9443a, 0xf2c200, 0x7ac043, 0xe07a2a][(i + n) % 4], [.12, .12, .12], [sx - .3 + n*.2, .9, .65], g); }
  const sign = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('MARKET', '#3a2a1a', '#ffe9a8'), toneMapped:false})); sign.scale.set(2.2, .45, 1); sign.position.set(0, 2.65, 1.32); g.add(sign);
  boxes.push({x0:x - 2, x1:x + 2, z0:z - 1.3, z1:z + 1.3});
  LMK.hall[k] = g;
  if (anim) { popIn(g); banner(`🧺 ${landName(k)} has its market!`, 'Food from its depot now reaches everyone who lives there: well fed, the land pays in full and can grow.'); }
}
function landMarketTile(k) {
  const paid = (W.flags.lmPaid || {})[k] || 0, cost = landMarketCost(k);
  return {cost:cost - paid, cur:'💵', prog:paid/cost, title:'Market'};
}
function payLandMarket(zn, e) {
  const k = zn.land, cost = landMarketCost(k), fp = (W.flags.lmPaid ||= {}), paid = fp[k] || 0;
  if (W.coins <= 0) { e.tick = .3; return; }
  const amt = Math.min(cost - paid, W.coins, Math.max(1, Math.ceil(cost/20)));
  W.coins -= amt; W.upSpent += amt; fp[k] = paid + amt; e.tick = .05; snd(500 + paid/cost*400, .03, 'square', .025);
  if (fp[k] >= cost) { delete fp[k]; land(k).market = true; removeZone(zn); LMK.zone[k] = null; landMarketFx(k, true); save(); return; }
  drawTile(zn.tc.g, '🧺', landMarketTile(k)); zn.tc.t.needsUpdate = true;
}
function updLandMarkets(dt) {
  if (!started || !supplyOn() || (LMK.chk -= dt) > 0) return; LMK.chk = 1.5;
  for (const k of landKeys()) {
    const L = land(k);
    if (L.lost) { if (LMK.zone[k]) { removeZone(LMK.zone[k]); LMK.zone[k] = null; } continue; }
    if (!landMarketSpots(k)) continue;
    if (!LMK.depot[k]) landDepotFx(k);
    if (L.market) {
      if (!LMK.hall[k]) landMarketFx(k, false);
      // its people come to shop there too
      const H = SUP.homes[k]; if (H && H.mk && !H.lmk) { const [, [x, z]] = landMarketSpots(k); H.mk.push([x, z + 1.9]); H.lmk = true; }
      continue;
    }
    if (!LMK.zone[k]) { const [, [x, z]] = landMarketSpots(k); LMK.zone[k] = addZone({kind:'landMarket', land:k, x, z, w:1.6, d:1.6, icon:'🧺', tile:landMarketTile(k)}); }
    // the first time food is waiting there with nobody to hand it out, say so
    const stock = Object.values(landSup(k).stock).reduce((a, b) => a + b, 0);
    if (stock >= 4 && !LMK.told[k] && !(W.flags.lmTold || {})[k]) { LMK.told[k] = true; (W.flags.lmTold ||= {})[k] = true; note(`🧺 Food is waiting in ${landName(k)}`, 'Its depot has food but no market to hand it out. Travel there with 🧭 (islands by boat) and build its market on the 🧺 tile.'); }
  }
}
