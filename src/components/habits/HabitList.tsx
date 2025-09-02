import React from 'react';
import { FlatList, View, StyleSheet, RefreshControl } from 'react-native';
import { HabitCard, HabitCardProps } from './HabitCard';
import { EmptyState } from '../ui';
import { Habit } from '../../types';
import { theme } from '../../theme/index';

export interface HabitListProps {
  habits: Habit[];
  onHabitPress?: (habit: Habit) => void;
  onHabitToggle?: (habitId: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  showProgress?: boolean;
  compact?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionText?: string;
  onEmptyAction?: () => void;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
}

export const HabitList: React.FC<HabitListProps> = ({
  habits,
  onHabitPress,
  onHabitToggle,
  refreshing = false,
  onRefresh,
  showProgress = true,
  compact = false,
  emptyTitle = "No habits yet",
  emptyDescription = "Create your first habit to get started on your journey",
  emptyActionText = "Create Habit",
  onEmptyAction,
  ListHeaderComponent,
  ListFooterComponent,
}) => {
  const renderHabit = ({ item: habit }: { item: Habit }) => (
    <HabitCard
      habit={habit}
      onPress={() => onHabitPress?.(habit)}
      onToggle={onHabitToggle}
      showProgress={showProgress}
      compact={compact}
    />
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="list-outline"
      title={emptyTitle}
      description={emptyDescription}
      actionText={emptyActionText}
      onAction={onEmptyAction}
      variant="large"
    />
  );

  const ItemSeparatorComponent = () => <View style={styles.separator} />;

  return (
    <FlatList
      data={habits}
      renderItem={renderHabit}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.container,
        habits.length === 0 && styles.emptyContainer
      ]}
      ItemSeparatorComponent={compact ? undefined : ItemSeparatorComponent}
      ListEmptyComponent={renderEmptyState}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        ) : undefined
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: {
    height: theme.spacing.sm,
  },
});