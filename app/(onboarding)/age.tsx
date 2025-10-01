
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAppContext } from '../../context/AppContext';

export default function AgeScreen() {
  const { appState, setAppState } = useAppContext();
  const [age, setAge] = useState(appState.age || 25);

  const handleAgeChange = (newAge: number) => {
    setAge(newAge);
    setAppState((prevState) => ({ ...prevState, age: newAge }));
  };

  const handleNext = () => {
    // @ts-ignore
    router.push('/(onboarding)/country');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.mainContent}>
        <ThemedText type="title" style={styles.title}>What's your age?</ThemedText>
        <View style={styles.ageDisplayContainer}>
            <ThemedText style={[styles.ageText, { color: Colors.light.tint }]}>{age}</ThemedText>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={18}
          maximumValue={100}
          step={1}
          value={age}
          onValueChange={handleAgeChange}
          minimumTrackTintColor={Colors.light.tint}
          maximumTrackTintColor="#d3d3d3"
          thumbTintColor={Colors.light.tint}
        />
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
    backgroundColor: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 50,
  },
  title: {
    textAlign: 'center',
    marginBottom: 48,
  },
  ageDisplayContainer: {
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  ageText: {
    fontSize: 60,
    fontWeight: 'bold',
    lineHeight: 70, // Give the text more vertical space
    ...Platform.select({
      android: {
        includeFontPadding: false, // Remove extra padding on Android
      },
    }),
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
    marginBottom: 20,
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
  nextButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
