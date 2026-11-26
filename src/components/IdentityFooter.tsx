import React from 'react';
import { OfficialLogo } from './OfficialLogo';

export const IdentityFooter: React.FC = () => {
  return (
    <footer
      id="fixed-identity-footer"
      className="w-full shrink-0 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between z-30 select-none shadow-sm"
      aria-label="معلومات إعداد سبورة المستنير"
    >
      <div className="flex items-center gap-2">
        <OfficialLogo size="sm" showAcademyTitle={false} />
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          سبورة المستنير التعليمية
        </span>
      </div>

      {/* Mandatory, immutable creator credit */}
      <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 px-3.5 py-1 rounded-full text-emerald-900 dark:text-emerald-100 font-bold text-sm sm:text-base shadow-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span id="creator-identity-text">إعداد: إسراء عبدالستار</span>
      </div>

      <div className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-1.5 font-medium">
        <span>مخصصة للمعلمين والمُحفّظين</span>
      </div>
    </footer>
  );
};
