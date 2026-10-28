"use strict";
/* ================= Fase 2 — Grupo da Família (WhatsApp) =================
   Desvie de áudios de 8 min e boatos, colete provas, acerte 3 rodadas de tática (inspirado em jogos de
   alfabetização midiática tipo Bad News) e derrote o Tio/Tia do Zap com prints com fonte. */

var P2_LX = [340, 480, 620];       // centro das 3 colunas
var P2_TAC = [
  { id: "emo", name: "Emoção exagerada", why: "Quer que você sinta medo ou raiva antes de pensar." },
  { id: "esp", name: "Falso especialista", why: "“Um doutor disse”: sem nome, sem fonte, sem checagem." },
  { id: "cons", name: "Teoria da conspiração", why: "“Ninguém te conta”: tudo vira plano secreto." },
  { id: "pol", name: "Polarização", why: "Só existem dois times; o meio-termo vira inimigo." },
  { id: "fake", name: "Personagem falso", why: "Perfil criado ontem fingindo ser gente comum." }
];
var P2_MSG = {   // R = parente do time da seleção · L = parente do time da estrela (tudo absurdo, de propósito)
  emo: { R: "😱😱 GENTE!!! SE O OUTRO LADO GANHAR O PÃO DE QUEIJO VAI ACABAR E VOCÊ VAI CHORAR PRA SEMPRE!!! 😭😭", L: "🚨🚨 ACORDA!!! SE O OUTRO LADO GANHAR A FEIJOADA DE SÁBADO ACABA!!! COMPARTILHA ANTES QUE APAGUEM!!!" },
  esp: { R: "Segundo um doutor em Astrologia Política pela Universidade do YouTube, o voto de Capricórnio vale em dobro.", L: "Um “especialista” (primo do cunhado de um economista) garante: o dólar cai se todo mundo vestir vermelho." },
  cons: { R: "Eles não querem que você saiba: o sol só nasce às 6h porque o outro lado combinou com as nuvens.", L: "Pensa comigo: por que o outro lado nunca perde o chinelo? Ninguém te conta isso, hein." },
  pol: { R: "Ou você pensa igual ao tio ou é inimigo do churrasco e da pátria. Meio-termo não existe!", L: "Quem não pensa igual à tia não merece nem pão de queijo. Escolhe um lado, sem conversa!" },
  fake: { R: "Perfil @patriota_do_pastel_1984 (foto de gato, 3 seguidores): “Sou eleitor comum, juro que sou real!”", L: "Perfil @cidadao_de_bem_2000 (foto de planta, criado ontem): “Sou professor, médico e astronauta. Confiem.”" }
};
var P2_FAKES = ["Pão de queijo será taxado em 300%!", "Picanha só com CPF de cidadão do bem!", "Gato do vizinho é infiltrado: compartilhe!", "Terça-feira será extinta no domingo!", "Churrasco proibido por decreto (de quem? ninguém sabe)", "Cientistas: Wi-Fi só pega pra um lado!", "Feriado de 31/02 já foi aprovado!!"];
var P2_GOAL = 12;

function p2_laneOfX(x) { return x < 410 ? 0 : x < 550 ? 1 : 2; }
function p2_bubble(c, x, y, w, h, fill, bd) {   // balão de chat centrado em (x,y)
  c.fillStyle = fill; c.strokeStyle = bd || "rgba(0,0,0,.25)"; c.lineWidth = 1.5; rr(c, x - w / 2, y - h / 2, w, h, 9); c.fill(); c.stroke();
}
function p2_shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(RNG() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

SCEN[2] = function (S) {
  var o = { anim: 0, lane: 1, px: P2_LX[1], items: [], spawnT: 1.2, provas: 0, tacRight: 0, cardsDone: 0, cardAt: [28, 58, 88], card: null, boss: null,
    deaf: 0, inv: 0, segLost: 0, dodged: 0, heartT: 28, hurtFlash: 0, feed: [], ended: false, spoke: 0, tacOrder: [], firstFake: true };
  S.lives = 3; S.maxLives = 3; S.time = 150; S.timeMax = 150; S.livesLabel = "VISUALIZAÇÕES";
  var rightFlavor = S.camp === "lula";   // Time Lula: o tio chato é do time da seleção
  var tacs = p2_shuffle([0, 1, 2, 3, 4]).slice(0, 3), firstSide = RNG() < .5;
  for (var ti = 0; ti < 3; ti++) o.tacOrder.push({ tac: tacs[ti], side: (ti % 2 === 0) === firstSide ? "R" : "L" });
  var FEED = ["Tio Zé: bom dia com glitter ✨", "Tia Néia: ENCAMINHADA ↪↪↪", "Prima Bia: gente, respirem 🙏", "Tio Marcos está gravando áudio…", "Vó Lúcia: quem é esse número?", "Primo Dudu saiu do grupo", "Tia Rô: vejam o vídeo (11 min)", "Tio Zé: fiz um áudio de 8 min"];

  function grade() { var gr = o.segLost === 0 ? "g" : o.segLost === 1 ? "y" : "r"; S.grid.push(gr); o.segLost = 0; }
  function laneItems(L) { var r = []; for (var i = 0; i < o.items.length; i++) if (o.items[i].lane === L) r.push(o.items[i]); return r; }
  function mkItem(k, lane, y, vy) {
    var it = { k: k, lane: lane, y: y, vy: vy, dead: false, w: 124, h: 48, tx: "" };
    if (k === "audio") { it.tx = pick(["8:12", "7:48", "9:03", "8:30", "10:01"]); it.h = 46; }
    else if (k === "fake") { it.tx = pick(P2_FAKES); it.h = 68; }
    else if (k === "prova") { it.h = 50; }
    else { it.w = 44; it.h = 44; }
    o.items.push(it); return it;
  }
  function speed() { var pr = clamp(S.t / 105, 0, 1); return o.boss ? 190 : 185 + 105 * pr; }

  function spawnRow() {
    var pr = clamp(S.t / 105, 0, 1), lanes = p2_shuffle([0, 1, 2]), nh = (pr > .25 && RNG() < .25 + pr * .3) ? 2 : 1, i, vy = speed();
    if (nh === 2 && o.freeLast != null) { var fl = lanes.filter(function (L) { return Math.abs(L - o.freeLast) <= 1; }); var fr = pick(fl); lanes = [0, 1, 2].filter(function (L) { return L !== fr; }); lanes.push(fr); }
    o.freeLast = nh === 2 ? lanes[2] : null;
    for (i = 0; i < nh; i++) mkItem(RNG() < .45 ? "audio" : "fake", lanes[i], 124, vy);
    if (nh < 3 && RNG() < .32) mkItem("prova", lanes[nh], 124, vy);
    else if (o.heartT <= 0 && S.lives < 3 && nh < 2) { mkItem("heart", lanes[nh], 124, vy); o.heartT = 30; }
  }
  function spawnWave() {   // chefe: uma coluna livre, com prova na coluna livre
    var f = Math.floor(RNG() * 3), vy = speed(), L;
    for (L = 0; L < 3; L++) { if (L === f) mkItem("prova", L, 290, vy); else mkItem(RNG() < .5 ? "audio" : "fake", L, 290, vy); }
  }
  function say2(id, ev, prio) { say(id, ev, prio || 0); }

  function startBoss() {
    o.boss = { hp: 5, max: 5, intro: 2.2, wave: .6, t: 0, hurt: 0, line: "", lineT: 0, lines: rightFlavor
      ? ["Ouve esse áudio de 9 min: o Brasil acaba amanhã (de novo)!", "Meu cunhado viu num grupo, então é verdade!", "Tá tudo errado! (não vou dizer o quê)"]
      : ["Compartilha: o churrasco vai virar reunião de sindicato!", "Minha amiga viu num grupo, então é verdade!", "Tá tudo errado! (não vou dizer o quê)"] };
    S.toast((rightFlavor ? "TIO" : "TIA") + " DO ZAP entrou no grupo! Colete provas pra rebater!", "#ffcc80", 3);
    say2("hoje", "chefe", 1); shake(6); sfx("alarm"); grade();
  }
  function openCard() {
    var d = o.tacOrder[o.cardsDone], T = P2_TAC[d.tac], others = p2_shuffle([0, 1, 2, 3, 4].filter(function (i) { return i !== d.tac; })).slice(0, 2);
    var opts = p2_shuffle([d.tac, others[0], others[1]]);
    o.card = { t: 0, tac: d.tac, side: d.side, opts: opts, picked: null, after: 0, msg: P2_MSG[T.id][d.side], from: d.side === "R" ? "Tio Cacá 🇧🇷 (time da seleção)" : "Tia Néia ⭐ (time da estrela)", n: o.cardsDone + 1 };
    o.cardsDone++; grade(); sfx("phone"); S.toast("📋 Rodada de tática! O tempo parou.", "#9fe8ff", 2);
  }
  function pickCard(i) {
    var cd = o.card; if (!cd || cd.picked != null || i < 0 || i > 2) return;
    cd.picked = i; var ok = cd.opts[i] === cd.tac, T = P2_TAC[cd.tac];
    if (ok) { o.tacRight++; S.add(200, W / 2, 420, "#69f0ae"); S.up(W / 2, 400); S.grid.push("g"); sfx("coin"); burst(W / 2, 300, "#69f0ae", 16, 170); }
    else { S.hit(); S.grid.push("r"); sfx("nope"); }
    cd.ok = ok; cd.after = 2.8; cd.exp = (ok ? "Isso! " : "Era “" + T.name + "”. ") + T.why;
  }
  function closeCard() { o.card = null; }

  function cardRects() { var r = [], i; for (i = 0; i < 3; i++) r.push({ x: 190, y: 292 + i * 52, w: 580, h: 44 }); return r; }

  function perf() {
    var pv = clamp(o.provas / 16, 0, 1), tc = o.tacRight / 3, lv = S.lives / 3, bs = o.boss ? (o.boss.dead ? 1 : 1 - o.boss.hp / o.boss.max) : 0;
    return clamp(.3 * pv + .25 * tc + .25 * lv + .2 * bs + (o.boss && o.boss.dead ? .0 : 0), 0, 1) * (o.boss && o.boss.dead ? 1 : .9) + (o.boss && o.boss.dead ? .1 * (S.time / 150) : 0);
  }
  var TITLES = ["Mudo no Grupo", "Leitor de Visualização", "Fiscal de Corrente", "Checador Raiz", "Fact-checker da Família"];
  function finish(win, line) {
    if (o.ended) return; o.ended = true; grade();
    S.end(win, win ? clamp(perf(), .3, 1) : .2, line, { titles: TITLES, failTitle: "Saiu do Grupo", voiceWin: win ? "bola" : null, voiceLose: win ? null : "parou" });
  }
  function hurt(why) {
    if (o.inv > 0) return;
    S.lives--; o.inv = 1.0; o.segLost++; S.hit(); o.hurtFlash = .5; shake(9); flashScr("229,57,53", .4); sfx("hit"); burst(o.px, 440, "#ff8a80", 14, 160);
    popup(why, o.px, 400, "#ff6b6b", 18);
    if (S.lives <= 0) finish(false, "Você acreditou em boato demais e levou bronca da família inteira! Saiu do grupo (por vontade própria).");
  }

  function update(dt) {
    var i, it, pr = clamp(S.t / 105, 0, 1);
    o.anim += dt;
    if (o.card) {
      S.time += dt;   // o tempo para durante a rodada de tática
      o.card.t += dt;
      if (o.card.picked != null) { o.card.after -= dt; if (o.card.after <= 0) closeCard(); }
      return;
    }
    o.px += (P2_LX[o.lane] - o.px) * Math.min(1, dt * 16);
    o.deaf = Math.max(0, o.deaf - dt); o.inv = Math.max(0, o.inv - dt); o.hurtFlash = Math.max(0, o.hurtFlash - dt); o.heartT -= dt;
    if (Math.floor(S.t / 7) !== o.spoke) { o.spoke = Math.floor(S.t / 7); o.feed.unshift(pick(FEED)); if (o.feed.length > 5) o.feed.pop(); }
    if (S.t < .2 && !o.opened) { o.opened = true; say2("camp", "start", 1); }
    if (!o.boss && (S.t >= 105 || S.time <= 40) && !o.ended) startBoss();
    if (!o.boss && o.cardsDone < 3 && S.t >= o.cardAt[o.cardsDone] && S.time > 6) { openCard(); return; }
    var B = o.boss;
    if (!B) { o.spawnT -= dt; if (o.spawnT <= 0) { spawnRow(); o.spawnT = 1.3 - .55 * pr; } }
    else {
      B.t += dt; B.hurt = Math.max(0, B.hurt - dt); B.lineT -= dt;
      if (B.dead) { return; }
      if (B.intro > 0) B.intro -= dt;
      else { B.wave -= dt; if (B.wave <= 0) { spawnWave(); B.wave = 1.7; if (RNG() < .6) { B.line = pick(B.lines); B.lineT = 2.4; } } }
    }
    // itens
    for (i = o.items.length - 1; i >= 0; i--) {
      it = o.items[i]; it.y += it.vy * dt;
      if (!it.dead && it.lane === o.lane && Math.abs(it.y - 446) < (it.h / 2 + 16)) {
        it.dead = true;
        if (it.k === "prova") {
          o.provas++; S.add(30, o.px, 400, "#69f0ae"); S.up(o.px, 380); sfx("coin"); burst(o.px, 440, "#69f0ae", 10, 140);
          if (B && B.intro <= 0 && !B.dead) {
            B.hp--; B.hurt = .5; shake(5); ring(480, 220, "#ffdf00", 10); popup("PRINT COM FONTE!", 480, 200, "#ffdf00", 20); sfx("stamp");
            if (B.hp <= 0) { B.dead = true; S.add(400, 480, 260, "#ffdf00"); burst(480, 240, "#ffdf00", 40, 260); flashScr("255,223,0", .5); finish(true, "O " + (rightFlavor ? "Tio" : "Tia") + " do Zap foi vencido com " + o.provas + " prints com fonte! Você silenciou o grupo (só por 5 minutos)."); }
          }
        } else if (it.k === "heart") { if (S.lives < 3) S.lives++; sfx("pow"); popup("+1 ❤", o.px, 400, "#ff8a80", 20); S.toast("Prima Bia: “gente, bora respirar 🙏”", "#ffb4c8", 2.4); }
        else if (it.k === "audio") {
          if (o.inv <= 0) { S.time = Math.max(1, S.time - 6); o.deaf = .4; S.hit(); o.segLost++; o.inv = .7; shake(6); sfx("phone"); popup("-6s · ouviu o áudio!", o.px, 400, "#ff8a65", 17); flashScr("255,160,0", .25); }
        } else {
          if (o.firstFake) { o.firstFake = false; say2("parou", "boato", 1); }
          hurt("ACREDITOU!");
        }
      }
      if (it.y > 520) { if (!it.dead && it.k !== "prova" && it.k !== "heart") { o.dodged++; S.score += 10; } o.items.splice(i, 1); }
    }
  }

  function setLane(L) { if (o.card || o.deaf > 0) return; o.lane = clamp(L, 0, 2); }

  /* ================= desenho ================= */
  function drawWall(c) {
    c.fillStyle = "#ece5dd"; c.fillRect(266, 70, 428, 470);
    var off = (o.anim * 38) % 64, i, j, h;
    c.save(); c.beginPath(); c.rect(266, 112, 428, 394); c.clip(); c.fillStyle = "rgba(60,50,30,.07)"; c.font = "bold 20px Arial"; c.textAlign = "center"; c.textBaseline = "middle";
    for (j = -1; j < 8; j++) for (i = 0; i < 7; i++) { h = hash(i * 13 + j + Math.floor(o.anim * 38 / 64) * -1 + 100); c.fillText(h < .25 ? "♥" : h < .5 ? "☺" : h < .75 ? "★" : "✿", 290 + i * 64 + (j % 2) * 30, 112 + j * 64 + off); }
    c.restore();
    c.strokeStyle = "rgba(0,0,0,.09)"; c.lineWidth = 2; c.setLineDash([8, 10]); c.beginPath(); c.moveTo(410, 114); c.lineTo(410, 504); c.moveTo(550, 114); c.lineTo(550, 504); c.stroke(); c.setLineDash([]);
    c.fillStyle = "rgba(0,150,70,.09)"; c.fillRect(P2_LX[o.lane] - 66, 114, 132, 392);
  }
  function drawItem(c, it) {
    var x = P2_LX[it.lane], y = it.y, a = clamp((y - 114) / 26, 0, 1), i, lines;
    c.save(); c.globalAlpha = a;
    if (it.k === "audio") {
      p2_bubble(c, x, y, 124, 46, "#dcf8c6", "#8bc34a");
      c.fillStyle = "#43a047"; c.beginPath(); c.moveTo(x - 54, y - 9); c.lineTo(x - 54, y + 9); c.lineTo(x - 40, y); c.fill();
      for (i = 0; i < 9; i++) { c.fillStyle = "rgba(0,0,0,.28)"; c.fillRect(x - 34 + i * 5, y - 3 - Math.abs(Math.sin(i * 1.7 + o.anim * 5)) * 8, 3, 6 + Math.abs(Math.sin(i * 1.7 + o.anim * 5)) * 16); }
      txt(c, "🎙 " + it.tx, x + 33, y + 1, 14, "#1b5e20", "center"); txt(c, "áudio · 8 min!", x + 4, y + 17, 9, "#666", "center");
    } else if (it.k === "fake") {
      p2_bubble(c, x, y, 124, 68, "#fff", "#e53935");
      c.fillStyle = "#e53935"; rr(c, x - 60, y - 33, 62, 14, 4); c.fill(); txt(c, "↪ ENCAMINHADA", x - 29, y - 26, 7, "#fff", "center");
      c.save(); c.translate(x + 38, y - 24); c.rotate(.12); c.strokeStyle = "#e53935"; c.lineWidth = 2; c.strokeRect(-20, -8, 40, 16); txt(c, "BOATO", 0, 0, 10, "#e53935", "center"); c.restore();
      c.font = "bold 10px 'Trebuchet MS', Arial"; lines = wrap(c, it.tx, 112);
      for (i = 0; i < Math.min(3, lines.length); i++) txt(c, lines[i], x - 56, y - 6 + i * 12, 10, "#222", "left");
    } else if (it.k === "prova") {
      p2_bubble(c, x, y, 118, 50, "#e8f4ff", "#1e88e5"); c.strokeStyle = "#43a047"; c.lineWidth = 3; rr(c, x - 59, y - 25, 118, 50, 9); c.stroke();
      txt(c, "📎", x - 40, y - 3, 20, "#000", "center"); txt(c, "print c/ fonte", x + 12, y - 7, 11, "#0d47a1", "center"); txt(c, "✔✔ link ok", x + 12, y + 9, 11, "#2e7d32", "center");
    } else {
      c.fillStyle = "#ffb4c8"; c.beginPath(); c.arc(x, y, 22, 0, TAU); c.fill(); c.strokeStyle = "#e91e63"; c.lineWidth = 2.5; c.stroke(); drawHeart(c, x, y + 1, 13, "#e91e63"); txt(c, "prima", x, y + 31, 9, "#ad1457", "center");
    }
    c.restore();
  }
  function drawBoss(c) {
    var B = o.boss; if (!B) return;
    var bx = 480, by = 278 - (B.dead ? 0 : 0), jig = B.hurt > 0 ? Math.sin(o.anim * 60) * 4 : 0;
    c.save(); if (B.dead) c.globalAlpha = .5;
    drawChar(c, "npc", bx + jig, by, 1.55, { t: o.anim, moving: B.intro <= 0 && !B.dead, shirt: rightFlavor ? "#2e9b3f" : "#c62828", skin: "#d9a070", hair: "#9e9e9e", pants: "#37474f", stun: B.hurt > 0 });
    c.fillStyle = "#222"; rr(c, bx + 22, by - 78, 16, 28, 3); c.fill(); c.fillStyle = "#4fc3f7"; rr(c, bx + 24, by - 76, 12, 22, 2); c.fill();   // celular na mão
    c.restore();
    uiPanel(c, 290, 116, 380, 30, "rgba(30,30,40,.86)");
    txt(c, (rightFlavor ? "TIO" : "TIA") + " DO ZAP", 300, 131, 11, "#ffcc80");
    uiBar(c, 380, 125, 280, 12, B.hp / B.max, "#ef5350", "rgba(255,255,255,.18)");
    if (B.lineT > 0 && !B.dead) { c.save(); c.globalAlpha = clamp(B.lineT * 2, 0, 1); p2_bubble(c, 480, 155, 380, 20, "#fff", "#555"); txt(c, B.line, 480, 155, 11, "#222", "center"); c.restore(); }
  }
  function drawPlayer(c) {
    var blink = o.inv > 0 && Math.floor(o.anim * 20) % 2 === 0;
    if (blink) return;
    var py = 498;
    drawChar(c, "npc", o.px, py, .95, { t: o.anim, moving: Math.abs(P2_LX[o.lane] - o.px) > 4, shirt: S.camp === "lula" ? "#d32f2f" : "#f2c230", skin: "#e0ac84", hair: "#3a2a1a", stun: o.deaf > 0 });
    if (S.t < 8 || o.deaf > 0) { txt(c, o.deaf > 0 ? "🎧 ouvindo áudio de 8 min…" : "▼ você", o.px, py - 78, 11, "#222", "center"); }
  }
  function drawPhone(c) {
    // moldura do celular
    c.fillStyle = "#0b0d12"; rr(c, 252, 56, 456, 520, 26); c.fill(); c.strokeStyle = "#2a2f3d"; c.lineWidth = 3; c.stroke();
    c.save(); rr(c, 264, 68, 432, 480, 16); c.clip();
    drawWall(c);
    var items = o.items, i; for (i = 0; i < items.length; i++) drawItem(c, items[i]);
    drawBoss(c);
    drawPlayer(c);
    // barra de digitação
    c.fillStyle = "#f0f0f0"; c.fillRect(264, 508, 432, 40); c.fillStyle = "#fff"; rr(c, 274, 513, 360, 30, 15); c.fill();
    txt(c, "😊  Digite uma mensagem (melhor não)", 288, 528, 12, "#999"); c.fillStyle = "#00a884"; c.beginPath(); c.arc(662, 528, 15, 0, TAU); c.fill(); txt(c, "🎤", 662, 529, 13, "#fff", "center");
    // cabeçalho
    c.fillStyle = "#075e54"; c.fillRect(264, 70, 432, 42);
    c.fillStyle = "#cfd8dc"; c.beginPath(); c.arc(292, 91, 15, 0, TAU); c.fill(); txt(c, "👨‍👩‍👧", 292, 92, 15, "#000", "center");
    txt(c, "Família ❤️🇧🇷 (47)", 316, 85, 15, "#fff");
    var typing = o.boss ? (rightFlavor ? "Tio do Zap" : "Tia do Zap") + " está gravando áudio…" : (o.feed[0] || "tio Marcos está gravando áudio…");
    txt(c, typing, 316, 102, 10, "#b9e6dc");
    txt(c, "⋮", 678, 92, 18, "#fff", "center");
    c.restore();
    if (o.hurtFlash > 0) { c.fillStyle = "rgba(229,57,53," + o.hurtFlash * .4 + ")"; c.fillRect(264, 68, 432, 480); }
  }
  function drawSide(c) {
    var i, y;
    // esquerda: provas e chefe
    uiPanel(c, 14, 76, 232, 150);
    txt(c, "📎 PROVAS", 28, 94, 13, "#9fe8ff"); txt(c, o.provas + " / " + P2_GOAL, 232, 94, 15, o.provas >= P2_GOAL ? "#69f0ae" : "#ffdf00", "right");
    uiBar(c, 28, 106, 204, 12, o.provas / P2_GOAL, o.provas >= P2_GOAL ? "#69f0ae" : "#4fc3f7");
    txt(c, "TÁTICAS", 28, 140, 11, "#9aa0b4");
    for (i = 0; i < 3; i++) { var gr = S.grid; c.fillStyle = "rgba(255,255,255,.14)"; c.beginPath(); c.arc(100 + i * 28, 140, 9, 0, TAU); c.fill(); }
    var shown = 0; for (i = 0; i < o.tacOrder.length; i++) { if (o.tacDone && o.tacDone[i] != null) { c.fillStyle = o.tacDone[i] ? "#43a047" : "#e53935"; c.beginPath(); c.arc(100 + i * 28, 140, 9, 0, TAU); c.fill(); } }
    txt(c, o.boss ? "CHEFE: colete provas!" : "meta: " + P2_GOAL + " provas ou o chefe", 28, 172, 11, "#e8e6dc");
    txt(c, "áudio −6s · boato −1 ❤", 28, 192, 11, "#ffab91"); txt(c, "prova +30 · rebate o chefe", 28, 210, 11, "#a5d6a7");
    // direita: legenda e notificações
    uiPanel(c, 714, 76, 232, 190);
    txt(c, "AO VIVO NO GRUPO", 728, 94, 12, "#ffdf00");
    for (i = 0; i < Math.min(5, o.feed.length); i++) txt(c, o.feed[i].slice(0, 34), 728, 116 + i * 22, 11, i === 0 ? "#fff" : "rgba(255,255,255," + (.7 - i * .12) + ")");
    if (!o.feed.length) txt(c, "(grupo silencioso... por enquanto)", 728, 116, 11, "#9aa0b4");
    uiPanel(c, 714, 276, 232, 100);
    txt(c, "COMO JOGAR", 728, 294, 12, "#ffdf00");
    txt(c, "← → ou A D · toque na coluna", 728, 314, 11, "#e8e6dc"); txt(c, "desvie 🎙 e 📢, pegue 📎", 728, 332, 11, "#e8e6dc"); txt(c, "Rodadas de tática: 1 2 3", 728, 350, 11, "#e8e6dc");
  }
  function drawCard(c) {
    var cd = o.card; if (!cd) return; var T = P2_TAC[cd.tac], i, rs = cardRects(), a = clamp(cd.t * 5, 0, 1);
    c.save(); c.globalAlpha = a; c.fillStyle = "rgba(4,8,20,.8)"; c.fillRect(0, 0, W, H);
    uiPanel(c, 170, 80, 620, 440, "rgba(10,18,44,.97)", "#4fc3f7");
    txt(c, "RODADA DE TÁTICA " + cd.n + "/3 · QUE TRUQUE É ESSE?", W / 2, 106, 18, "#9fe8ff", "center");
    p2_bubble(c, W / 2, 178, 560, 100, "#fff", "#999");
    txt(c, "↪ " + cd.from, 210, 138, 11, "#e53935", "left");
    c.font = "bold 14px 'Trebuchet MS', Arial"; var lines = wrap(c, cd.msg, 530);
    for (i = 0; i < Math.min(4, lines.length); i++) txt(c, lines[i], 210, 160 + i * 18, 14, "#222", "left");
    txt(c, "(mensagem absurda de propósito: os dois lados fazem isso)", W / 2, 236, 11, "#9aa0b4", "center");
    for (i = 0; i < 3; i++) {
      var r = rs[i], tn = P2_TAC[cd.opts[i]].name, pk = cd.picked != null, isC = cd.opts[i] === cd.tac;
      uiButton(c, r, tn, { key: String(i + 1), hot: pk && isC, bg: pk ? (isC ? "#2e7d32" : (cd.picked === i ? "#b71c1c" : "rgba(14,22,56,.6)")) : null, col: pk && (isC || cd.picked === i) ? "#fff" : null, size: 16 });
    }
    if (cd.picked != null) {
      txt(c, cd.exp, W / 2, 468, 14, cd.ok ? "#69f0ae" : "#ffab91", "center");
      txt(c, "Enter / toque para continuar", W / 2, 496, 12, "#ffdf00", "center");
    }
    c.restore();
  }
  function draw(c) {
    var gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#0a1a14"); gr.addColorStop(1, "#050a12"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    for (var i = 0; i < 40; i++) { c.fillStyle = "rgba(255,255,255,.12)"; c.fillRect(hash(i) * W, hash(i + 3) * H, 2, 2); }
    drawSide(c); drawPhone(c);
    drawCard(c);
  }
  o.tacDone = [];
  var _pick = pickCard; pickCard = function (i) { var cd = o.card, was = cd && cd.picked; _pick(i); if (cd && was == null && cd.picked != null) o.tacDone[cd.n - 1] = cd.ok; };

  return {
    intro: { sub: "WhatsApp · a família inteira online", foeLabel: "TIOS DO OUTRO LADO",
      lines: ["Você é o parente que ainda não saiu do grupo da família.", "← → / A D ou toque nas colunas para trocar de coluna", "Desvie de 🎙 áudios de 8 min e 📢 boatos · colete 📎 provas", "3 rodadas de tática: descubra o truque da desinformação"] },
    info: function () { return { provas: o.provas, bossHp: o.boss ? o.boss.hp : null, cards: o.cardsDone, tacRight: o.tacRight, lane: o.lane, dodged: o.dodged }; },
    update: update, draw: draw,
    key: function (code) {
      if (o.card) {
        var m = /^(Digit|Numpad)([1-3])$/.exec(code);
        if (m) pickCard(+m[2] - 1); else if ((code === "Enter" || code === "Space") && o.card.picked != null && o.card.after < 2.3) closeCard();
        return;
      }
      if (code === "ArrowLeft" || code === "KeyA") setLane(o.lane - 1); else if (code === "ArrowRight" || code === "KeyD") setLane(o.lane + 1);
    },
    tap: function (x, y) {
      if (o.card) {
        if (o.card.picked != null) { if (o.card.after < 2.3) closeCard(); return; }
        var rs = cardRects(); for (var i = 0; i < 3; i++) if (inRect(x, y, rs[i])) pickCard(i);
        return;
      }
      setLane(p2_laneOfX(x));
    },
    bot: function (dt) {
      if (o.card) { o.bc = (o.bc || 0) + dt; if (o.card.picked == null && o.bc > .8) { o.bc = 0; var ci = o.card.opts.indexOf(o.card.tac); pickCard(RNG() < .2 ? (ci + 1) % 3 : ci); } return; }
      o.bt = (o.bt || 0) - dt; if (o.bt > 0) return; o.bt = .09;
      if (RNG() < .012) { o.bt = .45; return; }   // distração
      var L, best = -1e9, bl = o.lane, it, i;
      for (L = 0; L < 3; L++) {
        var near = 9999, pr = 0, k;
        for (i = 0; i < o.items.length; i++) { it = o.items[i]; if (it.lane !== L || it.dead) continue; k = 446 - it.y; if (k < -60) continue;
          if (it.k === "audio" || it.k === "fake") near = Math.min(near, k); else if (k < 330) pr = Math.max(pr, 1 + (330 - k) / 330); }
        var sc = Math.min(near, 330) + pr * 160 - Math.abs(L - o.lane) * 20 + (L === o.lane ? 15 : 0); if (near < 330 && near < 230) sc -= 400;
        if (sc > best) { best = sc; bl = L; }
      }
      setLane(bl);
    },
    timeUp: function () {
      if (o.ended) return;
      if (o.provas >= P2_GOAL) finish(true, "O tempo acabou, mas você juntou " + o.provas + " provas: o grupo ficou em paz (por enquanto).");
      else finish(false, "Acabou o tempo com só " + o.provas + " de " + P2_GOAL + " provas. O grupo seguiu espalhando boato.");
    }
  };
};
