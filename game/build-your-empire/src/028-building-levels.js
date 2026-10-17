// ------------------------------------------------------------------ building levels
// A small upgrade tile next to each producer: every level works 30% faster and keeps a bigger pile.
// upgrade tiles sit outside the plot each building grows into, on the side facing the camera
const UPG = {
  grill:{base:60, at:[-4.2, -1.7]}, spit:{base:100, at:[.4, -5]}, oven:{base:150, at:[-1.8, 4.95]}, lodge:{base:120, at:[-7.6, -9.3]},
  field:{base:120, at:[-.7, 12.4]}, smelter:{base:300, at:[6.5, -37.4]}, workshop:{base:400, at:[7.1, -12.1]}, digger:{base:400, at:[11.9, -42.75]},
  smith:{base:400, at:[-5, 69.95]}, library:{base:500, at:[45.6, -5.2]}, field2:{base:250, at:[34.8, 67.5]}, field3:{base:250, at:[34.8, 74.5]},
  oven2:{base:300, at:[45.5, 65.6]}, brewery:{base:400, at:[46.8, 13]},
};
const MAXLV = 5;
const lvl = id => Math.min(MAXLV, W.levels[id] || 1);
const lvlMult = id => 1 + .675*(lvl(id) - 1);
const upCost = id => Math.round(UPG[id].base * Math.pow(2.8, lvl(id) - 1));
const upZones = {};
const badges = {};
const BADGE_Y = {library:5.8, smelter:4.2, workshop:3.7, brewery:3.5, smith:3.6, lodge:3.6, digger:3.4, field:1.6, field2:1.6, field3:1.6};
function lvlVisual(id, anim) {
  const st = ST[id], L = lvl(id); if (!st || !st.body) return;
  st.body.userData.lvShown = L;
  st.body.userData.lvScale = 1 + .025*(L - 1);
  if (anim) popIns.push({obj:st.body, t:0}); else st.body.scale.setScalar(st.body.userData.lvScale);
  addons(id);
  if (L < 2) return;
  let b = badges[id];
  if (!b) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 96;
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    b = badges[id] = new THREE.Sprite(new THREE.SpriteMaterial({map:t, depthTest:false, toneMapped:false}));
    b.userData.c = c; b.scale.set(1.5, .56, 1); b.renderOrder = 5; scene.add(b);
  }
  const g = b.userData.c.getContext('2d'), max = L >= MAXLV;
  g.clearRect(0, 0, 256, 96); roundRect(g, 6, 8, 244, 80, 38);
  g.fillStyle = max ? '#f2c200' : 'rgba(30,34,50,.88)'; g.fill();
  g.font = `900 ${max ? 42 : 50}px ui-rounded,"Trebuchet MS",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = max ? '#3a2a00' : '#ffd84a'; g.fillText(max ? `★ Lv ${L} MAX` : `★ Lv ${L}`, 128, 50);
  b.material.map.needsUpdate = true;
  const pos = st.body.position; b.position.set(pos.x, BADGE_Y[id] || 3, pos.z);
  if (anim) for (let i = 0; i < 18; i++) particle(i % 2 ? 0xffd84a : 0xffffff, new THREE.Vector3(pos.x, 1.4, pos.z), new THREE.Vector3((R() - .5)*5, 3 + R()*3, (R() - .5)*5), .9, .12, {grav:1});
}
// a building from the second Blender kit, scaled to a width (x) and standing on the ground
function kit2(name, width) {
  const src = MODELS.b2 && MODELS.b2.getObjectByName(name); if (!src) return null;
  const m = src.clone(true); m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); m.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(m), g = new THREE.Group(); m.position.y = -bb.min.y; g.add(m); g.scale.setScalar(width / (bb.max.x - bb.min.x));
  m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
function libraryStage(stage, anim) {
  const st = ST.library; if (!st) return;
  if (st.body) { scene.remove(st.body); const i = FADERS.findIndex(f => f.g === st.body); if (i >= 0) FADERS.splice(i, 1); }
  const g = new THREE.Group(); g.position.set(45.5, 0, -9.6); scene.add(g);
  if (stage === 2) {
    // a university: a long hall of columns and a clock tower
    mesh(G.box, 0xe8e0cc, [4, .35, 3], [0, .17, 0], g); mesh(G.box, 0xd9cdb0, [3.8, 2.4, 2.6], [0, 1.55, 0], g);
    for (let i = 0; i < 6; i++) mesh(G.cyl, 0xf6f1e6, [.12, 2.4, .12], [-1.65 + i*.66, 1.55, 1.4], g);
    const ped = mesh(G.cone4, 0xc9b88a, [1, .8, 1], [0, 3.15, .9], g); ped.rotation.y = Math.PI/4; ped.scale.set(2.8, .8, .6);
    mesh(G.box, 0xd9cdb0, [1, 2.6, 1], [0, 3.6, -.4], g);
    const face = new THREE.Mesh(G.cyl, new THREE.MeshBasicMaterial({color:0xfdfaf0})); face.scale.set(.32, .04, .32); face.rotation.x = Math.PI/2; face.position.set(0, 4.3, .12); g.add(face);
    mesh(G.box, 0x1a1a1a, [.03, .24, .03], [0, 4.38, .15], g); mesh(G.box, 0x1a1a1a, [.18, .03, .03], [.07, 4.3, .15], g);
    mesh(G.cone4, 0x5a6a8a, [.85, 1.1, .85], [0, 5.45, -.4], g).rotation.y = Math.PI/4;
    st.name = 'university'; st.t = 2.2;
  } else if (kit2('lab', 4.4)) {
    // a research lab out of science fiction: glowing specimen tanks, cyan light strips and a domed roof
    g.add(kit2('lab', 4.4)); st.name = 'research lab'; st.t = 1.4;
  } else {
    // a research lab: glass, an observatory dome and a radio dish
    mesh(G.box, 0xdfe4ea, [4, .3, 3], [0, .15, 0], g);
    mesh(G.box, 0x8fc6e8, [3.6, 2.6, 2.6], [0, 1.6, 0], g, {metalness:.5, roughness:.15});
    for (let f = 1; f < 3; f++) mesh(G.box, 0xf4f6f8, [3.66, .08, 2.66], [0, .3 + f*.9, 0], g);
    mesh(G.box, 0xf4f6f8, [3.7, .2, 2.7], [0, 2.95, 0], g);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(.9, 16, 10, 0, Math.PI*2, 0, Math.PI/2), mat(0xf4f6f8, {metalness:.3})); dome.position.set(-.8, 3.05, 0); g.add(dome);
    mesh(G.box, 0x2a2e36, [.2, .9, .1], [-.8, 3.6, .55], g);
    const dish = mesh(G.cone, 0xe8ecf0, [.55, .25, .55], [1.1, 3.6, -.3], g); dish.rotation.x = -2.2;
    mesh(G.cyl, 0x9aa0a8, [.05, .6, .05], [1.1, 3.25, -.3], g);
    for (let i = 0; i < 3; i++) mesh(G.box, 0x23305a, [.7, .04, .5], [.5 + i*.0, 3.07, .9 - i*.0], g).position.x = .2 + i*.75;
    st.name = 'research lab'; st.t = 1.4;
  }
  fader(g, 4.2, stage === 2 ? 5.6 : 4);
  st.body = g; st.body.userData.lvShown = 0;
  refreshUpgrades();
  if (anim) { popIn(g); shakeCam(.4); puff(45.5, -9.6); }
}
function refreshUpgrades() {
  for (const [id, u] of Object.entries(UPG)) {
    const st = ST[id]; if (!st) continue;
    st.baseCap ??= st.outStack.cap;
    st.outStack.cap = st.baseCap + 6*(lvl(id) - 1);
    if (st.body && st.body.userData.lvShown !== lvl(id)) lvlVisual(id, false);
    let z = upZones[id];
    if (lvl(id) >= MAXLV) { if (z) { removeZone(z); delete upZones[id]; } continue; }
    if (!z) { z = upZones[id] = addZone({kind:'upgrade', st:id, x:u.at[0], z:u.at[1], w:1.5, d:1.5, icon:'⬆️', tile:{}}); z.key = ''; }
    const paid = W.upPaid[id] || 0, cost = upCost(id), key = lvl(id) + ':' + paid;
    if (z.key !== key) { z.key = key; drawTile(z.tc.g, '⬆️', {cost:cost - paid, cur:'💵', prog:paid/cost, title:`Lv ${lvl(id) + 1}`}); z.tc.t.needsUpdate = true; }
  }
}
function payUpgrade(zn, e) {
  const id = zn.st, cost = upCost(id), paid = W.upPaid[id] || 0;
  if (W.coins <= 0) { e.tick = .3; return; }
  const amt = Math.min(cost - paid, W.coins, Math.max(1, Math.ceil(cost / 24)));
  W.coins -= amt; W.upSpent += amt; W.upPaid[id] = paid + amt; e.tick = .045;
  const m = itemMesh('coin'); m.position.set(e.pos.x, 1.6, e.pos.z); flyAway(m, new THREE.Vector3(zn.x, .1, zn.z), .25);
  snd(800 + paid/cost*500, .03, 'triangle', .025);
  if (W.upPaid[id] >= cost) {
    W.upPaid[id] = 0; W.levels[id] = lvl(id) + 1; W.flags.upgrades = (W.flags.upgrades || 0) + 1;
    lvlVisual(id, true);
    puff(zn.x, zn.z); popText(`${ST[id].name} Lv ${lvl(id)}!`, new THREE.Vector3(zn.x, 2.8, zn.z), '#b8f0a0');
    shakeCam(.25); snd(523, .12, 'triangle', .05); setTimeout(() => snd(1046, .15, 'triangle', .05), 90);
    save();
  }
  refreshUpgrades();
}

