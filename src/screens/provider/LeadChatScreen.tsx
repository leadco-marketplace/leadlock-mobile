import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { leadChatApi, LeadChatMessage } from '@/lib/api';
import { Colors, FontSize, Spacing } from '@/theme';

// The real Nabbit grid logo — assistant avatar (header + each AI bubble).
const AVATAR = require('../../../assets/nabbit-logo.png');

const TEMPLATE = 'Name:\nPhone:\nAddress:\nService needed:\nNotes:';

type Bubble = { role: 'provider' | 'assistant'; content: string; ts: number; flag?: boolean };

const isFlag = (k?: string | null) => k === 'trust_prompt' || k === 'signal_prompt';
const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const MessageRow = React.memo(function MessageRow(
  { role, content, time, flag }: { role: 'provider' | 'assistant'; content: string; time: string; flag?: boolean },
) {
  if (role === 'provider') {
    return (
      <View style={{ alignItems: 'flex-end', marginBottom: 10 }}>
        <View style={[styles.bubble, styles.me]}>
          <Text selectable style={[styles.bubbleText, { color: '#fff' }]}>{content}</Text>
        </View>
        <Text style={styles.seen}>Sent · {time}</Text>
      </View>
    );
  }
  return (
    <View style={styles.aiRow}>
      <Image source={AVATAR} style={styles.avatar} />
      <View style={styles.aiCol}>
        <View style={[styles.bubble, styles.ai, flag && styles.flagBubble]}>
          <Text selectable style={[styles.bubbleText, { color: Colors.foreground }]}>{content}</Text>
        </View>
        <Text style={styles.attrib}>✨ Nabbit AI · {time}</Text>
      </View>
    </View>
  );
});

export function LeadChatScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [msgs, setMsgs] = useState<Bubble[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const listRef = useRef<FlatList<Bubble>>(null);
  const busyRef = useRef(false);
  useEffect(() => { busyRef.current = busy; }, [busy]);
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
    ({ item }: { item: Bubble }) => <MessageRow role={item.role} content={item.content} time={fmtTime(item.ts)} flag={item.flag} />,
    [],
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, paddingTop: insets.top }}>
      <View style={styles.top}>
        <TouchableOpacity onPress={() => nav.goBack()} style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
          <Text style={{ color: Colors.orange, fontSize: 26, marginTop: -4 }}>‹</Text>
        </TouchableOpacity>
        <Image source={AVATAR} style={styles.hicon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Submit a lead</Text>
          <Text style={styles.sub}>Nabbit AI · no phone number needed</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top + 6}>
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
              <Text style={{ color: Colors.foreground, fontSize: FontSize.md, fontWeight: '600' }}>Send your first lead</Text>
              <Text style={{ color: Colors.muted, fontSize: FontSize.sm, textAlign: 'center', marginTop: 6 }}>
                Type the customer&apos;s name, phone, address and what they need — all in one message. I&apos;ll read it, ask for anything missing, and post it.
              </Text>
              <Text style={{ color: Colors.muted, fontSize: FontSize.xs, textAlign: 'center', marginTop: 8 }}>
                Uses the same prices, ranges and price drops you set on Text-to-Submit.
              </Text>
              <TouchableOpacity onPress={() => setInput(TEMPLATE)} style={{ marginTop: 12 }}>
                <Text style={{ color: Colors.orange, fontSize: FontSize.sm, fontWeight: '700' }}>Use a template</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          ListFooterComponent={busy ? (
            <View style={styles.aiRow}>
              <Image source={AVATAR} style={styles.avatar} />
              <View style={[styles.bubble, styles.ai, { flexDirection: 'row', gap: 6, alignItems: 'center' }]}>
                <ActivityIndicator color={Colors.muted} />
                <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>reading your lead…</Text>
              </View>
            </View>
          ) : null}
        />

        <View style={[styles.inputBar, { paddingBottom: 8 + insets.bottom }]}>
          <View style={styles.inputWrap}>
            <TextInput
              value={input} onChangeText={setInput}
              placeholder="e.g. John, 305-555-1234, house lockout, Miami 33139"
              placeholderTextColor={Colors.muted}
              style={styles.input} multiline
            />
            <TouchableOpacity onPress={onSend} disabled={busy || !input.trim()} style={[styles.sendBtn, (busy || !input.trim()) && { opacity: 0.5 }]}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  hicon: { width: 30, height: 30, borderRadius: 15 },
  title: { color: Colors.foreground, fontSize: FontSize.md, fontWeight: '600' },
  sub: { color: Colors.muted, fontSize: FontSize.xs },
  aiRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  aiCol: { flexShrink: 1, maxWidth: '84%' },
  avatar: { width: 26, height: 26, borderRadius: 13 },
  bubble: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 16 },
  ai: { alignSelf: 'flex-start', backgroundColor: Colors.panel, borderTopLeftRadius: 5 },
  flagBubble: { backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)' },
  me: { maxWidth: '86%', alignSelf: 'flex-end', backgroundColor: Colors.orange, borderTopRightRadius: 5 },
  bubbleText: { fontSize: FontSize.base, lineHeight: 21 },
  seen: { color: Colors.muted, fontSize: FontSize.xs, marginTop: 3, marginRight: 4 },
  attrib: { color: Colors.muted, fontSize: FontSize.xs, marginTop: 3, marginLeft: 4 },
  inputBar: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.bg },
  inputWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, backgroundColor: Colors.panel, borderWidth: 1, borderColor: Colors.border, borderRadius: 22, paddingLeft: 14, paddingRight: 6, paddingVertical: 6 },
  input: { flex: 1, color: Colors.foreground, fontSize: FontSize.base, maxHeight: 120, paddingTop: 4, paddingBottom: 4 },
  sendBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.orange, alignItems: 'center', justifyContent: 'center' },
});
