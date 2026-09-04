import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../../../firebase/firebase';
import type {
  ClientPayoutImportRecord,
  ColumnMappingConfig,
  OtsBillingStatus,
  WorkforceItem,
} from '../types/workforce';
import { WorkforceNumberService } from '../services/WorkforceNumberService';
import { PayoutAggregationService } from '../services/PayoutAggregationService';
import { EligibilityService } from '../services/EligibilityService';
import { WorkforceStatusService } from '../services/WorkforceStatusService';
import { RankingService } from '../services/RankingService';
import { crmRepository } from '../../crm/repositories/crmRepository';
import { associatePartnerRepository } from '../../Network/associatePartners/repositories/associatePartnerRepository';
import { clientRepository } from '../../Network/clients/repositories/clientRepository';
import type { Employee } from '../../../Employee/types/Employee';

const workforceCollection = collection(db, 'workforce');
const importsCollection = collection(db, 'workforce_imports');

const workforceFromDoc = (id: string, value: Record<string, unknown>): WorkforceItem => ({
  id,
  candidateId: String(value.candidateId ?? ''),
  candidateName: String(value.candidateName ?? ''),
  phone: String(value.phone ?? ''),
  area: String(value.area ?? ''),
  city: String(value.city ?? ''),
  clientId: String(value.clientId ?? ''),
  clientName: String(value.clientName ?? ''),
  workforceType: (value.workforceType as WorkforceItem['workforceType']) || 'Payroll',
  recruiterId: String(value.recruiterId ?? ''),
  recruiterName: String(value.recruiterName ?? ''),
  associatePartnerId: value.associatePartnerId ? String(value.associatePartnerId) : undefined,
  associatePartnerName: value.associatePartnerName ? String(value.associatePartnerName) : undefined,
  teamLeadId: value.teamLeadId ? String(value.teamLeadId) : undefined,
  teamLeadName: value.teamLeadName ? String(value.teamLeadName) : undefined,
  activeDate: String(value.activeDate ?? ''),
  workingFrom: String(value.workingFrom ?? ''),
  dateOfBirth: value.dateOfBirth ? String(value.dateOfBirth) : undefined,
  joiningDate: value.joiningDate ? String(value.joiningDate) : undefined,
  lastWorkingDate: value.lastWorkingDate ? String(value.lastWorkingDate) : undefined,
  tenureDays: Number(value.tenureDays ?? 0),
  tenureDisplay: String(value.tenureDisplay ?? ''),
  workingStatus: (value.workingStatus as WorkforceItem['workingStatus']) || 'Working',
  totalEarnings: Number(value.totalEarnings ?? 0),
  totalOrders: value.totalOrders !== undefined ? Number(value.totalOrders) : undefined,
  rank: value.rank !== undefined ? Number(value.rank) : undefined,
  eligibility: (value.eligibility as WorkforceItem['eligibility']) || 'Pending',
  billingStatus: (value.billingStatus as WorkforceItem['billingStatus']) || 'Pending',
  activatedBy: String(value.activatedBy ?? ''),
  currentAssignee: String(value.currentAssignee ?? ''),
  reportingTeamLead: String(value.reportingTeamLead ?? ''),
  supportsOrders: Boolean(value.supportsOrders),
  lastPayoutImportDate: value.lastPayoutImportDate ? String(value.lastPayoutImportDate) : undefined,
  placementHistory: Array.isArray(value.placementHistory) ? (value.placementHistory as WorkforceItem['placementHistory']) : [],
  systemAudit: Array.isArray(value.systemAudit) ? (value.systemAudit as WorkforceItem['systemAudit']) : [],
  createdAt: String(value.createdAt ?? ''),
  updatedAt: String(value.updatedAt ?? ''),
  aadhaarNumber: value.aadhaarNumber ? String(value.aadhaarNumber) : undefined,
  panNumber: value.panNumber ? String(value.panNumber) : undefined,
  bankAccountNumber: value.bankAccountNumber ? String(value.bankAccountNumber) : undefined,
  ifscCode: value.ifscCode ? String(value.ifscCode) : undefined,
  hasActivePlacement: Boolean(value.hasActivePlacement),
});

const importFromDoc = (id: string, value: Record<string, unknown>): ClientPayoutImportRecord => ({
  id,
  version: Number(value.version ?? 1),
  clientId: String(value.clientId ?? ''),
  clientName: String(value.clientName ?? ''),
  importPeriod: (value.importPeriod as ClientPayoutImportRecord['importPeriod']) || 'Monthly',
  month: String(value.month ?? ''),
  importedAt: String(value.importedAt ?? ''),
  importedBy: String(value.importedBy ?? ''),
  isApproved: Boolean(value.isApproved),
  isLocked: Boolean(value.isLocked),
  totalRecords: Number(value.totalRecords ?? 0),
  matchedRecords: Number(value.matchedRecords ?? 0),
  unmatchedRecords: Number(value.unmatchedRecords ?? 0),
  duplicateCount: Number(value.duplicateCount ?? 0),
  missingIdCount: Number(value.missingIdCount ?? 0),
  invalidEarningsCount: Number(value.invalidEarningsCount ?? 0),
  invalidDateCount: Number(value.invalidDateCount ?? 0),
  totalEarnings: Number(value.totalEarnings ?? 0),
  totalOrders: Number(value.totalOrders ?? 0),
  columnMapping: typeof value.columnMapping === 'object' && value.columnMapping ? (value.columnMapping as Record<string, string>) : {},
  rows: Array.isArray(value.rows) ? (value.rows as ClientPayoutImportRecord['rows']) : [],
});

export class WorkforceRepository {

  getWorkforceRef(id?: string) {
    if (!id) return doc(workforceCollection);
    return doc(workforceCollection, id);
  }

  async getNextOtsId(): Promise<string> {
    // Generate a proper sequential OTS ID
    const snap = await getDocs(workforceCollection);
    const otsItems = snap.docs
      .map(d => d.id)
      .filter(id => id.startsWith('HHWF'))
      .map(id => parseInt(id.replace('HHWF', ''), 10))
      .filter(n => !isNaN(n));
      
    const maxSeq = otsItems.length > 0 ? Math.max(...otsItems) : 0;
    return WorkforceNumberService.generateOtsWorkforceId(maxSeq + 1);
  }

  async getWorkforceItems(
    activeMonth: string = new Date().toISOString().slice(0, 7),
    userRole: string = 'Super Admin',
    userSession: { id: string; name: string; teamId?: string; departmentId?: string } = { id: 'user-admin', name: 'Super Admin' }
  ): Promise<WorkforceItem[]> {
    const [wfSnapshot, payoutImports, crmCandidates, apPartners, clients] = await Promise.all([
      getDocs(workforceCollection),
      this.getPayoutImports(),
      crmRepository.getCandidates(),
      associatePartnerRepository.getPartners(),
      clientRepository.getClients(),
    ]);

    const clientMap = new Map<string, any>();
    for (const c of clients) {
      if (c.id) clientMap.set(c.id, c);
      if (c.name) clientMap.set(c.name, c);
    }

    // Map historical workforce data by candidate phone (since IDs might differ for AP)
    // We prioritize canonical candidateId if it exists.
    const historicalDocs = wfSnapshot.docs.map(d => workforceFromDoc(d.id, d.data()));
    const historyById = new Map<string, WorkforceItem>();
    const historyByPhone = new Map<string, WorkforceItem>();
    
    for (const h of historicalDocs) {
      if (h.candidateId) historyById.set(h.candidateId, h);
      if (h.phone) historyByPhone.set(h.phone, h);
    }

    const liveItemsMap = new Map<string, WorkforceItem>();

    // 1. Process CRM Active Placements
    for (const cand of crmCandidates) {
      if (cand.currentCrmStatus === 'Active') {
        const h = historyById.get(cand.id) || historyByPhone.get(cand.phone);
        const activePlacement = cand.placementHistory?.find(p => p.status === 'Active' && p.clientId === cand.currentClientId);
        
        const finalClientId = cand.currentClientId || activePlacement?.clientId || h?.clientId || '';
        const finalClientName = cand.currentClientName || activePlacement?.clientName || h?.clientName || 'Unknown Client';
        
        const clientRecord = clientMap.get(finalClientId) || clientMap.get(finalClientName);
        const finalWorkforceType = clientRecord?.commercial?.type || clientRecord?.clientType || (clientRecord ? 'Payroll' : '');

        const item: WorkforceItem = {
          id: h?.id || `WF-${cand.id}`,
          candidateId: cand.id,
          candidateName: cand.name,
          phone: cand.phone,
          area: cand.area,
          city: cand.city,
          clientId: finalClientId,
          clientName: finalClientName,
          workforceType: finalWorkforceType as any,
          recruiterId: cand.assignedRecruiterId || '',
          recruiterName: cand.assignedRecruiterName || '',
          teamLeadId: cand.teamId,
          teamLeadName: cand.teamName,
          teamId: cand.teamId,
          teamName: cand.teamName,
          departmentId: cand.departmentId,
          activeDate: activePlacement?.activeDate || h?.activeDate || cand.updatedAt.slice(0, 10) || new Date().toISOString().slice(0, 10),
          workingFrom: activePlacement?.activeDate || h?.workingFrom || cand.updatedAt.slice(0, 10) || new Date().toISOString().slice(0, 10),
          dateOfBirth: cand.dateOfBirth,
          joiningDate: h?.joiningDate || activePlacement?.activeDate || cand.updatedAt.slice(0, 10) || new Date().toISOString().slice(0, 10),
          lastWorkingDate: h?.lastWorkingDate,
          tenureDays: 0,
          tenureDisplay: '',
          workingStatus: 'Working',
          totalEarnings: h?.totalEarnings || 0,
          eligibility: h?.eligibility || 'Not Eligible',
          billingStatus: h?.billingStatus || 'Pending',
          activatedBy: cand.assignedRecruiterName || '',
          currentAssignee: cand.assignedRecruiterName || '',
          reportingTeamLead: cand.teamName || '',
          supportsOrders: h?.supportsOrders || false,
          placementHistory: cand.placementHistory as any,
          systemAudit: h?.systemAudit || [],
          createdAt: activePlacement?.createdAt || cand.createdAt,
          updatedAt: h?.updatedAt || cand.updatedAt,
          payrollEmployeeId: cand.payrollEmployeeId || h?.payrollEmployeeId,
          hasActivePlacement: true,
          candidateLifecycleStatus: cand.currentCrmStatus || 'Active',
        };
        liveItemsMap.set(cand.id, item);
      }
    }

    // 2. Process AP Joined Submissions
    for (const partner of apPartners) {
      for (const sub of partner.submissions) {
        if (sub.status === 'Joined') {
          // Deduplicate if already processed via CRM
          const existingByPhone = Array.from(liveItemsMap.values()).find(i => i.phone === sub.mobileNumber);
          if (existingByPhone) continue;

          const h = historyByPhone.get(sub.mobileNumber);
          
          const finalClientId = sub.clientId || h?.clientId || '';
          const finalClientName = sub.clientName || h?.clientName || 'Unknown Client';
          const clientRecord = clientMap.get(finalClientId) || clientMap.get(finalClientName);
          const finalWorkforceType = clientRecord?.commercial?.type || clientRecord?.clientType || (clientRecord ? 'Payroll' : '');

          const item: WorkforceItem = {
            id: h?.id || `WF-AP-${sub.id}`,
            candidateId: h?.candidateId || `HHCD-${Date.now().toString().slice(-6)}`,
            candidateName: sub.candidateName,
            phone: sub.mobileNumber,
            area: sub.city || '',
            city: sub.city || '',
            clientId: finalClientId,
            clientName: finalClientName,
            workforceType: finalWorkforceType as any,
            recruiterId: partner.reportingTo?.employeeId || '',
            recruiterName: partner.reportingTo?.employeeName || '',
            associatePartnerId: partner.id,
            associatePartnerName: partner.subVendorName || partner.name,
            activeDate: sub.submissionDate,
            workingFrom: sub.submissionDate,
            joiningDate: h?.joiningDate || sub.joiningDate,
            lastWorkingDate: h?.lastWorkingDate,
            tenureDays: 0,
            tenureDisplay: '',
            workingStatus: 'Working',
            totalEarnings: h?.totalEarnings || 0,
            eligibility: (sub.eligibilityStatus as any) || h?.eligibility || 'Not Eligible',
            billingStatus: h?.billingStatus || 'Pending',
            activatedBy: partner.reportingTo?.employeeName || '',
            currentAssignee: partner.reportingTo?.employeeName || '',
            reportingTeamLead: partner.reportingTo?.employeeName || '',
            supportsOrders: h?.supportsOrders || false,
            placementHistory: h?.placementHistory || [],
            systemAudit: h?.systemAudit || [],
            createdAt: h?.createdAt || sub.submissionDate,
            updatedAt: h?.updatedAt || sub.submissionDate,
            hasActivePlacement: true,
            candidateLifecycleStatus: 'Active',
          };
          liveItemsMap.set(item.candidateId, item);
        }
      }
    }

    let resolvedItems = Array.from(liveItemsMap.values());

    // Resolve Operational Details (Tenure & Eligibility)
    resolvedItems = resolvedItems.map((item) => {
      const workingStatus = WorkforceStatusService.resolveWorkingStatus(
        item.id,
        activeMonth,
        payoutImports
      );

      const tenureDays = WorkforceNumberService.calculateTenureDays(
        item.joiningDate || item.activeDate,
        item.lastWorkingDate
      );

      const clientRecord = clientMap.get(item.clientId) || clientMap.get(item.clientName);
      
      const eligibility =
        item.workforceType === 'OTS'
          ? EligibilityService.calculateOtsEligibility(tenureDays, clientRecord?.commercial?.tenureCondition)
          : item.eligibility;

      const aggregations = PayoutAggregationService.aggregateMonthlyTotals(
        item.id,
        activeMonth,
        payoutImports
      );

      return {
        ...item,
        workingStatus,
        tenureDays,
        tenureDisplay: WorkforceNumberService.formatTenure(tenureDays),
        eligibility,
        totalEarnings: aggregations.totalEarnings > 0 ? aggregations.totalEarnings : (item.totalEarnings || 0),
        totalOrders: aggregations.totalOrders > 0 ? aggregations.totalOrders : (item.totalOrders || 0),
        lastPayoutImportDate: aggregations.lastImportDate || item.lastPayoutImportDate,
        supportsOrders: item.workforceType === 'OTS' || aggregations.totalOrders > 0 || item.supportsOrders,
      };
    });

    resolvedItems = RankingService.calculateRankings(resolvedItems);

    return WorkforceStatusService.filterWorkforceByRole(resolvedItems, userRole, userSession as any);
  }

  async getWorkforceItemById(id: string): Promise<WorkforceItem | null> {
    const all = await this.getWorkforceItems();
    return all.find(i => i.id === id || i.candidateId === id) || null;
  }

  async updateBillingStatus(
    id: string,
    billingStatus: OtsBillingStatus,
    updatedBy: string
  ): Promise<WorkforceItem> {
    const item = await this.getWorkforceItemById(id);
    if (!item) {
      throw new Error(`Workforce item '${id}' not found.`);
    }

    const docRef = doc(db, 'workforce', item.id);
    const updatedAudit = [
      ...item.systemAudit,
      {
        id: `AUD-WF-${Date.now()}`,
        action: 'Status Changed',
        performedBy: updatedBy,
        timestamp: new Date().toISOString(),
        details: `Billing Status updated to ${billingStatus}.`,
      },
    ];

    await updateDoc(docRef, {
      billingStatus,
      updatedAt: new Date().toISOString(),
      systemAudit: updatedAudit,
    });

    const updatedSnap = await this.getWorkforceItemById(item.id);
    return updatedSnap!;
  }

  async updateAssignment(
    id: string,
    employee: Employee,
    updatedBy: string
  ): Promise<WorkforceItem> {
    const item = await this.getWorkforceItemById(id);
    if (!item) {
      throw new Error(`Workforce item '${id}' not found.`);
    }

    const docRef = doc(db, 'workforce', item.id);
    const newAssigneeId = employee.employeeId || employee.id || '';
    const newAssigneeName = employee.fullName || `${employee.firstName} ${employee.lastName}`;
    
    const updatedAudit = [
      ...item.systemAudit,
      {
        id: `AUD-WF-${Date.now()}`,
        action: 'Assigned',
        performedBy: updatedBy,
        timestamp: new Date().toISOString(),
        details: `Reassigned from ${item.currentAssignee} to ${newAssigneeName}.`,
      },
    ];

    await updateDoc(docRef, {
      currentAssignee: newAssigneeName,
      recruiterId: newAssigneeId,
      recruiterName: newAssigneeName,
      reportingTeamLead: employee.reportingManager || '',
      teamLeadId: employee.reportingManagerId || '',
      teamLeadName: employee.reportingManager || '',
      teamId: employee.teamId || '',
      teamName: employee.teamName || '',
      departmentId: employee.departmentId || '',
      department: employee.department || '',
      updatedAt: new Date().toISOString(),
      systemAudit: updatedAudit,
    });

    const updatedSnap = await this.getWorkforceItemById(item.id);
    return updatedSnap!;
  }

  updateWorkforceLifecycleInBatch(
    workforceId: string,
    updates: Partial<WorkforceItem>,
    batch: any
  ): void {
    const docRef = doc(db, 'workforce', workforceId);
    batch.update(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  async getPayoutImports(): Promise<ClientPayoutImportRecord[]> {
    const snap = await getDocs(importsCollection);
    const imports = snap.docs.map((d) => importFromDoc(d.id, d.data()));
    return imports.sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime());
  }

  async saveColumnMapping(clientId: string, mapping: Record<string, string>): Promise<void> {
    const docRef = doc(db, 'workforce_column_mappings', clientId);
    const config: ColumnMappingConfig = {
      clientId,
      mapping,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, config);
  }

  async getColumnMapping(clientId: string): Promise<Record<string, string> | null> {
    const docRef = doc(db, 'workforce_column_mappings', clientId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data() as ColumnMappingConfig;
    return data.mapping || null;
  }

  async addPayoutImport(importRecord: ClientPayoutImportRecord): Promise<ClientPayoutImportRecord> {
    const docRef = await addDoc(importsCollection, {
      ...importRecord,
      importedAt: importRecord.importedAt || new Date().toISOString(),
    });
    await this.saveColumnMapping(importRecord.clientId, importRecord.columnMapping);
    return { ...importRecord, id: docRef.id };
  }

  async rollbackPayoutImport(importId: string, _performedBy: string): Promise<void> {
    const docRef = doc(db, 'workforce_imports', importId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error(`Payout import '${importId}' not found.`);
    }

    const data = snap.data() as ClientPayoutImportRecord;
    if (data.isLocked) {
      throw new Error(`Payout import '${importId}' is locked after approval. Super Admin unlock required.`);
    }

    await setDoc(docRef, { isRollbacked: true, rollbackedBy: _performedBy, rollbackedAt: new Date().toISOString() }, { merge: true });
  }

  async toggleLockPayoutImport(importId: string, userRole: string, lockState: boolean): Promise<ClientPayoutImportRecord> {
    const docRef = doc(db, 'workforce_imports', importId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error(`Payout import '${importId}' not found.`);
    }

    if (!lockState && userRole !== 'Super Admin') {
      throw new Error('Only Super Admin is permitted to unlock approved payout imports.');
    }

    await updateDoc(docRef, { isLocked: lockState });
    const updatedSnap = await getDoc(docRef);
    return importFromDoc(updatedSnap.id, updatedSnap.data() as Record<string, unknown>);
  }


  async updateLastWorkingDate(id: string, phone: string, candidateId: string, lastWorkingDate: string | null): Promise<void> {
    const docRef = doc(db, 'workforce', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      // If historical doc doesn't exist, create it with minimum fields
      await setDoc(docRef, {
        candidateId,
        phone,
        lastWorkingDate: lastWorkingDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      await updateDoc(docRef, {
        lastWorkingDate: lastWorkingDate || null,
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

export const workforceRepository = new WorkforceRepository();

