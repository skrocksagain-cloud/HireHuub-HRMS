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

const readString = (data: Record<string, unknown>, field: string): string => {
  const value = data[field];
  return typeof value === 'string' ? value : '';
};

const readTimestamp = (data: Record<string, unknown>, field: string): Timestamp | undefined => {
  const value = data[field];
  return value instanceof Timestamp ? value : undefined;
};

const readEmploymentStatus = (data: Record<string, unknown>): Employee['employmentStatus'] => {
  const status = readString(data, 'employmentStatus') || readString(data, 'status');
  return EMPLOYEE_STATUSES.some((validStatus) => validStatus === status)
    ? (status as Employee['employmentStatus'])
    : DEFAULT_EMPLOYMENT_STATUS;
};

const readEmploymentType = (data: Record<string, unknown>): Employee['employmentType'] => {
  const employmentType = readString(data, 'employmentType');
  return EMPLOYMENT_TYPES.some((validType) => validType === employmentType)
    ? (employmentType as Employee['employmentType'])
    : DEFAULT_EMPLOYMENT_TYPE;
};

const readEmployeeGender = (data: Record<string, unknown>): Employee['gender'] => {
  const gender = readString(data, 'gender');
  return EMPLOYEE_GENDERS.some((validGender) => validGender === gender)
    ? (gender as Employee['gender'])
    : DEFAULT_GENDER;
};

export const toEmployee = (id: string, data: Record<string, unknown>): Employee => {
  const firstName = readString(data, 'firstName');
  const lastName = readString(data, 'lastName');
  const fullName = readString(data, 'fullName') || `${firstName} ${lastName}`.trim();

  return {
    id,
    employeeId: readString(data, 'employeeId'),
    employeeCode: readString(data, 'employeeCode') || readString(data, 'employeeId'),
    firstName,
    middleName: readString(data, 'middleName') || undefined,
    lastName,
    fullName,
    gender: readEmployeeGender(data),
    dateOfBirth: readString(data, 'dateOfBirth'),
    mobileNumber: readString(data, 'mobileNumber') || readString(data, 'mobile'),
    email: readString(data, 'email') || readString(data, 'officialEmail') || readString(data, 'personalEmail'),
    officialEmail: readString(data, 'officialEmail') || readString(data, 'email') || undefined,
    personalEmail: readString(data, 'personalEmail') || undefined,
    mobile: readString(data, 'mobile') || readString(data, 'mobileNumber') || undefined,
    departmentId: readString(data, 'departmentId') || undefined,
    department: readString(data, 'department') || readString(data, 'departmentName'),
    designationId: readString(data, 'designationId') || undefined,
    designation: readString(data, 'designation') || readString(data, 'designationName'),
    employmentType: readEmploymentType(data),
    joiningDate: readString(data, 'joiningDate') || readString(data, 'dateOfJoining'),
    reportingManager: readString(data, 'reportingManager'),
    reportingManagerId: readString(data, 'reportingManagerId') || undefined,
    workLocation: readString(data, 'workLocation'),
    employmentStatus: readEmploymentStatus(data),
    status: (readString(data, 'status') || readEmploymentStatus(data)) === 'Inactive' ? 'Inactive' : 'Active',
    photoUrl: readString(data, 'photoUrl'),
    address: readString(data, 'address') || readString(data, 'currentAddress'),
    emergencyContact: readString(data, 'emergencyContact') || readString(data, 'emergencyPrimaryMobile'),
    notes: readString(data, 'notes') || readString(data, 'remarks'),
    fatherName: readString(data, 'fatherName') || readString(data, 'fathersName') || undefined,
    motherName: readString(data, 'motherName') || readString(data, 'mothersName') || undefined,
    aadhaarNumber: readString(data, 'aadhaarNumber') || readString(data, 'aadhaar') || undefined,
    panNumber: readString(data, 'panNumber') || readString(data, 'pan') || undefined,
    accountNumber: readString(data, 'accountNumber') || readString(data, 'bankAccount') || undefined,
    ifscCode: readString(data, 'ifscCode') || readString(data, 'ifsc') || undefined,
    branchName: readString(data, 'branchName') || readString(data, 'bankBranch') || undefined,
    bankName: readString(data, 'bankName') || undefined,
    monthlyGross: typeof data.monthlyGross === 'number' ? data.monthlyGross : (typeof data.grossSalary === 'number' ? data.grossSalary : undefined),
    salary: typeof data.salary === 'number' ? data.salary : (typeof data.grossSalary === 'number' ? data.grossSalary : undefined),
    grossSalary: typeof data.grossSalary === 'number' ? data.grossSalary : (typeof data.monthlyGross === 'number' ? data.monthlyGross : (typeof data.salary === 'number' ? data.salary : undefined)),
    pfApplicable: typeof data.pfApplicable === 'boolean' ? data.pfApplicable : false,
    esicApplicable: typeof data.esicApplicable === 'boolean' ? data.esicApplicable : false,
    ptApplicable: typeof data.ptApplicable === 'boolean' ? data.ptApplicable : false,
    calculatedPf: typeof data.calculatedPf === 'number' ? data.calculatedPf : 0,
    calculatedEsic: typeof data.calculatedEsic === 'number' ? data.calculatedEsic : 0,
    calculatedPt: typeof data.calculatedPt === 'number' ? data.calculatedPt : 0,
    totalDeductions: typeof data.totalDeductions === 'number' ? data.totalDeductions : 0,
    netTakeHome: typeof data.netTakeHome === 'number' ? data.netTakeHome : undefined,
    lastWorkingDate: readString(data, 'lastWorkingDate') || undefined,
    exitRecord: (data.exitRecord as any) || undefined,
    assignedRole: readString(data, 'assignedRole') as any,
    createdAt: readTimestamp(data, 'createdAt'),
    updatedAt: readTimestamp(data, 'updatedAt'),
  };
};

const safeTrim = (val: string | undefined | null): string => (val || '').trim();

export const createEmployeeRecord = (employee: EmployeeFormData): Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> => ({
  employeeId: safeTrim(employee.employeeId),
  employeeCode: safeTrim(employee.employeeCode),
  firstName: safeTrim(employee.firstName),
  lastName: safeTrim(employee.lastName),
  fullName: `${safeTrim(employee.firstName)} ${safeTrim(employee.lastName)}`.trim(),
  gender: employee.gender || 'Male',
  dateOfBirth: safeTrim(employee.dateOfBirth),
  mobileNumber: safeTrim(employee.mobileNumber),
  email: safeTrim(employee.email),
  departmentId: safeTrim(employee.departmentId),
  department: safeTrim(employee.department),
  designation: safeTrim(employee.designation),
  employmentType: employee.employmentType || 'Permanent',
  joiningDate: safeTrim(employee.joiningDate),
  reportingManagerId: safeTrim(employee.reportingManagerId),
  reportingManager: safeTrim(employee.reportingManager),
  workLocation: safeTrim(employee.workLocation),
  employmentStatus: employee.employmentStatus || 'Active',
  photoUrl: safeTrim(employee.photoUrl),
  address: safeTrim(employee.address),
  emergencyContact: safeTrim(employee.emergencyContact),
  notes: safeTrim(employee.notes),
  fatherName: safeTrim((employee as any).fatherName),
  motherName: safeTrim((employee as any).motherName),
  aadhaarNumber: safeTrim((employee as any).aadhaarNumber),
  panNumber: safeTrim((employee as any).panNumber),
  bankName: safeTrim((employee as any).bankName),
  branchName: safeTrim((employee as any).branchName),
  accountNumber: safeTrim((employee as any).accountNumber),
  ifscCode: safeTrim((employee as any).ifscCode),
  grossSalary: typeof employee.grossSalary === 'number' && !isNaN(employee.grossSalary) ? employee.grossSalary : undefined,
  monthlyGross: typeof employee.grossSalary === 'number' && !isNaN(employee.grossSalary) ? employee.grossSalary : undefined,
  salary: typeof employee.grossSalary === 'number' && !isNaN(employee.grossSalary) ? employee.grossSalary : undefined,
  pfApplicable: Boolean(employee.pfApplicable),
  esicApplicable: Boolean(employee.esicApplicable),
  ptApplicable: Boolean(employee.ptApplicable),
  calculatedPf: typeof employee.calculatedPf === 'number' ? employee.calculatedPf : 0,
  calculatedEsic: typeof employee.calculatedEsic === 'number' ? employee.calculatedEsic : 0,
  calculatedPt: typeof employee.calculatedPt === 'number' ? employee.calculatedPt : 0,
  totalDeductions: typeof employee.totalDeductions === 'number' ? employee.totalDeductions : 0,
  netTakeHome: typeof employee.netTakeHome === 'number' ? employee.netTakeHome : undefined,
});

export interface EmployeeRepository {
  getEmployees: () => Promise<Employee[]>;
  getAllEmployeesGlobal: () => Promise<Employee[]>;
  getEmployeesForDepartment: (departmentId: string) => Promise<Employee[]>;
  getEmployeeById: (employeeId: string) => Promise<Employee | null>;
  createEmployee: (employee: EmployeeFormData) => Promise<string>;
  updateEmployee: (employeeId: string, employee: EmployeeFormData) => Promise<void>;
  updateEmployeeFields: (employeeId: string, fields: Record<string, unknown>) => Promise<void>;
  deleteEmployee: (employeeId: string) => Promise<void>;
}

export class FirestoreEmployeeRepository implements EmployeeRepository {
  private async ensureUniqueEmployeeFields(employee: EmployeeFormData, excludedDocumentId?: string): Promise<void> {
    const normalizedEmployee = createEmployeeRecord(employee);
    const fields: Array<[string, string, string]> = [
      ['employeeId', normalizedEmployee.employeeId, 'Employee ID'],
      ['employeeCode', normalizedEmployee.employeeCode, 'Employee Code'],
    ];

    await Promise.all(
      fields.map(async ([field, value, label]) => {
        const snapshot = await getDocs(
          query(collection(db, EMPLOYEES_COLLECTION), where(field, '==', value), limit(2))
        );
        const duplicateExists = snapshot.docs.some((employeeDocument) => employeeDocument.id !== excludedDocumentId);

        if (duplicateExists) {
          throw new Error(`${label} already exists.`);
        }
      })
    );
  }

  async getEmployees(): Promise<Employee[]> {
    return this.getAllEmployeesGlobal();
  }

  async getAllEmployeesGlobal(): Promise<Employee[]> {
    const snapshot = await getDocs(collection(db, EMPLOYEES_COLLECTION));
    return snapshot.docs.map((docSnap) => toEmployee(docSnap.id, docSnap.data()));
  }

  async getEmployeesForDepartment(departmentId: string): Promise<Employee[]> {
    if (!departmentId?.trim()) return [];
    const snapshot = await getDocs(query(collection(db, EMPLOYEES_COLLECTION), where('departmentId', '==', departmentId)));
    return snapshot.docs.map((docSnap) => toEmployee(docSnap.id, docSnap.data()));
  }

  async getEmployeeById(employeeId: string): Promise<Employee | null> {
    const docRef = doc(db, EMPLOYEES_COLLECTION, employeeId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return toEmployee(docSnap.id, docSnap.data());
    }

    const q = query(collection(db, EMPLOYEES_COLLECTION), where('employeeId', '==', employeeId), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty && snapshot.docs[0]) {
      return toEmployee(snapshot.docs[0].id, snapshot.docs[0].data());
    }

    const qCode = query(collection(db, EMPLOYEES_COLLECTION), where('employeeCode', '==', employeeId), limit(1));
    const snapshotCode = await getDocs(qCode);
    if (!snapshotCode.empty && snapshotCode.docs[0]) {
      return toEmployee(snapshotCode.docs[0].id, snapshotCode.docs[0].data());
    }

    return null;
  }

  async createEmployee(employee: EmployeeFormData): Promise<string> {
    await this.ensureUniqueEmployeeFields(employee);
    const document = await addDoc(collection(db, EMPLOYEES_COLLECTION), {
      ...createEmployeeRecord(employee),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return document.id;
  }

  async updateEmployee(employeeId: string, employee: EmployeeFormData): Promise<void> {
    await this.ensureUniqueEmployeeFields(employee, employeeId);
    const employeeDocument = doc(db, EMPLOYEES_COLLECTION, employeeId);
    const existingEmployee = await getDoc(employeeDocument);

    if (!existingEmployee.exists()) {
      throw new Error('This employee record no longer exists.');
    }

    await updateDoc(employeeDocument, {
      ...createEmployeeRecord(employee),
      updatedAt: serverTimestamp(),
    });
  }

  async updateEmployeeFields(employeeId: string, fields: Record<string, unknown>): Promise<void> {
    const employeeDocument = doc(db, EMPLOYEES_COLLECTION, employeeId);
    await updateDoc(employeeDocument, {
      ...fields,
      updatedAt: serverTimestamp(),
    });
  }

  async deleteEmployee(employeeId: string): Promise<void> {
    const employeeDocument = doc(db, EMPLOYEES_COLLECTION, employeeId);
    const existingEmployee = await getDoc(employeeDocument);

    if (!existingEmployee.exists()) {
      throw new Error('This employee record no longer exists.');
    }

    await deleteDoc(employeeDocument);
  }
}

export const employeeRepository: EmployeeRepository = new FirestoreEmployeeRepository();
