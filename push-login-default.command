#!/bin/bash
cd "$(dirname "$0")"

echo "🔧 Removing any stale git lock files..."
rm -f .git/HEAD.lock .git/index.lock

echo ""
echo "📱 Staging: Login-on-launch + dark default for new accounts..."
git add src/contexts/AuthContext.tsx src/contexts/ThemeContext.tsx \
        src/screens/onboarding/OnboardingScreen.tsx

if git diff --cached --quiet; then
  echo "✅ Files already committed — skipping commit step"
else
  git commit -m "fix: Login only when logged out; half-finished signups reset; dark default for new accounts

- Cold-start policy: fully onboarded accounts stay logged in and open
  straight to the app (push-alert taps keep working). Logged-out users
  land on Login. A HALF-FINISHED signup (buyer who never completed
  onboarding) is signed out on launch (scope 'local' — this device only,
  website sessions untouched) so reopening the app never lands on the
  onboarding form uninvited.
- New-account dark default: signup clears any theme preference a
  previous user left saved on the device, so the first post-onboarding
  feed is always dark mode. Saved preferences still apply for the same
  device after the user changes theme in-app.
- Sweeps in the onboarding real-name hint line if not yet pushed.

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
