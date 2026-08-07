import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackScreenProps } from '../../types/navigation';
import { HABIT_CATEGORIES, getTemplatesByCategory, HabitTemplate } from '../../data/habitTemplates';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Button } from '../../components/ds';
import { Glyph, HabitIcon, Illustration, resolveGlyph } from '../../components/art';

type HabitTemplatesScreenProps = RootStackScreenProps<'HabitTemplates'>;

export const HabitTemplatesScreen: React.FC<HabitTemplatesScreenProps> = ({ navigation }) => {
  const t = useTheme();
  const [category, setCategory] = useState<string>('all');
  const templates = useMemo(() => getTemplatesByCategory(category), [category]);

  const pick = (tmpl: HabitTemplate) => {
    navigation.navigate('CreateEditHabit', {
      template: {
        title: tmpl.title,
        emoji: tmpl.emoji,
        color: tmpl.color,
        frequency: tmpl.frequency,
        targetConfig: tmpl.targetConfig,
        healthConfig: tmpl.healthConfig,
        notes: tmpl.notes,
        type: tmpl.category,
      },
    });
  };

  const categories = [{ id: 'all', name: 'All', icon: 'sparkle' }, ...HABIT_CATEGORIES];

  return (
    <Screen>
      <AppHeader
        title="Templates"
        subtitle="Start with a curated habit."
        back
        onBack={() => navigation.goBack()}
        action={
          <Pressable
            onPress={() => navigation.navigate('CreateEditHabit', {})}
            accessibilityRole="button"
            accessibilityLabel="Create a custom habit"
            hitSlop={8}
            style={[
              {
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: t.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              },
              t.shadow.pill,
            ]}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
          </Pressable>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: t.spacing.screen, gap: 8, paddingVertical: 4 }}
        >
          {categories.map((c: any) => {
            const active = category === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setCategory(c.id)}
                accessibilityRole="button"
                accessibilityLabel={c.label ?? c.id}
                accessibilityState={{ selected: category === c.id }}
                style={{
                  height: 36,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: active ? t.colors.ink : t.colors.bgPaper,
                }}
              >
                <Glyph
                  name={resolveGlyph(c.icon, c.name)}
                  size={16}
                  color={active ? t.colors.bg : t.colors.ink2}
                  surface={active ? t.colors.ink : t.colors.bgPaper}
                />
                <Text style={{ color: active ? t.colors.bg : t.colors.ink2, fontSize: 13, fontWeight: '600' }}>
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ paddingHorizontal: t.spacing.screen, paddingTop: 16, gap: 10 }}>
          {templates.length === 0 ? (
            <Card variant="flat" padding={32} style={{ alignItems: 'center', gap: 8 }}>
              <Illustration name="noTemplates" width={168} surface={t.colors.bgPaper} />
              <Text style={{ color: t.colors.ink, fontSize: 18, fontWeight: '700', marginTop: 4 }}>
                No templates here
              </Text>
              <Text style={{ color: t.colors.ink2, fontSize: 13, textAlign: 'center' }}>
                Try another category or create a custom habit.
              </Text>
              <Button title="Create custom" style={{ marginTop: 8 }} onPress={() => navigation.navigate('CreateEditHabit', {})} />
            </Card>
          ) : (
            templates.map((tmpl) => (
              <Pressable
                key={tmpl.id}
                onPress={() => pick(tmpl)}
                accessibilityRole="button"
                accessibilityLabel={`Use template `}
              >
                <Card variant="elevated" padding={14}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <HabitIcon icon={tmpl.emoji} name={tmpl.title} color={tmpl.color} size={48} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: t.colors.ink, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
                        {tmpl.title}
                      </Text>
                      <Text style={{ color: t.colors.ink3, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
                        {tmpl.description}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                            backgroundColor: t.colors.bgPaper,
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '600', color: t.colors.ink2 }}>
                            {tmpl.targetConfig?.targetValue} {tmpl.targetConfig?.unit}
                          </Text>
                        </View>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                            backgroundColor: t.colors.bgPaper,
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '600', color: t.colors.ink2 }}>
                            {tmpl.frequency}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={t.colors.ink3} />
                  </View>
                </Card>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
};
