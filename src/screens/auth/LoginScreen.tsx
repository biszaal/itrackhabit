import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { theme } from '../../theme';
import { AuthCredentials } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
  NeumorphCard,
  NeumorphInput,
  NeumorphButton,
} from '../../components/neumorphism';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login } = useAuth();
  const [credentials, setCredentials] = useState<AuthCredentials>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<AuthCredentials>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<AuthCredentials> = {};

    if (!credentials.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!credentials.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (credentials.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(credentials.email, credentials.password);
      // Navigation will be handled by the auth context
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      if (errorMessage.includes('Email not confirmed')) {
        Alert.alert(
          'Email Confirmation Required',
          'Please check your email and click the confirmation link before signing in. Check your spam folder if you don\'t see the email.',
          [
            { text: 'OK', style: 'default' },
            { 
              text: 'Resend Email', 
              onPress: () => {
                // TODO: Implement resend confirmation email
                Alert.alert('Feature Coming Soon', 'Email resend functionality will be available soon. Please check your email for the confirmation link.');
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Login Failed',
          errorMessage
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your habit journey</Text>
          </View>
            <NeumorphCard
              variant="medium"
              colorType="whiteGlass"
              style={styles.formCard}
              animated={true}
            >
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <NeumorphInput
                    placeholder="Email"
                    value={credentials.email}
                    onChangeText={(text: string) => {
                      setCredentials({ ...credentials, email: text });
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    glassIntensity="light"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <NeumorphInput
                    placeholder="Password"
                    value={credentials.password}
                    onChangeText={(text: string) => {
                      setCredentials({ ...credentials, password: text });
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    glassIntensity="light"
                  />
                </View>

                <NeumorphButton
                  title="Forgot Password?"
                  variant="secondary"
                  size="small"
                  onPress={() => navigation.navigate('ForgotPassword')}
                  style={styles.forgotPasswordButton}
                  glassIntensity="subtle"
                />

                <NeumorphButton
                  title={loading ? undefined : "Sign In"}
                  variant="primary"
                  size="large"
                  onPress={handleLogin}
                  disabled={loading}
                  glassIntensity="strong"
                  style={styles.loginButton}
                />

              </View>
            </NeumorphCard>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text
                style={styles.signUpLink}
                onPress={() => navigation.navigate('Register')}
              >
                Sign Up
              </Text>
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  form: {
    padding: theme.spacing.xl,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  loginButton: {
    marginBottom: theme.spacing.lg,
  },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  signUpLink: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
});