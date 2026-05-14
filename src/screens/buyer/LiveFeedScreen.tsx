import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Linking,
} from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { leadsApi, Lead, BuyerLocation } from '@/lib/api';
import { LeadCard }    from '@/components/LeadCard';
import { ScreenShell } from '@/components/ScreenShell';
import { Colors, FontSize, Spacing, Radius } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';
import Constants from 'expo-constants';

const WEB_APP = (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://leadco-marketplace-p5zj.vercel.app';

export function LiveFeedScreen() {
  const { profile, refreshProfile, isGuest, signOut } = useAuth();
  const [leads,         setLeads]        = useState<Lead[]>([]);
  const [loading,       setLoading]      = useState(true);
  const [refreshing,    setRefreshing]   = useState(false);
  const [unlocking,     setUnlocking]    = useState<string | null>(null);
  const [error,         setError]        = useState<string | null>(null);
  const [buyerLocation, setBuyerLocation] = useState<BuyerLocation>(null);

  // Request location permission once on mount.
  // We ask softly — if denied, the feed still works without distance badges.
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setBuyerLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } catch {
        // Location unavailable — feed works fine without it
      }
    })();
  }, []);

  async function load(silent = false, loc?: BuyerLocation) {
    if (!silent) setLoading(true);
    try {
      const data = await leadsApi.getLive(loc ?? buyerLocation ?? undefined);
      setLeads(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Re-fetch when location becomes available
  useEffect(() => {
    load(false, buyerLocation ?? undefined);
  }, [buyerLocation]);

  useEffect(() => {
    const channel = supabase
      .channel('leads-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => load(true))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function handleUnlock(lead: Lead) {
    setUnlocking(lead.id);
    try {
      await leadsApi.unlock(lead.id);
      await refreshProfile();   // update credit balance
      await load(true);
    } catch (e: any) {
      if (e.message === 'insufficient_credits') {
        // No credits — send them straight to the website to pay for this lead
        await Linking.openURL(`${WEB_APP}/leads/${lead.id}`);
      } else {
        setError(e.message);
      }
    } finally {
      setUnlocking(null);
    }
  }

  if (loading) {
    return (
      <ScreenShell scrollable={false}>
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.orange} size="large" />
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title="Live Feed"
      subtitle="New leads in real time"
      scrollable={false}
      rightElement={
        <View style={styles.liveDot}>
          <View style={styles.dot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      }
    >
      {/* ── Guest banner ───────────────────────────────────────────── */}
      {isGuest && (
        <TouchableOpacity
          style={styles.guestBanner}
          onPress={() => { signOut(); }}
          activeOpacity={0.8}
        >
          <Text style={styles.guestBannerText}>
            👋 Browsing as guest — <Text style={{ fontWeight: '700', textDecorationLine: 'underline' }}>Sign in to unlock leads</Text>
          </Text>
        </TouchableOpacity>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={leads}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => (
          <LeadCard
            lead={item}
            onUnlock={isGuest ? undefined : () => handleUnlock(item)}
            unlocking={unlocking === item.id}
          />
        )}
        onRefresh={() => { setRefreshing(true); load(); }}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={leads.length === 0 ? styles.emptyContainer : { paddingBottom: Spacing.xxl }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No live leads right now</Text>
            <Text style={styles.emptyDesc}>Pull down to refresh, or check back soon.</Text>
          </View>
        }
      />

    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  liveDot:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: {
    width: 7, height: 7, borderRadius: 99,
    backgroundColor: Colors.accent2,
    shadowColor: Colors.accent2, shadowRadius: 4, shadowOpacity: 0.8, elevation: 3,
  },
  liveText:   { fontSize: FontSize.xs, fontWeight: '700', color: Colors.accent2, letterSpacing: 1 },
  errorBanner: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.30)',
    borderRadius: 10,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  errorText:    { fontSize: FontSize.sm, color: Colors.danger },
  emptyContainer: { flex: 1 },
  emptyWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingTop: Spacing.xxl },
  emptyIcon:    { fontSize: 48 },
  emptyTitle:   { fontSize: FontSize.md, fontWeight: '600', color: Colors.foreground },
  emptyDesc:    { fontSize: FontSize.sm, color: Colors.muted, textAlign: 'center' },

  // ── Guest banner ────────────────────────────────────────────────────────
  guestBanner: {
    backgroundColor: 'rgba(129,140,248,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.35)',
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  guestBannerText: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    textAlign: 'center',
  },
});
