import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase';

export const PERFORMANCE_TARGETS_COLLECTION = 'performanceTargets';

export interface PerformanceTarget {
  id: string; // employeeId_brandId_month
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  brandId: string;
  brandName: string;
  month: string; // YYYY-MM or August 2026
  targetPoints: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PerformanceTargetInput {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  brandId: string;
  brandName: string;
  month: string;
  targetPoints: number;
}

export interface PerformanceTargetRepository {
  getTarget(employeeId: string, brandId: string, month: string): Promise<PerformanceTarget | null>;
  getTargetsForMonth(brandId: string, month: string): Promise<PerformanceTarget[]>;
  getAllTargetsForBrand(brandId: string): Promise<PerformanceTarget[]>;
  saveTarget(input: PerformanceTargetInput): Promise<void>;
}

export class FirestorePerformanceTargetRepository implements PerformanceTargetRepository {
  async getTarget(employeeId: string, brandId: string, month: string): Promise<PerformanceTarget | null> {
    const docId = `${employeeId}_${brandId}_${month}`;
    const docRef = doc(db, PERFORMANCE_TARGETS_COLLECTION, docId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as PerformanceTarget;
  }

  async getTargetsForMonth(brandId: string, month: string): Promise<PerformanceTarget[]> {
    const q = brandId === 'ALL'
      ? query(collection(db, PERFORMANCE_TARGETS_COLLECTION), where('month', '==', month))
      : query(
          collection(db, PERFORMANCE_TARGETS_COLLECTION),
          where('brandId', '==', brandId),
          where('month', '==', month)
        );

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PerformanceTarget));
  }

  async getAllTargetsForBrand(brandId: string): Promise<PerformanceTarget[]> {
    const q = brandId === 'ALL'
      ? query(collection(db, PERFORMANCE_TARGETS_COLLECTION))
      : query(collection(db, PERFORMANCE_TARGETS_COLLECTION), where('brandId', '==', brandId));

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PerformanceTarget));
  }

  async saveTarget(input: PerformanceTargetInput): Promise<void> {
    const docId = `${input.employeeId}_${input.brandId}_${input.month}`;
    const docRef = doc(db, PERFORMANCE_TARGETS_COLLECTION, docId);

    const existingSnap = await getDoc(docRef);

    if (existingSnap.exists()) {
      await setDoc(
        docRef,
        {
          targetPoints: input.targetPoints,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      await setDoc(docRef, {
        id: docId,
        employeeId: input.employeeId,
        employeeName: input.employeeName,
        employeeCode: input.employeeCode,
        brandId: input.brandId,
        brandName: input.brandName,
        month: input.month,
        targetPoints: input.targetPoints,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
}

export const performanceTargetRepository: PerformanceTargetRepository =
  new FirestorePerformanceTargetRepository();
