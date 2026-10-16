// ------------------------------------------------------------------ residents: bigger buildings house more people, and more people pay more rent
const HOUSE_POP = {hut:[0, 1, 2, 5], house:2, lot:[0, 3, 6, 10, 16]};
const PER_HEAD = {hut:[0, 4, 15, 24], house:5, lot:[0, 10, 14, 20, 38]};
const OCC = {}, MOVE_T = {}, COMING = {}, OUT_T = {}, movers = [];
const MAX_MOVERS = MOBILE ? 16 : 28;
let homesFull = false;   // a loaded game's homes are already lived in
function dwellings() {
  const out = [];
  for (const [k, H] of Object.entries(HUTS)) if (hutStage[k]) {
    const s = Math.sign(H.tile[1] - H.z) || 1;
    out.push({k, x:H.x, z:H.z, door:[H.x, H.z + s*1.2], street:H.tile, pop:HOUSE_POP.hut[hutStage[k]], per:PER_HEAD.hut[hutStage[k]], top:2.6});
  }
  for (const h of HOMES) if (h.kind === 'house') out.push({k:`h${h.x},${h.z}`, x:h.x, z:h.z, door:[h.x, h.z + 1.15], street:[h.x, h.z + 2.6], pop:HOUSE_POP.house, per:PER_HEAD.house, top:3});
  lotStage.forEach((st, i) => { if (st) { const [x, z] = LOTS[i]; out.push({k:`lot${i}`, x, z, door:[x, z + 1.75], street:[x, z + 3.3], pop:HOUSE_POP.lot[st], per:PER_HEAD.lot[st], top:3 + st*2}); } });
  return out;
}
const population = () => Object.values(OCC).reduce((a, b) => a + b, 0);
function rentFor(d) { return OCC[d.k] ? Math.round((OCC[d.k] * d.per + 2*W.era) * (1 + .45*W.era) * (policy('rent') || 1) * (1 + wonderCount()*.05)) : 0; }
function spawnMover(path, done, suitcase) {
  const c = makeChar({civ:true});
  if (suitcase) mesh(G.box, [0x8a5a2b, 0x3f7cc0, 0xb8322a][R()*3|0], [.12, .26, .34], [0, -.6, 0], c.armR);
  c.g.position.set(path[0][0], 0, path[0][1]);
  movers.push({c, path, i:1, done, wait:0, sp:1.6 + R()*.5});
}
function updResidents(dt) {
  if (!started) return;
  for (const d of dwellings()) {
    if (OCC[d.k] == null) { OCC[d.k] = homesFull ? d.pop : 0; COMING[d.k] = 0; MOVE_T[d.k] = 1 + R()*3; OUT_T[d.k] = 4 + R()*8; }
    OCC[d.k] = Math.min(OCC[d.k], d.pop);
    // newcomers arrive along the street with a suitcase and move in, one at a time
    if (OCC[d.k] + COMING[d.k] < d.pop && (MOVE_T[d.k] -= dt) <= 0) {
      MOVE_T[d.k] = 2.5 + R()*2.5;
      const k = d.k;
      if (movers.length >= MAX_MOVERS) OCC[k]++;
      else {
        COMING[k]++;
        const side = R() < .5 ? -1 : 1, s = d.street;
        spawnMover([[s[0] + side*7, s[1]], [s[0], s[1]], d.door], () => {
          COMING[k]--; OCC[k]++;
          popText(`🧳 +1 resident`, new THREE.Vector3(d.door[0], 2.4, d.door[1]), '#d8f0ff');
        }, true);
      }
    }
    // people who live there step out for a walk and come home again
    if (OCC[d.k] > 0 && (OUT_T[d.k] -= dt) <= 0) {
      OUT_T[d.k] = Math.max(1.5, 9 - OCC[d.k]*.45) * (.7 + R()*.6);
      if (movers.length < MAX_MOVERS) {
        const s = d.street, far = [s[0] + (R() - .5)*8, s[1] + (R() - .5)*1.2];
        spawnMover([d.door, s, far, s, d.door], null, false);
        movers[movers.length - 1].pause = 2;
      }
    }
  }
  for (let i = movers.length; i--;) {
    const m = movers[i], c = m.c;
    if (m.wait > 0) { m.wait -= dt; c.legL.rotation.x = c.legR.rotation.x = 0; continue; }
    const [tx, tz] = m.path[m.i], p = c.g.position, dx = tx - p.x, dz = tz - p.z, dd = Math.hypot(dx, dz);
    if (dd < .1) {
      m.i++;
      if (m.pause && m.i === 3) m.wait = m.pause + R()*2;
      if (m.i >= m.path.length) { scene.remove(c.g); movers.splice(i, 1); if (m.done) m.done(); continue; }
      continue;
    }
    const st = Math.min(dd, m.sp*dt); p.x += dx/dd*st; p.z += dz/dd*st; p.y = elevAt(p.x, p.z);
    c.g.rotation.y = Math.atan2(dx, dz);
    const s = Math.sin(time*8 + i); c.legL.rotation.x = s*.6; c.legR.rotation.x = -s*.6; c.armL.rotation.x = -s*.4;
    if (!c.armR.children.length || c.armR.children.length < 4) c.armR.rotation.x = s*.4;
  }
}

