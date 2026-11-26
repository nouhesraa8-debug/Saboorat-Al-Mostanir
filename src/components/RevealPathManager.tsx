import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  Layers,
  Lock,
  Unlock,
  FastForward,
  Edit2,
  X,
} from 'lucide-react';
import { LessonStage, RevealPathState } from '../types';
import { playStageRevealCue } from '../utils/soundEffects';

interface RevealPathManagerProps {
  revealPath: RevealPathState;
  onUpdateRevealPath: (updated: RevealPathState) => void;
  onRevealStage: (stageId: string, stageTitle: string) => void;
  isTeacher: boolean;
  activeStageId: string | null;
  onSelectActiveStage: (stageId: string | null) => void;
  selectedElementStageId?: string;
  onAssignSelectedElementToStage?: (stageId: string | undefined) => void;
}

export const RevealPathManager: React.FC<RevealPathManagerProps> = ({
  revealPath,
  onUpdateRevealPath,
  onRevealStage,
  isTeacher,
  activeStageId,
  onSelectActiveStage,
  selectedElementStageId,
  onAssignSelectedElementToStage,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [newStageTitle, setNewStageTitle] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Compute next hidden stage
  const nextHiddenStage = revealPath.stages.find((s) => !s.isRevealed);
  const revealedCount = revealPath.stages.filter((s) => s.isRevealed).length;
  const totalStages = revealPath.stages.length;

  const handleRevealNext = () => {
    if (!nextHiddenStage) return;
    const updatedStages = revealPath.stages.map((stage) =>
      stage.id === nextHiddenStage.id
        ? { ...stage, isRevealed: true, revealedAt: Date.now() }
        : stage
    );
    onUpdateRevealPath({
      ...revealPath,
      stages: updatedStages,
      activeStageId: nextHiddenStage.id,
    });
    playStageRevealCue();
    onRevealStage(nextHiddenStage.id, nextHiddenStage.title);
  };

  const handleToggleStageReveal = (stageId: string) => {
    const stage = revealPath.stages.find((s) => s.id === stageId);
    if (!stage) return;
    const willReveal = !stage.isRevealed;

    const updatedStages = revealPath.stages.map((s) =>
      s.id === stageId
        ? { ...s, isRevealed: willReveal, revealedAt: willReveal ? Date.now() : undefined }
        : s
    );
    onUpdateRevealPath({
      ...revealPath,
      stages: updatedStages,
    });

    if (willReveal) {
      playStageRevealCue();
      onRevealStage(stageId, stage.title);
    }
  };

  const handleAddStage = () => {
    if (!newStageTitle.trim()) return;
    const newStage: LessonStage = {
      id: `stage_${Date.now()}`,
      order: revealPath.stages.length + 1,
      title: newStageTitle.trim(),
      isRevealed: false,
    };
    onUpdateRevealPath({
      ...revealPath,
      stages: [...revealPath.stages, newStage],
    });
    setNewStageTitle('');
    setShowAddModal(false);
  };

  const handleDeleteStage = (stageId: string) => {
    if (revealPath.stages.length <= 1) return;
    const updated = revealPath.stages.filter((s) => s.id !== stageId);
    onUpdateRevealPath({
      ...revealPath,
      stages: updated,
      activeStageId: activeStageId === stageId ? (updated[0]?.id || null) : activeStageId,
    });
  };

  // Student View: sleek progress bar at top-left
  if (!isTeacher) {
    return (
      <aside
        id="student-reveal-path-status"
        aria-label="مراحل المسار التعليمي للطلاب"
        className="fixed top-3 left-4 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-emerald-300 dark:border-emerald-700/80 rounded-2xl shadow-lg px-3 py-2 flex items-center gap-3 animate-in fade-in duration-200"
        dir="rtl"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>المسار السري للحلقة</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                {revealedCount} / {totalStages}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {nextHiddenStage
                ? `المرحلة الحالية: ${revealPath.stages.filter((s) => s.isRevealed).slice(-1)[0]?.title || 'في انتظار الكشف...'}`
                : 'اكتملت جميع مراحل المسار 🎉'}
            </p>
          </div>
        </div>
      </aside>
    );
  }

  // Teacher View: Floating collapsible control center at top-left
  return (
    <aside
      id="teacher-reveal-path-panel"
      aria-label="لوحة تحكم المسار السري للمعلمة"
      className="fixed top-14 left-4 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-emerald-400/80 dark:border-emerald-700 rounded-2xl shadow-xl w-72 sm:w-80 overflow-hidden transition-all duration-200"
      dir="rtl"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <h3 className="font-bold text-xs sm:text-sm">المسار السري للحلقة (Reveal Path)</h3>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
            {revealedCount} / {totalStages} مكشوف
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg hover:bg-white/15 text-white transition-colors"
            title={isExpanded ? 'تصغير اللوحة' : 'توسيع اللوحة'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 flex flex-col gap-2.5">
          {/* Quick Reveal Next Action Banner */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRevealNext}
              disabled={!nextHiddenStage}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 active:scale-98"
              title="كشف المرحلة التالية فورًا لجميع الطلاب ومزامنتها على شاشاتهم"
            >
              <FastForward className="w-4 h-4" />
              <span>
                {nextHiddenStage ? `اكشف التالي: ${nextHiddenStage.title}` : 'تم كشف جميع المراحل!'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 transition-colors"
              title="إضافة مرحلة سرية جديدة"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Active drawing target indicator */}
          <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>المرحلة النشطة للرسم:</span>
            </div>
            <select
              value={activeStageId || ''}
              onChange={(e) => onSelectActiveStage(e.target.value || null)}
              className="bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-800 dark:text-slate-100"
            >
              <option value="">بدون مرحلة (مرئي دائمًا)</option>
              {revealPath.stages.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.title} {st.isRevealed ? '✓ (مكشوف)' : '🔒 (مخفي)'}
                </option>
              ))}
            </select>
          </div>

          {/* Assign Selected Element directly if any */}
          {selectedElementStageId !== undefined && onAssignSelectedElementToStage && (
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-center justify-between">
              <span className="font-semibold">ربط العنصر المحدد بمرحلة:</span>
              <select
                value={selectedElementStageId || ''}
                onChange={(e) => onAssignSelectedElementToStage(e.target.value || undefined)}
                className="bg-white dark:bg-slate-800 border border-amber-300 rounded-lg px-2 py-0.5 text-xs font-bold"
              >
                <option value="">عام (مرئي دائمًا)</option>
                {revealPath.stages.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Stages List */}
          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-0.5">
            {revealPath.stages.map((stage, idx) => {
              const isActive = activeStageId === stage.id;
              return (
                <div
                  key={stage.id}
                  className={`p-2 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    stage.isRevealed
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                  } ${isActive ? 'ring-1.5 ring-emerald-500' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <span className="font-bold truncate block">{stage.title}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {stage.isRevealed ? 'مكشوف للطلاب' : 'مخفي عن الطلاب'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStageReveal(stage.id)}
                      className={`px-2 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-colors ${
                        stage.isRevealed
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-500 hover:text-white'
                      }`}
                      title={stage.isRevealed ? 'إخفاء هذه المرحلة عن الطلاب' : 'كشف هذه المرحلة للطلاب الآن'}
                    >
                      {stage.isRevealed ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{stage.isRevealed ? 'مكشوف' : 'اكشف'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteStage(stage.id)}
                      disabled={revealPath.stages.length <= 1}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-20 transition-colors"
                      title="حذف هذه المرحلة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add New Stage Modal Dialog */}
      {showAddModal && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              إضافة مرحلة تعليمية سرية جديدة:
            </span>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="p-0.5 rounded text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            type="text"
            value={newStageTitle}
            onChange={(e) => setNewStageTitle(e.target.value)}
            placeholder="مثال: التحدي الإضافي / مسألة الفهم..."
            className="w-full text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddStage();
            }}
            autoFocus
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-2.5 py-1 rounded-lg text-xs text-slate-600 hover:bg-slate-200"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleAddStage}
              disabled={!newStageTitle.trim()}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
            >
              إضافة المرحلة
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
