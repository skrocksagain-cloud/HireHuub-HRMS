import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY",
  authDomain: "hirehuub-hrms-86942.firebaseapp.com",
  projectId: "hirehuub-hrms-86942",
  storageBucket: "hirehuub-hrms-86942.firebasestorage.app",
  messagingSenderId: "818125102902",
  appId: "1:818125102902:web:389d157679d3cfb7ab9d97",
};

const app = initializeApp(firebaseConfig);

/**
 * Firestore
 */
export const db = getFirestore(app);

/**
 * Firebase Authentication
 */
export const auth = getAuth(app);

/**
 * Firebase Storage
 */
export const storage = getStorage(app);

/**
 * Firebase Functions
 */
export const functions = getFunctions(app);

if (
  typeof import.meta !== 'undefined' &&
  import.meta.env?.VITE_USE_EMULATOR === 'true' &&
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
) {
  if (!(functions as any)._emulatorConnected) {
    try {
      connectFunctionsEmulator(functions, 'localhost', 5001);
      (functions as any)._emulatorConnected = true;
    } catch {
      // Ignore if already connected
    }
  }
}

export default app;