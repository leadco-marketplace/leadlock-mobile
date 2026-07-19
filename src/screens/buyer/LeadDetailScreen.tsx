import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { leadsApi, rateApi, signalsApi, PurchasedLead, RatingThumb, LeadSignal, CallLogEntry, THUMBS_UP_REASONS, THUMBS_DOWN_REASONS } from '@/lib/api';
import { ScreenShell } from '@/components/ScreenShell';
import { Colors, FontSize, Spacing, Radius, Shadow } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import Constants from 'expo-constants';
import { Audio } from 'expo-av';
import { supabase } from '@/lib/supabase';
import { Linking, Alert, Share } from 'react-native';

const BASE = (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://www.nabbitmarketplace.com';

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

  // forceNew=true → "Get a new extension": server expires the current PIN and
  // issues a fresh one. Without it, prepare returns the existing PIN unchanged.
  async function fetchPin(forceNew = false) {
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res  = await fetch(`${BASE}/api/call/prepare`, {
        method: 'POST', headers,
        body: JSON.stringify({ purchaseId, forceNew }),
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
    // A lead with no phone on file can't be called — retrying won't help.
    // Show a clear message (buyer can reach out by email instead) rather than a
    // raw error code + Try again button.
    const noPhone = error === 'no_phone' || /no[_ ]?phone/i.test(error);
    if (noPhone) {
      return (
        <View style={[callStyles.box, { backgroundColor: Colors.panel2 }]}>
          <Text style={[callStyles.sectionLabel, { color: Colors.warn ?? '#b45309' }]}>📞  No phone on file</Text>
          <Text style={[callStyles.hint, { color: Colors.muted }]}>
            This lead was submitted without a phone number. Use the customer's
            email (shown above) to reach them.
          </Text>
        </View>
      );
    }
    return (
      <View style={[callStyles.box, { backgroundColor: Colors.panel2 }]}>
        <Text style={callStyles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity onPress={() => fetchPin()} style={callStyles.retryBtn}>
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
        onPress={() => {
          // Let the buyer choose HOW to place the call. The dial-in bridge is
          // a regular US number, so internet-calling apps (Skype, Google
          // Voice) can reach it from anywhere in the world — essential for
          // buyers travelling or based outside the US.
          const num = pinData.dialIn;
          Alert.alert(
            'Call Customer',
            `Dial ${formatPhone(num)}, then enter extension ${pinData.pin}.`,
            [
              {
                text: '📱 Phone app',
                onPress: () => Linking.openURL(`tel:${num}`).catch(() => {}),
              },
              {
                text: '💬 Skype',
                onPress: () =>
                  Linking.openURL(`skype:${num}?call`).catch(() =>
                    Alert.alert('Skype not installed', 'Install Skype, or use another option.')
                  ),
              },
              {
                text: '🌐 Google Voice',
                onPress: () =>
                  Linking.openURL(
                    `https://voice.google.com/u/0/calls?a=nc,${encodeURIComponent(num)}`
                  ).catch(() => {}),
              },
              {
                text: '📋 Share / copy number',
                onPress: () => Share.share({ message: `${num} (extension ${pinData.pin})` }).catch(() => {}),
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }}
        activeOpacity={0.8}
      >
        <Text style={callStyles.callBtnText}>📞  Call Customer Now</Text>
      </TouchableOpacity>
      <Text style={[callStyles.hint, { color: Colors.muted }]}>
        Call the number above, then enter extension{' '}
        <Text style={{ fontWeight: '700', color: Colors.accent }}>{pinData.pin}</Text> when prompted.
      </Text>
      <TouchableOpacity onPress={() => fetchPin(true)}>
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
    <View style={[signalStyles.box, { backgroundColor: Colors.panel, shadowColor: Colors.glowColor }]}>
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
              ? "📵  Customer didn't answer — reported"
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
    borderWidth:   2,
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
      <View style={[ratingStyles.box, { backgroundColor: Colors.panel, shadowColor: Colors.glowColor }]}>
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
    borderWidth: 2,
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

// ── Call History — every bridge call with recording + AI analysis ───────────
function CallHistory({ purchaseId }: { purchaseId: string }) {
  useTheme();
  const [calls, setCalls] = useState<CallLogEntry[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const soundRef = React.useRef<Audio.Sound | null>(null);

  // Unload audio when leaving the screen
  useEffect(() => () => { soundRef.current?.unloadAsync().catch(() => {}); }, []);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const data = await leadsApi.getCalls(purchaseId);
        if (alive) setCalls(data);
      } catch { /* transient — next poll retries */ }
    }
    load();
    // Poll while the screen is open so new calls + fresh analyses appear
    // WITHOUT any manual refresh.
    const timer = setInterval(load, 8000);
    return () => { alive = false; clearInterval(timer); };
  }, [purchaseId]);

  async function playRecording(callId: string) {
    // In-app playback via expo-av — streams through the authenticated proxy
    // with the Bearer token, no leaving the app.
    try {
      // Tapping the playing call again stops it
      if (playingId === callId) {
        await soundRef.current?.stopAsync().catch(() => {});
        await soundRef.current?.unloadAsync().catch(() => {});
        soundRef.current = null;
        setPlayingId(null);
        return;
      }
      setLoadingId(callId);
      await soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setLoadingId(null); return; }

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        {
          uri: `${BASE}/api/call/recording?callId=${encodeURIComponent(callId)}`,
          headers: { Authorization: `Bearer ${token}` },
        },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setPlayingId(callId);
      sound.setOnPlaybackStatusUpdate((st) => {
        if (st.isLoaded && st.didJustFinish) {
          setPlayingId(null);
          sound.unloadAsync().catch(() => {});
          if (soundRef.current === sound) soundRef.current = null;
        }
      });
    } catch {
      Alert.alert('Playback Error', 'Could not play the recording. Try again.');
    } finally {
      setLoadingId(null);
    }
  }

  if (calls.length === 0) return null;

  return (
    <View style={[styles.section, { backgroundColor: Colors.panel, shadowColor: Colors.glowColor }]}>
      <Text style={[styles.sectionTitle, { color: Colors.foreground }]}>📞  Call History</Text>
      {calls.map((c) => {
        const meta = c.analysis?.outcome ? BUYER_OUTCOME_META[c.analysis.outcome] : null;
        const mins = c.duration_seconds != null
          ? `${Math.floor(c.duration_seconds / 60)}:${String(c.duration_seconds % 60).padStart(2, '0')}`
          : null;
        return (
          <View key={c.id} style={{
            borderWidth: 1, borderColor: 'rgba(148,163,184,0.25)', borderRadius: 10,
            padding: 10, marginTop: 8, gap: 5,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: Colors.foreground }}>
                {new Date(c.started_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </Text>
              {mins && <Text style={{ fontSize: FontSize.xs, color: Colors.muted }}>· {mins} min</Text>}
              <Text style={{ fontSize: FontSize.xs, color: Colors.muted }}>· {c.status}</Text>
            </View>
            {meta ? (
              <View style={{
                alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
                borderRadius: 6, borderWidth: 1, backgroundColor: meta.bg, borderColor: meta.color + '55',
              }}>
                <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: meta.color }}>{meta.label}</Text>
              </View>
            ) : c.analysis && c.analysis.status !== 'failed' ? (
              <Text style={{ fontSize: FontSize.xs, color: Colors.muted }}>⏳ Analyzing this call…</Text>
            ) : null}
            {c.analysis?.summary && (
              <Text style={{ fontSize: FontSize.xs, color: Colors.muted }}>{c.analysis.summary}</Text>
            )}
            {c.has_recording && (
              <Text
                style={{ fontSize: FontSize.sm, fontWeight: '600', color: playingId === c.id ? '#f87171' : Colors.accent }}
                onPress={() => playRecording(c.id)}
              >
                {loadingId === c.id ? '⏳ Loading…' : playingId === c.id ? '■ Stop Playback' : '▶︎ Play Recording'}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

// AI call-analysis outcome → buyer-facing label + color
const BUYER_OUTCOME_META: Record<string, { label: string; color: string; bg: string }> = {
  job_booked:            { label: '⚡ Job Booked — Validated', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  appointment_scheduled: { label: '📅 Appointment Scheduled — Validated', color: '#34d399', bg: 'rgba(52,211,153,0.10)' },
  connected:             { label: '✅ Valid Conversation', color: '#22d3ee', bg: 'rgba(34,211,238,0.10)' },
  callback_requested:    { label: '🔔 Callback Requested', color: '#fbbf24', bg: 'rgba(251,191,36,0.10)' },
  declined:              { label: '❌ Customer Declined', color: '#f87171', bg: 'rgba(248,113,113,0.10)' },
  never_requested:       { label: '🚩 Not A Real Request?', color: '#f87171', bg: 'rgba(248,113,113,0.14)' },
  voicemail:             { label: '📵 Voicemail', color: '#94a3b8', bg: 'rgba(148,163,184,0.10)' },
  no_answer:             { label: '📞 No Answer', color: '#94a3b8', bg: 'rgba(148,163,184,0.10)' },
};

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

  // ── Live outcome polling — NO manual refresh needed ─────────────────────
  // After a call, the AI takes ~1-2 min to classify it. While this screen is
  // open and there's no outcome yet, quietly re-check every 8s and update in
  // place the moment the result lands.
  useEffect(() => {
    if (!lead || lead.call_outcome) return;
    const timer = setInterval(async () => {
      try {
        const results = lead.purchase_id
          ? await leadsApi.getPurchaseByPurchaseId(lead.purchase_id)
          : await leadsApi.getPurchased();
        const found =
          results.find((r) => r.purchase_id === lead.purchase_id) ??
          results.find((r) => r.id === lead.id);
        if (
          found &&
          (found.call_outcome !== lead.call_outcome ||
            found.call_analysis_status !== lead.call_analysis_status)
        ) {
          setLead(found);
        }
      } catch { /* transient network error — next tick retries */ }
    }, 8000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.purchase_id, lead?.call_outcome, lead?.call_analysis_status]);

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
        <View style={[styles.headerCard, { backgroundColor: Colors.panel, shadowColor: Colors.glowColor }]}>
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
          <View style={[styles.section, { backgroundColor: Colors.panel, shadowColor: Colors.glowColor }]}>
            <Text style={[styles.sectionTitle, { color: Colors.foreground }]}>📋  Job Description</Text>
            <Text style={[styles.description, { color: Colors.text }]}>{lead.public_summary}</Text>
          </View>
        )}

        {/* ── Customer contact ────────────────────────────
            While the masked number is active (14 days after purchase) the
            server sends FIRST NAME ONLY — phone/email arrive only after the
            window ends (contact_hidden=false). */}
        {(lead.contact_name || lead.contact_email || lead.contact_phone || lead.contact_hidden) && (
          <View style={[styles.section, { backgroundColor: Colors.panel, shadowColor: Colors.glowColor }]}>
            <Text style={[styles.sectionTitle, { color: Colors.foreground }]}>👤  Customer Contact</Text>
            {lead.contact_name && (
              <Text style={[styles.description, { color: Colors.text }]}>
                <Text style={{ color: Colors.muted }}>Name: </Text>{lead.contact_name}
              </Text>
            )}
            {lead.contact_hidden ? (
              <Text style={[styles.description, { color: Colors.muted }]}>
                🔒 Direct phone & email unlock{' '}
                {lead.contact_reveals_at
                  ? `on ${new Date(lead.contact_reveals_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
                  : 'when the call window ends'}
                . Until then, reach the customer with the Call button below — your
                calls are recorded and protected by the dispute guarantee.
              </Text>
            ) : (
              <>
                {lead.contact_email && (
                  <Text
                    style={[styles.description, { color: Colors.accent }]}
                    onPress={() => Linking.openURL(`mailto:${lead.contact_email}`)}
                  >
                    <Text style={{ color: Colors.muted }}>Email: </Text>{lead.contact_email}
                  </Text>
                )}
                {lead.contact_phone && (
                  <Text
                    style={[styles.description, { color: Colors.accent }]}
                    onPress={() => Linking.openURL(`tel:${lead.contact_phone}`)}
                  >
                    <Text style={{ color: Colors.muted }}>Phone: </Text>{lead.contact_phone}
                  </Text>
                )}
              </>
            )}
          </View>
        )}

        {/* ── Lead details (metadata fields) ──────────── */}
        {metaEntries.length > 0 && (
          <View style={[styles.section, { backgroundColor: Colors.panel, shadowColor: Colors.glowColor }]}>
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
        {/* Aging: once a lead passes the phone-expiry window its number is
            removed. Calling is no longer possible, so we hide the call/signal
            panels and show a notice. All other details stay on record. */}
        {lead.is_old ? (
          <View style={[styles.section, { backgroundColor: Colors.panel, shadowColor: Colors.glowColor }]}>
            <Text style={[styles.sectionTitle, { color: Colors.foreground }]}>📞  Contact</Text>
            <Text style={[styles.description, { color: Colors.warn ?? '#b45309', fontWeight: '600' }]}>
              Old lead — phone number removed
            </Text>
            <Text style={[styles.description, { color: Colors.muted, marginTop: 4 }]}>
              This lead is more than two weeks old. The customer's number has been
              removed to prevent misdirected calls, but the rest of the lead stays
              here for your records.
            </Text>
          </View>
        ) : (
          <>
            {/* ── AI Call Result — updates live after each call ── */}
            {(lead.call_outcome || lead.call_analysis_status) && (
              <View style={[styles.section, { backgroundColor: Colors.panel, shadowColor: Colors.glowColor }]}>
                <Text style={[styles.sectionTitle, { color: Colors.foreground }]}>📊  Call Result</Text>
                {lead.call_outcome && BUYER_OUTCOME_META[lead.call_outcome] ? (
                  <>
                    <View style={{
                      alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5,
                      borderRadius: 8, borderWidth: 1, marginBottom: 6,
                      backgroundColor: BUYER_OUTCOME_META[lead.call_outcome].bg,
                      borderColor: BUYER_OUTCOME_META[lead.call_outcome].color + '55',
                    }}>
                      <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: BUYER_OUTCOME_META[lead.call_outcome].color }}>
                        {BUYER_OUTCOME_META[lead.call_outcome].label}
                      </Text>
                    </View>
                    {lead.call_outcome_summary && (
                      <Text style={[styles.description, { color: Colors.muted }]}>{lead.call_outcome_summary}</Text>
                    )}
                    {lead.call_outcome === 'never_requested' && (
                      <Text style={[styles.description, { color: Colors.muted, marginTop: 4 }]}>
                        This call was flagged — the customer says they never requested service.
                        Our team reviews flagged leads; if confirmed, you'll receive platform credit.
                      </Text>
                    )}
                  </>
                ) : lead.call_analysis_status === 'failed' ? (
                  <Text style={[styles.description, { color: Colors.muted }]}>
                    Call analysis unavailable for the last call.
                  </Text>
                ) : (
                  <Text style={[styles.description, { color: Colors.muted }]}>
                    ⏳ Analyzing your call — the result will appear here automatically
                    (usually 1–2 minutes).
                  </Text>
                )}
              </View>
            )}

            <CallPanel purchaseId={lead.purchase_id} />

            {/* ── Call History — every call, recording, analysis ── */}
            <CallHistory purchaseId={lead.purchase_id} />

            {/* ── Signal panel ─────────────────────────────── */}
            <SignalPanel purchaseId={lead.purchase_id} />
          </>
        )}

        {/* ── Private notes ────────────────────────────── */}
        {lead.private_notes && (
          <View style={[styles.section, { backgroundColor: Colors.panel, shadowColor: Colors.glowColor }]}>
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
    borderWidth: 2,
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
  jobType:   { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
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
    borderWidth: 2,
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
