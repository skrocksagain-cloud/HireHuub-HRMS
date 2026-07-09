import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY",
  authDomain: "hirehuub-hrms-86942.firebaseapp.com",
  projectId: "hirehuub-hrms-86942",
  storageBucket: "hirehuub-hrms-86942.firebasestorage.app",
  messagingSenderId: "818125102902",
  appId: "1:818125102902:web:389d157679d3cfb7ab9d97",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;