import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Linking, Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { leadsApi, PurchasedLead } from '@/lib/api';
import { ScreenShell } from '@/components/ScreenShell';
import { Colors, FontSize, Spacing, Radius, Shadow } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

const BASE = (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://leadcomarketplace.com';

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

interface PinData {
  dialIn:    string;
  pin:       string;
  expiresAt: string;
  pinId:     string;
}

function formatPrice(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

function formatPhone(e164: string): string {
  const d = e164.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) {
    return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  }
  return e164;
}

/** Bridge-number call panel — fetches extension and shows dial-in + PIN */
function CallPanel({ purchaseId }: { purchaseId: string }) {
  const [pinData, setPinData] = useState<PinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  async function fetchPin() {
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res  = await fetch(`${BASE}/api/call/prepare`, {
        method: 'POST',
        headers,
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
      <View style={callStyles.box}>
        <ActivityIndicator color={Colors.accent} size="small" />
        <Text style={callStyles.loadingText}>Loading your extension…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={callStyles.box}>
        <Text style={callStyles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity onPress={fetchPin} style={callStyles.retryBtn}>
          <Text style={callStyles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!pinData) return null;

  return (
    <View style={callStyles.box}>
      <Text style={callStyles.sectionLabel}>CALL CUSTOMER</Text>

      {/* Dial-in + Extension */}
      <View style={callStyles.pinRow}>
        <View style={callStyles.pinBlock}>
          <Text style={callStyles.pinLabel}>DIAL-IN NUMBER</Text>
          <Text style={callStyles.dialIn}>{formatPhone(pinData.dialIn)}</Text>
        </View>
        <View style={callStyles.divider} />
        <View style={callStyles.pinBlock}>
          <Text style={callStyles.pinLabel}>YOUR EXTENSION</Text>
          <Text style={callStyles.pin}>{pinData.pin}</Text>
        </View>
      </View>

      {/* Call button */}
      <TouchableOpacity
        style={callStyles.callBtn}
        onPress={() => Linking.openURL(`tel:${pinData.dialIn}`)}
        activeOpacity={0.8}
      >
        <Text style={callStyles.callBtnText}>📞 Call Customer</Text>
      </TouchableOpacity>

      <Text style={callStyles.hint}>
        Call the dial-in number, then enter extension{' '}
        <Text style={{ fontWeight: '700', color: Colors.accent }}>{pinData.pin}</Text> when prompted.
      </Text>

      <TouchableOpacity onPress={fetchPin}>
        <Text style={callStyles.refreshText}>Get a new extension</Text>
      </TouchableOpacity>
    </View>
  );
}

const callStyles = StyleSheet.create({
  box: {
    backgroundColor: Colors.panel2,
    borderRadius: Radius.md,
    padding: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.30)',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  sectionLabel: {
    fontSize: FontSize.xs - 1,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Colors.accent,
    textTransform: 'uppercase',
  },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    alignSelf: 'stretch',
  },
  pinBlock: { flex: 1, gap: 2 },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(129,140,248,0.25)',
  },
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
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  callBtnText: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: '#fff',
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    lineHeight: 17,
  },
  refreshText: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    textDecorationLine: 'underline',
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.muted,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.danger,
  },
  retryBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  retryText: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: '600',
  },
});

function PurchasedCard({ lead }: { lead: PurchasedLead }) {
  const navigation = useNavigation<any>();
  useTheme(); // re-render on theme change so inline Colors.* picks up new values
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: Colors.panel }]}
      onPress={() => navigation.navigate('LeadDetail', { leadId: lead.id, purchaseId: lead.purchase_id })}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.category, { color: Colors.foreground }]}>{lead.service_category}</Text>
          <Text style={[styles.jobType, { color: Colors.textSecondary }]}>{lead.job_type}</Text>
          <Text style={[styles.location, { color: Colors.muted }]}>
            {lead.nationwide ? '🌐 Nationwide' : `${lead.city}, ${lead.state}`}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.price, { color: Colors.foreground }]}>{formatPrice(lead.price_cents)}</Text>
          <Text style={[styles.unlockedLabel, { color: Colors.accent }]}>✓ Unlocked</Text>
          <Text style={[styles.tapHint, { color: Colors.muted }]}>Tap to view →</Text>
        </View>
      </View>

      <Text style={[styles.purchasedAt, { color: Colors.muted }]}>
        Unlocked {new Date(lead.purchased_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );
}

export function MyLeadsScreen() {
  useTheme(); // re-render on theme change
  const [leads,      setLeads]      = useState<PurchasedLead[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try { setLeads(await leadsApi.getPurchased()); } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) {
    return (
      <ScreenShell scrollable={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.orange} size="large" />
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title="My Leads"
      subtitle={`${leads.length} lead${leads.length !== 1 ? 's' : ''} unlocked`}
      scrollable={false}
    >
      <FlatList
        data={leads}
        keyExtractor={(l) => l.purchase_id}
        renderItem={({ item }) => <PurchasedCard lead={item} />}
        onRefresh={() => { setRefreshing(true); load(); }}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          leads.length === 0 ? { flex: 1 } : { paddingBottom: Spacing.xxl }
        }
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingTop: 80 }}>
            <Text style={{ fontSize: 48 }}>🔒</Text>
            <Text style={{ fontSize: FontSize.md, fontWeight: '600', color: Colors.foreground, textAlign: 'center' }}>
              No unlocked leads yet
            </Text>
            <Text style={{ fontSize: FontSize.sm, color: Colors.muted }}>
              Go to Live Feed to unlock your first lead.
            </Text>
          </View>
        }
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.panel,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.32)',
    padding: Spacing.md,
    marginBottom: Spacing.sm + 4,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  category:     { fontSize: FontSize.base, fontWeight: '700', color: Colors.foreground },
  jobType:      { fontSize: FontSize.xs,   color: Colors.textSecondary, marginTop: 2 },
  location:     { fontSize: FontSize.xs,   color: Colors.muted },
  price:        { fontSize: FontSize.md,   fontWeight: '700', color: Colors.foreground, textAlign: 'right', fontVariant: ['tabular-nums'] },
  unlockedLabel:{ fontSize: FontSize.xs,   color: Colors.accent, textAlign: 'right', marginTop: 2 },
  tapHint:      { fontSize: FontSize.xs - 1, color: Colors.muted, textAlign: 'right', marginTop: 4 },
  notesBox: {
    backgroundColor: Colors.panel2,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  notesLabel:   { fontSize: FontSize.xs - 2, fontWeight: '700', letterSpacing: 1, color: Colors.muted, textTransform: 'uppercase' },
  notesText:    { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  purchasedAt:  { fontSize: FontSize.xs, color: Colors.muted },
});
