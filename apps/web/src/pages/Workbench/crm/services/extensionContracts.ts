import type { WorkforceSyncPayload, PerformanceSyncPayload, Candidate } from '../types/crm';

/**
 * Extension Point Contract for Workforce Module
 * Triggered when a candidate becomes 'Active'
 */
export function prepareWorkforceSync(payload: WorkforceSyncPayload): { success: boolean; contractId: string } {
  // Extension point contract return
  return {
    success: true,
    contractId: `WF-SYNC-${payload.candidateId}-${Date.now()}`,
  };
}

/**
 * Extension Point Contract for Performance Engine (ORBIT)
 * Triggered on candidate activation (grants Recruiter Points) or call log completion
 */
export function preparePerformanceSync(payload: PerformanceSyncPayload): { success: boolean; loggedPoints: number } {
  return {
    success: true,
    loggedPoints: payload.pointsEarned,
  };
}

/**
 * Extension Point Contract for OCR Engine (Aadhaar, PAN, DL, Bank Passbook)
 */
export function prepareOcrExtraction(documentId: string): { status: 'CONTRACT_PREPARED'; documentId: string } {
  return { status: 'CONTRACT_PREPARED', documentId };
}

/**
 * Extension Point Contract for Google Sheets Sync
 */
export function prepareGoogleSheetsSync(candidateId: string): { status: 'CONTRACT_PREPARED'; candidateId: string } {
  return { status: 'CONTRACT_PREPARED', candidateId };
}

/**
 * Extension Point Contract for WhatsApp Integration
 */
export function prepareWhatsAppMessage(phone: string, template: string): { status: 'CONTRACT_PREPARED'; phone: string; template: string } {
  return { status: 'CONTRACT_PREPARED', phone, template };
}

/**
 * Extension Point Contract for Calling API (Click-to-Call)
 */
export function prepareClickToCall(phone: string, recruiterId: string): { status: 'CONTRACT_PREPARED'; phone: string; recruiterId: string } {
  return { status: 'CONTRACT_PREPARED', phone, recruiterId };
}

/**
 * Extension Point Contract for Candidate Merge
 */
export function prepareCandidateMerge(sourceId: string, targetId: string): { status: 'CONTRACT_PREPARED'; sourceId: string; targetId: string } {
  return { status: 'CONTRACT_PREPARED', sourceId, targetId };
}

/**
 * Extension Point Contract for Dashboard Widget Counters
 */
export function updateDashboardCounters(_candidate: Candidate): { status: 'CONTRACT_PREPARED' } {
  return { status: 'CONTRACT_PREPARED' };
}
