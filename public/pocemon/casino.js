// The Volt City Game Corner: buy coins, play slots, roulette and blackjack, and trade coins for prizes.
// Coins are separate from money and capped at 9999. The odds are fixed and checked: tools/slot_odds.js
// enumerates every slot outcome; roulette is single-zero (97.3% return); blackjack pays 3:2, dealer stands on 17.
const COIN_MAX = 9999;
const coins = () => S.coins || 0;
function addCoins(n) { S.coins = clamp(coins() + n, 0, COIN_MAX); }

// ---------------------------------------------------------------- clerks
async function coinClerk() {
  for (;;) {
    const opts = [{ label: "50 COINS   $1000", disabled: S.money < 1000 }, { label: "500 COINS  $10000", disabled: S.money < 10000 }, "DONE"];
    const c = await choose(opts, { prompt: `Coin Clerk: Coins for the games! You have ${coins()} coins and $${S.money}.` });
    if (c === 0 || c === 1) {
      const [n, cost] = c === 0 ? [50, 1000] : [500, 10000];
      if (coins() + n > COIN_MAX) { await say(`Your coin case can't hold more than ${COIN_MAX} coins.`); continue; }
      S.money -= cost; addCoins(n); save();
      await say(`You bought ${n} coins. Good luck!`);
    } else return;
  }
}
// prizes: items, and the two starters you didn't pick (Lv 10)
function prizeList() {
  const starters = ["agnite", "kroki", "anoleaf"].filter((s) => s !== baseForm(S.starter || ""));
  return [
    ...starters.map((s) => ({ mon: s, cost: 3000 })),
    { item: "exp_candy", cost: 200 }, { item: "sweet_sand", cost: 300 }, { item: "level_treat", cost: 500 },
    { item: "mega_potion", cost: 100 }, { item: "master_ball", cost: 5000 },
  ];
}
async function prizeClerk() {
  for (;;) {
    const list = prizeList();
    const labels = list.map((p) => ({ label: `${(p.mon ? D.monsters[p.mon].name.toUpperCase() + " Lv10" : ITEMS[p.item].name.toUpperCase()).padEnd(14)}${String(p.cost).padStart(5)}`, disabled: coins() < p.cost }));
    const c = await choose([...labels, "DONE"], { x: 20, y: 4, w: 216, maxRows: 7, prompt: `Prize Clerk: Trade coins for prizes! You have ${coins()} coins.` });
    if (c < 0 || c >= list.length) return;
    const p = list[c];
    const name = p.mon ? D.monsters[p.mon].name : ITEMS[p.item].name;
    if (!(await yesNo(`${name} for ${p.cost} coins?`))) continue;
    addCoins(-p.cost);
    if (p.mon) {
      const m = makeMon(p.mon, 10);
      const where = addMon(m);
      await say(`You got ${name.toUpperCase()}!${where === "box" ? " (Sent to the box.)" : ""}`);
    } else {
      S.bag[p.item] = (S.bag[p.item] || 0) + 1;
      await say(`You got ${name.toUpperCase()}!`);
    }
    save();
  }
}
async function needCoins(min) {
  if (coins() >= min) return true;
  await say(min > 1 ? `You need at least ${min} coins to play here. The Coin Clerk sells them.` : "You don't have any coins! The Coin Clerk sells them.");
  return false;
}

// ---------------------------------------------------------------- shared drawing
function felt(x, y, w, h, col = "#1d6b3a") {
  ctx.fillStyle = "#4a2a14"; ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.fillStyle = col; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.fillRect(x, y, w, 2);
}
function coinBar(label) {
  ctx.fillStyle = "#201028"; ctx.fillRect(0, 0, VW, 14);
  text(label, 6, 3, "#f8d848", null);
  const t = `COINS ${String(coins()).padStart(4, "0")}`;
  text(t, VW - textW(t) - 6, 3, "#ffffff", null);
}

// ---------------------------------------------------------------- slots
// Each reel is a strip of symbols; a spin stops each reel on a random place. Only the middle line pays.
// 7 = lucky seven, B = BAR, M = monster, P = Tuxeball, C = berry. Payouts are multiples of the bet.
const SLOT_REELS = {
  0: "CPMCBPCMPC7PCMBC".split(""),
  1: "PCMBPCPM7CPCMBPC".split(""),
  2: "MCPBCPMC7PCBMPCP".split(""),
};
const SLOT_PAY = {
  "777": 100, "BBB": 30, "MMM": 15, "PPP": 8, "CCC": 5,
};
// three of a kind pays from the table; two 7s pay 5; a berry on the first reel gives your bet back
function slotPay(r) {
  const k = r.join("");
  if (SLOT_PAY[k]) return SLOT_PAY[k];
  if (r.filter((s) => s === "7").length === 2) return 5;
  if (r[0] === "C") return 1;
  return 0;
}
function drawSym(s, x, y) { // a 32x20 cell
  if (s === "7") {
    ctx.font = "16px PS"; ctx.textBaseline = "top";
    ctx.fillStyle = "#601010"; ctx.fillText("7", x + 10, y + 3);
    ctx.fillStyle = "#e02828"; ctx.fillText("7", x + 9, y + 2);
    ctx.font = "8px PS";
  } else if (s === "B") {
    ctx.fillStyle = "#202020"; ctx.fillRect(x + 4, y + 5, 24, 11);
    text("BAR", x + 5, y + 7, "#f8d848", null);
  } else if (s === "M") {
    const im = IMG.mon_agnite; if (im) ctx.drawImage(im, 0, 64, 24, 24, x + 6, y - 2, 22, 22);
  } else if (s === "P") {
    if (IMG.tuxeball) ctx.drawImage(IMG.tuxeball, 0, 16, 16, 16, x + 8, y + 2, 16, 16); // the ball is the sheet's lower half
  } else if (s === "C") {
    const im = IMG.item_berry_fire; if (im) ctx.drawImage(im, x + 8, y + 2, 16, 16);
  }
}
function slotMachine() {
  return new Promise((res) => {
    const L = 16, CELL = 20;
    const reels = [0, 1, 2].map((i) => ({ strip: SLOT_REELS[i], pos: Math.floor(Math.random() * L), spinning: false, stopAt: null }));
    push({
      opaque: true, bet: 1, state: "idle", win: 0, flash: 0, msg: "UP/DOWN bet   Z spin   X leave",
      update(dt) {
        this.flash = Math.max(0, this.flash - dt);
        for (const r of reels) {
          if (!r.spinning) continue;
          const before = r.pos;
          r.pos = (r.pos + dt * 15) % L;
          if (r.stopAt != null) { // stop as the target comes round
            const passed = before <= r.stopAt ? r.pos >= r.stopAt || r.pos < before : r.pos >= r.stopAt && r.pos < before;
            if (passed) { r.pos = r.stopAt; r.spinning = false; r.stopAt = null; }
          }
        }
        if (this.state === "idle") {
          if (consume("up")) this.bet = Math.min(3, this.bet + 1);
          if (consume("down")) this.bet = Math.max(1, this.bet - 1);
          if (consume("b")) { pop(this); res(); return; }
          if (consume("a")) {
            if (coins() < this.bet) { this.msg = coins() ? "Not enough coins for that bet." : "Out of coins! Buy more at the clerk."; return; }
            addCoins(-this.bet); this.win = 0;
            for (const r of reels) { r.spinning = true; r.stopAt = null; }
            this.state = "spin"; this.stops = 0; this.msg = "Z to stop each reel";
          }
        } else if (this.state === "spin") {
          if (consume("a") && this.stops < 3) {
            const r = reels[this.stops++];
            r.stopAt = Math.floor(Math.random() * L); // where it lands is pure chance
          }
          if (this.stops === 3 && reels.every((r) => !r.spinning)) {
            const line = reels.map((r) => r.strip[Math.round(r.pos) % L]);
            this.win = slotPay(line) * this.bet;
            if (this.win) { addCoins(this.win); this.flash = 1.5; this.msg = line.join("") === "777" ? `JACKPOT! +${this.win}` : `WIN! +${this.win} coins`; }
            else this.msg = "No luck. Z to spin again";
            this.state = "idle"; save();
          }
        }
      },
      draw() {
        ctx.fillStyle = "#3a1848"; ctx.fillRect(0, 0, VW, VH);
        // the cabinet
        ctx.fillStyle = "#e0a020"; ctx.fillRect(30, 20, 180, 112);
        ctx.fillStyle = "#b06a10"; ctx.fillRect(34, 24, 172, 104);
        coinBar("SLOTS");
        text(`BET ${this.bet}`, 40, 30, "#fff", "#402000");
        const wt = `WIN ${String(this.win).padStart(4, "0")}`;
        text(wt, 200 - textW(wt), 30, this.flash && Math.floor(NOW * 8) % 2 ? "#ffff80" : "#fff", "#402000");
        reels.forEach((r, i) => {
          const x = 54 + i * 46, y = 44;
          ctx.fillStyle = "#f4f0e8"; ctx.fillRect(x, y, 36, CELL * 3);
          ctx.save(); ctx.beginPath(); ctx.rect(x, y, 36, CELL * 3); ctx.clip();
          const f = r.pos % 1, base = Math.floor(r.pos);
          for (let k = -2; k <= 2; k++) drawSym(r.strip[(((base + k) % L) + L) % L], x + 2, y + CELL + (k - f) * CELL);
          ctx.restore();
          ctx.fillStyle = "rgba(0,0,0,0.12)"; ctx.fillRect(x, y, 36, 6); ctx.fillRect(x, y + CELL * 3 - 6, 36, 6);
        });
        // the paying line, lit for each coin bet
        ctx.fillStyle = this.flash && Math.floor(NOW * 8) % 2 ? "#ffff60" : "#ff3030";
        ctx.fillRect(48, 44 + CELL + 9, 4, 3); ctx.fillRect(188, 44 + CELL + 9, 4, 3);
        for (let b = 0; b < 3; b++) { ctx.fillStyle = b < this.bet ? "#ff4040" : "#602020"; ctx.fillRect(92 + b * 9, 31, 6, 6); }
        text("777 x100   BAR x30  MON x15", 40, 108, "#fff4c0", "#402000");
        text("BALL x8  BERRY x5  2x7 x5", 40, 118, "#fff4c0", "#402000");
        box(0, 136, VW, 24, "#f8f0d8"); text(this.msg, 8, 144);
      },
    });
  });
}

// ---------------------------------------------------------------- roulette
const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const numCol = (n) => (n === 0 ? "#1a8a3a" : REDS.has(n) ? "#c82020" : "#202020");
const RBETS = [
  ["RED", 1, (n) => REDS.has(n)], ["BLACK", 1, (n) => n && !REDS.has(n)], ["ODD", 1, (n) => n % 2 === 1], ["EVEN", 1, (n) => n && n % 2 === 0],
  ["1-18", 1, (n) => n >= 1 && n <= 18], ["19-36", 1, (n) => n >= 19], ["1st 12", 2, (n) => n >= 1 && n <= 12],
  ["2nd 12", 2, (n) => n >= 13 && n <= 24], ["3rd 12", 2, (n) => n >= 25], ["NUMBER", 35, null],
];
async function pickWager(prompt) {
  const amts = [5, 10, 50, 100, 500].filter((a) => a <= coins());
  if (!amts.length) return 0;
  const c = await choose(amts.map((a) => `${a} COINS`), { prompt: `${prompt} You have ${coins()} coins.` });
  return c < 0 ? 0 : amts[c];
}
function spinWheel(result) {
  return new Promise((res) => {
    const slot = (Math.PI * 2) / 37, idx = WHEEL.indexOf(result);
    const T = 3.2, wheel0 = Math.random() * 7, ballEnd = -Math.PI / 2; // the ball lands at the top
    const wheelEnd = wheel0 + 6 * Math.PI, ballSpin = 10 * Math.PI;
    const t0 = NOW;
    push({
      opaque: true,
      update() { if (NOW - t0 > T + 1.2) { pop(this); res(); } },
      draw() {
        ctx.fillStyle = "#2a1020"; ctx.fillRect(0, 0, VW, VH);
        coinBar("ROULETTE");
        const k = Math.min(1, (NOW - t0) / T), e = 1 - Math.pow(1 - k, 3);
        // the wheel turns so the winning pocket ends at the top, under the ball
        const wa = wheel0 + (wheelEnd - wheel0) * e;
        const finalOffset = ballEnd - (idx + 0.5) * slot;
        const rot = wa + (finalOffset - wheelEnd) * e;
        const cx = 120, cy = 82, R = 58;
        ctx.fillStyle = "#6a3a14"; ctx.beginPath(); ctx.arc(cx, cy, R + 6, 0, 7); ctx.fill();
        WHEEL.forEach((n, i) => {
          ctx.fillStyle = numCol(n);
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, rot + i * slot, rot + (i + 1) * slot); ctx.closePath(); ctx.fill();
        });
        ctx.fillStyle = "#c8a050"; ctx.beginPath(); ctx.arc(cx, cy, R * 0.55, 0, 7); ctx.fill();
        ctx.fillStyle = "#7a4a1a"; ctx.beginPath(); ctx.arc(cx, cy, R * 0.4, 0, 7); ctx.fill();
        // the ball spirals in from the rim
        const ba = ballEnd + ballSpin * (1 - e), br = R + 2 - (R * 0.12) * e;
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(cx + Math.cos(ba) * br, cy + Math.sin(ba) * br, 2.5, 0, 7); ctx.fill();
        if (k >= 1) { box(84, 140, 72, 18, numCol(result)); text(String(result), 120 - textW(String(result)) / 2, 145, "#fff", null); }
      },
    });
  });
}
async function roulette() {
  if (!(await needCoins(5))) return;
  for (;;) {
    const c = await choose(RBETS.map(([n, p]) => `${n.padEnd(7)}${p}:1`), { cols: 2, x: 8, y: 30, prompt: `Croupier: Place your bet! You have ${coins()} coins.` });
    if (c < 0) return;
    let [name, pays, wins] = RBETS[c];
    if (!wins) {
      const nums = [...Array(37).keys()];
      const k = await choose(nums.map(String), { cols: 6, x: 60, y: 4, prompt: "Which number? It pays 35 to 1." });
      if (k < 0) continue;
      name = String(k); wins = (n) => n === k;
    }
    const bet = await pickWager(`${name}: how much?`);
    if (!bet) { if (!coins()) { await say("You're out of coins!"); return; } continue; }
    addCoins(-bet);
    const result = Math.floor(Math.random() * 37);
    await spinWheel(result);
    const col = result === 0 ? "GREEN" : REDS.has(result) ? "RED" : "BLACK";
    if (wins(result)) { addCoins(bet * (pays + 1)); await say(`${result} ${col}! You win ${bet * pays} coins!`); }
    else await say(`${result} ${col}. The house wins this time.`);
    save();
    if (!coins() || !(await yesNo("Play again?"))) return;
  }
}

// ---------------------------------------------------------------- blackjack
const SUITS = ["S", "H", "D", "C"];
function newShoe() { // 4 decks, shuffled fresh each hand
  const d = [];
  for (let k = 0; k < 4; k++) for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) d.push({ r, s });
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}
function handValue(h) {
  let v = 0, aces = 0;
  for (const c of h) { v += Math.min(10, c.r); if (c.r === 1) aces++; }
  while (aces-- > 0 && v + 10 <= 21) v += 10;
  return v;
}
const isBJ = (h) => h.length === 2 && handValue(h) === 21;
function drawSuit(s, x, y, col) {
  ctx.fillStyle = col;
  if (s === 1) { ctx.beginPath(); ctx.arc(x + 2, y + 2, 2, 0, 7); ctx.arc(x + 5, y + 2, 2, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, y + 3); ctx.lineTo(x + 7, y + 3); ctx.lineTo(x + 3.5, y + 7); ctx.fill(); }
  else if (s === 2) { ctx.beginPath(); ctx.moveTo(x + 3.5, y); ctx.lineTo(x + 7, y + 3.5); ctx.lineTo(x + 3.5, y + 7); ctx.lineTo(x, y + 3.5); ctx.fill(); }
  else if (s === 0) { ctx.beginPath(); ctx.moveTo(x + 3.5, y); ctx.lineTo(x + 7, y + 4); ctx.lineTo(x, y + 4); ctx.fill(); ctx.beginPath(); ctx.arc(x + 2, y + 4, 2, 0, 7); ctx.arc(x + 5, y + 4, 2, 0, 7); ctx.fill(); ctx.fillRect(x + 3, y + 5, 1, 3); }
  else { ctx.beginPath(); ctx.arc(x + 3.5, y + 1.5, 1.8, 0, 7); ctx.arc(x + 1.5, y + 4, 1.8, 0, 7); ctx.arc(x + 5.5, y + 4, 1.8, 0, 7); ctx.fill(); ctx.fillRect(x + 3, y + 4, 1, 4); }
}
function drawCard(c, x, y, hidden) {
  ctx.fillStyle = "#202020"; ctx.fillRect(x - 1, y - 1, 24, 32);
  if (hidden) { ctx.fillStyle = "#2850b8"; ctx.fillRect(x, y, 22, 30); ctx.fillStyle = "#6a8ae0"; for (let i = 2; i < 28; i += 4) ctx.fillRect(x + 2, y + i, 18, 1); return; }
  ctx.fillStyle = "#fbfbf6"; ctx.fillRect(x, y, 22, 30);
  const red = c.s === 1 || c.s === 2, col = red ? "#d02020" : "#202020";
  const rank = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][c.r - 1];
  text(rank, x + 2, y + 2, col, null);
  drawSuit(c.s, x + 8, y + 17, col);
}
async function blackjack() {
  if (!(await needCoins(5))) return;
  const table = push({
    opaque: true, dealer: [], player: [], hide: true, note: "",
    update() {},
    draw() {
      ctx.fillStyle = "#24101c"; ctx.fillRect(0, 0, VW, VH);
      coinBar("BLACKJACK");
      felt(8, 20, 224, 90);
      text("DEALER" + (this.dealer.length ? (this.hide ? "" : `  ${handValue(this.dealer)}`) : ""), 14, 23, "#d8f0d8", null);
      this.dealer.forEach((c, i) => drawCard(c, 14 + i * 26, 33, this.hide && i === 1));
      text("YOU" + (this.player.length ? `  ${handValue(this.player)}` : "") + (this.bet ? `   BET ${this.bet}` : ""), 14, 66, "#d8f0d8", null);
      this.player.forEach((c, i) => drawCard(c, 14 + i * 20, 76, false));
      if (this.note) text(this.note, 226 - textW(this.note), 50, "#fff4a0", null);
    },
  });
  try {
    for (;;) {
      Object.assign(table, { dealer: [], player: [], hide: true, note: "BJ PAYS 3:2", bet: 0 });
      let msg = "";
      const bet = await pickWager("Dealer: Your bet?");
      if (!bet) return;
      addCoins(-bet); table.bet = bet;
      const shoe = newShoe();
      table.player.push(shoe.pop()); table.dealer.push(shoe.pop()); table.player.push(shoe.pop()); table.dealer.push(shoe.pop());
      let done = false, pay = 0;
      if (isBJ(table.player) || isBJ(table.dealer)) { // naturals settle at once
        table.hide = false; done = true;
        if (isBJ(table.player) && isBJ(table.dealer)) { pay = bet; table.note = "PUSH"; msg = "Both have blackjack. Push."; }
        else if (isBJ(table.player)) { pay = bet + Math.floor(bet * 1.5); table.note = "BLACKJACK!"; msg = `Blackjack! You win ${Math.floor(bet * 1.5)} coins.`; }
        else { table.note = "DEALER BJ"; msg = "The dealer has blackjack."; }
      }
      while (!done) {
        const canDouble = table.player.length === 2 && coins() >= table.bet;
        const c = await choose(["HIT", "STAND", { label: "DOUBLE", disabled: !canDouble }], { x: 160, y: 68, w: 76, cancel: false });
        if (c === 0) table.player.push(shoe.pop());
        if (c === 2) { addCoins(-table.bet); table.bet *= 2; table.player.push(shoe.pop()); }
        if (handValue(table.player) > 21) { table.hide = false; table.note = "BUST"; msg = "Bust! Over 21."; done = true; break; }
        if (c === 1 || c === 2 || handValue(table.player) === 21) break;
      }
      if (!done) { // dealer draws to 17
        table.hide = false;
        while (handValue(table.dealer) < 17) { await wait(0.45); table.dealer.push(shoe.pop()); }
        const p = handValue(table.player), d = handValue(table.dealer);
        if (d > 21 || p > d) { pay = table.bet * 2; table.note = "YOU WIN"; msg = `${d > 21 ? "Dealer busts!" : "You win!"} +${table.bet} coins.`; }
        else if (p === d) { pay = table.bet; table.note = "PUSH"; msg = "Push. Your bet comes back."; }
        else { table.note = "DEALER WINS"; msg = "The dealer wins."; }
      }
      addCoins(pay); save();
      await wait(0.6);
      if (!coins()) { await say(`${msg} You're out of coins!`); return; }
      if (!(await yesNo(`${msg} Play again?`))) return;
    }
  } finally { pop(table); }
}
