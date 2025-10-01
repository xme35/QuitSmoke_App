
import { useEffect, useState } from 'react';
import { Asset } from 'expo-asset';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Preload images
const images = [require('../assets/images/evolution.png')];

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const preloadAssets = async () => {
      const cacheImages = images.map(image => Asset.fromModule(image).downloadAsync());
      await Promise.all(cacheImages);
    };

    const checkOnboardingStatus = async () => {
      try {
        const onboardingStatus = await AsyncStorage.getItem('hasCompletedOnboarding');
        setHasCompletedOnboarding(onboardingStatus === 'true');
      } catch (error) {
        console.error('Failed to get onboarding status', error);
        setHasCompletedOnboarding(false);
      } finally {
        setLoading(false);
      }
    };

    preloadAssets();
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    if (loading || hasCompletedOnboarding === null) return;

    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (hasCompletedOnboarding && inOnboardingGroup) {
      router.replace('/');
    } else if (!hasCompletedOnboarding && !inOnboardingGroup) {
      router.replace('/welcome');
    }

    // Hide the splash screen now that we are ready
    SplashScreen.hideAsync();
  }, [loading, hasCompletedOnboarding, segments, router]);

  if (loading || hasCompletedOnboarding === null) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(main)" />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );
}
