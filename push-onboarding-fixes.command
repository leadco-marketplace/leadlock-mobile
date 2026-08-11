#!/bin/bash
cd "$(dirname "$0")"

echo "🔧 Removing any stale git lock files..."
rm -f .git/HEAD.lock .git/index.lock

echo ""
echo "📱 Staging onboarding polish + guest mode..."
git add src/screens/onboarding/OnboardingScreen.tsx src/components/Input.tsx src/lib/api.ts \
        src/contexts/AuthContext.tsx src/navigation/AuthNavigator.tsx \
        src/navigation/AppNavigator.tsx src/navigation/BuyerNavigator.tsx \
        src/screens/buyer/LiveFeedScreen.tsx src/screens/shared/GuestLockedScreen.tsx

if git diff --cached --quiet; then
  echo "✅ Files already committed — skipping commit step"
else
  git commit -m "feat: guest mode = live feed only + actions route to Signup; onboarding polish

Guest mode (Browse as Guest from Login):
- All four tabs stay visible, but My Leads / Alerts / Account open
  per-tab teaser screens (GuestLockedScreen) with feature bullets +
  'Sign Up Free' CTA instead of the real screens
- Unlock button on cards + guest banner exit guest mode straight to the
  Signup page (authStart in AuthContext drives AuthNavigator initial route)
- Banner copy: 'Sign up free to unlock leads'
- Registered missing ForgotPassword screen in AuthNavigator (link existed
  but screen was never registered — would have crashed)

Onboarding polish (from device testing):
- Input component styles now theme-reactive (dark fields in light mode)
- Service Areas picker is search-only (no browse list)
- Send areaIds to /api/onboarding/complete for exact per-category
  preference rows (0038 schema) the alert engine matches against

Co-Authored-By: Claude <noreply@anthropic.com>"
fi

echo ""
echo "🚀 Pushing to GitHub..."
git push origin main
echo "✅ leadlock-mobile pushed!"

echo ""
echo "🏗  Starting EAS iOS build + TestFlight submit..."
echo "n" | npx eas-cli build --platform ios --profile production --auto-submit

echo ""
echo "✅ Build submitted to TestFlight! (~15–20 min)"
read -p "Press Enter to close..."
