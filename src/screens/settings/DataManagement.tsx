import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../theme';
import { NeumorphCard, NeumorphButton } from '../../components/neumorphism';
import { dataService } from '../../services/core';
import { dataExportService } from '../../services/core';
import { HabitWithStats } from '../../types';

interface StorageInfo {
  totalSize: number;
  habitsCount: number;
  logsCount: number;
  lastBackup?: string;
}

export const DataManagement: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    totalSize: 0,
    habitsCount: 0,
    logsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    isConfigured: boolean;
    isAuthenticated: boolean;
    lastSync?: string;
  }>({
    isConfigured: false,
    isAuthenticated: false,
  });

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    try {
      await dataService.initialize();
      const habits = await dataService.getHabits();
      const logs = await dataService.getAllHabitLogs();
      
      // Calculate approximate storage size
      const habitsSize = JSON.stringify(habits).length;
      const logsSize = JSON.stringify(logs).length;
      const totalSize = (habitsSize + logsSize) / 1024; // Convert to KB

      // Get last backup date
      const lastBackup = await AsyncStorage.getItem('lastBackupDate');

      // Check backend sync status
      const lastSyncTime = await AsyncStorage.getItem('lastSyncTime');
      setSyncStatus({
        isConfigured: true, // Backend is always configured
        isAuthenticated: true, // authService.isAuthenticated(),
        lastSync: lastSyncTime || undefined,
      });

      setStorageInfo({
        totalSize,
        habitsCount: habits.length,
        logsCount: logs.length,
        lastBackup: lastBackup || undefined,
      });
    } catch (error) {
      console.error('Error loading storage info:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    Alert.alert(
      'Export Format',
      'Choose how you want to export your data:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete Backup (JSON)',
          onPress: () => performExport('json')
        },
        {
          text: 'Spreadsheet (CSV)',
          onPress: () => performExport('csv')
        }
      ]
    );
  };

  const performExport = async (format: 'json' | 'csv') => {
    try {
      setExporting(true);
      
      let result;
      if (format === 'json') {
        result = await dataExportService.exportAllData();
      } else {
        // Let user choose between habits and progress CSV
        Alert.alert(
          'CSV Export Type',
          'What would you like to export?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setExporting(false) },
            {
              text: 'Habits Summary',
              onPress: async () => {
                const result = await dataExportService.exportAsCSV();
                handleExportResult(result);
              }
            },
            {
              text: 'Progress Details',
              onPress: async () => {
                const result = await dataExportService.exportProgressAsCSV();
                handleExportResult(result);
              }
            }
          ]
        );
        return; // Exit early to let user choose CSV type
      }
      
      handleExportResult(result);
      
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Export Error', 'Failed to export data. Please try again.');
      setExporting(false);
    }
  };

  const handleExportResult = async (result: { success: boolean; filePath?: string; error?: string }) => {
    try {
      if (result.success && result.filePath) {
        Alert.alert(
          'Export Successful',
          'Your data has been exported successfully. Would you like to share it?',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Share',
              onPress: () => dataExportService.shareFile(result.filePath!)
            }
          ]
        );
        
        // Update last backup date
        await AsyncStorage.setItem('lastBackupDate', new Date().toISOString());
        await loadStorageInfo(); // Refresh storage info
      } else {
        Alert.alert('Export Failed', result.error || 'Unknown error occurred');
      }
    } finally {
      setExporting(false);
    }
  };

  const handleImportData = async () => {
    Alert.alert(
      'Import Data',
      'This will import habits and progress from a backup file. Existing data will not be overwritten, but duplicates may be created.\n\nContinue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: performImport
        }
      ]
    );
  };

  const performImport = async () => {
    try {
      setImporting(true);
      const result = await dataExportService.importFromFile();
      
      if (result.success) {
        Alert.alert(
          'Import Successful',
          result.message,
          [
            {
              text: 'OK',
              onPress: () => {
                loadStorageInfo(); // Refresh the info
              }
            }
          ]
        );
      } else {
        const errorMessage = result.errors.length > 0 
          ? result.errors.join('\n')
          : result.message;
        Alert.alert('Import Failed', errorMessage);
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Import Failed', 'An unexpected error occurred during import');
    } finally {
      setImporting(false);
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your habits and progress data. This action cannot be undone.\n\nAre you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Warning',
              'This is your last chance to cancel. All data will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Everything',
                  style: 'destructive',
                  onPress: performClearAllData,
                },
              ]
            );
          },
        },
      ]
    );
  };

  const performClearAllData = async () => {
    try {
      await dataService.clearAllData();
      await AsyncStorage.multiRemove([
        'lastBackupDate',
        'notificationSettings',
        'userPreferences',
      ]);
      
      Alert.alert(
        'Data Cleared',
        'All data has been successfully deleted.',
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );
    } catch (error) {
      console.error('Error clearing data:', error);
      Alert.alert('Error', 'Failed to clear all data. Please try again.');
    }
  };

  const optimizeStorage = () => {
    Alert.alert(
      'Optimize Storage',
      'This will clean up orphaned data and optimize your local storage. This process is usually safe, but we recommend creating a backup first.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Optimize',
          style: 'default',
          onPress: performOptimizeStorage,
        },
      ]
    );
  };

  const performOptimizeStorage = async () => {
    try {
      // Perform storage optimization (remove orphaned logs, compress data, etc.)
      await dataService.optimizeStorage();
      await loadStorageInfo();
      Alert.alert('Success', 'Storage has been optimized.');
    } catch (error) {
      console.error('Error optimizing storage:', error);
      Alert.alert('Error', 'Failed to optimize storage. Please try again.');
    }
  };

  const syncToSupabase = async () => {
    if (!syncStatus.isConfigured) {
      Alert.alert(
        'Supabase Not Configured',
        'Supabase cloud sync is not configured. Please check your environment variables and add the correct anon key.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!syncStatus.isAuthenticated) {
      Alert.alert(
        'Not Authenticated',
        'You need to be logged in to sync with Supabase. Please log in and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setSyncing(true);
      const result = await dataService.forcSync();
      
      if (result.success) {
        await AsyncStorage.setItem('lastSyncTime', new Date().toISOString());
        await loadStorageInfo(); // Refresh status
        
        Alert.alert(
          'Sync Successful',
          `Successfully synced ${result.synced} items to Supabase.${result.failed > 0 ? ` ${result.failed} items failed to sync.` : ''}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Sync Failed', 
          `Sync failed: ${result.errors.join(', ')}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert('Sync Error', 'Failed to sync with Supabase. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const formatFileSize = (sizeInKB: number): string => {
    if (sizeInKB < 1) return '< 1 KB';
    if (sizeInKB < 1024) return `${Math.round(sizeInKB)} KB`;
    return `${(sizeInKB / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const DataItem: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: string;
    color?: string;
  }> = ({ title, value, subtitle, icon, color = theme.colors.primary }) => (
    <View style={styles.dataItem}>
      <View style={[styles.dataItemIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.dataItemContent}>
        <Text style={styles.dataItemTitle}>{title}</Text>
        <Text style={styles.dataItemValue}>{value}</Text>
        {subtitle && <Text style={styles.dataItemSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading storage info...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <NeumorphCard
          variant="light"
          colorType="whiteGlass"
          style={styles.header}
          animated={true}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Data Management</Text>
          </View>
        </NeumorphCard>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Storage Overview */}
          <NeumorphCard
            variant="medium"
            colorType="primaryGlass"
            style={styles.overviewCard}
            animated={true}
          >
            <Text style={styles.sectionTitle}>Storage Overview</Text>
            <View style={styles.dataGrid}>
              <DataItem
                title="Total Size"
                value={formatFileSize(storageInfo.totalSize)}
                subtitle="Local storage used"
                icon="folder-outline"
                color={theme.colors.primary}
              />
              <DataItem
                title="Habits"
                value={storageInfo.habitsCount}
                subtitle="Active habits"
                icon="checkmark-circle-outline"
                color={theme.colors.success}
              />
              <DataItem
                title="Log Entries"
                value={storageInfo.logsCount}
                subtitle="Progress records"
                icon="calendar-outline"
                color={theme.colors.warning}
              />
              {storageInfo.lastBackup && (
                <DataItem
                  title="Last Backup"
                  value={formatDate(storageInfo.lastBackup)}
                  subtitle="Most recent export"
                  icon="cloud-upload-outline"
                  color={theme.colors.secondary}
                />
              )}
            </View>
          </NeumorphCard>

          {/* Export & Backup */}
          <NeumorphCard
            variant="medium"
            colorType="whiteGlass"
            style={styles.sectionCard}
            animated={true}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="cloud-download-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Export & Backup</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Create a backup of all your habits and progress data. This file can be used to restore your data or transfer to another device.
            </Text>
            <NeumorphButton
              title={exporting ? "Exporting..." : "Export Data"}
              variant="primary"
              size="large"
              onPress={exportData}
              disabled={exporting}
                style={styles.actionButton}
            />
          </NeumorphCard>

          {/* Storage Optimization */}
          <NeumorphCard
            variant="medium"
            colorType="whiteGlass"
            style={styles.sectionCard}
            animated={true}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="refresh-outline" size={24} color={theme.colors.secondary} />
              <Text style={styles.sectionTitle}>Storage Optimization</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Optimize your local storage by cleaning up unnecessary files and compressing data.
            </Text>
            <NeumorphButton
              title="Optimize Storage"
              variant="secondary"
              size="large"
              onPress={optimizeStorage}
              style={styles.actionButton}
            />
          </NeumorphCard>

          {/* Data Import */}
          <NeumorphCard
            variant="medium"
            colorType="whiteGlass"
            style={styles.sectionCard}
            animated={true}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="cloud-upload-outline" size={24} color={theme.colors.warning} />
              <Text style={styles.sectionTitle}>Import Data</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Restore your habits and progress from a backup file. This will merge with your existing data.
            </Text>
            <NeumorphButton
              title={importing ? "Importing..." : "Import Data"}
              variant="secondary"
              size="large"
              onPress={handleImportData}
              disabled={importing || exporting}
              style={styles.actionButton}
            />
          </NeumorphCard>

          {/* Danger Zone */}
          <NeumorphCard
            variant="medium"
            colorType="errorGlass"
            style={styles.dangerCard}
            animated={true}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="warning-outline" size={24} color={theme.colors.error} />
              <Text style={[styles.sectionTitle, { color: theme.colors.error }]}>Danger Zone</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Permanently delete all your data. This action cannot be undone.
            </Text>
            <NeumorphButton
              title="Clear All Data"
              variant="secondary"
              size="large"
              onPress={clearAllData}
                style={styles.actionButton}
            />
          </NeumorphCard>

          {/* Data Usage Tips */}
          <NeumorphCard
            variant="light"
            colorType="successGlass"
            style={styles.tipsCard}
            animated={true}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb-outline" size={24} color={theme.colors.success} />
              <Text style={styles.sectionTitle}>Data Management Tips</Text>
            </View>
            <View style={styles.tipsList}>
              <Text style={styles.tipItem}>
                💾 Regular backups help protect your progress
              </Text>
              <Text style={styles.tipItem}>
                🔄 Optimize storage monthly for best performance
              </Text>
              <Text style={styles.tipItem}>
                📱 Export data before changing devices
              </Text>
              <Text style={styles.tipItem}>
                🗂️ Keep backup files in a safe location
              </Text>
            </View>
          </NeumorphCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  overviewCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  sectionCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  dangerCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  tipsCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  sectionDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  dataGrid: {
    gap: theme.spacing.md,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  dataItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  dataItemContent: {
    flex: 1,
  },
  dataItemTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  dataItemValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  dataItemSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  actionButton: {
    marginTop: theme.spacing.md,
  },
  tipsList: {
    gap: theme.spacing.sm,
  },
  tipItem: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 22,
  },
});