
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Platform } from 'react-native';
import { useAppContext } from '../../context/AppContext';

const OPTIONS = [
    { title: 'Slow', description: 'A more gradual and relaxed reduction' },
    { title: 'Standard', description: 'A balanced reduction' },
    { title: 'Fast', description: 'A faster and more intensive reduction' },
];

const SelectableCard = ({ title, description, isSelected, onPress }: { title: string; description: string; isSelected: boolean; onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.card, isSelected && styles.cardSelected]}
    onPress={onPress}
  >
    <ThemedText style={styles.cardTitle}>{title}</ThemedText>
    <ThemedText style={styles.cardDescription}>{description}</ThemedText>
  </TouchableOpacity>
);

export default function QuittingPaceScreen() {
  const { appState, setAppState } = useAppContext();
  const [pace, setPace] = useState(appState.quittingPace || '');

  const handleSelect = (selectedPace: string) => {
    setPace(selectedPace);
    setAppState((prevState) => ({ ...prevState, quittingPace: selectedPace }));
  };

  const handleNext = () => {
    if (pace) {
      // @ts-ignore
      router.push('/(onboarding)/motivation');
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.mainContent}>
        <ThemedText type="title" style={styles.title}>What quitting pace{'\n'} suits you?</ThemedText>
        <ThemedText style={styles.subtitle}>We'll create a personalized plan{'\n'} based on your choice.</ThemedText>
        <View style={styles.optionsContainer}>
          {OPTIONS.map((opt) => (
            <SelectableCard
              key={opt.title}
              title={opt.title}
              description={opt.description}
              isSelected={pace === opt.title}
              onPress={() => handleSelect(opt.title)}
            />
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ThemedText>Back</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.nextButton, !pace && styles.nextButtonDisabled]} 
          onPress={handleNext} 
          disabled={!pace}
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
    paddingBottom: 50,
    gap: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 44,
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    color: Colors.light.secondaryText,
    marginBottom: 16,
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
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
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
    alignItems: 'center',
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
