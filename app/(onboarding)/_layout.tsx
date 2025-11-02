
import { useEffect, useState } from 'react';
import { Redirect, Stack } from 'expo-router';
import { getOnboardingStatus } from '@/helpers/onboarding-status';
import { useAppContext } from '@/context/AppContext';

export default function OnboardingLayout() {
  const { appState, user } = useAppContext();
  const [resolved, setResolved] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const ensureAccess = async () => {
      const isResolved =
        !!appState?.isOnboardingComplete ||
        (await getOnboardingStatus(user?.uid ?? null));

      if (!isMounted) {
        return;
      }

      setResolved(isResolved);
    };

    void ensureAccess();

    return () => {
      isMounted = false;
    };
  }, [appState?.isOnboardingComplete, user]);

  if (resolved === null) {
    return null;
  }

  if (resolved) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade', gestureEnabled: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="age" />
      <Stack.Screen name="country" />
      <Stack.Screen name="source" />
      <Stack.Screen name="product-details" />
      <Stack.Screen name="quitting-pace" />
      <Stack.Screen name="duration" />
      <Stack.Screen name="motivation" />
      <Stack.Screen name="summary" />
      <Stack.Screen name="creating-plan" />
      <Stack.Screen name="success" />
    </Stack>
  );
}
