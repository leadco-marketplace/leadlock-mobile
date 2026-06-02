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
import { supabase } from '@/lib/supabase';

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

  // Save directly via Supabase client — no web server hop, no Bearer token needed
  const { error } = await supabase
    .from('profiles')
    .update({ expo_push_token: expoToken })
    .eq('id', userId);

  if (error) {
    console.error('[push] Failed to save token to Supabase:', error.message);
  } else {
    console.log('[push] Token saved ✅ for user', userId);
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
 * Listens for the user tapping a push notification (from cold-start or
 * background). When the notification data contains a leadId we navigate
 * directly to the LiveFeed tab and pass the ID as a route param so the
 * screen can scroll to and highlight that specific lead.
 */
function PushResponseHandler() {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        const leadId = data?.leadId as string | undefined;
        if (!leadId) return;

        // Wait briefly in case the navigator hasn't finished mounting yet
        // (e.g. cold-start where JS bundle just loaded)
        const tryNavigate = () => {
          if (navigationRef.current?.isReady()) {
            // LiveFeed lives inside BuyerTabs (Tab) inside the BuyerNavigator (Stack).
            // navigate('LiveFeed') alone won't work from the root — we must navigate
            // to the parent Tab first and pass the target screen + params as nested config.
            navigationRef.current.navigate('BuyerTabs' as never, {
              screen: 'LiveFeed',
              params: { highlightLeadId: leadId },
            } as never);
          } else {
            setTimeout(tryNavigate, 200);
          }
        };
        tryNavigate();
      }
    );
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
