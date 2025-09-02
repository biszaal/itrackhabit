import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Badge, UserBadge, BadgeProgress } from '../types';

interface BadgeComponentProps {
  badge: Badge;
  isEarned?: boolean;
  progress?: BadgeProgress;
  size?: 'small' | 'medium' | 'large';
}

export const BadgeComponent: React.FC<BadgeComponentProps> = ({
  badge,
  isEarned = false,
  progress,
  size = 'medium'
}) => {
  const getBadgeIcon = (iconName: string) => {
    // Map badge icon names to Ionicons
    const iconMap: { [key: string]: any } = {
      'footsteps': 'walk',
      'trophy': 'trophy',
      'calendar-check': 'calendar',
      'people': 'people',
      'medal': 'medal',
      'add-circle': 'add-circle',
      'checkmark-circle': 'checkmark-circle',
      'create': 'create',
      'heart': 'heart',
      'flame': 'flame'
    };
    
    return iconMap[iconName] || 'trophy';
  };

  const getSize = () => {
    switch (size) {
      case 'small':
        return { container: 40, icon: 20, text: theme.fontSize.xs };
      case 'large':
        return { container: 60, icon: 32, text: theme.fontSize.lg };
      default:
        return { container: 48, icon: 24, text: theme.fontSize.sm };
    }
  };

  const sizes = getSize();
  const progressPercentage = progress?.progressPercentage || (isEarned ? 100 : 0);

  return (
    <View style={styles.container}>
      <View style={[
        styles.badge,
        {
          width: sizes.container,
          height: sizes.container,
          backgroundColor: isEarned ? badge.color : theme.colors.backgroundSecondary,
        }
      ]}>
        <Ionicons
          name={getBadgeIcon(badge.icon)}
          size={sizes.icon}
          color={isEarned ? theme.colors.white : theme.colors.textSecondary}
        />
        
        {!isEarned && progress && (
          <View style={styles.progressOverlay}>
            <View 
              style={[
                styles.progressFill,
                {
                  height: `${progressPercentage}%`,
                  backgroundColor: `${badge.color}40`
                }
              ]}
            />
          </View>
        )}
      </View>
      
      <Text style={[styles.badgeName, { fontSize: sizes.text }]} numberOfLines={2}>
        {badge.name}
      </Text>
      
      {!isEarned && progress && progress.progressPercentage > 0 && (
        <Text style={styles.progressText}>
          {Math.round(progress.progressPercentage)}%
        </Text>
      )}
    </View>
  );
};

interface BadgeListProps {
  badges: UserBadge[];
  badgeProgress: BadgeProgress[];
  maxVisible?: number;
}

export const BadgeList: React.FC<BadgeListProps> = ({ 
  badges, 
  badgeProgress, 
  maxVisible = 5 
}) => {
  const earnedBadges = badges.slice(0, maxVisible);
  const inProgressBadges = badgeProgress
    .filter(bp => !bp.isEarned && bp.progressPercentage > 0)
    .sort((a, b) => b.progressPercentage - a.progressPercentage)
    .slice(0, maxVisible - earnedBadges.length);

  return (
    <View style={styles.badgeList}>
      <Text style={styles.sectionTitle}>Achievements</Text>
      <View style={styles.badgeRow}>
        {earnedBadges.map((userBadge) => (
          <BadgeComponent
            key={userBadge.id}
            badge={userBadge.badge!}
            isEarned={true}
            size="medium"
          />
        ))}
        
        {inProgressBadges.map((badgeProgress) => (
          <BadgeComponent
            key={badgeProgress.badgeId}
            badge={badgeProgress.badge}
            isEarned={false}
            progress={badgeProgress}
            size="medium"
          />
        ))}
        
        {earnedBadges.length === 0 && inProgressBadges.length === 0 && (
          <Text style={styles.emptyText}>Start completing habits to earn badges!</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
    marginVertical: theme.spacing.sm,
    maxWidth: 60,
  },
  badge: {
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  badgeName: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
    textAlign: 'center',
    lineHeight: 16,
  },
  progressText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  badgeList: {
    paddingVertical: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    flexWrap: 'wrap',
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});