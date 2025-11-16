import { useEffect, useRef, useState } from 'react';
import { Stack, useRootNavigationState } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useAppContext } from '../context/AppContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import * as SplashScreen from 'expo-splash-screen';
import { getLoginStatus, clearLoginStatus } from '@/helpers/login-status';
import { getOnboardingStatus, setOnboardingStatus, clearOnboardingStatus } from '@/helpers/onboarding-status';

SplashScreen.preventAutoHideAsync();

const RootNavigator = () => {
  const { user, isLoading, appState, isStateLoaded } = useAppContext();
  const { isAuthReady } = useAuth();
  const rootNavigationState = useRootNavigationState();
  const [hasCheckedLoginStatus, setHasCheckedLoginStatus] = useState(false);
  const [hasCheckedOnboardingStatus, setHasCheckedOnboardingStatus] = useState(false);
  const [storedLoginStatus, setStoredLoginStatus] = useState(false);
  const [storedOnboardingStatus, setStoredOnboardingStatus] = useState(false);
  const [hasHiddenSplash, setHasHiddenSplash] = useState(false);
  const prevOnboardingStatusRef = useRef<boolean | undefined>(undefined);
  const [navigationReady, setNavigationReady] = useState(false);
  const confirmationPending = !!appState?.planConfirmationPending;
  const onboardingComplete = !!appState?.isOnboardingComplete;
  const hasPlanData =
    Boolean(appState?.planGeneratedAt) ||
    Boolean(appState?.planStartDate) ||
    ((appState?.totalDuration ?? 0) > 0) ||
    (Array.isArray(appState?.taperingSchedule) && appState.taperingSchedule.length > 0);
  const planResolved = (onboardingComplete || hasPlanData) && !confirmationPending;

  useEffect(() => {
    let isMounted = true;

    setHasCheckedLoginStatus(false);

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
  }, [user]);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    let isMounted = true;

    setHasCheckedOnboardingStatus(false);

    const loadOnboardingStatus = async () => {
      try {
        const status = await getOnboardingStatus(user?.uid ?? null);
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
  }, [user, isAuthReady]);

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
  }, [user, planResolved, storedOnboardingStatus]);

  useEffect(() => {
    if (
      user ||
      !isAuthReady ||
      !isStateLoaded ||
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
    isAuthReady,
    isStateLoaded,
  ]);

  useEffect(() => {
    if (isLoading && navigationReady) {
      setNavigationReady(false);
    }
  }, [isLoading, navigationReady]);

  useEffect(() => {
    const shouldBeReady =
      !isLoading &&
      isAuthReady &&
      hasCheckedLoginStatus &&
      hasCheckedOnboardingStatus &&
      rootNavigationState?.key != null &&
      (!user || isStateLoaded);

    if (shouldBeReady && !navigationReady) {
      setNavigationReady(true);
    }
  }, [
    isLoading,
    isAuthReady,
    hasCheckedLoginStatus,
    hasCheckedOnboardingStatus,
    rootNavigationState,
    user,
    isStateLoaded,
    navigationReady,
  ]);

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

  if (!navigationReady) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="activity-logs" />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppProvider>
          <RootNavigator />
        </AppProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
