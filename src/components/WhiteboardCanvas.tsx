import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  WhiteboardElement,
  ToolType,
  BoardBackground,
  Point,
  RulerState,
  ProtractorState,
  CompassState,
  RemoteCursor,
  RevealPathState,
} from '../types';
import { backgroundStyles } from '../data/backgrounds';
import { TextBoardItem } from './TextBoardItem';
import { StickyNoteItem } from './StickyNoteItem';
import { ImageBoardItem } from './ImageBoardItem';
import { EducationalTools } from './EducationalTools';
import { TransformOverlay } from './TransformOverlay';
import { PageNavigationBar } from './PageNavigationBar';

interface WhiteboardCanvasProps {
  elements: WhiteboardElement[];
  onAddElement: (element: WhiteboardElement) => void;
  onUpdateElement: (id: string, updated: Partial<WhiteboardElement>) => void;
  onDeleteElement: (id: string) => void;
  currentTool: ToolType;
  currentColor: string;
  strokeWidth: number;
  background: BoardBackground;
  zoom: number;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number }) => void;
  canDraw: boolean;
  remoteCursors: RemoteCursor[];
  onCursorMove?: (x: number, y: number) => void;
  ruler: RulerState;
  setRuler: React.Dispatch<React.SetStateAction<RulerState>>;
  protractor: ProtractorState;
  setProtractor: React.Dispatch<React.SetStateAction<ProtractorState>>;
  compass: CompassState;
  setCompass: React.Dispatch<React.SetStateAction<CompassState>>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  selectedElementId?: string | null;
  onSelectElement?: (id: string | null) => void;
  currentPageIndex?: number;
  totalPages?: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  onAddNewPage?: () => void;
  onOpenPagesManager?: () => void;
  onSelectTool?: (tool: ToolType) => void;
  isTeacher?: boolean;
  revealPath?: RevealPathState;
  activeStageId?: string | null;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  elements,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  currentTool,
  currentColor,
  strokeWidth,
  background,
  zoom,
  pan,
  onPanChange,
  canDraw,
  remoteCursors,
  onCursorMove,
  ruler,
  setRuler,
  protractor,
  setProtractor,
  compass,
  setCompass,
  fileInputRef,
  selectedElementId: externalSelectedId,
  onSelectElement,
  currentPageIndex,
  totalPages,
  onPrevPage,
  onNextPage,
  onAddNewPage,
  onOpenPagesManager,
  onSelectTool,
  isTeacher = true,
  revealPath,
  activeStageId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const selectedElementId = externalSelectedId !== undefined ? externalSelectedId : internalSelectedId;
  const selectedElement = elements.find((e) => e.id === selectedElementId);

  // Secret Path visibility filter:
  // If the user is a student, only show elements whose stage has already been revealed (or unassigned elements).
  // Teachers always see all elements so they can prepare and preview them.
  const visibleElements = useMemo(() => {
    if (isTeacher) return elements;
    if (!revealPath?.enabled) return elements;
    const revealedStageIds = new Set(
      revealPath.stages.filter((s) => s.isRevealed).map((s) => s.id)
    );
    return elements.filter((el) => !el.stageId || revealedStageIds.has(el.stageId));
  }, [elements, isTeacher, revealPath]);

  const handleSelect = (id: string | null) => {
    setInternalSelectedId(id);
    if (onSelectElement) {
      onSelectElement(id);
    }
  };

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [currentDragPoint, setCurrentDragPoint] = useState<Point | null>(null);

  // Dragging selected element in 'select' mode
  const [isDraggingSelected, setIsDraggingSelected] = useState(false);
  const elementDragStartRef = useRef<{
    startX: number;
    startY: number;
    initialElement: WhiteboardElement;
  } | null>(null);

  // Pan dragging state with Space or Middle click or Pan tool
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dynamic cursor & pointer tracking
  const [pointerScreenPos, setPointerScreenPos] = useState<{ x: number; y: number } | null>(null);
  const [isHoveringElement, setIsHoveringElement] = useState(false);

  // Update canvas size (فقط عند تغيّر حجم الحاوية، وليس مع كل رسمة)
  const renderRef = useRef<() => void>(() => {});

  const updateCanvasDimensions = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    }
    renderRef.current();
  }, []);

  useEffect(() => {
    updateCanvasDimensions();
    const ro = new ResizeObserver(() => updateCanvasDimensions());
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }
    return () => ro.disconnect();
  }, [updateCanvasDimensions]);

  // Transform client coordinates to canvas space taking pan and zoom into account
  const getCanvasCoords = (clientX: number, clientY: number): Point => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;
    return {
      x: Math.round((rawX - pan.x) / zoom),
      y: Math.round((rawY - pan.y) / zoom),
    };
  };

  // Helper: check if a point is near an element for selection hit-testing
  const isPointNearElement = (point: Point, el: WhiteboardElement): boolean => {
    let checkPoint = point;
    if (el.rotation) {
      let cx = el.x + (el.width || 0) / 2;
      let cy = el.y + (el.height || 0) / 2;
      if (el.points && el.points.length > 0) {
        const xs = el.points.map((p) => p.x);
        const ys = el.points.map((p) => p.y);
        cx = (Math.min(...xs) + Math.max(...xs)) / 2;
        cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      }
      const rad = -((el.rotation * Math.PI) / 180);
      const dx = point.x - cx;
      const dy = point.y - cy;
      checkPoint = {
        x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
        y: cy + dx * Math.sin(rad) + dy * Math.cos(rad),
      };
    }

    if (el.points && el.points.length > 0) {
      const threshold = Math.max(14, (el.strokeWidth || 4) * 2);
      for (const p of el.points) {
        const dist = Math.hypot(p.x - checkPoint.x, p.y - checkPoint.y);
        if (dist <= threshold) return true;
      }
      return false;
    }

    const x = el.x;
    const y = el.y;
    const w = el.width ?? (el.tool === 'text' ? 180 : 80);
    const h = el.height ?? (el.tool === 'text' ? 60 : 80);

    const minX = Math.min(x, x + w) - 14;
    const maxX = Math.max(x, x + w) + 14;
    const minY = Math.min(y, y + h) - 14;
    const maxY = Math.max(y, y + h) + 14;

    return checkPoint.x >= minX && checkPoint.x <= maxX && checkPoint.y >= minY && checkPoint.y <= maxY;
  };

  // Draw single element on canvas context
  const drawElement = (ctx: CanvasRenderingContext2D, el: WhiteboardElement) => {
    ctx.save();
    ctx.strokeStyle = el.color;
    ctx.fillStyle = el.color;
    ctx.lineWidth = el.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (el.tool === 'highlighter') {
      ctx.globalAlpha = 0.35;
    }

    // Teacher indicator for unrevealed stage elements: render with subtle dashed pattern
    if (isTeacher && revealPath?.enabled && el.stageId) {
      const isStageHidden = revealPath.stages.some((s) => s.id === el.stageId && !s.isRevealed);
      if (isStageHidden) {
        ctx.setLineDash([5, 4]);
      }
    }

    // Apply rotation around element center
    if (el.rotation) {
      let cx = el.x + (el.width || 0) / 2;
      let cy = el.y + (el.height || 0) / 2;
      if (el.points && el.points.length > 0) {
        const xs = el.points.map((p) => p.x);
        const ys = el.points.map((p) => p.y);
        cx = (Math.min(...xs) + Math.max(...xs)) / 2;
        cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      }
      ctx.translate(cx, cy);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    switch (el.tool) {
      case 'pen':
      case 'pen_thin':
      case 'pen_thick':
      case 'highlighter': {
        if (el.points && el.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
          }
          ctx.stroke();
        } else if (el.points && el.points.length === 1) {
          ctx.beginPath();
          ctx.arc(el.points[0].x, el.points[0].y, el.strokeWidth / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      case 'line': {
        if (el.width !== undefined && el.height !== undefined) {
          ctx.beginPath();
          ctx.moveTo(el.x, el.y);
          ctx.lineTo(el.x + el.width, el.y + el.height);
          ctx.stroke();
        }
        break;
      }

      case 'dashed_line': {
        if (el.width !== undefined && el.height !== undefined) {
          ctx.save();
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.moveTo(el.x, el.y);
          ctx.lineTo(el.x + el.width, el.y + el.height);
          ctx.stroke();
          ctx.restore();
        }
        break;
      }

      case 'arrow': {
        if (el.width !== undefined && el.height !== undefined) {
          const startX = el.x;
          const startY = el.y;
          const endX = el.x + el.width;
          const endY = el.y + el.height;

          // Main line
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // Arrow head
          const angle = Math.atan2(endY - startY, endX - startX);
          const headLen = Math.max(12, el.strokeWidth * 3);
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - headLen * Math.cos(angle - Math.PI / 6),
            endY - headLen * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - headLen * Math.cos(angle + Math.PI / 6),
            endY - headLen * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }
        break;
      }

      case 'double_arrow': {
        if (el.width !== undefined && el.height !== undefined) {
          const startX = el.x;
          const startY = el.y;
          const endX = el.x + el.width;
          const endY = el.y + el.height;

          // Main line
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // End arrow head
          const angle = Math.atan2(endY - startY, endX - startX);
          const headLen = Math.max(12, el.strokeWidth * 3);
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - headLen * Math.cos(angle - Math.PI / 6),
            endY - headLen * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - headLen * Math.cos(angle + Math.PI / 6),
            endY - headLen * Math.sin(angle + Math.PI / 6)
          );
          // Start arrow head (reverse)
          ctx.moveTo(startX, startY);
          ctx.lineTo(
            startX + headLen * Math.cos(angle - Math.PI / 6),
            startY + headLen * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(startX, startY);
          ctx.lineTo(
            startX + headLen * Math.cos(angle + Math.PI / 6),
            startY + headLen * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }
        break;
      }

      case 'rect': {
        if (el.width !== undefined && el.height !== undefined) {
          ctx.strokeRect(el.x, el.y, el.width, el.height);
        }
        break;
      }

      case 'square': {
        if (el.width !== undefined && el.height !== undefined) {
          const side = Math.max(Math.abs(el.width), Math.abs(el.height));
          const w = el.width < 0 ? -side : side;
          const h = el.height < 0 ? -side : side;
          ctx.strokeRect(el.x, el.y, w, h);
        }
        break;
      }

      case 'circle': {
        if (el.width !== undefined && el.height !== undefined) {
          ctx.beginPath();
          const r = Math.min(Math.abs(el.width), Math.abs(el.height)) / 2;
          const cx = el.x + el.width / 2;
          const cy = el.y + el.height / 2;
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
      }

      case 'ellipse': {
        if (el.width !== undefined && el.height !== undefined) {
          ctx.beginPath();
          const rx = Math.abs(el.width) / 2;
          const ry = Math.abs(el.height) / 2;
          const cx = el.x + el.width / 2;
          const cy = el.y + el.height / 2;
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
      }

      case 'triangle': {
        if (el.width !== undefined && el.height !== undefined) {
          ctx.beginPath();
          ctx.moveTo(el.x + el.width / 2, el.y);
          ctx.lineTo(el.x + el.width, el.y + el.height);
          ctx.lineTo(el.x, el.y + el.height);
          ctx.closePath();
          ctx.stroke();
        }
        break;
      }

      case 'rhombus': {
        if (el.width !== undefined && el.height !== undefined) {
          const cx = el.x + el.width / 2;
          const cy = el.y + el.height / 2;
          ctx.beginPath();
          ctx.moveTo(cx, el.y);
          ctx.lineTo(el.x + el.width, cy);
          ctx.lineTo(cx, el.y + el.height);
          ctx.lineTo(el.x, cy);
          ctx.closePath();
          ctx.stroke();
        }
        break;
      }

      case 'hexagon': {
        if (el.width !== undefined && el.height !== undefined) {
          const cx = el.x + el.width / 2;
          const cy = el.y + el.height / 2;
          const rx = Math.abs(el.width) / 2;
          const ry = Math.abs(el.height) / 2;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3 - Math.PI / 6;
            const px = cx + rx * Math.cos(angle);
            const py = cy + ry * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
        break;
      }

      case 'arc': {
        if (el.width !== undefined && el.height !== undefined) {
          ctx.beginPath();
          ctx.moveTo(el.x, el.y + el.height);
          ctx.quadraticCurveTo(el.x + el.width / 2, el.y, el.x + el.width, el.y + el.height);
          ctx.stroke();
        }
        break;
      }

      case 'heart': {
        if (el.width !== undefined && el.height !== undefined) {
          const cx = el.x + el.width / 2;
          const topY = el.y + el.height * 0.28;
          ctx.beginPath();
          ctx.moveTo(cx, topY);
          ctx.bezierCurveTo(cx, el.y, el.x, el.y, el.x, topY);
          ctx.bezierCurveTo(el.x, el.y + el.height * 0.65, cx, el.y + el.height * 0.88, cx, el.y + el.height);
          ctx.bezierCurveTo(cx, el.y + el.height * 0.88, el.x + el.width, el.y + el.height * 0.65, el.x + el.width, topY);
          ctx.bezierCurveTo(el.x + el.width, el.y, cx, el.y, cx, topY);
          ctx.closePath();
          ctx.stroke();
        }
        break;
      }

      case 'checkmark': {
        if (el.width !== undefined && el.height !== undefined) {
          ctx.beginPath();
          ctx.moveTo(el.x, el.y + el.height * 0.55);
          ctx.lineTo(el.x + el.width * 0.38, el.y + el.height * 0.9);
          ctx.lineTo(el.x + el.width, el.y + el.height * 0.15);
          ctx.stroke();
        }
        break;
      }

      case 'cross': {
        if (el.width !== undefined && el.height !== undefined) {
          ctx.beginPath();
          ctx.moveTo(el.x, el.y);
          ctx.lineTo(el.x + el.width, el.y + el.height);
          ctx.moveTo(el.x + el.width, el.y);
          ctx.lineTo(el.x, el.y + el.height);
          ctx.stroke();
        }
        break;
      }

      case 'star': {
        if (el.width !== undefined && el.height !== undefined) {
          const cx = el.x + el.width / 2;
          const cy = el.y + el.height / 2;
          const spikes = 5;
          const outerRadius = Math.min(Math.abs(el.width), Math.abs(el.height)) / 2;
          const innerRadius = outerRadius / 2.5;

          let rot = (Math.PI / 2) * 3;
          let x = cx;
          let y = cy;
          const step = Math.PI / spikes;

          ctx.beginPath();
          ctx.moveTo(cx, cy - outerRadius);
          for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
          }
          ctx.lineTo(cx, cy - outerRadius);
          ctx.closePath();
          ctx.stroke();
        }
        break;
      }
    }

    ctx.restore();
  };

  // Main canvas render:
  // العناصر المحفوظة تُرسم مرة واحدة في كانفس مخبأ (offscreen)، وأثناء الرسم الحي
  // نكتفي بنسخ المخبأ ثم رسم الخط الحالي فقط، فتبقى السبورة سريعة حتى مع عناصر كثيرة.
  const cacheRef = useRef<HTMLCanvasElement | null>(null);
  const cacheKeyRef = useRef<{ els: unknown; pan: unknown; zoom: number; w: number; h: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  const paintNow = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const k = cacheKeyRef.current;
    const cacheValid =
      cacheRef.current &&
      k &&
      k.els === visibleElements &&
      k.pan === pan &&
      k.zoom === zoom &&
      k.w === canvas.width &&
      k.h === canvas.height;

    if (!cacheValid) {
      const cache = cacheRef.current || (cacheRef.current = document.createElement('canvas'));
      cache.width = canvas.width;
      cache.height = canvas.height;
      const cctx = cache.getContext('2d');
      if (cctx) {
        cctx.setTransform(1, 0, 0, 1, 0, 0);
        cctx.clearRect(0, 0, cache.width, cache.height);
        cctx.save();
        cctx.scale(dpr, dpr);
        cctx.translate(pan.x, pan.y);
        cctx.scale(zoom, zoom);
        visibleElements.forEach((el) => {
          if (!['text', 'sticky', 'image'].includes(el.tool)) {
            drawElement(cctx, el);
          }
        });
        cctx.restore();
      }
      cacheKeyRef.current = { els: visibleElements, pan, zoom, w: canvas.width, h: canvas.height };
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (cacheRef.current) ctx.drawImage(cacheRef.current, 0, 0);

    if (!isDrawing) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    if (['pen', 'pen_thin', 'pen_thick', 'highlighter'].includes(currentTool)) {
      drawElement(ctx, {
        id: 'temp_stroke',
        tool: currentTool,
        points: currentPoints,
        color: currentColor,
        strokeWidth,
        x: 0,
        y: 0,
      });
    } else if (dragStartPoint && currentDragPoint) {
      let width = currentDragPoint.x - dragStartPoint.x;
      let height = currentDragPoint.y - dragStartPoint.y;

      if (currentTool === 'square') {
        const side = Math.max(Math.abs(width), Math.abs(height));
        width = width < 0 ? -side : side;
        height = height < 0 ? -side : side;
      }

      drawElement(ctx, {
        id: 'temp_shape',
        tool: currentTool,
        x: dragStartPoint.x,
        y: dragStartPoint.y,
        width,
        height,
        color: currentColor,
        strokeWidth,
      });
    }

    ctx.restore();
  }, [
    visibleElements,
    isDrawing,
    currentPoints,
    dragStartPoint,
    currentDragPoint,
    currentTool,
    currentColor,
    strokeWidth,
    pan,
    zoom,
  ]);

  // دمج عدة تحديثات في إطار رسم واحد
  const renderCanvas = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      paintNow();
    });
  }, [paintNow]);

  useEffect(() => {
    renderRef.current = renderCanvas;
    renderCanvas();
  }, [renderCanvas]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Pointer Down (Mouse, Touch, Stylus)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.altKey || currentTool === 'pan') {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    if (!canDraw) return;
    const coords = getCanvasCoords(e.clientX, e.clientY);

    // If in SELECT mode: hit-test elements
    if (currentTool === 'select') {
      const hit = [...visibleElements].reverse().find((el) => isPointNearElement(coords, el));
      if (hit) {
        handleSelect(hit.id);
        if (!hit.isLocked) {
          setIsDraggingSelected(true);
          elementDragStartRef.current = {
            startX: coords.x,
            startY: coords.y,
            initialElement: JSON.parse(JSON.stringify(hit)),
          };
        }
      } else {
        handleSelect(null);
      }
      return;
    }

    // Object Deletion Eraser: touch or click deletes element immediately
    if (currentTool === 'eraser') {
      setIsDrawing(true);
      const hit = [...visibleElements].reverse().find((el) => isPointNearElement(coords, el));
      if (hit && !hit.isLocked) {
        onDeleteElement(hit.id);
      }
      return;
    }

    // Text tool click creates a new text box or reuses an empty unedited one
    if (currentTool === 'text') {
      // Check if there is already an active empty placeholder text box
      const emptyTextBox = elements.find(
        (el) => el.tool === 'text' && (el.text === 'اكتب هنا...' || !el.text?.trim())
      );
      if (emptyTextBox) {
        // Move the empty text box to this click position and select it
        onUpdateElement(emptyTextBox.id, { x: coords.x, y: coords.y });
        handleSelect(emptyTextBox.id);
        if (onSelectTool) onSelectTool('select');
        return;
      }

      // Otherwise create a single new text box
      const newText: WhiteboardElement = {
        id: `text_${Date.now()}`,
        tool: 'text',
        x: coords.x,
        y: coords.y,
        text: 'اكتب هنا...',
        color: currentColor,
        fontSize: 24,
        isBold: false,
        align: 'right',
        strokeWidth: 2,
        stageId: activeStageId || undefined,
      };
      onAddElement(newText);
      handleSelect(newText.id);
      // Auto-switch back to 'select' so subsequent clicks do NOT spawn duplicate text boxes
      if (onSelectTool) {
        onSelectTool('select');
      }
      return;
    }

    setIsDrawing(true);
    setDragStartPoint(coords);
    setCurrentDragPoint(coords);
    setCurrentPoints([coords]);
    handleSelect(null);

    if (onCursorMove) {
      onCursorMove(coords.x, coords.y);
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    setPointerScreenPos({ x: e.clientX, y: e.clientY });

    if (isPanning) {
      onPanChange({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (onCursorMove) {
      onCursorMove(coords.x, coords.y);
    }

    // Object Deletion Eraser drag: delete elements touched along the path
    if (currentTool === 'eraser') {
      if (isDrawing) {
        const hit = [...visibleElements].reverse().find((el) => isPointNearElement(coords, el));
        if (hit && !hit.isLocked) {
          onDeleteElement(hit.id);
        }
      }
      return;
    }

    // Hover detection for select cursor
    if (currentTool === 'select' && !isDraggingSelected) {
      const isNear = visibleElements.some((el) => isPointNearElement(coords, el));
      setIsHoveringElement(isNear);
    }

    // Dragging selected element in 'select' mode
    if (isDraggingSelected && elementDragStartRef.current) {
      const dx = coords.x - elementDragStartRef.current.startX;
      const dy = coords.y - elementDragStartRef.current.startY;
      const initial = elementDragStartRef.current.initialElement;

      if (initial.points && initial.points.length > 0) {
        const updatedPoints = initial.points.map((p) => ({
          x: p.x + dx,
          y: p.y + dy,
        }));
        onUpdateElement(initial.id, { points: updatedPoints });
      } else {
        onUpdateElement(initial.id, {
          x: initial.x + dx,
          y: initial.y + dy,
        });
      }
      return;
    }

    if (!isDrawing || !canDraw) return;

    if (['pen', 'pen_thin', 'pen_thick', 'highlighter'].includes(currentTool)) {
      setCurrentPoints((prev) => [...prev, coords]);
    } else {
      setCurrentDragPoint(coords);
    }
  };

  // Pointer Up
  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDraggingSelected) {
      setIsDraggingSelected(false);
      elementDragStartRef.current = null;
      return;
    }

    if (currentTool === 'eraser') {
      setIsDrawing(false);
      return;
    }

    if (!isDrawing || !canDraw) return;
    setIsDrawing(false);

    if (['pen', 'pen_thin', 'pen_thick', 'highlighter'].includes(currentTool)) {
      if (currentPoints.length > 0) {
        const newEl: WhiteboardElement = {
          id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          tool: currentTool,
          points: currentPoints,
          color: currentColor,
          strokeWidth,
          x: 0,
          y: 0,
          stageId: activeStageId || undefined,
        };
        onAddElement(newEl);
      }
    } else if (dragStartPoint) {
      const p2 = currentDragPoint || dragStartPoint;
      let width = p2.x - dragStartPoint.x;
      let height = p2.y - dragStartPoint.y;
      const isClickOnly = Math.abs(width) <= 8 && Math.abs(height) <= 8;

      let finalX = dragStartPoint.x;
      let finalY = dragStartPoint.y;

      if (isClickOnly) {
        // If user tapped/clicked without dragging, create a well-proportioned shape immediately!
        if (currentTool === 'line' || currentTool === 'dashed_line') {
          width = 180;
          height = 0;
        } else if (currentTool === 'arrow' || currentTool === 'double_arrow') {
          width = 180;
          height = 0;
        } else if (currentTool === 'rect') {
          width = 180;
          height = 120;
          finalX = dragStartPoint.x - 90;
          finalY = dragStartPoint.y - 60;
        } else if (currentTool === 'square') {
          width = 140;
          height = 140;
          finalX = dragStartPoint.x - 70;
          finalY = dragStartPoint.y - 70;
        } else if (currentTool === 'circle') {
          width = 150;
          height = 150;
          finalX = dragStartPoint.x - 75;
          finalY = dragStartPoint.y - 75;
        } else if (currentTool === 'ellipse') {
          width = 180;
          height = 120;
          finalX = dragStartPoint.x - 90;
          finalY = dragStartPoint.y - 60;
        } else if (currentTool === 'triangle') {
          width = 160;
          height = 140;
          finalX = dragStartPoint.x - 80;
          finalY = dragStartPoint.y - 70;
        } else if (currentTool === 'rhombus') {
          width = 160;
          height = 130;
          finalX = dragStartPoint.x - 80;
          finalY = dragStartPoint.y - 65;
        } else if (currentTool === 'hexagon') {
          width = 150;
          height = 140;
          finalX = dragStartPoint.x - 75;
          finalY = dragStartPoint.y - 70;
        } else if (currentTool === 'arc') {
          width = 160;
          height = 80;
          finalX = dragStartPoint.x - 80;
          finalY = dragStartPoint.y - 40;
        } else if (currentTool === 'heart') {
          width = 150;
          height = 140;
          finalX = dragStartPoint.x - 75;
          finalY = dragStartPoint.y - 70;
        } else if (currentTool === 'checkmark') {
          width = 140;
          height = 120;
          finalX = dragStartPoint.x - 70;
          finalY = dragStartPoint.y - 60;
        } else if (currentTool === 'cross') {
          width = 130;
          height = 130;
          finalX = dragStartPoint.x - 65;
          finalY = dragStartPoint.y - 65;
        } else if (currentTool === 'star') {
          width = 150;
          height = 150;
          finalX = dragStartPoint.x - 75;
          finalY = dragStartPoint.y - 75;
        }
      } else if (currentTool === 'square') {
        const side = Math.max(Math.abs(width), Math.abs(height));
        width = width < 0 ? -side : side;
        height = height < 0 ? -side : side;
      }

      if (isClickOnly || Math.abs(width) > 3 || Math.abs(height) > 3) {
        const newEl: WhiteboardElement = {
          id: `shape_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          tool: currentTool,
          x: finalX,
          y: finalY,
          width,
          height,
          color: currentColor,
          strokeWidth,
          stageId: activeStageId || undefined,
        };
        onAddElement(newEl);
        handleSelect(newEl.id);
        if (onSelectTool) onSelectTool('select');
      }
    }

    setDragStartPoint(null);
    setCurrentDragPoint(null);
    setCurrentPoints([]);
  };

  // Stamp circle from compass
  const handleDrawCompassCircle = (cx: number, cy: number, radius: number) => {
    const coords = getCanvasCoords(cx, cy);
    const newEl: WhiteboardElement = {
      id: `compass_circle_${Date.now()}`,
      tool: 'circle',
      x: coords.x - radius / zoom,
      y: coords.y - radius / zoom,
      width: (radius * 2) / zoom,
      height: (radius * 2) / zoom,
      color: currentColor,
      strokeWidth,
    };
    onAddElement(newEl);
  };

  // Drag and drop images
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canDraw || !e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

    const file = e.dataTransfer.files[0];
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const coords = getCanvasCoords(e.clientX, e.clientY);
        const newImg: WhiteboardElement = {
          id: `img_${Date.now()}`,
          tool: 'image',
          imageUrl: url,
          x: coords.x - 120,
          y: coords.y - 90,
          width: 240,
          height: 180,
          color: '#000000',
          strokeWidth: 1,
        };
        onAddElement(newImg);
        handleSelect(newImg.id);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCanvasCursorClass = () => {
    if (isPanning) return 'cursor-grabbing';
    if (currentTool === 'pan') return 'cursor-grab';
    if (currentTool === 'select') {
      if (isDraggingSelected) return 'cursor-grabbing';
      if (isHoveringElement) return 'cursor-move';
      return 'cursor-default';
    }
    if (currentTool === 'text') return 'cursor-text';
    if (currentTool === 'eraser') return 'cursor-crosshair';
    const ALL_DRAWING_TOOLS = [
      'pen',
      'pen_thin',
      'pen_thick',
      'highlighter',
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
    ];
    if (ALL_DRAWING_TOOLS.includes(currentTool)) {
      return 'cursor-crosshair';
    }
    return 'cursor-default';
  };

  return (
    <div
      ref={containerRef}
      id="whiteboard-canvas-container"
      className={`relative w-full flex-1 overflow-hidden select-none touch-none transition-colors duration-300 ${getCanvasCursorClass()}`}
      style={backgroundStyles[background] || backgroundStyles.plain}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={() => {
        setPointerScreenPos(null);
        setIsHoveringElement(false);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Eraser Ring Follower */}
      {currentTool === 'eraser' && pointerScreenPos && (
        <div
          className="pointer-events-none fixed z-50 rounded-full border-2 border-slate-900/70 dark:border-white/80 bg-red-400/20 shadow-xs transition-none"
          style={{
            left: `${pointerScreenPos.x}px`,
            top: `${pointerScreenPos.y}px`,
            width: `${Math.max(14, strokeWidth * zoom)}px`,
            height: `${Math.max(14, strokeWidth * zoom)}px`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
      {/* HTML5 Vector / Drawing Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full pointer-events-none" />

      {/* Interactive Rich DOM Elements (Sticky Notes, Text Boxes, Images) */}
      <div className="absolute inset-0 pointer-events-none">
        {visibleElements.map((el) => {
          if (el.tool === 'sticky') {
            return (
              <div key={el.id} className="pointer-events-auto">
                <StickyNoteItem
                  element={el}
                  isSelected={selectedElementId === el.id}
                  canEdit={canDraw && !el.isLocked}
                  onUpdate={(upd) => onUpdateElement(el.id, upd)}
                  onDelete={() => {
                    if (el.isLocked) return;
                    onDeleteElement(el.id);
                  }}
                  onSelect={() => handleSelect(el.id)}
                  zoom={zoom}
                  pan={pan}
                />
              </div>
            );
          }
          if (el.tool === 'text') {
            return (
              <div key={el.id} className="pointer-events-auto">
                <TextBoardItem
                  element={el}
                  isSelected={selectedElementId === el.id}
                  canEdit={canDraw && !el.isLocked}
                  onUpdate={(upd) => onUpdateElement(el.id, upd)}
                  onDelete={() => {
                    if (el.isLocked) return;
                    onDeleteElement(el.id);
                  }}
                  onSelect={() => handleSelect(el.id)}
                  zoom={zoom}
                  pan={pan}
                />
              </div>
            );
          }
          if (el.tool === 'image') {
            return (
              <div key={el.id} className="pointer-events-auto">
                <ImageBoardItem
                  element={el}
                  isSelected={selectedElementId === el.id}
                  canEdit={canDraw && !el.isLocked}
                  onUpdate={(upd) => onUpdateElement(el.id, upd)}
                  onDelete={() => {
                    if (el.isLocked) return;
                    onDeleteElement(el.id);
                  }}
                  onSelect={() => handleSelect(el.id)}
                  zoom={zoom}
                  pan={pan}
                />
              </div>
            );
          }
          return null;
        })}

        {/* Unified Interactive Handles (Resize Corners, Rotate, Drag, Duplicate, Delete) */}
        {selectedElement && selectedElement.tool !== 'text' && canDraw && (
          <TransformOverlay
            element={selectedElement}
            zoom={zoom}
            pan={pan}
            canEdit={canDraw}
            onUpdate={(id, upd) => onUpdateElement(id, upd)}
            onDelete={(id) => {
              if (selectedElement.isLocked) return;
              onDeleteElement(id);
              handleSelect(null);
            }}
            onDuplicate={(el) => {
              if (selectedElement.isLocked) return;
              const cloned: WhiteboardElement = {
                ...JSON.parse(JSON.stringify(el)),
                id: `${el.tool}_${Date.now()}`,
                x: el.x + 25,
                y: el.y + 25,
                isLocked: false,
              };
              if (cloned.points) {
                cloned.points = cloned.points.map((p: Point) => ({ x: p.x + 25, y: p.y + 25 }));
              }
              onAddElement(cloned);
              handleSelect(cloned.id);
            }}
          />
        )}
      </div>

      {/* Floating Page Navigation Bar at top-center/right (Only shown when multiple pages exist) */}
      {totalPages !== undefined && totalPages > 1 && onPrevPage && onNextPage && onAddNewPage && onOpenPagesManager && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-30 pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200">
          <PageNavigationBar
            currentPageIndex={currentPageIndex ?? 0}
            totalPages={totalPages}
            onPrevPage={onPrevPage}
            onNextPage={onNextPage}
            onAddNewPage={onAddNewPage}
            onOpenPagesManager={onOpenPagesManager}
          />
        </div>
      )}

      {/* Remote Participant Cursors (Students & Teachers in Active Session) */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {remoteCursors.map((cursor) => {
          const screenX = cursor.x * zoom + pan.x;
          const screenY = cursor.y * zoom + pan.y;
          return (
            <div
              key={cursor.id}
              className="absolute pointer-events-none transition-all duration-75 flex items-start"
              style={{ left: `${screenX}px`, top: `${screenY}px` }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={cursor.color} stroke="#ffffff" strokeWidth="1.5">
                <path d="M3 3l7 18 3-7 7-3L3 3z" />
              </svg>
              <span
                className="text-[10px] text-white font-bold px-1.5 py-0.5 rounded-md shadow-xs ml-1 whitespace-nowrap"
                style={{ backgroundColor: cursor.color }}
              >
                {cursor.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Educational Math Tools: Ruler, Protractor, Compass Overlays */}
      <EducationalTools
        ruler={ruler}
        setRuler={setRuler}
        protractor={protractor}
        setProtractor={setProtractor}
        compass={compass}
        setCompass={setCompass}
        onDrawCompassCircle={handleDrawCompassCircle}
        containerRect={containerRef.current?.getBoundingClientRect() || null}
      />

      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
              const url = ev.target?.result as string;
              const centerPoint = getCanvasCoords(
                window.innerWidth / 2,
                window.innerHeight / 2
              );
              const newImg: WhiteboardElement = {
                id: `img_${Date.now()}`,
                tool: 'image',
                imageUrl: url,
                x: centerPoint.x - 120,
                y: centerPoint.y - 90,
                width: 240,
                height: 180,
                color: '#000000',
                strokeWidth: 1,
              };
              onAddElement(newImg);
              handleSelect(newImg.id);
            };
            reader.readAsDataURL(file);
          }
          e.target.value = '';
        }}
      />
    </div>
  );
};
