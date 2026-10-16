// ------------------------------------------------------------------ graphics: wet streets in the rain, pools of light at night, windows lit unevenly
const POOL = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,214,150,.9)'); r.addColorStop(.5, 'rgba(255,190,110,.35)'); r.addColorStop(1, 'rgba(255,170,90,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
})();
const pools = [];
function lightPool(x, z, s = 3, y = .05) {
  const m = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:POOL, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false}));
  m.rotation.x = -Math.PI/2; m.position.set(x, y, z); m.scale.set(s, s, 1); m.renderOrder = 2; scene.add(m); pools.push(m); return m;
}
let poolScan = 0;
function updGfx3(dt, dk) {
  const night = clamp((.55 - dk) * 2.2, 0, 1);
  // light pools follow every fire and every lamp, and glow at night
  if ((poolScan -= dt) <= 0) {
    poolScan = 3;
    const want = [];
    for (const l of fireLights) { const p = l.getWorldPosition(new THREE.Vector3()); want.push([p.x, p.z, 4.2]); }
    for (const d of (W.decor || [])) if (d.k === 'lamp') want.push([d.x, d.z, 3]);
    if (groundStage.lamps) for (const [x, z] of [[-1.2, -10.6], [5.4, -10.6], [12.6, -4], [12.6, 6.6], [-9.6, -4.6], [-9.6, 9.6], [2.8, 13.2], [12.4, 13.2]]) want.push([x + .44, z, 3.4]);
    for (const [x, z] of HW.pts.slice(1, -2).filter(p => p[2] >= 1).map(p => [p[0] + .8, p[1]])) want.push([x, z, 2.6, true]);
    while (pools.length < want.length) lightPool(0, 0);
    pools.forEach((p, i) => { const w = want[i]; p.visible = !!w; if (w) { p.position.set(w[0], w[3] ? 3.45 : .05, w[1]); p.scale.set(w[2], w[2], 1); } });
  }
  for (const p of pools) p.material.opacity = night * .55;
  // headlights paint the road ahead at night
  for (const v of [...TRAFFIC.cars, ...HW.cars]) {
    if (!v.pool) v.pool = lightPool(0, 0, 2.2);
    const a = v.g.rotation.y; v.pool.position.set(v.g.position.x + Math.sin(a)*1.6, v.g.position.y + .06, v.g.position.z + Math.cos(a)*1.6); v.pool.visible = v.g.visible;
  }
  // wet streets shine in the rain
  const wet = W.weather === 'rain' ? 1 : 0;
  for (const m of SLAB_TOPS) { m.userData.r0 ??= m.roughness; m.roughness += ((wet ? .32 : m.userData.r0) - m.roughness) * Math.min(1, dt*.6); }
  if (wet && R() < dt*25) { const x = player.pos.x + (R() - .5)*16, z = player.pos.z + (R() - .5)*16; particle(0xdcecff, new THREE.Vector3(x, .05, z), new THREE.Vector3(0, .8, 0), .25, .05, {grav:1}); }
  // not every window is lit: each building keeps its own mood
  for (const m of winMats) { m.userData.k ??= .25 + Math.random()*1.1; m.emissiveIntensity = (1 - dk) * 1.4 * m.userData.k; }
}

