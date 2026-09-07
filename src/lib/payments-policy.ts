import { Platform } from 'react-native';

/**
 * Store-billing policy flag — where in-app wallet funding must be hidden.
 *
 * iOS ONLY. Apple (Guideline 3.1.1) forces Apple's IAP for anything that looks
 * like a digital purchase, so we hide in-app funding on iOS and buyers top up on
 * the web. Google Play does NOT require this: (a) real-world/physical SERVICES
 * are not supported by Play Billing (leads qualify, like Thumbtack/Uber), and
 * (b) since Oct 2025, following the Epic v. Google ruling, Google no longer
 * forces Play Billing for US-served apps and allows alternative in-app payment
 * methods. So Android KEEPS in-app funding (Cash App / card / ACH) — better UX.
 *
 * If a Play reviewer ever flags the wallet top-up, flip this to include
 * 'android' and rebuild — that restores the iOS-style "fund on the web" flow.
 */
export const HIDE_IN_APP_FUNDING = Platform.OS === 'ios';
