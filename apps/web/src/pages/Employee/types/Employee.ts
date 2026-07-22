export type EmployeeGender = 'Male' | 'Female' | 'Other';

export type EmploymentType = 'Permanent' | 'Contract' | 'Intern' | 'Consultant';

export type EmployeeStatus = 'Active' | 'Inactive' | 'Notice Period' | 'Terminated';

export interface Employee {
  id?: string;
  employeeId: string;
  employeeCode: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  gender: EmployeeGender;
  dateOfBirth: string;
  mobileNumber: string;
  email: string;
  /** Legacy aliases are mapped by employeeService for existing Firestore records. */
  officialEmail?: string;
  personalEmail?: string;
  mobile?: string;
  departmentId?: string;
  department: string;
  designationId?: string;
  designation: string;
  reportingManagerId?: string;
  employmentType: EmploymentType;
  joiningDate: string;
  reportingManager: string;
  workLocation: string;
  employmentStatus: EmployeeStatus;
  status?: 'Active' | 'Inactive';
  photoUrl: string;
  address: string;
  emergencyContact: string;
  notes: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface EmployeeFormData {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  gender: EmployeeGender;
  dateOfBirth: string;
  mobileNumber: string;
  email: string;
  department: string;
  designation: string;
  employmentType: EmploymentType;
  joiningDate: string;
  reportingManager: string;
  workLocation: string;
  employmentStatus: EmployeeStatus;
  photoUrl: string;
  address: string;
  emergencyContact: string;
  notes: string;
}

export interface EmployeeFilter {
  search: string;
  department: string;
  designation: string;
  employmentStatus: EmployeeStatus | '';
  employmentType: EmploymentType | '';
  sortBy: EmployeeSortOption;
}

export type EmployeeSortOption = 'newest' | 'oldest' | 'name' | 'employeeCode';
import type { Timestamp } from 'firebase/firestore';
