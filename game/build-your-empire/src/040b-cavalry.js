// ------------------------------------------------------------------ cavalry: horsemen, then lancers, then dragoons; tanks take over from the horses
// A branch of its own beside the army, the navy and the air force. Each tier is military technology you buy; the riders
// wait in a paddock on the military grounds, and the tank division parks in the same paddock once the horses retire.
const CAV = [null,
  {n:'Cavalry', icon:'🐎', pow:6, o:{body:0x6a5040, trim:0x8a6a4a, hat:'helmet', pants:0x4a3a2a, sword:true}},
  {n:'Lancers', icon:'🏇', pow:12, o:{body:0xb8bcc4, trim:0x2d4fa8, hat:'greathelm', pants:0x8a8f96, metal:true}, lance:true},
  {n:'Dragoons', icon:'🎖️', pow:20, o:{body:0x2d4fa8, trim:0xf2c200, hat:'tricorne', pants:0xf0ece0, gun:true, belts:true}}];
const TANK_POW = 30;
const PADDOCK = {x0:5.4, x1:12.6, z0:50.6, z1:55.4, g:null, rides:[], lvl:0};
const cavLvl = () => count(['cav1', 'cav2', 'cav3']);
const cavPower = () => W.unlocked.has('tanks') ? TANK_POW : cavLvl() ? CAV[cavLvl()].pow : 0;
const cavName = () => W.unlocked.has('tanks') ? 'Tank division' : cavLvl() ? CAV[cavLvl()].n : 'Cavalry';
function cavStage(n, anim) {
  const P = PADDOCK;
  if (!P.g) {
    // a rail fence round the paddock, open on the side facing the drill yard
    P.g = new THREE.Group(); scene.add(P.g);
    slab(0xb59a6a, P.x1 - P.x0, P.z1 - P.z0, (P.x0 + P.x1)/2, (P.z0 + P.z1)/2, .005);
    const post = (x, z) => mesh(G.box, 0x6a4a2a, [.1, .9, .1], [x, .45, z], P.g);
    const rail = (x, z, len, alongX) => { for (const y of [.4, .75]) mesh(G.box, 0x8a6a42, alongX ? [len, .06, .05] : [.05, .06, len], [x, y, z], P.g); };
    for (let x = P.x0; x <= P.x1 + .01; x += 1.2) { post(x, P.z0); post(x, P.z1); }
    for (let z = P.z0 + 1.2; z < P.z1; z += 1.2) post(P.x1, z);
    rail((P.x0 + P.x1)/2, P.z0, P.x1 - P.x0, true); rail((P.x0 + P.x1)/2, P.z1, P.x1 - P.x0, true); rail(P.x1, (P.z0 + P.z1)/2, P.z1 - P.z0, false);
    boxes.push({x0:P.x0, x1:P.x1, z0:P.z0, z1:P.z1});
    if (anim) popIn(P.g);
  }
  for (const r of P.rides) P.g.remove(r.g);
  P.rides = []; P.lvl = n;
  if (!n || W.unlocked.has('tanks')) return;
  // two more riders than the tier: three horsemen, four lancers, five dragoons, side by side facing the gate
  const k = n + 2, C = CAV[n];
  for (let i = 0; i < k; i++) {
    const H = horseModel(HORSE.s, [1, .72, 1.15, .85, .6][i]); if (!H) break;
    const g = new THREE.Group(); g.position.set(P.x0 + 1 + i*(P.x1 - P.x0 - 2)/Math.max(1, k - 1), 0, (P.z0 + P.z1)/2 + (i % 2 ? .4 : -.4)); g.rotation.y = Math.PI; P.g.add(g);
    H.g.position.z = HORSE.z; g.add(H.g); saddleOn(g);
    const rider = makeChar(C.o); rider.ride = 'horse'; g.add(rider.g); rider.g.position.set(0, HORSE.ride, 0);
    if (C.lance) mesh(G.cyl, 0x8a6a42, [.04, 2.6, .04], [.32, HORSE.ride + 1.4, -.1], g).rotation.x = .25;
    H.idleT = R()*8; P.rides.push({g, H, rider});
  }
  if (anim) { puff((P.x0 + P.x1)/2, (P.z0 + P.z1)/2); banner(`${C.icon} ${C.n}!`, `Your mounted troops: strength ${C.pow}. Send them to war on their own, beside the army.`); }
}
function updCavalry(dt) {
  const P = PADDOCK; if (!P.rides.length) return;
  // the riders leave the paddock while they are away at war
  const away = !!(W.camp && W.camp.branch === 'cav') || (typeof FRONTS !== 'undefined' && FRONTS.busy('cav'));
  const near = camera.position.distanceToSquared(new THREE.Vector3((P.x0 + P.x1)/2, 0, (P.z0 + P.z1)/2)) < 70*70;
  for (const r of P.rides) { r.g.visible = !away; if (!away && near) horseGait(r.H, dt, 0); }
}
