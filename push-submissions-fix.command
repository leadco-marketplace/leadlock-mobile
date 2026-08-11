#!/bin/bash
cd "$(dirname "$0")"

echo "🔧 Removing any stale git lock files..."
rm -f .git/HEAD.lock .git/index.lock

echo ""
echo "📱 Staging: My Submissions fix (iOS stale-cache) + category picker safe area..."
git add src/screens/provider/MySubmissionsScreen.tsx src/lib/api.ts \
        src/screens/provider/SubmitLeadScreen.tsx

if git diff --cached --quiet; then
  echo "✅ Files already committed — skipping commit step"
else
  git commit -m "fix(api): bust iOS response cache on ALL GETs — My Submissions was frozen empty

ROOT CAUSE of 'No leads yet' despite leads existing in the DB: iOS
NSURLSession cached the first (empty) /api/provider/leads response and
served it forever — request Cache-Control headers alone don't prevent
this. /api/my-leads already had a ?_t= timestamp buster for exactly this
reason; now request() appends it to EVERY GET so no endpoint can get
stuck on a stale cached response again.

Also: My Submissions no longer swallows fetch errors silently — real
error message + Retry button instead of a fake 'No leads yet'.

Also: Select Category modal now respects the iPhone safe area
(SafeAreaView top edge) — the header rendered under the status bar,
leaving the Back button beneath the system clock and untappable.

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
