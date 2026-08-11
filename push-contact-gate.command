#!/bin/bash
cd "$(dirname "$0")"

echo "🔧 Removing any stale git lock files..."
rm -f .git/HEAD.lock .git/index.lock

echo ""
echo "📱 Commit 1/2: Title Case on card titles + guest headlines..."
git add src/components/LeadCard.tsx src/components/UnlockModal.tsx \
        src/screens/buyer/MyLeadsScreen.tsx src/screens/provider/MySubmissionsScreen.tsx \
        src/screens/provider/SignalsScreen.tsx src/screens/shared/GuestLockedScreen.tsx
git commit -m "style: Title Case on lead card titles + guest teaser headlines

textTransform capitalize on job_type titles (Live Feed, My Leads,
My Submissions, Signals, unlock modal); guest teasers now 'Your
Unlocked Leads Live Here' / 'Never Miss A Lead Again' / 'Your
Account & Wallet'.

Co-Authored-By: Claude <noreply@anthropic.com>" || echo "ℹ️  Title Case already committed."

echo ""
echo "📱 Commit 2/2: Contact gate UI..."
git add src/lib/api.ts src/screens/buyer/LeadDetailScreen.tsx
git commit -m "feat(trust): contact gate UI — direct contact hidden during masked window

The server now sends first name only while the 14-day masked-number
window is active (contact_hidden=true). Lead detail shows the name +
a clear note: direct phone & email unlock on <date>; call through the
masked number until then. Full contact renders automatically once the
window ends.

Co-Authored-By: Claude <noreply@anthropic.com>" || echo "ℹ️  Contact gate already committed."

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
