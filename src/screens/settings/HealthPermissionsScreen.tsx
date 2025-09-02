import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components';
import { healthService } from '../../services/health';
import { HealthIntegrationStatus, HealthDataType } from '../../types/health';
import { RootStackScreenProps } from '../../types/navigation';

type HealthPermissionsScreenProps = RootStackScreenProps<'HealthPermissions'>;

interface HealthPermissionItem {
  type: HealthDataType;
  title: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
}

const healthPermissions: HealthPermissionItem[] = [
  {
    type: HealthDataType.STEPS,
    title: 'Steps',
    description: 'Track daily step count for walking habits',
    icon: 'walk',
    color: '#4CAF50',
    enabled: false,
  },
  {
    type: HealthDataType.EXERCISE_TIME,
    title: 'Exercise Minutes',
    description: 'Monitor workout duration and active time',
    icon: 'fitness',
    color: '#FF5722',
    enabled: false,
  },
  {
    type: HealthDataType.CALORIES_BURNED,
    title: 'Calories Burned',
    description: 'Track active energy expenditure',
    icon: 'flame',
    color: '#FF9800',
    enabled: false,
  },
  {
    type: HealthDataType.SLEEP_ANALYSIS,
    title: 'Sleep Data',
    description: 'Monitor sleep duration and quality',
    icon: 'moon',
    color: '#3F51B5',
    enabled: false,
  },
  {
    type: HealthDataType.WORKOUT,
    title: 'Workouts',
    description: 'Access recorded workout sessions',
    icon: 'barbell',
    color: '#E91E63',
    enabled: false,
  },
  {
    type: HealthDataType.HEART_RATE,
    title: 'Heart Rate',
    description: 'Monitor heart rate during activities',
    icon: 'heart',
    color: '#F44336',
    enabled: false,
  },
];

export const HealthPermissionsScreen: React.FC<HealthPermissionsScreenProps> = ({ 
  navigation 
}) => {
  const [permissions, setPermissions] = useState<HealthPermissionItem[]>(healthPermissions);
  const [healthStatus, setHealthStatus] = useState<HealthIntegrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkHealthStatus();
  }, []);

  const checkHealthStatus = async () => {
    try {
      const status = await healthService.initialize();
      setHealthStatus(status);
      
      if (status.isAuthorized) {
        updatePermissionStatus(status);
      }
    } catch (error) {
      console.error('Health status check failed:', error);
      Alert.alert(
        'Health Integration Unavailable',
        'Health data integration is not available on this device.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const updatePermissionStatus = (status: HealthIntegrationStatus) => {
    setPermissions(prev => prev.map(permission => ({
      ...permission,
      enabled: status.permissions[permission.type] === 'authorized',
    })));
  };

  const handleRequestPermissions = async () => {
    setIsLoading(true);
    
    try {
      const status = await healthService.initialize();
      setHealthStatus(status);
      
      if (status.isAuthorized) {
        updatePermissionStatus(status);
        Alert.alert(
          'Success!',
          'Health permissions have been granted. You can now create health-based habits.',
          [
            {
              text: 'Create Health Habit',
              onPress: () => navigation.navigate('CreateHabit', { type: 'health' }),
            },
            {
              text: 'Done',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert(
          'Permissions Required',
          'Please grant health permissions in your device settings to use health-based habits.',
          [
            {
              text: 'Open Settings',
              onPress: () => {
                // TODO: Open device health settings
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      Alert.alert('Error', 'Failed to request health permissions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlatformName = () => {
    return Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit';
  };

  const getPlatformIcon = () => {
    return Platform.OS === 'ios' ? 'heart-circle' : 'fitness';
  };

  const renderPermissionItem = (item: HealthPermissionItem) => (
    <View key={item.type} style={styles.permissionItem}>
      <View style={[styles.permissionIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon as any} size={24} color="#fff" />
      </View>
      <View style={styles.permissionContent}>
        <Text style={styles.permissionTitle}>{item.title}</Text>
        <Text style={styles.permissionDescription}>{item.description}</Text>
      </View>
      <View style={styles.permissionStatus}>
        {item.enabled ? (
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        ) : (
          <Ionicons name="ellipse-outline" size={24} color="#ccc" />
        )}
      </View>
    </View>
  );

  const renderHealthUnavailable = () => (
    <View style={styles.unavailableContainer}>
      <Ionicons name="warning-outline" size={64} color="#FF9800" />
      <Text style={styles.unavailableTitle}>Health Integration Unavailable</Text>
      <Text style={styles.unavailableDescription}>
        {Platform.OS === 'ios' 
          ? 'Apple Health is not available on this device. Health-based habits require a device with HealthKit support.'
          : 'Google Fit is not available on this device. Health-based habits require Google Play Services.'
        }
      </Text>
      <Button
        title="Go Back"
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      />
    </View>
  );

  if (healthStatus && !healthStatus.isAvailable) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHealthUnavailable()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name={getPlatformIcon()} size={48} color="#2196F3" />
          </View>
          <Text style={styles.headerTitle}>Connect {getPlatformName()}</Text>
          <Text style={styles.headerDescription}>
            Enable automatic habit tracking by connecting to your device's health data
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Benefits</Text>
          <View style={styles.benefitItem}>
            <Ionicons name="flash" size={20} color="#4CAF50" />
            <Text style={styles.benefitText}>Automatic progress tracking</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="trending-up" size={20} color="#4CAF50" />
            <Text style={styles.benefitText}>Accurate fitness and sleep data</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="time" size={20} color="#4CAF50" />
            <Text style={styles.benefitText}>Save time on manual logging</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="analytics" size={20} color="#4CAF50" />
            <Text style={styles.benefitText}>Detailed health insights</Text>
          </View>
        </View>

        {/* Permissions */}
        <View style={styles.permissionsSection}>
          <Text style={styles.sectionTitle}>Health Data Access</Text>
          <Text style={styles.permissionsDescription}>
            We'll request access to the following health data to enable automatic habit tracking:
          </Text>
          
          {permissions.map(renderPermissionItem)}
        </View>

        {/* Privacy Note */}
        <View style={styles.privacySection}>
          <Ionicons name="shield-checkmark" size={24} color="#2196F3" />
          <View style={styles.privacyContent}>
            <Text style={styles.privacyTitle}>Your Privacy Matters</Text>
            <Text style={styles.privacyDescription}>
              • Health data stays on your device and our secure servers{'\n'}
              • Data is only used for habit tracking features{'\n'}
              • You can revoke access anytime in device settings{'\n'}
              • We never share your health data with third parties
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.bottomContainer}>
        {healthStatus?.isAuthorized ? (
          <View style={styles.connectedContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.connectedText}>Connected to {getPlatformName()}</Text>
            <Button
              title="Create Health Habit"
              onPress={() => navigation.navigate('CreateHabit', { type: 'health' })}
              style={styles.actionButton}
            />
          </View>
        ) : (
          <Button
            title={`Connect to ${getPlatformName()}`}
            onPress={handleRequestPermissions}
            loading={isLoading}
            style={styles.actionButton}
          />
        )}
        
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  headerIcon: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsSection: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  permissionsSection: {
    margin: 20,
    marginTop: 0,
  },
  permissionsDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  permissionStatus: {
    marginLeft: 16,
  },
  privacySection: {
    flexDirection: 'row',
    margin: 20,
    marginTop: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  privacyContent: {
    flex: 1,
    marginLeft: 16,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  privacyDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bottomContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  connectedContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  connectedText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 16,
  },
  actionButton: {
    width: '100%',
    marginBottom: 12,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
  },
  unavailableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  unavailableTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  unavailableDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 32,
  },
});