// The overworld, drawn top-down in 2D from Tuxemon's 16px tilesets (CC BY-SA, see CREDITS).
// Uses the game's globals (IMG, ctx, VW, VH). Same interface the 3D renderer had: load, init, build(map), render(state), project(x, y), resize, snapYaw.
// Each map is pre-drawn once into two canvases: the ground (under everyone) and the overhang (tree tops and
// other things you can walk behind, drawn over people). People, items and weather are drawn every frame.
window.World2D = (() => {
  const TS = 16;
  let map = null, ground = null, over = null, waterTiles = [], cam = { x: 0, y: 0 };

  // ------------------------------------------------------------ sheets and tiles
  const SHEETS = { nat: "nature", out: "outdoor", int: "interior", elec: "electronics", wat: "water" };
  async function load(base, progress) {
    const keys = Object.entries(SHEETS);
    let done = 0;
    await Promise.all(keys.map(([k, f]) => new Promise((res) => {
      const im = new Image();
      im.onload = im.onerror = () => { IMG["t_" + k] = im; progress(++done / keys.length); res(); };
      im.src = `assets/tiles/${f}.png`;
    })));
  }
  const sheet = (k) => (k === "buch" ? IMG.tiles : k === "floors" ? IMG.floors : IMG["t_" + k]);
  function tile(g, k, c, r, x, y, w = 1, h = 1) {
    const im = sheet(k);
    if (im && im.width) g.drawImage(im, c * TS, r * TS, w * TS, h * TS, x, y, w * TS, h * TS);
  }

  // Terrain families in nature.png: a 2x2 plain fill at [col,row], then a 3x3 raised-ground (cliff) set
  // two columns over, with stairs and a cave mouth on the row below it.
  const FAM = {
    teal: [0, 0], green: [8, 0], light: [16, 0], bright: [24, 0], sand: [32, 0],
    dirt: [0, 32], stone: [8, 32], mint: [16, 32], snow: [24, 32], ice: [32, 32],
  };
  // Trees in nature.png: big ones are 2 wide x 3 tall (tips, crown, trunk), with a seamless canopy row below.
  const TREES = {
    pine: [44, 0], round: [48, 0], darkpine: [44, 4], autumn: [48, 4], snowpine: [44, 8], snowround: [48, 8],
  };
  // look of each kind of place
  function themeOf(m) {
    if (m.walls === "ice") return { ground: "snow", path: "ice", wall: "ice", raise: "ice", grass: [26, 33], tint: "rgba(80,140,220,0.12)", shore: true };
    if (m.cave) return { ground: "dirt", path: "stone", wall: "stone", raise: "stone", grass: [25, 33], shore: true };
    if (m.frost) return { ground: "snow", path: "ice", tree: "snowpine", raise: "ice", grass: [26, 33], shore: true, floes: true };
    if (m.look === "ash") return { ground: "stone", path: "dirt", tree: "darkpine", raise: "stone", grass: [27, 33], tint: "rgba(70,30,20,0.18)", shore: true };
    if (m.look === "wood") return { ground: "green", path: "sandpatch", tree: "round", raise: "green", grass: [25, 33] };
    if (m.look === "steel") return { ground: "teal", path: "stone", tree: "darkpine", raise: "stone", grass: [25, 33] };
    if (m.look === "prime") return { ground: "bright", path: "sandpatch", tree: "autumn", raise: "bright", grass: [25, 33] };
    if (m.bg === "beach") return { ground: "teal", path: "sandpatch", tree: "round", raise: "sand", grass: [25, 33], palms: true };
    return { ground: "teal", path: "sandpatch", tree: m.bg === "forest" ? "pine" : "round", raise: "teal", grass: [25, 33] };
  }
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967296; };

  // ------------------------------------------------------------ build a map
  function build(m, BUILDINGS) {
    map = m;
    ground = document.createElement("canvas"); ground.width = m.w * TS; ground.height = m.h * TS;
    over = document.createElement("canvas"); over.width = m.w * TS; over.height = m.h * TS;
    const g = ground.getContext("2d"), o = over.getContext("2d");
    g.imageSmoothingEnabled = o.imageSmoothingEnabled = false;
    waterTiles = [];
    if (m.interior) buildInterior(m, g, o);
    else buildOutdoor(m, g, o, BUILDINGS);
  }

  const isWetOpen = (m, x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && m.grid[y][x] === "~";
  const at = (m, x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h ? null : m.grid[y][x]);
  const hOf = (m, x, y) => (m.heights && m.heights[y] && m.heights[y][x] != null ? m.heights[y][x] : 0);

  // a 3x3 autotile: which piece depends on which of the four neighbours are different
  function piece(same, x, y) {
    const n = !same(x, y - 1), s = !same(x, y + 1), w = !same(x - 1, y), e = !same(x + 1, y);
    return [w ? 0 : e ? 2 : 1, n ? 0 : s ? 2 : 1];
  }

  function buildOutdoor(m, g, o, BUILDINGS) {
    const th = themeOf(m), F = FAM[th.ground];
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const ch = m.grid[y][x], X = x * TS, Y = y * TS;
      tile(g, "nat", F[0] + (x & 1), F[1] + (y & 1), X, Y);
      if (ch === "=") {
        if (th.path === "sandpatch") tile(g, "buch", 3, 1, X, Y);
        else { const P = FAM[th.path]; tile(g, "nat", P[0] + (x & 1), P[1] + (y & 1), X, Y); }
      } else if (ch === "~") {
        waterTiles.push([x, y]);
        tile(g, "buch", 3, 4, X, Y);
      } else if (ch === ",") {
        tile(g, "out", th.grass[0], th.grass[1], X, Y);
      } else if (ch === "f") {
        const fl = [[59, 0], [59, 3], [59, 6], [59, 9], [59, 12]][Math.floor(hash(x, y) * 5)];
        tile(g, "nat", fl[0] + Math.floor(hash(y, x) * 4), fl[1], X, Y);
      } else if (ch === "I") {
        const P = FAM.ice; tile(g, "nat", P[0] + (x & 1), P[1] + (y & 1), X, Y);
      } else if (ch === "R") {
        if (m.frost) tile(g, "nat", 42, 16, X, Y); else tile(g, "nat", 42, 4, X, Y);
      } else if (ch === "F") {
        const h = at(m, x - 1, y) === "F" || at(m, x + 1, y) === "F";
        if (h) tile(g, "out", 17, 26, X, Y); else tile(g, "out", 16, 27, X, Y);
      }
    }
    // Sand and water edges live on the grass beside them (Tuxemon's 3x3 sets): pick the piece from where the
    // path or water is around each grass tile.
    const rimOn = (kind, set) => {
      const is = (a, b) => at(m, a, b) === kind;
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        if (!".,f".includes(m.grid[y][x]) || hOf(m, x, y)) continue;
        const N = is(x, y - 1), S2 = is(x, y + 1), W = is(x - 1, y), E = is(x + 1, y);
        let c = null, r = null;
        if (S2 && !N) r = 0; else if (N && !S2) r = 2;
        if (E && !W) c = 0; else if (W && !E) c = 2;
        if (r === null && c === null) { // only a corner touches
          if (is(x + 1, y + 1)) [c, r] = [0, 0]; else if (is(x - 1, y + 1)) [c, r] = [2, 0];
          else if (is(x + 1, y - 1)) [c, r] = [0, 2]; else if (is(x - 1, y - 1)) [c, r] = [2, 2];
          else continue;
        }
        if (r === null) r = 1; if (c === null) c = 1;
        if ((N && S2) || (W && E)) continue; // squeezed between two: leave it plain
        tile(g, "buch", set[0] + c, set[1] + r, x * TS, y * TS);
        const t = m.grid[y][x];
        if (t === ",") tile(g, "out", th.grass[0], th.grass[1], x * TS, y * TS);
      }
    };
    if (th.path === "sandpatch") rimOn("=", [2, 0]);
    if (th.ground !== "snow" && th.ground !== "stone") rimOn("~", [2, 3]);
    // raised ground: cliffs edge wherever the neighbour is lower; half steps are stairs
    if (m.heights) {
      const R = FAM[th.raise];
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        const h = hOf(m, x, y);
        if (!h || m.grid[y][x] === "~") continue;
        const X = x * TS, Y = y * TS;
        if (h % 1) { tile(g, "nat", R[0] + 3, R[1] + 3, X, Y); continue; }
        const [c, r] = piece((a, b) => a < 0 || b < 0 || a >= m.w || b >= m.h || hOf(m, a, b) >= h, x, y);
        tile(g, "nat", R[0] + 2 + c, R[1] + r, X, Y);
        if (m.grid[y][x] === ",") tile(g, "out", th.grass[0], th.grass[1], X, Y);
      }
    }
    // caves: the T tiles are rock walls, drawn as raised ground with cliff edges toward the open floor
    if (th.wall) {
      const Wf = FAM[th.wall], isT = (a, b) => { const t = at(m, a, b); return t === null || t === "T"; };
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        if (m.grid[y][x] !== "T") continue;
        const [c, r] = piece(isT, x, y);
        tile(g, "nat", Wf[0] + 2 + c, Wf[1] + r, x * TS, y * TS);
      }
    }
    // a cave mouth in the cliff wherever a map says one is
    for (const [mx, my] of m.mouths || []) {
      const Wf = FAM[th.wall || th.raise];
      tile(g, "nat", Wf[0] + 7, Wf[1] + 3, mx * TS, my * TS);
      for (let yy = my - 1; yy >= 0; yy--) { g.fillStyle = "#141c28"; g.fillRect(mx * TS, yy * TS, TS, TS); }
    }
    // icy and rocky shores: a stone rim on the water's edge; ice floes drift on open water
    if (th.shore) {
      const isWet = (a, b) => { const t = at(m, a, b); return t === null || t === "~"; };
      for (const [x, y] of waterTiles) { const [c, r] = piece(isWet, x, y); if (c !== 1 || r !== 1) tile(g, "wat", 15 + c, 1 + r, x * TS, y * TS); }
    }
    if (th.floes) for (const [x, y] of waterTiles) {
      if (hash(x * 3, y * 5) < 0.025 && [[1, 0], [0, 1], [1, 1], [-1, 0], [0, -1]].every(([a, b]) => isWetOpen(m, x + a, y + b)))
        g.drawImage(sheet("wat"), 40 * TS + 8, 34 * TS, 24, 28, x * TS - 4, y * TS - 4, 24, 28);
    }
    // trees: full 2x2 blocks of T get a big tree whose tips overhang the tile above; the rest get small trees
    const T = TREES[th.tree], isT = (x, y) => { const t = at(m, x, y); return t === null || t === "T"; };
    const done = new Set();
    for (let y = 0; y < m.h && !th.wall; y++) for (let x = 0; x < m.w; x++) {
      if (m.grid[y][x] !== "T" || done.has(x + "," + y)) continue;
      const bx = x - (x & 1), by = y - (y & 1);
      if (isT(bx, by) && isT(bx + 1, by) && isT(bx, by + 1) && isT(bx + 1, by + 1)) {
        for (const [a, b] of [[bx, by], [bx + 1, by], [bx, by + 1], [bx + 1, by + 1]]) done.add(a + "," + b);
        // canopy under, then trunk row, crown, and the tips on the overhang layer
        tile(g, "nat", T[0], T[1] + 1, bx * TS, by * TS, 2, 2);
        tile(o, "nat", T[0], T[1], bx * TS, (by - 1) * TS, 2, 1);
        if (!isT(bx, by - 1) || by - 1 < 0) { /* tips poke over open ground */ }
      } else {
        done.add(x + "," + y);
        smallTree(g, o, th, x, y);
      }
    }
    // the overhang tips of a forest's top row are drawn over people; inside the forest they're just more canopy
    // obstacles cleared with field moves
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const ch = m.grid[y][x], X = x * TS, Y = y * TS;
      if (ch === "b") { tile(g, "nat", 52, 11, X, Y); tile(o, "nat", 52, 10, X, Y - TS); }       // CUT: a small golden tree
      else if (ch === "k") tile(g, "nat", 43, 0, X, Y);                                          // ROCK SMASH: a cracked brown rock
      else if (ch === "o") { g.drawImage(sheet("nat"), 42 * TS, 6 * TS, 32, 32, X - 2, Y - 6, 20, 22); } // STRENGTH: a big grey boulder
    }
    // scattered details on open ground: rocks, flowers, stumps, shells by the sea
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      if (m.grid[y][x] !== "." || hOf(m, x, y) % 1) continue;
      const r = hash(x + 7, y + 3);
      if (r > 0.035) continue;
      const X = x * TS, Y = y * TS, k = Math.floor(hash(y, x + 11) * 4);
      if (m.frost) tile(g, "nat", [40, 41, 42, 43][k], 16, X, Y);
      else if (th.ground === "stone") tile(g, "nat", [40, 41, 42, 43][k], 4, X, Y);
      else if (k === 0) tile(g, "out", 28, 29, X, Y);
      else tile(g, "nat", [59, 60, 61][k - 1], 6, X, Y);
    }
    // buildings from core_buildings.png, fitted to their footprint
    for (const b of m.buildings || []) {
      const B = BUILDINGS[b.type];
      g.drawImage(IMG.buildings, ...B.src, b.x * TS, b.y * TS, B.tw * TS, B.th * TS);
    }
    for (const s of m.signs || []) g.drawImage(IMG.sign, s.x * TS, s.y * TS);
  }
  function smallTree(g, o, th, x, y) {
    const X = x * TS, Y = y * TS;
    if (th.palms && hash(x, y) < 0.5) { tile(g, "out", 26, 38, X, Y); tile(o, "out", 26, 37, X, Y - TS); return; }
    const col = { pine: [52, 0], round: [52, 2], darkpine: [52, 18], autumn: [52, 10], snowpine: [52, 12], snowround: [52, 16] }[th.tree] || [52, 0];
    tile(g, "nat", col[0], col[1] + 1, X, Y);
    tile(o, "nat", col[0], col[1], X, Y - TS);
  }

  // ------------------------------------------------------------ interiors
  const WALL = { cream: [0, 5], blue: [1, 5], green: [1, 0], wood: [0, 0] };
  const FLOOR = { tile: [3, 3], planks: [1, 3], parquet: [0, 3], gray: [2, 3] };
  function buildInterior(m, g, o) {
    const W = WALL[m.wall || "cream"], Fl = FLOOR[m.floor || "tile"];
    const isW = (x, y) => { const t = at(m, x, y); return t === null || t === "W"; };
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const ch = m.grid[y][x], X = x * TS, Y = y * TS;
      if (ch === "W") { tile(g, "floors", W[0], W[1] + (!isW(x, y - 1) ? 0 : !isW(x, y + 1) ? 2 : 1), X, Y); continue; }
      tile(g, "floors", Fl[0], Fl[1] + (m.floor === "tile" || m.floor === "gray" ? 0 : (y & 1)), X, Y);
      if (ch === "I") { const P = FAM.ice; tile(g, "nat", P[0] + (x & 1), P[1] + (y & 1), X, Y); }
      else if (ch === "C") { const l = at(m, x - 1, y) === "C", r = at(m, x + 1, y) === "C"; tile(g, "int", !l ? 6 : !r ? 8 : 7, 9, X, Y); }
      else if (ch === "R") tile(g, "nat", 42, 4, X, Y);
      else if (ch === "H") tile(g, "out", 25, 33, X, Y);
      else if (ch === "P") { tile(g, "int", 6, 10, X, Y); tile(o, "int", 6, 9, X, Y - TS); }
      else if (ch === "X") { g.fillStyle = "rgba(120,40,30,0.55)"; g.fillRect(X + 1, Y + 4, TS - 2, TS - 4); }
      else if (ch === "1" || ch === "2" || ch === "y") {
        g.fillStyle = ch === "y" ? "#606060" : ch === "1" ? (m.gateCol ? "#" + m.gateCol.toString(16).padStart(6, "0") : "#e0a020") : "#30a0e0";
        g.fillRect(X + 3, Y + 3, 10, 10); g.fillStyle = "rgba(255,255,255,0.4)"; g.fillRect(X + 4, Y + 4, 8, 3);
      } else if (ch === "g" || ch === "j") {
        tile(g, "out", 22, 27, X, Y);
        g.fillStyle = ch === "g" ? "rgba(224,160,32,0.45)" : "rgba(48,160,224,0.45)"; g.fillRect(X, Y, TS, TS);
      } else if (ch === "t") tile(g, "int", 9, 9, X, Y);
      else if (ch === "Q") tile(g, "elec", at(m, x - 1, y) === "Q" ? 1 : 0, 0, X, Y); // PC: monitor, then tower
    }
    for (const [rx, ry] of m.rugs || []) g.drawImage(IMG.floors, 5 * TS, 0, 3 * TS, 3 * TS, rx * TS, ry * TS, 3 * TS, 3 * TS);
    for (const [dx, dy, kind] of m.decor || []) tile(g, "floors", kind === "poster" ? 2 : 3, 1, dx * TS, dy * TS);
    // a couple of plants so rooms aren't bare
    if (!m.gym) for (const [px, py] of [[0, 3], [m.w - 1, 3]]) if (at(m, px, py) === ".") { tile(g, "int", 8, 13, px * TS, py * TS); tile(o, "int", 8, 12, px * TS, (py - 1) * TS); }
  }

  // ------------------------------------------------------------ people
  // Tuxemon NPC sheets: 3 walking frames across, rows facing down, left, right, up. Each frame is 16x32.
  const ROW = { down: 0, left: 1, right: 2, up: 3 };
  function drawPerson(sh, dir, moving, x, y, now, bob = 0) {
    if (!sh) return;
    const f = moving ? [0, 1, 2, 1][Math.floor(now * 8) % 4] : 1;
    ctx.drawImage(sh, f * 16, (ROW[dir] || 0) * 32, 16, 32, Math.round(x), Math.round(y - 17 + bob), 16, 32);
  }
  const dirOf = (a) => { const s = -Math.sin(a), c = -Math.cos(a); return Math.abs(s) > Math.abs(c) ? (s > 0 ? "right" : "left") : c > 0 ? "down" : "up"; };

  // ------------------------------------------------------------ weather
  let flakes = [];
  function drawWeather(kind, dt) {
    if (!kind) { flakes = []; return; }
    const n = kind === "rain" ? 90 : 60;
    while (flakes.length < n) flakes.push({ x: Math.random() * VW, y: Math.random() * VH, v: 0.6 + Math.random() * 0.6 });
    for (const f of flakes) {
      if (kind === "rain") { f.y += 260 * f.v * dt; f.x -= 40 * dt; ctx.fillStyle = "rgba(200,220,255,0.7)"; ctx.fillRect(Math.round(f.x), Math.round(f.y), 1, 5); }
      else {
        f.y += (kind === "snow" ? 28 : 16) * f.v * dt; f.x += Math.sin((f.y + f.v * 50) / 14) * 12 * dt;
        ctx.fillStyle = kind === "snow" ? "rgba(255,255,255,0.9)" : "rgba(200,190,180,0.85)";
        ctx.fillRect(Math.round(f.x), Math.round(f.y), f.v > 0.9 ? 2 : 1, f.v > 0.9 ? 2 : 1);
      }
      if (f.y > VH) { f.y = -4; f.x = Math.random() * (VW + 40); }
      if (f.x < -4) f.x = VW + 2;
      if (f.x > VW + 4) f.x = -2;
    }
  }

  // ------------------------------------------------------------ render a frame
  function render(st, dt, now) {
    if (!map || !ground) return;
    const p = st.player;
    // camera centred on the player, kept inside the map (small rooms sit in the middle)
    const mw = map.w * TS, mh = map.h * TS;
    const want = (v, size, view) => (size <= view ? (size - view) / 2 : Math.max(0, Math.min(size - view, v - view / 2)));
    cam.x = Math.round(want(p.px * TS, mw, VW)); cam.y = Math.round(want(p.pz * TS - 8, mh, VH));
    ctx.fillStyle = map.interior ? "#101010" : "#000"; ctx.fillRect(0, 0, VW, VH);
    ctx.drawImage(ground, -cam.x, -cam.y);
    // shimmer on the water
    const sh = Math.floor(now * 2);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    for (const [x, y] of waterTiles) {
      const sx = x * TS - cam.x, sy = y * TS - cam.y;
      if (sx < -TS || sy < -TS || sx > VW || sy > VH) continue;
      if (((x * 7 + y * 13 + sh) % 9) === 0) ctx.fillRect(sx + 4 + ((sh + x) % 6), sy + 6 + ((y + sh) % 5), 5, 1);
    }
    // everything that stands up, back to front
    const things = [];
    for (const it of st.pickups || []) things.push({ y: it.y + 0.5, draw: () => {
      const sx = it.x * TS - cam.x, sy = it.y * TS - cam.y;
      ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(sx + 4, sy + 12, 8, 2);
      if (IMG.tuxeball) ctx.drawImage(IMG.tuxeball, 0, 0, 16, 16, sx, sy - 2 + Math.round(Math.sin(now * 3 + it.x) * 1), 16, 16);
    } });
    for (const s of st.statues || []) things.push({ y: s.tiles[0][1] + 0.9, draw: () => {
      const im = IMG["mon_" + s.slug]; if (!im) return;
      const [tx, ty] = s.tiles[0], sx = tx * TS - cam.x + 8, sy = ty * TS - cam.y + 16;
      ctx.drawImage(im, 0, 0, 64, 64, sx - 24, sy - 46 + Math.round(Math.sin(now * 2) * 1.5), 48, 48);
    } });
    for (const n of st.npcs || []) {
      if (n.hidden) continue;
      const fx = n.fx != null ? n.fx / TS : n.x, fy = n.fy != null ? n.fy / TS : n.y;
      things.push({ y: fy + 0.5, draw: () => drawPerson(n.sheet || IMG["npc_" + n.sprite], n.dir || "down", !!n.walking, fx * TS - cam.x, fy * TS - cam.y, now) });
    }
    things.push({ y: p.pz, draw: () => {
      const sx = p.px * TS - cam.x - 8, sy = p.pz * TS - cam.y - 8, dir = p.dir || dirOf(p.angle);
      if (p.mount && st.mountImg) { // surfing or flying: ride on top of your monster
        const bob = Math.sin(now * 4) * 1.5;
        ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.beginPath(); ctx.ellipse(sx + 8, sy + 14, 11, 4, 0, 0, 7); ctx.fill();
        ctx.drawImage(st.mountImg, 0, 0, 64, 64, sx - 8, sy - 10 + bob, 32, 32);
        drawPerson(st.playerSheet, dir, false, sx, sy - 6 + bob, now);
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.22)"; ctx.fillRect(sx + 3, sy + 13, 10, 3);
        drawPerson(st.playerSheet, dir, Math.abs(p.speed) > 0.05, sx, sy + (p.ground ? -0 : 0), now);
      }
    } });
    things.sort((a, b) => a.y - b.y).forEach((t) => t.draw());
    ctx.drawImage(over, -cam.x, -cam.y);
    // light: night falls outdoors, caves are black outside FLASH's circle
    const th = !map.interior && themeOf(map);
    if (th && th.tint) { ctx.fillStyle = th.tint; ctx.fillRect(0, 0, VW, VH); }
    if (!map.interior && !st.cave) {
      const dark = 1 - st.daylight;
      if (dark > 0.01) { ctx.fillStyle = `rgba(16,24,72,${(dark * 0.5).toFixed(3)})`; ctx.fillRect(0, 0, VW, VH); }
      if (st.weather === "rain" || st.weather === "ash") { ctx.fillStyle = "rgba(60,64,72,0.18)"; ctx.fillRect(0, 0, VW, VH); }
    }
    if (st.cave || map.dark) {
      const sx = p.px * TS - cam.x, sy = p.pz * TS - cam.y - 6, r = st.flash ? 70 : map.dark ? 34 : 22;
      const gr = ctx.createRadialGradient(sx, sy, r * 0.5, sx, sy, r);
      gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,0.96)");
      ctx.fillStyle = gr; ctx.fillRect(0, 0, VW, VH);
    }
    drawWeather(st.weather, dt);
  }
  // where a tile-space point lands on screen (for the "!" bubble over someone)
  function project(x, y, h = 0) { return { x: x * TS - cam.x + 8, y: y * TS - cam.y - 8 - h * 4 }; }
  return { load, init() {}, build, render, project, resize() {}, snapYaw() {}, themeOf, TS };
})();
