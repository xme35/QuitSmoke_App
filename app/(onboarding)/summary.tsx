
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { router } from 'expo-router';
import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { useAppContext } from '../../context/AppContext';

// Reusable component to display each piece of information
const InfoRow = ({ label, value }: { label: string, value: string | number | string[] | null | undefined }) => {
  if (value === null || value === undefined) return null;
  
  const displayValue = Array.isArray(value) ? value.join(', ') : value;

  return (
    <View style={styles.infoRow}>
      <ThemedText style={styles.infoLabel}>{label}</ThemedText>
      <ThemedText style={styles.infoValue}>{String(displayValue)}</ThemedText>
    </View>
  );
};

export default function SummaryScreen() {
  const { appState } = useAppContext();

  const handleCreatePlan = () => {
    router.replace('/(onboarding)/creating-plan');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.mainContent}>
        <ThemedText type="title" style={styles.title}>
          Ready to create your plan?
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Review your information before we generate your personalized plan.
        </ThemedText>

        <View style={styles.summaryContainer}>
          <InfoRow label="Name" value={appState.name} />
          <InfoRow label="Age" value={appState.age} />
          {/* Correctly use countryName as the value */}
          <InfoRow label="Country" value={appState.countryName} />

          {appState.sources?.includes('Cigarettes') && appState.cigarettes && <InfoRow label="Cigarettes" value={`${appState.cigarettes.amount}/day (${appState.cigarettes.type})`} />}
          {appState.sources?.includes('Vapes') && appState.vapes && <InfoRow label="Vapes" value={`~${appState.vapes.puffs} puffs/day (${appState.vapes.strength})`} />}
          {appState.sources?.includes('Heated Tobacco') && appState.heatedTobacco && <InfoRow label="Heated Tobacco" value={`${appState.heatedTobacco.sticks} sticks/day`} />}
          {appState.sources?.includes('Nicotine Pouches') && appState.nicotinePouches && <InfoRow label="Nicotine Pouches" value={`${appState.nicotinePouches.pouches}/day (${appState.nicotinePouches.strength})`} />}

          <InfoRow label="Quitting Pace" value={appState.quittingPace} />
          <InfoRow label="Duration" value={appState.duration} />
          <InfoRow label="Motivation" value={appState.motivation} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ThemedText>Back</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleCreatePlan}>
          <ThemedText style={styles.nextButtonText}>Create Plan</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  mainContent: {
    paddingBottom: 120, // To avoid being hidden by the footer
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  summaryContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    maxWidth: '60%',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF', // To ensure it has a solid background
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
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
