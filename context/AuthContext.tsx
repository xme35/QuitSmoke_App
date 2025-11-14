import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { clearLoginStatus, setLoginStatus } from '@/helpers/login-status';

interface AuthContextType {
  user: User | null;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthReady: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const handleAuthChange = async (currentUser: User | null) => {
      setUser(currentUser);
      setIsAuthReady(true); // Só marca como pronto DEPOIS do Firebase responder

      try {
        if (currentUser) {
          await setLoginStatus(true);
        } else {
          await clearLoginStatus();
        }
      } catch (error) {
        console.warn('Failed to persist login flag', error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      void handleAuthChange(currentUser);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
