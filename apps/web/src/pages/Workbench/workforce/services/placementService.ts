import { writeBatch, doc, collection } from 'firebase/firestore';
import { db } from '../../../../firebase/firebase';
import type { CreatePlacementInput } from '../types/placement';
import type { PlacementRecord } from '../../crm/types/crm';
import { crmRepository } from '../../crm/repositories/crmRepository';

export class PlacementService {
  async placeCandidate(input: CreatePlacementInput): Promise<void> {
    let candidate = await crmRepository.getCandidateById(input.candidateId);
    if (!candidate) {
      throw new Error('Candidate not found.');
    }

    if (input.clientType === 'OTS' && (!candidate.payrollEmployeeId || !candidate.payrollEmployeeId.startsWith('HH/CAN/OTS/'))) {
      await crmRepository.generateOtsEmployeeId(candidate.id);
      candidate = await crmRepository.getCandidateById(input.candidateId); // Refresh after generation
    }

    const batch = writeBatch(db);
    await this.buildPlacementBatchActions(input, candidate, batch);
    await batch.commit();
  }

  async buildPlacementBatchActions(
    input: CreatePlacementInput,
    candidate: any,
    batch: any
  ): Promise<PlacementRecord> {
    this.validate(input);

    // Duplicate detection: active placement for this client
    const hasActivePlacement = candidate.placementHistory.some(
      (p: any) => p.clientId === input.clientId && p.status === 'Active'
    );
    if (hasActivePlacement) {
      throw new Error('Candidate is already actively placed at this client.');
    }

    const placementId = doc(collection(db, 'dummy')).id;

    const placementRecord: PlacementRecord = {
      id: placementId,
      clientId: input.clientId,
      clientName: input.clientName,
      clientType: input.clientType,
      activeDate: input.activeDate,
      payrollEmployeeId: input.clientType === 'Payroll' ? input.payrollEmployeeId : undefined,
      dateOfBirth: input.clientType === 'Payroll' ? input.dateOfBirth : undefined,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    // 1. Candidate Update (Atomic append ONLY)
    crmRepository.appendPlacementToHistory(candidate.id, placementRecord, batch);

    return placementRecord;
  }

  private validate(input: CreatePlacementInput) {
    if (!input.candidateId || !input.clientId || !input.clientName || !input.clientType || !input.activeDate) {
      throw new Error('Missing common required fields.');
    }

    if (isNaN(new Date(input.activeDate).getTime())) {
      throw new Error('Invalid active date.');
    }

    if (input.clientType === 'Payroll' && !input.isAutoActivation) {
      if (!input.payrollEmployeeId || !input.payrollEmployeeId.trim()) {
        throw new Error('Payroll Employee ID is required.');
      }
      if (!/^[A-Za-z0-9-]+$/.test(input.payrollEmployeeId.trim())) {
        throw new Error('Payroll Employee ID must contain only letters, numbers, and hyphens.');
      }
      if (!input.dateOfBirth) {
        throw new Error('Date of Birth is required for Payroll.');
      }
      if (!input.aadhaarNumber || !/^\d{12}$/.test(input.aadhaarNumber)) {
        throw new Error('Aadhaar Number must be a valid 12-digit number.');
      }
      if (!input.panNumber || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(input.panNumber)) {
        throw new Error('PAN Number must be in the correct alphanumeric format.');
      }
      if (!input.bankAccountNumber || !/^\d{9,18}$/.test(input.bankAccountNumber)) {
        throw new Error('Bank Account Number must be between 9 and 18 digits.');
      }
      if (!input.ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(input.ifscCode)) {
        throw new Error('IFSC Code must be in the standard Indian format.');
      }
    }
  }
}

export const placementService = new PlacementService();
