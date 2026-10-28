"use strict";
/* ================= FASE 1 — Debate da Globo (23/10/2026) =================
   Arcade em tempo real: desvie de 📰 fake news (adversário) e ❓ perguntas difíceis (mediador), rebata com memes de resposta,
   encha a LACRAÇÃO, fuja das zonas de microfone cortado e derrube o adversário gigante na rodada relâmpago. Mesmo humor dos dois lados. */

var P1_FAKE = {   // projéteis do adversário: o que o OUTRO lado joga em você (exagero de campanha, nada factual)
  lula: ["CADÊ A PICANHA?", "FAKE: PIX TAXADO!", "AVIÃO DE NOVO?", "É CULPA DO PASSADO!", "SÓ TEM VÍDEO!", "BOLSA-CAFEZINHO!"],
  flavio: ["TEM PLANO OU SÓ POST?", "É SÓ MEME!", "CORRENTE DE ZAP!", "BRASIL ACIMA DE QUÊ?", "CORTE DE VÍDEO!", "SOBRENOME NÃO VOTA!"]
};
var P1_HARD = ["PLANO PRA ECONOMIA?", "E A SAÚDE?", "QUEM PAGA A CONTA?", "PROPOSTA PRA ESCOLA?", "QUAL A FONTE?", "PRAZO E META?"];
var P1_REPLY = {   // seus memes de resposta (o projétil)
  lula: ["EMPREGO!", "OBRA!", "RESULTADO!", "PICANHA!", "RENDA!"],
  flavio: ["MENOS IMPOSTO!", "SEGURANÇA!", "EMPREGO!", "LIBERDADE!", "PRODUZIR!"]
};
var P1_TAUNT = { lula: ["Tá nervoso, candidato?", "Resposta de manual!", "Lacrou na lata!"], flavio: ["Tá nervoso, presidente?", "Resposta de manual!", "Lacrou na lata!"] };
var P1_AX0 = 56, P1_AX1 = 640, P1_AY0 = 156, P1_AY1 = 424;

SCEN[1] = function (S) {
  var flav = S.camp === "flavio", foeKind = S.C.foe, meKind = S.C.kind, side = flav ? "flavio" : "lula";
  S.time = 125; S.timeMax = 125;
  var o = { px: 190, py: 290, cred: 100, lac: 0, cd: 0, inv: 0, shield: 0, rapid: 0, slow: 0, mute: 0, shots: [], foes: [], picks: [], zones: [],
    fx: { y: 280, dir: 1, t: 0, atk: 1.6, tk: 0, flinch: 0 }, med: { x: 480, dir: 1, ask: 7, tk: 0, cut: 14, cutT: 0 }, pickT: 8, round: 0, banner: 0, bannerS: "",
    boss: null, kills: 0, fired: 0, landed: 0, taken: 0, grazes: 0, cuts: 0, specials: 0, trap: 0, winDmg: 0, winN: 1, anim: 0, ended: false, first: { cut: 1, ask: 1, trap: 1, spec: 1 }, bmove: { x: 0, y: 0 }, bfire: false, bwait: 0, bnoise: 0 };
  var BOSS_T = 68, FOEX = 846;
  var ROUND_AT = [0, 23, 46];

  function diff() { return clamp(S.t / BOSS_T, 0, 1); }
  function foeSpeed() { return lerp(150, 245, diff()) * (o.slow > 0 ? .55 : 1) * (o.boss ? 1.08 : 1); }
  function fakeText() { return pick(P1_FAKE[side]); }
  function foeMouth() { return { x: FOEX - 44, y: o.fx.y + 6 }; }
  function mk(kind, x, y, vx, vy, txt) {
    var n = (txt || "").length, p = { k: kind, x: x, y: y, vx: vx, vy: vy, t: txt, hw: Math.max(36, n * 3.3 + 10), hh: 12, hp: 1, a: 0, graze: false, age: 0 };
    if (kind === "hard") { p.hw = Math.max(50, n * 3.3 + 26); p.hh = 18; }
    return p;
  }
  /* ---- spawns ---- */
  function aimed(spd, off) {
    var m = foeMouth(), dx = o.px - m.x, dy = (o.py + (off || 0)) - m.y, l = Math.hypot(dx, dy) || 1, p = mk("fake", m.x, m.y, dx / l * spd, dy / l * spd, fakeText());
    o.foes.push(p); return p;
  }
  function fan(n, spd, spread) {
    var m = foeMouth(), base = Math.atan2(o.py - m.y, o.px - m.x), i, a;
    for (i = 0; i < n; i++) { a = base + (i - (n - 1) / 2) * spread; o.foes.push(mk("fake", m.x, m.y, Math.cos(a) * spd, Math.sin(a) * spd, fakeText())); }
  }
  function volley(spd) {   // parede de fake news com uma brecha
    var n = 6, gap = rint(0, n - 1), i, m = foeMouth();
    for (i = 0; i < n; i++) if (i !== gap && i !== gap + 1) o.foes.push(mk("fake", m.x, P1_AY0 + 8 + i * ((P1_AY1 - P1_AY0 - 16) / (n - 1)), -spd, 0, fakeText()));
  }
  function homing(spd) { var m = foeMouth(), p = mk("chain", m.x, m.y, -spd * .7, 0, "CORRENTE!"); p.hp = 2; p.hh = 13; p.life = 3.4; p.spd = spd * .72; o.foes.push(p); }
  function ask(cols) {
    var i, xs = [];
    for (i = 0; i < cols; i++) xs.push(clamp(o.px + (i - (cols - 1) / 2) * 120 + rnd(-30, 30), P1_AX0 + 30, P1_AX1 - 10));
    xs.forEach(function (x) { o.med.tk = .7; o.zones.push({ k: "ask", x: x, t: .95, txt: pick(P1_HARD) }); });
    o.med.tk = .8;
    if (o.first.ask) { o.first.ask = 0; say("campopiano_sabe_o_que_voce_podia_fazer", "pergunta", 2); S.toast("O mediador fez uma PERGUNTA DIFÍCIL! Rebata (2 acertos).", "#ffcc80", 2.4); }
  }
  function micCut(n) {
    for (var i = 0; i < n; i++) {
      var w = 150, h = 130, x = rnd(P1_AX0 + 10, P1_AX1 - w - 10), y = rnd(P1_AY0, P1_AY1 - h);
      o.zones.push({ k: "mic", x: x, y: y, w: w, h: h, warn: 1.3, live: 2.8 });
    }
    sfx("alarm"); o.med.cutT = 1.3;
    if (o.first.cut) { o.first.cut = 0; S.toast("MICROFONE CORTADO: saia da zona vermelha ou fica mudo!", "#ff8a80", 2.6); }
  }
  function pickup(kind, x, y) { o.picks.push({ k: kind, x: x, y: y, t: 8.5, ph: rnd(0, TAU) }); }
  function randPick() {
    var r = RNG(), k = r < .26 ? "agua" : r < .5 ? "plateia" : r < .72 ? "resposta" : r < .9 ? "relogio" : "trap";
    if (k === "trap" && (S.t < 20 || o.cred < 50)) k = "agua";
    if (o.cred < 55 && RNG() < .5) k = "agua";
    pickup(k, rnd(P1_AX0 + 40, P1_AX1 - 40), rnd(P1_AY0 + 20, P1_AY1 - 20));
  }

  /* ---- dano e efeitos ---- */
  function lacAdd(v) { o.lac = clamp(o.lac + v, 0, 100); if (o.lac >= 100 && o.first.spec) { o.first.spec = 0; S.toast("LACRAÇÃO PRONTA! Aperte K / ⭐", "#ffdf00", 2.6); sfx("medal"); } }
  function hurt(dmg, why) {
    if (o.inv > 0 || S.over) return;
    if (o.shield > 0) { o.shield = 0; o.inv = 1; sfx("shield"); ring(o.px, o.py, "#80d8ff", 14); popup("PLATEIA BLOQUEOU!", o.px, o.py - 40, "#80d8ff", 15); return; }
    o.cred -= dmg; o.inv = 1.05; o.taken++; o.winDmg++; S.hit(); lacAdd(-18); shake(7); flashScr("229,57,53", .35); sfx("hit"); burst(o.px, o.py, "#ff8a80", 12, 150);
    popup(why || "VAIADO!", o.px, o.py - 38, "#ff6b6b", 17);
    if (o.cred <= 0) {
      o.cred = 0; o.ended = true;
      S.end(false, clamp(.12 + .3 * diff() + (o.boss ? .1 : 0), 0, .45), "O mediador cortou o seu microfone na rodada " + Math.max(1, o.round) + (o.boss ? " (relâmpago)" : "") + ". Respire e tente de novo!", { failTitle: "Microfone Cortado", voiceLose: flav ? "sistema" : "humilha" });
    }
  }
  function killFoe(p, byShot) {
    o.kills++; S.up(p.x, p.y - 20); S.add(p.k === "hard" ? 18 : 10, p.x, p.y - 8, p.k === "hard" ? "#ffcc80" : "#69f0ae");
    lacAdd(p.k === "hard" ? 9 : 5); burst(p.x, p.y, p.k === "hard" ? "#ffb74d" : "#ef5350", 12, 150); sfx("pop");
    if (RNG() < .1 && o.picks.length < 3) randPick();
    o.fx.flinch = Math.max(o.fx.flinch, .1);
  }
  function hitFoe(dmg) {
    o.landed++; S.add(4, FOEX - 20, o.fx.y - 30, "#fff"); lacAdd(3); o.fx.flinch = .22; burst(FOEX - 36, o.fx.y, "#fff176", 6, 110, 80);
    if (o.boss && !o.boss.dead) {
      o.boss.hp -= dmg; if (o.boss.hp <= 0) bossDown();
    }
  }
  function bossDown() {
    var B = o.boss; B.dead = true; o.foes = []; o.zones = []; S.add(600, FOEX - 40, o.fx.y, "#ffdf00"); burst(FOEX - 30, o.fx.y, "#ffdf00", 44, 280); ring(FOEX - 30, o.fx.y, "#ffdf00", 12); flashScr("255,223,0", .55); shake(12); sfx("win"); S.grid.push("g");
    var acc = o.fired ? o.landed / o.fired : 0, perf = clamp(.34 + .26 * (o.cred / 100) + .2 * clamp(acc * 1.6, 0, 1) + .12 * clamp(o.kills / 55, 0, 1) + .08 * (S.time / 125), 0, 1);
    S.end(true, perf, "Você lacrou o debate! " + o.kills + " fake news derrubadas, " + o.specials + " lacração" + (o.specials === 1 ? "" : "ões") + " e " + o.landed + " memes no alvo." + (o.trap ? "" : " E sem baixaria!"),
      { titles: ["Calouro do Estúdio", "Estagiário da Mediação", "Debatedor Raiz", "Mestre da Réplica", "Rei do Debate"], voiceWin: flav ? "desistir" : "viva" });
  }
  function special() {
    if (o.lac < 100 || o.ended || S.over) return;
    o.lac = 0; o.specials++; o.inv = Math.max(o.inv, 1.4); S.add(120, o.px, o.py - 40, "#ffdf00");
    popup("LACRAÇÃO!", o.px, o.py - 60, "#ffdf00", 30); ring(o.px, o.py, "#ffdf00", 10); ring(o.px, o.py, "#fff", 30); flashScr("255,223,0", .5); shake(10); sfx("boom"); slowmo(.55);
    var n = 0; o.foes.forEach(function (p) { n++; S.up(p.x, p.y); S.add(8, p.x, p.y, "#ffdf00"); burst(p.x, p.y, "#ffdf00", 8, 140); }); o.foes = [];
    o.zones = o.zones.filter(function (z) { return z.k === "mic" && z.live === undefined; });
    o.mute = 0; hitFoe(1); if (o.boss && !o.boss.dead) { o.boss.hp -= 7; if (o.boss.hp <= 0) bossDown(); }
    voxWho("combo", flav ? ["jair", "flavio", "nikolas", "campopiano"] : ["lula", "dilma", "haddad", "erika"], { prio: 3 });
    if (o.first.spec === 0) o.first.spec = -1;
  }
  function fire() {
    var spd = 560, r = o.rapid > 0, m = o.mute > 0;
    if (o.cd > 0 || m) return;
    o.cd = r ? .1 : .21; o.fired += r ? 3 : 1; sfx("shot");
    var txt = pick(P1_REPLY[side]);
    o.shots.push({ x: o.px + 26, y: o.py - 6, vx: spd, vy: 0, t: txt });
    if (r) { o.shots.push({ x: o.px + 24, y: o.py - 6, vx: spd, vy: -90, t: "" }); o.shots.push({ x: o.px + 24, y: o.py - 6, vx: spd, vy: 90, t: "" }); }
  }
  function startBoss() {
    o.boss = { hp: 34, max: 34, intro: 2.6, t: 0, pat: 0, pt: 1.2, dead: false };
    o.banner = 3; o.bannerS = "RODADA RELÂMPAGO!"; o.med.cut = 6; o.foes = o.foes.filter(function (p) { return p.k !== "hard"; });
    S.toast("O MEDIADOR chamou a RODADA RELÂMPAGO: o adversário ficou GIGANTE!", "#ffcc80", 3); sfx("alarm"); shake(8);
    say("campopiano_debate_inflamado", "boss-intro", 4); S.grid.push(o.winDmg === 0 ? "g" : o.winDmg === 1 ? "y" : "r"); o.winDmg = 0;
  }

  /* ---- atualização ---- */
  function bossAttack(dt) {
    var B = o.boss; if (B.intro > 0) { B.intro -= dt; return; }
    B.t += dt; B.pt -= dt;
    if (B.pt > 0) return;
    var sp = foeSpeed() + 25;
    B.pat = (B.pat + 1) % 5;
    if (B.pat === 0) { fan(3, sp, .26); B.pt = 1.25; }
    else if (B.pat === 1) { volley(sp * .9); B.pt = 1.9; }
    else if (B.pat === 2) { ask(3); B.pt = 2.3; }
    else if (B.pat === 3) { homing(sp); fan(5, sp * .9, .3); B.pt = 1.8; }
    else { aimed(sp * 1.1); aimed(sp * 1.1, -70); aimed(sp * 1.1, 70); B.pt = 1.3; }
    if (B.t > 8 && !o.zones.some(function (z) { return z.k === "mic"; }) && RNG() < .45) micCut(1);
  }
  function normalAttack(dt) {
    var d = diff(), f = o.fx; f.atk -= dt;
    if (f.atk > 0) return;
    var sp = foeSpeed(), r = RNG();
    f.atk = lerp(1.55, .62, d) * (o.slow > 0 ? 1.3 : 1) + rnd(0, .3);
    if (S.t > 44 && r < .16) volley(sp * .85);
    else if (S.t > 36 && r < .3) homing(sp);
    else if (S.t > 10 && r < .5) fan(3, sp, .3);
    else if (S.t > 26 && r < .64) { ask(S.t > 50 ? 2 : 1); f.atk += .5; }
    else aimed(sp);
  }
  function update(dt) {
    if (o.ended) return;
    var i, p, d = diff();
    o.anim += dt;
    o.fx.t += dt;
    if (o.cd > 0) o.cd -= dt; if (o.inv > 0) o.inv -= dt; if (o.shield > 0) o.shield -= dt; if (o.rapid > 0) o.rapid -= dt; if (o.slow > 0) o.slow -= dt;
    if (o.banner > 0) o.banner -= dt; if (o.fx.flinch > 0) o.fx.flinch -= dt; if (o.med.tk > 0) o.med.tk -= dt; if (o.med.cutT > 0) o.med.cutT -= dt;
    // rodadas
    for (i = ROUND_AT.length - 1; i >= 0; i--) if (S.t >= ROUND_AT[i] && !o.boss) { if (o.round !== i + 1) { o.round = i + 1; o.banner = 2.2; o.bannerS = "RODADA " + (i + 1) + "/3"; if (i > 0) { S.grid.push(o.winDmg === 0 ? "g" : o.winDmg === 1 ? "y" : "r"); o.winDmg = 0; S.toast(pick(P1_TAUNT[side]), "#ffe082", 1.8); sfx("alarm"); } } break; }
    if (!o.boss && S.t >= BOSS_T) startBoss();
    // adversário se move ao longo da borda direita
    var B = o.boss, fs = (B ? 60 : 40 + 55 * d) * (o.slow > 0 ? .6 : 1), f = o.fx;
    f.y += f.dir * fs * dt; if (f.y > P1_AY1 - 20) { f.y = P1_AY1 - 20; f.dir = -1; } if (f.y < P1_AY0 + 26) { f.y = P1_AY0 + 26; f.dir = 1; }
    if (RNG() < dt * .35) f.dir = -f.dir;
    // mediador passeia
    o.med.x += o.med.dir * 36 * dt; if (o.med.x > 700) o.med.dir = -1; if (o.med.x < 300) o.med.dir = 1;
    // movimento do jogador
    var mv = S.bot ? o.bmove : arcMove(), spd = 245 * (o.mute > 0 ? .85 : 1);
    o.px = clamp(o.px + mv.x * spd * dt, P1_AX0, P1_AX1); o.py = clamp(o.py + mv.y * spd * dt, P1_AY0, P1_AY1);
    if (S.bot ? o.bfire : arcHeld("a")) fire();
    // ataques
    if (o.boss) { if (!o.boss.dead) bossAttack(dt); } else {
      normalAttack(dt);
      if (S.t > 20) { o.med.ask -= dt; o.med.cut -= dt; }
      if (S.t > 22 && o.med.cut <= 0) { micCut(S.t > 46 ? 2 : 1); o.med.cut = lerp(13, 8, d); }
    }
    o.pickT -= dt; if (o.pickT <= 0 && o.picks.length < 3) { randPick(); o.pickT = rnd(8, 12); } else if (o.pickT <= 0) o.pickT = 3;
    // zonas
    var inMic = false;
    for (i = o.zones.length - 1; i >= 0; i--) {
      var z = o.zones[i];
      if (z.k === "ask") { z.t -= dt; if (z.t <= 0) { var q = mk("hard", z.x, 134, 0, 175 + 70 * d + (o.boss ? 25 : 0), z.txt); q.hp = 2; o.foes.push(q); sfx("whoosh"); o.zones.splice(i, 1); } }
      else if (z.k === "mic") {
        if (z.warn > 0) z.warn -= dt; else { z.live -= dt; if (z.live <= 0) { o.zones.splice(i, 1); continue; }
          if (o.px > z.x - 8 && o.px < z.x + z.w + 8 && o.py > z.y - 8 && o.py < z.y + z.h + 8) inMic = true; }
      }
    }
    if (inMic) { if (o.mute <= 0) { o.cuts++; sfx("nope"); popup("MUDO!", o.px, o.py - 40, "#ff8a80", 18); if (o.cuts === 1 || RNG() < .5) say(flav ? "nikolas_medo_de_opiniao" : "boulos_e_triste", "mic", 2); } o.mute = .25; lacAdd(-dt * 9); }
    else if (o.mute > 0) o.mute -= dt;
    // seus tiros
    for (i = o.shots.length - 1; i >= 0; i--) {
      p = o.shots[i]; p.x += p.vx * dt; p.y += p.vy * dt; var gone = p.x > W + 30 || p.y < 60 || p.y > H;
      if (!gone) for (var j = o.foes.length - 1; j >= 0; j--) {
        var q2 = o.foes[j];
        if (Math.abs(p.x - q2.x) < q2.hw + 6 && Math.abs(p.y - q2.y) < q2.hh + 8) { q2.hp--; gone = true; if (q2.hp <= 0) { killFoe(q2, true); o.foes.splice(j, 1); } else { burst(q2.x, q2.y, "#fff", 5, 90); sfx("tick"); } break; }
      }
      if (!gone && p.x > FOEX - 52 && Math.abs(p.y - o.fx.y) < 58 && (!o.boss || !o.boss.dead)) { gone = true; hitFoe(1); sfx("coin"); }
      if (gone) o.shots.splice(i, 1);
    }
    // projéteis inimigos
    var sf = o.slow > 0 ? .55 : 1;
    for (i = o.foes.length - 1; i >= 0; i--) {
      p = o.foes[i]; p.age += dt; p.a = Math.min(1, p.age * 6);
      if (p.k === "chain") { p.life -= dt; var ang = Math.atan2(o.py - p.y, o.px - p.x), cur = Math.atan2(p.vy, p.vx), da = ang - cur; da = Math.atan2(Math.sin(da), Math.cos(da)); cur += clamp(da, -1.7 * dt, 1.7 * dt); p.vx = Math.cos(cur) * p.spd; p.vy = Math.sin(cur) * p.spd; if (p.life <= 0) { burst(p.x, p.y, "#ce93d8", 6, 90); o.foes.splice(i, 1); continue; } }
      p.x += p.vx * dt * sf; p.y += p.vy * dt * sf;
      if (p.x < -90 || p.y > H + 40 || p.y < 40 || p.x > W + 60) { o.foes.splice(i, 1); continue; }
      // colisão: círculo do jogador x retângulo do projétil
      var cx = clamp(o.px, p.x - p.hw, p.x + p.hw), cy = clamp(o.py, p.y - p.hh, p.y + p.hh), dd = Math.hypot(o.px - cx, o.py - cy);
      if (dd < 15) { hurt(p.k === "hard" ? 17 : p.k === "chain" ? 12 : 9, p.k === "hard" ? "PERGUNTA DIFÍCIL!" : "FAKE NEWS!"); burst(p.x, p.y, "#ef5350", 8, 120); o.foes.splice(i, 1); continue; }
      if (!p.graze && dd < 34 && o.inv <= 0) { p.graze = 1; o.grazes++; lacAdd(3); S.add(3, o.px, o.py - 30, "#80d8ff"); if (o.grazes % 5 === 0) { popup("QUASE!", o.px, o.py - 44, "#80d8ff", 16); vox("near-miss", { p: .5 }); } }
    }
    // pickups
    for (i = o.picks.length - 1; i >= 0; i--) {
      p = o.picks[i]; p.t -= dt; if (p.t <= 0) { o.picks.splice(i, 1); continue; }
      if (Math.hypot(o.px - p.x, o.py - p.y) < 28) {
        o.picks.splice(i, 1); S.add(20, p.x, p.y - 20, "#69f0ae"); burst(p.x, p.y, "#fff", 10, 130);
        if (p.k === "agua") { o.cred = Math.min(100, o.cred + 30); popup("+CREDIBILIDADE", p.x, p.y - 30, "#69f0ae", 16); sfx("pow"); }
        else if (p.k === "plateia") { o.shield = 8; popup("PLATEIA NA SUA!", p.x, p.y - 30, "#80d8ff", 16); sfx("shield"); }
        else if (p.k === "resposta") { o.rapid = 8; popup("DIREITO DE RESPOSTA!", p.x, p.y - 30, "#ffd54f", 16); sfx("pow"); }
        else if (p.k === "relogio") { o.slow = 6; popup("TEMPO DILATADO", p.x, p.y - 30, "#b39ddb", 16); sfx("slow"); }
        else { o.trap++; lacAdd(-35); o.cred = Math.max(1, o.cred - 8); popup("BAIXARIA! A plateia vaiou", p.x, p.y - 30, "#ff8a80", 17); sfx("nope"); shake(5); flashScr("229,57,53", .25); say(flav ? "flavio_desculpa_nove_dedos" : "pedirDesc", "baixaria", 4); if (o.first.trap) { o.first.trap = 0; S.toast("Baixaria não rende voto: -lacração!", "#ff8a80", 2.2); } }
      }
    }
    state.progress = clamp(S.t / (BOSS_T + 40), 0, 1);
  }

  /* ---------------- desenho ---------------- */
  function bg(c) {
    var t = o.anim, i, x, y;
    var gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#070d28"); gr.addColorStop(.55, "#14246a"); gr.addColorStop(1, "#050818"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    for (i = 0; i < 16; i++) for (y = 0; y < 3; y++) {
      c.fillStyle = "rgba(" + (80 + (i * 9 + y * 20) % 80) + "," + (120 + (i * 13) % 80) + ",255," + (.05 + .06 * Math.abs(Math.sin(t * .8 + i * .6 + y))) + ")";
      c.fillRect(i * 60 + 3, 66 + y * 26, 54, 22);
    }
    c.save(); c.globalCompositeOperation = "lighter";
    for (i = 0; i < 3; i++) {
      x = 160 + i * 320 + Math.sin(t * .7 + i * 2) * 70;
      var sg = c.createLinearGradient(x, 0, x, 440); sg.addColorStop(0, "rgba(255,240,190,.16)"); sg.addColorStop(1, "rgba(255,240,190,0)");
      c.fillStyle = sg; c.beginPath(); c.moveTo(x - 8, 0); c.lineTo(x + 8, 0); c.lineTo(x + 130 + Math.sin(t + i) * 30, 440); c.lineTo(x - 130 + Math.sin(t + i) * 30, 440); c.closePath(); c.fill();
    }
    c.restore();
    // palco
    var fg = c.createLinearGradient(0, 140, 0, 440); fg.addColorStop(0, "#1a2150"); fg.addColorStop(1, "#0f1538"); c.fillStyle = fg; c.fillRect(0, 140, W, 300);
    c.strokeStyle = "rgba(120,160,255,.12)"; c.lineWidth = 1; for (i = 0; i < 9; i++) { c.beginPath(); c.moveTo(0, 150 + i * 34); c.lineTo(W, 150 + i * 34); c.stroke(); }
    c.fillStyle = "rgba(255,223,0,.5)"; c.fillRect(0, 440, W, 3);
    c.strokeStyle = "rgba(255,255,255,.1)"; c.setLineDash([10, 8]); c.strokeRect(P1_AX0 - 14, P1_AY0 - 22, P1_AX1 - P1_AX0 + 28, P1_AY1 - P1_AY0 + 44); c.setLineDash([]);
    for (var row = 0; row < 2; row++) for (i = 0; i < 36; i++) {
      x = i * 27 + row * 13 + hash(i + row * 40) * 6; y = 458 + row * 12 + (o.lac >= 100 ? Math.abs(Math.sin(t * 8 + i)) * -4 : 0);
      c.fillStyle = row ? "#0a0d22" : "#12183a"; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill(); c.fillRect(x - 11, y + 6, 22, 20);
      if (hash(i * 3 + row) > .93 && Math.floor(t * 3 + i) % 4 === 0) { c.fillStyle = "rgba(255,255,255,.9)"; c.fillRect(x - 3, y - 2, 6, 4); }
    }
  }
  function drawZones(c) {
    for (var i = 0; i < o.zones.length; i++) {
      var z = o.zones[i];
      if (z.k === "ask") { c.save(); c.strokeStyle = "rgba(255,171,64," + (.35 + .3 * Math.sin(o.anim * 20)) + ")"; c.lineWidth = 3; c.setLineDash([6, 8]); c.beginPath(); c.moveTo(z.x, 150); c.lineTo(z.x, P1_AY1 + 24); c.stroke(); c.restore(); txt(c, "❓", z.x, 150, 20, "#fff", "center"); continue; }
      var live = z.warn <= 0;
      c.save(); c.globalAlpha = live ? .38 : .15 + .12 * Math.abs(Math.sin(o.anim * 14)); c.fillStyle = "#e53935"; rr(c, z.x, z.y, z.w, z.h, 14); c.fill(); c.restore();
      c.strokeStyle = live ? "#ff5252" : "rgba(255,120,120,.8)"; c.lineWidth = live ? 3 : 2; c.setLineDash(live ? [] : [8, 6]); rr(c, z.x, z.y, z.w, z.h, 14); c.stroke(); c.setLineDash([]);
      txt(c, "🎙✖", z.x + z.w / 2, z.y + z.h / 2 - 8, 30, "#fff", "center");
      txt(c, live ? "MICROFONE CORTADO" : "ATENÇÃO...", z.x + z.w / 2, z.y + z.h / 2 + 26, 11, "#fff", "center", "rgba(0,0,0,.6)");
    }
  }
  function drawFoe(c, p) {
    c.save(); c.globalAlpha = p.a; c.translate(p.x, p.y);
    if (p.k === "hard") {
      c.fillStyle = "#ff9800"; rr(c, -p.hw, -p.hh, p.hw * 2, p.hh * 2, 8); c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 2; c.stroke();
      c.fillStyle = "#e65100"; c.beginPath(); c.arc(-p.hw + 3, -p.hh + 3, 11, 0, TAU); c.fill(); txt(c, "❓", -p.hw + 3, -p.hh + 4, 12, "#fff", "center");
      txt(c, p.t, 6, 0, 10, "#1a1a1a", "center");
      if (p.hp > 1) { c.fillStyle = "#fff"; c.fillRect(-p.hw + 4, p.hh - 5, 2 * p.hw - 8, 3); c.fillStyle = "#e65100"; c.fillRect(-p.hw + 4, p.hh - 5, (2 * p.hw - 8) * p.hp / 2, 3); }
    } else {
      var chain = p.k === "chain";
      c.fillStyle = chain ? "#8e24aa" : "#d32f2f"; rr(c, -p.hw, -p.hh, p.hw * 2, p.hh * 2, 7); c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 1.6; c.stroke();
      c.fillStyle = chain ? "#8e24aa" : "#d32f2f"; c.beginPath(); c.moveTo(p.hw - 8, -p.hh + 2); c.lineTo(p.hw + 7, 0); c.lineTo(p.hw - 8, p.hh - 2); c.fill();
      txt(c, p.t, 0, 1, 10, "#fff", "center");
      txt(c, chain ? "↪" : "FAKE", -p.hw + 9, -p.hh - 4, 8, "#ffeb3b", "left");
    }
    c.restore();
  }
  function drawPicks(c) {
    for (var i = 0; i < o.picks.length; i++) {
      var p = o.picks[i], bob = Math.sin(o.anim * 4 + p.ph) * 3, bad = p.k === "trap", ic = { agua: "💧", plateia: "👏", resposta: "📝", relogio: "⏱", trap: "🙈" }[p.k], lb = { agua: "ÁGUA", plateia: "PLATEIA", resposta: "RESPOSTA", relogio: "TEMPO", trap: "BAIXARIA" }[p.k];
      c.save(); c.globalAlpha = p.t < 2 ? .45 + .4 * Math.sin(o.anim * 14) : 1; c.translate(p.x, p.y + bob);
      c.fillStyle = bad ? "#b71c1c" : "#1565c0"; c.shadowColor = bad ? "#ff5252" : "#69f0ae"; c.shadowBlur = 14; c.beginPath(); c.arc(0, 0, 21, 0, TAU); c.fill(); c.shadowBlur = 0;
      c.strokeStyle = "#fff"; c.lineWidth = 2.5; c.stroke(); txt(c, ic, 0, 1, 22, "#fff", "center"); txt(c, lb, 0, 32, 9, bad ? "#ff8a80" : "#fff", "center", "rgba(0,0,0,.8)");
      c.restore();
    }
  }
  function drawShots(c) {
    for (var i = 0; i < o.shots.length; i++) {
      var p = o.shots[i];
      if (p.t) { var sw = p.t.length * 5.2 + 16; c.fillStyle = "#ffeb3b"; rr(c, p.x - 6, p.y - 9, sw, 18, 8); c.fill(); c.strokeStyle = "#111"; c.lineWidth = 1.5; c.stroke(); txt(c, p.t, p.x - 6 + sw / 2, p.y + 1, 9, "#1a1a1a", "center"); }
      else { c.fillStyle = "#fff176"; c.beginPath(); c.arc(p.x, p.y, 5, 0, TAU); c.fill(); }
    }
  }
  function drawFoeChar(c) {
    var f = o.fx, B = o.boss, big = B && !B.dead ? 1.28 : 1, wob = f.flinch > 0 ? Math.sin(o.anim * 70) * 4 : 0, y = f.y;
    // pódio
    c.fillStyle = flav ? "#7a1c28" : "#0f6b36"; rr(c, FOEX - 56 * big + wob, y + 30 * big, 112 * big, Math.max(20, 442 - (y + 30 * big)), 8); c.fill(); c.fillStyle = "rgba(255,255,255,.18)"; c.fillRect(FOEX - 56 * big + wob, y + 30 * big, 112 * big, 5);
    var w = 112 * big, h = 118 * big, tk = f.atk < .35 || f.flinch > 0 ? Math.abs(Math.sin(o.anim * 13)) : 0;
    portraitCard(c, foeKind, FOEX - w / 2 + wob, y - h / 2 - 6, w, h, { r: 12, lw: 3, cy: .46, talk: tk });
    if (B && !B.dead) { c.save(); c.globalAlpha = .25 + .15 * Math.sin(o.anim * 9); c.strokeStyle = "#ff5252"; c.lineWidth = 6; rr(c, FOEX - w / 2 - 6 + wob, y - h / 2 - 12, w + 12, h + 12, 16); c.stroke(); c.restore(); }
    txt(c, CARI[foeKind].nome.split(" ")[0].toUpperCase(), FOEX + wob, y + h / 2 + 4, 11, "#fff", "center", "rgba(0,0,0,.7)");
  }
  function drawMed(c) {
    var m = o.med, x = m.x, y = 108, t = o.anim;
    c.fillStyle = "#1a2150"; rr(c, x - 40, y + 22, 80, 24, 6); c.fill();
    drawChar(c, "npc", x, y + 40, 1.15, { t: t, shirt: "#222a55", pants: "#222", skin: "#d9a67c", hair: "#666", moving: false });
    txt(c, "MEDIADOR", x, y + 56, 10, "#ffdf00", "center", "rgba(0,0,0,.7)");
    if (m.tk > 0 || m.cutT > 0) txt(c, m.cutT > 0 ? "✂ 🎙" : "❓", x + 34, y - 14, 22, "#fff", "center", "rgba(0,0,0,.6)");
  }
  function drawPlayer(c) {
    var blink = o.inv > 0 && Math.floor(o.anim * 18) % 2 === 0;
    c.save(); c.translate(o.px, o.py); if (blink) c.globalAlpha = .45;
    c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(0, 24, 22, 7, 0, 0, TAU); c.fill();
    c.fillStyle = flav ? "#0f6b36" : "#7a1c28"; rr(c, -17, 6, 34, 20, 5); c.fill(); c.fillStyle = "rgba(255,255,255,.2)"; c.fillRect(-17, 6, 34, 3);
    c.save(); c.translate(0, -8); c.scale(.46, .46); var tk = (o.cd > .12 ? 1 : 0) && Math.abs(Math.sin(o.anim * 20)); bust(c, meKind, {}); head(c, meKind, { talk: o.mute > 0 ? 0 : tk }); c.restore();
    if (o.mute > 0) txt(c, "🎙✖", 0, -50, 16, "#fff", "center", "rgba(0,0,0,.7)");
    c.restore();
    if (o.shield > 0) { c.save(); c.globalAlpha = .35 + .15 * Math.sin(o.anim * 10); c.strokeStyle = "#80d8ff"; c.lineWidth = 3; c.fillStyle = "rgba(128,216,255,.25)"; c.beginPath(); c.arc(o.px, o.py, 32, 0, TAU); c.fill(); c.stroke(); c.restore(); }
    if (S.t < 7) txt(c, "▼ você", o.px, o.py - 44, 11, "#fff", "center", "rgba(0,0,0,.7)");
  }
  function drawHud2(c) {
    var i;
    // credibilidade
    uiPanel(c, W - 250, 8, 240, 54);
    txt(c, "CREDIBILIDADE", W - 238, 21, 10, "#9aa0b4"); txt(c, Math.ceil(o.cred) + "%", W - 22, 21, 11, o.cred < 30 ? "#ff6b6b" : "#fff", "right");
    uiBar(c, W - 238, 30, 216, 12, o.cred / 100, o.cred < 30 ? "#ff5252" : o.cred < 60 ? "#ffa726" : "#66bb6a");
    var st = []; if (o.shield > 0) st.push("👏"); if (o.rapid > 0) st.push("📝"); if (o.slow > 0) st.push("⏱");
    if (st.length) txt(c, st.join(" "), W - 238, 52, 12, "#fff", "left");
    // lacração
    var ready = o.lac >= 100, bx = W / 2 - 170;
    uiPanel(c, bx - 8, 492, 356, 40, "rgba(4,8,24,.72)", ready ? "#ffdf00" : "rgba(255,255,255,.2)");
    txt(c, ready ? "LACRAÇÃO PRONTA! K / ⭐" : "LACRAÇÃO", bx + 4, 502, 10, ready ? (Math.floor(o.anim * 6) % 2 ? "#ffdf00" : "#fff") : "#9aa0b4");
    uiBar(c, bx + 4, 512, 332, 12, o.lac / 100, ready ? "#ffdf00" : "#ff8a65");
    // rodada / chefe
    if (o.boss && !o.boss.dead) {
      uiPanel(c, W / 2 - 200, 70, 400, 26, "rgba(40,10,16,.85)", "#ff5252");
      txt(c, "ADVERSÁRIO GIGANTE", W / 2 - 190, 83, 10, "#ffab91"); uiBar(c, W / 2 - 60, 77, 250, 12, o.boss.hp / o.boss.max, "#e53935");
    } else if (o.round) txt(c, "RODADA " + Math.min(3, o.round) + "/3 · " + (S.t < BOSS_T ? Math.ceil(BOSS_T - S.t) + "s p/ relâmpago" : ""), W / 2, 84, 11, "#9aa0b4", "center");
    if (o.banner > 0) {
      var a = clamp(Math.min(o.banner * 2, (3 - o.banner + .01) * 4, 1), 0, 1), lg = o.bannerS.length > 12;
      c.save(); c.globalAlpha = a; c.fillStyle = "rgba(0,0,0,.55)"; c.fillRect(0, 200, W, 74); txt(c, o.bannerS, W / 2, 236, lg ? 44 : 52, "#ffdf00", "center", "#000");
      if (o.boss && o.banner > 1) txt(c, "mire no adversário gigante e use a LACRAÇÃO!", W / 2, 266, 14, "#fff", "center", "#000"); c.restore();
    }
  }
  function draw(c) {
    bg(c); drawZones(c); drawMed(c); drawFoeChar(c); drawPicks(c);
    for (var i = 0; i < o.foes.length; i++) drawFoe(c, o.foes[i]);
    drawShots(c); drawPlayer(c); drawHud2(c);
    if (o.lac >= 100) { c.fillStyle = "rgba(255,223,0," + (.03 + .03 * Math.sin(o.anim * 10)) + ")"; c.fillRect(0, 0, W, H); }
  }

  /* ---------------- bot ---------------- */
  function bot(dt) {
    if (o.ended) return;
    o.bwait -= dt; o.bnoise -= dt;
    var tx = o.px, ty = o.py, mx = 0, my = 0, i, p, best = 1e9;
    // alvo vertical: alinhar com o adversário (ou com uma fake próxima para derrubá-la)
    var goalY = o.fx.y, goalX = 230;
    for (i = 0; i < o.foes.length; i++) { p = o.foes[i]; if (p.x > o.px + 30 && Math.abs(p.y - o.py) < 90 && p.x - o.px < best) { best = p.x - o.px; goalY = p.y; } }
    if (best > 900) goalY = o.fx.y;
    // pickups úteis
    for (i = 0; i < o.picks.length; i++) { p = o.picks[i]; if (p.k === "trap") continue; if (p.k === "agua" && o.cred > 70) continue; if (Math.hypot(p.x - o.px, p.y - o.py) < (p.k === "agua" && o.cred < 60 ? 330 : 190)) { goalX = p.x; goalY = p.y; break; } }
    mx = clamp((goalX - o.px) / 60, -1, 1) * .7; my = clamp((goalY - o.py) / 28, -1, 1);
    // desvio: acumula repulsão de projéteis que vão chegar perto
    var rx = 0, ry = 0;
    for (i = 0; i < o.foes.length; i++) {
      p = o.foes[i];
      var vx = p.vx * (o.slow > 0 ? .55 : 1), vy = p.vy * (o.slow > 0 ? .55 : 1), rel_x = o.px - p.x, rel_y = o.py - p.y, sp2 = vx * vx + vy * vy;
      var tt = sp2 > 1 ? clamp((rel_x * vx + rel_y * vy) / sp2, 0, .9) : 0, qx = p.x + vx * tt, qy = p.y + vy * tt;
      var cx = clamp(o.px, qx - p.hw, qx + p.hw), cy = clamp(o.py, qy - p.hh, qy + p.hh), dd = Math.hypot(o.px - cx, o.py - cy);
      if (dd < 46) { var l = Math.hypot(o.px - qx, o.py - qy) || 1, k = (46 - dd) / 46 * (1.2 - tt * .5); rx += (o.px - qx) / l * k * 2.2; ry += (o.py - qy) / l * k * 2.2; if (Math.abs(vx) < 20) rx += (o.px >= qx ? 1 : -1) * k; }
    }
    if (o.bnoise > 0) { rx *= .25; ry *= .25; }   // distração ocasional
    else if (RNG() < dt * .12) o.bnoise = rnd(.2, .4);
    // zonas de microfone
    for (i = 0; i < o.zones.length; i++) {
      var z = o.zones[i]; if (z.k !== "mic") continue;
      var zcx = z.x + z.w / 2, zcy = z.y + z.h / 2, dx = o.px - zcx, dy = o.py - zcy;
      if (Math.abs(dx) < z.w / 2 + 34 && Math.abs(dy) < z.h / 2 + 34) { var ll = Math.hypot(dx, dy) || 1; rx += dx / ll * 1.8; ry += dy / ll * 1.8; }
    }
    // linha da pergunta difícil que vai cair
    for (i = 0; i < o.zones.length; i++) { var q = o.zones[i]; if (q.k === "ask" && Math.abs(o.px - q.x) < 70) rx += (o.px >= q.x ? 1 : -1) * 1.2; }
    mx += rx; my += ry;
    if (o.px < P1_AX0 + 20) mx += .6; if (o.py < P1_AY0 + 14) my += .6; if (o.py > P1_AY1 - 14) my -= .6;
    var ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; }
    o.bmove = { x: mx, y: my };
    o.bfire = o.mute <= 0 && (o.boss ? Math.abs(o.py - o.fx.y) < 70 || best < 520 : true) && RNG() > .04;
    // lacração: quando pronta e há perigo (ou durante o chefe)
    if (o.lac >= 100 && (o.foes.length >= 4 || (o.boss && !o.boss.dead && o.boss.intro <= 0))) special();
  }

  return {
    intro: { sub: "23/10/2026 · esquive, rebata e lacre", foeLabel: "ADVERSÁRIO · " + CARI[foeKind].nome.toUpperCase(),
      lines: ["Desvie de 📰 fake news e ❓ perguntas difíceis (mediador) · rebata com memes.", "Mover: setas/WASD (ou joystick) · atirar: Espaço/J (ou botão 🎤) · LACRAÇÃO: K/⭐",
        "Cuidado com a zona 🎙✖ de microfone cortado e com a 🙈 baixaria.", "Rodada relâmpago: o adversário fica GIGANTE. Derrube-o antes do tempo acabar."] },
    arcade: { a: "🎤", b: "⭐" },
    info: function () { return { round: o.round, boss: o.boss ? Math.round(o.boss.hp) : null, bossDead: !!(o.boss && o.boss.dead), cred: Math.round(o.cred), lac: Math.round(o.lac), kills: o.kills, fired: o.fired, landed: o.landed, taken: o.taken, grazes: o.grazes, cuts: o.cuts, specials: o.specials, trap: o.trap, foes: o.foes.length, px: Math.round(o.px), py: Math.round(o.py) }; },
    update: update, draw: draw, bot: bot,
    act: function (k) { if (k === "b") special(); else if (k === "a" && !S.bot) fire(); },
    timeUp: function () {
      if (o.ended || S.over) return; o.ended = true;
      S.end(false, clamp(.2 + (o.boss ? .25 * (1 - o.boss.hp / o.boss.max) : 0), 0, .45), "Acabou o tempo de fala" + (o.boss ? " com o adversário ainda de pé" : "") + ". Mire no adversário na rodada relâmpago!", { failTitle: "Tempo Esgotado", voiceLose: flav ? "sistema" : "humilha" });
    }
  };
};
