# 🚀 Push iTrackHabit to App Store Connect

Everything is configured and ready! Here are the **exact commands** to push your app to the App Store:

## ✅ Prerequisites Complete
- [x] Dependencies resolved
- [x] EAS Build configured  
- [x] Project linked to Expo
- [x] App Store metadata prepared
- [x] All assets ready

## 🎯 Submit to App Store Connect

### Option 1: One-Command Submit (Recommended)
```bash
cd /Users/bishalaryal/Documents/Github/iTrackHabit/frontend
npx eas build --platform ios --profile production --auto-submit
```
This will:
1. Prompt for Apple ID/password (one-time setup)
2. Generate certificates automatically
3. Build the IPA file
4. Submit directly to App Store Connect

### Option 2: Step-by-Step
```bash
# 1. Set up credentials (one-time)
npx eas credentials

# 2. Build for production
npx eas build --platform ios --profile production

# 3. Submit after build completes
npx eas submit --platform ios --latest
```

### Option 3: Use the Automated Script
```bash
./submit-to-appstore.sh
```

## 📱 What You'll Need During Setup
- **Apple ID** (your developer account email)
- **App-specific password** (generate at appleid.apple.com)
- **2FA device** (for Apple ID verification)

## ⏱️ Timeline
- **Credential setup**: 2-3 minutes
- **Build time**: 10-20 minutes  
- **Upload to App Store Connect**: 2-5 minutes
- **Apple review**: 24-48 hours

## 📊 Monitor Progress
- **Build status**: https://expo.dev/accounts/biszaal/projects/itrackhabit
- **App Store Connect**: https://appstoreconnect.apple.com

## 🎉 After Submission
1. Go to App Store Connect
2. Complete app metadata (description, screenshots)
3. Submit for review
4. Wait for approval
5. App goes live!

## 🔧 Troubleshooting
If you get errors:
```bash
# Check authentication
npx eas whoami

# View recent builds
npx eas build:list

# Check project status
npx eas project:info
```

**Your app is completely ready for App Store submission!** 🚀

Just run the commands above and follow the prompts to push to App Store Connect.