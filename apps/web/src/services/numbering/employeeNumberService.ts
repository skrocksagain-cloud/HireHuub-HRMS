import { employeeRepository } from '../../pages/Employee/repositories/employeeRepository';
import { adminService } from '../admin/adminService';
import type { Employee } from '../../pages/Employee/types/Employee';

export class EmployeeNumberService {
  private async getPrefix(): Promise<string> {
    try {
      const company = await adminService.getCompanySettings();
      if (company && company.employeeCodePrefix?.trim()) {
        return company.employeeCodePrefix.trim();
      }
    } catch {
      // Fallback to approved default prefix
    }
    return 'HHEMP';
  }

  /**
   * Generates the next sequential Employee Code.
   * Approved Format: HHEMP0001, HHEMP0002... (Prefix from Administration → Company Settings)
   */
  async generateNextEmployeeNumber(existingEmployees?: Employee[]): Promise<string> {
    let employees = existingEmployees;
    if (!employees || employees.length === 0) {
      try {
        employees = await employeeRepository.getEmployees();
      } catch {
        employees = [];
      }
    }

    const prefix = await this.getPrefix();
    return this.calculateNextNumber(employees ?? [], prefix);
  }

  /**
   * Computes the next sequence number given an array of employee records.
   */
  calculateNextNumber(employees: Partial<Employee>[], prefix: string): string {
    let maxSequence = 0;
    const existingCodes = new Set<string>();

    for (const employee of employees) {
      const codeOrId = employee.employeeId || employee.employeeCode || '';
      if (codeOrId) existingCodes.add(codeOrId.toUpperCase());
      const sequence = this.extractSequenceNumber(codeOrId);
      if (sequence > maxSequence) {
        maxSequence = sequence;
      }
    }

    let nextSequence = maxSequence + 1;
    let candidate = `${prefix}${String(nextSequence).padStart(4, '0')}`;
    while (existingCodes.has(candidate.toUpperCase())) {
      nextSequence++;
      candidate = `${prefix}${String(nextSequence).padStart(4, '0')}`;
    }

    return candidate;
  }

  private extractSequenceNumber(identifier: string): number {
    if (!identifier) return 0;
    const match = identifier.match(/(\d+)/);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (!Number.isNaN(parsed) && parsed < 100000) {
        return parsed;
      }
    }
    return 0;
  }
}

export const employeeNumberService = new EmployeeNumberService();
