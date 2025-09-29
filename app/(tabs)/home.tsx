import { View, StyleSheet, Text, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatTime } from '@/helpers/format-time';
import Button from '@/components/ui/button';

const App = () => {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const loadStartTime = async () => {
      const storedStartTime = await AsyncStorage.getItem('startTime');
      if (storedStartTime) {
        setStartTime(parseInt(storedStartTime, 10));
      }
    };
    loadStartTime();
  }, []);

  useEffect(() => {
    if (startTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime]);

  const handleStart = async () => {
    const now = Date.now();
    setStartTime(now);
    await AsyncStorage.setItem('startTime', now.toString());
  };

  const handleReset = async () => {
    setStartTime(null);
    setElapsedTime(0);
    await AsyncStorage.removeItem('startTime');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Time since last use:</Text>
      <Text style={styles.time}>{formatTime(elapsedTime)}</Text>
      <View style={styles.buttons}>
        {!startTime ? (
          <Button onPress={handleStart}>Start</Button>
        ) : (
          <Button onPress={handleReset}>Reset</Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  time: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  buttons: {
    flexDirection: 'row',
  },
});

export default App;
