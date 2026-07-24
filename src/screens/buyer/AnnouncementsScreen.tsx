import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Linking } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ScreenShell } from '@/components/ScreenShell';
import { Colors, FontSize, Spacing, Radius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { broadcastsApi, Announcement } from '@/lib/api';

/**
 * Announcements — the in-app inbox for admin broadcasts. Designed cards
 * (accent rail, image, title, body, CTA / redeemable promo). Styles are
 * built inside the component keyed on theme mode (applyTheme mutates Colors).
 */
export function AnnouncementsScreen() {
  const { mode } = useTheme();
  const styles = useMemo(() => makeStyles(mode), [mode]);
  const navigation = useNavigation<any>();

  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await broadcastsApi.inbox();
      setItems(d.items ?? []);
      for (const it of d.items ?? []) {
        if (!it.read) broadcastsApi.markRead(it.broadcast_id).catch(() => {});
      }
    } catch { /* keep prior */ }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function claim(it: Announcement) {
    setClaiming(it.broadcast_id);
    try {
      const d = await broadcastsApi.claim(it.broadcast_id);
      if (d.error) { Alert.alert('Could not claim', d.error); return; }
      Alert.alert(d.already ? 'Already claimed' : 'Credit added',
        d.already ? 'You already claimed this credit.' : `$${((d.credited_cents ?? 0) / 100).toFixed(2)} was added to your wallet.`);
      setItems(prev => prev.map(x => x.broadcast_id === it.broadcast_id ? { ...x, promo_claimed: true } : x));
    } finally { setClaiming(null); }
  }

  function clickThrough(it: Announcement) {
    broadcastsApi.markClick(it.broadcast_id).catch(() => {});
    if (it.cta_href && /^https?:\/\//.test(it.cta_href)) Linking.openURL(it.cta_href).catch(() => {});
  }

  return (
    <ScreenShell title="Announcements" subtitle="Updates & offers from Nabbit" onRefresh={load} refreshing={loading}>
      <TouchableOpacity onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('AccountTab'))} style={styles.backBtn}>
        <Text style={styles.backText}>‹  Back</Text>
      </TouchableOpacity>

      {items.length === 0 && !loading ? (
        <View style={styles.empty}><Text style={styles.emptyText}>No announcements yet.</Text></View>
      ) : (
        items.map(it => {
          const accent = it.accent_color || '#f97316';
          return (
            <View key={it.recipient_id} style={styles.card}>
              <View style={[styles.rail, { backgroundColor: accent }]} />
              {it.image_url ? <Image source={{ uri: it.image_url }} style={styles.image} /> : null}
              <View style={styles.body}>
                <View style={styles.kickerRow}>
                  <Text style={[styles.kicker, { color: accent }]}>ANNOUNCEMENT</Text>
                  <Text style={styles.date}>{new Date(it.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                </View>
                <Text style={styles.title}>{it.title}</Text>
                <Text style={styles.text}>{it.body}</Text>
                {it.promo_credit_cents ? (
                  it.promo_claimed ? (
                    <Text style={styles.claimed}>✓ Credit added to your wallet</Text>
                  ) : (
                    <TouchableOpacity onPress={() => claim(it)} disabled={claiming === it.broadcast_id}
                      style={[styles.btn, { backgroundColor: accent }]}>
                      <Text style={styles.btnText}>{claiming === it.broadcast_id ? 'Claiming…' : `Claim $${(it.promo_credit_cents / 100).toFixed(2)} credit`}</Text>
                    </TouchableOpacity>
                  )
                ) : it.cta_label && it.cta_href ? (
                  <TouchableOpacity onPress={() => clickThrough(it)} style={[styles.btn, { backgroundColor: accent }]}>
                    <Text style={styles.btnText}>{it.cta_label}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        })
      )}
    </ScreenShell>
  );
}

function makeStyles(_mode: string) {
  return StyleSheet.create({
    backBtn: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 4, marginBottom: 6 },
    backText: { color: Colors.accent, fontSize: FontSize.md, fontWeight: '700' },
    empty: { padding: Spacing.xl, alignItems: 'center' },
    emptyText: { color: Colors.muted, fontSize: FontSize.md },
    kickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    date: { color: Colors.muted, fontSize: FontSize.xs },
    card: { backgroundColor: Colors.panel2, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: Spacing.md },
    rail: { height: 5, width: '100%' },
    image: { width: '100%', height: 160 },
    body: { padding: Spacing.lg },
    kicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    title: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.foreground, marginTop: 4 },
    text: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 6, lineHeight: 20 },
    claimed: { marginTop: 12, fontSize: FontSize.md, fontWeight: '700', color: '#34d399' },
    btn: { marginTop: 14, alignSelf: 'flex-start', paddingHorizontal: 18, paddingVertical: 11, borderRadius: Radius.md },
    btnText: { color: '#fff', fontWeight: '800', fontSize: FontSize.md },
  });
}
