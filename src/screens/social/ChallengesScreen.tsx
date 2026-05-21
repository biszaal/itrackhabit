import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ChallengeWithParticipants } from '../../types';
import { MainTabScreenProps } from '../../types/navigation';
import { challengeService } from '../../services/social';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Button, OfflineNotice } from '../../components/ds';
import { LOCAL_ONLY } from '../../config/runtime';

type ChallengesScreenProps = MainTabScreenProps<'Challenges'>;

type Tab = 'mine' | 'discover' | 'friends';

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

const DISCOVER_PRESETS = [
  { emoji: '🌅', name: 'Wake at 6am', meta: '7-day', count: '42 in', color: '#E0A864' },
  { emoji: '💧', name: 'Hydration', meta: '30-day', count: '118 in', color: '#6FA8C7' },
  { emoji: '🏋️', name: 'Strength 3x/wk', meta: 'Habit', count: '67 in', color: '#E07A77' },
  { emoji: '📵', name: 'Phone before bed', meta: '14-day', count: '28 in', color: '#9B7BC7' },
];

const SegTab: React.FC<{ active: boolean; label: string; count?: number; onPress: () => void }> = ({
  active,
  label,
  count,
  onPress,
}) => {
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
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: active ? t.colors.ink : t.colors.ink2,
        }}
      >
        {label}
        {count !== undefined ? ` · ${count}` : ''}
      </Text>
    </Pressable>
  );
};

export const ChallengesScreen: React.FC<ChallengesScreenProps> = ({ navigation }) => {
  const t = useTheme();
  const [tab, setTab] = useState<Tab>('mine');
  const [active, setActive] = useState<ChallengeWithParticipants[]>([]);
  const [available, setAvailable] = useState<ChallengeWithParticipants[]>([]);
  const [friends, setFriends] = useState<ChallengeWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (LOCAL_ONLY) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [mine, all, fr] = await Promise.all([
        challengeService.getUserChallenges(),
        challengeService.getChallenges(),
        challengeService.getFriendChallenges(),
      ]);
      setActive((mine ?? []) as unknown as ChallengeWithParticipants[]);
      setAvailable((all?.available ?? []) as unknown as ChallengeWithParticipants[]);
      setFriends((fr ?? []) as unknown as ChallengeWithParticipants[]);
    } catch (e) {
      console.warn('challenges load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleJoin = async (challengeId: string) => {
    try {
      await challengeService.joinChallenge(challengeId);
      load();
    } catch (e) {
      Alert.alert('Could not join', 'Try again in a moment.');
    }
  };

  const handleCreate = () => {
    navigation.navigate('CreateChallenge', {});
  };

  return (
    <Screen>
      <AppHeader
        title="Challenges"
        subtitle="Compete, encourage, grow together."
        action={
          <Pressable
            onPress={handleCreate}
            hitSlop={8}
            style={[
              {
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: t.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              },
              t.shadow.pill,
            ]}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
          </Pressable>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.colors.ink3} />}
        contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 140 }}
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
          <SegTab active={tab === 'mine'} label="Mine" count={active.length} onPress={() => setTab('mine')} />
          <SegTab active={tab === 'discover'} label="Discover" onPress={() => setTab('discover')} />
          <SegTab active={tab === 'friends'} label="Friends" onPress={() => setTab('friends')} />
        </View>

        {LOCAL_ONLY ? (
          <OfflineNotice message="Challenges sync between friends through the cloud. Your habits and streaks keep working locally." />
        ) : loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator color={t.colors.primary} />
          </View>
        ) : tab === 'mine' ? (
          <View style={{ marginTop: 16, gap: 12 }}>
            {active.length === 0 ? (
              <Card variant="flat" padding={24} style={{ alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 40 }}>🏁</Text>
                <Text style={{ color: t.colors.ink, fontSize: 18, fontWeight: '700', letterSpacing: -0.3 }}>
                  No active challenges
                </Text>
                <Text style={{ color: t.colors.ink2, fontSize: 13, textAlign: 'center', maxWidth: 260 }}>
                  Start one yourself or browse Discover for inspiration.
                </Text>
                <Button title="Create challenge" onPress={handleCreate} style={{ marginTop: 8 }} />
              </Card>
            ) : (
              active.map((c, i) => (
                <ChallengeCard
                  key={c.id}
                  challenge={c}
                  hero={i === 0}
                  onPress={() => navigation.navigate('ChallengeDetails', { challengeId: c.id })}
                />
              ))
            )}
          </View>
        ) : tab === 'discover' ? (
          <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }}>
              {(available.length > 0 ? available.slice(0, 6) : DISCOVER_PRESETS).map((preset: any, i: number) => {
                const color = preset.color ?? t.colors.primary;
                const emoji = preset.emoji ?? '🎯';
                const name = preset.name ?? preset.title;
                const meta = preset.meta ?? `${preset.durationDays ?? 7}-day`;
                const count = preset.count ?? `${preset.participantCount ?? 0} in`;
                const id = preset.id;
                return (
                  <Pressable
                    key={id ?? i}
                    onPress={() => id && navigation.navigate('ChallengeDetails', { challengeId: id })}
                    style={{ width: '48%' }}
                  >
                    <Card variant="flat" padding={14}>
                      <Text style={{ fontSize: 26, marginBottom: 8 }}>{emoji}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: t.colors.ink }} numberOfLines={1}>
                        {name}
                      </Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: t.colors.ink3 }}>{meta}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '600', color }}>{count}</Text>
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={{ marginTop: 16, gap: 10 }}>
            {friends.length === 0 ? (
              <Card variant="flat" padding={24} style={{ alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 40 }}>👥</Text>
                <Text style={{ color: t.colors.ink, fontSize: 18, fontWeight: '700' }}>No friend challenges yet</Text>
                <Text style={{ color: t.colors.ink2, fontSize: 13, textAlign: 'center', maxWidth: 280 }}>
                  Friends' active challenges will appear here.
                </Text>
              </Card>
            ) : (
              friends.map((c) => (
                <ChallengeCard
                  key={c.id}
                  challenge={c}
                  onPress={() => navigation.navigate('ChallengeDetails', { challengeId: c.id })}
                  actionLabel="Join"
                  onAction={() => handleJoin(c.id)}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};

interface ChallengeCardProps {
  challenge: ChallengeWithParticipants;
  hero?: boolean;
  onPress?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, hero, onPress, actionLabel, onAction }) => {
  const t = useTheme();
  const accent = (challenge as any).color ?? t.colors.rose;
  const ends = new Date(challenge.endDate);
  const daysLeft = Math.max(0, Math.ceil((ends.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const top = (challenge.leaderboard ?? []).slice(0, 4);

  return (
    <Pressable onPress={onPress}>
      <Card variant="elevated" padding={18} style={{ position: 'relative', overflow: 'hidden' }}>
        {hero && (
          <View
            style={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: tint(accent, 0.22, t.colors.bgElev),
              opacity: 0.6,
            }}
          />
        )}
        <View style={{ position: 'relative' }}>
          <View
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 10,
              height: 28,
              borderRadius: 10,
              backgroundColor: tint(accent, 0.14, t.colors.bgElev),
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Ionicons name="flame" size={14} color={accent} />
            <Text style={{ color: accent, fontSize: 12, fontWeight: '600' }}>
              {challenge.type === 'streak' ? 'Streak challenge' : challenge.type === 'completion' ? 'Completion' : 'Challenge'}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: t.colors.ink,
              marginTop: 8,
              letterSpacing: -0.4,
            }}
            numberOfLines={2}
          >
            {challenge.title}
          </Text>
          <Text style={{ color: t.colors.ink2, fontSize: 13, marginTop: 2 }}>
            {daysLeft > 0 ? `Ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}` : 'Ending today'}
            {` · ${challenge.participantCount ?? top.length} participants`}
          </Text>

          {hero && top.length > 0 && (
            <View style={{ marginTop: 12, gap: 8 }}>
              {top.map((entry: any, idx: number) => {
                const isYou = entry.isYou ?? false;
                const color = entry.color ?? t.colors.primary;
                return (
                  <View
                    key={entry.userId ?? idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      backgroundColor: isYou ? tint(accent, 0.08, t.colors.bgPaper) : t.colors.bgPaper,
                      borderWidth: isYou ? 1 : 0,
                      borderColor: tint(accent, 0.3, t.colors.bgPaper),
                    }}
                  >
                    <Text
                      style={{
                        width: 22,
                        fontSize: 13,
                        fontWeight: '700',
                        color: idx === 0 ? '#E0A864' : t.colors.ink3,
                      }}
                    >
                      {idx + 1}
                    </Text>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: color,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
                        {String(entry.userName || '?')
                          .split(' ')
                          .map((s: string) => s[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: isYou ? '600' : '500', color: t.colors.ink }} numberOfLines={1}>
                      {entry.userName}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: t.colors.ink }}>
                      {entry.score}
                    </Text>
                  </View>
                );
              })}
              <Button variant="secondary" size="sm" title="See full leaderboard" onPress={onPress} />
            </View>
          )}

          {actionLabel && onAction && (
            <Button title={actionLabel} size="sm" style={{ marginTop: 12, alignSelf: 'flex-start' }} onPress={onAction} />
          )}
        </View>
      </Card>
    </Pressable>
  );
};
