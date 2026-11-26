import React from 'react';
import { SavedBoard } from '../types';
import { FolderOpen, Trash2, Calendar, FileText, X } from 'lucide-react';

interface SavedBoardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedBoards: SavedBoard[];
  onLoadBoard: (board: SavedBoard) => void;
  onDeleteBoard: (id: string) => void;
}

export const SavedBoardsModal: React.FC<SavedBoardsModalProps> = ({
  isOpen,
  onClose,
  savedBoards,
  onLoadBoard,
  onDeleteBoard,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FolderOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold">اللوحات المحفوظة محلياً</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {savedBoards.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <FileText className="w-12 h-12 mx-auto stroke-1 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium">لا توجد لوحات محفوظة بعد</p>
              <p className="text-xs text-slate-400">
                يمكنك حفظ عملك الحالي بالضغط على زر &quot;حفظ السبورة&quot; في الشريط العلوي.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {savedBoards.map((board) => (
                <div
                  key={board.id}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-850 hover:border-emerald-500 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Thumbnail preview if available */}
                    {board.thumbnail ? (
                      <div className="w-full h-28 bg-white dark:bg-slate-900 rounded-lg overflow-hidden mb-2.5 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                        <img
                          src={board.thumbnail}
                          alt={board.title}
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-28 bg-white dark:bg-slate-900 rounded-lg mb-2.5 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 text-xs">
                        سبورة ({board.elements.length} عناصر)
                      </div>
                    )}

                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate mb-1">
                      {board.title}
                    </h4>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-2">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(board.createdAt).toLocaleDateString('ar-EG')}</span>
                      <span>-</span>
                      <span>{new Date(board.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        onLoadBoard(board);
                        onClose();
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs active:scale-95"
                    >
                      فتح اللوحة
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteBoard(board.id)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded active:scale-95 transition-colors"
                      title="حذف اللوحة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
