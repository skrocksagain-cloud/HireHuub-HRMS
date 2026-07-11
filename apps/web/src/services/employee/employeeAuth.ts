import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "../../firebase/firebase";

/**
 * Create Firebase Authentication login
 * for an internal HireHuub employee.
 */
export async function createEmployeeLogin(
  employeeDocId: string,
  employeeName: string,
  officialEmail: string,
  temporaryPassword: string
): Promise<void> {
  const credential =
    await createUserWithEmailAndPassword(
      auth,
      officialEmail,
      temporaryPassword
    );

  await updateProfile(credential.user, {
    displayName: employeeName,
  });

  await updateDoc(
    doc(db, "employees", employeeDocId),
    {
      authUid: credential.user.uid,

      loginCreated: true,

      loginCreatedAt: serverTimestamp(),

      updatedAt: serverTimestamp(),
    }
  );
}

/**
 * Send Password Reset Email
 */
export async function sendEmployeePasswordReset(
  email: string
): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Generate Temporary Password
 *
 * Example:
 * HH000001@2026
 */
export function generateTemporaryPassword(
  employeeId: string
): string {
  const year = new Date().getFullYear();

  return `${employeeId}@${year}`;
}