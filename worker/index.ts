import { DurableObject } from 'cloudflare:workers';
import { db } from '../server/db';
import { COLLECTIONS, Snapshot, Storage, WriteOps } from '../server/storage-core';

interface Client { id: string; name: string; role: string; color: string; ws: WebSocket }
interface Room { roomId: string; allowStudentDraw: boolean; background?: string; elements: any[]; clients: Set<Client> }

const J = (data: any, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

export interface Env { ADMIN_EMAIL?: string; ADMIN_PASSWORD?: string; ADMIN_NAME?: string; BOARD: DurableObjectNamespace; ASSETS: Fetcher }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const id = env.BOARD.idFromName('main');
    return env.BOARD.get(id).fetch(request);
  },
};

export class Board extends DurableObject<Env> {
  rooms = new Map<string, Room>();
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
    let body: any = {};
    if (method === 'POST' || method === 'PUT') {
      try { body = await request.json(); } catch { body = {}; }
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
      const { name, email, password, role } = body;
      if (!email || !password || !name) return J({ error: 'يرجى تعبئة جميع الحقول المطلوبة (الاسم، البريد، كلمة المرور)' }, 400);
      try {
        const user = db.createUser(name, email, password, role === 'student' ? 'student' : 'teacher');
        const t = db.createSession({ id: user.id, role: user.role, name: user.name, email: user.email });
        return J({ token: t, user: userPayload(user) });
      } catch (e: any) { return J({ error: e.message || 'فشل إنشاء الحساب' }, 400); }
    }
    if (p === '/api/auth/login' && method === 'POST') {
      const { email, password } = body;
      if (!email || !password) return J({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' }, 400);
      const user = db.authenticate(email, password);
      if (!user) return J({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, 401);
      const t = db.createSession({ id: user.id, role: user.role, name: user.name, email: user.email });
      return J({ token: t, user: userPayload(user) });
    }
    if (p === '/api/auth/guest' && method === 'POST') {
      const guestId = `guest_${Date.now()}`;
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
      const { title, background, elements, thumbnail, id } = body;
      if (!title) return J({ error: 'عنوان السبورة مطلوب' }, 400);
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
      const { type, questionText, surah, options, correctAnswer, explanation, points, circleId } = body;
      if (!questionText || !correctAnswer) return J({ error: 'نص السؤال والإجابة الصحيحة حقول مطلوبة' }, 400);
      const q = db.createQuestion(session!.userId, {
        type: type || 'mcq', questionText, surah, options: options || [], correctAnswer, explanation,
        points: Number(points) || 10, circleId,
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
      const { name, description, studentNames, color } = body;
      if (!name) return J({ error: 'اسم الحلقة مطلوب' }, 400);
      return J({ circle: db.createClass(session!.userId, name, description || '', studentNames || [], color) });
    }
    m = p.match(/^\/api\/classes\/([^/]+)$/);
    if (m && method === 'PUT') {
      const a = needAuth() || needTeacher(); if (a) return a;
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
      const { entityName, type, pointsDelta, reason, circleId } = body;
      if (!entityName || pointsDelta === undefined) return J({ error: 'الاسم وعدد النقاط مطلوبان' }, 400);
      return J({ point: db.addPoints(session!.userId, entityName, type === 'team' ? 'team' : 'student', Number(pointsDelta), reason || '', circleId) });
    }

    if (p === '/api/wheels' && method === 'GET') return J({ wheels: db.getWheels(session?.userId || '') });
    if (p === '/api/wheels' && method === 'POST') {
      const a = needAuth() || needTeacher(); if (a) return a;
      const { title, items, circleId, id } = body;
      if (!title || !items || !Array.isArray(items)) return J({ error: 'العنوان وعناصر العجلة مطلوبة' }, 400);
      return J({ wheel: db.saveWheel(session!.userId, title, items, circleId, id) });
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
    const pair = new WebSocketPair();
    const ws = pair[1];
    ws.accept();
    let roomId: string | null = null;
    let me: Client | null = null;

    ws.addEventListener('message', (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : new TextDecoder().decode(ev.data as ArrayBuffer));
        const room = roomId ? this.rooms.get(roomId) : undefined;
        switch (msg.type) {
          case 'join': {
            const { role, name, color } = msg;
            roomId = String(msg.roomId);
            let r = this.rooms.get(roomId);
            if (!r) { r = { roomId, allowStudentDraw: false, elements: [], clients: new Set() }; this.rooms.set(roomId, r); }
            me = {
              id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              name: name || (role === 'teacher' ? 'المعلم' : 'طالب'),
              role: role || 'student', color: color || '#2563eb', ws,
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
            if (msg.element) { room.elements.push(msg.element); this.broadcast(roomId, { type: 'element_added', element: msg.element }, ws); }
            break;
          case 'elements_batch':
            if (!room || !roomId) return;
            if (me?.role === 'teacher' && Array.isArray(msg.elements)) {
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
