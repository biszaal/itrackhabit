#!/bin/bash

# iTrackHabit - Complete App Store Submission Script
# Run this script to build and submit your app to App Store Connect

set -e

echo "🚀 iTrackHabit App Store Submission"
echo "=================================="
echo

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g @expo/eas-cli
fi

# Check login status
echo "🔍 Checking EAS authentication..."
if ! npx eas whoami &> /dev/null; then
    echo "❌ Not logged in to EAS. Please login first:"
    echo "   npx eas login"
    exit 1
fi

echo "✅ EAS authenticated"
echo

# Step 1: Set up iOS credentials
echo "📱 Step 1: Setting up iOS credentials..."
echo "This will prompt you for your Apple ID and password."
echo "EAS will generate/manage all certificates and provisioning profiles."
echo
read -p "Press Enter to continue with credential setup..."

npx eas credentials --platform ios

echo "✅ Credentials configured"
echo

# Step 2: Build for production
echo "🔨 Step 2: Building for App Store..."
echo "This will create a signed IPA file ready for App Store submission."
echo

npx eas build --platform ios --profile production --wait

echo "✅ Production build completed"
echo

# Step 3: Submit to App Store Connect
echo "📤 Step 3: Submitting to App Store Connect..."
echo "This will upload your app to App Store Connect for review."
echo

# Check if submit configuration exists
if grep -q "appleId" eas.json; then
    echo "Using configured App Store Connect credentials..."
    npx eas submit --platform ios --profile production
else
    echo "⚠️  App Store Connect credentials not configured in eas.json"
    echo "You'll need to provide your Apple ID when prompted."
    echo
    read -p "Press Enter to continue with submission..."
    npx eas submit --platform ios --latest
fi

echo
echo "🎉 SUCCESS! Your app has been submitted to App Store Connect!"
echo
echo "Next steps:"
echo "1. Go to App Store Connect (https://appstoreconnect.apple.com)"
echo "2. Complete your app's metadata (description, screenshots, etc.)"
echo "3. Submit for App Store review"
echo "4. Wait for Apple's approval (typically 24-48 hours)"
echo
echo "📊 Check build status: https://expo.dev/accounts/biszaal/projects/itrackhabit"
echo
echo "✨ Your app is now on its way to the App Store!"