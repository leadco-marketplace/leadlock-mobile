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
 *
 * `collapsible` (buyer lead card) folds the whole thing into a single
 * "Chat with the lead provider" row until tapped. The chips are grouped into
 * accordion topics — only the tapped topic's chips show, so the card never
 * shows a wall of chips. Theme-reactive via makeStyles(C).
 */
export function ReachChat({
  role,
  purchaseId,
  leadId,
  collapsible = false,
}: {
  role: ChipSide;
  purchaseId?: string;
  leadId?: string;
  collapsible?: boolean;
}) {
  const { mode } = useTheme();
  const C: Palette = mode === 'light' ? LightColors : mode === 'inner-light' ? InnerLightColors : DarkColors;
  const s = useMemo(() => makeStyles(C), [mode]);

  const [thread, setThread]   = useState<ReachThread | null>(null);
  const [loaded, setLoaded]   = useState(false);
  const [sending, setSending] = useState(false);
  const [reopened, setReopened] = useState(false);
  const [collapsed, setCollapsed] = useState(collapsible);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const sendingRef = useRef(false);
  useEffect(() => { sendingRef.current = sending; }, [sending]);

  const args = useMemo(() => ({ purchaseId, leadId }), [purchaseId, leadId]);

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
    setOpenGroup(null); // drop back to the topic list after a send
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
      setThread(prev => prev
        ? { ...prev, messages: prev.messages.filter(m => m.id !== optimistic.id) }
        : prev);
    } finally {
      setSending(false);
    }
  }

  const messages = thread?.messages ?? [];
  const badge = thread?.providerBadge ?? null;
  const tray = chipTray(role, thread?.lastChip);
  // City, ST ZIP — empty-safe. Shown on the provider header so a pro juggling
  // many leads knows exactly which one they're replying to.
  const cityState = [thread?.city, thread?.state].filter(Boolean).join(', ');
  const loc = cityState ? (thread?.zip ? `${cityState} ${thread.zip}` : cityState) : (thread?.zip ?? '');
  // The lead code pops in a theme-aware accent: orange in dark, indigo on the
  // light peach (theme-primary C.orange is remapped to sapphire in dark, so we
  // pick explicit hues here instead of using it).
  const codeColor = mode === 'dark' ? '#f97316' : '#4338ca';
  const showTray = !thread?.resolved || reopened;
  const hasReply = messages.length > 0 && !messages[messages.length - 1].mine;

  // ── Collapsed row (buyer lead card) ──
  if (collapsible && collapsed) {
    return (
      <TouchableOpacity style={s.collapsedRow} activeOpacity={0.85} onPress={() => setCollapsed(false)}>
        <View style={s.collapsedIcon}><Text style={s.collapsedIconTxt}>💬</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.collapsedTitle}>Chat with the lead provider</Text>
          <View style={s.collapsedSub}>
            {badge && <View style={[s.dot, { backgroundColor: badge.color }]} />}
            <Text style={s.collapsedSubTxt}>{badge ? badge.codename : 'Lead provider'}</Text>
          </View>
        </View>
        {hasReply && !thread?.resolved && <Text style={s.newPill}>New reply</Text>}
        <Text style={s.chevron}>▾</Text>
      </TouchableOpacity>
    );
  }

  if (!loaded) {
    return (
      <View style={s.wrap}>
        <ActivityIndicator color={C.orange} />
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      {/* Header — tap to collapse when collapsible */}
      <TouchableOpacity
        style={s.header}
        activeOpacity={collapsible ? 0.7 : 1}
        onPress={collapsible ? () => setCollapsed(true) : undefined}
        disabled={!collapsible}
      >
        <View style={s.headerLeft}>
          {role === 'buyer' && badge ? (
            <View style={s.headerLine}>
              <View style={[s.dot, { backgroundColor: badge.color }]} />
              <Text style={s.headerName}>{badge.codename}</Text>
              <Text style={s.headerHint}> · reachability</Text>
            </View>
          ) : role === 'provider' ? (
            <>
              <Text style={s.headerName} numberOfLines={2}>
                Buyer
                {thread?.leadCode ? <Text style={[s.headerCode, { color: codeColor }]}> #{thread.leadCode}</Text> : null}
                {loc ? <Text style={s.headerLoc}> · {loc}</Text> : null}
              </Text>
              <Text style={s.headerHint}>reachability</Text>
            </>
          ) : (
            <View style={s.headerLine}>
              <Text style={s.headerName}>Lead provider</Text>
              <Text style={s.headerHint}> · reachability</Text>
            </View>
          )}
        </View>
        {thread?.resolved && <Text style={s.resolvedPill}>Resolved</Text>}
        {collapsible && <Text style={s.chevron}>▴</Text>}
      </TouchableOpacity>

      {/* Thread */}
      <View style={s.thread}>
        {messages.length === 0 ? (
          <Text style={s.empty}>
            {role === 'buyer'
              ? 'Trouble reaching the customer? Pick a topic below — the lead provider will see it and can help.'
              : 'The buyer can tap chips here about reaching the customer. Pick a topic to reply.'}
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

      {/* Chip tray — accordion topics */}
      {showTray ? (
        <View style={s.tray}>
          <Text style={s.trayHint}>{role === 'buyer' ? 'Pick a topic to send' : 'Pick a topic to reply'}</Text>
          {tray.map(group => {
            const open = openGroup === group.group;
            return (
              <View key={group.group} style={s.group}>
                <TouchableOpacity
                  style={[s.groupHeader, open && s.groupHeaderOpen]}
                  activeOpacity={0.8}
                  onPress={() => setOpenGroup(open ? null : group.group)}
                >
                  <Text style={s.groupTitle}>{group.group}</Text>
                  <Text style={s.groupChevron}>{open ? '▴' : '▾'}</Text>
                </TouchableOpacity>
                {open && (
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
                )}
              </View>
            );
          })}
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
    // Collapsed row
    collapsedRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: C.panel, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border,
      paddingHorizontal: 14, paddingVertical: 13,
    },
    collapsedIcon: {
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: 'rgba(249,115,22,0.14)', alignItems: 'center', justifyContent: 'center',
    },
    collapsedIconTxt: { fontSize: 16 },
    collapsedTitle: { color: C.foreground, fontSize: FontSize.sm, fontWeight: '700' },
    collapsedSub: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    collapsedSubTxt: { color: C.muted, fontSize: FontSize.xs },
    newPill: {
      color: C.orange, fontSize: FontSize.xs - 1, fontWeight: '700',
      backgroundColor: 'rgba(249,115,22,0.14)', borderRadius: Radius.sm,
      paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden',
    },
    chevron: { color: C.muted, fontSize: 16 },
    // Header
    header: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
    headerLeft: { flex: 1 },
    headerLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
    headerName: { color: C.foreground, fontSize: FontSize.sm, fontWeight: '700' },
    headerCode: { fontSize: FontSize.sm, fontWeight: '700' },
    headerLoc: { color: C.muted, fontSize: FontSize.xs, fontWeight: '400' },
    headerHint: { color: C.muted, fontSize: FontSize.xs, marginTop: 1 },
    resolvedPill: {
      marginTop: 1, color: C.good, fontSize: FontSize.xs - 1, fontWeight: '700',
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
    // Accordion tray
    tray: { gap: 8, marginTop: 2 },
    trayHint: { color: C.muted, fontSize: FontSize.xs - 1, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
    group: { borderWidth: 1, borderColor: C.border, borderRadius: Radius.md, overflow: 'hidden' },
    groupHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 13, paddingVertical: 11, backgroundColor: C.panel2,
    },
    groupHeaderOpen: { backgroundColor: C.panel3 },
    groupTitle: { color: C.foreground, fontSize: FontSize.sm, fontWeight: '700' },
    groupChevron: { color: C.muted, fontSize: 15 },
    pills: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 6,
      padding: 11, borderTopWidth: 1, borderTopColor: C.border,
    },
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
