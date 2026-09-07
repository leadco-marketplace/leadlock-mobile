import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '@/lib/supabase';
import { Input }  from '@/components/Input';
import { Button } from '@/components/Button';
import { Colors, FontSize, Spacing, Radius } from '@/theme';
import type { AuthStackParamList } from '@/navigation/AuthNavigator';
import Constants from 'expo-constants';

// The web base (live www.nabbitmarketplace.com / test test.nabbitmarketplace.com).
// Reset links must land on /reset-password (which handles the token) — not the
// Site URL default, which is the landing page.
const WEB_APP = (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://www.nabbitmarketplace.com';

// 3×3 grid logo — same as the Login screen.
const GRID_CELLS = [
  '#1e3a8a', '#3b82f6', '#818cf8',
  '#6366f1', '#f97316', '#f97316',
  '#7c3aed', '#ea580c', '#c2410c',
];

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'> };

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  async function handleSend() {
    if (!email.trim()) { Alert.alert('Enter your email'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${WEB_APP}/reset-password`,
    });
    setLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <View style={styles.screen}>
        <View style={styles.centered}>
          <View style={styles.logoWrap}>
            <View style={styles.gridLogo}>
              {GRID_CELLS.map((color, i) => (
                <View key={i} style={[styles.gridCell, { backgroundColor: color }]} />
              ))}
            </View>
            <Text style={styles.logo}><Text style={{ color: Colors.accent }}>Na</Text><Text style={{ color: '#f97316', fontWeight: '900', fontSize: 44 }}>bb</Text><Text style={{ color: Colors.accent }}>it</Text></Text>
            <Text style={styles.logoSub}>MARKETPLACE</Text>
          </View>
          <Text style={{ fontSize: 44 }}>📬</Text>
          <Text style={styles.heading}>Check your email</Text>
          <Text style={styles.sub}>We sent a reset link to {email}.</Text>
          <Button label="Back to Login" onPress={() => navigation.navigate('Login')} fullWidth />
        </View>
      </View>
    );
  }

  return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
      >
        <View style={styles.logoWrap}>
          <View style={styles.gridLogo}>
            {GRID_CELLS.map((color, i) => (
              <View key={i} style={[styles.gridCell, { backgroundColor: color }]} />
            ))}
          </View>
          <Text style={styles.logo}><Text style={{ color: Colors.accent }}>Na</Text><Text style={{ color: '#f97316', fontWeight: '900', fontSize: 44 }}>bb</Text><Text style={{ color: Colors.accent }}>it</Text></Text>
          <Text style={styles.logoSub}>MARKETPLACE</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.heading}>Reset password</Text>
          <Text style={styles.sub}>We'll send you a link to reset your password.</Text>
          <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
          <Button label="Send Reset Link" onPress={handleSend} loading={loading} fullWidth />
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ alignSelf: 'center' }}>
          <Text style={{ fontSize: FontSize.sm, color: Colors.muted }}>← Back to login</Text>
        </TouchableOpacity>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: Colors.bg },
  content:  { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xxl, gap: Spacing.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: Spacing.lg },
  logoWrap: { alignItems: 'center', gap: 8 },
  gridLogo: { flexDirection: 'row', flexWrap: 'wrap', width: 50, gap: 4 },
  gridCell: { width: 14, height: 14, borderRadius: 3 },
  logo:     { fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  logoSub:  { fontSize: 9, fontWeight: '600', letterSpacing: 4, color: Colors.muted },
  card:     { backgroundColor: Colors.panel, borderRadius: Radius.xxl, borderWidth: 1, borderColor: 'rgba(249,115,22,0.32)', padding: Spacing.lg, gap: Spacing.md },
  heading:  { fontSize: FontSize.xl, fontWeight: '700', color: Colors.foreground },
  sub:      { fontSize: FontSize.sm, color: Colors.textSecondary },
});
