export enum ConsumptionType {
  VAPE = 'VAPE',
  CIGARETTE = 'CIGARETTE',
  HEATED_TOBACCO = 'HEATED_TOBACCO',
  PATCH = 'PATCH',
}

export interface Log {
  id: string;
  type: ConsumptionType;
  count: number;
  nicotineMg: number;
  timestamp: string;
}

export interface Goal {
  id: string;
  description: string;
  completed: boolean;
}

export interface UserPreference {
  defaultConsumptionType: ConsumptionType;
  nicotineStrengthMgPerMl: number;
  nicotineStrengthMgPerCigarette: number;
  nicotineStrengthMgPerHeatedTobacco: number;
  nicotineStrengthMgPerPatch: number;
  dailyNicotineGoalMg: number;
  costPerPack: number;
  cigarettesPerPack: number;
  costPerVapePod: number;
  vapePuffsPerPod: number;
  costPerHeatedTobaccoPack: number;
  heatedTobaccoSticksPerPack: number;
  costPerPatch: number;
  baselineDailyCigarettes: number;
  baselineDailyPuffs: number;
  baselineDailyHeatedTobacco: number;
  baselineDailyPatches: number;
}