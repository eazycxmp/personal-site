// ------------------------------------------------------------------ unlock pads
const PADS = [
  {id:'tut0', hidden:true},
  {id:'fisher', x:-9.4, z:4.4, cost:15, cur:'coin', icon:'🎣', label:'Fisher', after:['tut0']},
  {id:'hut1', x:8.6, z:6.2, cost:8, cur:'log', icon:'🛖', label:'Hut', after:['tut0']},
  {id:'bag1', x:.2, z:4.6, cost:30, cur:'coin', icon:'🎒', label:'Bigger pack', after:['fisher']},
  {id:'waiter', x:2.1, z:-2.6, cost:45, cur:'coin', icon:'🧑‍🍳', label:'Waiter', after:['bag1']},
  {id:'palisade', x:9.04, z:-1.96, cost:20, cur:'log', icon:'🪵', label:'Palisade', after:['hut1', 'fisher']},
  {id:'bigGrill', x:-4.2, z:3.7, cost:70, cur:'coin', icon:'🔥', label:'Big grill', after:['waiter']},
  {id:'waiter2', x:6.4, z:-2.2, cost:110, cur:'coin', icon:'🧑‍🍳', label:'2nd waiter', after:['bigGrill']},
  {id:'builder', x:9.04, z:-1.96, cost:250, cur:'coin', icon:'👷', label:'Builder', after:['palisade', 'village']},
  {id:'lodge', x:-4.2, z:-10.6, cost:60, cur:'coin', icon:'🏹', label:"Hunter's lodge", after:['palisade']},
  {id:'spit', x:-4.2, z:-5, cost:50, cur:'coin', icon:'🍖', label:'Meat grill', after:['palisade']},
  {id:'hut2', x:11.4, z:6.2, cost:16, cur:'log', icon:'🛖', label:'Hut', after:['palisade']},
  {id:'lumber', x:3.4, z:-6.2, cost:50, cur:'coin', icon:'🪓', label:'Lumberjack', after:['palisade']},
  {id:'butcher', x:-1.5, z:-8.3, cost:80, cur:'coin', icon:'🔪', label:'Butcher', after:['lodge', 'spit']},
  {id:'village', x:9, z:-7, cost:40, cur:'log', icon:'⛲', label:'Village square', after:['butcher', 'lumber']},
  {id:'field', x:-4.2, z:12.1, cost:90, cur:'coin', icon:'🌾', label:'Wheat field', after:['village']},
  {id:'oven', x:-4.2, z:7, cost:100, cur:'coin', icon:'🥖', label:'Bread oven', after:['village']},
  {id:'bag2', x:.2, z:4.6, cost:120, cur:'coin', icon:'🎒', label:'Huge pack', after:['village', 'bag1']},
  {id:'waiter3', x:6.2, z:4.6, cost:200, cur:'coin', icon:'🧑‍🍳', label:'3rd waiter', after:['village', 'waiter2']},
  {id:'hut3', x:12, z:9, cost:30, cur:'log', icon:'🛖', label:'Hut', after:['village']},
  {id:'baker', x:-.6, z:9.7, cost:120, cur:'coin', icon:'👩‍🍳', label:'Baker', after:['field', 'oven']},
  {id:'townhall', x:9, z:11, cost:300, cur:'coin', icon:'🏛️', label:'Town hall', after:['baker', 'hut3']},
  {id:'senate', x:9, z:13.3, cost:20000, cur:'coin', icon:'🏛️', label:'Senate', after:['townhall', 'warTable'], need:() => W.conquests >= 1},
  {id:'treasurer', x:.4, z:7.4, cost:300, cur:'coin', icon:'🧾', label:'Treasurer', after:['townhall']},
  {id:'treasurer2', x:2.8, z:7.4, cost:4000, cur:'coin', icon:'🧾', label:'2nd treasurer', after:['treasurer', 'hall']},
  // the quarry, north
  {id:'northGate', x:-7.7, z:-11.8, cost:35, cur:'log', icon:'⛰️', label:'North gate', after:['village']},
  {id:'mine', x:0, z:-45.2, cost:20, cur:'log', icon:'⛏️', label:'Iron mine', after:['northGate'], region:'north'},
  {id:'mason', x:-6, z:-35.5, cost:120, cur:'coin', icon:'🧱', label:'Stonemason', after:['northGate'], region:'north'},
  {id:'smelter', x:6.5, z:-40, cost:25, cur:'stone', icon:'🔥', label:'Smelter', after:['mine'], region:'north'},
  {id:'miner', x:-2.5, z:-41, cost:500, cur:'coin', icon:'👷', label:'Miner', after:['smelter'], region:'north'},
  // the market quarter, east
  {id:'eastGate', x:12.3, z:-2.6, cost:400, cur:'coin', icon:'🏪', label:'East gate', after:['village']},
  {id:'hall', x:42, z:7, cost:30, cur:'log', icon:'🍻', label:'Great hall', after:['eastGate'], region:'east'},
  {id:'market', x:40, z:-6, cost:15, cur:'stone', icon:'💰', label:'Market', after:['eastGate', 'northGate'], region:'east'},
  {id:'porter', x:37.2, z:9.6, cost:500, cur:'coin', icon:'🧑‍🍳', label:'Hall waiter', after:['hall'], region:'east'},
  {id:'porter2', x:37.2, z:12.2, cost:900, cur:'coin', icon:'🧑‍🍳', label:'2nd hall waiter', after:['porter'], region:'east'},
  {id:'house1', x:45, z:-3, cost:20, cur:'stone', icon:'🏠', label:'Stone house', after:['hall', 'northGate'], region:'east'},
  {id:'house2', x:48.5, z:-3, cost:25, cur:'stone', icon:'🏠', label:'Stone house', after:['house1'], region:'east'},
  {id:'house3', x:48, z:10, cost:30, cur:'stone', icon:'🏠', label:'Stone house', after:['house2'], region:'east'},
  {id:'builder2', x:12.3, z:-5.6, cost:900, cur:'coin', icon:'👷', label:'2nd builder', after:['builder', 'house1']},
  {id:'builder3', x:12.3, z:-5.6, cost:3000, cur:'coin', icon:'👷', label:'3rd builder', after:['builder2', 'market']},
  {id:'builder4', x:12.3, z:-5.6, cost:9000, cur:'coin', icon:'👷', label:'4th builder', after:['builder3', 'townhall']},
  {id:'builder5', x:12.3, z:-5.6, cost:25000, cur:'coin', icon:'👷', label:'5th builder', after:['builder4', 'workshop']},
  {id:'bag3', x:.2, z:4.6, cost:900, cur:'coin', icon:'🎒', label:'Giant pack', after:['bag2', 'house1']},
  {id:'mason2', x:-2.6, z:-35.4, cost:600, cur:'coin', icon:'🧱', label:'2nd stonemason', after:['mason', 'house1'], region:'north'},
  {id:'library', x:45.5, z:-9.6, cost:30, cur:'stone', icon:'📚', label:'Library', after:['house1'], region:'east'},
  {id:'sciNets', x:37.2, z:-11.6, cost:4, cur:'scroll', icon:'🕸️', label:'Fishing nets', after:['library'], region:'east', sci:1},
  {id:'sciFarming', x:39.6, z:-11.6, cost:6, cur:'scroll', icon:'🌱', label:'Crop rotation', after:['library'], region:'east', sci:1},
  {id:'sciMetal', x:42, z:-11.6, cost:8, cur:'scroll', icon:'⚗️', label:'Metallurgy', after:['library', 'smelter'], region:'east', sci:1},
  {id:'sciWheel', x:37.2, z:-9.1, cost:10, cur:'scroll', icon:'☸️', label:'The wheel', after:['library'], region:'east', sci:1},
  {id:'sciNav', x:49.3, z:-11.6, cost:10, cur:'scroll', icon:'🧭', label:'Navigation', after:['library'], region:'east', sci:1},
  {id:'sciMedicine', x:37.2, z:-6.6, cost:8, cur:'scroll', icon:'🩺', label:'Medicine', after:['library'], region:'east', sci:1},
  {id:'sciTactics', x:49.3, z:-8.6, cost:12, cur:'scroll', icon:'♟️', label:'Tactics', after:['library', 'barracks'], region:'east', sci:1},
  {id:'scholar', x:42.4, z:-4, cost:500, cur:'coin', icon:'🧑‍🏫', label:'Scholar', after:['library'], region:'east'},
  {id:'stoneRoads', x:5.6, z:9.4, cost:40, cur:'stone', icon:'🧱', label:'Cobblestone streets', after:['house2']},
  {id:'roads2', x:5.6, z:9.4, cost:12, cur:'tools', icon:'🪨', label:'Gravel paths', after:['stoneRoads', 'workshop']},
  {id:'roads3', x:5.6, z:9.4, cost:50000, cur:'coin', icon:'✨', label:'Grand promenade', after:['roads2', 'downtownGate']},
  // the farmlands, southeast
  {id:'farmGate', x:40.4, z:12.3, cost:1500, cur:'coin', icon:'🌾', label:'Farmlands', after:['hall', 'townhall'], region:'east'},
  {id:'field2', x:38.5, z:67.5, cost:400, cur:'coin', icon:'🌾', label:'Wheat field', after:['farmGate'], region:'farm'},
  {id:'oven2', x:45.5, z:68, cost:600, cur:'coin', icon:'🥖', label:'Big bakery', after:['farmGate'], region:'farm'},
  {id:'baker2', x:42, z:70.4, cost:600, cur:'coin', icon:'👩‍🍳', label:'Baker', after:['field2', 'oven2'], region:'farm'},
  {id:'field3', x:38.5, z:74.5, cost:700, cur:'coin', icon:'🌾', label:'Wheat field', after:['field2'], region:'farm'},
  {id:'baker3', x:43, z:72.6, cost:900, cur:'coin', icon:'👩‍🍳', label:'Baker', after:['field3', 'baker2'], region:'farm'},
  // iron becomes tools, tools become machines
  {id:'workshop', x:9.6, z:-34.6, cost:30, cur:'stone', icon:'🔨', label:'Workshop', after:['smelter'], region:'north'},
  {id:'tinker', x:12, z:-38, cost:600, cur:'coin', icon:'🧰', label:'Tinker', after:['workshop'], region:'north'},
  {id:'digger', x:10, z:-44.5, cost:5, cur:'tools', icon:'🚜', label:'Stone digger', after:['workshop'], region:'north'},
  {id:'plow', x:-8.4, z:11.6, cost:4, cur:'tools', icon:'⚙️', label:'Iron plows', after:['workshop', 'field']},
  {id:'bulldozers', x:12.3, z:-9.2, cost:8, cur:'tools', icon:'🚜', label:'Bulldozers', after:['builder2', 'mason2', 'workshop']},
  {id:'carts', x:-7.4, z:-1.8, cost:6, cur:'tools', icon:'🛒', label:'Hand carts', after:['workshop']},
  {id:'fleet1', x:35.6, z:5, cost:30000, cur:'coin', icon:'🚐', label:'Delivery vans', after:['downtownGate'], region:'east'},
  {id:'fleet2', x:35.6, z:5, cost:80000, cur:'coin', icon:'🚚', label:'Box trucks', after:['fleet1'], region:'east'},
  {id:'fleet3', x:35.6, z:5, cost:200000, cur:'coin', icon:'🚛', label:'Semi-trucks', after:['fleet2', 'highway'], region:'east'},
  {id:'fleet4', x:35.6, z:5, cost:500000, cur:'coin', icon:'🔋', label:'Electric fleet', after:['fleet3', 'aiLab'], region:'east'},
  // the river
  {id:'boatyard', x:-9.4, z:-7.2, cost:40, cur:'log', icon:'⛵', label:'Boatyard', after:['sciNav']},
  {id:'boat2', x:-9.4, z:7.6, cost:1500, cur:'coin', icon:'⛵', label:'2nd fishing boat', after:['boatyard']},
  {id:'speedboat', x:-9.4, z:7.6, cost:50000, cur:'coin', icon:'🛥️', label:'Speed boat', after:['boat2', 'mount4']},
  {id:'tradeShip', x:-9.3, z:-9.75, cost:2500, cur:'coin', icon:'🚢', label:'Merchant ship', after:['boatyard']},
  {id:'brewery', x:43.5, z:63.5, cost:1200, cur:'coin', icon:'🍺', label:'Brewery', after:['field2'], region:'farm'},
  {id:'brewer', x:36.2, z:63.2, cost:800, cur:'coin', icon:'🧑‍🌾', label:'Brewer', after:['brewery'], region:'farm'},
  {id:'beerGarden', x:46, z:75.5, cost:40, cur:'stone', icon:'🍻', label:'Beer garden', after:['brewery'], region:'farm'},
  {id:'barkeep', x:49.4, z:73.4, cost:900, cur:'coin', icon:'🧑‍🍳', label:'Barkeep', after:['beerGarden'], region:'farm'},
  {id:'studyHall', x:39.9, z:-2.6, cost:1500, cur:'coin', icon:'📚', label:'Study hall', after:['library', 'sciWheel'], region:'east'},
  {id:'university', x:49.6, z:-5.6, w:1.9, cost:15, cur:'scroll', icon:'🎓', label:'University', after:['library', 'house2'], region:'east'},
  {id:'labs', x:49.6, z:-5.6, w:1.9, cost:20, cur:'tools', icon:'🔬', label:'Research lab', after:['university', 'workshop'], region:'east'},
  {id:'aiLab', x:49.6, z:-5.6, w:1.9, cost:40, cur:'scroll', icon:'🤖', label:'AI lab', after:['labs', 'exchange'], region:'east'},
  {id:'superAI', x:49.6, z:-5.6, w:1.9, cost:250000, cur:'coin', icon:'🧠', label:'Superintelligence', after:['aiLab'], region:'east'},
  {id:'sciFlight', x:42.4, z:-9.2, cost:25, cur:'scroll', icon:'✈️', label:'Aviation', after:['labs'], region:'east', sci:1},
  {id:'airfieldGate', x:-9.4, z:9.6, w:1.8, cost:60, cur:'stone', icon:'🌉', label:'Bridge & airfield', after:['sciFlight']},
  {id:'hangar', x:72.5, z:107.5, cost:15000, cur:'coin', icon:'🛩️', label:'Fighter hangar', after:['airfieldGate', 'southGate'], region:'south'},
  // bought with cash like every fighter, so builders never pay for one on their own
  {id:'plane1', x:80.5, z:88.6, cost:25000, cur:'coin', icon:'✈️', label:'Fighter plane', after:['hangar', 'southGate']},
  {id:'plane2', x:80.5, z:93.4, cost:40000, cur:'coin', icon:'✈️', label:'2nd fighter plane', after:['plane1']},
  {id:'plane3', x:80.5, z:98.2, cost:60000, cur:'coin', icon:'✈️', label:'3rd fighter plane', after:['plane2']},
  {id:'plane4', x:86.4, z:91, cost:90000, cur:'coin', icon:'✈️', label:'4th fighter plane', after:['plane3']},
  {id:'plane5', x:86.4, z:95.8, cost:120000, cur:'coin', icon:'✈️', label:'5th fighter plane', after:['plane4']},
  {id:'downtownGate', x:34.8, z:-11.6, cost:3000, cur:'coin', icon:'🏙️', label:'Downtown', after:['house3', 'workshop'], region:'east'},
  {id:'warship', x:-9.4, z:-4.6, cost:12000, cur:'coin', icon:'⚓', label:'Warship', after:['boatyard', 'workshop']},
  // the military grounds, south
  {id:'southGate', x:3, z:12.6, cost:1000, cur:'coin', icon:'🛡️', label:'South gate', after:['townhall']},
  {id:'smith', x:-5, z:66.5, cost:800, cur:'coin', icon:'⚒️', label:'Blacksmith', after:['southGate', 'smelter'], region:'south'},
  {id:'mess', x:2, z:70, cost:1500, cur:'coin', icon:'🥣', label:'Mess hall', after:['smith'], region:'south'},
  {id:'hauler', x:-7.8, z:71.48, cost:900, cur:'coin', icon:'🛒', label:'Iron hauler', after:['smith', 'miner'], region:'south'},
  {id:'armorer', x:-2.4, z:70.5, cost:900, cur:'coin', icon:'🗡️', label:'Armorer', after:['mess'], region:'south'},
  {id:'barracks', x:9.5, z:75.5, cost:2500, cur:'coin', icon:'⛺', label:'Barracks', after:['mess'], region:'south'},
  {id:'quartermaster', x:6.4, z:70.6, cost:1500, cur:'coin', icon:'🍲', label:'Quartermaster', after:['barracks'], region:'south'},
  {id:'warTable', x:12.3, z:70.6, cost:1200, cur:'coin', icon:'⚔️', label:'War table', after:['barracks'], region:'south'},
  {id:'castle', x:-5.5, z:75.6, cost:6000, cur:'coin', icon:'🪵', label:'Wooden fort', after:['barracks', 'armorer'], army:10, region:'south'},
  {id:'siegeWorks', x:-5.6, z:63.2, cost:6000, cur:'coin', icon:'🛞', label:'Siege workshop', after:['barracks', 'workshop'], region:'south'},
  {id:'troop1', x:-8.6, z:69, cost:5000, cur:'coin', icon:'🏛️', label:'Roman legion', after:['barracks'], region:'south'},
  {id:'troop2', x:-8.6, z:69, cost:8000, cur:'coin', icon:'🪓', label:'Viking raiders', after:['troop1', 'castle'], region:'south'},
  {id:'troop3', x:-8.6, z:69, cost:12000, cur:'coin', icon:'🛡️', label:'Knights', after:['troop2', 'castle2'], region:'south'},
  {id:'guns', x:-1.2, z:64.3, cost:15000, cur:'coin', icon:'🔫', label:'Redcoat muskets', after:['troop3', 'workshop'], region:'south'},
  {id:'troop5', x:-8.6, z:69, cost:150000, cur:'coin', icon:'🎖️', label:'Special forces', after:['guns', 'labs'], region:'south'},
  {id:'castle2', x:-5.5, z:71.7, cost:10000, cur:'coin', icon:'🏯', label:'Stone castle', after:['castle', 'mason2'], region:'south'},
  {id:'castle3', x:-5.5, z:71.7, cost:18000, cur:'coin', icon:'🏰', label:'Moat & drawbridge', after:['castle2', 'workshop'], region:'south'},
  {id:'castle4', x:-5.5, z:71.7, cost:60000, cur:'coin', icon:'🪖', label:'Bunker complex', after:['castle3', 'labs'], region:'south'},
  // water and sewers through the ages, at the well
  {id:'water1', x:9, z:-4.4, cost:30, cur:'log', icon:'🪣', label:'Viking well house', after:['village']},
  {id:'water2', x:9, z:-4.4, cost:80, cur:'stone', icon:'⛲', label:'Roman aqueduct', after:['water1', 'townhall']},
  {id:'water3', x:9, z:-4.4, cost:120, cur:'stone', icon:'⚙️', label:'Medieval water wheel', after:['water2', 'castle']},
  {id:'water4', x:9, z:-4.4, cost:15, cur:'tools', icon:'🏭', label:'Victorian waterworks', after:['water3', 'workshop']},
  {id:'water5', x:9, z:-4.4, cost:60000, cur:'coin', icon:'💧', label:'Modern water plant', after:['water4', 'labs']},
  // bridges over the river
  {id:'bridge1', x:-8.4, z:4.6, cost:40, cur:'log', icon:'🌉', label:'Wooden bridge', after:['village']},
  {id:'bridge2', x:-8.4, z:4.6, cost:100, cur:'stone', icon:'🏛️', label:'Stone bridge', after:['bridge1', 'townhall']},
  {id:'bridge3', x:-8.4, z:4.6, cost:15, cur:'tools', icon:'🌉', label:'Iron bridge', after:['bridge2', 'workshop']},
  {id:'bridge4', x:-8.4, z:4.6, cost:80000, cur:'coin', icon:'🌁', label:'Suspension bridge', after:['bridge3', 'labs']},
  // railways
  {id:'airport', x:-36.5, z:-9.6, cost:40, cur:'tools', icon:'🛫', label:'Passenger airport', after:['hangar', 'downtownGate'], region:'airfield'},
  {id:'jumbo', x:-35.9, z:.9, cost:150000, cur:'coin', icon:'🛬', label:'Jumbo jets', after:['airport', 'labs'], region:'airfield'},
  {id:'concert', x:45, z:78.1, cost:25000, cur:'coin', icon:'🎸', label:'Concert hall', after:['beerGarden', 'downtownGate'], region:'farm'},
  {id:'cargoPort', x:-9.2, z:-11.8, cost:40, cur:'tools', icon:'🏗️', label:'Cargo port', after:['tradeShip', 'workshop']},
  {id:'cruisePort', x:-9.2, z:-11.8, cost:60000, cur:'coin', icon:'🛳️', label:'Cruise ships', after:['cargoPort', 'hall']},
  {id:'police', x:49.2, z:6, cost:15000, cur:'coin', icon:'🚓', label:'Police station', after:['eastGate', 'townhall'], region:'east'},
  {id:'fireStation', x:49.2, z:6, cost:20000, cur:'coin', icon:'🚒', label:'Fire station', after:['police'], region:'east'},
  {id:'hospital', x:49.2, z:6, cost:30000, cur:'coin', icon:'🏥', label:'Hospital', after:['fireStation', 'library'], region:'east'},
  {id:'traffic', x:34.6, z:-45.8, cost:20000, cur:'coin', icon:'🛣️', label:'Roads & traffic', after:['lot0s2'], region:'downtown'},
  {id:'exchange', x:39, z:-11, cost:40000, cur:'coin', icon:'🏛️', label:'Stock exchange', after:['downtownGate'], region:'east'},
  {id:'highway', x:34.6, z:-45.8, cost:80000, cur:'coin', icon:'🚗', label:'Highway', after:['traffic'], region:'downtown'},
  {id:'dome', x:48.73, z:71.12, cost:150000, cur:'coin', icon:'🌐', label:'Domed stadium', after:['stadium', 'aiLab'], region:'farm'},
  {id:'tanks', x:2.75, z:65.95, cost:25000, cur:'coin', icon:'🪖', label:'Tank division', after:['guns', 'castle3'], region:'south'},
  {id:'stadium', x:48.73, z:71.12, cost:50000, cur:'coin', icon:'🏉', label:'Rugby stadium', after:['concert'], region:'farm'},
  {id:'terminal2', x:-35.9, z:.9, cost:60, cur:'tools', icon:'🏢', label:'Terminal 2', after:['airport'], region:'airfield'},
  {id:'jet2', x:-35.9, z:.9, cost:90000, cur:'coin', icon:'🛫', label:'2nd airliner', after:['terminal2'], region:'airfield'},
  {id:'cargoJet', x:-35.9, z:.9, cost:150000, cur:'coin', icon:'📦', label:'Cargo freighter', after:['jet2', 'cargoPort'], region:'airfield'},
  {id:'stallMain1', x:6.4, z:-2.2, cost:1500, cur:'coin', icon:'⛺', label:'Pop-up tent', after:['waiter2', 'house1']},
  {id:'stallMain2', x:6.4, z:-2.2, cost:80, cur:'stone', icon:'🏪', label:'Corner store', after:['stallMain1', 'townhall']},
  {id:'stallHall1', x:42, z:10.9, cost:3000, cur:'coin', icon:'⛺', label:'Market tent', after:['hall', 'farmGate'], region:'east'},
  {id:'stallHall2', x:42, z:10.9, cost:150, cur:'stone', icon:'🏪', label:'Market store', after:['stallHall1', 'castle'], region:'east'},
  {id:'oilField', x:-2.4, z:-39.6, cost:40, cur:'tools', icon:'🛢️', label:'Oil field', after:['highway', 'mineRail'], need:() => oilReady(), region:'north'},
  {id:'refinery', x:-0.4, z:-37.2, cost:100000, cur:'coin', icon:'🏭', label:'Oil refinery', after:['oilField'], region:'north'},
  {id:'gasStation', x:-28.4, z:28.6, cost:60000, cur:'coin', icon:'⛽', label:'Gas station', after:['highway', 'airfieldGate', 'refinery']},
  {id:'hw_nile', x:88, z:1.9, cost:450000, cur:'coin', icon:'🛣️', label:'Highway to the Nile Kingdom', after:['highway'], optional:true, need:() => hwyHeld('nile')},
  {id:'hw_hellas', x:92, z:1.9, cost:700000, cur:'coin', icon:'🛣️', label:'Highway to Hellas', after:['highway'], optional:true, need:() => hwyHeld('hellas')},
  {id:'hw_kumo', x:-56, z:12.1, cost:400000, cur:'coin', icon:'🛣️', label:'Highway to Kumo', after:['highway'], optional:true, need:() => hwyHeld('kumo')},
  {id:'hw_aztlan', x:-60, z:12.1, cost:600000, cur:'coin', icon:'🛣️', label:'Highway to Aztlan', after:['highway'], optional:true, need:() => hwyHeld('aztlan')},
  {id:'garden', x:20.5, z:5.6, cost:400, cur:'coin', icon:'🥬', label:'Lettuce garden', after:['spit', 'oven', 'workshop']},
  // military technology is bought with cash, like the planes and tanks: builders never pay for it (029 MIL_PADS)
  {id:'supplyDepot', x:22.4, z:-9.2, cost:4000, cur:'coin', icon:'📦', label:'Supply depot', after:['warTable'], need:() => landKeys().length > 0},
  {id:'supplyClerk', x:18.6, z:-6.4, cost:1500, cur:'coin', icon:'🧑‍💼', label:'Supply clerk', after:['supplyDepot']},
  {id:'gardener', x:23.8, z:5.6, cost:300, cur:'coin', icon:'🧑‍🌾', label:'Gardener', after:['garden']},
  {id:'tomatobed', x:27.1, z:5.6, cost:500, cur:'coin', icon:'🍅', label:'Tomato bed', after:['garden', 'market']},
  {id:'burgerBar', x:20.75, z:14.3, cost:900, cur:'coin', icon:'🍔', label:'Burger station', after:['tomatobed', 'gardener', 'market', 'workshop']},
  {id:'burgercook', x:25.6, z:17.6, cost:400, cur:'coin', icon:'🧑‍🍳', label:'Burger cook', after:['burgerBar']},
  {id:'bunbaker', x:17.2, z:5.6, cost:250, cur:'coin', icon:'🥖', label:'Bun baker', after:['burgerBar']},
  {id:'scooters', x:35.6, z:8.4, cost:25000, cur:'coin', icon:'🛵', label:'Delivery scooters', after:['fleet1'], region:'east'},
  {id:'foodVans', x:35.6, z:8.4, cost:120000, cur:'coin', icon:'🚐', label:'Food delivery vans', after:['scooters', 'fleet2'], region:'east'},
  {id:'vegas', x:-26.9, z:52.4, cost:250000, cur:'coin', icon:'🎰', label:'The Lucky Strip', after:['gasStation', 'wCathedral']},
  {id:'slots', x:-123, z:113.7, cost:150000, cur:'coin', icon:'🎰', label:'Slot parlor', after:['vegas']},
  {id:'chapel', x:-123, z:126.3, cost:120000, cur:'coin', icon:'💒', label:'Wedding chapel', after:['vegas']},
  {id:'casino1', x:-95, z:113.7, cost:400000, cur:'coin', icon:'🦁', label:'Golden Lion casino', after:['slots']},
  {id:'fountains', x:-95, z:126.3, cost:300000, cur:'coin', icon:'⛲', label:'Dancing fountains', after:['casino1']},
  {id:'casino2', x:-67, z:113.7, cost:900000, cur:'coin', icon:'🔺', label:'Pyramid casino', after:['casino1']},
  {id:'stripHotel', x:-67, z:126.3, cost:1200000, cur:'coin', icon:'🏨', label:'Strip resort hotel', after:['casino2']},
  {id:'casino3', x:-37, z:113.7, cost:1800000, cur:'coin', icon:'🗼', label:'Sky Tower casino', after:['casino2']},
  {id:'casino4', x:-37, z:126.3, cost:3500000, cur:'coin', icon:'🛶', label:'Canal Palace casino', after:['casino3']},
  {id:'mount1', x:12.16, z:-0.32, cost:2000, cur:'coin', icon:'🐴', label:'Horse', after:['village']},
  {id:'mount2', x:12.16, z:-0.32, cost:6000, cur:'coin', icon:'🚲', label:'Bicycle', after:['mount1', 'townhall']},
  {id:'mount3', x:12.16, z:-0.32, cost:15000, cur:'coin', icon:'🛵', label:'Scooter', after:['mount2', 'workshop']},
  {id:'mount4', x:12.16, z:-0.32, cost:40000, cur:'coin', icon:'🚗', label:'Your own car', after:['mount3', 'downtownGate']},
  {id:'mount5', x:12.16, z:-0.32, cost:150000, cur:'coin', icon:'🎒', label:'Jetpack', after:['mount4', 'labs']},
  {id:'tradeBridge', x:-7.4, z:20, cost:12000, cur:'coin', icon:'🌉', label:'Commercial bridge', after:['airfieldGate', 'bridge2']},
  {id:'mount7', x:12.16, z:-0.32, cost:300000, cur:'coin', icon:'🛩️', label:'Your own plane', after:['mount4', 'airport']},
  {id:'mount8', x:12.16, z:-0.32, cost:500000, cur:'coin', icon:'🐉', label:'Tame a dragon to ride', after:['mount7'], need:() => (W.flags.boss || 0) >= 1},
  {id:'mount6', x:12.16, z:-0.32, cost:70000, cur:'coin', icon:'🏍️', label:'Motorcycle', after:['mount4']},
  {id:'wStone', x:-34.5, z:66.4, cost:60, cur:'stone', icon:'🪨', label:'Stonehenge', after:['bridge1', 'airfieldGate']},
  {id:'wPyramid', x:-27.6, z:66.4, cost:150, cur:'stone', icon:'🔺', label:'Great Pyramid', after:['bridge1', 'airfieldGate', 'townhall']},
  {id:'wColosseum', x:-34.5, z:71.8, cost:200, cur:'stone', icon:'🏟️', label:'Colosseum', after:['bridge1', 'airfieldGate', 'castle']},
  {id:'wCathedral', x:-27.6, z:71.8, cost:30, cur:'tools', icon:'⛪', label:'Cathedral', after:['bridge1', 'airfieldGate', 'castle2', 'workshop']},
  {id:'wTower', x:-34.5, z:77, cost:60, cur:'tools', icon:'🗼', label:'Iron Tower', after:['bridge1', 'airfieldGate', 'steamTrain']},
  {id:'wNeedle', x:-27.6, z:77, cost:250000, cur:'coin', icon:'🛸', label:'Space Needle', after:['bridge1', 'airfieldGate', 'labs']},
  {id:'ranchGate', x:-8.9, z:-36, cost:60, cur:'stone', icon:'🐄', label:'Ranch bridge', after:['northGate', 'townhall'], region:'north'},
  {id:'dairy', x:-35, z:-44.5, cost:2500, cur:'coin', icon:'🐄', label:'Dairy cows', after:['ranchGate'], region:'ranch'},
  {id:'creamery', x:-26.2, z:-44.5, cost:50, cur:'log', icon:'🍦', label:'Ice cream parlor', after:['dairy'], region:'ranch'},
  {id:'milkman', x:-35.5, z:-41.1, cost:1500, cur:'coin', icon:'🧑‍🌾', label:'Milkman', after:['creamery'], region:'ranch'},
  {id:'tomatoes', x:-35, z:-38.5, cost:2500, cur:'coin', icon:'🍅', label:'Tomato field', after:['ranchGate'], region:'ranch'},
  {id:'pizzeria', x:-26.2, z:-38.5, cost:60, cur:'stone', icon:'🍕', label:'Pizzeria', after:['tomatoes'], region:'ranch'},
  {id:'picker', x:-31, z:-41.1, cost:1500, cur:'coin', icon:'🧑‍🌾', label:'Tomato picker', after:['pizzeria'], region:'ranch'},
  {id:'fishPier', x:-23.6, z:-34.2, cost:1200, cur:'coin', icon:'🎣', label:'Fishing pier', after:['ranchGate'], region:'ranch'},
  {id:'sushi', x:-26.2, z:-34.2, cost:25, cur:'tools', icon:'🍣', label:'Sushi bar', after:['fishPier', 'workshop'], region:'ranch'},
  {id:'sushichef', x:-26.5, z:-41.1, cost:2000, cur:'coin', icon:'👨‍🍳', label:'Sushi chef', after:['sushi'], region:'ranch'},
  {id:'aquarium', x:80, z:9, cost:40000, cur:'coin', icon:'🐠', label:'Aquarium', after:['steamTrain']},
  {id:'zoo', x:80, z:14.5, cost:60000, cur:'coin', icon:'🦁', label:'Zoo', after:['aquarium', 'castle']},
  {id:'launchPad', x:-36, z:3.6, cost:50, cur:'tools', icon:'🛸', label:'Launch pad', after:['plane2'], need:() => W.conquests >= CAMPAIGNS.length, region:'airfield'},
  {id:'satellite', x:-36, z:3.6, cost:200000, cur:'coin', icon:'🛰️', label:'Satellite launch', after:['launchPad'], region:'airfield'},
  {id:'moonLanding', x:-36, z:3.6, cost:500000, cur:'coin', icon:'🚀', label:'Moon landing', after:['satellite'], region:'airfield'},
  {id:'moonBase', x:-36, z:3.6, cost:1000000, cur:'coin', icon:'🧑‍🚀', label:'Moon base', after:['moonLanding'], region:'airfield'},
  {id:'mars', x:-36, z:3.6, cost:3000000, cur:'coin', icon:'🪐', label:'Mars colony', after:['moonBase'], region:'airfield'},
  {id:'moonHotel', x:-36, z:3.6, cost:1500000, cur:'coin', icon:'🏨', label:'Moon hotel', after:['moonBase'], region:'airfield'},
  {id:'asteroid', x:-36, z:3.6, cost:2000000, cur:'coin', icon:'☄️', label:'Asteroid mining', after:['mars', 'moonHotel'], region:'airfield'},
  {id:'spaceElevator', x:-36, z:3.6, cost:4000000, cur:'coin', icon:'🛗', label:'Space elevator', after:['asteroid'], region:'airfield'},
  {id:'mineRail', x:-2.4, z:-39.6, cost:8, cur:'tools', icon:'🚃', label:'Mine railway', after:['miner', 'workshop'], region:'north'},
  {id:'railway', x:51.65, z:65.2, cost:90, cur:'stone', icon:'🐎', label:'Stagecoach line', after:['farmGate', 'workshop'], region:'farm'},
  {id:'steamTrain', x:51.65, z:65.2, cost:15, cur:'tools', icon:'🚂', label:'Steam train', after:['railway'], region:'farm'},
  {id:'bulletTrain', x:51.65, z:65.2, cost:120000, cur:'coin', icon:'🚄', label:'Bullet train', after:['steamTrain', 'labs'], region:'farm'},
];
LOTS.forEach(([x, z], i) => {
  const m = 1 + .3*i, tz = z + (z > -38 ? 2.6 : 2.8);
  const costs = [[Math.round(25*m), 'stone'], [Math.round(50*m), 'stone'], [Math.round(10*m), 'tools'], [Math.round(25000*m), 'coin']];
  for (let n = 1; n <= 4; n++) {
    PADS.push({id:`lot${i}s${n}`, x, z:tz, cost:costs[n-1][0], cur:costs[n-1][1], icon:(isHotel(i) ? HOTEL_STAGES : LOT_STAGES)[n].icon, label:(isHotel(i) ? HOTEL_STAGES : LOT_STAGES)[n].n,
      after:n === 1 ? ['downtownGate'] : n === 3 ? [`lot${i}s2`, 'workshop'] : [`lot${i}s${n-1}`], region:'downtown'});
  }
});
Object.entries(HUTS).forEach(([k, H], i) => {
  PADS.push({id:`${k}s2`, x:H.tile[0], z:H.tile[1], cost:20 + 5*i, cur:'stone', icon:'🏡', label:'Inn', after:[k, 'northGate']});
  PADS.push({id:`${k}s3`, x:H.tile[0], z:H.tile[1], cost:4000 + 1500*i, cur:'coin', icon:'🏨', label:'Hotel', after:[`${k}s2`, 'townhall']});
});
const UNLOCK = {
  tut0() {},
  ...Object.fromEntries(LOTS.flatMap((_, i) => [1, 2, 3, 4].map(n => [`lot${i}s${n}`, a => buildLot(i, n, a)]))),
  fisher(a) { addWorker('fisher', -9.4, 4.4, a); },
  hut1(a) { circles.push({x:8.6, z:6.2, r:1.15}); buildHut('hut1', 1, a); addHome(8.6, 6.2, 'hut'); },
  hut2(a) { circles.push({x:11.4, z:6.2, r:1.15}); buildHut('hut2', 1, a); addHome(11.4, 6.2, 'hut'); },
  hut3(a) { circles.push({x:12, z:9, r:1.15}); buildHut('hut3', 1, a); addHome(12, 9, 'hut'); },
  ...Object.fromEntries(Object.keys(HUTS).flatMap(k => [2, 3].map(n => [`${k}s${n}`, a => buildHut(k, n, a)]))),
  bag1() { W.cap = 14; }, bag2() { W.cap = 22; },
  waiter(a) { addWorker('waiter', 2.1, -2.6, a); },
  waiter2(a) { addWorker('waiter', 6.4, -2.2, a); },
  waiter3(a) { addWorker('waiter', 6.2, 4.6, a); },
  palisade(a) { fence(a); setEra(1, a); },
  bigGrill(a) { ST.grill.t = .6; fire(ST.grill.body, 0, .1, 0, 1.35); },
  lodge(a) {
    station('lodge', {name:"hunter's lodge", gen:'meat', t:1.4, group:'farm', outZ:[-4.2, -8.3], outCap:18, genAt:[-4.2, 1, -9.6]}); buildFx.lodge(a);
    boxes.push({x0:-5.6, x1:-2.8, z0:-11.6, z1:-9.5});
  },
  spit(a) {
    // at first the grill just grills the hunters' meat into steaks; burgers come later (see burgerMenu)
    station('spit', {name:'meat grill', in:'meat', inCap:30, out:'steak', t:1, inZ:[-6.6, -5], outZ:[-1.8, -5], fireAt:[-4.2, 1.3, -5]}); buildFx.spit(a);
    boxes.push({x0:-5.3, x1:-3.1, z0:-6, z1:-4});
  },
  lumber(a) {
    station('logs', {name:'log pile', pile:'log', outZ:[3.4, -5.1], outCap:40}); buildFx.logs(a);
    circles.push({x:3.4, z:-6.4, r:.5}); addWorker('lumber', 4.8, -6.6, a);
  },
  butcher(a) { addWorker('butcher', -1.5, -8.3, a); const pb = MODELS.props3 && MODELS.props3.getObjectByName('prop_block'); if (pb && !BURGER.block) { const m = BURGER.block = pb.clone(true); m.position.set(-2.55, 0, -9.35); m.scale.setScalar(.75); scene.add(m); circles.push({x:-2.55, z:-9.35, r:.4}); } },
  village(a) { well(a); setEra(2, a); },
  field(a) {
    station('field', {name:'wheat field', gen:'wheat', t:1.7, group:'farm', outZ:[-4.2, 9.7], outCap:18, genAt:[-4.2, 1, 11]}); buildFx.field(a);
    boxes.push({x0:-6.8, x1:-1.6, z0:10.8, z1:13.4});
  },
  oven(a) {
    station('oven', {name:'oven', in:'wheat', out:'bread', t:1.6, inZ:[-6.6, 7], outZ:[-1.8, 7], fireAt:[-4.2, .7, 7.9]}); buildFx.oven(a);
    circles.push({x:-4.2, z:7, r:1.05});
  },
  baker(a) { addWorker('baker', -.6, 9.7, a); },
  treasurer(a) { addWorker('treasurer', .4, 7.4, a); },
  treasurer2(a) { addWorker('treasurer', 2.8, 7.4, a); if (a) banner('🧾 A second treasurer!', 'Two of them now split the cash piles between them, nearest money first.'); },
  bag3() { W.cap = 32; },
  townhall(a) { hall(a); setEra(3, a); },
  senate(a) { senateFx(a); },
  northGate(a) { openRegion('north', a); },
  mine(a) {
    buildFx.mine(a);
    oreZone = addZone({kind:'source', item:'ore', rate:.55, wrate:.95, from:() => new THREE.Vector3((R() - .5)*1.2, 1, -59.6), x:0, z:-45.2, icon:'⛏️', tile:{alpha:1, size:92, label:'Iron mine'}});
  },
  mason(a) { station('stones', {name:'stone pile', pile:'stone', outZ:[-6, -35.5], outCap:40}); buildFx.masonry(a); addWorker('mason', -4.2, -37.2, a); },
  smelter(a) {
    station('smelter', {name:'smelter', in:'ore', out:'ingot', t:1.8, group:'metal', inZ:[4.1, -40], outZ:[8.9, -40], fireAt:[6.5, 1.2, -40]});
    buildFx.smelter(a); circles.push({x:6.5, z:-40, r:.95});
  },
  miner(a) { addWorker('miner', -2.5, -41, a); },
  mason2(a) { addWorker('mason', -2.6, -35.4, a); },
  eastGate(a) { openRegion('east', a); },
  hall(a) {
    buildFx.pavilion(a);
    makeTable('hall', DISHES, alongX(49.75, 7), {x:42, z:8.9, w:3, d:1.6});
    boxes.push({x0:39.3, x1:44.7, z0:6.3, z1:7.7});
    makeCash('hall', 46.1, 7);
    makeLine('hall', {table:TB.hall, cash:CASH.hall, face:0, max:10, spawn:[67, 2.9], mult:1.5,
      slot:k => k === 0 ? [42, 5.5] : k <= 6 ? [52.4 + k*1.3, 4.2] : [60.2 - (k - 7)*1.15, 5.15], exit:[[40.6, 4.2], [40.6, 3], [62, 3]],
      active:() => true, interval:() => 5.5 / (1 + .4*houses() + .25*W.era), order:() => travelerOrder(3, 3)});
  },
  market(a) { buildFx.market(a); addZone({kind:'sell', x:40, z:-6, icon:'💰', tile:{alpha:1, size:92, label:'Sell extras'}}); boxes.push({x0:38.8, x1:41.2, z0:-8.7, z1:-7.7}); },
  porter(a) { addWorker('porter', 37.2, 9.6, a); },
  porter2(a) { addWorker('porter', 37.2, 12.2, a); },
  house1(a) { house(45, -3, a); }, house2(a) { house(48.5, -3, a); }, house3(a) { house(48, 10, a); },
  library(a) {
    station('library', {name:'library', in:'bread', out:'scroll', t:6, inZ:[44, -6.9], outZ:[47.2, -6.9], fireAt:[45.5, 1.5, -8.2], outCap:20});
    buildFx.library(a); boxes.push({x0:43.7, x1:47.3, z0:-11, z1:-8.2}); setEra(4, a);
  },
  scholar(a) { addWorker('scholar', 42.4, -4, a); },
  studyHall(a) {
    STUDY.zone = addZone({kind:'study', x:39.9, z:-2.6, icon:'📚', tile:studyTile()});
    const g = new THREE.Group(); g.position.set(39.9, 0, -3.75); scene.add(g);
    mesh(G.box, 0x6b4526, [.7, .9, .35], [0, .45, 0], g); mesh(G.box, 0x8a5d36, [.8, .06, .45], [0, .93, .02], g).rotation.x = -.25;
    for (let i = 0; i < 4; i++) mesh(G.cyl, 0xf1e2b8, [.06, .5, .06], [-.25 + i*.16, 1.02, .02], g).rotation.z = Math.PI/2;
    addWorker('researcher', 41.6, -3.2, a);
    if (a) banner('📚 Study hall!', `Bring scrolls here: every ${studyNeed(studyLvl())} scrolls finish a research level that lifts all your income for good.`);
  },
  tinker(a) { addWorker('tinker', 12, -38, a); },
  builder(a) { addWorker('builder', 8.6, -3.4, a); },
  builder2(a) { addWorker('builder', 12.3, -5.6, a); },
  // each builder has a parking spot of their own: sharing one, idle builders (and their bulldozers) piled up and jostled
  builder3(a) { addWorker('builder', 12.3, -7.8, a); }, builder4(a) { addWorker('builder', 10.2, -5.6, a); }, builder5(a) { addWorker('builder', 10.2, -7.8, a); },
  sciMedicine() { BOOST.patience = 1.6; },
  sciTactics() { BOOST.tactics = .7; },
  stoneRoads(a) { groundStage(1, a); }, roads2(a) { groundStage(2, a); }, roads3(a) { groundStage(3, a); },
  farmGate(a) { openRegion('farm', a); },
  field2(a) {
    station('field2', {name:'wheat field', gen:'wheat', t:1.7, group:'farm', outZ:[38.5, 65.1], outCap:18, genAt:[38.5, 1, 67.5]});
    fieldAt(38.5, 67.5, a); ST.field2.body = fieldAt.last; boxes.push({x0:35.9, x1:41.1, z0:66.3, z1:68.8});
  },
  field3(a) {
    station('field3', {name:'wheat field', gen:'wheat', t:1.7, group:'farm', outZ:[38.5, 72.1], outCap:18, genAt:[38.5, 1, 74.5]});
    fieldAt(38.5, 74.5, a); ST.field3.body = fieldAt.last; boxes.push({x0:35.9, x1:41.1, z0:73.3, z1:75.8});
  },
  oven2(a) {
    station('oven2', {name:'big bakery', in:'wheat', out:'bread', t:1.1, inZ:[43.1, 68], outZ:[47.9, 68], fireAt:[45.5, .7, 68.9], inCap:30, outCap:30});
    ovenAt(45.5, 68, a); ST.oven2.body = ovenAt.last; circles.push({x:45.5, z:68, r:1.05});
  },
  baker2(a) { addWorker('baker2', 42, 70.4, a); },
  baker3(a) { addWorker('baker3', 43, 72.6, a); },
  workshop(a) {
    station('workshop', {name:'workshop', in:'ingot', out:'tools', t:1.4, group:'metal', inZ:[7.2, -34.6], outZ:[12, -34.6], fireAt:[9.6, 1.2, -34.6]});
    workshopFx(a); boxes.push({x0:8.6, x1:10.6, z0:-35.6, z1:-33.6});
  },
  digger(a) {
    station('digger', {name:'stone digger', gen:'stone', t:.9, outZ:[10, -42.1], outCap:40, genAt:[10, 1.2, -43.4]});
    digger(a); boxes.push({x0:8.9, x1:11.1, z0:-45.4, z1:-43.6});
  },
  plow() { BOOST.farm *= 1.5; },
  fleet1(a) { fleetUp(1, a); }, fleet2(a) { fleetUp(2, a); }, fleet3(a) { fleetUp(3, a); }, fleet4(a) { fleetUp(4, a); },
  carts() { WORKER.cap += 4; for (const w of workers) w.cap = WORKER.cap + (w.kind === 'builder' ? 10 : 0); },
  warship() { makeBoat('war'); },
  brewery(a) {
    station('brewery', {name:'brewery', in:'wheat', out:'beer', t:1.8, inZ:[41.1, 63.5], outZ:[45.9, 63.5], fireAt:[43.5, 1.2, 64.7]});
    brewery(a); boxes.push({x0:42.3, x1:44.7, z0:62.55, z1:64.45});
  },
  brewer(a) { addWorker('brewer', 36.2, 63.2, a); },
  barkeep(a) { addWorker('barkeep', 49.4, 73.4, a); },
  beerGarden(a) {
    beerGardenFx(a);
    makeTable('garden', ['beer'], alongX(53.75, 87.5), {x:46, z:73.6, w:3, d:1.4, icon:'🍺'});
    makeCash('garden', 41.9, 77.3);
    slab(0xb98f5c, 12, 1.6, 56.6, 77.6, .012);
    makeLine('garden', {table:TB.garden, cash:CASH.garden, face:Math.PI, max:6, spawn:[62, 77.6], seats:SEATS, noStool:true, custom:gardenUpdate,
      slot:k => SEATS[k], exit:[[51, 77.6], [62, 77.6]], active:() => true, interval:() => 3.2, order:() => [{type:'beer', need:1 + (R()*3|0)}]});
  },
  downtownGate(a) { openRegion('downtown', a); },
  university(a) { libraryStage(2, a); },
  labs(a) { libraryStage(3, a); },
  sciFlight() {},
  airfieldGate(a) { openRegion('airfield', a); },
  hangar(a) { hangar(a); },
  plane1(a) { const pl = makePlane(80.5, 88.6); if (a) popIn(pl.g); },
  plane2(a) { const pl = makePlane(80.5, 93.4); if (a) popIn(pl.g); },
  plane3(a) { const pl = makePlane(80.5, 98.2); if (a) popIn(pl.g); },
  plane4(a) { const pl = makePlane(86.4, 91); if (a) popIn(pl.g); },
  plane5(a) { const pl = makePlane(86.4, 95.8); if (a) popIn(pl.g); },
  warTable(a) {
    warTableFx(a); makeCash('spoils', 12.3, 72.8);
    warZone = addZone({kind:'war', x:12.3, z:70.6, w:2.1, d:2.1, icon:'⚔️', tile:{alpha:1, size:84, label:'War table'}});
  },
  sciNets() { BOOST.fishRate = .6; BOOST.bigFish = .3; },
  sciFarming() { BOOST.farm *= 2; },
  sciMetal() { BOOST.metal = 2; },
  sciWheel() { WORKER.speed = 5.2; WORKER.cap += 4; for (const w of workers) { w.speed = WORKER.speed; w.cap = WORKER.cap + (w.kind === 'builder' ? 10 : 0); } },
  sciNav() {},
  boatyard(a) {
    buildFx.boatyard(a);
    station('harbor', {name:'harbor', pile:'fish', outZ:[-9.4, -7.2], outCap:30});
    makeBoat('fish');
  },
  boat2() { const b = makeBoat('fish'); b.t = 9; b.x = -14.2; },
  tradeShip() { makeCash('harbor', -9.3, -9.75); makeBoat('trade'); },
  southGate(a) { openRegion('south', a); },
  smith(a) {
    station('smith', {name:'blacksmith', in:'ingot', out:'sword', t:2.4, group:'metal', inZ:[-7.4, 66.5], outZ:[-2.6, 66.5], fireAt:[-5.3, 1.1, 66.5]});
    buildFx.smithy(a); boxes.push({x0:-6, x1:-4, z0:65.7, z1:67.3});
  },
  mess(a) {
    buildFx.mess(a);
    makeTable('mess', [...DISHES, 'sword'], alongX(-.25, 82), {x:2, z:68.1, w:3, d:1.6});
    boxes.push({x0:-.6, x1:4.6, z0:69.3, z1:70.7});
    makeLine('mess', {table:TB.mess, face:Math.PI, max:6, spawn:[-9.5, 94], done:enlist, entry:[[-9.5, 79], [-9.5, 72.4]],
      slot:k => k === 0 ? [2, 71.6] : [1.4 - k*1.1, 84.4], exit:[],
      active:() => true, interval:() => W.unlocked.has('barracks') ? 5 : 9,
      order:() => { const d = availableDishes(); return [{type:d[R()*d.length|0], need:2 + (R()*2|0)}, {type:W.unlocked.has('guns') ? 'gun' : 'sword', need:1}]; }});
  },
  hauler(a) { addWorker('hauler', -7.6, 70.5, a); },
  armorer(a) { addWorker('armorer', -2.4, 70.5, a); },
  barracks(a) { buildFx.barracks(a); makeCash('tribute', 9.5, 72.4); boxes.push({x0:7, x1:12, z0:74, z1:77}); setEra(5, a); },
  quartermaster(a) { addWorker('quartermaster', 6.4, 70.6, a); },
  castle(a) { boxes.push({x0:-8.6, x1:-2.4, z0:73.1, z1:78.1, castle:true}); castleStage(1, a); setEra(6, a); },
  troop1(a) { troopStage(1, a); }, troop2(a) { troopStage(2, a); }, troop3(a) { troopStage(3, a); }, troop5(a) { troopStage(5, a); },
  castle2(a) { castleStage(2, a); }, castle3(a) { castleStage(3, a); }, castle4(a) { castleStage(4, a); },
  guns(a) {
    ST.smith.out = 'gun';
    const oz = zones.find(z => z.kind === 'out' && z.st === 'smith');
    if (oz) { oz.icon = ITEM.gun.icon; oz.tile = {...oz.tile, label:ITEM.gun.n}; drawTile(oz.tc.g, oz.icon, oz.tile); oz.tc.t.needsUpdate = true; }
    // swords already made are reforged into rifles
    for (const st of stacks) for (const it of st.items) if (it.type === 'sword') { const m = itemMesh('gun'); m.position.copy(it.mesh.position); scene.remove(it.mesh); it.mesh = m; it.type = 'gun'; }
    if (TB.mess) TB.mess.accepts = TB.mess.accepts.map(t => t === 'sword' ? 'gun' : t);
    if (LINES.mess) for (const c of LINES.mess.q) for (const w of c.wants) if (w.type === 'sword') w.type = 'gun';
    troopStage(4, a);
    gunRack(a);
    if (a) banner('🔫 Redcoats with muskets!', 'The blacksmith makes muskets now. Campaigns need fewer soldiers and pay 50% more.');
  },
  water1(a) { waterStage(1, a); }, water2(a) { waterStage(2, a); }, water3(a) { waterStage(3, a); }, water4(a) { waterStage(4, a); }, water5(a) { waterStage(5, a); },
  bridge1(a) { bridgeStage(1, a); }, bridge2(a) { bridgeStage(2, a); }, bridge3(a) { bridgeStage(3, a); }, bridge4(a) { bridgeStage(4, a); },
  airport(a) { terminalFx(a); makeCash('airport', -38.1, .9); makeJet(false, 'pax', 0); if (a) banner('🛫 Passenger airport!', 'Airliners bring rich travelers. Every landing pays big fares.'); },
  jumbo(a) { makeJet(true, 'pax', 0); if (a) banner('🛬 Jumbo jets!', 'Bigger planes, more passengers, much bigger fares.'); },
  concert(a) { arenaStage(1, a); makeCash('concert', 47.6, 78.1); },
  cargoPort(a) { cargoYard(a); makeBoat('cargo'); if (a) banner('🏗️ Cargo port!', 'Container ships unload at your harbor and pay well.'); },
  cruisePort(a) { makeBoat('cruise'); if (a) banner('🛳️ Cruise ships!', 'Liners bring hungry tourists to your tables.'); },
  police(a) { civicBlock('police', a); if (a) banner('🚓 Police station!', 'Officers chase robbers and keep the peace: unrest fades twice as fast.'); },
  fireStation(a) { civicBlock('fire', a); if (a) banner('🚒 Fire station!', 'Fire trucks put out fires for you.'); },
  hospital(a) { civicBlock('hospital', a); if (a) banner('🏥 Hospital!', 'Healthier guests wait longer, and an ambulance tends the battlefield.'); },
  traffic(a) { trafficFx(); if (a) banner('🛣️ Paved roads!', 'Asphalt streets and traffic lights downtown. Only work trucks drive through town; cars take the highway.'); },
  exchange(a) { exchangeFx(a); investTile(); if (a) banner('🏛️ Stock exchange!', 'Walk up the steps and stand on 📈 to invest. When nothing is left to build, your builders become brokers here.'); },
  highway(a) { highwayFx(a); interstateFx(a); gasPlotFx(); if (a) banner('🛣️ The highway!', 'An elevated freeway over the railway to the next city. Cars pay tolls.'); },
  stadium(a) { arenaStage(2, a); },
  dome(a) { arenaStage(3, a); },
  tanks(a) { if (BASE.built) motorPool(a); if (a && !BASE.pool) banner('🪖 Tank division!', 'Three tanks roll out through the south gate whenever a monster attacks.'); },
  moonBase(a) { if (a) { W.flags.base = true; const S = spaceScene('moon'); S.built = -1; SPACE.view = 'moon'; SPACE.tour = 9; stage.classList.add('space'); buildBase(S); banner('🧑‍🚀 Moon base!', 'Domes, labs and solar farms on the Moon. Visit any time with 🪐.'); } },
  mars(a) { if (a) launch('mars'); else { W.flags.mars = true; setEra(12, false); } },
  terminal2(a) { terminal2Fx(a); if (a) banner('🏢 Terminal 2!', 'A second gate: room for another airliner.'); },
  jet2(a) { makeJet(false, 'pax', 1); if (a) banner('🛫 A second airliner!', 'Two passenger planes now take turns on the runway.'); },
  cargoJet(a) { cargoApronFx(a); makeJet(true, 'cargo', 2); if (a) banner('📦 Cargo freighter!', 'An air freight plane for your industry. It earns more than the airliners.'); },
  stallMain1(a) { stallStage('main', 1, a); }, stallMain2(a) { stallStage('main', 2, a); },
  stallHall1(a) { stallStage('hall', 1, a); }, stallHall2(a) { stallStage('hall', 2, a); },
  oilField(a) { oilFieldFx(a); if (a) banner('🛢️ The quarry strikes oil!', 'The stone is all dug out. Pump jacks stand where the rocks were, and the masons work the oil now.'); },
  refinery(a) { refineryFx(a); if (a) banner('🏭 Oil refinery!', 'The quarry now refines its own oil. Fuel sells for four times as much as crude.'); },
  hw_nile(a) { hwyBuild('nile', a); }, hw_hellas(a) { hwyBuild('hellas', a); }, hw_kumo(a) { hwyBuild('kumo', a); }, hw_aztlan(a) { hwyBuild('aztlan', a); },
  garden(a) { lettuceGarden(a); },
  supplyDepot(a) { supplyDepot(a); }, supplyClerk(a) { addWorker('clerk', 18.6, -6.4, a); },
  gardener(a) { addWorker('gardener', 23.8, 5.6, a); },
  bunbaker(a) { addWorker('bunbaker', 17.2, 5.6, a); },
  tomatobed(a) { tomatoBed(a); },
  burgerBar(a) { burgerBar(a); },
  siegeWorks(a) { siegeYard(a); },
  bulldozers(a) { for (const w of workers) if (DOZER_KINDS.has(w.kind)) { w.carry = null; equip(w); } if (a) banner('🚜 Bulldozers!', 'Builders and stonemasons drive bulldozers now: faster, and the blade carries a bigger load.'); },
  burgercook(a) { addWorker('burgercook', 25.6, 17.6, a); },
  scooters(a) { for (const w of workers) { w.carry = null; equip(w); } if (a) banner('🛵 Delivery scooters!', 'Waiters and everyone who carries food ride scooters now, half again as fast.'); },
  foodVans(a) { for (const w of workers) { w.carry = null; equip(w); } if (a) banner('🚐 Food delivery vans!', 'The food crew drives vans now: nearly twice walking speed, with room for more.'); },
  vegas(a) { stripFx(a); if (a) banner('🎰 The Lucky Strip!', 'A boulevard of neon south of the airfield road. Build casinos: they make crazy money.'); },
  slots(a) { stripLot('slots', a); if (a) banner('🎰 Slot parlor!', 'Stand on the reels to play. The house usually loses here.'); },
  chapel(a) { stripLot('chapel', a); if (a) banner('💒 Wedding chapel!', 'Couples fly in to get married on the Strip.'); },
  casino1(a) { stripLot('casino1', a); if (a) banner('🦁 The Golden Lion!', 'Your first great casino. Its takings pile up on the Strip cash tile.'); },
  fountains(a) { stripLot('fountains', a); if (a) banner('⛲ Dancing fountains!', 'The show draws a quarter more gamblers to every casino.'); },
  casino2(a) { stripLot('casino2', a); if (a) banner('🔺 The Pyramid!', 'A black-glass pyramid with a beam of light into the sky.'); },
  stripHotel(a) { stripLot('stripHotel', a); if (a) banner('🏨 The resort hotel!', 'Thousands of rooms: they pay rent and fill the casinos.'); },
  casino3(a) { stripLot('casino3', a); if (a) banner('🗼 The Sky Tower!', 'A casino in the clouds, the tallest thing on the Strip.'); },
  casino4(a) { stripLot('casino4', a); if (a) banner('🛶 The Canal Palace!', 'Gondolas, a bell tower and the biggest tables in the world.'); },
  gasStation(a) { gasStationFx(a); if (a) banner('⛽ Gas station!', 'A pipe runs from the refinery to a gas station at the highway exit. Every car that fills up pays.'); },
  aiLab(a) { aiFx(1, a); }, superAI(a) { aiFx(2, a); },
  speedboat(a) { boatDocks(); if (a) banner('🛥️ Your own speed boat!', 'Step on a ⚓ dock to take the helm. Rivers, the ocean, the islands: go anywhere there is water.'); },
  mount1(a) { mountStage(1, a); }, mount2(a) { mountStage(2, a); }, mount3(a) { mountStage(3, a); }, mount4(a) { mountStage(4, a); }, mount5(a) { mountStage(5, a); }, mount6(a) { if (W.mount !== 5 || a) mountStage(6, a); }, mount7(a) { mountStage(7, a); }, tradeBridge(a) { tradeBridgeFx(a); }, mount8(a) { mountStage(8, a); },
  wStone(a) { wonderFx('wStone', a); }, wPyramid(a) { wonderFx('wPyramid', a); }, wColosseum(a) { wonderFx('wColosseum', a); },
  wCathedral(a) { wonderFx('wCathedral', a); }, wTower(a) { wonderFx('wTower', a); }, wNeedle(a) { wonderFx('wNeedle', a); },
  ranchGate(a) { openRegion('ranch', a); ranchBridge(a); ranchAnimals(); },
  dairy(a) { station('dairy', {name:'dairy', gen:'milk', t:1.6, group:'farm', outZ:[-30.8, -44.5], outCap:18, genAt:[-33, 1, -44.5]}); ranchFx('dairy', a); },
  creamery(a) { station('creamery', {name:'ice cream parlor', in:'milk', out:'icecream', t:1.4, inZ:[-28.8, -44.5], outZ:[-23.6, -44.5], fireAt:[-26.2, 1.4, -44.5]}); ranchFx('creamery', a); if (a) banner('🍦 Ice cream!', 'A new dish on every table. Guests pay well for it.'); },
  milkman(a) { addWorker('milkman', -35.5, -41.1, a); },
  tomatoes(a) { station('tomatoes', {name:'tomato field', gen:'tomato', t:1.6, group:'farm', outZ:[-30.8, -38.5], outCap:18, genAt:[-33, 1, -38.5]}); ranchFx('tomatoes', a); },
  pizzeria(a) { station('pizzeria', {name:'pizzeria', in:'tomato', out:'pizza', t:1.6, inZ:[-28.8, -38.5], outZ:[-23.6, -38.5], fireAt:[-26.2, 1.4, -38.5]}); ranchFx('pizzeria', a); if (a) banner('🍕 Pizza!', 'Hot pizza for your guests, at a much better price.'); },
  picker(a) { addWorker('picker', -31, -41.1, a); },
  fishPier(a) { ranchFx('pier', a); RANCH.pier = addZone({kind:'source', item:'fish', rate:.42, wrate:.75, from:() => new THREE.Vector3(-15.4 + R()*1.2, -.1, -46.2 + (R() - .5)*2), x:-23.6, z:-34.2, icon:'🎣', tile:{alpha:1, size:96, label:'Fishing pier'}}); },
  sushi(a) { station('sushi', {name:'sushi bar', in:'fish', out:'sushi', t:1.4, inZ:[-28.8, -34.2], outZ:[-31.6, -34.2], fireAt:[-26.2, 1.4, -34.2]}); ranchFx('sushi', a); if (a) banner('🍣 Sushi!', 'The best-paying dish in the empire.'); },
  sushichef(a) { addWorker('sushichef', -26.5, -41.1, a); },
  aquarium(a) { aquariumFx(a); if (a) banner('🐠 Aquarium!', 'Every fish you have caught brings more visitors.'); },
  zoo(a) { zooFx(a); if (a) banner('🦁 Zoo!', 'An animal from every land you conquered. Visitors pay to see them.'); },
  moonHotel(a) { const S = spaceScene('moon'); S.built = -1; if (a) { SPACE.view = 'moon'; SPACE.tour = 8; stage.classList.add('space'); buildBase(S); banner('🏨 Moon hotel!', 'The most expensive rooms in the universe. Guests pay a fortune.'); } },
  asteroid(a) { if (a) { SPACE.view = 'belt'; SPACE.tour = 8; stage.classList.add('space'); banner('☄️ Asteroid mining!', 'Mining ships haul rare metals back from the belt.'); } },
  spaceElevator(a) { spaceElevatorFx(a); if (a) banner('🛗 Space elevator!', 'A cable from your launch pad all the way to orbit.'); },
  launchPad(a) { launchPadFx(a); makeCash('space', -32.5, 3.6); if (a) banner('🚀 The space age!', 'Launch satellites for income, then land on the Moon.'); },
  satellite(a) { if (a) launch('sat'); },
  moonLanding(a) { if (a) launch('moon'); else setEra(11, false); },
  mineRail(a) { buildMineRail(a); if (a) banner('🚃 Mine railway!', 'Ore carts run from the mine straight into the smelter.'); },
  railway(a) { W.train = 1; railStage(1, a); makeCash('rail', 51.7, 61); makeTrain(0); if (a) banner('🐎 Stagecoach line!', 'Horses and wagons bring travelers from the next towns.'); },
  steamTrain(a) { W.train = 2; railStage(2, a); overpasses(a); makeTrain(1); if (a) banner('🚂 Steam train!', 'Trains bring travelers and fares from the next towns.'); },
  bulletTrain(a) { W.train = 3; railStage(3, a); makeTrain(2); if (a) banner('🚄 Bullet train!', 'Faster trains, more passengers, bigger fares.'); },
};
// what each age needs; an age only arrives once every age before it has
const skyscrapers = () => lotStage.filter(s => s >= 4).length;
const AGE_NEED = [null,
  [() => W.unlocked.has('palisade'), 'Build the palisade'], [() => W.unlocked.has('village'), 'Found the village'], [() => W.unlocked.has('townhall'), 'Build the town hall'],
  [() => W.unlocked.has('library'), 'Build the library'], [() => W.unlocked.has('barracks'), 'Build the barracks'], [() => W.unlocked.has('castle'), 'Build the castle'],
  [() => W.conquests >= 5, 'Win 5 campaigns'], [() => skyscrapers() >= 1, 'Raise your first skyscraper'], [() => W.unlocked.has('highway') && skyscrapers() >= 3, 'Build the highway and 3 skyscrapers'],
  [() => W.conquests >= CAMPAIGNS.length, `Win all ${CAMPAIGNS.length} campaigns`], [() => W.unlocked.has('moonLanding'), 'Land on the Moon'], [() => !!W.flags.mars, 'Settle Mars']];
function setEra(e, anim) {
  // climb as far toward e as the milestones allow, one age at a time
  let k = W.era; while (k < e && k < AGE_NEED.length - 1 && AGE_NEED[k + 1][0]()) k++;
  if (k > W.era) for (let a = W.era + 1; a <= k; a++) setEraStep(a, anim && a === k);
}
function setEraStep(e, anim) {
  if (e <= W.era) return;
  W.era = e;
  if (e === 7 && anim) setTimeout(restyleForAge, 0);   // the Empire dresses in modern clothes
  if (e >= 4 && fenceGroup) fence(false);   // the palisade becomes a stone wall
  if (anim) {
    banner(`${ERA_ICON[e]} ${ERAS[e]}!`, ERA_TXT[e]);
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => snd(f, .18, 'triangle', .05), i*110));
  }
}
const padZones = {};
const OBJ = {z:null, t:0};   // what the guide is pointing at, so helpers can pitch in
const CUR_ICON = {coin:'💵', log:'🪵', stone:'🪨', ingot:'🔩', tools:'🔨', scroll:'📜'};
function refreshPads() {
  for (const p of PADS) {
    if (p.hidden) continue;
    if (W.unlocked.has(p.id) || (p.region && !W.unlocked.has(p.region + 'Gate'))) {
      if (padZones[p.id]) { removeZone(padZones[p.id]); delete padZones[p.id]; }
      continue;
    }
    const after = p.after.every(a => W.unlocked.has(a));
    const ready = after && (!p.army || W.army >= p.army) && (!p.need || p.need());
    const near = p.after.every(a => W.unlocked.has(a) || PADS.find(q => q.id === a).after?.every(b => W.unlocked.has(b)));
    if (!ready && !near) continue;
    let z = padZones[p.id];
    // two tiles never share ground: the one already showing keeps it, unless a ready tile meets a locked preview
    const pw = p.w || 2.1, clash = Object.entries(padZones).find(([id, q]) => id !== p.id && q !== z && (q.x !== p.x || q.z !== p.z) && Math.abs(q.x - p.x) < (q.w + pw)/2 && Math.abs(q.z - p.z) < (q.d + pw)/2);
    if (clash) {
      const [cid, q] = clash;
      if (ready && q.locked) { removeZone(q); delete padZones[cid]; }
      else { if (z) { removeZone(z); delete padZones[p.id]; } continue; }
    }
    const label = p.army && after ? `🔒 ${p.label} · ${p.army}🛡️` : '🔒 ' + p.label;
    if (!z || z.locked !== !ready || (!ready && z.label !== label)) {
      // the second backpack shares the first one's spot; wait for it to clear
      if (PADS.some(q => q !== p && q.x === p.x && q.z === p.z && padZones[q.id] && padZones[q.id] !== z)) continue;
      if (z) removeZone(z);
      z = padZones[p.id] = addZone({kind:ready ? 'pad' : 'lock', pad:p, x:p.x, z:p.z, w:p.w || 2.1, d:p.w || 2.1, locked:!ready, label, icon:p.icon,
        tile: ready ? {cost:p.cost, cur:CUR_ICON[p.cur]} : {alpha:.45, size:70, label, dashed:true, stroke:'rgba(255,255,255,0)'}});
      z.lastPaid = -1;
    }
    if (ready) {
      const paid = W.paid[p.id] || 0;
      if (z.lastPaid !== paid) {
        z.lastPaid = paid;
        drawTile(z.tc.g, p.icon, {cost:p.cost - paid, cur:CUR_ICON[p.cur], prog:paid / p.cost});
        z.tc.t.needsUpdate = true;
      }
    }
  }
}
function payPad(zn, e) {
  const p = zn.pad, paid = W.paid[p.id] || 0, rem = p.cost - paid;
  if (rem <= 0) return;
  if (p.cur === 'coin') {
    if (W.coins <= 0) { e.tick = .3; return; }
    const amt = Math.min(rem, W.coins, Math.max(1, Math.ceil(p.cost / 28)));
    W.coins -= amt; W.paid[p.id] = paid + amt; e.tick = .045;
    const m = itemMesh('coin'); m.position.set(e.pos.x, 1.6, e.pos.z);
    flyAway(m, new THREE.Vector3(p.x, .1, p.z), .25);
    snd(700 + (paid/p.cost)*500, .03, 'triangle', .025);
  } else {
    const it = e.stack.take([p.cur]);
    if (!it) { e.tick = .3; return; }
    flyAway(it.mesh, new THREE.Vector3(p.x, .1, p.z), .25);
    W.paid[p.id] = paid + 1; e.tick = .09; snd(200, .04, 'square', .03);
  }
  if (W.paid[p.id] >= p.cost) unlock(p.id, true); else refreshPads();
}
function unlock(id, anim) {
  if (W.unlocked.has(id)) return;
  W.unlocked.add(id);
  { const n0 = scene.children.length; BLD.on++; try { UNLOCK[id](anim); } finally { BLD.on--; } PADOBJ[id] = scene.children.slice(n0).filter(o => o.isGroup && !CHARS.has(o)); }
  if (/^castle/.test(id) && BASE.built) baseTier(anim);
  if (anim) {
    shakeCam(.35);
    const p = PADS.find(q => q.id === id);
    if (p.x != null) { puff(p.x, p.z); popText(`${p.icon} ${p.label}!`, new THREE.Vector3(p.x, 3, p.z), '#fff'); }
    if (p.sci) banner(`🔬 ${p.label}`, {sciNets:'Fishing is faster and big salmon bite more often.', sciFarming:'Fields and hunters produce twice as fast.',
      sciMetal:'Smelter, blacksmith and workshop work twice as fast.', sciWheel:'Helpers walk faster and carry more.', sciNav:'You can build a boatyard on the river.',
      sciMedicine:'Guests wait much longer before they get angry.', sciTactics:'Campaigns need fewer soldiers.', sciFlight:'Build a bridge to an airfield and take to the sky.'}[id]);
    snd(392, .12, 'triangle', .05, 1.5); setTimeout(() => snd(784, .2, 'triangle', .05), 120);
    save();
  }
  refreshPads(); refreshUpgrades();
}

