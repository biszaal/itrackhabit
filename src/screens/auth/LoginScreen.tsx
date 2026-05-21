import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { AuthCredentials } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Button, Field } from '../../components/ds';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const t = useTheme();
  const { login } = useAuth();
  const [credentials, setCredentials] = useState<AuthCredentials>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stayed, setStayed] = useState(true);

  const valid = /\S+@\S+\.\S+/.test(credentials.email) && credentials.password.length >= 6;

  const handleLogin = async () => {
    if (!valid) {
      Alert.alert('Check your inputs', 'Enter a valid email and a 6+ character password.');
      return;
    }
    setLoading(true);
    try {
      await login(credentials.email, credentials.password);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Sign in failed.';
      Alert.alert('Could not sign in', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <AppHeader
          title="Welcome back"
          subtitle="Sign in to keep the streak going."
          back
          onBack={() => navigation.goBack()}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 40, gap: 14 }}
          keyboardShouldPersistTaps="handled"
        >
          <Field
            label="Email"
            value={credentials.email}
            onChangeText={(email) => setCredentials({ ...credentials, email })}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />
          <Field
            label="Password"
            value={credentials.password}
            onChangeText={(password) => setCredentials({ ...credentials, password })}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            right={
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={t.colors.ink3} />
              </Pressable>
            }
          />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <Pressable onPress={() => setStayed(!stayed)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  borderWidth: stayed ? 0 : 1.5,
                  borderColor: t.colors.line,
                  backgroundColor: stayed ? t.colors.primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {stayed && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={{ color: t.colors.ink2, fontSize: 14 }}>Stay signed in</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={6}>
              <Text style={{ color: t.colors.primary, fontSize: 14, fontWeight: '600' }}>Forgot?</Text>
            </Pressable>
          </View>

          <Button title="Sign in" loading={loading} onPress={handleLogin} fullWidth style={{ marginTop: 8 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: t.colors.lineSoft }} />
            <Text style={{ color: t.colors.ink3, fontSize: 13, fontWeight: '500' }}>or continue with</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: t.colors.lineSoft }} />
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button
              variant="secondary"
              title="Apple"
              leftIcon={<Ionicons name="logo-apple" size={18} color={t.colors.ink} />}
              style={{ flex: 1 }}
              onPress={() => Alert.alert('Apple sign-in', 'Coming soon.')}
            />
            <Button
              variant="secondary"
              title="Google"
              leftIcon={<Ionicons name="logo-google" size={16} color={t.colors.ink} />}
              style={{ flex: 1 }}
              onPress={() => Alert.alert('Google sign-in', 'Coming soon.')}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 16 }}>
            <Text style={{ color: t.colors.ink2, fontSize: 14 }}>New here?</Text>
            <Pressable onPress={() => navigation.navigate('Register')} hitSlop={6}>
              <Text style={{ color: t.colors.primary, fontSize: 14, fontWeight: '600' }}>Create account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};
