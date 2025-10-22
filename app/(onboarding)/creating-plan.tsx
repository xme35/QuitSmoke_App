import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { StyleSheet, View, TouchableOpacity, Animated } from 'react-native';
import { Colors } from '../../constants/theme';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { AppState, useAppContext, TaperingPhase } from '../../context/AppContext';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NICOTINE_ESTIMATES } from '../../data/constants';

const messages = [
  'Analyzing your profile...',
  'Creating your personalized plan...',
  'Calculating optimal milestones...',
  'Preparing your journey to freedom...',
  'Almost there...',
];

// Use the environment variable for the API key
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(API_KEY);

type PaceKey = 'slow' | 'standard' | 'fast';

interface PhaseBlueprint {
  phase: number;
  phaseName: string;
  psychologicalRole: string;
  percentRange: [number, number];
  fallbackPercent: Record<PaceKey, number>;
  durationRange: [number, number];
  fallbackDuration: Record<PaceKey, number>;
  defaultNotes: string;
  targetCapMg?: number;
  stabilizationTargetMg?: number;
}

interface GeneratedPlanDetails {
  taperingSchedule: TaperingPhase[];
  estimatedSavings: number;
  planFramework: string;
  planCurrency: string | null;
  totalDuration: number;
}

const DEFAULT_PLAN_FRAMEWORK = 'five-phase-structured';
const MS_IN_DAY = 1000 * 60 * 60 * 24;

const PHASE_BLUEPRINT: PhaseBlueprint[] = [
  {
    phase: 1,
    phaseName: 'Adaptação inicial',
    psychologicalRole: 'Build awareness and stabilize routines.',
    percentRange: [0.1, 0.2],
    fallbackPercent: { slow: 0.12, standard: 0.17, fast: 0.2 },
    durationRange: [7, 14],
    fallbackDuration: { slow: 14, standard: 10, fast: 7 },
    defaultNotes: 'Track triggers and add mindful breathing before each session.',
  },
  {
    phase: 2,
    phaseName: 'Ajustar ao desmame',
    psychologicalRole: 'Strengthen control by replacing routines and light substitutions.',
    percentRange: [0.1, 0.25],
    fallbackPercent: { slow: 0.15, standard: 0.2, fast: 0.25 },
    durationRange: [10, 21],
    fallbackDuration: { slow: 18, standard: 14, fast: 10 },
    defaultNotes: 'Introduce distraction techniques and support accountability check-ins.',
  },
  {
    phase: 3,
    phaseName: 'Reforço de controlo',
    psychologicalRole: 'Reinforce confidence with deeper habit rewiring.',
    percentRange: [0.15, 0.25],
    fallbackPercent: { slow: 0.18, standard: 0.22, fast: 0.25 },
    durationRange: [14, 21],
    fallbackDuration: { slow: 21, standard: 18, fast: 14 },
    defaultNotes: 'Plan coping scripts for cravings and expand replacement activities.',
  },
  {
    phase: 4,
    phaseName: 'Quase livre',
    psychologicalRole: 'Prepare for a nicotine-free life with intensive reinforcement.',
    percentRange: [0.2, 0.3],
    fallbackPercent: { slow: 0.22, standard: 0.27, fast: 0.3 },
    durationRange: [14, 30],
    fallbackDuration: { slow: 24, standard: 21, fast: 14 },
    defaultNotes: 'Set up relapse-prevention strategies and practice stress routines.',
    targetCapMg: 5,
  },
  {
    phase: 5,
    phaseName: 'Consolidação sem nicotina',
    psychologicalRole: 'Stabilize nicotine-free identity and routines.',
    percentRange: [0, 0.05],
    fallbackPercent: { slow: 0, standard: 0, fast: 0 },
    durationRange: [21, 30],
    fallbackDuration: { slow: 30, standard: 24, fast: 21 },
    defaultNotes: 'Keep daily reflections and reward systems to maintain momentum.',
    stabilizationTargetMg: 0,
  },
];

const getPaceKey = (pace?: string | null): PaceKey => {
  switch ((pace ?? '').toLowerCase()) {
    case 'slow':
      return 'slow';
    case 'fast':
      return 'fast';
    default:
      return 'standard';
  }
};

const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const sanitizeInteger = (value: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER): number => {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return clampNumber(Math.round(numeric), min, max);
  }
  const safeFallback = Number.isFinite(fallback) ? Math.round(fallback) : min;
  return clampNumber(safeFallback, min, max);
};

const computePhaseReductionPercent = (start: number, end: number): number => {
  if (start <= 0) return 1;
  return clampNumber((start - end) / start, 0, 1);
};

const generateDailyTargets = (start: number, goal: number, days: number): number[] => {
  const clampedDays = Math.max(0, Math.min(365, Math.floor(days)));
  if (clampedDays <= 0) return [];
  const startValue = Math.max(0, Math.round(start));
  const goalValue = Math.max(0, Math.round(goal));
  if (startValue <= goalValue) {
    return Array(clampedDays).fill(goalValue);
  }
  const decrement = (startValue - goalValue) / clampedDays;
  const targets: number[] = [];
  for (let day = 1; day <= clampedDays; day += 1) {
    const nextValue = Math.max(0, Math.round(startValue - decrement * day));
    targets.push(nextValue);
  }
  targets[targets.length - 1] = goalValue;
  for (let i = 1; i < targets.length; i += 1) {
    targets[i] = Math.min(targets[i], targets[i - 1]);
  }
  return targets;
};

const applyCap = (values: number[], cap?: number): number[] => {
  if (typeof cap !== 'number') return values;
  return values.map((value) => Math.min(value, cap));
};

const sanitizeDailyTargets = (
  candidateTargets: unknown,
  baselineTargets: number[],
  goalMg: number,
  startMg: number,
  cap?: number,
): number[] => {
  if (!Array.isArray(candidateTargets)) {
    return applyCap(baselineTargets, cap);
  }
  const sanitized = (candidateTargets as unknown[])
    .map((value) => Math.max(0, Math.round(Number(value))))
    .filter((value) => Number.isFinite(value));
  if (sanitized.length !== baselineTargets.length || sanitized.length === 0) {
    return applyCap(baselineTargets, cap);
  }
  sanitized[0] = Math.min(sanitized[0], Math.round(startMg));
  for (let i = 1; i < sanitized.length; i += 1) {
    sanitized[i] = Math.min(sanitized[i], sanitized[i - 1]);
  }
  sanitized[sanitized.length - 1] = Math.min(sanitized[sanitized.length - 1], goalMg);
  return applyCap(sanitized, cap);
};

const removeMarkdownFences = (text: string): string => text.replace(/```json|```/gi, '').trim();

const getCurrencyFallback = (appState: AppState): string | null => {
  if (appState.currencyCode) return appState.currencyCode;
  if (appState.currencySymbol) return appState.currencySymbol;
  return null;
};

const formatPercentRange = (range: [number, number]) => `${Math.round(range[0] * 100)}-${Math.round(range[1] * 100)}%`;

const formatDurationRange = (range: [number, number]) => `${range[0]}-${range[1]} dias`;

const buildPlanPrompt = (
  appState: AppState,
  currentIntake: number,
  paceKey: PaceKey,
  currencyHint: string,
): string => {
  const { age, countryName, sources, smokingHistory, quittingPace } = appState;

  const phaseGuidance = PHASE_BLUEPRINT.map((blueprint) => {
    const percentRange = formatPercentRange(blueprint.percentRange);
    const durationRange = formatDurationRange(blueprint.durationRange);
    const paceDefault = blueprint.fallbackDuration[paceKey];
    return `Phase ${blueprint.phase} "${blueprint.phaseName}": role = ${blueprint.psychologicalRole} | reduction ${percentRange} | duration ${durationRange} (pace default ${paceDefault} dias).`;
  }).join('\n');

  const sourcesList = sources?.length ? sources.join(', ') : 'não informado';
  const paceLabel = quittingPace ?? 'Standard';

  return `
You are an expert smoking-cessation planner. Produce a tapering plan in structured JSON.

Return a plain JSON object (no Markdown, no explanations) matching this TypeScript signature:
{
  "planFramework": "five-phase-structured",
  "currency": string | null,
  "estimatedSavings": number,
  "taperingSchedule": [
    {
      "phase": number,
      "phaseName": string,
      "psychologicalRole": string,
      "durationDays": number,
      "totalReductionPercent": number,
      "nicotineGoalMg": number,
      "dailyTargetsMg": number[],
      "notes": string | null
    }
  ]
}

Guidelines:
${phaseGuidance}
- Use exactly five phases, numbered 1 through 5, matching the names above.
- totalReductionPercent applies within the phase (0.00-1.00). Use up to three decimal places.
- dailyTargetsMg must contain durationDays integers, monotonically non-increasing, representing the daily nicotine ceiling.
- Phase 4 must finish at ≤5 mg/day.
- Phase 5 is a stabilization phase: totalReductionPercent = 0, dailyTargetsMg = all zeros, nicotineGoalMg = 0.
- Use null (not strings) when data is unavailable.
- Set planFramework to "five-phase-structured".
- Set currency to an ISO code when possible (e.g., "${currencyHint}").
- Self-validate before responding: durations > 0, phases sequential, dailyTargets length matches duration, nicotineGoalMg equals the last daily target.

User data:
- Current daily nicotine intake: ${currentIntake} mg
- Age: ${age ?? 'não informado'}
- Country: ${countryName ?? 'não informado'}
- Currency preference: ${currencyHint}
- Products used: ${sourcesList}
- Smoking history: ${smokingHistory ?? 'não informado'}
- Quitting pace preference: ${paceLabel}

Example (do NOT copy values, use the user's data):
{
  "planFramework": "five-phase-structured",
  "currency": "${currencyHint}",
  "estimatedSavings": 320,
  "taperingSchedule": [
    {
      "phase": 1,
      "phaseName": "Adaptação inicial",
      "psychologicalRole": "Build awareness and stabilize routines.",
      "durationDays": 10,
      "totalReductionPercent": 0.150,
      "nicotineGoalMg": 180,
      "dailyTargetsMg": [198, 196, 194, 192, 190, 188, 186, 184, 182, 180],
      "notes": "Track triggers and swap one small habit."
    },
    {
      "phase": 2,
      "phaseName": "Ajustar ao desmame",
      "psychologicalRole": "Strengthen control with structured substitutions.",
      "durationDays": 14,
      "totalReductionPercent": 0.200,
      "nicotineGoalMg": 144,
      "dailyTargetsMg": [176, 172, 168, 164, 160, 156, 152, 148, 146, 145, 145, 144, 144, 144],
      "notes": "Daily accountability check-ins."
    },
    {
      "phase": 3,
      "phaseName": "Reforço de controlo",
      "psychologicalRole": "Reinforce confidence via coping scripts.",
      "durationDays": 18,
      "totalReductionPercent": 0.220,
      "nicotineGoalMg": 112,
      "dailyTargetsMg": [144, 141, 138, 135, 132, 129, 126, 123, 120, 118, 116, 115, 114, 113, 112, 112, 112, 112],
      "notes": "Rehearse responses to cravings."
    },
    {
      "phase": 4,
      "phaseName": "Quase livre",
      "psychologicalRole": "Prepare for a nicotine-free life.",
      "durationDays": 21,
      "totalReductionPercent": 0.270,
      "nicotineGoalMg": 5,
      "dailyTargetsMg": [112, 108, 104, 100, 96, 92, 88, 84, 80, 76, 72, 68, 64, 60, 40, 25, 15, 10, 8, 6, 5],
      "notes": "Relapse prevention rehearsal."
    },
    {
      "phase": 5,
      "phaseName": "Consolidação sem nicotina",
      "psychologicalRole": "Stabilize nicotine-free routines.",
      "durationDays": 24,
      "totalReductionPercent": 0,
      "nicotineGoalMg": 0,
      "dailyTargetsMg": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      "notes": "Celebrate milestones and reinforce identity."
    }
  ]
}
`.trim();
};

const normalizePlanResponse = (
  rawPlan: any,
  appState: AppState,
  currentIntake: number,
  paceKey: PaceKey,
): GeneratedPlanDetails => {
  let phaseStartMg = Math.max(0, Math.round(currentIntake));
  const currencyFallback = getCurrencyFallback(appState);
  const schedule: TaperingPhase[] = [];

  PHASE_BLUEPRINT.forEach((blueprint) => {
    const candidate = Array.isArray(rawPlan?.taperingSchedule)
      ? rawPlan.taperingSchedule.find((phase: any) => phase?.phase === blueprint.phase)
      : undefined;

    const duration = sanitizeInteger(
      candidate?.durationDays,
      blueprint.fallbackDuration[paceKey],
      blueprint.durationRange[0],
      blueprint.durationRange[1],
    );

    if (typeof blueprint.stabilizationTargetMg === 'number') {
      const target = Math.max(0, Math.round(blueprint.stabilizationTargetMg));
      const stableTargets = Array(duration).fill(target);

      schedule.push({
        phase: blueprint.phase,
        phaseName:
          typeof candidate?.phaseName === 'string' && candidate.phaseName.trim().length
            ? candidate.phaseName.trim()
            : blueprint.phaseName,
        psychologicalRole:
          typeof candidate?.psychologicalRole === 'string' && candidate.psychologicalRole.trim().length
            ? candidate.psychologicalRole.trim()
            : blueprint.psychologicalRole,
        durationDays: duration,
        nicotineGoalMg: target,
        totalReductionPercent: 0,
        dailyTargetsMg: stableTargets,
        notes:
          typeof candidate?.notes === 'string' && candidate.notes.trim().length
            ? candidate.notes.trim()
            : blueprint.defaultNotes,
      });

      phaseStartMg = target;
      return;
    }

    const fallbackPercent = blueprint.fallbackPercent[paceKey];
    const rawPercent = Number(candidate?.totalReductionPercent);
    const totalReductionPercent = clampNumber(
      Number.isFinite(rawPercent) ? rawPercent : fallbackPercent,
      blueprint.percentRange[0],
      blueprint.percentRange[1],
    );

    const cappedStart = Math.max(0, phaseStartMg);
    let targetMg = Math.max(0, Math.round(cappedStart * (1 - totalReductionPercent)));
    if (typeof blueprint.targetCapMg === 'number') {
      targetMg = Math.min(targetMg, blueprint.targetCapMg);
    }

    const baselineTargets = generateDailyTargets(cappedStart, targetMg, duration);
    const sanitizedTargets = sanitizeDailyTargets(
      candidate?.dailyTargetsMg,
      baselineTargets,
      targetMg,
      cappedStart,
      blueprint.targetCapMg,
    );
    const nicotineGoalMg = sanitizedTargets[sanitizedTargets.length - 1] ?? targetMg;
    const reductionPercent = computePhaseReductionPercent(cappedStart, nicotineGoalMg);

    schedule.push({
      phase: blueprint.phase,
      phaseName:
        typeof candidate?.phaseName === 'string' && candidate.phaseName.trim().length
          ? candidate.phaseName.trim()
          : blueprint.phaseName,
      psychologicalRole:
        typeof candidate?.psychologicalRole === 'string' && candidate.psychologicalRole.trim().length
          ? candidate.psychologicalRole.trim()
          : blueprint.psychologicalRole,
      durationDays: duration,
      nicotineGoalMg,
      totalReductionPercent: Number(reductionPercent.toFixed(3)),
      dailyTargetsMg: sanitizedTargets,
      notes:
        typeof candidate?.notes === 'string' && candidate.notes.trim().length
          ? candidate.notes.trim()
          : blueprint.defaultNotes,
    });

    phaseStartMg = nicotineGoalMg;
  });

  const totalDuration = schedule.reduce((sum, phase) => sum + phase.durationDays, 0);

  return {
    taperingSchedule: schedule,
    estimatedSavings: sanitizeInteger(rawPlan?.estimatedSavings, totalDuration * 3, 0),
    planFramework:
      typeof rawPlan?.planFramework === 'string' && rawPlan.planFramework.trim().length
        ? rawPlan.planFramework.trim()
        : DEFAULT_PLAN_FRAMEWORK,
    planCurrency:
      typeof rawPlan?.currency === 'string' && rawPlan.currency.trim().length
        ? rawPlan.currency.trim().toUpperCase()
        : currencyFallback,
    totalDuration,
  };
};


const generatePlan = async (appState: AppState, currentIntake: number): Promise<GeneratedPlanDetails> => {
  const paceKey = getPaceKey(appState.quittingPace);
  const currencyHint = getCurrencyFallback(appState) ?? 'USD';
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const prompt = buildPlanPrompt(appState, currentIntake, paceKey, currencyHint);

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonString = removeMarkdownFences(response.text());
    const parsed = JSON.parse(jsonString);
    return normalizePlanResponse(parsed, appState, currentIntake, paceKey);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Plan generation failed');
  }
};

// --- Helper function to calculate current daily nicotine intake ---
const calculateCurrentNicotine = (appState: AppState): number => {
  let totalNicotine = 0;
  const { cigarettes, vapes, heatedTobacco, nicotinePouches } = appState;

  const getDailyValue = (value: number, frequency: string) => {
    if (frequency === 'week') return value / 7;
    if (frequency === 'month') return value / 30;
    return value;
  };

  if (cigarettes && cigarettes.amount > 0) {
    totalNicotine += getDailyValue(cigarettes.amount, cigarettes.frequency) * 1.2;
  }
  if (vapes && vapes.puffs > 0) {
    totalNicotine += getDailyValue(vapes.puffs, vapes.frequency) * (NICOTINE_ESTIMATES.Vape ?? 0);
  }
  if (heatedTobacco && heatedTobacco.sticks > 0) {
    totalNicotine += getDailyValue(heatedTobacco.sticks, heatedTobacco.frequency) * 1.0;
  }
  if (nicotinePouches && nicotinePouches.pouches > 0) {
    totalNicotine += getDailyValue(nicotinePouches.pouches, nicotinePouches.frequency) * (NICOTINE_ESTIMATES['Nicotine Pouch'] ?? 0);
  }

  return Math.round(totalNicotine);
};

export default function CreatingPlanScreen() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const router = useRouter();
  const { appState, setAppState } = useAppContext();
  const isMountedRef = useRef(true);
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const spinValue = useRef(new Animated.Value(0)).current;

  // Continuous spinner rotation
  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, [spinValue]);

  // Message cycling with fade animation
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  const attemptPlanGeneration = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const initialNicotineIntake = calculateCurrentNicotine(appState);
      const planDetails = await generatePlan(appState, initialNicotineIntake);

      const planGeneratedAt = new Date().toISOString();
      const planStartDate = planGeneratedAt;
      const quitDateIso =
        planDetails.totalDuration > 0
          ? new Date(Date.now() + planDetails.totalDuration * MS_IN_DAY).toISOString()
          : null;

      setAppState((prev) => {
        const resolvedCurrency =
          planDetails.planCurrency ?? prev.planCurrency ?? getCurrencyFallback(prev);

        return {
          ...prev,
          taperingSchedule: planDetails.taperingSchedule,
          estimatedSavings: planDetails.estimatedSavings,
          totalDuration: planDetails.totalDuration,
          reductionInterval: 1,
          planFramework: planDetails.planFramework,
          planCurrency: resolvedCurrency,
          planGeneratedAt,
          planStartDate,
          quitDate: quitDateIso,
          initialIntake: initialNicotineIntake,
        };
      });

      const timeoutId = setTimeout(() => {
        if (!isMountedRef.current) {
          return;
        }
        router.replace('/(onboarding)/success' as any);
      }, 1500);
      navigationTimeoutRef.current = timeoutId;
    } catch (error) {
      console.error('Automated plan generation failed:', error);
      if (!isMountedRef.current) {
        return;
      }
      setErrorMessage('Something went wrong. Please try again later.');
      setIsGenerating(false);
    }
  }, [appState, router, setAppState]);

  useEffect(() => {
    if (!hasAttemptedGeneration) {
      setHasAttemptedGeneration(true);
      void attemptPlanGeneration();
    }
  }, [attemptPlanGeneration, hasAttemptedGeneration]);

  const spinRotation = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <ThemedView style={styles.container}>
      {!errorMessage && (
        <>
          {/* Modern Circular Spinner */}
          <View style={styles.spinnerContainer}>
            <Animated.View
              style={[
                styles.spinnerOuter,
                {
                  transform: [{ rotate: spinRotation }],
                },
              ]}
            >
              <View style={styles.spinnerInner} />
            </Animated.View>
          </View>

          {/* Animated Message */}
          <Animated.View style={[styles.messageContainer, { opacity: fadeAnim }]}>
            <ThemedText style={styles.loadingMessage}>
              {messages[currentMessageIndex]}
            </ThemedText>
          </Animated.View>
        </>
      )}

      {errorMessage && (
        <>
          <ThemedText type="title" style={styles.title}>
            Unable to create your plan
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            We hit a temporary snag while personalizing your plan.
          </ThemedText>
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorMessage}>{errorMessage}</ThemedText>
            <TouchableOpacity
              style={[styles.retryButton, isGenerating && styles.retryButtonDisabled]}
              onPress={() => void attemptPlanGeneration()}
              disabled={isGenerating}
            >
              <ThemedText style={styles.retryButtonText}>
                {isGenerating ? 'Retrying...' : 'Try Again'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  spinnerContainer: {
    marginBottom: 32,
  },
  spinnerOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: Colors.light.tint,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  spinnerInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  messageContainer: {
    alignItems: 'center',
    minHeight: 60,
  },
  loadingMessage: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: Colors.light.tint,
  },
  title: {
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  errorContainer: {
    marginTop: 24,
    width: '100%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    gap: 12,
  },
  errorMessage: {
    color: '#B91C1C',
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 999,
    backgroundColor: Colors.light.tint,
  },
  retryButtonDisabled: {
    opacity: 0.6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
