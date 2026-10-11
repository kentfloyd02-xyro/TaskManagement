import React from 'react';
import { BASE_AVATARS, BG_GRADIENTS, parseAvatar } from '../../data/avatars';

/**
 * UserAvatar: Scalable 3D Cartoon / Memoji Student Avatar Component
 * 100% Vector SVG, pure offline support, customizable base, hair, accessories & background.
 */
const UserAvatar = ({
  user,
  avatarConfig,
  gender,
  size = 'md',
  className = '',
  onClick,
  showBadge = false,
  badgeText,
}) => {
  // Determine avatar properties
  const rawAvatar = avatarConfig || user?.avatar;
  const userGender = gender || user?.gender || 'male';
  const config = parseAvatar(rawAvatar, userGender);

  const base = BASE_AVATARS.find((b) => b.id === config.base) || BASE_AVATARS[0];
  const bg = BG_GRADIENTS.find((g) => g.id === config.bg) || BG_GRADIENTS[0];
  const accessory = config.accessory || 'none';

  // Dimension mapping
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-lg',
    '2xl': 'w-28 h-28 text-xl',
  };

  const containerClass = sizeClasses[size] || sizeClasses.md;

  // Render SVG Character
  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''
      } ${containerClass} ${className}`}
      title={user?.name || base.name}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full rounded-full shadow-md overflow-hidden"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Background Gradient */}
          <linearGradient id={`bg-${config.bg}-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={bg.from} />
            <stop offset="50%" stopColor={bg.via} />
            <stop offset="100%" stopColor={bg.to} />
          </linearGradient>

          {/* Skin Gradient for 3D depth */}
          <linearGradient id={`skin-${base.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={base.skin} />
            <stop offset="100%" stopColor={base.skinShadow} />
          </linearGradient>

          {/* Outfit Gradient */}
          <linearGradient id={`outfit-${base.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={base.outfitColor} />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Hair Sheen */}
          <linearGradient id={`hair-${base.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={base.hairColor} />
            <stop offset="60%" stopColor={base.hairColor} />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>
        </defs>

        {/* 1. Background Circle */}
        <circle cx="50" cy="50" r="50" fill={`url(#bg-${config.bg}-${size})`} />

        {/* 2. Background Glow / Ring */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.25" />

        {/* 3. Back Hair (for long hairstyles) */}
        {base.hairType === 'long-wavy' && (
          <path
            d="M26 44 C20 54, 18 78, 22 92 C26 78, 30 68, 32 58 Z M74 44 C80 54, 82 78, 78 92 C74 78, 70 68, 68 58 Z"
            fill={base.hairColor}
          />
        )}
        {base.hairType === 'high-ponytail' && (
          <g>
            {/* Scrunchie */}
            <circle cx="70" cy="30" r="6" fill={base.outfitColor} />
            {/* Ponytail Hair Swing */}
            <path
              d="M72 30 C86 36, 88 56, 82 72 C78 62, 76 46, 68 34 Z"
              fill={base.hairColor}
            />
          </g>
        )}
        {base.hairType === 'top-bun' && (
          <ellipse cx="50" cy="19" rx="14" ry="12" fill={base.hairColor} />
        )}

        {/* 4. Outfit / Shoulders */}
        <path
          d="M18 100 C18 78, 32 72, 50 72 C68 72, 82 78, 82 100 Z"
          fill={`url(#outfit-${base.id})`}
        />
        {/* Collar / V-neck */}
        <path
          d="M42 72 L50 82 L58 72 C55 77, 45 77, 42 72 Z"
          fill={base.outfitAccent}
        />
        {/* Hoodie cords or jacket zip */}
        <line x1="50" y1="82" x2="50" y2="100" stroke={base.outfitAccent} strokeWidth="1.5" strokeOpacity="0.7" />

        {/* 5. Neck */}
        <rect x="44" y="60" width="12" height="15" rx="3" fill={`url(#skin-${base.id})`} />
        {/* Neck shadow under chin */}
        <ellipse cx="50" cy="62" rx="7" ry="2.5" fill="#000000" fillOpacity="0.18" />

        {/* 6. Ears */}
        <ellipse cx="28" cy="52" rx="4.5" ry="6" fill={`url(#skin-${base.id})`} />
        <ellipse cx="72" cy="52" rx="4.5" ry="6" fill={`url(#skin-${base.id})`} />
        <ellipse cx="28.5" cy="52" rx="2.5" ry="3.5" fill="#000000" fillOpacity="0.1" />
        <ellipse cx="71.5" cy="52" rx="2.5" ry="3.5" fill="#000000" fillOpacity="0.1" />

        {/* 7. Head / Face Shape */}
        <ellipse cx="50" cy="49" rx="21" ry="23" fill={`url(#skin-${base.id})`} />

        {/* 8. Cheeks (Soft cute blush) */}
        <circle cx="37" cy="54" r="3.5" fill="#f43f5e" fillOpacity="0.22" />
        <circle cx="63" cy="54" r="3.5" fill="#f43f5e" fillOpacity="0.22" />

        {/* 9. Eyes */}
        {/* Left Eye */}
        <g>
          <ellipse cx="40" cy="47" rx="3.5" ry="4.5" fill="#1e293b" />
          <circle cx="39" cy="45" r="1.4" fill="white" />
          <circle cx="41.5" cy="48" r="0.7" fill="white" />
        </g>
        {/* Right Eye */}
        <g>
          <ellipse cx="60" cy="47" rx="3.5" ry="4.5" fill="#1e293b" />
          <circle cx="59" cy="45" r="1.4" fill="white" />
          <circle cx="61.5" cy="48" r="0.7" fill="white" />
        </g>

        {/* 10. Eyebrows */}
        <path d="M35 41 Q40 39, 44 41" stroke={base.hairColor} strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M56 41 Q60 39, 65 41" stroke={base.hairColor} strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* 11. Nose */}
        <path d="M49 49 Q50 52, 52 52" stroke="#a16207" strokeWidth="1.2" strokeLinecap="round" fill="none" strokeOpacity="0.35" />

        {/* 12. Mouth / Friendly Smile */}
        <path d="M44 56 Q50 61, 56 56" stroke="#e11d48" strokeWidth="1.8" strokeLinecap="round" fill="#ffe4e6" fillOpacity="0.5" />

        {/* 13. Front Hair Styles */}
        {/* Short Fade (Male 1) */}
        {base.hairType === 'short-fade' && (
          <path
            d="M28 44 C28 26, 42 22, 50 22 C60 22, 72 26, 72 44 C72 38, 68 32, 59 31 C51 30, 44 33, 37 32 C31 34, 28 39, 28 44 Z"
            fill={`url(#hair-${base.id})`}
          />
        )}

        {/* Side Part (Male 2) */}
        {base.hairType === 'side-part' && (
          <path
            d="M28 46 C27 28, 40 22, 52 22 C66 22, 74 30, 72 46 C70 34, 62 30, 50 32 C38 34, 32 38, 28 46 Z"
            fill={`url(#hair-${base.id})`}
          />
        )}

        {/* Curly Top (Male 3) */}
        {base.hairType === 'curly-top' && (
          <g fill={`url(#hair-${base.id})`}>
            <circle cx="34" cy="30" r="7" />
            <circle cx="44" cy="24" r="8" />
            <circle cx="56" cy="24" r="8" />
            <circle cx="66" cy="30" r="7" />
            <circle cx="38" cy="36" r="6" />
            <circle cx="62" cy="36" r="6" />
          </g>
        )}

        {/* Spiky Anime (Male 4) */}
        {base.hairType === 'spiky-anime' && (
          <path
            d="M28 44 L32 30 L40 33 L44 20 L52 28 L60 18 L63 30 L72 32 L72 44 C67 36, 60 33, 50 34 C40 35, 34 38, 28 44 Z"
            fill={`url(#hair-${base.id})`}
          />
        )}

        {/* Curtain Hair (Male 5) */}
        {base.hairType === 'curtains' && (
          <path
            d="M28 48 C27 28, 42 24, 50 24 C58 24, 73 28, 72 48 C68 38, 59 34, 52 38 C51 38, 49 38, 48 38 C41 34, 32 38, 28 48 Z"
            fill={`url(#hair-${base.id})`}
          />
        )}

        {/* Textured Fade (Male 6) */}
        {base.hairType === 'textured-fade' && (
          <path
            d="M29 44 C28 30, 38 25, 50 25 C62 25, 72 30, 71 44 C68 34, 60 30, 50 30 C40 30, 32 34, 29 44 Z"
            fill={`url(#hair-${base.id})`}
          />
        )}

        {/* High Ponytail Front (Female 1) */}
        {base.hairType === 'high-ponytail' && (
          <path
            d="M28 46 C28 26, 42 24, 50 24 C60 24, 72 26, 72 46 C68 35, 58 31, 50 33 C42 31, 32 35, 28 46 Z"
            fill={`url(#hair-${base.id})`}
          />
        )}

        {/* Bob Cut (Female 2) */}
        {base.hairType === 'bob-cut' && (
          <path
            d="M26 58 C25 32, 36 23, 50 23 C64 23, 75 32, 74 58 C70 54, 70 38, 62 33 C54 30, 46 30, 38 33 C30 38, 30 54, 26 58 Z"
            fill={`url(#hair-${base.id})`}
          />
        )}

        {/* Long Wavy Front (Female 3) */}
        {base.hairType === 'long-wavy' && (
          <path
            d="M27 62 C26 30, 36 23, 50 23 C64 23, 74 30, 73 62 C69 52, 68 35, 58 32 C50 30, 42 32, 32 35 C31 46, 30 54, 27 62 Z"
            fill={`url(#hair-${base.id})`}
          />
        )}

        {/* Top Bun Front (Female 4) */}
        {base.hairType === 'top-bun' && (
          <path
            d="M28 46 C28 28, 40 25, 50 25 C60 25, 72 28, 72 46 C67 36, 58 33, 50 34 C42 33, 33 36, 28 46 Z"
            fill={`url(#hair-${base.id})`}
          />
        )}

        {/* Curly Afro (Female 5) */}
        {base.hairType === 'curly-afro' && (
          <g fill={`url(#hair-${base.id})`}>
            <circle cx="28" cy="40" r="9" />
            <circle cx="34" cy="27" r="9" />
            <circle cx="50" cy="22" r="10" />
            <circle cx="66" cy="27" r="9" />
            <circle cx="72" cy="40" r="9" />
            <circle cx="38" cy="34" r="7" />
            <circle cx="62" cy="34" r="7" />
          </g>
        )}

        {/* Straight with Bangs (Female 6) */}
        {base.hairType === 'bangs-straight' && (
          <g fill={`url(#hair-${base.id})`}>
            <path d="M26 62 C25 32, 38 23, 50 23 C62 23, 75 32, 74 62 C70 54, 70 38, 62 34 C58 36, 42 36, 38 34 C30 38, 30 54, 26 62 Z" />
            {/* Bangs fringe */}
            <rect x="33" y="32" width="34" height="6" rx="2" />
          </g>
        )}

        {/* 14. Accessories Layer */}
        {/* Study Glasses */}
        {accessory === 'glasses' && (
          <g stroke="#0f172a" strokeWidth="1.8" fill="rgba(255,255,255,0.25)">
            <circle cx="40" cy="47" r="7" />
            <circle cx="60" cy="47" r="7" />
            <line x1="47" y1="47" x2="53" y2="47" strokeWidth="2" />
            <line x1="33" y1="46" x2="28" y2="48" strokeWidth="1.5" />
            <line x1="67" y1="46" x2="72" y2="48" strokeWidth="1.5" />
            {/* Glass Glare */}
            <path d="M36 44 L42 42" stroke="white" strokeWidth="1" strokeLinecap="round" />
            <path d="M56 44 L62 42" stroke="white" strokeWidth="1" strokeLinecap="round" />
          </g>
        )}

        {/* Sunglasses / Shades */}
        {accessory === 'shades' && (
          <g>
            <path
              d="M31 43 Q40 42, 48 44 Q49 52, 40 53 Q32 53, 31 43 Z"
              fill="#09090b"
            />
            <path
              d="M52 44 Q60 42, 69 43 Q68 53, 60 53 Q51 52, 52 44 Z"
              fill="#09090b"
            />
            <line x1="47" y1="44" x2="53" y2="44" stroke="#d4d4d8" strokeWidth="2" strokeLinecap="round" />
            {/* Neon glare */}
            <path d="M34 45 L42 51" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.8" />
            <path d="M55 45 L63 51" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.8" />
          </g>
        )}

        {/* Gaming / Study Headset */}
        {accessory === 'headphones' && (
          <g>
            {/* Top Headband */}
            <path
              d="M24 48 C24 22, 76 22, 76 48"
              fill="none"
              stroke="#0f172a"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M26 48 C26 24, 74 24, 74 48"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Ear Cups */}
            <rect x="20" y="44" width="7" height="15" rx="3.5" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.2" />
            <rect x="73" y="44" width="7" height="15" rx="3.5" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.2" />
          </g>
        )}

        {/* Student Baseball Cap */}
        {accessory === 'cap' && (
          <g>
            {/* Cap Dome */}
            <path
              d="M28 38 C28 20, 72 20, 72 38 Z"
              fill="#2563eb"
            />
            {/* Cap Visor */}
            <path
              d="M24 38 Q50 32, 78 38 Q66 43, 24 38 Z"
              fill="#1d4ed8"
            />
            {/* Button on top */}
            <circle cx="50" cy="20" r="2.5" fill="#ffffff" />
            {/* Cap Logo */}
            <circle cx="50" cy="30" r="3" fill="#ffffff" fillOpacity="0.8" />
          </g>
        )}

        {/* Cozy Beanie */}
        {accessory === 'beanie' && (
          <g>
            <path
              d="M26 36 C26 14, 74 14, 74 36 Z"
              fill="#e11d48"
            />
            <rect x="24" y="32" width="52" height="8" rx="4" fill="#be123c" />
            {/* Pom pom */}
            <circle cx="50" cy="14" r="5" fill="#ffffff" />
          </g>
        )}
      </svg>

      {/* Optional Badge */}
      {showBadge && (
        <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight bg-blue-600 text-white shadow-xs border border-white dark:border-slate-900">
          {badgeText || base.gender.toUpperCase()}
        </span>
      )}
    </div>
  );
};

export default UserAvatar;
