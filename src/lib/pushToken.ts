// Storage key for THIS DEVICE's Expo push token — written after successful
// registration (App.tsx), read on sign-out (AuthContext) to unregister the
// device from the account so logged-out devices stop receiving pushes.
// '@leadco' prefix kept deliberately (existing storage-key convention).
export const PUSH_TOKEN_STORAGE_KEY = '@leadco/pushToken';
