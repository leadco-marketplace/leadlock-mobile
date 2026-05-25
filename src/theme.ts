// ── LeadCo Marketplace — Midnight + Electric + Orange design system ───────────
// Level 3 brightness: #1e3058 base (was #08101e — lifted for readability)
export const Colors = {
  // Backgrounds
  bg:      '#1e3058',
  panel:   '#28406e',
  panel2:  '#2d4878',
  panel3:  '#334f88',

  // Borders
  border:  '#305880',
  border2: '#3a6898',
  borderOrange: 'rgba(249,115,22,0.44)',

  // Accent — electric indigo-violet
  accent:  '#818cf8',
  accent2: '#22d3ee',   // cyan

  // Orange — the standout pop
  orange:  '#f97316',
  orange2: '#fbbf24',   // amber

  // Text
  foreground:    '#e8f4ff',
  text:          '#c8ddf5',
  textSecondary: '#7090b8',  // brightened — was #567090 (too dim on lighter bg)
  muted:         '#587898',  // brightened — was #4a6a8a
  placeholder:   '#3e5a80',  // brightened — was #2e4a66

  // Semantic
  danger: '#F87171',
  warn:   '#FBBF24',
  good:   '#818cf8',

  // Tab bar
  tabActive:   '#f97316',
  tabInactive: '#5878a0',   // brightened — was #344f6a (invisible on new bg)
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const Radius = {
  sm:  6,
  md:  10,
  lg:  14,
  xl:  18,
  xxl: 24,
  full: 999,
};

export const FontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  xxl:  30,
  hero: 38,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  orange: {
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius: 12,
    elevation: 6,
  },
};
