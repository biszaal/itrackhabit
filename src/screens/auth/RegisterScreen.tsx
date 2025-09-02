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
import { RegisterData } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
  NeumorphCard,
  NeumorphInput,
  NeumorphButton,
} from '../../components/neumorphism';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<RegisterData>>({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    if (!acceptedTerms) {
      Alert.alert('Terms Required', 'Please accept the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);
    try {
      await register(formData.email, formData.password, formData.name);
      Alert.alert(
        'Registration Successful! 🎉',
        `Welcome ${formData.name}! Your account has been created and you're now logged in.`,
        [{ text: 'OK', onPress: () => {/* Navigation will be handled by auth context */} }]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      Alert.alert(
        'Registration Status',
        errorMessage.includes('requiresEmailConfirmation') || errorMessage.includes('confirmation') 
          ? `Account created! Please check ${formData.email} for a confirmation email.`
          : errorMessage,
        [{ 
          text: 'OK', 
          onPress: () => {
            if (errorMessage.includes('requiresEmailConfirmation') || errorMessage.includes('confirmation')) {
              navigation.navigate('Login');
            }
          }
        }]
      );
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof RegisterData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join thousands building better habits</Text>
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
                    placeholder="Full Name"
                    value={formData.name}
                    onChangeText={(text) => updateField('name', text)}
                    autoCapitalize="words"
                    autoComplete="name"
                    glassIntensity="light"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <NeumorphInput
                    placeholder="Email"
                    value={formData.email}
                    onChangeText={(text) => updateField('email', text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    glassIntensity="light"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <NeumorphInput
                    placeholder="Password"
                    value={formData.password}
                    onChangeText={(text) => updateField('password', text)}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    glassIntensity="light"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <NeumorphInput
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChangeText={(text) => updateField('confirmPassword', text)}
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="new-password"
                    glassIntensity="light"
                  />
                </View>

                <NeumorphButton
                  title={acceptedTerms ? '✓ Terms Accepted' : 'Accept Terms & Privacy Policy'}
                  variant={acceptedTerms ? 'primary' : 'secondary'}
                  size="medium"
                  onPress={() => setAcceptedTerms(!acceptedTerms)}
                  glassIntensity="light"
                  style={styles.termsButton}
                />

                <NeumorphButton
                  title={loading ? undefined : "Create Account"}
                  variant="primary"
                  size="large"
                  onPress={handleRegister}
                  disabled={loading}
                  glassIntensity="strong"
                  style={styles.registerButton}
                />

              </View>
            </NeumorphCard>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text
                style={styles.signInLink}
                onPress={() => navigation.navigate('Login')}
              >
                Sign In
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
  termsButton: {
    marginBottom: theme.spacing.lg,
  },
  registerButton: {
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
  signInLink: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
});