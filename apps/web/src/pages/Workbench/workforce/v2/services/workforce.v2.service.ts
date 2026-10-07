import type { MonthlyPayoutV2, WorkforceRecordV2 } from '../types/workforce.v2.types';
import type { PlacementRepositoryV2 } from '../../../placement/v2/repositories/placement.v2.repository';
import type { AssociatePartnerIntegrationV2 } from '../../../placement/v2/services/placement.v2.integration';
import type { ClientIntegrationV2 } from '../../../placement/v2/services/placement.v2.integration';

export interface CandidateRepositoryV2 {
  getCandidateById(id: string, transaction?: any): Promise<any | null>;
  queryActiveCandidates?(context: any): Promise<any[]>;
}

export interface WorkforceContextV2 {
  employeeId?: string;
  id: string;
  name: string;
  role: string;
  assignedRole?: string;
  departmentId?: string;
  department?: string;
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
    const crmCandidates = this.candidateRepo.queryActiveCandidates ? await this.candidateRepo.queryActiveCandidates({ userSession: _context }) : [];
    const apJoined = this.apIntegration.getJoinedCandidates ? await this.apIntegration.getJoinedCandidates() : [];

    const populationMap = new Map<string, any>();
    
    for (const c of crmCandidates) {
      if (c.currentCrmStatus === 'Active') {
        populationMap.set(c.id, {
          source: 'CRM',
          candidate: c,
        });
      }
    }

    for (const ap of apJoined) {
      let matchedCrm = Array.from(populationMap.values()).find(x => x.candidate.phone === ap.mobileNumber);
      if (matchedCrm) {
         matchedCrm.apInfo = ap;
      } else {
         const syntheticId = ap.candidateId || "AP-" + ap.id;
         populationMap.set(syntheticId, {
            source: 'AP',
            candidate: {
              id: syntheticId,
              name: ap.candidateName,
              phone: ap.mobileNumber,
              area: ap.city || '',
              city: ap.city || ''
            },
            apInfo: ap
         });
      }
    }

    const allPlacements = await this.placementRepo.queryPlacements({ userSession: _context, ...filters });
    
    const placementsByCandidate = new Map<string, any[]>();
    for (const p of allPlacements) {
      if (!p.candidateId) continue;
      const arr = placementsByCandidate.get(p.candidateId) || [];
      arr.push(p);
      placementsByCandidate.set(p.candidateId, arr);
    }

    const monthlyPayouts: any[] = this.placementRepo.queryPayouts ? await this.placementRepo.queryPayouts(filters?.clientId, filters?.month) : [];

    const records: WorkforceRecordV2[] = [];
    const clientConfigMap = new Map<string, any>();

    const getTimestamp = (val: any): number => {
      if (!val) return 0;
      if (typeof val === 'number') return val;
      if (val.seconds) return val.seconds * 1000;
      if (val.toDate && typeof val.toDate === 'function') return val.toDate().getTime();
      const d = new Date(val);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    };

    for (const [cId, popData] of populationMap.entries()) {
      const candidate = popData.candidate;
      const placements = placementsByCandidate.get(cId) || [];
      
      placements.sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt));
      const currentPlacement = placements[0];

      const resolvedClientId = candidate.currentClientId || currentPlacement?.clientId || '';
      
      let clientConfig: any = null;
      if (resolvedClientId) {
        if (!clientConfigMap.has(resolvedClientId)) {
           try {
             const config = await this.clientIntegration.getClientConfig(resolvedClientId);
             clientConfigMap.set(resolvedClientId, config);
           } catch (e) {
             clientConfigMap.set(resolvedClientId, null);
           }
        }
        clientConfig = clientConfigMap.get(resolvedClientId);
      }

      const employeeId = (currentPlacement?.clientType === 'Payroll' ? currentPlacement.payrollEmployeeId : currentPlacement?.otsEmployeeId) || candidate.payrollEmployeeId;

      const matchedPayout = monthlyPayouts.find(p => 
        (p.clientId === currentPlacement?.clientId || !filters?.clientId) &&
        (p.employeeId === employeeId || p.employeeId === "WF-" + cId)
      );

      let payrollData: any = undefined;
      let otsData: any = undefined;

      if (currentPlacement) {
        if (currentPlacement.clientType === 'Payroll') {
          const hasOrders = matchedPayout && matchedPayout.orders > 0;
          payrollData = {
            dateOfBirth: currentPlacement.operationalData?.dateOfBirth,
            aadhaar: currentPlacement.operationalData?.aadhaar,
            pan: currentPlacement.operationalData?.pan,
            bankAccountNumber: currentPlacement.operationalData?.bankAccountNumber,
            ifscCode: currentPlacement.operationalData?.ifscCode,
            currentWorkingStatus: filters?.month ? (hasOrders ? 'Working' : 'Not Working') : 'Not Working'
          };
        } else if (currentPlacement.clientType === 'OTS') {
          const tenureDays = this.calculateOtsTenure(currentPlacement.activeDate, currentPlacement.lastWorkingDate);
          otsData = {
            dateOfBirth: currentPlacement.operationalData?.dateOfBirth,
            tenureDays,
            eligibility: clientConfig ? this.calculateOtsEligibility(tenureDays, clientConfig.tenureDaysConfig) : 'Config Missing',
            currentWorkingStatus: currentPlacement.lastWorkingDate ? 'Not Working' : 'Working'
          };
        }
      }

      let associatePartner = popData.apInfo ? {
        id: popData.apInfo.partnerId || 'AP',
        name: popData.apInfo.partnerName,
        status: popData.apInfo.status || 'Joined'
      } : (candidate.source?.category === 'Associate Partner' ? {
        id: 'INTERNAL', name: 'Internal Team', status: 'Joined'
      } : undefined);

      records.push({
        placement: currentPlacement || ({} as any),
        candidate: {
          id: candidate.id,
          name: candidate.name,
          phone: candidate.phone,
          area: candidate.area || '',
          city: candidate.city || '',
          assignedRecruiterId: candidate.assignedRecruiterId || '',
          assignedRecruiterName: candidate.assignedRecruiterName || '',
          createdAt: candidate.createdAt,
        },
        client: {
          id: resolvedClientId,
          name: clientConfig?.clientName || candidate.currentClientName || currentPlacement?.clientName || 'Unassigned',
          type: clientConfig?.commercialType || currentPlacement?.clientType || 'Payroll'
        },
        associatePartner,
        employeeId: employeeId || '',
        workforceType: clientConfig?.commercialType || currentPlacement?.clientType || 'Payroll',
        points: currentPlacement?.totalPointAtActivation ?? 0,
        payroll: payrollData,
        ots: otsData,
        monthly: matchedPayout ? {
          totalEarnings: matchedPayout.earning,
          totalOrders: matchedPayout.orders,
        } : undefined
      });
    }

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

    // reset times to midnigh
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
      // Resolve Placement by Employee ID + Clien
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
