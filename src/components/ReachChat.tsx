import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { reachApi, ReachMessage, ReachThread } from '@/lib/api';
import { chipTray, chipLabel, ChipSide } from '@/lib/reachChips';
import { useTheme } from '@/contexts/ThemeContext';
import { DarkColors, LightColors, InnerLightColors, FontSize, Spacing, Radius } from '@/theme';

type Palette = typeof DarkColors;

const fmtTime = (at: string) => {
  const t = Date.parse(at);
  return isNaN(t) ? '' : new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

/**
 * Per-lead reachability chat — tap-only chips, no free text. Shared by the
 * buyer (keyed on their purchase) and the provider (keyed on the lead).
 * Renders inline (no own scroll) so it drops into a parent ScrollView/ScreenShell.
 * Theme-reactive via makeStyles(C) — never a frozen module-level palette.
 */
export function ReachChat({
  role,
  purchaseId,
  leadId,
}: {
  role: ChipSide;
  purchaseId?: string;
  leadId?: string;
}) {
  const { mode } = useTheme();
  const C: Palette = mode === 'light' ? LightColors : mode === 'inner-light' ? InnerLightColors : DarkColors;
  const s = useMemo(() => makeStyles(C), [mode]);

  const [thread, setThread]   = useState<ReachThread | null>(null);
  const [loaded, setLoaded]   = useState(false);
  const [sending, setSending] = useState(false);
  const [reopened, setReopened] = useState(false);
  const sendingRef = useRef(false);
  useEffect(() => { sendingRef.current = sending; }, [sending]);

  const args = useMemo(() => ({ purchaseId, leadId }), [purchaseId, leadId]);

  // Pull the thread; skipped mid-send. Only swaps state when it actually changed
  // so the list doesn't churn every tick.
  async function refresh() {
    if (sendingRef.current) return;
    try {
      const next = await reachApi.history(args);
      setThread(prev => {
        const a = prev?.messages ?? [], b = next.messages ?? [];
        const la = a[a.length - 1], lb = b[b.length - 1];
        if (prev && a.length === b.length && la?.id === lb?.id && prev.resolved === next.resolved) return prev;
        return next;
      });
    } catch { /* ignore — best effort */ }
  }

  // Load once, then poll every 2s so the other side's chips appear live.
  useEffect(() => {
    let alive = true;
    (async () => { await refresh(); if (alive) setLoaded(true); })();
    const t = setInterval(refresh, 2000);
    return () => { alive = false; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [args]);

  async function sendChip(code: string) {
    if (sending) return;
    setSending(true);
    setReopened(false);
    // Optimistic append — the tap should feel instant.
    const optimistic: ReachMessage = {
      id: `local-${Date.now()}`,
      sender: role,
      chip: code,
      label: chipLabel(code),
      at: new Date().toISOString(),
      mine: true,
    };
    setThread(prev => prev
      ? { ...prev, messages: [...prev.messages, optimistic], lastChip: code }
      : prev);
    try {
      const res = await reachApi.send({ ...args, chip: code });
      setThread(prev => {
        if (!prev) return prev;
        const msgs = prev.messages.map(m => (m.id === optimistic.id ? res.message : m));
        return { ...prev, messages: msgs, lastChip: res.message.chip, resolved: res.resolved };
      });
    } catch {
      // Roll the optimistic bubble back out on failure.
      setThread(prev => prev
        ? { ...prev, messages: prev.messages.filter(m => m.id !== optimistic.id) }
        : prev);
    } finally {
      setSending(false);
    }
  }

  if (!loaded) {
    return (
      <View style={s.wrap}>
        <ActivityIndicator color={C.orange} />
      </View>
    );
  }

  const messages = thread?.messages ?? [];
  const badge = thread?.providerBadge ?? null;
  const tray = chipTray(role, thread?.lastChip);
  const showTray = !thread?.resolved || reopened;

  return (
    <View style={s.wrap}>
      {/* Header — provider badge (buyer view) or plain "Buyer" (provider view) */}
      <View style={s.header}>
        {role === 'buyer' && badge ? (
          <>
            <View style={[s.dot, { backgroundColor: badge.color }]} />
            <Text style={s.headerName}>{badge.codename}</Text>
          </>
        ) : (
          <Text style={s.headerName}>{role === 'provider' ? 'Buyer' : 'Lead provider'}</Text>
        )}
        <Text style={s.headerHint}>· reachability</Text>
        {thread?.resolved && <Text style={s.resolvedPill}>Resolved</Text>}
      </View>

      {/* Thread */}
      <View style={s.thread}>
        {messages.length === 0 ? (
          <Text style={s.empty}>
            {role === 'buyer'
              ? "Trouble reaching the customer? Tap a chip below — the lead provider will see it and can help."
              : "The buyer can tap chips here about reaching the customer. Tap a chip to reply."}
          </Text>
        ) : (
          messages.map(m => (
            <View key={m.id} style={m.mine ? s.rowMine : s.rowOther}>
              <View style={[s.bubble, m.mine ? s.mine : s.other]}>
                <Text style={[s.bubbleText, { color: m.mine ? '#fff' : C.foreground }]}>{m.label}</Text>
              </View>
              <Text style={s.stamp}>{m.mine ? 'You' : m.sender === 'provider' ? 'Provider' : 'Buyer'} · {fmtTime(m.at)}</Text>
            </View>
          ))
        )}
      </View>

      {/* Chip tray, or a collapsed "reopen" affordance once resolved */}
      {showTray ? (
        <View style={s.tray}>
          {tray.map(group => (
            <View key={group.group} style={s.group}>
              <Text style={s.groupTitle}>{group.group}</Text>
              <View style={s.pills}>
                {group.chips.map(chip => (
                  <TouchableOpacity
                    key={chip.code}
                    style={[s.pill, sending && { opacity: 0.5 }]}
                    disabled={sending}
                    activeOpacity={0.8}
                    onPress={() => sendChip(chip.code)}
                  >
                    <Text style={s.pillText}>{chip.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
          {sending && <ActivityIndicator color={C.orange} style={{ marginTop: 4 }} />}
        </View>
      ) : (
        <View style={s.resolvedRow}>
          <Text style={s.resolvedNote}>This thread is wrapped up.</Text>
          <TouchableOpacity onPress={() => setReopened(true)} activeOpacity={0.8}>
            <Text style={s.reopen}>Reopen</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function makeStyles(C: Palette) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: C.panel,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: C.border,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    headerName: { color: C.foreground, fontSize: FontSize.sm, fontWeight: '700' },
    headerHint: { color: C.muted, fontSize: FontSize.xs },
    resolvedPill: {
      marginLeft: 'auto', color: C.good, fontSize: FontSize.xs - 1, fontWeight: '700',
      backgroundColor: 'rgba(52,211,153,0.12)', borderRadius: Radius.sm,
      paddingHorizontal: 6, paddingVertical: 2, overflow: 'hidden',
    },
    thread: { gap: 8 },
    empty: { color: C.muted, fontSize: FontSize.xs, lineHeight: 18 },
    rowMine: { alignItems: 'flex-end' },
    rowOther: { alignItems: 'flex-start' },
    bubble: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 16, maxWidth: '88%' },
    mine: { backgroundColor: C.orange, borderTopRightRadius: 5 },
    other: { backgroundColor: C.panel2, borderWidth: 1, borderColor: C.border, borderTopLeftRadius: 5 },
    bubbleText: { fontSize: FontSize.sm, lineHeight: 20 },
    stamp: { color: C.muted, fontSize: FontSize.xs - 1, marginTop: 3, marginHorizontal: 3 },
    tray: { gap: Spacing.sm, marginTop: 2 },
    group: { gap: 6 },
    groupTitle: { color: C.textSecondary, fontSize: FontSize.xs - 1, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    pill: {
      backgroundColor: C.panel2,
      borderWidth: 1,
      borderColor: C.borderOrange,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    pillText: { color: C.foreground, fontSize: FontSize.xs, fontWeight: '600' },
    resolvedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
    resolvedNote: { color: C.muted, fontSize: FontSize.xs },
    reopen: { color: C.orange, fontSize: FontSize.sm, fontWeight: '700' },
  });
}
