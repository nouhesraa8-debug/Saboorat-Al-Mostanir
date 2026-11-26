import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Dices,
  Timer,
  Sparkles,
  HelpCircle,
  Play,
  RotateCcw,
  CheckCircle2,
  Trophy,
  Plus,
  Trash2,
  Grid,
  Award,
  Users,
} from 'lucide-react';
import {
  playVictoryChime,
  playApplause,
  playSuccessDing,
  playWheelTick,
  playTimerEndGong,
} from '../utils/soundEffects';
import { ClassCircle } from '../types';

interface ClassGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardStudent?: (studentName: string, reason: string) => void;
  onStampTextToBoard?: (text: string) => void;
  circles?: ClassCircle[];
  activeCircleId?: string | null;
}

const DEFAULT_STUDENTS = [
  'عمر أحمد',
  'فاطمة محمود',
  'عبدالرحمن علي',
  'مريم يوسف',
  'إبراهيم خالد',
  'سارة حسن',
];

const WHEEL_TASKS = [
  'تسميع 3 آيات غيباً 📖',
  'استخراج حكم تجويدي 💎',
  'تسميع ربع الحزب 🌟',
  'الفوز بـ وسام ونجمة ذهبية 🥇',
  'تفسير معنى كلمة قرآنية 💡',
  'تلاوة بترتيل خاشع 🕊️',
];

const TAJWEED_TASKS = [
  'استخرج إظهاراً حلقياً 💎',
  'استخرج إدغاماً بغنة أو بغير غنة 🌿',
  'استخرج حكماً في الميم الساكنة 📜',
  'بيّن حكم القلقلة ومرتبتها 🔔',
  'استخرج إخفاءً حقيقياً ✨',
  'استخرج مداً واجباً أو جائزاً 📏',
];

const PRIZES_TASKS = [
  'وسام النجم الذهبي ⭐',
  '+20 نقطة تفوق 🥇',
  'بطاقة إعفاء من سؤال 🎫',
  '+15 نقطة إتقان 💎',
  'شارة القارئ المتقن 🏆',
  '+10 نقاط مشاركة 🌟',
];

interface MemoryCard {
  id: number;
  pairId: number;
  content: string;
  category: string;
}

const INITIAL_MEMORY_CARDS: MemoryCard[] = [
  { id: 1, pairId: 1, content: 'سورة الإخلاص', category: 'اسم السورة' },
  { id: 2, pairId: 1, content: '﴿ قُلْ هُوَ اللَّهُ أَحَدٌ ﴾', category: 'مطلع السورة' },
  { id: 3, pairId: 2, content: 'سورة الفلق', category: 'اسم السورة' },
  { id: 4, pairId: 2, content: '﴿ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ﴾', category: 'مطلع السورة' },
  { id: 5, pairId: 3, content: 'سورة الناس', category: 'اسم السورة' },
  { id: 6, pairId: 3, content: '﴿ قُلْ أَعُوذُ بِرَبِّ النَّاسِ ﴾', category: 'مطلع السورة' },
  { id: 7, pairId: 4, content: 'سورة الكوثر', category: 'اسم السورة' },
  { id: 8, pairId: 4, content: '﴿ إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ ﴾', category: 'مطلع السورة' },
  { id: 9, pairId: 5, content: 'سورة العصر', category: 'اسم السورة' },
  { id: 10, pairId: 5, content: '﴿ وَالْعَصْرِ * إِنَّ الْإِنسَانَ لَفِي خُسْرٍ ﴾', category: 'مطلع السورة' },
  { id: 11, pairId: 6, content: 'سورة النصر', category: 'اسم السورة' },
  { id: 12, pairId: 6, content: '﴿ إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ ﴾', category: 'مطلع السورة' },
];

const MISSING_WORD_QUESTIONS = [
  {
    surah: 'سورة الفاتحة',
    verse: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا ...',
    options: ['الضَّالِّينَ', 'الْمُهْتَدِينَ', 'الْخَاسِرِينَ'],
    correct: 'الضَّالِّينَ',
  },
  {
    surah: 'سورة البقرة (آية الكرسي)',
    verse: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ ...',
    options: ['الْقَيُّومُ', 'الْكَرِيمُ', 'الْعَظِيمُ'],
    correct: 'الْقَيُّومُ',
  },
  {
    surah: 'سورة الإخلاص',
    verse: 'قُلْ هُوَ اللَّهُ أَحَدٌ * اللَّهُ ...',
    options: ['الصَّمَدُ', 'الْعَلِيمُ', 'الْغَفُورُ'],
    correct: 'الصَّمَدُ',
  },
  {
    surah: 'سورة العصر',
    verse: 'إِنَّ الْإِنسَانَ لَفِي خُسْرٍ * إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا ...',
    options: ['الصَّالِحَاتِ', 'الْخَيْرَاتِ', 'الْحَسَنَاتِ'],
    correct: 'الصَّالِحَاتِ',
  },
  {
    surah: 'سورة الكوثر',
    verse: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ * فَصَلِّ لِرَبِّكَ ...',
    options: ['وَانْحَرْ', 'وَاصْبِرْ', 'وَاسْتَغْفِرْ'],
    correct: 'وَانْحَرْ',
  },
];

const GUESS_SURAH_QUESTIONS = [
  {
    verse: '﴿ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ﴾',
    options: ['سورة الفلق', 'سورة الناس', 'سورة الإخلاص'],
    correct: 'سورة الفلق',
  },
  {
    verse: '﴿ تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ ﴾',
    options: ['سورة المسد', 'سورة الكوثر', 'سورة النصر'],
    correct: 'سورة المسد',
  },
  {
    verse: '﴿ وَالتِّينِ وَالزَّيْتُونِ ﴾',
    options: ['سورة التين', 'سورة العلق', 'سورة القدر'],
    correct: 'سورة التين',
  },
  {
    verse: '﴿ إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ ﴾',
    options: ['سورة القدر', 'سورة البينة', 'سورة الزلزلة'],
    correct: 'سورة القدر',
  },
];

type GameTab = 'wheel' | 'timer' | 'missing_word' | 'guess_surah' | 'memory';
type WheelMode = 'students' | 'tasks' | 'tajweed' | 'prizes';

export const ClassGamesModal: React.FC<ClassGamesModalProps> = ({
  isOpen,
  onClose,
  onRewardStudent,
  onStampTextToBoard,
  circles = [],
  activeCircleId,
}) => {
  const [activeTab, setActiveTab] = useState<GameTab>('wheel');

  // Wheel State
  const [wheelMode, setWheelMode] = useState<WheelMode>('students');
  const [selectedCircleId, setSelectedCircleId] = useState<string>(activeCircleId || '');
  const [studentsList, setStudentsList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('almustanir_students_list');
      return saved ? JSON.parse(saved) : DEFAULT_STUDENTS;
    } catch {
      return DEFAULT_STUDENTS;
    }
  });
  const [newStudentInput, setNewStudentInput] = useState('');
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelWinner, setWheelWinner] = useState<string | null>(null);

  // Sync students from active circle if available
  useEffect(() => {
    if (selectedCircleId && circles.length > 0) {
      const c = circles.find((item) => item.id === selectedCircleId);
      if (c && c.studentsList && c.studentsList.length > 0) {
        setStudentsList(c.studentsList);
      }
    }
  }, [selectedCircleId, circles]);

  // Timer State
  const [timerDuration, setTimerDuration] = useState<number>(60);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Missing Word Game State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);

  // Guess Surah Game State
  const [surahQIndex, setSurahQIndex] = useState(0);
  const [surahSelectedOpt, setSurahSelectedOpt] = useState<string | null>(null);
  const [surahResult, setSurahResult] = useState<'correct' | 'wrong' | null>(null);
  const [surahScore, setSurahScore] = useState(0);

  // Memory Game State
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>(() =>
    [...INITIAL_MEMORY_CARDS].sort(() => Math.random() - 0.5)
  );
  const [flippedCardIds, setFlippedCardIds] = useState<number[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [isEvaluatingPair, setIsEvaluatingPair] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('almustanir_students_list', JSON.stringify(studentsList));
    } catch {}
  }, [studentsList]);

  // Timer countdown loop
  useEffect(() => {
    if (timerRunning && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            playTimerEndGong();
            setTimeout(() => playApplause(), 300);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning, timeLeft]);

  if (!isOpen) return null;

  const getWheelItems = (): string[] => {
    switch (wheelMode) {
      case 'students':
        return studentsList;
      case 'tasks':
        return WHEEL_TASKS;
      case 'tajweed':
        return TAJWEED_TASKS;
      case 'prizes':
        return PRIZES_TASKS;
      default:
        return studentsList;
    }
  };

  // Spin the Wheel
  const handleSpinWheel = () => {
    if (isSpinning) return;
    const items = getWheelItems();
    if (items.length === 0) return;

    setIsSpinning(true);
    setWheelWinner(null);

    // Pick random target item
    const randomIndex = Math.floor(Math.random() * items.length);
    const sliceDeg = 360 / items.length;
    const extraSpins = 5 * 360; // 5 full rotations
    // Target rotation to point to the winner at top (90 deg)
    const targetDeg = wheelRotation + extraSpins + (360 - randomIndex * sliceDeg) + (sliceDeg / 2);

    setWheelRotation(targetDeg);

    // Play ticks during spin
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      playWheelTick();
      tickCount++;
      if (tickCount > 18) clearInterval(tickInterval);
    }, 180);

    // Stop and declare winner
    setTimeout(() => {
      setIsSpinning(false);
      const winner = items[randomIndex];
      setWheelWinner(winner);
      playVictoryChime();
      setTimeout(() => playApplause(), 200);
    }, 3200);
  };

  // Memory Game Logic
  const handleMemoryCardClick = (card: MemoryCard) => {
    if (isEvaluatingPair) return;
    if (matchedPairIds.includes(card.pairId)) return;
    if (flippedCardIds.includes(card.id)) return;

    const newFlipped = [...flippedCardIds, card.id];
    setFlippedCardIds(newFlipped);

    if (newFlipped.length === 2) {
      setIsEvaluatingPair(true);
      setMemoryMoves((m) => m + 1);

      const [firstId, secondId] = newFlipped;
      const firstCard = memoryCards.find((c) => c.id === firstId);
      const secondCard = memoryCards.find((c) => c.id === secondId);

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        // Matched!
        playSuccessDing();
        setMatchedPairIds((prev) => {
          const next = [...prev, firstCard.pairId];
          if (next.length === INITIAL_MEMORY_CARDS.length / 2) {
            // Finished game!
            setTimeout(() => {
              playVictoryChime();
              setTimeout(() => playApplause(), 300);
            }, 400);
          }
          return next;
        });
        setFlippedCardIds([]);
        setIsEvaluatingPair(false);
      } else {
        // Not matched - flip back after 900ms
        setTimeout(() => {
          setFlippedCardIds([]);
          setIsEvaluatingPair(false);
        }, 900);
      }
    }
  };

  const handleResetMemory = () => {
    setMemoryCards([...INITIAL_MEMORY_CARDS].sort(() => Math.random() - 0.5));
    setFlippedCardIds([]);
    setMatchedPairIds([]);
    setMemoryMoves(0);
    setIsEvaluatingPair(false);
  };

  const handleAddStudent = () => {
    if (!newStudentInput.trim()) return;
    setStudentsList([...studentsList, newStudentInput.trim()]);
    setNewStudentInput('');
  };

  const handleRemoveStudent = (idx: number) => {
    setStudentsList(studentsList.filter((_, i) => i !== idx));
  };

  // Missing word answer check
  const handleCheckAnswer = (option: string) => {
    if (answerResult) return;
    setSelectedOption(option);
    const currentQ = MISSING_WORD_QUESTIONS[currentQIndex];
    if (option === currentQ.correct) {
      setAnswerResult('correct');
      setScore((s) => s + 10);
      playSuccessDing();
      setTimeout(() => playApplause(), 200);
    } else {
      setAnswerResult('wrong');
    }
  };

  const handleNextQuestion = () => {
    setAnswerResult(null);
    setSelectedOption(null);
    setCurrentQIndex((prev) => (prev + 1) % MISSING_WORD_QUESTIONS.length);
  };

  // Guess Surah answer check
  const handleCheckSurahAnswer = (option: string) => {
    if (surahResult) return;
    setSurahSelectedOpt(option);
    const currentQ = GUESS_SURAH_QUESTIONS[surahQIndex];
    if (option === currentQ.correct) {
      setSurahResult('correct');
      setSurahScore((s) => s + 10);
      playSuccessDing();
    } else {
      setSurahResult('wrong');
    }
  };

  const handleNextSurahQ = () => {
    setSurahResult(null);
    setSurahSelectedOpt(null);
    setSurahQIndex((prev) => (prev + 1) % GUESS_SURAH_QUESTIONS.length);
  };

  const currentItems = getWheelItems();
  const colors = ['#059669', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#ea580c', '#4b5563'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-emerald-500/40 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900 text-white px-5 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shadow-xs">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
                صندوق ألعاب وتحديات الحلقة الذكية
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-600 border border-emerald-400/40 font-sans">
                  تفاعلية ومركزة
                </span>
              </h2>
              <p className="text-[11px] text-emerald-100 font-medium">
                أنشطة سريعة لكسر الروتين، تثبيت الحفظ، وتنشيط أذهان الطلاب داخل مسار الدرس
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 overflow-x-auto gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('wheel')}
              className={`px-3 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all ${
                activeTab === 'wheel'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Dices className="w-4 h-4" />
              <span>عجلة التسميع والاختيار</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('memory')}
              className={`px-3 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all ${
                activeTab === 'memory'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>لعبة الذاكرة القرآنية</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('timer')}
              className={`px-3 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all ${
                activeTab === 'timer'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Timer className="w-4 h-4" />
              <span>مؤقت التحدي والتركيز</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('missing_word')}
              className={`px-3 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all ${
                activeTab === 'missing_word'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>الكلمة المحذوفة في الآية</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('guess_surah')}
              className={`px-3 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all ${
                activeTab === 'guess_surah'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>تخمين السورة</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Wheel of Fortune & Choice */}
        {activeTab === 'wheel' && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col md:flex-row items-center gap-6">
            {/* Left: Interactive Wheel */}
            <div className="flex flex-col items-center justify-center shrink-0">
              {/* Pointer indicator */}
              <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-amber-500 z-20 -mb-3 drop-shadow-md" />

              {/* Wheel Container */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 border-slate-700 dark:border-slate-300 shadow-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                <div
                  className="w-full h-full rounded-full transition-transform duration-[3200ms] ease-out"
                  style={{
                    transform: `rotate(${wheelRotation}deg)`,
                  }}
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {currentItems.map((item, i) => {
                      const total = currentItems.length;
                      const startAngle = (i * 360) / total;
                      const endAngle = ((i + 1) * 360) / total;
                      const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                      const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                      const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                      const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);
                      const largeArc = endAngle - startAngle > 180 ? 1 : 0;
                      const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`;

                      const midAngle = (startAngle + endAngle) / 2;
                      const textX = 50 + 32 * Math.cos((Math.PI * midAngle) / 180);
                      const textY = 50 + 32 * Math.sin((Math.PI * midAngle) / 180);

                      return (
                        <g key={i}>
                          <path
                            d={pathData}
                            fill={colors[i % colors.length]}
                            stroke="#ffffff"
                            strokeWidth="0.75"
                          />
                          <text
                            x={textX}
                            y={textY}
                            fill="#ffffff"
                            fontSize="4.5"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="central"
                            transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                          >
                            {item.length > 12 ? item.substring(0, 10) + '..' : item}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Center Hub Button */}
                <button
                  type="button"
                  onClick={handleSpinWheel}
                  disabled={isSpinning || currentItems.length === 0}
                  className="absolute w-14 h-14 rounded-full bg-slate-900 border-2 border-amber-400 text-white font-black text-xs shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  title="انقر لتدوير العجلة"
                >
                  {isSpinning ? '...' : 'دَوِّر'}
                </button>
              </div>

              {/* Spin Button under wheel */}
              <button
                type="button"
                onClick={handleSpinWheel}
                disabled={isSpinning || currentItems.length === 0}
                className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-md flex items-center gap-2 active:scale-95 transition-transform"
              >
                <Dices className="w-4 h-4" />
                <span>ابدأ تدوير العجلة الآن!</span>
              </button>
            </div>

            {/* Right: Winner card & Configuration */}
            <div className="flex-1 w-full flex flex-col gap-3">
              {/* Winner Announcement */}
              {wheelWinner && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/10 border-2 border-amber-400 shadow-md text-center animate-in zoom-in-95">
                  <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-300 font-bold text-xs mb-1">
                    <Trophy className="w-4 h-4" />
                    <span>وقع الاختيار المبارك على:</span>
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {wheelWinner} 🎉
                  </div>
                  {wheelMode === 'students' && onRewardStudent && (
                    <button
                      type="button"
                      onClick={() => onRewardStudent(wheelWinner, 'الفوز في عجلة التسميع')}
                      className="mt-2 text-xs px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold inline-flex items-center gap-1 shadow-xs"
                    >
                      <span>منح وسام وتشجيع على السبورة</span>
                    </button>
                  )}
                </div>
              )}

              {/* Circle Selector if circles available */}
              {circles && circles.length > 0 && (
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تحميل طلاب حلقة:</span>
                  </span>
                  <select
                    value={selectedCircleId}
                    onChange={(e) => setSelectedCircleId(e.target.value)}
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium"
                  >
                    <option value="">قائمة مخصصة</option>
                    {circles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.studentsList.length} طالب)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Mode Toggle */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setWheelMode('students')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    wheelMode === 'students'
                      ? 'bg-white dark:bg-slate-700 shadow-xs text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  طلاب الحلقة
                </button>
                <button
                  type="button"
                  onClick={() => setWheelMode('tasks')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    wheelMode === 'tasks'
                      ? 'bg-white dark:bg-slate-700 shadow-xs text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  تحديات الحفظ
                </button>
                <button
                  type="button"
                  onClick={() => setWheelMode('tajweed')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    wheelMode === 'tajweed'
                      ? 'bg-white dark:bg-slate-700 shadow-xs text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  أحكام التجويد
                </button>
                <button
                  type="button"
                  onClick={() => setWheelMode('prizes')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    wheelMode === 'prizes'
                      ? 'bg-white dark:bg-slate-700 shadow-xs text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  جوائز ونقاط
                </button>
              </div>

              {/* Student list editor */}
              {wheelMode === 'students' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newStudentInput}
                      onChange={(e) => setNewStudentInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddStudent()}
                      placeholder="أضف اسم طالب جديد..."
                      className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddStudent}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-xl">
                    {studentsList.map((st, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold"
                      >
                        <span>{st}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveStudent(idx)}
                          className="hover:text-red-500 text-slate-400"
                          title="حذف"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Focus & Recitation Challenge Timer */}
        {activeTab === 'timer' && (
          <div className="flex-1 p-6 flex flex-col items-center justify-center gap-4">
            <div className="text-center">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
                تحدي الدقيقة الذهبية وتثبيت الحفظ
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2">
                مؤقت التسميع والتركيز الفائق
              </h3>
            </div>

            {/* Giant Countdown Clock */}
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full border-8 border-emerald-500/30 flex items-center justify-center bg-slate-50 dark:bg-slate-800/80 shadow-inner">
              <div className="text-5xl sm:text-6xl font-mono font-black text-emerald-700 dark:text-emerald-300">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            </div>

            {/* Preset Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: '30 ثانية', secs: 30 },
                { label: 'دقيقة واحدة', secs: 60 },
                { label: 'دقيقتان', secs: 120 },
                { label: '3 دقائق (ربع كامل)', secs: 180 },
                { label: '5 دقائق', secs: 300 },
              ].map((p) => (
                <button
                  key={p.secs}
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerDuration(p.secs);
                    setTimeLeft(p.secs);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    timerDuration === p.secs
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setTimerRunning(!timerRunning)}
                className={`px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 ${
                  timerRunning
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {timerRunning ? (
                  <>
                    <span>إيقاف مؤقت</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>ابدأ التحدي الآن</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setTimeLeft(timerDuration);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
                title="إعادة ضبط"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة ضبط</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Missing Word Quran Challenge */}
        {activeTab === 'missing_word' && (
          <div className="flex-1 overflow-y-auto p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                السؤال {currentQIndex + 1} من {MISSING_WORD_QUESTIONS.length}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-600 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800">
                  النقاط: {score} ⭐
                </span>
              </div>
            </div>

            {/* Question Verse */}
            <div className="my-6 p-6 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-300/60 dark:border-emerald-800 text-center">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-2 inline-block">
                [{MISSING_WORD_QUESTIONS[currentQIndex].surah}]
              </span>
              <div className="font-quran text-xl sm:text-2xl leading-loose text-slate-900 dark:text-slate-100">
                {MISSING_WORD_QUESTIONS[currentQIndex].verse}
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {MISSING_WORD_QUESTIONS[currentQIndex].options.map((opt, i) => {
                let btnStyle =
                  'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-emerald-500';
                if (answerResult && selectedOption === opt) {
                  btnStyle =
                    opt === MISSING_WORD_QUESTIONS[currentQIndex].correct
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : 'bg-rose-600 text-white border-rose-600';
                } else if (answerResult && opt === MISSING_WORD_QUESTIONS[currentQIndex].correct) {
                  btnStyle = 'bg-emerald-100 dark:bg-emerald-950 border-emerald-500 text-emerald-800 dark:text-emerald-200';
                }

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleCheckAnswer(opt)}
                    disabled={Boolean(answerResult)}
                    className={`p-3.5 rounded-xl border-2 font-quran text-lg font-bold transition-all active:scale-95 ${btnStyle}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            {answerResult && (
              <div className="mt-5 flex items-center justify-between">
                <div className="text-xs font-bold">
                  {answerResult === 'correct' ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      إجابة صحيحة وممتازة! بارك الله فيك 🎉
                    </span>
                  ) : (
                    <span className="text-rose-600">حاول مرة أخرى في السؤال القادم!</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-transform active:scale-95"
                >
                  السؤال التالي ⬅️
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Guess Surah from Verse */}
        {activeTab === 'guess_surah' && (
          <div className="flex-1 overflow-y-auto p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                التحدي {surahQIndex + 1} من {GUESS_SURAH_QUESTIONS.length}
              </span>
              <span className="text-xs font-black text-amber-600 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800">
                النقاط: {surahScore} ⭐
              </span>
            </div>

            {/* Prompt */}
            <div className="my-6 p-6 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-300/60 dark:border-amber-800 text-center">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-2 inline-block">
                ما اسم السورة الكريمة التي تبدأ بهذه الآية؟
              </span>
              <div className="font-quran text-2xl leading-loose text-slate-900 dark:text-slate-100">
                {GUESS_SURAH_QUESTIONS[surahQIndex].verse}
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {GUESS_SURAH_QUESTIONS[surahQIndex].options.map((opt, i) => {
                let btnStyle =
                  'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-amber-500';
                if (surahResult && surahSelectedOpt === opt) {
                  btnStyle =
                    opt === GUESS_SURAH_QUESTIONS[surahQIndex].correct
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                      : 'bg-rose-600 text-white border-rose-600';
                } else if (surahResult && opt === GUESS_SURAH_QUESTIONS[surahQIndex].correct) {
                  btnStyle = 'bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-800 dark:text-amber-200';
                }

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleCheckSurahAnswer(opt)}
                    disabled={Boolean(surahResult)}
                    className={`p-3.5 rounded-xl border-2 text-base font-bold transition-all active:scale-95 ${btnStyle}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            {surahResult && (
              <div className="mt-5 flex items-center justify-between">
                <div className="text-xs font-bold">
                  {surahResult === 'correct' ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      إجابة صحيحة! أحسنت وأتقنت 🌟
                    </span>
                  ) : (
                    <span className="text-rose-600">إجابة غير صحيحة، ركز في السؤال التالي!</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNextSurahQ}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-transform active:scale-95"
                >
                  السؤال التالي ⬅️
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Quranic Memory Game */}
        {activeTab === 'memory' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col justify-between custom-scrollbar">
            <div>
              {/* Stats & Controls */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-300 dark:border-emerald-800">
                    الأزواج المتطابقة: {matchedPairIds.length} / {INITIAL_MEMORY_CARDS.length / 2}
                  </span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    المحاولات: {memoryMoves}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleResetMemory}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة خلط البطاقات</span>
                </button>
              </div>

              {/* Game Finished Congratulations */}
              {matchedPairIds.length === INITIAL_MEMORY_CARDS.length / 2 && (
                <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-emerald-500/20 border-2 border-amber-400 text-center animate-in zoom-in-95">
                  <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-1 animate-bounce" />
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    تبارك الله! أتممت مطابقة جميع بطاقات السور ومطالعها بنجاح!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    عدد المحاولات: {memoryMoves} | أداء رائع وتركيز متقن 🌟
                  </p>
                  <button
                    type="button"
                    onClick={handleResetMemory}
                    className="mt-2.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                  >
                    اللعب جولة جديدة 🔄
                  </button>
                </div>
              )}

              {/* Cards Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {memoryCards.map((card) => {
                  const isFlipped = flippedCardIds.includes(card.id);
                  const isMatched = matchedPairIds.includes(card.pairId);

                  if (isMatched) {
                    return (
                      <div
                        key={card.id}
                        className="h-24 sm:h-28 rounded-2xl p-2.5 border-2 border-emerald-400 bg-emerald-50/90 dark:bg-emerald-950/60 shadow-xs flex flex-col items-center justify-between text-center transition-all animate-in zoom-in-95"
                      >
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          {card.category}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 font-quran leading-snug">
                          {card.content}
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                    );
                  }

                  if (isFlipped) {
                    return (
                      <div
                        key={card.id}
                        className="h-24 sm:h-28 rounded-2xl p-2.5 border-2 border-amber-400 bg-white dark:bg-slate-800 shadow-md flex flex-col items-center justify-between text-center transition-all animate-in zoom-in-90"
                      >
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                          {card.category}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 font-quran leading-snug">
                          {card.content}
                        </span>
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                    );
                  }

                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => handleMemoryCardClick(card)}
                      className="h-24 sm:h-28 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-900 shadow-sm flex flex-col items-center justify-center p-2 text-white hover:scale-[1.03] active:scale-95 transition-all group"
                      title="انقر لكشف البطاقة"
                    >
                      <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-1 group-hover:bg-white/20 transition-colors">
                        <Sparkles className="w-4 h-4 text-amber-300" />
                      </div>
                      <span className="text-[11px] font-bold text-emerald-100/90 font-serif">
                        سبورة المستنير
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>ألعاب تعليمية مدروسة تزيد شغف وحضور ذهن الطالب في حلقة القرآن</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
