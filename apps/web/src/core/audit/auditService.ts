import { auditRepository } from './auditRepository';

export interface AuditEntry {
  module: string;
  action: string;
  recordId: string;
  performedBy: string;
  role: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  remarks?: string;
}

class AuditService {
  async record(entry: AuditEntry): Promise<void> {
    await auditRepository.create(entry);
  }
}

export const auditService = new AuditService();
