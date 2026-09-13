import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { providerApi, reachApi, ProviderLead } from '@/lib/api';
import { ScreenShell } from '@/components/ScreenShell';
import { useTheme } from '@/contexts/ThemeContext';
import { DarkColors, LightColors, InnerLightColors, FontSize, Spacing, Radius } from '@/theme';

type Palette = typeof DarkColors;

/**
 * Provider "Messages" inbox — lists leads that have unread reachability
 * messages from a buyer. Taps open the per-lead ReachChat. Replaces the old
 * Signals tab. Theme-reactive via makeStyles(C).
 */
export function ReachInboxScreen({ navigation }: any) {
  const { mode } = useTheme();
  const C: Palette = mode === 'light' ? LightColors : mode === 'inner-light' ? InnerLightColors : DarkColors;
  const s = useMemo(() => makeStyles(C), [mode]);

  const [rows, setRows]   = useState<{ lead: ProviderLead; unread: number }[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [unread, subs] = await Promise.all([
        reachApi.unread(),
        providerApi.getSubmissions(),
      ]);
      const byLead = unread.byLeadId ?? {};
      const leads = subs.leads ?? [];
      const next = leads
        .filter(l => (byLead[l.id] ?? 0) > 0)
        .map(l => ({ lead: l, unread: byLead[l.id] }));
      setRows(next);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) {
    return (
      <ScreenShell title="Messages" subtitle="Buyer reachability chats" scrollable={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={C.orange} size="large" />
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Messages" subtitle="Buyer reachability chats" scrollable={false}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.lead.id}
        onRefresh={() => { setRefreshing(true); load(); }}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={rows.length === 0 ? { flex: 1 } : { paddingBottom: Spacing.xxl }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.row}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ReachChat', { leadId: item.lead.id, leadCode: item.lead.lead_code })}
          >
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={s.category}>{item.lead.service_category}</Text>
              <Text style={s.sub}>
                {item.lead.lead_code ? `#${item.lead.lead_code} · ` : ''}
                {item.lead.nationwide ? '🌐 Nationwide' : `${item.lead.city}, ${item.lead.state}`}
              </Text>
            </View>
            <View style={s.unreadPill}>
              <Text style={s.unreadText}>{item.unread}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          error ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 40 }}>⚠️</Text>
              <Text style={s.emptyTitle}>Couldn't load messages</Text>
              <Text style={s.emptyBody}>{error}</Text>
            </View>
          ) : (
            <View style={s.empty}>
              <Text style={{ fontSize: 40 }}>💬</Text>
              <Text style={s.emptyTitle}>No new messages</Text>
              <Text style={s.emptyBody}>
                When a buyer taps a reachability chip on one of your leads, it shows up here.
              </Text>
            </View>
          )
        }
      />
    </ScreenShell>
  );
}

function makeStyles(C: Palette) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: C.panel, borderRadius: Radius.lg, borderWidth: 1,
      borderColor: C.borderOrange, padding: Spacing.md, marginBottom: Spacing.sm,
    },
    category: { color: C.foreground, fontSize: FontSize.base, fontWeight: '700' },
    sub: { color: C.muted, fontSize: FontSize.xs },
    unreadPill: {
      minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 7,
      alignItems: 'center', justifyContent: 'center', backgroundColor: C.orange,
    },
    unreadText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '800' },
    empty: { flex: 1, alignItems: 'center', paddingTop: 60, gap: Spacing.sm, paddingHorizontal: Spacing.lg },
    emptyTitle: { fontSize: FontSize.md, fontWeight: '600', color: C.foreground },
    emptyBody: { fontSize: FontSize.sm, color: C.muted, textAlign: 'center' },
  });
}
