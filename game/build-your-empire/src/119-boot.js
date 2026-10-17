// ------------------------------------------------------------------ boot
const hadSave = load();
homesFull = hadSave;
refreshPads();
if (hadSave) { $('bPlay').textContent = 'Continue'; $('bNew').hidden = false; }
applyGfx();
// players who already have a camp have learned the ropes
if (hadSave && !SET.tutDone) { SET.tutDone = true; saveSettings(); }
$('bPlay').onclick = () => {
  $('overlay').hidden = true; started = true; snd(523, .15, 'triangle', .05, 1.5); renderer.domElement.focus({preventScroll:true});
  startMusic(); showOffline();
  if (!SET.tutDone) startTutorial();
};
$('bSettings').onclick = openSettings; $('bPauseSet').onclick = openSettings; $('bTitleSet').onclick = openSettings;
setInterval(() => updTut(.5), 500);
$('bBoard').onclick = openBoard;
$('bBuild').onclick = openBuild; $('bTrophy').onclick = openTrophies; $('bTrade').onclick = openTrade; $('bPhoto').onclick = () => togglePhoto(true); $('bPhotoX').onclick = () => togglePhoto(false); $('bSnap').onclick = savePhoto; $('bSpace').onclick = toggleSpace; $('bInvest').onclick = () => openInvest(); $('bPlace').onclick = placeDecor; $('bCancel').onclick = endPlacing;
addEventListener('keydown', e => { if (BUILD.on && e.key === 'Enter') placeDecor(); if (BUILD.on && e.key === 'Escape') endPlacing(); });
refreshUpgrades();
const wipe = () => { try { backupSave('before a new game'); localStorage.removeItem(SAVE_KEY); } catch (e) {} location.reload(); };
$('bNew').onclick = wipe;
$('bReset').onclick = () => { if (confirm('Start a new camp? Your progress will be lost.')) wipe(); };
// pause: the ⏸️ button, P, or Esc; nothing moves, earns or attacks until you resume
function setPause(v) {
  if (!started || v === paused) return;
  paused = v; $('pauseOv').hidden = !v; $('bPause').textContent = v ? '▶️' : '⏸️';
  for (const k in keys) keys[k] = false; joy.x = joy.y = 0;
  if (v) save(); else renderer.domElement.focus({preventScroll:true});
}
$('bPause').onclick = () => setPause(!paused); $('bCam').onclick = nextCam; $('bBoat').onclick = () => { if (BOAT.on && BOAT.near) boatOff(BOAT.near); }; $('bWorld').onclick = () => { if (started) openWorldMap(); }; $('bWatch').onclick = () => setWatch(!WATCH.on); $('tripSkip').onclick = () => { if (TRIP.on) TRIP.t = TRIP.dur; }; $('bTravel').onclick = () => { if (started) openTravel(); }; $('bEmpire').onclick = () => { if (started) openEmpire(); }; $('bResume').onclick = () => setPause(false);
addEventListener('keydown', e => {
  if (e.repeat || e.target.closest?.('input, textarea')) return;
  const k = e.key.toLowerCase();
  if (k === 'c' && started && !paused) nextCam();
  if (k === 'f' && started && !paused) { setWatch(!WATCH.on); return; }
  if (k === 'g' && started && !paused) { if ($('modal').hidden) openWorldMap(); else if ($('modal').dataset.panel === 'map') $('modal').hidden = true; return; }
  if (k === 'm' && started && !paused) { const own = [1, 2, 3, 4, 5, 6].filter(i => W.unlocked.has('mount' + i)); if (own.length > 1) mountStage(own[(own.indexOf(W.mount) + 1) % own.length], true); }
  if (k === 't' && started && !paused) openTravel();
  if (k === 'e' && started && !paused) openEmpire();
  if (k === 'p' || (k === 'escape' && !BUILD.on && (paused || $('overlay').hidden))) setPause(!paused);
});
$('bMute').onclick = () => { muted = !muted; $('bMute').textContent = muted ? '🔇' : '🔊'; };
fit();
camera.position.set(player.pos.x + 11.8, 19, player.pos.z + 11.8);
requestAnimationFrame(frame);

// test hooks
window.__rf = {restyleForAge, SET, openSettings, slotInfo, COACH, startTutorial, applyGfx, parts, pops, flyers, fires, TRAFFIC, refreshPads, SAVE_VERSION, migrate, backups, backupSave, restoreBackup, exportSave, importSave, skClone, QN, qnInit, makeQN, updQN, buildBodyReal, remapKit, BURGER, lettuceGarden, butcherCut, GREENPAD, propItem, MILFIRE, milFireFx, HWY, hwyHeld, hwyBuild, hwyPave, WARFIRE, warFlame, foesNow, sortieTarget, warHit, setAblaze, updWarArms, SPEC, spec, CITY, CITY_LAND, BIOME, cityPlan, cityBuild, biomeFx, CITYLIFE, AGE_NEED, skyscrapers, AIRBASE, airbaseFx, planeVsBoss, STRIP, STRIP_LOTS, stripLot, stripFx, stripTake, playSlots, RENT, rentFor, REGT, regtSlot, recruitCost, XING, xingBusy, xingLimit, SKYD, dragonModel, flameJet, SENG, armyEngines, LAND, decorFits, ZOO, ZOOPARK, PENS, makeHero, SOUND, BASE, baseTier, motorPool, BASE_SLOTS, fleetLvl, INV, startInvasion, armyPath, BF, SAILS, empAct, layoutOf, kitModel, TOWN_PLANS, STYLE_SPOTS, BOAT, DOCKS, boatOn, boatOff, isWater, boatIn, FOG, reveal, seen, openWorldMap, WORLD, wrapX, onIsland, TEX, phDress, ENVK, RTOWN, rivalTown, WATCH, setWatch, watchingWar, TRIP, startTrip, openFlights, AIRSTRIPS, flightTo, renderFinal, render, AOX, DPARTS, LAYOUT2, payFix, fixZones, buildLot, isHotel, IHW, ihwH, GAS2, gasStationLook, payGas, gasLvl, kit2, HANGAR, hangarLook, beast, FLOCKS, openEmpire, sendGovernor, US_FLAG, ourFlag, forceOptions, launchCamp, forcePower, planesBuilt, GAP_ROADS, gapRoads, travelSpots, openTravel, NAV, OPEN_LAND, THREE, decorMesh, CAMV, renderer, POST, BAKE, sun, banner, note, FEED, popText, BOSS_UNITS, bossForces, DISTRICT, buildDistrict, STYLE_SPOTS, takeFerry, updMoonWalk, spaceScene, buildBase, HERO, HERO_STAGES, swapHero, setEra, BSTAT, ARENA, arenaStage, MODELS, PART, investZone:() => investZone, tierBuild, addons, MAXLV, padZones, EMP, es, empAct, startSiege, SIEGE, myPower, defPower, landKeys, land, loyRate, COAST, SEP, ENTS, PADOBJ, retake, startRevolt, ruinStation, landTribute, senateFx, get senateZone() { return senateZone; }, BT, BOSS, startBoss, TRADE, openTrade, ship, startVote, JETS, unlock, get robber() { return robber; }, get lastRobCaught() { return lastRobCaught; }, SPACE, startCut, terrainH, airPos, AIR_TARGETS, castleStage, makeChar, strollers, walkers, get railTrain() { return railTrain; }, get mineTrain() { return mineTrain; }, planes, pirates, forts, campType, hutStage, badges, lotStage, LOTS, upZones, UPG, upCost, lvl, refreshUpgrades, enemies, get offline() { return offline; }, set offline(v) { offline = v; }, showOffline, newGoal, CAMPAIGNS, revolt, get warZone() { return warZone; }, camera, scene, testIn, boxes, circles, AREAS, BOUNDS, REGIONS, W, ST, TB, CASH, LINES, BOOST, WORKER, player, table, zones, trees, rocks, nodes, workers, soldiers, boats,
  PADS, padZones, stacks, unlock, update, render, zoneAt, objective, supplyStep, obtain, regionOf, route,
  get started() { return started; }, set started(v) { started = v; }};

/* when framed (the site embeds this page), report our height so the host
   iframe can grow and there is never a nested scrollbar. Measure #app (the
   content), not document.scrollHeight, which includes the frame's own viewport. */
if (window.parent !== window) {
  const app = $('app');
  const post = () => { try { parent.postMessage({rfHeight: Math.ceil(app.getBoundingClientRect().height) + 2}, '*'); } catch (e) {} };
  new ResizeObserver(post).observe(app);
  addEventListener('load', post); post();
}
