// ------------------------------------------------------------------ rival cities: planned, growing, each in its biome
const SPEC = {
  ostberg:{icon:'🪵', n:'Timber builders: they raise new blocks fastest', build:1.35, ind:1.4},
  azul:{icon:'⛵', n:'Seafarers: they build boats fastest and fight hard at sea', boats:1.6, navy:1.4},
  kumo:{icon:'⛏️', n:'Miners and smiths: a tough, well-armed army', army:1.25, ind:1.2},
  nile:{icon:'🪨', n:'Stonemasons: pyramids, obelisks and strong walls', army:1.1, build:1.1},
  aztlan:{icon:'🌽', n:'Farmers: their people multiply fastest', grow:1.35},
  hellas:{icon:'🏺', n:'Traders: they grow rich on trade', grow:1.15, boats:.6},
  rajpur:{icon:'🌶️', n:'Seafarers and spice traders: quick boatbuilders', boats:1.3, navy:1.25, grow:1.1},
  nordheim:{icon:'🛸', n:'Alien technology: ahead in everything', grow:1.2, build:1.2, army:1.2, navy:1.2}};
const spec = (r, k) => (SPEC[r.id] || {})[k] || 1;
const CITY = {}, CITY_BIOME = {ostberg:'forest', azul:'ocean', kumo:'mountain', nile:'desert', aztlan:'jungle', hellas:'beach', rajpur:'island', nordheim:'sky'};
// where each city may grow: away from the road (or shore) you arrive by
const CITY_LAND = {ostberg:{x0:-34, x1:40, z0:104, z1:166}, azul:{x0:110, x1:170, z0:-160, z1:-99}, kumo:{x0:-196, x1:-137, z0:-24, z1:46},
  nile:{x0:197, x1:256, z0:-38, z1:42}, aztlan:{x0:-276, x1:-217, z0:-38, z1:54}, hellas:{x0:272, x1:328, z0:-38, z1:42}, rajpur:{x0:397, x1:452, z0:8, z1:94}, nordheim:{x0:-440, x1:-380, z0:22, z1:82}};
const CITY_KIT = {austria:['s', 'chalet', 3.2], brazil:['s', 'colonial', 3], china:['s', 'chineseHouse', 2.4], egypt:['n', 'mudHouseEG', 2.6], greece:['n', 'whiteHouseGR', 3.2], mexico:['n', 'adobeMX', 2.6], india:['n', 'haveliIN', 3.4]};
const BIOME_LOOK = {
  forest:{street:0x8a8478, ground:0x4f6a38, lot:0x6e8a4a, com:0xb0a898, ind:0x7a5a3a},
  ocean:{street:0x8a6a48, ground:0x7a5a3c, lot:0x9a7a52, com:0xa8865c, ind:0x6a5038},
  mountain:{street:0x8e8c88, ground:0x6a7058, lot:0x7e8a5c, com:0xb4b0a6, ind:0x6a6258},
  desert:{street:0xc8a878, ground:0xe0c48e, lot:0xd8b47a, com:0xd8c8a4, ind:0xb08858},
  jungle:{street:0x7a6448, ground:0x3e5a2c, lot:0x5a7a3a, com:0xa89a7a, ind:0x5a4a30},
  beach:{street:0xe8e2d4, ground:0xe8d49a, lot:0xd8c89a, com:0xf2eee4, ind:0xb8a070},
  island:{street:0xc8b088, ground:0xd8c48e, lot:0x9ab86a, com:0xd8ccb0, ind:0xa8885a},
  sky:{street:0x5a6a8a, ground:0x3a4058, lot:0x4a5a7a, com:0x8aa0c8, ind:0x2a3448}};
const CELL = 8, LOT = 4.6;
const hash01 = (a, b) => { const v = Math.sin(a*127.1 + b*311.7)*43758.5453; return v - Math.floor(v); };
function cityBox(T, m) { const bb = new THREE.Box3().setFromObject(m); const b = {x0:bb.min.x + .2, x1:bb.max.x - .2, z0:bb.min.z + .2, z1:bb.max.z - .2}; boxes.push(b); (T.boxes ||= []).push(b); }
function cityUnbox(T) { for (const b of T.boxes || []) { const i = boxes.indexOf(b); if (i >= 0) boxes.splice(i, 1); } T.boxes = []; }
// the kit house, as instancable parts (geometry, material, transform), fitted to a lot's quarter
const KIT_PARTS = {};
function kitParts(style) {
  if (KIT_PARTS[style]) return KIT_PARTS[style];
  const k = CITY_KIT[style]; const m = k && kitModel(k[0], k[1], k[2]); if (!m) return null;
  const bb = new THREE.Box3().setFromObject(m), w = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z), f = Math.min(1, 2.1 / w);
  const root = new THREE.Group(); root.add(m); root.scale.setScalar(f); root.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(root); root.position.set(-(b2.min.x + b2.max.x)/2, -b2.min.y, -(b2.min.z + b2.max.z)/2); root.updateMatrixWorld(true);
  const parts = []; root.traverse(o => { if (o.isMesh) parts.push({geo:o.geometry, mat:o.material, m:o.matrixWorld.clone()}); });
  return KIT_PARTS[style] = {parts, h:(bb.max.y - bb.min.y)*f};
}
function cityPlan(r) {
  // every block the city could ever have, nearest the civic centre first
  const [cx, cz] = r.at, A = CITY_LAND[r.id], biome = CITY_BIOME[r.id], L = layoutOf(r.style);
  const core = r.sky ? {x0:cx - 9, x1:cx + 9, z0:cz - 9, z1:cz + 9} : {x0:Math.min(...L.map(p => p.x)) - 4.5, x1:Math.max(...L.map(p => p.x)) + 4.5, z0:Math.min(...L.map(p => p.z)) - 4.5, z1:Math.max(...L.map(p => p.z)) + 4.5};
  const bf = r.bf ? {x0:r.bf[0] - 11, x1:r.bf[0] + 11, z0:r.bf[1] - 11, z1:r.bf[1] + 13} : null;
  const keepOut = [core, bf, ...Object.values(REGIONS).map(g => ({x0:g.rect.x0 - 9, x1:g.rect.x1 + 9, z0:g.rect.z0 - 9, z1:g.rect.z1 + 9})),
    {x0:ZOOPARK.x0 - 3, x1:ZOOPARK.x1 + 3, z0:ZOOPARK.z0 - 3, z1:ZOOPARK.z1 + 3}, STYLE_SPOTS.canada.rect && {x0:STYLE_SPOTS.canada.rect.x0 - 4, x1:STYLE_SPOTS.canada.rect.x1 + 4, z0:STYLE_SPOTS.canada.rect.z0 - 4, z1:STYLE_SPOTS.canada.rect.z1 + 4},
    {x0:-8, x1:14, z0:88, z1:110}, AIRBASE.rect, CITY_OASIS[r.id], ...EMP.list.filter(q => q !== r && q.bf).map(q => ({x0:q.bf[0] - 11, x1:q.bf[0] + 11, z0:q.bf[1] - 11, z1:q.bf[1] + 13}))].filter(Boolean);
  const hit = (x0, x1, z0, z1) => keepOut.some(k => x1 > k.x0 && x0 < k.x1 && z1 > k.z0 && z0 < k.z1);
  const cells = [];
  for (let i = -8; i <= 8; i++) for (let j = -9; j <= 9; j++) {
    const x = cx + i*CELL, z = cz + CELL/2 + j*CELL, x0 = x - CELL/2, x1 = x + CELL/2, z0 = z - CELL/2, z1 = z + CELL/2;
    if (x0 < A.x0 || x1 > A.x1 || z0 < A.z0 || z1 > A.z1 || hit(x0, x1, z0, z1)) continue;
    if (biome === 'island' && Math.hypot(x - 410, z - 50) > 40) continue;
    if (biome === 'sky' && Math.hypot(x - cx, z - cz) > 27) continue;
    if (biome !== 'ocean' && biome !== 'island' && biome !== 'sky' && (x0 < WORLD.cx0 + 3 || x1 > WORLD.cx1 - 2 || z0 < WORLD.cz0 + 3 || z1 > WORLD.cz1 - 3)) continue;
    const d = Math.hypot(x - cx, z - cz), h = hash01(i + r.base, j - r.base);
    cells.push({x, z, i, j, d, h, key:d + h*5});
  }
  cells.sort((a, b) => a.key - b.key);
  // zoning in rings round the centre: shops, then homes with parks among them, workshops and fields at the edge
  cells.forEach((c, k) => { c.zone = c.d < 19 ? 'com' : c.d < 31 ? (c.h > .86 ? 'park' : 'res') : (c.h < .42*spec(r, 'ind') ? 'ind' : c.h > .9 ? 'park' : 'res'); });
  return {cells, core, y:r.sky ? 24 : 0};
}
const CITY_OASIS = {nile:{x0:238, x1:252, z0:-36, z1:-22}};
function cityCount(s) { return Math.max(3, Math.floor(s.pow / 3.2)); }
function cityBuild(r, s, anim) {
  const C = CITY[r.id] ||= {plan:cityPlan(r), n:-1, g:null, boxes:[], areas:[]};
  const cnt = Math.floor(cityCount(s)*spec(r, 'build')), want = Math.min(C.plan.cells.length, s.owned ? Math.max(C.n, cnt) : cnt);
  const modern = W.era >= 8 && s.pow >= 90, mk = modern ? 1 : 0;
  if (want === C.n && mk === C.modern) return;
  const prev = C.n; C.n = want; C.modern = mk;
  if (C.g) { C.g.parent && C.g.parent.remove(C.g); C.g.traverse(o => { if (o.isInstancedMesh) o.dispose(); }); }
  cityUnbox(C); for (const a of C.areas) { const i = AREAS.indexOf(a); if (i >= 0) AREAS.splice(i, 1); } C.areas = [];
  const g = C.g = new THREE.Group(); (r.sky && BIOME.sky ? BIOME.sky : scene).add(g);
  const biome = CITY_BIOME[r.id], look = BIOME_LOOK[biome], Y = C.plan.y, cells = C.plan.cells.slice(0, want);
  // instance lists: unit primitives with a colour each, and kit houses
  const L = {box:[], cyl:[], cone:[], sph:[], house:[], tower:[]}, col = new THREE.Color(), o = new THREE.Object3D();
  const put = (k, x, y, z, sx, sy, sz, c, ry = 0, rx = 0) => L[k].push([x, y + Y, z, sx, sy, sz, c, ry, rx]);
  const B = (x0, x1, z0, z1) => { const b = {x0, x1, z0, z1}; boxes.push(b); C.boxes.push(b); };
  const tree = (x, z, s = 1) => { put('cyl', x, .6*s, z, .12*s, 1.2*s, .12*s, 0x6b4a2a); if (biome === 'jungle' || biome === 'island' || biome === 'beach' || biome === 'desert') { put('sph', x, 1.6*s, z, .9*s, .5*s, .9*s, 0x3f8a3a); } else put('cone', x, 1.9*s, z, .8*s, 1.8*s, .8*s, 0x2f6a32); };
  for (const c of cells) {
    const {x, z} = c, hl = LOT/2;
    put('box', x, -.02, z, CELL, .06, CELL, look.street);
    put('box', x, .015, z, LOT, .05, LOT, c.zone === 'com' ? look.com : c.zone === 'ind' ? look.ind : c.zone === 'park' ? 0x6aa84a : look.lot);
    if (biome === 'ocean' || biome === 'sky' || (biome === 'island' && !onIsland(x, z, -2))) for (const [dx, dz] of [[-3.6, -3.6], [3.6, -3.6], [-3.6, 3.6], [3.6, 3.6]]) put('cyl', x + dx, biome === 'sky' ? -1.2 : -1.6, z + dz, .16, biome === 'sky' ? 2.4 : 3.2, .16, biome === 'sky' ? 0x8aa0c8 : 0x5a4028);
    if (biome === 'island' && !onIsland(x, z, -2)) put('box', x, -.02, z, CELL, .1, CELL, 0x8a6a48);
    const A = {x0:x - CELL/2, x1:x + CELL/2, z0:z - CELL/2, z1:z + CELL/2}; if (!r.sky) { AREAS.push(A); C.areas.push(A); }
    if (c.zone === 'res' || (c.zone === 'com' && !modern && c.h < .5)) {
      if (modern && c.d < 30) { const h = 5 + Math.floor(c.h*7)*1.2; L.tower.push([x, z, 3.6, h, 3.6]); B(x - 1.8, x + 1.8, z - 1.8, z + 1.8); continue; }
      for (const [qx, qz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) { L.house.push([x + qx, z + qz, qz < 0 ? Math.PI : 0]); B(x + qx - .95, x + qx + .95, z + qz - .95, z + qz + .95); }
    } else if (c.zone === 'com') {
      if (modern) { const h = 9 + Math.floor(c.h*9)*1.5; L.tower.push([x, z, 4, h, 4]); B(x - 2, x + 2, z - 2, z + 2); continue; }
      // a market square: two stalls under awnings and a well
      for (const sx of [-1.3, 1.3]) { put('box', x + sx, .55, z, 1.6, 1.1, 1.2, 0xb08a5a); put('box', x + sx, 1.25, z, 1.9, .12, 1.5, hash01(x, sx) > .5 ? 0xd84a3a : 0x3a8ad8); B(x + sx - .8, x + sx + .8, z - .6, z + .6); }
      put('cyl', x, .35, z + 1.6, .45, .7, .45, 0x8a8478);
    } else if (c.zone === 'park') {
      for (const [dx, dz] of [[-1.4, -1.2], [1.5, -.8], [-.6, 1.5]]) { tree(x + dx, z + dz, .9 + c.h*.3); }
      put('cyl', x + 1, .05, z + 1.2, 1, .06, .7, 0x3a8ac8);
    } else {
      // the edge of town: what this land makes
      if (biome === 'forest') { put('box', x - .8, .9, z, 2.6, 1.8, 2.2, 0x7a5a3a); put('box', x - .8, 1.95, z, 2.9, .3, 2.5, 0x5a3a22); for (let k = 0; k < 3; k++) put('cyl', x + 1.6, .25 + k*.42, z - .8 + (k % 2)*.4, .2, 2, .2, 0x8a5a2b, 0, Math.PI/2); B(x - 2.2, x + .6, z - 1.2, z + 1.2); }
      else if (biome === 'desert') { put('box', x, .06, z, 4.2, .06, 4.2, 0x6aa040); for (let k = 0; k < 4; k++) put('box', x - 1.6 + k*1.06, .1, z, .12, .06, 4, 0x3a6aa8); for (const dx of [-2, 2]) { put('cyl', x + dx, 1.3, z - 2, .1, 2.6, .1, 0x8a6a42); put('cone', x + dx, 2.8, z - 2, .9, .6, .9, 0x4a8a3a); } }
      else if (biome === 'mountain') { for (let k = 0; k < 3; k++) put('box', x, .15 + k*.3, z - 1.4 + k*1.2, 4.4, .3 + k*.3, 1.4, k % 2 ? 0x7a9a4a : 0x8aaa58); put('box', x + 1.6, .8, z + 1.6, 1.4, 1.6, 1, 0x3a3634); B(x + .9, x + 2.3, z + 1.1, z + 2.1); }
      else if (biome === 'jungle') { for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) put('sph', x - 1.4 + a*1.4, .4, z - 1.4 + b*1.4, .45, .45, .45, 0x2f6a2a); }
      else if (biome === 'beach') { for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) { put('cyl', x - 1 + a*2, .4, z - 1 + b*2, .08, .8, .08, 0x6a5a40); put('sph', x - 1 + a*2, 1, z - 1 + b*2, .6, .45, .6, 0x8a9a6a); } }
      else if (biome === 'island') { put('box', x, .3, z, 3, .5, 1.1, 0x8a5a2b); put('box', x, .62, z, .08, 1.2, .08, 0x6b4526); for (let k = 0; k < 2; k++) put('box', x - 1 + k*2, .9, z + 1.6, 1.4, .9, .05, 0xd8d0b0); }
      else if (biome === 'ocean') { for (const dx of [-1.2, 1.2]) put('cyl', x + dx, .05, z, 1, .12, 1, 0x3a7a8a); }
      else { for (let k = 0; k < 3; k++) put('box', x, .6, z - 1.4 + k*1.4, 4, .08, 1, 0x1a2a5a, 0, -.5); }
    }
  }
  // the instanced meshes
  const geos = {box:G.box, cyl:G.cyl, cone:G.cone, sph:G.sph};
  for (const [k, list] of Object.entries(L)) {
    if (!list.length || !geos[k]) continue;
    const im = new THREE.InstancedMesh(geos[k], new THREE.MeshStandardMaterial({roughness:.85}), list.length);
    list.forEach(([x, y, z, sx, sy, sz, c, ry, rx], i) => { o.position.set(x, y, z); o.rotation.set(rx || 0, ry || 0, 0); o.scale.set(sx, sy, sz); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, col.set(c)); });
    im.castShadow = k !== 'box'; im.receiveShadow = true; im.computeBoundingSphere(); g.add(im);
  }
  const KP = r.sky ? null : kitParts(r.style);
  if (L.house.length && KP) for (const p of KP.parts) {
    const im = new THREE.InstancedMesh(p.geo, p.mat, L.house.length), m4 = new THREE.Matrix4();
    L.house.forEach(([x, z, ry], i) => { o.position.set(x, Y, z); o.rotation.set(0, ry, 0); o.scale.set(1, 1, 1); o.updateMatrix(); im.setMatrixAt(i, m4.multiplyMatrices(o.matrix, p.m)); });
    im.castShadow = true; im.computeBoundingSphere(); g.add(im);
  } else if (L.house.length) {
    // the aliens' homes: glassy domes on round bases
    const base = new THREE.InstancedMesh(G.cyl, new THREE.MeshStandardMaterial({color:0xc8d4e8, metalness:.6, roughness:.25}), L.house.length), dome = new THREE.InstancedMesh(G.sph, new THREE.MeshStandardMaterial({color:0x7af0ff, emissive:0x2aa0c8, emissiveIntensity:.6, transparent:true, opacity:.8, roughness:.1}), L.house.length);
    L.house.forEach(([x, z], i) => { o.rotation.set(0, 0, 0); o.position.set(x, Y + .4, z); o.scale.set(.9, .8, .9); o.updateMatrix(); base.setMatrixAt(i, o.matrix); o.position.set(x, Y + .8, z); o.scale.set(.8, .7, .8); o.updateMatrix(); dome.setMatrixAt(i, o.matrix); });
    for (const im of [base, dome]) { im.computeBoundingSphere(); g.add(im); }
  }
  if (L.tower.length) {
    if (!CITY.winMat) { const t = stripWinTex(6, 24, '#5a6270'); CITY.winMat = new THREE.MeshStandardMaterial({map:t, emissiveMap:t, emissive:0xffffff, emissiveIntensity:.25, roughness:.35, metalness:.35}); }
    const TT = {forest:0xe8dcc8, ocean:0xf4f0e8, mountain:0xd8d0c4, desert:0xf0d6a0, jungle:0xd8c8a0, beach:0xffffff, island:0xf6e4c8, sky:0x9ad8ff};
    const tm = CITY['wm_' + biome] ||= (() => { const m = CITY.winMat.clone(); m.color.set(TT[biome]); if (biome === 'sky') { m.emissive.set(0x5ac8ff); m.emissiveIntensity = .7; m.metalness = .6; } return m; })();
    const im = new THREE.InstancedMesh(biome === 'sky' ? G.cyl : G.box, tm, L.tower.length);
    L.tower.forEach(([x, z, w, h, d], i) => { o.position.set(x, Y + h/2, z); o.rotation.set(0, 0, 0); o.scale.set(w, h, d); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    im.castShadow = true; im.computeBoundingSphere(); g.add(im);
  }
  // seafarers keep a fleet that grows with them (and with their knack for boats)
  const nb = r.sky ? 0 : Math.min(12, Math.floor(s.pow/45*spec(r, 'boats')*((SPEC[r.id] || {}).boats ? 1 : 0)));
  C.fleet = [];
  for (let k = 0; k < nb; k++) {
    const fg = new THREE.Group(), [fx, fz, fy] = r.id === 'azul' ? [r.at[0] - 30 + (k % 6)*12, r.at[1] - 44 - Math.floor(k/6)*10, 0] : r.id === 'rajpur' ? [410 + Math.cos(k/12*Math.PI*2 + 2)*46, 50 + Math.sin(k/12*Math.PI*2 + 2)*46, 0] : [338 + (k % 3)*7, r.at[1] - 10 + Math.floor(k/3)*9, 0];
    if (typeof galleon === 'function' && SHIPS && SHIPS.troop) { galleon(fg, SHIPS.troop()); fg.scale.setScalar(.75); } else mesh(G.box, 0x6b4526, [1, .6, 3], [0, .2, 0], fg);
    fg.position.set(fx, -.26, fz); fg.rotation.y = k*1.3; g.add(fg); C.fleet.push({g:fg, ph:k});
  }
  // the civic centre is walkable too
  if (!r.sky && !C.coreArea) { C.coreArea = C.plan.core; AREAS.push(C.coreArea); }
  // new blocks pop up where you can see them
  if (anim && prev >= 0 && want > prev && Math.hypot(player.pos.x - r.at[0], player.pos.z - r.at[1]) < 70) for (const c of cells.slice(prev)) puff(c.x, c.z);
}
