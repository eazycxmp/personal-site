"use strict";
// Wildmon: a monster-catching RPG built on Tuxemon's open art.
const D = window.GAME_DATA;
// Krokivip is the Water starter (the fiercer form of Kroki); give it starter-level stats so the three are even.
D.monsters.krokivip.stage = 0;
const MAPS = window.WORLD.maps;
const BUILDINGS = window.WORLD.BUILDINGS;
const T = 16, VW = 240, VH = 160;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const EDGE_DIR = { n: "up", s: "down", w: "left", e: "right" };
const OPP = { up: "down", down: "up", left: "right", right: "left" };
const ROW = { down: 0, left: 1, right: 2, up: 3 };
const ITEMS = {
  potion: { name: "Potion", price: 200, heal: 30, icon: "potion", desc: "Restores 30 HP." },
  super_potion: { name: "Super Potion", price: 600, heal: 80, icon: "super_potion", desc: "Restores 80 HP." },
  revive: { name: "Revive", price: 1000, revive: true, icon: "revive", desc: "Revives a fainted monster." },
  tuxeball: { name: "Tuxeball", price: 200, ball: 1, icon: "tuxeball", desc: "Catches wild monsters." },
};
const TYPE_COLOR = {
  fire: "#e0502c", water: "#3a7be0", wood: "#3fa34d", earth: "#a8763e", steel: "#8c96a3", frost: "#7fd4e8",
  lightning: "#e6c02a", normal: "#a8a29a", venom: "#9a4fc2", heroic: "#e08a2c", psychic: "#e0479a",
  sky: "#6fb3e8", dark: "#4a3b5c", dragon: "#6a3ad8",
};
const BG_FOR = { grass: "grass_background", forest: "forest_background", beach: "beach_background", interior: "battle_interior" };

// ---------------------------------------------------------------- canvas
const cv = document.getElementById("game");
const ctx = cv.getContext("2d");
let SCALE = 3;
function resize() {
  SCALE = Math.max(1, Math.floor(Math.min((innerWidth - 16) / VW, (innerHeight - 48) / VH)));
  cv.width = VW * SCALE; cv.height = VH * SCALE;
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;
  const scr = document.getElementById("screen");
  scr.style.width = VW * SCALE + "px"; scr.style.height = VH * SCALE + "px";
  if (window.World3D) World3D.resize(VW * SCALE, VH * SCALE);
}
addEventListener("resize", resize);
resize();

// ---------------------------------------------------------------- assets
const IMG = {};
function loadImg(key, src) {
  return new Promise((res) => {
    const i = new Image();
    i.onload = () => { IMG[key] = i; res(); };
    i.onerror = () => { console.warn("missing image", src); res(); };
    i.src = src;
  });
}
// Music is the live house/rave DJ engine in music.js.
let curMusic = null, muted = false;
function music(name) { curMusic = name; HouseDJ.play(name); }
function unlockAudio() { HouseDJ.unlock(); }
function toggleMute() { muted = !muted; HouseDJ.setMuted(muted); }

function npcSpritesUsed() {
  const s = new Set(["adventurer"]);
  for (const m of Object.values(MAPS)) for (const n of m.npcs || []) s.add(n.sprite);
  return [...s];
}
async function loadAssets(progress) {
  const jobs = [
    ["tiles", "assets/tiles/Basic_Buch_Tiles_Compiled.png"], ["buildings", "assets/tiles/core_buildings.png"],
    ["floors", "assets/tiles/floorsandwalls.png"], ["sign", "assets/obj/sign.png"],
    ["portrait_player", "assets/portrait/adventurer.png"],
  ];
  for (const b of Object.values(BG_FOR)) jobs.push(["bg_" + b, `assets/bg/${b}.png`]);
  for (const k of Object.keys(ITEMS)) jobs.push(["item_" + k, `assets/items/${ITEMS[k].icon}.png`]);
  for (const s of npcSpritesUsed()) {
    jobs.push(["npc_" + s, `assets/npc/${s}.png`]);
    jobs.push(["portrait_" + s, `assets/portrait/${s}.png`]);
  }
  for (const m of Object.keys(D.monsters)) jobs.push(["mon_" + m, `assets/battle/${m}.png`]);
  for (const a of Object.keys(D.fx || {})) jobs.push(["fx_" + a, `assets/fx/${a}.png`]);
  let done = 0;
  await Promise.all(jobs.map(([k, s]) => loadImg(k, s).then(() => progress(++done / jobs.length / 2))));
  await HouseDJ.load("assets/drums/");
  await World3D.load("assets/models/", (k) => progress(0.5 + k / 2));
  await document.fonts.load("8px PS");
}

// ---------------------------------------------------------------- input
const held = {}, pressed = {};
const KEYMAP = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  KeyW: "up", KeyS: "down", KeyA: "left", KeyD: "right",
  KeyZ: "a", Enter: "a", Space: "a", KeyX: "b", Escape: "b", Backspace: "b",
  ShiftLeft: "run", ShiftRight: "run", KeyM: "mute", KeyF: "fly", KeyT: "teleport",
};
addEventListener("keydown", (e) => {
  const k = KEYMAP[e.code];
  if (!k) return;
  e.preventDefault();
  unlockAudio();
  if (!held[k]) pressed[k] = true;
  held[k] = true;
  if (k === "mute") toggleMute();
});
addEventListener("keyup", (e) => { const k = KEYMAP[e.code]; if (k) held[k] = false; });
addEventListener("blur", () => { for (const k in held) held[k] = false; });
function consume(k) { if (pressed[k]) { pressed[k] = false; return true; } return false; }
function heldDir() {
  for (const d of ["up", "down", "left", "right"]) if (pressed[d]) { pressed[d] = false; return d; }
  for (const d of ["up", "down", "left", "right"]) if (held[d]) return d;
  return null;
}

// ---------------------------------------------------------------- timing / async helpers
let NOW = 0;
const tweens = [];
function tween(dur, fn) {
  return new Promise((res) => tweens.push({ t: 0, dur, fn: fn || (() => {}), res }));
}
const wait = (s) => tween(s);
function updateTweens(dt) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    const k = Math.min(1, tw.t / tw.dur);
    tw.fn(k);
    if (k >= 1) { tweens.splice(i, 1); tw.res(); }
  }
}
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------------------------------------------------------------- scene stack
const scenes = [];
function push(s) { scenes.push(s); return s; }
function pop(s) { const i = scenes.indexOf(s); if (i >= 0) scenes.splice(i, 1); }
let fade = 0; // 0 = clear, 1 = black
const fadeTo = (v, d = 0.25) => { const s = fade; return tween(d, (k) => { fade = s + (v - s) * k; }); };

// ---------------------------------------------------------------- drawing helpers
function text(str, x, y, color = "#303030", shadow = "#d0d0c8") {
  ctx.font = "8px PS";
  ctx.textBaseline = "top";
  if (shadow) { ctx.fillStyle = shadow; ctx.fillText(str, x + 1, y + 1); }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
function textW(str) { ctx.font = "8px PS"; return ctx.measureText(str).width; }
function box(x, y, w, h, fill = "#f8f8f0") {
  ctx.fillStyle = "#283848"; ctx.fillRect(x + 1, y, w - 2, h); ctx.fillRect(x, y + 1, w, h - 2);
  ctx.fillStyle = "#6890b0"; ctx.fillRect(x + 2, y + 1, w - 4, h - 2); ctx.fillRect(x + 1, y + 2, w - 2, h - 4);
  ctx.fillStyle = fill; ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
}
function cursor(x, y) {
  ctx.fillStyle = "#303030";
  for (let i = 0; i < 4; i++) ctx.fillRect(x + i, y + i, 1, 8 - i * 2);
}
function hpBar(x, y, w, frac) {
  ctx.fillStyle = "#404040"; ctx.fillRect(x, y, w + 2, 4);
  ctx.fillStyle = "#e8e8e8"; ctx.fillRect(x + 1, y + 1, w, 2);
  ctx.fillStyle = frac > 0.5 ? "#40c048" : frac > 0.2 ? "#e8c020" : "#e04030";
  ctx.fillRect(x + 1, y + 1, Math.round(w * clamp(frac, 0, 1)), 2);
}
function typeTag(type, x, y) {
  const w = textW(type.toUpperCase()) + 4;
  ctx.fillStyle = TYPE_COLOR[type] || "#888"; ctx.fillRect(x, y, w, 10);
  text(type.toUpperCase(), x + 2, y + 1, "#fff", null);
  return w;
}
function wrap(str, maxW) {
  const out = [];
  for (const para of str.split("\n")) {
    let line = "";
    for (const word of para.split(" ")) {
      const t = line ? line + " " + word : word;
      if (textW(t) > maxW && line) { out.push(line); line = word; } else line = t;
    }
    out.push(line);
  }
  return out;
}
function drawMon(slug, which, x, y, alpha = 1, scale = 1) {
  const im = IMG["mon_" + slug];
  if (!im) return;
  ctx.globalAlpha = alpha;
  const sx = which === "back" ? 64 : 0;
  const s = 64 * scale;
  ctx.drawImage(im, sx, 0, 64, 64, Math.round(x + (64 - s) / 2), Math.round(y + (64 - s)), s, s);
  ctx.globalAlpha = 1;
}
function drawMonIcon(slug, x, y) {
  const im = IMG["mon_" + slug];
  if (im) ctx.drawImage(im, (Math.floor(NOW * 3) % 2) * 24, 64, 24, 24, x, y, 24, 24);
}

// ---------------------------------------------------------------- dialog & choice scenes
function say(str, opts = {}) {
  return new Promise((res) => {
    ctx.font = "8px PS";
    const lines = wrap(str, VW - 28);
    const pages = [];
    for (let i = 0; i < lines.length; i += 3) pages.push(lines.slice(i, i + 3));
    push({
      pages, page: 0, shown: 0, auto: opts.auto, age: 0,
      update(dt) {
        const total = this.pages[this.page].join("").length;
        this.shown = Math.min(total, this.shown + dt * 60);
        this.age += dt;
        const done = this.shown >= total;
        if (consume("a") || consume("b") || (this.auto && done && this.age > this.auto)) {
          if (!done) { this.shown = total; return; }
          this.page++; this.shown = 0; this.age = 0;
          if (this.page >= this.pages.length) { pop(this); res(); }
        }
      },
      draw() {
        box(0, 112, VW, 48);
        let left = Math.floor(this.shown);
        this.pages[this.page].forEach((ln, i) => {
          text(ln.slice(0, Math.max(0, left)), 10, 120 + i * 12);
          left -= ln.length;
        });
        if (this.shown >= this.pages[this.page].join("").length && !this.auto && Math.floor(NOW * 3) % 2) {
          ctx.fillStyle = "#e04030"; ctx.fillRect(226, 150, 6, 3); ctx.fillRect(227, 153, 4, 1); ctx.fillRect(228, 154, 2, 1);
        }
      },
    });
  });
}

// items: strings or {label, disabled}. Returns index or -1 on cancel.
function choose(items, o = {}) {
  return new Promise((res) => {
    const cols = o.cols || 1;
    const labels = items.map((it) => (typeof it === "string" ? it : it.label));
    const colW = o.colW || Math.max(...labels.map(textW)) + 16;
    const rowH = 14;
    const rows = Math.ceil(items.length / cols);
    const w = o.w || colW * cols + 14;
    const h = o.h || rows * rowH + 10;
    const x = o.x ?? VW - w;
    const y = o.y ?? (o.prompt ? 112 - h : VH - h);
    push({
      i: o.start || 0,
      update() {
        const r = Math.floor(this.i / cols), c = this.i % cols;
        if (consume("up") && r > 0) this.i -= cols;
        if (consume("down") && this.i + cols < items.length) this.i += cols;
        if (consume("left") && c > 0) this.i--;
        if (consume("right") && c < cols - 1 && this.i + 1 < items.length) this.i++;
        if (o.onMove) o.onMove(this.i);
        if (consume("a")) {
          const it = items[this.i];
          if (it && it.disabled) return;
          pop(this); res(this.i);
        } else if (consume("b") && o.cancel !== false) { pop(this); res(-1); }
      },
      draw() {
        if (o.prompt) { box(0, 112, VW, 48); wrap(o.prompt, o.promptW || VW - 24).slice(0, 3).forEach((l, i) => text(l, 10, 120 + i * 12)); }
        box(x, y, w, h);
        labels.forEach((l, k) => {
          const cx = x + 14 + (k % cols) * colW, cy = y + 6 + Math.floor(k / cols) * rowH;
          text(l, cx, cy, items[k].disabled ? "#a0a0a0" : "#303030");
          if (k === this.i) cursor(cx - 9, cy);
        });
        if (o.extra) o.extra(this.i);
      },
    });
  });
}
const yesNo = async (prompt) => (await choose(["YES", "NO"], { prompt })) === 0;

// ---------------------------------------------------------------- monsters
function expFor(level) { return level * level * level; }
function calcStats(m) {
  const d = D.monsters[m.slug], b = d.base, mult = 1 + 0.15 * d.stage, L = m.level;
  const oldMax = m.maxhp;
  m.maxhp = Math.floor(b.hp * 10 * mult * L / 50) + L + 10;
  for (const k of ["melee", "armour", "ranged", "dodge", "speed"]) m[k] = Math.floor(b[k] * 5 * mult * L / 50) + 5;
  if (oldMax === undefined) m.hp = m.maxhp;
  else if (m.hp > 0) m.hp = Math.min(m.maxhp, m.hp + (m.maxhp - oldMax));
}
function makeMon(slug, level) {
  const m = { slug, level, exp: expFor(level), status: null };
  calcStats(m);
  const known = [];
  for (const [lv, mv] of D.monsters[slug].moves) if (lv <= level && !known.includes(mv)) known.push(mv);
  m.moves = known.slice(-4).map((id) => ({ id, pp: D.moves[id].pp }));
  return m;
}
const monName = (m) => D.monsters[m.slug].name;
function healMon(m) { m.hp = m.maxhp; m.status = null; for (const mv of m.moves) mv.pp = D.moves[mv.id].pp; }
function typeMult(moveType, defTypes) {
  let k = 1;
  for (const t of defTypes) k *= (D.chart[moveType] && D.chart[moveType][t]) ?? 1;
  return k;
}
function calcDamage(att, def, moveId, roll = true) {
  const mv = D.moves[moveId];
  const A = mv.phys ? att.melee : att.ranged;
  const Df = mv.phys ? def.armour : def.dodge;
  const stab = D.monsters[att.slug].types.includes(mv.type) ? 1.5 : 1;
  const eff = typeMult(mv.type, D.monsters[def.slug].types);
  const crit = roll && Math.random() < 1 / 16 ? 1.5 : 1;
  const base = ((2 * att.level / 5 + 2) * mv.power * A / Df) / 50 + 2;
  const r = roll ? 0.85 + Math.random() * 0.15 : 0.92;
  return { dmg: eff === 0 ? 0 : Math.max(1, Math.floor(base * stab * eff * crit * r)), eff, crit: crit > 1 };
}
function partyAlive() { return S.party.filter((m) => m.hp > 0); }

// ---------------------------------------------------------------- player & rival looks
// You pick boy/girl and red/blue/green; your rival is always the opposite gender in a contrasting colour.
const RIVAL_COLOR = { red: "green", green: "red", blue: "gold" };
// you and your rival are realistic people (Quaternius); everyone else uses the Kenney mini figures
const MODEL_FOR = { player: { boy: "qn:male", girl: "qn:female" }, rival: { boy: "qn:male", girl: "qn:female" } };
const myLook = () => S.look || { gender: "boy", color: "red" };
function rivalLook() { const l = myLook(); return { gender: l.gender === "boy" ? "girl" : "boy", color: RIVAL_COLOR[l.color] }; }
const rivalName = () => (rivalLook().gender === "boy" ? "Rival Kai" : "Rival Mia");
// Battle portraits: recolour the clothing palette of Tuxemon's boy/girl player sprites, keeping shading.
const SPRITE_RECOLOR = { // groups of palette colours -> theme colour, shading kept relative to `ref`
  adventurer: [{ colors: [[231, 120, 95], [195, 81, 54], [114, 25, 5], [136, 39, 16]], ref: [195, 81, 54] }],
  heroine: [
    { colors: [[145, 220, 222], [205, 253, 255], [61, 154, 171], [9, 134, 157]], ref: [145, 220, 222] }, // back view top + hat
    { colors: [[0, 148, 255], [6, 129, 218], [128, 174, 208]], ref: [6, 129, 218] },                     // front view top + hat
  ],
};
const THEME_2D = { red: [216, 58, 48], blue: [48, 96, 216], green: [47, 154, 72], gold: [224, 160, 32] };
const portraitCache = {};
function lookPortrait(look) {
  const sheet = look.gender === "boy" ? "adventurer" : "heroine", key = sheet + look.color;
  if (portraitCache[key]) return portraitCache[key];
  const img = IMG["portrait_" + sheet], groups = SPRITE_RECOLOR[sheet], to = THEME_2D[look.color];
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const x = c.getContext("2d"); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height), px = d.data;
  const lum = (r, g, b) => r * 0.3 + g * 0.59 + b * 0.11;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 10) continue;
    const r = px[i], g = px[i + 1], b = px[i + 2];
    const grp = groups.find((gr) => gr.colors.some(([a, b2, c2]) => Math.abs(a - r) + Math.abs(b2 - g) + Math.abs(c2 - b) < 12));
    if (!grp) continue;
    const k = Math.min(1.5, lum(r, g, b) / lum(...grp.ref));
    px[i] = Math.min(255, to[0] * k); px[i + 1] = Math.min(255, to[1] * k); px[i + 2] = Math.min(255, to[2] * k);
  }
  x.putImageData(d, 0, 0);
  return (portraitCache[key] = c);
}

// ---------------------------------------------------------------- game state
let S = null; // save state
function newState() {
  return {
    map: "lab", x: 5, y: 6, dir: "up", party: [], box: [], bag: { tuxeball: 5, potion: 3 },
    money: 500, badges: [], flags: {}, lastHeal: { map: "home", x: 3, y: 5 }, starter: null,
    seen: {}, caught: {}, time: 0,
  };
}
const SAVE_KEY = "monster-trails-save-v1"; // kept from the old name so existing saves still load
function save() {
  const p = world.player;
  if (world.map) { S.map = world.id; S.x = p.x; S.y = p.y; S.dir = p.dir; }
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); return true; } catch (e) { return false; }
}
function loadSave() {
  try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
}
// Older saves can reference moves/items/monsters that the data no longer has.
function migrateSave(st) {
  const fix = (m) => {
    if (!D.monsters[m.slug]) return null;
    m.moves = (m.moves || []).filter((mv) => D.moves[mv.id]);
    if (!m.moves.length) m.moves = [{ id: "gnaw", pp: D.moves.gnaw.pp }];
    return m;
  };
  st.party = (st.party || []).map(fix).filter(Boolean);
  st.box = (st.box || []).map(fix).filter(Boolean);
  for (const k of Object.keys(st.bag || {})) if (!ITEMS[k]) delete st.bag[k];
  if (!MAPS[st.map]) Object.assign(st, { map: "lab", x: 5, y: 6, dir: "up" });
  return st;
}
function addMon(m) {
  S.caught[m.slug] = true; S.seen[m.slug] = true;
  if (S.party.length < 6) { S.party.push(m); return "party"; }
  S.box.push(m); return "box";
}

// ---------------------------------------------------------------- world
const world = {
  map: null, id: null, npcs: [], doors: [], solid: null, busy: false,
  // x,y = current tile; px,pz = continuous position (tile units, tile centre = +0.5); angle 0 faces north
  player: { x: 0, y: 0, px: 0.5, pz: 0.5, angle: 0, speed: 0, dir: "down", mount: null, surfing: false, alt: 0 },
  bubble: null,
};

function prepWorld() {
  // compute interior exits from building doors, and door lookup per map
  for (const [id, m] of Object.entries(MAPS)) {
    m.id = id;
    for (const b of m.buildings || []) {
      const B = BUILDINGS[b.type];
      b.door = { x: b.x + B.door, y: b.y + B.th - 1 };
      if (b.to) { MAPS[b.to].out = { map: id, x: b.door.x, y: b.door.y + 1 }; b.label = { center: "Healing Center", mart: "Mart" }[b.type] || MAPS[b.to].name; }
    }
    for (const e of m.exits || []) {
      // signpost text: where this exit leads (and, for routes, the town beyond)
      const t = MAPS[e.to];
      const beyond = t.encounters && (t.exits || []).find((x) => x.to !== id);
      e.label = beyond ? [t.name.toUpperCase(), "to " + MAPS[beyond.to].name.toUpperCase()] : [t.name.toUpperCase()];
      for (let i = 0; i < e.w; i++) {
        const [x, y] = exitTile(m, e, i);
        m.grid[y][x] = m.grid[y][x] === "T" ? "=" : m.grid[y][x];
      }
      // open up the tree border beside the exit (2 tiles each side, 3 deep) so it reads as a clear way out
      const vert = e.edge === "n" || e.edge === "s";
      if (!e.narrow) for (let i = -2; i < e.w + 2; i++) for (let d = 0; d < 3; d++) {
        const x = vert ? e.at + i : (e.edge === "w" ? d : m.w - 1 - d);
        const y = vert ? (e.edge === "n" ? d : m.h - 1 - d) : e.at + i;
        if (x < 0 || y < 0 || x >= m.w || y >= m.h) continue;
        const onExitLine = i >= 0 && i < e.w;
        if (m.grid[y][x] === "T") m.grid[y][x] = onExitLine ? "=" : ".";
      }
    }
  }
}
function exitTile(m, e, i) {
  if (e.edge === "n") return [e.at + i, 0];
  if (e.edge === "s") return [e.at + i, m.h - 1];
  if (e.edge === "w") return [0, e.at + i];
  return [m.w - 1, e.at + i];
}

function loadMap(id, x, y, dir) {
  const m = MAPS[id], prevId = world.id;
  world.map = m; world.id = id;
  S.map = id;
  const p = world.player;
  placePlayer(x, y, dir || p.dir);
  world.npcs = (m.npcs || []).filter((n) => !(n.rival && S.flags[n.id])).map((n, i) => {
    const o = { ...n, def: n, key: id + "_" + i, fx: n.x * T, fy: n.y * T, defeated: !!(n.id && S.flags[n.id]) };
    if (n.rival) { const rl = rivalLook(); o.name = rivalName(); o.model = MODEL_FOR.rival[rl.gender]; o.outfit = rl.color; }
    return o;
  });
  // solid footprint of buildings
  world.solid = new Set();
  world.doors = [];
  for (const b of m.buildings || []) {
    const B = BUILDINGS[b.type];
    for (let j = 0; j < B.th; j++) for (let i = 0; i < B.tw; i++) world.solid.add((b.x + i) + "," + (b.y + j));
    world.solid.delete(b.door.x + "," + b.door.y);
    world.doors.push(b);
  }
  for (const s of m.signs || []) world.solid.add(s.x + "," + s.y);
  world.statues = [];
  for (const L of m.legends || []) if (!S.flags[L.id]) world.statues.push({ ...L, kind: "legend", tiles: [[L.x, L.y]] });
  if (m.sleeper && !S.flags[m.sleeper.id]) world.statues.push({ ...m.sleeper, kind: "sleeper" });
  for (const st of world.statues) for (const [x, y] of st.tiles) world.solid.add(x + "," + y);
  music(m.music || "town");
  World3D.build(m, BUILDINGS);
  World3D.snapYaw(p.angle);
  if (prevId !== id) worldScene.banner = { name: m.theme ? `${m.name}: ${m.theme}` : m.name, t: NOW };
}

function tileAt(x, y) {
  const m = world.map;
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return null;
  return m.grid[y][x];
}
function npcAt(x, y) { return world.npcs.find((n) => n.x === x && n.y === y); }
function blocked(x, y, ignorePlayer) {
  const t = tileAt(x, y);
  if (t === null || "T~FWC".includes(t)) return true;
  if (world.solid.has(x + "," + y)) return true;
  if (npcAt(x, y)) return true;
  if (!ignorePlayer && world.player.x === x && world.player.y === y) return true;
  return false;
}

async function warp(id, x, y, dir) {
  world.busy = true;
  await fadeTo(1, 0.2);
  loadMap(id, x, y, dir);
  await fadeTo(0, 0.2);
  world.busy = false;
  S.flags["visited_" + id] = true;
}

// ---------------------------------------------------------------- free movement
// The player moves continuously; the tile grid is still the source of truth for collisions,
// doors, encounters and trainers (checked whenever the player enters a new tile).
const ANGLE = { up: 0, left: Math.PI / 2, down: Math.PI, right: -Math.PI / 2 };
const RADIUS = 0.28;
function dirFromAngle(a) {
  const fx = -Math.sin(a), fz = -Math.cos(a);
  return Math.abs(fx) > Math.abs(fz) ? (fx > 0 ? "right" : "left") : (fz > 0 ? "down" : "up");
}
function placePlayer(x, y, dir) {
  const p = world.player;
  p.x = x; p.y = y; p.px = x + 0.5; p.pz = y + 0.5;
  p.dir = dir; p.angle = ANGLE[dir]; p.speed = 0;
  p.mount = null; p.surfing = false; p.alt = 0;
}

// ---------------------------------------------------------------- riding: Surf and Fly
// Surf (Tide Badge + a Water monster) carries you across water; Fly (Volt Badge + a Sky monster)
// takes you to any town you've visited. You ride your own monster in 3D.
const rider = (type) => S.party.find((m) => m.hp > 0 && D.monsters[m.slug].types.includes(type));
async function trySurf(tx, ty) {
  const p = world.player;
  if (!S.badges.includes("Tide Badge")) { await say("The water is deep blue. A Water monster could carry you across... once you earn the TIDE BADGE."); return; }
  const m = rider("water");
  if (!m) { await say("None of your monsters can swim. Catch a WATER-type monster to ride across water."); return; }
  if (!(await yesNo(`The water is calm. Ride ${monName(m)} across it?`))) return;
  p.mount = m.slug; p.surfing = true;
  const x0 = p.px, z0 = p.pz;
  await tween(0.45, (k) => { p.px = x0 + (tx + 0.5 - x0) * k; p.pz = z0 + (ty + 0.5 - z0) * k; });
  p.x = tx; p.y = ty;
}
const FLY_TOWNS = ["sprout", "ember", "tide", "volt", "shade"];
function landingSpot(id) {
  const m = MAPS[id];
  const b = (m.buildings || []).find((x) => x.type === "center") || (m.buildings || []).find((x) => x.to === "home") || m.buildings[0];
  for (const dy of [2, 1, 3]) if (!blockedAt(id, b.door.x, b.door.y + dy)) return [b.door.x, b.door.y + dy];
  return [b.door.x, b.door.y + 1];
}
// Teleport: a Psychic monster warps you instantly to any town you've visited, even from indoors.
let warpFx = 0;
async function teleportMenu() {
  const m = rider("psychic");
  if (!m) { await say("You need a PSYCHIC-type monster in your party to teleport."); return; }
  const towns = FLY_TOWNS.filter((id) => S.flags["visited_" + id] || id === world.id);
  const i = await choose(towns.map((id) => MAPS[id].name).concat(["CANCEL"]), { prompt: `${monName(m)} focuses its mind. Teleport where?`, x: 120, y: 4, w: 116 });
  if (i < 0 || i === towns.length) return;
  const dest = towns[i];
  await say(`${monName(m)} used TELEPORT!`, { auto: 0.5 });
  await tween(0.7, (k) => { warpFx = k; });
  fade = 1;
  const [lx, ly] = landingSpot(dest);
  loadMap(dest, lx, ly, "down");
  S.flags["visited_" + dest] = true;
  await tween(0.6, (k) => { warpFx = 1 - k; fade = 1 - k; });
  warpFx = 0; fade = 0;
}
// psychic swirl drawn over the screen while teleporting
function drawWarpFx() {
  if (!warpFx) return;
  ctx.save();
  ctx.fillStyle = `rgba(120, 30, 160, ${0.45 * warpFx})`; ctx.fillRect(0, 0, VW, VH);
  for (let r = 0; r < 6; r++) {
    const rad = ((NOW * 60 + r * 22) % 140) * warpFx;
    ctx.strokeStyle = `rgba(255, 140, 255, ${0.8 * (1 - rad / 140)})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(VW / 2, VH / 2 + 10, rad, rad * 0.6, NOW * 2 + r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

async function flyMenu() {
  const p = world.player;
  if (!S.badges.includes("Volt Badge")) { await say("Your monsters can't carry you through the sky yet. Earn the VOLT BADGE first."); return; }
  const m = rider("sky");
  if (!m) { await say("You need a SKY-type monster in your party to fly."); return; }
  if (world.map.interior) { await say("You can't fly indoors! Head outside first."); return; }
  const towns = FLY_TOWNS.filter((id) => S.flags["visited_" + id] || id === world.id);
  const i = await choose(towns.map((id) => MAPS[id].name).concat(["CANCEL"]), { prompt: `Fly on ${monName(m)}. Where to?`, x: 120, y: 4, w: 116 });
  if (i < 0 || i === towns.length) return;
  const dest = towns[i];
  p.mount = m.slug; p.surfing = false; p.speed = 0;
  await say(`${monName(m)} spreads its wings!`, { auto: 0.6 });
  await tween(1.3, (k) => { p.alt = 8 * k * k; });
  await fadeTo(1, 0.3);
  const [lx, ly] = landingSpot(dest);
  loadMap(dest, lx, ly, "down");
  S.flags["visited_" + dest] = true;
  p.mount = m.slug; p.alt = 8;
  await fadeTo(0, 0.3);
  await tween(1.3, (k) => { p.alt = 8 * (1 - k) * (1 - k); });
  p.alt = 0; p.mount = null;
}
function exitAt(edge, x, y) {
  const m = world.map;
  for (const e of m.exits || []) {
    if (e.edge !== edge) continue;
    for (let i = 0; i < e.w; i++) { const [ex, ey] = exitTile(m, e, i); if (ex === x && ey === y) return [e, i]; }
  }
  return null;
}
function gateAt(x, y, moveDir) {
  for (const g of world.map.gates || []) {
    if (moveDir === g.block && x >= g.x && x < g.x + g.w && y >= g.y && y < g.y + g.h && S.badges.length < g.badges) return g;
  }
  return null;
}
let gateCooldown = 0;
// can the player's circle stand at (nx, nz)?
function freeAt(nx, nz, moveDir) {
  const p = world.player, m = world.map;
  for (let ty = Math.floor(nz - RADIUS); ty <= Math.floor(nz + RADIUS); ty++) {
    for (let tx = Math.floor(nx - RADIUS); tx <= Math.floor(nx + RADIUS); tx++) {
      if (tx === p.x && ty === p.y) continue;
      if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) {
        const edge = tx < 0 ? "w" : tx >= m.w ? "e" : ty < 0 ? "n" : "s";
        if (exitAt(edge, clamp(tx, 0, m.w - 1), clamp(ty, 0, m.h - 1))) continue;
        return false;
      }
      const g = gateAt(tx, ty, moveDir);
      if (g) {
        if (gateCooldown <= 0) { gateCooldown = 2.5; runScript(() => say(g.text)); }
        return false;
      }
      if (p.surfing && tileAt(tx, ty) === "~" && !npcAt(tx, ty)) continue;
      if (blocked(tx, ty, true)) return false;
    }
  }
  return true;
}
function movePlayer(dx, dz) {
  const p = world.player;
  if (dx && freeAt(p.px + dx, p.pz, dx > 0 ? "right" : "left")) p.px += dx;
  if (dz && freeAt(p.px, p.pz + dz, dz > 0 ? "down" : "up")) p.pz += dz;
  else if (dz < 0) {
    // forgiving doors: bumping the building front near a door walks you in
    const d = world.doors.find((b) => b.to && p.y === b.door.y + 1 && Math.abs(p.px - (b.door.x + 0.5)) < 1.35);
    if (d) {
      const inn = MAPS[d.to];
      p.speed = 0;
      runScript(() => warp(d.to, Math.floor(inn.w / 2) - 1, inn.h - 2, "up"));
      return;
    }
  }
  const m = world.map;
  // walked off the map through an exit
  if (p.px < 0 || p.pz < 0 || p.px >= m.w || p.pz >= m.h) {
    const edge = p.px < 0 ? "w" : p.px >= m.w ? "e" : p.pz < 0 ? "n" : "s";
    const hit = exitAt(edge, clamp(Math.floor(p.px), 0, m.w - 1), clamp(Math.floor(p.pz), 0, m.h - 1));
    if (hit) { p.speed = 0; crossExit(hit[0], hit[1]); return; }
    p.px = clamp(p.px, 0.3, m.w - 0.3); p.pz = clamp(p.pz, 0.3, m.h - 0.3);
  }
  const tx = Math.floor(p.px), ty = Math.floor(p.pz);
  if (tx !== p.x || ty !== p.y) {
    p.x = tx; p.y = ty;
    if (p.surfing && tileAt(tx, ty) !== "~") { p.surfing = false; p.mount = null; }
    const ev = stepEvent();
    if (ev) { p.speed = 0; runScript(ev); }
  }
}
// smoothly turn to face a direction and settle onto the tile centre (used for cutscenes)
async function faceDir(dir) {
  const p = world.player;
  const a0 = p.angle, x0 = p.px, z0 = p.pz;
  let d = ANGLE[dir] - a0;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  p.speed = 0;
  await tween(0.3, (k) => { const e = k * (2 - k); p.angle = a0 + d * e; p.px = x0 + (p.x + 0.5 - x0) * e; p.pz = z0 + (p.y + 0.5 - z0) * e; });
  p.dir = dir;
}

// is a tile on another map solid? (tiles, building footprints, NPCs, signs)
function blockedAt(id, x, y) {
  const m = MAPS[id];
  if (x < 0 || y < 0 || x >= m.w || y >= m.h || "T~FWC".includes(m.grid[y][x])) return true;
  for (const b of m.buildings || []) { const B = BUILDINGS[b.type]; if (x >= b.x && x < b.x + B.tw && y >= b.y && y < b.y + B.th) return true; }
  return (m.npcs || []).some((n) => n.x === x && n.y === y) || (m.signs || []).some((s2) => s2.x === x && s2.y === y);
}

function crossExit(e, i) {
  const target = MAPS[e.to];
  const back = target.exits.find((x) => x.to === world.id);
  let [tx, ty] = exitTile(target, back, Math.min(i, back.w - 1));
  const inward = OPP[EDGE_DIR[back.edge]], [ix, iy] = DIRS[inward];
  // arrive a few steps inside the map so the tree border isn't right in your face
  for (let k = 0; k < 3 && !blockedAt(e.to, tx + ix, ty + iy); k++) { tx += ix; ty += iy; }
  runScript(() => warp(e.to, tx, ty, inward));
}

// Returns an async event to run after a completed step, or null.
function stepEvent() {
  const p = world.player, m = world.map;
  if (m.interior && tileAt(p.x, p.y) === "X") return () => warp(m.out.map, m.out.x, m.out.y + (blockedAt(m.out.map, m.out.x, m.out.y + 1) ? 0 : 1), "down");
  const door = world.doors.find((b) => b.door.x === p.x && b.door.y === p.y);
  if (door && door.to) {
    const inn = MAPS[door.to];
    return () => warp(door.to, Math.floor(inn.w / 2) - 1, inn.h - 2, "up");
  }
  const tr = world.npcs.find(trainerSees);
  if (tr) return () => trainerEncounter(tr, true);
  const table = p.surfing && tileAt(p.x, p.y) === "~" ? m.water : tileAt(p.x, p.y) === "," ? m.encounters : null;
  if (table && table.length && partyAlive().length && Math.random() < (p.surfing ? 0.07 : (m.rate || 0.1))) {
    const pick = pickWild(table), lv = rand(pick[1], pick[2]);
    return () => wildBattle(makeMon(wildForm(pick[0], lv), lv));
  }
  return null;
}

// Wild picks never repeat a species you just met, and species you haven't logged yet turn up more,
// so every walk through the grass brings something different.
const recentWild = [];
function pickWild(table) {
  const fresh = table.filter((e) => !recentWild.includes(e[0]));
  const pool = fresh.length >= 2 ? fresh : table;
  const w = (e) => e[3] * (S.seen[e[0]] ? 1 : 2);
  let r = Math.random() * pool.reduce((a, e) => a + w(e), 0), pick = pool[0];
  for (const e of pool) { r -= w(e); if (r <= 0) { pick = e; break; } }
  recentWild.push(pick[0]);
  if (recentWild.length > Math.min(4, table.length - 2)) recentWild.shift();
  return pick;
}
// a wild monster well past its evolution level has already evolved
function wildForm(slug, lv) {
  while (D.monsters[slug].evo && lv >= D.monsters[slug].evo[0] + 2) slug = D.monsters[slug].evo[1];
  return slug;
}

function runScript(fn) {
  if (world.busy) return;
  world.busy = true;
  Promise.resolve().then(fn).catch((e) => console.error(e)).finally(() => { world.busy = false; });
}

// Route trainers only ambush once your team can handle them; until then you can train in peace.
function topLevel() { return Math.max(0, ...partyAlive().map((m) => m.level)); }
function trainerLevel(n) { return Math.max(...n.team.map((t) => t[1])); }
const READY_MARGIN = 3; // levels above a trainer's strongest before they will ambush you
function readyFor(n) { return n.rival || world.map.interior || topLevel() >= trainerLevel(n) + READY_MARGIN; }
function trainerSees(n) {
  if (n.kind !== "trainer" || n.defeated || !n.sight || !partyAlive().length || !readyFor(n)) return false;
  const [dx, dy] = DIRS[n.dir];
  const p = world.player;
  for (let k = 1; k <= n.sight; k++) {
    const x = n.x + dx * k, y = n.y + dy * k;
    if (p.x === x && p.y === y) return true;
    if (blocked(x, y, true)) return false;
  }
  return false;
}

async function walkNpc(n, dir) {
  n.dir = dir;
  const [dx, dy] = DIRS[dir];
  const sx = n.x * T, sy = n.y * T;
  n.walking = true;
  await tween(0.22, (k) => { n.fx = sx + dx * T * k; n.fy = sy + dy * T * k; });
  n.x += dx; n.y += dy; n.walking = false;
}

async function trainerEncounter(n, spotted) {
  const p = world.player;
  if (spotted) {
    world.bubble = n;
    await wait(0.6);
    world.bubble = null;
    const [dx, dy] = DIRS[n.dir];
    while (Math.abs(n.x - p.x) + Math.abs(n.y - p.y) > 1 && !blocked(n.x + dx, n.y + dy)) await walkNpc(n, n.dir);
    await faceDir(OPP[n.dir]);
  }
  await say(`${n.name}: ${n.intro}`);
  const team = n.team.map(([slug, lv]) => makeMon(evolvedFor(slug === "$rival" ? rivalSlug() : slug === "$rivalstarter" ? rivalStarter() : slug, lv), lv));
  const res = await runBattle({ trainer: n, party: team, bg: world.map.interior ? "interior" : world.map.bg, practice: n.practice });
  if (res === "lose" && n.practice) {
    // the first rival battle is practice: no blackout, your team is patched up either way
    n.defeated = true; S.flags[n.id] = true;
    await say(`${n.name}: ${n.win}`);
    S.party.forEach(healMon);
    await say("Prof. Oakley healed your monsters.");
    save();
    return;
  }
  if (res === "win") {
    n.defeated = true;
    S.flags[n.id] = true;
    await say(`${n.name}: ${n.lose}`);
    if (n.badge && !S.badges.includes(n.badge)) {
      S.badges.push(n.badge);
      await say(`You received the ${n.badge.toUpperCase()}!`);
      if (n.badge === "Tide Badge") await say("With the TIDE BADGE, a WATER monster can carry you across water. Face the water and press Z to SURF!");
      if (n.badge === "Volt Badge") await say("With the VOLT BADGE, a SKY monster can FLY you to any town you've visited. Press F, or choose FLY in the menu!");
      const left = 4 - S.badges.length;
      await say(left ? `Badges: ${S.badges.length}/4. ${left} more to challenge the Champion!` : "You have all 4 badges!\nThe Champion's Hall in Shade\nHollow is now open to you!");
    }
    if (n.champion) await championEnding();
    save();
  }
}
// Trainers field the form a monster would have reached at that level.
function evolvedFor(slug, lv) {
  while (D.monsters[slug].evo && lv >= D.monsters[slug].evo[0]) slug = D.monsters[slug].evo[1];
  return slug;
}
// the starter that beats yours; the rival always picks it
function rivalStarter() { return { agnite: "krokivip", krokivip: "anoleaf", kroki: "anoleaf", anoleaf: "agnite" }[S.starter] || "krokivip"; }
function rivalSlug() {
  return { agnite: "leviadile", krokivip: "velocitile", kroki: "velocitile", anoleaf: "agnigon" }[S.starter] || "agnigon";
}

async function championEnding() {
  await say("Congratulations! You have defeated\nthe Champion and conquered every\ngym in the land!");
  await say(`Monsters caught: ${Object.keys(S.caught).length}/${Object.keys(D.monsters).length}.\nThere are many more out there.\nKeep exploring, Champion!`);
}

// ---------------------------------------------------------------- interactions
// Who is the player looking at? Anyone close and roughly in front, from any angle (people behind
// counters count too). Returns {n} for an NPC or {st} for a legendary / sleeping giant.
function lookTarget() {
  const p = world.player, fx = -Math.sin(p.angle), fz = -Math.cos(p.angle);
  let best = null;
  const consider = (cx, cz, what, reach) => {
    const dx = cx - p.px, dz = cz - p.pz, d = Math.hypot(dx, dz);
    if (d > reach || d < 0.01) return;
    const dot = (dx * fx + dz * fz) / d;
    if (dot < 0.45) return; // within ~63 degrees of where you're facing
    const score = d - dot;
    if (!best || score < best.score) best = { ...what, score, dx, dz };
  };
  const counterAhead = tileAt(Math.floor(p.px + fx * 0.9), Math.floor(p.pz + fz * 0.9)) === "C";
  for (const n of world.npcs) consider(n.x + 0.5, n.y + 0.5, { n }, counterAhead ? 2.4 : 1.7);
  for (const st of world.statues || []) {
    const cx = st.tiles.reduce((a, t) => a + t[0], 0) / st.tiles.length + 0.5, cz = st.tiles.reduce((a, t) => a + t[1], 0) / st.tiles.length + 0.5;
    consider(cx, cz, { st }, 2.4);
  }
  return best;
}
async function interact() {
  const p = world.player;
  const look = lookTarget();
  if (look && look.st) { await statueEncounter(look.st); return; }
  if (look && look.n) {
    const n = look.n;
    // they turn to face you exactly, and you face them
    n.faceYaw = Math.atan2(look.dx, look.dz);
    p.angle = Math.atan2(-look.dx, -look.dz); p.dir = dirFromAngle(p.angle); p.speed = 0;
    await talkTo(n);
    if (n.kind !== "trainer") { n.dir = n.def.dir; n.faceYaw = null; }
    return;
  }
  const [dx, dy] = DIRS[p.dir];
  let x = p.x + dx, y = p.y + dy;
  if (tileAt(x, y) === "~" && !p.surfing) { await trySurf(x, y); return; }
  if (tileAt(x, y) === "C") { x += dx; y += dy; }
  const n = npcAt(x, y);
  if (n) {
    if (!n.walking) n.dir = OPP[p.dir];
    await talkTo(n);
    if (n.kind !== "trainer") n.dir = n.def.dir;
    return;
  }
  const sign = (world.map.signs || []).find((s) => s.x === x && s.y === y);
  if (sign) await say(sign.text);
}

async function statueEncounter(st) {
  if (st.kind === "sleeper") {
    const name = D.monsters[st.slug].name.toUpperCase();
    if (!S.flags.wake_bell) { await say(`A giant ${name} is sound asleep across the path, snoring like thunder. It won't budge.`); return; }
    if (!(await yesNo(`A giant ${name} is blocking the path. Ring the WAKE BELL?`))) return;
    await say(`*CLANG CLANG*... ${name} woke up, and it's grumpy!`);
  } else {
    await say(`The air hums with ancient power... ${D.monsters[st.slug].name.toUpperCase()} is watching you.`);
    if (!(await yesNo("Approach it?"))) return;
  }
  const mon = makeMon(st.slug, st.lv);
  const res = await wildBattle(mon, { legendary: st.kind === "legend" });
  if (res === "lose") return;
  S.flags[st.id] = true;
  world.statues = world.statues.filter((x) => x !== st);
  for (const [x, y] of st.tiles) world.solid.delete(x + "," + y);
  if (st.kind === "sleeper" && res !== "caught") await say(`${D.monsters[st.slug].name} lumbered off into the woods. The path is clear!`);
  if (st.kind === "legend" && res !== "caught") await say(`${D.monsters[st.slug].name} vanished... it won't be seen here again.`);
  save();
}

async function talkTo(n) {
  if (n.kind === "trainer") {
    if (!n.defeated && !partyAlive().length) return say(`${n.name}: Come back when you have monsters that can battle!`);
    if (!n.defeated && !readyFor(n)) {
      const ok = await yesNo(`${n.name}'s strongest is Lv ${trainerLevel(n)}. Yours is Lv ${topLevel()} (Lv ${trainerLevel(n) + READY_MARGIN} recommended). Battle anyway?`);
      if (!ok) return say(`${n.name}: Train up in the tall grass and come back!`);
    }
    if (!n.defeated) return trainerEncounter(n, false);
    return say(`${n.name}: ${n.lose}`);
  }
  if (n.role === "bell" && !S.flags.wake_bell) {
    await say(`${n.name}: You're heading back down Route 3? A giant fell asleep across the side path west of there.`);
    S.flags.wake_bell = true;
    await say("Kat gave you the WAKE BELL! Ring it next to the sleeping giant to wake it up.");
    save();
    return;
  }
  if (n.role === "heal") return healAt(n);
  if (n.role === "shop") return shop();
  if (n.role === "box") return boxMenu();
  if (n.role === "prof") return professor(n);
  for (const line of n.talk || []) await say(`${n.name}: ${line}`);
}

async function healAt(n) {
  await say(n.healText || "Welcome to the Healing Center!\nWe'll restore your monsters to\nfull health.");
  await fadeTo(0.6, 0.3);
  await wait(0.6);
  S.party.forEach(healMon);
  await fadeTo(0, 0.3);
  const p = world.player;
  S.lastHeal = { map: world.id, x: p.x, y: p.y };
  save();
  await say("Your monsters are fully healed!\n(Game saved.)");
}

async function shop() {
  await say("Clerk: Welcome! What can I get\nfor you?");
  const keys = Object.keys(ITEMS);
  for (;;) {
    const i = await choose(keys.map((k) => `${ITEMS[k].name.padEnd(13)}$${ITEMS[k].price}`).concat(["DONE"]), {
      x: 60, y: 4, w: 176,
      extra: () => { box(4, 4, 52, 22); text("$" + S.money, 10, 11); },
    });
    if (i < 0 || i === keys.length) break;
    const it = ITEMS[keys[i]];
    const q = await choose(["x1", "x5", "x10"], { prompt: `${it.desc} How many?` });
    if (q < 0) continue;
    const n = [1, 5, 10][q];
    const cost = n * it.price;
    if (cost > S.money) { await say("You don't have enough money."); continue; }
    S.money -= cost;
    S.bag[keys[i]] = (S.bag[keys[i]] || 0) + n;
    await say(`You bought ${n} ${it.name}${n > 1 ? "s" : ""} for $${cost}.`);
  }
  await say("Clerk: Come again!");
}

async function boxMenu() {
  for (;;) {
    const c = await choose(["DEPOSIT", "WITHDRAW", "DONE"], { prompt: `Box Clerk: Your box holds ${S.box.length} monsters.` });
    if (c === 0) {
      if (S.party.length <= 1) { await say("You can't deposit your last monster!"); continue; }
      const i = await partyScreen("pick", "Deposit which monster?");
      if (i >= 0) { const [m] = S.party.splice(i, 1); S.box.push(m); await say(`${monName(m)} was sent to the box.`); }
    } else if (c === 1) {
      if (!S.box.length) { await say("Your box is empty."); continue; }
      if (S.party.length >= 6) { await say("Your party is full!"); continue; }
      const i = await choose(S.box.map((m) => `${monName(m)} Lv${m.level}`), { x: 60, y: 4, w: 176 });
      if (i >= 0) { const [m] = S.box.splice(i, 1); healMon(m); S.party.push(m); await say(`${monName(m)} joined your party!`); }
    } else break;
  }
}

async function professor(n) {
  if (!S.starter) {
    await say("Prof. Oakley: Ah, there you are!\nToday you begin your journey as a\nmonster trainer!");
    await say("Prof. Oakley: Choose one of these\nthree monsters as your partner.");
    const slug = await starterSelect();
    S.starter = slug;
    const m = makeMon(slug, 5);
    addMon(m);
    await say(`You received ${monName(m)}!`);
    await say("Prof. Oakley: Take these too!\nTuxeballs catch wild monsters,\nand Potions heal them.");
    await say("Prof. Oakley: Your mom can heal\nyour team at home. Go north to\nRoute 1, and beat all 4 gyms!");
    const rival = world.npcs.find((x) => x.id === "rival_lab");
    if (rival) {
      await say(`${rival.name}: Hey, that's my pick... no wait, I'll take ${D.monsters[rivalStarter()].name}! It beats yours anyway!`);
      await trainerEncounter(rival, false);
      world.npcs = world.npcs.filter((x) => x !== rival);
    }
    save();
    return;
  }
  const c = Object.keys(S.caught).length;
  await say(`Prof. Oakley: You've caught ${c} kinds of monsters! Let me heal your team.`);
  S.party.forEach(healMon);
  await say("Your monsters are fully healed!");
}

// New-game (or first-load) character creator: boy/girl, then outfit colour.
function characterCreator() {
  return new Promise((res) => {
    const look = { gender: "boy", color: "red" };
    const sc = push({
      opaque: true, step: 0, update() {},
      draw() {
        ctx.drawImage(IMG.bg_grass_background, 8, 0, 240, 108, 0, 0, 240, 108);
        ctx.fillStyle = "#58a048"; ctx.fillRect(0, 108, 240, 52);
        text(this.step === 0 ? "ARE YOU A BOY OR A GIRL?" : "PICK YOUR OUTFIT COLOR", 22, 6, "#fff", "#204020");
        const shows = this.step === 0 ? [{ gender: "boy", color: look.color }, { gender: "girl", color: look.color }]
          : ["red", "blue", "green"].map((c) => ({ gender: look.gender, color: c }));
        shows.forEach((l, k) => {
          const w = 240 / shows.length, x = w * k + w / 2 - 32;
          const sel = this.step === 0 ? l.gender === look.gender : l.color === look.color;
          if (sel) { ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(x - 4, 20, 72, 84); }
          ctx.drawImage(lookPortrait(l), 64, 0, 64, 64, x, 30 + (sel ? Math.sin(NOW * 8) * 2 : 0), 64, 64);
        });
      },
    });
    const ask = async () => {
      for (;;) {
        sc.step = 0;
        const g = await choose(["BOY", "GIRL"], { prompt: "Are you a boy or a girl?", start: look.gender === "girl" ? 1 : 0, cancel: false,
          onMove: (i) => { look.gender = i ? "girl" : "boy"; } });
        look.gender = g ? "girl" : "boy";
        sc.step = 1;
        const c = await choose(["RED", "BLUE", "GREEN"], { prompt: "Pick your outfit color.", cancel: false,
          onMove: (i) => { look.color = ["red", "blue", "green"][i]; } });
        look.color = ["red", "blue", "green"][c];
        S.look = { ...look };
        const rl = rivalLook();
        if (await yesNo(`A ${look.color.toUpperCase()} ${look.gender.toUpperCase()}. Your rival will be a ${rl.color.toUpperCase()} ${rl.gender.toUpperCase()}. Is this you?`)) break;
      }
      pop(sc); res();
    };
    ask();
  });
}

function starterSelect() {
  const opts = ["agnite", "krokivip", "anoleaf"]; // Krokivip: the fiercer form of Kroki
  return new Promise((res) => {
    push({
      opaque: true, i: 0, confirming: false,
      update() {
        if (this.confirming) return;
        if (consume("left")) this.i = (this.i + 2) % 3;
        if (consume("right")) this.i = (this.i + 1) % 3;
        if (consume("a")) {
          this.confirming = true;
          const slug = opts[this.i];
          yesNo(`Choose ${D.monsters[slug].name}, the ${D.monsters[slug].types[0].toUpperCase()} type?`).then((ok) => {
            this.confirming = false;
            if (ok) { pop(this); res(slug); }
          });
        }
      },
      draw() {
        ctx.drawImage(IMG.bg_grass_background, 8, 0, 240, 108, 0, 0, 240, 108);
        ctx.fillStyle = "#58a048"; ctx.fillRect(0, 108, 240, 52);
        text("CHOOSE YOUR PARTNER", 44, 6, "#fff", "#204020");
        opts.forEach((s, k) => {
          const x = 8 + k * 78, bob = k === this.i ? Math.sin(NOW * 8) * 2 : 0;
          if (k === this.i) { ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(x - 2, 20, 72, 92); }
          drawMon(s, "front", x + 2, 30 + bob);
          text(D.monsters[s].name, x + 4, 98, "#fff", "#204020");
          typeTag(D.monsters[s].types[0], x + 4, 110 - 0);
        });
        if (!this.confirming) {
          box(0, 128, VW, 32);
          text("<- -> to look, Z to choose", 12, 140);
        }
      },
    });
  });
}

// ---------------------------------------------------------------- party / bag / summary screens
function partyScreen(mode, prompt) {
  // mode: "view" | "pick" | "switch" (battle) | "forced" (battle, after faint)
  return new Promise((res) => {
    push({
      opaque: true, i: 0, busy: false,
      update() {
        if (this.busy) return;
        const n = S.party.length;
        if (consume("up")) this.i = (this.i + n - 1) % n;
        if (consume("down")) this.i = (this.i + 1) % n;
        if (consume("b") && mode !== "forced") { pop(this); res(-1); return; }
        if (consume("a")) {
          if (mode === "view") { this.busy = true; this.sub().finally(() => { this.busy = false; }); return; }
          pop(this); res(this.i);
        }
      },
      async sub() {
        const m = S.party[this.i];
        const c = await choose(["SUMMARY", "MAKE LEAD", "CANCEL"], { x: 150, y: 100 });
        if (c === 0) await summary(m);
        if (c === 1 && this.i > 0) { S.party.splice(this.i, 1); S.party.unshift(m); this.i = 0; }
      },
      draw() {
        ctx.fillStyle = "#4878a8"; ctx.fillRect(0, 0, VW, VH);
        S.party.forEach((m, k) => {
          const y = 2 + k * 22, sel = k === this.i;
          box(4, y, 232, 22, sel ? "#fff8c0" : m.hp > 0 ? "#f8f8f0" : "#e8c8c0");
          drawMonIcon(m.slug, 8, y - 2);
          text(monName(m), 34, y + 4);
          text("Lv" + m.level, 130, y + 4);
          hpBar(166, y + 6, 40, m.hp / m.maxhp);
          text(`${m.hp}`, 210, y + 4);
          if (m.status) text(m.status === "burn" ? "BRN" : "PSN", 100, y + 12, "#c04020", null);
        });
        box(0, 134, VW, 26);
        text(prompt || (mode === "view" ? "Choose a monster." : "Choose a monster."), 10, 143);
      },
    });
  });
}

// Where each species can be met in the wild (including already-evolved wild forms), for the Dex.
let WHERE = null;
function whereFound() {
  if (WHERE) return WHERE;
  WHERE = {};
  for (const [id, m] of Object.entries(MAPS)) {
    const label = m.theme || m.name;
    for (const [tbl, tag] of [[m.encounters, ""], [m.water, " (SURF)"]]) for (const [slug, lo, hi] of tbl || []) {
      if (!D.monsters[slug]) continue;
      for (let lv = lo; lv <= hi; lv++) {
        const f = wildForm(slug, lv), list = (WHERE[f] = WHERE[f] || { areas: [], maps: [] });
        if (!list.areas.includes(label + tag)) list.areas.push(label + tag);
        if (!list.maps.includes(id)) list.maps.push(id);
      }
    }
  }
  for (const st of Object.values(MAPS).flatMap((m) => [...(m.legends || []), ...(m.sleeper ? [m.sleeper] : [])])) {
    const m = Object.values(MAPS).find((mm) => (mm.legends || []).includes(st) || mm.sleeper === st);
    WHERE[st.slug] = { areas: [(m.theme || m.name)], maps: [] };
  }
  return WHERE;
}
function hereList() { const W = whereFound(); return Object.keys(D.monsters).filter((s) => W[s] && W[s].maps.includes(world.id)); }

// Lore page shared by the summary screen and the Wildmon-Dex.
function drawLore(slug, known = true) {
  const d = D.monsters[slug];
  ctx.fillStyle = "#e8e0c8"; ctx.fillRect(0, 0, VW, VH);
  box(2, 2, 92, 104, "#c8e0f0");
  if (known) drawMon(slug, "front", 16, 22);
  else { ctx.globalAlpha = 1; ctx.filter = "brightness(0)"; drawMon(slug, "front", 16, 22, 0.55); ctx.filter = "none"; }
  text(known ? d.name : "???", 8, 8);
  if (known) { let tx = 8; for (const t of d.types) tx += typeTag(t, tx, 90) + 2; }
  box(96, 2, 142, 104);
  const size = `${d.height ? (d.height / 100).toFixed(1) + "M" : "?"} ${d.weight ? d.weight + "KG" : ""}`;
  const evo = d.evo ? `LV${d.evo[0]} ${D.monsters[d.evo[1]].name}` : "FINAL FORM";
  const wf = whereFound()[slug];
  const found = wf ? wf.areas.slice(0, 2).join(", ") : ["agnite", "krokivip", "anoleaf"].includes(slug) ? "PROF. OAKLEY'S LAB" : "ONLY BY EVOLVING";
  const rows = known ? [["SPECIES", d.species], ["FOUND IN", found],
    ["SIZE", size], ["EVOLVES", evo], ["TRAITS", (d.traits || []).slice(0, 2).join(", ") || "-"]] : [["SPECIES", "???"], ["HABITAT", "???"]];
  rows.forEach(([k, v], i) => {
    text(k, 102, 8 + i * 19, "#806040", null);
    const lines = wrap(String(v).toUpperCase(), 130);
    text(lines[0], 102, 17 + i * 19, "#303030", null);
  });
  box(2, 108, 236, 50);
  const desc = known ? d.desc || "Little is known about this monster." : "You haven't seen this monster yet.";
  // long entries page through 3 lines at a time
  const lines = wrap(desc, 220), pages = Math.ceil(lines.length / 3), pg = Math.floor(NOW / 3.5) % pages;
  lines.slice(pg * 3, pg * 3 + 3).forEach((ln, i) => text(ln, 10, 115 + i * 12));
  if (pages > 1) text(`${pg + 1}/${pages}`, 210, 148, "#a09080", null);
}

function summary(m) {
  return new Promise((res) => {
    push({
      opaque: true, page: 0,
      update() {
        if (consume("left") || consume("right")) this.page ^= 1;
        if (consume("a") || consume("b")) { pop(this); res(); }
      },
      draw() {
        if (this.page === 1) { drawLore(m.slug); text("< STATS", 172, 150, "#806040", null); return; }
        const d = D.monsters[m.slug];
        ctx.fillStyle = "#e8e0c8"; ctx.fillRect(0, 0, VW, VH);
        box(2, 2, 92, 104, "#c8e0f0");
        drawMon(m.slug, "front", 16, 22);
        text(d.name, 8, 8);
        let tx = 8;
        for (const t of d.types) tx += typeTag(t, tx, 90) + 2;
        box(96, 2, 142, 104);
        const rows = [["LEVEL", m.level], ["HP", `${m.hp}/${m.maxhp}`], ["MELEE", m.melee], ["ARMOUR", m.armour],
          ["RANGED", m.ranged], ["DODGE", m.dodge], ["SPEED", m.speed], ["NEXT LV", Math.max(0, expFor(m.level + 1) - m.exp)]];
        rows.forEach(([k, v], i) => { text(k, 104, 9 + i * 12); text(String(v), 180, 9 + i * 12); });
        box(2, 108, 236, 50);
        m.moves.forEach((mv, i) => {
          const M = D.moves[mv.id];
          const x = 10 + (i % 2) * 116, y = 115 + Math.floor(i / 2) * 20;
          text(M.name, x, y);
          ctx.fillStyle = TYPE_COLOR[M.type]; ctx.fillRect(x, y + 10, 4, 6);
          text(`${mv.pp}/${M.pp} PP`, x + 8, y + 10, "#606060", null);
        });
        if (d.evo) text(`Evolves at Lv${d.evo[0]}`, 104, 98, "#806020", null);
        text("INFO >", 184, 150, "#806040", null);
      },
    });
  });
}

// Wildmon-Dex: every species in the game, with lore and where to find the ones you've seen.
function monsterLog() {
  const all = Object.keys(D.monsters);
  return new Promise((res) => {
    push({
      opaque: true, i: 0, top: 0, open: false,
      update() {
        if (this.open) { if (consume("a") || consume("b") || consume("left") || consume("right")) this.open = false; return; }
        const n = all.length;
        if (consume("up")) this.i = (this.i + n - 1) % n;
        if (consume("down")) this.i = (this.i + 1) % n;
        if (consume("left")) this.i = Math.max(0, this.i - 9);
        if (consume("right")) this.i = Math.min(n - 1, this.i + 9);
        this.top = clamp(this.i - 4, 0, n - 9);
        if (consume("a")) this.open = true;
        if (consume("b")) { pop(this); res(); }
      },
      draw() {
        const slug = all[this.i], here = this.here || (this.here = hereList());
        if (this.open) { drawLore(slug, !!S.seen[slug] || !!S.caught[slug]); return; }
        ctx.fillStyle = "#304860"; ctx.fillRect(0, 0, VW, VH);
        box(2, 2, 236, 18, "#f0e8d0");
        text(`DEX  SEEN ${Object.keys(S.seen).length}  CAUGHT ${Object.keys(S.caught).length}/${all.length}`, 8, 7);
        for (let r = 0; r < 9; r++) {
          const k = this.top + r; if (k >= all.length) break;
          const s2 = all[k], seen = S.seen[s2] || S.caught[s2], y = 22 + r * 15;
          box(2, y, 150, 15, k === this.i ? "#fff8c0" : "#f8f8f0");
          text(String(k + 1).padStart(3, "0"), 7, y + 4, "#808080", null);
          text(seen ? D.monsters[s2].name : "-----", 36, y + 4);
          if (S.caught[s2]) { ctx.fillStyle = "#e04030"; ctx.fillRect(140, y + 5, 5, 5); }
          if (here.includes(s2)) { ctx.fillStyle = "#30a050"; ctx.fillRect(131, y + 5, 5, 5); }
        }
        box(154, 22, 84, 136, "#c8e0f0");
        const seen = S.seen[slug] || S.caught[slug];
        if (seen) drawMon(slug, "front", 164, 40);
        else { ctx.filter = "brightness(0)"; drawMon(slug, "front", 164, 40, 0.5); ctx.filter = "none"; }
        if (seen) { let tx = 160; for (const t of D.monsters[slug].types) tx += typeTag(t, tx, 112) + 2; }
        if (here.length) {
          const got = here.filter((s3) => S.seen[s3] || S.caught[s3]).length;
          ctx.fillStyle = "#30a050"; ctx.fillRect(158, 127, 5, 5);
          text(`HERE ${got}/${here.length}`, 166, 126, "#305040", null);
        }
        text("Z: INFO", 166, 137, "#506070", null);
        text("<-> PAGE", 162, 147, "#506070", null);
      },
    });
  });
}

function bagScreen(inBattle) {
  return new Promise((res) => {
    const keys = () => Object.keys(S.bag).filter((k) => S.bag[k] > 0);
    const ks = keys();
    if (!ks.length) { say("Your bag is empty.").then(() => res(null)); return; }
    choose(ks.map((k) => `${ITEMS[k].name.padEnd(13)}x${S.bag[k]}`), {
      x: 50, y: 4, w: 186, extra: (i) => {
        box(0, 112, VW, 48);
        const it = ITEMS[ks[i]];
        if (IMG["item_" + it.icon]) ctx.drawImage(IMG["item_" + it.icon], 8, 124);
        text(it.desc, 38, 130);
        box(4, 4, 44, 22); text("BAG", 12, 11);
      },
    }).then((i) => res(i < 0 ? null : ks[i]));
  });
}

async function useItemOutside() {
  const key = await bagScreen(false);
  if (!key) return;
  const it = ITEMS[key];
  if (it.ball) { await say("You can only throw that in battle at a wild monster!"); return; }
  const i = await partyScreen("pick", `Use ${it.name} on which monster?`);
  if (i < 0) return;
  const msg = applyItem(key, S.party[i]);
  await say(msg);
}
function applyItem(key, m) {
  const it = ITEMS[key];
  if (it.revive) {
    if (m.hp > 0) return "It won't have any effect.";
    m.hp = Math.floor(m.maxhp / 2); S.bag[key]--;
    return `${monName(m)} was revived!`;
  }
  if (it.heal) {
    if (m.hp <= 0 || m.hp >= m.maxhp) return "It won't have any effect.";
    const before = m.hp;
    m.hp = Math.min(m.maxhp, m.hp + it.heal); S.bag[key]--;
    return `${monName(m)} recovered ${m.hp - before} HP!`;
  }
  return "It won't have any effect.";
}

async function startMenu() {
  for (;;) {
    const opts = ["PARTY", "DEX", "BAG", "TRAINER", "SAVE", muted ? "MUSIC: OFF" : "MUSIC: ON", "CLOSE"];
    if (S.badges.includes("Volt Badge")) opts.splice(3, 0, "FLY");
    if (rider("psychic")) opts.splice(3, 0, "TELEPORT");
    const pick = opts[await choose(opts, { x: 150, y: 2, w: 88 })];
    if (pick === "FLY") { await flyMenu(); return; }
    if (pick === "TELEPORT") { await teleportMenu(); return; }
    if (pick === "PARTY") { if (S.party.length) await partyScreen("view"); else await say("You don't have any monsters yet."); }
    else if (pick === "DEX") await monsterLog();
    else if (pick === "BAG") await useItemOutside();
    else if (pick === "TRAINER") await trainerCard();
    else if (pick === "SAVE") { await say(save() ? "Game saved!" : "Couldn't save (storage blocked)."); }
    else if (pick && pick.startsWith("MUSIC")) toggleMute();
    else return;
  }
}
function trainerCard() {
  return new Promise((res) => {
    push({
      opaque: true,
      update() { if (consume("a") || consume("b")) { pop(this); res(); } },
      draw() {
        ctx.fillStyle = "#304860"; ctx.fillRect(0, 0, VW, VH);
        box(6, 6, 228, 148, "#f0e8d0");
        text("TRAINER CARD", 70, 14);
        ctx.drawImage(lookPortrait(myLook()), 64, 0, 64, 64, 160, 30, 64, 64);
        const t = Math.floor(S.time);
        const rows = [["MONEY", "$" + S.money], ["CAUGHT", `${Object.keys(S.caught).length}/${Object.keys(D.monsters).length}`],
          ["SEEN", Object.keys(S.seen).length], ["TIME", `${Math.floor(t / 3600)}:${String(Math.floor(t / 60) % 60).padStart(2, "0")}`]];
        rows.forEach(([k, v], i) => { text(k, 16, 34 + i * 14); text(String(v), 80, 34 + i * 14); });
        text("BADGES", 16, 100);
        ["Rock Badge", "Tide Badge", "Volt Badge", "Shade Badge"].forEach((b, i) => {
          const has = S.badges.includes(b);
          const x = 20 + i * 52;
          ctx.globalAlpha = has ? 1 : 0.2;
          drawMonIcon(["selket", "bigfin", "ouroboutlet", "lendos"][i], x, 110);
          ctx.globalAlpha = 1;
          text(b.split(" ")[0], x - 2, 138, has ? "#303030" : "#a09888", null);
        });
      },
    });
  });
}

// ---------------------------------------------------------------- battle
async function wildBattle(mon, extra = {}) {
  const res = await runBattle({ wild: mon, party: [mon], bg: world.map.interior ? "interior" : world.map.bg, ...extra });
  if (res !== "lose") save();
  return res;
}

async function runBattle(opts) {
  const B = new Battle(opts);
  const t = opts.trainer;
  music(opts.legendary ? "boss" : !t ? "wild" : (t.leader || t.champion) ? (world.map.fight || "boss") : "battle");
  await battleIntroWipe();
  push(B);
  let res;
  try { res = await B.run(); } finally { pop(B); }
  if (res === "lose" && opts.practice) { music(world.map.music || "town"); return res; }
  if (res === "lose") { await blackout(); return res; }
  await evolveCheck();
  music(world.map.music || "town");
  return res;
}

async function battleIntroWipe() {
  const s = push({ k: 0, update() {}, draw() {
    ctx.fillStyle = "#000";
    for (let i = 0; i < 8; i++) ctx.fillRect(i % 2 ? VW - this.k * VW : 0, i * 20, this.k * VW, 20);
  } });
  for (let i = 0; i < 2; i++) { await tween(0.08, () => { fade = 0.5; }); await tween(0.08, () => { fade = 0; }); }
  await tween(0.45, (k) => { s.k = k; });
  pop(s);
}

async function blackout() {
  await say("You have no monsters left that\ncan fight! You blacked out...");
  S.money = Math.floor(S.money / 2);
  S.party.forEach(healMon);
  const h = S.lastHeal;
  music(null);
  await warp(h.map, h.x, h.y, "up");
  await say("You rushed back to safety and\nyour monsters were healed. You\ndropped half your money.");
  save();
}

async function evolveCheck() {
  for (const m of S.party) {
    const d = D.monsters[m.slug];
    if (!m.hp || !d.evo || m.level < d.evo[0]) continue;
    await evolveScene(m, d.evo[1]);
  }
}
async function evolveScene(m, to) {
  const from = m.slug;
  const sc = push({
    opaque: true, show: from, flash: 0,
    update() {},
    draw() {
      ctx.fillStyle = "#101828"; ctx.fillRect(0, 0, VW, VH);
      for (let i = 0; i < 30; i++) {
        const a = NOW * 0.6 + i * 0.7, r = 30 + ((NOW * 40 + i * 17) % 60);
        ctx.fillStyle = "rgba(255,255,220,0.6)";
        ctx.fillRect(120 + Math.cos(a) * r, 56 + Math.sin(a) * r, 2, 2);
      }
      drawMon(this.show, "front", 88, 26);
      if (this.flash) { ctx.fillStyle = `rgba(255,255,255,${this.flash})`; ctx.fillRect(0, 0, VW, VH); }
    },
  });
  await say(`What? ${D.monsters[from].name} is evolving!`);
  let period = 0.5;
  for (let i = 0; i < 12; i++) { sc.show = i % 2 ? to : from; await wait(period); period *= 0.8; }
  await tween(0.4, (k) => { sc.flash = k; });
  sc.show = to;
  m.slug = to;
  calcStats(m);
  await tween(0.6, (k) => { sc.flash = 1 - k; });
  S.caught[to] = true; S.seen[to] = true;
  await say(`Congratulations! ${D.monsters[from].name} evolved into ${D.monsters[to].name}!`);
  pop(sc);
}

class Battle {
  constructor(o) {
    this.opaque = true;
    this.trainer = o.trainer;
    this.wild = o.wild;
    this.legendary = o.legendary;
    this.eParty = o.party;
    this.e = this.eParty[0];
    this.p = null;
    this.bg = "bg_" + (BG_FOR[o.bg] || BG_FOR.grass);
    // visual state
    this.eX = 148; this.eY = 6; this.eVis = false; this.eScale = 1; this.eAlpha = 1;
    this.pX = 20; this.pY = 46; this.pVis = false; this.pScale = 1; this.pAlpha = 1;
    this.trX = 260; this.plX = -80;
    this.eHp = this.e.hp; this.pHp = 0; this.pExp = 0;
    this.ball = null; this.showEBox = false; this.showPBox = false;
    this.participants = new Set();
  }
  update() {}
  draw() {
    const shake = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    ctx.save(); ctx.translate(shake, shake * 0.5);
    this.drawScene();
    ctx.restore();
    if (this.flash) { ctx.fillStyle = this.flash; ctx.fillRect(0, 0, VW, 112); }
    box(0, 112, VW, 48);
  }
  drawScene() {
    const bg = IMG[this.bg];
    if (bg) ctx.drawImage(bg, 8, 0, 240, 108, 0, 0, 240, 108);
    // platforms
    ctx.fillStyle = "rgba(40,60,30,0.25)";
    ctx.beginPath(); ctx.ellipse(180, 68, 40, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(54, 106, 48, 8, 0, 0, Math.PI * 2); ctx.fill();
    const tp = this.trainer && (this.trainer.rival ? lookPortrait(rivalLook()) : IMG["portrait_" + this.trainer.sprite]);
    if (tp) ctx.drawImage(tp, 64, 0, 64, 64, this.trX, 4, 64, 64);
    ctx.drawImage(lookPortrait(myLook()), 0, 0, 64, 128, this.plX, -12, 64, 128);
    if (this.eVis) drawMon(this.e.slug, "front", this.eX, this.eY, this.eAlpha, this.eScale);
    if (this.pVis && this.p) drawMon(this.p.slug, "back", this.pX, this.pY, this.pAlpha, this.pScale);
    if (this.fx) {
      // Tuxemon technique animation: a strip/grid of frames
      const f = this.fx, cols = Math.max(1, Math.floor(f.img.width / f.w)), fr = Math.min(f.frame, f.count - 1);
      const sx = (fr % cols) * f.w, sy = Math.floor(fr / cols) * f.h, sc = f.scale;
      ctx.save();
      if (f.flip) { ctx.translate(f.x, 0); ctx.scale(-1, 1); ctx.translate(-f.x, 0); }
      ctx.drawImage(f.img, sx, sy, f.w, f.h, Math.round(f.x - f.w * sc / 2), Math.round(f.y - f.h * sc / 2), f.w * sc, f.h * sc);
      ctx.restore();
    }
    if (this.ball) {
      const im = IMG.item_tuxeball;
      ctx.save(); ctx.translate(this.ball.x, this.ball.y); ctx.rotate(this.ball.r || 0);
      if (im) ctx.drawImage(im, -8, -8, 16, 16);
      ctx.restore();
    }
    if (this.showEBox) this.drawBox(this.e, 4, 4, false);
    if (this.showPBox && this.p) this.drawBox(this.p, 124, 66, true);
  }
  // Play a move's animation: ranged moves fly from the attacker, then the effect plays on the target.
  async playFx(M, mine) {
    const def = M.anim && D.fx && D.fx[M.anim], img = M.anim && IMG["fx_" + M.anim];
    const from = mine ? [52, 78] : [180, 38], to = mine ? [180, 38] : [52, 78];
    const tint = TYPE_COLOR[M.type] || "#ffffff";
    if (!def || !img) { this.flash = tint + "55"; await wait(0.12); this.flash = null; return; }
    const cols = Math.max(1, Math.floor(img.width / def.w)), rows = Math.max(1, Math.floor(img.height / def.h));
    const count = cols * rows, scale = Math.min(1.6, 84 / Math.max(def.w, def.h));
    const fx = this.fx = { img, w: def.w, h: def.h, count, frame: 0, x: from[0], y: from[1], scale, flip: !mine };
    if (!M.phys) {
      // travel
      await tween(0.28, (k) => { fx.x = from[0] + (to[0] - from[0]) * k; fx.y = from[1] + (to[1] - from[1]) * k - Math.sin(k * Math.PI) * 12; fx.frame = Math.floor(k * Math.min(3, count)); });
    }
    fx.x = to[0]; fx.y = to[1];
    const step = clamp(def.d || 0.1, 0.05, 0.1);
    for (let i = 0; i < count; i++) {
      fx.frame = i;
      if (i === Math.floor(count / 2)) this.flash = tint + "44";
      await wait(step);
      this.flash = null;
    }
    this.fx = null;
  }
  drawBox(m, x, y, mine) {
    const h = mine ? 42 : 30;
    box(x, y, 112, h, "#f8f8e0");
    text(monName(m).slice(0, 10), x + 6, y + 5);
    text("Lv" + m.level, x + 80, y + 5);
    const hp = mine ? this.pHp : this.eHp;
    text("HP", x + 6, y + 17, "#e08030", null);
    hpBar(x + 22, y + 18, 80, hp / m.maxhp);
    if (m.status) text(m.status === "burn" ? "BRN" : "PSN", x + 60, y + 5, "#c04020", null);
    if (mine) {
      text(`${Math.ceil(hp)}/${m.maxhp}`, x + 50, y + 25);
      const lo = expFor(m.level), hi = expFor(m.level + 1);
      ctx.fillStyle = "#404040"; ctx.fillRect(x + 6, y + 36, 100, 3);
      ctx.fillStyle = "#40a0e8"; ctx.fillRect(x + 6, y + 36, 100 * clamp((this.pExp - lo) / (hi - lo), 0, 1), 3);
    }
  }
  msg(s) { return say(s, { auto: 1.1 }); }

  async run() {
    const tName = this.trainer && this.trainer.name;
    if (this.trainer) {
      await tween(0.6, (k) => { this.trX = 260 - 104 * k; this.plX = -80 + 100 * k; });
      await this.msg(`${tName} wants to battle!`);
      await tween(0.4, (k) => { this.trX = 156 + 110 * k; });
      await this.sendEnemy();
    } else {
      this.eVis = true;
      await tween(0.6, (k) => { this.eX = -60 + 208 * k; this.plX = -80 + 100 * k; });
      this.showEBox = true;
      const isNew = !S.seen[this.e.slug];
      await this.msg(this.legendary ? `The legendary ${monName(this.e).toUpperCase()} appeared!` : `A wild ${monName(this.e)} appeared!`);
      if (isNew) { S.seen[this.e.slug] = true; await this.msg(`New! ${monName(this.e)} was added to your Wildmon-Dex.`); }
    }
    const first = S.party.findIndex((m) => m.hp > 0);
    await tween(0.35, (k) => { this.plX = 20 - 110 * k; });
    await this.sendPlayer(S.party[first]);

    for (;;) {
      const act = await this.chooseAction();
      if (act.type === "run") {
        if (this.trainer) { await this.msg("No! There's no running from a\ntrainer battle!"); continue; }
        const chance = clamp(0.5 + (this.p.speed - this.e.speed) / 40, 0.3, 0.98);
        if (Math.random() < chance) { await this.msg("Got away safely!"); return "run"; }
        await this.msg("Can't escape!");
        await this.enemyTurn();
      } else if (act.type === "switch") {
        await this.withdraw();
        await this.sendPlayer(S.party[act.idx]);
        await this.enemyTurn();
      } else if (act.type === "item") {
        if (ITEMS[act.key].ball) {
          const r = await this.throwBall();
          if (r === "caught") return "caught";
        } else {
          const target = S.party[act.target];
          const m = applyItem(act.key, target);
          if (target === this.p) this.pHp = this.p.hp;
          await this.msg(m);
        }
        await this.enemyTurn();
      } else {
        const eMove = this.pickEnemyMove();
        const pFirst = this.p.speed > this.e.speed || (this.p.speed === this.e.speed && Math.random() < 0.5);
        if (pFirst) {
          await this.useMove(this.p, this.e, act.move, true);
          if (this.e.hp > 0 && this.p.hp > 0) await this.useMove(this.e, this.p, eMove, false);
        } else {
          await this.useMove(this.e, this.p, eMove, false);
          if (this.e.hp > 0 && this.p.hp > 0) await this.useMove(this.p, this.e, act.move, true);
        }
      }
      await this.endOfTurn();
      const r = await this.resolveFaints();
      if (r) return r;
    }
  }

  async sendEnemy() {
    this.eVis = true; this.eX = 148; this.eScale = 0; this.eAlpha = 1;
    this.eHp = this.e.hp;
    S.seen[this.e.slug] = true;
    await this.msg(`${this.trainer.name} sent out ${monName(this.e)}!`);
    await tween(0.3, (k) => { this.eScale = k; });
    this.showEBox = true;
  }
  async sendPlayer(m) {
    this.p = m;
    this.pHp = m.hp; this.pExp = m.exp;
    this.participants.add(m);
    this.pVis = true; this.pScale = 0; this.pAlpha = 1;
    await this.msg(`Go! ${monName(m)}!`);
    await tween(0.3, (k) => { this.pScale = k; });
    this.showPBox = true;
  }
  async withdraw() {
    await this.msg(`${monName(this.p)}, come back!`);
    await tween(0.25, (k) => { this.pScale = 1 - k; });
    this.pVis = false; this.showPBox = false;
  }

  async chooseAction() {
    for (;;) {
      const c = await choose(["FIGHT", "BAG", "PARTY", "RUN"], {
        cols: 2, x: 120, y: 112, w: 120, h: 48, colW: 56, cancel: false, promptW: 104, prompt: `What will ${monName(this.p)} do?`,
      });
      if (c === 0) {
        const usable = this.p.moves.some((mv) => mv.pp > 0);
        if (!usable) { await this.msg(`${monName(this.p)} has no moves left!`); return { type: "move", move: "struggle" }; }
        const mv = await this.chooseMove();
        if (mv) return { type: "move", move: mv };
      } else if (c === 1) {
        const key = await bagScreen(true);
        if (!key) continue;
        const it = ITEMS[key];
        if (it.ball) {
          if (this.trainer) { await this.msg("You can't catch a trainer's monster!"); continue; }
          return { type: "item", key };
        }
        const t = await partyScreen("pick", `Use ${it.name} on which monster?`);
        if (t < 0) continue;
        const m = S.party[t];
        if ((it.revive && m.hp > 0) || (it.heal && (m.hp <= 0 || m.hp >= m.maxhp))) { await this.msg("It won't have any effect."); continue; }
        return { type: "item", key, target: t };
      } else if (c === 2) {
        const i = await partyScreen("switch", "Switch to which monster?");
        if (i < 0) continue;
        if (S.party[i] === this.p) { await this.msg(`${monName(this.p)} is already out!`); continue; }
        if (S.party[i].hp <= 0) { await this.msg("That monster has fainted!"); continue; }
        return { type: "switch", idx: i };
      } else if (c === 3) return { type: "run" };
    }
  }
  async chooseMove() {
    const mvs = this.p.moves;
    const i = await choose(mvs.map((mv) => ({ label: D.moves[mv.id].name.slice(0, 11), disabled: mv.pp <= 0 })), {
      cols: 2, x: 0, y: 112, w: 176, h: 48, colW: 82,
      extra: (k) => {
        box(176, 112, 64, 48);
        const mv = mvs[k], M = D.moves[mv.id];
        text(`PP ${mv.pp}/${M.pp}`, 182, 120, "#303030", null);
        typeTag(M.type, 182, 133);
        text(M.phys ? "MELEE" : "RANGED", 182, 147, "#707070", null);
      },
    });
    return i < 0 ? null : mvs[i].id;
  }

  pickEnemyMove() {
    const usable = this.e.moves.filter((mv) => mv.pp > 0);
    if (!usable.length) return "struggle";
    const scored = usable.map((mv) => ({ mv, s: Math.max(1, calcDamage(this.e, this.p, mv.id, false).dmg * D.moves[mv.id].acc) }));
    const smart = this.trainer && (this.trainer.leader || this.trainer.champion) ? 0.85 : 0.4;
    if (Math.random() < smart) return scored.sort((a, b) => b.s - a.s)[0].mv.id;
    return scored[rand(0, scored.length - 1)].mv.id;
  }

  async useMove(att, def, moveId, mine) {
    const M = moveId === "struggle" ? { name: "Struggle", type: "normal", power: 20, acc: 1, phys: true } : D.moves[moveId];
    const slot = att.moves.find((m) => m.id === moveId);
    if (slot) slot.pp--;
    const who = mine ? monName(att) : `Foe ${monName(att)}`;
    await this.msg(`${who} used ${M.name}!`);
    if (Math.random() > M.acc) { await this.msg(`${who}'s attack missed!`); return; }
    // lunge
    await tween(0.12, (k) => { if (mine) this.pX = 20 + 14 * k; else this.eX = 148 - 14 * k; });
    await tween(0.12, (k) => { if (mine) this.pX = 34 - 14 * k; else this.eX = 134 + 14 * k; });
    await this.playFx(M, mine);
    let r;
    if (moveId === "struggle") {
      r = { dmg: Math.max(1, Math.floor(((2 * att.level / 5 + 2) * 20 * att.melee / def.armour) / 50 + 2)), eff: 1, crit: false };
    } else r = calcDamage(att, def, moveId);
    if (r.eff === 0) { await this.msg("It had no effect..."); return; }
    for (let i = 0; i < 4; i++) {
      if (mine) this.eAlpha = 0.15; else this.pAlpha = 0.15;
      await wait(0.06);
      this.eAlpha = 1; this.pAlpha = 1;
      await wait(0.06);
    }
    const from = def.hp;
    def.hp = Math.max(0, def.hp - r.dmg);
    await tween(0.5, (k) => { const v = from + (def.hp - from) * k; if (mine) this.eHp = v; else this.pHp = v; });
    if (r.crit || r.eff > 1) { this.shake = 6; await wait(0.25); this.shake = 0; }
    if (r.crit) await this.msg("A critical hit!");
    if (r.eff > 1) await this.msg("It's super effective!");
    else if (r.eff < 1) await this.msg("It's not very effective...");
    if (moveId === "struggle") {
      const recoil = Math.max(1, Math.floor(att.maxhp / 8));
      att.hp = Math.max(0, att.hp - recoil);
      if (mine) this.pHp = att.hp; else this.eHp = att.hp;
      await this.msg(`${who} is hit with recoil!`);
    }
    if (def.hp > 0 && M.status && !def.status && Math.random() < Math.max(M.chance, 0.15)) {
      def.status = M.status;
      const dn = mine ? `Foe ${monName(def)}` : monName(def);
      await this.msg(M.status === "burn" ? `${dn} was burned!` : `${dn} was poisoned!`);
    }
  }

  async endOfTurn() {
    for (const [m, mine] of [[this.p, true], [this.e, false]]) {
      if (!m || m.hp <= 0 || !m.status) continue;
      const d = Math.max(1, Math.floor(m.maxhp / 8));
      const from = m.hp;
      m.hp = Math.max(0, m.hp - d);
      const who = mine ? monName(m) : `Foe ${monName(m)}`;
      await this.msg(m.status === "burn" ? `${who} is hurt by its burn!` : `${who} is hurt by poison!`);
      await tween(0.4, (k) => { const v = from + (m.hp - from) * k; if (mine) this.pHp = v; else this.eHp = v; });
    }
  }

  async enemyTurn() {
    if (this.e.hp > 0 && this.p.hp > 0) await this.useMove(this.e, this.p, this.pickEnemyMove(), false);
  }

  async resolveFaints() {
    if (this.e.hp <= 0) {
      await tween(0.35, (k) => { this.eY = 6 + 50 * k; this.eAlpha = 1 - k; });
      this.eVis = false; this.showEBox = false; this.eY = 6; this.eAlpha = 1;
      await this.msg(`${this.wild ? "Wild" : "Foe"} ${monName(this.e)} fainted!`);
      const stage = D.monsters[this.e.slug].stage;
      const EXP_RATE = 1.6; // faster leveling (requested)
      const gain = Math.floor((50 + stage * 50) * this.e.level / 7 * (this.trainer ? 1.5 : 1) * EXP_RATE);
      const alive = [...this.participants].filter((m) => m.hp > 0 && S.party.includes(m));
      for (const m of alive) await this.giveExp(m, Math.max(1, Math.floor(gain / alive.length)));
      this.participants = new Set(this.p.hp > 0 ? [this.p] : []);
      const next = this.eParty.find((m) => m.hp > 0);
      if (!next) {
        music("win");
        if (this.trainer) {
          const prize = this.eParty[this.eParty.length - 1].level * (this.trainer.leader || this.trainer.champion ? 100 : 30);
          S.money += prize;
          await tween(0.6, (k) => { this.trX = 266 - 110 * k; });
          await this.msg(`You defeated ${this.trainer.name}!`);
          await this.msg(`You got $${prize} for winning!`);
        }
        return "win";
      }
      this.e = next;
      await this.sendEnemy();
    }
    if (this.p.hp <= 0) {
      await tween(0.35, (k) => { this.pY = 46 + 50 * k; this.pAlpha = 1 - k; });
      this.pVis = false; this.showPBox = false; this.pY = 46; this.pAlpha = 1;
      await this.msg(`${monName(this.p)} fainted!`);
      this.participants.delete(this.p);
      if (!partyAlive().length) return "lose";
      let i;
      do { i = await partyScreen("forced", "Choose the next monster."); } while (S.party[i].hp <= 0);
      await this.sendPlayer(S.party[i]);
    }
    return null;
  }

  async giveExp(m, amount) {
    const active = m === this.p;
    await this.msg(`${monName(m)} gained ${amount} EXP!`);
    const target = m.exp + amount;
    while (m.exp < target) {
      const next = expFor(m.level + 1);
      const step = Math.min(target, next);
      const from = m.exp;
      if (active) await tween(0.4, (k) => { this.pExp = from + (step - from) * k; });
      m.exp = step;
      if (m.exp >= next && m.level < 100) {
        m.level++;
        calcStats(m);
        if (active) { this.pHp = m.hp; this.pExp = m.exp; }
        await this.msg(`${monName(m)} grew to Lv ${m.level}!`);
        await this.learnMoves(m);
      }
    }
  }
  async learnMoves(m) {
    for (const [lv, id] of D.monsters[m.slug].moves) {
      if (lv !== m.level || m.moves.some((x) => x.id === id)) continue;
      const name = D.moves[id].name;
      if (m.moves.length < 4) {
        m.moves.push({ id, pp: D.moves[id].pp });
        await this.msg(`${monName(m)} learned ${name}!`);
        continue;
      }
      const ok = await yesNo(`${monName(m)} wants to learn ${name}. Forget a move for it?`);
      if (!ok) { await this.msg(`${monName(m)} did not learn ${name}.`); continue; }
      const i = await choose(m.moves.map((x) => D.moves[x.id].name), { prompt: "Forget which move?" });
      if (i < 0) { await this.msg(`${monName(m)} did not learn ${name}.`); continue; }
      const old = D.moves[m.moves[i].id].name;
      m.moves[i] = { id, pp: D.moves[id].pp };
      await this.msg(`${monName(m)} forgot ${old} and learned ${name}!`);
    }
  }

  async throwBall() {
    S.bag.tuxeball--;
    await this.msg("You threw a Tuxeball!");
    this.ball = { x: 40, y: 100, r: 0 };
    await tween(0.6, (k) => {
      this.ball.x = 40 + 140 * k;
      this.ball.y = 100 - 40 * k - Math.sin(k * Math.PI) * 50;
      this.ball.r = k * 12;
    });
    this.ball.r = 0;
    await tween(0.3, (k) => { this.eScale = 1 - k; });
    this.eVis = false;
    await tween(0.25, (k) => { this.ball.y = 60 + k * 2; });
    const e = this.e, d = D.monsters[e.slug];
    const a = ((3 * e.maxhp - 2 * e.hp) * d.catch) / (3 * e.maxhp) * (e.status ? 1.5 : 1);
    const p = clamp(a / 255 * 1.6, 0.03, 1);
    const shakeP = Math.pow(p, 1 / 3);
    let shakes = 0;
    while (shakes < 3 && Math.random() < shakeP) shakes++;
    for (let i = 0; i < Math.min(shakes, 3); i++) {
      await wait(0.35);
      await tween(0.3, (k) => { this.ball.r = Math.sin(k * Math.PI * 2) * 0.5; });
    }
    await wait(0.3);
    if (shakes === 3) {
      await this.msg(`Gotcha! ${monName(e)} was caught!`);
      music("win");
      const where = addMon(e);
      this.ball = null;
      if (where === "box") await this.msg(`Your party is full. ${monName(e)} was sent to the box.`);
      return "caught";
    }
    this.ball = null;
    this.eVis = true;
    await tween(0.25, (k) => { this.eScale = k; });
    await this.msg(["Oh no! It broke free!", "Aww! It appeared to be caught!", "Argh! So close!"][Math.min(shakes, 2)]);
    return null;
  }
}

// ---------------------------------------------------------------- minimap (top-right)
const MM_COL = { T: "#2f5e2a", ",": "#3f8a34", ".": "#6db654", "=": "#d8c08a", "~": "#3a86d0", f: "#8fca5c", F: "#8a6a40", W: "#55606a", C: "#8a6a40", X: "#e05040" };
let mmCache = null;
function minimapCanvas() {
  const m = world.map;
  if (mmCache && mmCache.id === world.id) return mmCache;
  const c = document.createElement("canvas"); c.width = m.w; c.height = m.h;
  const x = c.getContext("2d");
  for (let y = 0; y < m.h; y++) for (let i = 0; i < m.w; i++) { const ch = m.grid[y][i]; x.fillStyle = m.interior && ch === "." ? "#c8c0b0" : MM_COL[ch] || "#6db654"; x.fillRect(i, y, 1, 1); }
  for (const b of m.buildings || []) {
    const B = BUILDINGS[b.type];
    x.fillStyle = { center: "#d04040", mart: "#4070d0", gym: "#d8a020" }[b.type] || "#b0a8a0";
    x.fillRect(b.x, b.y, B.tw, B.th);
    x.fillStyle = "#fff"; x.fillRect(b.door.x, b.door.y, 1, 1);
  }
  for (const e of m.exits || []) for (let i = 0; i < e.w; i++) { const [ex, ey] = exitTile(m, e, i); x.fillStyle = "#ffe066"; x.fillRect(ex, ey, 1, 1); }
  mmCache = { id: world.id, c };
  return mmCache;
}
function drawMinimap() {
  const m = world.map, p = world.player;
  const s = Math.min(64 / m.w, 50 / m.h), w = Math.round(m.w * s), h = Math.round(m.h * s);
  const x0 = VW - w - 4, y0 = 4;
  ctx.fillStyle = "rgba(16,24,20,0.75)"; ctx.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
  ctx.drawImage(minimapCanvas().c, x0, y0, w, h);
  // exit labels: short arrow toward each edge
  // player arrow
  ctx.save();
  ctx.translate(x0 + p.px * s, y0 + p.pz * s);
  ctx.rotate(-p.angle);
  ctx.fillStyle = "#ff3030"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.moveTo(0, -3.5); ctx.lineTo(2.6, 2.6); ctx.lineTo(0, 1.2); ctx.lineTo(-2.6, 2.6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  // where the exits go
  ctx.font = "8px PS";
  const near = (m.exits || []).map((e) => {
    const [ex, ey] = exitTile(m, e, Math.floor(e.w / 2));
    return { e, d: Math.hypot(ex + 0.5 - p.px, ey + 0.5 - p.pz), ex, ey };
  }).sort((a, b) => a.d - b.d)[0];
  if (near && !m.interior) {
    const label = "> " + MAPS[near.e.to].name;
    const tw = textW(label);
    ctx.fillStyle = "rgba(16,24,20,0.75)"; ctx.fillRect(VW - tw - 10, y0 + h + 4, tw + 8, 12);
    text(label, VW - tw - 6, y0 + h + 6, "#ffe066", "#000");
  }
}

// ---------------------------------------------------------------- world scene
// UP walks forward, DOWN backs up, LEFT/RIGHT steer, SHIFT sprints. Speed and turning ease
// in and out so movement feels smooth.
const WALK_SPEED = 3.2, RUN_SPEED = 5.6, TURN_SPEED = 2.9;
const worldScene = {
  opaque: true, world3d: true, turnVel: 0,
  update(dt) {
    S.time += dt;
    gateCooldown -= dt;
    const p = world.player;
    for (const n of world.npcs) if (!n.walking) { n.fx = n.x * T; n.fy = n.y * T; }
    if (world.busy) { p.speed *= Math.max(0, 1 - dt * 12); this.turnVel = 0; return; }
    if (consume("a")) { p.speed = 0; runScript(interact); return; }
    if (consume("b")) { p.speed = 0; runScript(startMenu); return; }
    if (consume("fly")) { p.speed = 0; runScript(flyMenu); return; }
    if (consume("teleport")) { p.speed = 0; runScript(teleportMenu); return; }
    for (const k of ["up", "down", "left", "right"]) pressed[k] = false;
    const turn = (held.left ? 1 : 0) - (held.right ? 1 : 0);
    this.turnVel += (turn * TURN_SPEED - this.turnVel) * Math.min(1, dt * 12);
    p.angle += this.turnVel * dt;
    const fwd = (held.up ? 1 : 0) - (held.down ? 0.55 : 0);
    const target = fwd * (held.run && fwd > 0 ? RUN_SPEED : WALK_SPEED);
    p.speed += (target - p.speed) * Math.min(1, dt * (target ? 9 : 14));
    if (Math.abs(p.speed) < 0.02) p.speed = 0;
    p.dir = dirFromAngle(p.angle);
    if (p.speed) {
      const step = p.speed * dt;
      // sub-step so fast movement never skips a tile
      const n = Math.ceil(Math.abs(step) / 0.2);
      for (let i = 0; i < n && !world.busy; i++) movePlayer(-Math.sin(p.angle) * step / n, -Math.cos(p.angle) * step / n);
    }
  },
  draw() {
    drawMinimap();
    if (world.bubble) {
      const n = world.bubble;
      const s = World3D.project(n.fx / T, n.fy / T, 1.9);
      if (s) { box(s.x - 7, s.y - 14, 14, 15, "#fff"); text("!", s.x - 3, s.y - 10, "#e03020", null); }
    }
    if (this.banner && NOW - this.banner.t < 2.2) {
      const k = Math.min(1, (NOW - this.banner.t) * 4, (2.2 - (NOW - this.banner.t)) * 4);
      box(4, -26 + 30 * k, textW(this.banner.name) + 16, 20, "#f8f0d8");
      text(this.banner.name, 12, -20 + 30 * k);
    }
  },
  render3d(dt) {
    const m = world.map;
    const solid = (x, y) => {
      if (x < 0 || y < 0 || x >= m.w || y >= m.h) return !!m.interior;
      return m.grid[y][x] === "W" || m.grid[y][x] === "T" || world.solid.has(x + "," + y) || world.doors.some((b) => b.door.x === x && b.door.y === y);
    };
    const look = myLook();
    World3D.render({ player: world.player, npcs: world.npcs, statues: world.statues, interior: !!m.interior, solid, look: { model: MODEL_FOR.player[look.gender], outfit: look.color } }, dt, NOW);
  },
};

// ---------------------------------------------------------------- title
function titleScene(hasSave) {
  return new Promise((res) => {
    const showcase = ["agnite", "krokivip", "anoleaf", "rockitten", "fluoresfin", "eaglace"];
    const sc = push({
      opaque: true,
      update() {},
      draw() {
        ctx.drawImage(IMG.bg_forest_background, 8, 0, 240, 108, 0, 0, 240, 108);
        ctx.fillStyle = "#3c6c38"; ctx.fillRect(0, 108, 240, 52);
        const k = Math.floor(NOW / 2.5) % showcase.length;
        drawMon(showcase[k], "front", 88, 38 + Math.sin(NOW * 3) * 2);
        ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(0, 6, 240, 30);
        ctx.font = "24px PS"; ctx.textBaseline = "top";
        ctx.fillStyle = "#203010"; ctx.fillText("WILDMON", 39, 11);
        ctx.fillStyle = "#f8d848"; ctx.fillText("WILDMON", 36, 8);
        text("Art: Tuxemon + Kenney (CC)", 8, 150, "#d8e8c8", "#203010");
      },
    });
    const items = hasSave ? ["CONTINUE", "NEW GAME"] : ["NEW GAME"];
    choose(items, { x: 80, y: 104, w: 84, cancel: false }).then(async (i) => {
      const cont = hasSave && i === 0;
      if (!cont && hasSave && !(await yesNo("Start over? Your old save will be erased when you save."))) {
        pop(sc); res(titleScene(hasSave)); return;
      }
      pop(sc);
      res(cont ? "continue" : "new");
    });
  });
}

// ---------------------------------------------------------------- boot
let last = 0;
function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0);
  last = ts;
  step(dt);
  requestAnimationFrame(frame);
}
// one game frame (also driven by tests through window.__game.tick when the tab is hidden)
function step(dt) {
  NOW += dt;
  updateTweens(dt);
  const top = scenes[scenes.length - 1];
  if (top && top.update) top.update(dt);
  for (const k in pressed) pressed[k] = false;
  let start = 0;
  for (let i = scenes.length - 1; i >= 0; i--) if (scenes[i].opaque) { start = i; break; }
  ctx.clearRect(0, 0, VW, VH);
  const base = scenes[start];
  if (base && base.world3d) base.render3d(dt);
  else if (base && !base.world3d) { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, VW, VH); }
  for (let i = start; i < scenes.length; i++) scenes[i].draw();
  drawWarpFx();
  if (fade > 0) { ctx.fillStyle = `rgba(0,0,0,${fade})`; ctx.fillRect(0, 0, VW, VH); }
}

async function boot() {
  const loading = { opaque: true, k: 0, update() {}, draw() {
    ctx.fillStyle = "#203020"; ctx.fillRect(0, 0, VW, VH);
    ctx.fillStyle = "#fff"; ctx.fillRect(40, 78, 160 * this.k, 4);
    ctx.strokeStyle = "#fff"; ctx.strokeRect(39.5, 77.5, 161, 5);
  } };
  push(loading);
  requestAnimationFrame(frame);
  await loadAssets((k) => { loading.k = k; });
  pop(loading);
  World3D.init(document.getElementById("screen"), IMG);
  resize();
  prepWorld();
  const saved = loadSave();
  const choice = await titleScene(!!saved);
  S = choice === "continue" ? migrateSave(saved) : newState();
  if (!S.look) { await characterCreator(); }
  push(worldScene);
  loadMap(S.map, S.x, S.y, S.dir);
  if (tileAt(S.x, S.y) === "~") {
    const m = rider("water");
    if (m) { world.player.mount = m.slug; world.player.surfing = true; } else loadMap(S.lastHeal.map, S.lastHeal.x, S.lastHeal.y, "up");
  }
  if (!S.starter) {
    runScript(async () => {
      await wait(0.4);
      await say("Prof. Oakley: Welcome to my lab! The world is full of wild monsters, so first you need a partner of your own.");
      await professor();
      await say("CONTROLS: UP walks forward, LEFT and RIGHT turn, DOWN turns around. Z talks, X opens the menu, SHIFT runs.");
    });
  }
}
window.__game = { world, get S() { return S; }, D, MAPS, scenes, warp, makeMon, trainerSees, readyFor, wildBattle, starterSelect, monsterLog, summary, tick: (n = 1, dt = 1 / 30) => { for (let i = 0; i < n; i++) step(dt); } };
boot();
