import React, { useState, useEffect } from 'react';
import { ClassCircle } from '../types';
import { api } from '../utils/api';
import {
  X,
  Users,
  Plus,
  Trash2,
  BookOpen,
  CheckCircle,
  Sparkles,
  Edit2,
  Check,
  UserPlus,
  Layers,
} from 'lucide-react';
import { playSuccessDing } from '../utils/soundEffects';

interface ClassCirclesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCircleId?: string | null;
  onSelectCircle?: (circle: ClassCircle) => void;
}

export const ClassCirclesModal: React.FC<ClassCirclesModalProps> = ({
  isOpen,
  onClose,
  activeCircleId,
  onSelectCircle,
}) => {
  const [circles, setCircles] = useState<ClassCircle[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleLesson, setNewCircleLesson] = useState('');
  const [newCircleStudents, setNewCircleStudents] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLesson, setEditLesson] = useState('');
  const [newStudentForCircle, setNewStudentForCircle] = useState<{ [circleId: string]: string }>({});

  const loadCircles = async () => {
    try {
      setLoading(true);
      const data = await api.classes.list();
      setCircles(data);
    } catch (err) {
      console.error('Failed to load circles', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCircles();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCircleName.trim()) return;

    const students = newCircleStudents
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const created = await api.classes.create({
        name: newCircleName.trim(),
        description: newCircleLesson.trim() || undefined,
        studentNames: students.length > 0 ? students : ['طالب المستنير'],
      });

      setCircles((prev) => [created, ...prev]);
      setNewCircleName('');
      setNewCircleLesson('');
      setNewCircleStudents('');
      setShowAddForm(false);
      playSuccessDing();
      if (onSelectCircle) onSelectCircle(created);
    } catch (err) {
      console.error('Error creating circle:', err);
    }
  };

  const handleDeleteCircle = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الحلقة؟')) return;
    try {
      await api.classes.delete(id);
      setCircles((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Error deleting circle:', err);
    }
  };

  const handleAddStudentToCircle = async (circle: ClassCircle) => {
    const studentName = (newStudentForCircle[circle.id] || '').trim();
    if (!studentName) return;

    const currentList = circle.studentNames || [];
    const updatedStudents = [...currentList, studentName];
    try {
      const updated = await api.classes.update(circle.id, { studentNames: updatedStudents });
      setCircles((prev) => prev.map((c) => (c.id === circle.id ? updated : c)));
      setNewStudentForCircle((prev) => ({ ...prev, [circle.id]: '' }));
      playSuccessDing();
    } catch (err) {
      console.error('Error adding student:', err);
    }
  };

  const handleRemoveStudentFromCircle = async (circle: ClassCircle, studentIdx: number) => {
    const currentList = circle.studentNames || [];
    const updatedStudents = currentList.filter((_, idx) => idx !== studentIdx);
    try {
      const updated = await api.classes.update(circle.id, { studentNames: updatedStudents });
      setCircles((prev) => prev.map((c) => (c.id === circle.id ? updated : c)));
    } catch (err) {
      console.error('Error removing student:', err);
    }
  };

  const handleSaveLesson = async (circleId: string) => {
    try {
      const updated = await api.classes.update(circleId, { description: editLesson.trim() });
      setCircles((prev) => prev.map((c) => (c.id === circleId ? updated : c)));
      setEditingId(null);
    } catch (err) {
      console.error('Error updating lesson:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-emerald-500/30 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-emerald-700/80 border border-emerald-400/40 flex items-center justify-center shadow-inner">
              <Users className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>إدارة الحلقات والدروس القرآنية</span>
                <span className="text-[11px] font-normal bg-emerald-700/60 px-2 py-0.5 rounded-full text-emerald-200">
                  {circles.length} حلقة
                </span>
              </h2>
              <p className="text-xs text-emerald-100/90">
                تنظيم الطلاب وربط الأسئلة والألعاب والأنشطة بكل حلقة ودرس
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

        {/* Action Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            قائمة الحلقات التعليمية المسجلة
          </span>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'إلغاء' : 'إضافة حلقة جديدة'}</span>
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <form onSubmit={handleCreateCircle} className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-200 dark:border-emerald-800/60 space-y-3 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم الحلقة / المجموعة:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حلقة الفردوس، فوج الإتقان..."
                  value={newCircleName}
                  onChange={(e) => setNewCircleName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الدرس الحالي أو السورة:
                </label>
                <input
                  type="text"
                  placeholder="مثال: سورة الكهف، أحكام النون الساكنة..."
                  value={newCircleLesson}
                  onChange={(e) => setNewCircleLesson(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                قائمة أسماء الطلاب (اسم في كل سطر):
              </label>
              <textarea
                rows={3}
                placeholder="أحمد علي&#10;فاطمة محمود&#10;عمر خالد..."
                value={newCircleStudents}
                onChange={(e) => setNewCircleStudents(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                حفظ وإنشاء الحلقة
              </button>
            </div>
          </form>
        )}

        {/* Circles List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
          {loading ? (
            <div className="text-center py-10 text-xs text-slate-500">جاري تحميل الحلقات...</div>
          ) : circles.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                لا توجد حلقات مسجلة حتى الآن
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                قم بإنشاء حلقة جديدة لتنظيم طلابك وربط الأسئلة والألعاب وعجلة الحظ بها
              </p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة أول حلقة الآن</span>
              </button>
            </div>
          ) : (
            circles.map((circle) => {
              const isActive = activeCircleId === circle.id;
              const isEditing = editingId === circle.id;

              return (
                <div
                  key={circle.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs ring-1 ring-emerald-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                          {circle.name}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>الحلقة النشطة الحالية</span>
                          </span>
                        )}
                      </div>

                      {/* Current Lesson */}
                      <div className="mt-1.5 flex items-center gap-2 text-xs">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 flex-1">
                            <input
                              type="text"
                              value={editLesson}
                              onChange={(e) => setEditLesson(e.target.value)}
                              className="px-2 py-1 text-xs rounded border border-emerald-500 bg-white dark:bg-slate-900 w-48 text-slate-800 dark:text-slate-100"
                              placeholder="الدرس أو السورة"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveLesson(circle.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-100 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <span className="font-semibold text-slate-500">الدرس:</span>
                            <span>{circle.description || 'لم يحدد درس بعد'}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(circle.id);
                                setEditLesson(circle.description || '');
                              }}
                              className="p-0.5 text-slate-400 hover:text-slate-600"
                              title="تعديل الدرس"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      {!isActive && onSelectCircle && (
                        <button
                          type="button"
                          onClick={() => onSelectCircle(circle)}
                          className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 rounded-xl text-xs font-bold transition-colors"
                        >
                          تفعيل للحصة
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteCircle(circle.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                        title="حذف الحلقة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Students Pills */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>الطلاب المسجلون ({(circle.studentNames || []).length}):</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 items-center">
                      {(circle.studentNames || []).map((student, sIdx) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full text-xs font-medium"
                        >
                          <span>{student}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveStudentFromCircle(circle, sIdx)}
                            className="hover:text-red-500 text-slate-400 ml-0.5"
                            title="حذف الطالب من الحلقة"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      {/* Add single student input */}
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="طالب جديد..."
                          value={newStudentForCircle[circle.id] || ''}
                          onChange={(e) =>
                            setNewStudentForCircle((prev) => ({
                              ...prev,
                              [circle.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddStudentToCircle(circle);
                            }
                          }}
                          className="w-24 px-2 py-0.5 text-xs rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddStudentToCircle(circle)}
                          className="p-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
                          title="إضافة طالب"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
          <span>يتم حفظ جميع التعديلات تلقائياً في السيرفر وقاعدة البيانات</span>
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
