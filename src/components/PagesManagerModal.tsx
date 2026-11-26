import React from 'react';
import { BoardPage, BoardBackground } from '../types';
import { Plus, Trash2, Copy, Check, FileText, X } from 'lucide-react';

interface PagesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: BoardPage[];
  currentPageIndex: number;
  onSelectPage: (index: number) => void;
  onAddNewPage: () => void;
  onDuplicatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
}

export const PagesManagerModal: React.FC<PagesManagerModalProps> = ({
  isOpen,
  onClose,
  pages,
  currentPageIndex,
  onSelectPage,
  onAddNewPage,
  onDuplicatePage,
  onDeletePage,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-5 max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                إدارة صفحات السبورة ({pages.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تنقل بين صفحات الدرس أو أضف صفحات جديدة للشرح والتدريبات
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

        {/* Action Button: Add New Page */}
        <button
          type="button"
          onClick={() => {
            onAddNewPage();
          }}
          className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>فتح صفحة جديدة فارغة (+ صفحة {pages.length + 1})</span>
        </button>

        {/* Pages Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-1">
          {pages.map((page, index) => {
            const isCurrent = index === currentPageIndex;
            return (
              <div
                key={page.id}
                onClick={() => {
                  onSelectPage(index);
                  onClose();
                }}
                className={`relative rounded-2xl border-2 p-3 transition-all cursor-pointer flex flex-col justify-between group ${
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Page Preview Card */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                        isCurrent
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {page.title || `صفحة ${index + 1}`}
                    </span>
                  </div>

                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      النشطة
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                  <span>{page.elements?.length || 0} عنصر</span>
                  <span>•</span>
                  <span>خلفية: {page.background}</span>
                </div>

                {/* Page Card Actions */}
                <div className="flex items-center gap-1 border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicatePage(index);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 text-xs"
                    title="تكرار هذه الصفحة"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>تكرار</span>
                  </button>

                  {pages.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePage(index);
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/60 text-red-600 transition-colors flex items-center gap-1 text-xs mr-auto"
                      title="حذف هذه الصفحة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
