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


/** المفتاح الذي يميّز السجل داخل كل مجموعة. */
export function recordId(col: CollectionName, rec: any): string {
  return col === 'sessions' ? rec.token : rec.id;
}
