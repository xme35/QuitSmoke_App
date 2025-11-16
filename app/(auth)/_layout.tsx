import { Stack, Redirect } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { useEffect, useState } from 'react';
import { getOnboardingStatus } from '@/helpers/onboarding-status';

export default function AuthLayout() {
  const { user, appState } = useAppContext();
  const [onboardingStatus, setOnboardingStatus] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (user) {
        const status = await getOnboardingStatus(user.uid);
        setOnboardingStatus(status);
      }
      setIsChecking(false);
    };
    checkStatus();
  }, [user]);

  // If still checking, show nothing
  if (isChecking) {
    return null;
  }

  const confirmationPending = !!appState?.planConfirmationPending;
  const onboardingComplete = !!appState?.isOnboardingComplete;
  const hasPlanData =
    Boolean(appState?.planGeneratedAt) ||
    Boolean(appState?.planStartDate) ||
    ((appState?.totalDuration ?? 0) > 0) ||
    (Array.isArray(appState?.taperingSchedule) && appState.taperingSchedule.length > 0);
  const planResolved = (onboardingComplete || hasPlanData) && !confirmationPending;
  const onboardingResolved = onboardingStatus || planResolved;

  // If user is authenticated, redirect to appropriate screen
  if (user) {
    if (!onboardingResolved) {
      return <Redirect href="/(onboarding)/welcome" />;
    }
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}