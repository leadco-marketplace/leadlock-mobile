import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, FontSize, Spacing, Radius } from '@/theme';

/**
 * The "Which account?" gate for dual (buyer + seller) logins — the mobile
 * mirror of the web /choose-account page. A dual account picks a side here on
 * every fresh login; the two sides are kept completely separate (own wallet,
 * own data). Picking a side stores it (AsyncStorage via setActiveRole), which
 * flips `activeRole` in AuthContext → AppNavigator re-renders straight into the
 * chosen side (or its onboarding if the buyer side isn't set up yet).
 *
 * Rendered directly by AppNavigator (like OnboardingScreen), not inside a
 * navigator, so there is no route registration.
 */
export function ChooseAccountScreen() {
  const { profile, setActiveRole } = useAuth();
  const [busy, setBusy] = useState<'buyer' | 'provider' | null>(null);

  const canBuy  = !!profile?.can_buy;
  const canSell = !!profile?.can_sell;

  // First run for a fresh "both" account: buyer side isn't set up yet. Instead
  // of the bare gate we greet them with a friendly, natural walkthrough that
  // guides them to set up the buyer side first (mirrors the web welcome card).
  // On later logins (buyer side already set up) the normal two-option gate shows.
  const firstRunBoth = canBuy && canSell && !profile?.buyer_ready;

  async function pick(role: 'buyer' | 'provider') {
    if (busy) return;
    setBusy(role);
    // Persist the chosen side. AppNavigator watches activeRole and re-renders
    // as soon as this resolves — no navigation call needed.
    await setActiveRole(role);
  }

  if (firstRunBoth) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>
            <Text style={{ color: Colors.accent }}>Na</Text>
            <Text style={{ color: '#f97316', fontWeight: '900', fontSize: 44 }}>bb</Text>
            <Text style={{ color: Colors.accent }}>it</Text>
          </Text>
          <Text style={styles.logoSub}>MARKETPLACE</Text>
        </View>

        <View style={styles.welcomeCard}>
          <View style={styles.welcomeIcon}><Text style={{ fontSize: 26 }}>🔁</Text></View>
          <Text style={styles.heading}>You're set to buy and sell</Text>
          <Text style={[styles.subheading, { marginBottom: Spacing.md }]}>
            Your account can do both. To keep everything separate, you'll set up each side one at a time.
          </Text>

          {[
            { n: 1, active: true,  t: 'Set up your buyer side now', d: 'Add your categories, areas, and wallet — the usual buyer setup.' },
            { n: 2, active: false, t: 'Then sign out and back in for selling', d: 'Pick “Seller” at sign-in and we’ll walk you through selling setup.' },
          ].map((s) => (
            <View key={s.n} style={styles.step}>
              <View style={[styles.stepNum, s.active ? styles.stepNumActive : styles.stepNumIdle]}>
                <Text style={[styles.stepNumText, { color: s.active ? '#fff' : Colors.textSecondary }]}>{s.n}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{s.t}</Text>
                <Text style={styles.stepDesc}>{s.d}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => pick('buyer')}
            disabled={!!busy}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>{busy === 'buyer' ? 'Opening…' : 'Set up my buyer account →'}</Text>
          </TouchableOpacity>
          <Text style={styles.footnote}>You can always set up the seller side later.</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Logo */}
      <View style={styles.logoWrap}>
        <Text style={styles.logo}>
          <Text style={{ color: Colors.accent }}>Na</Text>
          <Text style={{ color: '#f97316', fontWeight: '900', fontSize: 44 }}>bb</Text>
          <Text style={{ color: Colors.accent }}>it</Text>
        </Text>
        <Text style={styles.logoSub}>MARKETPLACE</Text>
      </View>

      {!!profile?.email && <Text style={styles.signedIn}>Signed in as {profile.email}</Text>}
      <Text style={styles.heading}>Which account?</Text>
      <Text style={styles.subheading}>
        Choose the account you're opening. They're kept completely separate.
      </Text>

      <View style={styles.cards}>
        {canBuy && (
          <TouchableOpacity
            style={styles.card}
            onPress={() => pick('buyer')}
            disabled={!!busy}
            activeOpacity={0.85}
          >
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(47,107,255,0.14)' }]}>
              <Text style={styles.icon}>🎯</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{busy === 'buyer' ? 'Opening…' : 'Buyer'}</Text>
              <Text style={styles.cardDesc}>Browse and buy leads · wallet &amp; purchases</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}

        {canSell && (
          <TouchableOpacity
            style={styles.card}
            onPress={() => pick('provider')}
            disabled={!!busy}
            activeOpacity={0.85}
          >
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(249,115,22,0.16)' }]}>
              <Text style={styles.icon}>🧰</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{busy === 'provider' ? 'Opening…' : 'Seller'}</Text>
              <Text style={styles.cardDesc}>Submit and sell leads · earnings &amp; payouts</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.footnote}>
        Separate balances and data. Switch by signing out and back in.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: Colors.bg },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xxl, gap: Spacing.md },
  logoWrap: { alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  logo:     { fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  logoSub:  { fontSize: 9, fontWeight: '600', letterSpacing: 4, color: Colors.muted },
  signedIn: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  heading:  { fontSize: FontSize.xl, fontWeight: '700', color: Colors.foreground, textAlign: 'center' },
  subheading: {
    fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center',
    lineHeight: 20, marginTop: -4, marginBottom: Spacing.sm,
  },
  cards: { gap: Spacing.sm + 4 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.panel,
    borderWidth: 1, borderColor: 'rgba(249,115,22,0.28)',
    borderRadius: Radius.xxl, padding: Spacing.lg,
  },
  iconWrap: { width: 44, height: 44, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  icon:     { fontSize: 22 },
  cardText: { flex: 1, gap: 3 },
  cardTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.foreground },
  cardDesc:  { fontSize: FontSize.xs, color: Colors.muted },
  chevron:   { fontSize: 22, color: Colors.muted },
  footnote:  { fontSize: FontSize.xs, color: Colors.muted, textAlign: 'center', lineHeight: 16, marginTop: Spacing.sm },

  welcomeCard: {
    backgroundColor: Colors.panel,
    borderWidth: 1, borderColor: 'rgba(249,115,22,0.32)',
    borderRadius: Radius.xxl, padding: Spacing.lg, gap: Spacing.xs,
  },
  welcomeIcon: {
    width: 56, height: 56, borderRadius: Radius.xl,
    backgroundColor: 'rgba(249,115,22,0.15)',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: Spacing.sm,
  },
  step: { flexDirection: 'row', gap: Spacing.sm + 2, marginBottom: Spacing.sm + 2 },
  stepNum: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  stepNumActive: { backgroundColor: Colors.accent },
  stepNumIdle:   { backgroundColor: Colors.panel2 },
  stepNumText: { fontSize: FontSize.xs, fontWeight: '700' },
  stepTitle: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.foreground },
  stepDesc:  { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 16 },
  primaryBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.lg,
    paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
  },
  primaryBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
