import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  console.log("Checking project:", app.options.projectId);
  const email = "hh0005@hirehuub.local";
  const empId = "HH0005";
  
  let uid = null;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, "Password@123");
    uid = cred.user.uid;
    console.log("Created Firebase Auth user with UID:", uid);
  } catch(e) {
    if (e.code === 'auth/email-already-in-use') {
      console.log("User already exists in Firebase Auth. We will need to log in to get UID.");
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      try {
         const cred = await signInWithEmailAndPassword(auth, email, "Password@123");
         uid = cred.user.uid;
      } catch (err) {
         try {
           const cred2 = await signInWithEmailAndPassword(auth, email, "HireHuub@2026");
           uid = cred2.user.uid;
           const { updatePassword } = await import("firebase/auth");
           await updatePassword(cred2.user, "Password@123");
           console.log("Successfully reset password to Password@123");
         } catch (err2) {
           console.error("Failed to sign in to get UID:", err2.message);
           process.exit(1);
         }
      }
    } else {
      console.error("Failed to create auth user:", e.message);
      process.exit(1);
    }
  }

  const docRef = doc(db, 'employees', empId);
  const snap = await getDoc(docRef);
  
  if (snap.exists()) {
    console.log("Current Employee Data:", JSON.stringify(snap.data(), null, 2));
  }

  const data = {
    employeeId: empId,
    name: "Somnath Kayal",
    accountStatus: "Pending Activation",
    role: "Super Admin",
    email: email,
    firstLoginCompleted: false,
    mustChangePassword: true,
    firebaseUid: uid,
    failedLoginAttempts: 0,
    mobileVerified: false,
    updatedAt: new Date().toISOString()
  };

  if (!snap.exists()) {
    data.createdAt = new Date().toISOString();
    await setDoc(docRef, data);
  } else {
    data.passwordHash = null;
    data.tempPasswordHash = null;
    data.lockedUntil = null;
    data.lockReason = null;
    await updateDoc(docRef, data);
  }
  
  console.log(`Successfully provisioned ${empId} with UID ${uid}`);
  process.exit(0);
}

run().catch(console.error);
