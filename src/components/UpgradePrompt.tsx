import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NeumorphCard, NeumorphButton } from './neumorphism';
import { theme } from '../theme';
import { UpgradePrompt } from '../services/core/FeatureGatingService';

interface UpgradePromptModalProps {
  visible: boolean;
  prompt: UpgradePrompt;
  onUpgrade: () => void;
  onClose: () => void;
  onStartTrial?: () => void;
  showTrial?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const UpgradePromptModal: React.FC<UpgradePromptModalProps> = ({
  visible,
  prompt,
  onUpgrade,
  onClose,
  onStartTrial,
  showTrial = false,
}) => {
  const getPromptIcon = () => {
    switch (prompt.type) {
      case 'limit_reached': return 'lock-closed';
      case 'feature_locked': return 'star';
      case 'trial_ending': return 'time';
      case 'usage_heavy': return 'trending-up';
      default: return 'diamond';
    }
  };

  const getPromptColor = () => {
    switch (prompt.priority) {
      case 'high': return '#E74C3C';
      case 'medium': return '#F39C12';
      case 'low': return '#3498DB';
      default: return theme.colors.primary;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <NeumorphCard
            variant="strong"
            colorType="whiteGlass"
            style={styles.promptCard}
            animated
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: getPromptColor() }]}>
                <Ionicons name={getPromptIcon()} size={24} color="white" />
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.title}>{prompt.title}</Text>
              <Text style={styles.description}>{prompt.description}</Text>

              {/* Premium Features Highlight */}
              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>Premium includes:</Text>
                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
                    <Text style={styles.featureText}>Unlimited habits</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
                    <Text style={styles.featureText}>Advanced analytics</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
                    <Text style={styles.featureText}>Social features</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
                    <Text style={styles.featureText}>Cloud sync</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {showTrial && onStartTrial && (
                <NeumorphButton
                  title="Start 7-Day Free Trial"
                  variant="secondary"
                  size="large"
                  onPress={onStartTrial}
                  style={styles.trialButton}
                />
              )}
              
              <NeumorphButton
                title={prompt.ctaText}
                variant="primary"
                size="large"
                onPress={onUpgrade}
                style={styles.upgradeButton}
              />
              
              <TouchableOpacity onPress={onClose} style={styles.laterButton}>
                <Text style={styles.laterText}>Maybe later</Text>
              </TouchableOpacity>
            </View>
          </NeumorphCard>
        </View>
      </View>
    </Modal>
  );
};

// Inline upgrade prompt for feature screens
interface InlineUpgradePromptProps {
  title: string;
  description: string;
  onUpgrade: () => void;
  style?: any;
}

export const InlineUpgradePrompt: React.FC<InlineUpgradePromptProps> = ({
  title,
  description,
  onUpgrade,
  style,
}) => {
  return (
    <NeumorphCard
      variant="medium"
      colorType="primaryGlass"
      style={[styles.inlinePrompt, style]}
      animated
    >
      <View style={styles.inlineContent}>
        <View style={styles.inlineIcon}>
          <Ionicons name="diamond" size={24} color={theme.colors.primary} />
        </View>
        
        <View style={styles.inlineText}>
          <Text style={styles.inlineTitle}>{title}</Text>
          <Text style={styles.inlineDescription}>{description}</Text>
        </View>
        
        <NeumorphButton
          title="Upgrade"
          variant="primary"
          size="small"
          onPress={onUpgrade}
          style={styles.inlineButton}
        />
      </View>
    </NeumorphCard>
  );
};

// Feature locked screen overlay
interface FeatureLockedOverlayProps {
  featureName: string;
  description: string;
  onUpgrade: () => void;
  onClose: () => void;
}

export const FeatureLockedOverlay: React.FC<FeatureLockedOverlayProps> = ({
  featureName,
  description,
  onUpgrade,
  onClose,
}) => {
  return (
    <View style={styles.lockedOverlay}>
      <NeumorphCard
        variant="strong"
        colorType="whiteGlass"
        style={styles.lockedCard}
        animated
      >
        <View style={styles.lockedIcon}>
          <Ionicons name="lock-closed" size={48} color="#999" />
        </View>
        
        <Text style={styles.lockedTitle}>{featureName}</Text>
        <Text style={styles.lockedDescription}>{description}</Text>
        
        <NeumorphButton
          title="Upgrade to Premium"
          variant="primary"
          size="large"
          onPress={onUpgrade}
          style={styles.lockedUpgradeButton}
        />
        
        <TouchableOpacity onPress={onClose} style={styles.lockedCloseButton}>
          <Text style={styles.lockedCloseText}>Not now</Text>
        </TouchableOpacity>
      </NeumorphCard>
    </View>
  );
};

const styles = StyleSheet.create({
  // Modal styles
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: screenWidth * 0.9,
    maxWidth: 400,
  },
  promptCard: {
    padding: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: '#333',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: theme.fontSize.md,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  featuresContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  featuresTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: '#333',
    marginBottom: theme.spacing.sm,
  },
  featuresList: {
    gap: theme.spacing.xs,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  featureText: {
    fontSize: theme.fontSize.sm,
    color: '#666',
  },
  actions: {
    gap: theme.spacing.md,
  },
  trialButton: {
    marginBottom: theme.spacing.sm,
  },
  upgradeButton: {},
  laterButton: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  laterText: {
    fontSize: theme.fontSize.sm,
    color: '#999',
  },

  // Inline prompt styles
  inlinePrompt: {
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  inlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  inlineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineText: {
    flex: 1,
  },
  inlineTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: '#333',
    marginBottom: theme.spacing.xs,
  },
  inlineDescription: {
    fontSize: theme.fontSize.sm,
    color: '#666',
  },
  inlineButton: {
    paddingHorizontal: theme.spacing.lg,
  },

  // Feature locked overlay styles
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  lockedCard: {
    width: screenWidth * 0.8,
    maxWidth: 300,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  lockedIcon: {
    marginBottom: theme.spacing.lg,
  },
  lockedTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: '#333',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  lockedDescription: {
    fontSize: theme.fontSize.sm,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },
  lockedUpgradeButton: {
    marginBottom: theme.spacing.md,
  },
  lockedCloseButton: {
    padding: theme.spacing.sm,
  },
  lockedCloseText: {
    fontSize: theme.fontSize.sm,
    color: '#999',
  },
});