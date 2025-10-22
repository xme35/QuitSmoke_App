import { useMemo } from 'react';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { useAppContext, TaperingPhase } from '../../context/AppContext';
import { useRouter } from 'expo-router';
import { setOnboardingStatus } from '@/helpers/onboarding-status';
import { Colors } from '../../constants/theme';

type PhaseSummary = {
  id: number;
  title: string;
  role: string;
  durationLabel: string;
  startLabel: string;
  endLabel: string;
  reductionLabel: string;
  notes: string | null;
};

const normalizeTargets = (phase: TaperingPhase): number[] => {
  if (Array.isArray(phase.dailyTargetsMg) && phase.dailyTargetsMg.length === phase.durationDays) {
    return phase.dailyTargetsMg.map((value) => Math.max(0, Math.round(value)));
  }
  return Array.from({ length: phase.durationDays }, () => Math.max(0, Math.round(phase.nicotineGoalMg)));
};

const titleize = (value: string | null | undefined): string => {
  if (!value) return 'Five Phase Structured';
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatDate = (iso?: string | null) => {
  if (!iso) return 'Today';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Today';
  return date.toLocaleDateString();
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return 'N/A';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

export default function SuccessScreen() {
  const { appState, setAppState, user } = useAppContext();
  const router = useRouter();

  const {
    quitDate,
    totalDuration,
    estimatedSavings,
    currencySymbol,
    planCurrency,
    taperingSchedule,
    planFramework,
    planGeneratedAt,
    planStartDate,
    initialIntake,
  } = appState;

  const planSummary = useMemo(() => {
    const schedule = Array.isArray(taperingSchedule) ? taperingSchedule : [];
    const normalized = schedule.map((phase) => ({
      ...phase,
      targets: normalizeTargets(phase),
    }));

    const initialTarget =
      normalized[0]?.targets[0] ?? Math.max(0, Math.round(initialIntake ?? 0));
    const lastPhase = normalized.length > 0 ? normalized[normalized.length - 1] : undefined;
    const finalTargets = lastPhase?.targets ?? [];
    const finalTarget = finalTargets.length
      ? finalTargets[finalTargets.length - 1]
      : lastPhase?.nicotineGoalMg ?? 0;

    let previousEnd = initialTarget;
    const phases: PhaseSummary[] = normalized.map((phase) => {
      const targets = phase.targets;
      const start = targets[0] ?? previousEnd;
      const end = targets.length ? targets[targets.length - 1] : phase.nicotineGoalMg;
      const reductionPercent = start > 0 ? ((start - end) / start) * 100 : 0;
      previousEnd = end;

      return {
        id: phase.phase,
        title: `${phase.phase}. ${phase.phaseName}`,
        role: phase.psychologicalRole,
        durationLabel: `${phase.durationDays} ${phase.durationDays === 1 ? 'day' : 'days'}`,
        startLabel: `${Math.round(start).toLocaleString()} mg`,
        endLabel: `${Math.round(end).toLocaleString()} mg`,
        reductionLabel: `${Math.max(0, reductionPercent).toFixed(1).replace(/\.0$/, '')}% reduction`,
        notes: phase.notes ?? null,
      };
    });

    const currencyPrefix = currencySymbol ?? (planCurrency ? `${planCurrency} ` : '');
    const savingsValue =
      typeof estimatedSavings === 'number' && Number.isFinite(estimatedSavings) ? Math.max(0, estimatedSavings) : 0;

    return {
      totalPhases: phases.length,
      startLabel: `${Math.round(initialTarget).toLocaleString()} mg`,
      endLabel: `${Math.round(finalTarget).toLocaleString()} mg`,
      savingsDisplay: savingsValue > 0 ? `${currencyPrefix}${savingsValue.toLocaleString()}` : 'N/A',
      frameworkLabel: titleize(planFramework),
      generatedLabel: formatDateTime(planGeneratedAt),
      startDateLabel: formatDate(planStartDate),
      quitDateLabel: quitDate ? formatDate(quitDate) : 'On completion of Phase 5',
      phases,
    };
  }, [
    taperingSchedule,
    estimatedSavings,
    currencySymbol,
    planCurrency,
    planFramework,
    planGeneratedAt,
    planStartDate,
    quitDate,
    initialIntake,
  ]);

  const handleFinish = async () => {
    await setOnboardingStatus(true, user?.uid);
    setAppState((prev) => ({
      ...prev,
      isOnboardingComplete: true,
    }));
    router.replace('/(tabs)/dashboard');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>Your Plan is Ready!</ThemedText>
        <ThemedText style={styles.subtitle}>
          Here are the highlights of your personalized, five-phase journey to a nicotine-free life.
        </ThemedText>

        <View style={styles.planContainer}>
          <View style={styles.planRow}>
            <View style={styles.metaBlock}>
              <ThemedText style={styles.metaLabel}>Plan framework</ThemedText>
              <ThemedText style={styles.metaValue}>{planSummary.frameworkLabel}</ThemedText>
            </View>
            <View style={styles.metaBlock}>
              <ThemedText style={styles.metaLabel}>Generated on</ThemedText>
              <ThemedText style={styles.metaValue}>{planSummary.generatedLabel}</ThemedText>
            </View>
          </View>

          <View style={styles.planRow}>
            <View style={styles.metaBlock}>
              <ThemedText style={styles.metaLabel}>Start date</ThemedText>
              <ThemedText style={styles.metaValue}>{planSummary.startDateLabel}</ThemedText>
            </View>
            <View style={styles.metaBlock}>
              <ThemedText style={styles.metaLabel}>Target quit date</ThemedText>
              <ThemedText style={styles.metaValue}>{planSummary.quitDateLabel}</ThemedText>
            </View>
          </View>

          <View style={styles.planRow}>
            <View style={styles.metaBlock}>
              <ThemedText style={styles.metaLabel}>Total duration</ThemedText>
              <ThemedText style={styles.metaValue}>
                {totalDuration ?? 0} {totalDuration === 1 ? 'day' : 'days'}
              </ThemedText>
            </View>
            <View style={styles.metaBlock}>
              <ThemedText style={styles.metaLabel}>Phases</ThemedText>
              <ThemedText style={styles.metaValue}>{planSummary.totalPhases}</ThemedText>
            </View>
          </View>

          <View style={styles.progressSummary}>
            <View style={styles.progressCard}>
              <ThemedText style={styles.progressLabel}>Starting limit</ThemedText>
              <ThemedText style={styles.progressValue}>{planSummary.startLabel}</ThemedText>
            </View>
            <View style={styles.progressCard}>
              <ThemedText style={styles.progressLabel}>Final goal</ThemedText>
              <ThemedText style={styles.progressValue}>{planSummary.endLabel}</ThemedText>
            </View>
          </View>

          <View style={styles.savingsContainer}>
            <ThemedText style={styles.savingsLabel}>Estimated Savings</ThemedText>
            <ThemedText style={styles.savingsValue}>{planSummary.savingsDisplay}</ThemedText>
          </View>
        </View>

        <View style={styles.phaseSection}>
          <ThemedText style={styles.phaseSectionTitle}>Phase Breakdown</ThemedText>
          {planSummary.phases.length === 0 ? (
            <ThemedText style={styles.placeholderText}>
              Phase details will appear once your personalized plan is generated.
            </ThemedText>
          ) : (
            planSummary.phases.map((phase) => (
              <View key={phase.id} style={styles.phaseCard}>
                <View style={styles.phaseHeader}>
                  <ThemedText style={styles.phaseTitle}>{phase.title}</ThemedText>
                  <ThemedText style={styles.phaseDuration}>{phase.durationLabel}</ThemedText>
                </View>
                <ThemedText style={styles.phaseRole}>{phase.role}</ThemedText>
                <View style={styles.phaseTargets}>
                  <ThemedText style={styles.targetText}>Start • {phase.startLabel}</ThemedText>
                  <ThemedText style={styles.targetText}>Goal • {phase.endLabel}</ThemedText>
                </View>
                <ThemedText style={styles.reductionBadge}>{phase.reductionLabel}</ThemedText>
                {phase.notes ? (
                  <ThemedText style={styles.phaseNotes}>{phase.notes}</ThemedText>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.button} onPress={handleFinish}>
        <ThemedText style={styles.buttonText}>Start My Journey</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: Colors.light.background,
    gap: 24,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 32,
    gap: 20,
  },
  title: {
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: 16,
    color: Colors.light.secondaryText,
  },
  planContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    gap: 16,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaBlock: {
    flex: 1,
    gap: 4,
  },
  metaLabel: {
    fontSize: 13,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressSummary: {
    flexDirection: 'row',
    gap: 12,
  },
  progressCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  progressLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  progressValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.tint,
  },
  savingsContainer: {
    marginTop: 4,
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  savingsLabel: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 6,
  },
  savingsValue: {
    fontSize: 30,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },
  phaseSection: {
    gap: 12,
  },
  phaseSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  placeholderText: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  phaseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 10,
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phaseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  phaseDuration: {
    fontSize: 13,
    color: Colors.light.secondaryText,
  },
  phaseRole: {
    fontSize: 14,
    color: '#4B5563',
  },
  phaseTargets: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  targetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  reductionBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
    color: Colors.light.tint,
    fontWeight: '600',
    fontSize: 13,
  },
  phaseNotes: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  button: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
