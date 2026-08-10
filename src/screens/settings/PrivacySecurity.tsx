import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Switch, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card } from '../../components/ds';

/**
 * The app is offline-only (see config/runtime.ts): no accounts, no server, no
 * analytics. This screen must not offer switches for data sharing, analytics,
 * or leaderboards — none of them exist, and a toggle that does nothing is a
 * false privacy claim. Biometric lock is the only real setting here.
 */
interface PrivacySettings {
  biometricAuth: boolean;
}

const DEFAULTS: PrivacySettings = {
  biometricAuth: false,
};

const PRIVACY_POLICY_URL = 'https://www.biszaaltech.com/apps/itrackhabit/privacy';
const TERMS_URL = 'https://www.biszaaltech.com/terms';

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

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open link', url);
    }
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

        <SectionTitle>Your data</SectionTitle>
        <Card variant="elevated" padding={16}>
          <Text style={{ color: t.colors.ink2, fontSize: 13, lineHeight: 20 }}>
            iTrackHabit works entirely on this device. There is no account and no server, so your
            habits and progress are never uploaded, and nothing about how you use the app is
            collected, tracked, or shared. Uninstalling removes it all.
          </Text>
        </Card>
        {/*
          Erasing lives in Data & backup, which clears the SQLite habits as well
          as AsyncStorage. The button that used to sit here wiped only
          AsyncStorage while promising to delete everything.
        */}
        <Card variant="elevated" padding={0} style={{ marginTop: 10 }}>
          <Row
            icon="archive-outline"
            title="Export or erase data"
            detail="Back up to a file, or delete everything"
            onPress={() => navigation.navigate('DataManagement')}
            isLast
          />
        </Card>

        <SectionTitle>Legal</SectionTitle>
        <Card variant="elevated" padding={0}>
          <Row
            icon="document-text-outline"
            title="Privacy policy"
            onPress={() => openLink(PRIVACY_POLICY_URL)}
          />
          <Row
            icon="reader-outline"
            title="Terms of service"
            onPress={() => openLink(TERMS_URL)}
            isLast
          />
        </Card>
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
