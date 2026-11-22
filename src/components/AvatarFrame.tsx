import React, { useState } from 'react';

interface AvatarFrameProps {
  avatarUrl?: string;
  name: string;
  sizeClass?: string;
  className?: string;
  showRatioCaption?: boolean;
  onEditClick?: () => void;
}

export const AvatarFrame: React.FC<AvatarFrameProps> = ({
  avatarUrl,
  name,
  sizeClass = 'w-32 h-32',
  className = '',
  showRatioCaption = false,
  onEditClick,
}) => {
  const [imgError, setImgError] = useState(false);

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AA';

  const hasValidImage = Boolean(avatarUrl && avatarUrl.trim().length > 0 && !imgError);

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div
        className={`relative aspect-square ${sizeClass} rounded-xl p-[2px] bg-gradient-to-br from-[#F3E5AB] via-[#D4AF37] to-[#8C6C15] shadow-[0_12px_32px_-8px_rgba(212,175,55,0.28)] gold-sheen-container group`}
      >
        <div className="w-full h-full rounded-[10px] overflow-hidden bg-[#0A0C0E] relative flex items-center justify-center">
          {hasValidImage ? (
            <img
              src={avatarUrl}
              alt={`${name} — Executive Portrait (1:1)`}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-[#15181E] via-[#0E1116] to-[#0A0C0E] flex flex-col items-center justify-center select-none px-3 text-center">
              <span className="font-display font-bold text-3xl sm:text-4xl tracking-[0.14em] gold-gradient-text leading-none">
                {initials}
              </span>
              <span className="mt-2 text-[10px] font-mono tracking-[0.22em] text-[#D4AF37]/80 uppercase">
                Rasio 1:1
              </span>
            </div>
          )}

          {onEditClick && (
            <button
              type="button"
              onClick={onEditClick}
              aria-label="Ubah Foto Profil 1:1"
              className="absolute inset-0 bg-[#0A0C0E]/75 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-200 flex items-center justify-center text-xs font-semibold text-[#F3E5AB] tracking-wide cursor-pointer"
            >
              Ganti Foto 1:1
            </button>
          )}
        </div>
      </div>

      {showRatioCaption && (
        <span className="mt-2.5 text-[11px] font-mono text-[#D4AF37]/80 tabular-nums">
          Proporsi 1:1 · WebP Retina
        </span>
      )}
    </div>
  );
};
