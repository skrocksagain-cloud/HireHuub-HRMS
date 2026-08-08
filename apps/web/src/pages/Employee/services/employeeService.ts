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
    ['Email', employee.email],
    ['Department', employee.department],
    ['Designation', employee.designation],
    ['Joining Date', employee.joiningDate],
    ['Mobile Number', employee.mobileNumber],
  ];
  const missingField = requiredFields.find(([, value]) => value.trim() === '');

  if (missingField) {
    throw new Error(`${missingField[0]} is required.`);
  }

  if (!EMAIL_PATTERN.test(employee.email.trim())) {
    throw new Error('Enter a valid email address.');
  }

  if (!MOBILE_NUMBER_PATTERN.test(employee.mobileNumber.trim())) {
    throw new Error('Enter a valid mobile number with 10 to 15 digits.');
  }
};

export class EmployeeService {
  async getEmployees(): Promise<Employee[]> {
    return employeeRepository.getEmployees();
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
        department: employee.department,
        designation: employee.designation,
        reportingManager: employee.reportingManager,
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
        department: employee.department,
        designation: employee.designation,
        reportingManager: employee.reportingManager,
        employmentStatus: employee.employmentStatus,
      },
      remarks: `Employee ${employee.employeeId} updated.`,
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
}

export const employeeService = new EmployeeService();
