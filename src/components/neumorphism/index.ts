// Neumorphism Theme System
export { createNeumorphismStyle, NeumorphismColors, NeumorphismUtils, NeumorphismPresets, getRandomHabitColor, getHabitColorByName } from '../../theme/neumorphism';
export type { NeumorphismVariant, NeumorphismSize } from '../../theme/neumorphism';

// Neumorphism Components
export { NeumorphCard } from './NeumorphCard';
export { NeumorphButton } from './NeumorphButton';
export { NeumorphInput } from './NeumorphInput';
export { NeumorphModal } from './NeumorphModal';
export { NeumorphTabBar } from './NeumorphTabBar';
export { ColorPicker } from './ColorPicker';

// Aliases for backward compatibility with glass components
export { NeumorphCard as GlassCard } from './NeumorphCard';
export { NeumorphButton as GlassButton } from './NeumorphButton';
export { NeumorphInput as GlassInput } from './NeumorphInput';
export { NeumorphModal as GlassModal } from './NeumorphModal';

// Dummy components for navigation compatibility
import { View } from 'react-native';
export const GlassBackground = View;
export const GlassTabBar = View;
export const GlassHeader = View;