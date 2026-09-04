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

    for (const [candidateId, placements] of Object.entries(placementsByCandidate)) {
      if (placements.length > 1) {
        console.error(`Data Integrity Conflict: Candidate ${candidateId} has ${placements.length} active placements. Only one is permitted.`);
        continue; // Exclude from active workforce view
      }

      const placement = placements[0];

      // 2. Fetch candidate
      const candidate = await this.candidateRepo.getCandidateById(placement.candidateId);
      if (!candidate || candidate.currentStatus !== 'Active') continue;

      // 3. Client Verification (Authoritative Lookup)
      let clientConfig;
      try {
        clientConfig = await this.clientIntegration.getClientConfig(placement.clientId);
        if (!clientConfig || !clientConfig.commercialType) throw new Error();
      } catch (e) {
        console.error(`Data Integrity: Client configuration missing or invalid for client ${placement.clientId}.`);
        continue;
      }

      // 4. AP Gate Check
      const apInfo = await this.apIntegration.getAssociatePartnerForCandidate(candidate.id);
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
        const tenureDays = this.calculateOtsTenure(placement.activeDate, placement.lastWorkingDate, placement.joiningDate);
        // We assume clientConfig has tenure configured or fallback to 90
        const configuredTenure = clientConfig.tenureDaysConfig || 90;
        otsData = {
          dateOfBirth: placement.operationalData?.dateOfBirth,
          tenureDays,
          eligibility: this.calculateOtsEligibility(tenureDays, configuredTenure, placement.lastWorkingDate),
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
          // rank would be attached post-aggregation if needed
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

  calculateOtsTenure(activeDate: string, lastWorkingDate?: string, joiningDate?: string): number {
    const startDate = joiningDate ? new Date(joiningDate) : new Date(activeDate);
    const endDate = lastWorkingDate ? new Date(lastWorkingDate) : new Date();
    
    // reset times to midnight
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const diffTime = endDate.getTime() - startDate.getTime();
    if (diffTime < 0) return 0;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  calculateOtsEligibility(tenureDays: number, clientConfiguredTenure: number, _lastWorkingDate?: string): 'Eligible' | 'Not Eligible' {
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
