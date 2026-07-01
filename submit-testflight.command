#!/bin/bash
cd "$(dirname "$0")"

echo "🍎 Submitting latest build to TestFlight..."
npx eas-cli submit --platform ios --latest --non-interactive

echo ""
echo "✅ Submitted! Apple will process it in a few minutes."
echo "   Check TestFlight on your phone shortly."
echo ""
read -n 1 -s -r -p "Press any key to close."
