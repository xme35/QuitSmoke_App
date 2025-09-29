import { StyleProp, Text, TextStyle } from 'react-native';
import { ComponentProps } from 'react';

const map = {
    'house.fill': '\u{1F3E0}',
    'chart.bar.fill': '\u{1F4CA}',
    'person.fill': '\u{1F464}',
  };

type IconProps = {
  name: keyof typeof map;
  color: string;
  size: number;
  style?: StyleProp<TextStyle>;
};

export const IconSymbol = ({ size, color, name, style }: IconProps) => {
  return <Text style={[{ fontSize: size, color }, style]}>{map[name]}</Text>;
};