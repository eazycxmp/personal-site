// ------------------------------------------------------------------ burgers: the lettuce garden and the butcher's block
const BURGER = {block:null, garden:null, tom:null, bar:null, chopT:0};
function lettuceGarden(anim) {
  if (BURGER.garden) return;
  const g = BURGER.garden = new THREE.Group(); scene.add(g);
  clearForest({x0:16, x1:25, z0:6.5, z1:13});
  mesh(G.box, 0x5a3a24, [7.4, .14, 5.2], [20.5, .07, 9.8], g);
  for (let k = 0; k < 5; k++) mesh(G.box, 0x6a4630, [7, .1, .5], [20.5, .16, 7.8 + k*1], g);
  const pl = MODELS.props3 && MODELS.props3.getObjectByName('prop_lettuce');
  if (pl) for (let i = 0; i < 9; i++) for (let k = 0; k < 5; k++) { const m = pl.clone(true); m.position.set(17.3 + i*.8, .18, 7.8 + k); m.rotation.y = (i*7 + k*3) % 6; m.scale.setScalar(.85 + ((i + k) % 3)*.1); g.add(m); }
  // a low picket fence round three sides
  for (let x = 16.6; x <= 24.4; x += .55) { mesh(G.box, 0xf2ead8, [.08, .5, .06], [x, .25, 12.6], g); }
  for (const x of [16.6, 24.4]) for (let z = 7.2; z <= 12.6; z += .55) mesh(G.box, 0xf2ead8, [.06, .5, .08], [x, .25, z], g);
  boxes.push({x0:16.5, x1:24.5, z0:7.1, z1:12.7});
  station('garden', {name:'lettuce garden', gen:'lettuce', t:2.2, group:'farm', outZ:[20.5, 5.6], outCap:24, genAt:[20.5, .4, 7.6]});
  ST.garden.body = g; if (anim) popIn(g);
}
// what the butcher carries off the lodge becomes patties at his block, one chop at a time
// ------------------------------------------------------------------ burgers: a tomato bed by the lettuce, and the burger station
// The grill only grills. Burgers are put together at their own station from four things: a grilled patty off the grill,
// a bun from the baker, lettuce and a tomato.
function tomatoBed(anim) {
  if (BURGER.tom) return;
  const g = BURGER.tom = new THREE.Group(); scene.add(g);
  clearForest({x0:24.8, x1:30, z0:6.5, z1:13});
  mesh(G.box, 0x5a3a24, [4.2, .14, 5.2], [27.3, .07, 9.8], g);
  for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) {
    const x = 26 + r*1.3, z = 7.9 + k*1.25;
    mesh(G.cyl, 0x8a6a42, [.03, 1.3, .03], [x, .65, z], g);
    mesh(G.sph, 0x3f8a2e, [.36, .5, .36], [x, .75, z], g);
    for (let t = 0; t < 3; t++) mesh(G.sph, 0xd8322a, [.09, .09, .09], [x + Math.cos(t*2.1)*.24, .55 + t*.22, z + Math.sin(t*2.1)*.24], g);
  }
  boxes.push({x0:25.1, x1:29.5, z0:7.1, z1:12.5});
  station('tomatobed', {name:'tomato bed', gen:'tomato', t:2.4, group:'farm', outZ:[27.1, 5.6], outCap:24, genAt:[27.3, .6, 8]});
  ST.tomatobed.body = g; if (anim) popIn(g);
}
function burgerBar(anim) {
  if (BURGER.bar) return;
  const g = BURGER.bar = new THREE.Group(); g.position.set(20.75, 0, 17.6); scene.add(g);
  clearForest({x0:15.5, x1:29, z0:13, z1:21});
  // a little burger joint: a counter with a flat-top griddle and a prep board, under a red-and-white awning
  mesh(G.box, 0xf4efe4, [5.2, 1, 1.4], [0, .5, 0], g); mesh(G.box, 0xd9443a, [5.3, .14, 1.5], [0, 1.05, 0], g);
  mesh(G.box, 0x2a2a2e, [1.6, .06, .9], [-1.4, 1.15, 0], g, {metalness:.6, roughness:.3});
  mesh(G.box, 0xc89a62, [1.4, .05, .8], [1.3, 1.15, 0], g);
  for (const x of [-2.5, 2.5]) mesh(G.cyl, 0x8a8f96, [.06, 2.6, .06], [x, 1.3, -.6], g, {metalness:.7});
  for (let k = 0; k < 7; k++) mesh(G.box, k % 2 ? 0xf4f4f4 : 0xd9443a, [.76, .06, 1.8], [-2.28 + k*.76, 2.65, .1], g).rotation.x = .18;
  mesh(G.box, 0x2a1a12, [2.6, .7, .08], [0, 3.15, -.55], g);
  const sg = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('🍔 BURGERS', '#2a1a12', '#ffd040'), toneMapped:false}));
  sg.scale.set(2.4, .6, 1); sg.position.set(0, 3.15, -.5); sg.rotation.y = Math.PI; g.add(sg);
  const sg2 = sg.clone(); sg2.position.z = -.6; sg2.rotation.y = 0; g.add(sg2);
  boxes.push({x0:18, x1:23.5, z0:16.8, z1:18.4});
  station('burgerBar', {name:'burger station', in:'steak', ins:[['steak', 'patty'], ['bread'], ['lettuce'], ['tomato']], inCap:32, out:'roast', t:1.2,
    inZ:[17.9, 14.3], outZ:[23.6, 14.3], fireAt:[20.75, 1.3, 17.6]});
  ST.burgerBar.body = g; if (anim) { popIn(g); banner('🍔 Burgers!', 'Grilled patties, buns, lettuce and tomato go in; burgers come out. Hire a burger cook to keep it stocked.'); }
}
// where a supplier should go next: whichever of their sources the burger station is shortest of
function burgerSrc(list) {
  const s = ST.burgerBar; list = list.filter(z => z && z.stack.length); if (!s || !list.length) return list.slice(0, 1);
  return list.sort((a, b) => s.inStack.count([ST[a.st].out || ST[a.st].gen]) - s.inStack.count([ST[b.st].out || ST[b.st].gen])).slice(0, 1);
}
function butcherCut(w) {
  if (w.state !== 'toDst' || !(ST.spit && ST.spit.ins)) return;   // the grill takes meat as it comes; nothing to cut
  const it = w.stack.items.find(q => q.type === 'meat'); if (!it) return;
  if ((BURGER.chopT -= 1/30) > 0) return; BURGER.chopT = .12;
  const m = itemMesh('patty'); m.position.copy(it.mesh.position); scene.remove(it.mesh); it.mesh = m; it.type = 'patty';
  if (BURGER.block && Math.hypot(w.pos.x - BURGER.block.position.x, w.pos.z - BURGER.block.position.z) < 6) { snd(240, .04, 'square', .02); particle(0xc0463a, BURGER.block.position.clone().setY(.8), new THREE.Vector3((R() - .5)*1.5, 1.5, (R() - .5)*1.5), .4, .06, {grav:1}); }
}
function updDistricts(dt) {
  updGreenPad();
  updMilFire(dt);
  updHighways(dt);
  updWarArms(dt);
  updCityLife(dt); if (BIOME.sky && BIOME.sky.visible) BIOME.sky.position.y = Math.sin(time*.4)*.6;
  if (!wondersOpen && started && W.unlocked.has('bridge1') && regionOpen('airfield')) wondersPark();
  if (started && (AGE_NEED.t = (AGE_NEED.t || 0) - dt) <= 0) { AGE_NEED.t = 1; setEra(AGE_NEED.length - 1, true); }
  if (!AIRBASE.built && started && (W.unlocked.has('hangar') || W.unlocked.has('airfieldGate')) && regionOpen('south')) airbaseFx();   // ready for the fighters' hangar
  updFog(dt); updStrip(dt); updRegiments(dt); updMassBattle(dt); updLedger(dt); syncRuinTiles(dt); updCrossings(dt); updSkyDragon(dt); updSiegeEngines(dt); updLand(); updAwayWar(dt); updInvasion(dt);
  if (W.unlocked.has('speedboat') && !BOAT.docked) boatDocks();
  updAirstrips();
  updMarkets(dt);
  if ((DISTRICT.t = (DISTRICT.t || 0) - dt) > 0) return; DISTRICT.t = .3;
  for (const r of EMP.list) { const s = W.flags.emp?.[r.id]; if (s && s.owned && styleFor(r)) buildDistrict(styleFor(r), started); }
  const coast = W.flags.coast || {};
  if (coast.cove) buildDistrict('mideast', started); if (coast.empire) buildDistrict('russia', started);
  if (coast.azul) buildDistrict('brazil', started); if (coast.kumo) buildDistrict('china', started);
  if (W.conquests >= 6) buildDistrict('canada', started);
  // the harbour ferry appears once there is somewhere to sail to
  if (!DISTRICT.ferry && Object.keys(DISTRICT.built).some(s => STYLE_SPOTS[s].site)) DISTRICT.ferry = addZone({kind:'ferry', x:-8.86, z:.72, icon:'⛵', tile:{alpha:1, size:84, label:'Coast ferry', fill:'rgba(30,90,140,.65)'}});
  // a welcome the first time you walk into each province
  for (const [style, S] of Object.entries(STYLE_SPOTS)) {
    if (!DISTRICT.built[style] || DISTRICT.enter[style]) continue;
    const rect = S.rect || {x0:COAST.sites[S.site].x - 7.5, x1:COAST.sites[S.site].x + 7.5, z0:-79.6, z1:-68.5};
    if (inRect(rect, player.pos.x, player.pos.z)) { DISTRICT.enter[style] = true; banner(`${S.flag} Welcome to ${S.n}`, 'Your province, in its own style.'); }
  }
}
