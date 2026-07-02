import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSize, Spacing, Radius } from '@/theme';

/**
 * Wallet credit balance chip — matches the Live Feed header pill.
 * Shows the buyer's spendable credits. Reused across tabs (Live Feed,
 * My Leads, Alerts) so the balance is always visible.
 */
export function CreditPill() {
  const { profile } = useAuth();
  useTheme(); // re-render on theme change so inline Colors.* stay current
  if (!profile) return null;
  return (
    <View style={styles.creditPill}>
      <Text style={styles.creditText}>
        💳 ${((profile.credits_cents ?? 0) / 100).toFixed(2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  creditPill: {
    backgroundColor: 'rgba(129,140,248,0.15)',
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.35)',
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
  },
  creditText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.accent,
    fontVariant: ['tabular-nums'],
  },
});
