// KV em memória com a mesma superfície usada pelo worker: get / put (expirationTtl) / delete
export function makeKV() {
  const m = new Map();
  return {
    m,
    async get(k) { const e = m.get(k); if (!e) return null; if (e.exp && e.exp < Date.now()) { m.delete(k); return null; } return e.v; },
    async put(k, v, o) { m.set(k, { v: String(v), exp: o && o.expirationTtl ? Date.now() + o.expirationTtl * 1000 : 0, ttl: o && o.expirationTtl }); },
    async delete(k) { m.delete(k); }
  };
}
