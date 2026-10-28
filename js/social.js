"use strict";
/* ================= engajamento: apelido, placar, torcida, cargos, sequência, desafio e compartilhar ================= */
var SITE_URL = "https://ebaoj.github.io/brasil-speedrun/";
var CHAR_LABEL = { moraes: "Moraes", flavio: "Flávio", lula: "Lula" };
var CHALLENGE = null;      // { nick, score, side, char, phase } vindo de ?desafio=
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function sideLabel(s) { return s === "esquerda" ? "Esquerda" : "Direita"; }
function runChar(r) { return r.n === 5 && r.p5 ? r.p5 : (CAMPS[r.camp] ? CAMPS[r.camp].kind : "flavio"); }

/* ---- status (online/offline) ---- */
function lbStatusUI() {
  var t = LB.online === false ? "● offline (placar só neste aparelho)" : LB.online ? "● online" : "";
  ["lb-status", "map-lbstatus"].forEach(function (id) { var e = $(id); if (!e) return; e.textContent = t; e.className = "lbst " + (LB.online === false ? "off" : LB.online ? "on" : ""); });
}

/* ---- apelido ---- */
function nickPrompt(msg, cb) {
  $("nick-err").textContent = msg || ""; $("nick-in").value = PROFILE.nick || ""; $("nick").classList.remove("hidden");
  $("nick").onDone = cb || null; setTimeout(function () { try { $("nick-in").focus({ preventScroll: true }); } catch (e) {} }, 50);
}
function nickDone(nick) {
  $("nick").classList.add("hidden"); PROFILE.nick = nick; profSave(); sfx("select");
  var cb = $("nick").onDone; $("nick").onDone = null; if (cb) cb();
  if (state.screen === "map") renderMapSocial();
}
$("nick-ok").addEventListener("click", function () {
  var n = cleanNickC($("nick-in").value);
  if (n.length < 2) { $("nick-err").textContent = "Use de 2 a 16 caracteres (letras, números, espaço)."; sfx("nope"); return; }
  nickDone(n);
});
$("nick-in").addEventListener("keydown", function (e) { e.stopPropagation(); if (e.code === "Enter") $("nick-ok").click(); });
$("nick-in").addEventListener("keyup", function (e) { e.stopPropagation(); });
$("nick-skip").addEventListener("click", function () { nickDone("Anônimo" + (100 + Math.floor(Math.random() * 900))); });

/* ---- tela do placar ---- */
var LBUI = { tab: "global", phase: 1 };
var LB_TABS = [["global", "Global"], ["esquerda", "Esquerda"], ["direita", "Direita"], ["fase", "Fase"], ["hoje", "Hoje"], ["semana", "Semana"]];
function showLB(tab, phase) {
  if (tab) LBUI.tab = tab; if (phase) LBUI.phase = phase;
  $("lb").classList.remove("hidden");
  var h = "";
  LB_TABS.forEach(function (t) { h += "<button type='button' class='tab" + (t[0] === LBUI.tab ? " on" : "") + "' data-t='" + t[0] + "'>" + t[1] + "</button>"; });
  $("lb-tabs").innerHTML = h;
  var ph = ""; if (LBUI.tab === "fase") for (var n = 1; n <= 6; n++) ph += "<button type='button' class='tab sm" + (n === LBUI.phase ? " on" : "") + "' data-p='" + n + "'>" + n + "</button>";
  $("lb-phases").innerHTML = ph; $("lb-phases").style.display = ph ? "" : "none";
  var sc = LBUI.tab === "esquerda" || LBUI.tab === "direita" ? "side" : LBUI.tab === "fase" ? "phase" : LBUI.tab === "hoje" ? "daily" : LBUI.tab === "semana" ? "weekly" : "global";
  var o = { side: LBUI.tab, phase: LBUI.phase }, cap = { global: "Placar geral (total das 6 fases)", esquerda: "Time Esquerda · total", direita: "Time Direita · total", fase: "Fase " + LBUI.phase + " · " + PHASES[LBUI.phase].name, hoje: "Desafio diário " + dateKey() + " · fase " + dailyPhase(), semana: "Semana " + isoWeekC(dateKey()) + " · total" }[LBUI.tab];
  $("lb-cap").textContent = cap; $("lb-list").innerHTML = "<div class='lbrow dim'>Carregando…</div>";
  var tab = LBUI.tab;
  lbTop(sc, o).then(function (res) {
    if (tab !== LBUI.tab || $("lb").classList.contains("hidden")) return;
    var rows = "", me = (PROFILE.nick || "").toLowerCase();
    res.entries.forEach(function (e, i) {
      rows += "<div class='lbrow" + (e.nick.toLowerCase() === me ? " me" : "") + "'><span class='p'>" + (i + 1) + "</span><span class='n'>" + esc(e.nick) + "</span><span class='s " + e.side + "'>" + sideLabel(e.side) + "</span><span class='v'>" + fmt(e.score) + "</span></div>";
    });
    $("lb-list").innerHTML = rows || "<div class='lbrow dim'>Ninguém por aqui ainda. Seja o primeiro!</div>";
    $("lb-sub").textContent = res.total + " no placar" + (res.online ? "" : " · offline: mostrando só este aparelho");
    lbStatusUI();
  });
}
$("lb-tabs").addEventListener("click", function (e) { var t = e.target.getAttribute && e.target.getAttribute("data-t"); if (t) showLB(t); });
$("lb-phases").addEventListener("click", function (e) { var p = e.target.getAttribute && e.target.getAttribute("data-p"); if (p) showLB("fase", +p); });
$("lb-close").addEventListener("click", function () { $("lb").classList.add("hidden"); });
$("b-lb").addEventListener("click", function () { showLB(); });
$("b-lb2").addEventListener("click", function () { showLB(); });

/* ---- mapa: torcida, cargo, sequência ---- */
function renderMapSocial() {
  var car = careerOf(PROFILE.cum), nx = car.next;
  $("map-career").innerHTML = "Cargo: <b>" + esc(car.t) + "</b>" + (nx ? " · faltam " + fmt(nx.min - PROFILE.cum) + " pts pra <i>" + esc(nx.t) + "</i>" : " · topo da carreira") +
    (PROFILE.streak ? " · 🔥 " + PROFILE.streak + (PROFILE.streak === 1 ? " dia" : " dias seguidos") : "") + " · <u id='b-nick2'>" + esc(PROFILE.nick || "sem apelido") + "</u>";
  $("b-nick2").onclick = function () { nickPrompt(""); };
  lbTorcida().then(function (t) { renderTorcida(t); });
}
function renderTorcida(t) {
  if (!$("torcida")) return;
  var pe = Math.round(t.pctEsquerda), pd = 100 - pe;
  $("torcida").innerHTML = "<div class='tl'><b class='e'>Esquerda " + pe + "%</b><span>" + fmt(t.esquerda.pts) + " pts · " + t.esquerda.runs + " corridas</span></div>" +
    "<div class='tbar' title='Placar da torcida de hoje'><i style='width:" + pe + "%'></i></div>" +
    "<div class='tl r'><b class='d'>Direita " + pd + "%</b><span>" + fmt(t.direita.pts) + " pts · " + t.direita.runs + " corridas</span></div>";
  $("torcida").setAttribute("data-pe", pe); $("torcida").setAttribute("data-online", t.online ? "1" : "0");
  lbStatusUI();
}

/* ---- desafio por link ---- */
function b64enc(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))); }
function parseDesafio(s) {
  try {
    var raw = String(s).replace(/ /g, "+").replace(/-/g, "+").replace(/_/g, "/"), o = JSON.parse(decodeURIComponent(escape(atob(raw))));
    var score = Math.round(+o.score), phase = Math.round(+o.phase), nick = cleanNickC(o.nick);
    if (!(score > 0 && score < 1e7) || !(phase >= 1 && phase <= 6) || nick.length < 2) return null;
    return { nick: nick, score: score, side: o.side === "esquerda" ? "esquerda" : "direita", char: CHAR_LABEL[o.char] ? o.char : "flavio", phase: phase };
  } catch (e) { return null; }
}
function siteBase() { return /^https?:/.test(location.protocol) ? location.origin + location.pathname : SITE_URL; }
function challengeURL(r) {
  return siteBase() + "?desafio=" + encodeURIComponent(b64enc({ nick: PROFILE.nick || "Anônimo", score: r.sc, side: campSide(r.camp), char: runChar(r), phase: r.n }));
}
function chalRefresh() {
  var el = $("chal"), c = CHALLENGE;
  if (!c || (state.screen !== "menu" && state.screen !== "map")) { el.classList.add("hidden"); return; }
  var host = state.screen === "map" ? $("map") : $("menu"); if (el.parentNode !== host) host.insertBefore(el, host.firstChild);
  $("chal-t").textContent = c.nick + " fez " + fmt(c.score) + " como " + CHAR_LABEL[c.char] + ". Duvido você!";
  $("chal-s").textContent = "Fase " + c.phase + " · " + PHASES[c.phase].name + " · alvo: " + fmt(c.score) + " pts";
  el.classList.remove("hidden");
}
function chalHide() { $("chal").classList.add("hidden"); }
function chalSet(c) { CHALLENGE = c; PROFILE.challenge = c; profSave(); chalRefresh(); }
$("chal-go").addEventListener("click", function () {
  var c = CHALLENGE; if (!c) return;
  if (!META.camp) { META.camp = c.side === "esquerda" ? "lula" : "flavio"; metaSave(); }
  chalHide(); launchPhase(c.phase);
});
$("chal-x").addEventListener("click", function () { CHALLENGE = null; PROFILE.challenge = null; profSave(); chalHide(); });
(function () {
  var m = /[?&]desafio=([^&#]+)/.exec(location.search), c = null;
  if (m) { try { c = parseDesafio(decodeURIComponent(m[1])); } catch (e) { c = null; } }
  CHALLENGE = c || PROFILE.challenge || null;
  if (c) { PROFILE.challenge = c; profSave(); }
  chalRefresh();
})();

/* ---- depois de cada corrida ---- */
function confetti(host) {
  var em = ["🎉", "⭐", "🟩", "🟨", "🇧🇷", "✨"], i;
  for (i = 0; i < 26; i++) {
    var s = document.createElement("span"); s.className = "conf"; s.textContent = em[i % em.length];
    s.style.left = (Math.random() * 100) + "%"; s.style.animationDelay = (Math.random() * .5) + "s"; s.style.fontSize = (1 + Math.random()) + "em";
    host.appendChild(s); (function (n) { setTimeout(function () { n.remove(); }, 2600); })(s);
  }
}
function setShareLinks(r) {
  var text = shareText(r);
  $("sh-wa").href = "https://wa.me/?text=" + encodeURIComponent(text);
  $("sh-x").href = "https://x.com/intent/post?text=" + encodeURIComponent(text);
}
function engageRun(r) {
  var box = $("r-eng"), lines = [], prevCar = careerOf(PROFILE.cum), side = campSide(r.camp);
  r.engage = { rankUp: false, record: false, near: false, peak: false, lb: null };
  profTouch(r.sc);
  var car = careerOf(PROFILE.cum), E = r.engage; E.rankUp = car.i > prevCar.i; r.career = car; r.side = side;
  E.record = !!(r.won && r.isNew && r.prev > 0);
  $("r-share2").classList.add("hidden"); $("b-share").classList.remove("pulse"); $("r-peak").textContent = "";
  function paint() {
    box.innerHTML = lines.map(function (l) { return "<div class='" + l[0] + "'>" + l[1] + "</div>"; }).join("");
  }
  if (E.record) lines.push(["rec", "★ Novo recorde pessoal na fase " + r.n + "! (antes: " + fmt(r.prev) + ")"]);
  if (E.rankUp) lines.push(["up", "⬆ Subiu de cargo: <b>" + esc(car.t) + "</b>!"]);
  var c = CHALLENGE;
  if (c && c.phase === r.n) {
    if (r.sc > c.score) { lines.push(["rec", "🎯 Você passou o desafio de <b>" + esc(c.nick) + "</b> (" + fmt(c.score) + ")!"]); CHALLENGE = null; PROFILE.challenge = null; profSave(); }
    else lines.push(["dim", "🎯 Desafio de " + esc(c.nick) + ": faltaram " + fmt(c.score - r.sc + 1) + " pts pra passar."]);
  }
  lines.push(["dim", "Cargo: " + esc(car.t) + (car.next ? " · faltam " + fmt(car.next.min - PROFILE.cum) + " pts pra " + esc(car.next.t) : "") + (PROFILE.streak ? " · 🔥 " + PROFILE.streak + (PROFILE.streak === 1 ? " dia" : " dias seguidos") : "")]);
  paint();
  if (E.record || E.rankUp) { sfx("medal"); confetti($("result")); }
  setShareLinks(r); buildShareCard(r); $("r-img").src = state.cardURL;
  if (!r.won) { peak(r); return; }
  if (!PROFILE.nick) { peak(r); return; }
  var daily = r.daily ? dateKey() : null;
  lbSubmit({ nick: PROFILE.nick, side: side, phase: r.n, score: r.sc, time: Math.max(5, Math.round(state.runT || 0)), daily: daily, char: runChar(r) }).then(function (res) {
    if (lastResult !== r) return;
    if (!res.ok && res.error) {
      PROFILE.nick = ""; profSave(); lines.push(["bad", "Apelido recusado pelo placar. Escolha outro."]); paint();
      nickPrompt("Esse apelido não foi aceito. Escolha outro (sem palavrões).", function () {}); return;
    }
    E.lb = res; r.lb = res;
    if (res.record === false && !E.record) lines.splice(0, 0, ["dim", "Seu melhor nesse placar continua maior."]);
    lines.unshift(["rank", (res.position === 1 ? "🥇 Você está em <b>1º lugar</b> de " + res.total : "🏆 Você está no <b>top " + res.top + "%</b> · #" + res.position + " de " + res.total) + (daily ? " no desafio de hoje" : " na fase " + r.n)]);
    if (res.next && res.gap > 0) {
      E.near = res.gap <= Math.max(250, Math.round(r.sc * .05));
      lines.splice(1, 0, ["gap", "Faltaram <b>" + fmt(res.gap) + "</b> pontos pra passar <b>" + esc(res.next.nick) + "</b> (" + fmt(res.next.score) + ")"]);
    }
    if (!res.online) lines.push(["off", "● offline: ranking só deste aparelho. Seu resultado fica salvo localmente."]);
    paint(); lbStatusUI(); buildShareCard(r); $("r-img").src = state.cardURL; setShareLinks(r);
    // total geral: só manda quando o total do time melhorou (a API guarda a melhor marca)
    if (r.isNew && !daily) lbSubmit({ nick: PROFILE.nick, side: side, phase: "all", score: campTotal(r.camp), time: Math.max(5, Math.round(PROFILE.runs)), char: runChar(r) });
    peak(r);
  });
}
// só convida a compartilhar em momentos de pico: recorde, cargo novo, ou quase passando alguém
function peak(r) {
  var E = r.engage; E.peak = !!(E.record || E.rankUp || E.near);
  if (!E.peak) return;
  $("r-peak").textContent = E.rankUp ? "🚀 Cargo novo! Mostra pra galera:" : E.record ? "🔥 Recorde! Manda pro grupo:" : "😬 Tá colado em " + (r.lb.next ? r.lb.next.nick : "alguém") + "! Desafie alguém a passar:";
  $("r-share2").classList.remove("hidden"); $("b-share").classList.add("pulse");
}
$("sh-dl").addEventListener("click", function () {
  if (!state.cardURL) return; var a = document.createElement("a"); a.href = state.cardURL; a.download = "brasil-speedrun-2026.png"; document.body.appendChild(a); a.click(); a.remove();
});
