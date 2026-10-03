import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeAccessScope } from './accessScope';
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
    invoker: 'public',
    cors: true,
  },
  async (request): Promise<CreateErpTokenResponsePayload> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in to create an ERP token.');
    }

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
    const activeAccountStatuses = ['Active', 'Pending Activation'];
    const activeEmploymentStatuses = ['Active', 'Notice Period', 'Pending Activation'];
    const accountStatus = employeeData.accountStatus || 'Active';
    const employmentStatus = employeeData.employmentStatus || employeeData.status || 'Active';

    if (!activeAccountStatuses.includes(accountStatus) || !activeEmploymentStatuses.includes(employmentStatus)) {
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

    if (employeeData.firebaseUid !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'The session does not belong to the authenticated employee.');
    }

    // 3. Set Firebase Custom Claims on the existing native Firebase UID
    try {
      const assignedRole = typeof employeeData.assignedRole === 'string'
        ? employeeData.assignedRole
        : typeof employeeData.role === 'string'
          ? employeeData.role
          : '';
      const normalizedRole = assignedRole.trim().toLowerCase();
      const canonicalRole = normalizedRole === 'super admin' || normalizedRole === 'super_admin'
        ? 'Super Admin'
        : normalizedRole === 'master admin' || normalizedRole === 'master_admin'
          ? 'Master Admin'
          : normalizedRole === 'admin'
            ? 'Admin'
            : 'User';
      const otherClaims = { ...(await adminAuth.getUser(employeeData.firebaseUid)).customClaims };
      delete otherClaims.role;
      delete otherClaims.employeeId;
      delete otherClaims.departmentId;
      delete otherClaims.teamId;

      await adminAuth.setCustomUserClaims(employeeData.firebaseUid, {
        ...otherClaims,
        role: canonicalRole,
        employeeId: employeeData.employeeId,
      });
      await writeAccessScope({
        employeeId: String(employeeData.employeeId),
        role: canonicalRole,
        departmentId: typeof employeeData.departmentId === 'string' ? employeeData.departmentId : '',
        department: typeof employeeData.department === 'string' ? employeeData.department : '',
        reportingManagerId: typeof employeeData.reportingManagerId === 'string' ? employeeData.reportingManagerId : '',
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
