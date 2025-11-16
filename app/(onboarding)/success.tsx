import { useMemo } from 'react';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { useAppContext } from '../../context/AppContext';
import { useRouter } from 'expo-router';
import { setOnboardingStatus } from '@/helpers/onboarding-status';
import { Colors } from '../../constants/theme';
import { calculateLifeTimeGained, formatLifeTimeGained } from '../../helpers/calculate-lifetime-gained';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const formatDate = (iso?: string | null) => {
  if (!iso) return 'Today';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Today';
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

export default function SuccessScreen() {
  const { appState, setAppState, user } = useAppContext();
  const router = useRouter();

  const {
    age,
    smokingHistory,
    initialIntake,
    quitDate,
    totalDuration,
    estimatedSavings,
    currencySymbol,
    planCurrency,
  } = appState;

  const planSummary = useMemo(() => {
    const currencyPrefix = currencySymbol ?? (planCurrency ? `${planCurrency} ` : '');
    const savingsValue =
      typeof estimatedSavings === 'number' && Number.isFinite(estimatedSavings) ? Math.max(0, estimatedSavings) : 0;

    const quitDateLabel = quitDate ? formatDate(quitDate) : 'On completion of plan';

    // Calculate life time gained
    // Ensure all values are properly converted to numbers
    const smokingYears = typeof smokingHistory === 'string'
      ? parseInt(smokingHistory, 10)
      : (typeof smokingHistory === 'number' ? smokingHistory : null);
    
    const ageValue = typeof age === 'number' ? age : null;
    const intakeValue = typeof initialIntake === 'number' ? initialIntake : null;
    
    const lifeTimeYears = calculateLifeTimeGained(ageValue, smokingYears, intakeValue);
    const lifeTimeDisplay = formatLifeTimeGained(lifeTimeYears);

    return {
      savingsDisplay: savingsValue > 0 ? `${currencyPrefix}${savingsValue.toLocaleString()}` : 'N/A',
      quitDateLabel,
      lifeTimeDisplay,
    };
  }, [
    age,
    smokingHistory,
    initialIntake,
    estimatedSavings,
    currencySymbol,
    planCurrency,
    quitDate,
  ]);

  const handleFinish = async () => {
    try {
      await setOnboardingStatus(true, user?.uid);
      setAppState(prev => ({
        ...prev,
        isOnboardingComplete: true,
        planConfirmationPending: false,
      }));

      if (user) {
        const docRef = doc(db, 'users', user.uid);
        await setDoc(
          docRef,
          {
            isOnboardingComplete: true,
            planConfirmationPending: false,
          },
          { merge: true },
        );
      }

      // Navigation handled automatically by (auth)/_layout.tsx which detects isOnboardingComplete
    } catch (error) {
      console.error('Failed to complete onboarding confirmation', error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header */}
        <View style={styles.headerSection}>
          <View style={styles.successIcon}>
            <ThemedText style={styles.successEmoji}>🎉</ThemedText>
          </View>
          <ThemedText type="title" style={styles.title}>
            Congratulations!
          </ThemedText>
          <ThemedText type="title" style={styles.subtitle}>
            Your Plan is Ready
          </ThemedText>
          <ThemedText style={styles.description}>
            {`You\u2019re about to start a life-changing journey to become nicotine-free`}
          </ThemedText>
        </View>

        {/* Key Metrics Card */}
        <View style={styles.metricsCard}>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <ThemedText style={styles.metricLabel}>Total Duration</ThemedText>
              <ThemedText style={styles.metricValue}>
                {totalDuration ?? 0} {totalDuration === 1 ? 'day' : 'days'}
              </ThemedText>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <ThemedText style={styles.metricLabel}>Target Quit Date</ThemedText>
              <ThemedText style={styles.metricValue}>{planSummary.quitDateLabel}</ThemedText>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.highlightSection}>
            <View style={styles.highlightItem}>
              <ThemedText style={styles.highlightLabel}>💰 Savings</ThemedText>
              <ThemedText style={styles.highlightValue}>{planSummary.savingsDisplay}</ThemedText>
              <ThemedText style={styles.highlightNote}>by completing this plan</ThemedText>
            </View>

            <View style={styles.divider} />

            <View style={styles.highlightItem}>
              <ThemedText style={styles.highlightLabel}>⏳ Life Time Gained</ThemedText>
              <ThemedText style={styles.highlightValue}>{planSummary.lifeTimeDisplay}</ThemedText>
              <ThemedText style={styles.highlightNote}>by completing this plan</ThemedText>
            </View>
          </View>
        </View>

        {/* Fixed Bottom Button - Moved inside ScrollView */}
        <View style={styles.buttonContainerInline}>
          <TouchableOpacity style={styles.button} onPress={handleFinish}>
            <ThemedText style={styles.buttonText}>Start My Journey</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: Colors.light.tint,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: Colors.light.secondaryText,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  metricLabel: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  highlightSection: {
    gap: 0,
  },
  highlightItem: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  highlightLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  highlightValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.light.tint,
    textAlign: 'center',
  },
  highlightNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainerInline: {
    marginTop: 24,
  },
  button: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
