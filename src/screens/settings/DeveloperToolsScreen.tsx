import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mockDataService } from '../../services/core';
import { RootStackScreenProps } from '../../types/navigation';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Button } from '../../components/ds';

type DeveloperToolsScreenProps = RootStackScreenProps<'DeveloperTools'>;

export const DeveloperToolsScreen: React.FC<DeveloperToolsScreenProps> = ({ navigation }) => {
  const t = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await mockDataService.getMockDataStats();
      setStats(s);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleCreate = () => {
    Alert.alert('Create mock data', '3 test users with 1–2 years of realistic habit data. For testing only.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Create',
        onPress: async () => {
          setLoading(true);
          try {
            await mockDataService.createMockData();
            await load();
            Alert.alert('Done', 'Mock data created.');
          } catch {
            Alert.alert('Failed', 'Could not create mock data.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleRemove = () => {
    Alert.alert('Remove mock data', 'Permanently delete all test users.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await mockDataService.removeMockData();
            await load();
            Alert.alert('Done', 'Mock data removed.');
          } catch {
            Alert.alert('Failed', 'Could not remove mock data.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <AppHeader title="Developer tools" subtitle="For testing only." back onBack={() => navigation.goBack()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.colors.ink3} />}
        contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 60 }}
      >
        <Card variant="elevated" padding={18}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: t.colors.bgPaper,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="bug-outline" size={18} color={t.colors.ink2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.colors.ink, fontSize: 15, fontWeight: '700' }}>Mock data</Text>
              <Text style={{ color: t.colors.ink3, fontSize: 12, marginTop: 2 }}>
                {stats?.totalUsers
                  ? `${stats.totalUsers} test users · ${stats.totalHabits ?? 0} habits`
                  : 'No mock data present'}
              </Text>
            </View>
          </View>
        </Card>

        <View style={{ marginTop: 14, gap: 10 }}>
          <Button title="Create mock data" loading={loading} onPress={handleCreate} fullWidth />
          <Button title="Remove mock data" variant="ghost" textStyle={{ color: t.colors.danger }} fullWidth onPress={handleRemove} />
        </View>

        <Text style={{ color: t.colors.ink4, fontSize: 11, marginTop: 22, textAlign: 'center' }}>
          These tools are visible only in development builds.
        </Text>
      </ScrollView>
    </Screen>
  );
};

export default DeveloperToolsScreen;
