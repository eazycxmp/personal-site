// ------------------------------------------------------------------ rival towns that grow in place
const RTOWN = {}, RT_STYLE = {ostberg:'austria', azul:'brazil', kumo:'china'};
const RT_COUNT = [2, 3, 4, 6, 99];   // houses and stalls standing at each tier: village, town, city, kingdom, empire
function rivalTown(r, s, anim) {
  const style = r.style; if (r.sky || !style || !STYLE_SPOTS[style] || typeof LAYOUT2 === 'undefined') return;
  const T = RTOWN[r.id] ||= {g:null, lvl:-1};
  const lvl = s.owned || DISTRICT.built[style] ? -1 : TIERS.findIndex(t => s.pow < t[0]);
  if (lvl === T.lvl) return;
  const prev = T.lvl, grew = prev >= 0 && lvl > prev;
  if (T.g) scene.remove(T.g); T.g = null; T.lvl = lvl; cityUnbox(T);
  if (lvl < 0 || !MODELS.castles || !MODELS.styles) return;
  const g = T.g = new THREE.Group(); scene.add(g);
  const L = layoutOf(style);
  if (!T.cleared) { T.cleared = true; const zs = L.map(p => p.z), xs = L.map(p => p.x); clearForest({x0:Math.min(...xs) - 5, x1:Math.max(...xs) + 5, z0:Math.min(...zs) - 5, z1:Math.max(...zs) + 5}); }   // no forest growing through the streets
  const keep = L[0], homes = L.slice(1), had = prev >= 0 ? RT_COUNT[prev] : 99;
  homes.slice(0, RT_COUNT[lvl]).forEach((p, i) => {
    const m = kitModel(p.kit, p.name, p.h); if (!m) return;
    m.rotation.y = p.south ? 0 : Math.PI; m.position.set(p.x, 0, p.z); if (p.kit === 's') recolor(m, WALLS[style], i); g.add(m); cityBox(T, m);
    if (anim && grew && i >= had) { m.userData.lvScale = m.scale.x; popIn(m); puff(p.x, p.z); }
  });
  // the landmark goes up once they are a city (half-built, scaffolded), and is finished when they become a kingdom
  if (lvl >= 2) {
    const m = kitModel(keep.kit, keep.name, keep.h * (lvl >= 3 ? 1 : .6)); if (m) {
      m.rotation.y = keep.south ? 0 : Math.PI; m.position.set(keep.x, 0, keep.z); g.add(m); cityBox(T, m);
      if (lvl === 2) for (const [dx, dz] of [[-1.6, -1.2], [1.6, -1.2], [-1.6, 1.2], [1.6, 1.2]]) mesh(G.cyl, 0xb08a5a, [.06, keep.h*.7, .06], [keep.x + dx, keep.h*.35, keep.z + dz], g);
      if (anim && grew && (prev < 2 || (prev === 2 && lvl >= 3))) { m.userData.lvScale = m.scale.x; popIn(m); puff(keep.x, keep.z); }
    }
  }
  // their banner flies over the town
  const fx = keep.x + 4, fz = keep.z + (keep.south ? 3 : -3);
  mesh(G.cyl, 0x2a2a2e, [.05, 3.4, .05], [fx, 1.7, fz], g); mesh(G.box, s.stance === 'ally' ? 0xf2c200 : 0x9a1a1a, [1, .55, .03], [fx + .52, 3.1, fz], g);
  if (anim && grew && s.met) banner(`${r.icon} ${r.n} grows into ${/^[aeiou]/.test(TIERS[lvl][1]) ? 'an' : 'a'} ${TIERS[lvl][1]}`, 'Rival towns build out just like yours. Open 🏛️ to see how strong they are.');
}
