import crypto from 'crypto';
import { Storage, COLLECTIONS, CollectionName, Snapshot, WriteOps, recordId } from './storage-core';

export interface UserRecord {
  iter?: number;
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
  role: 'admin' | 'teacher' | 'student' | 'guest';
  createdAt: number;
}

export interface SessionRecord {
  token: string;
  userId: string;
  role: 'admin' | 'teacher' | 'student' | 'guest';
  name: string;
  email: string;
  createdAt: number;
  expiresAt: number;
}

export interface BoardRecord {
  id: string;
  userId: string;
  title: string;
  background: string;
  elements: any[];
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
}

export interface QuestionRecord {
  id: string;
  userId: string;
  type: 'mcq' | 'true_false' | 'open' | 'complete_verse' | 'match_surah' | 'tajweed' | 'vocabulary';
  questionText: string;
  surah?: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  points?: number;
  circleId?: string;
  createdAt: number;
}

export interface CircleRecord {
  id: string;
  teacherId: string;
  name: string;
  description?: string;
  studentNames: string[];
  color?: string;
  createdAt: number;
}

export interface PointRecord {
  id: string;
  teacherId: string;
  circleId?: string;
  entityName: string;
  type: 'student' | 'team';
  score: number;
  reasons: string[];
  updatedAt: number;
}

export interface WheelRecord {
  id: string;
  userId: string;
  title: string;
  circleId?: string;
  items: string[];
  createdAt: number;
}

interface DatabaseSchema {
  users: UserRecord[];
  sessions: SessionRecord[];
  boards: BoardRecord[];
  questionBank: QuestionRecord[];
  classes: CircleRecord[];
  points: PointRecord[];
  wheels: WheelRecord[];
}

const PBKDF2_ITER = 100000;

function hashPassword(password: string, salt?: string, iter = PBKDF2_ITER): { hash: string; salt: string; iter: number } {
  const finalSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, finalSalt, iter, 64, 'sha512').toString('hex');
  return { hash, salt: finalSalt, iter };
}

function verifyPassword(password: string, hash: string, salt: string, iter = 10000): boolean {
  const calc = Buffer.from(crypto.pbkdf2Sync(password, salt, iter, 64, 'sha512').toString('hex'));
  const exp = Buffer.from(hash);
  return calc.length === exp.length && crypto.timingSafeEqual(calc, exp);
}

function emptyData(): DatabaseSchema {
  return { users: [], sessions: [], boards: [], questionBank: [], classes: [], points: [], wheels: [] };
}



class Database {
  private data: DatabaseSchema = {
    users: [], sessions: [], boards: [], questionBank: [], classes: [], points: [], wheels: [],
  };
  private storage: Storage | null = null;
  // آخر نسخة محفوظة فعليًا لكل سجل، لحساب الفروقات فقط وعدم إعادة كتابة كل شيء
  private known = new Map<string, string>();
  private flushing: Promise<void> | null = null;
  private dirty = false;
  private retryTimer: any = null;

  /** يجب استدعاؤها مرة واحدة قبل استقبال الطلبات. */
  async init(storage: Storage) {
    this.storage = storage;
    console.log(`[db] التخزين: ${this.storage.kind === 'postgres' ? 'PostgreSQL (دائم)' : 'ملف محلي (للتطوير فقط)'}`);
    const loaded = await this.storage.load();
    if (loaded) {
      this.data = loaded as unknown as DatabaseSchema;
      for (const c of COLLECTIONS) {
        for (const r of (this.data as any)[c]) this.known.set(`${c}:${recordId(c, r)}`, JSON.stringify(r));
      }
    } else {
      this.data = emptyData();
      await this.flushNow();
    }
    this.purgeExpiredSessions();
    this.bootstrapAdmin();
    const timer: any = setInterval(() => this.purgeExpiredSessions(), 60 * 60 * 1000);
    timer?.unref?.();
  }

  /** حساب الأدمن يُنشأ من متغيرات البيئة فقط، ولا توجد كلمات مرور افتراضية في الكود. */
  private bootstrapAdmin() {
    const email = process.env.ADMIN_EMAIL;
    const pass = process.env.ADMIN_PASSWORD;
    if (!email || !pass || this.findUserByEmail(email)) return;
    const { hash, salt, iter } = hashPassword(pass);
    this.data.users.push({
      id: `user_admin_${crypto.randomBytes(4).toString('hex')}`,
      email: email.toLowerCase().trim(),
      passwordHash: hash,
      salt,
      iter,
      name: process.env.ADMIN_NAME || 'مدير المنصة',
      role: 'admin',
      createdAt: Date.now(),
    });
    this.saveData();
  }

  private purgeExpiredSessions() {
    const before = this.data.sessions.length;
    this.data.sessions = this.data.sessions.filter((s) => s.expiresAt > Date.now());
    if (this.data.sessions.length !== before) this.saveData();
  }

  /** كل دالة تعديل تستدعي saveData؛ الكتابة الفعلية تتم بعدها مباشرة وبشكل مجمّع. */
  private saveData() {
    this.dirty = true;
    if (!this.flushing) this.flushing = this.flushLoop();
  }

  private async flushLoop() {
    try {
      while (this.dirty) {
        this.dirty = false;
        await this.flushNow();
      }
    } finally {
      this.flushing = null;
    }
  }

  private computeOps(): { ops: WriteOps; next: Map<string, string> } {
    const ops: WriteOps = { upserts: [], deletes: [] };
    const next = new Map<string, string>();
    for (const c of COLLECTIONS) {
      for (const r of (this.data as any)[c]) {
        const id = recordId(c, r);
        const json = JSON.stringify(r);
        next.set(`${c}:${id}`, json);
        if (this.known.get(`${c}:${id}`) !== json) ops.upserts.push({ col: c, id, data: r });
      }
    }
    for (const key of this.known.keys()) {
      if (!next.has(key)) {
        const i = key.indexOf(':');
        ops.deletes.push({ col: key.slice(0, i) as CollectionName, id: key.slice(i + 1) });
      }
    }
    return { ops, next };
  }

  private async flushNow() {
    if (!this.storage) return;
    const { ops, next } = this.computeOps();
    try {
      await this.storage.save(ops, () => this.data as unknown as Snapshot);
      this.known = next;
    } catch (err) {
      // لا نحدّث known، فيُعاد المحاولة تلقائيًا في الدورة التالية
      console.error('[db] فشل الحفظ، ستتم إعادة المحاولة:', err);
      if (!this.retryTimer) {
        this.retryTimer = setTimeout(() => { this.retryTimer = null; this.saveData(); }, 5000);
      }
    }
  }

  /** عند إيقاف الخادم: إنهاء أي كتابة معلّقة ثم إغلاق الاتصال. */
  async close() {
    if (this.flushing) await this.flushing;
    await this.flushNow();
    await this.storage?.close();
  }

  // --- Auth & Users ---
  findUserByEmail(email: string): UserRecord | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  findUserById(id: string): UserRecord | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  createUser(name: string, email: string, password: string, role: 'teacher' | 'student'): UserRecord {
    const existing = this.findUserByEmail(email);
    if (existing) {
      throw new Error('هذا البريد الإلكتروني مسجل مسبقاً');
    }

    const { hash, salt, iter } = hashPassword(password);
    const newUser: UserRecord = {
      id: `user_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      email: email.toLowerCase().trim(),
      passwordHash: hash,
      salt,
      iter,
      name: name.trim() || (role === 'teacher' ? 'المعلم' : 'طالب المستنير'),
      role,
      createdAt: Date.now(),
    };

    this.data.users.push(newUser);
    this.saveData();
    return newUser;
  }

  authenticate(email: string, password: string): UserRecord | null {
    const user = this.findUserByEmail(email);
    if (!user) return null;
    if (verifyPassword(password, user.passwordHash, user.salt, user.iter || 10000)) {
      if (!user.iter || user.iter < PBKDF2_ITER) {
        const h = hashPassword(password);
        user.passwordHash = h.hash; user.salt = h.salt; user.iter = h.iter;
        this.saveData();
      }
      return user;
    }
    return null;
  }

  resetPassword(email: string, newPass: string): boolean {
    const user = this.findUserByEmail(email);
    if (!user) return false;
    const { hash, salt, iter } = hashPassword(newPass);
    user.passwordHash = hash;
    user.salt = salt;
    user.iter = iter;
    this.saveData();
    return true;
  }

  // --- Sessions ---
  createSession(user: { id: string; role: 'admin' | 'teacher' | 'student' | 'guest'; name: string; email?: string }): string {
    const token = crypto.randomBytes(32).toString('hex');
    const session: SessionRecord = {
      token,
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email || '',
      createdAt: Date.now(),
      expiresAt: Date.now() + (user.role === 'guest' ? 24 : 30 * 24) * 60 * 60 * 1000, // ضيف: يوم، غيره: 30 يومًا
    };
    this.data.sessions.push(session);
    this.saveData();
    return token;
  }

  getSession(token: string): SessionRecord | null {
    const session = this.data.sessions.find((s) => s.token === token);
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      this.deleteSession(token);
      return null;
    }
    return session;
  }

  deleteSession(token: string) {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.saveData();
  }

  // --- Boards (Data Isolation by userId) ---
  getBoards(userId: string): BoardRecord[] {
    return this.data.boards
      .filter((b) => b.userId === userId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  saveBoard(userId: string, title: string, background: string, elements: any[], thumbnail?: string, boardId?: string): BoardRecord {
    if (boardId) {
      const idx = this.data.boards.findIndex((b) => b.id === boardId && b.userId === userId);
      if (idx !== -1) {
        this.data.boards[idx] = {
          ...this.data.boards[idx],
          title: title.trim(),
          background,
          elements,
          thumbnail: thumbnail || this.data.boards[idx].thumbnail,
          updatedAt: Date.now(),
        };
        this.saveData();
        return this.data.boards[idx];
      }
    }

    const newBoard: BoardRecord = {
      id: `board_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId,
      title: title.trim() || 'سبورة بدون عنوان',
      background: background || 'plain',
      elements: elements || [],
      thumbnail,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.data.boards.push(newBoard);
    this.saveData();
    return newBoard;
  }

  deleteBoard(userId: string, boardId: string): boolean {
    const beforeLen = this.data.boards.length;
    this.data.boards = this.data.boards.filter((b) => !(b.id === boardId && b.userId === userId));
    const changed = this.data.boards.length !== beforeLen;
    if (changed) this.saveData();
    return changed;
  }

  // --- Question Bank ---
  getQuestions(userId: string, role: string): QuestionRecord[] {
    // Teachers see questions they created, plus global seed questions; students can view questions for quiz
    if (role === 'teacher' || role === 'admin') {
      return this.data.questionBank.filter((q) => q.userId === userId || q.userId === 'user_teacher_default');
    }
    // غير المعلمين (ضيف/طالب/زائر) لا يرون إلا الأسئلة العامة، وليس أسئلة المعلمين الخاصة
    return this.data.questionBank.filter((q) => q.userId === 'user_teacher_default');
  }

  createQuestion(userId: string, data: Omit<QuestionRecord, 'id' | 'userId' | 'createdAt'>): QuestionRecord {
    const newQ: QuestionRecord = {
      ...data,
      id: `q_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId,
      createdAt: Date.now(),
    };
    this.data.questionBank.push(newQ);
    this.saveData();
    return newQ;
  }

  updateQuestion(userId: string, id: string, data: Partial<QuestionRecord>): QuestionRecord | null {
    const idx = this.data.questionBank.findIndex((q) => q.id === id && (q.userId === userId || q.userId === 'user_teacher_default'));
    if (idx === -1) return null;
    const allowed = ['type','questionText','surah','options','correctAnswer','explanation','points','circleId'];
    const clean: any = {};
    for (const k of allowed) if ((data as any)[k] !== undefined) clean[k] = (data as any)[k];
    this.data.questionBank[idx] = { ...this.data.questionBank[idx], ...clean };
    this.saveData();
    return this.data.questionBank[idx];
  }

  deleteQuestion(userId: string, id: string): boolean {
    const beforeLen = this.data.questionBank.length;
    this.data.questionBank = this.data.questionBank.filter((q) => !(q.id === id && (q.userId === userId || q.userId === 'user_teacher_default')));
    const changed = this.data.questionBank.length !== beforeLen;
    if (changed) this.saveData();
    return changed;
  }

  // --- Classes & Circles ---
  getClasses(teacherId: string): CircleRecord[] {
    return this.data.classes.filter((c) => c.teacherId === teacherId || c.teacherId === 'user_teacher_default');
  }

  createClass(teacherId: string, name: string, description: string, studentNames: string[], color?: string): CircleRecord {
    const newCircle: CircleRecord = {
      id: `circle_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      teacherId,
      name: name.trim(),
      description: description.trim(),
      studentNames: studentNames.filter((s) => s.trim().length > 0),
      color: color || '#059669',
      createdAt: Date.now(),
    };
    this.data.classes.push(newCircle);
    this.saveData();
    return newCircle;
  }

  updateClass(teacherId: string, id: string, updates: Partial<CircleRecord>): CircleRecord | null {
    const idx = this.data.classes.findIndex((c) => c.id === id && (c.teacherId === teacherId || c.teacherId === 'user_teacher_default'));
    if (idx === -1) return null;
    const allowedC = ['name','description','studentNames','color'];
    const cleanC: any = {};
    for (const k of allowedC) if ((updates as any)[k] !== undefined) cleanC[k] = (updates as any)[k];
    this.data.classes[idx] = { ...this.data.classes[idx], ...cleanC };
    this.saveData();
    return this.data.classes[idx];
  }

  deleteClass(teacherId: string, id: string): boolean {
    const beforeLen = this.data.classes.length;
    this.data.classes = this.data.classes.filter((c) => !(c.id === id && (c.teacherId === teacherId || c.teacherId === 'user_teacher_default')));
    const changed = this.data.classes.length !== beforeLen;
    if (changed) this.saveData();
    return changed;
  }

  // --- Points System ---
  getPoints(teacherId: string, circleId?: string): PointRecord[] {
    return this.data.points.filter((p) => {
      const matchTeacher = p.teacherId === teacherId || p.teacherId === 'user_teacher_default';
      return circleId ? matchTeacher && p.circleId === circleId : matchTeacher;
    });
  }

  addPoints(teacherId: string, entityName: string, type: 'student' | 'team', pointsDelta: number, reason: string, circleId?: string): PointRecord {
    const existing = this.data.points.find(
      (p) => (p.teacherId === teacherId || p.teacherId === 'user_teacher_default') && p.entityName === entityName && p.type === type && p.circleId === circleId
    );

    if (existing) {
      existing.score = Math.max(0, existing.score + pointsDelta);
      if (reason) existing.reasons.push(reason);
      existing.updatedAt = Date.now();
      this.saveData();
      return existing;
    }

    const newPoint: PointRecord = {
      id: `pts_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      teacherId,
      circleId,
      entityName,
      type,
      score: Math.max(0, pointsDelta),
      reasons: reason ? [reason] : [],
      updatedAt: Date.now(),
    };
    this.data.points.push(newPoint);
    this.saveData();
    return newPoint;
  }

  // --- Spinning Wheels ---
  getWheels(userId: string): WheelRecord[] {
    return this.data.wheels.filter((w) => w.userId === userId || w.userId === 'user_teacher_default');
  }

  saveWheel(userId: string, title: string, items: string[], circleId?: string, wheelId?: string): WheelRecord {
    if (wheelId) {
      const idx = this.data.wheels.findIndex((w) => w.id === wheelId && (w.userId === userId || w.userId === 'user_teacher_default'));
      if (idx !== -1) {
        this.data.wheels[idx] = {
          ...this.data.wheels[idx],
          title: title.trim(),
          items,
          circleId,
        };
        this.saveData();
        return this.data.wheels[idx];
      }
    }

    const newWheel: WheelRecord = {
      id: `wheel_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId,
      title: title.trim(),
      items,
      circleId,
      createdAt: Date.now(),
    };
    this.data.wheels.push(newWheel);
    this.saveData();
    return newWheel;
  }

  deleteWheel(userId: string, wheelId: string): boolean {
    const beforeLen = this.data.wheels.length;
    this.data.wheels = this.data.wheels.filter((w) => !(w.id === wheelId && (w.userId === userId || w.userId === 'user_teacher_default')));
    const changed = this.data.wheels.length !== beforeLen;
    if (changed) this.saveData();
    return changed;
  }
}

export const db = new Database();
