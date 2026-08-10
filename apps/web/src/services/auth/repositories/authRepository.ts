import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import type { AccountStatus, LockReason } from '../../../types/auth';

const EMPLOYEES_COLLECTION = 'employees';

export interface EmployeeAuthData {
  id: string;
  employeeId: string;
  employeeCode?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: string;
  department?: string;
  designation: string;
  email?: string;
  mobileNumber?: string;
  mobile?: string;
  accountStatus: AccountStatus;
  lockReason?: LockReason | string | null;
  passwordHash?: string;
  passwordSalt?: string;
  tempPasswordHash?: string;
  failedLoginAttempts: number;
  lockedUntil?: string | null;
  mobileVerified: boolean;
  firstLoginCompleted: boolean;
  activatedAt?: string | null;
  lastPasswordChangedAt?: string | null;
  unreturnedSignoutDaysCount?: number;
}

export interface AuthRepository {
  getEmployeeByIdOrMobile(identifier: string): Promise<EmployeeAuthData | null>;
  getEmployeeByDocId(documentId: string): Promise<EmployeeAuthData | null>;
  updateEmployeeAuthData(documentId: string, updates: Record<string, unknown>): Promise<void>;
  recordFailedLoginAttempt(documentId: string, currentAttempts: number, lockTimeMinutes?: number): Promise<{ isLocked: boolean; remainingAttempts: number }>;
  resetFailedLoginAttempts(documentId: string): Promise<void>;
  unlockAccountStatus(documentId: string): Promise<void>;
}

export class FirestoreAuthRepository implements AuthRepository {
  private parseEmployeeAuthData(docId: string, data: Record<string, unknown>): EmployeeAuthData {
    const firstName = typeof data.firstName === 'string' ? data.firstName : '';
    const lastName = typeof data.lastName === 'string' ? data.lastName : '';
    const name = typeof data.name === 'string' && data.name
      ? data.name
      : typeof data.fullName === 'string' && data.fullName
        ? data.fullName
        : `${firstName} ${lastName}`.trim() || 'Employee';

    const accountStatusStr = typeof data.accountStatus === 'string' ? data.accountStatus : typeof data.status === 'string' ? data.status : 'Pending Activation';
    const validStatuses: AccountStatus[] = ['Pending Activation', 'Active', 'Inactive', 'Suspended', 'Locked', 'Resigned', 'Terminated'];
    const accountStatus: AccountStatus = validStatuses.includes(accountStatusStr as AccountStatus)
      ? (accountStatusStr as AccountStatus)
      : 'Pending Activation';

    return {
      id: docId,
      employeeId: typeof data.employeeId === 'string' ? data.employeeId : docId,
      employeeCode: typeof data.employeeCode === 'string' ? data.employeeCode : undefined,
      name,
      firstName,
      lastName,
      role: typeof data.role === 'string' ? data.role : typeof data.designation === 'string' ? data.designation : 'Employee',
      department: typeof data.department === 'string' ? data.department : undefined,
      designation: typeof data.designation === 'string' ? data.designation : 'Staff',
      email: typeof data.email === 'string' ? data.email : typeof data.officialEmail === 'string' ? data.officialEmail : undefined,
      mobileNumber: typeof data.mobileNumber === 'string' ? data.mobileNumber : typeof data.mobile === 'string' ? data.mobile : undefined,
      mobile: typeof data.mobile === 'string' ? data.mobile : typeof data.mobileNumber === 'string' ? data.mobileNumber : undefined,
      accountStatus,
      lockReason: typeof data.lockReason === 'string' ? (data.lockReason as LockReason) : null,
      passwordHash: typeof data.passwordHash === 'string' ? data.passwordHash : undefined,
      passwordSalt: typeof data.passwordSalt === 'string' ? data.passwordSalt : undefined,
      tempPasswordHash: typeof data.tempPasswordHash === 'string' ? data.tempPasswordHash : undefined,
      failedLoginAttempts: typeof data.failedLoginAttempts === 'number' ? data.failedLoginAttempts : 0,
      lockedUntil: typeof data.lockedUntil === 'string' ? data.lockedUntil : null,
      mobileVerified: Boolean(data.mobileVerified),
      firstLoginCompleted: Boolean(data.firstLoginCompleted),
      activatedAt: typeof data.activatedAt === 'string' ? data.activatedAt : null,
      lastPasswordChangedAt: typeof data.lastPasswordChangedAt === 'string' ? data.lastPasswordChangedAt : null,
      unreturnedSignoutDaysCount: typeof data.unreturnedSignoutDaysCount === 'number' ? data.unreturnedSignoutDaysCount : 0,
    };
  }

  async getEmployeeByIdOrMobile(identifier: string): Promise<EmployeeAuthData | null> {
    const cleanId = identifier.trim();
    if (!cleanId) return null;

    // Search by employeeId
    const qEmpId = query(collection(db, EMPLOYEES_COLLECTION), where('employeeId', '==', cleanId), limit(1));
    const snapEmpId = await getDocs(qEmpId);
    if (!snapEmpId.empty && snapEmpId.docs[0]) {
      return this.parseEmployeeAuthData(snapEmpId.docs[0].id, snapEmpId.docs[0].data());
    }

    // Search by employeeCode
    const qCode = query(collection(db, EMPLOYEES_COLLECTION), where('employeeCode', '==', cleanId), limit(1));
    const snapCode = await getDocs(qCode);
    if (!snapCode.empty && snapCode.docs[0]) {
      return this.parseEmployeeAuthData(snapCode.docs[0].id, snapCode.docs[0].data());
    }

    // Search by mobileNumber
    const qMobile = query(collection(db, EMPLOYEES_COLLECTION), where('mobileNumber', '==', cleanId), limit(1));
    const snapMobile = await getDocs(qMobile);
    if (!snapMobile.empty && snapMobile.docs[0]) {
      return this.parseEmployeeAuthData(snapMobile.docs[0].id, snapMobile.docs[0].data());
    }

    // Search by mobile
    const qMobileAlt = query(collection(db, EMPLOYEES_COLLECTION), where('mobile', '==', cleanId), limit(1));
    const snapMobileAlt = await getDocs(qMobileAlt);
    if (!snapMobileAlt.empty && snapMobileAlt.docs[0]) {
      return this.parseEmployeeAuthData(snapMobileAlt.docs[0].id, snapMobileAlt.docs[0].data());
    }

    // Check directly by document ID
    const docRef = doc(db, EMPLOYEES_COLLECTION, cleanId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return this.parseEmployeeAuthData(docSnap.id, docSnap.data());
    }

    return null;
  }

  async getEmployeeByDocId(documentId: string): Promise<EmployeeAuthData | null> {
    const docRef = doc(db, EMPLOYEES_COLLECTION, documentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return this.parseEmployeeAuthData(docSnap.id, docSnap.data());
  }

  async updateEmployeeAuthData(documentId: string, updates: Record<string, unknown>): Promise<void> {
    const docRef = doc(db, EMPLOYEES_COLLECTION, documentId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  async recordFailedLoginAttempt(documentId: string, currentAttempts: number, lockTimeMinutes = 30): Promise<{ isLocked: boolean; remainingAttempts: number }> {
    const newAttempts = currentAttempts + 1;
    const isLocked = newAttempts >= 5;
    const lockedUntil = isLocked ? new Date(Date.now() + lockTimeMinutes * 60 * 1000).toISOString() : null;

    const updates: Record<string, unknown> = {
      failedLoginAttempts: newAttempts,
      updatedAt: serverTimestamp(),
    };

    if (isLocked) {
      updates.accountStatus = 'Locked';
      updates.lockReason = 'Failed Login Attempts';
      updates.lockedUntil = lockedUntil;
    }

    await this.updateEmployeeAuthData(documentId, updates);
    return {
      isLocked,
      remainingAttempts: Math.max(0, 5 - newAttempts),
    };
  }

  async resetFailedLoginAttempts(documentId: string): Promise<void> {
    await this.updateEmployeeAuthData(documentId, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lockReason: null,
      accountStatus: 'Active',
    });
  }

  async unlockAccountStatus(documentId: string): Promise<void> {
    await this.updateEmployeeAuthData(documentId, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lockReason: null,
      accountStatus: 'Active',
    });
  }
}

export const authRepository: AuthRepository = new FirestoreAuthRepository();
