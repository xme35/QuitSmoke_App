
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColors.tint,
        headerShown: true, // Show the header
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
