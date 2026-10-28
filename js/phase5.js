"use strict";
var STUNQ = ["Ué, travou!", "Pane no sistema!", "Fora do ar!", "Reiniciando...", "Sem sinal!", "Quem desligou?"];
var HITQ = ["Ai, meu passaporte!", "Foi o sistema!", "Só tava passeando!", "Isso é perseguição!", "Cadê meu advogado?!", "Eu só tava indo ali!"];
var NEARQ = ["RASPÃO!", "QUASE!", "ESCAPOU!", "DE FININHO!", "ZERO ARRANHÃO!"];

/* ============================ MODO FLÁVIO ============================ */
var FL = { top: 262, bot: 484, limit: 330, pxPerM: 13 };
var STAGES = [
  { name: "Estrada até Foz", sub: "BR-277 · rumo a Foz do Iguaçu", theme: "road", speed: 222, len: 7600, par: 70, boss: "comboio", bossName: "COMBOIO BLINDADO DA PF", bossDur: 24, c: ["#050918", "#18235a", "#33407a"] },
  { name: "Ponte Tancredo Neves", sub: "Fronteira Brasil ⟷ Argentina", theme: "bridge", speed: 250, len: 8600, par: 72, boss: "dronemae", bossName: "DRONE-MÃE DA PF", bossDur: 24, c: ["#040a1c", "#10286a", "#2c4a8c"] },
  { name: "Aduana argentina", sub: "Puerto Iguazú · apresente os documentos", theme: "aduana", speed: 278, len: 9400, par: 74, boss: "carimbo", bossName: "FISCAL CARIMBÃO", bossDur: 26, c: ["#0a0a1c", "#2a1f55", "#5a4a86"] },
  { name: "Pista do jatinho", sub: "Aeroporto · o jatinho está esperando", theme: "airport", speed: 305, len: 10200, par: 76, boss: "heli", bossName: "HELICÓPTERO COM HOLOFOTE", bossDur: 30, c: ["#02050f", "#0d1a45", "#223a74"] }
];
var FP = [
  { n: "arminha", lab: "Arminha", cost: 10, cd: .35, ic: "✋" },
  { n: "biblia", lab: "Bíblia", cost: 25, cd: 7, ic: "📖" },
  { n: "cartaz", lab: "Cartaz", cost: 18, cd: 4, ic: "🪧" },
  { n: "bone", lab: "Boné", cost: 28, cd: 11, ic: "🧢" }
];
var BOSSVO = { 3: "moraesPF" };

function startFlavio() {
  parts = []; pops = []; fx.shk = 0; fx.flash = 0; fx.slow = 0; fx.ts = 1;
  g = { mode: "flavio", t: 0, clock: 0, anim: 0, px: 0, py: 372, cam: -300, stage: 0, hearts: 3, lives: 3, en: 100, sp: 20,
    combo: 0, comboT: 0, mult: 1, bestCombo: 0, pts: 0, dist: 0, inv: 0, boost: 0, slow: 0, shield: 0, disg: 0, xblock: 0, xwarn: 0, xnext: 0,
    cds: [0, 0, 0, 0], obs: [], items: [], proj: [], zones: [], toasts: [], stamp: null, nik: null, finish: null, quip: null, call: null,
    coins: 0, passports: 0, hits: 0, deaths: 0, medals: [], trans: null, boss: null, cp: { px: 0 }, nextSpawn: 650, seenY: 372, moving: false,
    why: "", stars: [], city: [], hills: [], god: false, bolaDone: false, xDone: false, jam: null, sirenT: 0, sx: 0 };
  var i, cx = 0;
  for (i = 0; i < 90; i++) g.stars.push({ x: rnd(0, W), y: rnd(0, 170), r: rnd(.5, 1.6), p: rnd(0, 6) });
  while (cx < 2400) { var bw = rint(34, 80), bh = rint(30, 120); g.city.push({ x: cx, w: bw, h: bh }); cx += bw + rint(0, 14); }
  g.cityW = cx;
  for (i = 0; i < 40; i++) g.hills.push(rnd(0, 1));
  beginStage(0);
}
function beginStage(i) {
  var S = STAGES[i];
  g.stage = i; g.px = 0; g.py = 372; g.cam = -300; g.obs = []; g.items = []; g.proj = []; g.zones = []; g.boss = null; g.jetX = 0; g.finish = null;
  g.nextSpawn = 650; g.cp = { px: 0 }; g.hearts = 3; g.en = Math.max(g.en, 60); g.inv = 0; g.shield = 0; g.disg = 0; g.xblock = 0; g.xwarn = 0;
  g.xnext = 15 + rnd(0, 6); g.st = { hits: 0, deaths: 0, t: 0, near: 0, stuns: 0, pts0: g.pts }; g.nik = null; g.nikDone = false; g.cameo = null; g.cameoDone = false; g.jam = null; g.jamDone = false;
  g.seenY = 372; g.stamp = null; g.call = null; g.quip = null;
  g.trans = { k: "intro", t: 0, dur: 2.6 };
  state.stage = i + 1;
  if (i === 0) say("nunca", "start", 2);
  else if (i === 1) say("batalhas", "etapa-2", 1);
  else if (i === 3) say("nunca", "aeroporto", 1);
}
function diffNow() { return clamp((g.stage + clamp(g.px / STAGES[g.stage].len, 0, 1)) / 4, 0, 1); }
function laneY(pad) { return rnd(FL.top + 24, FL.bot - (pad || 14)); }
function hasType(t) { for (var i = 0; i < g.obs.length; i++) if (g.obs[i].t === t && !g.obs[i].dead) return true; return false; }

function mkAgent(x, y, amp, sp, chase) { return { t: "agent", x: x, y: y, y0: y, amp: amp, sp: sp, ph: rnd(0, 6), r: 14, chase: !!chase, skin: pick(["#c98e68", "#8d5a3b", "#e0ac84"]), stun: 0, nm: false }; }
function mkCar(x, y, vx) { return { t: "car", x: x, y: y, hw: 46, hh: 14, vx: vx, on: false, stun: 0, nm: false }; }
function mkDog(x, y, vx) { return { t: "dog", x: x, y: y, vx: vx, on: false, stun: 0, r: 10, nm: false }; }
function mkGate(x, gap, amp, sp) { var gy = rnd(FL.top + 80, FL.bot - 70); return { t: "gate", x: x, hw: 11, gap: gap, gy0: gy, gy: gy, amp: amp, sp: sp, ph: rnd(0, 6), nm: false, kind: g.stage >= 2 ? "cancela" : "bloqueio" }; }
function mkDrone(shots) { return { t: "drone", x: 0, sx: W + 80, y: laneY(), st: "enter", tm: .9, shots: shots, ly: 0, stun: 0, on: false, trig: 0, nm: false }; }
function mkSpot(life, rate) { return { t: "spot", sx: W + 60, sy: laneY(), r: 66, alert: 0, life: life, rate: rate || .85, tx: 600, ty: 372, stun: 0 }; }

function spawnPattern(x) {
  var s = g.stage, d = diffNow(), opts = ["agents", "agents", "car", "line", "mix", "wall"], i, y, kind;
  if (s >= 1) opts.push("dog", "dog", "drone", "wall");
  if (s >= 2) opts.push("gate", "gate", "drone", "pincer");
  if (s >= 3) opts.push("pincer", "dog", "gate", "drone");
  if ((s >= 3 || (s >= 2 && RNG() < .3)) && !hasType("spot")) opts.push("spot", "spot");
  if (s === 0 && x < 1500) opts = ["agents", "car", "line"];
  kind = pick(opts);
  var vxc = function () { return -(rnd(160, 220) + d * 130); };
  if (kind === "agents") {
    var n = rint(1, 2) + (d > .45 ? 1 : 0), used = [];
    for (i = 0; i < n; i++) { y = laneY(); y = Math.min(FL.bot - 10, y); g.obs.push(mkAgent(x + i * 55, y, rnd(25, 62), rnd(1.2, 2.2) + d * 1.4, false)); }
  } else if (kind === "car") {
    g.obs.push(mkCar(x + 200, laneY(), vxc()));
    if (d > .5) g.obs.push(mkCar(x + 520, laneY(), vxc()));
  } else if (kind === "mix") {
    y = laneY(); g.obs.push(mkAgent(x, y, 40, 1.8, true));
    g.obs.push(mkCar(x + 250, clamp(y + pick([-95, 95]), FL.top + 30, FL.bot - 14), vxc()));
  } else if (kind === "line") {
    var cnt = d > .55 ? 4 : 3;
    for (i = 0; i < cnt; i++) { var yl = FL.top + 26 + i * (190 / (cnt - 1)) + rnd(-8, 8); g.obs.push(mkAgent(x + i * 55, yl, 28, 2 + i * .3 + d, false)); }
  } else if (kind === "wall") {
    g.obs.push(mkGate(x, lerp(135, 104, d), 0, 0));
    if (d > .3) g.obs.push(mkAgent(x + 90, laneY(), 30, 2, true));
  } else if (kind === "gate") {
    g.obs.push(mkGate(x, lerp(130, 106, d), rnd(40, 78), rnd(1.3, 2.1)));
  } else if (kind === "dog") {
    var nd = d > .55 ? 2 : 1;
    for (i = 0; i < nd; i++) g.obs.push(mkDog(x + i * 160, laneY(), -(250 + d * 140 + i * 30)));
  } else if (kind === "drone") {
    var dr = mkDrone(d > .6 ? 2 : 1); dr.trig = x; g.obs.push(dr);
  } else if (kind === "pincer") {
    g.obs.push(mkCar(x + 150, FL.top + 36, vxc()));
    g.obs.push(mkCar(x + 330, FL.bot - 16, vxc()));
    g.obs.push(mkDog(x + 260, FL.top + 112 + rnd(0, 80), -(280 + d * 120)));
  } else if (kind === "spot") {
    var sp = mkSpot(rnd(10, 13)); sp.trig = x; g.obs.push(sp);
  }
  // itens no caminho
  var iy = rnd(FL.top + 24, FL.bot - 14), r = RNG(), it = "coin";
  for (i = 0; i < 5; i++) g.items.push({ t: "coin", x: x + 320 + i * 36, y: iy + Math.sin(i / 4 * Math.PI) * -26, got: false });
  if (r < .34 || g.en < 35) g.items.push({ t: "pix", x: x + 260, y: laneY(), got: false });
  else if (r < .44) g.items.push({ t: "cafe", x: x + 260, y: laneY(), got: false });
  else if (r < .56 && s >= 1) g.items.push({ t: "pass", x: x + 290, y: laneY(), got: false });
}
function spawnAhead() {
  var S = STAGES[g.stage];
  while (g.nextSpawn < g.px + 1150 && g.nextSpawn < S.len - 380) {
    spawnPattern(g.nextSpawn);
    g.nextSpawn += lerp(620, 335, diffNow()) * rnd(.85, 1.2);
  }
}

/* ----- geometria / colisão ----- */
function rdist(px, py, x0, y0, x1, y1) { var cx = clamp(px, x0, x1), cy = clamp(py, y0, y1); return Math.hypot(px - cx, py - cy); }
function gateRects(o) {
  var half = o.gap / 2; return [[o.x - o.hw, FL.top - 40, o.x + o.hw, o.gy - half], [o.x - o.hw, o.gy + half, o.x + o.hw, FL.bot + 24]];
}
// folga (px) entre a borda do jogador e o obstáculo; <0 = colisão
function gapOf(o, px, py) {
  var r = 11, rs, d;
  switch (o.t) {
    case "agent": return Math.hypot(px - o.x, py - o.y) - r - o.r;
    case "dog": return o.on ? Math.hypot(px - o.x, py - o.y) - r - o.r : 999;
    case "car": return o.on ? rdist(px, py, o.x - o.hw, o.y - o.hh, o.x + o.hw, o.y + o.hh) - r : 999;
    case "gate": rs = gateRects(o); return Math.min(rdist(px, py, rs[0][0], rs[0][1], rs[0][2], rs[0][3]), rdist(px, py, rs[1][0], rs[1][1], rs[1][2], rs[1][3])) - r;
  }
  return 999;
}
function onScreenX(wx) { return wx - g.cam; }

/* ----- pontuação / combo ----- */
function fScore() { return Math.floor(g.dist) + g.pts; }
function addScore(n) { var v = Math.round(n * g.mult); g.pts += v; return v; }
function bumpCombo(n) {
  var before = g.mult; g.combo += n; g.comboT = 4.2; g.mult = clamp(1 + Math.floor(g.combo / 4), 1, 8);
  if (g.combo > g.bestCombo) g.bestCombo = g.combo;
  if (g.mult > before) { popup("COMBO x" + g.mult + "!", 300, g.py - 110, "#ffdf00", 24); sfx("pow"); shake(3); }
  if (g.combo >= 10 && !g.bolaDone) { g.bolaDone = true; say("bola", "combo-10", 1); }
}
function gainSp(n) { g.sp = clamp(g.sp + n, 0, 100); }

/* ----- dano / vida ----- */
function hurtFlavio(o) {
  if (g.god) return;
  if (g.shield > 0) {
    g.shield = 0; g.inv = .9; ring(300, g.py - 30, "#8fd0ff", 14); burst(300, g.py - 30, "#ffe082", 16, 220, 60); shake(6); sfx("shield");
    popup("BÍBLIA BLOQUEOU!", 300, g.py - 100, "#ffe082", 20); say("hoje", "biblia-bloqueio", 1);
    addScore(80); bumpCombo(2); gainSp(8);
    if (o && o.t === "gate") g.px = Math.max(g.px, o.x + o.hw + 16);
    return;
  }
  g.hearts--; g.inv = 1.7; g.slow = .9; g.hits++; g.st.hits++; shake(11); flashScr("255,40,40", .45); sfx("hit");
  burst(300, g.py - 24, "#ff5252", 18, 200); smoke(300, g.py - 20, 4);
  if (g.combo >= 3) popup("COMBO QUEBRADO", 300, g.py - 130, "#ff8a80", 18);
  g.combo = 0; g.mult = 1;
  var q = pick(HITQ); g.quip = { s: q, t: 1.4 }; popup(q, 300, g.py - 100, "#ffb4a8", 16);
  if (o && o.t === "gate") g.px = o.x - o.hw - 20;
  else if (o && o.t === "agent") g.px -= 18;
  state.hearts = g.hearts;
  if (g.hearts <= 0) loseLife();
}
function loseLife() {
  g.lives--; g.deaths++; g.st.deaths++;
  if (g.lives <= 0) { endGame(false, g.xblock > 0 ? "x" : "pf"); return; }
  g.trans = { k: "respawn", t: 0, dur: 1.7, done: false };
  sfx("lose"); shake(10); flashScr("255,255,255", .6);
  say("calar", "respawn", 3);
}
function doRespawn() {
  var cp = g.cp; g.px = cp.px; g.py = 372; g.hearts = 3; g.en = Math.max(g.en, 55); g.inv = 2.4; g.obs = []; g.items = []; g.proj = []; g.zones = [];
  g.shield = 0; g.disg = 0; g.combo = 0; g.mult = 1; g.pts = Math.max(0, g.pts - 150); g.nextSpawn = g.px + 750; g.slow = 0; g.xblock = 0; g.xwarn = 0;
  if (cp.boss && g.boss) { g.boss.pt = 1.8; g.boss.ph = "idle"; g.boss.t = 0; g.boss.sx = 840; g.boss.intro = 0; }
  state.hearts = 3; burst(300, 340, "#69f0ae", 24, 220, 40); ring(300, 340, "#69f0ae", 10);
  popup("CHECKPOINT!", 300, 250, "#69f0ae", 26);
}

/* ----- poderes do Flávio ----- */
function powerIdx(i) {
  if (!g || state.screen !== "play") return { ok: false, reason: "idle" };
  return g.mode === "flavio" ? flPower(i) : moPower(i);
}
var NAMES = {
  arminha: 0, biblia: 1, cartaz: 2, bone: 3, trump: 4, especial: 4, special: 4, space: 4,
  canetada: 0, toga: 1, bloqueio: 2, inquerito: 3, oficio: 4,
  j: 0, k: 1, l: 2, i: 3, " ": 4
};
function usePower(name) {
  var k = String(name == null ? "" : name).toLowerCase().replace(/[^a-z ]/g, ""); // tira acentos/pontuação
  if (/^(ligar|trump)/.test(k)) k = "trump";
  if (/^(of[ií]cio)/.test(k)) k = "oficio";
  if (/^(inqu)/.test(k)) k = "inquerito";
  if (/^(b[ií]blia)/.test(k)) k = "biblia";
  if (/^bon/.test(k)) k = "bone";
  if (/^bloq/.test(k)) k = "bloqueio";
  if (!(k in NAMES)) return { ok: false, reason: "unknown" };
  return powerIdx(NAMES[k]);
}
function flPower(i) {
  if (g.trans || g.finish || (g.boss && g.boss.intro > 0) || (g.boss && g.boss.dead)) return { ok: false, reason: "busy" };
  if (g.xblock > 0) { popup("BLOQUEADO PELO X!", 300, g.py - 100, "#ff6b6b", 18); sfx("nope"); return { ok: false, reason: "xblock" }; }
  if (i === 4) {
    if (g.sp < 100) { popup("Especial " + Math.floor(g.sp) + "%", 300, g.py - 100, "#ffcc80", 14); return { ok: false, reason: "charge" }; }
    return flSpecial();
  }
  var P = FP[i];
  if (g.cds[i] > 0) return { ok: false, reason: "cooldown" };
  if (g.en < P.cost) { popup("Sem energia!", 300, g.py - 100, "#ffcc80", 14); sfx("nope"); return { ok: false, reason: "energy" }; }
  g.en -= P.cost; g.cds[i] = P.cd;
  if (i === 0) {
    g.proj.push({ k: "gest", x: g.px + 26, y: g.py, ph: 0, seen: [[], []], t: 0 }); sfx("shot");
    burst(300 + 26, g.py - 34, "#fff59d", 6, 120, 0); popup("PÓW!", 340, g.py - 50, "#fff59d", 15);
  } else if (i === 1) {
    g.shield = 3.8; sfx("shield"); ring(300, g.py - 30, "#8fd0ff", 12); popup("Bíblia de bolso!", 300, g.py - 100, "#ffe082", 17);
  } else if (i === 2) {
    g.proj.push({ k: "cartaz", x: g.px + 26, y: g.py, ph: 0, seen: [[], []], t: 0, rot: 0 }); sfx("whoosh"); popup("FORA PT!", 340, g.py - 60, "#ffab91", 16);
  } else if (i === 3) {
    g.disg = 4.6; g.seenY = g.py; sfx("pow"); ring(300, g.py - 40, "#ef9a9a", 10); burst(300, g.py - 60, "#ef5350", 12, 120, 20); popup("Disfarçado! Perderam o rastro", 300, g.py - 105, "#ef9a9a", 15);
  }
  return { ok: true, power: P.n };
}
function flSpecial() {
  g.sp = 0; g.call = { t: 0 }; sfx("phone"); flashScr("255,255,255", .8); shake(12);
  var n = 0;
  for (var i = 0; i < g.obs.length; i++) { var o = g.obs[i]; if (o.dead) continue;
    var ox = o.t === "drone" || o.t === "spot" ? o.sx : o.x - g.cam;
    if (ox > -120 && ox < W + 160) { o.dead = true; n++; var oy = o.t === "spot" ? o.sy : o.y; popup("VISTO REVOGADO", clamp(ox, 80, W - 80), oy - 50, "#ff8a80", 14); burst(clamp(ox, 0, W), oy - 20, "#ffeb3b", 12, 200); } }
  g.zones = []; addScore(100 * n); bumpCombo(3 + n); g.st.stuns += n;
  if (g.boss && !g.boss.dead && g.boss.intro <= 0) damageBoss(26, true);
  g.slow = 0; sfx("boom");
  return { ok: true, power: "trump", cleared: n };
}
function stunEnemy(o, dur) {
  if (o.stun > 0) return;
  o.stun = dur; g.st.stuns++; var sx = o.t === "drone" ? o.sx : o.x - g.cam, sy = o.y || 360;
  popup(pick(STUNQ), clamp(sx, 60, W - 60), sy - 60, "#fff59d", 15); burst(clamp(sx, 0, W), sy - 26, "#ffe94d", 9, 150); smoke(sx, sy - 20, 3);
  addScore(120); bumpCombo(2); gainSp(8); sfx("pop");
}
function damageBoss(n, force) {
  var b = g.boss; if (!b || b.dead || b.intro > 0) return;
  if (b.ph === "rest" && b.k === "comboio") n *= 2;
  b.hp = Math.max(0, b.hp - n); b.hurt = .25; shake(4); sfx("hit"); burst(b.sx - 30, b.y - 40, "#ffcc80", 10, 180); addScore(30); gainSp(3);
  popup("-" + Math.round(n), b.sx - 40, b.y - 100, "#ffcc80", 18);
}

function updProj(dt) {
  var i, j, p, o;
  for (i = g.proj.length - 1; i >= 0; i--) {
    p = g.proj[i]; p.t += dt; var gone = false;
    if (p.k === "gest") { p.x += 1050 * dt; if (p.x > g.px + 950) gone = true; }
    else {
      p.rot += dt * 18;
      if (p.ph === 0) { p.x += 780 * dt; if (p.t > .5) p.ph = 1; }
      else { var dx = g.px + 10 - p.x, dy = g.py - p.y, dd = Math.hypot(dx, dy) || 1; p.x += dx / dd * 840 * dt; p.y += dy / dd * 840 * dt; if (dd < 26) gone = true; }
    }
    for (j = 0; j < g.obs.length && !gone; j++) {
      o = g.obs[j]; if (o.dead) continue;
      if (o.t === "gate") {
        var rs = gateRects(o);
        if (rdist(p.x, p.y, rs[0][0], rs[0][1], rs[0][2], rs[0][3]) < 8 || rdist(p.x, p.y, rs[1][0], rs[1][1], rs[1][2], rs[1][3]) < 8) {
          if (p.k === "gest") { gone = true; burst(p.x - g.cam, p.y - 30, "#ddd", 5, 90); } else if (p.ph === 0) p.ph = 1;
        }
        continue;
      }
      if (o.t === "spot" || p.seen[p.ph].indexOf(o) >= 0) continue;
      var hit = false;
      if (o.t === "agent" || o.t === "dog") hit = Math.abs(p.x - o.x) < 26 && Math.abs(p.y - o.y) < 24;
      else if (o.t === "car") hit = Math.abs(p.x - o.x) < 56 && Math.abs(p.y - o.y) < 26;
      else if (o.t === "drone" && o.on) hit = Math.abs(p.x - (g.cam + o.sx)) < 34 && Math.abs(p.y - o.y) < 40;
      if (hit) { p.seen[p.ph].push(o); stunEnemy(o, p.k === "gest" ? 3.2 : 2.6); if (p.k === "gest") gone = true; }
    }
    if (!gone && g.boss && !g.boss.dead && g.boss.intro <= 0 && !p.seen[p.ph].length && (p.x - g.cam) > g.boss.sx - 90 && Math.abs(p.y - g.boss.y) < 62) {
      p.seen[p.ph].push(g.boss); damageBoss(p.k === "gest" ? 5 : 9); if (p.k === "gest") gone = true; else p.ph = 1;
    }
    if (gone) g.proj.splice(i, 1);
  }
}

/* ----- zonas de ataque (telegrafadas) ----- */
function addZone(z) { z.tele = z.tele || 1; z.live = z.live || .4; z.nm = false; z.col = z.col || "#ff3b3b"; g.zones.push(z); return z; }
function zoneHitsPlayer(z) {
  if (z.sh === "circ") return Math.hypot(300 - z.cx, g.py - 8 - z.cy) < z.r + 8;
  return rdist(300, g.py - 6, z.x0, z.y0, z.x1, z.y1) < 7;
}
function updZones(dt) {
  for (var i = g.zones.length - 1; i >= 0; i--) {
    var z = g.zones[i];
    if (z.tele > 0) { z.tele -= dt; if (z.tele <= 0) { sfx(z.sh === "circ" ? "boom" : "laser"); if (z.sh === "circ") { shake(5); burst(z.cx, z.cy, "#fff", 14, 220); } } continue; }
    z.live -= dt;
    if (g.inv <= 0 && !g.trans) {
      if (zoneHitsPlayer(z)) hurtFlavio(null);
      else if (!z.nm && z.sh !== "circ") { var gp = rdist(300, g.py - 6, z.x0, z.y0, z.x1, z.y1) - 7; if (gp < 13) { z.nm = true; nearMiss(300, g.py); } }
    }
    if (z.live <= 0) g.zones.splice(i, 1);
  }
}
function nearMiss(sx, sy) {
  g.st.near++; vox("near-miss", { p: .9 }); popup(pick(NEARQ), sx, sy - 90, "#80d8ff", 20); addScore(50); bumpCombo(2); gainSp(10);
  burst(sx + 8, sy - 14, "#b3e5fc", 7, 150, 0); slowmo(.3);
}

/* ----- inimigos: movimento ----- */
function updObs(dt) {
  var i, o, d = diffNow();
  for (i = g.obs.length - 1; i >= 0; i--) {
    o = g.obs[i];
    if (o.dead) { g.obs.splice(i, 1); continue; }
    if (o.stun > 0) o.stun -= dt;
    if (o.t === "agent") {
      if (o.stun <= 0) {
        if (o.chase && o.x - g.px < 450 && o.x - g.px > -50) o.y0 += clamp(g.seenY - o.y0, -1, 1) * (55 + d * 30) * dt;
        o.y = clamp(o.y0 + Math.sin(g.t * o.sp + o.ph) * o.amp, FL.top + 4, FL.bot);
      }
    } else if (o.t === "car") {
      if (!o.on && o.x - g.px < 1000) { o.on = true; sfx("siren"); }
      if (o.on) { if (o.stun > 0) { o.vx *= (1 - 1.5 * dt); if (RNG() < .3) smoke(o.x - g.cam + rnd(-30, 30), o.y - 30, 1); } o.x += o.vx * dt; }
    } else if (o.t === "dog") {
      if (!o.on && o.x - g.px < 900) o.on = true;
      if (o.on && o.stun <= 0) { o.x += o.vx * dt; if (o.x - g.px > 200) o.y = clamp(o.y + clamp(g.seenY - o.y, -1, 1) * 90 * dt, FL.top + 8, FL.bot - 2); }
    } else if (o.t === "gate") {
      o.gy = clamp(o.gy0 + Math.sin(g.t * o.sp + o.ph) * o.amp, FL.top + o.gap / 2 + 6, FL.bot - o.gap / 2 + 6);
    } else if (o.t === "drone") updDrone(o, dt);
    else if (o.t === "spot") updSpot(o, dt);
    if (o.t !== "drone" && o.t !== "spot" && o.x < g.px - 450) o.dead = true;
  }
}
function updDrone(o, dt) {
  if (!o.on) { if (o.trig - g.px < 900) { o.on = true; o.st = "enter"; o.tm = .9; sfx("alarm"); } else return; }
  if (o.stun > 0) { o.st = "fall"; o.sx -= 40 * dt; o.fy = (o.fy || 0) + 150 * dt; if (o.fy > 90) o.dead = true; return; }
  o.tm -= dt;
  if (o.st === "enter") { o.sx = lerp(o.sx, 740, 1 - Math.pow(.02, dt)); if (o.tm <= 0) { o.st = "track"; o.tm = 1.3; } }
  else if (o.st === "track") { o.y += clamp(g.seenY - o.y, -1, 1) * 175 * dt; o.sx = lerp(o.sx, 700, 1 - Math.pow(.2, dt)); if (o.tm <= 0) { o.st = "aim"; o.tm = .85; o.ly = o.y; addZone({ sh: "rect", x0: 0, x1: o.sx, y0: o.ly - 9, y1: o.ly + 9, tele: .85, live: .35, owner: o }); } }
  else if (o.st === "aim") { o.sx -= 6 * dt; if (o.tm <= 0) { o.st = "fire"; o.tm = .4; } }
  else if (o.st === "fire") { if (o.tm <= 0) { o.shots--; if (o.shots > 0) { o.st = "track"; o.tm = .9; } else { o.st = "exit"; o.tm = 1.1; } } }
  else if (o.st === "exit") { o.sx += 260 * dt; o.fy = (o.fy || 0) - 60 * dt; if (o.tm <= 0) o.dead = true; }
  // enquanto a mira está no ar o laser acompanha o drone
  for (var i = 0; i < g.zones.length; i++) if (g.zones[i].owner === o) g.zones[i].x1 = o.sx;
}
function updSpot(o, dt) {
  if (o.trig != null) { if (o.trig - g.px > 700) return; delete o.trig; sfx("alarm"); }
  if (o.stun > 0) { o.alert = 0; return; }
  o.life -= dt; if (o.life <= 0) { o.dead = true; return; }
  var tx = 300, ty = g.seenY;
  if (g.disg > 0) { tx = o.tx; ty = o.ty; if (Math.hypot(o.sx - tx, o.sy - ty) < 30) { o.tx = rnd(120, 800); o.ty = laneY(); } }
  var sp = 100 + diffNow() * 50, dx = tx - o.sx, dy = ty - o.sy, dd = Math.hypot(dx, dy) || 1;
  o.sx += dx / dd * Math.min(sp, dd * 4) * dt; o.sy += dy / dd * Math.min(sp, dd * 4) * dt;
  var inside = g.disg <= 0 && Math.hypot(300 - o.sx, ((g.py - 6) - o.sy) / .62) < o.r;
  if (inside) o.alert += dt * o.rate; else o.alert = Math.max(0, o.alert - dt * .7);
  if (o.alert >= 1) {
    o.alert = 0;
    popup("LOCALIZADO!", 300, g.py - 110, "#fff59d", 22); sfx("alarm");
    if (g.inv <= 0) hurtFlavio(null);
    o.sx = W + 40; o.sy = laneY();
  }
}

/* ----- mini-chefes ----- */
function spawnBoss() {
  var S = STAGES[g.stage];
  g.boss = { k: S.boss, name: S.bossName, hp: 100, t: 0, intro: 2.6, dur: S.bossDur, sx: W + 160, y: 372, ph: "idle", pt: 1.4, n: 0, hurt: 0, dead: 0, ly: 372, xs: 0, volley: 0, cyc: 0 };
  g.obs = []; g.zones = []; g.items = []; g.cp = { px: S.len, boss: true };
  toast("MINI-CHEFE: " + S.bossName, "#ff8a80", 2.6); sfx("alarm"); shake(6);
  var v = BOSSVO[g.stage]; if (v) vox("boss-intro", { prio: 3 });
}
function triggerXBlock(sec) {
  g.xwarn = 1.3; g.xdur = sec; sfx("alarm");
  if (!g.xDone) { g.xDone = true; say("regular", "bloqueio-x", 2); }
}
function updBoss(dt) {
  var b = g.boss, i;
  if (b.dead) { b.dead += dt; return; }
  b.hurt = Math.max(0, b.hurt - dt);
  var tgtX = b.k === "carimbo" ? 850 : b.k === "heli" ? 720 : 790;
  if (b.intro > 0) { b.intro -= dt; b.sx = lerp(b.sx, tgtX, 1 - Math.pow(.03, dt)); return; }
  b.t += dt; b.pt -= dt;
  var low = b.hp < 50, ty = clamp(g.seenY, FL.top + 20, FL.bot - 10);
  if (b.k === "comboio") {
    if (b.ph === "idle") { b.y += clamp(ty - b.y, -1, 1) * 80 * dt; b.sx = lerp(b.sx, tgtX, 1 - Math.pow(.1, dt));
      if (b.pt <= 0) { b.ph = "tele"; b.pt = low ? .75 : 1.0; b.ly = b.y; addZone({ sh: "rect", x0: 0, x1: W, y0: b.ly - 28, y1: b.ly + 20, tele: b.pt, live: .55 }); } }
    else if (b.ph === "tele") { if (b.pt <= 0) { b.ph = "charge"; b.pt = .55; sfx("siren"); } }
    else if (b.ph === "charge") { b.sx = lerp(W + 120, -240, 1 - clamp(b.pt / .55, 0, 1)); if (RNG() < .5) smoke(b.sx + 60, b.y - 8, 1); if (b.pt <= 0) { b.ph = "rest"; b.pt = 1.5; b.n++; b.y = b.ly; b.sx = W + 140;
        if (b.n % 2 === 0) for (i = 0; i < 2; i++) g.obs.push(mkAgent(g.px + 520 + i * 70, laneY(), 40, 1.8, true)); } }
    else if (b.ph === "rest") { b.sx = lerp(b.sx, tgtX, 1 - Math.pow(.05, dt)); if (b.pt <= 0) { b.ph = "idle"; b.pt = low ? .5 : .9; } }
  } else if (b.k === "dronemae") {
    b.sx = tgtX + Math.sin(b.t * 1.3) * 18; b.y += clamp(ty - b.y, -1, 1) * 55 * dt;
    if (b.ph === "idle" && b.pt <= 0) {
      var nL = b.hp > 66 ? 1 : b.hp > 33 ? 2 : 3, ys = [clamp(g.seenY, FL.top + 14, FL.bot - 8)];
      for (var tries = 0; ys.length < nL && tries < 40; tries++) { var yy = laneY(), okk = true; ys.forEach(function (q) { if (Math.abs(q - yy) < 62) okk = false; }); if (okk) ys.push(yy); }
      ys.forEach(function (yy2) { addZone({ sh: "rect", x0: 0, x1: b.sx, y0: yy2 - 10, y1: yy2 + 10, tele: low ? .8 : 1.0, live: .42 }); });
      b.ph = "wait"; b.pt = 1.0 + .45 + (low ? 0 : .4); sfx("alarm"); b.cyc++;
      if (b.cyc % 3 === 0) { var md = mkDrone(1); md.trig = g.px; md.on = true; md.sx = W + 60; md.y = laneY(); g.obs.push(md); }
    } else if (b.ph === "wait" && b.pt <= 0) { b.ph = "idle"; b.pt = .5; }
  } else if (b.k === "carimbo") {
    b.sx = tgtX; b.y += clamp(ty - b.y, -1, 1) * 40 * dt;
    if (b.ph === "idle" && b.pt <= 0) {
      var cx = rnd(380, 690), gy = rnd(FL.top + 56, FL.bot - 48), tm = low ? .85 : 1.1;
      addZone({ sh: "rect", x0: cx - 58, x1: cx + 58, y0: FL.top - 40, y1: gy - 54, tele: tm, live: .55 });
      addZone({ sh: "rect", x0: cx - 58, x1: cx + 58, y0: gy + 54, y1: FL.bot + 30, tele: tm, live: .55 });
      b.xs = cx; b.ph = "wait"; b.pt = tm + .55 + .5; sfx("alarm"); b.cyc++;
      if ((b.cyc === 2 || b.cyc === 5) && g.xblock <= 0) triggerXBlock(5);
    } else if (b.ph === "wait") { if (b.pt <= 0) { b.ph = "idle"; b.pt = .35; } }
  } else if (b.k === "heli") {
    b.sx = tgtX + Math.sin(b.t * .9) * 30; b.y += clamp(ty - b.y, -1, 1) * 45 * dt;
    if (b.ph === "idle") {
      b.ph = "spot"; b.pt = 7;
      for (i = 0; i < 2; i++) { var sp = mkSpot(7, 1.05); sp.sy = laneY(); sp.sx = W + 40 + i * 120; sp.boss = true; g.obs.push(sp); }
    } else if (b.ph === "spot") {
      if (b.pt <= 0) { b.ph = "volley"; b.pt = 5.5; b.volley = 0; for (i = 0; i < g.obs.length; i++) if (g.obs[i].t === "spot") g.obs[i].dead = true; }
    } else if (b.ph === "volley") {
      b.volley -= dt;
      if (b.volley <= 0) { b.volley = low ? .75 : 1.0; var vx = clamp(300 + rnd(-90, 220), 200, 620), vy = clamp(g.seenY + rnd(-50, 50), FL.top + 20, FL.bot - 6) - 8;
        addZone({ sh: "circ", cx: vx, cy: vy, r: 54, tele: .9, live: .3 }); sfx("pop"); }
      if (b.pt <= 0) { b.ph = "idle"; }
    }
  }
  if (b.hp <= 0) bossDown(true); else if (b.t >= b.dur) bossDown(false);
}
function bossDown(killed) {
  var b = g.boss; b.dead = .001; b.killed = killed; g.zones = [];
  for (var i = 0; i < g.obs.length; i++) g.obs[i].dead = true;
  shake(14); flashScr("255,255,255", .7); sfx("boom"); ring(b.sx, b.y - 40, "#ffd54f", 20); burst(b.sx, b.y - 40, "#ffab40", 36, 320, 120); smoke(b.sx, b.y - 40, 10);
  addScore(killed ? 1000 : 300);
  popup(killed ? "CHEFE DERROTADO!" : "O CHEFE RECUOU!", W / 2, 200, "#ffdf00", 30);
  if (g.stage === 3) { g.jetX = g.px + 640; toast("PISTA LIVRE! Corra pro jatinho!", "#69f0ae", 3.5); }
}

/* ----- fase concluída / medalhas ----- */
function calcMedal(killed) {
  var st = g.st, S = STAGES[g.stage];
  var perf = 100 - st.hits * 13 - st.deaths * 28 - Math.max(0, st.t - S.par) * 0.9 + Math.min(12, st.near * 2) + (killed ? 8 : 0);
  var m = perf >= 78 ? "ouro" : perf >= 50 ? "prata" : "bronze";
  return { stage: g.stage + 1, name: S.name, medal: m, perf: Math.round(perf), hits: st.hits, deaths: st.deaths, near: st.near, time: Math.round(st.t), killed: !!killed, pts: g.pts - st.pts0 };
}
function clearStage(killed, instant) {
  var m = calcMedal(killed);
  g.medals.push(m); g.pts += 500 + (m.medal === "ouro" ? 600 : m.medal === "prata" ? 300 : 100);
  sfx("medal");
  if (instant) { if (g.stage >= 3) { winFlavio(); } else beginStage(g.stage + 1); return; }
  g.trans = { k: "medal", t: 0, dur: 3.6, m: m };
}
function winFlavio() { g.finish = { t: 0, jx: 0 }; g.trans = null; g.jetX = g.jetX || g.px + 400; sfx("win"); toast("Jatinho alcançado!", "#69f0ae", 3); }

/* ----- atualização principal ----- */
function updTrans(rdt) {
  var tr = g.trans; tr.t += rdt;
  if (tr.k === "respawn" && !tr.done && tr.t > .8) { tr.done = true; doRespawn(); }
  if (tr.t >= tr.dur) {
    var k = tr.k; g.trans = null;
    if (k === "medal") { if (g.stage >= 3) winFlavio(); else beginStage(g.stage + 1); }
  }
}
function updFlavio(rdt) {
  g.anim += rdt; updFx(rdt);
  var ti;
  for (ti = g.toasts.length - 1; ti >= 0; ti--) { g.toasts[ti].t -= rdt; if (g.toasts[ti].t <= 0) g.toasts.splice(ti, 1); }
  if (g.stamp) { g.stamp.t += rdt; if (g.stamp.t > 2.6) g.stamp = null; }
  if (g.nik) { g.nik.t += rdt; if (g.nik.t > 5.8) g.nik = null; }
  if (g.cameo) { g.cameo.t += rdt; if (g.cameo.t > 5.2) g.cameo = null; }
  if (g.quip) { g.quip.t -= rdt; if (g.quip.t <= 0) g.quip = null; }
  if (g.call) { g.call.t += rdt; if (g.call.t > 1.8) g.call = null; }
  if (g.trans) { g.cam = g.px - 300; updTrans(rdt); return; }
  var dt = rdt * fx.ts;
  if (g.finish) {
    g.finish.t += dt; g.finish.jx += (60 + g.finish.t * 700) * dt * (g.finish.t > .8 ? 1 : 0);
    if (g.finish.t > 2.3) endGame(true, "jato");
    return;
  }
  var S = STAGES[g.stage], inp = injected || readInput();
  g.t += dt; g.st.t += dt; g.clock += dt; g.anim += 0;
  state.timeLeft = Math.max(0, FL.limit - g.clock);
  // velocidade
  var v = S.speed * (1 + (g.px / S.len) * .06) * (g.boost > 0 ? 1.4 : 1) * (g.slow > 0 ? .55 : 1) + inp.x * 90;
  if (g.boss && g.boss.dead && g.stage === 3 && !g.jetX) v = 0;
  var vv = Math.max(70, v);
  if (g.jetX && g.px > g.jetX - 36) vv = 0;
  g.px += vv * dt; g.py = clamp(g.py + inp.y * 255 * dt, FL.top + 6, FL.bot - 2);
  g.dist += vv * dt / 12; g.moving = true; g.cam = g.px - 300;
  if (g.disg <= 0) g.seenY = g.py;
  ["inv", "boost", "slow", "shield", "disg", "xblock"].forEach(function (k) { if (g[k] > 0) g[k] = Math.max(0, g[k] - dt); });
  if (g.xwarn > 0) { g.xwarn -= dt; if (g.xwarn <= 0) { g.xblock = g.xdur || 5; popup("X BLOQUEADO! Poderes off", 480, 190, "#ff6b6b", 26); shake(6); sfx("nope"); } }
  for (ti = 0; ti < 4; ti++) if (g.cds[ti] > 0) g.cds[ti] = Math.max(0, g.cds[ti] - dt);
  g.en = clamp(g.en + 5.5 * dt, 0, 100); gainSp(1.1 * dt);
  if (g.comboT > 0) { g.comboT -= dt; if (g.comboT <= 0) { g.combo = 0; g.mult = 1; } }
  // eventos de etapa
  if (g.stage >= 2 && !g.boss) { g.xnext -= dt; if (g.xnext <= 0) { g.xnext = rnd(26, 34); triggerXBlock(4.5); } }
  if (!g.cp.boss && !g.cp.half && g.px > S.len * .5) { g.cp = { px: Math.floor(S.len * .5), half: true }; popup("CHECKPOINT!", 480, 200, "#69f0ae", 28); sfx("pow"); ring(300, g.py - 30, "#69f0ae", 10); }
  if (g.stage === 1 && !g.nik && !g.nikDone && g.px > S.len * .3) { g.nik = { t: 0 }; g.nikDone = true; sfx("pop"); say("mudar", "popup-nikolas", 1); }
  if (g.stage === 2 && !g.cameo && !g.cameoDone && g.px > S.len * .4) { g.cameo = { t: 0 }; g.cameoDone = true; sfx("pop"); }
  if (g.stage === 0 && !g.jam && !g.jamDone && g.px > S.len * .36) { g.jam = { x: W + 260 }; g.jamDone = true; say("marisa", "easter-jamanta", 1); }
  if (g.jam) { g.jam.x -= 150 * dt; if (g.jam.x < -420) g.jam = null; }
  if (!g.boss) { spawnAhead(); if (g.px >= S.len) spawnBoss(); }
  updObs(dt); updProj(dt); updZones(dt);
  if (g.boss) {
    updBoss(dt);
    if (g.boss.dead > 1.5 && g.stage < 3 && !g.trans) { clearStage(g.boss.killed); return; }
  }
  // colisões
  var i, o;
  if (g.inv <= 0 && !g.god) {
    for (i = 0; i < g.obs.length; i++) { o = g.obs[i]; if (o.dead || o.stun > 0) continue; if (gapOf(o, g.px, g.py) < 0) { hurtFlavio(o); break; } }
  }
  if (!g.trans) for (i = 0; i < g.obs.length; i++) {
    o = g.obs[i]; if (o.nm || o.dead || o.stun > 0 || o.t === "spot" || o.t === "drone") continue;
    var gp = gapOf(o, g.px, g.py);
    if (gp >= 0 && gp < 9 && g.inv <= 0) { o.nm = true; nearMiss(300, g.py); }
  }
  // itens
  for (i = 0; i < g.items.length; i++) {
    var it = g.items[i]; if (it.got) continue; if (it.x < g.px - 200) { it.got = true; continue; } if (Math.abs(it.x - g.px) > 40) continue;
    if (Math.hypot(it.x - g.px, it.y - (g.py - 20)) < 30) { it.got = true; pickFlavio(it); }
  }
  if (g.jetX && g.px >= g.jetX - 34 && !g.finish) { var mm = calcMedal(true); g.medals.push(mm); g.pts += 500 + (mm.medal === "ouro" ? 600 : mm.medal === "prata" ? 300 : 100); winFlavio(); }
  state.progress = clamp((g.stage + clamp(g.px / S.len, 0, 1)) / 4, 0, 1);
  state.hearts = g.hearts; state.score = fScore();
  if (g.clock >= FL.limit && !g.finish) endGame(false, "tempo");
}
function pickFlavio(it) {
  if (it.t === "coin") { g.coins++; addScore(50); bumpCombo(1); gainSp(2); sfx("coin"); burst(300, g.py - 20, "#ffd800", 5, 90, 60); popup("+" + (50 * g.mult), 300, g.py - 70, "#ffd800", 13); }
  else if (it.t === "pix") { g.en = clamp(g.en + 45, 0, 100); sfx("boost"); burst(300, g.py - 24, "#69f0ae", 10, 130, 40); popup("PIX RECEBIDO! +energia", 300, g.py - 90, "#69f0ae", 15); addScore(40); }
  else if (it.t === "cafe") { g.boost = 2.6; g.en = clamp(g.en + 20, 0, 100); sfx("boost"); popup("Cafezinho! Turbo", 300, g.py - 90, "#ffcc80", 16); burst(300, g.py - 20, "#ffcc80", 10, 150, 40); }
  else {
    g.passports++; g.stamp = { t: 0, again: g.passports > 1 }; addScore(80); sfx("pop");
    g.quip = { s: g.passports > 1 ? "De novo?!" : "Passaporte! Agora vai!", t: 1.6 };
    say("passap", "passaporte-cancelado", 2);
    setTimeout(function () { if (g && g.stamp) { sfx("stamp"); shake(7); } }, 800);
  }
}

/* ---------- desenho do modo Flávio ---------- */
var SIGNS_ROAD = ["FOZ DO IGUAÇU 38 km", "ARGENTINA →", "PEDÁGIO: SÓ PIX", "CATARATAS 27 km", "PONTE 12 km"];
function hash(n) { var x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); }
function wrapX(v, span) { return ((v % span) + span) % span; }

function drawDog(c, x, y, t, o) {
  c.save(); c.translate(x, y); c.scale(-1, 1);
  c.fillStyle = "rgba(0,0,0,.33)"; c.beginPath(); c.ellipse(0, 0, 22, 5, 0, 0, TAU); c.fill();
  var ph = o.stun > 0 ? 0 : Math.sin(t * 22) * 6;
  c.fillStyle = "#6b4426"; c.fillRect(-14 + ph, -8, 5, 8); c.fillRect(8 - ph, -8, 5, 8); c.fillRect(-8 - ph, -8, 5, 8); c.fillRect(2 + ph, -8, 5, 8);
  c.fillStyle = "#8a5a32"; rr(c, -17, -22, 34, 15, 6); c.fill();
  c.fillStyle = "#d32f2f"; c.fillRect(-4, -22, 9, 15);
  c.fillStyle = "#ffd800"; c.font = "bold 6px Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("PF", 0, -14);
  c.fillStyle = "#8a5a32"; c.beginPath(); c.ellipse(19, -24, 9, 7.5, 0, 0, TAU); c.fill();
  c.fillStyle = "#5e3a1e"; c.beginPath(); c.moveTo(16, -30); c.lineTo(20, -38); c.lineTo(23, -29); c.fill();
  c.fillStyle = "#c9a37a"; c.beginPath(); c.ellipse(26, -22, 5.5, 3.5, 0, 0, TAU); c.fill();
  c.fillStyle = "#111"; c.beginPath(); c.arc(30, -23, 1.8, 0, TAU); c.arc(20, -26, 1.3, 0, TAU); c.fill();
  c.strokeStyle = "#8a5a32"; c.lineWidth = 3; c.beginPath(); c.moveTo(-17, -19); c.quadraticCurveTo(-26, -26 + ph, -24, -32); c.stroke();
  if (o.stun > 0) { c.scale(-1, 1); c.fillStyle = "#ffe94d"; for (var si = 0; si < 3; si++) { var sa = t * 6 + si * 2.1; c.beginPath(); c.arc(Math.cos(sa) * 11, -40 + Math.sin(sa) * 3, 2.4, 0, TAU); c.fill(); } }
  c.restore();
}
function drawDrone(c, x, y, t, big, o) {
  var s = big ? 2.1 : 1, i;
  c.save(); c.translate(x, y); c.scale(s, s);
  if (o && o.st === "fall") c.rotate(t * 8);
  c.fillStyle = "#1c2238"; rr(c, -18, -8, 36, 15, 6); c.fill();
  c.fillStyle = "#2b3558"; c.fillRect(-26, -3, 52, 4);
  c.fillStyle = "#ffd800"; c.font = "bold 7px Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("PF", 0, -0.5);
  var on = Math.floor(t * 6) % 2 === 0;
  c.fillStyle = on ? "#ff2a2a" : "#3a7aff"; c.beginPath(); c.arc(0, 9, 3.4, 0, TAU); c.fill();
  for (i = -1; i <= 1; i += 2) { c.fillStyle = "#99a3c4"; c.fillRect(i * 26 - 1, -9, 2, 6);
    c.globalAlpha = .55; c.fillStyle = "#cfd8ff"; c.beginPath(); c.ellipse(i * 26, -10, 14 + Math.sin(t * 40 + i) * 2, 2.4, 0, 0, TAU); c.fill(); c.globalAlpha = 1; }
  c.restore();
}
function drawHeli(c, x, y, t, big) {
  var s = big ? 1.5 : 1;
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "#12182c"; c.beginPath(); c.ellipse(0, 0, 44, 18, 0, 0, TAU); c.fill();
  c.fillRect(30, -5, 56, 8); c.fillRect(80, -20, 6, 24);
  c.fillStyle = "#4a6fa8"; c.beginPath(); c.ellipse(-18, -4, 18, 11, 0, Math.PI, 0); c.fill();
  c.fillStyle = "#ffd800"; c.font = "bold 9px Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("POLÍCIA", 6, 4);
  c.fillStyle = "#222c4f"; c.fillRect(-2, -24, 4, 7);
  c.globalAlpha = .45; c.fillStyle = "#cfd8ff"; c.beginPath(); c.ellipse(0, -25, 74, 3.2 + Math.abs(Math.sin(t * 30)) * 1.2, 0, 0, TAU); c.fill(); c.globalAlpha = 1;
  c.strokeStyle = "#222c4f"; c.lineWidth = 2; c.beginPath(); c.moveTo(-26, 22); c.lineTo(26, 22); c.moveTo(-14, 16); c.lineTo(-14, 22); c.moveTo(14, 16); c.lineTo(14, 22); c.stroke();
  var on = Math.floor(t * 6) % 2 === 0; c.fillStyle = on ? "#ff2a2a" : "#3a7aff"; c.beginPath(); c.arc(-40, 6, 3.4, 0, TAU); c.fill();
  c.restore();
}
function drawBigVan(c, x, y, t, o) {
  c.save(); c.translate(x, y); c.scale(-1, 1);
  c.fillStyle = "rgba(0,0,0,.4)"; c.beginPath(); c.ellipse(0, 4, 100, 12, 0, 0, TAU); c.fill();
  c.fillStyle = "#222a3c"; rr(c, -92, -62, 184, 56, 10); c.fill();
  c.fillStyle = "#2c3652"; c.beginPath(); c.moveTo(20, -62); c.lineTo(40, -88); c.lineTo(86, -88); c.lineTo(92, -62); c.closePath(); c.fill();
  c.fillStyle = "#101520"; c.beginPath(); c.moveTo(34, -64); c.lineTo(46, -83); c.lineTo(80, -83); c.lineTo(84, -64); c.closePath(); c.fill();
  c.fillStyle = "#ffd800"; c.fillRect(-92, -34, 184, 4);
  c.save(); c.scale(-1, 1); c.fillStyle = "#ffd800"; c.font = "bold 14px Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("POLÍCIA FEDERAL", 0, -46); c.restore();
  c.fillStyle = "#444b60"; c.fillRect(84, -44, 22, 34);
  for (var i = 0; i < 5; i++) { c.fillStyle = "#59617a"; c.fillRect(88, -42 + i * 7, 18, 3); }
  c.fillStyle = "#111"; c.beginPath(); c.arc(-56, -6, 14, 0, TAU); c.arc(56, -6, 14, 0, TAU); c.fill(); c.fillStyle = "#777"; c.beginPath(); c.arc(-56, -6, 6, 0, TAU); c.arc(56, -6, 6, 0, TAU); c.fill();
  var on = Math.floor(t * 8) % 2 === 0; c.fillStyle = on ? "#ff2a2a" : "#7a1515"; c.fillRect(-18, -72, 18, 8); c.fillStyle = on ? "#1a3a7a" : "#3a7aff"; c.fillRect(2, -72, 18, 8);
  c.restore();
  c.save(); c.globalCompositeOperation = "lighter"; var gl = c.createRadialGradient(x, y - 70, 3, x, y - 70, 90); gl.addColorStop(0, Math.floor(t * 8) % 2 === 0 ? "rgba(255,40,40,.5)" : "rgba(60,110,255,.5)"); gl.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = gl; c.fillRect(x - 90, y - 160, 180, 180); c.restore();
}
function drawPedalinho(c, nx, ny, t) {
  c.fillStyle = "#e7e7ee"; c.beginPath(); c.moveTo(nx - 56, ny - 4); c.lineTo(nx + 56, ny - 4); c.lineTo(nx + 40, ny + 12); c.lineTo(nx - 40, ny + 12); c.closePath(); c.fill();
  c.fillStyle = "#ff7043"; c.fillRect(nx - 50, ny - 2, 100, 4);
  c.fillStyle = "#e7e7ee"; c.beginPath(); c.arc(nx + 52, ny - 14, 12, 0, TAU); c.fill(); c.fillStyle = "#222"; c.beginPath(); c.arc(nx + 56, ny - 17, 2, 0, TAU); c.fill();
  c.fillStyle = "#ff9800"; c.beginPath(); c.moveTo(nx + 62, ny - 14); c.lineTo(nx + 74, ny - 11); c.lineTo(nx + 62, ny - 8); c.fill();
  drawChar(c, "nikolas", nx - 8, ny, 1.15, { t: t, moving: false });
}

function bgSky(c, S, cam, t) {
  var sk = c.createLinearGradient(0, 0, 0, 250); sk.addColorStop(0, S.c[0]); sk.addColorStop(.7, S.c[1]); sk.addColorStop(1, S.c[2]);
  c.fillStyle = sk; c.fillRect(-10, -10, W + 20, 262);
  var i;
  for (i = 0; i < g.stars.length; i++) { var s = g.stars[i]; c.globalAlpha = .45 + .45 * Math.sin(t * 2 + s.p); c.fillStyle = "#fff"; c.fillRect(wrapX(s.x - cam * 0.012, W), s.y, s.r, s.r); }
  c.globalAlpha = 1;
  var mx = 790 - (cam * 0.01) % 40, my = 72 + g.stage * 6;
  c.fillStyle = "#f6f1d0"; c.beginPath(); c.arc(mx, my, 28, 0, TAU); c.fill();
  c.fillStyle = S.c[1]; c.beginPath(); c.arc(mx + 12, my - 6, 25, 0, TAU); c.fill();
  var mg = c.createRadialGradient(mx, my, 20, mx, my, 130); mg.addColorStop(0, "rgba(240,235,200,.2)"); mg.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = mg; c.fillRect(mx - 150, 0, 300, 220);
  // nuvens finas (parallax lento)
  c.fillStyle = "rgba(160,170,220,.07)";
  for (i = 0; i < 5; i++) { var cx = wrapX(i * 260 - cam * 0.03, W + 300) - 100; c.beginPath(); c.ellipse(cx, 60 + (i % 3) * 38, 120, 12, 0, 0, TAU); c.fill(); }
}
function bgRoad(c, cam, t) {
  var i, x;
  // colinas distantes
  c.fillStyle = "#0a1330"; c.beginPath(); c.moveTo(0, 215);
  for (x = 0; x <= W + 40; x += 40) { var wx = x + cam * 0.05; c.lineTo(x, 190 - 28 * hash(Math.floor(wx / 40) % 40) - 14 * Math.sin(wx / 160)); }
  c.lineTo(W + 40, 215); c.closePath(); c.fill();
  // luzes de Foz
  for (i = 0; i < 40; i++) { var lx = wrapX(i * 83 - cam * 0.1, W + 80) - 40; c.fillStyle = "rgba(255,214,120," + (.4 + .4 * hash(i)) + ")"; c.fillRect(lx, 192 + hash(i + 9) * 14, 2, 2); }
  // linha de árvores
  c.fillStyle = "#07151a";
  for (x = -((cam * 0.2) % 36) - 36; x < W + 36; x += 36) { var idx = Math.floor((x + cam * 0.2) / 36), th = 26 + 22 * hash(idx); c.beginPath(); c.moveTo(x, 232); c.lineTo(x + 18, 232 - th); c.lineTo(x + 36, 232); c.fill(); }
  c.fillRect(0, 230, W, 22);
  // placas na estrada
  for (i = 0; i < 3; i++) {
    var k = Math.floor(cam / 1100) + i - 1, sxp = k * 1100 + 540 - cam; if (sxp < -160 || sxp > W + 160) continue;
    c.fillStyle = "#3a4156"; c.fillRect(sxp - 3, 160, 6, 90);
    c.fillStyle = "#0d6b3a"; rr(c, sxp - 80, 130, 160, 40, 4); c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 2; c.stroke();
    txt(c, SIGNS_ROAD[((k % 5) + 5) % 5], sxp, 150, 12, "#fff", "center");
  }
  // jamanta (easter egg)
  if (g.jam) { var jx = g.jam.x; c.fillStyle = "#c62828"; c.fillRect(jx, 208, 70, 34); c.fillStyle = "#37474f"; c.fillRect(jx + 74, 212, 230, 30); c.fillStyle = "#cfd8dc"; c.fillRect(jx + 78, 216, 222, 5);
    c.fillStyle = "#111"; for (i = 0; i < 5; i++) { c.beginPath(); c.arc(jx + 20 + i * 62, 244, 9, 0, TAU); c.fill(); } txt(c, "JAMANTA", jx + 190, 232, 12, "#ffeb3b", "center"); c.save(); c.translate(jx + 36, 196); c.scale(.4, .4); head(c, "lula", { talk: 0 }); c.restore(); c.fillStyle = "#ffe9a0"; c.fillRect(jx - 3, 222, 5, 6); }
}
function bgBridge(c, cam, t) {
  var i, x;
  c.fillStyle = "#0a1330"; c.fillRect(0, 196, W, 8);
  for (i = 0; i < 46; i++) { var lx = wrapX(i * 71 - cam * 0.08, W + 60) - 30; c.fillStyle = "rgba(255,200,120," + (.3 + .5 * hash(i + 3)) + ")"; c.fillRect(lx, 192 + hash(i) * 8, 2, 2 + hash(i + 1) * 4); }
  var rv = c.createLinearGradient(0, 204, 0, 256); rv.addColorStop(0, "#0e2250"); rv.addColorStop(1, "#08122e"); c.fillStyle = rv; c.fillRect(0, 204, W, 52);
  var mx = 790 - (cam * 0.01) % 40; var rg = c.createLinearGradient(0, 204, 0, 252); rg.addColorStop(0, "rgba(240,235,200,.35)"); rg.addColorStop(1, "rgba(240,235,200,0)");
  c.fillStyle = rg; for (i = 0; i < 6; i++) c.fillRect(mx - 16 + Math.sin(t * 2 + i) * 6, 206 + i * 8, 32 - i * 3, 3);
  c.strokeStyle = "rgba(180,200,255,.2)"; c.lineWidth = 1;
  for (i = 0; i < 16; i++) { var rx = wrapX(i * 97 - cam * 0.3, 1000) - 20; c.beginPath(); c.moveTo(rx, 212 + (i % 4) * 10); c.lineTo(rx + 30, 212 + (i % 4) * 10); c.stroke(); }
  // pilones e cabos
  for (i = 0; i < 3; i++) {
    var k = Math.floor(cam * 0.6 / 1500) + i - 1, tx = k * 1500 + 600 - cam * 0.6; if (tx < -400 || tx > W + 400) continue;
    c.fillStyle = "#1b2447"; c.fillRect(tx - 9, 24, 18, 224);
    c.strokeStyle = "rgba(170,200,255,.38)"; c.lineWidth = 1.2;
    for (var j = 1; j <= 7; j++) { c.beginPath(); c.moveTo(tx, 36 + j * 5); c.lineTo(tx - j * 52, 244); c.moveTo(tx, 36 + j * 5); c.lineTo(tx + j * 52, 244); c.stroke(); }
    c.fillStyle = Math.floor(t * 1.5) % 2 ? "#ff3b3b" : "#561010"; c.beginPath(); c.arc(tx, 22, 4, 0, TAU); c.fill();
  }
  // luzes da ponte (guirlanda ao longo do guarda-corpo)
  c.save(); c.globalCompositeOperation = "lighter";
  for (x = -((cam % 56) + 56); x < W + 60; x += 56) { var gi = Math.floor((x + cam) / 56), col = gi % 3 === 0 ? "255,214,120" : gi % 3 === 1 ? "140,200,255" : "255,150,170";
    var gl = c.createRadialGradient(x, 234, 1, x, 234, 22); gl.addColorStop(0, "rgba(" + col + ",.85)"); gl.addColorStop(1, "rgba(" + col + ",0)"); c.fillStyle = gl; c.fillRect(x - 22, 212, 44, 44); }
  c.restore();
  var mist = c.createLinearGradient(0, 180, 0, 250); mist.addColorStop(0, "rgba(160,190,240,0)"); mist.addColorStop(1, "rgba(160,190,240,.2)"); c.fillStyle = mist; c.fillRect(0, 180, W, 70);
}
function bgAduana(c, cam, t) {
  var i, x;
  // prédio da aduana
  for (x = -((cam * 0.35) % 380) - 380; x < W + 380; x += 380) {
    var bi = Math.floor((x + cam * 0.35) / 380);
    c.fillStyle = "#1a1f3d"; c.fillRect(x, 120, 340, 126); c.fillStyle = "#262c52"; c.fillRect(x - 6, 112, 352, 12);
    c.fillStyle = "#74acdf"; c.fillRect(x, 124, 340, 5); c.fillStyle = "#fff"; c.fillRect(x, 129, 340, 4);
    for (i = 0; i < 8; i++) { var lit = hash(bi * 8 + i) > .3; c.fillStyle = lit ? "rgba(255,240,170,.85)" : "#10142a"; c.fillRect(x + 12 + i * 41, 150 + (i % 2) * 38, 26, 22); c.fillRect(x + 12 + i * 41, 202, 26, 22); }
    if (bi % 2 === 0) { c.fillStyle = "#74acdf"; rr(c, x + 70, 90, 200, 28, 4); c.fill(); txt(c, "ADUANA ARGENTINA", x + 170, 105, 15, "#fff", "center"); }
  }
  // bandeiras
  for (i = 0; i < 3; i++) { var k = Math.floor(cam * 0.5 / 700) + i - 1, fx2 = k * 700 + 180 - cam * 0.5; if (fx2 < -80 || fx2 > W + 80) continue;
    c.fillStyle = "#555"; c.fillRect(fx2, 70, 3, 175); drawFlag(c, fx2 + 3, 72, 54, 34, (k % 2 === 0) ? "ar" : "br"); }
  // cabines ao fundo
  for (x = -((cam * 0.8) % 300) - 300; x < W + 300; x += 300) {
    c.fillStyle = "#e5e8f2"; c.fillRect(x + 40, 196, 70, 52); c.fillStyle = "#1b3a8a"; c.fillRect(x + 36, 190, 78, 8);
    c.fillStyle = "rgba(255,244,170,.9)"; c.fillRect(x + 50, 208, 28, 20); txt(c, "PASAPORTES", x + 75, 238, 7, "#1b3a8a", "center");
  }
  // pórtico com luz fluorescente
  c.fillStyle = "#2a2f48"; c.fillRect(0, 0, W, 16);
  c.save(); c.globalCompositeOperation = "lighter";
  for (x = -((cam % 260) + 260); x < W + 260; x += 260) { c.fillStyle = "rgba(220,240,255,.9)"; c.fillRect(x, 14, 110, 4); var gl = c.createLinearGradient(0, 16, 0, 120); gl.addColorStop(0, "rgba(200,230,255,.28)"); gl.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = gl; c.fillRect(x - 20, 16, 150, 110); }
  c.restore();
}
function bgAirport(c, cam, t) {
  var i, x;
  var hg = c.createLinearGradient(0, 120, 0, 250); hg.addColorStop(0, "rgba(255,150,60,0)"); hg.addColorStop(1, "rgba(255,150,60,.2)"); c.fillStyle = hg; c.fillRect(0, 120, W, 130);
  // torre
  var tx = 640 - ((cam * 0.18) % 1400); for (var q = 0; q < 2; q++) { var tt = tx + q * 1400; if (tt < -100 || tt > W + 100) continue;
    c.fillStyle = "#101a38"; c.fillRect(tt - 7, 80, 14, 160); c.fillStyle = "#1c2a55"; c.beginPath(); c.moveTo(tt - 30, 80); c.lineTo(tt + 30, 80); c.lineTo(tt + 22, 52); c.lineTo(tt - 22, 52); c.closePath(); c.fill();
    c.fillStyle = "rgba(255,240,160,.85)"; c.fillRect(tt - 20, 58, 40, 14);
    var ba = t * 2; c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = "rgba(120,255,160,.25)"; c.beginPath(); c.moveTo(tt, 50); c.lineTo(tt + Math.cos(ba) * 260, 50 + Math.sin(ba) * 18 - 40); c.lineTo(tt + Math.cos(ba) * 260, 50 + Math.sin(ba) * 18 - 20); c.fill(); c.restore(); }
  // hangares + aviões ao fundo
  for (x = -((cam * 0.3) % 520) - 520; x < W + 520; x += 520) {
    var hi = Math.floor((x + cam * 0.3) / 520);
    c.fillStyle = "#0c1431"; c.beginPath(); c.moveTo(x, 232); c.lineTo(x, 190); c.quadraticCurveTo(x + 90, 160, x + 180, 190); c.lineTo(x + 180, 232); c.fill();
    c.fillStyle = "rgba(255,230,150,.6)"; c.fillRect(x + 60, 200, 60, 26);
    if (hi % 2 === 0) { c.fillStyle = "#141d3d"; c.beginPath(); c.ellipse(x + 330, 222, 70, 11, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(x + 275, 214); c.lineTo(x + 262, 184); c.lineTo(x + 280, 184); c.lineTo(x + 305, 214); c.fill(); c.fillRect(x + 310, 222, 50, 4); }
  }
  // luzes de pista (borda)
  c.save(); c.globalCompositeOperation = "lighter";
  for (x = -((cam % 48) + 48); x < W + 48; x += 48) { var gi = Math.floor((x + cam) / 48), on = (Math.floor(t * 8) + gi) % 8 === 0;
    var gl = c.createRadialGradient(x, 246, 1, x, 246, on ? 24 : 14); gl.addColorStop(0, on ? "rgba(255,255,255,.95)" : "rgba(90,150,255,.8)"); gl.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = gl; c.fillRect(x - 24, 222, 48, 48); }
  c.restore();
  var fog = c.createLinearGradient(0, 190, 0, 252); fog.addColorStop(0, "rgba(150,170,220,0)"); fog.addColorStop(1, "rgba(150,170,220,.22)"); c.fillStyle = fog; c.fillRect(0, 190, W, 62);
}

function drawFlavioWorld(c) {
  var S = STAGES[g.stage], cam = g.cam, t = g.anim, L = S.len, i, x, k, th = S.theme;
  var sx = 0, sy = 0; if (fx.shk > 0.2) { sx = rnd(-fx.shk, fx.shk) * .6; sy = rnd(-fx.shk, fx.shk) * .6; }
  c.save(); c.translate(sx, sy);
  bgSky(c, S, cam, t);
  if (th === "road") bgRoad(c, cam, t); else if (th === "bridge") bgBridge(c, cam, t); else if (th === "aduana") bgAduana(c, cam, t); else bgAirport(c, cam, t);
  // guarda-corpo traseiro
  if (th !== "airport") {
    c.fillStyle = "#6b7391"; c.fillRect(0, 248, W, 5); c.fillStyle = "#454c68"; for (x = -((cam % 60) + 60); x < W + 60; x += 60) c.fillRect(x, 238, 4, 20);
    c.fillStyle = "#8a92b0"; c.fillRect(0, 236, W, 3);
  }
  // postes
  if (th === "road" || th === "airport") {
    c.save(); c.globalCompositeOperation = "lighter";
    for (x = -(((cam % 400) + 400) % 400); x < W + 200; x += 400) { var lg = c.createRadialGradient(x, 262, 4, x, 262, 190); lg.addColorStop(0, "rgba(255,230,150,.3)"); lg.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = lg; c.fillRect(x - 190, 120, 380, 380); }
    c.restore();
    c.fillStyle = "#2a2f48"; for (x = -(((cam % 400) + 400) % 400); x < W + 200; x += 400) { c.fillRect(x - 3, 150, 6, 100); c.fillRect(x - 3, 150, 26, 5); c.fillStyle = "#ffe9a0"; c.fillRect(x + 14, 154, 12, 4); c.fillStyle = "#2a2f48"; }
  }
  // pista
  var dk = c.createLinearGradient(0, 253, 0, 500);
  if (th === "bridge") { dk.addColorStop(0, "#343a52"); dk.addColorStop(1, "#272c40"); } else if (th === "aduana") { dk.addColorStop(0, "#3a3e55"); dk.addColorStop(1, "#2b2f44"); } else if (th === "airport") { dk.addColorStop(0, "#232733"); dk.addColorStop(1, "#171a24"); } else { dk.addColorStop(0, "#2d303c"); dk.addColorStop(1, "#23262f"); }
  c.fillStyle = dk; c.fillRect(0, 253, W, 247); c.fillStyle = "#3b3f4e"; c.fillRect(0, 253, W, 8);
  c.fillStyle = "#cfd3e2"; c.fillRect(0, 266, W, 2); c.fillRect(0, 488, W, 2);
  if (th === "bridge") { c.fillStyle = "rgba(0,0,0,.25)"; for (x = -((cam % 170) + 170); x < W + 170; x += 170) c.fillRect(x, 268, 3, 220); }
  if (th === "airport") { c.fillStyle = "#e7c92d"; c.fillRect(0, 374, W, 4); c.fillStyle = "rgba(255,255,255,.5)"; for (x = -(((cam % 700) + 700) % 700); x < W + 700; x += 700) txt(c, "27R", x + 100, 440, 40, "rgba(255,255,255,.35)", "center"); }
  else if (th === "aduana") { c.fillStyle = "#e7c92d"; for (x = -(((cam % 80) + 80) % 80); x < W; x += 80) c.fillRect(x, 375, 44, 4); for (x = -(((cam % 900) + 900) % 900); x < W + 900; x += 900) txt(c, "PARE · DOCUMENTOS", x + 300, 440, 22, "rgba(255,255,255,.28)", "center"); }
  else { c.fillStyle = "#e7c92d"; for (x = -(((cam % 80) + 80) % 80); x < W; x += 80) c.fillRect(x, 375, 44, 4); }
  // checkpoint (meio) e chegada de cenário
  if (!g.boss) {
    var cpx = L * .5 - cam;
    if (cpx > -80 && cpx < W + 80) { c.fillStyle = g.cp.half ? "#69f0ae" : "rgba(255,255,255,.5)"; c.fillRect(cpx - 3, 150, 6, 100); c.fillStyle = g.cp.half ? "#1b5e20" : "#3a4156"; c.fillRect(cpx, 150, 78, 28); txt(c, "CHECKPOINT", cpx + 39, 164, 10, "#fff", "center"); c.fillStyle = "rgba(105,240,174,.18)"; c.fillRect(cpx - 6, 266, 12, 224); }
  }
  // sprites ordenados por y
  var list = [], o, it;
  for (i = 0; i < g.obs.length; i++) { o = g.obs[i]; if (o.dead) continue;
    if (o.t === "drone" || o.t === "spot") continue;
    var ox = o.x - cam; if (o.t === "car" && !o.on) continue; if (ox < -140 || ox > W + 140) continue; list.push({ y: o.t === "gate" ? 300 : o.y, o: o }); }
  list.push({ y: g.py, pl: true });
  if (g.jetX && g.jetX - cam < W + 400) list.push({ y: 340, jet: true });
  list.sort(function (a, b) { return a.y - b.y; });
  // itens
  for (i = 0; i < g.items.length; i++) {
    it = g.items[i]; if (it.got) continue; var ix = it.x - cam; if (ix < -40 || ix > W + 40) continue;
    var bob = Math.sin(t * 4 + it.x) * 3, iy = it.y - 20 + bob;
    c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(ix, it.y + 4, 9, 3, 0, 0, TAU); c.fill();
    if (it.t === "coin") { c.fillStyle = "#ffd800"; c.beginPath(); c.arc(ix, iy, 9, 0, TAU); c.fill(); c.strokeStyle = "#b58900"; c.lineWidth = 2; c.stroke(); txt(c, "R$", ix, iy + 1, 9, "#7a5c00", "center"); }
    else if (it.t === "pix") { var pg0 = c.createRadialGradient(ix, iy, 3, ix, iy, 26); pg0.addColorStop(0, "rgba(105,240,174,.7)"); pg0.addColorStop(1, "rgba(105,240,174,0)"); c.fillStyle = pg0; c.fillRect(ix - 26, iy - 26, 52, 52);
      c.fillStyle = "#00c853"; rr(c, ix - 12, iy - 12, 24, 24, 5); c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 1.5; c.stroke(); txt(c, "PIX", ix, iy + 1, 9, "#fff", "center"); }
    else if (it.t === "cafe") { c.fillStyle = "#fff"; rr(c, ix - 8, iy - 8, 15, 15, 3); c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 2; c.beginPath(); c.arc(ix + 8, iy, 4, -1.4, 1.4); c.stroke(); c.fillStyle = "#5a3418"; c.fillRect(ix - 6, iy - 6, 11, 4);
      c.strokeStyle = "rgba(255,255,255,.6)"; c.beginPath(); c.moveTo(ix - 2, iy - 11); c.quadraticCurveTo(ix + 2, iy - 15, ix - 1, iy - 19); c.stroke(); }
    else { var pg = c.createRadialGradient(ix, iy, 4, ix, iy, 30); pg.addColorStop(0, "rgba(255,223,0,.6)"); pg.addColorStop(1, "rgba(255,223,0,0)"); c.fillStyle = pg; c.fillRect(ix - 30, iy - 30, 60, 60);
      c.fillStyle = "#1b3a8a"; rr(c, ix - 11, iy - 14, 22, 28, 3); c.fill(); c.strokeStyle = "#ffdf00"; c.lineWidth = 1.5; c.stroke(); c.fillStyle = "#ffdf00"; c.beginPath(); c.arc(ix, iy - 3, 5, 0, TAU); c.fill();
      txt(c, "PASSAPORTE", ix, iy + 9, 5.5, "#ffdf00", "center"); txt(c, "?", ix, iy - 3, 8, "#1b3a8a", "center"); }
  }
  for (i = 0; i < list.length; i++) {
    var e = list[i];
    if (e.pl) {
      var blink = g.inv > 0 && Math.floor(g.anim * 14) % 2 === 0;
      if (g.finish) { if (g.finish.t < .6) drawChar(c, "flavio", 300 + g.finish.t * 120, g.py, 1.0, { t: g.anim, moving: true }); }
      else if (!blink && !(g.trans && g.trans.k === "respawn" && g.trans.t > .2 && g.trans.t < .8)) {
        if (g.boost > 0) { c.globalAlpha = .3; drawChar(c, "flavio", 274, g.py, 1, { t: g.anim - .05, moving: true, cap: g.disg > 0 }); c.globalAlpha = .2; drawChar(c, "flavio", 250, g.py, 1, { t: g.anim - .1, moving: true, cap: g.disg > 0 }); c.globalAlpha = 1; }
        drawChar(c, "flavio", 300, g.py, 1.0, { t: g.anim, moving: !g.trans, cap: g.disg > 0 });
        if (g.shield > 0) { var sa = g.shield < 1 ? (Math.floor(g.anim * 16) % 2 ? .3 : .8) : .85; c.save(); c.globalAlpha = sa; c.strokeStyle = "#ffe082"; c.lineWidth = 3; c.fillStyle = "rgba(143,208,255,.2)"; c.beginPath(); c.ellipse(300, g.py - 32, 30, 40, 0, 0, TAU); c.fill(); c.stroke();
          c.fillStyle = "#1b3a8a"; c.fillRect(318, g.py - 70, 14, 18); c.fillStyle = "#ffdf00"; c.fillRect(324, g.py - 67, 2, 12); c.fillRect(321, g.py - 62, 8, 2); c.restore(); }
        if (g.disg > 0) { c.fillStyle = "rgba(239,154,154," + (.35 + .2 * Math.sin(g.anim * 10)) + ")"; txt(c, "?", 300, g.py - 82, 16, "#ef9a9a", "center", "rgba(0,0,0,.6)"); }
      }
      if (g.quip && !g.finish) balloon(c, g.quip.s, 300, g.py - 78, { size: 13, maxW: 130 });
    } else if (e.jet) {
      var jx = g.jetX + 110 - cam + (g.finish ? g.finish.jx : 0), jy = 346 - (g.finish ? Math.max(0, g.finish.jx - 200) * 0.12 : 0);
      drawJet(c, jx, jy);
      if (!g.finish) { c.fillStyle = "#cdd2e0"; c.beginPath(); c.moveTo(jx - 66, 346); c.lineTo(jx - 44, 346); c.lineTo(jx - 44, 322); c.lineTo(jx - 52, 322); c.fill(); txt(c, "JATINHO →", jx - 60, 300, 14, "#ffdf00", "center", "#000"); }
    } else {
      o = e.o; var px = o.x - cam;
      if (o.t === "agent") drawChar(c, "agent", px, o.y, 1.0, { t: g.anim + o.ph, moving: o.amp > 0 && o.stun <= 0, skin: o.skin, flip: true, stun: o.stun > 0 });
      else if (o.t === "car") { drawCar(c, px, o.y, -1, g.anim); if (o.stun > 0) { c.fillStyle = "#ffe94d"; for (k = 0; k < 3; k++) { var sa2 = g.anim * 6 + k * 2.1; c.beginPath(); c.arc(px + Math.cos(sa2) * 26, o.y - 56 + Math.sin(sa2) * 4, 3, 0, TAU); c.fill(); } } }
      else if (o.t === "dog") { if (o.on) drawDog(c, px, o.y, g.anim, o); }
      else if (o.t === "gate") {
        var rs = gateRects(o);
        for (k = 0; k < 2; k++) {
          var y0 = rs[k][1], h = rs[k][3] - rs[k][1], hw = o.hw;
          c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(px - hw + 4, y0 + 8, hw * 2, h);
          c.fillStyle = "#e8e8ee"; c.fillRect(px - hw, y0 - 6, hw * 2, h + 6);
          c.fillStyle = o.kind === "cancela" ? "#ffb300" : "#e53935"; for (var yy = y0 - 6; yy < y0 + h; yy += 22) c.fillRect(px - hw, yy + 11, hw * 2, 11);
          c.fillStyle = "#222"; c.fillRect(px - hw, y0 - 8, hw * 2, 3);
          if (o.kind === "cancela") { c.fillStyle = Math.floor(g.anim * 4) % 2 ? "#ff3b3b" : "#611"; c.beginPath(); c.arc(px, k === 0 ? rs[0][3] + 4 : rs[1][1] - 4, 5, 0, TAU); c.fill(); }
        }
      }
    }
  }
  // aviso de viatura chegando (setas à direita)
  for (i = 0; i < g.obs.length; i++) { o = g.obs[i]; if (o.t === "car" && o.on && o.stun <= 0 && o.x - cam > W + 40 && o.x - cam < W + 900 && Math.floor(g.anim * 8) % 2 === 0) {
    c.fillStyle = "rgba(255,70,70,.9)"; c.beginPath(); c.moveTo(W - 14, o.y - 18); c.lineTo(W - 34, o.y - 30); c.lineTo(W - 34, o.y - 6); c.fill(); } }
  // drones (voam acima da pista, com mira no chão)
  for (i = 0; i < g.obs.length; i++) { o = g.obs[i]; if (o.t !== "drone" || !o.on || o.dead) continue;
    c.fillStyle = "rgba(0,0,0,.28)"; c.beginPath(); c.ellipse(o.sx, o.y + 2, 20, 5, 0, 0, TAU); c.fill();
    drawDrone(c, o.sx, o.y - 62 + Math.sin(g.anim * 5 + i) * 3 + (o.fy || 0), g.anim, false, o);
    if (o.stun > 0 && o.st !== "fall") popup0(c, o.sx, o.y - 90); }
  // zonas de ataque (laser, carimbo, ramming, mandado)
  for (i = 0; i < g.zones.length; i++) drawZone(c, g.zones[i]);
  // projéteis
  for (i = 0; i < g.proj.length; i++) {
    var p = g.proj[i], pxs = p.x - cam;
    if (p.k === "gest") {
      c.save(); c.globalCompositeOperation = "lighter"; var tg = c.createLinearGradient(pxs - 70, 0, pxs, 0); tg.addColorStop(0, "rgba(255,245,157,0)"); tg.addColorStop(1, "rgba(255,245,157,.8)"); c.fillStyle = tg; c.fillRect(pxs - 70, p.y - 38, 70, 5); c.restore();
      c.fillStyle = "#fff59d"; c.beginPath(); for (k = 0; k < 10; k++) { var rr2 = k % 2 ? 4 : 9, aa = k / 10 * TAU + p.t * 10; c.lineTo(pxs + Math.cos(aa) * rr2, p.y - 36 + Math.sin(aa) * rr2); } c.closePath(); c.fill();
    } else {
      c.save(); c.translate(pxs, p.y - 38); c.rotate(p.rot); c.fillStyle = "#fff"; c.fillRect(-18, -11, 36, 22); c.strokeStyle = "#c62828"; c.lineWidth = 2; c.strokeRect(-18, -11, 36, 22);
      c.fillStyle = "#c62828"; c.font = "bold 8px Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("FORA PT", 0, 0); c.restore();
    }
  }
  // chefe
  if (g.boss) drawBoss(c);
  // spots/holofotes (aditivo)
  for (i = 0; i < g.obs.length; i++) { o = g.obs[i]; if (o.t === "spot" && !o.dead && o.trig == null) drawSpot(c, o); }
  drawParts(c);
  // Nikolas no pedalinho
  if (g.nik) {
    var nk = g.nik, slide = clamp(nk.t / .5, 0, 1), nx = W - 110 + (1 - slide) * 200 - clamp((nk.t - 4.8) / .8, 0, 1) * 260, ny = 236 + Math.sin(t * 2) * 2;
    drawPedalinho(c, nx, ny, t);
  }
  if (g.cameo) {   // cameo sem voz: cartão de retrato + balão
    var cm = g.cameo, cs = clamp(cm.t / .45, 0, 1), cx2 = W - 150 + (1 - ease(cs)) * 200 - clamp((cm.t - 4.6) / .6, 0, 1) * 220, cy2 = 214;
    portraitCard(c, "campopiano", cx2, cy2, 110, 110, { r: 14, name: true });
    balloon(c, "Fila grande hoje, hein?", cx2 + 55, cy2 - 4, { size: 13, maxW: 130 });
  }
  // guarda-corpo da frente + água
  c.fillStyle = "#4b5270"; c.fillRect(0, 494, W, 6); c.fillStyle = "#8a92b0"; c.fillRect(0, 500, W, 3);
  c.fillStyle = th === "airport" ? "#0a0e1c" : "#07102a"; c.fillRect(0, 503, W, 40);
  c.strokeStyle = "rgba(160,190,255,.15)"; for (i = 0; i < 10; i++) { var wx2 = wrapX(i * 130 - cam * .8, 1200) - 100; c.beginPath(); c.moveTo(wx2, 512 + (i % 3) * 8); c.lineTo(wx2 + 50, 512 + (i % 3) * 8); c.stroke(); }
  drawPops(c);
  c.restore();
  // linhas de velocidade
  var spd = clamp(.12 + g.stage * .05 + (g.boost > 0 ? .4 : 0) + (g.slow > 0 ? -.1 : 0), 0, .7);
  c.save(); c.strokeStyle = "rgba(220,230,255," + spd.toFixed(2) + ")"; c.lineWidth = 1.5;
  for (i = 0; i < 18; i++) { var lx2 = wrapX(i * 173 - cam * (1.7 + (i % 3) * .5), W + 220) - 110, ly2 = 270 + hash(i) * 215, ln = 40 + hash(i + 5) * 90; c.beginPath(); c.moveTo(lx2, ly2); c.lineTo(lx2 + ln, ly2); c.stroke(); }
  c.restore();
  // sirene (luzes vermelhas/azuis nas bordas)
  var near = 0; for (i = 0; i < g.obs.length; i++) { o = g.obs[i]; if (!o.dead && (o.t === "car" && o.on && o.x - cam < W + 400 || o.t === "spot" || o.t === "drone" && o.on)) near = 1; }
  if (g.boss && !g.boss.dead && (g.boss.k === "comboio" || g.boss.k === "heli")) near = 1;
  g.sirenT = lerp(g.sirenT, near, .06);
  if (g.sirenT > .03) {
    var on = Math.floor(g.anim * 4) % 2 === 0, sa3 = g.sirenT * .22;
    c.save(); c.globalCompositeOperation = "lighter";
    var sg = c.createLinearGradient(0, 0, 230, 0); sg.addColorStop(0, on ? "rgba(255,30,30," + sa3 + ")" : "rgba(40,90,255," + sa3 + ")"); sg.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = sg; c.fillRect(0, 0, 230, H);
    var sg2 = c.createLinearGradient(W, 0, W - 230, 0); sg2.addColorStop(0, on ? "rgba(40,90,255," + sa3 + ")" : "rgba(255,30,30," + sa3 + ")"); sg2.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = sg2; c.fillRect(W - 230, 0, 230, H);
    c.restore();
  }
  // vinheta + flash
  var vg = c.createRadialGradient(W / 2, H / 2, 260, W / 2, H / 2, 640); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,10,.5)"); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  if (g.slow > 0 && fx.ts < .5) { c.fillStyle = "rgba(120,200,255,.07)"; c.fillRect(0, 0, W, H); }
  if (fx.flash > 0) { c.fillStyle = "rgba(" + fx.fcol + "," + fx.flash.toFixed(2) + ")"; c.fillRect(0, 0, W, H); }
  // selo do passaporte
  if (g.stamp) {
    var st = g.stamp.t, a = st > 2.0 ? 1 - (st - 2.0) / .6 : 1;
    c.save(); c.globalAlpha = a; c.translate(W / 2, 285);
    var pop = clamp(st / .3, 0, 1); c.scale((.6 + .4 * pop) * .8, (.6 + .4 * pop) * .8);
    c.fillStyle = "#1b3a8a"; rr(c, -90, -120, 180, 240, 10); c.fill(); c.strokeStyle = "#ffdf00"; c.lineWidth = 4; c.stroke();
    c.fillStyle = "#ffdf00"; c.beginPath(); c.arc(0, -40, 34, 0, TAU); c.fill(); c.fillStyle = "#1b3a8a"; c.beginPath(); c.arc(0, -40, 26, 0, TAU); c.fill();
    c.fillStyle = "#ffdf00"; c.beginPath(); c.moveTo(0, -62); c.lineTo(20, -40); c.lineTo(0, -18); c.lineTo(-20, -40); c.fill();
    txt(c, "REPÚBLICA", 0, 22, 15, "#ffdf00", "center"); txt(c, "FEDERATIVA DO BRASIL", 0, 40, 11, "#ffdf00", "center"); txt(c, "PASSAPORTE", 0, 88, 20, "#ffdf00", "center");
    if (st > .8) { var sp2 = clamp((st - .8) / .22, 0, 1), sc = 3 - 2 * sp2;
      c.save(); c.translate(0, 8); c.rotate(-0.25); c.scale(sc, sc); c.globalAlpha = a * (.3 + .7 * sp2); c.strokeStyle = "#e53935"; c.lineWidth = 6; c.strokeRect(-130, -36, 260, 72); c.lineWidth = 2; c.strokeRect(-122, -29, 244, 58);
      txt(c, g.stamp.again ? "CANCELADO DE NOVO" : "CANCELADO", 0, 2, g.stamp.again ? 28 : 44, "#e53935", "center"); c.restore(); }
    c.restore();
  }
  // ligação pro Trump
  if (g.call) {
    var ct = g.call.t, ca = ct > 1.4 ? 1 - (ct - 1.4) / .4 : 1;
    c.save(); c.globalAlpha = clamp(ca, 0, 1); c.translate(W / 2, 170 + Math.sin(ct * 30) * (ct < .5 ? 2 : 0));
    c.fillStyle = "#0b1230"; rr(c, -170, -46, 340, 92, 14); c.fill(); c.strokeStyle = "#ffdf00"; c.lineWidth = 3; c.stroke();
    txt(c, "📞 Ligando pro Trump…", 0, -20, 20, "#ffdf00", "center"); txt(c, ct > .6 ? "“Alô, Donald? Revoga os vistos!”" : "tu... tu... tu...", 0, 16, 16, "#fff", "center");
    c.restore();
  }
}
function popup0() {}
function drawZone(c, z) {
  var pulse = .5 + .5 * Math.sin(g.anim * 18), live = z.tele <= 0;
  c.save();
  if (z.sh === "circ") {
    if (!live) { c.globalAlpha = .25 + .2 * pulse; c.fillStyle = z.col; c.beginPath(); c.arc(z.cx, z.cy, z.r, 0, TAU); c.fill(); c.globalAlpha = 1; c.strokeStyle = "#ffcdd2"; c.lineWidth = 2; c.setLineDash([6, 5]); c.beginPath(); c.arc(z.cx, z.cy, z.r * (1 - clamp(z.tele, 0, 1) * .15), 0, TAU); c.stroke(); txt(c, "MANDADO", z.cx, z.cy, 11, "#fff", "center", "rgba(0,0,0,.6)"); }
    else { var gg = c.createRadialGradient(z.cx, z.cy, 4, z.cx, z.cy, z.r * 1.2); gg.addColorStop(0, "rgba(255,255,255,.95)"); gg.addColorStop(1, "rgba(255,120,60,0)"); c.fillStyle = gg; c.beginPath(); c.arc(z.cx, z.cy, z.r * 1.2, 0, TAU); c.fill(); }
  } else {
    var w = z.x1 - z.x0, h = z.y1 - z.y0;
    if (!live) { c.globalAlpha = .16 + .16 * pulse; c.fillStyle = z.col; c.fillRect(z.x0, z.y0, w, h); c.globalAlpha = .9; c.strokeStyle = "#ff8a80"; c.lineWidth = 2; c.setLineDash([10, 6]); c.strokeRect(z.x0, z.y0, w, h);
      c.setLineDash([]); c.fillStyle = "#ff8a80"; c.font = "bold 18px Arial"; c.textAlign = "center"; c.textBaseline = "middle"; if (h > 24) c.fillText("!", (z.x0 + z.x1) / 2, (z.y0 + z.y1) / 2); }
    else { c.globalCompositeOperation = "lighter"; var lg = c.createLinearGradient(0, z.y0, 0, z.y1); lg.addColorStop(0, "rgba(255,80,80,.55)"); lg.addColorStop(.5, "rgba(255,255,255,.95)"); lg.addColorStop(1, "rgba(255,80,80,.55)"); c.fillStyle = lg; c.fillRect(z.x0, z.y0, w, h); }
  }
  c.restore();
}
function drawSpot(c, o) {
  c.save(); c.globalCompositeOperation = "lighter";
  var hx = o.sx + 90, hy = 46, gr = c.createLinearGradient(0, hy, 0, o.sy);
  gr.addColorStop(0, "rgba(255,255,220,.05)"); gr.addColorStop(1, "rgba(255,255,220," + (.18 + o.alert * .3) + ")");
  c.fillStyle = gr; c.beginPath(); c.moveTo(hx - 6, hy); c.lineTo(hx + 6, hy); c.lineTo(o.sx + o.r, o.sy); c.lineTo(o.sx - o.r, o.sy); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(o.sx, o.sy, o.r, o.r * .62, 0, 0, TAU); var eg = c.createRadialGradient(o.sx, o.sy, 4, o.sx, o.sy, o.r); eg.addColorStop(0, "rgba(255,255,230," + (.55 + o.alert * .3) + ")"); eg.addColorStop(1, "rgba(255,255,200,.12)"); c.fillStyle = eg; c.fill();
  c.restore();
  c.strokeStyle = o.alert > .5 ? "#ff5252" : "#fff59d"; c.lineWidth = 3; c.beginPath(); c.arc(o.sx, o.sy, 12, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(o.alert, 0, 1)); c.stroke();
  if (!g.boss) drawHeli(c, hx, hy, g.anim, false);
}
function drawBoss(c) {
  var b = g.boss, t = g.anim; if (b.dead > 1.4) return;
  c.save();
  if (b.dead) c.globalAlpha = clamp(1 - b.dead / 1.4, 0, 1);
  if (b.hurt > 0 && Math.floor(t * 30) % 2 === 0) c.globalAlpha *= .6;
  if (b.k === "comboio") { drawBigVan(c, b.sx, b.y, t, b); if (b.ph === "rest") { c.fillStyle = "#ffe94d"; for (var si = 0; si < 3; si++) { var sa = t * 6 + si * 2.1; c.beginPath(); c.arc(b.sx + Math.cos(sa) * 50, b.y - 100 + Math.sin(sa) * 6, 4, 0, TAU); c.fill(); } txt(c, "CANSADO! ATIRE!", b.sx, b.y - 124, 13, "#ffe94d", "center", "#000"); } }
  else if (b.k === "dronemae") { c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(b.sx, b.y + 2, 60, 9, 0, 0, TAU); c.fill(); drawDrone(c, b.sx, b.y - 96 + Math.sin(t * 3) * 4, t, true, null); }
  else if (b.k === "carimbo") {
    drawChar(c, "agent", b.sx, b.y + 6, 3.3, { t: t, moving: false, skin: "#c98e68", flip: true });
    var xs = b.xs; if (b.ph === "wait" && b.xs) { var lift = g.zones.length && g.zones[0].tele > 0 ? 1 - clamp(g.zones[0].tele / 1.1, 0, 1) : 1, sy = lerp(60, 250, lift * lift);
      c.fillStyle = "#555"; c.fillRect(xs - 9, 0, 18, sy - 30); c.fillStyle = "#b71c1c"; rr(c, xs - 60, sy - 30, 120, 34, 6); c.fill(); c.fillStyle = "#fff"; c.font = "bold 14px Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("CARIMBADO", xs, sy - 12); }
  }
  else if (b.k === "heli") { drawHeli(c, b.sx, 178, t, true); }
  c.restore();
  // barra de vida do chefe
  if (!b.dead) {
    var bw = 320, bx = W / 2 - bw / 2, by = 128, vis = clamp(b.intro > 0 ? 1 - b.intro / 2.6 : 1, 0, 1);
    c.save(); c.globalAlpha = vis; c.fillStyle = "rgba(0,0,0,.6)"; rr(c, bx - 6, by - 14, bw + 12, 30, 8); c.fill();
    c.fillStyle = "#3b1515"; rr(c, bx, by, bw, 10, 5); c.fill(); c.fillStyle = b.hp < 35 ? "#ff7043" : "#e53935"; rr(c, bx, by, Math.max(6, bw * b.hp / 100), 10, 5); c.fill();
    txt(c, b.name, W / 2, by - 6, 11, "#ffcdd2", "center"); c.restore();
  }
}

/* ============================ MODO MORAES ============================ */
var MP = { W: 1656, H: 1100 };
var DIRS = ["LESTE", "SUDESTE", "SUL", "SUDOESTE", "OESTE", "NOROESTE", "NORTE", "NORDESTE"];
var SIGNS = ["Padaria do Zé", "Churrascaria", "Cartório", "Casa do Primo", "Pastelaria", "Lan House", "Farmácia", "Banca de Jornal", "Barbearia", "Mercadinho", "Posto Ipiranga?", "Hotel Fronteira"];
var ROOFS = ["#c96a4a", "#6a8fc9", "#c9b04a", "#8a6ac9", "#4aa88f", "#c9576f", "#9aa4b8", "#d28b3a"];
var ROUNDS = [
  { name: "Centro de Foz", map: "city", limit: 50, fsp: 165, fz: 3.0, decoys: 4, npcs: 22, pw: [], intro: "Ache o Flávio entre os primos! Duas pegadas por rodada." },
  { name: "Ponte Tancredo Neves", map: "bridge", limit: 50, fsp: 180, fz: 2.7, decoys: 5, npcs: 14, pw: ["cartaz", "bone"], intro: "Trânsito na ponte! Flávio usa cartaz e boné." },
  { name: "Aduana argentina", map: "aduana", limit: 48, fsp: 194, fz: 2.4, decoys: 6, npcs: 16, pw: ["cartaz", "bone", "biblia"], intro: "Cancelas abrem e fecham. Bíblia protege o Flávio." },
  { name: "Pista do jatinho", map: "airport", limit: 46, fsp: 206, fz: 2.1, decoys: 7, npcs: 10, pw: ["cartaz", "bone", "biblia", "arminha"], intro: "Último fôlego! Ele não tá de brincadeira." }
];
var MPOW = [
  { n: "canetada", lab: "Canetada", cost: 22, cd: 1.2, ic: "🖋" },
  { n: "toga", lab: "Toga", cost: 18, cd: 2.5, ic: "🥋" },
  { n: "bloqueio", lab: "Bloq. X", cost: 35, cd: 15, ic: "🚫" },
  { n: "inquerito", lab: "Inquérito", cost: 20, cd: 4, ic: "📚" }
];

function rectsHit(x, y, r) {
  for (var i = 0; i < g.rects.length; i++) { var rc = g.rects[i]; if (rc.open) continue; if (x + r > rc.x && x - r < rc.x + rc.w && y + r > rc.y && y - r < rc.y + rc.h) return true; }
  return false;
}
function freePoint(margin, far) {
  var best = null, bd = -1;
  for (var k = 0; k < (far ? 40 : 30); k++) {
    var x = rnd(60, MP.W - 60), y = rnd(60, MP.H - 60);
    if (rectsHit(x, y, margin || 26)) continue;
    if (!far) return { x: x, y: y };
    var d = Math.hypot(x - far.x, y - far.y); if (d > bd) { bd = d; best = { x: x, y: y }; }
  }
  return best || { x: MP.W / 2, y: MP.H / 2 };
}
function addRect(x, y, w, h, kind, extra) { var r = { x: x, y: y, w: w, h: h, kind: kind || "bld", col: pick(ROOFS), sign: pick(SIGNS) }; if (extra) for (var k in extra) r[k] = extra[k]; g.rects.push(r); return r; }
function buildMap(kind) {
  g.rects = []; g.parks = []; g.cars = []; g.stacks = []; g.projs = []; g.decor = [];
  var i, j, x, y, tries;
  if (kind === "city") {
    var S = 76, C = 5, R = 4, bw = 240, bh = 180; MP.W = S + C * (bw + S); MP.H = S + R * (bh + S);
    for (j = 0; j < R; j++) for (i = 0; i < C; i++) {
      x = S + i * (bw + S); y = S + j * (bh + S);
      if ((i === 2 && j === 1) || (i === 3 && j === 2) || (i === 1 && j === 3)) g.parks.push({ x: x, y: y, w: bw, h: bh });
      else addRect(x + 4, y + 4, bw - 8, bh - 8, "bld");
    }
  } else if (kind === "bridge") {
    MP.W = 2400; MP.H = 640;
    addRect(0, 0, MP.W, 66, "rail"); addRect(0, MP.H - 66, MP.W, 66, "rail");
    for (i = 0; i < 16; i++) { var bw2 = rint(90, 190), bh2 = rint(26, 40); tries = 0;
      do { x = rnd(300, MP.W - 300 - bw2); y = rnd(110, MP.H - 110 - bh2); tries++; } while (tries < 20 && rectsHit(x + bw2 / 2, y + bh2 / 2, Math.max(bw2, 90) * .7 + 40));
      addRect(x, y, bw2, bh2, "barrier"); }
    var lanes = [150, 250, 390, 490];
    lanes.forEach(function (ly, k) { g.cars.push({ x: rnd(200, MP.W - 200), y: ly, vx: (k % 2 ? -1 : 1) * rnd(130, 190), w: 88, h: 34, col: pick(["#e9edf5", "#d95b5b", "#5b8fd9", "#e0c050"]), hit: 0 }); });
    g.cars.push({ x: rnd(200, MP.W - 200), y: 320, vx: -rnd(170, 230), w: 88, h: 34, col: "#e9edf5", pf: true, hit: 0 });
  } else if (kind === "aduana") {
    MP.W = 1700; MP.H = 1000;
    addRect(200, 0, 1300, 130, "bld", { sign: "ADUANA ARGENTINA", col: "#3d6aa8" }); addRect(0, 0, 200, 40, "rail"); addRect(1500, 0, 200, 40, "rail");
    for (j = 0; j < 2; j++) for (i = 0; i < 4; i++) addRect(190 + i * 370 + rnd(-20, 20), 300 + j * 290 + rnd(-20, 20), 140, 76, "booth");
    [[300, 250], [840, 250], [1380, 250], [560, 560], [1100, 560]].forEach(function (p, k) { addRect(p[0], p[1], 170, 16, "gate", { open: k % 2 === 1, tmr: rnd(0.5, 2.4) }); });
  } else {
    MP.W = 2200; MP.H = 1200;
    [[200, 90], [900, 90], [1600, 90]].forEach(function (p) { addRect(p[0], p[1], 300, 150, "hangar"); });
    [[360, 500], [1100, 640], [1650, 440]].forEach(function (p) { addRect(p[0], p[1], 230, 50, "plane"); });
    addRect(780, 380, 110, 54, "truck"); addRect(1450, 830, 110, 54, "truck"); addRect(220, 900, 90, 44, "truck"); addRect(1900, 760, 90, 44, "truck");
    for (i = 0; i < 6; i++) { tries = 0; do { x = rnd(100, MP.W - 160); y = rnd(300, MP.H - 120); tries++; } while (tries < 20 && rectsHit(x + 20, y + 14, 56)); addRect(x, y, 40, 28, "cart"); }
  }
}
function newWalker(x, y, kind) {
  return { x: x, y: y, kind: kind, dir: pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), t: rnd(1, 3), sp: kind === "decoy" ? 55 : rnd(30, 55), face: 1,
    shirt: pick(["#c33", "#3a7", "#37c", "#c73", "#a5a", "#eee", "#fd3"]), hair: pick(["#222", "#5a3", "#a62", "#ddd", "#111"]), skin: pick(["#e0ac84", "#c98e68", "#8d5a3b", "#f0c09a"]), balloon: null };
}
function spawnPickup() {
  var p = freePoint(30), tries = 0;
  while (tries < 15 && Math.hypot(p.x - g.m.x, p.y - g.m.y) < 220) { p = freePoint(30); tries++; }
  g.pickups.push(p);
}

function startMoraes() {
  parts = []; pops = []; fx.shk = 0; fx.flash = 0; fx.slow = 0; fx.ts = 1;
  g = { mode: "moraes", t: 0, clock: 0, anim: 0, round: 0, lives: 3, en: 100, sp: 20, cds: [0, 0, 0, 0], combo: 0, comboT: 0, mult: 1, bestCombo: 0, pts: 0, near: 0,
    toasts: [], rects: [], parks: [], npcs: [], decoys: [], pickups: [], cars: [], stacks: [], projs: [], medals: [], trans: null, why: "", god: false,
    freezes: 0, decoyHits: 0, nets: 0, blocks: 0, deaths: 0, closest: 9999, beam: null, aimT: null, fBlock: 0, ofT: 0, reveal: 0, rt: 0, cam: { x: 0, y: 0 },
    m: { x: 0, y: 0, moving: false, face: 1, aim: { x: 1, y: 0 }, stun: 0, slow: 0 },
    f: { x: 0, y: 0, frozen: 0, net: false, dir: { x: -1, y: 0 }, steer: 0, pause: 0, nextPause: 6, face: -1, moving: true, disg: 0, shield: 0, slow: 0, stun: 0, cd: { bone: 3, biblia: 2, cartaz: 3, arminha: 4 } },
    quipF: null, quipM: null, nextHint: 3, hintN: 0, st: { t: 0 } };
  beginRound(0);
}
function beginRound(r) {
  var R = ROUNDS[r];
  g.round = r; state.stage = r + 1; g.trans = { k: "intro", t: 0, dur: 2.6 };
  g.npcs = []; g.decoys = []; g.pickups = [];
  buildMap(R.map);
  var m = g.m, f = g.f, i;
  var sp0 = freePoint(26); m.x = sp0.x; m.y = sp0.y; m.stun = 0; m.slow = 0; m.moving = false; m.aim = { x: 1, y: 0 };
  var sp1 = freePoint(26, m); f.x = sp1.x; f.y = sp1.y; f.frozen = 0; f.net = false; f.pause = 0; f.nextPause = rnd(5, 8); f.disg = 0; f.shield = 0; f.slow = 0; f.stun = 0;
  f.cd = { bone: 3, biblia: 2, cartaz: 3, arminha: 4 }; f.dir = { x: -1, y: 0 };
  for (i = 0; i < R.npcs; i++) { var p = freePoint(22); g.npcs.push(newWalker(p.x, p.y, "npc")); }
  for (i = 0; i < R.decoys; i++) { var d = freePoint(22); g.decoys.push(newWalker(d.x, d.y, "decoy")); }
  for (i = 0; i < 3; i++) spawnPickup();
  g.rt = R.limit; g.phase = 0; g.rtMax = R.limit; g.nextHint = 3.5; g.hintN = 0; g.beam = null; g.aimT = null; g.fBlock = 0; g.ofT = 0; g.reveal = 0; g.closest = 9999; g.st = { t: 0, retry: g.st && g.st.retry || 0 };
  g.en = Math.max(g.en, 70); g.quipF = null; g.quipM = null;
  state.timeLeft = R.limit;
  if (r === 0) say("moraesPF", "moraes-start", 2); else if (r === 1) say("batalhas", "rodada-2", 1);
}
function moveCircle(o, dx, dy, r) {
  var i, rc;
  o.x = clamp(o.x + dx, r, MP.W - r);
  for (i = 0; i < g.rects.length; i++) { rc = g.rects[i]; if (rc.open) continue;
    if (o.x + r > rc.x && o.x - r < rc.x + rc.w && o.y + r * .5 > rc.y && o.y - r * .5 < rc.y + rc.h) { o.x = dx > 0 ? rc.x - r : rc.x + rc.w + r; } }
  o.y = clamp(o.y + dy, r, MP.H - r);
  for (i = 0; i < g.rects.length; i++) { rc = g.rects[i]; if (rc.open) continue;
    if (o.x + r > rc.x && o.x - r < rc.x + rc.w && o.y + r * .5 > rc.y && o.y - r * .5 < rc.y + rc.h) { o.y = dy > 0 ? rc.y - r * .5 : rc.y + rc.h + r * .5; } }
}
function ray(x, y, dx, dy, maxD) {
  for (var d = 8; d <= maxD; d += 8) {
    var px = x + dx * d, py = y + dy * d;
    if (px < 10 || py < 10 || px > MP.W - 10 || py > MP.H - 10) return d - 8;
    for (var i = 0; i < g.rects.length; i++) { var r = g.rects[i]; if (r.open) continue; if (px > r.x - 10 && px < r.x + r.w + 10 && py > r.y - 8 && py < r.y + r.h + 10) return d - 8; }
  }
  return maxD;
}
function steerFlavio() {
  var f = g.f, m = g.m, best = -1e9, bd = f.dir, cur = Math.atan2(f.dir.y, f.dir.x);
  for (var k = 0; k < 16; k++) {
    var a = k / 16 * TAU, dx = Math.cos(a), dy = Math.sin(a), clear = ray(f.x, f.y, dx, dy, 150);
    var px = f.x + dx * clear, py = f.y + dy * clear;
    var s = Math.hypot(px - m.x, py - m.y) + clear * 0.9 - (clear < 50 ? 200 : 0);
    var ad = Math.abs(((a - cur + Math.PI * 3) % TAU) - Math.PI); s -= ad * 18;
    s -= Math.max(0, 140 - Math.min(px, MP.W - px, py, MP.H - py)) * 1.2;
    s += rnd(-25, 25);
    if (s > best) { best = s; bd = { x: dx, y: dy }; }
  }
  f.dir = bd;
}
function dirName(ang) { var i = Math.round(((ang % TAU) + TAU) % TAU / (Math.PI / 4)) % 8; return DIRS[i]; }
function spawnHints() {
  var m = g.m, f = g.f, ang = Math.atan2(f.y - m.y, f.x - m.x);
  var ns = g.npcs.slice().sort(function (a, b) { return Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y); });
  var a = ns[0], b = ns[1], c3 = ns[2]; if (!a) return;
  [a, b, c3].forEach(function (n) { if (n && Math.hypot(n.x - m.x, n.y - m.y) > 380) { var an = rnd(0, TAU); n.x = clamp(m.x + Math.cos(an) * 330, 30, MP.W - 30); n.y = clamp(m.y + Math.sin(an) * 250, 30, MP.H - 30); if (rectsHit(n.x, n.y, 12)) { var q = freePoint(22); n.x = q.x; n.y = q.y; } } });
  if (f.disg > 0 && g.reveal <= 0) { a.balloon = { s: pick(["Perdi ele de vista!", "Cadê o boné?", "Tem um boné vermelho aí!"]), t: 4 }; sfx("pop"); return; }
  var truthDir = dirName(ang), lieDir = DIRS[(DIRS.indexOf(truthDir) + pick([3, 4, 5])) % 8];
  var T = ["Vi ele indo pro {D}!", "Foi pro {D}, juro!", "Tá lá pro {D}, doutor!"], Lh = ["Nada! Foi pro {D}!", "Mentira, ele foi pro {D}!", "Eu vi: {D}!"];
  var first = RNG() < .5;
  if (g.reveal > 0) first = true;
  a.balloon = { s: (first ? pick(T) : pick(Lh)).replace("{D}", first ? truthDir : lieDir), t: 5 };
  if (b) b.balloon = { s: (first ? pick(Lh) : pick(T)).replace("{D}", first ? lieDir : truthDir), t: 5 };
  if (g.reveal > 0 && b) b.balloon = { s: pick(T).replace("{D}", truthDir), t: 5 };
  if (c3 && RNG() < .55) c3.balloon = { s: pick(["Cadê o Wally?", "Foi a pé, supostamente!", "Tava de gravata amarela!", "Esse aí não é o primo?", "Eu não vi nada, mas confio!", "Pergunta pro vizinho!"]), t: 4.5 };
  sfx("pop");
}

/* ----- poderes do Moraes ----- */
function aimTarget() {
  var m = g.m, f = g.f, dx = f.x - m.x, dy = f.y - m.y, d = Math.hypot(dx, dy) || 1;
  var cosA = (dx * m.aim.x + dy * m.aim.y) / d;
  return { d: d, ang: Math.acos(clamp(cosA, -1, 1)), ux: dx / d, uy: dy / d, los: ray(m.x, m.y, dx / d, dy / d, d) >= d - 14 };
}
function moPower(i) {
  if (g.trans) return { ok: false, reason: "busy" };
  var m = g.m, f = g.f;
  if (i === 4) {
    if (g.sp < 100) { popup("Especial " + Math.floor(g.sp) + "%", m.x, m.y - 90, "#ffcc80", 14); return { ok: false, reason: "charge" }; }
    g.sp = 0; g.ofT = 3.2; g.reveal = 4.5; f.frozen = Math.max(f.frozen, 3); f.net = false; f.disg = 0; g.hintN = 99; g.nextHint = .2;
    sfx("paper"); sfx("boom"); flashScr("255,255,255", .55); shake(9); popup("OFÍCIO URGENTE!", m.x, m.y - 100, "#fff", 24);
    for (var q = 0; q < 14; q++) parts.push({ x: m.x, y: m.y - 30, vx: rnd(-160, 160), vy: rnd(-220, -40), life: 1, max: 1, col: "#fff", r: rnd(3, 6), gr: 160 });
    bumpComboM(3); g.pts += 150 * g.mult;
    return { ok: true, power: "oficio" };
  }
  var P = MPOW[i];
  if (g.cds[i] > 0) return { ok: false, reason: "cooldown" };
  if (g.en < P.cost) { popup("Sem energia!", m.x, m.y - 90, "#ffcc80", 14); sfx("nope"); return { ok: false, reason: "energy" }; }
  g.en -= P.cost; g.cds[i] = P.cd;
  if (i === 0) {
    var at = aimTarget(), len = 380, hit = at.d < 380 && at.ang < .62 && at.los && f.frozen <= 0;
    sfx("pen");
    if (hit) {
      g.beam = { x0: m.x, y0: m.y - 30, x1: f.x, y1: f.y - 30, t: .28 };
      if (f.shield > 0) { f.shield = 0; g.blocks++; popup("BÍBLIA BLOQUEOU!", f.x, f.y - 100, "#ffe082", 18); ring(f.x, f.y - 30, "#ffe082", 12); say("hoje", "biblia-bloqueou-canetada", 1); g.quipF = { s: "Hoje não, companheiro!", t: 1.6 }; sfx("shield"); }
      else { f.frozen = ROUNDS[g.round].fz; f.net = false; f.pause = 0; g.freezes++; sfx("freeze"); shake(6); burst(f.x, f.y - 30, "#aee1ff", 16, 180); ring(f.x, f.y - 30, "#aee1ff", 10);
        g.quipM = { s: "Decisão monocrática!", t: 1.5 }; g.quipF = { s: "Ué, travou!", t: 1.8 }; popup("CANETADA! +" + 150 * g.mult, f.x, f.y - 100, "#9ec3ff", 20); g.pts += 150 * g.mult; bumpComboM(2); g.sp = clamp(g.sp + 14, 0, 100); }
    } else { var ml = Math.min(len, ray(m.x, m.y, m.aim.x, m.aim.y, len)); g.beam = { x0: m.x, y0: m.y - 30, x1: m.x + m.aim.x * ml, y1: m.y - 30 + m.aim.y * ml, t: .2 }; popup("errou!", m.x, m.y - 90, "#cfd3e2", 13); }
  } else if (i === 1) {
    g.projs.push({ k: "toga", x: m.x, y: m.y - 24, vx: m.aim.x * 480, vy: m.aim.y * 480, life: .95, rot: 0 }); sfx("net"); popup("Toga voadora!", m.x, m.y - 90, "#dfe8ff", 15);
  } else if (i === 2) {
    g.fBlock = 6.5; f.disg = 0; f.cd = { bone: 3, biblia: 3, cartaz: 3, arminha: 3 }; sfx("nope"); flashScr("90,140,255", .4); shake(5);
    popup("BLOQUEIO DO X!", m.x, m.y - 100, "#8fb4ff", 22); popup("poderes do Flávio OFF", f.x, f.y - 100, "#ff8a80", 14); say("regular", "bloqueio-x", 2);
    g.quipF = { s: "Meu X sumiu!", t: 1.8 }; g.pts += 60 * g.mult; gainSpM(8);
  } else if (i === 3) {
    if (g.stacks.length >= 2) g.stacks.shift();
    g.stacks.push({ x: m.x, y: m.y, t: 7.5, r: 52 }); sfx("paper"); popup("Inquérito infinito!", m.x, m.y - 90, "#ffe0b2", 16);
    burst(m.x, m.y - 10, "#fff", 10, 110, 40);
  }
  return { ok: true, power: P.n };
}
function gainSpM(n) { g.sp = clamp(g.sp + n, 0, 100); }
function bumpComboM(n) {
  var before = g.mult; g.combo += n; g.comboT = 5; g.mult = clamp(1 + Math.floor(g.combo / 3), 1, 8); if (g.combo > g.bestCombo) g.bestCombo = g.combo;
  if (g.mult > before) { popup("COMBO x" + g.mult + "!", g.m.x, g.m.y - 125, "#ffdf00", 22); sfx("pow"); }
}

/* ----- IA de poderes do Flávio ----- */
function fAI(dt) {
  var f = g.f, m = g.m, R = ROUNDS[g.round], k;
  for (k in f.cd) if (f.cd[k] > 0) f.cd[k] -= dt * (g.phase ? 1.6 : 1);
  if (f.disg > 0) f.disg -= dt; if (f.shield > 0) f.shield -= dt; if (g.fBlock > 0) { g.fBlock -= dt; return; }
  if (f.frozen > 0) return;
  var d = Math.hypot(f.x - m.x, f.y - m.y), los = d > 1 && ray(f.x, f.y, (m.x - f.x) / d, (m.y - f.y) / d, d) >= d - 14, has = function (n) { return R.pw.indexOf(n) >= 0; };
  if (has("bone") && f.cd.bone <= 0 && f.disg <= 0 && d < 330) { f.disg = 4.5; f.cd.bone = 13; popup("Boné MAGA!", f.x, f.y - 100, "#ef9a9a", 16); sfx("pow"); ring(f.x, f.y - 40, "#ef9a9a", 10); g.quipF = { s: "Quem, eu?", t: 1.5 }; }
  if (has("biblia") && f.cd.biblia <= 0 && f.shield <= 0 && d < 240) { f.shield = 4; f.cd.biblia = 11; popup("Bíblia de bolso!", f.x, f.y - 100, "#ffe082", 15); sfx("shield"); ring(f.x, f.y - 40, "#8fd0ff", 10); }
  if (has("cartaz") && f.cd.cartaz <= 0 && d > 110 && d < 330 && los) {
    f.cd.cartaz = 5.5; g.quipF = { s: "Toma, cartaz!", t: 1.1 };
    g.projs.push({ k: "fcartaz", x: f.x, y: f.y - 24, vx: (m.x - f.x) / d * 470, vy: (m.y - f.y) / d * 470, life: .85, rot: 0 }); sfx("whoosh");
  }
  if (has("arminha") && f.cd.arminha <= 0 && !g.aimT && d < 340 && los) { g.aimT = { t: .6, dx: m.x - f.x, dy: m.y - f.y }; f.cd.arminha = 5; g.quipF = { s: "Pow!", t: .9 }; sfx("alarm"); }
}

function updMoraes(rdt) {
  g.anim += rdt; updFx(rdt);
  var ti, i, n;
  for (ti = g.toasts.length - 1; ti >= 0; ti--) { g.toasts[ti].t -= rdt; if (g.toasts[ti].t <= 0) g.toasts.splice(ti, 1); }
  if (g.quipF) { g.quipF.t -= rdt; if (g.quipF.t <= 0) g.quipF = null; }
  if (g.quipM) { g.quipM.t -= rdt; if (g.quipM.t <= 0) g.quipM = null; }
  // NPCs sempre andam (cenário vivo)
  var all = g.npcs.concat(g.decoys);
  for (i = 0; i < all.length; i++) {
    n = all[i]; n.t -= rdt; if (n.balloon) { n.balloon.t -= rdt; if (n.balloon.t <= 0) n.balloon = null; }
    var ox = n.x, oy = n.y; moveCircle(n, n.dir[0] * n.sp * rdt, n.dir[1] * n.sp * rdt, 9);
    if (n.dir[0]) n.face = n.dir[0] > 0 ? 1 : -1;
    if (n.t <= 0 || Math.hypot(n.x - ox, n.y - oy) < n.sp * rdt * .3) { n.dir = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]); n.t = rnd(1.5, 4); }
  }
  if (g.trans) {
    var tr = g.trans; tr.t += rdt;
    if (tr.t >= tr.dur) { var k = tr.k; g.trans = null; if (k === "medal") beginRound(g.round + 1); else if (k === "retry") beginRound(g.round); }
    return;
  }
  var dt = rdt * fx.ts, R = ROUNDS[g.round];
  g.t += dt; g.st.t += dt; g.clock += dt; g.rt -= dt; state.timeLeft = Math.max(0, g.rt);
  var inp = injected || readInput(), m = g.m, f = g.f;
  ["stun", "slow"].forEach(function (k2) { if (m[k2] > 0) m[k2] -= dt; if (f[k2] > 0) f[k2] -= dt; });
  if (g.ofT > 0) g.ofT -= dt; if (g.reveal > 0) g.reveal -= dt;
  for (i = 0; i < 4; i++) if (g.cds[i] > 0) g.cds[i] = Math.max(0, g.cds[i] - dt);
  g.en = clamp(g.en + 6.2 * dt, 0, 100);
  if (g.comboT > 0) { g.comboT -= dt; if (g.comboT <= 0) { g.combo = 0; g.mult = 1; } }
  m.moving = (inp.x !== 0 || inp.y !== 0) && m.stun <= 0;
  if (inp.x || inp.y) { var il = Math.hypot(inp.x, inp.y); m.aim = { x: inp.x / il, y: inp.y / il }; }
  if (inp.x) m.face = inp.x > 0 ? 1 : -1;
  var mv = 190 * (g.ofT > 0 ? 1.5 : 1) * (m.slow > 0 ? .55 : 1) * (m.stun > 0 ? 0 : 1);
  moveCircle(m, inp.x * mv * dt, inp.y * mv * dt, 11);
  // portões da aduana
  for (i = 0; i < g.rects.length; i++) { var rc = g.rects[i]; if (rc.kind === "gate") { rc.tmr -= dt; if (rc.tmr <= 0) { rc.open = !rc.open; rc.tmr = rc.open ? 1.8 : 2.8; } } }
  // trânsito
  for (i = 0; i < g.cars.length; i++) {
    var cr = g.cars[i]; cr.x += cr.vx * dt; if (cr.x > MP.W + 100) cr.x = -100; if (cr.x < -100) cr.x = MP.W + 100; if (cr.hit > 0) cr.hit -= dt;
    if (cr.hit <= 0 && Math.abs(m.x - cr.x) < cr.w / 2 + 8 && Math.abs(m.y - cr.y) < cr.h / 2 + 8) { cr.hit = 1.2; m.stun = .8; shake(7); sfx("hit"); popup("Buzinaço!", m.x, m.y - 90, "#ffab91", 16); burst(m.x, m.y - 20, "#ffab91", 10, 160); }
    if (cr.hit <= 0 && Math.abs(f.x - cr.x) < cr.w / 2 + 8 && Math.abs(f.y - cr.y) < cr.h / 2 + 8) { cr.hit = 1.2; f.stun = 1.0; popup("Atropelado de leve!", f.x, f.y - 90, "#fff59d", 13); burst(f.x, f.y - 20, "#fff59d", 8, 140); }
  }
  // inquérito infinito
  var inStack = false;
  for (i = g.stacks.length - 1; i >= 0; i--) { var sk = g.stacks[i]; sk.t -= dt; if (sk.t <= 0) { g.stacks.splice(i, 1); continue; } if (Math.hypot(f.x - sk.x, f.y - sk.y) < sk.r) inStack = true; }
  if (inStack) { if (f.slow <= 0.05) { popup("Preso no inquérito!", f.x, f.y - 90, "#ffe0b2", 14); g.pts += 40 * g.mult; } f.slow = .25; }
  // Flávio
  var fsp = R.fsp * (g.phase ? 1.1 : 1) * (g.rt < g.rtMax * .25 ? 1.08 : 1) * (f.slow > 0 ? .5 : 1);
  if (f.frozen > 0) { f.frozen -= dt; f.moving = false; if (f.frozen <= 0) f.net = false; }
  else if (f.stun > 0) { f.moving = false; }
  else {
    f.nextPause -= dt;
    if (f.pause > 0) { f.pause -= dt; f.moving = false; }
    else {
      if (f.nextPause <= 0 && Math.hypot(f.x - m.x, f.y - m.y) > 260) { f.pause = .9; f.nextPause = rnd(5, 8); g.quipF = { s: pick(["Peraí, vou postar!", "Será que é por aqui?", "Meu Pix caiu?"]), t: 1.2 }; }
      else {
        f.steer -= dt; if (f.steer <= 0) { steerFlavio(); f.steer = .18; }
        var sp = fsp * (Math.hypot(f.x - m.x, f.y - m.y) < 120 ? 1.04 : 1);
        var fx0 = f.x, fy0 = f.y; moveCircle(f, f.dir.x * sp * dt, f.dir.y * sp * dt, 11); f.moving = true;
        if (f.dir.x) f.face = f.dir.x > 0 ? 1 : -1;
        if (Math.hypot(f.x - fx0, f.y - fy0) < sp * dt * .35) f.steer = 0;
      }
    }
  }
  fAI(dt);
  if (g.aimT) { g.aimT.t -= dt; if (g.aimT.t <= 0) { var ad = Math.hypot(m.x - f.x, m.y - f.y) || 1; g.projs.push({ k: "farm", x: f.x, y: f.y - 24, vx: (m.x - f.x) / ad * 640, vy: (m.y - f.y) / ad * 640, life: .7, rot: 0 }); sfx("shot"); g.aimT = null; } }
  // projéteis
  for (i = g.projs.length - 1; i >= 0; i--) {
    var p = g.projs[i]; p.life -= dt; p.rot += dt * 16; p.x += p.vx * dt; p.y += p.vy * dt; var gone = p.life <= 0;
    if (!gone && rectsHit(p.x, p.y + 24, 4)) gone = true;
    if (!gone && p.k === "toga" && Math.hypot(p.x - f.x, p.y + 24 - f.y) < 30) {
      gone = true;
      if (f.shield > 0) { f.shield = 0; g.blocks++; popup("BÍBLIA BLOQUEOU A TOGA!", f.x, f.y - 100, "#ffe082", 16); say("hoje", "biblia-bloqueou-toga", 1); sfx("shield"); }
      else { f.frozen = 2.4; f.net = true; g.nets++; popup("TOGA NA PEGADA! +" + 120 * g.mult, f.x, f.y - 100, "#dfe8ff", 18); g.pts += 120 * g.mult; bumpComboM(2); gainSpM(10); burst(f.x, f.y - 20, "#dfe8ff", 14, 160); sfx("freeze"); shake(5); g.quipF = { s: "Me enrolaram!", t: 1.6 }; }
    }
    if (!gone && (p.k === "fcartaz" || p.k === "farm") && Math.hypot(p.x - m.x, p.y + 24 - m.y) < 26) {
      gone = true; m.stun = p.k === "fcartaz" ? 1.0 : .7; shake(7); flashScr("255,60,60", .25); sfx("hit"); burst(m.x, m.y - 24, "#ff8a80", 12, 170);
      popup(p.k === "fcartaz" ? "Cartaz na cara!" : "Arminha acertou!", m.x, m.y - 100, "#ff8a80", 17); g.quipM = { s: "Ai!", t: 1 };
      if (g.combo >= 3) popup("COMBO QUEBRADO", m.x, m.y - 125, "#ff8a80", 14); g.combo = 0; g.mult = 1;
    }
    if (gone) g.projs.splice(i, 1);
  }
  if (g.beam) { g.beam.t -= dt; if (g.beam.t <= 0) g.beam = null; }
  // pistas
  g.nextHint -= dt; if (g.nextHint <= 0) { spawnHints(); g.nextHint = g.reveal > 0 ? 2 : 6.5; }
  // tinteiros (recarga)
  for (i = g.pickups.length - 1; i >= 0; i--) {
    var pk = g.pickups[i]; if (Math.hypot(pk.x - m.x, pk.y - m.y) < 28) {
      g.pickups.splice(i, 1); g.en = clamp(g.en + 45, 0, 100); sfx("boost"); burst(pk.x, pk.y, "#3a6bff", 16, 150); popup("TINTEIRO! +energia", pk.x, pk.y - 40, "#9ec3ff", 15); g.pts += 40;
      setTimeout(function () { if (g && g.mode === "moraes" && g.pickups.length < 3 && !g.trans) spawnPickup(); }, 7000);
    }
  }
  // primos (decoys)
  for (i = 0; i < g.decoys.length; i++) {
    n = g.decoys[i]; if (Math.hypot(n.x - m.x, n.y - m.y) < 26) {
      g.rt -= 4; g.decoyHits++; g.pts = Math.max(0, g.pts - 150); shake(5); sfx("hit"); n.balloon = { s: pick(["Sou só um primo!", "Gravata laranja, uai!", "Não sou ele, não!"]), t: 2.2 };
      popup("Esse é um primo! -4s", m.x, m.y - 100, "#ffab91", 16); g.combo = 0; g.mult = 1; var sp3 = freePoint(22); n.x = sp3.x; n.y = sp3.y; say("trouxa", "primo-enganou", 0);
    }
  }
  var d = Math.hypot(f.x - m.x, f.y - m.y); g.closest = Math.min(g.closest, d);
  if (d < 400) { var gn = (400 - d) * dt * .5; g.near += gn; g.pts += gn; gainSpM(dt * 3 * (400 - d) / 400); }
  gainSpM(dt * .9);
  state.score = Math.floor(g.pts); state.progress = clamp((g.round + clamp(1 - d / 1800, 0, 1) * .5) / 4, 0, 1);
  if (d < 26 && !g.god) { roundWin(); return; }
  if (g.rt <= 0) roundFail();
}
function roundWin() {
  var R = ROUNDS[g.round], f = g.f;
  if (g.phase === 0) {   // primeira pegada: era só um sósia — Flávio de verdade foge, mais rápido e protegido
    g.phase = 1; g.rt += 28; g.rtMax = R.limit + 28; g.pts += 350 * g.mult; bumpComboM(2);
    shake(9); flashScr("255,255,255", .45); sfx("win"); burst(f.x, f.y - 30, "#ffdf00", 24, 240); ring(f.x, f.y - 30, "#ffdf00", 14);
    popup("PEGOU! ...era um sósia!", f.x, f.y - 110, "#ffcc80", 22);
    var q = freePoint(26, g.m); f.x = q.x; f.y = q.y; f.frozen = 0; f.net = false; f.stun = 0; f.slow = 0; f.disg = 0; f.shield = 3.5; f.pause = 0;
    f.cd = { bone: 2, biblia: 4, cartaz: 2, arminha: 2 }; g.nextHint = 1.5; g.stacks = []; g.decoys.forEach(function (n) { var z = freePoint(22); n.x = z.x; n.y = z.y; });
    g.trans = { k: "phase", t: 0, dur: 2.0 }; return;
  }
  var frac = g.rt / g.rtMax, medal = frac >= .5 ? "ouro" : frac >= .25 ? "prata" : "bronze";
  var pts = 600 + Math.floor(g.rt * 30) + (medal === "ouro" ? 600 : medal === "prata" ? 300 : 100) - g.st.retry * 100;
  g.pts += Math.max(100, pts);
  g.medals.push({ stage: g.round + 1, name: R.name, medal: medal, perf: Math.round(frac * 100), time: Math.round(g.rtMax - g.rt), pts: pts, killed: true });
  shake(12); flashScr("255,255,255", .5); sfx("win"); burst(g.f.x, g.f.y - 30, "#ffdf00", 30, 260); ring(g.f.x, g.f.y - 30, "#ffdf00", 14);
  popup("PEGO!", g.f.x, g.f.y - 110, "#69f0ae", 30);
  if (g.round >= 3) { endGame(true, "pegou"); return; }
  g.trans = { k: "medal", t: 0, dur: 3.6, m: g.medals[g.medals.length - 1] }; sfx("medal");
}
function roundFail() {
  g.lives--; g.deaths++; g.st.retry++;
  if (g.lives <= 0) { endGame(false, "tempo"); return; }
  sfx("lose"); shake(8); flashScr("255,60,60", .4);
  g.trans = { k: "retry", t: 0, dur: 2.2 };
}
var _mkprojdraw = null;

/* ---------- desenho do modo Moraes ---------- */
function drawTopCar(c, x, y, w, h, vx, col, pf, t) {
  c.save(); c.translate(x, y); if (vx < 0) c.scale(-1, 1);
  c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(-w / 2 + 3, -h / 2 + 5, w, h);
  c.fillStyle = col; rr(c, -w / 2, -h / 2, w, h, 7); c.fill();
  c.fillStyle = "rgba(20,30,60,.8)"; c.fillRect(-w * .12, -h / 2 + 4, w * .34, h - 8); c.fillRect(-w * .42, -h / 2 + 5, w * .14, h - 10);
  c.fillStyle = "#ffe9a0"; c.fillRect(w / 2 - 4, -h / 2 + 3, 4, 6); c.fillRect(w / 2 - 4, h / 2 - 9, 4, 6);
  if (pf) { var on = Math.floor(t * 6) % 2 === 0; c.fillStyle = on ? "#ff2a2a" : "#3a7aff"; c.fillRect(-4, -5, 9, 10); c.fillStyle = "#1b3a8a"; c.fillRect(-w / 2, -2, w, 4); }
  c.restore();
}
function drawMapGround(c, kind, camx, camy, t) {
  var i, j, k, s;
  if (kind === "city") {
    var S = 76, C = 5, R = 4, bw = 240, bh = 180;
    c.fillStyle = "#4a4e5a"; c.fillRect(0, 0, MP.W, MP.H);
    c.fillStyle = "rgba(255,255,255,.35)";
    for (k = 0; k <= C; k++) { var vx = S / 2 + k * (bw + S); for (s = 0; s < MP.H; s += 40) c.fillRect(vx - 1.5, s, 3, 20); }
    for (k = 0; k <= R; k++) { var hy = S / 2 + k * (bh + S); for (s = 0; s < MP.W; s += 40) c.fillRect(s, hy - 1.5, 20, 3); }
    c.fillStyle = "#b9b5a6"; for (j = 0; j < R; j++) for (i = 0; i < C; i++) c.fillRect(S + i * (bw + S) - 3, S + j * (bh + S) - 3, bw + 6, bh + 6);
  } else if (kind === "bridge") {
    c.fillStyle = "#3b3f52"; c.fillRect(0, 0, MP.W, MP.H);
    c.fillStyle = "rgba(255,255,255,.4)"; for (k = 0; k < 3; k++) for (s = 0; s < MP.W; s += 70) c.fillRect(s, 200 + k * 120, 36, 4);
    c.fillStyle = "#e7c92d"; c.fillRect(0, 318, MP.W, 3); c.fillRect(0, 324, MP.W, 3);
    c.fillStyle = "rgba(0,0,0,.18)"; for (s = 0; s < MP.W; s += 200) c.fillRect(s, 66, 3, MP.H - 132);
  } else if (kind === "aduana") {
    c.fillStyle = "#555a72"; c.fillRect(0, 0, MP.W, MP.H);
    c.fillStyle = "rgba(255,255,255,.07)"; for (s = 0; s < MP.W; s += 100) c.fillRect(s, 0, 2, MP.H); for (s = 0; s < MP.H; s += 100) c.fillRect(0, s, MP.W, 2);
    c.fillStyle = "#e7c92d"; for (s = 140; s < MP.W - 100; s += 60) { c.fillRect(s, 205, 30, 4); c.fillRect(s, 520, 30, 4); c.fillRect(s, 810, 30, 4); }
    txt(c, "PARE · DOCUMENTOS", MP.W / 2, 880, 40, "rgba(255,255,255,.2)", "center");
  } else {
    c.fillStyle = "#262a36"; c.fillRect(0, 0, MP.W, MP.H);
    c.fillStyle = "rgba(255,255,255,.55)"; for (s = 0; s < MP.W; s += 120) c.fillRect(s, MP.H - 160, 70, 8);
    txt(c, "27R", 160, MP.H - 100, 60, "rgba(255,255,255,.3)", "center");
    c.fillStyle = "#e7c92d"; c.fillRect(0, 300, MP.W, 4); c.fillRect(0, 760, MP.W, 4);
    for (s = 0; s < MP.W; s += 90) { var on = (Math.floor(t * 6) + s / 90) % 6 === 0; c.fillStyle = on ? "#fff" : "#3a6bff"; c.beginPath(); c.arc(s + 20, 20, on ? 5 : 3, 0, TAU); c.arc(s + 20, MP.H - 20, on ? 5 : 3, 0, TAU); c.fill(); }
  }
}
function drawMapRect(c, r, t) {
  var j;
  if (r.kind === "bld") {
    c.fillStyle = "rgba(0,0,0,.28)"; c.fillRect(r.x + 8, r.y + 10, r.w, r.h);
    c.fillStyle = r.col; c.fillRect(r.x, r.y, r.w, r.h - 24);
    c.fillStyle = "rgba(255,255,255,.14)"; c.fillRect(r.x + 10, r.y + 10, r.w - 20, r.h - 44);
    c.fillStyle = "rgba(0,0,0,.18)"; c.fillRect(r.x + r.w * .6, r.y + 18, 36, 26); c.fillRect(r.x + 24, r.y + 40, 30, 20);
    c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(r.x, r.y + r.h - 24, r.w, 24);
    c.fillStyle = r.col; c.fillRect(r.x, r.y + r.h - 24, r.w, 5);
    c.fillStyle = "#ffe9a0"; for (j = 0; j < Math.floor((r.w - 20) / 38); j++) c.fillRect(r.x + 16 + j * 38, r.y + r.h - 16, 14, 9);
    txt(c, r.sign, r.x + r.w / 2, r.y + Math.min(84, r.h / 2), 15, "rgba(255,255,255,.9)", "center", "rgba(0,0,0,.35)");
  } else if (r.kind === "rail") {
    c.fillStyle = "#6f7694"; c.fillRect(r.x, r.y, r.w, r.h); c.fillStyle = "#8a92b0"; c.fillRect(r.x, r.y + (r.y === 0 ? r.h - 8 : 0), r.w, 8);
    c.fillStyle = "rgba(0,0,0,.2)"; for (j = r.x; j < r.x + r.w; j += 60) c.fillRect(j, r.y, 4, r.h);
    c.save(); c.globalCompositeOperation = "lighter"; for (j = r.x + 80; j < r.x + r.w; j += 240) { var ly = r.y === 0 ? r.h - 10 : 10 + r.y, gl = c.createRadialGradient(j, ly, 1, j, ly, 26); gl.addColorStop(0, "rgba(255,230,150,.8)"); gl.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = gl; c.fillRect(j - 26, ly - 26, 52, 52); } c.restore();
  } else if (r.kind === "barrier") {
    c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(r.x + 4, r.y + 6, r.w, r.h); c.fillStyle = "#c9ccd8"; c.fillRect(r.x, r.y, r.w, r.h);
    c.fillStyle = "#e53935"; for (j = 0; j < r.w; j += 24) c.fillRect(r.x + j, r.y, 12, r.h);
  } else if (r.kind === "booth") {
    c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(r.x + 6, r.y + 8, r.w, r.h); c.fillStyle = "#e5e8f2"; c.fillRect(r.x, r.y, r.w, r.h);
    c.fillStyle = "#1b3a8a"; c.fillRect(r.x - 4, r.y - 4, r.w + 8, 10); c.fillStyle = "rgba(255,244,170,.9)"; c.fillRect(r.x + 12, r.y + 18, r.w - 24, 24); txt(c, "PASAPORTES", r.x + r.w / 2, r.y + r.h - 12, 9, "#1b3a8a", "center");
  } else if (r.kind === "gate") {
    c.fillStyle = "#555"; c.fillRect(r.x - 6, r.y - 10, 10, 36); c.fillRect(r.x + r.w - 4, r.y - 10, 10, 36);
    if (r.open) { c.fillStyle = "rgba(105,240,174,.35)"; c.fillRect(r.x, r.y + 4, r.w, 8); } else { c.fillStyle = "#fff"; c.fillRect(r.x, r.y, r.w, r.h); c.fillStyle = "#e53935"; for (j = 0; j < r.w; j += 32) c.fillRect(r.x + j, r.y, 16, r.h); }
    c.fillStyle = r.open ? "#69f0ae" : "#ff3b3b"; c.beginPath(); c.arc(r.x, r.y - 12, 5, 0, TAU); c.fill();
  } else if (r.kind === "hangar") {
    c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(r.x + 8, r.y + 10, r.w, r.h); c.fillStyle = "#4b5b82"; c.fillRect(r.x, r.y, r.w, r.h);
    c.fillStyle = "#5d6f9c"; for (j = 0; j < r.w; j += 30) c.fillRect(r.x + j, r.y, 14, r.h - 30);
    c.fillStyle = "#222c4f"; c.fillRect(r.x + r.w * .25, r.y + r.h - 56, r.w * .5, 56); txt(c, "HANGAR", r.x + r.w / 2, r.y + 30, 16, "rgba(255,255,255,.8)", "center");
  } else if (r.kind === "plane") {
    c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(r.x + r.w / 2 + 6, r.y + r.h / 2 + 8, r.w / 2, r.h / 2, 0, 0, TAU); c.fill();
    c.fillStyle = "#cfd6e4"; c.beginPath(); c.moveTo(r.x + r.w * .45, r.y + r.h / 2); c.lineTo(r.x + r.w * .3, r.y - 60); c.lineTo(r.x + r.w * .5, r.y - 60); c.lineTo(r.x + r.w * .66, r.y + r.h / 2); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(r.x + r.w * .45, r.y + r.h / 2); c.lineTo(r.x + r.w * .3, r.y + r.h + 60); c.lineTo(r.x + r.w * .5, r.y + r.h + 60); c.lineTo(r.x + r.w * .66, r.y + r.h / 2); c.closePath(); c.fill();
    c.fillStyle = "#f4f6fa"; rr(c, r.x, r.y, r.w, r.h, 24); c.fill(); c.fillStyle = "#1b3a8a"; c.fillRect(r.x + 20, r.y + r.h / 2 - 3, r.w - 50, 4); c.fillStyle = "#00a651"; c.fillRect(r.x + 20, r.y + r.h / 2 + 2, r.w - 50, 3);
    c.fillStyle = "#2a3a63"; for (j = 0; j < 7; j++) c.fillRect(r.x + 40 + j * 22, r.y + 10, 10, 8);
  } else if (r.kind === "truck") {
    c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(r.x + 4, r.y + 6, r.w, r.h); c.fillStyle = "#e0b020"; c.fillRect(r.x, r.y, r.w, r.h); c.fillStyle = "#333"; c.fillRect(r.x + r.w - 26, r.y + 6, 20, r.h - 12); txt(c, "COMBUSTÍVEL", r.x + 44, r.y + r.h / 2, 8, "#222", "center");
  } else if (r.kind === "cart") {
    c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(r.x + 3, r.y + 4, r.w, r.h); c.fillStyle = "#6b7391"; c.fillRect(r.x, r.y, r.w, r.h); c.fillStyle = "#8a92b0"; c.fillRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8);
  }
}
function drawMoraesWorld(c) {
  var m = g.m, f = g.f, i, t = g.anim, R = ROUNDS[g.round];
  var camx = MP.W > W ? clamp(m.x - W / 2, 0, MP.W - W) : (MP.W - W) / 2, camy = MP.H > H ? clamp(m.y - H / 2, 0, MP.H - H) : (MP.H - H) / 2;
  g.cam = { x: camx, y: camy };
  c.save();
  if (fx.shk > 0.2) c.translate(rnd(-fx.shk, fx.shk) * .5, rnd(-fx.shk, fx.shk) * .5);
  c.translate(-camx, -camy);
  c.fillStyle = "#0a0d18"; c.fillRect(camx - 20, camy - 20, W + 40, H + 40);
  drawMapGround(c, R.map, camx, camy, t);
  var j;
  for (i = 0; i < g.parks.length; i++) {
    var pk = g.parks[i]; c.fillStyle = "#4f9a52"; c.fillRect(pk.x, pk.y, pk.w, pk.h);
    c.fillStyle = "#d8cfa6"; c.fillRect(pk.x + pk.w / 2 - 8, pk.y, 16, pk.h); c.fillRect(pk.x, pk.y + pk.h / 2 - 8, pk.w, 16);
    c.fillStyle = "#6fb4e0"; c.beginPath(); c.arc(pk.x + pk.w / 2, pk.y + pk.h / 2, 22, 0, TAU); c.fill(); c.fillStyle = "#cfeaff"; c.beginPath(); c.arc(pk.x + pk.w / 2, pk.y + pk.h / 2, 10, 0, TAU); c.fill();
    for (j = 0; j < 8; j++) { var tx = pk.x + 25 + (j % 4) * 62 + (j > 3 ? 20 : 0), ty = pk.y + 30 + (j > 3 ? 105 : 0); c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.ellipse(tx, ty + 14, 14, 5, 0, 0, TAU); c.fill(); c.fillStyle = "#2f7a3a"; c.beginPath(); c.arc(tx, ty, 14, 0, TAU); c.fill(); c.fillStyle = "#3a9a47"; c.beginPath(); c.arc(tx - 3, ty - 3, 9, 0, TAU); c.fill(); }
  }
  for (i = 0; i < g.rects.length; i++) { var r = g.rects[i]; if (r.x + r.w + 80 < camx || r.x - 80 > camx + W || r.y + r.h + 80 < camy || r.y - 80 > camy + H) continue; drawMapRect(c, r, t); }
  // viaturas estacionadas com sirene (decoração)
  if (R.map !== "city") { var pcx = [[140, MP.H - 130], [MP.W - 160, 130]]; for (i = 0; i < 2; i++) { var pp = pcx[i]; drawTopCar(c, pp[0], pp[1], 90, 38, 1, "#e9edf5", true, t);
    c.save(); c.globalCompositeOperation = "lighter"; var gl = c.createRadialGradient(pp[0], pp[1], 3, pp[0], pp[1], 80); var on = Math.floor(t * 6) % 2 === 0; gl.addColorStop(0, on ? "rgba(255,40,40,.5)" : "rgba(60,110,255,.5)"); gl.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = gl; c.fillRect(pp[0] - 80, pp[1] - 80, 160, 160); c.restore(); } }
  for (i = 0; i < g.cars.length; i++) drawTopCar(c, g.cars[i].x, g.cars[i].y, g.cars[i].w, g.cars[i].h, g.cars[i].vx, g.cars[i].col, g.cars[i].pf, t);
  // inquérito infinito
  for (i = 0; i < g.stacks.length; i++) {
    var sk = g.stacks[i], fa = clamp(sk.t, 0, 1);
    c.save(); c.globalAlpha = fa * .9; c.fillStyle = "rgba(255,224,178,.18)"; c.beginPath(); c.arc(sk.x, sk.y, sk.r, 0, TAU); c.fill(); c.strokeStyle = "#ffe0b2"; c.lineWidth = 2; c.setLineDash([6, 6]); c.lineDashOffset = -t * 20; c.stroke(); c.setLineDash([]);
    for (j = 0; j < 7; j++) { c.save(); c.translate(sk.x + Math.cos(j * 2.4) * 8, sk.y - j * 4); c.rotate(Math.sin(j * 1.7) * .25); c.fillStyle = "#fff"; c.fillRect(-14, -9, 28, 18); c.strokeStyle = "#999"; c.lineWidth = 1; c.strokeRect(-14, -9, 28, 18); c.fillStyle = "#bbb"; c.fillRect(-10, -4, 20, 2); c.fillRect(-10, 1, 14, 2); c.restore(); }
    txt(c, "INQUÉRITO", sk.x, sk.y + sk.r + 10, 10, "#ffe0b2", "center", "rgba(0,0,0,.7)"); c.restore();
  }
  // tinteiros
  for (i = 0; i < g.pickups.length; i++) {
    var pu = g.pickups[i], by = Math.sin(t * 4 + i) * 3;
    var pg = c.createRadialGradient(pu.x, pu.y, 3, pu.x, pu.y, 38); pg.addColorStop(0, "rgba(120,170,255,.8)"); pg.addColorStop(1, "rgba(120,170,255,0)"); c.fillStyle = pg; c.fillRect(pu.x - 38, pu.y - 38, 76, 76);
    c.save(); c.translate(pu.x, pu.y + by); c.fillStyle = "#101a4a"; rr(c, -9, -8, 18, 20, 4); c.fill(); c.fillStyle = "#3a6bff"; c.fillRect(-7, -2, 14, 12); c.fillStyle = "#cfe0ff"; c.fillRect(-4, -14, 8, 7); c.restore();
    txt(c, "TINTEIRO", pu.x, pu.y + 32, 10, "#cfe0ff", "center", "#000");
  }
  // sprites por y
  var spr = [], n;
  for (i = 0; i < g.npcs.length; i++) spr.push({ y: g.npcs[i].y, n: g.npcs[i] });
  for (i = 0; i < g.decoys.length; i++) spr.push({ y: g.decoys[i].y, n: g.decoys[i] });
  spr.push({ y: f.y, f: true }); spr.push({ y: m.y, m: true });
  spr.sort(function (a, b) { return a.y - b.y; });
  var hidden = f.disg > 0 && g.reveal <= 0;
  for (i = 0; i < spr.length; i++) {
    var e = spr[i];
    if (e.f) {
      drawChar(c, "flavio", f.x, f.y + 6, 1.05, { t: t, moving: f.moving, flip: f.face < 0, frozen: f.frozen > 0, cap: f.disg > 0, tie: hidden ? "#ff7a1a" : undefined, stun: f.stun > 0 });
      if (f.net) { c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = 1.2; c.beginPath(); c.arc(f.x, f.y - 30, 30, 0, TAU); for (j = -3; j <= 3; j++) { c.moveTo(f.x + j * 9, f.y - 58); c.lineTo(f.x + j * 9, f.y - 2); c.moveTo(f.x - 28, f.y - 30 + j * 9); c.lineTo(f.x + 28, f.y - 30 + j * 9); } c.stroke(); }
      if (f.shield > 0) { c.save(); c.globalAlpha = .8; c.strokeStyle = "#ffe082"; c.lineWidth = 3; c.fillStyle = "rgba(143,208,255,.2)"; c.beginPath(); c.ellipse(f.x, f.y - 32, 28, 38, 0, 0, TAU); c.fill(); c.stroke(); c.restore(); }
      if (!hidden) { var big = g.reveal > 0; c.fillStyle = "#e53935"; c.beginPath(); c.moveTo(f.x - (big ? 12 : 7), f.y - (big ? 100 : 82) - Math.abs(Math.sin(t * 6)) * (big ? 6 : 0)); c.lineTo(f.x + (big ? 12 : 7), f.y - (big ? 100 : 82) - Math.abs(Math.sin(t * 6)) * (big ? 6 : 0)); c.lineTo(f.x, f.y - (big ? 84 : 72)); c.fill(); }
      if (f.frozen > 0) { c.strokeStyle = "#9ec3ff"; c.lineWidth = 4; c.beginPath(); c.arc(f.x, f.y - 30, 36, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(f.frozen / 3, 0, 1)); c.stroke(); }
    } else if (e.m) {
      drawChar(c, "moraes", m.x, m.y + 6, 1.05, { t: t, moving: m.moving, flip: m.face < 0, stun: m.stun > 0 });
      if (g.ofT > 0) { c.save(); c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(255,255,255,.6)"; c.lineWidth = 2; for (j = 1; j <= 3; j++) { c.beginPath(); c.moveTo(m.x - 28 - j * 16, m.y - 10 - j * 3); c.lineTo(m.x - 60 - j * 16, m.y - 10 - j * 3); c.stroke(); } c.restore(); }
      // mira
      c.strokeStyle = "rgba(158,195,255,.35)"; c.lineWidth = 2; c.setLineDash([4, 6]); c.beginPath(); c.moveTo(m.x + m.aim.x * 30, m.y - 30 + m.aim.y * 30); c.lineTo(m.x + m.aim.x * 80, m.y - 30 + m.aim.y * 80); c.stroke(); c.setLineDash([]);
    } else {
      n = e.n;
      if (n.kind === "decoy") drawChar(c, "flavio", n.x, n.y + 6, 1.0, { t: t + n.x, moving: true, flip: n.face < 0, tie: "#ff7a1a", hair: "#6b4a2a" });
      else drawChar(c, "npc", n.x, n.y + 6, 0.95, { t: t + n.x, moving: true, flip: n.face < 0, shirt: n.shirt, hair: n.hair, skin: n.skin });
    }
  }
  // raio da canetada
  if (g.beam) { var bm = g.beam; c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = clamp(bm.t * 5, 0, 1); c.strokeStyle = "#7fb0ff"; c.lineWidth = 9; c.lineCap = "round"; c.beginPath(); c.moveTo(bm.x0, bm.y0); c.lineTo(bm.x1, bm.y1); c.stroke(); c.strokeStyle = "#fff"; c.lineWidth = 3; c.stroke(); c.restore(); }
  // projéteis
  for (i = 0; i < g.projs.length; i++) {
    var p = g.projs[i]; c.save(); c.translate(p.x, p.y);
    if (p.k === "toga") { c.rotate(p.rot); c.fillStyle = "#0b0b10"; c.beginPath(); c.moveTo(-18, -4); c.lineTo(0, -16); c.lineTo(18, -4); c.lineTo(10, 14); c.lineTo(-10, 14); c.closePath(); c.fill(); c.strokeStyle = "#8fb4ff"; c.lineWidth = 1.5; c.stroke(); c.fillStyle = "#fff"; c.fillRect(-4, -8, 8, 6); }
    else if (p.k === "fcartaz") { c.rotate(p.rot); c.fillStyle = "#fff"; c.fillRect(-18, -11, 36, 22); c.strokeStyle = "#c62828"; c.lineWidth = 2; c.strokeRect(-18, -11, 36, 22); c.fillStyle = "#c62828"; c.font = "bold 8px Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("FORA PT", 0, 0); }
    else { c.fillStyle = "#fff59d"; c.beginPath(); for (j = 0; j < 10; j++) { var q = j % 2 ? 4 : 9, aa = j / 10 * TAU + p.rot; c.lineTo(Math.cos(aa) * q, Math.sin(aa) * q); } c.closePath(); c.fill(); }
    c.restore();
  }
  if (g.aimT) { c.strokeStyle = "rgba(255,80,80,.8)"; c.lineWidth = 2; c.setLineDash([5, 5]); c.beginPath(); c.moveTo(f.x, f.y - 24); c.lineTo(m.x, m.y - 24); c.stroke(); c.setLineDash([]); }
  drawParts(c);
  var all = g.npcs.concat(g.decoys);
  for (i = 0; i < all.length; i++) { n = all[i]; if (n.balloon) { var scx = n.x - camx, scy = n.y - camy - 70; if (scx > -20 && scx < W + 20 && scy > -20 && scy < H + 90) balloon(c, n.balloon.s, n.x, n.y - 70, { size: 13, maxW: 140, limitW: MP.W, alpha: clamp(n.balloon.t * 2, 0, 1) }); } }
  if (g.quipF) balloon(c, g.quipF.s, f.x, f.y - 90, { size: 13, maxW: 130, limitW: MP.W });
  if (g.quipM) balloon(c, g.quipM.s, m.x, m.y - 80, { size: 13, maxW: 140, limitW: MP.W, bg: "#dfe8ff" });
  drawPops(c);
  c.restore();
  // seta apontando o Flávio (fora da tela)
  if (!hidden && g.reveal > 0) {
    var fsx = f.x - camx, fsy = f.y - camy;
    if (fsx < 20 || fsx > W - 20 || fsy < 90 || fsy > H - 40) {
      var ang = Math.atan2(f.y - m.y, f.x - m.x), ax = clamp(W / 2 + Math.cos(ang) * 440, 40, W - 40), ay = clamp(H / 2 + Math.sin(ang) * 230, 110, H - 60);
      c.save(); c.translate(ax, ay); c.rotate(ang); c.fillStyle = "rgba(255,223,0,.9)"; c.strokeStyle = "#000"; c.lineWidth = 2; c.beginPath(); c.moveTo(14, 0); c.lineTo(-8, -10); c.lineTo(-8, 10); c.closePath(); c.fill(); c.stroke(); c.restore();
    }
  }
  // sirene quando está perto
  var dd = Math.hypot(f.x - m.x, f.y - m.y);
  if (dd < 200 || g.ofT > 0) { var on2 = Math.floor(t * 4) % 2 === 0, sa = .13; c.save(); c.globalCompositeOperation = "lighter";
    var sg = c.createLinearGradient(0, 0, 200, 0); sg.addColorStop(0, on2 ? "rgba(255,30,30," + sa + ")" : "rgba(40,90,255," + sa + ")"); sg.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = sg; c.fillRect(0, 0, 200, H);
    var sg2 = c.createLinearGradient(W, 0, W - 200, 0); sg2.addColorStop(0, on2 ? "rgba(40,90,255," + sa + ")" : "rgba(255,30,30," + sa + ")"); sg2.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = sg2; c.fillRect(W - 200, 0, 200, H); c.restore(); }
  // linhas de velocidade do ofício urgente
  if (g.ofT > 0) { c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 1.5; for (i = 0; i < 16; i++) { var lx = wrapX(i * 131 - t * 900, W + 200) - 100, ly = 60 + hash(i + 3) * 440; c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx + 70, ly); c.stroke(); } }
  var vg = c.createRadialGradient(W / 2, H / 2, 280, W / 2, H / 2, 650); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,20,.4)"); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  if (g.fBlock > 0) { c.fillStyle = "rgba(60,100,220," + (.07 + .03 * Math.sin(t * 8)) + ")"; c.fillRect(0, 0, W, H); }
  if (fx.flash > 0) { c.fillStyle = "rgba(" + fx.fcol + "," + fx.flash.toFixed(2) + ")"; c.fillRect(0, 0, W, H); }
}

/* ================= HUD ================= */
function panel(c, x, y, w, h) { c.fillStyle = "rgba(4,8,24,.62)"; rr(c, x, y, w, h, 10); c.fill(); c.strokeStyle = "rgba(255,255,255,.14)"; c.lineWidth = 1; c.stroke(); }
var MEDALCOL = { ouro: "#ffd54f", prata: "#cfd8dc", bronze: "#d08a50" };
function drawMedalDot(c, x, y, r, m) { c.fillStyle = MEDALCOL[m]; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.strokeStyle = "rgba(0,0,0,.5)"; c.lineWidth = 1.5; c.stroke(); c.fillStyle = "rgba(255,255,255,.45)"; c.beginPath(); c.arc(x - r * .3, y - r * .3, r * .35, 0, TAU); c.fill(); }
function slotRect(i) { return { x: W / 2 - 112 + i * 46 + (i === 4 ? 10 : 0), y: 500 }; }
function drawSlots(c) {
  var fl = g.mode === "flavio", defs = fl ? FP : MPOW, keys2 = ["J", "K", "L", "I"], i;
  for (i = 0; i < 5; i++) {
    var s = slotRect(i), sp = i === 4, cdv = sp ? 0 : g.cds[i], cdmax = sp ? 1 : defs[i].cd, cost = sp ? 0 : defs[i].cost;
    var blocked = fl ? g.xblock > 0 : false, ready = sp ? g.sp >= 100 : (g.cds[i] <= 0 && g.en >= cost), size = 38;
    c.save(); c.fillStyle = "rgba(4,8,24,.78)"; rr(c, s.x, s.y, size, size, 8); c.fill();
    c.strokeStyle = blocked ? "#ff6b6b" : sp ? (ready ? "#ff7043" : "rgba(255,112,67,.4)") : ready ? "#ffdf00" : "rgba(255,255,255,.25)"; c.lineWidth = ready && !blocked ? 2.5 : 1.5; c.stroke();
    c.globalAlpha = ready && !blocked ? 1 : .45; txt(c, sp ? (fl ? "☎" : "📄") : defs[i].ic, s.x + size / 2, s.y + size / 2 - 1, 18, "#fff", "center"); c.globalAlpha = 1;
    if (!sp && cdv > 0) { c.fillStyle = "rgba(0,0,0,.6)"; c.fillRect(s.x + 1, s.y + 1, size - 2, (size - 2) * clamp(cdv / cdmax, 0, 1)); }
    if (sp) { c.fillStyle = "rgba(255,112,67,.5)"; c.fillRect(s.x + 2, s.y + size - 3 - (size - 5) * g.sp / 100, size - 4, 0); }
    txt(c, sp ? "ESP" : keys2[i], s.x + size - 7, s.y + size - 6, 10, "#ffdf00", "center", "rgba(0,0,0,.8)");
    if (blocked) { txt(c, "X", s.x + size / 2, s.y + size / 2, 26, "rgba(255,80,80,.9)", "center", "rgba(0,0,0,.7)"); }
    c.restore();
  }
  // barras de energia e especial
  var ex = W / 2 - 250, ey = 508;
  txt(c, "ENERGIA", ex, ey - 2, 9, "#9aa0b4"); c.fillStyle = "rgba(255,255,255,.12)"; rr(c, ex, ey + 6, 128, 11, 5); c.fill();
  c.fillStyle = g.en < 25 ? "#ff7043" : "#4fc3f7"; rr(c, ex, ey + 6, Math.max(6, 128 * g.en / 100), 11, 5); c.fill();
  var sx2 = W / 2 + 128;
  txt(c, fl ? "LIGAR PRO TRUMP" : "OFÍCIO URGENTE", sx2, ey - 2, 9, "#9aa0b4"); c.fillStyle = "rgba(255,255,255,.12)"; rr(c, sx2, ey + 6, 128, 11, 5); c.fill();
  c.fillStyle = g.sp >= 100 ? (Math.floor(g.anim * 6) % 2 ? "#ffab40" : "#ff7043") : "#ffa726"; rr(c, sx2, ey + 6, Math.max(6, 128 * g.sp / 100), 11, 5); c.fill();
}
function drawVoice(c) {
  var v = voice.cur; if (!v) return;
  var now = voice.clock, age = (now - v.start) / 1000, a = clamp(age * 6, 0, 1) * clamp((v.end - now) / 300, 0, 1);
  c.save(); c.globalAlpha = a; c.font = "bold 14px 'Trebuchet MS', Arial, sans-serif";
  var lines = wrap(c, "“" + v.tx + "”", 270), w = 0, i; for (i = 0; i < lines.length; i++) w = Math.max(w, c.measureText(lines[i]).width);
  w = Math.max(w + 22, 150); var h = lines.length * 18 + 14, x = 80, y = 118 + (1 - a) * 6, vk = WHOKIND[v.who];
  if (vk) { portraitCard(c, vk, 10, y - 14, 62, 62, { r: 12, lw: 2.5, talk: age < (v.end - v.start) / 1000 - .4 ? Math.abs(Math.sin(age * 13)) : 0 }); }
  c.fillStyle = "#ffdf00"; rr(c, x, y - 16, Math.min(w, 260), 18, 6); c.fill(); txt(c, (muted ? "🔇 " : "🔊 ") + v.who, x + 8, y - 6, 11, "#1a1a1a");
  c.fillStyle = "#fff"; c.strokeStyle = "#111"; c.lineWidth = 2.5; rr(c, x, y + 4, w, h, 10); c.fill(); c.stroke();
  c.fillStyle = "#111"; c.textAlign = "left"; c.textBaseline = "middle"; for (i = 0; i < lines.length; i++) c.fillText(lines[i], x + 11, y + 4 + 7 + 9 + i * 18);
  c.restore();
}
function drawHUD(c) {
  var s = state, i, fl = g.mode === "flavio";
  panel(c, 10, 8, 200, 56);
  txt(c, "PONTOS", 20, 22, 11, "#9aa0b4"); txt(c, String(s.score), 20, 44, 24, "#ffdf00");
  txt(c, "RECORDE " + Math.max(s.best[s.side] || 0, 0), 120, 22, 10, "#9aa0b4");
  if (g.mult > 1) { txt(c, "x" + g.mult, 196, 44, 22, "#ff8a65", "right", "rgba(0,0,0,.6)"); }
  if (g.combo > 0) { c.fillStyle = "rgba(255,255,255,.15)"; c.fillRect(14, 58, 190, 3); c.fillStyle = "#ff8a65"; c.fillRect(14, 58, 190 * clamp(g.comboT / (fl ? 4.2 : 5), 0, 1), 3); txt(c, "combo " + g.combo, 120, 44, 10, "#ffccbc"); }
  var label = fl ? "ETAPA " + (g.stage + 1) + "/4 · " + STAGES[g.stage].name : "RODADA " + (g.round + 1) + "/4" + (g.phase ? "B" : "A") + " · " + ROUNDS[g.round].name;
  txt(c, label, 14, 76, 11, "#e8e6dc", "left", "rgba(0,0,0,.7)");
  if (fl) {
    var frac = clamp(g.clock / FL.limit, 0, 1), mm = Math.min(59, Math.floor(frac * 60)), clock = g.clock >= FL.limit ? "23h00" : "22h" + pad2(mm);
    panel(c, W / 2 - 90, 8, 180, 56);
    txt(c, "NOITE · FRONTEIRA FECHA 23h", W / 2, 20, 9, "#9aa0b4", "center");
    txt(c, clock, W / 2, 44, 30, frac > .8 ? "#ff6b6b" : "#fff", "center");
    panel(c, W - 210, 8, 200, 56);
    for (i = 0; i < 3; i++) drawHeart(c, W - 190 + i * 30, 26, 11, i < g.hearts ? "#ff3b4a" : "rgba(255,255,255,.18)");
    txt(c, "CHANCES", W - 20, 22, 9, "#9aa0b4", "right");
    for (i = 0; i < 3; i++) { c.fillStyle = i < g.lives ? "#ffdf00" : "rgba(255,255,255,.15)"; c.beginPath(); c.arc(W - 74 + i * 20, 42, 6, 0, TAU); c.fill(); }
    if (g.boost > 0) txt(c, "TURBO!", W - 190, 52, 11, "#ffcc80");
    // progresso em 4 etapas
    var bx = 250, bw = W - 500, by = 84, seg = bw / 4;
    c.fillStyle = "rgba(0,0,0,.45)"; rr(c, bx, by, bw, 8, 4); c.fill();
    c.fillStyle = "#ffdf00"; rr(c, bx, by, Math.max(8, bw * clamp(state.progress, 0, 1)), 8, 4); c.fill();
    for (i = 0; i <= 4; i++) { c.fillStyle = "#fff"; c.fillRect(bx + i * seg - 1, by - 3, 2, 14); }
    for (i = 0; i < 4; i++) { c.fillStyle = "rgba(105,240,174,.9)"; c.fillRect(bx + (i + .5) * seg - 1, by - 1, 2, 10); txt(c, String(i + 1), bx + (i + .5) * seg, by + 20, 9, "#cfd3e2", "center"); if (g.medals[i]) drawMedalDot(c, bx + (i + 1) * seg - 9, by - 10, 6, g.medals[i].medal); }
    txt(c, "BR", bx - 14, by + 4, 10, "#9ec97a", "center"); txt(c, "AR ✈", bx + bw + 20, by + 4, 10, "#8fd0ff", "center");
    if (g.xwarn > 0) { c.fillStyle = "rgba(180,20,20,.85)"; rr(c, W / 2 - 190, 128, 380, 34, 8); c.fill(); txt(c, "⚠ MORAES VAI BLOQUEAR O X!", W / 2, 145, 17, "#fff", "center"); }
    else if (g.xblock > 0) { c.fillStyle = "rgba(20,40,120,.85)"; rr(c, W / 2 - 190, 128, 380, 30, 8); c.fill(); txt(c, "X BLOQUEADO — poderes off " + g.xblock.toFixed(1) + "s", W / 2, 143, 15, "#cfe0ff", "center"); }
  } else {
    var tl = Math.max(0, g.rt), d = Math.hypot(g.f.x - g.m.x, g.f.y - g.m.y);
    panel(c, W / 2 - 80, 8, 160, 56);
    txt(c, "TEMPO DA RODADA", W / 2, 20, 9, "#9aa0b4", "center"); txt(c, Math.floor(tl / 60) + ":" + pad2(Math.floor(tl % 60)), W / 2, 44, 30, tl < 12 ? "#ff6b6b" : "#fff", "center");
    panel(c, W - 230, 8, 220, 56);
    var hid = g.f.disg > 0 && g.reveal <= 0;
    var temp = hid ? "???" : d < 260 ? "QUENTE!" : d < 560 ? "MORNO" : "FRIO", tc = hid ? "#ef9a9a" : d < 260 ? "#ff7043" : d < 560 ? "#ffd54f" : "#80d8ff";
    txt(c, "TERMÔMETRO", W - 220, 22, 9, "#9aa0b4"); txt(c, temp, W - 220, 44, 20, tc);
    c.fillStyle = "rgba(255,255,255,.12)"; rr(c, W - 118, 34, 90, 10, 5); c.fill(); c.fillStyle = tc; rr(c, W - 118, 34, hid ? 20 : Math.max(6, 90 * clamp(1 - d / 1100, 0, 1)), 10, 5); c.fill();
    txt(c, "TENTATIVAS " + g.lives, W - 20, 22, 10, "#cfe0ff", "right");
    var bx2 = 250, bw2 = W - 500, by2 = 84, seg2 = bw2 / 4;
    c.fillStyle = "rgba(0,0,0,.45)"; rr(c, bx2, by2, bw2, 8, 4); c.fill(); c.fillStyle = "#8fb4ff"; rr(c, bx2, by2, Math.max(8, bw2 * clamp(state.progress, 0, 1)), 8, 4); c.fill();
    for (i = 0; i <= 4; i++) { c.fillStyle = "#fff"; c.fillRect(bx2 + i * seg2 - 1, by2 - 3, 2, 14); }
    for (i = 0; i < 4; i++) { txt(c, String(i + 1), bx2 + (i + .5) * seg2, by2 + 20, 9, "#cfd3e2", "center"); if (g.medals[i]) drawMedalDot(c, bx2 + (i + 1) * seg2 - 9, by2 - 10, 6, g.medals[i].medal); }
    txt(c, g.f.disg > 0 && g.reveal <= 0 ? "Boné vermelho = Flávio disfarçado" : "Gravata amarela = Flávio", W / 2, 112, 11, "#fff", "center", "rgba(0,0,0,.7)");
    if (g.fBlock > 0) { c.fillStyle = "rgba(20,40,120,.85)"; rr(c, W / 2 - 190, 126, 380, 30, 8); c.fill(); txt(c, "X BLOQUEADO — poderes do Flávio off " + g.fBlock.toFixed(1) + "s", W / 2, 141, 14, "#cfe0ff", "center"); }
  }
  drawSlots(c);
  txt(c, "“" + state.meme + "”", 14, H - 14, 10, "rgba(255,255,255,.6)", "left", "rgba(0,0,0,.6)");
  for (i = 0; i < g.toasts.length; i++) { var to = g.toasts[i]; c.globalAlpha = clamp(to.t * 2, 0, 1); txt(c, to.s, W / 2, 180 + i * 26, 17, to.col, "center", "rgba(0,0,0,.75)"); }
  c.globalAlpha = 1;
  drawVoice(c);
}
function ease(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
function drawTrans(c) {
  var tr = g.trans; if (!tr) return;
  var t = tr.t, d = tr.dur, fl = g.mode === "flavio";
  if (tr.k === "intro") {
    var inn = ease(t / .45), out = ease((t - (d - .5)) / .5), bar = 54 * inn * (1 - out);
    c.fillStyle = "#000"; c.fillRect(0, 0, W, bar); c.fillRect(0, H - bar, W, bar);
    var wipe = t < .55 ? 1 - ease(t / .55) : t > d - .45 ? ease((t - (d - .45)) / .45) : 0;
    if (wipe > 0) { var cols = ["#00a651", "#ffdf00", "#1b3a8a"]; for (var i = 0; i < 3; i++) { c.fillStyle = cols[i]; c.beginPath(); var xo = (t < .55 ? 1 : -1) * wipe * (W + 300), yy = i * H / 3; c.moveTo(-100 + xo * (i % 2 ? -1 : 1), yy); c.lineTo(W + 100 + xo * (i % 2 ? -1 : 1), yy); c.lineTo(W + 40 + xo * (i % 2 ? -1 : 1), yy + H / 3 + 4); c.lineTo(-160 + xo * (i % 2 ? -1 : 1), yy + H / 3 + 4); c.closePath(); c.fill(); } }
    var a = clamp(Math.min(t / .5, (d - t) / .4), 0, 1), nm = fl ? STAGES[g.stage].name : ROUNDS[g.round].name, sub = fl ? STAGES[g.stage].sub : ROUNDS[g.round].intro;
    c.save(); c.globalAlpha = a; var sx = lerp(-260, W / 2, ease((t - .1) / .5)); if (t > d - .5) sx = lerp(W / 2, W + 300, ease((t - (d - .5)) / .5));
    c.fillStyle = "rgba(0,0,0,.55)"; c.fillRect(0, 190, W, 130);
    txt(c, (fl ? "ETAPA " : "RODADA ") + (fl ? g.stage + 1 : g.round + 1) + " / 4", sx, 216, 20, "#ffdf00", "center", "#000");
    txt(c, nm.toUpperCase(), sx, 256, 38, "#fff", "center", "#000");
    txt(c, sub, sx, 296, 16, "#cfd6f0", "center", "#000");
    if (fl && g.stage === 0) txt(c, "J ✋ arminha · K 📖 Bíblia · L 🪧 cartaz · I 🧢 boné · ␣ especial", W / 2, 350, 13, "#fff", "center", "rgba(0,0,0,.7)");
    if (!fl && g.round === 0) txt(c, "J 🖋 canetada · K 🥋 toga · L 🚫 bloqueio do X · I 📚 inquérito · ␣ ofício", W / 2, 350, 13, "#fff", "center", "rgba(0,0,0,.7)");
    c.restore();
  } else if (tr.k === "medal") {
    var m = tr.m, pin = ease(t / .4), pout = ease((t - (d - .4)) / .4);
    c.fillStyle = "rgba(0,0,0," + (.6 * pin * (1 - pout)) + ")"; c.fillRect(0, 0, W, H);
    c.save(); c.translate(W / 2, H / 2); var sc = (.7 + .3 * pin) * (1 - pout * .3); c.scale(sc, sc); c.globalAlpha = pin * (1 - pout);
    c.fillStyle = "#0b1230"; rr(c, -230, -140, 460, 280, 16); c.fill(); c.strokeStyle = "#ffdf00"; c.lineWidth = 3; c.stroke();
    txt(c, (fl ? "ETAPA " : "RODADA ") + m.stage + " CONCLUÍDA!", 0, -108, 24, "#ffdf00", "center");
    txt(c, m.name, 0, -80, 14, "#cfd6f0", "center");
    var bounce = ease((t - .25) / .35); drawMedalDot(c, 0, -10, 46 * bounce, m.medal);
    txt(c, "MEDALHA DE " + m.medal.toUpperCase(), 0, 54, 20, MEDALCOL[m.medal], "center", "#000");
    txt(c, fl ? "tempo " + m.time + "s · hits " + m.hits + " · raspões " + m.near + (m.killed ? " · chefe derrotado" : "") : "tempo " + m.time + "s · pontos +" + m.pts, 0, 84, 13, "#fff", "center");
    txt(c, "pontos totais: " + state.score, 0, 108, 14, "#69f0ae", "center");
    c.restore();
  } else if (tr.k === "respawn") {
    var fa = t < .35 ? t / .35 : t < .8 ? 1 : 1 - (t - .8) / .9;
    c.fillStyle = "rgba(255,255,255," + (.7 * clamp(fa, 0, 1)) + ")"; c.fillRect(0, 0, W, H);
    c.save(); c.globalAlpha = clamp(fa * 1.5, 0, 1); c.fillStyle = "rgba(0,0,0,.65)"; c.fillRect(0, 200, W, 110);
    txt(c, "VOLTANDO AO CHECKPOINT", W / 2, 236, 28, "#69f0ae", "center"); txt(c, "chances restantes: " + g.lives, W / 2, 278, 18, "#fff", "center"); c.restore();
  } else if (tr.k === "phase") {
    var pa = clamp(Math.min(t / .25, (d - t) / .4), 0, 1);
    c.fillStyle = "rgba(0,0,0," + (.5 * pa) + ")"; c.fillRect(0, 170, W, 150);
    c.save(); c.globalAlpha = pa; txt(c, "ERA UM SÓSIA!", W / 2, 215, 40, "#ffcc80", "center", "#000"); txt(c, "O Flávio de verdade fugiu · fase B (+28s) · ele está mais rápido", W / 2, 262, 17, "#fff", "center", "#000"); txt(c, "dica: Bloqueio do X e Inquérito Infinito ajudam", W / 2, 292, 13, "#cfd6f0", "center", "#000"); c.restore();
  } else if (tr.k === "retry") {
    var ra = clamp(Math.min(t / .3, (d - t) / .4), 0, 1);
    c.fillStyle = "rgba(0,0,0," + (.55 * ra) + ")"; c.fillRect(0, 0, W, H);
    c.save(); c.globalAlpha = ra; txt(c, "PRAZO ESTOURADO!", W / 2, 230, 36, "#ff6b6b", "center", "#000"); txt(c, "nova tentativa · restam " + g.lives, W / 2, 280, 20, "#fff", "center", "#000"); c.restore();
  }
}

/* ================= ranking / fim de jogo (fase 5) ================= */
var RANKS = {
  flavio: { S: "Lenda do Jatinho", A: "Mestre da Fuga", B: "Fujão Raiz", C: "Turista Suspeito", D: "Fujão de Domingo", fail: "Quase-Fujão" },
  moraes: { S: "Xerife Supremo", A: "Mestre das Canetadas", B: "Perseguidor Raiz", C: "Estagiário do Gabinete", D: "Plantonista Cansado", fail: "Wally Segue Sumido" }
};
var THR = { flavio: [35000, 22000, 12000, 6000], moraes: [30000, 22000, 14000, 7000] };   // S, A, B, C
function letterFor(side, sc) { var t = THR[side]; return sc >= t[0] ? "S" : sc >= t[1] ? "A" : sc >= t[2] ? "B" : sc >= t[3] ? "C" : "D"; }
function liveRank() { var side = state.side || "flavio"; return RANKS[side][letterFor(side, state.score)]; }
var P5PERF = { S: .95, A: .8, B: .65, C: .5, D: .35 };

function endGame(won, why) {
  if (state.over) return;
  if (!g) { startP5("flavio"); }
  state.over = true; state.won = won; state.running = false; state.screen = "over"; state.paused = false; g.why = why; g.trans = null;
  var side = state.side, sc, i;
  if (side === "flavio") {
    if (won) { g.pts += 1000 + Math.floor(Math.max(0, FL.limit - g.clock) * 8) + g.hearts * 150 + g.lives * 200; }
    sc = Math.max(0, fScore());
  } else {
    if (won) g.pts += 800 + g.lives * 250;
    sc = Math.max(0, Math.floor(g.pts));
  }
  state.score = sc;
  var letter = won ? letterFor(side, sc) : (letterFor(side, sc) === "D" ? "D" : "C");
  var title = won ? RANKS[side][letter] : RANKS[side].fail, line;
  state.rankLetter = letter; state.rank = title;
  if (side === "flavio") {
    if (won) line = "Embarcou no jatinho com " + g.medals.length + " medalhas! (só no joguinho, claro)";
    else {
      var S = STAGES[g.stage], rest = Math.max(0, S.len - g.px); for (i = g.stage + 1; i < 4; i++) rest += STAGES[i].len; if (g.boss) rest += 600;
      var mt = Math.max(1, Math.round(rest / FL.pxPerM));
      if (g.boss && !g.boss.dead && why !== "tempo") line = "A PF te alcançou no chefe da etapa " + (g.stage + 1) + " (" + g.boss.name.toLowerCase() + ")! Faltaram " + mt + " metros... e uma boa desculpa.";
      else line = (why === "tempo" ? "Deu 23h e a fronteira fechou! " : "A PF te alcançou na etapa " + (g.stage + 1) + " (" + S.name + ")! ") + "Faltaram " + mt + " metros pro jatinho!";
    }
  } else {
    if (won) line = "Pegou o Flávio nas 4 rodadas, com " + g.lives + " tentativa(s) de sobra! " + (g.medals.length ? "Medalhas: " + g.medals.map(function (m) { return m.medal; }).join(", ") + "." : "");
    else line = "Prazo estourado na rodada " + (g.round + 1) + " (" + ROUNDS[g.round].name + ")! Faltaram " + Math.max(1, Math.round(g.closest / 10)) + " metros pra alcançar o Flávio!";
  }
  state.title = title; state.line = line; state.tier = letter;
  var prevBest = state.best[side] || 0, isNew = sc > prevBest;
  if (isNew) { state.best[side] = sc; saveBest(side, sc); }
  state.newBest = isNew;
  sfx(won ? "win" : "lose");
  vox(won ? "victory" : "gameover", { prio: 5 });
  var camp = META.camp || (side === "moraes" ? "lula" : "flavio");
  var perf = P5PERF[letter] || .5, medal = won ? medalFor(perf) : null;
  var rec = recordPhase(camp, 5, sc, medal, won);
  var gm = []; for (i = 0; i < g.medals.length; i++) gm.push(g.medals[i].medal === "ouro" ? "g" : g.medals[i].medal === "prata" ? "y" : "r");
  showResult({ n: 5, camp: camp, won: won, raw: sc, sc: rec.sc, title: title, line: line, letter: letter, medal: medal, isNew: rec.isNew, prev: rec.prev,
    total: rec.total, grid: gm, daily: false, meme: state.meme, p5: side });
}

function startP5(side) {
  side = /mor|persegu|ale/.test(String(side || "").toLowerCase()) ? "moraes" : "flavio";
  ac(); sfx("select"); injected = null; SCN = null; state.runT = 0; chalHide();
  state.side = side; state.phase = 5; state.over = false; state.won = null; state.score = 0; state.hearts = 3; state.progress = 0; state.newBest = false; state.paused = false; state.stage = 1;
  state.meme = pick(MEMES).t; state.running = true; state.screen = "play"; state.title = ""; state.line = ""; state.tier = null; state.rank = ""; state.rankLetter = "";
  state.timeLeft = side === "flavio" ? FL.limit : ROUNDS[0].limit;
  $("menu").classList.add("hidden"); $("map").classList.add("hidden"); $("result").classList.add("hidden"); $("pause").textContent = "⏸"; $("pause").classList.add("on");
  if (coarseMQ.matches) $("touch").classList.add("on");
  setPBIcons(side); joyReset();
  if (side === "flavio") startFlavio(); else startMoraes();
  warmVoices(side === "flavio" ? ["nunca", "calar", "hoje", "sistema"] : ["moraesPF", "hoje", "regular", "humilha"]);
  return state;
}
function setPBIcons(side) {
  var ic = side === "moraes" ? ["🖋", "🥋", "🚫", "📚", "★"] : ["✋", "📖", "🪧", "🧢", "★"];
  pbEls.forEach(function (b, i) { b.querySelector("b").textContent = ic[i]; });
}
