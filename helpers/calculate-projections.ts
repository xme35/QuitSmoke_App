import { calculateLifeTimeGained, formatLifeTimeGained } from './calculate-lifetime-gained';

export type ProjectionRelativePosition = 'before-plan' | 'plan-end' | 'after-plan';

export interface ProjectionMilestone {
  label: string;
  days: number;
  moneySaved: string;
  lifeTimeGained: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isPlanEnd?: boolean; // Flag to identify plan end milestone
  relativePosition: ProjectionRelativePosition;
}

/**
 * Calculate future projections for money saved and lifetime gained
 * @param estimatedSavings - Total estimated savings when plan ends
 * @param totalDuration - Total plan duration in days
 * @param daysSinceStart - Days since plan started
 * @param age - User's age
 * @param smokingHistory - Years of smoking
 * @param initialIntake - Initial nicotine intake in mg
 * @param currencySymbol - Currency symbol (default €)
 * @returns Array of projection milestones
 */
export function calculateProjections(
  estimatedSavings: number | null | undefined,
  totalDuration: number | null | undefined,
  daysSinceStart: number,
  age: number | null | undefined,
  smokingHistory: number,
  initialIntake: number | null | undefined,
  currencySymbol: string = '€'
): ProjectionMilestone[] {
  if (!estimatedSavings || !totalDuration || totalDuration <= 0) {
    return [];
  }

  const planDurationDays = Math.max(1, Math.round(totalDuration));
  const dailySavings = estimatedSavings / planDurationDays;
  
  // Calculate total lifetime gained
  const totalYearsGainable = calculateLifeTimeGained(age, smokingHistory, initialIntake);
  const dailyLifeTimeGain = totalYearsGainable / planDurationDays;

  const baseMilestones: { label: string; days: number }[] = [
    { label: '1 Week', days: 7 },
    { label: '2 Weeks', days: 14 },
    { label: '1 Month', days: 30 },
    { label: '2 Months', days: 60 },
    { label: '3 Months', days: 90 },
    { label: '6 Months', days: 180 },
    { label: '1 Year', days: 365 },
    { label: '2 Years', days: 730 },
    { label: '3 Years', days: 1095 },
    { label: '5 Years', days: 1825 },
    { label: '10 Years', days: 3650 },
  ];

  const milestoneMap = new Map<number, { label: string; days: number }>();
  const addMilestone = (label: string, days: number) => {
    const normalizedDays = Math.round(days);
    if (normalizedDays <= 0) return;
    if (normalizedDays === planDurationDays) return;
    if (!milestoneMap.has(normalizedDays)) {
      milestoneMap.set(normalizedDays, { label, days: normalizedDays });
    }
  };

  baseMilestones.forEach(milestone => addMilestone(milestone.label, milestone.days));

  const fractionalMilestones = [
    { fraction: 0.25, label: '25% of Plan' },
    { fraction: 0.5, label: 'Halfway Point' },
    { fraction: 0.75, label: '75% of Plan' },
  ];

  fractionalMilestones.forEach(({ fraction, label }) => {
    const days = planDurationDays * fraction;
    if (days > 0 && days < planDurationDays) {
      addMilestone(label, days);
    }
  });

  const multiplierMilestones = [
    { multiplier: 1.25, label: '25% Beyond Goal' },
    { multiplier: 1.5, label: '50% Beyond Goal' },
    { multiplier: 2, label: 'Double Your Goal' },
  ];

  multiplierMilestones.forEach(({ multiplier, label }) => {
    const days = planDurationDays * multiplier;
    if (days > planDurationDays) {
      addMilestone(label, days);
    }
  });

  const sortedMilestones = Array.from(milestoneMap.values()).sort((a, b) => a.days - b.days);

  const planEndMilestone = {
    label: 'Plan End',
    days: planDurationDays,
    isPlanEnd: true,
  };

  const orderedMilestones = [
    ...sortedMilestones.filter(milestone => milestone.days < planDurationDays),
    planEndMilestone,
    ...sortedMilestones.filter(milestone => milestone.days > planDurationDays),
  ];

  const baseProjections = orderedMilestones.map(milestone => {
    const projectedMoney = dailySavings * milestone.days;
    const projectedLifeTime = dailyLifeTimeGain * milestone.days;
    const relativePosition: ProjectionRelativePosition =
      milestone.days < planDurationDays
        ? 'before-plan'
        : milestone.days > planDurationDays
        ? 'after-plan'
        : 'plan-end';
    
    return {
      label: milestone.label,
      days: milestone.days,
      moneySaved: `${currencySymbol}${projectedMoney.toFixed(2)}`,
      lifeTimeGained: formatLifeTimeGained(projectedLifeTime),
      isCompleted: daysSinceStart >= milestone.days,
      isCurrent: false,
      isPlanEnd: relativePosition === 'plan-end' ? true : undefined,
      relativePosition,
    };
  });

  const nextUpcomingDays = baseProjections.find(milestone => !milestone.isCompleted)?.days ?? null;

  return baseProjections.map(milestone => ({
    ...milestone,
    isCurrent: nextUpcomingDays !== null && milestone.days === nextUpcomingDays,
  }));
}

/**
 * Get the next milestone based on current progress
 */
export function getNextMilestone(
  projections: ProjectionMilestone[],
  daysSinceStart: number
): ProjectionMilestone | null {
  return projections.find(p => !p.isCompleted) || null;
}

/**
 * Calculate progress towards next milestone (0-100%)
 */
export function getProgressToNextMilestone(
  daysSinceStart: number,
  nextMilestone: ProjectionMilestone | null,
  previousMilestone: ProjectionMilestone | null
): number {
  if (!nextMilestone) return 100;
  
  const startDays = previousMilestone ? previousMilestone.days : 0;
  const endDays = nextMilestone.days;
  const range = endDays - startDays;
  
  if (range <= 0) return 0;
  
  const progress = ((daysSinceStart - startDays) / range) * 100;
  return Math.min(Math.max(0, progress), 100);
}