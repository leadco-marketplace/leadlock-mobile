#!/bin/bash
set -e
cd "$(dirname "$0")"
echo "🔧 Removing any stale git lock files..."
rm -f .git/HEAD.lock .git/index.lock
echo ""
echo "🔐 Committing: expired-token fix (My Matches emptied after 60 min)..."
git add src/lib/api.ts
git commit -m "fix(auth): refresh expired session before every API call + retry once on 401

Access tokens live 60 minutes and iOS suspends the auto-refresh timer
in the background — an app woken after ~1h sent an EXPIRED token,
which the API silently treated as a guest: is_match=false on every
lead, My Matches emptied, notification taps toasted 'no longer
available'. Caught live on 58-minute-old notifications in the 4-phone
test. authHeaders() now refreshes proactively when the token is within
30s of expiry; request() force-refreshes and retries once on 401
(the API now answers 401 token_expired instead of silently guesting).

Co-Authored-By: Claude <noreply@anthropic.com>" || echo "ℹ️  Already committed."
echo ""
echo "🔐 Committing: trust tags + flag response on My Submissions..."
git add src/lib/api.ts src/screens/provider/MySubmissionsScreen.tsx
git commit -m "feat(trust): Sale Is Final tag + flagged-lead response on My Submissions

User design: verified leads carry a green '✓ Sale Is Final' tag on the
card; AI-flagged leads sort to the VERY TOP with a red '🚩 Needs
Response — Fix Now (N min left)' tag and a Respond To Flag button —
choose 'Fix The Number' (opens the edit sheet) or 'Number Is Correct —
Retry' (buyer re-notified; the next call decides). Awaiting-recall and
Sale-Reversed states shown too. trust_status flows from
/api/provider/leads.

Co-Authored-By: Claude <noreply@anthropic.com>" || echo "ℹ️  Already committed."
echo ""
echo "🐇 FLIPPING THE MOBILE APP TO NABBIT"
echo "   (domain cutover is done — the app now points at nabbitmarketplace.com)"
echo ""
git merge rebrand-nabbit -m "flip: mobile app → Nabbit (post domain cutover)

App name 'Nabbit', indigo+orange Na·bb·it wordmark on auth screens,
all API/link constants on www.nabbitmarketplace.com. Bundle ID, EAS
slug, deep-link scheme unchanged (App Store continuity).

Co-Authored-By: Claude <noreply@anthropic.com>"
echo ""
echo "🚀 Pushing to GitHub..."
git push origin main
git push origin rebrand-nabbit 2>/dev/null || true
echo ""
echo "🏗  Starting EAS iOS build + TestFlight submit (~15-25 min)..."
echo "n" | npx eas-cli build --platform ios --profile production --auto-submit
echo ""
echo "✅ Submitted! When TestFlight shows the new build, install it —"
echo "   your home screen icon will say 'Nabbit'."
read -p "Press Enter to close..."
