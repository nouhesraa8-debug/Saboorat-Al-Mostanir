import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  WhiteboardElement,
  ToolType,
  BoardBackground,
  BoardPage,
  SessionState,
  SavedBoard,
  RulerState,
  ProtractorState,
  CompassState,
  RemoteCursor,
  RevealPathState,
} from './types';
import { TopBar } from './components/TopBar';
import { BottomToolbar } from './components/BottomToolbar';
import { WhiteboardCanvas } from './components/WhiteboardCanvas';
import { MenuDrawer } from './components/MenuDrawer';
import { PdfModal } from './components/PdfModal';
import { QuranModal } from './components/QuranModal';
import { MemorizationTools } from './components/MemorizationTools';
import { ScreenShareModal } from './components/ScreenShareModal';
import { SavedBoardsModal } from './components/SavedBoardsModal';
import { ClassroomModal } from './components/ClassroomModal';
import { ClearConfirmModal } from './components/ClearConfirmModal';
import { PagesManagerModal } from './components/PagesManagerModal';
import { SaveBoardModal } from './components/SaveBoardModal';
import { StudentMotivationModal } from './components/StudentMotivationModal';
import { ClassGamesModal } from './components/ClassGamesModal';
import { ClassCirclesModal } from './components/ClassCirclesModal';
import { QuestionBankModal } from './components/QuestionBankModal';
import { PointsTrackerModal } from './components/PointsTrackerModal';
import { ClassCircle } from './types';
import { api, getAuthToken } from './utils/api';
import { AuthGate } from './components/AuthGate';
import { UserAccount } from './types';
import { RevealPathManager } from './components/RevealPathManager';
import { NarrationSpeedControl } from './components/NarrationSpeedControl';
import { playStageRevealCue } from './utils/soundEffects';
import { OfficialLogo } from './components/OfficialLogo';
import { Eye } from 'lucide-react';
import jsPDF from 'jspdf';

const STORAGE_KEY_CURRENT = 'almustanir_current_board';
const STORAGE_KEY_SAVED_LIST = 'almustanir_saved_boards';
const STORAGE_KEY_BG = 'almustanir_board_background';
const STORAGE_KEY_PAGES = 'almustanir_board_pages';

export function App() {
  // Pages state: Supports multi-page whiteboard with persistence
  const [pages, setPages] = useState<BoardPage[]>(() => {
    try {
      const savedPages = localStorage.getItem(STORAGE_KEY_PAGES);
      if (savedPages) {
        const parsed = JSON.parse(savedPages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}

    const initialBg = (localStorage.getItem(STORAGE_KEY_BG) as BoardBackground) || 'plain';
    let initialElements: WhiteboardElement[] = [];
    try {
      const savedEl = localStorage.getItem(STORAGE_KEY_CURRENT);
      if (savedEl) initialElements = JSON.parse(savedEl);
    } catch {}

    return [
      {
        id: 'page_1',
        title: 'صفحة 1',
        elements: initialElements,
        background: initialBg,
        createdAt: Date.now(),
      },
    ];
  });

  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [showPagesModal, setShowPagesModal] = useState<boolean>(false);

  // Current active page's elements
  const [elements, setElements] = useState<WhiteboardElement[]>(() => {
    return pages[0]?.elements || [];
  });

  const [history, setHistory] = useState<WhiteboardElement[][]>([elements]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Tools & Styling state
  const [currentTool, setCurrentTool] = useState<ToolType>('pen');
  const [currentColor, setCurrentColor] = useState<string>('#0f172a');
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [background, setBackground] = useState<BoardBackground>(() => {
    return pages[0]?.background || (localStorage.getItem(STORAGE_KEY_BG) as BoardBackground) || 'plain';
  });

  // Selected element for manipulation and deletion
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Canvas Viewport Transformation
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // View modes
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('almustanir_dark_mode') === 'true';
  });

  // Educational math tools
  const [ruler, setRuler] = useState<RulerState>({
    visible: false,
    x: 120,
    y: 120,
    angle: 0,
    width: 320,
    height: 50,
  });

  const [protractor, setProtractor] = useState<ProtractorState>({
    visible: false,
    x: 260,
    y: 280,
    radius: 120,
    angle: 0,
  });

  const [compass, setCompass] = useState<CompassState>({
    visible: false,
    x: 350,
    y: 250,
    radius: 90,
    angle: 0,
  });

  // Modals & Drawers state
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [quranModalOpen, setQuranModalOpen] = useState(false);
  const [memorizationModalOpen, setMemorizationModalOpen] = useState(false);
  const [motivationModalOpen, setMotivationModalOpen] = useState(false);
  const [classGamesModalOpen, setClassGamesModalOpen] = useState(false);
  const [classCirclesModalOpen, setClassCirclesModalOpen] = useState(false);
  const [questionBankModalOpen, setQuestionBankModalOpen] = useState(false);
  const [pointsTrackerModalOpen, setPointsTrackerModalOpen] = useState(false);
  const [circles, setCircles] = useState<ClassCircle[]>([]);
  const [activeCircleId, setActiveCircleId] = useState<string | null>(null);

  const fetchCircles = useCallback(async () => {
    try {
      const res = await api.getCircles();
      if (res.circles) {
        setCircles(res.circles);
        if (res.circles.length > 0) {
          setActiveCircleId((prev) => prev || res.circles[0].id);
        }
      }
    } catch {
      try {
        const saved = localStorage.getItem('almustanir_class_circles');
        if (saved) {
          const parsed = JSON.parse(saved);
          setCircles(parsed);
          if (parsed.length > 0) {
            setActiveCircleId((prev) => prev || parsed[0].id);
          }
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    fetchCircles();
  }, [fetchCircles]);

  const [screenShareModalOpen, setScreenShareModalOpen] = useState(false);
  const [savedBoardsModalOpen, setSavedBoardsModalOpen] = useState(false);
  const [classroomModalOpen, setClassroomModalOpen] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Saved boards gallery
  const [savedBoards, setSavedBoards] = useState<SavedBoard[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED_LIST);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Real-Time Classroom Session state (WebSocket)
  const [session, setSession] = useState<SessionState>({
    active: false,
    roomId: null,
    role: 'teacher',
    studentName: 'طالب المستنير',
    allowStudentDraw: true,
    participants: [],
  });

  // Secret Path state (المسار السري للحلقة)
  const [revealPath, setRevealPath] = useState<RevealPathState>(() => {
    try {
      const saved = localStorage.getItem('almustanir_reveal_path');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      enabled: true,
      stages: [
        { id: 'stage_1', order: 1, title: 'السؤال والتمهيد', isRevealed: true },
        { id: 'stage_2', order: 2, title: 'التلميح والتوجيه', isRevealed: false },
        { id: 'stage_3', order: 3, title: 'الشرح والمساعدة', isRevealed: false },
        { id: 'stage_4', order: 4, title: 'الحل والإتقان التام', isRevealed: false },
      ],
      activeStageId: 'stage_1',
    };
  });
  const [activeStageId, setActiveStageId] = useState<string | null>('stage_1');
  const [showRevealPathPanel, setShowRevealPathPanel] = useState<boolean>(false);
  const [narrationSpeed, setNarrationSpeed] = useState<number>(1);

  // Persist reveal path changes locally
  useEffect(() => {
    try {
      localStorage.setItem('almustanir_reveal_path', JSON.stringify(revealPath));
    } catch {}
  }, [revealPath]);

  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dark mode class sync
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('almustanir_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('almustanir_dark_mode', 'false');
    }
  }, [isDarkMode]);

  // Persist current board elements
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(elements));
    } catch (e) {
      console.warn('Storage quota notice:', e);
    }
  }, [elements]);

  // --- حساب المستخدم: ضيف / تسجيل دخول / إنشاء حساب ---
  const [authUser, setAuthUser] = useState<UserAccount | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const hasRoomLink = new URLSearchParams(window.location.search).has('room');
    const token = getAuthToken();
    if (!token) {
      // رابط حصة مباشر لا يحتاج حسابًا؛ غير ذلك نعرض شاشة الاختيار
      if (!hasRoomLink) setShowAuth(true);
      return;
    }
    api.auth
      .me()
      .then((r) => {
        if (r.user) setAuthUser(r.user);
        else if (!hasRoomLink) setShowAuth(true);
      })
      .catch(() => {
        // الخادم غير متاح أو الجلسة منتهية: لا نمنع الاستخدام
        if (!hasRoomLink) setShowAuth(true);
      });
  }, []);

  const handleLogout = async () => {
    await api.auth.logout();
    setAuthUser(null);
    setShowAuth(true);
  };

  // Check URL parameters for direct student join link (?room=XYZ&role=student)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const roleParam = params.get('role');

    if (roomParam) {
      handleJoinSession(
        roomParam,
        'طالب جديد',
        '#2563eb',
        roleParam === 'teacher' ? 'teacher' : 'student'
      );
    }
  }, []);

  // Update history stack
  const updateCurrentPageData = (newElements: WhiteboardElement[], newBg?: BoardBackground) => {
    setPages((prev) => {
      const updated = [...prev];
      if (updated[currentPageIndex]) {
        updated[currentPageIndex] = {
          ...updated[currentPageIndex],
          elements: newElements,
          ...(newBg ? { background: newBg } : {}),
        };
      }
      try {
        localStorage.setItem(STORAGE_KEY_PAGES, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const pushToHistory = (newElements: WhiteboardElement[]) => {
    const updated = history.slice(0, historyIndex + 1);
    updated.push(newElements);
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
    setElements(newElements);
    updateCurrentPageData(newElements);

    // Sync with WebSocket room if active and teacher
    if (session.active && session.role === 'teacher' && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'elements_batch',
          elements: newElements,
        })
      );
    }
  };

  const handleAddElement = (element: WhiteboardElement) => {
    const newElements = [...elements, element];
    pushToHistory(newElements);

    if (session.active && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'element_add',
          element,
        })
      );
    }
  };

  const handleUpdateElement = (id: string, updated: Partial<WhiteboardElement>) => {
    const current = elements.find((el) => el.id === id);
    if (!current) return;

    // Prevent modifying locked elements unless isLocked itself is being updated
    if (current.isLocked && updated.isLocked === undefined) {
      return;
    }

    const newElements = elements.map((el) => (el.id === id ? { ...el, ...updated } : el));
    pushToHistory(newElements);

    if (session.active && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'element_update',
          id,
          updated,
        })
      );
    }
  };

  const handleDeleteElement = (id: string) => {
    const current = elements.find((el) => el.id === id);
    // Prevent deleting locked elements
    if (current?.isLocked) {
      return;
    }

    const newElements = elements.filter((el) => el.id !== id);
    pushToHistory(newElements);

    if (selectedElementId === id) {
      setSelectedElementId(null);
    }

    if (session.active && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'element_delete',
          id,
        })
      );
    }
  };

  const handleDeleteSelected = () => {
    if (selectedElementId) {
      const current = elements.find((el) => el.id === selectedElementId);
      if (current?.isLocked) {
        return;
      }
      handleDeleteElement(selectedElementId);
      setSelectedElementId(null);
    }
  };

  const handleToggleLockSelected = () => {
    if (!selectedElementId) return;
    const current = elements.find((el) => el.id === selectedElementId);
    if (!current) return;
    handleUpdateElement(selectedElementId, { isLocked: !current.isLocked });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      const prevElements = history[nextIndex];
      setElements(prevElements);
      setSelectedElementId(null);
      updateCurrentPageData(prevElements);

      if (session.active && session.role === 'teacher' && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'elements_batch',
            elements: prevElements,
          })
        );
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const nextElements = history[nextIndex];
      setElements(nextElements);
      setSelectedElementId(null);
      updateCurrentPageData(nextElements);

      if (session.active && session.role === 'teacher' && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'elements_batch',
            elements: nextElements,
          })
        );
      }
    }
  };

  // Multi-page handlers (فتح صفحة جديدة، التنقل، التكرار، الحذف)
  const handleSwitchPage = (index: number) => {
    if (index < 0 || index >= pages.length) return;
    setCurrentPageIndex(index);
    const targetPage = pages[index];
    const targetElements = targetPage?.elements || [];
    const targetBg = targetPage?.background || 'plain';

    setElements(targetElements);
    setBackground(targetBg);
    setHistory([targetElements]);
    setHistoryIndex(0);
    setSelectedElementId(null);

    try {
      localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(targetElements));
      localStorage.setItem(STORAGE_KEY_BG, targetBg);
    } catch {}

    if (session.active && session.role === 'teacher' && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'elements_batch',
          elements: targetElements,
        })
      );
      wsRef.current.send(
        JSON.stringify({
          type: 'background_change',
          background: targetBg,
        })
      );
    }
  };

  const handleAddNewPage = () => {
    const newPageNum = pages.length + 1;
    const newPage: BoardPage = {
      id: `page_${Date.now()}`,
      title: `صفحة ${newPageNum}`,
      elements: [],
      background: background,
      createdAt: Date.now(),
    };
    const updatedPages = [...pages, newPage];
    setPages(updatedPages);
    try {
      localStorage.setItem(STORAGE_KEY_PAGES, JSON.stringify(updatedPages));
    } catch {}
    handleSwitchPage(updatedPages.length - 1);
  };

  const handleDuplicatePage = (index: number) => {
    const source = pages[index];
    if (!source) return;
    const duplicated: BoardPage = {
      id: `page_${Date.now()}`,
      title: `${source.title} (نسخة)`,
      elements: JSON.parse(JSON.stringify(source.elements || [])),
      background: source.background || background,
      createdAt: Date.now(),
    };
    const updatedPages = [...pages];
    updatedPages.splice(index + 1, 0, duplicated);
    setPages(updatedPages);
    try {
      localStorage.setItem(STORAGE_KEY_PAGES, JSON.stringify(updatedPages));
    } catch {}
    handleSwitchPage(index + 1);
  };

  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) return;
    const updatedPages = pages.filter((_, i) => i !== index);
    setPages(updatedPages);
    try {
      localStorage.setItem(STORAGE_KEY_PAGES, JSON.stringify(updatedPages));
    } catch {}
    const nextIndex = Math.min(currentPageIndex, updatedPages.length - 1);
    handleSwitchPage(nextIndex);
  };

  // Clear Board: Handled via in-app confirmation modal (works 100% in iframes)
  const handleClearBoard = () => {
    setShowClearModal(true);
  };

  const executeClearBoard = () => {
    pushToHistory([]);
    setSelectedElementId(null);
    setShowClearModal(false);
    if (session.active && session.role === 'teacher' && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'clear_board',
        })
      );
    }
  };

  // Background Change: Updates background layer without clearing any content!
  const handleChangeBackground = (newBg: BoardBackground) => {
    setBackground(newBg);
    localStorage.setItem(STORAGE_KEY_BG, newBg);
    updateCurrentPageData(elements, newBg);

    if (session.active && session.role === 'teacher' && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'background_change',
          background: newBg,
        })
      );
    }
  };

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Escape, Delete, Backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape') {
        setFocusMode(false);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          e.preventDefault();
          handleDeleteSelected();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, selectedElementId, focusMode]);

  // Save Whiteboard to gallery (opens clean SaveBoardModal without browser prompt)
  const handleSaveBoard = () => {
    setShowSaveModal(true);
  };

  const executeSaveToGallery = (title: string) => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    const thumbnail = canvas ? canvas.toDataURL('image/jpeg', 0.5) : undefined;

    const newBoard: SavedBoard = {
      id: `board_${Date.now()}`,
      title: title.trim(),
      background,
      elements: [...elements],
      createdAt: Date.now(),
      thumbnail,
    };

    const updated = [newBoard, ...savedBoards];
    setSavedBoards(updated);
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_LIST, JSON.stringify(updated));
    } catch {}
  };

  const handleLoadBoard = (board: SavedBoard) => {
    pushToHistory(board.elements);
    if (board.background) {
      handleChangeBackground(board.background as BoardBackground);
    }
  };

  const handleDeleteSavedBoard = (id: string) => {
    const updated = savedBoards.filter((b) => b.id !== id);
    setSavedBoards(updated);
    localStorage.setItem(STORAGE_KEY_SAVED_LIST, JSON.stringify(updated));
  };

  // Insert Quran Ayah onto Whiteboard
  const handleInsertVerseToBoard = (text: string) => {
    const newVerseElement: WhiteboardElement = {
      id: `quran_ayah_${Date.now()}`,
      tool: 'text',
      x: Math.round((-pan.x + window.innerWidth / 2) / zoom - 180),
      y: Math.round((-pan.y + window.innerHeight / 2) / zoom - 80),
      text,
      color: '#047857',
      fontSize: 26,
      isBold: true,
      align: 'right',
      strokeWidth: 2,
    };
    handleAddElement(newVerseElement);
    setSelectedElementId(newVerseElement.id);
  };

  // Stamp Celebration Medal onto Whiteboard
  const handleStampMedalToBoard = (medal: {
    type: string;
    title: string;
    studentName: string;
    iconText: string;
    color: string;
  }) => {
    const textContent = `${medal.iconText} ${medal.title}${
      medal.studentName ? `\nللطالب المتميز: ${medal.studentName}` : ''
    }\n✨ بارك الله فيك ونفع بك ✨`;
    const newMedalElement: WhiteboardElement = {
      id: `medal_${Date.now()}`,
      tool: 'text',
      x: Math.round((-pan.x + window.innerWidth / 2) / zoom - 160),
      y: Math.round((-pan.y + window.innerHeight / 2) / zoom - 70),
      text: textContent,
      color: medal.color || '#d97706',
      fontSize: 24,
      isBold: true,
      align: 'center',
      strokeWidth: 2,
    };
    handleAddElement(newMedalElement);
    setSelectedElementId(newMedalElement.id);
  };

  // Insert Question Card onto Whiteboard
  const handleInsertQuestionCardToBoard = (q: {
    questionText: string;
    type: string;
    options?: string[];
    correctAnswer?: string;
    explanation?: string;
  }) => {
    let cardText = `❓ ${q.questionText}\n`;
    if (q.options && q.options.length > 0) {
      cardText += q.options.map((opt, i) => `[ ${i + 1} ] ${opt}`).join('   ');
    }
    if (q.explanation) {
      cardText += `\n💡 فائدة: ${q.explanation}`;
    }

    const newQElement: WhiteboardElement = {
      id: `question_card_${Date.now()}`,
      tool: 'text',
      x: Math.round((-pan.x + window.innerWidth / 2) / zoom - 200),
      y: Math.round((-pan.y + window.innerHeight / 2) / zoom - 80),
      text: cardText,
      color: '#0369a1',
      fontSize: 22,
      isBold: true,
      align: 'right',
      strokeWidth: 2,
    };
    handleAddElement(newQElement);
    setSelectedElementId(newQElement.id);
  };

  // Reward student with points and stamp medal
  const handleRewardStudentPoints = async (studentName: string, reason: string) => {
    handleStampMedalToBoard({
      type: 'points_reward',
      title: `وسام التميز: ${reason}`,
      studentName,
      iconText: '⭐',
      color: '#d97706',
    });
    if (activeCircleId) {
      try {
        await api.addPoints({
          circleId: activeCircleId,
          studentName,
          points: 10,
          reason,
        });
      } catch {}
    }
  };

  // Insert PDF Page onto Whiteboard
  const handleInsertPdfPage = (dataUrl: string, width: number, height: number) => {
    const newPdfPage: WhiteboardElement = {
      id: `pdf_page_${Date.now()}`,
      tool: 'image',
      imageUrl: dataUrl,
      x: Math.round((-pan.x + window.innerWidth / 2) / zoom - width / 2),
      y: Math.round((-pan.y + window.innerHeight / 2) / zoom - height / 2),
      width,
      height,
      color: '#000000',
      strokeWidth: 1,
    };
    handleAddElement(newPdfPage);
    setSelectedElementId(newPdfPage.id);
  };

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Export engine (PNG, JPEG, PDF, Print)
  const handleExport = (format: 'png' | 'jpeg' | 'pdf' | 'print') => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Fill background
    if (background === 'green') {
      ctx.fillStyle = '#1b3b2b';
    } else if (background === 'dark') {
      ctx.fillStyle = '#0f172a';
    } else if (background === 'notes') {
      ctx.fillStyle = '#fef9c3';
    } else {
      ctx.fillStyle = '#ffffff';
    }
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Draw whiteboard strokes & shapes
    ctx.drawImage(canvas, 0, 0);

    // Draw permanent creator credit on exported image/print
    ctx.fillStyle = '#047857';
    ctx.font = 'bold 18px "Cairo", sans-serif';
    ctx.direction = 'rtl';
    ctx.fillText('سبورة المستنير — إعداد: إسراء عبدالستار', exportCanvas.width - 320, exportCanvas.height - 24);

    if (format === 'png' || format === 'jpeg') {
      const mime = format === 'png' ? 'image/png' : 'image/jpeg';
      const dataUrl = exportCanvas.toDataURL(mime, 0.95);
      const link = document.createElement('a');
      link.download = `سبورة_المستنير_${Date.now()}.${format}`;
      link.href = dataUrl;
      link.click();
    } else if (format === 'pdf') {
      const imgData = exportCanvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: exportCanvas.width > exportCanvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [exportCanvas.width, exportCanvas.height],
      });
      pdf.addImage(imgData, 'JPEG', 0, 0, exportCanvas.width, exportCanvas.height);
      pdf.save(`سبورة_المستنير_${Date.now()}.pdf`);
    } else if (format === 'print') {
      const dataUrl = exportCanvas.toDataURL('image/png');
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <html dir="rtl">
            <head>
              <title>طباعة سبورة المستنير</title>
              <style>
                body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Cairo', sans-serif; background: #fafafa; }
                img { max-width: 100%; max-height: 90vh; object-fit: contain; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                .footer { margin-top: 14px; font-weight: bold; color: #047857; font-size: 15px; }
              </style>
            </head>
            <body onload="window.print(); window.close();">
              <img src="${dataUrl}" alt="سبورة المستنير" />
              <div class="footer">سبورة المستنير — إعداد: إسراء عبدالستار</div>
            </body>
          </html>
        `);
        win.document.close();
      }
    }
  };

  // Real-Time Classroom WebSocket Handlers
  const handleStartTeacherSession = () => {
    const roomId = `MST-${100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000)}`;
    setupWebSocket(roomId, 'teacher', 'المعلمة');
  };

  const handleJoinSession = (
    roomId: string,
    studentName: string,
    color: string,
    role: 'teacher' | 'student' = 'student'
  ) => {
    setupWebSocket(roomId, role, studentName, color);
  };

  const setupWebSocket = (
    roomId: string,
    role: 'teacher' | 'student',
    name: string,
    color = '#2563eb'
  ) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: 'join',
            token: getAuthToken(),
            roomId,
            role,
            name,
            color,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case 'error': {
              alert(msg.message || 'تعذر الاتصال بالغرفة');
              break;
            }
            case 'joined': {
              setSession({
                active: true,
                roomId: msg.roomId,
                role: msg.role,
                studentName: name,
                allowStudentDraw: msg.allowStudentDraw,
                participants: msg.participants || [],
              });
              if (msg.elements && msg.elements.length > 0) {
                setElements(msg.elements);
              }
              if (msg.background) {
                setBackground(msg.background as BoardBackground);
              }
              break;
            }

            case 'participants_update': {
              setSession((prev) => ({
                ...prev,
                participants: msg.participants || [],
              }));
              break;
            }

            case 'element_added': {
              setElements((prev) => [...prev, msg.element]);
              break;
            }

            case 'element_updated': {
              setElements((prev) =>
                prev.map((el) => (el.id === msg.id ? { ...el, ...msg.updated } : el))
              );
              break;
            }

            case 'element_deleted': {
              setElements((prev) => prev.filter((el) => el.id !== msg.id));
              break;
            }

            case 'background_changed': {
              if (msg.background) {
                setBackground(msg.background as BoardBackground);
              }
              break;
            }

            case 'sync_all_elements': {
              setElements(msg.elements || []);
              break;
            }

            case 'board_cleared': {
              setElements([]);
              setSelectedElementId(null);
              break;
            }

            case 'student_draw_toggled': {
              setSession((prev) => ({
                ...prev,
                allowStudentDraw: msg.allow,
              }));
              break;
            }

            case 'reveal_stage': {
              playStageRevealCue();
              if (msg.stages) {
                setRevealPath((prev) => ({
                  ...prev,
                  stages: msg.stages,
                  activeStageId: msg.stageId,
                }));
              } else if (msg.stageId) {
                setRevealPath((prev) => ({
                  ...prev,
                  stages: prev.stages.map((s) =>
                    s.id === msg.stageId ? { ...s, isRevealed: true, revealedAt: Date.now() } : s
                  ),
                  activeStageId: msg.stageId,
                }));
              }
              break;
            }

            case 'reveal_path_sync': {
              if (msg.revealPath) {
                setRevealPath(msg.revealPath);
              }
              break;
            }

            case 'cursor_moved': {
              setRemoteCursors((prev) => {
                const filtered = prev.filter((c) => c.id !== msg.cursor.id);
                return [...filtered, msg.cursor];
              });
              break;
            }

            case 'session_ended': {
              alert('تم إنهاء الجلسة التفاعلية من قِبل المعلمة.');
              handleEndSession();
              break;
            }
          }
        } catch (err) {
          console.error('WS message parse error:', err);
        }
      };
    } catch (err) {
      console.warn('WebSocket setup warning:', err);
    }
  };

  const handleToggleStudentDraw = (allow: boolean) => {
    if (session.role !== 'teacher' || !wsRef.current) return;
    setSession((p) => ({ ...p, allowStudentDraw: allow }));
    wsRef.current.send(
      JSON.stringify({
        type: 'toggle_student_draw',
        allow,
      })
    );
  };

  const handleUpdateRevealPath = (updated: RevealPathState) => {
    setRevealPath(updated);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && session.active) {
      wsRef.current.send(
        JSON.stringify({
          type: 'reveal_path_sync',
          revealPath: updated,
        })
      );
    }
  };

  const handleRevealStage = (stageId: string, stageTitle: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && session.active) {
      wsRef.current.send(
        JSON.stringify({
          type: 'reveal_stage',
          stageId,
          stageTitle,
          stages: revealPath.stages.map((s) =>
            s.id === stageId ? { ...s, isRevealed: true, revealedAt: Date.now() } : s
          ),
        })
      );
    }
  };

  const handleEndSession = () => {
    if (wsRef.current && session.role === 'teacher') {
      wsRef.current.send(
        JSON.stringify({
          type: 'end_session',
        })
      );
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setSession({
      active: false,
      roomId: null,
      role: 'teacher',
      studentName: 'طالب المستنير',
      allowStudentDraw: true,
      participants: [],
    });
    setRemoteCursors([]);
  };

  const handleCursorMove = (x: number, y: number) => {
    if (session.active && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'cursor_move',
          x,
          y,
        })
      );
    }
  };

  const canDraw = session.role === 'teacher' || session.allowStudentDraw;

  return (
    <div className="flex flex-col h-dvh w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 antialiased select-none" dir="rtl">
      {showAuth && (
        <AuthGate
          onAuthenticated={(u) => { setAuthUser(u); setShowAuth(false); }}
          onClose={() => setShowAuth(false)}
        />
      )}
      {!focusMode && (
        <button
          onClick={() => (authUser && authUser.role !== 'guest' ? handleLogout() : setShowAuth(true))}
          className="fixed top-[4.25rem] left-3 sm:top-auto sm:bottom-3 z-40 rounded-full bg-emerald-900/90 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-800"
          title={authUser && authUser.role !== 'guest' ? 'تسجيل الخروج' : 'تسجيل الدخول أو إنشاء حساب'}
        >
          {authUser && authUser.role !== 'guest' ? `${authUser.name} · خروج` : authUser ? 'ضيف · تسجيل الدخول' : 'تسجيل الدخول'}
        </button>
      )}
      {/* 1. Top Bar: ☰ القائمة | سبورة المستنير | المعلمة | المشاركون | مشاركة | نسخ الرابط | حالة الجلسة | إنهاء الجلسة | وضع التركيز */}
      <div
        id="whiteboard-topbar-wrapper"
        className={`shrink-0 w-full z-30 transition-all duration-200 ${
          focusMode ? 'hidden pointer-events-none' : 'block'
        }`}
      >
        <TopBar
          session={session}
          onOpenMenu={() => setMenuDrawerOpen(true)}
          onOpenShareModal={() => setClassroomModalOpen(true)}
          onEndSession={handleEndSession}
          onToggleFocusMode={() => setFocusMode(true)}
          onToggleStudentDraw={handleToggleStudentDraw}
          isTeacher={session.role === 'teacher'}
          onAddNewPage={handleAddNewPage}
          onOpenPagesManager={() => setShowPagesModal(true)}
          currentPageIndex={currentPageIndex}
          totalPages={pages.length}
          onOpenMotivationModal={() => setMotivationModalOpen(true)}
          onOpenClassGamesModal={() => setClassGamesModalOpen(true)}
          onOpenPointsTrackerModal={() => setPointsTrackerModalOpen(true)}
        />
      </div>

      {/* 2. Main Area: The Interactive Whiteboard */}
      <main className="relative flex-1 w-full min-h-0 overflow-hidden flex flex-col">
        <WhiteboardCanvas
          elements={elements}
          onAddElement={handleAddElement}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
          currentTool={currentTool}
          currentColor={currentColor}
          strokeWidth={strokeWidth}
          background={background}
          zoom={zoom}
          pan={pan}
          onPanChange={setPan}
          canDraw={canDraw}
          remoteCursors={remoteCursors}
          onCursorMove={handleCursorMove}
          ruler={ruler}
          setRuler={setRuler}
          protractor={protractor}
          setProtractor={setProtractor}
          compass={compass}
          setCompass={setCompass}
          fileInputRef={fileInputRef}
          selectedElementId={selectedElementId}
          onSelectElement={setSelectedElementId}
          currentPageIndex={currentPageIndex}
          totalPages={pages.length}
          onPrevPage={() => handleSwitchPage(currentPageIndex - 1)}
          onNextPage={() => handleSwitchPage(currentPageIndex + 1)}
          onAddNewPage={handleAddNewPage}
          onOpenPagesManager={() => setShowPagesModal(true)}
          onSelectTool={setCurrentTool}
          isTeacher={session.role === 'teacher'}
          revealPath={revealPath}
          activeStageId={activeStageId}
        />

        {/* المسار السري للحلقة (Secret Path Floating Widget) */}
        {showRevealPathPanel && (
          <div className="absolute top-4 left-4 z-40 max-w-sm w-full animate-in fade-in slide-in-from-left duration-200">
            <RevealPathManager
              revealPath={revealPath}
              onUpdateRevealPath={handleUpdateRevealPath}
              onRevealStage={handleRevealStage}
              isTeacher={session.role === 'teacher'}
              activeStageId={activeStageId}
              onSelectActiveStage={setActiveStageId}
              selectedElementStageId={
                elements.find((el) => el.id === selectedElementId)?.stageId
              }
              onAssignSelectedElementToStage={(stageId) => {
                if (selectedElementId) {
                  handleUpdateElement(selectedElementId, { stageId });
                }
              }}
            />
          </div>
        )}

        {/* Floating Focus Mode exit button when in focusMode */}
        {focusMode && (
          <button
            type="button"
            onClick={() => setFocusMode(false)}
            className="absolute top-4 left-4 z-50 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 animate-in fade-in zoom-in-95 cursor-pointer"
            title="إظهار أشرطة الأدوات والقوائم (أو اضغط زر Esc في لوحة المفاتيح)"
          >
            <Eye className="w-4 h-4" />
            <span>إظهار الأدوات (وضع التركيز)</span>
          </button>
        )}

        {/* Persistent Fixed Title & Credit Header during Focus Mode */}
        {focusMode && (
          <div
            id="focus-mode-fixed-header"
            className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-amber-400/50 dark:border-amber-600/50 shadow-xl select-none animate-in fade-in slide-in-from-top-2 duration-200"
            dir="rtl"
          >
            <OfficialLogo size="sm" showAcademyTitle={false} />
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-emerald-950 dark:text-emerald-100">
                  سبورة المستنير
                </span>
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/25 to-yellow-500/20 border border-amber-400/70 text-amber-900 dark:text-amber-200 text-[10px] font-black whitespace-nowrap shadow-2xs">
                  إعداد: إسراء عبد الستار
                </span>
              </div>
              <span className="text-[9px] text-emerald-700/90 dark:text-emerald-400/90 font-medium">
                السبورة التعليمية الذكية
              </span>
            </div>
          </div>
        )}

        {/* لوحة سرعة القراءة في وضع التركيز (Focus Mode Narration Speed) */}
        {focusMode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
            <NarrationSpeedControl
              currentSpeed={narrationSpeed}
              onSpeedChange={setNarrationSpeed}
              isFocusMode={true}
              onExitFocusMode={() => setFocusMode(false)}
            />
          </div>
        )}

        {/* Student View Notification when drawing is disabled */}
        {session.active && session.role === 'student' && !session.allowStudentDraw && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 pointer-events-none z-30 animate-bounce">
            <span>🔒 وضع المشاهدة فقط (المعلمة أوقفت كتابة الطلاب حالياً)</span>
          </div>
        )}
      </main>

      {/* 4. Whiteboard Toolbar: Docked cleanly at bottom of the whiteboard (Single instance, hidden cleanly on focusMode) */}
      <div
        id="whiteboard-bottom-toolbar-wrapper"
        className={`shrink-0 w-full z-30 transition-all duration-200 ${
          focusMode ? 'hidden pointer-events-none' : 'block'
        }`}
      >
        <BottomToolbar
          currentTool={currentTool}
          onSelectTool={setCurrentTool}
          currentColor={currentColor}
          onChangeColor={setCurrentColor}
          strokeWidth={strokeWidth}
          onChangeStrokeWidth={setStrokeWidth}
          background={background}
          onChangeBackground={handleChangeBackground}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
          hasSelectedElement={Boolean(selectedElementId)}
          isElementLocked={Boolean(elements.find((el) => el.id === selectedElementId)?.isLocked)}
          onToggleLock={handleToggleLockSelected}
          onDeleteSelected={handleDeleteSelected}
          onClearAll={handleClearBoard}
          onUploadImage={() => fileInputRef.current?.click()}
          onOpenPdfModal={() => setPdfModalOpen(true)}
          zoom={zoom}
          onZoomIn={() => setZoom((z) => Math.min(3, +(z + 0.15).toFixed(2)))}
          onZoomOut={() => setZoom((z) => Math.max(0.4, +(z - 0.15).toFixed(2)))}
          onResetZoom={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          onHideTools={() => setFocusMode(true)}
          onSaveBoard={handleSaveBoard}
          canDraw={canDraw}
          onOpenMotivationModal={() => setMotivationModalOpen(true)}
          onOpenClassGamesModal={() => setClassGamesModalOpen(true)}
          onToggleRevealPath={() => setShowRevealPathPanel((p) => !p)}
          isRevealPathOpen={showRevealPathPanel}
        />
      </div>

      {/* 5. Modals & Overlays */}
      <MenuDrawer
        isOpen={menuDrawerOpen}
        onClose={() => setMenuDrawerOpen(false)}
        onOpenQuranModal={() => setQuranModalOpen(true)}
        onOpenMemorizationModal={() => setMemorizationModalOpen(true)}
        onOpenMotivationModal={() => setMotivationModalOpen(true)}
        onOpenClassGamesModal={() => setClassGamesModalOpen(true)}
        onOpenClassCirclesModal={() => setClassCirclesModalOpen(true)}
        onOpenQuestionBankModal={() => setQuestionBankModalOpen(true)}
        onOpenPointsTrackerModal={() => setPointsTrackerModalOpen(true)}
        onOpenSavedBoards={() => setSavedBoardsModalOpen(true)}
        onExport={handleExport}
        onToggleRuler={() => setRuler((r) => ({ ...r, visible: !r.visible }))}
        rulerVisible={ruler.visible}
        onToggleProtractor={() => setProtractor((p) => ({ ...p, visible: !p.visible }))}
        protractorVisible={protractor.visible}
        onToggleCompass={() => setCompass((c) => ({ ...c, visible: !c.visible }))}
        compassVisible={compass.visible}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onOpenScreenShareModal={() => setScreenShareModalOpen(true)}
        onAddNewPage={handleAddNewPage}
        onOpenPagesManager={() => setShowPagesModal(true)}
        currentPageIndex={currentPageIndex}
        totalPages={pages.length}
        onClearBoard={handleClearBoard}
        onChangeBackground={handleChangeBackground}
        currentBackground={background}
      />

      <ClearConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={executeClearBoard}
        onConfirmClear={executeClearBoard}
        elementsCount={elements.length}
      />

      <SaveBoardModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSaveToGallery={executeSaveToGallery}
        currentElements={elements}
        currentBackground={background}
        currentPageTitle={pages[currentPageIndex]?.title}
      />

      <PagesManagerModal
        isOpen={showPagesModal}
        onClose={() => setShowPagesModal(false)}
        pages={pages}
        currentPageIndex={currentPageIndex}
        onSwitchPage={handleSwitchPage}
        onAddNewPage={handleAddNewPage}
        onDuplicatePage={handleDuplicatePage}
        onDeletePage={handleDeletePage}
      />

      <PdfModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        onInsertPage={handleInsertPdfPage}
      />

      <QuranModal
        isOpen={quranModalOpen}
        onClose={() => setQuranModalOpen(false)}
        onInsertVerseToBoard={handleInsertVerseToBoard}
      />

      <MemorizationTools
        isOpen={memorizationModalOpen}
        onClose={() => setMemorizationModalOpen(false)}
      />

      <ScreenShareModal
        isOpen={screenShareModalOpen}
        onClose={() => setScreenShareModalOpen(false)}
        roomId={session.roomId}
        onStartSessionIfNeeded={handleStartTeacherSession}
      />

      <SavedBoardsModal
        isOpen={savedBoardsModalOpen}
        onClose={() => setSavedBoardsModalOpen(false)}
        savedBoards={savedBoards}
        onLoadBoard={handleLoadBoard}
        onDeleteBoard={handleDeleteSavedBoard}
      />

      <ClassroomModal
        isOpen={classroomModalOpen}
        onClose={() => setClassroomModalOpen(false)}
        session={session}
        onStartTeacherSession={handleStartTeacherSession}
        onJoinStudentSession={(rid, sName, col) => handleJoinSession(rid, sName, col, 'student')}
        onToggleStudentDraw={handleToggleStudentDraw}
        onEndSession={handleEndSession}
      />

      {/* Student Celebration & Motivation Modal */}
      <StudentMotivationModal
        isOpen={motivationModalOpen}
        onClose={() => setMotivationModalOpen(false)}
        onStampMedalToBoard={handleStampMedalToBoard}
      />

      {/* Interactive Class Games & Competitions Modal */}
      <ClassGamesModal
        isOpen={classGamesModalOpen}
        onClose={() => setClassGamesModalOpen(false)}
        onStampTextToBoard={handleInsertVerseToBoard}
        onRewardStudent={handleRewardStudentPoints}
        circles={circles}
        activeCircleId={activeCircleId}
      />

      {/* Class Circles & Students Management Modal */}
      <ClassCirclesModal
        isOpen={classCirclesModalOpen}
        onClose={() => {
          setClassCirclesModalOpen(false);
          fetchCircles();
        }}
        activeCircleId={activeCircleId}
        onSelectCircle={(circle) => setActiveCircleId(circle.id)}
      />

      {/* Question Bank & Whiteboard Stamping Modal */}
      <QuestionBankModal
        isOpen={questionBankModalOpen}
        onClose={() => setQuestionBankModalOpen(false)}
        circles={circles}
        activeCircleId={activeCircleId}
        onStampQuestionToBoard={handleInsertQuestionCardToBoard}
      />

      {/* Points Tracker & Leaderboard Modal */}
      <PointsTrackerModal
        isOpen={pointsTrackerModalOpen}
        onClose={() => setPointsTrackerModalOpen(false)}
        circles={circles}
        activeCircleId={activeCircleId}
      />
    </div>
  );
}

export default App;
