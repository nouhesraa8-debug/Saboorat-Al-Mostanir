import React, { useState, useRef, useEffect } from 'react';
import { WhiteboardElement } from '../types';
import { Trash2, Move, Palette } from 'lucide-react';

interface StickyNoteItemProps {
  element: WhiteboardElement;
  isSelected: boolean;
  canEdit: boolean;
  onUpdate: (updated: Partial<WhiteboardElement>) => void;
  onDelete: () => void;
  onSelect: () => void;
  zoom: number;
  pan: { x: number; y: number };
}

const NOTE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  yellow: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-950' },
  green: { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-950' },
  pink: { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-950' },
  blue: { bg: 'bg-sky-100', border: 'border-sky-300', text: 'text-sky-950' },
  purple: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-950' },
};

export const StickyNoteItem: React.FC<StickyNoteItemProps> = ({
  element,
  isSelected,
  canEdit,
  onUpdate,
  onDelete,
  onSelect,
  zoom,
  pan,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });

  const noteColorKey = element.noteColor || 'yellow';
  const colorTheme = NOTE_COLORS[noteColorKey] || NOTE_COLORS.yellow;

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

  const screenX = element.x * zoom + pan.x;
  const screenY = element.y * zoom + pan.y;
  const noteWidth = (element.width || 180) * zoom;
  const noteHeight = (element.height || 140) * zoom;

  return (
    <div
      className={`absolute select-none shadow-md rounded-xl p-2.5 flex flex-col border-2 transition-shadow ${colorTheme.bg} ${colorTheme.border} ${
        isSelected ? 'ring-2 ring-emerald-600 ring-offset-1' : ''
      }`}
      style={{
        left: `${screenX}px`,
        top: `${screenY}px`,
        width: `${noteWidth}px`,
        height: `${noteHeight}px`,
        transform: `rotate(${element.rotation || 0}deg)`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Header with Drag Handle, Color changer, and Delete */}
      <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-black/10">
        <div
          className="p-1 rounded cursor-grab active:cursor-grabbing hover:bg-black/5 flex items-center gap-1 text-xs"
          onPointerDown={(e) => {
            if (!canEdit) return;
            e.stopPropagation();
            setIsDragging(true);
            dragStartRef.current = {
              startX: e.clientX,
              startY: e.clientY,
              initX: element.x,
              initY: element.y,
            };
            onSelect();
          }}
        >
          <Move className="w-3.5 h-3.5 opacity-60" />
          <span className="text-[10px] font-semibold opacity-70">ملاحظة</span>
        </div>

        {canEdit && (
          <div className="flex items-center gap-1">
            {/* Color Cycler */}
            <button
              type="button"
              className="p-0.5 rounded hover:bg-black/10"
              title="تغيير لون الملاحظة"
              onClick={(e) => {
                e.stopPropagation();
                const colors = Object.keys(NOTE_COLORS);
                const nextIdx = (colors.indexOf(noteColorKey) + 1) % colors.length;
                onUpdate({ noteColor: colors[nextIdx] });
              }}
            >
              <Palette className="w-3 h-3 opacity-60" />
            </button>

            {/* Delete button */}
            <button
              type="button"
              className="p-0.5 rounded hover:bg-red-200/60 text-red-600"
              title="حذف الملاحظة"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Note Text Area */}
      <textarea
        value={element.text || ''}
        disabled={!canEdit}
        placeholder="اكتب ملاحظة هنا..."
        onChange={(e) => onUpdate({ text: e.target.value })}
        className={`w-full flex-1 bg-transparent resize-none focus:outline-none text-xs sm:text-sm font-medium leading-relaxed ${colorTheme.text}`}
        dir="auto"
      />
    </div>
  );
};
