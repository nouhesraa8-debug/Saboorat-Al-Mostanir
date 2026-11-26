import React, { useState, useEffect } from 'react';
import { Save, Download, FileJson, Image as ImageIcon, X, Check, BookOpen } from 'lucide-react';
import { WhiteboardElement, BoardBackground } from '../types';

interface SaveBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToGallery: (title: string) => void;
  currentElements: WhiteboardElement[];
  currentBackground: BoardBackground;
  currentPageTitle?: string;
}

export const SaveBoardModal: React.FC<SaveBoardModalProps> = ({
  isOpen,
  onClose,
  onSaveToGallery,
  currentElements,
  currentBackground,
  currentPageTitle,
}) => {
  const [boardTitle, setBoardTitle] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const defaultDate = new Date().toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      setBoardTitle(currentPageTitle ? `${currentPageTitle} - ${defaultDate}` : `درس سبورة المستنير - ${defaultDate}`);
      setSavedSuccess(false);

      // Generate preview thumbnail from canvas
      try {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
        if (canvas) {
          setThumbnailUrl(canvas.toDataURL('image/jpeg', 0.6));
        }
      } catch {
        setThumbnailUrl(null);
      }
    }
  }, [isOpen, currentPageTitle]);

  if (!isOpen) return null;

  const handleSaveToSavedBoards = () => {
    if (!boardTitle.trim()) return;
    onSaveToGallery(boardTitle.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleDownloadImage = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    // Create a composite canvas including background color
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Fill background
    ctx.fillStyle = currentBackground === 'dark' ? '#0f172a' : currentBackground === 'green' ? '#14532d' : '#ffffff';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    // Draw canvas content
    ctx.drawImage(canvas, 0, 0);

    const dataUrl = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${boardTitle || 'سبورة_المستنير'}.png`;
    link.href = dataUrl;
    link.click();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleDownloadJson = () => {
    const data = {
      title: boardTitle,
      savedAt: new Date().toISOString(),
      background: currentBackground,
      elementsCount: currentElements.length,
      elements: currentElements,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${boardTitle || 'سبورة_المستنير'}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0 shadow-xs">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                حفظ لوحة الدرس
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                احفظ عملك في مكتبة السبورات أو حمّله على جهازك كصورة أو ملف
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

        {/* Success Alert */}
        {savedSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-bold animate-in fade-in zoom-in-95">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>تم حفظ السبورة بنجاح!</span>
          </div>
        )}

        {/* Title Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            عنوان اللوحة أو الدرس:
          </label>
          <input
            type="text"
            value={boardTitle}
            onChange={(e) => setBoardTitle(e.target.value)}
            placeholder="مثال: حلقة سورة البقرة - تفسير الآيات"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            autoFocus
          />
        </div>

        {/* Preview and Info */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt="معاينة اللوحة"
              className="w-20 h-14 object-cover rounded-lg border border-slate-300 dark:border-slate-600 shadow-xs"
            />
          ) : (
            <div className="w-20 h-14 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400">
              <BookOpen className="w-6 h-6" />
            </div>
          )}
          <div className="flex flex-col gap-0.5 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              محتوى اللوحة الحالية
            </span>
            <span>عدد العناصر: {currentElements.length} عنصر</span>
            <span className="text-[11px] text-slate-500">
              الخلفية: {currentBackground}
            </span>
          </div>
        </div>

        {/* Save Options */}
        <div className="flex flex-col gap-2 pt-1">
          {/* 1. Save to In-App Saved Boards Library */}
          <button
            type="button"
            onClick={handleSaveToSavedBoards}
            disabled={!boardTitle.trim()}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>حفظ في مكتبة السبورات للتطبيق</span>
          </button>

          {/* 2. Download as Image / JSON */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownloadImage}
              className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <span>تحميل كصورة (PNG)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileJson className="w-4 h-4 text-amber-600" />
              <span>تحميل ملف الدرس (JSON)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
