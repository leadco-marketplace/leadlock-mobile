#!/bin/bash
cd "$(dirname "$0")"
rm -f .git/index.lock .git/HEAD.lock .git/refs/heads/main.lock

echo "📦 Pushing mobile changes + custom notification sound..."
git add App.tsx app.json assets/lead-alert.wav
git commit -m "feat: bundle cash register notification sound (lead-alert.wav)"
git push origin main

echo ""
echo "🚀 Submitting new TestFlight build..."
npx eas-cli build --platform ios --profile production --non-interactive

echo ""
echo "✅ Done! TestFlight build queued (~15-20 min)."
echo ""
read -n 1 -s -r -p "Press any key to close."
