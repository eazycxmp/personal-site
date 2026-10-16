// ------------------------------------------------------------------ homes: residents who pay rent
const HOMES = [];
function addHome(x, z, kind) {
  const r = entity({body:CLOTHES[HOMES.length*3 % CLOTHES.length], hat:kind === 'house' ? 'beanie' : 'hood', hatCol:CLOTHES[(HOMES.length*5 + 2) % CLOTHES.length],
    skin:SKINS[HOMES.length % SKINS.length], pants:0x3a3a4a}, x + .95, z + 1.45, 2, 0);
  r.yaw = 0.3;
  HOMES.push({x, z, kind, r, t:6 + HOMES.length*3});
  smokers.push({x:x + .1, y:kind === 'house' ? 2.9 : 2.6, z:kind === 'house' ? z - .4 : z});
}
let lotRentT = 20;
const RENT = {small:0, last:0};
function updHomes(dt) {
  if (started && (lotStage.some(s => s) || RENT.small || STRIP.lots.stripHotel) && (lotRentT -= dt) <= 0) {
    lotRentT = 20; let roll = 0;
    // the Strip's resort rooms rent out too
    if (STRIP.lots.stripHotel) { const r = Math.round(3000*(1 + .45*W.era)); W.coins += r; W.earned += r; roll += r; }
    for (const d of dwellings()) {
      if (!d.k.startsWith('lot')) continue;
      const rent = rentFor(d); if (!rent) continue;
      W.coins += rent; W.earned += rent; roll += rent;
      popText(`+${rent} rent · ${OCC[d.k]} 🧑`, new THREE.Vector3(d.x, d.top, d.z), '#ffe06b');
    }
    // homes and huts pay on their own clocks; add what they paid since the last roll
    roll += RENT.small; RENT.small = 0; RENT.last = roll;
    if (roll) popText(`🏠 +${roll.toLocaleString()} rent`, player.pos.clone().setY(3.4), '#c8f0a0');
  }
  for (const h of HOMES) {
    h.r.vel.set(0, 0, 0); animEntity(h.r, dt); h.r.char.g.rotation.y = h.r.yaw;
    const wave = Math.max(0, Math.sin(time*1.3 + h.x));
    h.r.char.armR.rotation.x = wave > .85 ? -2.6 + Math.sin(time*14)*.3 : 0;
    if (!started || (h.t -= dt) > 0) continue;
    h.t = 20;
    const hs = h.kind === 'hut' ? (Object.entries(HUTS).find(([, H]) => H.x === h.x && H.z === h.z)?.[0]) : `h${h.x},${h.z}`;
    const d = dwellings().find(d => d.k === hs), rent = d ? rentFor(d) : 0;
    if (!rent) continue;
    W.coins += rent; W.earned += rent; RENT.small += rent;
    popText(`+${rent} rent · ${OCC[d.k]} 🧑`, new THREE.Vector3(h.x, 3, h.z), '#ffe06b');
  }
}

