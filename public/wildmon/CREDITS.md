# Wildmon

A top-down 2D monster-catching RPG in the browser: pick a starter, battle wild monsters in the tall grass,
fight trainers, beat 7 gyms and the Prime Gym, then challenge the Champion.

## Play

```bash
cd game && python3 -m http.server 5237
```

Open http://localhost:5237. (It must be served over HTTP, not opened as a file, so the audio
samples can load.)

| Key | Action |
|---|---|
| Arrows | walk (hold SHIFT to run); a quick tap just turns to face that way |
| Z / Enter / Space | talk, confirm |
| X / Esc | menu, back |
| F | fly (after the Volt Badge, with a Sky monster) |
| T | teleport to a visited town (with a Psychic monster, once you have the Shade Badge or have returned Old Whisper's flute) |
| M | mute music |

**Your trainer.** A new game starts by choosing boy or girl and a red, blue or green outfit; you
(and your rival) are Tuxemon's boy or girl walking sprite recoloured to that outfit (older
saves are asked once). Your rival is always the opposite gender in a contrasting colour (red ↔ green,
blue → gold). The Water starter is Kroki, a small upright baby croc. The rival picks the starter that beats yours, challenges you in the lab (a practice
battle with no blackout), again on Route 2, Route 3, Route 5 and Victory Ridge, and their ace ends up in the Champion's team.

**Types and families.** 14 types: Tuxemon's Metal, Shadow and Cosmic are Wildmon's Steel, Dark and
Psychic (same matchups), plus a new Dragon type (weak to Frost and Dragon, resisted by Steel, shrugs
off Fire/Water/Wood/Lightning) with its own Dragon Claw and Dragon Breath. The starters each have 3
forms, except the Water starter, which has 4 (Kroki → Krokivip at 14 → Leviadile at 23 → Golnagi at 30); every other family has 2 or 3 (fixed seed in
`tools/build_data.py`), with one-of-a-kind species paired up by type. The Wildmon-Dex (menu → DEX)
has each species' lore and where it's found; a green dot marks species living in the area you're in,
with a HERE seen/total count. New species are announced the first time you meet them.

**Wild areas are themed and get tougher each route**, each with its own species (none shared between
routes): Route 1 Greenwood Trail (Lv 2–5: bugs, birds, burrowers), Route 2 Duskwood (Lv 8–13: plants,
moths, bats, poisons), Route 3 Frostridge Pass (Lv 15–20: rock, ice, fire), Route 4 Starfall Woods
(Lv 22–28: metal, cosmic, storm, dragons), Hollowmere ghost town (Lv 24–29). Wild picks never repeat a
species you met in the last few encounters, unlogged species turn up twice as often, and wild monsters
well past their evolution level appear already evolved. Tables live in the "Wild areas" section of
`game/maps.js`.

**Hollowmere, legendaries and the sleeping giant.** A side path west off Route 3 leads to Hollowmere,
an abandoned ghost town (fog, dead trees, ghost trainers, ghost-type monsters in the grass). A giant
COALDIAK sleeps across that path: Kat in Volt City gives you the WAKE BELL to rouse it (then battle
it). Three legendaries wait in the world, one each: PRIMORDIA at Hollowmere's Shrine of Origins,
PHARAVION on top of the glacier in the Frost Sea, and KERNEL in a clearing on Route 4. Walk up and
press Z; catch or beat one and it's gone for good. You can talk to anyone you're near and roughly
facing, from any angle, and they turn to face you.

**Riding your monsters.** With the Tide Badge and a Water monster, face the water and press Z to
SURF: you stand on a surfboard with your monster riding up front (water has its own wild monsters, and a Sea Shrine island sits off Tide Harbor). After you surf back to shore you hop fully onto land, so you never get stuck at the water's edge.
With the Volt Badge and a Sky monster, press F to FLY to any town you've visited. The mount is
your monster's real sprite, with you riding on top.

**Phones:** on a touch screen the game fills the width and shows a thumb joystick plus A, B and a RUN toggle. In landscape the controls sit either side of the screen. They
send the same key presses as a keyboard, so nothing else changes.

**Day and night:** one real minute is one in-game hour (a new game starts at 8am; night is 8pm–5am).
The sky, sun and fog fade through an orange dusk into a blue night with stars, the clock sits by the
minimap, routes switch to the mysterious track and towns to the chill one. Every wild area has
night-only monsters (bats and moths in Duskwood, snow demons on Frostridge, stargazers in Starfall).

**Mom** sends you off after you get your starter: the town exit stays shut until you visit her, and she
explains the gyms, badges, wild areas, night monsters, type matchups, healing and the Dex, then gives
5 Potions and $1000.

**Dex rewards:** Prof. Oakley hands out prizes at 10/25/50/75/100 kinds caught (Great Balls, Sweet Sand,
the Lucky Bamboo shiny charm, Level Treats, a Master Ball) and tells you the next goal.

**Shiny monsters:** 1 in 200 wild monsters (x3 with Lucky Bamboo, x2 under Sweet Sand) use a
hue-rotated copy of their sprite, sparkle when they appear, and get a gold star in battle, the party
and the Dex.

**Fishing and Glimmer Cave:** the Old Angler in Tide Harbor gives a Fishing Rod; face any water and press
Z (you can pick FISH or SURF). Glimmer Cave, up a side path north of Route 4, is pitch dark until a
Lightning or Fire monster plus the Volt Badge lights it with FLASH; wild monsters live on every floor
tile there.

**After the Champion:** the Battle Tower in Shade Hollow (Champions only) runs win streaks against
random Lv 40–70 teams for Tower Points, spent at the Prize Clerk. ASUDOPT, a 4th legendary, appears in
the cave's deepest chamber once you're Champion and have caught the other three.

**Side quests** (menu → QUESTS): find Little Pia's teddy on Route 2, carry Dr. Fenn's ancient egg to
Prof. Oakley (it hatches into a shiny), and recover Old Whisper's flute in Hollowmere.

**Catching:** after a catch a congrats fanfare plays (the `caught` track in music.js) and the
monster's Dex page opens with a "CAUGHT!" banner; Z returns you to the exact spot you were standing.
Type icons sit beside monster names in battle, the party, the Dex and info pages. Every monster has
1 or 2 types.

**Your attacks rarely miss:** your monsters miss a quarter as often as a move's listed accuracy
(an 80% move hits 95% of the time); foes use the listed accuracy (`PLAYER_MISS_SCALE` in game.js).

**The world is 2D, drawn from Tuxemon's 16px tilesets** (`game/world2d.js`): grass, sand, stone, snow
and ice ground with matching cliffs and stairs, big forest trees whose tops you walk behind, Tuxemon
buildings and NPC walking sprites. Each kind of place has its own look: snowy pines and icy shores in
the Frost Sea, ash-dark stone around Cinder, autumn trees near Prime City, palms by the beach, rock walls
in caves. Healing Centers have a Nurse to heal and a PC in the corner for depositing and withdrawing monsters.

**The Ice Cave** opens in the Frost Sea glacier's north face: a frozen hall with baby ice monsters
(Eskipup, Chillimp, Tweesher, Waysprite, Demosnow), an ice hermit, and a sheet of ice you slide across
to reach a Sweet Candy (every spot on the ice can slide back out).

**Trainers are themed by area:** forest rangers on the routes, miners in the Ember Gym, sailors in
the Tide Gym, engineers in the Volt Gym, occultists in the Shade Gym, royal guards in the Champion's
Hall. Route trainers only ambush once your team is 3 levels above their strongest monster.

## World

Sprout Town → Route 1 → **Ember City** (Rock gym, Earth) → Route 2 → **Tide Harbor** (Tide gym, Water)
→ Route 3 → **Volt City** (Volt gym, Lightning) → Route 4 → **Shade Hollow** (Shade gym, Shadow)
→ Route 5 Thornwood Wilds → **Verdance** (Leaf gym, Wood) → Route 6 Ashfall Trail → **Cinder Peak** (Blaze gym, Fire)
→ Route 7 Rustline Road → **Ironhold** (Iron gym, Steel) → Route 8 Victory Ridge → **Prime City** (the PRIME GYM:
dragons) → Champion's Hall in Prime City. Guards gate each leg by badge count (8 badges for the Hall).
Wild levels climb from 2–5 on Route 1 to 46–51 on Victory Ridge; gym leaders' strongest monsters go 13, 18, 25,
31, 38, 42, 48, 53, and the Champion tops out at 55. The trainer card shows all 8 badges.

**Support moves, stages and statuses:** every monster learns two moves for its first type (tools/build_data.py
`SUPPORT_MOVES` / `SUPPORT_BY_TYPE`): stat raisers (Flex, Focus, Stone Skin, Mist Veil, Tailwind), drops (Snarl,
Acid Spit, Mud Shot), heals (Photosynth, Regenerate, Second Wind), SLEEP (Lullaby, Spore Cloud: skips 1-3 turns),
PARALYSIS (Static Jolt: half speed, 1 in 4 turns lost) and strike-first attacks (Quick Strike, Ice Shard,
Shadow Sneak). Stat stages: +1 = x1.5, +2 = x2, -1 = x0.67 (capped at +-4), reset when a monster leaves the
field. Foes use support moves when they make sense (heal when low, sleep you when you have no status...).
Status chips (BRN PSN SLP PAR) sit just outside the HP boxes. FULL HEAL ($400) cures any status.

**Held items** (PARTY > ITEM to give or take): Apple (eaten at half HP for 1/3 HP), Elixir (cures the first
status), Sweet Candy (+50% EXP, from 3 badges or the Battle Tower) and a Berry per type (+20% to that type's
moves, from 2 badges). Icons are Tuxemon's own item art. Long menus (the mart) scroll.

**Type guide:** TYPES in the menu shows, for each of the 14 types, what its moves are strong and weak against
and what it is weak to or tough against. Frost is weak to Fire and Heroic.

**Moves outside battle:** walk into an obstacle (or face it and press Z). CUT (Rock Badge + a Wood monster)
clears the orange thorn bushes, ROCK SMASH (Volt Badge + an Earth or Steel monster) breaks cracked rocks, STRENGTH (Shade Badge +
an Earth, Heroic or Normal monster) shoves big boulders aside. Each guards a hidden nook on Routes 1-8 with
a good item (Great Balls, berries, Level Treats, Sweet Candy, Elixirs); cleared obstacles stay cleared.

**Gym puzzles:** every gym is a 14x18 puzzle room: Ember a boulder maze, Tide a slippery wet floor (you slide
until a pillar stops you), Volt floor switches that open electric gates, Shade a pitch-dark pillar maze (no
minimap), Verdance a hedge maze, Cinder fire gates opened in sequence, Ironhold a polished steel floor to
slide across, and the Prime Gym a hall of dragon statues with two sealed gates. Pressed switches stay pressed.
`tools/validate_world.js` solves every gym (walking, sliding and switches) and checks the leader and every gym
trainer can be reached, and that each nook item needs its field move.

**Elite Four:** the Champion's Hall is four Elite chambers in a row (Glacia: Frost, Lumina: Psychic, Nox:
Dark/Venom, Vance: Steel/Heroic), then Champion Aurora. Each Elite stands in the doorway to the next chamber
and steps aside once beaten; no healing between fights, only your items.

**Weather:** afternoon rain (13:00-17:00) on Route 2 and at Tide Harbor, snow on Frostridge Pass and the Frost
Sea, falling ash on the Ashfall Trail. Rain and ash grey the sky; the clock shows RAIN / SNOW / ASH; a banner
says when rain starts and stops. Some monsters only show up in that weather (the Dex marks them).

**Day Care and eggs:** in Ember City. A monster left there gains a level every 150 steps you walk (never past
your strongest monster; $100 a level). Every 400 steps it also leaves an EGG of its species' first form
(carry up to 3); eggs hatch after 250 more steps at Lv 5, with double the shiny odds.

**Region map:** MAP in the menu shows every town, route and side area. Browse them to see each one's name and
how many of its wild monsters you've caught; a gold star marks an area you've caught everything in. Fly and
Teleport show the same map with the highlighted town.

**Move cards:** when a monster wants to learn a move, and when you highlight a move in battle, a card
shows its type, MELEE or RANGED (which stats it pits: MELEE vs ARMOUR, RANGED vs DODGE), power, the real
chance it hits for your side, PP, its burn/poison chance (burned or poisoned foes lose 1/8 HP a turn),
and a gold x1.5 chip when it matches the monster's type. In battle it also says how it does against the
foe in front of you (SUPER x2, WEAK x0.5, NO EFFECT) and about how much of its HP one hit takes, using
the game's own damage formula. Before forgetting a move you see the new move and each old one side by side.
Level Treats now let you swap moves too.

**Evolution is sculpting:** the monster hardens into clay, sags into a lump on a potter's wheel, gets
kneaded by two palms, and is pulled back up, bottom first, into its new form, which is glazed into full
colour with a sparkle burst (`evolveScene` in game.js, built from the sprites' own pixels).

**Difficulty is tuned with a playtest bot:** `node tools/playtest_curve.js` plays the whole game with each
starter (seeded, 20 runs by default) using the game's own stat, damage, accuracy, EXP and evolution code
pulled straight out of game.js. It walks each route (`--wild 8` battles), fights every trainer, catches and
switch-trains a team of 6, and grinds the last route whenever it loses to a gym. It prints, per gym, the
boss's top level, your top and average level, the share of runs won on the first try and how much grinding
was needed. `--side` adds the Frost Sea, Hollowmere and Glimmer Cave. `python3 tools/shift_levels.py
teams:<map>=-1 wild:<area>=+1` shifts levels. Finding: the EXP rate barely matters (the team settles near
the latest route's wild level either way); the gap between a route and the next gym is what sets difficulty.
Tuned so a natural player wins most gyms within one or two tries (25–60% first try, about 5–10 wild battles
of grinding at the median). Doing the side areas makes the middle gyms easy (80–90%).

**Frost Sea (side route):** east along Tide Harbor's pier. Surf between ice floes with frosty tall grass
(water and ice monsters, Lv 17–23, plus an ice devil at night). A glacier rises in the northeast: maps
can now raise tiles (`raise: [[x, y, w, h, height]]`), and you can only step up or down half a tier at a
time, so you climb its two tiers by the ice steps. Pharavion (Lv 32) waits on the top tier. Tide Harbor
itself got easier (water Lv 11–15, island grass Lv 14–19). 208 monsters in 85 families, 135 moves, 14 types.

## Music

Generated live by `game/music.js`, with a track for each place:

| Place | Style |
|---|---|
| Home, Sprout Town, lab, centers, marts | lo-fi chill |
| Ember City, Ember/Tide gyms | funky house (leader fights: harder funky house) |
| Tide Harbor | liquid DnB |
| Volt City / Volt gym | DnB / jungle (leader fight: neurofunk) |
| Shade Hollow, Shade gym, Champion's Hall | dark Phrygian (Shade leader: dark techno) |
| Routes | jungle |
| Wild grass battles | dancefloor DnB |
| Trainer battles | ragga jungle |

## Rebuilding data and assets

```bash
python tools/build_data.py      # Tuxemon DB in .tmp/db -> game/data.js + asset manifest
python tools/fetch_assets.py    # downloads every asset in the manifest (validates file types)
node tools/validate_world.js    # checks maps: overlaps, reachable doors, paired exits, sightlines
```

## Credits

- **Monster, character, tile, building, battle-background art and the font** come from the
  [Tuxemon](https://github.com/Tuxemon/Tuxemon) project (art mostly CC BY-SA; code GPLv3; font
  Press Start 2P under the SIL OFL, see `game/assets/fonts/OFL.txt`). Monster stats, moves and type
  chart are adapted from Tuxemon's database. Type icons are Tuxemon's element icons
  (`game/assets/types`; Dragon uses the Aether icon on a purple chip, since Tuxemon has no Dragon).
- **Drum samples:** Roland TR-909 and TR-808 recordings from
  [fluid-music/open-drums](https://github.com/fluid-music/open-drums) (originally machines.hyperreal.org).
  The 909 set is free to copy and distribute unmodified and **not for profit**; see
  `game/assets/drums/909/TR909SET.TXT`. The 808 set has no restrictions; see `TR808.TXT`.
- **Overworld tilesets** (`game/assets/tiles/`), all from Tuxemon's `mods/tuxemon/gfx/tilesets`
  (see Tuxemon's ATTRIBUTIONS.md):
  - `nature.png` and `water.png` ("Core Outdoor Nature" / "Core Outdoor Water") and `outdoor.png`
    ("Core Outdoor") by rubberduck, based on tiles by Buch (commissioned by luke83, with changes by luke83
    and Past the Future), George_, luke83, PastTheFuture and Midi's Kyrodian Legends tileset;
    CC BY-SA 4.0 (parts CC BY 3.0 / 4.0).
  - `Basic_Buch_Tiles_Compiled.png` by Buch, commissioned by luke83, changes by luke83 and Past the Future; CC BY 3.0.
  - `interior.png` ("Interior Tiles") by ArMM1998; public domain (CC0).
  - `electronics.png` ("Electronics Tileset") by Mike Bramson; CC BY-SA 4.0.
- The old 3D version (Kenney and Quaternius models, three.js) is kept outside the game in `legacy3d/`.

Because of the CC BY-SA art and the not-for-profit 909 samples, keep this project free and credited.
