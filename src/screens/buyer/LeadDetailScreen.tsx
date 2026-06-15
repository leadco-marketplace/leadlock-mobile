import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { leadsApi, rateApi, signalsApi, PurchasedLead, RatingThumb, LeadSignal, THUMBS_UP_REASONS, THUMBS_DOWN_REASONS } from '@/lib/api';
import { ScreenShell } from '@/components/ScreenShell';
import { Colors, FontSize, Spacing, Radius, Shadow } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import { Linking, Alert } from 'react-native';

const BASE = (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://leadcomarketplace.com';

type LeadDetailRouteParams = { leadId: string; purchaseId?: string };

// ── Helpers ────────────────────────────────────────────────────────────────

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatPhone(e164: string): string {
  const d = e164.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) {
    return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  }
  return e164;
}

/** snake_case → Title Case */
function labelify(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Call panel ─────────────────────────────────────────────────────────────

interface PinData {
  dialIn: string;
  pin: string;
  expiresAt: string;
  pinId: string;
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

function CallPanel({ purchaseId }: { purchaseId: string }) {
  useTheme(); // re-render on theme change so inline Colors.* picks up new values
  const [pinData, setPinData] = useState<PinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  async function fetchPin() {
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res  = await fetch(`${BASE}/api/call/prepare`, {
        method: 'POST', headers,
        body: JSON.stringify({ purchaseId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to load extension');
      setPinData(body as PinData);
    } catch (e: any) {
      setError(e.message ?? 'Could not load call extension');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPin(); }, [purchaseId]);

  if (loading) {
    return (
      <View style={[callStyles.box, { backgroundColor: Colors.panel2 }]}>
        <ActivityIndicator color={Colors.accent} size="small" />
        <Text style={[callStyles.loadingText, { color: Colors.muted }]}>Loading your extension…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[callStyles.box, { backgroundColor: Colors.panel2 }]}>
        <Text style={callStyles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity onPress={fetchPin} style={callStyles.retryBtn}>
          <Text style={callStyles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!pinData) return null;

  return (
    <View style={[callStyles.box, { backgroundColor: Colors.panel2 }]}>
      <Text style={[callStyles.sectionLabel, { color: Colors.accent }]}>📞  CALL CUSTOMER</Text>
      <View style={callStyles.pinRow}>
        <View style={callStyles.pinBlock}>
          <Text style={[callStyles.pinLabel, { color: Colors.muted }]}>DIAL-IN NUMBER</Text>
          <Text style={[callStyles.dialIn, { color: Colors.foreground }]}>{formatPhone(pinData.dialIn)}</Text>
        </View>
        <View style={callStyles.divider} />
        <View style={callStyles.pinBlock}>
          <Text style={[callStyles.pinLabel, { color: Colors.muted }]}>YOUR EXTENSION</Text>
          <Text style={[callStyles.pin, { color: Colors.accent }]}>{pinData.pin}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={callStyles.callBtn}
        onPress={() => Linking.openURL(`tel:${pinData.dialIn}`)}
        activeOpacity={0.8}
      >
        <Text style={callStyles.callBtnText}>📞  Call Customer Now</Text>
      </TouchableOpacity>
      <Text style={[callStyles.hint, { color: Colors.muted }]}>
        Call the number above, then enter extension{' '}
        <Text style={{ fontWeight: '700', color: Colors.accent }}>{pinData.pin}</Text> when prompted.
      </Text>
      <TouchableOpacity onPress={fetchPin}>
        <Text style={[callStyles.refreshText, { color: Colors.muted }]}>↻ Get a new extension</Text>
      </TouchableOpacity>
    </View>
  );
}

const callStyles = StyleSheet.create({
  box: {
    backgroundColor: Colors.panel2,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.30)',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    alignSelf: 'stretch',
  },
  pinBlock: { flex: 1, gap: 2 },
  divider: { width: 1, height: 44, backgroundColor: 'rgba(129,140,248,0.25)' },
  pinLabel: {
    fontSize: FontSize.xs - 2,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.muted,
    textTransform: 'uppercase',
  },
  dialIn: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.foreground,
    fontVariant: ['tabular-nums'],
  },
  pin: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 6,
    fontVariant: ['tabular-nums'],
  },
  callBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.lg,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  callBtnText: { fontSize: FontSize.base, fontWeight: '700', color: '#fff' },
  hint: { fontSize: FontSize.xs, color: Colors.muted, lineHeight: 17 },
  refreshText: { fontSize: FontSize.xs, color: Colors.muted, textDecorationLine: 'underline' },
  loadingText: { fontSize: FontSize.sm, color: Colors.muted },
  errorText: { fontSize: FontSize.sm, color: Colors.danger },
  retryBtn: {
    paddingVertical: 4, paddingHorizontal: 12,
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.accent,
  },
  retryText: { fontSize: FontSize.xs, color: Colors.accent, fontWeight: '600' },
});

// ── Signal panel ───────────────────────────────────────────────────────────
// Lets the buyer report a call issue (no_answer / wrong_number) and see the
// provider's structured response. No free text — buttons only.

const SIGNAL_RESPONSE_TEXT: Record<string, string> = {
  verifying:          "Provider is verifying the contact info — check back soon",
  number_correct:     "Number is confirmed correct — try calling again",
  customer_available: "Customer is now available — call them now!",
  info_updated:       "Provider has updated the lead contact info — try calling again",
};

function SignalPanel({ purchaseId }: { purchaseId: string }) {
  useTheme();
  const [existing,   setExisting]   = useState<LeadSignal | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);

  useEffect(() => {
    signalsApi.getForPurchase(purchaseId)
      .then(list => { if (list.length > 0) setExisting(list[0]); })
      .catch(() => {})
      .finally(() => setLoadedOnce(true));
  }, [purchaseId]);

  async function sendSignal(signalType: 'no_answer' | 'wrong_number') {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await signalsApi.create({ purchase_id: purchaseId, signal_type: signalType });
      setExisting(result);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not send signal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Don't render until we've checked — avoids layout flash
  if (!loadedOnce) return null;

  return (
    <View style={[signalStyles.box, { backgroundColor: Colors.panel }]}>
      <Text style={[signalStyles.title, { color: Colors.accent }]}>
        📵  REPORT A CALL ISSUE
      </Text>

      {!existing ? (
        /* ── No signal sent yet — show two buttons ── */
        <>
          <Text style={[signalStyles.prompt, { color: Colors.muted }]}>
            Did you have trouble reaching this customer?
          </Text>
          <View style={signalStyles.btnRow}>
            <TouchableOpacity
              style={[signalStyles.signalBtn, { borderColor: 'rgba(251,191,36,0.4)' }]}
              onPress={() => sendSignal('no_answer')}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <Text style={signalStyles.btnIcon}>📵</Text>
              <Text style={[signalStyles.btnLabel, { color: Colors.foreground }]}>
                Customer didn't answer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[signalStyles.signalBtn, { borderColor: 'rgba(248,113,113,0.4)' }]}
              onPress={() => sendSignal('wrong_number')}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <Text style={signalStyles.btnIcon}>❌</Text>
              <Text style={[signalStyles.btnLabel, { color: Colors.danger }]}>
                Wrong number
              </Text>
            </TouchableOpacity>
          </View>
          {submitting && (
            <ActivityIndicator color={Colors.accent} style={{ marginTop: 4 }} />
          )}
        </>
      ) : existing.provider_response ? (
        /* ── Provider has responded ── */
        <View style={[signalStyles.responseBox, { backgroundColor: Colors.panel2 }]}>
          <Text style={[signalStyles.responseTitle, { color: '#4ade80' }]}>
            ✓ Provider responded
          </Text>
          <Text style={[signalStyles.responseBody, { color: Colors.foreground }]}>
            {SIGNAL_RESPONSE_TEXT[existing.provider_response] ?? existing.provider_response}
          </Text>
          {existing.responded_at && (
            <Text style={[signalStyles.responseDate, { color: Colors.muted }]}>
              {new Date(existing.responded_at).toLocaleDateString()}
            </Text>
          )}
        </View>
      ) : (
        /* ── Signal sent — awaiting provider response ── */
        <View style={[signalStyles.pendingBox, { backgroundColor: Colors.panel2 }]}>
          <Text style={[signalStyles.pendingLabel, { color: Colors.textSecondary }]}>
            {existing.signal_type === 'no_answer'
              ? '📵  Customer didn't answer — reported'
              : '❌  Wrong number — reported'}
          </Text>
          <Text style={[signalStyles.pendingSub, { color: Colors.muted }]}>
            Provider has been notified via push, SMS, and email. Waiting for their response…
          </Text>
        </View>
      )}
    </View>
  );
}

const signalStyles = StyleSheet.create({
  box: {
    borderRadius:  Radius.lg,
    borderWidth:   1,
    borderColor:   'rgba(129,140,248,0.25)',
    padding:       Spacing.md,
    gap:           Spacing.sm,
    ...Shadow.card,
  },
  title:    { fontSize: FontSize.sm, fontWeight: '700', letterSpacing: 0.5 },
  prompt:   { fontSize: FontSize.xs },
  btnRow:   { flexDirection: 'row', gap: Spacing.sm },
  signalBtn: {
    flex:             1,
    alignItems:       'center',
    justifyContent:   'center',
    gap:              4,
    paddingVertical:  12,
    borderRadius:     Radius.md,
    borderWidth:      0.5,
    backgroundColor:  'rgba(255,255,255,0.03)',
  },
  btnIcon:    { fontSize: 20 },
  btnLabel:   { fontSize: FontSize.xs, textAlign: 'center', lineHeight: 16, marginTop: 2 },
  responseBox: {
    borderRadius: Radius.md,
    padding:      Spacing.sm,
    gap:          4,
  },
  responseTitle: { fontSize: FontSize.sm, fontWeight: '600' },
  responseBody:  { fontSize: FontSize.sm, lineHeight: 20 },
  responseDate:  { fontSize: FontSize.xs },
  pendingBox: {
    borderRadius: Radius.md,
    padding:      Spacing.sm,
    gap:          4,
  },
  pendingLabel: { fontSize: FontSize.sm, fontWeight: '600' },
  pendingSub:   { fontSize: FontSize.xs, lineHeight: 18 },
});

// ── Rating panel ───────────────────────────────────────────────────────────

function RatingPanel({ leadId }: { leadId: string }) {
  useTheme(); // re-render on theme change so inline Colors.* picks up new values
  const [thumb,      setThumb]      = useState<RatingThumb | null>(null);
  const [reasonCode, setReasonCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const reasons = thumb === 'up' ? THUMBS_UP_REASONS : thumb === 'down' ? THUMBS_DOWN_REASONS : [];

  async function submitRating() {
    if (!thumb || !reasonCode) return;
    setSubmitting(true);
    setError(null);
    try {
      await rateApi.submit({ leadId, thumb, reasonCode });
      setSubmitted(true);
    } catch (e: any) {
      if (e.message === 'already_rated') {
        setSubmitted(true);
      } else {
        setError(e.message ?? 'Could not submit rating. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <View style={[ratingStyles.box, { backgroundColor: Colors.panel }]}>
        <Text style={[ratingStyles.title, { color: Colors.foreground }]}>⭐  Lead Rated</Text>
        <Text style={[ratingStyles.submitted, { color: Colors.accent }]}>Thanks for your feedback!</Text>
      </View>
    );
  }

  return (
    <View style={[ratingStyles.box, { backgroundColor: Colors.panel }]}>
      <Text style={[ratingStyles.title, { color: Colors.foreground }]}>Rate This Lead</Text>
      <Text style={[ratingStyles.subtitle, { color: Colors.muted }]}>How did it go?</Text>

      {/* Thumbs row */}
      <View style={ratingStyles.thumbRow}>
        <TouchableOpacity
          style={[ratingStyles.thumbBtn, { borderColor: Colors.border, backgroundColor: Colors.panel2 }, thumb === 'up' && ratingStyles.thumbBtnActiveUp]}
          onPress={() => { setThumb('up'); setReasonCode(null); }}
          activeOpacity={0.8}
        >
          <Text style={ratingStyles.thumbEmoji}>👍</Text>
          <Text style={[ratingStyles.thumbLabel, { color: Colors.muted }, thumb === 'up' && ratingStyles.thumbLabelActive]}>Good Lead</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[ratingStyles.thumbBtn, { borderColor: Colors.border, backgroundColor: Colors.panel2 }, thumb === 'down' && ratingStyles.thumbBtnActiveDown]}
          onPress={() => { setThumb('down'); setReasonCode(null); }}
          activeOpacity={0.8}
        >
          <Text style={ratingStyles.thumbEmoji}>👎</Text>
          <Text style={[ratingStyles.thumbLabel, { color: Colors.muted }, thumb === 'down' && ratingStyles.thumbLabelActiveDown]}>Issue</Text>
        </TouchableOpacity>
      </View>

      {/* Reason codes */}
      {thumb && (
        <View style={ratingStyles.reasonsWrap}>
          <Text style={ratingStyles.reasonTitle}>Select a reason:</Text>
          {(reasons as readonly { code: string; label: string }[]).map((r) => (
            <TouchableOpacity
              key={r.code}
              style={[ratingStyles.reasonRow, reasonCode === r.code && ratingStyles.reasonRowActive]}
              onPress={() => setReasonCode(r.code)}
              activeOpacity={0.75}
            >
              <View style={[ratingStyles.radioCircle, reasonCode === r.code && ratingStyles.radioCircleActive]} />
              <Text style={[ratingStyles.reasonLabel, reasonCode === r.code && ratingStyles.reasonLabelActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {error && <Text style={ratingStyles.errorText}>{error}</Text>}

      {/* Submit */}
      {thumb && reasonCode && (
        <TouchableOpacity
          style={[ratingStyles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={submitRating}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <Text style={ratingStyles.submitBtnText}>
            {submitting ? 'Submitting…' : 'Submit Rating'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const ratingStyles = StyleSheet.create({
  box: {
    backgroundColor: Colors.panel,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.foreground,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    marginTop: -4,
  },
  submitted: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: '600',
  },
  thumbRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  thumbBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.panel2,
  },
  thumbBtnActiveUp: {
    borderColor: '#4ade80',
    backgroundColor: 'rgba(74,222,128,0.10)',
  },
  thumbBtnActiveDown: {
    borderColor: Colors.danger,
    backgroundColor: 'rgba(248,113,113,0.10)',
  },
  thumbEmoji: { fontSize: 20 },
  thumbLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.muted },
  thumbLabelActive: { color: '#4ade80' },
  thumbLabelActiveDown: { color: Colors.danger },
  reasonsWrap: { gap: 6 },
  reasonTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reasonRowActive: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(129,140,248,0.10)',
  },
  radioCircle: {
    width: 16, height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.muted,
  },
  radioCircleActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent,
  },
  reasonLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
  reasonLabelActive: { color: Colors.foreground, fontWeight: '600' },
  errorText: { fontSize: FontSize.xs, color: Colors.danger },
  submitBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },
});

// ── Main screen ────────────────────────────────────────────────────────────

export function LeadDetailScreen() {
  useTheme(); // re-render on theme change so inline Colors.* picks up new values
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ LeadDetail: LeadDetailRouteParams }, 'LeadDetail'>>();
  const { leadId, purchaseId } = route.params;

  const [lead,    setLead]    = useState<PurchasedLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  async function loadLead() {
    setLoading(true);
    setError(null);

    try {
      if (purchaseId) {
        // Retry direct lookup — the purchase row may not be visible on the DB
        // replica immediately after the unlock transaction commits.
        const MAX_DIRECT = 8;   // up to ~3.5 s (first attempt instant, then 7 × 500 ms)
        const DIRECT_MS  = 500;

        for (let i = 0; i < MAX_DIRECT; i++) {
          if (i > 0) await new Promise<void>((res) => setTimeout(res, DIRECT_MS));
          const results = await leadsApi.getPurchaseByPurchaseId(purchaseId);
          // Match by leadId first; fall back to purchaseId as a bulletproof
          // secondary check. Never use results[0] without validation — if the
          // server filter is bypassed and returns all purchases, results[0] would
          // be a different (wrong) lead.
          const found =
            results.find((r) => r.id === leadId) ??
            results.find((r) => r.purchase_id === purchaseId) ??
            null;
          if (found) {
            setLead(found);
            setLoading(false);
            return;
          }
          // No validated match — purchase not yet visible, keep retrying.
        }
        // Direct lookup exhausted — fall through to scan-all below.
      }

      // Fallback: scan all purchased leads.
      // Used from My Leads tab (no purchaseId), or extreme DB propagation delay.
      const MAX_SCAN = 10;
      const SCAN_MS  = 500;

      async function fetchWithRetry(attempt: number) {
        try {
          const leads = await leadsApi.getPurchased();
          const found = leads.find((l) => l.id === leadId);
          if (found) {
            setLead(found);
            setLoading(false);
            return;
          }
          if (attempt < MAX_SCAN) {
            setTimeout(() => fetchWithRetry(attempt + 1), SCAN_MS);
          } else {
            setError('unlock_not_found');
            setLoading(false);
          }
        } catch (e: any) {
          setError(e.message ?? 'Failed to load lead');
          setLoading(false);
        }
      }

      fetchWithRetry(0);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load lead');
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLead();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, purchaseId]);

  // When this screen was opened after a fresh purchase (purchaseId is set),
  // intercept ANY back navigation — including iOS swipe-back gesture — and
  // navigate explicitly to My Leads with awaitPurchaseId.  Without this, a
  // swipe-back would call goBack() internally (returning to LiveFeed), and if
  // the user then taps the My Leads tab, the tab was already focused so React
  // Navigation won't fire useFocusEffect, meaning the tab won't reload.
  useEffect(() => {
    if (!purchaseId) return; // only needed for fresh purchases
    const unsub = navigation.addListener('beforeRemove', (_e: any) => {
      // Allow the default back action to proceed (we don't prevent it)
      // but also navigate to My Leads so it reloads with the new purchase.
      // We schedule this after the current action completes so navigation
      // state is consistent.
      setTimeout(() => {
        navigation.navigate('BuyerTabs' as never, {
          screen: 'MyLeads',
          params: { awaitPurchaseId: purchaseId },
        } as never);
      }, 50);
    });
    return unsub;
  }, [navigation, purchaseId]);

  if (loading) {
    return (
      <ScreenShell scrollable={false}>
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.orange} size="large" />
        </View>
      </ScreenShell>
    );
  }

  if (error || !lead) {
    const isNotFound = error === 'unlock_not_found';
    return (
      <ScreenShell scrollable={false}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {isNotFound
              ? "Could not load lead details.\nTap Retry — it usually loads in a moment."
              : (error ?? 'Lead not found.')}
          </Text>
          {/* Retry button — most failures are transient DB propagation delays */}
          <TouchableOpacity onPress={loadLead} style={styles.retryBtn} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>↻ Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => isNotFound
              ? navigation.navigate('LiveFeed' as never)
              : navigation.goBack()
            }
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>
              {isNotFound ? '→ Go to Live Feed' : '← Go Back'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenShell>
    );
  }

  // Internal system fields that should never be shown to buyers
  const INTERNAL_META_KEYS = new Set([
    'area_id', 'area_ids', 'decay_enabled', 'nationwide',
  ]);

  // Parse metadata fields — skip nulls, blanks, and internal keys
  const metaEntries = lead.metadata
    ? Object.entries(lead.metadata).filter(
        ([k, v]) => v !== null && v !== '' && v !== undefined && !INTERNAL_META_KEYS.has(k)
      )
    : [];

  const price = lead.buyer_price_cents || Math.round(lead.price_cents * 1.125);

  // When this screen was opened after a fresh purchase (purchaseId is set),
  // pressing back should navigate explicitly to the My Leads tab rather than
  // just calling goBack().  goBack() returns focus to whichever tab was last
  // active which may already be My Leads — if it is, React Navigation won't
  // fire a new focus event and useFocusEffect silently skips the reload.
  // Passing awaitPurchaseId triggers a silent polling loop in MyLeadsScreen
  // that retries every 500 ms until the specific purchase row is visible.
  function handleBack() {
    if (purchaseId) {
      navigation.navigate('BuyerTabs', {
        screen: 'MyLeads',
        params: { awaitPurchaseId: purchaseId },
      });
    } else {
      navigation.goBack();
    }
  }

  return (
    <ScreenShell scrollable={false}>
      {/* ── Back button ─────────────────────────────────── */}
      <TouchableOpacity onPress={handleBack} style={styles.backRow} activeOpacity={0.7}>
        <Text style={styles.backArrow}>←</Text>
        <Text style={styles.backLabel}>{purchaseId ? 'My Leads' : 'Back'}</Text>
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: Spacing.md, paddingBottom: Spacing.xxl }}
      >
        {/* ── Header card ─────────────────────────────── */}
        <View style={[styles.headerCard, { backgroundColor: Colors.panel }]}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.category, { color: Colors.foreground }]}>{lead.service_category}</Text>
              <Text style={[styles.jobType, { color: Colors.textSecondary }]}>{lead.job_type}</Text>
              <Text style={[styles.location, { color: Colors.muted }]}>
                {lead.nationwide ? '🌐 Nationwide' : `📍 ${lead.city}, ${lead.state}`}
              </Text>
            </View>
            <View style={styles.priceBadge}>
              <Text style={[styles.priceLabel, { color: Colors.muted }]}>PAID</Text>
              <Text style={[styles.priceValue, { color: Colors.foreground }]}>{formatPrice(price)}</Text>
            </View>
          </View>

          <View style={styles.unlockedBadge}>
            <Text style={[styles.unlockedText, { color: Colors.accent }]}>✓ Lead Unlocked</Text>
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              {lead.lead_code && (
                <Text style={[styles.leadCodeBadge, { color: Colors.orange }]}>#{lead.lead_code}</Text>
              )}
              <Text style={[styles.purchasedDate, { color: Colors.muted }]}>
                {new Date(lead.purchased_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Job description ──────────────────────────── */}
        {lead.public_summary && (
          <View style={[styles.section, { backgroundColor: Colors.panel }]}>
            <Text style={[styles.sectionTitle, { color: Colors.foreground }]}>📋  Job Description</Text>
            <Text style={[styles.description, { color: Colors.text }]}>{lead.public_summary}</Text>
          </View>
        )}

        {/* ── Lead details (metadata fields) ──────────── */}
        {metaEntries.length > 0 && (
          <View style={[styles.section, { backgroundColor: Colors.panel }]}>
            <Text style={[styles.sectionTitle, { color: Colors.foreground }]}>🔍  Lead Details</Text>
            {metaEntries.map(([key, value]) => (
              <View key={key} style={[styles.metaRow, { borderBottomColor: Colors.border }]}>
                <Text style={[styles.metaKey, { color: Colors.muted }]}>{labelify(key)}</Text>
                <Text style={[styles.metaValue, { color: Colors.foreground }]}>{String(value)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Call panel ──────────────────────────────── */}
        <CallPanel purchaseId={lead.purchase_id} />

        {/* ── Signal panel ─────────────────────────────── */}
        <SignalPanel purchaseId={lead.purchase_id} />

        {/* ── Private notes ────────────────────────────── */}
        {lead.private_notes && (
          <View style={[styles.section, { backgroundColor: Colors.panel }]}>
            <Text style={[styles.sectionTitle, { color: Colors.foreground }]}>📝  Lead Notes</Text>
            <Text style={[styles.description, { color: Colors.text }]}>{lead.private_notes}</Text>
          </View>
        )}

        {/* ── Rate this lead ───────────────────────────── */}
        <RatingPanel leadId={lead.id} />
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  errorText: { fontSize: FontSize.base, color: Colors.danger, textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    paddingVertical: 10, paddingHorizontal: 28,
    borderRadius: Radius.md, backgroundColor: Colors.orange,
  },
  retryBtnText: { fontSize: FontSize.sm, color: '#fff', fontWeight: '700' },
  backBtn: {
    paddingVertical: 8, paddingHorizontal: 20,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.accent,
  },
  backBtnText: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: '600' },

  backRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: Spacing.xs,
  },
  backArrow: { fontSize: FontSize.lg, color: Colors.orange, lineHeight: 26 },
  backLabel: { fontSize: FontSize.base, color: Colors.orange, fontWeight: '600' },

  headerCard: {
    backgroundColor: Colors.panel,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.32)',
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  category:  { fontSize: FontSize.lg, fontWeight: '700', color: Colors.foreground },
  jobType:   { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  location:  { fontSize: FontSize.xs, color: Colors.muted, marginTop: 2 },
  priceBadge: { alignItems: 'flex-end' },
  priceLabel: { fontSize: FontSize.xs - 1, color: Colors.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  priceValue: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.foreground, fontVariant: ['tabular-nums'] },

  unlockedBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(129,140,248,0.18)',
  },
  unlockedText:  { fontSize: FontSize.sm, color: Colors.accent, fontWeight: '600' },
  leadCodeBadge: { fontSize: FontSize.xs, fontWeight: '700', fontFamily: 'Courier', letterSpacing: 1 },
  purchasedDate: { fontSize: FontSize.xs, color: Colors.muted },

  section: {
    backgroundColor: Colors.panel,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.foreground,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  metaKey:   { fontSize: FontSize.sm, color: Colors.muted, flex: 1 },
  metaValue: { fontSize: FontSize.sm, color: Colors.foreground, fontWeight: '600', flex: 1, textAlign: 'right' },
});
