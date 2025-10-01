
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CountryCode } from 'react-native-country-picker-modal';

interface AppState {
  name: string | null;
  age: number | null;
  country: CountryCode | null;
  sources: string[] | null;
  cigarettes: { amount: number; type: string; } | null;
  vapes: { puffs: number; strength: string; } | null;
  heatedTobacco: { sticks: number; } | null;
  nicotinePouches: { pouches: number; strength: string; } | null;
  duration: string | null;
  quittingPace: string | null;
  motivation: string | null;
  quitDate: string | null;
}

interface AppContextType {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>({
    name: null,
    age: null,
    country: null,
    sources: null,
    cigarettes: null,
    vapes: null,
    heatedTobacco: null,
    nicotinePouches: null,
    duration: null,
    quittingPace: null,
    motivation: null,
    quitDate: null,
  });

  return (
    <AppContext.Provider value={{ appState, setAppState }}>
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
