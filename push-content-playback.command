#!/bin/bash
cd "$(dirname "$0")"

echo "🔧 Removing any stale git lock files..."
rm -f .git/HEAD.lock .git/index.lock

echo ""
echo "📱 Staging: in-app recording playback + category content + picker casing..."
git add package.json package-lock.json src/lib/leadTags.ts \
        src/screens/buyer/LeadDetailScreen.tsx src/screens/provider/SubmitLeadScreen.tsx

if git diff --cached --quiet; then
  echo "✅ Files already committed — skipping commit step"
else
  git commit -m "feat: in-app recording playback + relevant context chips + picker Title Case

- Call recordings now play INSIDE the app (expo-av ~16.0.8, SDK 54
  pinned version) — streamed through the authenticated proxy with the
  Bearer token; Play/Stop toggle, auto-stop at end, plays in silent
  mode. No more kicking out to Safari.
- leadTags: 133 category-specific Lead Context chip sets (was 58 with
  stale keys) — chips now always match the selected category.
- Product/Service Type picker sheet title now capitalizes each word.

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
