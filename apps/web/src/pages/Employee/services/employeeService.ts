import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '../../../firebase/firebase';
import type { Employee, EmployeeFormData } from '../types/Employee';

const EMPLOYEES_COLLECTION = 'employees';
const DEFAULT_EMPLOYMENT_STATUS: Employee['employmentStatus'] = 'Active';
const DEFAULT_EMPLOYMENT_TYPE: Employee['employmentType'] = 'Permanent';
const DEFAULT_GENDER: Employee['gender'] = 'Other';
const EMPLOYEE_STATUSES: Employee['employmentStatus'][] = ['Active', 'Inactive', 'Notice Period', 'Terminated'];
const EMPLOYMENT_TYPES: Employee['employmentType'][] = ['Permanent', 'Contract', 'Intern', 'Consultant'];
const EMPLOYEE_GENDERS: Employee['gender'][] = ['Male', 'Female', 'Other'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_NUMBER_PATTERN = /^\+?[0-9]{10,15}$/;

const readString = (data: Record<string, unknown>, field: string): string => {
  const value = data[field];
  return typeof value === 'string' ? value : '';
};

const readTimestamp = (data: Record<string, unknown>, field: string): Timestamp | undefined => {
  const value = data[field];
  return value instanceof Timestamp ? value : undefined;
};

const readEmploymentStatus = (data: Record<string, unknown>): Employee['employmentStatus'] => {
  const status = readString(data, 'employmentStatus');
  return EMPLOYEE_STATUSES.some((validStatus) => validStatus === status)
    ? status as Employee['employmentStatus']
    : DEFAULT_EMPLOYMENT_STATUS;
};

const readEmploymentType = (data: Record<string, unknown>): Employee['employmentType'] => {
  const employmentType = readString(data, 'employmentType');
  return EMPLOYMENT_TYPES.some((validType) => validType === employmentType)
    ? employmentType as Employee['employmentType']
    : DEFAULT_EMPLOYMENT_TYPE;
};

const readEmployeeGender = (data: Record<string, unknown>): Employee['gender'] => {
  const gender = readString(data, 'gender');
  return EMPLOYEE_GENDERS.some((validGender) => validGender === gender)
    ? gender as Employee['gender']
    : DEFAULT_GENDER;
};

const toEmployee = (id: string, data: Record<string, unknown>): Employee => {
  const firstName = readString(data, 'firstName');
  const lastName = readString(data, 'lastName');
  const fullName = readString(data, 'fullName') || `${firstName} ${lastName}`.trim();

  return {
    id,
    employeeId: readString(data, 'employeeId'),
    employeeCode: readString(data, 'employeeCode') || readString(data, 'employeeId'),
    firstName,
    lastName,
    fullName,
    gender: readEmployeeGender(data),
    dateOfBirth: readString(data, 'dateOfBirth'),
    mobileNumber: readString(data, 'mobileNumber') || readString(data, 'mobile'),
    email: readString(data, 'email') || readString(data, 'officialEmail') || readString(data, 'personalEmail'),
    department: readString(data, 'department') || readString(data, 'departmentName'),
    designation: readString(data, 'designation') || readString(data, 'designationName'),
    employmentType: readEmploymentType(data),
    joiningDate: readString(data, 'joiningDate') || readString(data, 'dateOfJoining'),
    reportingManager: readString(data, 'reportingManager'),
    workLocation: readString(data, 'workLocation'),
    employmentStatus: readEmploymentStatus(data),
    photoUrl: readString(data, 'photoUrl'),
    address: readString(data, 'address') || readString(data, 'currentAddress'),
    emergencyContact: readString(data, 'emergencyContact') || readString(data, 'emergencyPrimaryMobile'),
    notes: readString(data, 'notes') || readString(data, 'remarks'),
    createdAt: readTimestamp(data, 'createdAt'),
    updatedAt: readTimestamp(data, 'updatedAt'),
  };
};

export interface EmployeeRepository {
  getEmployees: () => Promise<Employee[]>;
  getEmployeeById: (employeeId: string) => Promise<Employee | null>;
  createEmployee: (employee: EmployeeFormData) => Promise<string>;
  updateEmployee: (employeeId: string, employee: EmployeeFormData) => Promise<void>;
  deleteEmployee: (employeeId: string) => Promise<void>;
}

const createEmployeeRecord = (employee: EmployeeFormData): Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> => ({
  employeeId: employee.employeeId.trim(),
  employeeCode: employee.employeeCode.trim(),
  firstName: employee.firstName.trim(),
  lastName: employee.lastName.trim(),
  fullName: `${employee.firstName.trim()} ${employee.lastName.trim()}`.trim(),
  gender: employee.gender,
  dateOfBirth: employee.dateOfBirth.trim(),
  mobileNumber: employee.mobileNumber.trim(),
  email: employee.email.trim(),
  department: employee.department.trim(),
  designation: employee.designation.trim(),
  employmentType: employee.employmentType,
  joiningDate: employee.joiningDate.trim(),
  reportingManager: employee.reportingManager.trim(),
  workLocation: employee.workLocation.trim(),
  employmentStatus: employee.employmentStatus,
  photoUrl: employee.photoUrl.trim(),
  address: employee.address.trim(),
  emergencyContact: employee.emergencyContact.trim(),
  notes: employee.notes.trim(),
});

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

class FirestoreEmployeeRepository implements EmployeeRepository {
  private async ensureUniqueEmployeeFields(employee: EmployeeFormData, excludedDocumentId?: string): Promise<void> {
    const normalizedEmployee = createEmployeeRecord(employee);
    const fields: Array<[string, string, string]> = [
      ['employeeId', normalizedEmployee.employeeId, 'Employee ID'],
      ['employeeCode', normalizedEmployee.employeeCode, 'Employee Code'],
    ];

    await Promise.all(fields.map(async ([field, value, label]) => {
      const snapshot = await getDocs(query(
        collection(db, EMPLOYEES_COLLECTION),
        where(field, '==', value),
        limit(2),
      ));
      const duplicateExists = snapshot.docs.some((employeeDocument) => employeeDocument.id !== excludedDocumentId);

      if (duplicateExists) {
        throw new Error(`${label} already exists.`);
      }
    }));
  }

  async getEmployees(): Promise<Employee[]> {
    const snapshot = await getDocs(collection(db, EMPLOYEES_COLLECTION));

    return snapshot.docs.map((employeeDocument) => (
      toEmployee(employeeDocument.id, employeeDocument.data())
    ));
  }

  async getEmployeeById(employeeId: string): Promise<Employee | null> {
    const snapshot = await getDoc(doc(db, EMPLOYEES_COLLECTION, employeeId));

    if (!snapshot.exists()) {
      return null;
    }

    return toEmployee(snapshot.id, snapshot.data());
  }

  async createEmployee(employee: EmployeeFormData): Promise<string> {
    validateEmployee(employee);
    await this.ensureUniqueEmployeeFields(employee);
    const document = await addDoc(collection(db, EMPLOYEES_COLLECTION), {
      ...createEmployeeRecord(employee),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return document.id;
  }

  async updateEmployee(employeeId: string, employee: EmployeeFormData): Promise<void> {
    validateEmployee(employee);
    await this.ensureUniqueEmployeeFields(employee, employeeId);
    const employeeDocument = doc(db, EMPLOYEES_COLLECTION, employeeId);
    const existingEmployee = await getDoc(employeeDocument);

    if (!existingEmployee.exists()) {
      throw new Error('This employee record no longer exists. Refresh the page and try again.');
    }

    await updateDoc(employeeDocument, {
      ...createEmployeeRecord(employee),
      updatedAt: serverTimestamp(),
    });
  }

  async deleteEmployee(employeeId: string): Promise<void> {
    const employeeDocument = doc(db, EMPLOYEES_COLLECTION, employeeId);
    const existingEmployee = await getDoc(employeeDocument);

    if (!existingEmployee.exists()) {
      throw new Error('This employee record no longer exists. Refresh the page and try again.');
    }

    await deleteDoc(employeeDocument);
  }
}

export const employeeService: EmployeeRepository = new FirestoreEmployeeRepository();
