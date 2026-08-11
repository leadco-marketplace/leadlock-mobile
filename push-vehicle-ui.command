#!/bin/bash
cd "$(dirname "$0")"
echo "🔧 Removing any stale git lock files..."
rm -f .git/HEAD.lock .git/index.lock
echo ""
echo "📱 Staging: vehicle tag restyle + mandatory phone validation..."
git add src/components/LeadCard.tsx src/components/UnlockModal.tsx \
        src/screens/provider/SubmitLeadScreen.tsx src/lib/validate-phone.ts
if git diff --cached --quiet; then
  echo "✅ Files already committed — skipping commit step"
else
  git commit -m "fix: vehicle tag own line + theme color; customer phone mandatory + validated

- Vehicle tag moved OUT of the title row onto its own line under the
  job-type title — titles no longer truncate ('Car Key Cut &...').
- Color: black in light mode, brand orange (#f97316) in dark mode
  (was off-brand cyan). Same treatment in the unlock modal.
- Submit Lead: customer phone is REQUIRED and validated as a real US
  number (matches new server rule — empty/fake numbers are rejected).

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
echo "✅ Build submitted to TestFlight — install the new build to see the changes."
read -p "Press Enter to close..."
