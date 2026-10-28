"use strict";
/* ================= Fase 3 — Apuração (25/10) · arcade =================
   Você é o mesário/fiscal: corra pela sala, pegue BU (boletins de urna) na esteira e entregue no totalizador do TSE.
   Desminta BOATOS com o boletim oficial (A) e use a Coletiva do TSE (B). O jogo NÃO altera o resultado: 51,79 × 48,21. */
var P3_CURVE = [[0, 50], [0.04, 43.6], [0.2, 44.9], [0.4, 46.4], [0.6, 47.7], [0.8, 49.2], [0.88, 50.2], [0.95, 51.2], [1, 51.79]];
var P3_BOATOS = ["URNA ZERO!!!", "ELEIÇÃO ROUBADA!!!", "FLÁVIO TEM 100%!!!", "A MARÉ LEVOU OS VOTOS", "LULA JÁ GANHOU ÀS 17h", "URNA É DE OUTRO PLANETA", "CONTAGEM PELO ZAP"];
var P3_TICK = ["O JOGO NÃO ALTERA O RESULTADO — a apuração é do TSE", "Torcida A já comemora com 2% apurado", "Torcida B já desconfia com 2% apurado", "Tio do Zap posta “vitória” antes do primeiro boletim", "Contar voto é lento; opinar é instantâneo", "Boato não é boletim: BOATO = bolha vermelha"];
var P3_TSE = { x: 876, y: 350 };

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

SCEN[3] = function (S) {
  var lulaSide = S.camp === "lula", hype = 0;
  var o = { ph: "count", c: 0, anim: 0, tickX: 0, px: 300, py: 380, face: 1, carry: 0, bus: [], boatos: [], shots: [], pups: [], boss: null,
    buT: .6, boT: 3.2, puT: 12, shotCd: 0, meter: 0, cafe: 0, cracha: 0, pen: 0, inv: 0, slow: 0, flipped: false, flipT: 0, finalT: 0,
    seg: { h: 0, m: 0, b: 0 }, segN: 0, hits: 0, delivered: 0, expired: 0, killed: 0, boatoHit: 0, tseHit: 0, hurtF: 0, bm: { x: 0, y: 0 }, bIdle: 0, ended: false, said: {} };
  S.lives = 3; S.maxLives = 3; S.livesLabel = "CREDIBILIDADE"; S.time = 150; S.timeMax = 150;
  var TITLES = ["Contador de Chinelo", "Fiscal de Boletim", "Mesário Atento", "Apurador Oficial", "Voz do Telão"];

  function segPush() { var s = o.seg; S.grid.push(s.b > 0 ? "r" : (s.m > 1 ? "y" : "g")); o.seg = { h: 0, m: 0, b: 0 }; o.segN++; }
  function dist(a, b, c2, d) { return Math.sqrt((a - c2) * (a - c2) + (b - d) * (b - d)); }
  function vox3(id, ev, prio) { return say(id, ev, prio || 1); }

  function spawnBU() {
    if (o.bus.length >= 7) return;
    var x, y, k = 0; do { x = rnd(60, 760); y = rnd(235, 470); k++; } while (k < 6 && dist(x, y, o.px, o.py) < 90);
    o.bus.push({ x: x, y: y, t: 0, life: 9.5 });
  }
  function spawnBoato(from, big) {
    var pr = clamp(o.c / .8, 0, 1), cac = !from && o.c > .12 && RNG() < .4, hp = big || (!from && o.c > .4 && RNG() < .28) ? 2 : 1;
    var x = from ? from.x : rnd(120, 820), y = from ? from.y : 222;
    o.boatos.push({ x: x, y: y, hp: hp, hp0: hp, sp: from ? 95 : lerp(52, 100, pr) * (cac ? .8 : 1), cac: cac, tx: pick(P3_BOATOS), t: 0 });
  }
  function spawnPup() {
    if (o.pups.length) return;
    var k = pick(["cafe", "cracha", "pen"]);
    o.pups.push({ k: k, x: rnd(80, 700), y: rnd(250, 460), t: 0 });
  }
  function lose(why) {
    S.lives--; S.hit(); o.seg.b++; o.hurtF = .5; shake(9); flashScr("229,57,53", .5); sfx("hit"); hype = Math.max(0, hype - 25);
    if (S.lives <= 0 && !o.ended) {
      o.ended = true;
      S.end(false, clamp(.1 + .25 * o.c, 0, .4), "Boato demais: a credibilidade da sala acabou. O resultado, aliás, continuou o mesmo (" + (why === "tse" ? "o totalizador foi inundado de boato" : "você foi atropelado por boato") + ").", { failTitle: "Vítima de Corrente" });
    }
  }
  function killBoato(b, pts) {
    var i = o.boatos.indexOf(b); if (i >= 0) o.boatos.splice(i, 1);
    o.killed++; S.up(b.x, b.y - 20); S.add(pts || 40, b.x, b.y, "#fff"); burst(b.x, b.y, "#ff8a80", 12, 150, 80); ring(b.x, b.y, "#fff", 8); sfx("pop");
    o.meter = Math.min(100, o.meter + 9); hype = Math.min(100, hype + 6);
    if (o.killed === 1 && !o.said.k) { o.said.k = 1; popup("DESMENTIDO!", b.x, b.y - 36, "#69f0ae", 22); }
  }
  function startBoss() {
    o.ph = "boss"; o.boss = { hp: 8, max: 8, intro: 2.2, t: 0, atk: 1.6, line: "", lineT: 0, hurt: 0, i: 0 };
    S.toast("TIO DO ZAP GIGANTE entrou na apuração! Desminta tudo!", "#ffcc80", 3); sfx("alarm"); shake(6);
    say("moraes_colegiado_que_julga", "boss", 3);
  }
  var BLINES = ["Meu cunhado viu num grupo: a urna é de outro planeta!", "O outro lado já sabia o resultado, eu sei porque eu sei!", "Contei os votos de cabeça e deu 100% pro meu time!", "Não confie no TSE nem no meu primo (nem em mim)!"];
  function winRun() {
    if (o.ended) return; o.ended = true;
    while (o.segN < 10) segPush();
    var tot = o.killed + o.boatoHit + o.tseHit, perf = clamp(.3 + .22 * (S.lives / 3) + .25 * (o.killed / Math.max(1, tot)) + .23 * (o.delivered / Math.max(1, o.delivered + o.expired)), 0, 1);
    S.end(true, perf, "Lula 51,79% × Flávio 48,21%. Você entregou " + o.delivered + " boletins e desmentiu " + o.killed + " boatos. Não houve urna com zero voto: o resultado é o do TSE, e o seu desempenho nunca o muda.", { titles: TITLES });
  }
  function act(k) {
    if (o.ph === "final" || o.ended) return;
    if (k === "a") {
      if (o.shotCd > 0) return;
      var tg = null, bd = 1e9, i, d;
      for (i = 0; i < o.boatos.length; i++) { d = dist(o.px, o.py, o.boatos[i].x, o.boatos[i].y); if (d < bd) { bd = d; tg = o.boatos[i]; } }
      if (o.boss && o.boss.intro <= 0 && o.boss.hp > 0) { d = dist(o.px, o.py, 480, 255) - 40; if (d < bd) { bd = d; tg = { x: 480, y: 255, boss: 1 }; } }
      var dx = o.face, dy = 0;
      if (tg) { var tt = bd / 520, lx = tg.x + (tg.vx || 0) * tt, ly = tg.y + (tg.vy || 0) * tt; dx = lx - o.px; dy = ly - o.py; }
      var m = Math.sqrt(dx * dx + dy * dy) || 1;
      o.shots.push({ x: o.px, y: o.py - 8, vx: dx / m * 520, vy: dy / m * 520, t: 0 }); o.shotCd = .32; sfx("shot");
    } else if (k === "b") {
      if (o.meter < 100) return;
      o.meter = 0; flashScr("255,255,255", .5); sfx("boom"); shake(8); popup("COLETIVA DO TSE!", W / 2, 260, "#ffdf00", 30);
      S.toast("Coletiva do TSE: “Não houve fraude.”", "#fff", 2.2);
      say("renan_nao_houve_fraude", "coletiva", 3);
      while (o.boatos.length) { var b = o.boatos[0]; o.boatos.splice(0, 1); o.killed++; S.add(30, b.x, b.y, "#fff"); burst(b.x, b.y, "#ffdf00", 10, 140, 60); }
      if (o.boss && o.boss.intro <= 0 && o.boss.hp > 0) hurtBoss(2);
    }
  }
  function hurtBoss(n) {
    var B = o.boss; B.hp = Math.max(0, B.hp - n); B.hurt = .4; shake(5); ring(480, 255, "#ffdf00", 10); popup("DESMENTIDO!", 480, 190, "#ffdf00", 20); sfx("stamp"); S.add(60, 480, 215, "#ffdf00");
    if (B.hp <= 0) { o.boatos = []; o.c = 1; o.ph = "final"; o.finalT = 4.4; S.add(400, 480, 250, "#ffdf00"); burst(480, 250, "#ffdf00", 40, 260, 80); flashScr("255,223,0", .5); sfx("win"); say("renan_nao_houve_fraude", "final", 4); while (o.segN < 10) segPush(); }
  }

  function update(dt) {
    var i, j, b, mv = S.bot ? o.bm : arcMove();
    o.anim += dt; o.tickX += dt * 70; hype = Math.max(0, hype - dt * 1.2);
    o.shotCd = Math.max(0, o.shotCd - dt); o.cafe = Math.max(0, o.cafe - dt); o.cracha = Math.max(0, o.cracha - dt); o.pen = Math.max(0, o.pen - dt);
    o.inv = Math.max(0, o.inv - dt); o.slow = Math.max(0, o.slow - dt); o.hurtF = Math.max(0, o.hurtF - dt); o.flipT = Math.max(0, o.flipT - dt);
    if (o.ph === "final") { S.time = Math.max(S.time, 5); o.finalT -= dt; if (o.finalT <= 0) winRun(); return; }
    // jogador
    var sp = 215 * (o.cafe > 0 ? 1.45 : 1);
    o.px = clamp(o.px + mv.x * sp * dt, 36, 924); o.py = clamp(o.py + mv.y * sp * dt, 232, 480);
    if (Math.abs(mv.x) > .2) o.face = mv.x > 0 ? 1 : -1;
    if (!S.bot && arcHeld("a")) act("a");
    // contagem
    var pr = clamp(o.c / .8, 0, 1);
    o.c = Math.min(o.ph === "boss" ? .97 : 1, o.c + dt * .0042 * (o.slow > 0 ? .4 : 1));
    if (o.ph === "count" && o.c >= .8) startBoss();
    while (o.segN < 9 && o.c >= (o.segN + 1) / 10) segPush();
    if (!o.flipped && o.c > .5 && p3_lula(o.c) > 50) {
      o.flipped = true; o.flipT = 3; shake(10); flashScr(lulaSide ? "255,80,80" : "255,223,0", .55); sfx("boom"); say("camp", "virada", 3);
      S.toast("VIRADA NA BARRA!", "#ffdf00", 3);
    }
    // spawns
    o.buT -= dt; if (o.buT <= 0) { spawnBU(); o.buT = rnd(1.3, 1.9); }
    o.puT -= dt; if (o.puT <= 0) { spawnPup(); o.puT = rnd(13, 19); }
    if (o.ph === "count") { o.boT -= dt; if (o.boT <= 0 && o.boatos.length < 6) { spawnBoato(); o.boT = lerp(4.2, 1.9, pr) * rnd(.85, 1.15); if (o.c > .55 && RNG() < .25) o.boT *= .5; } }
    // chefe
    var B = o.boss;
    if (B) {
      B.t += dt; B.hurt = Math.max(0, B.hurt - dt); B.lineT -= dt;
      if (B.intro > 0) B.intro -= dt;
      else {
        B.atk -= dt;
        if (B.atk <= 0 && o.boatos.length < 5) { B.atk = lerp(1.1, 1.8, B.hp / B.max); spawnBoato({ x: 480 + rnd(-60, 60), y: 290 }, 0); if (RNG() < .5) { B.line = BLINES[B.i++ % BLINES.length]; B.lineT = 2.6; } }
      }
    }
    // BU
    for (i = o.bus.length - 1; i >= 0; i--) {
      b = o.bus[i]; b.t += dt;
      if (b.t >= b.life) { o.bus.splice(i, 1); o.expired++; o.seg.m++; S.hit(); continue; }
      if (b.t > .45 && o.carry < 3 && dist(o.px, o.py, b.x, b.y) < 30) { o.bus.splice(i, 1); o.carry++; S.add(10, b.x, b.y - 10, "#cfe8ff"); sfx("coin"); }
    }
    // entrega
    if (o.carry > 0 && dist(o.px, o.py, P3_TSE.x, P3_TSE.y) < 66) {
      var n = o.carry, dm = o.pen > 0 ? 2 : 1; o.carry = 0; o.delivered += n; o.hits += n; o.seg.h += n;
      o.c = Math.min(o.ph === "boss" ? .97 : 1, o.c + n * .017 * dm); o.meter = Math.min(100, o.meter + 4 * n); hype = Math.min(100, hype + 6 * n);
      for (j = 0; j < n; j++) S.up(P3_TSE.x, P3_TSE.y - 40);
      S.add(30 * n * dm, P3_TSE.x - 20, P3_TSE.y - 60, "#69f0ae"); burst(P3_TSE.x, P3_TSE.y, "#69f0ae", 8 + n * 4, 150, 40); ring(P3_TSE.x, P3_TSE.y, "#69f0ae", 14); sfx("coin");
      if (S.combo >= 10 && !o.said.h) { o.said.h = 1; say("haddad_aposto_dinheiro", "combo", 1); }
    }
    // power-ups
    for (i = o.pups.length - 1; i >= 0; i--) {
      b = o.pups[i]; b.t += dt;
      if (b.t > 14) { o.pups.splice(i, 1); continue; }
      if (dist(o.px, o.py, b.x, b.y) < 32) {
        o.pups.splice(i, 1); sfx("pow"); ring(b.x, b.y, "#ffdf00", 10);
        if (b.k === "cafe") { o.cafe = 7; popup("CAFÉ DO MESÁRIO! +velocidade", b.x, b.y - 30, "#ffcc80", 17); }
        else if (b.k === "cracha") { o.cracha = 8; popup("CRACHÁ! escudo", b.x, b.y - 30, "#9fe8ff", 17); if (!o.said.e) { o.said.e = 1; say("erika_nao_e_trouxa", "powerup", 1); } }
        else { o.pen = 9; popup("PEN DRIVE! entrega x2", b.x, b.y - 30, "#a5d6a7", 17); }
      }
    }
    // tiros
    for (i = o.shots.length - 1; i >= 0; i--) {
      var s = o.shots[i]; s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.x < -20 || s.x > W + 20 || s.y < 150 || s.y > H || s.t > 1.4) { o.shots.splice(i, 1); continue; }
      var gone = false;
      for (j = 0; j < o.boatos.length && !gone; j++) {
        b = o.boatos[j];
        if (dist(s.x, s.y, b.x, b.y) < (b.hp0 > 1 ? 38 : 30)) { gone = true; b.hp--; if (b.hp <= 0) killBoato(b, b.hp0 > 1 ? 70 : 40); else { burst(b.x, b.y, "#fff", 6, 100, 40); sfx("tick"); } }
      }
      if (!gone && B && B.intro <= 0 && B.hp > 0 && dist(s.x, s.y, 480, 255) < 62) { gone = true; hurtBoss(1); }
      if (gone) o.shots.splice(i, 1);
    }
    // boatos
    for (i = o.boatos.length - 1; i >= 0; i--) {
      b = o.boatos[i]; b.t += dt;
      var tx = P3_TSE.x, ty = P3_TSE.y;
      if (b.cac) { tx = o.px; ty = o.py; }
      var ddx = tx - b.x, ddy = ty - b.y, dd = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
      b.vx = ddx / dd * b.sp; b.vy = ddy / dd * b.sp; b.x += b.vx * dt; b.y += b.vy * dt;
      if (dist(b.x, b.y, o.px, o.py) < (b.hp0 > 1 ? 40 : 32)) {
        if (o.cracha > 0) { o.cracha = 0; killBoato(b, 60); popup("BLOQUEADO!", b.x, b.y - 30, "#9fe8ff", 18); }
        else if (o.inv <= 0) { o.boatos.splice(i, 1); o.boatoHit++; o.inv = 1.2; o.slow = 2; burst(b.x, b.y, "#ff6b6b", 12, 150, 60); popup("BOATO! quase acreditou", o.px, o.py - 50, "#ff6b6b", 18); lose("player"); say("renan_nao_saia_as_ruas", "boato", 1); }
        continue;
      }
      if (dist(b.x, b.y, P3_TSE.x, P3_TSE.y) < 46) {
        o.boatos.splice(i, 1); o.tseHit++; o.slow = 3.5; o.c = Math.max(0, o.c - .015); popup("BOATO NO TOTALIZADOR!", P3_TSE.x - 40, P3_TSE.y - 70, "#ff6b6b", 18); burst(P3_TSE.x, P3_TSE.y, "#ff6b6b", 14, 150, 60); lose("tse");
      }
    }
  }

  /* ---------- bot: coleta, entrega, atira, foge (com erros humanos) ---------- */
  function bot(dt) {
    if (o.ph === "final" || o.ended) { o.bm = { x: 0, y: 0 }; return; }
    botEvery(S, "f", .16, function () {
      if (o.shotCd > 0 || RNG() < .34) return;
      var near = o.boatos.some(function (b) { return dist(o.px, o.py, b.x, b.y) < 560; }) || (o.boss && o.boss.intro <= 0 && o.boss.hp > 0);
      if (near) act("a");
    }, dt);
    botEvery(S, "b", .5, function () { if (o.meter >= 100 && (o.boatos.length >= 3 || (o.boss && o.boss.hp > 0))) act("b"); }, dt);
    o.bIdle -= dt; if (o.bIdle > 0) { o.bm = { x: 0, y: 0 }; return; }
    botEvery(S, "m", .1, function () {
      if (RNG() < .025) { o.bIdle = .5; return; }
      var i, b, best = null, bd = 1e9, d, gx, gy, nearBU = null;
      for (i = 0; i < o.bus.length; i++) { b = o.bus[i]; d = dist(o.px, o.py, b.x, b.y); if (b.life - b.t > d / 200 + .3 && d < bd) { bd = d; nearBU = b; } }
      var home = dist(o.px, o.py, P3_TSE.x, P3_TSE.y);
      if (o.carry >= 3 || (o.carry > 0 && (!nearBU || bd > 220 || o.carry >= 2 && home < 300))) { gx = P3_TSE.x; gy = P3_TSE.y; }
      else if (nearBU) { gx = nearBU.x; gy = nearBU.y; }
      else if (o.carry > 0) { gx = P3_TSE.x; gy = P3_TSE.y; }
      else { gx = 520; gy = 380; }
      for (i = 0; i < o.pups.length; i++) { b = o.pups[i]; if (dist(o.px, o.py, b.x, b.y) < 170) { gx = b.x; gy = b.y; } }
      var vx = gx - o.px, vy = gy - o.py, m = Math.sqrt(vx * vx + vy * vy) || 1;
      if (m < 8) { vx = 0; vy = 0; m = 1; }
      vx /= m; vy /= m;
      for (i = 0; i < o.boatos.length; i++) {
        b = o.boatos[i]; d = dist(o.px, o.py, b.x, b.y);
        if (b.cac && d < 130) { vx += (o.px - b.x) / d * 1.6; vy += (o.py - b.y) / d * 1.6; }
        else if (d < 70) { vx += (o.px - b.x) / d * 1.1; vy += (o.py - b.y) / d * 1.1; }
      }
      m = Math.sqrt(vx * vx + vy * vy) || 1; o.bm = { x: vx / m * Math.min(1, m), y: vy / m * Math.min(1, m) };
    }, dt);
  }

  /* ---------- desenho ---------- */
  function bg(c) {
    var gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#07123a"); gr.addColorStop(1, "#02050f"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    c.strokeStyle = "rgba(80,130,255,.07)"; c.lineWidth = 1;
    for (var x = 0; x < W; x += 40) { c.beginPath(); c.moveTo(x + (S.anim * 10) % 40, 0); c.lineTo(x + (S.anim * 10) % 40 - 120, 170); c.stroke(); }
    // piso da sala
    var fg = c.createLinearGradient(0, 214, 0, 506); fg.addColorStop(0, "#14224f"); fg.addColorStop(1, "#0a1130"); c.fillStyle = fg; c.fillRect(0, 214, W, 292);
    c.strokeStyle = "rgba(120,160,255,.09)"; for (x = 0; x < W; x += 60) { c.beginPath(); c.moveTo(x, 214); c.lineTo(x, 506); c.stroke(); } for (var y = 214; y < 506; y += 48) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    // esteira de urnas (de onde caem os BU)
    c.fillStyle = "#1c2a5e"; c.fillRect(0, 198, W, 16); c.fillStyle = "rgba(255,223,0,.5)"; for (x = -((S.anim * 40) % 40); x < W; x += 40) c.fillRect(x, 204, 20, 4);
    for (x = -((S.anim * 40) % 120); x < W; x += 120) { c.fillStyle = "#8a93aa"; rr(c, x, 186, 34, 14, 3); c.fill(); }
  }
  function drawBars(c, y0) {
    var l = o.c >= 1 ? 51.79 : p3_lula(o.c), f = 100 - l, bw = 380, bx = 290, bh = 22, gap = 4;
    var lw = clamp((l - 30) / 40, .05, 1) * bw, fw = clamp((f - 30) / 40, .05, 1) * bw, lead = l > f;
    function row(yy, w, col, col2, name, pct, win) {
      uiPanel(c, bx - 4, yy - 3, bw + 110, bh + 6, "rgba(0,0,0,.45)");
      var gr = c.createLinearGradient(bx, 0, bx + w, 0); gr.addColorStop(0, col); gr.addColorStop(1, col2); c.fillStyle = gr; rr(c, bx, yy, w, bh, 8); c.fill();
      txt(c, name, bx + 10, yy + bh / 2, 13, "#fff", "left", "rgba(0,0,0,.6)");
      txt(c, p3_f2(pct) + "%", bx + w + 8, yy + bh / 2, 16, win ? "#fff" : "#cfd6f0", "left", "rgba(0,0,0,.7)");
    }
    row(y0, lw, "#b71c1c", "#ff5252", "LULA · 13", l, lead);
    row(y0 + bh + gap + 4, fw, "#1b7a3a", "#ffdf00", "FLÁVIO · 22", f, !lead);
  }
  function drawTV(c) {
    c.fillStyle = "#0d1e5c"; c.fillRect(0, 68, W, 34); c.fillStyle = "#ffdf00"; c.fillRect(0, 68, 8, 34);
    txt(c, "APURAÇÃO · 2º TURNO", 200, 85, 20, "#fff", "left");
    c.fillStyle = Math.floor(S.anim * 2) % 2 ? "#ff3b3b" : "#a01818"; c.beginPath(); c.arc(W - 150, 85, 7, 0, TAU); c.fill(); txt(c, "AO VIVO", W - 138, 85, 15, "#fff", "left");
    txt(c, "URNAS APURADAS", 470, 78, 10, "#9aa0b4", "left"); txt(c, p3_f2(o.c * 100) + "%", 470, 94, 18, "#ffdf00", "left");
    uiBar(c, 560, 80, 260, 10, o.c, "#69f0ae");
    drawBars(c, 112);
    if (o.flipT > 0) { var a = clamp(o.flipT, 0, 1); c.save(); c.globalAlpha = a; c.translate(850, 140); c.rotate(-.12); c.fillStyle = "#ffdf00"; rr(c, -80, -20, 160, 40, 8); c.fill(); txt(c, "VIRADA!", 0, 1, 28, "#c62828", "center"); c.restore(); }
  }
  function ticker(c) {
    c.fillStyle = "rgba(0,0,0,.7)"; c.fillRect(0, 506, W, 34); c.fillStyle = "#ffdf00"; c.fillRect(0, 506, 4, 34);
    var s = "     " + P3_TICK.join("   •   ") + "   •   ", w;
    c.font = "bold 14px 'Trebuchet MS', Arial"; w = c.measureText(s).width;
    c.save(); c.beginPath(); c.rect(10, 506, W - 20, 34); c.clip(); c.fillStyle = "#fff"; c.textAlign = "left"; c.textBaseline = "middle";
    var x = -(o.tickX % w); c.fillText(s, x, 523); c.fillText(s, x + w, 523); c.restore();
  }
  function drawStrip(c) {
    var hc = lulaSide ? "#ff5252" : "#ffdf00";
    txt(c, "TORCIDA " + (lulaSide ? "LULA" : "FLÁVIO") + " (não muda o resultado)", 200, 177, 10, "#9aa0b4", "left"); uiBar(c, 200, 186, 220, 8, hype / 100, hc);
    var rdy = o.meter >= 100;
    txt(c, rdy ? "COLETIVA DO TSE PRONTA · K / ⭐" : "COLETIVA DO TSE", 450, 177, 10, rdy ? "#ffdf00" : "#9aa0b4", "left"); uiBar(c, 450, 186, 220, 8, o.meter / 100, rdy && Math.floor(S.anim * 6) % 2 ? "#fff" : "#4fc3f7");
    var st = [o.cafe > 0 ? "☕ " + Math.ceil(o.cafe) : "", o.cracha > 0 ? "🪪 " + Math.ceil(o.cracha) : "", o.pen > 0 ? "💾 x2 " + Math.ceil(o.pen) : ""].filter(Boolean).join("  ");
    txt(c, st, 700, 186, 13, "#ffe082", "left");
  }
  function drawTSE(c) {
    var x = P3_TSE.x, y = P3_TSE.y, pu = 1 + Math.sin(S.anim * 4) * .03;
    c.save(); c.translate(x, y); c.scale(pu, pu);
    c.fillStyle = "rgba(105,240,174,.1)"; c.beginPath(); c.arc(0, 0, 66, 0, TAU); c.fill(); c.strokeStyle = "rgba(105,240,174,.5)"; c.lineWidth = 2; c.setLineDash([6, 6]); c.stroke(); c.setLineDash([]);
    c.fillStyle = "#1d3b8a"; rr(c, -40, -42, 80, 84, 8); c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 2; c.stroke();
    c.fillStyle = "#0a0f24"; rr(c, -32, -34, 64, 34, 4); c.fill(); txt(c, p3_f2(o.c * 100) + "%", 0, -17, 14, "#69f0ae", "center");
    txt(c, "TSE", 0, 14, 18, "#fff", "center"); txt(c, "TOTALIZADOR", 0, 31, 8, "#cfd6f0", "center");
    c.restore();
    if (o.carry > 0 && dist(o.px, o.py, x, y) > 70) txt(c, "▶ entregue " + o.carry + " BU aqui", x, y - 76, 12, "#69f0ae", "center", "rgba(0,0,0,.6)");
  }
  function drawBU(c, x, y, a) {
    c.save(); c.globalAlpha = a == null ? 1 : a; c.translate(x, y);
    c.fillStyle = "#fff"; rr(c, -17, -13, 34, 26, 4); c.fill(); c.fillStyle = "#1b3a8a"; c.fillRect(-17, -13, 34, 7);
    txt(c, "BU", 0, -9.5, 7, "#fff", "center"); c.fillStyle = "#b0b6c8"; c.fillRect(-12, -3, 24, 2); c.fillRect(-12, 2, 16, 2); txt(c, "✔", 10, 6, 10, "#2e9c4a", "center");
    c.restore();
  }
  function drawBoato(c, b) {
    var big = b.hp0 > 1, w = big ? 150 : 124, h = big ? 46 : 38, pop = Math.min(1, b.t * 5);
    c.save(); c.translate(b.x, b.y); c.scale(.6 + .4 * pop, .6 + .4 * pop);
    c.fillStyle = Math.floor(S.anim * 5 + b.x) % 2 ? "#e53935" : "#c62828"; rr(c, -w / 2, -h / 2, w, h, 14); c.fill(); c.strokeStyle = b.cac ? "#ffeb3b" : "#fff"; c.lineWidth = b.cac ? 3 : 2; c.stroke();
    txt(c, "BOATO", 0, -h / 2 + 10, 9, "#ffeb3b", "center"); txt(c, b.tx, 0, 6, b.tx.length > 18 ? 10 : 12, "#fff", "center");
    if (big) { for (var i = 0; i < b.hp0; i++) { c.fillStyle = i < b.hp ? "#ffeb3b" : "rgba(0,0,0,.4)"; c.fillRect(-14 + i * 16, h / 2 - 8, 12, 4); } }
    c.restore();
  }
  function drawBoss(c) {
    var B = o.boss; if (!B) return;
    var jig = B.hurt > 0 ? Math.sin(S.anim * 60) * 4 : 0, by = 320 + Math.sin(S.anim * 2) * 4;
    c.save(); if (B.hp <= 0) c.globalAlpha = .5;
    drawChar(c, "npc", 480 + jig, by, 1.9, { t: S.anim, moving: B.intro <= 0, shirt: lulaSide ? "#2e9b3f" : "#c62828", skin: "#d9a070", hair: "#9e9e9e", pants: "#37474f", stun: B.hurt > 0 });
    c.fillStyle = "#222"; rr(c, 480 + 38, by - 140, 22, 40, 4); c.fill(); c.fillStyle = "#4fc3f7"; rr(c, 480 + 41, by - 137, 16, 33, 3); c.fill();
    c.restore();
    uiPanel(c, 300, 214, 360, 22, "rgba(30,30,40,.86)"); txt(c, "TIO DO ZAP GIGANTE", 310, 225, 10, "#ffcc80");
    uiBar(c, 430, 220, 220, 10, B.hp / B.max, "#ef5350", "rgba(255,255,255,.18)");
    if (B.lineT > 0 && B.hp > 0) { c.save(); c.globalAlpha = clamp(B.lineT * 2, 0, 1); balloon(c, B.line, 480, by - 150, { size: 12, maxW: 230 }); c.restore(); }
  }
  function drawPups(c) {
    o.pups.forEach(function (p) {
      var bob = Math.sin(S.anim * 4 + p.x) * 3, em = p.k === "cafe" ? "☕" : p.k === "cracha" ? "🪪" : "💾", col = p.k === "cafe" ? "#ffb74d" : p.k === "cracha" ? "#4fc3f7" : "#81c784";
      if (p.t > 10 && Math.floor(p.t * 6) % 2) return;
      c.fillStyle = "rgba(255,255,255,.12)"; c.beginPath(); c.arc(p.x, p.y + bob, 22, 0, TAU); c.fill(); c.strokeStyle = col; c.lineWidth = 3; c.stroke(); txt(c, em, p.x, p.y + bob + 1, 22, "#fff", "center");
    });
  }
  function drawPlayer(c) {
    if (o.inv > 0 && Math.floor(S.anim * 20) % 2 === 0) return;
    var mv = S.bot ? o.bm : arcMove(), mov = Math.abs(mv.x) + Math.abs(mv.y) > .15;
    drawChar(c, "npc", o.px, o.py + 24, .85, { t: S.anim, moving: mov, flip: o.face < 0, shirt: "#3b6fd4", skin: "#e0ac84", hair: "#3a2a1a" });
    for (var i = 0; i < o.carry; i++) drawBU(c, o.px, o.py - 46 - i * 12, 1);
    if (o.cracha > 0) { c.strokeStyle = "rgba(79,195,247," + (.5 + .3 * Math.sin(S.anim * 8)) + ")"; c.lineWidth = 3; c.beginPath(); c.arc(o.px, o.py, 34, 0, TAU); c.stroke(); }
    if (o.cafe > 0) txt(c, "☕", o.px + 22, o.py - 30, 14, "#fff", "center");
    if (S.t < 7) txt(c, "▼ você", o.px, o.py - 66 - o.carry * 12, 11, "#fff", "center", "rgba(0,0,0,.6)");
  }
  function drawFinal(c) {
    var t = 4.4 - o.finalT, a = clamp(t * 2, 0, 1);
    c.save(); c.globalAlpha = a; uiPanel(c, 120, 250, 720, 200, "rgba(0,0,0,.82)", "#ffdf00");
    txt(c, "100% DAS URNAS APURADAS", W / 2, 280, 22, "#ffdf00", "center");
    txt(c, "LULA 51,79%  ×  FLÁVIO 48,21%", W / 2, 336, 38, "#fff", "center", "#000");
    txt(c, "Resultado oficial no jogo, idêntico ao da vida real. Não houve urna com zero voto.", W / 2, 384, 15, "#cfd6f0", "center");
    txt(c, lulaSide ? "Seu time venceu. Agora, o plantão do TSE segue desmentindo boato…" : "Seu time perdeu. Agora, o plantão do TSE segue desmentindo boato…", W / 2, 416, 17, "#69f0ae", "center");
    c.restore();
  }
  function draw(c) {
    bg(c); drawTV(c); drawStrip(c); drawTSE(c);
    o.bus.forEach(function (b) { var drop = Math.min(1, b.t * 2.2), exp = b.life - b.t; if (exp < 2.5 && Math.floor(b.t * 8) % 2) return; drawBU(c, b.x, lerp(200, b.y, drop), clamp(b.t * 4, 0, 1)); if (drop >= 1) { c.strokeStyle = "rgba(255,223,0,.5)"; c.lineWidth = 2; c.beginPath(); c.arc(b.x, b.y, 22, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - b.t / b.life)); c.stroke(); } });
    drawPups(c); drawBoss(c); drawPlayer(c);
    o.shots.forEach(function (s) { c.save(); c.translate(s.x, s.y); c.rotate(s.t * 14); c.fillStyle = "#fff"; rr(c, -9, -7, 18, 14, 2); c.fill(); c.strokeStyle = "#2e9c4a"; c.lineWidth = 2; c.stroke(); c.restore(); });
    o.boatos.forEach(function (b) { drawBoato(c, b); });
    if (o.hurtF > 0) { c.fillStyle = "rgba(229,57,53," + o.hurtF * .3 + ")"; c.fillRect(0, 214, W, 292); }
    if (o.ph === "final") drawFinal(c);
    ticker(c);
  }

  return {
    intro: {
      sub: "25/10 · apuração do 2º turno", foeLabel: lulaSide ? "Flávio, na frente (por enquanto)" : "Lula, correndo por fora",
      lines: ["Você é o mesário: pegue BU e entregue no totalizador do TSE.", "Setas/WASD (ou joystick) · Espaço/J desmente boato · K = coletiva",
        "BOATO (bolha vermelha) no totalizador ou em você tira credibilidade.", "O jogo NÃO altera o resultado: o 51,79 × 48,21 é do TSE."]
    },
    arcade: { a: "📄", b: "🎙" },
    begin: function () { say("nikolas_nao_sou_futurologista", "inicio", 2); S.toast("Pegue 📄 BU · entregue no TSE · desminta o BOATO", "#fff", 3.2); },
    update: update, draw: draw, act: act, bot: bot,
    timeUp: function () {
      if (o.ended || o.ph === "final") return; o.ended = true;
      S.end(false, clamp(.1 + .3 * o.c, 0, .4), "O tempo acabou com " + p3_f2(o.c * 100) + "% apurado" + (o.boss ? " e o Tio do Zap ainda no grupo" : "") + ". O TSE termina a contagem de qualquer jeito.", { failTitle: "Apuração Lenta" });
    },
    info: function () {
      var l = o.c >= 1 ? 51.79 : p3_lula(o.c);
      return { phase: o.ph, counted: Math.round(o.c * 10000) / 100, lula: Math.round(l * 100) / 100, flavio: Math.round((100 - l) * 100) / 100, zeroUrns: 0, opened: o.delivered,
        hits: o.hits, boatos: o.boatoHit + o.tseHit, killed: o.killed, carry: o.carry, flipped: o.flipped, bossHp: o.boss ? o.boss.hp : null, meter: Math.round(o.meter), px: Math.round(o.px), py: Math.round(o.py) };
    }
  };
};
