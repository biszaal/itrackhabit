# Quick App Store Submission Commands

## Option 1: Automated Script
Run the complete submission script:
```bash
./submit-to-appstore.sh
```

## Option 2: Manual Step-by-Step

### Step 1: Set up credentials (one-time setup)
```bash
npx eas credentials
```
- Select "iOS"
- Choose "Build credentials" 
- Provide your Apple ID when prompted
- EAS will generate certificates automatically

### Step 2: Build and Submit in One Command
```bash
npx eas build --platform ios --profile production --auto-submit
```

### Alternative: Build First, Submit Later
```bash
# Build first
npx eas build --platform ios --profile production

# Then submit after build completes
npx eas submit --platform ios --latest
```

## Quick Status Check
```bash
# Check build status
npx eas build:list

# Check current login
npx eas whoami
```

## Requirements Checklist
- ✅ Apple Developer Program membership ($99/year)
- ✅ EAS CLI installed and authenticated 
- ✅ App configured and dependencies resolved
- ✅ Bundle ID registered in Apple Developer Portal
- ⏳ Interactive terminal for credential setup

## What Happens After Submission
1. App is uploaded to App Store Connect
2. You complete metadata in App Store Connect web interface
3. Submit for App Store review
4. Apple reviews (24-48 hours typical)
5. App goes live automatically after approval

**The app is technically ready - just needs Apple account authentication!**