import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackScreenProps } from '../../types/navigation';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, Button, Ring } from '../../components/ds';

type WelcomeScreenProps = RootStackScreenProps<'Welcome'>;

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Screen>
      {/* Hero illustration */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '55%',
          backgroundColor: t.isDark ? 'rgba(129,140,248,0.12)' : 'rgba(99,102,241,0.06)',
        }}
      />
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          paddingHorizontal: t.spacing.screen,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 24,
        }}
      >
        {/* Layered card illustration */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 280, height: 300, position: 'relative' }}>
            <View
              style={[
                {
                  position: 'absolute',
                  top: 16,
                  left: 30,
                  transform: [{ rotate: '-8deg' }],
                  width: 200,
                  padding: 20,
                  borderRadius: 22,
                  backgroundColor: t.colors.bgElev,
                  alignItems: 'center',
                  gap: 12,
                },
                t.shadow.sh3,
              ]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                <Text style={{ color: t.colors.sage, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 }}>SAGE</Text>
                <Text style={{ color: t.colors.ink3, fontSize: 11, fontWeight: '600' }}>12 day streak</Text>
              </View>
              <Ring size={130} stroke={10} pct={0.8} color={t.colors.sage}>
                <Text style={{ fontSize: 30, fontWeight: '700', color: t.colors.ink, letterSpacing: -0.6 }}>
                  80<Text style={{ fontSize: 12, color: t.colors.ink3 }}>%</Text>
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: t.colors.ink3, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  TODAY
                </Text>
              </Ring>
            </View>
            <View
              style={[
                {
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  transform: [{ rotate: '4deg' }],
                  width: 240,
                  padding: 16,
                  borderRadius: 20,
                  backgroundColor: t.colors.bgElev,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                },
                t.shadow.sh3,
              ]}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  backgroundColor: t.isDark ? 'rgba(129,140,248,0.18)' : '#E8E6F8',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 22 }}>🧘</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.colors.ink, fontSize: 15, fontWeight: '600' }}>Meditate</Text>
                <Text style={{ color: t.colors.ink3, fontSize: 12, marginTop: 2 }}>10 min · Synced</Text>
              </View>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: t.colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              </View>
            </View>
          </View>
        </View>

        {/* Bottom CTA */}
        <View style={{ gap: 16 }}>
          <Text style={{ color: t.colors.ink, fontSize: 28, fontWeight: '700', letterSpacing: -0.7, textAlign: 'center' }}>
            Small wins, every day.
          </Text>
          <Text style={{ color: t.colors.ink2, fontSize: 15, textAlign: 'center', maxWidth: 320, alignSelf: 'center' }}>
            Track habits with rings, streaks, and an Atomic Habits framework that nudges identity over outcome.
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8, marginBottom: 8 }}>
            <View style={{ width: 24, height: 8, borderRadius: 4, backgroundColor: t.colors.primary }} />
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.line }} />
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.line }} />
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.line }} />
          </View>
          <Button title="Get started" onPress={() => navigation.navigate('Register')} fullWidth />
          <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
            <Text style={{ textAlign: 'center', color: t.colors.ink2, fontSize: 14 }}>
              Already with us? <Text style={{ color: t.colors.primary, fontWeight: '600' }}>Sign in</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
};
