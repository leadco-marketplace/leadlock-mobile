#!/bin/bash
cd "$(dirname "$0")"

echo "🔧 Removing any stale git lock files..."
rm -f .git/HEAD.lock .git/index.lock

echo ""
echo "📱 Staging: Edit Details + call outcomes + compact category picker..."
git add src/lib/api.ts src/screens/provider/MySubmissionsScreen.tsx \
        src/screens/provider/SubmitLeadScreen.tsx \
        src/components/LeadCard.tsx src/components/UnlockModal.tsx \
        src/screens/buyer/MyLeadsScreen.tsx src/screens/buyer/LeadDetailScreen.tsx \
        src/screens/provider/SignalsScreen.tsx src/screens/shared/GuestLockedScreen.tsx

if git diff --cached --quiet; then
  echo "✅ Files already committed — skipping commit step"
else
  git commit -m "feat: Edit Lead Details, AI call outcomes on submissions, compact category picker

- My Submissions: 'Edit Details' sheet — customer name/phone/email and
  job description editable, INCLUDING after the lead is sold (wrong-number
  fixes); price editable pre-sale only. Buyer is notified server-side
  when a sold lead's contact is corrected.
- Call Result pill on each submission card: Job Booked / Appt Scheduled /
  Spoke To Customer / Callback / No Answer / Voicemail — from the AI call
  analysis, so providers see proof of what happened on the buyer's call.
- Select Category is now a compact bottom sheet (~78% height, rounded top,
  dimmed backdrop, tap-out to close) instead of a full-screen takeover —
  also fixes the Back button that hid under the iPhone status bar.
- Title Case everywhere: lead card titles (job_type) on Live Feed,
  My Leads, My Submissions, Signals, lead detail, and the unlock modal
  capitalize every word; guest teaser headlines updated to Title Case
  ('Your Unlocked Leads Live Here', 'Never Miss A Lead Again',
  'Your Account & Wallet').

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
