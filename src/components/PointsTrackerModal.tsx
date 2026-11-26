import React, { useState, useEffect } from 'react';
import { PointItem, ClassCircle } from '../types';
import { api } from '../utils/api';
import {
  X,
  Trophy,
  Award,
  Plus,
  Trash2,
  Users,
  Sparkles,
  Star,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { playApplause, playSuccessDing, playVictoryChime } from '../utils/soundEffects';

interface PointsTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  circles: ClassCircle[];
  activeCircleId?: string | null;
}

export const PointsTrackerModal: React.FC<PointsTrackerModalProps> = ({
  isOpen,
  onClose,
  circles,
  activeCircleId,
}) => {
  const [points, setPoints] = useState<PointItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCircleFilter, setSelectedCircleFilter] = useState<string>(activeCircleId || 'all');

  // Quick Award Form
  const [studentName, setStudentName] = useState('');
  const [pointReason, setPointReason] = useState('تسميع متقن ومتميز 🌟');
  const [pointsAmount, setPointsAmount] = useState<number>(10);
  const [circleIdForAward, setCircleIdForAward] = useState<string>(activeCircleId || '');

  const loadPoints = async () => {
    try {
      setLoading(true);
      const data = await api.points.list();
      setPoints(data);
    } catch (err) {
      console.error('Error loading points:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPoints();
      if (activeCircleId) {
        setSelectedCircleFilter(activeCircleId);
        setCircleIdForAward(activeCircleId);
      }
    }
  }, [isOpen, activeCircleId]);

  if (!isOpen) return null;

  // Aggregate points per student
  const studentScores: { [studentName: string]: { total: number; count: number; circleId?: string } } = {};

  // Also include students from selected circle even if they have 0 points
  const activeCircle = circles.find((c) => c.id === selectedCircleFilter);
  if (activeCircle && activeCircle.studentNames) {
    activeCircle.studentNames.forEach((s) => {
      studentScores[s] = { total: 0, count: 0, circleId: activeCircle.id };
    });
  }

  points.forEach((p) => {
    if (selectedCircleFilter !== 'all' && p.circleId && p.circleId !== selectedCircleFilter) {
      return;
    }
    const name = p.entityName;
    if (!studentScores[name]) {
      studentScores[name] = { total: 0, count: 0, circleId: p.circleId };
    }
    studentScores[name].total += p.score || 0;
    studentScores[name].count += 1;
  });

  const sortedLeaderboard = Object.entries(studentScores)
    .map(([name, data]) => ({
      name,
      total: data.total,
      count: data.count,
    }))
    .sort((a, b) => b.total - a.total);

  const handleAwardPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;

    try {
      const created = await api.points.award({
        entityName: studentName.trim(),
        pointsDelta: pointsAmount,
        reason: pointReason.trim() || 'إنجاز تعليمي',
        circleId: circleIdForAward || undefined,
      });

      setPoints((prev) => [created, ...prev]);
      setStudentName('');
      playSuccessDing();
      if (pointsAmount >= 20) {
        setTimeout(() => playApplause(), 300);
      }
    } catch (err) {
      console.error('Error awarding points:', err);
    }
  };

  const handleQuickAdd = async (name: string, amt: number) => {
    try {
      const created = await api.points.award({
        entityName: name,
        pointsDelta: amt,
        reason: 'تشجيع تفاعلي فوري ⭐',
        circleId: circleIdForAward || undefined,
      });
      setPoints((prev) => [created, ...prev]);
      playSuccessDing();
    } catch (err) {
      console.error('Error in quick add:', err);
    }
  };

  const handleDeletePointRecord = async (id: string) => {
    try {
      await api.points.delete(id);
      setPoints((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Error deleting point:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-amber-500/30 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 to-yellow-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-amber-600/80 border border-amber-300/40 flex items-center justify-center shadow-inner">
              <Trophy className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>نظام النقاط ولوحة شرف المتفوقين</span>
              </h2>
              <p className="text-xs text-amber-100/90">
                متابعة نقاط الطلاب والفرق وتشجيعهم على التميز والتنافس الشريف
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

        {/* Quick Award Form */}
        <form onSubmit={handleAwardPoints} className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800/60">
          <div className="text-xs font-bold text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-600" />
            <span>منح نقاط لطالب أو فريق:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            {/* Student Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                اسم الطالب:
              </label>
              {activeCircle && activeCircle.studentsList.length > 0 ? (
                <div className="relative">
                  <input
                    type="text"
                    required
                    list="circle_students_list"
                    placeholder="اختر أو اكتب..."
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                  <datalist id="circle_students_list">
                    {activeCircle.studentsList.map((s, idx) => (
                      <option key={idx} value={s} />
                    ))}
                  </datalist>
                </div>
              ) : (
                <input
                  type="text"
                  required
                  placeholder="اسم الطالب أو الفريق..."
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                />
              )}
            </div>

            {/* Points Amount */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                النقاط:
              </label>
              <select
                value={pointsAmount}
                onChange={(e) => setPointsAmount(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-amber-600"
              >
                <option value={5}>+5 نقاط (مشاركة جيدة)</option>
                <option value={10}>+10 نقاط (تسميع ممتاز)</option>
                <option value={15}>+15 نقطة (إتقان تام وتجويد)</option>
                <option value={20}>+20 نقطة (فوز بتحدي أو مسابقة)</option>
                <option value={50}>+50 نقطة (وسام النجم الذهبي)</option>
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                سبب المنح:
              </label>
              <input
                type="text"
                placeholder="تسميع ممتاز، انضباط..."
                value={pointReason}
                onChange={(e) => setPointReason(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Submit */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة النقاط</span>
              </button>
            </div>
          </div>
        </form>

        {/* Filter Bar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">عرض حلقة:</span>
            <select
              value={selectedCircleFilter}
              onChange={(e) => setSelectedCircleFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="all">جميع الحلقات والطلاب</option>
              {circles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            إجمالي السجلات: {points.length}
          </span>
        </div>

        {/* Leaderboard Table & Quick Actions */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="text-center py-10 text-xs text-slate-500">جاري تحميل لوحة الشرف...</div>
          ) : sortedLeaderboard.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Trophy className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                لا توجد نقاط مسجلة حتى الآن
              </p>
              <p className="text-xs text-slate-500 mt-1">
                امنح أول نقاط تشجيعية لطلابك عبر النموذج أعلاه
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedLeaderboard.map((item, idx) => {
                const isTop1 = idx === 0 && item.total > 0;
                const isTop2 = idx === 1 && item.total > 0;
                const isTop3 = idx === 2 && item.total > 0;

                return (
                  <div
                    key={item.name}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                      isTop1
                        ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-400 shadow-xs'
                        : isTop2
                        ? 'bg-slate-50/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700'
                        : isTop3
                        ? 'bg-orange-50/60 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800'
                        : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank Badge */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          isTop1
                            ? 'bg-amber-500 text-white shadow-xs'
                            : isTop2
                            ? 'bg-slate-400 text-white'
                            : isTop3
                            ? 'bg-orange-400 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {isTop1 && <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          عدد المشاركات التفاعلية: {item.count}
                        </div>
                      </div>
                    </div>

                    {/* Points & Quick Increment Buttons */}
                    <div className="flex items-center gap-2">
                      <div className="text-right px-2">
                        <span className="text-base font-black text-amber-600 dark:text-amber-400">
                          {item.total}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 mr-1">نقطة</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(item.name, 5)}
                          className="px-2 py-1 bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 text-amber-800 dark:text-amber-200 rounded-lg text-xs font-bold transition-colors"
                          title="إضافة 5 نقاط فوراً"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(item.name, 10)}
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                          title="إضافة 10 نقاط فوراً"
                        >
                          +10
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
          <span>النقاط مرتبطة ومحفوظة لكل حلقة وطالب في السيرفر</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-300 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
