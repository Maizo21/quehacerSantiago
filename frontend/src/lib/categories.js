export const CATEGORIES = [
  {
    key: 'outdoor',
    label: 'Outdoor',
    emoji: '🌲',
    style: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    activeStyle: 'bg-emerald-500/30 text-emerald-200 border-emerald-400/60',
    matchers: ['outdoor', 'aire libre', 'naturaleza']
  },
  {
    key: 'cultura',
    label: 'Cultura',
    emoji: '🎨',
    style: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    activeStyle: 'bg-indigo-500/30 text-indigo-200 border-indigo-400/60',
    matchers: ['cultural', 'cultura', 'museo', 'arte', 'teatro']
  },
  {
    key: 'comer',
    label: 'Comer',
    emoji: '🍽️',
    style: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    activeStyle: 'bg-amber-500/30 text-amber-200 border-amber-400/60',
    matchers: ['gastronomía', 'gastronomia', 'comer', 'restaurante', 'food']
  },
  {
    key: 'noche',
    label: 'Noche',
    emoji: '🌙',
    style: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    activeStyle: 'bg-violet-500/30 text-violet-200 border-violet-400/60',
    matchers: ['noche', 'nocturno', 'bar', 'fiesta']
  },
  {
    key: 'gratis',
    label: 'Gratis',
    emoji: '💚',
    style: 'bg-green-500/15 text-green-300 border-green-500/30',
    activeStyle: 'bg-green-500/30 text-green-200 border-green-400/60',
    matchers: ['gratis', 'gratuito', 'free', 'económico']
  },
  {
    key: 'con-ninos',
    label: 'Con niños',
    emoji: '👶',
    style: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    activeStyle: 'bg-pink-500/30 text-pink-200 border-pink-400/60',
    matchers: ['con niños', 'familia', 'niños', 'familiar']
  }
];

const TAG_TO_STYLE = new Map();
CATEGORIES.forEach(c => c.matchers.forEach(m => TAG_TO_STYLE.set(m.toLowerCase(), c.style)));

const NEUTRAL_TAG_STYLE = 'bg-surface text-sage-dim border-border';

export function getTagStyle(tag) {
  return TAG_TO_STYLE.get(tag.toLowerCase()) || NEUTRAL_TAG_STYLE;
}

export function getCategoryByKey(key) {
  return CATEGORIES.find(c => c.key === key) || null;
}

export function ideaMatchesCategory(idea, categoryKey) {
  const cat = getCategoryByKey(categoryKey);
  if (!cat || !idea.tags) return false;
  return idea.tags.some(t => cat.matchers.includes(t.toLowerCase()));
}
