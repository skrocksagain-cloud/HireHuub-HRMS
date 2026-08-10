import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';

export interface DesignationMasterRecord {
  id: string;
  department: string;
  designationName: string;
  hierarchyLevel?: number;
}

const DESIGNATION_MASTER_COLLECTION = 'admin_designations';

export interface DesignationMasterRepository {
  getDesignations(): Promise<DesignationMasterRecord[]>;
}

class FirestoreDesignationMasterRepository implements DesignationMasterRepository {
  async getDesignations(): Promise<DesignationMasterRecord[]> {
    try {
      const snapshot = await getDocs(collection(db, DESIGNATION_MASTER_COLLECTION));
      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          department: String(data.department ?? ''),
          designationName: String(data.designationName ?? data.name ?? ''),
          hierarchyLevel: typeof data.hierarchyLevel === 'number' ? data.hierarchyLevel : undefined,
        };
      });
    } catch {
      return [];
    }
  }
}

export const designationMasterRepository: DesignationMasterRepository = new FirestoreDesignationMasterRepository();
