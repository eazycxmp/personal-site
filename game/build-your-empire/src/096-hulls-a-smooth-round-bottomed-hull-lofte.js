// ------------------------------------------------------------------ hulls: a smooth, round-bottomed hull lofted from cross-sections, pointed at the bow
const HULL_GEO = {};
// half-width along the hull: full amidships, a curved point at the bow, a slightly narrowed stern
function hullW(t, stern) {
  if (t > .25) { const u = (t - .25) / .75; return Math.sqrt(Math.max(0, 1 - u*u*u*1.0)) * (1 - u*.15); }
  if (t < -.6) { const u = (-.6 - t) / .4; return 1 - u*u*(1 - stern); }
  return 1;
}
// one band of the hull between section angles a0..a1 (0 = keel, PI/2 = rail), y from keel to rail
function hullBand(L, Wd, yk, yr, a0, a1, o = {}) {
  const key = [L, Wd, yk, yr, a0, a1, o.out || 0, o.stern || .78, o.flare || 0].join(',');
  if (HULL_GEO[key]) return HULL_GEO[key];
  const NZ = 26, NA = 9, pos = [], idx = [], out = 1 + (o.out || 0), stern = o.stern ?? .78;
  for (let i = 0; i <= NZ; i++) {
    const t = -1 + 2*i/NZ, z = t*L/2, w = Wd/2*hullW(t, stern)*out;
    // the keel sweeps up toward the bow and a little toward the stern
    const kz = yk + (t > .45 ? (t - .45)/.55 : t < -.85 ? (-.85 - t)/.15*.35 : 0) * (yr - yk) * .75;
    for (let s = 0; s < 2; s++) for (let j = 0; j <= NA; j++) {
      const a = a0 + (a1 - a0)*j/NA, sx = s ? -1 : 1;
      const x = sx * w * Math.pow(Math.sin(a), .75) * (1 + (o.flare || 0)*Math.sin(a)), y = yr - (yr - kz)*Math.cos(a);
      pos.push(x, y, z);
    }
  }
  const row = (NA + 1)*2;
  for (let i = 0; i < NZ; i++) for (let s = 0; s < 2; s++) for (let j = 0; j < NA; j++) {
    const a = i*row + s*(NA + 1) + j, b = a + 1, c = a + row, d = c + 1;
    if (s) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
  }
  // a flat transom closes the stern
  if (a0 === 0 || o.cap) {
    const base = pos.length/3; pos.push(0, yr, -L/2);
    for (let s = 0; s < 2; s++) for (let j = 0; j <= NA; j++) idx.push(base, s*(NA + 1) + j + (s ? 0 : 0), s*(NA + 1) + Math.min(NA, j + 1));
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  return HULL_GEO[key] = geo;
}
function hullMesh(g, geo, color, o = {}) {
  const m = new THREE.Mesh(geo, mat(color, {side:THREE.DoubleSide, roughness:o.rough ?? .55, metalness:o.metal || 0})); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
// the classic wooden hull: dark bottom, coloured band, gilded rails
function roundHull(g, L, Wd, H, H2, T, yk = -.12, yr = .53) {
  const aMid = 1.15, aTrim = 1.32;
  hullMesh(g, hullBand(L, Wd, yk, yr, 0, aMid), H);
  hullMesh(g, hullBand(L, Wd, yk, yr, aMid, aTrim), H2);
  hullMesh(g, hullBand(L, Wd, yk, yr, aTrim, Math.PI/2), H);
  for (const a of [aMid, aTrim]) hullMesh(g, hullBand(L, Wd, yk, yr, a - .025, a + .025, {out:.012}), T, {metal:.6, rough:.35});
}

