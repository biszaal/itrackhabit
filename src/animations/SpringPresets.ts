/**
 * Spring animation presets for consistent animations throughout the app
 */

export const SpringPresets = {
  // Gentle spring - for subtle interactions
  gentle: {
    damping: 20,
    stiffness: 200,
    mass: 1,
  },

  // Default spring - good for most use cases
  default: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },

  // Bouncy spring - for playful interactions
  bouncy: {
    damping: 10,
    stiffness: 100,
    mass: 1,
  },

  // Wobbly spring - for attention-grabbing animations
  wobbly: {
    damping: 8,
    stiffness: 80,
    mass: 1,
  },

  // Stiff spring - for quick, snappy animations
  stiff: {
    damping: 25,
    stiffness: 300,
    mass: 1,
  },

  // Slow spring - for large movements
  slow: {
    damping: 20,
    stiffness: 50,
    mass: 1,
  },

  // Fast spring - for quick feedback
  fast: {
    damping: 12,
    stiffness: 250,
    mass: 0.8,
  },
};

export const TimingPresets = {
  // Ultra fast - for immediate feedback
  ultraFast: { duration: 100 },

  // Fast - for quick transitions
  fast: { duration: 200 },

  // Normal - standard duration
  normal: { duration: 300 },

  // Slow - for complex animations
  slow: { duration: 500 },

  // Very slow - for dramatic effects
  verySlow: { duration: 800 },
};

export const EasingPresets = {
  // Custom easing functions would go here
  // These would be imported from react-native-reanimated
  
  // Example:
  // easeOut: Easing.out(Easing.quad),
  // easeIn: Easing.in(Easing.quad),
  // easeInOut: Easing.inOut(Easing.quad),
};

/**
 * Animation sequences for complex multi-step animations
 */
export const AnimationSequences = {
  // Page transition sequence
  pageTransition: {
    fadeOut: { duration: 150 },
    pause: 50,
    fadeIn: { duration: 200 },
  },

  // Modal appearance sequence
  modalShow: {
    backdrop: { duration: 200 },
    content: { delay: 100, ...SpringPresets.default },
  },

  // List item stagger
  listStagger: {
    itemDelay: 50,
    spring: SpringPresets.gentle,
  },

  // Button press feedback
  buttonPress: {
    pressIn: { duration: 100 },
    pressOut: { duration: 150 },
    spring: SpringPresets.fast,
  },

  // Card flip animation
  cardFlip: {
    firstHalf: { duration: 150 },
    secondHalf: { duration: 150 },
  },

  // Loading spinner
  loadingSpinner: {
    rotation: { duration: 1000, repeat: -1 },
  },

  // Success celebration
  successCelebration: {
    initialScale: SpringPresets.bouncy,
    finalScale: { ...SpringPresets.gentle, delay: 200 },
  },
};

/**
 * Layout animation presets for React Native Layout Animations
 */
export const LayoutAnimationPresets = {
  spring: {
    duration: 400,
    create: {
      type: 'spring',
      property: 'opacity',
      springDamping: 0.7,
    },
    update: {
      type: 'spring',
      springDamping: 0.7,
    },
    delete: {
      type: 'spring',
      property: 'opacity',
      springDamping: 0.7,
    },
  },

  easeInEaseOut: {
    duration: 300,
    create: {
      type: 'easeInEaseOut',
      property: 'opacity',
    },
    update: {
      type: 'easeInEaseOut',
    },
    delete: {
      type: 'easeInEaseOut',
      property: 'opacity',
    },
  },

  linear: {
    duration: 200,
    create: {
      type: 'linear',
      property: 'opacity',
    },
    update: {
      type: 'linear',
    },
    delete: {
      type: 'linear',
      property: 'opacity',
    },
  },
};

/**
 * Gesture animation configurations
 */
export const GestureAnimations = {
  // Swipe to delete
  swipeToDelete: {
    threshold: 100,
    snapPoints: [-150, 0],
    animationConfig: SpringPresets.default,
  },

  // Pull to refresh
  pullToRefresh: {
    threshold: 80,
    snapPoints: [0, 80],
    animationConfig: SpringPresets.gentle,
  },

  // Drag to reorder
  dragToReorder: {
    scale: 1.05,
    opacity: 0.9,
    elevation: 8,
    animationConfig: SpringPresets.fast,
  },

  // Pan gesture
  pan: {
    threshold: 20,
    animationConfig: SpringPresets.default,
  },
};

/**
 * Micro-interaction animations
 */
export const MicroAnimations = {
  // Checkbox check
  checkboxCheck: {
    scale: [1, 1.2, 1],
    duration: 200,
  },

  // Heart like
  heartLike: {
    scale: [1, 1.4, 1],
    duration: 300,
    spring: SpringPresets.bouncy,
  },

  // Badge pulse
  badgePulse: {
    scale: [1, 1.1, 1],
    duration: 600,
    repeat: 3,
  },

  // Text highlight
  textHighlight: {
    backgroundColor: ['transparent', '#FFE58F', 'transparent'],
    duration: 800,
  },

  // Number counter
  numberCounter: {
    duration: 1000,
    easing: 'easeOut',
  },
};

/**
 * Theme-aware animation configurations
 */
export const ThemedAnimations = {
  // Dark mode transition
  darkModeTransition: {
    duration: 400,
    properties: ['backgroundColor', 'color', 'borderColor'],
  },

  // Theme color change
  themeColorChange: {
    duration: 300,
    properties: ['backgroundColor', 'borderColor'],
  },
};

export default {
  SpringPresets,
  TimingPresets,
  EasingPresets,
  AnimationSequences,
  LayoutAnimationPresets,
  GestureAnimations,
  MicroAnimations,
  ThemedAnimations,
};