import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Linking, Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { notificationEvents } from '@/lib/notificationEvents';
import { StackActions } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import { leadsApi, Lead, BuyerLocation } from '@/lib/api';
import { LeadCard }      from '@/components/LeadCard';
import { UnlockModal }   from '@/components/UnlockModal';
import { ScreenShell }   from '@/components/ScreenShell';
import { Colors, FontSize, Spacing, Radius, Shadow } from '@/theme';
import { useTheme }      from '@/contexts/ThemeContext';
import { useAuth }       from '@/contexts/AuthContext';
import Constants from 'expo-constants';

const WEB_APP = (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://leadco-marketplace-p5zj.vercel.app';

// Route params this screen accepts (from push-notification tap or deep link)
type LiveFeedRouteParams = { highlightLeadId?: string };

export function LiveFeedScreen() {
  const { profile, refreshProfile, isGuest, signOut } = useAuth();
  const navigation  = useNavigation<any>();
  const route       = useRoute<RouteProp<{ LiveFeed: LiveFeedRouteParams }, 'LiveFeed'>>();

  useTheme(); // re-render stat cards on theme change

  const [leads,         setLeads]        = useState<Lead[]>([]);
  const [loading,       setLoading]      = useState(true);
  const [refreshing,    setRefreshing]   = useState(false);
  const [unlocking,     setUnlocking]    = useState<string | null>(null);
  const [error,         setError]        = useState<string | null>(null);
  const [buyerLocation, setBuyerLocation] = useState<BuyerLocation>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [modalLead,     setModalLead]    = useState<Lead | null>(null);

  const flatListRef = useRef<FlatList<Lead>>(null);
  // Always holds the latest `load` so the realtime subscription isn't stale
  const loadRef = useRef(load);
  // Tracks whether we've already scrolled to a given notification lead so the
  // scroll doesn't repeat every time the 10-second feed poll refreshes `leads`.
  const highlightScrolledRef = useRef<string | null>(null);
  // Holds the active 5-minute clear timer so we can reset it on a new notification
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Always points to the latest applyHighlight so the event subscription
  // (set up once with [] deps) never captures a stale closure.
  const applyHighlightRef = useRef<(leadId: string) => void>(() => {});

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

  // Keep applyHighlightRef current so the subscription (created once) always
  // calls the latest version — avoids stale-closure bugs with buyerLocation / load.
  applyHighlightRef.current = (leadId: string) => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    setHighlightedId(leadId);
    highlightScrolledRef.current = null; // allow scroll to re-fire for this ID
    load(false, buyerLocation ?? undefined);
    highlightTimerRef.current = setTimeout(() => setHighlightedId(null), 5 * 60 * 1000);
  };

  // Refresh feed whenever the tab comes into focus (catches leads sold while away).
  // Also consumes any pending highlight stored before the screen mounted (cold-start).
  useFocusEffect(
    React.useCallback(() => {
      load(true, buyerLocation ?? undefined);
      // Pick up a highlight that was emitted before this screen got focus
      // (cold-start: emit fires before LiveFeedScreen subscribes).
      const pending = notificationEvents.consume();
      if (pending) applyHighlightRef.current(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [buyerLocation])
  );

  // Keep loadRef current so the realtime callback never captures a stale closure
  useEffect(() => { loadRef.current = load; });

  // Realtime lead feed updates — uses loadRef so it always calls the latest load.
  // The postgres_changes subscription requires the `leads` table to be in
  // Supabase's realtime publication and the buyer to have SELECT access.
  // If those conditions aren't met events are silently dropped, so we also
  // run a 30-second polling fallback to guarantee the feed stays current.
  useEffect(() => {
    const channel = supabase
      .channel('leads-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => loadRef.current(true))
      .subscribe();

    // Polling fallback: refresh every 30 s in case realtime events are blocked.
    // Supabase realtime handles instant updates; this is just a safety net.
    // (Was 10 s — reduced to cut unnecessary re-renders during high-lead periods.)
    const poll = setInterval(() => loadRef.current(true), 30_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Subscribe to notification events (runs once on mount) ────────────────
  // Fires applyHighlightRef.current whenever the user taps a push notification
  // and the screen is already mounted — avoids the React Navigation param
  // update problem where navigate() to an already-active tab is a silent no-op.
  useEffect(() => {
    return notificationEvents.subscribe((leadId) => {
      applyHighlightRef.current(leadId);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sort: available/reserved first, recently sold sinks to bottom ─────────
  // Declared as useMemo (a hook) so it is always initialised before any early
  // return — this prevents the temporal-dead-zone ReferenceError that would
  // occur if the useEffect below ran while `loading` was true (which would have
  // caused the component to early-return before the old const declaration).
  const sortedLeads = useMemo(
    () => [...leads].sort((a, b) => {
      const aSold = a.status === 'sold' ? 1 : 0;
      const bSold = b.status === 'sold' ? 1 : 0;
      return aSold - bSold;
    }),
    [leads],
  );

  // ── Scroll to highlighted lead once (does NOT reset the highlight) ────────
  // Re-runs whenever leads or highlightedId update (needed to find the index)
  // but scrolls only ONCE per notification ID via highlightScrolledRef — so the
  // 10-second feed poll never triggers a duplicate scroll.
  useEffect(() => {
    if (!highlightedId || leads.length === 0 || loading) return;
    if (highlightScrolledRef.current === highlightedId) return; // already scrolled

    const idx = sortedLeads.findIndex((l) => l.id === highlightedId);
    if (idx < 0) {
      setError('The lead from your notification is no longer available in the feed.');
      const t = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(t);
    }

    highlightScrolledRef.current = highlightedId; // mark done — don't scroll again

    const scrollTimer = setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.3 });
    }, 400);
    return () => clearTimeout(scrollTimer);
  }, [leads, loading, highlightedId]);

  // ── Memoised renderItem ────────────────────────────────────────────────────
  // useCallback prevents a new function reference on every render, which would
  // bypass React.memo inside LeadCard and force all cards to re-render.
  const renderItem = useCallback(({ item }: { item: Lead }) => (
    <LeadCard
      lead={item}
      onUnlock={isGuest || profile?.role === 'admin' || item.status === 'sold' ? undefined : () => handleUnlock(item)}
      unlocking={unlocking === item.id}
      highlighted={highlightedId === item.id}
    />
  // handleUnlock and highlightedId change rarely; unlocking changes per-unlock action
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [isGuest, profile?.role, unlocking, highlightedId]);

  // ── Unlock handler ─────────────────────────────────────────────────────────
  function handleUnlock(lead: Lead) {
    setModalLead(lead);  // open the payment modal
  }

  async function proceedUnlock(lead: Lead) {
    setUnlocking(lead.id);
    try {
      const { purchase_id } = await leadsApi.unlock(lead.id);
      await refreshProfile();   // update credit balance
      // Pass purchase_id so LeadDetailScreen can look up the specific purchase
      // directly rather than scanning all purchases — avoids the 6-second polling
      // race that showed "not unlocked" when the DB write was briefly invisible.
      // StackActions.push always creates a fresh screen instance in the parent
      // Stack navigator regardless of the current Tab context. navigation.push()
      // alone is a Stack-only method and is not available on Tab navigation
      // objects — calling it from here would fail silently and fall back to the
      // deduplicating navigate(), which is exactly the bug we're fixing.
      navigation.dispatch(StackActions.push('LeadDetail', { leadId: lead.id, purchaseId: purchase_id }));
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
            setLeads(prev => prev.map(l =>
              l.id === lead.id ? { ...l, status: 'sold', sold_at: new Date().toISOString() } : l
            ));
            Alert.alert(
              '🔒 Lead Just Sold',
              'Another buyer purchased this lead a moment before you.',
              [{ text: 'OK' }]
            );
            load(true);
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
        setLeads(prev => prev.map(l =>
          l.id === lead.id ? { ...l, status: 'sold', sold_at: new Date().toISOString() } : l
        ));
        Alert.alert(
          '🔒 Lead Just Sold',
          'Another buyer purchased this lead a moment before you.',
          [{ text: 'OK' }]
        );
        load(true);
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
    <>
    <ScreenShell
      title="Live Feed"
      subtitle="New leads in real time"
      scrollable={false}
      rightElement={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          {profile && (
            <View style={styles.creditPill}>
              <Text style={styles.creditText}>
                💳 ${((profile.credits_cents ?? 0) / 100).toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.liveDot}>
            <View style={styles.dot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
      }
    >
      {/* ── Stats bar ──────────────────────────────────────────────── */}
      {leads.length > 0 && (
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange, shadowColor: Colors.glowColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.55, shadowRadius: 18, elevation: 12 }]}>
            <Text style={styles.statLabel}>AVAILABLE</Text>
            <Text style={[styles.statValue, { color: Colors.foreground }]}>{availableCount}</Text>
            <Text style={[styles.statSub, { color: Colors.muted }]}>leads live</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange, shadowColor: Colors.glowColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.55, shadowRadius: 18, elevation: 12 }]}>
            <Text style={styles.statLabel}>AVG PRICE</Text>
            <Text style={[styles.statValue, { color: Colors.foreground }]}>${Math.round(avgPrice / 100)}</Text>
            <Text style={[styles.statSub, { color: Colors.muted }]}>in your areas</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange, shadowColor: Colors.glowColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.55, shadowRadius: 18, elevation: 12 }]}>
            <Text style={styles.statLabel}>NEWEST</Text>
            <Text numberOfLines={1} style={[styles.statValue, { fontSize: FontSize.sm, color: Colors.foreground }]}>
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
        data={sortedLeads}
        keyExtractor={(l) => l.id}
        renderItem={renderItem}
        onRefresh={() => { setRefreshing(true); load(); }}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={leads.length === 0 ? styles.emptyContainer : { paddingBottom: Spacing.xxl }}
        // ── Scroll performance ─────────────────────────────────────────────
        // removeClippedSubviews: unmount cards far off-screen from the native view tree
        removeClippedSubviews={true}
        // Render 8 cards per JS batch so the thread isn't locked painting all at once
        maxToRenderPerBatch={8}
        // Keep 5 "screens" of cards in memory (2 above + 2 below viewport + current)
        windowSize={5}
        // Only mount the first 10 cards synchronously on initial load
        initialNumToRender={10}
        // ── Scroll-to-index fallback ───────────────────────────────────────
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

    {/* ── Unlock payment modal ──────────────────────────── */}
    <UnlockModal
      lead={modalLead}
      visible={modalLead !== null}
      onCancel={() => setModalLead(null)}
      onConfirm={() => {
        const lead = modalLead!;
        setModalLead(null);
        proceedUnlock(lead);
      }}
    />
    </>
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
    borderRadius: Radius.lg,
    borderWidth: 2,
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
  creditPill: {
    backgroundColor: 'rgba(129,140,248,0.15)',
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.35)',
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
  },
  creditText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.accent,
    fontVariant: ['tabular-nums'],
  },
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
