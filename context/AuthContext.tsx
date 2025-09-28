import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { auth } from '../firebase/config'; // Ajuste o caminho conforme sua estrutura

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setUser(user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error: any) {
      // Tratar diferentes tipos de erro
      switch (error.code) {
        case 'auth/email-already-in-use':
          throw new Error('Este email já está em uso. Tente fazer login ou use outro email.');
        case 'auth/weak-password':
          throw new Error('A palavra-passe é muito fraca. Use pelo menos 6 caracteres.');
        case 'auth/invalid-email':
          throw new Error('Email inválido. Verifique o formato do email.');
        default:
          throw new Error(error.message || 'Erro ao criar conta. Tente novamente.');
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error: any) {
      switch (error.code) {
        case 'auth/user-not-found':
          throw new Error('Utilizador não encontrado. Verifique o email.');
        case 'auth/wrong-password':
          throw new Error('Palavra-passe incorreta.');
        case 'auth/invalid-email':
          throw new Error('Email inválido.');
        case 'auth/user-disabled':
          throw new Error('Esta conta foi desativada.');
        default:
          throw new Error(error.message || 'Erro ao fazer login. Tente novamente.');
      }
    }
  };

  const logOut = () => {
    return signOut(auth);
  };

  const value = {
    user,
    isLoading,
    signUp,
    signIn,
    logOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};