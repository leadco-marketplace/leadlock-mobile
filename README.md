# LeadCo Marketplace — Mobile App

React Native + Expo app for iOS & Android. Shares the same Supabase backend as the web app.

---

## Quick Start

### 1. Install dependencies
```bash
cd leadlock-mobile
npm install
```

### 2. Add your Supabase credentials
Open `app.json` and replace the placeholders in `extra`:
```json
"extra": {
  "supabaseUrl":    "https://YOUR_PROJECT.supabase.co",
  "supabaseAnonKey": "YOUR_ANON_KEY",
  "apiBaseUrl":      "https://leadcomarketplace.com"
}
```

> Same values as your web `.env.local` (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 3. Run the app
```bash
# Start Expo dev server
npx expo start

# Or run directly on simulator
npx expo run:ios
npx expo run:android
```

### 4. Scan the QR code
Open **Expo Go** on your phone and scan the QR code from the terminal.

---

## Project Structure

```
App.tsx                          Root — auth + push registration
src/
  theme.ts                       Design tokens (colors, spacing, radius)
  lib/
    supabase.ts                  Supabase client (AsyncStorage session)
    api.ts                       Typed API helpers (wraps web API routes)
  contexts/
    AuthContext.tsx               Auth state + signIn/signUp/signOut
  components/
    Button.tsx                   Orange gradient + secondary/danger variants
    LeadCard.tsx                  Lead display with Unlock button
    Input.tsx                    Styled text input with error state
    ScreenShell.tsx              Consistent screen wrapper + pull-to-refresh
  navigation/
    AppNavigator.tsx             Root: auth gate → role-based navigator
    AuthNavigator.tsx            Login / Signup stack
    BuyerNavigator.tsx           Tab: Live Feed / My Leads / Account
    ProviderNavigator.tsx        Tab: My Leads / Submit Lead / Account
    AdminNavigator.tsx           Tab: Overview / Review Queue / Account
  screens/
    auth/
      LoginScreen.tsx
      SignupScreen.tsx
    buyer/
      LiveFeedScreen.tsx         Real-time lead feed with Supabase subscription
      MyLeadsScreen.tsx          Purchased leads with contact info + tap-to-call
    provider/
      SubmitLeadScreen.tsx       Full lead submission form
      MySubmissionsScreen.tsx    Earnings, stats, edit/delete leads
    shared/
      AccountScreen.tsx          Profile, notification toggles, sign out
    admin/
      (inside AdminNavigator)    Overview stats + review queue
```

---

## Push Notifications

Push tokens are registered automatically on app launch via `expo-notifications`.
The web API endpoint `/api/push/register` stores the token in your database.

For production, configure your Apple Push Notification certificates in
`expo.io` → your project → Credentials.

---

## Building for App Stores

```bash
# Install EAS CLI
npm install -g eas-cli

# Login and configure
eas login
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```
