"use strict";
/* ================= meta: fases, progresso, pontuação global, desafio diário ================= */

var PHASES = [null,
  { n: 1, ic: "🎙", name: "Debate da Globo", sub: "23/10/2026 · réplica no tempo certo", mins: "~2 min",
    fato: { t: "Segundo o Poder360, no debate Lula se confundiu e chamou Marisa Letícia de Janja. No jogo tudo é exagero; na vida real, a notícia é essa:", url: "https://www.poder360.com.br/poder-eleicoes-2026/lula-se-confunde-e-chama-marisa-leticia-de-janja/" } },
  { n: 2, ic: "💬", name: "Grupo da Família", sub: "WhatsApp · desvie de áudios de 8 min e boatos", mins: "~2 min",
    fato: { t: "O jogo Bad News (getbadnews.com) ensina, de forma lúdica, as técnicas usadas para fabricar desinformação, para você aprender a reconhecê-las. Jogue de verdade e desconfie de corrente de zap:", url: "https://www.getbadnews.com/" } },
  { n: 3, ic: "🗳", name: "Apuração", sub: "25/10 · a virada na barra de votos", mins: "~2 min",
    fato: { t: "Segundo o painel de apuração do Fonte Pública, o segundo turno fechou com Lula 51,79% × Flávio 48,21%. No jogo, o seu desempenho nunca muda esse resultado, e a “urna com zero voto” não existe:", url: "https://fontepublica.com.br/apuracao?turno=2" } },
  { n: 4, ic: "🥁", name: "Comemoração · A pauta do banheiro", sub: "ritmo, festa e uma pauta que nunca aparece", mins: "~2 min",
    fato: { t: "Segundo o Terra, Renan Santos mandou um recado para Lucas Pavanato e Eduarda Campopiano. No jogo, a “ameaça” do banheiro é pura piada com a obsessão da pauta:", url: "https://www.terra.com.br/noticias/renan-santos-manda-recado-para-lucas-pavanato-e-eduarda-campopiano,cab4f5953837ff16a9d817ad39626f7abhjsp5af.html" } },
  { n: 5, ic: "🚔", name: "Cadê o Flávio?", sub: "Ponte Tancredo Neves · fuja ou persiga", mins: "~4 min",
    fato: { t: "Segundo reportagem do Nexo, Flávio Bolsonaro, investigado, fugiu para a Argentina sem entregar o passaporte à PF. No jogo, tudo é exagero; na vida real, a notícia é essa:", url: "https://www.nexojornal.com.br/expresso/2026/10/27/flavio-bolsonaro-fugiu-argentina-pf-passaporte" } },
  { n: 6, ic: "🏛", name: "Governar é pior", sub: "Congresso, Centrão e a regulação das redes", mins: "~2 min",
    fato: { t: "No discurso da vitória (25/10), Lula disse sobre as redes: “nós vamos ter que regulá-las”. O trecho está neste vídeo; a regulação, na vida real, depende do Congresso:", url: "https://www.youtube.com/watch?v=zuSKIgcTozA&t=71s" } }
];

var CAMPS = {
  lula:   { key: "lula",   name: "Time Lula",   short: "Lula",   side: "Esquerda", kind: "lula",   foe: "flavio", p5: "moraes", col: "#ff8a80" },
  flavio: { key: "flavio", name: "Time Flávio", short: "Flávio", side: "Direita",  kind: "flavio", foe: "lula",   p5: "flavio", col: "#ffdf00" }
};

var META_KEY = "brs26_meta_v3";
function metaDefault() {
  return { camp: null, unlocked: { lula: 1, flavio: 1 }, best: { lula: {}, flavio: {} }, medal: { lula: {}, flavio: {} },
    done: { lula: 0, flavio: 0 }, p5role: { lula: "moraes", flavio: "flavio" }, daily: {}, secretSeen: 0 };
}
var META = metaDefault();
(function () {
  try {
    var raw = localStorage.getItem(META_KEY);
    if (raw) { var o = JSON.parse(raw), d = metaDefault(); for (var k in d) if (o[k] == null) o[k] = d[k]; META = o; }
  } catch (e) {}
})();
function metaSave() { try { localStorage.setItem(META_KEY, JSON.stringify(META)); } catch (e) {} }
function metaReset() { META = metaDefault(); metaSave(); }

function normScore(n, raw) { return n === 5 ? Math.round(raw / 3) : Math.round(raw); }   // fase 5 tem escala maior
function campTotal(camp) { var b = META.best[camp] || {}, t = 0; for (var n = 1; n <= 6; n++) t += b[n] || 0; return t; }
function campMedals(camp) { var m = META.medal[camp] || {}, c = 0; for (var n = 1; n <= 6; n++) if (m[n]) c++; return c; }
function isUnlocked(camp, n) { return n <= (META.unlocked[camp] || 1); }
function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

var FINAL_RANKS = [
  { min: 48000, l: "S", t: "Presidente do Brasil (no joguinho)" },
  { min: 36000, l: "A", t: "Articulador do Centrão" },
  { min: 24000, l: "B", t: "Deputado de Primeiro Mandato" },
  { min: 12000, l: "C", t: "Assessor Parlamentar" },
  { min: 1, l: "D", t: "Eleitor Indeciso" },
  { min: 0, l: "-", t: "Cidadão Cansado" }
];
function finalRank(total) { for (var i = 0; i < FINAL_RANKS.length; i++) if (total >= FINAL_RANKS[i].min) return FINAL_RANKS[i]; return FINAL_RANKS[FINAL_RANKS.length - 1]; }
function medalFor(perf) { return perf >= .85 ? "ouro" : perf >= .6 ? "prata" : "bronze"; }
function letterForPerf(perf) { return perf >= .9 ? "S" : perf >= .75 ? "A" : perf >= .55 ? "B" : perf >= .35 ? "C" : "D"; }
var MEDAL_RANK = { bronze: 1, prata: 2, ouro: 3 };

// registra o resultado de uma fase; devolve { isNew, total, unlockedNext }
function recordPhase(camp, n, rawScore, medal, won) {
  var sc = normScore(n, rawScore), prev = META.best[camp][n] || 0, isNew = false, un = false;
  if (won) {
    if (sc > prev) { META.best[camp][n] = sc; isNew = true; }
    var pm = META.medal[camp][n];
    if (medal && (!pm || MEDAL_RANK[medal] > MEDAL_RANK[pm])) META.medal[camp][n] = medal;
    if (n < 6 && (META.unlocked[camp] || 1) < n + 1) { META.unlocked[camp] = n + 1; un = true; }
    if (n === 6) META.done[camp] = 1;
  }
  metaSave();
  return { isNew: isNew, total: campTotal(camp), unlockedNext: un, sc: sc, prev: prev };
}

/* ---- desafio diário (semente por data, estilo Wordle) ---- */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function dateKey(d) { d = d || new Date(); return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
function dailySeed(key) { key = key || dateKey(); var h = 2166136261; for (var i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function dailyPhase(key) { return [1, 2, 3, 4, 6][dailySeed(key) % 5]; }   // fase 5 é longa demais pro diário
var GRID_EMO = { g: "🟩", y: "🟨", r: "🟥" };
