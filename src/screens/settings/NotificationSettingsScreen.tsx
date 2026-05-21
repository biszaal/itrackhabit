// Thin wrapper that delegates to the new redesigned NotificationSettings screen.
import React from 'react';
import { RootStackScreenProps } from '../../types/navigation';
import { NotificationSettings } from './NotificationSettings';

type NotificationSettingsScreenProps = RootStackScreenProps<'NotificationSettingsNew'>;

export const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({ navigation }) => (
  <NotificationSettings navigation={navigation} />
);

export default NotificationSettingsScreen;
