
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { router } from 'expo-router';
import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { useAppContext } from '../../context/AppContext';

const VAPE_PUFFS_PER_DEVICE = 400;

const formatVapeCount = (puffCount: number) => {
  const vapes = Math.round(puffCount / VAPE_PUFFS_PER_DEVICE);
  return vapes.toString();
};

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
          Ready to create{'\n'} your plan?
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Review your information before we generate your personalized plan.
        </ThemedText>

        <View style={styles.summaryContainer}>
          <InfoRow label="Age" value={appState.age} />
          <InfoRow label="Country" value={appState.countryName} />

          <View>
            <ThemedText style={[styles.infoLabel, {marginBottom: 8}]}>Sources</ThemedText>
            <View style={{ gap: 8, paddingLeft: 8 }}>
                {appState.sources?.includes('Cigarette') && appState.cigarettes && 
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>• Cigarette</ThemedText>
                    <ThemedText style={styles.infoValue}>{`${appState.cigarettes.amount} cigs/${appState.cigarettes.frequency}`}</ThemedText>
                  </View>
                }
                {appState.sources?.includes('Vape') && appState.vapes &&
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>• Vape</ThemedText>
                    <ThemedText style={styles.infoValue}>{`${formatVapeCount(appState.vapes.puffs)} vapes/${appState.vapes.frequency}`}</ThemedText>
                  </View>
                }
                {appState.sources?.includes('Heated Tobacco') && appState.heatedTobacco &&
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>• Heated Tobacco</ThemedText>
                    <ThemedText style={styles.infoValue}>{`${appState.heatedTobacco.sticks} sticks/day`}</ThemedText>
                  </View>
                }
                {appState.sources?.includes('Nicotine Pouch') && appState.nicotinePouches &&
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>• Nicotine Pouch</ThemedText>
                    <ThemedText style={styles.infoValue}>{`${appState.nicotinePouches.pouches} pouches/${appState.nicotinePouches.frequency}`}</ThemedText>
                  </View>
                }
            </View>
          </View>
          
          <InfoRow label="Nicotine Use" value={appState.smokingHistory} />
          <InfoRow label="Quitting Pace" value={appState.quittingPace} />
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
    backgroundColor: Colors.light.background,
    justifyContent: 'space-between',
  },
  scrollView: {
    flex: 1,
  },
  mainContent: {
    paddingBottom: 48,
    gap: 20,
  },
  title: {
    textAlign: 'center',
    marginTop: 80,
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 16,
    paddingHorizontal: 24,
    color: Colors.light.secondaryText,
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
    color: Colors.light.secondaryText,
  },
  infoValue: {
    fontSize: 16,
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
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
