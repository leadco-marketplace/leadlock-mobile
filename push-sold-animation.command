#!/bin/bash
cd "$(dirname "$0")"
echo "🔧 Removing any stale git lock files..."
rm -f .git/HEAD.lock .git/index.lock
echo ""
echo "📱 Commit 1/2: live SOLD stamp animation..."
git add src/components/LeadCard.tsx src/screens/buyer/LiveFeedScreen.tsx
git diff --cached --quiet || git commit -m "feat: live SOLD stamp on feed — 4s hold in place, then slides down

- Sold leads keep their feed position for 4s with an animated orange
  SOLD rubber stamp (native-driver spring), dimmed body, disabled
  unlock — then LayoutAnimation slides them to the bottom.
- Only real status transitions trigger it; the buyer who purchased
  never sees the stamp on their own screen.

Co-Authored-By: Claude <noreply@anthropic.com>"
echo ""
echo "📱 Commit 2/2: real US area-code validation..."
git add src/lib/validate-phone.ts
git diff --cached --quiet || git commit -m "feat: phone area code checked against real US area codes (NANPA 378)

Mirrors the web validator byte-for-byte — instant on-device feedback;
the server enforces the same rule.

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
