/**
 * The six App Store screenshots, in listing order.
 *
 * `screen` is the capture filename produced by `capture.js`; the caption above
 * it is declared in the same object on purpose. The previous set was assembled
 * by hand and every caption ended up one screen out of step — "Every day, one
 * clear list" sat above Templates, "A timer that guards the habit" above the
 * calendar. Keeping both halves in one record is what stops that recurring.
 *
 * Badges must describe something actually visible in `screen`. Nothing here may
 * promise sync, accounts, or a paid tier: the app has none of those, and saying
 * otherwise in the listing is what drew App Review's questions.
 */

module.exports = [
  {
    slug: 'today',
    screen: 'today',
    eyebrow: 'Today',
    headline: ['Every day,', 'one clear list.'],
    sub: 'Check off habits, watch the ring fill, and finish the day at 100%.',
    rotate: 0,
    badges: [
      { label: 'Today at a glance', x: 0.2, y: 0.435 },
      { label: 'Tap to\ncomplete', x: 0.845, y: 0.735 },
    ],
  },
  {
    slug: 'templates',
    screen: 'templates',
    eyebrow: 'Templates',
    headline: ['Start with a', 'curated habit.'],
    sub: 'Pick a proven routine and begin in a couple of taps.',
    rotate: -3,
    // Templates is a modal sheet. On iPhone, opened directly rather than pushed
    // by a tap, the stack leaves an unpainted black band above the card — an
    // artefact of how these are captured, never something a user sees. iPad
    // centres the sheet over the real Home screen and needs no trim.
    cropTop: { phone: 196 },
    badges: [{ label: 'Ready-made routines', x: 0.24, y: 0.415 }],
  },
  {
    slug: 'focus',
    screen: 'focus',
    eyebrow: 'Focus mode',
    headline: ['A timer that', 'guards the habit.'],
    sub: 'One habit, one screen, no noise until the session is done.',
    rotate: 3,
    badges: [{ label: 'Session timer', x: 0.78, y: 0.47 }],
  },
  {
    slug: 'calendar',
    screen: 'calendar',
    eyebrow: 'Calendar',
    headline: ['Every day you', 'showed up.'],
    sub: 'A month at a glance, per habit or across all of them.',
    rotate: -3,
    badges: [{ label: 'Month view', x: 0.22, y: 0.44 }],
  },
  {
    slug: 'insights',
    screen: 'insights',
    eyebrow: 'Insights',
    headline: ["Know what's", 'actually working.'],
    sub: 'Trends, streaks and completion rates across the last 30 days.',
    rotate: 0,
    badges: [
      { label: 'Completion trend', x: 0.21, y: 0.435 },
      { label: 'Computed\non device', x: 0.845, y: 0.60, color: '#6366F1' },
    ],
  },
  {
    slug: 'awards',
    screen: 'awards',
    eyebrow: 'Awards',
    headline: ['Proof that it', 'is adding up.'],
    sub: 'Earn badges for consistency and milestones as your streaks grow.',
    rotate: 3,
    badges: [{ label: 'Milestone badges', x: 0.76, y: 0.45, color: '#E0A864' }],
  },
];
