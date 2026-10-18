// ------------------------------------------------------------------ victory parades
// After a great win, once the army is home, it marches in column up through the south gate and across the town square
// and back, while townsfolk line the way cheering and dancing, confetti falls and fireworks burst overhead.
const PARADE = {on:false, wait:0, t:0, name:'', crowd:[], fwT:0, cfT:0};
// the route: out of the military grounds, through the south gate, across the square and back again
const PARADE_ROUTE = [[3, 33], [3, 14], [3, 7], [-5, 7], [11, 7], [3, 7], [3, 14], [3, 33]];
function queueParade(name) { PARADE.wait = 10; PARADE.name = name; }
function startParade() {
  PARADE.on = true; PARADE.t = 0; PARADE.fwT = 0;
  for (const s of soldiers) { s.ppi = 0; s.paraded = false; }
  // the crowd lines the route through the square
  PARADE.crowd = [...Array(12)].map((_, i) => { const x = -6 + (i % 6)*3.4, z = i < 6 ? 4.6 : 9.4, c = makeChar({civ:true}); c.g.position.set(x, 0, z); c.g.rotation.y = i < 6 ? 0 : Math.PI; return c; });
  banner(`🎉 Victory parade!`, `The army marches through town to celebrate ${PARADE.name}.`);
}
function endParade() {
  PARADE.on = false;
  for (const c of PARADE.crowd) scene.remove(c.g); PARADE.crowd = [];
}
function paradeSoldier(s, i, dt) {
  if (!PARADE.on || s.paraded) return false;
  // each falls in a column, two abreast, a pace behind the one in front
  const delay = Math.floor(i / 2)*.55; if (PARADE.t < delay) return false;
  const pt = PARADE_ROUTE[s.ppi]; if (!pt) { s.paraded = true; return false; }
  const [x, z] = pt, side = (i % 2 ? .6 : -.6), last = PARADE_ROUTE[Math.max(0, s.ppi - 1)], dx = x - last[0], dz = z - last[1], L = Math.hypot(dx, dz) || 1;
  s.speed = 3.2;
  if (moveTo(s, x - dz/L*side, z + dx/L*side, dt)) s.ppi++;
  animEntity(s, dt); s.char.g.rotation.y = s.yaw;
  s.char.armR.rotation.x = -.4 + Math.sin(time*6 + i)*.2;
  return true;
}
function updParade(dt) {
  if (PARADE.wait > 0 && (PARADE.wait -= dt) <= 0) { if (W.camp || W.raid || BOSS.on || !soldiers.length) PARADE.wait = 5; else startParade(); }
  if (!PARADE.on) return;
  PARADE.t += dt;
  if (W.camp || W.raid || BOSS.on || PARADE.t > 70 || soldiers.every(s => s.paraded)) { endParade(); return; }
  // the crowd dances and waves (arms up reads as dancing)
  for (const c of PARADE.crowd) { c.armR.rotation.x = c.armL.rotation.x = -2.6; }
  // confetti over the square, fireworks above the town
  if ((PARADE.cfT -= dt) <= 0) { PARADE.cfT = .06; particle([0xff4a4a, 0xffd04a, 0x4ad0ff, 0x8aff6a, 0xff8ae0][R()*5|0], new THREE.Vector3(-6 + R()*18, 5 + R()*2, 3 + R()*8), new THREE.Vector3((R() - .5)*1.2, -1.4, (R() - .5)*1.2), 3, .08); }
  if ((PARADE.fwT -= dt) <= 0) {
    PARADE.fwT = .7 + R()*.6; const c = [0xff5a5a, 0xffe05a, 0x5ae0ff, 0xb05aff, 0x6aff8a][R()*5|0], p = new THREE.Vector3(-8 + R()*22, 15 + R()*5, -6 + R()*16);
    for (let k = 0; k < 22; k++) { const a = k/22*Math.PI*2, e = R()*.6 - .3; particle(c, p, new THREE.Vector3(Math.cos(a)*5, 3 + e*6, Math.sin(a)*5), 1.2, .14, {grav:1}); }
    snd(90 + R()*40, .35, 'sawtooth', .04, .4); setTimeout(() => snd(1200 + R()*600, .12, 'triangle', .02, -.5), 120);
  }
}
