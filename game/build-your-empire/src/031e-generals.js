// ------------------------------------------------------------------ generals: veterans promoted for their victories
// Every second land victory a veteran is promoted to general (five at most), each with a name. Generals make your army
// stronger, and they ride at its head on horseback, plumed and gilded, into battle and in the victory parade.
const GEN_NAMES = ['Aldric Vane', 'Mira Holt', 'Tobias Crane', 'Isolde Marsh', 'Rowan Gale', 'Sabine Ferro', 'Cassius Reed', 'Linnea Stark'];
const GEN = {units:[], id:null};
const generals = () => W.flags.generals ||= [];
const genBonus = () => generals().length*5;
// a land battle won: count it, and promote a veteran every second time
function genVictory() {
  const f = W.flags; f.landWins = (f.landWins || 0) + 1;
  const g = generals();
  if (f.landWins % 2 === 0 && g.length < 5) {
    const n = GEN_NAMES.find(x => !g.some(q => q.n === x)) || 'Anon'; g.push({n, since:f.landWins});
    setTimeout(() => banner(`🎖️ ${n} is promoted to General!`, `${g.length} general${g.length > 1 ? 's' : ''} now lead your army: +${genBonus()} strength.`), 3200);
  }
}
const GEN_LOOK = {body:0x1f3a6a, trim:0xf2c200, hat:'greathelm', pants:0xf0ece0, sword:true, metal:true};
// the generals on horseback, made when needed and kept riding at the head of the army
function genUnits(n) {
  while (GEN.units.length > n) { const u = GEN.units.pop(); scene.remove(u.g); }
  while (GEN.units.length < n) {
    const g = new THREE.Group(); scene.add(g); const H = horseModel(HORSE.s, .6); if (H) { H.g.position.z = HORSE.z; g.add(H.g); }
    saddleOn(g); const c = makeChar(GEN_LOOK); c.ride = 'horse'; g.add(c.g); c.g.position.y = HORSE.ride;
    // a gold plume and a cloak of the army's blue
    mesh(G.cone, 0xf2c200, [.12, .5, .12], [0, HORSE.ride + 2.15, -.05], g); mesh(G.box, 0x2d4fa8, [.5, .8, .04], [0, HORSE.ride + 1.05, -.42], g);
    const u = {g, H, c, pos:new THREE.Vector3(3, 0, 55), yaw:0, sp:0, fresh:true}; g.position.copy(u.pos); GEN.units.push(u);
  }
}
function updGenerals(dt) {
  const C = W.camp, n = Math.min(3, generals().length);
  const battle = C && C.type === 'land' && armyGoes(C), parading = typeof PARADE !== 'undefined' && PARADE.on;
  if (!n || (!battle && !parading)) { if (GEN.units.length) genUnits(0); return; }
  genUnits(n);
  // where to ride: at the head of the army (marching, in front of the line, or leading the parade column)
  const vis = soldiers.filter(s => s.char.g.visible && !s.down), mid = vis.length ? [vis.reduce((a, s) => a + s.pos.x, 0)/vis.length, vis.reduce((a, s) => a + s.pos.z, 0)/vis.length] : [BF.x, BF.z - 6];
  GEN.units.forEach((u, i) => {
    let tx, tz;
    if (battle && C.t <= 23 && C.t > 9 && !C.assault) { tx = BF.x + (i - (n - 1)/2)*2.4; tz = BF.z - 8.5; }
    else if (parading) { const lead = soldiers.find(s => !s.paraded && s.ppi != null); tx = lead ? lead.pos.x : 3; tz = lead ? lead.pos.z - 2 - i*1.8 : 14; }
    else { tx = mid[0] + (i - (n - 1)/2)*2.2; tz = mid[1] + (C && C.t > 9 ? 3 : -3); }
    if (u.fresh) { u.pos.set(tx, 0, tz); u.fresh = false; }
    ride(u, tx, tz, parading ? 3.2 : 7, dt);
    u.g.position.copy(u.pos); u.g.rotation.y = u.yaw; if (u.H) horseGait(u.H, dt, u.sp);
    u.c.armR.rotation.x = battle && C.t <= 22 ? -2.4 + Math.sin(time*4 + i)*.3 : -.3;   // sword raised to lead the charge
  });
}
