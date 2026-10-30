# Wildmon

A 3D monster-catching RPG in the browser: pick a starter, battle wild monsters in the tall grass,
fight trainers, beat 4 gyms, then challenge the Champion.

## Play

```bash
cd game && python3 -m http.server 5237
```

Open http://localhost:5237. (It must be served over HTTP, not opened as a file, so the audio
samples can load.)

| Key | Action |
|---|---|
| UP | walk forward (hold SHIFT to sprint) |
| LEFT / RIGHT | steer |
| DOWN | back up |
| Z / Enter / Space | talk, confirm |
| X / Esc | menu, back |
| F | fly (after the Volt Badge, with a Sky monster) |
| T | teleport to a visited town (any time, with a Psychic monster) |
| M | mute music |

**Your trainer.** A new game starts by choosing boy or girl and a red, blue or green outfit; you
(and your rival) are realistic, motion-captured 3D people wearing that colour (older
saves are asked once). Your rival is always the opposite gender in a contrasting colour (red ↔ green,
blue → gold). The Water starter is Krokivip (the fiercer form of Kroki). The rival picks the starter that beats yours, challenges you in the lab (a practice
battle with no blackout), again on Route 2 and Route 3, and their ace ends up in the Champion's team.

**Types and families.** 14 types: Tuxemon's Metal, Shadow and Cosmic are Wildmon's Steel, Dark and
Psychic (same matchups), plus a new Dragon type (weak to Frost and Dragon, resisted by Steel, shrugs
off Fire/Water/Wood/Lightning) with its own Dragon Claw and Dragon Breath. The starters each have 3
forms (Krokivip → Leviadile → Golnagi); every other family has 2 or 3 (fixed seed in
`tools/build_data.py`), with one-of-a-kind species paired up by type. The Monster Log (menu → LOG)
has each species' lore.

**Hollowmere, legendaries and the sleeping giant.** A side path west off Route 3 leads to Hollowmere,
an abandoned ghost town (fog, dead trees, ghost trainers, ghost-type monsters in the grass). A giant
COALDIAK sleeps across that path: Kat in Volt City gives you the WAKE BELL to rouse it (then battle
it). Three legendaries wait in the world, one each: PRIMORDIA at Hollowmere's Shrine of Origins,
PHARAVION on the Sea Shrine island off Tide Harbor, and KERNEL in a clearing on Route 4. Walk up and
press Z; catch or beat one and it's gone for good. You can talk to anyone you're near and roughly
facing, from any angle, and they turn to face you.

**Riding your monsters.** With the Tide Badge and a Water monster, face the water and press Z to
SURF: you stand on a surfboard with your monster riding up front (water has its own wild monsters, and a Sea Shrine island sits off Tide Harbor).
With the Volt Badge and a Sky monster, press F to FLY to any town you've visited. The mount is
your monster's real sprite turned into a 3D voxel model.

**Trainers are themed by area:** forest rangers on the routes, miners in the Ember Gym, sailors in
the Tide Gym, engineers in the Volt Gym, occultists in the Shade Gym, royal guards in the Champion's
Hall. Route trainers only ambush once your team is 3 levels above their strongest monster.

## World

Sprout Town → Route 1 → **Ember City** (Rock gym, Earth) → Route 2 → **Tide Harbor** (Tide gym, Water)
→ Route 3 → **Volt City** (Volt gym, Lightning) → Route 4 → **Shade Hollow** (Shade gym, Shadow)
→ Champion's Hall. Guards gate each leg by badge count. 208 monsters in 85 families, 135 moves, 14 types.

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
python tools/install_models.py  # downloads Kenney 3D packs and installs the models the game uses
node tools/validate_world.js    # checks maps: overlaps, reachable doors, paired exits, sightlines
```

## Credits

- **Monster, character, tile, building, battle-background art and the font** come from the
  [Tuxemon](https://github.com/Tuxemon/Tuxemon) project (art mostly CC BY-SA; code GPLv3; font
  Press Start 2P under the SIL OFL, see `game/assets/fonts/OFL.txt`). Monster stats, moves and type
  chart are adapted from Tuxemon's database.
- **Drum samples:** Roland TR-909 and TR-808 recordings from
  [fluid-music/open-drums](https://github.com/fluid-music/open-drums) (originally machines.hyperreal.org).
  The 909 set is free to copy and distribute unmodified and **not for profit**; see
  `game/assets/drums/909/TR909SET.TXT`. The 808 set has no restrictions; see `TR808.TXT`.
- **3D models** (trees, grass, flowers, rocks, fences, buildings, animated characters): Kenney's
  Nature Kit, Mini Characters, City Kit (Commercial / Suburban) and Fantasy Town Kit, all CC0
  ([kenney.nl](https://kenney.nl)). Installed by `tools/install_models.py`; licenses in `game/assets/models/*/License.txt`.
- **Realistic player and rival:** "Universal Base Characters" and "Universal Animation Library" by
  Quaternius ([quaternius.com](https://quaternius.com)), CC0. Files in `game/assets/models/qn/`
  (copied from the Build Your Empire conversion: `qn_male.glb`, `qn_female.glb`, `qn_anims.glb`, skin textures).
- **three.js** (MIT), vendored in `game/vendor/`.

Because of the CC BY-SA art and the not-for-profit 909 samples, keep this project free and credited.
