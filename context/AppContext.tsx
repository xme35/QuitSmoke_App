
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

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
  planRevision?: number | null;
  planUpdatedAt?: string | null;
  activePlanId?: string | null;
  quitDate?: string | null;
  totalDuration?: number | null;
  reductionInterval?: number | null;
  estimatedSavings?: number | null;
  primaryDailyTargetMg?: number | null;
  taperingSchedule?: TaperingPhase[] | null;
  consumptionHistory?: ConsumptionRecord[] | null;
  consumptionLog?: ConsumptionLog[] | null;
  isOnboardingComplete?: boolean;
  planConfirmationPending?: boolean;
  aiSummary?: string | null;
  goals?: any[]; // Define more specifically if possible
  logs?: any[]; // Define more specifically if possible
  notificationsEnabled?: boolean;
  preferences?: {
    nicotineStrengthMgPerMl: number;
    vapePuffsPerPod: number;
    nicotineStrengthMgPerCigarette: number;
    nicotineStrengthMgPerHeatedTobacco: number;
    nicotineStrengthMgPerPouch: number;
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
  planRevision: 0,
  planUpdatedAt: null,
  activePlanId: null,
  isOnboardingComplete: false,
  planConfirmationPending: false,
  primaryDailyTargetMg: null,
  aiSummary: null,
  goals: [],
  logs: [],
  notificationsEnabled: false,
  preferences: {
    nicotineStrengthMgPerMl: 25,
    vapePuffsPerPod: 500,
    nicotineStrengthMgPerCigarette: 12,
    nicotineStrengthMgPerHeatedTobacco: 6,
    nicotineStrengthMgPerPouch: 8,
  },
};

const normalizeState = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(normalizeState);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce((acc, key) => {
        acc[key] = normalizeState((value as Record<string, unknown>)[key]);
        return acc;
      }, {} as Record<string, unknown>);
  }
  return value;
};

const serializeState = (state: AppState): string => {
  try {
    return JSON.stringify(normalizeState(state));
  } catch (error) {
    console.warn('Failed to serialize app state for comparison', error);
    return '';
  }
};

interface AppContextType {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  isLoading: boolean;
  isStateLoaded: boolean;
  user: User | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>(initialAppState);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const stateFingerprintRef = useRef<string>(serializeState(initialAppState));
  const lastSyncedStateRef = useRef<string>(serializeState(initialAppState));
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    stateFingerprintRef.current = serializeState(appState);
  }, [appState]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsLoading(true);
        setIsStateLoaded(false);
      } else {
        const serializedInitial = serializeState(initialAppState);
        stateFingerprintRef.current = serializedInitial;
        lastSyncedStateRef.current = serializedInitial;
        setAppState(initialAppState);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
 
    if (!user) {
      const serializedInitial = serializeState(initialAppState);
      lastSyncedStateRef.current = serializedInitial;
      stateFingerprintRef.current = serializedInitial;
      setAppState(initialAppState);
      setIsLoading(false);
      setIsStateLoaded(false);
      return;
    }
 
    setIsLoading(true);
    setIsStateLoaded(false);
 
    const docRef = doc(db, 'users', user.uid);
 
    const unsubscribe = onSnapshot(
      docRef,
      async (docSnap) => {
        try {
          if (docSnap.exists()) {
            const serverState = { ...initialAppState, ...docSnap.data() } as AppState;
            const serialized = serializeState(serverState);
            lastSyncedStateRef.current = serialized;
            if (stateFingerprintRef.current !== serialized) {
              setAppState(serverState);
            }
          } else {
            await setDoc(docRef, initialAppState);
            const serialized = serializeState(initialAppState);
            lastSyncedStateRef.current = serialized;
            if (stateFingerprintRef.current !== serialized) {
              setAppState(initialAppState);
            }
          }
        } catch (error) {
          console.error('Failed to process state snapshot from Firestore', error);
        } finally {
          setIsLoading(false);
          setIsStateLoaded(true);
        }
      },
      (error) => {
        console.error('Failed to subscribe to state changes in Firestore', error);
        setIsLoading(false);
        setIsStateLoaded(true);
      },
    );
 
    unsubscribeRef.current = unsubscribe;
 
    return () => {
      unsubscribe();
      unsubscribeRef.current = null;
    };
  }, [user]);

  useEffect(() => {
    if (!isLoading && user && isStateLoaded) {
      const persistState = async () => {
        const serialized = serializeState(appState);
        if (serialized === lastSyncedStateRef.current) {
          return;
        }
        const docRef = doc(db, 'users', user.uid);
        try {
          await setDoc(docRef, appState, { merge: true });
          lastSyncedStateRef.current = serialized;
        } catch (e) {
          console.warn("Failed to save state to Firestore", e);
        }
      };
      void persistState();
    }
  }, [appState, user, isLoading, isStateLoaded]);

  const contextValue = {
    appState,
    setAppState,
    isLoading,
    isStateLoaded,
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
