import React from 'react';
import { Modal, View, Text, StyleProp, ViewStyle, ModalProps } from 'react-native';
import { createNeumorphismStyle, NeumorphismColors } from '../../theme/neumorphism';
import { theme } from '../../theme';

interface NeumorphModalProps extends ModalProps {
  children: React.ReactNode;
  visible?: boolean;
  isVisible?: boolean;
  onClose?: () => void;
  title?: string;
  style?: StyleProp<ViewStyle>;
  glassIntensity?: 'subtle' | 'light' | 'medium' | 'strong'; // Glass compatibility - ignored
}

export const NeumorphModal: React.FC<NeumorphModalProps> = ({
  children,
  visible,
  isVisible = false,
  onClose,
  title,
  style,
  glassIntensity, // Ignored but accepted for compatibility
  ...props
}) => {
  const modalVisible = visible !== undefined ? visible : isVisible;
  const neumorphStyle = createNeumorphismStyle('convex', 'large', NeumorphismColors.surface);
  
  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="fade"
      onRequestClose={onClose}
      {...props}
    >
      <View style={{ 
        flex: 1, 
        backgroundColor: 'rgba(224, 229, 236, 0.8)', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 20 
      }}>
        <View style={[
          neumorphStyle,
          {
            padding: 24,
            maxWidth: '90%',
            maxHeight: '80%',
          },
          style
        ]}>
          {title && (
            <Text style={{
              fontSize: theme.fontSize.lg,
              fontWeight: theme.fontWeight.semibold,
              color: NeumorphismColors.text,
              marginBottom: theme.spacing.lg,
              textAlign: 'center'
            }}>
              {title}
            </Text>
          )}
          {children}
        </View>
      </View>
    </Modal>
  );
};