import React from 'react';
import { BASE_AVATARS, BG_GRADIENTS, parseAvatar } from '../../data/avatars';

/**
 * UserAvatar: Volumetric 3D Cartoon / Memoji Student Vector Avatar
 * True 3D lighting, radial spherical depth, specular highlights, rim lights, and metallic chrome shaders.
 * 100% Vector SVG, offline-ready, sharp on any resolution.
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
        className="w-full h-full rounded-full shadow-2xl overflow-hidden"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 1. 3D Background Gradient with Atmospheric Depth */}
          <radialGradient id={`bg-${uniqueId}`} cx="50%" cy="30%" r="70%" fx="40%" fy="20%">
            <stop offset="0%" stopColor={bg.via || bg.from} />
            <stop offset="60%" stopColor={bg.from} />
            <stop offset="100%" stopColor={bg.to} />
          </radialGradient>

          {/* 2. Volumetric 3D Skin Radial Lighting (Key light top-left, chin/jaw ambient occlusion) */}
          <radialGradient id={`skin-3d-${uniqueId}`} cx="42%" cy="36%" r="62%" fx="36%" fy="28%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="25%" stopColor={base.skin} />
            <stop offset="75%" stopColor={base.skinShadow} />
            <stop offset="100%" stopColor="#854d0e" stopOpacity="0.85" />
          </radialGradient>

          {/* 3. Volumetric 3D Hair Radial Shader with Crown Gloss */}
          <radialGradient id={`hair-3d-${uniqueId}`} cx="44%" cy="25%" r="65%" fx="38%" fy="18%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="20%" stopColor={base.hairHighlight || base.hairColor} />
            <stop offset="65%" stopColor={base.hairColor} />
            <stop offset="100%" stopColor="#050508" />
          </radialGradient>

          {/* Split Dye Second Color */}
          <radialGradient id={`hair2-3d-${uniqueId}`} cx="56%" cy="25%" r="65%" fx="62%" fy="18%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="25%" stopColor={base.hairHighlight || '#f472b6'} />
            <stop offset="70%" stopColor={base.hairColor2 || '#ec4899'} />
            <stop offset="100%" stopColor="#4a044e" />
          </radialGradient>

          {/* 4. Volumetric 3D Outfit Shader */}
          <radialGradient id={`outfit-3d-${uniqueId}`} cx="50%" cy="72%" r="60%" fx="42%" fy="68%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="35%" stopColor={base.outfitColor} />
            <stop offset="85%" stopColor="#09090b" />
            <stop offset="100%" stopColor="#020203" />
          </radialGradient>

          {/* 5. Crystalline 3D Eye Iris Shader */}
          <radialGradient id={`eye-3d-${uniqueId}`} cx="38%" cy="36%" r="58%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="30%" stopColor={base.eyeColor || '#38bdf8'} />
            <stop offset="75%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>

          {/* 6. Chrome Silver Metallic Multi-Stop Gradient */}
          <linearGradient id={`chrome-silver-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="20%" stopColor="#cbd5e1" />
            <stop offset="45%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#334155" />
            <stop offset="90%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>

          {/* 7. Chrome Gold Metallic Gradient */}
          <linearGradient id={`chrome-gold-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#fef08a" />
            <stop offset="75%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>

          {/* 8. 3D Drop Shadow Filter for Layer Depth */}
          <filter id={`depth-shadow-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2.2" stdDeviation="1.8" floodColor="#000000" floodOpacity="0.45" />
          </filter>

          {/* 9. Neon Glow Filter for Cyber/Gamer Accessories */}
          <filter id={`neon-glow-${uniqueId}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor={bg.glow || '#38bdf8'} floodOpacity="0.9" />
          </filter>
        </defs>

        {/* 1. Background Sphere */}
        <circle cx="50" cy="50" r="50" fill={`url(#bg-${uniqueId})`} />
        {/* Soft Background Vignette */}
        <circle cx="50" cy="50" r="49" fill="none" stroke="#000000" strokeWidth="2.5" strokeOpacity="0.3" />
        {/* Ambient 3D Rim Light Ring */}
        <circle cx="50" cy="50" r="48" fill="none" stroke={bg.glow || '#38bdf8'} strokeWidth="1.2" strokeOpacity="0.5" />

        {/* 2. Back Hair Volume (with 3D depth shadows) */}
        {base.hairType === 'wolf-cut-male' && (
          <path
            d="M24 45 C18 55, 16 68, 22 76 C26 68, 30 58, 32 50 Z M76 45 C82 55, 84 68, 78 76 C74 68, 70 58, 68 50 Z"
            fill={`url(#hair-3d-${uniqueId})`}
            filter={`url(#depth-shadow-${uniqueId})`}
          />
        )}
        {base.hairType === 'street-mullet' && (
          <path
            d="M22 48 C16 60, 16 82, 24 90 C28 78, 32 64, 32 54 Z M78 48 C84 60, 84 82, 76 90 C72 78, 68 64, 68 54 Z"
            fill={`url(#hair-3d-${uniqueId})`}
            filter={`url(#depth-shadow-${uniqueId})`}
          />
        )}
        {base.hairType === 'wolf-cut-female' && (
          <path
            d="M22 44 C14 58, 16 78, 24 88 C26 74, 30 62, 32 52 Z M78 44 C86 58, 84 78, 76 88 C74 74, 70 62, 68 52 Z"
            fill={`url(#hair-3d-${uniqueId})`}
            filter={`url(#depth-shadow-${uniqueId})`}
          />
        )}
        {base.hairType === 'cyber-twintails' && (
          <g filter={`url(#depth-shadow-${uniqueId})`}>
            {/* Left High Twin Tail */}
            <circle cx="22" cy="30" r="5.5" fill={base.outfitAccent} filter={`url(#neon-glow-${uniqueId})`} />
            <path d="M22 30 C10 40, 6 68, 12 86 C16 70, 22 52, 26 34 Z" fill={`url(#hair-3d-${uniqueId})`} />
            {/* Right High Twin Tail */}
            <circle cx="78" cy="30" r="5.5" fill={base.outfitAccent} filter={`url(#neon-glow-${uniqueId})`} />
            <path d="M78 30 C90 40, 94 68, 88 86 C84 70, 78 52, 74 34 Z" fill={`url(#hair-3d-${uniqueId})`} />
          </g>
        )}
        {base.hairType === 'sleek-highpony' && (
          <g filter={`url(#depth-shadow-${uniqueId})`}>
            <circle cx="72" cy="24" r="6" fill={base.outfitAccent} />
            <path
              d="M74 24 C88 28, 96 52, 88 76 C84 64, 82 46, 70 30 Z"
              fill={`url(#hair-3d-${uniqueId})`}
            />
          </g>
        )}
        {base.hairType === 'hime-cut' && (
          <path
            d="M24 40 C18 52, 16 80, 20 95 C25 80, 28 65, 30 52 Z M76 40 C82 52, 84 80, 80 95 C75 80, 72 65, 70 52 Z"
            fill={`url(#hair-3d-${uniqueId})`}
            filter={`url(#depth-shadow-${uniqueId})`}
          />
        )}
        {base.hairType === 'box-braids-female' && (
          <g stroke={`url(#hair-3d-${uniqueId})`} strokeWidth="3.5" strokeLinecap="round" filter={`url(#depth-shadow-${uniqueId})`}>
            <line x1="24" y1="46" x2="18" y2="86" />
            <line x1="28" y1="48" x2="22" y2="90" />
            <line x1="76" y1="46" x2="82" y2="86" />
            <line x1="72" y1="48" x2="78" y2="90" />
            {/* Metallic Gold 3D Beads */}
            <circle cx="18" cy="84" r="3" fill={`url(#chrome-gold-${uniqueId})`} stroke="none" />
            <circle cx="22" cy="88" r="3" fill={`url(#chrome-gold-${uniqueId})`} stroke="none" />
            <circle cx="82" cy="84" r="3" fill={`url(#chrome-gold-${uniqueId})`} stroke="none" />
            <circle cx="78" cy="88" r="3" fill={`url(#chrome-gold-${uniqueId})`} stroke="none" />
          </g>
        )}

        {/* 3. Volumetric 3D Outfits / Shoulders (Padded Streetwear Bomber / Techwear Jacket) */}
        <g filter={`url(#depth-shadow-${uniqueId})`}>
          {/* Main jacket mass */}
          <path
            d="M16 100 C16 75, 32 69, 50 69 C68 69, 84 75, 84 100 Z"
            fill={`url(#outfit-3d-${uniqueId})`}
          />
          {/* Shoulder 3D Specular Sheen */}
          <path d="M22 84 Q34 76, 44 76" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.25" fill="none" />
          <path d="M78 84 Q66 76, 56 76" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.25" fill="none" />

          {/* Thick 3D High Collar */}
          <path
            d="M38 69 L50 82 L62 69 C58 76, 42 76, 38 69 Z"
            fill="#18181b"
            stroke="#27272a"
            strokeWidth="1.2"
          />
          {/* 3D Metallic Zipper Track */}
          <line x1="50" y1="82" x2="50" y2="100" stroke={`url(#chrome-silver-${uniqueId})`} strokeWidth="2.5" />
          <rect x="48.5" y="82" width="3" height="5" rx="1.5" fill={`url(#chrome-silver-${uniqueId})`} />

          {/* Tactical Neon Straps / Cyber Tape */}
          <path d="M26 80 L36 100" stroke={base.outfitAccent} strokeWidth="3" strokeOpacity="0.85" filter={`url(#neon-glow-${uniqueId})`} />
          <path d="M74 80 L64 100" stroke={base.outfitAccent} strokeWidth="3" strokeOpacity="0.85" filter={`url(#neon-glow-${uniqueId})`} />
        </g>

        {/* 4. 3D Neck & Cylindrical Shadow */}
        <rect x="44" y="57" width="12" height="17" rx="3" fill={`url(#skin-3d-${uniqueId})`} />
        {/* Chin Occlusion Shadow */}
        <path d="M43 59 Q50 65, 57 59 L57 64 Q50 68, 43 64 Z" fill="#000000" fillOpacity="0.4" />
        {/* Adam's apple / neck contour for males */}
        {base.gender === 'male' && (
          <ellipse cx="50" cy="67" rx="2" ry="1.2" fill="#000000" fillOpacity="0.2" />
        )}

        {/* 5. 3D Ears & Metallic Silver Hoops */}
        <ellipse cx="27" cy="49" rx="4.8" ry="6.5" fill={`url(#skin-3d-${uniqueId})`} />
        <ellipse cx="73" cy="49" rx="4.8" ry="6.5" fill={`url(#skin-3d-${uniqueId})`} />
        <ellipse cx="27.5" cy="49" rx="2.2" ry="3.5" fill="#000000" fillOpacity="0.2" />
        <ellipse cx="72.5" cy="49" rx="2.2" ry="3.5" fill="#000000" fillOpacity="0.2" />
        {/* 3D Silver Metallic Ear Piercings */}
        <circle cx="25" cy="52" r="1.8" fill="none" stroke={`url(#chrome-silver-${uniqueId})`} strokeWidth="1.2" />
        <circle cx="75" cy="52" r="1.8" fill="none" stroke={`url(#chrome-silver-${uniqueId})`} strokeWidth="1.2" />

        {/* 6. 3D Head Sphere & Sculpted Jawline */}
        <g filter={`url(#depth-shadow-${uniqueId})`}>
          <path
            d="M29 43 C29 30, 38 22, 50 22 C62 22, 71 30, 71 43 C71 58, 62 67, 50 67 C38 67, 29 58, 29 43 Z"
            fill={`url(#skin-3d-${uniqueId})`}
          />
          {/* Forehead 3D Volumetric Specular Highlight */}
          <ellipse cx="46" cy="32" rx="9" ry="5" fill="#ffffff" fillOpacity="0.25" />
          {/* Cheekbone 3D Highlights */}
          <ellipse cx="36" cy="48" rx="4" ry="2.5" fill="#ffffff" fillOpacity="0.18" />
          <ellipse cx="64" cy="48" rx="4" ry="2.5" fill="#ffffff" fillOpacity="0.18" />
          {/* Jaw Contour Rim Light (Left & Right Edge) */}
          <path d="M29.5 45 C29.5 56, 38 65, 48 66.5" stroke={bg.glow || '#38bdf8'} strokeWidth="1" strokeOpacity="0.4" fill="none" />
          <path d="M70.5 45 C70.5 56, 62 65, 52 66.5" stroke={bg.glow || '#38bdf8'} strokeWidth="1" strokeOpacity="0.4" fill="none" />
        </g>

        {/* 7. 3D Realistic Anime / Manhwa Glassy Eyes */}
        {/* Left Eye */}
        <g filter={`url(#depth-shadow-${uniqueId})`}>
          {/* Socket shadow cavity */}
          <ellipse cx="40" cy="46" rx="7.5" ry="5.5" fill="#000000" fillOpacity="0.15" />
          {/* Sclera Eyeball Sphere */}
          <path d="M33 46.5 Q40 43, 47 46.5 Q40 52, 33 46.5 Z" fill="#f8fafc" />
          {/* 3D Iris Crystalline Sphere */}
          <ellipse cx="41" cy="47" rx="3.6" ry="4.2" fill={`url(#eye-3d-${uniqueId})`} />
          {/* Deep Black Pupil */}
          <ellipse cx="41" cy="47" rx="1.8" ry="2.4" fill="#020617" />
          {/* Dual Glass Specular Highlights (Primary & Secondary Glint) */}
          <circle cx="39.6" cy="45.2" r="1.4" fill="#ffffff" />
          <circle cx="42.4" cy="48.2" r="0.8" fill="#ffffff" fillOpacity="0.9" />
          {/* Top Eyelid Crease & Thick Lash */}
          <path d="M32.5 46 Q40 42.5, 47.5 46" stroke="#09090b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {base.hasWingedLiner && (
            <path d="M32.5 46 L29 43.5" stroke="#09090b" strokeWidth="2" strokeLinecap="round" fill="none" />
          )}
        </g>

        {/* Right Eye */}
        <g filter={`url(#depth-shadow-${uniqueId})`}>
          {/* Socket shadow cavity */}
          <ellipse cx="60" cy="46" rx="7.5" ry="5.5" fill="#000000" fillOpacity="0.15" />
          {/* Sclera Eyeball Sphere */}
          <path d="M53 46.5 Q60 43, 67 46.5 Q60 52, 53 46.5 Z" fill="#f8fafc" />
          {/* 3D Iris Crystalline Sphere */}
          <ellipse cx="59" cy="47" rx="3.6" ry="4.2" fill={`url(#eye-3d-${uniqueId})`} />
          {/* Deep Black Pupil */}
          <ellipse cx="59" cy="47" rx="1.8" ry="2.4" fill="#020617" />
          {/* Dual Glass Specular Highlights */}
          <circle cx="57.6" cy="45.2" r="1.4" fill="#ffffff" />
          <circle cx="60.4" cy="48.2" r="0.8" fill="#ffffff" fillOpacity="0.9" />
          {/* Top Eyelid Crease & Thick Lash */}
          <path d="M52.5 46 Q60 42.5, 67.5 46" stroke="#09090b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {base.hasWingedLiner && (
            <path d="M67.5 46 L71 43.5" stroke="#09090b" strokeWidth="2" strokeLinecap="round" fill="none" />
          )}
        </g>

        {/* 8. 3D Eyebrows (Detailed hair density & sharp cut) */}
        {base.hasEyebrowSlit ? (
          <g filter={`url(#depth-shadow-${uniqueId})`}>
            <path d="M32 39.5 L39.5 37.5" stroke={base.hairColor} strokeWidth="2.6" strokeLinecap="round" />
            <path d="M42 38 L46.5 39.5" stroke={base.hairColor} strokeWidth="2.6" strokeLinecap="round" />
          </g>
        ) : (
          <path d="M32 39.5 Q39.5 36.5, 46.5 39.5" stroke={base.hairColor} strokeWidth="2.8" strokeLinecap="round" fill="none" filter={`url(#depth-shadow-${uniqueId})`} />
        )}
        <path d="M53.5 39.5 Q60.5 36.5, 68 39.5" stroke={base.hairColor} strokeWidth="2.8" strokeLinecap="round" fill="none" filter={`url(#depth-shadow-${uniqueId})`} />

        {/* 9. Sculpted 3D Nose with Bridge & Tip Ball Highlight */}
        <g>
          {/* Bridge shadow */}
          <path d="M48.5 44 L48 51.5 L51 52.5" stroke="#78350f" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeOpacity="0.45" />
          {/* Nose tip 3D specular glint */}
          <circle cx="50" cy="50.5" r="1.2" fill="#ffffff" fillOpacity="0.55" />
          {/* Subtle nostril shadow */}
          <ellipse cx="48" cy="53" rx="1" ry="0.6" fill="#000000" fillOpacity="0.3" />
        </g>

        {/* 10. Plump 3D Lips & Confident Smirk */}
        <g>
          {/* Lip shadow line */}
          <path d="M44 57 Q51 57.5, 58 55.5" stroke="#3b0764" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M57 55.5 L58.5 54.5" stroke="#3b0764" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          {/* Lower lip 3D volume & gloss reflection */}
          <path d="M46 58 Q51 61.5, 56 58" stroke={base.skinShadow} strokeWidth="2.2" strokeLinecap="round" fill="none" strokeOpacity="0.7" />
          <ellipse cx="51" cy="59" rx="2.5" ry="0.9" fill="#ffffff" fillOpacity="0.4" />
        </g>

        {/* 11. Chunky 3D Front Hair Styles (Volume, Strands, and Deep Forehead Shadows) */}
        <g filter={`url(#depth-shadow-${uniqueId})`}>
          {/* Wolf Cut Male */}
          {base.hairType === 'wolf-cut-male' && (
            <g fill={`url(#hair-3d-${uniqueId})`}>
              <path d="M26 44 C25 24, 40 18, 50 18 C62 18, 74 24, 74 44 C68 34, 60 28, 52 34 C46 40, 42 32, 34 33 C28 35, 27 39, 26 44 Z" />
              {/* 3D Textured locks */}
              <path d="M38 33 L36 44 L43 37 Z" />
              <path d="M47 31 L46 46 L54 36 Z" />
              <path d="M58 32 L62 44 L66 35 Z" />
              {/* Hair Gloss Sheen Across Crown */}
              <path d="M36 24 Q50 19, 64 24" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.35" strokeLinecap="round" fill="none" />
            </g>
          )}

          {/* K-Drill Curtains */}
          {base.hairType === 'kpop-curtains' && (
            <g fill={`url(#hair-3d-${uniqueId})`}>
              <path d="M26 45 C25 22, 40 17, 50 17 C60 17, 74 22, 74 45 C70 33, 62 27, 53 34 C52 35, 48 35, 47 34 C38 27, 30 33, 26 45 Z" />
              {/* Volumetric curtain wings */}
              <path d="M34 31 C35 44, 40 49, 44 46 C42 40, 39 34, 38 29 Z" />
              <path d="M66 31 C65 44, 60 49, 56 46 C58 40, 61 34, 62 29 Z" />
              <path d="M34 23 Q50 18, 66 23" stroke="#ffffff" strokeWidth="2.2" strokeOpacity="0.4" strokeLinecap="round" fill="none" />
            </g>
          )}

          {/* Cyberpunk Undercut */}
          {base.hairType === 'cyber-undercut' && (
            <g fill={`url(#hair-3d-${uniqueId})`}>
              <path d="M27 46 C27 34, 32 30, 36 28 L36 44 Z" fill="#0f172a" opacity="0.75" />
              <path d="M73 46 C73 34, 68 30, 64 28 L64 44 Z" fill="#0f172a" opacity="0.75" />
              {/* Neon pompadour wedge */}
              <path d="M32 29 C34 15, 52 13, 66 17 C74 19, 72 31, 70 38 C62 30, 52 26, 42 27 C36 27, 33 28, 32 29 Z" />
              <path d="M40 20 Q54 16, 64 20" stroke="#38bdf8" strokeWidth="2.5" strokeOpacity="0.9" strokeLinecap="round" fill="none" filter={`url(#neon-glow-${uniqueId})`} />
              <line x1="28" y1="38" x2="33" y2="35" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          )}

          {/* Urban Dreads */}
          {base.hairType === 'urban-dreads' && (
            <g fill={`url(#hair-3d-${uniqueId})`}>
              <path d="M27 42 C27 24, 42 19, 50 19 C62 19, 73 24, 73 42 C68 33, 60 29, 50 29 C40 29, 32 33, 27 42 Z" />
              <rect x="34" y="23" width="5.5" height="19" rx="2.8" transform="rotate(-15 36 33)" />
              <rect x="42" y="21" width="6" height="23" rx="3" transform="rotate(-5 44 33)" />
              <rect x="52" y="21" width="6" height="21" rx="3" transform="rotate(10 54 32)" />
              <rect x="61" y="23" width="5.5" height="17" rx="2.8" transform="rotate(25 63 32)" />
              {/* 3D Chrome Gold Ring Cuffs */}
              <rect x="41.5" y="35" width="6.8" height="3.5" fill={`url(#chrome-gold-${uniqueId})`} rx="1" transform="rotate(-5 44 37)" filter={`url(#depth-shadow-${uniqueId})`} />
            </g>
          )}

          {/* Anime Spiky */}
          {base.hairType === 'anime-spiky' && (
            <g fill={`url(#hair-3d-${uniqueId})`}>
              <path d="M26 44 L28 27 L36 31 L40 14 L48 25 L56 12 L62 26 L70 18 L72 33 L74 44 C68 35, 58 31, 48 33 C38 35, 32 37, 26 44 Z" />
              <path d="M38 23 L40 16 L44 24" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
              <path d="M54 20 L56 14 L58 22" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
            </g>
          )}

          {/* Taper Fade Slit */}
          {base.hairType === 'fade-slit' && (
            <g fill={`url(#hair-3d-${uniqueId})`}>
              <path d="M28 44 C27 25, 40 21, 50 21 C62 21, 73 25, 72 44 C68 33, 58 29, 50 29 C40 29, 32 33, 28 44 Z" />
              <line x1="29" y1="36" x2="35" y2="33" stroke="#fed7aa" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="30" y1="40" x2="36" y2="37" stroke="#fed7aa" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M36 26 Q50 22, 64 26" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.35" fill="none" />
            </g>
          )}

          {/* Hoodie Shadow (Streetwear Hood) */}
          {base.hairType === 'hoodie-shadow' && (
            <g>
              <path
                d="M19 54 C17 19, 35 11, 50 11 C65 11, 83 19, 81 54 C74 46, 68 27, 50 27 C32 27, 26 46, 19 54 Z"
                fill="#09090b"
                stroke="#18181b"
                strokeWidth="1.5"
              />
              <path d="M38 29 L36 43 L42 35 Z" fill={`url(#hair-3d-${uniqueId})`} />
              <path d="M46 28 L48 45 L54 34 Z" fill={`url(#hair-3d-${uniqueId})`} />
              <path d="M58 29 L62 43 L65 33 Z" fill={`url(#hair-3d-${uniqueId})`} />
            </g>
          )}

          {/* Street Mullet */}
          {base.hairType === 'street-mullet' && (
            <g fill={`url(#hair-3d-${uniqueId})`}>
              <path d="M27 44 C26 25, 40 21, 50 21 C62 21, 73 25, 73 44 C67 35, 58 31, 50 32 C42 31, 33 35, 27 44 Z" />
              <path d="M40 31 L38 44 L45 36 Z" />
              <path d="M52 31 L54 45 L59 35 Z" />
              <path d="M36 24 Q50 20, 64 24" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.35" fill="none" />
            </g>
          )}

          {/* Wolf Cut Female */}
          {base.hairType === 'wolf-cut-female' && (
            <g fill={`url(#hair-3d-${uniqueId})`}>
              <path d="M25 50 C24 23, 38 17, 50 17 C62 17, 76 23, 75 50 C70 41, 68 33, 60 31 C54 35, 46 35, 40 31 C32 33, 30 41, 25 50 Z" />
              <path d="M30 39 L27 57 L33 48 Z" />
              <path d="M70 39 L73 57 L67 48 Z" />
              <path d="M44 33 L43 46 L48 37 Z" />
              <path d="M54 33 L56 46 L51 37 Z" />
              <path d="M34 22 Q50 17, 66 22" stroke="#ffffff" strokeWidth="2.2" strokeOpacity="0.4" fill="none" />
            </g>
          )}

          {/* Split Dye Bob */}
          {base.hairType === 'split-dye-bob' && (
            <g>
              <path
                d="M25 56 C24 27, 36 19, 50 19 L50 35 C42 33, 34 39, 31 52 C28 54, 26 56, 25 56 Z"
                fill={`url(#hair-3d-${uniqueId})`}
              />
              <path
                d="M50 19 C64 19, 76 27, 75 56 C74 56, 72 54, 69 52 C66 39, 58 33, 50 35 Z"
                fill={`url(#hair2-3d-${uniqueId})`}
              />
              <rect x="33" y="34" width="17" height="3" fill={`url(#hair-3d-${uniqueId})`} />
              <rect x="50" y="34" width="17" height="3" fill={`url(#hair2-3d-${uniqueId})`} />
              <path d="M34 24 Q42 21, 49 22" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.35" fill="none" />
              <path d="M51 22 Q58 21, 66 24" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.5" fill="none" />
            </g>
          )}

          {/* Cyber TwinTails Front */}
          {base.hairType === 'cyber-twintails' && (
            <g fill={`url(#hair-3d-${uniqueId})`}>
              <path d="M26 46 C26 23, 40 19, 50 19 C60 19, 74 23, 74 46 C68 35, 60 31, 50 32 C40 31, 32 35, 26 46 Z" />
              <path d="M32 39 L29 55 L35 46 Z" />
              <path d="M68 39 L71 55 L65 46 Z" />
              <path d="M45 32 L44 45 L49 35 Z" />
              <path d="M54 32 L55 45 L50 35 Z" />
              <path d="M35 23 Q50 18, 65 23" stroke="#38bdf8" strokeWidth="2.2" strokeOpacity="0.75" fill="none" filter={`url(#neon-glow-${uniqueId})`} />
            </g>
          )}

          {/* Sleek HighPony Front */}
          {base.hairType === 'sleek-highpony' && (
            <g fill={`url(#hair-3d-${uniqueId})`}>
              <path d="M27 46 C26 21, 40 17, 50 17 C62 17, 73 21, 73 46 C68 35, 60 31, 50 32 C40 31, 32 35, 27 46 Z" />
              <path d="M31 39 L28 53 L34 46 Z" />
              <path d="M69 39 L72 53 L66 46 Z" />
              <path d="M36 22 Q50 17, 64 22" stroke="#ffffff" strokeWidth="2.2" strokeOpacity="0.4" fill="none" />
            </g>
          )}

          {/* Dark Hime Cut Front */}
          {base.hairType === 'hime-cut' && (
            <g fill={`url(#hair-3d-${uniqueId})`}>
              <path d="M26 56 C25 23, 38 17, 50 17 C62 17, 75 23, 74 56 C71 54, 70 37, 62 33 C58 35, 42 35, 38 33 C30 37, 29 54, 26 56 Z" />
              <rect x="27" y="43" width="7.5" height="13" rx="1.5" />
              <rect x="65.5" y="43" width="7.5" height="13" rx="1.5" />
              <rect x="34" y="31" width="32" height="6.5" rx="1.5" />
              <path d="M35 22 Q50 17, 65 22" stroke="#ffffff" strokeWidth="2.2" strokeOpacity="0.45" fill="none" />
            </g>
          )}

          {/* Side Undercut */}
          {base.hairType === 'side-undercut' && (
            <g fill={`url(#hair-3d-${uniqueId})`}>
              <path d="M67 46 C68 36, 66 30, 62 26 L62 42 Z" fill="#2e1065" opacity="0.75" />
              <path d="M24 52 C24 23, 42 15, 60 17 C66 21, 64 29, 60 33 C52 31, 44 31, 36 37 C32 41, 28 47, 24 52 Z" />
              <path d="M32 21 Q48 16, 58 20" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.4" fill="none" />
            </g>
          )}

          {/* Female Hoodie Bangs */}
          {base.hairType === 'female-hoodie-bangs' && (
            <g>
              <path
                d="M17 54 C15 17, 35 9, 50 9 C65 9, 85 17, 83 54 C74 46, 68 27, 50 27 C32 27, 26 46, 17 54 Z"
                fill="#020617"
                stroke="#18181b"
                strokeWidth="1.5"
              />
              <path d="M32 37 L29 53 L35 44 Z" fill={`url(#hair-3d-${uniqueId})`} />
              <path d="M68 37 L71 53 L65 44 Z" fill={`url(#hair-3d-${uniqueId})`} />
              <rect x="36" y="29" width="28" height="6.5" rx="2" fill={`url(#hair-3d-${uniqueId})`} />
            </g>
          )}
        </g>

        {/* ================================================================ */}
        {/* 12. VOLUMETRIC 3D ACCESSORIES (HEAVY 3D DEPTH, SHADERS & SHADOWS) */}
        {/* ================================================================ */}

        {/* 1. 3D Black Techwear Face Mask */}
        {accessory === 'black-mask' && (
          <g filter={`url(#depth-shadow-${uniqueId})`}>
            {/* 3D Convex Face Mask */}
            <path
              d="M31 51 C31 51, 42 47.5, 50 47.5 C58 47.5, 69 51, 69 51 C69 65, 60 72, 50 72 C40 72, 31 65, 31 51 Z"
              fill="#18181b"
              stroke="#27272a"
              strokeWidth="1.5"
            />
            {/* Top Nose Wire Ridge */}
            <path d="M36 49.5 Q50 47.5, 64 49.5" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.3" fill="none" />
            {/* Side Tension Straps */}
            <line x1="31" y1="52" x2="26" y2="51" stroke="#09090b" strokeWidth="2" />
            <line x1="69" y1="52" x2="74" y2="51" stroke="#09090b" strokeWidth="2" />
            {/* Vertical Center Seam with 3D Depth */}
            <line x1="50" y1="48" x2="50" y2="72" stroke="#09090b" strokeWidth="1.8" />
            {/* Glowing Cyber Symbol */}
            <path d="M47 60 L53 60 M50 57 L50 63" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" filter={`url(#neon-glow-${uniqueId})`} />
          </g>
        )}

        {/* 2. 3D Anime Cheek Band-Aid */}
        {accessory === 'bandaid' && (
          <g transform="rotate(-15 38 52)" filter={`url(#depth-shadow-${uniqueId})`}>
            <rect x="30" y="48.5" width="16" height="7" rx="2.5" fill="#fef08a" stroke="#d97706" strokeWidth="0.9" />
            <rect x="31" y="49.5" width="14" height="2" fill="#ffffff" fillOpacity="0.4" />
            <circle cx="38" cy="52" r="1.8" fill="#f59e0b" />
          </g>
        )}

        {/* 3. 3D Silver Cross Dangle Piercing (Liquid Chrome Finish) */}
        {accessory === 'cross-earring' && (
          <g filter={`url(#depth-shadow-${uniqueId})`}>
            {/* 3D Hoop */}
            <circle cx="26" cy="52" r="2.4" fill="none" stroke={`url(#chrome-silver-${uniqueId})`} strokeWidth="1.5" />
            {/* Hanging Ring Link */}
            <line x1="26" y1="54.5" x2="26" y2="59" stroke={`url(#chrome-silver-${uniqueId})`} strokeWidth="1.2" />
            {/* 3D Beveled Cross */}
            <line x1="26" y1="59" x2="26" y2="69" stroke={`url(#chrome-silver-${uniqueId})`} strokeWidth="2.2" strokeLinecap="round" />
            <line x1="22.5" y1="62" x2="29.5" y2="62" stroke={`url(#chrome-silver-${uniqueId})`} strokeWidth="2.2" strokeLinecap="round" />
            {/* Chrome Specular Glint */}
            <circle cx="26" cy="62" r="1" fill="#ffffff" />
          </g>
        )}

        {/* 4. 3D Neon Cyber Visor (HUD Scouter with LED Emission) */}
        {accessory === 'cyber-visor' && (
          <g filter={`url(#depth-shadow-${uniqueId})`}>
            {/* Translucent Cyan Glass Shield */}
            <path
              d="M50 42 L73 40 L71 54 L53 54 Z"
              fill="rgba(34, 211, 238, 0.45)"
              stroke="#22d3ee"
              strokeWidth="1.8"
              filter={`url(#neon-glow-${uniqueId})`}
            />
            {/* Metallic Temple Node */}
            <rect x="71" y="43" width="5" height="9" rx="2.5" fill="#0f172a" stroke={`url(#chrome-silver-${uniqueId})`} strokeWidth="1.2" />
            {/* Glass Glare Streaks */}
            <path d="M53 45 L69 43" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.85" />
            {/* Digital HUD Target Crosshair */}
            <circle cx="61" cy="49" r="2.2" fill="none" stroke="#22d3ee" strokeWidth="1" />
            <circle cx="61" cy="49" r="0.8" fill="#ffffff" />
          </g>
        )}

        {/* 5. 3D Matrix Blade Cyber Shades */}
        {accessory === 'blade-shades' && (
          <g filter={`url(#depth-shadow-${uniqueId})`}>
            <path
              d="M27 43.5 Q50 41, 73 43.5 L71 52 Q50 54.5, 29 52 Z"
              fill="#09090b"
              stroke="#27272a"
              strokeWidth="1.2"
            />
            {/* 3D Polarized Neon Glare Bevels */}
            <path d="M32 46 L46 49.5" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" filter={`url(#neon-glow-${uniqueId})`} />
            <path d="M54 46 L68 49.5" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" filter={`url(#neon-glow-${uniqueId})`} />
            {/* Top Frame Specular Glint */}
            <path d="M29 44 Q50 42, 71 44" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.5" fill="none" />
          </g>
        )}

        {/* 6. 3D RGB Pro Gamer Headset + Boom Mic */}
        {accessory === 'rgb-headphones' && (
          <g filter={`url(#depth-shadow-${uniqueId})`}>
            {/* Cushioned 3D Headband */}
            <path d="M21 46 C21 17, 79 17, 79 46" fill="none" stroke="#09090b" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M23 46 C23 19, 77 19, 77 46" fill="none" stroke={`url(#chrome-silver-${uniqueId})`} strokeWidth="1.8" strokeLinecap="round" />
            {/* 3D Ear Cups with Circular RGB Glowing LED Ring */}
            <rect x="17" y="41" width="8" height="18" rx="4" fill="#18181b" stroke="#22d3ee" strokeWidth="1.8" filter={`url(#neon-glow-${uniqueId})`} />
            <rect x="75" y="41" width="8" height="18" rx="4" fill="#18181b" stroke="#22d3ee" strokeWidth="1.8" filter={`url(#neon-glow-${uniqueId})`} />
            {/* Flexible Boom Microphone */}
            <path d="M23 54 C23 66, 33 67, 43 64" fill="none" stroke="#09090b" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="43" cy="64" r="3" fill="#22d3ee" filter={`url(#neon-glow-${uniqueId})`} />
          </g>
        )}

        {/* 7. 3D Neon Cat-Ear Gaming Headset */}
        {accessory === 'cat-headphones' && (
          <g filter={`url(#depth-shadow-${uniqueId})`}>
            {/* Headband */}
            <path d="M22 46 C22 18, 78 18, 78 46" fill="none" stroke="#09090b" strokeWidth="4.5" strokeLinecap="round" />
            {/* 3D Cat Ears with Inner Neon Glow */}
            <polygon points="29,22 39,7 45,22" fill="#ec4899" stroke="#f472b6" strokeWidth="1.8" filter={`url(#neon-glow-${uniqueId})`} />
            <polygon points="33,20 39,11 43,20" fill="#ffffff" />
            <polygon points="55,22 61,7 71,22" fill="#ec4899" stroke="#f472b6" strokeWidth="1.8" filter={`url(#neon-glow-${uniqueId})`} />
            <polygon points="57,20 61,11 67,20" fill="#ffffff" />
            {/* Ear Cups */}
            <rect x="17" y="41" width="8" height="18" rx="4" fill="#18181b" stroke="#ec4899" strokeWidth="1.8" filter={`url(#neon-glow-${uniqueId})`} />
            <rect x="75" y="41" width="8" height="18" rx="4" fill="#18181b" stroke="#ec4899" strokeWidth="1.8" filter={`url(#neon-glow-${uniqueId})`} />
          </g>
        )}

        {/* 8. 3D Tactical Head Goggles */}
        {accessory === 'goggles-head' && (
          <g filter={`url(#depth-shadow-${uniqueId})`}>
            {/* Thick Leather Strap */}
            <path d="M22 27 C22 27, 50 23, 78 27" stroke="#18181b" strokeWidth="4" fill="none" />
            {/* Cylindrical 3D Brass/Gold Frames */}
            <rect x="31" y="20" width="16" height="13" rx="4" fill="#0f172a" stroke={`url(#chrome-gold-${uniqueId})`} strokeWidth="2" />
            <rect x="33" y="22" width="12" height="9" rx="2.5" fill="#38bdf8" fillOpacity="0.8" />
            <rect x="53" y="20" width="16" height="13" rx="4" fill="#0f172a" stroke={`url(#chrome-gold-${uniqueId})`} strokeWidth="2" />
            <rect x="55" y="22" width="12" height="9" rx="2.5" fill="#38bdf8" fillOpacity="0.8" />
            {/* 3D Glass Specular Glare */}
            <line x1="35" y1="24" x2="43" y2="28" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="57" y1="24" x2="65" y2="28" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            {/* Center Bridge */}
            <line x1="47" y1="26" x2="53" y2="26" stroke={`url(#chrome-gold-${uniqueId})`} strokeWidth="2.5" />
          </g>
        )}

        {/* 9. 3D Cuban Link Heavy Silver Chain & Choker */}
        {accessory === 'silver-chain' && (
          <g filter={`url(#depth-shadow-${uniqueId})`}>
            {/* Black Leather Choker */}
            <path d="M42 62 Q50 67, 58 62" stroke="#09090b" strokeWidth="3" fill="none" />
            {/* Interlocking 3D Liquid Chrome Cuban Chain */}
            <path
              d="M37 72 Q50 84, 63 72"
              stroke={`url(#chrome-silver-${uniqueId})`}
              strokeWidth="3.6"
              strokeDasharray="3.5 1.2"
              fill="none"
            />
            {/* 3D Metallic Silver Lock / Pendant */}
            <circle cx="50" cy="78" r="3.5" fill={`url(#chrome-silver-${uniqueId})`} />
            <circle cx="50" cy="78" r="1.2" fill="#09090b" />
          </g>
        )}

        {/* 10. 3D Streetwear Pierced Ring Cap */}
        {accessory === 'pierced-cap' && (
          <g filter={`url(#depth-shadow-${uniqueId})`}>
            {/* Cap Dome with 3D spherical lighting */}
            <path d="M26 35 C26 15, 74 15, 74 35 Z" fill="#09090b" stroke="#18181b" strokeWidth="1.2" />
            <ellipse cx="50" cy="22" rx="14" ry="6" fill="#ffffff" fillOpacity="0.12" />
            {/* 3D Curved Visor Brim */}
            <path d="M22 35 Q50 26, 78 35 Q64 43, 22 35 Z" fill="#18181b" stroke="#27272a" strokeWidth="1.2" />
            {/* 3 Interlocking 3D Chrome Silver Pierced Rings */}
            <circle cx="28" cy="38" r="2.4" fill="none" stroke={`url(#chrome-silver-${uniqueId})`} strokeWidth="1.5" />
            <circle cx="34" cy="37" r="2.4" fill="none" stroke={`url(#chrome-silver-${uniqueId})`} strokeWidth="1.5" />
            <circle cx="40" cy="36" r="2.4" fill="none" stroke={`url(#chrome-silver-${uniqueId})`} strokeWidth="1.5" />
            <circle cx="50" cy="17" r="2.5" fill="#27272a" />
          </g>
        )}

        {/* 11. 3D Neon Cyber Horns */}
        {accessory === 'demon-horns' && (
          <g filter={`url(#depth-shadow-${uniqueId})`}>
            {/* Left Glowing 3D Horn */}
            <path d="M34 26 C32 13, 23 9, 21 7 C26 15, 32 19, 38 24 Z" fill="#f43f5e" stroke="#fb7185" strokeWidth="1.5" filter={`url(#neon-glow-${uniqueId})`} />
            {/* Right Glowing 3D Horn */}
            <path d="M66 26 C68 13, 77 9, 79 7 C74 15, 68 19, 62 24 Z" fill="#f43f5e" stroke="#fb7185" strokeWidth="1.5" filter={`url(#neon-glow-${uniqueId})`} />
          </g>
        )}

        {/* 12. 3D Gold Polygonal Aesthetic Glasses */}
        {accessory === 'aesthetic-glasses' && (
          <g stroke={`url(#chrome-gold-${uniqueId})`} strokeWidth="1.8" fill="rgba(255, 255, 255, 0.22)" filter={`url(#depth-shadow-${uniqueId})`}>
            {/* Left Octagon Frame */}
            <polygon points="33,43 41,41 47,44 47,51 41,54 33,51" />
            {/* Right Octagon Frame */}
            <polygon points="53,44 59,41 67,43 67,51 59,54 53,51" />
            {/* Bridge */}
            <line x1="47" y1="46" x2="53" y2="46" strokeWidth="2.2" />
            {/* Temples */}
            <line x1="33" y1="45" x2="26" y2="47" strokeWidth="1.5" />
            <line x1="67" y1="45" x2="74" y2="47" strokeWidth="1.5" />
            {/* Lens Glare */}
            <line x1="36" y1="45" x2="42" y2="43" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="56" y1="45" x2="62" y2="43" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        )}

        {/* 13. 3D Skater Ring Beanie */}
        {accessory === 'beanie-ring' && (
          <g filter={`url(#depth-shadow-${uniqueId})`}>
            {/* Beanie Dome */}
            <path d="M24 34 C24 11, 76 11, 76 34 Z" fill="#18181b" />
            {/* Chunky Folded Cuff */}
            <rect x="22" y="29" width="56" height="9" rx="3.5" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />
            {/* Silver Safety Pin & Ring */}
            <circle cx="34" cy="33.5" r="3" fill="none" stroke={`url(#chrome-silver-${uniqueId})`} strokeWidth="1.5" />
            <line x1="33" y1="30" x2="40" y2="32" stroke={`url(#chrome-silver-${uniqueId})`} strokeWidth="1.5" />
          </g>
        )}

        {/* 14. 3D Battle Scar & Star Tattoo */}
        {accessory === 'cheek-scar' && (
          <g>
            {/* 3D Indented Anime Scar */}
            <line x1="33" y1="49.5" x2="44" y2="56.5" stroke="#991b1b" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="38" y1="51" x2="40" y2="55" stroke="#991b1b" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="34" y1="50" x2="43" y2="56" stroke="#fca5a5" strokeWidth="0.8" strokeLinecap="round" />
            {/* Neon Star Tattoo under right eye */}
            <path
              d="M62 52 L63 54 L65 54 L63.5 55.5 L64 57.5 L62 56 L60 57.5 L60.5 55.5 L59 54 L61 54 Z"
              fill="#38bdf8"
              filter={`url(#neon-glow-${uniqueId})`}
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
