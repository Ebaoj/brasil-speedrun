/* Brasil Speedrun 2026 — placar global (Cloudflare Worker, módulo ES, KV binding: LB)
   Deploy: https://brasil-speedrun-lb.joabecornelio.workers.dev
   Chaves KV: top:<escopo> (JSON, top 200) · torcida:<dia> · rl:<ip>:<minuto> (TTL)
   Escopos: global | side:<lado> | phase:<n> | daily:<semente> | weekly:<AAAA-Www> */

const TOP_MAX = 200, RATE_MAX = 10;
const MAX_PHASE = 40000, MAX_ALL = 6 * MAX_PHASE, MAX_TIME = 7200, MAX_RATE_PER_SEC = 1500;
const SIDES = ["esquerda", "direita"];
const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type", "access-control-max-age": "86400" };

// lista pequena pt-BR + en; comparada sem acento, sem símbolos e com leetspeak desfeito
const BAD_SUB = ["caralho", "porra", "merda", "bosta", "cuzao", "buceta", "xereca", "viado", "arrombado", "filhodaputa", "vagabundo", "babaca", "retardado", "macaco", "hitler", "estuprador", "estupro", "pedofilo", "fuck", "shit", "bitch", "cunt", "pussy", "nigger", "faggot", "whore", "asshole"];
const BAD_WORD = ["puta", "puto", "cu", "fdp", "bicha", "otario", "idiota", "nazi", "dick", "cock", "rape", "slut", "nigga"];   // palavras curtas: só como palavra inteira (evita "computador", "grape")

const json = (obj, status) => new Response(JSON.stringify(obj), { status: status || 200, headers: { ...CORS, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const err = (status, code) => json({ ok: false, error: code }, status);

export function cleanNick(raw) {
  let s = String(raw == null ? "" : raw).normalize("NFC").replace(/[\u0000-\u001f\u007f<>&"'`\\]/g, "").replace(/\s+/g, " ").trim();
  s = s.replace(/[^\p{L}\p{N} ._\-]/gu, "").trim();
  return s;
}
export function isProfane(nick) {
  let t = nick.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[@4]/g, "a").replace(/3/g, "e").replace(/[1!|]/g, "i").replace(/0/g, "o").replace(/\$|5/g, "s").replace(/7/g, "t");
  const squash = t.replace(/[^a-z]/g, "");
  const words = t.split(/[^a-z]+/).filter(Boolean);
  return BAD_SUB.some(b => squash.includes(b)) || BAD_WORD.some(b => squash === b || words.includes(b));
}

const pad = n => String(n).padStart(2, "0");
const utcDay = (d = new Date()) => d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
export function isoWeek(day) {   // "AAAA-MM-DD" -> "AAAA-Www" (ISO 8601)
  const [y, m, d] = day.split("-").map(Number), dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay() || 7; dt.setUTCDate(dt.getUTCDate() + 4 - dow);
  const y0 = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  return dt.getUTCFullYear() + "-W" + pad(Math.ceil(((dt - y0) / 864e5 + 1) / 7));
}
const validDay = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && Math.abs(Date.parse(s + "T00:00:00Z") - Date.now()) < 3 * 864e5;

async function readList(env, key) {
  const raw = await env.LB.get("top:" + key);
  if (!raw) return [];
  try { const a = JSON.parse(raw); return Array.isArray(a) ? a : []; } catch (e) { return []; }
}
// melhor marca por apelido (sem diferenciar maiúsculas); ordena por score desc, depois tempo asc
function upsert(list, e) {
  const k = e.nick.toLowerCase(), i = list.findIndex(x => x.nick.toLowerCase() === k);
  let prev = 0, record = true;
  if (i >= 0) { prev = list[i].score; if (e.score > prev || (e.score === prev && e.time < list[i].time)) list.splice(i, 1); else record = false; }
  if (record) list.push(e);
  list.sort((a, b) => b.score - a.score || a.time - b.time || a.t - b.t);
  return { list: list.slice(0, TOP_MAX), prev, changed: record, record: record && e.score > prev };
}
function rankIn(list, score, nick) {
  const me = nick ? nick.toLowerCase() : null, others = me ? list.filter(x => x.nick.toLowerCase() !== me) : list;
  const above = others.filter(x => x.score > score), position = above.length + 1, total = others.length + 1;
  const next = above.length ? above[above.length - 1] : null;
  const beaten = Math.round(100 * (total - position) / total);
  return { position, total, percentile: beaten, top: Math.max(1, 100 - beaten), next: next ? { nick: next.nick, score: next.score } : null, gap: next ? next.score - score + 1 : 0, full: list.length >= TOP_MAX && position > TOP_MAX };
}

function scopeKey(q, today) {
  const scope = q.get("scope") || "global";
  if (scope === "global") return "global";
  if (scope === "side") { const s = q.get("side"); return SIDES.includes(s) ? "side:" + s : null; }
  if (scope === "phase") { const p = parseInt(q.get("phase"), 10); return p >= 1 && p <= 6 ? "phase:" + p : null; }
  if (scope === "daily") { const s = q.get("seed") || today; return /^[\w-]{1,24}$/.test(s) ? "daily:" + s : null; }
  if (scope === "weekly") { const day = q.get("day"); return "weekly:" + isoWeek(day && validDay(day) ? day : today); }
  return null;
}
const ttlFor = key => key.startsWith("daily:") ? 9 * 86400 : key.startsWith("weekly:") ? 15 * 86400 : undefined;

async function rateLimited(req, env) {
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "anon";
  const k = "rl:" + ip + ":" + Math.floor(Date.now() / 60000), n = parseInt(await env.LB.get(k) || "0", 10);
  if (n >= RATE_MAX) return true;
  await env.LB.put(k, String(n + 1), { expirationTtl: 90 });
  return false;
}

async function submit(req, env) {
  if (await rateLimited(req, env)) return err(429, "rate_limited");
  let b; try { b = await req.json(); } catch (e) { return err(400, "json_invalido"); }
  if (!b || typeof b !== "object") return err(400, "json_invalido");
  const nick = cleanNick(b.nick);
  if (nick.length < 2 || nick.length > 16) return err(400, "nick_invalido");
  if (isProfane(nick)) return err(400, "nick_bloqueado");
  if (!SIDES.includes(b.side)) return err(400, "lado_invalido");
  const all = b.phase === "all", ph = all ? 0 : parseInt(b.phase, 10);
  if (!all && !(ph >= 1 && ph <= 6)) return err(400, "fase_invalida");
  const score = Math.round(Number(b.score)), time = Math.round(Number(b.time) * 10) / 10;
  if (!Number.isFinite(score) || score < 0 || score > (all ? MAX_ALL : MAX_PHASE)) return err(400, "score_invalido");
  if (!Number.isFinite(time) || time < 0 || time > (all ? 86400 * 30 : MAX_TIME)) return err(400, "tempo_invalido");
  if (!all && score > 0 && (time < 5 || score > MAX_RATE_PER_SEC * time + 3000)) return err(400, "score_implausivel");
  let seed = null;
  if (b.daily != null && b.daily !== "") { seed = String(b.daily); if (!/^[\w-]{1,24}$/.test(seed)) return err(400, "daily_invalido"); }
  const today = utcDay(), day = b.day && validDay(String(b.day)) ? String(b.day) : today;
  const e = { nick, side: b.side, score, time, phase: all ? "all" : ph, t: Math.floor(Date.now() / 1000) };
  if (b.char && /^[a-z]{3,12}$/.test(String(b.char))) e.char = String(b.char);

  // quais placares recebem esta marca
  let keys;
  if (seed) keys = ["daily:" + seed];
  else if (all) keys = ["global", "side:" + b.side, "weekly:" + isoWeek(day)];
  else keys = ["phase:" + ph];
  const mainKey = keys[0], out = {};
  for (const key of keys) {
    const cur = await readList(env, key), r = upsert(cur, { ...e });
    if (r.changed) await env.LB.put("top:" + key, JSON.stringify(r.list), ttlFor(key) ? { expirationTtl: ttlFor(key) } : undefined);
    out[key] = { prev: r.prev, record: r.record, list: r.list };
  }
  // torcida: soma pontos/corridas por lado no dia (corridas de fase e diário; o total 'all' duplicaria)
  if (!all) {
    const tk = "torcida:" + day, t = JSON.parse((await env.LB.get(tk)) || "null") || { esquerda: { pts: 0, runs: 0 }, direita: { pts: 0, runs: 0 } };
    t[b.side].pts += score; t[b.side].runs += 1;
    await env.LB.put(tk, JSON.stringify(t), { expirationTtl: 3 * 86400 });
  }
  const main = out[mainKey], rk = rankIn(main.list, score, nick);
  return json({ ok: true, scope: mainKey, record: main.record, prev: main.prev, ...rk, nick });
}

async function top(q, env) {
  const key = scopeKey(q, utcDay());
  if (!key) return err(400, "escopo_invalido");
  const n = Math.min(TOP_MAX, Math.max(1, parseInt(q.get("n"), 10) || 50)), list = await readList(env, key);
  return json({ ok: true, scope: key, total: list.length, entries: list.slice(0, n) });
}
async function torcida(q, env) {
  const day = q.get("day") && validDay(q.get("day")) ? q.get("day") : utcDay();
  const t = JSON.parse((await env.LB.get("torcida:" + day)) || "null") || { esquerda: { pts: 0, runs: 0 }, direita: { pts: 0, runs: 0 } };
  const sum = t.esquerda.pts + t.direita.pts;
  return json({ ok: true, day, esquerda: t.esquerda, direita: t.direita, pctEsquerda: sum ? Math.round(1000 * t.esquerda.pts / sum) / 10 : 50 });
}
async function rank(q, env) {
  const key = scopeKey(q, utcDay()), score = Math.round(Number(q.get("score")));
  if (!key || !Number.isFinite(score) || score < 0) return err(400, "parametros_invalidos");
  const nick = cleanNick(q.get("nick") || "") || null;
  return json({ ok: true, scope: key, ...rankIn(await readList(env, key), score, nick) });
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    const url = new URL(req.url), p = url.pathname.replace(/\/+$/, "") || "/";
    try {
      if (req.method === "POST" && p === "/submit") return await submit(req, env);
      if (req.method === "GET" && p === "/top") return await top(url.searchParams, env);
      if (req.method === "GET" && p === "/torcida") return await torcida(url.searchParams, env);
      if (req.method === "GET" && p === "/rank") return await rank(url.searchParams, env);
      if (req.method === "GET" && p === "/") return json({ ok: true, name: "brasil-speedrun-lb" });
      return err(404, "nao_encontrado");
    } catch (e) { return err(500, "erro_interno"); }
  }
};
