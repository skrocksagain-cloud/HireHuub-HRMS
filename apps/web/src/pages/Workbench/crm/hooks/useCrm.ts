/* eslint-disable */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';

import { getAuthorizationScope } from '../../../../core/authorization/authorizationResolver';
import { crmRepository } from '../repositories/crmRepository';
import { crmService, type CrmFilterState } from '../services/crmService';
import { clientRepository } from '../../Network/clients/repositories/clientRepository';
import { openingRepository } from '../../openings/repositories/openingRepository';
import { employeeService } from '../../../Employee/services/employeeService';
import { placementService } from '../../workforce/v2/hooks/useWorkforceV2';
import type { Candidate, CreateCandidateInput, ImportHistoryItem, QuickUpdateInput } from '../types/crm';

export function useCrm() {
  const { user } = useAuth();
  
  const effectiveUser = user ?? {
    employeeId: 'HH0000',
    name: 'Beta Super Admin',
    role: 'Super Admin',
    designation: 'Super Admin',
    companyId: 'HH0000',
    assignedRole: 'Super Admin',
    department: 'Administration',
    departmentId: 'admin',
    teamId: undefined,
  };

  if (!user) {
    console.warn('[CRM Hub] No authenticated user session found. Operating with Beta Super Admin session (Company ID: HH0000).');
  }

  const sessionUser = useMemo(() => ({
    id: effectiveUser.employeeId,
    name: effectiveUser.name,
    role: effectiveUser.role,
    assignedRole: effectiveUser.assignedRole || effectiveUser.role,
    department: effectiveUser.department,
    teamId: effectiveUser.teamId,
    departmentId: effectiveUser.departmentId || effectiveUser.department
  }), [effectiveUser]);
  const [allCandidates, setCandidates] = useState<Candidate[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [openings, setOpenings] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);
  const [callsToday, setCallsToday] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CrmFilterState>({ searchQuery: '', quickFilter: 'All' });
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [quickUpdateCandidate, setQuickUpdateCandidate] = useState<Candidate | null>(null);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isQuickUpdateOpen, setIsQuickUpdateOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isAssignmentCenterOpen, setIsAssignmentCenterOpen] = useState(false);
  const [assignmentMode, setAssignmentMode] = useState<'single' | 'bulk' | 'transfer'>('single');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [selectedClientPreview, setSelectedClientPreview] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const [c, cl, o, e, h, calls] = await Promise.all([
        crmRepository.getCandidates(sessionUser),
        clientRepository.getClients(),
        openingRepository.getOpenings(),
        employeeService.getEmployees(),
        crmRepository.getImportHistory(),
        crmRepository.getCallsTodayForUser(sessionUser)
      ]);
      setCandidates(c);
      setClients(cl);
      setOpenings(o);
      setEmployees(e);
      setImportHistory(h);
      setCallsToday(calls);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to load CRM data.');
    } finally {
      setLoading(false);
    }
  }, [sessionUser]);

  useEffect(() => { void refreshData(); }, [refreshData]);

  const activeEmployees = useMemo(() => employees.filter((employee) => employee.employmentStatus === 'Active' || employee.status === 'Active'), [employees]);
  const assignableEmployees = useMemo(() => {
    const scope = getAuthorizationScope(sessionUser.assignedRole || sessionUser.role);
    // Authorization bypass mode - all employees are assignable when scope is GLOBAL
    if (scope === 'OWN') return [];
    if (scope === 'DIRECT_REPORTS') {
      return activeEmployees.filter(e => e.reportingManagerId === sessionUser.id || e.employeeId === sessionUser.id);
    }
    if (scope === 'DEPARTMENT') {
      return activeEmployees.filter(e => e.departmentId === sessionUser.departmentId);
    }
    return activeEmployees; // GLOBAL
  }, [activeEmployees, sessionUser]);
  const candidates = useMemo(() => crmService.filterCandidates(allCandidates, filters, sessionUser), [allCandidates, filters, sessionUser]);
  const kpiSummary = useMemo(() => crmService.calculateKpiSummary(allCandidates, sessionUser, callsToday), [allCandidates, sessionUser, callsToday]);
  const todaysWorkQueue = useMemo(() => crmService.getTodaysWorkQueue(allCandidates, sessionUser), [allCandidates, sessionUser]);

  const showToast = (message: string) => setToastMessage(message);

  const handleAddCandidate = async (input: CreateCandidateInput) => {
    const result = await crmRepository.createCandidate(input, sessionUser);
    await refreshData();
    return result;
  };

  const handleQuickUpdate = async (input: QuickUpdateInput) => {
    const client = clients.find((item) => item.id === input.clientId);

    if (input.status === 'Active') {
      if (!client || (client.commercial?.type !== 'Payroll' && client.commercial?.type !== 'OTS')) {
        throw new Error('Unable to determine Client Type from the selected Network Client. Please verify the Client configuration.');
      }
    }

    const result = await crmRepository.quickUpdate(input, { name: client?.name, type: client?.commercial?.type }, sessionUser);
    
    if (input.status === 'Active' && client && input.clientId) {
      const isAlreadyPlaced = result.placementHistory?.some(
        (p) => p.clientId === input.clientId && p.status === 'Active'
      );
      if (!isAlreadyPlaced) {
        try {
          await placementService.activateCandidateAndCreatePlacement(
            input.candidateId,
            input.clientId,
            { id: sessionUser.id, name: sessionUser.name, role: sessionUser.role },
            {
              payrollEmployeeId: input.payrollEmployeeId,
              activeDate: new Date().toISOString().split('T')[0],
              notes: input.notes
            }
          );
        } catch (err) {
          console.error("Auto-placement failed:", err);
        }
      }
    }

    if (input.status === 'Inactive' || input.status === 'Not Interested') {
       // Ideally we should terminate active placements, but we leave the existing contract
    }

    await refreshData();
    return result;
  };

  return {
    sessionUser, candidates, allCandidates, clients, openings, importHistory, loading, error, filters, setFilters, kpiSummary, todaysWorkQueue,
    selectedCandidate, setSelectedCandidate, isAddDrawerOpen, setIsAddDrawerOpen, isQuickUpdateOpen, setIsQuickUpdateOpen,
    quickUpdateCandidate, setQuickUpdateCandidate, isBulkImportOpen, setIsBulkImportOpen, isAssignmentCenterOpen, setIsAssignmentCenterOpen,
    assignmentMode, setAssignmentMode, selectedCandidateIds, setSelectedCandidateIds, selectedClientPreview, setSelectedClientPreview,
    activeEmployees, assignableEmployees, toastMessage, showToast, refreshData, handleAddCandidate, handleQuickUpdate,
    checkDuplicatePhone: (phone: string) => crmService.checkDuplicatePhone(phone, sessionUser),
    handleReassign: async (id: string, recruiterId: string, recruiterName: string, reason?: string) => {
      await crmRepository.reassignCandidate(id, recruiterId, recruiterName, sessionUser, reason);
      await refreshData();
    },
    handleBulkAssign: async (id: string, name: string) => {
      await crmRepository.bulkAssignCandidates(selectedCandidateIds, id, name, sessionUser);
      await refreshData();
    },
    handleBulkTransfer: async (from: string, id: string, name: string) => {
      await crmRepository.bulkRecruiterTransfer(from, id, name, sessionUser);
      await refreshData();
    },
    handleToggleBlacklist: async (id: string, value: boolean, reason: string) => {
      await crmRepository.toggleBlacklist(id, value, reason, sessionUser);
      await refreshData();
    },
    handleOpenClientPreview: (id: string) => setSelectedClientPreview(clients.find((item) => item.id === id) ?? null)
  };
}
