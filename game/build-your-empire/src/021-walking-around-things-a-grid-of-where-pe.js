// ------------------------------------------------------------------ walking around things: a grid of where people can't go, and A* paths around it
const NAV = {x0:-104, z0:-110, cs:.5, nx:400, nz:480, grid:null, key:-1, ver:0, open:null, g:null, from:null, seen:null};
function navGrid() {
  const k = boxes.length*10000 + circles.length; if (k === NAV.key) return; NAV.key = k; NAV.ver++;
  const {x0, z0, cs, nx, nz} = NAV, g = NAV.grid = new Uint8Array(nx*nz), r = .3;
  const mark = (i, j) => { if (i >= 0 && j >= 0 && i < nx && j < nz) g[j*nx + i] = 1; };
  for (const b of boxes) {
    for (let j = Math.floor((b.z0 - r - z0)/cs); j <= Math.floor((b.z1 + r - z0)/cs); j++)
      for (let i = Math.floor((b.x0 - r - x0)/cs); i <= Math.floor((b.x1 + r - x0)/cs); i++) mark(i, j);
  }
  for (const c of circles) {
    const R0 = c.r + r;
    for (let j = Math.floor((c.z - R0 - z0)/cs); j <= Math.floor((c.z + R0 - z0)/cs); j++)
      for (let i = Math.floor((c.x - R0 - x0)/cs); i <= Math.floor((c.x + R0 - x0)/cs); i++) {
        const cx = x0 + (i + .5)*cs, cz = z0 + (j + .5)*cs; if (Math.hypot(cx - c.x, cz - c.z) < R0) mark(i, j);
      }
  }
  if (!NAV.g) { NAV.g = new Float32Array(nx*nz); NAV.from = new Int32Array(nx*nz); NAV.seen = new Int32Array(nx*nz); NAV.stamp = 0; }
}
function navBlocked(x, z) {
  const i = Math.floor((x - NAV.x0)/NAV.cs), j = Math.floor((z - NAV.z0)/NAV.cs);
  return i >= 0 && j >= 0 && i < NAV.nx && j < NAV.nz && NAV.grid[j*NAV.nx + i] === 1;
}
function clearLine(ax, az, bx, bz) {
  const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / .3);
  for (let k = 1; k < n; k++) { const t = k/n; if (navBlocked(ax + (bx - ax)*t, az + (bz - az)*t)) return false; }
  return true;
}
// the nearest open cell to a point, for starts and goals that sit inside something
function openNear(i, j) {
  const {nx, nz, grid} = NAV;
  for (let r = 0; r < 8; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
    if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
    const a = i + di, b = j + dj; if (a >= 0 && b >= 0 && a < nx && b < nz && !grid[b*nx + a]) return [a, b];
  }
  return [i, j];
}
function findPath(ax, az, bx, bz) {
  const {x0, z0, cs, nx, nz, grid} = NAV, cell = (x, z) => [clamp(Math.floor((x - x0)/cs), 0, nx - 1), clamp(Math.floor((z - z0)/cs), 0, nz - 1)];
  const [si, sj] = openNear(...cell(ax, az)), [ti, tj] = openNear(...cell(bx, bz)), goal = tj*nx + ti, start = sj*nx + si;
  const stamp = ++NAV.stamp, G0 = NAV.g, from = NAV.from, seen = NAV.seen;
  // a small binary heap keyed on f = g + h
  const heap = [], f = [];
  const push = (n, pr) => { heap.push(n); f.push(pr); let k = heap.length - 1; while (k) { const p = (k - 1) >> 1; if (f[p] <= f[k]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; [f[p], f[k]] = [f[k], f[p]]; k = p; } };
  const pop = () => { const top = heap[0], ln = heap.length - 1; heap[0] = heap[ln]; f[0] = f[ln]; heap.pop(); f.pop(); let k = 0; for (;;) { const a = 2*k + 1, b = a + 1; let m = k; if (a < heap.length && f[a] < f[m]) m = a; if (b < heap.length && f[b] < f[m]) m = b; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; [f[m], f[k]] = [f[k], f[m]]; k = m; } return top; };
  const h = n => Math.hypot((n % nx) - ti, ((n / nx) | 0) - tj);
  seen[start] = stamp; G0[start] = 0; from[start] = -1; push(start, h(start));
  let found = false, it = 0;
  while (heap.length && it++ < 9000) {
    const n = pop(); if (n === goal) { found = true; break; }
    const i = n % nx, j = (n / nx) | 0, gn = G0[n];
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= nz) continue;
      const m = b*nx + a; if (grid[m]) continue;
      if (di && dj && (grid[j*nx + a] || grid[b*nx + i])) continue;
      const ng = gn + (di && dj ? 1.414 : 1);
      if (seen[m] !== stamp || ng < G0[m]) { seen[m] = stamp; G0[m] = ng; from[m] = n; push(m, ng + h(m)); }
    }
  }
  if (!found) return [];
  const pts = []; for (let n = goal; n !== -1 && n !== start; n = from[n]) pts.push([x0 + ((n % nx) + .5)*cs, z0 + (((n / nx) | 0) + .5)*cs]);
  pts.reverse();
  // pull the string tight so people walk in straight lines between corners
  const out = []; let cx = ax, cz = az, k = 0;
  while (k < pts.length) { let far = k; for (let q = pts.length - 1; q > k; q--) if (clearLine(cx, cz, pts[q][0], pts[q][1])) { far = q; break; } out.push(pts[far]); [cx, cz] = pts[far]; k = far + 1; }
  return out;
}

function moveTo(e, x, z, dt) {
  const d = Math.hypot(x - e.pos.x, z - e.pos.z);
  if (d < .25) { e.vel.set(0, 0, 0); e.nav = null; return true; }
  // walk around tables and buildings: follow a path when the way ahead is blocked
  let tx = x, tz = z;
  if (NAV.grid && !clearLine(e.pos.x, e.pos.z, x, z)) {
    let n = e.nav;
    if (!n || n.ver !== NAV.ver || Math.hypot(n.tx - x, n.tz - z) > .8 || (!n.pts.length && (n.t -= dt) <= 0)) n = e.nav = {tx:x, tz:z, ver:NAV.ver, pts:findPath(e.pos.x, e.pos.z, x, z), t:1};
    while (n.pts.length && Math.hypot(n.pts[0][0] - e.pos.x, n.pts[0][1] - e.pos.z) < .3) n.pts.shift();
    if (n.pts.length) [tx, tz] = n.pts[0];
  } else e.nav = null;
  const dx = tx - e.pos.x, dz = tz - e.pos.z, dd = Math.max(1e-6, Math.hypot(dx, dz)), s = Math.min(e.speed, dd / dt);
  e.vel.set(dx/dd*s, 0, dz/dd*s); e.pos.x += e.vel.x*dt; e.pos.z += e.vel.z*dt;
  return false;
}
const dist2 = (e, x, z) => Math.hypot(x - e.pos.x, z - e.pos.z);
function updWorker(w, dt) {
  const before = w.stack.length;
  const gt = GATHER[w.kind];
  if (gt) {
    const pile = gt.pile().outStack;
    if (w.state === 'idle' || w.state === 'toSrc') {
      if (w.stack.length >= w.cap) { w.state = 'toDst'; return; }
      if (!w.node || w.node.logs <= 0) w.node = gt.nodes().filter(t => t.logs > 0).sort((a, b) => dist2(w, a.x, a.z) - dist2(w, b.x, b.z))[0];
      if (!w.node) { if (w.stack.length) w.state = 'toDst'; else goTo(w, ...w.home, dt); return; }
      w.state = 'toSrc';
      if (goTo(w, w.node.x, w.node.z + 1.1, dt)) { w.yaw = Math.PI; if ((w.tick -= dt) <= 0) { w.tick = .45; harvest(w.node, w); } }
    } else if (w.state === 'toDst') {
      if (goTo(w, ...gt.drop, dt)) w.state = 'unload';
    } else if (w.state === 'unload') {
      if ((w.tick -= dt) <= 0) { w.tick = .08; if (w.stack.length && pile.length < pile.cap) transfer(w.stack, pile); }
      if (!w.stack.length) w.state = 'idle';
    }
    return;
  }
  if (w.kind === 'builder') { updBuilder(w, dt); return; }
  if (w.kind === 'broker') { updBroker(w, dt); return; }
  if (w.kind === 'oilman') return;   // moved by the oil field
  if (w.kind === 'treasurer') {
    const c = w.pile && w.pile.value > 0 ? w.pile : treasurerPile(w);
    w.pile = c;
    if (!c) { goTo(w, ...w.home, dt); return; }
    if (goTo(w, c.x, c.z, dt)) {
      W.coins += c.value; popText(`+${c.value}`, new THREE.Vector3(c.x, 2.6, c.z), '#ffe06b'); c.value = 0;
      c.stack.items.splice(0).forEach((it, i) => flyAway(it.mesh, () => w.pos.clone().setY(1.4), .25 + i*.015));
      snd(1046, .06, 'triangle', .03); w.pile = null;
    }
    return;
  }
  const r = ROUTES[w.kind];
  switch (w.state) {
    case 'idle': {
      w.dst = r.dst();
      if (w.stack.length && w.dst) { w.state = 'toDst'; break; }
      const srcs = r.src().filter(Boolean);
      if (r.line && LINES[r.line]) {
        const want = LINES[r.line].q.flatMap(c => c.wants.filter(x => x.need > 0).map(x => x.type));
        srcs.sort((a, b) => (want.includes(ST[b.st].out) - want.includes(ST[a.st].out)) || (b.stack.length - a.stack.length));
      }
      w.src = srcs[0];
      if (!w.src || !w.dst) { goTo(w, ...w.home, dt); return; }
      w.state = 'toSrc'; break;
    }
    case 'toSrc': if (goTo(w, w.src.x, w.src.z, dt)) { w.state = 'load'; w.wait = 0; } break;
    case 'load': {
      // carriers for a table only load as many of a thing as the table has room for
      const type = w.dst.kind === 'table' && w.src.st && ST[w.src.st].out;
      if (type && w.stack.count([type]) >= w.dst.tb.room(type)) { w.state = w.stack.length ? 'toDst' : 'idle'; break; }
      zoneAct(w, w.src, dt);
      w.wait = w.stack.length !== before ? 0 : w.wait + dt;
      if (w.stack.length >= w.cap || (w.stack.length && w.wait > 1.2)) w.state = 'toDst';
      else if (!w.stack.length && w.wait > 2) w.state = 'idle';
      break;
    }
    case 'toDst': if (goTo(w, w.dst.x, w.dst.z, dt)) { w.state = 'unload'; w.wait = 0; } break;
    case 'unload':
      zoneAct(w, w.dst, dt);
      w.wait = w.stack.length !== before ? 0 : (w.wait || 0) + dt;
      if (!w.stack.length) { w.state = 'idle'; w.wait = 0; }
      else if (w.wait > 3 && w.dst.kind === 'table') w.state = 'toBin';   // leftovers nobody has room for
      break;
    case 'toBin': if (goTo(w, binZone.x, binZone.z, dt)) w.state = 'binning'; break;
    case 'binning': zoneAct(w, binZone, dt); if (!w.stack.length) w.state = 'idle'; break;
  }
}

