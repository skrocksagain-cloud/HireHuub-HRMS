import { validateEmployee } from '../apps/web/src/pages/Employee/services/employeeService.test.helper';
import { createEmployeeRecord } from '../apps/web/src/pages/Employee/repositories/employeeRepository';
import { employeeNumberService } from '../apps/web/src/services/numbering/employeeNumberService';
import type { EmployeeFormData } from '../apps/web/src/pages/Employee/types/Employee';

// Audit helper script to trace employee creation logic safely without writing to Firestore
export const runCreationAudit = () => {
  console.log('--- STARTING READ-ONLY EMPLOYEE CREATION AUDIT ---');

  // Scenario 1: Undefined optional fields causing TypeError in createEmployeeRecord
  const partialPayload: any = {
    employeeId: 'EMP001',
    employeeCode: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    gender: 'Male',
    mobileNumber: '9876543210',
    email: '',
    department: 'Recruitment',
    designation: 'Recruiter',
    employmentType: 'Permanent',
    joiningDate: '2026-08-01',
    reportingManager: '',
    workLocation: '',
    employmentStatus: 'Active',
    // Missing dateOfBirth, photoUrl, address, emergencyContact, notes (undefined)
  };

  try {
    createEmployeeRecord(partialPayload);
    console.log('Scenario 1 (Partial payload with undefined fields): Succeeded');
  } catch (err: any) {
    console.log('Scenario 1 (Partial payload with undefined fields) FAILED with error:', err.message);
  }

  // Scenario 2: Unconfigured company prefix causing getNextEmployeeId failure
  try {
    const nextId = employeeNumberService.calculateNextNumber([], '');
    console.log('Scenario 2 (Empty prefix): Result =', nextId);
  } catch (err: any) {
    console.log('Scenario 2 (Empty prefix) FAILED with error:', err.message);
  }

  // Scenario 3: Validation checks for optional official email
  const payloadNoEmail: EmployeeFormData = {
    employeeId: 'EMP002',
    employeeCode: 'EMP002',
    firstName: 'Jane',
    lastName: 'Smith',
    gender: 'Female',
    dateOfBirth: '',
    mobileNumber: '9876543211',
    email: '', // Blank email
    department: 'Operations',
    designation: 'Executive',
    employmentType: 'Permanent',
    joiningDate: '2026-08-01',
    reportingManager: '',
    workLocation: '',
    employmentStatus: 'Active',
    photoUrl: '',
    address: '',
    emergencyContact: '',
    notes: '',
  };

  try {
    createEmployeeRecord(payloadNoEmail);
    console.log('Scenario 3 (Blank email payload): Succeeded in createEmployeeRecord');
  } catch (err: any) {
    console.log('Scenario 3 (Blank email payload) FAILED with error:', err.message);
  }
};

runCreationAudit();
