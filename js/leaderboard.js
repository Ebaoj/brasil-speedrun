"use strict";
/* ================= placar global: cliente da API + fallback local (localStorage) ================= */
var LB_API = "https://brasil-speedrun-lb.joabecornelio.workers.dev";
var LB_TIMEOUT = 4500;
var PROF_KEY = "brs26_profile_v1", LOC_KEY = "brs26_lb_local_v1", LOC_MAX = 200;
var LB = { online: null, last: null };   // online: null = ainda não tentou · true · false (offline: usando placar local)

/* ---- perfil: apelido, pontos acumulados (cargo), sequência de dias ---- */
function profDefault() { return { nick: "", cum: 0, runs: 0, streak: 0, bestStreak: 0, lastDay: "", challenge: null }; }
var PROFILE = profDefault();
(function () { try { var o = JSON.parse(localStorage.getItem(PROF_KEY) || "null"); if (o) { var d = profDefault(); for (var k in d) if (o[k] == null) o[k] = d[k]; PROFILE = o; } } catch (e) {} })();
function profSave() { try { localStorage.setItem(PROF_KEY, JSON.stringify(PROFILE)); } catch (e) {} }
function profReset(nick) { PROFILE = profDefault(); if (nick) PROFILE.nick = nick; profSave(); try { localStorage.removeItem(LOC_KEY); } catch (e) {} }
function cleanNickC(s) { return String(s == null ? "" : s).replace(/[\u0000-\u001f<>&"'`\\]/g, "").replace(/[^\p{L}\p{N} ._\-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 16); }

var CAREER = [
  { min: 0, t: "Estagiário de Gabinete" }, { min: 4000, t: "Assessor" }, { min: 12000, t: "Vereador" }, { min: 30000, t: "Deputado" },
  { min: 65000, t: "Senador" }, { min: 120000, t: "Ministro" }, { min: 200000, t: "Presidente" }, { min: 350000, t: "Supremo" }
];
function careerOf(cum) {
  var i = 0; while (i + 1 < CAREER.length && cum >= CAREER[i + 1].min) i++;
  return { i: i, t: CAREER[i].t, min: CAREER[i].min, next: CAREER[i + 1] || null };
}
function campSide(camp) { return camp === "lula" ? "esquerda" : "direita"; }
function dayDiff(a, b) { return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 864e5); }
// registra uma corrida concluída: acumula pontos e atualiza a sequência diária
function profTouch(score) {
  var day = dateKey();
  PROFILE.cum += Math.max(0, Math.round(score)); PROFILE.runs++;
  if (PROFILE.lastDay !== day) { PROFILE.streak = PROFILE.lastDay && dayDiff(PROFILE.lastDay, day) === 1 ? PROFILE.streak + 1 : 1; PROFILE.lastDay = day; }
  PROFILE.bestStreak = Math.max(PROFILE.bestStreak, PROFILE.streak);
  profSave();
}

/* ---- chaves de escopo (iguais às do worker) ---- */
function isoWeekC(day) {
  var p = day.split("-").map(Number), dt = new Date(Date.UTC(p[0], p[1] - 1, p[2])), dow = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - dow);
  var y0 = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  return dt.getUTCFullYear() + "-W" + pad2(Math.ceil(((dt - y0) / 864e5 + 1) / 7));
}
function lbKey(scope, o) {
  o = o || {};
  if (scope === "side") return "side:" + o.side;
  if (scope === "phase") return "phase:" + o.phase;
  if (scope === "daily") return "daily:" + (o.seed || dateKey());
  if (scope === "weekly") return "weekly:" + isoWeekC(o.day || dateKey());
  return "global";
}
function lbQuery(scope, o) {
  o = o || {}; var q = "scope=" + scope;
  if (scope === "side") q += "&side=" + o.side;
  if (scope === "phase") q += "&phase=" + o.phase;
  if (scope === "daily") q += "&seed=" + encodeURIComponent(o.seed || dateKey());
  if (scope === "weekly") q += "&day=" + dateKey();
  return q;
}

/* ---- rede ---- */
function lbSetOnline(v) { LB.online = v; if (typeof lbStatusUI === "function") lbStatusUI(); }
function lbFetch(path, body) {
  var ctl = window.AbortController ? new AbortController() : null, to = setTimeout(function () { if (ctl) ctl.abort(); }, LB_TIMEOUT);
  var opt = body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {};
  if (ctl) opt.signal = ctl.signal;
  return fetch(LB_API + path, opt).then(function (r) {
    clearTimeout(to);
    return r.json().then(function (j) { if (!j || (!r.ok && !j.error)) throw new Error("http " + r.status); lbSetOnline(true); return j; });
  }, function (e) { clearTimeout(to); lbSetOnline(false); throw e; });
}

/* ---- placar local (mesmo formato do servidor; só enxerga este aparelho) ---- */
function locLoad() { try { var o = JSON.parse(localStorage.getItem(LOC_KEY) || "null"); if (o && o.boards) return o; } catch (e) {} return { boards: {}, torcida: {} }; }
function locSave(o) { try { localStorage.setItem(LOC_KEY, JSON.stringify(o)); } catch (e) {} }
function rankInC(list, score, nick) {
  var me = nick ? nick.toLowerCase() : null, others = me ? list.filter(function (x) { return x.nick.toLowerCase() !== me; }) : list;
  var above = others.filter(function (x) { return x.score > score; }), pos = above.length + 1, total = others.length + 1, nx = above.length ? above[above.length - 1] : null;
  var beaten = Math.round(100 * (total - pos) / total);
  return { position: pos, total: total, percentile: beaten, top: Math.max(1, 100 - beaten), next: nx ? { nick: nx.nick, score: nx.score } : null, gap: nx ? nx.score - score + 1 : 0 };
}
function locKeys(p) {
  if (p.daily) return ["daily:" + p.daily];
  if (p.phase === "all") return ["global", "side:" + p.side, "weekly:" + isoWeekC(p.day || dateKey())];
  return ["phase:" + p.phase];
}
function locSubmit(p) {
  var db = locLoad(), keys = locKeys(p), res = null, k, i;
  keys.forEach(function (key, ix) {
    var list = db.boards[key] || [], j = -1, prev = 0, record = true, nk = p.nick.toLowerCase();
    for (i = 0; i < list.length; i++) if (list[i].nick.toLowerCase() === nk) j = i;
    if (j >= 0) { prev = list[j].score; if (p.score > prev) list.splice(j, 1); else record = false; }
    if (record) list.push({ nick: p.nick, side: p.side, score: p.score, time: p.time, phase: p.phase, t: Math.floor(Date.now() / 1000) });
    list.sort(function (a, b) { return b.score - a.score || a.time - b.time; });
    db.boards[key] = list.slice(0, LOC_MAX);
    if (ix === 0) res = Object.assign({ record: record && p.score > prev, prev: prev }, rankInC(db.boards[key], p.score, p.nick));
  });
  if (p.phase !== "all") { var d = p.day || dateKey(), t = db.torcida[d] || (db.torcida[d] = { esquerda: { pts: 0, runs: 0 }, direita: { pts: 0, runs: 0 } }); t[p.side].pts += p.score; t[p.side].runs++; }
  locSave(db); return res;
}

/* ---- API pública: sempre resolve (cai pro local se a rede falhar) ---- */
function lbSubmit(p) {
  var body = { nick: p.nick, side: p.side, phase: p.phase, score: p.score, time: p.time, char: p.char, day: dateKey() };
  if (p.daily) body.daily = p.daily;
  var loc = locSubmit(Object.assign({ day: body.day }, p));
  return lbFetch("/submit", body).then(function (j) {
    if (j.ok) { j.online = true; LB.last = j; return j; }
    if (/^nick_/.test(j.error)) return { ok: false, error: j.error, online: true };
    loc.online = true; loc.apiError = j.error; return loc;   // rate limit / sanity: mostra o ranking local
  }, function () { loc.online = false; return loc; });
}
function lbTop(scope, o) {
  var key = lbKey(scope, o);
  return lbFetch("/top?" + lbQuery(scope, o) + "&n=50").then(function (j) {
    if (!j.ok) throw new Error(j.error);
    return { online: true, key: key, entries: j.entries, total: j.total };
  }).catch(function () { var l = locLoad().boards[key] || []; return { online: false, key: key, entries: l.slice(0, 50), total: l.length }; });
}
function lbTorcida() {
  return lbFetch("/torcida?day=" + dateKey()).then(function (j) { if (!j.ok) throw new Error(j.error); j.online = true; return j; })
    .catch(function () {
      var t = locLoad().torcida[dateKey()] || { esquerda: { pts: 0, runs: 0 }, direita: { pts: 0, runs: 0 } }, s = t.esquerda.pts + t.direita.pts;
      return { online: false, day: dateKey(), esquerda: t.esquerda, direita: t.direita, pctEsquerda: s ? Math.round(1000 * t.esquerda.pts / s) / 10 : 50 };
    });
}
function lbRank(score, scope, o) {
  return lbFetch("/rank?" + lbQuery(scope, o) + "&score=" + Math.round(score) + (PROFILE.nick ? "&nick=" + encodeURIComponent(PROFILE.nick) : "")).then(function (j) {
    if (!j.ok) throw new Error(j.error); j.online = true; return j;
  }).catch(function () { var r = rankInC(locLoad().boards[lbKey(scope, o)] || [], score, PROFILE.nick); r.online = false; return r; });
}
