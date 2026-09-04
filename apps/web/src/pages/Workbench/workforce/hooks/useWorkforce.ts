/* eslint-disable */
import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  WorkforceItem,
  WorkforceFilterState,
  WorkforceKpiSummary,
  ClientPayoutImportRecord,
  OtsBillingStatus,
  WorkingStatus,
  OtsEligibility
} from '../types/workforce';
import { workforceRepository } from '../repositories/workforceRepository';
import type { Employee } from '../../../Employee/types/Employee';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../../firebase/firebase';
import { useAuth } from '../../../../context/AuthContext';
import { crmRepository } from '../../crm/repositories/crmRepository';
import type { Candidate } from '../../crm/types/crm';
import { clientRepository } from '../../Network/clients/repositories/clientRepository';
import type { Client } from '../../../../types/Client';

const DEFAULT_FILTERS: WorkforceFilterState = {
  workforceType: 'ALL',
  client: 'ALL',
  recruiter: 'ALL',
  associatePartner: 'ALL',
  activeMonth: new Date().toISOString().slice(0, 7),
  city: 'ALL',
  workingStatus: 'ALL',
  searchQuery: '',
};

export function useWorkforce() {
  const { user } = useAuth();
  const currentRole = (user?.role as string) || 'Super Admin';
  const userSession = useMemo(
    () => ({
      id: user?.employeeId || user?.id || 'user-admin',
      name: user?.name || 'Super Admin',
      teamId: user?.teamId,
      departmentId: user?.departmentId,
      assignedRole: user?.assignedRole || (user as any)?.authorization?.role,
    }),
    [user?.employeeId, user?.id, user?.name, user?.teamId, user?.departmentId, user?.assignedRole, (user as any)?.authorization?.role]
  );


  const [rawItems, setRawItems] = useState<WorkforceItem[]>([]);
  const [activeCandidates, setActiveCandidates] = useState<Candidate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [payoutImports, setPayoutImports] = useState<ClientPayoutImportRecord[]>([]);
  const [staffingRecruiters, setStaffingRecruiters] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [filters, setFilters] = useState<WorkforceFilterState>(DEFAULT_FILTERS);

  const fetchWorkforceData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch data from V2 Service
      const { workforceService } = await import('../v2/hooks/useWorkforceV2');
      const v2Records = await workforceService.getActiveWorkforce(
        { 
          id: userSession.id, 
          name: userSession.name, 
          role: currentRole,
          assignedRole: (userSession as any).assignedRole,
          departmentId: (userSession as any).departmentId
        },
        { month: filters.activeMonth }
      );

      const formatDate = (isoStr?: string) => {
        if (!isoStr) return undefined;
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return isoStr;
        return d.toLocaleDateString('en-GB').replace(/\//g, '-');
      };

      // 2. Map strictly to the legacy WorkforceItem shape to keep the UI unharmed
      const mappedItems: WorkforceItem[] = v2Records.map(v2 => ({
        id: v2.employeeId,
        placementBusinessId: v2.placement.placementId || '',
        placementDocId: v2.placement.id,
        workforceType: v2.workforceType, 
        
        candidateId: v2.candidate.id,
        candidateName: v2.candidate.name,
        phone: v2.candidate.phone,
        area: v2.candidate.area,
        city: v2.candidate.city,
        hasActivePlacement: true, 
        candidateLifecycleStatus: 'Active',
        
        clientId: v2.client.id,
        clientName: v2.client.name,
        
        recruiterId: v2.placement.recruiterId || '',
        recruiterName: v2.placement.recruiterName || '',
        associatePartnerId: v2.associatePartner?.id,
        associatePartnerName: v2.associatePartner?.name,

        activeDate: formatDate(v2.placement.activeDate) || formatDate(new Date().toISOString())!,
        workingFrom: formatDate(v2.placement.activeDate) || formatDate(new Date().toISOString())!,
        dateOfBirth: formatDate(v2.payroll?.dateOfBirth || v2.ots?.dateOfBirth || v2.placement.operationalData?.dateOfBirth),
        joiningDate: formatDate(v2.placement.joiningDate || v2.placement.activeDate) || formatDate(new Date().toISOString())!,
        lastWorkingDate: formatDate(v2.placement.lastWorkingDate),
        
        tenureDays: v2.ots?.tenureDays || 0,
        tenureDisplay: `${v2.ots?.tenureDays || 0} Days`,
        
        workingStatus: (v2.workforceType === 'Payroll' 
          ? v2.payroll?.currentWorkingStatus 
          : v2.ots?.currentWorkingStatus) || 'Not Working' as WorkingStatus,
        
        totalEarnings: v2.monthly?.totalEarnings || 0,
        totalOrders: v2.monthly?.totalOrders || 0,
        rank: v2.monthly?.rank,
        
        eligibility: (v2.ots?.eligibility as OtsEligibility) || 'Not Eligible',
        billingStatus: (v2.placement.billingStatus as OtsBillingStatus) || 'Pending',
        
        activatedBy: '',
        currentAssignee: '',
        
        payrollEmployeeId: v2.workforceType === 'Payroll' ? v2.employeeId : undefined,
        supportsOrders: v2.workforceType === 'Payroll',
        placementHistory: [{
          id: v2.placement.id,
          clientId: v2.client.id,
          clientName: v2.client.name,
          clientType: v2.workforceType,
          status: v2.placement.status || 'Active',
          activeDate: formatDate(v2.placement.activeDate) || formatDate(new Date().toISOString())!,
          joiningDate: formatDate(v2.placement.joiningDate || v2.placement.activeDate) || formatDate(new Date().toISOString())!,
          recruiterId: v2.placement.recruiterId || '',
          recruiterName: v2.placement.recruiterName || ''
        }] as any[]
      }) as unknown as WorkforceItem);

      // 3. Keep Payout Imports fetching for KPIs/History 
      const imports = await workforceRepository.getPayoutImports();
      
      const sessionForCrm = { ...userSession, role: currentRole };
      const crmCandidates = await crmRepository.getCandidates(sessionForCrm);
      const activeIntake = crmCandidates.filter((c) => c.currentCrmStatus === 'Active');

      const allClients = await clientRepository.getClients();

      const { employeeService } = await import('../../../Employee/services/employeeService');
      const employees = await employeeService.getEmployees();
      const staffingMembers = employees.filter(e => e.department === 'Staffing');

      setRawItems(mappedItems);
      setPayoutImports(imports);
      setActiveCandidates(activeIntake);
      setClients(allClients);
      setStaffingRecruiters(staffingMembers);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load workforce data.');
    } finally {
      setLoading(false);
    }
  }, [filters.activeMonth, currentRole, userSession.id, userSession.name]);

  useEffect(() => {
    fetchWorkforceData();
  }, [fetchWorkforceData]);

  // Client-side filtering across search and selected dropdowns
  const filteredWorkforce = useMemo(() => {
    return rawItems.filter((item) => {
      // 1. Remove candidates without an active placement OR if their CRM lifecycle explicitly marks them as Inactive
      if (!item.hasActivePlacement || item.candidateLifecycleStatus === 'Inactive') return false;

      const normalizedSearch = filters.searchQuery.replace(/[\s-]/g, '').toLowerCase();
      const normalizedPhone = item.phone.replace(/[\s-]/g, '').toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        item.candidateName.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        normalizedPhone.includes(normalizedSearch) ||
        item.id.toLowerCase().includes(filters.searchQuery.toLowerCase());

      const matchesClient =
        filters.client === 'ALL' || item.clientId === filters.client || item.clientName === filters.client;

      const matchesRecruiter =
        filters.recruiter === 'ALL' || item.recruiterName === filters.recruiter;

      return (
        matchesSearch &&
        matchesClient &&
        matchesRecruiter
      );
    });
  }, [rawItems, filters]);

  const kpiSummary: WorkforceKpiSummary = useMemo(() => {
    // C2. Total Active OTS: active OTS placements + LWD is empty.
    const otsCount = filteredWorkforce.filter((w) => w.workforceType === 'OTS' && !w.lastWorkingDate).length;

    // C1. Total Active Payroll: active Payroll placements + completed at least one delivery/order (totalOrders > 0).
    const payrollCount = filteredWorkforce.filter((w) => w.workforceType === 'Payroll' && (w.totalOrders || 0) > 0).length;

    // C3. Total Active = sum of approved active definitions.
    const activeWorkforce = otsCount + payrollCount;

    const workingCount = filteredWorkforce.filter((w) => w.workingStatus === 'Working').length;
    const notWorkingCount = filteredWorkforce.filter((w) => w.workingStatus === 'Not Working').length;

    // Check if order data exists in filtered subset
    const candidatesWithOrders = filteredWorkforce.filter(
      (w) => w.supportsOrders && (w.totalOrders || 0) > 0
    );
    const hasOrderData = candidatesWithOrders.length > 0;

    let totalOrders = 0;
    let averageOrders = 0;
    let topPerformerName: string | undefined = undefined;

    if (hasOrderData) {
      totalOrders = candidatesWithOrders.reduce((sum, w) => sum + (w.totalOrders || 0), 0);
      averageOrders = Math.round(totalOrders / candidatesWithOrders.length);
      const topCandidate = [...candidatesWithOrders].sort(
        (a, b) => (b.totalOrders || 0) - (a.totalOrders || 0)
      )[0];
      topPerformerName = topCandidate ? `${topCandidate.candidateName}\n${topCandidate.totalOrders} Orders` : undefined;
    }

    const eligibleForBilling = filteredWorkforce.filter((w) => w.eligibility === 'Eligible').length;
    const pendingBilling = filteredWorkforce.filter(
      (w) => w.eligibility === 'Eligible' && w.billingStatus === 'Pending'
    ).length;

    // Calculate Last Month Working Candidates KPI
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    const lastMonthString = lastMonthDate.toISOString().slice(0, 7);

    const lastMonthWorkingCount = filteredWorkforce.filter((w) => {
      // Find if candidate was in approved imports for lastMonthString
      const relevantImports = payoutImports.filter(imp => imp.month === lastMonthString && imp.isApproved);
      for (const imp of relevantImports) {
        const match = imp.rows.find((r: any) => 
          r.matched && 
          (r.employeeId.trim().toLowerCase() === w.id.trim().toLowerCase() ||
           r.employeeId.trim().toLowerCase() === (w.payrollEmployeeId || '').trim().toLowerCase())
        );
        if (match) return true;
      }
      return false;
    }).length;

    return {
      activeWorkforce,
      payrollCount,
      otsCount,
      workingCount,
      notWorkingCount,
      hasOrderData,
      totalOrders,
      averageOrders,
      topPerformerName,
      eligibleForBilling,
      pendingBilling,
      lastMonthWorkingCount,
    };
  }, [filteredWorkforce, payoutImports]);

  const updateBillingStatus = async (id: string, billingStatus: OtsBillingStatus) => {
    try {
      const item = rawItems.find(r => r.id === id) as any;
      const placementId = item?.placementId;
      if (!placementId) throw new Error('Placement not found');

      await updateDoc(doc(db, 'placements', placementId), { billingStatus });
      await fetchWorkforceData();
    } catch (err: unknown) {
      throw err;
    }
  };

  const updateAssignment = async (id: string, employee: Employee) => {
    try {
      const item = rawItems.find(r => r.id === id) as any;
      const placementId = item?.placementId;
      if (!placementId) throw new Error('Placement not found');

      await updateDoc(doc(db, 'placements', placementId), { recruiterId: employee.id, recruiterName: employee.fullName });
      await fetchWorkforceData();
    } catch (err: unknown) {
      throw err;
    }
  };

  const terminatePlacement = async (id: string, lastWorkingDate: string, _reason: string) => {
    try {
      const { placementService } = await import('../v2/hooks/useWorkforceV2');
      const item = rawItems.find(r => r.id === id) as any;
      const placementId = item?.placementId;
      if (!placementId) throw new Error('Placement not found');

      await placementService.terminatePlacement(placementId, lastWorkingDate, { id: userSession.id, name: userSession.name, role: currentRole });
      await fetchWorkforceData();
    } catch (err: unknown) {
      throw err;
    }
  };

  const completePlacement = async (id: string, lastWorkingDate: string) => {
    try {
      const { placementService } = await import('../v2/hooks/useWorkforceV2');
      const item = rawItems.find(r => r.id === id) as any;
      const placementId = item?.placementId;
      if (!placementId) throw new Error('Placement not found');

      await placementService.terminatePlacement(placementId, lastWorkingDate, { id: userSession.id, name: userSession.name, role: currentRole });
      await fetchWorkforceData();
    } catch (err: unknown) {
      throw err;
    }
  };

  const executeClientTransfer = async (
    id: string,
    lastWorkingDate: string,
    newClientId: string,
    _newClientName: string,
    _newClientType: 'Payroll' | 'OTS',
    newActiveDate: string,
    payrollEmployeeId?: string,
    _dateOfBirth?: string,
    _aadhaarNumber?: string,
    _panNumber?: string,
    _bankAccountNumber?: string,
    _ifscCode?: string
  ) => {
    try {
      const { placementService } = await import('../v2/hooks/useWorkforceV2');
      const item = rawItems.find(r => r.id === id) as any;
      const placementId = item?.placementId;
      if (!placementId) throw new Error('Placement not found');

      await placementService.transferPlacement(placementId, newClientId, lastWorkingDate, { id: userSession.id, name: userSession.name, role: currentRole } as any, {
        newPayrollEmployeeId: payrollEmployeeId,
        newActiveDate: newActiveDate
      });
      // Optionally we could update Operational Data for KYC fields if they are provided, but for now we just run the transfer.
      
      await fetchWorkforceData();
    } catch (err: unknown) {
      throw err;
    }
  };

  const importClientPayout = async (importRecord: ClientPayoutImportRecord) => {
    try {
      await workforceRepository.addPayoutImport(importRecord);
      await fetchWorkforceData();
    } catch (err: unknown) {
      throw err;
    }
  };

  const rollbackPayoutImport = async (importId: string) => {
    try {
      await workforceRepository.rollbackPayoutImport(importId, userSession.name);
      await fetchWorkforceData();
    } catch (err: unknown) {
      throw err;
    }
  };

  const toggleLockImport = async (importId: string, lockState: boolean) => {
    try {
      await workforceRepository.toggleLockPayoutImport(importId, currentRole, lockState);
      await fetchWorkforceData();
    } catch (err: unknown) {
      throw err;
    }
  };

  const updateLastWorkingDate = async (id: string, phone: string, candidateId: string, lastWorkingDate: string | null) => {
    try {
      await workforceRepository.updateLastWorkingDate(id, phone, candidateId, lastWorkingDate);
      await fetchWorkforceData(); // Refresh the list after updating
    } catch (err: any) {
      console.error('Failed to update Last Working Date:', err);
      throw err;
    }
  };

  return {
    workforce: filteredWorkforce,
    allWorkforce: rawItems,
    kpiSummary,
    activeCandidates,
    clients,
    payoutImports,
    loading,
    error,
    filters,
    setFilters,
    currentRole,
    userSession,
    updateBillingStatus,
    updateAssignment,
    terminatePlacement,
    completePlacement,
    executeClientTransfer,
    importClientPayout,
    rollbackPayoutImport,
    toggleLockImport,
    updateLastWorkingDate,
    staffingRecruiters,
    refreshWorkforce: fetchWorkforceData,
  };
}
