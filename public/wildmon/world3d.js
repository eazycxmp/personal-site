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
    // realistic people (Quaternius Universal Base Characters + Universal Animation Library, CC0)
    await Promise.all([["qn/male", "qn_male.glb"], ["qn/female", "qn_female.glb"], ["qn/anims", "qn_anims.glb"]].map(([k, f]) => new Promise((res) => {
      loader.load(`${base}qn/${f}`, (g) => { g.scene.updateMatrixWorld(true); models[k] = { scene: g.scene, animations: g.animations }; res(); },
        undefined, (e) => { console.warn("qn model failed", f, e); res(); });
    })));
    const TL = new THREE.TextureLoader();
    await Promise.all(["male", "female", "male_dark", "female_dark"].map((k) => new Promise((res) => TL.load(`${base}qn/qn_${k.includes("_") ? k : k + "_light"}.jpg`, (t) => {
      t.flipY = false; t.encoding = THREE.sRGBEncoding; qnSkin[k] = t; res();
    }, undefined, () => res()))));
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
    ghost: { trees: ["tree_default_dark", "tree_oak_dark", "tree_pineTallA_detailed"], grass: 0x58654f, grassDark: 0x3e4a3a, sky: 0x5c5a72, fog: [6, 22] },
  };
  function themeFor(m) {
    const id = m.id || "";
    if (id.startsWith("tide") || id === "route2") return THEMES.tide;
    if (id.startsWith("volt") || id === "route3") return THEMES.volt;
    if (m.ghost || id.startsWith("hollow")) return THEMES.ghost;
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
    for (const o of statueObjs.values()) scene.remove(o.g);
    statueObjs.clear();
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
    scene.fog = new THREE.Fog(th.sky, th.fog ? th.fog[0] : 16, th.fog ? th.fog[1] : 38);
    const dark = th === THEMES.shade || th === THEMES.ghost;
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
      g.userData.box = [b.x - 0.3, b.y - 0.3, b.x + BUILDINGS[b.type].tw + 0.3, b.y + BUILDINGS[b.type].th + 0.3];
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
    // player / rival colour themes
    red:         { p: 0xd83a30, s: 0xf2e8d8, a: 0x2a2a30, d: 0x34343f },
    blue:        { p: 0x3060d8, s: 0xf2f2f2, a: 0xf0c020, d: 0x2a3048 },
    green:       { p: 0x2f9a48, s: 0xf2f2e0, a: 0x8a5a2b, d: 0x2a3a2a },
    gold:        { p: 0xe0a020, s: 0x2a2a30, a: 0xc84a20, d: 0x3a3030 },
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

  // Per-model clothing: the 32x128 colour cells the body mesh samples, minus anything the head mesh
  // uses (face, hair) and the skin-tone cells. Biggest cell = main colour, next = dark, then light, then accents.
  const clothCache = {};
  function clothCells(base, body, head) {
    if (clothCache[base]) return clothCache[base];
    const cells = (mesh) => {
      const out = new Map(), uv = mesh && mesh.geometry.attributes.uv;
      if (!uv) return out;
      for (let i = 0; i < uv.count; i++) {
        const cx = Math.min(15, Math.floor(uv.getX(i) * 16)), cy = Math.min(3, Math.floor(uv.getY(i) * 4));
        const k = cx + "," + cy; out.set(k, (out.get(k) || 0) + 1);
      }
      return out;
    };
    const b = cells(body), h = cells(head);
    const skin = (cx, cy) => (cy === 3 && cx >= 10) || (cy === 2 && cx <= 1);
    // the body gets its own texture copy, so cells shared with the face are safe to recolour; skip skin only
    void h;
    const list = [...b.entries()].filter(([k]) => { const [cx, cy] = k.split(",").map(Number); return !skin(cx, cy); })
      .sort((p1, p2) => p2[1] - p1[1]).map(([k]) => k.split(",").map(Number));
    return (clothCache[base] = list);
  }
  const bodyOutfitCache = {};
  function bodyOutfitMaterial(mat, theme, base, cellList) {
    const key = base + ":" + theme;
    if (bodyOutfitCache[key]) return bodyOutfitCache[key];
    const pal = OUTFITS[theme], img = mat.map && mat.map.image;
    if (!pal || !img || !cellList.length) return mat;
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const x = c.getContext("2d"); x.drawImage(img, 0, 0);
    const cw = img.width / 16, ch = img.height / 4;
    const slots = ["p", "d", "s", "a"];
    cellList.forEach(([cx, cy], idx) => {
      const X = Math.round(cx * cw), Y = Math.round(cy * ch), W = Math.round(cw), H = Math.round(ch);
      const d = x.getImageData(X, Y, W, H), px = d.data;
      let sum = 0; for (let i = 0; i < px.length; i += 4) sum += px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11;
      const mean = sum / (px.length / 4) || 1;
      const col = new THREE.Color(pal[slots[Math.min(idx, 3)]]);
      for (let i = 0; i < px.length; i += 4) {
        const k = Math.min(1.5, Math.max(0.55, (px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11) / mean));
        px[i] = Math.min(255, col.r * 255 * k); px[i + 1] = Math.min(255, col.g * 255 * k); px[i + 2] = Math.min(255, col.b * 255 * k);
      }
      x.putImageData(d, X, Y);
    });
    const t = new THREE.CanvasTexture(c);
    t.flipY = mat.map.flipY; t.encoding = THREE.sRGBEncoding; t.magFilter = THREE.NearestFilter;
    const m2 = mat.clone(); m2.map = t;
    return (bodyOutfitCache[key] = m2);
  }

  // ------------------------------------------------------------ realistic people (player and rival)
  const qnSkin = {};
  const QN_HEIGHT = 1.45; // metres-ish in tile units: just under the 1.62 door frames
  const SHIRT = { red: 0xc8302c, blue: 0x2f5fd0, green: 0x2f9a48, gold: 0xe0a020 };
  const PANTS = { red: 0x2a2a34, blue: 0x2a3550, green: 0x3a3428, gold: 0x2a2230 };
  // which part of the body a vertex belongs to, from the bone that moves it most
  const qnRegion = (n) => /^(hand|thumb|index|middle|ring|pinky)/.test(n) ? 7 : /^(spine|clavicle)/.test(n) ? 1 : /^upperarm/.test(n) ? 2
    : /^lowerarm/.test(n) ? 3 : /^(pelvis|thigh)/.test(n) ? 4 : /^calf/.test(n) ? 5 : /^(foot|ball)/.test(n) ? 6 : 0;
  function qnRegions(mesh) {
    const g = mesh.geometry;
    if (g.attributes.qnr) return;
    const si = g.attributes.skinIndex, sw = g.attributes.skinWeight, bones = mesh.skeleton.bones, r = new Float32Array(si.count);
    for (let i = 0; i < si.count; i++) {
      let best = 0, bw = -1;
      const ws = [sw.getX(i), sw.getY(i), sw.getZ(i), sw.getW(i)], is = [si.getX(i), si.getY(i), si.getZ(i), si.getW(i)];
      for (let j = 0; j < 4; j++) if (ws[j] > bw) { bw = ws[j]; best = is[j]; }
      r[i] = qnRegion(bones[best] ? bones[best].name : "");
    }
    g.setAttribute("qnr", new THREE.BufferAttribute(r, 1));
  }
  // skin material that hides the parts under the clothes (torso, upper arms, legs, feet) so nothing pokes through
  function qnBodyMat(src, skinKey, long, shorts) {
    const m = new THREE.MeshStandardMaterial({ map: qnSkin[skinKey] || null, roughness: 0.75, metalness: 0, normalMap: src.normalMap || null });
    const hide = [0, 1, 1, long ? 1 : 0, 1, shorts ? 0 : 1, 1, 0];
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uHide = { value: hide };
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute float qnr; varying float vQnr;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvQnr = qnr;");
      sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform float uHide[8]; varying float vQnr;")
        .replace("#include <map_fragment>", "#include <map_fragment>\n{ int ri = int(vQnr + .5); float h = 0.; for (int k = 0; k < 8; k++) if (k == ri) h = uHide[k]; if (h > .5) discard; }");
    };
    m.customProgramCacheKey = () => "qnbody";
    return m;
  }
  const QN_CLIPS = { idle: "Idle_Loop", walk: "Walk_Loop", sprint: "Sprint_Loop", sit: "Sitting_Idle_Loop" };
  // How a person looks. Player/rival: their colour. Trainers: their area theme. Key townsfolk: fixed looks.
  // Everyone else: varied, but seeded by who they are so they look the same every visit.
  const ROLE_LOOK = {
    nurse: { gender: "female", shirt: 0xf2a5c0, pants: 0xf4f0f0, hair: "Buns", hairCol: 0x3a2010 },
    professor: { gender: "male", shirt: 0xf2f2f2, pants: 0x5a4a3a, long: true, hair: "SimpleParted", hairCol: 0xb8b8b8, beard: true },
    scientist: { gender: "male", shirt: 0xf2f2f2, pants: 0x30303a, long: true, hair: "Buzzed", hairCol: 0x1a1414 },
    shopkeeper: { gender: "male", shirt: 0x2f6fd0, pants: 0x2a2a34, hair: "SimpleParted", hairCol: 0x4a2a14 },
    homemaker: { gender: "female", shirt: 0xb06ac0, pants: 0x3a3040, hair: "Long", hairCol: 0x6a3a1a },
    heroine: { gender: "female", shirt: 0x2ab0a0, pants: 0x2a3550, hair: "SimpleParted", hairCol: 0x9a6a30 },
    granny: { gender: "female", shirt: 0xb8a8d8, pants: 0x5a5060, long: true, hair: "Buns", hairCol: 0xd8d8d8 },
    soldier: { gender: "male", shirt: 0x4a5a3a, pants: 0x3a4030, long: true, hair: "Buzzed", hairCol: 0x2a1a10 },
  };
  const THEME_LOOK = { // shirt / pants / long sleeves per trainer theme (colours from OUTFITS)
    ranger: ["p", "s", true], nightranger: ["p", "s", true], sailor: ["s", "p", false], engineer: ["p", "a", true],
    occult: ["p", "s", true], miner: ["p", "d", false], royal: ["p", "a", true],
  };
  const SHIRTS = [0xc8302c, 0x2f5fd0, 0x2f9a48, 0xe0a020, 0x8a3ad8, 0x2ab0a0, 0xe06a20, 0xf2f2f2, 0x3a3a44, 0xd85a8a];
  const PANTS_ALL = [0x2a2a34, 0x2a3550, 0x3a3428, 0x5a4a3a, 0x3a3a40, 0x6a6a72];
  const HAIR_COLS = [0x2a1a10, 0x4a2a14, 0x6a4020, 0x9a6a30, 0x1a1414, 0xb0a080, 0x7a2a14];
  function hashOf(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
  function npcLook(sprite, outfit, key) {
    const base = (sprite || "").split("_")[0];
    const gender = /female/.test(CHAR_FOR[sprite] || CHAR_FOR[base] || "") ? "female" : "male";
    const h = hashOf(key + sprite);
    const pick = (arr, salt) => arr[(h >>> salt) % arr.length];
    const look = {
      gender, shirt: pick(SHIRTS, 0), pants: pick(PANTS_ALL, 5), long: (h >>> 9) % 3 === 0, shorts: gender === "male" && (h >>> 11) % 5 === 0,
      hair: gender === "female" ? pick(["Long", "Buns", "SimpleParted", "BuzzedFemale"], 13) : pick(["SimpleParted", "Buzzed", "Long"], 13),
      hairCol: pick(HAIR_COLS, 17), dark: (h >>> 21) % 10 < 3, beard: gender === "male" && (h >>> 25) % 4 === 0,
    };
    if (ROLE_LOOK[base]) Object.assign(look, ROLE_LOOK[base], { shorts: false });
    if (outfit && THEME_LOOK[outfit] && OUTFITS[outfit]) {
      const [sh, pa, long] = THEME_LOOK[outfit], pal = OUTFITS[outfit];
      Object.assign(look, { shirt: pal[sh], pants: pal[pa], long, shorts: false });
    }
    return look;
  }
  function playerLook(gname, color) {
    return { gender: gname, shirt: SHIRT[color] || 0x3060d8, pants: PANTS[color] || 0x2a2a34, hair: gname === "female" ? "Long" : "SimpleParted",
      hairCol: gname === "female" ? 0x5a3418 : 0x2a1a10 };
  }
  function makeQNActor(key, look) {
    const gname = look.gender;
    const src = models["qn/" + gname], lib = models["qn/anims"];
    const root = new THREE.Group();
    const body = window.SkeletonUtils.clone(src.scene);
    body.scale.setScalar(QN_HEIGHT / 1.84);
    const skinKey = gname + (look.dark ? "_dark" : "");
    const top = look.long ? "ShirtLong" : "Shirt", leg = look.shorts ? "Shorts" : "Pants";
    const hairCol = new THREE.Color(look.hairCol ?? 0x2a1a10).multiplyScalar(2.2);
    body.traverse((m) => {
      if (!m.isSkinnedMesh) return;
      m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true;
      const n = m.name.replace(/^QN_/, "").replace(/\.\d+$/, "");
      if (/^Super[hH]ero/.test(n)) { qnRegions(m); m.material = qnBodyMat(m.material, skinKey, look.long, look.shorts); }
      else if (n.startsWith("Wear_")) {
        const k = n.slice(5);
        m.visible = k === top || k === leg || k === "Shoes";
        if (m.visible) m.material = new THREE.MeshStandardMaterial({ color: k === top ? look.shirt : k === leg ? look.pants : 0x2a1d12, roughness: 0.85, metalness: 0 });
      } else if (n.startsWith("Hair_")) {
        const k = n.slice(5);
        m.visible = k === look.hair || (k === "Beard" && look.beard);
        if (m.visible) { m.material = m.material.clone(); m.material.color = hairCol; }
      } else if (/Eyebrows/.test(n)) { m.material = m.material.clone(); m.material.color = hairCol.clone().multiplyScalar(0.9); }
    });
    root.add(body);
    scene.add(root);
    const mixer = new THREE.AnimationMixer(body);
    const acts = {};
    for (const [k, clipName] of Object.entries(QN_CLIPS)) {
      const c = lib && lib.animations.find((a) => a.name === clipName);
      if (c) acts[k] = mixer.clipAction(c);
    }
    const a = { root, mixer, acts, state: null, yaw: null, qn: true };
    setAnim(a, "idle");
    actors.set(key, a);
    return a;
  }

  function makeActor(key, sprite, outfit, model) {
    if (model && model.startsWith("qn:")) return makeQNActor(key, playerLook(model.slice(3), outfit));
    return makeQNActor(key, npcLook(sprite, outfit, key));
  }
  function setAnim(a, n) {
    if (a.state === n || !a.acts[n]) return;
    const next = a.acts[n];
    next.reset().setEffectiveWeight(1).play();
    if (a.state && a.acts[a.state]) a.acts[a.state].crossFadeTo(next, 0.2, false);
    a.state = n;
  }
  const lerpAngle = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * k; };
  function updateActor(key, sprite, x, zz, yaw, anim, dt, timeScale = 1, outfit, model) {
    const a = actors.get(key) || makeActor(key, sprite, outfit, model);
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
  function mountModel(slug, upright, size) {
    const ck = slug + (upright ? ":up" : "") + (size ? ":" + size : "");
    if (mounts[ck]) return mounts[ck];
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
    const vs = (size || (upright ? 1.0 : 2.4)) / Math.max(wPx, hPx * 0.85); // ~2.4 tiles across (1 tile when riding the board)
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
    if (upright) { inner.rotation.x = 0; im.position.y = (hPx / 2) * vs; }
    const g = new THREE.Group(); g.add(inner);
    mounts[ck] = { g, seat: seat + 0.02, upright };
    return mounts[ck];
  }
  let activeMount = null;

  // Legendaries and the sleeping giant: big voxel monsters standing in the world.
  const statueObjs = new Map();
  function zzzSprite() {
    const c = document.createElement("canvas"); c.width = 64; c.height = 64;
    const x = c.getContext("2d"); x.font = "40px PS"; x.fillStyle = "#ffffff"; x.strokeStyle = "#304060"; x.lineWidth = 6;
    x.strokeText("Z", 14, 50); x.fillText("Z", 14, 50);
    const t = new THREE.CanvasTexture(c);
    return new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  }
  function updateStatues(list, p, now) {
    const live = new Set();
    for (const st of list || []) {
      live.add(st.id);
      let o = statueObjs.get(st.id);
      if (!o) {
        const big = mountModel(st.slug, true, st.kind === "legend" ? 3.2 : 3.4);
        const g = new THREE.Group(); g.add(big.g.clone(true));
        const cx = st.tiles.reduce((a, t) => a + t[0], 0) / st.tiles.length + 0.5, cz = st.tiles.reduce((a, t) => a + t[1], 0) / st.tiles.length + 0.5;
        o = { g, cx, cz, zs: [] };
        if (st.kind === "legend") {
          const light = new THREE.PointLight(0xc8a0ff, 1.4, 9); light.position.y = 2.2; g.add(light);
          const ring = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.6, 40), new THREE.MeshBasicMaterial({ color: 0xd0b0ff, transparent: true, opacity: 0.6, depthWrite: false }));
          ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; g.add(ring); o.ring = ring;
        } else {
          g.children[0].rotation.z = 0.28; // slumped over, asleep
          for (let i = 0; i < 3; i++) { const z = zzzSprite(); g.add(z); o.zs.push(z); }
        }
        g.rotation.y = Math.atan2(p.px - cx, p.pz - cz); // face whoever walks up
        scene.add(g); statueObjs.set(st.id, o);
      }
      o.g.position.set(o.cx, 0, o.cz);
      if (st.kind === "legend") {
        o.g.children[0].position.y = 0.35 + Math.sin(now * 1.4) * 0.18;
        const want = Math.atan2(p.px - o.cx, p.pz - o.cz);
        o.g.rotation.y = lerpAngle(o.g.rotation.y, want, 0.03);
        o.ring.scale.setScalar(1 + Math.sin(now * 2) * 0.12);
      } else {
        o.g.children[0].scale.y = 1 + Math.sin(now * 1.6) * 0.03; // breathing
        o.zs.forEach((z, i) => {
          const k = (now * 0.45 + i / 3) % 1;
          z.position.set(0.6 + k * 0.8, 3.0 + k * 1.6, 0); z.scale.setScalar(0.5 + k * 0.6); z.material.opacity = 1 - k;
        });
      }
    }
    for (const [id, o] of statueObjs) if (!live.has(id)) { scene.remove(o.g); statueObjs.delete(id); }
  }

  // Surfing: you stand on a surfboard (striped in your outfit colour) with your monster riding up front,
  // throwing white spray off the tail and leaving ripples when you stop.
  const BOARD_STRIPE = { red: 0xd83a30, blue: 0x3060d8, green: 0x2f9a48, gold: 0xe0a020 };
  const surfRigs = {};
  function surfRig(slug, color) {
    const ck = slug + ":" + color;
    if (surfRigs[ck]) return surfRigs[ck];
    const L = 2.5, W = 0.8;
    const sh = new THREE.Shape();
    sh.moveTo(0, -L / 2);
    sh.bezierCurveTo(W * 0.6, -L / 2, W / 2, -L * 0.15, W / 2, L * 0.1);
    sh.bezierCurveTo(W / 2, L * 0.38, W * 0.15, L / 2, 0, L / 2 + 0.05);
    sh.bezierCurveTo(-W * 0.15, L / 2, -W / 2, L * 0.38, -W / 2, L * 0.1);
    sh.bezierCurveTo(-W / 2, -L * 0.15, -W * 0.6, -L / 2, 0, -L / 2);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.04, bevelSegments: 3, curveSegments: 18 });
    geo.rotateX(Math.PI / 2); // lie flat; shape +y becomes forward (-z)
    const board = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xf6f1e6, roughness: 0.35 }));
    board.castShadow = true; board.receiveShadow = true;
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.16, L * 0.86), new THREE.MeshStandardMaterial({ color: BOARD_STRIPE[color] || 0xd83a30, roughness: 0.4 }));
    stripe.rotation.x = -Math.PI / 2; stripe.position.y = 0.035;
    const g = new THREE.Group(); g.rotation.order = "YXZ"; g.add(board, stripe);
    const mon = mountModel(slug, true);
    mon.g.position.set(0, 0.04, -0.8); // monster rides the nose of the board
    g.add(mon.g);
    surfRigs[ck] = { g, deck: 0.06 };
    return surfRigs[ck];
  }
  let spray = null;
  const drops = [];
  function sprayPool() {
    if (spray) return spray;
    spray = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.11, 0), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }), 160);
    spray.frustumCulled = false;
    for (let i = 0; i < 160; i++) drops.push({ life: 0 });
    scene.add(spray);
    return spray;
  }
  function updateSpray(dt, p, emit, now) {
    const sp = sprayPool();
    if (!sp.parent) scene.add(sp);
    const f = [-Math.sin(p.angle), -Math.cos(p.angle)], r = [-f[1], f[0]];
    const rate = emit ? Math.min(9, 3 + Math.abs(p.speed) * 2) : 0;
    for (let k = 0; k < rate; k++) {
      const d = drops.find((x) => x.life <= 0); if (!d) break;
      const side = Math.random() < 0.5 ? -1 : 1;
      d.x = p.px - f[0] * 1.0 + r[0] * side * 0.35; d.z = p.pz - f[1] * 1.0 + r[1] * side * 0.35; d.y = 0;
      d.vx = r[0] * side * (1 + Math.random()) - f[0] * 0.6; d.vz = r[1] * side * (1 + Math.random()) - f[1] * 0.6; d.vy = 1.2 + Math.random() * 1.6;
      d.life = d.max = 0.5 + Math.random() * 0.4; d.s = 0.6 + Math.random() * 1.2;
    }
    // idle ripples: a ring of droplets puffs out every so often
    if (!emit && Math.floor(now * 1.2) !== Math.floor((now - dt) * 1.2)) {
      for (let k = 0; k < 14; k++) {
        const d = drops.find((x) => x.life <= 0); if (!d) break;
        const a = (k / 14) * Math.PI * 2;
        d.x = p.px + Math.cos(a) * 0.9; d.z = p.pz + Math.sin(a) * 1.3; d.y = 0;
        d.vx = Math.cos(a) * 0.8; d.vz = Math.sin(a) * 0.8; d.vy = 0.15; d.life = d.max = 0.9; d.s = 0.7;
      }
    }
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      if (d.life > 0) {
        d.life -= dt; d.vy -= 6 * dt;
        d.x += d.vx * dt; d.y = Math.max(-0.05, d.y + d.vy * dt); d.z += d.vz * dt;
        const k = Math.max(0, d.life / d.max) * d.s;
        tmpM.makeScale(k, k, k); tmpM.setPosition(d.x, d.y, d.z);
      } else tmpM.makeScale(0, 0, 0);
      sp.setMatrixAt(i, tmpM);
    }
    sp.instanceMatrix.needsUpdate = true;
  }

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
    // hide any building whose footprint the camera->player sightline passes through. The test stops
    // 1.2 tiles short of the player, so a building you're walking up to (in front of you) never vanishes;
    // one behind you (e.g. the house you just walked out of) still hides so you can see.
    const span = Math.hypot(p.px - camPos.x, p.pz - camPos.z), kEnd = Math.max(0, 1 - 1.2 / Math.max(span, 0.01));
    for (const g of blockers) {
      const [x0, z0, x1, z1] = g.userData.box;
      let hit = false;
      for (let k = 0; k <= kEnd && !hit; k += 0.05) {
        const x = camPos.x + (p.px - camPos.x) * k, zz = camPos.z + (p.pz - camPos.z) * k;
        if (x > x0 && x < x1 && zz > z0 && zz < z1) hit = true;
      }
      g.visible = !hit;
    }
    camera.lookAt(lookAt);
    sun.position.set(p.px + 8, 14, p.pz + 5);
    sun.target.position.set(p.px, 0, p.pz);
    if (water) water.position.y = Math.sin(now * 1.5) * 0.02;
    for (const r of markers) { const k = (now * 1.2) % 1; r.scale.setScalar(0.8 + k * 0.7); r.material.opacity = 0.85 * (1 - k); }

    updateStatues(state.statues, p, now);
    for (const a of actors.values()) a.seen = false;
    for (const n of state.npcs) updateActor(n.key, n.sprite, n.fx / 16 + 0.5, n.fy / 16 + 0.5, n.faceYaw != null ? n.faceYaw : ANG[n.dir], n.walking ? "walk" : "idle", dt, 1, n.outfit, n.model);
    const spd = Math.abs(p.speed), moving = spd > 0.15;
    const anim = !moving ? "idle" : spd > 4 ? "sprint" : "walk";
    // riding: show the mount under the player and seat them on it
    let seatY = 0;
    const look0 = state.look || { outfit: "red" };
    if (p.mount && p.surfing) {
      const rig = surfRig(p.mount, look0.outfit);
      if (activeMount !== rig.g) { if (activeMount) scene.remove(activeMount); activeMount = rig.g; scene.add(rig.g); }
      const moving2 = Math.abs(p.speed) > 0.3;
      const bob = Math.sin(now * 2.6) * 0.05;
      rig.g.position.set(p.px, -0.06 + bob, p.pz);
      // nose lifts with speed, rolls gently with the swell
      rig.g.rotation.set(Math.min(0.12, Math.abs(p.speed) * 0.025), p.angle, Math.sin(now * 1.9) * 0.05);
      seatY = -0.06 + bob + rig.deck;
      updateSpray(dt, p, moving2, now);
    } else if (p.mount) {
      const mm = mountModel(p.mount);
      if (activeMount !== mm.g) { if (activeMount) scene.remove(activeMount); activeMount = mm.g; scene.add(mm.g); }
      const bob = p.surfing ? Math.sin(now * 2.6) * 0.07 : Math.sin(now * 4) * 0.12 * Math.min(1, p.alt || 0);
      const base = p.surfing ? -0.12 : 0.1;
      mm.g.position.set(p.px, base + (p.alt || 0) + bob, p.pz);
      mm.g.rotation.set(0, p.angle, 0);
      mm.g.children[0].rotation.set(-Math.PI / 2 + (p.alt > 0.2 ? 0.15 : 0), 0, Math.sin(now * 1.7) * (p.surfing ? 0.04 : 0.1));
      seatY = base + (p.alt || 0) + bob + mm.seat;
    } else if (activeMount) { scene.remove(activeMount); activeMount = null; }
    if (!(p.mount && p.surfing) && spray) updateSpray(dt, p, false, -1);
    const look = state.look || { model: "qn:male", outfit: "red" };
    const pkey = "player:" + look.model + ":" + look.outfit;
    const surfing = p.mount && p.surfing;
    updateActor(pkey, null, p.px, p.pz, p.angle + (surfing ? 1.1 : 0), surfing ? "idle" : p.mount ? "sit" : anim, dt, p.mount ? 1 : moving ? Math.max(0.5, spd / (spd > 4 ? 5 : 3)) : 1, look.outfit, look.model);
    const pa = actors.get(pkey);
    pa.root.position.y = seatY - (pa.qn && p.mount && !surfing ? 0.36 : 0);
    if (surfing) { const f2 = [-Math.sin(p.angle), -Math.cos(p.angle)]; pa.root.position.x = p.px - f2[0] * 0.25; pa.root.position.z = p.pz - f2[1] * 0.25; }
    pa.root.scale.set(1, surfing ? 0.92 : 1, 1);
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
