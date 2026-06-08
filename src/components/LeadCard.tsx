import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
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

  const animBorderColor = pulseAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['#ff9333', '#ffb566'],
  });
  const animShadowOpacity = pulseAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0.35, 0.72],
  });
  const animShadowRadius = pulseAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [8, 20],
  });

  function handleUnlock() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUnlock?.();
  }

  const isSold = lead.status === 'sold';

  return (
    <Animated.View style={[
      styles.card,
      { backgroundColor: Colors.panel, borderColor: Colors.borderOrange },
      highlighted && {
        borderColor:    animBorderColor,
        borderWidth:    2.5,
        shadowColor:    '#ff9333',
        shadowOpacity:  animShadowOpacity,
        shadowRadius:   animShadowRadius,
        elevation:      8,
      },
      isSold && styles.cardSold,
    ]}>
      {/* 🔥 Your Lead banner — shown when arriving from a push / SMS notification */}
      {highlighted && (
        <View style={styles.highlightBanner}>
          <Text style={styles.highlightBannerText}>🔥  Your Lead</Text>
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
          <View style={[styles.badge, lead.status === 'available' ? styles.badgeLive : styles.badgeOther]}>
            <Text style={[styles.badgeText, { color: lead.status === 'available' ? Colors.accent2 : Colors.muted }]}>
              {lead.status === 'available' ? 'LIVE' : lead.status.toUpperCase()}
            </Text>
          </View>
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
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.panel,
    borderRadius:    Radius.xl,
    borderWidth:     1,
    borderColor:     Colors.borderOrange,
    padding:         Spacing.md,
    marginBottom:    Spacing.sm + 4,
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
    paddingVertical:  8,
    alignItems:       'center',
    justifyContent:   'center',
    borderRadius:     0,
  },
  highlightBannerText: {
    color:         '#ffffff',
    fontSize:      FontSize.sm,
    fontWeight:    '800',
    letterSpacing: 0.8,
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
    backgroundColor: 'rgba(34,211,238,0.10)',
    borderColor:     'rgba(34,211,238,0.38)',
  },
  badgeOther: {
    backgroundColor: Colors.panel2,
    borderColor:     Colors.border,
  },
  badgeText: {
    fontSize:   FontSize.xs - 1,
    fontWeight: '700',
    letterSpacing: 0.5,
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
