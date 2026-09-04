import { employeeRepository } from '../../pages/Employee/repositories/employeeRepository';
import type { HierarchyNode } from '../../types/Admin';
import type { Employee } from '../../pages/Employee/types/Employee';

export interface AudienceResolutionParams {
  visibility: 'Organization' | 'Company' | 'Department' | 'Team' | 'Selected Employees' | 'Private' | string;
  departmentIds?: string[];
  teamIds?: string[];
  selectedEmployeeIds?: string[];
}

export async function resolveAudienceEmployeeIds(params: AudienceResolutionParams): Promise<string[]> {
  const { visibility, departmentIds = [], teamIds = [], selectedEmployeeIds = [] } = params;
  let targetEmployeeIds: string[] = [...selectedEmployeeIds];

  const list: Employee[] = await employeeRepository.getEmployees();
  const activeEmployees = list.filter(
    (e: Employee) =>
      (e.status === 'Active' || e.employmentStatus === 'Active') &&
      e.status !== 'Inactive' &&
      e.employmentStatus !== 'Terminated' &&
      e.employmentStatus !== 'Notice Period'
  );

  if (visibility === 'Organization' || visibility === 'Company') {
    targetEmployeeIds = Array.from(
      new Set([...targetEmployeeIds, ...activeEmployees.map((e: Employee) => e.employeeId || e.id || '')])
    );
  } else if (visibility === 'Department' && departmentIds.length > 0) {
    const deptEmployees = activeEmployees.filter((e: Employee) =>
      departmentIds.some(
        (dId) =>
          dId.toLowerCase() === (e.departmentId || '').toLowerCase() ||
          dId.toLowerCase() === (e.department || '').toLowerCase()
      )
    );
    targetEmployeeIds = Array.from(
      new Set([...targetEmployeeIds, ...deptEmployees.map((e: Employee) => e.employeeId || e.id || '')])
    );
  } else if (visibility === 'Team' && teamIds.length > 0) {
    const teamEmployees = activeEmployees.filter((e: Employee) =>
      teamIds.some(
        (tId) =>
          tId.toLowerCase() === (e.departmentId || '').toLowerCase() ||
          tId.toLowerCase() === (e.department || '').toLowerCase().replace(/\s+/g, '-')
      )
    );
    targetEmployeeIds = Array.from(
      new Set([...targetEmployeeIds, ...teamEmployees.map((e: Employee) => e.employeeId || e.id || '')])
    );
  } else if (visibility === 'Private') {
    const mgmtKeywords = ['founder', 'co-founder', 'director', 'super admin', 'admin'];
    const mgmtEmployees = activeEmployees.filter(
      (e: Employee) => e.designation && mgmtKeywords.some((kw) => e.designation.toLowerCase().includes(kw))
    );
    targetEmployeeIds = Array.from(
      new Set([...targetEmployeeIds, ...mgmtEmployees.map((e: Employee) => e.employeeId || e.id || '')])
    );
  }

  return targetEmployeeIds.filter(Boolean);
}

export async function fetchActiveEmployeesAsHierarchy(): Promise<HierarchyNode[]> {
  const list: Employee[] = await employeeRepository.getEmployees();
  const activeOnly = list.filter(
    (e: Employee) =>
      (e.status === 'Active' || e.employmentStatus === 'Active') &&
      e.status !== 'Inactive' &&
      e.employmentStatus !== 'Terminated' &&
      e.employmentStatus !== 'Notice Period'
  );

  return activeOnly.map((e: Employee) => ({
    id: e.id || e.employeeId || '',
    employeeId: e.employeeId || e.id || '',
    employeeName: e.fullName || `${e.firstName} ${e.lastName}`.trim(),
    designation: e.designation || 'Staff',
    departmentId: e.department || 'general',
    departmentName: e.department || 'General',
    reportingToId: e.reportingManagerId || '',
    reportingToName: e.reportingManager || '',
    status: 'Active',
  }));
}
