import { Linking, Alert } from 'react-native';

/**
 * Open an external URL safely.
 *
 * React Native's Linking.openURL REJECTS with "Unable to open URL" when the OS
 * can't open the link. A fire-and-forget `Linking.openURL(url)` with no catch
 * turns that into an UNHANDLED promise rejection, which Sentry reports as an
 * error (seen on iOS 26 with the signup Terms of Use link). This always catches,
 * so a failed open never crashes, never pages us, and the user still gets the
 * link so they can open it manually.
 */
export async function openExternal(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Couldn’t open the link', url);
  }
}
