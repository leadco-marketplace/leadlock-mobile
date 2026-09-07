import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Switch, Linking, ScrollView, TextInput, Keyboard,
  ActivityIndicator, AppState, Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { profileApi, phoneVerifyApi, walletApi, accountApi } from '@/lib/api';
import { openTour } from '@/lib/tour';
import { openAppStoreReview } from '@/lib/rateApp';
import { ScreenShell } from '@/components/ScreenShell';
import { Button } from '@/components/Button';
import { Colors, FontSize, Spacing, Radius, Shadow } from '@/theme';
import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';
import { supabase } from '@/lib/supabase';
import { useStripe, initStripe } from '@stripe/stripe-react-native';

const WEB_APP = (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://www.nabbitmarketplace.com';

type PhoneStep = 'idle' | 'entering' | 'sending' | 'verifying' | 'done';

export function AccountScreen() {
  const { profile, signOut, signInAsGuest: _signInAsGuest, isGuest, refreshProfile, dual, effectiveRole, setActiveRole } = useAuth();
  const { mode: themeMode, setMode: setThemeMode } = useTheme();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const navigation = useNavigation<any>();
  function openAnnouncements() {
    if (profile?.role === 'provider') navigation.navigate('SubmissionsTab', { screen: 'Announcements' });
    else navigation.navigate('Announcements');
  }
  function openHelpSupport() {
    if (profile?.role === 'provider') navigation.navigate('SubmissionsTab', { screen: 'HelpSupport' });
    else navigation.navigate('HelpSupport');
  }
  const [saving,        setSaving]        = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [addingSide,    setAddingSide]    = useState(false);
  const [sideAdded,     setSideAdded]     = useState(false);
  const [buyingCredits, setBuyingCredits] = useState<number | null>(null); // amountCents in flight
  const [customAmount,  setCustomAmount]  = useState(''); // free-entry deposit amount (dollars)

  // ── Cash App deposit trust ladder state ────────────────────────────────────
  const [cashAppAllowed,  setCashAppAllowed]  = useState(false);
  const [cashAppMaxCents, setCashAppMaxCents] = useState(0);
  const [owedCents,       setOwedCents]       = useState(0);
  const [depositMethod,   setDepositMethod]   = useState<'cashapp' | 'applepay' | 'bank'>('bank');
  const [repaying,        setRepaying]        = useState(false);

  async function loadCashAppStatus() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      const res = await fetch(`${WEB_APP}/api/wallet/cashapp-status?_t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const body = await res.json();
      setCashAppAllowed(!!body.allowed);
      setCashAppMaxCents(Number(body.perDepositCapCents) || 0);
      setOwedCents(Number(body.owedCents) || 0);
      if (!body.allowed) setDepositMethod('bank');
    } catch { /* non-fatal — bank stays the default */ }
  }

  // Keep the wallet balance current: refresh when this screen gains focus and
  // whenever the app returns to the foreground (e.g. back from the Stripe
  // deposit checkout). Fixes the balance not updating right after a deposit.
  useFocusEffect(
    React.useCallback(() => { refreshProfile(); loadCashAppStatus(); }, [])
  );
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') { refreshProfile(); loadCashAppStatus(); }
    });
    return () => sub.remove();
  }, []);

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

  // ── Add funds — NATIVE Stripe PaymentSheet (Cash App / ACH) ────────────────
  // Fetches a PaymentIntent client secret from /api/wallet/deposit-intent and
  // presents Stripe's in-app sheet instead of opening a browser Checkout:
  //   • Cash App → app-to-app handoff to the Cash App app, back into ours.
  //   • Bank     → native us_bank_account bank-connect sheet (ACH).
  // The Stripe webhook credits the wallet on payment_intent.succeeded (Cash App
  // ~instant; ACH settles in 1–4 business days). Server enforces the Cash App
  // earned-trust caps — the on-device check below is just instant feedback.
  async function handleAddCredits(amountCents: number) {
    const method: 'cashapp' | 'applepay' | 'bank' = cashAppAllowed ? depositMethod : 'bank';
    // Cash App + Apple Pay share the same instant-funding per-deposit cap.
    if ((method === 'cashapp' || method === 'applepay') && cashAppMaxCents > 0 && amountCents > cashAppMaxCents) {
      Alert.alert(
        method === 'applepay' ? 'Apple Pay Limit' : 'Cash App Limit',
        `The most you can deposit instantly right now is $${(cashAppMaxCents / 100).toFixed(2)}. Use your bank for a larger amount.`,
      );
      return;
    }
    setBuyingCredits(amountCents);
    try {
      const { clientSecret, publishableKey } = await walletApi.depositIntent(amountCents, method);

      // StripeProvider ships with a blank key, so initialize with the key the
      // server returned (auto-matches test vs live) before presenting the sheet.
      if (publishableKey) {
        try {
          await initStripe({
            publishableKey,
            merchantIdentifier: (Constants.expoConfig?.extra?.stripeMerchantId as string) ?? 'merchant.com.leadco.marketplace',
          });
        } catch { /* provider already initialized — fine */ }
      }

      // returnURL is REQUIRED for the Cash App app-to-app redirect back into our
      // app; scheme is registered in app config (leadco / leadcotest).
      const scheme = (Constants.expoConfig?.scheme as string) ?? 'leadco';
      const { error: initErr } = await initPaymentSheet({
        merchantDisplayName: 'Nabbit Marketplace',
        paymentIntentClientSecret: clientSecret,
        returnURL: `${scheme}://stripe-redirect`,
        // REQUIRED for ACH (us_bank_account) — funds settle after the sheet closes.
        allowsDelayedPaymentMethods: true,
        // Apple Pay = a true native sheet (no web hop). Only enabled for the
        // Apple Pay method; Cash App / ACH don't use a native wallet.
        applePay: method === 'applepay' ? { merchantCountryCode: 'US' } : undefined,
        googlePay: undefined,
      });
      if (initErr) {
        Alert.alert('Payment error', initErr.message ?? 'Could not start the deposit.');
        return;
      }

      const { error: payErr } = await presentPaymentSheet();
      if (payErr) {
        // Cancelling the sheet is not an error we surface loudly.
        if (payErr.code !== 'Canceled') {
          Alert.alert('Payment not completed', payErr.message ?? 'Please try again.');
        }
        return;
      }

      // Payment authorized. The webhook credits the wallet once it settles.
      await refreshProfile();
      await loadCashAppStatus();
      if (method === 'bank') {
        Alert.alert(
          '✅ Bank transfer started',
          'Your deposit is on its way. Bank transfers (ACH) take 1–4 business days to clear — your balance updates automatically once it settles.',
        );
      } else {
        Alert.alert('✅ Deposit received', "We're adding the funds to your balance now.");
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Network error. Please try again.');
    } finally {
      setBuyingCredits(null);
    }
  }

  // ── Repay a reversed Cash App deposit ──────────────────────────────────────
  async function handleRepayChargeback() {
    setRepaying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { Alert.alert('Error', 'Please sign in again.'); return; }
      const res = await fetch(`${WEB_APP}/api/wallet/repay-chargeback`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ mobile: true }),
      });
      const body = await res.json();
      if (res.ok && body.checkoutUrl) {
        await Linking.openURL(body.checkoutUrl);
      } else {
        Alert.alert('Error', body.detail ?? body.error ?? 'Could not start repayment. Please try again.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Network error. Please try again.');
    } finally {
      setRepaying(false);
    }
  }

  // Custom amount → same deposit flow as the preset buttons. Server enforces
  // the $20–$20,000 range too; this is just instant on-device feedback.
  function handleCustomDeposit() {
    const dollars = parseFloat(customAmount.replace(/[^0-9.]/g, ''));
    if (!isFinite(dollars) || dollars <= 0) {
      Alert.alert('Enter An Amount', 'Type the amount you want to deposit, e.g. 555.');
      return;
    }
    if (dollars < 20)     { Alert.alert('Minimum Deposit', 'The minimum deposit is $20.'); return; }
    if (dollars > 20000)  { Alert.alert('Maximum Deposit', 'The maximum single deposit is $20,000.'); return; }
    const cents = Math.round(dollars * 100);
    setCustomAmount('');
    handleAddCredits(cents);
  }

  // ── Add the other side (single-role → dual) ───────────────────────────────
  async function handleAddOtherSide(missing: 'buyer' | 'provider') {
    if (addingSide) return;
    setAddingSide(true);
    try {
      await accountApi.enableRole(missing);
      setSideAdded(true);
      await refreshProfile();
    } catch (e: any) {
      Alert.alert('Something went wrong', e?.message ?? 'Could not add the other side. Please try again.');
    } finally {
      setAddingSide(false);
    }
  }

  // ── Switch side (dual accounts) ───────────────────────────────────────────
  // Flips the active side in-session (no logout). AppNavigator watches
  // effectiveRole and re-renders into the chosen side; data stays fully isolated.
  const [switching, setSwitching] = useState(false);
  async function handleSwitchSide() {
    if (switching || (effectiveRole !== 'buyer' && effectiveRole !== 'provider')) return;
    const target = effectiveRole === 'buyer' ? 'provider' : 'buyer';
    setSwitching(true);
    try { await setActiveRole(target); } finally { setSwitching(false); }
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

  // Open the web Add Funds page ALREADY signed in: mint a single-use handoff
  // token, then open /auth/continue which sets the web session and lands on
  // /add-funds. Falls back to the plain page (web login) if anything fails.
  async function openAddFunds() {
    // Deep-link this app (live "leadco://…" or test "leadcotest://…") so checkout
    // can bounce the user back into THIS app after payment.
    const scheme = (Constants.expoConfig?.scheme as string) || 'leadco';
    const nextPath = `/add-funds?return=${encodeURIComponent(`${scheme}://account`)}`;
    const fallback = () => Linking.openURL(`${WEB_APP}${nextPath}`);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${WEB_APP}/api/auth/mobile-handoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d?.token_hash) {
        const url = `${WEB_APP}/auth/continue?token_hash=${encodeURIComponent(d.token_hash)}&next=${encodeURIComponent(nextPath)}`;
        await Linking.openURL(url);
        return;
      }
    } catch { /* fall through */ }
    await fallback();
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
      <View style={[styles.card, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange, shadowColor: Colors.glowColor }]}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(profile.email?.[0] ?? '?').toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.email, { color: Colors.foreground }]}>{profile.email}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>{roleLabel}</Text>
            </View>
          </View>
        </View>

        {isBuyer && (
          <View style={[styles.creditsRow, { borderTopColor: Colors.border }]}>
            <Text style={[styles.creditsLabel, { color: Colors.muted }]}>Credit balance</Text>
            <Text style={[styles.creditsValue, { color: Colors.accent }]}>${((profile.credits_cents ?? 0) / 100).toFixed(2)}</Text>
          </View>
        )}

        {!isGuest && (
          <TouchableOpacity onPress={openAnnouncements}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.border, paddingVertical: Spacing.md }}>
            <Text style={{ color: Colors.foreground, fontSize: FontSize.md, fontWeight: '600' }}>📣  Announcements</Text>
            <Text style={{ color: Colors.muted, fontSize: FontSize.lg }}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Phone number ──────────────────────────────────────── */}
      <View style={[styles.card, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange, shadowColor: Colors.glowColor }]}>
        <Text style={[styles.sectionTitle, { color: Colors.foreground }]}>📱  Phone Number</Text>

        {phoneStep === 'done' ? (
          <Text style={styles.phoneSuccess}>✅ Phone verified successfully!</Text>
        ) : (
          <>
            <View style={styles.phoneRow}>
              <Text style={[styles.phoneLabel, { color: Colors.muted }]}>Current:</Text>
              <Text style={[styles.phoneValue, { color: Colors.foreground }]}>
                {profile.phone ? profile.phone : <Text style={[styles.muted, { color: Colors.muted }]}>Not set</Text>}
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
                  style={[styles.phoneInput, { backgroundColor: Colors.panel2, borderColor: Colors.border2, color: Colors.foreground }]}
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
                  style={[styles.phoneInput, { backgroundColor: Colors.panel2, borderColor: Colors.border2, color: Colors.foreground }]}
                  placeholder="6-digit code"
                  placeholderTextColor={Colors.muted}
                  value={codeInput}
                  onChangeText={v => {
                    const digits = v.replace(/\D/g, '').slice(0, 6);
                    setCodeInput(digits);
                    // number-pad has no "done" key — auto-dismiss at 6 digits.
                    if (digits.length === 6) Keyboard.dismiss();
                  }}
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

      {/* ── Add credits (buyers only) ─────────────────────────── */}
      {/* iOS: in-app funding is hidden to comply with App Store Guideline 3.1.1
          (no non-Apple purchase of credits in-app). iOS buyers top up their
          wallet on the website; the app only spends existing balance. Android
          + web keep the in-app Add Funds flow. */}
      {isBuyer && Platform.OS !== 'ios' && (
        <View style={[styles.creditCard, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange, shadowColor: Colors.glowColor }]}>
          <Text style={[styles.sectionTitle, { color: Colors.foreground }]}>💰  Add Funds</Text>

          {/* Repay banner — a reversed Cash App deposit is outstanding */}
          {owedCents > 0 && (
            <View style={{ marginTop: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: '#f59e0b66', backgroundColor: '#f59e0b1a' }}>
              <Text style={{ color: '#fbbf24', fontSize: FontSize.sm, lineHeight: 20 }}>
                A recent Cash App deposit was reversed. Repay ${(owedCents / 100).toFixed(2)} to keep your account in good standing.
              </Text>
              <TouchableOpacity
                style={{ marginTop: Spacing.sm, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, borderRadius: Radius.md, backgroundColor: '#f59e0b' }}
                onPress={handleRepayChargeback}
                disabled={repaying}
                activeOpacity={0.75}
              >
                <Text style={{ color: '#111827', fontWeight: '700', fontSize: FontSize.sm }}>
                  {repaying ? 'Opening…' : `Pay it back ($${(owedCents / 100).toFixed(2)})`}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={[styles.creditsHint, { color: Colors.muted, marginTop: Spacing.xs }]}>
            Pick an amount — or type your own ($20–$20,000) — and deposit on a secure checkout page.
            {cashAppAllowed
              ? ' Choose ⚡ Cash App, 🍎 Apple Pay (both instant) or 🏦 Bank (ACH, 1–4 business days).'
              : ' Deposits use your bank (ACH) and take 1–4 business days to clear.'}
            {' '}You can move any unused balance back to where it came from anytime.
          </Text>

          {/* Explicit method choice — instant methods only when eligible. */}
          {cashAppAllowed && (
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
              {([['cashapp', '⚡ Cash App'], ['applepay', '🍎 Apple Pay'], ['bank', '🏦 Bank']] as const).map(([m, label]) => {
                const active = depositMethod === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={{
                      flex: 1, paddingVertical: 10, borderRadius: Radius.md, alignItems: 'center',
                      borderWidth: 1,
                      borderColor: active ? Colors.accent : Colors.border2,
                      backgroundColor: active ? `${Colors.accent}22` : Colors.panel2,
                    }}
                    onPress={() => setDepositMethod(m)}
                    activeOpacity={0.75}
                  >
                    <Text numberOfLines={1} style={{ color: active ? Colors.accent : Colors.muted, fontWeight: active ? '700' : '500', fontSize: FontSize.xs }}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          {cashAppAllowed && depositMethod === 'cashapp' && cashAppMaxCents > 0 && (
            <Text style={[styles.creditsHint, { color: Colors.muted, marginTop: Spacing.xs }]}>
              Cash App available up to ${(cashAppMaxCents / 100).toFixed(2)} per deposit.
            </Text>
          )}

          <View style={{ marginTop: Spacing.sm, gap: Spacing.sm }}>
            {([
              [[2500, '$25'], [5000,  '$50' ]],
              [[10000, '$100'], [20000, '$200']],
            ] as const).map((row, rowIdx) => (
              <View key={rowIdx} style={styles.creditRow}>
                {row.map(([cents, label]) => {
                  const loading = buyingCredits === cents;
                  return (
                    <TouchableOpacity
                      key={cents}
                      style={[styles.creditBtn, loading && styles.creditBtnLoading]}
                      onPress={() => handleAddCredits(cents)}
                      disabled={buyingCredits !== null}
                      activeOpacity={0.75}
                    >
                      {loading
                        ? <ActivityIndicator size="small" color={Colors.foreground} />
                        : <Text style={[styles.creditBtnText, { color: Colors.accent }]}>{label}</Text>
                      }
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {/* Custom amount — any value $20–$20,000 */}
            <View style={styles.creditRow}>
              <View style={[styles.customAmountWrap, { borderColor: Colors.border2, backgroundColor: Colors.panel2 }]}>
                <Text style={[styles.customAmountPrefix, { color: Colors.muted }]}>$</Text>
                <TextInput
                  style={[styles.customAmountInput, { color: Colors.foreground }]}
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  placeholder="Custom amount"
                  placeholderTextColor={Colors.placeholder}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  onSubmitEditing={handleCustomDeposit}
                  editable={buyingCredits === null}
                />
              </View>
              <TouchableOpacity
                style={[styles.creditBtn, { flex: 0, paddingHorizontal: 18 }, (buyingCredits !== null || !customAmount.trim()) && styles.creditBtnLoading]}
                onPress={handleCustomDeposit}
                disabled={buyingCredits !== null || !customAmount.trim()}
                activeOpacity={0.75}
              >
                <Text style={[styles.creditBtnText, { color: Colors.accent }]}>Deposit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* iOS: no in-app purchase (Guideline 3.1.1) — but a clear link so buyers
          always know where to top up. Opens the branded web /add-funds page.
          This is a link to our website (like Manage Billing), not an in-app
          purchase mechanism. Android/web use the in-app Add Funds card above. */}
      {isBuyer && Platform.OS === 'ios' && (
        <TouchableOpacity
          style={[styles.linkCard, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange, shadowColor: Colors.glowColor }]}
          onPress={openAddFunds}
          activeOpacity={0.75}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.linkCardTitle, { color: Colors.foreground }]}>💰  Add Funds</Text>
            <Text style={[styles.linkCardSub, { color: Colors.muted }]}>Top up your wallet on the web · then unlock leads instantly from your balance</Text>
          </View>
          <Text style={[styles.linkArrow, { color: Colors.muted }]}>›</Text>
        </TouchableOpacity>
      )}

      {/* ── Account & billing (buyers only) ───────────────────── */}
      {isBuyer && (
        <TouchableOpacity
          style={[styles.linkCard, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange, shadowColor: Colors.glowColor }]}
          onPress={() => Linking.openURL(`${WEB_APP}/account`)}
          activeOpacity={0.75}
        >
          <View>
            <Text style={[styles.linkCardTitle, { color: Colors.foreground }]}>🧾  Manage Billing</Text>
            <Text style={[styles.linkCardSub, { color: Colors.muted }]}>View purchases · Manage payment methods</Text>
          </View>
          <Text style={[styles.linkArrow, { color: Colors.muted }]}>›</Text>
        </TouchableOpacity>
      )}

      {/* ── Help & more ───────────────────────────────────────── */}
      {!isGuest && (
        <View style={[styles.card, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange, shadowColor: Colors.glowColor }]}>
          <TouchableOpacity
            onPress={openHelpSupport}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm + 2 }}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.foreground, fontSize: FontSize.md, fontWeight: '600' }}>💬  Help &amp; Support</Text>
              <Text style={{ color: Colors.muted, fontSize: FontSize.xs, marginTop: 2 }}>Chat with us or report a problem</Text>
            </View>
            <Text style={{ color: Colors.muted, fontSize: FontSize.lg }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openTour}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm + 2, borderTopWidth: 1, borderTopColor: Colors.border }}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.foreground, fontSize: FontSize.md, fontWeight: '600' }}>🎓  Replay Tutorial</Text>
              <Text style={{ color: Colors.muted, fontSize: FontSize.xs, marginTop: 2 }}>See the quick walkthrough of how Nabbit works</Text>
            </View>
            <Text style={{ color: Colors.muted, fontSize: FontSize.lg }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openAppStoreReview}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm + 2, borderTopWidth: 1, borderTopColor: Colors.border }}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.foreground, fontSize: FontSize.md, fontWeight: '600' }}>⭐  Rate This App</Text>
              <Text style={{ color: Colors.muted, fontSize: FontSize.xs, marginTop: 2 }}>Enjoying Nabbit? Leave a rating on the {Platform.OS === 'ios' ? 'App Store' : 'Play Store'}</Text>
            </View>
            <Text style={{ color: Colors.muted, fontSize: FontSize.lg }}>›</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Notifications ──────────────────────────────────────── */}
      <View style={[styles.card, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange, shadowColor: Colors.glowColor }]}>
        <Text style={[styles.sectionTitle, { color: Colors.foreground }]}>Notifications</Text>
        {([
          ['notify_email', '✉️  Email alerts'],
          ['notify_sms',   '📱  SMS alerts'],
          ['notify_push',  '🔔  Push notifications'],
        ] as const).map(([key, label]) => (
          <View key={key} style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: Colors.text }]}>{label}</Text>
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

      {/* ── Switch side (dual accounts) ─────────────────────────── */}
      {!isGuest && dual && (effectiveRole === 'buyer' || effectiveRole === 'provider') && (() => {
        const target = effectiveRole === 'buyer' ? 'provider' : 'buyer';
        const currentLabel = effectiveRole === 'buyer' ? 'Buyer' : 'Seller';
        const targetLabel  = target === 'provider' ? 'Seller' : 'Buyer';
        return (
          <View style={[styles.card, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange, shadowColor: Colors.glowColor }]}>
            <Text style={[styles.sectionTitle, { color: Colors.foreground }]}>🔁  Switch Account</Text>
            <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 19, marginBottom: Spacing.md }}>
              You&apos;re in your {currentLabel} account. Switch to your {targetLabel} account instantly — balances and data stay completely separate.
            </Text>
            <Button
              label={switching ? 'Switching…' : `Switch to ${targetLabel} Account`}
              onPress={handleSwitchSide}
              loading={switching}
              fullWidth
            />
          </View>
        );
      })()}

      {/* ── Add the other side (single-role accounts only) ──────── */}
      {!isGuest && profile && (profile.can_buy ? !profile.can_sell : profile.can_sell) && (() => {
        const missing: 'buyer' | 'provider' = profile.can_buy ? 'provider' : 'buyer';
        const title = missing === 'provider' ? '🧰  Sell leads too' : '🎯  Buy leads too';
        const desc  = missing === 'provider'
          ? 'Add a seller side to submit and sell leads — kept completely separate from your buyer account.'
          : 'Add a buyer side to browse and buy leads — kept completely separate from your seller account.';
        return (
          <View style={[styles.card, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange, shadowColor: Colors.glowColor }]}>
            <Text style={[styles.sectionTitle, { color: Colors.foreground }]}>{title}</Text>
            <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 19, marginBottom: Spacing.md }}>{desc}</Text>
            {sideAdded ? (
              <View style={{ borderWidth: 1, borderColor: 'rgba(52,211,153,0.35)', backgroundColor: 'rgba(52,211,153,0.12)', borderRadius: Radius.md, padding: Spacing.md }}>
                <Text style={{ fontSize: FontSize.sm, color: '#34d399', lineHeight: 19 }}>
                  ✓ Your {missing === 'provider' ? 'seller' : 'buyer'} side is ready. Sign out and sign back in, then pick it at the account screen to finish setting it up.
                </Text>
              </View>
            ) : (
              <Button
                label={addingSide ? 'Adding…' : (missing === 'provider' ? 'Also sell leads' : 'Also buy leads')}
                onPress={() => handleAddOtherSide(missing)}
                loading={addingSide}
                fullWidth
              />
            )}
          </View>
        );
      })()}

      {/* ── Appearance ─────────────────────────────────────────── */}
      <View style={[styles.card, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange, shadowColor: Colors.glowColor }]}>
        <Text style={[styles.sectionTitle, { color: Colors.foreground }]}>🎨  Appearance</Text>
        <View style={styles.themeRow}>
          {([
            ['dark',        '🌙 Dark'],
            ['inner-light', '🌓 Inner Light'],
            ['light',       '☀️ Light'],
          ] as const).map(([m, label]) => (
            <TouchableOpacity
              key={m}
              style={[styles.themeBtn, { borderColor: Colors.border, backgroundColor: Colors.panel2 }, themeMode === m && styles.themeBtnActive]}
              onPress={() => setThemeMode(m)}
              activeOpacity={0.75}
            >
              <Text style={[styles.themeBtnText, { color: Colors.muted }, themeMode === m && styles.themeBtnTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Sentry test (TEST app only) — verify mobile errors reach Sentry ── */}
      {WEB_APP.includes('test.') && (
        <TouchableOpacity
          onPress={() => {
            Sentry.captureException(new Error('Mobile Sentry test — intentional (Account screen)'));
            Alert.alert('Sent to Sentry', 'A test error was sent. It should appear in the Sentry issues feed shortly (tagged "staging").');
          }}
          style={{ alignItems: 'center', paddingVertical: Spacing.sm, marginBottom: Spacing.sm }}
        >
          <Text style={{ fontSize: FontSize.xs, color: Colors.muted, textDecorationLine: 'underline' }}>
            🐞 Send a test error to Sentry
          </Text>
        </TouchableOpacity>
      )}

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
    borderWidth: 2,
    borderColor: Colors.borderOrange,
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.sm + 4,
    ...Shadow.card,
  },
  linkCard: {
    backgroundColor: Colors.panel,
    borderRadius: Radius.xl,
    borderWidth: 2,
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

  // ── Add credits ───────────────────────────────────────────────────────────
  creditCard: {
    backgroundColor: Colors.panel,
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderColor: Colors.borderOrange,
    padding: Spacing.md,
    marginBottom: Spacing.sm + 4,
    ...Shadow.card,
  },
  creditsHint: { fontSize: FontSize.xs, color: Colors.muted, lineHeight: 17 },
  creditRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  creditBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
    backgroundColor: 'rgba(129,140,248,0.10)',
  },
  creditBtnLoading: {
    opacity: 0.6,
  },
  creditBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.accent,
    fontVariant: ['tabular-nums'],
  },
  // Custom deposit amount (colors passed inline — theme-safe)
  customAmountWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  customAmountPrefix: {
    fontSize: FontSize.md,
    fontWeight: '700',
    marginRight: 4,
  },
  customAmountInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: FontSize.md,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  // ── Appearance ───────────────────────────────────────────────────────────
  themeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  themeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.panel2,
  },
  themeBtnActive: {
    borderColor: Colors.orange,
    backgroundColor: 'rgba(249,115,22,0.12)',
  },
  themeBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.muted,
  },
  themeBtnTextActive: {
    color: Colors.orange,
    fontWeight: '700',
  },

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
