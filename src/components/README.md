# Components

This directory contains all reusable UI components organized by feature domain.

## Structure

```
components/
├── analytics/          # Analytics-specific components
├── habits/            # Habit management components
├── neumorphism/       # Neumorphic design components
├── ui/               # Generic UI components
└── [legacy files]    # Individual component files (to be organized)
```

## Component Categories

### Analytics Components (`./analytics/`)

Components for displaying data visualizations and analytics.

- **OverviewCards**: Grid of metric cards showing key statistics
- **ProgressChart**: Chart component with period selector
- **TopHabits**: Ranked list of best performing habits

### Habit Components (`./habits/`)

Components for habit management and tracking.

- **HabitCard**: Individual habit display with progress
- **HabitList**: Scrollable list of habits with empty states
- **StreakCounter**: Visual streak counter with encouragement
- **HabitProgress**: Progress entry display with status indicators

### UI Components (`./ui/`)

Generic, reusable UI components.

- **MetricCard**: Flexible metric display card
- **EmptyState**: Empty state with icon and action
- **LoadingSpinner**: Loading indicator with optional text
- **SectionHeader**: Section headers with optional actions

### Neumorphism Components (`./neumorphism/`)

Design system components with neumorphic styling.

- **NeumorphCard**: Basic card with neumorphic styling
- **NeumorphButton**: Button with neumorphic effects
- **NeumorphInput**: Input field with neumorphic design
- **NeumorphModal**: Modal with neumorphic styling

## Usage Examples

### Using Analytics Components

```tsx
import { OverviewCards, ProgressChart, TopHabits } from '../components/analytics';
import { useAnalytics } from '../hooks/useAnalytics';

const AnalyticsScreen = () => {
  const { analyticsData } = useAnalytics();
  
  return (
    <ScrollView>
      <OverviewCards cards={getOverviewCards()} />
      <ProgressChart 
        weeklyData={analyticsData.weeklyProgress}
        monthlyData={analyticsData.monthlyProgress}
      />
      <TopHabits habits={analyticsData.habitStats} />
    </ScrollView>
  );
};
```

### Using Habit Components

```tsx
import { HabitList, StreakCounter } from '../components/habits';
import { useHabits, useHabitProgress } from '../hooks';

const HabitsScreen = () => {
  const { habits, loading } = useHabits();
  const { toggleHabitProgress } = useHabitProgress();
  
  return (
    <HabitList
      habits={habits}
      onHabitToggle={toggleHabitProgress}
      refreshing={loading}
    />
  );
};
```

### Using UI Components

```tsx
import { MetricCard, EmptyState, SectionHeader } from '../components/ui';

const StatsScreen = () => (
  <View>
    <SectionHeader 
      title="Your Stats" 
      actionText="View All"
      onAction={() => {}}
    />
    <MetricCard
      title="Total Habits"
      value={42}
      icon="list"
      onPress={() => {}}
    />
    <EmptyState
      title="No data yet"
      description="Start tracking to see stats"
      actionText="Add Habit"
      onAction={() => {}}
    />
  </View>
);
```

## Design Principles

1. **Reusability**: Components are designed to be used across multiple screens
2. **Flexibility**: Props allow customization for different use cases
3. **Consistency**: All components follow the same design system
4. **Performance**: Components are optimized for React Native performance
5. **Accessibility**: Components include proper accessibility labels

## Styling

All components use the centralized theme system from `../theme/index.ts`. This ensures consistent:

- Colors and gradients
- Typography scales
- Spacing values
- Border radius values
- Shadow effects

## Contributing

When adding new components:

1. Choose the appropriate category directory
2. Export the component in the category's `index.ts`
3. Include TypeScript interfaces for props
4. Follow the existing naming conventions
5. Add examples to this README if introducing a new pattern