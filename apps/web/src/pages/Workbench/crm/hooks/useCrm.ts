import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  Candidate,
  CreateCandidateInput,
  QuickUpdateInput,
  ImportHistoryItem,
  DuplicateCheckResult,
} from '../types/crm';
import { crmRepository } from '../repositories/crmRepository';
import { crmService, type CrmFilterState, type KpiSummary } from '../services/crmService';
import { clientRepository } from '../../Network/clients/repositories/clientRepository';
import { openingRepository } from '../../openings/repositories/openingRepository';
import { employeeService } from '../../../Employee/services/employeeService';
import type { Employee } from '../../../Employee/types/Employee';
import type { Client } from '../../../../types/Client';
import type { Opening } from '../../../../types/Opening';

export interface UserSession {
  id: string;
  name: string;
  role: 'Recruiter' | 'Team Leader' | 'Manager' | 'Staffing' | 'Admin' | 'Super Admin' | 'HR' | 'Finance' | 'Marketing';
  teamId?: string;
  teamName?: string;
}

const DEFAULT_USER: UserSession = {
  id: 'admin-001',
  name: 'Sanjay Gupta (Staffing Admin)',
  role: 'Staffing',
  teamId: 'team-pune',
  teamName: 'Pune Staffing Team',
};

const SAMPLE_ACTIVE_PEOPLE_EMPLOYEES: Employee[] = [
  {
    employeeId: 'user-001',
    employeeCode: 'EMP001',
    firstName: 'Rahul',
    lastName: 'Sharma',
    fullName: 'Rahul Sharma',
    gender: 'Male',
    dateOfBirth: '1995-04-10',
    mobileNumber: '9876543210',
    email: 'rahul.sharma@hirehuub.com',
    department: 'Staffing',
    designation: 'Recruiter',
    reportingManager: 'Vikram Patil',
    reportingManagerId: 'tl-001',
    employmentType: 'Permanent',
    joiningDate: '2025-01-15',
    workLocation: 'Pune',
    employmentStatus: 'Active',
    photoUrl: '',
    address: 'Pune',
    emergencyContact: '9876543211',
    notes: '',
  },
  {
    employeeId: 'user-002',
    employeeCode: 'EMP002',
    firstName: 'Anita',
    lastName: 'Roy',
    fullName: 'Anita Roy',
    gender: 'Female',
    dateOfBirth: '1996-08-20',
    mobileNumber: '9812345678',
    email: 'anita.roy@hirehuub.com',
    department: 'Staffing',
    designation: 'Recruiter',
    reportingManager: 'Vikram Patil',
    reportingManagerId: 'tl-001',
    employmentType: 'Permanent',
    joiningDate: '2025-02-01',
    workLocation: 'Pune',
    employmentStatus: 'Active',
    photoUrl: '',
    address: 'Pune',
    emergencyContact: '9812345679',
    notes: '',
  },
  {
    employeeId: 'tl-001',
    employeeCode: 'EMP003',
    firstName: 'Vikram',
    lastName: 'Patil',
    fullName: 'Vikram Patil',
    gender: 'Male',
    dateOfBirth: '1990-11-05',
    mobileNumber: '9988776655',
    email: 'vikram.patil@hirehuub.com',
    department: 'Staffing',
    designation: 'Team Lead',
    reportingManager: 'Sanjay Gupta',
    reportingManagerId: 'admin-001',
    employmentType: 'Permanent',
    joiningDate: '2024-06-10',
    workLocation: 'Pune',
    employmentStatus: 'Active',
    photoUrl: '',
    address: 'Pune',
    emergencyContact: '9988776654',
    notes: '',
  },
  {
    employeeId: 'admin-001',
    employeeCode: 'EMP004',
    firstName: 'Sanjay',
    lastName: 'Gupta',
    fullName: 'Sanjay Gupta',
    gender: 'Male',
    dateOfBirth: '1985-03-15',
    mobileNumber: '9123456789',
    email: 'sanjay.gupta@hirehuub.com',
    department: 'Staffing',
    designation: 'Staffing Admin',
    reportingManager: 'Super Admin',
    reportingManagerId: 'super-001',
    employmentType: 'Permanent',
    joiningDate: '2023-01-01',
    workLocation: 'Pune',
    employmentStatus: 'Active',
    photoUrl: '',
    address: 'Pune',
    emergencyContact: '9123456780',
    notes: '',
  },
  {
    employeeId: 'emp-005-inactive',
    employeeCode: 'EMP005',
    firstName: 'Rohan',
    lastName: 'Verma',
    fullName: 'Rohan Verma',
    gender: 'Male',
    dateOfBirth: '1992-05-12',
    mobileNumber: '9777665544',
    email: 'rohan.verma@hirehuub.com',
    department: 'Staffing',
    designation: 'Recruiter',
    reportingManager: 'Vikram Patil',
    reportingManagerId: 'tl-001',
    employmentType: 'Permanent',
    joiningDate: '2023-05-01',
    workLocation: 'Pune',
    employmentStatus: 'Inactive',
    photoUrl: '',
    address: 'Pune',
    emergencyContact: '9777665543',
    notes: 'Resigned',
  },
];

export function useCrm(sessionUser: UserSession = DEFAULT_USER) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<CrmFilterState>({
    searchQuery: '',
    quickFilter: 'All',
  });

  // Drawers & Modals
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState<boolean>(false);
  const [isQuickUpdateOpen, setIsQuickUpdateOpen] = useState<boolean>(false);
  const [quickUpdateCandidate, setQuickUpdateCandidate] = useState<Candidate | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState<boolean>(false);
  const [isAssignmentCenterOpen, setIsAssignmentCenterOpen] = useState<boolean>(false);
  const [assignmentMode, setAssignmentMode] = useState<'single' | 'bulk' | 'transfer'>('single');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);

  // Client Profile Preview Modal State
  const [selectedClientPreview, setSelectedClientPreview] = useState<Client | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Fetch Initial Data
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [cands, cls, ops, history, emps] = await Promise.all([
        crmRepository.getCandidates(),
        clientRepository.getClients(),
        openingRepository.getOpenings(),
        crmRepository.getImportHistory(),
        employeeService.getEmployees().catch(() => []),
      ]);
      setCandidates(cands);
      setClients(cls);
      setOpenings(ops);
      setImportHistory(history);
      setEmployees(emps);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load CRM data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Derived Active Employees from People module (filters out Inactive, Terminated, Deleted)
  const activeEmployees = useMemo(() => {
    const source = employees.length > 0 ? employees : SAMPLE_ACTIVE_PEOPLE_EMPLOYEES;
    return source.filter((emp) => emp.employmentStatus === 'Active' || emp.status === 'Active');
  }, [employees]);

  // Derived Assignable Employees based on Role Assignment Rules:
  // - Recruiter: Cannot manually assign candidates ([])
  // - Team Lead: Can assign/reassign only to Active Employees in their reporting hierarchy (reports directly to Team Lead or self)
  // - Staffing Admin / Super Admin: Can assign/reassign to any Active Employee
  const assignableEmployees = useMemo(() => {
    if (sessionUser.role === 'Recruiter') {
      return [];
    }

    if (sessionUser.role === 'Team Leader') {
      const leadNameClean = sessionUser.name.split('(')[0].trim().toLowerCase();
      const leadId = sessionUser.id;

      return activeEmployees.filter((emp) => {
        const empNameClean = emp.fullName.toLowerCase();
        const isSelf = emp.employeeId === leadId || emp.id === leadId || empNameClean === leadNameClean;
        const reportsToLead = (emp.reportingManagerId && emp.reportingManagerId === leadId) ||
          (emp.reportingManager && emp.reportingManager.toLowerCase().includes(leadNameClean));
        return isSelf || reportsToLead;
      });
    }

    return activeEmployees;
  }, [activeEmployees, sessionUser]);

  // Derived filtered candidate list
  const filteredCandidates = useMemo(() => {
    return crmService.filterCandidates(candidates, filters, sessionUser);
  }, [candidates, filters, sessionUser]);

  // Derived KPI metrics
  const kpiSummary: KpiSummary = useMemo(() => {
    return crmService.calculateKpiSummary(candidates, sessionUser);
  }, [candidates, sessionUser]);

  // Derived Work Queue
  const todaysWorkQueue = useMemo(() => {
    return crmService.getTodaysWorkQueue(candidates, sessionUser);
  }, [candidates, sessionUser]);

  // Add Candidate Handler
  const handleAddCandidate = async (input: CreateCandidateInput): Promise<Candidate> => {
    try {
      const created = await crmRepository.createCandidate(input, sessionUser);
      await refreshData();
      showToast(`Candidate ${created.name} (${created.id}) added successfully!`);
      return created;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error adding candidate';
      showToast(msg);
      throw err;
    }
  };

  // Quick Update Handler
  const handleQuickUpdate = async (input: QuickUpdateInput): Promise<Candidate> => {
    try {
      // Find client meta
      const client = clients.find((cl) => cl.id === input.clientId);
      const clientMeta = {
        name: client?.name,
        type: (client?.type === 'Payroll' ? 'Payroll' : 'OTS') as 'Payroll' | 'OTS',
      };

      // Check if opening is closed
      if (input.openingId) {
        const opening = openings.find((op) => op.id === input.openingId);
        if (opening && opening.status === 'Closed') {
          showToast(`Warning: Opening ${opening.title} (${opening.id}) is Closed, but candidate activation proceeds as approved.`);
        }
      }

      const updated = await crmRepository.quickUpdate(input, clientMeta, sessionUser);
      await refreshData();

      if (selectedCandidate && selectedCandidate.id === updated.id) {
        setSelectedCandidate(updated);
      }

      showToast(`Status for ${updated.name} updated to ${updated.status}.`);
      return updated;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating candidate';
      showToast(msg);
      throw err;
    }
  };

  // Check Duplicate Phone
  const checkDuplicatePhone = async (phone: string): Promise<DuplicateCheckResult> => {
    return crmService.checkDuplicatePhone(phone, sessionUser.role);
  };

  // Single Reassignment
  const handleReassign = async (candidateId: string, toRecruiterId: string, toRecruiterName: string, reason?: string) => {
    try {
      await crmRepository.reassignCandidate(candidateId, toRecruiterId, toRecruiterName, sessionUser, reason);
      await refreshData();
      showToast(`Candidate reassigned to ${toRecruiterName} successfully.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error reassigning candidate';
      showToast(msg);
    }
  };

  // Bulk Reassignment
  const handleBulkAssign = async (targetRecruiterId: string, targetRecruiterName: string) => {
    try {
      if (selectedCandidateIds.length === 0) return;
      const count = await crmRepository.bulkAssignCandidates(selectedCandidateIds, targetRecruiterId, targetRecruiterName, sessionUser);
      await refreshData();
      showToast(`Successfully assigned ${count} candidates to ${targetRecruiterName}. Notification triggered.`);
      setSelectedCandidateIds([]);
      setIsAssignmentCenterOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error in bulk assignment';
      showToast(msg);
    }
  };

  // Bulk Recruiter Transfer (Resignation / Restructuring)
  const handleBulkTransfer = async (fromRecruiterId: string, toRecruiterId: string, toRecruiterName: string) => {
    try {
      const count = await crmRepository.bulkRecruiterTransfer(fromRecruiterId, toRecruiterId, toRecruiterName, sessionUser);
      await refreshData();
      showToast(`Transferred ${count} candidates to ${toRecruiterName}. Notification sent to new recruiter.`);
      setIsAssignmentCenterOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error transferring candidates';
      showToast(msg);
    }
  };

  // Blacklist Candidate
  const handleToggleBlacklist = async (candidateId: string, isBlacklisted: boolean, reason: string) => {
    try {
      const updated = await crmRepository.toggleBlacklist(candidateId, isBlacklisted, reason, sessionUser);
      await refreshData();
      if (selectedCandidate && selectedCandidate.id === updated.id) {
        setSelectedCandidate(updated);
      }
      showToast(`Candidate ${isBlacklisted ? 'blacklisted' : 'removed from blacklist'}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error blacklisting candidate';
      showToast(msg);
    }
  };

  // Client Profile Preview
  const handleOpenClientPreview = (clientId: string) => {
    const found = clients.find((c) => c.id === clientId || c.name.toLowerCase() === clientId.toLowerCase());
    if (found) {
      setSelectedClientPreview(found);
    } else {
      showToast(`Client information not found for ${clientId}`);
    }
  };

  return {
    sessionUser,
    candidates: filteredCandidates,
    allCandidates: candidates,
    clients,
    openings,
    importHistory,
    loading,
    error,
    filters,
    setFilters,
    kpiSummary,
    todaysWorkQueue,
    selectedCandidate,
    setSelectedCandidate,
    isAddDrawerOpen,
    setIsAddDrawerOpen,
    isQuickUpdateOpen,
    setIsQuickUpdateOpen,
    quickUpdateCandidate,
    setQuickUpdateCandidate,
    isBulkImportOpen,
    setIsBulkImportOpen,
    isAssignmentCenterOpen,
    setIsAssignmentCenterOpen,
    assignmentMode,
    setAssignmentMode,
    selectedCandidateIds,
    setSelectedCandidateIds,
    selectedClientPreview,
    setSelectedClientPreview,
    activeEmployees,
    assignableEmployees,
    toastMessage,
    showToast,
    refreshData,
    handleAddCandidate,
    handleQuickUpdate,
    checkDuplicatePhone,
    handleReassign,
    handleBulkAssign,
    handleBulkTransfer,
    handleToggleBlacklist,
    handleOpenClientPreview,
  };
}
