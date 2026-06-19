import React, { useEffect, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppNavigator, navigationRef } from '@/navigation/AppNavigator';
import { pushApi } from '@/lib/api';
import { notificationEvents } from '@/lib/notificationEvents';

SplashScreen.preventAutoHideAsync();

// Handle incoming notifications while app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

async function registerForPushNotifications(userId: string): Promise<void> {
  if (!Device.isDevice) return; // simulators can't receive push notifications

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[push] Permission not granted');
    return;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name:       'Lead Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#f97316',
      sound:      'lead-alert.wav',
    });
  }

  // Get the Expo push token for this device
  // Try both locations where EAS stores the project ID
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;

  if (!projectId) {
    console.warn('[push] No EAS projectId in app config — cannot get push token');
    return;
  }

  // Retry up to 3 times with exponential backoff — Expo's token service can
  // be temporarily unreachable at startup (503/timeout) if the network isn't
  // fully ready yet.  We log silently and retry rather than alarming the user.
  let expoToken: string | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await Notifications.getExpoPushTokenAsync({ projectId });
      expoToken = result.data;
      console.log('[push] Got token:', expoToken.slice(0, 40) + '…');
      break;
    } catch (e: any) {
      console.warn(`[push] Token fetch attempt ${attempt}/3 failed:`, e?.message ?? String(e));
      if (attempt < 3) {
        // Wait 3s then 6s before retrying
        await new Promise(r => setTimeout(r, attempt * 3_000));
      }
    }
  }

  if (!expoToken) {
    // All retries exhausted — token will be re-attempted next time the user
    // opens the app (AppState foreground listener in PushRegistrar).
    console.error('[push] Could not get Expo push token after 3 attempts — will retry on next app open');
    return;
  }

  // Save via the API endpoint (service role) so RLS can never silently drop the write.
  // This updates both push_subscriptions AND profiles.expo_push_token, ensuring
  // all server-side notification paths (dispatch, signal notify, lead-sold notify)
  // can find this token with a direct column lookup.
  try {
    await pushApi.register(expoToken, Platform.OS);
    console.log('[push] Token saved ✅ for user', userId);
  } catch (e: any) {
    console.error('[push] Failed to save token via API:', e?.message ?? String(e));
  }
}

// Inner component that has access to auth context.
// Runs on every login / token refresh — safe to run multiple times
// since Supabase upsert is idempotent.
function PushRegistrar() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    if (!userId) return;

    // Initial registration attempt
    registerForPushNotifications(userId);

    // Re-attempt whenever the app comes back to the foreground — this handles
    // the case where the first attempt failed (e.g. network not ready at startup)
    // and the user hasn't logged out since.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && userIdRef.current) {
        registerForPushNotifications(userIdRef.current);
      }
    });
    return () => sub.remove();
  }, [userId]);

  return null;
}

/**
 * Listens for the user tapping a push notification.
 *
 * Two paths:
 * 1. getLastNotificationResponseAsync() — catches the notification that
 *    launched/foregrounded the app from background or cold-start. This must
 *    be checked on mount because the response may have arrived before the
 *    addNotificationResponseReceivedListener was registered.
 * 2. addNotificationResponseReceivedListener — catches taps on banners that
 *    appear while the app is already in the foreground.
 *
 * Both paths emit the leadId via notificationEvents so LiveFeedScreen can
 * highlight the card without relying on React Navigation route params.
 */
function PushResponseHandler() {
  useEffect(() => {
    function handleResponse(response: Notifications.NotificationResponse | null) {
      if (!response) return;
      const data       = response.notification.request.content.data as Record<string, unknown>;
      const type       = data?.type       as string | undefined;
      const leadId     = data?.leadId     as string | undefined;
      const purchaseId = data?.purchaseId as string | undefined;

      const tryNavigate = (fn: () => void) => {
        if (navigationRef.current?.isReady()) {
          fn();
        } else {
          setTimeout(() => tryNavigate(fn), 200);
        }
      };

      // ── Provider: their submitted lead was purchased ───────────────────────
      if (type === 'lead_sold') {
        tryNavigate(() => {
          navigationRef.current!.navigate('MySubmissions' as never);
        });
        return;
      }

      // ── Provider: buyer sent a signal (no_answer / wrong_number) ──────────
      if (type === 'lead_signal') {
        tryNavigate(() => {
          navigationRef.current!.navigate('SignalsTab' as never);
        });
        return;
      }

      // ── Buyer: provider responded to their signal ──────────────────────────
      if (type === 'lead_signal_response' && leadId) {
        tryNavigate(() => {
          // First navigate to My Leads tab so it's in the stack…
          navigationRef.current!.navigate('BuyerTabs' as never, {
            screen: 'MyLeads',
          } as never);
          // …then push LeadDetail on top (100 ms delay so BuyerTabs settles first)
          setTimeout(() => {
            navigationRef.current?.navigate('LeadDetail' as never, {
              leadId,
              purchaseId,
            } as never);
          }, 100);
        });
        return;
      }

      // ── Default: new lead notification → highlight card in Live Feed ───────
      if (!leadId) return;

      // Emit first — LiveFeedScreen subscription or useFocusEffect will pick it up.
      notificationEvents.emit(leadId);

      // Navigate to ensure the LiveFeed tab is visible.
      tryNavigate(() => {
        navigationRef.current!.navigate('BuyerTabs' as never, {
          screen: 'LiveFeed',
        } as never);
      });
    }

    // Path 1 — app opened/foregrounded BY tapping a notification (background / cold-start).
    // This is the most common case: user is not in the app, taps the notification banner.
    Notifications.getLastNotificationResponseAsync().then(handleResponse);

    // Path 2 — notification banner tapped while app is already in the foreground.
    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => subscription.remove();
  }, []);

  return null;
}

export default function App() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <PushRegistrar />
          <PushResponseHandler />
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
