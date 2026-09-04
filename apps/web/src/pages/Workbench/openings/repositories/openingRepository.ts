import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { db } from '../../../../firebase/firebase';
import { openingNumberService } from '../../../../services/numbering/openingNumberService';
import type { Opening } from '../../../../types/Opening';

const openingsCollection = collection(db, 'openings');

/**
 * Recursively strips undefined fields from payload to satisfy Firestore strict serialization.
 */
export function removeUndefinedFields<T>(obj: T): T {
  if (obj === undefined || obj === null) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => removeUndefinedFields(item)) as unknown as T;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleanObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleanObj[key] = removeUndefinedFields(value);
      }
    }
    return cleanObj as T;
  }
  return obj;
}

const fromFirestore = (id: string, data: Record<string, unknown>): Opening => ({
  ...(data as Omit<Opening, 'id'>),
  id,
  assignedRecruiterIds: Array.isArray(data.assignedRecruiterIds) ? (data.assignedRecruiterIds as string[]) : [],
  attachments: Array.isArray(data.attachments) ? (data.attachments as Opening['attachments']) : [],
  createdAt: String(data.createdAt ?? ''),
  updatedAt: String(data.updatedAt ?? ''),
});

export async function syncExternalVacancyProjection(opening: Opening): Promise<void> {
  try {
    const externalRef = doc(db, 'external_vacancies', opening.id);
    const shouldPublish = Boolean(opening.status === 'Active' && opening.isOutsourced === true);

    if (shouldPublish) {
      const minExp = opening.minExperience ?? 0;
      const maxExp = opening.maxExperience ?? 3;
      const expStr = `${minExp} - ${maxExp} Yrs`;

      const minSal = opening.minSalary ? `₹${opening.minSalary.toLocaleString()}` : '';
      const maxSal = opening.maxSalary ? `₹${opening.maxSalary.toLocaleString()}` : '';
      const salStr = minSal && maxSal ? `${minSal} - ${maxSal}` : minSal || maxSal || '';

      const payload = removeUndefinedFields({
        id: opening.id,
        openingId: opening.id,
        clientName: opening.clientName || 'Hire Huub Client',
        title: opening.title || '',
        city: opening.city || '',
        state: opening.state || '',
        openPositions: opening.openPositions || 1,
        experienceRange: expStr,
        minExperience: minExp,
        maxExperience: maxExp,
        qualification: opening.qualification || '',
        salaryRange: salStr,
        minSalary: opening.minSalary || 0,
        maxSalary: opening.maxSalary || 0,
        salaryPeriod: opening.salaryType || 'Monthly',
        employmentType: 'Outsourced Staffing',
        shift: 'Rotational / Fixed',
        jobDescription: opening.description || '',
        skillsRequired: opening.skills || [],
        lastUpdated: opening.updatedAt ? new Date(opening.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        updatedAtServer: serverTimestamp(),
      });
      await setDoc(externalRef, payload);
    } else {
      await deleteDoc(externalRef);
    }
  } catch {
    // Safe execution
  }
}

export class OpeningRepository {
  async getOpenings(): Promise<Opening[]> {
    const snapshot = await getDocs(openingsCollection);
    return snapshot.docs.map((item) => fromFirestore(item.id, item.data()));
  }

  async getOpeningById(id: string): Promise<Opening | null> {
    const snapshot = await getDoc(doc(db, 'openings', id));
    return snapshot.exists() ? fromFirestore(snapshot.id, snapshot.data()) : null;
  }

  async createOpening(input: Omit<Opening, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Opening> {
    const id = input.id ?? (await openingNumberService.generateNextNumber(await this.getOpenings()));
    const now = new Date().toISOString();
    const opening: Opening = {
      ...input,
      id,
      assignedRecruiterIds: input.assignedRecruiterIds ?? [],
      attachments: input.attachments ?? [],
      createdAt: now,
      updatedAt: now,
    };
    const payload = removeUndefinedFields({
      ...opening,
      createdAt: now,
      updatedAt: now,
      createdAtServer: serverTimestamp(),
      updatedAtServer: serverTimestamp(),
    });
    await setDoc(doc(db, 'openings', id), payload);
    await syncExternalVacancyProjection(opening);
    return opening;
  }

  async updateOpening(id: string, updates: Partial<Opening>): Promise<Opening> {
    const existing = await this.getOpeningById(id);
    if (!existing) throw new Error(`Opening with ID ${id} was not found.`);
    const updated = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    const payload = removeUndefinedFields({
      ...updates,
      updatedAt: updated.updatedAt,
      updatedAtServer: serverTimestamp(),
    });
    await updateDoc(doc(db, 'openings', id), payload);
    await syncExternalVacancyProjection(updated);
    return updated;
  }

  async deleteOpening(id: string): Promise<boolean> {
    const existing = await this.getOpeningById(id);
    if (!existing) return false;
    await deleteDoc(doc(db, 'openings', id));
    try {
      await deleteDoc(doc(db, 'external_vacancies', id));
    } catch {
      // Safe execution
    }
    return true;
  }
}

export const openingRepository = new OpeningRepository();

