#!/bin/bash
cd "$(dirname "$0")"

echo "🔧 Removing any stale git lock files..."
rm -f .git/HEAD.lock .git/index.lock

echo ""
echo "📱 Staging: Call History on lead detail..."
git add src/lib/api.ts src/screens/buyer/LeadDetailScreen.tsx

if git diff --cached --quiet; then
  echo "✅ Files already committed — skipping commit step"
else
  git commit -m "feat: Call History on purchased-lead screen — every call, recording, analysis

- New '📞 Call History' section: every bridge call with date/time,
  duration, status, per-call AI outcome pill + summary, and a
  ▶ Play Recording link (streams through the authenticated proxy via
  the system player).
- Auto-refreshes every 8s while the screen is open, so new calls and
  fresh analyses appear without any manual refresh.
- lib/api: CallLogEntry type + leadsApi.getCalls(purchaseId).

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
