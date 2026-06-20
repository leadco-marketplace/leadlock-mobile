import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { providerApi, ProviderLead } from '@/lib/api';
import { ScreenShell } from '@/components/ScreenShell';
import { Button }  from '@/components/Button';
import { Input }   from '@/components/Input';
import { Colors, FontSize, Spacing, Radius, Shadow } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

function formatPrice(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  draft:     { bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.35)',  text: '#fbbf24' },
  available: { bg: 'rgba(34,211,238,0.10)',  border: 'rgba(34,211,238,0.35)',  text: '#22d3ee' },
  reserved:  { bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.35)',  text: '#fbbf24' },
  sold:      { bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.35)', text: '#818cf8' },
  archived:  { bg: 'rgba(100,116,139,0.10)',  border: 'rgba(100,116,139,0.25)',  text: '#94a3b8' },
  invalid:   { bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.35)', text: Colors.danger },
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Under Review', available: 'Live', reserved: 'Reserved',
  sold: 'Sold ✓', archived: 'Archived', invalid: 'Invalid',
};

interface EditPriceSheetProps {
  lead: ProviderLead;
  onClose: () => void;
  onSaved: (id: string, cents: number) => void;
}

function EditPriceSheet({ lead, onClose, onSaved }: EditPriceSheetProps) {
  useTheme();
  const [dollars, setDollars] = useState((lead.price_cents / 100).toFixed(2));
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const newCents = Math.round(parseFloat(dollars || '0') * 100);

  async function save() {
    if (!newCents || newCents <= 0) { setError('Enter a valid price.'); return; }
    setError(null); setLoading(true);
    try {
      await providerApi.updatePrice(lead.id, newCents);
      onSaved(lead.id, newCents);
      onClose();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <View style={sheet.overlay}>
      <View style={[sheet.card, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange }]}>
        <Text style={[sheet.title, { color: Colors.foreground }]}>Update Price</Text>
        <Text style={[sheet.sub, { color: Colors.muted }]}>{lead.service_category} — {lead.job_type}</Text>
        <Input
          label="Your asking price ($)"
          value={dollars}
          onChangeText={setDollars}
          keyboardType="decimal-pad"
        />
        {error && <Text style={{ color: Colors.danger, fontSize: FontSize.sm }}>{error}</Text>}
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <Button label="Cancel" onPress={onClose} variant="secondary" style={{ flex: 1 }} />
          <Button label="Save" onPress={save} loading={loading} style={{ flex: 1 }} />
        </View>
      </View>
    </View>
  );
}

const sheet = StyleSheet.create({
  overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end', zIndex: 50 },
  card:    { backgroundColor: Colors.panel, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, borderWidth: 1, borderColor: Colors.borderOrange, padding: Spacing.lg, gap: Spacing.md },
  title:   { fontSize: FontSize.lg, fontWeight: '700', color: Colors.foreground },
  sub:     { fontSize: FontSize.sm, color: Colors.muted },
});

function SubmissionCard({
  lead,
  onEdit,
  onDelete,
}: {
  lead: ProviderLead;
  onEdit: () => void;
  onDelete: () => void;
}) {
  useTheme();
  const sc = STATUS_COLORS[lead.status] ?? STATUS_COLORS.archived;
  const canEditLead = ['draft', 'available'].includes(lead.status);

  // Choose the most relevant date label
  const dateLabel = lead.status === 'sold'      ? 'Sold'      :
                    lead.status === 'available'  ? 'Live'      :
                    lead.status === 'draft'      ? 'Submitted' : 'Updated';
  const dateStr   = lead.sold_at ?? lead.published_at ?? lead.created_at;

  return (
    <View style={[styles.card, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange, shadowColor: Colors.glowColor }]}>
      <View style={styles.cardRow}>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[styles.category, { color: Colors.foreground }]}>{lead.service_category}</Text>
          <Text style={[styles.jobType, { color: Colors.textSecondary }]}>{lead.job_type}</Text>

          {/* Lead ID badge — same Option B style as Live Feed */}
          {lead.lead_code && (
            <View style={styles.leadIdRow}>
              <Text style={styles.leadIdLabel}>LEAD ID</Text>
              <View style={styles.leadIdPill}>
                <Text style={styles.leadIdCode}>#{lead.lead_code}</Text>
              </View>
            </View>
          )}

          <Text style={[styles.location, { color: Colors.muted }]}>
            {lead.nationwide ? '🌐 Nationwide' : `${lead.city}, ${lead.state}`}
          </Text>

          {/* Date line */}
          {dateStr && (
            <Text style={[styles.dateText, { color: Colors.muted }]}>{dateLabel} · {formatDate(dateStr)}</Text>
          )}
        </View>

        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View style={[styles.badge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <Text style={[styles.badgeText, { color: sc.text }]}>{STATUS_LABELS[lead.status] ?? lead.status}</Text>
          </View>
          <Text style={[styles.price, { color: Colors.foreground }]}>{formatPrice(lead.price_cents)}</Text>
        </View>
      </View>

      {canEditLead && (
        <View style={styles.actions}>
          <Button label="Edit Price" onPress={onEdit} variant="secondary" style={{ flex: 1 }} />
          <Button label="Delete" onPress={onDelete} variant="danger" style={{ flex: 1 }} />
        </View>
      )}
    </View>
  );
}

export function MySubmissionsScreen({ navigation }: any) {
  useTheme();
  const [leads,      setLeads]      = useState<ProviderLead[]>([]);
  const [earnings,   setEarnings]   = useState(0);
  const [soldCount,  setSoldCount]  = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editTarget, setEditTarget] = useState<ProviderLead | null>(null);

  async function load(silent = false) {
    if (!silent) setLoading(prev => prev);   // keep existing loading state on focus refresh
    try {
      const data = await providerApi.getSubmissions();
      setLeads(data.leads);
      setEarnings(data.totalEarningsCents);
      setSoldCount(data.soldCount);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }

  // Refresh every time the screen comes into focus — this ensures newly
  // purchased leads appear immediately without the user having to pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  function handleDelete(lead: ProviderLead) {
    Alert.alert(
      'Delete Lead',
      `Delete your ${lead.service_category} lead in ${lead.city}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await providerApi.deleteLead(lead.id);
              setLeads(ls => ls.filter(l => l.id !== lead.id));
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  }

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
    <>
      <ScreenShell title="My Submissions" subtitle="Manage your leads" scrollable={false}>
        {/* Earnings card */}
        <LinearGradient
          colors={['rgba(249,115,22,0.12)', 'rgba(251,191,36,0.06)']}
          style={styles.earningsCard}
        >
          <View>
            <Text style={[styles.earningsLabel, { color: Colors.muted }]}>Total Earnings</Text>
            <Text style={[styles.earningsValue, { color: Colors.foreground }]}>{formatPrice(earnings)}</Text>
            <Text style={[styles.earningsSub,   { color: Colors.muted }]}>From {soldCount} sold lead{soldCount !== 1 ? 's' : ''}</Text>
          </View>
          <Button
            label="+ Submit Lead"
            onPress={() => navigation.navigate('SubmitLead')}
            style={{ alignSelf: 'flex-start' }}
          />
        </LinearGradient>

        {/* Stat pills */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total',         value: leads.length },
            { label: 'Live',          value: leads.filter(l => l.status === 'available').length },
            { label: 'Sold',          value: soldCount },
            { label: 'Under Review',  value: leads.filter(l => l.status === 'draft').length },
          ].map(s => (
            <View key={s.label} style={[styles.statPill, { backgroundColor: Colors.panel }]}>
              <Text style={[styles.statValue, { color: Colors.orange }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: Colors.muted }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Lead list */}
        <FlatList
          data={leads}
          keyExtractor={(l) => l.id}
          renderItem={({ item }) => (
            <SubmissionCard
              lead={item}
              onEdit={() => setEditTarget(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          onRefresh={() => { setRefreshing(true); load(); }}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={leads.length === 0 ? { flex: 1 } : { paddingBottom: Spacing.xxl }}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', paddingTop: 60, gap: Spacing.sm }}>
              <Text style={{ fontSize: 40 }}>📋</Text>
              <Text style={{ fontSize: FontSize.md, fontWeight: '600', color: Colors.foreground }}>No leads yet</Text>
              <Text style={{ fontSize: FontSize.sm, color: Colors.muted }}>Tap "+ Submit Lead" to get started.</Text>
            </View>
          }
        />
      </ScreenShell>

      {editTarget && (
        <EditPriceSheet
          lead={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(id, cents) => {
            setLeads(ls => ls.map(l => l.id === id ? { ...l, price_cents: cents } : l));
            setEditTarget(null);
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  earningsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.35)',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  earningsLabel: { fontSize: FontSize.xs, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  earningsValue: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.foreground, fontVariant: ['tabular-nums'] },
  earningsSub:   { fontSize: FontSize.xs, color: Colors.muted },
  statsRow:      { flexDirection: 'row', gap: Spacing.sm },
  statPill: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.panel, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: 'rgba(249,115,22,0.25)',
  },
  statValue:  { fontSize: FontSize.lg, fontWeight: '700', color: Colors.orange },
  statLabel:  { fontSize: FontSize.xs - 1, color: Colors.muted, marginTop: 2 },
  card: {
    backgroundColor: Colors.panel,
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderColor: Colors.borderOrange,
    padding: Spacing.md,
    marginBottom: Spacing.sm + 4,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  cardRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  category:   { fontSize: FontSize.base, fontWeight: '700', color: Colors.foreground },
  jobType:    { fontSize: FontSize.xs, color: Colors.textSecondary },
  location:   { fontSize: FontSize.xs, color: Colors.muted },
  dateText:   { fontSize: FontSize.xs - 1, color: Colors.muted },
  badge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm, borderWidth: 1 },
  badgeText:  { fontSize: FontSize.xs - 1, fontWeight: '700' },
  price:      { fontSize: FontSize.md, fontWeight: '700', color: Colors.foreground, fontVariant: ['tabular-nums'] },
  actions:    { flexDirection: 'row', gap: Spacing.sm },
  // ── Lead ID row ──────────────────────────────────────────────────────────
  leadIdRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  leadIdLabel: { fontSize: FontSize.xs - 2, fontWeight: '700', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  leadIdPill: {
    backgroundColor: 'rgba(249,115,22,0.12)',
    borderWidth:      1,
    borderColor:      'rgba(249,115,22,0.45)',
    borderRadius:     5,
    paddingHorizontal: 6,
    paddingVertical:   1,
  },
  leadIdCode: { fontSize: FontSize.xs, color: '#f97316', fontFamily: 'Courier', fontWeight: '700', letterSpacing: 1 },
});
