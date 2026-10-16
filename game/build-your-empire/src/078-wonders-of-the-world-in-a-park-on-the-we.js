// ------------------------------------------------------------------ wonders of the world, in a park on the west bank
const WONDERS = [
  {id:'wStone', n:'Stonehenge', icon:'🪨', at:[-89.5, 78.4]}, {id:'wPyramid', n:'The Great Pyramid', icon:'🔺', at:[-82.6, 78.4]},
  {id:'wColosseum', n:'The Colosseum', icon:'🏟️', at:[-89.5, 83.8]}, {id:'wCathedral', n:'The Cathedral', icon:'⛪', at:[-82.6, 83.8]},
  {id:'wTower', n:'The Iron Tower', icon:'🗼', at:[-89.5, 89]}, {id:'wNeedle', n:'The Space Needle', icon:'🛸', at:[-82.6, 89]},
];
const wonderCount = () => WONDERS.filter(w => W.unlocked.has(w.id)).length;
let wondersOpen = false;
function wondersPark() {
  if (wondersOpen) return; wondersOpen = true;
  clearForest({x0:-94, x1:-77.4, z0:74.6, z1:91.5}); clearForest({x0:-83.4, x1:-80.4, z0:5, z1:75});
  slab(0x9fb86a, 16.4, 16.6, -85.8, 83.2, .004); slab(0xc9b48a, 3.2, 70, -81.9, 40, .006);
  for (let z = 76; z <= 91; z += 2.5) slab(0xd8ccb0, 1.2, .6, -86.05, z, .008);
  AREAS.push({x0:-83.6, x1:-80.2, z0:5.2, z1:75.4}, {x0:-94, x1:-77.6, z0:75, z1:91.4});
}
function wonderFx(id, anim) {
  wondersPark();
  const w = WONDERS.find(q => q.id === id), [x, z] = w.at, g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  const P = (geo, c, s, p, o) => mesh(geo, c, s, p, g, o);
  if (id === 'wStone') {
    for (let i = 0; i < 10; i++) { const a = i/10*Math.PI*2; P(G.box, 0x9a9da2, [.45, 1.6, .3], [Math.cos(a)*1.7, .8, Math.sin(a)*1.7]).rotation.y = -a; if (i % 2 === 0) P(G.box, 0x8d9096, [1.2, .3, .35], [Math.cos(a + .31)*1.7, 1.75, Math.sin(a + .31)*1.7]).rotation.y = -a - .31 + Math.PI/2; }
    P(G.box, 0x8d9096, [.8, .5, .5], [0, .25, 0]);
  } else if (id === 'wPyramid') {
    for (let i = 0; i < 7; i++) P(G.box, i % 2 ? 0xe0c880 : 0xd4b870, [4.2 - i*.6, .5, 4.2 - i*.6], [0, .25 + i*.5, 0]);
    P(G.cone4, 0xf2c200, [.4, .5, .4], [0, 3.75, 0], {metalness:.8, roughness:.3}).rotation.y = Math.PI/4;
  } else if (id === 'wColosseum') {
    for (let lvl = 0; lvl < 3; lvl++) for (let i = 0; i < 20; i++) {
      const a = i/20*Math.PI*2; if (lvl === 2 && i > 13) continue;
      P(G.box, 0xd8ccb0, [.7, .8, .3], [Math.cos(a)*2*1.15, .4 + lvl*.85, Math.sin(a)*2]).rotation.y = -a + Math.PI/2;
      P(G.box, 0x3a3020, [.3, .45, .32], [Math.cos(a)*2.01*1.15, .42 + lvl*.85, Math.sin(a)*2.01]).rotation.y = -a + Math.PI/2;
    }
    P(G.cyl, 0xc8b88a, [1.9, .05, 1.6], [0, .03, 0]);
  } else if (id === 'wCathedral') {
    P(G.box, 0xd8d2c4, [1.8, 2.6, 3.6], [0, 1.3, 0]); const r = P(G.cone4, 0x4a5a6a, [1.4, 1.4, 2.6], [0, 3.3, 0]); r.rotation.y = Math.PI/4; r.scale.set(1.3, 1.4, 2.6);
    for (const x of [-.65, .65]) { P(G.box, 0xd8d2c4, [.6, 4.6, .6], [x, 2.3, 1.7]); P(G.cone4, 0x4a5a6a, [.45, 1.6, .45], [x, 5.4, 1.7]).rotation.y = Math.PI/4; }
    const rose = new THREE.Mesh(G.cyl, new THREE.MeshBasicMaterial({color:0xb04fd0, toneMapped:false})); rose.scale.set(.45, .05, .45); rose.rotation.x = Math.PI/2; rose.position.set(0, 2.6, 1.82); g.add(rose);
    for (let i = 0; i < 4; i++) P(G.box, WIN.color.getHex(), [.05, .9, .3], [.92, 1.4, -1.2 + i*.8]);
  } else if (id === 'wTower') {
    const IRON = 0x6a5a48;
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = P(G.box, IRON, [.25, 3.4, .25], [sx*.95, 1.6, sz*.95], {metalness:.5}); l.rotation.set(sz*.28, 0, -sx*.28); }
    P(G.box, IRON, [1.6, .2, 1.6], [0, 3.1, 0], {metalness:.5}); P(G.box, IRON, [.8, 2.6, .8], [0, 4.5, 0], {metalness:.5}); P(G.box, IRON, [.9, .15, .9], [0, 5.8, 0], {metalness:.5});
    P(G.box, IRON, [.3, 1.8, .3], [0, 6.8, 0], {metalness:.5}); P(G.cyl, IRON, [.03, .8, .03], [0, 8.1, 0]); bulb(g, 0, 8.5, 0, 0xffe08a, .12);
    for (let y = 1; y < 3; y += .7) P(G.box, IRON, [2.2 - y*.35, .06, .06], [0, y, .95 - y*.25], {metalness:.5});
  } else {
    P(G.cyl, 0xeef1f4, [.35, 6.5, .35], [0, 3.25, 0], {metalness:.3}); for (const a of [0, 2.1, 4.2]) { const l = P(G.box, 0xeef1f4, [.12, 6.6, .12], [Math.cos(a)*.6, 3.2, Math.sin(a)*.6]); l.rotation.set(Math.sin(a)*.08, 0, -Math.cos(a)*.08); }
    const disc = new THREE.Group(); disc.position.y = 6.6; g.add(disc); w.spin = disc;
    mesh(G.cyl, 0xf2a21a, [1.7, .35, 1.7], [0, 0, 0], disc, {metalness:.4}); mesh(G.cyl, 0x8fc6e8, [1.6, .25, 1.6], [0, .28, 0], disc, {metalness:.5, roughness:.1}); mesh(G.cyl, 0xeef1f4, [.5, .8, .5], [0, .7, 0], disc);
    for (let i = 0; i < 12; i++) bulb(disc, Math.cos(i/12*Math.PI*2)*1.7, -.1, Math.sin(i/12*Math.PI*2)*1.7, 0xfff2c8, .05);
  }
  boxes.push({x0:x - 2.3, x1:x + 2.3, z0:z - 2.1, z1:z + 2.1});
  fader(g, 4.6, 5);
  if (anim) { popIn(g); banner(`${w.icon} ${w.n}!`, `A wonder of the world. Every wonder raises all income by 5% and brings tourists.`); for (let i = 0; i < 24; i++) particle([0xffd84a, 0xffffff, 0xff6a8a][i % 3], new THREE.Vector3(x, 2, z), new THREE.Vector3((R() - .5)*6, 4 + R()*4, (R() - .5)*6), 1.4, .12, {grav:1}); }
}
let tourT = 30;
function updWonders(dt) {
  for (const w of WONDERS) if (w.spin) w.spin.rotation.y += dt*.4;
  const n = wonderCount(); if (!n || !started || (tourT -= dt) > 0) return;
  tourT = 30;
  const pay = n * (300 + 80*W.era); W.coins += pay; W.earned += pay;
  popText(`📸 +${pay} tourists`, new THREE.Vector3(-85.8, 4, 83), '#ffe06b');
  for (let i = 0; i < Math.min(3, n) && movers.length < MAX_MOVERS; i++) { const w = WONDERS.filter(q => W.unlocked.has(q.id))[i]; spawnMover([[-86.05, 75.4], [-86.05, w.at[1]], [w.at[0] + (w.at[0] < -26 ? 2.6 : -2.6), w.at[1]], [-86.05, w.at[1]], [-86.05, 75.4]], null, false); }
}

