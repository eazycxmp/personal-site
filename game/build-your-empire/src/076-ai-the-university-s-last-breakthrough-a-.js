// ------------------------------------------------------------------ AI: the university's last breakthrough. A brain over the lab, drones over the town
const AI = {brain:null, drones:[]};
const aiMult = () => (policy('work') || 1) * (1 + (W.unlocked.has('aiLab') ? .25 : 0) + (W.unlocked.has('superAI') ? .25 : 0));
function aiFx(level, anim) {
  if (!AI.brain) {
    const g = new THREE.Group(); g.position.set(45.5, 7.2, -9.6); scene.add(g); AI.brain = g;
    const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 1), new THREE.MeshBasicMaterial({color:0x5af0ff, wireframe:true, transparent:true, opacity:.7, toneMapped:false})); g.add(wire);
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.55, 2), new THREE.MeshBasicMaterial({color:0xb8fbff, toneMapped:false})); g.add(core);
    for (let i = 0; i < 2; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1.5 + i*.35, .03, 6, 40), new THREE.MeshBasicMaterial({color:i ? 0xff4fb0 : 0x5af0ff, toneMapped:false})); r.rotation.x = Math.PI/2 + i*.6; g.add(r); }
    const beam = new THREE.Mesh(G.cyl, new THREE.MeshBasicMaterial({color:0x5af0ff, transparent:true, opacity:.18, toneMapped:false, depthWrite:false})); beam.scale.set(.3, 4, .3); beam.position.y = -2.6; g.add(beam);
    AI.wire = wire; AI.core = core;
  }
  AI.brain.scale.setScalar(level > 1 ? 1.4 : 1);
  // delivery drones, each carrying a parcel between the producers
  while (AI.drones.length < (level > 1 ? 6 : 3)) {
    const d = new THREE.Group(); scene.add(d);
    mesh(G.box, 0x2a2e36, [.4, .1, .4], [0, 0, 0], d);
    for (const [x, z] of [[-.3, -.3], [.3, -.3], [-.3, .3], [.3, .3]]) { mesh(G.cyl, 0x3a3e44, [.03, .1, .03], [x, .06, z], d); d.rotors = d.rotors || []; d.rotors.push(mesh(G.box, 0xdfe4ea, [.28, .01, .04], [x, .12, z], d)); }
    mesh(G.box, [0xd9443a, 0xf2c200, 0x3f9a6a][AI.drones.length % 3], [.22, .2, .22], [0, -.2, 0], d); bulb(d, 0, -.05, .22, 0x5af0ff, .04);
    AI.drones.push({g:d, from:null, to:null, t:1});
  }
  if (anim) { popIn(AI.brain); banner(level > 1 ? '🧠 Superintelligence!' : '🤖 Artificial intelligence!', level > 1 ? 'Everything runs 50% faster than it ever did, and the drones never sleep.' : 'Your university built an AI. Every producer runs 25% faster, drones carry parcels and the fund trades smarter.'); }
}
function updAI(dt) {
  if (!AI.brain) return;
  AI.brain.rotation.y += dt*.6; AI.wire.rotation.x += dt*.3; AI.core.scale.setScalar(1 + Math.sin(time*3)*.08);
  const spots = Object.values(ST).filter(s => s.body).map(s => [s.body.position.x, s.body.position.z]);
  for (const d of AI.drones) {
    if (d.t >= 1) { d.from = d.to || [45.5, -9.6]; d.to = spots[R()*spots.length|0] || [0, 0]; d.t = 0; d.len = Math.hypot(d.to[0] - d.from[0], d.to[1] - d.from[1]) || 1; }
    d.t = Math.min(1, d.t + dt*4 / d.len);
    const u = d.t, x = d.from[0] + (d.to[0] - d.from[0])*u, z = d.from[1] + (d.to[1] - d.from[1])*u;
    d.g.position.set(x, 4.5 + Math.sin(u*Math.PI)*2, z); d.g.rotation.y = Math.atan2(d.to[0] - d.from[0], d.to[1] - d.from[1]);
    d.g.rotors.forEach(r => { r.rotation.y += dt*40; });
  }
}

