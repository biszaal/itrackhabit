import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { MainTabScreenProps } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { dataService } from '../../services/core';
import { Screen, AppHeader, Card, Button, Stat } from '../../components/ds';

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
  const { user, logout, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<{ habits: number; streak: number; rate: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
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
  }, [isAuthenticated]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Sign out of your iTrackHabit account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch {}
        },
      },
    ]);
  };

  const isPremium = user?.subscriptionStatus === 'premium' || user?.subscriptionStatus === 'trial';
  const userName = user?.name ?? 'You';
  const userInitial = (userName[0] ?? 'Y').toUpperCase();

  const groups: SettingGroup[] = [
    {
      title: 'Practice',
      rows: [
        { emoji: '🎯', label: 'Habits & templates', onPress: () => navigation.navigate('HabitTemplates') },
        { emoji: '🧠', label: 'Four Laws designer', onPress: () => navigation.navigate('HabitGroups') },
        { emoji: '👤', label: 'Mentors', isNew: true, onPress: () => navigation.navigate('Mentors') },
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
        { emoji: '📱', label: 'About iTrackHabit', detail: '2.0.0' },
        { emoji: '🛠', label: 'Developer tools', onPress: () => navigation.navigate('DeveloperTools') },
      ],
    },
  ];

  const themeButton = (label: string, icon: React.ReactNode, mode: 'light' | 'dark' | 'system', active: boolean) => (
    <Pressable
      onPress={() => t.setMode(mode)}
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
        action={
          <Pressable
            hitSlop={8}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: t.colors.bgPaper,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="settings-outline" size={18} color={t.colors.ink2} />
          </Pressable>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 140 }}>
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
            {isPremium && (
              <View
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: t.colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: t.colors.bgElev,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>✦</Text>
              </View>
            )}
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: t.colors.ink, fontSize: 20, fontWeight: '700', letterSpacing: -0.2 }}>
              {isAuthenticated ? userName : 'Welcome'}
            </Text>
            <Text style={{ color: t.colors.ink3, fontSize: 13, marginTop: 2 }}>
              {isAuthenticated ? `${user?.email ?? ''} · ${isPremium ? 'Premium' : 'Free'}` : 'Sign in to sync across devices'}
            </Text>
          </View>
          {isAuthenticated && stats && (
            <View style={{ flexDirection: 'row', width: '100%', marginTop: 8 }}>
              <Stat label="Habits" value={stats.habits} />
              <View style={{ width: 1, backgroundColor: t.colors.lineSoft, marginHorizontal: 4 }} />
              <Stat label="Best streak" value={stats.streak} suffix="d" accent={t.colors.rose} />
              <View style={{ width: 1, backgroundColor: t.colors.lineSoft, marginHorizontal: 4 }} />
              <Stat label="Avg." value={stats.rate} suffix="%" accent={t.colors.success} />
            </View>
          )}
          {!isAuthenticated && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, width: '100%' }}>
              <Button title="Sign in" style={{ flex: 1 }} onPress={() => navigation.navigate('Login')} />
              <Button title="Create account" variant="secondary" style={{ flex: 1 }} onPress={() => navigation.navigate('Register')} />
            </View>
          )}
        </Card>

        {/* Premium banner */}
        {isAuthenticated && (
          isPremium ? (
            <Card
              variant="elevated"
              padding={16}
              style={{
                marginTop: 14,
                backgroundColor: t.colors.primary,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 26 }}>✦</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Premium</Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>Thank you for supporting iTrackHabit</Text>
              </View>
              <Pressable
                onPress={() => navigation.navigate('Premium')}
                style={{
                  height: 32,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>Manage</Text>
              </Pressable>
            </Card>
          ) : (
            <Pressable onPress={() => navigation.navigate('Premium')} style={{ marginTop: 14 }}>
              <Card
                variant="elevated"
                padding={16}
                style={{
                  backgroundColor: t.colors.primary,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Text style={{ fontSize: 26 }}>✦</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Try Premium free</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>AI insights, unlimited habits, more.</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
              </Card>
            </Pressable>
          )
        )}

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

        {isAuthenticated && (
          <Button title="Sign out" variant="ghost" style={{ marginTop: 22 }} fullWidth textStyle={{ color: t.colors.danger }} onPress={handleSignOut} />
        )}

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
