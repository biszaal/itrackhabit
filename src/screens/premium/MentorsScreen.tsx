import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackScreenProps } from '../../types/navigation';
import { socialService, MentorProfile } from '../../services/social';
import { dataService } from '../../services/core';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Button, OfflineNotice } from '../../components/ds';
import { LOCAL_ONLY } from '../../config/runtime';

type MentorsScreenProps = RootStackScreenProps<'Mentors'>;

type Tab = 'all' | 'recommended' | 'connected';

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

const initials = (name: string) =>
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

export const MentorsScreen: React.FC<MentorsScreenProps> = ({ navigation }) => {
  const t = useTheme();
  const [tab, setTab] = useState<Tab>('all');
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (LOCAL_ONLY) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let data: MentorProfile[] = [];
      switch (tab) {
        case 'recommended': {
          const habits = await dataService.getHabits();
          const cats = [...new Set(habits.map((h: any) => h.type || 'general'))];
          data = await socialService.getRecommendedMentors(cats);
          break;
        }
        case 'connected':
          data = (await socialService.getMentors()).slice(0, 1);
          break;
        default:
          data = await socialService.getMentors();
      }
      setMentors(data ?? []);
    } catch {
      setMentors([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const handleRequest = (mentorId: string, name: string) => {
    Alert.alert('Request mentorship', `Send a request to ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Request',
        onPress: async () => {
          try {
            await socialService.requestMentorship(mentorId);
            load();
          } catch {
            Alert.alert('Could not request', 'Try again.');
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <AppHeader title="Mentors" subtitle="Learn from people on the path." back onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
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
          <SegTab active={tab === 'recommended'} label="For you" onPress={() => setTab('recommended')} />
          <SegTab active={tab === 'connected'} label="Yours" onPress={() => setTab('connected')} />
        </View>

        {LOCAL_ONLY ? (
          <OfflineNotice message="Mentors are people from the broader community and require the cloud." />
        ) : loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={t.colors.primary} />
          </View>
        ) : mentors.length === 0 ? (
          <Card variant="flat" padding={28} style={{ marginTop: 16, alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 40 }}>👤</Text>
            <Text style={{ color: t.colors.ink, fontSize: 18, fontWeight: '700' }}>No mentors yet</Text>
            <Text style={{ color: t.colors.ink2, fontSize: 13, textAlign: 'center', maxWidth: 280 }}>
              Mentors will appear here when they're available.
            </Text>
          </Card>
        ) : (
          <View style={{ marginTop: 16, gap: 10 }}>
            {mentors.map((m) => {
              const c = avatarColorFor(m.id, t.habitColors);
              const rating = (m as any).rating ?? 0;
              return (
                <Pressable key={m.id} onPress={() => navigation.navigate('MentorProfile', { mentorId: m.id })}>
                  <Card variant="elevated" padding={16}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 28,
                          backgroundColor: c,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>{initials(m.name)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: t.colors.ink, fontSize: 15, fontWeight: '700' }} numberOfLines={1}>
                          {m.name}
                        </Text>
                        {(m as any).title && (
                          <Text style={{ color: t.colors.ink3, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                            {(m as any).title}
                          </Text>
                        )}
                        {rating > 0 && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            <Ionicons name="star" size={12} color={t.colors.amber} />
                            <Text style={{ color: t.colors.ink2, fontSize: 12, fontWeight: '600' }}>
                              {Number(rating).toFixed(1)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {(m as any).bio && (
                      <Text style={{ color: t.colors.ink2, fontSize: 13, marginTop: 10, lineHeight: 18 }} numberOfLines={3}>
                        {(m as any).bio}
                      </Text>
                    )}
                    <Button title="Request mentorship" size="sm" style={{ marginTop: 12, alignSelf: 'flex-start' }} onPress={() => handleRequest(m.id, m.name)} />
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};
