// Minimal pub/sub so the Account screen can replay the first-login walkthrough,
// which is mounted once at the app root (WelcomeTour).
type Listener = () => void;
let listeners: Listener[] = [];

export function openTour() {
  listeners.forEach((l) => l());
}

export function onOpenTour(cb: Listener): () => void {
  listeners.push(cb);
  return () => { listeners = listeners.filter((x) => x !== cb); };
}

// v2 = the interactive spotlight tour (bumped so anyone who saw the old stepper
// still gets the new one once).
export const tourSeenKey = (role: string) => `nabbit_tour_seen_v2_${role === 'provider' ? 'provider' : 'buyer'}`;
