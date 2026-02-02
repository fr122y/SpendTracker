/**
 * Design Tokens for SmartSpend Tracker
 *
 * Centralized design system following CRAP principles:
 * - Contrast: Color scales with proper WCAG compliance
 * - Repetition: Consistent spacing and sizing across components
 * - Alignment: Grid-based spacing (4px increments)
 * - Proximity: Logical grouping of related elements
 */

// ========================================
// SPACING SCALE (4px Grid System)
// ========================================

export const spacing = {
  // Component Gaps (for flex/grid layouts)
  gap: {
    xs: 'gap-2', // 8px - tight spacing between small elements
    sm: 'gap-3', // 12px - default spacing for compact layouts
    md: 'gap-4', // 16px - standard spacing for most components
    lg: 'gap-6', // 24px - section spacing
    xl: 'gap-8', // 32px - major section dividers
  },

  // Component Padding
  padding: {
    compact: 'p-2 sm:p-3', // 8px → 12px - for tight cards/buttons
    card: 'p-3 sm:p-4', // 12px → 16px - standard card padding
    panel: 'p-4 sm:p-6', // 16px → 24px - large containers
  },

  // Margins
  margin: {
    section: 'mb-6', // 24px - between major sections
    element: 'mb-4', // 16px - between elements
    tight: 'mb-2', // 8px - between tightly related elements
  },
} as const

// ========================================
// TYPOGRAPHY HIERARCHY
// ========================================

export const typography = {
  // Headings
  h1: 'text-2xl sm:text-3xl font-semibold text-zinc-100',
  h2: 'text-lg sm:text-xl font-semibold text-zinc-100',
  h3: 'text-base sm:text-lg font-medium text-zinc-200',

  // Body Text
  body: 'text-sm sm:text-base text-zinc-300',
  bodyLarge: 'text-base sm:text-lg text-zinc-300',

  // Captions & Labels
  caption: 'text-xs sm:text-sm text-zinc-400',
  label: 'text-sm font-medium text-zinc-300',

  // Special
  mono: 'font-mono text-sm text-zinc-300',
  monoLarge: 'font-mono text-base sm:text-lg font-semibold',
} as const

// ========================================
// SURFACE COLORS (Enhanced Contrast)
// ========================================

export const surface = {
  // Backgrounds
  bg: {
    base: 'bg-zinc-950', // Main app background
    elevated: 'bg-zinc-900/70', // Cards, panels (70% opacity for depth)
    hover: 'bg-zinc-800/80', // Hover state for interactive surfaces
    active: 'bg-zinc-800', // Active/pressed state
  },

  // Borders (Enhanced Contrast)
  border: {
    default: 'border-zinc-700', // Default border (stronger than zinc-800)
    subtle: 'border-zinc-800', // Subtle borders
    focus: 'border-blue-500', // Focus indicator
    error: 'border-red-500/30', // Error state
  },

  // Shadows (Depth Indicators)
  shadow: {
    sm: 'shadow-sm', // Subtle depth
    md: 'shadow-md', // Standard card elevation
    lg: 'shadow-lg', // Hover/focus elevation
    xl: 'shadow-xl', // Modal/dialog elevation
    '2xl': 'shadow-2xl', // Maximum elevation

    // Colored Shadows (Glow Effects)
    blue: 'shadow-md shadow-blue-600/20',
    blueGlow: 'shadow-sm shadow-blue-500/50',
    emeraldGlow: 'shadow-sm shadow-emerald-400/60',
  },
} as const

// ========================================
// INTERACTIVE STATES
// ========================================

export const interactive = {
  // Focus Rings (Keyboard Navigation)
  focus: {
    default:
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
    emerald:
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
    red: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
  },

  // Transitions
  transition: {
    default: 'transition-all duration-200 ease-out',
    fast: 'transition-all duration-150 ease-out',
    slow: 'transition-all duration-300 ease-out',
    colors: 'transition-colors duration-200',
  },

  // Touch Targets (44x44px minimum)
  touchTarget: 'min-h-11 min-w-11', // 44px minimum for accessibility

  // Hover Transforms
  hover: {
    lift: 'hover:-translate-y-0.5 hover:shadow-lg',
    scale: 'hover:scale-[1.02]',
    scaleSmall: 'hover:scale-105',
  },

  // Active States
  active: {
    press: 'active:scale-[0.98]',
  },
} as const

// ========================================
// BUTTON VARIANTS (Pre-composed Styles)
// ========================================

export const buttonVariants = {
  primary: {
    base: 'bg-blue-600 text-white',
    hover: 'hover:bg-blue-500',
    active: 'active:bg-blue-700',
    shadow: surface.shadow.blue,
  },

  ghost: {
    base: 'bg-zinc-800/50 border border-zinc-700 text-zinc-300',
    hover: 'hover:bg-zinc-800 hover:text-white hover:border-zinc-600',
    active: 'active:bg-zinc-700',
  },

  danger: {
    base: 'text-red-400 border border-red-500/30',
    hover: 'hover:bg-red-500/10',
    active: 'active:bg-red-500/20',
  },
} as const

// ========================================
// CARD STYLES (Pre-composed)
// ========================================

export const cardStyles = {
  base: `rounded-lg ${surface.border.default} ${surface.bg.elevated} ${spacing.padding.card} ${surface.shadow.md}`,
  interactive: `${interactive.transition.default} ${interactive.hover.lift}`,
  hover: `hover:${surface.bg.hover} hover:border-zinc-600`,
} as const

// ========================================
// MODAL/OVERLAY STYLES
// ========================================

export const overlay = {
  backdrop: 'bg-black/70 backdrop-blur-md',
  panel: `${surface.bg.elevated} rounded-xl ${surface.border.default} ${surface.shadow['2xl']}`,
} as const

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Combines multiple design token classes into a single string
 */
export function composeStyles(...styles: (string | undefined | false)[]) {
  return styles.filter(Boolean).join(' ')
}

/**
 * Creates a card style with optional interactivity
 */
export function createCardStyle(interactive = false) {
  return composeStyles(
    cardStyles.base,
    interactive && cardStyles.interactive,
    interactive && cardStyles.hover
  )
}
