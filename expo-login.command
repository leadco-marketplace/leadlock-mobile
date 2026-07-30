#!/bin/bash
cd "$(dirname "$0")"

echo "🔑 Logging in to Expo (EAS)..."
echo ""
echo "Enter your Expo account email (likely aeschela@gmail.com or"
echo "aeschela@hotmail.com) and password when prompted."
echo ""
npx eas-cli login

echo ""
echo "Checking who is logged in:"
npx eas-cli whoami

echo ""
echo "✅ If you see your username above, login worked."
echo "   Now double-click push-onboarding.command to start the build."
echo ""
read -p "Press Enter to close..."
