import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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
export const auth = getAuth(app);
export const db = getFirestore(app); // Banco de dados Firestore

export default app;
