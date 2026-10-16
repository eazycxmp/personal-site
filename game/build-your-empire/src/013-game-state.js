// ------------------------------------------------------------------ game state
const W = {coins:0, earned:0, fed:0, army:0, conquests:0, unrest:0, levels:{}, upPaid:{}, upSpent:0, goals:[], caught:0, playT:0, rate:0, era:0, cap:8, unlocked:new Set(), paid:{}, tut:0, flags:{spread:2}};
const TROOPS = [
  {n:'Soldiers', o:{body:0x3a4a7a, trim:0x8a8f96, hat:'helmet', pants:0x2a2a3a, sword:true}},
  {n:'Roman legion', o:{body:0xb8322a, trim:0xd9a52a, hat:'roman', pants:0x6a4a2a, sword:true, shield:'scutum'}},
  {n:'Viking raiders', o:{body:0x6a5040, trim:0x8a6a4a, hat:'viking', pants:0x4a3a2a, axe:true, shield:'round', fur:true}},
  {n:'Knights', o:{body:0xb8bcc4, trim:0x2d4fa8, hat:'greathelm', pants:0x8a8f96, sword:true, shield:'heater', tabard:0x2d4fa8, metal:true}},
  {n:'Redcoats', o:{body:0xc8302a, trim:0xf4f4f4, hat:'tricorne', pants:0xf0ece0, gun:true, belts:true}},
  {n:'Special forces', o:{body:0x5a6448, trim:0x2a2e26, hat:'tactical', pants:0x4e5640, gun:true, scope:true, vest:true}},
];
const ARMS = () => TROOPS[W.troop || 0].o;
const ERAS = ['Riverside Camp', 'Hamlet', 'Village', 'Town', 'City', 'Stronghold', 'Kingdom', 'Empire', 'Metropolis', 'Megacity', 'Superpower', 'Space Empire', 'Interplanetary'];
const ERA_ICON = ['🏕️', '🛖', '🏘️', '🏙️', '🌆', '🛡️', '👑', '🌍', '🌃', '✨', '🚀', '🪐', '🔴'];
const ERA_TXT = ['', 'Word is spreading. More hungry travelers are coming.', 'Word is spreading. More hungry travelers are coming.',
  'Your camp is a town. New land waits beyond the palisade.', 'Stone streets and scholars. Your town is a city.',
  'Soldiers guard the roads and pay tribute.', 'You built a kingdom from one campfire. Now take your army to war.', 'Every land around the river is yours. Now raise a skyline downtown.',
  'Your first skyscraper towers over the river.', 'Six skyscrapers. Your campfire became a megacity.', 'Land, sea and sky are yours. Thanks for playing!',
  'Your empire reaches the Moon.',
  'Two planets, one empire.'];
// boosts bought with research
const BOOST = {fishRate:1, bigFish:.15, farm:1, metal:1, patience:1, tactics:1};
const WORKER = {speed:3.8, cap:6};
const player = entity({body:0xd23c2c, trim:0xf3eadb, hat:'fur', pants:0x4a3a2a, hero:true}, 0, 2, 5.6, 8);
player.isPlayer = true;

const waterPt = () => new THREE.Vector3(-13 + R()*1.5, -.1, 1 + (R() - .5)*2.5);
station('grill', {name:'campfire', in:'fish', out:'grilled', t:1.25, inZ:[-6.6, 1], outZ:[-1.8, 1], fireAt:[-4.2, 1.1, 1]});
buildFx.grill(false);
boxes.push({x0:-5.3, x1:-3.1, z0:-.1, z1:2.1});
buildFx.table();
boxes.push({x0:3.3, x1:4.7, z0:-1.6, z1:3.6});
const fishZone = addZone({kind:'source', item:'fish', rate:.42, wrate:.75, from:waterPt, x:-13.2, z:1, w:1.7, d:1.2, icon:'🎣', tile:{alpha:1, size:96, label:'Fishing spot'}});
fishZone.mesh.position.y = .3;   // on the dock's planks
let oreZone = null;

// Tables. Each dish has its own room on a table, so a pile of one dish can
// never block the dish the guest at the front is waiting for.
const TABLE_PER = 14;
const TB = {};
function makeTable(id, accepts, layout, zone) {
  const t = TB[id] = {id, accepts, stack:newStack(layout, TABLE_PER * accepts.length)};
  t.takes = () => t.accepts.filter(d => t.stack.count([d]) < TABLE_PER);
  t.room = d => TABLE_PER - t.stack.count([d]);
  t.zone = addZone({kind:'table', tb:t, w:1.6, d:3, icon:'🍽️', tile:{alpha:1, size:92, label:'Serve food'}, ...zone});
  return t;
}
const alongZ = (x, z0) => (i, it) => { const l = Math.floor(i/20), k = i % 20; return {x:x + (k % 2 ? .3 : -.3), y:.98 + l*ITEM[it.type].h + ITEM[it.type].h/2, z:z0 + Math.floor(k/2)*.5, ry:Math.PI/2}; };
const alongX = (x0, z) => (i, it) => { const l = Math.floor(i/20), k = i % 20; return {x:x0 + Math.floor(k/2)*.5, y:.98 + l*ITEM[it.type].h + ITEM[it.type].h/2, z:z + (k % 2 ? .3 : -.3), ry:0}; };
makeTable('main', DISHES, alongZ(4, -1.25), {x:2.1, z:1});
const table = TB.main.stack, tableZone = TB.main.zone;

// coin piles that guests (or ships, or soldiers) leave behind
const CASH = {};
function makeCash(id, x, z) {
  const c = CASH[id] = {id, x, z, value:0};
  c.stack = newStack(i => { const l = Math.floor(i/9), k = i % 9; return {x:x + (k % 3 - 1)*.42, y:.06 + l*.07, z:z + (Math.floor(k/3) - 1)*.25, ry:0}; });
  c.zone = addZone({kind:'cash', cash:c, x, z, icon:'💵', tile:{alpha:1, size:92, label:'Cash'}});
  return c;
}
function addCash(c, value, from) {
  c.value += value; W.earned += value;
  for (let i = 0; i < Math.min(value, 12) && c.stack.length < 45; i++) {
    const m = itemMesh('coin'); m.position.set(from.x + R()*.4 - .2, 1.2, from.z + R()*.4 - .2); c.stack.push({type:'coin', mesh:m});
  }
}
const cash = makeCash('main', 4, 4.75), cashZone = cash.zone;

// a bin to empty a pack that is full of the wrong things
const binZone = addZone({kind:'bin', x:-.4, z:-2.6, w:1.7, d:1.7, icon:'🗑️', tile:{alpha:1, size:84, label:'Bin'}});
{
  const g = new THREE.Group(); g.position.set(-1.75, 0, -2.6); scene.add(g);
  mesh(G.cyl, 0x7a5a3a, [.38, .75, .38], [0, .38, 0], g);
  for (const y of [.15, .6]) mesh(G.cyl, 0x4a4a4a, [.4, .05, .4], [0, y, 0], g, {metalness:.4});
  circles.push({x:-1.75, z:-2.6, r:.4});
}

