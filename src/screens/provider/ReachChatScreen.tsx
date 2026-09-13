import React from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ScreenShell } from '@/components/ScreenShell';
import { ReachChat } from '@/components/ReachChat';

type ReachChatParams = { leadId: string; leadCode?: string | null };

/**
 * Provider view of a lead's reachability chat. Opened from the per-lead
 * "Messages" button in My Submissions, the Messages inbox tab, or a push tap.
 */
export function ReachChatScreen() {
  const route = useRoute<RouteProp<Record<string, ReachChatParams>, string>>();
  const { leadId, leadCode } = route.params ?? { leadId: '' };

  return (
    <ScreenShell
      title="Messages"
      subtitle={leadCode ? `Lead #${leadCode}` : 'Reachability chat'}
    >
      <ReachChat role="provider" leadId={leadId} />
    </ScreenShell>
  );
}
