import { useState, useEffect, useCallback } from 'react';
import type { WorkforceRecordV2 } from '../types/workforce.v2.types';
import type { WorkforceContextV2 } from '../services/workforce.v2.service';
import { WorkforceServiceImplV2 } from '../services/workforce.v2.service';
import { PlacementServiceImplV2 } from '../../../placement/v2/services/placement.v2.service';
import { db } from '../../../../../firebase/firebase';
import { collection, query, getDocs, doc, getDoc, where } from 'firebase/firestore';
import { getAuthorizationScope } from '../../../../../core/authorization/authorizationResolver';

// Basic real integration bridging to V2 Service logic
const repoCrm: any = {
  getCandidateById: async (id: string) => {
    try {
      const snap = await getDoc(doc(db, 'crm_candidates', id));
      if (!snap.exists()) return null;
      const docData = snap.data();
      return { id, ...docData, currentStatus: docData.currentCrmStatus || docData.status };
    } catch (e) {
      return null;
    }
  }
};
const repoPlacements: any = {
  queryPlacements: async (filters: any) => {
    const userSession = filters.userSession as WorkforceContextV2;
    const scope = userSession ? getAuthorizationScope(userSession.assignedRole) : 'SELF';

    let authorizedIds: string[] | null = null; // null means GLOBAL

    if (scope === 'GLOBAL') {
      authorizedIds = null;
    } else if (scope === 'DEPARTMENT') {
      if (!userSession?.departmentId) return [];
      const empQ = query(collection(db, 'employees'), where('departmentId', '==', userSession.departmentId));
      const empSnap = await getDocs(empQ);
      authorizedIds = [];
      empSnap.forEach(d => {
        const data = d.data();
        if (data.employeeId) authorizedIds!.push(data.employeeId);
      });
      if (authorizedIds.length === 0) return [];
    } else if (scope === 'DIRECT_REPORTS') {
      const empQ = query(collection(db, 'employees'), where('reportingManagerId', '==', userSession.id));
      const empSnap = await getDocs(empQ);
      authorizedIds = [userSession.id];
      empSnap.forEach(d => {
        const data = d.data();
        if (data.employeeId) authorizedIds!.push(data.employeeId);
      });
    } else {
      authorizedIds = [userSession.id];
    }

    const baseConstraints: any[] = [where('status', '==', 'Active')];
    if (filters?.clientId) {
      baseConstraints.push(where('clientId', '==', filters.clientId));
    }

    if (authorizedIds === null) {
      // GLOBAL
      const q = query(collection(db, 'placements'), ...baseConstraints);
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      // Chunked processing to handle Firestore 'in' limit of 30 safely
      const chunks = [];
      for (let i = 0; i < authorizedIds.length; i += 30) {
        chunks.push(authorizedIds.slice(i, i + 30));
      }
      
      const allResults: any[] = [];
      for (const chunk of chunks) {
        const q = query(collection(db, 'placements'), ...baseConstraints, where('recruiterId', 'in', chunk));
        const snap = await getDocs(q);
        snap.forEach(d => {
          allResults.push({ id: d.id, ...d.data() });
        });
      }
      
      // Deduplicate in case of any overlaps (unlikely but safe)
      const uniqueResults = new Map();
      allResults.forEach(r => uniqueResults.set(r.id, r));
      return Array.from(uniqueResults.values());
    }
  },
  queryPayouts: async (clientId?: string, month?: string) => {
    let q = query(collection(db, 'workforce_imports'), where('isApproved', '==', true));
    if (clientId) q = query(q, where('clientId', '==', clientId));
    const snap = await getDocs(q);
    const results: any[] = [];
    
    for (const d of snap.docs) {
      const imp = d.data();
      for (const row of imp.rows || []) {
        if (!row.matched) continue;
        
        const actualDate = row.date ? new Date(row.date) : new Date(imp.importedAt);
        const isValidDate = !isNaN(actualDate.getTime());
        const safeDate = isValidDate ? actualDate : new Date(imp.importedAt);
        const rowMonth = safeDate.toISOString().slice(0, 7);
        
        if (month && rowMonth !== month) continue;

        results.push({
          id: `${d.id}_${row.employeeId}`,
          clientId: imp.clientId,
          month: rowMonth,
          employeeId: row.employeeId,
          earning: row.earnings || 0,
          orders: row.orders || 0,
          date: row.date,
          placementId: row.placementId,
          candidateId: row.candidateId
        });
      }
    }
    
    const aggregated: Record<string, any> = {};
    for (const r of results) {
      const key = `${r.clientId}_${r.employeeId}_${r.month}`;
      if (!aggregated[key]) {
        aggregated[key] = { ...r };
      } else {
        aggregated[key].earning += r.earning;
        aggregated[key].orders += r.orders;
      }
    }
    return Object.values(aggregated);
  }
};
const integrationAp: any = {
  getAssociatePartnerForCandidate: async (candidateId: string) => {
    try {
      // Very basic AP discovery: Check if candidate was sourced by an AP
      const snap = await getDoc(doc(db, 'crm_candidates', candidateId));
      if (!snap.exists()) return null;
      
      const cData = snap.data();
      if (!cData.source || cData.source !== 'Associate Partner' || !cData.associatePartnerId) {
        // If not AP sourced, we consider them "Joined" by default to bypass the AP gate
        return {
          id: 'INTERNAL',
          name: 'Internal Team',
          status: 'Joined'
        };
      }

      // If AP sourced, check the actual AP submission status
      const apDoc = await getDoc(doc(db, 'associate_partners', cData.associatePartnerId));
      if (apDoc.exists()) {
        const apData = apDoc.data();
        const submission = (apData.submissions || []).find((s: any) => s.mobileNumber === cData.phone);
        return {
          id: apDoc.id,
          name: apData.name || apData.subVendorName,
          status: submission ? submission.status : 'Not Found'
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }
};

const integrationClient: any = {
  getClientConfig: async (clientId: string, transaction?: any, activeDate?: string) => {
    const clientRef = doc(db, 'clients', clientId);
    const snap = transaction ? await transaction.get(clientRef) : await getDoc(clientRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.points === undefined && data.commercial?.points === undefined) {
        throw new Error(`Client configuration is missing required "points" value for client ${clientId}.`);
      }

      let resolvedBigDayBonus = 0;
      if (activeDate) {
        const dateOnly = activeDate.split('T')[0];
        try {
          const bdQuery = query(collection(db, 'admin_big_day'), where('date', '==', dateOnly), where('status', 'in', ['Active', 'Completed']));
          const bdSnap = await getDocs(bdQuery);
          for (const d of bdSnap.docs) {
            const bdData = d.data();
            if (bdData.clientIds && bdData.clientIds.includes(clientId)) {
              resolvedBigDayBonus += (bdData.bonus || 0);
            }
          }
        } catch (err) {
          console.error("Failed to resolve Big Day bonus:", err);
        }
      }

      const basePoints = data.points ?? data.commercial?.points ?? 0;
      const totalPoints = basePoints + resolvedBigDayBonus;

      return {
        clientName: data.name,
        commercialType: data.commercial?.type,
        tenureDaysConfig: data.commercial?.tenure || 90,
        points: basePoints,
        bigDayBonus: resolvedBigDayBonus,
        totalPoints: totalPoints,
      };
    }
    return null; 
  }
};

export const workforceService = new WorkforceServiceImplV2(repoCrm, repoPlacements, integrationAp, integrationClient);
export const placementService = new PlacementServiceImplV2(repoCrm, integrationClient);

export function useWorkforceV2(userContext: WorkforceContextV2) {
  const [records, setRecords] = useState<WorkforceRecordV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = userContext.id;
  const userName = userContext.name;
  const userRole = userContext.role;

  const fetchWorkforce = useCallback(async (filters?: { clientId?: string, month?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await workforceService.getActiveWorkforce({ id: userId, name: userName, role: userRole }, filters);
      setRecords(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to load Workforce data.');
    } finally {
      setLoading(false);
    }
  }, [userId, userName, userRole]);

  useEffect(() => {
    fetchWorkforce();
  }, [fetchWorkforce]);

  const transferPlacement = async (oldPlacementId: string, newClientId: string, lastWorkingDate: string, optional: any) => {
    await placementService.transferPlacement(oldPlacementId, newClientId, lastWorkingDate, { id: userId, name: userName } as any, optional);
    await fetchWorkforce();
  };

  const terminatePlacement = async (placementId: string, lastWorkingDate: string) => {
    await placementService.terminatePlacement(placementId, lastWorkingDate, { id: userId, name: userName } as any);
    await fetchWorkforce();
  };

  const updateOperationalData = async (placementId: string, payload: any) => {
    await placementService.updateOperationalData(placementId, payload, { id: userId, name: userName } as any);
    await fetchWorkforce();
  };

  const updatePlacementDates = async (placementId: string, payload: any) => {
    await placementService.updatePlacementDates(placementId, payload, { id: userId, name: userName } as any);
    await fetchWorkforce();
  };

  return {
    records,
    loading,
    error,
    refresh: fetchWorkforce,
    transferPlacement,
    terminatePlacement,
    updateOperationalData,
    updatePlacementDates
  };
}
