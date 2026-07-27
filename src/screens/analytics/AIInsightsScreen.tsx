import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackScreenProps } from '../../types/navigation';
import {
  aiInsightsService,
  HabitInsight,
  HabitRecommendation,
  PersonalizedCoaching,
  HabitCorrelation,
} from '../../services/analytics';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Button } from '../../components/ds';

type AIInsightsScreenProps = RootStackScreenProps<'AIInsights'>;

type Tab = 'insights' | 'recs' | 'coaching' | 'corr';

const SegTab: React.FC<{ active: boolean; label: string; onPress: () => void }> = ({ active, label, onPress }) => {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={{
        flex: 1,
        height: 36,
        borderRadius: 10,
        backgroundColor: active ? t.colors.bgElev : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: '600', color: active ? t.colors.ink : t.colors.ink2 }}>{label}</Text>
    </Pressable>
  );
};

export const AIInsightsScreen: React.FC<AIInsightsScreenProps> = ({ navigation }) => {
  const t = useTheme();
  const [tab, setTab] = useState<Tab>('insights');
  const [insights, setInsights] = useState<HabitInsight[]>([]);
  const [recs, setRecs] = useState<HabitRecommendation[]>([]);
  const [coaching, setCoaching] = useState<PersonalizedCoaching[]>([]);
  const [corr, setCorr] = useState<HabitCorrelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await aiInsightsService.initialize();
      const [r, i, c, co] = await Promise.all([
        aiInsightsService.getRecommendations(),
        aiInsightsService.getInsights(),
        aiInsightsService.getCoachingMessages(),
        aiInsightsService.analyzeHabitCorrelations(),
      ]);
      setRecs(r ?? []);
      setInsights(i ?? []);
      setCoaching(c ?? []);
      setCorr(co ?? []);
    } catch (e) {
      Alert.alert('Could not load', 'Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await aiInsightsService.refreshInsights();
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Screen>
      <AppHeader
        title="AI insights"
        subtitle="Patterns from your last 30 days."
        back
        onBack={() => navigation.goBack()}
        action={
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 999,
              backgroundColor: t.colors.primary,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>Premium</Text>
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.colors.ink3} />}
        contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 60 }}
      >
        <View
          style={{
            flexDirection: 'row',
            padding: 4,
            gap: 4,
            backgroundColor: t.colors.bgPaper,
            borderRadius: 14,
          }}
        >
          <SegTab active={tab === 'insights'} label="Insights" onPress={() => setTab('insights')} />
          <SegTab active={tab === 'recs'} label="Suggest" onPress={() => setTab('recs')} />
          <SegTab active={tab === 'coaching'} label="Coach" onPress={() => setTab('coaching')} />
          <SegTab active={tab === 'corr'} label="Links" onPress={() => setTab('corr')} />
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={t.colors.primary} />
          </View>
        ) : (
          <View style={{ marginTop: 16, gap: 10 }}>
            {tab === 'insights' &&
              (insights.length === 0 ? (
                <EmptyState emoji="✨" title="No insights yet" message="Complete more habits to generate personalized patterns." />
              ) : (
                insights.map((it, i) => (
                  <Card key={i} variant="elevated" padding={16} style={{ position: 'relative', overflow: 'hidden' }}>
                    <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, backgroundColor: t.colors.primary }} />
                    <View style={{ flexDirection: 'row', gap: 12, paddingLeft: 6 }}>
                      <Text style={{ fontSize: 24 }}>{(it as any).emoji ?? '✨'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: t.colors.ink, fontSize: 14, fontWeight: '600' }}>{(it as any).title}</Text>
                        <Text style={{ color: t.colors.ink2, fontSize: 13, marginTop: 2, lineHeight: 18 }}>
                          {(it as any).description ?? (it as any).body}
                        </Text>
                      </View>
                    </View>
                  </Card>
                ))
              ))}

            {tab === 'recs' &&
              (recs.length === 0 ? (
                <EmptyState emoji="💡" title="No recommendations" message="Add a few habits to get suggestions." />
              ) : (
                recs.map((r, i) => (
                  <Card key={i} variant="elevated" padding={16}>
                    <Text style={{ color: t.colors.ink, fontSize: 15, fontWeight: '700' }}>{(r as any).title}</Text>
                    <Text style={{ color: t.colors.ink2, fontSize: 13, marginTop: 4 }}>{(r as any).description}</Text>
                    <Button
                      title="Add habit"
                      size="sm"
                      style={{ marginTop: 12, alignSelf: 'flex-start' }}
                      onPress={() =>
                        navigation.navigate('CreateEditHabit', {
                          template: {
                            title: (r as any).title,
                            color: t.colors.primary,
                            frequency: 'daily',
                          },
                        })
                      }
                    />
                  </Card>
                ))
              ))}

            {tab === 'coaching' &&
              (coaching.length === 0 ? (
                <EmptyState emoji="🎓" title="Coach is quiet" message="Keep tracking — your coach will share tips soon." />
              ) : (
                coaching.map((c, i) => (
                  <Card key={i} variant="elevated" padding={16}>
                    <Text style={{ color: t.colors.ink, fontSize: 14, fontWeight: '600' }}>
                      {(c as any).title}
                    </Text>
                    <Text style={{ color: t.colors.ink2, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
                      {(c as any).message ?? (c as any).body}
                    </Text>
                  </Card>
                ))
              ))}

            {tab === 'corr' &&
              (corr.length === 0 ? (
                <EmptyState emoji="🔗" title="No correlations" message="Pairs of habits will show up here when patterns emerge." />
              ) : (
                corr.map((c, i) => (
                  <Card key={i} variant="elevated" padding={16}>
                    <Text style={{ color: t.colors.ink, fontSize: 14 }}>
                      <Text style={{ fontWeight: '700' }}>{(c as any).habitA ?? (c as any).habit1}</Text>{' '}
                      <Text style={{ color: t.colors.ink3 }}>+</Text>{' '}
                      <Text style={{ fontWeight: '700' }}>{(c as any).habitB ?? (c as any).habit2}</Text>
                    </Text>
                    <Text style={{ color: t.colors.ink2, fontSize: 13, marginTop: 4 }}>
                      {(c as any).explanation ?? `Strength: ${Math.round(((c as any).strength ?? 0) * 100)}%`}
                    </Text>
                  </Card>
                ))
              ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};

const EmptyState: React.FC<{ emoji: string; title: string; message: string }> = ({ emoji, title, message }) => {
  const t = useTheme();
  return (
    <Card variant="flat" padding={28} style={{ alignItems: 'center', gap: 8 }}>
      <Text style={{ fontSize: 40 }}>{emoji}</Text>
      <Text style={{ color: t.colors.ink, fontSize: 18, fontWeight: '700' }}>{title}</Text>
      <Text style={{ color: t.colors.ink2, fontSize: 13, textAlign: 'center', maxWidth: 280 }}>{message}</Text>
    </Card>
  );
};
