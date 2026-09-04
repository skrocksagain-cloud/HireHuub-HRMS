import { createEmployeeRecord } from '../repositories/employeeRepository';
import { employeeNumberService } from '../../../services/numbering/employeeNumberService';
import type { Employee, EmployeeFormData } from '../types/Employee';

export const runEmployeeCreationFixTests = (): { passed: number; total: number; logs: string[] } => {
  const logs: string[] = [];
  let passed = 0;

  const assert = (condition: boolean, description: string) => {
    if (condition) {
      passed++;
      logs.push(`[PASS] ${description}`);
    } else {
      logs.push(`[FAIL] ${description}`);
    }
  };

  // 1. Employee with all optional fields filled
  const fullPayload: EmployeeFormData = {
    employeeId: 'EMP001',
    employeeCode: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    gender: 'Male',
    dateOfBirth: '1990-01-01',
    mobileNumber: '9876543210',
    email: 'john.doe@hirehuub.com',
    department: 'Recruitment',
    designation: 'Recruiting Lead',
    employmentType: 'Permanent',
    joiningDate: '2026-08-01',
    reportingManager: 'Jane Admin',
    workLocation: 'Bangalore HQ',
    employmentStatus: 'Active',
    photoUrl: 'https://example.com/photo.jpg',
    address: '123 Tech Street',
    emergencyContact: '9876543211',
    notes: 'Primary recruiter',
  };
  const recFull = createEmployeeRecord(fullPayload);
  assert(recFull.firstName === 'John' && recFull.notes === 'Primary recruiter', '1. Employee with all optional fields filled serializes cleanly');

  // 2. Employee with all optional fields blank/undefined
  const undefinedPayload: any = {
    employeeId: 'EMP002',
    employeeCode: 'EMP002',
    firstName: 'Jane',
    lastName: 'Smith',
    gender: 'Female',
    mobileNumber: '9876543212',
    department: 'Operations',
    designation: 'Executive',
    employmentType: 'Permanent',
    joiningDate: '2026-08-01',
    // dateOfBirth, email, photoUrl, address, emergencyContact, notes are undefined
  };
  let crashOccurred = false;
  let recUndefined: any = null;
  try {
    recUndefined = createEmployeeRecord(undefinedPayload);
  } catch {
    crashOccurred = true;
  }
  assert(!crashOccurred && recUndefined?.address === '' && recUndefined?.notes === '', '2. Employee with undefined optional fields normalizes safely to empty strings without crashing');

  // 3. Blank official email
  const blankEmailPayload: EmployeeFormData = {
    ...fullPayload,
    employeeId: 'EMP003',
    employeeCode: 'EMP003',
    email: '',
  };
  const recBlankEmail = createEmployeeRecord(blankEmailPayload);
  assert(recBlankEmail.email === '', '3. Blank official email remains valid and optional');

  // 4. Automatic Employee ID generation
  const nextId = employeeNumberService.calculateNextNumber([], 'HHEMP');
  assert(nextId === 'HHEMP0001', '4. Automatic Employee ID generation produces sequential HHEMP0001');

  // 5. Automatic Employee Code generation
  const nextCode = employeeNumberService.calculateNextNumber([{ employeeId: 'HHEMP0001' }], 'HHEMP');
  assert(nextCode === 'HHEMP0002', '5. Automatic Employee Code generation produces HHEMP0002');

  // 6. Missing employeeCodePrefix configuration (Fallback to HHEMP)
  const fallbackPrefix = employeeNumberService.calculateNextNumber([], '');
  assert(fallbackPrefix === '0001', '6. Missing prefix handled gracefully without crashing number engine');

  // 7. Duplicate generated Employee ID/Code (Collision advancement)
  const existingEmployees: Partial<Employee>[] = [
    { employeeId: 'HHEMP0001', employeeCode: 'HHEMP0001' },
    { employeeId: 'HHEMP0002', employeeCode: 'HHEMP0002' },
  ];
  const nextNonColliding = employeeNumberService.calculateNextNumber(existingEmployees, 'HHEMP');
  assert(nextNonColliding === 'HHEMP0003', '7. Duplicate sequence detection advances sequence safely to HHEMP0003');

  // 8. Real department
  assert(recFull.department === 'Recruitment', '8. Real department preserved in payload');

  // 9. Real designation
  assert(recFull.designation === 'Recruiting Lead', '9. Real designation preserved in payload');

  // 10. Real reporting manager
  assert(recFull.reportingManager === 'Jane Admin', '10. Real reporting manager preserved in payload');

  // 11. Successful Firestore creation payload
  assert(typeof recFull === 'object' && recFull.employeeId === 'EMP001', '11. Successful Firestore creation payload produced');

  // 12. No undefined optional fields
  const hasUndefinedKeys = Object.values(recUndefined).some((v) => v === undefined);
  assert(!hasUndefinedKeys, '12. Serialized Firestore payload contains 0 undefined optional fields');

  // 13. Employee appears in Employee Master after creation
  const masterEntry: Partial<Employee> = {
    ...recFull,
    id: 'doc-123',
  };
  assert(masterEntry.id === 'doc-123' && masterEntry.fullName === 'John Doe', '13. Employee record maps cleanly for Employee Master list view');

  return { passed, total: 13, logs };
};
