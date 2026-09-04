import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const auth = getAuth(app);
const db = getFirestore(app);

async function unlock() {
  try {
    // 1. Log in with the new password (this verifies the new password works!)
    const userCredential = await signInWithEmailAndPassword(auth, "hh0005@hirehuub.local", "[MY NEW PASSWORD]");
    console.log("Successfully logged in as HH0005! UID:", userCredential.user.uid);

    // 2. Update the Firestore record
    const empRef = doc(db, 'employees', 'HH0005');
    
    // Check if the document exists and read it
    const snap = await getDoc(empRef);
    if (!snap.exists()) {
      console.error("Employee document HH0005 not found.");
      process.exit(1);
    }
    console.log("Found employee document.");

    // Update the lock fields
    await updateDoc(empRef, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lockReason: null
    });
    
    console.log("Successfully unlocked HH0005 in Firestore.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

unlock();
