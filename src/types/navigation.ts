import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  CreateHabit: { habitId?: string; type?: 'health'; habitTemplate?: any; isCustom?: boolean };
  CreateEditHabit: { template?: any; habit?: any };
  HabitTemplates: undefined;
  EditHabit: { habitId: string };
  HabitDetails: { habitId: string };
  HabitTimer: { habitId: string };
  HabitConfig: { habitTemplate: any };
  HabitEdit: { habit: any };
  Settings: undefined;
  HabitNotificationSettings: undefined;
  Onboarding: undefined;
  HealthPermissions: { habitId?: string };
  CompoundProgress: undefined;
  HabitDesign: { habitId: string };
  AIInsights: undefined;
  NotificationSettingsNew: undefined;
  DataManagement: undefined;
  PrivacySecurity: undefined;
  DeveloperTools: undefined;
};

export type MainTabParamList = {
  Home: { selectedDate?: string };
  Calendar: undefined;
  Analytics: undefined;
  Achievements: undefined;
  Profile: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}