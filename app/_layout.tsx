
import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import type { Href } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useAppContext } from '../context/AppContext';
import * as SplashScreen from 'expo-splash-screen';
import { getLoginStatus, clearLoginStatus } from '@/helpers/login-status';
import { getOnboardingStatus, setOnboardingStatus, clearOnboardingStatus } from '@/helpers/onboarding-status';

SplashScreen.preventAutoHideAsync();

const AUTH_ROUTE: Href = '/(auth)/sign-in';
const ONBOARDING_ROUTE: Href = '/(onboarding)/welcome';
const DASHBOARD_ROUTE: Href = '/(tabs)/dashboard';

const RootNavigator = () => {
  const { user, isLoading, appState } = useAppContext();
  const router = useRouter();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();
  const [hasCheckedLoginStatus, setHasCheckedLoginStatus] = useState(false);
  const [hasCheckedOnboardingStatus, setHasCheckedOnboardingStatus] = useState(false);
  const [storedLoginStatus, setStoredLoginStatus] = useState(false);
  const [storedOnboardingStatus, setStoredOnboardingStatus] = useState(false);
  const [hasHiddenSplash, setHasHiddenSplash] = useState(false);
  const prevOnboardingStatusRef = useRef<boolean | undefined>(undefined);
  const [navigationReady, setNavigationReady] = useState(false);
  const onboardingComplete = !!appState?.isOnboardingComplete;
  const hasPlanData =
    Boolean(appState?.planGeneratedAt) ||
    Boolean(appState?.planStartDate) ||
    ((appState?.totalDuration ?? 0) > 0) ||
    (Array.isArray(appState?.taperingSchedule) && appState.taperingSchedule.length > 0);

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

    setHasCheckedOnboardingStatus(false);

    const loadOnboardingStatus = async () => {
      console.log('[Onboarding] Loading status for uid', user?.uid ?? 'anonymous');
      try {
        const status = await getOnboardingStatus(user?.uid ?? null);
        console.log('[Onboarding] Storage returned', status);
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
  }, [user]);

  useEffect(() => {
    const currentStatus = appState?.isOnboardingComplete;

    if (prevOnboardingStatusRef.current === undefined) {
      prevOnboardingStatusRef.current = currentStatus;
      return;
    }

    if (currentStatus !== prevOnboardingStatusRef.current) {
      prevOnboardingStatusRef.current = currentStatus;
      if (typeof currentStatus === 'boolean') {
        setStoredOnboardingStatus(currentStatus);
        setHasCheckedOnboardingStatus(true);
      }
    }
  }, [appState?.isOnboardingComplete]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const planResolved = onboardingComplete || hasPlanData;
    if (!planResolved || storedOnboardingStatus) {
      return;
    }

    let isMounted = true;

    const persistStatus = async () => {
      try {
        await setOnboardingStatus(true, user.uid);
        if (isMounted) {
          setStoredOnboardingStatus(true);
          setHasCheckedOnboardingStatus(true);
        }
      } catch (error) {
        console.warn('Unable to persist onboarding completion automatically', error);
      }
    };

    void persistStatus();

    return () => {
      isMounted = false;
    };
  }, [user, onboardingComplete, hasPlanData, storedOnboardingStatus]);

  useEffect(() => {
    if (
      isLoading ||
      !hasCheckedLoginStatus ||
      !hasCheckedOnboardingStatus ||
      !rootNavigationState
    ) {
      return;
    }

    console.log('[Onboarding] current segments', segments);

    const onboardingResolved = storedOnboardingStatus || onboardingComplete || hasPlanData;
    console.log('[Onboarding] routing evaluation', {
      hasUser: Boolean(user),
      storedOnboardingStatus,
      onboardingComplete,
      hasPlanData,
      onboardingResolved,
      storedLoginStatus,
      navigationReady,
    });

    let targetGroup: string | null = null;
    let targetRoute: Href | null = null;

    if (user) {
      if (!onboardingResolved) {
        console.log('[Onboarding] Redirecting authenticated user to onboarding flow');
        targetGroup = '(onboarding)';
        targetRoute = ONBOARDING_ROUTE;
      } else {
        console.log('[Onboarding] Redirecting authenticated user to tabs flow');
        targetGroup = '(tabs)';
        targetRoute = DASHBOARD_ROUTE;
      }
    } else if (!storedLoginStatus) {
      console.log('[Onboarding] No stored login status, sending to auth');
      targetGroup = '(auth)';
      targetRoute = AUTH_ROUTE;
    } else if (!onboardingResolved) {
      console.log('[Onboarding] Logged out but onboarding incomplete, sending to onboarding');
      targetGroup = '(onboarding)';
      targetRoute = ONBOARDING_ROUTE;
    } else {
      console.log('[Onboarding] Logged out with stored flag but no session, sending to auth');
      targetGroup = '(auth)';
      targetRoute = AUTH_ROUTE;
    }

    const currentGroup = segments[0];

    const navigationMounted = rootNavigationState?.key != null;

    const hasTargetRoute =
      targetGroup != null &&
      rootNavigationState?.routes?.some(route => route.name === targetGroup);

    if (targetGroup && targetRoute && currentGroup !== targetGroup) {
      if (!navigationMounted) {
        return;
      }
      if (!hasTargetRoute) {
        console.log('[Onboarding] Target group not yet registered in navigation state', {
          targetGroup,
          routes: rootNavigationState?.routes?.map(route => route.name),
        });
        return;
      }
      if (navigationReady) {
        setNavigationReady(false);
      }
      console.log('[Onboarding] Executing router.replace to', targetRoute);
      router.replace(targetRoute);
      return;
    }

    if (navigationMounted && !navigationReady) {
      setNavigationReady(true);
    }
  }, [
    user,
    onboardingComplete,
    hasPlanData,
    isLoading,
    segments,
    router,
    hasCheckedLoginStatus,
    storedLoginStatus,
    navigationReady,
    storedOnboardingStatus,
    hasCheckedOnboardingStatus,
    rootNavigationState,
  ]);

  useEffect(() => {
    if (
      user ||
      !hasCheckedLoginStatus ||
      !hasCheckedOnboardingStatus ||
      (!storedLoginStatus && !storedOnboardingStatus)
    ) {
      return;
    }

    let isMounted = true;

    const resetPersistedFlags = async () => {
      try {
        await clearLoginStatus();
        await clearOnboardingStatus();
      } catch (error) {
        console.warn('Unable to clear persisted auth status flags', error);
      } finally {
        if (isMounted) {
          setStoredLoginStatus(false);
          setStoredOnboardingStatus(false);
        }
      }
    };

    void resetPersistedFlags();

    return () => {
      isMounted = false;
    };
  }, [
    user,
    hasCheckedLoginStatus,
    hasCheckedOnboardingStatus,
    storedLoginStatus,
    storedOnboardingStatus,
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
    !hasCheckedOnboardingStatus
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
