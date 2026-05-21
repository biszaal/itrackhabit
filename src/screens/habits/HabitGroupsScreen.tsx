import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackScreenProps } from '../../types/navigation';
import { socialService, HabitGroup } from '../../services/social';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Button, Field, OfflineNotice } from '../../components/ds';
import { LOCAL_ONLY } from '../../config/runtime';

type HabitGroupsScreenProps = RootStackScreenProps<'HabitGroups'>;

type Tab = 'discover' | 'popular' | 'joined';

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

const diffColor = (level: HabitGroup['difficulty'], theme: any): string => {
  switch (level) {
    case 'beginner':
      return theme.colors.success;
    case 'intermediate':
      return theme.colors.amber;
    case 'advanced':
      return theme.colors.rose;
    default:
      return theme.colors.ink3;
  }
};

export const HabitGroupsScreen: React.FC<HabitGroupsScreenProps> = ({ navigation }) => {
  const t = useTheme();
  const [tab, setTab] = useState<Tab>('discover');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [groups, setGroups] = useState<HabitGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (LOCAL_ONLY) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let data: HabitGroup[];
      switch (tab) {
        case 'popular':
          data = await socialService.getPopularGroups();
          break;
        case 'joined':
          data = (await socialService.getHabitGroups(category)).slice(0, 2);
          break;
        default:
          data = await socialService.getHabitGroups(category);
      }
      setGroups(data ?? []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [tab, category]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!search.trim()) {
      load();
      return;
    }
    (async () => {
      try {
        const res = await socialService.searchGroups(search);
        setGroups(res ?? []);
      } catch {}
    })();
  }, [search, load]);

  const handleJoin = async (id: string) => {
    try {
      await socialService.joinGroup(id);
      load();
    } catch {
      Alert.alert('Could not join', 'Try again in a moment.');
    }
  };

  return (
    <Screen>
      <AppHeader title="Habit groups" subtitle="Find your tribe." back onBack={() => navigation.goBack()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 100 }}
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
          <SegTab active={tab === 'discover'} label="Discover" onPress={() => setTab('discover')} />
          <SegTab active={tab === 'popular'} label="Popular" onPress={() => setTab('popular')} />
          <SegTab active={tab === 'joined'} label="Joined" onPress={() => setTab('joined')} />
        </View>

        <View style={{ marginTop: 14 }}>
          <Field
            placeholder="Search groups"
            value={search}
            onChangeText={setSearch}
            left={<Ionicons name="search" size={18} color={t.colors.ink3} />}
          />
        </View>

        {LOCAL_ONLY ? (
          <OfflineNotice message="Habit groups are community spaces that live in the cloud." />
        ) : loading ? (
          <View style={{ paddingTop: 40, alignItems: 'center' }}>
            <ActivityIndicator color={t.colors.primary} />
          </View>
        ) : groups.length === 0 ? (
          <Card variant="flat" padding={28} style={{ marginTop: 16, alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 40 }}>🌱</Text>
            <Text style={{ color: t.colors.ink, fontSize: 18, fontWeight: '700' }}>No groups yet</Text>
            <Text style={{ color: t.colors.ink2, fontSize: 13, textAlign: 'center', maxWidth: 280 }}>
              Try another category or check back later.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: 10, marginTop: 16 }}>
            {groups.map((g) => (
              <Pressable key={g.id} onPress={() => navigation.navigate('GroupDetails', { groupId: g.id })}>
                <Card variant="elevated" padding={14}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: t.colors.bgPaper,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>{(g as any).emoji ?? '👥'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: t.colors.ink, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
                        {g.name}
                      </Text>
                      {g.description && (
                        <Text style={{ color: t.colors.ink3, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
                          {g.description}
                        </Text>
                      )}
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                            backgroundColor: t.colors.bgPaper,
                          }}
                        >
                          <Text
                            style={{
                              color: diffColor(g.difficulty, t),
                              fontSize: 11,
                              fontWeight: '700',
                              textTransform: 'capitalize',
                            }}
                          >
                            {g.difficulty}
                          </Text>
                        </View>
                        {(g as any).memberCount !== undefined && (
                          <Text style={{ fontSize: 11, color: t.colors.ink3, fontWeight: '600', alignSelf: 'center' }}>
                            {(g as any).memberCount} members
                          </Text>
                        )}
                      </View>
                    </View>
                    {tab !== 'joined' && (
                      <Button title="Join" size="sm" onPress={() => handleJoin(g.id)} />
                    )}
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};
