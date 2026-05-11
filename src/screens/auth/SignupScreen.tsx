import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth }  from '@/contexts/AuthContext';
import { Input }   from '@/components/Input';
import { Button }  from '@/components/Button';
import { Colors, FontSize, Spacing, Radius } from '@/theme';
import type { AuthStackParamList } from '@/navigation/AuthNavigator';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Signup'> };

export function SignupScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState<'buyer' | 'provider'>('buyer');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleSignup() {
    if (!email.trim() || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 8)        { setError('Password must be at least 8 characters.'); return; }
    setError(null);
    setLoading(true);
    const err = await signUp(email.trim().toLowerCase(), password, role);
    if (err) { setError(err); setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>
            <Text style={{ color: Colors.accent }}>Lead</Text>
            <Text style={{ color: Colors.orange }}>Co</Text>
          </Text>
          <Text style={styles.logoSub}>MARKETPLACE</Text>
        </View>

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: Colors.bg },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xxl, gap: Spacing.lg },
  logoWrap: { alignItems: 'center', gap: 4 },
  logo:     { fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  logoSub:  { fontSize: 9, fontWeight: '600', letterSpacing: 4, color: Colors.muted },
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
  footer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  footerText: { fontSize: FontSize.sm, color: Colors.textSecondary },
});
