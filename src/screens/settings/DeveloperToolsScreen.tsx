import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mockDataService, dataService } from '../../services/core';
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
      await dataService.initialize();
      const s = await mockDataService.getMockDataStats(dataService.getCurrentUserId());
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
    Alert.alert('Add demo data', 'Adds 6 habits with about four months of history to this device, for screenshots. Your existing habits are left alone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Add',
        onPress: async () => {
          setLoading(true);
          try {
            await dataService.initialize();
            await mockDataService.createMockData(dataService.getCurrentUserId());
            await load();
            Alert.alert('Done', 'Demo data added. Pull to refresh on the Habits tab.');
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
    Alert.alert('Remove demo data', 'Permanently deletes the six seeded habits and their history. Habits you created yourself are kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await dataService.initialize();
            await mockDataService.removeMockData(dataService.getCurrentUserId());
            await load();
            Alert.alert('Done', 'Demo data removed.');
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
              <Text style={{ color: t.colors.ink, fontSize: 15, fontWeight: '700' }}>Demo data</Text>
              <Text style={{ color: t.colors.ink3, fontSize: 12, marginTop: 2 }}>
                {stats
                  ? `${stats.habits} habit${stats.habits === 1 ? '' : 's'} · ${stats.progress} entries on this device`
                  : 'Reading…'}
              </Text>
            </View>
          </View>
        </Card>

        <View style={{ marginTop: 14, gap: 10 }}>
          <Button title="Add demo data" loading={loading} onPress={handleCreate} fullWidth />
          <Button title="Remove demo data" variant="ghost" textStyle={{ color: t.colors.danger }} fullWidth onPress={handleRemove} />
        </View>

        <Text style={{ color: t.colors.ink4, fontSize: 11, marginTop: 22, textAlign: 'center' }}>
          These tools are visible only in development builds.
        </Text>
      </ScrollView>
    </Screen>
  );
};

export default DeveloperToolsScreen;
