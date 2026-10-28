// ONLY=social node tests/verify.mjs  roda só a parte do placar/engajamento/vozes
// Uso: python3 -m http.server 8137 (na raiz do jogo) ; node tests/verify.mjs   (playwright em /workspace/bsr_tmp)
// v2 = fase 5 (Flávio/Moraes) · v3 = jogo completo: mapa, fases 1-6, lados, desbloqueio, diário, final secreto
import { createRequire } from "module";
const require = createRequire("/workspace/bsr_tmp/");
const { chromium } = require("playwright");
import fs from "fs";
import Worker from "../worker/worker.js";
import { makeKV } from "./fakekv.mjs";
const PAGE = process.env.URL || "http://127.0.0.1:8137/index.html";
const OUT = new URL("../shots/", import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const errors = [], shots = [], checks = [];
const API = "**/brasil-speedrun-lb.joabecornelio.workers.dev/**";
// API falsa determinística: roda o worker de verdade sobre um KV em memória (um por contexto de navegador)
async function mockAPI(ctx, kv = makeKV(), o = {}) {
  const env = { LB: kv }; let ip = 0;
  await ctx.route(API, async route => {
    const req = route.request(), cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-methods": "GET,POST,OPTIONS" };
    if (o.offline) return route.abort("failed");
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    const r = await Worker.fetch(new Request(req.url(), { method: req.method(), body: req.method() === "POST" ? req.postData() : undefined, headers: { "cf-connecting-ip": "t" + ++ip } }), env);
    await route.fulfill({ status: r.status, headers: { ...cors, "content-type": "application/json" }, body: await r.text() });
  });
  return { kv, env, call: (path, body) => Worker.fetch(new Request("https://x.test" + path, body ? { method: "POST", body: JSON.stringify(body), headers: { "cf-connecting-ip": "seed" + ++ip } } : { headers: { "cf-connecting-ip": "seed" + ++ip } }), env).then(r => r.json()) };
}
const ok = (n, c, d) => { checks.push({ n, ok: !!c }); console.log((c ? "PASS " : "FAIL ") + n + (d ? " — " + d : "")); };

async function run(label, ctxOpts) {
  const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const ctx = await browser.newContext(ctxOpts); await mockAPI(ctx);
  const page = await ctx.newPage();
  page.on("console", m => { if (m.type() === "error") errors.push(`[${label}] console: ${m.text()}`); });
  page.on("pageerror", e => errors.push(`[${label}] pageerror: ${e.message}`));
  const shot = async (name) => { const f = `v2-${label}-${name}.png`; await page.screenshot({ path: OUT + f }); shots.push(f); };
  const T = (fn, ...a) => page.evaluate(([f, a]) => window.__test[f](...a), [fn, a]);
  await page.goto(PAGE); await page.waitForTimeout(600);
  ok(`${label} __test presente`, await page.evaluate(() => typeof window.__test === "object"));
  await shot("select");
  await T("gallery"); await page.waitForTimeout(150); await shot("gallery"); await T("gallery", false);

  // ===== Flávio: 4 etapas + chefes =====
  await T("start", "flavio"); await T("god", true);
  for (let n = 1; n <= 4; n++) {
    await T("gotoStage", n); await T("step", 3.2);
    let s = await T("step", 6);
    await shot(`flavio-etapa${n}`);
    ok(`${label} flavio etapa ${n} roda`, s.stage === n && s.running, s.stageName);
    // avança até o chefe
    let boss = null;
    for (let i = 0; i < 90 && !boss; i++) { s = await T("step", 2, true); if (s.boss) boss = s.boss; if (s.over) break; }
    if (n === 3) { for (let i = 0; i < 20; i++) { s = await T("step", 1, true); } }
    s = await T("step", 4);
    ok(`${label} flavio chefe etapa ${n}`, !!s.boss, s.boss && s.boss.name);
    await shot(`flavio-boss${n}`);
  }
  // poderes Flávio + juice
  await T("gotoStage", 1); await T("step", 4, true);
  for (const p of ["arminha", "biblia", "cartaz", "bone"]) { const r = await T("usePower", p); ok(`${label} poder ${p}`, r && r.ok !== false, JSON.stringify(r).slice(0, 60)); await T("step", .3); if (p === "cartaz") await shot("powers-flavio"); }
  await T("step", .4); await shot("powers-juice");
  // cameo + balão de voz
  await T("gotoStage", 3); await T("cameo"); await T("step", 1.2); await shot("cameo-campopiano");
  const sv = await T("step", 6, true);
  await T("gotoStage", 2); await T("step", 4); await shot("balloon-voice");
  const vl = await T("voiceLog"); ok(`${label} clipe de voz disparado`, vl.length > 0, vl.map(v => v.id).join(","));
  // near miss: joga sem god com zigue-zague até contar um raspão
  await T("gotoStage", 2); await T("god", false); let nm = false;
  for (let i = 0; i < 400 && !nm; i++) {
    await T("setInput", 0, Math.sin(i / 7)); await T("step", .1, true);
    nm = await page.evaluate(() => { const g = window.__test.world(); return !!(g && g.st && g.st.near > 0); });
    if (nm) { await T("step", .12); }
  }
  await T("setInput", null);
  ok(`${label} near-miss disparado`, nm);

  await shot("near-miss");
  // game over + win + share card
  await T("finish", false); await page.waitForTimeout(1500); await shot("gameover-flavio");
  let st = await T("state"); ok(`${label} game over flavio`, st.over && st.won === false);
  await page.screenshot({ path: OUT + `v2-${label}-share-card.png` }); shots.push(`v2-${label}-share-card.png`);
  await T("start", "flavio"); await T("finish", true); await page.waitForTimeout(1500); await shot("win-flavio");
  st = await T("state"); ok(`${label} win flavio`, st.over && st.won === true);
  const img = await page.evaluate(() => document.getElementById("r-img").src.length); ok(`${label} cartão compartilhável`, img > 5000);
  await page.evaluate(() => { const b = document.getElementById("r-img"); b.scrollIntoView(); });

  // ===== Moraes: 4 rodadas =====
  await T("start", "moraes"); await T("god", true);
  for (let n = 1; n <= 4; n++) {
    await T("gotoStage", n); await T("step", 3.5); let s = await T("step", 3);
    await shot(`moraes-rodada${n}`);
    ok(`${label} moraes rodada ${n}`, s.stage === n && s.running, s.stageName);
  }
  await T("gotoStage", 2); await T("step", 3, true);
  for (const p of ["canetada", "toga", "bloqueio", "inquerito"]) { const r = await T("usePower", p); ok(`${label} poder ${p}`, r && r.ok !== false, JSON.stringify(r).slice(0, 60)); await T("step", .25); if (p === "bloqueio") await shot("powers-moraes"); }
  await T("skipStage"); await T("skipStage"); await T("skipStage"); await T("step", .5);
  await T("finish", true); await page.waitForTimeout(1500); await shot("win-moraes");
  await T("start", "moraes"); await T("finish", false); await page.waitForTimeout(1500); await shot("gameover-moraes");
  // mobile: clique real nos cartões
  await T("start", "flavio"); await T("step", 2); 
  const logs = await T("voiceLog"); ok(`${label} voz registrada`, logs.every(v => v.file && v.character));
  await browser.close();
}

/* ================= v3: jogo completo (mapa + 6 fases, dois lados) ================= */
const PH = { 1: "Debate da Globo", 2: "Grupo da Família", 3: "Apuração", 4: "Comemoração", 5: "Cadê o Flávio?", 6: "Governar é pior" };
async function runV3(label, ctxOpts, primary) {
  const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const ctx = await browser.newContext(ctxOpts); await mockAPI(ctx);
  const page = await ctx.newPage();
  page.on("console", m => { if (m.type() === "error") errors.push(`[v3 ${label}] console: ${m.text()}`); });
  page.on("pageerror", e => errors.push(`[v3 ${label}] pageerror: ${e.message}`));
  const T = (fn, ...a) => page.evaluate(([f, a]) => window.__test[f](...a), [fn, a]);
  const shot = async (name) => { const f = `v3-${name}.png`; await page.screenshot({ path: OUT + f }); shots.push(f); };
  // pixels distintos no canvas (tela não pode estar em branco)
  const busy = () => page.evaluate(() => { const c = document.getElementById("c"), x = c.getContext("2d"), d = x.getImageData(0, 0, c.width, c.height).data, set = new Set(); for (let i = 0; i < d.length; i += 4 * 97) set.add((d[i] >> 4) * 256 + (d[i + 1] >> 4) * 16 + (d[i + 2] >> 4)); return set.size; });
  await page.goto(PAGE); await page.waitForTimeout(500);
  await T("reset");
  ok(`${label} v3 __test.startPhase existe`, await page.evaluate(() => ["selectSide", "startPhase", "completePhase", "state", "openMap", "map", "startDaily"].every(k => typeof window.__test[k] === "function")));
  // fluxo real de UI: escolher lado, mapa, bloqueio
  await page.click("#pick-lula"); await page.waitForTimeout(150);
  let mp = await T("map");
  ok(`${label} mapa abre após escolher lado`, mp && mp.camp === "lula" && mp.unlocked === 1 && mp.nodes.filter(n => n.unlocked).length === 1);
  await page.click('.node[data-n="3"]', { force: true }); await page.waitForTimeout(100);
  ok(`${label} fase bloqueada não inicia`, (await T("state")).screen === "map");
  if (primary) await shot("map");
  await page.click('.node[data-n="1"]'); await page.waitForTimeout(150);
  let st = await T("state"); ok(`${label} clique no nó 1 inicia a fase 1`, st.screen === "play" && st.phase === 1);

  for (const camp of ["lula", "flavio"]) {
    if (camp === "lula") await T("reset"); await T("selectSide", camp);
    const sfx = (primary && camp === "lula") ? "" : (primary ? "-flavio" : `-${camp}`);
    const pre = primary ? "" : label + "-";
    for (let n = 1; n <= 6; n++) {
      const tag = `${label}/${camp} fase ${n}`;
      mp = await T("map"); ok(`${tag} desbloqueada em ordem`, mp.unlocked >= n && mp.unlocked === n, `unlocked=${mp.unlocked}`);
      if (n === 5) {
        // fase 5 é longa: joga um pedaço de verdade e conclui pelo gancho
        await T("startPhase", 5); await T("god", true); await T("step", 8, true); await T("step", 1);
        st = await T("state"); ok(`${tag} roda (${st.side})`, st.screen === "play" && st.running && st.phase === 5);
        ok(`${tag} gameplay não está em branco`, (await busy()) > 25);
        await shot(`${pre}phase5${sfx}`);
        await T("completePhase", true);
      } else {
        await T("startPhase", n); await T("skipIntro");
        st = await T("state"); ok(`${tag} iniciou`, st.screen === "play" && st.phase === n && st.scene && st.scene.n === n);
        await T("bot", true); await T("step", 1.5, true);
        // meio da fase
        for (let i = 0; i < 4; i++) await T("step", 3, true);
        await T("step", 0.2);
        ok(`${tag} gameplay não está em branco`, (await busy()) > 25, "cores=" + await busy());
        await shot(`${pre}phase${n}${sfx}`);
        let s = await T("scene"), guard = 0;
        while (s && !s.over && guard++ < 70) { await T("step", 5, true); s = await T("scene"); }
        ok(`${tag} bot conclui naturalmente`, s && s.over && s.won === true, s ? `t=${s.t}s score=${s.score} won=${s.won}` : "");
      }
      await page.waitForTimeout(1400);
      const res = await page.evaluate(() => ({ vis: !document.getElementById("result").classList.contains("hidden"), fato: (document.querySelector("#r-fato a") || {}).href || "", txt: document.getElementById("r-fato").textContent, img: document.getElementById("r-img").src.length, next: getComputedStyle(document.getElementById("b-next")).display }));
      ok(`${tag} resultado + 📰 fato real com link`, res.vis && /^https:\/\//.test(res.fato) && /fato real/.test(res.txt), res.fato);
      ok(`${tag} cartão de compartilhar`, res.img > 5000);
      if (n === 1 && camp === "lula") await shot(`${pre}result`);
      mp = await T("map"); ok(`${tag} progresso salvo (próxima desbloqueada)`, n === 6 ? mp.done[camp] === 1 : mp.unlocked === n + 1 && mp.nodes[n - 1].medal, JSON.stringify(mp.nodes[n - 1]));
      if (n < 6) ok(`${tag} botão próxima fase`, res.next !== "none");
    }
    mp = await T("map"); ok(`${label}/${camp} total global > 0 e rank`, mp.total > 0 && !!mp.rank, mp.total + " · " + mp.rank);
    // forçar vitória e derrota direto em cada fase (ganchos)
    for (let n = 1; n <= 6; n++) {
      await T("startPhase", n); await T("step", 0.5, true);
      let s2 = await T("completePhase", false); await page.waitForTimeout(120);
      ok(`${label}/${camp} fase ${n} derrota forçada`, s2.over === true && s2.won === false);
      await T("startPhase", n); s2 = await T("completePhase", true);
      ok(`${label}/${camp} fase ${n} vitória forçada`, s2.over === true && s2.won === true);
    }
  }
  // persistência (localStorage) após recarregar
  await page.reload(); await page.waitForTimeout(500);
  await T("selectSide", "lula"); mp = await T("map"); ok(`${label} progresso persiste após recarregar`, mp.unlocked === 6 && mp.total > 0);
  // desafio diário: mesma semente, mesmo resultado inicial
  const di = await T("dailyInfo"); ok(`${label} desafio diário tem semente e fase`, di.seed > 0 && [1, 2, 3, 4, 6].includes(di.phase), JSON.stringify(di));
  await T("startDaily"); await T("skipIntro"); await T("bot", true);
  let d1 = null; for (let i = 0; i < 70; i++) { await T("step", 5, true); d1 = await T("scene"); if (d1.over) break; }
  ok(`${label} diário concluível`, d1 && d1.daily === true && d1.over && d1.won === true);
  await page.waitForTimeout(1400);
  const dsave = await T("dailyInfo"); ok(`${label} diário salvo`, dsave.saved && dsave.saved.sc > 0);
  const cap = await page.evaluate(() => shareText(lastResult)); ok(`${label} texto de compartilhar tem grade Wordle`, /🟩|🟨|🟥/.test(cap), cap.replace(/\n/g, " | ").slice(0, 80));
  if (primary) await shot("daily-result");
  // final secreto (ambos os lados terminaram a fase 6)
  const m6 = await T("meta"); ok(`${label} ambos os lados concluíram a fase 6`, m6.done.lula === 1 && m6.done.flavio === 1);
  await T("startPhase", 6, { camp: "flavio" }); await T("skipIntro"); await T("bot", true);
  let s6 = null, sawSecret = false; for (let i = 0; i < 90; i++) { await T("step", 5, true); s6 = await T("scene"); if (s6.info && s6.info.secret) sawSecret = true; if (s6.over) break; }
  ok(`${label} final secreto aparece e a fase conclui`, sawSecret && s6.over && s6.won === true, JSON.stringify(s6 && s6.info));
  await browser.close();
}

if (!process.env.ONLY) await run("desktop", { viewport: { width: 960, height: 600 } });
if (!process.env.ONLY) await run("mobile", { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
if (!process.env.ONLY) await runV3("desktop", { viewport: { width: 1280, height: 720 } }, true);
if (!process.env.ONLY) await runV3("mobile", { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, false);

/* ================= v3.1: placar global, engajamento, desafio, vozes ================= */
const enc = o => Buffer.from(JSON.stringify(o), "utf8").toString("base64");
const MOBILE = { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
async function runSocial(label, ctxOpts, primary) {
  const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const pre = primary ? "" : label + "-", tag = `${label} social`;
  const ctx = await browser.newContext(ctxOpts), api = await mockAPI(ctx);
  const page = await ctx.newPage();
  let allow400 = false;   // o teste do apelido recusado provoca um 400 esperado (o navegador loga como erro de recurso)
  page.on("console", m => { if (m.type() === "error" && !(allow400 && /status of 400/.test(m.text()))) errors.push(`[${tag}] console: ${m.text()}`); });
  page.on("pageerror", e => errors.push(`[${tag}] pageerror: ${e.message}`));
  const T = (fn, ...a) => page.evaluate(([f, a]) => window.__test[f](...a), [fn, a]);
  const shot = async (name) => { const f = `v3-${pre}${name}.png`; await page.screenshot({ path: OUT + f }); shots.push(f); };
  const vis = sel => page.evaluate(s => { const e = document.querySelector(s); return !!e && !e.classList.contains("hidden") && getComputedStyle(e).display !== "none"; }, sel);
  const txt = sel => page.evaluate(s => (document.querySelector(s) || {}).textContent || "", sel);
  const finish = async (n, camp, win = true) => { await T("startPhase", n, { camp }); await T("skipIntro"); await T("completePhase", win); await page.waitForTimeout(1300); return T("engage"); };

  // ---- desafio por link ----
  const ch = { nick: "Fulano", score: 12340, side: "esquerda", char: "moraes", phase: 5 };
  await page.goto(PAGE + "?desafio=" + encodeURIComponent(enc(ch))); await page.waitForTimeout(500);
  ok(`${tag} banner ?desafio= visível`, await vis("#chal"));
  const bt = await txt("#chal-t"); ok(`${tag} banner: "Fulano fez 12.340 como Moraes. Duvido você"`, /Fulano fez 12\.340 como Moraes\. Duvido você/.test(bt), bt);
  ok(`${tag} banner mostra o alvo a vencer`, /alvo: 12\.340/.test(await txt("#chal-s")), await txt("#chal-s"));
  await shot("desafio");
  await page.click("#chal-go"); await page.waitForTimeout(300);
  let st = await T("state"); ok(`${tag} aceitar desafio inicia a fase do desafio`, st.screen === "play" && st.phase === 5 && st.side === "moraes", `${st.screen}/${st.phase}/${st.side}`);
  ok(`${tag} banner some durante o jogo`, !(await vis("#chal")));
  await T("god", true); await T("finish", true); await page.waitForTimeout(1300);
  ok(`${tag} resultado compara com o alvo do desafio`, /Desafio de Fulano: faltaram/.test(await txt("#r-eng")), (await txt("#r-eng")).slice(0, 80));
  // desafio fácil de vencer
  await page.goto(PAGE + "?desafio=" + encodeURIComponent(enc({ ...ch, score: 100, phase: 1, char: "lula" }))); await page.waitForTimeout(400);
  await T("setProfile", { nick: "Tester" });
  await page.click("#chal-go"); await page.waitForTimeout(200); await T("skipIntro"); await T("completePhase", true); await page.waitForTimeout(1300);
  ok(`${tag} vencer o desafio mostra comemoração`, /passou o desafio de Fulano/.test(await txt("#r-eng")), (await txt("#r-eng")).slice(0, 80));
  ok(`${tag} desafio vencido é limpo`, (await T("profile")).challenge === null);
  // desafios inválidos não quebram nada
  for (const bad of ["%%%", enc({ nick: "x", score: -1, phase: 9 }), "e30="]) { await page.goto(PAGE + "?desafio=" + bad); await page.waitForTimeout(250); }
  ok(`${tag} ?desafio= inválido é ignorado`, !(await vis("#chal")));
  const xss = enc({ nick: "<img src=x onerror=alert(1)>Ze", score: 500, side: "direita", char: "flavio", phase: 2 });
  await page.goto(PAGE + "?desafio=" + encodeURIComponent(xss)); await page.waitForTimeout(300);
  ok(`${tag} nick do desafio é sanitizado`, !(await page.evaluate(() => !!document.querySelector("#chal img"))) && !/[<>]/.test(await txt("#chal-t")), await txt("#chal-t"));

  // ---- apelido ----
  await page.goto(PAGE); await page.waitForTimeout(300); await T("reset", null);
  await page.click("#pick-lula"); await page.waitForTimeout(200);
  ok(`${tag} pede apelido ao escolher o lado`, await vis("#nick"));
  await page.fill("#nick-in", "a"); await page.click("#nick-ok");
  ok(`${tag} apelido curto é recusado`, (await vis("#nick")) && /2 a 16/.test(await txt("#nick-err")));
  await page.fill("#nick-in", "Zé do Zap"); await page.click("#nick-ok"); await page.waitForTimeout(200);
  ok(`${tag} apelido salvo`, !(await vis("#nick")) && (await T("profile")).nick === "Zé do Zap");

  // ---- semeia o placar e abre a tela ----
  const day = await page.evaluate(() => dateKey());
  const seed = [["Rival Um", "direita", 500], ["Rival Dois", "esquerda", 900], ["Rival Tres", "direita", 5000], ["Rival Quatro", "esquerda", 9000]];
  for (const [nick, side, score] of seed) {
    await api.call("/submit", { nick, side, phase: 1, score, time: 120 });
    await api.call("/submit", { nick, side, phase: "all", score: score * 4, time: 900 });
    await api.call("/submit", { nick, side, daily: day, phase: 1, score, time: 120 });
  }
  await page.reload(); await page.waitForTimeout(400); await T("selectSide", "lula"); await page.waitForTimeout(500);
  ok(`${tag} placar da torcida Esquerda x Direita no mapa`, await page.evaluate(() => !!document.querySelector("#torcida .tbar") && /Esquerda \d+%/.test(document.getElementById("torcida").textContent) && /Direita \d+%/.test(document.getElementById("torcida").textContent)));
  const pe = +await page.evaluate(() => document.getElementById("torcida").getAttribute("data-pe")); ok(`${tag} torcida usa dados da API (pts de Esquerda e Direita)`, pe > 0 && pe < 100 && await page.evaluate(() => document.getElementById("torcida").getAttribute("data-online")) === "1", "pe=" + pe);
  ok(`${tag} status online`, /online/.test(await txt("#map-lbstatus")) && (await T("lbState")).online === true);
  await page.click("#b-lb2"); await page.waitForTimeout(500);
  ok(`${tag} tela do placar abre`, await vis("#lb"));
  const tabs = await page.evaluate(() => [...document.querySelectorAll("#lb-tabs .tab")].map(b => b.textContent));
  ok(`${tag} abas global/esquerda/direita/fase/hoje/semana`, tabs.join() === "Global,Esquerda,Direita,Fase,Hoje,Semana", tabs.join());
  const exp = { global: 5, esquerda: 3, direita: 2, fase: 5, hoje: 4, semana: 5 };   // 4 rivais + "Tester" (do teste do desafio); hoje: só os 4 rivais
  for (const t of Object.keys(exp)) {
    await page.click(`#lb-tabs [data-t="${t}"]`); await page.waitForFunction(() => !/Carregando/.test(document.getElementById("lb-list").textContent), null, { timeout: 4000 }); 
    const rows = await page.evaluate(() => [...document.querySelectorAll("#lb-list .lbrow .n")].map(e => e.textContent));
    ok(`${tag} aba ${t}: ${exp[t]} linhas`, rows.length === exp[t], rows.join(","));
    if (t === "fase") await shot("leaderboard");
  }
  await page.click('#lb-tabs [data-t="global"]'); await page.waitForTimeout(300);
  ok(`${tag} lista global ordenada (maior primeiro)`, (await page.evaluate(() => [...document.querySelectorAll("#lb-list .v")].map(e => +e.textContent.replace(/\./g, "")))).every((v, i, a) => !i || a[i - 1] >= v));
  await page.click("#lb-close"); ok(`${tag} placar fecha`, !(await vis("#lb")));

  // ---- gatilhos pós-corrida: cargo novo + recorde + posição ----
  await T("setProfile", { cum: 3900, streak: 0, lastDay: "" }); await T("setBest", "lula", 1, 1);
  let E = await finish(1, "lula");
  const conf = await page.evaluate(() => document.querySelectorAll(".conf").length);
  ok(`${tag} confete de comemoração`, conf > 0, "n=" + conf);
  ok(`${tag} corrida vencida`, E && E.won && E.sc > 0, JSON.stringify(E && { sc: E.sc, career: E.career }));
  ok(`${tag} gatilho: novo recorde pessoal`, E.record === true);
  ok(`${tag} gatilho: subiu de cargo (Estagiário → Assessor)`, E.rankUp === true && E.career === "Assessor", E.career);
  const eng = await txt("#r-eng");
  ok(`${tag} "Você está no top X%"`, /Você está no top \d+% · #\d+ de \d+/.test(eng), eng.slice(0, 120));
  ok(`${tag} "Faltaram N pontos pra passar <nick>"`, /Faltaram [\d.]+ pontos pra passar Rival Tres/.test(eng), eng);
  ok(`${tag} mostra recorde e cargo novo`, /recorde pessoal/.test(eng) && /Subiu de cargo: Assessor/.test(eng));
  ok(`${tag} posição vem da API`, E.lb && E.lb.online === true && E.lb.position === 3 && E.lb.total === 6, JSON.stringify(E.lb));
  ok(`${tag} convite de compartilhar aparece no pico`, (await vis("#r-share2")) && /Manda pro grupo|Cargo novo/.test(await txt("#r-peak")), await txt("#r-peak"));
  const hrefs = await page.evaluate(() => [document.getElementById("sh-wa").href, document.getElementById("sh-x").href]);
  ok(`${tag} botões WhatsApp e X`, hrefs[0].startsWith("https://wa.me/?text=") && hrefs[1].startsWith("https://x.com/intent/post?text=") && decodeURIComponent(hrefs[0]).includes("?desafio="), hrefs[0].slice(0, 70));
  const back = await page.evaluate(u => parseDesafio(new URL(u).searchParams.get("desafio")), E.shareUrl);
  ok(`${tag} link de desafio decodifica de volta`, back && back.nick === "Zé do Zap" && back.score === E.sc && back.side === "esquerda" && back.phase === 1 && back.char === "lula", JSON.stringify(back));
  ok(`${tag} texto de compartilhar tem posição, cargo e lado`, /#3 no placar/.test(E.shareText) && /Assessor \(Esquerda\)/.test(E.shareText), E.shareText.split("\n")[0]);
  const card = await T("shareCard"); ok(`${tag} cartão PNG (canvas) gerado`, card.len > 8000 && (await page.evaluate(() => document.getElementById("r-img").src.startsWith("data:image/png"))), card.len + " bytes b64");
  await shot("share");
  // mesma nota de novo: não é pico → não pede para compartilhar
  E = await finish(1, "lula");
  ok(`${tag} corrida repetida não é pico (sem convite de compartilhar)`, !E.record && !E.rankUp && !E.near && E.peak === false && !(await vis("#r-share2")), JSON.stringify(E));
  ok(`${tag} botão Compartilhar continua disponível`, await vis("#b-share"));
  await page.click("#b-share"); await page.waitForTimeout(150);
  ok(`${tag} Compartilhar sem Web Share revela WhatsApp/X/baixar`, await vis("#r-share2"));
  // quase passou alguém
  E = await finish(2, "lula");
  await api.call("/submit", { nick: "Rival Colado", side: "direita", phase: 2, score: E.sc + 30, time: 150 });
  E = await finish(2, "lula");
  ok(`${tag} gatilho: quase passou alguém`, E.near === true && E.peak === true && E.lb.next.nick === "Rival Colado" && E.lb.gap === 31 && !E.record, JSON.stringify(E.lb));
  ok(`${tag} convite no quase-lá`, (await vis("#r-share2")) && /Rival Colado/.test(await txt("#r-peak")), await txt("#r-peak"));
  // sequência diária
  const yday = await page.evaluate(() => dateKey(new Date(Date.now() - 864e5)));
  await T("setProfile", { streak: 2, lastDay: yday });
  await finish(1, "lula"); let pf = await T("profile");
  ok(`${tag} sequência diária: ontem + hoje = 3`, pf.streak === 3 && /3 dias seguidos/.test(await txt("#r-eng")), String(pf.streak));
  await finish(1, "lula"); pf = await T("profile"); ok(`${tag} jogar de novo no mesmo dia mantém a sequência`, pf.streak === 3);
  await T("setProfile", { lastDay: await page.evaluate(() => dateKey(new Date(Date.now() - 3 * 864e5))) }); await finish(1, "lula");
  ok(`${tag} sequência quebra após dias sem jogar`, (await T("profile")).streak === 1);
  ok(`${tag} pontos acumulados (cargo) crescem`, (await T("profile")).cum > 3900);
  // derrota não vai pro placar
  const before = (await api.call("/top?scope=phase&phase=3")).total; await finish(3, "lula", false);
  ok(`${tag} derrota não entra no placar`, (await api.call("/top?scope=phase&phase=3")).total === before);
  // desafio diário
  await T("selectSide", "lula"); await T("startDaily"); await T("skipIntro"); await T("completePhase", true); await page.waitForTimeout(1300);
  E = await T("engage"); ok(`${tag} desafio diário: posição no placar do dia`, /no desafio de hoje/.test(await txt("#r-eng")) && E.lb && E.lb.total === 5, await txt("#r-eng"));
  await T("openMap"); await page.click("#b-lb2"); await page.click('#lb-tabs [data-t="hoje"]'); await page.waitForFunction(() => !/Carregando/.test(document.getElementById("lb-list").textContent));
  ok(`${tag} aba Hoje mostra o jogador do diário`, /Zé do Zap/.test(await txt("#lb-list")), (await txt("#lb-list")).slice(0, 80));
  await page.click("#lb-close");
  // apelido recusado pelo servidor
  allow400 = true; await T("setProfile", { nick: "Seu Puta" }); await finish(1, "lula"); allow400 = false;
  ok(`${tag} apelido recusado pelo servidor reabre o prompt`, (await vis("#nick")) && (await T("profile")).nick === "" && /não foi aceito/.test(await txt("#nick-err")));
  await T("setProfile", { nick: "Zé do Zap" }); await page.evaluate(() => document.getElementById("nick").classList.add("hidden"));

  // ---- vozes: data-driven, variadas, sem sobreposição ----
  const man = JSON.parse(fs.readFileSync(new URL("../audio/manifest.json", import.meta.url)));
  const dur = Object.fromEntries(man.map(c => [c.id, c.duration || 3]));
  await T("reset"); await T("selectSide", "flavio"); await T("start", "flavio"); await T("god", true); await T("mute", true);   // mudo: o passo acelerado do teste não casa com o relógio do áudio real
  const base = (await T("voiceLog")).length;
  const vs0 = await T("voiceStats"); ok(`${tag} vozes carregadas do manifest (tags)`, vs0.loaded && vs0.clips >= 24 && vs0.tagged >= 20, JSON.stringify({ clips: vs0.clips, tagged: vs0.tagged }));
  for (let i = 0; i < 12; i++) for (const k of ["hit", "pow", "medal"]) { await page.evaluate(k => sfx(k), k); await T("step", 3.2, true); }
  // cada gatilho tem chance < 100% (e a fala anterior pode estar ocupando o canal): insiste até ver cada evento
  for (const [k, ev] of [["hit", "hit"], ["pow", "powerup"], ["medal", "combo"]]) for (let i = 0; i < 40 && !((await T("voiceStats")).byEvent[ev] > 0); i++) { await page.evaluate(k => sfx(k), k); await T("step", 3.2, true); }
  const evs = ["hit", "powerup", "combo"], vs = await T("voiceStats");
  ok(`${tag} contador de vozes em __test`, vs.count >= 8 && evs.every(e => vs.byEvent[e] >= 1), JSON.stringify(vs.byEvent));
  await T("voice", "boss-intro", 3); await T("step", 9, true); await T("voice", "near-miss", 0); await T("step", 4, true);
  await T("step", 30, true);
  const vs2 = await T("voiceStats"); ok(`${tag} provocação ociosa (idle) dispara sozinha`, (vs2.byEvent.idle || 0) >= 1, JSON.stringify(vs2.byEvent));
  const log = (await T("voiceLog")).slice(base); const seen = new Set(log.map(l => l.id));
  ok(`${tag} variedade: ≥6 falas diferentes`, seen.size >= 6, seen.size + " falas");
  ok(`${tag} nunca repete a fala anterior`, log.every((l, i) => !i || l.id !== log[i - 1].id));
  ok(`${tag} sem sobreposição (próxima começa depois do fim da anterior)`, log.every((l, i) => !i || l.t >= log[i - 1].t + (dur[log[i - 1].id] || 3) * 1000 - 500), "n=" + log.length);
  const low = new Set(["hit", "powerup", "near-miss", "combo", "pickup", "idle", "retry", "pause"]);
  const viol = log.map((l, i) => i && low.has(l.event) ? { i, ev: l.event, prev: log[i - 1].event, gap: l.t - (log[i - 1].t + (dur[log[i - 1].id] || 3) * 1000) } : null).filter(x => x && x.gap < 2400);
  ok(`${tag} cooldown ≥2,5 s entre falas de reação`, viol.length === 0, JSON.stringify(viol.slice(0, 3)));
  ok(`${tag} falas têm personagem, transcrição e arquivo`, log.every(l => l.character && l.transcript && /^audio\/.+\.mp3$/.test(l.file)));
  const states = await T("state"); ok(`${tag} snapshot expõe voiceEvents`, states.voices === (await T("voiceLog")).length && typeof states.voiceEvents === "object");
  await browser.close();
}

async function runOffline(label, ctxOpts, primary) {
  const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const pre = primary ? "" : label + "-", tag = `${label} offline`;
  const ctx = await browser.newContext(ctxOpts); await mockAPI(ctx, makeKV(), { offline: true });
  const page = await ctx.newPage();
  page.on("console", m => { if (m.type() === "error" && !/net::ERR_FAILED|workers\.dev/.test(m.text())) errors.push(`[${tag}] console: ${m.text()}`); });   // falha de rede é o cenário testado
  page.on("pageerror", e => errors.push(`[${tag}] pageerror: ${e.message}`));
  const T = (fn, ...a) => page.evaluate(([f, a]) => window.__test[f](...a), [fn, a]);
  const txt = sel => page.evaluate(s => (document.querySelector(s) || {}).textContent || "", sel);
  await page.goto(PAGE); await page.waitForTimeout(400); await T("reset"); await T("selectSide", "lula"); await page.waitForTimeout(700);
  ok(`${tag} torcida cai pro local e indica offline`, (await page.evaluate(() => document.getElementById("torcida").getAttribute("data-online"))) === "0" && /offline/.test(await txt("#map-lbstatus")), await txt("#map-lbstatus"));
  await T("startPhase", 1, { camp: "lula" }); await T("skipIntro"); await T("completePhase", true); await page.waitForTimeout(1500);
  const E = await T("engage");
  ok(`${tag} corrida concluída com a API fora`, E && E.won && E.lb && E.lb.online === false && E.lb.position === 1, JSON.stringify(E && E.lb));
  ok(`${tag} resultado indica offline`, /offline/.test(await txt("#r-eng")) && /1º lugar|top \d+%/.test(await txt("#r-eng")), (await txt("#r-eng")).slice(0, 100));
  ok(`${tag} estado de rede = offline`, (await T("lbState")).online === false);
  if (primary) await page.screenshot({ path: OUT + "v3-offline.png" }), shots.push("v3-offline.png");
  await T("openMap"); await T("openLB", "global"); await page.waitForFunction(() => !/Carregando/.test(document.getElementById("lb-list").textContent)); await page.waitForTimeout(100);
  ok(`${tag} placar local lista o jogador`, /Tester/.test(await txt("#lb-list")) && /offline/.test(await txt("#lb-sub")), (await txt("#lb-list")).slice(0, 60) + " | " + await txt("#lb-sub"));
  ok(`${tag} localStorage guarda o placar local`, await page.evaluate(() => { const o = JSON.parse(localStorage.getItem("brs26_lb_local_v1")); return !!o.boards["phase:1"] && !!o.boards.global; }));
  await browser.close();
}
await runSocial("desktop", { viewport: { width: 1280, height: 720 } }, true);
await runSocial("mobile", MOBILE, false);
await runOffline("desktop", { viewport: { width: 1280, height: 720 } }, true);
await runOffline("mobile", MOBILE, false);

/* ---- og.png 1200x630 gerado a partir do jogo ---- */
{
  const browser = await chromium.launch(), ctx = await browser.newContext({ viewport: { width: 1200, height: 652 } }); await mockAPI(ctx);
  const page = await ctx.newPage(); await page.goto(PAGE); await page.waitForTimeout(700);
  await page.addStyleTag({ content: "#foot,#mute,#b-lb,.keys{display:none!important} body{background:#08101f!important} #frame{box-shadow:none!important}" }); await page.waitForTimeout(100);
  await page.screenshot({ path: OUT + "og.png", clip: { x: 0, y: 0, width: 1200, height: 630 } }); shots.push("og.png");
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  ok("meta Open Graph/Twitter no index.html", ["og:title", "og:description", "og:url", "twitter:card"].every(k => html.includes(k)) && html.includes("https://ebaoj.github.io/brasil-speedrun/shots/og.png") && /property="og:url" content="https:\/\/ebaoj.github.io\/brasil-speedrun\/"/.test(html));
  const sz = fs.readFileSync(OUT + "og.png"); ok("og.png é PNG 1200x630", sz.readUInt32BE(16) === 1200 && sz.readUInt32BE(20) === 630, sz.readUInt32BE(16) + "x" + sz.readUInt32BE(20));
  await browser.close();
}
// áudio: nada de "miliciano" e todo clipe do manifest existe
{
  const man = JSON.parse(fs.readFileSync(new URL("../audio/manifest.json", import.meta.url))), files = fs.readdirSync(new URL("../audio/", import.meta.url)).filter(f => f.endsWith(".mp3"));
  ok("audio: nenhum arquivo/entrada com 'miliciano'", !files.some(f => /miliciano/i.test(f)) && !/miliciano/i.test(JSON.stringify(man)));
  ok("audio: manifest ↔ mp3 consistentes, com tags side/phase/events", man.every(c => fs.existsSync(new URL("../" + c.file, import.meta.url)) && c.tags && c.tags.side && Array.isArray(c.tags.phase) && c.tags.events.length) && man.length === files.length, `${man.length} entradas / ${files.length} mp3`);
}

console.log("\nERROS:", errors.length); errors.forEach(e => console.log("  " + e));
ok("zero erros de console/página", errors.length === 0);
const failed = checks.filter(c => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks OK; shots: ${shots.length}\n` + shots.join("\n"));
process.exit(failed.length || errors.length ? 1 : 0);
