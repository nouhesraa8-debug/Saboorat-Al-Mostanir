import React, { useState } from 'react';
import { UserAccount } from '../types';
import { api } from '../utils/api';
import { OfficialLogo } from './OfficialLogo';

interface AuthGateProps {
  onAuthenticated: (user: UserAccount) => void;
  /** إغلاق النافذة (عند فتحها من داخل المنصة). غير متاح في أول شاشة. */
  onClose?: () => void;
}

type Mode = 'choose' | 'login' | 'register';

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated, onClose }) => {
  const [mode, setMode] = useState<Mode>('choose');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (fn: () => Promise<{ user: UserAccount }>) => {
    setBusy(true);
    setError('');
    try {
      const res = await fn();
      onAuthenticated(res.user);
    } catch (e: any) {
      setError(
        e?.message === 'Failed to fetch'
          ? 'تعذر الاتصال بالخادم. تحققي من الإنترنت أو ادخلي كضيف.'
          : e?.message || 'حدث خطأ غير متوقع'
      );
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      run(() => api.auth.login(email.trim(), password));
    } else if (mode === 'register') {
      if (password.length < 6) return setError('كلمة المرور يجب ألا تقل عن 6 أحرف');
      run(() => api.auth.register(name.trim(), email.trim(), password, role));
    }
  };

  // الضيف: يعمل حتى لو الخادم غير متاح، ولا يتطلب أي بيانات.
  const enterAsGuest = () =>
    run(async () => {
      try {
        return await api.auth.guest();
      } catch {
        return { user: { id: `guest_local_${Date.now()}`, name: 'ضيف المستنير', email: '', role: 'guest' as const } };
      }
    });

  const input =
    'w-full rounded-xl border border-emerald-900/20 bg-white px-4 py-3 text-right text-emerald-950 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20';

  return (
    <div dir="rtl" className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-emerald-950/90 p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#fbfaf5] p-6 shadow-2xl">
        <div className="mb-5 flex flex-col items-center gap-2 text-center">
          <OfficialLogo />
          <h1 className="text-2xl font-bold text-emerald-900">سبورة المستنير</h1>
          <p className="text-sm text-emerald-800/70">إعداد وتطوير إسراء عبد الستار</p>
        </div>

        {mode === 'choose' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={enterAsGuest}
              disabled={busy}
              className="rounded-xl bg-emerald-800 px-4 py-3 font-bold text-white transition hover:bg-emerald-900 disabled:opacity-60"
            >
              {busy ? 'جارٍ الدخول…' : 'الدخول كضيف'}
            </button>
            <p className="-mt-1 text-center text-xs text-emerald-800/60">
              بدون حساب. جميع أدوات السبورة متاحة، لكن الحفظ الدائم والبنك والفصول تتطلب حسابًا.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setError(''); setMode('login'); }}
                className="flex-1 rounded-xl border border-emerald-800 px-4 py-3 font-bold text-emerald-900 hover:bg-emerald-50"
              >
                تسجيل الدخول
              </button>
              <button
                onClick={() => { setError(''); setMode('register'); }}
                className="flex-1 rounded-xl border border-amber-500 px-4 py-3 font-bold text-amber-700 hover:bg-amber-50"
              >
                إنشاء حساب
              </button>
            </div>
          </div>
        )}

        {mode !== 'choose' && (
          <form onSubmit={submit} className="flex flex-col gap-3">
            {mode === 'register' && (
              <>
                <input className={input} placeholder="الاسم" value={name} onChange={(e) => setName(e.target.value)} required />
                <div className="flex gap-2 text-sm">
                  {(['teacher', 'student'] as const).map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRole(r)}
                      className={`flex-1 rounded-xl border px-3 py-2 font-bold ${
                        role === r ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-emerald-900/20 text-emerald-900'
                      }`}
                    >
                      {r === 'teacher' ? 'معلمة' : 'طالبة'}
                    </button>
                  ))}
                </div>
              </>
            )}
            <input className={input} type="email" dir="ltr" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className={input} type="password" dir="ltr" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-emerald-800 px-4 py-3 font-bold text-white hover:bg-emerald-900 disabled:opacity-60"
            >
              {busy ? 'لحظة…' : mode === 'login' ? 'دخول' : 'إنشاء الحساب'}
            </button>
            <button type="button" onClick={() => { setError(''); setMode('choose'); }} className="text-sm text-emerald-800 underline">
              رجوع
            </button>
          </form>
        )}

        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-2 text-center text-sm text-red-700">{error}</p>}

        {onClose && (
          <button onClick={onClose} className="mt-4 w-full text-center text-sm text-emerald-800/70 underline">
            إغلاق
          </button>
        )}
      </div>
    </div>
  );
};
