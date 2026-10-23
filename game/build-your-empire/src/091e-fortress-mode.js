// ------------------------------------------------------------------ fortress mode: no other lands
// The game is your own town growing out plot by plot against wave after wave (091c). With FORTRESS on, everything
// about owning or attacking other lands is switched off here: provinces and their supply, campaigns and the war
// table, fronts, spies, envoys, rival wars, tribes, and the rival cities themselves. The rivals live on only as the
// names on the roads their armies march in by. (Saves keep whatever they held, unused, should this ever be undone.)
if (FORTRESS) {
  const off = () => {};
  updLands = off; updSupply = off; updFronts = off; updRivalWars = off; updSpies = off; updEnvoys = off; updScouts = off;
  updDefences = off; updAssault = off; scoutNextCamp = off; updLandMarkets = off;
  biomeFx = off; cityBuild = off; rivalTown = off;
  openEmpire = off; openWorldMap = off; openTrade = off;
}
const FORT = {done:false};
function updFortress() {
  if (!FORTRESS || FORT.done || !started) return; FORT.done = true;
  for (const id of ['bEmpire', 'bTrade', 'bWorld']) { const b = $(id); if (b) b.hidden = true; }
  // a campaign or front left over from before: called off
  if (W.camp) W.camp = null;
  // anything of the rival cities already standing goes
  for (const k of Object.keys(CITY)) if (CITY[k] && CITY[k].g) CITY[k].g.visible = false;
  for (const k of Object.keys(BIOME)) if (BIOME[k] && BIOME[k].isObject3D) BIOME[k].visible = false;
}
