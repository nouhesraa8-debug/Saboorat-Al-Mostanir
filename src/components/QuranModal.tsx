import React, { useState, useEffect } from 'react';
import { SURAH_LIST, fetchSurahVerses } from '../data/quranData';
import { QuranAyah, SurahMeta } from '../types';
import { Search, ZoomIn, ZoomOut, Copy, Send, Check, BookOpen, X, Loader2 } from 'lucide-react';

interface QuranModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertVerseToBoard: (text: string, surahName: string, ayahNum: number) => void;
}

export const QuranModal: React.FC<QuranModalProps> = ({
  isOpen,
  onClose,
  onInsertVerseToBoard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<SurahMeta>(SURAH_LIST[0]); // Al-Fatiha
  const [ayahs, setAyahs] = useState<QuranAyah[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAyahNumber, setSelectedAyahNumber] = useState<number>(1);
  const [fontSize, setFontSize] = useState<number>(24);
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);

  // Load ayahs when surah changes
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;
    setLoading(true);
    fetchSurahVerses(selectedSurah.number)
      .then((res) => {
        if (!isCancelled) {
          setAyahs(res);
          setSelectedAyahNumber(1);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error(err);
          setLoading(false);
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [selectedSurah, isOpen]);

  if (!isOpen) return null;

  const filteredSurahs = SURAH_LIST.filter(
    (s) =>
      s.name.includes(searchQuery.trim()) ||
      s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.number.toString() === searchQuery.trim()
  );

  const currentAyah = ayahs.find((a) => a.numberInSurah === selectedAyahNumber) || ayahs[0];

  const handleCopyAyah = (text: string, num: number) => {
    const formatted = `﴿ ${text} ﴾ [${selectedSurah.name}: ${num}]`;
    navigator.clipboard.writeText(formatted).then(() => {
      setCopiedAyah(num);
      setTimeout(() => setCopiedAyah(null), 2000);
    });
  };

  const handleSendToBoard = (ayah: QuranAyah) => {
    const verseText = `﴿ ${ayah.text} ﴾\n[سورة ${selectedSurah.name} - الآية ${ayah.numberInSurah}]`;
    onInsertVerseToBoard(verseText, selectedSurah.name, ayah.numberInSurah);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-emerald-500/30 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white px-5 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-600/60 border border-emerald-400/40 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">القرآن الكريم للتعليم والتحفيظ</h2>
              <p className="text-[11px] text-emerald-100/90">
                نصوص موثقة برسم المصحف الشريف لإدراجها مباشرة على السبورة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-colors text-white"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Left Column: Surah List and Search */}
          <div className="w-full md:w-72 border-b md:border-b-0 md:border-l border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/70 dark:bg-slate-950/40 shrink-0">
            {/* Search Input */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث عن سورة بالاسم أو الرقم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              </div>
            </div>

            {/* Surah List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
              {filteredSurahs.map((surah) => (
                <button
                  key={surah.number}
                  type="button"
                  onClick={() => setSelectedSurah(surah)}
                  className={`w-full text-right px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors ${
                    selectedSurah.number === surah.number
                      ? 'bg-emerald-100/80 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200/80 dark:bg-slate-800 text-[11px] font-mono flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                      {surah.number}
                    </span>
                    <span className="text-sm font-semibold">{surah.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {surah.numberOfAyahs} آية
                  </span>
                </button>
              ))}
              {filteredSurahs.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400">
                  لم يتم العثور على سورة بهذا الاسم
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Verses display and insertion */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
            {/* Top Surah Title & Controls */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  سورة {selectedSurah.name}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
                  {selectedSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                </span>
                <span className="text-xs text-slate-500">
                  (عدد آياتها: {selectedSurah.numberOfAyahs})
                </span>
              </div>

              {/* Font Sizer Controls */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 ml-1">حجم الخط:</span>
                <button
                  type="button"
                  onClick={() => setFontSize((s) => Math.max(16, s - 3))}
                  className="p-1 rounded bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200"
                  title="تصغير الخط"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-mono font-bold w-6 text-center">{fontSize}</span>
                <button
                  type="button"
                  onClick={() => setFontSize((s) => Math.min(48, s + 3))}
                  className="p-1 rounded bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200"
                  title="تكبير الخط"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Verses List / Reader */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <Loader2 className="w-7 h-7 animate-spin" />
                  <span className="text-xs font-medium">جاري تحميل الآيات بالرسم العثماني...</span>
                </div>
              ) : ayahs.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                  لا توجد آيات متوفرة حالياً، يرجى التحقق من الاتصال.
                </div>
              ) : (
                <>
                  {/* Surah Header Decoration */}
                  <div className="text-center py-2 mb-4">
                    <div className="inline-block px-6 py-1.5 rounded-full border border-amber-300/80 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-quran text-lg font-bold shadow-xs">
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </div>
                  </div>

                  {/* List of Ayahs */}
                  <div className="space-y-3">
                    {ayahs.map((ayah) => (
                      <div
                        key={ayah.numberInSurah}
                        className={`p-3.5 rounded-xl border transition-all ${
                          selectedAyahNumber === ayah.numberInSurah
                            ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
                        }`}
                        onClick={() => setSelectedAyahNumber(ayah.numberInSurah)}
                      >
                        <div
                          className="font-quran leading-loose text-slate-900 dark:text-slate-100 text-right"
                          style={{ fontSize: `${fontSize}px` }}
                        >
                          {ayah.text}{' '}
                          <span className="inline-block text-amber-600 dark:text-amber-400 font-bold mx-1 text-sm font-sans">
                            ﴿{ayah.numberInSurah}﴾
                          </span>
                        </div>

                        {/* Action buttons per ayah */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-slate-400 font-medium">
                            الآية {ayah.numberInSurah} من سورة {selectedSurah.name}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {/* Copy button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyAyah(ayah.text, ayah.numberInSurah);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 active:scale-95 transition-transform"
                              title="نسخ الآية"
                            >
                              {copiedAyah === ayah.numberInSurah ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-600">تم النسخ</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                                  <span>نسخ</span>
                                </>
                              )}
                            </button>

                            {/* Send to Whiteboard button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendToBoard(ayah);
                              }}
                              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1 shadow-xs active:scale-95 transition-transform"
                              title="إرسال الآية إلى السبورة للشرح والتحفيظ"
                            >
                              <Send className="w-3.5 h-3.5 rotate-180" />
                              <span>إرسال إلى السبورة</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
