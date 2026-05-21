import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { FriendWithDetails, FriendRequest, User } from '../../types';
import { MainTabScreenProps } from '../../types/navigation';
import { friendService } from '../../services/social';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Button, Field, OfflineNotice } from '../../components/ds';
import { LOCAL_ONLY } from '../../config/runtime';

type FriendsScreenProps = MainTabScreenProps<'Friends'>;

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

const initials = (name: string): string =>
  String(name || '?')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const avatarColorFor = (id: string, palette: string[]): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 100000;
  return palette[hash % palette.length];
};

type Tab = 'feed' | 'friends' | 'requests';

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
      <Text style={{ fontSize: 13, fontWeight: '600', color: active ? t.colors.ink : t.colors.ink2 }}>
        {label}
      </Text>
    </Pressable>
  );
};

export const FriendsScreen: React.FC<FriendsScreenProps> = ({ navigation }) => {
  const t = useTheme();
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>('feed');
  const [friends, setFriends] = useState<FriendWithDetails[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    if (LOCAL_ONLY || !isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [f, r] = await Promise.all([
        friendService.getFriends(),
        friendService.getPendingFriendRequests(),
      ]);
      setFriends(f ?? []);
      setRequests(r ?? []);
    } catch (e) {
      setFriends([]);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const runSearch = async (q: string) => {
    setSearch(q);
    if (q.length < 3) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await friendService.searchUsers(q);
      setSearchResults(results ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSend = async (userId: string) => {
    try {
      await friendService.sendFriendRequest(userId);
      Alert.alert('Sent', 'Friend request sent.');
    } catch {
      Alert.alert('Could not send', 'Please try again.');
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await friendService.acceptFriendRequest(id);
      load();
    } catch {}
  };

  const handleDecline = async (id: string) => {
    try {
      await friendService.declineFriendRequest(id);
      load();
    } catch {}
  };

  const handleInvite = () => {
    navigation.navigate('ContactSelection');
  };

  return (
    <Screen>
      <AppHeader
        title="Friends"
        subtitle="Your accountability circle."
        action={
          <Pressable
            onPress={handleInvite}
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
            <Ionicons name="person-add" size={18} color={t.colors.ink2} />
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
          <SegTab active={tab === 'feed'} label="Feed" onPress={() => setTab('feed')} />
          <SegTab active={tab === 'friends'} label={`Friends · ${friends.length}`} onPress={() => setTab('friends')} />
          <SegTab active={tab === 'requests'} label={`Requests · ${requests.length}`} onPress={() => setTab('requests')} />
        </View>

        {/* Invite banner */}
        <Card variant="flat" padding={14} style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: tint(t.colors.primary, 0.14, t.colors.bgPaper),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="people" size={18} color={t.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.colors.ink, fontSize: 13 }}>
              <Text style={{ fontWeight: '700' }}>Invite friends</Text> to build habits together.
            </Text>
          </View>
          <Button title="Invite" size="sm" onPress={handleInvite} />
        </Card>

        {LOCAL_ONLY ? (
          <OfflineNotice message="Friends and shared progress sync through the cloud. Solo tracking still works locally." />
        ) : loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator color={t.colors.primary} />
          </View>
        ) : tab === 'feed' ? (
          <View style={{ marginTop: 16, gap: 10 }}>
            {friends.length === 0 ? (
              <Card variant="flat" padding={24} style={{ alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 40 }}>🤝</Text>
                <Text style={{ color: t.colors.ink, fontSize: 18, fontWeight: '700' }}>No activity yet</Text>
                <Text style={{ color: t.colors.ink2, fontSize: 13, textAlign: 'center', maxWidth: 280 }}>
                  Add a friend or invite from your contacts to see their wins here.
                </Text>
              </Card>
            ) : (
              friends.slice(0, 4).map((f) => {
                const c = avatarColorFor(f.id, t.habitColors);
                const habit = f.sharedHabits?.[0];
                return (
                  <Card key={f.id} variant="elevated" padding={14}>
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
                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
                          {initials(f.friendName)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: t.colors.ink, fontSize: 14 }}>
                          <Text style={{ fontWeight: '700' }}>{f.friendName}</Text>
                          {habit ? (
                            <Text>
                              {' '}is on a <Text style={{ color: t.colors.rose, fontWeight: '700' }}>{habit.currentStreak}-day streak</Text> 🔥
                            </Text>
                          ) : (
                            <Text> joined your circle</Text>
                          )}
                        </Text>
                        {habit && (
                          <Text style={{ color: t.colors.ink3, fontSize: 13, marginTop: 2 }}>
                            {habit.title} · {Math.round(habit.completionRate ?? 0)}% completion
                          </Text>
                        )}
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        ) : tab === 'friends' ? (
          <View style={{ marginTop: 16, gap: 10 }}>
            <Field
              placeholder="Search by name or email"
              value={search}
              onChangeText={runSearch}
              left={<Ionicons name="search" size={18} color={t.colors.ink3} />}
              right={searching ? <ActivityIndicator color={t.colors.ink3} /> : undefined}
            />
            {searchResults.map((u) => (
              <Card key={u.id} variant="elevated" padding={12} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: avatarColorFor(u.id, t.habitColors),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>{initials(u.name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.colors.ink, fontSize: 14, fontWeight: '600' }}>{u.name}</Text>
                  <Text style={{ color: t.colors.ink3, fontSize: 12 }}>{u.email}</Text>
                </View>
                <Button title="Add" size="sm" onPress={() => handleSend(u.id)} />
              </Card>
            ))}
            {!search && friends.length === 0 && (
              <Card variant="flat" padding={24} style={{ alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 40 }}>🌱</Text>
                <Text style={{ color: t.colors.ink, fontSize: 18, fontWeight: '700' }}>No friends yet</Text>
                <Text style={{ color: t.colors.ink2, fontSize: 13, textAlign: 'center', maxWidth: 280 }}>
                  Search for someone by name or invite from contacts.
                </Text>
              </Card>
            )}
            {!search && friends.map((f) => {
              const c = avatarColorFor(f.id, t.habitColors);
              const habit = f.sharedHabits?.[0];
              return (
                <Pressable key={f.id} onPress={() => navigation.navigate('FriendProfile', { userId: f.friendUserId })}>
                  <Card variant="elevated" padding={12} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: c,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                        {initials(f.friendName)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: t.colors.ink, fontSize: 14, fontWeight: '600' }}>{f.friendName}</Text>
                      <Text style={{ color: t.colors.ink3, fontSize: 12, marginTop: 2 }}>
                        {habit ? `${habit.title} · ${habit.currentStreak} day streak` : f.friendEmail}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={t.colors.ink3} />
                  </Card>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={{ marginTop: 16, gap: 10 }}>
            {requests.length === 0 ? (
              <Card variant="flat" padding={24} style={{ alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 40 }}>📭</Text>
                <Text style={{ color: t.colors.ink, fontSize: 18, fontWeight: '700' }}>No pending requests</Text>
              </Card>
            ) : (
              requests.map((r) => {
                const c = avatarColorFor(r.id, t.habitColors);
                const u = r.user;
                return (
                  <Card key={r.id} variant="elevated" padding={12} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: c,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                        {initials(u?.name ?? '?')}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: t.colors.ink, fontSize: 14, fontWeight: '600' }}>{u?.name}</Text>
                      <Text style={{ color: t.colors.ink3, fontSize: 12 }}>{u?.email}</Text>
                    </View>
                    <Button title="Accept" size="sm" onPress={() => handleAccept(r.id)} />
                    <Button title="Decline" size="sm" variant="ghost" onPress={() => handleDecline(r.id)} />
                  </Card>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};
