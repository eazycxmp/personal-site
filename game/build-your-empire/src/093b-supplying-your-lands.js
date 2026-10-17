// ------------------------------------------------------------------ supplying your lands: food goes out, tribute and shoppers pay back
// Every land you own has a size, from a hunters' camp to a capital. It asks for food that fits its size: a tribe's camp
// lives on grilled fish and steak like hunter-gatherers, a town wants bread, beer and burgers, a capital sushi, pizza and
// ice cream. Food left at the supply depot rides out by caravan. A land that is kept fed pays tribute by its size, its
// people shop (you see them in the streets when you are there), and it can be grown into the next size up. A land left
// hungry stops paying. Until the depot is built the old tribute carries on as it was.
const LAND_TIERS = [
  {n:'Camp', icon:'⛺', wants:['grilled', 'steak'], need:4, mult:1, folk:3, spend:5},
  {n:'Village', icon:'🏘️', wants:['grilled', 'steak', 'bread'], need:8, mult:1.8, folk:6, spend:8},
  {n:'Town', icon:'🏙️', wants:['bread', 'beer', 'roast'], need:12, mult:3, folk:10, spend:13},
  {n:'City', icon:'🌆', wants:['roast', 'pizza', 'beer', 'icecream'], need:16, mult:5, folk:16, spend:20},
  {n:'Capital', icon:'👑', wants:['sushi', 'pizza', 'icecream'], need:20, mult:8, folk:24, spend:30},
];
const ALL_WANTS = [...new Set(LAND_TIERS.flatMap(t => t.wants))];
const SUP = {zone:null, g:null, trips:[], shipT:6, eatT:60, folk:{}, homes:{}, look:1};
const DEPOT_AT = [22.4, -6.4], DEPOT_HOUSE = [22.4, -11.6];
const supplyOn = () => W.unlocked.has('supplyDepot');
// where each land starts: tribes and outposts small, the old empire and the rival cities as towns, the sky citadel a city
const landBaseTier = k => k[0] === 'r' ? (k === 'r:nordheim' ? 3 : 2) : [0, 1, 1, 0, 2, 1, 2][+k.slice(1)] ?? 1;
function landSup(k) { const L = land(k); L.tier ??= landBaseTier(k); L.fed ??= .5; L.stock ||= {}; return L; }
function landAt(k) {
  if (k[0] === 'c') return campPlace(+k.slice(1)) || [3, 100];
  const r = EMP.list.find(q => 'r:' + q.id === k); return r ? r.at : [0, 0];
}
// how much of its pay a land keeps up: nothing when hungry, all of it when well fed (and as before, no depot yet)
const fedFactor = L => !supplyOn() ? 1 : L.fed < .25 ? 0 : .4 + .6*L.fed;
const tierOfLand = k => LAND_TIERS[landSup(k).tier];
// its shoppers' spending a minute: more people and bigger purses as it grows, more as the ages go by
const shopRate = k => { const L = landSup(k), T = LAND_TIERS[L.tier]; return L.lost ? 0 : Math.round(T.folk*T.spend*(1 + .25*W.era)*fedFactor(L)); };
const landUpCost = L => Math.round(5000*Math.pow(3, L.tier)*(1 + .1*W.era));
const canGrow = k => { const L = landSup(k); return supplyOn() && !L.lost && L.tier < LAND_TIERS.length - 1 && L.fed >= .7; };
function growLand(k) {
  const L = landSup(k), cost = landUpCost(L);
  if (!canGrow(k) || W.coins < cost) return;
  spend(cost); L.tier++; L.fed = .5;
  // rebuilt round it with more homes, and new people, the next time you are there
  if (SUP.homes[k]) { scene.remove(SUP.homes[k].g); SUP.homes[k] = null; }
  for (const e of SUP.folk[k] || []) { scene.remove(e.char.g); stacks.delete(e.stack); const i = ENTS.indexOf(e); if (i >= 0) ENTS.splice(i, 1); }
  SUP.folk[k] = null;
  const T = LAND_TIERS[L.tier];
  banner(`${T.icon} ${landName(k)} grows into a ${T.n.toLowerCase()}!`, `More people, more shoppers and ${T.mult}× the tribute. Now it wants ${T.wants.map(w => ITEM[w].icon).join(' ')}.`);
  snd(660, .2, 'triangle', .05, 1.2); save();
}
// the depot: food dropped here (by you or the supply clerk) waits for the next caravan
function depotTile() { const d = W.flags.depot || {}, n = ALL_WANTS.reduce((a, t) => a + (d[t] || 0), 0); return {alpha:1, size:84, label:n ? `${n} packed` : 'Food for your lands', fill:'rgba(140,100,40,.6)'}; }
function depotAct(e, zn) {
  const lands = landKeys().filter(k => !land(k).lost), want = new Set(lands.flatMap(k => tierOfLand(k).wants));
  const it = e.stack.items.find(q => want.has(q.type)); if (!it) { e.tick = .25; return; }
  e.stack.items.splice(e.stack.items.indexOf(it), 1); flyAway(it.mesh, new THREE.Vector3(zn.x, .6, zn.z), .2); e.tick = .08;
  const d = W.flags.depot ||= {}; d[it.type] = (d[it.type] || 0) + 1;
  if (e.isPlayer) dropSnd();
  if (R() < .3) { drawTile(zn.tc.g, '📦', depotTile()); zn.tc.t.needsUpdate = true; }
}
function supplyDepot(anim) {
  if (SUP.g) return;
  const g = SUP.g = new THREE.Group(); g.position.set(DEPOT_HOUSE[0], 0, DEPOT_HOUSE[1]); scene.add(g);
  // a timber warehouse with a loading dock, crates stacked out front and a wagon waiting
  mesh(G.box, 0x8a6a42, [5.2, 2.6, 3.2], [0, 1.3, 0], g); mesh(G.roof || G.box, 0x6a3a22, [5.6, 1.1, 3.6], [0, 3.1, 0], g);
  mesh(G.box, 0x5a4a3a, [5.4, .4, 1.4], [0, .2, 2.2], g); mesh(G.box, 0x2a2018, [1.8, 1.8, .1], [0, 1, 1.62], g);
  for (const [x, z, s] of [[-2.1, 2.4, .6], [-1.4, 2.5, .55], [-1.75, 2.45, .5], [2, 2.4, .6]]) mesh(G.box, 0xb08a5a, [s, s, s], [x, .4 + s/2, z], g);
  boxes.push({x0:DEPOT_HOUSE[0] - 2.7, x1:DEPOT_HOUSE[0] + 2.7, z0:DEPOT_HOUSE[1] - 1.7, z1:DEPOT_HOUSE[1] + 1.7});
  SUP.zone = addZone({kind:'depot', x:DEPOT_AT[0], z:DEPOT_AT[1], icon:'📦', tile:depotTile()});
  if (anim) { popIn(g); banner('📦 Supply depot!', 'Bring food here and caravans carry it to your lands. Fed lands pay more, and can grow.'); }
}
// a caravan: a cart (a truck in the motor age) heading off toward the land, with the goods counted in when it gets there
function caravanMesh() {
  const g = new THREE.Group(), motor = W.era >= 6;
  if (motor) { mesh(G.box, 0xd9d4c8, [1.1, 1, 1.9], [0, .9, -.3], g); mesh(G.box, 0x3f7cc0, [1.1, .9, .8], [0, .8, .9], g); }
  else { mesh(G.box, 0x8a6a42, [1, .5, 1.6], [0, .6, -.2], g); mesh(G.box, 0xe8e0d0, [1, .7, 1.4], [0, 1.15, -.2], g); mesh(G.box, 0x6a4a2a, [.45, .9, 1], [0, .75, 1.1], g); }
  for (const [x, z] of [[-.55, -.8], [.55, -.8], [-.55, .5], [.55, .5]]) mesh(G.cyl, 0x2a2a2a, [.35, .12, .35], [x, .35, z], g).rotation.z = Math.PI/2;
  g.traverse(o => { o.userData.noBake = true; });
  scene.add(g); return g;
}
function shipFood() {
  const d = W.flags.depot || {}, lands = landKeys().filter(k => !land(k).lost).map(k => [k, landSup(k)]);
  // the hungriest land first, among those that want something in the depot
  lands.sort((a, b) => a[1].fed - b[1].fed);
  for (const [k, L] of lands) {
    const T = LAND_TIERS[L.tier], per = T.need / T.wants.length, goods = {}; let n = 0;
    for (const t of T.wants) { const want = Math.max(0, Math.ceil(per*2 - (L.stock[t] || 0))), take = Math.min(want, d[t] || 0, 12 - n); if (take > 0) { goods[t] = take; d[t] -= take; n += take; } }
    if (!n) continue;
    const [tx, tz] = landAt(k), dist = Math.hypot(tx - DEPOT_AT[0], tz - DEPOT_AT[1]);
    SUP.trips.push({k, goods, t:0, dur:Math.max(8, dist/7), from:[DEPOT_AT[0], DEPOT_AT[1] + 2], to:[tx, tz], g:caravanMesh()});
    if (SUP.zone) { drawTile(SUP.zone.tc.g, '📦', depotTile()); SUP.zone.tc.t.needsUpdate = true; }
    return;
  }
}
function updSupply(dt) {
  if (!started) return;
  if (supplyOn() && !SUP.g) supplyDepot(false);
  const keys = landKeys();
  if (supplyOn() && (SUP.shipT -= dt) <= 0) { SUP.shipT = 10; shipFood(); }
  for (let i = SUP.trips.length - 1; i >= 0; i--) {
    const c = SUP.trips[i]; c.t += dt; const f = Math.min(1, c.t / c.dur), x = c.from[0] + (c.to[0] - c.from[0])*f, z = c.from[1] + (c.to[1] - c.from[1])*f;
    // the cart rolls out along the way and is lost to sight in the distance (it still gets there)
    c.g.position.set(x, elevAt(x, z), z); c.g.rotation.y = Math.atan2(c.to[0] - c.from[0], c.to[1] - c.from[1]); c.g.visible = c.t*7 < 70 || f > .9;
    if (f >= 1) { const L = landSup(c.k); for (const [t, n] of Object.entries(c.goods)) L.stock[t] = (L.stock[t] || 0) + n; scene.remove(c.g); SUP.trips.splice(i, 1); }
  }
  // once a minute each land eats from what it has; how much of its need was met sets how well fed it is
  if ((SUP.eatT -= dt) <= 0) {
    SUP.eatT = 60;
    if (supplyOn()) for (const k of keys) {
      const L = landSup(k); if (L.lost) continue;
      const T = LAND_TIERS[L.tier], per = T.need / T.wants.length; let got = 0;
      for (const t of T.wants) { const take = Math.min(L.stock[t] || 0, per); L.stock[t] = (L.stock[t] || 0) - take; got += take; }
      L.fed = clamp(L.fed*.5 + (got / T.need)*.5, 0, 1);
    }
  }
  updLandFolk(dt, keys);
}
// ---- the people of your lands: when you are there you see them walk to the market and spend
const FOLK_NEAR = 70;
// a spot is free when no building, pen or water is there (the zoo's park counts as taken)
function freeSpot(x, z, r) {
  if (isWater(x, z) || (x > ZOOPARK.x0 - 2 && x < ZOOPARK.x1 + 2 && z > ZOOPARK.z0 - 2 && z < ZOOPARK.z1 + 2)) return false;
  return !boxes.some(b => x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r);
}
function landHomes(k) {
  // homes round the land's middle, more as it grows, each on open ground clear of what is already there
  if (SUP.homes[k]) return SUP.homes[k];
  const L = landSup(k), [cx, cz] = landAt(k), n = 3 + 3*L.tier, g = new THREE.Group(); scene.add(g);
  const spots = [], taken = [];
  const clear = (x, z, r) => freeSpot(x, z, r) && taken.every(([tx, tz]) => Math.hypot(tx - x, tz - z) > r*2);
  for (let i = 0, tries = 0; spots.length < n && tries < 120; tries++, i++) {
    const a = i*2.399 + .3, rr = 17 + (tries % 4)*2.5, x = cx + Math.cos(a)*rr, z = cz + Math.sin(a)*rr;
    if (!clear(x, z, 2.2)) continue;
    taken.push([x, z]);
    const h = new THREE.Group(); h.position.set(x, elevAt(x, z), z); h.rotation.y = -a + Math.PI/2; g.add(h);
    const wall = [0xd8c8a8, 0xc8a878, 0xe8dcc8, 0xb88a5a][spots.length % 4], s = 1 + .15*Math.min(3, L.tier);
    if (L.tier === 0) mesh(G.cone || G.box, 0x8a6a42, [1.4, 1.8, 1.4], [0, .9, 0], h);           // tents and huts at first
    else { mesh(G.box, wall, [2*s, 1.6*s, 1.8*s], [0, .8*s, 0], h); mesh(G.cone4 || G.box, 0x8a3a2a, [1.7*s, .9*s, 1.6*s], [0, 1.6*s + .45*s, 0], h).rotation.y = Math.PI/4; }
    spots.push([x - Math.cos(a)*2.2, z - Math.sin(a)*2.2]);
  }
  if (!spots.length) spots.push([cx, cz + 6]);
  // the market: a few stalls on open ground near the middle, where the shoppers spend
  const mk = [];
  for (let i = 0, tries = 0; mk.length < 2 + Math.min(3, L.tier) && tries < 80; tries++, i++) {
    const a = i*2.399 + 1.1, rr = 7 + (tries % 5)*2, x = cx + Math.cos(a)*rr, z = cz + Math.sin(a)*rr;
    if (!clear(x, z, 1.6)) continue;
    taken.push([x, z]);
    const st = new THREE.Group(); st.position.set(x, elevAt(x, z), z); st.rotation.y = -a + Math.PI/2; g.add(st);
    mesh(G.box, 0x8a6a42, [1.6, .9, .9], [0, .45, 0], st); mesh(G.box, [0xd9443a, 0x3f7cc0, 0xf2a21a, 0x3f9a6a][mk.length % 4], [1.9, .12, 1.2], [0, 1.9, 0], st);
    for (const sx of [-.8, .8]) mesh(G.cyl, 0x5a4a3a, [.06, 1.9, .06], [sx, .95, -.4], st);
    mk.push([x - Math.cos(a)*1.2, z - Math.sin(a)*1.2]);
  }
  if (!mk.length) mk.push([cx, cz]);
  return SUP.homes[k] = {g, spots, mk};
}
function folkPurchase(k, e, at) {
  const L = landSup(k), T = LAND_TIERS[L.tier];
  // a shopper's spend is their share of the land's spending (paid with the tribute): this shows where it comes from
  const amt = Math.max(1, Math.round(shopRate(k) / Math.max(1, T.folk) / 3));
  if (fedFactor(L) > 0) popText(`+${amt}`, new THREE.Vector3(at[0], 2.4, at[1]), '#ffe06b');
  qnAct(e.char, 'pick', .8);
}
function updLandFolk(dt, keys) {
  for (const k of keys) {
    const L = landSup(k), [cx, cz] = landAt(k), near = !L.lost && Math.hypot(player.pos.x - cx, player.pos.z - cz) < FOLK_NEAR;
    let F = SUP.folk[k];
    if (near && !F) {
      const H = landHomes(k), n = Math.min(10, LAND_TIERS[L.tier].folk);
      F = SUP.folk[k] = [];
      for (let i = 0; i < n; i++) { const [x, z] = H.spots[i % H.spots.length], e = entity({civ:true}, x, z, 2.2, 0); e.home = [x, z]; e.go = H.mk[i % H.mk.length]; e.wait = R()*4; F.push(e); }
    } else if (!near && F && Math.hypot(player.pos.x - cx, player.pos.z - cz) > FOLK_NEAR + 20) {
      for (const e of F) { scene.remove(e.char.g); stacks.delete(e.stack); const i = ENTS.indexOf(e); if (i >= 0) ENTS.splice(i, 1); }
      SUP.folk[k] = null; F = null;
    }
    if (!F) continue;
    const H = landHomes(k);
    for (const e of F) {
      if ((e.wait -= dt) > 0) { e.vel.set(0, 0, 0); animEntity(e, dt); continue; }
      if (march(e, e.go[0], e.go[1], dt, 2.2)) {
        // at a stall: buy, then head home (or to another stall)
        if (H.mk.some(m => m === e.go)) { folkPurchase(k, e, e.go); e.go = R() < .4 ? H.mk[R()*H.mk.length|0] : e.home; }
        else e.go = H.mk[R()*H.mk.length|0];
        e.wait = 1.5 + R()*3;
      }
      animEntity(e, dt); e.char.g.rotation.y = e.yaw;
    }
  }
}
// the shoppers' spending, paid along with the tribute every 12 seconds
const shopIncome = () => landKeys().reduce((a, k) => a + shopRate(k), 0) / 5;
// one land's line in the empire panel: its size, how fed it is, what it wants and the button to grow it
function landSupplyHTML(k) {
  const L = landSup(k); if (L.lost) return '';
  const T = LAND_TIERS[L.tier], cost = landUpCost(L), next = LAND_TIERS[L.tier + 1];
  const wants = T.wants.map(t => `${ITEM[t].icon}${Math.floor(L.stock[t] || 0)}`).join(' ');
  return `<small style="display:block">${T.icon} ${T.n} · wants ${wants} · 🛍️ ${shopRate(k).toLocaleString()}/min</small>
    ${supplyOn() ? `<div class="rel" title="fed"><i style="width:${Math.round(L.fed*100)}%;background:#7ac35a"></i></div>` : '<small><em>Build the 📦 supply depot to feed them</em></small>'}
    ${next ? `<button data-up="${k}" ${!canGrow(k) || W.coins < cost ? 'disabled' : ''}>${next.icon} Grow to ${next.n.toLowerCase()} · ${cost.toLocaleString()} 💵${supplyOn() && L.fed < .7 ? ' (feed them first)' : ''}</button>` : ''}`;
}
// the clerk's next pick-up: the station making what your lands want most (leaving a little for the camp's own tables)
function clerkSrc() {
  if (!SUP.zone) return [];
  const d = W.flags.depot || {}, need = {};
  for (const k of landKeys()) { const L = landSup(k); if (L.lost) continue; for (const t of LAND_TIERS[L.tier].wants) need[t] = (need[t] || 0) + 1; }
  return zones.filter(z => z.kind === 'out' && ST[z.st] && need[ST[z.st].out] && z.stack.length >= 3 && (d[ST[z.st].out] || 0) < 30)
    .sort((a, b) => need[ST[b.st].out] - need[ST[a.st].out] || b.stack.length - a.stack.length).slice(0, 1);
}
