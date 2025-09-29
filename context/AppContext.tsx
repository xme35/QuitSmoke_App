import { createContext, useContext, useEffect, useState } from 'react';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface AppContextProps {
  logs: any[];
  goals: any;
  settings: any;
  addLog: (log: any) => void;
  updateGoals: (goals: any) => void;
  updateSettings: (settings: any) => void;
}

const AppContext = createContext<AppContextProps>({} as AppContextProps);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [goals, setGoals] = useState<any>({});
  const [settings, setSettings] = useState<any>({});
  const db = getFirestore();

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setLogs(data.logs || []);
          setGoals(data.goals || {});
          setSettings(data.settings || {});
        } else {
          // If no data, initialize with empty values
          await setDoc(docRef, { logs: [], goals: {}, settings: {} });
        }
      };

      fetchData();
    }
  }, [user]);

  const addLog = async (log: any) => {
    if (user) {
      const newLogs = [...logs, log];
      setLogs(newLogs);
      await setDoc(doc(db, 'users', user.uid), { logs: newLogs }, { merge: true });
    }
  };

  const updateGoals = async (newGoals: any) => {
    if (user) {
      setGoals(newGoals);
      await setDoc(doc(db, 'users', user.uid), { goals: newGoals }, { merge: true });
    }
  };

  const updateSettings = async (newSettings: any) => {
    if (user) {
      setSettings(newSettings);
      await setDoc(doc(db, 'users', user.uid), { settings: newSettings }, { merge: true });
    }
  };

  return (
    <AppContext.Provider value={{ logs, goals, settings, addLog, updateGoals, updateSettings }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
