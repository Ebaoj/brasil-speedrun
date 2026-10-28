"use strict";
/* ================= Fase 3 — Apuração (25/10) ================= */
var P3_CURVE = [[0, 50], [0.04, 43.6], [0.2, 44.9], [0.4, 46.4], [0.6, 47.7], [0.8, 49.2], [0.88, 50.2], [0.95, 51.2], [1, 51.79]];
var P3_STATES = ["SP", "MG", "RJ", "BA", "RS", "PR", "PE", "CE"];
var P3_BOATOS = ["URNA ZERO!!!", "ELEIÇÃO ROUBADA!!!", "FLÁVIO TEM 100%!!!", "A MARÉ LEVOU OS VOTOS", "LULA JÁ GANHOU ÀS 17h"];
var P3_TICK = ["O JOGO NÃO ALTERA O RESULTADO — a apuração é do TSE", "Torcida A já comemora com 2% apurado", "Torcida B já desconfia com 2% apurado", "Tio do Zap posta “vitória” antes do primeiro boletim", "Contar voto é lento; opinar é instantâneo", "Boato não é boletim: BOATO = bolha vermelha"];

function p3_lula(c) {
  c = clamp(c, 0, 1);
  if (c >= 1) return 51.79;
  for (var i = 1; i < P3_CURVE.length; i++) {
    var a = P3_CURVE[i - 1], b = P3_CURVE[i];
    if (c <= b[0]) { var k = (c - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * k + Math.sin(c * 70) * .05 * (1 - c); }
  }
  return 51.79;
}
function p3_f2(v) { return v.toFixed(2).replace(".", ","); }
function p3_slot(i) { return { x: 62 + (i % 4) * 218, y: 262 + ((i / 4) | 0) * 98, w: 202, h: 86 }; }
function p3_urn(i) { return { x: 78 + (i % 4) * 212, y: 178 + ((i / 4) | 0) * 92, w: 194, h: 80 }; }

SCEN[3] = function (S) {
  var camp = S.camp, lulaSide = camp === "lula", hype = 0;
  var o = { ph: "count", c: 0, items: [], spawnBU: 1, spawnB: 4, tick: 0, flipped: false, flipT: 0, seg: { h: 0, m: 0, b: 0 }, segN: 0, hits: 0, missed: 0, boatoHit: 0,
    boost: 0, finalT: 0, urns: [], opened: 0, cur: 0, tickX: 0, cd: 0 };
  var i;
  for (i = 0; i < 12; i++) { var tot = rint(120, 480), l = Math.round(tot * rnd(.45, .56)); o.urns.push({ open: false, t: 0, tot: tot, l: l, f: tot - l }); }
  S.lives = 3; S.livesLabel = "BOATOS";

  function segPush() { var s = o.seg; S.grid.push(s.b > 0 ? "r" : (s.h >= s.m ? "g" : "y")); o.seg = { h: 0, m: 0, b: 0 }; o.segN++; }
  function freeSlot() { var used = {}, k, free = []; o.items.forEach(function (it) { used[it.slot] = 1; }); for (k = 0; k < 8; k++) if (!used[k]) free.push(k); return free.length ? pick(free) : -1; }
  function spawn(kind) { var s = freeSlot(); if (s < 0) return; o.items.push({ slot: s, kind: kind, t: 0, life: kind === "bu" ? 3.2 : 3.8, txt: pick(P3_BOATOS) }); }
  function hit(it) {
    var r = p3_slot(it.slot), cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    o.items.splice(o.items.indexOf(it), 1);
    if (it.kind === "bu") {
      o.hits++; o.seg.h++; o.boost += .9; hype = Math.min(100, hype + 7); S.up(cx, cy - 20); S.add(22, cx, cy - 10, "#fff"); burst(cx, cy, lulaSide ? "#ff8a80" : "#ffdf00", 10, 120); sfx("coin");
    } else {
      o.boatoHit++; o.seg.b++; S.hit(); S.lives--; S.score = Math.max(0, S.score - 150); hype = Math.max(0, hype - 25);
      shake(8); flashScr("229,57,53", .5); popup("BOATO! -150", cx, cy, "#ff6b6b", 22); sfx("hit"); say("hoje", "boato", 2);
      if (S.lives <= 0) S.end(false, .25, "Caiu em boato demais e a apuração seguiu sem você. O resultado, aliás, continuou o mesmo.", { failTitle: "Vítima de Corrente", voiceLose: "parou" });
    }
  }
  function openUrn(k) {
    var u = o.urns[k]; if (!u || u.open) return false;
    u.open = true; u.t = 0; o.opened++; var r = p3_urn(k);
    S.up(r.x + r.w / 2, r.y); S.add(40, r.x + r.w / 2, r.y + 10, "#fff"); burst(r.x + r.w / 2, r.y + r.h / 2, "#69f0ae", 8, 100); sfx("pop");
    if (o.opened === 12) o.cd = 1.6;
    return true;
  }
  function finishHunt() {
    if (S.over) return;
    var tot = o.hits + o.missed, ratio = tot ? o.hits / tot : 0;
    var perf = clamp(.3 + .45 * ratio + .15 * (S.lives / 3) + .1 * (o.opened / 12), 0, 1);
    S.grid.push("g");
    S.end(true, perf, "Lula 51,79% × Flávio 48,21%. Você abriu " + o.opened + " urnas e achou 0 com zero voto — porque não existe.",
      { titles: ["Contador de Chinelo", "Fiscal de Boletim", "Mesário Atento", "Apurador Oficial", "Voz do Telão"], voiceWin: lulaSide ? "viva" : "desistir", voiceLose: "sistema" });
  }
  function beginHunt() { o.ph = "hunt"; S.time = 45; S.mult = 1; say(lulaSide ? "hoje" : "sistema", "caca", 3); }

  o.begin = function () { say("n2222", "inicio", 2); S.toast("Toque nos BU (boletins) · fuja do BOATO", "#fff", 3.2); };
  o.intro = {
    sub: "25/10 · apuração do 2º turno",
    foeLabel: lulaSide ? "Flávio, na frente (por enquanto)" : "Lula, correndo por fora",
    lines: ["Toque nos boletins de urna (BU) para acelerar a contagem.", "Não toque no BOATO: bolha vermelha = notícia falsa.",
      "Teclas 1-4 também abrem as colunas. Seu time vibra, mas…", "o jogo NÃO altera o resultado. Depois, a caça à urna zero."]
  };

  o.timeUp = function () { if (o.ph === "hunt") finishHunt(); };

  o.update = function (dt) {
    o.tickX += dt * 70; hype = Math.max(0, hype - dt * 1.2);
    if (o.ph === "count") {
      o.boost *= Math.max(0, 1 - dt * 2.2);
      o.c = Math.min(1, o.c + dt * (.0072 + o.boost * .0065));
      o.spawnBU -= dt; o.spawnB -= dt;
      var diff = 1 + o.c * .6;
      if (o.spawnBU <= 0) { spawn("bu"); o.spawnBU = rnd(.9, 1.5) / diff; }
      if (o.spawnB <= 0) { spawn("boato"); o.spawnB = rnd(3.6, 5.6) / diff; }
      for (var k = o.items.length - 1; k >= 0; k--) {
        var it = o.items[k]; it.t += dt;
        if (it.t >= it.life) {
          o.items.splice(k, 1);
          if (it.kind === "bu") { o.missed++; o.seg.m++; S.hit(); } else { S.add(30, p3_slot(it.slot).x + 100, p3_slot(it.slot).y + 20, "#9ec97a"); }
        }
      }
      while (o.c >= (o.segN + 1) / 10 && o.segN < 10) segPush();
      if (!o.flipped && o.c > .5 && p3_lula(o.c) > 50) {
        o.flipped = true; o.flipT = 3; shake(10); flashScr(lulaSide ? "255,80,80" : "255,223,0", .55); sfx("boom"); say("camp", "virada", 3);
        S.toast("VIRADA NA BARRA!", "#ffdf00", 3);
      }
      if (o.flipT > 0) o.flipT -= dt;
      if (o.c >= 1 && !S.over) { o.ph = "final"; o.finalT = 4.2; o.items = []; sfx("win"); flashScr("255,255,255", .4); }
    } else if (o.ph === "final") {
      o.finalT -= dt; if (o.finalT <= 0) beginHunt();
    } else if (o.ph === "hunt") {
      for (var j = 0; j < 12; j++) if (o.urns[j].open) o.urns[j].t += dt;
      if (o.cd > 0) { o.cd -= dt; if (o.cd <= 0) finishHunt(); }
    }
  };

  function colHit(col) {
    var best = null;
    o.items.forEach(function (it) { if (it.slot % 4 === col && (!best || (best.kind !== "bu" && it.kind === "bu"))) best = it; });
    if (best) hit(best);
  }
  o.key = function (code) {
    var m = /^(Digit|Numpad)([1-4])$/.exec(code), d = m ? +m[2] - 1 : -1;
    if (o.ph === "count") { if (d >= 0) colHit(d); return; }
    if (o.ph !== "hunt") return;
    if (d >= 0) { for (var k = 0; k < 12; k++) if (k % 4 === d && !o.urns[k].open) { o.cur = k; openUrn(k); return; } return; }
    if (code === "ArrowLeft" || code === "KeyA") o.cur = (o.cur + 11) % 12;
    else if (code === "ArrowRight" || code === "KeyD") o.cur = (o.cur + 1) % 12;
    else if (code === "ArrowUp" || code === "KeyW") o.cur = (o.cur + 8) % 12;
    else if (code === "ArrowDown" || code === "KeyS") o.cur = (o.cur + 4) % 12;
    else if (code === "Enter" || code === "Space") openUrn(o.cur);
  };
  o.tap = function (x, y) {
    var k, r;
    if (o.ph === "count") {
      for (k = 0; k < o.items.length; k++) { r = p3_slot(o.items[k].slot); if (inRect(x, y, r)) { hit(o.items[k]); return; } }
    } else if (o.ph === "hunt") {
      for (k = 0; k < 12; k++) if (inRect(x, y, p3_urn(k))) { o.cur = k; openUrn(k); return; }
    }
  };
  o.bot = function (dt) {
    if (o.ph === "count") {
      botEvery(S, "a", .55, function () {
        var bu = o.items.filter(function (it) { return it.kind === "bu" && it.t > .35; });
        if (bu.length && RNG() < .82) hit(bu[0]);
        else if (RNG() < .03) { var bo = o.items.filter(function (it) { return it.kind === "boato"; }); if (bo.length && S.lives > 1) hit(bo[0]); }
      }, dt);
    } else if (o.ph === "hunt") {
      botEvery(S, "h", 1, function () { for (var k = 0; k < 12; k++) if (!o.urns[k].open) { openUrn(k); return; } }, dt);
    }
  };
  o.info = function () {
    var l = o.ph === "count" ? p3_lula(o.c) : (o.c >= 1 ? 51.79 : p3_lula(o.c));
    return { phase: o.ph, counted: Math.round(o.c * 10000) / 100, lula: Math.round(l * 100) / 100, flavio: Math.round((100 - l) * 100) / 100, zeroUrns: 0, opened: o.opened, hits: o.hits, boatos: o.boatoHit, flipped: o.flipped };
  };

  /* ---------- desenho ---------- */
  function bg(c) {
    var gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#07123a"); gr.addColorStop(1, "#02050f"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    c.strokeStyle = "rgba(80,130,255,.07)"; c.lineWidth = 1;
    for (var x = 0; x < W; x += 40) { c.beginPath(); c.moveTo(x + (S.anim * 10) % 40, 0); c.lineTo(x + (S.anim * 10) % 40 - 120, H); c.stroke(); }
    c.fillStyle = "rgba(255,255,255,.025)"; for (var y = (S.anim * 20) % 6; y < H; y += 6) c.fillRect(0, y, W, 1);
  }
  function drawBars(c, y0, small) {
    var l = o.ph === "count" || o.ph === "final" || o.ph === "hunt" ? (o.c >= 1 ? 51.79 : p3_lula(o.c)) : 50, f = 100 - l, bw = small ? 380 : 500, bx = small ? 290 : 190, bh = small ? 22 : 34, gap = small ? 4 : 10;
    var lw = clamp((l - 30) / 40, .05, 1) * bw, fw = clamp((f - 30) / 40, .05, 1) * bw, lead = l > f;
    function row(yy, w, col, col2, name, pct, kind, win) {
      uiPanel(c, bx - 4, yy - 3, bw + (small ? 110 : 150), bh + 6, "rgba(0,0,0,.45)");
      var gr = c.createLinearGradient(bx, 0, bx + w, 0); gr.addColorStop(0, col); gr.addColorStop(1, col2); c.fillStyle = gr; rr(c, bx, yy, w, bh, 8); c.fill();
      txt(c, name, bx + 10, yy + bh / 2, small ? 13 : 17, "#fff", "left", "rgba(0,0,0,.6)");
      txt(c, p3_f2(pct) + "%", bx + w + 8, yy + bh / 2, small ? 16 : 26, win ? "#fff" : "#cfd6f0", "left", "rgba(0,0,0,.7)");
      if (!small) { c.save(); c.beginPath(); c.arc(bx - 38, yy + bh / 2, 22, 0, TAU); c.clip(); c.translate(bx - 38, yy + bh / 2 + 8); c.scale(.55, .55); head(c, kind, {}); c.restore(); c.strokeStyle = win ? "#ffdf00" : "rgba(255,255,255,.4)"; c.lineWidth = 2.5; c.beginPath(); c.arc(bx - 38, yy + bh / 2, 22, 0, TAU); c.stroke(); }
    }
    row(y0, lw, "#b71c1c", "#ff5252", "LULA · 13", l, "lula", lead);
    row(y0 + bh + gap + 4, fw, "#1b7a3a", "#ffdf00", "FLÁVIO · 22", f, "flavio", !lead);
  }
  function drawTV(c) {
    c.fillStyle = "#0d1e5c"; c.fillRect(0, 68, W, 34); c.fillStyle = "#ffdf00"; c.fillRect(0, 68, 8, 34);
    txt(c, "APURAÇÃO · 2º TURNO", 22, 85, 20, "#fff", "left");
    c.fillStyle = Math.floor(S.anim * 2) % 2 ? "#ff3b3b" : "#a01818"; c.beginPath(); c.arc(W - 150, 85, 7, 0, TAU); c.fill(); txt(c, "AO VIVO", W - 138, 85, 15, "#fff", "left");
    txt(c, "URNAS APURADAS", 330, 78, 10, "#9aa0b4", "left"); txt(c, p3_f2(o.c * 100) + "%", 330, 94, 18, "#ffdf00", "left");
    uiBar(c, 440, 80, 330, 10, o.c, "#69f0ae");
    drawBars(c, 112, false);
    if (o.flipT > 0) { var a = clamp(o.flipT, 0, 1); c.save(); c.globalAlpha = a; c.translate(W / 2 + 270, 152); c.rotate(-.12); c.fillStyle = "#ffdf00"; rr(c, -90, -22, 180, 44, 8); c.fill(); txt(c, "VIRADA!", 0, 1, 30, "#c62828", "center"); c.restore(); }
  }
  function drawCount(c) {
    drawTV(c);
    txt(c, "BOLETINS POR ESTADO · toque no BU (teclas 1-4 = colunas)", 62, 248, 12, "#9aa0b4", "left");
    for (var s = 0; s < 8; s++) {
      var r = p3_slot(s); uiPanel(c, r.x, r.y, r.w, r.h, "rgba(10,20,60,.8)", "rgba(120,160,255,.3)");
      txt(c, P3_STATES[s], r.x + 14, r.y + 14, 15, "#8fb4ff", "left");
      if (s < 4) txt(c, String(s + 1), r.x + r.w - 14, r.y + 14, 12, "#ffdf00", "right");
      uiBar(c, r.x + 14, r.y + r.h - 16, r.w - 28, 6, clamp(o.c * 1.1 - s * .015, 0, 1), "#4fc3f7");
    }
    o.items.forEach(function (it) {
      var r = p3_slot(it.slot), cx = r.x + r.w / 2, cy = r.y + r.h / 2 - 4, pop = Math.min(1, it.t * 6), fr = 1 - it.t / it.life;
      c.save(); c.translate(cx, cy); c.scale(.6 + .4 * pop, .6 + .4 * pop);
      if (it.kind === "bu") {
        c.fillStyle = "#fff"; rr(c, -32, -26, 64, 46, 6); c.fill(); c.fillStyle = "#1b3a8a"; c.fillRect(-32, -26, 64, 10);
        txt(c, "BU", 0, -21, 10, "#fff", "center"); c.fillStyle = "#b0b6c8"; c.fillRect(-24, -10, 48, 3); c.fillRect(-24, -3, 36, 3); txt(c, "✔", 18, 10, 18, "#2e9c4a", "center");
        c.strokeStyle = "#ffdf00"; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 40, -Math.PI / 2, -Math.PI / 2 + TAU * fr); c.stroke();
      } else {
        c.fillStyle = Math.floor(S.anim * 5) % 2 ? "#e53935" : "#c62828"; rr(c, -88, -30, 176, 56, 14); c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 2; c.stroke();
        txt(c, "BOATO", 0, -16, 12, "#ffeb3b", "center"); txt(c, it.txt, 0, 4, 13, "#fff", "center");
        c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 0.01, 0, TAU); c.stroke();
        uiBar(c, -70, 18, 140, 4, fr, "#ffeb3b", "rgba(0,0,0,.3)");
      }
      c.restore();
    });
    // torcida
    var hc = lulaSide ? "#ff5252" : "#ffdf00";
    txt(c, "TORCIDA " + (lulaSide ? "LULA" : "FLÁVIO") + " · vibração (não muda o resultado)", 62, 466, 11, "#9aa0b4", "left");
    uiBar(c, 62, 476, 420, 12, hype / 100, hc);
    mini(c, S.C.kind, 520, 480, .38, { talk: hype > 60 ? Math.abs(Math.sin(S.anim * 12)) : 0 });
    ticker(c);
  }
  function ticker(c) {
    c.fillStyle = "rgba(0,0,0,.7)"; c.fillRect(0, 506, W, 34); c.fillStyle = "#ffdf00"; c.fillRect(0, 506, 4, 34);
    var s = "     " + P3_TICK.join("   •   ") + "   •   ", w;
    c.font = "bold 14px 'Trebuchet MS', Arial"; w = c.measureText(s).width;
    c.save(); c.beginPath(); c.rect(10, 506, W - 20, 34); c.clip(); c.fillStyle = "#fff"; c.textAlign = "left"; c.textBaseline = "middle";
    var x = -(o.tickX % w); c.fillText(s, x, 523); c.fillText(s, x + w, 523); c.restore();
  }
  function drawFinal(c) {
    drawTV(c);
    var t = 4.2 - o.finalT, a = clamp(t * 2, 0, 1);
    c.save(); c.globalAlpha = a; uiPanel(c, 120, 250, 720, 200, "rgba(0,0,0,.8)", "#ffdf00");
    txt(c, "100% DAS URNAS APURADAS", W / 2, 280, 22, "#ffdf00", "center");
    txt(c, "LULA 51,79%  ×  FLÁVIO 48,21%", W / 2, 336, 38, "#fff", "center", "#000");
    txt(c, "Resultado oficial no jogo, idêntico ao da vida real.", W / 2, 384, 15, "#cfd6f0", "center");
    txt(c, lulaSide ? "Seu time venceu. Agora, o plantão do TSE…" : "Seu time perdeu. Agora, a caça à urna zero…", W / 2, 416, 17, "#69f0ae", "center");
    c.restore(); ticker(c);
  }
  function drawHunt(c) {
    c.fillStyle = "#0d1e5c"; c.fillRect(0, 68, W, 30);
    txt(c, lulaSide ? "PLANTÃO DO TSE: DESMENTIR O BOATO" : "CAÇA À URNA COM ZERO VOTO", 20, 83, 18, "#fff", "left");
    txt(c, lulaSide ? "Abra cada urna e mostre que tem voto. O boato de “urna zero” não é verdade." : "Spoiler: não existe urna com zero voto. Fraude não é fato; o resultado é o resultado.", 20, 112, 13, "#ffdf00", "left");
    txt(c, "RESULTADO (inalterado): LULA 51,79% × FLÁVIO 48,21%", W - 20, 140, 14, "#fff", "right");
    uiBar(c, 20, 134, 300, 12, .5179, "#e53935", "#2e9c4a");
    txt(c, "Setas + Enter, teclas 1-4 ou toque", 20, 156, 10, "#9aa0b4", "left");
    for (var k = 0; k < 12; k++) {
      var r = p3_urn(k), u = o.urns[k], cur = o.cur === k;
      uiPanel(c, r.x, r.y, r.w, r.h, u.open ? "rgba(20,70,40,.85)" : "rgba(14,24,60,.9)", cur ? "#ffdf00" : (u.open ? "#69f0ae" : "rgba(120,160,255,.4)"));
      if (cur) { c.strokeStyle = "#ffdf00"; c.lineWidth = 3; rr(c, r.x, r.y, r.w, r.h, 12); c.stroke(); }
      var nm = "URNA " + (4001 + k * 37);
      if (!u.open) { c.fillStyle = "#8a93aa"; rr(c, r.x + 14, r.y + 16, 36, 48, 5); c.fill(); c.fillStyle = "#222"; c.fillRect(r.x + 20, r.y + 24, 24, 4); txt(c, nm, r.x + 62, r.y + 28, 13, "#cfd6f0", "left"); txt(c, "fechada · abrir", r.x + 62, r.y + 52, 11, "#9aa0b4", "left"); }
      else { var pp = Math.min(1, u.t * 4); c.globalAlpha = pp; txt(c, "✔ " + u.tot + " votos", r.x + 14, r.y + 24, 17, "#69f0ae", "left"); txt(c, "L " + u.l + " · F " + u.f, r.x + 14, r.y + 48, 13, "#fff", "left"); txt(c, "tem voto sim", r.x + 14, r.y + 68, 11, "#9ec97a", "left"); c.globalAlpha = 1; }
    }
    uiPanel(c, 20, 462, 920, 36, "rgba(0,0,0,.6)");
    txt(c, "URNAS COM ZERO VOTO ENCONTRADAS: 0", 36, 480, 17, "#ffdf00", "left");
    txt(c, "abertas " + o.opened + "/12 · a barra continua 51,79 × 48,21", W - 36, 480, 14, "#cfd6f0", "right");
    if (o.opened === 12) { c.save(); c.translate(W / 2, 300); c.rotate(-.05); c.fillStyle = "rgba(0,0,0,.82)"; rr(c, -300, -44, 600, 88, 12); c.fill(); c.strokeStyle = "#69f0ae"; c.lineWidth = 3; c.stroke();
      txt(c, "ZERO urnas com zero voto.", 0, -12, 28, "#69f0ae", "center"); txt(c, "Fraude não é fato. O resultado é o resultado.", 0, 20, 16, "#fff", "center"); c.restore(); }
    ticker(c);
  }
  o.draw = function (c) {
    bg(c);
    if (o.ph === "count") drawCount(c); else if (o.ph === "final") drawFinal(c); else drawHunt(c);
  };
  return o;
};
