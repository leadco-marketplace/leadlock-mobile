import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
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

// AI call-analysis outcome → provider-facing label + color
const OUTCOME_META: Record<string, { label: string; color: string; bg: string }> = {
  job_booked:            { label: '✓ Job Booked',        color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  appointment_scheduled: { label: '📅 Appt Scheduled',   color: '#34d399', bg: 'rgba(52,211,153,0.10)' },
  connected:             { label: '💬 Spoke To Customer', color: '#22d3ee', bg: 'rgba(34,211,238,0.10)' },
  callback_requested:    { label: '↩︎ Callback Requested', color: '#fbbf24', bg: 'rgba(251,191,36,0.10)' },
  declined:              { label: 'Not Interested',       color: '#94a3b8', bg: 'rgba(148,163,184,0.10)' },
  never_requested:       { label: '🚩 Not A Real Request?', color: '#f87171', bg: 'rgba(248,113,113,0.10)' },
  voicemail:             { label: 'Voicemail',            color: '#94a3b8', bg: 'rgba(148,163,184,0.10)' },
  no_answer:             { label: 'No Answer',            color: '#94a3b8', bg: 'rgba(148,163,184,0.10)' },
};

interface EditLeadSheetProps {
  lead: ProviderLead;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Edit sheet: price (pre-sale only) + customer contact + description.
 * Contact/description stay editable AFTER the lead is sold, so a wrong
 * phone number can be corrected — the buyer is notified automatically.
 */
function EditLeadSheet({ lead, onClose, onSaved }: EditLeadSheetProps) {
  useTheme();
  const priceEditable = ['draft', 'available'].includes(lead.status);
  const [dollars, setDollars] = useState((lead.price_cents / 100).toFixed(2));
  const [name,    setName]    = useState(lead.customer_name  ?? '');
  const [phone,   setPhone]   = useState(lead.customer_phone ?? '');
  const [email,   setEmail]   = useState(lead.customer_email ?? '');
  const [summary, setSummary] = useState(lead.public_summary ?? '');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function save() {
    const newCents = Math.round(parseFloat(dollars || '0') * 100);
    if (priceEditable && (!newCents || newCents <= 0)) { setError('Enter a valid price.'); return; }
    if (!name.trim() && !phone.trim() && !email.trim()) {
      setError('At least one customer contact (name, phone, or email) is required.');
      return;
    }
    setError(null); setLoading(true);
    try {
      await providerApi.updateDetails(lead.id, {
        ...(priceEditable ? { price_cents: newCents } : {}),
        customer_name:  name.trim()  || null,
        customer_phone: phone.trim() || null,
        customer_email: email.trim() || null,
        public_summary: summary.trim() || null,
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <View style={sheet.overlay}>
      <View style={[sheet.card, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange }]}>
        <Text style={[sheet.title, { color: Colors.foreground }]}>Edit Lead Details</Text>
        <Text style={[sheet.sub, { color: Colors.muted }]}>{lead.service_category} — {lead.job_type}</Text>
        {priceEditable ? (
          <Input label="Your asking price ($)" value={dollars} onChangeText={setDollars} keyboardType="decimal-pad" />
        ) : (
          <Text style={[sheet.sub, { color: Colors.muted }]}>
            This lead is sold — the price is locked, but you can still correct the
            customer's contact details. The buyer will be notified of the fix.
          </Text>
        )}
        <Input label="Customer name"  value={name}  onChangeText={setName}  autoCapitalize="words" />
        <Input label="Customer phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Input label="Customer email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Input label="Job description" value={summary} onChangeText={setSummary} multiline />
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

          {/* AI call outcome — what happened when the buyer called */}
          {lead.last_call_outcome && OUTCOME_META[lead.last_call_outcome] && (
            <View style={[styles.outcomePill, { backgroundColor: OUTCOME_META[lead.last_call_outcome].bg, borderColor: OUTCOME_META[lead.last_call_outcome].color + '55' }]}>
              <Text style={[styles.outcomeText, { color: OUTCOME_META[lead.last_call_outcome].color }]}>
                Call Result: {OUTCOME_META[lead.last_call_outcome].label}
              </Text>
            </View>
          )}
        </View>

        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View style={[styles.badge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <Text style={[styles.badgeText, { color: sc.text }]}>{STATUS_LABELS[lead.status] ?? lead.status}</Text>
          </View>
          <Text style={[styles.price, { color: Colors.foreground }]}>{formatPrice(lead.price_cents)}</Text>
        </View>
      </View>

      {/* Edit Details is available on live AND sold leads (fix a wrong
          number after the buyer reports it); Delete only pre-sale. */}
      {(canEditLead || lead.status === 'sold') && (
        <View style={styles.actions}>
          <Button label="Edit Details" onPress={onEdit} variant="secondary" style={{ flex: 1 }} />
          {canEditLead && (
            <Button label="Delete" onPress={onDelete} variant="danger" style={{ flex: 1 }} />
          )}
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
  const [loadError,  setLoadError]  = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<ProviderLead | null>(null);

  async function load() {
    try {
      const data = await providerApi.getSubmissions();
      setLeads(data.leads ?? []);
      setEarnings(data.totalEarningsCents ?? 0);
      setSoldCount(data.soldCount ?? 0);
      setLoadError(null);
    } catch (e: any) {
      // NEVER swallow this silently — an auth/network/server failure used to
      // render as a fake "No leads yet", hiding real problems.
      setLoadError(e?.message ?? 'Network error');
    }
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
        {/* Earnings card — themed panel + orange border; money in brand
            orange so it reads correctly in dark, light, AND inner-light
            (the old translucent orange gradient went solid orange on light
            backgrounds and muddy on dark). */}
        <View style={[styles.earningsCard, { backgroundColor: Colors.panel, borderColor: 'rgba(249,115,22,0.45)', shadowColor: Colors.glowColor }]}>
          <View>
            <Text style={[styles.earningsLabel, { color: Colors.muted }]}>Total Earnings</Text>
            <Text style={[styles.earningsValue, { color: Colors.orange }]}>{formatPrice(earnings)}</Text>
            <Text style={[styles.earningsSub,   { color: Colors.muted }]}>From {soldCount} sold lead{soldCount !== 1 ? 's' : ''}</Text>
          </View>
          <Button
            label="+ Submit Lead"
            onPress={() => navigation.navigate('SubmitLead')}
            style={{ alignSelf: 'flex-start' }}
          />
        </View>

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
            loadError ? (
              <View style={{ flex: 1, alignItems: 'center', paddingTop: 60, gap: Spacing.sm, paddingHorizontal: Spacing.lg }}>
                <Text style={{ fontSize: 40 }}>⚠️</Text>
                <Text style={{ fontSize: FontSize.md, fontWeight: '600', color: Colors.foreground }}>Couldn't Load Your Leads</Text>
                <Text style={{ fontSize: FontSize.sm, color: Colors.muted, textAlign: 'center' }}>{loadError}</Text>
                <Button label="Retry" onPress={() => { setLoading(true); load(); }} style={{ marginTop: Spacing.sm }} />
              </View>
            ) : (
              <View style={{ flex: 1, alignItems: 'center', paddingTop: 60, gap: Spacing.sm }}>
                <Text style={{ fontSize: 40 }}>📋</Text>
                <Text style={{ fontSize: FontSize.md, fontWeight: '600', color: Colors.foreground }}>No leads yet</Text>
                <Text style={{ fontSize: FontSize.sm, color: Colors.muted }}>Tap "+ Submit Lead" to get started.</Text>
              </View>
            )
          }
        />
      </ScreenShell>

      {editTarget && (
        <EditLeadSheet
          lead={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            load(); // refetch — server is the source of truth after an edit
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
  jobType:    { fontSize: FontSize.xs, color: Colors.textSecondary, textTransform: 'capitalize' },
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
  // ── AI call outcome pill ──────────────────────────────────────────────────
  outcomePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginTop: 2,
  },
  outcomeText: { fontSize: FontSize.xs - 1, fontWeight: '700' },
});
