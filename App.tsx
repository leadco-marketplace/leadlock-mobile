import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppNavigator } from '@/navigation/AppNavigator';

SplashScreen.preventAutoHideAsync();

// Handle incoming notifications while app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

const API_BASE: string =
  Constants.expoConfig?.extra?.apiBaseUrl ?? 'https://leadco-marketplace-p5zj.vercel.app';

async function registerForPushNotifications(token: string | null): Promise<void> {
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
      name:      'Lead Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#f97316',
    });
  }

  // Get the Expo push token for this device
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn('[push] No EAS projectId in app config — cannot get push token');
    return;
  }

  let expoToken: string;
  try {
    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    expoToken = result.data;
  } catch (e) {
    console.error('[push] Failed to get Expo push token:', e);
    return;
  }

  // Save the token to the backend (requires the user to be authenticated)
  if (!token) return; // no Supabase session yet

  try {
    const res = await fetch(`${API_BASE}/api/profile/push-token`, {
      method:  'PUT',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ token: expoToken }),
    });
    if (res.ok) {
      console.log('[push] Token registered:', expoToken.slice(0, 40) + '…');
    } else {
      const body = await res.json().catch(() => ({}));
      console.warn('[push] Server rejected token:', body);
    }
  } catch (e) {
    console.error('[push] Network error saving token:', e);
  }
}

// Inner component that has access to auth context
function PushRegistrar() {
  const { session } = useAuth();

  useEffect(() => {
    if (session?.access_token) {
      registerForPushNotifications(session.access_token);
    }
  }, [session?.access_token]);

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
