import React, { useState, useRef, useEffect } from 'react';
import { WhiteboardElement } from '../types';
import {
  Trash2,
  Move,
  Bold,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Check,
  Edit3,
  Settings2,
  X,
  EyeOff,
} from 'lucide-react';

interface TextBoardItemProps {
  element: WhiteboardElement;
  isSelected: boolean;
  canEdit: boolean;
  onUpdate: (updated: Partial<WhiteboardElement>) => void;
  onDelete: () => void;
  onSelect: () => void;
  zoom: number;
  pan: { x: number; y: number };
}

const TEXT_COLORS = [
  '#0f172a', // أسود
  '#16a34a', // أخضر
  '#2563eb', // أزرق
  '#dc2626', // أحمر
  '#d97706', // ذهبي
  '#7c3aed', // بنفسجي
  '#ffffff', // أبيض
];

const PRESET_FONT_SIZES = [18, 24, 32, 42, 54];

export const TextBoardItem: React.FC<TextBoardItemProps> = ({
  element,
  isSelected,
  canEdit,
  onUpdate,
  onDelete,
  onSelect,
  zoom,
  pan,
}) => {
  // If text is default placeholder, enter edit mode immediately
  const [isEditing, setIsEditing] = useState(() => {
    return element.text === 'اكتب هنا...' || !element.text;
  });
  const [showFormatBar, setShowFormatBar] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging || !canEdit) return;
      const dx = (e.clientX - dragStartRef.current.startX) / zoom;
      const dy = (e.clientY - dragStartRef.current.startY) / zoom;
      onUpdate({
        x: Math.round(dragStartRef.current.initX + dx),
        y: Math.round(dragStartRef.current.initY + dy),
      });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, canEdit, zoom, onUpdate]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      if (element.text === 'اكتب هنا...') {
        textareaRef.current.select();
      }
    }
  }, [isEditing, element.text]);

  const screenX = element.x * zoom + pan.x;
  const screenY = element.y * zoom + pan.y;
  const currentFontSize = element.fontSize || 24;
  const scaledFontSize = currentFontSize * zoom;
  const isArabicQuran = element.text?.includes('﴿') || false;

  return (
    <div
      className={`absolute p-2 rounded-xl transition-all group select-text ${
        isSelected
          ? 'ring-1.5 ring-emerald-500 shadow-md'
          : 'hover:ring-1 hover:ring-slate-300'
      } ${
        element.fillBackground
          ? 'bg-white/90 dark:bg-slate-900/90 shadow-md backdrop-blur-xs'
          : 'bg-transparent'
      }`}
      style={{
        left: `${screenX}px`,
        top: `${screenY}px`,
        minWidth: '160px',
        maxWidth: '680px',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Sleek Floating Controls bar when selected or editing */}
      {canEdit && (isSelected || isEditing) && (
        <div
          className="absolute -top-11 right-0 flex flex-col items-end z-40 select-none"
          dir="rtl"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Mini Primary Actions Bar */}
          <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-300/90 dark:border-slate-700 shadow-lg rounded-2xl px-2 py-1 flex items-center gap-1 text-xs backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
            {/* Move handle */}
            <button
              type="button"
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-grab active:cursor-grabbing text-slate-700 dark:text-slate-200"
              title="تحريك مكان النص بالسحب"
              onPointerDown={(e) => {
                e.stopPropagation();
                setIsDragging(true);
                dragStartRef.current = {
                  startX: e.clientX,
                  startY: e.clientY,
                  initX: element.x,
                  initY: element.y,
                };
              }}
            >
              <Move className="w-3.5 h-3.5 text-emerald-600" />
            </button>

            <div className="h-3.5 w-[1px] bg-slate-200 dark:bg-slate-700" />

            {/* Toggle Settings Button (Show / Hide formatting options) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowFormatBar(!showFormatBar);
              }}
              className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition-colors text-[11px] ${
                showFormatBar
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
              title={showFormatBar ? 'إخفاء خيارات الخط والألوان' : 'إظهار خيارات الخط والألوان'}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{showFormatBar ? 'إخفاء الإعدادات' : 'إعدادات النص'}</span>
            </button>

            <div className="h-3.5 w-[1px] bg-slate-200 dark:bg-slate-700" />

            {/* Edit / Done Toggle */}
            {isEditing ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(false);
                }}
                className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 text-[11px] shadow-xs transition-colors"
                title="تثبيت النص"
              >
                <Check className="w-3 h-3" />
                <span>تثبيت</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="px-2 py-0.5 rounded-lg text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-bold flex items-center gap-1 text-[11px] transition-colors"
                title="تعديل الكتابة"
              >
                <Edit3 className="w-3 h-3" />
                <span>كتابة</span>
              </button>
            )}

            <div className="h-3.5 w-[1px] bg-slate-200 dark:bg-slate-700" />

            {/* Immediate Delete Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 px-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 hover:bg-red-600 hover:text-white text-red-600 dark:text-red-400 transition-colors flex items-center gap-1 font-bold text-[11px]"
              title="حذف هذا العنصر فوراً (أو اضغط زر Delete أو Backspace)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف</span>
            </button>

            <div className="h-3.5 w-[1px] bg-slate-200 dark:bg-slate-700" />

            {/* Deselect Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowFormatBar(false);
                setIsEditing(false);
              }}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 transition-colors"
              title="إغلاق خيارات النص وإلغاء التحديد"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Extended Formatting Bar (Appears on click of 'إعدادات النص') */}
          {showFormatBar && (
            <div
              className="mt-1 bg-white/95 dark:bg-slate-900/95 border border-slate-300 dark:border-slate-700 shadow-xl rounded-2xl p-1.5 flex flex-wrap items-center gap-1.5 text-xs backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Background transparency toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ fillBackground: !element.fillBackground });
                }}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                  element.fillBackground
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
                title={element.fillBackground ? 'الخلفية ملونة (انقر لجعلها شفافة)' : 'الخلفية شفافة (انقر لإضافة خلفية)'}
              >
                {element.fillBackground ? 'خلفية ملونة' : 'شفاف'}
              </button>

              <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700" />

              {/* Font Size decrease / current / increase */}
              <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                <button
                  type="button"
                  className="w-6 h-6 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center justify-center transition-colors"
                  title="تصغير الخط"
                  onClick={() => {
                    onUpdate({ fontSize: Math.max(14, currentFontSize - 3) });
                  }}
                >
                  A-
                </button>
                <span className="text-[10px] font-bold px-1 text-slate-600 dark:text-slate-300 min-w-6 text-center">
                  {currentFontSize}
                </span>
                <button
                  type="button"
                  className="w-6 h-6 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center justify-center transition-colors"
                  title="تكبير الخط"
                  onClick={() => {
                    onUpdate({ fontSize: Math.min(72, currentFontSize + 3) });
                  }}
                >
                  A+
                </button>
              </div>

              {/* Preset sizes */}
              <div className="hidden sm:flex items-center gap-0.5">
                {PRESET_FONT_SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => onUpdate({ fontSize: sz })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                      currentFontSize === sz
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700" />

              {/* Bold Toggle */}
              <button
                type="button"
                className={`p-1.5 rounded-lg transition-colors ${
                  element.isBold
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
                title="خط عريض"
                onClick={() => onUpdate({ isBold: !element.isBold })}
              >
                <Bold className="w-3.5 h-3.5" />
              </button>

              {/* Alignment */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  className={`p-1.5 rounded-lg transition-colors ${
                    (element.align || 'right') === 'right'
                      ? 'bg-slate-200 dark:bg-slate-700 text-emerald-700 dark:text-emerald-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                  title="محاذاة لليمين"
                  onClick={() => onUpdate({ align: 'right' })}
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className={`p-1.5 rounded-lg transition-colors ${
                    element.align === 'center'
                      ? 'bg-slate-200 dark:bg-slate-700 text-emerald-700 dark:text-emerald-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                  title="توسيط"
                  onClick={() => onUpdate({ align: 'center' })}
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className={`p-1.5 rounded-lg transition-colors ${
                    element.align === 'left'
                      ? 'bg-slate-200 dark:bg-slate-700 text-emerald-700 dark:text-emerald-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                  title="محاذاة لليسار"
                  onClick={() => onUpdate({ align: 'left' })}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700" />

              {/* Quick Colors */}
              <div className="flex items-center gap-1">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onUpdate({ color: c })}
                    className={`w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 transition-transform ${
                      element.color === c ? 'scale-125 ring-2 ring-emerald-500' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                    title={`تغيير اللون إلى ${c}`}
                  />
                ))}
              </div>

              <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700" />

              {/* Hide settings quick button */}
              <button
                type="button"
                onClick={() => setShowFormatBar(false)}
                className="px-1.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 text-[10px] font-bold flex items-center gap-1"
                title="إخفاء شريط الإعدادات"
              >
                <EyeOff className="w-3 h-3" />
                <span>إخفاء</span>
              </button>

              {/* Delete */}
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                title="حذف هذا النص"
                onClick={onDelete}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Editing textarea or rendered display */}
      {isEditing && canEdit ? (
        <div
          className="flex flex-col gap-1 w-full"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <textarea
            ref={textareaRef}
            value={element.text || ''}
            onChange={(e) => onUpdate({ text: e.target.value })}
            onFocus={(e) => {
              if (element.text === 'اكتب هنا...') {
                onUpdate({ text: '' });
              }
            }}
            placeholder="اكتب النص هنا..."
            rows={2}
            style={{
              fontSize: `${scaledFontSize}px`,
              color: element.color || '#0f172a',
              fontWeight: element.isBold ? 'bold' : 'normal',
              textAlign: element.align || 'right',
            }}
            className={`w-full min-h-[48px] bg-white/95 dark:bg-slate-900/95 border-2 border-emerald-500 rounded-xl p-2.5 resize-both focus:outline-none focus:ring-2 focus:ring-emerald-400 select-text shadow-md cursor-text ${
              isArabicQuran ? 'font-quran leading-loose' : 'font-sans'
            }`}
            dir="auto"
            autoFocus
          />
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-bold">
            <span className="text-emerald-700 dark:text-emerald-400">
              اكتب براحتك ثم اضغط «تثبيت النص»
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(false);
              }}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-transform"
            >
              تثبيت النص ✓
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (canEdit) {
              setIsEditing(true);
            }
          }}
          style={{
            fontSize: `${scaledFontSize}px`,
            color: element.color || '#0f172a',
            fontWeight: element.isBold ? 'bold' : 'normal',
            textAlign: element.align || 'right',
          }}
          className={`cursor-text whitespace-pre-wrap select-text break-words min-h-[32px] p-1.5 ${
            isArabicQuran ? 'font-quran leading-loose' : 'font-sans'
          } ${!element.text ? 'text-slate-400 italic' : ''}`}
          dir="auto"
          title="انقر نقراً مزدوجاً أو اضغط «تعديل» للكتابة"
        >
          {element.text || 'انقر للكتابة...'}
        </div>
      )}
    </div>
  );
};

