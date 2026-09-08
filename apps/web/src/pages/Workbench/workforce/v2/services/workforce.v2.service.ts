import type { MonthlyPayoutV2, WorkforceRecordV2 } from '../types/workforce.v2.types';
import type { PlacementRepositoryV2 } from '../../../placement/v2/repositories/placement.v2.repository';
import type { AssociatePartnerIntegrationV2 } from '../../../placement/v2/services/placement.v2.integration';
import type { ClientIntegrationV2 } from '../../../placement/v2/services/placement.v2.integration';

export interface CandidateRepositoryV2 {
  getCandidateById(id: string, transaction?: any): Promise<any | null>;
}

export interface WorkforceContextV2 {
  id: string;
  name: string;
  role: string;
  assignedRole?: string;
  teamId?: string;
  departmentId?: string;
}

export class WorkforceServiceImplV2 {
  candidateRepo: CandidateRepositoryV2;
  placementRepo: PlacementRepositoryV2;
  apIntegration: AssociatePartnerIntegrationV2;
  clientIntegration: ClientIntegrationV2;

  constructor(
    candidateRepo: CandidateRepositoryV2,
    placementRepo: PlacementRepositoryV2,
    apIntegration: AssociatePartnerIntegrationV2,
    clientIntegration: ClientIntegrationV2
  ) {
    this.candidateRepo = candidateRepo;
    this.placementRepo = placementRepo;
    this.apIntegration = apIntegration;
    this.clientIntegration = clientIntegration;
  }

  async getActiveWorkforce(_context: WorkforceContextV2, filters?: { clientId?: string; month?: string; }): Promise<WorkforceRecordV2[]> {
    // 1. Fetch all active placements scoped by canonical authorization
    const activePlacements = await this.placementRepo.queryPlacements({ status: 'Active', userSession: _context, ...filters });
    const records: WorkforceRecordV2[] = [];

    // Group placements by candidateId
    const placementsByCandidate: Record<string, typeof activePlacements> = {};
    for (const p of activePlacements) {
      if (!placementsByCandidate[p.candidateId]) {
        placementsByCandidate[p.candidateId] = [];
      }
      placementsByCandidate[p.candidateId].push(p);
    }

    // Optional: fetch monthly payouts to resolve Working Status and Earnings/Orders
    const monthlyPayouts: any[] = this.placementRepo.queryPayouts ? await this.placementRepo.queryPayouts(filters?.clientId, filters?.month) : [];

    const uniqueCandidateIds = Object.keys(placementsByCandidate);
    const uniqueClientIds = Array.from(new Set(activePlacements.map(p => p.clientId)));

    const candidateMap = new Map<string, any>();
    const apInfoMap = new Map<string, any>();
    const clientConfigMap = new Map<string, any>();

    // Parallel fetch Candidate & Client & AP info to fix N+1 query problem
    await Promise.all([
      // Candidates and APs
      Promise.all(uniqueCandidateIds.map(async (cId) => {
        const candidate = await this.candidateRepo.getCandidateById(cId);
        if (candidate) {
          candidateMap.set(cId, candidate);
          if (candidate.currentStatus === 'Active') {
            const apInfo = await this.apIntegration.getAssociatePartnerForCandidate(cId, candidate);
            if (apInfo) {
              apInfoMap.set(cId, apInfo);
            }
          }
        }
      })),
      // Clients
      Promise.all(uniqueClientIds.map(async (clientId) => {
        try {
          const config = await this.clientIntegration.getClientConfig(clientId);
          if (config && config.commercialType) {
            clientConfigMap.set(clientId, config);
          }
        } catch (e) {
          console.error(`Data Integrity: Client configuration missing or invalid for client ${clientId}.`);
        }
      }))
    ]);

    for (const [candidateId, placements] of Object.entries(placementsByCandidate)) {
      if (placements.length > 1) {
        console.error(`Data Integrity Conflict: Candidate ${candidateId} has ${placements.length} active placements. Only one is permitted.`);
        continue; // Exclude from active workforce view
      }

      const placement = placements[0];

      // 2. Lookup candidate
      const candidate = candidateMap.get(placement.candidateId);
      if (!candidate || candidate.currentStatus !== 'Active') continue;

      // 3. Client Verification (Authoritative Lookup)
      const clientConfig = clientConfigMap.get(placement.clientId);
      if (!clientConfig) continue;

      // 4. AP Gate Check
      const apInfo = apInfoMap.get(candidate.id);
      if (!apInfo || apInfo.status !== 'Joined') continue;

      // 5. Employee ID Sourcing
      const employeeId = placement.clientType === 'Payroll' ? placement.payrollEmployeeId : placement.otsEmployeeId;
      if (!employeeId) {
        console.error(`Data Integrity: Placement ${placement.id} is active but missing required Employee ID.`);
        continue;
      }

      // Operational Payout Resolving
      const matchedPayout = monthlyPayouts.find(p => 
        (p.clientId === placement.clientId || !filters?.clientId) &&
        (p.employeeId === employeeId || p.employeeId === `WF-${candidate.id}`)
      );

      let payrollData: any = undefined;
      let otsData: any = undefined;

      if (placement.clientType === 'Payroll') {
        const hasOrders = matchedPayout && matchedPayout.orders > 0;
        payrollData = {
          dateOfBirth: placement.operationalData?.dateOfBirth,
          aadhaar: placement.operationalData?.aadhaar,
          pan: placement.operationalData?.pan,
          bankAccountNumber: placement.operationalData?.bankAccountNumber,
          ifscCode: placement.operationalData?.ifscCode,
          currentWorkingStatus: filters?.month ? (hasOrders ? 'Working' : 'Not Working') : 'Not Working'
        };
      } else if (placement.clientType === 'OTS') {
        const tenureDays = this.calculateOtsTenure(placement.activeDate, placement.lastWorkingDate);
        const configuredTenure = clientConfig.tenureDaysConfig;
        otsData = {
          dateOfBirth: placement.operationalData?.dateOfBirth,
          tenureDays,
          eligibility: this.calculateOtsEligibility(tenureDays, configuredTenure),
          currentWorkingStatus: placement.lastWorkingDate ? 'Not Working' : 'Working'
        };
      }

      // 6. Construct Read Model
      records.push({
        placement,
        candidate: {
          id: candidate.id,
          name: candidate.name,
          phone: candidate.phone,
          area: candidate.area,
          city: candidate.city
        },
        client: {
          id: placement.clientId,
          name: clientConfig.clientName,
          type: clientConfig.commercialType
        },
        associatePartner: apInfo,
        employeeId,
        workforceType: placement.clientType,
        payroll: payrollData,
        ots: otsData,
        monthly: matchedPayout ? {
          totalEarnings: matchedPayout.earning,
          totalOrders: matchedPayout.orders,
        } : undefined
      });
    }

    // 7. Calculate Ranks if requested
    if (filters?.month && filters?.clientId) {
      const payrollRecords = records.filter(r => r.workforceType === 'Payroll' && r.monthly);
      payrollRecords.sort((a, b) => (b.monthly!.totalOrders || 0) - (a.monthly!.totalOrders || 0));

      let currentRank = 1;
      let currentOrderScore = -1;
      let actualRank = 1;

      for (const record of payrollRecords) {
        if (record.monthly!.totalOrders !== currentOrderScore) {
          currentRank = actualRank;
          currentOrderScore = record.monthly!.totalOrders;
        }
        record.monthly!.rank = currentRank;
        actualRank++;
      }
    }

    return records;
  }

  calculateOtsTenure(activeDate: string, lastWorkingDate?: string): number {
    const startDate = new Date(activeDate);
    const endDate = lastWorkingDate ? new Date(lastWorkingDate) : new Date();
    
    // reset times to midnight
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const diffTime = endDate.getTime() - startDate.getTime();
    if (diffTime < 0) return 0;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  calculateOtsEligibility(tenureDays: number, clientConfiguredTenure?: number): 'Eligible' | 'Not Eligible' | 'Config Missing' {
    if (clientConfiguredTenure === undefined || clientConfiguredTenure === null) {
      return 'Config Missing';
    }
    return tenureDays >= clientConfiguredTenure ? 'Eligible' : 'Not Eligible';
  }

  async importMonthlyPayouts(
    clientId: string,
    month: string,
    rows: { date: string; employeeId: string; name: string; earning: number; orders: number }[]
  ): Promise<MonthlyPayoutV2[]> {
    const placements = await this.placementRepo.queryPlacements({ clientId });
    const imported: MonthlyPayoutV2[] = [];

    for (const row of rows) {
      // MONTHLY PAYOUT MATCHING Rule 15:
      // Resolve Placement by Employee ID + Client
      const matchedPlacement = placements.find(p => 
        (p.clientType === 'Payroll' && p.payrollEmployeeId === row.employeeId) ||
        (p.clientType === 'OTS' && p.otsEmployeeId === row.employeeId)
      );

      if (!matchedPlacement) {
        console.warn(`Could not resolve placement for Employee ID: ${row.employeeId}`);
        continue;
      }

      imported.push({
        id: `payout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        placementId: matchedPlacement.id,
        candidateId: matchedPlacement.candidateId,
        clientId,
        month,
        date: row.date,
        employeeId: row.employeeId,
        nameSnapshot: row.name,
        earning: row.earning,
        orders: row.orders,
        importedAt: new Date().toISOString()
      });
    }

    // Here you would execute a batch write to Firestore.
    return imported;
  }
}
