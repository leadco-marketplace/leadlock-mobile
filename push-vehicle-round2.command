#!/bin/bash
cd "$(dirname "$0")"
echo "🔧 Removing any stale git lock files..."
rm -f .git/HEAD.lock .git/index.lock
echo ""
echo "📱 Staging: vehicle on cards, strict make, job-type chips..."
git add src/lib/api.ts src/lib/leadTags.ts src/components/LeadCard.tsx \
        src/components/UnlockModal.tsx src/screens/provider/SubmitLeadScreen.tsx
if git diff --cached --quiet; then
  echo "✅ Files already committed — skipping commit step"
else
  git commit -m "feat: vehicle shown on lead cards + unlock modal; strict make; job-type chips

- Live Feed cards and the unlock modal show the vehicle ('🚗 2019 BMW
  X7') for automotive leads — buyers see it BEFORE buying.
- Vehicle make is strict: typed text must match the list (error alert
  otherwise); picking 'Other' reveals a custom make field.
- Context chips resolve per JOB TYPE (car-key chips for car-key jobs
  etc.), category fallback otherwise — leadTags kept identical to web.

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
