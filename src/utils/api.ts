import { UserAccount, QuestionItem, ClassCircle, PointItem, WheelItem, SavedBoard } from '../types';

const TOKEN_KEY = 'almustanir_auth_token';

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string | null) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
};

const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `HTTP Error ${response.status}`);
  }

  return data as T;
};

export const api = {
  // Authentication
  auth: {
    login: async (email: string, password: string): Promise<{ token: string; user: UserAccount }> => {
      const res = await request<{ token: string; user: UserAccount }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setAuthToken(res.token);
      return res;
    },
    register: async (name: string, email: string, password: string, role: 'teacher' | 'student' = 'teacher'): Promise<{ token: string; user: UserAccount }> => {
      const res = await request<{ token: string; user: UserAccount }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });
      setAuthToken(res.token);
      return res;
    },
    guest: async (): Promise<{ token: string; user: UserAccount }> => {
      const res = await request<{ token: string; user: UserAccount }>('/api/auth/guest', { method: 'POST' });
      setAuthToken(res.token);
      return res;
    },
    me: async (): Promise<{ user: UserAccount | null }> => {
      return request<{ user: UserAccount | null }>('/api/auth/me');
    },
    logout: async () => {
      try { await request('/api/auth/logout', { method: 'POST' }); } catch {}
      setAuthToken(null);
    },
  },

  // Boards
  boards: {
    list: async (): Promise<SavedBoard[]> => {
      return request<SavedBoard[]>('/api/boards');
    },
    save: async (board: SavedBoard): Promise<{ success: boolean; board: SavedBoard }> => {
      return request<{ success: boolean; board: SavedBoard }>('/api/boards', {
        method: 'POST',
        body: JSON.stringify(board),
      });
    },
    delete: async (id: string): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>(`/api/boards/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Classes and Circles
  classes: {
    list: async (): Promise<ClassCircle[]> => {
      const res = await request<{ classes: ClassCircle[] }>('/api/classes');
      return res.classes || [];
    },
    create: async (circle: { name: string; description?: string; studentNames: string[]; color?: string }): Promise<ClassCircle> => {
      const res = await request<{ circle: ClassCircle }>('/api/classes', {
        method: 'POST',
        body: JSON.stringify(circle),
      });
      return res.circle;
    },
    update: async (id: string, updates: Partial<ClassCircle>): Promise<ClassCircle> => {
      const res = await request<{ circle: ClassCircle }>(`/api/classes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return res.circle;
    },
    delete: async (id: string): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>(`/api/classes/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Question Bank
  questions: {
    list: async (_classId?: string): Promise<QuestionItem[]> => {
      const res = await request<{ questions: QuestionItem[] }>('/api/question-bank');
      return res.questions || [];
    },
    create: async (question: {
      type: QuestionItem['type'];
      questionText: string;
      surah?: string;
      options?: string[];
      correctAnswer: string;
      explanation?: string;
      points?: number;
      circleId?: string;
    }): Promise<QuestionItem> => {
      const res = await request<{ question: QuestionItem }>('/api/question-bank', {
        method: 'POST',
        body: JSON.stringify(question),
      });
      return res.question;
    },
    delete: async (id: string): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>(`/api/question-bank/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Points and Leaderboard
  points: {
    list: async (classId?: string): Promise<PointItem[]> => {
      const url = classId && classId !== 'all' ? `/api/points?circleId=${encodeURIComponent(classId)}` : '/api/points';
      const res = await request<{ points: PointItem[] }>(url);
      return res.points || [];
    },
    award: async (point: {
      entityName: string;
      type?: 'student' | 'team';
      pointsDelta: number;
      reason?: string;
      circleId?: string;
    }): Promise<PointItem> => {
      const res = await request<{ point: PointItem }>('/api/points', {
        method: 'POST',
        body: JSON.stringify(point),
      });
      return res.point;
    },
    delete: async (id: string): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>(`/api/points/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // High-level convenience methods
  getCircles: async (): Promise<{ circles: ClassCircle[] }> => {
    const res = await request<{ classes: ClassCircle[] }>('/api/classes');
    return { circles: res.classes || [] };
  },

  addPoints: async (data: {
    circleId?: string;
    studentName: string;
    points: number;
    reason?: string;
  }): Promise<PointItem> => {
    const res = await request<{ point: PointItem }>('/api/points', {
      method: 'POST',
      body: JSON.stringify({
        entityName: data.studentName,
        type: 'student',
        pointsDelta: data.points,
        reason: data.reason,
        circleId: data.circleId,
      }),
    });
    return res.point;
  },

  // Customized Wheels
  wheels: {
    list: async (classId?: string): Promise<WheelItem[]> => {
      const url = classId ? `/api/wheels?classId=${encodeURIComponent(classId)}` : '/api/wheels';
      return request<WheelItem[]>(url);
    },
    create: async (wheel: Omit<WheelItem, 'id' | 'createdAt' | 'teacherId'>): Promise<WheelItem> => {
      return request<WheelItem>('/api/wheels', {
        method: 'POST',
        body: JSON.stringify(wheel),
      });
    },
    delete: async (id: string): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>(`/api/wheels/${id}`, {
        method: 'DELETE',
      });
    },
  },
};
