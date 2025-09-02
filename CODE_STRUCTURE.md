# iTrackHabit - Clean Code Structure

## 📁 Project Organization

The codebase has been reorganized into a clean, domain-driven architecture for better maintainability and scalability.

## 🗂️ Folder Structure

```
src/
├── 📱 screens/           # UI Screens organized by feature domain
│   ├── auth/            # Authentication & onboarding screens
│   ├── habits/          # Habit management screens
│   ├── social/          # Social & community features
│   ├── analytics/       # Analytics & insights screens
│   ├── settings/        # Settings & profile screens
│   ├── premium/         # Premium features & achievements
│   └── index.ts         # Centralized screen exports
│
├── 🔧 services/         # Business logic organized by domain
│   ├── core/           # Core infrastructure services
│   ├── auth/           # Authentication services
│   ├── habits/         # Habit-related services
│   ├── social/         # Social & community services
│   ├── analytics/      # Data analysis & insights
│   ├── premium/        # Premium features & payments
│   ├── health/         # Health data integration
│   ├── notifications/  # Notification management
│   └── index.ts        # Centralized service exports
│
├── 🧩 components/      # Reusable UI components
│   ├── neumorphism/    # Neumorphic design system
│   └── index.ts        # Component exports
│
├── 🛠️ utils/           # Utility functions
│   ├── validation/     # Form validation utilities
│   ├── formatting/     # Data formatting utilities
│   ├── helpers/        # Common helper functions
│   └── index.ts        # Utility exports
│
├── 📋 constants/       # Application constants
│   ├── app.ts          # App configuration & constants
│   └── index.ts        # Constants exports
│
├── 🎯 types/           # TypeScript type definitions
├── 🎨 theme/           # Design system & theming
├── 🔗 navigation/      # App navigation configuration
├── 🎣 hooks/           # Custom React hooks
├── 📊 contexts/        # React contexts
├── ⚙️ config/          # Configuration files
├── 💾 data/            # Static data & templates
└── 🎬 animations/      # Animation presets
```

## 🏗️ Architecture Benefits

### 1. **Domain-Driven Organization**
- Features are grouped by business domain
- Easy to locate related functionality
- Supports team collaboration on specific features

### 2. **Centralized Exports**
- Each folder has an `index.ts` file
- Clean import statements: `import { LoginScreen } from '../screens/auth'`
- Easy to maintain and refactor

### 3. **Separation of Concerns**
- **Screens**: UI components and user interaction
- **Services**: Business logic and data management
- **Utils**: Pure utility functions
- **Constants**: Configuration and static values

### 4. **Scalability**
- Easy to add new features within existing domains
- Clear boundaries between different parts of the app
- Supports code splitting and lazy loading

## 📤 Import Examples

### Before Reorganization
```typescript
import { LoginScreen } from '../screens/LoginScreen';
import { AuthService } from '../services/AuthService';
import { validateEmail } from '../utils/validation';
```

### After Reorganization
```typescript
import { LoginScreen } from '../screens/auth';
import { authService } from '../services/auth';
import { validateEmail } from '../utils/validation';
```

## 🔧 Service Organization

### Core Services
- **DataService**: Main data management
- **ApiService**: HTTP client and API calls
- **OfflineStorage**: Local data persistence
- **NetworkService**: Network connectivity
- **SupabaseService**: Backend integration

### Feature Services
- **Auth**: User authentication & onboarding
- **Habits**: Habit creation, tracking, timers
- **Social**: Friends, challenges, community
- **Analytics**: Insights, statistics, AI analysis
- **Premium**: Payments, achievements, badges
- **Health**: Health data integration
- **Notifications**: Smart reminders & alerts

## 📱 Screen Organization

### Domain-Based Grouping
- **Auth**: Login, Register, Welcome, Onboarding
- **Habits**: Create, Edit, Timer, Templates, Groups
- **Social**: Friends, Challenges, Feed, Contacts
- **Analytics**: Calendar, Progress, AI Insights
- **Settings**: Profile, Notifications, Privacy, Data
- **Premium**: Subscription, Achievements, Mentors

## 🛠️ Utility Functions

### Organized by Purpose
- **Validation**: Form validation for auth, habits, etc.
- **Formatting**: Time, date, number formatting
- **Helpers**: Common utility functions for specific domains

## 🎯 Constants

### Centralized Configuration
- App metadata and settings
- Storage keys for persistence
- API endpoint definitions
- Habit types and frequencies
- Feature flags and limits

## 📈 Benefits Achieved

1. **Maintainability**: Easy to find and modify code
2. **Scalability**: Clear structure for adding features
3. **Collaboration**: Team members can work on different domains
4. **Testing**: Isolated components are easier to test
5. **Performance**: Enables code splitting and lazy loading
6. **Developer Experience**: Intuitive file organization

This clean architecture provides a solid foundation for the iTrackHabit app's continued development and maintenance.