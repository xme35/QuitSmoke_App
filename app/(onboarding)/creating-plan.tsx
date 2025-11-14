import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { StyleSheet, View, TouchableOpacity, Animated } from 'react-native';
import { Colors } from '../../constants/theme';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { AppState, useAppContext, TaperingPhase, initialAppState } from '../../context/AppContext';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NICOTINE_ESTIMATES } from '../../data/constants';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

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
  forceFinalMg?: number;
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
const MAX_PLAN_ATTEMPTS = 3;

const PHASE_BLUEPRINT: PhaseBlueprint[] = [
  {
    phase: 1,
    phaseName: 'Initial Adaptation',
    psychologicalRole: 'Build awareness and stabilize routines.',
    percentRange: [0.1, 0.2],
    fallbackPercent: { slow: 0.12, standard: 0.17, fast: 0.2 },
    durationRange: [7, 14],
    fallbackDuration: { slow: 14, standard: 10, fast: 7 },
    defaultNotes: 'Track triggers and add mindful breathing before each session.',
  },
  {
    phase: 2,
    phaseName: 'Adjustment to Weaning',
    psychologicalRole: 'Strengthen control by replacing routines and light substitutions.',
    percentRange: [0.1, 0.25],
    fallbackPercent: { slow: 0.15, standard: 0.2, fast: 0.25 },
    durationRange: [10, 21],
    fallbackDuration: { slow: 18, standard: 14, fast: 10 },
    defaultNotes: 'Introduce distraction techniques and support accountability check-ins.',
  },
  {
    phase: 3,
    phaseName: 'Control Reinforcement',
    psychologicalRole: 'Reinforce confidence with deeper habit rewiring.',
    percentRange: [0.15, 0.25],
    fallbackPercent: { slow: 0.18, standard: 0.22, fast: 0.25 },
    durationRange: [14, 21],
    fallbackDuration: { slow: 21, standard: 18, fast: 14 },
    defaultNotes: 'Plan coping scripts for cravings and expand replacement activities.',
  },
  {
    phase: 4,
    phaseName: 'Almost Free',
    psychologicalRole: 'Prepare for a nicotine-free life with intensive reinforcement.',
    percentRange: [0.2, 0.3],
    fallbackPercent: { slow: 0.22, standard: 0.27, fast: 0.3 },
    durationRange: [14, 30],
    fallbackDuration: { slow: 24, standard: 21, fast: 14 },
    defaultNotes: 'Set up relapse-prevention strategies and practice stress routines.',
    targetCapMg: 5,
    forceFinalMg: 0,
  },
  {
    phase: 5,
    phaseName: 'Nicotine-Free Consolidation',
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

  if (targets.length > 0) {
    targets[targets.length - 1] = goalValue;
  }

  for (let i = 1; i < targets.length; i += 1) {
    targets[i] = Math.min(targets[i], targets[i - 1]);
  }

  if (startValue > goalValue && targets.length > 0 && targets[0] >= startValue) {
    const minimumStep = Math.max(1, Math.ceil((startValue - goalValue) / clampedDays));
    const adjustedFirst = Math.max(goalValue, Math.min(startValue - 1, startValue - minimumStep));
    targets[0] = adjustedFirst;
    for (let i = 1; i < targets.length; i += 1) {
      targets[i] = Math.min(targets[i], targets[i - 1]);
    }
    targets[targets.length - 1] = goalValue;
  }

  return targets;
};

interface PhaseOutline {
  phase?: number;
  durationDays?: number;
  note?: string | null;
  notes?: string | null;
  psychologicalRole?: string | null;
}

interface PlanOutline {
  planFramework?: string | null;
  currency?: string | null;
  estimatedSavings?: number | null;
  phases?: PhaseOutline[];
  taperingSchedule?: PhaseOutline[];
}

interface DeterministicPhaseConfig {
  blueprint: PhaseBlueprint;
  duration: number;
  note: string | null;
  psychologicalRole: string | null;
}

const sanitizePhaseDuration = (
  blueprint: PhaseBlueprint,
  rawDuration: unknown,
  paceKey: PaceKey,
): number => {
  return sanitizeInteger(
    rawDuration,
    blueprint.fallbackDuration[paceKey],
    blueprint.durationRange[0],
    blueprint.durationRange[1],
  );
};

const parsePlanOutline = (rawPlan: unknown, paceKey: PaceKey): DeterministicPhaseConfig[] => {
  const outline = (typeof rawPlan === 'object' && rawPlan !== null ? rawPlan : {}) as PlanOutline;

  const phaseCandidates =
    Array.isArray(outline.phases) && outline.phases.length > 0
      ? outline.phases
      : Array.isArray(outline.taperingSchedule)
        ? outline.taperingSchedule
        : [];

  return PHASE_BLUEPRINT.map(blueprint => {
    const candidate = phaseCandidates.find(phase => phase?.phase === blueprint.phase);

    const duration = sanitizePhaseDuration(blueprint, candidate?.durationDays, paceKey);

    const note =
      typeof candidate?.note === 'string' && candidate.note.trim().length > 0
        ? candidate.note.trim()
        : typeof candidate?.notes === 'string' && candidate.notes.trim().length > 0
          ? candidate.notes.trim()
          : null;

    const psychologicalRole =
      typeof candidate?.psychologicalRole === 'string' && candidate.psychologicalRole.trim().length > 0
        ? candidate.psychologicalRole.trim()
        : null;

    return {
      blueprint,
      duration,
      note,
      psychologicalRole,
    };
  });
};

const computeDeterministicSchedule = (
  baselineIntake: number,
  phaseConfigs: DeterministicPhaseConfig[],
  paceKey: PaceKey,
): TaperingPhase[] => {
  let phaseStart = Math.max(0, Math.round(baselineIntake));
  const schedule: TaperingPhase[] = [];

  phaseConfigs.forEach(({ blueprint, duration, note, psychologicalRole }) => {
    let goal: number;

    if (typeof blueprint.forceFinalMg === 'number') {
      goal = blueprint.forceFinalMg;
    } else if (typeof blueprint.stabilizationTargetMg === 'number') {
      goal = blueprint.stabilizationTargetMg;
    } else {
      let desiredReduction = blueprint.fallbackPercent[paceKey];
      if (schedule.length > 0) {
        const previousReduction = schedule[schedule.length - 1].totalReductionPercent;
        desiredReduction = Math.max(desiredReduction, previousReduction + 0.05);
      }
      desiredReduction = clampNumber(
        desiredReduction,
        blueprint.percentRange[0],
        blueprint.percentRange[1],
      );
      goal = Math.round(phaseStart * (1 - desiredReduction));
    }

    if (blueprint.phase === 4 || blueprint.phase === 5) {
      goal = 0;
    }

    if (typeof blueprint.targetCapMg === 'number') {
      goal = Math.min(goal, blueprint.targetCapMg);
    }

    if (goal >= phaseStart && phaseStart > 0) {
      goal = Math.max(0, phaseStart - Math.max(1, Math.round(phaseStart * 0.1)));
    }

    if (phaseStart <= 0) {
      goal = 0;
    }

    const dailyTargets = generateDailyTargets(phaseStart, goal, duration);
    const lastTarget = dailyTargets[dailyTargets.length - 1] ?? goal;

    const reductionPercent =
      phaseStart > 0 ? Number(((phaseStart - lastTarget) / phaseStart).toFixed(3)) : 0;

    schedule.push({
      phase: blueprint.phase,
      phaseName: blueprint.phaseName,
      psychologicalRole: psychologicalRole ?? blueprint.psychologicalRole,
      durationDays: duration,
      nicotineGoalMg: lastTarget,
      totalReductionPercent: reductionPercent,
      dailyTargetsMg: dailyTargets,
      notes: note ?? blueprint.defaultNotes,
    });

    phaseStart = lastTarget;
  });

  return schedule;
};

const buildDeterministicPlan = (
  rawPlan: unknown,
  appState: AppState,
  baselineIntake: number,
  paceKey: PaceKey,
) => {
  const outline = (typeof rawPlan === 'object' && rawPlan !== null ? rawPlan : {}) as PlanOutline;
  const phaseConfigs = parsePlanOutline(outline, paceKey);
  const schedule = computeDeterministicSchedule(baselineIntake, phaseConfigs, paceKey);
  const totalDuration = schedule.reduce((sum, phase) => sum + phase.durationDays, 0);

  const estimatedSavings =
    typeof outline.estimatedSavings === 'number' && Number.isFinite(outline.estimatedSavings)
      ? Math.max(0, Math.round(outline.estimatedSavings))
      : estimateFallbackSavings(appState, totalDuration);

  const planCurrency =
    typeof outline.currency === 'string' && outline.currency.trim().length > 0
      ? outline.currency.trim().toUpperCase()
      : null;

  const planFramework =
    typeof outline.planFramework === 'string' && outline.planFramework.trim().length > 0
      ? outline.planFramework.trim()
      : DEFAULT_PLAN_FRAMEWORK;

  return {
    schedule,
    estimatedSavings,
    planCurrency,
    planFramework,
    totalDuration,
  };
};

const getNicotineEstimate = (appState: AppState, product: keyof typeof NICOTINE_ESTIMATES): number => {
  const preferences = appState.preferences ?? initialAppState.preferences;
  const fallback = NICOTINE_ESTIMATES[product];
  if (!preferences) {
    return fallback;
  }

  switch (product) {
    case 'Cigarette':
      return Number.isFinite(preferences.nicotineStrengthMgPerCigarette)
        ? preferences.nicotineStrengthMgPerCigarette
        : fallback;
    case 'Vape': {
      const customMgPerPuff = (preferences as any)?.vapeNicotineMgPerPuff;
      if (Number.isFinite(customMgPerPuff) && customMgPerPuff > 0) {
        return customMgPerPuff;
      }
      return fallback;
    }
    case 'Heated Tobacco':
      return Number.isFinite(preferences.nicotineStrengthMgPerHeatedTobacco)
        ? preferences.nicotineStrengthMgPerHeatedTobacco
        : fallback;
    case 'Nicotine Pouch':
      return Number.isFinite(preferences.nicotineStrengthMgPerPouch)
        ? preferences.nicotineStrengthMgPerPouch
        : fallback;
    default:
      return fallback;
  }
};

const formatNicotineValue = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '0';
  }
  const absValue = Math.abs(value);
  if (Number.isInteger(value)) {
    return value.toFixed(0);
  }
  if (absValue >= 10) {
    return value.toFixed(1);
  }
  return value.toFixed(2);
};

const removeMarkdownFences = (text: string): string => text.replace(/```json|```/gi, '').trim();

const getCurrencyFallback = (appState: AppState): string | null => {
  if (appState.currencyCode) return appState.currencyCode;
  if (appState.currencySymbol) return appState.currencySymbol;
  return null;
};

const estimateFallbackSavings = (appState: AppState, totalDuration: number): number => {
  // Fallback savings estimation if AI doesn't provide one
  // Use conservative estimates for typical product costs
  let dailySavings = 0;
  
  const getDailyAmount = (amount: number, freq: string) => {
    if (freq === 'week') return amount / 7;
    if (freq === 'month') return amount / 30;
    return amount;
  };

  // Cigarettes: assume ~$8-12 per pack (20 cigarettes)
  if (appState.cigarettes && appState.cigarettes.amount > 0) {
    const dailyCigs = getDailyAmount(appState.cigarettes.amount, appState.cigarettes.frequency);
    const packsPerDay = dailyCigs / 20;
    dailySavings += packsPerDay * 10; // $10 average per pack
  }

  // Vapes: assume ~$15-20 per pod/cartridge (500 puffs)
  if (appState.vapes && appState.vapes.puffs > 0) {
    const dailyPuffs = getDailyAmount(appState.vapes.puffs, appState.vapes.frequency);
    const podsPerDay = dailyPuffs / 500;
    dailySavings += podsPerDay * 17; // $17 average per pod
  }

  // Heated tobacco: assume ~$8 per pack (20 sticks)
  if (appState.heatedTobacco && appState.heatedTobacco.sticks > 0) {
    const dailySticks = getDailyAmount(appState.heatedTobacco.sticks, appState.heatedTobacco.frequency);
    const packsPerDay = dailySticks / 20;
    dailySavings += packsPerDay * 8;
  }

  // Nicotine pouches: assume ~$5-7 per can (20 pouches)
  if (appState.nicotinePouches && appState.nicotinePouches.pouches > 0) {
    const dailyPouches = getDailyAmount(appState.nicotinePouches.pouches, appState.nicotinePouches.frequency);
    const cansPerDay = dailyPouches / 20;
    dailySavings += cansPerDay * 6;
  }

  // Calculate savings over tapering period
  // Assume average 60% reduction in consumption over the plan
  const averageSavings = dailySavings * 0.6 * totalDuration;
  
  return Math.max(0, Math.round(averageSavings));
};

const formatDurationRange = (range: [number, number]) => `${range[0]}-${range[1]} days`;

const buildPlanPrompt = (
  appState: AppState,
  currentIntake: number,
  paceKey: PaceKey,
  currencyHint: string,
): string => {
  const {
    age,
    countryName,
    sources,
    smokingHistory,
    quittingPace,
    cigarettes,
    vapes,
    heatedTobacco,
    nicotinePouches,
  } = appState;

  const normalizeDailyAmount = (rawValue: number, frequency?: string | null) => {
    if (!Number.isFinite(rawValue) || rawValue <= 0) return 0;
    switch ((frequency ?? 'day').toLowerCase()) {
      case 'week':
        return rawValue / 7;
      case 'month':
        return rawValue / 30;
      default:
        return rawValue;
    }
  };

  const usageSummaries: string[] = [];

  if (cigarettes && cigarettes.amount > 0) {
    const daily = normalizeDailyAmount(cigarettes.amount, cigarettes.frequency);
    usageSummaries.push(
      `Cigarettes: ${cigarettes.amount} per ${cigarettes.frequency} (avg ${daily.toFixed(
        1,
      )}/day, ~${formatNicotineValue(getNicotineEstimate(appState, 'Cigarette'))}mg nicotine each)`,
    );
  }
  if (vapes && vapes.puffs > 0) {
    const daily = normalizeDailyAmount(vapes.puffs, vapes.frequency);
    usageSummaries.push(
      `Vape: ${vapes.puffs} puffs per ${vapes.frequency} (avg ${daily.toFixed(
        0,
      )} puffs/day, ~${formatNicotineValue(getNicotineEstimate(appState, 'Vape'))}mg nicotine per puff)`,
    );
  }
  if (heatedTobacco && heatedTobacco.sticks > 0) {
    const daily = normalizeDailyAmount(heatedTobacco.sticks, heatedTobacco.frequency);
    usageSummaries.push(
      `Heated Tobacco: ${heatedTobacco.sticks} sticks per ${heatedTobacco.frequency} (avg ${daily.toFixed(
        1,
      )}/day, ~${formatNicotineValue(getNicotineEstimate(appState, 'Heated Tobacco'))}mg nicotine each)`,
    );
  }
  if (nicotinePouches && nicotinePouches.pouches > 0) {
    const daily = normalizeDailyAmount(nicotinePouches.pouches, nicotinePouches.frequency);
    usageSummaries.push(
      `Nicotine Pouches: ${nicotinePouches.pouches} per ${nicotinePouches.frequency} (avg ${daily.toFixed(
        1,
      )}/day, ~${formatNicotineValue(getNicotineEstimate(appState, 'Nicotine Pouch'))}mg nicotine each)`,
    );
  }

  const usageDetails =
    usageSummaries.length > 0
      ? usageSummaries.map(summary => `  - ${summary}`).join('\n')
      : '  - No usage data provided';

  const phaseGuidance = PHASE_BLUEPRINT.map(blueprint => {
    const durationRange = formatDurationRange(blueprint.durationRange);
    const paceDefault = blueprint.fallbackDuration[paceKey];
    return `Phase ${blueprint.phase} "${blueprint.phaseName}": role = ${blueprint.psychologicalRole} | duration ${durationRange} (pace default ${paceDefault} days).`;
  }).join('\n');

  const sourcesList = sources?.length ? sources.join(', ') : 'not provided';
  const paceLabel = quittingPace ?? 'Standard';

  return `
You are an expert smoking-cessation planner. Produce phase durations and high-level guidance for a nicotine tapering plan.

Return JSON only (no Markdown, no extra commentary) matching this shape:
{
  "planFramework": string | null,
  "currency": string | null,
  "estimatedSavings": number | null,
  "phases": [
    {
      "phase": number,
      "durationDays": number,
      "note": string | null,
      "psychologicalRole": string | null
    }
  ]
}

Guidelines:
${phaseGuidance}
- Provide exactly five phases (1 through 5) using the names above.
- Keep durationDays within the allowed range for each phase.
- "note" should contain short behavioural guidance, or null if none.
- "psychologicalRole" may refine or expand on the suggested role; use null if you have nothing to add.
- If you are unsure of a value, return null rather than inventing it.
- Do not include nicotine totals, daily targets, or other numeric tapering data—we will compute those.
- Ensure the JSON parses directly with JSON.parse.

Product usage context:
${usageDetails}

User profile:
- Current daily nicotine intake estimate: ${currentIntake} mg
- Age: ${age ?? 'not provided'}
- Country: ${countryName ?? 'not provided'}
- Currency preference: ${currencyHint}
- Products used: ${sourcesList}
- Smoking history: ${smokingHistory ?? 'not provided'}
- Preferred quitting pace: ${paceLabel}

Your response must be valid JSON, with no backticks and no trailing commentary.
`.trim();
};

const normalizePlanResponse = (
  rawPlan: unknown,
  appState: AppState,
  currentIntake: number,
  paceKey: PaceKey,
): GeneratedPlanDetails => {
  const currencyFallback = getCurrencyFallback(appState);
  const baselineIntake = Math.max(0, Math.round(currentIntake));

  const {
    schedule,
    estimatedSavings,
    planCurrency,
    planFramework,
    totalDuration,
  } = buildDeterministicPlan(rawPlan, appState, baselineIntake, paceKey);

  return {
    taperingSchedule: schedule,
    estimatedSavings,
    planFramework,
    planCurrency: planCurrency ?? currencyFallback,
    totalDuration,
  };
};


const generatePlan = async (appState: AppState, currentIntake: number): Promise<GeneratedPlanDetails> => {
  const paceKey = getPaceKey(appState.quittingPace);
  const currencyHint = getCurrencyFallback(appState) ?? 'USD';
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const shouldRetryPlanGeneration = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }
  return error.message.toLowerCase().includes('ai plan');
};

const deriveErrorTips = (message: string | null): string[] => {
  if (!message) {
    return [];
  }

  const normalized = message.toLowerCase();
  const baseTips = [
    'Review the product amounts you entered and make sure they reflect ONE day, week, or month accurately.',
    'Verify nicotine strength values (mg per cigarette, puff, stick, or pouch) match the product you actually use.',
    'If you are unsure about nicotine strength, use the default values suggested in the form.'
  ];

  if (normalized.includes('cap') && normalized.includes('5mg')) {
    return [
      'Phase 4 must end at 5 mg per day or less. Reduce the nicotine strength or daily usage you entered so the AI can taper smoothly.',
      'Try selecting a slower quitting pace to allow a longer taper and lower daily targets.',
      ...baseTips,
    ];
  }

  return [
    'Temporarily switch to a slower quitting pace to give the AI more room to build a taper.',
    ...baseTips,
  ];
};

const requestPlanWithRetries = async (
  appState: AppState,
  currentIntake: number,
): Promise<GeneratedPlanDetails> => {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_PLAN_ATTEMPTS; attempt += 1) {
    try {
      return await generatePlan(appState, currentIntake);
    } catch (error) {
      lastError = error;
      if (attempt >= MAX_PLAN_ATTEMPTS || !shouldRetryPlanGeneration(error)) {
        throw error instanceof Error ? error : new Error('Plan generation failed');
      }
      await delay(250 * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Plan generation failed');
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
    totalNicotine += getDailyValue(cigarettes.amount, cigarettes.frequency) * getNicotineEstimate(appState, 'Cigarette');
  }
  if (vapes && vapes.puffs > 0) {
    totalNicotine += getDailyValue(vapes.puffs, vapes.frequency) * getNicotineEstimate(appState, 'Vape');
  }
  if (heatedTobacco && heatedTobacco.sticks > 0) {
    totalNicotine += getDailyValue(heatedTobacco.sticks, heatedTobacco.frequency) * getNicotineEstimate(appState, 'Heated Tobacco');
  }
  if (nicotinePouches && nicotinePouches.pouches > 0) {
    totalNicotine += getDailyValue(nicotinePouches.pouches, nicotinePouches.frequency) * getNicotineEstimate(appState, 'Nicotine Pouch');
  }

  return Math.round(totalNicotine);
};

export default function CreatingPlanScreen() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const router = useRouter();
  const { appState, setAppState, user, isStateLoaded } = useAppContext();
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
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Animation callback is called after completion, but we need to change
        // the message during the fade-out, not after
      });

      // Change message when fade reaches 0 (after 400ms)
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
      }, 400);
    }, 3000);

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
      const planDetails = await requestPlanWithRetries(appState, initialNicotineIntake);
      console.log('[Plan Generation] Deterministic plan response', {
        scheduleSample: planDetails.taperingSchedule.slice(0, 2),
        estimatedSavings: planDetails.estimatedSavings,
        totalDuration: planDetails.totalDuration,
      });

      const planGeneratedAt = new Date().toISOString();
      const planUpdatedAt = planGeneratedAt;
      const planStartDate = planGeneratedAt;
      const quitDateIso =
        planDetails.totalDuration > 0
          ? new Date(Date.now() + planDetails.totalDuration * MS_IN_DAY).toISOString()
          : null;

      const firstPhase = planDetails.taperingSchedule[0];
      const deterministicPrimaryTarget =
        firstPhase?.dailyTargetsMg?.[0] ??
        firstPhase?.nicotineGoalMg ??
        initialNicotineIntake;

      const planPrimaryTarget =
        typeof deterministicPrimaryTarget === 'number' && deterministicPrimaryTarget > 0
          ? Math.round(deterministicPrimaryTarget)
          : initialNicotineIntake;

      const resolvedInitialIntake =
        planPrimaryTarget > 0 ? planPrimaryTarget : initialNicotineIntake;

      const resolvedCurrency =
        planDetails.planCurrency ?? appState.planCurrency ?? getCurrencyFallback(appState);

      const basePreferences = (appState.preferences ??
        initialAppState.preferences ??
        {}) as NonNullable<AppState['preferences']>;
      const previousRevision =
        typeof appState.planRevision === 'number' && Number.isFinite(appState.planRevision)
          ? appState.planRevision
          : 0;
      const planRevision = previousRevision + 1;
      const activePlanId = `${user?.uid ?? 'anon'}:${planGeneratedAt}`;

      const planUpdate: Partial<AppState> = {
        taperingSchedule: planDetails.taperingSchedule,
        estimatedSavings: planDetails.estimatedSavings,
        totalDuration: planDetails.totalDuration,
        reductionInterval: 1,
        planFramework: planDetails.planFramework,
        planCurrency: resolvedCurrency,
        planGeneratedAt,
        planUpdatedAt,
        planStartDate,
        quitDate: quitDateIso,
        initialIntake: resolvedInitialIntake,
        primaryDailyTargetMg: planPrimaryTarget ?? resolvedInitialIntake,
        preferences: { ...basePreferences },
        isOnboardingComplete: false,
        planConfirmationPending: true,
        planRevision,
        activePlanId,
      };

      const nextPlanState: Partial<AppState> = {
        ...planUpdate,
        planUpdatedAt,
        planRevision,
        activePlanId,
        consumptionLog: [],
        consumptionHistory: [],
        goals: [],
        logs: [],
        aiSummary: null,
        planConfirmationPending: true,
        isOnboardingComplete: false,
      };
 
      setAppState(prev => ({
        ...prev,
        ...nextPlanState,
      }));
 
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          await setDoc(docRef, nextPlanState, { merge: true });
        } catch (error) {
          console.error('Failed to persist generated plan to Firestore', error);
        }
      }


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
      const friendlyMessage =
        error instanceof Error
          ? `Plan generation failed after ${MAX_PLAN_ATTEMPTS} attempts: ${error.message}`
          : `Plan generation failed after ${MAX_PLAN_ATTEMPTS} attempts.`;
      setErrorMessage(friendlyMessage);
      setIsGenerating(false);
    }
  }, [appState, router, setAppState, user]);

  useEffect(() => {
    if (!hasAttemptedGeneration && isStateLoaded) {
      setHasAttemptedGeneration(true);
      void attemptPlanGeneration();
    }
  }, [attemptPlanGeneration, hasAttemptedGeneration, isStateLoaded]);

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
          <ThemedText type="title" style={styles.errorTitle}>
            Unable to create your plan
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            We hit a temporary snag while personalizing your plan.
          </ThemedText>
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorMessage}>{errorMessage}</ThemedText>
            {deriveErrorTips(errorMessage).length > 0 && (
              <View style={styles.tipContainer}>
                <ThemedText style={styles.tipHeading}>How to resolve this:</ThemedText>
                {deriveErrorTips(errorMessage).map((tip, index) => (
                  <ThemedText key={`tip-${index}`} style={styles.tipItem}>
                    • {tip}
                  </ThemedText>
                ))}
              </View>
            )}
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
  errorTitle: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 26,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  tipContainer: {
    width: '100%',
    gap: 8,
  },
  tipHeading: {
    fontWeight: '700',
    color: '#B91C1C',
    textAlign: 'center',
  },
  tipItem: {
    color: '#7F1D1D',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'left',
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

