import React from 'react';
import { Trash2, AlertTriangle, RotateCcw, X } from 'lucide-react';

interface ClearConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  onConfirmClear?: () => void;
  pageTitle?: string;
  elementsCount: number;
}

export const ClearConfirmModal: React.FC<ClearConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onConfirmClear,
  pageTitle = 'الصفحة الحالية',
  elementsCount,
}) => {
  if (!isOpen) return null;

  const handleExecute = () => {
    if (onConfirmClear) {
      onConfirmClear();
    } else if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0 shadow-xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                مسح جميع عناصر السبورة
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {pageTitle} • {elementsCount} عنصر
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Body */}
        <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
            هل أنت متأكد من مسح جميع الرسومات والكتابات من هذه الصفحة؟
            <div className="mt-1 flex items-center gap-1 font-bold text-amber-700 dark:text-amber-300">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ملاحظة: يمكنك التراجع عن المسح في أي وقت بالضغط على (تراجع).</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleExecute}
            className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Trash2 className="w-4 h-4" />
            <span>نعم، امسح كل العناصر</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-3 px-5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-colors cursor-pointer"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
