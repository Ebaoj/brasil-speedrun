"use strict";
var W = 960, H = 540, TAU = Math.PI * 2;
var $ = function (id) { return document.getElementById(id); };
var cv = $("c"), ctx = cv.getContext("2d");
var RNG = Math.random;   // trocável: desafio diário usa semente
var rnd = function (a, b) { return a + RNG() * (b - a); };
var rint = function (a, b) { return Math.floor(rnd(a, b + 1)); };
var pick = function (a) { return a[Math.floor(RNG() * a.length)]; };
var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
var lerp = function (a, b, k) { return a + (b - a) * k; };
var pad2 = function (n) { return (n < 10 ? "0" : "") + n; };

/* ================= estado público ================= */
var state = { screen: "menu", side: null, running: false, over: false, won: null, score: 0, timeLeft: 0, paused: false,
  hearts: 3, progress: 0, meme: "", title: "", rank: "", rankLetter: "", best: { flavio: 0, moraes: 0 } };
try {
  state.best.flavio = +localStorage.getItem("brs26_best_flavio") || 0;
  state.best.moraes = +localStorage.getItem("brs26_best_moraes") || 0;
} catch (e) {}
function saveBest(side, v) { try { localStorage.setItem("brs26_best_" + side, String(v)); } catch (e) {} }

var MEMES = [
  { t: "Adeus pátria e família", s: "trilha de despedida dramática" },
  { t: "Cadê o Wally?", s: "procure o de gravata amarela" },
  { t: "Fuga das Galinhas", s: "corre que o galinheiro tá vigiado" },
  { t: "Esqueceram de Mim", s: "sozinho e cheio de armadilhas" }
];

/* ================= áudio: efeitos ================= */
var actx = null, muted = false;
function ac() {
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } }
  if (actx && actx.state === "suspended") { try { actx.resume().catch(function () {}); } catch (e) {} }
  return actx;
}
function tone(f, d, type, v, delay, f2) {
  var a = ac(); if (!a || muted) return;
  try {
    var t0 = a.currentTime + (delay || 0), o = a.createOscillator(), gn = a.createGain();
    o.type = type || "square"; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
    gn.gain.setValueAtTime(0.0001, t0); gn.gain.exponentialRampToValueAtTime(v || 0.07, t0 + 0.012);
    gn.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(gn); gn.connect(a.destination); o.start(t0); o.stop(t0 + d + 0.02);
  } catch (e) {}
}
function noise(d, v, delay, lp) {
  var a = ac(); if (!a || muted) return;
  try {
    var n = Math.floor(a.sampleRate * d), buf = a.createBuffer(1, n, a.sampleRate), data = buf.getChannelData(0);
    for (var i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = a.createBufferSource(), gn = a.createGain(), fl = a.createBiquadFilter();
    fl.type = "lowpass"; fl.frequency.value = lp || 1200; gn.gain.value = v || 0.2; s.buffer = buf;
    s.connect(fl); fl.connect(gn); gn.connect(a.destination); s.start(a.currentTime + (delay || 0));
  } catch (e) {}
}
function sfx(k) {
  voxSfx(k);
  switch (k) {
    case "coin": tone(880, .08, "square", .05); tone(1320, .12, "square", .05, .07); break;
    case "boost": tone(300, .25, "sawtooth", .06, 0, 900); break;
    case "hit": noise(.25, .35, 0, 700); tone(150, .22, "sawtooth", .09, 0, 60); break;
    case "stamp": noise(.18, .5, 0, 500); tone(90, .25, "square", .12, 0, 40); break;
    case "pop": tone(520, .07, "sine", .08, 0, 760); break;
    case "siren": tone(700, .16, "square", .03); tone(520, .16, "square", .03, .17); break;
    case "pen": noise(.2, .2, 0, 3000); tone(1000, .3, "triangle", .06, .05, 300); break;
    case "freeze": tone(1200, .4, "sine", .07, 0, 200); break;
    case "tick": tone(660, .09, "square", .05); break;
    case "go": tone(990, .3, "square", .07); break;
    case "win": [523, 659, 784, 1046].forEach(function (f, i) { tone(f, .22, "square", .06, i * .13); }); break;
    case "lose": [392, 349, 311, 233].forEach(function (f, i) { tone(f, .3, "sawtooth", .06, i * .2); }); break;
    case "select": tone(660, .08, "square", .05); tone(990, .1, "square", .05, .08); break;
    case "pow": tone(420, .12, "square", .05, 0, 840); break;
    case "shot": tone(1200, .08, "square", .04, 0, 400); break;
    case "shield": tone(300, .3, "triangle", .07, 0, 700); tone(900, .2, "sine", .04, .1); break;
    case "whoosh": noise(.3, .15, 0, 2500); break;
    case "laser": tone(1800, .35, "sawtooth", .05, 0, 200); break;
    case "alarm": tone(880, .12, "square", .04); tone(660, .12, "square", .04, .14); tone(880, .12, "square", .04, .28); break;
    case "nope": tone(180, .2, "sawtooth", .07, 0, 90); break;
    case "slow": tone(500, .35, "sine", .05, 0, 120); break;
    case "medal": [659, 784, 988, 1318].forEach(function (f, i) { tone(f, .16, "triangle", .07, i * .09); }); break;
    case "phone": tone(1400, .08, "square", .04); tone(1400, .08, "square", .04, .14); tone(1400, .08, "square", .04, .28); break;
    case "boom": noise(.5, .5, 0, 600); tone(70, .45, "sawtooth", .1, 0, 30); break;
    case "net": noise(.25, .18, 0, 1800); tone(240, .25, "triangle", .05, 0, 520); break;
    case "paper": noise(.18, .2, 0, 4500); break;
  }
}

/* ================= áudio: vozes (trechos de falas públicas, paródia) ================= */
// transcrições idênticas às do manifest.json; d = duração aproximada (s)
var VO = {
  nunca:  { f: "flavio_nunca_pensei_sair_do_pais", who: "Flávio Bolsonaro", tx: "Eu nunca pensei em sair do país.", d: 2.6 },
  sistema:{ f: "flavio_foi_o_sistema_que_ganhou", who: "Flávio Bolsonaro", tx: "Não fui eu que perdi, foi o sistema que ganhou.", d: 2.9 },
  passap: { f: "flavio_motivo_tirar_passaporte", who: "Flávio Bolsonaro", tx: "Eu nunca falei isso. Isso é motivo para tirar meu passaporte?", d: 3.8 },
  calar:  { f: "flavio_nao_vao_me_calar", who: "Flávio Bolsonaro", tx: "não vão me calar, não vão me intimidar", d: 2.9 },
  desistir:{ f: "flavio_nao_vou_desistir", who: "Flávio Bolsonaro", tx: "Eu não vou desistir do meu Brasil.", d: 2.4 },
  moraesPF:{ f: "moraes_quem_tem_medo_da_pf", who: "Alexandre de Moraes", tx: "Quem tem medo da Polícia Federal, presidente, quem tem medo da Polícia Federal?", d: 5.1 },
  mudar:  { f: "nikolas_mudar_o_brasil", who: "Nikolas Ferreira", tx: "Vamos juntos mudar o Brasil, para não ter que mudar do Brasil.", d: 4.4 },
  hoje:   { f: "nikolas_hoje_nao_companheiro", who: "Nikolas Ferreira", tx: "Hoje não, companheiro.", d: 1.6 },
  parou:  { f: "nikolas_parou_ta_tudo_errado", who: "Nikolas Ferreira", tx: "Parou, parou. Está tudo errado.", d: 1.6 },
  batalhas:{ f: "pavanato_primeira_de_muitas_batalhas", who: "Lucas Pavanato", tx: "senhoras e senhores, preparem-se, pois esta é apenas a primeira de muitas batalhas.", d: 6.8 },
  regular:{ f: "lula_vamos_ter_que_regular", who: "Lula", tx: "nós vamos ter que regulá-las", d: 3.3 },
  bola:   { f: "lula_bola_ate_agora_nao_caiu", who: "Lula", tx: "A bola até agora não caiu, gente.", d: 2.3 },
  marisa: { f: "lula_vou_com_a_marisa", who: "Lula", tx: "eu vou com a Marisa, numa jamanta com a Janja", d: 2.5 },
  cara:   { f: "erika_cara_de_pau", who: "Erika Hilton", tx: "é muito impressionante a cara de pau", d: 2.9 },
  trouxa: { f: "erika_nao_e_trouxa", who: "Erika Hilton", tx: "O trabalhador e a sociedade não é trouxa e vai mandar um recado na urna", d: 5.8 },
  humilha:{ f: "erika_isso_que_e_humilhante", who: "Erika Hilton", tx: "Isso que é humilhante", d: 1.7 },
  viva:   { f: "erika_viva_classe_trabalhadora", who: "Erika Hilton", tx: "Viva a classe trabalhadora brasileira, viva o presidente Lula", d: 5.5 },
  camp:   { f: "campopiano_debate_inflamado", who: "Campopiano", tx: "Esse debate está inflamado.", d: 1.8 },
  desculpaF:{ f: "flavio_desculpa_nove_dedos", who: "Flávio Bolsonaro", tx: "Eu peço desculpa pelo “nove dedos”.", d: 3.8 },
  crimeDig:{ f: "lula_crime_digital_vida_real", who: "Lula", tx: "O que é crime na vida real tem que ser crime no mundo digital.", d: 7 },
  ninedL: { f: "lula_ele_me_chamou_nove_dedos", who: "Lula", tx: "Ele me chamou de nove dedos.", d: 1.9 },
  pedirDesc:{ f: "lula_vai_ter_que_pedir_desculpa", who: "Lula", tx: "Vai ter que pedir desculpa.", d: 1.7 },
  n2222:  { f: "nikolas_meu_numero_2222", who: "Nikolas Ferreira", tx: "Meu número é 2222.", d: 3 },
  naoExistem:{ f: "pavanato_todos_nao_existem", who: "Lucas Pavanato", tx: "Todos eles não existem.", d: 4.6 }
};
var voice = { cur: null, q: null, log: [], audios: {}, broken: {}, clock: 0, lastEnd: -1e9, idleAt: 9000, recent: [], ev: {}, count: 0, loaded: false };   // clock = ms de jogo (avança com o update)
/* catálogo data-driven: nasce dos VO embutidos (fallback offline) e é enriquecido por audio/manifest.json
   (cada clipe: character, transcript, tags { side, phase[], events[] }) */
var CLIPS = {};
(function () { Object.keys(VO).forEach(function (k) { var v = VO[k]; CLIPS[v.f] = { id: v.f, f: v.f, who: v.who, tx: v.tx, d: v.d, side: "any", phase: [], events: ["idle"] }; }); })();
var VOICE_EVENTS = { hit: 1, powerup: 1, combo: 1, "boss-intro": 1, "near-miss": 1, gameover: 1, victory: 1, "phase-start": 1, idle: 1, pickup: 1, retry: 1, pause: 1, cameo: 1 };
function applyVoiceManifest(list) {
  if (!Array.isArray(list)) return;
  list.forEach(function (e) {
    if (!e || !e.id || !e.tags || /miliciano/i.test(JSON.stringify(e))) return;
    var c = CLIPS[e.id], leg = null;
    Object.keys(VO).forEach(function (k) { if (VO[k].f === e.id) leg = VO[k]; });
    if (!c) c = CLIPS[e.id] = { id: e.id, f: e.id, who: e.character, tx: e.transcript, d: e.duration || 3 };
    if (!leg) { c.who = e.character; c.tx = e.transcript; }
    if (e.duration) c.d = e.duration;
    c.side = e.tags.side || "any"; c.phase = e.tags.phase || []; c.events = e.tags.events || ["idle"];
  });
  voice.loaded = true;
}
(function () {   // carrega o manifest sem bloquear; se falhar (file://, offline) o catálogo embutido continua valendo
  try { fetch("audio/manifest.json").then(function (r) { return r.ok ? r.json() : null; }).then(applyVoiceManifest).catch(function () {}); } catch (e) {}
})();
function getAudio(id) {
  var a = voice.audios[id];
  if (a || voice.broken[id]) return a || null;
  try {
    a = new Audio(); a.preload = "none"; a.src = "audio/" + CLIPS[id].f + ".mp3"; a.volume = 0.95;
    a.addEventListener("error", function () { voice.broken[id] = true; });
    a.addEventListener("ended", function () { if (voice.cur && voice.cur.id === id) voice.cur.end = voice.clock + 150; });
    voice.audios[id] = a;
  } catch (e) { voice.broken[id] = true; a = null; }
  return a;
}
function warmVoices(ids) {   // pré-carga leve: só metadados, ocioso, nunca bloqueia
  var go = function () { ids.forEach(function (id) { var cid = VO[id] ? VO[id].f : id; if (!CLIPS[cid]) return; var a = getAudio(cid); if (a && a.preload === "none") { try { a.preload = "metadata"; a.load(); } catch (e) {} } }); };
  if (window.requestIdleCallback) window.requestIdleCallback(go, { timeout: 4000 }); else setTimeout(go, 1500);
}
function startVoice(cid, ev) {
  var v = CLIPS[cid], now = voice.clock;
  var entry = { id: cid, file: "audio/" + v.f + ".mp3", character: v.who, transcript: v.tx, event: ev, t: Math.round(now), muted: muted, ok: false };
  voice.log.push(entry); voice.count++; voice.ev[ev] = (voice.ev[ev] || 0) + 1;
  voice.recent.push(cid); if (voice.recent.length > 4) voice.recent.shift();
  voice.idleAt = now + 8000 + Math.random() * 4000;
  voice.cur = { id: cid, who: v.who, tx: v.tx, start: now, end: now + v.d * 1000 + 350, entry: entry };
  if (!muted) {
    try {
      var a = getAudio(cid);
      if (a) { try { a.currentTime = 0; } catch (e) {} var pr = a.play(); if (pr && pr.then) pr.then(function () { entry.ok = true; }, function () {}); }
    } catch (e) {}
  }
}
// nunca sobrepõe: se há fala em curso, guarda (fila de 1, expira) ou descarta
function playClip(cid, ev, prio) {
  var now = voice.clock; prio = prio || 0;
  if (voice.recent.length && voice.recent[voice.recent.length - 1] === cid && prio < 5) return false;   // nunca repete a fala anterior
  if (voice.cur && now < voice.cur.end) {
    if (prio > 0 && (!voice.q || prio > voice.q.prio)) voice.q = { id: cid, ev: ev, prio: prio, exp: now + 3500 };
    return false;
  }
  startVoice(cid, ev); return true;
}
function say(id, ev, prio) {   // fala específica (id legado de VO ou nome do arquivo)
  var cid = VO[id] ? VO[id].f : id;
  if (!CLIPS[cid]) return false;
  return playClip(cid, ev, prio);
}
function playerSide() { return META.camp === "lula" ? "esquerda" : META.camp === "flavio" ? "direita" : null; }
// escolhe um clipe pelas tags do evento: casa evento (+4), lado do jogador (+1.5), fase (+1.5); evita as últimas falas
function pickClip(ev) {
  var side = playerSide(), ph = state.phase || 0, pool = [], any = [], k, c, w;
  for (k in CLIPS) {
    c = CLIPS[k];
    if (ev === "victory" && side && c.side !== "any" && c.side !== side) continue;
    if (voice.recent.indexOf(k) >= 0) continue;
    w = 1 + (c.events.indexOf(ev) >= 0 ? 4 : 0) + (side && c.side === side ? 1.5 : 0) + (ph && c.phase.indexOf(ph) >= 0 ? 1.5 : 0);
    (c.events.indexOf(ev) >= 0 ? pool : any).push({ id: k, w: w });
  }
  if (pool.length < 2) pool = pool.concat(any.map(function (x) { return { id: x.id, w: x.w * .5 }; }));   // poucas falas no evento: completa com as outras
  if (!pool.length) return null;
  var tot = 0, i; for (i = 0; i < pool.length; i++) tot += pool[i].w;
  var r = Math.random() * tot; for (i = 0; i < pool.length; i++) { r -= pool[i].w; if (r <= 0) return pool[i].id; }
  return pool[pool.length - 1].id;
}
// vox: evento -> fala aleatória do manifest. p = chance; prio >= 3 ignora o cooldown (e enfileira se houver fala em curso)
function vox(ev, o) {
  o = o || {}; var prio = o.prio || 0, now = voice.clock;
  if (o.p != null && Math.random() > o.p) return false;
  if (prio < 3 && now - voice.lastEnd < 2500) return false;
  var cid = pickClip(ev); if (!cid) return false;
  return playClip(cid, ev, prio);
}
var VOX_SFX = { hit: ["hit", .6], boom: ["hit", .5], stamp: ["hit", .35], pow: ["powerup", .75], boost: ["powerup", .6], shield: ["near-miss", .6], medal: ["combo", .65], coin: ["pickup", .1] };
function voxSfx(k) { var m = VOX_SFX[k]; if (m) vox(m[0], { p: m[1] }); }
function voicePump(dt) {
  voice.clock += (dt || 0) * 1000;
  var now = voice.clock;
  if (voice.cur && now >= voice.cur.end) { voice.cur = null; voice.lastEnd = now; }
  if (!voice.cur && voice.q) { var q = voice.q; voice.q = null; if (now < q.exp) startVoice(q.id, q.ev); }
  else if (!voice.cur && now >= voice.idleAt && state.screen === "play" && !state.paused && !state.over) {   // provocação ociosa a cada ~8-12 s
    voice.idleAt = now + 1500; vox("idle");
  }
}
function stopVoices() { voice.cur = null; voice.q = null; voice.lastEnd = voice.clock; voice.idleAt = voice.clock + 8000 + Math.random() * 4000; Object.keys(voice.audios).forEach(function (k) { try { voice.audios[k].pause(); } catch (e) {} }); }
function setMuted(m) {
  muted = m; $("mute").textContent = muted ? "🔇" : "🔊";
  if (muted) Object.keys(voice.audios).forEach(function (k) { try { voice.audios[k].pause(); } catch (e) {} });
}
$("mute").addEventListener("click", function (e) { e.stopPropagation(); setMuted(!muted); });
$("mute").addEventListener("pointerdown", function (e) { e.stopPropagation(); });
$("pause").addEventListener("pointerdown", function (e) { e.stopPropagation(); });
$("pause").addEventListener("click", function (e) { e.stopPropagation(); togglePause(); });


/* entrada (teclado e toque) — handlers de teclado ficam em main.js */
var keys = {};
var portraitMQ = window.matchMedia("(orientation: portrait) and (pointer: coarse) and (max-width: 700px)");
var coarseMQ = window.matchMedia("(pointer: coarse)");
var POWERKEY = { KeyJ: 0, KeyK: 1, KeyL: 2, KeyI: 3, Space: 4 };
var touchEl = $("touch"), joyZone = $("joy-zone"), joyBase = $("joy-base"), joyKnob = $("joy-knob");
var joy = { active: false, x: 0, y: 0 }, joyPointer = null, joyCX = 0, joyCY = 0, joyR = 60;
function placeBase(x, y) { joyCX = x; joyCY = y; joyR = (joyBase.offsetWidth || 120) * 0.4; joyBase.style.left = x + "px"; joyBase.style.top = y + "px"; }
function setKnob(x, y) { joyKnob.style.transform = "translate(calc(-50% + " + x + "px), calc(-50% + " + y + "px))"; }
function joyIdle() { var b = touchEl.getBoundingClientRect(); placeBase((b.width || 600) * 0.17, (b.height || 340) * 0.66); setKnob(0, 0); }
function joyReset() { joyPointer = null; joy.active = false; joy.x = 0; joy.y = 0; joyBase.classList.remove("active"); joyIdle(); }
function joyFrom(e) {
  var b = touchEl.getBoundingClientRect(), px = e.clientX - b.left, py = e.clientY - b.top;
  var ox = px - joyCX, oy = py - joyCY, d = Math.hypot(ox, oy);
  if (d > joyR) { var k = (d - joyR) / d; placeBase(joyCX + ox * k, joyCY + oy * k); ox = px - joyCX; oy = py - joyCY; }
  setKnob(ox, oy); joy.x = ox / joyR; joy.y = oy / joyR;
}
joyZone.addEventListener("pointerdown", function (e) {
  e.preventDefault(); joyPointer = e.pointerId;
  try { joyZone.setPointerCapture(e.pointerId); } catch (err) {}
  var b = touchEl.getBoundingClientRect(); placeBase(e.clientX - b.left, e.clientY - b.top);
  joy.active = true; joyBase.classList.add("active"); joyFrom(e);
});
joyZone.addEventListener("pointermove", function (e) { if (e.pointerId === joyPointer) joyFrom(e); });
["pointerup", "pointercancel", "lostpointercapture"].forEach(function (t) {
  joyZone.addEventListener(t, function (e) { if (e.pointerId === joyPointer) joyReset(); });
});
joyZone.addEventListener("contextmenu", function (e) { e.preventDefault(); });
window.addEventListener("resize", function () { if (!joy.active) joyIdle(); });

var pbEls = Array.prototype.slice.call(document.querySelectorAll(".pb"));
pbEls.forEach(function (b) {
  var k = b.getAttribute("data-k"), idx = k === "S" ? 4 : "JKLI".indexOf(k);
  b.addEventListener("pointerdown", function (e) { e.preventDefault(); e.stopPropagation(); if (state.screen === "play" && !state.paused) powerIdx(idx); });
  b.addEventListener("contextmenu", function (e) { e.preventDefault(); });
});

function readInput() {
  var x = 0, y = 0;
  if (keys.ArrowLeft || keys.KeyA) x -= 1;
  if (keys.ArrowRight || keys.KeyD) x += 1;
  if (keys.ArrowUp || keys.KeyW) y -= 1;
  if (keys.ArrowDown || keys.KeyS) y += 1;
  if (x && y) { x *= 0.7071; y *= 0.7071; }
  if (joy.active) {
    var m = Math.hypot(joy.x, joy.y);
    if (m > 0.12) { var s = Math.min(1, (m - 0.12) / 0.6); x += joy.x / m * s; y += joy.y / m * s; }
  }
  var l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
  return { x: x, y: y };
}
var injected = null;   // testes automatizados: __game.input = {x,y}

/* ================= desenho: helpers ================= */
function rr(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function txt(c, s, x, y, size, col, align, stroke) {
  c.font = "bold " + size + "px 'Trebuchet MS', 'Segoe UI', Arial, sans-serif";
  c.textAlign = align || "left"; c.textBaseline = "middle";
  if (stroke) { c.lineWidth = Math.max(3, size / 4); c.strokeStyle = stroke; c.lineJoin = "round"; c.strokeText(s, x, y); }
  c.fillStyle = col || "#fff"; c.fillText(s, x, y);
}
function wrap(c, s, maxW) {
  var words = s.split(" "), lines = [], cur = "";
  for (var i = 0; i < words.length; i++) {
    var t = cur ? cur + " " + words[i] : words[i];
    if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = words[i]; } else cur = t;
  }
  if (cur) lines.push(cur); return lines;
}
function balloon(c, s, x, y, o) {   // (x,y) = ponta do rabinho
  o = o || {}; var size = o.size || 14, maxW = o.maxW || 150;
  c.font = "bold " + size + "px 'Trebuchet MS', Arial, sans-serif";
  var lines = wrap(c, s, maxW), w = 0, i;
  for (i = 0; i < lines.length; i++) w = Math.max(w, c.measureText(lines[i]).width);
  w += 18; var h = lines.length * (size + 3) + 10;
  var bx = clamp(x - w / 2, 4, (o.limitW || W) - w - 4), by = Math.max(4, y - 16 - h);
  c.save();
  c.globalAlpha = o.alpha == null ? 1 : o.alpha;
  c.fillStyle = o.bg || "#fff"; c.strokeStyle = "#111"; c.lineWidth = 2.5;
  rr(c, bx, by, w, h, 10); c.fill(); c.stroke();
  var tx = clamp(x, bx + 14, bx + w - 14);
  c.beginPath(); c.moveTo(tx - 7, by + h - 1); c.lineTo(x, y); c.lineTo(tx + 7, by + h - 1); c.closePath();
  c.fill(); c.stroke();
  c.fillStyle = o.bg || "#fff"; c.fillRect(tx - 6, by + h - 3, 12, 4);
  c.fillStyle = o.col || "#111"; c.textAlign = "center"; c.textBaseline = "middle";
  for (i = 0; i < lines.length; i++) c.fillText(lines[i], bx + w / 2, by + 5 + (size + 3) * (i + 0.5) + 1);
  c.restore();
}

/* ================= personagens (só formas) ================= */
function legs(c, sw, col, shoe) {
  c.fillStyle = col; c.fillRect(-8 + sw * 0.5, -17, 6, 17 - Math.max(0, -sw) * 0.5); c.fillRect(2 - sw * 0.5, -17, 6, 17 - Math.max(0, sw) * 0.5);
  c.fillStyle = shoe || "#111"; c.fillRect(-9 + sw * 0.5, -3, 8, 3); c.fillRect(1 - sw * 0.5, -3, 8, 3);
}
function arms(c, sw, col, hand, y) {
  y = y || -38; c.fillStyle = col; c.fillRect(-16, y + sw * 0.35, 5, 17); c.fillRect(11, y - sw * 0.35, 5, 17);
  c.fillStyle = hand; c.beginPath(); c.arc(-13.5, y + 18 + sw * 0.35, 2.8, 0, TAU); c.arc(13.5, y + 18 - sw * 0.35, 2.8, 0, TAU); c.fill();
}
function face(c, skin, eyeY, o) {
  o = o || {};
  c.fillStyle = skin; c.beginPath(); c.arc(0, -51, 12.5, 0, TAU); c.fill();                  // crânio
  c.beginPath(); c.ellipse(0, -45, o.jaw || 11, 8.5, 0, 0, TAU); c.fill();                     // mandíbula
  c.beginPath(); c.arc(-12.5, -50, 3, 0, TAU); c.arc(12.5, -50, 3, 0, TAU); c.fill();         // orelhas
  c.fillStyle = "#fff"; c.beginPath(); c.ellipse(-4.6, eyeY, 3, 3.3, 0, 0, TAU); c.ellipse(4.6, eyeY, 3, 3.3, 0, 0, TAU); c.fill();
  c.fillStyle = "#1b1212"; c.beginPath(); c.arc(-4.2, eyeY + .4, 1.5, 0, TAU); c.arc(5, eyeY + .4, 1.5, 0, TAU); c.fill();
}
/* ================= caricaturas: cabeças grandes, desenhadas só com formas ================= */
var SKIN = { moraes: "#d6a07a", lula: "#e3aa88", flavio: "#e8b48e", nikolas: "#f2c9a6", pavanato: "#e4b08c", campopiano: "#dbaa84", erika: "#9a6446" };
var CARI = {
  moraes:     { nome: "Alexandre de Moraes", tag: "Mestre da Canetada", bg: ["#27407d", "#0a1030"], fr: "#8fb4ff" },
  lula:       { nome: "Lula", tag: "Paz e Amor", bg: ["#8a1c24", "#2a0a10"], fr: "#ff8a80" },
  flavio:     { nome: "Flávio Bolsonaro", tag: "Fugitivo de Plantão", bg: ["#0f7a3e", "#06260f"], fr: "#ffdf00" },
  nikolas:    { nome: "Nikolas Ferreira", tag: "Rei do Topete", bg: ["#2f6fb0", "#0b1c3a"], fr: "#a8d0f0" },
  pavanato:   { nome: "Lucas Pavanato", tag: "Primeira Batalha", bg: ["#4a4f66", "#14161f"], fr: "#c9cde0" },
  campopiano: { nome: "Campopiano", tag: "Cameo da Fila", bg: ["#a87410", "#2e1e04"], fr: "#ffe082" },
  erika:      { nome: "Erika Hilton", tag: "Voz na Tribuna", bg: ["#8e2a6a", "#250a1c"], fr: "#f8bbd9" }
};
var WHOKIND = { "Alexandre de Moraes": "moraes", "Lula": "lula", "Flávio Bolsonaro": "flavio", "Nikolas Ferreira": "nikolas", "Lucas Pavanato": "pavanato", "Campopiano": "campopiano", "Erika Hilton": "erika" };
var CARI_ORDER = ["moraes", "lula", "flavio", "nikolas", "pavanato", "campopiano", "erika"];

function hbrow(c, x, y, w, th, ang, col) { c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = col; rr(c, -w / 2, -th / 2, w, th, th / 2); c.fill(); c.restore(); }
function hEyes(c, y, sp, rx, ry, o) {
  o = o || {}; var s, ex;
  for (s = -1; s <= 1; s += 2) {
    ex = s * sp;
    c.fillStyle = "#fff"; c.beginPath(); c.ellipse(ex, y, rx, ry, 0, 0, TAU); c.fill();
    c.strokeStyle = "rgba(40,20,10,.5)"; c.lineWidth = 1; c.stroke();
    c.fillStyle = o.iris || "#3a2414"; c.beginPath(); c.arc(ex + (o.look || 0), y + .6, ry * .7, 0, TAU); c.fill();
    c.fillStyle = "#0a0606"; c.beginPath(); c.arc(ex + (o.look || 0), y + .6, ry * .36, 0, TAU); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.arc(ex + (o.look || 0) - ry * .26, y - ry * .16, ry * .2, 0, TAU); c.fill();
    if (o.lid) {
      c.save(); c.beginPath(); c.ellipse(ex, y, rx, ry, 0, 0, TAU); c.clip();
      c.fillStyle = o.skin; c.fillRect(ex - rx - 1, y - ry - 1, 2 * rx + 2, 2 * ry * o.lid + 1); c.restore();
      c.strokeStyle = "rgba(50,25,15,.85)"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(ex - rx - .5, y - ry + 2 * ry * o.lid); c.lineTo(ex + rx + .5, y - ry + 2 * ry * o.lid); c.stroke();
    }
  }
}
function hMouth(c, y, w, curve, talk, col) {
  if (talk > .08) { c.fillStyle = "#5a1414"; c.beginPath(); c.ellipse(0, y + talk * 2.5, w * .6, 1.6 + talk * 5.5, 0, 0, TAU); c.fill(); c.fillStyle = "#e86a6a"; c.beginPath(); c.ellipse(0, y + talk * 5, w * .35, 1.5 + talk, 0, 0, TAU); c.fill(); return; }
  c.strokeStyle = col || "#6a2a20"; c.lineWidth = 2; c.lineCap = "round"; c.beginPath(); c.moveTo(-w, y); c.quadraticCurveTo(0, y + curve * 2, w, y); c.stroke();
}
function hGrin(c, y, w, depth, talk, lip) {   // sorriso aberto com dentes
  if (talk > .08) { hMouth(c, y + 1, w, 0, talk); return; }
  c.fillStyle = "#6b1818"; c.beginPath(); c.moveTo(-w, y); c.quadraticCurveTo(0, y + depth * 2, w, y); c.quadraticCurveTo(0, y + 2.4, -w, y); c.fill();
  c.fillStyle = "#fff"; c.beginPath(); c.moveTo(-w + 1, y + .3); c.quadraticCurveTo(0, y + depth * 1.45, w - 1, y + .3); c.quadraticCurveTo(0, y + 2.6, -w + 1, y + .3); c.fill();
  c.strokeStyle = lip || "rgba(90,30,20,.7)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-w, y); c.quadraticCurveTo(0, y + depth * 2, w, y); c.stroke();
}
function skull(c, skin, o) {
  o = o || {};
  c.fillStyle = skin;
  c.beginPath(); c.ellipse(0, -3, 26, 29, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(0, 9, o.jw || 22, o.jh || 22, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(-26, 3, 4.5, 7.5, 0, 0, TAU); c.ellipse(26, 3, 4.5, 7.5, 0, 0, TAU); c.fill();
  c.fillStyle = "rgba(120,50,30,.25)"; c.beginPath(); c.ellipse(-26, 3, 2, 4.5, 0, 0, TAU); c.ellipse(26, 3, 2, 4.5, 0, 0, TAU); c.fill();
  c.fillStyle = o.nose || "rgba(150,70,45,.3)"; c.beginPath(); c.ellipse(0, 6, o.nw || 5, o.nh || 4.5, 0, 0, TAU); c.fill();
  c.fillStyle = "rgba(60,20,10,.45)"; c.beginPath(); c.ellipse(-2.2, 8.4, 1.1, .8, 0, 0, TAU); c.ellipse(2.2, 8.4, 1.1, .8, 0, 0, TAU); c.fill();
}
function blush(c, a) { c.fillStyle = "rgba(235,90,80," + (a || .25) + ")"; c.beginPath(); c.ellipse(-15, 9, 5.5, 3.6, 0, 0, TAU); c.ellipse(15, 9, 5.5, 3.6, 0, 0, TAU); c.fill(); }

var HEAD = {
  moraes: function (c, o) {
    var sk = SKIN.moraes;
    skull(c, sk, { jw: 24, jh: 21, nw: 5.8, nh: 5 });
    c.fillStyle = "rgba(255,255,255,.4)"; c.beginPath(); c.ellipse(-9, -22, 9.5, 3.6, -.5, 0, TAU); c.fill();      // careca brilhante
    c.fillStyle = "#4a4440"; c.beginPath(); c.ellipse(-25.4, -3, 3, 9, 0, 0, TAU); c.ellipse(25.4, -3, 3, 9, 0, 0, TAU); c.fill();
    c.strokeStyle = "rgba(110,60,50,.5)"; c.lineWidth = 1.4; c.beginPath(); c.arc(-10, -1, 6.5, .3, Math.PI - .3); c.stroke(); c.beginPath(); c.arc(10, -1, 6.5, .3, Math.PI - .3); c.stroke();
    hEyes(c, -5, 10, 5.8, 4.6, { lid: .4, skin: sk });
    hbrow(c, -10.5, -14, 19, 7.4, .2, "#120c0a"); hbrow(c, 10.5, -14, 19, 7.4, -.2, "#120c0a");                // sobrancelhas grossas
    c.strokeStyle = "rgba(90,40,30,.55)"; c.lineWidth = 1.3; c.beginPath(); c.moveTo(-1.6, -12); c.lineTo(-1.2, -7.5); c.moveTo(1.6, -12); c.lineTo(1.2, -7.5); c.stroke();
    c.strokeStyle = "rgba(100,50,35,.35)"; c.beginPath(); c.moveTo(-10, 8); c.quadraticCurveTo(-12, 14, -9, 20); c.moveTo(10, 8); c.quadraticCurveTo(12, 14, 9, 20); c.stroke();
    hMouth(c, 19, 7.5, -1.3, o.talk, "#5a2a20");
    c.fillStyle = "rgba(120,60,40,.2)"; c.beginPath(); c.ellipse(0, 28, 8, 2.8, 0, 0, TAU); c.fill();
  },
  lula: function (c, o) {
    var sk = SKIN.lula, i;
    c.fillStyle = "#f2f1ec"; c.beginPath(); c.ellipse(-25, -8, 5, 13, 0, 0, TAU); c.ellipse(25, -8, 5, 13, 0, 0, TAU); c.fill();
    skull(c, sk, { jw: 23, jh: 21, nw: 7, nh: 5.8, nose: "rgba(200,90,70,.4)" });
    blush(c, .3);
    c.fillStyle = "#f4f3ee"; c.strokeStyle = "#c9c8c0"; c.lineWidth = 1.1;     // cabelo branco ralo
    c.beginPath(); c.moveTo(-26, -6); c.bezierCurveTo(-31, -30, -14, -38, 0, -37); c.bezierCurveTo(14, -38, 31, -30, 26, -6); c.bezierCurveTo(24, -18, 16, -24, 8, -24);
    c.bezierCurveTo(0, -27, -8, -24, -12, -23); c.bezierCurveTo(-20, -22, -24, -14, -26, -6); c.closePath(); c.fill(); c.stroke();
    hEyes(c, -5, 10, 5.2, 4.1, { iris: "#4a3020" });
    c.strokeStyle = "rgba(120,60,45,.55)"; c.lineWidth = 1.2; for (i = -1; i <= 1; i += 2) { c.beginPath(); c.arc(i * 10, -4, 6.4, .25, Math.PI - .25); c.stroke(); c.beginPath(); c.moveTo(i * 17, -6); c.lineTo(i * 21, -8.5); c.moveTo(i * 17, -3.5); c.lineTo(i * 21.5, -3.5); c.stroke(); }
    hbrow(c, -10.5, -13.5, 19, 7, .1, "#b9b9b1"); hbrow(c, -10.5, -13.8, 17.5, 5.6, .1, "#f3f2ee"); hbrow(c, 10.5, -13.5, 19, 7, -.1, "#b9b9b1"); hbrow(c, 10.5, -13.8, 17.5, 5.6, -.1, "#f3f2ee");
    c.fillStyle = "#f6f5f0"; c.strokeStyle = "#c9c8c0"; c.lineWidth = 1.2;      // barba branca
    c.beginPath(); c.moveTo(-25, 2); c.bezierCurveTo(-27, 24, -16, 41, 0, 41); c.bezierCurveTo(16, 41, 27, 24, 25, 2); c.bezierCurveTo(21, 10, 16, 11, 11, 11);
    c.quadraticCurveTo(5, 8, 0, 10); c.quadraticCurveTo(-5, 8, -11, 11); c.bezierCurveTo(-16, 11, -21, 10, -25, 2); c.closePath(); c.fill(); c.stroke();
    hGrin(c, 17, 9, 7, o.talk, "rgba(120,60,50,.0)");
  },
  flavio: function (c, o) {
    var sk = SKIN.flavio, i, x, y;
    skull(c, sk, { jw: 23, jh: 21 });
    c.save(); c.beginPath(); c.ellipse(0, 9, 22.6, 21.6, 0, 0, TAU); c.clip();   // barba por fazer
    c.fillStyle = "rgba(38,26,20,.4)"; c.beginPath(); c.moveTo(-26, 2); c.bezierCurveTo(-24, 22, -12, 34, 0, 34); c.bezierCurveTo(12, 34, 24, 22, 26, 2);
    c.bezierCurveTo(20, 12, 14, 12, 10, 13); c.quadraticCurveTo(0, 10, -10, 13); c.bezierCurveTo(-14, 12, -20, 12, -26, 2); c.fill();
    c.fillStyle = "rgba(20,14,10,.55)"; for (i = 0; i < 70; i++) { x = (hash(i) - .5) * 44; y = 8 + hash(i + 50) * 24; if (y > 13 || Math.abs(x) > 12) c.fillRect(x, y, 1.1, 1.1); }
    c.restore();
    c.fillStyle = o.hair || "#241610";
    c.beginPath(); c.moveTo(-27, -2); c.bezierCurveTo(-31, -30, -14, -38, 2, -37); c.bezierCurveTo(18, -38, 31, -28, 27, -2); c.lineTo(25, -9);
    c.bezierCurveTo(22, -20, 14, -24, 6, -24); c.bezierCurveTo(-4, -27, -14, -23, -21, -18); c.lineTo(-24, -4); c.closePath(); c.fill();
    c.fillStyle = "rgba(255,255,255,.12)"; c.beginPath(); c.ellipse(-6, -31, 9, 2.4, -.2, 0, TAU); c.fill();
    hEyes(c, -5, 10, 5.6, 4.9, { iris: "#4a2f1c" });
    hbrow(c, -10, -14, 15, 4.8, .1, "#241610"); hbrow(c, 10, -16.5, 15, 4.8, -.28, "#241610");      // uma sobrancelha levantada
    c.strokeStyle = "#6a2a1e"; c.lineWidth = 2; c.lineCap = "round";
    if (o.talk > .08) hMouth(c, 19, 8, 0, o.talk); else { c.beginPath(); c.moveTo(-7, 19); c.quadraticCurveTo(0, 22, 8, 16.5); c.stroke(); }
    if (o.sweat !== false) { c.fillStyle = "#9fd8ff"; c.beginPath(); c.moveTo(29, -14); c.quadraticCurveTo(34, -7, 29, -4); c.quadraticCurveTo(24, -7, 29, -14); c.fill(); }
    if (o.cap) {
      c.fillStyle = "#d32f2f"; c.beginPath(); c.ellipse(0, -20, 28.5, 19, 0, Math.PI, 0); c.fill(); c.fillRect(-28.5, -22, 57, 5);
      c.fillStyle = "#a31515"; c.beginPath(); c.ellipse(15, -16, 24, 5, 0, 0, TAU); c.fill();
      c.fillStyle = "#fff"; c.font = "bold 8px Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("MAGA", 0, -29);
    }
  },
  nikolas: function (c, o) {
    var sk = SKIN.nikolas;
    skull(c, sk, { jw: 21, jh: 20, nw: 4.5, nh: 4 });
    c.fillStyle = "rgba(74,47,31,.4)"; c.beginPath(); c.ellipse(-24.5, -9, 3.5, 11, 0, 0, TAU); c.ellipse(24.5, -9, 3.5, 11, 0, 0, TAU); c.fill();   // degradê
    blush(c, .3);
    c.fillStyle = "#4a2f1f";      // topete
    c.beginPath(); c.moveTo(-26, -8); c.bezierCurveTo(-30, -28, -20, -36, -8, -36); c.bezierCurveTo(-6, -54, 14, -60, 25, -46); c.bezierCurveTo(31, -38, 28, -30, 27, -24);
    c.bezierCurveTo(26, -16, 25, -12, 25, -8); c.lineTo(22, -14); c.bezierCurveTo(20, -22, 10, -26, 0, -24); c.bezierCurveTo(-8, -22, -16, -20, -22, -14); c.closePath(); c.fill();
    c.strokeStyle = "rgba(255,225,190,.35)"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-4, -38); c.quadraticCurveTo(6, -54, 20, -46); c.moveTo(-6, -33); c.quadraticCurveTo(8, -46, 24, -38); c.stroke();
    hEyes(c, -5, 10, 6, 5.6, { iris: "#3b2616" });
    hbrow(c, -10, -15, 13, 3.4, .08, "#3a2416"); hbrow(c, 10, -15, 13, 3.4, -.08, "#3a2416");
    hGrin(c, 16, 9.5, 8, o.talk);
  },
  pavanato: function (c, o) {
    var sk = SKIN.pavanato;
    skull(c, sk, { jw: 23.5, jh: 21 });
    c.save(); c.beginPath(); c.ellipse(0, 9, 23.2, 21.8, 0, 0, TAU); c.clip();   // barba aparada
    c.fillStyle = "rgba(34,22,16,.88)"; c.beginPath(); c.moveTo(-27, -2); c.bezierCurveTo(-25, 24, -12, 35, 0, 35); c.bezierCurveTo(12, 35, 25, 24, 27, -2);
    c.lineTo(22, 4); c.bezierCurveTo(21, 12, 14, 14, 10, 14); c.quadraticCurveTo(0, 11, -10, 14); c.bezierCurveTo(-14, 14, -21, 12, -22, 4); c.fill();
    c.restore();
    c.fillStyle = "#22160f"; c.beginPath(); c.moveTo(-9, 12.5); c.quadraticCurveTo(0, 9.5, 9, 12.5); c.quadraticCurveTo(0, 14.5, -9, 12.5); c.fill();      // bigode
    c.fillStyle = "#1b120d"; c.beginPath(); c.moveTo(-27, -4); c.bezierCurveTo(-32, -32, -12, -40, 4, -38); c.bezierCurveTo(20, -38, 32, -28, 27, -4);   // cabelo penteado pra trás
    c.lineTo(24, -12); c.bezierCurveTo(20, -24, 12, -29, 2, -29); c.bezierCurveTo(-8, -29, -17, -24, -21, -14); c.closePath(); c.fill();
    c.strokeStyle = "rgba(255,255,255,.28)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-14, -33); c.quadraticCurveTo(0, -38, 14, -33); c.moveTo(-18, -27); c.quadraticCurveTo(0, -35, 18, -27); c.stroke();
    hEyes(c, -5, 10, 5.4, 4.6, { iris: "#2b1a10", lid: .18, skin: sk });
    hbrow(c, -10.5, -14, 16.5, 5.6, .14, "#1b120d"); hbrow(c, 10.5, -14, 16.5, 5.6, -.14, "#1b120d");
    if (o.talk > .08) hMouth(c, 19, 8, 0, o.talk); else { c.fillStyle = "#fff"; c.beginPath(); c.moveTo(-6.5, 17.5); c.quadraticCurveTo(0, 22.5, 6.5, 17.5); c.quadraticCurveTo(0, 18.8, -6.5, 17.5); c.fill(); }
  },
  campopiano: function (c, o) {
    var sk = SKIN.campopiano, i, a;
    skull(c, sk, { jw: 22.5, jh: 21, nw: 5.5, nh: 5 });
    blush(c, .22);
    c.fillStyle = "#5b3a24";      // cabelo cacheado
    for (i = 0; i <= 9; i++) { a = Math.PI + i * (Math.PI / 9); c.beginPath(); c.arc(Math.cos(a) * 25, -7 + Math.sin(a) * 28, 8.5, 0, TAU); c.fill(); }
    c.beginPath(); c.arc(-9, -30, 8.5, 0, TAU); c.arc(9, -31, 8.5, 0, TAU); c.arc(0, -35, 8.5, 0, TAU); c.fill();
    c.fillStyle = "rgba(255,255,255,.14)"; c.beginPath(); c.arc(-6, -34, 3, 0, TAU); c.arc(10, -33, 2.6, 0, TAU); c.fill();
    hEyes(c, -5, 10, 4.7, 4.2, { iris: "#3a2414" });
    c.fillStyle = "rgba(200,230,255,.22)"; c.strokeStyle = "#1c1c22"; c.lineWidth = 2.2;      // óculos redondos
    c.beginPath(); c.arc(-10, -5, 8.6, 0, TAU); c.fill(); c.stroke(); c.beginPath(); c.arc(10, -5, 8.6, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-1.6, -6); c.lineTo(1.6, -6); c.moveTo(-18.6, -6); c.lineTo(-25, -7); c.moveTo(18.6, -6); c.lineTo(25, -7); c.stroke();
    hbrow(c, -10, -16.5, 13, 4, -.06, "#4a2f1c"); hbrow(c, 10, -16.5, 13, 4, .06, "#4a2f1c");
    hGrin(c, 16.5, 9.5, 8, o.talk);
    c.fillStyle = "#4a2f1c"; c.beginPath(); c.moveTo(-9, 13); c.quadraticCurveTo(0, 9.5, 9, 13); c.quadraticCurveTo(0, 12.6, -9, 13); c.fill();   // bigodinho
  },
  erika: function (c, o) {
    var sk = SKIN.erika, i, a, hc = "#1e120c";
    c.fillStyle = hc;      // volume do cabelo atrás
    for (i = 0; i <= 12; i++) { a = Math.PI * .92 + i * (Math.PI * 1.16 / 12); c.beginPath(); c.arc(Math.cos(a) * 29, -3 + Math.sin(a) * 31, 11.5, 0, TAU); c.fill(); }
    c.beginPath(); c.arc(-31, 9, 9, 0, TAU); c.arc(31, 9, 9, 0, TAU); c.arc(-30, 21, 8, 0, TAU); c.arc(30, 21, 8, 0, TAU); c.fill();
    skull(c, sk, { jw: 20.5, jh: 21, nw: 5, nh: 4.4, nose: "rgba(60,25,12,.28)" });
    blush(c, .22);
    c.fillStyle = hc; c.beginPath(); c.moveTo(-26, -8); c.bezierCurveTo(-27, -30, -12, -36, 0, -35); c.bezierCurveTo(12, -36, 27, -30, 26, -8);      // franja
    c.bezierCurveTo(22, -20, 14, -25, 4, -25); c.bezierCurveTo(-6, -22, -16, -22, -26, -8); c.fill();
    c.strokeStyle = "#f2c230"; c.lineWidth = 2.2; c.beginPath(); c.arc(-27, 16, 5, 0, TAU); c.stroke(); c.beginPath(); c.arc(27, 16, 5, 0, TAU); c.stroke();   // argolas
    hEyes(c, -5, 10, 5.9, 5, { iris: "#2a160d" });
    c.strokeStyle = hc; c.lineWidth = 2; c.lineCap = "round"; c.beginPath();      // cílios
    c.moveTo(-16, -6); c.lineTo(-19, -9); c.moveTo(-13, -9.5); c.lineTo(-14.6, -13); c.moveTo(16, -6); c.lineTo(19, -9); c.moveTo(13, -9.5); c.lineTo(14.6, -13); c.stroke();
    c.lineWidth = 3.4; c.beginPath(); c.moveTo(-17, -14); c.quadraticCurveTo(-10, -20, -3, -15); c.moveTo(17, -14); c.quadraticCurveTo(10, -20, 3, -15); c.stroke();   // sobrancelhas arqueadas
    if (o.talk > .08) { hMouth(c, 18, 7.5, 0, o.talk); }
    else { c.fillStyle = "#a3203a"; c.beginPath(); c.moveTo(-9, 17); c.quadraticCurveTo(0, 28, 9, 17); c.quadraticCurveTo(0, 19.5, -9, 17); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.moveTo(-7.6, 17.4); c.quadraticCurveTo(0, 23, 7.6, 17.4); c.quadraticCurveTo(0, 19, -7.6, 17.4); c.fill(); }
  }
};
function head(c, kind, o) { c.save(); c.lineCap = "round"; c.lineJoin = "round"; HEAD[kind](c, o || {}); c.restore(); }

function shoulders(c, col, wid) {
  wid = wid || 62; c.fillStyle = col; c.beginPath(); c.moveTo(-14, 34); c.bezierCurveTo(-34, 38, -wid + 6, 46, -wid, 70); c.lineTo(-wid, 100); c.lineTo(wid, 100); c.lineTo(wid, 70);
  c.bezierCurveTo(wid - 6, 46, 34, 38, 14, 34); c.closePath(); c.fill();
}
function bTie(c, col, stripe) {
  c.fillStyle = col; c.beginPath(); c.moveTo(-4, 40); c.lineTo(4, 40); c.lineTo(5.5, 44); c.lineTo(-5.5, 44); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-5, 44); c.lineTo(5, 44); c.lineTo(8, 72); c.lineTo(0, 80); c.lineTo(-8, 72); c.closePath(); c.fill();
  if (stripe) { c.save(); c.clip(); c.strokeStyle = stripe; c.lineWidth = 3; for (var i = -2; i < 8; i++) { c.beginPath(); c.moveTo(-12, 40 + i * 8); c.lineTo(12, 52 + i * 8); c.stroke(); } c.restore(); }
}
function bSuit(c, suit, lapel, tie, stripe) {
  shoulders(c, suit);
  c.fillStyle = "#f4f4f4"; c.beginPath(); c.moveTo(-12, 33); c.lineTo(12, 33); c.lineTo(0, 66); c.closePath(); c.fill();
  c.fillStyle = lapel; c.beginPath(); c.moveTo(-13, 33); c.lineTo(-2, 36); c.lineTo(-9, 70); c.lineTo(-30, 64); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(13, 33); c.lineTo(2, 36); c.lineTo(9, 70); c.lineTo(30, 64); c.closePath(); c.fill();
  bTie(c, tie, stripe);
}
function bust(c, kind, o) {
  o = o || {};
  c.fillStyle = SKIN[kind]; c.fillRect(-10, 20, 20, 24);
  c.fillStyle = "rgba(0,0,0,.22)"; c.fillRect(-10, 22, 20, 7);
  if (kind === "moraes") {
    shoulders(c, "#0c0c13");
    c.fillStyle = "#16161f"; c.beginPath(); c.moveTo(-14, 34); c.lineTo(-38, 56); c.lineTo(-36, 100); c.lineTo(-14, 100); c.closePath(); c.fill();
    c.fillStyle = "#f6f6f6"; c.strokeStyle = "#b8b8c0"; c.lineWidth = 1; rr(c, -12, 33, 10, 46, 2); c.fill(); c.stroke(); rr(c, 2, 33, 10, 46, 2); c.fill(); c.stroke();
  } else if (kind === "lula") {
    bSuit(c, "#34455f", "#27354c", "#d62828");
    c.fillStyle = "#d62828"; c.beginPath(); c.arc(-24, 56, 3.4, 0, TAU); c.fill(); c.fillStyle = "#ffdf00"; c.fillRect(-25, 55, 2, 2);
  } else if (kind === "flavio") {
    bSuit(c, "#1f2b5e", "#18224a", o.tie || "#00963c", o.tie ? null : "#ffdf00");
    c.fillStyle = "#ffdf00"; c.beginPath(); c.moveTo(-24, 54); c.lineTo(-20, 58); c.lineTo(-24, 62); c.lineTo(-28, 58); c.closePath(); c.fill();
  } else if (kind === "nikolas") {
    bSuit(c, "#2f4a73", "#243a5c", "#1e2d50");
    c.fillStyle = "#c9e4ff"; c.beginPath(); c.moveTo(-9, 34); c.lineTo(9, 34); c.lineTo(0, 46); c.closePath(); c.fill();
  } else if (kind === "pavanato") {
    bSuit(c, "#2b2f3a", "#20232c", "#1f5fa8");
  } else if (kind === "campopiano") {
    shoulders(c, "#e0a21b");
    c.fillStyle = "#c98a10"; c.beginPath(); c.moveTo(-13, 33); c.lineTo(-1, 38); c.lineTo(-16, 52); c.lineTo(-30, 42); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(13, 33); c.lineTo(1, 38); c.lineTo(16, 52); c.lineTo(30, 42); c.closePath(); c.fill();
    c.fillStyle = "#a87410"; c.fillRect(-1, 38, 2, 40); c.fillStyle = "#fff4cc"; c.beginPath(); c.arc(0, 48, 1.8, 0, TAU); c.arc(0, 60, 1.8, 0, TAU); c.fill();
  } else if (kind === "erika") {
    shoulders(c, "#b3202e");
    c.fillStyle = "#16161a"; c.beginPath(); c.moveTo(-12, 33); c.lineTo(12, 33); c.lineTo(0, 62); c.closePath(); c.fill();
    c.fillStyle = "#8e1824"; c.beginPath(); c.moveTo(-13, 33); c.lineTo(-2, 36); c.lineTo(-9, 68); c.lineTo(-30, 62); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(13, 33); c.lineTo(2, 36); c.lineTo(9, 68); c.lineTo(30, 62); c.closePath(); c.fill();
    c.strokeStyle = "#f2c230"; c.lineWidth = 1.8; c.beginPath(); c.arc(0, 30, 11, .15, Math.PI - .15); c.stroke(); c.fillStyle = "#f2c230"; c.beginPath(); c.arc(0, 42, 2.6, 0, TAU); c.fill();
  }
}
// cartão de retrato: moldura + fundo + busto de cabeça grande. (x,y,w,h) = retângulo.
function portraitCard(c, kind, x, y, w, h, o) {
  o = o || {}; var P = CARI[kind], s = (o.zoom || 1) * w / 92, gr, rg;
  c.save(); rr(c, x, y, w, h, o.r == null ? 10 : o.r); c.clip();
  gr = c.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, P.bg[0]); gr.addColorStop(1, P.bg[1]); c.fillStyle = gr; c.fillRect(x, y, w, h);
  rg = c.createRadialGradient(x + w / 2, y + h * .4, 4, x + w / 2, y + h * .4, w * .7); rg.addColorStop(0, "rgba(255,255,255,.28)"); rg.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = rg; c.fillRect(x, y, w, h);
  c.translate(x + w / 2, y + h * (o.cy || .44)); c.scale(s, s);
  bust(c, kind, o); head(c, kind, o);
  c.restore();
  if (o.name) {
    c.save(); rr(c, x, y, w, h, o.r == null ? 10 : o.r); c.clip();
    c.fillStyle = "rgba(0,0,0,.62)"; c.fillRect(x, y + h - Math.max(18, h * .13), w, Math.max(18, h * .13));
    txt(c, P.nome, x + w / 2, y + h - Math.max(18, h * .13) / 2, Math.max(10, Math.min(15, w / 11)), "#fff", "center"); c.restore();
  }
  c.strokeStyle = P.fr; c.lineWidth = o.lw || 3; rr(c, x, y, w, h, o.r == null ? 10 : o.r); c.stroke();
}

function bigHead(c, kind, o) { c.save(); c.translate(0, -61); c.scale(.62, .62); head(c, kind, o); c.restore(); }
var CH = {
  flavio: function (c, sw, t, o) {
    legs(c, sw, "#1a2347"); arms(c, sw, "#1f2b5e", "#e8b48e");
    c.fillStyle = "#1f2b5e"; rr(c, -11, -39, 22, 24, 4); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.moveTo(-5, -39); c.lineTo(5, -39); c.lineTo(0, -29); c.fill();
    c.fillStyle = o.tie || "#00963c"; c.beginPath(); c.moveTo(-2, -37); c.lineTo(2, -37); c.lineTo(3.5, -24); c.lineTo(0, -20); c.lineTo(-3.5, -24); c.fill();
    if (!o.tie) { c.fillStyle = "#ffdf00"; c.fillRect(-2.4, -32, 4.8, 2); c.fillRect(-2.9, -27, 5.8, 2); }
    bigHead(c, "flavio", o);
  },
  moraes: function (c, sw, t, o) {
    c.fillStyle = "#111"; c.fillRect(-7 + sw * .4, -4, 7, 4); c.fillRect(0 - sw * .4, -4, 7, 4);
    c.fillStyle = "#0b0b10"; c.beginPath(); c.moveTo(-12, -40); c.lineTo(12, -40); c.lineTo(18, -3); c.lineTo(-18, -3); c.closePath(); c.fill();
    c.fillStyle = "#16161e"; c.fillRect(-17, -38 + sw * .35, 6, 20); c.fillRect(11, -38 - sw * .35, 6, 20);
    c.fillStyle = "#d6a07a"; c.beginPath(); c.arc(-14, -17 + sw * .35, 3, 0, TAU); c.arc(14, -17 - sw * .35, 3, 0, TAU); c.fill();
    c.fillStyle = "#fff"; c.fillRect(-6, -41, 5, 24); c.fillRect(1, -41, 5, 24);
    bigHead(c, "moraes", o);
  },
  nikolas: function (c, sw, t, o) {
    legs(c, sw, "#2c3e6b", "#eee"); arms(c, sw, "#2f4a73", "#f2c9a6");
    c.fillStyle = "#2f4a73"; rr(c, -11, -39, 22, 24, 4); c.fill();
    c.fillStyle = "#c9e4ff"; c.fillRect(-4, -39, 8, 22); c.fillStyle = "#1e2d50"; c.fillRect(-1.2, -37, 2.4, 14);
    bigHead(c, "nikolas", o);
  },
  agent: function (c, sw, t, o) {
    legs(c, sw, "#0e1220"); arms(c, sw, "#101a33", o.skin || "#c98e68");
    c.fillStyle = "#101a33"; rr(c, -12, -39, 24, 24, 4); c.fill();
    c.fillStyle = "#ffd800"; c.font = "bold 8px Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("PF", 0, -27);
    c.fillStyle = "#222c4f"; c.fillRect(-12, -22, 24, 3);
    face(c, o.skin || "#c98e68", -50, { jaw: 11 });
    c.fillStyle = "#0a0a0a"; c.fillRect(-9, -54, 18, 5.5); c.fillRect(-9.5, -55, 19, 1.8);
    c.fillStyle = "rgba(255,255,255,.35)"; c.fillRect(-7, -53.5, 4, 1.5); c.fillRect(2.5, -53.5, 4, 1.5);
    c.fillStyle = "#0b0b0b"; c.beginPath(); c.ellipse(0, -60, 13, 6.5, 0, Math.PI, 0); c.fill(); c.fillRect(-13, -61, 26, 3.5); c.fillRect(-9, -57, 18, 2);
    c.fillStyle = "#ffd800"; c.beginPath(); c.arc(0, -63, 2.4, 0, TAU); c.fill();
    c.strokeStyle = "#3a1e18"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-3, -44); c.lineTo(3, -44); c.stroke();
  },
  npc: function (c, sw, t, o) {
    legs(c, sw, o.pants || "#33384f"); arms(c, sw, o.shirt || "#c33", o.skin || "#e0ac84");
    c.fillStyle = o.shirt || "#c33"; rr(c, -10, -38, 20, 23, 5); c.fill();
    face(c, o.skin || "#e0ac84", -51, { jaw: 10 });
    c.fillStyle = o.hair || "#222"; c.beginPath(); c.ellipse(0, -58, 12.5, 7, 0, Math.PI, 0); c.fill(); c.fillRect(-12.5, -58, 3, 6); c.fillRect(9.5, -58, 3, 6);
    c.strokeStyle = "#5a2a20"; c.lineWidth = 1.5; c.beginPath(); c.arc(0, -46, 3, 0.3, Math.PI - 0.3); c.stroke();
  }
};
function drawChar(c, kind, x, y, s, o) {
  o = o || {}; var t = o.t || 0, mv = o.moving ? 1 : 0;
  c.save(); c.translate(x, y); c.scale(s * (o.flip ? -1 : 1), s);
  c.fillStyle = "rgba(0,0,0,.33)"; c.beginPath(); c.ellipse(0, 0, 15, 5, 0, 0, TAU); c.fill();
  var sw = Math.sin(t * 14) * 5 * mv, bob = Math.abs(Math.sin(t * 14)) * 2 * mv;
  c.translate(0, -bob); CH[kind](c, sw, t, o);
  if (o.stun) {
    c.fillStyle = "#ffe94d"; for (var si = 0; si < 3; si++) { var sa = t * 6 + si * 2.1; c.beginPath(); c.arc(Math.cos(sa) * 14, (kind === "agent" || kind === "npc" ? -72 : -92) + Math.sin(sa) * 4, 2.6, 0, TAU); c.fill(); }
  }
  if (o.frozen) {
    c.fillStyle = "rgba(140,200,255,.5)"; rr(c, -19, (kind === "agent" || kind === "npc" ? -68 : -90), 38, (kind === "agent" || kind === "npc" ? 70 : 92), 8); c.fill();
    c.strokeStyle = "rgba(255,255,255,.8)"; c.lineWidth = 1.5; c.stroke();
  }
  c.restore();
}

function drawCar(c, x, y, dir, t, o) {   // (x,y)=centro no chão; dir -1 = indo para a esquerda
  o = o || {};
  c.save(); c.translate(x, y); c.scale(dir < 0 ? -1 : 1, 1);
  c.fillStyle = "rgba(0,0,0,.4)"; c.beginPath(); c.ellipse(0, 3, 54, 9, 0, 0, TAU); c.fill();
  if (!o.parked) {
    var g = c.createLinearGradient(48, 0, 150, 0); g.addColorStop(0, "rgba(255,240,170,.38)"); g.addColorStop(1, "rgba(255,240,170,0)");
    c.fillStyle = g; c.beginPath(); c.moveTo(46, -16); c.lineTo(150, -34); c.lineTo(150, 12); c.lineTo(46, -8); c.fill();
  }
  c.fillStyle = "#e9edf5"; rr(c, -48, -26, 96, 20, 6); c.fill();
  c.fillStyle = "#e9edf5"; c.beginPath(); c.moveTo(-26, -26); c.lineTo(-17, -41); c.lineTo(20, -41); c.lineTo(32, -26); c.closePath(); c.fill();
  c.fillStyle = "#1b2a52"; c.beginPath(); c.moveTo(-21, -28); c.lineTo(-14, -39); c.lineTo(-2, -39); c.lineTo(-2, -28); c.fill();
  c.beginPath(); c.moveTo(2, -28); c.lineTo(2, -39); c.lineTo(18, -39); c.lineTo(27, -28); c.fill();
  c.fillStyle = "#1b3a8a"; c.fillRect(-48, -17, 96, 5);
  c.fillStyle = "#ffd800"; c.fillRect(-48, -12, 96, 1.5);
  c.save(); if (dir < 0) c.scale(-1, 1); c.fillStyle = "#111"; c.font = "bold 8px Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("POLÍCIA FEDERAL", 0, -21.5); c.restore();
  c.fillStyle = "#ffe9a0"; c.fillRect(43, -24, 5, 5);
  c.fillStyle = "#c22"; c.fillRect(-48, -23, 3, 4);
  c.fillStyle = "#111"; c.beginPath(); c.arc(-28, -5, 8, 0, TAU); c.arc(28, -5, 8, 0, TAU); c.fill();
  c.fillStyle = "#777"; c.beginPath(); c.arc(-28, -5, 3.5, 0, TAU); c.arc(28, -5, 3.5, 0, TAU); c.fill();
  var on = Math.floor(t * 6) % 2 === 0;
  c.fillStyle = on ? "#ff2a2a" : "#7a1515"; c.fillRect(-12, -46, 12, 5);
  c.fillStyle = on ? "#1a3a7a" : "#3a7aff"; c.fillRect(0, -46, 12, 5);
  c.restore();
  c.save(); c.globalCompositeOperation = "lighter";
  var gl = c.createRadialGradient(x, y - 44, 2, x, y - 44, 60);
  gl.addColorStop(0, on ? "rgba(255,40,40,.55)" : "rgba(60,110,255,.55)"); gl.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = gl; c.fillRect(x - 60, y - 104, 120, 120); c.restore();
}

function drawJet(c, x, y) {
  c.save(); c.translate(x, y);
  c.fillStyle = "rgba(0,0,0,.4)"; c.beginPath(); c.ellipse(0, 4, 120, 12, 0, 0, TAU); c.fill();
  c.fillStyle = "#f4f6fa"; c.beginPath(); c.ellipse(0, -48, 118, 24, 0, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(-80, -58); c.lineTo(-120, -112); c.lineTo(-96, -112); c.lineTo(-50, -62); c.closePath(); c.fill();
  c.fillStyle = "#cfd6e4"; c.beginPath(); c.moveTo(-10, -40); c.lineTo(30, -40); c.lineTo(-30, -14); c.lineTo(-52, -14); c.closePath(); c.fill();
  c.fillStyle = "#cfd6e4"; c.beginPath(); c.ellipse(-92, -74, 22, 8, 0, 0, TAU); c.fill();
  c.fillStyle = "#1b3a8a"; c.fillRect(-100, -50, 218, 4);
  c.fillStyle = "#00a651"; c.fillRect(-100, -45, 218, 3);
  c.fillStyle = "#2a3a63";
  for (var i = 0; i < 6; i++) { rr(c, -48 + i * 20, -62, 11, 9, 3); c.fill(); }
  c.beginPath(); c.moveTo(82, -62); c.quadraticCurveTo(108, -62, 112, -50); c.lineTo(82, -50); c.fill();
  c.fillStyle = "#555"; c.beginPath(); c.arc(-40, -3, 6, 0, TAU); c.arc(60, -3, 6, 0, TAU); c.fill();
  c.fillStyle = "#222"; c.fillRect(-42, -26, 4, 20); c.fillRect(58, -26, 4, 20);
  c.restore();
}

function drawHeart(c, x, y, s, col) {
  c.fillStyle = col; c.beginPath(); c.moveTo(x, y + s * .35);
  c.bezierCurveTo(x - s, y - s * .3, x - s * .5, y - s, x, y - s * .4);
  c.bezierCurveTo(x + s * .5, y - s, x + s, y - s * .3, x, y + s * .35); c.fill();
}
function drawFlag(c, x, y, w, h, kind) {
  c.save(); c.translate(x, y);
  if (kind === "br") {
    c.fillStyle = "#009c3b"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#ffdf00"; c.beginPath(); c.moveTo(w / 2, h * .1); c.lineTo(w * .9, h / 2); c.lineTo(w / 2, h * .9); c.lineTo(w * .1, h / 2); c.fill();
    c.fillStyle = "#002776"; c.beginPath(); c.arc(w / 2, h / 2, h * .26, 0, TAU); c.fill();
  } else {
    c.fillStyle = "#74acdf"; c.fillRect(0, 0, w, h); c.fillStyle = "#fff"; c.fillRect(0, h / 3, w, h / 3);
    c.fillStyle = "#f6b40e"; c.beginPath(); c.arc(w / 2, h / 2, h * .12, 0, TAU); c.fill();
  }
  c.strokeStyle = "rgba(0,0,0,.5)"; c.strokeRect(0, 0, w, h); c.restore();
}


/* ================= efeitos (juice) ================= */
var g = null;
var parts = [], pops = [];
var fx = { shk: 0, flash: 0, fcol: "255,40,40", slow: 0, ts: 1, slowCd: 0 };
function shake(m) { fx.shk = Math.max(fx.shk, m); }
function flashScr(col, a) { fx.fcol = col; fx.flash = Math.max(fx.flash, a); }
function slowmo(sec) { if (fx.slowCd > 0) return; fx.slow = Math.max(fx.slow, sec); fx.slowCd = 1.6; sfx("slow"); }
function burst(x, y, col, n, sp, grav) {
  for (var i = 0; i < n; i++) { var a = rnd(0, TAU), v = rnd(30, sp || 140);
    parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, life: rnd(.4, .9), max: .9, col: col, r: rnd(2, 4.5), gr: grav == null ? 180 : grav }); }
}
function ring(x, y, col, r0) { parts.push({ x: x, y: y, vx: 0, vy: 0, life: .5, max: .5, col: col, r: r0 || 8, k: "ring", gr: 0 }); }
function smoke(x, y, n) { for (var i = 0; i < n; i++) parts.push({ x: x + rnd(-6, 6), y: y, vx: rnd(-20, 10), vy: rnd(-40, -10), life: rnd(.5, 1), max: 1, col: "rgba(190,190,200,", r: rnd(4, 8), k: "smoke", gr: 0 }); }
function popup(s, x, y, col, size) { pops.push({ s: s, x: x, y: y, vy: -42, t: 1.15, max: 1.15, col: col || "#fff", size: size || 18 }); if (pops.length > 14) pops.shift(); }
function updFx(dt) {
  var i, p;
  for (i = parts.length - 1; i >= 0; i--) { p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.gr * dt; if (p.k === "ring") p.r += 150 * dt; else if (p.k === "smoke") p.r += 10 * dt; }
  for (i = pops.length - 1; i >= 0; i--) { p = pops[i]; p.t -= dt; if (p.t <= 0) { pops.splice(i, 1); continue; } p.y += p.vy * dt; p.vy *= (1 - 2 * dt); }
  fx.shk = Math.max(0, fx.shk - dt * 28); if (fx.flash > 0) fx.flash = Math.max(0, fx.flash - dt * 2.2);
  if (fx.slowCd > 0) fx.slowCd -= dt;
  if (fx.slow > 0) { fx.slow -= dt; fx.ts = lerp(fx.ts, .34, Math.min(1, dt * 18)); } else fx.ts = lerp(fx.ts, 1, Math.min(1, dt * 10));
}
function drawParts(c) {
  var i, p;
  for (i = 0; i < parts.length; i++) { p = parts[i]; var a = clamp(p.life / (p.k ? p.max : .5), 0, 1);
    if (p.k === "ring") { c.globalAlpha = a; c.strokeStyle = p.col; c.lineWidth = 3; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.stroke(); }
    else if (p.k === "smoke") { c.fillStyle = p.col + (a * .45).toFixed(2) + ")"; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); }
    else { c.globalAlpha = a; c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); } }
  c.globalAlpha = 1;
}
function drawPops(c) {
  for (var i = 0; i < pops.length; i++) { var p = pops[i], a = clamp(p.t * 2.5, 0, 1), sc = 1 + Math.max(0, p.t - p.max + .15) * 2.2;
    c.save(); c.globalAlpha = a; c.translate(p.x, p.y); c.scale(sc, sc); txt(c, p.s, 0, 0, p.size, p.col, "center", "rgba(0,0,0,.8)"); c.restore(); }
}
function toast(s, col, t) { g.toasts.push({ s: s, col: col || "#fff", t: t || 2.2 }); if (g.toasts.length > 3) g.toasts.shift(); }
