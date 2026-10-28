"use strict";
/* ================= FASE 1 — Debate da Globo (23/10/2026) ================= */
/* quiz-ação: ataque do adversário → 3 réplicas (1-2-3 ou toque) antes do tempo acabar. Armadilhas por lado. */

var P1_GOODQ = ["Mandou bem!", "Aplausos no auditório!", "Resposta de manual!", "A plateia de pé!", "Réplica na veia!"];
var P1_OKQ = ["Passou raspando.", "Meio morno...", "Dava pra caprichar!", "O mediador bocejou."];
var P1_BADQ = ["O auditório vaiou!", "Gafe ao vivo!", "Direito de resposta pro outro!", "Mediador: 'sem comentários'."];

/* texto: q = ataque; g = réplica boa; o = mais ou menos; b = ruim; tr = tentação (armadilha 'nove dedos') */
var P1_LULA = [   // jogador = Lula; adversário = Flávio
  { q: "O senhor fala em picanha desde 2022. Cadê a picanha, presidente?", g: "Estamos entregando emprego e renda; a picanha vem junto com o churrasco da família.", o: "Picanha? Eu prefiro uma linguiça de domingo.", b: "Picanha é coisa de elite, não me pergunte." },
  { q: "Seu governo vive viajando! Já deu a volta ao mundo?", g: "Viagem que abre mercado vira emprego em casa. E o seu plano de voo, qual é?", o: "Já visitei tanto lugar que perdi a conta.", b: "Avião é pra quem tem pressa; eu sou calmo." },
  { name: true },
  { q: "Sua turma só sabe dizer que a culpa é do passado!", g: "Reconheço o que herdei e mostro resultado. O senhor tem plano pro futuro?", o: "A culpa é de quem veio antes, claro.", b: "Passado? Nunca ouvi falar." },
  { q: "O seu governo só grava vídeo pra rede social!", g: "Vídeo é meio; o fim é obra entregue. Quer ver o canteiro?", o: "Meu vídeo tem mais curtida que o seu.", b: "Não sei mexer no celular." },
  { q: "Reforma, reforma, reforma... e entrega só reunião!", g: "Reforma se faz votando; reunião é onde eu convenço o Congresso.", o: "Reunião com café é meu forte.", b: "Reunião? Só vou se tiver bolo." },
  { q: "'Paz e amor', mas a conta do mercado é guerra!", g: "Priorizamos renda e preço de comida: emprego e crédito resolvem a conta.", o: "Mercado é caro mesmo, né?", b: "Vai comprar fiado." },
  { name: true },
  { q: "Sua turma só fala de 'democracia' o tempo todo!", g: "Democracia é o que permite o senhor me perguntar isso ao vivo.", o: "Falo de democracia e de futebol.", b: "Democracia? Tenho horror a esse assunto." },
  { q: "O senhor vai tocar mais quatro anos nesse ritmo?", g: "Ritmo de quem trabalha: olhe a agenda e os resultados, não o relógio.", o: "Tô de pé, né?", b: "Preciso de uma soneca antes." },
  { q: "E o povo? O que muda na vida de quem acorda às cinco?", g: "Salário, emprego e remédio mais perto de casa. É isso que eu apresento.", o: "Muda o ônibus, talvez.", b: "Eu acordo às dez, não sei." }
];
var P1_FLAVIO = [   // jogador = Flávio; adversário = Lula
  { q: "Vocês só falam em 'Brasil acima de tudo' e esquecem a feira!", g: "Brasil acima de tudo inclui a feira, o mercado e o bolso do trabalhador.", o: "Feira? Eu gosto de pastel.", b: "Feira é coisa de esquerdista." },
  { q: "O senhor não tem plano, só tem meme!", g: "Meme é tempero; o prato é corte de imposto e emprego. Posso detalhar.", o: "Meme bom é meme com bandeira.", b: "Plano? O plano é secreto." },
  { q: "Chega de baixaria, vamos falar de propostas!", g: "Concordo: segurança e economia, ponto a ponto.", o: "Propostas? Primeiro um café.", tr: "Rebater soltando o apelido 'nove dedos' (a tentação da baixaria)" },
  { q: "Pra vocês tudo é perseguição: imprensa, juiz, o vizinho!", g: "Quem cumpre a lei não teme a Justiça; o que importa é discutir ideias.", o: "Perseguição? Pergunta pro vizinho.", b: "Foi tudo culpa da Argentina." },
  { q: "Sua campanha vive de corrente de zap e vídeo cortado!", g: "Campanha boa explica a proposta de frente pro eleitor, sem corte e sem corrente.", o: "Meu zap só tem 'bom dia'.", b: "Corrente é a minha especialidade." },
  { q: "Quem vai pagar a conta das suas promessas?", g: "Corte de desperdício e crescimento. Eu mostro as contas.", o: "Quem paga é o mercado.", tr: "Fazer piada com 'nove dedos' pra ganhar aplauso" },
  { q: "O senhor fala em liberdade, mas e o preço da carne?", g: "Liberdade pra produzir baixa preço: menos burocracia, mais oferta.", o: "Carne? Eu sou mais de frango.", b: "Quem manda no preço é o boi." },
  { q: "Sua turma briga com todo mundo: imprensa, juiz, sogra!", g: "Discordar não é brigar; a gente debate ideias e respeita a regra do jogo.", o: "A sogra começou.", b: "Briga é meu esporte." },
  { q: "Vamos subir o nível? Qual a sua proposta pra escola?", g: "Escola em tempo integral e professor valorizado.", o: "Escola boa é a que tem bandeira.", tr: "Mandar um 'nove dedos' pra provocar e levar ovação" },
  { q: "O senhor ainda depende do sobrenome pra ganhar voto?", g: "Voto se conquista com proposta; o sobrenome abre a porta, a conversa é comigo.", o: "Meu sobrenome é marca registrada.", b: "Meu pai resolve." },
  { q: "Fale pro povo: o que o senhor muda no primeiro dia?", g: "Primeiro dia: preço, segurança e emprego, com meta e prazo.", o: "No primeiro dia eu tomo café.", b: "No primeiro dia, descanso." }
];
var P1_BOSS = [
  { q: "MEDIADOR: ECONOMIA! Direito de resposta, 4 segundos!", g: "Número, fonte e prazo.", o: "Prometo e pronto.", b: "Mudar de assunto e acusar o outro.", T: 4 },
  { q: "MEDIADOR: SEGURANÇA! Você tem 3,5 segundos!", g: "Plano com meta e fiscalização.", o: "Falo com o delegado depois.", b: "Gritar em caixa alta.", T: 3.5 },
  { q: "MEDIADOR: ÚLTIMA! Saúde! 3 segundos!", g: "Fila menor e remédio na prateleira.", o: "Saúde! (e brindar)", b: "Pedir a palavra e ficar mudo.", T: 3, last: true }
];

function p1_shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(RNG() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function p1_items(flav) {
  var src = flav ? P1_FLAVIO : P1_LULA, out = [], i, r, o;
  for (i = 0; i < src.length; i++) {
    r = src[i];
    if (r.name) { out.push({ name: true, q: "RÁPIDO! Cite o nome da primeira-dama atual!", T: 3.6, opts: [{ t: "Janja", k: "good" }, { t: "Marisa", k: "bad" }] }); continue; }
    o = [{ t: r.g, k: "good" }, { t: r.o, k: "ok" }, r.tr ? { t: r.tr, k: "trap" } : { t: r.b, k: "bad" }];
    out.push({ q: r.q, T: Math.max(5.2, 9.6 - i * 0.42), opts: o });
  }
  for (i = 0; i < P1_BOSS.length; i++) {
    r = P1_BOSS[i];
    var bo = [{ t: r.g, k: "good" }, { t: r.o, k: "ok" }, { t: r.b, k: "bad" }];
    if (!flav && r.last) { out.push({ name: true, boss: true, q: "MEDIADOR: ÚLTIMA! Nome da primeira-dama, 3 segundos!", T: 3, opts: [{ t: "Janja", k: "good" }, { t: "Marisa", k: "bad" }] }); continue; }
    if (flav && r.last) bo[2] = { t: "Disparar 'nove dedos' e esperar o aplauso", k: "trap" };
    out.push({ q: r.q, T: r.T, boss: true, opts: bo });
  }
  return out;
}

SCEN[1] = function (S) {
  var flav = S.camp === "flavio", items = p1_items(flav);
  S.lives = 3; S.maxLives = 3; S.livesLabel = "TEMPO DE FALA";
  var d = { i: 0, ph: "ask", tm: 0, T: 8, it: null, order: [0, 1, 2], sel: -1, res: "", fbT: 0, quip: "", meter: 0, good: 0, ok: 0, bad: 0, cameoT: 0, cameoDone: false,
    swapT: 0, rects: [], botT: 0, botWait: null, talk: 0, flashN: 0, trapHit: 0, gaffes: 0 };
  var foeKind = S.C.foe, meKind = S.C.kind;

  function layout() {
    var it = d.it, rs = [], k;
    if (it.name) { rs.push({ x: 150, y: 285, w: 275, h: 120 }, { x: 445, y: 285, w: 275, h: 120 }); }
    else for (k = 0; k < 3; k++) rs.push({ x: 150, y: 262 + k * 66, w: 570, h: 58 });
    d.rects = rs;
  }
  function load() {
    var it = items[d.i]; d.it = it; d.T = it.T; d.tm = it.T; d.ph = "ask"; d.sel = -1; d.res = ""; d.botWait = null; d.botT = 0; d.swapT = .85;
    d.order = it.name ? p1_shuffle([0, 1]) : p1_shuffle([0, 1, 2]);
    d.talk = 2.2; layout();
    if (it.boss && !it.last && d.i === items.length - 3) { S.toast("RODADA RELÂMPAGO: o mediador cobra!", "#ffcc80", 2.6); sfx("alarm"); }
  }
  function loseLife(why) {
    S.lives--; S.hit(); shake(9); flashScr("229,57,53", .5); sfx("hit");
    if (S.lives <= 0) {
      var rd = d.i + 1;
      S.end(false, d.good / Math.max(1, d.good + d.ok + d.bad) * .6, "O mediador cortou o seu microfone na rodada " + rd + "/" + items.length + (why === "trap" ? " (a baixaria custou caro)" : "") + ". Respire e tente de novo!",
        { failTitle: "Microfone Cortado", voiceLose: flav ? "sistema" : "humilha" });
      return true;
    }
    return false;
  }
  function meterAdd(v) {
    if (flav) return false;
    d.meter = clamp(d.meter + v, 0, 100);
    if (d.meter >= 100) {
      d.meter = 40; d.gaffes++; popup("CONFUSÃO DE NOMES!", W / 2, 240, "#ffab91", 24); say("marisa", "gaffe", 3); S.toast("Janja ou Marisa? A boca se confundiu!", "#ffab91", 2.4);
      return loseLife("nome");
    }
    return false;
  }
  function resolve(pos, timeout) {
    if (d.ph !== "ask") return;
    var it = d.it, opt = timeout ? null : it.opts[d.order[pos]], k = timeout ? "time" : opt.k, frac = timeout ? 0 : d.tm / d.T, mult = it.boss ? 1.5 : 1, cx = 440, dead = false;
    d.ph = "fb"; d.sel = pos; d.res = k; d.fbT = 1.3; d.talk = 1.2;
    if (k === "good") {
      d.good++; S.grid.push(frac > .25 ? "g" : "y");
      var pts = Math.round((100 + frac * 100) * mult); S.up(cx, 230); S.add(pts, cx, 215, "#69f0ae");
      d.quip = pick(P1_GOODQ); sfx("coin"); burst(cx, 250, "#69f0ae", 14, 160, 120);
      if (it.name) meterAdd(-25); else if (frac < .3) meterAdd(12); else meterAdd(-4);
      if (S.combo > 0 && S.combo % 5 === 0 && S.lives < S.maxLives) { S.lives++; S.toast("Sequência! Ganhou mais tempo de fala.", "#69f0ae"); }
      if (!flav && it.name) say("pedirDesc", "acertou", 1);
    } else if (k === "ok") {
      d.ok++; S.grid.push("y"); S.add(Math.round(40 * mult), cx, 215, "#ffe082"); S.hit(); d.quip = pick(P1_OKQ); sfx("pop"); meterAdd(6);
    } else {
      d.bad++; S.grid.push("r");
      if (k === "trap") {
        d.trapHit++; d.quip = "Baixaria! No debate, ele pediu desculpa ao vivo.";
        say("desculpaF", "nove-dedos", 4); say("ninedL", "nove-dedos", 3);
        popup("NOVE DEDOS? 🙈", W / 2, 240, "#ff8a80", 26); S.toast("Baixaria não rende voto: tempo de fala cortado!", "#ff8a80", 2.6);
        dead = loseLife("trap");
      } else if (k === "time") {
        d.quip = "Tempo esgotado! O mediador apitou."; S.toast("Tempo esgotado!", "#ff8a80"); sfx("nope");
        dead = loseLife("tempo"); if (!dead) meterAdd(20);
      } else {
        d.quip = it.name ? "Marisa?! Hoje a primeira-dama é outra!" : pick(P1_BADQ);
        if (it.name) { say("marisa", "gaffe", 4); popup("MARISA?!", W / 2, 240, "#ffab91", 28); meterAdd(0); }
        else say(flav ? "pedirDesc" : "pedirDesc", "vaia", 0);
        dead = loseLife("errado"); if (!dead) meterAdd(it.name ? 30 : 15);
      }
    }
  }
  function next() {
    d.i++;
    if (d.i >= items.length) {
      var tot = d.good + d.ok + d.bad, perf = clamp(d.good / Math.max(1, tot) * .72 + S.lives / S.maxLives * .28 - d.trapHit * .03, 0, 1);
      var line = "Você sobreviveu ao debate com " + d.good + " réplicas de ouro em " + tot + "." + (flav ? " E sem apelidos ofensivos ao final!" : " E acertou o nome da primeira-dama!");
      S.end(true, perf, line, { titles: ["Calouro do Estúdio", "Estagiário da Mediação", "Debatedor Raiz", "Mestre da Réplica", "Rei do Debate"], voiceWin: flav ? "desistir" : "viva" });
      return;
    }
    if (d.i === 6 && !d.cameoDone) { d.cameoDone = true; d.ph = "cameo"; d.cameoT = 2.1; say("camp", "cameo", 2); sfx("alarm"); return; }
    load();
  }
  function choose(pos) {
    if (d.ph !== "ask" || pos < 0 || pos >= d.rects.length) return;
    resolve(pos, false);
  }

  /* ---------------- desenho ---------------- */
  function bg(c) {
    var t = S.anim, i, x, y;
    var gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#070d28"); gr.addColorStop(.55, "#14246a"); gr.addColorStop(1, "#050818"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    // painel de LED
    for (i = 0; i < 16; i++) for (y = 0; y < 5; y++) {
      c.fillStyle = "rgba(" + (80 + (i * 9 + y * 20) % 80) + "," + (120 + (i * 13) % 80) + ",255," + (.05 + .06 * Math.abs(Math.sin(t * .8 + i * .6 + y))) + ")";
      c.fillRect(i * 60 + 3, 66 + y * 48, 54, 44);
    }
    // holofotes
    c.save(); c.globalCompositeOperation = "lighter";
    for (i = 0; i < 3; i++) {
      x = 160 + i * 320 + Math.sin(t * .7 + i * 2) * 70;
      var sg = c.createLinearGradient(x, 0, x, 440); sg.addColorStop(0, "rgba(255,240,190,.2)"); sg.addColorStop(1, "rgba(255,240,190,0)");
      c.fillStyle = sg; c.beginPath(); c.moveTo(x - 8, 0); c.lineTo(x + 8, 0); c.lineTo(x + 130 + Math.sin(t + i) * 30, 440); c.lineTo(x - 130 + Math.sin(t + i) * 30, 440); c.closePath(); c.fill();
    }
    c.restore();
    // piso
    var fg = c.createLinearGradient(0, 440, 0, 480); fg.addColorStop(0, "#1a2150"); fg.addColorStop(1, "#0b0f2a"); c.fillStyle = fg; c.fillRect(0, 440, W, 100);
    c.fillStyle = "rgba(255,223,0,.5)"; c.fillRect(0, 440, W, 3);
    // plateia
    for (var row = 0; row < 2; row++) for (i = 0; i < 36; i++) {
      x = i * 27 + row * 13 + hash(i + row * 40) * 6; y = 458 + row * 12;
      c.fillStyle = row ? "#0a0d22" : "#12183a"; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill(); c.fillRect(x - 11, y + 6, 22, 20);
      if (hash(i * 3 + row) > .93 && Math.floor(t * 3 + i) % 4 === 0) { c.fillStyle = "rgba(255,255,255,.9)"; c.fillRect(x - 3, y - 2, 6, 4); }
    }
  }
  function podiums(c) {
    var t = S.anim, boss = d.it && d.it.boss, bossBase = boss && d.it.q.indexOf("MEDIADOR") === 0;
    // pódio do jogador
    c.fillStyle = S.camp === "lula" ? "#7a1c28" : "#0f6b36"; rr(c, 16, 322, 124, 120, 8); c.fill();
    c.fillStyle = "rgba(255,255,255,.18)"; c.fillRect(16, 322, 124, 6);
    portraitCard(c, meKind, 22, 205, 112, 118, { r: 12, lw: 3, cy: .46, talk: d.ph === "fb" ? Math.abs(Math.sin(t * 12)) * (d.res === "good" ? 1 : 0) : 0 });
    txt(c, "VOCÊ", 78, 346, 13, "#fff", "center"); txt(c, S.C.short.toUpperCase(), 78, 364, 12, "#ffdf00", "center");
    // pódio do adversário
    c.fillStyle = S.camp === "lula" ? "#0f6b36" : "#7a1c28"; rr(c, 738, 258, 190, 184, 8); c.fill();
    c.fillStyle = "rgba(255,255,255,.18)"; c.fillRect(738, 258, 190, 6);
    if (bossBase) {
      c.fillStyle = "#1a2150"; rr(c, 738, 258, 190, 184, 8); c.fill();
      drawChar(c, "npc", 833, 268, 2.1, { t: t, shirt: "#222a55", pants: "#222", skin: "#d9a67c", hair: "#666", moving: false });
      txt(c, "MEDIADOR", 833, 410, 15, "#ffdf00", "center"); txt(c, "'tempo, tempo!'", 833, 428, 11, "#cfd6f0", "center");
    } else {
      var tk = d.talk > 0 && d.ph === "ask" ? Math.abs(Math.sin(t * 13)) : 0;
      portraitCard(c, foeKind, 748, 76, 172, 182, { r: 12, lw: 3, cy: .46, talk: tk });
      txt(c, CARI[foeKind].nome.toUpperCase(), 833, 290, 14, "#fff", "center"); txt(c, "ADVERSÁRIO", 833, 310, 11, "#cfd6f0", "center");
    }
  }
  function attack(c) {
    var it = d.it, x = 360, y = 76, w = 360, h = 124, i, lines;
    c.save();
    c.fillStyle = it.boss ? "#fff3c4" : "#fff"; c.strokeStyle = "#111"; c.lineWidth = 3; rr(c, x, y, w, h, 12); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x + w - 2, y + 52); c.lineTo(x + w + 26, y + 70); c.lineTo(x + w - 2, y + 84); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = it.boss ? "#fff3c4" : "#fff"; c.fillRect(x + w - 6, y + 55, 8, 26);
    c.font = "bold 17px 'Trebuchet MS', Arial, sans-serif"; lines = wrap(c, it.q, w - 28);
    var lh = 22, y0 = y + h / 2 - (lines.length - 1) * lh / 2 + 4;
    c.fillStyle = "#111"; c.textAlign = "center"; c.textBaseline = "middle";
    for (i = 0; i < lines.length; i++) c.fillText(lines[i], x + w / 2, y0 + i * lh);
    c.restore();
    // barra de tempo
    var fr = d.ph === "ask" ? d.tm / d.T : (d.ph === "fb" ? d.tm / d.T : 0);
    uiBar(c, x, y + h + 10, w, 12, fr, fr < .3 ? "#ff5252" : fr < .6 ? "#ffca28" : "#66bb6a");
    txt(c, d.i + 1 <= items.length ? "RODADA " + Math.min(d.i + 1, items.length) + "/" + items.length : "", x, y + h + 34, 11, "#9aa0b4", "left");
    if (it.boss) txt(c, "RELÂMPAGO", x + w, y + h + 34, 11, "#ffcc80", "right");
  }
  function buttons(c) {
    var it = d.it, i, r, opt, o;
    if (it.name) txt(c, "Os nomes trocam de lugar! Toque rápido ou use 1 / 2.", 435, 262, 14, "#ffe082", "center", "rgba(0,0,0,.6)");
    for (i = 0; i < d.rects.length; i++) {
      r = d.rects[i]; opt = it.opts[d.order[i]];
      o = { key: String(i + 1), size: it.name ? 30 : 15 };
      if (it.name) { o.size = 30; }
      if (d.ph === "fb") {
        if (i === d.sel) { o.bg = d.res === "good" ? "#2e7d32" : d.res === "ok" ? "#8d6e00" : "#b71c1c"; o.bd = "#fff"; }
        else if (opt.k === "good") { o.bd = "#69f0ae"; }
        else o.dis = true;
      } else if (d.ph === "cameo") o.dis = true;
      uiButton(c, r, opt.t, o);
    }
  }
  function lowerThird(c) {
    var y = 478, t = S.anim;
    c.fillStyle = "#c62828"; rr(c, 14, y, 86, 38, 6); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.arc(30, y + 19, 5 + Math.sin(t * 6) * 1.2, 0, TAU); c.fill();
    txt(c, "AO VIVO", 40, y + 20, 13, "#fff", "left");
    c.fillStyle = "rgba(10,20,80,.94)"; rr(c, 104, y, flav ? 700 : 430, 38, 6); c.fill();
    c.fillStyle = "#ffdf00"; c.fillRect(104, y + 34, flav ? 700 : 430, 4);
    var cap = d.ph === "fb" || d.ph === "cameo" ? d.quip : "DEBATE · 23/10/2026 · " + (S.C.short + " x " + CARI[foeKind].nome.split(" ")[0]);
    if (d.ph === "cameo") cap = "Esse debate está inflamado! — Campopiano, plateia";
    txt(c, cap, 116, y + 18, 15, d.ph === "fb" ? (d.res === "good" ? "#69f0ae" : d.res === "ok" ? "#ffe082" : "#ff8a80") : "#fff", "left");
    if (!flav) {
      var m = d.meter / 100;
      uiPanel(c, 544, y - 2, 272, 42, "rgba(40,10,16,.92)", m > .7 ? "#ff5252" : "rgba(255,255,255,.2)");
      txt(c, "CONFUSÃO DE NOMES: Janja ou Marisa?", 554, y + 8, 10, "#ffab91", "left");
      uiBar(c, 554, y + 19, 252, 12, m, m > .7 ? "#ff5252" : m > .4 ? "#ffa726" : "#66bb6a");
    }
  }
  function cameo(c) {
    var a = clamp(d.cameoT * 4, 0, 1) * clamp((2.1 - d.cameoT + .05) * 5, 0, 1);
    c.save(); c.globalAlpha = a; c.fillStyle = "rgba(0,0,0,.55)"; c.fillRect(0, 70, W, 400);
    portraitCard(c, "campopiano", 330, 150, 150, 170, { r: 14, lw: 4, talk: Math.abs(Math.sin(S.anim * 14)) });
    balloon(c, "Esse debate está inflamado!", 450, 190, { size: 20, maxW: 260, bg: "#fff" });
    txt(c, "CAMEO DA PLATEIA · Campopiano", 405, 340, 14, "#ffe082", "center");
    c.restore();
  }

  return {
    intro: { sub: "23/10/2026 · réplica no tempo certo", foeLabel: "ADVERSÁRIO · " + CARI[foeKind].nome.toUpperCase(),
      lines: ["Responda cada ataque antes do tempo acabar.", "Teclas 1-2-3 ou toque. Rápido vale mais!",
        flav ? "Cuidado com a tentação do 'nove dedos'." : "Cuidado: Janja ou Marisa? Nome certo!", "3 vidas · 5 acertos seguidos devolvem uma.", "Rodada final: o mediador relâmpago."] },
    begin: function () { load(); },
    info: function () { return { round: d.i + 1, total: items.length, good: d.good, ok: d.ok, bad: d.bad, meter: Math.round(d.meter), phase: d.ph, trap: d.trapHit, gaffes: d.gaffes }; },
    update: function (dt) {
      if (!d.it) return;
      if (d.talk > 0) d.talk -= dt;
      if (d.ph === "ask") {
        d.tm -= dt;
        if (d.it.name) { d.swapT -= dt; if (d.swapT <= 0) { d.swapT = rnd(.55, 1.0); d.order.reverse(); sfx("tick"); } }
        if (d.tm <= 0) { d.tm = 0; resolve(-1, true); }
      } else if (d.ph === "fb") {
        d.fbT -= dt; if (d.fbT <= 0) next();
      } else if (d.ph === "cameo") {
        d.cameoT -= dt; if (d.cameoT <= 0) load();
      }
    },
    draw: function (c) {
      bg(c);
      if (!d.it) { return; }
      podiums(c); attack(c); buttons(c); lowerThird(c);
      if (d.ph === "cameo") cameo(c);
    },
    key: function (code) {
      var m = /^(?:Digit|Numpad)([1-3])$/.exec(code);
      if (m) choose(+m[1] - 1);
    },
    tap: function (x, y) {
      for (var i = 0; i < d.rects.length; i++) if (inRect(x, y, d.rects[i])) { choose(i); return; }
    },
    bot: function (dt) {
      if (d.ph !== "ask") return;
      d.botT += dt;
      if (d.botWait == null) d.botWait = d.it.name || d.it.boss ? rnd(.9, 1.6) : rnd(1.5, 3);
      if (d.botT < d.botWait) return;
      var want = "good", r = RNG();
      if (S.lives >= 2 && r < .07) want = "bad"; else if (r < .16) want = "ok";
      var pos = -1, gp = 0;
      for (var i = 0; i < d.rects.length; i++) { var k = d.it.opts[d.order[i]].k; if (k === "good") gp = i; if (pos < 0 && (k === want || (want === "bad" && k === "trap"))) pos = i; }
      if (pos < 0) pos = gp;
      d.botWait = null; d.botT = 0; choose(pos);
    }
  };
};
