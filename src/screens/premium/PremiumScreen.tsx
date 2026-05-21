import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { User, SubscriptionPlan } from '../../types';
import { authService } from '../../services/auth';
import { premiumService } from '../../services/premium';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, Button } from '../../components/ds';

type PremiumScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Premium'>;

interface Props {
  navigation: PremiumScreenNavigationProp;
}

const FEATURES = [
  { title: 'Unlimited habits', sub: 'Free is limited to 3', emoji: '∞' },
  { title: 'AI insights & coaching', sub: 'Patterns, stacking, weekly briefs', emoji: '✨' },
  { title: 'Four Laws designer', sub: 'Atomic Habits framework, guided', emoji: '🎯' },
  { title: 'Health & device sync', sub: 'Apple Health, Google Fit', emoji: '❤️' },
  { title: 'Calendar heatmap · all habits', sub: 'Free shows 1 habit', emoji: '🗓' },
  { title: 'Premium templates & mentors', sub: 'Curated 60+ templates', emoji: '👤' },
];

export const PremiumScreen: React.FC<Props> = ({ navigation }) => {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const u = await authService.getCurrentUser();
        setUser(u);
        const p = premiumService.getSubscriptionPlans();
        setPlans(p ?? []);
        const rec = premiumService.getRecommendedPlan?.();
        setSelectedPlan(rec?.id ?? p?.[0]?.id ?? '');
      } catch {}
    })();
  }, []);

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      const updated = await premiumService.purchaseSubscription(selectedPlan);
      setUser(updated);
      Alert.alert('Welcome to Premium 🎉', 'Enjoy unlimited access.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Purchase failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const restored = await premiumService.restorePurchases();
      if (restored) {
        setUser(restored);
        Alert.alert('Restored', 'Your subscription has been restored.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        Alert.alert('No purchases', "We couldn't find any previous purchases.");
      }
    } catch (e) {
      Alert.alert('Restore failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setRestoring(false);
    }
  };

  const annual = plans.find((p) => p.interval === 'yearly');
  const monthly = plans.find((p) => p.interval === 'monthly');

  const isRecommended = (p: SubscriptionPlan) => p.id === (annual?.id ?? '');

  const cta = user?.subscriptionStatus === 'free' ? 'Start 7-day free trial' : 'Continue';

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Header hero gradient */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            backgroundColor: t.isDark ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.12)',
          }}
        />

        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: t.colors.bgPaper,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={20} color={t.colors.ink2} />
            </Pressable>
            <Pressable onPress={handleRestore} disabled={restoring} hitSlop={8}>
              <Text style={{ color: t.colors.ink2, fontSize: 13, fontWeight: '600' }}>
                {restoring ? 'Restoring…' : 'Restore'}
              </Text>
            </Pressable>
          </View>

          <View style={{ alignItems: 'center', marginBottom: 26 }}>
            <View
              style={[
                {
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  backgroundColor: t.colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                t.shadow.pill,
              ]}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 28 }}>✦</Text>
            </View>
            <Text
              style={{
                color: t.colors.ink,
                fontSize: 28,
                fontWeight: '700',
                letterSpacing: -0.7,
                marginTop: 14,
                textAlign: 'center',
              }}
            >
              Unlock your full practice
            </Text>
            <Text style={{ color: t.colors.ink2, fontSize: 14, marginTop: 6, textAlign: 'center', maxWidth: 320 }}>
              AI insights, unlimited habits, Four Laws designer, and more.
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {/* Plan cards */}
          <View style={{ gap: 10 }}>
            {annual && (
              <Pressable onPress={() => setSelectedPlan(annual.id)}>
                <View
                  style={[
                    {
                      padding: 18,
                      borderRadius: t.radius.card,
                      backgroundColor: t.colors.bgElev,
                      borderWidth: 2,
                      borderColor: selectedPlan === annual.id ? t.colors.primary : t.colors.line,
                      position: 'relative',
                    },
                    selectedPlan === annual.id ? t.shadow.sh2 : undefined,
                  ]}
                >
                  <View
                    style={{
                      position: 'absolute',
                      top: -10,
                      left: 18,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 999,
                      backgroundColor: t.colors.primary,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      Recommended
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ color: t.colors.ink, fontSize: 15, fontWeight: '700' }}>Annual</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
                        <Text style={{ color: t.colors.ink, fontSize: 30, fontWeight: '700', letterSpacing: -0.6 }}>
                          ${(annual.price / 12).toFixed(2)}
                        </Text>
                        <Text style={{ color: t.colors.ink3, fontSize: 13, fontWeight: '500' }}>/ month, billed yearly</Text>
                      </View>
                    </View>
                    <SelectIndicator selected={selectedPlan === annual.id} />
                  </View>
                </View>
              </Pressable>
            )}

            {monthly && (
              <Pressable onPress={() => setSelectedPlan(monthly.id)}>
                <View
                  style={{
                    padding: 16,
                    borderRadius: t.radius.card,
                    backgroundColor: t.colors.bgElev,
                    borderWidth: 1,
                    borderColor: selectedPlan === monthly.id ? t.colors.primary : t.colors.line,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ color: t.colors.ink, fontSize: 15, fontWeight: '700' }}>Monthly</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                        <Text style={{ color: t.colors.ink, fontSize: 22, fontWeight: '700' }}>${monthly.price.toFixed(2)}</Text>
                        <Text style={{ color: t.colors.ink3, fontSize: 13, fontWeight: '500' }}>/ month</Text>
                      </View>
                    </View>
                    <SelectIndicator selected={selectedPlan === monthly.id} small />
                  </View>
                </View>
              </Pressable>
            )}

            {/* Trial reminder */}
            <View
              style={{
                padding: 14,
                borderRadius: t.radius.card,
                backgroundColor: t.colors.bgPaper,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: t.colors.line,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: t.isDark ? 'rgba(124,155,126,0.18)' : '#E0EAE0',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="sparkles" size={18} color={t.colors.sage} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.colors.ink, fontSize: 13, fontWeight: '700' }}>7-day free trial</Text>
                <Text style={{ color: t.colors.ink3, fontSize: 12 }}>No commitment · cancel anytime</Text>
              </View>
            </View>
          </View>

          {/* Features */}
          <View style={{ marginTop: 22, gap: 10 }}>
            {FEATURES.map((f, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: t.colors.bgPaper,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{f.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.colors.ink, fontSize: 14, fontWeight: '600' }}>{f.title}</Text>
                  <Text style={{ color: t.colors.ink3, fontSize: 13, marginTop: 1 }}>{f.sub}</Text>
                </View>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: t.isDark ? 'rgba(95,179,122,0.22)' : '#DAEFE0',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="checkmark" size={14} color={t.colors.success} />
                </View>
              </View>
            ))}
          </View>

          {/* Social proof */}
          <View
            style={{
              marginTop: 22,
              padding: 16,
              borderRadius: t.radius.card,
              backgroundColor: t.colors.bgPaper,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: t.colors.ink, fontSize: 18, fontWeight: '600', letterSpacing: -0.2, textAlign: 'center' }}>
              "It finally clicked."
            </Text>
            <Text style={{ color: t.colors.ink3, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
              — 4.8 ★ from 12,400 reviews
            </Text>
          </View>

          <Button title={cta} loading={loading} onPress={handlePurchase} fullWidth size="lg" style={{ marginTop: 22 }} />
          {annual && (
            <Text style={{ textAlign: 'center', color: t.colors.ink3, fontSize: 13, marginTop: 10 }}>
              Then ${(annual.price).toFixed(2)}/yr · Cancel anytime
            </Text>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 18 }}>
            <Text style={{ color: t.colors.ink3, fontSize: 12 }}>Terms</Text>
            <Text style={{ color: t.colors.ink3, fontSize: 12 }}>Privacy</Text>
            <Pressable onPress={handleRestore}>
              <Text style={{ color: t.colors.ink3, fontSize: 12 }}>Restore</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
};

const SelectIndicator: React.FC<{ selected: boolean; small?: boolean }> = ({ selected, small }) => {
  const t = useTheme();
  const size = small ? 22 : 24;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: selected ? t.colors.primary : 'transparent',
        borderWidth: selected ? 0 : 1.5,
        borderColor: t.colors.line,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {selected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
    </View>
  );
};
