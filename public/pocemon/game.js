"use strict";
// Pocemon: a monster-catching RPG built on Tuxemon's open art.
const D = window.GAME_DATA;
// One type per pocemon: its first. A second type in the data only nudges damage a little (see typeEff).
function singleTypes(data) {
  for (const m of Object.values(data.monsters)) if (m.types.length > 1) { m.subtype = m.types[1]; m.types = [m.types[0]]; }
}
singleTypes(D);
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
  egg: { name: "Egg", key: true, icon: "ancient_egg", desc: "From the Day Care. It hatches as you walk." },
  revive: { name: "Revive", price: 1000, revive: true, icon: "revive", desc: "Revives a fainted pocemon." },
  tuxeball: { name: "Poceball", price: 200, ball: 1, icon: "tuxeball", desc: "Catches wild pocemon." },
  great_ball: { name: "Great Ball", price: 600, ball: 1.8, icon: "great_ball", desc: "A better chance to catch." },
  mega_potion: { name: "Mega Potion", price: 1500, heal: 200, icon: "mega_potion", desc: "Restores 200 HP." },
  full_heal: { name: "Full Heal", price: 400, cure: true, icon: "full_heal", desc: "Cures sleep, paralysis, burns and poison." },
  // held items: give one to a monster from its PARTY menu (ITEM); it works on its own in battle
  apple: { name: "Apple", price: 300, hold: true, icon: "apple", desc: "Held: eaten at half HP to restore 1/3 of its HP. Used up." },
  elixir: { name: "Elixir", price: 800, hold: true, icon: "elixir", desc: "Held: cures the first status it gets. Used up." },
  exp_candy: { name: "Sweet Candy", price: 3000, hold: true, minBadges: 3, icon: "exp_candy", desc: "Held: the holder gets 50% more EXP." },
  // one berry per type: held, that type's moves hit 20% harder
  ...Object.fromEntries(["fire", "water", "wood", "earth", "lightning", "frost", "sky", "venom", "normal", "heroic", "steel", "dark", "psychic"].map((t) => [
    "berry_" + t, { name: t[0].toUpperCase() + t.slice(1) + " Berry", price: 1500, hold: true, boost: t, minBadges: 2, icon: "berry_" + t,
      desc: `Held: its ${t.toUpperCase()} moves do 20% more damage.` }])),
  // prizes and rewards (not sold)
  master_ball: { name: "Master Ball", ball: 255, icon: "master_ball", desc: "Catches any pocemon, every time." },
  sweet_sand: { name: "Sweet Sand", lure: 150, icon: "sweet_sand", desc: "For 150 steps: more pocemon, rarer ones and shinies." },
  level_treat: { name: "Level Treat", treat: true, icon: "level_treat", desc: "A pocemon that eats it gains a level." },
  // key items: kept forever, used from the bag or automatically
  fishing_rod: { name: "Fishing Rod", key: true, icon: "fishing_rod", desc: "Face water and press Z to fish." },
  lucky_bamboo: { name: "Lucky Bamboo", key: true, icon: "lucky_bamboo", desc: "Shiny pocemon appear 3x as often." },
  saddle: { name: "Ride Pass", key: true, icon: "gold_pass", desc: "Press R (or RIDE in the menu) to ride your lead pocemon outdoors, twice as fast as walking." },
  lucky_horseshoe: { name: "Lucky Horseshoe", key: true, icon: "horseshoe", desc: "The reward for a complete Pocedex: shiny pocemon appear twice as often again." },
  toy_bear: { name: "Toy Bear", key: true, icon: "toy_bear", desc: "A well-loved teddy. Someone misses it." },
  ancient_egg: { name: "Ancient Egg", key: true, icon: "ancient_egg", desc: "Warm to the touch. Bring it to Prof. Oakley." },
  flute: { name: "Old Flute", key: true, icon: "flute", desc: "A wooden flute from Hollowmere." },
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
  // Desktop: whole-pixel scale. Phone: fill the width (or the height in landscape) and leave room for the
  // on-screen controls; the canvas renders at a crisp whole scale and is sized down to fit.
  const touch = document.body.classList.contains("touch"), land = document.body.classList.contains("landscape");
  const fit = touch ? Math.min((innerWidth - (land ? 330 : 8)) / VW, (innerHeight - (land ? 12 : 230)) / VH)
    : Math.max(1, Math.floor(Math.min((innerWidth - 16) / VW, (innerHeight - 48) / VH)));
  SCALE = Math.max(1, Math.ceil(fit));
  cv.width = VW * SCALE; cv.height = VH * SCALE;
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;
  const scr = document.getElementById("screen"), w = Math.round(VW * fit), h = Math.round(VH * fit);
  scr.style.width = w + "px"; scr.style.height = h + "px";
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
// Sound effects (Tuxemon's sound library, see sfx.js): interface sounds by name, each pocemon's own cries,
// and each move's sound.
const sfx = (k, vol = 0.7, rate = 1) => window.SFX && HouseDJ.sfx(SFX.ui[k] || k, vol, rate);
function cry(slug, faint) {
  const c = window.SFX && SFX.cry[slug], n = c && (faint ? c[1] || c[0] : c[0]);
  if (n) HouseDJ.sfx(n, 0.8, faint ? 0.85 : 1);
}
function moveSfx(id) { if (window.SFX) HouseDJ.sfx(SFX.move[id] || SFX.ui.hit, 0.7); }

function npcSpritesUsed() {
  const s = new Set(["adventurer", "heroine"]);
  for (const m of Object.values(MAPS)) for (const n of m.npcs || []) s.add(n.sprite);
  return [...s];
}
async function loadAssets(progress) {
  const jobs = [
    ["tiles", "assets/tiles/Basic_Buch_Tiles_Compiled.png"], ["buildings", "assets/tiles/core_buildings.png"],
    ["floors", "assets/tiles/floorsandwalls.png"], ["sign", "assets/obj/sign.png"], ["tuxeball", "assets/obj/tuxeball.png"],
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
  for (const [t, f] of Object.entries(TYPE_ICON)) jobs.push(["type_" + t, `assets/types/${f}_small.png`]);
  let done = 0;
  await Promise.all(jobs.map(([k, s]) => loadImg(k, s).then(() => progress(++done / jobs.length / 2))));
  await HouseDJ.load("assets/drums/");
  await World2D.load("assets/tiles/", (k) => progress(0.5 + k / 2));
  await document.fonts.load("8px PS");
}

// ---------------------------------------------------------------- input
const held = {}, pressed = {};
const KEYMAP = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  KeyW: "up", KeyS: "down", KeyA: "left", KeyD: "right",
  KeyZ: "a", Enter: "a", Space: "a", KeyX: "b", Escape: "b", Backspace: "b",
  ShiftLeft: "run", ShiftRight: "run", KeyM: "mute", KeyF: "fly", KeyT: "teleport", KeyR: "ride",
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
// Tuxemon element icons (12x12); Dragon has no Tuxemon icon, so it uses the Aether symbol on a dragon-purple chip.
const TYPE_ICON = { fire: "fire", water: "water", wood: "wood", earth: "earth", lightning: "lightning", frost: "frost",
  sky: "sky", venom: "venom", normal: "normal", heroic: "heroic", steel: "metal", dark: "shadow", psychic: "cosmic", dragon: "aether" };
function typeIcon(type, x, y) {
  const im = IMG["type_" + type];
  if (type === "dragon" || !im) { ctx.fillStyle = TYPE_COLOR[type] || "#888"; ctx.fillRect(x, y, 12, 12); }
  if (im) ctx.drawImage(im, x, y, 12, 12);
  return 12;
}
// icons right after a name, or tucked under it at the panel's right edge when the name is long
function nameIcons(slug, name, x, y, right) {
  const w = D.monsters[slug].types.length * 13 - 1;
  if (x + textW(name) + 2 + w <= right) typeIcons(slug, x + textW(name) + 2, y - 2);
  else typeIcons(slug, right - w, y + 10);
}
// a monster's type icons in a row (every monster has 1 or 2 types); returns the width used
function typeIcons(slug, x, y) {
  const ts = D.monsters[slug].types;
  ts.forEach((t, i) => typeIcon(t, x + i * 13, y));
  return ts.length * 13 - 1;
}
function typeTag(type, x, y) {
  const w = textW(type.toUpperCase()) + 4;
  ctx.fillStyle = TYPE_COLOR[type] || "#888"; ctx.fillRect(x, y, w, 10);
  text(type.toUpperCase(), x + 2, y + 1, "#fff", null);
  return w;
}
// What a move does, in plain words: type, melee or ranged (which stats it pits against each other), power,
// how often it really hits for your side, PP, its burn/poison chance, the same-type bonus (the x1.5 chip), and
// (in battle) how it fares against the foe in front of you. compact = one short line, for stacked cards.
function fxFacts(M) { // what a move's extra effect does, as short phrases
  const fx = M.fx || {}, out = [], st = (o) => Object.entries(o).map(([k, d]) => `${STAT_NAME[k]} ${d > 0 ? "+" : ""}${d}`).join(" ");
  if (fx.self) out.push(`Raises its ${st(fx.self)}`);
  if (fx.foe) out.push(`${fx.chance != null && fx.chance < 1 ? Math.round(fx.chance * 100) + "%: " : ""}their ${st(fx.foe)}`);
  if (fx.heal) out.push(`Heals ${Math.round(fx.heal * 100)}% of its HP`);
  if (fx.inflict === "sleep") out.push("SLEEP: foe skips 1-3 turns");
  if (fx.inflict === "para") out.push("PARALYSIS: half speed, 1 in 4 turns lost");
  if (fx.first) out.push("Always strikes first");
  return out;
}
function moveFacts(m, id, foe, compact) {
  const M = D.moves[id], lines = [];
  const st = M.status ? `${Math.round(Math.max(M.chance, 0.15) * 100)}% to ${M.status === "burn" ? "BURN" : "POISON"}` : "";
  const fx = fxFacts(M);
  if (compact) return [M.power ? (M.phys ? "MELEE vs ARMOUR" : "RANGED vs DODGE") + (st ? ", " + st.replace(" to ", " ") : fx.length ? ", " + fx[0] : "") : fx[0]];
  if (M.power) lines.push(M.phys ? "Its MELEE vs their ARMOUR" : "Its RANGED vs their DODGE");
  if (st) lines.push(st + ": -1/8 HP a turn");
  lines.push(...fx);
  if (M.fx && (M.fx.self || M.fx.foe)) lines.push("Each stage: +1 = x1.5, +2 = x2, -1 = x0.67");
  if (foe) {
    const eff = typeEff(M.type, foe.slug);
    if (!M.power) { if (M.fx && M.fx.inflict && foe.status) lines.push(`${monName(foe)} already has a status: fails`); return lines; }
    const share = foe.hp > 0 ? calcDamage(m, foe, id, false).dmg / foe.hp : 0;
    const vs = eff >= 1.5 ? "SUPER x2" : eff <= 0.6 ? "WEAK x0.5" : "NORMAL x1"; // a hidden second type only nudges it
    lines.push(eff === 0 ? `NO EFFECT on ${monName(foe)}` : `${vs}: ` + (share >= 1 ? "can KO it" : `~${Math.max(1, Math.round(share * 100))}% of its HP`));
  }
  return lines;
}
const CARD_W = 236;
function moveCardH(m, id, { foe = null, title = null, compact = false } = {}) {
  return 34 + (title ? 10 : 0) + moveFacts(m, id, foe, compact).reduce((n, l) => n + wrap(l, CARD_W - 14).length, 0) * 10;
}
function drawMoveCard(m, id, x, y, o = {}) {
  const { foe = null, title = null, pp = null, compact = false } = o;
  const M = D.moves[id], w = CARD_W, h = moveCardH(m, id, o);
  box(x, y, w, h);
  let cy = y + 6;
  if (title) { text(title, x + 8, cy, "#707070", null); cy += 10; }
  let nx = x + 8 + typeTag(M.type, x + 8, cy) + 3;
  if (M.power && D.monsters[m.slug].types.includes(M.type)) { // same type as the monster: x1.5 damage
    ctx.fillStyle = "#d4a020"; ctx.fillRect(nx, cy, textW("x1.5") + 4, 10); text("x1.5", nx + 2, cy + 1, "#fff", null); nx += textW("x1.5") + 7;
  }
  const cat = !M.power ? "SUPPORT" : M.phys ? "MELEE" : "RANGED", cx = x + w - 12 - textW(cat);
  ctx.fillStyle = !M.power ? "#4a8a4a" : M.phys ? "#b05a30" : "#3a70b0"; ctx.fillRect(cx, cy, textW(cat) + 4, 10);
  text(cat, cx + 2, cy + 1, "#fff", null);
  let nm = M.name; while (nm.length > 3 && nx + textW(nm) > cx - 3) nm = nm.slice(0, -1);
  text(nm, nx, cy + 1);
  cy += 13;
  const selfOnly = !M.power && M.fx && (M.fx.self || M.fx.heal);
  text(`POW ${M.power || "-"}  HIT ${selfOnly ? "-" : Math.round(hitChance(M.acc, true) * 100) + "%"}  PP ${pp == null ? M.pp : pp}/${M.pp}`, x + 8, cy, "#303030", null);
  cy += 11;
  for (const l of moveFacts(m, id, foe, compact)) for (const part of wrap(l, w - 14)) { text(part, x + 8, cy, "#505050", null); cy += 10; }
  return h;
}
// show a move card above whatever else is on screen until the promise settles
async function withMoveCards(cards, fn) {
  const sc = push({ update() {}, draw() { let y = 2; for (const c of cards) y += drawMoveCard(c.m, c.id, 2, y, c) + 2; } });
  try { return await fn(sc); } finally { pop(sc); }
}
// Learning a move: if there's room it's learned; otherwise you see what it does (and what each old move does)
// before deciding what to forget. tell() shows a message (battle box or overworld box).
async function offerMove(m, id, tell) {
  const name = D.moves[id].name;
  if (m.moves.length < 4) {
    m.moves.push({ id, pp: D.moves[id].pp });
    await withMoveCards([{ m, id, title: "NEW MOVE" }], () => tell(`${monName(m)} learned ${name}!`));
    return;
  }
  const card = { m, id, title: `NEW MOVE FOR ${monName(m).toUpperCase()}` };
  const big = { ...card }; // full explanation while you decide; two compact cards while you pick what to forget
  card.compact = true;
  const ok = await withMoveCards([big], () => yesNo(`${monName(m)} wants to learn ${name}. Forget a move for it?`));
  if (!ok) { await tell(`${monName(m)} did not learn ${name}.`); return; }
  const cmp = { m, id: m.moves[0].id, pp: m.moves[0].pp, title: "FORGET THIS ONE?", compact: true };
  const i = await withMoveCards([card, cmp], () => choose([...m.moves.map((x) => D.moves[x.id].name.slice(0, 12)), "KEEP ALL"], {
    cols: 2, x: 0, y: 112, w: 240, h: 48, colW: 116,
    onMove: (k) => { const old = m.moves[k]; if (old) Object.assign(cmp, { id: old.id, pp: old.pp, title: "FORGET THIS ONE?" }); else Object.assign(cmp, { id, pp: null, title: "KEEP ALL: SKIP THE NEW MOVE" }); },
  }));
  if (i < 0 || i >= m.moves.length) { await tell(`${monName(m)} did not learn ${name}.`); return; }
  const old = D.moves[m.moves[i].id].name;
  m.moves[i] = { id, pp: D.moves[id].pp };
  await tell(`${monName(m)} forgot ${old} and learned ${name}!`);
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
// Shiny monsters: the same Tuxemon sprite with its colours swung round the colour wheel.
const SHINY_ODDS = 200; // 1 in 200 wild monsters (Lucky Bamboo x3, Sweet Sand x2)
function shinyImg(slug) {
  const key = "shiny_" + slug;
  if (IMG[key]) return IMG[key];
  const src = IMG["mon_" + slug];
  if (!src) return null;
  const c = document.createElement("canvas"); c.width = src.width; c.height = src.height;
  const g = c.getContext("2d"); g.drawImage(src, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), px = d.data;
  for (let i = 0; i < px.length; i += 4) {
    if (!px[i + 3]) continue;
    let r = px[i] / 255, gg = px[i + 1] / 255, b = px[i + 2] / 255;
    const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), l = (mx + mn) / 2, dd = mx - mn;
    if (dd < 0.04) continue; // greys, black outlines and whites stay put
    let h = mx === r ? ((gg - b) / dd) % 6 : mx === gg ? (b - r) / dd + 2 : (r - gg) / dd + 4;
    const sat = dd / (1 - Math.abs(2 * l - 1));
    h = (h * 60 + 150) % 360;
    const C = (1 - Math.abs(2 * l - 1)) * Math.min(1, sat * 1.15), X = C * (1 - Math.abs(((h / 60) % 2) - 1)), m0 = l - C / 2;
    const [r1, g1, b1] = h < 60 ? [C, X, 0] : h < 120 ? [X, C, 0] : h < 180 ? [0, C, X] : h < 240 ? [0, X, C] : h < 300 ? [X, 0, C] : [C, 0, X];
    px[i] = (r1 + m0) * 255; px[i + 1] = (g1 + m0) * 255; px[i + 2] = (b1 + m0) * 255;
  }
  g.putImageData(d, 0, 0);
  return (IMG[key] = c);
}
function rollShiny() {
  const odds = SHINY_ODDS / ((S.bag.lucky_bamboo ? 3 : 1) * (S.bag.lucky_horseshoe ? 2 : 1) * (S.lure > 0 ? 2 : 1));
  return Math.random() < 1 / odds;
}
function wildMon(slug, lv) { const m = makeMon(slug, lv); if (rollShiny()) m.shiny = true; return m; }
function drawStar(x, y, col = "#ffd030") {
  ctx.fillStyle = col; ctx.fillRect(x + 2, y, 1, 5); ctx.fillRect(x, y + 2, 5, 1); ctx.fillRect(x + 1, y + 1, 3, 3);
}
function drawMon(slug, which, x, y, alpha = 1, scale = 1, shiny = false) {
  const im = shiny ? shinyImg(slug) : IMG["mon_" + slug];
  if (!im) return;
  ctx.globalAlpha = alpha;
  const sx = which === "back" ? 64 : 0;
  const s = 64 * scale;
  ctx.drawImage(im, sx, 0, 64, 64, Math.round(x + (64 - s) / 2), Math.round(y + (64 - s)), s, s);
  ctx.globalAlpha = 1;
}
function drawMonIcon(slug, x, y, shiny = false) {
  const im = shiny ? shinyImg(slug) : IMG["mon_" + slug];
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
    const allRows = Math.ceil(items.length / cols);
    // long one-column lists (a mart's stock) scroll, showing up to 10 rows at a time
    const rows = cols === 1 ? Math.min(allRows, o.maxRows || 10) : allRows;
    const w = o.w || colW * cols + 14;
    const h = o.h || rows * rowH + 10;
    const x = o.x ?? VW - w;
    const y = o.y ?? (o.prompt ? 112 - h : VH - h);
    push({
      i: o.start || 0, opened: NOW, top: 0,
      update() {
        // a press made while mashing through the text before this menu appeared doesn't pick anything
        if (NOW - this.opened < 0.25) { consume("a"); consume("b"); }
        const r = Math.floor(this.i / cols), c = this.i % cols;
        const was = this.i;
        if (consume("up") && r > 0) this.i -= cols;
        if (consume("down") && this.i + cols < items.length) this.i += cols;
        if (consume("left") && c > 0) this.i--;
        if (consume("right") && c < cols - 1 && this.i + 1 < items.length) this.i++;
        if (this.i !== was) sfx("cursor", 0.35);
        if (o.onMove) o.onMove(this.i);
        if (consume("a")) {
          const it = items[this.i];
          if (it && it.disabled) return;
          sfx("confirm", 0.5); pop(this); res(this.i);
        } else if (consume("b") && o.cancel !== false) { sfx("back", 0.5); pop(this); res(-1); }
      },
      draw() {
        if (o.prompt) { box(0, 112, VW, 48); wrap(o.prompt, o.promptW || VW - 24).slice(0, 3).forEach((l, i) => text(l, 10, 120 + i * 12)); }
        box(x, y, w, h);
        if (cols === 1) this.top = clamp(this.top, this.i - rows + 1, this.i);
        labels.forEach((l, k) => {
          if (cols === 1 && (k < this.top || k >= this.top + rows)) return;
          const cx = x + 14 + (k % cols) * colW, cy = y + 6 + (Math.floor(k / cols) - (cols === 1 ? this.top : 0)) * rowH;
          text(l, cx, cy, items[k].disabled ? "#a0a0a0" : "#303030");
          if (k === this.i) cursor(cx - 9, cy);
        });
        if (cols === 1 && allRows > rows) { // more above / below
          ctx.fillStyle = "#6890b0";
          if (this.top > 0) ctx.fillRect(x + w - 12, y + 4, 5, 2);
          if (this.top + rows < allRows) ctx.fillRect(x + w - 12, y + h - 6, 5, 2);
        }
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
// how hard a move lands on a pocemon: its type's full matchup, nudged x1.1 / x0.9 by a hidden second type
function typeEff(moveType, slug) {
  const m = D.monsters[slug], k = typeMult(moveType, m.types);
  if (!m.subtype) return k;
  const v = typeMult(moveType, [m.subtype]);
  return k * (v > 1 ? 1.1 : v < 1 ? 0.9 : 1);
}
function typeMult(moveType, defTypes) {
  let k = 1;
  for (const t of defTypes) k *= (D.chart[moveType] && D.chart[moveType][t]) ?? 1;
  return k;
}
// Battle stat stages: +1 = x1.5, +2 = x2, -1 = x0.67, -2 = x0.5 (capped at +-4). They live on m.st during a
// battle and reset when a monster leaves the field. Paralysis halves speed.
const stageMult = (n) => (n >= 0 ? (2 + n) / 2 : 2 / (2 - n));
function statOf(m, k) {
  const v = m[k] * stageMult((m.st && m.st[k]) || 0);
  return k === "speed" && m.status === "para" ? v / 2 : v;
}
const STATUS_TAG = { burn: "BRN", poison: "PSN", sleep: "SLP", para: "PAR" };
const STAT_NAME = { melee: "MELEE", armour: "ARMOUR", ranged: "RANGED", dodge: "DODGE", speed: "SPEED" };
function calcDamage(att, def, moveId, roll = true) {
  const mv = D.moves[moveId];
  if (!mv.power) return { dmg: 0, eff: typeEff(mv.type, def.slug), crit: false };
  const A = statOf(att, mv.phys ? "melee" : "ranged");
  const Df = statOf(def, mv.phys ? "armour" : "dodge");
  const stab = (D.monsters[att.slug].types.includes(mv.type) ? 1.5 : 1) * (att.item && ITEMS[att.item] && ITEMS[att.item].boost === mv.type ? 1.2 : 1);
  const eff = typeEff(mv.type, def.slug);
  const crit = roll && Math.random() < 1 / 16 ? 1.5 : 1;
  const base = ((2 * att.level / 5 + 2) * mv.power * A / Df) / 50 + 2;
  const r = roll ? 0.85 + Math.random() * 0.15 : 0.92;
  return { dmg: eff === 0 ? 0 : Math.max(1, Math.floor(base * stab * eff * crit * r)), eff, crit: crit > 1 };
}
function partyAlive() { return S.party.filter((m) => m.hp > 0); }

// ---------------------------------------------------------------- player & rival looks
// You pick boy/girl and red/blue/green; your rival is always the opposite gender in a contrasting colour.
const RIVAL_COLOR = { red: "green", green: "red", blue: "gold" };
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
// the walking sprite gets the same recolour as the portrait
const lookSheet = (look) => lookPortrait(look, "npc_");
function lookPortrait(look, kind = "portrait_") {
  const sheet = look.gender === "boy" ? "adventurer" : "heroine", key = kind + sheet + look.color;
  if (portraitCache[key]) return portraitCache[key];
  const img = IMG[kind + sheet], groups = SPRITE_RECOLOR[sheet], to = THEME_2D[look.color];
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
  world.hinted = new Set();
  for (const n of ["1", "2"]) if (S.flags[`sw_${id}_${n}`]) pressSwitch(m, n);
  for (const k of Object.keys(S.flags)) { // bushes cut, rocks smashed and boulders moved stay that way
    const f = k.match(/^field_(.+)_(\d+)_(\d+)$/);
    if (f && f[1] === id && m.grid[+f[3]]) m.grid[+f[3]][+f[2]] = ".";
  }
  world.map = m; world.id = id;
  S.map = id;
  const p = world.player;
  placePlayer(x, y, dir || p.dir);
  remount();
  const [bx, by] = DIRS[OPP[p.dir]]; // the follower starts a step behind you
  world.trail = [[p.px + bx, p.pz + by], [p.px, p.pz]];
  world.npcs = (m.npcs || []).filter((n) => !(n.rival && S.flags[n.id])).map((n, i) => {
    const o = { ...n, def: n, key: id + "_" + i, fx: n.x * T, fy: n.y * T, defeated: !!(n.id && S.flags[n.id]) };
    if (o.defeated && n.aside) { // beaten Elites stand clear of their doorway
      for (const d of n.aside) { o.x += DIRS[d][0]; o.y += DIRS[d][1]; }
      o.fx = o.x * T; o.fy = o.y * T; o.dir = "left";
    }
    if (n.rival) { const rl = rivalLook(); o.name = rivalName(); o.sheet = lookSheet(rl); }
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
  for (const L of m.legends || []) {
    if (S.flags[L.id]) continue;
    if (L.needs && !(S.flags.champion && L.needs.every((sl) => S.caught[sl]))) continue; // Asudopt: Champions who caught the other 3
    world.statues.push({ ...L, kind: "legend", tiles: [[L.x, L.y]] });
  }
  world.pickups = (m.items || []).filter((it) => !S.flags[it.id] && (!it.needFlag || S.flags[it.needFlag]));
  world.flash = m.cave ? flashMon() : null;
  if (m.sleeper && !S.flags[m.sleeper.id]) world.statues.push({ ...m.sleeper, kind: "sleeper" });
  for (const st of world.statues) for (const [x, y] of st.tiles) world.solid.add(x + "," + y);
  music(areaMusic(m));
  World2D.build(m, BUILDINGS);
  World2D.snapYaw(p.angle);
  if (prevId !== id) worldScene.banner = { name: m.cave ? (world.flash ? `${monName(world.flash)} used FLASH!` : "It's pitch black...") : m.theme ? `${m.name}: ${m.theme}` : m.name, t: NOW };
}

function tileAt(x, y) {
  const m = world.map;
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return null;
  return m.grid[y][x];
}
function npcAt(x, y) { return world.npcs.find((n) => n.x === x && n.y === y); }
// how high a tile stands (glacier tiers and their ice steps); everything else is at 0
function heightAt(x, y) {
  const h = world.map.heights;
  return h && h[y] && h[y][x] != null ? h[y][x] : 0;
}
function blocked(x, y, ignorePlayer) {
  const t = tileAt(x, y);
  if (t === null || "T~FWCbkoRHPgjQSOKLUp".includes(t)) return true;
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
  p.mount = null; p.surfing = false; p.alt = 0; p.slide = null; p.riding = false;
}
// Your lead pocemon follows a step behind you along the path you walked.
function followerMon() {
  const p = world.player, m = S.party.find((x) => x.hp > 0);
  if (!m || p.mount || p.surfing || p.alt) return null;
  const spot = followerSpot();
  return spot && { slug: m.slug, shiny: m.shiny, x: spot[0], z: spot[1], right: spot[2], moving: Math.abs(p.speed) > 0.05 };
}
function trackTrail() {
  const p = world.player, tr = world.trail || (world.trail = [[p.px, p.pz]]), last = tr[tr.length - 1];
  if (Math.hypot(p.px - last[0], p.pz - last[1]) > 0.05) { tr.push([p.px, p.pz]); if (tr.length > 60) tr.shift(); }
}
function followerSpot() {
  const p = world.player, tr = world.trail || [];
  let px = p.px, pz = p.pz, left = 0.95;
  for (let i = tr.length - 1; i >= 0; i--) { // walk back along the trail a little under one tile
    const [x, z] = tr[i], d = Math.hypot(x - px, z - pz);
    if (d >= left) { const k = left / d; return [px + (x - px) * k, pz + (z - pz) * k, x < px]; }
    left -= d; px = x; pz = z;
  }
  return tr.length ? [tr[0][0], tr[0][1], false] : null;
}
// The Ride Pass (item key "saddle"): ride your lead pocemon on land outdoors (not in caves). You stay mounted across routes and
// towns, and get off by yourself indoors, in caves, or when you surf or fly.
const canRideHere = (m = world.map) => !m.interior && !m.cave && !m.walls;
const rideMon = () => S.party.find((m) => m.hp > 0);
function remount() {
  const p = world.player, m = rideMon();
  if (S.riding && S.bag.saddle && m && canRideHere() && !p.surfing) { p.riding = true; p.mount = mountKey(m); }
}
async function toggleRide() {
  const p = world.player;
  if (!S.bag.saddle) { await say("You don't have anything to ride with yet."); return; }
  if (p.riding) { S.riding = false; p.riding = false; p.mount = null; return; }
  if (p.surfing) { await say("You're already riding the waves!"); return; }
  if (!canRideHere()) { await say("There's no room to ride here. Try outdoors."); return; }
  const m = rideMon();
  if (!m) { await say("None of your pocemon can carry you right now."); return; }
  S.riding = true; remount();
  await say(`You hopped on ${monName(m)}'s back!`, { auto: 0.8 });
}
async function ranchHand(n) {
  if (S.bag.saddle) { await say(`${n.name}: How's the riding going? Press R anywhere outdoors to hop on!`); return; }
  if (!S.badges.includes("Rock Badge")) { await say(`${n.name}: I teach trainers to ride their pocemon. Beat Brack at the Ember Gym and I'll give you a RIDE PASS!`); return; }
  await say(`${n.name}: That's the ROCK BADGE! Here's your RIDE PASS. Your lead pocemon will carry you twice as fast.`);
  S.bag.saddle = 1; save();
  await say(`You received the RIDE PASS! ${ITEMS.saddle.desc}`);
}

// ---------------------------------------------------------------- riding: Surf and Fly
// Surf (Tide Badge + a Water monster) carries you across water; Fly (Volt Badge + a Sky monster)
// takes you to any town you've visited. You ride your own monster in 3D.
// what the 3D view rides: the slug, with a * when it's shiny so the model gets the shiny colours
const mountKey = (m) => m.slug + (m.shiny ? "*" : "");
const rider = (type) => S.party.find((m) => m.hp > 0 && D.monsters[m.slug].types.includes(type));
// FLASH: with the Volt Badge, a Lightning or Fire monster lights up dark caves
const flashMon = () => (S.badges.includes("Volt Badge") ? rider("lightning") || rider("fire") : null);

// Fishing: face water with the rod. Bites pull from the area's water monsters.
async function waterAction(x, y) {
  const canSurf = S.badges.includes("Tide Badge") && rider("water");
  if (S.bag.fishing_rod && !world.player.surfing) {
    const c = canSurf ? await choose(["FISH", "SURF", "CANCEL"], { prompt: "The water is calm." }) : 0;
    if (c === 1) return trySurf(x, y);
    if (c !== 0) return;
    return fish();
  }
  return trySurf(x, y);
}
async function fish() {
  const table = world.map.water;
  await say("You cast your line...");
  await wait(0.8 + Math.random() * 1.4);
  if (!table || !table.length) { await say("Nothing seems to live in this water."); return; }
  if (Math.random() > 0.72) { await say("Not even a nibble..."); return; }
  await say("Oh! A bite!");
  const pick = pickWild(table), lv = Math.max(2, rand(pick[1], pick[2]) - 1);
  await wildBattle(wildMon(wildForm(pick[0], lv), lv));
}
function pickupNear() {
  const p = world.player;
  let best = null;
  for (const it of world.pickups || []) {
    const d = Math.hypot(it.x + 0.5 - p.px, it.y + 0.5 - p.pz);
    if (d < 1.45 && (!best || d < best.d)) best = { it, d };
  }
  return best && best.it;
}
async function collect(it) {
  S.flags[it.id] = true;
  world.pickups = world.pickups.filter((x) => x !== it);
  const n = it.n || 1;
  S.bag[it.item] = (S.bag[it.item] || 0) + n;
  sfx("coin", 0.6);
  await say(`You found ${n > 1 ? n + " " : ""}${ITEMS[it.item].name.toUpperCase()}${n > 1 ? "S" : ""}!`);
  save();
}
async function trySurf(tx, ty) {
  const p = world.player;
  if (!S.badges.includes("Tide Badge")) { await say("The water is deep blue. A Water pocemon could carry you across... once you earn the TIDE BADGE."); return; }
  const m = rider("water");
  if (!m) { await say("None of your pocemon can swim. Catch a WATER-type pocemon to ride across water."); return; }
  if (!(await yesNo(`The water is calm. Ride ${monName(m)} across it?`))) return;
  p.mount = mountKey(m); p.riding = false; p.surfing = true;
  const x0 = p.px, z0 = p.pz;
  await tween(0.45, (k) => { p.px = x0 + (tx + 0.5 - x0) * k; p.pz = z0 + (ty + 0.5 - z0) * k; });
  p.x = tx; p.y = ty;
}
// Moves used outside battle: face the obstacle and press Z. Each needs a badge and a monster of the right type.
const FIELD = {
  b: { move: "CUT", badge: "Rock Badge", types: ["wood"], what: "A thorny bush blocks the way.", done: "cut the bush down" },
  k: { move: "ROCK SMASH", badge: "Volt Badge", types: ["earth", "steel"], what: "A cracked boulder blocks the way.", done: "smashed the rock to bits" },
  o: { move: "STRENGTH", badge: "Shade Badge", types: ["earth", "heroic", "normal"], what: "A huge boulder blocks the way.", done: "shoved the boulder aside" },
};
async function fieldAction(x, y) {
  const f = FIELD[tileAt(x, y)];
  const mon = S.party.find((m) => m.hp > 0 && f.types.some((t) => D.monsters[m.slug].types.includes(t)));
  if (!S.badges.includes(f.badge) || !mon) {
    const need = [!S.badges.includes(f.badge) && `the ${f.badge.toUpperCase()}`, !mon && `a ${f.types.join(" or ").toUpperCase()} pocemon in your team`].filter(Boolean);
    await say(`${f.what} It could be cleared with ${f.move}. You need ${need.join(" and ")}.`);
    return;
  }
  if (!(await yesNo(`${f.what} Use ${f.move}?`))) return;
  await say(`${monName(mon)} used ${f.move}! It ${f.done}!`);
  sfx("crumble", 0.8);
  world.map.grid[y][x] = ".";
  S.flags[`field_${world.id}_${x}_${y}`] = true;
  World2D.build(world.map, BUILDINGS); World2D.snapYaw(world.player.angle);
  save();
}
// Walking into a bush, cracked rock or boulder explains it (once per visit), so nobody has to guess to press Z.
function bumpField(dx, dz) {
  const p = world.player;
  const tx = Math.floor(p.px + Math.sign(dx) * 0.6), ty = Math.floor(p.pz + Math.sign(dz) * 0.6);
  if (!FIELD[tileAt(tx, ty)] || (tx === p.x && ty === p.y)) return;
  world.hinted = world.hinted || new Set();
  const key = world.id + "_" + tx + "_" + ty;
  if (world.hinted.has(key)) return;
  world.hinted.add(key); p.speed = 0;
  runScript(() => fieldAction(tx, ty));
}
// Gym switches: stepping on 1 opens every g gate, 2 every j gate, for good. Pressed switches show as y.
function pressSwitch(m, n) {
  const gate = n === "1" ? "g" : "j";
  for (const row of m.grid) for (let x = 0; x < row.length; x++) { if (row[x] === gate) row[x] = "."; else if (row[x] === n) row[x] = "y"; }
}
// ---------------------------------------------------------------- region map
// Where each area sits on the map panel (towns, routes, and side areas), and how they join up.
const REGION = {
  sprout: [14, 140, "town"], route1: [14, 124], ember: [14, 108, "town"], route2: [34, 108], tide: [54, 108, "town"],
  frostsea: [90, 112, "side"], icecave: [90, 96, "side"], glacierpeak: [90, 80, "side"], shrine: [14, 92, "side"], crater: [74, 84, "side"], route3: [54, 92], hollow: [34, 92, "side"], volt: [54, 76, "town"], route4: [34, 76],
  cave: [34, 60, "side"], shade: [14, 76, "town"], route5: [14, 60], verdance: [14, 44, "town"], route6: [34, 44],
  cinder: [54, 44, "town"], route7: [54, 28], ironhold: [54, 12, "town"], route8: [78, 12], prime: [102, 12, "town"],
};
const REGION_LINKS = [["cave", "route5"], ["icecave", "glacierpeak"], ["hollow", "shrine"], ["route4", "crater"], ["sprout", "route1", "ember", "route2", "tide", "route3", "volt", "route4", "shade", "route5", "verdance",
  "route6", "cinder", "route7", "ironhold", "route8", "prime"], ["tide", "frostsea", "icecave"], ["route3", "hollow"], ["route4", "cave"]];
// the outdoor area you're in (indoors counts as the town or route outside)
function regionHere() { let id = world.id; for (let i = 0; i < 4 && MAPS[id] && MAPS[id].interior && MAPS[id].out; i++) id = MAPS[id].out.map; return id; }
// species found in an area, and how many of them you've caught
function areaDex(id) {
  const W = whereFound(), all = Object.keys(D.monsters).filter((s2) => W[s2] && W[s2].maps.includes(id));
  return { all, caught: all.filter((s2) => S.caught[s2]).length };
}
function drawRegion(x0, y0, sel) {
  box(x0, y0, 120, 156, "#d8e8c8");
  const at = (id) => [x0 + 4 + REGION[id][0], y0 + 2 + REGION[id][1]];
  ctx.strokeStyle = "#8a9a70"; ctx.lineWidth = 2;
  for (const chain of REGION_LINKS) {
    ctx.beginPath(); chain.forEach((id, i) => { const [x, y] = at(id); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
  }
  const here = regionHere();
  for (const [id, [, , kind]] of Object.entries(REGION)) {
    const [x, y] = at(id), seen = !!S.flags["visited_" + id], d = areaDex(id);
    ctx.fillStyle = !seen ? "#a8b098" : kind === "town" ? "#d04830" : kind === "side" ? "#3a70b0" : "#5a8a3a";
    const r = kind === "town" ? 4 : 3;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    if (seen && d.all.length && d.caught === d.all.length) drawStar(x + 3, y - 8); // caught everything here
    if (id === sel) { ctx.strokeStyle = (NOW * 3) % 1 < 0.6 ? "#ffffff" : "#303030"; ctx.lineWidth = 1; ctx.strokeRect(x - r - 2.5, y - r - 2.5, r * 2 + 5, r * 2 + 5); }
    if (id === here && (NOW * 2) % 1 < 0.7) { ctx.fillStyle = "#ffe040"; ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill(); }
  }
}
// MAP from the menu: browse every area; see its name and how much of its Dex you've filled
function regionMap() {
  const ids = Object.keys(REGION);
  return new Promise((res) => {
    push({
      opaque: true, i: Math.max(0, ids.indexOf(regionHere())),
      update() {
        if (consume("down") || consume("left")) this.i = (this.i + ids.length - 1) % ids.length;
        if (consume("up") || consume("right")) this.i = (this.i + 1) % ids.length;
        if (consume("a") || consume("b")) { pop(this); res(); }
      },
      draw() {
        ctx.fillStyle = "#304860"; ctx.fillRect(0, 0, VW, VH);
        const id = ids[this.i], m = MAPS[id], seen = !!S.flags["visited_" + id], d = areaDex(id);
        drawRegion(2, 2, id);
        box(124, 2, 114, 156);
        wrap(seen ? m.name.toUpperCase() : "???", 100).forEach((l, k) => text(l, 130, 10 + k * 11));
        if (seen && m.theme && m.theme !== m.name) wrap(m.theme, 100).slice(0, 2).forEach((l, k) => text(l, 130, 34 + k * 10, "#606060", null));
        if (d.all.length) {
          text(`CAUGHT ${d.caught}/${d.all.length}`, 130, 60, d.caught === d.all.length ? "#a07000" : "#303030", null);
          if (seen && d.caught === d.all.length) { drawStar(130, 72); text("ALL CAUGHT!", 138, 71, "#a07000", null); }
        } else text("No wild ones", 130, 60, "#606060", null);
        if (id === regionHere()) text("YOU ARE HERE", 130, 80, "#c04020", null);
        text("< > browse", 130, 140, "#806040", null);
      },
    });
  });
}
// Type guide: browse the types with < >; for each, what its moves hit hard or barely scratch, and what hits a
// monster of that type hard or bounces off it. Read straight from the battle chart.
const TYPE_ORDER = ["normal", "fire", "water", "wood", "earth", "lightning", "frost", "sky", "venom", "heroic", "steel",
  "dark", "psychic", "dragon"];
function typeGuide(start) {
  const ts = TYPE_ORDER.filter((t) => D.chart[t]);
  const mult = (a, d) => (D.chart[a] && D.chart[a][d]) ?? 1;
  // icon + name chips that wrap onto new lines; returns the y below the last line
  const chips = (list, x, y, right) => {
    if (!list.length) { text("nothing", x, y + 2, "#909090", null); return y + 13; }
    let cx = x;
    for (const d of list) {
      const w = 14 + textW(d.toUpperCase()) + 6;
      if (cx + w > right) { cx = x; y += 13; }
      typeIcon(d, cx, y); text(d.toUpperCase(), cx + 14, y + 2, "#303030", null);
      cx += w;
    }
    return y + 14;
  };
  return new Promise((res) => {
    push({
      opaque: true, i: Math.max(0, ts.indexOf(start)),
      update() {
        if (consume("left") || consume("up")) this.i = (this.i + ts.length - 1) % ts.length;
        if (consume("right") || consume("down")) this.i = (this.i + 1) % ts.length;
        if (consume("a") || consume("b")) { pop(this); res(); }
      },
      draw() {
        ctx.fillStyle = "#304860"; ctx.fillRect(0, 0, VW, VH);
        box(2, 2, 236, 156);
        const t = ts[this.i];
        text("<", 8, 8, "#806040", null);
        typeIcon(t, 18, 6); const w = typeTag(t, 32, 7);
        text(">", 36 + w, 8, "#806040", null);
        text(`${this.i + 1}/${ts.length}`, 232 - textW(`${this.i + 1}/${ts.length}`), 8, "#909090", null);
        let y = 22;
        text("ATTACKING WITH IT", 8, y, "#806040", null); y += 11;
        text("STRONG VS", 8, y + 2, "#2a8030", null); y = chips(ts.filter((d) => mult(t, d) > 1), 82, y, 234);
        text("WEAK VS", 8, y + 2, "#a05020", null); y = chips(ts.filter((d) => mult(t, d) < 1), 82, y, 234);
        y += 3;
        text("DEFENDING AS IT", 8, y, "#806040", null); y += 11;
        text("WEAK TO", 8, y + 2, "#c03020", null); y = chips(ts.filter((a2) => mult(a2, t) > 1), 82, y, 234);
        text("TOUGH VS", 8, y + 2, "#2a6090", null); y = chips(ts.filter((a2) => mult(a2, t) < 1), 82, y, 234);
        this.bottom = y;
      },
    });
  });
}
const FLY_TOWNS = ["sprout", "ember", "tide", "volt", "shade", "verdance", "cinder", "ironhold", "prime"];
// every gym badge in order, with the monster shown for it on the trainer card
const BADGES = [["Rock Badge", "selket"], ["Tide Badge", "bigfin"], ["Volt Badge", "ouroboutlet"], ["Shade Badge", "lendos"],
  ["Leaf Badge", "moloch"], ["Blaze Badge", "eruptibus"], ["Iron Badge", "lightmare"], ["Prime Badge", "golnagi"]];
function landingSpot(id) {
  const m = MAPS[id];
  const b = (m.buildings || []).find((x) => x.type === "center") || (m.buildings || []).find((x) => x.to === "home") || m.buildings[0];
  for (const dy of [2, 1, 3]) if (!blockedAt(id, b.door.x, b.door.y + dy)) return [b.door.x, b.door.y + dy];
  return [b.door.x, b.door.y + 1];
}
// Teleport: a Psychic monster warps you instantly to any town you've visited, even from indoors.
let warpFx = 0;
// Teleport unlocks with the Shade Badge, or early by returning Old Whisper's flute in Hollowmere.
const canTeleport = () => S.badges.includes("Shade Badge") || !!S.flags.q_flute_done;
async function teleportMenu() {
  if (!canTeleport()) { await say("Your pocemon don't know how to TELEPORT yet. Earn the SHADE BADGE, or help someone in the ghost town west of Route 3."); return; }
  const m = rider("psychic");
  if (!m) { await say("You need a PSYCHIC-type pocemon in your party to teleport."); return; }
  const towns = FLY_TOWNS.filter((id) => S.flags["visited_" + id] || id === world.id);
  const i = await choose(towns.map((id) => MAPS[id].name).concat(["CANCEL"]), { x: 120, y: 4, w: 116, // the map shows where each town is
    extra: (k) => drawRegion(0, 0, towns[k]) });
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
  if (!S.badges.includes("Volt Badge")) { await say("Your pocemon can't carry you through the sky yet. Earn the VOLT BADGE first."); return; }
  const m = rider("sky");
  if (!m) { await say("You need a SKY-type pocemon in your party to fly."); return; }
  if (world.map.interior) { await say("You can't fly indoors! Head outside first."); return; }
  const towns = FLY_TOWNS.filter((id) => S.flags["visited_" + id] || id === world.id);
  const i = await choose(towns.map((id) => MAPS[id].name).concat(["CANCEL"]), { x: 120, y: 4, w: 116, // the map shows where each town is
    extra: (k) => drawRegion(0, 0, towns[k]) });
  if (i < 0 || i === towns.length) return;
  const dest = towns[i];
  p.mount = mountKey(m); p.surfing = false; p.speed = 0;
  await say(`${monName(m)} spreads its wings!`, { auto: 0.6 });
  await tween(1.3, (k) => { p.alt = 8 * k * k; });
  await fadeTo(1, 0.3);
  const [lx, ly] = landingSpot(dest);
  loadMap(dest, lx, ly, "down");
  S.flags["visited_" + dest] = true;
  p.mount = mountKey(m); p.alt = 8;
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
    const shut = g.requires ? !S.flags[g.requires] : g.flag ? !!S.flags[g.needFlag] && !S.flags[g.flag] : S.badges.length < g.badges;
    if (moveDir === (EDGE_DIR[g.block] || g.block) && x >= g.x && x < g.x + g.w && y >= g.y && y < g.y + g.h && shut) return g;
  }
  return null;
}
let gateCooldown = 0;
// distance from a point to the nearest edge of tile (tx, ty); 0 inside it
function rectDist(x, z, tx, ty) { return Math.hypot(Math.max(tx - x, 0, x - tx - 1), Math.max(ty - z, 0, z - ty - 1)); }
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
        if (gateCooldown <= 0) { gateCooldown = 2.5; runScript(() => (g.badges != null && gateGuard(g) ? guardStop(g) : say(g.text))); }
        return false;
      }
      if (p.surfing && tileAt(tx, ty) === "~" && !npcAt(tx, ty) && heightAt(tx, ty) === heightAt(p.x, p.y)) continue;
      // cliff edges (only ice steps go up or down) and solid tiles. If you're already brushing one, you may
      // still move as long as you don't push further into it, so you can never get wedged.
      if (Math.abs(heightAt(tx, ty) - heightAt(p.x, p.y)) > 0.5 || blocked(tx, ty, true)) {
        const before = rectDist(p.px, p.pz, tx, ty);
        if (before < RADIUS && rectDist(nx, nz, tx, ty) >= before) continue;
        return false;
      }
    }
  }
  return true;
}
function movePlayer(dx, dz) {
  const p = world.player;
  if (dx && freeAt(p.px + dx, p.pz, dx > 0 ? "right" : "left")) p.px += dx;
  else if (dx) bumpField(dx, 0);
  const zFree = dz && freeAt(p.px, p.pz + dz, dz > 0 ? "down" : "up");
  if (zFree) p.pz += dz;
  else if (dz) bumpField(0, dz);
  if (dz < 0 && !zFree) {
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
    if (!p.slide && tileAt(tx, ty) === "I") { // slippery floor: carry on straight until something stops you
      p.slide = Math.abs(dx) > Math.abs(dz) ? [Math.sign(dx), 0] : [0, Math.sign(dz)];
      if (p.slide[0]) p.pz = ty + 0.5; else p.px = tx + 0.5;
      p.angle = Math.atan2(-p.slide[0], -p.slide[1]); p.speed = 0;
    }
    if (p.surfing && tileAt(tx, ty) !== "~") {
      // hop fully onto the shore: stopping at its edge would leave you overlapping water you can no longer cross
      p.surfing = false; p.mount = null; p.speed = 0;
      remount();
      const x0 = p.px, z0 = p.pz;
      runScript(async () => {
        await tween(0.2, (k) => { p.px = x0 + (tx + 0.5 - x0) * k; p.pz = z0 + (ty + 0.5 - z0) * k; });
        const ev = stepEvent();
        if (ev) await ev();
      });
      return;
    }
    if (S.daycare) S.daycare.steps++;
    for (const e of S.eggs || []) e.steps++;
    const hatch = (S.eggs || []).find((e) => e.steps >= EGG_STEPS);
    const ev = hatch ? () => hatchDayCareEgg(hatch) : stepEvent();
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
  if (x < 0 || y < 0 || x >= m.w || y >= m.h || "T~FWCbkoRHPgjQSOKLUp".includes(m.grid[y][x])) return true;
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
  const sw = tileAt(p.x, p.y); // floor switches, indoors (gyms) and out (the Shrine of Origins)
  if (sw === "1" || sw === "2") return async () => {
    S.flags[`sw_${world.id}_${sw}`] = true;
    pressSwitch(m, sw);
    World2D.build(m, BUILDINGS); World2D.snapYaw(p.angle);
    await say("*CLICK* You stepped on a switch. Somewhere, a gate swung open!");
    save();
  };
  const wp = (m.warps || []).find((w) => w.x === p.x && w.y === p.y); // ladders and holes between maps
  if (wp) return () => { sfx("climb"); return warp(wp.to, wp.tx, wp.ty, wp.dir || "down"); };
  const door = world.doors.find((b) => b.door.x === p.x && b.door.y === p.y);
  if (door && door.to) {
    const inn = MAPS[door.to];
    return () => warp(door.to, Math.floor(inn.w / 2) - 1, inn.h - 2, "up");
  }
  const tr = world.npcs.find(trainerSees);
  if (tr) return () => trainerEncounter(tr, true);
  const here = tileAt(p.x, p.y), land = here === "," || (m.cave && (here === "." || here === "="));
  const table = p.surfing && here === "~" ? m.water
    : land ? m.encounters.concat(isNight() && m.night ? m.night : [], weatherNow() && m.weather.mons ? m.weather.mons : []) : null;
  if (table && S.lure > 0 && !m.interior) S.lure--;
  const lured = S.lure > 0 ? 1.6 : 1;
  if (table && table.length && partyAlive().length && Math.random() < (p.surfing ? 0.07 : (m.rate || 0.1)) * lured) {
    const pick = pickWild(table), lv = rand(pick[1], pick[2]);
    return () => wildBattle(wildMon(wildForm(pick[0], lv), lv));
  }
  return null;
}

// Wild picks never repeat a species you just met, and species you haven't logged yet turn up more,
// so every walk through the grass brings something different.
const recentWild = [];
function pickWild(table) {
  const fresh = table.filter((e) => !recentWild.includes(e[0]));
  const pool = fresh.length >= 2 ? fresh : table;
  const w = (e) => e[3] * (S.seen[e[0]] ? 1 : 2) * (S.lure > 0 && e[3] === 1 ? 3 : 1); // Sweet Sand draws out the rare ones
  let r = Math.random() * pool.reduce((a, e) => a + w(e), 0), pick = pool[0];
  for (const e of pool) { r -= w(e); if (r <= 0) { pick = e; break; } }
  recentWild.push(pick[0]);
  if (recentWild.length > Math.min(4, table.length - 2)) recentWild.shift();
  return pick;
}
// a wild monster well past its evolution level has already evolved
// Wild pocemon come in the form their level has earned: start from the family's first form and evolve
// only past each evolution level, so a final form never turns up in the grass before it could exist.
const BASE_OF = {};
function wildForm(slug, lv) {
  slug = BASE_OF[slug] || (BASE_OF[slug] = baseForm(slug));
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

async function walkNpc(n, dir, dur = 0.22) {
  n.dir = dir;
  const [dx, dy] = DIRS[dir];
  const sx = n.x * T, sy = n.y * T;
  n.walking = true;
  await tween(dur, (k) => { n.fx = sx + dx * T * k; n.fy = sy + dy * T * k; });
  n.x += dx; n.y += dy; n.walking = false;
}

// Shortest open path for an NPC to any of the goal tiles ("x,y" strings): a list of directions, or null.
function npcPath(n, goals) {
  const start = n.x + "," + n.y, prev = new Map([[start, null]]), q = [[n.x, n.y]];
  if (goals.includes(start)) return [];
  while (q.length) {
    const [x, y] = q.shift();
    for (const d of ["up", "down", "left", "right"]) {
      const [dx, dy] = DIRS[d], k = (x + dx) + "," + (y + dy);
      if (prev.has(k) || blocked(x + dx, y + dy)) continue;
      prev.set(k, [x + "," + y, d]); q.push([x + dx, y + dy]);
      if (goals.includes(k)) {
        const steps = [];
        for (let c = k; prev.get(c); c = prev.get(c)[0]) steps.unshift(prev.get(c)[1]);
        return steps;
      }
    }
  }
  return null;
}
// the guard posted at a badge gate: the nearest guard within a few tiles of it
function gateGuard(g) {
  const near = world.npcs.filter((n) => /guard/i.test(n.name) && Math.abs(n.x - g.x) + Math.abs(n.y - g.y) <= 6);
  return near.sort((a, b) => Math.abs(a.x - g.x) + Math.abs(a.y - g.y) - (Math.abs(b.x - g.x) + Math.abs(b.y - g.y)))[0];
}
// Not enough badges: the guard spots you ("!"), walks over, tells you why, walks you back a couple of steps
// from the gate, then returns to their post.
async function guardStop(g) {
  const p = world.player, n = gateGuard(g);
  p.speed = 0;
  world.bubble = n; await wait(0.6); world.bubble = null;
  const beside = ["up", "down", "left", "right"].map((d) => [p.x + DIRS[d][0], p.y + DIRS[d][1]]).filter(([x, y]) => !blocked(x, y) || (x === n.x && y === n.y)).map((t) => t.join(","));
  for (const d of npcPath(n, beside) || []) await walkNpc(n, d, 0.16);
  const toGuard = Math.abs(n.x - p.x) > Math.abs(n.y - p.y) ? (n.x > p.x ? "right" : "left") : n.y > p.y ? "down" : "up";
  await faceDir(toGuard); n.dir = OPP[toGuard];
  await say(`${n.name}: ${g.text.replace(/^GUARD:\s*/, "")}`);
  // back the way you came, the guard walking with you
  const into = EDGE_DIR[g.block] || g.block, back = OPP[into], [bx, by] = DIRS[back];
  for (let i = 0; i < 2; i++) {
    if (blocked(p.x + bx, p.y + by, true) && !(npcAt(p.x + bx, p.y + by) === n)) break;
    const gx = n.x + bx, gy = n.y + by, guardFollows = !blocked(gx, gy) || (gx === p.x && gy === p.y);
    if (npcAt(p.x + bx, p.y + by) === n) { // the guard is in the way: they step aside first
      const side = ["up", "down", "left", "right"].find((d) => d !== into && d !== back && !blocked(n.x + DIRS[d][0], n.y + DIRS[d][1]));
      if (!side) break;
      await walkNpc(n, side, 0.16);
    }
    const x0 = p.px, z0 = p.pz;
    p.dir = OPP[back]; p.angle = ANGLE[OPP[back]]; // keep facing the guard while backing up
    await Promise.all([
      tween(0.28, (k) => { p.px = x0 + bx * k; p.pz = z0 + by * k; }),
      guardFollows ? walkNpc(n, back, 0.28) : Promise.resolve(),
    ]);
    p.x += bx; p.y += by; p.px = p.x + 0.5; p.pz = p.y + 0.5;
  }
  p.dir = back; p.angle = ANGLE[back];
  // back to the post
  for (const d of npcPath(n, [n.def.x + "," + n.def.y]) || []) await walkNpc(n, d, 0.16);
  n.dir = n.def.dir;
}

// After a battle the rival heads off toward the next town (or out of the door): the shortest open path to
// that exit, a quick walk, and they're gone until the next meeting.
async function walkAway(n) {
  const m = world.map, to = n.def.leaveTo;
  const goals = [];
  if (to === "door") { for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.grid[y][x] === "X") goals.push(x + "," + y); }
  else { const e = (m.exits || []).find((x) => x.to === to); if (e) for (let i = 0; i < e.w; i++) goals.push(exitTile(m, e, i).join(",")); }
  if (!goals.length) return;
  const steps = npcPath(n, goals), end = !!steps;
  if (!steps) return;
  for (const d of steps) await walkNpc(n, d, 0.14);
  if (end) await walkNpc(n, steps[steps.length - 1] || "down", 0.14); // one more step, off the edge or out the door
  world.npcs = world.npcs.filter((x) => x !== n);
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
    await say("Prof. Oakley healed your pocemon.");
    save();
    return;
  }
  if (res === "win") {
    n.defeated = true;
    S.flags[n.id] = true;
    await say(`${n.name}: ${n.lose}`);
    if (n.rival && n.def.leaveTo) await walkAway(n);
    if (n.aside) { // back to the doorway (they walk up to you when they spot you), then out of the way
      while (n.y !== n.def.y) await walkNpc(n, n.y > n.def.y ? "up" : "down");
      while (n.x !== n.def.x) await walkNpc(n, n.x > n.def.x ? "left" : "right");
      for (const d of n.aside) await walkNpc(n, d);
      n.dir = "left";
    }
    if (n.badge && !S.badges.includes(n.badge)) {
      S.badges.push(n.badge);
      await say(`You received the ${n.badge.toUpperCase()}!`);
      if (n.badge === "Tide Badge") await say("With the TIDE BADGE, a WATER pocemon can carry you across water. Face the water and press Z to SURF!");
      if (n.badge === "Volt Badge") await say("With the VOLT BADGE, a SKY pocemon can FLY you to any town you've visited. Press F, or choose FLY in the menu!");
      if (n.badge === "Shade Badge" && !S.flags.q_flute_done) await say("With the SHADE BADGE, a PSYCHIC pocemon can TELEPORT you to any town you've visited, even from indoors. Press T!");
      const left = BADGES.length - S.badges.length;
      await say(left ? `Badges: ${S.badges.length}/${BADGES.length}. ${left} more to challenge the Champion!` : "You have all 8 badges!\nThe Champion's Hall in Prime\nCity is now open to you!");
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
function rivalStarter() { return { agnite: "kroki", krokivip: "anoleaf", kroki: "anoleaf", anoleaf: "agnite" }[S.starter] || "kroki"; }
function rivalSlug() {
  return { agnite: "leviadile", krokivip: "velocitile", kroki: "velocitile", anoleaf: "agnigon" }[S.starter] || "agnigon";
}

async function championEnding() {
  await say("Congratulations! You have defeated\nthe Champion and conquered every\ngym in the land!");
  await say(`Pocemon caught: ${Object.keys(S.caught).length}/${Object.keys(D.monsters).length}.\nThere are many more out there.\nKeep exploring, Champion!`);
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
  const it = pickupNear();
  if (it && !(look && look.n)) { await collect(it); return; }
  if (look && look.n) {
    const n = look.n;
    // they turn to face you exactly, and you face them
    n.faceYaw = Math.atan2(look.dx, look.dz);
    p.angle = Math.atan2(-look.dx, -look.dz); p.dir = dirFromAngle(p.angle); p.speed = 0;
    if (!n.walking) n.dir = OPP[p.dir];
    await talkTo(n);
    if (n.kind !== "trainer") { n.dir = n.def.dir; n.faceYaw = null; }
    return;
  }
  const [dx, dy] = DIRS[p.dir];
  let x = p.x + dx, y = p.y + dy;
  if (tileAt(x, y) === "~" && !p.surfing) { await waterAction(x, y); return; }
  if (FIELD[tileAt(x, y)]) { await fieldAction(x, y); return; }
  if (tileAt(x, y) === "Q") { await boxMenu(); return; } // the PC
  const game = { S: slotMachine, O: roulette, K: blackjack }[tileAt(x, y)]; // Game Corner machines and tables
  if (game) { if (tileAt(x, y) === "S" ? await needCoins(1) : true) await game(); return; }
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
    if (!n.defeated && !partyAlive().length) return say(`${n.name}: Come back when you have pocemon that can battle!`);
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
  if (n.role === "heal" && n.name === "Mom" && S.flags.go_see_mom && !S.flags.met_mom) return momTalk(n);
  if (n.role === "heal") return healAt(n);
  if (n.quest) return questTalk(n);
  if (n.role === "rod") return angler(n);
  if (n.role === "tower") return towerHost(n);
  if (n.role === "towershop") return towerShop(n);
  if (n.role === "shop") return shop();
  if (n.role === "daycare") return dayCare(n);
  if (n.role === "box") return boxMenu();
  if (n.role === "saddle") return ranchHand(n);
  if (n.role === "coins") return coinClerk();
  if (n.role === "prizes") return prizeClerk();
  if (n.role === "roulette") { await say("Croupier: Place your bets!"); return roulette(); }
  if (n.role === "blackjack") { await say("Dealer: Care for a hand of blackjack?"); return blackjack(); }
  if (n.role === "prof") return professor(n);
  for (const line of n.talk || []) await say(`${n.name}: ${line}`);
}

async function healAt(n) {
  await say(n.healText || "Welcome to the Healing Center!\nWe'll restore your pocemon to\nfull health.");
  await fadeTo(0.6, 0.3);
  sfx("heal", 0.8);
  await wait(0.6);
  S.party.forEach(healMon);
  await fadeTo(0, 0.3);
  const p = world.player;
  S.lastHeal = { map: world.id, x: p.x, y: p.y };
  save();
  await say("Your pocemon are fully healed!\n(Game saved.)");
}

async function shop() {
  await say("Clerk: Welcome! What can I get\nfor you?");
  const keys = Object.keys(ITEMS).filter((k) => ITEMS[k].price && S.badges.length >= (ITEMS[k].minBadges || 0));
  for (;;) {
    const i = await choose(keys.map((k) => `${ITEMS[k].name.padEnd(13)}$${ITEMS[k].price}`).concat(["DONE"]), {
      x: 60, y: 4, w: 176,
      extra: () => { box(4, 4, 52, 22); text("$" + S.money, 10, 11); }, // the full description shows when you pick an amount
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

// The PC box as a grid of pocemon: arrows move the cursor, the panel shows who it's on (picture, name, level,
// type), Z picks, X backs out. Returns the box index or -1.
function boxScreen(title) {
  const COLS = 6, ROWS = 5, CELL = 24, X0 = 6, Y0 = 20;
  return new Promise((res) => {
    push({
      opaque: true, i: 0, top: 0, opened: NOW,
      update() {
        if (NOW - this.opened < 0.25) { consume("a"); consume("b"); }
        const n = S.box.length;
        if (consume("left") && this.i % COLS > 0) this.i--;
        if (consume("right") && this.i % COLS < COLS - 1 && this.i + 1 < n) this.i++;
        if (consume("up") && this.i >= COLS) this.i -= COLS;
        if (consume("down") && this.i + COLS < n) this.i += COLS;
        const row = Math.floor(this.i / COLS);
        if (this.i !== this.last) { if (this.last != null) sfx("cursor", 0.35); this.last = this.i; }
        this.top = clamp(this.top, row - ROWS + 1, row);
        if (consume("a")) { pop(this); res(this.i); }
        else if (consume("b")) { pop(this); res(-1); }
      },
      draw() {
        ctx.fillStyle = "#304860"; ctx.fillRect(0, 0, VW, VH);
        text(`PC BOX  ${S.box.length} POCEMON`, 6, 5, "#fff", "#102030");
        box(2, 16, 152, 128);
        S.box.forEach((m, k) => {
          const r = Math.floor(k / COLS) - this.top, c = k % COLS;
          if (r < 0 || r >= ROWS) return;
          const x = X0 + c * CELL, y = Y0 + r * CELL;
          if (k === this.i) { ctx.fillStyle = "#f0d890"; ctx.fillRect(x, y, CELL, CELL); }
          drawMonIcon(m.slug, x, y, m.shiny);
        });
        const rows = Math.ceil(S.box.length / COLS);
        if (this.top > 0) { ctx.fillStyle = "#6890b0"; ctx.fillRect(146, 20, 5, 2); }
        if (this.top + ROWS < rows) { ctx.fillStyle = "#6890b0"; ctx.fillRect(146, 138, 5, 2); }
        const m = S.box[this.i];
        if (m) { // the arrow, and who it's on
          const r = Math.floor(this.i / COLS) - this.top, c = this.i % COLS;
          const ax = X0 + c * CELL + 8, ay = Y0 + r * CELL - 2 + (Math.floor(NOW * 3) % 2); // a bobbing arrow pointing down at it
          ctx.fillStyle = "#e04030"; for (let k = 0; k < 4; k++) ctx.fillRect(ax + k, ay + k, 8 - k * 2, 1);
          box(156, 16, 82, 128);
          drawMon(m.slug, "front", 165, 20, 1, 1, m.shiny);
          text(monName(m).slice(0, 9), 161, 86);
          text(`Lv${m.level}`, 161, 98, "#606060", null);
          typeIcon(D.monsters[m.slug].types[0], 161, 110);
          typeTag(D.monsters[m.slug].types[0], 175, 111);
          if (m.item) text(ITEMS[m.item].name.slice(0, 9), 161, 128, "#806020", null);
        }
        box(0, 146, VW, 14, "#f8f0d8");
        text(`${title}   Z: TAKE   X: BACK`, 6, 149);
      },
    });
  });
}
async function boxMenu() {
  for (;;) {
    const c = await choose(["DEPOSIT", "WITHDRAW", "DONE"], { prompt: `You booted up the PC. Your box holds ${S.box.length} pocemon.` });
    if (c === 0) {
      if (S.party.length <= 1) { await say("You can't deposit your last pocemon!"); continue; }
      const i = await partyScreen("pick", "Deposit which pocemon?");
      if (i >= 0) { const [m] = S.party.splice(i, 1); S.box.push(m); await say(`${monName(m)} was sent to the box.`); }
    } else if (c === 1) {
      if (!S.box.length) { await say("Your box is empty."); continue; }
      if (S.party.length >= 6) { await say("Your party is full!"); continue; }
      const i = await boxScreen("WITHDRAW");
      if (i >= 0) { const [m] = S.box.splice(i, 1); healMon(m); S.party.push(m); await say(`${monName(m)} joined your party!`); }
    } else break;
  }
}

// Pocedex prizes from Prof. Oakley: [kinds caught, item, count, how he says it]
const DEX_REWARDS = [
  [10, "great_ball", 5, "5 GREAT BALLS"], [25, "sweet_sand", 3, "3 SWEET SAND"], [50, "lucky_bamboo", 1, "the LUCKY BAMBOO"],
  [75, "level_treat", 5, "5 LEVEL TREATS"], [100, "master_ball", 1, "a MASTER BALL"],
];

// ---------------------------------------------------------------- side quests
const QUESTS = {
  teddy: { name: "Pia's lost teddy", where: "Little Pia, Ember City" },
  egg: { name: "The ancient egg", where: "Dr. Fenn, Volt City" },
  flute: { name: "Old Whisper's flute", where: "Old Whisper, Hollowmere" },
};
const questState = (q) => (S.flags["q_" + q + "_done"] ? "done" : S.flags["q_" + q + "_started"] ? "active" : "new");
async function questTalk(n) {
  const q = n.quest, st = questState(q), who = n.name;
  if (q === "teddy") {
    if (st === "done") return say(`${who}: Teddy and me go everywhere now! Thank you!`);
    if (S.bag.toy_bear) {
      delete S.bag.toy_bear; S.flags.q_teddy_done = true;
      S.bag.great_ball = (S.bag.great_ball || 0) + 5;
      await say(`${who}: My TEDDY! You found him! Here, Daddy said I could give these to whoever found him.`);
      await say("You received 5 GREAT BALLS!"); return save();
    }
    S.flags.q_teddy_started = true;
    await say(`${who}: *sniff* I lost my TOY BEAR on Route 2... I was playing way out by the east end of the woods.`);
    return say(`${who}: Can you find him? Please?`);
  }
  if (q === "egg") {
    if (st === "done") return say(`${who}: A shiny hatchling! The professor sent me pictures. Remarkable!`);
    if (st === "active") return say(`${who}: Please hurry the ANCIENT EGG to Prof. Oakley in Sprout Town. It's getting warmer!`);
    S.flags.q_egg_started = true; S.bag.ancient_egg = 1;
    await say(`${who}: You're from Sprout Town? Wonderful! We dug up this EGG in the old mine and it's starting to move.`);
    await say("You received the ANCIENT EGG!");
    return say(`${who}: Prof. Oakley will know what to do. Take it to his lab!`);
  }
  if (q === "flute") {
    if (st === "done") return say(`${who}: When I play his flute at night, the shrine glows. Thank you, child.`);
    if (S.bag.flute) {
      delete S.bag.flute; S.flags.q_flute_done = true;
      S.bag.level_treat = (S.bag.level_treat || 0) + 3;
      await say(`${who}: His flute... I never thought I'd hold it again.`);
      await say(`${who}: Take these. He baked them for his pocemon every winter.`);
      await say("You received 3 LEVEL TREATS!");
      if (!S.badges.includes("Shade Badge")) {
        await say(`${who}: And one more thing. He taught his pocemon to step between places with a song. Let me teach yours.`);
        await say("Your PSYCHIC pocemon can now TELEPORT to any town you've visited! Press T, or choose TELEPORT in the menu.");
      }
      return save();
    }
    S.flags.q_flute_started = true;
    await say(`${who}: My husband played a wooden flute every night, before the town emptied.`);
    return say(`${who}: It must still be in our old house, the one in the middle of town. Would you look for it?`);
  }
}
// ---------------------------------------------------------------- Day Care and eggs
// A monster left at the Day Care (Ember City) gains a level every 150 steps you walk (never past your strongest
// monster), for $100 a level. Every 400 steps it also leaves an EGG of its species' first form (carry up to 3),
// which hatches 250 steps later at Lv 5, with double the usual shiny odds.
const DC_STEPS_PER_LV = 150, DC_STEPS_PER_EGG = 400, EGG_STEPS = 250;
function baseForm(slug) {
  for (let changed = true; changed;) {
    changed = false;
    for (const [s2, d] of Object.entries(D.monsters)) if (d.evo && d.evo[1] === slug) { slug = s2; changed = true; break; }
  }
  return slug;
}
function dayCareGain() {
  const dc = S.daycare;
  return dc ? Math.min(Math.floor(dc.steps / DC_STEPS_PER_LV), Math.max(0, topLevel() - dc.mon.level), 100 - dc.mon.level) : 0;
}
function syncEggs() { S.eggs = S.eggs || []; if (S.eggs.length) S.bag.egg = S.eggs.length; else delete S.bag.egg; }
async function dayCare(n) {
  const who = n.name;
  const dc = S.daycare;
  if (dc) {
    const eggsDue = Math.floor(dc.steps / DC_STEPS_PER_EGG) - (dc.eggs || 0);
    S.eggs = S.eggs || [];
    if (eggsDue > 0 && S.eggs.length < 3) {
      dc.eggs = (dc.eggs || 0) + 1;
      S.eggs.push({ slug: baseForm(dc.mon.slug), steps: 0 }); syncEggs();
      await say(`${who}: Oh, there you are! We found an EGG with your ${monName(dc.mon)}. Take good care of it!`);
      await say("You received an EGG! It will hatch as you walk.");
    }
    const gain = dayCareGain(), cost = gain * 100;
    await say(`${who}: Your ${monName(dc.mon)} ${gain ? `has grown ${gain} level${gain > 1 ? "s" : ""}` : "is doing well"}.`);
    if (!(await yesNo(`Take ${monName(dc.mon)} back? ${cost ? `It's $${cost}.` : "No charge."}`))) return;
    if (S.money < cost) { await say(`${who}: You'll need $${cost}, dear.`); return; }
    if (S.party.length >= 6) { await say(`${who}: Your party is full! Make some room first.`); return; }
    S.money -= cost;
    const m = dc.mon;
    for (let i = 0; i < gain; i++) { // level up, learning new moves in place of the oldest
      m.level++;
      for (const [lv, id] of D.monsters[m.slug].moves) {
        if (lv !== m.level || m.moves.some((x) => x.id === id)) continue;
        if (m.moves.length >= 4) m.moves.shift();
        m.moves.push({ id, pp: D.moves[id].pp });
      }
    }
    m.exp = expFor(m.level); calcStats(m); healMon(m);
    S.party.push(m); S.daycare = null;
    await say(`You got ${monName(m)} back${gain ? `, now Lv ${m.level}` : ""}!`);
    save(); return;
  }
  await say(`${who}: Welcome to the DAY CARE! Leave a pocemon with me and it grows as you walk. Sometimes we even find an EGG!`);
  if (S.party.length < 2) { await say(`${who}: You'll need at least two pocemon, dear. You can't travel alone!`); return; }
  if (!(await yesNo("Leave a pocemon at the Day Care?"))) return;
  const i = await partyScreen("pick", "Leave which pocemon?");
  if (i < 0) return;
  const [m] = S.party.splice(i, 1);
  S.daycare = { mon: m, steps: 0, eggs: 0 };
  await say(`${who}: I'll take good care of ${monName(m)}. Come back any time!`);
  save();
}
async function hatchDayCareEgg(e) {
  S.eggs.splice(S.eggs.indexOf(e), 1); syncEggs();
  await say("Oh? Your EGG is moving...");
  const m = makeMon(e.slug, 5);
  if (rollShiny() || rollShiny()) m.shiny = true;
  const where = addMon(m);
  if (m.shiny) { S.shinyCaught = S.shinyCaught || {}; S.shinyCaught[m.slug] = true; }
  await say(`It hatched into ${m.shiny ? "a SHINY " : ""}${monName(m).toUpperCase()}!${where === "box" ? " (Sent to the box.)" : ""}`);
  save();
}
async function hatchEgg() {
  delete S.bag.ancient_egg; S.flags.q_egg_done = true;
  await say("Prof. Oakley: An ANCIENT EGG from Dr. Fenn? Look, it's hatching right now!");
  const m = makeMon("devidin", 10); m.shiny = true;
  const where = addMon(m);
  S.caught.devidin = true; S.seen.devidin = true;
  S.shinyCaught = S.shinyCaught || {}; S.shinyCaught.devidin = true;
  await say(`It hatched into a SHINY ${monName(m).toUpperCase()}! It's yours now.${where === "box" ? " (Sent to the box.)" : ""}`);
}
async function questLog() {
  const rows = Object.entries(QUESTS).map(([q, d]) => {
    const st = questState(q);
    return `${st === "done" ? "DONE" : st === "active" ? "...." : " ?? "}  ${st === "new" ? "???" : d.name}`;
  });
  await choose(rows.concat(["CLOSE"]), { x: 8, y: 4, w: 224, prompt: "Side quests. Talk to townspeople to find more!" });
}
async function angler(n) {
  if (!S.bag.fishing_rod) {
    await say(`${n.name}: You've got that trainer look. Ever tried fishing? Some pocemon only live under the water.`);
    S.bag.fishing_rod = 1;
    await say("You received the FISHING ROD!");
    await say(`${n.name}: Face any water and press Z to cast. Different waters, different catches!`);
    return save();
  }
  await say(`${n.name}: Patience is half of fishing. The other half is luck. Try at night, too!`);
}

// ---------------------------------------------------------------- Battle Tower (after the Champion)
const TOWER_TRAINERS = [
  ["Ace Trainer Sol", "dragonrider_green"], ["Veteran Ivy", "woodnymph"], ["Captain Moe", "riverboatcaptain"],
  ["Engineer Zia", "scientist_black"], ["Seer Ren", "magician_fiery"], ["Hexer Nyx", "goth_rose"], ["Knight Vance", "soldier"],
  ["Ranger Lia", "catgirl_green"], ["Firefighter Ash", "firefighter"], ["Witch Agatha", "witch"],
];
const TOWER_PRIZES = [["master_ball", 12], ["exp_candy", 4], ["level_treat", 3], ["mega_potion", 2], ["sweet_sand", 2], ["great_ball", 1]];
function towerTeam(streak) {
  const pool = Object.keys(D.monsters).filter((sl) => !D.monsters[sl].legendary && D.monsters[sl].stage >= 1);
  const lv = clamp(topLevel(), 40, 70) + Math.floor(streak / 3);
  const team = [];
  while (team.length < 3) { const sl = pool[rand(0, pool.length - 1)]; if (!team.some((m) => m.slug === sl)) team.push(makeMon(sl, lv)); }
  return team;
}
async function towerHost(n) {
  if (!S.flags.champion) return say(`${n.name}: Only Champions may climb the Battle Tower.`);
  S.towerBest = S.towerBest || 0; S.tp = S.tp || 0;
  await say(`${n.name}: Welcome to the BATTLE TOWER! Win in a row to earn TOWER POINTS (TP). Best streak: ${S.towerBest}. Your TP: ${S.tp}.`);
  if (!(await yesNo("Take the challenge? Your team is healed before every battle."))) return;
  let streak = 0;
  for (;;) {
    S.party.forEach(healMon);
    const [name, sprite] = TOWER_TRAINERS[rand(0, TOWER_TRAINERS.length - 1)];
    const t = { name, sprite, intro: `Battle ${streak + 1}! Let's go!`, lose: "You're on a roll!", kind: "trainer" };
    await say(`${name}: ${t.intro}`);
    const res = await runBattle({ trainer: t, party: towerTeam(streak), bg: "interior", practice: true });
    if (res !== "win") {
      await say(`${n.name}: Your streak ends at ${streak}. Well fought!`);
      break;
    }
    streak++;
    const gain = 1 + Math.floor(streak / 5);
    S.tp += gain; S.towerBest = Math.max(S.towerBest, streak);
    await say(`${n.name}: ${streak} in a row! You earned ${gain} TP (total ${S.tp}).`);
    if (!(await yesNo("Keep going?"))) { await say(`${n.name}: Retiring at a ${streak}-win streak. Come back anytime!`); break; }
  }
  S.party.forEach(healMon);
  save();
}
async function towerShop(n) {
  S.tp = S.tp || 0;
  for (;;) {
    const i = await choose(TOWER_PRIZES.map(([k, c]) => `${ITEMS[k].name.padEnd(13)}${c} TP`).concat(["DONE"]), {
      x: 60, y: 4, w: 176, extra: () => { box(4, 4, 52, 22); text(S.tp + "TP", 10, 11); },
    });
    if (i < 0 || i === TOWER_PRIZES.length) break;
    const [k, c] = TOWER_PRIZES[i];
    if (S.tp < c) { await say(`${n.name}: You need ${c} TP for that.`); continue; }
    S.tp -= c; S.bag[k] = (S.bag[k] || 0) + 1;
    await say(`You got a ${ITEMS[k].name.toUpperCase()}!`);
  }
  save();
}

// Mom's send-off: what the journey looks like and how to survive it.
async function momTalk(n) {
  const me = myLook().gender === "girl" ? "sweetheart" : "kiddo", partner = S.party[0] ? monName(S.party[0]) : "your partner";
  const lines = [
    `Oh, ${me}! The professor called. So ${partner} is your partner now? It's adorable!`,
    "Listen, before you go, here's what's ahead of you. Sit down for a second.",
    "There are 8 GYMS. First Ember City (Rock), Tide Harbor (Water), Volt City (Lightning) and Shade Hollow (Shadow).",
    "Past Shade Hollow come Verdance (Wood), Cinder Peak (Fire) and Ironhold (Steel). Last of all is the PRIME GYM in Prime City, full of dragons.",
    "With all 8 badges you can enter the Champion's Hall in Prime City. Guards won't let you through some roads until you have enough badges.",
    "Tall grass is full of wild pocemon. Every route has its own kinds, and they get tougher the farther you go.",
    "Some pocemon only come out at NIGHT. Watch the clock in the corner and go back to the grass after dark.",
    "Trainers on the routes will wait until you're a bit stronger, so train in the grass before you take them on.",
    "Use type matchups! Water beats Fire, Fire beats Wood, Wood beats Water and Earth... the little icons next to each name show their types.",
    "When your team is hurt, any Healing Center will patch them up for free. Or come home and I'll take care of them.",
    "Fill your Pocedex! Professor Oakley gives out prizes as you catch more kinds.",
    "And people say there's a ghost town west of Route 3, a pitch-dark cave north of Route 4, and a frozen sea east of Tide Harbor with a glacier you can climb. Be careful, OK?",
    "Oh, and your rival left in a hurry. I'm sure you'll run into them on the road!",
  ];
  for (const l of lines) await say(`Mom: ${l}`);
  S.bag.potion = (S.bag.potion || 0) + 5;
  S.money += 1000;
  await say("Mom gave you 5 POTIONS and $1000 for the road!");
  S.party.forEach(healMon);
  await say("Mom: Now go make me proud. Route 1 is just north of town!");
  S.flags.met_mom = true;
  save();
}

async function professor(n) {
  if (!S.starter) {
    await say("Prof. Oakley: Ah, there you are!\nToday you begin your journey as a\npocemon trainer!");
    await say("Prof. Oakley: Choose one of these\nthree pocemon as your partner.");
    const slug = await starterSelect();
    S.starter = slug;
    const m = makeMon(slug, 5);
    addMon(m);
    await say(`You received ${monName(m)}!`);
    await say("Prof. Oakley: Take these too!\nPoceballs catch wild pocemon,\nand Potions heal them.");
    await say("Prof. Oakley: Before you set off, go home and see your mom. She has a lot to tell you about the road ahead!");
    S.flags.go_see_mom = true;
    const rival = world.npcs.find((x) => x.id === "rival_lab");
    if (rival) {
      await say(`${rival.name}: Hey, that's my pick... no wait, I'll take ${D.monsters[rivalStarter()].name}! It beats yours anyway!`);
      await trainerEncounter(rival, false);
      if (world.npcs.includes(rival)) await walkAway(rival);
      world.npcs = world.npcs.filter((x) => x !== rival);
    }
    save();
    return;
  }
  if (S.bag.ancient_egg) await hatchEgg();
  const c = Object.keys(S.caught).length;
  await say(`Prof. Oakley: You've caught ${c} kinds of pocemon!`);
  for (const [need, item, n, label] of DEX_REWARDS) {
    if (c < need || S.flags["dex_" + need]) continue;
    S.flags["dex_" + need] = true;
    S.bag[item] = (S.bag[item] || 0) + n;
    await say(`Prof. Oakley: ${need} kinds! That deserves a prize. Here, take ${label}!`);
    await say(`You received ${label}!${ITEMS[item].key ? " " + ITEMS[item].desc : ""}`);
  }
  const total = Object.keys(D.monsters).length;
  if (c >= total && !S.flags.dex_all) { // every kind caught: the diploma and the horseshoe
    S.flags.dex_all = true;
    S.bag.lucky_horseshoe = 1;
    await say(`Prof. Oakley: ALL ${total} kinds?! You've completed the Pocedex! This calls for a diploma.`);
    await diploma();
    await say("Prof. Oakley: And take my LUCKY HORSESHOE. Shiny pocemon will turn up twice as often for you!");
    await say(`You received the LUCKY HORSESHOE! ${ITEMS.lucky_horseshoe.desc}`);
  }
  const next = DEX_REWARDS.find(([need]) => !S.flags["dex_" + need]);
  if (next) await say(`Prof. Oakley: Catch ${next[0]} kinds and I'll give you ${next[3]}. That's ${next[0] - c} more!`);
  else if (S.flags.dex_all) await say("Prof. Oakley: A complete Pocedex. You're the finest trainer I've ever met!");
  else await say(`Prof. Oakley: You've earned every prize but one. Catch all ${total} kinds for the last!`);
  S.party.forEach(healMon);
  await say("Prof. Oakley: Let me heal your team, too. All better!");
  save();
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
  const opts = ["agnite", "kroki", "anoleaf"];
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
          typeTag(D.monsters[s].types[0], x + 4 + typeIcons(s, x + 4, 109) + 2, 110);
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
        const c = await choose(["SUMMARY", "MAKE LEAD", "ITEM", "CANCEL"], { x: 150, y: 86 });
        if (c === 0) await summary(m);
        if (c === 1 && this.i > 0) { S.party.splice(this.i, 1); S.party.unshift(m); this.i = 0; }
        if (c === 2) await holdMenu(m);
      },
      draw() {
        ctx.fillStyle = "#4878a8"; ctx.fillRect(0, 0, VW, VH);
        S.party.forEach((m, k) => {
          const y = 2 + k * 22, sel = k === this.i;
          box(4, y, 232, 22, sel ? "#fff8c0" : m.hp > 0 ? "#f8f8f0" : "#e8c8c0");
          drawMonIcon(m.slug, 8, y - 2, m.shiny);
          if (m.shiny) drawStar(28, y + 2);
          text(monName(m), 34, y + 2);
          if (m.item && IMG["item_" + m.item]) ctx.drawImage(IMG["item_" + m.item], 112, y + 3, 16, 16); // held item
          text("Lv" + m.level, 34, y + 11, "#606060", null);
          typeIcons(m.slug, 134, y + 5);
          hpBar(162, y + 8, 42, m.hp / m.maxhp);
          text(`${m.hp}`, 210, y + 6);
          if (m.status) text(STATUS_TAG[m.status] || "PSN", 76, y + 12, "#c04020", null);
        });
        box(0, 134, VW, 26);
        text(prompt || (mode === "view" ? "Choose a pocemon." : "Choose a pocemon."), 10, 143);
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
    for (const [tbl, tag] of [[m.encounters, ""], [m.water, " (SURF)"], [m.night, " (NIGHT)"], [m.weather && m.weather.mons, m.weather ? ` (${m.weather.kind.toUpperCase()})` : ""]]) for (const [slug, lo, hi] of tbl || []) {
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

// Lore page shared by the summary screen and the Pocedex.
function drawLore(slug, known = true, banner = null, shiny = false) {
  const d = D.monsters[slug];
  ctx.fillStyle = "#e8e0c8"; ctx.fillRect(0, 0, VW, VH);
  box(2, 2, 92, 104, "#c8e0f0");
  if (known) drawMon(slug, "front", 16, 22, 1, 1, shiny);
  else { ctx.globalAlpha = 1; ctx.filter = "brightness(0)"; drawMon(slug, "front", 16, 22, 0.55); ctx.filter = "none"; }
  text(known ? d.name : "???", 8, 8);
  if (known) nameIcons(slug, d.name, 8, 8, 91);
  if (known) { let tx = 8; for (const t of d.types) tx += typeTag(t, tx, 90) + 2; }
  box(96, 2, 142, 104);
  const size = `${d.height ? (d.height / 100).toFixed(1) + "M" : "?"} ${d.weight ? d.weight + "KG" : ""}`;
  const evo = d.evo ? `LV${d.evo[0]} ${D.monsters[d.evo[1]].name}` : "FINAL FORM";
  const wf = whereFound()[slug];
  const found = wf ? wf.areas.slice(0, 2).join(", ") : ["agnite", "kroki", "anoleaf"].includes(slug) ? "PROF. OAKLEY'S LAB" : "ONLY BY EVOLVING";
  const rows = known ? [["SPECIES", d.species], ["FOUND IN", found],
    ["SIZE", size], ["EVOLVES", evo], ["TRAITS", (d.traits || []).slice(0, 2).join(", ") || "-"]] : [["SPECIES", "???"], ["HABITAT", "???"]];
  rows.forEach(([k, v], i) => {
    text(k, 102, 8 + i * 19, "#806040", null);
    const lines = wrap(String(v).toUpperCase(), 130);
    text(lines[0], 102, 17 + i * 19, "#303030", null);
  });
  box(2, 108, 236, 50);
  const desc = known ? d.desc || "Little is known about this pocemon." : "You haven't seen this pocemon yet.";
  // long entries page through 3 lines at a time
  const per = banner ? 2 : 3, top = banner ? 127 : 115;
  if (banner) { ctx.fillStyle = "#fff0a0"; ctx.fillRect(6, 111, 228, 13); text(banner, 10, 113, "#a05000", null); }
  const lines = wrap(desc, 220), pages = Math.ceil(lines.length / per), pg = Math.floor(NOW / 3.5) % pages;
  lines.slice(pg * per, pg * per + per).forEach((ln, i) => text(ln, 10, top + i * 12));
  if (pages > 1) text(`${pg + 1}/${pages}`, 210, 148, "#a09080", null);
}

// Give a monster an item to hold (it works by itself in battle), or take it back into the bag.
async function holdMenu(m) {
  const held = Object.keys(S.bag).filter((k) => S.bag[k] > 0 && ITEMS[k] && ITEMS[k].hold);
  const opts = [...held.map((k) => `${ITEMS[k].name.padEnd(13)}x${S.bag[k]}`), ...(m.item ? ["TAKE BACK"] : []), "CANCEL"];
  if (!held.length && !m.item) { await say("You have no items a pocemon can hold. Marts sell APPLES, ELIXIRS and BERRIES."); return; }
  const i = await choose(opts, { x: 70, y: 2, w: 166, extra: (k) => {
    const key = held[k] || (k === held.length && m.item ? m.item : null);
    if (key) { box(0, 112, VW, 48); wrap(ITEMS[key].desc, VW - 24).slice(0, 3).forEach((l, j) => text(l, 10, 120 + j * 12)); }
  } });
  if (i < 0 || opts[i] === "CANCEL") return;
  if (opts[i] === "TAKE BACK") { S.bag[m.item] = (S.bag[m.item] || 0) + 1; await say(`Took the ${ITEMS[m.item].name.toUpperCase()} from ${monName(m)}.`); m.item = null; return save(); }
  const k = held[i];
  if (m.item) S.bag[m.item] = (S.bag[m.item] || 0) + 1;
  S.bag[k]--; m.item = k;
  await say(`${monName(m)} is now holding the ${ITEMS[k].name.toUpperCase()}.`);
  save();
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
        drawMon(m.slug, "front", 16, 22, 1, 1, m.shiny);
        if (m.shiny) { drawStar(8, 96); text("SHINY", 15, 95, "#a07000", null); }
        text(d.name, 8, 8);
        nameIcons(m.slug, d.name, 8, 8, 91);
        let tx = 8;
        for (const t of d.types) tx += typeTag(t, tx, 90) + 2;
        box(96, 2, 142, 104);
        const rows = [["LEVEL", m.level], ["HP", `${m.hp}/${m.maxhp}`], ["MELEE", m.melee], ["ARMOUR", m.armour],
          ["RANGED", m.ranged], ["DODGE", m.dodge], ["SPEED", m.speed], ["NEXT LV", Math.max(0, expFor(m.level + 1) - m.exp)]];
        rows.forEach(([k, v], i) => { text(k, 104, 8 + i * 11); text(String(v), 180, 8 + i * 11); });
        box(2, 108, 236, 50);
        m.moves.forEach((mv, i) => {
          const M = D.moves[mv.id];
          const x = 10 + (i % 2) * 116, y = 115 + Math.floor(i / 2) * 20;
          text(M.name, x, y);
          ctx.fillStyle = TYPE_COLOR[M.type]; ctx.fillRect(x, y + 10, 4, 6);
          text(`${mv.pp}/${M.pp} PP`, x + 8, y + 10, "#606060", null);
        });
        if (d.evo) text(`Evolves at Lv${d.evo[0]}`, 104, 98, "#806020", null);
        if (m.item) { ctx.drawImage(IMG["item_" + m.item], 68, 20, 20, 20); text("HELD", 66, 41, "#606060", null); }
        text("INFO >", 184, 150, "#806040", null);
      },
    });
  });
}

// After a catch: the new monster's Dex page with a congrats banner. Z/X closes and you're back where you were.
function caughtInfo(m, first) {
  return new Promise((res) => {
    const t0 = NOW;
    push({
      opaque: true,
      update() { if (NOW - t0 > 0.6 && (consume("a") || consume("b"))) { pop(this); res(); } },
      draw() {
        drawLore(m.slug, true, `${first ? "NEW! " : ""}${m.shiny ? "SHINY " : ""}${D.monsters[m.slug].name.toUpperCase()} CAUGHT!  LV${m.level}`, m.shiny);
        if (Math.floor(NOW * 2) % 2) text("Z", 222, 113, "#a05000", null);
      },
    });
  });
}

// Pocedex: every species in the game, with lore and where to find the ones you've seen.
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
          if (seen) typeIcons(s2, 6, y + 2); // seen entries show their type icons where the number goes
          else text(String(k + 1).padStart(3, "0"), 7, y + 4, "#808080", null);
          text(seen ? D.monsters[s2].name : "-----", 36, y + 4);
          if (S.caught[s2]) { ctx.fillStyle = "#e04030"; ctx.fillRect(143, y + 5, 5, 5); }
          if (S.shinyCaught && S.shinyCaught[s2]) drawStar(126, y + 5);
          if (here.includes(s2)) { ctx.fillStyle = "#30a050"; ctx.fillRect(135, y + 5, 5, 5); }
        }
        box(154, 22, 84, 136, "#c8e0f0");
        text("No." + String(this.i + 1).padStart(3, "0"), 160, 27, "#506070", null);
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
    const keys = () => Object.keys(S.bag).filter((k) => S.bag[k] > 0 && ITEMS[k] && !(inBattle && (ITEMS[k].key || ITEMS[k].lure || ITEMS[k].treat || ITEMS[k].hold)));
    const ks = keys();
    if (!ks.length) { say("Your bag is empty.").then(() => res(null)); return; }
    choose(ks.map((k) => ITEMS[k].key ? ITEMS[k].name : `${ITEMS[k].name.padEnd(13)}x${S.bag[k]}`), {
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
  if (it.ball) { await say("You can only throw that in battle at a wild pocemon!"); return; }
  if (key === "fishing_rod") { await say("Stand facing the water and press Z to fish."); return; }
  if (it.key) { await say(it.desc); return; }
  if (it.lure) {
    if (S.lure > 0) { await say(`The Sweet Sand is still working (${S.lure} steps left).`); return; }
    S.bag[key]--; S.lure = it.lure;
    await say("You scattered the SWEET SAND. Wild pocemon will be drawn out for a while!");
    return;
  }
  const i = await partyScreen("pick", `Use ${it.name} on which pocemon?`);
  if (i < 0) return;
  if (it.treat) { await levelTreat(S.party[i]); return; }
  const msg = applyItem(key, S.party[i]);
  await say(msg);
}
async function levelTreat(m) {
  if (m.level >= 100) { await say("It won't have any effect."); return; }
  S.bag.level_treat--;
  m.level++; m.exp = expFor(m.level);
  const hpGap = m.maxhp - m.hp; calcStats(m); m.hp = Math.max(1, m.maxhp - hpGap);
  await say(`${monName(m)} ate the LEVEL TREAT and grew to Lv ${m.level}!`);
  for (const [lv, id] of D.monsters[m.slug].moves) {
    if (lv !== m.level || m.moves.some((x) => x.id === id)) continue;
    await offerMove(m, id, say);
  }
  await evolveCheck();
  save();
}
function applyItem(key, m) {
  const it = ITEMS[key];
  if (it.revive) {
    if (m.hp > 0) return "It won't have any effect.";
    m.hp = Math.floor(m.maxhp / 2); S.bag[key]--;
    return `${monName(m)} was revived!`;
  }
  if (it.cure) {
    if (!m.status || m.hp <= 0) return "It won't have any effect.";
    m.status = null; S.bag[key]--;
    return `${monName(m)} is cured!`;
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
    const opts = ["PARTY", "DEX", "BAG", "MAP", "TYPES", "QUESTS", "TRAINER", "SAVE", muted ? "MUSIC: OFF" : "MUSIC: ON", "CLOSE"];
    if (S.badges.includes("Volt Badge")) opts.splice(3, 0, "FLY");
    if (S.bag.saddle && canRideHere()) opts.splice(3, 0, world.player.riding ? "GET OFF" : "RIDE");
    if (rider("psychic") && canTeleport()) opts.splice(3, 0, "TELEPORT");
    const pick = opts[await choose(opts, { x: 150, y: 2, w: 88 })];
    if (pick === "FLY") { await flyMenu(); return; }
    if (pick === "RIDE" || pick === "GET OFF") { await toggleRide(); return; }
    if (pick === "TELEPORT") { await teleportMenu(); return; }
    if (pick === "PARTY") { if (S.party.length) await partyScreen("view"); else await say("You don't have any pocemon yet."); }
    else if (pick === "DEX") await monsterLog();
    else if (pick === "MAP") await regionMap();
    else if (pick === "TYPES") await typeGuide();
    else if (pick === "BAG") await useItemOutside();
    else if (pick === "QUESTS") await questLog();
    else if (pick === "TRAINER") await trainerCard();
    else if (pick === "SAVE") { await say(save() ? "Game saved!" : "Couldn't save (storage blocked)."); }
    else if (pick && pick.startsWith("MUSIC")) toggleMute();
    else return;
  }
}
// The Pocedex diploma: a framed certificate with your name stand-in, the count, and a gold seal.
function diploma() {
  return new Promise((res) => {
    const t0 = NOW;
    push({
      opaque: true,
      update() { if (NOW - t0 > 0.6 && (consume("a") || consume("b"))) { pop(this); res(); } },
      draw() {
        ctx.fillStyle = "#304860"; ctx.fillRect(0, 0, VW, VH);
        box(10, 8, 220, 144, "#fbf3dc");
        ctx.strokeStyle = "#b08a30"; ctx.lineWidth = 2; ctx.strokeRect(16, 14, 208, 132);
        ctx.font = "16px PS"; ctx.textBaseline = "top"; ctx.fillStyle = "#806020"; ctx.fillText("DIPLOMA", 64, 24); ctx.font = "8px PS";
        ["This certifies that you", `caught all ${Object.keys(D.monsters).length} kinds of`, "pocemon and completed", "the POCEDEX."].forEach((l, i) => text(l, 120 - textW(l) / 2, 50 + i * 12));
        text("Prof. Oakley", 30, 120, "#606060", null);
        ctx.drawImage(lookPortrait(myLook()), 64, 0, 64, 64, 150, 96, 40, 40);
        for (let k = 0; k < 5; k++) drawStar(186 + Math.cos(NOW * 2 + k * 1.26) * 12, 112 + Math.sin(NOW * 2 + k * 1.26) * 12, k % 2 ? "#fff" : "#ffd030");
      },
    });
  });
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
        text(`BADGES ${S.badges.length}/${BADGES.length}`, 16, 100);
        if (S.flags.dex_all) { drawStar(150, 102, "#ffd030"); text("POCEDEX COMPLETE", 158, 100, "#a07000", null); }
        BADGES.forEach(([b, mon], i) => { // one icon per gym; faded until you earn it
          ctx.globalAlpha = S.badges.includes(b) ? 1 : 0.2;
          drawMonIcon(mon, 12 + i * 27, 116);
          ctx.globalAlpha = 1;
        });
      },
    });
  });
}

// ---------------------------------------------------------------- battle
// Your monsters miss a quarter as often as a move's listed accuracy says (an 80% move hits 95%);
// foes use the listed accuracy.
const PLAYER_MISS_SCALE = 0.25;
function hitChance(acc, mine) { return mine ? 1 - (1 - acc) * PLAYER_MISS_SCALE : acc; }

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
  try { res = await B.run(); } finally { pop(B); for (const m of S.party) delete m.st; }
  if (res === "lose" && opts.practice) { music(areaMusic()); return res; }
  if (res === "lose") { await blackout(!!t); return res; }
  await evolveCheck();
  music(areaMusic());
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

// Losing to a trainer costs half your money; losing to a wild pocemon costs nothing.
async function blackout(toTrainer) {
  await say("You have no pocemon left that\ncan fight! You blacked out...");
  if (toTrainer) S.money = Math.floor(S.money / 2);
  S.party.forEach(healMon);
  const h = S.lastHeal;
  music(null);
  await warp(h.map, h.x, h.y, "up");
  await say(`You rushed back to safety and\nyour pocemon were healed.${toTrainer ? " You paid half your money to the winner." : ""}`);
  save();
}

async function evolveCheck() {
  for (const m of S.party) {
    const d = D.monsters[m.slug];
    if (!m.hp || !d.evo || m.level < d.evo[0]) continue;
    await evolveScene(m, d.evo[1]);
  }
}
// Evolution as sculpting: the monster hardens into clay, melts into a lump, gets kneaded, and is moulded
// pixel by pixel into its new form, which is then glazed back into full colour from the bottom up.
function spritePixels(slug, shiny) {
  const im = shiny ? shinyImg(slug) : IMG["mon_" + slug];
  const c = document.createElement("canvas"); c.width = 64; c.height = 64;
  const g = c.getContext("2d"); g.drawImage(im, 0, 0, 64, 64, 0, 0, 64, 64);
  const d = g.getImageData(0, 0, 64, 64).data, px = [];
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const i = (y * 64 + x) * 4;
    if (d[i + 3] < 128) continue;
    const lum = (0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / 255;
    px.push({ x, y, r: d[i], g: d[i + 1], b: d[i + 2], lum });
  }
  return px;
}
const clayOf = (lum) => { const k = 0.55 + 0.6 * lum; return `rgb(${Math.min(255, 200 * k) | 0},${Math.min(255, 138 * k) | 0},${Math.min(255, 92 * k) | 0})`; };
async function evolveScene(m, to) {
  const from = m.slug, OX = 88, OY = 26, BX = 120, BY = 82; // sprite corner, lump centre
  const ease = (k) => (k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k));
  const back = (k) => { k = Math.max(0, Math.min(1, k)); const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  // the lump is the sprite squashed flat and wide, so the body sags into it in one piece (and back out)
  const lumpPoint = (p) => [BX + (p.x - 32) * 1.25, BY + 6 - (63 - p.y) * 0.3];
  // old pixels sag into the lump, top rows last; new pixels are pulled up out of it, bottom rows first
  const oldPx = spritePixels(from, m.shiny).map((p) => ({ ...p, to: lumpPoint(p), delay: p.y / 63 * 0.1 + (63 - p.y) / 63 * 0.5, sway: p.y * 0.2 }));
  const newPx = spritePixels(to, m.shiny).map((p) => ({ ...p, from: lumpPoint(p), delay: (63 - p.y) / 63 * 0.6 }));
  const sparks = [];
  const sc = push({
    opaque: true, phase: "show", k: 0, flash: 0, glaze: 0, knead: 0, hands: 0,
    update() {},
    draw() {
      ctx.fillStyle = "#1a1420"; ctx.fillRect(0, 0, VW, VH);
      // a warm studio spotlight on the potter's wheel
      const gr = ctx.createRadialGradient(BX, BY - 20, 6, BX, BY - 20, 90);
      gr.addColorStop(0, "rgba(255,210,150,0.28)"); gr.addColorStop(1, "rgba(255,210,150,0)");
      ctx.fillStyle = gr; ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = "#3a2a22"; ctx.beginPath(); ctx.ellipse(BX, BY + 8, 44, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#5a4232"; ctx.beginPath(); ctx.ellipse(BX, BY + 6, 40, 6, 0, 0, Math.PI * 2); ctx.fill();
      const t = this.k;
      if (this.phase === "show") { // full colour fading to clay
        drawMon(from, "front", OX, OY, 1, 1, m.shiny);
        ctx.globalAlpha = t;
        for (const p of oldPx) { ctx.fillStyle = clayOf(p.lum); ctx.fillRect(OX + p.x, OY + p.y, 1, 1); }
        ctx.globalAlpha = 1;
      } else if (this.phase === "melt") {
        for (const p of oldPx) {
          const e = ease((t - p.delay) / 0.55), drip = e * e;
          const x = OX + p.x + (p.to[0] - OX - p.x) * e + Math.sin(p.sway + t * 7) * 2 * e * (1 - e);
          const y = OY + p.y + (p.to[1] - OY - p.y) * drip;
          ctx.fillStyle = clayOf(p.lum * (1 - e) + 0.45 * e); ctx.fillRect(x | 0, y | 0, 2, 2);
        }
      } else if (this.phase === "knead") { // the lump squashes and stretches as it is worked
        const sq = 1 + Math.sin(this.knead * 9) * 0.22, st = 1 / sq;
        for (const p of oldPx) {
          const x = BX + (p.to[0] - BX) * sq, y = BY + (p.to[1] - BY) * st - (st - 1) * 10;
          ctx.fillStyle = clayOf(0.45 + Math.sin(p.sway + this.knead * 5) * 0.12); ctx.fillRect(x | 0, y | 0, 2, 2);
        }
        // two pressing palms, squeezing in time with the lump
        const press = Math.max(0, Math.sin(this.knead * 9));
        ctx.fillStyle = "rgba(240,200,170,0.9)";
        for (const s2 of [-1, 1]) { ctx.beginPath(); ctx.ellipse(BX + s2 * (38 - press * 10), BY - 2, 7, 11, s2 * 0.3, 0, Math.PI * 2); ctx.fill(); }
      } else { // mould: clay pixels rise into the new shape, then the glaze sweeps up
        const line = OY + 64 - this.glaze * 70;
        if (this.phase === "mould" && t < 0.35) { // the old lump gives way to the new one
          ctx.globalAlpha = 1 - t / 0.35;
          for (const p of oldPx) { ctx.fillStyle = clayOf(0.45); ctx.fillRect(p.to[0] | 0, p.to[1] | 0, 2, 2); }
          ctx.globalAlpha = 1;
        }
        for (const p of newPx) {
          const e = this.phase === "mould" ? back((t - p.delay) / 0.6) : 1;
          const x = p.from[0] + (OX + p.x - p.from[0]) * e, y = p.from[1] + (OY + p.y - p.from[1]) * e;
          if (OY + p.y >= line && e >= 1) ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          else ctx.fillStyle = clayOf(p.lum);
          ctx.fillRect(x | 0, y | 0, e >= 1 ? 1 : 2, e >= 1 ? 1 : 2);
        }
        if (this.glaze > 0 && this.glaze < 1) { // shimmering edge of the glaze
          ctx.fillStyle = "rgba(255,255,230,0.85)"; ctx.fillRect(OX - 4, line | 0, 72, 1);
        }
      }
      for (const s2 of sparks) { ctx.fillStyle = `rgba(255,240,180,${s2.life})`; ctx.fillRect(s2.x | 0, s2.y | 0, 2, 2); s2.x += s2.vx; s2.y += s2.vy; s2.vy += 0.05; s2.life -= 0.02; }
      for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].life <= 0) sparks.splice(i, 1);
      if (this.flash) { ctx.fillStyle = `rgba(255,255,255,${this.flash})`; ctx.fillRect(0, 0, VW, VH); }
    },
  });
  await say(`What? ${D.monsters[from].name} is evolving!`);
  await tween(0.9, (k) => { sc.k = k; });
  sc.phase = "melt"; await tween(1.4, (k) => { sc.k = k * 1.3; });
  sc.phase = "knead"; await tween(1.6, (k) => { sc.knead = k * 2.2; });
  sc.phase = "mould"; await tween(1.6, (k) => { sc.k = k * 1.3; });
  m.slug = to;
  calcStats(m);
  sc.phase = "glaze"; await tween(0.9, (k) => { sc.glaze = k; });
  for (let i = 0; i < 40; i++) { const a = Math.random() * 6.283, v = 0.6 + Math.random() * 1.6; sparks.push({ x: OX + 32, y: OY + 36, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.8, life: 1 }); }
  await tween(0.25, (k) => { sc.flash = 0.7 * (1 - k); });
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
    this.e.st = {};
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
    if (this.eVis) drawMon(this.e.slug, "front", this.eX, this.eY, this.eAlpha, this.eScale, this.e.shiny);
    if (this.pVis && this.p) drawMon(this.p.slug, "back", this.pX, this.pY, this.pAlpha, this.pScale, this.p.shiny);
    if (this.sparkle && NOW - this.sparkle.t < 1.6) { // shiny sparkle burst
      const t = NOW - this.sparkle.t, cx = this.sparkle.x, cy = this.sparkle.y;
      for (let k = 0; k < 8; k++) {
        const a = k * Math.PI / 4 + t * 2, r = 10 + t * 26;
        if ((k + Math.floor(t * 10)) % 3) drawStar(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 0.7), k % 2 ? "#fff" : "#ffd030");
      }
    }
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
      const im = IMG["item_" + (this.ballKey || "tuxeball")] || IMG.item_tuxeball;
      ctx.save(); ctx.translate(this.ball.x, this.ball.y); ctx.rotate(this.ball.r || 0);
      if (im) ctx.drawImage(im, -8, -8, 16, 16);
      ctx.restore();
    }
    if (this.showEBox) this.drawBox(this.e, 4, 4, false);
    if (this.showEBox && this.e.shiny) drawStar(6, 6);
    if (this.showPBox && this.p && this.p.shiny) drawStar(126, 68);
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
    const icw = typeIcons(m.slug, x + 6, y + 16);
    text("HP", x + 9 + icw, y + 17, "#e08030", null);
    hpBar(x + 25 + icw, y + 18, 77 - icw, hp / m.maxhp);
    if (!mine && !this.trainer && S.caught[m.slug] && IMG.tuxeball) { // you already own this kind: a Poceball beside its box
      ctx.drawImage(IMG.tuxeball, 0, 16, 16, 16, x + 114, y + 3, 12, 12);
    }
    if (m.status) { // a coloured chip just outside the box: below the foe's, above yours
      const tag = STATUS_TAG[m.status] || "PSN", cy = mine ? y - 11 : y + h + 1;
      ctx.fillStyle = { burn: "#d04820", poison: "#8a3aa8", sleep: "#707888", para: "#c8a018" }[m.status] || "#c04020";
      ctx.fillRect(x + 4, cy, textW(tag) + 4, 10); text(tag, x + 6, cy + 1, "#fff", null);
    }
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
      if (this.e.shiny) { this.sparkle = { t: NOW, x: this.eX + 32, y: this.eY + 36 }; S.shinySeen = S.shinySeen || {}; S.shinySeen[this.e.slug] = true; }
      cry(this.e.slug);
      await this.msg(this.legendary ? `The legendary ${monName(this.e).toUpperCase()} appeared!` : `A wild ${monName(this.e)} appeared!`);
      if (this.e.shiny) await this.msg("Whoa! Its colors are different... it's a SHINY!");
      if (isNew) { S.seen[this.e.slug] = true; await this.msg(`New! ${monName(this.e)} was added to your Pocedex.`); }
    }
    const first = S.party.findIndex((m) => m.hp > 0);
    await tween(0.35, (k) => { this.plX = 20 - 110 * k; });
    await this.sendPlayer(S.party[first]);

    for (;;) {
      const act = await this.chooseAction();
      if (act.type === "run") {
        if (this.trainer) { await this.msg("No! There's no running from a\ntrainer battle!"); continue; }
        // easy to get away, and easier with every try: a slower monster only drags it down a little
        this.runTries = (this.runTries || 0) + 1;
        const chance = clamp(0.8 + (this.p.speed - this.e.speed) / 80 + 0.25 * (this.runTries - 1), 0.6, 1);
        if (Math.random() < chance) { await this.msg("Got away safely!"); return "run"; }
        await this.msg("Can't escape!");
        await this.enemyTurn();
      } else if (act.type === "switch") {
        await this.withdraw();
        await this.sendPlayer(S.party[act.idx]);
        await this.enemyTurn();
      } else if (act.type === "item") {
        if (ITEMS[act.key].ball) {
          const r = await this.throwBall(act.key);
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
        const pri = (id) => !!(D.moves[id] && D.moves[id].fx && D.moves[id].fx.first);
        const ps = statOf(this.p, "speed"), es = statOf(this.e, "speed");
        const pFirst = pri(act.move) !== pri(eMove) ? pri(act.move) : ps > es || (ps === es && Math.random() < 0.5);
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
    this.e.st = {};
    this.eVis = true; this.eX = 148; this.eScale = 0; this.eAlpha = 1;
    this.eHp = this.e.hp;
    S.seen[this.e.slug] = true;
    await this.msg(`${this.trainer.name} sent out ${monName(this.e)}!`);
    cry(this.e.slug);
    await tween(0.3, (k) => { this.eScale = k; });
    this.showEBox = true;
  }
  async sendPlayer(m) {
    if (this.p) this.p.st = {}; // boosts and drops wear off when it leaves the field
    this.p = m; m.st = {};
    this.pHp = m.hp; this.pExp = m.exp;
    this.participants.add(m);
    this.pVis = true; this.pScale = 0; this.pAlpha = 1;
    await this.msg(`Go! ${monName(m)}!`);
    cry(m.slug);
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
          if (this.trainer) { await this.msg("You can't catch a trainer's pocemon!"); continue; }
          return { type: "item", key };
        }
        const t = await partyScreen("pick", `Use ${it.name} on which pocemon?`);
        if (t < 0) continue;
        const m = S.party[t];
        if ((it.revive && m.hp > 0) || (it.heal && (m.hp <= 0 || m.hp >= m.maxhp)) || (it.cure && (!m.status || m.hp <= 0))) { await this.msg("It won't have any effect."); continue; }
        return { type: "item", key, target: t };
      } else if (c === 2) {
        const i = await partyScreen("switch", "Switch to which pocemon?");
        if (i < 0) continue;
        if (S.party[i] === this.p) { await this.msg(`${monName(this.p)} is already out!`); continue; }
        if (S.party[i].hp <= 0) { await this.msg("That pocemon has fainted!"); continue; }
        return { type: "switch", idx: i };
      } else if (c === 3) return { type: "run" };
    }
  }
  async chooseMove() {
    const mvs = this.p.moves;
    const i = await choose(mvs.map((mv) => ({ label: D.moves[mv.id].name.slice(0, 13), disabled: mv.pp <= 0 })), {
      cols: 2, x: 0, y: 112, w: 240, h: 48, colW: 116,
      // the highlighted move's card (type, power, hit chance, PP, effect, how it does against this foe)
      extra: (k) => {
        const h = moveCardH(this.p, mvs[k].id, { foe: this.e });
        drawMoveCard(this.p, mvs[k].id, 2, 110 - h, { foe: this.e, pp: mvs[k].pp });
      },
    });
    return i < 0 ? null : mvs[i].id;
  }

  pickEnemyMove() {
    const usable = this.e.moves.filter((mv) => mv.pp > 0);
    if (!usable.length) return "struggle";
    const e = this.e, p = this.p, dmg = (id) => calcDamage(e, p, id, false).dmg * D.moves[id].acc;
    const best = Math.max(1, ...usable.map((mv) => dmg(mv.id)));
    const value = (id) => { // support moves are worth a fraction of its best hit, when they make sense
      const M = D.moves[id], fx = M.fx || {};
      if (M.power) return dmg(id) * (fx.first && p.hp <= dmg(id) ? 1.5 : 1);
      if (fx.heal) return e.hp < e.maxhp * 0.4 ? best * 1.3 : 0;
      if (fx.inflict) return p.status ? 0 : best * 0.7 * M.acc;
      if (fx.self) return e.hp > e.maxhp * 0.6 && Object.keys(fx.self).every((k) => ((e.st && e.st[k]) || 0) < 2) ? best * 0.6 : 0;
      if (fx.foe) return Object.keys(fx.foe).every((k) => ((p.st && p.st[k]) || 0) > -2) ? best * 0.4 : 0;
      return 0;
    };
    const scored = usable.map((mv) => ({ mv, s: Math.max(1, value(mv.id)) }));
    const smart = this.trainer && (this.trainer.leader || this.trainer.champion) ? 0.85 : 0.4;
    if (Math.random() < smart) return scored.sort((a, b) => b.s - a.s)[0].mv.id;
    return scored[rand(0, scored.length - 1)].mv.id;
  }

  async useMove(att, def, moveId, mine) {
    const M = moveId === "struggle" ? { name: "Struggle", type: "normal", power: 20, acc: 1, phys: true } : D.moves[moveId];
    const fx = M.fx || {};
    const who = mine ? monName(att) : `Foe ${monName(att)}`;
    const dn = mine ? `Foe ${monName(def)}` : monName(def);
    // sleep and paralysis can cost the turn
    if (att.status === "sleep") {
      if (--att.sleep > 0) { await this.msg(`${who} is fast asleep.`); return; }
      att.status = null; await this.msg(`${who} woke up!`);
    }
    if (att.status === "para" && Math.random() < 0.25) { await this.msg(`${who} is paralysed! It can't move!`); return; }
    const slot = att.moves.find((m) => m.id === moveId);
    if (slot) slot.pp--;
    await this.msg(`${who} used ${M.name}!`);
    const selfOnly = !M.power && (fx.self || fx.heal); // boosts and heals never miss
    if (!selfOnly && Math.random() > hitChance(M.acc, mine)) { await this.msg(`${who}'s attack missed!`); return; }
    // lunge
    await tween(0.12, (k) => { if (mine) this.pX = 20 + 14 * k; else this.eX = 148 - 14 * k; });
    await tween(0.12, (k) => { if (mine) this.pX = 34 - 14 * k; else this.eX = 134 + 14 * k; });
    moveSfx(moveId);
    await this.playFx(M, mine);
    if (!M.power) { await this.applyFx(att, def, fx, mine, who, dn); return; }
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
    if (r.crit || r.eff >= 1.5) { this.shake = 6; await wait(0.25); this.shake = 0; }
    if (r.crit) await this.msg("A critical hit!");
    if (r.eff >= 1.5) await this.msg("It's super effective!");
    else if (r.eff <= 0.6) await this.msg("It's not very effective...");
    if (moveId === "struggle") {
      const recoil = Math.max(1, Math.floor(att.maxhp / 8));
      att.hp = Math.max(0, att.hp - recoil);
      if (mine) this.pHp = att.hp; else this.eHp = att.hp;
      await this.msg(`${who} is hit with recoil!`);
    }
    if (def.hp > 0 && M.status && !def.status && Math.random() < Math.max(M.chance, 0.15)) {
      def.status = M.status;
      await this.msg(M.status === "burn" ? `${dn} was burned!` : `${dn} was poisoned!`);
    }
    if (def.hp > 0 && fx.foe && Math.random() < (fx.chance ?? 1)) await this.applyFx(att, def, { foe: fx.foe }, mine, who, dn);
    await this.heldCheck(def, !mine);
  }

  // stat stages, heals and sleep/paralysis from support moves (and the stat drops riding on some attacks)
  async applyFx(att, def, fx, mine, who, dn) {
    const stage = async (m, name, changes) => {
      m.st = m.st || {};
      for (const [k, d] of Object.entries(changes)) {
        const cur = m.st[k] || 0, next = clamp(cur + d, -4, 4);
        if (next === cur) { await this.msg(`${name}'s ${STAT_NAME[k]} won't go any ${d > 0 ? "higher" : "lower"}!`); continue; }
        m.st[k] = next;
        await this.msg(`${name}'s ${STAT_NAME[k]} ${d > 0 ? (d > 1 ? "rose sharply!" : "rose!") : (d < -1 ? "harshly fell!" : "fell!")}`);
      }
    };
    if (fx.self) await stage(att, who, fx.self);
    if (fx.foe) await stage(def, dn, fx.foe);
    if (fx.heal) {
      if (att.hp >= att.maxhp) { await this.msg(`${who}'s HP is already full!`); return; }
      const from = att.hp;
      att.hp = Math.min(att.maxhp, att.hp + Math.floor(att.maxhp * fx.heal));
      await tween(0.5, (k) => { const v = from + (att.hp - from) * k; if (mine) this.pHp = v; else this.eHp = v; });
      await this.msg(`${who} recovered ${att.hp - from} HP!`);
    }
    if (fx.inflict) {
      if (def.status) { await this.msg("But it failed!"); return; }
      def.status = fx.inflict;
      if (fx.inflict === "sleep") { def.sleep = rand(2, 4); await this.msg(`${dn} fell asleep!`); }
      else await this.msg(`${dn} is paralysed! It may be unable to move!`);
      await this.heldCheck(def, !mine);
    }
  }

  // held items that trigger on their own: an Apple at half HP, an Elixir against a status
  async heldCheck(m, mine) {
    if (!m || m.hp <= 0 || !m.item) return;
    const name = mine ? monName(m) : `Foe ${monName(m)}`;
    if (m.item === "apple" && m.hp < m.maxhp / 2) {
      const from = m.hp;
      m.hp = Math.min(m.maxhp, m.hp + Math.floor(m.maxhp / 3)); m.item = null;
      await tween(0.5, (k) => { const v = from + (m.hp - from) * k; if (mine) this.pHp = v; else this.eHp = v; });
      await this.msg(`${name} ate its APPLE and recovered HP!`);
    }
    if (m.item === "elixir" && m.status) {
      m.status = null; m.item = null;
      await this.msg(`${name} drank its ELIXIR and was cured!`);
    }
  }

  async endOfTurn() {
    for (const [m, mine] of [[this.p, true], [this.e, false]]) {
      if (!m || m.hp <= 0 || (m.status !== "burn" && m.status !== "poison")) continue;
      const d = Math.max(1, Math.floor(m.maxhp / 8));
      const from = m.hp;
      m.hp = Math.max(0, m.hp - d);
      const who = mine ? monName(m) : `Foe ${monName(m)}`;
      await this.msg(m.status === "burn" ? `${who} is hurt by its burn!` : `${who} is hurt by poison!`);
      await tween(0.4, (k) => { const v = from + (m.hp - from) * k; if (mine) this.pHp = v; else this.eHp = v; });
      await this.heldCheck(m, mine);
    }
  }

  async enemyTurn() {
    if (this.e.hp > 0 && this.p.hp > 0) await this.useMove(this.e, this.p, this.pickEnemyMove(), false);
  }

  async resolveFaints() {
    if (this.e.hp <= 0) {
      await tween(0.35, (k) => { this.eY = 6 + 50 * k; this.eAlpha = 1 - k; });
      this.eVis = false; this.showEBox = false; this.eY = 6; this.eAlpha = 1;
      cry(this.e.slug, true);
      await this.msg(`${this.wild ? "Wild" : "Foe"} ${monName(this.e)} fainted!`);
      const stage = D.monsters[this.e.slug].stage;
      const EXP_RATE = 1.6; // faster leveling (requested)
      const gain = Math.floor((50 + stage * 50) * this.e.level / 7 * (this.trainer ? 1.5 : 1) * EXP_RATE);
      const alive = [...this.participants].filter((m) => m.hp > 0 && S.party.includes(m));
      for (const m of alive) await this.giveExp(m, Math.max(1, Math.floor(gain / alive.length * (m.item === "exp_candy" ? 1.5 : 1))));
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
      cry(this.p.slug, true);
      await this.msg(`${monName(this.p)} fainted!`);
      this.participants.delete(this.p);
      if (!partyAlive().length) return "lose";
      let i;
      do { i = await partyScreen("forced", "Choose the next pocemon."); } while (S.party[i].hp <= 0);
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
        sfx("ding", 0.6, 1.25);
        await this.msg(`${monName(m)} grew to Lv ${m.level}!`);
        await this.learnMoves(m);
      }
    }
  }
  async learnMoves(m) {
    for (const [lv, id] of D.monsters[m.slug].moves) {
      if (lv !== m.level || m.moves.some((x) => x.id === id)) continue;
      await offerMove(m, id, (t) => this.msg(t));
    }
  }

  async throwBall(key = "tuxeball") {
    S.bag[key]--;
    this.ballKey = key;
    sfx("throw");
    await this.msg(`You threw a ${ITEMS[key].name}!`);
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
    const p = clamp(a / 255 * 1.6 * (ITEMS[this.ballKey || "tuxeball"].ball || 1), 0.03, 1);
    const shakeP = Math.pow(p, 1 / 3);
    let shakes = 0;
    while (shakes < 3 && Math.random() < shakeP) shakes++;
    for (let i = 0; i < Math.min(shakes, 3); i++) {
      await wait(0.35);
      await tween(0.3, (k) => { this.ball.r = Math.sin(k * Math.PI * 2) * 0.5; });
    }
    await wait(0.3);
    if (shakes === 3) {
      const first = !S.caught[e.slug];
      if (e.shiny) { S.shinyCaught = S.shinyCaught || {}; S.shinyCaught[e.slug] = true; }
      music("caught");
      sfx("ding", 0.8);
      await this.msg(`Gotcha! ${monName(e)} was caught!`);
      const where = addMon(e);
      this.ball = null;
      if (where === "box") await this.msg(`Your party is full. ${monName(e)} was sent to the box.`);
      await caughtInfo(e, first);
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
// the weather on a map right now: rain at certain hours, or snow/ash all the time (null indoors and on clear maps)
function weatherNow(m = world.map) {
  const w = m && m.weather;
  if (!w || m.interior) return null;
  if (w.from == null) return w.kind;
  const h = hourNow();
  return h >= w.from && h < w.to ? w.kind : null;
}
function drawMinimap() {
  const m = world.map, p = world.player;
  if (m.dark) return; // the dark gym's maze would be no puzzle with a map of it
  const s = Math.min(64 / m.w, 50 / m.h), w = Math.round(m.w * s), h = Math.round(m.h * s);
  const x0 = VW - w - 4, y0 = 4;
  ctx.fillStyle = "rgba(16,24,20,0.75)"; ctx.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
  ctx.drawImage(minimapCanvas().c, x0, y0, w, h);
  if (!m.interior && !m.cave) {
    const wx = weatherNow(), ct = wx ? clockText().replace(/^\S+/, wx.toUpperCase()) : clockText(), cw = textW(ct) + 8;
    ctx.fillStyle = "rgba(16,24,20,0.75)"; ctx.fillRect(x0 - 6 - cw, y0 - 2, cw, 12);
    text(ct, x0 - 2 - cw, y0, isNight() ? "#b8c8ff" : "#fff0a0", null);
  }
  if (S.lure > 0) {
    const lt = `LURE ${S.lure}`, lw = textW(lt) + 8;
    ctx.fillStyle = "rgba(16,24,20,0.75)"; ctx.fillRect(x0 - 6 - lw, y0 + 12, lw, 12);
    text(lt, x0 - 2 - lw, y0 + 14, "#ffb0e0", null);
  }
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

// ---------------------------------------------------------------- day and night
// One real minute is one hour; a new game starts at 8am. Night is 8pm-5am.
const MINUTES_PER_HOUR = 1;
function hourNow() { return (8 + S.time / (60 * MINUTES_PER_HOUR)) % 24; }
function isNight(h = hourNow()) { return h >= 20 || h < 5; }
// 1 = full day, 0 = deep night, eased through dawn (5-7) and dusk (18-20)
function daylight(h = hourNow()) {
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  return h < 12 ? ss(5, 7, h) : 1 - ss(18, 20, h);
}
function clockText(h = hourNow()) {
  const hh = Math.floor(h), mm = Math.floor((h % 1) * 6) * 10;
  return `${isNight(h) ? "NIGHT" : h < 7 ? "DAWN" : h >= 18 ? "DUSK" : "DAY"} ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
// routes turn mysterious after dark and towns wind down; gyms, buildings and the ghost town keep their own track
function areaMusic(m = world.map) {
  const base = m.music || "town";
  if (!isNight() || m.interior || m.ghost) return base;
  return base === "route" ? "mystery" : ["town", "funky", "wild"].includes(base) ? "chill" : base;
}

// ---------------------------------------------------------------- world scene
// The arrows walk in that direction (top-down, like the classic handhelds); SHIFT runs.
const WALK_SPEED = 3.6, RUN_SPEED = 6.4, RIDE_SPEED = 8.5;
const worldScene = {
  opaque: true, overworld: true,
  update(dt) {
    const wasNight = isNight(), wasRain = weatherNow();
    S.time += dt;
    gateCooldown -= dt;
    if (wasNight !== isNight() && !world.busy) {
      music(areaMusic());
      if (!world.map.interior) this.banner = { name: isNight() ? "Night has fallen..." : "The sun is rising!", t: NOW };
    }
    if (wasRain !== weatherNow() && !world.busy) this.banner = { name: weatherNow() ? "It started to rain..." : "The rain stopped.", t: NOW };
    const p = world.player;
    for (const n of world.npcs) if (!n.walking) { n.fx = n.x * T; n.fy = n.y * T; }
    if (world.busy) { p.speed = 0; return; }
    if (consume("a")) { p.speed = 0; runScript(interact); return; }
    if (consume("b")) { p.speed = 0; runScript(startMenu); return; }
    if (consume("fly")) { p.speed = 0; runScript(flyMenu); return; }
    if (consume("teleport")) { p.speed = 0; runScript(teleportMenu); return; }
    if (consume("ride")) { p.speed = 0; runScript(toggleRide); return; }
    const tapped = ["up", "down", "left", "right"].find((k) => pressed[k]);
    for (const k of ["up", "down", "left", "right"]) pressed[k] = false;
    if (p.slide) { // sliding: no steering until you stop
      const x0 = p.px, z0 = p.pz, n = 3;
      for (let i = 0; i < n && !world.busy; i++) movePlayer(p.slide[0] * 6 * dt / n, p.slide[1] * 6 * dt / n);
      if ((p.px === x0 && p.pz === z0) || tileAt(p.x, p.y) !== "I") { p.slide = null; p.px = p.x + 0.5; p.pz = p.y + 0.5; }
      return;
    }
    // the arrow last pressed wins; a quick tap toward a new direction only turns you to face it
    if (tapped) this.lastDir = tapped;
    const dir = held[this.lastDir] ? this.lastDir : ["up", "down", "left", "right"].find((k) => held[k]);
    if (tapped && tapped !== p.dir && !p.speed) this.turnHold = 0.09;
    this.turnHold = Math.max(0, (this.turnHold || 0) - dt);
    if (dir) { p.dir = dir; p.angle = ANGLE[dir]; }
    const target = dir && !this.turnHold ? (p.riding ? RIDE_SPEED : held.run ? RUN_SPEED : WALK_SPEED) : 0;
    p.speed = target ? p.speed + (target - p.speed) * Math.min(1, dt * 14) : 0;
    if (p.speed) {
      const [vx, vz] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
      // drift onto the middle of the row or column you're walking along, so corridors and doors line up
      const k = Math.min(1, dt * 10);
      if (vx) p.pz += (p.y + 0.5 - p.pz) * k; else p.px += (p.x + 0.5 - p.px) * k;
      const step = p.speed * dt;
      const n = Math.ceil(Math.abs(step) / 0.2); // sub-step so fast movement never skips a tile
      for (let i = 0; i < n && !world.busy; i++) movePlayer(vx * step / n, vz * step / n);
    }
    trackTrail();
  },
  draw() {
    drawMinimap();
    if (world.bubble) {
      const n = world.bubble;
      const s = World2D.project(n.fx / T, n.fy / T, 1.9);
      if (s) { box(s.x - 7, s.y - 14, 14, 15, "#fff"); text("!", s.x - 3, s.y - 10, "#e03020", null); }
    }
    if (this.banner && NOW - this.banner.t < 2.2) {
      const k = Math.min(1, (NOW - this.banner.t) * 4, (2.2 - (NOW - this.banner.t)) * 4);
      box(4, -26 + 30 * k, textW(this.banner.name) + 16, 20, "#f8f0d8");
      text(this.banner.name, 12, -20 + 30 * k);
    }
  },
  renderWorld(dt) {
    const m = world.map;
    const solid = (x, y) => {
      if (x < 0 || y < 0 || x >= m.w || y >= m.h) return !!m.interior;
      return m.grid[y][x] === "W" || m.grid[y][x] === "T" || world.solid.has(x + "," + y) || world.doors.some((b) => b.door.x === x && b.door.y === y);
    };
    const look = myLook();
    const p3 = world.player;
    p3.ground = (p3.ground || 0) + (heightAt(p3.x, p3.y) - (p3.ground || 0)) * Math.min(1, dt * 10);
    const mon = p3.mount && p3.mount.replace("*", "");
    World2D.render({ player: world.player, npcs: world.npcs, statues: world.statues, interior: !!m.interior,
      daylight: m.cave ? 1 : daylight(), hour: hourNow(), cave: !!m.cave, flash: !!world.flash, weather: weatherNow(),
      pickups: world.pickups || [], playerSheet: lookSheet(look), mountImg: mon ? IMG["mon_" + mon] : null,
      follower: followerMon() }, dt, NOW);
  },
};

// ---------------------------------------------------------------- title
function titleScene(hasSave) {
  return new Promise((res) => {
    const showcase = ["agnite", "kroki", "anoleaf", "rockitten", "fluoresfin", "eaglace"];
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
        ctx.fillStyle = "#203010"; ctx.fillText("POCEMON", 39, 11);
        ctx.fillStyle = "#f8d848"; ctx.fillText("POCEMON", 36, 8);
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
  if (base && base.overworld) base.renderWorld(dt);
  else if (base && !base.overworld) { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, VW, VH); }
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
  World2D.init(document.getElementById("screen"), IMG);
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
    if (m) { world.player.mount = mountKey(m); world.player.surfing = true; world.player.riding = false; } else loadMap(S.lastHeal.map, S.lastHeal.x, S.lastHeal.y, "up");
  }
  if (!S.starter) {
    runScript(async () => {
      await wait(0.4);
      await say("Prof. Oakley: Welcome to my lab! The world is full of wild pocemon, so first you need a partner of your own.");
      await professor();
      await say("CONTROLS: the arrow keys walk. Z talks and picks things up, X opens the menu, SHIFT runs.");
    });
  }
}
window.__game = { world, get S() { return S; }, D, MAPS, scenes, warp, makeMon, trainerSees, readyFor, wildBattle, starterSelect, monsterLog, summary, tick: (n = 1, dt = 1 / 30) => { for (let i = 0; i < n; i++) step(dt); } };
boot();
