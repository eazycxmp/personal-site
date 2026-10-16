// ------------------------------------------------------------------ stations
const fires = [], smokers = [], popIns = [], fireLights = [];
function fire(parent, x, y, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); parent.add(g);
  [0xff5a1f, 0xff9d2e, 0xffd75e].forEach((c, i) => {
    const m = new THREE.Mesh(G.cone, new THREE.MeshBasicMaterial({color:c, toneMapped:false}));
    m.scale.set(.35 - i*.09, .9 - i*.2, .35 - i*.09); m.position.y = .4 - i*.08; g.add(m);
    fires.push({m, base:.9 - i*.2, ph:R()*6});
  });
  const light = new THREE.PointLight(0xff9a3c, 3, 6, 1.5); light.position.y = .8; g.add(light); fireLights.push(light);
  return g;
}
// Tall buildings fade out while the player walks behind them, so the camera never loses you.
const FADERS = [];
function fader(g, w, h) {
  const mats = [];
  g.traverse(o => { if (o.isMesh) { const orig = o.material; o.material = Array.isArray(orig) ? orig.map(m => m.clone()) : orig.clone(); if (orig === WIN) winMats.push(o.material); [].concat(o.material).forEach(m => mats.push(m)); } });
  FADERS.push({g, w, h, mats, op:1});
}
function updFaders(dt) {
  for (const f of FADERS) {
    const x = f.g.position.x, z = f.g.position.z;
    // is the building between the camera and the player?
    const dx = x - player.pos.x, dz = z - player.pos.z;
    const along = dx*Math.sin(CAM_YAW) + dz*Math.cos(CAM_YAW), lat = dx*Math.cos(CAM_YAW) - dz*Math.sin(CAM_YAW);
    const behind = along > -.5 && along < f.h*.9 + 2.5 && Math.abs(lat) < f.w*.6 + 1;
    const want = behind ? .28 : 1;
    if (Math.abs(f.op - want) < .01) continue;
    f.op += (want - f.op) * Math.min(1, dt*8);
    for (const m of f.mats) { m.transparent = f.op < .99; m.opacity = f.op; m.depthWrite = f.op >= .99; }
  }
}
const ST = {};
// A station converts `in` to `out`, generates `gen` by itself, or just holds a `pile`.
function station(id, o) {
  const s = ST[id] = {id, prog:0, busy:false, ...o};
  const outType = o.out || o.gen || o.pile;
  s.outStack = newStack(pileLayout(o.outZ[0], o.outZ[1]), o.outCap || 24);
  addZone({kind:'out', st:id, stack:s.outStack, x:o.outZ[0], z:o.outZ[1], icon:ITEM[outType].icon, tile:{alpha:1, size:92, label:ITEM[outType].n}});
  if (o.in) {
    s.inStack = newStack(pileLayout(o.inZ[0], o.inZ[1]), o.inCap || 20);
    addZone({kind:'in', st:id, x:o.inZ[0], z:o.inZ[1], icon:ITEM[o.in].icon, tile:{alpha:1, size:92, label:'Into ' + o.name}});
  }
  return s;
}
function popIn(obj) { obj.scale.setScalar(.01); popIns.push({obj, t:0}); }
function fieldAt(x, z, anim) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g); fieldAt.last = g;
  mesh(G.box, 0x8a6236, [5.2, .12, 2.6], [0, .06, 0], g);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) mesh(G.cone, 0xe4bf55, [.14, .7, .14], [-2.35 + c*.43, .45, -.95 + r*.63], g);
  if (anim) popIn(g);
}
function ovenAt(x, z, anim) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g); ovenAt.last = g;
  mesh(G.cyl, 0x9a958c, [1.1, .4, 1.1], [0, .2, 0], g);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10, 0, Math.PI*2, 0, Math.PI/2), mat(0xb8682f));
  dome.position.y = .4; dome.castShadow = true; g.add(dome);
  mesh(G.box, 0x2a1408, [.6, .45, .3], [0, .65, .88], g);
  const glow = new THREE.Mesh(G.box, new THREE.MeshBasicMaterial({color:0xff8a2a, toneMapped:false})); glow.scale.set(.45, .3, .05); glow.position.set(0, .62, 1.0); g.add(glow);
  mesh(G.cyl, 0x8a4a2a, [.16, .7, .16], [.45, 1.4, -.3], g);
  smokers.push({x:x + .45, y:1.8, z:z - .3});
  if (anim) popIn(g);
}
// the base: towers, tents, depot, drill yard and (with tanks) a motor pool; the towers and barracks upgrade with the castle
const BASE = {built:false, towers:[], hq:null, tier:0, pool:null, tanks:[]};
const baseTierNow = () => W.unlocked.has('castle4') ? 3 : W.unlocked.has('castle2') ? 2 : 1;
function baseTier(anim) {
  const t = baseTierNow(); if (t === BASE.tier) return; BASE.tier = t;
  if (BASE.hq) { BASE.hq.clear(); const m = kit2('barracks' + t, 5.4); if (m) { m.rotation.y = Math.PI; BASE.hq.add(m); } }
  for (const tw of BASE.towers) { tw.clear(); const m = kit2('tower' + t, 2.2); if (m) tw.add(m); }
  if (anim && t > 1) banner(t === 2 ? '🏯 The base is rebuilt in steel and concrete' : '🛡️ An armoured base', 'Towers, barracks and bunkers upgrade with your castle.');
}
function baseCamp(anim) {
  if (BASE.built || !MODELS.b2) return; BASE.built = true;
  clearForest({x0:-10.3, x1:13.4, z0:46, z1:74});
  // the drill yard: a sand square with a low fence
  slab(0xd8c49a, 7.2, 8.6, -2.8, 67.6, .006);
  for (let x = -6.4; x <= .8; x += .9) for (const z of [63.3, 71.9]) mesh(G.cyl, 0x6b4526, [.05, .7, .05], [x, .35, z], scene);
  for (let z = 63.3; z <= 71.9; z += .9) mesh(G.cyl, 0x6b4526, [.05, .7, .05], [-6.4, .35, z], scene);
  // tents, a depot, towers on the corners
  for (const z of [51, 57, 63]) { const t = kit2('armyTent', 3.4); if (t) { t.position.set(-7.8, 0, z); t.rotation.y = -Math.PI/2; scene.add(t); boxes.push({x0:-9.4, x1:-6.2, z0:z - 1.6, z1:z + 1.6}); if (anim) popIn(t); } }
  const d = kit2('depot', 3.4); if (d) { d.position.set(8.4, 0, 58.6); scene.add(d); boxes.push({x0:6.8, x1:10, z0:57.4, z1:59.8}); }
  for (const [x, z] of [[-8.6, 47.4], [11.6, 47.4], [-8.6, 72.8], [11.8, 72.8]]) { const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g); BASE.towers.push(g); boxes.push({x0:x - .9, x1:x + .9, z0:z - .9, z1:z + .9}); }
  // a fence line along the north edge, open where the road comes in
  for (let x = -10; x <= 13; x += 1.1) if (Math.abs(x - 3) > 2.4) { mesh(G.box, 0x6a6e70, [.08, 1.1, .08], [x, .55, 46.3], scene); mesh(G.box, 0x8a8e90, [1.1, .05, .05], [x + .55, 1.0, 46.3], scene); }
  BASE.tier = 0; baseTier(false);
  if (W.unlocked.has('tanks')) motorPool(false);
}
// the motor pool: a shed with bays where the tank division parks between fights
function motorPool(anim) {
  if (BASE.pool || !MODELS.b2) return;
  const g = BASE.pool = kit2('motorPool', 7); if (!g) return; g.position.set(9.2, 0, 52); g.rotation.y = Math.PI; scene.add(g);
  boxes.push({x0:5.7, x1:12.7, z0:49.6, z1:50.9});
  for (let i = 0; i < 3; i++) { const t = model('tank', 2.4, 'z'); if (!t) break; t.position.set(6.9 + i*2.3, 0, 52.8); scene.add(t); BASE.tanks.push(t); }
  if (anim) { popIn(g); banner('🪖 The motor pool', 'Your tanks park here and roll out when danger comes.'); }
}
const buildFx = {
  grill(anim) {
    const g = new THREE.Group(); g.position.set(-4.2, 0, 1); scene.add(g);
    for (let i = 0; i < 10; i++) { const a = i/10*Math.PI*2; mesh(G.box, i % 2 ? 0x8f8b84 : 0xa9a49b, [.4, .32, .3], [Math.cos(a)*.85, .16, Math.sin(a)*.85], g).rotation.y = -a; }
    mesh(G.cyl, 0x3a2a1c, [.75, .05, .75], [0, .03, 0], g);
    mesh(G.cyl, logMats, [.12, 1.2, .12], [0, .15, 0], g).rotation.set(0, .6, Math.PI/2);
    mesh(G.cyl, logMats, [.12, 1.2, .12], [0, .15, 0], g).rotation.set(0, -.6, Math.PI/2);
    fire(g, 0, .1, 0);
    [[-.7, -.7], [.7, -.7], [-.7, .7], [.7, .7]].forEach(([x, z]) => mesh(G.cyl, 0x3b3b3b, [.04, 1, .04], [x, .5, z], g));
    for (let i = -3; i <= 3; i++) mesh(G.box, 0x2b2b2b, [1.5, .04, .04], [0, 1, i*.2], g);
    smokers.push({x:-4.2, y:1.2, z:1});
    ST.grill.body = g; if (anim) popIn(g);
  },
  spit(anim) {
    const g = new THREE.Group(); g.position.set(-4.2, 0, -5); scene.add(g);
    const pg = MODELS.props3 && MODELS.props3.getObjectByName('prop_grill');
    if (pg) {
      const m = pg.clone(true); m.position.set(0, 0, 0); m.scale.setScalar(.9); m.traverse(q => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); g.add(m);
      ST.spit.meat = new THREE.Object3D(); smokers.push({x:-4.2, y:1.2, z:-5});
      ST.spit.body = g; if (anim) popIn(g); return;
    }
    mesh(G.cyl, 0x3a2a1c, [.7, .05, .7], [0, .03, 0], g);
    for (let i = 0; i < 8; i++) { const a = i/8*Math.PI*2; mesh(G.box, 0x9a958c, [.35, .28, .3], [Math.cos(a)*.75, .14, Math.sin(a)*.75], g).rotation.y = -a; }
    fire(g, 0, .1, 0, .9);
    [-1, 1].forEach(sx => mesh(G.cyl, 0x5e3f22, [.07, 1.5, .07], [sx*.95, .75, 0], g));
    mesh(G.cyl, 0x444444, [.04, 2.1, .04], [0, 1.35, 0], g).rotation.z = Math.PI/2;
    ST.spit.meat = mesh(G.sph, 0x8e4a1c, [.55, .32, .36], [0, 1.35, 0], g);
    smokers.push({x:-4.2, y:1.4, z:-5});
    ST.spit.body = g; if (anim) popIn(g);
  },
  oven(anim) {
    const g = new THREE.Group(); g.position.set(-4.2, 0, 7); scene.add(g);
    const po = MODELS.props3 && MODELS.props3.getObjectByName('prop_oven');
    if (po) { const m = po.clone(true); m.position.set(0, 0, 0); m.scale.setScalar(.82); m.traverse(q => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); g.add(m); smokers.push({x:-4.2, y:2.1, z:6.9}); ST.oven.body = g; if (anim) popIn(g); return; }
    mesh(G.cyl, 0x9a958c, [1.1, .4, 1.1], [0, .2, 0], g);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10, 0, Math.PI*2, 0, Math.PI/2), mat(0xc0703f));
    dome.position.y = .4; dome.castShadow = true; g.add(dome);
    mesh(G.box, 0x2a1408, [.6, .45, .3], [0, .65, .88], g);
    const glow = new THREE.Mesh(G.box, new THREE.MeshBasicMaterial({color:0xff8a2a})); glow.scale.set(.45, .3, .05); glow.position.set(0, .62, 1.0); g.add(glow);
    mesh(G.cyl, 0x8a4a2a, [.16, .7, .16], [.45, 1.4, -.3], g);
    smokers.push({x:-3.75, y:1.8, z:6.7});
    ST.oven.body = g; if (anim) popIn(g);
  },
  lodge(anim) {
    const g = new THREE.Group(); g.position.set(-4.2, 0, -10.6); scene.add(g);
    mesh(G.box, 0x8a5a2b, [2.5, 1.7, 1.8], [0, .85, 0], g);
    for (let i = 0; i < 5; i++) mesh(G.cyl, logMats, [.2, 2.8, .2], [0, .22 + i*.36, .92], g).rotation.z = Math.PI/2;
    const roof = mesh(G.cone4, 0x6b3a22, [2.3, 1.3, 1.9], [0, 2.4, 0], g); roof.rotation.y = Math.PI/4;
    mesh(G.box, 0x2a1408, [.6, 1, .1], [0, .5, 1.05], g);
    ST.lodge.body = g; fader(g, 3, 3); if (anim) popIn(g);
  },
  field(anim) {
    const g = new THREE.Group(); g.position.set(-4.2, 0, 12.1); scene.add(g);
    mesh(G.box, 0x8a6236, [5.2, .12, 2.6], [0, .06, 0], g);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++)
      mesh(G.cone, 0xe4bf55, [.14, .7, .14], [-2.35 + c*.43, .45, -.95 + r*.63], g);
    ST.field.body = g; if (anim) popIn(g);
  },
  table() {
    const g = new THREE.Group(); g.position.set(4, 0, 1); scene.add(g);
    mesh(G.box, 0xa8733f, [1.4, .14, 5.2], [0, .85, 0], g);
    for (let i = -1; i <= 1; i++) mesh(G.box, 0x8a5a2b, [1.42, .03, .05], [0, .93, i*1.6], g);
    [[-.55, -2.3], [.55, -2.3], [-.55, 2.3], [.55, 2.3]].forEach(([x, z]) => mesh(G.box, 0x6b4526, [.14, .85, .14], [x, .42, z], g));
  },
  logs(anim) {
    const g = new THREE.Group(); g.position.set(3.4, 0, -6.4); scene.add(g);
    mesh(G.cyl, logMats, [.45, .5, .45], [0, .25, 0], g);
    const axe = new THREE.Group(); axe.position.set(0, .5, 0); axe.rotation.z = .5; g.add(axe);
    mesh(G.box, 0x7a5a33, [.06, .8, .06], [0, .4, 0], axe); mesh(G.box, 0x9aa3ad, [.3, .18, .04], [.12, .75, 0], axe, {metalness:.6});
    if (anim) popIn(g);
  },
};
const HUTS = {hut1:{x:8.6, z:6.2, tile:[8.6, 4.1]}, hut2:{x:11.4, z:6.2, tile:[11.4, 4.1]}, hut3:{x:12, z:9, tile:[12, 11.25]}};
const HUT_STAGES = [null, {n:'Hut', icon:'🛖'}, {n:'Inn', icon:'🏡'}, {n:'Hotel', icon:'🏨'}];
const hutStage = {};
function signTex(text, bg, fg) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 80; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 256, 80); g.fillStyle = fg; g.font = '900 54px ui-rounded,"Trebuchet MS",sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 42);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function palm(parent, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  for (let i = 0; i < 6; i++) mesh(G.cyl, 0x9a7a52, [.09 - i*.008, .55, .09 - i*.008], [i*.05, .27 + i*.52, 0], g).rotation.z = -.05*i;
  for (let i = 0; i < 7; i++) {
    const f = new THREE.Group(); f.position.set(.3, 3.2, 0); f.rotation.y = i/7*Math.PI*2; g.add(f);
    mesh(G.box, i % 2 ? 0x3fae4a : 0x2f8f3a, [1.1, .04, .26], [.5, -.18, 0], f).rotation.z = -.35;
  }
  for (const [a, b] of [[.12, .12], [-.1, .08]]) mesh(G.sph, 0x6a4a2a, [.08, .08, .08], [.3 + a, 3.05, b], g);
}
function buildHut(key, stage, anim) {
  const H = HUTS[key], {x, z} = H;
  if (H.g) { scene.remove(H.g); const i = FADERS.findIndex(f => f.g === H.g); if (i >= 0) FADERS.splice(i, 1); }
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  if (stage === 1) {
    mesh(G.cyl, 0xd9b98a, [1.05, 1.2, 1.05], [0, .6, 0], g);
    mesh(G.cone, 0xb88a3a, [1.45, 1.3, 1.45], [0, 1.85, 0], g);
    mesh(G.box, 0x4a3020, [.5, .8, .1], [0, .4, 1.03], g);
  } else if (stage === 2) {
    // an inn: two storeys of timber and plaster with a hanging sign
    mesh(G.box, 0xe8dcc0, [2.1, 1.4, 1.9], [0, .7, 0], g); mesh(G.box, 0x7a4a2a, [2.2, .14, 2], [0, 1.45, 0], g);
    mesh(G.box, 0xe8dcc0, [2.1, 1.1, 1.9], [0, 2.05, 0], g); roofOn(g, 2.5, 2.3, .95, 3.05, 0x8a3a2a);
    for (const xx of [-1.05, 1.05]) mesh(G.box, 0x7a4a2a, [.1, 2.6, .1], [xx, 1.3, .96], g);
    mesh(G.box, 0x4a3020, [.55, .9, .08], [0, .45, .98], g);
    windows(g, 2.1, 1.9, 1.5, 1, 1.1, 3);
    const sign = new THREE.Mesh(G.box, [mat(0x7a4a2a), mat(0x7a4a2a), mat(0x7a4a2a), mat(0x7a4a2a), new THREE.MeshBasicMaterial({map:signTex('INN', '#7a4a2a', '#ffe9a8'), toneMapped:false}), mat(0x7a4a2a)]);
    sign.scale.set(.9, .3, .06); sign.position.set(.5, 1.75, 1.15); g.add(sign);
  } else {
    // a Los Angeles hotel: pastel stucco, rounded art-deco corners, a pink neon sign and palm trees
    const tint = {hut1:0xf4b6c2, hut2:0xa8e6d4, hut3:0xffd3a5}[key];
    mesh(G.box, tint, [2.2, 4.4, 2], [0, 2.2, 0], g);
    for (const xx of [-1.1, 1.1]) mesh(G.cyl, tint, [.38, 4.4, .38], [xx, 2.2, .7], g);
    for (let f = 1; f <= 4; f++) mesh(G.box, 0xfdf6ee, [2.32, .09, 2.1], [0, f*1.05, 0], g);
    windows(g, 2.2, 2, .4, 4, 1.05, 3);
    mesh(G.box, 0xfdf6ee, [1.2, .7, 1.1], [0, 4.75, 0], g); mesh(G.box, tint, [.6, .5, .6], [0, 5.35, 0], g);
    for (const xx of [-.42, 0, .42]) mesh(G.box, 0xfdf6ee, [.08, .9, .3], [xx, 5.15, .52], g);
    mesh(G.box, 0x2a1a2a, [.65, .95, .08], [0, .48, 1.02], g);
    const neon = new THREE.Mesh(G.box, [mat(0x2a1a2a), mat(0x2a1a2a), mat(0x2a1a2a), mat(0x2a1a2a), new THREE.MeshBasicMaterial({map:signTex('HOTEL', '#2a0a1e', '#ff4fb0'), toneMapped:false}), mat(0x2a1a2a)]);
    neon.scale.set(.5, 2.2, .08); neon.position.set(1.32, 2.9, .75); neon.rotation.z = Math.PI/2; g.add(neon);
    const palmAt = {hut1:[-1.6, 1.4], hut2:[-1.6, 1.4], hut3:[1.35, 1.25]}[key];
    palm(g, palmAt[0], palmAt[1]);
  }
  fader(g, 2.5, stage === 3 ? 5 : stage === 2 ? 3.6 : 2.5);
  H.g = g; hutStage[key] = stage;
  const c = circles.find(c => c.x === x && c.z === z); if (c) c.r = stage === 1 ? 1.15 : 1.3;
  if (anim) { popIn(g); shakeCam(.3); puff(x, z); }
}
function hut(x, z, anim) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  mesh(G.cyl, 0xd9b98a, [1.05, 1.2, 1.05], [0, .6, 0], g);
  mesh(G.cone, 0xb88a3a, [1.45, 1.3, 1.45], [0, 1.85, 0], g);
  mesh(G.box, 0x4a3020, [.5, .8, .1], [0, .4, 1.03], g);
  circles.push({x, z, r:1.15});
  fader(g, 2.4, 2.5);
  addHome(x, z, 'hut');
  if (anim) popIn(g);
}
// The palisade is rebuilt whenever a region opens, leaving a gate in that side.
let fenceGroup = null;
const GAPS = {n:null, s:null};
function fence(anim) {
  if (fenceGroup) scene.remove(fenceGroup);
  for (let i = boxes.length - 1; i >= 0; i--) if (boxes[i].fence) boxes.splice(i, 1);
  const inGap = (side, v) => side === 'e' ? (v > -.6 && v < 3.6) : (GAPS[side] && v > GAPS[side][0] && v < GAPS[side][1]);
  const stone = W.era >= 4;
  const g = new THREE.Group(); scene.add(g);
  if (!stone) {
    const pts = [];
    for (let x = -10.6; x <= 14; x += .42) { if (!inGap('n', x)) pts.push([x, -13.5]); if (!inGap('s', x)) pts.push([x, 14.5]); }
    for (let z = -13.5; z <= 14.5; z += .42) if (!inGap('e', z)) pts.push([14, z]);
    const posts = new THREE.InstancedMesh(G.cyl, logMats[0], pts.length), tips = new THREE.InstancedMesh(G.cone, mat(0xe8c48a), pts.length);
    const o = new THREE.Object3D();
    pts.forEach(([x, z], i) => {
      const h = 1.5 + Math.sin(x*3.1 + z*1.7)*.15;
      o.position.set(x, h/2, z); o.scale.set(.2, h, .2); o.updateMatrix(); posts.setMatrixAt(i, o.matrix);
      o.position.set(x, h + .14, z); o.scale.set(.2, .3, .2); o.updateMatrix(); tips.setMatrixAt(i, o.matrix);
    });
    g.add(posts, tips); posts.castShadow = tips.castShadow = true;
  } else {
    // white stone wall: runs between the gates, with posts and caps
    const run = (side, a, b) => {
      const len = b - a; if (len <= .05) return;
      const mid = (a + b)/2, horiz = side !== 'e', zz = side === 'n' ? -13.5 : 14.5;
      mesh(G.box, 0xeceef3, horiz ? [len, .85, .26] : [.26, .85, len], horiz ? [mid, .43, zz] : [14, .43, mid], g);
      for (let v = a; v <= b + .01; v += Math.max(1, len / Math.max(1, Math.round(len / 2.4)))) {
        mesh(G.box, 0xdfe2ea, [.42, 1.12, .42], horiz ? [v, .56, zz] : [14, .56, v], g);
        mesh(G.box, 0xf6f7fb, [.52, .12, .52], horiz ? [v, 1.18, zz] : [14, 1.18, v], g);
      }
    };
    for (const side of ['n', 's']) { const gp = GAPS[side]; if (gp) { run(side, -10.6, gp[0]); run(side, gp[1], 14); } else run(side, -10.6, 14); }
    run('e', -13.5, -.6); run('e', 3.6, 14.5);
  }
  const gate = (a, b, horiz) => {
    for (const v of [a, b]) mesh(stone ? G.box : G.cyl, stone ? 0xdfe2ea : 0x6b4526, stone ? [.55, 2.6, .55] : [.28, 2.6, .28], horiz ? [v, 1.3, horiz] : [14, 1.3, v], g);
    mesh(G.box, stone ? 0xc9a24f : 0x8a5a2b, horiz ? [b - a + .4, .5, .2] : [.2, .5, b - a + .4], horiz ? [(a + b)/2, 2.4, horiz] : [14, 2.4, (a + b)/2], g);
  };
  gate(-.6, 3.6);
  if (GAPS.n) gate(GAPS.n[0], GAPS.n[1], -13.5);
  if (GAPS.s) gate(GAPS.s[0], GAPS.s[1], 14.5);
  // colliders, so an opened region can only be entered through its gate
  const wall = (side, a, b) => side === 'e' ? {x0:13.75, x1:14.25, z0:a, z1:b, fence:1}
    : {x0:a, x1:b, z0:(side === 'n' ? -13.5 : 14.5) - .25, z1:(side === 'n' ? -13.5 : 14.5) + .25, fence:1};
  for (const side of ['n', 's']) {
    const gp = GAPS[side];
    if (gp) boxes.push(wall(side, -10.8, gp[0]), wall(side, gp[1], 14.25)); else boxes.push(wall(side, -10.8, 14.25));
  }
  boxes.push(wall('e', -13.75, -.6), wall('e', 3.6, 14.75));
  fenceGroup = g;
  if (anim) { g.position.y = -2; popIns.push({obj:g, t:0, rise:true}); }
}
function well(anim) {
  const g = new THREE.Group(); g.position.set(9, 0, -7); scene.add(g); wellG = g;
  mesh(G.cyl, 0x9a958c, [.85, .75, .85], [0, .38, 0], g);
  mesh(G.cyl, 0x2b6f95, [.65, .02, .65], [0, .76, 0], g);
  [-1, 1].forEach(s => mesh(G.box, 0x5e3f22, [.12, 1.4, .12], [s*.75, 1.1, 0], g));
  mesh(G.cone4, 0x8a3a2a, [1.3, .7, 1.1], [0, 2.1, 0], g).rotation.y = Math.PI/4;
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Group(); b.position.set(-2 + i*2, 0, 2.6); g.add(b);
    mesh(G.cyl, 0x5e3f22, [.06, 2.2, .06], [0, 1.1, 0], b);
    mesh(G.box, [0xd9443a, 0x3f7cc0, 0xf0b03a][i], [.03, .5, .7], [0, 1.9, .35], b);
  }
  circles.push({x:9, z:-7, r:1});
  if (anim) popIn(g);
}
function hall(anim) {
  const g = new THREE.Group(); g.position.set(9, 0, 11); scene.add(g);
  mesh(G.box, 0xb0aaa0, [3.6, .3, 2.8], [0, .15, 0], g);
  mesh(G.box, 0xc89a5e, [3.2, 2, 2.4], [0, 1.3, 0], g);
  const roof = mesh(G.cone4, 0x9a3a2a, [3.1, 1.6, 2.5], [0, 3.1, 0], g); roof.rotation.y = Math.PI/4;
  for (let i = -1; i <= 1; i += 2) mesh(G.cyl, 0xf0e8d8, [.14, 2, .14], [i*1.3, 1.3, 1.35], g);
  mesh(G.box, 0x4a2a14, [.8, 1.3, .1], [0, .95, 1.22], g);
  mesh(G.cyl, 0x5e3f22, [.05, 1.6, .05], [0, 4.5, 0], g);
  ST.flag = mesh(G.box, 0xd9443a, [.7, .4, .03], [.36, 5.05, 0], g);
  boxes.push({x0:7.2, x1:10.8, z0:9.6, z1:12.4});
  fader(g, 3.8, 5);
  if (anim) popIn(g);
}

