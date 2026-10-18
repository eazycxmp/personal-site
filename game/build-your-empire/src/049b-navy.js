// ------------------------------------------------------------------ the navy grows up: the wooden warship, then ironclads, dreadnoughts and an aircraft carrier
// Each is military technology you buy at the harbour; your warship is rebuilt in the new style and the navy fights harder.
const NAVY = [null,
  {n:'Wooden warship', icon:'⚓', pow:6, fleet:14},
  {n:'Ironclads', icon:'⛴️', pow:12, fleet:22},
  {n:'Dreadnoughts', icon:'🚢', pow:20, fleet:32},
  {n:'Aircraft carrier', icon:'🛳️', pow:30, fleet:44}];
const navLvl = () => W.unlocked.has('warship') ? 1 + count(['nav2', 'nav3', 'nav4']) : 0;
const navName = () => navLvl() ? NAVY[navLvl()].n : 'Navy';
// the warship's look for a tier (bow toward +z, like the cargo ships); tier 1 is the wooden galleon
function warshipLook(g, lvl) {
  if (lvl <= 1) { galleon(g, SHIPS.war()); return; }
  const P = (geo, c, s, p, o) => mesh(geo, c, s, p, g, o), M = {metalness:.5, roughness:.45};
  const gun = (x, y, z, back) => { const t = P(G.cyl, 0x5e666c, [.24, .16, .24], [x, y, z], M); for (const dx of [-.07, .07]) { const b = P(G.cyl, 0x3a3e44, [.035, .6, .035], [x + dx, y + .02, z + (back ? -.36 : .36)], M); b.rotation.x = Math.PI/2; } return t; };
  if (lvl === 2) {
    // an ironclad: low black hull, an armoured casemate with gun ports, one tall funnel
    steelHull(g, 4.6, 1.35, 0x26262c, 0x6a5a40);
    P(G.box, 0x34343a, [1, .5, 1.9], [0, .86, -.1], M); P(G.box, 0x2a2a30, [.8, .08, 1.7], [0, 1.15, -.1], M);
    for (const sx of [-1, 1]) for (const z of [-.7, -.1, .5]) P(G.box, 0x0e0e10, [.04, .14, .2], [sx*.51, .88, z]);
    P(G.cyl, 0x1a1a1a, [.17, .9, .17], [0, 1.6, .15]); P(G.cyl, 0x8a2a1e, [.18, .1, .18], [0, 2.02, .15]);
    P(G.cyl, 0x5e3f22, [.03, 1.4, .03], [0, 1.4, -1.6]);
  } else if (lvl === 3) {
    // a dreadnought: long and grey, a bridge and two funnels amidships, big-gun turrets fore and aft, a tripod mast
    steelHull(g, 5.2, 1.4, 0x7a8288, 0x3a3e44);
    P(G.box, 0x8a9298, [.8, .45, 1.3], [0, .9, .15], M); P(G.box, 0x9aa2a8, [.6, .32, .45], [0, 1.28, .6], M); P(G.box, 0x1e2a3a, [.62, .08, .2], [0, 1.36, .82]);
    for (const z of [-.25, -.75]) { P(G.cyl, 0x6a7278, [.16, .7, .16], [0, 1.45, z], M); P(G.cyl, 0x1a1a1a, [.17, .06, .17], [0, 1.82, z]); }
    for (const a of [-.25, .25]) P(G.cyl, 0x6a7278, [.025, 1.5, .025], [a*.5, 1.85, .95]).rotation.z = a*.3;
    P(G.box, 0x6a7278, [.3, .14, .3], [0, 2.5, .95], M);
    gun(0, .76, 1.75); gun(0, .9, 1.15); gun(0, .76, -1.65, true);
  } else {
    // an aircraft carrier: a flat deck with its runway lines, the island on the starboard side, fighters parked on deck
    steelHull(g, 5.8, 1.5, 0x6a7278, 0x3a3e44);
    P(G.box, 0x4a4e54, [1.8, .08, 6.1], [0, .74, 0], M);
    P(G.box, 0xf4f4f4, [.04, .012, 5.6], [0, .785, 0]); for (let z = -2.4; z <= 2.4; z += .8) P(G.box, 0xf2c200, [.5, .012, .04], [0, .785, z]);
    P(G.box, 0x7a8288, [.35, .75, 1], [.72, 1.15, -.6], M); P(G.box, 0x1e2a3a, [.37, .1, .4], [.72, 1.42, -.35]);
    P(G.cyl, 0x6a7278, [.03, .8, .03], [.72, 1.9, -.7]); P(G.box, 0x8a9298, [.3, .05, .05], [.72, 2.15, -.7]);
    for (const [x, z] of [[-.4, 1.6], [-.35, .4], [-.4, -2]]) { const j = model('fighter', 1.15, 'x'); if (j) { j.position.set(x, .82, z); j.rotation.y = Math.PI; g.add(j); } }
  }
}
// rebuild your warship in the new style (its sailor stays aboard)
function navyStage(n, anim) {
  const b = boats.find(q => q.kind === 'war'); if (!b) return;
  for (const o of [...b.g.children]) if (!o.userData.sailor) b.g.remove(o);
  warshipLook(b.g, n);
  // the sailor finds a clear patch of deck on the steel ships (and is sized to match the carrier's jets)
  const spot = {2:[0, .62, -1.35], 3:[0, .62, -1.2], 4:[-.5, .78, -.9]}[n];
  for (const o of b.g.children) if (o.userData.sailor) { if (spot) { o.position.set(...spot); o.scale.setScalar(.55); } else { o.position.set(0, .53, -.2); o.scale.setScalar(.7); } }
  if (anim) { puff(b.g.position.x, b.g.position.z); const N = NAVY[n]; banner(`${N.icon} ${N.n}!`, `Your warship is rebuilt for a new age: navy strength ${N.fleet}.`); }
}
