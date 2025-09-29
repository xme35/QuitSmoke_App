import { Pressable, type PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';

export const HapticTab = (props: PressableProps) => {
  return <Pressable onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} {...props} />;
};
