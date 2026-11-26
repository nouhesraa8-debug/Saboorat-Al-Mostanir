import React, { useState } from 'react';
import { SessionState } from '../types';
import { OfficialLogo } from './OfficialLogo';
import {
  Menu,
  Users,
  Share2,
  Copy,
  Check,
  Radio,
  LogOut,
  Eye,
  Maximize,
  Minimize,
  Moon,
  Sun,
  BookOpen,
  Sparkles,
  FolderOpen,
  Ruler,
  Compass,
  Download,
  Plus,
  Layers,
  Trophy,
  Dices,
  Medal,
} from 'lucide-react';

interface TopBarProps {
  session: SessionState;
  onOpenMenu: () => void;
  onOpenShareModal: () => void;
  onEndSession: () => void;
  onToggleFocusMode: () => void;
  onToggleStudentDraw: (allow: boolean) => void;
  isTeacher: boolean;
  onAddNewPage?: () => void;
  onOpenPagesManager?: () => void;
  currentPageIndex?: number;
  totalPages?: number;
  onOpenMotivationModal?: () => void;
  onOpenClassGamesModal?: () => void;
  onOpenPointsTrackerModal?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  session,
  onOpenMenu,
  onOpenShareModal,
  onEndSession,
  onToggleFocusMode,
  onToggleStudentDraw,
  isTeacher,
  onAddNewPage,
  onOpenPagesManager,
  currentPageIndex = 0,
  totalPages = 1,
  onOpenMotivationModal,
  onOpenClassGamesModal,
  onOpenPointsTrackerModal,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showParticipantsDropdown, setShowParticipantsDropdown] = useState(false);

  const handleCopyLink = () => {
    let url = window.location.origin;
    if (session.roomId) {
      url += `?room=${session.roomId}&role=student`;
    }
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const studentCount = session.participants.filter((p) => p.role === 'student').length;

  return (
    <header
      id="main-topbar"
      className="w-full shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 px-3 sm:px-4 py-2 flex items-center justify-between z-40 select-none shadow-xs transition-all duration-300"
      dir="rtl"
    >
      {/* Right side: Menu Drawer Button + Logo + Title */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* ☰ القائمة (Menu Drawer Trigger) */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-700 transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          title="فتح القائمة الرئيسية والأدوات التعليمية"
          aria-label="القائمة"
        >
          <Menu className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
          <span className="text-xs font-bold hidden md:inline-block">القائمة</span>
        </button>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* Logo & App Title & Educator Attribution */}
        <div className="flex items-center gap-2">
          <OfficialLogo size="sm" showAcademyTitle={false} />
          <div className="flex flex-col text-right">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-sm sm:text-base font-black text-emerald-950 dark:text-emerald-100 tracking-tight leading-tight">
                سبورة المستنير
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-yellow-500/15 border border-amber-400/60 dark:border-amber-500/50 text-amber-900 dark:text-amber-200 text-[10px] sm:text-xs font-black shadow-2xs whitespace-nowrap">
                إعداد: إسراء عبد الستار
              </span>
            </div>
            <span className="text-[10px] text-emerald-700/90 dark:text-emerald-400/90 leading-tight font-medium hidden sm:block">
              السبورة التعليمية الذكية
            </span>
          </div>
        </div>
      </div>

      {/* Middle side: Teacher identity badge & Session status */}
      <div className="hidden lg:flex items-center gap-3">
        {/* المعلمة Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>{isTeacher ? 'المعلمة: متصلة' : `الطالب: ${session.studentName}`}</span>
        </div>

        {/* حالة الجلسة */}
        {session.active ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-bold">
            <Radio className="w-3 h-3 text-red-500 animate-pulse" />
            <span>جلسة مباشرة: {session.roomId}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>وضع محلي (غير متصل)</span>
          </div>
        )}
      </div>

      {/* Left side: Participants + Share + Copy link + End session + Focus Mode */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* المشاركون (Participants Dropdown) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowParticipantsDropdown(!showParticipantsDropdown)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border ${
              session.active
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
            title="عرض المشاركين في الفصل"
          >
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>المشاركون</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white dark:bg-slate-900 text-[11px] font-mono font-bold shadow-xs">
              {session.active ? session.participants.length : 1}
            </span>
          </button>

          {/* Participants Dropdown Popover */}
          {showParticipantsDropdown && (
            <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  المشاركون في الفصل ({session.active ? session.participants.length : 1})
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  {session.active ? 'متصلون الآن' : 'وضع الشرح الفردي'}
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 mb-2.5">
                {session.active ? (
                  session.participants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {p.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {p.role === 'teacher' ? 'المعلمة' : 'طالب'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-center text-xs text-slate-500 dark:text-slate-400">
                    أنت حالياً في وضع الشرح المحلي. اضغط على «مشاركة» لبدء حصة تفاعلية مع الطلاب.
                  </div>
                )}
              </div>

              {/* Teacher control for student drawing permission */}
              {isTeacher && session.active && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    كتابة الطلاب على السبورة
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleStudentDraw(!session.allowStudentDraw)}
                    className={`text-xs px-2 py-0.5 rounded-md font-bold transition-colors ${
                      session.allowStudentDraw
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    {session.allowStudentDraw ? 'مسموح' : 'معطل'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* مشاركة (Share Session Dialog Button) */}
        <button
          type="button"
          onClick={onOpenShareModal}
          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
          title="مشاركة السبورة وبدء فصل تفاعلي أو رابط Zoom / Meet"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline-block">مشاركة</span>
        </button>

        {/* نسخ الرابط (Copy Room Direct Link) */}
        <button
          type="button"
          onClick={handleCopyLink}
          className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
            copiedLink
              ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-400 text-emerald-800 dark:text-emerald-200'
              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
          }`}
          title="نسخ رابط الفصل المباشر للطلاب"
        >
          {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          <span className="hidden md:inline-block">{copiedLink ? 'تم النسخ!' : 'نسخ الرابط'}</span>
        </button>

        {/* إنهاء الجلسة (End Session Button - visible when active and teacher) */}
        {session.active && isTeacher && (
          <button
            type="button"
            onClick={onEndSession}
            className="px-2.5 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 hover:bg-red-100 text-xs font-bold transition-colors flex items-center gap-1"
            title="إنهاء الجلسة التفاعلية الحالية"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden lg:inline-block">إنهاء الجلسة</span>
          </button>
        )}

        {/* فتح صفحة جديدة وإدارتها (Quick New Page) */}
        {onAddNewPage && (
          <div className="flex items-center gap-1">
            {onOpenPagesManager && (
              <button
                type="button"
                onClick={onOpenPagesManager}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
                title="عرض وإدارة صفحات السبورة"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  صفحة {currentPageIndex + 1}/{totalPages}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onAddNewPage}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
              title="فتح صفحة جديدة فارغة مع حفظ الصفحة الحالية"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline-block">صفحة جديدة</span>
            </button>
          </div>
        )}

        {/* تشجيع واحتفال للطلاب (Student Motivation) */}
        {onOpenMotivationModal && (
          <button
            type="button"
            onClick={onOpenMotivationModal}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 active:scale-95"
            title="نظام الاحتفال والتشجيع: كؤوس، أوسمة، مؤثرات صوتية وتصفيق"
          >
            <Trophy className="w-4 h-4 fill-amber-200" />
            <span className="hidden sm:inline-block">تشجيع</span>
          </button>
        )}

        {/* ألعاب وتحديات الفصل (Class Games) */}
        {onOpenClassGamesModal && (
          <button
            type="button"
            onClick={onOpenClassGamesModal}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 active:scale-95"
            title="ألعاب وتحديات الفصل: عجلة التسميع، لعبة الذاكرة القرآنية، والمؤقت"
          >
            <Dices className="w-4 h-4" />
            <span className="hidden sm:inline-block">الألعاب</span>
          </button>
        )}

        {/* سجل النقاط (Points Tracker) */}
        {onOpenPointsTrackerModal && (
          <button
            type="button"
            onClick={onOpenPointsTrackerModal}
            className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 active:scale-95"
            title="سجل النقاط والمتصدرين"
          >
            <Medal className="w-4 h-4" />
            <span className="hidden sm:inline-block">النقاط</span>
          </button>
        )}

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* أداة: وضع التركيز (Focus Mode) */}
        <button
          type="button"
          onClick={onToggleFocusMode}
          className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
          title="تفعيل وضع التركيز (إخفاء الأشرطة والقوائم لتركيز الطالب على الشرح)"
        >
          <Eye className="w-4 h-4 text-amber-700 dark:text-amber-300" />
          <span>وضع التركيز</span>
        </button>
      </div>
    </header>
  );
};
