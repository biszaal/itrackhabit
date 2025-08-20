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
  EditHabit: { habitId: string };
  HabitDetails: { habitId: string };
  HabitTimer: { habitId: string };
  HabitConfig: { habitTemplate: any };
  ChallengeDetails: { challengeId: string };
  CreateChallenge: { habitId?: string };
  FriendProfile: { userId: string };
  Settings: undefined;
  Premium: undefined;
  HealthPermissions: { habitId?: string };
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