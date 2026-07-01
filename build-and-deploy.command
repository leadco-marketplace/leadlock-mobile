#!/bin/bash
cd "$(dirname "$0")"

echo "Pushing server fix..."
cd "../leadlock" && git push origin main
echo "Server pushed!"

echo ""
echo "Pushing mobile + starting TestFlight build..."
cd "../leadlock-mobile"
git push origin main
echo "n" | eas build --platform ios --profile production --auto-submit --clear-cache

echo ""
echo "Done! Build submitted to TestFlight."
read -p "Press Enter to close..."
