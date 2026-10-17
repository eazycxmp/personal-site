// ------------------------------------------------------------------ helpers (workers)
const workers = [];
const LOOKS = {
  fisher:{ranger:true, body:0x3f6fb5, hat:'straw', pants:0x5a4a3a, rod:true},
  waiter:{body:0x5a7a5a, apron:0xffffff, hat:'beanie', hatCol:0x3a5a3a},
  butcher:{body:0x7a2a22, apron:0xe8e0d0, hat:'beanie', hatCol:0x222222},
  gardener:{body:0x5a8a3a, apron:0x8a6a42, hat:'straw', pants:0x4a5a3a},
  bunbaker:{body:0xf2e6cc, apron:0xffffff, hat:'chef'},
  burgercook:{body:0xd9443a, apron:0xffffff, hat:'chef'},
  baker:{body:0xe8d8b8, apron:0xffffff, hat:'chef'},
  lumber:{ranger:true, body:0x2f7d4a, hat:'beanie', hatCol:0xd9443a, pants:0x3a3a5a},
  mason:{body:0x7a7a82, hat:'beanie', hatCol:0x4a4a52},
  miner:{ranger:true, body:0x4a3a2a, hat:'helmet', hatCol:0xe0b030},
  hauler:{ranger:true, body:0x8a6a3a, hat:'straw'},
  armorer:{body:0x5a5f6a, apron:0x3a2a1a, hat:'beanie', hatCol:0x2a2a2a},
  quartermaster:{body:0x3a4a7a, hat:'helmet'},
  porter:{body:0xb05a3a, apron:0xf0e0c0, hat:'beanie', hatCol:0xb05a3a},
  treasurer:{body:0x6a3a8a, trim:0xf0c030, hat:'beanie', hatCol:0xf0c030},
  builder:{body:0xe0a020, trim:0x6a6a6e, hat:'helmet', hatCol:0xf2c200},
  tinker:{body:0x5a4a3a, apron:0x8a6a3a, hat:'helmet', hatCol:0x8a8f96},
  brewer:{body:0x8a5a2b, apron:0xd9c89a, hat:'beanie', hatCol:0x5a3a1a},
  barkeep:{body:0x2f6a4a, apron:0xffffff, hat:'beanie', hatCol:0x1f4a3a},
  researcher:{body:0x5a3a7a, trim:0xe8e0d0, hat:'beanie', hatCol:0x2a1a3a},
  scholar:{body:0x2a3a6a, trim:0xe8e0d0, hat:'beanie', hatCol:0x1a1a3a},
  milkman:{body:0xf4f4f4, apron:0x3f7cc0, hat:'straw'},
  picker:{body:0x3f8a3a, hat:'straw', pants:0x5a4a3a},
  sushichef:{body:0xf4f4f4, apron:0x1a1a1a, hat:'beanie', hatCol:0xd9443a},
};
function addWorker(kind, x, z, anim) {
  const w = entity(LOOKS[kind] || LOOKS.baker, x, z, WORKER.speed, WORKER.cap + (kind === 'builder' ? 10 : 0)); w.kind = kind; w.state = 'idle'; w.wait = 0; w.home = [x, z];
  workers.push(w);
  if (anim) popIn(w.char.g);
  return w;
}
const inZone = st => zones.find(z => z.kind === 'in' && z.st === st);
const outZone = st => zones.find(z => z.kind === 'out' && z.st === st);
const dishOuts = tb => zones.filter(z => z.kind === 'out' && ITEM[ST[z.st].out]?.dish && tb.takes().includes(ST[z.st].out));
const GATHER = {
  lumber:{ranger:true, nodes:() => trees, pile:() => ST.logs, drop:[3.4, -5.1]},
  mason:{nodes:() => rocks, pile:() => ST.stones, drop:[-6, -47.5]},
};
const ROUTES = {
  fisher:{ranger:true, src:() => { const h = outZone('harbor'); return [h && h.stack.length ? h : null, fishZone]; }, dst:() => inZone('grill')},
  waiter:{src:() => dishOuts(TB.main), dst:() => TB.main.zone, line:'main'},
  porter:{src:() => TB.hall ? dishOuts(TB.hall) : [], dst:() => TB.hall?.zone, line:'hall'},
  quartermaster:{src:() => TB.mess ? dishOuts(TB.mess) : [], dst:() => TB.mess?.zone, line:'mess'},
  armorer:{src:() => [outZone('smith')], dst:() => TB.mess?.zone, line:'mess'},
  butcher:{src:() => [outZone('lodge')], dst:() => inZone('spit')},
  // the burger station's suppliers: lettuce and tomatoes from the gardens, buns from the ovens, cooked meat from the grill
  gardener:{src:() => burgerSrc([outZone('garden'), outZone('tomatobed')]), dst:() => inZone('burgerBar')},
  bunbaker:{src:() => [outZone('oven'), outZone('oven2')].filter(z => z && z.stack.length).slice(0, 1), dst:() => inZone('burgerBar')},
  burgercook:{src:() => burgerSrc([outZone('spit'), outZone('tomatobed')]), dst:() => inZone('burgerBar')},
  baker:{src:() => [outZone('field')], dst:() => inZone('oven')},
  baker2:{src:() => [outZone('field2')], dst:() => inZone('oven2')},
  baker3:{src:() => [outZone('field3')], dst:() => inZone('oven2')},
  brewer:{src:() => [outZone('field2'), outZone('field3'), outZone('field')].filter(z => z && z.stack.length).slice(0, 1), dst:() => inZone('brewery')},
  barkeep:{src:() => [outZone('brewery')], dst:() => TB.garden?.zone, line:'garden'},
  scholar:{src:() => [outZone('oven2'), outZone('oven')].filter(z => z && z.stack.length).slice(0, 1), dst:() => inZone('library')},
  // only the surplus: the first ten scrolls stay in the library for the player's own scroll builds
  researcher:{src:() => [outZone('library')].filter(z => z && z.stack.length > 10), dst:() => STUDY.zone},
  miner:{ranger:true, src:() => [oreZone], dst:() => inZone('smelter')},
  hauler:{ranger:true, src:() => [outZone('smelter')], dst:() => inZone('smith')},
  milkman:{src:() => [outZone('dairy')], dst:() => inZone('creamery')},
  picker:{src:() => [outZone('tomatoes')], dst:() => inZone('pizzeria')},
  sushichef:{src:() => [RANCH.pier], dst:() => inZone('sushi')},
  tinker:{src:() => [outZone('smelter')], dst:() => inZone('workshop')},
};
