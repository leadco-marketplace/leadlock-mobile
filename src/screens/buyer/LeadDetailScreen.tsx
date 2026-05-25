import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { leadsApi, PurchasedLead } from '@/lib/api';
import { ScreenShell } from '@/components/ScreenShell';
import { Colors, FontSize, Spacing, Radius, Shadow } from '@/theme';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import { Linking, Alert } from 'react-native';

const BASE = (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://leadcomarketplace.com';

type LeadDetailRouteParams = { leadId: string };

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
      <Text style={callStyles.sectionLabel}>📞  CALL CUSTOMER</Text>
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
      <TouchableOpacity
        style={callStyles.callBtn}
        onPress={() => Linking.openURL(`tel:${pinData.dialIn}`)}
        activeOpacity={0.8}
      >
        <Text style={callStyles.callBtnText}>📞  Call Customer Now</Text>
      </TouchableOpacity>
      <Text style={callStyles.hint}>
        Call the number above, then enter extension{' '}
        <Text style={{ fontWeight: '700', color: Colors.accent }}>{pinData.pin}</Text> when prompted.
      </Text>
      <TouchableOpacity onPress={fetchPin}>
        <Text style={callStyles.refreshText}>↻ Get a new extension</Text>
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

// ── Main screen ────────────────────────────────────────────────────────────

export function LeadDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ LeadDetail: LeadDetailRouteParams }, 'LeadDetail'>>();
  const { leadId } = route.params;

  const [lead,    setLead]    = useState<PurchasedLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    leadsApi.getPurchased()
      .then((leads) => {
        const found = leads.find((l) => l.id === leadId);
        if (found) {
          setLead(found);
        } else {
          setError('This lead could not be found in your unlocked leads.');
        }
      })
      .catch((e) => setError(e.message ?? 'Failed to load lead'))
      .finally(() => setLoading(false));
  }, [leadId]);

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
    return (
      <ScreenShell scrollable={false}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'Lead not found.'}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenShell>
    );
  }

  // Parse metadata fields
  const metaEntries = lead.metadata
    ? Object.entries(lead.metadata).filter(([, v]) => v !== null && v !== '' && v !== undefined)
    : [];

  const price = lead.buyer_price_cents ?? Math.round(lead.price_cents * 1.125);

  return (
    <ScreenShell scrollable={false}>
      {/* ── Back button ─────────────────────────────────── */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow} activeOpacity={0.7}>
        <Text style={styles.backArrow}>←</Text>
        <Text style={styles.backLabel}>Back</Text>
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: Spacing.md, paddingBottom: Spacing.xxl }}
      >
        {/* ── Header card ─────────────────────────────── */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.category}>{lead.service_category}</Text>
              <Text style={styles.jobType}>{lead.job_type}</Text>
              <Text style={styles.location}>
                {lead.nationwide ? '🌐 Nationwide' : `📍 ${lead.city}, ${lead.state}`}
              </Text>
            </View>
            <View style={styles.priceBadge}>
              <Text style={styles.priceLabel}>PAID</Text>
              <Text style={styles.priceValue}>{formatPrice(price)}</Text>
            </View>
          </View>

          <View style={styles.unlockedBadge}>
            <Text style={styles.unlockedText}>✓ Lead Unlocked</Text>
            <Text style={styles.purchasedDate}>
              {new Date(lead.purchased_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* ── Job description ──────────────────────────── */}
        {lead.public_summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋  Job Description</Text>
            <Text style={styles.description}>{lead.public_summary}</Text>
          </View>
        )}

        {/* ── Lead details (metadata fields) ──────────── */}
        {metaEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔍  Lead Details</Text>
            {metaEntries.map(([key, value]) => (
              <View key={key} style={styles.metaRow}>
                <Text style={styles.metaKey}>{labelify(key)}</Text>
                <Text style={styles.metaValue}>{String(value)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Call panel ──────────────────────────────── */}
        <CallPanel purchaseId={lead.purchase_id} />

        {/* ── Private notes ────────────────────────────── */}
        {lead.private_notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝  Lead Notes</Text>
            <Text style={styles.description}>{lead.private_notes}</Text>
          </View>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  errorText: { fontSize: FontSize.base, color: Colors.danger, textAlign: 'center' },
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
