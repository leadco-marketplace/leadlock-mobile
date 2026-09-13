import React from 'react';
import { Text } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ScreenShell } from '@/components/ScreenShell';
import { ReachChat } from '@/components/ReachChat';
import { useTheme } from '@/contexts/ThemeContext';
import { FontSize } from '@/theme';

type ReachChatParams = { leadId: string; leadCode?: string | null };

/**
 * Provider view of a lead's reachability chat. Opened from the per-lead
 * "Messages" button in My Submissions, the Messages inbox tab, or a push tap.
 */
export function ReachChatScreen() {
  const route = useRoute<RouteProp<Record<string, ReachChatParams>, string>>();
  const { leadId, leadCode } = route.params ?? { leadId: '' };
  const { mode } = useTheme();
  // Orange on the dark navy, indigo on the light peach — always high-contrast.
  const codeColor = mode === 'dark' ? '#f97316' : '#4338ca';

  return (
    <ScreenShell
      title="Messages"
      subtitle={leadCode ? undefined : 'Reachability chat'}
      subtitleNode={
        leadCode ? (
          <Text>
            Lead{' '}
            <Text style={{ color: codeColor, fontSize: FontSize.md, fontWeight: '700', letterSpacing: 0.5 }}>
              #{leadCode}
            </Text>
          </Text>
        ) : undefined
      }
    >
      <ReachChat role="provider" leadId={leadId} />
    </ScreenShell>
  );
}
