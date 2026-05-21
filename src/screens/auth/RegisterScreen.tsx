import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Button, Field } from '../../components/ds';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

const calcStrength = (pwd: string): { score: number; label: string } => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd) || pwd.length >= 12) score++;
  const labels = ['Too short', 'Weak', 'Okay', 'Strong', 'Very strong'];
  return { score, label: labels[score] };
};

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const t = useTheme();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => calcStrength(form.password), [form.password]);
  const valid =
    form.name.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(form.email) &&
    form.password.length >= 8 &&
    agreed;

  const handleRegister = async () => {
    if (!valid) {
      Alert.alert('Check your inputs', 'Please complete all fields and accept the terms.');
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.password, form.name);
    } catch (err) {
      Alert.alert('Could not create account', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <AppHeader title="Create account" subtitle="Join thousands building better habits." back onBack={() => navigation.goBack()} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 40, gap: 14 }}
          keyboardShouldPersistTaps="handled"
        >
          <Field
            label="Full name"
            value={form.name}
            onChangeText={(name) => setForm({ ...form, name })}
            placeholder="Alex Mercer"
            autoCapitalize="words"
            autoComplete="name"
          />
          <Field
            label="Email"
            value={form.email}
            onChangeText={(email) => setForm({ ...form, email })}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />
          <Field
            label="Password"
            value={form.password}
            onChangeText={(password) => setForm({ ...form, password })}
            placeholder="At least 8 characters"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password-new"
            right={
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={t.colors.ink3} />
              </Pressable>
            }
          />

          {/* Password strength meter */}
          {form.password.length > 0 && (
            <View>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 999,
                      backgroundColor: i < strength.score ? t.colors.sage : t.colors.line,
                    }}
                  />
                ))}
              </View>
              <Text style={{ color: t.colors.ink2, fontSize: 13, fontWeight: '500', marginTop: 4 }}>
                {strength.label}
              </Text>
            </View>
          )}

          {/* Terms */}
          <Pressable
            onPress={() => setAgreed(!agreed)}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 4 }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                borderWidth: agreed ? 0 : 1.5,
                borderColor: t.colors.line,
                backgroundColor: agreed ? t.colors.primary : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 1,
              }}
            >
              {agreed && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <Text style={{ flex: 1, color: t.colors.ink2, fontSize: 13, lineHeight: 18 }}>
              I agree to the <Text style={{ color: t.colors.primary, fontWeight: '600' }}>Terms</Text> and{' '}
              <Text style={{ color: t.colors.primary, fontWeight: '600' }}>Privacy Policy</Text>.
            </Text>
          </Pressable>

          <Button title="Create account" loading={loading} onPress={handleRegister} fullWidth style={{ marginTop: 8 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 16 }}>
            <Text style={{ color: t.colors.ink2, fontSize: 14 }}>Have an account?</Text>
            <Pressable onPress={() => navigation.navigate('Login')} hitSlop={6}>
              <Text style={{ color: t.colors.primary, fontSize: 14, fontWeight: '600' }}>Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};
