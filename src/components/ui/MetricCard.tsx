import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/index';
import { NeumorphCard } from '../neumorphism';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress?: () => void;
  variant?: 'default' | 'compact' | 'large';
  loading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  onPress,
  variant = 'default',
  loading = false,
}) => {
  const cardStyles = [
    styles.card,
    variant === 'compact' && styles.compactCard,
    variant === 'large' && styles.largeCard,
  ];

  const valueStyles = [
    styles.value,
    variant === 'compact' && styles.compactValue,
    variant === 'large' && styles.largeValue,
  ];

  const content = (
    <NeumorphCard variant="convex" style={cardStyles}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>...</Text>
        </View>
      ) : (
        <>
          <Text style={valueStyles}>{value}</Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          {icon && (
            <Ionicons 
              name={icon} 
              size={variant === 'large' ? 24 : 20} 
              color={iconColor || theme.colors.primary} 
              style={styles.icon}
            />
          )}
        </>
      )}
    </NeumorphCard>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    minHeight: 120,
    justifyContent: 'center',
  },
  compactCard: {
    paddingVertical: theme.spacing.md,
    minHeight: 80,
  },
  largeCard: {
    paddingVertical: theme.spacing.xl,
    minHeight: 140,
  },
  value: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  compactValue: {
    fontSize: theme.fontSize.xl,
  },
  largeValue: {
    fontSize: theme.fontSize.xxxl || theme.fontSize.xxl,
  },
  title: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  icon: {
    marginTop: theme.spacing.xs,
  },
  loadingContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
  },
});