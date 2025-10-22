import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';

import { HappyLungsIllustration } from '@/components/HappyLungsIllustration';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { auth } from '@/firebase/config';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { setLoginStatus } from '@/helpers/login-status';
import { getOnboardingStatus } from '@/helpers/onboarding-status';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];
  const inputBackground = colorScheme === 'light' ? '#FFFFFF' : '#1F1F1F';
  const inputBorder = colorScheme === 'light' ? '#E5E7EB' : '#374151';

  const handleSignIn = async () => {
    setErrorMessage('');
    try {
      const credentials = await signInWithEmailAndPassword(auth, email.trim(), password);
      await setLoginStatus(true);
      const onboardingComplete = await getOnboardingStatus(credentials.user.uid);
      const nextRoute = onboardingComplete ? '/(tabs)/dashboard' : '/(onboarding)/welcome';
      router.replace(nextRoute);
    } catch (error: any) {
      if (
        error?.code === 'auth/invalid-credential' ||
        error?.code === 'auth/user-not-found' ||
        error?.code === 'auth/wrong-password'
      ) {
        setErrorMessage('Email or password incorrect');
      } else {
        const message =
          typeof error?.message === 'string'
            ? error.message
            : 'Unable to sign in. Please try again.';
        setErrorMessage(message);
      }
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        scrollIndicatorInsets={{ right: -12 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <HappyLungsIllustration size={160} style={styles.illustration} />
          <ThemedText type="title" style={styles.title}>
            Login
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: palette.secondaryText }]}>
            Welcome! Sign in to start your journey.
          </ThemedText>
        </View>

        <View style={styles.form}>
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
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textContentType="password"
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
        </View>

        {errorMessage ? (
          <ThemedText style={[styles.errorText, { color: palette.error }]}>{errorMessage}</ThemedText>
        ) : null}

        <Pressable
          style={[styles.primaryButton, { backgroundColor: palette.tint }]}
          onPress={handleSignIn}
        >
          <ThemedText style={styles.primaryButtonText}>Login</ThemedText>
        </Pressable>

        <Pressable style={styles.linkWrapper} onPress={() => router.push('/(auth)/sign-up')}>
          <Text style={[styles.linkText, { color: palette.secondaryText }]}>
            Don’t have an account?{' '}
            <Text style={[styles.linkHighlight, { color: palette.tint }]}>Sign up</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  scrollView: {
    marginRight: -16,
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
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  linkWrapper: {
    alignItems: 'center',
    marginBottom: 48,
  },
  linkText: {
    fontSize: 14,
    textAlign: 'center',
  },
  linkHighlight: {
    fontWeight: '600',
  },
});

export default SignIn;
