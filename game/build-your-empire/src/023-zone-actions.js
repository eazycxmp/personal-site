// ------------------------------------------------------------------ zone actions
const SELLABLE = Object.keys(ITEM).filter(k => ITEM[k].sell);
function zoneAct(e, zn, dt) {
  e.tick -= dt; if (e.tick > 0) return;
  switch (zn.kind) {
    case 'depot': depotAct(e, zn); break;
    case 'study': {
      // scrolls in, research out: every level needs more of them, and every level lifts all income
      const it = e.stack.items.find(q => q.type === 'scroll'); if (!it) { e.tick = .25; break; }
      e.stack.items.splice(e.stack.items.indexOf(it), 1); flyAway(it.mesh, new THREE.Vector3(zn.x, .6, zn.z), .2); e.tick = .09;
      const S = W.flags.study ||= {lvl:0, n:0}; S.n++;
      if (S.n >= studyNeed(S.lvl)) {
        S.n = 0; S.lvl++; snd(880, .2, 'triangle', .05, 1.5);
        banner(`📚 Research level ${S.lvl}!`, `Everything you earn is now worth +${Math.round((studyMult() - 1)*100)}%. Next level: ${studyNeed(S.lvl)} scrolls.`);
      }
      drawTile(zn.tc.g, '📚', studyTile()); zn.tc.t.needsUpdate = true;
      break;
    }
    case 'source':
      if (e.stack.length < e.cap) {
        spawnItem(zn.item, zn.from(), e.stack, zn.item === 'fish' ? fishSpecies() : null);
        e.tick = (e.isPlayer ? zn.rate : zn.wrate) * (zn.item === 'fish' ? BOOST.fishRate : 1);
        if (zn.item === 'fish') splash(); else particle(0x8a7a6a, zn.from(), new THREE.Vector3(0, 1.5, 1), .5, .15);
        if (e.char.rod) e.rodJerk = .3;
        if (e.isPlayer) { pickSnd(e); if (zn.item === 'fish') W.caught++; }
      } else { e.tick = .25; if (e.isPlayer) full(); }
      break;
    case 'in': {
      const s = ST[zn.st], acc = s.ins ? s.ins.filter(gp => s.inStack.count(gp) < Math.floor(s.inStack.cap/s.ins.length)).flat() : [s.in];
      if (s.inStack.length < s.inStack.cap && e.stack.count(acc)) {
        transfer(e.stack, s.inStack, acc); e.tick = .07; dropSnd();
        if (zn.st === 'grill') W.flags.fedGrill = true;
      } else e.tick = .12;
      break;
    }
    case 'out':
      if (zn.stack.length && e.stack.length < e.cap) { transfer(zn.stack, e.stack); e.tick = .07; if (e.isPlayer) pickSnd(e); }
      else { e.tick = .12; if (e.isPlayer && zn.stack.length) full(); }
      break;
    case 'table': {
      const takes = zn.tb.takes();
      if (e.stack.count(takes)) { transfer(e.stack, zn.tb.stack, takes); e.tick = .07; dropSnd(); }
      else e.tick = .12;
      break;
    }
    case 'cash': {
      const c = zn.cash;
      if (e.isPlayer && c.value > 0) {
        const [fx0, fy0] = project(new THREE.Vector3(c.x, .5, c.z)); flyCash(fx0, fy0, Math.min(8, 2 + Math.floor(c.value / 40)));
        LEDGER.collecting = true; W.coins += c.value; LEDGER.collecting = false; popText(`+${c.value}`, e.pos.clone().setY(2.6), '#ffe06b'); c.value = 0; W.flags.collected = true;
        c.stack.items.splice(0).forEach((it, i) => flyAway(it.mesh, () => e.pos.clone().setY(1.4), .25 + i*.015));
        snd(1046, .08, 'triangle', .05); setTimeout(() => snd(1318, .1, 'triangle', .05), 60);
        save();
      }
      e.tick = .2; break;
    }
    case 'sell': {
      const it = e.isPlayer && e.stack.take(SELLABLE);
      if (it) {
        const v = ITEM[it.type].sell * (it.size > 1.2 ? 2 : 1);
        W.coins += v; W.earned += v; flyAway(it.mesh, new THREE.Vector3(40, 1, -8.2), .25);
        popText(`+${v}`, e.pos.clone().setY(2.4 + R()*.4), '#ffe06b'); snd(760 + R()*200, .04, 'triangle', .03); e.tick = .09;
      } else e.tick = .2;
      break;
    }
    case 'pad': if (e.isPlayer) payPad(zn, e); break;
    case 'rebuild': if (e.isPlayer) payRebuild(zn, e); break;
    case 'senate': if (e.isPlayer) paySenate(zn, e); break;
    case 'repair': {
      if (!e.isPlayer) break;
      const st = ST[zn.st]; zn.prog = (zn.prog || 0) + .25; e.tick = .25; snd(400 + zn.prog*200, .05, 'square', .03);
      if (zn.prog >= 1.5) { st.broken = false; removeZone(zn); st.repairZone = null; puff(zn.x, zn.z); popText(`Repaired the ${st.name}!`, e.pos.clone().setY(2.8), '#b8f0a0'); }
      break;
    }
    case 'war': if (e.isPlayer) warAct(zn, e); break;
    case 'museum': if (e.isPlayer && player.zoneT > .6 && $('modal').hidden) { openMuseum(); player.zoneT = -2; } e.tick = .2; break;
    case 'recruit': if (e.isPlayer) payRecruit(zn, e); e.tick = .2; break;
    case 'spin': if (e.isPlayer) playSlots(zn, e); e.tick = .2; break;
    case 'ferry': if (e.isPlayer && player.zoneT > .6) { takeFerry(zn); player.zoneT = 0; } e.tick = .2; break;
    case 'dock': if (e.isPlayer && player.zoneT > .6 && !BOAT.on && W.unlocked.has('speedboat')) { boatOn(zn.dock); player.zoneT = -2; } e.tick = .2; break;
    case 'fly': if (e.isPlayer && player.zoneT > .6 && !TRIP.on && $('modal').hidden) { openFlights(zn); player.zoneT = -2; } e.tick = .2; break;
    case 'invest': if (e.isPlayer && !zn.open && $('modal').hidden) { zn.open = true; openInvest(); } e.tick = .3; break;
    case 'upgrade': if (e.isPlayer) payUpgrade(zn, e); break;
    case 'gasup': if (e.isPlayer) payGas(zn, e); break;
    case 'fix': if (e.isPlayer) payFix(zn, e); break;
    case 'landMarket': if (e.isPlayer) payLandMarket(zn, e); break;
    case 'rebuildQuarter': if (e.isPlayer) payQuarter(zn, e); break;
    case 'defSite': if (e.isPlayer) paySite(zn, e); break;
    case 'bin': {
      const keep = e.isPlayer && zn.keep;
      const junk = keep ? Object.keys(ITEM).filter(k => k !== keep) : null;
      if (e.stack.count(junk)) { flyAway(e.stack.take(junk).mesh, new THREE.Vector3(-1.75, .7, -2.6), .25); e.tick = .08; snd(160, .04, 'square', .02); }
      else e.tick = .2;
      break;
    }
  }
}
let fullT = 0;
function full() { if (fullT <= 0) { popText('FULL', player.pos.clone().setY(3.2), '#ff8a75'); fullT = 1; } }
function pickSnd(e) { snd(420 + e.stack.length*28, .05, 'triangle', .035); }
function dropSnd() { snd(300, .04, 'square', .02); }

// the study hall's tile shows how far along the next research level is
const STUDY = {zone:null};
function studyTile() { const S = W.flags.study || {lvl:0, n:0}; return {alpha:1, size:84, label:`Research Lv ${S.lvl}: ${S.n}/${studyNeed(S.lvl)}`, fill:'rgba(70,50,120,.6)'}; }
