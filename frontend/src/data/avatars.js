// 3D Cartoon / Memoji Student Avatars Collection
// Built with pure vector SVG - 100% offline ready, no CDNs required.

export const BG_GRADIENTS = [
  { id: 'ocean', name: 'Ocean Blue', from: '#2563eb', via: '#4f46e5', to: '#06b6d4' },
  { id: 'purple', name: 'Cosmic Violet', from: '#7c3aed', via: '#9333ea', to: '#ec4899' },
  { id: 'sunset', name: 'Sunset Glow', from: '#f97316', via: '#fb7185', to: '#e11d48' },
  { id: 'emerald', name: 'Emerald Forest', from: '#059669', via: '#10b981', to: '#14b8a6' },
  { id: 'cyber', name: 'Cyberpunk Neon', from: '#ec4899', via: '#8b5cf6', to: '#06b6d4' },
  { id: 'midnight', name: 'Midnight Dark', from: '#1e293b', via: '#0f172a', to: '#334155' },
  { id: 'amber', name: 'Golden Sun', from: '#f59e0b', via: '#d97706', to: '#ef4444' },
  { id: 'rose', name: 'Rose Gold', from: '#fb7185', via: '#f43f5e', to: '#fda4af' },
];

export const ACCESSORIES = [
  { id: 'none', name: 'Walang Accessory', icon: '✨' },
  { id: 'glasses', name: 'Study Glasses', icon: '👓' },
  { id: 'shades', name: 'Cool Sunglasses', icon: '🕶️' },
  { id: 'headphones', name: 'Gaming Headset', icon: '🎧' },
  { id: 'cap', name: 'Student Cap', icon: '🧢' },
  { id: 'beanie', name: 'Cozy Beanie', icon: '🧶' },
];

export const BASE_AVATARS = [
  // MALE AVATARS
  {
    id: 'male-1',
    name: 'Casual Boy',
    gender: 'male',
    tag: 'Varsity Cool',
    skin: '#fed7aa',
    skinShadow: '#fbd38d',
    hairColor: '#1e1b18',
    outfitColor: '#2563eb',
    outfitAccent: '#ffffff',
    hairType: 'short-fade',
  },
  {
    id: 'male-2',
    name: 'Tech Scholar',
    gender: 'male',
    tag: 'Dean\'s Lister',
    skin: '#ffedd5',
    skinShadow: '#fcd34d',
    hairColor: '#451a03',
    outfitColor: '#4f46e5',
    outfitAccent: '#93c5fd',
    hairType: 'side-part',
  },
  {
    id: 'male-3',
    name: 'Curly Chill',
    gender: 'male',
    tag: 'Creative Coder',
    skin: '#e2a76f',
    skinShadow: '#c98348',
    hairColor: '#18181b',
    outfitColor: '#059669',
    outfitAccent: '#a7f3d0',
    hairType: 'curly-top',
  },
  {
    id: 'male-4',
    name: 'Gamer Guy',
    gender: 'male',
    tag: 'Night Owl',
    skin: '#fed7aa',
    skinShadow: '#fbd38d',
    hairColor: '#3b82f6',
    outfitColor: '#7c3aed',
    outfitAccent: '#ec4899',
    hairType: 'spiky-anime',
  },
  {
    id: 'male-5',
    name: 'Curtain Waves',
    gender: 'male',
    tag: 'Campus Idol',
    skin: '#ffedd5',
    skinShadow: '#fed7aa',
    hairColor: '#292524',
    outfitColor: '#0f172a',
    outfitAccent: '#f59e0b',
    hairType: 'curtains',
  },
  {
    id: 'male-6',
    name: 'Warm Bronze',
    gender: 'male',
    tag: 'Athlete Student',
    skin: '#b45309',
    skinShadow: '#92400e',
    hairColor: '#09090b',
    outfitColor: '#dc2626',
    outfitAccent: '#fef08a',
    hairType: 'textured-fade',
  },

  // FEMALE AVATARS
  {
    id: 'female-1',
    name: 'High Ponytail',
    gender: 'female',
    tag: 'Honor Student',
    skin: '#fed7aa',
    skinShadow: '#fbd38d',
    hairColor: '#451a03',
    outfitColor: '#ec4899',
    outfitAccent: '#fbcfe8',
    hairType: 'high-ponytail',
  },
  {
    id: 'female-2',
    name: 'Chic Bob Cut',
    gender: 'female',
    tag: 'Tech Achiever',
    skin: '#ffedd5',
    skinShadow: '#fed7aa',
    hairColor: '#1c1917',
    outfitColor: '#7c3aed',
    outfitAccent: '#c4b5fd',
    hairType: 'bob-cut',
  },
  {
    id: 'female-3',
    name: 'Long Flowing',
    gender: 'female',
    tag: 'Class President',
    skin: '#fed7aa',
    skinShadow: '#fbd38d',
    hairColor: '#78350f',
    outfitColor: '#2563eb',
    outfitAccent: '#bae6fd',
    hairType: 'long-wavy',
  },
  {
    id: 'female-4',
    name: 'Top Bun',
    gender: 'female',
    tag: 'Coffee & Books',
    skin: '#ffedd5',
    skinShadow: '#fed7aa',
    hairColor: '#3f3f46',
    outfitColor: '#059669',
    outfitAccent: '#d1fae5',
    hairType: 'top-bun',
  },
  {
    id: 'female-5',
    name: 'Curly Glow',
    gender: 'female',
    tag: 'Creative Spirit',
    skin: '#c27d38',
    skinShadow: '#a15c1e',
    hairColor: '#171717',
    outfitColor: '#d97706',
    outfitAccent: '#fef3c7',
    hairType: 'curly-afro',
  },
  {
    id: 'female-6',
    name: 'Pastel Bangs',
    gender: 'female',
    tag: 'Aesthetic Queen',
    skin: '#ffedd5',
    skinShadow: '#fed7aa',
    hairColor: '#f43f5e',
    outfitColor: '#8b5cf6',
    outfitAccent: '#fbcfe8',
    hairType: 'bangs-straight',
  },
];

/**
 * Parse an avatar string or config object safely
 */
export const parseAvatar = (rawAvatar, defaultGender = 'male') => {
  const fallback = {
    base: defaultGender === 'female' ? 'female-1' : 'male-1',
    accessory: 'none',
    bg: defaultGender === 'female' ? 'purple' : 'ocean',
  };

  if (!rawAvatar) return fallback;

  // If already an object
  if (typeof rawAvatar === 'object') {
    return {
      base: rawAvatar.base || fallback.base,
      accessory: rawAvatar.accessory || 'none',
      bg: rawAvatar.bg || fallback.bg,
    };
  }

  // If JSON string
  if (typeof rawAvatar === 'string' && rawAvatar.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawAvatar);
      return {
        base: parsed.base || fallback.base,
        accessory: parsed.accessory || 'none',
        bg: parsed.bg || fallback.bg,
      };
    } catch (e) {
      // Fallback below
    }
  }

  // If shorthand format: "base:accessory:bg"
  if (typeof rawAvatar === 'string' && rawAvatar.includes(':')) {
    const parts = rawAvatar.split(':');
    return {
      base: parts[0] || fallback.base,
      accessory: parts[1] || 'none',
      bg: parts[2] || fallback.bg,
    };
  }

  // If single ID string (e.g. "female-1" or "male-2")
  const matchedBase = BASE_AVATARS.find((b) => b.id === rawAvatar);
  if (matchedBase) {
    return {
      base: matchedBase.id,
      accessory: 'none',
      bg: matchedBase.gender === 'female' ? 'purple' : 'ocean',
    };
  }

  return fallback;
};

/**
 * Serialize avatar config to storage string
 */
export const serializeAvatar = (config) => {
  return JSON.stringify({
    base: config.base || 'male-1',
    accessory: config.accessory || 'none',
    bg: config.bg || 'ocean',
  });
};
