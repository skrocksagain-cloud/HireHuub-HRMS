import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

import { getFirestore } from "firebase/firestore";

import { getStorage } from "firebase/storage";

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

export default app;