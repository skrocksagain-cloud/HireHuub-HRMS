import { writeBatch } from 'firebase/firestore';
import { db } from '../../../../firebase/firebase';
import { workforceRepository } from '../repositories/workforceRepository';
import { crmRepository } from '../../crm/repositories/crmRepository';
import { placementService } from './placementService';
import type { PlacementRecord } from '../../crm/types/crm';
import type { CreatePlacementInput } from '../types/placement';

export interface TerminateInput {
  workforceId: string;
  lastWorkingDate: string;
  reason: string;
}

export interface CompleteInput {
  workforceId: string;
  lastWorkingDate: string;
}

export interface TransferInput {
  workforceId: string;
  lastWorkingDate: string;
  newClientId: string;
  newClientName: string;
  newClientType: 'Payroll' | 'OTS';
  newActiveDate: string;
  payrollEmployeeId?: string;
  dateOfBirth?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
}

export class WorkforceLifecycleService {
  async terminatePlacement(input: TerminateInput, actor: { id: string; name: string }): Promise<void> {
    const { workforceId, lastWorkingDate, reason } = input;
    
    if (!lastWorkingDate || !reason) {
      throw new Error('Last working date and termination reason are required.');
    }

    const item = await workforceRepository.getWorkforceItemById(workforceId);
    if (!item) throw new Error('Workforce item not found.');

    const candidate = await crmRepository.getCandidateById(item.candidateId);
    if (!candidate) throw new Error('Candidate not found.');

    const activePlacement = item.placementHistory.find(p => p.status === 'Active');
    if (!activePlacement) throw new Error('No active placement found to terminate.');

    const batch = writeBatch(db);

    // 1. Update Candidate placementHistory
    const updatedCandidateHistory = candidate.placementHistory.map((p) => {
      if (p.id === activePlacement.id) {
        return { ...p, status: 'Terminated', lastWorkingDate, reason } as PlacementRecord;
      }
      return p;
    });
    crmRepository.updatePlacementHistoryInBatch(candidate.id, updatedCandidateHistory, batch);

    // 2. Update WorkforceItem placementHistory
    const updatedWorkforceHistory = item.placementHistory.map((p) => {
      if (p.id === activePlacement.id) {
        return { ...p, status: 'Terminated', lastWorkingDate, reason } as PlacementRecord;
      }
      return p;
    });

    // 3. Update WorkforceItem root
    workforceRepository.updateWorkforceLifecycleInBatch(item.id, {
      workingStatus: 'Not Working',
      lastWorkingDate,
      terminationReason: reason,
      placementHistory: updatedWorkforceHistory,
      systemAudit: [
        ...item.systemAudit,
        {
          id: `AUD-WF-${Date.now()}`,
          action: 'Terminated',
          performedBy: actor.name,
          timestamp: new Date().toISOString(),
          details: `Placement terminated. Reason: ${reason}. LWD: ${lastWorkingDate}`
        }
      ]
    }, batch);

    await batch.commit();
  }

  async completePlacement(input: CompleteInput, actor: { id: string; name: string }): Promise<void> {
    const { workforceId, lastWorkingDate } = input;
    
    if (!lastWorkingDate) {
      throw new Error('Last working date is required.');
    }

    const item = await workforceRepository.getWorkforceItemById(workforceId);
    if (!item) throw new Error('Workforce item not found.');

    const candidate = await crmRepository.getCandidateById(item.candidateId);
    if (!candidate) throw new Error('Candidate not found.');

    const activePlacement = item.placementHistory.find(p => p.status === 'Active');
    if (!activePlacement) throw new Error('No active placement found to complete.');

    const batch = writeBatch(db);

    // 1. Update Candidate placementHistory
    const updatedCandidateHistory = candidate.placementHistory.map((p) => {
      if (p.id === activePlacement.id) {
        return { ...p, status: 'Completed', lastWorkingDate } as PlacementRecord;
      }
      return p;
    });
    crmRepository.updatePlacementHistoryInBatch(candidate.id, updatedCandidateHistory, batch);

    // 2. Update WorkforceItem placementHistory
    const updatedWorkforceHistory = item.placementHistory.map((p) => {
      if (p.id === activePlacement.id) {
        return { ...p, status: 'Completed', lastWorkingDate } as PlacementRecord;
      }
      return p;
    });

    // 3. Update WorkforceItem root
    workforceRepository.updateWorkforceLifecycleInBatch(item.id, {
      workingStatus: 'Not Working',
      lastWorkingDate,
      placementHistory: updatedWorkforceHistory,
      systemAudit: [
        ...item.systemAudit,
        {
          id: `AUD-WF-${Date.now()}`,
          action: 'Completed',
          performedBy: actor.name,
          timestamp: new Date().toISOString(),
          details: `Placement completed. LWD: ${lastWorkingDate}`
        }
      ]
    }, batch);

    await batch.commit();
  }

  async transferPlacement(input: TransferInput, actor: { id: string; name: string }): Promise<void> {
    const { workforceId, lastWorkingDate } = input;

    if (!lastWorkingDate) {
      throw new Error('Last working date for the old placement is required.');
    }

    const item = await workforceRepository.getWorkforceItemById(workforceId);
    if (!item) throw new Error('Old Workforce item not found.');

    const candidate = await crmRepository.getCandidateById(item.candidateId);
    if (!candidate) throw new Error('Candidate not found.');

    const activePlacement = item.placementHistory.find(p => p.status === 'Active');
    if (!activePlacement) throw new Error('No active placement found to transfer.');

    const batch = writeBatch(db);

    // --- A. CLOSE OLD PLACEMENT ---

    // 1. Update Candidate placementHistory for the old placement
    const updatedCandidateHistory = candidate.placementHistory.map((p) => {
      if (p.id === activePlacement.id) {
        return { ...p, status: 'Transferred', lastWorkingDate } as PlacementRecord;
      }
      return p;
    });
    // We update candidate with the closed old placement.
    // The new placement will be appended by placementService helper.
    crmRepository.updatePlacementHistoryInBatch(candidate.id, updatedCandidateHistory, batch);

    // 2. Update Old WorkforceItem placementHistory
    const updatedWorkforceHistory = item.placementHistory.map((p) => {
      if (p.id === activePlacement.id) {
        return { ...p, status: 'Transferred', lastWorkingDate } as PlacementRecord;
      }
      return p;
    });

    // 3. Update Old WorkforceItem root
    workforceRepository.updateWorkforceLifecycleInBatch(item.id, {
      workingStatus: 'Not Working',
      lastWorkingDate,
      placementHistory: updatedWorkforceHistory,
      systemAudit: [
        ...item.systemAudit,
        {
          id: `AUD-WF-${Date.now()}`,
          action: 'Transferred',
          performedBy: actor.name,
          timestamp: new Date().toISOString(),
          details: `Transferred to ${input.newClientName}. LWD: ${lastWorkingDate}`
        }
      ]
    }, batch);

    // --- B. CREATE NEW PLACEMENT ---

    const createInput: CreatePlacementInput = {
      candidateId: candidate.id,
      clientId: input.newClientId,
      clientName: input.newClientName,
      clientType: input.newClientType,
      activeDate: input.newActiveDate,
      ...(input.newClientType === 'Payroll' && {
        payrollEmployeeId: input.payrollEmployeeId,
        dateOfBirth: input.dateOfBirth,
        aadhaarNumber: input.aadhaarNumber,
        panNumber: input.panNumber,
        bankAccountNumber: input.bankAccountNumber,
        ifscCode: input.ifscCode,
      })
    };

    // Note: candidate here has the old placement active in memory, but buildPlacementBatchActions 
    // will see that we are transferring. Wait! buildPlacementBatchActions checks:
    // const hasActivePlacement = candidate.placementHistory.some(p => p.clientId === input.clientId && p.status === 'Active');
    // Since we are changing clients (or even if same client, we just marked it Transferred in DB, but in memory candidate still has it Active).
    // Actually, if it's a different client, it won't trigger `hasActivePlacement`.
    // If it is the SAME client, `hasActivePlacement` would trigger because in memory `candidate` is unmodified.
    // So we must pass a slightly modified candidate to bypass duplicate check!
    const memCandidate = {
      ...candidate,
      placementHistory: updatedCandidateHistory // use the updated history which has 'Transferred'
    };

    await placementService.buildPlacementBatchActions(createInput, memCandidate, batch);

    // --- C. COMMIT EVERYTHING ATOMICALLY ---
    await batch.commit();
  }
}

export const workforceLifecycleService = new WorkforceLifecycleService();
