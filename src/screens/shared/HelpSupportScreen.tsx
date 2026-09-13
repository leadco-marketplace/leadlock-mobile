import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supportApi, SupportMsg } from '@/lib/api';
import { DarkColors, LightColors, InnerLightColors, FontSize, Spacing } from '@/theme';

type Palette = typeof DarkColors;

// The real Nabbit grid logo — assistant avatar (header + each AI bubble).
const AVATAR = require('../../../assets/nabbit-logo.png');

// Conversation persistence: a chat survives navigating back, backgrounding, or a
// phone call so people never lose their place. Within RESUME_MS we drop them
// back into the live session (same messages + chips); after that the session is
// considered closed — the old thread stays visible as read-only history and a
// fresh chat starts beneath it; after HISTORY_MS it's purged entirely.
const STORE_KEY  = 'nabbit_support_chat_v1';
const RESUME_MS  = 20 * 60 * 1000;            // resume a live session within 20 min of no reply
const HISTORY_MS = 3 * 24 * 60 * 60 * 1000;   // keep the thread for 3 days, then purge

// Tap-through tree. Leaves are 'ask' (AI answers), 'report' (guide-first, then
// escalate to a ticket if unresolved), or 'ask-open' (free text to the AI).
type Node = { label: string; kind?: 'ask' | 'report' | 'ask-open'; children?: Node[] };

const TREE: Node[] = [
  { label: 'Payments & wallet', children: [
    { label: 'How do I add funds?', kind: 'ask' },
    { label: 'How much does a lead cost?', kind: 'ask' },
    { label: 'I was charged by mistake', kind: 'report' },
    { label: 'I was charged twice', kind: 'report' },
    { label: 'I want a refund', kind: 'report' },
    { label: 'Something else', kind: 'report' },
  ]},
  { label: 'Getting paid / payouts', children: [
    { label: 'When do I get paid?', kind: 'ask' },
    { label: 'Set up my bank / payouts', kind: 'ask' },
    { label: "My payout hasn't arrived", kind: 'report' },
    { label: 'My payout amount looks wrong', kind: 'report' },
    { label: 'Something else', kind: 'report' },
  ]},
  { label: 'Unlocking leads', children: [
    { label: 'How do I unlock a lead?', kind: 'ask' },
    { label: "I unlocked one but can't see details", kind: 'report' },
    { label: 'The lead info looks wrong', kind: 'report' },
    { label: 'The lead looks fake', kind: 'report' },
    { label: 'Something else', kind: 'report' },
  ]},
  { label: 'Calling customers', children: [
    { label: 'How does calling work?', kind: 'ask' },
    { label: "The call didn't connect", kind: 'report' },
    { label: 'Wrong phone number', kind: 'report' },
    { label: 'Customer never requested it', kind: 'report' },
    { label: 'Something else', kind: 'report' },
  ]},
  { label: 'My account / login', children: [
    { label: "I can't log in", kind: 'report' },
    { label: 'Change my phone number', kind: 'ask' },
    { label: "Notifications aren't working", kind: 'report' },
    { label: 'Delete my account', kind: 'ask' },
    { label: 'Something else', kind: 'report' },
  ]},
  { label: 'Report a bug', children: [
    { label: 'The app crashed', kind: 'report' },
    { label: "A button didn't work", kind: 'report' },
    { label: 'Something looks broken', kind: 'report' },
    { label: 'Something else', kind: 'report' },
  ]},
  { label: 'Ask another question', kind: 'ask-open' },
];

const BACK  = '‹ Back';
const SEND  = 'Send report';
const FIXED = 'That fixed it';
const NOFIX = 'Still not working — report it';

type Bubble = { role: 'user' | 'assistant'; content: string; ts: number };
type Mode = 'nav' | 'troubleshoot' | 'compose';
const clean = (s: string) => s.replace(/\*\*/g, '').replace(/(^|\n)[-•]\s+/g, '$1').trim();
const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

// Memoized message row so typing in the input never re-renders the chat log
// (that re-render is what makes a naive chat feel janky). Only new/changed
// bubbles render → smooth, Wolt-like scrolling.
const MessageRow = React.memo(function MessageRow(
  { role, content, time, C, s }:
  { role: 'user' | 'assistant'; content: string; time: string; C: Palette; s: ReturnType<typeof makeStyles> },
) {
  if (role === 'user') {
    return (
      <View style={{ alignItems: 'flex-end', marginBottom: 10 }}>
        <View style={[s.bubble, s.me]}>
          <Text selectable style={[s.bubbleText, { color: '#fff' }]}>{content}</Text>
        </View>
        <Text style={s.seen}>Seen · {time}</Text>
      </View>
    );
  }
  return (
    <View style={s.aiRow}>
      <Image source={AVATAR} style={s.avatar} />
      <View style={s.aiCol}>
        <View style={[s.bubble, s.ai]}>
          <Text selectable style={[s.bubbleText, { color: C.foreground }]}>{content}</Text>
        </View>
        <Text style={s.attrib}>✨ Answered by Nabbit AI · {time}</Text>
      </View>
    </View>
  );
});

export function HelpSupportScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { mode: themeMode } = useTheme();
  const C: Palette = themeMode === 'light' ? LightColors : themeMode === 'inner-light' ? InnerLightColors : DarkColors;
  const s = useMemo(() => makeStyles(C), [themeMode]);
  const [msgs, setMsgs] = useState<Bubble[]>([
    { role: 'assistant', ts: Date.now(), content: "Hi! 👋 I'm the Nabbit assistant. Tap a category below and I'll help you fix it fast — or type a question. 😊" },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [path, setPath] = useState<Node[]>([]);
  const [mode, setMode] = useState<Mode>('nav');
  const [reportTopic, setReportTopic] = useState('');
  const listRef = useRef<FlatList<Bubble>>(null);
  const hydrated = useRef(false);
  const down = () => requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));

  // Load any saved conversation on mount and apply the resume / closed / purge rules.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          const age = Date.now() - (s.updatedAt || 0);
          if (Array.isArray(s.msgs) && s.msgs.length && age <= HISTORY_MS) {
            if (age <= RESUME_MS) {
              // Still active — drop them back exactly where they were.
              setMsgs(s.msgs);
              setPath(Array.isArray(s.path) ? s.path : []);
              setMode(s.mode === 'compose' || s.mode === 'troubleshoot' ? s.mode : 'nav');
              setReportTopic(typeof s.reportTopic === 'string' ? s.reportTopic : '');
            } else {
              // Timed out — keep the old thread as history, start a fresh chat below.
              setMsgs([...s.msgs, { role: 'assistant', ts: Date.now(), content: "Welcome back! 👋 Your last chat timed out, but I'm right here — tap a category below or ask a new question. 😊" }]);
            }
          } else {
            await AsyncStorage.removeItem(STORE_KEY); // older than 3 days → purge
          }
        }
      } catch { /* ignore — start fresh */ }
      hydrated.current = true;
    })();
  }, []);

  // Persist the conversation after every change (once hydrated so we never
  // overwrite a saved thread with the empty initial state).
  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORE_KEY, JSON.stringify({ msgs, path, mode, reportTopic, updatedAt: Date.now() })).catch(() => {});
  }, [msgs, path, mode, reportTopic]);

  const pushUser = (c: string) => setMsgs(m => [...m, { role: 'user', content: c, ts: Date.now() }]);
  const pushAI   = (c: string) => setMsgs(m => [...m, { role: 'assistant', content: c, ts: Date.now() }]);

  const children = path.length ? (path[path.length - 1].children ?? []) : TREE;
  const chips: string[] =
    mode === 'compose'     ? [BACK, SEND]
    : mode === 'troubleshoot' ? [BACK, FIXED, NOFIX]
    : path.length          ? [BACK, ...children.map(n => n.label)]
    :                        children.map(n => n.label);

  async function aiReply(question: string) {
    setBusy(true); down();
    try {
      const history: SupportMsg[] = [...msgs, { role: 'user' as const, content: question, ts: Date.now() }].map(b => ({ role: b.role, content: b.content }));
      const { reply } = await supportApi.chat(history);
      pushAI(clean(reply));
    } catch {
      pushAI("Something went wrong. Please try again, or tap a category below.");
    } finally { setBusy(false); down(); }
  }

  // Guide-first: given the tapped issue, ask the AI for the single most likely
  // self-serve fix, then offer "that fixed it / report it".
  async function guide(topic: string) {
    setBusy(true); down();
    try {
      const directive = `A Nabbit user tapped this support issue: "${topic}". Give the single most likely self-serve fix in 1-2 short sentences — name the exact tab/screen and button to tap in the app — then ask if that solved it. Plain text, friendly.`;
      const { reply } = await supportApi.chat([{ role: 'user', content: directive }]);
      pushAI(clean(reply));
    } catch {
      pushAI("Let's try to sort it out. 🙂 If a lead or number looks wrong, open the lead in My Leads and use the report option to flag it. Did that help?");
    } finally { setBusy(false); setMode('troubleshoot'); down(); }
  }

  async function submitReport(extra: string) {
    const topic = reportTopic || 'Report a problem';
    const message = extra.trim() || topic;
    setInput(''); if (extra.trim()) pushUser(extra.trim());
    setBusy(true);
    try {
      await supportApi.report({
        name:  profile?.full_name || profile?.email?.split('@')[0] || 'Nabbit user',
        email: profile?.email || '',
        topic, message,
      });
      pushAI("Got it — I've let the team know and they'll follow up in the app or by email. 🙏 Anything else I can help with?");
    } catch {
      pushAI("Couldn't send that just now. Please try again in a moment.");
    } finally {
      setBusy(false); setMode('nav'); setReportTopic(''); setPath([]); down();
    }
  }

  function onChip(label: string) {
    if (busy) return;
    if (label === BACK) {
      if (mode === 'compose') setMode('troubleshoot');
      else if (mode === 'troubleshoot') setMode('nav');
      else setPath(p => p.slice(0, -1));
      return;
    }
    if (label === SEND)  { submitReport(input); return; }
    if (label === FIXED) { pushUser(FIXED); pushAI("Awesome — glad that sorted it! 🎉 Anything else I can help with?"); setMode('nav'); setPath([]); setReportTopic(''); down(); return; }
    if (label === NOFIX) { setMode('compose'); pushAI("No problem — add any detail (optional) and tap Send report. 👇"); down(); return; }

    const node = children.find(n => n.label === label);
    if (!node) return;
    pushUser(label);
    if (node.children) { setPath(p => [...p, node]); down(); return; }
    if (node.kind === 'ask') { setPath([]); aiReply(label); return; }
    if (node.kind === 'ask-open') { setPath([]); pushAI("Sure — type your question below and I'll help. ✨"); down(); return; }
    // report leaf → guide first, keep the category for the ticket
    setReportTopic([...path.map(n => n.label), label].join(' · '));
    guide([...path.map(n => n.label), label].join(' · '));
  }

  function onSend() {
    if (busy || !input.trim()) return;
    if (mode === 'compose') { submitReport(input); return; }
    const q = input; setInput(''); setPath([]); setMode('nav'); pushUser(q); aiReply(q);
  }

  const renderItem = useCallback(
    ({ item }: { item: Bubble }) => <MessageRow role={item.role} content={item.content} time={fmtTime(item.ts)} C={C} s={s} />,
    [C, s],
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <View style={s.top}>
        <TouchableOpacity onPress={() => nav.goBack()} style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
          <Text style={{ color: C.orange, fontSize: 26, marginTop: -4 }}>‹</Text>
        </TouchableOpacity>
        <Image source={AVATAR} style={s.hicon} />
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Help and support</Text>
          <Text style={s.sub}>{mode === 'compose' ? 'Reporting a problem' : 'Nabbit AI · replies instantly'}</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderItem}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: Spacing.md }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          onContentSizeChange={down}
          ListFooterComponent={busy ? (
            <View style={s.aiRow}>
              <Image source={AVATAR} style={s.avatar} />
              <View style={[s.bubble, s.ai, { flexDirection: 'row', gap: 6, alignItems: 'center' }]}>
                <ActivityIndicator color={C.muted} />
                <Text style={{ color: C.muted, fontSize: FontSize.sm }}>typing…</Text>
              </View>
            </View>
          ) : null}
        />

        {chips.length > 0 && (
          <View style={s.chipsRow}>
            {chips.map(c => {
              const isBack = c === BACK;
              const isSend = c === SEND;
              const isFixed = c === FIXED;
              return (
                <TouchableOpacity key={c} onPress={() => onChip(c)}
                  style={[s.chip,
                    isBack  && { borderColor: C.border, backgroundColor: 'transparent' },
                    isFixed && { borderColor: 'rgba(52,211,153,0.5)', backgroundColor: 'rgba(52,211,153,0.12)' },
                    isSend  && { borderColor: C.orange, backgroundColor: C.orange }]}>
                  <Text style={[s.chipText,
                    isBack  && { color: C.muted },
                    isFixed && { color: '#6ee7b7' },
                    isSend  && { color: '#fff', fontWeight: '700' }]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* No bottom safe-area inset: this screen sits above the tab bar, which
            already reserves the home-indicator area — adding it here too left a
            visible gap between the input pill and the tabs. */}
        <View style={[s.inputBar, { paddingBottom: 8 }]}>
          <View style={s.inputWrap}>
            <TextInput
              value={input} onChangeText={setInput}
              placeholder={mode === 'compose' ? 'Add details (optional)…' : 'Ask a question…'}
              placeholderTextColor={C.placeholder}
              style={s.input} multiline returnKeyType="send" onSubmitEditing={onSend}
            />
            <TouchableOpacity onPress={onSend} disabled={busy} style={[s.sendBtn, busy && { opacity: 0.5 }]}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// Built per-mode so every surface matches the active theme (no frozen palette).
// The whole reason this screen mis-rendered in light / inner-light: a module-level
// StyleSheet.create captured the DARK palette at import, so the navy bubbles + dark
// input band rendered on the light peach bg. Always makeStyles(C) keyed on mode.
function makeStyles(C: Palette) {
  return StyleSheet.create({
    top: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: C.border },
    hicon: { width: 30, height: 30, borderRadius: 15 },
    title: { color: C.headerText, fontSize: FontSize.md, fontWeight: '600' },
    sub: { color: C.headerSubText, fontSize: FontSize.xs },
    aiRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
    aiCol: { flexShrink: 1, maxWidth: '84%' },
    avatar: { width: 26, height: 26, borderRadius: 13 },
    bubble: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 16 },
    ai: { alignSelf: 'flex-start', backgroundColor: C.panel2, borderWidth: 1, borderColor: C.border, borderTopLeftRadius: 5 },
    me: { maxWidth: '86%', alignSelf: 'flex-end', backgroundColor: C.orange, borderTopRightRadius: 5 },
    bubbleText: { fontSize: FontSize.base, lineHeight: 21 },
    seen: { color: C.muted, fontSize: FontSize.xs, marginTop: 3, marginRight: 4 },
    attrib: { color: C.muted, fontSize: FontSize.xs, marginTop: 3, marginLeft: 4 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
    chip: { borderWidth: 1, borderColor: C.borderOrange, backgroundColor: C.glowBg, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
    chipText: { color: C.orange, fontSize: FontSize.sm },
    inputBar: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
    inputWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, backgroundColor: C.panel2, borderWidth: 1, borderColor: C.border, borderRadius: 22, paddingLeft: 14, paddingRight: 6, paddingVertical: 6 },
    input: { flex: 1, color: C.foreground, fontSize: FontSize.base, maxHeight: 100, paddingTop: 4, paddingBottom: 4 },
    sendBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' },
  });
}
