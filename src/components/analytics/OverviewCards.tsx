import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/index';
import { MetricCard } from '../ui';

export interface OverviewCardData {
  value: number | string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress?: () => void;
}

interface OverviewCardsProps {
  cards: OverviewCardData[];
  variant?: 'default' | 'compact' | 'large';
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({ 
  cards, 
  variant = 'default' 
}) => {
  return (
    <View style={styles.overviewGrid}>
      {cards.map((card, index) => (
        <View key={index} style={styles.cardContainer}>
          <MetricCard
            title={card.label}
            value={card.value}
            icon={card.icon}
            iconColor={card.color}
            onPress={card.onPress}
            variant={variant}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  cardContainer: {
    width: '48%',
    marginBottom: theme.spacing.md,
  },
});