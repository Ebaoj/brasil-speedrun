// Uso: python3 -m http.server 8137 (na raiz do jogo) ; node tests/verify.mjs   (playwright em /workspace/bsr_tmp)
import { createRequire } from "module";
const require = createRequire("/workspace/bsr_tmp/");
const { chromium } = require("playwright");
import fs from "fs";
const PAGE = process.env.URL || "http://127.0.0.1:8137/index.html";
const OUT = new URL("../shots/", import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const errors = [], shots = [], checks = [];
const ok = (n, c, d) => { checks.push({ n, ok: !!c }); console.log((c ? "PASS " : "FAIL ") + n + (d ? " — " + d : "")); };

async function run(label, ctxOpts) {
  const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const ctx = await browser.newContext(ctxOpts);
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
await run("desktop", { viewport: { width: 960, height: 600 } });
await run("mobile", { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
console.log("\nERROS:", errors.length); errors.forEach(e => console.log("  " + e));
ok("zero erros de console/página", errors.length === 0);
const failed = checks.filter(c => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks OK; shots: ${shots.length}\n` + shots.join("\n"));
process.exit(failed.length || errors.length ? 1 : 0);
