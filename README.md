# iTrackHabit Frontend

A React Native habit tracking app built with Expo and TypeScript.

## Features

### ✅ Core Features
- **Habit Management**: Create, edit, and delete habits with customizable frequency
- **Progress Tracking**: Mark habits as done/skip with visual feedback
- **Calendar View**: Monthly heatmap showing habit completion patterns
- **Statistics**: Streaks, completion rates, and performance analytics
- **Notes**: Add daily notes to track thoughts and motivations

### ✅ Social Features
- **Friends System**: Add friends, send/accept requests
- **Habit Sharing**: Share progress with friends
- **Challenges**: Create and join habit challenges
- **Leaderboards**: Compete with friends on streaks and completion rates

### ✅ UI/UX
- **Modern Design**: Clean, intuitive interface with consistent styling
- **Tab Navigation**: Easy access to all major features
- **Responsive**: Works on various screen sizes
- **Accessibility**: Proper labeling and touch targets

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── HabitCard.tsx   # Main habit display component
│   ├── Button.tsx      # Reusable button component
│   └── CalendarHeatmap.tsx # Calendar visualization
├── screens/            # Screen components
│   ├── HomeScreen.tsx  # Main habits list
│   ├── CalendarScreen.tsx # Calendar and statistics
│   ├── ChallengesScreen.tsx # Challenges management
│   ├── FriendsScreen.tsx # Friends and social features
│   ├── ProfileScreen.tsx # User profile and settings
│   ├── CreateEditHabitScreen.tsx # Habit creation/editing
│   └── HabitDetailsScreen.tsx # Individual habit details
├── navigation/         # Navigation configuration
├── types/             # TypeScript interfaces
└── utils/            # Utility functions
```

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on device/simulator:
```bash
# iOS
npm run ios

# Android  
npm run android

# Web (for testing)
npm run web
```

## Data Models

### Habit
```typescript
interface Habit {
  id: string;
  userId: string;
  title: string;
  notes?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
  // Sync fields
  pending: boolean;
  serverId?: string;
}
```

### Progress Tracking
```typescript
interface HabitProgress {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  status: 'done' | 'skip';
  notes?: string;
  updatedAt: string;
  // Sync fields
  pending: boolean;
  serverId?: string;
}
```

## Backend Integration Ready

The app is designed for offline-first operation with optional cloud sync:

- **Local Storage**: All data can be stored locally using SQLite/WatermelonDB
- **Sync Engine**: Ready for AWS AppSync integration
- **Conflict Resolution**: Timestamp-based conflict resolution
- **Social Features**: Designed for real-time updates via subscriptions

## Next Steps

1. **Local Database**: Integrate WatermelonDB for offline storage
2. **AWS Backend**: Connect to AppSync/DynamoDB for cloud sync
3. **Authentication**: Add AWS Cognito for user accounts
4. **Push Notifications**: Implement habit reminders
5. **Testing**: Add unit and integration tests

## Dependencies

### Core
- React Native 0.79+ with Expo 53+
- TypeScript for type safety
- React Navigation 7+ for navigation

### UI/UX
- @expo/vector-icons for icons
- React Native Gesture Handler for interactions

### Storage (Ready for Integration)
- @nozbe/watermelondb for offline database
- @react-native-async-storage/async-storage for simple storage

### Backend (Ready for Integration)  
- AWS Amplify libraries for backend integration
- GraphQL for API communication

## Development Guidelines

- **TypeScript First**: All components use TypeScript
- **Component Structure**: Functional components with hooks
- **Styling**: StyleSheet with consistent design tokens
- **Navigation**: Type-safe navigation with proper param validation
- **Error Handling**: Graceful error states and user feedback

## Architecture

The app follows a modular architecture:

1. **Presentation Layer**: React Native screens and components
2. **Navigation Layer**: Centralized routing configuration  
3. **Data Layer**: TypeScript interfaces ready for backend integration
4. **Business Logic**: Utility functions and data transformations

This architecture supports the full roadmap from offline-first MVP to social habit tracking platform.