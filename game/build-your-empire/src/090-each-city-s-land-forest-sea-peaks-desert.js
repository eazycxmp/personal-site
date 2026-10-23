// ------------------------------------------------------------------ each city's land: forest, sea, peaks, desert, jungle, beach, island, sky
const BIOME = {built:{}};
function biomeFx(r) {
  if (BIOME.built[r.id]) return; BIOME.built[r.id] = true;
  const b = CITY_BIOME[r.id], A = CITY_LAND[r.id], [cx, cz] = r.at, g = new THREE.Group(); scene.add(g); BIOME[r.id] = g;
  const o = new THREE.Object3D(), col = new THREE.Color(), lists = {cone:[], cyl:[], sph:[], box:[], ico:[]}, add = (k, x, y, z, sx, sy, sz, c, ry = 0) => lists[k].push([x, y, z, sx, sy, sz, c, ry]);
  const look = BIOME_LOOK[b], ring = (n, rIn, rOut, f) => { for (let k = 0; k < n; k++) { const a = hash01(k, cx)*Math.PI*2, d = rIn + hash01(cz, k)*(rOut - rIn); f(cx + Math.cos(a)*d, cz + 6 + Math.sin(a)*d, k); } };
  const outside = (x, z) => Object.values(CITY_LAND).every(Q => x < Q.x0 - 1 || x > Q.x1 + 1 || z < Q.z0 - 1 || z > Q.z1 + 1);
  const clearOf = (x, z) => !EMP.list.some(q => q.bf && Math.abs(x - q.bf[0]) < 13 && Math.abs(z - q.bf[1]) < 13) && !WORLD.roads.some(rd => x > rd.x0 - 2 && x < rd.x1 + 2 && z > rd.z0 - 2 && z < rd.z1 + 2);
  if (!r.sky && b !== 'ocean') { clearForest({x0:A.x0, x1:A.x1, z0:A.z0, z1:A.z1}); slab(look.ground, A.x1 - A.x0, A.z1 - A.z0, (A.x0 + A.x1)/2, (A.z0 + A.z1)/2, .002); }
  if (b === 'forest') ring(320, 40, 70, (x, z) => { if (outside(x, z) && clearOf(x, z) && z > 84 && Math.abs(x - 41) > 12) { const s = .9 + hash01(x, z)*.8; add('cyl', x, .7*s, z, .14*s, 1.4*s, .14*s, 0x5a3a22); add('cone', x, 2.3*s, z, .95*s, 2.6*s, .95*s, hash01(z, x) > .5 ? 0x24502a : 0x2f6a32); } });
  if (b === 'desert') {
    slab(look.ground, 90, 124, cx + 5, cz - 12, .001); clearForest({x0:cx - 40, x1:cx + 50, z0:cz - 74, z1:cz + 50});
    ring(46, 36, 60, (x, z) => { if (outside(x, z) && clearOf(x, z) && Math.abs(z - 1.9) > 13) add('sph', x, -.4, z, 4 + hash01(x, 1)*5, 1.6 + hash01(z, 2)*1.6, 3 + hash01(x, z)*4, 0xe4c890, hash01(z, x)*3); });
    for (const [px, pz, ps] of [[154, -54, 1], [172, -60, .7], [186, -50, .5]]) { const pm = mesh(G.cone4, 0xd8bc84, [11*ps, 10*ps, 11*ps], [px, 5*ps, pz], g); pm.rotation.y = Math.PI/4; boxes.push({x0:px - 7*ps, x1:px + 7*ps, z0:pz - 7*ps, z1:pz + 7*ps}); }
    for (const [ox, oz] of [[182.5, -30], [182.5, 34]]) { mesh(G.box, 0xe0c890, [.9, 7, .9], [ox, 3.5, oz], g); mesh(G.cone4, 0xf2c200, [.65, 1, .65], [ox, 7.5, oz], g).rotation.y = Math.PI/4; }
    const O = CITY_OASIS.nile; mesh(G.cyl, 0x2a8ac8, [5.5, .1, 5], [(O.x0 + O.x1)/2, .03, (O.z0 + O.z1)/2], g, {roughness:.05, metalness:.3});
    for (let k = 0; k < 9; k++) { const a = k/9*Math.PI*2; palm(g, (O.x0 + O.x1)/2 + Math.cos(a)*6.4, (O.z0 + O.z1)/2 + Math.sin(a)*6); }
  }
  if (b === 'mountain') {
    for (let k = 0; k < 44; k++) { const side = k % 2 ? 1 : -1, x = cx - 52 + hash01(k, 3)*72, z = side > 0 ? A.z1 + 7 + hash01(k, 5)*30 : A.z0 - 7 - hash01(k, 7)*30, h = 10 + hash01(k, 9)*22 + Math.abs(z - cz)*.15;
      if (!clearOf(x, z)) continue; add('cone', x, h/2, z, 7 + hash01(k, 11)*6, h, 7 + hash01(k, 13)*6, 0x7a7670, hash01(k, 15)*3); add('cone', x, h*.86, z, (7 + hash01(k, 11)*6)*.3, h*.3, (7 + hash01(k, 13)*6)*.3, 0xf2f6f8, hash01(k, 15)*3); }
    // terraced paddies stepping up toward the peaks
    for (let k = 0; k < 4; k++) for (const side of [-1, 1]) add('box', cx - 20, .2 + k*.45, (side > 0 ? A.z1 + 3 + k*2 : A.z0 - 3 - k*2), 40, .4 + k*.9, 2, k % 2 ? 0x7a9a4a : 0x8aaa58);
  }
  if (b === 'jungle') ring(380, 34, 66, (x, z) => { if (outside(x, z) && clearOf(x, z)) { const s = 1 + hash01(x, z)*.9; add('cyl', x, 1.1*s, z, .18*s, 2.2*s, .18*s, 0x4a3420); add('sph', x, 2.6*s, z, 1.5*s, 1*s, 1.5*s, hash01(z, x) > .5 ? 0x1e5a24 : 0x2a7a2e); } });
  if (b === 'beach') {
    slab(0xead8a2, 32, 96, 226, cz, .003); clearForest({x0:210, x1:242, z0:cz - 48, z1:cz + 48});
    for (let z = cz - 40; z <= cz + 40; z += 7) if (Math.abs(z - cz) > 3) palm(g, 214 + hash01(z, 1)*20, z);
    // a stone pier into the sea with fishing boats along it
    mesh(G.box, 0xd8d4cc, [14, .5, 2.4], [336, .05, cz + 22], g); for (let k = 0; k < 3; k++) { mesh(G.box, 0xf2f2f2, [2.6, .5, 1], [332 + k*4, -.05, cz + 24.2], g); mesh(G.cyl, 0x6b4526, [.05, 1.6, .05], [332 + k*4, .8, cz + 24.2], g); }
  }
  if (b === 'island') for (let k = 0; k < 26; k++) { const a = k/26*Math.PI*2; palm(g, 280 + Math.cos(a)*28, 50 + Math.sin(a)*28); }
  if (b === 'ocean') {
    // decks over the water under the civic centre and a boardwalk to the shore; a lighthouse at the outer edge
    const C0 = cityPlan(r).core; slab(0x7a5a3c, C0.x1 - C0.x0, C0.z1 - C0.z0, (C0.x0 + C0.x1)/2, (C0.z0 + C0.z1)/2, .05);
    slab(0x8a6a48, 3, -79.6 - C0.z1 + 1, cx, (C0.z1 - 79.6)/2, .05); AREAS.push({x0:cx - 1.5, x1:cx + 1.5, z0:C0.z1, z1:-68});
    mesh(G.cyl, 0xf4f4f4, [.9, 8, .9], [cx + 30, 4, cz - 30], g); for (let k = 0; k < 3; k++) mesh(G.cyl, 0xd0302a, [.92, .7, .92], [cx + 30, 1.5 + k*2.2, cz - 30], g); bulb(g, cx + 30, 8.4, cz - 30, 0xfff2a0, .35);
  }
  if (b === 'sky') {
    // the citadel's rock: a disc of stone with a jagged underside, crystal spires and smaller islands floating round it
    const Y = 24; mesh(G.cyl, 0x4a4e5a, [30, 1.4, 30], [cx, Y - .7, cz + 4], g); mesh(G.cone, 0x3a3640, [30, 16, 30], [cx, Y - 9.4, cz + 4], g).rotation.x = Math.PI;
    for (let k = 0; k < 7; k++) { const a = k/7*Math.PI*2, x = cx + Math.cos(a)*42, z = cz + 4 + Math.sin(a)*42, y = Y - 4 + hash01(k, 1)*8; mesh(G.cyl, 0x4a4e5a, [5, .8, 5], [x, y, z], g); mesh(G.cone, 0x3a3640, [5, 6, 5], [x, y - 3.4, z], g).rotation.x = Math.PI; mesh(G.cone, 0x8af0ff, [.6, 4, .6], [x, y + 2.4, z], g, {emissive:0x3ab0e8, emissiveIntensity:.8}); }
    for (let k = 0; k < 5; k++) { const a = k/5*Math.PI*2; mesh(G.cone, 0x9af4ff, [1.2, 14, 1.2], [cx + Math.cos(a)*6, Y + 7, cz + 4 + Math.sin(a)*6], g, {emissive:0x3ab0e8, emissiveIntensity:1, metalness:.4, roughness:.1}); }
    mesh(G.sph, 0x9af4ff, [4.5, 4.5, 4.5], [cx, Y + 4, cz + 4], g, {emissive:0x5ac8ff, emissiveIntensity:1.2, transparent:true, opacity:.75});
    const beam = new THREE.Mesh(G.cyl, new THREE.MeshBasicMaterial({color:0x8af0ff, transparent:true, opacity:.18, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false})); beam.scale.set(2.4, Y - 1, 2.4); beam.position.set(cx, (Y - 1)/2, cz + 4); g.add(beam);
    g.visible = false; BIOME.sky = g;
  }
  for (const [k, list] of Object.entries(lists)) {
    if (!list.length) continue;
    const im = new THREE.InstancedMesh(G[k], new THREE.MeshStandardMaterial({roughness:.9, flatShading:k === 'cone' || k === 'ico'}), list.length);
    list.forEach(([x, y, z, sx, sy, sz, c, ry], i) => { o.position.set(x, y, z); o.rotation.set(0, ry, 0); o.scale.set(sx, sy, sz); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, col.set(c)); });
    im.castShadow = true; im.receiveShadow = true; im.computeBoundingSphere(); g.add(im);
  }
}
// people in the streets of the city you are in, and carts bringing goods from the edge of town to the market
const CITYLIFE = {r:null, folk:[], carts:[], t:0};
function updCityLife(dt) {
  for (const C of Object.values(CITY)) for (const f of C.fleet || []) { f.g.position.y = -.26 + Math.sin(time*1.2 + f.ph)*.06; f.g.rotation.z = Math.sin(time*.9 + f.ph)*.03; }
  if ((CITYLIFE.t -= dt) <= 0) {
    CITYLIFE.t = 2;
    const near = EMP.list.find(r => CITY[r.id] && !r.sky && CITY[r.id].n > 0 && Math.hypot(wrapX(player.pos.x - r.at[0]), player.pos.z - r.at[1]) < 60) || null;
    if (near !== CITYLIFE.r) { for (const f of CITYLIFE.folk) scene.remove(f.c.g); for (const c of CITYLIFE.carts) scene.remove(c.g); CITYLIFE.folk = []; CITYLIFE.carts = []; CITYLIFE.r = near; }
  }
  const r = CITYLIFE.r; if (!r) return;
  const C = CITY[r.id], cells = C.plan.cells.slice(0, C.n); if (!cells.length) return;
  // walk along the streets: from a block corner to the next corner
  const corner = c => [c.x + (R() < .5 ? -1 : 1)*CELL/2, c.z + (R() < .5 ? -1 : 1)*CELL/2];
  if (CITYLIFE.folk.length < Math.min(14, 3 + C.n/3) && R() < dt*2) { const c = makeChar({civ:true}), [x, z] = corner(cells[R()*cells.length|0]); c.g.position.set(x, 0, z); CITYLIFE.folk.push({c, tx:x, tz:z, sp:1.1 + R()*.6, wait:0}); }
  for (const f of CITYLIFE.folk) {
    const c = f.c, p = c.g.position;
    if (f.wait > 0) { f.wait -= dt; c.legL.rotation.x = c.legR.rotation.x = 0; continue; }
    const dx = f.tx - p.x, dz = f.tz - p.z, dd = Math.hypot(dx, dz);
    if (dd < .12) { f.wait = R() < .3 ? 1 + R()*3 : 0; if (R() < .5) f.tx = p.x + (R() < .5 ? -1 : 1)*CELL; else f.tz = p.z + (R() < .5 ? -1 : 1)*CELL;
      if (!cells.some(q => Math.abs(q.x - f.tx) <= CELL/2 + .1 && Math.abs(q.z - f.tz) <= CELL/2 + .1)) { f.tx = p.x; f.tz = p.z; } continue; }
    const st = Math.min(dd, f.sp*dt); p.x += dx/dd*st; p.z += dz/dd*st; c.g.rotation.y = Math.atan2(dx, dz);
    const sw = Math.sin(time*8 + f.sp*10); c.legL.rotation.x = sw*.6; c.legR.rotation.x = -sw*.6; c.armL.rotation.x = -sw*.4; c.armR.rotation.x = sw*.4;
  }
  // carts (trucks, in the modern age) between the workshops and the market
  const ind = cells.filter(c => c.zone === 'ind'), com = cells.filter(c => c.zone === 'com');
  if (ind.length && com.length && CITYLIFE.carts.length < 3 && R() < dt) {
    const gg = new THREE.Group(), truck = W.era >= 8;
    if (truck) { mesh(G.box, 0xd8d4cc, [.9, .9, 1.6], [0, .65, -.2], gg); mesh(G.box, 0x3a6ab8, [.9, .7, .6], [0, .55, .85], gg); }
    else { mesh(G.box, 0x8a5a2b, [.9, .4, 1.3], [0, .55, -.2], gg); mesh(G.box, 0x6a4a2a, [.5, .7, .8], [0, .6, 1.1], gg); mesh(G.box, 0xc8a050, [.8, .3, 1], [0, .9, -.2], gg); }
    for (const sx of [-.48, .48]) mesh(G.cyl, 0x2a2a2a, [.28, .1, .28], [sx, .28, -.3], gg).rotation.z = Math.PI/2;
    const a = ind[R()*ind.length|0], b = com[R()*com.length|0], s = [a.x + CELL/2, a.z + CELL/2], e = [b.x + CELL/2, b.z + CELL/2];
    gg.position.set(s[0], 0, s[1]); scene.add(gg); CITYLIFE.carts.push({g:gg, pts:[[e[0], s[1]], e, [e[0], s[1]], s], i:0, sp:truck ? 3.2 : 1.6});
  }
  for (const k of CITYLIFE.carts) {
    const [tx, tz] = k.pts[k.i], p = k.g.position, dx = tx - p.x, dz = tz - p.z, dd = Math.hypot(dx, dz);
    if (dd < .1) { k.i = (k.i + 1) % k.pts.length; continue; }
    const st = Math.min(dd, k.sp*dt); p.x += dx/dd*st; p.z += dz/dd*st; k.g.rotation.y = Math.atan2(dx, dz);
  }
}
function updEmpires(dt) {
  if (!started) return;
  if ((EMP.townT = (EMP.townT || 0) - dt) <= 0) {
    EMP.townT = 1; const peak = W.flags.peakPow = Math.max(W.flags.peakPow || 0, myPower());
    for (const r of EMP.list) { biomeFx(r); if (r.sky && !W.unlocked.has('moonLanding')) continue; if (r.sky && BIOME.sky) BIOME.sky.visible = true; const s = es(r); cityBuild(r, s, EMP.loaded); if (!s.met && !s.owned) { const gain = Math.max(0, peak - (s.seenPeak ?? peak)); s.seenPeak = peak; s.pow += .2*r.amb*gain + .2*r.grow*spec(r, 'grow')*(1 + .15*W.era)/60; } rivalTown(r, s, EMP.loaded); }
  }
  if (!EMP.loaded) {
    EMP.loaded = true;
    for (const [id, rem] of Object.entries(W.flags.ruins || {})) if (ST[id] && !ST[id].ruin && rem > 0) ruinStation(ST[id], rem);
    if (W.unlocked.has('senate')) senateFx(false);
  }
  if ((EMP.tick += dt) < 1) return;
  const t = EMP.tick; EMP.tick = 0;
  const mine = myPower();
  for (const r of EMP.list) {
    if (r.sky && !W.unlocked.has('moonLanding')) continue;
    const s = es(r);
    if (!s.met && !(W.conquests >= 2 && r.at && seen(r.at[0], r.at[1]))) continue;   // they notice you after your second campaign, once you have seen them
    if (!s.met) { s.met = true; banner(`🗺️ A new power: ${r.icon} ${r.n}`, 'They are building an empire like yours. Open 🗺️ to trade, ally or go to war.'); }
    if (r.id === 'ostberg' && ostLevel() !== EMP.ostLv) { EMP.ostLv = ostLevel(); rivalCity(); }
    if (s.owned || s.by) continue;   // conquered by you, or occupied by another rival
    // they build out like you do: growth tracks your own strength, each at its own ambition
    const peak = W.flags.peakPow = Math.max(W.flags.peakPow || 0, mine), gain = Math.max(0, peak - (s.seenPeak ?? peak)); s.seenPeak = peak;
    s.pow += .2*r.amb*gain + .2*r.grow*spec(r, 'grow')*(1 + .15*W.era)*t/60;
    // relations drift back toward the rival's nature; a weak neighbour invites trouble; allies stay friendly
    s.rel += ((s.stance === 'ally' ? 50 : r.temper) - s.rel) * .004 * t;
    if (s.pow > mine*1.25 && s.stance !== 'ally') s.rel -= 4*t/60;
    s.rel = clamp(s.rel, -100, 100);
    if (s.stance === 'ally') {
      if (s.rel < 20) { s.stance = 'peace'; banner(`💔 ${r.icon} ${r.n} ends your alliance`, 'Send gifts and trade to keep friends.'); }
      else if ((s.tribT = (s.tribT ?? 60) - t) <= 0) { s.tribT = 60; addCash(CASH.spoils || cash, Math.round(40 + s.pow*3), {x:12.3, z:72.8}); }
    } else if (s.stance === 'peace' && s.rel <= -50) {
      s.stance = 'war'; s.atkT = 100 + R()*80;
      banner(`⚔️ ${r.icon} ${r.n} declares war!`, `Their ⚔️${Math.round(s.pow)} vs your ${Math.round(mine)}. Grow your army, walls and science, or make peace in 🗺️.`);
    } else if (s.stance === 'war' && !W.camp && !W.raid && !BOSS.on && !INV.on && (s.atkT -= t) <= 0) { s.atkT = 300 + R()*240; if (!FORTRESS) startInvasion(r); }   // every attack comes up the road in (091c); with no lands, only the waves attack
  }
  updLands(t);
}
function empAct(i, a, o) {
  const r = EMP.list[i], s = es(r);
  if (a === 'gift') { if (W.coins < giftCost()) return; spend(giftCost()); s.rel = Math.min(100, s.rel + 15); banner(`🎁 Gifts to ${r.n}`, 'They think a little better of you.'); }
  else if (a === 'ally') { s.stance = 'ally'; s.rel = Math.max(s.rel, 60); banner(`🤝 Alliance with ${r.icon} ${r.n}!`, 'They pay tribute, lend you strength and will never attack you.'); }
  else if (a === 'unally') { s.stance = 'peace'; s.rel -= 30; }
  else if (a === 'war') { s.stance = 'war'; s.rel = Math.min(s.rel, -60); s.atkT = 150 + R()*90; banner(`⚔️ You declare war on ${r.n}`, 'Attack them from the 🗺️ map. They will strike back.'); }
  else if (a === 'peace') { if (W.coins < peaceCost(r)) return; spend(peaceCost(r)); s.stance = 'peace'; s.rel = Math.max(s.rel, 0); banner(`🕊️ Peace with ${r.n}`, 'The war is over, for now.'); }
  else if (a === 'fleet') {
    if ((s.fleetT || 0) > W.playT) return;
    s.fleetT = W.playT + 120; const pay = Math.round((400 + 180*W.era) * (1 + s.rel/200));
    W.coins += pay; W.earned += pay; s.rel = Math.min(100, s.rel + 10);
    sailAway(false);
    banner(`⛵ Trade fleet to ${r.icon} ${r.n}`, `Down the river and along the coast: +${pay} 💵 and better relations.`);
  } else if (a === 'land' || a === 'sea') {
    if (W.camp || W.raid) return;
    // a walled city needs rams and catapults to break in
    if (a === 'land' && r.bf && r.id !== 'ostberg' && !W.unlocked.has('siegeWorks')) { banner(`🏰 ${r.n} is walled`, 'Build the Siege workshop in the military district first: rams and catapults to breach their walls.'); return; }
    if (s.stance !== 'war' && !s.by) empAct(i, 'war');
    // a front you planned brings its own odds and the branches that went; otherwise everything you have goes
    const win = o && o.win != null ? o.win : myPower() >= s.pow*(sabotaged(r) ? .85 : 1)*(a === 'sea' ? spec(r, 'navy') : spec(r, 'army')); let dur = a === 'land' ? 30 : 44;
    W.camp = {t:dur, dur, type:a, side:true, rival:i, win, ships:a === 'sea', site:'azul', id:Math.random(), br:o && o.br};
    if (a === 'land' && r.bf && r.id !== 'ostberg') {
      // a long march (or a voyage) to fight before their own walls
      const C = W.camp; C.away = true; C.bf = r.bf;
      if (r.via === 'sea') {
        const east = r.at[0] > 0, sx = east ? 1 : -1, land = [r.bf[0], r.bf[1] - 3];
        C.sail = r.coast ? {board:6, pts:[[-13.6, -6], [-13.6, -48], [-13.6, -85], [r.bf[0]*.5, -97], [r.bf[0] - 10, -94], land], land}
          : {board:6, pts:[[-13.6, -6], [-13.6, -48], [-13.6, -85], [sx*200, -104], [sx*345, -104], [sx*362, 10], land.map((v, k) => k ? v : v - sx*24)], land};
        C.sail.dur = Math.min(40, pathLen(C.sail.pts) / 22); C.path = [];
        dur += C.sail.board + C.sail.dur;
      } else { C.path = armyPath(r); dur += marchTime(C.path, 75); }
      C.t = C.dur = dur; BF.x = r.bf[0]; BF.z = r.bf[1];
      startBattle({army:Math.min(14, 6 + Math.round(s.pow/10)), name:r.n}); if (!win) loseFight();
    } else if (a === 'land') { startBattle({army:Math.min(14, 6 + Math.round(s.pow/10)), name:r.n}); if (!win) loseFight(); }
    else if (r.sea) startNaval(W.camp, r); else startSea();
    banner(a === 'land' ? (r.via === 'sea' ? `⛵ Your army sails for ${r.n}` : `⚔️ Your army marches on ${r.n}`) : `⚓ Your fleet sails for ${r.n}`, 'Tap 🎥 Follow the army (or press F) to ride along.');
    $('modal').hidden = true; $('modal').dataset.panel = ''; return;
  }
  openTrade();
}
// a battle you are going to lose: they hit harder, and your side can fall
function loseFight() { BT.lose = BT.noCap = true; for (const e of enemies) e.hp = e.maxHp = e.maxHp*2.5; }
function sailAway(war) {
  const g = new THREE.Group(); if (war) warshipLook(g, navLvl()); else galleon(g, SHIPS.trade()); g.position.set(-13.6, -.26, -10); g.rotation.y = Math.PI; scene.add(g);
  COAST.fleets.push({g, t:0});
}
function updFleets(dt) {
  for (const f of [...COAST.fleets]) {
    f.t += dt; f.g.position.z -= dt*5;
    if (f.g.position.z < -81) { f.g.rotation.y = Math.PI/2; f.g.position.z = -82; f.g.position.x += dt*5; }
    if (f.t > 40) { scene.remove(f.g); COAST.fleets.splice(COAST.fleets.indexOf(f), 1); }
  }
}
const sideName = () => { const C = W.camp; return C.retake ? landName(C.retake) : EMP.list[C.rival].n; };
function endSideCamp() {
  const C = W.camp; endSea.last = C; W.camp = null;
  if (C.away && armyGoes(C)) for (const s of soldiers) { s.char.g.visible = true; if (C.sail) { s.pos.set(s.slot[0], 0, s.slot[1]); s.ret = null; } else s.ret = [...C.path].reverse(); }
  if (C.away && C.sail) note('⛵ The army sails home', 'Your troops are back at the barracks.');
  if (C.type === 'land') endBattleLater();
  if (C.type === 'sea') endSea();
  if (C.retake) {
    const L = land(C.retake);
    if (C.win) { L.lost = false; L.by = null; L.loy = 30; banner(`🏴 ${landName(C.retake)} is yours again`, 'Now win them over: a governor and the Senate keep them loyal.'); }
    else banner('🏳️ The rebels hold out', 'Your army falls back. Come back stronger.');
  } else {
    const r = EMP.list[C.rival], s = es(r);
    if (C.win) { if (C.type === 'land') genVictory(); if (C.type === 'sea') medal('sea'); if (C.type === 'air') medal('air'); conquer(r); }
    else { s.pow *= 1.1; s.rel -= 10; s.atkT = Math.min(s.atkT, 90); banner(`🏳️ ${r.n} drives you back`, `Their ⚔️${Math.round(s.pow)} was too much. Expect a counter-attack.`); }
  }
  save();
}
function conquer(r) {
  const s = es(r), loot = Math.round(s.pow*150);
  if (s.by) medal('liberate');
  s.owned = true; s.stance = 'owned'; s.by = null;
  // their walls come down, and much of their army joins yours
  removeDefences(r); const joined = armyJoins(r); queueParade(r.n); setTimeout(() => note(`🪖 ${joined} of their soldiers join your army`, 'Your army grows with every land you take.'), 2600);
  // the cities they had occupied are free again
  for (const q of EMP.list) { const sq = es(q); if (sq.by === r.id) { sq.by = null; sq.stance = 'peace'; sq.rel = Math.max(sq.rel, 30); } }
  land('r:' + r.id);
  addCash(CASH.spoils || cash, loot, {x:12.3, z:72.8});
  if (r.id === 'ostberg') rivalCity();
  W.flags.conqueredRivals = (W.flags.conqueredRivals || 0) + 1;
  const ownedN = EMP.list.filter(q => es(q).owned).length;
  if (ownedN >= EMP.list.length && !W.flags.worldEmperor) {
    W.flags.worldEmperor = true; const prize = 1000000;
    setTimeout(() => { banner('👑 The whole world is yours!', `All ${EMP.list.length} rivals have joined your empire. ${prize} 💵 in tribute from every corner of the globe.`); addCash(CASH.spoils || cash, prize, {x:12.3, z:72.8}); [523, 659, 784, 1046, 1318, 1568, 2093].forEach((f, i) => setTimeout(() => snd(f, .25, 'triangle', .05), i*120)); }, 4500);
  }
  banner(`🏴 ${r.icon} ${r.n} is yours! (${ownedN} of ${EMP.list.length} rivals)`, `Their whole realm joins your empire, with ${loot} 💵 in treasure. Win them over or they will revolt.`);
  [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => snd(f, .2, 'triangle', .05), i*110));
}

