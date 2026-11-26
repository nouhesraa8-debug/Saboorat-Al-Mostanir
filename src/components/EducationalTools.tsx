import React, { useState, useRef, useEffect } from 'react';
import { RulerState, ProtractorState, CompassState, WhiteboardElement } from '../types';
import { RotateCw, X, Circle, Move } from 'lucide-react';

interface EducationalToolsProps {
  ruler: RulerState;
  setRuler: React.Dispatch<React.SetStateAction<RulerState>>;
  protractor: ProtractorState;
  setProtractor: React.Dispatch<React.SetStateAction<ProtractorState>>;
  compass: CompassState;
  setCompass: React.Dispatch<React.SetStateAction<CompassState>>;
  onDrawCompassCircle: (x: number, y: number, radius: number) => void;
  containerRect: DOMRect | null;
}

export const EducationalTools: React.FC<EducationalToolsProps> = ({
  ruler,
  setRuler,
  protractor,
  setProtractor,
  compass,
  setCompass,
  onDrawCompassCircle,
  containerRect,
}) => {
  // Dragging states
  const [activeDrag, setActiveDrag] = useState<'ruler' | 'ruler-rot' | 'protractor' | 'protractor-rot' | 'compass' | 'compass-radius' | null>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number; initAngle: number; initRadius: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
    initAngle: 0,
    initRadius: 0,
  });

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!activeDrag) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;

      if (activeDrag === 'ruler') {
        setRuler((prev) => ({
          ...prev,
          x: Math.max(10, dragStartRef.current.initX + dx),
          y: Math.max(10, dragStartRef.current.initY + dy),
        }));
      } else if (activeDrag === 'ruler-rot') {
        const center = {
          x: ruler.x + ruler.width / 2,
          y: ruler.y + ruler.height / 2,
        };
        const angle = Math.round((Math.atan2(e.clientY - center.y, e.clientX - center.x) * 180) / Math.PI);
        setRuler((prev) => ({ ...prev, angle }));
      } else if (activeDrag === 'protractor') {
        setProtractor((prev) => ({
          ...prev,
          x: Math.max(20, dragStartRef.current.initX + dx),
          y: Math.max(20, dragStartRef.current.initY + dy),
        }));
      } else if (activeDrag === 'protractor-rot') {
        const angle = Math.round((Math.atan2(e.clientY - protractor.y, e.clientX - protractor.x) * 180) / Math.PI);
        setProtractor((prev) => ({ ...prev, angle }));
      } else if (activeDrag === 'compass') {
        setCompass((prev) => ({
          ...prev,
          x: Math.max(20, dragStartRef.current.initX + dx),
          y: Math.max(20, dragStartRef.current.initY + dy),
        }));
      } else if (activeDrag === 'compass-radius') {
        const dist = Math.hypot(e.clientX - compass.x, e.clientY - compass.y);
        const radius = Math.max(30, Math.min(300, Math.round(dist)));
        setCompass((prev) => ({ ...prev, radius }));
      }
    };

    const handlePointerUp = () => {
      setActiveDrag(null);
    };

    if (activeDrag) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeDrag, ruler, protractor, compass, setRuler, setProtractor, setCompass]);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {/* 1. INTERACTIVE RULER */}
      {ruler.visible && (
        <div
          id="educational-ruler"
          className="absolute select-none pointer-events-auto shadow-xl rounded-md flex flex-col border border-amber-400/80 bg-gradient-to-b from-amber-100/90 via-amber-50/85 to-amber-100/90 backdrop-blur-xs text-amber-950 transition-shadow duration-150"
          style={{
            left: `${ruler.x}px`,
            top: `${ruler.y}px`,
            width: `${ruler.width}px`,
            height: `${ruler.height}px`,
            transform: `rotate(${ruler.angle}deg)`,
            transformOrigin: 'center center',
          }}
        >
          {/* Header Controls */}
          <div className="flex items-center justify-between px-2 py-0.5 bg-amber-200/60 border-b border-amber-300 text-xs">
            <div
              className="flex items-center gap-1 cursor-grab active:cursor-grabbing px-1.5 py-0.5 rounded bg-amber-300/60 font-semibold"
              onPointerDown={(e) => {
                e.stopPropagation();
                setActiveDrag('ruler');
                dragStartRef.current = {
                  startX: e.clientX,
                  startY: e.clientY,
                  initX: ruler.x,
                  initY: ruler.y,
                  initAngle: ruler.angle,
                  initRadius: 0,
                };
              }}
            >
              <Move className="w-3.5 h-3.5" />
              <span>مسطرة (30 سم)</span>
              <span className="text-[10px] text-amber-800 dir-ltr font-mono font-bold">({ruler.angle}°)</span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Rotate Handle */}
              <button
                type="button"
                className="p-1 rounded hover:bg-amber-300/80 cursor-ew-resize active:scale-95 text-amber-900"
                title="تدوير المسطرة"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setActiveDrag('ruler-rot');
                }}
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              {/* Close Handle */}
              <button
                type="button"
                className="p-1 rounded hover:bg-red-200 active:scale-95 text-red-700"
                title="إغلاق المسطرة"
                onClick={() => setRuler((p) => ({ ...p, visible: false }))}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Metric Marks (0cm to 30cm) */}
          <div className="relative flex-1 flex flex-col justify-end pb-0.5">
            <div className="w-full flex items-end justify-between px-2">
              {Array.from({ length: 31 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-[9px] font-mono font-bold leading-none mb-0.5">{i}</span>
                  <div className={`w-[1px] bg-amber-950 ${i % 5 === 0 ? 'h-3 bg-amber-900 font-bold' : 'h-1.5 opacity-60'}`} />
                </div>
              ))}
            </div>
            <div className="w-full border-t border-amber-950/70" />
          </div>
        </div>
      )}

      {/* 2. INTERACTIVE PROTRACTOR */}
      {protractor.visible && (
        <div
          id="educational-protractor"
          className="absolute select-none pointer-events-auto rounded-t-full shadow-2xl border-2 border-sky-400/80 bg-sky-100/80 backdrop-blur-xs text-sky-950 flex flex-col items-center justify-end"
          style={{
            left: `${protractor.x - protractor.radius}px`,
            top: `${protractor.y - protractor.radius}px`,
            width: `${protractor.radius * 2}px`,
            height: `${protractor.radius}px`,
            transform: `rotate(${protractor.angle}deg)`,
            transformOrigin: 'bottom center',
          }}
        >
          {/* Header Controls */}
          <div className="absolute top-2 flex items-center gap-2 bg-sky-200/90 px-2 py-0.5 rounded-full text-xs shadow-xs">
            <div
              className="flex items-center gap-1 cursor-grab active:cursor-grabbing font-bold text-sky-900"
              onPointerDown={(e) => {
                e.stopPropagation();
                setActiveDrag('protractor');
                dragStartRef.current = {
                  startX: e.clientX,
                  startY: e.clientY,
                  initX: protractor.x,
                  initY: protractor.y,
                  initAngle: protractor.angle,
                  initRadius: protractor.radius,
                };
              }}
            >
              <Move className="w-3 h-3" />
              <span>منقلة 180°</span>
              <span className="text-[10px] font-mono dir-ltr font-bold">({protractor.angle}°)</span>
            </div>
            <button
              type="button"
              className="p-0.5 rounded hover:bg-sky-300 text-sky-900"
              title="تدوير المنقلة"
              onPointerDown={(e) => {
                e.stopPropagation();
                setActiveDrag('protractor-rot');
              }}
            >
              <RotateCw className="w-3 h-3" />
            </button>
            <button
              type="button"
              className="p-0.5 rounded hover:bg-red-200 text-red-700"
              title="إغلاق المنقلة"
              onClick={() => setProtractor((p) => ({ ...p, visible: false }))}
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Protractor Radial Degree Ticks */}
          <svg className="w-full h-full absolute inset-0 overflow-visible" viewBox={`0 0 ${protractor.radius * 2} ${protractor.radius}`}>
            {Array.from({ length: 19 }).map((_, i) => {
              const deg = i * 10;
              const rad = (deg * Math.PI) / 180;
              const r1 = protractor.radius - 2;
              const r2 = protractor.radius - (deg % 30 === 0 ? 18 : 10);
              const x1 = protractor.radius - r1 * Math.cos(rad);
              const y1 = protractor.radius - r1 * Math.sin(rad);
              const x2 = protractor.radius - r2 * Math.cos(rad);
              const y2 = protractor.radius - r2 * Math.sin(rad);
              const tx = protractor.radius - (protractor.radius - 26) * Math.cos(rad);
              const ty = protractor.radius - (protractor.radius - 26) * Math.sin(rad);
              return (
                <g key={deg}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0369a1" strokeWidth={deg % 30 === 0 ? 1.5 : 1} />
                  {deg % 30 === 0 && (
                    <text x={tx} y={ty} fontSize="9" textAnchor="middle" fill="#075985" fontWeight="bold" fontFamily="monospace">
                      {deg}°
                    </text>
                  )}
                </g>
              );
            })}
            {/* Center Origin Mark */}
            <circle cx={protractor.radius} cy={protractor.radius} r="4" fill="#0284c7" />
            <line x1="0" y1={protractor.radius} x2={protractor.radius * 2} y2={protractor.radius} stroke="#0369a1" strokeWidth="1.5" />
          </svg>
        </div>
      )}

      {/* 3. INTERACTIVE COMPASS (الفرجار) */}
      {compass.visible && (
        <div
          id="educational-compass"
          className="absolute select-none pointer-events-auto flex items-center justify-center"
          style={{
            left: `${compass.x - compass.radius}px`,
            top: `${compass.y - compass.radius}px`,
            width: `${compass.radius * 2}px`,
            height: `${compass.radius * 2}px`,
          }}
        >
          {/* Compass guide circle */}
          <div className="w-full h-full rounded-full border-2 border-dashed border-emerald-500/80 bg-emerald-50/20 backdrop-blur-2xs flex items-center justify-center relative">
            {/* Center Pivot Point (Needle) */}
            <div
              className="w-5 h-5 rounded-full bg-emerald-600 border-2 border-white shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing text-white"
              title="سحب مركز الفرجار"
              onPointerDown={(e) => {
                e.stopPropagation();
                setActiveDrag('compass');
                dragStartRef.current = {
                  startX: e.clientX,
                  startY: e.clientY,
                  initX: compass.x,
                  initY: compass.y,
                  initAngle: compass.angle,
                  initRadius: compass.radius,
                };
              }}
            >
              <Move className="w-3 h-3" />
            </div>

            {/* Radius Edge Handle (Pencil tip) */}
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow-md flex items-center justify-center cursor-ew-resize active:scale-110"
              title="تعديل نصف القطر"
              onPointerDown={(e) => {
                e.stopPropagation();
                setActiveDrag('compass-radius');
              }}
            >
              <span className="text-[10px] text-white font-bold">✎</span>
            </div>

            {/* Compass action buttons */}
            <div className="absolute -top-10 flex items-center gap-1.5 bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full text-xs">
              <span className="font-bold text-emerald-800 dark:text-emerald-300">
                فرجار (نصف القطر: {compass.radius}px)
              </span>
              <button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2 py-0.5 rounded-full flex items-center gap-1 active:scale-95"
                onClick={() => onDrawCompassCircle(compass.x, compass.y, compass.radius)}
                title="رسم الدائرة على السبورة"
              >
                <Circle className="w-3 h-3" />
                <span>رسم دائرة</span>
              </button>
              <button
                type="button"
                className="text-slate-400 hover:text-red-500 p-0.5"
                title="إغلاق الفرجار"
                onClick={() => setCompass((p) => ({ ...p, visible: false }))}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
