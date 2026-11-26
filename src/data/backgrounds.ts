import React from 'react';
import { BoardBackground } from '../types';

export interface BackgroundOption {
  id: BoardBackground;
  label: string;
  description: string;
  iconBg: string;
}

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  {
    id: 'plain',
    label: 'سادة',
    description: 'سطح أبيض نقي بدون خطوط',
    iconBg: 'bg-white border border-slate-300',
  },
  {
    id: 'grid',
    label: 'شبكية',
    description: 'مربعات هندسية منتظمة للرسم والرياضيات',
    iconBg: 'bg-white border border-slate-300 bg-[linear-gradient(#e2e8f0_1px,transparent_1px),linear-gradient(90deg,#e2e8f0_1px,transparent_1px)] bg-[size:8px_8px]',
  },
  {
    id: 'lined',
    label: 'مسطرة',
    description: 'أسطر أفقية لكتابة النصوص والآيات',
    iconBg: 'bg-white border border-slate-300 bg-[linear-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:100%_8px]',
  },
  {
    id: 'notebook',
    label: 'كشكول',
    description: 'أسطر دفترية مع هامش ملون أنيق',
    iconBg: 'bg-[#fffdfa] border border-slate-300 border-r-2 border-r-red-400 bg-[linear-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:100%_8px]',
  },
  {
    id: 'dots',
    label: 'نقاط',
    description: 'شبكة نقاط متناسقة للتصميم والرسم الحر',
    iconBg: 'bg-white border border-slate-300 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] bg-[size:6px_6px]',
  },
  {
    id: 'green',
    label: 'سبورة خضراء',
    description: 'سبورة كلاسيكية بلون أخضر زمردي هادئ',
    iconBg: 'bg-[#1b3b2b] border border-emerald-900',
  },
  {
    id: 'dark',
    label: 'سبورة داكنة',
    description: 'لون ليلي مريح للعين أثناء الحصص المسائية',
    iconBg: 'bg-[#0f172a] border border-slate-700',
  },
  {
    id: 'notes',
    label: 'ورق ملاحظات',
    description: 'خلفية صفراء دافئة للبطاقات والملاحظات',
    iconBg: 'bg-[#fef9c3] border border-amber-300 bg-[linear-gradient(#fde047_1px,transparent_1px)] bg-[size:100%_8px]',
  },
  {
    id: 'quran',
    label: 'سبورة المصحف',
    description: 'خلفية دافئة بلون ورق المصاحف الشريفة مع إطار زخرفي هادئ',
    iconBg: 'bg-[#faf6ee] border-2 border-emerald-700',
  },
  {
    id: 'english',
    label: 'دفتر إنجليزي',
    description: 'أسطر رباعية لتدريب خطوط اللغة الإنجليزية والحروف',
    iconBg: 'bg-white border border-slate-300 bg-[linear-gradient(#93c5fd_1px,transparent_1px),linear-gradient(#fca5a5_1px,transparent_1px)] bg-[size:100%_12px]',
  },
];

export const backgroundStyles: Record<BoardBackground, React.CSSProperties> = {
  plain: {
    backgroundColor: '#ffffff',
  },
  grid: {
    backgroundColor: '#ffffff',
    backgroundImage: `
      linear-gradient(#dbe5ec 1px, transparent 1px),
      linear-gradient(90deg, #dbe5ec 1px, transparent 1px)
    `,
    backgroundSize: '24px 24px',
  },
  lined: {
    backgroundColor: '#ffffff',
    backgroundImage: `
      linear-gradient(#dbe5ec 1px, transparent 1px)
    `,
    backgroundSize: '100% 28px',
  },
  notebook: {
    backgroundColor: '#fffdfa',
    backgroundImage: `
      linear-gradient(#e2e8f0 1px, transparent 1px)
    `,
    backgroundSize: '100% 30px',
    borderRight: '4px solid #ef8b8b',
  },
  dots: {
    backgroundColor: '#ffffff',
    backgroundImage: 'radial-gradient(#bfcbd3 1.5px, transparent 1.5px)',
    backgroundSize: '18px 18px',
  },
  green: {
    backgroundColor: '#1b3b2b',
    backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
  },
  dark: {
    backgroundColor: '#0f172a',
    backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
  },
  notes: {
    backgroundColor: '#fef9c3',
    backgroundImage: `
      linear-gradient(#fde047 1px, transparent 1px)
    `,
    backgroundSize: '100% 28px',
  },
  quran: {
    backgroundColor: '#faf6ee',
    backgroundImage: `
      radial-gradient(#d4af37 0.8px, transparent 0.8px),
      linear-gradient(to right, rgba(4, 120, 87, 0.04) 1px, transparent 1px)
    `,
    backgroundSize: '32px 32px, 100% 32px',
    boxShadow: 'inset 0 0 40px rgba(180, 140, 60, 0.12)',
  },
  english: {
    backgroundColor: '#ffffff',
    backgroundImage: `
      linear-gradient(#bfdbfe 1px, transparent 1px),
      linear-gradient(transparent 12px, #fca5a5 13px, transparent 14px),
      linear-gradient(transparent 24px, #bfdbfe 25px, transparent 26px)
    `,
    backgroundSize: '100% 36px',
  },
};
