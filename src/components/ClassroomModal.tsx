import React, { useState } from 'react';
import { SessionState } from '../types';
import { Users, Copy, Check, ShieldCheck, ShieldAlert, LogOut, Radio, UserPlus, X } from 'lucide-react';

interface ClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionState;
  onStartTeacherSession: () => void;
  onJoinStudentSession: (roomId: string, studentName: string, color: string) => void;
  onToggleStudentDraw: (allow: boolean) => void;
  onEndSession: () => void;
}

const STUDENT_COLORS = [
  '#dc2626', // Red
  '#2563eb', // Blue
  '#16a34a', // Green
  '#d97706', // Amber
  '#9333ea', // Purple
  '#0891b2', // Cyan
  '#e11d48', // Rose
];

export const ClassroomModal: React.FC<ClassroomModalProps> = ({
  isOpen,
  onClose,
  session,
  onStartTeacherSession,
  onJoinStudentSession,
  onToggleStudentDraw,
  onEndSession,
}) => {
  const [tab, setTab] = useState<'manage' | 'join'>('manage');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [studentNameInput, setStudentNameInput] = useState('طالب المستنير');
  const [selectedColor, setSelectedColor] = useState(STUDENT_COLORS[1]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const currentUrl = window.location.origin + window.location.pathname;
  const studentLink = session.roomId
    ? `${currentUrl}?room=${session.roomId}&role=student`
    : '';

  const handleCopyLink = () => {
    if (studentLink) {
      navigator.clipboard.writeText(studentLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyCode = () => {
    if (session.roomId) {
      navigator.clipboard.writeText(session.roomId);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    onJoinStudentSession(joinCodeInput.trim().toUpperCase(), studentNameInput.trim() || 'طالب المستنير', selectedColor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-emerald-500/30 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-700 border border-emerald-400/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">الفصل التفاعلي للتعليم المباشر</h2>
              <p className="text-xs text-emerald-100">
                مشاركة السبورة الحية والتحكم في تفاعل الطلاب بالوقت الفعلي
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {session.active ? (
            /* Active Session Control Panel */
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
                    الجلسة التفاعلية نشطة الآن
                  </span>
                </div>
                <span className="text-xs bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full border border-emerald-300 font-mono font-bold text-emerald-800 dark:text-emerald-300">
                  {session.role === 'teacher' ? 'أنت المعلم' : `طالب: ${session.studentName}`}
                </span>
              </div>

              {/* Room Code & Link Box */}
              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">رمز الفصل:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-emerald-700 dark:text-emerald-300 tracking-wider">
                      {session.roomId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-2 py-0.5 text-xs rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-1 active:scale-95"
                    >
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>نسخ</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">رابط الطالب:</span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'تم نسخ الرابط' : 'نسخ رابط الطالب'}</span>
                  </button>
                </div>
              </div>

              {/* Teacher Permissions Control */}
              {session.role === 'teacher' && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {session.allowStudentDraw ? (
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <ShieldAlert className="w-5 h-5 text-amber-600" />
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          السماح للطلاب بالكتابة والرسم
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {session.allowStudentDraw
                            ? 'يمكن للطلاب الكتابة والمشاركة في حل التمارين'
                            : 'الطلاب في وضع المشاهدة فقط (القلم مقفل)'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleStudentDraw(!session.allowStudentDraw)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 ${
                        session.allowStudentDraw
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {session.allowStudentDraw ? 'إيقاف كتابة الطلاب' : 'السماح بالكتابة'}
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span>عدد الحاضرين المتصلين:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                      {session.participants.length} مشارك
                    </span>
                  </div>
                </div>
              )}

              {/* End Session Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('هل أنت متأكد من إنهاء جلسة الفصل التفاعلي؟')) {
                      onEndSession();
                      onClose();
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 active:scale-95 shadow-xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>إنهاء الجلسة التفاعلية</span>
                </button>
              </div>
            </div>
          ) : (
            /* No Active Session - Options to Start as Teacher or Join as Student */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTab('manage')}
                  className={`py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                    tab === 'manage'
                      ? 'bg-white dark:bg-slate-900 shadow-xs text-emerald-800 dark:text-emerald-300 font-extrabold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Radio className="w-4 h-4 text-emerald-600" />
                  <span>إنشاء فصل (معلم)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('join')}
                  className={`py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                    tab === 'join'
                      ? 'bg-white dark:bg-slate-900 shadow-xs text-emerald-800 dark:text-emerald-300 font-extrabold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  <span>انضمام لكود (طالب)</span>
                </button>
              </div>

              {tab === 'manage' ? (
                <div className="space-y-3.5 py-2 text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-400/30 flex items-center justify-center">
                    <Radio className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    ابدأ جلسة تفاعلية مباشرة مع طلابك
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    سيتم توليد كود جلسة خاص ورابط للطلاب فوراً. ستتمكن من مشاركة السبورة، ومشاهدة تفاعل الطلاب بالوقت الحقيقي، والتحكم في إذن الكتابة.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onStartTeacherSession();
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md active:scale-98 transition-all"
                  >
                    إنشاء وبدء الفصل التفاعلي الآن
                  </button>
                </div>
              ) : (
                /* Join Form */
                <form onSubmit={handleJoin} className="space-y-3.5 py-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      رمز الفصل / كود الجلسة:
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: MST-8492"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-center font-mono font-bold tracking-widest text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 uppercase focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      اسم الطالب:
                    </label>
                    <input
                      type="text"
                      placeholder="أدخل اسمك"
                      value={studentNameInput}
                      onChange={(e) => setStudentNameInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      اختر لون مؤشرك على السبورة:
                    </label>
                    <div className="flex items-center gap-2">
                      {STUDENT_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSelectedColor(c)}
                          className={`w-7 h-7 rounded-full transition-transform ${
                            selectedColor === c ? 'scale-125 ring-2 ring-emerald-500 ring-offset-2' : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md active:scale-98 transition-all"
                  >
                    دخول الفصل التفاعلي
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
