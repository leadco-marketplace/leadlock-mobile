import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, FontSize, Spacing, Shadow } from '@/theme';
import { Lead } from '@/lib/api';

interface LeadCardProps {
  lead: Lead;
  onUnlock?: () => void;
  unlocking?: boolean;
  purchased?: boolean;
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

export function LeadCard({ lead, onUnlock, unlocking, purchased }: LeadCardProps) {
  const price = lead.buyer_price_cents ?? Math.round(lead.price_cents * 1.125);

  function handleUnlock() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUnlock?.();
  }

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.category}>{lead.service_category}</Text>
          <Text style={styles.jobType}>{lead.job_type}</Text>
          <Text style={styles.location}>
            {lead.nationwide ? '🌐 Nationwide' : `${lead.city}, ${lead.state}`}
          </Text>
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
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText} numberOfLines={3}>{lead.public_summary}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.timeAgo}>{timeAgo(lead.published_at ?? lead.created_at)}</Text>
          <Text style={styles.price}>{formatPrice(price)}</Text>
        </View>

        {!purchased && onUnlock && (
          <TouchableOpacity onPress={handleUnlock} disabled={unlocking} activeOpacity={0.85}>
            <LinearGradient
              colors={['#f97316', '#fbbf24']}
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
    </View>
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
    ...Shadow.card,
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
  summaryBox: {
    backgroundColor: Colors.panel2,
    borderRadius:    Radius.md,
    padding:         Spacing.sm + 2,
    borderWidth:     1,
    borderColor:     'rgba(249,115,22,0.15)',
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
    color:      Colors.bg,
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
});
