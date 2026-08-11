#!/bin/bash
cd "$(dirname "$0")"

echo "🔧 Removing any stale git lock files..."
rm -f .git/HEAD.lock .git/index.lock

echo ""
echo "📱 Staging theme refresh (+ call options if not yet committed)..."
git add src/theme.ts src/screens/buyer/LeadDetailScreen.tsx

if git diff --cached --quiet; then
  echo "✅ Files already committed — skipping commit step"
else
  git commit -m "feat(ui): navy theme lightened 10% (OKLab mix toward white)

Matches the web refresh shipped the same day:
bg #040c1e→#162031, panel #081630→#1c2a43, panel2 #0d1d3a→#21304c,
panel3 #122248→#253659, border #182e52→#2c4162, border2 #1f3a68→#334c77.
Inner-light bg follows. Text/accent colors unchanged.

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
