// ------------------------------------------------------------------ downtown: six lots that grow into skyscrapers
const LOTS = [[47.5, -47.5], [52.5, -47.5], [57.5, -47.5], [47.5, -54.5], [52.5, -54.5], [57.5, -54.5]];
const LOT_STAGES = [null, {n:'Townhouse', icon:'🏠', rent:30}, {n:'Apartments', icon:'🏢', rent:80}, {n:'Tower', icon:'🏬', rent:200}, {n:'Skyscraper', icon:'🏙️', rent:600}];
const HOTEL_STAGES = [null, {n:'Motel', icon:'🛏️', rent:40}, {n:'Inn', icon:'🏨', rent:100}, {n:'Grand hotel', icon:'🏨', rent:240}, {n:'Neon hotel tower', icon:'🌃', rent:700}];
const isHotel = i => i % 2 === 1;
const lotStage = [0, 0, 0, 0, 0, 0], lotG = [];
const WIN = new THREE.MeshStandardMaterial({color:0x2a3a4a, emissive:0xffd890, emissiveIntensity:0, roughness:.12, metalness:.35});
const winMats = [WIN];
const lampMats = [];
function windows(g, w, d, y0, floors, fh, cols) {
  for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
    const x = -w/2 + (c + .5) * w/cols, y = y0 + (f + .5)*fh;
    const a = new THREE.Mesh(G.box, WIN); a.scale.set(w/cols*.55, fh*.5, .04); a.position.set(x, y, d/2 + .01); g.add(a);
    const b = new THREE.Mesh(G.box, WIN); b.scale.set(.04, fh*.5, w/cols*.55); b.position.set(w/2 + .01, y, x); g.add(b);
  }
}
// a front door facing the street (+z): steps, a lit lamp, and from the second stage a canopy over the entrance
function frontDoor(g, stage, hotel) {
  const d = 1.52;
  mesh(G.box, 0xc8c2b6, [1.3, .12, .5], [0, .06, d + .2], g);                                   // the step
  mesh(G.box, hotel ? 0x3a1a12 : 0x5a3420, [.62, 1.15, .06], [0, .65, d + .02], g);               // the door
  mesh(G.box, 0xe8d8b0, [.74, .08, .08], [0, 1.27, d + .04], g);                                  // the lintel
  mesh(G.sph, 0xf2c200, [.04, .04, .04], [.2, .65, d + .07], g, {metalness:.8, roughness:.2});    // the handle
  const lamp = bulb(g, .5, 1.15, d + .1, 0xffd890, .07); lampMats.push(lamp.material);
  if (stage >= 2) { mesh(G.box, hotel ? 0x8a1a1a : 0x2a3a4a, [1.4, .08, .8], [0, 1.45, d + .4], g); for (const sx of [-.62, .62]) mesh(G.cyl, 0xd8d4cc, [.03, 1.45, .03], [sx, .72, d + .75], g); }
  if (stage >= 3) { mesh(G.box, 0xb0303a, [.9, .02, 1.6], [0, .13, d + 1.0], g); for (const sx of [-.8, .8]) mesh(G.cyl, 0x2a6a3a, [.14, .5, .14], [sx, .25, d + .35], g); }   // a red carpet and planters
}
// the hotel line on every other lot
function hotelStage(g, stage) {
  const neon = (txt, fg, w, y, z) => { const p = neonSign(g, txt, fg, w); p.position.set(0, y, z); return p; };
  if (stage === 1) {
    // a two-storey motel: doors along an open walkway, a railing, a tall neon sign
    mesh(G.box, 0xe8d8b8, [3.2, 2.2, 2.4], [0, 1.1, -.3], g); mesh(G.box, 0x7a3a2a, [3.4, .14, 2.9], [0, 2.25, -.1], g);
    mesh(G.box, 0xd8c8a8, [3.2, .1, .6], [0, 1.1, 1.1], g); mesh(G.box, 0xdfe2ea, [3.2, .3, .04], [0, 1.35, 1.4], g);
    for (const y of [.5, 1.6]) for (const x of [-1.1, 0, 1.1]) { mesh(G.box, 0x2a6a8a, [.42, .7, .05], [x + .2, y, .92], g); mesh(G.box, 0xffd890, [.12, .12, .05], [x - .2, y + .15, .92], g); }
    mesh(G.cyl, 0x8a8f96, [.06, 3.2, .06], [1.5, 1.6, 1.5], g); neon('MOTEL', '#ff4a8a', 1.4, 3.4, 1.55).position.x = 1.5;
    return 3.6;
  }
  if (stage === 2) {
    // a brick inn: four floors, an arched front, an awning
    mesh(G.box, 0x9a4a32, [3.1, 5, 3], [0, 2.5, 0], g); mesh(G.box, 0xe8dcc0, [3.3, .25, 3.2], [0, 5.1, 0], g);
    windows(g, 3.1, 3, .9, 4, 1.0, 3); mesh(G.box, 0x1e5a3a, [2, .1, .6], [0, 1.9, 1.75], g); neon('INN', '#ffd890', 1.2, 4.6, 1.52);
    return 5.3;
  }
  if (stage === 3) {
    // a grand hotel: pale stone, balconies, a mansard roof with dormers, a glowing sign on the roof
    mesh(G.box, 0xdcd6c8, [3.2, 7, 3.1], [0, 3.5, 0], g); windows(g, 3.2, 3.1, 1.2, 6, .95, 3);
    for (let f = 1; f < 7; f += 1) mesh(G.box, 0xc8c0b0, [3.3, .08, .2], [0, f + .2, 1.6], g);
    const roof = mesh(G.box, 0x3a4a5a, [3.2, 1.4, 3.1], [0, 7.7, 0], g); roof.scale.set(3.0, 1.4, 2.9);
    for (const x of [-1, 0, 1]) mesh(G.box, 0xdcd6c8, [.4, .5, .3], [x, 7.9, 1.45], g);
    neon('HOTEL', '#5af0e8', 2.2, 8.9, .2); mesh(G.box, 0xffe8b0, [1.4, .9, .05], [0, .9, 1.56], g, {emissive:0xffc870, emissiveIntensity:.8});
    return 9.4;
  }
  // a neon hotel tower: dark glass and steel, a red neon arc sweeping up one side and over the top
  mesh(G.box, 0x2a2e36, [3, 14, 3], [0, 7, 0], g, {metalness:.6, roughness:.25}); windows(g, 3, 3, .6, 12, 1.1, 3);
  const red = new THREE.MeshBasicMaterial({color:0xff2a3a, toneMapped:false});
  const arc = new THREE.Mesh(new THREE.TorusGeometry(3.4, .14, 6, 32, Math.PI), red); arc.position.set(-.2, 11.5, 1.6); arc.rotation.z = Math.PI*.05; g.add(arc);
  for (const sx of [-1.62, 1.62]) { const st = new THREE.Mesh(G.box, red); st.scale.set(.12, 11.5, .12); st.position.set(sx, 5.75, 1.58); g.add(st); }
  neon('NEON', '#ff2a3a', 2, 13.2, 1.6); mesh(G.box, 0x1a1a1e, [3.6, .4, 2.4], [0, 1.8, 1.6], g);
  return 15;
}
function neonSign(g, text, fg, w) { const p = neon(g, text, fg, w); return p; }
function buildLot(i, stage, anim) {
  const [x, z] = LOTS[i];
  if (lotG[i]) { scene.remove(lotG[i]); FADERS.splice(FADERS.findIndex(f => f.g === lotG[i]), 1); }
  else boxes.push({x0:x - 1.6, x1:x + 1.6, z0:z - 1.6, z1:z + 1.6});
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  let h = 2;
  if (isHotel(i)) { h = hotelStage(g, stage); }
  else if (stage === 1) {
    mesh(G.box, 0xa8553a, [3, 2.2, 3], [0, 1.1, 0], g); roofOn(g, 3.4, 3.4, 1.1, 2.75, 0x5a3a2a); windows(g, 3, 3, .3, 2, .9, 3); h = 3.3;
  } else if (stage === 2) {
    mesh(G.box, 0xd9c9a8, [3.1, 5, 3.1], [0, 2.5, 0], g); mesh(G.box, 0xbfae8c, [3.3, .2, 3.3], [0, 5.1, 0], g); windows(g, 3.1, 3.1, .3, 5, .92, 3); h = 5.2;
  } else if (stage === 3) {
    mesh(G.box, 0x8a96a6, [3, 9, 3], [0, 4.5, 0], g); mesh(G.box, 0x6a7686, [3.2, .3, 3.2], [0, 9.1, 0], g);
    mesh(G.cyl, 0x9aa0a8, [.05, 1.6, .05], [.8, 10, .8], g); windows(g, 3, 3, .4, 9, .95, 3); h = 10;
  } else if (stage === 4) {
    mesh(G.box, 0x7fb6e0, [3, 15, 3], [0, 7.5, 0], g, {metalness:.6, roughness:.15});
    for (let f = 1; f < 15; f += 1.25) mesh(G.box, 0xdfe6ee, [3.06, .08, 3.06], [0, f, 0], g, {metalness:.4, roughness:.3});
    mesh(G.box, 0x6f9ec4, [2.2, 2, 2.2], [0, 16, 0], g, {metalness:.6, roughness:.15});
    mesh(G.cyl, 0xd0d6de, [.06, 3, .06], [0, 18.4, 0], g, {metalness:.6});
    const beacon = new THREE.Mesh(G.sph, new THREE.MeshBasicMaterial({color:0xff3a2a, toneMapped:false})); beacon.scale.setScalar(.14); beacon.position.y = 19.9; g.add(beacon);
    windows(g, 3, 3, .5, 11, 1.25, 2); h = 20;
  }
  frontDoor(g, stage, isHotel(i));
  fader(g, 3.4, h);
  lotG[i] = g; lotStage[i] = stage;
  if (anim) { popIn(g); shakeCam(.5); }
  if (stage === 4) setEra(lotStage.every(s => s === 4) ? 9 : 8, anim);
}
function downtownStreets() {
  for (const x of [50, 55]) slab(0x6e737c, 1.4, 16.7, x, -51.25, .004);
  slab(0x6e737c, 17.2, 1.4, 52, -50.6, .006);
  for (const [x, z] of [[50, -44], [55, -44], [50, -57.6], [55, -57.6], [45, -50.6], [60, -50.6]]) {
    mesh(G.cyl, 0x3a3f46, [.06, 2.8, .06], [x + .9, 1.4, z], scene, {metalness:.5});
    const lamp = new THREE.Mesh(G.sph, new THREE.MeshBasicMaterial({color:0xfff2c0, toneMapped:false})); lamp.scale.setScalar(.18); lamp.position.set(x + .9, 2.85, z); scene.add(lamp); lampMats.push(lamp.material);
  }
}

function windmill() {
  const g = new THREE.Group(); g.position.set(59.3, 0, 75.6); scene.add(g);
  mesh(G.cyl, 0xe8dcc0, [1, 3.2, 1], [0, 1.6, 0], g); mesh(G.cone, 0x8a4a2a, [1.25, 1.2, 1.25], [0, 3.8, 0], g);
  const blades = new THREE.Group(); blades.position.set(0, 3.2, 1.05); g.add(blades);
  for (let i = 0; i < 4; i++) { const b = mesh(G.box, 0xf4ecd8, [.35, 2.2, .05], [0, 1.15, 0], new THREE.Group()); const arm = b.parent; arm.rotation.z = i*Math.PI/2; blades.add(arm); }
  ST.mill = blades; fader(g, 2.4, 4.5);
}
function digger(anim) {
  const g = new THREE.Group(); g.position.set(10, 0, -56.5); scene.add(g); if (ST.digger) ST.digger.body = g;
  for (const z of [-.7, .7]) mesh(G.box, 0x2a2a2e, [2, .45, .45], [0, .23, z], g);
  mesh(G.box, 0xf2b705, [1.6, .8, 1.3], [0, .85, 0], g);
  mesh(G.box, 0xf2b705, [.8, .8, 1], [-.3, 1.65, 0], g); mesh(G.box, 0x9fd3e8, [.05, .5, .8], [.11, 1.7, 0], g);
  mesh(G.cyl, 0x3a3a3e, [.08, .7, .08], [.6, 2, -.35], g);
  const arm = new THREE.Group(); arm.position.set(.6, 1.1, 0); g.add(arm);
  mesh(G.box, 0xe0a800, [1.8, .22, .22], [.9, 0, 0], arm);
  const bucket = mesh(G.box, 0x4a4a4e, [.45, .4, .7], [1.85, -.25, 0], arm, {metalness:.4});
  ST.diggerArm = arm;
  if (anim) popIn(g);
}
function workshopFx(anim) {
  const g = new THREE.Group(); g.position.set(9.6, 0, -46.6); scene.add(g); if (ST.workshop) ST.workshop.body = g;
  mesh(G.box, 0x8a6a4a, [2, 1.6, 2], [0, .8, 0], g);
  roofOn(g, 2.6, 2.6, .9, 2.1, 0x5a5f6a);
  mesh(G.box, 0x2a2a2e, [.5, .3, .3], [.6, .95, 1.05], g, {metalness:.6});
  mesh(G.cyl, 0x6a6a6e, [.18, 1, .18], [-.6, 2.6, -.5], g);
  smokers.push({x:9, y:3.2, z:-47.1});
  fader(g, 2.6, 2.6);
  if (anim) popIn(g);
}
function warTableFx(anim) {
  const g = new THREE.Group(); g.position.set(12.3, 0, 80.3); scene.add(g);
  mesh(G.box, 0x7a5a3a, [1.6, .12, 1], [0, .8, 0], g); mesh(G.box, 0xd9c99a, [1.4, .02, .8], [0, .87, 0], g);
  for (const [x, z] of [[-.7, -.4], [.7, -.4], [-.7, .4], [.7, .4]]) mesh(G.box, 0x5e3f22, [.1, .8, .1], [x, .4, z], g);
  for (const [x, z, c] of [[-.3, 0, 0xd9443a], [.2, .2, 0x3f7cc0], [.4, -.2, 0x3f7cc0]]) mesh(G.cone, c, [.07, .2, .07], [x, .98, z], g);
  boxes.push({x0:11.4, x1:13.2, z0:79.7, z1:80.9});
  if (anim) popIn(g);
}
function house(x, z, anim) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  mesh(G.box, 0xc8c0b0, [2.2, 1.7, 2], [0, .85, 0], g);
  roofOn(g, 2.6, 2.4, 1, 2.2, 0xa8452a);
  mesh(G.box, 0x4a3020, [.5, .9, .08], [0, .45, 1.02], g);
  mesh(G.box, 0x8ab0d0, [.4, .35, .06], [.65, 1.1, 1.02], g);
  mesh(G.box, 0x8a6a4a, [.3, .7, .3], [.6, 2.3, -.4], g);
  circles.push({x, z, r:1.3});
  fader(g, 2.8, 2.8);
  addHome(x, z, 'house');
  if (anim) popIn(g);
}

