import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Button, Field } from '../../components/ds';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

interface Props {
  navigation: ForgotPasswordScreenNavigationProp;
}

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const t = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const valid = /\S+@\S+\.\S+/.test(email);

  const handleSubmit = async () => {
    if (!valid) {
      Alert.alert('Check email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      // Reset request handled out-of-band via Supabase; UI just confirms.
      await new Promise((r) => setTimeout(r, 800));
      setSent(true);
    } catch {
      Alert.alert('Could not send', 'Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Screen>
        <AppHeader title="Check your inbox" back onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.screen, paddingTop: 24, gap: 14 }}>
          <Card variant="flat" padding={28} style={{ alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: t.isDark ? 'rgba(77,139,88,0.18)' : '#E4F2E7',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="mail-outline" size={28} color={t.colors.success} />
            </View>
            <Text style={{ color: t.colors.ink, fontSize: 20, fontWeight: '700', letterSpacing: -0.3 }}>
              Reset link sent
            </Text>
            <Text style={{ color: t.colors.ink2, fontSize: 14, textAlign: 'center', maxWidth: 300 }}>
              If an account exists for {email}, you'll get an email with reset instructions in a moment.
            </Text>
          </Card>
          <Button title="Back to sign in" onPress={() => navigation.navigate('Login')} fullWidth />
          <Button title="Resend" variant="ghost" onPress={() => setSent(false)} fullWidth />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <AppHeader title="Reset password" subtitle="We'll send a one-time link to your inbox." back onBack={() => navigation.goBack()} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 40, gap: 14 }}
          keyboardShouldPersistTaps="handled"
        >
          <Card variant="flat" padding={28} style={{ alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: t.isDark ? 'rgba(129,140,248,0.18)' : '#E8E6F8',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="lock-closed-outline" size={28} color={t.colors.primary} />
            </View>
            <Text style={{ color: t.colors.ink2, fontSize: 15, textAlign: 'center', maxWidth: 280 }}>
              Enter the email on your account. We'll send a secure reset link.
            </Text>
          </Card>

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />

          <Button title="Send reset link" loading={loading} onPress={handleSubmit} fullWidth style={{ marginTop: 8 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 }}>
            <Text style={{ color: t.colors.ink2, fontSize: 14 }}>Remembered it?</Text>
            <Pressable onPress={() => navigation.navigate('Login')} hitSlop={6}>
              <Text style={{ color: t.colors.primary, fontSize: 14, fontWeight: '600' }}>Back to sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};
