// ------------------------------------------------------------------ riders on the rides, and ticket money
function riders(k, g) {
  const add = (parent, x, y, z) => { const c = makeChar({civ:true}); scene.remove(c.g); c.g.scale.setScalar(.5); c.g.position.set(x, y, z); c.legL.rotation.x = c.legR.rotation.x = -1.4; c.armL.rotation.x = c.armR.rotation.x = -2.6; parent.add(c.g); };
  const r = rides[rides.length - 1];
  if (k === 'carousel') r.o.children.forEach(h => add(h, 0, .05, 0));
  if (k === 'ferris') r.cabins.forEach(c => add(c, 0, -.35, 0));
  if (k === 'coaster') r.cars.forEach(c => add(c, 0, .1, 0));
}
const RIDE_PAY = {carousel:250, ferris:450, coaster:900};
let rideT = 20;
function updRideIncome(dt) {
  if (!started || (rideT -= dt) > 0) return; rideT = 20;
  for (const d of (W.decor || [])) {
    const p = RIDE_PAY[d.k]; if (!p) continue;
    const pay = p + 40*W.era; W.coins += pay; W.earned += pay;
    popText(`🎢 +${pay} rides`, new THREE.Vector3(d.x, 3.6, d.z), '#ffe06b');
    if (movers.length < MAX_MOVERS) spawnMover([[d.x + 3, d.z + 2.5], [d.x + 1.6, d.z + 1.6], [d.x + 3, d.z + 2.5]], null, false);
  }
}

