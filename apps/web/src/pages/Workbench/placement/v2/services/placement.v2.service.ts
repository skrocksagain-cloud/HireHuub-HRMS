import type { PlacementV2 } from '../types/placement.v2.types';
import type { ClientIntegrationV2 } from './placement.v2.integration';
import { runTransaction, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../../firebase/firebase';

export interface RecruiterContextV2 {
  id: string;
  name: string;
  role: string;
  teamId?: string;
}

export interface CandidateRepositoryV2 {
  getCandidateById(id: string, transaction?: any): Promise<any | null>;
}

export class PlacementServiceImplV2 {
  crmRepo: CandidateRepositoryV2;
  clientIntegration: ClientIntegrationV2;

  constructor(crmRepo: CandidateRepositoryV2, clientIntegration: ClientIntegrationV2) {
    this.crmRepo = crmRepo;
    this.clientIntegration = clientIntegration;
  }

  async activateCandidateAndCreatePlacement(
    candidateId: string,
    clientId: string,
    recruiterContext: RecruiterContextV2,
    optional?: { payrollEmployeeId?: string; activeDate?: string; notes?: string }
  ): Promise<PlacementV2> {
    // Check duplicate before transaction
    const activePlacementsQuery = query(collection(db, 'placements'), where('candidateId', '==', candidateId), where('status', '==', 'Active'));
    const activePlacementsSnap = await getDocs(activePlacementsQuery);
    if (!activePlacementsSnap.empty) {
      throw new Error('An active placement already exists for this candidate.');
    }

    return await runTransaction(db, async (transaction) => {
      // 1. Transaction Reads
      const candidateRef = doc(db, 'crm_candidates', candidateId);
      const candidateSnap = await transaction.get(candidateRef);
      if (!candidateSnap.exists()) throw new Error('Candidate not found.');
      const candidate = candidateSnap.data();

      const activeDateStr = optional?.activeDate || new Date().toISOString();
      const clientConfig = await this.clientIntegration.getClientConfig(clientId, transaction, activeDateStr);
      if (!clientConfig || !clientConfig.commercialType) {
        throw new Error('Valid Network Client configuration with commercial type is required.');
      }

      let otsEmployeeId: string | undefined;
      let nextOtsNumber = 1;
      const sequenceRef = doc(db, 'system_sequences', 'ots_employee_id');

      if (clientConfig.commercialType === 'OTS') {
        const sequenceSnap = await transaction.get(sequenceRef);
        if (sequenceSnap.exists()) {
          nextOtsNumber = (sequenceSnap.data().current || 0) + 1;
        }
        otsEmployeeId = `HH/CAN/OTS/${nextOtsNumber.toString().padStart(4, '0')}`;
      } else if (clientConfig.commercialType === 'Payroll') {
        if (!optional?.payrollEmployeeId || !optional.payrollEmployeeId.trim()) {
          throw new Error('Payroll Employee ID is required before activating this candidate.');
        }
      }

      const placementSequenceRef = doc(db, 'system_sequences', 'placement_id');
      let nextPlacementNumber = 1;
      const pSeqSnap = await transaction.get(placementSequenceRef);
      if (pSeqSnap.exists()) {
        nextPlacementNumber = (pSeqSnap.data().current || 0) + 1;
      }
      const placementBusinessId = `HHPL${nextPlacementNumber.toString().padStart(4, '0')}`;

      // 2. Transaction Writes

      // Update Candidate to Active
      transaction.update(candidateRef, {
        currentCrmStatus: 'Active',
        updatedAt: activeDateStr
      });

      // Write Interaction History
      const interactionRef = doc(collection(db, 'crm_candidates', candidateId, 'interactions'));
      transaction.set(interactionRef, {
        id: interactionRef.id,
        timestamp: activeDateStr,
        recruiterId: recruiterContext.id,
        recruiterName: recruiterContext.name,
        previousStatus: candidate.currentCrmStatus || 'Unknown',
        newStatus: 'Active',
        notes: optional?.notes || 'Activated and Placement created via V2 flow',
        type: 'Status Update'
      });

      // Increment Sequence
      if (clientConfig.commercialType === 'OTS') {
        transaction.set(sequenceRef, { current: nextOtsNumber }, { merge: true });
      }

      transaction.set(placementSequenceRef, { current: nextPlacementNumber }, { merge: true });

      // Create Placement
      const placementRef = doc(collection(db, 'placements'));
      
      const newPlacement: any = {
        id: placementRef.id,
        placementId: placementBusinessId,
        candidateId,
        clientId,
        clientName: clientConfig.clientName,
        clientType: clientConfig.commercialType,
        status: 'Active',
        activeDate: activeDateStr,
        joiningDate: activeDateStr,
        recruiterId: recruiterContext.id,
        recruiterName: recruiterContext.name,
        createdAt: activeDateStr,
        updatedAt: activeDateStr,
      };

      if (clientConfig.points !== undefined) newPlacement.pointAtActivation = clientConfig.points;
      if (clientConfig.bigDayBonus !== undefined) newPlacement.bigDayBonusAtActivation = clientConfig.bigDayBonus;
      if (clientConfig.totalPoints !== undefined) newPlacement.totalPointAtActivation = clientConfig.totalPoints;

      if (clientConfig.commercialType === 'Payroll') {
        newPlacement.payrollEmployeeId = optional!.payrollEmployeeId;
      } else if (clientConfig.commercialType === 'OTS') {
        newPlacement.otsEmployeeId = otsEmployeeId;
      }

      transaction.set(placementRef, newPlacement as PlacementV2);

      return newPlacement;
    });
  }

  async createPlacementFromActiveCandidate(
    candidateId: string,
    clientId: string,
    recruiterContext: RecruiterContextV2,
    optional?: { payrollEmployeeId?: string; activeDate?: string; }
  ): Promise<PlacementV2> {
    return await runTransaction(db, async (transaction) => {
      // 1. Transaction Reads must happen first
      const candidate = await this.crmRepo.getCandidateById(candidateId, transaction);
      if (!candidate) throw new Error('Candidate not found.');
      if (candidate.currentStatus !== 'Active') {
        throw new Error('Candidate must be in Active status to create a placement.');
      }

      const activeDateStr = optional?.activeDate || new Date().toISOString();
      const clientConfig = await this.clientIntegration.getClientConfig(clientId, transaction, activeDateStr);
      if (!clientConfig || !clientConfig.commercialType) {
        throw new Error('Valid Network Client configuration with commercial type is required.');
      }

      // Check for OTS sequence read if needed
      let otsEmployeeId: string | undefined;
      let nextOtsNumber = 1;
      const sequenceRef = doc(db, 'system_sequences', 'ots_employee_id');

      if (clientConfig.commercialType === 'OTS') {
        const sequenceSnap = await transaction.get(sequenceRef);
        if (sequenceSnap.exists()) {
          nextOtsNumber = (sequenceSnap.data().current || 0) + 1;
        }
        otsEmployeeId = `HH/CAN/OTS/${nextOtsNumber.toString().padStart(4, '0')}`;
      } else if (clientConfig.commercialType === 'Payroll') {
        if (!optional?.payrollEmployeeId || !optional.payrollEmployeeId.trim()) {
          throw new Error('Payroll Employee ID is required before activating this candidate.');
        }
      }

      const placementSequenceRef = doc(db, 'system_sequences', 'placement_id');
      let nextPlacementNumber = 1;
      const pSeqSnap = await transaction.get(placementSequenceRef);
      if (pSeqSnap.exists()) {
        nextPlacementNumber = (pSeqSnap.data().current || 0) + 1;
      }
      const placementBusinessId = `HHPL${nextPlacementNumber.toString().padStart(4, '0')}`;

      // 2. Transaction Writes
      if (clientConfig.commercialType === 'OTS') {
        transaction.set(sequenceRef, { current: nextOtsNumber }, { merge: true });
      }
      transaction.set(placementSequenceRef, { current: nextPlacementNumber }, { merge: true });

      const placementRef = doc(collection(db, 'placements'));

      const newPlacement: any = {
        id: placementRef.id,
        placementId: placementBusinessId,
        candidateId,
        clientId,
        clientName: clientConfig.clientName,
        clientType: clientConfig.commercialType,
        status: 'Active',
        activeDate: activeDateStr,
        joiningDate: activeDateStr, // Defaults to activeDate initially
        recruiterId: recruiterContext.id,
        recruiterName: recruiterContext.name,
        pointAtActivation: clientConfig.points,
        bigDayBonusAtActivation: clientConfig.bigDayBonus,
        totalPointAtActivation: clientConfig.totalPoints,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (clientConfig.commercialType === 'Payroll') {
        newPlacement.payrollEmployeeId = optional!.payrollEmployeeId;
      } else if (clientConfig.commercialType === 'OTS') {
        newPlacement.otsEmployeeId = otsEmployeeId;
      }

      transaction.set(placementRef, newPlacement as PlacementV2);

      // Lock candidate from being sourced (already Active, but maybe we mark placement ID somewhere? No, CRM shouldn't know about placement ID explicitly as per rule 2, it just queries Active placements)
      
      return newPlacement;
    });
  }

  async transferPlacement(
    oldPlacementId: string,
    newClientId: string,
    lastWorkingDate: string,
    recruiterContext: RecruiterContextV2,
    optional?: { newPayrollEmployeeId?: string; newActiveDate?: string; }
  ): Promise<PlacementV2> {
    return await runTransaction(db, async (transaction) => {
      // 1. READS
      const oldPlacementRef = doc(db, 'placements', oldPlacementId);
      const oldPlacementSnap = await transaction.get(oldPlacementRef);
      if (!oldPlacementSnap.exists()) throw new Error('Old Placement not found.');
      const oldPlacement = oldPlacementSnap.data() as PlacementV2;

      if (oldPlacement.status !== 'Active') {
        throw new Error('Only Active placements can be transferred.');
      }

      const activeDateStr = optional?.newActiveDate || lastWorkingDate;
      const clientConfig = await this.clientIntegration.getClientConfig(newClientId, transaction, activeDateStr);
      if (!clientConfig) throw new Error('Valid New Client configuration is required.');

      let newOtsEmployeeId: string | undefined;
      let nextOtsNumber = 1;
      const sequenceRef = doc(db, 'system_sequences', 'ots_employee_id');

      if (clientConfig.commercialType === 'OTS') {
        const sequenceSnap = await transaction.get(sequenceRef);
        if (sequenceSnap.exists()) {
          nextOtsNumber = (sequenceSnap.data().current || 0) + 1;
        }
        newOtsEmployeeId = `HH/CAN/OTS/${nextOtsNumber.toString().padStart(4, '0')}`;
      } else if (clientConfig.commercialType === 'Payroll') {
        if (!optional?.newPayrollEmployeeId) {
          throw new Error('Payroll Employee ID is required for the new Payroll placement.');
        }
      }

      const placementSequenceRef = doc(db, 'system_sequences', 'placement_id');
      let nextPlacementNumber = 1;
      const pSeqSnap = await transaction.get(placementSequenceRef);
      if (pSeqSnap.exists()) {
        nextPlacementNumber = (pSeqSnap.data().current || 0) + 1;
      }
      const placementBusinessId = `HHPL${nextPlacementNumber.toString().padStart(4, '0')}`;

      // 2. WRITES
      transaction.update(oldPlacementRef, {
        status: 'Transferred',
        lastWorkingDate,
        updatedAt: new Date().toISOString(),
      });

      if (clientConfig.commercialType === 'OTS') {
        transaction.set(sequenceRef, { current: nextOtsNumber }, { merge: true });
      }
      transaction.set(placementSequenceRef, { current: nextPlacementNumber }, { merge: true });

      const newPlacementRef = doc(collection(db, 'placements'));

      const newPlacement: any = {
        id: newPlacementRef.id,
        placementId: placementBusinessId,
        candidateId: oldPlacement.candidateId,
        clientId: newClientId,
        clientName: clientConfig.clientName,
        clientType: clientConfig.commercialType,
        status: 'Active',
        activeDate: activeDateStr,
        joiningDate: activeDateStr,
        recruiterId: recruiterContext.id,
        recruiterName: recruiterContext.name,
        pointAtActivation: clientConfig.points,
        bigDayBonusAtActivation: clientConfig.bigDayBonus,
        totalPointAtActivation: clientConfig.totalPoints,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (clientConfig.commercialType === 'Payroll') {
        newPlacement.payrollEmployeeId = optional!.newPayrollEmployeeId;
      } else if (clientConfig.commercialType === 'OTS') {
        newPlacement.otsEmployeeId = newOtsEmployeeId;
      }

      transaction.set(newPlacementRef, newPlacement as PlacementV2);

      return newPlacement;
    });
  }

  async terminatePlacement(
    placementId: string,
    lastWorkingDate: string,
    _recruiterContext: RecruiterContextV2
  ): Promise<void> {
    return await runTransaction(db, async (transaction) => {
      const placementRef = doc(db, 'placements', placementId);
      const placementSnap = await transaction.get(placementRef);
      if (!placementSnap.exists()) throw new Error('Placement not found.');

      transaction.update(placementRef, {
        status: 'Terminated',
        lastWorkingDate,
        updatedAt: new Date().toISOString(),
      });
    });
  }

  async updatePlacementDates(
    placementId: string,
    updates: { activeDate?: string; joiningDate?: string; lastWorkingDate?: string },
    _recruiterContext: RecruiterContextV2
  ): Promise<void> {
    return await runTransaction(db, async (transaction) => {
      const placementRef = doc(db, 'placements', placementId);
      const placementSnap = await transaction.get(placementRef);
      if (!placementSnap.exists()) throw new Error('Placement not found.');
      const placement = placementSnap.data() as PlacementV2;

      const updatePayload: Partial<PlacementV2> = {
        updatedAt: new Date().toISOString()
      };

      if (updates.activeDate) {
        updatePayload.activeDate = updates.activeDate;
        if (placement.clientType === 'Payroll') {
          updatePayload.joiningDate = updates.activeDate;
        }
      }
      
      if (placement.clientType === 'OTS') {
        if (updates.joiningDate) updatePayload.joiningDate = updates.joiningDate;
        if (updates.lastWorkingDate) updatePayload.lastWorkingDate = updates.lastWorkingDate;
      } else {
        if (updates.joiningDate && updates.joiningDate !== updates.activeDate) {
           throw new Error('For Payroll placements, joiningDate must equal activeDate and cannot be edited independently.');
        }
        if (updates.lastWorkingDate) {
           throw new Error('Only OTS placements allow direct editing of lastWorkingDate outside lifecycle events.');
        }
      }

      transaction.update(placementRef, updatePayload);
    });
  }

  async updateOperationalData(
    placementId: string,
    payload: {
      dateOfBirth?: string;
      aadhaar?: string;
      pan?: string;
      bankAccountNumber?: string;
      ifscCode?: string;
    },
    _recruiterContext: RecruiterContextV2
  ): Promise<void> {
    return await runTransaction(db, async (transaction) => {
      const placementRef = doc(db, 'placements', placementId);
      const placementSnap = await transaction.get(placementRef);
      if (!placementSnap.exists()) throw new Error('Placement not found.');
      const current = placementSnap.data() as PlacementV2;

      transaction.update(placementRef, {
        operationalData: {
          ...current.operationalData,
          ...payload
        },
        updatedAt: new Date().toISOString()
      });
    });
  }
}
