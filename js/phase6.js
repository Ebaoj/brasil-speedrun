"use strict";
/* ================= Fase 6 — Governar é pior =================
   Esteira de carimbo (3 pistas). Lula: Planalto, projetos e emendas jabuti, REGULAÇÃO DAS REDES (o jogo é censurado).
   Flávio: imigração em Miami, passaportes com/sem visto, "visto carimbado", cameo do Eduardo.
   Chefe: Plenário do Centrão. Final compartilhado: o Congresso bloqueia TUDO. Final secreto: quem zerou os dois lados. */

var P6_LY = [165, 255, 345];
var P6_ZL = 130, P6_ZR = 470, P6_IW = 132;
var P6_TXT = {
  lula: {
    good: ["PL da Picanha Popular", "Reforma Tributária 2.0", "Passe Livre do Busão", "Bolsa Cafezinho", "Lei do Pão de Queijo", "Mais Médicos do Zap", "PEC da Fila do Pix", "Auxílio Marmita", "Imposto do Churrasco: ZERO", "Feriado Prolongado Nacional"],
    bad: ["Emenda Jabuti: +1 Ministério", "Jabuti: Piscina no Gabinete", "Jabuti: Verba pro Pedalinho", "Emenda: Cargo pro Primo", "Jabuti: Jetski Institucional"],
    badIc: "🐢", goodIc: "📜", special: "REGULAÇÃO DAS REDES", rush: "CANETA DE OURO", smooth: "CAFEZINHO DO PLANALTO", smIc: "☕", rushIc: "🖊",
    stampOk: "APROVADO", stampBad: "JABUTI!", where: "Palácio do Planalto · Mesa da Presidência"
  },
  flavio: {
    good: ["Passaporte COM visto ✓", "Turista: visto OK ✓", "Visto B1/B2 válido ✓", "Passaporte + visto + sorriso", "Visto carimbado ✓ (de verdade)", "Mochila, chinelo e visto ✓"],
    bad: ["Passaporte SEM visto ✗", "Visto vencido ✗", "Passaporte do Wally ✗", "Esqueceu o visto em casa ✗", "Visto de outra pessoa ✗"],
    badIc: "🚫", goodIc: "🛂", special: "GREEN CARD (EDUARDO MANDOU)", rush: "VISTO CARIMBADO", smooth: "SMOOTHIE DE MIAMI", smIc: "🥤", rushIc: "🛂",
    stampOk: "VISTO OK", stampBad: "SEM VISTO!", where: "Aeroporto de Miami · Imigração"
  }
};
var P6_FOEPOW = { lula: "Centrão", flavio: "Centrão" };

SCEN[6] = function (S) {
  var camp = S.camp, T = P6_TXT[camp], fl = camp === "flavio";
  var P = { ph: "play", items: [], sp: .6, bossSp: 0, evI: 0, lastLane: -1, rush: 0, slow: 0, boss: null, bossInit: false,
    stampT: [0, 0, 0], whiff: [0, 0, 0], ok: 0, wrong: 0, missed: 0, missRun: 0, winHits: 0, nextWin: 14, cameo: null, bossWin: false,
    page: 0, pt: 0, secret: false, pageFlags: {}, specialDone: false, bannerT: 0, tt: 0, ended: false, blockMsg: 0 };
  S.lives = 3; S.maxLives = 3; S.time = 140; S.timeMax = 140;
  var EV = fl ? [[16, "rush"], [30, "special"], [47, "cameo"], [70, "rush"], [88, "rush"]] : [[16, "rush"], [30, "special"], [50, "smooth"], [68, "rush"], [88, "rush"]];

  function speed() { var pr = clamp(S.t / 140, 0, 1); return lerp(150, 275, pr) * (P.slow > 0 ? .6 : 1); }
  function laneBlocked(l) { var b = P.boss; return !!(b && b.blockLeft > 0 && b.blockLane === l); }
  function mk(lane, kind, label) { var it = { lane: lane, x: 1010, y: P6_LY[lane], kind: kind, label: label, done: 0, stamped: false, w: P6_IW, bm: RNG() < .04, bw: RNG() < .012, rt: rnd(0, 130), a: 1 };
    P.items.push(it); return it; }
  function freeLane() {
    var order = [0, 1, 2].sort(function () { return RNG() - .5; });
    for (var k = 0; k < 3; k++) { var l = order[k], ok = true; for (var i = 0; i < P.items.length; i++) if (P.items[i].lane === l && P.items[i].x > 1010 - 230) ok = false; if (ok && l !== P.lastLane) { P.lastLane = l; return l; } }
    return -1;
  }
  function spawnNormal() {
    var l = freeLane(); if (l < 0) return;
    if (RNG() < .3) mk(l, "bad", pick(T.bad)); else mk(l, "good", pick(T.good));
  }
  function spawnKind(kind) {
    var l = freeLane(); if (l < 0) { l = (RNG() * 3) | 0; }
    var lab = kind === "special" ? T.special : kind === "rush" ? T.rush : kind === "smooth" ? T.smooth : "EMENDA DE PLENÁRIO";
    mk(l, kind, lab);
  }
  function lifeLoss(why) {
    S.lives--; S.hit(); P.winHits++; shake(7); flashScr("255,40,40", .45); sfx("nope");
    if (S.lives <= 0 && P.ph !== "over") {
      P.ph = "over"; S.hudHide = false;
      S.end(false, clamp(.15 + .3 * (S.t / 140), 0, .45), fl ? "Sem visto, sem paciência: a imigração de Miami te barrou. (Em Brasília, o Centrão também ia barrar.)" : "Carimbou jabuti demais: o Centrão agradeceu e te deixou sem pauta.", { failTitle: fl ? "Barrado em Miami" : "Refém do Centrão", voiceLose: fl ? "sistema" : "hoje" });
    }
  }
  function stampItem(it, auto) {
    if (it.stamped || it.done > 0) return false;
    if (laneBlocked(it.lane)) { popup("BLOQUEADO!", it.x, it.y - 40, "#ff6b6b", 16); sfx("nope"); return false; }
    it.stamped = true; it.done = .5; P.stampT[it.lane] = .25;
    var k = P.rush > 0 ? 2 : 1, x = clamp(it.x, 140, 900), y = it.y;
    sfx("stamp");
    if (it.kind === "good") {
      S.up(x, y - 40); S.add(25 * k, x, y - 30, "#69f0ae"); P.ok++; P.missRun = 0; burst(x, y, "#69f0ae", 10, 120); it.mark = T.stampOk;
    } else if (it.kind === "bad") {
      it.mark = T.stampBad; it.badMark = true; popup(T.stampBad, x, y - 36, "#ff6b6b", 22); burst(x, y, "#ff6b6b", 14, 150); P.wrong++; lifeLoss("bad");
      if (P.ph === "over") return true;
    } else if (it.kind === "special") {
      S.add(200 * k, x, y - 30, "#ffd54f"); S.up(x, y); it.mark = "APROVADO!"; ring(x, y, "#ffd54f", 10); P.ok++;
      if (!fl) {
        S.censor = 6; say("regular", "regulacao", 6); say("crimeDig", "regulacao", 5);
        S.toast("REGULAÇÃO APROVADA… e o jogo foi [CENSURADO]!", "#ffcc80", 3.2); flashScr("0,0,0", .6); shake(8);
      } else { S.toast("Green card! (o Eduardo mandou)", "#ffcc80", 2.6); }
      P.specialDone = true;
    } else if (it.kind === "emenda") {
      var b = P.boss; it.mark = "EMENDA!";
      if (b && !b.dead) { b.hp = Math.max(0, b.hp - 9); b.hit = .4; shake(9); S.add(80 * k, x, y - 30, "#ffd54f"); S.up(x, y); P.ok++; popup("-9 CENTRÃO", 900, 372, "#ff8a65", 20); burst(780, 440, "#ffd54f", 14, 160);
        if (b.hp <= 0) { b.dead = true; P.bossWin = true; startEnding(); } }
    } else if (it.kind === "rush") {
      P.rush = 8; S.add(50, x, y - 30); it.mark = "CARIMBADO!"; ring(x, y, "#ffdf00", 12); S.toast(fl ? "VISTO CARIMBADO! carimbo automático por 8s" : "CANETA DE OURO! carimbo automático por 8s", "#ffdf00", 2.6); sfx("pow");
    } else if (it.kind === "smooth") {
      P.slow = 6; if (S.lives < S.maxLives) { S.lives++; popup("+1 CHANCE", x, y - 40, "#ff8a80", 20); } else S.add(50, x, y - 30);
      it.mark = "GLUP!"; S.toast("Esteira mais lenta por 6s!", "#80d8ff", 2.2); sfx("pop");
    }
    return true;
  }
  function eligible(l) {
    var best = null;
    for (var i = 0; i < P.items.length; i++) { var it = P.items[i]; if (it.lane === l && !it.stamped && it.x >= P6_ZL && it.x <= P6_ZR && (!best || it.x < best.x)) best = it; }
    return best;
  }
  function stampLane(l) {
    if (P.ph === "ending" || P.ph === "over") return;
    if (P.whiff[l] > 0) return;
    var it = eligible(l);
    if (it) stampItem(it, false);
    else { P.whiff[l] = .22; P.stampT[l] = .2; if (laneBlocked(l)) popup("BLOQUEADO!", 300, P6_LY[l] - 36, "#ff6b6b", 16); }
  }
  function tapAt(x, y) {
    var i, best = null, bd = 1e9;
    for (i = 0; i < P.items.length; i++) { var it = P.items[i]; if (it.stamped || it.x > 940 || it.x < 60) continue; var dx = Math.abs(x - it.x), dy = Math.abs(y - it.y);
      if (dx < it.w / 2 + 14 && dy < 46 && dx + dy < bd) { bd = dx + dy; best = it; } }
    if (best) { stampItem(best, false); return; }
    var l = -1; for (i = 0; i < 3; i++) if (Math.abs(y - P6_LY[i]) < 46) l = i;
    if (l >= 0 && x < 700) stampLane(l);
  }

  /* ---------- chefe e fim ---------- */
  function startBoss() {
    P.boss = { hp: 100, intro: 2.8, blockT: 4, blockLane: 0, blockLeft: 0, hit: 0, dead: false, empT: 1 };
    S.toast("PLENÁRIO DO CENTRÃO! Carimbe as 🔨 EMENDAS!", "#ff8a65", 3);
    say(fl ? "desistir" : "pedirDesc", "chefe", 4); sfx("alarm"); shake(8);
  }
  function startEnding() {
    if (P.ph === "ending") return;
    var s2 = { lula: META.done.lula || camp === "lula", flavio: META.done.flavio || camp === "flavio" };
    P.secret = !!(s2.lula && s2.flavio);
    P.ph = "ending"; P.page = 0; P.pt = 0; P.pageFlags = {}; S.time = null; S.hudHide = true; S.censor = 0;
    P.items = []; sfx("alarm"); S.grid.push(P.bossWin ? "g" : "y");
    say(fl ? "nunca" : "bola", "fim", 2);
  }
  function pagesCount() { return P.secret ? 4 : 3; }
  function finishAll() {
    if (P.ended) return; P.ended = true;
    if (P.secret) { META.secretSeen = 1; metaSave(); }
    var tot = P.ok + P.wrong + P.missed, acc = tot ? P.ok / tot : .5;
    var bossK = P.bossWin ? 1 : clamp(1 - (P.boss ? P.boss.hp / 100 : 1), 0, 1) * .8;
    var perf = clamp(.5 * acc + .3 * bossK + .2 * (S.lives / 3), 0, 1);
    var line = P.secret ? "Final secreto liberado: depois do Congresso bloquear tudo, os dois lados dividiram um coco no pedalinho."
      : "O Congresso/Centrão bloqueou tudo, de novo. Governar é pior, seja quem for. (Zere o outro lado para ver o final secreto.)";
    S.end(true, perf, line, { titles: ["Estagiário do Planalto", "Despachante do Centrão", "Carimbador Raiz", "Articulador de Plenário", "Mestre do Carimbo"], voiceWin: fl ? "cara" : "viva" });
  }
  function nextPage() {
    if (P.pt < .7) return;
    sfx("select"); P.page++; P.pt = 0; P.pageFlags = {};
    if (P.page >= pagesCount()) finishAll();
  }

  /* ---------- update ---------- */
  function update(dt) {
    if (P.ph === "over") return;
    P.tt += dt;
    if (P.ph === "ending") { P.pt += dt; if (S.bot && P.pt > 1.2) nextPage(); updEndingFx(); return; }
    var i, it, sp = speed();
    if (P.rush > 0) P.rush -= dt; if (P.slow > 0) P.slow -= dt; if (S.censor > 0) S.censor -= dt;
    for (i = 0; i < 3; i++) { if (P.stampT[i] > 0) P.stampT[i] -= dt; if (P.whiff[i] > 0) P.whiff[i] -= dt; }
    // eventos agendados
    while (P.evI < EV.length && S.t >= EV[P.evI][0]) {
      var ev = EV[P.evI++][1];
      if (ev === "cameo") { P.cameo = { t: 0, dur: 7, dropped: false }; S.toast("Cameo: Eduardo (cameo) chegou em Miami!", "#ffcc80", 2.6); say("hoje", "cameo", 1); }
      else spawnKind(ev);
    }
    if (P.cameo) { P.cameo.t += dt; if (!P.cameo.dropped && P.cameo.t > 2.2) { P.cameo.dropped = true; spawnKind("smooth"); } if (P.cameo.t > P.cameo.dur) P.cameo = null; }
    // chefe
    if (!P.boss && S.t >= 100) startBoss();
    var B = P.boss;
    if (B) {
      if (B.intro > 0) B.intro -= dt;
      if (B.hit > 0) B.hit -= dt;
      if (B.intro <= 0 && !B.dead) {
        B.blockT -= dt; if (B.blockLeft > 0) B.blockLeft -= dt;
        if (B.blockT <= 0) { B.blockT = 7; B.blockLeft = 3; B.blockLane = (RNG() * 3) | 0; sfx("alarm"); S.toast("BLOQUEIO! pista " + (B.blockLane + 1) + " fechada", "#ff6b6b", 1.8); }
        B.empT -= dt; if (B.empT <= 0) { B.empT = 1.5; var l2 = freeLane(); if (l2 >= 0 && l2 === B.blockLane && B.blockLeft > 0) l2 = (l2 + 1) % 3; if (l2 >= 0) mk(l2, "emenda", "EMENDA DE PLENÁRIO"); }
      }
    }
    // spawn normal
    P.sp -= dt;
    if (P.sp <= 0) { P.sp = lerp(1.15, .62, clamp(S.t / 140, 0, 1)) * (B ? 1.35 : 1); spawnNormal(); }
    // mover
    for (i = P.items.length - 1; i >= 0; i--) {
      it = P.items[i];
      if (it.done > 0) { it.done -= dt; it.y -= 90 * dt; it.a = clamp(it.done * 2.4, 0, 1); it.x -= 40 * dt; if (it.done <= 0) P.items.splice(i, 1); continue; }
      it.x -= sp * dt;
      if (P.rush > 0 && it.x < P6_ZR - 30 && it.x > P6_ZL && it.kind !== "bad" && !laneBlocked(it.lane)) { stampItem(it, true); continue; }
      if (it.x < 100) {
        P.items.splice(i, 1);
        if (!laneBlocked(it.lane) && (it.kind === "good" || it.kind === "special")) {
          P.missed++; S.hit(); P.winHits++; P.missRun++; popup("PERDEU!", 120, it.y - 30, "#ff8a65", 16);
          if (P.missRun >= 3) { P.missRun = 0; S.toast("3 perdidos seguidos! −1 chance", "#ff8a65", 1.8); lifeLoss("miss"); }
        }
      }
    }
    // janelas do grid diário
    if (S.t >= P.nextWin && S.grid.length < 9) { S.grid.push(P.winHits === 0 ? "g" : P.winHits === 1 ? "y" : "r"); P.winHits = 0; P.nextWin += 14; }
    state.progress = clamp(S.t / 140, 0, 1);
  }
  S.o_timeUp = null;
  function updEndingFx() {
    var f = P.pageFlags;
    if (P.page === 0) { for (var i = 0; i < 6; i++) { var key = "s" + i; if (!f[key] && P.pt > i * .5 + .45) { f[key] = 1; sfx("stamp"); shake(4); } } }
    if (P.page === 1 && !f.big && P.pt > 1.4) { f.big = 1; sfx("boom"); shake(10); flashScr("255,40,40", .4); }
  }

  /* ---------- bot ---------- */
  function bot(dt) {
    if (P.ph === "over") return;
    if (P.ph === "ending") return;
    for (var i = 0; i < P.items.length; i++) {
      var it = P.items[i]; if (it.stamped || it.done > 0) continue;
      if (it.x > P6_ZR - 40 + 0 || it.x < P6_ZL + 10) continue;
      if (it.x > P6_ZR - 40 - it.rt) continue;
      if (laneBlocked(it.lane)) continue;
      var wantBad = it.kind === "bad";
      if (wantBad) { if (it.bw && S.lives > 1) { it.bw = false; stampItem(it, false); } continue; }
      if (it.bm && it.kind === "good" && S.lives > 1) continue;
      stampItem(it, false);
    }
  }

  /* ---------- desenho ---------- */
  function bg(c) {
    var t = P.tt, i, gr;
    if (!fl) {
      gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#1c2b4a"); gr.addColorStop(.3, "#2b3a5e"); gr.addColorStop(1, "#1a1424"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // janelão com a Praça dos Três Poderes (formas)
      c.fillStyle = "#f6c27a"; c.fillRect(0, 0, W, 62); c.fillStyle = "#ffe9b8"; c.fillRect(0, 40, W, 22);
      c.fillStyle = "#e9e4d8"; for (i = 0; i < 6; i++) { c.fillRect(70 + i * 150, 28, 90, 34); c.fillStyle = "#cfc8b8"; for (var k = 0; k < 8; k++) c.fillRect(74 + i * 150 + k * 11, 30, 3, 30); c.fillStyle = "#e9e4d8"; }
      c.fillStyle = "#e9e4d8"; c.beginPath(); c.ellipse(840, 62, 40, 22, 0, Math.PI, 0); c.fill();
      drawFlag(c, 24, 6, 40, 28, "br");
    } else {
      gr = c.createLinearGradient(0, 0, 0, 130); gr.addColorStop(0, "#ff9e6b"); gr.addColorStop(.6, "#ff6f91"); gr.addColorStop(1, "#6b4fa8"); c.fillStyle = gr; c.fillRect(0, 0, W, 130);
      c.fillStyle = "#1b2a44"; c.fillRect(0, 130, W, H - 130);
      c.fillStyle = "#ffe082"; c.beginPath(); c.arc(790, 56, 30, 0, TAU); c.fill();
      c.fillStyle = "#0e5a4a";   // palmeiras
      [[120, 120], [330, 110], [610, 118]].forEach(function (p, j) { var sw = Math.sin(t * 1.3 + j) * 3; c.fillStyle = "#3b2a1c"; c.fillRect(p[0] - 3, p[1] - 56, 6, 60); c.fillStyle = "#0e7a52";
        for (var a = 0; a < 6; a++) { c.beginPath(); c.ellipse(p[0] + Math.cos(a * 1.05 + .3) * 20 + sw, p[1] - 56 + Math.sin(a * 1.05) * 8, 24, 5, a * 1.05 + .3, 0, TAU); c.fill(); } });
      txt(c, "WELCOME TO MIAMI", 480, 100, 16, "#ff80ab", "center", "rgba(255,255,255,.35)");
      c.fillStyle = "rgba(255,255,255,.16)"; c.fillRect(0, 130, W, 3);
      c.fillStyle = "#ffd54f"; c.fillRect(900, 20, 3, 3);
    }
  }
  function drawBelts(c) {
    var i, l, y, off = (P.tt * speed()) % 40, zx = P6_ZL;
    for (l = 0; l < 3; l++) {
      y = P6_LY[l];
      c.fillStyle = "#14161c"; rr(c, 96, y - 40, 864, 80, 10); c.fill();
      c.strokeStyle = "rgba(255,255,255,.08)"; c.lineWidth = 2; c.stroke();
      c.fillStyle = "rgba(255,255,255,.07)"; for (i = -1; i < 24; i++) c.fillRect(100 + i * 40 - off + 40, y + 34, 18, 3), c.fillRect(100 + i * 40 - off + 40, y - 37, 18, 3);
      // zona do carimbo
      c.fillStyle = P.rush > 0 ? "rgba(255,223,0,.16)" : "rgba(105,240,174,.08)"; rr(c, zx, y - 40, P6_ZR - zx, 80, 8); c.fill();
      c.strokeStyle = P.rush > 0 ? "#ffdf00" : "rgba(105,240,174,.5)"; c.lineWidth = 2; c.setLineDash([8, 6]); c.stroke(); c.setLineDash([]);
      // carimbo
      var st = P.stampT[l] > 0 ? clamp(P.stampT[l] / .25, 0, 1) : 0, sy = y - 40 - 28 + (1 - st) * 6 - st * 4;
      c.save(); c.translate(300, y - 6 - (st > 0 ? -2 : 18) * 0); c.globalAlpha = .95;
      var dy = st > .5 ? 14 : -14 + (P.whiff[l] > 0 ? 8 : 0);
      c.fillStyle = "#7a5230"; rr(c, -9, -40 + dy, 18, 16, 4); c.fill(); c.fillStyle = "#b0794a"; c.fillRect(-4, -26 + dy, 8, 12);
      c.fillStyle = P.rush > 0 ? "#ffdf00" : "#c62828"; rr(c, -24, -16 + dy, 48, 10, 3); c.fill(); c.restore();
      // etiqueta da pista
      c.fillStyle = "#ffdf00"; c.beginPath(); c.arc(60, y, 17, 0, TAU); c.fill(); txt(c, String(l + 1), 60, y + 1, 18, "#1a1a1a", "center");
      txt(c, "JKL"[l], 60, y + 28, 10, "#ffdf00", "center", "rgba(0,0,0,.7)");
      if (laneBlocked(l)) {
        c.fillStyle = "rgba(180,20,20,.55)"; rr(c, 96, y - 40, 864, 80, 10); c.fill();
        c.save(); c.translate(560, y); c.rotate(-.04); txt(c, "BLOQUEADO", 0, 0, 40, "#fff", "center", "#8e0000"); c.restore();
      }
    }
  }
  function drawItem(c, it) {
    var x = it.x, y = it.y, w = it.w, cen = S.censor > 0, lab = it.label, i;
    c.save(); c.globalAlpha = it.a == null ? 1 : it.a; c.translate(x, y);
    if (it.kind === "rush" || it.kind === "smooth") {
      var gold = it.kind === "rush";
      c.fillStyle = gold ? "#ffdf00" : "#80d8ff"; c.shadowColor = gold ? "#ffdf00" : "#80d8ff"; c.shadowBlur = 16; c.beginPath(); c.arc(0, 0, 32, 0, TAU); c.fill(); c.shadowBlur = 0;
      c.strokeStyle = "#fff"; c.lineWidth = 3; c.stroke();
      txt(c, gold ? T.rushIc : T.smIc, 0, 1, 32, "#000", "center");
      if (!cen) txt(c, gold ? "POWER" : "VIDA", 0, 44, 11, "#fff", "center", "rgba(0,0,0,.8)");
    } else {
      var pass = fl && (it.kind === "good" || it.kind === "bad");
      var stripe = it.kind === "good" ? "#43a047" : it.kind === "bad" ? "#e65100" : it.kind === "special" ? "#ffd54f" : "#ffb300";
      if (it.kind === "special" || it.kind === "emenda") { c.shadowColor = "#ffd54f"; c.shadowBlur = 14; }
      c.fillStyle = pass ? "#14337a" : "#fbfaf4"; rr(c, -w / 2, -30, w, 60, 7); c.fill(); c.shadowBlur = 0;
      c.strokeStyle = it.kind === "special" || it.kind === "emenda" ? "#ffd54f" : "#111"; c.lineWidth = it.kind === "special" || it.kind === "emenda" ? 3 : 2; c.stroke();
      c.fillStyle = stripe; c.fillRect(-w / 2 + 3, -27, 7, 54);
      var ic = it.kind === "special" ? (fl ? "💳" : "📢") : it.kind === "emenda" ? "🔨" : it.kind === "bad" ? T.badIc : T.goodIc;
      txt(c, ic, -w / 2 + 25, 0, 24, "#000", "center");
      var tc = pass ? "#fff" : "#1b1b1b";
      if (cen) { c.fillStyle = "#000"; c.fillRect(-w / 2 + 40, -16, w - 48, 9); c.fillRect(-w / 2 + 40, 2, w - 66, 9); }
      else {
        c.font = "bold 11px 'Trebuchet MS', Arial, sans-serif"; var ls = wrap(c, lab, w - 50);
        c.fillStyle = tc; c.textAlign = "left"; c.textBaseline = "middle"; for (i = 0; i < Math.min(3, ls.length); i++) c.fillText(ls[i], -w / 2 + 40, (i - (Math.min(3, ls.length) - 1) / 2) * 13);
      }
      if (it.kind === "bad") { c.fillStyle = "rgba(230,81,0,.9)"; c.beginPath(); c.arc(w / 2 - 6, -26, 9, 0, TAU); c.fill(); txt(c, "!", w / 2 - 6, -25, 12, "#fff", "center"); }
    }
    if (it.stamped && it.mark) {
      c.save(); c.rotate(-.2); var bad = it.badMark; c.globalAlpha = (it.a == null ? 1 : it.a) * .95;
      c.strokeStyle = bad ? "#e53935" : "#2e7d32"; c.lineWidth = 3; rr(c, -56, -15, 112, 30, 5); c.stroke();
      txt(c, it.mark, 0, 1, 16, bad ? "#e53935" : "#2e7d32", "center"); c.restore();
    }
    c.restore();
  }
  function drawPlayerDesk(c) {
    var t = P.tt;
    c.fillStyle = fl ? "#2b4a73" : "#5a3a22"; c.fillRect(0, 392, W, H - 392);
    c.fillStyle = fl ? "#3a6196" : "#7a5230"; c.fillRect(0, 392, W, 7);
    c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(0, 399, W, 10);
    portraitCard(c, fl ? "flavio" : "lula", 28, 410, 108, 118, { r: 12, lw: 3, cy: .46, talk: 0 });
    txt(c, fl ? "VOCÊ: FLÁVIO" : "VOCÊ: LULA", 82, 534, 10, "#ffdf00", "center", "rgba(0,0,0,.7)");
    // dicas
    var tip = fl ? "Carimbe passaportes COM visto · deixe passar os SEM visto" : "Carimbe os projetos · NÃO carimbe 🐢 Emenda Jabuti";
    txt(c, tip, 160, 420, 13, "#fff", "left", "rgba(0,0,0,.7)");
    txt(c, "1 2 3 / J K L ou toque no item · 🔨 emenda fura o Centrão", 160, 440, 11, "#cfd6f0", "left", "rgba(0,0,0,.7)");
    txt(c, T.where, 160, 462, 11, "#9aa0b4", "left");
    // barra de progresso da legislatura
    uiBar(c, 160, 484, 260, 10, clamp(S.t / 100, 0, 1), "#ffdf00");
    txt(c, P.boss ? "CHEFE: Plenário do Centrão" : "até o plenário…", 160, 506, 11, "#e8e6dc", "left");
    if (P.rush > 0) { uiBar(c, 160, 518, 260, 8, P.rush / 8, "#ffdf00"); txt(c, "CARIMBO AUTOMÁTICO", 428, 522, 10, "#ffdf00", "left"); }
  }
  function drawCrowd(c, big) {
    var B = P.boss, i, bx = 560, by = 522, sc = big ? 1.55 : 1.2, t = P.tt;
    var skins = ["#e0ac84", "#c98e68", "#8d5a3b", "#e8b48e", "#d6a07a"], hairs = ["#222", "#6a6a6a", "#4a2f1c", "#111", "#aaa"], suits = ["#4a4f5e", "#5a5058", "#3f5a52", "#545a6a", "#604a4a"];
    var shake2 = B && B.hit > 0 ? Math.sin(t * 60) * 5 : 0;
    var n = 5;
    for (i = 0; i < n; i++) {
      var x = bx + i * (big ? 70 : 52) + shake2, bob = Math.sin(t * (big ? 4 : 1.5) + i) * (big ? 3 : 1);
      drawChar(c, "npc", x, by + bob, sc, { t: t, shirt: suits[i], skin: skins[i], hair: hairs[i], pants: "#222" });
      if (big && B && !B.dead) { c.fillStyle = "#111"; c.fillRect(x - 11 * sc, by - 60 * sc, 9 * sc, 2.4 * sc); c.fillRect(x + 2 * sc, by - 60 * sc, 9 * sc, 2.4 * sc); }
    }
    c.fillStyle = "#3a2a1c"; rr(c, bx - 40, by - 24, n * (big ? 70 : 52) + 20, 40, 6); c.fill();
    c.fillStyle = "#ffdf00"; txt(c, "CENTRÃO", bx + (n - 1) * (big ? 35 : 26), by - 6, 13, "#ffdf00", "center");
    if (big && B) {
      var hx = 560, hw = 340; uiBar(c, hx, 400, hw, 12, B.hp / 100, "#e53935");
      txt(c, "PLENÁRIO DO CENTRÃO  " + Math.ceil(B.hp) + "%", hx, 394, 11, "#fff", "left", "rgba(0,0,0,.7)");
      if (B.dead) txt(c, "CAIU... por enquanto", hx + hw / 2, 440, 18, "#69f0ae", "center", "#000");
    } else txt(c, "Centrão (observando, com fome de ministério)", 600, 400, 11, "#cfd6f0", "left");
  }
  function drawCameo(c) {
    var cm = P.cameo; if (!cm) return;
    var a = clamp(Math.min(cm.t / .5, (cm.dur - cm.t) / .5), 0, 1), x = lerp(1040, 870, ease(Math.min(1, cm.t / 1))), y = 470;
    c.save(); c.globalAlpha = a;
    drawChar(c, "npc", x, y, 1.5, { t: P.tt, moving: false, shirt: "#ff7043", skin: "#e8b48e", hair: "#241610", pants: "#f5e6c8" });
    c.fillStyle = "#111"; rr(c, x - 12, y - 108, 24, 8, 3); c.fill();   // óculos escuros
    txt(c, "Eduardo (cameo)", x, y + 14, 11, "#ffcc80", "center", "rgba(0,0,0,.8)");
    if (cm.t > .8 && cm.t < 5.5) balloon(c, "Aqui em Miami o smoothie é de graça. O Wi-Fi é que não pega!", x - 20, y - 124, { size: 12, maxW: 190, alpha: a });
    c.restore();
  }
  function drawBossBanner(c) {
    var B = P.boss; if (!B || B.intro <= 0) return;
    var a = clamp(Math.min((2.8 - B.intro) / .3, B.intro / .4), 0, 1);
    c.save(); c.globalAlpha = a; c.fillStyle = "rgba(0,0,0,.6)"; c.fillRect(0, 205, W, 100);
    txt(c, "CHEFE: PLENÁRIO DO CENTRÃO", W / 2, 238, 34, "#ff8a65", "center", "#000");
    txt(c, "Carimbe as 🔨 EMENDAS para furar o bloqueio · evite os jabutis", W / 2, 278, 16, "#fff", "center", "#000"); c.restore();
  }
  function draw(c) {
    if (P.ph === "ending") { drawEnding(c); return; }
    bg(c); drawBelts(c); drawPlayerDesk(c); drawCrowd(c, !!P.boss); drawCameo(c);
    var i; for (i = 0; i < P.items.length; i++) drawItem(c, P.items[i]);
    if (P.rush > 0) { c.fillStyle = "rgba(255,223,0," + (.06 + .04 * Math.sin(P.tt * 12)) + ")"; c.fillRect(0, 0, W, H); txt(c, "CARIMBO AUTOMÁTICO x2", W / 2, 118, 18, "#ffdf00", "center", "rgba(0,0,0,.8)"); }
    if (P.slow > 0) txt(c, "ESTEIRA LENTA", W / 2, 136, 14, "#80d8ff", "center", "rgba(0,0,0,.8)");
    if (fl) { c.fillStyle = "rgba(160,220,255,.5)"; for (i = 0; i < 4; i++) { var sx = 940 - ((P.tt * 20 + i * 70) % 60); c.beginPath(); c.arc(sx, 128 + i * 2, 1.5, 0, TAU); c.fill(); } }
    drawBossBanner(c);
    if (S.censor > 0) {   // glitch na cena
      c.fillStyle = "rgba(0,0,0,.35)"; for (i = 0; i < 6; i++) c.fillRect(0, ((P.tt * 400 + i * 97) % H), W, 2 + (i % 3) * 3);
      c.fillStyle = "rgba(255,255,255,.07)"; c.fillRect(0, 0, W, H);
    }
  }
  function overlay(c) {   // desenhado DEPOIS do HUD: a censura cobre o placar
    if (P.ph === "ending" || S.censor <= 0) return;
    var a = clamp(S.censor * 3, 0, 1), blink = Math.floor(P.tt * 8) % 2;
    c.save(); c.globalAlpha = a;
    c.fillStyle = "#000"; c.fillRect(14, 28, 224, 30); c.fillRect(W / 2 - 62, 26, 124, 34);
    txt(c, "[CENSURADO]", 126, 44, 14, blink ? "#fff" : "#999", "center");
    txt(c, "[CENSURADO]", W / 2, 44, 12, "#bbb", "center");
    c.fillRect(W - 164, 26, 150, 30); txt(c, "[REDACTED]", W - 89, 41, 11, "#888", "center");
    c.save(); c.translate(W / 2, 300); c.rotate(-.12); c.strokeStyle = "#e53935"; c.lineWidth = 6; c.strokeRect(-190, -34, 380, 68);
    txt(c, "[CENSURADO]", 0, 2, 44, "#e53935", "center"); c.restore();
    c.restore();
  }

  /* ---------- final: Congresso bloqueia TUDO ---------- */
  function drawChamber(c, dark) {
    var gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, dark ? "#120a14" : "#2a1630"); gr.addColorStop(1, "#0c0710"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    c.fillStyle = "rgba(255,255,255,.05)"; for (var i = 0; i < 9; i++) c.fillRect(i * 110 + 10, 0, 6, H);
    c.fillStyle = "rgba(255,223,0,.08)"; c.beginPath(); c.moveTo(380, 0); c.lineTo(580, 0); c.lineTo(760, H); c.lineTo(200, H); c.closePath(); c.fill();
  }
  function bigStamp(c, x, y, r, sc, s, col, w) {
    w = w || 260;
    c.save(); c.translate(x, y); c.rotate(r); c.scale(sc, sc); c.strokeStyle = col || "#e53935"; c.lineWidth = 6; rr(c, -w / 2, -30, w, 60, 6); c.stroke();
    txt(c, s || "BLOQUEADO", 0, 2, 38, col || "#e53935", "center"); c.restore();
  }
  function drawEnding(c) {
    var pg = Math.min(P.page, pagesCount() - 1), t = P.pt, i, f;
    if (pg === 0) {
      drawChamber(c);
      txt(c, "CONGRESSO · CENTRÃO", W / 2, 50, 32, "#ffdf00", "center", "#000");
      txt(c, "Tudo que você carimbou chegou ao plenário…", W / 2, 88, 16, "#cfd6f0", "center");
      var names = fl ? ["Visto OK ✓", "Turista ✓", "B1/B2 ✓", "PL do Wi-Fi Livre", "PEC do Smoothie", "Reforma Tributária 2.0"] : ["PL da Picanha", "Reforma Tributária 2.0", "Passe Livre do Busão", "Regulação das Redes", "Bolsa Cafezinho", "Lei do Pão de Queijo"];
      for (i = 0; i < 6; i++) {
        var cx = 150 + (i % 3) * 330, cy = 190 + ((i / 3) | 0) * 150, a = clamp((t - i * .5) * 4, 0, 1);
        c.save(); c.globalAlpha = a; c.translate(cx + 80, cy); c.rotate((i % 2 ? .05 : -.05));
        c.fillStyle = "#fbfaf4"; rr(c, -110, -45, 220, 90, 8); c.fill(); c.strokeStyle = "#111"; c.lineWidth = 2; c.stroke();
        txt(c, names[i], 0, -4, 15, "#1b1b1b", "center");
        var sa = clamp((t - i * .5 - .45) * 6, 0, 1); if (sa > 0) bigStamp(c, 0, 8, -.2, 1.2 - .2 * sa, "BLOQUEADO", "rgba(229,57,53," + sa + ")");
        c.restore();
      }
      if (t > 3.4) txt(c, "Tudo BLOQUEADO. Parabéns pela pauta!", W / 2, 470, 24, "#ff8a65", "center", "#000");
    } else if (pg === 1) {
      drawChamber(c, true);
      txt(c, "QUEM GOVERNA? O CENTRÃO", W / 2, 46, 30, "#ffdf00", "center", "#000");
      // esquerda / direita
      mini(c, "lula", 190, 240, 1.7); txt(c, "ESQUERDA", 190, 330, 14, "#ff8a80", "center", "#000");
      mini(c, "flavio", 770, 240, 1.7, { sweat: true }); txt(c, "DIREITA", 770, 330, 14, "#ffdf00", "center", "#000");
      if (t > .4) balloon(c, "Vamos regular as redes!", 200, 175, { size: 15, maxW: 170 });
      if (t > .9) balloon(c, "Vamos liberar geral! Quer visto?", 760, 175, { size: 15, maxW: 170 });
      var skins = ["#e0ac84", "#c98e68", "#8d5a3b"];
      for (i = 0; i < 3; i++) drawChar(c, "npc", 430 + i * 50, 340, 1.7, { t: P.pt, shirt: ["#4a4f5e", "#5a5058", "#3f5a52"][i], skin: skins[i], hair: "#333" });
      if (t > 1.4) { f = clamp((t - 1.4) * 5, 0, 1); c.globalAlpha = f; balloon(c, "A gente só quer um ministério. Ou três.", 480, 262, { size: 14, maxW: 170 }); c.globalAlpha = 1; }
      if (t > 1.4) bigStamp(c, W / 2, 440, -.08, 1 + Math.max(0, .6 - (t - 1.4)) * 1.2, "TUDO BLOQUEADO", null, 380);
      txt(c, "Quem promete, promete. O Centrão segura.", W / 2, 505, 16, "#cfd6f0", "center");
    } else if (pg === 2) {
      drawChamber(c, true);
      txt(c, "FIM?", W / 2, 150, 120, "#ffdf00", "center", "#000");
      var cr = ["Obrigado por governar (por uns 2 minutos).", "Sátira dos dois lados: nenhum lado saiu ileso.", "Veja o 📰 fato real no próximo cartão e confira a fonte.", P.secret ? "…será que acabou mesmo? (continue)" : "Zere o outro lado para liberar o FINAL SECRETO."];
      for (i = 0; i < cr.length; i++) { c.globalAlpha = clamp((t - .5 - i * .6) * 3, 0, 1); txt(c, cr[i], W / 2, 270 + i * 40, 20, i === 3 ? "#69f0ae" : "#fff", "center", "#000"); }
      c.globalAlpha = 1;
    } else {
      // final secreto: pedalinho na praia
      var gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#ff9e6b"); gr.addColorStop(.45, "#ffd180"); gr.addColorStop(.46, "#4fc3f7"); gr.addColorStop(1, "#0277bd"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.fillStyle = "#fff59d"; c.beginPath(); c.arc(780, 120, 46, 0, TAU); c.fill();
      c.strokeStyle = "rgba(255,255,255,.45)"; c.lineWidth = 3; for (i = 0; i < 8; i++) { c.beginPath(); c.moveTo(i * 130 - (t * 30) % 130, 280 + (i % 3) * 60); c.quadraticCurveTo(i * 130 + 30 - (t * 30) % 130, 270 + (i % 3) * 60, i * 130 + 60 - (t * 30) % 130, 280 + (i % 3) * 60); c.stroke(); }
      txt(c, "FINAL SECRETO", W / 2, 50, 44, "#fff", "center", "#0277bd");
      var bob = Math.sin(t * 2) * 5;
      c.save(); c.translate(W / 2, 330 + bob);
      c.fillStyle = "#f5f5f5"; c.beginPath(); c.ellipse(0, 40, 190, 38, 0, 0, TAU); c.fill(); c.strokeStyle = "#90a4ae"; c.lineWidth = 4; c.stroke();
      c.fillStyle = "#ffeb3b"; c.beginPath(); c.ellipse(0, 40, 180, 8, 0, 0, TAU); c.fill();
      c.fillStyle = "#ec407a"; c.beginPath(); c.arc(190, 20, 34, Math.PI, 0); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(215, 16, 7, 0, TAU); c.fill();   // pescoço de cisne
      mini(c, "lula", -80, -30, 1.1); mini(c, "flavio", 80, -30, 1.1, { sweat: false });
      c.fillStyle = "#8d6e63"; c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.fill(); c.fillStyle = "#f5f5f5"; c.beginPath(); c.arc(0, -4, 13, Math.PI, 0); c.fill();   // coco
      c.strokeStyle = "#e53935"; c.lineWidth = 3; c.beginPath(); c.moveTo(-6, -4); c.lineTo(-22, -34); c.moveTo(6, -4); c.lineTo(22, -34); c.stroke();
      c.restore();
      if (t > .8) balloon(c, "Esse coco aqui é neutro, ok?", W / 2 - 80, 245 + bob, { size: 14, maxW: 170 });
      txt(c, "Depois da eleição, até rival divide água de coco. (só na ficção)", W / 2, 470, 18, "#fff", "center", "#0277bd");
      txt(c, "O Brasil agradece. 🇧🇷", W / 2, 505, 24, "#ffdf00", "center", "#0a3a1c");
    }
    if (t > .7 && Math.floor(P.tt * 2.4) % 2) txt(c, (pg === pagesCount() - 1 ? "Toque para concluir ▶" : "Toque para continuar ▶"), W - 24, H - 74, 15, "#fff", "right", "#000");
  }

  /* ---------- entrada ---------- */
  function key(code) {
    if (P.ph === "ending") { if (code === "Enter" || code === "Space" || code === "NumpadEnter") nextPage(); return; }
    var m = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2, KeyJ: 0, KeyK: 1, KeyL: 2 };
    if (code in m) stampLane(m[code]);
  }
  function tap(x, y) { if (P.ph === "ending") { nextPage(); return; } tapAt(x, y); }
  function info() {
    return { ending: P.ph === "ending", secret: P.secret, censored: S.censor > 0, phase: P.ph, page: P.page, boss: P.boss ? Math.round(P.boss.hp) : null, bossDead: !!(P.boss && P.boss.dead),
      ok: P.ok, wrong: P.wrong, missed: P.missed, rush: P.rush > 0 };
  }
  return {
    intro: { sub: T.where, foeLabel: "OPOSIÇÃO + CENTRÃO", lines: fl
      ? ["Você chegou em Miami. Carimbe passaportes COM visto!", "Deixe passar quem está SEM visto · 🛂 visto carimbado = carimbo automático", "No fim, o Plenário do Centrão bloqueia tudo."]
      : ["Mesa da Presidência: carimbe os projetos bons!", "NÃO carimbe a Emenda Jabuti 🐢 · 1 2 3 / J K L ou toque no item", "No fim, o Plenário do Centrão bloqueia tudo."] },
    update: update, draw: draw, overlay: overlay, key: key, tap: tap, bot: bot, info: info,
    timeUp: function () { if (P.ph === "play") startEnding(); },
    begin: function () { say(fl ? "nunca" : "pedirDesc", "inicio", 1); }
  };
};
