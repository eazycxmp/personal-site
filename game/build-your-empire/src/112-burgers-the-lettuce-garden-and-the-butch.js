// ------------------------------------------------------------------ burgers: the lettuce garden and the butcher's block
const BURGER = {block:null, garden:null, chopT:0};
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
function butcherCut(w) {
  if (w.state !== 'toDst') return;
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
  if (!AIRBASE.built && started && W.unlocked.has('hangar') && regionOpen('south')) airbaseFx();
  updFog(dt); updStrip(dt); updRegiments(dt); updCrossings(dt); updSkyDragon(dt); updSiegeEngines(dt); updLand(); updAwayWar(dt); updInvasion(dt);
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
    const rect = S.rect || {x0:COAST.sites[S.site].x - 7.5, x1:COAST.sites[S.site].x + 7.5, z0:-91.6, z1:-80.5};
    if (inRect(rect, player.pos.x, player.pos.z)) { DISTRICT.enter[style] = true; banner(`${S.flag} Welcome to ${S.n}`, 'Your province, in its own style.'); }
  }
}
