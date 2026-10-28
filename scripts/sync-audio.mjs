// Uso: node scripts/sync-audio.mjs [pasta-fonte]   (padrão: /workspace/brasil-speedrun-audio)
// Copia os mp3 listados no manifest da fonte para audio/ (ignorando qualquer "miliciano") e
// regenera audio/manifest.json com tags normalizadas { side, phase, events } que o jogo consome.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO = path.join(ROOT, "audio");
const SRC = path.resolve(process.argv[2] || "/workspace/brasil-speedrun-audio");
const BANNED = /miliciano/i;

const strip = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const slug = f => path.basename(f).replace(/\.mp3$/i, "");

// esquerda: Dilma, Haddad, Boulos, Janja, Lula, Erika, Moraes · direita: Jair, Renan Santos, Tarcísio, Flávio, Nikolas, Pavanato, Campopiano
// (Jair vem antes de Flávio/Bolsonaro; "renan" só casa Renan Santos)
const CHARS = [
  { re: /dilma/, key: "dilma", name: "Dilma Rousseff", side: "esquerda" },
  { re: /haddad/, key: "haddad", name: "Fernando Haddad", side: "esquerda" },
  { re: /boulos/, key: "boulos", name: "Guilherme Boulos", side: "esquerda" },
  { re: /janja/, key: "janja", name: "Janja", side: "esquerda" },
  { re: /lula/, key: "lula", name: "Lula", side: "esquerda" },
  { re: /erika/, key: "erika", name: "Erika Hilton", side: "esquerda" },
  { re: /moraes/, key: "moraes", name: "Alexandre de Moraes", side: "esquerda" },
  { re: /\bjair\b/, key: "jair", name: "Jair Bolsonaro", side: "direita" },
  { re: /renan/, key: "renan", name: "Renan Santos", side: "direita" },
  { re: /tarcisio/, key: "tarcisio", name: "Tarcísio de Freitas", side: "direita" },
  { re: /flavio/, key: "flavio", name: "Flávio Bolsonaro", side: "direita" },
  { re: /nikolas/, key: "nikolas", name: "Nikolas Ferreira", side: "direita" },
  { re: /pavanato/, key: "pavanato", name: "Lucas Pavanato", side: "direita" },
  { re: /campopiano/, key: "campopiano", name: "Eduarda Campopiano", side: "direita" }
];
const charOf = s => CHARS.find(c => c.re.test(strip(s))) || { key: "outro", name: String(s || "?"), side: "any" };

// palavras-chave (sem acento) -> eventos normalizados que o jogo dispara
const EVENT_RULES = [
  [/game over|derrota|humilhante|perder|perde|sistema que ganhou/, ["gameover"]],
  [/vitoria|victory|viva|ganhou o time/, ["victory"]],
  [/dano|ataque|golpe baixo|penalidade|reacao|vaia|desculpa|ele me chamou|\bhit\b/, ["hit"]],
  [/power-?up|respawn|bonus|coleta|voto|calar/, ["powerup"]],
  [/combo|bola ate agora|meme classico/, ["combo"]],
  [/chefao|chefe|boss|entrada do|medo da pf|regular|banimento|crime digital/, ["boss-intro"]],
  [/inicio de|proximo nivel|abertura|intro|primeira de muitas|mudar o brasil|todos nao existem|debate inflamado/, ["phase-start"]],
  [/esquiva|bloqueio|contra-?ataque|hoje nao|nao vou permitir/, ["near-miss"]],
  [/pause|parou|erro do jogador|tudo errado/, ["pause", "idle"]],
  [/continue|tentar de novo|desistir/, ["retry"]],
  [/easter|fuga|aviso|cameo|marisa|nunca pensei|passaporte/, ["cameo", "idle"]]
];
const PHASE_RULES = [
  [/fase 1|debate|nove dedos|round/, [1]], [/fase 2|familia|zap|whatsapp|fake news/, [2]], [/fase 3|eleicao|urna|apuracao/, [3]],
  [/fase 4|camara|banheiro|comemoracao/, [4]], [/fase 5|stf|flavio saindo|fuga|aeroporto|passaporte|cade o flavio/, [5]],
  [/fase 6|governar|final|regulacao|banimento|chefao.*redes/, [6]]
];

function infer(text, extra) {
  const t = strip(text) + " " + strip(extra || "");
  const events = new Set(["idle"]);               // toda fala serve de provocação ociosa
  for (const [re, ev] of EVENT_RULES) if (re.test(t)) ev.forEach(e => events.add(e));
  const phase = new Set();
  for (const [re, ph] of PHASE_RULES) if (re.test(strip(text))) ph.forEach(p => phase.add(p));
  return { events: [...events].sort(), phase: [...phase].sort((a, b) => a - b) };
}

function findSourceManifest() {
  const cands = [path.join(SRC, "clips", "manifest.json"), path.join(SRC, "manifest.json")];
  for (const c of cands) if (fs.existsSync(c)) return c;
  throw new Error("manifest não encontrado em " + SRC);
}

fs.mkdirSync(AUDIO, { recursive: true });
const srcManifest = findSourceManifest();
const srcDir = path.dirname(srcManifest);
const srcList = JSON.parse(fs.readFileSync(srcManifest, "utf8"));
let oldList = [];
try { oldList = JSON.parse(fs.readFileSync(path.join(AUDIO, "manifest.json"), "utf8")); } catch (e) {}
const oldBy = Object.fromEntries(oldList.map(e => [slug(e.file), e]));

const out = new Map(), skipped = [], banned = new Set();
let copied = 0;
for (const e of srcList) {
  const id = slug(e.file);
  if (BANNED.test(JSON.stringify(e))) {   // entrada banida: some também uma cópia antiga em audio/
    skipped.push(e.file); banned.add(id);
    const old = path.join(AUDIO, id + ".mp3"); if (fs.existsSync(old)) fs.unlinkSync(old);
    continue;
  }
  // o arquivo pode estar relativo ao manifest ("clips/x.mp3") ou à raiz da fonte
  const from = [path.join(srcDir, path.basename(e.file)), path.join(SRC, e.file), path.join(srcDir, e.file)].find(p => fs.existsSync(p));
  if (!from) { console.warn("! mp3 ausente na fonte:", e.file); continue; }
  fs.copyFileSync(from, path.join(AUDIO, id + ".mp3")); copied++;
  const ch = charOf(e.character || id);
  const inf = infer(e.suggested_use, id.replace(/_/g, " "));
  out.set(id, {
    file: "audio/" + id + ".mp3", id, character: e.character || ch.name, charKey: ch.key, transcript: e.transcript,
    duration: e.duration_s != null ? e.duration_s : (e.end - e.start) || null,
    source_url: e.source_url, source_channel: e.source_channel, suggested_use: e.suggested_use,
    tags: { side: ch.side, phase: inf.phase, events: inf.events }
  });
}
// mp3 que já estavam em audio/ e não vieram da fonte: mantém, inferindo tags pelo nome do arquivo
let kept = 0;
for (const f of fs.readdirSync(AUDIO).filter(f => /\.mp3$/i.test(f)).sort()) {
  const id = slug(f);
  if (BANNED.test(f)) { fs.unlinkSync(path.join(AUDIO, f)); skipped.push(f); continue; }
  if (out.has(id) || banned.has(id)) continue;
  const old = oldBy[id] || {};
  if (BANNED.test(JSON.stringify(old))) { skipped.push(f); continue; }
  const ch = charOf(old.character || id), words = id.replace(/^[a-z]+?_/, "").replace(/_/g, " ");
  const inf = infer(old.suggested_use || "", words);
  out.set(id, {
    file: "audio/" + id + ".mp3", id, character: old.character || ch.name, charKey: ch.key, transcript: old.transcript || words,
    duration: old.duration_s || old.duration || null, source_url: old.source_url, source_channel: old.source_channel, suggested_use: old.suggested_use,
    tags: { side: ch.side, phase: inf.phase, events: inf.events }
  }); kept++;
}
const list = [...out.values()].sort((a, b) => a.id.localeCompare(b.id));
fs.writeFileSync(path.join(AUDIO, "manifest.json"), JSON.stringify(list, null, 2) + "\n");

const byEv = {};
list.forEach(c => c.tags.events.forEach(e => (byEv[e] = byEv[e] || []).push(c.id)));
console.log(`fonte: ${srcManifest}\ncopiados: ${copied} · mantidos (só em audio/): ${kept} · ignorados: ${skipped.length}${skipped.length ? " (" + skipped.join(", ") + ")" : ""}`);
console.log(`manifest: ${list.length} clipes`);
Object.keys(byEv).sort().forEach(e => console.log("  " + e.padEnd(12) + byEv[e].length));
