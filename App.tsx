import React, { useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppNavigator } from '@/navigation/AppNavigator';
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
    Alert.alert('⚠️ Token Save Error', `Could not save push token: ${error.message}`);
  } else {
    console.log('[push] Token saved ✅ for user', userId);
    // Temporary success alert — remove once notifications are confirmed working
    Alert.alert('✅ Push Ready', 'Push notification token registered successfully!');
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

export default function App() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <PushRegistrar />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
