// ------------------------------------------------------------------ ships and airliners from models
const SHIP_FLIP = 0;   // Kenney's ships already have the bow at +z, like ours
function shipModel(g, o) {
  const m = model(o.model, o.len*1.4, 'z'); if (!m) return false;
  m.rotation.y = SHIP_FLIP; m.position.y = -.34; g.add(m);
  return true;
}
// a modern steel hull: antifouling red below, the hull colour above and a painted line
function steelHull(g, L, Wd, side, line, dz = 0) {
  const h = new THREE.Group(); h.position.z = dz; g.add(h);
  hullMesh(h, hullBand(L, Wd, -.25, .62, 0, .95, {stern:.92}), 0x8a2a1e);
  hullMesh(h, hullBand(L, Wd, -.25, .62, .95, Math.PI/2, {stern:.92}), side);
  hullMesh(h, hullBand(L, Wd, -.25, .62, 1.38, 1.42, {stern:.92, out:.012}), line, {metal:.3, rough:.4});
}
function jetModel(b, big, cargo, tail) {
  const am = model(big || cargo ? 'airliner4' : 'airliner2', 4.9, 'z'); if (!am) return false;
  am.position.y = -.26; b.add(am);
  am.traverse(o => { if (!o.isMesh) return; const n = o.material.name;
    if (n === 'tail') { o.material = o.material.clone(); o.material.color.set(tail); }
    if (cargo && n === 'body') { o.material = o.material.clone(); o.material.color.set(0xd8dce2); } });
  return true;
}

