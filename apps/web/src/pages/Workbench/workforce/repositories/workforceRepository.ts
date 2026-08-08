import type {
  ClientPayoutImportRecord,
  ColumnMappingConfig,
  OtsBillingStatus,
  WorkforceItem,
} from '../types/workforce';
import { WorkforceNumberService } from '../services/WorkforceNumberService';
import { EligibilityService } from '../services/EligibilityService';
import { WorkforceStatusService } from '../services/WorkforceStatusService';
import { RankingService } from '../services/RankingService';
import { crmRepository } from '../../crm/repositories/crmRepository';

const SAMPLE_PAYOUT_IMPORTS: ClientPayoutImportRecord[] = [
  {
    id: 'IMP-ER-202607-V1',
    version: 1,
    clientId: 'client-001',
    clientName: 'Elastic Run',
    importPeriod: 'Monthly',
    month: '2026-07',
    importedAt: '2026-07-31T18:00:00.000Z',
    importedBy: 'Super Admin',
    isApproved: true,
    isLocked: true,
    totalRecords: 2,
    matchedRecords: 2,
    unmatchedRecords: 0,
    duplicateCount: 0,
    missingIdCount: 0,
    invalidEarningsCount: 0,
    totalEarnings: 47500,
    totalOrders: 0,
    columnMapping: {
      'Net Salary': 'earnings',
      'Trips': 'orders',
    },
    rows: [
      {
        employeeId: 'EMP-ER-9912',
        candidateName: 'Ramesh Kumar',
        earnings: 24500,
        orders: 0,
        matched: true,
        validationStatus: 'Valid',
      },
      {
        employeeId: 'EMP-ER-9913',
        candidateName: 'Rahul Verma',
        earnings: 23000,
        orders: 0,
        matched: true,
        validationStatus: 'Valid',
      },
    ],
  },
];

const INITIAL_WORKFORCE_ITEMS: WorkforceItem[] = [
  {
    id: 'EMP-ER-9912',
    candidateId: 'HHCD0001', // CRM Candidate Reference
    candidateName: 'Ramesh Kumar',
    phone: '9876543210',
    area: 'Warje',
    city: 'Pune',
    clientId: 'client-001',
    clientName: 'Elastic Run',
    workforceType: 'Payroll',
    recruiterId: 'user-001',
    recruiterName: 'Rahul Sharma',
    activeDate: '2026-07-15',
    workingFrom: '15 Jul 2026',
    dateOfBirth: '1996-05-12',
    joiningDate: '2026-07-15',
    tenureDays: 22,
    tenureDisplay: '22 Days',
    workingStatus: 'Working',
    totalEarnings: 24500,
    totalOrders: 0,
    rank: undefined,
    eligibility: 'Pending',
    billingStatus: 'Pending',
    activatedBy: 'Rahul Sharma',
    currentAssignee: 'Rahul Sharma',
    reportingTeamLead: 'Vikram Singh (TL)',
    supportsOrders: false,
    lastPayoutImportDate: '2026-07-31T18:00:00.000Z',
    placementHistory: [
      {
        id: 'PL-001',
        clientId: 'client-001',
        clientName: 'Elastic Run',
        clientType: 'Payroll',
        activeDate: '2026-07-15',
        payrollEmployeeId: 'EMP-ER-9912',
        status: 'Active',
        createdAt: '2026-07-15T09:00:00.000Z',
      },
    ],
    systemAudit: [
      {
        id: 'AUD-WF-001',
        action: 'Created',
        performedBy: 'System Pipeline',
        timestamp: '2026-07-15T09:00:00.000Z',
        details: 'Candidate entered Workforce from CRM Active Payroll placement.',
      },
      {
        id: 'AUD-WF-002',
        action: 'Status Changed',
        performedBy: 'Client Payout Import V1',
        timestamp: '2026-07-31T18:00:00.000Z',
        details: 'Working status resolved to Working via payout import match.',
      },
    ],
    createdAt: '2026-07-15T09:00:00.000Z',
    updatedAt: '2026-07-31T18:00:00.000Z',
  },
  {
    id: 'EMP-ER-9913',
    candidateId: 'HHCD0002', // CRM Candidate Reference
    candidateName: 'Priya Sharma',
    phone: '9812345678',
    area: 'Peenya',
    city: 'Bengaluru',
    clientId: 'client-001',
    clientName: 'Elastic Run',
    workforceType: 'Payroll',
    recruiterId: 'user-ap-001',
    recruiterName: 'Royal Staffing Solutions (AP)',
    associatePartnerId: 'ap-001',
    associatePartnerName: 'Royal Staffing Solutions',
    activeDate: '2026-07-10',
    workingFrom: '10 Jul 2026',
    dateOfBirth: '1995-11-04',
    joiningDate: '2026-07-10',
    tenureDays: 27,
    tenureDisplay: '27 Days',
    workingStatus: 'Working',
    totalEarnings: 23000,
    totalOrders: 0,
    rank: undefined,
    eligibility: 'Pending',
    billingStatus: 'Pending',
    activatedBy: 'Royal Staffing Solutions',
    currentAssignee: 'Royal Staffing Solutions',
    reportingTeamLead: 'Priya Sharma (TL)',
    supportsOrders: false,
    lastPayoutImportDate: '2026-07-31T18:00:00.000Z',
    placementHistory: [
      {
        id: 'PL-002',
        clientId: 'client-001',
        clientName: 'Elastic Run',
        clientType: 'Payroll',
        activeDate: '2026-07-10',
        payrollEmployeeId: 'EMP-ER-9913',
        status: 'Active',
        createdAt: '2026-07-10T09:00:00.000Z',
      },
    ],
    systemAudit: [
      {
        id: 'AUD-WF-003',
        action: 'Created',
        performedBy: 'Associate Partner Integration',
        timestamp: '2026-07-10T09:00:00.000Z',
        details: 'Candidate entered Workforce from Associate Partner Joined status.',
      },
    ],
    createdAt: '2026-07-10T09:00:00.000Z',
    updatedAt: '2026-07-31T18:00:00.000Z',
  },
  {
    id: 'HHWF000001', // PO Correction: HHWF000001 format
    candidateId: 'HHCD0004', // CRM Candidate Reference
    candidateName: 'Suresh Deshmukh',
    phone: '9123456789',
    area: 'Hadapsar',
    city: 'Pune',
    clientId: 'client-002',
    clientName: 'Acme Tech',
    workforceType: 'OTS',
    recruiterId: 'user-001',
    recruiterName: 'Rahul Sharma',
    activeDate: '2026-05-01',
    workingFrom: '01 May 2026',
    dateOfBirth: '1994-08-20',
    joiningDate: '2026-05-01',
    tenureDays: 97,
    tenureDisplay: '97 Days',
    workingStatus: 'Working',
    totalEarnings: 65000,
    totalOrders: undefined,
    rank: undefined,
    eligibility: 'Eligible',
    billingStatus: 'Pending',
    activatedBy: 'Rahul Sharma',
    currentAssignee: 'Rahul Sharma',
    reportingTeamLead: 'Vikram Singh (TL)',
    supportsOrders: false,
    placementHistory: [
      {
        id: 'PL-003',
        clientId: 'client-002',
        clientName: 'Acme Tech',
        clientType: 'OTS',
        activeDate: '2026-05-01',
        status: 'Active',
        createdAt: '2026-05-01T09:00:00.000Z',
      },
    ],
    systemAudit: [
      {
        id: 'AUD-WF-004',
        action: 'Created',
        performedBy: 'Rahul Sharma',
        timestamp: '2026-05-01T09:00:00.000Z',
        details: 'OTS Candidate entered Workforce with generated ID HHWF000001.',
      },
      {
        id: 'AUD-WF-005',
        action: 'Status Changed',
        performedBy: 'Eligibility Engine',
        timestamp: '2026-07-30T00:00:00.000Z',
        details: 'Eligibility automatically updated to Eligible after reaching 90 days tenure.',
      },
    ],
    createdAt: '2026-05-01T09:00:00.000Z',
    updatedAt: '2026-07-30T00:00:00.000Z',
  },
  {
    id: 'EMP-DEL-7741',
    candidateId: 'HHCD0005', // CRM Candidate Reference
    candidateName: 'Kavita Joshi',
    phone: '9765432109',
    area: 'Kothrud',
    city: 'Pune',
    clientId: 'client-003',
    clientName: 'DeliveryX Enterprise',
    workforceType: 'Payroll',
    recruiterId: 'user-002',
    recruiterName: 'Anita Roy',
    activeDate: '2026-06-15',
    workingFrom: '15 Jun 2026',
    dateOfBirth: '1998-02-14',
    joiningDate: '2026-06-15',
    tenureDays: 52,
    tenureDisplay: '52 Days',
    workingStatus: 'Working',
    totalEarnings: 38500,
    totalOrders: 184,
    rank: 1,
    eligibility: 'Eligible',
    billingStatus: 'Billed',
    activatedBy: 'Anita Roy',
    currentAssignee: 'Anita Roy',
    reportingTeamLead: 'Priya Sharma (TL)',
    supportsOrders: true,
    lastPayoutImportDate: '2026-07-31T18:00:00.000Z',
    placementHistory: [
      {
        id: 'PL-004',
        clientId: 'client-003',
        clientName: 'DeliveryX Enterprise',
        clientType: 'Payroll',
        activeDate: '2026-06-15',
        payrollEmployeeId: 'EMP-DEL-7741',
        status: 'Active',
        createdAt: '2026-06-15T09:00:00.000Z',
      },
    ],
    systemAudit: [
      {
        id: 'AUD-WF-006',
        action: 'Created',
        performedBy: 'Anita Roy',
        timestamp: '2026-06-15T09:00:00.000Z',
        details: 'Payroll candidate entered Workforce.',
      },
    ],
    createdAt: '2026-06-15T09:00:00.000Z',
    updatedAt: '2026-07-31T18:00:00.000Z',
  },
];

export class WorkforceRepository {
  private items: WorkforceItem[] = [...INITIAL_WORKFORCE_ITEMS];
  private payoutImports: ClientPayoutImportRecord[] = [...SAMPLE_PAYOUT_IMPORTS];
  private columnMappings: Map<string, ColumnMappingConfig> = new Map();

  constructor() {
    this.columnMappings.set('client-001', {
      clientId: 'client-001',
      mapping: {
        'Net Salary': 'earnings',
        'Trips': 'orders',
      },
      updatedAt: '2026-07-31T18:00:00.000Z',
    });
  }

  /**
   * Enforces strict Single Source candidate data consumption.
   * Workforce stores ONLY employment, placements, payout, eligibility, billing, timeline.
   * Candidate info (Name, Phone, Area, City) is consumed dynamically from CRM.
   */
  private async resolveCrmCandidateDetails(item: WorkforceItem): Promise<WorkforceItem> {
    if (!item.candidateId) return item;
    const crmCandidate = await crmRepository.getCandidateById(item.candidateId);
    if (!crmCandidate) return item;

    return {
      ...item,
      candidateName: crmCandidate.name,
      phone: crmCandidate.phone,
      area: crmCandidate.area,
      city: crmCandidate.city,
    };
  }

  async getWorkforceItems(
    activeMonth: string = '2026-07',
    userRole: string = 'Super Admin',
    userSession: { id: string; name: string } = { id: 'user-admin', name: 'Super Admin' }
  ): Promise<WorkforceItem[]> {
    let resolvedItems = await Promise.all(
      this.items.map(async (item) => {
        const withCrm = await this.resolveCrmCandidateDetails(item);
        const workingStatus = WorkforceStatusService.resolveWorkingStatus(
          withCrm.id,
          activeMonth,
          this.payoutImports
        );

        const tenureDays = WorkforceNumberService.calculateTenureDays(
          withCrm.joiningDate || withCrm.activeDate,
          withCrm.lastWorkingDate
        );

        const eligibility =
          withCrm.workforceType === 'OTS'
            ? EligibilityService.calculateOtsEligibility(tenureDays, '90 Days')
            : withCrm.eligibility;

        return {
          ...withCrm,
          workingStatus,
          tenureDays,
          tenureDisplay: WorkforceNumberService.formatTenure(tenureDays),
          eligibility,
        };
      })
    );

    resolvedItems = RankingService.calculateRankings(resolvedItems);

    return WorkforceStatusService.filterWorkforceByRole(resolvedItems, userRole, userSession);
  }

  async getWorkforceItemById(id: string): Promise<WorkforceItem | null> {
    const found = this.items.find((i) => i.id === id || i.candidateId === id);
    if (!found) return null;
    return this.resolveCrmCandidateDetails(found);
  }

  async updateBillingStatus(
    id: string,
    billingStatus: OtsBillingStatus,
    updatedBy: string
  ): Promise<WorkforceItem> {
    const index = this.items.findIndex((i) => i.id === id || i.candidateId === id);
    if (index === -1) {
      throw new Error(`Workforce item '${id}' not found.`);
    }

    const item = this.items[index];
    const updated: WorkforceItem = {
      ...item,
      billingStatus,
      updatedAt: new Date().toISOString(),
      systemAudit: [
        ...item.systemAudit,
        {
          id: `AUD-WF-${Date.now()}`,
          action: 'Status Changed',
          performedBy: updatedBy,
          timestamp: new Date().toISOString(),
          details: `Billing Status updated to ${billingStatus}.`,
        },
      ],
    };

    this.items[index] = updated;
    return this.resolveCrmCandidateDetails(updated);
  }

  async updateAssignment(
    id: string,
    newAssigneeId: string,
    newAssigneeName: string,
    updatedBy: string
  ): Promise<WorkforceItem> {
    const index = this.items.findIndex((i) => i.id === id || i.candidateId === id);
    if (index === -1) {
      throw new Error(`Workforce item '${id}' not found.`);
    }

    const item = this.items[index];
    const updated: WorkforceItem = {
      ...item,
      currentAssignee: newAssigneeName,
      recruiterId: newAssigneeId,
      recruiterName: newAssigneeName,
      updatedAt: new Date().toISOString(),
      systemAudit: [
        ...item.systemAudit,
        {
          id: `AUD-WF-${Date.now()}`,
          action: 'Assigned',
          performedBy: updatedBy,
          timestamp: new Date().toISOString(),
          details: `Reassigned from ${item.currentAssignee} to ${newAssigneeName}.`,
        },
      ],
    };

    this.items[index] = updated;
    return this.resolveCrmCandidateDetails(updated);
  }

  async executeClientTransfer(
    id: string,
    newClientId: string,
    newClientName: string,
    newClientType: 'Payroll' | 'OTS',
    activeDate: string,
    updatedBy: string
  ): Promise<WorkforceItem> {
    const index = this.items.findIndex((i) => i.id === id || i.candidateId === id);
    if (index === -1) {
      throw new Error(`Workforce item '${id}' not found.`);
    }

    const item = this.items[index];
    const newPlacementId = `PL-${Date.now()}`;

    const newPlacement = {
      id: newPlacementId,
      clientId: newClientId,
      clientName: newClientName,
      clientType: newClientType,
      activeDate,
      status: 'Active' as const,
      createdAt: new Date().toISOString(),
    };

    const updatedPlacements = [
      ...item.placementHistory.map((p) => ({ ...p, status: 'Transferred' as const })),
      newPlacement,
    ];

    const updated: WorkforceItem = {
      ...item,
      clientId: newClientId,
      clientName: newClientName,
      workforceType: newClientType,
      activeDate,
      workingFrom: WorkforceNumberService.calculateWorkingFrom(activeDate),
      placementHistory: updatedPlacements,
      updatedAt: new Date().toISOString(),
      systemAudit: [
        ...item.systemAudit,
        {
          id: `AUD-WF-${Date.now()}`,
          action: 'Client Changed',
          performedBy: updatedBy,
          timestamp: new Date().toISOString(),
          details: `Client transfer executed from ${item.clientName} to ${newClientName}. History preserved.`,
        },
      ],
    };

    this.items[index] = updated;
    return this.resolveCrmCandidateDetails(updated);
  }

  async getPayoutImports(): Promise<ClientPayoutImportRecord[]> {
    return [...this.payoutImports];
  }

  async saveColumnMapping(clientId: string, mapping: Record<string, string>): Promise<void> {
    this.columnMappings.set(clientId, {
      clientId,
      mapping,
      updatedAt: new Date().toISOString(),
    });
  }

  async getColumnMapping(clientId: string): Promise<Record<string, string> | null> {
    const config = this.columnMappings.get(clientId);
    return config ? { ...config.mapping } : null;
  }

  async addPayoutImport(importRecord: ClientPayoutImportRecord): Promise<ClientPayoutImportRecord> {
    this.payoutImports.unshift(importRecord);
    await this.saveColumnMapping(importRecord.clientId, importRecord.columnMapping);
    return importRecord;
  }

  async rollbackPayoutImport(importId: string, _performedBy: string): Promise<void> {
    const index = this.payoutImports.findIndex((i) => i.id === importId);
    if (index === -1) {
      throw new Error(`Payout import '${importId}' not found.`);
    }

    const target = this.payoutImports[index];
    if (target.isLocked) {
      throw new Error(`Payout import '${importId}' is locked after approval. Super Admin unlock required.`);
    }

    this.payoutImports.splice(index, 1);
  }

  async toggleLockPayoutImport(importId: string, userRole: string, lockState: boolean): Promise<ClientPayoutImportRecord> {
    const index = this.payoutImports.findIndex((i) => i.id === importId);
    if (index === -1) {
      throw new Error(`Payout import '${importId}' not found.`);
    }

    if (!lockState && userRole !== 'Super Admin') {
      throw new Error('Only Super Admin is permitted to unlock approved payout imports.');
    }

    const updated = {
      ...this.payoutImports[index],
      isLocked: lockState,
    };

    this.payoutImports[index] = updated;
    return updated;
  }
}

export const workforceRepository = new WorkforceRepository();
