import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet, Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { leadChatApi, LeadChatMessage } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import { DarkColors, LightColors, InnerLightColors, FontSize, Spacing } from '@/theme';

// The real Nabbit grid logo — assistant avatar (header + each AI bubble).
const AVATAR = require('../../../assets/nabbit-logo.png');

const TEMPLATE = 'Name:\nPhone:\nAddress:\nService needed:\nNotes:';

type Palette = typeof DarkColors;
type Bubble = { role: 'provider' | 'assistant'; content: string; ts: number; flag?: boolean };

const isFlag = (k?: string | null) => k === 'trust_prompt' || k === 'signal_prompt';
const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

// Row is memoized; it takes the active palette + styles as props so it re-renders
// on a theme change but not on every keystroke.
const MessageRow = React.memo(function MessageRow(
  { role, content, time, flag, C, s }:
  { role: 'provider' | 'assistant'; content: string; time: string; flag?: boolean; C: Palette; s: ReturnType<typeof makeStyles> },
) {
  if (role === 'provider') {
    return (
      <View style={{ alignItems: 'flex-end', marginBottom: 10 }}>
        <View style={[s.bubble, s.me]}>
          <Text selectable style={[s.bubbleText, { color: '#fff' }]}>{content}</Text>
        </View>
        <Text style={s.stamp}>Sent · {time}</Text>
      </View>
    );
  }
  return (
    <View style={s.aiRow}>
      <Image source={AVATAR} style={s.avatar} />
      <View style={s.aiCol}>
        <View style={[s.bubble, s.ai, flag && s.flagBubble]}>
          <Text selectable style={[s.bubbleText, { color: C.foreground }]}>{content}</Text>
        </View>
        <Text style={s.stamp}>✨ Nabbit AI · {time}</Text>
      </View>
    </View>
  );
});

export function LeadChatScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { mode } = useTheme();
  const C: Palette = mode === 'light' ? LightColors : mode === 'inner-light' ? InnerLightColors : DarkColors;
  const s = useMemo(() => makeStyles(C), [mode]);

  const [msgs, setMsgs] = useState<Bubble[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [kbdUp, setKbdUp] = useState(false);
  const listRef = useRef<FlatList<Bubble>>(null);
  const busyRef = useRef(false);
  useEffect(() => { busyRef.current = busy; }, [busy]);

  // While the keyboard is up it already covers the home-indicator area, so the
  // bottom safe-area padding on the input bar would just push the field up into
  // an empty gap. Drop it whenever the keyboard is open.
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const a = Keyboard.addListener(showEvt, () => setKbdUp(true));
    const b = Keyboard.addListener(hideEvt, () => setKbdUp(false));
    return () => { a.remove(); b.remove(); };
  }, []);
  const down = () => requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));

  // Pull the server thread; skipped while sending. Only updates when changed so
  // the list doesn't re-render every tick.
  async function refresh() {
    if (busyRef.current) return;
    try {
      const { messages } = await leadChatApi.history();
      const next: Bubble[] = (messages ?? []).map((m: LeadChatMessage) => ({
        role: m.role, content: m.text, ts: m.at ? Date.parse(m.at) : Date.now(), flag: isFlag(m.kind),
      }));
      setMsgs(prev => {
        const a = prev[prev.length - 1], b = next[next.length - 1];
        if (prev.length === next.length && a?.content === b?.content) return prev;
        return next;
      });
    } catch { /* ignore */ }
  }

  // Load once, then poll every 2s so signals/flags + confirmations appear live.
  useEffect(() => {
    (async () => { await refresh(); setLoaded(true); down(); })();
    const t = setInterval(refresh, 2000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushProvider = (c: string) => setMsgs(m => [...m, { role: 'provider', content: c, ts: Date.now() }]);
  const pushAI = (c: string, flag?: boolean) => setMsgs(m => [...m, { role: 'assistant', content: c, ts: Date.now(), flag }]);

  async function onSend() {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    pushProvider(text);
    setBusy(true); down();
    try {
      const { replies } = await leadChatApi.send(text);
      if (!replies || replies.length === 0) pushAI('Sorry — something went wrong. Please try again.');
      else replies.forEach(r => pushAI(r.text));
    } catch {
      pushAI('Network error — please try again.');
    } finally { setBusy(false); down(); }
  }

  const renderItem = useCallback(
    ({ item }: { item: Bubble }) => <MessageRow role={item.role} content={item.content} time={fmtTime(item.ts)} flag={item.flag} C={C} s={s} />,
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
          <Text style={s.title}>Submit a lead</Text>
          <Text style={s.sub}>Nabbit AI · no phone number needed</Text>
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
          ListEmptyComponent={loaded ? (
            <View style={{ alignItems: 'center', paddingTop: 40, paddingHorizontal: 20 }}>
              <Image source={AVATAR} style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 12, opacity: 0.9 }} />
              <Text style={{ color: C.foreground, fontSize: FontSize.md, fontWeight: '600' }}>Send your first lead</Text>
              <Text style={{ color: C.muted, fontSize: FontSize.sm, textAlign: 'center', marginTop: 6 }}>
                Type the customer&apos;s name, phone, address and what they need — all in one message. I&apos;ll read it, ask for anything missing, and post it.
              </Text>
              <Text style={{ color: C.muted, fontSize: FontSize.xs, textAlign: 'center', marginTop: 8 }}>
                Uses the same prices, ranges and price drops you set on Text-to-Submit.
              </Text>
              <TouchableOpacity onPress={() => setInput(TEMPLATE)} style={{ marginTop: 12 }}>
                <Text style={{ color: C.orange, fontSize: FontSize.sm, fontWeight: '700' }}>Use a template</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          ListFooterComponent={busy ? (
            <View style={s.aiRow}>
              <Image source={AVATAR} style={s.avatar} />
              <View style={[s.bubble, s.ai, { flexDirection: 'row', gap: 6, alignItems: 'center' }]}>
                <ActivityIndicator color={C.muted} />
                <Text style={{ color: C.muted, fontSize: FontSize.sm }}>reading your lead…</Text>
              </View>
            </View>
          ) : null}
        />

        <View style={[s.inputBar, { paddingBottom: 8 + (kbdUp ? 0 : insets.bottom) }]}>
          <View style={s.inputWrap}>
            <TextInput
              value={input} onChangeText={setInput}
              placeholder="e.g. John, 305-555-1234, house lockout, Miami 33139"
              placeholderTextColor={C.placeholder}
              style={s.input} multiline
            />
            <TouchableOpacity onPress={onSend} disabled={busy || !input.trim()} style={[s.sendBtn, (busy || !input.trim()) && { opacity: 0.5 }]}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// Built per-mode so every surface matches the active theme (no frozen palette).
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
    flagBubble: { backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.45)' },
    me: { maxWidth: '86%', alignSelf: 'flex-end', backgroundColor: C.orange, borderTopRightRadius: 5 },
    bubbleText: { fontSize: FontSize.base, lineHeight: 21 },
    stamp: { color: C.muted, fontSize: FontSize.xs, marginTop: 3, marginHorizontal: 4 },
    inputBar: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
    inputWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, backgroundColor: C.panel2, borderWidth: 1, borderColor: C.border, borderRadius: 22, paddingLeft: 14, paddingRight: 6, paddingVertical: 6 },
    input: { flex: 1, color: C.foreground, fontSize: FontSize.base, maxHeight: 120, paddingTop: 4, paddingBottom: 4 },
    sendBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' },
  });
}
