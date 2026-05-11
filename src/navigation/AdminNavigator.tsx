import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { ScreenShell } from '@/components/ScreenShell';
import { AccountScreen } from '@/screens/shared/AccountScreen';
import { Colors, FontSize, Spacing, Radius, Shadow } from '@/theme';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

function AdminOverviewScreen() {
  const [data, setData]       = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getOverview()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <ScreenShell scrollable={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.orange} size="large" />
        </View>
      </ScreenShell>
    );
  }

  const stats = [
    { label: 'Total Leads',    key: 'totalLeads'   },
    { label: 'Live Now',       key: 'liveLeads'    },
    { label: 'Pending Review', key: 'pendingLeads' },
    { label: 'Total Users',    key: 'totalUsers'   },
    { label: 'Total Sold',     key: 'soldLeads'    },
    { label: 'Revenue',        key: 'revenueFormatted' },
  ];

  return (
    <ScreenShell title="Admin" subtitle="Platform overview">
      <View style={styles.grid}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statValue}>{String(data?.[s.key] ?? '—')}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </ScreenShell>
  );
}

function AdminLeadsScreen() {
  const [leads,   setLeads]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getLeads('draft')
      .then(setLeads)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
    <ScreenShell title="Review Queue" subtitle={`${leads.length} leads pending`}>
      {leads.map((lead) => (
        <View key={lead.id} style={styles.reviewCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reviewCategory}>{lead.service_category}</Text>
            <Text style={styles.reviewSub}>{lead.job_type} · {lead.city}, {lead.state}</Text>
            {lead.public_summary && (
              <Text style={styles.reviewSummary} numberOfLines={2}>{lead.public_summary}</Text>
            )}
          </View>
          <View style={styles.reviewActions}>
            <Text
              style={styles.approveBtn}
              onPress={() => adminApi.reviewLead(lead.id, 'approve').then(() => setLeads(ls => ls.filter(l => l.id !== lead.id)))}
            >✓</Text>
            <Text
              style={styles.rejectBtn}
              onPress={() => adminApi.reviewLead(lead.id, 'reject').then(() => setLeads(ls => ls.filter(l => l.id !== lead.id)))}
            >✕</Text>
          </View>
        </View>
      ))}
      {leads.length === 0 && (
        <View style={{ alignItems: 'center', paddingTop: 60, gap: Spacing.sm }}>
          <Text style={{ fontSize: 40 }}>✅</Text>
          <Text style={{ fontSize: FontSize.md, color: Colors.foreground, fontWeight: '600' }}>All clear!</Text>
          <Text style={{ fontSize: FontSize.sm, color: Colors.muted }}>No leads pending review.</Text>
        </View>
      )}
    </ScreenShell>
  );
}

export function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor:  Colors.panel,
          borderTopColor:   'rgba(249,115,22,0.28)',
          borderTopWidth:   1,
          paddingBottom:    8,
          height:           62,
        },
        tabBarActiveTintColor:   Colors.orange,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: { fontSize: FontSize.xs - 1, fontWeight: '600', marginTop: -2 },
      }}
    >
      <Tab.Screen
        name="Overview"
        component={AdminOverviewScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} /> }}
      />
      <Tab.Screen
        name="Review"
        component={AdminLeadsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" focused={focused} /> }}
      />
      <Tab.Screen
        name="AdminAccount"
        component={AccountScreen}
        options={{ title: 'Account', tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard: {
    width: '47%',
    backgroundColor: Colors.panel,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderOrange,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    ...Shadow.card,
  },
  statValue: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.orange },
  statLabel: { fontSize: FontSize.xs, color: Colors.muted, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
  reviewCard: {
    flexDirection: 'row',
    backgroundColor: Colors.panel,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderOrange,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  reviewCategory: { fontSize: FontSize.base, fontWeight: '700', color: Colors.foreground },
  reviewSub:      { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  reviewSummary:  { fontSize: FontSize.xs, color: Colors.muted, marginTop: 4, lineHeight: 16 },
  reviewActions:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  approveBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(129,140,248,0.15)',
    borderWidth: 1, borderColor: 'rgba(129,140,248,0.35)',
    textAlign: 'center', lineHeight: 36,
    fontSize: FontSize.md, color: Colors.accent, fontWeight: '700',
  },
  rejectBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.35)',
    textAlign: 'center', lineHeight: 36,
    fontSize: FontSize.md, color: Colors.danger, fontWeight: '700',
  },
});
