#!/bin/bash
cd "$(dirname "$0")"

echo "🔧 Removing any stale git lock files..."
rm -f .git/HEAD.lock .git/index.lock

echo ""
echo "📱 Staging buyer onboarding flow..."
git add src/screens/onboarding/OnboardingScreen.tsx src/navigation/AppNavigator.tsx src/lib/api.ts

# Commit only if there's something new to commit
if git diff --cached --quiet; then
  echo "✅ Files already committed — skipping commit step"
else
  git commit -m "feat: buyer onboarding gate — profile, phone verification, services, areas

New buyers must complete onboarding before entering the app, mirroring
the web /onboarding flow step-for-step:
  1. Profile  — first/last name, company, phone + SMS verification
     (via /api/profile/phone/send-code + verify-code)
  2. Services — grouped service-category picker
  3. Areas    — searchable service-area picker
  4. Payment  — summary + how-payments-work + optional starter deposit
     (routes through /api/wallet/deposit, same as Account screen)

Saves via /api/onboarding/complete (sets onboarding_complete=true and
upserts contractor_preferences — identical to web). AppNavigator gates
buyers with !profile.onboarding_complete; the gate lifts via
refreshProfile() after save. Providers/admins/guests unaffected.

Also adds onboardingApi + walletApi to lib/api.

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
