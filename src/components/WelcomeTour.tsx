import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, FontSize, Spacing, Radius } from '@/theme';
import { onOpenTour, tourSeenKey } from '@/lib/tour';
import { navigationRef } from '@/navigation/navigationRef';

/**
 * WelcomeTour (mobile) — an interactive element-spotlight product tour.
 *
 * Each step NAVIGATES to the real tab and drops a spotlight cutout over the
 * actual bottom-tab button (Submit Lead, My Leads, Alerts, …) with a tooltip
 * above it — the mobile equivalent of the web spotlight tour. Tab-button
 * positions are computed geometrically (4 equal cells in the bottom bar), so
 * there are no fragile element refs and it works reliably across tabs.
 *
 * Auto-shows once per role (AsyncStorage); replayable from Account (openTour()).
 */
type Role = 'buyer' | 'provider';
type Step = {
  title: string;
  body: string;
  tabIndex: number | null;         // which bottom-tab cell to spotlight (null = centered)
  navigate?: () => void;           // switch to that tab
};

const BAR_HEIGHT: Record<Role, number> = { buyer: 66, provider: 62 };
const TAB_COUNT = 4;

function nav(name: string, params?: object) {
  // navigate() is heavily overloaded; cast to keep the call site simple.
  (navigationRef.current as any)?.navigate(name, params);
}

const STEPS: Record<Role, Step[]> = {
  buyer: [
    { tabIndex: null, title: 'Welcome to Nabbit 👋', body: "Let's take a quick, hands-on tour. I'll highlight each part of the app as we go." },
    { tabIndex: 0, title: 'Your live feed', body: 'Real, local jobs land here the moment they come in. This is your home base.', navigate: () => nav('BuyerTabs', { screen: 'LiveFeed' }) },
    { tabIndex: 1, title: 'Your unlocked leads', body: 'Leads you unlock live here. Tap to call the customer through a private number — our AI confirms it was genuine.', navigate: () => nav('BuyerTabs', { screen: 'MyLeads' }) },
    { tabIndex: 2, title: 'Set your alerts', body: "Pick your trades and areas so we only ping you about jobs you want — and show how far away each one is.", navigate: () => nav('BuyerTabs', { screen: 'Alerts' }) },
    { tabIndex: 3, title: 'Account & wallet', body: 'Top up to unlock leads — your first lead is free. Manage your profile and replay this tour here anytime.', navigate: () => nav('BuyerTabs', { screen: 'Account' }) },
    { tabIndex: null, title: "You're all set ✅", body: 'Head to your feed and grab your first lead. Replay this tour anytime from Account.' },
  ],
  provider: [
    { tabIndex: null, title: 'Welcome to Nabbit 👋', body: "Let's walk through how you turn leads into income. I'll highlight each part as we go." },
    { tabIndex: 1, title: 'Submit a lead', body: 'Add a lead here — or text it straight to your dedicated Nabbit number with Text-to-Submit.', navigate: () => nav('SubmitLeadTab') },
    { tabIndex: 0, title: 'Track & get paid', body: "Every lead and sale shows here. You're paid the moment a lead SELLS to a buyer.", navigate: () => nav('SubmissionsTab', { screen: 'MySubmissions' }) },
    { tabIndex: 2, title: 'Buyer signals', body: "When a buyer needs a corrected number or has a question, respond right here so the lead stays sold.", navigate: () => nav('SignalsTab') },
    { tabIndex: 3, title: 'Account', body: 'Manage your profile, payouts, and replay this tour anytime. Tip: build AI landing pages on the web dashboard.', navigate: () => nav('AccountTab') },
    { tabIndex: null, title: "You're all set ✅", body: 'Submit your first lead to get going. Replay this tour anytime from Account.' },
  ],
};

export function WelcomeTour({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const insets = useSafeAreaInsets();
  const steps = STEPS[role];

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(tourSeenKey(role))
      .then((seen) => { if (active && !seen) { setI(0); setOpen(true); } })
      .catch(() => {});
    return () => { active = false; };
  }, [role]);

  useEffect(() => onOpenTour(() => { setI(0); setOpen(true); }), []);

  // Drive navigation for each step.
  useEffect(() => {
    if (!open) return;
    steps[i]?.navigate?.();
  }, [open, i, steps]);

  const finish = useCallback(() => {
    AsyncStorage.setItem(tourSeenKey(role), '1').catch(() => {});
    setOpen(false);
  }, [role]);

  if (!open) return null;
  const step = steps[i];
  const last = i === steps.length - 1;

  const { width: W } = Dimensions.get('window');
  const barH = BAR_HEIGHT[role];
  const tabW = W / TAB_COUNT;
  const idx = step.tabIndex;

  // Everything is anchored to the BOTTOM of the screen (the tab bar is always
  // flush to it), so we never depend on a computed screen height — that math was
  // unreliable and left the highlight covering only half the tab. barBand = the
  // tab bar's full height from the very bottom (bar + home-indicator inset).
  const barBand = barH + insets.bottom;
  const dim = 'rgba(2,6,23,0.74)';

  return (
    <View style={styles.root} pointerEvents="auto">
      {idx != null ? (
        <>
          {/* dim everything ABOVE the tab bar */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: barBand, backgroundColor: dim }} />
          {/* dim the tab-bar band to the LEFT of the target cell */}
          <View style={{ position: 'absolute', bottom: 0, height: barBand, left: 0, width: tabW * idx, backgroundColor: dim }} />
          {/* dim the tab-bar band to the RIGHT of the target cell */}
          <View style={{ position: 'absolute', bottom: 0, height: barBand, left: tabW * (idx + 1), right: 0, backgroundColor: dim }} />
          {/* highlight ring over the whole target tab cell (icon + label) */}
          <View style={[styles.ring, { bottom: 2, left: tabW * idx + 6, width: tabW - 12, height: barBand - 4, borderColor: Colors.orange }]} pointerEvents="none" />
          {/* tooltip just above the tab bar */}
          <View style={[styles.card, { left: Spacing.md, right: Spacing.md, bottom: barBand + 12, backgroundColor: Colors.panel, borderColor: Colors.orange }]}>
            {renderCard()}
          </View>
        </>
      ) : (
        <>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: dim }]} />
          <View style={[styles.card, styles.cardCentered, { backgroundColor: Colors.panel, borderColor: Colors.orange }]}>
            {renderCard()}
          </View>
        </>
      )}
    </View>
  );

  function renderCard() {
    return (
      <>
        <View style={styles.headerRow}>
          <Text style={[styles.kicker, { color: Colors.orange }]}>Step {i + 1} of {steps.length}</Text>
          <TouchableOpacity onPress={finish}><Text style={[styles.skip, { color: Colors.muted }]}>Skip</Text></TouchableOpacity>
        </View>
        <Text style={[styles.title, { color: Colors.foreground }]}>{step.title}</Text>
        <Text style={[styles.body, { color: Colors.muted }]}>{step.body}</Text>
        <View style={styles.dots}>
          {steps.map((_, idx) => (
            <View key={idx} style={[styles.dot, idx === i ? { width: 20, backgroundColor: Colors.orange } : { width: 6, backgroundColor: Colors.border }]} />
          ))}
        </View>
        <View style={styles.actions}>
          {i > 0 && (
            <TouchableOpacity onPress={() => setI(i - 1)} style={[styles.btn, styles.btnGhost, { borderColor: Colors.border }]}>
              <Text style={[styles.btnGhostText, { color: Colors.foreground }]}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => (last ? finish() : setI(i + 1))} style={[styles.btn, { backgroundColor: Colors.orange }]}>
            <Text style={styles.btnText}>{last ? 'Get started' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 1000, elevation: 1000 },
  dark: { position: 'absolute' },
  ring: { position: 'absolute', borderWidth: 2, borderRadius: 12 },
  card: { position: 'absolute', borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg },
  cardCentered: { left: Spacing.lg, right: Spacing.lg, top: '50%', marginTop: -110 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { fontSize: FontSize.xs, fontWeight: '800', letterSpacing: 1 },
  skip: { fontSize: FontSize.sm },
  title: { fontSize: FontSize.lg, fontWeight: '700', marginTop: 4 },
  body: { fontSize: FontSize.md, marginTop: Spacing.sm, lineHeight: 21 },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: Spacing.md },
  dot: { height: 6, borderRadius: 3 },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  btn: { flex: 1, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: FontSize.md },
  btnGhost: { borderWidth: 1, backgroundColor: 'transparent' },
  btnGhostText: { fontWeight: '600', fontSize: FontSize.md },
});
