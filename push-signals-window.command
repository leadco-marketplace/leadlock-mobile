#!/bin/bash
cd "$(dirname "$0")"

echo "🔧 Removing any stale git lock files..."
rm -f .git/HEAD.lock .git/index.lock

echo ""
echo "📱 Staging: earnings card theming + signal window UI..."
git add src/screens/provider/MySubmissionsScreen.tsx \
        src/screens/provider/SignalsScreen.tsx src/lib/api.ts

if git diff --cached --quiet; then
  echo "✅ Files already committed — skipping commit step"
else
  git commit -m "fix: earnings card readable in all themes; signals go view-only after window

- My Submissions Total Earnings card: themed panel + orange border with
  the amount in brand orange — replaces the translucent orange gradient
  that rendered solid orange in light mode and muddy/unreadable in dark.
- Signals: when a signal's response window has closed (admin-set,
  default 3 days) the response buttons are hidden and replaced with
  '⏱ Response window closed — view-only'. History stays visible.

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
