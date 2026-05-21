// Compatibility shim — preserves NeumorphModal API. Renders a clean centered
// modal using new tokens.
import React from 'react';
import { Modal, View, Text, StyleProp, ViewStyle, ModalProps } from 'react-native';
import { lightPalette, radius as r, shadow } from '../../theme/tokens';

interface NeumorphModalProps extends ModalProps {
  children: React.ReactNode;
  visible?: boolean;
  isVisible?: boolean;
  onClose?: () => void;
  title?: string;
  style?: StyleProp<ViewStyle>;
  glassIntensity?: string;
}

export const NeumorphModal: React.FC<NeumorphModalProps> = ({
  children,
  visible,
  isVisible = false,
  onClose,
  title,
  style,
  glassIntensity,
  ...props
}) => {
  const modalVisible = visible !== undefined ? visible : isVisible;

  return (
    <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={onClose} {...props}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(11,16,32,0.45)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <View
          style={[
            {
              backgroundColor: lightPalette.bgElev,
              borderRadius: r.card,
              padding: 24,
              width: '100%',
              maxWidth: 380,
            },
            shadow.sh3,
            style,
          ]}
        >
          {title && (
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: lightPalette.ink,
                marginBottom: 16,
                textAlign: 'center',
                letterSpacing: -0.3,
              }}
            >
              {title}
            </Text>
          )}
          {children}
        </View>
      </View>
    </Modal>
  );
};
