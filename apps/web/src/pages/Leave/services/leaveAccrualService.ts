import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import { adminService } from '../../../services/admin/adminService';
import { LEAVE_BALANCES_COLLECTION, LEAVE_REQUESTS_COLLECTION } from '../constants/leave';

export const LEAVE_ACCRUAL_LOGS_COLLECTION = 'leaveAccrualLogs';

export interface ProbationState {
  elapsedDays: number;
  isProbation: boolean;
  probationEndDate: string;
}

export const calculateProbationState = (
  joiningDateStr: string,
  referenceDateStr?: string
): ProbationState => {
  if (!joiningDateStr || !joiningDateStr.trim()) {
    return { elapsedDays: 0, isProbation: true, probationEndDate: '' };
  }

  const [jYear, jMonth, jDay] = joiningDateStr.split('-').map(Number);
  const joinDate = new Date(jYear, jMonth - 1, jDay);

  let refDate = new Date();
  if (referenceDateStr) {
    const [rYear, rMonth, rDay] = referenceDateStr.split('-').map(Number);
    refDate = new Date(rYear, rMonth - 1, rDay);
  }

  const diffTime = refDate.getTime() - joinDate.getTime();
  const elapsedDays = Math.max(0, Math.floor(diffTime / 86_400_000));
  const isProbation = elapsedDays < 90;

  const endDateObj = new Date(joinDate.getTime() + 90 * 86_400_000);
  const probationEndDate = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(endDateObj.getDate()).padStart(2, '0')}`;

  return {
    elapsedDays,
    isProbation,
    probationEndDate,
  };
};

class LeaveAccrualService {
  /**
   * Enforces 1-day max Sick Leave during first 90 days of probation.
   */
  async validateSickLeaveProbationAllowance(
    employeeId: string,
    requestedDays: number
  ): Promise<{ allowed: boolean; message?: string }> {
    const requestsSnap = await getDocs(
      query(
        collection(db, LEAVE_REQUESTS_COLLECTION),
        where('employeeId', '==', employeeId),
        where('leaveType', '==', 'Sick Leave')
      )
    );

    const activeRequests = requestsSnap.docs
      .map((d) => d.data())
      .filter((r) => r.status !== 'Rejected' && r.status !== 'Cancelled');

    const usedSickDays = activeRequests.reduce((sum, r) => sum + Number(r.days ?? 0), 0);

    if (usedSickDays + requestedDays > 1) {
      return {
        allowed: false,
        message: `Sick Leave entitlement during 90-day probation is capped at 1 day total (Used: ${usedSickDays} day, Requested: ${requestedDays} day(s)).`,
      };
    }

    return { allowed: true };
  }

  /**
   * Executes deterministic monthly leave accrual for employees who have completed 90 days.
   * Uses deterministic idempotency key: employeeId:leaveType:accrualMonth
   */
  async processMonthlyAccrualForEmployee(
    employeeId: string,
    joiningDateStr: string,
    accrualMonthStr?: string
  ): Promise<{ credited: boolean; amount?: number; reason: string }> {
    const state = calculateProbationState(joiningDateStr);
    if (state.isProbation) {
      return {
        credited: false,
        reason: `Employee is currently in 90-day probation (${state.elapsedDays} days elapsed). Monthly leave accrual is not active during probation.`,
      };
    }

    const today = new Date();
    const targetMonth =
      accrualMonthStr || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Read Leave Master policy from Company Settings
    const settings = await adminService.getCompanySettings().catch(() => null);
    const configuredAccrualRate = (settings as any)?.leavePolicy?.monthlyAccrualDays || 1.5;
    const leaveType = 'Casual Leave';

    const idempotencyKey = `${employeeId}:${leaveType}:${targetMonth}`;

    // Check idempotency log
    const logDocRef = doc(db, LEAVE_ACCRUAL_LOGS_COLLECTION, idempotencyKey);
    const logSnap = await getDoc(logDocRef);

    if (logSnap.exists()) {
      return {
        credited: false,
        reason: `Monthly leave accrual for ${targetMonth} has already been credited (Log: ${idempotencyKey}).`,
      };
    }

    // Update Leave Balance
    const balanceQuery = await getDocs(
      query(
        collection(db, LEAVE_BALANCES_COLLECTION),
        where('employeeId', '==', employeeId),
        where('leaveType', '==', leaveType)
      )
    );

    if (!balanceQuery.empty) {
      const balanceDoc = balanceQuery.docs[0];
      const data = balanceDoc.data();
      const currentAvailable = Number(data.available ?? 0);
      const currentCredited = Number(data.credited ?? 0);

      await updateDoc(doc(db, LEAVE_BALANCES_COLLECTION, balanceDoc.id), {
        available: currentAvailable + configuredAccrualRate,
        credited: currentCredited + configuredAccrualRate,
        updatedAt: serverTimestamp(),
      });
    } else {
      await addDoc(collection(db, LEAVE_BALANCES_COLLECTION), {
        employeeId,
        leaveType,
        available: configuredAccrualRate,
        credited: configuredAccrualRate,
        carriedForward: 0,
        used: 0,
        updatedAt: serverTimestamp(),
      });
    }

    // Save Idempotency Log
    await setDoc(logDocRef, {
      id: idempotencyKey,
      employeeId,
      leaveType,
      accrualMonth: targetMonth,
      creditedAmount: configuredAccrualRate,
      createdAt: serverTimestamp(),
    });

    return {
      credited: true,
      amount: configuredAccrualRate,
      reason: `Successfully credited ${configuredAccrualRate} days ${leaveType} for ${targetMonth}.`,
    };
  }
}

export const leaveAccrualService = new LeaveAccrualService();
