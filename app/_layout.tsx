
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useAppContext } from '../context/AppContext';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const RootNavigator = () => {
  const { user, isLoading, appState } = useAppContext();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    try {
      const inAuthGroup = segments[0] === '(auth)';
      const inOnboardingGroup = segments[0] === '(onboarding)';
      const inAppGroup = segments[0] === '(tabs)';

      // This is the crucial change:
      // Redirect to onboarding only if the user is logged in, hasn't started the plan,
      // AND is not already in the onboarding flow.
      if (user && (!appState || !appState.planStartDate) && !inOnboardingGroup) {
        router.replace('/(onboarding)/welcome');
      } else if (user && appState?.planStartDate && !inAppGroup) {
        router.replace('/(tabs)/dashboard');
      } else if (!user && !inAuthGroup) {
        router.replace('/(auth)/sign-in');
      }

      SplashScreen.hideAsync();

    } catch (error) {
      console.error('!!! CRITICAL NAVIGATION ERROR:', error);
    }

  }, [user, appState, isLoading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="terms" />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}
