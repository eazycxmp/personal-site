// World content: maps, buildings, trainers, gyms, encounters.
// Outdoor maps are built from rectangle ops over a grass field with a 2-tile tree border.
// Tile chars: . grass  , tall grass  T tree  ~ water  = path  f flowers  F fence
(function () {
  const W = {};

  // Building art rects in core_buildings.png, footprint in tiles, door column.
  const BUILDINGS = {
    center: { src: [320, 80, 80, 64], tw: 5, th: 4, door: 2 },
    mart:   { src: [160, 80, 80, 64], tw: 5, th: 4, door: 2 },
    gym:    { src: [578, 666, 124, 118], tw: 8, th: 8, door: 3 },
    house:  { src: [114, 310, 76, 90], tw: 5, th: 6, door: 3 },
    house2: { src: [194, 310, 76, 90], tw: 5, th: 6, door: 3 },
    lab:    { src: [579, 448, 107, 190], tw: 7, th: 12, door: 3 },
    hall:   { src: [579, 255, 138, 177], tw: 9, th: 12, door: 4 },
  };

  function outdoor(def) {
    const g = [];
    for (let y = 0; y < def.h; y++) {
      const row = [];
      for (let x = 0; x < def.w; x++) {
        row.push(x < 2 || y < 2 || x >= def.w - 2 || y >= def.h - 2 ? "T" : ".");
      }
      g.push(row);
    }
    for (const [ch, x, y, w, h] of def.ops || []) {
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
        if (j >= 0 && i >= 0 && j < def.h && i < def.w) g[j][i] = ch;
      }
    }
    def.grid = g;
    return def;
  }

  const trainer = (o) => Object.assign({ kind: "trainer", sight: 4 }, o);

  // ---------------- Sprout Town ----------------
  W.sprout = outdoor({
    name: "Sprout Town", w: 26, h: 22, music: "chill", bg: "grass",
    ops: [
      ["=", 11, 0, 2, 20], ["=", 6, 9, 6, 1], ["=", 6, 18, 6, 1], ["=", 12, 15, 8, 1],
      ["f", 14, 17, 3, 2], ["f", 21, 17, 3, 2], ["f", 2, 10, 3, 1], ["~", 18, 17, 3, 2],
      ["T", 8, 2, 2, 2],
    ],
    exits: [{ edge: "n", at: 11, w: 2, to: "route1" }],
    buildings: [
      { type: "house", x: 3, y: 3, to: "home" },
      { type: "house2", x: 3, y: 12, to: "sprout_house" },
      { type: "lab", x: 16, y: 3, to: "lab" },
    ],
    signs: [{ x: 13, y: 9, text: "SPROUT TOWN\nWhere every journey begins." }],
    npcs: [
      { sprite: "picnicker", x: 9, y: 13, dir: "down", name: "Kid",
        talk: ["The tall grass up north is full\nof wild monsters!", "Walk through it and one might\njump out at you!"] },
    ],
  });

  // ---------------- Route 1 ----------------
  W.route1 = outdoor({
    name: "Route 1", w: 22, h: 40, music: "route", bg: "grass",
    ops: [
      ["=", 10, 30, 2, 10], ["=", 10, 0, 2, 22],
      [",", 4, 22, 14, 8], [",", 12, 4, 8, 6], [",", 2, 6, 6, 6], [",", 2, 32, 6, 4],
      ["T", 2, 14, 6, 4], ["T", 14, 12, 6, 6], ["f", 14, 32, 4, 2], ["F", 13, 36, 6, 1],
    ],
    exits: [{ edge: "s", at: 10, w: 2, to: "sprout" }, { edge: "n", at: 10, w: 2, to: "ember" }],
    signs: [{ x: 12, y: 37, text: "ROUTE 1\nNorth: Ember City" }],
    npcs: [
      trainer({ id: "r1_pic", outfit: "ranger", sprite: "catgirl_green", x: 8, y: 19, dir: "right", name: "Ranger Lia",
        team: [["katapill", 3], ["stonifly", 3]], intro: "I patrol these woods. Let's see how you treat your monsters!", lose: "You've got a ranger's instincts." }),
      trainer({ id: "r1_cool", outfit: "ranger", sprite: "adventurer_green", x: 14, y: 3, dir: "left", name: "Ranger Rex",
        team: [["banling", 4], ["rockitten", 5]], intro: "Halt! Every trainer on my trail gets tested!", lose: "Trail's yours. Stay on the path!" }),
    ],
    rate: 0.12,
    encounters: [
      ["memnomnom", 2, 4, 3], ["eyenemy", 2, 4, 3], ["katapill", 2, 4, 3], ["stonifly", 3, 5, 2],
      ["virware", 3, 5, 2], ["nut", 3, 5, 2], ["slichen", 3, 5, 2], ["rockitten", 3, 5, 1], ["spighter", 4, 5, 1],
    ],
  });

  // ---------------- Ember City (Gym 1: Earth) ----------------
  W.ember = outdoor({
    name: "Ember City", w: 30, h: 24, music: "funky", bg: "grass",
    ops: [
      ["=", 12, 8, 2, 16], ["=", 2, 11, 28, 2], ["=", 6, 8, 7, 1], ["=", 7, 19, 6, 1],
      ["=", 13, 21, 11, 1], ["f", 15, 15, 4, 3], ["f", 2, 8, 2, 2], ["T", 26, 2, 2, 8],
      ["T", 14, 2, 2, 4],
    ],
    exits: [{ edge: "s", at: 12, w: 2, to: "route1" }, { edge: "e", at: 11, w: 2, to: "route2" }],
    buildings: [
      { type: "center", x: 4, y: 4, to: "ember_center" },
      { type: "mart", x: 9, y: 4, to: "ember_mart" },
      { type: "gym", x: 18, y: 3, to: "ember_gym" },
      { type: "house", x: 4, y: 13, to: "ember_house" },
      { type: "house2", x: 20, y: 15, to: "ember_house2" },
    ],
    gates: [{ x: 27, y: 11, w: 1, h: 2, badges: 1, block: "e", text: "GUARD: The road east is rough.\nCome back with the Rock Badge!" }],
    signs: [{ x: 14, y: 13, text: "EMBER CITY\nGym Leader: BRACK\n\"Solid as bedrock.\"" }],
    npcs: [
      { sprite: "soldier", x: 27, y: 10, dir: "down", name: "Guard",
        talk: ["Only trainers with the Rock Badge\nmay pass east."] },
      { sprite: "granny", x: 10, y: 16, dir: "left", name: "Granny",
        talk: ["Brack's monsters are EARTH type.", "FIRE and VENOM moves don't hurt\nthem much, dear. Try WATER or\nWOOD!"] },
    ],
  });

  // ---------------- Route 2 ----------------
  W.route2 = outdoor({
    name: "Route 2", w: 44, h: 18, music: "route", bg: "forest",
    ops: [
      ["=", 0, 8, 44, 2], [",", 8, 4, 8, 10], [",", 22, 2, 6, 6], [",", 24, 11, 8, 5],
      [",", 34, 4, 6, 10], ["~", 17, 12, 4, 4], ["T", 16, 2, 4, 4], ["T", 30, 2, 4, 4],
      ["f", 2, 4, 4, 2], ["F", 2, 12, 5, 1],
    ],
    exits: [{ edge: "w", at: 8, w: 2, to: "ember" }, { edge: "e", at: 8, w: 2, to: "tide" }],
    signs: [{ x: 4, y: 7, text: "ROUTE 2\nEast: Tide Harbor" }],
    npcs: [
      trainer({ id: "rival_r2", rival: true, sprite: "adventurer", x: 6, y: 7, dir: "down", sight: 2, name: "$rival",
        team: [["$rivalstarter", 12], ["seirein", 11]],
        intro: "There you are! I beat the Ember Gym too. Time for a rematch!", lose: "Argh! Fine, I'm heading to Tide Harbor. Don't fall behind!" }),
      trainer({ id: "r2_fish", outfit: "ranger", sprite: "rogue_green", x: 19, y: 11, dir: "up", sight: 3, name: "Ranger Gil",
        team: [["fordin", 9], ["lambert", 10]], intro: "Shh, you'll spook the wildlife. Battle quietly!", lose: "Nature favors you today." }),
      trainer({ id: "r2_ten", outfit: "ranger", sprite: "monk_green", x: 28, y: 6, dir: "down", sight: 3, name: "Ranger Tia",
        team: [["merlicun", 10], ["trapsnap", 10]], intro: "These moths only come out at dusk. Want to meet them?", lose: "Fluttered away..." }),
      trainer({ id: "r2_flo", outfit: "ranger", sprite: "woodnymph", x: 38, y: 12, dir: "up", name: "Forest Keeper Ivy",
        team: [["rosarin", 11], ["banling", 10], ["slichen", 11]], intro: "The forest speaks through my monsters!", lose: "The forest is at peace with you." }),
    ],
    rate: 0.12,
    encounters: [
      ["seirein", 7, 10, 3], ["merlicun", 7, 10, 3], ["fordin", 8, 11, 2], ["lambert", 8, 11, 2],
      ["komodraw", 8, 11, 2], ["pythwire", 9, 12, 2], ["masknake", 9, 12, 1], ["hydrone", 9, 12, 1],
      ["cateye", 8, 11, 1], ["toufigel", 8, 11, 1], ["sludgehog", 9, 12, 1], ["nostray", 8, 11, 2], ["vamporm", 7, 10, 2],
    ],
  });

  // ---------------- Tide Harbor (Gym 2: Water) ----------------
  W.tide = outdoor({
    name: "Tide Harbor", w: 30, h: 32, music: "town", bg: "beach",
    ops: [
      ["~", 0, 19, 30, 11], [".", 11, 23, 7, 4], [",", 12, 24, 5, 2], ["=", 0, 18, 30, 1], ["=", 0, 7, 28, 2], ["=", 26, 0, 2, 18],
      ["=", 7, 17, 20, 1], ["f", 12, 11, 3, 3], ["T", 12, 2, 2, 4],
    ],
    exits: [{ edge: "w", at: 7, w: 2, to: "route2" }, { edge: "n", at: 26, w: 2, to: "route3" }],
    buildings: [
      { type: "center", x: 2, y: 2, to: "tide_center" },
      { type: "mart", x: 7, y: 2, to: "tide_mart" },
      { type: "gym", x: 16, y: 9, to: "tide_gym" },
      { type: "house2", x: 3, y: 11, to: "tide_house" },
    ],
    gates: [{ x: 26, y: 3, w: 2, h: 1, badges: 2, block: "n", text: "GUARD: Route 3 is for trainers\nwith 2 badges or more!" }],
    signs: [{ x: 15, y: 15, text: "TIDE HARBOR\nGym Leader: MARINA\n\"Waves wear down mountains.\"" },
      { x: 17, y: 23, text: "SEA SHRINE\nOnly those who ride\nthe waves reach here." }],
    npcs: [
      { sprite: "soldier", x: 25, y: 3, dir: "right", name: "Guard",
        talk: ["Two badges, then you may pass\nnorth to Route 3."] },
      { sprite: "beachcomber", x: 10, y: 15, dir: "down", name: "Beachcomber",
        talk: ["Marina's WATER monsters hate\nWOOD and LIGHTNING attacks!",
          "See that island out at sea? With the TIDE BADGE, a Water monster can carry you there."] },
      trainer({ id: "sea_hermit", outfit: "sailor", sprite: "riverboatcaptain", x: 14, y: 23, dir: "down", sight: 0, name: "Sea Hermit",
        team: [["manosting", 22], ["gupphish", 23], ["spirain", 24]],
        intro: "Few ever reach my shrine. Show me the strength that carried you here!", lose: "The sea chose well. Rare creatures hide in the shrine grass." }),
    ],
    rate: 0.15,
    encounters: [["medushock", 20, 24, 2], ["manosting", 20, 24, 2], ["spirain", 18, 22, 2], ["mingdyn", 22, 25, 1], ["gupphish", 19, 23, 2]],
  });

  // ---------------- Route 3 ----------------
  W.route3 = outdoor({
    name: "Route 3", w: 22, h: 44, music: "route", bg: "forest",
    ops: [
      ["=", 10, 0, 2, 44], [",", 2, 34, 18, 6], [",", 12, 22, 8, 8], [",", 2, 18, 7, 8],
      [",", 4, 4, 14, 6], ["T", 14, 12, 6, 6], ["T", 2, 28, 6, 4], ["~", 14, 30, 4, 2],
      ["f", 2, 12, 4, 2],
    ],
    exits: [{ edge: "s", at: 10, w: 2, to: "tide" }, { edge: "n", at: 10, w: 2, to: "volt" }],
    npcs: [
      trainer({ id: "rival_r3", rival: true, sprite: "adventurer", x: 12, y: 3, dir: "left", sight: 3, name: "$rival",
        team: [["$rivalstarter", 20], ["spirain", 19], ["banling", 19]],
        intro: "Volt City is just ahead. Let's see who's ready for the Volt Gym!", lose: "You're getting really strong... I'll see you at the top!" }),
      trainer({ id: "r3_ninja", outfit: "ranger", sprite: "dragonrider_green", x: 6, y: 32, dir: "right", sight: 5, name: "Mountain Ranger Kaz",
        team: [["katapill", 15], ["foxfire", 16]], intro: "Mountain rangers move unseen. Surprise!", lose: "You spotted me after all." }),
      trainer({ id: "r3_sci", outfit: "ranger", sprite: "miner_green", x: 15, y: 20, dir: "left", sight: 5, name: "Mountain Ranger Ohm",
        team: [["pawsand", 16], ["grintot", 16], ["stonifly", 15]], intro: "I guard the high trail. Rock-solid monsters only!", lose: "Crumbled like a landslide." }),
      trainer({ id: "r3_goth", outfit: "ranger", sprite: "disciple_green", x: 6, y: 11, dir: "right", sight: 5, name: "Mountain Ranger Raven",
        team: [["turnipper", 17], ["banling", 17], ["toufigel", 17]], intro: "The pines whisper of a strong trainer...", lose: "The whispers were right." }),
    ],
    rate: 0.12,
    encounters: [
      ["banling", 13, 17, 3], ["demosnow", 14, 17, 2], ["chromeye", 13, 17, 2], ["pawsand", 14, 18, 2],
      ["potturmeist", 13, 17, 2], ["stomic", 14, 18, 2], ["spirain", 14, 18, 2], ["ignibus", 15, 19, 1],
      ["mystikapi", 15, 19, 1], ["spycozeus", 15, 19, 1], ["joulraton", 15, 19, 1], ["urcheedle", 14, 18, 1],
      ["flacono", 13, 17, 2],
    ],
  });

  // ---------------- Volt City (Gym 3: Lightning) ----------------
  W.volt = outdoor({
    name: "Volt City", w: 30, h: 24, music: "wild", bg: "grass",
    ops: [
      ["=", 12, 8, 2, 16], ["=", 0, 11, 28, 2], ["=", 13, 20, 11, 1], ["f", 2, 15, 4, 3],
      ["T", 26, 14, 2, 8], ["T", 2, 2, 2, 6],
    ],
    exits: [{ edge: "s", at: 12, w: 2, to: "route3" }, { edge: "w", at: 11, w: 2, to: "route4" }],
    buildings: [
      { type: "center", x: 4, y: 3, to: "volt_center" },
      { type: "mart", x: 9, y: 3, to: "volt_mart" },
      { type: "gym", x: 17, y: 2, to: "volt_gym" },
      { type: "house", x: 18, y: 14, to: "volt_house" },
    ],
    gates: [{ x: 2, y: 11, w: 1, h: 2, badges: 3, block: "w", text: "GUARD: Shade Hollow is dangerous.\nYou need 3 badges!" }],
    signs: [{ x: 14, y: 14, text: "VOLT CITY\nGym Leader: VOLTA\n\"Shockingly fast.\"" }],
    npcs: [
      { sprite: "soldier", x: 3, y: 10, dir: "down", name: "Guard", talk: ["Three badges to head west."] },
      { sprite: "cooldude", x: 15, y: 17, dir: "left", name: "Dude",
        talk: ["Volta's LIGHTNING monsters can't\nstand EARTH attacks!"] },
    ],
  });

  // ---------------- Route 4 ----------------
  W.route4 = outdoor({
    name: "Route 4", w: 44, h: 18, music: "route", bg: "forest",
    ops: [
      ["=", 0, 8, 44, 2], [",", 4, 2, 10, 14], [",", 18, 10, 10, 6], [",", 30, 2, 8, 6],
      [",", 32, 10, 8, 6], ["T", 18, 2, 6, 4], ["~", 26, 3, 3, 3], ["f", 40, 3, 2, 3],
    ],
    exits: [{ edge: "e", at: 8, w: 2, to: "volt" }, { edge: "w", at: 8, w: 2, to: "shade" }],
    npcs: [
      trainer({ id: "r4_knight", outfit: "nightranger", sprite: "adventurer_green", x: 35, y: 6, dir: "down", sight: 3, name: "Night Ranger Gareth",
        team: [["furnursus", 24], ["metesaur", 25]], intro: "Nobody crosses the dark woods without a ranger's say-so!", lose: "Go on, but watch the shadows." }),
      trainer({ id: "r4_drag", outfit: "nightranger", sprite: "dragonrider_green", x: 22, y: 12, dir: "up", sight: 4, name: "Night Ranger Sol",
        team: [["chloragon", 25], ["devidin", 24], ["metesaur", 25]], intro: "My dragons hunt at night. Ready?", lose: "Even dragons rest." }),
      trainer({ id: "r4_witch", outfit: "nightranger", sprite: "rogue_green", x: 9, y: 6, dir: "down", sight: 3, name: "Night Ranger Morgana",
        team: [["babysnitch", 25], ["hoarse", 26], ["demosnow", 25]], intro: "Strange things live in these woods. I keep them in line!", lose: "You'd make a fine night ranger." }),
    ],
    rate: 0.12,
    encounters: [
      ["metesaur", 20, 24, 2], ["hissiorite", 20, 24, 2], ["nebufin", 21, 25, 2], ["poinchin", 20, 24, 2],
      ["turnipper", 20, 24, 2], ["furnursus", 21, 25, 2], ["sprorm", 21, 25, 2], ["gupphish", 21, 25, 1],
      ["manosting", 22, 26, 1], ["ghosteeth", 22, 26, 1], ["lunight", 22, 26, 1], ["solight", 22, 26, 1],
      ["medushock", 23, 27, 1], ["volcoli", 23, 27, 1], ["djinnbo", 24, 27, 1], ["mingdyn", 24, 27, 1],
      ["drokoro", 25, 27, 1], ["ziggurat", 25, 27, 1], ["yiinaang", 25, 27, 1], ["uf0", 22, 26, 1],
    ],
  });

  // ---------------- Shade Hollow (Gym 4: Shadow + Champion Hall) ----------------
  W.shade = outdoor({
    name: "Shade Hollow", w: 30, h: 26, music: "mystery", bg: "forest",
    ops: [
      ["=", 2, 16, 28, 2], ["=", 14, 14, 2, 2], ["=", 6, 15, 1, 1],
      ["f", 10, 19, 4, 2], ["T", 2, 2, 4, 6], ["T", 24, 2, 4, 4], ["~", 22, 20, 5, 3],
    ],
    exits: [{ edge: "e", at: 16, w: 2, to: "route4" }],
    buildings: [
      { type: "hall", x: 10, y: 2, to: "hall" },
      { type: "center", x: 4, y: 11, to: "shade_center" },
      { type: "mart", x: 4, y: 19, to: "shade_mart" },
      { type: "gym", x: 20, y: 6, to: "shade_gym" },
    ],
    gates: [{ x: 14, y: 14, w: 1, h: 1, badges: 4, block: "n", text: "GUARD: Only holders of all 4 badges\nmay challenge the Champion!" }],
    signs: [{ x: 16, y: 19, text: "SHADE HOLLOW\nGym Leader: MORROW\nNorth: CHAMPION'S HALL" }],
    npcs: [
      { sprite: "soldier", x: 15, y: 14, dir: "down", name: "Guard",
        talk: ["Beyond here is the Champion.\nYou need all 4 badges."] },
      { sprite: "magician", x: 9, y: 22, dir: "up", name: "Mystic",
        talk: ["Morrow's DARK monsters...", "...they say PSYCHIC and HEROIC\npower shines through darkness."] },
    ],
  });

  // ---------------- Interiors ----------------
  function interior(def) {
    def.interior = true;
    const g = [];
    for (let y = 0; y < def.h; y++) {
      const row = [];
      for (let x = 0; x < def.w; x++) row.push(y < 3 ? "W" : ".");
      g.push(row);
    }
    for (const [ch, x, y, w, h] of def.ops || []) {
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) g[j][i] = ch;
    }
    const ex = Math.floor(def.w / 2) - 1;
    g[def.h - 1][ex] = "X"; g[def.h - 1][ex + 1] = "X";
    def.grid = g;
    def.npcs = def.npcs || [];
    return def;
  }

  const center = (town) => interior({
    name: town + " Healing Center", w: 10, h: 9, music: "chill", wall: "cream", floor: "tile",
    ops: [["C", 2, 4, 6, 1]], decor: [[2, 1, "poster"], [7, 1, "board"]],
    npcs: [
      { sprite: "nurse", x: 4, y: 3, dir: "down", name: "Nurse", role: "heal" },
      { sprite: "scientist", x: 6, y: 3, dir: "down", name: "Box Clerk", role: "box" },
    ],
  });
  const mart = (town) => interior({
    name: town + " Mart", w: 10, h: 9, music: "chill", wall: "blue", floor: "planks",
    ops: [["C", 1, 4, 3, 1], ["C", 6, 3, 3, 1]], decor: [[5, 1, "board"]],
    npcs: [{ sprite: "shopkeeper", x: 2, y: 3, dir: "down", name: "Clerk", role: "shop" }],
  });
  const house = (name, npc) => interior({
    name, w: 8, h: 8, music: "chill", wall: "green", floor: "parquet", decor: [[2, 1, "poster"]], npcs: [npc],
  });

  W.home = house("Your House", { sprite: "homemaker", x: 3, y: 4, dir: "down", name: "Mom", role: "heal",
    healText: "Mom: You look tired, sweetie.\nLet your monsters rest a bit!" });
  W.sprout_house = house("Neighbor's House", { sprite: "heroine", x: 4, y: 4, dir: "down", name: "Neighbor",
    talk: ["Press X or ESC to open your menu.", "You can SAVE there, check your\nPARTY, and use items in your BAG."] });
  W.lab = interior({
    name: "Professor's Lab", w: 12, h: 10, music: "chill", wall: "blue", floor: "tile",
    ops: [["C", 1, 3, 3, 1], ["C", 8, 3, 3, 1]], decor: [[3, 1, "board"], [8, 1, "poster"]],
    npcs: [{ sprite: "professor", x: 5, y: 4, dir: "down", name: "Prof. Oakley", role: "prof" },
      trainer({ id: "rival_lab", rival: true, practice: true, sprite: "adventurer", x: 7, y: 5, dir: "left", sight: 0, name: "$rival",
        team: [["$rivalstarter", 4]], intro: "Wait! I picked my partner too. Let's see whose is stronger!",
        lose: "Not bad... but I'll get stronger. See you out there!", win: "Ha! I win! Better train up before we meet again!" })],
  });

  W.ember_center = center("Ember"); W.ember_mart = mart("Ember");
  W.ember_house = house("House", { sprite: "miner", x: 3, y: 4, dir: "down", name: "Miner",
    talk: ["Hold SHIFT to run.", "Faster feet, faster badges!"] });
  W.ember_house2 = house("House", { sprite: "fashionista", x: 4, y: 5, dir: "left", name: "Fashionista",
    talk: ["Monsters evolve when they reach\ncertain levels.", "Keep battling and you'll see!"] });
  W.tide_center = center("Tide"); W.tide_mart = mart("Tide");
  W.tide_house = house("House", { sprite: "swimmer", x: 3, y: 4, dir: "down", name: "Swimmer",
    talk: ["Weaken a wild monster before you\nthrow a Tuxeball.", "It's much easier to catch!"] });
  W.volt_center = center("Volt"); W.volt_mart = mart("Volt");
  W.volt_house = house("House", { sprite: "catgirl", x: 4, y: 4, dir: "down", name: "Kat",
    talk: ["Moves of the same type as the\nmonster using them hit harder!"] });
  W.shade_center = center("Shade"); W.shade_mart = mart("Shade");

  const gym = (name, wall, npcs, music, fight) => interior({
    name, w: 12, h: 14, music, fight, wall, floor: "gray", gym: true, rugs: [[4, 4], [4, 8]], npcs,
  });

  W.ember_gym = gym("Ember Gym", "cream", [
    trainer({ id: "g1_t1", outfit: "miner", sprite: "miner", x: 2, y: 9, dir: "right", sight: 5, name: "Miner Tobin",
      team: [["rockitten", 9]], intro: "Brack trains us hard. Ready?", lose: "Hmm. Solid." }),
    trainer({ id: "g1_t2", outfit: "miner", sprite: "miner_green", x: 9, y: 6, dir: "left", sight: 5, name: "Hiker Dale",
      team: [["stonifly", 8], ["scarlant", 8]], intro: "Rocks never lose!", lose: "...Except today." }),
    trainer({ id: "g1_leader", outfit: "miner", sprite: "miner", x: 5, y: 3, dir: "down", sight: 0, name: "Leader Brack", leader: 1,
      team: [["shull", 11], ["imbrickcile", 12], ["grintot", 12], ["pawsand", 13]],
      intro: "I'm Brack, the Ember Gym Leader!\nMy EARTH monsters are hard as\nstone. Show me what you've got!",
      lose: "You cracked my defense!\nTake the ROCK BADGE!", badge: "Rock Badge" }),
  ], "funky", "funkboss");
  W.tide_gym = gym("Tide Gym", "blue", [
    trainer({ id: "g2_t1", outfit: "sailor", sprite: "swimmer_blue", x: 2, y: 9, dir: "right", sight: 5, name: "Sailor Kai",
      team: [["nostray", 15], ["lesmagu", 15]], intro: "Ahoy! Ready to get soaked?", lose: "Washed overboard!" }),
    trainer({ id: "g2_t2", outfit: "sailor", sprite: "riverboatcaptain", x: 9, y: 6, dir: "left", sight: 5, name: "Captain Moe",
      team: [["jelillow", 16], ["spirain", 16]], intro: "All hands on deck! Battle stations!", lose: "Abandon ship!" }),
    trainer({ id: "g2_leader", outfit: "sailor", sprite: "swimmer", x: 5, y: 3, dir: "down", sight: 0, name: "Leader Marina", leader: 2,
      team: [["squink", 17], ["spirain", 18], ["gupphish", 19], ["shnark", 20]],
      intro: "Welcome to Tide Gym! I'm Marina.\nThe sea is calm... until it isn't!",
      lose: "Swept away! You've earned\nthe TIDE BADGE!", badge: "Tide Badge" }),
  ], "funky", "funkboss");
  W.volt_gym = gym("Volt Gym", "green", [
    trainer({ id: "g3_t1", outfit: "engineer", sprite: "firefighter", x: 2, y: 9, dir: "right", sight: 5, name: "Engineer Watt",
      team: [["chromeye", 22], ["fluoresfin", 22]], intro: "Feel the voltage!", lose: "Short circuit!" }),
    trainer({ id: "g3_t2", outfit: "engineer", sprite: "scientist_black", x: 9, y: 6, dir: "left", sight: 5, name: "Engineer Zia",
      team: [["joulraton", 23], ["boltnu", 23]], intro: "My circuits are faster than lightning!", lose: "Blew a fuse..." }),
    trainer({ id: "g3_leader", outfit: "engineer", sprite: "scientist", x: 5, y: 3, dir: "down", sight: 0, name: "Leader Volta", leader: 3,
      team: [["incandesfin", 24], ["exclawvate", 25], ["medushock", 26], ["ouroboutlet", 27]],
      intro: "I'm Volta! My LIGHTNING monsters\nstrike before you can blink!",
      lose: "Grounded at last!\nThe VOLT BADGE is yours!", badge: "Volt Badge" }),
  ], "route", "boss");
  W.shade_gym = gym("Shade Gym", "cream", [
    trainer({ id: "g4_t1", outfit: "occult", sprite: "goth_rose", x: 2, y: 9, dir: "right", sight: 5, name: "Hexer Nyx",
      team: [["cackleen", 28], ["seirein", 28]], intro: "Boo!", lose: "Spooked myself..." }),
    trainer({ id: "g4_t2", outfit: "occult", sprite: "magician_fiery", x: 9, y: 6, dir: "left", sight: 5, name: "Seer Ren",
      team: [["noctalo", 29], ["babysnitch", 29]], intro: "I foresaw this battle. And your defeat!", lose: "I... didn't see that coming." }),
    trainer({ id: "g4_leader", outfit: "occult", sprite: "magician", x: 5, y: 3, dir: "down", sight: 0, name: "Leader Morrow", leader: 4,
      team: [["brumi", 31], ["yiinaang", 32], ["baddrscratch", 33], ["lendos", 34]],
      intro: "I am Morrow. In the dark, all\nmonsters are equal... except mine.",
      lose: "The light wins today.\nTake the SHADE BADGE.", badge: "Shade Badge" }),
  ], "mystery", "darkboss");
  W.hall = interior({
    name: "Champion's Hall", w: 12, h: 16, music: "mystery", fight: "boss", wall: "blue", floor: "gray", gym: true,
    rugs: [[4, 4], [4, 10]], ops: [["C", 0, 8, 5, 1], ["C", 6, 8, 6, 1]],
    npcs: [
      trainer({ id: "elite", outfit: "royal", sprite: "soldier", x: 4, y: 7, dir: "right", sight: 3, name: "Elite Vance",
        team: [["saurchin", 37], ["jemuar", 38], ["deviraptor", 37]],
        intro: "None reach the Champion without\nbeating me first!", lose: "Go on. The Champion awaits." }),
      trainer({ id: "champion", outfit: "royal", sprite: "knightlord", x: 5, y: 3, dir: "down", sight: 0, name: "Champion Aurora", champion: 1,
        team: [["drokoro", 40], ["pythonova", 40], ["demosnow", 40], ["novaquarius", 41], ["ziggurat", 41], ["$rival", 42]],
        intro: "So you're the trainer with four\nbadges. I am Aurora, Champion of\nthis land. Give me everything!",
        lose: "Magnificent! You are the new\nCHAMPION!" }),
    ],
  });

  // Creatures met while surfing (one roll per water tile entered).
  W.sprout.water = [["tadcool", 3, 5, 2], ["dollfin", 3, 5, 1]];
  W.route2.water = [["nostray", 8, 11, 2], ["jelillow", 8, 11, 1], ["squink", 9, 12, 1]];
  W.tide.water = [["squink", 15, 19, 2], ["nostray", 15, 19, 2], ["spirain", 16, 20, 1], ["gupphish", 17, 21, 1], ["manosting", 18, 22, 1]];
  W.route3.water = [["spirain", 13, 17, 2], ["jelillow", 14, 18, 1], ["nebufin", 14, 18, 1]];
  W.route4.water = [["nebufin", 20, 24, 2], ["gupphish", 21, 25, 1], ["manosting", 22, 26, 1]];
  W.shade.water = [["manosting", 28, 32, 1], ["nebufin", 28, 32, 1]];

  window.WORLD = { maps: W, BUILDINGS };
})();
