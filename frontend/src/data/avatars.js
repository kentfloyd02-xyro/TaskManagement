// Streetwear / Cyber / Anime "Maangas" Student Avatars Collection
// 100% Vector SVG - Offline-ready, zero external CDNs, high resolution.

export const BG_GRADIENTS = [
  { id: 'tokyo-neon', name: 'Tokyo Neon Cyber', from: '#0f172a', via: '#701a75', to: '#06b6d4', glow: '#ec4899' },
  { id: 'blood-moon', name: 'Blood Moon Eclipse', from: '#18181b', via: '#881337', to: '#e11d48', glow: '#f43f5e' },
  { id: 'obsidian', name: 'Stealth Obsidian', from: '#09090b', via: '#18181b', to: '#27272a', glow: '#71717a' },
  { id: 'acid-matrix', name: 'Acid Matrix Glitch', from: '#022c22', via: '#064e3b', to: '#10b981', glow: '#22c55e' },
  { id: 'cosmic-purple', name: 'Cosmic Ultraviolet', from: '#0f172a', via: '#581c87', to: '#9333ea', glow: '#a855f7' },
  { id: 'sunset-heat', name: 'Sunset Heatwave', from: '#451a03', via: '#c2410c', to: '#f97316', glow: '#fb923c' },
  { id: 'ocean-abyss', name: 'Electric Ocean Abyss', from: '#030712', via: '#1e3a8a', to: '#2563eb', glow: '#38bdf8' },
  { id: 'golden-royale', name: 'Golden Royale', from: '#1c1917', via: '#78350f', to: '#d97706', glow: '#fbbf24' },
];

export const ACCESSORIES = [
  { id: 'none', name: 'Walang Accessory', icon: '✨', category: 'Basic' },
  { id: 'black-mask', name: 'Techwear Black Mask', icon: '🖤', category: 'Streetwear' },
  { id: 'bandaid', name: 'Anime Cheek Band-Aid', icon: '🩹', category: 'Anime' },
  { id: 'cross-earring', name: 'Silver Cross Piercing', icon: '✝️', category: 'Jewelry' },
  { id: 'cyber-visor', name: 'Neon Cyber Visor (HUD)', icon: '⚡', category: 'Cyber' },
  { id: 'blade-shades', name: 'Matrix Blade Shades', icon: '🕶️', category: 'Eyewear' },
  { id: 'rgb-headphones', name: 'RGB Gamer Headset + Mic', icon: '🎧', category: 'Gaming' },
  { id: 'cat-headphones', name: 'Neon Cat-Ear Headset', icon: '🐱', category: 'Gaming' },
  { id: 'goggles-head', name: 'Tactical Head Goggles', icon: '🥽', category: 'Techwear' },
  { id: 'silver-chain', name: 'Cuban Link Chain & Choker', icon: '⛓️', category: 'Jewelry' },
  { id: 'pierced-cap', name: 'Streetwear Pierced Cap', icon: '🧢', category: 'Headwear' },
  { id: 'demon-horns', name: 'Neon Cyber Horns', icon: '😈', category: 'Cyber' },
  { id: 'aesthetic-glasses', name: 'Gold Polygonal Glasses', icon: '👓', category: 'Eyewear' },
  { id: 'beanie-ring', name: 'Skater Ring Beanie', icon: '🧶', category: 'Headwear' },
  { id: 'cheek-scar', name: 'Battle Scar & Star', icon: '⭐', category: 'Anime' },
];

export const BASE_AVATARS = [
  // ==================== MALE MAANGAS AVATARS ====================
  {
    id: 'male-wolf',
    name: 'Shadow Wolf Cut',
    gender: 'male',
    tag: 'Street Rebel',
    skin: '#fed7aa',
    skinShadow: '#fbd38d',
    hairColor: '#0f172a',
    hairHighlight: '#334155',
    eyeColor: '#38bdf8',
    outfitColor: '#09090b',
    outfitAccent: '#38bdf8',
    hairType: 'wolf-cut-male',
    hasEyebrowSlit: true,
  },
  {
    id: 'male-curtains',
    name: 'K-Drill Curtains',
    gender: 'male',
    tag: 'Campus Heartthrob',
    skin: '#ffedd5',
    skinShadow: '#fed7aa',
    hairColor: '#18181b',
    hairHighlight: '#27272a',
    eyeColor: '#a855f7',
    outfitColor: '#1e1b4b',
    outfitAccent: '#c084fc',
    hairType: 'kpop-curtains',
    hasEyebrowSlit: true,
  },
  {
    id: 'male-cyberpunk',
    name: 'Cyberpunk Runner',
    gender: 'male',
    tag: 'Neon Netrunner',
    skin: '#ffedd5',
    skinShadow: '#fcd34d',
    hairColor: '#0284c7',
    hairHighlight: '#38bdf8',
    eyeColor: '#22d3ee',
    outfitColor: '#0f172a',
    outfitAccent: '#38bdf8',
    hairType: 'cyber-undercut',
    hasEyebrowSlit: false,
  },
  {
    id: 'male-dreads',
    name: 'Urban Dreads',
    gender: 'male',
    tag: 'HipHop Hustler',
    skin: '#c27d38',
    skinShadow: '#9a561f',
    hairColor: '#0a0a0a',
    hairHighlight: '#262626',
    eyeColor: '#f59e0b',
    outfitColor: '#7c2d12',
    outfitAccent: '#fef08a',
    hairType: 'urban-dreads',
    hasEyebrowSlit: true,
  },
  {
    id: 'male-spiky',
    name: 'Phantom Striker',
    gender: 'male',
    tag: 'Anime Protagonist',
    skin: '#fed7aa',
    skinShadow: '#fbd38d',
    hairColor: '#e11d48',
    hairHighlight: '#fb7185',
    eyeColor: '#f43f5e',
    outfitColor: '#18181b',
    outfitAccent: '#e11d48',
    hairType: 'anime-spiky',
    hasEyebrowSlit: false,
  },
  {
    id: 'male-fade-slit',
    name: 'Taper Fade Ace',
    gender: 'male',
    tag: 'Clean & Lethal',
    skin: '#fed7aa',
    skinShadow: '#fbd38d',
    hairColor: '#171717',
    hairHighlight: '#262626',
    eyeColor: '#10b981',
    outfitColor: '#064e3b',
    outfitAccent: '#34d399',
    hairType: 'fade-slit',
    hasEyebrowSlit: true,
  },
  {
    id: 'male-hoodie',
    name: 'Ghost Operator',
    gender: 'male',
    tag: 'Night Coder',
    skin: '#ffedd5',
    skinShadow: '#fed7aa',
    hairColor: '#262626',
    hairHighlight: '#525252',
    eyeColor: '#e2e8f0',
    outfitColor: '#020617',
    outfitAccent: '#64748b',
    hairType: 'hoodie-shadow',
    hasEyebrowSlit: false,
  },
  {
    id: 'male-mullet',
    name: 'Modern Mullet',
    gender: 'male',
    tag: 'Indie Rocker',
    skin: '#e2a76f',
    skinShadow: '#c98348',
    hairColor: '#451a03',
    hairHighlight: '#78350f',
    eyeColor: '#fb923c',
    outfitColor: '#312e81',
    outfitAccent: '#f43f5e',
    hairType: 'street-mullet',
    hasEyebrowSlit: true,
  },

  // ==================== FEMALE MAANGAS AVATARS ====================
  {
    id: 'female-wolf',
    name: 'Wolf Cut Shag',
    gender: 'female',
    tag: 'Edgy Rebel',
    skin: '#ffedd5',
    skinShadow: '#fed7aa',
    hairColor: '#18181b',
    hairHighlight: '#3f3f46',
    eyeColor: '#a855f7',
    outfitColor: '#09090b',
    outfitAccent: '#c084fc',
    hairType: 'wolf-cut-female',
    hasWingedLiner: true,
  },
  {
    id: 'female-splitdye',
    name: 'Split-Dye Bob',
    gender: 'female',
    tag: 'E-Girl Gamer',
    skin: '#ffedd5',
    skinShadow: '#fed7aa',
    hairColor: '#09090b',
    hairColor2: '#ec4899', // split dye half
    hairHighlight: '#f472b6',
    eyeColor: '#ec4899',
    outfitColor: '#1e1b4b',
    outfitAccent: '#f43f5e',
    hairType: 'split-dye-bob',
    hasWingedLiner: true,
  },
  {
    id: 'female-twintails',
    name: 'Cyber TwinTails',
    gender: 'female',
    tag: 'Valkyrie Ace',
    skin: '#fed7aa',
    skinShadow: '#fbd38d',
    hairColor: '#0284c7',
    hairHighlight: '#38bdf8',
    eyeColor: '#38bdf8',
    outfitColor: '#0f172a',
    outfitAccent: '#38bdf8',
    hairType: 'cyber-twintails',
    hasWingedLiner: true,
  },
  {
    id: 'female-highpony',
    name: 'Sleek Assassin Pony',
    gender: 'female',
    tag: 'Alpha Student',
    skin: '#ffedd5',
    skinShadow: '#fed7aa',
    hairColor: '#09090b',
    hairHighlight: '#27272a',
    eyeColor: '#10b981',
    outfitColor: '#18181b',
    outfitAccent: '#10b981',
    hairType: 'sleek-highpony',
    hasWingedLiner: true,
  },
  {
    id: 'female-hime',
    name: 'Dark Hime Cut',
    gender: 'female',
    tag: 'Anime Empress',
    skin: '#fff1f2',
    skinShadow: '#ffe4e6',
    hairColor: '#09090b',
    hairHighlight: '#1e1b4b',
    eyeColor: '#e11d48',
    outfitColor: '#31102f',
    outfitAccent: '#f43f5e',
    hairType: 'hime-cut',
    hasWingedLiner: true,
  },
  {
    id: 'female-braids',
    name: 'Braided Valkyrie',
    gender: 'female',
    tag: 'Golden Empress',
    skin: '#b45309',
    skinShadow: '#92400e',
    hairColor: '#0a0a0a',
    hairHighlight: '#262626',
    eyeColor: '#fbbf24',
    outfitColor: '#78350f',
    outfitAccent: '#fef08a',
    hairType: 'box-braids-female',
    hasWingedLiner: true,
  },
  {
    id: 'female-undercut',
    name: 'Asymmetric Undercut',
    gender: 'female',
    tag: 'Rockstar Maverick',
    skin: '#ffedd5',
    skinShadow: '#fed7aa',
    hairColor: '#7c3aed',
    hairHighlight: '#a78bfa',
    eyeColor: '#c084fc',
    outfitColor: '#09090b',
    outfitAccent: '#8b5cf6',
    hairType: 'side-undercut',
    hasWingedLiner: true,
  },
  {
    id: 'female-hoodie',
    name: 'Night Stalker',
    gender: 'female',
    tag: 'Ghost Hacker',
    skin: '#ffedd5',
    skinShadow: '#fed7aa',
    hairColor: '#475569',
    hairHighlight: '#94a3b8',
    eyeColor: '#38bdf8',
    outfitColor: '#020617',
    outfitAccent: '#38bdf8',
    hairType: 'female-hoodie-bangs',
    hasWingedLiner: true,
  },
];

/**
 * Safely parse avatar from string or object
 */
export const parseAvatar = (rawAvatar, defaultGender = 'male') => {
  const fallback = {
    base: defaultGender === 'female' ? 'female-wolf' : 'male-wolf',
    accessory: 'none',
    bg: defaultGender === 'female' ? 'tokyo-neon' : 'blood-moon',
  };

  if (!rawAvatar) return fallback;

  if (typeof rawAvatar === 'object') {
    return {
      base: rawAvatar.base || fallback.base,
      accessory: rawAvatar.accessory || 'none',
      bg: rawAvatar.bg || fallback.bg,
    };
  }

  if (typeof rawAvatar === 'string' && rawAvatar.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawAvatar);
      return {
        base: parsed.base || fallback.base,
        accessory: parsed.accessory || 'none',
        bg: parsed.bg || fallback.bg,
      };
    } catch (e) {}
  }

  if (typeof rawAvatar === 'string' && rawAvatar.includes(':')) {
    const parts = rawAvatar.split(':');
    return {
      base: parts[0] || fallback.base,
      accessory: parts[1] || 'none',
      bg: parts[2] || fallback.bg,
    };
  }

  // Backwards compatibility with legacy IDs (male-1, female-1, etc.)
  const legacyMap = {
    'male-1': 'male-wolf',
    'male-2': 'male-curtains',
    'male-3': 'male-dreads',
    'male-4': 'male-cyberpunk',
    'male-5': 'male-fade-slit',
    'male-6': 'male-mullet',
    'female-1': 'female-highpony',
    'female-2': 'female-wolf',
    'female-3': 'female-hime',
    'female-4': 'female-splitdye',
    'female-5': 'female-braids',
    'female-6': 'female-twintails',
  };

  if (legacyMap[rawAvatar]) {
    return {
      base: legacyMap[rawAvatar],
      accessory: 'none',
      bg: rawAvatar.startsWith('female') ? 'tokyo-neon' : 'blood-moon',
    };
  }

  const matchedBase = BASE_AVATARS.find((b) => b.id === rawAvatar);
  if (matchedBase) {
    return {
      base: matchedBase.id,
      accessory: 'none',
      bg: matchedBase.gender === 'female' ? 'tokyo-neon' : 'blood-moon',
    };
  }

  return fallback;
};

/**
 * Serialize avatar config to JSON string
 */
export const serializeAvatar = (config) => {
  return JSON.stringify({
    base: config.base || 'male-wolf',
    accessory: config.accessory || 'none',
    bg: config.bg || 'tokyo-neon',
  });
};
