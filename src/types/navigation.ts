import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  CreateHabit: { habitId?: string; type?: 'health'; habitTemplate?: any; isCustom?: boolean };
  CreateEditHabit: { template?: any; habit?: any };
  HabitTemplates: undefined;
  EditHabit: { habitId: string };
  HabitDetails: { habitId: string };
  HabitTimer: { habitId: string };
  HabitConfig: { habitTemplate: any };
  HabitEdit: { habit: any };
  ChallengeDetails: { challengeId: string };
  CreateChallenge: { habitId?: string };
  FriendProfile: { userId: string };
  Settings: undefined;
  HabitNotificationSettings: undefined;
  Analytics: undefined;
  Achievements: undefined;
  Onboarding: undefined;
  Premium: undefined;
  HealthPermissions: { habitId?: string };
  CompoundProgress: undefined;
  HabitDesign: { habitId: string };
  ContactSelection: undefined;
  SocialFeed: undefined;
  HabitGroups: undefined;
  Mentors: undefined;
  GroupDetails: { groupId: string };
  MentorProfile: { mentorId: string };
  AIInsights: undefined;
  NotificationSettingsNew: undefined;
  DataManagement: undefined;
  PrivacySecurity: undefined;
  DeveloperTools: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Challenges: undefined;
  Friends: undefined;
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