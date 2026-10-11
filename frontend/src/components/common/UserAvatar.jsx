import React from 'react';
import { BASE_AVATARS, BG_GRADIENTS, parseAvatar } from '../../data/avatars';

/**
 * UserAvatar: Maangas / Streetwear / Anime Student Vector Avatar
 * 100% Vector SVG, crisp scaling, offline ready.
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
  const rawAvatar = avatarConfig || user?.avatar;
  const userGender = gender || user?.gender || 'male';
  const config = parseAvatar(rawAvatar, userGender);

  const base = BASE_AVATARS.find((b) => b.id === config.base) || BASE_AVATARS[0];
  const bg = BG_GRADIENTS.find((g) => g.id === config.bg) || BG_GRADIENTS[0];
  const accessory = config.accessory || 'none';

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-lg',
    '2xl': 'w-28 h-28 text-xl',
  };

  const containerClass = sizeClasses[size] || sizeClasses.md;
  const uniqueId = `${base.id}-${config.bg}-${accessory}-${size}`;

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
        className="w-full h-full rounded-full shadow-lg overflow-hidden"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Background Gradient */}
          <linearGradient id={`bg-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={bg.from} />
            <stop offset="50%" stopColor={bg.via} />
            <stop offset="100%" stopColor={bg.to} />
          </linearGradient>

          {/* Skin Gradient for 3D depth */}
          <linearGradient id={`skin-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={base.skin} />
            <stop offset="100%" stopColor={base.skinShadow} />
          </linearGradient>

          {/* Hair Gradient */}
          <linearGradient id={`hair-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={base.hairHighlight || base.hairColor} />
            <stop offset="60%" stopColor={base.hairColor} />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>

          {/* Hair 2 Gradient (for Split-Dye) */}
          <linearGradient id={`hair2-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={base.hairHighlight || '#f472b6'} />
            <stop offset="100%" stopColor={base.hairColor2 || '#ec4899'} />
          </linearGradient>

          {/* Outfit Gradient */}
          <linearGradient id={`outfit-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={base.outfitColor} />
            <stop offset="100%" stopColor="#050508" />
          </linearGradient>
        </defs>

        {/* 1. Background Circle */}
        <circle cx="50" cy="50" r="50" fill={`url(#bg-${uniqueId})`} />

        {/* Ambient Ring Glow */}
        <circle cx="50" cy="50" r="48" fill="none" stroke={bg.glow || '#38bdf8'} strokeWidth="1" strokeOpacity="0.4" />

        {/* 2. Back Hair Layers */}
        {base.hairType === 'wolf-cut-male' && (
          <path
            d="M24 45 C18 55, 16 68, 22 76 C26 68, 30 58, 32 50 Z M76 45 C82 55, 84 68, 78 76 C74 68, 70 58, 68 50 Z"
            fill={`url(#hair-${uniqueId})`}
          />
        )}
        {base.hairType === 'street-mullet' && (
          <path
            d="M22 48 C16 60, 16 82, 24 90 C28 78, 32 64, 32 54 Z M78 48 C84 60, 84 82, 76 90 C72 78, 68 64, 68 54 Z"
            fill={`url(#hair-${uniqueId})`}
          />
        )}
        {base.hairType === 'wolf-cut-female' && (
          <path
            d="M22 44 C14 58, 16 78, 24 88 C26 74, 30 62, 32 52 Z M78 44 C86 58, 84 78, 76 88 C74 74, 70 62, 68 52 Z"
            fill={`url(#hair-${uniqueId})`}
          />
        )}
        {base.hairType === 'cyber-twintails' && (
          <g fill={`url(#hair-${uniqueId})`}>
            {/* Left High Twin Tail */}
            <circle cx="22" cy="30" r="5" fill={base.outfitAccent} />
            <path d="M22 30 C10 40, 6 68, 12 86 C16 70, 22 52, 26 34 Z" />
            {/* Right High Twin Tail */}
            <circle cx="78" cy="30" r="5" fill={base.outfitAccent} />
            <path d="M78 30 C90 40, 94 68, 88 86 C84 70, 78 52, 74 34 Z" />
          </g>
        )}
        {base.hairType === 'sleek-highpony' && (
          <g>
            <circle cx="72" cy="24" r="5.5" fill={base.outfitAccent} />
            <path
              d="M74 24 C88 28, 96 52, 88 76 C84 64, 82 46, 70 30 Z"
              fill={`url(#hair-${uniqueId})`}
            />
          </g>
        )}
        {base.hairType === 'hime-cut' && (
          <path
            d="M24 40 C18 52, 16 80, 20 95 C25 80, 28 65, 30 52 Z M76 40 C82 52, 84 80, 80 95 C75 80, 72 65, 70 52 Z"
            fill={`url(#hair-${uniqueId})`}
          />
        )}
        {base.hairType === 'box-braids-female' && (
          <g stroke={base.hairColor} strokeWidth="3" strokeLinecap="round">
            <line x1="24" y1="46" x2="18" y2="86" />
            <line x1="28" y1="48" x2="22" y2="90" />
            <line x1="76" y1="46" x2="82" y2="86" />
            <line x1="72" y1="48" x2="78" y2="90" />
            {/* Gold beads */}
            <circle cx="18" cy="84" r="2.5" fill="#f59e0b" stroke="none" />
            <circle cx="22" cy="88" r="2.5" fill="#f59e0b" stroke="none" />
            <circle cx="82" cy="84" r="2.5" fill="#f59e0b" stroke="none" />
            <circle cx="78" cy="88" r="2.5" fill="#f59e0b" stroke="none" />
          </g>
        )}

        {/* 3. Outfits / Shoulders (Maangas Streetwear Jacket & Hoodie) */}
        <path
          d="M16 100 C16 76, 32 70, 50 70 C68 70, 84 76, 84 100 Z"
          fill={`url(#outfit-${uniqueId})`}
        />
        {/* Techwear Jacket Collar / Zipper Details */}
        <path
          d="M38 70 L50 82 L62 70 C58 76, 42 76, 38 70 Z"
          fill="#18181b"
        />
        <line x1="50" y1="82" x2="50" y2="100" stroke={base.outfitAccent} strokeWidth="2" strokeDasharray="3 1" />
        {/* Streetwear Straps / Accents */}
        <path d="M26 80 L36 100" stroke={base.outfitAccent} strokeWidth="2.5" strokeOpacity="0.8" />
        <path d="M74 80 L64 100" stroke={base.outfitAccent} strokeWidth="2.5" strokeOpacity="0.8" />

        {/* 4. Neck & Shadow */}
        <rect x="44" y="58" width="12" height="16" rx="2" fill={`url(#skin-${uniqueId})`} />
        {/* Sharp neck shadow */}
        <path d="M44 60 Q50 64, 56 60 L56 64 Q50 67, 44 64 Z" fill="#000000" fillOpacity="0.3" />

        {/* 5. Ears & Piercings */}
        <ellipse cx="27" cy="50" rx="4.5" ry="6" fill={`url(#skin-${uniqueId})`} />
        <ellipse cx="73" cy="50" rx="4.5" ry="6" fill={`url(#skin-${uniqueId})`} />
        {/* Ear Piercings (Standard edgy hoops) */}
        <circle cx="25" cy="53" r="1.5" fill="none" stroke="#d4d4d8" strokeWidth="1" />
        <circle cx="75" cy="53" r="1.5" fill="none" stroke="#d4d4d8" strokeWidth="1" />

        {/* 6. Head & Sharp Jawline */}
        <path
          d="M29 44 C29 32, 38 24, 50 24 C62 24, 71 32, 71 44 C71 58, 62 67, 50 67 C38 67, 29 58, 29 44 Z"
          fill={`url(#skin-${uniqueId})`}
        />

        {/* 7. Eyes (Anime / Manhwa Cool Angled Eyes) */}
        {/* Left Eye */}
        <g>
          {/* Sclera & Iris */}
          <path d="M34 47 Q40 44, 46 47 Q40 52, 34 47 Z" fill="#ffffff" />
          <ellipse cx="41" cy="47.5" rx="3.5" ry="4" fill={base.eyeColor || '#0284c7'} />
          <ellipse cx="41" cy="47.5" rx="1.8" ry="2.2" fill="#09090b" />
          {/* Glint highlights */}
          <circle cx="39.8" cy="45.8" r="1.2" fill="#ffffff" />
          <circle cx="42.2" cy="48.5" r="0.7" fill="#ffffff" />
          {/* Sharp Eyelash / Liner */}
          <path d="M33 46.5 Q40 43.5, 47 46.5" stroke="#09090b" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          {base.hasWingedLiner && (
            <path d="M33 46.5 L30 44" stroke="#09090b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          )}
        </g>

        {/* Right Eye */}
        <g>
          {/* Sclera & Iris */}
          <path d="M54 47 Q60 44, 66 47 Q60 52, 54 47 Z" fill="#ffffff" />
          <ellipse cx="59" cy="47.5" rx="3.5" ry="4" fill={base.eyeColor || '#0284c7'} />
          <ellipse cx="59" cy="47.5" rx="1.8" ry="2.2" fill="#09090b" />
          {/* Glint highlights */}
          <circle cx="57.8" cy="45.8" r="1.2" fill="#ffffff" />
          <circle cx="60.2" cy="48.5" r="0.7" fill="#ffffff" />
          {/* Sharp Eyelash / Liner */}
          <path d="M53 46.5 Q60 43.5, 67 46.5" stroke="#09090b" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          {base.hasWingedLiner && (
            <path d="M67 46.5 L70 44" stroke="#09090b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          )}
        </g>

        {/* 8. Eyebrows (Focused & Sharp) */}
        {/* Left Eyebrow with slit check */}
        {base.hasEyebrowSlit ? (
          <g>
            <path d="M33 40 L40 38" stroke={base.hairColor} strokeWidth="2.2" strokeLinecap="round" />
            <path d="M42 38.5 L46 40" stroke={base.hairColor} strokeWidth="2.2" strokeLinecap="round" />
          </g>
        ) : (
          <path d="M33 40 Q40 37, 46 40" stroke={base.hairColor} strokeWidth="2.4" strokeLinecap="round" fill="none" />
        )}
        {/* Right Eyebrow */}
        <path d="M54 40 Q60 37, 67 40" stroke={base.hairColor} strokeWidth="2.4" strokeLinecap="round" fill="none" />

        {/* 9. Nose (Minimal Sharp Anime Nose) */}
        <path d="M50 47 L49 52 L52 52.5" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeOpacity="0.4" />

        {/* 10. Mouth (Cool Confident Smirk) */}
        <path d="M45 57 Q51 57, 57 55.5" stroke="#4c0519" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M56 55.5 L57.5 54.5" stroke="#4c0519" strokeWidth="1.6" strokeLinecap="round" fill="none" />

        {/* 11. Front Hair Styles (Unique Maangas Cuts) */}
        {/* Wolf Cut Male */}
        {base.hairType === 'wolf-cut-male' && (
          <g fill={`url(#hair-${uniqueId})`}>
            <path d="M26 44 C25 24, 40 18, 50 18 C62 18, 74 24, 74 44 C68 34, 60 28, 52 34 C46 40, 42 32, 34 33 C28 35, 27 39, 26 44 Z" />
            {/* Spiky textured fringe strands */}
            <path d="M38 34 L36 43 L42 37 Z" />
            <path d="M48 32 L46 45 L53 36 Z" />
            <path d="M58 33 L62 43 L65 35 Z" />
          </g>
        )}

        {/* K-Drill Curtains */}
        {base.hairType === 'kpop-curtains' && (
          <g fill={`url(#hair-${uniqueId})`}>
            <path d="M26 45 C25 23, 40 18, 50 18 C60 18, 74 23, 74 45 C70 34, 62 28, 53 35 C52 36, 48 36, 47 35 C38 28, 30 34, 26 45 Z" />
            {/* Curtain bangs drop */}
            <path d="M34 32 C35 44, 40 48, 43 45 C41 40, 39 34, 38 30 Z" />
            <path d="M66 32 C65 44, 60 48, 57 45 C59 40, 61 34, 62 30 Z" />
          </g>
        )}

        {/* Cyberpunk Undercut */}
        {base.hairType === 'cyber-undercut' && (
          <g fill={`url(#hair-${uniqueId})`}>
            {/* High fade shaved sides */}
            <path d="M27 46 C27 34, 32 30, 36 28 L36 44 Z" fill="#0f172a" opacity="0.6" />
            <path d="M73 46 C73 34, 68 30, 64 28 L64 44 Z" fill="#0f172a" opacity="0.6" />
            {/* Swept top neon pompadour */}
            <path d="M32 30 C34 16, 52 14, 66 18 C74 20, 72 32, 70 38 C62 30, 52 26, 42 27 C36 27, 33 29, 32 30 Z" />
            {/* Shaved razor slit in side */}
            <line x1="28" y1="38" x2="33" y2="35" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        )}

        {/* Urban Dreads */}
        {base.hairType === 'urban-dreads' && (
          <g fill={`url(#hair-${uniqueId})`}>
            <path d="M27 42 C27 24, 42 20, 50 20 C62 20, 73 24, 73 42 C68 34, 60 30, 50 30 C40 30, 32 34, 27 42 Z" />
            {/* Dreads falling across */}
            <rect x="34" y="24" width="5" height="18" rx="2.5" transform="rotate(-15 36 33)" />
            <rect x="42" y="22" width="5.5" height="22" rx="2.5" transform="rotate(-5 44 33)" />
            <rect x="52" y="22" width="5.5" height="20" rx="2.5" transform="rotate(10 54 32)" />
            <rect x="61" y="24" width="5" height="16" rx="2.5" transform="rotate(25 63 32)" />
            {/* Gold cuffs */}
            <rect x="41.5" y="36" width="6" height="3" fill="#f59e0b" rx="1" transform="rotate(-5 44 37)" />
          </g>
        )}

        {/* Anime Spiky */}
        {base.hairType === 'anime-spiky' && (
          <path
            d="M26 44 L28 28 L36 32 L40 16 L48 26 L56 14 L62 27 L70 20 L72 34 L74 44 C68 36, 58 32, 48 34 C38 36, 32 38, 26 44 Z"
            fill={`url(#hair-${uniqueId})`}
          />
        )}

        {/* Taper Fade Slit */}
        {base.hairType === 'fade-slit' && (
          <g fill={`url(#hair-${uniqueId})`}>
            <path d="M28 44 C27 26, 40 22, 50 22 C62 22, 73 26, 72 44 C68 34, 58 30, 50 30 C40 30, 32 34, 28 44 Z" />
            {/* Shaved temple slit */}
            <line x1="29" y1="36" x2="35" y2="33" stroke="#fed7aa" strokeWidth="2" strokeLinecap="round" />
            <line x1="30" y1="40" x2="36" y2="37" stroke="#fed7aa" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* Hoodie Shadow (Streetwear Hood) */}
        {base.hairType === 'hoodie-shadow' && (
          <g>
            {/* Oversized Dark Hood framing head */}
            <path
              d="M20 54 C18 20, 36 12, 50 12 C64 12, 82 20, 80 54 C74 46, 68 28, 50 28 C32 28, 26 46, 20 54 Z"
              fill="#09090b"
            />
            {/* Loose hair strands peeking */}
            <path d="M38 30 L36 42 L42 35 Z" fill={`url(#hair-${uniqueId})`} />
            <path d="M46 29 L48 44 L54 34 Z" fill={`url(#hair-${uniqueId})`} />
            <path d="M58 30 L62 42 L65 33 Z" fill={`url(#hair-${uniqueId})`} />
          </g>
        )}

        {/* Street Mullet */}
        {base.hairType === 'street-mullet' && (
          <g fill={`url(#hair-${uniqueId})`}>
            <path d="M27 44 C26 26, 40 22, 50 22 C62 22, 73 26, 73 44 C67 36, 58 32, 50 33 C42 32, 33 36, 27 44 Z" />
            <path d="M40 32 L38 43 L45 36 Z" />
            <path d="M52 32 L54 44 L59 35 Z" />
          </g>
        )}

        {/* Wolf Cut Female */}
        {base.hairType === 'wolf-cut-female' && (
          <g fill={`url(#hair-${uniqueId})`}>
            <path d="M25 50 C24 24, 38 18, 50 18 C62 18, 76 24, 75 50 C70 42, 68 34, 60 32 C54 36, 46 36, 40 32 C32 34, 30 42, 25 50 Z" />
            {/* Choppy face framing strands */}
            <path d="M30 40 L28 56 L33 48 Z" />
            <path d="M70 40 L72 56 L67 48 Z" />
            <path d="M44 34 L43 45 L48 37 Z" />
            <path d="M54 34 L56 45 L51 37 Z" />
          </g>
        )}

        {/* Split Dye Bob */}
        {base.hairType === 'split-dye-bob' && (
          <g>
            {/* Left side (Dark/Black) */}
            <path
              d="M25 56 C24 28, 36 20, 50 20 L50 36 C42 34, 34 40, 31 52 C28 54, 26 56, 25 56 Z"
              fill={`url(#hair-${uniqueId})`}
            />
            {/* Right side (Hot Neon Pink) */}
            <path
              d="M50 20 C64 20, 76 28, 75 56 C74 56, 72 54, 69 52 C66 40, 58 34, 50 36 Z"
              fill={`url(#hair2-${uniqueId})`}
            />
            {/* Straight modern bangs */}
            <path d="M33 35 L50 35 L50 37 L33 37 Z" fill={`url(#hair-${uniqueId})`} />
            <path d="M50 35 L67 35 L67 37 L50 37 Z" fill={`url(#hair2-${uniqueId})`} />
          </g>
        )}

        {/* Cyber TwinTails Front */}
        {base.hairType === 'cyber-twintails' && (
          <g fill={`url(#hair-${uniqueId})`}>
            <path d="M26 46 C26 24, 40 20, 50 20 C60 20, 74 24, 74 46 C68 36, 60 32, 50 33 C40 32, 32 36, 26 46 Z" />
            {/* Front strands */}
            <path d="M32 40 L30 54 L35 46 Z" />
            <path d="M68 40 L70 54 L65 46 Z" />
            <path d="M45 33 L44 44 L49 35 Z" />
            <path d="M54 33 L55 44 L50 35 Z" />
          </g>
        )}

        {/* Sleek HighPony Front */}
        {base.hairType === 'sleek-highpony' && (
          <g fill={`url(#hair-${uniqueId})`}>
            <path d="M27 46 C26 22, 40 18, 50 18 C62 18, 73 22, 73 46 C68 36, 60 32, 50 33 C40 32, 32 36, 27 46 Z" />
            <path d="M31 40 L29 52 L34 46 Z" />
            <path d="M69 40 L71 52 L66 46 Z" />
          </g>
        )}

        {/* Dark Hime Cut Front */}
        {base.hairType === 'hime-cut' && (
          <g fill={`url(#hair-${uniqueId})`}>
            <path d="M26 56 C25 24, 38 18, 50 18 C62 18, 75 24, 74 56 C71 54, 70 38, 62 34 C58 36, 42 36, 38 34 C30 38, 29 54, 26 56 Z" />
            {/* Blunt cheek level hime chops */}
            <rect x="27" y="44" width="7" height="12" rx="1" />
            <rect x="66" y="44" width="7" height="12" rx="1" />
            {/* Straight razor bangs */}
            <rect x="34" y="32" width="32" height="6" rx="1" />
          </g>
        )}

        {/* Side Undercut */}
        {base.hairType === 'side-undercut' && (
          <g fill={`url(#hair-${uniqueId})`}>
            {/* Exposed shaved right temple */}
            <path d="M67 46 C68 36, 66 30, 62 26 L62 42 Z" fill="#2e1065" opacity="0.6" />
            {/* Big sweeping left waves */}
            <path d="M24 52 C24 24, 42 16, 60 18 C66 22, 64 30, 60 34 C52 32, 44 32, 36 38 C32 42, 28 48, 24 52 Z" />
          </g>
        )}

        {/* Female Hoodie Bangs */}
        {base.hairType === 'female-hoodie-bangs' && (
          <g>
            <path
              d="M18 54 C16 18, 36 10, 50 10 C64 10, 84 18, 82 54 C74 46, 68 28, 50 28 C32 28, 26 46, 18 54 Z"
              fill="#020617"
            />
            {/* Cute messy bangs */}
            <path d="M32 38 L30 52 L35 44 Z" fill={`url(#hair-${uniqueId})`} />
            <path d="M68 38 L70 52 L65 44 Z" fill={`url(#hair-${uniqueId})`} />
            <rect x="36" y="30" width="28" height="6" rx="2" fill={`url(#hair-${uniqueId})`} />
          </g>
        )}

        {/* ================================================================ */}
        {/* 12. ACCESSORIES LAYER (15 BADASS OPTIONS) */}
        {/* ================================================================ */}

        {/* 1. Black Techwear Face Mask */}
        {accessory === 'black-mask' && (
          <g>
            <path
              d="M32 52 C32 52, 42 49, 50 49 C58 49, 68 52, 68 52 C68 64, 60 70, 50 70 C40 70, 32 64, 32 52 Z"
              fill="#18181b"
              stroke="#27272a"
              strokeWidth="1.2"
            />
            {/* Mask ear loops */}
            <line x1="32" y1="53" x2="27" y2="52" stroke="#27272a" strokeWidth="1.5" />
            <line x1="68" y1="53" x2="73" y2="52" stroke="#27272a" strokeWidth="1.5" />
            {/* Center seam & cyber cross */}
            <line x1="50" y1="49" x2="50" y2="70" stroke="#09090b" strokeWidth="1" />
            <path d="M48 60 L52 60 M50 58 L50 62" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        )}

        {/* 2. Anime Cheek Band-Aid */}
        {accessory === 'bandaid' && (
          <g transform="rotate(-15 38 52)">
            <rect x="31" y="49" width="14" height="6" rx="2" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
            <circle cx="38" cy="52" r="1.5" fill="#f59e0b" />
          </g>
        )}

        {/* 3. Silver Cross Dangle Piercing */}
        {accessory === 'cross-earring' && (
          <g>
            {/* Left ear hoop */}
            <circle cx="26" cy="53" r="2" fill="none" stroke="#f1f5f9" strokeWidth="1.2" />
            {/* Hanging chain */}
            <line x1="26" y1="55" x2="26" y2="60" stroke="#cbd5e1" strokeWidth="1" />
            {/* Cross */}
            <line x1="26" y1="60" x2="26" y2="67" stroke="#f8fafc" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="23" y1="62" x2="29" y2="62" stroke="#f8fafc" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        )}

        {/* 4. Neon Cyber Visor (HUD Scouter) */}
        {accessory === 'cyber-visor' && (
          <g>
            {/* Visor over right eye */}
            <path
              d="M51 43 L72 41 L70 53 L54 53 Z"
              fill="rgba(34, 211, 238, 0.4)"
              stroke="#22d3ee"
              strokeWidth="1.5"
            />
            {/* Ear mount */}
            <rect x="70" y="44" width="4" height="8" rx="2" fill="#0f172a" stroke="#22d3ee" strokeWidth="1" />
            {/* HUD scanlines */}
            <line x1="56" y1="46" x2="68" y2="46" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.8" />
            <circle cx="60" cy="50" r="1.5" fill="#22d3ee" />
          </g>
        )}

        {/* 5. Matrix Blade Cyber Shades */}
        {accessory === 'blade-shades' && (
          <g>
            <path
              d="M28 44 Q50 42, 72 44 L70 51 Q50 53, 30 51 Z"
              fill="#09090b"
              stroke="#27272a"
              strokeWidth="1"
            />
            {/* Neon Glare Slice */}
            <path d="M33 46 L45 49" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M55 46 L67 49" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        )}

        {/* 6. RGB Pro Gamer Headset */}
        {accessory === 'rgb-headphones' && (
          <g>
            {/* Headband */}
            <path d="M22 46 C22 18, 78 18, 78 46" fill="none" stroke="#09090b" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M24 46 C24 20, 76 20, 76 46" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
            {/* Ear Cups */}
            <rect x="18" y="42" width="7" height="16" rx="3.5" fill="#18181b" stroke="#22d3ee" strokeWidth="1.5" />
            <rect x="75" y="42" width="7" height="16" rx="3.5" fill="#18181b" stroke="#22d3ee" strokeWidth="1.5" />
            {/* Boom Mic */}
            <path d="M23 54 C23 64, 34 66, 42 63" fill="none" stroke="#09090b" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="42" cy="63" r="2.5" fill="#22d3ee" />
          </g>
        )}

        {/* 7. Neon Cat-Ear Headset */}
        {accessory === 'cat-headphones' && (
          <g>
            {/* Headband */}
            <path d="M23 46 C23 20, 77 20, 77 46" fill="none" stroke="#09090b" strokeWidth="4" strokeLinecap="round" />
            {/* Cat Ears */}
            <polygon points="30,22 40,8 45,22" fill="#ec4899" stroke="#f472b6" strokeWidth="1.5" />
            <polygon points="34,20 40,12 43,20" fill="#ffffff" />
            <polygon points="55,22 60,8 70,22" fill="#ec4899" stroke="#f472b6" strokeWidth="1.5" />
            <polygon points="57,20 60,12 66,20" fill="#ffffff" />
            {/* Glowing Ear Cups */}
            <rect x="18" y="42" width="7" height="16" rx="3.5" fill="#18181b" stroke="#ec4899" strokeWidth="1.5" />
            <rect x="75" y="42" width="7" height="16" rx="3.5" fill="#18181b" stroke="#ec4899" strokeWidth="1.5" />
          </g>
        )}

        {/* 8. Tactical Head Goggles */}
        {accessory === 'goggles-head' && (
          <g>
            {/* Elastic strap */}
            <path d="M22 28 C22 28, 50 24, 78 28" stroke="#18181b" strokeWidth="3" fill="none" />
            {/* Left Glass & Frame */}
            <rect x="32" y="22" width="14" height="11" rx="3" fill="#0f172a" stroke="#d97706" strokeWidth="1.5" />
            <rect x="34" y="24" width="10" height="7" rx="2" fill="#38bdf8" fillOpacity="0.7" />
            {/* Right Glass & Frame */}
            <rect x="54" y="22" width="14" height="11" rx="3" fill="#0f172a" stroke="#d97706" strokeWidth="1.5" />
            <rect x="56" y="24" width="10" height="7" rx="2" fill="#38bdf8" fillOpacity="0.7" />
            {/* Bridge */}
            <line x1="46" y1="27" x2="54" y2="27" stroke="#d97706" strokeWidth="2" />
          </g>
        )}

        {/* 9. Cuban Link Chain & Choker */}
        {accessory === 'silver-chain' && (
          <g>
            {/* Choker around neck */}
            <path d="M42 62 Q50 67, 58 62" stroke="#09090b" strokeWidth="2.5" fill="none" />
            {/* Heavy Silver Cuban Chain */}
            <path
              d="M38 72 Q50 82, 62 72"
              stroke="#e2e8f0"
              strokeWidth="2.8"
              strokeDasharray="3 1"
              fill="none"
            />
            {/* Silver Pendant */}
            <circle cx="50" cy="77" r="3" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
          </g>
        )}

        {/* 10. Streetwear Pierced Ring Cap */}
        {accessory === 'pierced-cap' && (
          <g>
            {/* Cap Dome */}
            <path d="M26 36 C26 16, 74 16, 74 36 Z" fill="#09090b" />
            {/* Curved Visor */}
            <path d="M22 36 Q50 28, 78 36 Q64 42, 22 36 Z" fill="#18181b" />
            {/* Pierced Silver Rings on Visor edge */}
            <circle cx="28" cy="38" r="2" fill="none" stroke="#f1f5f9" strokeWidth="1.2" />
            <circle cx="33" cy="37" r="2" fill="none" stroke="#f1f5f9" strokeWidth="1.2" />
            <circle cx="38" cy="36" r="2" fill="none" stroke="#f1f5f9" strokeWidth="1.2" />
            {/* Cap Button */}
            <circle cx="50" cy="18" r="2" fill="#27272a" />
          </g>
        )}

        {/* 11. Neon Cyber Horns */}
        {accessory === 'demon-horns' && (
          <g>
            {/* Left Neon Horn */}
            <path d="M34 26 C32 14, 24 10, 22 8 C26 16, 32 20, 38 24 Z" fill="#f43f5e" stroke="#fb7185" strokeWidth="1" />
            {/* Right Neon Horn */}
            <path d="M66 26 C68 14, 76 10, 78 8 C74 16, 68 20, 62 24 Z" fill="#f43f5e" stroke="#fb7185" strokeWidth="1" />
          </g>
        )}

        {/* 12. Gold Polygonal Aesthetic Glasses */}
        {accessory === 'aesthetic-glasses' && (
          <g stroke="#f59e0b" strokeWidth="1.5" fill="rgba(255, 255, 255, 0.2)">
            {/* Left Octagon Frame */}
            <polygon points="34,44 41,42 47,45 47,51 41,54 34,51" />
            {/* Right Octagon Frame */}
            <polygon points="53,45 59,42 66,44 66,51 59,54 53,51" />
            {/* Bridge */}
            <line x1="47" y1="47" x2="53" y2="47" strokeWidth="1.8" />
            {/* Temples */}
            <line x1="34" y1="46" x2="27" y2="48" strokeWidth="1.2" />
            <line x1="66" y1="46" x2="73" y2="48" strokeWidth="1.2" />
          </g>
        )}

        {/* 13. Skater Ring Beanie */}
        {accessory === 'beanie-ring' && (
          <g>
            <path d="M25 34 C25 12, 75 12, 75 34 Z" fill="#18181b" />
            <rect x="23" y="30" width="54" height="8" rx="3" fill="#27272a" />
            {/* Silver Safety Pin / Ring */}
            <circle cx="34" cy="34" r="2.5" fill="none" stroke="#f8fafc" strokeWidth="1.2" />
            <line x1="33" y1="31" x2="39" y2="33" stroke="#f8fafc" strokeWidth="1" />
          </g>
        )}

        {/* 14. Battle Scar & Eye Star */}
        {accessory === 'cheek-scar' && (
          <g>
            {/* Diagonal anime cheek scar */}
            <line x1="34" y1="50" x2="44" y2="56" stroke="#991b1b" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="38" y1="51" x2="40" y2="55" stroke="#991b1b" strokeWidth="1" strokeLinecap="round" />
            {/* Star mark under eye */}
            <path
              d="M62 52 L63 54 L65 54 L63.5 55.5 L64 57.5 L62 56 L60 57.5 L60.5 55.5 L59 54 L61 54 Z"
              fill="#38bdf8"
            />
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
