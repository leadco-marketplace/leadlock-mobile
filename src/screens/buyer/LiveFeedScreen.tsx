import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Linking, Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import { leadsApi, Lead, BuyerLocation } from '@/lib/api';
import { LeadCard }    from '@/components/LeadCard';
import { ScreenShell } from '@/components/ScreenShell';
import { Colors, FontSize, Spacing, Radius, Shadow } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';
import Constants from 'expo-constants';

const WEB_APP = (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://leadco-marketplace-p5zj.vercel.app';

// Route params this screen accepts (from push-notification tap or deep link)
type LiveFeedRouteParams = { highlightLeadId?: string };

export function LiveFeedScreen() {
  const { profile, refreshProfile, isGuest, signOut } = useAuth();
  const navigation  = useNavigation<any>();
  const route       = useRoute<RouteProp<{ LiveFeed: LiveFeedRouteParams }, 'LiveFeed'>>();

  const [leads,         setLeads]        = useState<Lead[]>([]);
  const [loading,       setLoading]      = useState(true);
  const [refreshing,    setRefreshing]   = useState(false);
  const [unlocking,     setUnlocking]    = useState<string | null>(null);
  const [error,         setError]        = useState<string | null>(null);
  const [buyerLocation, setBuyerLocation] = useState<BuyerLocation>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList<Lead>>(null);

  // ── Location permission ────────────────────────────────────────────────────
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

  // Realtime lead feed updates
  useEffect(() => {
    const channel = supabase
      .channel('leads-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => load(true))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Force reload when arriving from a push notification ──────────────────
  // When the user taps a notification, the app navigates here with
  // highlightLeadId. The lead might not be in the feed yet (realtime may not
  // have fired), so we force a fresh fetch any time the param changes.
  useEffect(() => {
    const targetId = route.params?.highlightLeadId;
    if (!targetId) return;
    load(false, buyerLocation ?? undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.highlightLeadId]);

  // ── Scroll to + highlight the target lead once feed is loaded ─────────────
  useEffect(() => {
    const targetId = route.params?.highlightLeadId;
    if (!targetId || leads.length === 0 || loading) return;

    const idx = leads.findIndex((l) => l.id === targetId);
    if (idx < 0) {
      // Lead not found — may have just been sold or not yet available.
      // Show a brief error so the user knows we tried.
      setError('The lead from your notification is no longer available in the feed.');
      const t = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(t);
    }

    setHighlightedId(targetId);

    // Give the FlatList time to finish its first layout pass
    const scrollTimer = setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.3 });
    }, 400);

    // Auto-clear the highlight after 5 seconds
    const clearTimer = setTimeout(() => setHighlightedId(null), 5000);

    return () => { clearTimeout(scrollTimer); clearTimeout(clearTimer); };
  }, [leads, loading, route.params?.highlightLeadId]);

  // ── Unlock handler ─────────────────────────────────────────────────────────
  async function handleUnlock(lead: Lead) {
    setUnlocking(lead.id);
    try {
      await leadsApi.unlock(lead.id);
      await refreshProfile();   // update credit balance
      await load(true);
      // Navigate to My Leads tab so the user immediately sees the unlocked lead.
      // MyLeadsScreen now uses useFocusEffect so it will reload when it gains focus.
      navigation.navigate('MyLeads');
    } catch (e: any) {
      if (e.message === 'insufficient_credits') {
        // Not enough credits — create a Stripe checkout for this specific lead
        // then open it in Safari. After payment, Stripe redirects to /mobile-return
        // which fires leadco://my-leads back into the app.
        try {
          const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();
          const token = session?.access_token;
          if (!token) {
            Alert.alert('Not Logged In', 'Please sign out and sign back in, then try again.');
            return;
          }

          const res = await fetch(`${WEB_APP}/api/leads/${lead.id}/mobile-unlock-checkout`, {
            method:  'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
          const body = await res.json().catch(() => ({}));

          if (res.ok && body.checkoutUrl) {
            Alert.alert(
              '💳 Add Credits to Unlock',
              'You\'ll be taken to a secure payment page. After completing payment, tap "Open LeadCo App" to return here.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Go to Payment',
                  onPress: () => Linking.openURL(body.checkoutUrl).catch((err: any) =>
                    Alert.alert('Could Not Open Browser', err?.message ?? String(err))
                  ),
                },
              ]
            );
          } else if (body.error === 'already_sold') {
            setError('This lead was just purchased by someone else.');
            await load(true);
          } else {
            Alert.alert(
              '⚠️ Checkout Error',
              `Could not create checkout session.\n\nStatus: ${res.status}\nError: ${body.error ?? 'unknown'}`
            );
          }
        } catch (checkoutErr: any) {
          Alert.alert(
            '⚠️ Network Error',
            `Could not reach the server.\n\n${checkoutErr?.message ?? String(checkoutErr)}`
          );
        }
      } else if (e.message === 'already_sold') {
        setError('This lead was just sold. Refreshing the feed…');
        await load(true);
      } else {
        Alert.alert('⚠️ Unlock Error', e.message ?? 'Something went wrong. Please try again.');
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

  // ── Stats derived from current feed ───────────────────────────────────────
  const availableCount = leads.filter(l => l.status === 'available').length;
  const avgPrice = leads.length > 0
    ? leads.reduce((sum, l) => sum + (l.buyer_price_cents ?? Math.round(l.price_cents * 1.125)), 0) / leads.length
    : 0;
  const newestLead = leads.length > 0
    ? leads.reduce((a, b) =>
        new Date(a.published_at ?? a.created_at) > new Date(b.published_at ?? b.created_at) ? a : b
      )
    : null;

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
      {/* ── Stats bar ──────────────────────────────────────────────── */}
      {leads.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>AVAILABLE</Text>
            <Text style={styles.statValue}>{availableCount}</Text>
            <Text style={styles.statSub}>leads live</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>AVG PRICE</Text>
            <Text style={styles.statValue}>${Math.round(avgPrice / 100)}</Text>
            <Text style={styles.statSub}>in your areas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>NEWEST</Text>
            <Text numberOfLines={1} style={[styles.statValue, { fontSize: FontSize.sm }]}>
              {newestLead?.service_category ?? '—'}
            </Text>
            <Text style={styles.statSub}>just posted</Text>
          </View>
        </View>
      )}

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
        ref={flatListRef}
        data={leads}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => (
          <LeadCard
            lead={item}
            onUnlock={isGuest ? undefined : () => handleUnlock(item)}
            unlocking={unlocking === item.id}
            highlighted={highlightedId === item.id}
          />
        )}
        onRefresh={() => { setRefreshing(true); load(); }}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={leads.length === 0 ? styles.emptyContainer : { paddingBottom: Spacing.xxl }}
        // Graceful fallback if the item isn't measured yet (e.g. FlatList not fully rendered)
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: true,
          });
        }}
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

  // Stats bar
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.panel,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderOrange,
    padding: Spacing.sm + 2,
    gap: 2,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FontSize.xs - 2,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.orange,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.foreground,
    fontVariant: ['tabular-nums'],
  },
  statSub: {
    fontSize: FontSize.xs - 2,
    color: Colors.muted,
  },
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
