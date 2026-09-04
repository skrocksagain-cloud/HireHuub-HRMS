import { employeeNumberService } from '../../../services/numbering/employeeNumberService';
import type { Employee, EmployeeFormData } from '../types/Employee';
import { employeeRepository } from '../repositories/employeeRepository';
import { auditService } from '../../../core/audit/auditService';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_NUMBER_PATTERN = /^\+?[0-9]{10,15}$/;

const validateEmployee = (employee: EmployeeFormData): void => {
  const requiredFields: Array<[string, string]> = [
    ['Employee ID', employee.employeeId],
    ['Employee Code', employee.employeeCode],
    ['First Name', employee.firstName],
    ['Last Name', employee.lastName],
    ['Department', employee.department],
    ['Designation', employee.designation],
    ['Joining Date', employee.joiningDate],
  ];
  const missingField = requiredFields.find(([, value]) => !value || value.trim() === '');

  if (missingField) {
    throw new Error(`${missingField[0]} is required.`);
  }

  if (employee.email && employee.email.trim() !== '' && !EMAIL_PATTERN.test(employee.email.trim())) {
    throw new Error('Enter a valid email address.');
  }

  if (employee.mobileNumber && employee.mobileNumber.trim() !== '' && !MOBILE_NUMBER_PATTERN.test(employee.mobileNumber.trim())) {
    throw new Error('Enter a valid mobile number with 10 to 15 digits.');
  }
};

export class EmployeeService {
  async getEmployees(): Promise<Employee[]> {
    return employeeRepository.getAllEmployeesGlobal();
  }

  async getAllEmployeesGlobal(): Promise<Employee[]> {
    return employeeRepository.getAllEmployeesGlobal();
  }

  async getEmployeesForDepartment(departmentId: string | undefined): Promise<Employee[]> {
    if (!departmentId?.trim()) return [];
    return employeeRepository.getEmployeesForDepartment(departmentId);
  }

  async getEmployeeForSelf(employeeId: string | undefined): Promise<Employee[]> {
    if (!employeeId?.trim()) return [];
    const employee = await employeeRepository.getEmployeeById(employeeId);
    return employee ? [employee] : [];
  }

  async getEmployeeById(employeeId: string): Promise<Employee | null> {
    return employeeRepository.getEmployeeById(employeeId);
  }

  async getNextEmployeeId(): Promise<string> {
    const employees = await employeeRepository.getEmployees();
    return employeeNumberService.generateNextEmployeeNumber(employees);
  }

  async createEmployee(employee: EmployeeFormData, createdBy = 'HR Admin'): Promise<string> {
    validateEmployee(employee);
    const id = await employeeRepository.createEmployee(employee);
    await auditService.record({
      module: 'Employee',
      action: 'Create Employee Profile',
      recordId: id,
      performedBy: createdBy,
      role: 'HR',
      newValue: {
        employeeId: employee.employeeId,
        fullName: `${employee.firstName} ${employee.lastName}`,
        departmentId: employee.departmentId,
        department: employee.department,
        designation: employee.designation,
        reportingManagerId: employee.reportingManagerId,
        reportingManager: employee.reportingManager,
        employmentStatus: employee.employmentStatus,
      },
      remarks: `Employee ${employee.employeeId} created.`,
    });
    return id;
  }

  async updateEmployee(employeeId: string, employee: EmployeeFormData, updatedBy = 'HR Admin'): Promise<void> {
    validateEmployee(employee);
    await employeeRepository.updateEmployee(employeeId, employee);
    await auditService.record({
      module: 'Employee',
      action: 'Update Employee Profile',
      recordId: employeeId,
      performedBy: updatedBy,
      role: 'HR',
      newValue: {
        employeeId: employee.employeeId,
        fullName: `${employee.firstName} ${employee.lastName}`,
        departmentId: employee.departmentId,
        department: employee.department,
        designation: employee.designation,
        reportingManagerId: employee.reportingManagerId,
        reportingManager: employee.reportingManager,
        employmentStatus: employee.employmentStatus,
      },
      remarks: `Employee ${employee.employeeId} updated.`,
    });
  }

  async updateEmployeeFields(employeeId: string, fields: Record<string, unknown>, updatedBy = 'Employee Self-Service'): Promise<void> {
    await employeeRepository.updateEmployeeFields(employeeId, fields);
    await auditService.record({
      module: 'Employee',
      action: 'Update Employee Profile (Self-Service)',
      recordId: employeeId,
      performedBy: updatedBy,
      role: 'Employee',
      newValue: fields,
      remarks: `Employee ${employeeId} self-service profile updated.`,
    });
  }

  async deleteEmployee(employeeId: string, deletedBy = 'HR Admin'): Promise<void> {
    await employeeRepository.deleteEmployee(employeeId);
    await auditService.record({
      module: 'Employee',
      action: 'Deactivate Employee Profile',
      recordId: employeeId,
      performedBy: deletedBy,
      role: 'HR',
      remarks: `Employee ${employeeId} deactivated.`,
    });
  }

  async submitResignation(
    employeeId: string,
    payload: {
      resignationDate: string;
      noticePeriodDays?: number;
      exitReason: string;
      exitRemarks?: string;
    },
    userActor: { name: string; role: string }
  ): Promise<void> {
    const noticeDays = payload.noticePeriodDays || 30;
    const resDate = new Date(payload.resignationDate);
    const lastWorkDate = new Date(resDate.getTime() + noticeDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const exitRecord = {
      id: `exit-${Date.now()}`,
      exitType: 'Resignation' as const,
      initiatedBy: userActor.name,
      initiatedByRole: userActor.role,
      initiatedAt: new Date().toISOString(),
      resignationDate: payload.resignationDate,
      noticePeriodDays: noticeDays,
      lastWorkingDate: lastWorkDate,
      exitReason: payload.exitReason,
      exitRemarks: payload.exitRemarks || '',
      exitStatus: 'Pending Manager Approval' as const,
    };

    await employeeRepository.updateEmployeeFields(employeeId, {
      lastWorkingDate: lastWorkDate,
      exitRecord,
    });

    await auditService.record({
      module: 'Employee',
      action: 'Submit Resignation',
      recordId: employeeId,
      performedBy: userActor.name,
      role: userActor.role,
      newValue: exitRecord as unknown as Record<string, unknown>,
      remarks: `Resignation submitted by ${userActor.name}. Expected Last Working Date: ${lastWorkDate}.`,
    });
  }

  async approveResignation(
    employeeId: string,
    existingExitRecord: any,
    userActor: { name: string; role: string }
  ): Promise<void> {
    const updatedExitRecord = {
      ...existingExitRecord,
      exitStatus: 'Notice Period' as const,
      approvedBy: userActor.name,
      approvedAt: new Date().toISOString(),
    };

    await employeeRepository.updateEmployeeFields(employeeId, {
      employmentStatus: 'Notice Period',
      exitRecord: updatedExitRecord,
    });

    await auditService.record({
      module: 'Employee',
      action: 'Approve Resignation',
      recordId: employeeId,
      performedBy: userActor.name,
      role: userActor.role,
      newValue: updatedExitRecord as unknown as Record<string, unknown>,
      remarks: `Resignation approved by ${userActor.name}. Employee entered Notice Period until ${existingExitRecord.lastWorkingDate}.`,
    });
  }

  async rejectResignation(
    employeeId: string,
    existingExitRecord: any,
    rejectionReason: string,
    userActor: { name: string; role: string }
  ): Promise<void> {
    const updatedExitRecord = {
      ...existingExitRecord,
      exitStatus: 'Rejected' as const,
      rejectedBy: userActor.name,
      rejectedAt: new Date().toISOString(),
      rejectionReason,
    };

    await employeeRepository.updateEmployeeFields(employeeId, {
      employmentStatus: 'Active',
      exitRecord: updatedExitRecord,
    });

    await auditService.record({
      module: 'Employee',
      action: 'Reject Resignation',
      recordId: employeeId,
      performedBy: userActor.name,
      role: userActor.role,
      newValue: updatedExitRecord as unknown as Record<string, unknown>,
      remarks: `Resignation rejected by ${userActor.name}. Reason: ${rejectionReason}`,
    });
  }

  async markExitDirectly(
    employeeId: string,
    payload: {
      exitType: 'Resignation' | 'Termination' | 'Mutual Separation' | 'Manager Initiated';
      lastWorkingDate: string;
      exitReason: string;
      exitRemarks?: string;
      exitStatus?: 'Pending Manager Approval' | 'Approved' | 'Notice Period' | 'Exit Completed' | 'Rejected';
    },
    userActor: { name: string; role: string }
  ): Promise<void> {
    const targetStatus = payload.exitStatus || 'Exit Completed';
    const empStatus =
      targetStatus === 'Notice Period'
        ? 'Notice Period'
        : payload.exitType === 'Termination'
        ? 'Terminated'
        : 'Inactive';

    const exitRecord = {
      id: `exit-${Date.now()}`,
      exitType: payload.exitType,
      initiatedBy: userActor.name,
      initiatedByRole: userActor.role,
      initiatedAt: new Date().toISOString(),
      lastWorkingDate: payload.lastWorkingDate,
      exitReason: payload.exitReason,
      exitRemarks: payload.exitRemarks || '',
      exitStatus: targetStatus,
      approvedBy: userActor.name,
      approvedAt: new Date().toISOString(),
    };

    await employeeRepository.updateEmployeeFields(employeeId, {
      employmentStatus: empStatus,
      lastWorkingDate: payload.lastWorkingDate,
      exitRecord,
    });

    await auditService.record({
      module: 'Employee',
      action: 'Mark Exit Directly',
      recordId: employeeId,
      performedBy: userActor.name,
      role: userActor.role,
      newValue: exitRecord as unknown as Record<string, unknown>,
      remarks: `Exit marked by ${userActor.name} (${userActor.role}). Type: ${payload.exitType}, Last Working Date: ${payload.lastWorkingDate}. Status set to ${empStatus}.`,
    });
  }

  async rehireEmployee(
    employeeId: string,
    payload: {
      salary: number;
      department: string;
      designation: string;
      reportingManager: string;
      rehireDate?: string;
    },
    userActor: { name: string; role: string }
  ): Promise<void> {
    const targetEmp = await employeeRepository.getEmployeeById(employeeId);
    if (!targetEmp) {
      throw new Error('Employee record not found.');
    }

    if (targetEmp.employmentStatus === 'Active') {
      throw new Error('Employee is already active.');
    }

    if (!payload.department || !payload.department.trim()) {
      throw new Error('Valid active department is required.');
    }

    if (!payload.designation || !payload.designation.trim()) {
      throw new Error('Valid active designation is required.');
    }

    if (!payload.reportingManager || !payload.reportingManager.trim()) {
      throw new Error('Valid active reporting manager is required.');
    }

    if (!payload.salary || Number(payload.salary) <= 0) {
      throw new Error('Valid salary amount is required.');
    }

    const rehireDate = payload.rehireDate || new Date().toISOString().split('T')[0];

    const fieldsToUpdate: Record<string, unknown> = {
      employmentStatus: 'Active',
      department: payload.department.trim(),
      designation: payload.designation.trim(),
      reportingManager: payload.reportingManager.trim(),
      monthlyGross: payload.salary,
      salary: payload.salary,
      rehireDate,
      updatedAt: new Date().toISOString(),
    };

    await employeeRepository.updateEmployeeFields(employeeId, fieldsToUpdate);

    await auditService.record({
      module: 'Employee',
      action: 'Rehire Employee',
      recordId: employeeId,
      performedBy: userActor.name,
      role: userActor.role,
      previousValue: {
        employmentStatus: targetEmp.employmentStatus,
        department: targetEmp.department,
        designation: targetEmp.designation,
        reportingManager: targetEmp.reportingManager,
        salary: targetEmp.monthlyGross || targetEmp.salary,
      },
      newValue: {
        employmentStatus: 'Active',
        department: payload.department.trim(),
        designation: payload.designation.trim(),
        reportingManager: payload.reportingManager.trim(),
        salary: payload.salary,
        rehireDate,
      },
      remarks: `Employee ${targetEmp.employeeCode || targetEmp.employeeId} rehired by ${userActor.name} (${userActor.role}) on ${rehireDate}.`,
    });
  }
}

export const employeeService = new EmployeeService();
