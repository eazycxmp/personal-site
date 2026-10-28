// 3D overworld renderer built from Kenney's CC0 low-poly models (assets/models).
// Game logic stays on the tile grid; this module turns the current map into a lit 3D scene
// with instanced trees/grass/flowers, real building models scaled to their footprints,
// animated characters, and a smooth over-the-shoulder chase camera.
// Coordinates: 1 unit = 1 tile, tile (x, y) spans X [x, x+1], Z [y, y+1], Y is up.
window.World3D = (function () {
  const THREE = window.THREE;
  let renderer, scene, camera, sun, hemi, IMG, mapRoot = null, water = null;
  const models = {};     // "pack/name" -> { scene, animations, box }
  const actors = new Map();
  let camYaw = 0, camPos = null, lookAt = null;
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3();
  const UPV = new THREE.Vector3(0, 1, 0);

  // ------------------------------------------------------------ loading
  const MODEL_LIST = {
    nature: ["tree_default", "tree_oak", "tree_detailed", "tree_fat", "tree_pineRoundA", "tree_pineRoundC", "tree_pineTallA",
      "tree_cone", "tree_palmTall", "tree_default_dark", "tree_oak_dark", "tree_pineTallA_detailed", "grass_large",
      "grass_leafsLarge", "grass", "flower_redA", "flower_purpleA", "flower_yellowA", "plant_bush", "plant_bushLarge",
      "rock_smallA", "rock_largeA", "rock_tallA", "fence_simple", "sign", "mushroom_red", "stump_round", "log", "path_stone",
      "lily_large", "lily_small"],
    characters: ["male", "female"].flatMap((g) => "abcdef".split("").map((v) => `character-${g}-${v}`)),
    commercial: ["building-e", "building-l", "building-k", "building-m", "building-c", "building-skyscraper-e", "detail-awning-wide"],
    suburban: ["building-type-a", "building-type-c", "building-type-m", "planter"],
    town: ["banner-red", "banner-green", "lantern", "fountain-round", "stall-red", "rock-large", "hedge", "pillar-stone"],
  };
  async function load(base, progress) {
    const loader = new window.GLTFLoader();
    const jobs = [];
    for (const [pack, names] of Object.entries(MODEL_LIST)) for (const n of names) jobs.push([pack, n]);
    let done = 0;
    await Promise.all(jobs.map(([pack, n]) => new Promise((res) => {
      loader.load(`${base}${pack}/${n}.glb`, (g) => {
        g.scene.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = true; o.receiveShadow = true;
            // KHR_materials_unlit comes in as MeshBasicMaterial: swap to lit Lambert so models get shading
            const lit = (mt) => mt.isMeshBasicMaterial ? new THREE.MeshLambertMaterial({ color: mt.color, map: mt.map, vertexColors: mt.vertexColors, transparent: mt.transparent, opacity: mt.opacity, alphaTest: mt.alphaTest, side: mt.side }) : mt;
            o.material = Array.isArray(o.material) ? o.material.map(lit) : lit(o.material);
            for (const mt of [].concat(o.material)) {
              if (mt.map) mt.map.magFilter = THREE.NearestFilter;
              // Kenney's foliage is a pale teal; push it toward a richer leaf green
              if (/leaf|grass/i.test(mt.name || "") && mt.color) {
                const hsl = {}; mt.color.getHSL(hsl);
                mt.color.setHSL(hsl.h * 0.45 + 0.3 * 0.55, Math.min(1, hsl.s * 1.1), hsl.l * 0.72);
              }
              // Kenney exports metallic=1 with no env map, which renders black: make them matte
              if ("metalness" in mt) { mt.metalness = 0; mt.roughness = Math.max(0.75, mt.roughness ?? 1); }
            }
          }
        });
        g.scene.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(g.scene);
        models[`${pack}/${n}`] = { scene: g.scene, animations: g.animations, box };
        if (progress) progress(++done / jobs.length);
        res();
      }, undefined, (e) => { console.warn("model failed", pack, n, e); res(); });
    })));
    return Object.keys(models).length;
  }

  function init(container, images) {
    IMG = images;
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.domElement.id = "world3d";
    container.prepend(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(55, 1.5, 0.1, 120);
    hemi = new THREE.HemisphereLight(0xdff2ff, 0x5a7a3a, 0.75);
    scene.add(hemi);
    sun = new THREE.DirectionalLight(0xfff1d6, 1.35);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -16; sc.right = 16; sc.top = 16; sc.bottom = -16; sc.near = 1; sc.far = 60;
    sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03;
    scene.add(sun); scene.add(sun.target);
  }
  function resize(w, h) {
    if (!renderer) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  // ------------------------------------------------------------ helpers
  // deterministic RNG per map so scenery stays put between visits
  function rng(seedStr) {
    let h = 2166136261;
    for (const c of seedStr) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  // Collects transforms per model and emits one InstancedMesh per sub-mesh.
  function Scatter() {
    const lists = {};
    return {
      add(key, x, zz, { rot = 0, scale = 1, y = 0, sx, sy, sz } = {}) {
        if (!models[key]) return;
        tmpQ.setFromAxisAngle(UPV, rot);
        tmpS.set(sx ?? scale, sy ?? scale, sz ?? scale);
        tmpP.set(x, y, zz);
        (lists[key] = lists[key] || []).push(new THREE.Matrix4().compose(tmpP, tmpQ, tmpS));
      },
      build(parent) {
        for (const [key, mats] of Object.entries(lists)) {
          models[key].scene.traverse((o) => {
            if (!o.isMesh) return;
            const im = new THREE.InstancedMesh(o.geometry, o.material, mats.length);
            mats.forEach((m, i) => { tmpM.multiplyMatrices(m, o.matrixWorld); im.setMatrixAt(i, tmpM); });
            im.castShadow = true; im.receiveShadow = true;
            im.instanceMatrix.needsUpdate = true;
            parent.add(im);
          });
        }
      },
    };
  }
  function place(key, x, zz, { rot = 0, scale = 1, y = 0 } = {}) {
    const m = models[key];
    if (!m) return new THREE.Group();
    const o = m.scene.clone(true);
    o.position.set(x, y, zz); o.rotation.y = rot; o.scale.setScalar(scale);
    return o;
  }
  const size = (key) => { const b = models[key].box; return new THREE.Vector3().subVectors(b.max, b.min); };
  function own(mesh) { mesh.userData.own = true; return mesh; }

  // ------------------------------------------------------------ build a map
  const THEMES = {
    default: { trees: ["tree_default", "tree_oak", "tree_detailed", "tree_fat", "tree_pineRoundA", "tree_pineRoundC"], grass: 0x5e9e45, grassDark: 0x467f38, sky: 0xa8d8f0 },
    tide: { trees: ["tree_palmTall", "tree_default", "tree_oak", "tree_fat"], grass: 0x7cbc55, grassDark: 0x5aa046, sky: 0xb4e2f6 },
    volt: { trees: ["tree_cone", "tree_pineTallA", "tree_pineRoundA", "tree_detailed"], grass: 0x68aa52, grassDark: 0x4d8c42, sky: 0xa6d2ee },
    shade: { trees: ["tree_default_dark", "tree_oak_dark", "tree_pineTallA_detailed", "tree_pineTallA"], grass: 0x4f7f48, grassDark: 0x3a6538, sky: 0x8b9cb8 },
  };
  function themeFor(m) {
    const id = m.id || "";
    if (id.startsWith("tide") || id === "route2") return THEMES.tide;
    if (id.startsWith("volt") || id === "route3") return THEMES.volt;
    if (id.startsWith("shade") || id === "route4" || id === "hall") return THEMES.shade;
    return THEMES.default;
  }

  function clearMap() {
    if (mapRoot) {
      scene.remove(mapRoot);
      mapRoot.traverse((o) => {
        if (o.isInstancedMesh && !o.userData.own) o.dispose();
        else if (o.isMesh && o.userData.own) { o.geometry.dispose(); [].concat(o.material).forEach((mt) => { if (mt.map) mt.map.dispose(); mt.dispose(); }); }
      });
    }
    for (const a of actors.values()) scene.remove(a.root);
    actors.clear();
    if (activeMount) { scene.remove(activeMount); activeMount = null; }
    water = null;
    markers.length = 0;
    blockers.length = 0;
  }

  function build(m, BUILDINGS) {
    clearMap();
    mapRoot = new THREE.Group();
    scene.add(mapRoot);
    camPos = null; lookAt = null;
    if (m.interior) buildInterior(m); else buildOutdoor(m, BUILDINGS);
  }

  // Tile lookup that extends past the map edge: forest everywhere, except an open corridor
  // continuing each exit's path outward so leaving never looks like walking into a wall.
  function tileOf(m, x, y) {
    if (x >= 0 && y >= 0 && x < m.w && y < m.h) return m.grid[y][x];
    for (const e of m.exits || []) {
      const vert = e.edge === "n" || e.edge === "s";
      const beyond = e.edge === "n" ? y < 0 : e.edge === "s" ? y >= m.h : e.edge === "w" ? x < 0 : x >= m.w;
      if (!beyond) continue;
      const along = vert ? x - e.at : y - e.at;
      if (along >= 0 && along < e.w) return "=";
      if (along >= -2 && along < e.w + 2) return ".";
    }
    return "T";
  }
  // per-tile vertex-coloured ground with a little colour noise; water tiles sink with sandy banks
  function groundMesh(m, th, R, pad) {
    const pos = [], col = [], idx = [];
    const c = new THREE.Color();
    const tile = (x, y) => tileOf(m, x, y);
    const quad = (pts, hex, jitter) => {
      const n = pos.length / 3;
      for (const p of pts) pos.push(...p);
      c.setHex(hex); if (jitter) c.offsetHSL(0, 0, jitter);
      c.convertSRGBToLinear();
      for (let k = 0; k < 4; k++) col.push(c.r, c.g, c.b);
      idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
    };
    for (let y = -pad; y < m.h + pad; y++) for (let x = -pad; x < m.w + pad; x++) {
      const ch = tile(x, y);
      let base = th.grass, h = 0;
      if (ch === "=") base = 0xd9c08a;
      else if (ch === "," || ch === "T") base = th.grassDark;
      else if (ch === "~") { base = 0x2d5d86; h = -0.35; }
      quad([[x, h, y + 1], [x + 1, h, y + 1], [x + 1, h, y], [x, h, y]], base, (R() - 0.5) * 0.025);
      if (ch !== "~") continue;
      const bank = 0x9a8a5e;
      if (tile(x, y - 1) !== "~") quad([[x, h, y], [x + 1, h, y], [x + 1, 0, y], [x, 0, y]], bank);
      if (tile(x, y + 1) !== "~") quad([[x + 1, h, y + 1], [x, h, y + 1], [x, 0, y + 1], [x + 1, 0, y + 1]], bank);
      if (tile(x - 1, y) !== "~") quad([[x, h, y + 1], [x, h, y], [x, 0, y], [x, 0, y + 1]], bank);
      if (tile(x + 1, y) !== "~") quad([[x + 1, h, y], [x + 1, h, y + 1], [x + 1, 0, y + 1], [x + 1, 0, y]], bank);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const mesh = own(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })));
    mesh.receiveShadow = true;
    return mesh;
  }

  function buildOutdoor(m, BUILDINGS) {
    const th = themeFor(m), R = rng(m.id || m.name);
    scene.background = new THREE.Color(th.sky);
    scene.fog = new THREE.Fog(th.sky, 16, 38);
    const dark = th === THEMES.shade;
    hemi.intensity = dark ? 0.45 : 0.6;
    sun.intensity = dark ? 0.75 : 1.15;
    sun.color.setHex(dark ? 0xb8c4ff : 0xfff1d6);
    const PAD = 9;
    mapRoot.add(groundMesh(m, th, R, PAD));
    const sc = Scatter();
    const treeAt = (x, zz) => {
      const key = "nature/" + th.trees[Math.floor(R() * th.trees.length)];
      sc.add(key, x, zz, { rot: R() * 6.28, scale: (2.6 + R() * 1.3) / size(key).y });
    };
    const waterTiles = [];
    for (let y = -PAD; y < m.h + PAD; y++) for (let x = -PAD; x < m.w + PAD; x++) {
      const inside = x >= 0 && y >= 0 && x < m.w && y < m.h;
      const ch = tileOf(m, x, y);
      const cx = x + 0.5, cz = y + 0.5;
      if (ch === "T") {
        const far = Math.max(x < 0 ? -x : x - m.w + 1, y < 0 ? -y : y - m.h + 1, 0);
        if (inside || R() < (far > 5 ? 0.35 : 0.8)) {
          treeAt(cx + (R() - 0.5) * 0.5, cz + (R() - 0.5) * 0.5);
          if (inside && R() < 0.3) sc.add("nature/plant_bushLarge", cx + (R() - 0.5), cz + (R() - 0.5), { rot: R() * 6, scale: 1.4 });
        }
      } else if (ch === ",") {
        for (let k = 0; k < 4; k++) sc.add(k === 3 ? "nature/grass_leafsLarge" : "nature/grass_large", x + 0.15 + R() * 0.7, y + 0.15 + R() * 0.7, { rot: R() * 6.28, scale: 2.4 + R() * 0.8 });
      } else if (ch === "f") {
        const fl = ["flower_redA", "flower_purpleA", "flower_yellowA"];
        for (let k = 0; k < 3; k++) sc.add("nature/" + fl[Math.floor(R() * 3)], x + 0.2 + R() * 0.6, y + 0.2 + R() * 0.6, { rot: R() * 6, scale: 1.5 });
      } else if (ch === "F") {
        const horiz = m.grid[y][x - 1] === "F" || m.grid[y][x + 1] === "F";
        const fs = size("nature/fence_simple");
        sc.add("nature/fence_simple", cx, cz, { rot: horiz ? 0 : Math.PI / 2, sx: 1 / fs.x, sy: 1.1, sz: 1.1 });
      } else if (ch === "~") {
        waterTiles.push([x, y]);
        if (R() < 0.12) sc.add("nature/" + (R() < 0.5 ? "lily_large" : "lily_small"), cx + (R() - 0.5) * 0.5, cz + (R() - 0.5) * 0.5, { rot: R() * 6, scale: 1.3, y: -0.08 });
      } else if (ch === "." && inside && R() < 0.035) {
        const deco = ["plant_bush", "rock_smallA", "mushroom_red", "grass", "stump_round", "grass"];
        sc.add("nature/" + deco[Math.floor(R() * deco.length)], x + 0.2 + R() * 0.6, y + 0.2 + R() * 0.6, { rot: R() * 6, scale: 1.2 });
      } else if (ch === "=" && R() < 0.06) {
        sc.add("nature/path_stone", cx, cz, { rot: R() * 6, scale: 0.9, y: 0.005 });
      }
    }
    sc.build(mapRoot);
    if (waterTiles.length) {
      const wg = new THREE.PlaneGeometry(1, 1);
      wg.rotateX(-Math.PI / 2);
      const wm = new THREE.MeshStandardMaterial({ color: 0x4aa3df, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.82 });
      water = own(new THREE.InstancedMesh(wg, wm, waterTiles.length));
      waterTiles.forEach(([x, y], i) => { tmpM.makeTranslation(x + 0.5, -0.1, y + 0.5); water.setMatrixAt(i, tmpM); });
      water.receiveShadow = true;
      mapRoot.add(water);
    }
    for (const s of m.signs || []) {
      const lines = s.text.split("\n").slice(0, 2);
      mapRoot.add(signpost(lines, s.x + 0.5, s.y + 0.6, 0, { width: 1.7, twoSided: true }));
    }
    exitSigns(m);
    for (const b of m.buildings || []) {
      const g = buildingModel(b, BUILDINGS[b.type]);
      // footprint used to hide the building when it blocks the view of the player
      g.userData.box = [b.x - 0.3, b.y - 0.3, b.x + BUILDINGS[b.type].tw + 0.3, b.y + BUILDINGS[b.type].th + 1.0];
      blockers.push(g);
      mapRoot.add(g);
    }
  }

  // Signposts beside every map exit, saying where it leads; lanterns flank the opening.
  function exitSigns(m) {
    const solid = (x, y) => x < 0 || y < 0 || x >= m.w || y >= m.h || "T~FWC".includes(m.grid[y][x]);
    const ROT = { n: 0, s: Math.PI, w: Math.PI / 2, e: -Math.PI / 2 }; // board faces back into the map
    for (const e of m.exits || []) {
      if (!e.label) continue;
      const vertical = e.edge === "n" || e.edge === "s";
      const depth = e.edge === "n" ? 2 : e.edge === "s" ? m.h - 3 : e.edge === "w" ? 2 : m.w - 3;
      // pick the side of the opening that is open ground
      let spot = null;
      for (const off of [-1, e.w, -2, e.w + 1]) {
        const tx = vertical ? e.at + off : depth, ty = vertical ? depth : e.at + off;
        if (!solid(tx, ty)) { spot = [tx, ty]; break; }
      }
      if (!spot) spot = vertical ? [e.at - 1, depth] : [depth, e.at - 1];
      const face = ROT[e.edge]; // board faces back into the map, toward the player walking out
      mapRoot.add(signpost(e.label, spot[0] + 0.5, spot[1] + 0.5, face, { width: 2.2, arrow: "up", glow: true, bg: "#24502a", backLines: ["WELCOME TO", m.name.toUpperCase()] }));
      // lanterns either side of the opening, right at the map edge
      for (const off of [-0.5, e.w + 0.5]) {
        const lx = vertical ? e.at + off : (e.edge === "w" ? 1 : m.w - 1);
        const lz = vertical ? (e.edge === "n" ? 1 : m.h - 1) : e.at + off;
        if (models["town/lantern"]) mapRoot.add(place("town/lantern", lx, lz, { scale: 1.6 / size("town/lantern").y }));
        const pl = new THREE.PointLight(0xffd080, 0.6, 4); pl.position.set(lx, 1.6, lz); mapRoot.add(pl);
      }
      // glowing marker on the path at the opening
      for (let i = 0; i < e.w; i++) {
        const tx = vertical ? e.at + i : (e.edge === "w" ? 0 : m.w - 1), ty = vertical ? (e.edge === "n" ? 0 : m.h - 1) : e.at + i;
        mapRoot.add(marker(tx + 0.5, ty + 0.5, 0xffe066));
      }
    }
  }

  // building type -> model + front extras (x offset as a fraction of footprint width)
  const BMODEL = {
    center: { key: "commercial/building-e", extras: [["town/banner-red", -0.34], ["town/banner-red", 0.34]] },
    mart: { key: "commercial/building-l", extras: [] },
    gym: { key: "commercial/building-k", extras: [["town/banner-green", -0.42], ["town/banner-green", 0.42], ["town/lantern", -0.22], ["town/lantern", 0.22]] },
    house: { key: "suburban/building-type-a", extras: [] },
    house2: { key: "suburban/building-type-c", extras: [] },
    lab: { key: "commercial/building-c", extras: [["suburban/planter", -0.4], ["suburban/planter", 0.4]] },
    hall: { key: "commercial/building-skyscraper-e", extras: [["town/pillar-stone", -0.36], ["town/pillar-stone", 0.36], ["town/banner-red", -0.2], ["town/banner-red", 0.2]] },
  };
  // fitted into the tile footprint, front facing +Z (south), base on the ground
  // ------------------------------------------------------------ signage
  // Canvas-texture board with pixel-font text; arrow: "up" draws a forward arrow before the text.
  function labelTexture(lines, { fg = "#fff8e0", bg = "#5a3a22", border = "#2a1a0e", arrow = null } = {}) {
    const W = 512, LH = 56, H = Math.max(1, lines.length) * LH + 24;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d");
    x.fillStyle = border; x.fillRect(0, 0, W, H);
    x.fillStyle = bg; x.fillRect(8, 8, W - 16, H - 16);
    x.font = "28px PS"; x.textBaseline = "middle"; x.fillStyle = fg;
    let tx = 24;
    if (arrow) {
      x.save(); x.translate(56, H / 2); x.rotate({ up: 0, left: -Math.PI / 2, right: Math.PI / 2, down: Math.PI }[arrow]);
      x.fillStyle = "#ffd84a";
      x.beginPath(); x.moveTo(0, -30); x.lineTo(26, 0); x.lineTo(10, 0); x.lineTo(10, 28); x.lineTo(-10, 28); x.lineTo(-10, 0); x.lineTo(-26, 0); x.closePath(); x.fill();
      x.restore(); tx = 100;
    }
    lines.forEach((ln, i) => {
      // biggest font that fits the line; centred when there is no arrow
      let fs = i === 0 ? 44 : 30; x.font = fs + "px PS";
      while (x.measureText(ln).width > W - tx - 24 && fs > 12) { fs -= 2; x.font = fs + "px PS"; }
      const lw = x.measureText(ln).width;
      x.fillStyle = fg; x.fillText(ln, arrow ? tx : (W - lw) / 2, 12 + LH * i + LH / 2);
    });
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    return { t, aspect: W / H };
  }
  // a board with text on both faces (back face mirrored correctly), facing +Z after `rot`
  function board(lines, width, opts = {}) {
    const { t, aspect } = labelTexture(lines, opts);
    const h = width / aspect;
    const g = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ map: t, emissive: 0x332211, emissiveIntensity: opts.glow ? 0.9 : 0.25, emissiveMap: t });
    const front = own(new THREE.Mesh(new THREE.PlaneGeometry(width, h), mat));
    front.position.z = 0.03;
    const backBox = own(new THREE.Mesh(new THREE.BoxGeometry(width + 0.06, h + 0.06, 0.05), new THREE.MeshLambertMaterial({ color: 0x3a2414 })));
    g.add(front, backBox);
    if (opts.twoSided || opts.backLines) {
      let back = front.clone();
      if (opts.backLines) {
        const bt = labelTexture(opts.backLines, { ...opts, arrow: null });
        back = own(new THREE.Mesh(new THREE.PlaneGeometry(width, h), new THREE.MeshLambertMaterial({ map: bt.t, emissive: 0x332211, emissiveIntensity: 0.25, emissiveMap: bt.t })));
      }
      back.rotation.y = Math.PI; back.position.z = -0.03; g.add(back);
    }
    g.userData.h = h;
    return g;
  }
  // wooden signpost: posts + board
  function signpost(lines, x, zz, rot, opts = {}) {
    const g = new THREE.Group();
    const w = opts.width || 1.9;
    const b = board(lines, w, opts);
    const top = 1.25 + b.userData.h / 2;
    b.position.y = top;
    g.add(b);
    const postMat = new THREE.MeshLambertMaterial({ color: 0x6b4426 });
    for (const sx of [-w / 2 + 0.12, w / 2 - 0.12]) {
      const post = own(new THREE.Mesh(new THREE.BoxGeometry(0.1, top, 0.1), postMat));
      post.position.set(sx, top / 2, -0.05); post.castShadow = true; g.add(post);
    }
    g.position.set(x, 0, zz); g.rotation.y = rot;
    return g;
  }
  const markers = []; // pulsing door/exit rings
  const blockers = []; // buildings that hide when between camera and player
  function marker(x, zz, color) {
    const ring = own(new THREE.Mesh(new THREE.RingGeometry(0.28, 0.42, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, depthWrite: false })));
    ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.03, zz);
    markers.push(ring);
    return ring;
  }

  function buildingModel(b, B) {
    const spec = BMODEL[b.type];
    const g = new THREE.Group();
    if (!models[spec.key]) return g;
    const s = size(spec.key), box = models[spec.key].box;
    const scale = Math.min((B.tw * 0.96) / s.x, (B.th * 0.96) / s.z);
    const o = place(spec.key, 0, 0, { scale });
    o.position.set(b.x + B.tw / 2 - ((box.min.x + box.max.x) / 2) * scale, -box.min.y * scale, b.y + B.th - 0.08 - box.max.z * scale);
    g.add(o);
    const frontZ = b.y + B.th + 0.3;
    for (const [k, fx] of spec.extras) {
      if (!models[k]) continue;
      const hgt = k.includes("banner") ? 1.7 : k.includes("lantern") ? 1.1 : k.includes("pillar") ? 2.2 : 0.9;
      g.add(place(k, b.x + B.tw / 2 + fx * B.tw, frontZ, { scale: hgt / size(k).y }));
    }
    // a clearly visible door: frame, coloured panel with a lit window, step, name board, ground marker
    const DOORCOL = { center: 0xd83a3a, mart: 0x3a7ad8, gym: 0xe0a020, lab: 0x2aa070, hall: 0x8a3ad8 }[b.type] || 0x9a5a2a;
    const dx = b.door.x + 0.5, fz = b.y + B.th;
    const frame = own(new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.62, 0.14), new THREE.MeshLambertMaterial({ color: 0x2b2b33 })));
    frame.position.set(dx, 0.81, fz + 0.0); frame.castShadow = true;
    const panel = own(new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.42, 0.1), new THREE.MeshLambertMaterial({ color: DOORCOL })));
    panel.position.set(dx, 0.71, fz + 0.06);
    const win = own(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.36), new THREE.MeshBasicMaterial({ color: 0xfff2b0 })));
    win.position.set(dx, 1.1, fz + 0.115);
    const knob = own(new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshLambertMaterial({ color: 0xffd84a })));
    knob.position.set(dx + 0.28, 0.7, fz + 0.13);
    const step = own(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.45), new THREE.MeshLambertMaterial({ color: 0xb8b0a0 })));
    step.position.set(dx, 0.04, fz + 0.25); step.receiveShadow = true;
    g.add(frame, panel, win, knob, step);
    const lamp = new THREE.PointLight(0xffd99a, 0.5, 3.5);
    lamp.position.set(dx, 1.9, fz + 0.5); g.add(lamp);
    const name = (b.label || b.type).toUpperCase();
    const sign = board([name], Math.min(Math.max(2.2, name.length * 0.26), B.tw * 0.95), { glow: true, bg: { center: "#8a1e1e", mart: "#1e3e8a", gym: "#6a4a10", hall: "#3e1e6a" }[b.type] || "#5a3a22" });
    sign.position.set(dx, 1.62 + 0.08 + sign.userData.h / 2, fz + 0.12);
    g.add(sign);
    g.add(marker(dx, fz + 0.75, DOORCOL));
    return g;
  }

  function texCrop(img, sx, sy, w, h, rx = 1, ry = 1) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    c.getContext("2d").drawImage(img, sx, sy, w, h, 0, 0, w, h);
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }
  const INTERIOR_PROPS = {
    ember_gym: [["town/rock-large", 1.5, 5], ["town/rock-large", 10.5, 5], ["nature/rock_tallA", 1.5, 11], ["nature/rock_tallA", 10.5, 11]],
    tide_gym: [["town/fountain-round", 1.6, 11.5], ["town/fountain-round", 10.4, 11.5]],
    volt_gym: [["town/lantern", 1.5, 4], ["town/lantern", 10.5, 4], ["town/lantern", 1.5, 11], ["town/lantern", 10.5, 11], ["town/pillar-stone", 3.5, 8], ["town/pillar-stone", 8.5, 8]],
    shade_gym: [["nature/tree_default_dark", 1.2, 5], ["nature/tree_oak_dark", 10.8, 5], ["town/lantern", 3, 11], ["town/lantern", 9, 11]],
    hall: [["town/pillar-stone", 2, 5], ["town/pillar-stone", 10, 5], ["town/pillar-stone", 2, 12], ["town/pillar-stone", 10, 12], ["town/banner-red", 4, 3.4], ["town/banner-red", 8, 3.4]],
    lab: [["suburban/planter", 1, 7], ["suburban/planter", 11, 7]],
    home: [["suburban/planter", 1, 3.6], ["nature/plant_bush", 7, 3.6]],
  };
  function buildInterior(m) {
    scene.background = new THREE.Color(0x1a1f26);
    scene.fog = null;
    hemi.intensity = 0.65; sun.intensity = 0.9; sun.color.setHex(0xfff0dc);
    const wallCol = { cream: [0, 5], blue: [1, 5], green: [1, 0], wood: [0, 0] }[m.wall || "cream"];
    const ft = { tile: [3, 3], planks: [1, 3], parquet: [0, 3], gray: [2, 3] }[m.floor || "tile"];
    let north = 0;
    while (north < m.h && m.grid[north].every((c) => c === "W")) north++;
    const W = m.w, D = m.h - north, WALLH = 2.4;
    const floor = own(new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshLambertMaterial({ map: texCrop(IMG.floors, ft[0] * 16, ft[1] * 16, 16, 16, W, D) })));
    floor.rotation.x = -Math.PI / 2; floor.position.set(W / 2, 0, north + D / 2); floor.receiveShadow = true;
    mapRoot.add(floor);
    const wall = (w, d, x, zz, len) => {
      const mesh = own(new THREE.Mesh(new THREE.BoxGeometry(w, WALLH, d), new THREE.MeshLambertMaterial({ map: texCrop(IMG.floors, wallCol[0] * 16, wallCol[1] * 16, 16, 48, len, 1) })));
      mesh.position.set(x, WALLH / 2, zz); mesh.castShadow = true; mesh.receiveShadow = true;
      mapRoot.add(mesh);
    };
    wall(W + 0.6, 0.3, W / 2, north - 0.15, W);
    wall(0.3, D, -0.15, north + D / 2, D);
    wall(0.3, D, W + 0.15, north + D / 2, D);
    const ctrMat = new THREE.MeshLambertMaterial({ map: texCrop(IMG.floors, 0, 64, 16, 16) });
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      if (m.grid[y][x] !== "C") continue;
      // low counter so the staff behind it stay visible over it
      const c = own(new THREE.Mesh(new THREE.BoxGeometry(1, 0.42, 0.55), ctrMat));
      c.position.set(x + 0.5, 0.21, y + 0.5); c.castShadow = true; c.receiveShadow = true;
      mapRoot.add(c);
    }
    for (const [x, , kind] of m.decor || []) {
      const p = own(new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshLambertMaterial({ map: texCrop(IMG.floors, kind === "poster" ? 48 : 32, 0, 16, 16), transparent: true, alphaTest: 0.5 })));
      p.position.set(x + 0.5, 1.5, north + 0.01); mapRoot.add(p);
    }
    for (const r of m.rugs || []) {
      const rug = own(new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshLambertMaterial({ map: texCrop(IMG.floors, 84, 4, 40, 40), transparent: true, alphaTest: 0.5 })));
      rug.rotation.x = -Math.PI / 2; rug.position.set(r[0] + 2, 0.012, r[1] + 2); rug.receiveShadow = true;
      mapRoot.add(rug);
    }
    const ex = Math.floor(m.w / 2) - 1;
    const mat = own(new THREE.Mesh(new THREE.PlaneGeometry(2, 0.8), new THREE.MeshLambertMaterial({ color: 0xb05040 })));
    mat.rotation.x = -Math.PI / 2; mat.position.set(ex + 1, 0.015, m.h - 0.5);
    mapRoot.add(mat);
    // open doorway with a lit EXIT sign at the bottom of the room
    const exitSign = board(["EXIT"], 1.4, { arrow: "down", glow: true, bg: "#1e6a2a" });
    exitSign.position.set(ex + 1, 2.0, m.h - 0.05); exitSign.rotation.y = Math.PI;
    mapRoot.add(exitSign);
    const glow = own(new THREE.Mesh(new THREE.PlaneGeometry(2, 1.8), new THREE.MeshBasicMaterial({ color: 0xfff4d0, transparent: true, opacity: 0.5, side: THREE.DoubleSide })));
    glow.position.set(ex + 1, 0.9, m.h + 0.02); mapRoot.add(glow);
    mapRoot.add(marker(ex + 1, m.h - 0.5, 0xffe066));
    for (const [k, x, zz] of INTERIOR_PROPS[m.id] || []) {
      if (!models[k]) continue;
      const hgt = k.includes("tree") ? 2.2 : k.includes("fountain") ? 0.8 : k.includes("pillar") ? 2.2 : k.includes("banner") ? 1.8 : 1;
      mapRoot.add(place(k, x, zz, { scale: hgt / size(k).y }));
    }
    const lamp = new THREE.PointLight(0xffe2b0, 0.6, 14);
    lamp.position.set(W / 2, 3, north + D / 2);
    mapRoot.add(lamp);
  }

  // ------------------------------------------------------------ characters
  const CHAR_FOR = {
    adventurer: "character-male-b", professor: "character-male-d", nurse: "character-female-c", shopkeeper: "character-male-e",
    homemaker: "character-female-b", heroine: "character-female-a", scientist: "character-male-c", miner: "character-male-f",
    swimmer: "character-female-d", magician: "character-male-a", knightlord: "character-female-f", soldier: "character-male-f",
    granny: "character-female-e", picnicker: "character-female-a", cooldude: "character-male-a", fisher: "character-male-d",
    florist: "character-female-b", tennisplayer: "character-female-c", ninja: "character-male-c", goth: "character-female-f",
    witch: "character-female-e", monk: "character-male-e", rogue: "character-male-a", beachcomber: "character-male-d",
    knight: "character-male-f", dragonrider: "character-female-d", catgirl: "character-female-c", fashionista: "character-female-f",
    woodnymph: "character-female-b", disciple: "character-male-b", riverboatcaptain: "character-male-d", firefighter: "character-male-c",
  };
  // Themed outfits: recolour only the clothing swatches of the shared character colour atlas
  // (skin, hair and eye swatches are left alone), keeping each swatch's shading gradient.
  const OUTFITS = {
    ranger:      { p: 0x5f7f3a, s: 0xc8b47c, a: 0x8a5a2b, d: 0x4a3a28 },
    nightranger: { p: 0x2f4a32, s: 0x6f6a4a, a: 0x4a3020, d: 0x23201a },
    sailor:      { p: 0x1f3f7a, s: 0xf2f2f2, a: 0xc83030, d: 0x1a2a4a },
    engineer:    { p: 0xf0b020, s: 0xf07a20, a: 0x3a3a40, d: 0x2a2a30 },
    occult:      { p: 0x4a2a6a, s: 0x2a2030, a: 0x8a1a3a, d: 0x1a1520 },
    miner:       { p: 0xa86a30, s: 0xe0b050, a: 0xc84a20, d: 0x4a3020 },
    royal:       { p: 0xe8e0d0, s: 0xd4a830, a: 0x7a1a2a, d: 0x3a3040 },
  };
  // [x, y, w, h, slot] regions of the 512x512 atlas that hold clothing colours
  const CLOTH = [[0, 128, 64, 128, "a"], [64, 256, 64, 128, "p"], [128, 256, 64, 128, "s"], [192, 256, 64, 128, "a"],
    [256, 256, 64, 128, "a"], [320, 256, 64, 128, "p"], [384, 256, 64, 128, "s"], [448, 256, 64, 128, "p"],
    [0, 384, 64, 128, "d"], [64, 384, 64, 128, "d"], [128, 384, 64, 128, "d"], [192, 384, 64, 128, "s"]];
  const outfitCache = {};
  function outfitMaterial(mat, theme) {
    const key = mat.uuid + theme;
    if (outfitCache[key]) return outfitCache[key];
    const pal = OUTFITS[theme], img = mat.map && mat.map.image;
    if (!pal || !img) return mat;
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const x = c.getContext("2d"); x.drawImage(img, 0, 0);
    const sx = img.width / 512, sy = img.height / 512;
    for (const [rx, ry, rw, rh, slot] of CLOTH) {
      const X = Math.round(rx * sx), Y = Math.round(ry * sy), W = Math.round(rw * sx), H = Math.round(rh * sy);
      const d = x.getImageData(X, Y, W, H), px = d.data;
      let sum = 0; for (let i = 0; i < px.length; i += 4) sum += px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11;
      const mean = sum / (px.length / 4) || 1;
      const col = new THREE.Color(pal[slot]);
      for (let i = 0; i < px.length; i += 4) {
        const k = Math.min(1.6, (px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11) / mean);
        px[i] = Math.min(255, col.r * 255 * k); px[i + 1] = Math.min(255, col.g * 255 * k); px[i + 2] = Math.min(255, col.b * 255 * k);
      }
      x.putImageData(d, X, Y);
    }
    const t = new THREE.CanvasTexture(c);
    t.flipY = mat.map.flipY; t.encoding = THREE.sRGBEncoding; t.magFilter = THREE.NearestFilter;
    const m2 = mat.clone(); m2.map = t;
    outfitCache[key] = m2;
    return m2;
  }

  function makeActor(key, sprite, outfit) {
    const base = CHAR_FOR[sprite] || CHAR_FOR[(sprite || "").split("_")[0]] || "character-male-a";
    const src = models["characters/" + base];
    const root = new THREE.Group();
    const body = window.SkeletonUtils.clone(src.scene);
    const h = src.box.max.y - src.box.min.y;
    body.scale.setScalar(1.05 / (h || 1));
    body.position.y = -src.box.min.y * (1.05 / (h || 1));
    body.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.frustumCulled = false;
      if (outfit) o.material = Array.isArray(o.material) ? o.material.map((mt) => outfitMaterial(mt, outfit)) : outfitMaterial(o.material, outfit);
    });
    root.add(body);
    scene.add(root);
    const mixer = new THREE.AnimationMixer(body);
    const acts = {};
    for (const n of ["idle", "walk", "sprint", "sit"]) { const c = src.animations.find((a) => a.name === n); if (c) acts[n] = mixer.clipAction(c); }
    const a = { root, mixer, acts, state: null, yaw: null };
    setAnim(a, "idle");
    actors.set(key, a);
    return a;
  }
  function setAnim(a, n) {
    if (a.state === n || !a.acts[n]) return;
    const next = a.acts[n];
    next.reset().setEffectiveWeight(1).play();
    if (a.state && a.acts[a.state]) a.acts[a.state].crossFadeTo(next, 0.2, false);
    a.state = n;
  }
  const lerpAngle = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * k; };
  function updateActor(key, sprite, x, zz, yaw, anim, dt, timeScale = 1, outfit) {
    const a = actors.get(key) || makeActor(key, sprite, outfit);
    a.seen = true;
    a.root.position.set(x, 0, zz);
    a.yaw = a.yaw === null ? yaw : lerpAngle(a.yaw, yaw, Math.min(1, dt * 14));
    a.root.rotation.y = a.yaw + Math.PI; // models face +Z; yaw 0 means facing -Z (north)
    setAnim(a, anim);
    if (a.acts[anim]) a.acts[anim].timeScale = timeScale;
    a.mixer.update(dt);
  }

  // ------------------------------------------------------------ rideable monsters
  // A mount is the monster's real Tuxemon back sprite extruded into voxels: every opaque pixel
  // becomes a block, thicker toward the middle of the body so it reads as a solid creature.
  const mounts = {};
  function mountModel(slug) {
    if (mounts[slug]) return mounts[slug];
    const img = IMG["mon_" + slug];
    const S = 64, c = document.createElement("canvas"); c.width = S; c.height = S;
    const x = c.getContext("2d"); x.drawImage(img, 64, 0, 64, 64, 0, 0, S, S); // back view
    const px = x.getImageData(0, 0, S, S).data;
    const solid = (i, j) => i >= 0 && j >= 0 && i < S && j < S && px[(j * S + i) * 4 + 3] > 120;
    // distance to the silhouette edge (capped) for body thickness
    const dist = new Array(S * S).fill(0);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) if (solid(i, j)) dist[j * S + i] = 1;
    for (let pass = 1; pass < 5; pass++) {
      for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
        const k = j * S + i;
        if (dist[k] === pass && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([a, b]) => solid(i + a, j + b) && dist[(j + b) * S + i + a] >= pass)) dist[k] = pass + 1;
      }
    }
    let minI = S, maxI = 0, minJ = S, maxJ = 0, count = 0;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) if (solid(i, j)) { count++; minI = Math.min(minI, i); maxI = Math.max(maxI, i); minJ = Math.min(minJ, j); maxJ = Math.max(maxJ, j); }
    const wPx = maxI - minI + 1, hPx = maxJ - minJ + 1;
    const vs = 2.4 / Math.max(wPx, hPx * 0.85); // ~2.4 tiles across
    const cx = (minI + maxI + 1) / 2, cy = (minJ + maxJ + 1) / 2;
    const geo = new THREE.BoxGeometry(vs, vs, vs);
    const mat = new THREE.MeshLambertMaterial();
    const im = new THREE.InstancedMesh(geo, mat, count);
    const col = new THREE.Color();
    let n = 0, seat = 0;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      if (!solid(i, j)) continue;
      const k = (j * S + i) * 4, d = dist[j * S + i];
      const thick = 1 + (d - 1) * 1.6;
      tmpM.makeScale(1, 1, thick);
      tmpM.setPosition((i + 0.5 - cx) * vs, (cy - j - 0.5) * vs, 0);
      im.setMatrixAt(n, tmpM);
      col.setRGB(px[k] / 255, px[k + 1] / 255, px[k + 2] / 255).convertSRGBToLinear();
      im.setColorAt(n, col);
      n++;
      seat = Math.max(seat, thick * vs / 2);
    }
    im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
    // lay the sprite flat: its back faces up and its head points forward, like a creature swimming/flying
    const inner = new THREE.Group(); inner.rotation.x = -Math.PI / 2; inner.add(im);
    const g = new THREE.Group(); g.add(inner);
    mounts[slug] = { g, seat: seat + 0.02 };
    return mounts[slug];
  }
  let activeMount = null;

  // ------------------------------------------------------------ per-frame
  const ANG = { up: 0, left: Math.PI / 2, down: Math.PI, right: -Math.PI / 2 };
  function render(state, dt, now) {
    const p = state.player;
    camYaw = lerpAngle(camYaw, p.angle, Math.min(1, dt * 9));
    const f = [-Math.sin(camYaw), -Math.cos(camYaw)];
    const inside = state.interior;
    // fixed over-the-shoulder POV: constant distance and height (no bobbing when turning).
    // Anything between the camera and the player is cut away by pushing the near plane out.
    // steady, fairly high chase view looking down over the player's shoulder
    const back = inside ? 3.2 : 4.4, up = inside ? 3.6 : 5.0;
    const lift = (p.alt || 0) + (p.mount ? 0.9 : 0);
    const want = new THREE.Vector3(p.px - f[0] * back, up + lift, p.pz - f[1] * back);
    const near = Math.max(0.1, Math.hypot(back, up - 0.8) - 1.6);
    if (Math.abs(camera.near - near) > 0.01) { camera.near = near; camera.updateProjectionMatrix(); }
    const wantLook = new THREE.Vector3(p.px + f[0] * 2.2, 0.7 + lift, p.pz + f[1] * 2.2);
    if (!camPos) { camPos = want.clone(); lookAt = wantLook.clone(); }
    camPos.lerp(want, Math.min(1, dt * 12));
    lookAt.lerp(wantLook, Math.min(1, dt * 10));
    camera.position.copy(camPos);
    // hide any building whose footprint the camera->player sightline passes through
    for (const g of blockers) {
      const [x0, z0, x1, z1] = g.userData.box;
      let hit = false;
      for (let k = 0; k <= 1.0001 && !hit; k += 0.1) {
        const x = camPos.x + (p.px - camPos.x) * k, zz = camPos.z + (p.pz - camPos.z) * k;
        if (x > x0 && x < x1 && zz > z0 && zz < z1 && k < 0.92) hit = true;
      }
      g.visible = !hit;
    }
    camera.lookAt(lookAt);
    sun.position.set(p.px + 8, 14, p.pz + 5);
    sun.target.position.set(p.px, 0, p.pz);
    if (water) water.position.y = Math.sin(now * 1.5) * 0.02;
    for (const r of markers) { const k = (now * 1.2) % 1; r.scale.setScalar(0.8 + k * 0.7); r.material.opacity = 0.85 * (1 - k); }

    for (const a of actors.values()) a.seen = false;
    for (const n of state.npcs) updateActor(n.key, n.sprite, n.fx / 16 + 0.5, n.fy / 16 + 0.5, ANG[n.dir], n.walking ? "walk" : "idle", dt, 1, n.outfit);
    const spd = Math.abs(p.speed), moving = spd > 0.15;
    const anim = !moving ? "idle" : spd > 4 ? "sprint" : "walk";
    // riding: show the mount under the player and seat them on it
    let seatY = 0;
    if (p.mount) {
      const mm = mountModel(p.mount);
      if (activeMount !== mm.g) { if (activeMount) scene.remove(activeMount); activeMount = mm.g; scene.add(mm.g); }
      const bob = p.surfing ? Math.sin(now * 2.6) * 0.07 : Math.sin(now * 4) * 0.12 * Math.min(1, p.alt || 0);
      const base = p.surfing ? -0.12 : 0.1;
      mm.g.position.set(p.px, base + (p.alt || 0) + bob, p.pz);
      mm.g.rotation.set(0, p.angle, 0);
      mm.g.children[0].rotation.set(-Math.PI / 2 + (p.alt > 0.2 ? 0.15 : 0), 0, Math.sin(now * 1.7) * (p.surfing ? 0.04 : 0.1));
      seatY = base + (p.alt || 0) + bob + mm.seat;
    } else if (activeMount) { scene.remove(activeMount); activeMount = null; }
    updateActor("player", "adventurer", p.px, p.pz, p.angle, p.mount ? "sit" : anim, dt, p.mount ? 1 : moving ? Math.max(0.5, spd / (spd > 4 ? 5 : 3)) : 1);
    actors.get("player").root.position.y = seatY;
    for (const [k, a] of actors) if (!a.seen) { scene.remove(a.root); actors.delete(k); }
    renderer.render(scene, camera);
  }

  function project(tx, ty, h) {
    const v = new THREE.Vector3(tx + 0.5, h, ty + 0.5).project(camera);
    if (v.z > 1) return null;
    return { x: (v.x + 1) / 2 * 240, y: (1 - v.y) / 2 * 160 };
  }

  return { load, init, resize, build, render, project, snapYaw(a) { camYaw = a; camPos = null; }, _models: models, _dbg: () => ({ scene, camera, blockers }) };
})();
