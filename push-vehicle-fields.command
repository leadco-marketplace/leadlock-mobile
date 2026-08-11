#!/bin/bash
cd "$(dirname "$0")"

echo "🔧 Removing any stale git lock files..."
rm -f .git/HEAD.lock .git/index.lock

echo ""
echo "📱 Staging: searchable vehicle fields on Submit Lead..."
git add src/lib/api.ts src/screens/provider/SubmitLeadScreen.tsx

if git diff --cached --quiet; then
  echo "✅ Files already committed — skipping commit step"
else
  git commit -m "feat: searchable vehicle make/model/year fields on Submit Lead

- New SearchSelectField: type-to-filter suggestions with free text
  allowed (anything not in the list is accepted as-is — 'Other' is
  implicit). Model suggestions depend on the selected make via
  dependsOn/optionsByParent from the server field config.
- Case-insensitive job-type field resolution — revives the per-job-type
  field sets whose keys predated the Title Case change.
- Vehicle year/make/model are required for automotive locksmith job
  types (also enforced server-side).

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
