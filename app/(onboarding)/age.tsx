
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Platform, Animated } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAppContext } from '../../context/AppContext';

export default function AgeScreen() {
  const { appState, setAppState } = useAppContext();
  const [age, setAge] = useState(appState.age || 25);
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (appState.age === null) {
      setAppState((prevState) => ({ ...prevState, age: 25 }));
    }
  }, [appState.age, setAppState]);

  const handleAgeChange = (newAge: number) => {
    setAge(newAge);
    setAppState((prevState) => ({ ...prevState, age: newAge }));
  };

  const onSlideStart = () => {
    Animated.timing(scaleValue, {
      toValue: 1.2,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const onSlideComplete = () => {
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handleNext = () => {
    // @ts-ignore
    router.push('/(onboarding)/country');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.mainContent}>
        <View style={styles.sliderWrapper}>
          <ThemedText type="title" style={styles.title}>What is your age?</ThemedText>
          <Animated.View style={[styles.ageDisplayContainer, { transform: [{ scale: scaleValue }] }]}>
            <ThemedText style={[styles.ageText, { color: Colors.light.tint }]}>
              {age}
            </ThemedText>
          </Animated.View>
          <View style={styles.sliderTrack}>
            <Slider
              style={styles.slider}
              minimumValue={18}
              maximumValue={100}
              step={1}
              value={age}
              onValueChange={handleAgeChange}
              onSlidingStart={onSlideStart}
              onSlidingComplete={onSlideComplete}
              minimumTrackTintColor={Colors.light.tint}
              maximumTrackTintColor="transparent"
              thumbTintColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemedText>Back</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <ThemedText style={styles.nextButtonText}>Next</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    backgroundColor: Colors.light.background,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 50,
    gap: 24,
  },
  sliderWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 48, // aumentado de 32
  },
  ageDisplayContainer: {
    minWidth: 120,
    minHeight: 80, // adicione altura mínima
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48, // aumentado de 32
    paddingVertical: 10, // adicione padding vertical
    backgroundColor: 'transparent',
  },
  ageText: {
    fontSize: 64, // aumentado de 50
    fontWeight: 'bold',
    lineHeight: 72, // adicione lineHeight explícito
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  sliderTrack: {
    width: '80%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    marginTop: 8, // espaço extra acima do slider
  },
  slider: {
    width: '100%',
    height: 40,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
  },
  backButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  nextButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
