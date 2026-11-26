import React, { useState, useEffect } from 'react';
import { QuestionItem, ClassCircle, WhiteboardElement } from '../types';
import { api } from '../utils/api';
import {
  X,
  HelpCircle,
  Plus,
  Trash2,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Filter,
  Layers,
  Send,
  Check,
} from 'lucide-react';
import { playSuccessDing } from '../utils/soundEffects';

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  circles: ClassCircle[];
  activeCircleId?: string | null;
  onStampQuestionToBoard: (question: QuestionItem) => void;
}

export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({
  isOpen,
  onClose,
  circles,
  activeCircleId,
  onStampQuestionToBoard,
}) => {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCircleFilter, setSelectedCircleFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [qType, setQType] = useState<'multiple_choice' | 'missing_word' | 'guess_surah' | 'tajweed_rule'>('multiple_choice');
  const [qText, setQText] = useState('');
  const [qSurah, setQSurah] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '']);
  const [qCorrect, setQCorrect] = useState('');
  const [qPoints, setQPoints] = useState(10);
  const [qClassId, setQClassId] = useState<string>('');

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await api.questions.list();
      setQuestions(data);
    } catch (err) {
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadQuestions();
      if (activeCircleId) {
        setQClassId(activeCircleId);
      }
    }
  }, [isOpen, activeCircleId]);

  if (!isOpen) return null;

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() || !qCorrect.trim()) return;

    const filteredOptions = qOptions.map((o) => o.trim()).filter(Boolean);
    if (!filteredOptions.includes(qCorrect.trim())) {
      filteredOptions.unshift(qCorrect.trim());
    }

    try {
      const created = await api.questions.create({
        type: qType,
        questionText: qText.trim(),
        surah: qSurah.trim() || undefined,
        options: filteredOptions,
        correctAnswer: qCorrect.trim(),
        points: qPoints,
        circleId: qClassId || undefined,
      });

      setQuestions((prev) => [created, ...prev]);
      setQText('');
      setQSurah('');
      setQOptions(['', '', '']);
      setQCorrect('');
      setShowAddModal(false);
      playSuccessDing();
    } catch (err) {
      console.error('Error creating question:', err);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('هل تريد حذف هذا السؤال من بنك الأسئلة؟')) return;
    try {
      await api.questions.delete(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      console.error('Error deleting question:', err);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (selectedCircleFilter !== 'all' && q.circleId !== selectedCircleFilter) return false;
    if (selectedTypeFilter !== 'all' && q.type !== selectedTypeFilter) return false;
    return true;
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return 'اختيار من متعدد';
      case 'missing_word':
        return 'الكلمة المفقودة';
      case 'guess_surah':
        return 'معرفة السورة';
      case 'tajweed_rule':
        return 'حكم تجويدي';
      default:
        return 'سؤال قرآني';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-emerald-500/30 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-emerald-700/80 border border-emerald-400/40 flex items-center justify-center shadow-inner">
              <HelpCircle className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>بنك الأسئلة والتحديات القرآنية</span>
                <span className="text-[11px] font-normal bg-emerald-700/60 px-2 py-0.5 rounded-full text-emerald-200">
                  {questions.length} سؤال
                </span>
              </h2>
              <p className="text-xs text-emerald-100/90">
                أسئلة الحفظ والتجويد المرتبطة بالحلقات مع إمكانية إسقاطها على السبورة فوراً
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

        {/* Filters and Actions */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {/* Filter by Circle */}
            <select
              value={selectedCircleFilter}
              onChange={(e) => setSelectedCircleFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="all">جميع الحلقات</option>
              {circles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Filter by Type */}
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="all">جميع أنواع الأسئلة</option>
              <option value="multiple_choice">اختيار من متعدد</option>
              <option value="missing_word">الكلمة المفقودة</option>
              <option value="guess_surah">معرفة السورة</option>
              <option value="tajweed_rule">أحكام التجويد</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(!showAddModal)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddModal ? 'إلغاء' : 'إضافة سؤال جديد'}</span>
          </button>
        </div>

        {/* Add Question Form */}
        {showAddModal && (
          <form onSubmit={handleAddQuestion} className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border-b border-emerald-200 dark:border-emerald-800/60 space-y-3 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نوع السؤال:
                </label>
                <select
                  value={qType}
                  onChange={(e) => setQType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                >
                  <option value="multiple_choice">اختيار من متعدد</option>
                  <option value="missing_word">الكلمة المفقودة (إكمال الآية)</option>
                  <option value="guess_surah">معرفة السورة من الآية</option>
                  <option value="tajweed_rule">سؤال في أحكام التجويد</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  السورة أو الموضوع:
                </label>
                <input
                  type="text"
                  placeholder="مثال: سورة الفاتحة، الإخفاء الحقيقي..."
                  value={qSurah}
                  onChange={(e) => setQSurah(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ربط بالحلقة التعليمية:
                </label>
                <select
                  value={qClassId}
                  onChange={(e) => setQClassId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                >
                  <option value="">عامة لجميع الحلقات</option>
                  {circles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                نص السؤال أو الآية:
              </label>
              <textarea
                required
                rows={2}
                placeholder="اكتب نص السؤال أو الآية الكريمة هنا..."
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {qOptions.map((opt, idx) => (
                <div key={idx}>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    الخيار {idx + 1}:
                  </label>
                  <input
                    type="text"
                    placeholder={`خيار ${idx + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const next = [...qOptions];
                      next[idx] = e.target.value;
                      setQOptions(next);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                  الإجابة الصحيحة (المطابقة):
                </label>
                <input
                  type="text"
                  required
                  placeholder="أدخل الإجابة الصحيحة تماماً"
                  value={qCorrect}
                  onChange={(e) => setQCorrect(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/40 text-slate-800 dark:text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  النقاط المستحقة:
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={qPoints}
                  onChange={(e) => setQPoints(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                حفظ في بنك الأسئلة
              </button>
            </div>
          </form>
        )}

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="text-center py-10 text-xs text-slate-500">جاري تحميل الأسئلة...</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                لا توجد أسئلة تطابق التصنيف المختار
              </p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة سؤال الآن</span>
              </button>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const circleName = circles.find((c) => c.id === q.circleId)?.name;

              return (
                <div
                  key={q.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col gap-2 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {getTypeLabel(q.type)}
                        </span>
                        {q.surah && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <BookOpen className="w-2.5 h-2.5" />
                            <span>{q.surah}</span>
                          </span>
                        )}
                        {circleName && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                            حلقة: {circleName}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          ⭐ {q.points || 10} نقاط
                        </span>
                      </div>

                      <p className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                        {q.questionText}
                      </p>
                    </div>

                    {/* Quick Stamp / Delete Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onStampQuestionToBoard(q)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                        title="إسقاط بطاقة السؤال على السبورة فوراً"
                      >
                        <Send className="w-3 h-3" />
                        <span>إسقاط بالسبورة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                        title="حذف السؤال"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Options */}
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 mt-1 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = opt === q.correctAnswer;
                        return (
                          <div
                            key={oIdx}
                            className={`px-2.5 py-1 rounded-xl text-xs flex items-center justify-between ${
                              isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-400 text-emerald-800 dark:text-emerald-200 font-bold'
                                : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <span>{opt}</span>
                            {isCorrect && <Check className="w-3 h-3 text-emerald-600" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
          <span>الأسئلة متاحة أيضاً في الألعاب التفاعلية وعجلة التحديات</span>
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
