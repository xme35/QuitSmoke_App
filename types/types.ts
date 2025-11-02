export enum ConsumptionType {
  VAPE = 'vape',
  CIGARETTE = 'cigarette',
  HEATED_TOBACCO = 'heated_tobacco',
  NICOTINE_POUCH = 'nicotine_pouch',
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
  phaseName: string;
  psychologicalRole: string;
  durationDays: number;
  nicotineGoalMg: number;
  totalReductionPercent: number;
  dailyTargetsMg: number[];
  notes?: string | null;
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
  nicotineStrengthMgPerMl: number; // For vape
  nicotineStrengthMgPerCigarette: number;
  nicotineStrengthMgPerHeatedTobacco: number;
  nicotineStrengthMgPerPouch: number; // Nicotine in a single pouch
  vapePuffsPerPod: number;
}