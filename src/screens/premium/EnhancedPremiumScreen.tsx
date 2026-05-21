// Same redesign visual as PremiumScreen. Kept as a separate exported component
// because it's referenced from the feature-gating service / upgrade prompts.
import React from 'react';
import { PremiumScreen } from './PremiumScreen';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Premium'>;
}

export const EnhancedPremiumScreen: React.FC<Props> = (props) => <PremiumScreen {...props} />;
