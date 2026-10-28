"use strict";
/* ================= entrada, loop e API de teste ================= */
function togglePause() {
  if (state.screen !== "play") return;
  state.paused = !state.paused; $("pause").textContent = state.paused ? "▶" : "⏸";
  if (state.paused) vox("pause", { prio: 1 });
}
window.addEventListener("keydown", function (e) {
  keys[e.code] = true;
  if (/^(Arrow|Space)/.test(e.code)) e.preventDefault();
  if (e.repeat) return;
  if (e.code === "KeyM") { setMuted(!muted); return; }
  if (e.code === "KeyP" || e.code === "Escape") { togglePause(); return; }
  if (SCN) {
    if (e.code === "KeyR" && (state.screen === "play" || state.screen === "over")) { startScene(SCN.n, { camp: SCN.camp, daily: SCN.daily }); return; }
    sceneKey(e.code); return;
  }
  if (e.code === "KeyR" && state.side && (state.screen === "play" || state.screen === "over")) { if (state.screen === "over") vox("retry", { prio: 1 }); startP5(state.side); return; }
  if (e.code in POWERKEY && state.screen === "play" && !state.paused && g) powerIdx(POWERKEY[e.code]);
});
window.addEventListener("keyup", function (e) { keys[e.code] = false; });
window.addEventListener("blur", function () { keys = {}; });
cv.addEventListener("pointerdown", function (e) {
  if (!SCN) return;
  var b = cv.getBoundingClientRect(); sceneTap((e.clientX - b.left) * W / b.width, (e.clientY - b.top) * H / b.height);
});
cv.addEventListener("contextmenu", function (e) { e.preventDefault(); });
var pbPrevent = $("pbtns");   // (botões de poder já tratam o próprio toque)
pbEls.forEach(function (b) {
  var k = b.getAttribute("data-k"), idx = k === "S" ? 4 : "JKLI".indexOf(k);
  b.addEventListener("pointerdown", function (e) { e.preventDefault(); e.stopPropagation(); if (state.screen === "play" && !state.paused && g) powerIdx(idx); });
  b.addEventListener("contextmenu", function (e) { e.preventDefault(); });
});
window.addEventListener("resize", function () { if (!joy.active) joyIdle(); });

/* ---- loop ---- */
function update(dt) {
  voicePump(dt);
  if (state.screen === "play" && !state.paused) state.runT = (state.runT || 0) + dt;
  if (state.paused) return;
  if (SCN) { sceneUpdate(dt); return; }
  if (state.screen !== "play" || !g) { if (g) { g.anim += dt; updFx(dt); } return; }
  if (g.mode === "flavio") updFlavio(dt); else updMoraes(dt);
}
var menuT = 0, pbLast = [];
function updatePB() {
  if (!g || state.screen !== "play") return;
  var defs = g.mode === "flavio" ? FP : MPOW, i;
  for (i = 0; i < 5; i++) {
    var sp = i === 4, cdv = sp ? (g.sp >= 100 ? 0 : 1 - g.sp / 100) : clamp(g.cds[i] / defs[i].cd, 0, 1);
    var off = g.mode === "flavio" && g.xblock > 0, key = Math.round(cdv * 50) + (off ? 100 : 0) + (!sp && g.en < defs[i].cost ? 200 : 0);
    if (pbLast[i] === key) continue; pbLast[i] = key;
    pbEls[i].querySelector(".cd").style.height = Math.round(cdv * 100) + "%"; pbEls[i].classList.toggle("off", off || (!sp && g.en < defs[i].cost));
  }
}
function drawMenuBg() {
  menuT += 0.016;
  var gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#050918"); gr.addColorStop(1, "#1d2a6b"); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  for (var si = 0; si < 60; si++) { ctx.globalAlpha = .3 + .5 * Math.abs(Math.sin(menuT * 1.5 + si)); ctx.fillStyle = "#fff"; ctx.fillRect(hash(si) * W, hash(si + 7) * 300, 2, 2); }
  ctx.globalAlpha = 1;
}
function render() {
  if (SCN) { sceneDraw(ctx); return; }
  if (!g || state.screen === "menu" || state.screen === "map") { drawMenuBg(); return; }
  ctx.clearRect(0, 0, W, H);
  if (g.mode === "flavio") drawFlavioWorld(ctx); else drawMoraesWorld(ctx);
  drawHUD(ctx);
  drawTrans(ctx);
  updatePB();
  if (state.paused) { ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(0, 0, W, H); txt(ctx, "PAUSADO", W / 2, 240, 64, "#fff", "center", "#000"); txt(ctx, "P ou ▶ para continuar", W / 2, 300, 20, "#ffdf00", "center", "#000"); }
  if (state.over) {
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(0, 0, W, H);
    if (!state.won) { ctx.save(); ctx.translate(W / 2, 260); ctx.rotate(-0.1); ctx.strokeStyle = "#e53935"; ctx.lineWidth = 8; ctx.strokeRect(-190, -50, 380, 100);
      txt(ctx, state.side === "flavio" ? (g.why === "tempo" ? "23h00!" : "PEGO!") : "SUMIU!", 0, 0, 72, "#e53935", "center"); ctx.restore(); }
    else txt(ctx, state.side === "flavio" ? "EMBARCOU!" : "ACHEI!", W / 2, 260, 84, "#69f0ae", "center", "#000");
  }
}
var last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  var dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (portraitMQ.matches) return;
  update(dt); render();
}
requestAnimationFrame(frame);
menuIcons(); refreshMenu();
$("gallery").addEventListener("click", function () { $("gallery").classList.add("hidden"); });
if (META.camp) { /* volta ao mapa só quando o jogador clicar; menu inicial sempre mostra os dois lados */ }

/* ---- API de teste ---- */
function snapshot() {
  var side = state.side, fl = g && g.mode === "flavio", b = fl && g.boss ? g.boss : null;
  var sc = SCN ? { n: SCN.n, st: SCN.st, camp: SCN.camp, score: SCN.score, lives: SCN.lives, time: SCN.time == null ? null : Math.round(SCN.time * 10) / 10, t: Math.round(SCN.t * 10) / 10,
    over: SCN.over, won: SCN.won, perf: SCN.perf, combo: SCN.combo, medal: SCN.medal, daily: SCN.daily, info: SCN.o.info ? SCN.o.info() : null } : null;
  return {
    mode: side, side: side, screen: state.screen, phase: SCN ? SCN.n : state.phase || 0, scene: sc, camp: META.camp,
    running: state.running, over: state.over, won: state.won, paused: state.paused,
    stage: g ? (fl ? g.stage + 1 : g.round + 1) : 0, stageName: g ? (fl ? STAGES[g.stage].name : ROUNDS[g.round].name) : "",
    score: state.score, rank: state.over ? state.rank : (g ? liveRank() : ""), rankLetter: state.over ? state.rankLetter : (side ? letterFor(side, state.score) : ""),
    hearts: g && fl ? g.hearts : null, lives: g ? g.lives : (SCN ? SCN.lives : null), energy: g ? Math.round(g.en) : null, special: g ? Math.round(g.sp) : null,
    combo: g ? g.combo : 0, mult: g ? g.mult : 1, progress: state.progress, timeLeft: Math.round(state.timeLeft * 10) / 10,
    boss: b ? { name: b.name, hp: Math.round(b.hp), active: b.intro <= 0 && !b.dead, dead: !!b.dead } : null,
    xblock: fl && g ? g.xblock > 0 : (g ? g.fBlock > 0 : false), shield: g ? (fl ? g.shield > 0 : g.f.shield > 0) : false, disguise: g ? (fl ? g.disg > 0 : g.f.disg > 0) : false,
    transition: g && g.trans ? g.trans.k : null, checkpoint: fl && g ? g.cp.px : null,
    medals: g ? g.medals.map(function (m) { return { stage: m.stage, medal: m.medal }; }) : [], muted: muted, voices: voice.log.length, voiceEvents: JSON.parse(JSON.stringify(voice.ev)), title: state.title, line: state.line
  };
}
function ensureGame(mode) { if (SCN) return; if (!g || state.screen !== "play") startP5(mode || state.side || "flavio"); }
function drawGallery() {
  var x = $("gal").getContext("2d"), i, k, cw = 190, ch = 215, col, row;
  var gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#050918"); gr.addColorStop(1, "#1d2a6b"); x.fillStyle = gr; x.fillRect(0, 0, W, H);
  txt(x, "GALERIA DE CARICATURAS", W / 2, 20, 20, "#ffdf00", "center");
  for (i = 0; i < CARI_ORDER.length; i++) {
    k = CARI_ORDER[i]; col = i % 4; row = (i / 4) | 0;
    var px = 30 + col * (cw + 30), py = 44 + row * (ch + 40);
    portraitCard(x, k, px, py, cw, ch, { name: true, talk: 0 });
    txt(x, CARI[k].tag, px + cw / 2, py + ch + 14, 13, "#cfd6f0", "center");
  }
  var fx0 = 30 + 3 * (cw + 30);
  ["flavio", "moraes", "nikolas"].forEach(function (kk, j) { drawChar(x, kk, fx0 + 32 + j * 62, 44 + (ch + 40) + 150, 1.0, { t: .3 }); });
  txt(x, "em campo", fx0 + cw / 2, 44 + (ch + 40) + 175, 13, "#cfd6f0", "center");
}
function stepN(sec, noRender) { var n = Math.max(1, Math.round(sec / 0.016)); for (var i = 0; i < n; i++) update(0.016); if (!noRender) render(); return snapshot(); }

window.__test = {
  /* ---- fluxo completo (v3) ---- */
  reset: function (nick) { metaReset(); profReset(nick === undefined ? "Tester" : nick); CHALLENGE = null; LB.online = null; $("lb").classList.add("hidden"); $("nick").classList.add("hidden"); showMenu(); return META; },
  /* ---- v3: placar / engajamento ---- */
  profile: function () { return JSON.parse(JSON.stringify(PROFILE)); },
  setProfile: function (o) { for (var k in o) PROFILE[k] = o[k]; profSave(); return this.profile(); },
  setBest: function (camp, n, v) { META.best[camp][n] = v; metaSave(); return true; },
  lbState: function () { return { online: LB.online, nick: PROFILE.nick, status: ($("lb-status").textContent || $("map-lbstatus").textContent || "") }; },
  openLB: function (tab, phase) { showLB(tab, phase); return true; },
  engage: function () { var r = lastResult; return r ? { won: r.won, sc: r.sc, record: r.engage.record, first: r.engage.first, rankUp: r.engage.rankUp, near: r.engage.near, peak: r.engage.peak, career: r.career && r.career.t, lb: r.lb ? { position: r.lb.position, total: r.lb.total, top: r.lb.top, gap: r.lb.gap, next: r.lb.next, online: r.lb.online } : null, shareUrl: challengeURL(r), shareText: shareText(r) } : null; },
  shareCard: function () { return { len: state.cardURL ? state.cardURL.length : 0, w: 1080, h: 1080 }; },
  selectSide: function (camp) { pickCamp(camp === "lula" || camp === "esquerda" ? "lula" : "flavio"); return snapshot(); },
  openMap: function () { showMap(); return this.map(); },
  map: function () {
    var camp = META.camp; if (!camp) return null;
    var nodes = []; for (var n = 1; n <= 6; n++) nodes.push({ n: n, name: PHASES[n].name, unlocked: isUnlocked(camp, n), medal: META.medal[camp][n] || null, best: META.best[camp][n] || 0 });
    return { camp: camp, unlocked: META.unlocked[camp], total: campTotal(camp), rank: finalRank(campTotal(camp)).t, nodes: nodes, done: META.done, p5role: p5Role() };
  },
  meta: function () { return JSON.parse(JSON.stringify(META)); },
  unlockAll: function () { for (var k in CAMPS) META.unlocked[k] = 6; metaSave(); return META.unlocked; },
  startPhase: function (n, o) { n = clamp(Math.round(+n || 1), 1, 6); o = o || {}; if (!META.camp) META.camp = o.camp || "flavio"; if (o.camp) META.camp = o.camp; launchPhase(n, o); return snapshot(); },
  startDaily: function () { launchDaily(); return snapshot(); },
  dailyInfo: function () { return { key: dateKey(), seed: dailySeed(), phase: dailyPhase(), saved: META.daily[dateKey()] || null }; },
  completePhase: function (win) {
    win = win !== false;
    if (SCN) { if (SCN.st === "intro") startPlaying(SCN); SCN.end(win, win ? .9 : .2, win ? "Fase concluída (teste)." : "Derrota (teste)."); return snapshot(); }
    ensureGame(); return this.finish(win);
  },
  bot: function (on) { if (SCN) SCN.bot = on !== false; return SCN ? SCN.bot : false; },
  scene: function () { return snapshot().scene; },
  tap: function (x, y) { sceneTap(x, y); return snapshot(); },
  key: function (code) { if (SCN) sceneKey(code); else keys[code] = true; return snapshot(); },
  hold: function (code, on) { keys[code] = on !== false; return true; },
  skipIntro: function () { if (SCN && SCN.st === "intro") startPlaying(SCN); return snapshot(); },
  /* ---- fase 5 (v2) ---- */
  gallery: function (on) { var el = $("gallery"); if (on === false) { el.classList.add("hidden"); return false; } drawGallery(); el.classList.remove("hidden"); return CARI_ORDER.slice(); },
  cameo: function () { ensureGame("flavio"); if (g.mode !== "flavio") return null; g.cameo = { t: 0 }; return true; },
  start: function (mode) { if (!META.camp) META.camp = /mor/i.test(mode) ? "lula" : "flavio"; startP5(mode); return snapshot(); },
  state: snapshot,
  gotoStage: function (n) {
    ensureGame(); n = clamp(Math.round(+n || 1), 1, 4);
    if (g.mode === "flavio") { beginStage(n - 1); g.trans = null; } else { beginRound(n - 1); g.trans = null; }
    return snapshot();
  },
  skipStage: function () {
    ensureGame();
    if (g.trans && g.trans.k === "medal") { g.trans.t = g.trans.dur; if (g.mode === "flavio") updTrans(0); else updMoraes(0); return snapshot(); }
    if (g.trans) g.trans = null;
    if (g.mode === "flavio") {
      if (g.finish) return snapshot();
      if (g.stage >= 3) { var mm = calcMedal(false); g.medals.push(mm); g.pts += 500; endGame(true, "jato"); } else clearStage(false, true);
      g.trans = null;
    } else {
      var R = ROUNDS[g.round]; g.medals.push({ stage: g.round + 1, name: R.name, medal: "prata", perf: 50, time: Math.round(R.limit - g.rt), pts: 500, killed: false }); g.pts += 500;
      if (g.round >= 3) endGame(true, "pegou"); else { beginRound(g.round + 1); g.trans = null; }
    }
    return snapshot();
  },
  usePower: function (name) { ensureGame(); var k = String(name == null ? "" : name).toLowerCase();
    var fl = g.mode === "flavio", F = { arminha: 1, biblia: 1, bíblia: 1, cartaz: 1, bone: 1, boné: 1, trump: 1, "ligar pro trump": 1 }, M = { canetada: 1, toga: 1, bloqueio: 1, "bloqueio do x": 1, inquerito: 1, inquérito: 1, oficio: 1, ofício: 1, "ofício urgente": 1 };
    if ((fl && k in M) || (!fl && k in F)) return { ok: false, reason: "wrong-mode" };
    return usePower(name); },
  finish: function (win) { ensureGame(); endGame(!!win, win ? (g.mode === "flavio" ? "jato" : "pegou") : (g.mode === "flavio" ? "pf" : "tempo")); return snapshot(); },
  voiceStats: function () { return { count: voice.count, byEvent: JSON.parse(JSON.stringify(voice.ev)), clips: Object.keys(CLIPS).length, loaded: voice.loaded, tagged: Object.keys(CLIPS).filter(function (k) { return CLIPS[k].events.length > 1; }).length }; },
  voice: function (ev, prio) { return vox(ev, { prio: prio == null ? 3 : prio }); },
  voiceLog: function () { return voice.log.map(function (e) { return { id: e.id, file: e.file, character: e.character, transcript: e.transcript, event: e.event, muted: e.muted, ok: e.ok, t: e.t }; }); },
  step: stepN,
  setInput: function (x, y) { injected = (x == null) ? null : { x: x, y: y || 0 }; },
  god: function (on) { ensureGame(); if (g) g.god = on !== false; return g ? g.god : false; },
  mute: function (on) { setMuted(on !== false); return muted; },
  world: function () { return SCN ? SCN : g; },
  get mapSize() { return { W: MP.W, H: MP.H }; }
};
window.__game = {
  state: state, start: startP5, get world() { return g; },
  set input(v) { injected = v; },
  step: function (sec) { stepN(sec); },
  end: endGame
};
