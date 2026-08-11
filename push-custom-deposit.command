#!/bin/bash
cd "$(dirname "$0")"
echo "🔧 Removing any stale git lock files..."
rm -f .git/HEAD.lock .git/index.lock
echo ""
echo "📱 Staging: custom deposit amount on Add Funds..."
git add src/screens/shared/AccountScreen.tsx
git diff --cached --quiet || git commit -m "feat: custom deposit amount on Add Funds ($20–$20,000)

Alongside the $25/$50/$100/$200 presets, buyers can now type any
amount (e.g. $555) and hit Deposit — same secure checkout flow, with
instant on-device validation of the $20–$20,000 range the server
already enforces. Note: Car Lockout's optional vehicle dropdowns need
NO app build — the form fields come from the server.

Co-Authored-By: Claude <noreply@anthropic.com>"
echo ""
echo "🚀 Pushing to GitHub..."
git push origin main
echo "✅ leadlock-mobile pushed!"
echo ""
echo "🏗  Starting EAS iOS build + TestFlight submit..."
echo "n" | npx eas-cli build --platform ios --profile production --auto-submit
echo ""
echo "✅ Build submitted to TestFlight."
read -p "Press Enter to close..."
