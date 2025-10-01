
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="age" />
      <Stack.Screen name="country" />
      <Stack.Screen name="gender" />
      <Stack.Screen name="cigarettes-per-day" />
      <Stack.Screen name="quit-date" />
      <Stack.Screen name="motivation" />
      <Stack.Screen name="evolution" />
    </Stack>
  );
}
