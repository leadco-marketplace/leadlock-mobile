import React, { useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
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

  let expoToken: string;
  try {
    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    expoToken = result.data;
    console.log('[push] Got token:', expoToken.slice(0, 40) + '…');
  } catch (e: any) {
    console.error('[push] Failed to get Expo push token:', e);
    // Show visible alert so we can diagnose the exact error
    Alert.alert(
      '⚠️ Push Token Error',
      `Could not get push token.\n\nError: ${e?.message ?? String(e)}\n\nProjectId: ${projectId}`,
    );
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

  useEffect(() => {
    if (userId) {
      registerForPushNotifications(userId);
    }
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
            navigationRef.current.navigate('LiveFeed' as never, { highlightLeadId: leadId } as never);
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
      <AuthProvider>
        <StatusBar style="light" />
        <PushRegistrar />
        <PushResponseHandler />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
