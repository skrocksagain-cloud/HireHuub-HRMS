export type EmployeeGender = 'Male' | 'Female' | 'Other';

export type EmploymentType = 'Permanent' | 'Contract' | 'Intern' | 'Consultant';

export type EmployeeStatus = 'Active' | 'Inactive' | 'Notice Period' | 'Terminated' | 'Resigned';

export type ExitType = 'Resignation' | 'Termination' | 'Mutual Separation' | 'Manager Initiated';

export type ExitStatus =
  | 'Pending Manager Approval'
  | 'Approved'
  | 'Notice Period'
  | 'Exit Completed'
  | 'Rejected';

export interface ExitRecord {
  id?: string;
  exitType: ExitType;
  initiatedBy: string;
  initiatedByRole?: string;
  initiatedAt: string;
  resignationDate?: string;
  noticePeriodDays?: number;
  lastWorkingDate: string;
  exitReason: string;
  exitRemarks?: string;
  exitStatus: ExitStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  relievingLetterGenerated?: boolean;
  relievingLetterUrl?: string;
  relievingLetterRef?: string;
  relievingLetterGeneratedAt?: string;
}

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
  mobileVerified?: boolean;
  email: string;
  /** Legacy aliases are mapped by employeeService for existing Firestore records. */
  officialEmail?: string;
  personalEmail?: string;
  mobile?: string;
  departmentId?: string;
  department: string;
  teamId?: string;
  teamName?: string;
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
  fatherName?: string;
  motherName?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  bankName?: string;
  monthlyGross?: number;
  salary?: number;
  grossSalary?: number;
  pfApplicable?: boolean;
  esicApplicable?: boolean;
  ptApplicable?: boolean;
  calculatedPf?: number;
  calculatedEsic?: number;
  calculatedPt?: number;
  totalDeductions?: number;
  netTakeHome?: number;
  lastWorkingDate?: string;
  rehireDate?: string;
  assignedRole?: 'User' | 'Admin' | 'Master Admin' | 'Super Admin';
  exitRecord?: ExitRecord;
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
  departmentId?: string;
  department: string;
  designation: string;
  employmentType: EmploymentType;
  joiningDate: string;
  reportingManagerId?: string;
  reportingManager: string;
  workLocation: string;
  employmentStatus: EmployeeStatus;
  photoUrl: string;
  address: string;
  emergencyContact: string;
  notes: string;
  grossSalary?: number;
  pfApplicable?: boolean;
  esicApplicable?: boolean;
  ptApplicable?: boolean;
  calculatedPf?: number;
  calculatedEsic?: number;
  calculatedPt?: number;
  totalDeductions?: number;
  netTakeHome?: number;
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
