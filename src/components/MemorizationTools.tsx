import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, RotateCcw, Plus, Minus, X, Bell, Target, Sparkles } from 'lucide-react';

interface MemorizationToolsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemorizationTools: React.FC<MemorizationToolsProps> = ({ isOpen, onClose }) => {
  // Clock state
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Tasbih / Repetition Counter state
  const [tasbihCount, setTasbihCount] = useState<number>(0);
  const [targetRepetitions, setTargetRepetitions] = useState<number>(7);
  const [customTargetInput, setCustomTargetInput] = useState<string>('7');
  const [completionCelebration, setCompletionCelebration] = useState(false);

  // Timer & Stopwatch state
  const [mode, setMode] = useState<'timer' | 'stopwatch'>('timer');
  const [timerSeconds, setTimerSeconds] = useState<number>(60);
  const [initialDuration, setInitialDuration] = useState<number>(60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timerFinished, setTimerFinished] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (mode === 'timer') {
          setTimerSeconds((prev) => {
            if (prev <= 1) {
              setIsRunning(false);
              setTimerFinished(true);
              return 0;
            }
            return prev - 1;
          });
        } else {
          setTimerSeconds((prev) => prev + 1);
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  const handleIncrementTasbih = () => {
    const next = tasbihCount + 1;
    setTasbihCount(next);
    if (targetRepetitions > 0 && next % targetRepetitions === 0) {
      setCompletionCelebration(true);
      setTimeout(() => setCompletionCelebration(false), 2500);
    }
  };

  const handleResetTasbih = () => {
    setTasbihCount(0);
    setCompletionCelebration(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const progressPercent = targetRepetitions > 0 ? Math.min(100, Math.round(((tasbihCount % targetRepetitions) / targetRepetitions) * 100)) : 0;
  const completedRounds = targetRepetitions > 0 ? Math.floor(tasbihCount / targetRepetitions) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-emerald-500/40 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-emerald-800 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-base">أدوات التحفيظ والتكرار</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Clock Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200/60 dark:border-emerald-800 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-emerald-900 dark:text-emerald-200 font-semibold">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>الوقت الحالي:</span>
          </div>
          <span className="font-mono text-sm font-bold text-emerald-800 dark:text-emerald-300" dir="ltr">
            {currentTime}
          </span>
        </div>

        <div className="p-4 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Section 1: Repetition & Tasbih Counter */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-600" />
                عداد التكرار وحفظ الآيات
              </span>
              <div className="flex items-center gap-1">
                {[3, 7, 10, 33].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setTargetRepetitions(num);
                      setCustomTargetInput(num.toString());
                    }}
                    className={`text-[11px] px-2 py-0.5 rounded font-mono font-bold transition-colors ${
                      targetRepetitions === num
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Big Tap Area */}
            <div className="flex flex-col items-center justify-center my-2">
              <button
                type="button"
                onClick={handleIncrementTasbih}
                className={`w-36 h-36 rounded-full border-4 shadow-lg flex flex-col items-center justify-center select-none active:scale-95 transition-all duration-150 cursor-pointer ${
                  completionCelebration
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 scale-105 animate-bounce'
                    : 'border-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 hover:border-emerald-400'
                }`}
              >
                <span className="text-4xl font-extrabold font-mono">{tasbihCount}</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                  اضغط للتكرار (+1)
                </span>
              </button>

              {/* Progress towards target */}
              {targetRepetitions > 0 && (
                <div className="w-full mt-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>
                      الهدف: <strong className="text-emerald-700 font-mono">{targetRepetitions}</strong> تكرارات
                    </span>
                    <span>
                      الدورات المكتملة: <strong className="text-emerald-700 font-mono">{completedRounds}</strong>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-200"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handleResetTasbih}
                className="px-3 py-1 text-xs rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تصفير العداد</span>
              </button>
              <button
                type="button"
                onClick={() => setTasbihCount((p) => Math.max(0, p - 1))}
                className="px-3 py-1 text-xs rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 active:scale-95"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>طرح (-1)</span>
              </button>
            </div>
          </div>

          {/* Section 2: Recitation Timer & Stopwatch */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                توقيت التسميع والشرح
              </span>
              <div className="flex items-center rounded-lg bg-slate-200 dark:bg-slate-700 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsRunning(false);
                    setMode('timer');
                    setTimerSeconds(initialDuration);
                    setTimerFinished(false);
                  }}
                  className={`px-2 py-0.5 rounded font-medium ${
                    mode === 'timer' ? 'bg-white dark:bg-slate-900 shadow-xs font-bold text-emerald-800 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  مؤقت تنازلي
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRunning(false);
                    setMode('stopwatch');
                    setTimerSeconds(0);
                    setTimerFinished(false);
                  }}
                  className={`px-2 py-0.5 rounded font-medium ${
                    mode === 'stopwatch' ? 'bg-white dark:bg-slate-900 shadow-xs font-bold text-emerald-800 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  ساعة إيقاف
                </button>
              </div>
            </div>

            {/* Timer Display */}
            <div className="flex flex-col items-center justify-center my-3">
              <div
                className={`text-4xl font-extrabold font-mono tracking-wider py-2 px-6 rounded-xl border ${
                  timerFinished
                    ? 'bg-red-50 text-red-600 border-red-300 animate-pulse'
                    : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700'
                }`}
                dir="ltr"
              >
                {formatTime(timerSeconds)}
              </div>
              {timerFinished && (
                <div className="mt-1 text-xs text-red-600 font-bold flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 animate-spin" />
                  <span>انتهى الوقت المحدد للتسميع!</span>
                </div>
              )}
            </div>

            {/* Quick Timer Presets (if mode === timer) */}
            {mode === 'timer' && !isRunning && (
              <div className="flex items-center justify-center gap-1.5 mb-3">
                {[30, 60, 120, 300].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      setInitialDuration(sec);
                      setTimerSeconds(sec);
                      setTimerFinished(false);
                    }}
                    className={`text-xs px-2.5 py-1 rounded font-mono font-medium ${
                      initialDuration === sec
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {sec >= 60 ? `${sec / 60} دقيقة` : `${sec} ثانية`}
                  </button>
                ))}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTimerFinished(false);
                  setIsRunning(!isRunning);
                }}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 text-white shadow-xs active:scale-95 transition-all ${
                  isRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>إيقاف مؤقت</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>تشغيل</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsRunning(false);
                  setTimerSeconds(mode === 'timer' ? initialDuration : 0);
                  setTimerFinished(false);
                }}
                className="px-3 py-1.5 text-xs rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
