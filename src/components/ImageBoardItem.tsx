import React, { useState, useRef, useEffect } from 'react';
import { WhiteboardElement } from '../types';
import { Trash2, Move, RotateCw } from 'lucide-react';

interface ImageBoardItemProps {
  element: WhiteboardElement;
  isSelected: boolean;
  canEdit: boolean;
  onUpdate: (updated: Partial<WhiteboardElement>) => void;
  onDelete: () => void;
  onSelect: () => void;
  zoom: number;
  pan: { x: number; y: number };
}

export const ImageBoardItem: React.FC<ImageBoardItemProps> = ({
  element,
  isSelected,
  canEdit,
  onUpdate,
  onDelete,
  onSelect,
  zoom,
  pan,
}) => {
  const [activeAction, setActiveAction] = useState<'drag' | 'resize' | 'rotate' | null>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number; initW: number; initH: number; initRot: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
    initW: 0,
    initH: 0,
    initRot: 0,
  });

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!activeAction || !canEdit) return;
      const dx = (e.clientX - dragStartRef.current.startX) / zoom;
      const dy = (e.clientY - dragStartRef.current.startY) / zoom;

      if (activeAction === 'drag') {
        onUpdate({
          x: Math.round(dragStartRef.current.initX + dx),
          y: Math.round(dragStartRef.current.initY + dy),
        });
      } else if (activeAction === 'resize') {
        const newW = Math.max(50, Math.round(dragStartRef.current.initW + dx));
        const newH = Math.max(50, Math.round(dragStartRef.current.initH + dy));
        onUpdate({ width: newW, height: newH });
      } else if (activeAction === 'rotate') {
        const center = {
          x: (element.x + (element.width || 200) / 2) * zoom + pan.x,
          y: (element.y + (element.height || 200) / 2) * zoom + pan.y,
        };
        const angle = Math.round((Math.atan2(e.clientY - center.y, e.clientX - center.x) * 180) / Math.PI);
        onUpdate({ rotation: angle });
      }
    };

    const handlePointerUp = () => {
      setActiveAction(null);
    };

    if (activeAction) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeAction, canEdit, zoom, pan, element, onUpdate]);

  const screenX = element.x * zoom + pan.x;
  const screenY = element.y * zoom + pan.y;
  const screenW = (element.width || 200) * zoom;
  const screenH = (element.height || 180) * zoom;

  return (
    <div
      className={`absolute select-none shadow-sm rounded-lg overflow-visible group ${
        isSelected ? 'ring-2 ring-emerald-500 ring-offset-2' : ''
      }`}
      style={{
        left: `${screenX}px`,
        top: `${screenY}px`,
        width: `${screenW}px`,
        height: `${screenH}px`,
        transform: `rotate(${element.rotation || 0}deg)`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* The Image itself */}
      <img
        src={element.imageUrl}
        alt="عنصر توضيحي"
        className="w-full h-full object-contain rounded-lg border border-slate-300 dark:border-slate-700 bg-white/40 pointer-events-none"
        referrerPolicy="no-referrer"
      />

      {/* Floating Toolbar for Image */}
      {canEdit && (isSelected || activeAction) && (
        <div className="absolute -top-9 right-0 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 shadow-md rounded-md p-0.5 flex items-center gap-1 z-10 text-xs">
          {/* Move handle */}
          <button
            type="button"
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-grab active:cursor-grabbing text-slate-700 dark:text-slate-200"
            title="تحريك الصورة"
            onPointerDown={(e) => {
              e.stopPropagation();
              setActiveAction('drag');
              dragStartRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                initX: element.x,
                initY: element.y,
                initW: element.width || 200,
                initH: element.height || 180,
                initRot: element.rotation || 0,
              };
            }}
          >
            <Move className="w-3.5 h-3.5" />
          </button>

          {/* Rotate handle */}
          <button
            type="button"
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-ew-resize text-slate-700 dark:text-slate-200"
            title="تدوير الصورة"
            onPointerDown={(e) => {
              e.stopPropagation();
              setActiveAction('rotate');
            }}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Delete handle */}
          <button
            type="button"
            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950 text-red-600"
            title="حذف الصورة"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Resize handle on bottom-right corner */}
      {canEdit && (isSelected || activeAction) && (
        <div
          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-emerald-600 border border-white rounded-full cursor-nwse-resize shadow-md"
          title="تغيير أبعاد الصورة"
          onPointerDown={(e) => {
            e.stopPropagation();
            setActiveAction('resize');
            dragStartRef.current = {
              startX: e.clientX,
              startY: e.clientY,
              initX: element.x,
              initY: element.y,
              initW: element.width || 200,
              initH: element.height || 180,
              initRot: element.rotation || 0,
            };
          }}
        />
      )}
    </div>
  );
};
