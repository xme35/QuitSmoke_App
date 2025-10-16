
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
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
