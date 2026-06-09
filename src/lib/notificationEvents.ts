/**
 * notificationEvents
 *
 * A tiny event bus that lets PushResponseHandler (App.tsx) signal the
 * LiveFeedScreen that a notification was tapped — without relying on React
 * Navigation route params, which are unreliable when the tab is already active.
 *
 * Usage:
 *   emit(leadId)     — called by PushResponseHandler immediately on tap
 *   subscribe(fn)    — called by LiveFeedScreen to react in real-time
 *   consume()        — called by LiveFeedScreen on focus (cold-start / remount)
 */
type Listener = (leadId: string) => void;

let _listeners: Listener[] = [];
let _pending: string | null = null;

export const notificationEvents = {
  /** Fire immediately when the user taps a push notification. */
  emit(leadId: string): void {
    _pending = leadId;
    _listeners.forEach(l => l(leadId));
  },

  /**
   * Read and clear the pending highlight.
   * Used by LiveFeedScreen.useFocusEffect so the highlight is applied even
   * when the screen mounts AFTER emit() fires (cold start).
   */
  consume(): string | null {
    const v = _pending;
    _pending = null;
    return v;
  },

  /**
   * Subscribe to notification taps.
   * Returns an unsubscribe function.
   */
  subscribe(listener: Listener): () => void {
    _listeners.push(listener);
    return () => {
      _listeners = _listeners.filter(l => l !== listener);
    };
  },
};
