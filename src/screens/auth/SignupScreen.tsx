import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Linking, Modal,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth }  from '@/contexts/AuthContext';
import { Input }   from '@/components/Input';
import { Button }  from '@/components/Button';
import { promoApi } from '@/lib/api';
import { Colors, FontSize, Spacing, Radius } from '@/theme';
import type { AuthStackParamList } from '@/navigation/AuthNavigator';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Signup'> };

export function SignupScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState<'buyer' | 'provider' | 'both'>('buyer');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [coverCents, setCoverCents] = useState(0);
  // Warm easy-signup welcome — shown once when the signup screen opens so a
  // recruited pro knows it's fast (just phone verification, no credit card).
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    promoApi.signupBonus()
      .then((b) => { if (b.enabled && b.coverCents > 0) setCoverCents(b.coverCents); })
      .catch(() => {});
  }, []);

  const termsUrl = role === 'provider'
    ? 'https://www.nabbitmarketplace.com/terms/lead-provider'
    : 'https://www.nabbitmarketplace.com/terms/service-provider';

  async function handleSignup() {
    if (!email.trim() || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 8)        { setError('Password must be at least 8 characters.'); return; }
    if (!/[a-z]/.test(password))     { setError('Password must include a lowercase letter.'); return; }
    if (!/[A-Z]/.test(password))     { setError('Password must include an uppercase letter.'); return; }
    if (!/[0-9]/.test(password))     { setError('Password must include a number.'); return; }
    if (!termsAccepted)             { setError('Please accept the Terms of Use to continue.'); return; }
    setError(null);
    setLoading(true);
    const err = await signUp(email.trim().toLowerCase(), password, role);
    if (err) { setError(err); setLoading(false); }
  }

  return (
    <>
    {/* ── Warm easy-signup welcome pop-up ─────────────────────────────────── */}
    <Modal visible={showWelcome} transparent animationType="fade" onRequestClose={() => setShowWelcome(false)}>
      <View style={welcome.backdrop}>
        <View style={welcome.card}>
          <View style={welcome.logoBox}>
            <Text style={welcome.logoText}>
              <Text style={{ color: Colors.accent }}>Na</Text>
              <Text style={{ color: Colors.orange, fontWeight: '900' }}>bb</Text>
              <Text style={{ color: Colors.accent }}>it</Text>
            </Text>
          </View>
          <Text style={welcome.title}>Welcome to Nabbit 👋</Text>
          <Text style={welcome.body}>
            Fast, easy sign-up — <Text style={{ color: Colors.good, fontWeight: '700' }}>no credit card needed</Text>.
            Just verify your phone number and your first lead is on us.
          </Text>
          <View style={{ alignSelf: 'stretch', marginTop: 16 }}>
            {['Verify your phone — that’s it', 'No card, no commitment', 'Takes about 30 seconds'].map((t) => (
              <View key={t} style={welcome.pill}>
                <Text style={welcome.pillCheck}>✓</Text>
                <Text style={welcome.pillText}>{t}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={welcome.btn} onPress={() => setShowWelcome(false)} activeOpacity={0.85}>
            <Text style={welcome.btnText}>Get started →</Text>
          </TouchableOpacity>
          <Text style={welcome.note}>Your first lead is free.</Text>
        </View>
      </View>
    </Modal>

    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="interactive"
    >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>
            <Text style={{ color: Colors.accent }}>Na</Text>
            <Text style={{ color: '#f97316', fontWeight: '900', fontSize: 44 }}>bb</Text>
            <Text style={{ color: Colors.accent }}>it</Text>
          </Text>
          <Text style={styles.logoSub}>MARKETPLACE</Text>
        </View>

        {coverCents > 0 && (
          <View style={styles.bonusBanner}>
            <Text style={styles.bonusText}>🎁 Your first lead is free — up to ${(coverCents / 100).toFixed(0)}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.heading}>Create your account</Text>
          <Text style={styles.subheading}>Free to join — start in minutes</Text>

          {/* Role selector */}
          <View style={styles.roleRow}>
            {(['buyer', 'provider'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRole(r)}
                style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                activeOpacity={0.8}
              >
                <Text style={styles.roleEmoji}>{r === 'buyer' ? '🎯' : '💼'}</Text>
                <Text style={[styles.roleLabel, role === r && { color: Colors.bg }]}>
                  {r === 'buyer' ? 'Buy Leads' : 'Sell Leads'}
                </Text>
                <Text style={[styles.roleDesc, role === r && { color: Colors.bg, opacity: 0.75 }]}>
                  {r === 'buyer' ? 'Find customers' : 'Earn from surplus'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Both — one login, two separate accounts */}
          <TouchableOpacity
            onPress={() => setRole('both')}
            style={[styles.bothBtn, role === 'both' && styles.bothBtnActive]}
            activeOpacity={0.8}
          >
            <Text style={styles.roleEmoji}>🔁</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.roleLabel, role === 'both' && { color: Colors.bg }]}>Buy &amp; Sell Leads</Text>
              <Text style={[styles.roleDesc, { textAlign: 'left' }, role === 'both' && { color: Colors.bg, opacity: 0.75 }]}>
                One login, kept fully separate — set up buying first
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 8 characters"
              secureToggle
            />
          </View>

          {/* Terms of Use acceptance — required, role-specific document */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setTermsAccepted(v => !v)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, termsAccepted && styles.checkboxOn]}>
              {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsRowText}>
              I have read and agree to the{' '}
              <Text
                style={styles.termsLink}
                onPress={() => Linking.openURL(termsUrl)}
              >
                {role === 'provider' ? 'Lead Provider' : 'Service Provider'} Terms of Use
              </Text>
            </Text>
          </TouchableOpacity>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button label="Create Account" onPress={handleSignup} loading={loading} fullWidth />

          <Text style={styles.terms}>
            By signing up you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.footerText, { color: Colors.orange, fontWeight: '600' }]}>Sign in →</Text>
          </TouchableOpacity>
        </View>
    </ScrollView>
    </>
  );
}

const welcome = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(6,12,24,0.72)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  card: { alignSelf: 'stretch', backgroundColor: '#1c2a43', borderWidth: 1, borderColor: '#34507a', borderRadius: 22, padding: 24, alignItems: 'center' },
  logoBox: { width: 52, height: 52, borderRadius: 15, backgroundColor: '#0e1830', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logoText: { fontSize: 20, fontWeight: '800' },
  title: { color: '#ffffff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  body: { color: '#bdd5f8', fontSize: 13.5, lineHeight: 20, textAlign: 'center', marginTop: 10 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 8 },
  pillCheck: { width: 18, height: 18, borderRadius: 9, textAlign: 'center', lineHeight: 18, fontSize: 11, color: '#34d399', backgroundColor: 'rgba(52,211,153,0.15)', overflow: 'hidden' },
  pillText: { color: '#cfe0f6', fontSize: 12.5 },
  btn: { alignSelf: 'stretch', backgroundColor: '#f97316', borderRadius: 13, paddingVertical: 13, alignItems: 'center', marginTop: 18 },
  btnText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
  note: { color: '#6f8bb0', fontSize: 11, marginTop: 11 },
});

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: Colors.bg },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xxl, gap: Spacing.lg },
  logoWrap: { alignItems: 'center', gap: 4 },
  logo:     { fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  logoSub:  { fontSize: 9, fontWeight: '600', letterSpacing: 4, color: Colors.muted },
  bonusBanner: {
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.4)',
    backgroundColor: 'rgba(249,115,22,0.1)',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  bonusText: { color: '#f97316', fontSize: FontSize.sm, fontWeight: '700', textAlign: 'center' },
  card: {
    backgroundColor: Colors.panel,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.32)',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  heading:    { fontSize: FontSize.xl, fontWeight: '700', color: Colors.foreground },
  subheading: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: -8 },
  roleRow: { flexDirection: 'row', gap: Spacing.sm },
  roleBtn: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.28)',
    backgroundColor: Colors.panel2,
    gap: 4,
  },
  roleBtnActive: {
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
  },
  bothBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.28)',
    backgroundColor: Colors.panel2,
  },
  bothBtnActive: {
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
  },
  roleEmoji: { fontSize: 24 },
  roleLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.foreground },
  roleDesc:  { fontSize: FontSize.xs, color: Colors.muted, textAlign: 'center' },
  form:      { gap: Spacing.sm + 4 },
  errorBox: {
    backgroundColor: 'rgba(248,113,113,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.35)',
    borderRadius: Radius.md,
    padding: Spacing.sm + 2,
  },
  errorText: { fontSize: FontSize.sm, color: Colors.danger },
  terms: { fontSize: FontSize.xs, color: Colors.muted, textAlign: 'center', lineHeight: 16 },
  termsRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.panel2, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5,
    borderColor: Colors.border2, alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkmark:  { color: '#fff', fontSize: 13, fontWeight: '700', lineHeight: 15 },
  termsRowText: { flex: 1, fontSize: FontSize.xs, color: Colors.text, lineHeight: 17 },
  termsLink: { color: Colors.accent, textDecorationLine: 'underline', fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  footerText: { fontSize: FontSize.sm, color: Colors.textSecondary },
});
