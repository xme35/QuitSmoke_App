
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// ----- TYPE DEFINITIONS -----

export type Frequency = 'day' | 'week' | 'month';

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

export interface ConsumptionLog {
  product: string;
  timestamp: string; // ISO 8601 format
}

export interface ConsumptionRecord {
  date: string;
  nicotineAmount: number;
  cravings: number;
}

// Corrected AppState interface including the preferences object
export interface AppState {
  name: string | null;
  age: number | null;
  countryCode: string | null;
  countryName: string | null;
  currencyCode: string | null;
  currencySymbol: string | null;
  sources: string[] | null;
  smokingHistory: string | null;
  cigarettes: { amount: number; frequency: Frequency; } | null;
  vapes: { puffs: number; frequency: Frequency; } | null;
  heatedTobacco: { sticks: number; frequency: Frequency; } | null;
  nicotinePouches: { pouches: number; frequency: Frequency; } | null;
  duration: string | null;
  quittingPace: string | null;
  motivation: string[] | null;
  initialIntake?: number | null;
  planStartDate?: string | null;
  planGeneratedAt?: string | null;
  planFramework?: string | null;
  planCurrency?: string | null;
  quitDate?: string | null;
  totalDuration?: number | null;
  reductionInterval?: number | null;
  estimatedSavings?: number | null;
  taperingSchedule?: TaperingPhase[] | null;
  consumptionHistory?: ConsumptionRecord[] | null;
  consumptionLog?: ConsumptionLog[] | null;
  isOnboardingComplete?: boolean;
  aiSummary?: string;
  goals?: any[]; // Define more specifically if possible
  logs?: any[]; // Define more specifically if possible
  preferences?: {
    baselineDailyPuffs: number;
    costPerVapePod: number;
    defaultConsumptionType: string;
    heatedTobaccoSticksPerPack: number;
    baselineDailyHeatedTobacco: number;
    nicotineStrengthMgPerMl: number;
    vapePuffsPerPod: number;
    baselineDailyCigarettes: number;
    costPerPack: number;
    cigarettesPerPack: number;
    nicotineStrengthMgPerCigarette: number;
    nicotineStrengthMgPerPouch: number;
    costPerPouch: number;
    costPerHeatedTobaccoPack: number;
    nicotineStrengthMgPerHeatedTobacco: number;
    dailyNicotineGoalMg: number;
    baselineDailyPouches: number;
  };
}

// Corrected initial state to ensure preferences is always defined
export const initialAppState: AppState = {
  name: null,
  age: null,
  countryCode: null,
  countryName: null,
  currencyCode: null,
  currencySymbol: null,
  sources: [],
  smokingHistory: null,
  cigarettes: { amount: 0, frequency: 'day' },
  vapes: { puffs: 0, frequency: 'day' },
  heatedTobacco: { sticks: 0, frequency: 'day' },
  nicotinePouches: { pouches: 0, frequency: 'day' },
  duration: null,
  quittingPace: null,
  motivation: [],
  initialIntake: null,
  planStartDate: null,
  quitDate: null,
  taperingSchedule: null,
  consumptionHistory: [],
  consumptionLog: [],
  totalDuration: null,
  reductionInterval: null,
  planGeneratedAt: null,
  planFramework: null,
  planCurrency: null,
  isOnboardingComplete: false,
  aiSummary: "",
  goals: [],
  logs: [],
  preferences: {
    baselineDailyPuffs: 0,
    costPerVapePod: 12,
    defaultConsumptionType: "VAPE",
    heatedTobaccoSticksPerPack: 20,
    baselineDailyHeatedTobacco: 0,
    nicotineStrengthMgPerMl: 3,
    vapePuffsPerPod: 500,
    baselineDailyCigarettes: 0,
    costPerPack: 20,
    cigarettesPerPack: 20,
    nicotineStrengthMgPerCigarette: 12,
    nicotineStrengthMgPerPouch: 21,
    costPerPouch: 5,
    costPerHeatedTobaccoPack: 18,
    nicotineStrengthMgPerHeatedTobacco: 6,
    dailyNicotineGoalMg: 30,
    baselineDailyPouches: 1,
  },
};

// (The rest of the file remains the same)

interface AppContextType {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  isLoading: boolean;
  user: User | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>(initialAppState);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsLoading(true);
        setIsStateLoaded(false);
      } else {
        setAppState(initialAppState);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && !isStateLoaded) {
      const loadState = async () => {
        const docRef = doc(db, 'users', user.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const loadedState = { ...initialAppState, ...docSnap.data() };
            setAppState(loadedState);
          } else {
            await setDoc(docRef, initialAppState); // Create initial state in DB if it doesn't exist
            setAppState(initialAppState);
          }
        } catch (e) {
          console.error("Failed to load state from Firestore", e);
          setAppState(initialAppState);
        } finally {
          setIsLoading(false);
          setIsStateLoaded(true);
        }
      };
      loadState();
    } else if (!user) {
        setIsLoading(false);
    }
  }, [user, isStateLoaded]);

  useEffect(() => {
    if (!isLoading && user && isStateLoaded) {
      const saveState = async () => {
        const docRef = doc(db, 'users', user.uid);
        try {
          await setDoc(docRef, appState, { merge: true });
        } catch (e) {
          console.error("Failed to save state to Firestore", e);
        }
      };
      saveState();
    }
  }, [appState, user, isLoading, isStateLoaded]);

  const contextValue = {
    appState,
    setAppState,
    isLoading,
    user,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
