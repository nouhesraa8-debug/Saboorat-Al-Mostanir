import React, { useState } from 'react';
import {
  Award,
  Star,
  Crown,
  Trophy,
  Sparkles,
  Volume2,
  CheckCircle2,
  Heart,
  X,
  Send,
  BookOpen,
  ShieldCheck,
  Zap,
  Gem,
  Mic,
  Music,
  PartyPopper,
  RotateCcw,
} from 'lucide-react';
import {
  playVictoryChime,
  playApplause,
  playMagicTwinkle,
  playCrownFanfare,
  playSuccessDing,
  playTrumpetFanfare,
  playCheeringOvation,
  playCelebrationPopper,
  playGrandCelebrationSound,
  speakArabicPraise,
} from '../utils/soundEffects';
import { CelebrationConfettiCanvas } from './CelebrationConfettiCanvas';

interface StudentMotivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStampMedalToBoard: (medal: {
    type: string;
    title: string;
    studentName: string;
    iconText: string;
    color: string;
  }) => void;
}

interface MedalItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconText: string;
  color: string;
  gradient: string;
  playSound: () => void;
  soundLabel: string;
  speechPhrase: string;
}

export const StudentMotivationModal: React.FC<StudentMotivationModalProps> = ({
  isOpen,
  onClose,
  onStampMedalToBoard,
}) => {
  const [studentName, setStudentName] = useState('');
  const [stampedSuccess, setStampedSuccess] = useState<string | null>(null);
  const [enableVoicePraise, setEnableVoicePraise] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [celebratingItem, setCelebratingItem] = useState<{
    medal: MedalItem;
    studentName: string;
  } | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!isOpen) return null;

  const medals: MedalItem[] = [
    {
      id: 'gold_medal',
      title: 'وسام الحفظ المتقن 🥇',
      subtitle: 'للتسميع الباهر بدون أي تردد أو خطأ',
      icon: <Award className="w-8 h-8 text-amber-500" />,
      iconText: '🥇',
      color: '#d97706',
      gradient: 'from-amber-500/20 to-yellow-500/10 border-amber-400',
      playSound: () => {
        playCelebrationPopper();
        playVictoryChime();
        setTimeout(playApplause, 350);
      },
      soundLabel: 'جرس النصر والتفوق',
      speechPhrase: 'أحسنت حفظاً متقناً ورائعاً بدون تردد، بارك الله فيك!',
    },
    {
      id: 'trophy',
      title: 'كأس بطل الحلقة 🏆',
      subtitle: 'الفائز بالمركز الأول في مسابقة وتحدي اليوم',
      icon: <Trophy className="w-8 h-8 text-amber-500" />,
      iconText: '🏆',
      color: '#d97706',
      gradient: 'from-amber-500/20 to-yellow-600/10 border-amber-400',
      playSound: () => {
        playCelebrationPopper();
        playCheeringOvation();
      },
      soundLabel: 'تصفيق حماسي وأبواق النصر',
      speechPhrase: 'مبارك فوزك بالمركز الأول وكأس بطل الحلقة اليوم!',
    },
    {
      id: 'certificate',
      title: 'شهادة تفوق وإتقان رسمية 📜',
      subtitle: 'شهادة شكر وتقدير فخمة موثقة على السبورة',
      icon: <Award className="w-8 h-8 text-blue-600" />,
      iconText: '📜',
      color: '#2563eb',
      gradient: 'from-blue-500/20 to-indigo-500/10 border-blue-400',
      playSound: () => {
        playCelebrationPopper();
        playTrumpetFanfare();
        setTimeout(playApplause, 400);
      },
      soundLabel: 'نفخ الأبواق الملكية',
      speechPhrase: 'مبارك حصولك على شهادة التقدير والتفوق المتميزة!',
    },
    {
      id: 'quran_finish',
      title: 'وسام إتمام حفظ سورة كاملة 📖',
      subtitle: 'مبارك إتقان السورة وحفظ آياتها عن ظهر قلب',
      icon: <BookOpen className="w-8 h-8 text-emerald-600" />,
      iconText: '📖',
      color: '#059669',
      gradient: 'from-emerald-500/20 to-teal-500/10 border-emerald-400',
      playSound: () => {
        playCelebrationPopper();
        playCrownFanfare();
        setTimeout(playVictoryChime, 300);
      },
      soundLabel: 'معزوفة القرآن الفخمة',
      speechPhrase: 'هنيئاً لك إتمام حفظ السورة الكريمة، ثبت الله القرآن في قلبك!',
    },
    {
      id: 'crown',
      title: 'تاج الوقار القرآني 👑',
      subtitle: 'هنيئاً لك ولمن رباك على كتاب الله الكريم',
      icon: <Crown className="w-8 h-8 text-amber-600" />,
      iconText: '👑',
      color: '#b45309',
      gradient: 'from-amber-600/20 to-orange-500/10 border-amber-500',
      playSound: () => {
        playCelebrationPopper();
        playCrownFanfare();
        setTimeout(playApplause, 450);
      },
      soundLabel: 'معزوفة التاج الملكية',
      speechPhrase: 'ألبسك الله ووالديك تاج الوقار يوم القيامة!',
    },
    {
      id: 'star',
      title: 'نجمة التألق والتميز 🌟',
      subtitle: 'طالب متميز متفاعل وذكي ونشيط في الحلقة',
      icon: <Star className="w-8 h-8 text-yellow-500 fill-yellow-400" />,
      iconText: '🌟',
      color: '#eab308',
      gradient: 'from-yellow-400/20 to-amber-300/10 border-yellow-400',
      playSound: () => {
        playCelebrationPopper();
        playMagicTwinkle();
        setTimeout(playVictoryChime, 250);
      },
      soundLabel: 'رنين النجمة السحرية',
      speechPhrase: 'ما شاء الله، متألق دائماً ونجم ساطع في حلقتنا!',
    },
    {
      id: 'shield_attendance',
      title: 'درع المواظبة والانضباط 🛡️',
      subtitle: 'للحضور المبكر والحرص الدائم والالتزام',
      icon: <ShieldCheck className="w-8 h-8 text-indigo-600" />,
      iconText: '🛡️',
      color: '#4f46e5',
      gradient: 'from-indigo-500/20 to-blue-500/10 border-indigo-400',
      playSound: () => {
        playCelebrationPopper();
        playVictoryChime();
        setTimeout(playApplause, 300);
      },
      soundLabel: 'جرس الانضباط والهمة',
      speechPhrase: 'أحسنت مواظبتك وحرصك الدائم، زادك الله همة وتوفيقاً!',
    },
    {
      id: 'speed_smart',
      title: 'وسام الذكاء وسرعة البديهة ⚡',
      subtitle: 'سرعة بديهة وإجابة نموذجية دقيقة وفورية',
      icon: <Zap className="w-8 h-8 text-orange-500 fill-orange-400" />,
      iconText: '⚡',
      color: '#ea580c',
      gradient: 'from-orange-500/20 to-amber-500/10 border-orange-400',
      playSound: () => {
        playCelebrationPopper();
        playSuccessDing();
        setTimeout(playVictoryChime, 200);
      },
      soundLabel: 'رنين الإجابة السريعة',
      speechPhrase: 'إجابة عبقرية سريعة ومتقنة، أحسنت يا ذكي!',
    },
    {
      id: 'ethics',
      title: 'وسام الأدب وحسن الخلق 💖',
      subtitle: 'خيركم من تعلم القرآن وعمل بأخلاقه الفاضلة',
      icon: <Heart className="w-8 h-8 text-rose-500 fill-rose-400" />,
      iconText: '💖',
      color: '#e11d48',
      gradient: 'from-rose-500/20 to-pink-500/10 border-rose-400',
      playSound: () => {
        playCelebrationPopper();
        playVictoryChime();
        setTimeout(playMagicTwinkle, 300);
      },
      soundLabel: 'نغمة التقدير والمحبة',
      speechPhrase: 'بارك الله في خلقك وأدبك الرفيع، فخر لوالديك ومعلمتك!',
    },
    {
      id: 'gem_virtue',
      title: 'جوهرة الأخلاق والوقار 💎',
      subtitle: 'قدوة حسنة لأقرانه في الأدب والسمت القرآني',
      icon: <Gem className="w-8 h-8 text-cyan-600" />,
      iconText: '💎',
      color: '#0891b2',
      gradient: 'from-cyan-500/20 to-teal-500/10 border-cyan-400',
      playSound: () => {
        playCelebrationPopper();
        playCrownFanfare();
        setTimeout(playApplause, 350);
      },
      soundLabel: 'معزوفة الجوهرة الفخمة',
      speechPhrase: 'أنت جوهرة ثمينة بحسن سمتك وأخلاقك العالية!',
    },
    {
      id: 'tajweed',
      title: 'شارة التجويد والترتيل 🎖️',
      subtitle: 'إتقان تام لمخارج الحروف والمدود وأحكام التلاوة',
      icon: <Sparkles className="w-8 h-8 text-emerald-600" />,
      iconText: '🎖️',
      color: '#059669',
      gradient: 'from-emerald-500/20 to-teal-500/10 border-emerald-400',
      playSound: () => {
        playCelebrationPopper();
        playCrownFanfare();
        setTimeout(playSuccessDing, 250);
      },
      soundLabel: 'رنين الإتقان والبراعة',
      speechPhrase: 'ترتيل متقن وأحكام تجويد سليمة وواضحة، أحسنت!',
    },
    {
      id: 'humble_voice',
      title: 'شارة التلاوة الخاشعة 🕊️',
      subtitle: 'صوت ندي خاشع يدخل القلوب بجمال الأداء',
      icon: <Music className="w-8 h-8 text-teal-600" />,
      iconText: '🕊️',
      color: '#0d9488',
      gradient: 'from-teal-500/20 to-emerald-500/10 border-teal-400',
      playSound: () => {
        playCelebrationPopper();
        playMagicTwinkle();
        setTimeout(playCrownFanfare, 300);
      },
      soundLabel: 'نغمة السكينة والخشوع',
      speechPhrase: 'ما شاء الله على هذا الصوت الندي الخاشع، فتح الله عليك!',
    },
  ];

  const handleGiveMedal = (medal: MedalItem) => {
    const name = studentName.trim() || 'الطالب المتميز';

    // 1. Play high-fidelity grand celebration audio suite
    setIsPlayingAudio(true);
    playGrandCelebrationSound(medal.id);
    setTimeout(() => setIsPlayingAudio(false), 3800);

    // 2. Speak teacher voice praise if enabled
    if (enableVoicePraise) {
      setTimeout(() => {
        speakArabicPraise(medal.speechPhrase, name);
      }, 500);
    }

    // 3. Trigger falling confetti canvas
    setShowConfetti(true);

    // 4. Activate Celebration Spotlight overlay
    setCelebratingItem({ medal, studentName: name });

    // 5. Stamp to whiteboard
    onStampMedalToBoard({
      type: medal.id,
      title: medal.title,
      studentName: name,
      iconText: medal.iconText,
      color: medal.color,
    });

    setStampedSuccess(`تم إهداء ${medal.title} للطالب (${name}) بنجاح على السبورة! 🎉`);
    setTimeout(() => setStampedSuccess(null), 4000);
  };

  const handleReplayCelebration = () => {
    if (!celebratingItem) return;
    setIsPlayingAudio(true);
    playGrandCelebrationSound(celebratingItem.medal.id);
    setShowConfetti(true);
    if (enableVoicePraise) {
      setTimeout(() => {
        speakArabicPraise(celebratingItem.medal.speechPhrase, celebratingItem.studentName);
      }, 500);
    }
    setTimeout(() => setIsPlayingAudio(false), 3800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      {/* 1. Ultra-Vibrant Falling Confetti Canvas System */}
      <CelebrationConfettiCanvas
        active={showConfetti}
        durationMs={4800}
        onComplete={() => setShowConfetti(false)}
      />

      {/* 2. Visual Celebration Spotlight & Banner Overlay */}
      {celebratingItem && (
        <div
          className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200 select-none"
          dir="rtl"
        >
          {/* Rotating Sunburst Halo Background */}
          <div className="absolute w-[500px] h-[500px] rounded-full bg-radial from-amber-400/35 via-yellow-500/15 to-transparent blur-2xl pointer-events-none" />

          <div className="relative bg-gradient-to-b from-white via-amber-50/50 to-white dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl border-2 border-amber-400/80 overflow-hidden">
            {/* Top decorative badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-yellow-500/20 border border-amber-400/60 text-amber-900 dark:text-amber-200 text-xs font-black mb-4 shadow-xs">
              <PartyPopper className="w-4 h-4 text-amber-600 animate-bounce" />
              <span>مبارك التكريم والتفوق المستحق! ✨</span>
            </div>

            {/* Glowing Medal Icon with Pulsing Rings */}
            <div className="relative my-2 inline-flex items-center justify-center">
              <div className="absolute -inset-4 rounded-full bg-amber-400/30 blur-md animate-pulse" />
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-1 shadow-xl flex items-center justify-center transform hover:scale-105 transition-transform">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[22px] flex items-center justify-center">
                  <span className="text-5xl sm:text-6xl drop-shadow-md">
                    {celebratingItem.medal.iconText}
                  </span>
                </div>
              </div>
            </div>

            {/* Student Name in prominent luxury gold */}
            <div className="mt-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                تم تكريم الطالب البطل:
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-300 mt-1 tracking-tight">
                {celebratingItem.studentName}
              </h3>
            </div>

            {/* Medal Title & Description */}
            <div className="mt-2.5 px-4 py-2 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-400/40">
              <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {celebratingItem.medal.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                {celebratingItem.medal.subtitle}
              </p>
            </div>

            {/* Live Audio Equalizer Waves */}
            <div className="my-4 flex items-center justify-center gap-1.5 h-6">
              <div className="w-1 bg-amber-500 rounded-full animate-sound-bar-1" />
              <div className="w-1 bg-amber-500 rounded-full animate-sound-bar-2" />
              <div className="w-1 bg-amber-500 rounded-full animate-sound-bar-3" />
              <div className="w-1 bg-amber-500 rounded-full animate-sound-bar-4" />
              <div className="w-1 bg-amber-500 rounded-full animate-sound-bar-5" />
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 mr-2">
                {isPlayingAudio ? 'تتعالى أصوات النصر والتصفيق!' : 'تم توثيق الوسام على السبورة'}
              </span>
            </div>

            {/* Praise Quote */}
            <div className="text-xs text-slate-600 dark:text-slate-300 italic mb-5 px-3">
              «{celebratingItem.medal.speechPhrase}»
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleReplayCelebration}
                className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 border border-amber-300 dark:border-amber-700 shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة أصوات الفرحة والاحتفال 🎺</span>
              </button>

              <button
                type="button"
                onClick={() => setCelebratingItem(null)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black transition-all active:scale-95 flex items-center gap-1.5 shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>متابعة الحصة التعليمية ✨</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Modal Card */}
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-amber-400/50 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 text-white px-5 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shadow-xs">
              <Award className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
                <span>لوحة الأوسمة والتحفيز التفاعلية</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/25 font-bold shadow-xs">
                  أصوات واقعية + قصاصات احتفالية
                </span>
              </h2>
              <p className="text-[11px] text-amber-100 font-medium">
                شجّع طلابك بأصوات النصر والتشجيع وتصفيق الجمهور، واختم الوسام باسم الطالب على السبورة فوراً
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

        {/* Student Name & Voice Option Bar */}
        <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border-b border-amber-200/60 dark:border-amber-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 w-full sm:w-2/3">
            <label className="text-xs font-black text-amber-950 dark:text-amber-200 shrink-0">
              اسم الطالب المكرم:
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="اكتب اسم الطالب هنا (مثال: عبدالرحمن أحمد)..."
              className="w-full text-xs font-bold px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200 cursor-pointer self-start sm:self-auto bg-amber-100/70 dark:bg-amber-900/40 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700">
            <input
              type="checkbox"
              checked={enableVoicePraise}
              onChange={(e) => setEnableVoicePraise(e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
            />
            <Mic className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
            <span>نطق التشجيع بصوت المعلمة</span>
          </label>
        </div>

        {/* Quick Soundboard & Grand Celebration Bar */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-emerald-600" />
            مؤثرات وأصوات احتفالية واقعية:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setShowConfetti(true);
                playGrandCelebrationSound();
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-xs font-black transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
              title="إطلاق قصاصات الورق الاحتفالية مع المعزوفة الفخمة"
            >
              <PartyPopper className="w-4 h-4" />
              <span>🎊 إطلاق الاحتفال الأكبر</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playCelebrationPopper();
                playApplause();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-200 text-xs font-bold transition-all active:scale-95 flex items-center gap-1 border border-emerald-300 dark:border-emerald-700 shadow-2xs"
            >
              <span>👏 تصفيق جماعي حار</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playCelebrationPopper();
                playTrumpetFanfare();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 text-xs font-bold transition-all active:scale-95 flex items-center gap-1 border border-amber-300 dark:border-amber-700 shadow-2xs"
            >
              <span>🎺 أبواق النصر</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playCelebrationPopper();
                playCrownFanfare();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-950 dark:hover:bg-yellow-900 text-yellow-900 dark:text-yellow-200 text-xs font-bold transition-all active:scale-95 flex items-center gap-1 border border-yellow-300 dark:border-yellow-700 shadow-2xs"
            >
              <span>👑 تتويج الوقار</span>
            </button>
            <button
              type="button"
              onClick={() => speakArabicPraise('أحسنت يا بطل، إجابة ممتازة وبارك الله فيك!', studentName)}
              className="px-2.5 py-1.5 rounded-xl bg-blue-100 hover:bg-blue-200 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-900 dark:text-blue-200 text-xs font-bold transition-all active:scale-95 flex items-center gap-1 border border-blue-300 dark:border-blue-700 shadow-2xs"
            >
              <Mic className="w-3.5 h-3.5 text-blue-600" />
              <span>صوت: «أحسنت يا بطل!»</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {stampedSuccess && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-between shadow-lg animate-in zoom-in-95">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {stampedSuccess}
            </span>
            <button
              type="button"
              onClick={() => setStampedSuccess(null)}
              className="hover:opacity-80 text-white text-xs font-bold px-2 py-0.5 rounded"
            >
              ✕
            </button>
          </div>
        )}

        {/* Medals Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {medals.map((m) => (
            <div
              key={m.id}
              onClick={() => handleGiveMedal(m)}
              className={`p-4 rounded-2xl border bg-gradient-to-br ${m.gradient} flex flex-col justify-between transition-all hover:shadow-lg hover:scale-[1.015] cursor-pointer group relative overflow-hidden`}
            >
              {/* Subtle hover sparkle glow indicator */}
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Sparkles className="w-4 h-4 text-amber-500 animate-spin-slow" />
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-slate-700 shrink-0 group-hover:scale-110 transition-transform">
                  {m.icon}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{m.title}</span>
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed font-medium">
                    {m.subtitle}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                className="mt-3.5 pt-2.5 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    m.playSound();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white/95 dark:bg-slate-800 hover:bg-white text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1 border border-slate-300/80 dark:border-slate-700 transition-all active:scale-95 shadow-2xs"
                  title="استماع إلى الصوت التشجيعي"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>{m.soundLabel}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGiveMedal(m);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-[11px] flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                  title="وضع الختم والوسام على السبورة باسم الطالب وإطلاق الاحتفال"
                >
                  <Send className="w-3.5 h-3.5 rotate-180" />
                  <span>إهداء واحتفال 🎉</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium">
            النقر على أي وسام يُطلق المؤثرات الاحتفالية والأصوات الواقعية فوراً ويختمه على السبورة
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
