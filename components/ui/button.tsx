import { Pressable, Text, StyleSheet } from 'react-native';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onPress?: () => void;
}

const Button = ({ children, onPress }: ButtonProps) => {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{children}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Button;
