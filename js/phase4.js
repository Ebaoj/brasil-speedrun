"use strict";
/* ================= FASE 4 · Comemoração / A pauta do banheiro (ritmo) ================= */
var P4 = { LX: 288, LW: 96, HIT: 430, TOP: 78, TRAVEL: 1.45, DUR: 108, IM0: 46, ALARMS: 5 };
var P4_KEYS = { KeyD: 0, KeyF: 1, KeyJ: 2, KeyK: 3, ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3, Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 };
var P4_LANECOL = ["#ff5252", "#ffd600", "#00e676", "#448aff"];
var P4_BUBBLES = ["ALERTA!", "Vi um vulto!", "Cadê o perigo?!", "É a pauta!", "Tem alguém aí?!", "Eu senti!"];

function p4_laneX(i) { return P4.LX + P4.LW * i + P4.LW / 2; }

SCEN[4] = function (S) {
  var right = S.camp === "flavio", IM0 = P4.IM0, IM1;
  var bpm = rint(118, 126), beat = 60 / bpm, notes = [], ni = 0, i, t, lane, last = 1, lastT = [-9, -9, -9, -9];
  // ---- partitura gerada (semente) ----
  var alarms = [];
  for (i = 0; i < P4.ALARMS; i++) alarms.push({ t0: IM0 + 1.3 + i * 3.1, dur: 2.8, kind: i % 2 ? "campopiano" : "pavanato", txt: P4_BUBBLES[i % P4_BUBBLES.length], hit: false, done: false, ck: 0 });
  IM1 = alarms[P4.ALARMS - 1].t0 + alarms[P4.ALARMS - 1].dur + 1.3;
  var endNotes = P4.DUR - 4;
  function pushNote(tt, ln) { if (tt - lastT[ln] < .22) return; lastT[ln] = tt; notes.push({ t: tt, lane: ln, done: false, res: "" }); last = ln; }
  for (t = 3.2; t < endNotes; t += beat / 2) {
    if (t > IM0 - 2.0 && t < IM1 + 1.8) continue;
    var p = clamp(t / P4.DUR, 0, 1), onBeat = Math.abs((t - 3.2) / beat - Math.round((t - 3.2) / beat)) < .01;
    if (RNG() < (onBeat ? .62 + .28 * p : .08 + .45 * p)) {
      lane = RNG() < .55 ? clamp(last + (RNG() < .5 ? -1 : 1), 0, 3) : rint(0, 3);
      pushNote(t, lane);
      if (p > .25 && RNG() < .05 + .15 * p) { var l2 = (lane + rint(1, 3)) % 4; pushNote(t, l2); last = lane; }
    }
  }
  notes.sort(function (a, b) { return a.t - b.t; });
  var segEdges = [3, 24, IM0 - 2, IM1 + 1, 85, P4.DUR], seg = { hit: 0, n: 0, k: 0 };
  function segOf(tt) { return tt < 24 ? 0 : tt < IM0 ? 1 : tt < 85 ? 2 : 3; }
  var segAcc = [{ h: 0, n: 0 }, { h: 0, n: 0 }, { h: 0, n: 0 }, { h: 0, n: 0 }], segPushed = [false, false, false, false], bathPushed = false;
  notes.forEach(function (n) { segAcc[segOf(n.t)].n++; });

  S.time = P4.DUR; S.timeMax = P4.DUR;
  var st = { animo: 70, hype: 0, festa: 0, perfect: 0, good: 0, miss: 0, checks: 0, mash: 0, lf: [0, 0, 0, 0], jt: 0, jtx: "", jc: "#fff", pc: [], door: 0, fieldA: 1, missStreak: 0, wink: 0 };

  function judge(txtv, col) { st.jt = .55; st.jtx = txtv; st.jc = col; }
  function confetti(x, y, n) { for (var k = 0; k < n; k++) st.pc.push({ x: x, y: y, vx: (Math.random() - .5) * 220, vy: -60 - Math.random() * 200, col: pick(P4_LANECOL.concat(["#fff"])), r: 3 + Math.random() * 3, rot: Math.random() * 6, life: 2.4 }); }
  function vox(id, ev, pr) { say(id, ev, pr); }
  function comboVoice() {
    var c = S.combo;
    if (c === 12 || c === 40 || c === 80) vox(right ? "camp" : pick(["cara", "trouxa"]), "combo-" + c, 1);
  }
  function inIM(tt) { return tt >= IM0 - .6 && tt <= IM1 + .4; }
  function addHit(n, d) {
    n.done = true; var perfect = d <= .07;
    if (perfect) { st.perfect++; st.hype += 4; st.animo = Math.min(100, st.animo + 1.2); judge("PERFEITO!", "#ffe94d"); }
    else { st.good++; st.hype += 2; st.animo = Math.min(100, st.animo + .6); judge("BOM", "#69f0ae"); }
    segAcc[segOf(n.t)].h += perfect ? 1 : .65;
    var x = p4_laneX(n.lane);
    S.up(x, P4.HIT - 70); S.add((perfect ? 12 : 7) * (st.festa > 0 ? 2 : 1), x, P4.HIT - 36, perfect ? "#ffe94d" : "#69f0ae");
    burst(x, P4.HIT, P4_LANECOL[n.lane], perfect ? 14 : 7, 150, 120); ring(x, P4.HIT, P4_LANECOL[n.lane], 14); sfx(perfect ? "coin" : "pop");
    st.missStreak = 0; comboVoice();
    if (st.hype >= 100 && st.festa <= 0) { st.hype = 0; st.festa = 7; S.toast("FESTA! pontos em dobro", "#ffdf00", 2.2); confetti(W / 2, 200, 60); flashScr("255,223,0", .3); sfx("win"); }
    if (st.hype > 100) st.hype = 100;
  }
  function addMiss(n) {
    n.done = true; n.res = "x"; st.miss++; st.animo -= 7; st.hype = Math.max(0, st.hype - 22); S.hit(); st.missStreak++;
    judge("ERROU", "#ff6b6b"); sfx("nope"); shake(3);
    if (st.missStreak === 3 && !right) vox("humilha", "erros", 1);
  }
  function press(l) {
    if (S.st !== "play") return;
    st.lf[l] = .16;
    if (inIM(S.t)) { checkDoor(); return; }
    var best = null, tt = S.t;
    for (var k = ni; k < notes.length; k++) { var n = notes[k]; if (n.t > tt + .2) break; if (n.done || n.lane !== l) continue; if (Math.abs(n.t - tt) <= .16 && (!best || n.t < best.t)) best = n; }
    if (best) addHit(best, Math.abs(best.t - tt));
    else { st.animo -= 1.5; st.mash++; }
  }
  function checkDoor() {
    for (var k = 0; k < alarms.length; k++) { var a = alarms[k]; if (!a.hit && !a.done && S.t >= a.t0 + .35 && S.t <= a.t0 + a.dur) {
      a.hit = true; a.ck = 1.2; st.checks++; st.door = 1.0; S.add(60, W / 2, 330, "#69f0ae"); sfx("pop"); S.up(W / 2, 200); return; } }
  }

  return {
    intro: { sub: "Festa da vitória no ritmo · e uma pauta que nunca aparece",
      lines: [right ? "Aperte D F J K (ou toque nas pistas) no ritmo da comemoração." : "Aperte D F J K (ou toque nas pistas) no ritmo do 'L'.",
        "No meio da festa: A pauta do banheiro — verifique o alarme (toque/Espaço).",
        "Não deixe o ÂNIMO chegar a zero. Combos enchem o medidor de FESTA."],
      foe: right ? "pavanato" : "erika", foeLabel: right ? "NA FESTA: PAVANATO" : "NA TRIBUNA: ERIKA" },
    begin: function () { vox(right ? "batalhas" : "viva", "festa", 3); },
    key: function (code) {
      if (code in P4_KEYS) press(P4_KEYS[code]);
      else if ((code === "Space" || code === "Enter") && inIM(S.t)) checkDoor();
    },
    tap: function (x, y) {
      if (inIM(S.t)) { checkDoor(); return; }
      if (x < 200 || x > 760) return;
      press(clamp(Math.floor((x - P4.LX) / P4.LW), 0, 3));
    },
    bot: function (dt) {
      var tt = S.t, k;
      if (inIM(tt)) { for (k = 0; k < alarms.length; k++) if (!alarms[k].hit && tt > alarms[k].t0 + .7) checkDoor(); return; }
      for (k = ni; k < notes.length; k++) {
        var n = notes[k]; if (n.t > tt + .1) break; if (n.done) continue;
        if (!n._d) n._d = (RNG() < .06) ? 9 : (RNG() - .5) * .08;
        if (n._d < 5 && tt >= n.t + n._d) { st.lf[n.lane] = .16; addHit(n, Math.abs(n._d)); }
      }
    },
    update: function (dt) {
      var tt = S.t, k, n;
      while (ni < notes.length && notes[ni].done) ni++;
      for (k = ni; k < notes.length; k++) { n = notes[k]; if (n.t > tt) break; if (!n.done && n.t < tt - .16) addMiss(n); }
      for (k = 0; k < 4; k++) if (st.lf[k] > 0) st.lf[k] -= dt;
      if (st.jt > 0) st.jt -= dt;
      if (st.festa > 0) st.festa -= dt;
      if (st.door > 0) st.door -= dt;
      st.fieldA = tt < IM0 - 1.6 ? 1 : tt < IM0 - .6 ? 1 - (tt - (IM0 - 1.6)) : tt < IM1 ? 0 : clamp((tt - IM1) / 1.2, 0, 1);
      // pauta do banheiro
      if (tt > IM0 - 1 && !st.said) { st.said = true; vox("naoExistem", "banheiro", 3); }
      for (k = 0; k < alarms.length; k++) { var a = alarms[k]; if (a.ck > 0) a.ck -= dt; if (!a.done && tt > a.t0 + a.dur) { a.done = true; if (!a.hit) { a.ck = .01; } } }
      if (tt > IM1 - 1.0 && !bathPushed) { bathPushed = true; S.grid.push(st.checks >= 4 ? "g" : st.checks >= 2 ? "y" : "r"); st.wink = 4; }
      if (st.wink > 0) st.wink -= dt;
      for (k = 0; k < 4; k++) if (!segPushed[k] && tt > segEdges[k + 1] + (k === 1 ? 0 : 0) && (k !== 1 || tt > IM0 - 1.8) && (k !== 2 || tt > 85) && (k !== 3 || tt > P4.DUR - 3.3)) {
        segPushed[k] = true; var r = segAcc[k].n ? segAcc[k].h / segAcc[k].n : 1;
        if (k >= 2 && !bathPushed) { /* ordem: banheiro antes das seções 3-4 */ }
        S.grid.push(r >= .85 ? "g" : r >= .6 ? "y" : "r");
      }
      for (k = st.pc.length - 1; k >= 0; k--) { var q = st.pc[k]; q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 260 * dt; q.rot += dt * 6; if (q.life <= 0 || q.y > H + 10) st.pc.splice(k, 1); }
      if (st.festa > 0 && Math.random() < dt * 14) confetti(rnd(60, 900), 70, 2);
      if (S.t > 1 && Math.floor(S.t * 2) !== Math.floor((S.t - dt) * 2) && st.pc.length < 60 && Math.random() < .5) confetti(rnd(40, 920), 70, 1);
      if (st.animo <= 0) { st.animo = 0; this.lose(); return; }
    },
    lose: function () {
      var total = notes.length || 1, acc = (st.perfect + st.good * .6) / total;
      S.end(false, clamp(acc * .5, 0, .3), "O ânimo da festa acabou antes do fim da música. Até o confete pediu música nova.", { failTitle: "Festa Sem Clima", voiceLose: right ? "sistema" : "humilha" });
    },
    timeUp: function () {
      var total = notes.length || 1, acc = (st.perfect + st.good * .65) / total, perf = clamp(acc * .85 + (st.checks / P4.ALARMS) * .15, 0, 1);
      var line = (right ? "A festa da direita terminou" : "A noite do 'L' terminou") + " com " + st.perfect + " perfeitos, combo máximo " + S.bestCombo + " e " + st.checks + "/" + P4.ALARMS + " checagens no banheiro (vazio, de novo).";
      S.end(true, perf, line, { titles: ["Pé Frio", "Estagiário da Festa", "Animador de Palanque", "DJ da Vitória", "Rei do Comício"], voiceWin: right ? "camp" : "viva" });
    },
    info: function () { return { notes: notes.length, bpm: bpm, perfect: st.perfect, good: st.good, miss: st.miss, animo: Math.round(st.animo), hype: Math.round(st.hype), checks: st.checks, inBathroom: inIM(S.t), festa: st.festa > 0 }; },
    draw: function (c) {
      var tt = S.t, an = S.anim, k, x, y;
      // fundo
      var pal = right ? ["#052a14", "#0b5a2e", "#14306e"] : ["#2a0710", "#6b1020", "#3a0a4a"], beams = right ? ["#ffdf00", "#00e676", "#448aff"] : ["#ff5252", "#ffd600", "#f48fb1"];
      var gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, pal[0]); gr.addColorStop(.6, pal[1]); gr.addColorStop(1, pal[2]); c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.save(); c.globalCompositeOperation = "lighter";
      for (k = 0; k < 4; k++) {
        var bx = 120 + k * 240, ang = Math.sin(an * .9 + k * 1.7) * .45, ex = bx + Math.tan(ang) * 470, bg = c.createLinearGradient(bx, 0, ex, 470);
        bg.addColorStop(0, "rgba(255,255,255,.22)"); bg.addColorStop(1, "rgba(255,255,255,0)");
        c.fillStyle = bg; c.beginPath(); c.moveTo(bx - 8, 0); c.lineTo(bx + 8, 0); c.lineTo(ex + 90, 470); c.lineTo(ex - 90, 470); c.closePath(); c.fill();
        c.fillStyle = beams[k % 3]; c.globalAlpha = .12 + (st.festa > 0 ? .1 : 0); c.beginPath(); c.moveTo(bx - 8, 0); c.lineTo(bx + 8, 0); c.lineTo(ex + 90, 470); c.lineTo(ex - 90, 470); c.closePath(); c.fill(); c.globalAlpha = 1;
      }
      c.restore();
      c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(0, 470, W, 70);
      c.fillStyle = "rgba(255,255,255,.06)"; for (k = 0; k < 8; k++) c.fillRect(k * 130 + ((an * 30) % 130) - 130, 470, 60, 70);
      // balões
      for (k = 0; k < 12; k++) {
        var side = k < 6 ? 0 : 1, bxx = side ? 700 + hash(k) * 240 : 20 + hash(k) * 240, byy = 520 - ((an * (20 + hash(k + 3) * 22) + hash(k + 9) * 500) % 480), bc = right ? ["#ffdf00", "#00c853", "#2979ff"][k % 3] : ["#ff5252", "#fff", "#ff8a80"][k % 3];
        c.strokeStyle = "rgba(255,255,255,.4)"; c.lineWidth = 1; c.beginPath(); c.moveTo(bxx, byy + 22); c.quadraticCurveTo(bxx + 6, byy + 40, bxx, byy + 58); c.stroke();
        c.fillStyle = bc; c.beginPath(); c.ellipse(bxx, byy, 15, 19, 0, 0, TAU); c.fill(); c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.ellipse(bxx - 5, byy - 7, 4, 6, 0, 0, TAU); c.fill();
      }
      // personagens laterais
      var talking = voice.cur ? Math.abs(Math.sin(an * 13)) : 0, bob = Math.sin(an * Math.PI * 2 * bpm / 60 / 2) * 8;
      if (right) {
        portraitCard(c, "pavanato", 50, 235 + bob, 150, 175, { name: true, talk: voice.cur && voice.cur.who === "Lucas Pavanato" ? talking : 0, r: 14 });
        portraitCard(c, "campopiano", 760, 235 - bob, 150, 175, { name: true, talk: voice.cur && voice.cur.who === "Campopiano" ? talking : 0, r: 14 });
        txt(c, "🎉 FESTA DA VITÓRIA (sátira)", 835, 92, 12, "#ffe082", "center", "rgba(0,0,0,.6)");
      } else {
        portraitCard(c, "erika", 50, 235 + bob, 150, 175, { name: true, talk: voice.cur && voice.cur.who === "Erika Hilton" ? talking : 0, r: 14 });
        for (k = 0; k < 3; k++) p4_celeb(c, 745 + k * 70, 420 - (k === 1 ? 14 : 0), .95, k, an, bob);
        txt(c, "✊ NOITE DO “L” (sátira)", 835, 92, 12, "#ffcdd2", "center", "rgba(0,0,0,.6)");
        txt(c, "celebridades fazendo o L", 835, 452, 11, "#ffcdd2", "center", "rgba(0,0,0,.6)");
      }
      for (k = 0; k < st.pc.length; k++) { var q = st.pc[k]; c.save(); c.translate(q.x, q.y); c.rotate(q.rot); c.globalAlpha = clamp(q.life, 0, 1); c.fillStyle = q.col; c.fillRect(-q.r, -q.r / 2, q.r * 2, q.r); c.restore(); }
      // campo de ritmo
      var fa = st.fieldA;
      if (fa > 0.01) {
        c.save(); c.globalAlpha = fa;
        c.fillStyle = "rgba(4,6,20,.62)"; c.fillRect(P4.LX, P4.TOP - 6, P4.LW * 4, H - P4.TOP + 6);
        for (k = 0; k < 4; k++) {
          var lx = P4.LX + k * P4.LW, lg = c.createLinearGradient(0, P4.TOP, 0, P4.HIT + 40); lg.addColorStop(0, "rgba(255,255,255,0)"); lg.addColorStop(1, P4_LANECOL[k] + "44");
          c.fillStyle = lg; c.fillRect(lx + 2, P4.TOP, P4.LW - 4, P4.HIT + 40 - P4.TOP);
          if (st.lf[k] > 0) { c.fillStyle = P4_LANECOL[k] + "66"; c.fillRect(lx + 2, P4.TOP, P4.LW - 4, P4.HIT + 40 - P4.TOP); }
          c.strokeStyle = "rgba(255,255,255,.14)"; c.strokeRect(lx, P4.TOP - 6, P4.LW, H - P4.TOP + 6);
        }
        c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = 3; c.beginPath(); c.moveTo(P4.LX, P4.HIT); c.lineTo(P4.LX + 4 * P4.LW, P4.HIT); c.stroke();
        for (var ni2 = ni; ni2 < notes.length; ni2++) {
          var n = notes[ni2]; if (n.done) continue;
          var ny = P4.HIT - (n.t - tt) / P4.TRAVEL * (P4.HIT - P4.TOP); if (ny < P4.TOP - 24) break;
          var nx = p4_laneX(n.lane); c.save(); c.globalAlpha = fa * clamp((ny - P4.TOP) / 30, 0, 1);
          c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.arc(nx + 2, ny + 4, 28, 0, TAU); c.fill();
          c.fillStyle = P4_LANECOL[n.lane]; c.beginPath(); c.arc(nx, ny, 27, 0, TAU); c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 3; c.stroke();
          c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.arc(nx - 8, ny - 9, 8, 0, TAU); c.fill();
          txt(c, right ? ["🎉", "🎈", "🥳", "⭐"][n.lane] : "L", nx, ny + 1, right ? 24 : 28, right ? "#fff" : "#1a1a1a", "center"); c.restore();
        }
        for (k = 0; k < 4; k++) { var kx = p4_laneX(k), act = st.lf[k] > 0; uiButton(c, { x: kx - 40, y: 468, w: 80, h: 56 }, ["D", "F", "J", "K"][k], { hot: act, bg: act ? P4_LANECOL[k] : "rgba(14,22,56,.92)", bd: P4_LANECOL[k], size: 22, col: act ? "#1a1a1a" : "#fff" }); }
        c.restore();
        if (st.jt > 0) { c.save(); c.globalAlpha = clamp(st.jt * 3, 0, 1); txt(c, st.jtx, W / 2, 380 - (.55 - st.jt) * 30, 30, st.jc, "center", "rgba(0,0,0,.85)"); c.restore(); }
        if (S.combo > 3) txt(c, S.combo + " COMBO", W / 2, 140, 26 + Math.min(8, S.combo / 8), "#ffcc80", "center", "rgba(0,0,0,.8)");
        if (st.festa > 0) txt(c, "FESTA x2 " + st.festa.toFixed(1) + "s", W / 2, 166, 20, "#ffe94d", "center", "rgba(0,0,0,.8)");
      }
      // medidores
      uiPanel(c, W / 2 - 80, 68, 160, 50);
      txt(c, "ÂNIMO", W / 2 - 72, 80, 10, "#9aa0b4"); uiBar(c, W / 2 - 72, 88, 144, 9, st.animo / 100, st.animo < 30 ? "#ff5252" : "#69f0ae");
      txt(c, "FESTA", W / 2 - 72, 106, 10, "#9aa0b4"); uiBar(c, W / 2 - 34, 101, 106, 9, st.hype / 100, "#ffdf00");
      c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(0, H - 4, W, 4); c.fillStyle = "#ffdf00"; c.fillRect(0, H - 4, W * clamp(tt / P4.DUR, 0, 1), 4);
      if (!SCN || tt < IM0 - 1.6) { /* nada */ }
      if (tt > IM0 - 1.6 && fa < 1) p4_bathroom(c, S, st, alarms, IM0, IM1, tt, an);
    }
  };
};

function p4_celeb(c, x, y, s, k, an, bob) {   // silhueta genérica (sem rosto) fazendo o "L"
  var cols = ["#2d1b4e", "#3a1a2a", "#1b2f4e"], sw = Math.sin(an * 5 + k) * 5;
  c.save(); c.translate(x, y + (k % 2 ? bob : -bob) * .4); c.scale(s, s);
  c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.ellipse(0, 0, 26, 7, 0, 0, TAU); c.fill();
  c.fillStyle = cols[k]; rr(c, -17, -92, 34, 62, 12); c.fill(); c.fillRect(-14, -34, 10, 34); c.fillRect(4, -34, 10, 34);
  c.strokeStyle = cols[k]; c.lineWidth = 9; c.lineCap = "round"; c.beginPath(); c.moveTo(14, -84); c.lineTo(30 + sw * .5, -110); c.stroke(); c.beginPath(); c.moveTo(-14, -84); c.lineTo(-26, -64); c.stroke();
  c.fillStyle = cols[k]; c.beginPath(); c.arc(0, -108, 15, 0, TAU); c.fill();
  c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 2; c.beginPath(); c.arc(0, -108, 15, 0, TAU); c.stroke();
  txt(c, "L", 33 + sw * .5, -126, 30, "#ffdf00", "center", "rgba(0,0,0,.8)");
  c.fillStyle = "#ffdf00"; c.font = "bold 12px Arial"; c.textAlign = "center"; c.fillText("★", -6, -50);
  c.restore();
}

function p4_bathroom(c, S, st, alarms, IM0, IM1, tt, an) {
  var a0 = clamp((tt - (IM0 - 1.6)) / .8, 0, 1) * (1 - clamp((tt - (IM1 - .2)) / 1.0, 0, 1));
  if (a0 <= 0.01) return;
  c.save(); c.globalAlpha = a0;
  var x0 = 250, y0 = 152, w = 460, h = 318, k;
  c.fillStyle = "#cfe6ea"; rr(c, x0, y0, w, h, 16); c.fill();
  c.strokeStyle = "#7fa0a8"; c.lineWidth = 1; for (k = 1; k < 9; k++) { c.beginPath(); c.moveTo(x0 + k * w / 9, y0); c.lineTo(x0 + k * w / 9, y0 + h); c.stroke(); } for (k = 1; k < 7; k++) { c.beginPath(); c.moveTo(x0, y0 + k * h / 7); c.lineTo(x0 + w, y0 + k * h / 7); c.stroke(); }
  c.fillStyle = "#5c7d86"; c.fillRect(x0, y0 + h - 40, w, 40);
  c.fillStyle = "#1b3a46"; rr(c, W / 2 - 110, y0 + 8, 220, 28, 8); c.fill(); txt(c, "BANHEIRO · PAUTA DO DIA", W / 2, y0 + 23, 13, "#fff", "center");
  var openA = st.door > 0 ? clamp(Math.sin((1 - st.door) * Math.PI), 0, 1) : 0;
  for (k = 0; k < 3; k++) {
    var dx = x0 + 22 + k * 142, dw = 118, dy = y0 + 46, dh = 200, op = openA * clamp((openA * 3) - k * .5, 0, 1);
    c.fillStyle = "#2a3d44"; c.fillRect(dx, dy, dw, dh);
    c.fillStyle = "#e8eef0"; c.beginPath(); c.ellipse(dx + dw / 2, dy + dh - 60, 26, 14, 0, 0, TAU); c.fill(); c.fillRect(dx + dw / 2 - 18, dy + dh - 110, 36, 40);
    c.fillStyle = "#a8c4cc"; var dwid = dw * (1 - .82 * op); rr(c, dx, dy, dwid, dh, 3); c.fill(); c.strokeStyle = "#4d6b74"; c.lineWidth = 2; c.stroke();
    if (op < .3) { c.fillStyle = "#ef5350"; c.fillRect(dx + dw - 18, dy + 110, 8, 14); }
    if (op > .5) txt(c, "vazio", dx + dw / 2 + 8, dy + 60, 14, "#b0c4ca", "center");
  }
  txt(c, "🕸", x0 + w - 26, y0 + 58, 22, "#fff", "center");
  // políticos em alarme
  for (k = 0; k < alarms.length; k++) {
    var a = alarms[k], u = tt - a.t0; if (u < -.3 || u > a.dur + 1) continue;
    var fromL = k % 2 === 0, tx = fromL ? 300 : 660, sx = fromL ? -60 : W + 60, ent = ease(clamp(u / .7, 0, 1)), ext = ease(clamp((u - a.dur) / .8, 0, 1));
    var px = lerp(sx, tx, ent) + (fromL ? -1 : 1) * ext * 400, py = 392 + Math.abs(Math.sin(an * 14)) * (ent < 1 || ext > 0 ? -8 : -1);
    c.save(); c.translate(px, py); c.scale(.62, .62); bust(c, a.kind, {}); head(c, a.kind, { talk: a.hit || u < .7 ? 0 : Math.abs(Math.sin(an * 12)) * .6 }); c.restore();
    if (u > .3 && u < a.dur) {
      var live = !a.hit, txtb = a.hit ? "Ué... vazio." : a.txt;
      balloon(c, txtb, px, py - 70, { size: 14, maxW: 130, bg: live ? "#fff" : "#e8f5e9" });
      if (live && Math.floor(an * 6) % 2) { c.fillStyle = "rgba(255,40,40,.9)"; c.beginPath(); c.arc(px + 30, py - 120, 9, 0, TAU); c.fill(); }
      if (live) { var fr = clamp((u - .35) / (a.dur - .35), 0, 1); uiBar(c, px - 40, py + 18, 80, 7, 1 - fr, "#ffab40"); }
    }
  }
  txt(c, "Toque / Espaço no alarme para VERIFICAR  ·  " + st.checks + "/" + P4.ALARMS, W / 2, 492, 15, "#fff", "center", "rgba(0,0,0,.85)");
  if (st.door > .3 || st.wink > 0) { var msg = st.wink > 0 ? "Até o Renan Santos mandou recado. (fato real no fim da fase)" : "Ninguém. Pauta fixa, banheiro vazio."; uiPanel(c, W / 2 - 250, 122, 500, 26, "rgba(0,0,0,.7)"); txt(c, msg, W / 2, 135, 14, st.wink > 0 ? "#ffe082" : "#cfe8ff", "center"); }
  c.restore();
}
