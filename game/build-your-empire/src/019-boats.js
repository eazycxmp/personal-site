// ------------------------------------------------------------------ boats
const boats = [];
function makeBoat(kind) {
  const g = new THREE.Group(); scene.add(g);
  const big = kind !== 'fish', war = kind === 'war';
  if (kind === 'cargo' || kind === 'cruise') modernShip(g, kind); else galleon(g, SHIPS[kind]());
  const sailor = makeChar({body:big ? 0x3a5a8a : 0x3f6fb5, hat:big ? 'beanie' : 'straw', hatCol:0x2a2a4a});
  sailor.g.scale.setScalar(.7); sailor.g.position.set(0, .53, big ? -.2 : -.6); g.add(sailor.g);
  const sail = null;
  const b = {g, kind, sail, state:'dock', t:big ? 20 : 2, x:war ? -13.4 : big ? -14.4 : -13, z:war ? -4.6 : big ? -115 : -7.2, cargo:0};
  b.g.position.set(b.x, 0, b.z);
  boats.push(b);
  return b;
}
function updBoats(dt) {
  for (const b of boats) {
    if (b.inFleet) continue;   // the fleet is steered by the naval battle
    let vz = 0;
    // keep to the lane for the way you are going (out to sea on the west side, in to the docks on the east side) and
    // never overtake: hold back if a boat ahead in the same lane is too close
    const sail = (to, sp) => {
      const d = to - b.z; if (Math.abs(d) < .2) { b.dir = 0; return true; }
      const dir = Math.sign(d); b.dir = dir; const lane = dir < 0 ? -17.2 : -12.8;
      b.x += (lane - b.x) * Math.min(1, dt*.8);
      const ahead = boats.find(o => o !== b && !o.inFleet && o.dir === dir && Math.abs(o.x - b.x) < 2 && (o.z - b.z)*dir > 0 && (o.z - b.z)*dir < 6.5);
      b.waiting = !!ahead; if (ahead) { vz = 0; return false; }
      vz = dir*sp; b.z += vz*dt; return false;
    };
    if (b.kind === 'war') {
      // the warship sails off with the army and comes home when the campaign ends
      if (W.camp && W.camp.ships) { if (b.state !== 'gone') { if (sail(-105, 4)) b.state = 'gone'; } }
      else if (sail(-4.6, 4)) b.state = 'dock';
    } else if (b.kind === 'fish') {
      if (b.state === 'dock') { if ((b.t -= dt) <= 0) b.state = 'out'; }
      else if (b.state === 'out') { if (sail(84, 3.4)) { b.state = 'fishing'; b.t = 5; } }
      else if (b.state === 'fishing') { if ((b.t -= dt) <= 0) { b.cargo = 8; b.state = 'home'; } }
      else if (b.state === 'home') { if (sail(-7.2, 3.4)) b.state = 'unload'; }
      else if (b.state === 'unload') {
        const pile = ST.harbor.outStack;
        if ((b.t -= dt) <= 0) {
          b.t = .18;
          if (b.cargo > 0 && pile.length < pile.cap) { spawnItem('fish', new THREE.Vector3(b.x, 1, b.z), pile, fishSpecies()); b.cargo--; snd(500, .04, 'triangle', .02); }
          else if (!b.cargo) { b.state = 'dock'; b.t = 1.5; }
        }
      }
    } else {
      if (b.state === 'dock') { if ((b.t -= dt) <= 0) b.state = 'in'; }
      else if (b.state === 'in') { if (sail(-9.6, 3)) { b.state = 'trade'; b.t = 2.5;
        const pay = b.kind === 'cargo' ? 900 + 150*W.era : b.kind === 'cruise' ? 1500 + 200*W.era : 40 + 15*W.era;
        addCash(CASH.harbor, pay, {x:-9.3, z:-9.75}); popText(b.kind === 'cruise' ? `🛳️ +${pay} cruise` : b.kind === 'cargo' ? `📦 +${pay} cargo` : '+💵 trade', new THREE.Vector3(b.x, 4, b.z), '#ffe06b');
        // cruise passengers come ashore hungry
        if (b.kind === 'cruise') for (let i = 0; i < 3; i++) { const L = LINES.main; if (!L || L.q.length >= L.max) break; spawnIn(L); L.q[L.q.length - 1].pos.set(-9.4, 0, -9 + i*.4); L.q[L.q.length - 1].pre = null; } snd(880, .12, 'triangle', .05); } }
      else if (b.state === 'trade') { if ((b.t -= dt) <= 0) b.state = 'out'; }
      else if (b.state === 'out') { if (sail(-115, 3)) { b.state = 'dock'; b.t = 30; } }
    }
    if (!vz && !b.waiting) b.dir = 0;
    b.g.position.set(b.x, Math.sin(time*2 + b.x)*.06 - .26, b.z);
    if (vz) b.g.rotation.y = vz > 0 ? 0 : Math.PI;
    b.g.rotation.z = Math.sin(time*1.6 + b.z*.1)*.04;
  }
}
// fish leaping out of the river, just for looks
let leapT = 1;
function leapingFish(dt) {
  if ((leapT -= dt) > 0) return; leapT = .9 + R()*1.4;
  const si = fishSpecies(), sp = SPECIES[si], m = itemMesh('fish', si);
  m.scale.setScalar(sp.size*1.2);
  const x = -15.6 + R()*4.4, z = player.pos.z + (R() - .5)*22;
  m.position.set(x, -.2, z);
  const dir = R() < .5 ? 1 : -1;
  flyers.push({m, from:new THREE.Vector3(x, -.2, z), to:new THREE.Vector3(x, -.2, z + dir*1.6), t:0, dur:.75, leap:1, done:() => splashAt(x, z + dir*1.6)});
  splashAt(x, z);
}

