import React, { useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Button, Field } from '../../components/ds';
import { dataService } from '../../services/core';
import { HABIT_TEMPLATES, HabitTemplate } from '../../data/habitTemplates';

const GOALS = [
  { id: 'health', title: 'Health & Fitness', emoji: '💪' },
  { id: 'productivity', title: 'Productivity', emoji: '🎯' },
  { id: 'mindfulness', title: 'Mindfulness', emoji: '🧘' },
  { id: 'learning', title: 'Learning', emoji: '📚' },
  { id: 'creative', title: 'Creativity', emoji: '🎨' },
  { id: 'social', title: 'Relationships', emoji: '👥' },
];

const STEPS = ['welcome', 'name', 'goals', 'habits', 'ready'] as const;
type Step = (typeof STEPS)[number];

const getRecommended = (goals: string[]): HabitTemplate[] => {
  const templates: HabitTemplate[] = [];
  goals.forEach((goal) => {
    const categoryTemplates = HABIT_TEMPLATES.filter((t: HabitTemplate) => t.category === goal);
    templates.push(...categoryTemplates.slice(0, 3));
  });
  return templates.slice(0, 8);
};

const OnboardingScreen: React.FC = () => {
  const t = useTheme();
  const navigation = useNavigation<any>();
  const scrollRef = useRef<ScrollView>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [name, setName] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [picked, setPicked] = useState<HabitTemplate[]>([]);
  const [finishing, setFinishing] = useState(false);

  const step: Step = STEPS[stepIdx];
  const recommended = useMemo(() => getRecommended(goals), [goals]);

  const toggleGoal = (id: string) => {
    setGoals((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const togglePick = (tmpl: HabitTemplate) => {
    setPicked((cur) => (cur.includes(tmpl) ? cur.filter((x) => x !== tmpl) : [...cur, tmpl]));
  };

  const canProceed = (): boolean => {
    if (step === 'goals') return goals.length > 0;
    if (step === 'habits') return picked.length > 0;
    return true;
  };

  const next = async () => {
    if (stepIdx < STEPS.length - 1) {
      setStepIdx(stepIdx + 1);
      scrollRef.current?.scrollTo({ y: 0 });
    } else {
      await finish();
    }
  };

  const back = () => {
    if (stepIdx > 0) {
      setStepIdx(stepIdx - 1);
      scrollRef.current?.scrollTo({ y: 0 });
    } else {
      navigation.goBack();
    }
  };

  const finish = async () => {
    setFinishing(true);
    try {
      await dataService.initialize();
      for (const tmpl of picked) {
        await dataService.createHabit({
          title: tmpl.title,
          notes: tmpl.notes,
          frequency: tmpl.frequency as 'daily' | 'weekly',
          type: 'manual',
          targetConfig: tmpl.targetConfig,
          emoji: tmpl.emoji,
          color: tmpl.color,
        });
      }
      await AsyncStorage.setItem('onboarding_completed', 'true');
      Alert.alert(
        '🎉 Welcome aboard!',
        `You've started with ${picked.length} habit${picked.length !== 1 ? 's' : ''}. Take it one day at a time.`,
        [{ text: "Let's go", onPress: () => navigation.navigate('Main') }]
      );
    } catch {
      Alert.alert('Sorry', 'Could not finish setup. Please try again.');
    } finally {
      setFinishing(false);
    }
  };

  return (
    <Screen>
      <AppHeader
        title=""
        large={false}
        back
        onBack={back}
        action={
          <Text style={{ color: t.colors.ink3, fontSize: 13, fontWeight: '600' }}>
            Step {stepIdx + 1} of {STEPS.length}
          </Text>
        }
      />

      {/* Progress dots */}
      <View style={{ paddingHorizontal: t.spacing.screen, flexDirection: 'row', gap: 6, marginBottom: 16 }}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 999,
              backgroundColor: i <= stepIdx ? t.colors.primary : t.colors.line,
            }}
          />
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 120 }}
      >
        {step === 'welcome' && (
          <View style={{ alignItems: 'center', gap: 18, paddingTop: 32 }}>
            <Text style={{ fontSize: 72 }}>👋</Text>
            <Text style={{ color: t.colors.ink, fontSize: 28, fontWeight: '700', letterSpacing: -0.7, textAlign: 'center' }}>
              Welcome to{'\n'}iTrackHabit
            </Text>
            <Text style={{ color: t.colors.ink2, fontSize: 15, textAlign: 'center', maxWidth: 320 }}>
              Let's set you up with a few small habits that compound into something big.
            </Text>
          </View>
        )}

        {step === 'name' && (
          <View style={{ gap: 14, paddingTop: 8 }}>
            <Text style={{ color: t.colors.ink, fontSize: 22, fontWeight: '700', letterSpacing: -0.4 }}>
              What should we call you?
            </Text>
            <Text style={{ color: t.colors.ink2, fontSize: 14 }}>
              We'll greet you with this on Home each morning.
            </Text>
            <Field
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Alex"
              autoCapitalize="words"
            />
          </View>
        )}

        {step === 'goals' && (
          <View style={{ gap: 14, paddingTop: 8 }}>
            <Text style={{ color: t.colors.ink, fontSize: 22, fontWeight: '700', letterSpacing: -0.4 }}>
              What matters to you most?
            </Text>
            <Text style={{ color: t.colors.ink2, fontSize: 14 }}>
              Pick one or more — we'll tailor habit suggestions.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }}>
              {GOALS.map((g) => {
                const sel = goals.includes(g.id);
                return (
                  <Pressable
                    key={g.id}
                    onPress={() => toggleGoal(g.id)}
                    accessibilityRole="checkbox"
                    accessibilityLabel={g.title}
                    accessibilityState={{ checked: sel }}
                    style={{ width: '48%' }}
                  >
                    <Card
                      variant={sel ? 'elevated' : 'flat'}
                      padding={16}
                      style={{
                        borderWidth: sel ? 1.5 : 0,
                        borderColor: sel ? t.colors.primary : 'transparent',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Text style={{ fontSize: 32 }}>{g.emoji}</Text>
                      <Text style={{ color: t.colors.ink, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
                        {g.title}
                      </Text>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {step === 'habits' && (
          <View style={{ gap: 14, paddingTop: 8 }}>
            <Text style={{ color: t.colors.ink, fontSize: 22, fontWeight: '700', letterSpacing: -0.4 }}>
              Pick your starting habits
            </Text>
            <Text style={{ color: t.colors.ink2, fontSize: 14 }}>
              Start with 1–3. You can always add more later.
            </Text>
            {recommended.length === 0 ? (
              <Card variant="flat" padding={20} style={{ alignItems: 'center' }}>
                <Text style={{ color: t.colors.ink2, fontSize: 14 }}>No templates for your goals — you can create your own later.</Text>
              </Card>
            ) : (
              <View style={{ gap: 10 }}>
                {recommended.map((tmpl) => {
                  const sel = picked.includes(tmpl);
                  const c = tmpl.color || t.colors.primary;
                  return (
                    <Pressable
                      key={tmpl.title}
                      onPress={() => togglePick(tmpl)}
                      accessibilityRole="checkbox"
                      accessibilityLabel={tmpl.title}
                      accessibilityState={{ checked: sel }}
                    >
                      <Card
                        variant="elevated"
                        padding={14}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          borderWidth: sel ? 1.5 : 0,
                          borderColor: sel ? t.colors.primary : 'transparent',
                        }}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            backgroundColor: c,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 20 }}>{tmpl.emoji ?? '🎯'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: t.colors.ink, fontSize: 14, fontWeight: '600' }}>{tmpl.title}</Text>
                          {tmpl.notes && (
                            <Text style={{ color: t.colors.ink3, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                              {tmpl.notes}
                            </Text>
                          )}
                        </View>
                        <View
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            borderWidth: sel ? 0 : 1.5,
                            borderColor: t.colors.line,
                            backgroundColor: sel ? t.colors.primary : 'transparent',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {sel && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                        </View>
                      </Card>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {step === 'ready' && (
          <View style={{ alignItems: 'center', gap: 18, paddingTop: 32 }}>
            <Text style={{ fontSize: 72 }}>🚀</Text>
            <Text style={{ color: t.colors.ink, fontSize: 28, fontWeight: '700', letterSpacing: -0.7, textAlign: 'center' }}>
              You're all set!
            </Text>
            <Text style={{ color: t.colors.ink2, fontSize: 15, textAlign: 'center', maxWidth: 320 }}>
              {picked.length === 0
                ? "Tap below to enter the app. You can add habits anytime."
                : `We'll create ${picked.length} habit${picked.length !== 1 ? 's' : ''} and take you to Today.`}
            </Text>
          </View>
        )}
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: 16,
          paddingBottom: 32,
          backgroundColor: t.colors.bg,
          borderTopWidth: 1,
          borderTopColor: t.colors.lineSoft,
        }}
      >
        <Button
          title={step === 'ready' ? "Let's go" : 'Continue'}
          fullWidth
          loading={finishing}
          disabled={!canProceed()}
          onPress={next}
        />
      </View>
    </Screen>
  );
};

export default OnboardingScreen;
