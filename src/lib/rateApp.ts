/**
 * rateApp — "Rate This App" support.
 *
 *  • openAppStoreReview()  — manual "Rate This App" button. Jumps straight to the
 *    store's write-a-review page (App Store on iOS, Play Store on Android).
 *  • requestNativeReview() — the native in-app rating dialog (no app switch) when
 *    the OS allows it; falls back to the store page.
 *  • maybePromptForReview() — a gentle one-time soft-ask a few days into use:
 *    "Enjoying Nabbit? Rate us." → native review. Shown once, only after the app
 *    has been installed for PROMPT_AFTER_DAYS, and never on the very first launch.
 */
import { Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

// LIVE store identities.
const IOS_APP_ID = '6768565789';
const ANDROID_PKG = 'com.leadco.marketplace';

const FIRST_LAUNCH_KEY  = 'nb_first_launch_at';
const RATE_PROMPTED_KEY = 'nb_rate_prompted_v1';
const PROMPT_AFTER_DAYS = 3;

function storeReviewUrls(): { deep: string; web: string } {
  if (Platform.OS === 'ios') {
    return {
      deep: `itms-apps://apps.apple.com/app/id${IOS_APP_ID}?action=write-review`,
      web:  `https://apps.apple.com/app/id${IOS_APP_ID}?action=write-review`,
    };
  }
  return {
    deep: `market://details?id=${ANDROID_PKG}`,
    web:  `https://play.google.com/store/apps/details?id=${ANDROID_PKG}`,
  };
}

/** Manual button → open the store's review page directly. */
export async function openAppStoreReview(): Promise<void> {
  const { deep, web } = storeReviewUrls();
  try {
    const canDeep = await Linking.canOpenURL(deep);
    await Linking.openURL(canDeep ? deep : web);
  } catch {
    try { await Linking.openURL(web); } catch { /* give up quietly */ }
  }
}

/** Native in-app review dialog when available, else the store page. */
export async function requestNativeReview(): Promise<void> {
  try {
    if ((await StoreReview.isAvailableAsync()) && (await StoreReview.hasAction())) {
      await StoreReview.requestReview();
      return;
    }
  } catch { /* fall through to the store link */ }
  await openAppStoreReview();
}

/** One-time soft-ask a few days in. Safe to call on every app launch. */
export async function maybePromptForReview(): Promise<void> {
  try {
    if (await AsyncStorage.getItem(RATE_PROMPTED_KEY)) return;

    const first = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
    if (!first) {
      // Start the clock on first launch; never prompt immediately.
      await AsyncStorage.setItem(FIRST_LAUNCH_KEY, String(Date.now()));
      return;
    }

    const ageDays = (Date.now() - Number(first)) / 86_400_000;
    if (!isFinite(ageDays) || ageDays < PROMPT_AFTER_DAYS) return;

    Alert.alert(
      'Enjoying Nabbit?',
      'If the app has been helpful, a quick rating means a lot — and helps other pros find us.',
      [
        {
          text: 'Not now',
          style: 'cancel',
          onPress: () => { AsyncStorage.setItem(RATE_PROMPTED_KEY, '1').catch(() => {}); },
        },
        {
          text: 'Rate Nabbit',
          onPress: () => {
            AsyncStorage.setItem(RATE_PROMPTED_KEY, '1').catch(() => {});
            requestNativeReview();
          },
        },
      ],
    );
  } catch { /* a rating prompt must never interfere with using the app */ }
}
