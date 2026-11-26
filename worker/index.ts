import { DurableObject } from 'cloudflare:workers';
import { db } from '../server/db';
import { COLLECTIONS, Snapshot, Storage, WriteOps } from '../server/storage-core';

interface Client { id: string; name: string; role: string; color: string; ws: WebSocket }
interface Room { ownerUid: string | null; roomId: string; allowStudentDraw: boolean; background?: string; elements: any[]; clients: Set<Client> }

const SEC_HEADERS: Record<string, string> = {
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'SAMEORIGIN',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(self), microphone=(self), geolocation=(), payment=()',
  'cache-control': 'no-store',
};
const J = (data: any, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...SEC_HEADERS } });

const MAX_BODY = 12 * 1024 * 1024;
const MAX_WS_MSG = 4 * 1024 * 1024;
const MAX_ROOMS = 300;
const MAX_CLIENTS_PER_ROOM = 80;
const MAX_ELEMENTS_PER_ROOM = 5000;
const str = (v: any, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

export interface Env { ADMIN_EMAIL?: string; ADMIN_PASSWORD?: string; ADMIN_NAME?: string; BOARD: DurableObjectNamespace; ASSETS: Fetcher }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const id = env.BOARD.idFromName('main');
    return env.BOARD.get(id).fetch(request);
  },
};

export class Board extends DurableObject<Env> {
  rooms = new Map<string, Room>();
  hits = new Map<string, number[]>();

  limited(key: string, max: number, windowMs: number): boolean {
    const now = Date.now();
    const arr = (this.hits.get(key) || []).filter((t) => now - t < windowMs);
    if (arr.length >= max) { this.hits.set(key, arr); return true; }
    arr.push(now); this.hits.set(key, arr);
    if (this.hits.size > 5000) { for (const [k, v] of this.hits) if (!v.some((t) => now - t < windowMs)) this.hits.delete(k); }
    return false;
  }
  ready: Promise<void>;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    const p: any = (globalThis as any).process;
    if (p?.env) {
      if (env.ADMIN_EMAIL) p.env.ADMIN_EMAIL = env.ADMIN_EMAIL;
      if (env.ADMIN_PASSWORD) p.env.ADMIN_PASSWORD = env.ADMIN_PASSWORD;
      if (env.ADMIN_NAME) p.env.ADMIN_NAME = env.ADMIN_NAME;
    }
    const sql = ctx.storage.sql;
    sql.exec('CREATE TABLE IF NOT EXISTS records (col TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY (col, id))');
    const storage: Storage = {
      kind: 'file',
      async load() {
        const n = sql.exec("SELECT count(*) AS n FROM records").one().n as number;
        const meta = sql.exec("SELECT count(*) AS n FROM records WHERE col='_meta'").one().n as number;
        if (n === 0 && meta === 0) return null;
        const snap: any = {};
        for (const c of COLLECTIONS) snap[c] = [];
        for (const r of sql.exec("SELECT col, data FROM records WHERE col != '_meta'")) {
          if (snap[r.col as string]) snap[r.col as string].push(JSON.parse(r.data as string));
        }
        return snap as Snapshot;
      },
      async save(ops: WriteOps) {
        ctx.storage.transactionSync(() => {
          for (const u of ops.upserts) sql.exec('INSERT OR REPLACE INTO records (col,id,data) VALUES (?,?,?)', u.col, u.id, JSON.stringify(u.data));
          for (const d of ops.deletes) sql.exec('DELETE FROM records WHERE col=? AND id=?', d.col, d.id);
          sql.exec("INSERT OR REPLACE INTO records (col,id,data) VALUES ('_meta','init','1')");
        });
      },
      async close() {},
    };
    this.ready = ctx.blockConcurrencyWhile(async () => { await db.init(storage); });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/ws') return this.handleWs(request);
    if (url.pathname.startsWith('/api/')) {
      try { return await this.handleApi(request, url); }
      catch (e: any) { console.error(e); return J({ error: 'خطأ في الخادم' }, 500); }
    }
    return (this.env as any).ASSETS.fetch(request);
  }

  // ---------- REST ----------
  async handleApi(request: Request, url: URL): Promise<Response> {
    const method = request.method;
    const p = url.pathname;
    const ip = request.headers.get('cf-connecting-ip') || 'x';
    const origin = request.headers.get('origin');
    if (method !== 'GET' && method !== 'HEAD' && origin && new URL(origin).host !== url.host) return J({ error: 'طلب غير مسموح' }, 403);
    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: SEC_HEADERS });
    let body: any = {};
    if (method === 'POST' || method === 'PUT') {
      const len = Number(request.headers.get('content-length') || 0);
      if (len > MAX_BODY) return J({ error: 'الحجم كبير جدًا' }, 413);
      try { const txt = await request.text(); if (txt.length > MAX_BODY) return J({ error: 'الحجم كبير جدًا' }, 413); body = JSON.parse(txt); } catch { body = {}; }
      if (!body || typeof body !== 'object') body = {};
    }
    const auth = request.headers.get('authorization');
    const token = auth && auth.startsWith('Bearer ') ? auth.substring(7) : null;
    const session = token ? db.getSession(token) : null;

    const needAuth = () => session ? null : J({ error: token ? 'جلسة الدخول منتهية أو غير صالحة' : 'غير مصرح: يجب تسجيل الدخول أولاً' }, 401);
    const needTeacher = () => (session!.role !== 'teacher' && session!.role !== 'admin')
      ? J({ error: 'صلاحيات غير كافية: هذا الإجراء مخصص لحسابات المعلمين فقط' }, 403) : null;
    const userPayload = (u: any) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

    if (p === '/api/health' && method === 'GET') return J({ status: 'ok', time: new Date().toISOString() });

    if (p === '/api/auth/register' && method === 'POST') {
      if (this.limited('reg:' + ip, 30, 60 * 60 * 1000)) return J({ error: 'محاولات كثيرة، حاول لاحقًا' }, 429);
      const name = str(body.name, 80), email = str(body.email, 200), password = typeof body.password === 'string' ? body.password : '', role = body.role;
      if (!EMAIL_RE.test(email)) return J({ error: 'البريد الإلكتروني غير صالح' }, 400);
      if (password.length < 8 || password.length > 200) return J({ error: 'كلمة المرور يجب ألا تقل عن 8 أحرف' }, 400);
      if (!email || !password || !name) return J({ error: 'يرجى تعبئة جميع الحقول المطلوبة (الاسم، البريد، كلمة المرور)' }, 400);
      try {
        const user = db.createUser(name, email, password, role === 'student' ? 'student' : 'teacher');
        const t = db.createSession({ id: user.id, role: user.role, name: user.name, email: user.email });
        return J({ token: t, user: userPayload(user) });
      } catch (e: any) { return J({ error: e.message || 'فشل إنشاء الحساب' }, 400); }
    }
    if (p === '/api/auth/login' && method === 'POST') {
      const email = str(body.email, 200), password = typeof body.password === 'string' ? body.password.slice(0, 200) : '';
      if (!email || !password) return J({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' }, 400);
      if (this.limited('login:' + ip, 30, 10 * 60 * 1000) || this.limited('loginE:' + email.toLowerCase(), 8, 10 * 60 * 1000)) return J({ error: 'محاولات دخول كثيرة. انتظر عدة دقائق ثم أعد المحاولة.' }, 429);
      const user = db.authenticate(email, password);
      if (!user) return J({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, 401);
      this.hits.delete('loginE:' + email.toLowerCase());
      const t = db.createSession({ id: user.id, role: user.role, name: user.name, email: user.email });
      return J({ token: t, user: userPayload(user) });
    }
    if (p === '/api/auth/guest' && method === 'POST') {
      if (this.limited('guest:' + ip, 300, 60 * 60 * 1000)) return J({ error: 'محاولات كثيرة، حاول لاحقًا' }, 429);
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const t = db.createSession({ id: guestId, role: 'guest', name: 'ضيف المستنير' });
      return J({ token: t, user: { id: guestId, name: 'ضيف المستنير', email: '', role: 'guest' } });
    }
    if (p === '/api/auth/me' && method === 'GET') {
      const a = needAuth(); if (a) return a;
      return J({ user: { id: session!.userId, name: session!.name, email: session!.email, role: session!.role } });
    }
    if (p === '/api/auth/logout' && method === 'POST') {
      const a = needAuth(); if (a) return a;
      db.deleteSession(token!);
      return J({ success: true });
    }
    if (p === '/api/auth/reset-password' && method === 'POST') {
      return J({ error: 'استعادة كلمة المرور غير متاحة حاليًا. تواصلي مع إدارة المنصة.' }, 501);
    }

    if (p === '/api/boards' && method === 'GET') {
      const a = needAuth(); if (a) return a;
      return J({ boards: db.getBoards(session!.userId) });
    }
    if (p === '/api/boards' && method === 'POST') {
      const a = needAuth(); if (a) return a;
      if (session!.role === 'guest') return J({ error: 'الحفظ الدائم يتطلب حسابًا. سجّل الدخول أو أنشئ حسابًا.' }, 403);
      const title = str(body.title, 200), background = str(body.background, 60) || 'plain', elements = Array.isArray(body.elements) ? body.elements : [], thumbnail = typeof body.thumbnail === 'string' && body.thumbnail.length < 1_500_000 ? body.thumbnail : undefined, id = typeof body.id === 'string' ? body.id : undefined;
      if (!title) return J({ error: 'عنوان السبورة مطلوب' }, 400);
      if (!id && db.getBoards(session!.userId).length >= 300) return J({ error: 'وصلت للحد الأقصى من السبورات المحفوظة' }, 400);
      return J({ board: db.saveBoard(session!.userId, title, background, elements, thumbnail, id) });
    }
    let m = p.match(/^\/api\/boards\/([^/]+)$/);
    if (m && method === 'DELETE') {
      const a = needAuth(); if (a) return a;
      return J({ success: db.deleteBoard(session!.userId, decodeURIComponent(m[1])) });
    }

    if (p === '/api/question-bank' && method === 'GET') {
      return J({ questions: db.getQuestions(session?.userId || '', session?.role || 'student') });
    }
    if (p === '/api/question-bank' && method === 'POST') {
      const a = needAuth() || needTeacher(); if (a) return a;
      const questionText = str(body.questionText, 2000), correctAnswer = str(body.correctAnswer, 1000);
      if (!questionText || !correctAnswer) return J({ error: 'نص السؤال والإجابة الصحيحة حقول مطلوبة' }, 400);
      if (db.getQuestions(session!.userId, session!.role).length >= 3000) return J({ error: 'وصلت للحد الأقصى من الأسئلة' }, 400);
      const options = Array.isArray(body.options) ? body.options.slice(0, 10).map((o: any) => str(o, 500)) : [];
      const q = db.createQuestion(session!.userId, {
        type: str(body.type, 30) || 'mcq', questionText, surah: str(body.surah, 100), options, correctAnswer, explanation: str(body.explanation, 2000),
        points: Math.min(1000, Math.max(0, Number(body.points) || 10)), circleId: typeof body.circleId === 'string' ? body.circleId.slice(0, 100) : undefined,
      } as any);
      return J({ question: q });
    }
    m = p.match(/^\/api\/question-bank\/([^/]+)$/);
    if (m && method === 'PUT') {
      const a = needAuth() || needTeacher(); if (a) return a;
      const u = db.updateQuestion(session!.userId, decodeURIComponent(m[1]), body);
      return u ? J({ question: u }) : J({ error: 'السؤال غير موجود أو ليس لديك صلاحية تعديله' }, 404);
    }
    if (m && method === 'DELETE') {
      const a = needAuth() || needTeacher(); if (a) return a;
      return J({ success: db.deleteQuestion(session!.userId, decodeURIComponent(m[1])) });
    }

    if (p === '/api/classes' && method === 'GET') {
      const a = needAuth(); if (a) return a;
      return J({ classes: db.getClasses(session!.userId) });
    }
    if (p === '/api/classes' && method === 'POST') {
      const a = needAuth() || needTeacher(); if (a) return a;
      const name = str(body.name, 100);
      if (!name) return J({ error: 'اسم الحلقة مطلوب' }, 400);
      if (db.getClasses(session!.userId).length >= 200) return J({ error: 'وصلت للحد الأقصى من الحلقات' }, 400);
      const studentNames = Array.isArray(body.studentNames) ? body.studentNames.slice(0, 300).map((s: any) => str(s, 80)) : [];
      return J({ circle: db.createClass(session!.userId, name, str(body.description, 1000), studentNames, str(body.color, 30) || undefined) });
    }
    m = p.match(/^\/api\/classes\/([^/]+)$/);
    if (m && method === 'PUT') {
      const a = needAuth() || needTeacher(); if (a) return a;
      if (Array.isArray(body.studentNames)) body.studentNames = body.studentNames.slice(0, 300).map((s: any) => str(s, 80));
      if (typeof body.name === 'string') body.name = str(body.name, 100);
      const u = db.updateClass(session!.userId, decodeURIComponent(m[1]), body);
      return u ? J({ circle: u }) : J({ error: 'الحلقة غير موجودة' }, 404);
    }
    if (m && method === 'DELETE') {
      const a = needAuth() || needTeacher(); if (a) return a;
      return J({ success: db.deleteClass(session!.userId, decodeURIComponent(m[1])) });
    }

    if (p === '/api/points' && method === 'GET') {
      return J({ points: db.getPoints(session?.userId || '', url.searchParams.get('circleId') || undefined) });
    }
    if (p === '/api/points' && method === 'POST') {
      const a = needAuth() || needTeacher(); if (a) return a;
      const entityName = str(body.entityName, 100), pointsDelta = Number(body.pointsDelta);
      if (!entityName || body.pointsDelta === undefined || !Number.isFinite(pointsDelta) || Math.abs(pointsDelta) > 100000) return J({ error: 'الاسم وعدد النقاط مطلوبان' }, 400);
      return J({ point: db.addPoints(session!.userId, entityName, body.type === 'team' ? 'team' : 'student', pointsDelta, str(body.reason, 300), typeof body.circleId === 'string' ? body.circleId.slice(0, 100) : undefined) });
    }

    if (p === '/api/wheels' && method === 'GET') return J({ wheels: db.getWheels(session?.userId || '') });
    if (p === '/api/wheels' && method === 'POST') {
      const a = needAuth() || needTeacher(); if (a) return a;
      const title = str(body.title, 100);
      if (!title || !Array.isArray(body.items)) return J({ error: 'العنوان وعناصر العجلة مطلوبة' }, 400);
      const items = body.items.slice(0, 100).map((s: any) => str(s, 100));
      return J({ wheel: db.saveWheel(session!.userId, title, items, typeof body.circleId === 'string' ? body.circleId.slice(0, 100) : undefined, typeof body.id === 'string' ? body.id : undefined) });
    }
    m = p.match(/^\/api\/wheels\/([^/]+)$/);
    if (m && method === 'DELETE') {
      const a = needAuth() || needTeacher(); if (a) return a;
      return J({ success: db.deleteWheel(session!.userId, decodeURIComponent(m[1])) });
    }

    m = p.match(/^\/api\/rooms\/([^/]+)$/);
    if (m && method === 'GET') {
      const room = this.rooms.get(decodeURIComponent(m[1]));
      if (!room) return J({ error: 'الغرفة غير موجودة' }, 404);
      return J({ roomId: room.roomId, allowStudentDraw: room.allowStudentDraw, participantCount: room.clients.size });
    }
    return J({ error: 'غير موجود' }, 404);
  }

  // ---------- WebSocket ----------
  participants(room: Room) {
    return Array.from(room.clients).map((c) => ({ id: c.id, name: c.name, role: c.role, color: c.color }));
  }
  broadcast(roomId: string, data: any, except?: WebSocket) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const json = JSON.stringify(data);
    room.clients.forEach((c) => {
      if (c.ws !== except) { try { c.ws.send(json); } catch {} }
    });
  }

  handleWs(request: Request): Response {
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected websocket', { status: 426 });
    const wo = request.headers.get('origin');
    if (wo && new URL(wo).host !== new URL(request.url).host) return new Response('Forbidden', { status: 403 });
    const wip = request.headers.get('cf-connecting-ip') || 'x';
    if (this.limited('ws:' + wip, 60, 60 * 1000)) return new Response('Too many connections', { status: 429 });
    const pair = new WebSocketPair();
    const ws = pair[1];
    ws.accept();
    let roomId: string | null = null;
    let me: Client | null = null;

    ws.addEventListener('message', (ev: MessageEvent) => {
      try {
        const raw = typeof ev.data === 'string' ? ev.data : new TextDecoder().decode(ev.data as ArrayBuffer);
        if (raw.length > MAX_WS_MSG) return;
        const msg = JSON.parse(raw);
        const room = roomId ? this.rooms.get(roomId) : undefined;
        switch (msg.type) {
          case 'join': {
            if (me) return;
            const rid = str(msg.roomId, 40);
            if (!rid) return;
            const sess = typeof msg.token === 'string' ? db.getSession(msg.token) : null;
            let r = this.rooms.get(rid);
            let role: string = msg.role === 'teacher' ? 'teacher' : 'student';
            if (!r) {
              if (role !== 'teacher' || this.rooms.size >= MAX_ROOMS) { ws.send(JSON.stringify({ type: 'error', message: 'الغرفة غير موجودة' })); return; }
              r = { roomId: rid, ownerUid: sess ? sess.userId : null, allowStudentDraw: false, elements: [], clients: new Set() };
              this.rooms.set(rid, r);
            } else if (role === 'teacher') {
              const teacherOnline = Array.from(r.clients).some((c) => c.role === 'teacher');
              if (r.ownerUid ? !sess || sess.userId !== r.ownerUid : teacherOnline) role = 'student';
            }
            if (r.clients.size >= MAX_CLIENTS_PER_ROOM) { ws.send(JSON.stringify({ type: 'error', message: 'الغرفة ممتلئة' })); return; }
            roomId = rid;
            const color = /^#[0-9a-fA-F]{3,8}$/.test(String(msg.color)) ? String(msg.color) : '#2563eb';
            me = {
              id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              name: str(msg.name, 60) || (role === 'teacher' ? 'المعلم' : 'طالب'),
              role, color, ws,
            };
            r.clients.add(me);
            ws.send(JSON.stringify({
              type: 'joined', clientId: me.id, roomId, role: me.role, allowStudentDraw: r.allowStudentDraw,
              background: r.background || 'plain', elements: r.elements, participants: this.participants(r),
            }));
            this.broadcast(roomId, { type: 'participants_update', participants: this.participants(r) });
            break;
          }
          case 'element_add':
            if (!room || !roomId) return;
            if (me?.role === 'student' && !room.allowStudentDraw) return;
            if (msg.element && typeof msg.element === 'object' && room.elements.length < MAX_ELEMENTS_PER_ROOM) { room.elements.push(msg.element); this.broadcast(roomId, { type: 'element_added', element: msg.element }, ws); }
            break;
          case 'elements_batch':
            if (!room || !roomId) return;
            if (me?.role === 'teacher' && Array.isArray(msg.elements) && msg.elements.length <= MAX_ELEMENTS_PER_ROOM) {
              room.elements = msg.elements;
              this.broadcast(roomId, { type: 'sync_all_elements', elements: room.elements }, ws);
            }
            break;
          case 'element_update':
            if (!room || !roomId) return;
            if (me?.role === 'student' && !room.allowStudentDraw) return;
            if (msg.id && msg.updated) {
              const cur = room.elements.find((e) => e.id === msg.id);
              if (cur?.isLocked && msg.updated.isLocked === undefined) return;
              room.elements = room.elements.map((e) => (e.id === msg.id ? { ...e, ...msg.updated } : e));
              this.broadcast(roomId, { type: 'element_updated', id: msg.id, updated: msg.updated }, ws);
            }
            break;
          case 'element_delete':
            if (!room || !roomId) return;
            if (me?.role === 'student' && !room.allowStudentDraw) return;
            if (msg.id) {
              const cur = room.elements.find((e) => e.id === msg.id);
              if (cur?.isLocked) return;
              room.elements = room.elements.filter((e) => e.id !== msg.id);
              this.broadcast(roomId, { type: 'element_deleted', id: msg.id }, ws);
            }
            break;
          case 'background_change':
            if (!room || !roomId || me?.role !== 'teacher') return;
            room.background = msg.background;
            this.broadcast(roomId, { type: 'background_changed', background: msg.background }, ws);
            break;
          case 'clear_board':
          case 'CLEAR_ALL':
            if (!room || !roomId || me?.role !== 'teacher') return;
            room.elements = [];
            this.broadcast(roomId, { type: 'board_cleared' });
            break;
          case 'toggle_student_draw':
            if (!room || !roomId || me?.role !== 'teacher') return;
            room.allowStudentDraw = Boolean(msg.allow);
            this.broadcast(roomId, { type: 'student_draw_toggled', allow: room.allowStudentDraw });
            break;
          case 'reveal_stage':
            if (!room || !roomId || me?.role !== 'teacher') return;
            this.broadcast(roomId, { type: 'reveal_stage', stageId: msg.stageId, stageTitle: msg.stageTitle, stages: msg.stages });
            break;
          case 'reveal_path_sync':
            if (!room || !roomId || me?.role !== 'teacher') return;
            this.broadcast(roomId, { type: 'reveal_path_sync', revealPath: msg.revealPath });
            break;
          case 'cursor_move':
            if (!roomId) return;
            this.broadcast(roomId, { type: 'cursor_moved', cursor: { id: me?.id, name: me?.name, role: me?.role, color: me?.color, x: msg.x, y: msg.y } }, ws);
            break;
          case 'end_session':
            if (!room || !roomId || me?.role !== 'teacher') return;
            this.broadcast(roomId, { type: 'session_ended' });
            this.rooms.delete(roomId);
            break;
        }
      } catch (e) { console.error('ws error', e); }
    });

    const onClose = () => {
      if (!roomId || !me) return;
      const r = this.rooms.get(roomId);
      if (!r) return;
      r.clients.delete(me);
      if (r.clients.size === 0) this.rooms.delete(roomId);
      else this.broadcast(roomId, { type: 'participants_update', participants: this.participants(r) });
      me = null;
    };
    ws.addEventListener('close', onClose);
    ws.addEventListener('error', onClose);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }
}
