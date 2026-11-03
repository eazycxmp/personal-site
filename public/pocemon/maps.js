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
    tower:  { src: [320, 80, 80, 64], tw: 5, th: 4, door: 2 },
    casino: { src: [480, 80, 80, 64], tw: 5, th: 4, door: 2 },
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
    if (def.raise) {
      def.heights = g.map((r) => r.map(() => 0));
      for (const [x, y, w, h, z] of def.raise) for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) def.heights[j][i] = z;
    }
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
    // after getting your starter, Mom wants to see you before you leave town
    gates: [{ x: 11, y: 0, w: 2, h: 1, block: "n", needFlag: "go_see_mom", flag: "met_mom",
      text: "Wait! Mom wanted to see you before you leave.\nYour house is the one on the left." }],
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
        team: [["katapill", 5], ["stonifly", 5]], intro: "I patrol these woods. Let's see how you treat your monsters!", lose: "You've got a ranger's instincts." }),
      trainer({ id: "r1_cool", outfit: "ranger", sprite: "adventurer_green", x: 14, y: 3, dir: "left", name: "Ranger Rex",
        team: [["banling", 6], ["rockitten", 7]], intro: "Halt! Every trainer on my trail gets tested!", lose: "Trail's yours. Stay on the path!" }),
    ],
    rate: 0.12,
    encounters: [], // see "Wild areas" below
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
    signs: [{ x: 14, y: 13, text: "EMBER CITY\nGym Leader: BRACK\n\"Solid as bedrock.\"" },
      { x: 9, y: 18, text: "DAY CARE\nWe raise your monsters\nwhile you walk!" }],
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
      trainer({ id: "rival_r2", rival: true, leaveTo: "tide", sprite: "adventurer", x: 6, y: 7, dir: "down", sight: 2, name: "$rival",
        team: [["$rivalstarter", 11], ["seirein", 10]],
        intro: "There you are! I beat the Ember Gym too. Time for a rematch!", lose: "Argh! Fine, I'm heading to Tide Harbor. Don't fall behind!" }),
      trainer({ id: "r2_fish", outfit: "ranger", sprite: "rogue_green", x: 19, y: 11, dir: "up", sight: 3, name: "Ranger Gil",
        team: [["fordin", 8], ["lambert", 9]], intro: "Shh, you'll spook the wildlife. Battle quietly!", lose: "Nature favors you today." }),
      trainer({ id: "r2_ten", outfit: "ranger", sprite: "monk_green", x: 28, y: 6, dir: "down", sight: 3, name: "Ranger Tia",
        team: [["merlicun", 9], ["trapsnap", 9]], intro: "These moths only come out at dusk. Want to meet them?", lose: "Fluttered away..." }),
      trainer({ id: "r2_flo", outfit: "ranger", sprite: "woodnymph", x: 38, y: 12, dir: "up", name: "Forest Keeper Ivy",
        team: [["rosarin", 10], ["banling", 9], ["slichen", 10]], intro: "The forest speaks through my monsters!", lose: "The forest is at peace with you." }),
    ],
    rate: 0.12,
    encounters: [], // see "Wild areas" below
  });

  // ---------------- Tide Harbor (Gym 2: Water) ----------------
  W.tide = outdoor({
    name: "Tide Harbor", w: 30, h: 32, music: "town", bg: "beach",
    ops: [
      ["~", 0, 19, 30, 11], [".", 11, 23, 7, 4], [",", 12, 24, 5, 2], ["=", 0, 18, 30, 1], ["=", 0, 7, 28, 2], ["=", 26, 0, 2, 18],
      ["=", 7, 17, 23, 1], ["f", 12, 11, 3, 3], ["T", 12, 2, 2, 4],
    ],
    exits: [{ edge: "w", at: 7, w: 2, to: "route2" }, { edge: "n", at: 26, w: 2, to: "route3" },
      { edge: "e", at: 17, w: 2, to: "frostsea" }],
    buildings: [
      { type: "center", x: 2, y: 2, to: "tide_center" },
      { type: "mart", x: 7, y: 2, to: "tide_mart" },
      { type: "gym", x: 16, y: 9, to: "tide_gym" },
      { type: "house2", x: 3, y: 11, to: "tide_house" },
    ],
    gates: [{ x: 26, y: 3, w: 2, h: 1, badges: 2, block: "n", text: "GUARD: Route 3 is for trainers\nwith 2 badges or more!" }],
    signs: [{ x: 15, y: 15, text: "TIDE HARBOR\nGym Leader: MARINA\n\"Waves wear down mountains.\"" },
      { x: 17, y: 23, text: "SEA SHRINE\nOur sea-god PHARAVION now\nsleeps atop the glacier\nout on the FROST SEA." }],
    npcs: [
      { sprite: "soldier", x: 25, y: 3, dir: "right", name: "Guard",
        talk: ["Two badges, then you may pass\nnorth to Route 3."] },
      { sprite: "fisher", x: 3, y: 18, dir: "down", name: "Old Angler", role: "rod" },
      { sprite: "beachcomber", x: 10, y: 15, dir: "down", name: "Beachcomber",
        talk: ["Marina's WATER monsters hate\nWOOD and LIGHTNING attacks!",
          "See that island out at sea? With the TIDE BADGE, a Water monster can carry you there.",
          "Go east along the pier to reach the FROST SEA. Water and ice monsters live out on the floes!"] },
      trainer({ id: "sea_hermit", outfit: "sailor", sprite: "riverboatcaptain", x: 14, y: 23, dir: "down", sight: 0, name: "Sea Hermit",
        team: [["manosting", 15], ["gupphish", 16], ["spirain", 17]],
        intro: "Few ever reach my shrine. Show me the strength that carried you here!", lose: "The sea chose well. Rare creatures hide in the shrine grass." }),
    ],
    rate: 0.15,
    encounters: [["medushock", 10, 14, 2], ["manosting", 10, 14, 2], ["spirain", 10, 13, 2], ["mingdyn", 12, 15, 1], ["gupphish", 10, 14, 2]],
  });

  // ---------------- Route 3 ----------------
  W.route3 = outdoor({
    name: "Route 3", w: 22, h: 44, music: "route", bg: "forest",
    ops: [
      ["=", 10, 0, 2, 44], [",", 2, 34, 18, 6], [",", 12, 22, 8, 8], [",", 2, 18, 7, 8],
      [",", 4, 4, 14, 6], ["T", 14, 12, 6, 6], ["T", 2, 28, 6, 4], ["~", 14, 30, 4, 2],
      ["f", 2, 12, 4, 2], ["=", 0, 20, 10, 2],
    ],
    exits: [{ edge: "s", at: 10, w: 2, to: "tide" }, { edge: "n", at: 10, w: 2, to: "volt" },
      { edge: "w", at: 20, w: 2, to: "hollow", narrow: true }],
    // a giant sleeps across the side path; ring the WAKE BELL to rouse it
    sleeper: { id: "sleeper_r3", slug: "coaldiak", lv: 20, tiles: [[1, 20], [1, 21], [2, 20], [2, 21]] },
    npcs: [
      trainer({ id: "rival_r3", rival: true, leaveTo: "volt", sprite: "adventurer", x: 12, y: 3, dir: "left", sight: 3, name: "$rival",
        team: [["$rivalstarter", 18], ["spirain", 17], ["banling", 17]],
        intro: "Volt City is just ahead. Let's see who's ready for the Volt Gym!", lose: "You're getting really strong... I'll see you at the top!" }),
      trainer({ id: "r3_ninja", outfit: "ranger", sprite: "dragonrider_green", x: 6, y: 32, dir: "right", sight: 5, name: "Mountain Ranger Kaz",
        team: [["katapill", 13], ["foxfire", 14]], intro: "Mountain rangers move unseen. Surprise!", lose: "You spotted me after all." }),
      trainer({ id: "r3_sci", outfit: "ranger", sprite: "miner_green", x: 15, y: 20, dir: "left", sight: 5, name: "Mountain Ranger Ohm",
        team: [["pawsand", 14], ["grintot", 14], ["stonifly", 13]], intro: "I guard the high trail. Rock-solid monsters only!", lose: "Crumbled like a landslide." }),
      trainer({ id: "r3_goth", outfit: "ranger", sprite: "disciple_green", x: 6, y: 11, dir: "right", sight: 5, name: "Mountain Ranger Raven",
        team: [["turnipper", 15], ["banling", 15], ["toufigel", 15]], intro: "The pines whisper of a strong trainer...", lose: "The whispers were right." }),
    ],
    rate: 0.12,
    encounters: [], // see "Wild areas" below
  });

  // ---------------- Volt City (Gym 3: Lightning) ----------------
  W.volt = outdoor({
    name: "Volt City", w: 30, h: 24, music: "wild", bg: "grass",
    ops: [
      ["=", 12, 8, 2, 16], ["=", 0, 11, 28, 2], ["=", 13, 20, 11, 1], ["f", 2, 15, 2, 3], ["=", 7, 19, 1, 1], ["=", 8, 19, 4, 1],
      ["T", 26, 14, 2, 8], ["T", 2, 2, 2, 6],
    ],
    exits: [{ edge: "s", at: 12, w: 2, to: "route3" }, { edge: "w", at: 11, w: 2, to: "route4" }],
    buildings: [
      { type: "center", x: 4, y: 3, to: "volt_center" },
      { type: "mart", x: 9, y: 3, to: "volt_mart" },
      { type: "gym", x: 17, y: 2, to: "volt_gym" },
      { type: "house", x: 18, y: 14, to: "volt_house" },
      { type: "casino", x: 5, y: 15, to: "volt_casino" },
    ],
    gates: [{ x: 2, y: 11, w: 1, h: 2, badges: 3, block: "w", text: "GUARD: Shade Hollow is dangerous.\nYou need 3 badges!" }],
    signs: [{ x: 14, y: 14, text: "VOLT CITY\nGym Leader: VOLTA\n\"Shockingly fast.\"" }],
    npcs: [
      { sprite: "soldier", x: 3, y: 10, dir: "down", name: "Guard", talk: ["Three badges to head west."] },
      { sprite: "cooldude", x: 15, y: 17, dir: "left", name: "Dude",
        talk: ["Volta's LIGHTNING monsters can't\nstand EARTH attacks!"] },
      { sprite: "fashionista", x: 10, y: 18, dir: "left", name: "High Roller",
        talk: ["The GAME CORNER never sleeps! Slots, roulette, blackjack...", "Win enough coins and they'll trade you a whole starter monster!"] },
    ],
  });

  // ---------------- Route 4 ----------------
  W.route4 = outdoor({
    name: "Route 4", w: 44, h: 18, music: "route", bg: "forest",
    ops: [
      ["=", 0, 8, 44, 2], [",", 4, 2, 10, 14], [",", 18, 10, 10, 6], [",", 30, 2, 8, 6],
      [",", 32, 10, 8, 6], ["T", 18, 2, 6, 4], ["~", 26, 3, 3, 3], ["f", 40, 3, 2, 3],
      ["=", 24, 0, 2, 8], // side path north to Glimmer Cave
    ],
    exits: [{ edge: "e", at: 8, w: 2, to: "volt" }, { edge: "w", at: 8, w: 2, to: "shade" }, { edge: "n", at: 24, w: 2, to: "cave" }],
    npcs: [
      trainer({ id: "r4_knight", outfit: "nightranger", sprite: "adventurer_green", x: 35, y: 6, dir: "down", sight: 3, name: "Night Ranger Gareth",
        team: [["furnursus", 19], ["metesaur", 20]], intro: "Nobody crosses the dark woods without a ranger's say-so!", lose: "Go on, but watch the shadows." }),
      trainer({ id: "r4_drag", outfit: "nightranger", sprite: "dragonrider_green", x: 22, y: 12, dir: "up", sight: 4, name: "Night Ranger Sol",
        team: [["chloragon", 20], ["devidin", 19], ["metesaur", 20]], intro: "My dragons hunt at night. Ready?", lose: "Even dragons rest." }),
      trainer({ id: "r4_witch", outfit: "nightranger", sprite: "rogue_green", x: 9, y: 6, dir: "down", sight: 3, name: "Night Ranger Morgana",
        team: [["babysnitch", 20], ["hoarse", 21], ["demosnow", 20]], intro: "Strange things live in these woods. I keep them in line!", lose: "You'd make a fine night ranger." }),
    ],
    rate: 0.12,
    encounters: [], // see "Wild areas" below
  });

  // ---------------- Shade Hollow (Gym 4: Shadow + Champion Hall) ----------------
  W.shade = outdoor({
    name: "Shade Hollow", w: 30, h: 26, music: "mystery", bg: "forest",
    ops: [
      ["=", 2, 16, 28, 2], ["=", 14, 0, 2, 16], ["=", 6, 15, 1, 1], ["f", 9, 5, 3, 2], ["T", 18, 3, 2, 2],
      ["f", 10, 19, 4, 2], ["T", 2, 2, 4, 6], ["T", 24, 2, 4, 4], ["~", 22, 20, 5, 3],
    ],
    exits: [{ edge: "e", at: 16, w: 2, to: "route4" }, { edge: "n", at: 14, w: 2, to: "route5" }],
    buildings: [
      { type: "center", x: 4, y: 11, to: "shade_center" },
      { type: "mart", x: 4, y: 19, to: "shade_mart" },
      { type: "gym", x: 20, y: 6, to: "shade_gym" },
      { type: "tower", x: 15, y: 19, to: "tower" },
    ],
    gates: [{ x: 14, y: 2, w: 2, h: 1, badges: 4, block: "n", text: "GUARD: The wilds north of here are\nfor trainers with 4 badges!" },
      { x: 17, y: 22, w: 1, h: 1, requires: "champion", block: "n", text: "BATTLE TOWER: Open to Champions only.\nBeat the Champion, then come back!" }],
    signs: [{ x: 13, y: 18, text: "SHADE HOLLOW\nGym Leader: MORROW\nNorth: THORNWOOD WILDS" }],
    npcs: [
      { sprite: "soldier", x: 16, y: 3, dir: "down", name: "Guard",
        talk: ["Four badges to head north.", "Four more gyms lie beyond, and the PRIME GYM waits at the very end."] },
      { sprite: "magician", x: 9, y: 22, dir: "up", name: "Mystic",
        talk: ["Morrow's DARK monsters...", "...they say PSYCHIC and HEROIC\npower shines through darkness."] },
    ],
  });

  // ---------------- Frost Sea (side route off Tide Harbor's pier) ----------------
  // Ice floes with frosty grass dot the sea; a glacier rises in the northeast. Climb its ice steps to the top
  // tier, where PHARAVION sleeps. Needs SURF (Tide Badge).
  W.frostsea = outdoor({
    name: "Frost Sea", w: 40, h: 30, music: "route", bg: "beach", frost: true, rate: 0.12,
    ops: [
      ["~", 2, 2, 36, 26],
      // the snowy west shore, with pines and a trail down to the water
      [".", 0, 12, 8, 11], ["=", 0, 17, 6, 2], ["T", 5, 12, 3, 2], ["T", 6, 21, 2, 2], [",", 2, 13, 3, 3], [",", 2, 20, 3, 2],
      // three floes out on the water
      [".", 10, 4, 6, 5], [",", 11, 5, 4, 3],
      [".", 12, 19, 7, 6], [",", 13, 20, 5, 4], ["T", 17, 19, 2, 2],
      [".", 22, 12, 5, 4], [",", 23, 13, 3, 2],
      // the glacier, its frosty meadow, and the cliff the ice cave opens into
      [".", 27, 2, 11, 10], [",", 29, 7, 3, 2], [",", 33, 2, 3, 2], [".", 28, 0, 4, 2],
    ],
    // tier 1 of the glacier, tier 2 above it, an ice step up to each; the cave mouth sits in a taller ice cliff
    raise: [[28, 2, 10, 8, 1], [32, 2, 6, 4, 2], [30, 10, 1, 1, 0.5], [34, 6, 1, 1, 1.5], [28, 0, 1, 2, 2], [31, 0, 1, 2, 2], [29, 0, 2, 2, 1]],
    mouths: [[29, 1], [30, 1]],
    exits: [{ edge: "w", at: 17, w: 2, to: "tide" }, { edge: "n", at: 29, w: 2, to: "icecave", narrow: true }],
    signs: [{ x: 3, y: 15, text: "FROST SEA\nSurf out to the floes.\nThe glacier lies northeast." }, { x: 27, y: 3, text: "ICE CAVE\nIn the glacier's north face.\nMind the slippery floor!" }],
    legends: [{ id: "legend_pharavion", slug: "pharavion", lv: 32, x: 35, y: 3 }],
    items: [{ id: "item_floe_balls", x: 15, y: 4, item: "great_ball", n: 3 }, { id: "item_glacier_treat", x: 37, y: 9, item: "level_treat", n: 1 }],
    npcs: [
      { sprite: "fisher", x: 4, y: 19, dir: "right", name: "Ice Fisher",
        talk: ["Brr! The floes out there are full of WATER and FROST monsters.", "Climb the glacier by its ice steps. Some say a sea-god sleeps on top, and baby ice monsters hide in the cave."] },
      trainer({ id: "fs_diver", outfit: "sailor", sprite: "swimmer_blue", x: 18, y: 22, dir: "left", sight: 3, name: "Ice Diver Juno",
        team: [["fribbit", 17], ["bigfin", 18]], intro: "The cold keeps my monsters sharp!", lose: "Brr... I need a warm drink." }),
      trainer({ id: "fs_skater", outfit: "sailor", sprite: "tennisplayer", x: 24, y: 15, dir: "up", sight: 3, name: "Skater Nell",
        team: [["houndice", 18], ["crustagu", 18], ["heronquak", 19]], intro: "Watch me glide! Then watch me win!", lose: "Slipped up!" }),
      trainer({ id: "fs_climber", outfit: "miner", sprite: "miner_green", x: 31, y: 9, dir: "down", sight: 2, name: "Glacier Climber Odo",
        team: [["snowrilla", 20], ["hectapod", 19], ["eaglace", 20]], intro: "Only the strong reach the top of this glacier!", lose: "Go on up. Mind the edge." }),
    ],
    encounters: [],
  });
  // The Ice Cave, inside the glacier: a frozen hall, a pool, and a sheet of ice you slide across to reach its treasure.
  W.icecave = outdoor({
    name: "Ice Cave", w: 24, h: 26, music: "mystery", bg: "cave", frost: true, walls: "ice", rate: 0.1,
    ops: [
      ["T", 0, 0, 24, 26],
      [".", 11, 19, 2, 7], [".", 3, 13, 18, 7], [",", 4, 14, 4, 3], [",", 15, 17, 4, 2], ["~", 15, 14, 3, 2],
      [".", 11, 12, 2, 1], [".", 17, 12, 1, 1], ["I", 6, 4, 12, 8], [".", 10, 2, 4, 2],
      ["R", 11, 6, 2, 1], ["R", 13, 4, 1, 1], ["R", 13, 11, 1, 1], ["R", 3, 13, 1, 1], ["R", 20, 19, 1, 1], ["R", 9, 18, 1, 1],
    ],
    exits: [{ edge: "s", at: 11, w: 2, to: "frostsea", narrow: true }],
    signs: [{ x: 10, y: 21, text: "ICE CAVE\nOn the ice you slide until\nsomething stops you." }],
    items: [{ id: "item_icecave_candy", x: 11, y: 2, item: "exp_candy", n: 1 }, { id: "item_icecave_berry", x: 19, y: 13, item: "berry_frost", n: 1 },
      { id: "item_icecave_treat", x: 4, y: 18, item: "level_treat", n: 1 }],
    npcs: [
      trainer({ id: "ic_skier", outfit: "sailor", sprite: "ninja", x: 7, y: 17, dir: "right", sight: 3, name: "Ice Hermit Yuki",
        team: [["demosnow", 19], ["chillimp", 20], ["lucifice", 21]], intro: "Few find this cave. Fewer leave it warm!", lose: "The ice favours you today." }),
    ],
    encounters: [],
  });

  // ---------------- Route 5: Thornwood Wilds (Shade Hollow -> Verdance) ----------------
  W.route5 = outdoor({
    name: "Route 5", w: 22, h: 44, music: "route", bg: "forest", look: "wood",
    ops: [
      ["=", 10, 0, 2, 44], [",", 2, 34, 8, 8], [",", 12, 30, 8, 8], [",", 2, 18, 7, 10], [",", 13, 14, 7, 8],
      [",", 4, 3, 14, 6], ["T", 13, 24, 6, 4], ["T", 2, 12, 6, 4], ["~", 15, 39, 4, 3], ["f", 13, 10, 4, 2], ["f", 3, 29, 3, 2],
    ],
    exits: [{ edge: "s", at: 10, w: 2, to: "shade" }, { edge: "n", at: 10, w: 2, to: "verdance" }],
    signs: [{ x: 12, y: 41, text: "ROUTE 5 - THORNWOOD WILDS\nNorth: Verdance" }],
    npcs: [
      trainer({ id: "r5_a", outfit: "ranger", sprite: "woodnymph", x: 8, y: 36, dir: "right", sight: 4, name: "Druid Wren",
        team: [["dandylion", 25], ["legko", 26]], intro: "The old trees chose my monsters. Let's see yours!", lose: "The forest bows to you." }),
      trainer({ id: "r5_b", outfit: "ranger", sprite: "monk_green", x: 13, y: 22, dir: "left", sight: 4, name: "Druid Bram",
        team: [["stegofor", 26], ["tumblebee", 26], ["spycozeus", 27]], intro: "Thorns and stings, that's my style!", lose: "Pricked my pride." }),
      trainer({ id: "rival_r5", rival: true, leaveTo: "verdance", sprite: "adventurer", x: 12, y: 6, dir: "left", sight: 3, name: "$rival",
        team: [["$rivalstarter", 29], ["spirain", 27], ["banling", 27], ["seirein", 28]],
        intro: "Four badges each! But the next four are the real test. Show me!", lose: "Ugh! See you at Verdance... I'm not done!" }),
    ],
    rate: 0.12, encounters: [],
  });

  // Towns 5-7 share one layout: a path cross, Healing Center and Mart up top, the Gym on the right.
  // inn/out pick the exits ("s", "n", "w", "e"); the onward exit has a badge gate and a guard.
  function town(def, inn, out, badges, guardText) {
    const ex = { n: { edge: "n", at: 12, w: 2 }, s: { edge: "s", at: 12, w: 2 }, w: { edge: "w", at: 11, w: 2 }, e: { edge: "e", at: 11, w: 2 } };
    const gate = { n: { x: 12, y: 2, w: 2, h: 1 }, e: { x: 27, y: 11, w: 1, h: 2 } }[out[0]];
    const guard = { n: [14, 3, "down"], e: [27, 10, "down"] }[out[0]];
    return outdoor(Object.assign(def, {
      w: 30, h: 24,
      ops: [["=", 12, 0, 2, 24], ["=", 0, 11, 30, 2], ["=", 2, 7, 10, 1], ["=", 20, 10, 1, 1], ["=", 3, 20, 10, 1], ["=", 12, 21, 11, 1],
        ...(def.ops || [])],
      exits: [Object.assign(ex[inn[0]], { to: inn[1] }), Object.assign(ex[out[0]], { to: out[1] })],
      buildings: [
        { type: "center", x: 2, y: 3, to: def.id + "_center" }, { type: "mart", x: 7, y: 3, to: def.id + "_mart" },
        { type: "gym", x: 17, y: 2, to: def.id + "_gym" }, { type: "house", x: 3, y: 14, to: def.id + "_house" },
      ],
      gates: [Object.assign(gate, { badges, block: out[0], text: guardText })],
      npcs: [{ sprite: "soldier", x: guard[0], y: guard[1], dir: guard[2], name: "Guard", talk: [guardText.replace("GUARD: ", "")] }, ...(def.npcs || [])],
    }));
  }

  // ---------------- Verdance (Gym 5: Wood) ----------------
  W.verdance = town({ id: "verdance", name: "Verdance", music: "chill", bg: "forest", look: "wood",
    ops: [["f", 15, 15, 4, 3], ["T", 24, 15, 4, 6], ["~", 19, 15, 3, 2]],
    signs: [{ x: 14, y: 13, text: "VERDANCE\nGym Leader: FERN\n\"Roots run deep.\"" }],
    npcs: [{ sprite: "florist", x: 10, y: 15, dir: "left", name: "Gardener",
      talk: ["Fern grows WOOD monsters.", "FIRE, SKY and FROST attacks wilt them fast!"] }],
  }, ["s", "route5"], ["e", "route6"], 5, "GUARD: The Ashfall Trail is scorching.\nYou need 5 badges!");

  // ---------------- Route 6: Ashfall Trail (Verdance -> Cinder Peak) ----------------
  W.route6 = outdoor({
    name: "Route 6", w: 44, h: 18, music: "route", bg: "forest", look: "ash",
    ops: [
      ["=", 0, 8, 44, 2], [",", 4, 2, 9, 6], [",", 6, 11, 10, 5], [",", 20, 2, 8, 5], [",", 22, 11, 9, 5], [",", 34, 3, 7, 12],
      ["T", 15, 2, 4, 4], ["T", 32, 11, 2, 5], ["~", 17, 12, 3, 3],
    ],
    exits: [{ edge: "w", at: 8, w: 2, to: "verdance" }, { edge: "e", at: 8, w: 2, to: "cinder" }],
    signs: [{ x: 3, y: 7, text: "ROUTE 6 - ASHFALL TRAIL\nEast: Cinder Peak" }],
    npcs: [
      trainer({ id: "r6_a", outfit: "miner", sprite: "firefighter", x: 10, y: 7, dir: "down", sight: 3, name: "Fire Watcher Pyro",
        team: [["cardiwing", 30], ["grinflare", 31]], intro: "Hot ash, hotter battles!", lose: "Extinguished..." }),
      trainer({ id: "r6_b", outfit: "miner", sprite: "miner", x: 26, y: 10, dir: "up", sight: 3, name: "Ash Miner Cole",
        team: [["rockat", 31], ["selmatek", 31], ["cocrune", 32]], intro: "I dig in the ash for rare ore. And rare fights!", lose: "Struck out." }),
      trainer({ id: "r6_c", outfit: "miner", sprite: "magician_fiery", x: 38, y: 7, dir: "left", sight: 4, name: "Fire Dancer Sola",
        team: [["solight", 32], ["urcheedle", 32], ["cobarett", 33]], intro: "Dance with the flames!", lose: "My flame flickers out." }),
    ],
    rate: 0.12, encounters: [],
  });

  // ---------------- Cinder Peak (Gym 6: Fire) ----------------
  W.cinder = town({ id: "cinder", name: "Cinder Peak", music: "funky", bg: "forest", look: "ash",
    ops: [["T", 22, 14, 6, 6], ["T", 26, 2, 2, 2]],
    signs: [{ x: 14, y: 13, text: "CINDER PEAK\nGym Leader: BLAZE\n\"Burn bright.\"" }],
    npcs: [{ sprite: "cooldude", x: 9, y: 16, dir: "right", name: "Hiker",
      talk: ["Blaze's FIRE monsters hate WATER and EARTH attacks.", "Bring something that swims!"] }],
  }, ["w", "route6"], ["n", "route7"], 6, "GUARD: Rustline Road is for trainers\nwith 6 badges!");

  // ---------------- Route 7: Rustline Road (Cinder Peak -> Ironhold) ----------------
  W.route7 = outdoor({
    name: "Route 7", w: 22, h: 44, music: "route", bg: "forest", look: "steel",
    ops: [
      ["=", 10, 0, 2, 44], [",", 2, 33, 8, 8], [",", 12, 27, 8, 10], [",", 2, 16, 8, 10], [",", 12, 8, 8, 8],
      [",", 3, 3, 6, 6], ["T", 12, 18, 6, 4], ["T", 2, 28, 4, 3], ["~", 14, 39, 4, 3], ["F", 12, 25, 6, 1],
    ],
    exits: [{ edge: "s", at: 10, w: 2, to: "cinder" }, { edge: "n", at: 10, w: 2, to: "ironhold" }],
    signs: [{ x: 12, y: 41, text: "ROUTE 7 - RUSTLINE ROAD\nNorth: Ironhold" }],
    npcs: [
      trainer({ id: "r7_a", outfit: "engineer", sprite: "scientist_black", x: 8, y: 36, dir: "right", sight: 4, name: "Mechanic Rusty",
        team: [["puparmor", 36], ["weavifly", 37]], intro: "Every bolt tightened. Let's battle!", lose: "Loose screw somewhere..." }),
      trainer({ id: "r7_b", outfit: "engineer", sprite: "firefighter", x: 13, y: 24, dir: "left", sight: 4, name: "Engineer Tess",
        team: [["windeye", 37], ["arthrobolt", 37], ["trojerror", 38]], intro: "My machines don't feel pain. Do yours?", lose: "System failure!" }),
      trainer({ id: "r7_c", outfit: "occult", sprite: "magician", x: 8, y: 6, dir: "right", sight: 4, name: "Psychic Lumen",
        team: [["eyesore", 38], ["masknake", 38], ["mystikapi", 39]], intro: "I saw you coming from miles away.", lose: "I did not see THAT coming." }),
    ],
    rate: 0.12, encounters: [],
  });

  // ---------------- Ironhold (Gym 7: Steel) ----------------
  W.ironhold = town({ id: "ironhold", name: "Ironhold", music: "wild", bg: "grass", look: "steel",
    ops: [["T", 24, 15, 4, 6], ["F", 15, 18, 6, 1]],
    signs: [{ x: 14, y: 13, text: "IRONHOLD\nGym Leader: FORGE\n\"Nothing bends.\"" }],
    npcs: [{ sprite: "scientist", x: 10, y: 16, dir: "left", name: "Smith",
      talk: ["Forge's STEEL monsters shrug off most hits.", "FIRE and EARTH attacks melt right through them!"] }],
  }, ["s", "route7"], ["e", "route8"], 7, "GUARD: Victory Ridge is for trainers\nwith 7 badges!");

  // ---------------- Route 8: Victory Ridge (Ironhold -> Prime City) ----------------
  W.route8 = outdoor({
    name: "Route 8", w: 44, h: 18, music: "route", bg: "forest", look: "prime",
    ops: [
      ["=", 0, 8, 44, 2], [",", 3, 2, 10, 5], [",", 5, 11, 9, 5], [",", 17, 2, 9, 5], [",", 18, 11, 10, 5], [",", 31, 2, 9, 13],
      ["T", 14, 11, 3, 5], ["T", 28, 2, 3, 5], ["f", 40, 3, 2, 3],
    ],
    exits: [{ edge: "w", at: 8, w: 2, to: "ironhold" }, { edge: "e", at: 8, w: 2, to: "prime" }],
    signs: [{ x: 3, y: 7, text: "ROUTE 8 - VICTORY RIDGE\nEast: Prime City" }],
    npcs: [
      trainer({ id: "r8_a", outfit: "royal", sprite: "knight", x: 10, y: 10, dir: "up", sight: 3, name: "Ace Trainer Roland",
        team: [["bricgard", 41], ["strella", 41], ["glombroc", 42]], intro: "Only the best walk Victory Ridge.", lose: "You really are one of the best." }),
      trainer({ id: "r8_b", outfit: "royal", sprite: "dragonrider", x: 24, y: 7, dir: "down", sight: 3, name: "Ace Trainer Vesper",
        team: [["gryfix", 42], ["myrmison", 42], ["miaownolith", 43]], intro: "The Prime Gym is close. Prove you belong!", lose: "You belong." }),
      trainer({ id: "rival_r8", rival: true, leaveTo: "prime", sprite: "adventurer", x: 38, y: 10, dir: "up", sight: 3, name: "$rival",
        team: [["$rivalstarter", 45], ["spirain", 42], ["banling", 42], ["seirein", 43], ["metesaur", 43], ["komoduel", 44]],
        intro: "Seven badges! This is our last battle before the Prime Gym. All or nothing!",
        lose: "...You're the real deal. Go win that Prime Badge. I'll be cheering." }),
    ],
    rate: 0.12, encounters: [],
  });

  // ---------------- Prime City (Gym 8: the Prime Gym, then the Champion's Hall) ----------------
  W.prime = outdoor({
    name: "Prime City", w: 34, h: 28, music: "funky", bg: "grass", look: "prime",
    ops: [
      ["=", 0, 16, 34, 2], ["=", 16, 14, 2, 2], ["=", 4, 14, 1, 2], ["=", 9, 14, 1, 2], ["=", 26, 14, 1, 2],
      ["f", 2, 6, 4, 2], ["f", 27, 22, 4, 2], ["T", 28, 2, 4, 3], ["T", 2, 2, 3, 4], ["~", 20, 21, 4, 3],
    ],
    exits: [{ edge: "w", at: 16, w: 2, to: "route8" }],
    buildings: [
      { type: "hall", x: 12, y: 2, to: "hall" },
      { type: "center", x: 2, y: 10, to: "prime_center" },
      { type: "mart", x: 7, y: 10, to: "prime_mart" },
      { type: "gym", x: 23, y: 6, to: "prime_gym" },
    ],
    gates: [{ x: 16, y: 14, w: 1, h: 1, badges: 8, block: "n", text: "GUARD: Only holders of all 8 badges\nmay challenge the Champion!" }],
    signs: [{ x: 15, y: 19, text: "PRIME CITY\nPrime Leader: DRAKE\nNorth: CHAMPION'S HALL" }],
    npcs: [
      { sprite: "soldier", x: 17, y: 14, dir: "down", name: "Guard", talk: ["Beyond here is the Champion.\nYou need all 8 badges."] },
      { sprite: "granny", x: 10, y: 19, dir: "up", name: "Old Champion",
        talk: ["Drake of the PRIME GYM trains DRAGONS, the mightiest monsters of all.", "Dragons fear FROST attacks and other dragons. Steel stands up to them."] },
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
    ops: [["C", 2, 4, 5, 1], ["Q", 8, 3, 2, 1]], decor: [[2, 1, "poster"], [7, 1, "board"]],
    npcs: [ // the Nurse heals; the PC in the corner stores monsters
      { sprite: "nurse", x: 4, y: 3, dir: "down", name: "Nurse", role: "heal" },
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
      trainer({ id: "rival_lab", rival: true, leaveTo: "door", practice: true, sprite: "adventurer", x: 7, y: 5, dir: "left", sight: 0, name: "$rival",
        team: [["$rivalstarter", 4]], intro: "Wait! I picked my partner too. Let's see whose is stronger!",
        lose: "Not bad... but I'll get stronger. See you out there!", win: "Ha! I win! Better train up before we meet again!" })],
  });

  W.ember_center = center("Ember"); W.ember_mart = mart("Ember");
  W.ember_house = house("Day Care", { sprite: "miner", x: 2, y: 4, dir: "down", name: "Miner",
    talk: ["Hold SHIFT to run.", "My aunt runs the DAY CARE. Leave a monster with her and it grows while you walk!"] });
  W.ember_house.npcs.push({ sprite: "granny", x: 5, y: 3, dir: "down", name: "Day Care Lady", role: "daycare" });
  W.ember_house2 = house("House", { sprite: "fashionista", x: 4, y: 5, dir: "left", name: "Fashionista",
    talk: ["Monsters evolve when they reach\ncertain levels.", "Keep battling and you'll see!"] });
  W.tide_center = center("Tide"); W.tide_mart = mart("Tide");
  W.tide_house = house("House", { sprite: "swimmer", x: 3, y: 4, dir: "down", name: "Swimmer",
    talk: ["Weaken a wild monster before you\nthrow a Tuxeball.", "It's much easier to catch!"] });
  // Volt City's Game Corner: slots along the back wall, a roulette wheel and a blackjack table, and two clerks.
  W.volt_casino = interior({
    name: "Volt Game Corner", w: 16, h: 12, music: "funky", wall: "wood", floor: "carpet",
    ops: [["S", 1, 3, 6, 1], ["S", 9, 3, 6, 1], ["O", 2, 6, 3, 2], ["K", 11, 6, 3, 2], ["C", 1, 9, 1, 2], ["C", 14, 9, 1, 2]],
    stools: [[1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4]],
    lamps: [[3, 1], [7, 1], [12, 1]],
    npcs: [
      { sprite: "shopkeeper", x: 0, y: 9, dir: "right", name: "Coin Clerk", role: "coins" },
      { sprite: "magician", x: 15, y: 9, dir: "left", name: "Prize Clerk", role: "prizes" },
      { sprite: "fashionista", x: 3, y: 5, dir: "down", name: "Croupier", role: "roulette" },
      { sprite: "cooldude", x: 12, y: 5, dir: "down", name: "Dealer", role: "blackjack" },
      { sprite: "granny", x: 2, y: 4, dir: "up", name: "Lucky Granny", talk: ["Three sevens on the middle line pays a hundred times your bet!", "A berry on the first reel always gives your bet back, dearie."] },
      { sprite: "goth", x: 13, y: 4, dir: "up", name: "Gambler", talk: ["I'm due a jackpot. Any spin now..."] },
    ],
  });
  W.volt_center = center("Volt"); W.volt_mart = mart("Volt");
  W.volt_house = house("House", { sprite: "catgirl", x: 4, y: 4, dir: "down", name: "Kat", role: "bell",
    talk: ["Moves of the same type as the\nmonster using them hit harder!"] });
  W.shade_center = center("Shade"); W.shade_mart = mart("Shade");

  // ---------------- Hollowmere (ghost town, side path west of Route 3) ----------------
  W.hollow = outdoor({
    name: "Hollowmere", w: 30, h: 24, music: "mystery", bg: "forest", ghost: true,
    ops: [
      ["=", 6, 20, 24, 2], ["=", 14, 6, 2, 14], ["=", 6, 12, 18, 1],
      [",", 2, 2, 6, 7], [",", 22, 14, 6, 5], [",", 2, 14, 5, 4], [",", 18, 2, 8, 4],
      ["F", 7, 10, 3, 1], ["F", 17, 9, 4, 1], ["F", 3, 19, 2, 1], ["T", 25, 7, 3, 4], ["~", 9, 15, 3, 2],
    ],
    exits: [{ edge: "e", at: 20, w: 2, to: "route3", narrow: true }],
    buildings: [
      { type: "house", x: 8, y: 3, to: "hollow_house" },
      { type: "house2", x: 17, y: 14, to: "hollow_house2" },
    ],
    signs: [{ x: 16, y: 18, text: "HOLLOWMERE\nNobody has lived here\nfor a hundred years." },
      { x: 16, y: 7, text: "SHRINE OF ORIGINS\nSomething ancient sleeps\nin these ruins." }],
    legends: [{ id: "legend_primordia", slug: "primordia", lv: 40, x: 15, y: 3 }],
    npcs: [
      trainer({ id: "hollow_t1", outfit: "occult", sprite: "goth", x: 12, y: 13, dir: "down", sight: 3, name: "Lost Soul Mara",
        team: [["seirein", 17], ["ghosteeth", 18]], intro: "You can see me...? Then stay. Forever.", lose: "I... remember now. I was a trainer too." }),
      trainer({ id: "hollow_t2", outfit: "occult", sprite: "magician", x: 21, y: 11, dir: "left", sight: 4, name: "Phantom Ike",
        team: [["uneye", 18], ["cackleen", 18], ["babysnitch", 19]], intro: "Boo-hoo-hoo! Nobody leaves Hollowmere!", lose: "Fine... go on. Mind the shrine." }),
      { sprite: "granny", x: 20, y: 21, dir: "left", name: "Old Whisper",
        talk: ["This town emptied the night the shrine woke...", "They say the first pocemon of all still drifts up there, north of the square."] },
    ],
    rate: 0.15,
    encounters: [], // see "Wild areas" below
  });
  W.hollow.water = [["manosting", 22, 26, 1], ["seirein", 22, 26, 1]];
  W.hollow_house = house("Abandoned House", { sprite: "heroine", x: 3, y: 4, dir: "down", name: "Pale Girl", outfit: "occult",
    talk: ["...have you seen my family?", "They went up to the shrine and never came down.", "...it's cold here. So cold."] });
  W.hollow_house2 = house("Abandoned House", trainer({ id: "hollow_t3", outfit: "occult", sprite: "witch", x: 4, y: 4, dir: "down", sight: 0,
    name: "Witch Agatha", team: [["djinnbo", 20], ["lendos", 20]], intro: "Hee hee... a visitor! My pets are hungry.", lose: "Off you go, dearie. Take the shrine's blessing." }));
  W.hollow_house.wall = W.hollow_house2.wall = "wood";

  // legendaries
  W.route4.legends = [{ id: "legend_kernel", slug: "kernel", lv: 45, x: 41, y: 12 }];

  const gym = (name, wall, npcs, music, fight) => interior({
    name, w: 12, h: 14, music, fight, wall, floor: "gray", gym: true, rugs: [[4, 4], [4, 8]], npcs,
  });

  W.ember_gym = gym("Ember Gym", "cream", [
    trainer({ id: "g1_t1", outfit: "miner", sprite: "miner", x: 2, y: 9, dir: "right", sight: 5, name: "Miner Tobin",
      team: [["rockitten", 7]], intro: "Brack trains us hard. Ready?", lose: "Hmm. Solid." }),
    trainer({ id: "g1_t2", outfit: "miner", sprite: "miner_green", x: 9, y: 6, dir: "left", sight: 5, name: "Hiker Dale",
      team: [["stonifly", 6], ["scarlant", 6]], intro: "Rocks never lose!", lose: "...Except today." }),
    trainer({ id: "g1_leader", outfit: "miner", sprite: "miner", x: 5, y: 3, dir: "down", sight: 0, name: "Leader Brack", leader: 1,
      team: [["shull", 9], ["imbrickcile", 10], ["grintot", 10], ["pawsand", 11]],
      intro: "I'm Brack, the Ember Gym Leader!\nMy EARTH monsters are hard as\nstone. Show me what you've got!",
      lose: "You cracked my defense!\nTake the ROCK BADGE!", badge: "Rock Badge" }),
  ], "funky", "funkboss");
  W.tide_gym = gym("Tide Gym", "blue", [
    trainer({ id: "g2_t1", outfit: "sailor", sprite: "swimmer_blue", x: 2, y: 9, dir: "right", sight: 5, name: "Sailor Kai",
      team: [["nostray", 12], ["lesmagu", 12]], intro: "Ahoy! Ready to get soaked?", lose: "Washed overboard!" }),
    trainer({ id: "g2_t2", outfit: "sailor", sprite: "riverboatcaptain", x: 9, y: 6, dir: "left", sight: 5, name: "Captain Moe",
      team: [["jelillow", 13], ["spirain", 13]], intro: "All hands on deck! Battle stations!", lose: "Abandon ship!" }),
    trainer({ id: "g2_leader", outfit: "sailor", sprite: "swimmer", x: 5, y: 3, dir: "down", sight: 0, name: "Leader Marina", leader: 2,
      team: [["squink", 14], ["spirain", 15], ["gupphish", 16], ["shnark", 17]],
      intro: "Welcome to Tide Gym! I'm Marina.\nThe sea is calm... until it isn't!",
      lose: "Swept away! You've earned\nthe TIDE BADGE!", badge: "Tide Badge" }),
  ], "funky", "funkboss");
  W.volt_gym = gym("Volt Gym", "green", [
    trainer({ id: "g3_t1", outfit: "engineer", sprite: "firefighter", x: 2, y: 9, dir: "right", sight: 5, name: "Engineer Watt",
      team: [["chromeye", 17], ["fluoresfin", 17]], intro: "Feel the voltage!", lose: "Short circuit!" }),
    trainer({ id: "g3_t2", outfit: "engineer", sprite: "scientist_black", x: 9, y: 6, dir: "left", sight: 5, name: "Engineer Zia",
      team: [["joulraton", 18], ["boltnu", 18]], intro: "My circuits are faster than lightning!", lose: "Blew a fuse..." }),
    trainer({ id: "g3_leader", outfit: "engineer", sprite: "scientist", x: 5, y: 3, dir: "down", sight: 0, name: "Leader Volta", leader: 3,
      team: [["incandesfin", 19], ["exclawvate", 20], ["medushock", 21], ["ouroboutlet", 22]],
      intro: "I'm Volta! My LIGHTNING monsters\nstrike before you can blink!",
      lose: "Grounded at last!\nThe VOLT BADGE is yours!", badge: "Volt Badge" }),
  ], "route", "boss");
  W.shade_gym = gym("Shade Gym", "cream", [
    trainer({ id: "g4_t1", outfit: "occult", sprite: "goth_rose", x: 2, y: 9, dir: "right", sight: 5, name: "Hexer Nyx",
      team: [["cackleen", 22], ["seirein", 22]], intro: "Boo!", lose: "Spooked myself..." }),
    trainer({ id: "g4_t2", outfit: "occult", sprite: "magician_fiery", x: 9, y: 6, dir: "left", sight: 5, name: "Seer Ren",
      team: [["noctalo", 23], ["babysnitch", 23]], intro: "I foresaw this battle. And your defeat!", lose: "I... didn't see that coming." }),
    trainer({ id: "g4_leader", outfit: "occult", sprite: "magician", x: 5, y: 3, dir: "down", sight: 0, name: "Leader Morrow", leader: 4,
      team: [["brumi", 25], ["yiinaang", 26], ["baddrscratch", 27], ["lendos", 28]],
      intro: "I am Morrow. In the dark, all\nmonsters are equal... except mine.",
      lose: "The light wins today.\nTake the SHADE BADGE.", badge: "Shade Badge" }),
  ], "mystery", "darkboss");
  // The Champion's Hall: four Elite chambers in a row, then the Champion. Each Elite stands in the doorway to the
  // next chamber and steps aside once beaten (aside: the steps they take). No healing between, only your items.
  const hallRows = [
    "..............", "..............", "..............", "..............",
    "PPPPPP.PPPPPPP", "..............", "..............", "..............", "..............", "..............",
    "PPPPPP.PPPPPPP", "..............", "..............", "..............", "..............", "..............",
    "PPPPPP.PPPPPPP", "..............", "..............", "..............", "..............", "..............",
    "PPPPPP.PPPPPPP", "..............", "..............", "..............",
  ];
  const elite = (o) => trainer(Object.assign({ outfit: "royal", dir: "down", sight: 3, aside: ["up", "right"] }, o));
  W.hall = interior({
    name: "Champion's Hall", w: 14, h: 30, music: "mystery", fight: "boss", wall: "blue", floor: "gray", gym: true,
    npcs: [
      elite({ id: "elite1", sprite: "witch", x: 6, y: 25, name: "Elite Glacia",
        team: [["eaglace", 43], ["lucifice", 43], ["seraphice", 44], ["snowrilla", 45]],
        intro: "Welcome to the Elite Four. I am\nGlacia. Let my FROST monsters\nchill you to the bone!", lose: "Brr... Go on. Three more wait." }),
      elite({ id: "elite2", sprite: "magician", x: 6, y: 19, name: "Elite Lumina",
        team: [["angrito", 44], ["mystikapi", 45], ["apeoro", 45], ["statursus", 46]],
        intro: "I am Lumina. My PSYCHIC monsters\nalready know how this ends.", lose: "I didn't foresee THAT. Pass." }),
      elite({ id: "elite3", sprite: "goth", x: 6, y: 13, name: "Elite Nox",
        team: [["bewhich", 45], ["dracune", 45], ["banvengeance", 46], ["loliferno", 46], ["hoarseshoo", 47]],
        intro: "Nox. DARK and VENOM. Nobody\nleaves my chamber unhurt.", lose: "Hmph. The last Elite is no joke." }),
      elite({ id: "elite", sprite: "knight", x: 6, y: 7, name: "Elite Vance",
        team: [["saurchin", 46], ["jemuar", 47], ["deviraptor", 47], ["snokari", 46], ["brickhemoth", 48]],
        intro: "I am Vance, last of the Elite\nFour. None reach the Champion\nwithout beating me first!", lose: "Go on. The Champion awaits." }),
      trainer({ id: "champion", outfit: "royal", sprite: "knightlord", x: 6, y: 3, dir: "down", sight: 0, name: "Champion Aurora", champion: 1,
        team: [["drokoro", 47], ["pythonova", 47], ["demosnow", 48], ["novaquarius", 48], ["ziggurat", 49], ["$rival", 50]],
        intro: "So you beat the Elite Four. I am\nAurora, Champion of this land.\nGive me everything!",
        lose: "Magnificent! You are the new\nCHAMPION!" }),
    ],
  });
  W.hall.grid = [...Array(3)].map(() => Array(14).fill("W")).concat(hallRows.map((r) => r.split("")), [Array(14).fill(".")]);
  W.hall.grid[29][6] = W.hall.grid[29][7] = "X";

  for (const [id, town] of [["verdance", "Verdance"], ["cinder", "Cinder"], ["ironhold", "Ironhold"], ["prime", "Prime"]]) {
    W[id + "_center"] = center(town); W[id + "_mart"] = mart(town);
  }
  W.verdance_house = house("House", { sprite: "picnicker", x: 4, y: 4, dir: "down", name: "Kid",
    talk: ["Mom says there are EIGHT gyms!", "The last one, the PRIME GYM, is full of dragons. So cool!"] });
  W.cinder_house = house("House", { sprite: "granny", x: 3, y: 4, dir: "down", name: "Granny",
    talk: ["The mountain rumbles every night.", "Blaze says it's just the volcano snoring."] });
  W.ironhold_house = house("House", { sprite: "firefighter", x: 4, y: 4, dir: "down", name: "Foundry Worker",
    talk: ["We forge the Iron Badges right here in town.", "Forge tests every one by hitting it with a hammer."] });

  W.verdance_gym = gym("Verdance Gym", "green", [
    trainer({ id: "g5_t1", outfit: "ranger", sprite: "woodnymph", x: 2, y: 9, dir: "right", sight: 5, name: "Druid Moss",
      team: [["ninjasmine", 27], ["sapsnap", 27]], intro: "Fern grew us from seeds!", lose: "Uprooted..." }),
    trainer({ id: "g5_t2", outfit: "ranger", sprite: "monk_green", x: 9, y: 6, dir: "left", sight: 5, name: "Druid Oak",
      team: [["bamboon", 28], ["brachifor", 28]], intro: "Slow and steady, like the trees.", lose: "Timber!" }),
    trainer({ id: "g5_leader", outfit: "ranger", sprite: "florist", x: 5, y: 3, dir: "down", sight: 0, name: "Leader Fern", leader: 5,
      team: [["toxiris", 29], ["beenstalker", 30], ["wendigger", 30], ["volcoli", 31], ["moloch", 32]],
      intro: "I'm Fern. My WOOD monsters have\nroots older than this town.\nLet's grow!",
      lose: "You cut right through!\nThe LEAF BADGE is yours.", badge: "Leaf Badge" }),
  ], "chill", "funkboss");
  W.cinder_gym = gym("Cinder Gym", "cream", [
    trainer({ id: "g6_t1", outfit: "miner", sprite: "firefighter", x: 2, y: 9, dir: "right", sight: 5, name: "Stoker Ash",
      team: [["vulpyre", 33], ["shelagu", 33]], intro: "Feel the heat!", lose: "Cooled off..." }),
    trainer({ id: "g6_t2", outfit: "miner", sprite: "magician_fiery", x: 9, y: 6, dir: "left", sight: 5, name: "Fire Eater Kip",
      team: [["flambear", 34], ["potturney", 34]], intro: "I eat fire for breakfast!", lose: "Heartburn..." }),
    trainer({ id: "g6_leader", outfit: "miner", sprite: "magician_fiery", x: 5, y: 3, dir: "down", sight: 0, name: "Leader Blaze", leader: 6,
      team: [["sludgehog", 35], ["loliferno", 36], ["statursus", 36], ["gupphire", 37], ["eruptibus", 38]],
      intro: "Blaze's the name! My FIRE burns\nhotter than the mountain itself!",
      lose: "Doused! Take the\nBLAZE BADGE.", badge: "Blaze Badge" }),
  ], "funky", "boss");
  W.ironhold_gym = gym("Ironhold Gym", "blue", [
    trainer({ id: "g7_t1", outfit: "engineer", sprite: "scientist_black", x: 2, y: 9, dir: "right", sight: 5, name: "Welder Max",
      team: [["bolt", 39], ["katacoon", 39]], intro: "Sparks will fly!", lose: "Burnt out." }),
    trainer({ id: "g7_t2", outfit: "engineer", sprite: "firefighter", x: 9, y: 6, dir: "left", sight: 5, name: "Engineer Dot",
      team: [["uf0", 40], ["angrito", 40]], intro: "Calibrated for victory!", lose: "Recalibrating..." }),
    trainer({ id: "g7_leader", outfit: "engineer", sprite: "knight", x: 5, y: 3, dir: "down", sight: 0, name: "Leader Forge", leader: 7,
      team: [["sphake", 41], ["gastronium", 42], ["tigrock", 42], ["hydrone", 43], ["lightmare", 44]],
      intro: "I'm Forge. My STEEL monsters\ndon't dent. Hit them with all\nyou've got!",
      lose: "You bent steel!\nThe IRON BADGE is yours.", badge: "Iron Badge" }),
  ], "route", "boss");
  W.prime_gym = gym("Prime Gym", "blue", [
    trainer({ id: "g8_t1", outfit: "royal", sprite: "dragonrider", x: 2, y: 9, dir: "right", sight: 5, name: "Dragon Tamer Ryu",
      team: [["sapragon", 43], ["devidra", 44]], intro: "Dragons answer only to the strong.", lose: "My dragons... respect you." }),
    trainer({ id: "g8_t2", outfit: "royal", sprite: "dragonrider_green", x: 9, y: 6, dir: "left", sight: 5, name: "Dragon Tamer Kira",
      team: [["dragarbor", 44], ["ferricran", 45]], intro: "Drake is waiting. Get past me first!", lose: "Go. Drake will finish you." }),
    trainer({ id: "g8_leader", outfit: "royal", sprite: "knightlord", x: 5, y: 3, dir: "down", sight: 0, name: "Prime Leader Drake", leader: 8,
      team: [["allagon", 45], ["firomenis", 46], ["qetzlrokilus", 46], ["wrougon", 47], ["golnagi", 48]],
      intro: "I am Drake of the PRIME GYM.\nSeven badges got you here.\nDragons decide if you go on!",
      lose: "Incredible... The PRIME BADGE\nis yours. The Champion awaits!", badge: "Prime Badge" }),
  ], "mystery", "darkboss");

  // ---------------- Glimmer Cave (north off Route 4) ----------------
  // Pitch dark: a Lightning or Fire monster plus the Volt Badge lights it with FLASH. Wild monsters lurk on
  // every floor tile. The deepest chamber holds ASUDOPT, but only for a Champion who caught the other 3 legends.
  W.cave = outdoor({
    name: "Glimmer Cave", w: 24, h: 32, music: "mystery", bg: "cave", cave: true, rate: 0.08,
    ops: [
      ["T", 0, 0, 24, 32],
      [".", 11, 22, 2, 10], [".", 4, 18, 16, 6], [".", 4, 8, 3, 10], [".", 4, 4, 9, 5],
      [".", 11, 6, 9, 2], [".", 14, 2, 8, 6],
      ["T", 9, 20, 2, 2], ["~", 15, 19, 3, 2], ["T", 6, 5, 1, 1],
    ],
    exits: [{ edge: "s", at: 11, w: 2, to: "route4" }],
    signs: [{ x: 13, y: 24, text: "GLIMMER CAVE\nToo dark to see without FLASH." }],
    legends: [{ id: "legend_asudopt", slug: "asudopt", lv: 55, x: 18, y: 3, needs: ["primordia", "pharavion", "kernel"] }],
    items: [{ id: "item_cave_mega", x: 5, y: 9, item: "mega_potion", n: 2 }],
    npcs: [
      { kind: "trainer", sight: 3, id: "cave_hiker", outfit: "miner", sprite: "miner_green", x: 7, y: 20, dir: "right", name: "Spelunker Rhea",
        team: [["imbrickcile", 25], ["grimachin", 26], ["runesquito", 26]], intro: "You found the cave! Few make it this deep.", lose: "Watch your step in the dark!" },
    ],
    encounters: [],
  });

  // ---------------- Battle Tower (Shade Hollow, after the Champion) ----------------
  W.tower = interior({
    name: "Battle Tower", w: 12, h: 10, music: "funky", fight: "boss", wall: "blue", floor: "gray",
    rugs: [[4, 6]], ops: [["C", 2, 4, 3, 1], ["C", 7, 4, 3, 1]],
    npcs: [
      { sprite: "scientist", x: 3, y: 3, dir: "down", name: "Tower Host", role: "tower" },
      { sprite: "shopkeeper", x: 8, y: 3, dir: "down", name: "Prize Clerk", role: "towershop" },
    ],
  });

  // ---------------- Side quests ----------------
  // quest: { id, ...} drives talk in game.js (questTalk); items appear once the quest is started.
  W.ember.npcs.push({ sprite: "picnicker", x: 14, y: 12, dir: "down", name: "Little Pia", quest: "teddy" });
  W.route2.items = [{ id: "item_teddy", x: 40, y: 6, item: "toy_bear", needFlag: "q_teddy_started" }];
  W.volt.npcs.push({ sprite: "scientist", x: 23, y: 17, dir: "left", name: "Dr. Fenn", quest: "egg" });
  W.hollow.npcs.find((n) => n.name === "Old Whisper").quest = "flute";
  W.hollow_house.items = [{ id: "item_flute", x: 5, y: 3, item: "flute", needFlag: "q_flute_started" }];

  // ---------------- Wild areas ----------------
  // Each route has its own theme and its own species (no repeats between routes), and each one is
  // tougher than the last, in step with its trainers. Species are listed as base forms; wild ones high
  // enough above their evolution level show up already evolved (see wildForm in game.js).
  // [slug, minLv, maxLv, weight]  weight 3 common, 2 uncommon, 1 rare.
  // night: species that only come out after dark (mixed into the land table from 8pm to 5am)
  const area = (id, theme, land, water, night) => {
    W[id].theme = theme; if (land) W[id].encounters = land; if (water) W[id].water = water; if (night) W[id].night = night;
  };
  const lv = (lo, hi, list) => list.map(([s, w]) => [s, lo, hi, w]);
  area("route1", "Greenwood Trail", lv(3, 6, [ // first steps: bugs, birds and burrowers
    ["dandicub", 3], ["katapill", 3], ["scarlant", 3], ["chickadee", 3], ["pipis", 2], ["snaki", 2],
    ["nut", 2], ["stonifly", 2], ["cataspike", 2], ["aardorn", 1], ["squabbit", 1]]), null,
    lv(4, 6, [["memnomnom", 3], ["rosarin", 2], ["fordin", 1]])); // night bloomers and a hungry night grazer
  area("route2", "Duskwood", lv(7, 12, [ // deep forest at dusk: plants, moths, bats, poisons
    ["banling", 3], ["turnipper", 3], ["slichen", 2], ["lambert", 2], ["budaye", 2],
    ["tumbleworm", 2], ["poinchin", 2], ["trapsnap", 1], ["hatchling", 1]]),
    lv(7, 11, [["nostray", 2], ["squink", 2], ["fluoresfin", 1]]),
    lv(8, 12, [["noctula", 3], ["fluttaflap", 3], ["vamporm", 2], ["eyenemy", 2], ["cateye", 1], ["merlicun", 1]])); // bats, moths, eyes in the dark
  area("route3", "Frostridge Pass", lv(12, 17, [ // cold mountain: rock, ice and fire
    ["rockitten", 3], ["waysprite", 3], ["pawsand", 2], ["grintot", 2], ["eskipup", 2], ["tweesher", 2], ["chillimp", 2],
    ["hissiorite", 2], ["furnursus", 2], ["cardiling", 2], ["imbrickcile", 2], ["flacono", 2], ["devidin", 1],
    ["lesmagu", 1]]),
    lv(12, 16, [["tadcool", 2], ["jelillow", 2], ["dollfin", 1]]),
    lv(13, 17, [["demosnow", 3], ["foxfire", 2], ["selket", 2], ["ignibus", 1]])); // snow demons and will-o'-wisps
  area("route4", "Starfall Woods", lv(16, 22, [ // meteor-struck forest: metal, cosmic, storm and dragons
    ["boltnu", 3], ["virware", 2], ["sprorm", 2], ["grimachin", 2],
    ["joulraton", 2], ["fancair", 2], ["pythwire", 2], ["bugnin", 2], ["stomic", 2], ["komodraw", 1], ["cardinale", 1],
    ["wrougon", 1], ["chloragon", 1], ["pythonova", 1]]),
    lv(15, 20, [["nebufin", 2], ["spirain", 2], ["gupphish", 1]]),
    lv(17, 22, [["chromeye", 3], ["metesaur", 3], ["tetrchimp", 2], ["bursa", 1]])); // stargazers under falling stars
  area("hollow", "Ghost Town", lv(16, 21, [ // what haunts the empty town
    ["ghosteeth", 3], ["cackleen", 3], ["babysnitch", 3], ["potturmeist", 3], ["seirein", 2], ["uneye", 2],
    ["hoarse", 2], ["runesquito", 2]]),
    lv(16, 20, [["manosting", 1], ["seirein", 1]]),
    lv(18, 22, [["djinnbo", 2], ["yiinaang", 2]])); // the town's true residents wake at night
  W.sprout.water = [["tadcool", 3, 5, 2], ["dollfin", 3, 5, 1]];
  area("cave", "Glimmer Cave", lv(19, 25, [ // rock, metal and shadow dwellers, already evolved this deep
    ["rockitten", 3], ["imbrickcile", 3], ["potturmeist", 2], ["pawsand", 2], ["nut", 2], ["boltnu", 2],
    ["grintot", 2], ["babysnitch", 1], ["noctula", 2]]),
    lv(19, 23, [["squink", 2], ["jelillow", 1]]));
  W.tide.water = lv(7, 11, [["squink", 2], ["nostray", 2], ["dollfin", 2], ["fluoresfin", 1], ["gupphish", 1], ["jelillow", 1]]);
  W.shade.water = [["manosting", 20, 24, 1], ["nebufin", 20, 24, 1]];
  // The Frost Sea side route: ice floes and a glacier, between the 2nd and 3rd gyms.
  area("frostsea", "Frost Sea", lv(13, 18, [ // frosty grass on the floes and the glacier
    ["houndice", 3], ["heronquak", 3], ["angesnow", 2], ["seraphice", 2], ["snowrilla", 2], ["eaglace", 1]]),
    lv(12, 17, [["fribbit", 3], ["bigfin", 3], ["bedoo", 2], ["hectapod", 2], ["crustagu", 2], ["tornicane", 1], ["gupphire", 1]]),
    lv(14, 18, [["lucifice", 2]])); // the ice devil only skates out at night
  area("icecave", "Ice Cave", lv(14, 19, [ // the babies of the ice families shelter in here
    ["eskipup", 3], ["chillimp", 3], ["tweesher", 3], ["waysprite", 2], ["demosnow", 2], ["houndice", 1]]),
    lv(14, 18, [["tadcool", 3], ["fribbit", 1]]),
    lv(16, 20, [["lucifice", 2], ["demosnow", 3]]));
  // Past Shade Hollow the wild ones are mostly already evolved.
  area("route5", "Thornwood Wilds", lv(22, 27, [ // ancient overgrown forest: wood, venom and birds
    ["dandylion", 3], ["legko", 3], ["ninjasmine", 2], ["bamboon", 2], ["spycozeus", 2], ["stegofor", 2], ["brachifor", 2],
    ["tumblebee", 2], ["birdling", 2], ["corvix", 1]]),
    lv(22, 26, [["galasces", 2], ["krokivip", 1]]),
    lv(23, 27, [["spighter", 2], ["dracune", 2], ["hoarseshoo", 1]]));
  area("route6", "Ashfall Trail", lv(27, 32, [ // volcanic ash fields: fire and earth
    ["cobarett", 3], ["cardiwing", 2], ["solight", 2], ["grinflare", 2], ["rockat", 3], ["selmatek", 2],
    ["urcheedle", 2], ["knightsand", 1], ["cocrune", 2]]),
    lv(27, 31, [["lightmare", 1]]),
    lv(28, 32, [["vulpyre", 2], ["loliferno", 1]]));
  area("route7", "Rustline Road", lv(32, 37, [ // scrapyards and power lines: steel, lightning and psychic
    ["puparmor", 3], ["weavifly", 2], ["trojerror", 2], ["windeye", 2], ["apeoro", 2], ["arthrobolt", 2],
    ["eyesore", 2], ["masknake", 2], ["angrito", 1]]),
    lv(32, 36, [["hydrone", 2]]),
    lv(33, 37, [["bewhich", 2], ["lunight", 2], ["equill", 1]]));
  area("route8", "Victory Ridge", lv(37, 42, [ // the toughest wilds before the Prime Gym
    ["bricgard", 3], ["myrmison", 2], ["miaownolith", 2], ["glombroc", 2], ["conglolem", 2], ["rabbitosaur", 2],
    ["strella", 2], ["gryfix", 2], ["aardart", 2], ["komoduel", 1], ["devidra", 1]]),
    null,
    lv(38, 42, [["mystikapi", 2], ["qetzlrokilus", 1]]));

  // ---------------- Weather ----------------
  // kind: rain / snow / ash. from-to: the in-game hours it happens (always, if left out). mons: weather-only monsters
  // mixed into the grass while it lasts.
  W.route2.weather = { kind: "rain", from: 13, to: 17, mons: [["fribbit", 8, 12, 2]] };
  W.tide.weather = { kind: "rain", from: 13, to: 17, mons: [["tornicane", 11, 15, 2], ["galasces", 11, 15, 1]] };
  W.route3.weather = { kind: "snow", mons: [["houndice", 13, 17, 2]] };
  W.frostsea.weather = { kind: "snow" };
  W.route6.weather = { kind: "ash", mons: [["eruptibus", 28, 32, 1]] };

  // ---------------- Gym puzzles ----------------
  // Each gym is a 14x18 room: 3 rows of wall, 14 rows of puzzle (y 3-16), the exit at the bottom (x 6-7).
  // R rock, H hedge, P pillar/statue (solid). I slippery floor: you slide until something stops you.
  // 1 / 2 floor switches: stepping on one opens every g / j gate for good. The leader stands at (6, 3).
  // pos: where the two gym trainers and the leader stand, [x, y, facing, sight].
  const puzzle = (id, rows, pos, extra = {}) => {
    const m = W[id];
    if (rows.length !== 14 || rows.some((r) => r.length !== 14)) throw new Error(id + ": puzzle rows must be 14x14");
    m.w = 14; m.h = 18; m.rugs = [];
    m.grid = [...Array(3)].map(() => Array(14).fill("W")).concat(rows.map((r) => r.split("")), [Array(14).fill(".")]);
    m.grid[17][6] = m.grid[17][7] = "X";
    m.npcs.forEach((n, i) => { const [x, y, dir, sight] = pos[i]; Object.assign(n, { x, y, dir }, sight != null ? { sight } : {}); });
    Object.assign(m, extra);
  };
  puzzle("ember_gym", [ // a maze of boulders
    "..............",
    "..............",
    "RRRRR.RRRRRRR.",
    ".....R......R.",
    ".RRR.R.RRRR.R.",
    ".R...R.R....R.",
    ".R.RRR.R.RRRR.",
    ".R.....R......",
    ".RRRRRRR.RRRR.",
    "..............",
    "RRRRRR.RRRRRRR",
    "..............",
    "..............",
    "..............",
  ], [[2, 12, "right", 4], [9, 6, "left", 2], [6, 3, "down", 0]]);
  puzzle("tide_gym", [ // a slippery wet floor: slide, and stop against the pillars
    "..............",
    "PPPPPPP.PPPPPP",
    "IIIIIIIIPIIIII",
    "IIIIIIIIIIIIII",
    "IIIPIIIIIIIIPI",
    "IIIIIIIIIIIIII",
    "IPIIIIIIIIIIII",
    "IIIIIIIPIIIIII",
    "IIIIIIIIIIIPII",
    "IIIIPIIIIIIIII",
    "IIIIIIIIIIIIII",
    "IIIIIIIIIIIIII",
    "..............",
    "..............",
  ], [[1, 15, "right", 3], [12, 16, "left", 3], [6, 3, "down", 0]], { ice: 0x9fd8f0 });
  puzzle("volt_gym", [ // floor switches open the electric gates
    "..............",
    "..............",
    "PPPPPPPPPPjPPP",
    "..............",
    "2.............",
    "..............",
    "PPPgPPPPPPPPPP",
    "..............",
    ".............1",
    "..............",
    "..............",
    "..............",
    "..............",
    "..............",
  ], [[4, 11, "down", 3], [8, 7, "down", 3], [6, 3, "down", 0]], { gateCol: 0xffe040 });
  puzzle("shade_gym", [ // a pitch-dark maze of pillars
    "..............",
    "PPPPP.PPPPPPPP",
    "....P.......P.",
    ".PP.P.PPPPP.P.",
    ".P..P.P...P...",
    ".P.PP.P.P.PPP.",
    ".P....P.P...P.",
    ".PPPPPP.PPP.P.",
    "........P...P.",
    "PPPPPP.PP.PPP.",
    "......P.......",
    ".PPPP.P.PPPPPP",
    "..............",
    "..............",
  ], [[0, 11, "right", 3], [13, 5, "down", 2], [6, 3, "down", 0]], { dark: true });
  puzzle("verdance_gym", [ // a hedge maze
    "..............",
    "HHHHHH.HHHHHHH",
    ".......H.....H",
    ".HHHH.H.HHHH.H",
    ".H..H...H..H.H",
    ".H.HHHHHH.HH.H",
    ".H........H..H",
    ".HHHHHHH.HH.HH",
    "...H.....H....",
    "HH.H.HHHHH.HH.",
    "...H.......H..",
    ".HHHHHHHHH.H.H",
    "..............",
    "..............",
  ], [[12, 10, "left", 3], [3, 7, "left", 2], [6, 3, "down", 0]]);
  puzzle("cinder_gym", [ // boulders, fire gates and the switches that douse them
    "..............",
    "..............",
    "RRRRRRgRRRRRRR",
    ".......R.....1",
    ".RRRR.R.RRRRR.",
    ".R....R.t.....",
    ".R.RRRRRRRRjRR",
    ".R...........2",
    ".RRRRRRRRRRR..",
    "..............",
    "RRRRRR.RRRRRRR",
    "..............",
    "..............",
    "..............",
  ], [[2, 12, "right", 4], [8, 8, "right", 3], [6, 3, "down", 0]], { gateCol: 0xff6020 });
  puzzle("ironhold_gym", [ // polished steel: slide across it
    "..............",
    "PPPPPP.PPPPPPP",
    "IIIIIPIIIIIIII",
    "IIIIIIIIIIIPII",
    "IIIIIIIIIIIIII",
    "PIIIIIIIIIIIII",
    "IIIIIIPIIIIIII",
    "IIIIIIIIIIIIIP",
    "IIIIIIIIIIIIII",
    "IIPIIIIIIIIIII",
    "IIIIIIIIIPIIII",
    "IIIIIIIIIIIIII",
    "..............",
    "..............",
  ], [[0, 15, "right", 3], [13, 16, "left", 3], [6, 3, "down", 0]], { ice: 0xb8c4cc });
  puzzle("prime_gym", [ // a hall of dragon statues, two sealed gates
    "..............",
    "..............",
    "PPPPPPjPPPPPPP",
    "P...........2P",
    "P.PPPPPPPPPP.P",
    "P.P........P.P",
    "P.P.PPgPPP.P.P",
    "P.P.P....P.P.P",
    "P...P..1.P...P",
    "PPPPP....PPPPP",
    "..............",
    "..............",
    "..............",
    "..............",
  ], [[3, 13, "right", 4], [10, 13, "left", 4], [6, 3, "down", 0]], { gateCol: 0xb070ff });

  // ---------------- Hidden nooks behind CUT bushes (b), ROCK SMASH rocks (k) and STRENGTH boulders (o) ----------------
  // Each is carved into a clump of trees: the item sits inside, the obstacle blocks the only way in.
  const nook = (id, [gx, gy, ch], [ix, iy], item, n = 1) => {
    const m = W[id];
    m.grid[gy][gx] = ch; m.grid[iy][ix] = ".";
    (m.items = m.items || []).push({ id: `nook_${id}_${ix}_${iy}`, x: ix, y: iy, item, n, behind: ch });
  };
  nook("route1", [4, 17, "b"], [4, 16], "great_ball", 2);
  nook("route2", [17, 5, "b"], [17, 4], "berry_wood");
  nook("route3", [16, 17, "k"], [16, 16], "level_treat");
  nook("route4", [20, 5, "o"], [20, 4], "exp_candy");
  nook("route5", [15, 27, "o"], [15, 26], "berry_dark");
  nook("route6", [16, 5, "k"], [16, 4], "elixir", 2);
  nook("route7", [14, 21, "o"], [14, 20], "exp_candy");
  nook("route8", [29, 6, "b"], [29, 5], "level_treat", 2);

  window.WORLD = { maps: W, BUILDINGS };
})();
