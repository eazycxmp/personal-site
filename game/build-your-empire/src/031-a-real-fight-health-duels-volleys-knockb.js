// ------------------------------------------------------------------ a real fight: health, duels, volleys, knockback and a cheer
const BT = {snd:0};
const BAR_BG = new THREE.MeshBasicMaterial({color:0x1a1a1a, depthTest:false, transparent:true, opacity:.75}), BAR_US = new THREE.MeshBasicMaterial({color:0x5ad85a, depthTest:false}), BAR_THEM = new THREE.MeshBasicMaterial({color:0xe0483a, depthTest:false});
function nearest(a, list) { let best = null, bd = 1e9; for (const b of list) { const d = Math.hypot(b.pos.x - a.pos.x, b.pos.z - a.pos.z); if (d < bd) { bd = d; best = b; } } return best; }
// fighters on the same side shoulder past each other instead of stacking up
function collideFighters(a, list) {
  for (const b of list) {
    if (b === a || b.down || b.alive === false) continue;
    const dx = a.pos.x - b.pos.x, dz = a.pos.z - b.pos.z, d = Math.hypot(dx, dz);
    if (d > 0 && d < .6) { a.pos.x += dx/d*(.6 - d)*.5; a.pos.z += dz/d*(.6 - d)*.5; }
  }
}
function strike(a, t, ranged, dmg) {
  a.swing = .3; if (!ranged && a.char) qnAct(a.char, 'swing', .75, true);
  const from = new THREE.Vector3(a.pos.x, 1.2, a.pos.z), to = new THREE.Vector3(t.pos.x, 1.1, t.pos.z);
  const hit = R() < (ranged ? .55 : .78);
  if (ranged) {
    const dir = to.clone().sub(from).normalize(), muzzle = from.clone().addScaledVector(dir, .7);
    particle(0xffe08a, muzzle, dir.clone().multiplyScalar(2), .08, .14);
    particle(0xdddddd, muzzle, new THREE.Vector3(0, .6, 0).addScaledVector(dir, .6), .9, .14, {grow:.5, op:.45});
    const b = new THREE.Mesh(G.sph, new THREE.MeshBasicMaterial({color:0xffe08a, toneMapped:false})); b.scale.setScalar(.05); b.position.copy(muzzle); scene.add(b);
    flyers.push({m:b, from:muzzle, to:hit ? to : to.clone().add(new THREE.Vector3((R() - .5)*2, -.8, (R() - .5)*2)), t:0, dur:.14});
    if (BT.snd <= 0) { BT.snd = .06; snd(110 + R()*70, .06, 'sawtooth', .03); }
  } else if (BT.snd <= 0) { BT.snd = .07; snd(hit ? 900 + R()*500 : 300, .05, hit ? 'square' : 'triangle', .02); }
  if (!hit) return;
  t.hp -= dmg;
  const kx = t.pos.x - a.pos.x, kz = t.pos.z - a.pos.z, kd = Math.hypot(kx, kz) || 1;
  t.pos.x += kx/kd*(ranged ? .12 : .32); t.pos.z += kz/kd*(ranged ? .12 : .32); t.hit = .18;
  if (!ranged) for (let i = 0; i < 4; i++) particle(0xfff3a0, new THREE.Vector3((a.pos.x + t.pos.x)/2, 1.2, (a.pos.z + t.pos.z)/2), new THREE.Vector3((R() - .5)*3, 2 + R()*2, (R() - .5)*3), .3, .06, {grav:1});
  if (t.hp <= 0) {
    // your side never loses more than a third of the army in one battle
    if (t.alive === undefined) { const down = soldiers.filter(s => s.down).length; if (!BT.noCap && down + 1 > soldiers.length * .34) { t.hp = 1; return; } t.down = true; t.fall = 0; }
    else knockOut(t);
    if (watchingWar()) shakeCam(.06);
  }
}
function knockOut(e) { e.alive = false; e.hp = 0; e.fall = e.fall || 0; }
function poseFall(e, dt) {
  const fallen = e.alive === false || e.down;
  if (fallen) { e.fall = Math.min(1, (e.fall || 0) + dt*2.5); e.char.g.rotation.x = -e.fall*Math.PI/2; e.char.g.position.y = -e.fall*.2; }
  if (e.hit > 0) { e.hit -= dt; const k = 1 + e.hit*.8; e.char.g.scale.set(k, 1/k, k); } else if (!fallen) e.char.g.scale.setScalar(1);
}
function healthBar(e) {
  const show = e.hp > 0 && e.hp < e.maxHp && (e.alive !== false) && !e.down;
  if (!e.bar && !show) return;
  if (!e.bar) {
    e.bar = new THREE.Group(); e.bar.renderOrder = 6; scene.add(e.bar);
    const bg = new THREE.Mesh(G.plane, BAR_BG); bg.scale.set(.7, .1, 1); bg.renderOrder = 6; e.bar.add(bg);
    e.bar.fg = new THREE.Mesh(G.plane, e.alive === undefined ? BAR_US : BAR_THEM); e.bar.fg.renderOrder = 7; e.bar.add(e.bar.fg);
  }
  e.bar.visible = show;
  if (!show) return;
  const k = Math.max(0, e.hp / e.maxHp);
  e.bar.fg.scale.set(.66*k, .07, 1); e.bar.fg.position.x = -.33*(1 - k);
  e.bar.position.set(e.pos.x, 2.4, e.pos.z); e.bar.quaternion.copy(camera.quaternion);
}
// one of your soldiers in the fight: charge and duel, or hold the line and fire
function battleSoldier(s, i, dt) {
  if (s.hp === undefined || s.battle !== BT.id) { s.battle = BT.id; s.maxHp = s.hp = 5 + (W.troop || 0); s.down = false; s.fall = 0; s.cd = R()*.8; s.fought = true; s.target = null; }
  const guns = W.unlocked.has('guns'), alive = enemies.filter(e => e.alive);
  s.vel.set(0, 0, 0); s.speed = 3.6;
  if (!s.down) {
    // at most three on any one enemy (with guns, any number can shoot): the rest hold the line until a foe is free
    const busy = e => soldiers.filter(o => o !== s && !o.down && o.target === e).length;
    if (!s.target || !s.target.alive || (!guns && busy(s.target) >= 3)) s.target = nearest(s, guns ? alive : alive.filter(e => busy(e) < 3));
    const t = s.target;
    if (!t && !guns && alive.length) {
      const hx = BF.x - 4.4 + (i % 8)*1.25, hz = BF.z - 2.4 - Math.floor(i / 8)*1.2;
      if (Math.hypot(hx - s.pos.x, hz - s.pos.z) > .3) moveTo(s, hx, hz, dt);
      const n = nearest(s, alive); if (n) s.yaw = Math.atan2(n.pos.x - s.pos.x, n.pos.z - s.pos.z);
    }
    if (t) {
      const d = Math.hypot(t.pos.x - s.pos.x, t.pos.z - s.pos.z), melee = d < 1.15, reach = guns ? 9 : .95;
      if (!guns && d > reach) { moveTo(s, t.pos.x, t.pos.z, dt); collideFighters(s, soldiers); }
      s.yaw = Math.atan2(t.pos.x - s.pos.x, t.pos.z - s.pos.z);
      if ((s.cd -= dt) <= 0 && d <= reach + .1) {
        const ranged = guns && !melee;
        s.cd = ranged ? 1 + R()*.7 : .75 + R()*.4;
        strike(s, t, ranged, ranged ? 1.3 + (W.troop >= 5 ? .8 : 0) : .9 + (W.troop || 0)*.2);
      }
    }
  }
  animEntity(s, dt); s.char.g.rotation.y = s.yaw;
  if (!s.down) {
    if (s.swing > 0) { s.swing -= dt; s.char.armR.rotation.x = guns ? -1.5 + s.swing : -2.4 + (1 - s.swing/.3)*2.2; }
    else s.char.armR.rotation.x = guns ? -1.5 : -.7;
  }
  poseFall(s, dt);
  healthBar(s);
  return true;
}
// after the battle: the fallen get up, everyone cheers, then they march home
function cheer(s, dt, i) {
  if (s.down || s.fall) { s.down = false; s.fall = 0; s.hp = s.maxHp; s.char.g.rotation.x = 0; s.char.g.scale.setScalar(1); }
  if (s.bar) s.bar.visible = false;
  s.vel.set(0, 0, 0); animEntity(s, dt);
  const j = Math.max(0, Math.sin(time*9 + i*1.3));
  s.char.g.position.y = j*.35; s.char.armR.rotation.x = s.char.armL.rotation.x = -2.8 + j*.3;
  s.char.g.rotation.y = s.yaw = 0;
}
function endBattle() {
  if (!W.camp || !W.camp.away) { BF.x = BF_HOME.x; BF.z = BF_HOME.z; }
  for (const e of enemies) { scene.remove(e.char.g); stacks.delete(e.stack); if (e.bar) scene.remove(e.bar); }
  enemies.length = 0;
  if (enemyCamp) { scene.remove(enemyCamp); enemyCamp = null; }
}
// soldiers walk a corridor past the mess table instead of through it
function soldierGo(s, tx, tz, dt) {
  const goingOut = tz > 90 && s.pos.z < 90.5, goingHome = tz < 84 && s.pos.z > 84.5;
  if (goingOut) { if (s.pos.z < 84.3) return moveTo(s, 5.2, 84.5, dt) && false; return moveTo(s, 5.2, 91, dt) && false; }
  if (goingHome && s.pos.z > 90.5) return moveTo(s, 5.2, 91, dt) && false;
  if (goingHome) return moveTo(s, 5.2, 84.5, dt) && false;
  return moveTo(s, tx, tz, dt);
}
// every conquered land leaves a watchtower flying your colours
const OUTPOSTS = [[-4.4, 104.6], [10.4, 104.6], [-4.4, 94.2], [10.4, 94.2], [3, 107.6]];
function outpost(i, anim) {
  if (!OUTPOSTS[i]) return;
  const [x, z] = OUTPOSTS[i];
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  for (const [a, b] of [[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]]) mesh(G.box, 0x6b4526, [.16, 3, .16], [a, 1.5, b], g);
  mesh(G.box, 0x8a5a2b, [1.4, .2, 1.4], [0, 3, 0], g); roofOn(g, 1.6, 1.6, .9, 3.6, 0x9a3a2a);
  mesh(G.cyl, 0x5e3f22, [.04, 1.4, .04], [0, 4.6, 0], g); mesh(G.box, 0xf2c200, [.7, .42, .03], [.36, 5, 0], g);
  if (anim) popIn(g);
}

