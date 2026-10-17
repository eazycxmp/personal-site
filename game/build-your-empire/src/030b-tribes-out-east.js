// ------------------------------------------------------------------ the tribes out east: campaign targets in their own places
// The bandit camp, the rival village and the hill clans each live further out along the east road. The army marches
// there and back to fight, and until it does, the next of them now and then sends a war band against you.
// out past the eastern mountains (the air war's range, x 77-122), short of the Nile's lands
const TRIBE_SITES = {0:[122, 8], 1:[142, 8], 3:[162, 8]};
const TRIBE = {built:{}, raidT:420, band:null};
const tribePath = site => [[3, 34], [3, 13.2], [12.6, 1.6], [35.4, 1.6], [site[0] - 10, 1.9], [site[0] - 3, 4]];
// a settlement south of the road: huts, a palisade arc and a campfire (it becomes your outpost once taken)
function tribeVillage(ci) {
  const site = TRIBE_SITES[ci]; if (!site || TRIBE.built[ci]) return; TRIBE.built[ci] = true;
  const [x, z] = site, g = new THREE.Group(); scene.add(g); TRIBE['g' + ci] = g;
  clearForest({x0:x - 12, x1:x + 12, z0:z - 6, z1:z + 16}); clearForest({x0:x - 14, x1:x - 2, z0:-1, z1:6});
  slab(0xb98f5c, 3, Math.abs(z - 1.9) + 2, x - 3, (z + 1.9)/2, .004);   // the track off the road
  const won = W.conquests > ci;
  for (const [dx, dz, s] of [[-8, 10, 1], [-4, 12.5, 1.1], [4, 12.5, 1.1], [8, 10, 1], [0, 14, 1.3]]) {
    mesh(G.cyl, won ? 0x8a6a4a : 0x7a5a3a, [1.1*s, 1.1, 1.1*s], [x + dx, .55, z + dz], g);
    mesh(G.cone, won ? 0x9a3a2a : 0x5a4a2a, [1.4*s, 1.2, 1.4*s], [x + dx, 1.7, z + dz], g);
  }
  for (let a = -1.2; a <= 1.2; a += .12) mesh(G.cyl, 0x6b4526, [.12, 1.6, .12], [x + Math.sin(a)*11, .8, z + 10 + Math.cos(a)*7], g);
  mesh(G.cyl, 0x3a3a3a, [.6, .2, .6], [x, .1, z + 10], g); smokers.push({x, y:.6, z:z + 10});
  if (won) { mesh(G.cyl, 0x5e3f22, [.05, 3.4, .05], [x, 1.7, z + 7], g); mesh(G.box, 0xf2c200, [.9, .55, .03], [x + .47, 3.1, z + 7], g); }
  for (const [dx, dz] of [[-8, 10], [-4, 12.5], [4, 12.5], [8, 10], [0, 14]]) circles.push({x:x + dx, z:z + dz, r:1.3});
}
function tribeWon(ci) { const g = TRIBE['g' + ci]; if (g) scene.remove(g); TRIBE.built[ci] = false; tribeVillage(ci); }
// a war band from the next tribe: it marches the east road in and fights you on the battlefield south of the base
function updTribes(dt) {
  if (!started) return;
  for (const ci of Object.keys(TRIBE_SITES)) if (regionOpen('east') || W.conquests > ci) tribeVillage(+ci);
  const B = TRIBE.band;
  if (B) {
    let arrived = 0;
    B.units.forEach((e, i) => {
      const ox = ((i % 4) - 1.5)*.8, oz = Math.floor(i / 4)*.8;
      if (e.pi < B.pts.length) { const [x, z] = B.pts[e.pi]; if (march(e, x + ox, z + oz, dt, 6)) e.pi++; } else arrived++;
      animEntity(e, dt); e.char.g.rotation.y = e.yaw;
    });
    if (arrived >= B.units.length*.7 || (B.t += dt) > 80) {
      for (const e of B.units) { scene.remove(e.char.g); stacks.delete(e.stack); const k = ENTS.indexOf(e); if (k >= 0) ENTS.splice(k, 1); }
      TRIBE.band = null;
      const c = CAMPAIGNS[B.ci], need = Math.ceil(campNeed(c)*.8), win = W.army >= need;
      W.raid = {t:30, dur:30, type:'land', raid:true, tribe:B.ci, win};
      startBattle({army:Math.min(12, B.n), name:c.name}); if (!win) loseFight();
      banner(`⚔️ The ${c.name} attack!`, win ? 'Your army forms up to meet them.' : `Your ${W.army} soldiers are too few (they need ${need}). Train more!`);
    }
    return;
  }
  const ci = W.conquests, c = CAMPAIGNS[ci];
  if (!c || !TRIBE_SITES[ci] || W.era < 1 || !W.unlocked.has('barracks') || W.camp || W.raid || BOSS.on || (typeof INV !== 'undefined' && INV.on)) return;
  if ((TRIBE.raidT -= dt) > 0) return;
  TRIBE.raidT = 360 + R()*180;
  const site = TRIBE_SITES[ci], pts = [...tribePath(site)].reverse().concat([[3, 92]]), n = Math.min(12, 4 + 2*ci + Math.floor(W.era/2));
  const look = ENEMY_LOOKS[Math.min(ENEMY_LOOKS.length - 1, ci)];
  const units = []; for (let i = 0; i < n; i++) { const e = entity(look, site[0] + ((i % 4) - 1.5)*.8, site[1] + Math.floor(i / 4)*.8, 6, 0); e.pi = 0; units.push(e); }
  TRIBE.band = {ci, n, pts, units, t:0};
  banner(`🏚️ A war band from the ${c.name}!`, `They are coming down the east road. Have at least ${Math.ceil(campNeed(c)*.8)} soldiers ready.`);
  snd(110, .5, 'sawtooth', .05, .6);
}
// where each campaign is fought, so the world map can show it and the scouts can find it
function campPlace(ci) {
  const c = CAMPAIGNS[ci]; if (!c) return null;
  if (TRIBE_SITES[ci]) return TRIBE_SITES[ci];
  if (c.planes) return AIR_TARGETS[c.target];
  if (c.ships) return [COAST.sites[ci === 4 ? 'empire' : 'cove'].x, COAST.z];
  return null;
}
// the war table's scouts find the next target: it shows on the world map
let campScouted = -1;
function scoutNextCamp() {
  if (campScouted === W.conquests) return; campScouted = W.conquests;
  const p = campPlace(W.conquests); if (p) { reveal(p[0], p[1], 16); FOG.dirty = true; }
}
