// ------------------------------------------------------------------ citizens with names, homes, jobs and needs, like little sims
const FIRST = ['Ada', 'Bo', 'Cy', 'Dee', 'Eli', 'Fay', 'Gus', 'Hal', 'Ivy', 'Jo', 'Kai', 'Lu', 'Max', 'Nia', 'Oz', 'Pip', 'Quin', 'Rae', 'Sol', 'Tess', 'Uma', 'Vic', 'Wren', 'Xan', 'Yara', 'Zed'];
const LAST = ['Fisher', 'Miller', 'Baker', 'Stone', 'Smith', 'Brewer', 'Rivers', 'Woods', 'Hill', 'Marsh', 'Fields', 'Ford'];
const JOBS = [['grill', 'Cook'], ['field', 'Farmer'], ['smelter', 'Smelter'], ['library', 'Scholar'], ['brewery', 'Brewer'], ['smith', 'Blacksmith'], ['workshop', 'Tinkerer'], ['oven', 'Baker']];
function citizenNeeds(s) {
  if (!s.name) {
    s.name = `${FIRST[R()*FIRST.length|0]} ${LAST[R()*LAST.length|0]}`;
    const jobs = JOBS.filter(([id]) => ST[id]); const j = jobs[R()*jobs.length|0] || ['grill', 'Cook']; s.job = j[1]; s.jobAt = j[0];
    s.need = {food:50 + R()*50, fun:50 + R()*50, social:50 + R()*50};
    s.el = document.createElement('div'); s.el.className = 'bub mood'; $('labels').appendChild(s.el);
  }
}
function needSpot(s) {
  const low = Object.entries(s.need).sort((a, b) => a[1] - b[1])[0];
  if (low[1] > 55) { const st = ST[s.jobAt]; if (st && st.body && inRect(BOUNDS, st.body.position.x + 1.6, st.body.position.z + 1.6) && R() < .5) return {at:[st.body.position.x + 1.6, st.body.position.z + 1.6], act:'work'}; return null; }
  if (low[0] === 'food') return {at:[7.4, 3.4], act:'food'};
  if (low[0] === 'fun') { const d = (W.decor || [])[R()*(W.decor || []).length|0]; return {at:d ? [d.x + 1.2, d.z + 1.2] : [9, -4.6], act:'fun'}; }
  const o = strollers.find(o => o !== s && !o.meet); return o ? {at:[o.pos.x + .8, o.pos.z], act:'social', who:o} : null;
}
function updCitizens(dt) {
  let sum = 0;
  for (const s of strollers) {
    citizenNeeds(s);
    for (const k in s.need) s.need[k] = Math.max(0, s.need[k] - dt * (k === 'food' ? .4 : .28));
    if (s.doing && s.rest <= 0) {
      const d = s.doing; s.doing = null;
      if (d.act === 'food') { s.need.food = 100; addCash(cash, 4 + W.era, s.pos); }
      if (d.act === 'fun') s.need.fun = Math.min(100, s.need.fun + 50 + appeal()*.3);
      if (d.act === 'social') { s.need.social = 100; if (d.who && d.who.need) d.who.need.social = Math.min(100, d.who.need.social + 40); }
    }
    // a plan that takes too long is dropped, so nobody waits forever
    if (s.plan && (s.planT = (s.planT || 0) + dt) > 20) { s.plan = null; s.planT = 0; }
    if (!s.doing && s.rest <= 0) { if (!s.plan) { s.plan = needSpot(s); s.planT = 0; } if (s.plan) s.goal = s.plan.at; }
    const mood = 12 + policy('happy') + (s.need.food + s.need.fun + s.need.social) / 3 + (W.water || 0)*4 + (W.ground || 0)*3 + Math.min(20, appeal()*.15);
    s.mood = clamp(mood, 0, 100); sum += s.mood;
    const face = s.mood > 75 ? '😄' : s.mood > 55 ? '🙂' : s.mood > 35 ? '😐' : '😟';
    const extra = s.doing ? {food:'🍽️', fun:'🎉', social:'💬', work:'🔨'}[s.doing.act] : '';
    const html = face + (extra || '');
    if (s.el._h !== html) { s.el._h = html; s.el.innerHTML = html; }
  }
  W.happy = strollers.length ? Math.round(sum / strollers.length) : 70;
}
function happyMult() { return .9 + (W.happy ?? 70) / 500; }
// tap a citizen to see who they are and follow them around
let follow = null;
const ray = new THREE.Raycaster();
function tapAt(px, py) {
  const r = stage.getBoundingClientRect(), v = new THREE.Vector2(px / r.width * 2 - 1, -(py / r.height) * 2 + 1);
  ray.setFromCamera(v, camera);
  let best = null, bd = 1e9;
  for (const s of strollers) {
    const p = s.pos.clone().setY(1), d = ray.ray.distanceToPoint(p);
    if (d < .8 && d < bd) { bd = d; best = s; }
  }
  if (best) showCitizen(best);
}
function showCitizen(s) {
  citizenNeeds(s);
  const bar = (n, v) => `<div class="need"><span>${n}</span><i><b style="width:${Math.round(v)}%;background:${v > 60 ? '#5ac85a' : v > 30 ? '#f2b22a' : '#e05a3a'}"></b></i></div>`;
  const m = $('modal'); m.hidden = false;
  m.innerHTML = `<div class="card"><h1 style="font-size:24px">${s.mood > 75 ? '😄' : s.mood > 55 ? '🙂' : s.mood > 35 ? '😐' : '😟'} ${s.name}</h1>
    <p>${s.job} · lives in town · mood ${Math.round(s.mood)}%</p>${bar('🍽️ Food', s.need.food)}${bar('🎉 Fun', s.need.fun)}${bar('💬 Friends', s.need.social)}
    <p class="keys">Build parks and rides, clean water and better streets to make everyone happier.</p>
    <button class="big" id="cFollow">Follow ${s.name.split(' ')[0]}</button> <button class="ghost" id="cClose">Close</button></div>`;
  $('cFollow').onclick = () => { follow = s; m.hidden = true; };
  $('cClose').onclick = () => { m.hidden = true; };
}

