#!/bin/bash
cd "$(dirname "$0")"

echo "🔧 Removing any stale git lock files..."
rm -f .git/HEAD.lock .git/index.lock

echo ""
echo "📱 Staging call-options chooser..."
git add src/screens/buyer/LeadDetailScreen.tsx

if git diff --cached --quiet; then
  echo "✅ Files already committed — skipping commit step"
else
  git commit -m "feat: Call Customer chooser — phone app, Skype, Google Voice, or share

The bridge dial-in is a regular US number, so internet-calling apps can
reach it from anywhere. Tapping Call Customer now offers: native phone
app (tel:), Skype deep link, Google Voice link, or share/copy the number
+ extension — instead of forcing the native dialer. Unblocks buyers
calling from outside the US; call tracking unchanged (all options dial
the same bridge + PIN).

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
