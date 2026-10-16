// ------------------------------------------------------------------ the regiment field: every soldier past the 24 in the yard
const REGT = {rect:{x0:22.4, x1:41.4, z0:47, z1:73.4}, built:false, n:-1, col:0, cap:1200, colCap:360, troop:-1, ims:[], tile:null, lastMid:null, dir:[0, 1]};
const UNIFORM = [[0x8a6a4a, 0x6a5038], [0xa8322a, 0xc8a24a], [0x7a828a, 0x9aa2aa], [0xb8221a, 0x1a1a22], [0x6a6a44, 0x4a5030], [0x2e3a2e, 0x1e221e]];
const recruitCost = () => 10*(220 + 110*W.era);
function regtSlot(k) {
  // blocks of a hundred (10 x 10), three blocks across and four deep
  const b = Math.floor(k / 100), i = k % 100, bx = b % 3, bz = Math.floor(b / 3);
  return [REGT.rect.x0 + 1.1 + bx*6.25 + (i % 10)*.55, REGT.rect.z0 + 1.2 + bz*6.3 + Math.floor(i / 10)*.55];
}
function regtBuild() {
  REGT.built = true;
  const r = REGT.rect;
  clearForest({x0:r.x0, x1:r.x1, z0:r.z0, z1:r.z1}); clearForest({x0:13, x1:22.6, z0:59, z1:62.8});
  slab(0xc4a676, r.x1 - r.x0, r.z1 - r.z0, (r.x0 + r.x1)/2, (r.z0 + r.z1)/2, .004); slab(0xb98f5c, 9.6, 3, 17.8, 60.9, .006);
  AREAS.push(r, {x0:13, x1:22.8, z0:59.6, z1:62.2});
  // flags round the field and a sign at the way in
  for (const [x, z] of [[r.x0 + .4, r.z0 + .4], [r.x1 - .4, r.z0 + .4], [r.x0 + .4, r.z1 - .4], [r.x1 - .4, r.z1 - .4]]) {
    mesh(G.cyl, 0x5e3f22, [.05, 3.2, .05], [x, 1.6, z], scene); mesh(G.box, 0xf2c200, [.9, .55, .03], [x + .46, 2.9, z], scene); boxes.push({x0:x - .2, x1:x + .2, z0:z - .2, z1:z + .2});
  }
  const sign = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('REGIMENT FIELD', '#5a3a1a', '#ffffff'), toneMapped:false, side:THREE.DoubleSide}));
  sign.scale.set(2.6, .7, 1); sign.position.set(17.8, 2.2, 59.3); scene.add(sign);
  for (const x of [16.5, 19.1]) mesh(G.cyl, 0x5e3f22, [.05, 2.6, .05], [x, 1.3, 59.3], scene);
  // the soldiers themselves: five instanced parts, enough for the field and a marching column
  const N = REGT.cap + REGT.colCap, part = (geo, sc, pos) => { const g = geo.clone(); g.scale(...sc); g.translate(...pos); return g; };
  const defs = [[part(G.box, [.3, .44, .18], [0, .24, 0]), 0x2a2a30], [part(G.box, [.36, .48, .22], [0, .7, 0]), 0], [part(G.sph, [.12, .13, .12], [0, 1.08, 0]), 0xe0b08a],
    [part(G.sph, [.14, .08, .14], [0, 1.19, 0]), 1], [part(G.box, [.04, 1.15, .04], [.22, .85, .06]), 0x5a4a3a]];
  REGT.ims = defs.map(([geo, c]) => { const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({color:typeof c === 'number' && c > 1 ? c : 0x888888, roughness:.75}), N); im.count = 0; im.castShadow = true; im.frustumCulled = false; im.colorRole = c; scene.add(im); return im; });
  REGT.tile = addZone({kind:'recruit', x:21.4, z:60.9, icon:'🪖', tile:{alpha:1, size:84, label:'', fill:'rgba(60,70,40,.6)'}});
}
const REGT_O = new THREE.Object3D();
function regtPut(k, x, z, yaw, bob) { REGT_O.position.set(x, bob || 0, z); REGT_O.rotation.set(0, yaw, 0); REGT_O.updateMatrix(); for (const im of REGT.ims) im.setMatrixAt(k, REGT_O.matrix); }
function updRegiments(dt) {
  if (!started) return;
  if (!REGT.built) { if (W.unlocked.has('barracks') && regionOpen('south')) regtBuild(); else return; }
  const C = W.camp, extra = Math.max(0, (W.army || 0) - Math.min(W.army || 0, 24));
  // their uniform follows the army's age
  const tr = Math.min(5, W.troop || 0);
  if (tr !== REGT.troop) { REGT.troop = tr; const [a, b] = UNIFORM[tr]; REGT.ims[1].material.color.set(a); REGT.ims[3].material.color.set(b); }
  // the recruiting office: ten at a time
  const cost = recruitCost(), label = `+10 🛡️ · ${cost} 💵`;
  if (REGT.tile.label !== label) { REGT.tile.label = label; drawTile(REGT.tile.tc.g, '🪖', {alpha:1, size:84, label, fill:'rgba(60,70,40,.6)'}); REGT.tile.tc.t.needsUpdate = true; }
  // away at war on land: the regiments march with the army, otherwise they stand on the field
  const vis = soldiers.filter(q => q.char.g.visible && !q.down), away = C && C.away && C.type === 'land' && !(C.sail && !vis.length) && vis.length;
  const nf = away ? 0 : Math.min(REGT.cap, extra), nc = away ? Math.min(REGT.colCap, extra) : 0;
  if (nf !== REGT.n) { REGT.n = nf; for (let k = 0; k < nf; k++) { const [x, z] = regtSlot(k); regtPut(k, x, z, -Math.PI/2); } }
  if (nc) {
    const mid = vis.reduce((a, q) => [a[0] + q.pos.x/vis.length, a[1] + q.pos.z/vis.length], [0, 0]);
    if (REGT.lastMid) { const dx = mid[0] - REGT.lastMid[0], dz = mid[1] - REGT.lastMid[1], d = Math.hypot(dx, dz); if (d > .02) { const k = Math.min(1, dt*3); REGT.dir = [REGT.dir[0] + (dx/d - REGT.dir[0])*k, REGT.dir[1] + (dz/d - REGT.dir[1])*k]; } }
    REGT.lastMid = mid;
    const fighting = C.t <= 22 && C.t > 9, dl = Math.hypot(...REGT.dir) || 1, fx = REGT.dir[0]/dl, fz = REGT.dir[1]/dl, yaw = Math.atan2(fx, fz);
    for (let k = 0; k < nc; k++) {
      let x, z, y;
      if (fighting) { const row = Math.floor(k / 30), c = k % 30; x = BF.x - 10 + c*.7; z = BF.z - 4 - row*.75; y = 0; regtPut(nf + k, x, z, 0, 0); continue; }
      // a column eight wide behind the soldiers, stepping in time
      const row = Math.floor(k / 8), c = k % 8, back = 3 + row*.75, side = (c - 3.5)*.62;
      x = mid[0] - fx*back + fz*side; z = mid[1] - fz*back - fx*side; y = Math.abs(Math.sin(time*9 + row*.7))*.06;
      regtPut(nf + k, x, z, yaw, y);
    }
  } else REGT.lastMid = null;
  for (const im of REGT.ims) { im.count = nf + nc; im.instanceMatrix.needsUpdate = true; }
}
function payRecruit(zn, e) {
  if (player.zoneT < .6) return;
  const cost = recruitCost();
  if (W.coins < cost) { if (player.zoneT > 1.2) { popText(`Need ${cost} 💵`, e.pos.clone().setY(2.6), '#ffb0a0'); player.zoneT = 0; } return; }
  player.zoneT = 0; W.coins -= cost; W.upSpent += cost; W.army += 10;
  popText('+10 🛡️ soldiers', e.pos.clone().setY(2.6), '#b8d4ff'); snd(392, .1, 'square', .04);
  for (let i = 0; i < 6; i++) particle(0xf2c200, new THREE.Vector3(zn.x, 1, zn.z), new THREE.Vector3((R() - .5)*3, 2 + R()*2, (R() - .5)*3), .7, .12, {grav:1});
  refreshPads(); save();
}
