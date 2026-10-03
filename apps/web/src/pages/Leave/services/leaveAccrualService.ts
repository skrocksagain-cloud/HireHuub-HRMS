import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import { LEAVE_REQUESTS_COLLECTION } from '../constants/leave';

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
    _accrualMonthStr?: string
  ): Promise<{ credited: boolean; amount?: number; reason: string }> {
    if (!employeeId || !joiningDateStr) return { credited: false, reason: 'Employee identity or joining date is missing.' };
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('../../../firebase/firebase');
    const result = await httpsCallable(functions, 'processMonthlyLeaveAccrual')({});
    const outcome = result.data as { credited?: boolean; amount?: number; reason?: string };
    return {
      credited: Boolean(outcome.credited),
      ...(typeof outcome.amount === 'number' ? { amount: outcome.amount } : {}),
      reason: typeof outcome.reason === 'string' ? outcome.reason : 'Leave accrual processing completed.',
    };
  }
}

export const leaveAccrualService = new LeaveAccrualService();
