import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ScreenShell } from '@/components/ScreenShell';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, Spacing, Radius, FontSize } from '@/theme';

/**
 * Shown to guests in place of My Leads / Alerts / Account. The tabs stay
 * visible (they market the product), but each opens a tailored teaser with
 * a Sign Up CTA instead of the real screen.
 */

type TabKey = 'myleads' | 'alerts' | 'account';

const CONTENT: Record<TabKey, {
  emoji: string; title: string; headline: string; desc: string; bullets: string[];
}> = {
  myleads: {
    emoji:    '🔓',
    title:    'My Leads',
    headline: 'Your Unlocked Leads Live Here',
    desc:     'Every lead you purchase appears here with everything you need to win the job:',
    bullets:  [
      "Customer's name, phone, and address",
      'One-tap calling through the platform',
      'Lead status tracking and dispute protection',
    ],
  },
  alerts: {
    emoji:    '🔔',
    title:    'Alerts',
    headline: 'Never Miss A Lead Again',
    desc:     'Tell us what you do and where you work — we handle the rest:',
    bullets:  [
      'Pick your services and coverage areas',
      'Instant push alert the second a matching lead drops',
      'Be first in line before competitors even see it',
    ],
  },
  account: {
    emoji:    '👤',
    title:    'Account',
    headline: 'Your Account & Wallet',
    desc:     'Everything about your business in one place:',
    bullets:  [
      'Credits wallet — deposit once, unlock leads instantly',
      'Verified phone for call-connect',
      'Notification and profile settings',
    ],
  },
};

export function GuestLockedScreen({ tab }: { tab: TabKey }) {
  const { exitGuestToSignup, signOut } = useAuth();
  const { mode } = useTheme();
  const styles = useMemo(makeStyles, [mode]);
  const c = CONTENT[tab];

  return (
    <ScreenShell title={c.title} scrollable={false}>
      <View style={styles.center}>
        <View style={styles.card}>
          <Text style={styles.emoji}>{c.emoji}</Text>
          <Text style={styles.headline}>{c.headline}</Text>
          <Text style={styles.desc}>{c.desc}</Text>
          <View style={styles.bullets}>
            {c.bullets.map(b => (
              <View key={b} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>✓</Text>
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </View>
          <Button label="Sign Up Free →" onPress={exitGuestToSignup} fullWidth />
          <TouchableOpacity onPress={() => { signOut(); }} style={styles.loginLink}>
            <Text style={styles.loginText}>Already have an account? Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenShell>
  );
}

const makeStyles = () => StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', paddingBottom: Spacing.xxl },
  card: {
    backgroundColor: Colors.panel,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.border2,
    padding:         Spacing.lg,
    gap:             Spacing.md,
    alignItems:      'center',
  },
  emoji:    { fontSize: 44 },
  headline: {
    color:      Colors.foreground,
    fontSize:   FontSize.lg,
    fontWeight: '800',
    textAlign:  'center',
  },
  desc: {
    color:     Colors.muted,
    fontSize:  FontSize.sm,
    textAlign: 'center',
    lineHeight: 19,
  },
  bullets:   { gap: Spacing.sm, alignSelf: 'stretch', marginVertical: Spacing.xs },
  bulletRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  bulletDot: { color: Colors.orange, fontSize: FontSize.sm, fontWeight: '800', marginTop: 1 },
  bulletText: {
    color:     Colors.foreground,
    fontSize:  FontSize.sm,
    flex:      1,
    lineHeight: 19,
  },
  loginLink: { paddingVertical: Spacing.xs },
  loginText: {
    color:     Colors.muted,
    fontSize:  FontSize.xs,
    textDecorationLine: 'underline',
  },
});
