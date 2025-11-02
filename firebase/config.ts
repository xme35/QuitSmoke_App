import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
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

let authInstance: Auth;

if (Platform.OS === 'web') {
  authInstance = getAuth(app);
} else {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const { getReactNativePersistence } = require('firebase/auth/react-native');
    const persistence = getReactNativePersistence(AsyncStorage);
    authInstance = initializeAuth(app, {
      persistence,
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
