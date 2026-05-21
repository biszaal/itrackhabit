import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dataService } from '../../services/core';
import { dataExportService } from '../../services/core';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Button } from '../../components/ds';

interface StorageInfo {
  totalSize: number;
  habitsCount: number;
  logsCount: number;
  lastBackup?: string;
}

export const DataManagement: React.FC<{ navigation: any }> = ({ navigation }) => {
  const t = useTheme();
  const [info, setInfo] = useState<StorageInfo>({ totalSize: 0, habitsCount: 0, logsCount: 0 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await dataService.initialize();
      const habits = await dataService.getHabits();
      const logs = await dataService.getAllHabitLogs();
      const size = (JSON.stringify(habits).length + JSON.stringify(logs).length) / 1024;
      const last = await AsyncStorage.getItem('lastBackupDate');
      setInfo({ totalSize: size, habitsCount: habits.length, logsCount: logs.length, lastBackup: last ?? undefined });
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleExport = () => {
    Alert.alert('Export', 'Choose a format:', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'JSON (full backup)', onPress: () => doExport('json') },
      { text: 'CSV (spreadsheet)', onPress: () => doExport('csv') },
    ]);
  };

  const doExport = async (fmt: 'json' | 'csv') => {
    setExporting(true);
    try {
      const result = fmt === 'json' ? await dataExportService.exportAllData() : await dataExportService.exportAsCSV();
      if ((result as any)?.success) {
        await AsyncStorage.setItem('lastBackupDate', new Date().toISOString());
        await load();
      } else {
        Alert.alert('Export failed', 'Try again.');
      }
    } catch {
      Alert.alert('Export failed', 'Try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleClear = () => {
    Alert.alert('Clear all data?', 'This deletes every habit, log, and setting. Cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete everything',
        style: 'destructive',
        onPress: async () => {
          try {
            await dataService.initialize();
            const habits = await dataService.getHabits();
            for (const h of habits) await dataService.deleteHabit(h.id);
            await AsyncStorage.clear();
            Alert.alert('Done', 'All data has been cleared.');
            await load();
          } catch {
            Alert.alert('Could not clear', 'Try again.');
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <AppHeader title="Data & backup" subtitle="Export, import, restore." back onBack={() => navigation.goBack()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 60, gap: 14 }}
      >
        {loading ? (
          <View style={{ paddingTop: 24, alignItems: 'center' }}>
            <ActivityIndicator color={t.colors.primary} />
          </View>
        ) : (
          <>
            {/* Stats */}
            <Card variant="elevated" padding={18}>
              <Text style={lblStyle(t)}>Storage</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <View>
                  <Text style={{ color: t.colors.ink, fontSize: 24, fontWeight: '700', letterSpacing: -0.5 }}>
                    {info.totalSize.toFixed(1)}
                    <Text style={{ fontSize: 13, color: t.colors.ink3, fontWeight: '500' }}> KB</Text>
                  </Text>
                  <Text style={{ color: t.colors.ink3, fontSize: 12, marginTop: 2 }}>Local size</Text>
                </View>
                <View>
                  <Text style={{ color: t.colors.ink, fontSize: 24, fontWeight: '700', letterSpacing: -0.5 }}>
                    {info.habitsCount}
                  </Text>
                  <Text style={{ color: t.colors.ink3, fontSize: 12, marginTop: 2 }}>Habits</Text>
                </View>
                <View>
                  <Text style={{ color: t.colors.ink, fontSize: 24, fontWeight: '700', letterSpacing: -0.5 }}>
                    {info.logsCount}
                  </Text>
                  <Text style={{ color: t.colors.ink3, fontSize: 12, marginTop: 2 }}>Logs</Text>
                </View>
              </View>
              {info.lastBackup && (
                <Text style={{ color: t.colors.ink3, fontSize: 12, marginTop: 12 }}>
                  Last backup · {new Date(info.lastBackup).toLocaleString()}
                </Text>
              )}
            </Card>

            <Button
              title="Export data"
              leftIcon={<Ionicons name="download-outline" size={18} color="#FFFFFF" />}
              loading={exporting}
              onPress={handleExport}
              fullWidth
            />

            <Card variant="elevated" padding={16}>
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
                  <Ionicons name="cloud-upload-outline" size={18} color={t.colors.ink2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.colors.ink, fontSize: 14, fontWeight: '600' }}>Backend sync</Text>
                  <Text style={{ color: t.colors.ink3, fontSize: 12 }}>Habits and progress sync when online.</Text>
                </View>
              </View>
            </Card>

            <Button
              title="Clear all data"
              variant="ghost"
              textStyle={{ color: t.colors.danger }}
              fullWidth
              onPress={handleClear}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
};

const lblStyle = (t: any) => ({
  fontSize: 11,
  fontWeight: '700' as const,
  color: t.colors.ink3,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.7,
});
