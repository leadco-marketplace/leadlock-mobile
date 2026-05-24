import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { leadsApi, PurchasedLead } from '@/lib/api';
import { ScreenShell } from '@/components/ScreenShell';
import { Colors, FontSize, Spacing, Radius, Shadow } from '@/theme';

function formatPrice(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

function PurchasedCard({ lead }: { lead: PurchasedLead }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.category}>{lead.service_category}</Text>
          <Text style={styles.jobType}>{lead.job_type}</Text>
          <Text style={styles.location}>{lead.nationwide ? '🌐 Nationwide' : `${lead.city}, ${lead.state}`}</Text>
        </View>
        <View>
          <Text style={styles.price}>{formatPrice(lead.price_cents)}</Text>
          <Text style={styles.unlockedLabel}>✓ Unlocked</Text>
        </View>
      </View>

      {/* Contact info */}
      <View style={styles.contactBox}>
        <Text style={styles.contactLabel}>CONTACT INFO</Text>
        {lead.contact_name  && <Text style={styles.contactName}>{lead.contact_name}</Text>}
        {lead.contact_phone && (
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${lead.contact_phone}`)}>
            <Text style={styles.contactPhone}>📞 {lead.contact_phone}</Text>
          </TouchableOpacity>
        )}
        {lead.contact_email && (
          <TouchableOpacity onPress={() => Linking.openURL(`mailto:${lead.contact_email}`)}>
            <Text style={styles.contactEmail}>✉️ {lead.contact_email}</Text>
          </TouchableOpacity>
        )}
      </View>

      {lead.private_notes && (
        <View style={styles.notesBox}>
          <Text style={styles.notesText}>{lead.private_notes}</Text>
        </View>
      )}

      <Text style={styles.purchasedAt}>
        Unlocked {new Date(lead.purchased_at).toLocaleDateString()}
      </Text>
    </View>
  );
}

export function MyLeadsScreen() {
  const [leads,     setLeads]     = useState<PurchasedLead[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try { setLeads(await leadsApi.getPurchased()); } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }

  // Reload every time the tab comes into focus so that a lead unlocked on the
  // Live Feed tab is immediately visible here without a manual pull-to-refresh.
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
    <ScreenShell title="My Leads" subtitle={`${leads.length} lead${leads.length !== 1 ? 's' : ''} unlocked`} scrollable={false}>
      <FlatList
        data={leads}
        keyExtractor={(l) => l.purchase_id}
        renderItem={({ item }) => <PurchasedCard lead={item} />}
        onRefresh={() => { setRefreshing(true); load(); }}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={leads.length === 0 ? { flex: 1 } : { paddingBottom: Spacing.xxl }}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingTop: 80 }}>
            <Text style={{ fontSize: 48 }}>🔒</Text>
            <Text style={{ fontSize: FontSize.md, fontWeight: '600', color: Colors.foreground }}>No unlocked leads yet</Text>
            <Text style={{ fontSize: FontSize.sm, color: Colors.muted }}>Go to Live Feed to unlock your first lead.</Text>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  category:   { fontSize: FontSize.base, fontWeight: '700', color: Colors.foreground },
  jobType:    { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  location:   { fontSize: FontSize.xs, color: Colors.muted },
  price:      { fontSize: FontSize.md, fontWeight: '700', color: Colors.foreground, textAlign: 'right', fontVariant: ['tabular-nums'] },
  unlockedLabel: { fontSize: FontSize.xs, color: Colors.accent, textAlign: 'right', marginTop: 2 },
  contactBox: {
    backgroundColor: Colors.panel2,
    borderRadius: Radius.md,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.22)',
    gap: 5,
  },
  contactLabel: { fontSize: FontSize.xs - 1, fontWeight: '700', letterSpacing: 1, color: Colors.accent, textTransform: 'uppercase' },
  contactName:  { fontSize: FontSize.base, fontWeight: '600', color: Colors.foreground },
  contactPhone: { fontSize: FontSize.sm, color: Colors.accent2 },
  contactEmail: { fontSize: FontSize.sm, color: Colors.accent },
  notesBox: {
    backgroundColor: Colors.panel2,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesText:   { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  purchasedAt: { fontSize: FontSize.xs, color: Colors.muted },
});
