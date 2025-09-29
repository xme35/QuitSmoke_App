export enum ConsumptionType {
  VAPE = 'vape',
  CIGARETTE = 'cigarette',
  HEATED_TOBACCO = 'heated_tobacco',
  PATCH = 'patch',
}

export interface Log {
  id: string;
  type: ConsumptionType;
  count: number;
  nicotineMg: number;
  timestamp: string;
}

export enum GoalType {
  LIMIT_PER_DAY = 'limit_per_day',
  QUIT_BY_DATE = 'quit_by_date',
}

export interface TaperingPhase {
  phase: number;
  durationDays: number;
  nicotineGoalMg: number;
}

export interface Goal {
  id:string;
  type: GoalType;
  targetValue?: number; // For LIMIT_PER_DAY (nicotine mg)
  endDate?: string; // For QUIT_BY_DATE
  startDate: string;
  isActive: boolean;
  taperingSchedule?: TaperingPhase[];
}

export interface UserPreference {
  defaultConsumptionType: ConsumptionType;
  nicotineStrengthMgPerMl: number; // For vape
  nicotineStrengthMgPerCigarette: number;
  nicotineStrengthMgPerHeatedTobacco: number;
  nicotineStrengthMgPerPatch: number; // Nicotine in a single patch
  dailyNicotineGoalMg: number;
  costPerPack: number;
  cigarettesPerPack: number;
  costPerVapePod: number;
  vapePuffsPerPod: number;
  costPerHeatedTobaccoPack: number;
  heatedTobaccoSticksPerPack: number;
  costPerPatch: number;
  baselineDailyCigarettes: number; // For money saved calculation
  baselineDailyPuffs: number; // For money saved calculation
  baselineDailyHeatedTobacco: number;
  baselineDailyPatches: number;
}