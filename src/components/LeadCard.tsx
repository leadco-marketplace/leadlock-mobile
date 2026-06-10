import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, FontSize, Spacing, Shadow } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { Lead } from '@/lib/api';

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

export function LeadCard({ lead, onUnlock, unlocking, purchased, highlighted }: LeadCardProps) {
  useTheme(); // re-render when theme changes so inline Colors.* picks up new values
  const price = lead.buyer_price_cents ?? Math.round(lead.price_cents * 1.125);

  // ── Pulse animation for notification-highlighted card ─────────────────────
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!highlighted) {
      pulseAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [highlighted, pulseAnim]);

  // ── LIVE badge fast-blink animation ──────────────────────────────────────
  // Option C: 0.8 s per half-cycle (1.6 s total). Opacity swings 0.12→1.0 so
  // the badge nearly disappears then snaps back — very noticeable without
  // needing any shadow. useNativeDriver:true is safe here (opacity + transform
  // only) and gives smoother 60 fps on device.
  const liveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (lead.status !== 'available') {
      liveAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(liveAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(liveAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [lead.status, liveAnim]);

  const liveScale   = liveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.0] });
  const liveOpacity = liveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.12, 1.0] });

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

  const isSold = lead.status === 'sold';

  return (
    // Outer wrapper carries the animated shadow/glow — no overflow:hidden so
    // the glow is not clipped. Inner card keeps overflow:hidden for the SOLD stamp.
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
    <Animated.View style={[
      styles.card,
      { backgroundColor: Colors.panel },
      { borderColor: highlighted ? animBorderColor : Colors.borderOrange },
      highlighted && { borderWidth: 2.5 },
      isSold && styles.cardSold,
    ]}>
      {/* 🔥 Your Lead banner — shown when arriving from a push / SMS notification */}
      {highlighted && (
        <View style={styles.highlightBanner}>
          <View style={styles.highlightBannerRow}>
            <Text style={styles.highlightBannerEmoji}>🔥</Text>
            <Text style={styles.highlightBannerText}>Your Lead</Text>
          </View>
        </View>
      )}

      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.category, { color: Colors.foreground }]}>{lead.service_category}</Text>
          <Text style={[styles.jobType, { color: Colors.textSecondary }]}>{lead.job_type}</Text>
          <Text style={[styles.location, { color: Colors.muted }]}>
            {lead.nationwide ? '🌐 Nationwide' : `${lead.city}, ${lead.state}`}
          </Text>
          {/* Distance badge — shown when buyer location is available */}
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
                opacity:   liveOpacity,
                transform: [{ scale: liveScale }],
              },
            ]}>
              <View style={styles.liveDot} />
              <Text style={styles.badgeTextLive}>LIVE</Text>
            </Animated.View>
          ) : (
            <View style={[styles.badge, styles.badgeOther]}>
              <Text style={styles.badgeText}>
                {lead.status.toUpperCase()}
              </Text>
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
          <Text style={[styles.summaryText, { color: Colors.textSecondary }]} numberOfLines={3}>{lead.public_summary}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={[styles.timeAgo, { color: Colors.muted }]}>{timeAgo(lead.published_at ?? lead.created_at)}</Text>
          <Text style={[styles.price, { color: Colors.foreground }]}>{formatPrice(price)}</Text>
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

      {/* ── SOLD stamp — shown when lead.status === 'sold' ─────────────── */}
      {isSold && (
        <>
          {/* Dark dimming layer */}
          <View style={[StyleSheet.absoluteFillObject, styles.soldDim]} pointerEvents="none" />
          {/* Diagonal SOLD banner */}
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

const styles = StyleSheet.create({
  // Outer shell — carries the animated glow shadow. No overflow:hidden so the
  // shadow/glow radiates freely beyond the card edges.
  // backgroundColor is required on iOS for shadows to render — use the same
  // color as the card so the two layers are visually indistinguishable.
  glowWrap: {
    borderRadius:    Radius.xl,
    marginBottom:    Spacing.sm + 4,
    backgroundColor: Colors.panel,
  },
  card: {
    backgroundColor: Colors.panel,
    borderRadius:    Radius.xl,
    borderWidth:     1,
    borderColor:     Colors.borderOrange,
    padding:         Spacing.md,
    // marginBottom lives on glowWrap now
    gap:             Spacing.sm,
    overflow:        'hidden',   // clips the diagonal SOLD banner to card bounds
    ...Shadow.card,
  },
  cardSold: {
    borderColor: 'rgba(185,28,28,0.45)',
  },
  // "🔥 Your Lead" banner — spans full card width via negative margins
  highlightBanner: {
    backgroundColor:  '#ff9333',
    marginTop:        -Spacing.md,
    marginHorizontal: -Spacing.md,
    marginBottom:     Spacing.sm + 2,
    paddingVertical:  10,
    alignItems:       'center',
    justifyContent:   'center',
    borderRadius:     0,
  },
  // Row wrapper ensures emoji + text are optically centered as a unit
  highlightBannerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
  },
  highlightBannerEmoji: {
    fontSize:    20,
    lineHeight:  24,
  },
  highlightBannerText: {
    color:         '#ffffff',
    fontSize:      20,
    lineHeight:    24,
    // AvenirNextCondensed-Heavy is a premium built-in iOS font with the same
    // condensed bold character as Barlow Condensed. Android falls back to the
    // system condensed variant.
    fontFamily:    Platform.OS === 'ios' ? 'AvenirNextCondensed-Heavy' : 'sans-serif-condensed',
    fontWeight:    '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
  },
  headerLeft: { flex: 1, gap: 2 },
  headerRight: { alignItems: 'flex-end', gap: 4 },
  category: {
    fontSize:   FontSize.base,
    fontWeight: '700',
    color:      Colors.foreground,
  },
  jobType: {
    fontSize: FontSize.xs,
    color:    Colors.textSecondary,
  },
  location: {
    fontSize: FontSize.xs,
    color:    Colors.muted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      Radius.sm,
    borderWidth:       1,
  },
  badgeLive: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              5,
    paddingHorizontal: 10,
    paddingVertical:   5,
    backgroundColor:  'rgba(34,211,238,0.10)',
    borderColor:      'rgba(34,211,238,0.38)',
    borderRadius:     Radius.sm,
    borderWidth:      1,
  },
  liveDot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: '#22d3ee',
  },
  badgeTextLive: {
    fontSize:      14,
    fontWeight:    '700',
    letterSpacing: 0.5,
    color:         '#22d3ee',
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
    fontSize: FontSize.xs - 1,
    color:    Colors.accent,
    fontWeight: '600',
  },
  distanceBadge: {
    alignSelf:       'flex-start',
    marginTop:       3,
    paddingHorizontal: 7,
    paddingVertical:   2,
    borderRadius:    Radius.sm,
    backgroundColor: 'rgba(16,185,129,0.10)',
    borderWidth:     1,
    borderColor:     'rgba(16,185,129,0.30)',
  },
  distanceText: {
    fontSize:   FontSize.xs - 1,
    color:      '#34d399',
    fontWeight: '600',
  },
  summaryBox: {
    backgroundColor: Colors.panel2,
    borderRadius:    Radius.md,
    padding:         Spacing.sm + 2,
    borderWidth:     1,
    borderColor:     'rgba(59,130,246,0.18)',
  },
  summaryText: {
    fontSize:    FontSize.xs,
    color:       Colors.textSecondary,
    lineHeight:  18,
  },
  footer: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  timeAgo: {
    fontSize: FontSize.xs,
    color:    Colors.muted,
  },
  leadCode: {
    fontSize:   FontSize.xs - 1,
    color:      Colors.muted,
    fontFamily: 'Courier',
    marginTop:  1,
    letterSpacing: 0.5,
  },
  price: {
    fontSize:   FontSize.md,
    fontWeight: '700',
    color:      Colors.foreground,
    fontVariant: ['tabular-nums'],
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

  // ── SOLD stamp ────────────────────────────────────────────────────────────
  soldDim: {
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  soldContainer: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  soldBanner: {
    width:           260,        // compact stamp — doesn't reach card edges
    paddingVertical: 5,
    backgroundColor: 'rgba(185,28,28,0.88)',
    alignItems:      'center',
    transform:       [{ rotate: '-18deg' }],
    borderTopWidth:  1.5,
    borderBottomWidth: 1.5,
    borderColor:     'rgba(255,130,130,0.35)',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.55,
    shadowRadius:    8,
    elevation:       8,
  },
  soldBannerText: {
    color:          '#ffffff',
    fontSize:       22,
    fontWeight:     '900',
    letterSpacing:  9,
    textShadowColor:  'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
});
