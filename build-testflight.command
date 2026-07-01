#!/bin/bash
cd "$(dirname "$0")"

echo "🔧 Removing any stale git lock files..."
rm -f .git/HEAD.lock .git/index.lock

echo ""
echo "📱 Staging Option 4 card redesign (left thumbnail + condensed type)..."
git add src/components/LeadCard.tsx

# Commit only if there's something new to commit
if git diff --cached --quiet; then
  echo "✅ Files already committed — skipping commit step"
else
  git commit -m "feat: premium lead card — left category thumbnail + condensed type

- Layout: 82px gradient left column (category colour + monogram initials)
  + right content column (flex: 1), flexDirection: row
- Typography: AvenirNextCondensed-Heavy (iOS) / sans-serif-condensed (Android)
  for category name (19px/900) and price (22px/900)
- 20 service categories each mapped to a unique gradient colour pair
- All existing features preserved: LIVE badge orange glow blink (0.8s cycle),
  highlight pulse + Your Lead banner, SOLD stamp, distance badge, quality badge
- Upgrade to Barlow Condensed later: npm install @expo-google-fonts/barlow-condensed

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
fi

echo ""
echo "🚀 Pushing to GitHub..."
git push origin main
echo "✅ leadlock-mobile pushed!"

echo ""
echo "🏗  Starting EAS iOS build + TestFlight submit..."
echo "n" | eas build --platform ios --profile production --auto-submit --clear-cache

echo ""
echo "✅ Build submitted to TestFlight!"
read -p "Press Enter to close..."
