// ── LeadCo Marketplace — Design system with Light / Dark / Inner-Light modes ──

export type ThemeMode = 'dark' | 'light' | 'inner-light';

// ── Dark theme (default) — Level 3 brightness ─────────────────────────────
const DarkColors = {
  bg:      '#1e3058',
  panel:   '#28406e',
  panel2:  '#2d4878',
  panel3:  '#334f88',
  border:  '#305880',
  border2: '#3a6898',
  borderOrange: 'rgba(249,115,22,0.44)',
  accent:  '#818cf8',
  accent2: '#22d3ee',
  orange:  '#f97316',
  orange2: '#fbbf24',
  foreground:    '#e8f4ff',
  text:          '#c8ddf5',
  textSecondary: '#7090b8',
  muted:         '#587898',
  placeholder:   '#3e5a80',
  danger: '#F87171',
  warn:   '#FBBF24',
  good:   '#818cf8',
  tabActive:   '#f97316',
  tabInactive: '#5878a0',
  // Pattern line color
  patternLine: 'rgba(249, 115, 22, 0.07)',
};

// ── Inner-Light theme — dark bg + white inner cards ───────────────────────
// Same as web app's html.dark.inner-light mode
const InnerLightColors = {
  ...DarkColors,
  // Inner surfaces go white/light
  panel:   '#ffffff',
  panel2:  '#f8fafc',
  panel3:  '#f1f5f9',
  border:  '#e2e8f0',
  border2: '#cbd5e1',
  borderOrange: 'rgba(249,115,22,0.30)',
  // Text goes dark inside cards
  foreground:    '#0f172a',
  text:          '#1e293b',
  textSecondary: '#475569',
  muted:         '#94a3b8',
  placeholder:   '#94a3b8',
  // Keep bg dark
  bg: '#1e3058',
};

// ── Light theme — warm peach (matches web light mode) ─────────────────────
const LightColors = {
  bg:      '#FFEDD5',   // warm peach background
  panel:   '#ffffff',
  panel2:  '#FFF7ED',
  panel3:  '#FED7AA',
  border:  '#FED7AA',
  border2: '#FDBA74',
  borderOrange: 'rgba(249,115,22,0.30)',
  accent:  '#6366f1',
  accent2: '#06b6d4',
  orange:  '#f97316',
  orange2: '#fbbf24',
  foreground:    '#1C1917',
  text:          '#292524',
  textSecondary: '#57534e',
  muted:         '#78716c',
  placeholder:   '#a8a29e',
  danger: '#ef4444',
  warn:   '#f59e0b',
  good:   '#16a34a',
  tabActive:   '#f97316',
  tabInactive: '#a8a29e',
  patternLine: 'rgba(249, 115, 22, 0.06)',
};

// ── Exported dynamic Colors object (default = dark) ───────────────────────
// Components read from this object. ThemeContext replaces these values.
export let Colors = { ...DarkColors };

export function applyTheme(mode: ThemeMode) {
  const palette = mode === 'light'
    ? LightColors
    : mode === 'inner-light'
      ? InnerLightColors
      : DarkColors;
  Object.assign(Colors, palette);
}

export { DarkColors, LightColors, InnerLightColors };

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
