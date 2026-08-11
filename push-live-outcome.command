#!/bin/bash
cd "$(dirname "$0")"

echo "🔧 Removing any stale git lock files..."
rm -f .git/HEAD.lock .git/index.lock

echo ""
echo "📱 Staging: live Call Result on lead detail (no-refresh polling)..."
git add src/lib/api.ts src/screens/buyer/LeadDetailScreen.tsx

if git diff --cached --quiet; then
  echo "✅ Files already committed — skipping commit step"
else
  git commit -m "feat: live Call Result on buyer lead detail — appears without refreshing

- New 'Call Result' section on the purchased-lead screen: validated
  outcome pill (Job Booked / Appointment Scheduled / Valid Conversation /
  No Answer / Voicemail…) + the AI's one-line summary.
- While the screen is open with no outcome yet, it quietly re-checks
  every 8 seconds and updates in place the moment the AI finishes
  (~1-2 min after hangup) — no manual refresh needed.
- PurchasedLead type: call_outcome / call_outcome_summary /
  call_analysis_status from /api/my-leads.

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
