#!/bin/bash
cd "$(dirname "$0")"

echo "🔧 Removing any stale git lock files..."
rm -f .git/HEAD.lock .git/index.lock

echo ""
echo "📱 Staging Terms checkbox + dark-mode default (+ theme refresh if not yet pushed)..."
git add src/screens/auth/SignupScreen.tsx src/contexts/AuthContext.tsx \
        src/contexts/ThemeContext.tsx src/navigation/AppNavigator.tsx \
        src/theme.ts src/screens/buyer/LeadDetailScreen.tsx \
        src/screens/onboarding/OnboardingScreen.tsx

if git diff --cached --quiet; then
  echo "✅ Files already committed — skipping commit step"
else
  git commit -m "feat: mandatory ToU acceptance at signup; dark mode always pre-dashboard

- Role-aware Terms of Use checkbox on Signup (links to the web document
  for the selected role); Create Account blocked until checked; signUp
  sends termsAccepted so the server records the acceptance.
- Pre-dashboard surfaces (launch, login, signup, onboarding) are now
  ALWAYS dark mode — the saved light/dark preference only applies once
  the user reaches the app (ThemeContext setPreDashboard lock, driven by
  AppNavigator auth/onboarding state). Fixes light-mode onboarding when
  the device previously used light theme.
- Sweeps in navy theme refresh + call-options chooser if not yet pushed.

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
