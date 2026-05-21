import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { achievementService, UserAchievement, AchievementProgress } from '../../services/premium';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Ring } from '../../components/ds';

const tint = (hex: string, ratio: number, bg: string): string => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const bh = bg.replace('#', '');
  const br = parseInt(bh.slice(0, 2), 16);
  const bg2 = parseInt(bh.slice(2, 4), 16);
  const bb = parseInt(bh.slice(4, 6), 16);
  const mr = Math.round(r * ratio + br * (1 - ratio));
  const mg = Math.round(g * ratio + bg2 * (1 - ratio));
  const mb = Math.round(b * ratio + bb * (1 - ratio));
  return `#${mr.toString(16).padStart(2, '0')}${mg.toString(16).padStart(2, '0')}${mb.toString(16).padStart(2, '0')}`;
};

type Filter = 'all' | 'earned' | 'progress';

const SegTab: React.FC<{ active: boolean; label: string; onPress: () => void }> = ({ active, label, onPress }) => {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        height: 36,
        borderRadius: 10,
        backgroundColor: active ? t.colors.bgElev : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '600', color: active ? t.colors.ink : t.colors.ink2 }}>{label}</Text>
    </Pressable>
  );
};

const AchievementsScreen: React.FC = () => {
  const t = useTheme();
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState<Filter>('all');
  const [progress, setProgress] = useState<AchievementProgress[]>([]);
  const [earned, setEarned] = useState<UserAchievement[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await achievementService.initialize();
      const newOnes = await achievementService.checkForNewAchievements();
      if (newOnes?.length) {
        const a = newOnes[0]?.achievement;
        if (a) {
          Alert.alert('🎉 Achievement unlocked', `${a.title}\n${a.description}`, [
            { text: 'Awesome!', onPress: () => achievementService.markAchievementsSeen() },
          ]);
        }
      }
      const [p, ua, s] = await Promise.all([
        achievementService.getAchievementProgress(),
        Promise.resolve(achievementService.getUserAchievements()),
        Promise.resolve(achievementService.getAchievementStats()),
      ]);
      setProgress(p ?? []);
      setEarned(ua ?? []);
      setStats(s);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  const filtered =
    filter === 'earned'
      ? progress.filter((a) => a.isEarned)
      : filter === 'progress'
      ? progress.filter((a) => !a.isEarned)
      : progress;

  const earnedCount = earned.length;
  const totalCount = progress.length || earnedCount;
  const ratio = totalCount > 0 ? earnedCount / totalCount : 0;

  return (
    <Screen>
      <AppHeader
        title="Achievements"
        subtitle={stats ? `${earnedCount} earned · ${Math.max(0, totalCount - earnedCount)} in progress` : ''}
        back
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.colors.ink3} />}
        contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 60 }}
      >
        {/* Hero level card */}
        <Card variant="elevated" padding={18} style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Ring size={86} stroke={8} pct={ratio}>
            <Text style={{ color: t.colors.ink, fontSize: 22, fontWeight: '700', letterSpacing: -0.4 }}>
              {earnedCount}
              <Text style={{ fontSize: 10, color: t.colors.ink3 }}>/{totalCount || 0}</Text>
            </Text>
          </Ring>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.colors.ink, fontSize: 17, fontWeight: '600', letterSpacing: -0.2 }}>
              Level {stats?.level ?? Math.max(1, Math.floor(ratio * 10))} · Apprentice
            </Text>
            <Text style={{ color: t.colors.ink2, fontSize: 13, marginTop: 2 }}>
              {Math.max(0, totalCount - earnedCount)} badges to your next level.
            </Text>
          </View>
        </Card>

        {/* Filter */}
        <View
          style={{
            flexDirection: 'row',
            padding: 4,
            gap: 4,
            backgroundColor: t.colors.bgPaper,
            borderRadius: 14,
            marginTop: 18,
          }}
        >
          <SegTab active={filter === 'all'} label="All" onPress={() => setFilter('all')} />
          <SegTab active={filter === 'earned'} label="Earned" onPress={() => setFilter('earned')} />
          <SegTab active={filter === 'progress'} label="In progress" onPress={() => setFilter('progress')} />
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={t.colors.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <Card variant="flat" padding={28} style={{ marginTop: 16, alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 40 }}>🏆</Text>
            <Text style={{ color: t.colors.ink, fontSize: 18, fontWeight: '700' }}>Nothing here yet</Text>
            <Text style={{ color: t.colors.ink2, fontSize: 13, textAlign: 'center', maxWidth: 280 }}>
              Keep showing up and badges will appear.
            </Text>
          </Card>
        ) : (
          <View style={{ marginTop: 16, gap: 10 }}>
            {/* Earned grid */}
            {filter !== 'progress' &&
              progress.filter((a) => a.isEarned).length > 0 && (
                <>
                  <Text
                    style={{
                      color: t.colors.ink3,
                      fontSize: 11,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: 0.7,
                      marginTop: 4,
                    }}
                  >
                    Earned
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }}>
                    {progress
                      .filter((a) => a.isEarned)
                      .map((a) => {
                        const c = (a as any).color ?? t.colors.primary;
                        return (
                          <View key={a.achievementId} style={{ width: '48%' }}>
                            <Card variant="elevated" padding={14} style={{ alignItems: 'center' }}>
                              <View
                                style={[
                                  {
                                    width: 56,
                                    height: 56,
                                    borderRadius: 18,
                                    backgroundColor: c,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  },
                                  {
                                    shadowColor: c,
                                    shadowOffset: { width: 0, height: 8 },
                                    shadowOpacity: 0.35,
                                    shadowRadius: 20,
                                    elevation: 6,
                                  },
                                ]}
                              >
                                <Text style={{ fontSize: 28 }}>{(a as any).emoji ?? '🏆'}</Text>
                              </View>
                              <Text style={{ color: t.colors.ink, fontSize: 14, fontWeight: '600', marginTop: 10, textAlign: 'center' }} numberOfLines={1}>
                                {(a as any).title}
                              </Text>
                              <Text style={{ color: t.colors.ink3, fontSize: 12, marginTop: 2, textAlign: 'center' }} numberOfLines={2}>
                                {(a as any).description}
                              </Text>
                            </Card>
                          </View>
                        );
                      })}
                  </View>
                </>
              )}

            {/* In progress list */}
            {filter !== 'earned' &&
              progress.filter((a) => !a.isEarned).length > 0 && (
                <>
                  <Text
                    style={{
                      color: t.colors.ink3,
                      fontSize: 11,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: 0.7,
                      marginTop: 16,
                    }}
                  >
                    In progress
                  </Text>
                  {progress
                    .filter((a) => !a.isEarned)
                    .map((a) => {
                      const c = (a as any).color ?? t.colors.primary;
                      const cur = (a as any).currentValue ?? 0;
                      const tot = (a as any).targetValue ?? 1;
                      const pct = Math.min(1, tot ? cur / tot : 0);
                      return (
                        <Card
                          key={a.achievementId}
                          variant="elevated"
                          padding={14}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                        >
                          <View
                            style={{
                              width: 46,
                              height: 46,
                              borderRadius: 14,
                              backgroundColor: tint(c, 0.14, t.colors.bgPaper),
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 22 }}>{(a as any).emoji ?? '🎯'}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                              <Text style={{ color: t.colors.ink, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                                {(a as any).title}
                              </Text>
                              <Text style={{ color: t.colors.ink3, fontSize: 12 }}>
                                {cur}/{tot}
                              </Text>
                            </View>
                            <Text style={{ color: t.colors.ink3, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
                              {(a as any).description}
                            </Text>
                            <View
                              style={{
                                height: 4,
                                borderRadius: 999,
                                backgroundColor: t.colors.lineSoft,
                                marginTop: 6,
                                overflow: 'hidden',
                              }}
                            >
                              <View style={{ height: '100%', width: `${pct * 100}%`, backgroundColor: c }} />
                            </View>
                          </View>
                        </Card>
                      );
                    })}
                </>
              )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};

export default AchievementsScreen;
