import React, { useState } from 'react';
import { Share2, Monitor, Video, Copy, Check, X, Users, ArrowLeft, ExternalLink } from 'lucide-react';

interface ScreenShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string | null;
  onStartSessionIfNeeded: () => void;
}

export const ScreenShareModal: React.FC<ScreenShareModalProps> = ({
  isOpen,
  onClose,
  roomId,
  onStartSessionIfNeeded,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'meet' | 'zoom'>('meet');

  if (!isOpen) return null;

  const currentUrl = window.location.origin + window.location.pathname;
  const studentJoinLink = roomId
    ? `${currentUrl}?room=${roomId}&role=student`
    : `${currentUrl}?role=student`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(studentJoinLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-blue-500/30 w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">مشاركة السبورة أثناء الحصص الافتراضية</h2>
              <p className="text-xs text-blue-100">
                كيفية عرض السبورة والتفاعل المباشر عبر Google Meet و Zoom
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Dual Experience Explanation Box */}
          <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-xs leading-relaxed text-blue-900 dark:text-blue-200">
            <div className="font-bold text-sm mb-1.5 flex items-center gap-1.5 text-blue-950 dark:text-blue-100">
              <Monitor className="w-4 h-4 text-blue-600" />
              <span>أفضل تجربة تدريس تفاعلية (صوت + فيديو + سبورة حية):</span>
            </div>
            <p>
              أنت كمعلم تقوم بمشاركة <strong>تبويب سبورة المستنير</strong> عبر شاشة الاجتماع ليشاهد الطلاب شرحك بوضوح، وفي نفس الوقت ترسل لهم <strong>رابط الفصل التفاعلي</strong> ليتمكنوا من الكتابة وحل التمارين على السبورة مباشرة من أجهزتهم عند إعطائهم الإذن!
            </p>
          </div>

          {/* Interactive Session Quick Access */}
          <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                بيانات ربط الطلاب بالسبورة
              </span>
              {!roomId && (
                <button
                  type="button"
                  onClick={onStartSessionIfNeeded}
                  className="text-xs px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs active:scale-95"
                >
                  بدء فصل تفاعلي الآن
                </button>
              )}
            </div>

            {roomId ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">كود الجلسة:</span>
                    <span className="font-mono text-base font-bold text-emerald-600 tracking-wider">
                      {roomId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-2.5 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center gap-1 font-medium"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'تم النسخ' : 'نسخ الكود'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col truncate ml-2">
                    <span className="text-[11px] text-slate-400">رابط انضمام الطلاب المباشر:</span>
                    <span className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate" dir="ltr">
                      {studentJoinLink}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 font-bold shrink-0 shadow-xs active:scale-95"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'تم نسخ الرابط' : 'نسخ رابط الطالب'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-2">
                اضغط زر &quot;بدء فصل تفاعلي&quot; أعلاه لإنشاء رمز جلسة خاص لمشاركته مع طلابك.
              </p>
            )}
          </div>

          {/* Tab Selector: Google Meet vs Zoom */}
          <div>
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-3">
              <button
                type="button"
                onClick={() => setActivePlatform('meet')}
                className={`pb-2 px-4 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
                  activePlatform === 'meet'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>خطوات Google Meet</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePlatform('zoom')}
                className={`pb-2 px-4 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
                  activePlatform === 'zoom'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>خطوات Zoom</span>
              </button>
            </div>

            {/* Guide Steps */}
            {activePlatform === 'meet' ? (
              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <p>
                    في نافذة اجتماع <strong>Google Meet</strong>، اضغط على زر <strong>&quot;مشاركة العرض الآن&quot;</strong> (أيقونة المربع ذو السهم في الشريط السفلي).
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <p>
                    اختر خيار <strong>&quot;علامة تبويب Chrome / Tab&quot;</strong> ثم حدد تبويب <strong>&quot;سبورة المستنير&quot;</strong> (هذا الخيار يمنح الطلاب أعلى سلاسة في الرسوم وحركة الأقلام).
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <p>
                    أرسل <strong>رابط الطالب</strong> في شات Google Meet ليفتحه الطلاب من هواتفهم أو أجهزتهم للتفاعل وحل الأسئلة المباشرة.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <p>
                    في نافذة <strong>Zoom</strong>، اضغط على زر <strong>&quot;Share Screen / مشاركة الشاشة&quot;</strong> باللون الأخضر.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <p>
                    اختر نافذة المتصفح التي تفتح <strong>سبورة المستنير</strong> واضغط زر <strong>Share</strong>.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <p>
                    شارك كود الجلسة أو رابط الطالب عبر شات Zoom، وتحكم في صلاحيات كتابة الطلاب من شريط السبورة بكل أمان وسهولة.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-lg"
          >
            حسناً، فهمت
          </button>
        </div>
      </div>
    </div>
  );
};
