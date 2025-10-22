
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import type { Href } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useAppContext } from '../context/AppContext';
import * as SplashScreen from 'expo-splash-screen';
import { getLoginStatus } from '@/helpers/login-status';
import { getOnboardingStatus } from '@/helpers/onboarding-status';

SplashScreen.preventAutoHideAsync();

const AUTH_ROUTE: Href = '/(auth)/sign-in';
const ONBOARDING_ROUTE: Href = '/(onboarding)/welcome';
const DASHBOARD_ROUTE: Href = '/(tabs)/dashboard';

const RootNavigator = () => {
  const { user, isLoading, appState } = useAppContext();
  const router = useRouter();
  const segments = useSegments();
  const [hasCheckedLoginStatus, setHasCheckedLoginStatus] = useState(false);
  const [hasCheckedOnboardingStatus, setHasCheckedOnboardingStatus] = useState(false);
  const [storedLoginStatus, setStoredLoginStatus] = useState(false);
  const [storedOnboardingStatus, setStoredOnboardingStatus] = useState(false);
  const [hasHiddenSplash, setHasHiddenSplash] = useState(false);
  const [navigationReady, setNavigationReady] = useState(false);
  const onboardingComplete = !!appState?.isOnboardingComplete;

  useEffect(() => {
    let isMounted = true;

    const loadLoginStatus = async () => {
      try {
        const status = await getLoginStatus();
        if (isMounted) {
          setStoredLoginStatus(status);
        }
      } catch (error) {
        console.warn('Unable to read persisted login status flag', error);
      } finally {
        if (isMounted) {
          setHasCheckedLoginStatus(true);
        }
      }
    };

    loadLoginStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      setStoredOnboardingStatus(false);
      setHasCheckedOnboardingStatus(true);
      return () => {
        isMounted = false;
      };
    }

    setHasCheckedOnboardingStatus(false);

    const loadOnboardingStatus = async () => {
      try {
        const status = await getOnboardingStatus(user.uid);
        if (isMounted) {
          setStoredOnboardingStatus(status);
        }
      } catch (error) {
        console.warn('Unable to read persisted onboarding status flag', error);
      } finally {
        if (isMounted) {
          setHasCheckedOnboardingStatus(true);
        }
      }
    };

    loadOnboardingStatus();

    return () => {
      isMounted = false;
    };
  }, [user, appState?.isOnboardingComplete]);

  useEffect(() => {
    if (isLoading || !hasCheckedLoginStatus || !hasCheckedOnboardingStatus) {
      return;
    }

    const onboardingResolved = onboardingComplete || storedOnboardingStatus;

    let targetGroup: string | null = null;
    let targetRoute: Href | null = null;

    if (user) {
      if (!onboardingResolved) {
        targetGroup = '(onboarding)';
        targetRoute = ONBOARDING_ROUTE;
      } else {
        targetGroup = '(tabs)';
        targetRoute = DASHBOARD_ROUTE;
      }
    } else if (!storedLoginStatus) {
      targetGroup = '(auth)';
      targetRoute = AUTH_ROUTE;
    }

    const currentGroup = segments[0];

    if (targetGroup && targetRoute && currentGroup !== targetGroup) {
      if (navigationReady) {
        setNavigationReady(false);
      }
      router.replace(targetRoute);
      return;
    }

    if (!navigationReady) {
      setNavigationReady(true);
    }
  }, [
    user,
    onboardingComplete,
    isLoading,
    segments,
    router,
    hasCheckedLoginStatus,
    storedLoginStatus,
    navigationReady,
    storedOnboardingStatus,
    hasCheckedOnboardingStatus,
  ]);

  useEffect(() => {
    if (isLoading && navigationReady) {
      setNavigationReady(false);
    }
  }, [isLoading, navigationReady]);

  useEffect(() => {
    if (navigationReady && !hasHiddenSplash) {
      const hideSplash = async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          console.warn('Unable to hide splash screen', error);
        } finally {
          setHasHiddenSplash(true);
        }
      };

      hideSplash();
    }
  }, [navigationReady, hasHiddenSplash]);

  if (
    isLoading ||
    !hasCheckedLoginStatus ||
    !hasCheckedOnboardingStatus ||
    !navigationReady
  ) {
    return null;
  }

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
