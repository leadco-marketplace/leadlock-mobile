import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { signalsApi, LeadSignal } from '@/lib/api';
import { ScreenShell } from '@/components/ScreenShell';
import { Colors, FontSize, Spacing, Radius, Shadow } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

// ── Labels ──────────────────────────────────────────────────────────────────

const SIGNAL_LABELS: Record<string, { text: string; color: string; bg: string }> = {
  no_answer: {
    text:  'Customer didn't answer',
    color: '#fbbf24',
    bg:    'rgba(251,191,36,0.10)',
  },
  wrong_number: {
    text:  'Wrong number reported',
    color: '#f87171',
    bg:    'rgba(248,113,113,0.10)',
  },
};

const RESPONSE_OPTIONS = [
  {
    key:   'verifying' as const,
    label: 'I'm verifying the contact info now',
    color: '#818cf8',
  },
  {
    key:   'number_correct' as const,
    label: 'Number is correct — buyer should try again',
    color: '#60a5fa',
  },
  {
    key:   'customer_available' as const,
    label: 'Customer is now available — buyer should call',
    color: '#4ade80',
  },
  {
    key:   'info_updated' as const,
    label: 'I've updated the lead contact info',
    color: '#fb923c',
  },
];

const RESPONDED_LABELS: Record<string, string> = {
  verifying:          'Verifying contact info',
  number_correct:     'Confirmed number is correct',
  customer_available: 'Customer now available',
  info_updated:       'Contact info updated',
};

// ── Signal card ──────────────────────────────────────────────────────────────

interface SignalCardProps {
  signal:    LeadSignal;
  onRespond: (signalId: string, response: string) => Promise<void>;
}

function SignalCard({ signal, onRespond }: SignalCardProps) {
  useTheme();
  const [responding, setResponding] = useState(false);
  const lead = signal.leads;
  const badge = SIGNAL_LABELS[signal.signal_type];

  async function handleRespond(responseKey: string) {
    if (responding) return;
    setResponding(true);
    try {
      await onRespond(signal.id, responseKey);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not submit response. Try again.');
    } finally {
      setResponding(false);
    }
  }

  return (
    <View style={[cardStyles.card, { backgroundColor: Colors.panel, borderColor: badge?.color + '33' }]}>

      {/* ── Lead details (so provider knows which lead this is) ── */}
      {lead && (
        <View style={cardStyles.leadSection}>
          <Text style={[cardStyles.category, { color: Colors.foreground }]}>
            {lead.service_category}
          </Text>
          <Text style={[cardStyles.jobType, { color: Colors.textSecondary }]}>
            {lead.job_type}
          </Text>
          <Text style={[cardStyles.location, { color: Colors.muted }]}>
            {lead.city}, {lead.state}
          </Text>
          {/* Provider submitted this lead so they can see the contact info */}
          {lead.customer_name && (
            <Text style={[cardStyles.contact, { color: Colors.muted }]}>
              Customer: {lead.customer_name}
            </Text>
          )}
          {lead.customer_phone && (
            <Text style={[cardStyles.contact, { color: Colors.muted }]}>
              Phone: {lead.customer_phone}
            </Text>
          )}
        </View>
      )}

      {/* ── Signal badge + date ── */}
      <View style={cardStyles.badgeRow}>
        <View style={[cardStyles.badge, { backgroundColor: badge?.bg ?? 'transparent', borderColor: badge?.color + '66' }]}>
          <Text style={[cardStyles.badgeText, { color: badge?.color ?? Colors.muted }]}>
            {badge?.text ?? signal.signal_type}
          </Text>
        </View>
        <Text style={[cardStyles.date, { color: Colors.muted }]}>
          {new Date(signal.created_at).toLocaleDateString()}
        </Text>
      </View>

      {/* ── Response section ── */}
      {signal.provider_response ? (
        /* Already responded */
        <View style={[cardStyles.respondedBox, { backgroundColor: Colors.panel2 }]}>
          <Text style={[cardStyles.respondedLabel, { color: '#4ade80' }]}>
            ✓ You responded: {RESPONDED_LABELS[signal.provider_response] ?? signal.provider_response}
          </Text>
          {signal.responded_at && (
            <Text style={[cardStyles.respondedDate, { color: Colors.muted }]}>
              {new Date(signal.responded_at).toLocaleDateString()}
            </Text>
          )}
        </View>
      ) : (
        /* Awaiting response */
        <View style={cardStyles.responseSection}>
          <Text style={[cardStyles.responsePrompt, { color: Colors.muted }]}>
            How do you want to respond?
          </Text>
          {RESPONSE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[cardStyles.responseBtn, { borderColor: opt.color + '44' }]}
              onPress={() => handleRespond(opt.key)}
              disabled={responding}
              activeOpacity={0.75}
            >
              <View style={[cardStyles.dot, { backgroundColor: opt.color }]} />
              <Text style={[cardStyles.responseBtnText, { color: Colors.foreground }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
          {responding && (
            <ActivityIndicator color={Colors.accent} style={{ marginTop: 6 }} />
          )}
        </View>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth:  1,
    padding:      Spacing.md,
    marginBottom: Spacing.sm + 4,
    gap:          Spacing.sm,
    ...Shadow.card,
  },
  leadSection:  { gap: 2 },
  category:     { fontSize: FontSize.base, fontWeight: '700' },
  jobType:      { fontSize: FontSize.sm,   color: '#8ba3c7'  },
  location:     { fontSize: FontSize.xs,   color: '#6080a8'  },
  contact:      { fontSize: FontSize.xs,   marginTop: 3      },
  badgeRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    borderWidth:       0.5,
    borderRadius:      Radius.sm,
    paddingHorizontal: 10,
    paddingVertical:    3,
  },
  badgeText:     { fontSize: FontSize.xs, fontWeight: '600' },
  date:          { fontSize: FontSize.xs - 1 },
  responseSection: { gap: 7 },
  responsePrompt:  { fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.3 },
  responseBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                10,
    paddingVertical:    10,
    paddingHorizontal:  12,
    borderRadius:       Radius.md,
    borderWidth:        0.5,
    backgroundColor:   'rgba(255,255,255,0.03)',
  },
  dot:              { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  responseBtnText:  { fontSize: FontSize.sm, flex: 1, lineHeight: 18 },
  respondedBox: {
    borderRadius: Radius.md,
    padding:      Spacing.sm,
    gap:          3,
  },
  respondedLabel: { fontSize: FontSize.sm, fontWeight: '600' },
  respondedDate:  { fontSize: FontSize.xs },
});

// ── SignalsScreen ─────────────────────────────────────────────────────────────

export function SignalsScreen() {
  useTheme();
  const [signals, setSignals] = useState<LeadSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await signalsApi.getProviderSignals();
      setSignals(data);
    } catch (e: any) {
      setError(e.message ?? 'Could not load signals.');
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function handleRespond(signalId: string, response: string) {
    await signalsApi.respond(signalId, response as any);
    // Optimistic update so the card flips to responded immediately
    setSignals(prev =>
      prev.map(s =>
        s.id === signalId
          ? { ...s, provider_response: response as any, responded_at: new Date().toISOString() }
          : s
      )
    );
  }

  const pending   = signals.filter(s => !s.provider_response);
  const responded = signals.filter(s =>  s.provider_response);

  if (loading) {
    return (
      <ScreenShell title="Lead Signals" scrollable={false}>
        <View style={screenStyles.centered}>
          <ActivityIndicator color={Colors.orange} size="large" />
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title="Lead Signals"
      subtitle={
        pending.length > 0
          ? `${pending.length} pending response${pending.length !== 1 ? 's' : ''}`
          : 'All caught up'
      }
    >
      {error ? (
        <Text style={[screenStyles.errorText, { color: Colors.danger }]}>{error}</Text>
      ) : signals.length === 0 ? (
        <View style={screenStyles.emptyBox}>
          <Text style={screenStyles.emptyEmoji}>📭</Text>
          <Text style={[screenStyles.emptyTitle, { color: Colors.foreground }]}>
            No signals yet
          </Text>
          <Text style={[screenStyles.emptySub, { color: Colors.muted }]}>
            When a buyer reports a call issue on one of your leads, it will appear here for you to review and respond.
          </Text>
        </View>
      ) : (
        <FlatList
          data={[...pending, ...responded]}
          keyExtractor={s => s.id}
          renderItem={({ item }) => (
            <SignalCard signal={item} onRespond={handleRespond} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        />
      )}
    </ScreenShell>
  );
}

const screenStyles = StyleSheet.create({
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText:  { fontSize: FontSize.sm, marginBottom: Spacing.sm },
  emptyBox: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             Spacing.sm,
    paddingTop:      80,
    paddingHorizontal: Spacing.lg,
  },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontSize: FontSize.md, fontWeight: '600' },
  emptySub:   { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
});
