import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  Modal, TouchableOpacity, Linking,
} from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { leadsApi, creditsApi, Lead, BuyerLocation } from '@/lib/api';
import { LeadCard }    from '@/components/LeadCard';
import { ScreenShell } from '@/components/ScreenShell';
import { Button }      from '@/components/Button';
import { Colors, FontSize, Spacing, Radius, Shadow } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';
import Constants from 'expo-constants';

const WEB_APP = (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://leadco-marketplace-p5zj.vercel.app';

const CREDIT_PACKAGES = [
  { label: '$25',  cents: 2500  },
  { label: '$50',  cents: 5000  },
  { label: '$100', cents: 10000 },
  { label: '$200', cents: 20000 },
];

export function LiveFeedScreen() {
  const { profile, refreshProfile } = useAuth();
  const [leads,         setLeads]        = useState<Lead[]>([]);
  const [loading,       setLoading]      = useState(true);
  const [refreshing,    setRefreshing]   = useState(false);
  const [unlocking,     setUnlocking]    = useState<string | null>(null);
  const [error,         setError]        = useState<string | null>(null);
  const [buying,        setBuying]       = useState<number | null>(null);
  const [buyerLocation, setBuyerLocation] = useState<BuyerLocation>(null);

  // Credits modal state
  const [creditsModal, setCreditsModal] = useState(false);
  const [pendingLead,  setPendingLead]  = useState<Lead | null>(null);

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
        // Show the buy credits modal instead of a raw error
        setPendingLead(lead);
        setCreditsModal(true);
      } else {
        setError(e.message);
      }
    } finally {
      setUnlocking(null);
    }
  }

  async function handleBuyCredits(cents: number) {
    setBuying(cents);
    try {
      const { checkoutUrl } = await creditsApi.buyCheckout(cents);
      setCreditsModal(false);
      await Linking.openURL(checkoutUrl);
      // After returning, refresh balance
      setTimeout(() => refreshProfile(), 2000);
    } catch (e: any) {
      setError(e.message ?? 'Checkout failed');
    } finally {
      setBuying(null);
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
            onUnlock={() => handleUnlock(item)}
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

      {/* ── Insufficient Credits Modal ─────────────────────────────────── */}
      <Modal
        visible={creditsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCreditsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <Text style={styles.modalIcon}>💳</Text>
            <Text style={styles.modalTitle}>Add Credits to Unlock</Text>
            <Text style={styles.modalDesc}>
              Your current balance is{' '}
              <Text style={{ color: Colors.accent, fontWeight: '700' }}>
                ${((profile?.credits_cents ?? 0) / 100).toFixed(2)}
              </Text>
              {pendingLead ? `. This lead costs $${((pendingLead.buyer_price_cents ?? pendingLead.price_cents) / 100).toFixed(2)}.` : '.'}
            </Text>

            {/* Credit packages */}
            <View style={styles.packagesGrid}>
              {CREDIT_PACKAGES.map((pkg) => {
                const isLoading = buying === pkg.cents;
                return (
                  <TouchableOpacity
                    key={pkg.cents}
                    style={styles.packageCard}
                    onPress={() => handleBuyCredits(pkg.cents)}
                    disabled={buying !== null}
                    activeOpacity={0.75}
                  >
                    {isLoading
                      ? <ActivityIndicator color={Colors.orange} />
                      : <Text style={styles.packageLabel}>{pkg.label}</Text>
                    }
                    <Text style={styles.packageSub}>credits</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.checkoutNote}>
              Tapping a package opens your browser to complete payment securely via Stripe. Credits are added instantly.
            </Text>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreditsModal(false)}>
              <Text style={styles.cancelText}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  // ── Modal ───────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8,16,30,0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.panel,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    borderTopWidth: 1,
    borderTopColor: Colors.borderOrange,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  modalIcon:  { fontSize: 40, textAlign: 'center' },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.foreground, textAlign: 'center' },
  modalDesc:  { fontSize: FontSize.sm, color: Colors.text, lineHeight: 20, textAlign: 'center' },

  packagesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    justifyContent: 'center',
  },
  packageCard: {
    width: '45%',
    backgroundColor: Colors.panel2,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderOrange,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 4,
    minHeight: 68,
    justifyContent: 'center',
    ...Shadow.orange,
  },
  packageLabel:   { fontSize: FontSize.xl, fontWeight: '800', color: Colors.orange },
  packageSub:     { fontSize: FontSize.xs, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },

  checkoutNote: {
    fontSize: FontSize.xs, color: Colors.muted,
    lineHeight: 17, textAlign: 'center',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  cancelText: {
    fontSize: FontSize.sm, color: Colors.muted, fontWeight: '500',
  },
});
