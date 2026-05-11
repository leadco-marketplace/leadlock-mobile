import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '@/lib/supabase';
import { Input }  from '@/components/Input';
import { Button } from '@/components/Button';
import { Colors, FontSize, Spacing, Radius } from '@/theme';
import type { AuthStackParamList } from '@/navigation/AuthNavigator';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'> };

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  async function handleSend() {
    if (!email.trim()) { Alert.alert('Enter your email'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    setLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <View style={styles.screen}>
        <View style={styles.centered}>
          <Text style={{ fontSize: 56 }}>📬</Text>
          <Text style={styles.heading}>Check your email</Text>
          <Text style={styles.sub}>We sent a reset link to {email}.</Text>
          <Button label="Back to Login" onPress={() => navigation.navigate('Login')} fullWidth />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <Text style={styles.logo}><Text style={{ color: Colors.accent }}>Lead</Text><Text style={{ color: Colors.orange }}>Co</Text></Text>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: Colors.bg },
  content:  { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xxl, gap: Spacing.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: Spacing.lg },
  logoWrap: { alignItems: 'center', gap: 4 },
  logo:     { fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  logoSub:  { fontSize: 9, fontWeight: '600', letterSpacing: 4, color: Colors.muted },
  card:     { backgroundColor: Colors.panel, borderRadius: Radius.xxl, borderWidth: 1, borderColor: 'rgba(249,115,22,0.32)', padding: Spacing.lg, gap: Spacing.md },
  heading:  { fontSize: FontSize.xl, fontWeight: '700', color: Colors.foreground },
  sub:      { fontSize: FontSize.sm, color: Colors.textSecondary },
});
