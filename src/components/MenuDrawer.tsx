import React from 'react';
import { BoardBackground } from '../types';
import { BACKGROUND_OPTIONS } from '../data/backgrounds';
import {
  BookOpen,
  Sparkles,
  Ruler,
  Compass,
  FolderOpen,
  Download,
  Printer,
  Moon,
  Sun,
  Maximize,
  Minimize,
  X,
  Share2,
  HelpCircle,
  Clock,
  Plus,
  Layers,
  Trash2,
  Palette,
  Trophy,
  Dices,
  Users,
  Medal,
} from 'lucide-react';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuranModal: () => void;
  onOpenMemorizationModal: () => void;
  onOpenMotivationModal?: () => void;
  onOpenClassGamesModal?: () => void;
  onOpenClassCirclesModal?: () => void;
  onOpenQuestionBankModal?: () => void;
  onOpenPointsTrackerModal?: () => void;
  onOpenSavedBoards: () => void;
  onExport: (format: 'png' | 'jpeg' | 'pdf' | 'print') => void;
  onToggleRuler: () => void;
  rulerVisible: boolean;
  onToggleProtractor: () => void;
  protractorVisible: boolean;
  onToggleCompass: () => void;
  compassVisible: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenScreenShareModal: () => void;
  onAddNewPage?: () => void;
  onOpenPagesManager?: () => void;
  currentPageIndex?: number;
  totalPages?: number;
  onClearBoard?: () => void;
  onChangeBackground?: (bg: BoardBackground) => void;
  currentBackground?: BoardBackground;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  onOpenQuranModal,
  onOpenMemorizationModal,
  onOpenMotivationModal,
  onOpenClassGamesModal,
  onOpenClassCirclesModal,
  onOpenQuestionBankModal,
  onOpenPointsTrackerModal,
  onOpenSavedBoards,
  onExport,
  onToggleRuler,
  rulerVisible,
  onToggleProtractor,
  protractorVisible,
  onToggleCompass,
  compassVisible,
  isDarkMode,
  onToggleDarkMode,
  isFullscreen,
  onToggleFullscreen,
  onOpenScreenShareModal,
  onAddNewPage,
  onOpenPagesManager,
  currentPageIndex = 0,
  totalPages = 1,
  onClearBoard,
  onChangeBackground,
  currentBackground = 'plain',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-start select-none animate-in fade-in duration-200"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-80 sm:w-96 bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-800 via-emerald-700 to-[#0a4834] text-white flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">قائمة سبورة المستنير</h2>
            <p className="text-xs text-emerald-100/90 mt-0.5">الأدوات التعليمية والمكتبات المساعدة</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Section 0: Pages Management (صفحات السبورة) */}
          {onAddNewPage && onOpenPagesManager && (
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/70 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>صفحات الدرس الحالية</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px]">
                  صفحة {currentPageIndex + 1} من {totalPages}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onAddNewPage();
                    onClose();
                  }}
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ صفحة جديدة</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenPagesManager();
                    onClose();
                  }}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>إدارة الصفحات</span>
                </button>
              </div>
            </div>
          )}

          {/* Section 1: Quran & Memorization */}
          <div>
            <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-2">
              حلقات القرآن والتحفيظ
            </div>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  onOpenQuranModal();
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/80 text-right transition-colors"
              >
                <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    المصحف الشريف
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    فهرس السور والآيات مع إمكانية الإرسال للسبورة
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenMemorizationModal();
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/80 dark:hover:bg-amber-900/50 border border-amber-200/80 dark:border-amber-800/80 text-right transition-colors"
              >
                <div className="p-2 rounded-lg bg-amber-600 text-white shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    أدوات التسميع والتكرار
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    مؤقت الحفظ، عداد التكرار والتسبيح التفاعلي
                  </div>
                </div>
              </button>

              {/* Student Motivation & Celebration */}
              {onOpenMotivationModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenMotivationModal();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700 text-right transition-colors"
                >
                  <div className="p-2 rounded-lg bg-amber-500 text-white shadow-xs">
                    <Trophy className="w-5 h-5 fill-amber-300" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <span>نظام الاحتفال والتشجيع</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-100">جديد</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      كؤوس، أوسمة، بطاقات تفوق، مؤثرات صوتية وتصفيق
                    </div>
                  </div>
                </button>
              )}

              {/* Interactive Class Games */}
              {onOpenClassGamesModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenClassGamesModal();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-300 dark:border-indigo-700 text-right transition-colors"
                >
                  <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
                    <Dices className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                      <span>ألعاب وتحديات الفصل</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-100">تفاعلي</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      عجلة التسميع 4 أوضاع، لعبة الذاكرة، المؤقت والكلمة المفقودة
                    </div>
                  </div>
                </button>
              )}

              {/* Class Circles & Students */}
              {onOpenClassCirclesModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenClassCirclesModal();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-teal-50/90 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-300 dark:border-teal-700 text-right transition-colors"
                >
                  <div className="p-2 rounded-lg bg-teal-600 text-white shadow-xs">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                      <span>إدارة الحلقات والطلاب</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-teal-200 dark:bg-teal-800 text-teal-800 dark:text-teal-100">إدارة</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      إنشاء الحلقات، تسجيل الطلاب، ربط الدروس والسبورات
                    </div>
                  </div>
                </button>
              )}

              {/* Question Bank */}
              {onOpenQuestionBankModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenQuestionBankModal();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-sky-50/90 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-300 dark:border-sky-700 text-right transition-colors"
                >
                  <div className="p-2 rounded-lg bg-sky-600 text-white shadow-xs">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                      <span>بنك الأسئلة والأنشطة</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-200 dark:bg-sky-800 text-sky-800 dark:text-sky-100">أسئلة</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      أسئلة متعددة، صح/خطأ، إكمال ومطابقة مع ختم مباشر على السبورة
                    </div>
                  </div>
                </button>
              )}

              {/* Points Tracker & Leaderboard */}
              {onOpenPointsTrackerModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenPointsTrackerModal();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 text-right transition-colors"
                >
                  <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs">
                    <Medal className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <span>سجل النقاط ولوحة الأوائل</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100">نقاط</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      منح النقاط الفورية وتصدير بطاقات التميز إلى السبورة
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Section 2: Educational Math Tools */}
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              الأدوات الهندسية التفاعلية
            </div>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={onToggleRuler}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                  rulerVisible
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-900 dark:text-emerald-200'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Ruler className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold">المسطرة الهندسية (30 سم)</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700">
                  {rulerVisible ? 'ظاهرة' : 'مخفية'}
                </span>
              </button>

              <button
                type="button"
                onClick={onToggleProtractor}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                  protractorVisible
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-900 dark:text-emerald-200'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold">المنقلة الهندسية (180°)</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700">
                  {protractorVisible ? 'ظاهرة' : 'مخفية'}
                </span>
              </button>

              <button
                type="button"
                onClick={onToggleCompass}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                  compassVisible
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-900 dark:text-emerald-200'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold">الفرجار (البرجل ورسم الدوائر)</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700">
                  {compassVisible ? 'ظاهرة' : 'مخفية'}
                </span>
              </button>
            </div>
          </div>

          {/* Section 3: Saved Boards & Export */}
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              الحفظ والتصدير
            </div>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  onOpenSavedBoards();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-right text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <FolderOpen className="w-4 h-4 text-emerald-600" />
                <span>اللوحات المحفوظة في الجهاز</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onExport('png')}
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تصدير صورة PNG</span>
                </button>

                <button
                  type="button"
                  onClick={() => onExport('pdf')}
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-red-600" />
                  <span>تصدير PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => onExport('jpeg')}
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-amber-600" />
                  <span>تصدير JPEG</span>
                </button>

                <button
                  type="button"
                  onClick={() => onExport('print')}
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-600" />
                  <span>طباعة مباشرة</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Display & Preferences */}
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              العرض والراحة البصرية
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={onToggleDarkMode}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                <span>{isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
              </button>

              <button
                type="button"
                onClick={onToggleFullscreen}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2"
              >
                {isFullscreen ? <Minimize className="w-4 h-4 text-emerald-600" /> : <Maximize className="w-4 h-4 text-emerald-600" />}
                <span>{isFullscreen ? 'إنهاء ملء الشاشة' : 'ملء الشاشة'}</span>
              </button>
            </div>

            {/* Background options directly in drawer */}
            {onChangeBackground && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تغيير خلفية السبورة</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {BACKGROUND_OPTIONS.map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => onChangeBackground(bg.id)}
                      className={`p-1.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                        currentBackground === bg.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 font-bold text-emerald-800 dark:text-emerald-200'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className={`w-full h-5 rounded-md ${bg.iconBg}`} />
                      <span className="text-[10px] truncate w-full">{bg.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Clear Board Button */}
          {onClearBoard && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onClearBoard();
                }}
                className="w-full p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>مسح جميع عناصر السبورة الحالية</span>
              </button>
            </div>
          )}

          {/* Section 5: Screen Sharing Guides (Zoom / Meet) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onOpenScreenShareModal();
                onClose();
              }}
              className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>مشاركة الشاشة مع Google Meet و Zoom</span>
            </button>
          </div>
        </div>

        {/* Drawer Footer Credit */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 text-center text-[11px] text-emerald-800 dark:text-emerald-300 font-bold">
          سبورة المستنير — إعداد: إسراء عبدالستار
        </div>
      </div>
    </div>
  );
};
