import { GlyphName, isGlyphName } from './Glyph';

// ---------------------------------------------------------------------------
// Resolving a habit to its glyph
//
// `habit.emoji` is persisted data — every habit already in a user's account (and
// every seeded template) carries one. Rather than migrate the column and risk
// stranding older rows, the field now stores a glyph name for anything created
// from here on, and legacy emoji are translated on read. A habit whose icon was
// never set at all falls back to inference from its title, which is what the
// old `getHabitEmoji` helpers did.
// ---------------------------------------------------------------------------

/** Legacy emoji → glyph. Covers every emoji the app has ever written or seeded. */
const LEGACY_EMOJI: Record<string, GlyphName> = {
  // movement
  '💪': 'strength',
  '🏋️': 'strength',
  '🏋': 'strength',
  '🏃': 'run',
  '🏃‍♀️': 'run',
  '🏃‍♂️': 'run',
  '🚶': 'walk',
  '🚶‍♀️': 'walk',
  '🚴': 'bike',
  '🏊': 'swim',
  '🤸': 'stretch',
  '⛹️': 'stretch',

  // mind
  '🧘': 'meditate',
  '🧘‍♀️': 'meditate',
  '🧘‍♂️': 'meditate',
  '🌬️': 'breathe',
  '🌬': 'breathe',
  '🧠': 'brain',
  '🎯': 'target',
  '❤️': 'gratitude',
  '🙏': 'gratitude',

  // body
  '💧': 'water',
  '🥗': 'nutrition',
  '🍎': 'nutrition',
  '😴': 'sleep',
  '🛏️': 'sleep',
  '🛏': 'sleep',
  '🌙': 'sleep',
  '💤': 'sleep',
  '💊': 'vitamins',
  '👨‍🍳': 'cook',
  '🍳': 'cook',

  // learning
  '📖': 'read',
  '📚': 'study',
  '🎓': 'learn',
  '🗣️': 'language',
  '🗣': 'language',
  '💻': 'code',

  // creative
  '✍️': 'write',
  '✍': 'write',
  '✏️': 'write',
  '📝': 'journal',
  '🎵': 'music',
  '🎸': 'music',
  '🎨': 'draw',
  '📸': 'photo',

  // productivity
  '📅': 'plan',
  '💼': 'work',
  '🗂️': 'work',
  '🗂': 'work',
  '📧': 'inbox',
  '🌅': 'sunrise',
  '📵': 'offline',
  '📱': 'device',
  '📋': 'templates',
  '📊': 'analytics',
  '🔥': 'streak',

  // people
  '📞': 'call',
  '👥': 'people',
  '🤝': 'people',
  '👯': 'people',
  '👨‍👩‍👧‍👦': 'people',
  '💬': 'chat',
  '🎧': 'music',
  '🧹': 'review',

  // outdoors
  '🌲': 'nature',
  '🌳': 'nature',
  '🏔️': 'outdoors',
  '🌱': 'sprout',

  // achievements
  '🌟': 'sparkle',
  '⚡': 'bolt',
  '💯': 'medal',
  '👑': 'crown',
  '✅': 'review',
  '🦸': 'shield',
  '🦉': 'sleep',
  '🥇': 'medal',
  '🎖️': 'medal',

  // interface
  '✨': 'sparkle',
  '💡': 'bulb',
  '🏆': 'trophy',
  '🎉': 'trophy',
  '🔔': 'bell',
  '🛡️': 'shield',
  '🛡': 'shield',
  '💾': 'archive',
  '🛠': 'tune',
  '🛠️': 'tune',
  '⚙️': 'tune',
  '🔗': 'link',
  '⚠️': 'warning',
  '⚠': 'warning',
  '👋': 'sparkle',
  '🚀': 'streak',
};

/** Drop variation selectors and skin-tone modifiers so lookups compare like with like. */
const normalizeEmoji = (value: string): string =>
  value.replace(/[︎️]/g, '').replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '');

/** The legacy table re-keyed by its normalised form, built once at load. */
const NORMALIZED_EMOJI: Map<string, GlyphName> = new Map(
  Object.entries(LEGACY_EMOJI).map(([emoji, glyph]) => [normalizeEmoji(emoji), glyph])
);

/**
 * Keyword → glyph, most specific first. Order matters: "walk" has to be tested
 * before "wal" style substrings and "journal" before the looser "write".
 */
const KEYWORDS: [string[], GlyphName][] = [
  [['meditat', 'mindful', 'calm'], 'meditate'],
  [['breath', 'breathe'], 'breathe'],
  [['gratitude', 'grateful', 'kindness'], 'gratitude'],
  [['journal', 'diary'], 'journal'],
  [['run', 'jog', 'sprint'], 'run'],
  [['walk', 'step'], 'walk'],
  [['gym', 'workout', 'exercise', 'strength', 'lift', 'push-up', 'pushup'], 'strength'],
  [['yoga', 'stretch', 'flexib', 'pilates'], 'stretch'],
  [['bike', 'cycl', 'spin'], 'bike'],
  [['swim'], 'swim'],
  [['water', 'hydrat', 'drink'], 'water'],
  [['eat', 'meal', 'nutrition', 'veg', 'salad', 'diet', 'fruit'], 'nutrition'],
  [['cook', 'kitchen', 'recipe'], 'cook'],
  [['sleep', 'bed', 'rest', 'nap'], 'sleep'],
  [['vitamin', 'supplement', 'medic', 'pill'], 'vitamins'],
  [['read', 'book'], 'read'],
  [['study', 'revis', 'course'], 'study'],
  [['learn', 'class', 'lesson', 'skill'], 'learn'],
  [['language', 'speak', 'spanish', 'french', 'german'], 'language'],
  [['code', 'program', 'develop', 'leetcode'], 'code'],
  [['write', 'blog', 'essay'], 'write'],
  [['music', 'guitar', 'piano', 'practice instrument', 'sing'], 'music'],
  [['draw', 'paint', 'sketch', 'art'], 'draw'],
  [['photo', 'camera'], 'photo'],
  [['plan', 'schedul', 'calendar', 'review'], 'plan'],
  [['work', 'task', 'deep work', 'focus'], 'work'],
  [['email', 'inbox', 'mail'], 'inbox'],
  [['morning', 'sunrise', 'wake'], 'sunrise'],
  [['no phone', 'screen', 'digital detox', 'social media', 'unplug'], 'offline'],
  [['call', 'phone a', 'family', 'friend'], 'call'],
  [['connect', 'network', 'people', 'team'], 'people'],
  [['talk', 'chat', 'conversation'], 'chat'],
  [['nature', 'outside', 'outdoor', 'garden', 'tree'], 'nature'],
  [['hike', 'mountain', 'climb'], 'outdoors'],
  [['clean', 'tidy', 'organi'], 'review'],
];

/** Infer a glyph from a habit's title. Falls back to the neutral target mark. */
/**
 * Needles are word *stems* — "meditat" must catch "meditation", "cycl" must
 * catch "cycling" — so they anchor to the start of a word but not the end.
 *
 * Matching with a plain `includes` fired anywhere inside a word, which picked
 * the wrong glyph for ordinary titles: "art" inside "heart", "run" inside
 * "brunch", "step" inside "misstep".
 */
const KEYWORD_PATTERNS: [RegExp[], GlyphName][] = KEYWORDS.map(
  ([needles, glyph]) => [
    needles.map(
      (n) => new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
    ),
    glyph,
  ]
);

export const glyphFromTitle = (title?: string): GlyphName => {
  const t = (title ?? '').toLowerCase();
  if (!t) return 'target';
  for (const [patterns, glyph] of KEYWORD_PATTERNS) {
    if (patterns.some((p) => p.test(t))) return glyph;
  }
  return 'target';
};

/**
 * The single entry point screens should use. Prefers an explicitly stored glyph
 * name, then a legacy emoji, then inference from the title.
 */
export const resolveGlyph = (icon?: string | null, title?: string): GlyphName => {
  if (isGlyphName(icon)) return icon;

  if (icon) {
    const direct = LEGACY_EMOJI[icon];
    if (direct) return direct;

    // Normalising only the input could never match, because the table's own
    // keys carry variation selectors too ('🧘‍♀️' has one). Both sides go
    // through the same normalisation.
    const byNormalized = NORMALIZED_EMOJI.get(normalizeEmoji(icon));
    if (byNormalized) return byNormalized;

    // Last resort: a ZWJ sequence the table doesn't list (e.g. '🧘🏿‍♀️')
    // still carries its meaning in the first codepoint.
    const base = normalizeEmoji(icon).split('‍')[0];
    const byBase = NORMALIZED_EMOJI.get(base);
    if (byBase) return byBase;
  }

  return glyphFromTitle(title);
};
