import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useFocusEffect } from '@react-navigation/native';
import { MainTabScreenProps } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { dataService } from '../../services/core';
import { Screen, AppHeader, Card, Button, Stat, useTabBarHeight } from '../../components/ds';

// Read from app.json rather than a hardcoded string that drifts out of date.
const appVersion = Constants.expoConfig?.version ?? '1.0.0';

type ProfileScreenProps = MainTabScreenProps<'Profile'>;

interface SettingRow {
  emoji: string;
  label: string;
  detail?: string;
  isNew?: boolean;
  onPress?: () => void;
}

interface SettingGroup {
  title: string;
  rows: SettingRow[];
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const t = useTheme();
  const tabBarHeight = useTabBarHeight();
  const { user, logout, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<{ habits: number; streak: number; rate: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dataService.getUserData();
      const habits = data.habits ?? [];
      const bestStreak = habits.reduce((m: number, h: any) => Math.max(m, h.longestStreak ?? 0), 0);
      const rates = habits.map((h: any) => h.completionRate ?? 0);
      const avg = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
      setStats({ habits: habits.length, streak: bestStreak, rate: Math.round(avg) });
    } catch {
      setStats({ habits: 0, streak: 0, rate: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const userName = user?.name ?? 'You';
  const userInitial = (userName[0] ?? 'Y').toUpperCase();

  const groups: SettingGroup[] = [
    {
      title: 'Practice',
      rows: [
        { emoji: '🎯', label: 'Habits & templates', onPress: () => navigation.navigate('HabitTemplates') },
      ],
    },
    {
      title: 'Insights',
      rows: [
        { emoji: '📊', label: 'Analytics', onPress: () => navigation.navigate('Analytics') },
        { emoji: '✨', label: 'AI insights', onPress: () => navigation.navigate('AIInsights') },
        { emoji: '🏆', label: 'Achievements', onPress: () => navigation.navigate('Achievements') },
      ],
    },
    {
      title: 'Notifications',
      rows: [
        { emoji: '🔔', label: 'Reminders', onPress: () => navigation.navigate('NotificationSettingsNew') },
        { emoji: '🌅', label: 'Smart notifications', onPress: () => navigation.navigate('HabitNotificationSettings') },
      ],
    },
    {
      title: 'Privacy & data',
      rows: [
        { emoji: '🛡️', label: 'Privacy & security', onPress: () => navigation.navigate('PrivacySecurity') },
        { emoji: '💾', label: 'Export & backup', onPress: () => navigation.navigate('DataManagement') },
      ],
    },
    {
      title: 'Support',
      rows: [
        { emoji: '📱', label: 'About iTrackHabit', detail: appVersion },
        // Debug-only: creates and deletes mock users, never ship this to users.
        ...(__DEV__
          ? [{ emoji: '🛠', label: 'Developer tools', onPress: () => navigation.navigate('DeveloperTools') }]
          : []),
      ],
    },
  ];

  const themeButton = (label: string, icon: React.ReactNode, mode: 'light' | 'dark' | 'system', active: boolean) => (
    <Pressable
      onPress={() => t.setMode(mode)}
      accessibilityRole="button"
      accessibilityLabel={`${label} theme`}
      accessibilityState={{ selected: active }}
      style={{
        flex: 1,
        height: 44,
        borderRadius: 12,
        backgroundColor: active ? t.colors.bgPaper : 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      {icon}
      <Text style={{ color: active ? t.colors.ink : t.colors.ink2, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );

  return (
    <Screen>
      <AppHeader
        title=""
        large={false}
        // No header action: this screen *is* the settings surface, and the
        // gear icon that used to sit here had no handler attached.
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: tabBarHeight + 24 }}>
        {/* Hero card */}
        <Card variant="elevated" padding={22} style={{ alignItems: 'center', gap: 12 }}>
          <View style={{ position: 'relative' }}>
            <View
              style={{
                width: 84,
                height: 84,
                borderRadius: 42,
                backgroundColor: t.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 30, fontWeight: '700' }}>{userInitial}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: t.colors.ink, fontSize: 20, fontWeight: '700', letterSpacing: -0.2 }}>
              {userName}
            </Text>
            <Text style={{ color: t.colors.ink3, fontSize: 13, marginTop: 2 }}>
              Your habits are stored privately on this device
            </Text>
          </View>
          {stats && (
            <View style={{ flexDirection: 'row', width: '100%', marginTop: 8 }}>
              <Stat label="Habits" value={stats.habits} />
              <View style={{ width: 1, backgroundColor: t.colors.lineSoft, marginHorizontal: 4 }} />
              <Stat label="Best streak" value={stats.streak} suffix="d" accent={t.colors.rose} />
              <View style={{ width: 1, backgroundColor: t.colors.lineSoft, marginHorizontal: 4 }} />
              <Stat label="Avg." value={stats.rate} suffix="%" accent={t.colors.success} />
            </View>
          )}
          <Button
            title="Export & backup"
            variant="secondary"
            style={{ marginTop: 8, width: '100%' }}
            onPress={() => navigation.navigate('DataManagement')}
          />
        </Card>

        {/* Settings groups */}
        {groups.map((g, gi) => (
          <View key={gi} style={{ marginTop: 22 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: t.colors.ink3,
                textTransform: 'uppercase',
                letterSpacing: 0.7,
                paddingLeft: 4,
                marginBottom: 10,
              }}
            >
              {g.title}
            </Text>
            <Card variant="elevated" padding={0} style={{ overflow: 'hidden' }}>
              {g.rows.map((row, ri) => (
                <Pressable
                  key={ri}
                  onPress={row.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={row.label}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderBottomWidth: ri < g.rows.length - 1 ? 1 : 0,
                    borderBottomColor: t.colors.lineSoft,
                    opacity: pressed ? 0.6 : 1,
                  })}
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
                    <Text style={{ fontSize: 16 }}>{row.emoji}</Text>
                  </View>
                  <Text style={{ flex: 1, color: t.colors.ink, fontSize: 15 }}>{row.label}</Text>
                  {row.isNew && (
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 999,
                        backgroundColor: t.isDark ? 'rgba(129,140,248,0.18)' : '#E8E6F8',
                      }}
                    >
                      <Text style={{ color: t.colors.primary, fontSize: 11, fontWeight: '700' }}>New</Text>
                    </View>
                  )}
                  {row.detail && !row.isNew && (
                    <Text style={{ color: t.colors.ink3, fontSize: 12, fontWeight: '600' }}>{row.detail}</Text>
                  )}
                  <Ionicons name="chevron-forward" size={14} color={t.colors.ink4} />
                </Pressable>
              ))}
            </Card>
          </View>
        ))}

        {/* Theme toggle */}
        <Card variant="elevated" padding={6} style={{ marginTop: 22, flexDirection: 'row' }}>
          {themeButton('Light', <Ionicons name="sunny-outline" size={16} color={t.mode === 'light' ? t.colors.ink : t.colors.ink2} />, 'light', t.mode === 'light')}
          {themeButton('System', <Ionicons name="phone-portrait-outline" size={14} color={t.mode === 'system' ? t.colors.ink : t.colors.ink2} />, 'system', t.mode === 'system')}
          {themeButton('Dark', <Ionicons name="moon-outline" size={16} color={t.mode === 'dark' ? t.colors.ink : t.colors.ink2} />, 'dark', t.mode === 'dark')}
        </Card>

        <Text style={{ textAlign: 'center', color: t.colors.ink4, fontSize: 11, marginTop: 18 }}>
          iTrackHabit · Made with care
        </Text>

        {loading && (
          <View style={{ paddingTop: 16, alignItems: 'center' }}>
            <ActivityIndicator color={t.colors.primary} />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};
