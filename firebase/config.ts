import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  type Auth,
  type Persistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyAtFCqj_bBPuvW3bXjCNrCiGXY9i6EXNEk",
  authDomain: "quitnicotine-b71e7.firebaseapp.com",
  projectId: "quitnicotine-b71e7",
  storageBucket: "quitnicotine-b71e7.firebasestorage.app",
  messagingSenderId: "498353605227",
  appId: "1:498353605227:web:a2b3d212fd2f120581bf2e",
  measurementId: "G-GRRTB3L9WC"
};

const app = initializeApp(firebaseConfig);

const STORAGE_AVAILABLE_KEY = '__sak';

const createReactNativePersistence = (storage: typeof AsyncStorage) => {
  const PersistenceClass = class {
    readonly type = 'LOCAL' as const;

    async _isAvailable(): Promise<boolean> {
      try {
        await storage.setItem(STORAGE_AVAILABLE_KEY, '1');
        await storage.removeItem(STORAGE_AVAILABLE_KEY);
        return true;
      } catch {
        return false;
      }
    }

    async _set(key: string, value: unknown): Promise<void> {
      await storage.setItem(key, JSON.stringify(value));
    }

    async _get<T = unknown>(key: string): Promise<T | null> {
      const json = await storage.getItem(key);
      return json ? (JSON.parse(json) as T) : null;
    }

    async _remove(key: string): Promise<void> {
      await storage.removeItem(key);
    }

    _addListener(): void {
      // Listeners não são suportados em AsyncStorage
    }

    _removeListener(): void {
      // Listeners não são suportados em AsyncStorage
    }
  };

  (PersistenceClass as unknown as { type: string }).type = 'LOCAL';

  return PersistenceClass;
};

let authInstance: Auth;

if (Platform.OS === 'web') {
  authInstance = getAuth(app);
} else {
  try {
    const persistence = createReactNativePersistence(AsyncStorage);
    authInstance = initializeAuth(app, {
      persistence: persistence as unknown as Persistence,
    });
  } catch (error) {
    console.warn(
      'Failed to initialize Firebase Auth with AsyncStorage persistence, falling back to default persistence.',
      error,
    );
    authInstance = getAuth(app);
  }
}

export const auth = authInstance;
export const db = getFirestore(app); // Banco de dados Firestore

export default app;
