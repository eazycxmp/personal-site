// ------------------------------------------------------------------ boats
const boats = [];
// the harbour: everything moors alongside the quay on the east bank, ships coming up from the sea keep to the middle of
// the river and ships heading out keep to the west, so nothing sails through a moored boat. Merchant ships each take a
// berth of their own (one, or two with the bigger docks), and wait out at sea when the berths are full.
const HARBOR = {moor:-12.8, laneIn:-15.2, laneOut:-17.7, merchant:[-27.3, -18.8]};
// the wide merchant galleon ties up a little further out so it clears the quay posts; each big ship waits at its own spot at sea
const moorX = b => b.kind === 'trade' ? -13.2 : HARBOR.moor;
const merchants = () => boats.filter(o => o.kind === 'trade' || o.kind === 'cargo' || o.kind === 'cruise');
const seaX = b => -24 - 6*merchants().indexOf(b), seaZ = b => -115 - 8*merchants().indexOf(b);   // spread out off the river mouth, clear of both lanes
// how long each kind is, so a boat keeps a hull's length behind the one ahead
const BOAT_LEN = {fish:3.4, trade:5.4, cargo:6.4, cruise:7, war:6.1, troop:4.8};
const merchantBerths = () => W.unlocked.has('docks2') ? HARBOR.merchant : HARBOR.merchant.slice(1);
// a ship can reach a berth only if the berths nearer the sea are empty (it would sail through them); take the farthest in
function freeBerth(b) {
  const bs = merchantBerths(), taken = z => boats.some(o => o !== b && o.berth === z);
  // nor one a ship already on its way in still has to sail past
  let best = null; for (const z of bs) { if (taken(z) || boats.some(o => o !== b && o.state === 'in' && o.berth > z)) break; best = z; }
  return best;
}
function makeBoat(kind) {
  const g = new THREE.Group(); scene.add(g);
  const big = kind !== 'fish', war = kind === 'war';
  if (kind === 'cargo' || kind === 'cruise') modernShip(g, kind); else galleon(g, SHIPS[kind]());
  const sailor = makeChar({body:big ? 0x3a5a8a : 0x3f6fb5, hat:big ? 'beanie' : 'straw', hatCol:0x2a2a4a});
  sailor.g.scale.setScalar(.7); sailor.g.position.set(0, .53, big ? -.2 : -.6); sailor.g.userData.sailor = true; g.add(sailor.g);
  const sail = null;
  const b = {g, kind, sail, state:'dock', t:big ? 20 : 2, x:war ? HARBOR.moor : big ? HARBOR.laneOut : HARBOR.moor, z:war ? -4.6 : big ? -115 : -9.6, home:war ? -4.6 : -9.6, cargo:0};
  boats.push(b); if (big && !war) { b.x = seaX(b); b.z = seaZ(b); }
  b.g.position.set(b.x, 0, b.z);
  return b;
}
function updBoats(dt) {
  for (const b of boats) {
    if (b.inFleet) continue;   // the fleet is steered by the naval battle
    let vz = 0; b.pull = false;
    // keep to the lane for the way you are going (out to sea on the west side, in to the docks on the east side) and
    // never overtake: hold back if a boat ahead in the same lane is too close
    const sail = (to, sp) => {
      const d = to - b.z; if (Math.abs(d) < .2) { b.dir = 0; return true; }
      const dir = Math.sign(d); b.dir = dir; const lane = dir < 0 ? HARBOR.laneOut : HARBOR.laneIn;
      // pull out into the lane first, then get under way
      if (Math.abs(lane - b.x) > .5) { b.pull = true; b.x += Math.sign(lane - b.x) * Math.min(Math.abs(lane - b.x), dt*1.6); return false; }
      b.x += (lane - b.x) * Math.min(1, dt*.8);
      // the one ahead in this lane, or level with us and earlier in the list (so two boats side by side never both go)
      const gap = o => ((BOAT_LEN[o.kind] || 5) + (BOAT_LEN[b.kind] || 5))/2 + .8, dz = o => (o.z - b.z)*dir;
      const ahead = boats.find(o => o !== b && !o.inFleet && o.dir === dir && Math.abs(o.x - b.x) < 2.2 && dz(o) < gap(o) && (dz(o) > .3 || (dz(o) > -.3 && boats.indexOf(o) < boats.indexOf(b))));
      b.waiting = !!ahead; if (ahead) { vz = 0; return false; }
      vz = dir*sp; b.z += vz*dt; return false;
    };
    if (b.kind === 'war') {
      // the warship sails off with the army and comes home when the campaign ends
      if (W.camp && W.camp.ships) { if (b.state !== 'gone') { if (sail(-105, 4)) b.state = 'gone'; } }
      else if (sail(b.home, 4)) b.state = 'dock';
    } else if (b.kind === 'fish') {
      if (b.state === 'dock') { if ((b.t -= dt) <= 0) b.state = 'out'; }
      else if (b.state === 'out') { if (sail(84, 3.4)) { b.state = 'fishing'; b.t = 5; } }
      else if (b.state === 'fishing') { if ((b.t -= dt) <= 0) { b.cargo = 8; b.state = 'home'; } }
      else if (b.state === 'home') { if (sail(b.home, 3.4)) b.state = 'unload'; }
      else if (b.state === 'unload') {
        const pile = ST.harbor.outStack;
        if ((b.t -= dt) <= 0) {
          b.t = .18;
          if (b.cargo > 0 && pile.length < pile.cap) { spawnItem('fish', new THREE.Vector3(b.x, 1, b.z), pile, fishSpecies()); b.cargo--; snd(500, .04, 'triangle', .02); }
          else if (!b.cargo) { b.state = 'dock'; b.t = 1.5; }
        }
      }
    } else {
      if (b.state === 'dock') { if ((b.t -= dt) <= 0) { const z = freeBerth(b); if (z == null) b.t = 4; else { b.berth = z; b.state = 'in'; } } }
      else if (b.state === 'in') { if (sail(b.berth, 3)) { b.state = 'trade'; b.t = 2.5;
        const pay = b.kind === 'cargo' ? 900 + 150*W.era : b.kind === 'cruise' ? 1500 + 200*W.era : 40 + 15*W.era;
        addCash(CASH.harbor, pay, {x:-9.3, z:-9.75}); popText(b.kind === 'cruise' ? `🛳️ +${pay} cruise` : b.kind === 'cargo' ? `📦 +${pay} cargo` : '+💵 trade', new THREE.Vector3(b.x, 4, b.z), '#ffe06b');
        // cruise passengers come ashore hungry
        if (b.kind === 'cruise') for (let i = 0; i < 3; i++) { const L = LINES.main; if (!L || L.q.length >= L.max) break; spawnIn(L); L.q[L.q.length - 1].pos.set(-9.4, 0, -9 + i*.4); L.q[L.q.length - 1].pre = null; } snd(880, .12, 'triangle', .05); } }
      else if (b.state === 'trade') { if ((b.t -= dt) <= 0) { b.state = 'out'; b.berth = null; } }
      else if (b.state === 'out') { if (sail(seaZ(b), 3)) { b.state = 'dock'; b.t = 30; } }
    }
    if (!vz && !b.waiting) b.dir = 0;
    // tied up: ease in alongside the quay
    const moored = b.kind === 'war' ? b.state === 'dock' : b.kind === 'fish' ? b.state === 'dock' || b.state === 'unload' : b.state === 'trade';
    if (!vz && moored && !b.pull) b.x += (moorX(b) - b.x) * Math.min(1, dt*1.2);
    if (!vz && !b.pull && b.state === 'dock' && merchants().includes(b)) b.x += (seaX(b) - b.x) * Math.min(1, dt*.5);
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

// the quay: a timber deck along the bank with posts in the water and bollards, out to the merchant berths (n = how many)
function quayFx(n, anim) {
  const Q = quayFx.g ||= (() => { const g = new THREE.Group(); scene.add(g); return g; })();
  const z0 = n >= 2 ? -31.8 : -23.3, z1 = quayFx.z1 ?? -15.2; if (quayFx.n >= n) return;
  const g = new THREE.Group(); Q.add(g);
  for (let z = z1; z > z0; z -= .5) mesh(G.box, ((z*2)|0) % 2 ? 0x9a6b40 : 0x8a5d36, [1.3, .14, .5], [-11.3, .22, z - .25], g);
  for (let z = z1 - .4; z > z0; z -= 1.6) { mesh(G.cyl, 0x5e3f22, [.1, .8, .1], [-11.95, .05, z], g); mesh(G.cyl, 0x3a3a3e, [.08, .22, .08], [-11.75, .38, z], g, {metalness:.5}); }
  quayFx.z1 = z0; quayFx.n = n;
  if (anim) popIn(g);
}
