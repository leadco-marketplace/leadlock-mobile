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
const FONT_BLACK = Platform.OS === 'ios' ? 'AvenirNextCondensed-Heavy'    : 'sans-serif-condensed';
const FONT_BOLD  = Platform.OS === 'ios' ? 'AvenirNextCondensed-DemiBold' : 'sans-serif-condensed';

// ── Category gradient palette ─────────────────────────────────────────────────
// One gradient per category — rendered instantly, zero network requests
const CATEGORY_THUMB: Record<string, { colors: readonly [string, string] }> = {
  'locksmith':          { colors: ['#1a2a44', '#354a6e'] as const },
  'real estate':        { colors: ['#5c3a0c', '#906018'] as const },
  'real estate agents': { colors: ['#5c3a0c', '#906018'] as const },
  'garage door':        { colors: ['#2a3e52', '#3c5868'] as const },
  'chimney sweep':      { colors: ['#4a1008', '#7a2012'] as const },
  'dog walker':         { colors: ['#1a5008', '#308018'] as const },
  'car dealer':         { colors: ['#080c14', '#141c2c'] as const },
  'plumbing':           { colors: ['#0e2a5c', '#1c4080'] as const },
  'electrical':         { colors: ['#5a3a00', '#8a5c00'] as const },
  'hvac':               { colors: ['#0a3060', '#144888'] as const },
  'roofing':            { colors: ['#1e1e20', '#2e2e38'] as const },
  'painting':           { colors: ['#3a1060', '#5a2090'] as const },
  'cleaning':           { colors: ['#1a4040', '#246060'] as const },
  'carpet cleaning':    { colors: ['#2a1c40', '#3e2c60'] as const },
  'pest control':       { colors: ['#3c2a0a', '#5a3e10'] as const },
  'landscaping':        { colors: ['#163a0c', '#225c18'] as const },
  'moving':             { colors: ['#2a1c60', '#42308a'] as const },
  'appliance repair':   { colors: ['#1c3050', '#2c4870'] as const },
  'handyman':           { colors: ['#3a2010', '#5c3818'] as const },
  'pool service':       { colors: ['#062040', '#0c3868'] as const },
  'tree service':       { colors: ['#1a3808', '#2c5a10'] as const },
  'solar':              { colors: ['#4a3800', '#7a6000'] as const },
  'flooring':           { colors: ['#3a2818', '#5a4028'] as const },
  'windows & doors':    { colors: ['#102838', '#1c3e50'] as const },
  'air duct cleaning':  { colors: ['#1a2a3a', '#243850'] as const },
  'auto repair':        { colors: ['#201418', '#381c20'] as const },
  'financial services': { colors: ['#0a1a30', '#142240'] as const },
  'legal services':     { colors: ['#1a1428', '#281e3c'] as const },
};
const DEFAULT_THUMB = { colors: ['#1e2a3e', '#2a3a52'] as const };

function getCategoryThumb(category: string) {
  return CATEGORY_THUMB[category.toLowerCase().trim()] ?? DEFAULT_THUMB;
}

// ── Props ─────────────────────────────────────────────────────────────────────
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
// React.memo: re-renders ONLY when this specific lead's data changes.
// Without this, every setLeads() call (every 30s poll + every realtime event)
// re-renders ALL cards simultaneously — the #1 cause of scroll jank.
function LeadCardInner({ lead, onUnlock, unlocking, purchased, highlighted }: LeadCardProps) {
  useTheme();

  const price    = lead.buyer_price_cents ?? Math.round(lead.price_cents * 1.125);
  const catThumb = getCategoryThumb(lead.service_category);
  const isSold   = lead.status === 'sold';

  // ── LIVE badge fade animation (native driver = GPU, never blocks JS scroll) ─
  // Only opacity + transform are used — both are native-driver compatible.
  // Shadow glow on the badge uses a static value (no animated shadow props).
  const liveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (lead.status !== 'available') { liveAnim.setValue(0); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(liveAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(liveAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [lead.status, liveAnim]);

  const liveOpacity = liveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1.0] });
  const liveScale   = liveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.0] });

  // ── Highlight pulse animation (native driver) ──────────────────────────────
  // Pulses the opacity of an overlay View — no borderColor or shadowRadius
  // animation (those require useNativeDriver:false and block the JS thread).
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!highlighted) { pulseAnim.setValue(0); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [highlighted, pulseAnim]);

  function handleUnlock() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUnlock?.();
  }

  // Distance label helper
  const distanceLabel = lead.distance_minutes != null && !lead.nationwide
    ? (lead.distance_minutes < 60
        ? `${lead.distance_minutes}m away`
        : `${(lead.distance_minutes / 60).toFixed(1)}h away`)
    : null;

  return (
    // Outer glow wrapper — static shadow when highlighted (no animated shadow props)
    <View style={[
      styles.glowWrap,
      { backgroundColor: Colors.panel },
      highlighted && styles.glowWrapHighlighted,
    ]}>

      {/* Pulsing orange overlay — opacity animated on GPU via native driver */}
      {highlighted && (
        <Animated.View
          style={[styles.pulseOverlay, { opacity: pulseAnim }]}
          pointerEvents="none"
        />
      )}

      <View style={[
        styles.card,
        {
          backgroundColor: Colors.panel,
          borderColor: highlighted ? '#ff9333' : Colors.borderOrange,
          shadowColor: Colors.glowColor,
        },
        highlighted && styles.cardHighlighted,
        isSold && styles.cardSold,
      ]}>

        {/* ── "🔥 Your Lead" banner — full card width ───────────────────────── */}
        {highlighted && (
          <View style={styles.highlightBanner}>
            <View style={styles.highlightBannerRow}>
              <Text style={styles.highlightBannerEmoji}>🔥</Text>
              <Text style={styles.highlightBannerText}>Your Lead</Text>
            </View>
          </View>
        )}

        {/* ── Card body: full-height gradient column + compact content ──────── */}
        <View style={styles.cardInner}>

          {/* Full-height left gradient column — instant render, zero network */}
          <View style={styles.thumbCol}>
            <LinearGradient
              colors={catThumb.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.thumbDim} />
            <Text style={styles.thumbName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.5}>
              {lead.service_category.toUpperCase()}
            </Text>
          </View>

          {/* Right content column */}
          <View style={styles.rightCol}>

            {/* Title row: job type + LIVE/status badge */}
            <View style={styles.titleRow}>
              <Text style={[styles.jobTypeMain, { color: Colors.foreground }]} numberOfLines={2}>
                {lead.job_type}
              </Text>
              <View style={styles.badgeCol}>
                {lead.status === 'available' ? (
                  // Animated on GPU: only opacity + scale (both native-driver safe)
                  <Animated.View style={[
                    styles.badge,
                    styles.badgeLive,
                    {
                      opacity:       liveOpacity,
                      transform:     [{ scale: liveScale }],
                      // Static shadow — animated shadowRadius/shadowOpacity would
                      // force useNativeDriver:false and block the JS thread
                      shadowColor:   '#f97316',
                      shadowOpacity: 0.55,
                      shadowRadius:  10,
                      shadowOffset:  { width: 0, height: 0 },
                      elevation:     6,
                    },
                  ]}>
                    <View style={styles.liveDot} />
                    <Text style={styles.badgeTextLive}>LIVE</Text>
                  </Animated.View>
                ) : (
                  <View style={[
                    styles.badge,
                    styles.badgeOther,
                    { backgroundColor: Colors.panel2, borderColor: Colors.border },
                  ]}>
                    <Text style={[styles.badgeText, { color: Colors.muted }]}>
                      {lead.status.toUpperCase()}
                    </Text>
                  </View>
                )}
                {lead.quality_score != null && (
                  <View style={styles.qualityBadge}>
                    <Text style={[styles.qualityText, { color: Colors.accent }]}>
                      ★ {lead.quality_score}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Meta: category · location · distance */}
            <Text style={[styles.metaLine, { color: Colors.muted }]} numberOfLines={1}>
              {lead.service_category.toUpperCase()}
              {' · '}
              {lead.nationwide ? '🌐 Nationwide' : `${lead.city}, ${lead.state}`}
              {distanceLabel ? ` · ${distanceLabel}` : ''}
            </Text>

            {/* Badges row: distance pill + lead code */}
            <View style={styles.badgesRow}>
              {distanceLabel && (
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceText}>📍 {distanceLabel}</Text>
                </View>
              )}
              {lead.lead_code && (
                <View style={styles.leadIdPill}>
                  <Text style={styles.leadIdCode}>#{lead.lead_code}</Text>
                </View>
              )}
            </View>

            {/* Footer: time/price + unlock button */}
            <View style={styles.footer}>
              <View>
                <Text style={[styles.timeAgo, { color: Colors.muted }]}>
                  {timeAgo(lead.published_at ?? lead.created_at)}
                </Text>
                <Text style={[styles.price, { color: Colors.foreground }]}>
                  {formatPrice(price)}
                </Text>
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
                  <Text style={[styles.purchasedText, { color: Colors.accent }]}>✓ Unlocked</Text>
                </View>
              )}
            </View>

          </View>{/* end rightCol */}
        </View>{/* end cardInner */}

        {/* ── SOLD stamp — absoluteFill covers the entire card ──────────────── */}
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

      </View>
    </View>
  );
}

// Custom comparator: only re-render if data the card actually displays has changed.
// This prevents the 30-card re-render storm that fires every polling interval.
export const LeadCard = React.memo(LeadCardInner, (prev, next) =>
  prev.lead.id          === next.lead.id          &&
  prev.lead.status      === next.lead.status       &&
  prev.lead.price_cents === next.lead.price_cents  &&
  prev.lead.buyer_price_cents === next.lead.buyer_price_cents &&
  prev.lead.quality_score     === next.lead.quality_score     &&
  prev.unlocking    === next.unlocking  &&
  prev.highlighted  === next.highlighted &&
  prev.purchased    === next.purchased
);

// ── Styles ────────────────────────────────────────────────────────────────────
// IMPORTANT: Colors that need to follow theme changes are set as INLINE styles
// in the JSX above (e.g. { backgroundColor: Colors.panel }), NOT here in
// StyleSheet.create(). StyleSheet.create() runs once at module load time and
// captures the initial dark-theme values — it won't update when the theme changes.
// Only non-color layout/spacing/radius/font values live here.
const THUMB_SIZE = 82;

const styles = StyleSheet.create({

  // ── Outer glow wrapper ────────────────────────────────────────────────────
  glowWrap: {
    borderRadius: Radius.xl,
    marginBottom: Spacing.sm + 2,
  },
  // Static highlight glow — no animated shadow props (those kill native driver)
  glowWrapHighlighted: {
    shadowColor:   '#ff9333',
    shadowOpacity: 0.55,
    shadowRadius:  22,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     12,
  },

  // ── Pulsing opacity overlay (native driver, GPU only) ─────────────────────
  pulseOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius:    Radius.xl,
    backgroundColor: 'rgba(255,147,51,0.18)',
    zIndex:          1,
  },

  // ── Card shell ────────────────────────────────────────────────────────────
  card: {
    borderRadius:  Radius.xl,
    borderWidth:   2,
    flexDirection: 'column',
    overflow:      'hidden',
    ...Shadow.card,
    zIndex:        2,
  },
  cardHighlighted: {
    borderWidth: 2.5,
  },
  cardSold: {
    borderColor: 'rgba(185,28,28,0.45)',
  },

  // ── "🔥 Your Lead" banner ─────────────────────────────────────────────────
  highlightBanner: {
    backgroundColor: '#ff9333',
    paddingVertical: 8,
    alignItems:      'center',
    justifyContent:  'center',
  },
  highlightBannerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap: 6,
  },
  highlightBannerEmoji: {
    fontSize:   18,
    lineHeight: 22,
  },
  highlightBannerText: {
    color:         '#ffffff',
    fontSize:      18,
    lineHeight:    22,
    fontFamily:    FONT_BLACK,
    fontWeight:    '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // ── Card inner row (thumb column + content) ──────────────────────────────
  cardInner: {
    flexDirection: 'row',
  },

  // ── Full-height left gradient column ─────────────────────────────────────
  thumbCol: {
    width:           THUMB_SIZE,
    alignSelf:       'stretch',
    alignItems:      'center',
    justifyContent:  'flex-end',
    paddingVertical:   10,
    paddingHorizontal: 6,
    backgroundColor: '#1a2a44',
    overflow:        'hidden',
  },
  thumbDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  thumbName: {
    fontSize:      8,
    fontFamily:    FONT_BOLD,
    fontWeight:    '700',
    color:         'rgba(255,255,255,0.82)',
    letterSpacing: 1.2,
    textAlign:     'center',
    lineHeight:    10,
  },

  // ── Right content column ──────────────────────────────────────────────────
  rightCol: {
    flex:    1,
    padding: Spacing.md - 2,
    gap:     4,
  },

  // ── Title row ─────────────────────────────────────────────────────────────
  titleRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    gap:            6,
  },
  jobTypeMain: {
    flex:          1,
    fontSize:      15,
    fontFamily:    FONT_BOLD,
    fontWeight:    '700',
    letterSpacing: 0.2,
    lineHeight:    18,
  },
  badgeCol: {
    alignItems: 'flex-end',
    gap:        4,
    flexShrink: 0,
  },

  // ── Badges ────────────────────────────────────────────────────────────────
  badge: {
    paddingHorizontal: 7,
    paddingVertical:   3,
    borderRadius:      Radius.sm,
    borderWidth:       1,
  },
  badgeLive: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    paddingHorizontal: 8,
    paddingVertical:   4,
    backgroundColor:   'rgba(249,115,22,0.10)',
    borderColor:       'rgba(249,115,22,0.40)',
    borderRadius:      Radius.sm,
    borderWidth:       1,
  },
  liveDot: {
    width:           5,
    height:          5,
    borderRadius:    2.5,
    backgroundColor: '#f97316',
  },
  badgeTextLive: {
    fontSize:      12,
    fontWeight:    '700',
    letterSpacing: 0.5,
    color:         '#f97316',
  },
  badgeOther: {},
  badgeText: {
    fontSize:      FontSize.xs - 1,
    fontWeight:    '700',
    letterSpacing: 0.5,
  },
  qualityBadge: {
    paddingHorizontal: 5,
    paddingVertical:   2,
    borderRadius:      Radius.sm,
    backgroundColor:   'rgba(129,140,248,0.12)',
    borderWidth:       1,
    borderColor:       'rgba(129,140,248,0.28)',
  },
  qualityText: {
    fontSize:   FontSize.xs - 1,
    fontWeight: '600',
  },

  // ── Meta line ─────────────────────────────────────────────────────────────
  metaLine: {
    fontSize:  FontSize.xs - 1,
    lineHeight: 14,
  },

  // ── Badges row ────────────────────────────────────────────────────────────
  badgesRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           5,
    alignItems:    'center',
  },
  distanceBadge: {
    paddingHorizontal: 6,
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
  leadIdPill: {
    backgroundColor:   'rgba(249,115,22,0.12)',
    borderWidth:       1,
    borderColor:       'rgba(249,115,22,0.45)',
    borderRadius:      6,
    paddingHorizontal: 6,
    paddingVertical:   2,
  },
  leadIdCode: {
    fontSize:      11,
    color:         '#f97316',
    fontFamily:    'Courier',
    fontWeight:    '700',
    letterSpacing: 0.8,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginTop:      2,
  },
  timeAgo: {
    fontSize:     FontSize.xs,
    marginBottom: 2,
  },
  price: {
    fontSize:      20,
    fontFamily:    FONT_BLACK,
    fontWeight:    '900',
    letterSpacing: 0.3,
    lineHeight:    22,
  },
  unlockBtn: {
    paddingHorizontal: 16,
    paddingVertical:   9,
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
  },

  // ── SOLD stamp ────────────────────────────────────────────────────────────
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
