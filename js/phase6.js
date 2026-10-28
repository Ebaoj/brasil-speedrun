"use strict";
/* ================= Fase 6 — Governar é pior =================
   Arcade de pratos giratórios: corra entre 5 estações (Saúde, Economia, Segurança, Educação, Redes) e segure A perto de cada uma
   para manter a estabilidade; crises surgem (emendas jabuti / vistos), o prato que cai custa uma chance. No fim, o Plenário do Centrão
   joga emendas (bata nelas!). Lula: REGULAÇÃO DAS REDES (jogo censurado). Flávio: Miami, cameo do Eduardo.
   Final compartilhado: o Congresso bloqueia TUDO. Final secreto: quem zerou os dois lados. */

var P6_PX = [150, 315, 480, 645, 810], P6_PY = 350, P6_ORDER = [2, 1, 3, 0, 4];
var P6_TXT = {
  lula: {
    plates: ["Saúde", "Economia", "Segurança", "Educação", "Redes"],
    crises: ["Emenda Jabuti: +1 Ministério", "Jabuti: Piscina no Gabinete", "Centrão quer cargo pro primo", "Boato no zap: fila do SUS", "Jabuti: Jetski Institucional"],
    pk: { rush: "CANETA DE OURO", smooth: "CAFEZINHO DO PLANALTO", special: "REGULAÇÃO DAS REDES" }, smIc: "☕", rushIc: "🖊", spIc: "📢",
    where: "Palácio do Planalto · Mesa da Presidência", keyHelp: "Caneta de Ouro"
  },
  flavio: {
    plates: ["Fila", "Câmbio", "Segurança", "Escola", "Wi-Fi"],
    crises: ["Passaporte SEM visto ✗", "Visto vencido ✗", "Visto de outra pessoa ✗", "Esqueceu o visto em casa ✗", "Fila de 3 horas no balcão"],
    pk: { rush: "VISTO CARIMBADO", smooth: "SMOOTHIE DE MIAMI", special: "GREEN CARD (EDUARDO MANDOU)" }, smIc: "🥤", rushIc: "🛂", spIc: "💳",
    where: "Aeroporto de Miami · Imigração", keyHelp: "Visto Carimbado"
  }
};

SCEN[6] = function (S) {
  var camp = S.camp, T = P6_TXT[camp], fl = camp === "flavio";
  var P = { ph: "play", items: [], em: [], pk: [], pl: [], px: 480, py: 430, spec: 0, inv: 0, slow: 0, boss: null, evI: 0, cT: 3.5, swatCd: 0, shownN: 0, firstCr: true,
    ok: 0, wrong: 0, missed: 0, winHits: 0, nextWin: 14, cameo: null, bossWin: false, rush: 0, hold: false, saved: 0, stabSum: 0, stabN: 0,
    page: 0, pt: 0, secret: false, pageFlags: {}, tt: 0, ended: false, botA: false, botMv: { x: 0, y: 0 }, bt: 0, bIdle: 0, tgt: null };
  S.lives = 3; S.maxLives = 3; S.livesLabel = "CHANCES"; S.time = 140; S.timeMax = 140;
  var EV = fl ? [[16, "rush"], [30, "special"], [47, "cameo"], [70, "rush"], [88, "rush"]] : [[16, "rush"], [30, "special"], [50, "smooth"], [68, "rush"], [88, "rush"]];
  var SIDEK = fl ? ["jair", "tarcisio", "nikolas", "renan"] : ["dilma", "haddad", "boulos", "lula"];
  var i0;
  for (i0 = 0; i0 < 5; i0++) P.pl.push({ i: i0, x: P6_PX[i0], v: 70, act: P6_ORDER.indexOf(i0) < 3, cr: null, crP: 0, blk: 0 });

  function nAct() { return S.t < 22 ? 3 : S.t < 45 ? 4 : 5; }
  function prog() { return clamp(S.t / 100, 0, 1); }
  function mv() { return S.bot ? P.botMv : arcMove(); }
  function held() { return S.bot ? P.botA : arcHeld("a"); }
  function near(pl) { return Math.abs(P.px - pl.x) < 62 && Math.abs(P.py - P6_PY) < 62; }
  function nearestPlate() { var b = null, d = 1e9; P.pl.forEach(function (p) { if (!p.act) return; var dd = Math.hypot(P.px - p.x, P.py - P6_PY); if (dd < d && near(p)) { d = dd; b = p; } }); return b; }

  function lifeLoss(why) {
    S.lives--; S.hit(); P.winHits++; P.inv = 1.2; shake(8); flashScr("255,40,40", .45); sfx("nope");
    voxWho("hit", SIDEK, { p: .6 });
    if (S.lives <= 0 && P.ph !== "over") {
      P.ph = "over"; S.hudHide = false;
      S.end(false, clamp(.15 + .3 * (S.t / 140), 0, .45), fl ? "Sem visto, sem paciência: a imigração de Miami te barrou. (Em Brasília, o Centrão também ia barrar.)" : "Deixou prato demais cair: o Centrão agradeceu e te deixou sem pauta.", { failTitle: fl ? "Barrado em Miami" : "Refém do Centrão", voiceLose: fl ? "sistema" : "hoje" });
    }
  }
  function addSpec(v) { P.spec = Math.min(100, P.spec + v); }
  function startCrisis(pl) {
    pl.cr = { t: 7, label: T.crises[rint(0, 4)] }; pl.crP = 0; pl.v = Math.max(1, pl.v - 18); sfx("alarm");
    if (P.firstCr) { P.firstCr = false; say(fl ? "tarcisio_acorda_cedo_dorme_tarde" : "boulos_fingir_que_ta_tudo_bem", "crise", 1); }
  }
  function clearCrisis(pl) {
    pl.cr = null; pl.crP = 0; P.ok++; S.up(pl.x, 230); S.add(30, pl.x, 220, "#69f0ae"); addSpec(12); sfx("coin"); burst(pl.x, 250, "#69f0ae", 12, 140, 100);
  }
  function spawnPick(kind) {
    P.pk.push({ kind: kind, x: rnd(110, 850), y: rnd(220, 440), t: 11 });
  }
  function startBoss() {
    P.boss = { hp: 100, intro: 2.8, hit: 0, dead: false, emT: 1.5, blkT: 6, t: 0, dead2: 0 };
    S.toast("PLENÁRIO DO CENTRÃO! Bata nas 🔨 EMENDAS (segure A)!", "#ff8a65", 3);
    spawnPick("rush"); say(fl ? "jair_promessas_estamos_cheios" : "haddad_se_vira_consciencia", "chefe", 4); sfx("alarm"); shake(8);
  }
  function swat(em) {
    var B = P.boss; P.em.splice(P.em.indexOf(em), 1); P.swatCd = .3; P.ok++; S.up(em.x, em.y); S.add(40, em.x, em.y, "#ffd54f"); addSpec(8); sfx("stamp"); burst(em.x, em.y, "#ffd54f", 12, 150, 120);
    if (B && !B.dead) { B.hp = Math.max(0, B.hp - 12); B.hit = .4; popup("-12 CENTRÃO", 780, 100, "#ff8a65", 18); if (B.hp <= 0) { B.dead = true; P.bossWin = true; S.add(300, 700, 120, "#ffdf00"); flashScr("255,223,0", .4); startEnding(); } }
  }
  function useSpec() {
    if (P.spec < 100 || P.ph !== "play") return false;
    P.spec = 0; P.pl.forEach(function (p) { p.v = 100; p.cr = null; p.blk = 0; });
    P.em.slice().forEach(function (e) { swat(e); });
    ring(P.px, P.py - 20, "#ffdf00", 12); flashScr("255,223,0", .4); shake(6); sfx("pow"); S.toast(T.keyHelp.toUpperCase() + "! Tudo estabilizado!", "#ffdf00", 2);
    voxWho("powerup", SIDEK, { p: .8 }); return true;
  }
  function collect(pk) {
    P.pk.splice(P.pk.indexOf(pk), 1); var x = pk.x, y = pk.y;
    if (pk.kind === "rush") { P.spec = 100; S.add(50, x, y - 20); ring(x, y, "#ffdf00", 12); S.toast(T.pk.rush + "! Especial carregado (K)", "#ffdf00", 2.4); sfx("pow"); voxWho("powerup", SIDEK, { p: .7 }); }
    else if (pk.kind === "smooth") { P.slow = 8; if (S.lives < S.maxLives) { S.lives++; popup("+1 CHANCE", x, y - 30, "#ff8a80", 20); } else S.add(50, x, y - 20); S.toast("Estabilidade cai mais devagar por 8s!", "#80d8ff", 2.2); sfx("pop"); }
    else {
      S.add(200, x, y - 20, "#ffd54f"); S.up(x, y); P.pl.forEach(function (p) { if (p.act) p.v = Math.max(p.v, 85); p.cr = null; }); ring(x, y, "#ffd54f", 10); P.ok++;
      if (!fl) { S.censor = 6; say("regular", "regulacao", 6); say("crimeDig", "regulacao", 5); S.toast("REGULAÇÃO APROVADA… e o jogo foi [CENSURADO]!", "#ffcc80", 3.2); flashScr("0,0,0", .6); shake(8); }
      else S.toast("Green card! (o Eduardo mandou)", "#ffcc80", 2.6);
    }
  }

  function startEnding() {
    if (P.ph === "ending") return;
    var s2 = { lula: META.done.lula || camp === "lula", flavio: META.done.flavio || camp === "flavio" };
    P.secret = !!(s2.lula && s2.flavio);
    P.ph = "ending"; P.page = 0; P.pt = 0; P.pageFlags = {}; S.time = null; S.hudHide = true; S.censor = 0;
    P.items = []; P.em = []; P.pk = []; $("touch").classList.remove("on", "arc"); sfx("alarm"); S.grid.push(P.bossWin ? "g" : "y");
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
    var i, pl, pr = prog(), B = P.boss, m = mv(), h = held(), np;
    if (P.slow > 0) P.slow -= dt; if (S.censor > 0) S.censor -= dt; if (P.inv > 0) P.inv -= dt; if (P.swatCd > 0) P.swatCd -= dt; if (P.rush > 0) P.rush -= dt;
    P.px = clamp(P.px + m.x * (S.bot ? 340 : 270) * dt, 40, 920); P.py = clamp(P.py + m.y * (S.bot ? 340 : 270) * dt, 190, 480); P.hold = h;
    np = nAct();
    for (i = 0; i < 5; i++) { pl = P.pl[i]; if (!pl.act && P6_ORDER.indexOf(i) < np) { pl.act = true; pl.v = 70; S.toast("Nova frente: " + T.plates[i] + "!", "#9fe8ff", 1.8); sfx("pop"); } }
    // eventos agendados
    while (P.evI < EV.length && S.t >= EV[P.evI][0]) {
      var ev = EV[P.evI++][1];
      if (ev === "cameo") { P.cameo = { t: 0, dur: 7, dropped: false }; S.toast("Cameo: Eduardo (cameo) chegou em Miami!", "#ffcc80", 2.6); say("hoje", "cameo", 1); }
      else spawnPick(ev);
    }
    if (P.cameo) { P.cameo.t += dt; if (!P.cameo.dropped && P.cameo.t > 2.2) { P.cameo.dropped = true; spawnPick("smooth"); } if (P.cameo.t > P.cameo.dur) P.cameo = null; }
    if (!B && S.t >= 95) startBoss();
    B = P.boss;
    // crises
    P.cT -= dt;
    if (P.cT <= 0) { P.cT = lerp(5, 2.4, pr) * (B ? 2.2 : 1); var cand = P.pl.filter(function (p) { return p.act && !p.cr; }); if (cand.length && (!B || B.intro <= 0)) startCrisis(pick(cand)); }
    if (B) {
      B.t += dt; if (B.hit > 0) B.hit -= dt;
      if (B.intro > 0) B.intro -= dt;
      else if (!B.dead) {
        B.emT -= dt; if (B.emT <= 0) { B.emT = 2.6; var ap = P.pl.filter(function (p) { return p.act; }), tp = pick(ap); P.em.push({ x: tp.x + rnd(-14, 14), y: 80, vy: rnd(72, 92), pi: tp.i }); }
        B.blkT -= dt; if (B.blkT <= 0) { B.blkT = 9; var bp = pick(P.pl.filter(function (p) { return p.act; })); bp.blk = 3; sfx("alarm"); S.toast("BLOQUEIO! " + T.plates[bp.i] + " travada", "#ff6b6b", 1.8); }
      }
    }
    // emendas caindo
    for (i = P.em.length - 1; i >= 0; i--) {
      var e = P.em[i]; e.y += e.vy * dt;
      if (e.y >= 300) { pl = P.pl[e.pi]; P.em.splice(i, 1); pl.v = Math.max(1, pl.v - 30); S.hit(); P.winHits++; shake(6); burst(e.x, 300, "#ff8a65", 12, 150, 120); popup("EMENDA!", e.x, 280, "#ff6b6b", 18); sfx("hit"); }
    }
    // segurar A: estabilizar prato / bater em emenda
    if (h) {
      var pn = nearestPlate();
      if (pn && pn.blk <= 0) { pn.v = Math.min(100, pn.v + (S.bot ? 130 : 80) * dt); if (pn.cr) { pn.crP += dt; if (pn.crP >= 1) clearCrisis(pn); } if (Math.random() < .3) parts.push({ x: pn.x + rnd(-20, 20), y: 255, vx: 0, vy: -40, life: .4, max: .4, col: "#9fe8ff", r: 3, k: "dot", gr: 0 }); }
      if (P.swatCd <= 0) for (i = 0; i < P.em.length; i++) if (Math.hypot(P.em[i].x - P.px, P.em[i].y - P.py) < 78) { swat(P.em[i]); break; }
    }
    // decaimento e quedas
    var dec = lerp(3.4, 5.6, pr) * (P.slow > 0 ? .5 : 1) * (B ? .6 : 1) * (S.bot ? .6 : 1);
    for (i = 0; i < 5; i++) {
      pl = P.pl[i]; if (!pl.act) continue;
      if (pl.blk > 0) pl.blk -= dt;
      pl.v -= dec * (pl.cr ? 2.2 : 1) * dt; P.stabSum += pl.v / 100 * dt; P.stabN += dt;
      if (pl.cr) { pl.cr.t -= dt; if (pl.cr.t <= 0) { pl.cr = null; pl.crP = 0; pl.v = Math.max(1, pl.v - 25); P.missed++; S.hit(); P.winHits++; popup("CRISE ESTOUROU!", pl.x, 230, "#ff8a65", 16); } }
      if (pl.v <= 0) { pl.v = 0; if (P.inv <= 0) { popup("CAIU!", pl.x, 250, "#ff6b6b", 26); burst(pl.x, 260, "#fff", 16, 170, 200); pl.v = 60; pl.cr = null; lifeLoss("prato"); if (P.ph === "over") return; } }
    }
    for (i = P.pk.length - 1; i >= 0; i--) { P.pk[i].t -= dt; if (P.pk[i].t <= 0) P.pk.splice(i, 1); else if (Math.hypot(P.pk[i].x - P.px, P.pk[i].y - P.py) < 38) collect(P.pk[i]); }
    S.score += Math.round(dt * P.pl.filter(function (p) { return p.act; }).length * 3 * S.mult * 10) / 10;
    // janelas do grid diário
    if (S.t >= P.nextWin && S.grid.length < 9) { S.grid.push(P.winHits === 0 ? "g" : P.winHits === 1 ? "y" : "r"); P.winHits = 0; P.nextWin += 14; }
    state.progress = clamp(S.t / 140, 0, 1);
  }
  function actBtn(b) {
    if (P.ph !== "play") return;
    if (b === "b") { useSpec(); return; }
    var i, pn = nearestPlate();
    for (i = 0; i < P.em.length; i++) if (Math.hypot(P.em[i].x - P.px, P.em[i].y - P.py) < 78) { swat(P.em[i]); return; }
    if (pn && pn.blk <= 0) pn.v = Math.min(100, pn.v + 12);
  }

  /* ---------- bot ---------- */
  function bot(dt) {
    if (P.ph !== "play") { P.botA = false; P.botMv = { x: 0, y: 0 }; return; }
    P.bt -= dt;
    if (P.bIdle > 0) { P.bIdle -= dt; P.botMv = { x: 0, y: 0 }; P.botA = false; return; }
    if (P.bt <= 0) {
      P.bt = .18; 
      var low = P.pl.filter(function (p) { return p.act && p.v < 30; }).length;
      if (P.spec >= 100 && (low >= 2 || P.em.length >= 3)) useSpec();
      var best = null, bs = -1e9, cur = P.tgt && P.tgt.kind === "plate" ? P.tgt.o : null, anyLow = P.pl.some(function (p) { return p.act && p.v < 30 && p !== cur; });
      var emT = null; P.em.forEach(function (e) { if (e.y > 110 && (!emT || e.y > emT.y)) emT = e; });
      var minv0 = 100; P.pl.forEach(function (p) { if (p.act) minv0 = Math.min(minv0, p.v); });
      if (emT && minv0 > 20) best = { kind: "em", o: emT };
      else if (cur && cur.act && cur.v < 88 && !anyLow && cur.blk <= 0) best = { kind: "plate", o: cur };
      else {
        P.pl.forEach(function (p) { if (!p.act || p.blk > 0) return; var s = (100 - p.v) + (p.cr ? 22 : 0) - Math.abs(P.px - p.x) * .03; if (s > bs) { bs = s; best = { kind: "plate", o: p }; } });
        var minv = 100; P.pl.forEach(function (p) { if (p.act) minv = Math.min(minv, p.v); });
        P.em.forEach(function (e) { if (e.y > 150 && minv > 18) { var s2 = 70 + e.y * .2; if (s2 > bs) { bs = s2; best = { kind: "em", o: e }; } } });
        if (P.pk.length && minv > 42) best = { kind: "pk", o: P.pk[0] };
      }
      P.tgt = best;
    }
    var t = P.tgt; if (!t) { P.botA = false; P.botMv = { x: 0, y: 0 }; return; }
    var tx, ty;
    if (t.kind === "plate") { tx = t.o.x; ty = P6_PY; } else if (t.kind === "em") { tx = t.o.x; ty = 290; } else { tx = t.o.x; ty = t.o.y; }
    var dx = tx - P.px, dy = ty - P.py, d = Math.hypot(dx, dy), k = d > 8 ? 1 : 0;
    P.botMv = { x: k * dx / (d || 1), y: k * dy / (d || 1) };
    P.botA = t.kind !== "pk" && d < 48;
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
  function drawStations(c) {
    var i, p, t = P.tt, x, w, col, wob;
    c.fillStyle = fl ? "#2b4a73" : "#5a3a22"; c.fillRect(0, 392, W, H - 392);
    c.fillStyle = fl ? "#3a6196" : "#7a5230"; c.fillRect(0, 392, W, 7);
    for (i = 0; i < 5; i++) {
      p = P.pl[i]; x = p.x;
      c.fillStyle = p.act ? "rgba(105,240,174,.10)" : "rgba(255,255,255,.04)"; c.beginPath(); c.ellipse(x, P6_PY + 6, 62, 22, 0, 0, TAU); c.fill();
      c.strokeStyle = p.act ? (near(p) && P.hold ? "#ffdf00" : "rgba(105,240,174,.5)") : "rgba(255,255,255,.15)"; c.lineWidth = 2; c.setLineDash([6, 5]); c.stroke(); c.setLineDash([]);
      c.fillStyle = p.act ? "#cfd6f0" : "#555"; c.fillRect(x - 2, 262, 4, 88);
      if (!p.act) { txt(c, "🔒 " + T.plates[i], x, 400, 12, "#667", "center"); continue; }
      wob = Math.sin(t * 22 + i) * (1 - p.v / 100) * 9;
      col = p.v > 60 ? "#43a047" : p.v > 30 ? "#f9a825" : "#e53935";
      c.save(); c.translate(x + wob, 258); c.rotate(wob * .02); c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(0, 4, 44, 11, 0, 0, TAU); c.fill();
      c.fillStyle = "#fbfaf4"; c.beginPath(); c.ellipse(0, 0, 44, 11, 0, 0, TAU); c.fill(); c.strokeStyle = col; c.lineWidth = 4; c.stroke();
      c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, 18, 4.5, 0, 0, TAU); c.fill(); c.restore();
      txt(c, T.plates[i].toUpperCase(), x, 392, 12, "#fff", "center", "rgba(0,0,0,.7)");
      uiBar(c, x - 46, 366 - 0, 92, 9, p.v / 100, col);
      if (p.blk > 0) { c.fillStyle = "rgba(180,20,20,.6)"; c.beginPath(); c.ellipse(x, P6_PY + 6, 62, 22, 0, 0, TAU); c.fill(); txt(c, "BLOQUEADO", x, 296, 13, "#fff", "center", "#8e0000"); }
      if (p.cr) {
        c.save(); var a = p.cr.t < 2 ? .6 + .4 * Math.sin(t * 20) : 1; c.globalAlpha = a; c.fillStyle = "#fff"; c.strokeStyle = "#e53935"; c.lineWidth = 2.5; rr(c, x - 62, 196, 124, 40, 8); c.fill(); c.stroke();
        c.font = "bold 10px 'Trebuchet MS', Arial"; var ls = wrap(c, p.cr.label, 112); c.fillStyle = "#222"; c.textAlign = "center"; c.textBaseline = "middle"; for (var j = 0; j < Math.min(2, ls.length); j++) c.fillText(ls[j], x, 210 + j * 12 - (ls.length > 1 ? 4 : 0));
        uiBar(c, x - 56, 229, 112, 4, p.crP, "#43a047", "rgba(0,0,0,.2)"); c.restore();
      }
    }
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
      var hx = 560, hw = 340; uiBar(c, hx, 76, hw, 12, B.hp / 100, "#e53935");
      txt(c, "PLENÁRIO DO CENTRÃO  " + Math.ceil(B.hp) + "%", hx, 70, 11, "#fff", "left", "rgba(0,0,0,.7)");
      if (B.dead) txt(c, "CAIU... por enquanto", hx + hw / 2, 100, 18, "#69f0ae", "center", "#000");
    }
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
  function drawThings(c) {
    var i, k, x, y, a, gold, col;
    for (i = 0; i < P.em.length; i++) { var e = P.em[i]; c.save(); c.translate(e.x, e.y); c.rotate(Math.sin(P.tt * 6 + i) * .15); c.fillStyle = "#fbfaf4"; rr(c, -34, -18, 68, 36, 6); c.fill(); c.strokeStyle = "#ffb300"; c.lineWidth = 3; c.stroke(); txt(c, "🔨", -16, 1, 18, "#000", "center"); txt(c, "EMENDA", 12, 1, 10, "#333", "center"); c.restore(); }
    for (i = 0; i < P.pk.length; i++) {
      k = P.pk[i]; a = k.t < 2 ? .5 + .5 * Math.sin(P.tt * 16) : 1; gold = k.kind !== "smooth"; col = k.kind === "smooth" ? "#80d8ff" : "#ffdf00";
      c.save(); c.globalAlpha = a; c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 14; c.beginPath(); c.arc(k.x, k.y, 24, 0, TAU); c.fill(); c.shadowBlur = 0; c.strokeStyle = "#fff"; c.lineWidth = 3; c.stroke();
      txt(c, k.kind === "rush" ? T.rushIc : k.kind === "smooth" ? T.smIc : T.spIc, k.x, k.y + 1, 24, "#000", "center");
      if (S.censor <= 0 || k.kind !== "special") txt(c, k.kind === "rush" ? "ESPECIAL" : k.kind === "smooth" ? "VIDA" : "TUDO ESTÁVEL", k.x, k.y + 36, 10, "#fff", "center", "rgba(0,0,0,.8)"); c.restore();
    }
    // jogador
    var blink = P.inv > 0 && Math.floor(P.tt * 20) % 2 === 0;
    if (!blink) {
      var mvg = mv(), moving = Math.abs(mvg.x) + Math.abs(mvg.y) > .1;
      if (P.hold) { c.strokeStyle = "rgba(255,223,0,.7)"; c.lineWidth = 3; c.beginPath(); c.arc(P.px, P.py - 24, 36 + Math.sin(P.tt * 18) * 3, 0, TAU); c.stroke(); }
      drawChar(c, "npc", P.px, P.py, 1.05, { t: P.tt, moving: moving, shirt: fl ? "#f2c230" : "#d32f2f", skin: "#e0ac84", hair: "#3a2a1a", pants: "#222" });
      c.save(); c.translate(P.px, P.py - 56); c.scale(.3, .3); head(c, S.C.kind, {}); c.restore();
      if (S.t < 7) txt(c, "▼ você", P.px, P.py - 98, 11, "#fff", "center", "rgba(0,0,0,.7)");
    }
    // especial
    uiBar(c, W / 2 - 100, 508, 200, 10, P.spec / 100, P.spec >= 100 ? "#ffdf00" : "#ffa726");
    txt(c, P.spec >= 100 ? "K / ⭐ " + T.keyHelp.toUpperCase() + " PRONTA!" : "ESPECIAL: " + T.keyHelp, W / 2, 498, 10, P.spec >= 100 ? "#ffdf00" : "#9aa0b4", "center", "rgba(0,0,0,.6)");
  }
  function drawBossBanner(c) {
    var B = P.boss; if (!B || B.intro <= 0) return;
    var a = clamp(Math.min((2.8 - B.intro) / .3, B.intro / .4), 0, 1);
    c.save(); c.globalAlpha = a; c.fillStyle = "rgba(0,0,0,.6)"; c.fillRect(0, 205, W, 100);
    txt(c, "CHEFE: PLENÁRIO DO CENTRÃO", W / 2, 238, 34, "#ff8a65", "center", "#000");
    txt(c, "Segure A perto das 🔨 EMENDAS para rebater · mantenha os pratos no ar", W / 2, 278, 16, "#fff", "center", "#000"); c.restore();
  }
  function draw(c) {
    if (P.ph === "ending") { drawEnding(c); return; }
    bg(c); drawStations(c); drawCrowd(c, !!P.boss); drawCameo(c); drawThings(c);
    if (P.slow > 0) txt(c, "ESTABILIDADE LENTA", W / 2, 118, 14, "#80d8ff", "center", "rgba(0,0,0,.8)");
    drawBossBanner(c);
    txt(c, T.where, 20, 424, 11, "#9aa0b4", "left");
    if (S.censor > 0) {
      c.fillStyle = "rgba(0,0,0,.35)"; for (var i = 0; i < 6; i++) c.fillRect(0, ((P.tt * 400 + i * 97) % H), W, 2 + (i % 3) * 3);
      c.fillStyle = "rgba(255,255,255,.07)"; c.fillRect(0, 0, W, H);
    }
  }

  function updEndingFx() {
    var f = P.pageFlags;
    if (P.page === 0) { for (var i = 0; i < 6; i++) { var key = "s" + i; if (!f[key] && P.pt > i * .5 + .45) { f[key] = 1; sfx("stamp"); shake(4); } } }
    if (P.page === 1 && !f.big && P.pt > 1.4) { f.big = 1; sfx("boom"); shake(10); flashScr("255,40,40", .4); }
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
  }
  function tap(x, y) { if (P.ph === "ending") nextPage(); }
  function info() {
    return { ending: P.ph === "ending", secret: P.secret, censored: S.censor > 0, phase: P.ph, page: P.page, boss: P.boss ? Math.round(P.boss.hp) : null, bossDead: !!(P.boss && P.boss.dead),
      ok: P.ok, wrong: P.wrong, missed: P.missed, spec: Math.round(P.spec), plates: P.pl.map(function (p) { return Math.round(p.v); }), active: P.pl.filter(function (p) { return p.act; }).length };
  }
  return {
    intro: { sub: T.where, foeLabel: "OPOSIÇÃO + CENTRÃO", lines: fl
      ? ["Miami: mantenha os pratos (filas, câmbio, segurança...) no ar!", "Setas/WASD mover · segure Espaço/J perto do prato para estabilizar", "K = Visto Carimbado (especial) · toque: joystick + botões", "No fim, o Plenário do Centrão joga emendas. Bata nelas!"]
      : ["Planalto: mantenha os pratos (Saúde, Economia, Segurança...) no ar!", "Setas/WASD mover · segure Espaço/J perto do prato para estabilizar", "K = Caneta de Ouro (especial) · toque: joystick + botões", "No fim, o Plenário do Centrão joga emendas. Bata nelas!"] },
    arcade: { a: "🤲", b: "🖊" },
    update: update, draw: draw, overlay: overlay, key: key, tap: tap, act: actBtn, bot: bot, info: info,
    timeUp: function () { if (P.ph === "play") startEnding(); },
    begin: function () { say(fl ? "nunca" : "dilma_meta_aberta", "inicio", 1); }
  };
};
