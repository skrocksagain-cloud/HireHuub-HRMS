import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();
const adminAuth = getAuth();

export interface CreateErpTokenRequestPayload {
  sessionId: string;
}

export interface CreateErpTokenResponsePayload {
  success: boolean;
  customToken?: string;
  error?: string;
}

/**
 * Firebase Auth Custom Token Bridge Cloud Function
 *
 * Validates a Hire Huub ERP session against Firestore `user_sessions` & `employees`
 * and generates a Firebase Auth Custom Token for infrastructure authentication.
 */
export const createErpFirebaseToken = onCall<CreateErpTokenRequestPayload>(
  {
    cors: true,
  },
  async (request): Promise<CreateErpTokenResponsePayload> => {
    const payload = request.data;
    const sessionId = payload?.sessionId;

    if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
      throw new HttpsError(
        'invalid-argument',
        'ERP sessionId parameter is required.'
      );
    }

    // 1. Validate Session in Firestore user_sessions
    const sessionsQuery = await db
      .collection('user_sessions')
      .where('sessionId', '==', sessionId.trim())
      .limit(1)
      .get();

    if (sessionsQuery.empty) {
      throw new HttpsError(
        'unauthenticated',
        'ERP session is invalid or has expired.'
      );
    }

    const sessionData = sessionsQuery.docs[0].data();

    if (sessionData.sessionStatus !== 'active') {
      throw new HttpsError(
        'unauthenticated',
        'ERP session has been logged out or terminated.'
      );
    }

    if (sessionData.expiresAt) {
      const expTime = new Date(sessionData.expiresAt).getTime();
      if (Date.now() >= expTime) {
        throw new HttpsError(
          'unauthenticated',
          'ERP session has expired. Please sign in again.'
        );
      }
    }

    const employeeId = sessionData.employeeId;
    if (!employeeId || typeof employeeId !== 'string') {
      throw new HttpsError(
        'unauthenticated',
        'Session does not map to a valid employee ID.'
      );
    }

    // 2. Validate Employee in Firestore employees collection
    const employeeQuery = await db
      .collection('employees')
      .where('employeeId', '==', employeeId)
      .limit(1)
      .get();

    if (employeeQuery.empty) {
      throw new HttpsError(
        'permission-denied',
        'Employee record associated with ERP session was not found.'
      );
    }

    const employeeData = employeeQuery.docs[0].data();
    const activeStatuses = ['Active', 'Pending Activation'];
    const employeeStatus = employeeData.accountStatus || employeeData.status || 'Active';

    if (!activeStatuses.includes(employeeStatus) && employeeData.accountStatus === 'Locked') {
      throw new HttpsError(
        'permission-denied',
        'Employee account is locked or inactive.'
      );
    }

    if (!employeeData.firebaseUid) {
      throw new HttpsError(
        'failed-precondition',
        'Employee record is not linked to a Firebase Authentication UID.'
      );
    }

    // 3. Set Firebase Custom Claims on the existing native Firebase UID
    try {
      const explicitAssigned = employeeData.assignedRole ? String(employeeData.assignedRole).trim().toLowerCase() : '';

      let canonicalRole = 'User';
      if (explicitAssigned === 'super admin' || explicitAssigned === 'super_admin') {
        canonicalRole = 'Super Admin';
      } else if (explicitAssigned === 'master admin') {
        canonicalRole = 'Master Admin';
      } else if (explicitAssigned === 'admin') {
        canonicalRole = 'Admin';
      }

      await adminAuth.setCustomUserClaims(employeeData.firebaseUid, {
        role: canonicalRole,
        departmentId: employeeData.departmentId || null,
        employeeId: employeeData.employeeId
      });
      
      return {
        success: true,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error during setting custom claims.';
      throw new HttpsError(
        'internal',
        `Failed to set Firebase Custom Claims: ${msg}`
      );
    }
  }
);
