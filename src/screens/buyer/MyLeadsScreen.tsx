import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl, AppState,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackActions } from '@react-navigation/native';
import { leadsApi, PurchasedLead } from '@/lib/api';
import { ScreenShell } from '@/components/ScreenShell';
import { Colors, FontSize, Spacing, Radius, Shadow } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
function formatPrice(cents: number) { return `$${(cents / 100).toFixed(2)}`; }



function PurchasedCard({ lead }: { lead: PurchasedLead }) {
  const navigation = useNavigation<any>();
  useTheme(); // re-render on theme change so inline Colors.* picks up new values
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: Colors.panel }]}
      onPress={() => navigation.dispatch(StackActions.push('LeadDetail', { leadId: lead.id, purchaseId: lead.purchase_id }))}
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
          <Text style={[styles.price, { color: Colors.foreground }]}>{formatPrice(lead.buyer_price_cents ?? Math.round(lead.price_cents * 1.125))}</Text>
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
  const route = useRoute<any>();
  const loadRef = useRef<((silent?: boolean) => Promise<void>) | null>(null);

  const [leads,      setLeads]      = useState<PurchasedLead[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Stable load function — only uses state setters (always-stable references)
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await leadsApi.getPurchased();
      setLeads(data);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load leads. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // empty deps — state setters never change

  // Keep a ref so the AppState listener can always call the latest load()
  loadRef.current = load;

  // Reload on every tab focus + 2 s retry to handle any DB propagation lag
  // after a fresh purchase (the purchase row may not be visible on the read
  // replica yet by the time the first load fires).
  useFocusEffect(useCallback(() => {
    load(false);
    const retry = setTimeout(() => loadRef.current?.(true), 2000);
    return () => clearTimeout(retry);
  }, [load]));

  // Reload when the app comes back to the foreground — covers the case where
  // the user went through a Stripe checkout in Safari and returned via deep link.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') loadRef.current?.(true);
    });
    return () => sub.remove();
  }, []);

  // LeadDetailScreen passes a refreshToken param after a fresh purchase so that
  // My Leads reloads even when it was already the active tab (focus event would
  // not fire in that case because the screen never lost focus).
  const refreshToken = route.params?.refreshToken;
  useEffect(() => {
    if (refreshToken != null) load(false);
  }, [refreshToken, load]);

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
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => load(false)} style={styles.errorRetry}>
            <Text style={styles.errorRetryText}>↻ Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={leads}
        keyExtractor={(l) => l.purchase_id}
        renderItem={({ item }) => <PurchasedCard lead={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
            tintColor={Colors.orange}
          />
        }
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

  errorBanner: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.30)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.danger,
    lineHeight: 17,
  },
  errorRetry: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorRetryText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    fontWeight: '700',
  },
});
