import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { StyleSheet, View, TouchableOpacity, Animated } from 'react-native';
import { Colors } from '../../constants/theme';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { AppState, useAppContext, TaperingPhase, Frequency, initialAppState } from '../../context/AppContext';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NICOTINE_ESTIMATES } from '../../data/constants';
import { setOnboardingStatus } from '@/helpers/onboarding-status';

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


const validateDailyTargetsStrict = (
  phaseLabel: string,
  candidateTargets: unknown,
  duration: number,
  phaseStartMg: number,
  cap?: number,
): number[] => {
  if (!Array.isArray(candidateTargets)) {
    throw new Error(`AI plan is missing dailyTargetsMg for ${phaseLabel}`);
  }
  const sanitized = (candidateTargets as unknown[]).map((value, index) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      throw new Error(`AI plan contains an invalid daily target at day ${index + 1} of ${phaseLabel}`);
    }
    return Math.max(0, Math.round(numeric));
  });
  if (sanitized.length !== duration) {
    throw new Error(
      `AI plan provided ${sanitized.length} daily targets for ${phaseLabel}, expected ${duration}`,
    );
  }
  const roundedStart = Math.max(0, Math.round(phaseStartMg));
  sanitized[0] = Math.min(sanitized[0], roundedStart);
  for (let i = 1; i < sanitized.length; i += 1) {
    sanitized[i] = Math.min(sanitized[i], sanitized[i - 1]);
  }
  if (typeof cap === 'number') {
    const roundedCap = Math.round(cap);
    let exceededCap = false;
    for (let i = 0; i < sanitized.length; i += 1) {
      if (sanitized[i] > roundedCap) {
        exceededCap = true;
        sanitized[i] = roundedCap;
      }
      sanitized[i] = Math.min(sanitized[i], roundedCap);
    }
    if (exceededCap) {
      console.warn(`Daily targets exceeded cap (${roundedCap}mg) in ${phaseLabel}. Values were clamped to the cap.`);
    }
  }
  const finalValue = sanitized[sanitized.length - 1];
  if (finalValue > roundedStart) {
    throw new Error(`Final target for ${phaseLabel} (${finalValue}mg) cannot exceed its start level`);
  }
  return sanitized;
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
      const mgPerMl = preferences.nicotineStrengthMgPerMl;
      const puffsPerPod = preferences.vapePuffsPerPod;
      if (Number.isFinite(mgPerMl) && Number.isFinite(puffsPerPod) && puffsPerPod && mgPerMl) {
        const assumedMlPerPod = 2; // Align with dashboard calculations
        const perPuff = (mgPerMl * assumedMlPerPod) / puffsPerPod;
        return Number.isFinite(perPuff) && perPuff > 0 ? perPuff : fallback;
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

const formatPercentRange = (range: [number, number]) => `${Math.round(range[0] * 100)}-${Math.round(range[1] * 100)}%`;

const formatDurationRange = (range: [number, number]) => `${range[0]}-${range[1]} days`;

const buildPlanPrompt = (
  appState: AppState,
  currentIntake: number,
  paceKey: PaceKey,
  currencyHint: string,
): string => {
  const { age, countryName, sources, smokingHistory, quittingPace, cigarettes, vapes, heatedTobacco, nicotinePouches } = appState;

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
      `Cigarettes: ${cigarettes.amount} per ${cigarettes.frequency} (avg ${daily.toFixed(1)}/day, ~${formatNicotineValue(getNicotineEstimate(appState, 'Cigarette'))}mg nicotine each)`
    );
  }
  if (vapes && vapes.puffs > 0) {
    const daily = normalizeDailyAmount(vapes.puffs, vapes.frequency);
    usageSummaries.push(
      `Vape: ${vapes.puffs} puffs per ${vapes.frequency} (avg ${daily.toFixed(0)} puffs/day, ~${formatNicotineValue(getNicotineEstimate(appState, 'Vape'))}mg nicotine per puff)`
    );
  }
  if (heatedTobacco && heatedTobacco.sticks > 0) {
    const daily = normalizeDailyAmount(heatedTobacco.sticks, heatedTobacco.frequency);
    usageSummaries.push(
      `Heated Tobacco: ${heatedTobacco.sticks} sticks per ${heatedTobacco.frequency} (avg ${daily.toFixed(1)}/day, ~${formatNicotineValue(getNicotineEstimate(appState, 'Heated Tobacco'))}mg nicotine each)`
    );
  }
  if (nicotinePouches && nicotinePouches.pouches > 0) {
    const daily = normalizeDailyAmount(nicotinePouches.pouches, nicotinePouches.frequency);
    usageSummaries.push(
      `Nicotine Pouches: ${nicotinePouches.pouches} per ${nicotinePouches.frequency} (avg ${daily.toFixed(1)}/day, ~${formatNicotineValue(getNicotineEstimate(appState, 'Nicotine Pouch'))}mg nicotine each)`
    );
  }

  const usageDetails = usageSummaries.length > 0
    ? usageSummaries.map(s => `  - ${s}`).join('\n')
    : '  - No usage data provided';

  const phaseGuidance = PHASE_BLUEPRINT.map((blueprint) => {
    const percentRange = formatPercentRange(blueprint.percentRange);
    const durationRange = formatDurationRange(blueprint.durationRange);
    const paceDefault = blueprint.fallbackDuration[paceKey];
    return `Phase ${blueprint.phase} "${blueprint.phaseName}": role = ${blueprint.psychologicalRole} | reduction ${percentRange} | duration ${durationRange} (pace default ${paceDefault} days).`;
  }).join('\n');

  const sourcesList = sources?.length ? sources.join(', ') : 'not provided';
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
- Phases 1 through 4 must progressively reduce nicotine. Each phase must reduce more than the previous one.
- Phase 4 must finish at exactly 0 mg/day and should never exceed 5 mg on any day.
- Phase 5 is a consolidation phase: totalReductionPercent = 0, dailyTargetsMg = all zeros, nicotineGoalMg = 0.
- Use null (not strings) when data is unavailable.
- Set planFramework to "five-phase-structured".
- Set currency to an ISO code when possible (e.g., "${currencyHint}").
- Self-validate before responding: durations > 0, phases sequential, dailyTargets length matches duration, nicotineGoalMg equals the last daily target.

Product usage details:
${usageDetails}

Pricing and savings calculation:
- Estimate typical LOCAL retail prices for each nicotine product as sold in ${countryName ?? 'the user\'s country'}.
- Prices should reflect current market conditions in ${countryName ?? 'this country'}, including local taxes and regulations.
- All prices and savings must be in ${currencyHint} (the local currency of ${countryName ?? 'the selected country'}).
- Calculate total savings over the plan duration based on:
  * Current daily consumption of each product
  * Typical cost per unit (pack/pod/pouch) in local market
  * Gradual reduction in consumption throughout the tapering schedule
- Provide a realistic, evidence-based savings estimate.
- Use your knowledge of typical product pricing in ${countryName ?? 'this country'} - no currency conversion needed.

User data:
- Current daily nicotine intake: ${currentIntake} mg
- Age: ${age ?? 'not provided'}
- Country: ${countryName ?? 'not provided'}
- Currency: ${currencyHint}
- Products used: ${sourcesList}
- Smoking history: ${smokingHistory ?? 'not provided'}
- Quitting pace preference: ${paceLabel}

Example response structure (do NOT copy these values - calculate based on actual user data and country-specific pricing):
{
  "planFramework": "five-phase-structured",
  "currency": "${currencyHint}",
  "estimatedSavings": 450,
  "taperingSchedule": [
    {
      "phase": 1,
      "phaseName": "Initial Adaptation",
      "psychologicalRole": "Build awareness and stabilize routines.",
      "durationDays": 10,
      "totalReductionPercent": 0.120,
      "nicotineGoalMg": 176,
      "dailyTargetsMg": [198, 196, 194, 192, 190, 188, 186, 184, 180, 176],
      "notes": "Track triggers and swap one small habit."
    },
    {
      "phase": 2,
      "phaseName": "Adjustment to Weaning",
      "psychologicalRole": "Strengthen control with structured substitutions.",
      "durationDays": 14,
      "totalReductionPercent": 0.364,
      "nicotineGoalMg": 112,
      "dailyTargetsMg": [176, 172, 168, 164, 160, 156, 152, 148, 144, 140, 136, 132, 128, 112],
      "notes": "Daily accountability check-ins."
    },
    {
      "phase": 3,
      "phaseName": "Control Reinforcement",
      "psychologicalRole": "Reinforce confidence via coping scripts.",
      "durationDays": 18,
      "totalReductionPercent": 0.643,
      "nicotineGoalMg": 40,
      "dailyTargetsMg": [112, 108, 104, 100, 96, 92, 88, 84, 80, 76, 72, 68, 64, 60, 56, 52, 46, 40],
      "notes": "Rehearse responses to cravings."
    },
    {
      "phase": 4,
      "phaseName": "Almost Free",
      "psychologicalRole": "Prepare for a nicotine-free life.",
      "durationDays": 21,
      "totalReductionPercent": 1.000,
      "nicotineGoalMg": 0,
      "dailyTargetsMg": [40, 38, 36, 34, 32, 30, 28, 26, 24, 22, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2, 0],
      "notes": "Relapse prevention rehearsal."
    },
    {
      "phase": 5,
      "phaseName": "Nicotine-Free Consolidation",
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
  const reductionTracker: Record<number, number> = {};

  PHASE_BLUEPRINT.forEach((blueprint) => {
    const phaseLabel = `phase ${blueprint.phase} (${blueprint.phaseName})`;
    const candidate = Array.isArray(rawPlan?.taperingSchedule)
      ? rawPlan.taperingSchedule.find((phase: any) => phase?.phase === blueprint.phase)
      : undefined;

    if (!candidate) {
      throw new Error(`AI plan is missing ${phaseLabel}`);
    }

    const rawDuration = Number(candidate.durationDays);
    if (!Number.isFinite(rawDuration)) {
      throw new Error(`AI plan did not specify durationDays for ${phaseLabel}`);
    }
    const roundedDuration = Math.round(rawDuration);
    if (roundedDuration < blueprint.durationRange[0] || roundedDuration > blueprint.durationRange[1]) {
      throw new Error(
        `durationDays for ${phaseLabel} must be between ${blueprint.durationRange[0]} and ${blueprint.durationRange[1]} (received ${roundedDuration})`,
      );
    }
    const duration = roundedDuration;

    if (typeof blueprint.stabilizationTargetMg === 'number') {
      const target = Math.max(0, Math.round(blueprint.stabilizationTargetMg));
      const stableTargets = validateDailyTargetsStrict(
        phaseLabel,
        candidate.dailyTargetsMg,
        duration,
        phaseStartMg,
        blueprint.stabilizationTargetMg,
      );

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
        nicotineGoalMg: stableTargets[stableTargets.length - 1],
        totalReductionPercent: 0,
        dailyTargetsMg: stableTargets,
        notes:
          typeof candidate?.notes === 'string' && candidate.notes.trim().length
            ? candidate.notes.trim()
            : blueprint.defaultNotes,
      });

      phaseStartMg = stableTargets[stableTargets.length - 1];
      return;
    }

    const sanitizedTargets = validateDailyTargetsStrict(
      phaseLabel,
      candidate.dailyTargetsMg,
      duration,
      phaseStartMg,
      blueprint.targetCapMg,
    );
    if (typeof blueprint.forceFinalMg === 'number') {
      const forcedFinal = Math.max(0, Math.round(blueprint.forceFinalMg));
      sanitizedTargets[sanitizedTargets.length - 1] = forcedFinal;
    }
    const nicotineGoalMg = sanitizedTargets[sanitizedTargets.length - 1];
    const reductionPercentRaw = computePhaseReductionPercent(Math.max(0, phaseStartMg), nicotineGoalMg);
    const reductionPercent = Number(reductionPercentRaw.toFixed(3));

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
      totalReductionPercent: reductionPercent,
      dailyTargetsMg: sanitizedTargets,
      notes:
        typeof candidate?.notes === 'string' && candidate.notes.trim().length
          ? candidate.notes.trim()
          : blueprint.defaultNotes,
    });
 
    reductionTracker[blueprint.phase] = reductionPercentRaw;
    phaseStartMg = nicotineGoalMg;
  });

  const requiredPhases = [1, 2, 3, 4] as const;
  const phaseFour = schedule.find((phase) => phase.phase === 4);
  if (!phaseFour || phaseFour.nicotineGoalMg !== 0) {
    throw new Error('AI plan must reduce to 0 mg by the end of phase 4.');
  }
  for (let i = 1; i < requiredPhases.length; i += 1) {
    const prevPhase = requiredPhases[i - 1];
    const currentPhase = requiredPhases[i];
    const prevReduction = reductionTracker[prevPhase];
    const currentReduction = reductionTracker[currentPhase];
    if (typeof prevReduction !== 'number' || typeof currentReduction !== 'number') {
      throw new Error('AI plan must include phases 1 through 4 with valid reduction percentages.');
    }
    if (currentReduction <= prevReduction + 0.005) {
      throw new Error(`Phase ${currentPhase} must reduce more nicotine than phase ${prevPhase}.`);
    }
  }
 
  const totalDuration = schedule.reduce((sum, phase) => sum + phase.durationDays, 0);
  
  // Use AI-provided savings or fall back to estimation
  const aiSavings = sanitizeInteger(rawPlan?.estimatedSavings, 0, 0);
  const fallbackSavings = estimateFallbackSavings(appState, totalDuration);
  const finalSavings = aiSavings > 0 ? aiSavings : fallbackSavings;

  return {
    taperingSchedule: schedule,
    estimatedSavings: finalSavings,
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
  const { appState, setAppState, user } = useAppContext();
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

      const planGeneratedAt = new Date().toISOString();
      const planStartDate = planGeneratedAt;
      const quitDateIso =
        planDetails.totalDuration > 0
          ? new Date(Date.now() + planDetails.totalDuration * MS_IN_DAY).toISOString()
          : null;
      const firstPhase = planDetails.taperingSchedule[0];
      const firstDailyTarget = firstPhase?.dailyTargetsMg?.[0];
      const fallbackPhaseTarget =
        typeof firstPhase?.nicotineGoalMg === 'number' ? firstPhase.nicotineGoalMg : null;
      const planPrimaryTarget =
        typeof firstDailyTarget === 'number'
          ? firstDailyTarget
          : fallbackPhaseTarget ?? null;
      const resolvedInitialIntake =
        (planPrimaryTarget ?? 0) > 0
          ? (planPrimaryTarget as number)
          : initialNicotineIntake > 0
            ? initialNicotineIntake
            : fallbackPhaseTarget ?? initialNicotineIntake;

      setAppState((prev) => {
        const resolvedCurrency =
          planDetails.planCurrency ?? prev.planCurrency ?? getCurrencyFallback(prev);

        const basePreferences = (initialAppState.preferences ??
          prev.preferences ??
          {}) as NonNullable<AppState['preferences']>;
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
          initialIntake: resolvedInitialIntake,
          primaryDailyTargetMg: planPrimaryTarget ?? resolvedInitialIntake,
          preferences: basePreferences,
          isOnboardingComplete: true,
        };
      });

      await setOnboardingStatus(true, user?.uid);

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

