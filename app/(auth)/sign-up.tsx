import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';

import { HappyLungsIllustration } from '@/components/HappyLungsIllustration';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { auth } from '@/firebase/config';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { setLoginStatus } from '@/helpers/login-status';
import { setOnboardingStatus } from '@/helpers/onboarding-status';

const SignUp = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationality, setNationality] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];
  const inputBackground = colorScheme === 'light' ? '#FFFFFF' : '#1F1F1F';
  const inputBorder = colorScheme === 'light' ? '#E5E7EB' : '#374151';

  const handleSignUp = async () => {
    const trimmedEmail = email.trim();

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !nationality.trim() ||
      !trimmedEmail ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert('Missing information', 'Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match. Please try again.');
      return;
    }

    setErrorMessage('');

    try {
      const credentials = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      await setLoginStatus(true);
      await setOnboardingStatus(false, credentials.user.uid);
      // Navigation handled automatically by (auth)/_layout.tsx
    } catch (error: any) {
      if (error?.code === 'auth/email-already-in-use') {
        setErrorMessage('This email is already registered');
      } else {
        const message =
          typeof error?.message === 'string'
            ? error.message
            : 'Unable to create account. Please try again.';
        setErrorMessage(message);
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top']}>
      <ThemedView style={[styles.container, { backgroundColor: palette.background }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.header}>
          <HappyLungsIllustration size={160} style={styles.illustration} />
          <ThemedText type="title" style={styles.title}>
            Create Account
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: palette.secondaryText }]}>
            Join us to build your personalized plan for a healthier life.
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: palette.secondaryText }]}>
              First Name
            </ThemedText>
            <TextInput
              placeholder="Enter your first name"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              placeholderTextColor={palette.secondaryText}
              style={[
                styles.input,
                {
                  backgroundColor: inputBackground,
                  color: palette.text,
                  borderColor: inputBorder,
                },
              ]}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: palette.secondaryText }]}>
              Last Name
            </ThemedText>
            <TextInput
              placeholder="Enter your last name"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              placeholderTextColor={palette.secondaryText}
              style={[
                styles.input,
                {
                  backgroundColor: inputBackground,
                  color: palette.text,
                  borderColor: inputBorder,
                },
              ]}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: palette.secondaryText }]}>
              Nationality
            </ThemedText>
            <TextInput
              placeholder="Enter your nationality"
              value={nationality}
              onChangeText={setNationality}
              autoCapitalize="words"
              placeholderTextColor={palette.secondaryText}
              style={[
                styles.input,
                {
                  backgroundColor: inputBackground,
                  color: palette.text,
                  borderColor: inputBorder,
                },
              ]}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: palette.secondaryText }]}>Email</ThemedText>
            <TextInput
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholderTextColor={palette.secondaryText}
              style={[
                styles.input,
                {
                  backgroundColor: inputBackground,
                  color: palette.text,
                  borderColor: inputBorder,
                },
              ]}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: palette.secondaryText }]}>Password</ThemedText>
            <View
              style={[
                styles.passwordContainer,
                { backgroundColor: inputBackground, borderColor: inputBorder },
              ]}
            >
              <TextInput
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textContentType="newPassword"
                placeholderTextColor={palette.secondaryText}
                style={[styles.passwordInput, { color: palette.text }]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.iconButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={palette.secondaryText}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: palette.secondaryText }]}>
              Confirm Password
            </ThemedText>
            <View
              style={[
                styles.passwordContainer,
                { backgroundColor: inputBackground, borderColor: inputBorder },
              ]}
            >
              <TextInput
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                textContentType="password"
                placeholderTextColor={palette.secondaryText}
                style={[styles.passwordInput, { color: palette.text }]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                }
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                style={styles.iconButton}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={palette.secondaryText}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {errorMessage ? (
          <ThemedText style={[styles.errorText, { color: palette.error }]}>{errorMessage}</ThemedText>
        ) : null}

        <Pressable
          style={[styles.primaryButton, { backgroundColor: palette.tint }]}
          onPress={handleSignUp}
        >
          <ThemedText style={styles.primaryButtonText}>Sign Up</ThemedText>
        </Pressable>

        <Pressable style={styles.linkWrapper} onPress={() => router.push('/(auth)/sign-in')}>
          <Text style={[styles.linkText, { color: palette.secondaryText }]}>
            Already have an account?{' '}
            <Text style={[styles.linkHighlight, { color: palette.tint }]}>Log in</Text>
          </Text>
        </Pressable>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 64,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  illustration: {
    width: 160,
    maxWidth: '100%',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  form: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  iconButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginLeft: 8,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 28,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkWrapper: {
    alignItems: 'center',
    marginBottom: 36,
  },
  linkText: {
    fontSize: 14,
    textAlign: 'center',
  },
  linkHighlight: {
    fontWeight: '600',
  },
});

export default SignUp;
