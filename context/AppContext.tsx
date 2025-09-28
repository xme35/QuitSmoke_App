import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Log, UserPreference, Goal, ConsumptionType } from '../types/types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext'; // Import the useAuth hook

const initialGoals: Goal[] = [];

const initialPreferences: UserPreference = {
  defaultConsumptionType: ConsumptionType.VAPE,
  nicotineStrengthMgPerMl: 3,
  nicotineStrengthMgPerCigarette: 12,
  nicotineStrengthMgPerHeatedTobacco: 6,
  nicotineStrengthMgPerPatch: 21,
  dailyNicotineGoalMg: 30,
  costPerPack: 20,
  cigarettesPerPack: 20,
  costPerVapePod: 12,
  vapePuffsPerPod: 500,
  costPerHeatedTobaccoPack: 18,
  heatedTobaccoSticksPerPack: 20,
  costPerPatch: 5,
  baselineDailyCigarettes: 10,
  baselineDailyPuffs: 50,
  baselineDailyHeatedTobacco: 10,
  baselineDailyPatches: 1,
};

interface AppContextType {
  logs: Log[];
  preferences: UserPreference;
  goals: Goal[];
  isOnboardingComplete: boolean;
  aiSummary: string;
  isSummaryLoading: boolean;
  summaryError: string;
  addLog: (type: ConsumptionType) => void;
  setPreferences: (prefs: UserPreference) => void;
  setGoals: (goals: Goal[]) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => Promise<void>;
  generateAiSummary: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const { user } = useAuth(); // Get the authenticated user
  const db = getFirestore();

  const [logs, setLogs] = useState<Log[]>([]);
  const [preferences, setPreferencesState] = useState<UserPreference>(initialPreferences);
  const [goals, setGoalsState] = useState<Goal[]>(initialGoals);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  useEffect(() => {
    const loadState = async () => {
      if (!user) { // If there is no user, do not load anything
        setIsLoading(false);
        return;
      }
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setLogs(data.logs || []);
          setPreferencesState(data.preferences || initialPreferences);
          setGoalsState(data.goals || []);
          setIsOnboardingComplete(data.isOnboardingComplete || false);
          setAiSummary(data.aiSummary || '');
        } else {
          // If the document does not exist, it might be a new user.
          // The initial state is already set.
        }

      } catch (error) {
        console.error("Failed to load state from Firestore", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadState();
  }, [user, db]);

  useEffect(() => {
    if (!isLoading && user) {
      const userDocRef = doc(db, 'users', user.uid);
      const dataToSave = { logs, preferences, goals, isOnboardingComplete, aiSummary };
      setDoc(userDocRef, dataToSave, { merge: true });
    }
  }, [logs, preferences, goals, isOnboardingComplete, aiSummary, isLoading, user, db]);

  const addLog = (type: ConsumptionType) => {
    let nicotineMg = 0;
    switch (type) {
      case ConsumptionType.VAPE: nicotineMg = preferences.nicotineStrengthMgPerMl * 0.05; break;
      case ConsumptionType.CIGARETTE: nicotineMg = preferences.nicotineStrengthMgPerCigarette; break;
      case ConsumptionType.HEATED_TOBACCO: nicotineMg = preferences.nicotineStrengthMgPerHeatedTobacco; break;
      case ConsumptionType.PATCH: nicotineMg = preferences.nicotineStrengthMgPerPatch; break;
    }
    const newLog: Log = { id: new Date().toISOString(), type, count: 1, nicotineMg, timestamp: new Date().toISOString() };
    setLogs(prev => [newLog, ...prev]);
  };

  const setPreferences = (prefs: UserPreference) => setPreferencesState(prefs);
  const setGoals = (goals: Goal[]) => setGoalsState(goals);
  const completeOnboarding = () => setIsOnboardingComplete(true);

  const resetOnboarding = async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        logs: [],
        preferences: initialPreferences,
        goals: [],
        isOnboardingComplete: false,
        aiSummary: '',
      });
      setLogs([]);
      setPreferencesState(initialPreferences);
      setGoalsState(initialGoals);
      setAiSummary('');
      setIsOnboardingComplete(false);
    } catch (error) {
      console.error("Failed to reset onboarding state in Firestore", error);
    }
  };

  const generateAiSummary = async () => {
    setIsSummaryLoading(true);
    setSummaryError('');
    try {
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API key not found");
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro"});

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentLogsSummary = logs
          .filter(log => new Date(log.timestamp) > oneWeekAgo)
          .map(log => ` - ${log.type.replace('_', ' ')} on ${new Date(log.timestamp).toLocaleDateString()}`)
          .join('\n');

      const prompt = `You are a supportive and motivational coach helping a user quit nicotine. Analyze the user's progress and provide a brief, encouraging summary and one actionable tip. The user's language is Portuguese. Keep the tone positive and forward-looking. Respond with a short paragraph (2-4 sentences). Start with a positive affirmation, then give the summary, and end with one clear, actionable tip for the upcoming week. Do not use markdown formatting. Recent activity (last 7 days):\n${recentLogsSummary || "No logs in the last week."}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      setAiSummary(text);

    } catch (error) {
      console.error("AI summary generation failed:", error);
      setSummaryError("Couldn't generate summary. Please try again.");
    } finally {
      setIsSummaryLoading(false);
    }
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <AppContext.Provider value={{ logs, preferences, goals, isOnboardingComplete, addLog, setPreferences, setGoals, completeOnboarding, resetOnboarding, aiSummary, isSummaryLoading, summaryError, generateAiSummary }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
