
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppState, useAppContext } from '../../context/AppContext';

const OPTIONS = ['Cigarette', 'Vape', 'Heated Tobacco', 'Nicotine Pouch'];

// Helper to map source name to AppState key
const getProductKey = (source: string): keyof AppState | null => {
  switch (source) {
    case 'Cigarette': return 'cigarettes';
    case 'Vape': return 'vapes';
    case 'Heated Tobacco': return 'heatedTobacco';
    case 'Nicotine Pouch': return 'nicotinePouches';
    default: return null;
  }
};

const SelectableCard = ({ label, isSelected, onPress }: { label: string; isSelected: boolean; onPress: () => void; }) => (
  <TouchableOpacity style={[styles.card, isSelected && styles.cardSelected]} onPress={onPress}>
    <ThemedText style={styles.cardText}>{label}</ThemedText>
    {isSelected && <Feather name="check" size={24} color={Colors.light.tint} />}
  </TouchableOpacity>
);

export default function SourceScreen() {
  const { appState, setAppState } = useAppContext();
  const [selectedSources, setSelectedSources] = useState<string[]>(appState.sources || []);

  const toggleSource = (source: string) => {
    const isSelected = selectedSources.includes(source);
    const newSources = isSelected
      ? selectedSources.filter((s) => s !== source)
      : [...selectedSources, source];

    setSelectedSources(newSources);

    // Update AppState with the new sources and initialize/clear product objects
    setAppState(prevState => {
      const newState = { ...prevState, sources: newSources };
      const productKey = getProductKey(source);

      if (!productKey) return newState; // Should not happen

      if (isSelected) {
        // Source was deselected, so clear its data
        (newState[productKey] as any) = null;
      } else {
        // Source was selected, so initialize with default structure
        switch (productKey) {
          case 'cigarettes':
            newState.cigarettes = { amount: 0, frequency: 'day' };
            break;
          case 'vapes':
            newState.vapes = { puffs: 0, frequency: 'day' };
            break;
          case 'heatedTobacco':
            newState.heatedTobacco = { sticks: 0, frequency: 'day' };
            break;
          case 'nicotinePouches':
            newState.nicotinePouches = { pouches: 0, frequency: 'day' };
            break;
        }
      }
      return newState;
    });
  };

  const handleNext = () => router.push('/(onboarding)/product-details');
  const isNextDisabled = selectedSources.length === 0;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.mainContent}>
        <ThemedText type="title" style={styles.title}>What are your sources of nicotine?</ThemedText>
        <ThemedText style={styles.subtitle}>Select all that apply.</ThemedText>
        <View style={styles.optionsContainer}>
          {OPTIONS.map((opt) => (
            <SelectableCard
              key={opt}
              label={opt}
              isSelected={selectedSources.includes(opt)}
              onPress={() => toggleSource(opt)}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemedText>Back</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, isNextDisabled && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={isNextDisabled}
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
    backgroundColor: Colors.light.background,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
    color: Colors.light.secondaryText,
  },
  optionsContainer: { gap: 12 },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
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
