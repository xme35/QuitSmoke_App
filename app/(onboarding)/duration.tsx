
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Platform } from 'react-native';
import { useAppContext } from '../../context/AppContext';
import { Ionicons } from '@expo/vector-icons';

const OPTIONS = ['Less than 1 year', '1 to 5 years', '5 to 10 years', 'More than 10 years'];

const SelectableCard = ({ label, isSelected, onPress }: { label: string; isSelected: boolean; onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.card, isSelected && styles.cardSelected]}
    onPress={onPress}
  >
    <ThemedText style={styles.cardText}>{label}</ThemedText>
  </TouchableOpacity>
);

export default function DurationScreen() {
  const { appState, setAppState } = useAppContext();
  const [duration, setDuration] = useState(appState.duration || '');

  const handleSelect = (selectedDuration: string) => {
    setDuration(selectedDuration);
    setAppState((prevState) => ({ ...prevState, duration: selectedDuration }));
  };

  const handleNext = () => {
    if (duration) {
      // @ts-ignore
      router.push('/(onboarding)/quitting-pace');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.mainContent}>
        <ThemedText type="title" style={styles.title}>How long have you been using nicotine?</ThemedText>
        <View style={styles.optionsContainer}>
          {OPTIONS.map((opt) => (
            <SelectableCard
              key={opt}
              label={opt}
              isSelected={duration === opt}
              onPress={() => handleSelect(opt)}
            />
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemedText>Back</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.nextButton, !duration && styles.nextButtonDisabled]} 
          onPress={handleNext} 
          disabled={!duration}
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
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 50,
  },
  title: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 44,
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  optionsContainer: {
    gap: 12,
  },
  card: {
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  cardSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: '#F0F9FF',
  },
  cardText: {
    fontSize: 16,
    fontWeight: '500',
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
    fontSize: 16,
  },
});
