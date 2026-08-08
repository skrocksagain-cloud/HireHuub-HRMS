import { collection, getDocs } from 'firebase/firestore';

import { db } from '../../firebase/firebase';
import type { Employee } from '../../pages/Employee/types/Employee';

const EMPLOYEES_COLLECTION = 'employees';

export class EmployeeNumberService {
  private static PREFIX = 'HH';

  private static PADDING_DIGITS = 4;

  /**
   * Generates the next sequential Employee Number.
   * Approved Format: HH0001, HH0002, HH0003, ...
   */
  async generateNextEmployeeNumber(existingEmployees?: Employee[]): Promise<string> {
    let employees = existingEmployees;
    if (!employees || employees.length === 0) {
      try {
        const snapshot = await getDocs(collection(db, EMPLOYEES_COLLECTION));
        employees = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            employeeId: String(data.employeeId ?? ''),
            employeeCode: String(data.employeeCode ?? ''),
          } as Employee;
        });
      } catch {
        employees = [];
      }
    }

    return this.calculateNextNumber(employees ?? []);
  }

  /**
   * Synchronously computes the next sequence number given an array of employee records.
   */
  calculateNextNumber(employees: Partial<Employee>[]): string {
    let maxSequence = 0;

    for (const employee of employees) {
      const codeOrId = employee.employeeId || employee.employeeCode || '';
      const sequence = this.extractSequenceNumber(codeOrId);
      if (sequence > maxSequence) {
        maxSequence = sequence;
      }
    }

    const nextSequence = maxSequence + 1;
    return `${EmployeeNumberService.PREFIX}${String(nextSequence).padStart(EmployeeNumberService.PADDING_DIGITS, '0')}`;
  }

  private extractSequenceNumber(identifier: string): number {
    if (!identifier) return 0;
    const match = identifier.match(/HH-?(\d+)/i) || identifier.match(/(\d+)/);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (!Number.isNaN(parsed) && parsed < 10000) {
        return parsed;
      }
    }
    return 0;
  }
}

export const employeeNumberService = new EmployeeNumberService();
