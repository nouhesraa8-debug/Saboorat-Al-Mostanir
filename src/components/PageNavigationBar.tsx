import React from 'react';
import { ChevronRight, ChevronLeft, Plus, Layers } from 'lucide-react';

interface PageNavigationBarProps {
  currentPageIndex: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onAddNewPage: () => void;
  onOpenPagesManager: () => void;
}

export const PageNavigationBar: React.FC<PageNavigationBarProps> = ({
  currentPageIndex,
  totalPages,
  onPrevPage,
  onNextPage,
  onAddNewPage,
  onOpenPagesManager,
}) => {
  return (
    <div
      className="flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md rounded-2xl p-1 select-none text-xs font-bold"
      dir="rtl"
    >
      {/* السابق (RTL: ChevronRight points to the right/previous) */}
      <button
        type="button"
        onClick={onPrevPage}
        disabled={currentPageIndex <= 0}
        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 transition-colors"
        title="الصفحة السابقة"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Page Count Indicator / Button to Open Manager */}
      <button
        type="button"
        onClick={onOpenPagesManager}
        className="px-2.5 py-1 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-800 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-1.5"
        title="عرض جميع الصفحات وإدارتها"
      >
        <Layers className="w-3.5 h-3.5 text-emerald-600" />
        <span className="font-bold">
          صفحة {currentPageIndex + 1} / {totalPages}
        </span>
      </button>

      {/* التالي (RTL: ChevronLeft points to the left/next) */}
      <button
        type="button"
        onClick={onNextPage}
        disabled={currentPageIndex >= totalPages - 1}
        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 transition-colors"
        title="الصفحة التالية"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5" />

      {/* فتح صفحة جديدة */}
      <button
        type="button"
        onClick={onAddNewPage}
        className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 transition-all flex items-center gap-1 shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
        title="فتح صفحة جديدة فارغة للشرح"
      >
        <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span className="text-[11px] font-bold whitespace-nowrap">صفحة جديدة</span>
      </button>
    </div>
  );
};
