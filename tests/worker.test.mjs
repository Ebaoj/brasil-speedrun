// node tests/worker.test.mjs — testa worker/worker.js com KV falso em memória
import W, { cleanNick, isProfane, isoWeek } from "../worker/worker.js";
import { makeKV } from "./fakekv.mjs";
let n = 0, bad = 0;
const ok = (name, c, d) => { n++; if (!c) bad++; console.log((c ? "PASS " : "FAIL ") + name + (d ? " — " + d : "")); };
const BASE = "https://x.test";
let ipN = 0;
const call = async (env, path, body, ip) => {
  const init = body ? { method: "POST", body: JSON.stringify(body), headers: { "cf-connecting-ip": ip || "ip" + ++ipN } } : { headers: { "cf-connecting-ip": ip || "ip" + ++ipN } };
  const r = await W.fetch(new Request(BASE + path, init), env);
  return { status: r.status, h: r.headers, j: await r.json() };
};
const sub = (env, o, ip) => call(env, "/submit", { nick: "Ana", side: "esquerda", phase: 1, score: 1000, time: 60, ...o }, ip);
const today = new Date().toISOString().slice(0, 10);

let env = { LB: makeKV() };
// CORS + preflight
let r = await W.fetch(new Request(BASE + "/submit", { method: "OPTIONS" }), env);
ok("OPTIONS 204 com CORS *", r.status === 204 && r.headers.get("access-control-allow-origin") === "*");
r = await call(env, "/top?scope=global");
ok("GET /top vazio + CORS", r.j.ok && r.j.entries.length === 0 && r.h.get("access-control-allow-origin") === "*");
r = await call(env, "/nada"); ok("rota inexistente 404", r.status === 404);

// submit básico e ranking
r = await sub(env, {}); ok("submit ok, 1º lugar", r.j.ok && r.j.position === 1 && r.j.total === 1 && r.j.record === true, JSON.stringify(r.j));
await sub(env, { nick: "Beto", score: 3000 }); await sub(env, { nick: "Caio", score: 2000, side: "direita" });
r = await call(env, "/top?scope=phase&phase=1");
ok("top da fase ordenado por score", r.j.entries.map(e => e.nick).join() === "Beto,Caio,Ana", r.j.entries.map(e => e.nick).join());
r = await sub(env, { nick: "ana", score: 900 });
ok("mesmo apelido (sem diferenciar caixa) mantém só a melhor marca", r.j.ok && r.j.record === false && (await call(env, "/top?scope=phase&phase=1")).j.total === 3);
r = await sub(env, { nick: "ANA", score: 2500 });
ok("melhoria substitui e marca recorde", r.j.record === true && r.j.prev === 1000 && r.j.position === 2, JSON.stringify(r.j));

// rank
r = await call(env, "/rank?scope=phase&phase=1&score=2200&nick=Zed");
ok("rank: posição, total, percentil e próximo acima", r.j.position === 3 && r.j.total === 4 && r.j.next.nick === "ANA" && r.j.next.score === 2500 && r.j.gap === 301 && r.j.top >= 1 && r.j.percentile === 25, JSON.stringify(r.j));
r = await call(env, "/rank?scope=phase&phase=1&score=99999");
ok("rank 1º lugar sem próximo", r.j.position === 1 && r.j.next === null);
r = await call(env, "/rank?scope=phase&phase=9&score=10"); ok("rank com escopo inválido = 400", r.status === 400);
r = await call(env, "/rank?scope=global&score=10"); ok("rank global vazio", r.j.ok && r.j.position === 1 && r.j.total === 1);

// escopos: all -> global + side + weekly ; daily isolado
await sub(env, { nick: "Dani", phase: "all", score: 20000, time: 900, side: "direita" });
const g = (await call(env, "/top?scope=global")).j, sd = (await call(env, "/top?scope=side&side=direita")).j, se = (await call(env, "/top?scope=side&side=esquerda")).j, wk = (await call(env, "/top?scope=weekly")).j;
ok("phase 'all' entra em global, side e weekly", g.total === 1 && sd.total === 1 && se.total === 0 && wk.total === 1 && wk.scope === "weekly:" + isoWeek(today), wk.scope);
await sub(env, { nick: "Edu", daily: today, score: 4000 });
const dl = (await call(env, "/top?scope=daily")).j;
ok("daily tem placar próprio (semente = hoje por padrão)", dl.scope === "daily:" + today && dl.entries.length === 1 && (await call(env, "/top?scope=phase&phase=1")).j.total === 3);
ok("daily não vaza para fase/global", (await call(env, "/top?scope=global")).j.total === 1);
const dsd = (await call(env, "/top?scope=daily&seed=2020-01-01")).j; ok("daily de outra semente vazio", dsd.total === 0);
ok("isoWeek correto (2026-10-28 = W44, 2021-01-03 = 2020-W53)", isoWeek("2026-10-28") === "2026-W44" && isoWeek("2021-01-03") === "2020-W53");

// torcida
r = await call(env, "/torcida");
ok("torcida soma por lado só de corridas (o 'all' não duplica)", r.j.ok && r.j.esquerda.runs === 5 && r.j.direita.runs === 1 && r.j.esquerda.pts === 11400 && r.j.direita.pts === 2000, JSON.stringify(r.j));
const t = r.j; ok("torcida: pct e totais coerentes", t.esquerda.pts + t.direita.pts > 0 && Math.abs(t.pctEsquerda - 100 * t.esquerda.pts / (t.esquerda.pts + t.direita.pts)) < 0.1, `E=${t.esquerda.pts}/${t.esquerda.runs} D=${t.direita.pts}/${t.direita.runs} ${t.pctEsquerda}%`);
r = await call({ LB: makeKV() }, "/torcida"); ok("torcida vazia = 50%", r.j.pctEsquerda === 50 && r.j.esquerda.runs === 0);

// validações
const V = async (o, code, label) => { const x = await sub({ LB: env.LB }, o); ok(label, x.status === 400 && x.j.error === code, x.j.error); };
await V({ nick: "a" }, "nick_invalido", "nick curto (1) rejeitado");
await V({ nick: "x".repeat(17) }, "nick_invalido", "nick longo (17) rejeitado");
await V({ nick: "<b>" }, "nick_invalido", "nick só com tags vira vazio e é rejeitado");
await V({ nick: "Seu Puta" }, "nick_bloqueado", "palavrão pt-BR bloqueado");
await V({ nick: "f.u.c.k" }, "nick_bloqueado", "palavrão en disfarçado bloqueado");
await V({ nick: "Ana", side: "centro" }, "lado_invalido", "lado inválido");
await V({ phase: 7 }, "fase_invalida", "fase 7 inválida");
await V({ phase: "x" }, "fase_invalida", "fase 'x' inválida");
await V({ score: -5 }, "score_invalido", "score negativo");
await V({ score: 1e9 }, "score_invalido", "score acima do máximo da fase");
await V({ score: "abc" }, "score_invalido", "score não numérico");
await V({ phase: "all", score: 6 * 40000 + 1 }, "score_invalido", "total acima do máximo");
await V({ score: 30000, time: 10 }, "score_implausivel", "score impossível para o tempo");
await V({ time: 2 }, "score_implausivel", "tempo curto demais");
await V({ time: 99999 }, "tempo_invalido", "tempo acima do limite");
await V({ daily: "../../x" }, "daily_invalido", "semente de daily inválida");
r = await W.fetch(new Request(BASE + "/submit", { method: "POST", body: "{nope", headers: { "cf-connecting-ip": "j" } }), { LB: makeKV() });
ok("JSON inválido = 400", r.status === 400);
ok("cleanNick sanitiza", cleanNick("  <Zé>  do   \"Zap\" ") === "Zé do Zap", cleanNick("  <Zé>  do   \"Zap\" "));
ok("filtro não pega falsos positivos", !isProfane("Computador") && !isProfane("Grape") && !isProfane("Fulano") && isProfane("FDP") && isProfane("v1ad0 puta"));

// limite por IP
const e2 = { LB: makeKV() }; let last;
for (let i = 0; i < 12; i++) last = await sub(e2, { nick: "Rate" + i }, "1.2.3.4");
ok("11º envio do mesmo IP no minuto = 429", last.status === 429 && last.j.error === "rate_limited");
r = await sub(e2, { nick: "Outro" }, "9.9.9.9"); ok("outro IP não é afetado", r.status === 200);
const rl = [...e2.LB.m.entries()].find(([k]) => k.startsWith("rl:1.2.3.4")); ok("contador de rate-limit usa TTL", rl && rl[1].ttl >= 60);

// top 200
const e3 = { LB: makeKV() };
for (let i = 0; i < 205; i++) await sub(e3, { nick: "Jogador" + i, score: 1000 + i }, "ip" + i);
r = await call(e3, "/top?scope=phase&phase=1&n=500");
ok("lista mantém só o top 200 (ordenado)", r.j.total === 200 && r.j.entries[0].score === 1204 && r.j.entries[199].score === 1005, r.j.total);
r = await call(e3, "/top?scope=phase&phase=1&n=5"); ok("n limita a resposta", r.j.entries.length === 5);
r = await call(e3, "/rank?scope=phase&phase=1&score=10"); ok("rank abaixo do top 200 informa posição > 200", r.j.position === 201 + 0 || r.j.position > 200, r.j.position);
const kb = (await e3.LB.get("top:phase:1")).length; ok("KV eficiente: 200 entradas em < 40 KB", kb < 40000, kb + " bytes");
ok("daily/weekly gravados com TTL", env.LB.m.get("top:daily:" + today).ttl > 86400 && env.LB.m.get("top:weekly:" + isoWeek(today)).ttl > 86400 && env.LB.m.get("torcida:" + today).ttl > 0);
console.log(`\n${n - bad}/${n} checks OK`);
process.exit(bad ? 1 : 0);
