import { Tabs, useSegments, Redirect } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useColorScheme } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAppContext } from '@/context/AppContext';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const segments = useSegments();
  const { user } = useAppContext();
  
  // Check if we're on privacy or terms pages
  const currentRoute = segments[segments.length - 1];
  const isOnLegalPages = currentRoute === 'privacy' || currentRoute === 'terms';

  // If user is not authenticated, redirect to auth
  if (!user) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: themeColors.tint,
        headerShown: true,
        tabBarShowLabel: false,
        tabBarStyle: {
          paddingTop: 10, // Adds space above the icons
        },
        tabBarIcon: ({ color, focused }) => {
          let iconName;

          if (route.name === 'dashboard') {
            iconName = 'home';
          } else if (route.name === 'progress') {
            iconName = 'chart-bar';
          } else if (route.name === 'breathing') {
            iconName = 'spa';
          } else if (route.name === 'profile') {
            iconName = 'user-alt';
            // Highlight profile icon when on legal pages
            if (isOnLegalPages) {
              color = themeColors.tint;
            }
          }

          return <FontAwesome5 name={iconName} size={28} color={color} />;
        },
      })}
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
        name="breathing"
        options={{
          title: 'Breathing',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
      <Tabs.Screen
        name="activity-logs"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="privacy"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="terms"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
