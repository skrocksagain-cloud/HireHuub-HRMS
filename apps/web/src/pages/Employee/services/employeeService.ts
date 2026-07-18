import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
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

const readString = (data: Record<string, unknown>, field: string): string => {
  const value = data[field];
  return typeof value === 'string' ? value : '';
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
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
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
  ...employee,
  fullName: `${employee.firstName.trim()} ${employee.lastName.trim()}`.trim(),
});

class FirestoreEmployeeRepository implements EmployeeRepository {
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
    const document = await addDoc(collection(db, EMPLOYEES_COLLECTION), {
      ...createEmployeeRecord(employee),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return document.id;
  }

  async updateEmployee(employeeId: string, employee: EmployeeFormData): Promise<void> {
    await updateDoc(doc(db, EMPLOYEES_COLLECTION, employeeId), {
      ...createEmployeeRecord(employee),
      updatedAt: serverTimestamp(),
    });
  }

  async deleteEmployee(employeeId: string): Promise<void> {
    await deleteDoc(doc(db, EMPLOYEES_COLLECTION, employeeId));
  }
}

export const employeeService: EmployeeRepository = new FirestoreEmployeeRepository();
