import { addDoc, collection, getDocs, query, serverTimestamp, updateDoc, doc, where } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import { LEAVE_BALANCES_COLLECTION, LEAVE_REQUESTS_COLLECTION } from '../../Leave/constants/leave';

export interface CompOffGrantInput {
  employeeId: string;
  employeeName: string;
  department: string;
  attendanceDate: string; // YYYY-MM-DD
  isHoliday: boolean;
  isSunday: boolean;
  holidayName?: string;
}

class CompOffService {
  /**
   * Evaluates valid worked attendance on a Holiday or Sunday and generates a Comp Off entitlement.
   * Enforces strict duplicate protection: one Comp Off entitlement per employee per worked date.
   */
  async grantCompOffIfWorked(input: CompOffGrantInput): Promise<boolean> {
    if (!input.isHoliday && !input.isSunday) {
      return false; // Not a holiday or Sunday
    }

    // 1. Duplicate Protection Check
    const existingRef = await getDocs(
      query(
        collection(db, LEAVE_REQUESTS_COLLECTION),
        where('employeeId', '==', input.employeeId),
        where('startDate', '==', input.attendanceDate),
        where('requestType', '==', 'Comp Off')
      )
    );

    if (!existingRef.empty) {
      // Comp Off already generated for this date
      return false;
    }

    const sourceLabel = input.isHoliday
      ? `Worked on Holiday — ${input.holidayName || 'Company Holiday'} (${input.attendanceDate})`
      : `Worked on Week Off — Sunday (${input.attendanceDate})`;

    // 2. Record Earned Comp Off in Leave Request History
    await addDoc(collection(db, LEAVE_REQUESTS_COLLECTION), {
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      department: input.department,
      requestType: 'Comp Off',
      leaveType: 'Comp Off Earned',
      startDate: input.attendanceDate,
      endDate: input.attendanceDate,
      days: 1,
      reason: sourceLabel,
      medicalCertificateReference: '',
      status: 'Approved',
      approverEmployeeId: 'System (Attendance Engine)',
      decisionReason: 'Earned by working on Holiday / Sunday',
      isArchived: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 3. Credit Comp Off in Leave Balance Infrastructure
    const balanceQuery = await getDocs(
      query(
        collection(db, LEAVE_BALANCES_COLLECTION),
        where('employeeId', '==', input.employeeId),
        where('leaveType', '==', 'Comp Off')
      )
    );

    if (!balanceQuery.empty) {
      const balanceDoc = balanceQuery.docs[0];
      const data = balanceDoc.data();
      const currentAvailable = Number(data.available ?? 0);
      const currentCredited = Number(data.credited ?? 0);

      await updateDoc(doc(db, LEAVE_BALANCES_COLLECTION, balanceDoc.id), {
        available: currentAvailable + 1,
        credited: currentCredited + 1,
        updatedAt: serverTimestamp(),
      });
    } else {
      await addDoc(collection(db, LEAVE_BALANCES_COLLECTION), {
        employeeId: input.employeeId,
        leaveType: 'Comp Off',
        available: 1,
        credited: 1,
        carriedForward: 0,
        used: 0,
        updatedAt: serverTimestamp(),
      });
    }

    return true;
  }
}

export const compOffService = new CompOffService();
