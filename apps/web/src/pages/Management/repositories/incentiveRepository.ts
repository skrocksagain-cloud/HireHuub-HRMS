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

export const INCENTIVE_RULES_COLLECTION = 'incentiveRules';
export const INCENTIVE_SNAPSHOTS_COLLECTION = 'incentiveSnapshots';

export interface IncentiveSlab {
  slabId: string;
  minAchievementPercent: number;
  maxAchievementPercent: number | null; // null for open-ended / infinity
  fixedAmount: number;
  perCandidateAmount: number;
  active: boolean;
  sortOrder: number;
}

export interface IncentiveRuleConfig {
  id: string; // brandId_v1
  brandProfileId: string;
  brandName: string;
  ruleVersion: number;
  effectiveFrom: string; // YYYY-MM or August 2026
  payoutCycle: string;
  status: 'Active' | 'Inactive';
  slabs: IncentiveSlab[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface IncentiveSnapshot {
  id: string; // employeeId_brandId_incentiveMonth
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  brandProfileId: string;
  incentiveMonth: string; // e.g. July 2026
  payoutSalaryMonth: string; // e.g. August 2026
  payoutDate: string; // YYYY-MM-DD e.g. 2026-09-01
  achievementPercent: number;
  targetPoints: number;
  actualPoints: number;
  qualifyingCandidateCount: number;
  qualifyingCandidateIds: string[];
  ruleVersion: number;
  totalIncentive: number;
  slabBreakdown: Array<{
    slabId: string;
    description: string;
    fixedContribution: number;
    perCandidateContribution: number;
    totalSlabContribution: number;
  }>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface IncentiveRepository {
  getActiveRuleForBrand(brandProfileId: string): Promise<IncentiveRuleConfig>;
  getRuleVersion(brandProfileId: string, version: number): Promise<IncentiveRuleConfig | null>;
  saveRuleConfig(config: IncentiveRuleConfig): Promise<void>;
  getSnapshot(employeeId: string, brandId: string, incentiveMonth: string): Promise<IncentiveSnapshot | null>;
  saveSnapshot(snapshot: IncentiveSnapshot): Promise<void>;
}

export const DEFAULT_INCENTIVE_SLABS: IncentiveSlab[] = [
  {
    slabId: 'slab-1',
    minAchievementPercent: 100,
    maxAchievementPercent: 100,
    fixedAmount: 1500,
    perCandidateAmount: 0,
    active: true,
    sortOrder: 1,
  },
  {
    slabId: 'slab-2',
    minAchievementPercent: 100.01,
    maxAchievementPercent: 150,
    fixedAmount: 0,
    perCandidateAmount: 250,
    active: true,
    sortOrder: 2,
  },
  {
    slabId: 'slab-3',
    minAchievementPercent: 150.01,
    maxAchievementPercent: null,
    fixedAmount: 0,
    perCandidateAmount: 400,
    active: true,
    sortOrder: 3,
  },
];

export class FirestoreIncentiveRepository implements IncentiveRepository {
  async getActiveRuleForBrand(brandProfileId: string): Promise<IncentiveRuleConfig> {
    try {
      const q = query(
        collection(db, INCENTIVE_RULES_COLLECTION),
        where('brandProfileId', '==', brandProfileId),
        where('status', '==', 'Active')
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const sorted = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as IncentiveRuleConfig))
          .sort((a, b) => b.ruleVersion - a.ruleVersion);
        return sorted[0];
      }
    } catch {
      // Fall through to default fallback rule
    }

    return {
      id: `${brandProfileId}_v1`,
      brandProfileId,
      brandName: 'Hire Huub',
      ruleVersion: 1,
      effectiveFrom: '2026-08',
      payoutCycle: 'Next Month Salary (1st of Month)',
      status: 'Active',
      slabs: DEFAULT_INCENTIVE_SLABS,
    };
  }

  async getRuleVersion(brandProfileId: string, version: number): Promise<IncentiveRuleConfig | null> {
    try {
      const docRef = doc(db, INCENTIVE_RULES_COLLECTION, `${brandProfileId}_v${version}`);
      const snap = await getDoc(docRef);
      if (snap.exists()) return { id: snap.id, ...snap.data() } as IncentiveRuleConfig;
    } catch {
      return null;
    }
    return null;
  }

  async saveRuleConfig(config: IncentiveRuleConfig): Promise<void> {
    const docId = `${config.brandProfileId}_v${config.ruleVersion}`;
    const docRef = doc(db, INCENTIVE_RULES_COLLECTION, docId);
    await setDoc(
      docRef,
      {
        ...config,
        id: docId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  async getSnapshot(
    employeeId: string,
    brandId: string,
    incentiveMonth: string
  ): Promise<IncentiveSnapshot | null> {
    try {
      const docId = `${employeeId}_${brandId}_${incentiveMonth}`;
      const docRef = doc(db, INCENTIVE_SNAPSHOTS_COLLECTION, docId);
      const snap = await getDoc(docRef);
      if (snap.exists()) return { id: snap.id, ...snap.data() } as IncentiveSnapshot;
    } catch {
      return null;
    }
    return null;
  }

  async saveSnapshot(snapshot: IncentiveSnapshot): Promise<void> {
    const docId = snapshot.id || `${snapshot.employeeId}_${snapshot.brandProfileId}_${snapshot.incentiveMonth}`;
    const docRef = doc(db, INCENTIVE_SNAPSHOTS_COLLECTION, docId);
    await setDoc(
      docRef,
      {
        ...snapshot,
        id: docId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}

export const incentiveRepository: IncentiveRepository = new FirestoreIncentiveRepository();
