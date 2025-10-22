
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useColorScheme } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: themeColors.tint,
        headerShown: true,
        tabBarShowLabel: false,
        tabBarStyle: {
          paddingTop: 10, // Adds space above the icons
        },
        tabBarIcon: ({ color }) => {
          let iconName;

          if (route.name === 'dashboard') {
            iconName = 'home';
          } else if (route.name === 'progress') {
            iconName = 'chart-bar';
          } else if (route.name === 'profile') {
            iconName = 'user-alt';
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
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
