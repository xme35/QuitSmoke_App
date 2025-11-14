
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../../context/AppContext';

const MOTIVATION_OPTIONS = [
  'Health Issues',
  'Money',
  'Family',
  'Pregnancy',
  'Other',
];

export default function MotivationScreen() {
  const { appState, setAppState } = useAppContext();
  const [selectedMotivations, setSelectedMotivations] = useState<string[]>(appState.motivation || []);

  useEffect(() => {
    setAppState((prevState) => ({ ...prevState, motivation: selectedMotivations }));
  }, [selectedMotivations, setAppState]);

  const handleSelectMotivation = (motivation: string) => {
    setSelectedMotivations((prevSelected) => {
      if (prevSelected.includes(motivation)) {
        return prevSelected.filter((item) => item !== motivation);
      } else {
        return [...prevSelected, motivation];
      }
    });
  };

  const handleNext = () => {
    if (selectedMotivations.length > 0) {
      // @ts-ignore
      router.push('/(onboarding)/summary');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const isNextButtonDisabled = selectedMotivations.length === 0;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.mainContent}>
        <ThemedText type="title" style={styles.title}>
          {`What\u2019s your main reason for quitting?`}
        </ThemedText>
        <ThemedText style={styles.subtitle}>Select all that apply.</ThemedText>

        <View style={styles.optionsContainer}>
          {MOTIVATION_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.card,
                selectedMotivations.includes(option) && styles.cardSelected,
              ]}
              onPress={() => handleSelectMotivation(option)}
            >
              <ThemedText style={styles.cardTitle}>
                {option}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ThemedText>Back</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.nextButton,
            isNextButtonDisabled && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={isNextButtonDisabled}
        >
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
    backgroundColor: Colors.light.background,
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 50,
    gap: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 28,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
    color: Colors.light.secondaryText,
  },
  optionsContainer: {
    gap: 12,
  },
  card: {
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  cardSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: '#F0F9FF',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
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
  nextButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
