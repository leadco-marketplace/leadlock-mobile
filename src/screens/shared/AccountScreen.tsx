import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Switch, Linking, ScrollView, TextInput,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { profileApi, phoneVerifyApi } from '@/lib/api';
import { ScreenShell } from '@/components/ScreenShell';
import { Button } from '@/components/Button';
import { Colors, FontSize, Spacing, Radius, Shadow } from '@/theme';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

const WEB_APP = (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://leadco-marketplace-p5zj.vercel.app';

type PhoneStep = 'idle' | 'entering' | 'sending' | 'verifying' | 'done';

export function AccountScreen() {
  const { profile, signOut, signInAsGuest: _signInAsGuest, isGuest, refreshProfile } = useAuth();
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  // ── Phone verification state ──────────────────────────────────────────────
  const [phoneStep,    setPhoneStep]    = useState<PhoneStep>('idle');
  const [phoneInput,   setPhoneInput]   = useState('');
  const [codeInput,    setCodeInput]    = useState('');
  const [phoneError,   setPhoneError]   = useState<string | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  // ── Notification toggle ───────────────────────────────────────────────────
  async function toggleNotif(key: 'notify_email' | 'notify_sms' | 'notify_push', val: boolean) {
    if (!profile) return;
    setSaving(true);
    try {
      await profileApi.update({ [key]: val });
      await refreshProfile();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Phone: send verification code ────────────────────────────────────────
  async function handleSendCode() {
    if (!phoneInput.trim()) { setPhoneError('Enter a phone number'); return; }
    setPhoneError(null);
    setPhoneStep('sending');
    try {
      const { phone } = await phoneVerifyApi.sendCode(phoneInput.trim());
      setPendingPhone(phone);
      setCodeInput('');
      setPhoneStep('verifying');
    } catch (e: any) {
      setPhoneError(e.message ?? 'Could not send code');
      setPhoneStep('entering');
    }
  }

  // ── Phone: verify code ────────────────────────────────────────────────────
  async function handleVerifyCode() {
    if (!codeInput.trim()) { setPhoneError('Enter the 6-digit code'); return; }
    setPhoneError(null);
    setPhoneStep('sending');
    try {
      await phoneVerifyApi.verifyCode(codeInput.trim());
      await refreshProfile();
      setPhoneStep('done');
      setTimeout(() => setPhoneStep('idle'), 2000);
    } catch (e: any) {
      setPhoneError(e.message ?? 'Incorrect code');
      setPhoneStep('verifying');
    }
  }

  // ── Sign out ──────────────────────────────────────────────────────────────
  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  // ── Delete account ────────────────────────────────────────────────────────
  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ]
    );
  }

  async function confirmDeleteAccount() {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${WEB_APP}/api/user/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const body = await res.json();
        Alert.alert('Error', body.error ?? 'Could not delete account. Please contact support.');
        return;
      }
      // Sign out locally — server already deleted the auth user
      await signOut();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Network error. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  if (!profile) {
    // Guest or loading state — show a sign-in prompt
    return (
      <ScreenShell title="My Account" scrollable>
        <View style={styles.guestWrap}>
          <Text style={styles.guestIcon}>👤</Text>
          <Text style={styles.guestTitle}>Sign in to access your account</Text>
          <Text style={styles.guestDesc}>
            Create an account or sign in to unlock leads, manage preferences, and track your activity.
          </Text>
          <Button
            label="Sign In / Sign Up"
            onPress={signOut}
            variant="primary"
            fullWidth
          />
        </View>
      </ScreenShell>
    );
  }

  const roleLabel =
    profile.role === 'buyer'    ? '🎯 Lead Buyer' :
    profile.role === 'provider' ? '💼 Lead Seller' : '🛡️ Admin';

  const isBuyer = profile.role === 'buyer';

  return (
    <ScreenShell title="My Account" scrollable>

      {/* ── Profile card ──────────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(profile.email?.[0] ?? '?').toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.email}>{profile.email}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>{roleLabel}</Text>
            </View>
          </View>
        </View>

        {isBuyer && (
          <View style={styles.creditsRow}>
            <Text style={styles.creditsLabel}>Credit balance</Text>
            <Text style={styles.creditsValue}>${((profile.credits_cents ?? 0) / 100).toFixed(2)}</Text>
          </View>
        )}
      </View>

      {/* ── Phone number ──────────────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📱  Phone Number</Text>

        {phoneStep === 'done' ? (
          <Text style={styles.phoneSuccess}>✅ Phone verified successfully!</Text>
        ) : (
          <>
            <View style={styles.phoneRow}>
              <Text style={styles.phoneLabel}>Current:</Text>
              <Text style={styles.phoneValue}>
                {profile.phone ? profile.phone : <Text style={styles.muted}>Not set</Text>}
              </Text>
            </View>

            {phoneStep === 'idle' && (
              <TouchableOpacity
                style={styles.changePhoneBtn}
                onPress={() => { setPhoneInput(''); setPhoneError(null); setPhoneStep('entering'); }}
                activeOpacity={0.75}
              >
                <Text style={styles.changePhoneBtnText}>
                  {profile.phone ? 'Change phone number' : 'Add phone number'}
                </Text>
              </TouchableOpacity>
            )}

            {(phoneStep === 'entering' || phoneStep === 'sending') && (
              <>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor={Colors.muted}
                  value={phoneInput}
                  onChangeText={setPhoneInput}
                  keyboardType="phone-pad"
                  autoFocus
                />
                {phoneError && <Text style={styles.phoneError}>{phoneError}</Text>}
                <View style={styles.phoneActions}>
                  <TouchableOpacity onPress={() => setPhoneStep('idle')} style={styles.cancelLink}>
                    <Text style={styles.cancelLinkText}>Cancel</Text>
                  </TouchableOpacity>
                  <Button
                    variant="primary"
                    loading={phoneStep === 'sending'}
                    onPress={handleSendCode}
                    label="Send Code"
                  />
                </View>
              </>
            )}

            {(phoneStep === 'verifying' || phoneStep === 'sending') && pendingPhone && (
              <>
                <Text style={styles.codeSentText}>
                  Code sent to {pendingPhone}. Check your messages.
                </Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="6-digit code"
                  placeholderTextColor={Colors.muted}
                  value={codeInput}
                  onChangeText={setCodeInput}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
                {phoneError && <Text style={styles.phoneError}>{phoneError}</Text>}
                <View style={styles.phoneActions}>
                  <TouchableOpacity onPress={() => { setPhoneStep('entering'); setPhoneError(null); }} style={styles.cancelLink}>
                    <Text style={styles.cancelLinkText}>← Re-enter number</Text>
                  </TouchableOpacity>
                  <Button
                    variant="primary"
                    loading={phoneStep === 'sending'}
                    onPress={handleVerifyCode}
                    label="Verify"
                  />
                </View>
              </>
            )}
          </>
        )}
      </View>

      {/* ── Account & billing (buyers only) ───────────────────── */}
      {isBuyer && (
        <TouchableOpacity
          style={styles.linkCard}
          onPress={() => Linking.openURL(`${WEB_APP}/account`)}
          activeOpacity={0.75}
        >
          <View>
            <Text style={styles.linkCardTitle}>💳  Manage Account &amp; Billing</Text>
            <Text style={styles.linkCardSub}>Buy credits · Manage payment methods · View purchases</Text>
          </View>
          <Text style={styles.linkArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* ── Notifications ──────────────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        {([
          ['notify_email', '✉️  Email alerts'],
          ['notify_sms',   '📱  SMS alerts'],
          ['notify_push',  '🔔  Push notifications'],
        ] as const).map(([key, label]) => (
          <View key={key} style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{label}</Text>
            <Switch
              value={profile[key] ?? false}
              onValueChange={(v) => toggleNotif(key, v)}
              disabled={saving}
              trackColor={{ false: Colors.panel3, true: Colors.orange }}
              thumbColor={Colors.foreground}
            />
          </View>
        ))}
      </View>

      {/* ── Sign out ────────────────────────────────────────────── */}
      <Button label="Sign Out" onPress={handleSignOut} variant="danger" fullWidth />

      {/* ── Delete account ──────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.deleteAccountBtn}
        onPress={handleDeleteAccount}
        disabled={deleting}
        activeOpacity={0.7}
      >
        <Text style={styles.deleteAccountText}>
          {deleting ? 'Deleting account…' : 'Delete Account'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: Spacing.xxl }} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.panel,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderOrange,
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.sm + 4,
    ...Shadow.card,
  },
  linkCard: {
    backgroundColor: Colors.panel,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border2,
    padding: Spacing.md,
    marginBottom: Spacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadow.card,
  },
  linkCardTitle: { fontSize: FontSize.base, fontWeight: '600', color: Colors.foreground },
  linkCardSub:   { fontSize: FontSize.xs, color: Colors.muted, marginTop: 3 },
  linkArrow:     { fontSize: 24, color: Colors.muted, lineHeight: 28 },

  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(129,140,248,0.20)',
    borderWidth: 2, borderColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:   { fontSize: FontSize.xl, fontWeight: '700', color: Colors.accent },
  email:        { fontSize: FontSize.sm, color: Colors.foreground, fontWeight: '500' },
  rolePill: {
    marginTop: 4, alignSelf: 'flex-start',
    backgroundColor: 'rgba(249,115,22,0.12)',
    borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(249,115,22,0.28)',
  },
  roleText:      { fontSize: FontSize.xs, color: Colors.orange, fontWeight: '600' },
  creditsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  creditsLabel:  { fontSize: FontSize.sm, color: Colors.muted },
  creditsValue:  { fontSize: FontSize.md, fontWeight: '700', color: Colors.accent, fontVariant: ['tabular-nums'] },

  sectionTitle: {
    fontSize: FontSize.sm, fontWeight: '700', color: Colors.foreground,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  toggleRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel:  { fontSize: FontSize.base, color: Colors.text },

  // ── Phone verification ────────────────────────────────────────────────────
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  phoneLabel: { fontSize: FontSize.sm, color: Colors.muted, width: 64 },
  phoneValue: { fontSize: FontSize.sm, color: Colors.foreground, fontWeight: '500', flex: 1 },
  muted: { color: Colors.muted },

  changePhoneBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
    backgroundColor: 'rgba(129,140,248,0.08)',
  },
  changePhoneBtnText: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: '600' },

  phoneInput: {
    backgroundColor: Colors.panel2,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: FontSize.base,
    color: Colors.foreground,
  },
  phoneError: { fontSize: FontSize.xs, color: '#f87171', marginTop: -Spacing.xs },
  phoneActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xs },
  cancelLink: { padding: 4 },
  cancelLinkText: { fontSize: FontSize.sm, color: Colors.muted },
  codeSentText: { fontSize: FontSize.xs, color: Colors.muted, lineHeight: 17 },
  phoneSuccess: { fontSize: FontSize.sm, color: '#4ade80', fontWeight: '600' },

  // ── Guest state ────────────────────────────────────────────────────────────
  guestWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xxl,
  },
  guestIcon:  { fontSize: 56, textAlign: 'center' },
  guestTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.foreground, textAlign: 'center' },
  guestDesc:  { fontSize: FontSize.sm, color: Colors.muted, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.sm },

  // ── Delete account ────────────────────────────────────────────────────────
  deleteAccountBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  deleteAccountText: {
    fontSize: FontSize.sm,
    color: '#f87171',
    textDecorationLine: 'underline',
    opacity: 0.75,
  },
});
