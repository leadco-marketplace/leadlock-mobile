import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Linking, ScrollView,
} from 'react-native';
import { ScreenShell } from '@/components/ScreenShell';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  categoriesApi, areasApi, phoneVerifyApi, onboardingApi, walletApi,
  ServiceCategory, ServiceArea,
} from '@/lib/api';
import { Colors, Spacing, Radius, FontSize } from '@/theme';

/**
 * Buyer onboarding — mirrors the web /onboarding flow step-for-step:
 *   1. Your Profile   — name, company, phone + SMS verification
 *   2. Your Services  — pick service categories (grouped accordion)
 *   3. Service Areas  — search + select coverage areas
 *   4. Payment Setup  — summary, how payments work, optional starter deposit
 *
 * Saves via the same /api/onboarding/complete endpoint as the web, which
 * sets profiles.onboarding_complete=true and upserts contractor_preferences.
 * The AppNavigator gates buyers here until onboarding_complete is true.
 */

const STEPS = [
  { label: 'Profile',  icon: '👤' },
  { label: 'Services', icon: '🛠️' },
  { label: 'Areas',    icon: '📍' },
  { label: 'Payment',  icon: '💳' },
];

const GREEN = '#4ade80';

export function OnboardingScreen() {
  const { user, profile, refreshProfile } = useAuth();

  // Styles must be rebuilt when the theme changes: applyTheme() mutates the
  // Colors object, so a module-level StyleSheet.create would freeze whatever
  // theme was active at import time (dark) — causing dark cards + invisible
  // text in light mode.
  const { mode } = useTheme();
  const styles = useMemo(makeStyles, [mode]);

  const [step,  setStep]  = useState(0);
  const [error, setError] = useState<string | null>(null);

  // ── Step 1: profile ────────────────────────────────────────────────────
  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone,       setPhone]       = useState(profile?.phone ?? '');

  // Phone verification
  const [codeSent,        setCodeSent]        = useState(false);
  const [verifyInput,     setVerifyInput]     = useState('');
  const [phoneVerified,   setPhoneVerified]   = useState(false);
  const [codeSendLoading, setCodeSendLoading] = useState(false);
  const [verifyLoading,   setVerifyLoading]   = useState(false);
  const [phoneError,      setPhoneError]      = useState<string | null>(null);

  // ── Step 2: categories ─────────────────────────────────────────────────
  const [categories,   setCategories]   = useState<ServiceCategory[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [openGroups,   setOpenGroups]   = useState<Set<string>>(new Set(['Local Home Services']));

  // ── Step 3: areas ──────────────────────────────────────────────────────
  const [areas,         setAreas]         = useState<ServiceArea[]>([]);
  const [areaQuery,     setAreaQuery]     = useState('');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  // ── Step 4: save + payment ─────────────────────────────────────────────
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [buyingCents,  setBuyingCents]  = useState<number | null>(null);
  const [finishing,    setFinishing]    = useState(false);

  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(() => {});
    areasApi.getAll().then(setAreas).catch(() => {});
  }, []);

  const groupedCats = useMemo(() => {
    const map = new Map<string, ServiceCategory[]>();
    for (const c of categories) {
      const g = c.group_name ?? 'Other';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(c);
    }
    return Array.from(map.entries());
  }, [categories]);

  // Suggestions appear only while the user is typing — no full browse list.
  const areaSuggestions = useMemo(() => {
    const q = areaQuery.trim().toLowerCase();
    if (q.length === 0) return [];
    return areas
      .filter(a => !selectedAreas.includes(a.name) && a.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 25);
  }, [areas, areaQuery, selectedAreas]);

  // ── Phone helpers ──────────────────────────────────────────────────────
  function handlePhoneChange(val: string) {
    setPhone(val);
    if (phoneVerified || codeSent) {
      setPhoneVerified(false);
      setCodeSent(false);
      setVerifyInput('');
      setPhoneError(null);
    }
  }

  async function sendCode() {
    if (!phone.trim()) { setPhoneError('Enter your phone number first.'); return; }
    setCodeSendLoading(true);
    setPhoneError(null);
    try {
      await phoneVerifyApi.sendCode(phone.trim());
      setCodeSent(true);
    } catch (e: any) {
      setPhoneError(e.message ?? 'Failed to send code. Check the number and try again.');
    } finally {
      setCodeSendLoading(false);
    }
  }

  async function verifyPhone() {
    if (!verifyInput.trim()) return;
    setVerifyLoading(true);
    setPhoneError(null);
    try {
      await phoneVerifyApi.verifyCode(verifyInput.trim());
      setPhoneVerified(true);
      setCodeSent(false);
    } catch (e: any) {
      setPhoneError(e.message ?? 'Incorrect code.');
    } finally {
      setVerifyLoading(false);
    }
  }

  // ── Save (called before step 4, same as web) ───────────────────────────
  async function saveProfileAndPrefs(): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const picked = areas.filter(a => selectedAreas.includes(a.name));
      await onboardingApi.complete({
        firstName:         firstName.trim(),
        lastName:          lastName.trim(),
        companyName:       companyName.trim(),
        phone:             phone.trim(),
        serviceCategories: selectedCats,
        states:            [...new Set(picked.map(a => a.state).filter(Boolean))],
        cities:            [...new Set(picked.map(a => a.city).filter(Boolean))],
        areaNames:         picked.map(a => a.name),
        areaIds:           picked.map(a => a.id),
      });
      setSaved(true);
      return true;
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong saving your profile.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  // ── Step navigation (same validation as web) ───────────────────────────
  function validateStep(): string | null {
    if (step === 0) {
      if (!firstName.trim() || !lastName.trim()) return 'Please enter your first and last name.';
      if (!phone.trim())    return 'Please enter your phone number.';
      if (!phoneVerified)   return 'Please verify your phone number before continuing.';
    }
    if (step === 1 && selectedCats.length === 0) return 'Please select at least one service category.';
    if (step === 2 && selectedAreas.length === 0) return 'Please select at least one service area.';
    return null;
  }

  async function goNext() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    if (step === 2) {
      const ok = await saveProfileAndPrefs();
      if (!ok) return;
    }
    setStep(s => s + 1);
  }

  function goBack() { setError(null); setStep(s => s - 1); }

  // ── Step 4 actions ─────────────────────────────────────────────────────
  async function finish() {
    setFinishing(true);
    // refreshProfile picks up onboarding_complete=true → AppNavigator lifts the gate
    await refreshProfile();
    setFinishing(false);
  }

  async function addFunds(amountCents: number) {
    setBuyingCents(amountCents);
    try {
      const { checkoutUrl } = await walletApi.depositCheckout(amountCents);
      // Lift the gate first so the leadco:// return deep-link lands on Account
      await refreshProfile();
      await Linking.openURL(checkoutUrl);
    } catch (e: any) {
      setError(e.message ?? 'Could not open checkout. You can add funds later from Account.');
    } finally {
      setBuyingCents(null);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <ScreenShell title="Welcome" subtitle="Set up your account to start getting leads" scrollable>
      {/* Step bar */}
      <View style={styles.stepBar}>
        {STEPS.map((s, i) => (
          <View key={i} style={styles.stepItem}>
            <View style={[
              styles.stepDot,
              i < step ? styles.stepDone : i === step ? styles.stepCurrent : styles.stepFuture,
            ]}>
              <Text style={[styles.stepDotText, i <= step && { color: i < step ? '#fff' : Colors.orange }]}>
                {i < step ? '✓' : i + 1}
              </Text>
            </View>
            <Text style={[styles.stepLabel, i > step && { opacity: 0.4 }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Step 0: Profile ─────────────────────────────────────────── */}
      {step === 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Profile</Text>
          <Text style={styles.cardHint}>This info will be visible to homeowners after you unlock a lead.</Text>
          <Text style={styles.cardHint}>Use your real name — payouts and account verification can only be completed for a matching verified identity.</Text>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="First name *" value={firstName} onChangeText={setFirstName} placeholder="John" autoCapitalize="words" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Last name *" value={lastName} onChangeText={setLastName} placeholder="Smith" autoCapitalize="words" />
            </View>
          </View>

          <Input label="Company name" value={companyName} onChangeText={setCompanyName} placeholder="Smith Plumbing LLC" autoCapitalize="words" />

          <View>
            <Text style={styles.fieldLabel}>EMAIL (CANNOT CHANGE)</Text>
            <View style={styles.disabledField}><Text style={styles.disabledText}>{user?.email ?? profile?.email ?? ''}</Text></View>
          </View>

          {/* Phone + verification */}
          <View style={{ gap: Spacing.sm }}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Phone number *"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  placeholder="(555) 000-0000"
                  keyboardType="phone-pad"
                  editable={!phoneVerified}
                />
              </View>
              {phoneVerified ? (
                <View style={styles.verifiedBadge}>
                  <Text style={{ color: GREEN, fontWeight: '700', fontSize: FontSize.sm }}>✓ Verified</Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={sendCode}
                  disabled={codeSendLoading || !phone.trim()}
                  style={[styles.sendCodeBtn, (codeSendLoading || !phone.trim()) && { opacity: 0.4 }]}
                >
                  <Text style={styles.sendCodeText}>
                    {codeSendLoading ? 'Sending…' : codeSent ? 'Resend' : 'Send Code'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {codeSent && !phoneVerified && (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    value={verifyInput}
                    onChangeText={v => setVerifyInput(v.replace(/\D/g, ''))}
                    placeholder="6-digit code"
                    placeholderTextColor={Colors.placeholder}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={styles.codeInput}
                  />
                </View>
                <TouchableOpacity
                  onPress={verifyPhone}
                  disabled={verifyLoading || verifyInput.length < 6}
                  style={[styles.verifyBtn, (verifyLoading || verifyInput.length < 6) && { opacity: 0.4 }]}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: FontSize.sm }}>
                    {verifyLoading ? 'Verifying…' : 'Verify'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {phoneError && <Text style={styles.errorSmall}>{phoneError}</Text>}
            {codeSent && !phoneVerified && (
              <Text style={styles.cardHint}>Check your texts — a 6-digit code was sent to {phone}.</Text>
            )}
            {!codeSent && !phoneVerified && (
              <Text style={styles.cardHint}>We&apos;ll text a verification code. Used for call-connect — never shown publicly.</Text>
            )}
          </View>
        </View>
      )}

      {/* ── Step 1: Services ────────────────────────────────────────── */}
      {step === 1 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your trade(s)</Text>
          <Text style={styles.cardHint}>
            Select every service you offer. You&apos;ll only be notified about leads matching these.
            {selectedCats.length > 0 && <Text style={{ color: Colors.orange, fontWeight: '600' }}> {selectedCats.length} selected</Text>}
          </Text>

          {groupedCats.map(([group, cats]) => {
            const open = openGroups.has(group);
            const groupSel = cats.filter(c => selectedCats.includes(c.name)).length;
            return (
              <View key={group} style={styles.groupBox}>
                <TouchableOpacity
                  style={styles.groupHeader}
                  onPress={() => setOpenGroups(p => {
                    const n = new Set(p); n.has(group) ? n.delete(group) : n.add(group); return n;
                  })}
                >
                  <Text style={styles.groupTitle}>{group}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {groupSel > 0 && (
                      <View style={styles.countBadge}><Text style={styles.countBadgeText}>{groupSel}</Text></View>
                    )}
                    <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>{open ? '▲' : '▼'}</Text>
                  </View>
                </TouchableOpacity>
                {open && (
                  <View style={styles.chipWrap}>
                    {cats.map(cat => {
                      const sel = selectedCats.includes(cat.name);
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          onPress={() => setSelectedCats(p =>
                            p.includes(cat.name) ? p.filter(c => c !== cat.name) : [...p, cat.name]
                          )}
                          style={[styles.chip, sel && styles.chipSelected]}
                        >
                          <Text style={[styles.chipText, sel && { color: '#fff' }]}>{cat.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* ── Step 2: Areas ───────────────────────────────────────────── */}
      {step === 2 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Service Areas</Text>
          <Text style={styles.cardHint}>
            Search and add every area you cover. You&apos;ll get notified when a lead drops there.
            {selectedAreas.length > 0 && <Text style={{ color: Colors.orange, fontWeight: '600' }}> {selectedAreas.length} selected</Text>}
          </Text>

          {selectedAreas.length > 0 && (
            <View style={styles.pillWrap}>
              {selectedAreas.map(name => (
                <TouchableOpacity
                  key={name}
                  style={styles.areaPill}
                  onPress={() => setSelectedAreas(p => p.filter(n => n !== name))}
                >
                  <Text style={styles.areaPillText}>{name}  ×</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TextInput
            value={areaQuery}
            onChangeText={setAreaQuery}
            placeholder={selectedAreas.length === 0 ? 'Search for an area, e.g. Miami, Brooklyn…' : 'Add another area…'}
            placeholderTextColor={Colors.placeholder}
            style={styles.codeInput}
            autoCorrect={false}
          />

          {areaQuery.trim().length > 0 && (
            <ScrollView style={styles.suggestionBox} nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {areaSuggestions.length === 0 && (
                <Text style={[styles.cardHint, { padding: Spacing.md }]}>
                  No areas matching &quot;{areaQuery}&quot;
                </Text>
              )}
              {areaSuggestions.map(a => (
                <TouchableOpacity
                  key={a.id}
                  style={styles.suggestionRow}
                  onPress={() => { setSelectedAreas(p => [...p, a.name]); setAreaQuery(''); }}
                >
                  <Text style={{ color: Colors.foreground, fontSize: FontSize.sm }}>{a.name}</Text>
                  <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>{a.state}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {selectedAreas.length === 0 && areaQuery.trim().length === 0 && (
            <Text style={styles.cardHint}>Start typing above to find your areas.</Text>
          )}
        </View>
      )}

      {/* ── Step 3: Payment ─────────────────────────────────────────── */}
      {step === 3 && saved && (
        <View style={{ gap: Spacing.md }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎉 You&apos;re all set, {firstName}!</Text>
            <Text style={styles.cardHint}>Profile saved. One last step — set up payments so you can unlock leads.</Text>
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Services</Text>
                <Text style={styles.summaryValue}>{selectedCats.length} selected</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service Areas</Text>
                <Text style={styles.summaryValue}>{selectedAreas.length} selected</Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.summaryLabel}>Phone</Text>
                <Text style={styles.summaryValue}>{phone}</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>How Payments Work</Text>
            {[
              { icon: '👁️', title: 'Browse leads for free', desc: 'See all active leads in your areas — category, job type, and general location are always visible.' },
              { icon: '🔒', title: 'Pay to unlock contact info', desc: "When you find a lead you want, pay a flat fee to reveal the customer's name, phone, and address." },
              { icon: '📞', title: 'Call through our platform', desc: 'All calls are routed through LeadCo Marketplace so quality and disputes can be verified.' },
            ].map(item => (
              <View key={item.title} style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
                <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.foreground, fontSize: FontSize.sm, fontWeight: '600' }}>{item.title}</Text>
                  <Text style={styles.cardHint}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add starter funds <Text style={{ color: Colors.muted, fontWeight: '400' }}>(optional)</Text></Text>
            <Text style={styles.cardHint}>Load your account so you&apos;re ready to unlock leads the moment you find one. Credits never expire.</Text>
            <View style={[styles.row, { marginTop: Spacing.sm }]}>
              {[2500, 5000, 10000].map(cents => (
                <TouchableOpacity
                  key={cents}
                  onPress={() => addFunds(cents)}
                  disabled={buyingCents !== null}
                  style={[styles.fundBtn, buyingCents === cents && { opacity: 0.6 }]}
                >
                  <Text style={styles.fundBtnText}>{buyingCents === cents ? '…' : `$${cents / 100}`}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button
            label={finishing ? 'Loading…' : 'Start Browsing Leads →'}
            onPress={finish}
            loading={finishing}
            fullWidth
          />
        </View>
      )}

      {/* ── Error + navigation ──────────────────────────────────────── */}
      {error && <Text style={styles.errorBox}>{error}</Text>}

      {step < 3 && (
        <View style={[styles.row, { marginTop: Spacing.md, marginBottom: Spacing.xl }]}>
          {step > 0
            ? <View style={{ flex: 1 }}><Button label="← Back" variant="secondary" onPress={goBack} fullWidth /></View>
            : <View style={{ flex: 1 }} />}
          <View style={{ flex: 1 }}>
            <Button
              label={step === 2 ? (saving ? 'Saving…' : 'Save & Continue →') : 'Continue →'}
              onPress={goNext}
              loading={saving}
              fullWidth
            />
          </View>
        </View>
      )}
    </ScreenShell>
  );
}

const makeStyles = () => StyleSheet.create({
  stepBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  stepItem:   { alignItems: 'center', gap: 4, flex: 1 },
  stepDot:    {
    width: 30, height: 30, borderRadius: 15, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDone:    { backgroundColor: Colors.orange, borderColor: Colors.orange },
  stepCurrent: { borderColor: Colors.orange, backgroundColor: 'transparent' },
  stepFuture:  { borderColor: Colors.border2, opacity: 0.5 },
  stepDotText: { color: Colors.muted, fontSize: FontSize.sm, fontWeight: '700' },
  stepLabel:   { color: Colors.muted, fontSize: FontSize.xs },

  card: {
    backgroundColor: Colors.panel,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border2,
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardTitle: { color: Colors.foreground, fontSize: FontSize.md, fontWeight: '700' },
  cardHint:  { color: Colors.muted, fontSize: FontSize.xs, lineHeight: 16 },

  row: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-end' },

  fieldLabel: {
    fontSize: FontSize.xs, color: Colors.muted, fontWeight: '500',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  },
  disabledField: {
    backgroundColor: Colors.panel2, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4,
    opacity: 0.55,
  },
  disabledText: { color: Colors.foreground, fontSize: FontSize.base },

  sendCodeBtn: {
    borderWidth: 1, borderColor: Colors.orange, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 6,
  },
  sendCodeText: { color: Colors.orange, fontSize: FontSize.xs, fontWeight: '700' },
  verifiedBadge: { paddingVertical: Spacing.sm + 6, paddingHorizontal: Spacing.sm },
  verifyBtn: {
    backgroundColor: Colors.orange, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 6,
  },
  codeInput: {
    backgroundColor: Colors.panel2, borderRadius: Radius.md, borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.28)', paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4, fontSize: FontSize.base, color: Colors.foreground,
  },
  errorSmall: { color: Colors.danger, fontSize: FontSize.xs },
  errorBox: {
    color: Colors.danger, fontSize: FontSize.sm,
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.4)', backgroundColor: 'rgba(127,29,29,0.2)',
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },

  groupBox: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, overflow: 'hidden' },
  groupHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.panel2, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
  },
  groupTitle: { color: Colors.foreground, fontSize: FontSize.xs, fontWeight: '700' },
  countBadge: {
    backgroundColor: Colors.orange, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 1,
  },
  countBadgeText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: Spacing.sm + 2 },
  chip: {
    borderWidth: 1, borderColor: Colors.border2, borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm + 4, paddingVertical: 6,
  },
  chipSelected: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  chipText: { color: Colors.muted, fontSize: FontSize.xs, fontWeight: '500' },

  pillWrap: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    backgroundColor: Colors.panel2, padding: Spacing.sm,
  },
  areaPill: {
    backgroundColor: 'rgba(59,130,246,0.20)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.40)',
    borderRadius: Radius.full, paddingHorizontal: Spacing.sm + 4, paddingVertical: 5,
  },
  areaPillText: { color: Colors.orange, fontSize: FontSize.xs, fontWeight: '600' },
  suggestionBox: {
    maxHeight: 260, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    backgroundColor: Colors.panel2,
  },
  suggestionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },

  summaryBox: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    backgroundColor: Colors.panel2,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  summaryLabel: { color: Colors.muted, fontSize: FontSize.sm },
  summaryValue: { color: Colors.foreground, fontSize: FontSize.sm, fontWeight: '600' },

  fundBtn: {
    flex: 1, borderWidth: 1, borderColor: Colors.border2, borderRadius: Radius.md,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  fundBtnText: { color: Colors.foreground, fontSize: FontSize.md, fontWeight: '700' },
});
