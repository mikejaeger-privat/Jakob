// Nachbildung der Cloudflare-D1-Schnittstelle mit SQLite aus Node (nur für Tests und den lokalen Server).
import { DatabaseSync } from 'node:sqlite';

class Anweisung {
  constructor(db, sql, werte = []) { this.db = db; this.sql = sql; this.werte = werte; }
  bind(...werte) { return new Anweisung(this.db, this.sql, werte); }
  first() { return Promise.resolve(this.db.prepare(this.sql).get(...this.werte) ?? null); }
  all() { return Promise.resolve({ results: this.db.prepare(this.sql).all(...this.werte), success: true }); }
  run() { const r = this.db.prepare(this.sql).run(...this.werte); return Promise.resolve({ success: true, meta: { changes: r.changes } }); }
  _sofort() { const s = this.db.prepare(this.sql); return /^\s*select/i.test(this.sql) ? { results: s.all(...this.werte) } : (s.run(...this.werte), { results: [] }); }
}

export function d1Lokal(pfad = ':memory:') {
  const db = new DatabaseSync(pfad);
  let anfragen = 0;
  return {
    prepare: (sql) => { anfragen++; return new Anweisung(db, sql); },
    async batch(liste) {
      db.exec('BEGIN');
      try { const r = liste.map((a) => a._sofort()); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
    },
    get anfragen() { return anfragen; },
    nullen() { anfragen = 0; },
    roh: db,
  };
}
