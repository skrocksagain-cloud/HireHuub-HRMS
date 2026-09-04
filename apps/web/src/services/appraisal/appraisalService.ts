import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import type { AppraisalRecord, AppraisalStatus } from '../../types/Appraisal';

const COLLECTION_NAME = 'appraisal_records';

export class AppraisalService {
  /**
   * Retrieves all appraisal records from Firestore sorted by last update date.
   */
  static async getAllAppraisals(): Promise<AppraisalRecord[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('updatedAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as AppraisalRecord);
    } catch {
      // Fallback unindexed query
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      return snap.docs.map((d) => d.data() as AppraisalRecord);
    }
  }

  /**
   * Retrieves appraisal records for a specific employee ID.
   */
  static async getAppraisalsByEmployeeId(employeeId: string): Promise<AppraisalRecord[]> {
    if (!employeeId) return [];
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('employeeId', '==', employeeId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as AppraisalRecord);
    } catch {
      return [];
    }
  }

  /**
   * Saves or updates an appraisal record atomically in Firestore.
   */
  static async saveAppraisal(
    record: Partial<AppraisalRecord> & { employeeId: string }
  ): Promise<AppraisalRecord> {
    const id = record.id || `apr-${Date.now()}`;
    const docRef = doc(db, COLLECTION_NAME, id);
    const now = new Date().toISOString();

    const existingSnap = await getDoc(docRef);
    const existing = existingSnap.exists() ? (existingSnap.data() as AppraisalRecord) : null;

    const fullRecord: AppraisalRecord = {
      id,
      employeeId: record.employeeId,
      employeeCode: record.employeeCode || existing?.employeeCode || '',
      employeeName: record.employeeName || existing?.employeeName || '',
      department: record.department || existing?.department || '',
      designation: record.designation || existing?.designation || '',
      employmentStatus: record.employmentStatus || existing?.employmentStatus || 'Active',

      currentMonthlyGross: record.currentMonthlyGross ?? existing?.currentMonthlyGross ?? 0,
      currentAnnualGross: record.currentAnnualGross ?? existing?.currentAnnualGross ?? 0,

      reviewDate: record.reviewDate || existing?.reviewDate || new Date().toISOString().split('T')[0],
      performanceRating: record.performanceRating || existing?.performanceRating || 'Meets Expectations',
      performanceRemarks: record.performanceRemarks || existing?.performanceRemarks || '',
      appraisalDecision: record.appraisalDecision || existing?.appraisalDecision || 'Salary Increment',

      incrementType: record.incrementType || existing?.incrementType || 'Percentage',
      incrementValue: record.incrementValue ?? existing?.incrementValue ?? 0,
      revisedMonthlyGross: record.revisedMonthlyGross ?? existing?.revisedMonthlyGross ?? 0,
      revisedAnnualGross: record.revisedAnnualGross ?? existing?.revisedAnnualGross ?? 0,
      effectiveDate: record.effectiveDate || existing?.effectiveDate || new Date().toISOString().split('T')[0],

      status: record.status || existing?.status || 'Draft',
      approverId: record.approverId || existing?.approverId || '',
      approverName: record.approverName || existing?.approverName || '',
      approvalDate: record.approvalDate || existing?.approvalDate || '',
      approvalRemarks: record.approvalRemarks || existing?.approvalRemarks || '',

      createdBy: existing?.createdBy || record.createdBy || 'Super Admin',
      createdAt: existing?.createdAt || now,
      updatedBy: record.updatedBy || 'Super Admin',
      updatedAt: now,
    };

    await setDoc(docRef, fullRecord, { merge: true });
    return fullRecord;
  }

  /**
   * Transitions appraisal status (Draft -> Pending Approval -> Approved).
   */
  static async updateStatus(
    id: string,
    status: AppraisalStatus,
    actorName = 'Super Admin',
    remarks = ''
  ): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error(`Appraisal record ${id} not found.`);
    }

    const updates: Partial<AppraisalRecord> = {
      status,
      updatedBy: actorName,
      updatedAt: new Date().toISOString(),
    };

    if (status === 'Approved') {
      updates.approverName = actorName;
      updates.approvalDate = new Date().toISOString().split('T')[0];
      if (remarks) updates.approvalRemarks = remarks;
    }

    await setDoc(docRef, updates, { merge: true });
  }
}
