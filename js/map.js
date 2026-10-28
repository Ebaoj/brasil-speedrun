"use strict";
/* ================= menu de lado + mapa de fases ================= */
function menuIcons() {
  ["lula", "flavio"].forEach(function (k) {
    var c2 = $("cv-" + k), x = c2.getContext("2d"); x.clearRect(0, 0, c2.width, c2.height);
    portraitCard(x, k, 3, 3, c2.width - 6, c2.height - 6, { r: 14, lw: 4, cy: .42 });
  });
}
function refreshMenu() { $("best-lula").textContent = "Total: " + fmt(campTotal("lula")) + " · medalhas " + campMedals("lula") + "/6"; $("best-flavio").textContent = "Total: " + fmt(campTotal("flavio")) + " · medalhas " + campMedals("flavio") + "/6"; }

function showMenu() {
  leaveScene(); state.screen = "menu"; state.running = false; state.over = false; state.paused = false;
  $("menu").classList.remove("hidden"); $("map").classList.add("hidden"); $("result").classList.add("hidden"); $("touch").classList.remove("on");
  refreshMenu(); joyReset(); chalRefresh();
}
function pickCamp(camp) { META.camp = camp; metaSave(); sfx("select"); showMap(); if (!PROFILE.nick) nickPrompt(""); }

function p5Role() { return META.p5role[META.camp] || CAMPS[META.camp].p5; }
function showMap() {
  if (!META.camp) { showMenu(); return; }
  leaveScene(); g = null; state.screen = "map"; state.running = false; state.over = false; state.paused = false;
  $("menu").classList.add("hidden"); $("result").classList.add("hidden"); $("map").classList.remove("hidden"); $("touch").classList.remove("on");
  var camp = META.camp, C = CAMPS[camp], un = META.unlocked[camp] || 1, box = $("map-nodes"), html = "", n, P, best, med;
  for (n = 1; n <= 6; n++) {
    P = PHASES[n]; best = META.best[camp][n]; med = META.medal[camp][n]; var lock = n > un, cur = n === un && !med;
    html += "<button type='button' class='node" + (lock ? " lock" : "") + (cur ? " cur" : "") + "' data-n='" + n + "' aria-label='Fase " + n + ": " + P.name + (lock ? " (bloqueada)" : "") + "'>" +
      "<span class='nn'>" + (lock ? "🔒" : P.ic) + " " + n + "</span>" +
      (med ? "<span class='nm md " + med + "'>★</span>" : "") +
      "<div class='nt'>" + P.name + "</div><div class='ns'>" + P.sub + "</div>" +
      "<div class='nb'>" + (lock ? "Termine a fase " + (n - 1) + " para liberar" : (best ? "melhor: " + fmt(best) + " pts" : "novo · " + P.mins)) + "</div></button>";
  }
  box.innerHTML = html;
  Array.prototype.forEach.call(box.querySelectorAll(".node"), function (b) {
    b.addEventListener("click", function () {
      var nn = +b.getAttribute("data-n");
      if (nn > (META.unlocked[META.camp] || 1)) { $("map-hint").textContent = "Fase bloqueada: termine a fase " + (nn - 1) + " primeiro."; sfx("nope"); return; }
      launchPhase(nn);
    });
  });
  var total = campTotal(camp), rk = finalRank(total);
  $("map-camp").textContent = C.name + " (" + C.side + ") · fase 5 como " + (p5Role() === "flavio" ? "Flávio (fuga)" : "Moraes (perseguição)");
  $("map-total").innerHTML = "TOTAL <b>" + fmt(total) + "</b><br>" + rk.t + (rk.l !== "-" ? " · rank " + rk.l : "") + "<br>medalhas " + campMedals(camp) + "/6" + (META.done.lula && META.done.flavio ? "<br>⭐ final secreto liberado" : "");
  $("b-p5role").textContent = "Fase 5: " + (p5Role() === "flavio" ? "Flávio ⇄ Moraes" : "Moraes ⇄ Flávio");
  var dk = dateKey(), dd = META.daily[dk], dp = dailyPhase();
  $("b-daily").textContent = "📅 Desafio diário: fase " + dp + (dd ? " ✓ " + fmt(dd.sc) : "");
  $("map-hint").textContent = "";
  renderMapSocial(); chalRefresh();
}
function launchPhase(n, o) {
  o = o || {};
  if (n === 5 && !o.daily) { startP5(p5Role()); return; }
  startScene(n, { camp: META.camp, daily: o.daily, bot: o.bot });
}
function launchDaily() { var n = dailyPhase(); startScene(n, { camp: META.camp || "flavio", daily: true }); }

$("pick-lula").addEventListener("click", function () { pickCamp("lula"); });
$("pick-flavio").addEventListener("click", function () { pickCamp("flavio"); });
$("b-daily").addEventListener("click", function () { launchDaily(); });
$("b-switch").addEventListener("click", function () { showMenu(); });
$("b-p5role").addEventListener("click", function () { META.p5role[META.camp] = p5Role() === "flavio" ? "moraes" : "flavio"; metaSave(); showMap(); });
$("b-share").addEventListener("click", function () { shareResult(); });
$("b-again").addEventListener("click", function () {
  if (!lastRun) { showMap(); return; }
  if (lastRun.n === 5) startP5(state.side || p5Role());
  else startScene(lastRun.n, { camp: lastRun.camp, daily: lastRun.daily });
});
$("b-next").addEventListener("click", function () { if (lastRun && lastRun.n < 6) launchPhase(lastRun.n + 1); else showMap(); });
$("b-side").addEventListener("click", function () { showMap(); });
