import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import {
  FileText,
  Upload,
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Plus,
  X,
  Loader2,
  CheckCircle,
} from 'lucide-react';

// Setup pdf.js worker using local bundled vite url
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

interface PdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertPage: (dataUrl: string, width: number, height: number) => void;
}

export const PdfModal: React.FC<PdfModalProps> = ({
  isOpen,
  onClose,
  onInsertPage,
}) => {
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [previewScale, setPreviewScale] = useState<number>(1.2);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [insertSuccess, setInsertSuccess] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Automatically prompt file picker on initial open if no document loaded yet
  useEffect(() => {
    if (isOpen && !pdfDoc) {
      const timer = setTimeout(() => {
        fileInputRef.current?.click();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, pdfDoc]);

  // Load and render page whenever currentPage, previewScale, or pdfDoc changes
  useEffect(() => {
    if (!pdfDoc || !isOpen) return;

    let isMounted = true;
    const renderCurrentPage = async () => {
      try {
        setIsRendering(true);
        setErrorMsg(null);
        const page = await pdfDoc.getPage(currentPage);
        if (!isMounted) return;

        const viewport = page.getViewport({ scale: previewScale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: ctx,
          viewport,
        };

        await page.render(renderContext).promise;
      } catch (err: any) {
        if (isMounted) {
          console.error('PDF page render error:', err);
          setErrorMsg('حدث خطأ أثناء عرض صفحة PDF');
        }
      } finally {
        if (isMounted) {
          setIsRendering(false);
        }
      }
    };

    renderCurrentPage();
    return () => {
      isMounted = false;
    };
  }, [pdfDoc, currentPage, previewScale, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('من فضلك اختر ملف PDF صحيح.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);
      setFileName(file.name);

      const arrayBuffer = await file.arrayBuffer();
      const loadedDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      setPdfDoc(loadedDoc);
      setTotalPages(loadedDoc.numPages);
      setCurrentPage(1);
    } catch (err: any) {
      console.error('PDF loading error:', err);
      setErrorMsg('تعذر فتح ملف PDF. تأكد من سلامة الملف.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
    }
  };

  const handleInsertCurrentPage = async () => {
    if (!pdfDoc) return;

    try {
      setIsRendering(true);
      const page = await pdfDoc.getPage(currentPage);
      // High resolution render for whiteboard
      const exportScale = 2.0;
      const viewport = page.getViewport({ scale: exportScale });

      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = viewport.width;
      offscreenCanvas.height = viewport.height;
      const ctx = offscreenCanvas.getContext('2d');
      if (!ctx) return;

      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = offscreenCanvas.toDataURL('image/png', 0.95);

      // Desired whiteboard display size (fit comfortably)
      const displayWidth = Math.min(650, Math.round(viewport.width / exportScale));
      const displayHeight = Math.round((displayWidth / viewport.width) * viewport.height);

      onInsertPage(dataUrl, displayWidth, displayHeight);
      setInsertSuccess(true);
      setTimeout(() => {
        setInsertSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error inserting page to board:', err);
      alert('حدث خطأ أثناء إدراج الصفحة للسبورة');
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-700 via-emerald-800 to-[#0a4834] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/15 rounded-lg">
              <FileText className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">إضافة واستعراض ملف PDF</h2>
              <p className="text-xs text-emerald-100/90 leading-tight">
                {fileName ? fileName : 'اختر ملف كتب مدرسية، مصاحف، أو مذكرات لإدراجها بالسبورة'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4 flex flex-col items-center bg-slate-100 dark:bg-slate-950/60 min-h-[340px]">
          {!pdfDoc ? (
            /* Upload State */
            <div className="w-full max-w-md my-auto flex flex-col items-center text-center p-8 border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
                رفع ملف PDF تعليمي
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                يدعم ملفات المناهج والآيات والمذكرات التعليمية. يمكنك تصفح أي صفحة وإدراجها كعنصر للشرح والكتابة فوقها.
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري تحميل الملف...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>اختيار ملف PDF من الجهاز</span>
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            /* PDF Page Preview Area */
            <div className="w-full flex flex-col items-center">
              {errorMsg && (
                <div className="mb-3 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div className="relative max-w-full overflow-auto shadow-md rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 flex items-center justify-center">
                {isRendering && (
                  <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-10">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  </div>
                )}
                <canvas ref={canvasRef} className="block max-w-full h-auto rounded" />
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation & Controls */}
        {pdfDoc && (
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
            {/* Left: Change File button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>ملف آخر</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Center: Pagination & Zoom */}
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage <= 1 || isRendering}
                className="p-1 rounded text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                title="الصفحة السابقة"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                صفحة <span className="text-emerald-600 dark:text-emerald-400">{currentPage}</span> من {totalPages}
              </div>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages || isRendering}
                className="p-1 rounded text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                title="الصفحة التالية"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-600 mx-1" />

              {/* Zoom Preview */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewScale((s) => Math.max(0.6, +(s - 0.2).toFixed(1)))}
                  className="p-1 rounded text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700"
                  title="تصغير المعاينة"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] text-slate-500 font-mono w-9 text-center">
                  {Math.round(previewScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewScale((s) => Math.min(2.5, +(s + 0.2).toFixed(1)))}
                  className="p-1 rounded text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700"
                  title="تكبير المعاينة"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right: Insert Button */}
            <div>
              <button
                type="button"
                onClick={handleInsertCurrentPage}
                disabled={isRendering || insertSuccess}
                className={`py-1.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 ${
                  insertSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white'
                }`}
              >
                {insertSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>تمت الإضافة للسبورة!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>إضافة هذه الصفحة للسبورة</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
