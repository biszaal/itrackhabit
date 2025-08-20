import React, { useRef, useEffect } from 'react';
import {
  FlatList,
  ListRenderItem,
  RefreshControl,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  runOnJS,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../theme';
import { HabitWithStats } from '../types';
import { AnimatedHabitCard } from './AnimatedHabitCard';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

interface AnimatedHabitsListProps {
  data: HabitWithStats[];
  refreshing?: boolean;
  onRefresh?: () => void;
  onHabitPress?: (habitId: string) => void;
  onTimerPress?: (habitId: string) => void;
  onToggleComplete?: (habitId: string) => void;
  onHabitLongPress?: (habitId: string) => void;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
}

export const AnimatedHabitsList: React.FC<AnimatedHabitsListProps> = ({
  data,
  refreshing = false,
  onRefresh,
  onHabitPress,
  onTimerPress,
  onToggleComplete,
  onHabitLongPress,
  ListHeaderComponent,
  ListEmptyComponent,
}) => {
  const scrollY = useSharedValue(0);
  const flatListRef = useRef<FlatList>(null);
  const contentOffset = useSharedValue(0);

  // Custom refresh control animation
  const refreshScale = useSharedValue(1);
  const refreshOpacity = useSharedValue(1);

  useEffect(() => {
    if (refreshing) {
      refreshScale.value = withSpring(1.1, theme.animation.spring.gentle);
      refreshOpacity.value = withTiming(0.7, { duration: theme.animation.duration.normal });
    } else {
      refreshScale.value = withSpring(1, theme.animation.spring.gentle);
      refreshOpacity.value = withTiming(1, { duration: theme.animation.duration.normal });
    }
  }, [refreshing]);

  // Animated scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      contentOffset.value = event.contentOffset.y;
    },
  });

  // Header animation based on scroll
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [0, -20],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollY.value,
      [0, 50, 100],
      [1, 0.8, 0.6],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  // Refresh control animated style
  const refreshAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: refreshScale.value }],
      opacity: refreshOpacity.value,
    };
  });

  // Render habit item with animation
  const renderHabit: ListRenderItem<HabitWithStats> = ({ item, index }) => {
    return (
      <AnimatedHabitCard
        habit={item}
        index={index}
        onPress={() => onHabitPress?.(item.id)}
        onTimerPress={() => onTimerPress?.(item.id)}
        onToggleComplete={() => onToggleComplete?.(item.id)}
        onLongPress={() => onHabitLongPress?.(item.id)}
      />
    );
  };

  // Custom refresh control
  const renderRefreshControl = () => (
    <Animated.View style={refreshAnimatedStyle}>
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={theme.colors.primary}
        colors={[theme.colors.primary, theme.colors.accent]}
        progressBackgroundColor={theme.colors.surface}
      />
    </Animated.View>
  );

  // Enhanced header with animation
  const AnimatedHeader = () => {
    if (!ListHeaderComponent) return null;

    return (
      <Animated.View style={headerAnimatedStyle}>
        {typeof ListHeaderComponent === 'function' ? (
          <ListHeaderComponent />
        ) : (
          ListHeaderComponent
        )}
      </Animated.View>
    );
  };

  // Empty state with animation
  const AnimatedEmptyComponent = () => {
    if (!ListEmptyComponent) return null;

    const emptyOpacity = useSharedValue(0);
    const emptyScale = useSharedValue(0.8);

    useEffect(() => {
      emptyOpacity.value = withTiming(1, { duration: theme.animation.duration.slow });
      emptyScale.value = withSpring(1, theme.animation.spring.gentle);
    }, []);

    const emptyAnimatedStyle = useAnimatedStyle(() => ({
      opacity: emptyOpacity.value,
      transform: [{ scale: emptyScale.value }],
    }));

    return (
      <Animated.View style={[styles.emptyContainer, emptyAnimatedStyle]}>
        {typeof ListEmptyComponent === 'function' ? (
          <ListEmptyComponent />
        ) : (
          ListEmptyComponent
        )}
      </Animated.View>
    );
  };

  // Item separator with subtle animation
  const ItemSeparator = () => (
    <View style={styles.separator} />
  );

  // Optimized getItemLayout for better performance
  const getItemLayout = (_: any, index: number) => ({
    length: 156, // Card height + margins
    offset: 156 * index,
    index,
  });

  return (
    <View style={styles.container}>
      <AnimatedFlatList
        ref={flatListRef}
        data={data}
        renderItem={renderHabit}
        keyExtractor={(item) => item.id}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={AnimatedHeader}
        ListEmptyComponent={AnimatedEmptyComponent}
        ItemSeparatorComponent={ItemSeparator}
        refreshControl={renderRefreshControl()}
        getItemLayout={getItemLayout}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={8}
        windowSize={10}
        style={styles.flatList}
        contentContainerStyle={[
          styles.contentContainer,
          data.length === 0 && styles.emptyContentContainer
        ]}
        // Performance optimizations
        bounces={true}
        bouncesZoom={false}
        alwaysBounceVertical={true}
        decelerationRate="normal"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flatList: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: theme.spacing.xxxl + theme.spacing.lg, // Extra space for FAB
  },
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  separator: {
    height: theme.spacing.xs,
  },
});