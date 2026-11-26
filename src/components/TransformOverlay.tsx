import React, { useState, useRef, useEffect } from 'react';
import { WhiteboardElement, Point } from '../types';
import { RotateCw, Trash2, Copy, Move, CornerDownRight, Lock, Unlock } from 'lucide-react';

interface TransformOverlayProps {
  element: WhiteboardElement;
  zoom: number;
  pan: { x: number; y: number };
  canEdit: boolean;
  onUpdate: (id: string, updated: Partial<WhiteboardElement>) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (element: WhiteboardElement) => void;
}

type HandleType = 'nw' | 'ne' | 'se' | 'sw' | 'rotate' | 'drag';

export const TransformOverlay: React.FC<TransformOverlayProps> = ({
  element,
  zoom,
  pan,
  canEdit,
  onUpdate,
  onDelete,
  onDuplicate,
}) => {
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);
  const [currentRotation, setCurrentRotation] = useState<number>(element.rotation || 0);

  // Sync external rotation changes
  useEffect(() => {
    setCurrentRotation(element.rotation || 0);
  }, [element.rotation]);

  // Compute bounding box in canvas coordinates
  let boxX = element.x;
  let boxY = element.y;
  let rawW = element.width !== undefined ? element.width : 120;
  let rawH = element.height !== undefined ? element.height : 100;

  if (rawW < 0) {
    boxX = boxX + rawW;
    rawW = Math.abs(rawW);
  }
  if (rawH < 0) {
    boxY = boxY + rawH;
    rawH = Math.abs(rawH);
  }

  let boxW = Math.max(18, rawW);
  let boxH = Math.max(18, rawH);

  if (element.points && element.points.length > 0) {
    const xs = element.points.map((p) => p.x);
    const ys = element.points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    boxX = minX;
    boxY = minY;
    boxW = Math.max(24, maxX - minX);
    boxH = Math.max(24, maxY - minY);
  }

  // Ref for tracking transformation start state
  const transformStateRef = useRef<{
    handle: HandleType;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
    initialRotation: number;
    initialPoints?: Point[];
    centerScreenX: number;
    centerScreenY: number;
  } | null>(null);

  // Screen coordinates
  const screenX = boxX * zoom + pan.x;
  const screenY = boxY * zoom + pan.y;
  const screenW = boxW * zoom;
  const screenH = boxH * zoom;
  const rotationDeg = currentRotation;

  const handlePointerDown = (e: React.PointerEvent, handle: HandleType) => {
    if (!canEdit) return;
    e.stopPropagation();
    e.preventDefault();

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const centerScreenX = screenX + screenW / 2;
    const centerScreenY = screenY + screenH / 2;

    transformStateRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialX: boxX,
      initialY: boxY,
      initialW: boxW,
      initialH: boxH,
      initialRotation: element.rotation || 0,
      initialPoints: element.points ? JSON.parse(JSON.stringify(element.points)) : undefined,
      centerScreenX,
      centerScreenY,
    };

    setActiveHandle(handle);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeHandle || !transformStateRef.current || !canEdit) return;
    e.stopPropagation();

    const {
      handle,
      startX,
      startY,
      initialX,
      initialY,
      initialW,
      initialH,
      initialRotation,
      initialPoints,
      centerScreenX,
      centerScreenY,
    } = transformStateRef.current;

    // 1. ROTATE HANDLE
    if (handle === 'rotate') {
      const radians = Math.atan2(e.clientY - centerScreenY, e.clientX - centerScreenX);
      let degrees = Math.round((radians * 180) / Math.PI) + 90; // +90 because handle is at top
      if (degrees < 0) degrees += 360;
      degrees = degrees % 360;

      // Snap to 45 degree increments if Shift is pressed
      if (e.shiftKey) {
        degrees = Math.round(degrees / 45) * 45;
      }

      setCurrentRotation(degrees);
      onUpdate(element.id, { rotation: degrees });
      return;
    }

    // 2. DRAG HANDLE
    if (handle === 'drag') {
      const dx = (e.clientX - startX) / zoom;
      const dy = (e.clientY - startY) / zoom;

      if (initialPoints && initialPoints.length > 0) {
        const updatedPoints = initialPoints.map((p) => ({
          x: Math.round(p.x + dx),
          y: Math.round(p.y + dy),
        }));
        onUpdate(element.id, { points: updatedPoints });
      } else {
        onUpdate(element.id, {
          x: Math.round(initialX + dx),
          y: Math.round(initialY + dy),
        });
      }
      return;
    }

    // 3. CORNER RESIZE HANDLES (nw, ne, se, sw)
    // Project delta into unrotated local coordinate system
    const rawDx = (e.clientX - startX) / zoom;
    const rawDy = (e.clientY - startY) / zoom;

    const rad = -((initialRotation * Math.PI) / 180);
    const localDx = rawDx * Math.cos(rad) - rawDy * Math.sin(rad);
    const localDy = rawDx * Math.sin(rad) + rawDy * Math.cos(rad);

    let newW = initialW;
    let newH = initialH;
    let newX = initialX;
    let newY = initialY;

    const minSize = 24;

    switch (handle) {
      case 'se': {
        newW = Math.max(minSize, Math.round(initialW + localDx));
        newH = Math.max(minSize, Math.round(initialH + localDy));
        break;
      }
      case 'sw': {
        const potentialW = Math.round(initialW - localDx);
        if (potentialW >= minSize) {
          newW = potentialW;
          newX = Math.round(initialX + localDx);
        }
        newH = Math.max(minSize, Math.round(initialH + localDy));
        break;
      }
      case 'ne': {
        newW = Math.max(minSize, Math.round(initialW + localDx));
        const potentialH = Math.round(initialH - localDy);
        if (potentialH >= minSize) {
          newH = potentialH;
          newY = Math.round(initialY + localDy);
        }
        break;
      }
      case 'nw': {
        const potentialW = Math.round(initialW - localDx);
        const potentialH = Math.round(initialH - localDy);
        if (potentialW >= minSize) {
          newW = potentialW;
          newX = Math.round(initialX + localDx);
        }
        if (potentialH >= minSize) {
          newH = potentialH;
          newY = Math.round(initialY + localDy);
        }
        break;
      }
    }

    // Scale points if freehand stroke
    if (initialPoints && initialPoints.length > 0) {
      const scaleX = newW / (initialW || 1);
      const scaleY = newH / (initialH || 1);
      const updatedPoints = initialPoints.map((p) => ({
        x: Math.round(newX + (p.x - initialX) * scaleX),
        y: Math.round(newY + (p.y - initialY) * scaleY),
      }));
      onUpdate(element.id, { points: updatedPoints });
    } else {
      onUpdate(element.id, {
        x: newX,
        y: newY,
        width: newW,
        height: newH,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeHandle) {
      const target = e.currentTarget as HTMLElement;
      try {
        target.releasePointerCapture(e.pointerId);
      } catch {}
      setActiveHandle(null);
      transformStateRef.current = null;
    }
  };

  // Quick 90 deg rotation
  const handleQuickRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextRot = ((element.rotation || 0) + 90) % 360;
    setCurrentRotation(nextRot);
    onUpdate(element.id, { rotation: nextRot });
  };

  // Duplicate element
  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDuplicate) {
      onDuplicate(element);
    }
  };

  // Handle styles helper
  const handleCircleStyle =
    'w-4 h-4 sm:w-5 sm:h-5 bg-white border-2 border-emerald-600 rounded-full shadow-lg flex items-center justify-center pointer-events-auto touch-none select-none transition-transform active:scale-125 hover:scale-110';

  return (
    <div
      className="absolute pointer-events-none z-30"
      style={{
        left: `${screenX}px`,
        top: `${screenY}px`,
        width: `${screenW}px`,
        height: `${screenH}px`,
        transform: `rotate(${rotationDeg}deg)`,
        transformOrigin: 'center center',
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Outer Selection Bounding Box */}
      <div
        className={`absolute inset-0 border-2 rounded-xs shadow-xs pointer-events-none transition-colors ${
          element.isLocked
            ? 'border-amber-500 border-solid bg-amber-500/5'
            : 'border-emerald-600 border-dashed'
        }`}
        style={{
          boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.7)',
        }}
      />

      {/* Locked Badge Indicator */}
      {element.isLocked && (
        <div className="absolute top-1 right-1 bg-amber-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm pointer-events-none z-10">
          <Lock className="w-3 h-3" />
          <span>مقفل</span>
        </div>
      )}

      {/* Center Drag Surface (when hovering inside box) - Disabled if element is locked or text */}
      {canEdit && !element.isLocked && element.tool !== 'text' && (
        <div
          className="absolute inset-2 cursor-move active:cursor-grabbing pointer-events-auto"
          title="اسحب لتحريك العنصر في أي مكان"
          onPointerDown={(e) => handlePointerDown(e, 'drag')}
        />
      )}

      {/* Top Rotation Guideline & Handle - Disabled if locked */}
      {canEdit && !element.isLocked && (
        <>
          {/* Vertical stem line */}
          <div className="absolute left-1/2 -top-6 -translate-x-1/2 w-0.5 h-6 bg-emerald-600 pointer-events-none" />

          {/* Rotation knob */}
          <div
            className="absolute left-1/2 -top-11 -translate-x-1/2 w-8 h-8 bg-white dark:bg-slate-900 border-2 border-emerald-600 text-emerald-700 dark:text-emerald-400 rounded-full shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing pointer-events-auto touch-none hover:scale-110 transition-transform"
            title="أمسك ودوّر بالماوس أو اللمس (اضغط Shift للتدوير بزوايا 45°)"
            onPointerDown={(e) => handlePointerDown(e, 'rotate')}
          >
            <RotateCw className="w-4 h-4" />
          </div>

          {/* Live angle badge during rotation */}
          {activeHandle === 'rotate' && (
            <div className="absolute left-1/2 -top-18 -translate-x-1/2 px-2 py-0.5 bg-emerald-800 text-white text-[11px] font-bold rounded-md shadow-lg whitespace-nowrap pointer-events-none">
              {Math.round(rotationDeg)}°
            </div>
          )}
        </>
      )}

      {/* Floating Action Menu above the element */}
      {canEdit && !activeHandle && (
        <div
          className="absolute -top-12 right-0 bg-white/95 dark:bg-slate-850/95 border border-slate-300 dark:border-slate-700 shadow-xl rounded-xl px-2 py-1 flex items-center gap-1.5 pointer-events-auto text-xs z-40 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-100"
          dir="rtl"
        >
          {/* قفل / فتح العنصر */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(element.id, { isLocked: !element.isLocked });
            }}
            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
              element.isLocked
                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 font-bold hover:bg-amber-200'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
            title={element.isLocked ? 'إلغاء قفل العنصر' : 'قفل العنصر لمنع التعديل أو الحذف'}
          >
            {element.isLocked ? (
              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
            <span className="text-[10px] font-bold">
              {element.isLocked ? 'إلغاء القفل' : 'قفل'}
            </span>
          </button>

          {!element.isLocked && (
            <>
              {/* تغيير لون الشكل */}
              <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-700">
                {['#0f172a', '#16a34a', '#2563eb', '#dc2626', '#d97706'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onUpdate(element.id, { color: c })}
                    className={`w-3.5 h-3.5 rounded-full transition-transform ${
                      element.color === c ? 'scale-125 ring-1.5 ring-emerald-500' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                    title="تغيير لون الشكل"
                  />
                ))}
              </div>

              {/* سمك الحدود */}
              <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-700">
                {[2, 4, 8].map((sw) => (
                  <button
                    key={sw}
                    type="button"
                    onClick={() => onUpdate(element.id, { strokeWidth: sw })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      element.strokeWidth === sw
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                    title={`سمك الحدود ${sw}px`}
                  >
                    {sw}
                  </button>
                ))}
              </div>

              {/* تدوير 90 درجة */}
              <button
                type="button"
                onClick={handleQuickRotate}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                title="تدوير +90 درجة"
              >
                <RotateCw className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-bold hidden sm:inline">90°</span>
              </button>

              {/* تكرار العنصر */}
              {onDuplicate && (
                <button
                  type="button"
                  onClick={handleDuplicate}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                  title="نسخ وتكرار هذا العنصر"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[10px] font-bold hidden sm:inline">تكرار</span>
                </button>
              )}

              {/* حذف العنصر */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(element.id);
                }}
                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950 text-red-600 transition-colors flex items-center gap-1"
                title="حذف العنصر"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold hidden sm:inline">حذف</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* FOUR CORNER RESIZE HANDLES - Disabled if locked */}
      {canEdit && !element.isLocked && (
        <>
          {/* Top-Left Handle (NW) */}
          <div
            className={`absolute -top-2.5 -left-2.5 cursor-nwse-resize ${handleCircleStyle}`}
            title="سحب لتغيير الحجم"
            onPointerDown={(e) => handlePointerDown(e, 'nw')}
          >
            <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
          </div>

          {/* Top-Right Handle (NE) */}
          <div
            className={`absolute -top-2.5 -right-2.5 cursor-nesw-resize ${handleCircleStyle}`}
            title="سحب لتغيير الحجم"
            onPointerDown={(e) => handlePointerDown(e, 'ne')}
          >
            <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
          </div>

          {/* Bottom-Left Handle (SW) */}
          <div
            className={`absolute -bottom-2.5 -left-2.5 cursor-nesw-resize ${handleCircleStyle}`}
            title="سحب لتغيير الحجم"
            onPointerDown={(e) => handlePointerDown(e, 'sw')}
          >
            <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
          </div>

          {/* Bottom-Right Handle (SE) */}
          <div
            className={`absolute -bottom-2.5 -right-2.5 cursor-nwse-resize ${handleCircleStyle}`}
            title="سحب لتغيير الحجم"
            onPointerDown={(e) => handlePointerDown(e, 'se')}
          >
            <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
          </div>
        </>
      )}
    </div>
  );
};
