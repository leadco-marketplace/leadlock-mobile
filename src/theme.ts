// ── LeadCo Marketplace — Design system with Light / Dark / Inner-Light modes ──

export type ThemeMode = 'dark' | 'light' | 'inner-light';

// ── Deep Sapphire dark theme — premium high-tech ───────────────────────────
// Near-black navy backgrounds, sapphire blue as the primary action color.
// Inspired by Wolt's clean premium dark UI.
const DarkColors = {
  bg:      '#040c1e',   // deepest navy — almost black with a blue soul
  panel:   '#081630',   // deep sapphire card surface
  panel2:  '#0d1d3a',   // inner card / nested surface
  panel3:  '#122248',   // subtle tertiary surface
  border:  '#182e52',   // quiet border
  border2: '#1f3a68',   // visible border
  borderOrange: 'rgba(59,130,246,0.70)',  // sapphire-tinted accent border
  glowColor: '#3b82f6',
  glowBg:   'rgba(59,130,246,0.15)',      // pill/capsule background tint
  accent:  '#3b82f6',   // sapphire blue — primary accent
  accent2: '#22d3ee',   // cyan secondary accent
  orange:  '#3b82f6',   // primary CTA = sapphire (replaces orange)
  orange2: '#60a5fa',   // lighter sapphire (replaces amber)
  foreground:    '#e8f4ff',
  text:          '#bdd5f8',
  textSecondary: '#6080a8',
  muted:         '#4a6082',
  placeholder:   '#32506e',
  danger: '#F87171',
  warn:   '#FBBF24',
  good:   '#34d399',
  tabActive:   '#3b82f6',   // sapphire active tab
  tabInactive: '#3e5472',
  // Pattern line color — subtle sapphire diagonal lines
  patternLine: 'rgba(59, 130, 246, 0.05)',
  // Screen-level header text (rendered on bg, not on panel).
  // Always light so titles are legible on the dark bg in all non-light modes.
  headerText:    '#e8f4ff',
  headerSubText: '#6080a8',
};

// ── Inner-Light theme — deep navy bg + white inner cards ───────────────────
const InnerLightColors = {
  ...DarkColors,
  // Inner surfaces go white/light
  panel:   '#ffffff',
  panel2:  '#f8fafc',
  panel3:  '#f1f5f9',
  border:  '#e2e8f0',
  border2: '#cbd5e1',
  borderOrange: 'rgba(59,130,246,0.65)',
  glowColor: '#3b82f6',
  glowBg:   'rgba(59,130,246,0.15)',
  // Text goes dark inside cards
  foreground:    '#0f172a',
  text:          '#1e293b',
  textSecondary: '#475569',
  muted:         '#94a3b8',
  placeholder:   '#94a3b8',
  // Keep bg deep navy
  bg: '#040c1e',
  // Header text stays light — it renders on the dark navy bg, not inside a card.
  headerText:    '#e8f4ff',
  headerSubText: '#8ba3c7',
};

// ── Light theme — warm peach (matches web light mode) ─────────────────────
const LightColors = {
  bg:      '#FFEDD5',   // warm peach background
  panel:   '#ffffff',
  panel2:  '#FFF7ED',
  panel3:  '#FED7AA',
  border:  '#FED7AA',
  border2: '#FDBA74',
  borderOrange: 'rgba(249,115,22,0.70)',
  glowColor: '#f97316',
  glowBg:   'rgba(249,115,22,0.15)',      // pill/capsule background tint
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
  // Header text dark to contrast with warm peach bg
  headerText:    '#1C1917',
  headerSubText: '#57534e',
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
    shadowColor: '#3b82f6',   // default dark mode; components override with Colors.glowColor inline
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 12,
  },
  orange: {
    // Now used for sapphire primary buttons (name kept for backward compat)
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 6,
  },
  sapphire: {
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 6,
  },
};
