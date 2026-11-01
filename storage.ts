// طبقة التخزين: ملف JSON محلي للتطوير، أو PostgreSQL (مثل Supabase / Neon) للإنتاج.
// يُختار Postgres تلقائيًا عند وجود المتغير DATABASE_URL.

export const COLLECTIONS = ['users', 'sessions', 'boards', 'questionBank', 'classes', 'points', 'wheels'] as const;
export type CollectionName = (typeof COLLECTIONS)[number];
export type Snapshot = Record<CollectionName, any[]>;

export interface WriteOps {
  upserts: { col: CollectionName; id: string; data: any }[];
  deletes: { col: CollectionName; id: string }[];
}

export interface Storage {
  kind: 'file' | 'postgres';
  /** يرجع null إذا كان المخزن فارغًا (أول تشغيل). */
  load(): Promise<Snapshot | null>;
  save(ops: WriteOps, full: () => Snapshot): Promise<void>;
  close(): Promise<void>;
}

// ---------- ملف JSON (تطوير محلي فقط؛ لا يصلح للاستضافة التي تمسح الملفات) ----------
export async function createFileStorage(): Promise<Storage> {
  const fs = await import('fs');
  const path = await import('path');
  const DATA_DIR = path.join(process.cwd(), 'data');
  const DB_FILE = path.join(DATA_DIR, 'db.json');
  return {
    kind: 'file',
    async load() {
      if (!fs.existsSync(DB_FILE)) return null;
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      const out = {} as Snapshot;
      for (const c of COLLECTIONS) out[c] = parsed[c] || [];
      return out;
    },
    async save(_ops, full) {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      const tmp = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(full(), null, 2), 'utf-8');
      fs.renameSync(tmp, DB_FILE);
    },
    async close() {},
  };
}

// ---------- PostgreSQL ----------
// جدول عام واحد (collection, id, data jsonb) يسمح بإضافة أنواع بيانات جديدة بلا تعديل المخطط.
export async function createPostgresStorage(url: string): Promise<Storage> {
  const { default: pg } = await import('pg');
  const local = /localhost|127\.0\.0\.1/.test(url);
  const pool = new pg.Pool({
    connectionString: url,
    ssl: local ? undefined : { rejectUnauthorized: false },
    max: 5,
  });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS records (
      collection text NOT NULL,
      id text NOT NULL,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (collection, id)
    )`);
  return {
    kind: 'postgres',
    async load() {
      const { rows } = await pool.query('SELECT collection, id, data FROM records');
      if (rows.length === 0) {
        const meta = await pool.query("SELECT 1 FROM records WHERE collection = '_meta' LIMIT 1");
        if (meta.rowCount === 0) return null;
      }
      const out = {} as Snapshot;
      for (const c of COLLECTIONS) out[c] = [];
      for (const r of rows) {
        if ((COLLECTIONS as readonly string[]).includes(r.collection)) out[r.collection as CollectionName].push(r.data);
      }
      return out;
    },
    async save(ops) {
      if (!ops.upserts.length && !ops.deletes.length) return;
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const u of ops.upserts) {
          await client.query(
            `INSERT INTO records (collection, id, data) VALUES ($1, $2, $3)
             ON CONFLICT (collection, id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
            [u.col, u.id, JSON.stringify(u.data)]
          );
        }
        for (const d of ops.deletes) {
          await client.query('DELETE FROM records WHERE collection = $1 AND id = $2', [d.col, d.id]);
        }
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK').catch(() => {});
        throw e;
      } finally {
        client.release();
      }
    },
    async close() {
      await pool.end();
    },
  };
}

export async function createStorage(): Promise<Storage> {
  const url = process.env.DATABASE_URL;
  return url ? createPostgresStorage(url) : createFileStorage();
}

/** المفتاح الذي يميّز السجل داخل كل مجموعة. */
export function recordId(col: CollectionName, rec: any): string {
  return col === 'sessions' ? rec.token : rec.id;
}
