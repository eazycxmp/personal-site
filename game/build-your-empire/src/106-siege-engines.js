// ------------------------------------------------------------------ siege engines
const SENG = {id:null, units:[]};
// siege engines come from the siege workshop, and only march out against a castle (a rival's walls); a field
// battle is the soldiers alone. Better troops bring better engines.
const armyEngines = () => { if (!W.unlocked.has('siegeWorks')) return []; const t = W.troop || 0; return t >= 5 ? ['tank', 'tank', 'howitzer'] : t >= 4 ? ['cannon', 'cannon', 'mortar'] : t >= 3 ? ['tower', 'trebuchet', 'ram'] : t >= 1 ? ['catapult', 'catapult', 'ram'] : ['ram']; };
const SHOOTS = {catapult:{every:3.2, arc:5, dur:1.3, ball:[0x8a8478, .28]}, trebuchet:{every:4, arc:8, dur:1.7, ball:[0x8a8478, .38]},
  cannon:{every:2.2, arc:1.6, dur:.55, ball:[0x1a1a1a, .16], flash:true}, mortar:{every:3, arc:9, dur:1.6, ball:[0x1a1a1a, .2], flash:true},
  howitzer:{every:2.6, arc:3.5, dur:.9, ball:[0x3a3e34, .18], flash:true}, tank:{every:2, arc:.6, dur:.4, ball:[0x3a3e34, .14], flash:true}};
function engineMesh(k) {
  let m = null;
  if (k === 'ram') m = model('ram', 3, 'z');
  if (k === 'tower') m = model('siegeTower', 4.6, 'y');
  if (k === 'catapult') m = model('catapult', 2.3, 'y');
  if (k === 'trebuchet') m = model('catapult', 3.6, 'y');
  if (k === 'tank') m = model('tank', 2.6, 'z');
  // the wooden engines are modelled lying along x; turn them to face where they drive (+z), wheels rolling forward
  if (m && k !== 'tank') { m.rotation.y = -Math.PI/2; const w = new THREE.Group(); w.add(m); return w; }
  if (m) return m;
  const g = new THREE.Group(), steel = {metalness:.6, roughness:.4};
  if (k === 'cannon' || k === 'howitzer') {
    // a field gun: a long barrel on a carriage with two spoked wheels
    const long = k === 'howitzer';
    mesh(G.box, long ? 0x4e5640 : 0x5e3f22, [.5, .25, 1.4], [0, .5, -.3], g);
    const b = mesh(G.cyl, long ? 0x3a3e34 : 0x2a2a2e, [.11, long ? 2.2 : 1.6, .11], [0, .78, .45], g, steel); b.rotation.x = Math.PI/2 - .18;
    for (const sx of [-.42, .42]) { const w = mesh(G.cyl, long ? 0x222222 : 0x6b4526, [.42, .08, .42], [sx, .42, 0], g); w.rotation.z = Math.PI/2; w.name = 'wheel'; }
    if (long) mesh(G.box, 0x4e5640, [.9, .5, .08], [0, .85, .05], g);   // a gun shield
  } else if (k === 'mortar') {
    mesh(G.cyl, 0x4a4a4e, [.45, .2, .45], [0, .1, 0], g, steel);
    const b = mesh(G.cyl, 0x2a2a2e, [.22, .7, .22], [0, .45, .1], g, steel); b.rotation.x = .5;
  } else mesh(G.box, 0x6b4526, [1, 1, 2], [0, .5, 0], g);
  return g;
}
function updSiegeEngines(dt) {
  const C = W.camp;
  // a land attack sets out: bring the engines
  if (C && C.type === 'land' && !C.retake && C.away && C.side && (C.sengId ??= Math.random()) !== SENG.id) {
    SENG.id = C.sengId; for (const u of SENG.units) scene.remove(u.g); SENG.units = [];
    armyEngines().forEach((k, i) => {
      const g = engineMesh(k); if (!g) return; g.position.set(3 + (i - 1)*2.4, 0, 86); scene.add(g);
      // the wheels, each with the axle it turns on (its thinnest side) and its radius, to roll as it goes
      g.updateMatrixWorld(true); const wheels = [];
      g.traverse(o => {
        if (!/^wheel/.test(o.name)) return;
        let mm = o.isMesh ? o : null; o.traverse(q => { if (!mm && q.isMesh) mm = q; }); if (!mm) return;
        if (!mm.geometry.boundingBox) mm.geometry.computeBoundingBox();
        const sz = mm.geometry.boundingBox.getSize(new THREE.Vector3()), ws = mm.getWorldScale(new THREE.Vector3());
        const axis = sz.x <= sz.y && sz.x <= sz.z ? 'x' : sz.y <= sz.z ? 'y' : 'z';
        const r = Math.max(.05, Math.max(...['x', 'y', 'z'].filter(a => a !== axis).map(a => sz[a]*ws[a]/2)));
        wheels.push({o, axis, r});
      });
      SENG.units.push({k, g, i, cd:1 + i*.7, ph:R()*6, v:0, wheels});
    });
  }
  if (!SENG.units.length) return;
  const vis = soldiers.filter(q => q.char.g.visible && !q.down);
  const mid = vis.length ? vis.reduce((a, q) => [a[0] + q.pos.x/vis.length, a[1] + q.pos.z/vis.length], [0, 0]) : null;
  const fighting = C && C.type === 'land' && C.t <= 22 && C.t > 9, sailing = C && C.sail && !vis.length;
  for (const u of SENG.units) {
    const p = u.g.position, ranged = !!SHOOTS[u.k], melee = u.k === 'ram' || u.k === 'tower';
    u.g.visible = !sailing;
    if (sailing) { if (C.sail && C.dur - C.t > C.sail.board + C.sail.dur - .2) p.set(C.sail.land[0] + (u.i - 1)*2.4, 0, C.sail.land[1] - 3); continue; }
    let tx, tz;
    if (fighting) { tx = BF.x + (u.i - 1)*3.2; tz = melee ? BF.z + 1.6 + Math.sin(time*3 + u.ph)*(u.k === 'ram' ? .5 : 0) : BF.z - 7.5; }
    else if (mid) { tx = mid[0] + (u.i - 1)*2.4; tz = mid[1] - (C ? 5 : -4); }
    else { tx = p.x; tz = p.z; }
    // driving like a vehicle: speed builds up and eases off near the spot, the wheels roll with the distance covered
    const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz), top = u.k === 'tank' ? 8 : 6.6;
    const want = d > .3 ? Math.min(top, Math.sqrt(2*3.5*d)) : 0; u.v += clamp(want - u.v, -6*dt, 3.5*dt);
    const sp = Math.min(u.v, d/dt);
    for (const w of u.wheels) w.o.rotation[w.axis] += sp*dt/w.r;
    if (d > .3) { p.x += dx/d*sp*dt; p.z += dz/d*sp*dt; p.y = Math.abs(Math.sin(time*9 + u.ph))*.03*Math.min(1, u.v); const yaw = Math.atan2(dx, dz); let dy = yaw - u.g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); u.g.rotation.y += dy*Math.min(1, dt*4); }
    else if (fighting) { const yaw = Math.atan2(0, 1); u.g.rotation.y += (yaw - u.g.rotation.y)*Math.min(1, dt*3); }
    // in the fight: the guns and catapults bombard the enemy camp
    if (fighting && ranged && d < 3 && (u.cd -= dt) <= 0) {
      const S = SHOOTS[u.k]; u.cd = S.every*(.8 + R()*.4);
      const from = new THREE.Vector3(p.x, u.k === 'mortar' ? .9 : 1.4, p.z + .8), to = new THREE.Vector3(BF.x + (R() - .5)*9, .2, BF.z + 4.5 + R()*3.5);
      const ball = new THREE.Mesh(G.sph, mat(S.ball[0], {roughness:.6})); ball.scale.setScalar(S.ball[1]); ball.position.copy(from); scene.add(ball);
      if (S.flash) { for (let k = 0; k < 6; k++) particle(k < 2 ? 0xffd070 : 0x9a9a9a, from.clone(), new THREE.Vector3((R() - .5)*1.5, 1 + R(), 1.5 + R()), .6, .25, {grow:1.2, op:.7}); }
      flyers.push({m:ball, from, to, t:0, dur:S.dur, arc:S.arc, done:() => {
        for (let k = 0; k < 14; k++) particle(k % 3 ? 0x7a6a5a : (S.flash ? 0xff8a3a : 0xa89880), to.clone(), new THREE.Vector3((R() - .5)*5, 2 + R()*3, (R() - .5)*5), .9, .22, {grav:1});
        const hit = enemies.find(e => e.alive && Math.hypot(e.pos.x - to.x, e.pos.z - to.z) < 1.8); if (hit) { hit.hp -= 3; if (hit.hp <= 0) knockOut(hit); }
        if (watchingWar()) shakeCam(S.flash ? .25 : .15);
        snd(S.flash ? 80 : 120, .25, 'sawtooth', .04, .5);
      }});
      if (S.flash) snd(70, .2, 'square', .04, .5);
    }
  }
  // home again: park them back at the base and stand them down
  if (!C && mid && Math.hypot(mid[0] - 3, mid[1] - 86) < 10) { for (const u of SENG.units) scene.remove(u.g); SENG.units = []; SENG.id = null; }
}
// the siege workshop: a timber shed with a ram and a catapult parked outside
function siegeYard(anim) {
  const g = new THREE.Group(); g.position.set(-5.6, 0, 60.4); scene.add(g);
  mesh(G.box, 0x6b4526, [3.4, .2, 2.2], [0, .1, 0], g);
  for (const [x, z] of [[-1.6, -1], [1.6, -1], [-1.6, 1], [1.6, 1]]) mesh(G.cyl, 0x5e3f22, [.09, 2, .09], [x, 1, z], g);
  const roof = mesh(G.cone4, 0x7a5232, [3.2, 1, 2.4], [0, 2.4, 0], g); roof.rotation.y = Math.PI/4; roof.scale.set(2.6, 1, 1.9);
  const ram = engineMesh('ram'); if (ram) { ram.position.set(-.6, 0, .1); ram.scale.multiplyScalar(.7); g.add(ram); }
  const cat = engineMesh('catapult'); if (cat) { cat.position.set(2.9, 0, .2); cat.scale.multiplyScalar(.7); g.add(cat); }
  boxes.push({x0:-7.4, x1:-3.8, z0:59.2, z1:61.6});
  if (anim) { popIn(g); banner('🛞 Siege workshop!', 'Rams and catapults roll out with your army whenever it storms a castle.'); }
}
