// ------------------------------------------------------------------ items
const ITEM = {
  fish:   {h:.26, icon:'🐟', sell:1, n:'Fish'},
  grilled:{h:.26, icon:'🐟', dish:1, price:3, sell:3, n:'Grilled fish'},
  log:    {h:.3,  icon:'🪵', sell:1, n:'Logs'},
  meat:   {h:.12, icon:'🥩', sell:2, n:'Meat'},
  steak:  {h:.1, icon:'🍖', dish:1, price:6, sell:5, n:'Grilled steak'},
  roast:  {h:.37, icon:'🍔', dish:1, price:15, sell:11, n:'Burger'},
  patty:  {h:.08, icon:'🥩', sell:3, n:'Patties'},
  lettuce:{h:.22, icon:'🥬', sell:2, n:'Lettuce'},
  wheat:  {h:.26, icon:'🌾', sell:1, n:'Wheat'},
  bread:  {h:.3,  icon:'🍞', dish:1, price:8, sell:8, n:'Bread'},
  beer:   {h:.24, icon:'🍺', price:7, sell:4, n:'Beer'},
  stone:  {h:.3,  icon:'🪨', sell:2, n:'Stone'},
  ore:    {h:.28, icon:'⛏️', sell:2, n:'Iron ore'},
  ingot:  {h:.16, icon:'🔩', sell:5, n:'Iron bars'},
  sword:  {h:.13, icon:'🗡️', sell:9, n:'Swords'},
  gun:    {h:.14, icon:'🔫', sell:14, n:'Rifles'},
  tools:  {h:.18, icon:'🔨', sell:12, n:'Tools'},
  scroll: {h:.16, icon:'📜', sell:10, n:'Scrolls'},
  milk:   {h:.3,  icon:'🥛', sell:2, n:'Milk'},
  icecream:{h:.3, icon:'🍦', dish:1, price:11, sell:9, n:'Ice cream'},
  tomato: {h:.22, icon:'🍅', sell:2, n:'Tomatoes'},
  pizza:  {h:.12, icon:'🍕', dish:1, price:14, sell:11, n:'Pizza'},
  sushi:  {h:.16, icon:'🍣', dish:1, price:16, sell:12, n:'Sushi'},
  coin:   {h:.07, icon:'💵', n:'Cash'},
};
const DISHES = Object.keys(ITEM).filter(k => ITEM[k].dish);
const logMats = [mat(0x8a5a2b), mat(0xe8c48a), mat(0xe8c48a)];
function fishShape(g, body, belly, fin = body, spots = 0) {
  const u = g.userData;
  u.body = mesh(G.sph, body, [.3, .12, .14], [0, 0, 0], g);
  u.belly = mesh(G.sph, belly, [.25, .07, .11], [.02, -.05, 0], g);
  const tail = new THREE.Group(); tail.position.set(-.3, 0, 0); g.add(tail);
  u.fins = [
    mesh(G.cone4, fin, [.07, .17, .025], [-.07, .05, 0], tail), mesh(G.cone4, fin, [.07, .17, .025], [-.07, -.05, 0], tail),
    mesh(G.cone4, fin, [.1, .1, .02], [-.03, .13, 0], g), mesh(G.cone4, fin, [.05, .08, .02], [.08, -.06, .12], g), mesh(G.cone4, fin, [.05, .08, .02], [.08, -.06, -.12], g),
  ];
  u.fins[0].rotation.z = Math.PI/2 + .55; u.fins[1].rotation.z = Math.PI/2 - .55; u.fins[2].rotation.z = -.35;
  u.fins[3].rotation.x = .6; u.fins[4].rotation.x = -.6;
  for (const z of [.1, -.1]) { mesh(G.sph, 0xffffff, [.035, .035, .02], [.2, .035, z], g); mesh(G.sph, 0x111111, [.02, .02, .015], [.215, .035, z*1.12], g); }
  u.spots = [[-.1, .08, .08], [.02, .1, -.07], [-.16, .05, -.09], [.08, .09, .09], [-.05, .11, 0]].map(p => mesh(G.sph, spots || body, [.022, .022, .022], p, g));
  u.spots.forEach(m => m.visible = !!spots);
}
function recolorFish(g, sp) {
  const u = g.userData;
  u.body.material = mat(sp.body); u.belly.material = mat(sp.belly);
  u.fins.forEach(m => m.material = mat(sp.fin));
  u.spots.forEach(m => { m.visible = !!sp.spots; if (sp.spots) m.material = mat(sp.spots); });
}
function buildItem(type) {
  const g = new THREE.Group();
  switch (type) {
    case 'log': { const m = mesh(G.cyl, logMats, [.15, .9, .15], [0, 0, 0], g); m.rotation.z = Math.PI/2; break; }
    case 'fish': fishShape(g, 0x7a8a4a, 0xe8dcb0, 0x5f6e38, 0x3a4020); break;
    case 'grilled': fishShape(g, 0xc8742a, 0xe7a35a, 0x9a5420);
      for (let i = -1; i <= 1; i++) mesh(G.box, 0x4a2410, [.03, .02, .2], [i*.09, .11, 0], g); break;
    case 'meat': mesh(G.sph, 0xc0463a, [.22, .16, .19], [0, 0, 0], g); mesh(G.cyl, 0xf3eadb, [.04, .3, .04], [.25, 0, 0], g).rotation.z = Math.PI/2; break;
    case 'beer': mesh(G.cyl, 0xe0a030, [.1, .2, .1], [0, 0, 0], g, {roughness:.3}); mesh(G.sph, 0xfffbe8, [.11, .06, .11], [0, .11, 0], g);
      mesh(G.box, 0xd8d0b8, [.05, .12, .03], [.12, 0, 0], g); break;
    case 'roast': mesh(G.cyl, 0xe0a050, [.25, .09, .25], [0, -.1, 0], g); mesh(G.cyl, 0x6a3418, [.25, .07, .25], [0, -.02, 0], g); mesh(G.cyl, 0x6cc040, [.27, .03, .27], [0, .03, 0], g); mesh(G.sph, 0xd08a38, [.26, .14, .26], [0, .06, 0], g); break;
    case 'patty': mesh(G.cyl, 0x6a3418, [.22, .07, .22], [0, 0, 0], g); break;
    case 'steak': mesh(G.sph, 0x7a3a18, [.25, .07, .18], [0, 0, 0], g); for (const x of [-.1, 0, .1]) mesh(G.box, 0x2a140a, [.025, .02, .3], [x, .055, 0], g).rotation.y = .5; break;
    case 'lettuce': mesh(G.sph, 0x6cc040, [.2, .14, .2], [0, 0, 0], g); break;
    case 'wheat': for (let i = 0; i < 3; i++) { const m = mesh(G.cyl, 0xe4bf55, [.06, .7, .06], [0, (i%2)*.06, (i-1)*.09], g); m.rotation.z = Math.PI/2; }
      mesh(G.cyl, 0x9a6a2a, [.13, .05, .13], [0, .03, 0], g).rotation.z = Math.PI/2; break;
    case 'bread': mesh(G.sph, 0xd59a4e, [.3, .14, .17], [0, 0, 0], g); for (let i = -1; i <= 1; i++) mesh(G.box, 0xf0d7a8, [.03, .03, .2], [i*.1, .12, 0], g); break;
    case 'stone': mesh(G.ico, 0x9a9da2, [.24, .17, .2], [0, 0, 0], g); mesh(G.ico, 0xb4b7bb, [.13, .1, .12], [.1, .08, .05], g); break;
    case 'ore': mesh(G.ico, 0x5a4a44, [.22, .16, .19], [0, 0, 0], g);
      for (const [x, z] of [[.08, .08], [-.1, .02], [.02, -.1]]) mesh(G.sph, 0xd9792b, [.045, .045, .045], [x, .12, z], g); break;
    case 'ingot': mesh(G.box, 0xc8ccd2, [.4, .13, .2], [0, 0, 0], g, {metalness:.7, roughness:.3}); break;
    case 'sword': mesh(G.box, 0xe4e8ee, [.62, .04, .09], [.08, 0, 0], g, {metalness:.7, roughness:.25});
      mesh(G.box, 0x8a6a2a, [.06, .06, .3], [-.24, 0, 0], g); mesh(G.box, 0x5a3a1a, [.16, .07, .07], [-.34, 0, 0], g); break;
    case 'gun': mesh(G.box, 0x6a4422, [.34, .07, .1], [-.16, 0, 0], g); mesh(G.box, 0x6a4422, [.12, .12, .1], [-.36, -.02, 0], g);
      mesh(G.cyl, 0x2a2c30, [.03, .56, .03], [.24, .02, 0], g, {metalness:.7, roughness:.3}).rotation.z = Math.PI/2; break;
    case 'tools': mesh(G.box, 0x8a6a3a, [.5, .06, .07], [0, 0, 0], g); mesh(G.box, 0x8f949c, [.1, .1, .26], [.22, .02, 0], g, {metalness:.6, roughness:.35}); break;
    case 'scroll': { const r = mesh(G.cyl, 0xf1e2b8, [.08, .42, .08], [0, 0, 0], g); r.rotation.z = Math.PI/2; mesh(G.box, 0xc0392b, [.05, .17, .17], [0, 0, 0], g); break; }
    case 'milk': mesh(G.cyl, 0xf4f4f4, [.12, .28, .12], [0, 0, 0], g, {roughness:.3}); mesh(G.cyl, 0x3f7cc0, [.07, .06, .07], [0, .17, 0], g); break;
    case 'icecream': mesh(G.cone, 0xe8c48a, [.12, .26, .12], [0, -.05, 0], g).rotation.x = Math.PI; mesh(G.sph, 0xff9ec0, [.14, .12, .14], [0, .12, 0], g); break;
    case 'tomato': mesh(G.sph, 0xd9302a, [.13, .11, .13], [0, 0, 0], g); mesh(G.box, 0x3f8a3a, [.1, .03, .1], [0, .1, 0], g); break;
    case 'pizza': mesh(G.cyl, 0xe0b060, [.3, .05, .3], [0, 0, 0], g); mesh(G.cyl, 0xc8402a, [.26, .02, .26], [0, .03, 0], g); for (const [x, z] of [[.1, .05], [-.08, .1], [0, -.12]]) mesh(G.cyl, 0x8a2a1e, [.04, .02, .04], [x, .05, z], g); break;
    case 'sushi': mesh(G.box, 0xf4f4f4, [.26, .1, .14], [0, 0, 0], g); mesh(G.box, 0xff8a6a, [.28, .05, .15], [0, .07, 0], g); mesh(G.box, 0x1a2a1a, [.06, .12, .15], [0, .02, 0], g); break;
    case 'coin': mesh(G.box, 0x2fa84a, [.38, .065, .2], [0, 0, 0], g); mesh(G.box, 0x86e08f, [.34, .012, .16], [0, .034, 0], g); mesh(G.box, 0xf2f8ea, [.07, .072, .206], [0, 0, 0], g); break;
  }
  return g;
}
// Each item type (and fish species) is merged once into a single mesh with vertex colours,
// so a pile of forty fish is forty draw calls instead of six hundred.
const itemCache = {};
const itemMat = new THREE.MeshStandardMaterial({vertexColors:true, roughness:.6});
function bake(group) {
  group.updateMatrixWorld(true);
  const pos = [], nor = [], col = [];
  group.traverse(o => {
    if (!o.isMesh || !o.visible) return;
    const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    geo.applyMatrix4(o.matrixWorld);
    const p = geo.attributes.position, n = geo.attributes.normal, mats = [].concat(o.material);
    const colorAt = i => { if (mats.length === 1) return mats[0].color; const gr = geo.groups.find(g => i >= g.start && i < g.start + g.count); return mats[gr ? gr.materialIndex : 0].color; };
    for (let i = 0; i < p.count; i++) { const c = colorAt(i); pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); col.push(c.r, c.g, c.b); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}
const OUTLINE_MAT = new THREE.MeshBasicMaterial({color:0x2a1a12, side:THREE.BackSide});
const OUTLINED = new Set(['steak', 'patty', 'lettuce', 'meat', 'roast', 'bread', 'log', 'fish', 'grilled', 'wheat', 'tomato', 'pizza', 'sushi', 'icecream', 'milk', 'beer']);
function propItem(type) {
  const src = MODELS.props3 && MODELS.props3.getObjectByName('item_' + type); if (!src) return null;
  const g = new THREE.Group(), m = src.clone(true); m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); g.add(m); return g;
}
function itemMesh(type, species = null) {
  const pm = species == null && MODELS.props3 && MODELS.props3.getObjectByName('item_' + type), key = type + (species ?? '') + (pm ? '+' : '');
  if (!itemCache[key]) {
    const grp = (pm && propItem(type)) || buildItem(type);
    if (species != null) recolorFish(grp, SPECIES[species]);
    itemCache[key] = bake(grp);
  }
  const m = new THREE.Mesh(itemCache[key], itemMat);
  m.castShadow = true;
  let ol = null; if (OUTLINED.has(type)) { ol = new THREE.Mesh(itemCache[key], OUTLINE_MAT); ol.scale.setScalar(1.09); m.add(ol); }
  itemInst(m, key, ol);   // drawn in one batch per kind (118c)
  scene.add(m);
  return m;
}

// A stack of item meshes laid out by a function; items fly into their slot.
class Stack {
  constructor(layout, cap = 99) { this.items = []; this.layout = layout; this.cap = cap; }
  get length() { return this.items.length; }
  count(types) { return types ? this.items.filter(i => types.includes(i.type)).length : this.items.length; }
  take(types) {
    for (let i = this.items.length - 1; i >= 0; i--)
      if (!types || types.includes(this.items[i].type)) return this.items.splice(i, 1)[0];
    return null;
  }
  push(it) { it.from = it.mesh.position.clone(); it.t = 0; this.items.push(it); }
  update(dt) {
    let y = 0;
    this.items.forEach((it, i) => {
      const L = this.layout(i, it, y); y += ITEM[it.type].h * (it.size || 1);
      if (it.t < 1) {
        it.t = Math.min(1, it.t + dt * 4.5);
        const e = 1 - Math.pow(1 - it.t, 3);
        it.mesh.position.set(it.from.x + (L.x - it.from.x)*e, it.from.y + (L.y - it.from.y)*e + Math.sin(it.t*Math.PI)*1.1, it.from.z + (L.z - it.from.z)*e);
      } else it.mesh.position.set(L.x, L.y, L.z);
      it.mesh.rotation.y = L.ry || 0;
    });
  }
}
const stacks = new Set();
function newStack(layout, cap) { const s = new Stack(layout, cap); stacks.add(s); return s; }
function spawnItem(type, pos, stack, species = null, size = null) {
  const m = itemMesh(type, species);
  let sz = size;
  if (species != null) sz = SPECIES[species].size;
  if (sz && sz !== 1) m.scale.setScalar(sz);
  m.position.copy(pos); stack.push({type, mesh:m, size:sz || 1});
}
function transfer(a, b, types) { const it = a.take(types); if (it) b.push(it); return it; }

// meshes flying somewhere and then disappearing
const flyers = [];
function flyAway(m, to, dur = .3, done) { flyers.push({m, from:m.position.clone(), to, t:0, dur, done}); }
const target = to => typeof to === 'function' ? to() : to;

function pileLayout(x, z, perRow = 2) {
  return (i, it) => {
    const h = ITEM[it.type].h, isLog = it.type === 'log';
    const per = isLog ? 3 : perRow*perRow, l = Math.floor(i / per), k = i % per, odd = l % 2;
    let a, b;
    if (isLog) { a = 0; b = (k - 1) * .32; }
    else { a = (k % perRow - (perRow-1)/2) * .48; b = (Math.floor(k / perRow) - (perRow-1)/2) * .42; }
    return {x: x + (odd ? b : a), y: .1 + l*h + h/2, z: z + (odd ? a : b), ry: (odd ? Math.PI/2 : 0) + (isLog ? Math.PI/2 : 0)};
  };
}

