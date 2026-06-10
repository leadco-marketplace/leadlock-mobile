import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, FontSize, Spacing, Shadow } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { Lead } from '@/lib/api';

// ── Typography ────────────────────────────────────────────────────────────────
// Uses the built-in system condensed heavy font — no package install needed.
// To upgrade to Barlow Condensed: run `npm install @expo-google-fonts/barlow-condensed`,
// add useFonts({ BarlowCondensed_900Black, BarlowCondensed_700Bold }) in App.tsx,
// then replace these two constants with 'BarlowCondensed_900Black' / 'BarlowCondensed_700Bold'.
const FONT_BLACK = Platform.OS === 'ios' ? 'AvenirNextCondensed-Heavy'  : 'sans-serif-condensed';
const FONT_BOLD  = Platform.OS === 'ios' ? 'AvenirNextCondensed-DemiBold' : 'sans-serif-condensed';

// ── Category thumbnail config ─────────────────────────────────────────────────
// Each entry provides a two-stop gradient and a 2-letter monogram for the left
// column. Keys are lower-cased service_category values.
const CATEGORY_THUMB: Record<string, { colors: readonly [string, string]; initials: string }> = {
  'locksmith':        { colors: ['#1a2a44', '#354a6e'] as const, initials: 'LS' },
  'real estate':      { colors: ['#5c3a0c', '#906018'] as const, initials: 'RE' },
  'garage door':      { colors: ['#2a3e52', '#3c5868'] as const, initials: 'GD' },
  'chimney sweep':    { colors: ['#4a1008', '#7a2012'] as const, initials: 'CS' },
  'dog walker':       { colors: ['#1a5008', '#308018'] as const, initials: 'DW' },
  'car dealer':       { colors: ['#080c14', '#141c2c'] as const, initials: 'CD' },
  'plumbing':         { colors: ['#0e2a5c', '#1c4080'] as const, initials: 'PL' },
  'electrical':       { colors: ['#5a3a00', '#8a5c00'] as const, initials: 'EL' },
  'hvac':             { colors: ['#0a3060', '#144888'] as const, initials: 'HC' },
  'roofing':          { colors: ['#1e1e20', '#2e2e38'] as const, initials: 'RF' },
  'painting':         { colors: ['#3a1060', '#5a2090'] as const, initials: 'PT' },
  'cleaning':         { colors: ['#1a4040', '#246060'] as const, initials: 'CL' },
  'pest control':     { colors: ['#3c2a0a', '#5a3e10'] as const, initials: 'PC' },
  'landscaping':      { colors: ['#163a0c', '#225c18'] as const, initials: 'LN' },
  'moving':           { colors: ['#2a1c60', '#42308a'] as const, initials: 'MV' },
  'appliance repair': { colors: ['#1c3050', '#2c4870'] as const, initials: 'AR' },
  'handyman':         { colors: ['#3a2010', '#5c3818'] as const, initials: 'HY' },
  'pool service':     { colors: ['#062040', '#0c3868'] as const, initials: 'PS' },
  'tree service':     { colors: ['#1a3808', '#2c5a10'] as const, initials: 'TS' },
  'solar':            { colors: ['#4a3800', '#7a6000'] as const, initials: 'SL' },
};
const DEFAULT_THUMB = { colors: ['#1e2a3e', '#2a3a52'] as const, initials: '--' };

function getCategoryThumb(category: string) {
  return CATEGORY_THUMB[category.toLowerCase().trim()] ?? DEFAULT_THUMB;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
interface LeadCardProps {
  lead: Lead;
  onUnlock?: () => void;
  unlocking?: boolean;
  purchased?: boolean;
  /** When true, renders a glowing accent border to indicate the notification-tapped lead */
  highlighted?: boolean;
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function LeadCard({ lead, onUnlock, unlocking, purchased, highlighted }: LeadCardProps) {
  useTheme(); // re-render when theme changes so inline Colors.* picks up new values

  const price     = lead.buyer_price_cents ?? Math.round(lead.price_cents * 1.125);
  const catThumb  = getCategoryThumb(lead.service_category);
  const isSold    = lead.status === 'sold';

  // ── Pulse animation for notification-highlighted card ───────────────────
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!highlighted) { pulseAnim.setValue(0); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [highlighted, pulseAnim]);

  // ── LIVE badge orange glow blink ─────────────────────────────────────────
  // 400 ms per half = 0.8 s full cycle. useNativeDriver:false required because
  // shadow props (shadowOpacity / shadowRadius) cannot run on the native thread.
  const liveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (lead.status !== 'available') { liveAnim.setValue(0); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(liveAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
        Animated.timing(liveAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [lead.status, liveAnim]);

  const liveScale        = liveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.0] });
  const liveOpacity      = liveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.0,  1.0] });
  const liveShadowOp     = liveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.0,  0.8] });
  const liveShadowRadius = liveAnim.interpolate({ inputRange: [0, 1], outputRange: [0,    20]  });

  const animBorderColor = pulseAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['#ff9333', '#ff5500'],
  });
  const animShadowOpacity = pulseAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0.25, 0.95],
  });
  const animShadowRadius = pulseAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [6, 36],
  });

  function handleUnlock() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUnlock?.();
  }

  return (
    // Outer wrapper carries the animated shadow/glow — no overflow:hidden so
    // the glow radiates freely beyond the card edges.
    // backgroundColor is required on iOS for shadows to render.
    <Animated.View style={[
      styles.glowWrap,
      highlighted && {
        shadowColor:   '#ff9333',
        shadowOpacity: animShadowOpacity,
        shadowRadius:  animShadowRadius,
        shadowOffset:  { width: 0, height: 0 },
        elevation:     10,
      },
    ]}>

      {/* ── Card shell — flexDirection row splits left thumb / right content ── */}
      <Animated.View style={[
        styles.card,
        { borderColor: highlighted ? animBorderColor : Colors.borderOrange },
        highlighted && { borderWidth: 2.5 },
        isSold && styles.cardSold,
      ]}>

        {/* ── Left: category colour thumbnail ──────────────────────────────── */}
        <LinearGradient
          colors={catThumb.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.thumbCol}
        >
          {/* Subtle dark veil so light categories stay readable */}
          <View style={styles.thumbDim} />
          {/* Two-letter monogram — big, heavy, centred */}
          <Text style={styles.thumbInitials}>{catThumb.initials}</Text>
          {/* Full category name, small, below the monogram */}
          <Text style={styles.thumbName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.6}>
            {lead.service_category.toUpperCase()}
          </Text>
        </LinearGradient>

        {/* ── Right: all lead content ──────────────────────────────────────── */}
        <View style={styles.rightCol}>

          {/* "🔥 Your Lead" banner — negative margins break it to column edges */}
          {highlighted && (
            <View style={styles.highlightBanner}>
              <View style={styles.highlightBannerRow}>
                <Text style={styles.highlightBannerEmoji}>🔥</Text>
                <Text style={styles.highlightBannerText}>Your Lead</Text>
              </View>
            </View>
          )}

          {/* Header: category name + LIVE badge */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.category, { color: Colors.foreground }]}>
                {lead.service_category.toUpperCase()}
              </Text>
              <Text style={[styles.jobType, { color: Colors.textSecondary }]}>{lead.job_type}</Text>
              <Text style={[styles.location, { color: Colors.muted }]}>
                {lead.nationwide ? '🌐 Nationwide' : `${lead.city}, ${lead.state}`}
              </Text>
              {!lead.nationwide && lead.distance_minutes != null && (
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceText}>
                    📍 {lead.distance_minutes < 60
                      ? `${lead.distance_minutes} min away`
                      : `${(lead.distance_minutes / 60).toFixed(1)} hr away`}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.headerRight}>
              {lead.status === 'available' ? (
                <Animated.View style={[
                  styles.badge,
                  styles.badgeLive,
                  {
                    opacity:       liveOpacity,
                    transform:     [{ scale: liveScale }],
                    shadowColor:   '#f97316',
                    shadowOpacity: liveShadowOp,
                    shadowRadius:  liveShadowRadius,
                    shadowOffset:  { width: 0, height: 0 },
                    elevation:     8,
                  },
                ]}>
                  <View style={styles.liveDot} />
                  <Text style={styles.badgeTextLive}>LIVE</Text>
                </Animated.View>
              ) : (
                <View style={[styles.badge, styles.badgeOther]}>
                  <Text style={styles.badgeText}>{lead.status.toUpperCase()}</Text>
                </View>
              )}
              {lead.quality_score != null && (
                <View style={styles.qualityBadge}>
                  <Text style={styles.qualityText}>★ {lead.quality_score}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Summary */}
          {lead.public_summary && (
            <View style={[styles.summaryBox, { backgroundColor: Colors.panel2 }]}>
              <Text style={[styles.summaryText, { color: Colors.textSecondary }]} numberOfLines={3}>
                {lead.public_summary}
              </Text>
            </View>
          )}

          {/* Footer: time + price + unlock */}
          <View style={styles.footer}>
            <View>
              <Text style={[styles.timeAgo, { color: Colors.muted }]}>
                {timeAgo(lead.published_at ?? lead.created_at)}
              </Text>
              <Text style={[styles.price, { color: Colors.foreground }]}>
                {formatPrice(price)}
              </Text>
              {lead.lead_code && (
                <Text style={[styles.leadCode, { color: Colors.muted }]}>#{lead.lead_code}</Text>
              )}
            </View>

            {!purchased && onUnlock && (
              <TouchableOpacity onPress={handleUnlock} disabled={unlocking} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#1d4ed8', '#3b82f6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.unlockBtn, unlocking && { opacity: 0.6 }]}
                >
                  <Text style={styles.unlockText}>
                    {unlocking ? 'Unlocking…' : `Unlock ${formatPrice(price)}`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {purchased && (
              <View style={styles.purchasedBadge}>
                <Text style={styles.purchasedText}>✓ Unlocked</Text>
              </View>
            )}
          </View>

        </View>{/* end rightCol */}

        {/* ── SOLD stamp — absoluteFill covers both columns ─────────────── */}
        {isSold && (
          <>
            <View style={[StyleSheet.absoluteFillObject, styles.soldDim]} pointerEvents="none" />
            <View style={[StyleSheet.absoluteFillObject, styles.soldContainer]} pointerEvents="none">
              <View style={styles.soldBanner}>
                <Text style={styles.soldBannerText}>SOLD</Text>
              </View>
            </View>
          </>
        )}

      </Animated.View>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const THUMB_WIDTH = 82;

const styles = StyleSheet.create({
  // Outer glow wrapper — no overflow:hidden so shadow radiates freely.
  // backgroundColor must match card for iOS shadow rendering.
  glowWrap: {
    borderRadius:     Radius.xl,
    marginBottom:     Spacing.sm + 4,
    backgroundColor:  Colors.panel,
  },

  // Card shell — horizontal layout splits left thumbnail and right content.
  card: {
    backgroundColor: Colors.panel,
    borderRadius:    Radius.xl,
    borderWidth:     1,
    borderColor:     Colors.borderOrange,
    flexDirection:   'row',
    overflow:        'hidden',   // keeps thumbnail gradient + SOLD stamp clipped
    ...Shadow.card,
  },
  cardSold: {
    borderColor: 'rgba(185,28,28,0.45)',
  },

  // ── Left thumbnail column ─────────────────────────────────────────────────
  thumbCol: {
    width:          THUMB_WIDTH,
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical:   12,
    paddingHorizontal: 6,
    gap: 5,
  },
  thumbDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  thumbInitials: {
    fontSize:      30,
    fontFamily:    FONT_BLACK,
    fontWeight:    '900',
    color:         'rgba(255,255,255,0.95)',
    letterSpacing: 2,
    lineHeight:    32,
    textAlign:     'center',
  },
  thumbName: {
    fontSize:      7.5,
    fontFamily:    FONT_BOLD,
    fontWeight:    '700',
    color:         'rgba(255,255,255,0.55)',
    letterSpacing: 1.2,
    textAlign:     'center',
    lineHeight:    10,
  },

  // ── Right content column ──────────────────────────────────────────────────
  rightCol: {
    flex:    1,
    padding: Spacing.md,
    gap:     Spacing.sm,
  },

  // "🔥 Your Lead" banner — negative margins extend it to the column edges
  highlightBanner: {
    backgroundColor:  '#ff9333',
    marginTop:        -Spacing.md,
    marginHorizontal: -Spacing.md,
    marginBottom:     Spacing.sm - 2,
    paddingVertical:  10,
    alignItems:       'center',
    justifyContent:   'center',
  },
  highlightBannerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap: 6,
  },
  highlightBannerEmoji: {
    fontSize:   20,
    lineHeight: 24,
  },
  highlightBannerText: {
    color:         '#ffffff',
    fontSize:      20,
    lineHeight:    24,
    fontFamily:    FONT_BLACK,
    fontWeight:    '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
  },
  headerLeft:  { flex: 1, gap: 2 },
  headerRight: { alignItems: 'flex-end', gap: 4 },

  // Category name — condensed black, uppercase, premium heading
  category: {
    fontSize:      19,
    fontFamily:    FONT_BLACK,
    fontWeight:    '900',
    letterSpacing: 0.5,
    lineHeight:    21,
    color:         Colors.foreground,
  },
  jobType: {
    fontSize:      12,
    fontFamily:    FONT_BOLD,
    fontWeight:    '700',
    letterSpacing: 0.4,
    color:         Colors.textSecondary,
  },
  location: {
    fontSize:  FontSize.xs,
    color:     Colors.muted,
    marginTop: 1,
  },

  // ── Badges ────────────────────────────────────────────────────────────────
  badge: {
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      Radius.sm,
    borderWidth:       1,
  },
  badgeLive: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingHorizontal: 10,
    paddingVertical:   5,
    backgroundColor:   'rgba(249,115,22,0.10)',
    borderColor:       'rgba(249,115,22,0.40)',
    borderRadius:      Radius.sm,
    borderWidth:       1,
  },
  liveDot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: '#f97316',
  },
  badgeTextLive: {
    fontSize:      14,
    fontWeight:    '700',
    letterSpacing: 0.5,
    color:         '#f97316',
  },
  badgeOther: {
    backgroundColor: Colors.panel2,
    borderColor:     Colors.border,
  },
  badgeText: {
    fontSize:      FontSize.xs - 1,
    fontWeight:    '700',
    letterSpacing: 0.5,
    color:         Colors.muted,
  },
  qualityBadge: {
    paddingHorizontal: 6,
    paddingVertical:   2,
    borderRadius:      Radius.sm,
    backgroundColor:   'rgba(129,140,248,0.12)',
    borderWidth:       1,
    borderColor:       'rgba(129,140,248,0.28)',
  },
  qualityText: {
    fontSize:   FontSize.xs - 1,
    color:      Colors.accent,
    fontWeight: '600',
  },
  distanceBadge: {
    alignSelf:         'flex-start',
    marginTop:         3,
    paddingHorizontal: 7,
    paddingVertical:   2,
    borderRadius:      Radius.sm,
    backgroundColor:   'rgba(16,185,129,0.10)',
    borderWidth:       1,
    borderColor:       'rgba(16,185,129,0.30)',
  },
  distanceText: {
    fontSize:   FontSize.xs - 1,
    color:      '#34d399',
    fontWeight: '600',
  },

  // ── Summary box ───────────────────────────────────────────────────────────
  summaryBox: {
    backgroundColor: Colors.panel2,
    borderRadius:    Radius.md,
    padding:         Spacing.sm + 2,
    borderWidth:     1,
    borderColor:     'rgba(59,130,246,0.18)',
  },
  summaryText: {
    fontSize:   FontSize.xs,
    color:      Colors.textSecondary,
    lineHeight: 18,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  timeAgo: {
    fontSize: FontSize.xs,
    color:    Colors.muted,
  },
  price: {
    fontSize:   22,
    fontFamily: FONT_BLACK,
    fontWeight: '900',
    letterSpacing: 0.3,
    lineHeight: 24,
    color:      Colors.foreground,
  },
  leadCode: {
    fontSize:      FontSize.xs - 1,
    color:         Colors.muted,
    fontFamily:    'Courier',
    marginTop:     1,
    letterSpacing: 0.5,
  },
  unlockBtn: {
    paddingHorizontal: 18,
    paddingVertical:   10,
    borderRadius:      Radius.lg,
  },
  unlockText: {
    fontSize:   FontSize.sm,
    fontWeight: '700',
    color:      '#ffffff',
  },
  purchasedBadge: {
    paddingHorizontal: 12,
    paddingVertical:   8,
    borderRadius:      Radius.lg,
    backgroundColor:   'rgba(129,140,248,0.12)',
    borderWidth:       1,
    borderColor:       'rgba(129,140,248,0.30)',
  },
  purchasedText: {
    fontSize:   FontSize.sm,
    fontWeight: '600',
    color:      Colors.accent,
  },

  // ── SOLD stamp — absoluteFill so it covers both columns ───────────────────
  soldDim: {
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  soldContainer: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  soldBanner: {
    width:           260,
    paddingVertical: 5,
    backgroundColor: 'rgba(185,28,28,0.88)',
    alignItems:      'center',
    transform:       [{ rotate: '-18deg' }],
    borderTopWidth:    1.5,
    borderBottomWidth: 1.5,
    borderColor:     'rgba(255,130,130,0.35)',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.55,
    shadowRadius:    8,
    elevation:       8,
  },
  soldBannerText: {
    color:            '#ffffff',
    fontSize:         22,
    fontWeight:       '900',
    letterSpacing:    9,
    textShadowColor:  'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
});
