import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { socialService, ActivityFeedItem, ShareableContent } from '../../services/social';
import { RootStackScreenProps } from '../../types/navigation';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Button, OfflineNotice } from '../../components/ds';
import { LOCAL_ONLY } from '../../config/runtime';

type SocialFeedScreenProps = RootStackScreenProps<'SocialFeed'>;

type Tab = 'all' | 'friends';

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

const initials = (name: string) =>
  String(name || '?')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const colorFor = (id: string, palette: string[]): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 100000;
  return palette[hash % palette.length];
};

const iconFor = (type: ActivityFeedItem['type']): any => {
  switch (type) {
    case 'habit_completed':
      return 'checkmark-circle';
    case 'streak_milestone':
      return 'flame';
    case 'achievement_earned':
      return 'trophy';
    case 'group_joined':
      return 'people';
    case 'challenge_won':
      return 'medal';
    default:
      return 'star';
  }
};

const messageFor = (it: ActivityFeedItem): string => {
  switch (it.type) {
    case 'habit_completed':
      return `completed "${(it as any).habitTitle}"`;
    case 'streak_milestone':
      return `reached a ${(it as any).streakCount}-day streak`;
    case 'achievement_earned':
      return `earned "${(it as any).achievementTitle}"`;
    case 'group_joined':
      return `joined "${(it as any).groupName}"`;
    case 'challenge_won':
      return `won a habit challenge`;
    default:
      return 'made progress';
  }
};

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

export const SocialFeedScreen: React.FC<SocialFeedScreenProps> = ({ navigation }) => {
  const t = useTheme();
  const [tab, setTab] = useState<Tab>('all');
  const [feed, setFeed] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (LOCAL_ONLY) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const items = tab === 'friends' ? await socialService.getFriendsActivity() : await socialService.getActivityFeed();
      setFeed(items ?? []);
    } catch {
      setFeed([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleShare = async (type: ShareableContent['type']) => {
    try {
      const content = await socialService.generateShareableContent(type);
      const text = await socialService.shareToSocial(content, 'twitter');
      await Share.share({ message: text, title: content.title });
    } catch {
      Alert.alert('Could not share', 'Try again.');
    }
  };

  return (
    <Screen>
      <AppHeader
        title="Activity"
        subtitle="Recent wins from your circle."
        back
        onBack={() => navigation.goBack()}
        action={
          <Pressable
            onPress={() => navigation.navigate('HabitGroups')}
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
            <Ionicons name="people" size={18} color={t.colors.ink2} />
          </Pressable>
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
          <SegTab active={tab === 'all'} label="All" onPress={() => setTab('all')} />
          <SegTab active={tab === 'friends'} label="Friends" onPress={() => setTab('friends')} />
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          <Button title="Share streak" variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => handleShare('streak')} />
          <Button title="Share win" variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => handleShare('achievement')} />
          <Button title="Share progress" variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => handleShare('progress')} />
        </View>

        {LOCAL_ONLY ? (
          <OfflineNotice message="The social feed reads activity from the cloud. Solo tracking still works." />
        ) : loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={t.colors.primary} />
          </View>
        ) : feed.length === 0 ? (
          <Card variant="flat" padding={28} style={{ marginTop: 16, alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 40 }}>✨</Text>
            <Text style={{ color: t.colors.ink, fontSize: 18, fontWeight: '700' }}>Nothing here yet</Text>
            <Text style={{ color: t.colors.ink2, fontSize: 13, textAlign: 'center', maxWidth: 280 }}>
              Friend activity and milestones will show up here.
            </Text>
          </Card>
        ) : (
          <View style={{ marginTop: 16, gap: 10 }}>
            {feed.map((it) => {
              const accent =
                it.type === 'habit_completed'
                  ? t.colors.success
                  : it.type === 'streak_milestone'
                  ? t.colors.rose
                  : it.type === 'achievement_earned'
                  ? t.colors.amber
                  : it.type === 'group_joined'
                  ? t.colors.habits.sky
                  : t.colors.primary;
              const name = (it as any).userName ?? 'Someone';
              const c = colorFor((it as any).userId ?? name, t.habitColors);
              return (
                <Card key={(it as any).id} variant="elevated" padding={14}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: c,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>{initials(name)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: t.colors.ink, fontSize: 14 }}>
                        <Text style={{ fontWeight: '700' }}>{name}</Text> {messageFor(it)}
                      </Text>
                      {(it as any).createdAt && (
                        <Text style={{ color: t.colors.ink3, fontSize: 12, marginTop: 2 }}>
                          {new Date((it as any).createdAt).toLocaleString()}
                        </Text>
                      )}
                    </View>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        backgroundColor: tint(accent, 0.14, t.colors.bgPaper),
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={iconFor(it.type)} size={16} color={accent} />
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};
