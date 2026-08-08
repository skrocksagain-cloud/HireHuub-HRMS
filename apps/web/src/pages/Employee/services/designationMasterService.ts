import { adminService } from '../../../services/admin/adminService';
import type { Employee } from '../types/Employee';

export const APPROVED_DEPARTMENTS = ['Recruitment', 'Operations', 'Finance', 'Sales', 'Executive'];

export const DEFAULT_DEPARTMENT_DESIGNATIONS: Record<string, string[]> = {
  Recruitment: [
    'Recruitment Executive',
    'Senior Recruiter',
    'Recruitment Team Lead',
    'Recruitment Manager',
    'Recruitment Department Admin',
    'Recruitment Department Head',
  ],
  Finance: [
    'Accounts Executive',
    'Accountant',
    'Senior Accountant',
    'Finance Team Lead',
    'Finance Manager',
    'Finance Department Admin',
    'Finance Department Head',
  ],
  Sales: [
    'Business Development Executive',
    'Inside Sales Specialist',
    'Account Executive',
    'Sales Team Lead',
    'Sales Manager',
    'Sales Department Admin',
    'Sales Department Head',
  ],
  Operations: [
    'Operations Executive',
    'Operations Specialist',
    'Operations Team Lead',
    'Operations Manager',
    'Operations Department Admin',
    'Operations Department Head',
  ],
  Executive: [
    'Founder',
    'Co-Founder',
    'Director',
    'Board Member',
  ],
};

export const EXECUTIVE_DESIGNATIONS = ['Founder', 'Co-Founder', 'Director', 'Board Member'];

export const HIERARCHY_LEVELS: Record<string, number> = {
  'Founder': 5,
  'Co-Founder': 5,
  'Director': 5,
  'Board Member': 5,

  'Recruitment Department Head': 4,
  'Finance Department Head': 4,
  'Sales Department Head': 4,
  'Operations Department Head': 4,
  'Department Head': 4,

  'Recruitment Department Admin': 3,
  'Finance Department Admin': 3,
  'Sales Department Admin': 3,
  'Operations Department Admin': 3,
  'Department Admin': 3,
  'Recruitment Manager': 3,
  'Finance Manager': 3,
  'Sales Manager': 3,
  'Operations Manager': 3,

  'Recruitment Team Lead': 2,
  'Finance Team Lead': 2,
  'Sales Team Lead': 2,
  'Operations Team Lead': 2,
  'Team Lead': 2,

  'Senior Recruiter': 1,
  'Recruitment Executive': 1,
  'Senior Accountant': 1,
  'Accountant': 1,
  'Accounts Executive': 1,
  'Business Development Executive': 1,
  'Inside Sales Specialist': 1,
  'Account Executive': 1,
  'Operations Specialist': 1,
  'Operations Executive': 1,
};

export class DesignationMasterService {
  async getDepartmentsFromAdmin(): Promise<string[]> {
    try {
      const depts = await adminService.getDepartments();
      const activeNames = depts.filter((d) => d.isActive).map((d) => d.name);
      return activeNames.length > 0 ? activeNames : APPROVED_DEPARTMENTS;
    } catch {
      return APPROVED_DEPARTMENTS;
    }
  }

  async getDesignationsForDepartment(departmentName: string): Promise<string[]> {
    const defaults = DEFAULT_DEPARTMENT_DESIGNATIONS[departmentName] || [];
    try {
      const adminDesigs = await adminService.getDesignations();
      const dbMatching = adminDesigs
        .filter((r) => r.isActive && (r.departmentName === departmentName || !r.departmentId))
        .map((r) => r.name);

      const combined = [...new Set([...defaults, ...dbMatching])];
      return combined.length > 0 ? combined : defaults;
    } catch {
      return defaults;
    }
  }

  getHierarchyLevel(designationName: string): number {
    if (!designationName) return 1;
    if (HIERARCHY_LEVELS[designationName] !== undefined) {
      return HIERARCHY_LEVELS[designationName];
    }
    const lower = designationName.toLowerCase();
    if (lower.includes('founder') || lower.includes('director') || lower.includes('board') || lower.includes('vp')) return 5;
    if (lower.includes('head')) return 4;
    if (lower.includes('admin') || lower.includes('manager')) return 3;
    if (lower.includes('lead')) return 2;
    return 1;
  }

  getEligibleReportingManagers(
    allEmployees: Employee[],
    selectedDepartment: string,
    currentEmployeeId?: string,
    targetDesignation?: string
  ): Employee[] {
    const targetLevel = targetDesignation ? this.getHierarchyLevel(targetDesignation) : 1;

    return allEmployees.filter((emp) => {
      // 1. Must be ACTIVE
      const isActive = emp.employmentStatus === 'Active' || emp.status === 'Active';
      if (!isActive) return false;

      // 2. Cannot report to self
      if (currentEmployeeId && (emp.id === currentEmployeeId || emp.employeeId === currentEmployeeId || emp.employeeCode === currentEmployeeId)) {
        return false;
      }

      // 3. Department Rule: Same department OR Executive/Top Management
      const isExecutive = EXECUTIVE_DESIGNATIONS.includes(emp.designation) || this.getHierarchyLevel(emp.designation) === 5;
      const isSameDept = emp.department === selectedDepartment;
      if (!isSameDept && !isExecutive) return false;

      // 4. Hierarchy Rule: Manager level must be higher than or equal to target level
      const empLevel = this.getHierarchyLevel(emp.designation);
      if (!isExecutive && empLevel < targetLevel) {
        return false;
      }

      return true;
    });
  }
}

export const designationMasterService = new DesignationMasterService();
