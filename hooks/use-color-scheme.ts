import { useColorScheme as useNativewindColorScheme } from 'nativewind';

// The useColorScheme hook can be used to override the default color scheme.
// You can also use it to get the current color scheme.

// To learn more about the useColorScheme hook, please visit https://www.nativewind.dev/core-concepts/color-schemes.

export function useColorScheme(): 'light' | 'dark' {
  const { colorScheme } = useNativewindColorScheme();
  return colorScheme as 'light' | 'dark';
}
