# iTrackHabit App Store Submission Guide

## Prerequisites ✅
- [x] App code is complete and tested
- [x] Dependencies are resolved (completed)
- [x] EAS Build is configured
- [x] App assets (icons, splash screens) are ready
- [x] App Store metadata is prepared

## Required Before Submission

### 1. Apple Developer Account
- Sign up for Apple Developer Program ($99/year)
- Verify your account with Apple
- Accept developer agreements

### 2. App Store Connect Setup
- Create new app in App Store Connect
- Fill in app information:
  - Name: "iTrackHabit"
  - Bundle ID: "com.biszaal.itrackhabit"
  - SKU: "itrackhabit-001"
  - Primary Language: English

## Step-by-Step Submission Process

### Step 1: Set up iOS Credentials
```bash
cd /Users/bishalaryal/Documents/Github/iTrackHabit/frontend
npx eas credentials
```
- Select "iOS" platform
- Choose "Build credentials (used for building the app binary)"
- Let EAS generate/manage certificates automatically
- Provide Apple ID and password when prompted

### Step 2: Build for Production
```bash
npx eas build --platform ios --profile production
```
- This will create a signed IPA file
- Build will be available at: https://expo.dev/accounts/biszaal/projects/itrackhabit/builds
- Download the IPA when build completes

### Step 3: Submit to App Store
```bash
npx eas submit --platform ios --profile production
```
OR upload manually:
- Use Transporter app (macOS)
- Upload the IPA file to App Store Connect

### Step 4: Configure App Store Connect

#### App Information
- **Name**: iTrackHabit
- **Subtitle**: Beautiful habit tracker with offline-first design
- **Category**: Productivity (Primary), Health & Fitness (Secondary)
- **Content Rights**: No, it does not contain, show, or access third-party content

#### Pricing and Availability
- **Price**: Free
- **Availability**: All countries

#### App Store Metadata (from store-assets/app-store-description.md)
- **Description**: [Use prepared description]
- **Keywords**: habits, productivity, tracking, wellness, self-improvement, routine, goals, motivation, analytics, offline
- **Support URL**: [Add your support website]
- **Marketing URL**: [Optional]

#### Screenshots Required
You need to provide screenshots for:
- iPhone 6.7" (iPhone 15 Pro Max, 14 Pro Max, 13 Pro Max, 12 Pro Max)
- iPhone 6.5" (iPhone 11 Pro Max, XS Max)
- iPhone 5.5" (iPhone 8 Plus, 7 Plus, 6s Plus, 6 Plus)

#### App Review Information
- **Demo Account**: Not required (no login needed)
- **Notes**: This app tracks user habits locally on device with optional cloud sync. No sensitive data is collected. The app works fully offline and respects user privacy.

### Step 5: Submit for Review
1. Upload screenshots
2. Fill in release notes
3. Select manual or automatic release
4. Submit for App Store review

## Expected Timeline
- **Build Time**: 10-20 minutes
- **App Review**: 24-48 hours (Apple's current average)
- **Release**: Automatic after approval (if selected)

## Troubleshooting

### Common Issues
1. **Certificate Issues**: Let EAS manage certificates automatically
2. **Bundle ID Mismatch**: Ensure iOS project and app.json match
3. **Missing Permissions**: All required permissions are configured
4. **App Icon Issues**: All sizes are provided in assets folder

### Build Logs
- Check build status: `npx eas build:list`
- View logs: https://expo.dev/accounts/biszaal/projects/itrackhabit/builds

## Current Status
✅ Project configured and ready for submission
✅ Dependencies resolved
✅ EAS Build project linked
✅ Store metadata prepared
⏳ Awaiting Apple Developer Account setup
⏳ Awaiting interactive credential configuration

## Next Actions Required
1. **Purchase Apple Developer Program membership**
2. **Run `npx eas credentials` in interactive mode**  
3. **Build and submit following the steps above**

The app is technically ready for App Store submission once credentials are set up!

## Additional Notes
- App supports iOS 12.0+ (configured in Info.plist)
- Bundle identifier: com.biszaal.itrackhabit
- Version: 1.0.0 (Build 1)
- No third-party content or sensitive permissions required
- Privacy-focused offline-first design