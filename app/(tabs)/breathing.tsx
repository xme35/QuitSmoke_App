import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, useColorScheme, Dimensions } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type BreathPhase = 'idle' | 'inhale' | 'hold' | 'exhale';

interface PhaseConfig {
  name: string;
  duration: number;
  color: string;
  text: string;
}

const PHASE_CONFIGS: Record<Exclude<BreathPhase, 'idle'>, PhaseConfig> = {
  inhale: {
    name: 'Inhale',
    duration: 4,
    color: '#60A5FA', // Light Blue
    text: 'INHALE',
  },
  hold: {
    name: 'Hold',
    duration: 4,
    color: '#3B82F6', // Medium Blue
    text: 'HOLD',
  },
  exhale: {
    name: 'Exhale',
    duration: 4,
    color: '#2563EB', // Dark Blue
    text: 'EXHALE',
  },
};

const TOTAL_CYCLE_DURATION = 12; // 4s + 4s + 4s

export default function BreathingScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<BreathPhase>('idle');
  const [timeRemaining, setTimeRemaining] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseStartTimeRef = useRef<number>(0);

  // Get current phase configuration
  const getCurrentPhaseConfig = (): PhaseConfig | null => {
    if (currentPhase === 'idle') return null;
    return PHASE_CONFIGS[currentPhase];
  };

  const phaseConfig = getCurrentPhaseConfig();

  // Animation for circle expansion/contraction
  useEffect(() => {
    if (!isActive) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }).start();
      return;
    }

    if (currentPhase === 'inhale') {
      // Expand during inhale
      Animated.timing(scaleAnim, {
        toValue: 1.4,
        duration: 4000,
        useNativeDriver: true,
      }).start();
    } else if (currentPhase === 'hold') {
      // Stay expanded during hold
      Animated.timing(scaleAnim, {
        toValue: 1.4,
        duration: 0,
        useNativeDriver: true,
      }).start();
    } else if (currentPhase === 'exhale') {
      // Contract during exhale
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      }).start();
    }
  }, [currentPhase, isActive]);

  // Main breathing cycle logic
  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    phaseStartTimeRef.current = Date.now();

    const updateTimer = () => {
      const elapsed = (Date.now() - phaseStartTimeRef.current) / 1000;
      const currentPhaseDuration = phaseConfig?.duration ?? 4;
      const remaining = Math.max(0, Math.ceil(currentPhaseDuration - elapsed));
      
      setTimeRemaining(remaining);

      if (elapsed >= currentPhaseDuration) {
        // Move to next phase
        if (currentPhase === 'inhale') {
          setCurrentPhase('hold');
          phaseStartTimeRef.current = Date.now();
        } else if (currentPhase === 'hold') {
          setCurrentPhase('exhale');
          phaseStartTimeRef.current = Date.now();
        } else if (currentPhase === 'exhale') {
          // Complete cycle
          setCompletedCycles(prev => prev + 1);
          setCurrentPhase('inhale');
          phaseStartTimeRef.current = Date.now();
        }
      }
    };

    intervalRef.current = setInterval(updateTimer, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, currentPhase, phaseConfig]);

  const handleStart = () => {
    setIsActive(true);
    setCurrentPhase('inhale');
    setTimeRemaining(4);
    phaseStartTimeRef.current = Date.now();
  };

  const handleStop = () => {
    setIsActive(false);
    setCurrentPhase('idle');
    setTimeRemaining(4);
    setCompletedCycles(0);
  };

  const circleSize = Math.min(width * 0.6, 280);
  const backgroundColor = phaseConfig?.color ?? (colorScheme === 'dark' ? '#2A2A2A' : '#E5E7EB');

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Breathing Technique</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
          12-second cycle for relaxation
        </ThemedText>
      </View>

      {/* Breathing Circle */}
      <View style={styles.circleContainer}>
        <Animated.View
          style={[
            styles.circle,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
              backgroundColor: backgroundColor,
              opacity: isActive ? 0.9 : 0.3,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        />
        
        {/* Phase Text */}
        <View style={styles.centerContent}>
          {isActive ? (
            <ThemedText style={styles.phaseText}>
              {phaseConfig?.text ?? ''}
            </ThemedText>
          ) : (
            <>
              <FontAwesome5 name="spa" size={48} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
              <ThemedText style={[styles.readyText, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
                Ready to begin
              </ThemedText>
            </>
          )}
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controls}>
        {!isActive ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton, { backgroundColor: '#10B981' }]}
            onPress={handleStart}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="play" size={20} color="#FFFFFF" />
            <ThemedText style={styles.buttonText}>START</ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.stopButton, { backgroundColor: '#EF4444' }]}
            onPress={handleStop}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="stop" size={20} color="#FFFFFF" />
            <ThemedText style={styles.buttonText}>STOP</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {/* Cycle Counter */}
      {completedCycles > 0 && (
        <View style={[styles.cycleCounter, { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }]}>
          <FontAwesome5 name="check-circle" size={20} color="#10B981" />
          <ThemedText style={styles.cycleText}>
            {completedCycles} {completedCycles === 1 ? 'cycle completed' : 'cycles completed'}
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
    position: 'relative',
    height: 340,
  },
  circle: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseText: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 16,
  },
  timerText: {
    fontSize: 64,
    fontWeight: 'bold',
    lineHeight: 72,
  },
  timerLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  readyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  cycleCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 80,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cycleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  controls: {
    marginBottom: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  startButton: {},
  stopButton: {},
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});