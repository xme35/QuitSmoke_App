import { initializeApp } from 'firebase/app';
import { 
  initializeAuth, 
  // @ts-ignore - Bug conhecido do Firebase v10+
  getReactNativePersistence 
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// https://firebase.google.com/docs/web/setup#available-libraries

export const firebaseConfig = {
  apiKey: "AIzaSyAtFCqj_bBPuvW3bXjCNrCiGXY9i6EXNEk",
  authDomain: "quitnicotine-b71e7.firebaseapp.com",
  projectId: "quitnicotine-b71e7",
  storageBucket: "quitnicotine-b71e7.firebasestorage.app",
  messagingSenderId: "498353605227",
  appId: "1:498353605227:web:a2b3d212fd2f120581bf2e",
  measurementId: "G-GRRTB3L9WC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence (usando workaround)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export default app;