import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';

interface ClientInfo {
  id: string;
  name: string;
  role: 'teacher' | 'student';
  color: string;
  ws: WebSocket;
}

interface RoomData {
  roomId: string;
  teacherWs: WebSocket | null;
  allowStudentDraw: boolean;
  background?: string;
  elements: any[];
  clients: Set<ClientInfo>;
}

const rooms = new Map<string, RoomData>();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
app.use(express.json({ limit: '15mb' }));

// Authentication Middleware
function authenticate(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'غير مصرح: يجب تسجيل الدخول أولاً' });
  }
  const token = authHeader.substring(7);
  const session = db.getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'جلسة الدخول منتهية أو غير صالحة' });
  }
  req.user = session;
  next();
}

// Optional Auth (for public or guest accessible routes)
function optionalAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const session = db.getSession(token);
    if (session) {
      req.user = session;
    }
  }
  next();
}

// RBAC: Require Teacher Role
function requireTeacher(req: any, res: any, next: any) {
  if (req.user?.role !== 'teacher' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'صلاحيات غير كافية: هذا الإجراء مخصص لحسابات المعلمين فقط' });
  }
  next();
}

// --- REST Endpoints ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 1. AUTHENTICATION & SESSIONS
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'يرجى تعبئة جميع الحقول المطلوبة (الاسم، البريد، كلمة المرور)' });
    }
    const userRole = role === 'student' ? 'student' : 'teacher';
    const user = db.createUser(name, email, password, userRole);
    const token = db.createSession({
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    });
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'فشل إنشاء الحساب' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
  }
  const user = db.authenticate(email, password);
  if (!user) {
    return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
  }
  const token = db.createSession({
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });
  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

app.post('/api/auth/guest', (req, res) => {
  const guestId = `guest_${Date.now()}`;
  const token = db.createSession({
    id: guestId,
    role: 'guest',
    name: 'ضيف المستنير',
  });
  return res.json({
    token,
    user: {
      id: guestId,
      name: 'ضيف المستنير',
      email: '',
      role: 'guest',
    },
  });
});

app.get('/api/auth/me', authenticate, (req: any, res) => {
  return res.json({
    user: {
      id: req.user.userId,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

app.post('/api/auth/logout', authenticate, (req: any, res) => {
  const token = req.headers.authorization.substring(7);
  db.deleteSession(token);
  return res.json({ success: true });
});

app.post('/api/auth/reset-password', (_req, res) => {
  // معطّل عمدًا: لا يوجد تحقق بالبريد، وتركه مفتوحًا يسمح لأي شخص بتغيير كلمة مرور أي حساب.
  return res.status(501).json({ error: 'استعادة كلمة المرور غير متاحة حاليًا. تواصلي مع إدارة المنصة.' });
});

// 2. BOARDS PERSISTENCE (Teacher / User Data Isolation)
app.get('/api/boards', authenticate, (req: any, res) => {
  const boards = db.getBoards(req.user.userId);
  return res.json({ boards });
});

app.post('/api/boards', authenticate, (req: any, res) => {
  const { title, background, elements, thumbnail, id } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'عنوان السبورة مطلوب' });
  }
  const board = db.saveBoard(req.user.userId, title, background, elements, thumbnail, id);
  return res.json({ board });
});

app.delete('/api/boards/:id', authenticate, (req: any, res) => {
  const ok = db.deleteBoard(req.user.userId, req.params.id);
  return res.json({ success: ok });
});

// 3. QUESTION BANK (CRUD & Filter)
app.get('/api/question-bank', optionalAuth, (req: any, res) => {
  const userId = req.user?.userId || '';
  const role = req.user?.role || 'student';
  const questions = db.getQuestions(userId, role);
  return res.json({ questions });
});

app.post('/api/question-bank', authenticate, requireTeacher, (req: any, res) => {
  const { type, questionText, surah, options, correctAnswer, explanation, points, circleId } = req.body;
  if (!questionText || !correctAnswer) {
    return res.status(400).json({ error: 'نص السؤال والإجابة الصحيحة حقول مطلوبة' });
  }
  const q = db.createQuestion(req.user.userId, {
    type: type || 'mcq',
    questionText,
    surah,
    options: options || [],
    correctAnswer,
    explanation,
    points: Number(points) || 10,
    circleId,
  });
  return res.json({ question: q });
});

app.put('/api/question-bank/:id', authenticate, requireTeacher, (req: any, res) => {
  const updated = db.updateQuestion(req.user.userId, req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'السؤال غير موجود أو ليس لديك صلاحية تعديله' });
  }
  return res.json({ question: updated });
});

app.delete('/api/question-bank/:id', authenticate, requireTeacher, (req: any, res) => {
  const ok = db.deleteQuestion(req.user.userId, req.params.id);
  return res.json({ success: ok });
});

// 4. CLASSES & CIRCLES
app.get('/api/classes', authenticate, (req: any, res) => {
  const classes = db.getClasses(req.user.userId);
  return res.json({ classes });
});

app.post('/api/classes', authenticate, requireTeacher, (req: any, res) => {
  const { name, description, studentNames, color } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'اسم الحلقة مطلوب' });
  }
  const circle = db.createClass(req.user.userId, name, description || '', studentNames || [], color);
  return res.json({ circle });
});

app.put('/api/classes/:id', authenticate, requireTeacher, (req: any, res) => {
  const updated = db.updateClass(req.user.userId, req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'الحلقة غير موجودة' });
  }
  return res.json({ circle: updated });
});

app.delete('/api/classes/:id', authenticate, requireTeacher, (req: any, res) => {
  const ok = db.deleteClass(req.user.userId, req.params.id);
  return res.json({ success: ok });
});

// 5. POINTS & REWARDS LEADERBOARD
app.get('/api/points', optionalAuth, (req: any, res) => {
  const teacherId = req.user?.userId || '';
  const circleId = req.query.circleId as string | undefined;
  const points = db.getPoints(teacherId, circleId);
  return res.json({ points });
});

app.post('/api/points', authenticate, requireTeacher, (req: any, res) => {
  const { entityName, type, pointsDelta, reason, circleId } = req.body;
  if (!entityName || pointsDelta === undefined) {
    return res.status(400).json({ error: 'الاسم وعدد النقاط مطلوبان' });
  }
  const point = db.addPoints(
    req.user.userId,
    entityName,
    type === 'team' ? 'team' : 'student',
    Number(pointsDelta),
    reason || '',
    circleId
  );
  return res.json({ point });
});

// 6. SPINNER WHEELS
app.get('/api/wheels', optionalAuth, (req: any, res) => {
  const userId = req.user?.userId || '';
  const wheels = db.getWheels(userId);
  return res.json({ wheels });
});

app.post('/api/wheels', authenticate, requireTeacher, (req: any, res) => {
  const { title, items, circleId, id } = req.body;
  if (!title || !items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'العنوان وعناصر العجلة مطلوبة' });
  }
  const wheel = db.saveWheel(req.user.userId, title, items, circleId, id);
  return res.json({ wheel });
});

app.delete('/api/wheels/:id', authenticate, requireTeacher, (req: any, res) => {
  const ok = db.deleteWheel(req.user.userId, req.params.id);
  return res.json({ success: ok });
});

// Check room existence
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: 'الغرفة غير موجودة' });
  }
  return res.json({
    roomId: room.roomId,
    allowStudentDraw: room.allowStudentDraw,
    participantCount: room.clients.size,
  });
});

async function startServer() {
  await db.init();
  for (const sig of ['SIGTERM', 'SIGINT'] as const) {
    process.on(sig, async () => { try { await db.close(); } finally { process.exit(0); } });
  }

  const server = http.createServer(app);

  // Setup WebSocket Server attached to HTTP server
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    let currentRoomId: string | null = null;
    let currentClient: ClientInfo | null = null;

    ws.on('message', (messageRaw: string) => {
      try {
        const msg = JSON.parse(messageRaw.toString());

        switch (msg.type) {
          case 'join': {
            const { roomId, role, name, color } = msg;
            currentRoomId = roomId;

            let room = rooms.get(roomId);
            if (!room) {
              room = {
                roomId,
                teacherWs: role === 'teacher' ? ws : null,
                allowStudentDraw: false,
                elements: [],
                clients: new Set(),
              };
              rooms.set(roomId, room);
            }

            if (role === 'teacher') {
              room.teacherWs = ws;
            }

            const clientId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            currentClient = {
              id: clientId,
              name: name || (role === 'teacher' ? 'المعلم' : 'طالب'),
              role: role || 'student',
              color: color || '#2563eb',
              ws,
            };

            room.clients.add(currentClient);

            // Send initial state back to the newly joined client
            ws.send(
              JSON.stringify({
                type: 'joined',
                clientId,
                roomId,
                role: currentClient.role,
                allowStudentDraw: room.allowStudentDraw,
                background: room.background || 'plain',
                elements: room.elements,
                participants: Array.from(room.clients).map((c) => ({
                  id: c.id,
                  name: c.name,
                  role: c.role,
                  color: c.color,
                })),
              })
            );

            // Broadcast updated participant list to everyone in room
            broadcastToRoom(roomId, {
              type: 'participants_update',
              participants: Array.from(room.clients).map((c) => ({
                id: c.id,
                name: c.name,
                role: c.role,
                color: c.color,
              })),
            });
            break;
          }

          case 'element_add': {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            // Student draw permission check
            if (currentClient?.role === 'student' && !room.allowStudentDraw) {
              return;
            }

            if (msg.element) {
              room.elements.push(msg.element);
              // Broadcast to all other peers in room
              broadcastToRoom(currentRoomId, {
                type: 'element_added',
                element: msg.element,
              }, ws);
            }
            break;
          }

          case 'elements_batch': {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            if (currentClient?.role === 'teacher' && Array.isArray(msg.elements)) {
              room.elements = msg.elements;
              broadcastToRoom(currentRoomId, {
                type: 'sync_all_elements',
                elements: room.elements,
              }, ws);
            }
            break;
          }

          case 'element_update': {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;
            if (currentClient?.role === 'student' && !room.allowStudentDraw) return;

            if (msg.id && msg.updated) {
              const currentEl = room.elements.find((el) => el.id === msg.id);
              if (currentEl?.isLocked && msg.updated.isLocked === undefined) {
                return;
              }
              room.elements = room.elements.map((el) =>
                el.id === msg.id ? { ...el, ...msg.updated } : el
              );
              broadcastToRoom(
                currentRoomId,
                {
                  type: 'element_updated',
                  id: msg.id,
                  updated: msg.updated,
                },
                ws
              );
            }
            break;
          }

          case 'element_delete': {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;
            if (currentClient?.role === 'student' && !room.allowStudentDraw) return;

            if (msg.id) {
              const currentEl = room.elements.find((el) => el.id === msg.id);
              if (currentEl?.isLocked) {
                return;
              }
              room.elements = room.elements.filter((el) => el.id !== msg.id);
              broadcastToRoom(
                currentRoomId,
                {
                  type: 'element_deleted',
                  id: msg.id,
                },
                ws
              );
            }
            break;
          }

          case 'background_change': {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (!room || currentClient?.role !== 'teacher') return;

            room.background = msg.background;
            broadcastToRoom(
              currentRoomId,
              {
                type: 'background_changed',
                background: msg.background,
              },
              ws
            );
            break;
          }

          case 'clear_board':
          case 'CLEAR_ALL': {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            // Only teacher can clear board
            if (currentClient?.role === 'teacher') {
              room.elements = [];
              broadcastToRoom(currentRoomId, {
                type: 'board_cleared',
              });
            }
            break;
          }

          case 'toggle_student_draw': {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (!room || currentClient?.role !== 'teacher') return;

            room.allowStudentDraw = Boolean(msg.allow);
            broadcastToRoom(currentRoomId, {
              type: 'student_draw_toggled',
              allow: room.allowStudentDraw,
            });
            break;
          }

          case 'reveal_stage': {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (!room || currentClient?.role !== 'teacher') return;

            broadcastToRoom(currentRoomId, {
              type: 'reveal_stage',
              stageId: msg.stageId,
              stageTitle: msg.stageTitle,
              stages: msg.stages,
            });
            break;
          }

          case 'reveal_path_sync': {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (!room || currentClient?.role !== 'teacher') return;

            broadcastToRoom(currentRoomId, {
              type: 'reveal_path_sync',
              revealPath: msg.revealPath,
            });
            break;
          }

          case 'cursor_move': {
            if (!currentRoomId) return;
            broadcastToRoom(currentRoomId, {
              type: 'cursor_moved',
              cursor: {
                id: currentClient?.id,
                name: currentClient?.name,
                role: currentClient?.role,
                color: currentClient?.color,
                x: msg.x,
                y: msg.y,
              },
            }, ws);
            break;
          }

          case 'end_session': {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (!room || currentClient?.role !== 'teacher') return;

            broadcastToRoom(currentRoomId, {
              type: 'session_ended',
            });
            rooms.delete(currentRoomId);
            break;
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomId && currentClient) {
        const room = rooms.get(currentRoomId);
        if (room) {
          room.clients.delete(currentClient);
          if (room.clients.size === 0) {
            rooms.delete(currentRoomId);
          } else {
            broadcastToRoom(currentRoomId, {
              type: 'participants_update',
              participants: Array.from(room.clients).map((c) => ({
                id: c.id,
                name: c.name,
                role: c.role,
                color: c.color,
              })),
            });
          }
        }
      }
    });
  });

  function broadcastToRoom(roomId: string, data: any, exceptWs?: WebSocket) {
    const room = rooms.get(roomId);
    if (!room) return;
    const json = JSON.stringify(data);
    room.clients.forEach((client) => {
      if (client.ws !== exceptWs && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(json);
      }
    });
  }

  // Vite middleware in dev or static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`سبورة المستنير Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
