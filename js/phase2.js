"use strict";
/* ================= Fase 2 — Grupo da Família (WhatsApp) · arcade =================
   Boatos, áudios de 8 min e correntes descem pelo feed rumo à família. Você é o checador: atire prints com fonte,
   bloqueie com o corpo (e pague o preço) e use "Grupo silenciado". No fim, o Tio/Tia do Zap entra no grupo. */

var P2_TAC = ["Emoção exagerada", "Falso especialista", "Teoria da conspiração", "Polarização", "Personagem falso"];
var P2_FAKES = ["Pão de queijo será taxado em 300%!", "Picanha só com CPF de cidadão do bem!", "Gato do vizinho é infiltrado: compartilhe!", "Terça-feira será extinta no domingo!", "Churrasco proibido por decreto (de quem? ninguém sabe)", "Cientistas: Wi-Fi só pega pra um lado!", "Feriado de 31/02 já foi aprovado!!", "Doutor em Astrologia Política: Capricórnio vota em dobro", "Ninguém te conta: o chinelo sumiu por um motivo", "Perfil novo, foto de gato: “sou eleitor comum, juro”"];
var P2_MEM = [{ n: "Vó Lúcia", e: "👵" }, { n: "Tio Zé", e: "👨" }, { n: "Prima Bia", e: "👧" }, { n: "Pai", e: "🧔" }, { n: "Tia Rô", e: "👩" }];
var P2_PU = { rapid: { e: "⚡", n: "TIRO RÁPIDO", col: "#ffd54f" }, shield: { e: "🛡", n: "ESCUDO", col: "#4fc3f7" }, slow: { e: "🐌", n: "FEED LENTO", col: "#ce93d8" }, heart: { e: "❤", n: "+1 FAMÍLIA", col: "#ff8a80" } };
var P2_FLOOR = 462;

SCEN[2] = function (S) {
  var rightFlavor = S.camp === "lula";   // Time Lula: o tio chato é do time da seleção
  var o = { anim: 0, px: 480, py: 420, items: [], shots: [], pus: [], spawnT: 1, cd: 0, stun: 0, kills: 0, leaked: 0, blocked: 0, sp: 0, rapid: 0, shield: 0, slow: 0, puT: 12, heartT: 26,
    boss: null, bossAt: 60, seg: 0, segT: 11, memHit: [0, 0, 0, 0, 0], mem: [], bin: { x: 0, y: 0 }, bpause: 0, btgt: null, berr: 0, ended: false, spoke: 0, first: true, specials: 0, bg: 0 };
  S.lives = 5; S.maxLives = 5; S.livesLabel = "FAMÍLIA"; S.time = 150; S.timeMax = 150;
  for (var mi = 0; mi < 5; mi++) o.mem.push({ x: 150 + mi * 165 });
  var FEED = ["Tio Zé: bom dia com glitter ✨", "Tia Néia: ENCAMINHADA ↪↪↪", "Prima Bia: gente, respirem 🙏", "Tio Marcos está gravando áudio…", "Vó Lúcia: quem é esse número?", "Tia Rô: vejam o vídeo (11 min)"];
  var BLINES = rightFlavor ? ["Ouve esse áudio de 9 min: o Brasil acaba amanhã (de novo)!", "Meu cunhado viu num grupo, então é verdade!", "Tá tudo errado! (não vou dizer o quê)"]
    : ["Compartilha: o churrasco vai virar reunião de sindicato!", "Minha amiga viu num grupo, então é verdade!", "Tá tudo errado! (não vou dizer o quê)"];

  function pr() { return clamp(S.t / 60, 0, 1); }
  function speed() { return 68 + 58 * pr(); }
  function grade() { S.grid.push(o.seg === 0 ? "g" : o.seg === 1 ? "y" : "r"); o.seg = 0; }
  function mkThreat(kind, x, y, boss) {
    var m = o.mem[rint(0, 4)], sp = speed() * (kind === "corrente" ? 1.75 : kind === "audio" ? .62 : 1), y0 = y == null ? 76 : y;
    x = x == null ? rnd(70, 890) : x;
    var it = { k: kind, x: x, y: y0, ax: x, vy: sp, vx: (m.x - x) / ((P2_FLOOR - y0) / sp), hp: kind === "audio" ? 2 : 1, hp0: kind === "audio" ? 2 : 1, ph: rnd(0, 6), tac: rint(0, 4), tx: pick(P2_FAKES), flash: 0, boss: !!boss,
      w: kind === "fake" ? 116 : kind === "audio" ? 124 : 54, h: kind === "fake" ? 56 : kind === "audio" ? 44 : 46, dead: false };
    o.items.push(it); return it;
  }
  function spawnOne() {
    var p = pr(), r = RNG(), k = p < .15 ? (r < .8 ? "fake" : "audio") : (r < .52 ? "fake" : r < .78 ? "audio" : "corrente");
    mkThreat(k);
  }
  function addPU(kind, x) { o.pus.push({ k: kind, x: x == null ? rnd(60, 900) : x, y: 80, vy: 85, t: 0 }); }
  function dropPU(x, y) {
    if (RNG() < .1) { var ks = ["rapid", "shield", "slow"]; o.pus.push({ k: S.lives < S.maxLives && RNG() < .3 ? "heart" : pick(ks), x: clamp(x, 40, 920), y: y, vy: 85, t: 0 }); }
  }
  function say2(id, ev, prio) { say(id, ev, prio || 0); }

  function startBoss() {
    o.boss = { x: 480, y: 190, hp: 20, max: 20, intro: 2.2, atk: 1.4, hurt: 0, line: "", lineT: 0, t: 0, dead: false };
    grade(); S.toast((rightFlavor ? "TIO" : "TIA") + " DO ZAP entrou no grupo! Atire prints com fonte nele!", "#ffcc80", 3); shake(6); sfx("alarm");
    if (rightFlavor) say2("flavio_assunto_proibido", "boss-intro", 3); else say2("boulos_ficcao_pura", "boss-intro", 3);
  }
  function finish(win, line) {
    if (o.ended) return; o.ended = true; grade();
    var acc = o.kills / Math.max(1, o.kills + o.leaked), perf = clamp(.15 + .35 * acc + .3 * (S.lives / S.maxLives) + .2 * clamp(S.time / 110, 0, 1), 0, 1);
    S.end(win, win ? Math.max(.3, perf) : .2, line, { titles: ["Mudo no Grupo", "Leitor de Visualização", "Fiscal de Corrente", "Checador Raiz", "Fact-checker da Família"], failTitle: "Saiu do Grupo", voiceWin: win ? "bola" : null, voiceLose: win ? null : "parou" });
  }
  function killThreat(it, by) {
    if (it.dead) return; it.dead = true; o.kills++; var x = it.ax, y = it.y, pts = it.k === "audio" ? 40 : it.k === "corrente" ? 30 : 20;
    S.up(x, y - 20); S.add(pts, x, y - 10, "#69f0ae"); burst(x, y, it.k === "audio" ? "#a5d6a7" : "#ffffff", 12, 150, 100); ring(x, y, "#4fc3f7", 8); sfx("pop");
    if (by !== "bomb") { o.sp = Math.min(100, o.sp + 7); dropPU(x, y); }
    if (by !== "bomb" && S.combo === 8) voxWho("combo", ["boulos", "janja", "flavio", "jair"], { p: .6 });
  }
  function hurtFamily(it) {
    var bi = 0, bd = 1e9, i;
    for (i = 0; i < 5; i++) { var d = Math.abs(o.mem[i].x - it.ax); if (d < bd) { bd = d; bi = i; } }
    o.memHit[bi] = 1.4; o.leaked++; o.seg++; S.lives--; S.hit(); shake(8); flashScr("229,57,53", .4); sfx("hit"); burst(o.mem[bi].x, 480, "#ff8a80", 14, 160, 120);
    popup(P2_MEM[bi].n + " acreditou! 😵", o.mem[bi].x, 440, "#ff6b6b", 16);
    if (o.first) { o.first = false; voxWho("hit", ["boulos", "janja", "flavio"], { prio: 1 }); } else voxWho("hit", ["boulos", "janja", "flavio", "erika", "nikolas"], { p: .4 });
    if (S.lives <= 0) finish(false, "A família inteira acreditou em boato e você saiu do grupo (por vontade própria).");
  }
  function fire() {
    if (o.cd > 0 || o.stun > 0 || S.over) return;
    o.cd = o.rapid > 0 ? .1 : .22; o.shots.push({ x: o.px, y: o.py - 30, vy: -640 }); sfx("shot");
  }
  function special() {
    if (o.sp < 100 || S.over) return false;
    o.sp = 0; o.specials++; shake(10); flashScr("255,255,255", .5); sfx("boom"); S.toast("GRUPO SILENCIADO! 🔇", "#9fe8ff", 2); ring(o.px, o.py, "#9fe8ff", 20);
    var i, it;
    for (i = 0; i < o.items.length; i++) { it = o.items[i]; if (!it.dead) { it.hp = 0; killThreat(it, "bomb"); } }
    if (o.boss && !o.boss.dead && o.boss.intro <= 0) hitBoss(8);
    voxWho("powerup", ["dilma", "haddad", "jair", "tarcisio"], { p: .8 }); return true;
  }
  function hitBoss(n) {
    var B = o.boss; B.hp -= n; B.hurt = .25; B.hit = true; o.sp = Math.min(100, o.sp + n); ring(B.x, 170, "#ffdf00", 10); sfx("stamp");
    if (n > 1) popup("-" + n + " TIO DO ZAP", B.x, 120, "#ff8a65", 20);
    if (B.hp <= 0 && !B.dead) {
      B.dead = true; S.add(500, B.x, 150, "#ffdf00"); burst(B.x, 170, "#ffdf00", 40, 260, 120); flashScr("255,223,0", .5); slowmo(1.2);
      finish(true, "O " + (rightFlavor ? "Tio" : "Tia") + " do Zap foi vencido: " + o.kills + " boatos derrubados! Grupo em paz (só por 5 minutos).");
    }
  }

  function update(dt) {
    var i, j, it, p = pr(), v = S.bot ? o.bin : arcMove(), B = o.boss, sl = o.slow > 0 ? .55 : 1;
    o.anim += dt; o.cd = Math.max(0, o.cd - dt); o.stun = Math.max(0, o.stun - dt); o.rapid = Math.max(0, o.rapid - dt); o.shield = Math.max(0, o.shield - dt); o.slow = Math.max(0, o.slow - dt);
    for (i = 0; i < 5; i++) o.memHit[i] = Math.max(0, o.memHit[i] - dt);
    o.px = clamp(o.px + v.x * 340 * dt, 30, 930); o.py = clamp(o.py + v.y * 300 * dt, 170, 440);
    if (!S.bot && arcHeld("a")) fire();
    if (Math.floor(S.t / 7) !== o.spoke) { o.spoke = Math.floor(S.t / 7); o.feed = pick(FEED); }
    if (!B && S.t >= o.bossAt) startBoss();
    if (!B) { o.segT -= dt; if (o.segT <= 0) { o.segT = 11; grade(); } }
    // spawns
    o.spawnT -= dt;
    if (o.spawnT <= 0 && o.items.length < 9) {
      spawnOne(); if (p > .3 && RNG() < .2 * p + .05) spawnOne();
      o.spawnT = lerp(1.5, 1.1, p) * (B ? 2.4 : 1);
    }
    o.puT -= dt; if (o.puT <= 0) { o.puT = 15; addPU(pick(["rapid", "shield", "slow"])); }
    o.heartT -= dt; if (o.heartT <= 0) { o.heartT = 13; if (S.lives < S.maxLives) addPU("heart"); }
    if (B) {
      B.t += dt; B.hurt = Math.max(0, B.hurt - dt); B.lineT -= dt;
      if (!B.dead) {
        B.x = 480 + Math.sin(B.t * .7) * 280;
        if (B.intro > 0) B.intro -= dt;
        else { B.atk -= dt; if (B.atk <= 0) { B.atk = 3.2; for (j = -1; j <= 1; j += 2) { var bt = mkThreat(RNG() < .25 ? "audio" : "fake", clamp(B.x + j * 60, 40, 920), 160, true); bt.vy *= .8; bt.vx *= .8; } if (RNG() < .6) { B.line = pick(BLINES); B.lineT = 2.4; } } }
      }
    }
    // tiros
    for (i = o.shots.length - 1; i >= 0; i--) {
      var s = o.shots[i], used = false; s.y += s.vy * dt;
      if (s.y < 60) { o.shots.splice(i, 1); continue; }
      for (j = 0; j < o.items.length && !used; j++) {
        it = o.items[j]; if (it.dead) continue;
        if (Math.abs(s.x - it.ax) < it.w / 2 + 5 && Math.abs(s.y - it.y) < it.h / 2 + 8) {
          used = true; it.hp--; it.flash = .12; burst(s.x, s.y, "#4fc3f7", 4, 90, 0); if (it.hp <= 0) killThreat(it, "shot"); else sfx("tick");
        }
      }
      if (!used && B && !B.dead && B.intro <= 0 && Math.abs(s.x - B.x) < 46 && Math.abs(s.y - 150) < 64) { used = true; hitBoss(1); burst(s.x, s.y, "#ffdf00", 5, 100, 0); }
      if (used) o.shots.splice(i, 1);
    }
    // ameaças
    for (i = o.items.length - 1; i >= 0; i--) {
      it = o.items[i]; it.flash = Math.max(0, it.flash - dt);
      if (it.dead) { o.items.splice(i, 1); continue; }
      it.y += it.vy * sl * dt; it.x += it.vx * sl * dt; it.ph += dt * 2.4;
      it.ax = it.x + (it.k === "corrente" ? Math.sin(it.ph) * 24 : 0);
      if (Math.abs(it.ax - o.px) < it.w / 2 + 16 && Math.abs(it.y - o.py) < it.h / 2 + 22) {
        it.dead = true;
        if (o.shield > 0) { o.kills++; S.up(it.ax, it.y); S.add(15, it.ax, it.y, "#4fc3f7"); burst(it.ax, it.y, "#4fc3f7", 10, 140, 0); sfx("shield"); }
        else { o.blocked++; o.stun = it.k === "audio" ? .8 : .3; shake(5); S.hit(); popup(it.k === "audio" ? "🎧 ouviu o áudio!" : "BLOQUEOU (e levou)!", o.px, o.py - 50, "#ff8a65", 16); sfx("phone"); burst(it.ax, it.y, "#ff8a65", 8, 120, 0); }
        continue;
      }
      if (it.y >= P2_FLOOR) { it.dead = true; hurtFamily(it); }
    }
    // poderes
    for (i = o.pus.length - 1; i >= 0; i--) {
      var pu = o.pus[i]; pu.y += pu.vy * dt; pu.t += dt;
      if (Math.abs(pu.x - o.px) < 34 && Math.abs(pu.y - o.py) < 40) {
        o.pus.splice(i, 1); var D = P2_PU[pu.k];
        if (pu.k === "rapid") o.rapid = 8; else if (pu.k === "shield") o.shield = 7; else if (pu.k === "slow") o.slow = 6; else if (S.lives < S.maxLives) S.lives++;
        S.add(30, pu.x, pu.y - 20, D.col); popup(D.n + "!", pu.x, pu.y - 36, D.col, 18); ring(pu.x, pu.y, D.col, 10); burst(pu.x, pu.y, D.col, 12, 150, 0); sfx("pow");
        voxWho("powerup", ["dilma", "nikolas", "jair", "tarcisio"], { p: .35 });
      } else if (pu.y > P2_FLOOR + 30) o.pus.splice(i, 1);
    }
  }

  /* ---------- bot ---------- */
  function bot(dt) {
    var i, it, tgt = null, urg = 1e9, b = o.boss, want = { x: 0, y: 0 }, tx = o.px, ty = 440, tl, low = 0;
    if (o.bpause > 0) { o.bpause -= dt; o.bin = { x: 0, y: 0 }; return; }
    if (!o.items.length && RNG() < dt * .15) { o.bpause = rnd(.2, .5); return; }
    for (i = 0; i < o.items.length; i++) {
      it = o.items[i]; if (it.dead) continue;
      if (it.y > 360) low++;
      if (it.y >= o.py - 10) continue;
      tl = (P2_FLOOR - it.y) / it.vy; if (tl < urg) { urg = tl; tgt = it; }
    }
    var boss = b && !b.dead && b.intro <= 0 && (!tgt || urg > 2.6);
    if (tgt !== o.btgt) { o.btgt = tgt; o.berr = rnd(-8, 8); }
    var pu = null; for (i = 0; i < o.pus.length; i++) if (o.pus[i].y > 200 && o.pus[i].y < 430 && (!tgt || urg > 2.2) && (o.pus[i].k !== "heart" || S.lives < S.maxLives)) { pu = o.pus[i]; break; }
    if (pu) { tx = pu.x; ty = clamp(pu.y, 200, 440); }
    else if (boss) tx = b.x + o.berr;
    else if (tgt) { var tt = Math.max(0, (o.py - tgt.y) / 640); tx = tgt.ax + tgt.vx * tt + o.berr; }
    want.x = clamp((tx - o.px) / 18, -1, 1); want.y = clamp((ty - o.py) / 25, -1, 1); o.bin = want;
    var al = Math.abs(o.px - tx) < (tgt && !boss ? Math.min(30, tgt.w / 2 - 14) : 12) && !pu;
    if (al && (tgt || boss)) fire();
    if (o.sp >= 100 && (low >= 2 || o.items.length >= 5 || (b && !b.dead && b.hp < 7))) special();
  }

  /* ---------- desenho ---------- */
  function drawBg(c) {
    var gr = c.createLinearGradient(0, 0, 0, H), i, j, h; gr.addColorStop(0, "#0b1a16"); gr.addColorStop(1, "#08110f"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    var off = (o.anim * 24) % 70; c.fillStyle = "rgba(160,200,170,.07)"; c.font = "bold 22px Arial"; c.textAlign = "center"; c.textBaseline = "middle";
    for (j = -1; j < 9; j++) for (i = 0; i < 14; i++) { h = hash(i * 13 + j + Math.floor(o.anim * 24 / 70) * -1 + 100); c.fillText(h < .25 ? "♥" : h < .5 ? "☺" : h < .75 ? "★" : "✿", 40 + i * 72 + (j % 2) * 34, 90 + j * 70 + off); }
    c.fillStyle = "rgba(7,94,84,.9)"; c.fillRect(0, 462, W, 78);
    c.fillStyle = "rgba(255,255,255,.12)"; c.fillRect(0, 462, W, 2);
  }
  function drawMembers(c) {
    for (var i = 0; i < 5; i++) {
      var m = o.mem[i], hit = o.memHit[i] > 0, sh = hit ? Math.sin(o.anim * 50) * 3 : 0;
      c.fillStyle = hit ? "#ef5350" : "#cfd8dc"; c.beginPath(); c.arc(m.x + sh, 494, 22, 0, TAU); c.fill(); c.strokeStyle = hit ? "#fff" : "#00a884"; c.lineWidth = 3; c.stroke();
      txt(c, hit ? "😵" : P2_MEM[i].e, m.x + sh, 495, 24, "#000", "center"); txt(c, P2_MEM[i].n, m.x, 526, 11, "#e8e6dc", "center");
    }
  }
  function bub(c, x, y, w, h, fill, bd) { c.fillStyle = fill; c.strokeStyle = bd; c.lineWidth = 2; rr(c, x - w / 2, y - h / 2, w, h, 9); c.fill(); c.stroke(); }
  function drawThreat(c, it) {
    var x = it.ax, y = it.y, i, lines, a = clamp((y - 70) / 20, 0, 1);
    c.save(); c.globalAlpha = a;
    if (it.flash > 0) c.translate(Math.sin(o.anim * 80) * 2, 0);
    if (it.k === "fake") {
      bub(c, x, y, 116, 56, it.flash > 0 ? "#ffe0e0" : "#fff", "#e53935");
      c.fillStyle = "#e53935"; rr(c, x - 56, y - 27, 58, 12, 4); c.fill(); txt(c, "↪ ENCAMINHADA", x - 27, y - 21, 7, "#fff", "center");
      c.font = "bold 9px 'Trebuchet MS', Arial"; lines = wrap(c, it.tx, 108);
      for (i = 0; i < Math.min(2, lines.length); i++) txt(c, lines[i], x - 53, y - 6 + i * 11, 9, "#222", "left");
      txt(c, P2_TAC[it.tac], x, y + 21, 8, "#b71c1c", "center");
    } else if (it.k === "audio") {
      bub(c, x, y, 124, 44, it.flash > 0 ? "#f1ffe0" : "#dcf8c6", "#8bc34a");
      c.fillStyle = "#43a047"; c.beginPath(); c.moveTo(x - 54, y - 9); c.lineTo(x - 54, y + 9); c.lineTo(x - 40, y); c.fill();
      for (i = 0; i < 9; i++) { var wv = Math.abs(Math.sin(i * 1.7 + o.anim * 5)); c.fillStyle = "rgba(0,0,0,.28)"; c.fillRect(x - 34 + i * 5, y - 3 - wv * 6, 3, 6 + wv * 12); }
      txt(c, "🎙 8:12", x + 36, y - 4, 12, "#1b5e20", "center"); txt(c, it.hp + "/" + it.hp0 + " · áudio 8 min", x + 4, y + 15, 8, "#555", "center");
    } else {
      c.fillStyle = it.flash > 0 ? "#ffcdd2" : "#fff"; c.beginPath(); c.arc(x, y, 24, 0, TAU); c.fill(); c.strokeStyle = "#e53935"; c.lineWidth = 3; c.stroke();
      txt(c, "⛓", x, y - 2, 22, "#000", "center"); txt(c, "CORRENTE", x, y + 34, 8, "#ffab91", "center");
    }
    c.restore();
  }
  function drawBoss(c) {
    var B = o.boss; if (!B) return;
    var jig = B.hurt > 0 ? Math.sin(o.anim * 60) * 4 : 0;
    c.save(); if (B.dead) c.globalAlpha = .5;
    drawChar(c, "npc", B.x + jig, B.y, 1.55, { t: o.anim, moving: B.intro <= 0 && !B.dead, shirt: rightFlavor ? "#2e9b3f" : "#c62828", skin: "#d9a070", hair: "#9e9e9e", pants: "#37474f", stun: B.hurt > 0 });
    c.fillStyle = "#222"; rr(c, B.x + 22, B.y - 78, 16, 28, 3); c.fill(); c.fillStyle = "#4fc3f7"; rr(c, B.x + 24, B.y - 76, 12, 22, 2); c.fill();
    c.restore();
    uiPanel(c, 560, 70, 390, 28, "rgba(30,30,40,.86)");
    txt(c, (rightFlavor ? "TIO" : "TIA") + " DO ZAP", 570, 84, 11, "#ffcc80"); uiBar(c, 650, 78, 290, 12, B.hp / B.max, "#ef5350", "rgba(255,255,255,.18)");
    if (B.lineT > 0 && !B.dead) { c.save(); c.globalAlpha = clamp(B.lineT * 2, 0, 1); var lw = Math.min(380, c.measureText(B.line).width + 30); c.font = "bold 11px Arial"; lw = Math.min(380, c.measureText(B.line).width + 24); bub(c, clamp(B.x, lw / 2 + 6, W - lw / 2 - 6), B.y + 14, lw, 20, "#fff", "#555"); txt(c, B.line, clamp(B.x, lw / 2 + 6, W - lw / 2 - 6), B.y + 14, 11, "#222", "center"); c.restore(); }
  }
  function drawPlayer(c) {
    var moving = S.bot ? Math.abs(o.bin.x) + Math.abs(o.bin.y) > .1 : Math.abs(arcMove().x) + Math.abs(arcMove().y) > .1;
    if (o.shield > 0) { c.strokeStyle = "rgba(79,195,247," + (.5 + .3 * Math.sin(o.anim * 10)) + ")"; c.lineWidth = 4; c.fillStyle = "rgba(79,195,247,.15)"; c.beginPath(); c.arc(o.px, o.py - 32, 44, 0, TAU); c.fill(); c.stroke(); }
    drawChar(c, "npc", o.px, o.py + 10, .95, { t: o.anim, moving: moving, shirt: S.camp === "lula" ? "#d32f2f" : "#f2c230", skin: "#e0ac84", hair: "#3a2a1a", stun: o.stun > 0 });
    if (o.rapid > 0) txt(c, "⚡", o.px + 22, o.py - 52, 16, "#ffd54f", "center");
    if (S.t < 8 || o.stun > .6) txt(c, o.stun > .6 ? "🎧 ouvindo áudio de 8 min…" : "▼ você", o.px, o.py - 78, 11, "#fff", "center", "rgba(0,0,0,.7)");
  }
  function drawHud(c) {
    var i, x = 200;
    txt(c, "🔇 GRUPO SILENCIADO [K]", 200, 76, 10, o.sp >= 100 ? "#ffdf00" : "#9aa0b4"); uiBar(c, 200, 84, 190, 9, o.sp / 100, o.sp >= 100 ? (Math.floor(o.anim * 6) % 2 ? "#ffdf00" : "#ff9800") : "#4fc3f7");
    var pk = [["rapid", o.rapid, 8], ["shield", o.shield, 7], ["slow", o.slow, 6]];
    for (i = 0; i < 3; i++) if (pk[i][1] > 0) { var D = P2_PU[pk[i][0]]; txt(c, D.e, x + 205 + i * 46, 80, 16, "#fff", "center"); uiBar(c, x + 195 + i * 46, 91, 20, 4, pk[i][1] / pk[i][2], D.col); }
    if (!o.boss) { txt(c, o.feed || "tio Marcos está gravando áudio…", W - 10, 84, 11, "#b9e6dc", "right"); uiBar(c, W - 200, 94, 190, 5, S.t / o.bossAt, "#ffb74d"); txt(c, "o Tio/Tia do Zap chega…", W - 10, 108, 9, "#9aa0b4", "right"); }
  }
  function draw(c) {
    drawBg(c);
    var i; for (i = 0; i < o.pus.length; i++) { var pu = o.pus[i], D = P2_PU[pu.k]; c.fillStyle = "rgba(0,0,0,.4)"; c.beginPath(); c.arc(pu.x, pu.y, 24, 0, TAU); c.fill(); c.strokeStyle = D.col; c.lineWidth = 3; c.stroke(); txt(c, D.e, pu.x, pu.y + 1, 22, "#fff", "center"); txt(c, "prova", pu.x, pu.y + 34, 8, D.col, "center"); }
    for (i = 0; i < o.items.length; i++) drawThreat(c, o.items[i]);
    drawBoss(c);
    for (i = 0; i < o.shots.length; i++) { var s = o.shots[i]; c.fillStyle = "#e8f4ff"; c.strokeStyle = "#1e88e5"; c.lineWidth = 2; rr(c, s.x - 8, s.y - 12, 16, 24, 5); c.fill(); c.stroke(); txt(c, "✔", s.x, s.y, 11, "#2e7d32", "center"); }
    drawPlayer(c); drawMembers(c); drawHud(c);
  }

  return {
    intro: { sub: "WhatsApp · a família inteira online", foeLabel: "TIOS DO ZAP",
      lines: ["Você é o checador do grupo: proteja a família dos boatos!", "Setas/WASD mover · Espaço/J atira print · K especial", "Toque: joystick + botões 📎 e 🔇", "Pegue 🛡 ⚡ 🐌 · áudio de 8 min aguenta 2 prints", "No fim, o Tio/Tia do Zap entra no grupo!"] },
    arcade: { a: "📎", b: "🔇" },
    info: function () { return { kills: o.kills, leaked: o.leaked, blocked: o.blocked, trust: S.lives, special: Math.round(o.sp), bossHp: o.boss ? Math.max(0, o.boss.hp) : null, boss: !!o.boss, threats: o.items.length, rapid: o.rapid > 0, shield: o.shield > 0, specials: o.specials }; },
    update: update, draw: draw, bot: bot,
    act: function (b) { if (b === "a") fire(); else if (b === "b") special(); },
    timeUp: function () { if (!o.ended) finish(false, "Acabou o tempo e o Tio/Tia do Zap ainda mandava áudio de 8 min. O grupo seguiu espalhando boato."); }
  };
};
