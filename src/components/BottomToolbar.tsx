import React, { useState, useRef, useEffect } from 'react';
import { ToolType, BoardBackground, ShapeType } from '../types';
import { BACKGROUND_OPTIONS } from '../data/backgrounds';
import {
  RotateCcw,
  RotateCw,
  Trash2,
  Trash,
  MousePointer,
  Hand,
  Pen,
  Highlighter,
  Eraser,
  Type,
  Shapes,
  Image as ImageIcon,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCcw as ResetIcon,
  Palette,
  EyeOff,
  Save,
  Minus,
  ArrowUpRight,
  Square,
  Circle,
  CircleDot,
  Triangle,
  Star,
  Diamond,
  Hexagon,
  Heart,
  MoveHorizontal,
  Spline,
  Check,
  X as XIcon,
  ChevronUp,
  Trophy,
  Dices,
  Layers,
  Lock,
  Unlock,
} from 'lucide-react';

interface BottomToolbarProps {
  currentTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  currentColor: string;
  onChangeColor: (color: string) => void;
  strokeWidth: number;
  onChangeStrokeWidth: (w: number) => void;
  background: BoardBackground;
  onChangeBackground: (bg: BoardBackground) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  hasSelectedElement: boolean;
  isElementLocked?: boolean;
  onToggleLock?: () => void;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  onUploadImage: () => void;
  onOpenPdfModal: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onHideTools: () => void;
  onSaveBoard: () => void;
  canDraw: boolean;
  onOpenMotivationModal?: () => void;
  onOpenClassGamesModal?: () => void;
  onToggleRevealPath?: () => void;
  isRevealPathOpen?: boolean;
}

const PALETTE_COLORS = [
  { color: '#0f172a', label: 'أسود' },
  { color: '#16a34a', label: 'أخضر زمردي' },
  { color: '#2563eb', label: 'أزرق' },
  { color: '#dc2626', label: 'أحمر' },
  { color: '#d97706', label: 'ذهبي' },
  { color: '#7c3aed', label: 'بنفسجي' },
  { color: '#059669', label: 'أخضر هادئ' },
  { color: '#ffffff', label: 'أبيض' },
];

const STROKE_WIDTHS = [
  { width: 2, label: 'رفيع', sizeClass: 'w-2 h-2' },
  { width: 5, label: 'متوسط', sizeClass: 'w-3 h-3' },
  { width: 10, label: 'عريض', sizeClass: 'w-4 h-4' },
];

const ERASER_SIZES = [
  { width: 12, label: 'صغيرة', previewClass: 'w-2.5 h-2.5' },
  { width: 28, label: 'متوسطة', previewClass: 'w-4 h-4' },
  { width: 56, label: 'كبيرة', previewClass: 'w-6 h-6' },
  { width: 90, label: 'عريضة', previewClass: 'w-8 h-8' },
];

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  currentTool,
  onSelectTool,
  currentColor,
  onChangeColor,
  strokeWidth,
  onChangeStrokeWidth,
  background,
  onChangeBackground,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  hasSelectedElement,
  isElementLocked = false,
  onToggleLock,
  onDeleteSelected,
  onClearAll,
  onUploadImage,
  onOpenPdfModal,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onHideTools,
  onSaveBoard,
  canDraw,
  onOpenMotivationModal,
  onOpenClassGamesModal,
  onToggleRevealPath,
  isRevealPathOpen,
}) => {
  // Popovers state
  const [showColorPopover, setShowColorPopover] = useState(false);
  const [showShapePopover, setShowShapePopover] = useState(false);
  const [showEraserPopover, setShowEraserPopover] = useState(false);
  const [showBackgroundPopover, setShowBackgroundPopover] = useState(false);

  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowColorPopover(false);
        setShowShapePopover(false);
        setShowEraserPopover(false);
        setShowBackgroundPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isShapeTool = [
    'line',
    'dashed_line',
    'arrow',
    'double_arrow',
    'rect',
    'square',
    'circle',
    'ellipse',
    'triangle',
    'star',
    'rhombus',
    'hexagon',
    'arc',
    'heart',
    'checkmark',
    'cross',
  ].includes(currentTool);

  const getShapeLabel = (tool: ToolType) => {
    switch (tool) {
      case 'line':
        return 'خط';
      case 'dashed_line':
        return 'متقطع';
      case 'arrow':
        return 'سهم';
      case 'double_arrow':
        return 'سهمين';
      case 'rect':
        return 'مستطيل';
      case 'square':
        return 'مربع';
      case 'circle':
        return 'دائرة';
      case 'ellipse':
        return 'بيضاوي';
      case 'triangle':
        return 'مثلث';
      case 'star':
        return 'نجمة';
      case 'rhombus':
        return 'معين';
      case 'hexagon':
        return 'سداسي';
      case 'arc':
        return 'قوس';
      case 'heart':
        return 'قلب';
      case 'checkmark':
        return 'صح';
      case 'cross':
        return 'خطأ';
      default:
        return 'أشكال';
    }
  };

  return (
    <div
      ref={toolbarRef}
      id="whiteboard-bottom-toolbar"
      className="relative shrink-0 w-full px-2 sm:px-4 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-between z-30 select-none shadow-md transition-all duration-300"
      dir="rtl"
    >
      {/* 1. History & Modification: Undo, Redo, Delete, Clear All */}
      <div className="flex items-center gap-1">
        {/* تراجع */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex flex-col items-center gap-0.5"
          title="تراجع (Ctrl+Z)"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-[10px] font-bold">تراجع</span>
        </button>

        {/* إعادة */}
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex flex-col items-center gap-0.5"
          title="إعادة (Ctrl+Y)"
        >
          <RotateCw className="w-4 h-4" />
          <span className="text-[10px] font-bold">إعادة</span>
        </button>

        {/* زر قفل / فتح العنصر المحدد */}
        <button
          type="button"
          onClick={onToggleLock}
          disabled={!hasSelectedElement || !canDraw}
          className={`p-2 rounded-xl transition-all flex flex-col items-center gap-0.5 disabled:opacity-30 disabled:cursor-not-allowed ${
            isElementLocked
              ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900 ring-1 ring-amber-400/60 shadow-xs'
              : hasSelectedElement
              ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              : 'text-slate-400 dark:text-slate-600'
          }`}
          title={
            !hasSelectedElement
              ? 'حدد عنصراً لقفله أو فتحه'
              : isElementLocked
              ? 'فتح قفل العنصر (السماح بالتعديل والحذف)'
              : 'قفل العنصر لمنع التعديل أو الحذف'
          }
        >
          {isElementLocked ? (
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          ) : (
            <Unlock className="w-4 h-4" />
          )}
          <span className="text-[10px] font-bold">
            {isElementLocked ? 'فتح' : 'قفل'}
          </span>
        </button>

        {/* حذف العنصر */}
        <button
          type="button"
          onClick={onDeleteSelected}
          disabled={!hasSelectedElement || !canDraw || isElementLocked}
          className="p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex flex-col items-center gap-0.5"
          title={isElementLocked ? 'لا يمكن حذف عنصر مقفل' : 'حذف العنصر المحدد (Delete)'}
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-[10px] font-bold">حذف</span>
        </button>

        {/* مسح الكل */}
        <button
          type="button"
          onClick={onClearAll}
          disabled={!canDraw}
          className="p-2 rounded-xl text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex flex-col items-center gap-0.5"
          title="مسح جميع عناصر السبورة"
        >
          <Trash className="w-4 h-4 text-red-600" />
          <span className="text-[10px] font-bold text-red-700 dark:text-red-400">مسح الكل</span>
        </button>
      </div>

      <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

      {/* 2. Core Drawing Tools: Select, Pan, Pen, Highlighter, Eraser, Text, Shapes */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
        {/* تحديد */}
        <button
          type="button"
          onClick={() => {
            onSelectTool('select');
            setShowColorPopover(false);
            setShowShapePopover(false);
          }}
          className={`p-2 rounded-xl transition-all flex flex-col items-center gap-0.5 ${
            currentTool === 'select'
              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="أداة التحديد: اختيار العناصر وتحريكها وتغيير حجمها"
        >
          <MousePointer className="w-4 h-4" />
          <span className="text-[10px] font-bold">تحديد</span>
        </button>

        {/* تحريك */}
        <button
          type="button"
          onClick={() => {
            onSelectTool('pan');
            setShowColorPopover(false);
            setShowShapePopover(false);
          }}
          className={`p-2 rounded-xl transition-all flex flex-col items-center gap-0.5 ${
            currentTool === 'pan'
              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="أداة التحريك: سحب مساحة السبورة والتنقل بحرية"
        >
          <Hand className="w-4 h-4" />
          <span className="text-[10px] font-bold">تحريك</span>
        </button>

        {/* القلم (with color & width trigger) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (currentTool === 'pen') {
                setShowColorPopover(!showColorPopover);
              } else {
                onSelectTool('pen');
              }
              setShowShapePopover(false);
            }}
            disabled={!canDraw}
            className={`p-2 rounded-xl transition-all flex flex-col items-center gap-0.5 ${
              currentTool === 'pen'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="القلم: اضغط للاختيار أو لتغيير اللون والسمك"
          >
            <div className="relative flex items-center justify-center">
              <Pen className="w-4 h-4" />
              <span
                className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full border border-white"
                style={{ backgroundColor: currentColor }}
              />
            </div>
            <span className="text-[10px] font-bold">قلم</span>
          </button>

          {/* Pen Color & Width Popover */}
          {showColorPopover && (
            <div className="absolute bottom-14 right-0 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-2">
                سماكة القلم
              </div>
              <div className="flex items-center gap-2 mb-3">
                {STROKE_WIDTHS.map((sw) => (
                  <button
                    key={sw.width}
                    type="button"
                    onClick={() => onChangeStrokeWidth(sw.width)}
                    className={`flex-1 py-1.5 px-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                      strokeWidth === sw.width
                        ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span
                      className="rounded-full bg-slate-800 dark:bg-slate-100"
                      style={{ width: sw.width * 2, height: sw.width * 2 }}
                    />
                    <span>{sw.label}</span>
                  </button>
                ))}
              </div>

              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-2">
                ألوان القلم
              </div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {PALETTE_COLORS.map((p) => (
                  <button
                    key={p.color}
                    type="button"
                    onClick={() => onChangeColor(p.color)}
                    className={`h-7 rounded-lg flex items-center justify-center border transition-transform ${
                      currentColor === p.color
                        ? 'scale-110 ring-2 ring-emerald-500 ring-offset-1'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: p.color }}
                    title={p.label}
                  >
                    {currentColor === p.color && (
                      <Check
                        className={`w-3.5 h-3.5 ${
                          p.color === '#ffffff' ? 'text-black' : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Color Input */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 font-medium">لون مخصص:</span>
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => onChangeColor(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border-0 p-0"
                />
              </div>
            </div>
          )}
        </div>

        {/* تمييز (Highlighter) */}
        <button
          type="button"
          onClick={() => {
            onSelectTool('highlighter');
            setShowColorPopover(false);
            setShowShapePopover(false);
          }}
          disabled={!canDraw}
          className={`p-2 rounded-xl transition-all flex flex-col items-center gap-0.5 ${
            currentTool === 'highlighter'
              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="قلم التمييز: تظليل شفاف على الكلمات والآيات"
        >
          <Highlighter className="w-4 h-4 text-amber-500 dark:text-amber-300" />
          <span className="text-[10px] font-bold">تمييز</span>
        </button>

        {/* ممحاة مع درجات الحجم */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (currentTool === 'eraser') {
                setShowEraserPopover(!showEraserPopover);
              } else {
                onSelectTool('eraser');
                setShowEraserPopover(true);
              }
              setShowColorPopover(false);
              setShowShapePopover(false);
              setShowBackgroundPopover(false);
            }}
            disabled={!canDraw}
            className={`p-2 rounded-xl transition-all flex flex-col items-center gap-0.5 relative ${
              currentTool === 'eraser'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="الممحاة: اضغط لتحديد حجم ودرجة الممحاة (صغيرة، متوسطة، كبيرة)"
          >
            <Eraser className="w-4 h-4" />
            <span className="text-[10px] font-bold flex items-center gap-0.5">
              <span>ممحاة</span>
              <span className="text-[8px] opacity-75">({strokeWidth}px)</span>
            </span>
          </button>

          {/* Eraser Size Popover */}
          {showEraserPopover && (
            <div className="absolute bottom-14 right-0 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100 mb-2.5">
                <span>حجم ودرجة الممحاة</span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                  {strokeWidth} px
                </span>
              </div>

              {/* Preset Sizes */}
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {ERASER_SIZES.map((item) => (
                  <button
                    key={item.width}
                    type="button"
                    onClick={() => {
                      onChangeStrokeWidth(item.width);
                      onSelectTool('eraser');
                    }}
                    className={`p-2 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                      strokeWidth === item.width
                        ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{item.label}</span>
                    <div
                      className="rounded-full bg-slate-700 dark:bg-slate-200"
                      style={{
                        width: `${Math.min(20, Math.max(6, item.width / 4))}px`,
                        height: `${Math.min(20, Math.max(6, item.width / 4))}px`,
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Range Slider for custom size */}
              <div className="flex flex-col gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                  <span>دقيق (8px)</span>
                  <span>عريض جداً (120px)</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="120"
                  value={strokeWidth}
                  onChange={(e) => {
                    onChangeStrokeWidth(Number(e.target.value));
                    if (currentTool !== 'eraser') onSelectTool('eraser');
                  }}
                  className="w-full accent-emerald-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* نص */}
        <button
          type="button"
          onClick={() => {
            if (currentTool === 'text') {
              onSelectTool('select');
            } else {
              onSelectTool('text');
            }
            setShowColorPopover(false);
            setShowShapePopover(false);
            setShowEraserPopover(false);
          }}
          disabled={!canDraw}
          className={`p-2 rounded-xl transition-all flex flex-col items-center gap-0.5 ${
            currentTool === 'text'
              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="أداة النص: انقر لإضافة نص وتعديل حجمه ولونه"
        >
          <Type className="w-4 h-4" />
          <span className="text-[10px] font-bold">نص</span>
        </button>

        {/* الأشكال (Shapes Dropdown) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowShapePopover(!showShapePopover);
              setShowColorPopover(false);
              setShowEraserPopover(false);
            }}
            disabled={!canDraw}
            className={`p-2 rounded-xl transition-all flex flex-col items-center gap-0.5 ${
              isShapeTool
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="الأشكال الهندسية: خط، سهم، مستطيل، مربع، دائرة، مثلث، نجمة"
          >
            {currentTool === 'line' && <Minus className="w-4 h-4" />}
            {currentTool === 'dashed_line' && <Minus className="w-4 h-4 text-slate-500 stroke-dashed" />}
            {currentTool === 'arrow' && <ArrowUpRight className="w-4 h-4" />}
            {currentTool === 'double_arrow' && <MoveHorizontal className="w-4 h-4" />}
            {(currentTool === 'rect' || currentTool === 'square') && <Square className="w-4 h-4" />}
            {currentTool === 'circle' && <Circle className="w-4 h-4" />}
            {currentTool === 'ellipse' && <CircleDot className="w-4 h-4" />}
            {currentTool === 'triangle' && <Triangle className="w-4 h-4" />}
            {currentTool === 'star' && <Star className="w-4 h-4 fill-yellow-400 text-yellow-500" />}
            {currentTool === 'rhombus' && <Diamond className="w-4 h-4" />}
            {currentTool === 'hexagon' && <Hexagon className="w-4 h-4" />}
            {currentTool === 'arc' && <Spline className="w-4 h-4" />}
            {currentTool === 'heart' && <Heart className="w-4 h-4 fill-red-500 text-red-500" />}
            {currentTool === 'checkmark' && <Check className="w-4 h-4 text-emerald-600" />}
            {currentTool === 'cross' && <XIcon className="w-4 h-4 text-rose-500" />}
            {!isShapeTool && <Shapes className="w-4 h-4" />}
            <span className="text-[10px] font-bold flex items-center gap-0.5">
              <span>{getShapeLabel(currentTool)}</span>
              <ChevronUp className="w-2.5 h-2.5 opacity-70" />
            </span>
          </button>

          {/* Shapes Selection Menu */}
          {showShapePopover && (
            <div className="absolute bottom-14 right-0 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-96 overflow-y-auto custom-scrollbar">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-2 px-1 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span>الأشكال والرموز (16 شكلاً)</span>
                <span className="text-[10px] text-emerald-600 font-semibold">انقر أو اسحب للرسم</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {/* 1. Line */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTool('line');
                    setShowShapePopover(false);
                  }}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                    currentTool === 'line'
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Minus className="w-4 h-4 text-blue-500" />
                  <span>خط مستقيم</span>
                </button>

                {/* 2. Dashed Line */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTool('dashed_line');
                    setShowShapePopover(false);
                  }}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                    currentTool === 'dashed_line'
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Minus className="w-4 h-4 text-slate-500 stroke-dashed" />
                  <span>خط متقطع</span>
                </button>

                {/* 3. Arrow */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTool('arrow');
                    setShowShapePopover(false);
                  }}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                    currentTool === 'arrow'
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-indigo-500" />
                  <span>سهم توجيه</span>
                </button>

                {/* 4. Double Arrow */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTool('double_arrow');
                    setShowShapePopover(false);
                  }}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                    currentTool === 'double_arrow'
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <MoveHorizontal className="w-4 h-4 text-cyan-600" />
                  <span>سهم اتجاهين</span>
                </button>

                {/* 5. Rect */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTool('rect');
                    setShowShapePopover(false);
                  }}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                    currentTool === 'rect'
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Square className="w-4 h-4 text-amber-500" />
                  <span>مستطيل</span>
                </button>

                {/* 6. Square */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTool('square');
                    setShowShapePopover(false);
                  }}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                    currentTool === 'square'
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Square className="w-4 h-4 text-orange-500" />
                  <span>مربع</span>
                </button>

                {/* 7. Circle */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTool('circle');
                    setShowShapePopover(false);
                  }}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                    currentTool === 'circle'
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Circle className="w-4 h-4 text-emerald-500" />
                  <span>دائرة</span>
                </button>

                {/* 8. Ellipse */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTool('ellipse');
                    setShowShapePopover(false);
                  }}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                    currentTool === 'ellipse'
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CircleDot className="w-4 h-4 text-teal-600" />
                  <span>بيضاوي</span>
                </button>

                {/* 9. Triangle */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTool('triangle');
                    setShowShapePopover(false);
                  }}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                    currentTool === 'triangle'
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Triangle className="w-4 h-4 text-purple-500" />
                  <span>مثلث</span>
                </button>

                {/* 10. Star */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTool('star');
                    setShowShapePopover(false);
                  }}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                    currentTool === 'star'
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                  <span>نجمة</span>
                </button>

                {/* 11. Rhombus */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTool('rhombus');
                    setShowShapePopover(false);
                  }}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                    currentTool === 'rhombus'
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Diamond className="w-4 h-4 text-rose-500" />
                  <span>معين</span>
                </button>

                {/* 12. Hexagon */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTool('hexagon');
                    setShowShapePopover(false);
                  }}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                    currentTool === 'hexagon'
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Hexagon className="w-4 h-4 text-violet-500" />
                  <span>سداسي</span>
                </button>

                {/* 13. Arc */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTool('arc');
                    setShowShapePopover(false);
                  }}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                    currentTool === 'arc'
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Spline className="w-4 h-4 text-sky-500" />
                  <span>قوس منحني</span>
                </button>

                {/* 14. Heart */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTool('heart');
                    setShowShapePopover(false);
                  }}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                    currentTool === 'heart'
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  <span>قلب</span>
                </button>

                {/* 15. Checkmark */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTool('checkmark');
                    setShowShapePopover(false);
                  }}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                    currentTool === 'checkmark'
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>علامة صح</span>
                </button>

                {/* 16. Cross */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTool('cross');
                    setShowShapePopover(false);
                  }}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                    currentTool === 'cross'
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <XIcon className="w-4 h-4 text-rose-500 stroke-[3]" />
                  <span>علامة خطأ</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* إضافة صورة */}
        <button
          type="button"
          onClick={onUploadImage}
          disabled={!canDraw}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex flex-col items-center gap-0.5"
          title="إضافة صورة من الجهاز (PNG, JPG, WEBP)"
        >
          <ImageIcon className="w-4 h-4 text-emerald-600" />
          <span className="text-[10px] font-bold">صورة</span>
        </button>

        {/* إضافة PDF */}
        <button
          type="button"
          onClick={onOpenPdfModal}
          disabled={!canDraw}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex flex-col items-center gap-0.5"
          title="إضافة وتصفح ملف PDF وإدراج صفحاته للشرح"
        >
          <FileText className="w-4 h-4 text-red-600" />
          <span className="text-[10px] font-bold">PDF</span>
        </button>

        {/* نظام الاحتفال والتشجيع (Celebration & Motivation) */}
        {onOpenMotivationModal && (
          <button
            type="button"
            onClick={onOpenMotivationModal}
            className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/80 hover:bg-amber-100 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 transition-all flex flex-col items-center gap-0.5 shadow-2xs hover:shadow-xs active:scale-95"
            title="نظام التشجيع والاحتفال للطلاب: كؤوس، ميداليات، أوسمة، أصوات تفوق وتصفيق"
          >
            <Trophy className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span className="text-[10px] font-bold whitespace-nowrap text-amber-800 dark:text-amber-200">تشجيع</span>
          </button>
        )}

        {/* ألعاب وتحديات الفصل التفاعلية (Class Games) */}
        {onOpenClassGamesModal && (
          <button
            type="button"
            onClick={onOpenClassGamesModal}
            className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-100 transition-all flex flex-col items-center gap-0.5 shadow-2xs hover:shadow-xs active:scale-95"
            title="ألعاب ومسابقات تفاعلية: عجلة الحظ، من سيربح المليون، الكلمة المفقودة"
          >
            <Dices className="w-4 h-4 text-indigo-600" />
            <span className="text-[10px] font-bold whitespace-nowrap text-indigo-800 dark:text-indigo-200">ألعاب</span>
          </button>
        )}

        {/* المسار السري للحلقة (Reveal Path) */}
        {onToggleRevealPath && (
          <button
            type="button"
            onClick={onToggleRevealPath}
            className={`p-2 rounded-xl transition-all flex flex-col items-center gap-0.5 shadow-2xs hover:shadow-xs active:scale-95 ${
              isRevealPathOpen
                ? 'bg-purple-600 text-white shadow-md border border-purple-500 ring-2 ring-purple-400/40'
                : 'bg-purple-50 dark:bg-purple-950/80 hover:bg-purple-100 dark:hover:bg-purple-900 border border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-100'
            }`}
            title="المسار السري للحلقة: إعداد الدرس على مراحل مخفية وكشفها تدريجيًا للطلاب بالتزامن اللحظي"
          >
            <Layers className={`w-4 h-4 ${isRevealPathOpen ? 'text-white' : 'text-purple-600 dark:text-purple-300'}`} />
            <span className={`text-[10px] font-bold whitespace-nowrap ${isRevealPathOpen ? 'text-white' : 'text-purple-800 dark:text-purple-200'}`}>
              المسار السري
            </span>
          </button>
        )}
      </div>

      <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

      {/* 3. Zoom, Background, Focus Mode, Save Board */}
      <div className="flex items-center gap-1">
        {/* تكبير */}
        <button
          type="button"
          onClick={onZoomIn}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex flex-col items-center gap-0.5"
          title="تكبير المشهد (+)"
        >
          <ZoomIn className="w-4 h-4" />
          <span className="text-[10px] font-bold">تكبير</span>
        </button>

        {/* تصغير */}
        <button
          type="button"
          onClick={onZoomOut}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex flex-col items-center gap-0.5"
          title="تصغير المشهد (−)"
        >
          <ZoomOut className="w-4 h-4" />
          <span className="text-[10px] font-bold">تصغير</span>
        </button>

        {/* إعادة ضبط العرض */}
        <button
          type="button"
          onClick={onResetZoom}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex flex-col items-center gap-0.5"
          title="إعادة ضبط العرض إلى 100% والموقع الأصلي"
        >
          <ResetIcon className="w-4 h-4" />
          <span className="text-[10px] font-bold">{Math.round(zoom * 100)}%</span>
        </button>

        {/* الخلفية (Background Selector Popover) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowBackgroundPopover(!showBackgroundPopover);
              setShowColorPopover(false);
              setShowShapePopover(false);
            }}
            disabled={!canDraw}
            className={`p-2 rounded-xl transition-all flex flex-col items-center gap-0.5 ${
              showBackgroundPopover
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="تغيير خلفية السبورة (سادة، شبكية، مسطرة، كشكول، نقاط...)"
          >
            <Palette className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-bold">الخلفية</span>
          </button>

          {/* Background Choices Popover */}
          {showBackgroundPopover && (
            <div className="absolute bottom-14 left-0 sm:right-auto sm:left-0 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-2">
                اختر خلفية السبورة
              </div>
              <div className="grid grid-cols-2 gap-2">
                {BACKGROUND_OPTIONS.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => {
                      onChangeBackground(bg.id);
                      setShowBackgroundPopover(false);
                    }}
                    className={`p-2 rounded-xl border text-right transition-all flex flex-col gap-1 ${
                      background === bg.id
                        ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-full h-8 rounded-lg ${bg.iconBg}`} />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {bg.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* إخفاء الأدوات (Focus Mode) */}
        <button
          type="button"
          onClick={onHideTools}
          className="p-2 rounded-xl text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-colors flex flex-col items-center gap-0.5"
          title="إخفاء الأدوات والانتقال لوضع التركيز"
        >
          <EyeOff className="w-4 h-4" />
          <span className="text-[10px] font-bold whitespace-nowrap">إخفاء الأدوات</span>
        </button>

        {/* حفظ اللوحة */}
        <button
          type="button"
          onClick={onSaveBoard}
          className="p-2 rounded-xl text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors flex flex-col items-center gap-0.5"
          title="حفظ اللوحة الحالية في جهازك"
        >
          <Save className="w-4 h-4" />
          <span className="text-[10px] font-bold whitespace-nowrap">حفظ اللوحة</span>
        </button>

        {/* Creator Identity Credit Badge */}
        <div
          className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-100 font-bold text-xs shadow-2xs select-none mr-1"
          title="سبورة المستنير التعليمية - إعداد: إسراء عبدالستار"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span id="creator-identity-text">إعداد: إسراء عبدالستار</span>
        </div>
      </div>
    </div>
  );
};
