
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useStopwatch = () => {
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

  return { startTime, elapsedTime, handleStart, handleReset };
};
