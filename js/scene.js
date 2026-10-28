"use strict";
/* ================= framework de cenas (fases 1, 2, 3, 4, 6) + resultado + cartão de compartilhar ================= */

var SCN = null;          // cena ativa
var SCEN = {};           // SCEN[n] = function (S) -> { intro, update(dt), draw(c), key(code), tap(x,y), bot(dt), skip() }
var lastRun = null;      // { n, daily } para "jogar de novo"
var lastResult = null;

/* ---- ajudas de UI para as cenas ---- */
function inRect(x, y, r) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }
function uiButton(c, r, label, o) {
  o = o || {};
  c.save();
  var hot = o.hot, dis = o.dis;
  c.globalAlpha = dis ? .45 : 1;
  c.fillStyle = o.bg || (hot ? "#ffdf00" : "rgba(14,22,56,.92)"); rr(c, r.x, r.y, r.w, r.h, o.r == null ? 12 : o.r); c.fill();
  c.strokeStyle = o.bd || (hot ? "#fff" : "rgba(255,255,255,.4)"); c.lineWidth = hot ? 3 : 2; c.stroke();
  if (o.key) { c.fillStyle = hot ? "#1a1a1a" : "#ffdf00"; c.beginPath(); c.arc(r.x + 18, r.y + r.h / 2, 11, 0, TAU); c.fill(); txt(c, o.key, r.x + 18, r.y + r.h / 2 + 1, 13, hot ? "#ffdf00" : "#1a1a1a", "center"); }
  c.font = "bold " + (o.size || 15) + "px 'Trebuchet MS', Arial, sans-serif";
  var tx = r.x + (o.key ? 38 : 10), mw = r.w - (o.key ? 46 : 20), lines = wrap(c, label, mw), lh = (o.size || 15) + 3, y0 = r.y + r.h / 2 - (lines.length - 1) * lh / 2;
  c.fillStyle = o.col || (hot ? "#1a1a1a" : "#f4f1e8"); c.textAlign = o.key ? "left" : "center"; c.textBaseline = "middle";
  for (var i = 0; i < lines.length; i++) c.fillText(lines[i], o.key ? tx : r.x + r.w / 2, y0 + i * lh);
  c.restore();
}
function uiBar(c, x, y, w, h, frac, col, bg) {
  c.fillStyle = bg || "rgba(255,255,255,.14)"; rr(c, x, y, w, h, h / 2); c.fill();
  if (frac > 0) { c.fillStyle = col; rr(c, x, y, Math.max(h, w * clamp(frac, 0, 1)), h, h / 2); c.fill(); }
}
function uiPanel(c, x, y, w, h, bg, bd) { c.fillStyle = bg || "rgba(4,8,24,.72)"; rr(c, x, y, w, h, 12); c.fill(); c.strokeStyle = bd || "rgba(255,255,255,.18)"; c.lineWidth = 1.5; c.stroke(); }
function mini(c, kind, x, y, s, o) {   // cabeça de caricatura pequena com moldura redonda opcional
  c.save(); c.translate(x, y); c.scale(s, s); head(c, kind, o || {}); c.restore();
}

/* ---- ciclo de vida ---- */
function scoreMult(S) { return S.mult || 1; }
function startScene(n, o) {
  o = o || {};
  var camp = o.camp || META.camp || "flavio";
  if (!CAMPS[camp]) camp = "flavio";
  META.camp = camp;
  var seed = o.seed != null ? o.seed : (o.daily ? dailySeed() : null);
  RNG = o.daily || o.seed != null ? mulberry32((seed + n * 7919) >>> 0) : Math.random;
  stopVoices(); parts = []; pops = []; fx.shk = 0; fx.flash = 0; fx.slow = 0; fx.ts = 1; g = null;
  var S = { n: n, camp: camp, C: CAMPS[camp], P: PHASES[n], daily: !!o.daily, seed: seed, t: 0, st: "intro", introT: 0, score: 0, combo: 0, bestCombo: 0,
    mult: 1, lives: null, maxLives: 3, time: null, timeMax: null, toasts: [], over: false, won: null, perf: 0, grid: [], bot: !!o.bot, hudHide: false,
    censor: 0, meme: pick(MEMES).t, anim: 0 };
  S.add = function (v, x, y, col) { v = Math.round(v * (S.mult || 1)); S.score += v; if (x != null) popup("+" + v, x, y, col || "#ffdf00", 17); return v; };
  S.hit = function () { S.combo = 0; S.mult = 1; };
  S.up = function (x, y) { S.combo++; S.bestCombo = Math.max(S.bestCombo, S.combo); S.mult = 1 + Math.min(4, Math.floor(S.combo / 4)); if (S.combo > 0 && S.combo % 4 === 0) { popup("COMBO x" + S.mult, x == null ? W / 2 : x, y == null ? 150 : y, "#ff8a65", 22); sfx("medal"); } };
  S.toast = function (s, col, t) { S.toasts.push({ s: s, col: col || "#fff", t: t || 2.2 }); if (S.toasts.length > 3) S.toasts.shift(); };
  S.end = function (win, perf, line, extra) { finishScene(S, win, perf, line, extra); };
  S.o = SCEN[n](S);
  SCN = S; lastRun = { n: n, daily: !!o.daily, camp: camp, seed: o.seed };
  state.screen = "play"; state.running = true; state.over = false; state.won = null; state.paused = false; state.side = null; state.meme = S.meme;
  state.phase = n; state.score = 0; state.progress = 0;
  $("menu").classList.add("hidden"); $("map").classList.add("hidden"); $("result").classList.add("hidden");
  $("pause").textContent = "⏸"; $("pause").classList.add("on"); $("touch").classList.remove("on");
  state.runT = 0; chalHide(); sfx("select"); vox("phase-start", { prio: 3 });
  return S;
}
function leaveScene() { SCN = null; g = null; parts = []; pops = []; state.phase = 0; stopVoices(); $("pause").classList.remove("on"); }

function startPlaying(S) {
  if (S.st !== "intro") return;
  S.st = "play"; S.introT = 99; sfx("go");
  if (S.o.begin) S.o.begin();
}
function sceneUpdate(dt) {
  var S = SCN; if (!S) return;
  S.anim += dt;
  if (S.st === "intro") {
    S.introT += dt; if (S.introT > (S.bot ? 0.5 : 6)) startPlaying(S);
    updFx(dt); return;
  }
  for (var i = S.toasts.length - 1; i >= 0; i--) { S.toasts[i].t -= dt; if (S.toasts[i].t <= 0) S.toasts.splice(i, 1); }
  if (S.st === "play") {
    var d = dt * (fx.ts || 1);
    S.t += d;
    if (S.time != null) { S.time -= d; if (S.time <= 0) { S.time = 0; if (S.o.timeUp) S.o.timeUp(); } }
    if (S.bot && S.o.bot) S.o.bot(d);
    S.o.update(d);
    state.score = S.score;
  }
  updFx(dt);
}
function drawIntro(c, S) {
  var P = S.P, a = clamp(S.introT * 3, 0, 1), I = S.o.intro || {};
  c.save(); c.globalAlpha = a;
  c.fillStyle = "rgba(3,5,14,.88)"; c.fillRect(0, 0, W, H);
  txt(c, "FASE " + S.n + " / 6", W / 2, 70, 22, "#ffdf00", "center");
  txt(c, P.ic + " " + P.name.toUpperCase(), W / 2, 118, 40, "#fff", "center", "#000");
  txt(c, I.sub || P.sub, W / 2, 158, 17, "#cfd6f0", "center");
  // retratos
  var me = S.C.kind, foe = S.C.foe;
  if (I.me) me = I.me; if (I.foe) foe = I.foe;
  portraitCard(c, me, 96, 190, 130, 150, { r: 14, lw: 4, cy: .45 });
  portraitCard(c, foe, W - 226, 190, 130, 150, { r: 14, lw: 4, cy: .45 });
  txt(c, "VOCÊ · " + S.C.name.toUpperCase(), 161, 356, 12, "#ffdf00", "center");
  txt(c, I.foeLabel || "", W - 161, 356, 12, "#cfd6f0", "center");
  var lines = I.lines || [], y = 200;
  for (var i = 0; i < lines.length; i++) txt(c, lines[i], W / 2, y + i * 27, 16, i === 0 ? "#fff" : "#cfd6f0", "center");
  if (S.daily) txt(c, "📅 DESAFIO DIÁRIO " + dateKey(), W / 2, 395, 15, "#69f0ae", "center");
  var blink = Math.floor(S.anim * 2.4) % 2;
  if (blink || S.introT > 2) txt(c, "Toque na tela ou Enter/Espaço para começar", W / 2, 440, 18, "#ffdf00", "center");
  txt(c, "Sátira: tudo aqui é exagero.", W / 2, 478, 12, "#9aa0b4", "center");
  c.restore();
}
function drawSceneHUD(c, S) {
  var i;
  if (S.hudHide) { drawToasts(c, S); drawVoice(c); return; }
  panel(c, 10, 8, 232, 54);
  txt(c, "FASE " + S.n + " · " + S.P.name.split(" · ")[0].toUpperCase().slice(0, 16), 20, 21, 10, "#9aa0b4");
  txt(c, fmt(S.score), 20, 43, 24, S.censor > 0 ? "#222" : "#ffdf00");
  txt(c, "TOTAL " + fmt(campTotal(S.camp)), 232, 21, 10, "#9aa0b4", "right");
  if (S.mult > 1) txt(c, "x" + S.mult, 232, 44, 22, "#ff8a65", "right", "rgba(0,0,0,.6)");
  else if (S.combo > 1) txt(c, "combo " + S.combo, 232, 44, 12, "#ffccbc", "right");
  if (S.time != null) {
    panel(c, W / 2 - 70, 8, 140, 54);
    txt(c, "TEMPO", W / 2, 21, 10, "#9aa0b4", "center");
    var tl = Math.ceil(S.time); txt(c, Math.floor(tl / 60) + ":" + pad2(tl % 60), W / 2, 44, 28, S.time < 15 ? "#ff6b6b" : "#fff", "center");
  }
  if (S.lives != null) {
    panel(c, W - 170, 8, 160, 54);
    txt(c, S.livesLabel || "CHANCES", W - 20, 21, 10, "#9aa0b4", "right");
    for (i = 0; i < S.maxLives; i++) drawHeart(c, W - 148 + i * 30, 42, 11, i < S.lives ? "#ff3b4a" : "rgba(255,255,255,.18)");
  }
  drawToasts(c, S);
  drawVoice(c);
}
function drawToasts(c, S) {
  for (var i = 0; i < S.toasts.length; i++) { var to = S.toasts[i]; c.globalAlpha = clamp(to.t * 2, 0, 1); txt(c, to.s, W / 2, 84 + i * 24, 17, to.col, "center", "rgba(0,0,0,.75)"); }
  c.globalAlpha = 1;
}
function sceneDraw(c) {
  var S = SCN; if (!S) return;
  c.clearRect(0, 0, W, H);
  c.save();
  if (fx.shk > 0.2) c.translate(rnd(-fx.shk, fx.shk), rnd(-fx.shk, fx.shk));
  S.o.draw(c);
  drawParts(c); drawPops(c);
  c.restore();
  if (fx.flash > 0) { c.fillStyle = "rgba(" + fx.fcol + "," + (fx.flash * .5) + ")"; c.fillRect(0, 0, W, H); }
  if (S.st !== "intro") drawSceneHUD(c, S);
  if (S.o.overlay) S.o.overlay(c);
  if (S.st === "intro") drawIntro(c, S);
  if (state.paused) { c.fillStyle = "rgba(0,0,0,.55)"; c.fillRect(0, 0, W, H); txt(c, "PAUSADO", W / 2, 240, 64, "#fff", "center", "#000"); txt(c, "P ou ▶ para continuar", W / 2, 300, 20, "#ffdf00", "center", "#000"); }
  if (S.over) {
    c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(0, 0, W, H);
    txt(c, S.won ? "FASE CONCLUÍDA!" : "NÃO DEU!", W / 2, 250, 72, S.won ? "#69f0ae" : "#ff6b6b", "center", "#000");
  }
}
function sceneKey(code) {
  var S = SCN; if (!S || state.paused) return;
  if (S.st === "intro") { if (code === "Enter" || code === "Space" || code === "NumpadEnter") startPlaying(S); return; }
  if (S.st === "play" && S.o.key) S.o.key(code);
}
function sceneTap(x, y) {
  var S = SCN; if (!S || state.paused) return;
  if (S.st === "intro") { if (S.introT > .25) startPlaying(S); return; }
  if (S.st === "play" && S.o.tap) S.o.tap(x, y);
}

/* ---- fim de fase / resultado ---- */
var MEDAL_LABEL = { ouro: "Ouro", prata: "Prata", bronze: "Bronze" };
function finishScene(S, win, perf, line, extra) {
  if (S.over) return;
  extra = extra || {};
  perf = clamp(perf == null ? (win ? .7 : .2) : perf, 0, 1);
  if (win) S.score += Math.round(perf * 1500);
  S.over = true; S.won = !!win; S.perf = perf; S.st = "done"; state.over = true; state.won = !!win; state.screen = "over"; state.running = false;
  state.score = S.score;
  var medal = win ? medalFor(perf) : null, letter = letterForPerf(perf);
  var rec = recordPhase(S.camp, S.n, S.score, medal, win);
  if (S.daily) {
    var dk = dateKey(), prev = META.daily[dk];
    if (!prev || normScore(S.n, S.score) > prev.sc) META.daily[dk] = { n: S.n, sc: normScore(S.n, S.score), won: !!win, camp: S.camp, grid: S.grid.slice(0, 10).join("") };
    metaSave();
  }
  S.letter = letter; S.medal = medal;
  var titles = extra.titles || ["Pedra no Sapato", "Estagiário do Gabinete", "Assessor Raiz", "Articulador", "Craque da Pauta"];
  var title = win ? titles[Math.min(titles.length - 1, Math.floor(perf * titles.length))] : (extra.failTitle || "Quase lá");
  sfx(win ? "win" : "lose");
  vox(win ? "victory" : "gameover", { prio: 5 });
  showResult({ n: S.n, camp: S.camp, won: !!win, raw: S.score, sc: rec.sc, title: title, line: line || "", letter: letter, medal: medal, isNew: rec.isNew, prev: rec.prev,
    total: rec.total, grid: S.grid, daily: S.daily, meme: S.meme, bestCombo: S.bestCombo });
}

function medalsHTML(camp) {
  var h = "", m = META.medal[camp] || {};
  for (var n = 1; n <= 6; n++) h += "<span class='md " + (m[n] || "") + "' style='" + (m[n] ? "" : "background:rgba(255,255,255,.12);color:#778") + "'>" + n + "</span>";
  return h;
}
function showResult(r) {
  lastResult = r;
  var P = PHASES[r.n], rank = finalRank(r.total);
  r.finalRank = rank;
  $("r-title").textContent = (r.won ? r.title : r.title).toUpperCase();
  $("r-line").textContent = r.line;
  $("r-meme").textContent = (r.daily ? "📅 Desafio diário " + dateKey() + " · " : "") + "Fase " + r.n + " · " + P.name + (r.meme ? " — “" + r.meme + "”" : "");
  $("r-score").innerHTML = "<b>" + fmt(r.sc) + "</b> pontos · " + (r.won ? "<b>RANK " + r.letter + "</b>" + (r.medal ? " · medalha de " + r.medal : "") : "<b>tente de novo</b>") + "<br>TOTAL " + fmt(r.total) + " · " + rank.t;
  $("r-medals").innerHTML = "Medalhas por fase: " + medalsHTML(r.camp);
  $("r-new").style.display = r.isNew && r.won ? "block" : "none";
  $("r-hint").textContent = "";
  var f = P.fato;
  $("r-fato").innerHTML = "<b>📰 fato real</b> — " + f.t + " <a href='" + f.url + "' target='_blank' rel='noopener noreferrer'>" + f.url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 90) + "</a>";
  var hasNext = r.won && r.n < 6 && !r.daily;
  $("b-next").style.display = hasNext ? "" : "none";
  engageRun(r);   // placar, cargo, sequência, desafio; também monta o cartão
  $("touch").classList.remove("on"); $("pause").classList.remove("on");
  setTimeout(function () {
    if (state.screen === "over") { $("result").classList.remove("hidden"); if (hasNext) $("b-next").focus && $("b-next").focus({ preventScroll: true }); else $("b-again").focus && $("b-again").focus({ preventScroll: true }); }
  }, 1100);
}

function buildShareCard(r) {
  var c = document.createElement("canvas"); c.width = 1080; c.height = 1080; var x = c.getContext("2d"), i;
  var C = CAMPS[r.camp], gr = x.createLinearGradient(0, 0, 0, 1080);
  if (r.camp === "lula") { gr.addColorStop(0, "#2a0a12"); gr.addColorStop(1, "#6b1c2a"); } else { gr.addColorStop(0, "#06210f"); gr.addColorStop(1, "#1d4a2b"); }
  x.fillStyle = gr; x.fillRect(0, 0, 1080, 1080);
  var sr = mulberry32(r.n * 31 + 7);
  for (i = 0; i < 70; i++) { x.fillStyle = "rgba(255,255,255," + (.2 + sr() * .6) + ")"; x.fillRect(sr() * 1080, sr() * 420, 1 + sr() * 2, 1 + sr() * 2); }
  x.fillStyle = "#00a651"; x.fillRect(0, 0, 1080, 16); x.fillStyle = "#ffdf00"; x.fillRect(0, 16, 1080, 10); x.fillStyle = "#00a651"; x.fillRect(0, 1054, 1080, 26);
  txt(x, "BRASIL SPEEDRUN 2026", 540, 84, 62, "#ffdf00", "center", "#0a3a1c");
  txt(x, "FASE " + r.n + " · " + PHASES[r.n].name.toUpperCase() + " · " + C.name, 540, 134, 28, "#cfd6f0", "center");
  portraitCard(x, C.kind, 150, 170, 360, 330, { r: 24, lw: 6, cy: .46 });
  portraitCard(x, C.foe, 570, 170, 360, 330, { r: 24, lw: 6, cy: .46 });
  txt(x, "VS", 540, 335, 44, "#ffdf00", "center", "#000");
  txt(x, r.title.toUpperCase(), 540, 570, r.title.length > 16 ? 70 : 96, "#ffdf00", "center", "#000");
  txt(x, fmt(r.sc) + " pontos" + (r.won ? " · RANK " + r.letter : " · quase!") + (r.isNew && r.won ? "  ★ recorde" : ""), 540, 650, 46, "#fff", "center");
  // 6 medalhas
  var m = META.medal[r.camp] || {};
  for (i = 0; i < 6; i++) { var mx = 540 + (i - 2.5) * 100; if (m[i + 1]) { drawMedalDot(x, mx, 730, 34, m[i + 1]); txt(x, String(i + 1), mx, 731, 28, "#1a1a1a", "center"); } else { x.strokeStyle = "rgba(255,255,255,.28)"; x.lineWidth = 3; x.beginPath(); x.arc(mx, 730, 34, 0, TAU); x.stroke(); txt(x, String(i + 1), mx, 731, 26, "rgba(255,255,255,.35)", "center"); } }
  txt(x, "TOTAL " + fmt(r.total) + "  ·  " + (r.finalRank ? r.finalRank.t : finalRank(r.total).t).toUpperCase(), 540, 818, 36, "#69f0ae", "center");
  if (r.daily && r.grid && r.grid.length) {
    var gs = r.grid.slice(0, 10), gw = 44, gx0 = 540 - gs.length * gw / 2;
    txt(x, "📅 DESAFIO DIÁRIO " + dateKey(), 540, 884, 26, "#fff", "center");
    for (i = 0; i < gs.length; i++) { x.fillStyle = gs[i] === "g" ? "#43a047" : gs[i] === "y" ? "#f9a825" : "#e53935"; rr(x, gx0 + i * gw + 3, 904, gw - 6, gw - 6, 6); x.fill(); }
  } else {
    x.font = "bold 30px 'Trebuchet MS', Arial"; var ls = wrap(x, r.line || "", 920);
    for (i = 0; i < Math.min(2, ls.length); i++) txt(x, ls[i], 540, 890 + i * 38, 30, "#cfd6f0", "center");
  }
  var car = r.career || careerOf(PROFILE.cum), lbp = r.lb ? "  ·  #" + r.lb.position + " (top " + r.lb.top + "%)" : "";
  txt(x, car.t.toUpperCase() + "  ·  " + (r.side || campSide(r.camp)).toUpperCase() + lbp, 540, 982, 34, "#ffdf00", "center", "#000");
  txt(x, "Sátira. Personagens exageram fatos reais. Trechos de falas públicas usados como paródia.", 540, 1018, 21, "#f4f1e8", "center");
  state.cardURL = c.toDataURL("image/png");
  var b64 = state.cardURL.split(",")[1], bin = atob(b64), arr = new Uint8Array(bin.length);
  for (i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  state.cardBlob = new Blob([arr], { type: "image/png" });
}
function shareText(r) {
  var url = challengeURL(r), car = r.career || careerOf(PROFILE.cum), pos = r.lb ? " · #" + r.lb.position + " no placar" : "";
  var t = "Brasil Speedrun 2026 — Fase " + r.n + " " + PHASES[r.n].name + ": " + r.title + (r.won ? " (rank " + r.letter + ")" : "") + "! " + fmt(r.sc) + " pts" + pos + " · " + car.t + " (" + sideLabel(r.side || campSide(r.camp)) + ").";
  if (r.daily && r.grid && r.grid.length) { t = "📅 Brasil Speedrun 2026 · diário " + dateKey() + " · fase " + r.n + "\n" + r.grid.slice(0, 10).map(function (k) { return GRID_EMO[k] || "⬛"; }).join("") + "\n" + fmt(r.sc) + " pts" + pos + " — " + r.title + "."; }
  return t + " Duvido você passar!\n" + url;
}
function shareResult() {
  var r = lastResult; if (!r) return;
  var caption = shareText(r), file = null;
  try { file = new File([state.cardBlob], "brasil-speedrun-2026.png", { type: "image/png" }); } catch (e) {}
  if (file && navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
    navigator.share({ files: [file], title: "Brasil Speedrun 2026", text: caption }).catch(function () {});
    return;
  }
  if (navigator.share) { navigator.share({ title: "Brasil Speedrun 2026", text: caption }).catch(function () {}); return; }
  $("r-share2").classList.remove("hidden");   // sem Web Share: mostra WhatsApp / X / baixar imagem
  $("r-hint").textContent = "Escolha onde compartilhar:";
}

/* bot genérico: aguarda S.o.bot; utilitário para as cenas */
function botEvery(S, key, period, fn, dt) { S._b = S._b || {}; S._b[key] = (S._b[key] || 0) + dt; if (S._b[key] >= period) { S._b[key] = 0; fn(); } }
