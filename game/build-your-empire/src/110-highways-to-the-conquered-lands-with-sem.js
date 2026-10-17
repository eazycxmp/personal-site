// ------------------------------------------------------------------ highways to the conquered lands, with semi-trucks
const HWY = {built:{}, sides:{}, trucks:[], t:10, g:{}, cash:null};
function hwyHeld(id) { const r = EMP.list.find(q => q.id === id), s = r && W.flags.emp && W.flags.emp[r.id]; return !!s && (s.owned || s.stance === 'ally'); }
// the paved stretch on each side runs from town to the farthest city you have a highway to
function hwyEnds(side) { const ids = Object.keys(HWY.built).filter(id => EMP.list.find(r => r.id === id).via === side); if (!ids.length) return null; const xs = ids.map(id => EMP.list.find(r => r.id === id).at[0]); return side === 'east' ? [68.6, Math.max(...xs) - 14] : [Math.min(...xs) + 14, -39]; }
function hwyPave(side) {
  if (HWY.g[side]) scene.remove(HWY.g[side]);
  const e = hwyEnds(side); if (!e) return;
  const g = HWY.g[side] = new THREE.Group(); scene.add(g);
  const [x0, x1] = e, zc = side === 'east' ? 1.9 : 12.1, L = x1 - x0, cx = (x0 + x1)/2;
  mesh(G.box, 0x34373c, [L, .05, 3.6], [cx, .012, zc], g);
  for (const dz of [-1.62, 1.62]) mesh(G.box, 0xf2f2f2, [L, .02, .08], [cx, .045, zc + dz], g);
  const dash = new THREE.InstancedMesh(G.box, mat(0xf2c200), Math.ceil(L/3)), o = new THREE.Object3D();
  for (let k = 0; k < dash.count; k++) { o.position.set(x0 + 1 + k*3, .045, zc); o.scale.set(1.4, .02, .1); o.updateMatrix(); dash.setMatrixAt(k, o.matrix); }
  g.add(dash);
  for (const dz of [-1.95, 1.95]) mesh(G.box, 0xc8ccd0, [L, .3, .08], [cx, .25, zc + dz], g, {metalness:.5, roughness:.4});
  // a green sign at the start of each highway naming where it goes
  const names = Object.keys(HWY.built).map(id => EMP.list.find(r => r.id === id)).filter(r => r.via === side).map(r => r.n.replace(/^the /, '')).join(' · ');
  const sign = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex(`${side === 'east' ? '' : '◂ '}${names}${side === 'east' ? ' ▸' : ''}`, '#1d6b3a', '#ffffff'), toneMapped:false, side:THREE.DoubleSide}));
  const sx = side === 'east' ? x0 + 6 : x1 - 6; sign.scale.set(4.4, .7, 1); sign.position.set(sx, 3.4, zc); sign.rotation.y = Math.PI/2; g.add(sign);
  for (const dz of [-2, 2]) mesh(G.box, 0x8a8f96, [.1, 3.8, .1], [sx, 1.9, zc + dz], g, {metalness:.6});
}
function hwyBuild(id, anim) {
  const r = EMP.list.find(q => q.id === id); if (!r || HWY.built[id]) return;
  HWY.built[id] = true; hwyPave(r.via);
  if (!HWY.cash) HWY.cash = makeCash('freight', 62, 9.6);
  if (anim) banner(`🛣️ The highway to ${r.n}!`, 'Semi-trucks run both ways now. Freight takings pile up by the east-road interchange.');
}
function semiTruck(col) {
  const g = new THREE.Group();
  mesh(G.box, col, [.9, .9, 1], [0, .7, 1.3], g); mesh(G.box, 0x2a3a4a, [.85, .35, .05], [0, .95, 1.81], g);
  mesh(G.box, 0xe8e8e8, [.95, 1.1, 2.8], [0, .85, -.7], g); mesh(G.box, 0x2a2a2a, [.8, .15, 3.9], [0, .25, -.2], g);
  for (const z of [1.4, -.2, -1.6]) for (const sx of [-.48, .48]) mesh(G.cyl, 0x1a1a1a, [.24, .14, .24], [sx, .24, z], g).rotation.z = Math.PI/2;
  scene.add(g); return g;
}
function updHighways(dt) {
  const ids = Object.keys(HWY.built); if (!ids.length) return;
  // trucks: a few per highway, each lane its own way, from town to the city and back
  const want = ids.reduce((a, id) => a + 3 + Math.min(3, Math.floor(es(EMP.list.find(r => r.id === id)).pow/120)), 0);
  if (HWY.trucks.length < Math.min(24, want) && R() < dt*1.5) {
    const id = ids[R()*ids.length|0], r = EMP.list.find(q => q.id === id), e = [68.6, r.at[0] - 14], w = [r.at[0] + 14, -39], [a, b] = r.via === 'east' ? e : w;
    const out = R() < .5, zc = r.via === 'east' ? 1.9 : 12.1, lane = zc + (out === (r.via === 'east') ? -.8 : .8);
    const g = semiTruck([0xc8322a, 0x2a5aa8, 0x3a8a4a, 0xe8a020][R()*4|0]); const x0 = out ? (r.via === 'east' ? a : b) : (r.via === 'east' ? b : a), x1 = out ? (r.via === 'east' ? b : a) : (r.via === 'east' ? a : b);
    g.position.set(x0, 0, lane); g.rotation.y = x1 > x0 ? Math.PI/2 : -Math.PI/2; HWY.trucks.push({g, x1, sp:9 + R()*3});
  }
  for (let k = HWY.trucks.length - 1; k >= 0; k--) {
    const T = HWY.trucks[k], p = T.g.position, d = T.x1 - p.x;
    if (Math.abs(d) < .5) { scene.remove(T.g); HWY.trucks.splice(k, 1); continue; }
    p.x += Math.sign(d)*Math.min(Math.abs(d), T.sp*dt);
  }
  // the business they bring
  if ((HWY.t -= dt) <= 0) {
    HWY.t = 10;
    const v = Math.round(ids.reduce((a, id) => { const r = EMP.list.find(q => q.id === id), st = es(r), tier = TIERS.findIndex(t => st.pow < t[0]); return a + (500 + 220*W.era)*(1 + Math.max(0, tier))*(st.owned ? 1.5 : 1); }, 0));
    addCash(HWY.cash, v, {x:66, z:6});
    if (Math.hypot(player.pos.x - 62, player.pos.z - 9.6) < 40) popText(`🚛 +${v.toLocaleString()} freight`, new THREE.Vector3(62, 3, 9.6), '#ffe06b');
  }
}
