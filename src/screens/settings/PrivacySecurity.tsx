import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Button } from '../../components/ds';

interface PrivacySettings {
  biometricAuth: boolean;
  dataCollection: boolean;
  analyticsOptOut: boolean;
  shareUsageData: boolean;
  friendsCanSeeProgress: boolean;
  showInLeaderboards: boolean;
  allowNotifications: boolean;
  autoLockTimeout: number;
}

const DEFAULTS: PrivacySettings = {
  biometricAuth: false,
  dataCollection: true,
  analyticsOptOut: false,
  shareUsageData: false,
  friendsCanSeeProgress: true,
  showInLeaderboards: true,
  allowNotifications: true,
  autoLockTimeout: 15,
};

const Row: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail?: string;
  value?: boolean;
  onValueChange?: (v: boolean) => void;
  onPress?: () => void;
  destructive?: boolean;
  isLast?: boolean;
}> = ({ icon, title, detail, value, onValueChange, onPress, destructive, isLast }) => {
  const t = useTheme();
  const inner = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: t.colors.lineSoft,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: t.colors.bgPaper,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={16} color={destructive ? t.colors.danger : t.colors.ink2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: destructive ? t.colors.danger : t.colors.ink, fontSize: 14, fontWeight: '600' }}>
          {title}
        </Text>
        {detail && <Text style={{ color: t.colors.ink3, fontSize: 12, marginTop: 2 }}>{detail}</Text>}
      </View>
      {onValueChange ? (
        <Switch value={value} onValueChange={onValueChange} trackColor={{ true: t.colors.primary, false: t.colors.line }} />
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={14} color={t.colors.ink4} />
      ) : null}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
      {inner}
    </Pressable>
  ) : (
    inner
  );
};

export const PrivacySecurity: React.FC<{ navigation: any }> = ({ navigation }) => {
  const t = useTheme();
  const { logout } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULTS);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometric');

  const load = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('privacySettings');
      if (saved) setSettings({ ...DEFAULTS, ...JSON.parse(saved) });
    } catch {}
  }, []);

  useEffect(() => {
    load();
    (async () => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricSupported(compatible && enrolled);
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) setBiometricType('Face ID');
        else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) setBiometricType('Touch ID');
      } catch {}
    })();
  }, [load]);

  const update = (key: keyof PrivacySettings, value: any) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    AsyncStorage.setItem('privacySettings', JSON.stringify(next)).catch(() => {});
  };

  const toggleBio = async (v: boolean) => {
    if (v && biometricSupported) {
      try {
        const r = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Enable biometric authentication',
          fallbackLabel: 'Use passcode',
        });
        if (r.success) update('biometricAuth', true);
      } catch {}
    } else {
      update('biometricAuth', false);
    }
  };

  const handleClear = () => {
    Alert.alert('Clear account data', 'Removes local data from this device. Your account remains active.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.clear();
            await logout();
          } catch {
            Alert.alert('Could not clear', 'Try again.');
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete account',
      'Permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => Alert.alert('Contact support', 'Email us at support@itrackhabit.com to delete your account.'),
        },
      ]
    );
  };

  return (
    <Screen>
      <AppHeader title="Privacy & security" back onBack={() => navigation.goBack()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 60 }}
      >
        <SectionTitle>Security</SectionTitle>
        <Card variant="elevated" padding={0}>
          <Row
            icon="finger-print"
            title={biometricType}
            detail={biometricSupported ? 'Unlock the app with biometrics' : 'Not available on this device'}
            value={settings.biometricAuth}
            onValueChange={biometricSupported ? toggleBio : undefined}
            isLast
          />
        </Card>

        <SectionTitle>Sharing</SectionTitle>
        <Card variant="elevated" padding={0}>
          <Row
            icon="people-outline"
            title="Friends can see progress"
            detail="Shared habits show streaks and rates"
            value={settings.friendsCanSeeProgress}
            onValueChange={(v) => update('friendsCanSeeProgress', v)}
          />
          <Row
            icon="trophy-outline"
            title="Appear in leaderboards"
            value={settings.showInLeaderboards}
            onValueChange={(v) => update('showInLeaderboards', v)}
            isLast
          />
        </Card>

        <SectionTitle>Data</SectionTitle>
        <Card variant="elevated" padding={0}>
          <Row
            icon="analytics-outline"
            title="Analytics"
            detail="Help improve iTrackHabit"
            value={!settings.analyticsOptOut}
            onValueChange={(v) => update('analyticsOptOut', !v)}
          />
          <Row
            icon="bar-chart-outline"
            title="Anonymous usage"
            value={settings.shareUsageData}
            onValueChange={(v) => update('shareUsageData', v)}
            isLast
          />
        </Card>

        <SectionTitle>Account</SectionTitle>
        <Card variant="elevated" padding={0}>
          <Row icon="document-text-outline" title="Privacy policy" onPress={() => Alert.alert('Privacy', 'Open in browser.')} />
          <Row icon="reader-outline" title="Terms of service" onPress={() => Alert.alert('Terms', 'Open in browser.')} isLast />
        </Card>

        <View style={{ marginTop: 22, gap: 8 }}>
          <Button title="Clear account data" variant="ghost" textStyle={{ color: t.colors.danger }} fullWidth onPress={handleClear} />
          <Button title="Delete account" variant="ghost" textStyle={{ color: t.colors.danger }} fullWidth onPress={handleDelete} />
        </View>
      </ScrollView>
    </Screen>
  );
};

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = useTheme();
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '700',
        color: t.colors.ink3,
        textTransform: 'uppercase',
        letterSpacing: 0.7,
        paddingLeft: 4,
        marginTop: 22,
        marginBottom: 10,
      }}
    >
      {children}
    </Text>
  );
};
