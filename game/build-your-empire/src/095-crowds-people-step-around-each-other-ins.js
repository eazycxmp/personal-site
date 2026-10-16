// ------------------------------------------------------------------ crowds: people step around each other instead of walking through one another
const SEP = {on:true, r:.5};
function updCrowd(dt) {
  if (!SEP.on) return;
  const cell = new Map(), list = [], k = (x, z) => (Math.floor(x) + 512)*4096 + Math.floor(z) + 512;
  if ((SEP.pruneT = (SEP.pruneT || 0) - dt) <= 0) { SEP.pruneT = 5; for (let i = ENTS.length - 1; i >= 0; i--) { const e = ENTS[i]; if (e.char.g.parent) e.offT = 0; else if ((e.offT = (e.offT || 0) + 5) > 30) ENTS.splice(i, 1); } }
  for (const e of ENTS) {
    const g = e.char.g;
    if (!g.parent || !g.visible || e === player || e.down || e.climb != null || e.alive === false) continue;
    list.push(e); const key = k(e.pos.x, e.pos.z); let c = cell.get(key); if (!c) cell.set(key, c = []); c.push(e);
  }
  const blocked = (x, z) => { if (!NAV.grid) return false; const i = Math.floor((x - NAV.x0)/NAV.cs), j = Math.floor((z - NAV.z0)/NAV.cs); return i >= 0 && j >= 0 && i < NAV.nx && j < NAV.nz && NAV.grid[j*NAV.nx + i] === 1; };
  // guests in a queue or at a table hold their places; everyone else spreads out
  const held = new Set(); for (const L of Object.values(LINES)) for (const c of L.q) held.add(c);
  for (const a of list) {
    if (held.has(a)) continue;
    let px = 0, pz = 0;
    const cx = Math.floor(a.pos.x), cz = Math.floor(a.pos.z);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const c = cell.get((cx + i + 512)*4096 + cz + j + 512); if (!c) continue;
      for (const b of c) {
        if (b === a) continue;
        let dx = a.pos.x - b.pos.x, dz = a.pos.z - b.pos.z, d = Math.hypot(dx, dz);
        if (d >= SEP.r) continue;
        if (d < 1e-3) { dx = R() - .5; dz = R() - .5; d = Math.hypot(dx, dz); }
        px += dx/d*(SEP.r - d)*.5; pz += dz/d*(SEP.r - d)*.5;
      }
    }
    if (!px && !pz) continue;
    const nx = a.pos.x + px, nz = a.pos.z + pz;
    if (!blocked(nx, nz)) { a.pos.x = nx; a.pos.z = nz; }
  }
}

