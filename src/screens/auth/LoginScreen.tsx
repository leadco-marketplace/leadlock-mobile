import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/contexts/AuthContext';
import { Input }  from '@/components/Input';
import { Button } from '@/components/Button';
import { Colors, FontSize, Spacing, Radius } from '@/theme';
import type { AuthStackParamList } from '@/navigation/AuthNavigator';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'> };

export function LoginScreen({ navigation }: Props) {
  const { signIn, signInAsGuest } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password) { setError('Please fill in all fields.'); return; }
    setError(null);
    setLoading(true);
    const err = await signIn(email.trim().toLowerCase(), password);
    if (err) { setError(err); setLoading(false); }
    // On success, AuthContext updates session → AppNavigator renders main app
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

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>Sign in to your account</Text>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureToggle
            />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button label="Sign In" onPress={handleLogin} loading={loading} fullWidth />

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'center' }}>
            <Text style={styles.link}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* Sign up link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={[styles.footerText, { color: Colors.orange, fontWeight: '600' }]}>
              Sign up free →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Guest browse */}
        <TouchableOpacity onPress={signInAsGuest} style={styles.guestBtn}>
          <Text style={styles.guestText}>Browse as Guest →</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    flexGrow:         1,
    justifyContent:   'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.xxl,
    gap:              Spacing.lg,
  },
  logoWrap: {
    alignItems: 'center',
    gap:        4,
  },
  logo: {
    fontSize:   40,
    fontWeight: '800',
    letterSpacing: -1,
  },
  logoSub: {
    fontSize:      9,
    fontWeight:    '600',
    letterSpacing: 4,
    color:         Colors.muted,
  },
  card: {
    backgroundColor: Colors.panel,
    borderRadius:    Radius.xxl,
    borderWidth:     1,
    borderColor:     'rgba(249,115,22,0.32)',
    padding:         Spacing.lg,
    gap:             Spacing.md,
  },
  heading: {
    fontSize:   FontSize.xl,
    fontWeight: '700',
    color:      Colors.foreground,
  },
  subheading: {
    fontSize: FontSize.sm,
    color:    Colors.textSecondary,
    marginTop: -8,
  },
  form: { gap: Spacing.sm + 4 },
  errorBox: {
    backgroundColor: 'rgba(248,113,113,0.10)',
    borderWidth:     1,
    borderColor:     'rgba(248,113,113,0.35)',
    borderRadius:    Radius.md,
    padding:         Spacing.sm + 2,
  },
  errorText: {
    fontSize: FontSize.sm,
    color:    Colors.danger,
  },
  link: {
    fontSize:  FontSize.sm,
    color:     Colors.muted,
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection:  'row',
    justifyContent: 'center',
    flexWrap:       'wrap',
  },
  footerText: {
    fontSize: FontSize.sm,
    color:    Colors.textSecondary,
  },
  guestBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  guestText: {
    fontSize: FontSize.sm,
    color:    Colors.muted,
    textDecorationLine: 'underline',
  },
});
