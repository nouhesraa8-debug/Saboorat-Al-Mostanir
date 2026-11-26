import React, { useState, useEffect } from 'react';
import defaultLogoImage from '../assets/images/almustanir_academy_logo_1789066569620.jpg';

interface OfficialLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showAcademyTitle?: boolean;
}

export const OfficialLogo: React.FC<OfficialLogoProps> = ({
  className = '',
  size = 'md',
  showAcademyTitle = false,
}) => {
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('almustanir_official_logo');
    if (saved) {
      setCustomLogoUrl(saved);
    }
  }, []);

  const dimensions = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`relative ${dimensions} rounded-full overflow-hidden shadow-md flex items-center justify-center shrink-0 border-2 border-amber-400/70 bg-[#0d5940] transition-transform hover:scale-105`}
        title="شعار أكاديمية المستنير لتحفيظ القرآن الكريم"
      >
        {!imageError ? (
          <img
            src={customLogoUrl || defaultLogoImage || '/logo.png'}
            alt="شعار أكاديمية المستنير لتحفيظ القرآن الكريم"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => {
              setImageError(true);
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#f7d984] text-[#0d5940] p-1 text-center font-bold">
            <span className="text-[9px] leading-tight">المستنير</span>
          </div>
        )}
      </div>

      {showAcademyTitle && (
        <div className="flex flex-col text-right">
          <span className="text-sm font-black text-emerald-950 dark:text-emerald-100 leading-tight">
            أكاديمية المستنير
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 leading-tight">
            لتحفيظ القرآن الكريم
          </span>
        </div>
      )}
    </div>
  );
};

