# Supabase Integration Setup Guide

## Overview

iTrackHabit now features full Supabase integration with offline-first architecture. This provides:

- **Cloud Database**: All data backed up to Supabase PostgreSQL
- **Real-time Sync**: Live updates across devices
- **Offline-First**: App works fully offline, syncs when online
- **Authentication**: Secure user accounts and data isolation
- **Social Features**: Friends, challenges, and leaderboards

## Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Choose organization and enter project details:
   - **Name**: iTrackHabit
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
4. Wait for project to be created

### 2. Configure Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `/supabase-schema.sql` from the project root
3. Paste into the SQL Editor and click **Run**
4. Verify tables are created in **Table Editor**

### 3. Configure Environment Variables

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon/public key**
3. Update `.env.local` in the frontend directory:

```env
# Replace with your actual Supabase credentials
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Test the Integration

```bash
cd frontend
npm start
```

## Features & Architecture

### Offline-First Design

The app works completely offline and syncs to Supabase when online:

```
Local SQLite ←→ DataService ←→ SupabaseService ←→ Supabase Cloud
     ↓              ↓              ↓              ↓
  Always works   Smart sync   Real-time sync   Cloud backup
```

### Authentication Flow

1. **Supabase First**: Tries Supabase auth if configured
2. **Fallback Mode**: Falls back to demo/mock auth if Supabase unavailable
3. **Seamless UX**: Users don't need to know which auth is active

```typescript
// Example: Login works with or without Supabase
await authService.login({ email: 'user@example.com', password: 'password' });
```

### Data Synchronization

#### Automatic Sync Triggers:
- **On app start**: Initial sync if online
- **After creating/editing habits**: Auto-sync new changes
- **Periodic sync**: Every 5 minutes when online
- **Real-time**: Live updates via Supabase subscriptions

#### Conflict Resolution:
- **Server wins**: Server data takes precedence in conflicts
- **Pending flag**: Local changes marked as pending until synced
- **Timestamps**: Last updated timestamp used for sync ordering

### Real-time Features

When authenticated with Supabase:
- **Live habit updates** across devices
- **Real-time progress sync** for challenges
- **Social features** with friends and leaderboards
- **Badge notifications** when achievements are earned

## Development & Testing

### Testing Offline-First Behavior

1. **Pure Offline**: Comment out Supabase credentials in `.env.local`
   ```env
   # EXPO_PUBLIC_SUPABASE_URL=disabled
   # EXPO_PUBLIC_SUPABASE_ANON_KEY=disabled
   ```

2. **Online/Offline Toggle**: Use device airplane mode to test sync

3. **Multi-device Testing**: Login same account on multiple devices

### Debugging Sync Issues

Check console logs for sync status:
```typescript
// Enable debug logging
console.log('🔄 Syncing to Supabase...')
console.log('📤 Syncing X habits and Y progress entries')
console.log('✅ Successfully synced to Supabase')
```

Common sync messages:
- `📤 Supabase not configured, skipping sync` - Normal for offline-only mode
- `📤 Not authenticated with Supabase, skipping sync` - User not logged in
- `❌ Sync to Supabase failed` - Check network/credentials

## Advanced Configuration

### Environment Setup

The app checks for Supabase credentials in this order:
1. `Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL`
2. `process.env.EXPO_PUBLIC_SUPABASE_URL`

For production builds, use Expo's environment configuration.

### Custom Sync Intervals

```typescript
// Disable auto-sync
await dataService.disableAutoSync();

// Enable auto-sync with custom interval
await dataService.enableAutoSync(); // 5 minutes default

// Force immediate sync
await dataService.forcSync();
```

### Real-time Subscriptions

Real-time updates are automatically enabled when:
- Supabase is configured
- User is authenticated
- Network is available

Subscriptions include:
- Habit changes (create, update, delete)
- Progress updates for shared challenges
- Badge awards and social interactions

## Database Schema

### Core Tables

- **users**: User profiles and subscription status
- **habits**: Habit definitions with target configuration
- **habit_logs**: Daily progress tracking
- **streaks**: Calculated streak data for performance

### Social Features

- **friends**: Friend relationships
- **challenges**: Group challenges and competitions
- **challenge_participants**: Challenge membership
- **activities**: Social activity feed

### Gamification

- **badges**: Achievement definitions
- **user_badges**: Earned user achievements
- **user_xp**: Experience points and levels

## Security & Privacy

### Row Level Security (RLS)

All tables use Supabase RLS policies:
- Users can only access their own data
- Friends can view each other's public activities
- Challenge participants can view challenge data

### Data Privacy

- **Local-first**: All data stored locally first
- **Encrypted transit**: HTTPS/WSS for all communications
- **No tracking**: No analytics or tracking beyond core functionality
- **User control**: Users can export or delete all data

## Troubleshooting

### Common Issues

1. **Sync not working**:
   - Verify environment variables are correct
   - Check network connectivity
   - Confirm user is authenticated

2. **Real-time updates not received**:
   - Check Supabase dashboard for active connections
   - Verify RLS policies allow access
   - Confirm WebSocket connection is established

3. **Authentication failures**:
   - Double-check Supabase project URL and keys
   - Verify email confirmation if required
   - Check Supabase auth settings

### Support Channels

1. Check console logs for detailed error messages
2. Verify Supabase dashboard shows expected data
3. Test with demo account: `demo@itrackhabit.com` / `password123`
4. Review network requests in browser dev tools

## Production Deployment

### Checklist

- [ ] Supabase project created and configured
- [ ] Database schema deployed
- [ ] Environment variables configured
- [ ] Authentication providers enabled
- [ ] RLS policies tested
- [ ] Email templates configured (optional)
- [ ] Database backups enabled
- [ ] Monitoring and alerts set up

### Performance Considerations

- **Efficient sync**: Only syncs changed data
- **Batched operations**: Multiple changes sent together
- **Local caching**: Minimizes server requests
- **Background sync**: Doesn't block user interactions

## Migration from Offline-Only

If upgrading from offline-only version:

1. Existing data remains in local SQLite
2. When user creates Supabase account, data syncs automatically
3. No data loss or migration required
4. App continues working offline if sync fails

The integration is designed to be completely backward compatible.