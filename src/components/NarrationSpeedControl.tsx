import React, { useState, useRef, useEffect } from 'react';
import { Gauge, Play, Pause, RotateCcw, Volume2, VolumeX, EyeOff } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled } from '../utils/soundEffects';

interface NarrationSpeedControlProps {
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
  isFocusMode?: boolean;
  onExitFocusMode?: () => void;
}

export const SPEED_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const NarrationSpeedControl: React.FC<NarrationSpeedControlProps> = ({
  currentSpeed,
  onSpeedChange,
  isFocusMode = false,
  onExitFocusMode,
}) => {
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [soundActive, setSoundActive] = useState(isSoundEnabled());
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sample natural Quran recitation clip (Al-Fatiha Ayah 1 by Mishary Alafasy)
  const sampleAudioUrl = 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3';

  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio(sampleAudioUrl);
      audio.preload = 'metadata';
      audio.preservesPitch = true;
      (audio as any).webkitPreservesPitch = true;
      (audio as any).mozPreservesPitch = true;

      audio.onended = () => {
        setIsPlayingTest(false);
      };

      audioRef.current = audio;
    }

    if (audioRef.current) {
      audioRef.current.playbackRate = currentSpeed;
      audioRef.current.preservesPitch = true;
      (audioRef.current as any).webkitPreservesPitch = true;
      (audioRef.current as any).mozPreservesPitch = true;
    }
  }, [currentSpeed]);

  const toggleTestPlay = () => {
    if (!audioRef.current) return;
    if (isPlayingTest) {
      audioRef.current.pause();
      setIsPlayingTest(false);
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = currentSpeed;
      audioRef.current.preservesPitch = true;
      audioRef.current
        .play()
        .then(() => setIsPlayingTest(true))
        .catch(() => {
          setIsPlayingTest(false);
        });
    }
  };

  const handleToggleSound = () => {
    const nextState = !soundActive;
    setSoundActive(nextState);
    setSoundEnabled(nextState);
  };

  // Focus Mode minimalist layout: Drawing area + Narration speed + Identity footer
  if (isFocusMode) {
    return (
      <aside
        id="focus-mode-reading-control"
        aria-label="لوحة سرعة القراءة في وضع التركيز"
        className="fixed top-4 right-4 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-emerald-400/80 dark:border-emerald-600/80 rounded-2xl shadow-xl px-3.5 py-2 flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-200"
        dir="rtl"
      >
        <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
          <Gauge className="w-4 h-4 text-emerald-600" />
          <span>سرعة القراءة:</span>
        </div>

        <div className="flex items-center gap-1">
          {SPEED_PRESETS.map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => onSpeedChange(speed)}
              className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-all ${
                currentSpeed === speed
                  ? 'bg-emerald-600 text-white shadow-xs scale-105'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
              title={`تعيين السرعة على ${speed}x مع الحفاظ على نبرة صوت طبيعية (Pitch)`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Audio test preview button */}
        <button
          type="button"
          onClick={toggleTestPlay}
          className={`p-1.5 rounded-xl border flex items-center gap-1 text-xs font-bold transition-all ${
            isPlayingTest
              ? 'bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-950 dark:text-amber-200 animate-pulse'
              : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
          }`}
          title={isPlayingTest ? 'إيقاف الاستماع التجريبي' : 'استماع تجريبي بنبرة طبيعية'}
        >
          {isPlayingTest ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span className="text-[11px] hidden sm:inline">تجربة</span>
        </button>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700" />

        {/* Exit Focus Mode button */}
        {onExitFocusMode && (
          <button
            type="button"
            onClick={onExitFocusMode}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
            title="الخروج من وضع التركيز وإظهار الأشرطة والقوائم"
          >
            <EyeOff className="w-3.5 h-3.5 text-amber-400" />
            <span>خروج من التركيز</span>
          </button>
        )}
      </aside>
    );
  }

  // Standard inline / toolbar control
  return (
    <div className="relative inline-flex items-center" dir="rtl">
      <button
        type="button"
        onClick={() => setShowSpeedMenu(!showSpeedMenu)}
        className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
        title="التحكم في سرعة القراءة والترتيل مع الحفاظ على نبرة طبيعية (Pitch Preservation)"
      >
        <Gauge className="w-3.5 h-3.5 text-emerald-600" />
        <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
          {currentSpeed}x
        </span>
      </button>

      {/* Speed & Sound Dropdown Popover */}
      {showSpeedMenu && (
        <div className="absolute bottom-12 right-0 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2.5">
            <div className="flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-100">
              <Gauge className="w-4 h-4 text-emerald-600" />
              <span>سرعة القراءة والترتيل</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
              Pitch طبيعي
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {SPEED_PRESETS.map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => {
                  onSpeedChange(speed);
                }}
                className={`py-1.5 px-2 rounded-xl text-xs font-mono font-bold border transition-all text-center ${
                  currentSpeed === speed
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Test Audio Recitation */}
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs mb-2">
            <span className="text-slate-600 dark:text-slate-300 font-medium">تجربة الترتيل بالسرعة:</span>
            <button
              type="button"
              onClick={toggleTestPlay}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors ${
                isPlayingTest
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isPlayingTest ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlayingTest ? 'إيقاف' : 'استماع'}</span>
            </button>
          </div>

          {/* Sound On / Off Toggle (Requirement 22) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              الأصوات والمؤثرات:
            </span>
            <button
              type="button"
              onClick={handleToggleSound}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                soundActive
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {soundActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundActive ? 'مفعلة' : 'مكتومة'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
