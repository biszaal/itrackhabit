import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { healthService } from '../../services/health';
import { HealthIntegrationStatus, HealthDataType } from '../../types/health';
import { RootStackScreenProps } from '../../types/navigation';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Button } from '../../components/ds';

type HealthPermissionsScreenProps = RootStackScreenProps<'HealthPermissions'>;

interface HealthPermissionItem {
  type: HealthDataType;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  enabled: boolean;
}

const DEFAULT_PERMS: HealthPermissionItem[] = [
  { type: HealthDataType.STEPS, title: 'Steps', description: 'Daily step count', icon: 'walk', color: '#7C9B7E', enabled: false },
  { type: HealthDataType.EXERCISE_TIME, title: 'Exercise minutes', description: 'Workout duration', icon: 'barbell', color: '#E07A77', enabled: false },
  { type: HealthDataType.CALORIES_BURNED, title: 'Calories burned', description: 'Active energy expenditure', icon: 'flame', color: '#E0A864', enabled: false },
  { type: HealthDataType.SLEEP_ANALYSIS, title: 'Sleep', description: 'Duration and quality', icon: 'moon', color: '#9B7BC7', enabled: false },
  { type: HealthDataType.WORKOUT, title: 'Workouts', description: 'Recorded sessions', icon: 'fitness', color: '#6FA8C7', enabled: false },
  { type: HealthDataType.HEART_RATE, title: 'Heart rate', description: 'During activities', icon: 'heart', color: '#C28267', enabled: false },
];

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

export const HealthPermissionsScreen: React.FC<HealthPermissionsScreenProps> = ({ navigation }) => {
  const t = useTheme();
  const [perms, setPerms] = useState<HealthPermissionItem[]>(DEFAULT_PERMS);
  const [status, setStatus] = useState<HealthIntegrationStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const platformName = Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit';

  useEffect(() => {
    (async () => {
      try {
        const s = await healthService.initialize();
        setStatus(s);
        if (s.isAuthorized) {
          setPerms((prev) =>
            prev.map((p) => ({
              ...p,
              enabled: (s as any).authorizedTypes?.includes(p.type) ?? s.isAuthorized,
            }))
          );
        }
      } catch {
        Alert.alert('Health unavailable', 'Health integration is not available on this device.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    })();
  }, [navigation]);

  const handleRequest = async () => {
    setLoading(true);
    try {
      const s = await healthService.initialize();
      setStatus(s);
      if (s.isAuthorized) {
        setPerms((prev) => prev.map((p) => ({ ...p, enabled: true })));
        Alert.alert('Granted', `${platformName} is connected.`, [
          { text: 'Create health habit', onPress: () => navigation.navigate('CreateHabit', { type: 'health' }) },
          { text: 'Done', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Permissions needed', `Open device settings to grant ${platformName} access.`);
      }
    } catch {
      Alert.alert('Could not request', 'Try again later.');
    } finally {
      setLoading(false);
    }
  };

  const granted = perms.filter((p) => p.enabled).length;

  return (
    <Screen>
      <AppHeader
        title="Health permissions"
        subtitle={`${granted} of ${perms.length} granted`}
        back
        onBack={() => navigation.goBack()}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 60 }}>
        <Card variant="elevated" padding={18} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: tint(t.colors.rose, 0.14, t.colors.bgPaper),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="heart" size={22} color={t.colors.rose} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.colors.ink, fontSize: 16, fontWeight: '700' }}>{platformName}</Text>
            <Text style={{ color: t.colors.ink3, fontSize: 12, marginTop: 2 }}>
              {status?.isAuthorized ? 'Connected' : 'Not connected — tap below to enable'}
            </Text>
          </View>
        </Card>

        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: t.colors.ink3,
            textTransform: 'uppercase',
            letterSpacing: 0.7,
            paddingLeft: 4,
            marginTop: 22,
            marginBottom: 10,
          }}
        >
          Data types
        </Text>
        <Card variant="elevated" padding={0}>
          {perms.map((p, i) => (
            <View
              key={p.type}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderBottomWidth: i < perms.length - 1 ? 1 : 0,
                borderBottomColor: t.colors.lineSoft,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: tint(p.color, 0.14, t.colors.bgPaper),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={p.icon} size={18} color={p.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.colors.ink, fontSize: 14, fontWeight: '600' }}>{p.title}</Text>
                <Text style={{ color: t.colors.ink3, fontSize: 12, marginTop: 2 }}>{p.description}</Text>
              </View>
              <Ionicons
                name={p.enabled ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={p.enabled ? t.colors.success : t.colors.ink4}
              />
            </View>
          ))}
        </Card>

        <Button
          title={status?.isAuthorized ? 'Re-request permissions' : `Connect ${platformName}`}
          loading={loading}
          fullWidth
          style={{ marginTop: 16 }}
          onPress={handleRequest}
        />

        {status?.isAuthorized && (
          <Button
            title="Create health habit"
            variant="secondary"
            fullWidth
            style={{ marginTop: 10 }}
            onPress={() => navigation.navigate('CreateHabit', { type: 'health' })}
          />
        )}
      </ScrollView>
    </Screen>
  );
};
