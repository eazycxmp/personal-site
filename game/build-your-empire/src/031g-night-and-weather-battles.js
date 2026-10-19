// ------------------------------------------------------------------ battles at night and in bad weather
// After dark both armies carry torches that flicker over the field. Rain turns the battlefield to mud and snow drifts
// slow every step: both sides move slower, and their boots throw up mud or snow.
const NW = {torches:new Map(), id:null, splashT:0};
const nightK = () => clamp((.5 - (FX.day.value ?? 1))*2.4, 0, 1);
const weatherSlow = () => W.weather === 'rain' ? .82 : W.weather === 'snow' ? .72 : 1;
// (kept within the normal brightness range: anything brighter blooms into a big pale halo on screen)
const TORCH_FLAME = new THREE.MeshBasicMaterial({color:0xe8822a, fog:false}), TORCH_GLOW = new THREE.MeshBasicMaterial({color:0xc8601a, transparent:true, opacity:.4, fog:false, depthWrite:false});
function torchFor(e) {
  let t = NW.torches.get(e); if (t) return t;
  t = new THREE.Group(); t.position.set(-.34, 1.55, .15); e.char.g.add(t);
  mesh(G.cyl, 0x5e3f22, [.04, 1, .04], [0, 0, 0], t);
  const f = new THREE.Mesh(G.cone, TORCH_FLAME); f.scale.set(.09, .2, .09); f.position.y = .58; t.add(f); t.flame = f;
  const glow = new THREE.Mesh(G.sph, TORCH_GLOW); glow.scale.setScalar(.16); glow.position.y = .6; t.add(glow); t.glow = glow;
  NW.torches.set(e, t); return t;
}
function updNightWar(dt) {
  const C = W.camp || W.raid, land = !!C && C.type === 'land' && C.t < 30, n = nightK();
  // a word on the weather as a land battle begins
  if (land && C !== NW.id) { NW.id = C; if (W.weather !== 'clear') note(W.weather === 'rain' ? '🌧️ Rain on the battlefield' : '❄️ Snow on the battlefield', W.weather === 'rain' ? 'Mud slows both armies.' : 'Snowdrifts slow every step.'); }
  // torches by night, for everyone still on their feet in the battle
  const units = land && n > .62 ?   // (only once it is properly dark: the game never gets very dark, and at dusk torches looked out of place)
     [...soldiers.filter(s => s.char.g.visible && !s.down && atBattle(s)), ...enemies.filter(e => e.alive)] : [];
  const keep = new Set(units);
  for (const [e, t] of NW.torches) if (!keep.has(e)) { if (t.parent) t.parent.remove(t); NW.torches.delete(e); }
  for (const e of units) { const t = torchFor(e), fl = 1 + Math.sin(time*18 + e.pos.x*3)*.15 + Math.sin(time*31 + e.pos.z)*.08; t.flame.scale.set(.09*fl, .2*fl, .09*fl); t.glow.scale.setScalar(.16*fl*(.6 + n*.6)); }
  // enemies slog through it too
  for (const e of enemies) e.speed = 3*weatherSlow();
  // mud or snow thrown up by running feet
  if (land && W.weather !== 'clear' && (NW.splashT -= dt) <= 0) {
    NW.splashT = .08; const all = [...soldiers.filter(s => s.char.g.visible && atBattle(s)), ...enemies.filter(e => e.alive)], u = all[R()*all.length|0];
    if (u && Math.hypot(u.vel ? u.vel.x : 0, u.vel ? u.vel.z : 0) > .5) particle(W.weather === 'rain' ? 0x5a4632 : 0xf4f8fa, new THREE.Vector3(u.pos.x, .12, u.pos.z), new THREE.Vector3((R() - .5)*.8, .9, (R() - .5)*.8), .5, .1, {grav:1});
  }
}
