export interface Employee {
  id?: string;

  // ==========================================
  // Employee Information
  // ==========================================

  employeeId: string;
  employeeSequence: number;

  firstName: string;
  middleName: string;
  lastName: string;

  gender: "Male" | "Female" | "Other";

  dateOfBirth: string;
  bloodGroup: string;

  maritalStatus:
    | "Single"
    | "Married"
    | "Divorced"
    | "Widowed";

  photoUrl: string;

  // ==========================================
  // Contact Information
  // ==========================================

  officialEmail: string;
  personalEmail: string;

  mobile: string;
  alternateMobile: string;

  // ==========================================
  // Current Address
  // ==========================================

  currentAddress: string;
  currentCity: string;
  currentState: string;
  currentPinCode: string;
  currentCountry: string;

  // ==========================================
  // Permanent Address
  // ==========================================

  sameAsCurrentAddress: boolean;

  permanentAddress: string;
  permanentCity: string;
  permanentState: string;
  permanentPinCode: string;
  permanentCountry: string;

  // ==========================================
  // Employment Information
  // ==========================================

  departmentId: string;
  departmentName: string;

  designationId: string;
  designationName: string;

  roleId: string;
  roleName: string;

  dateOfJoining: string;

  employmentType:
    | "Permanent"
    | "Contract"
    | "Intern"
    | "Consultant";

  reportingManager: string;

  workLocation: string;

  shift: string;

  status: "Active" | "Inactive";

  // ==========================================
  // Government IDs
  // ==========================================

  aadhaarNumber: string;
  panNumber: string;

  passportNumber: string;
  drivingLicenceNumber: string;
  voterId: string;

  uanNumber: string;
  pfNumber: string;
  esicNumber: string;

  taxRegime: "Old" | "New";

  professionalTaxNumber: string;

  // ==========================================
  // Bank Details
  // ==========================================

  accountHolderName: string;

  bankName: string;
  branchName: string;

  accountNumber: string;
  ifscCode: string;

  accountType:
    | "Savings"
    | "Current";

  paymentMode:
    | "Bank Transfer"
    | "Cash"
    | "Cheque"
    | "UPI";

  upiId: string;

  // ==========================================
  // Salary
  // ==========================================

  monthlyGrossSalary: string;
  annualCTC: string;

  basicSalary: string;
  hra: string;
  specialAllowance: string;
  conveyanceAllowance: string;
  medicalAllowance: string;

  bonus: string;
  variablePay: string;

  pfApplicable: "Yes" | "No";
  esiApplicable: "Yes" | "No";
  professionalTaxApplicable: "Yes" | "No";

  salaryEffectiveDate: string;

  // ==========================================
  // Emergency Contact
  // ==========================================

  emergencyContactName: string;

  emergencyRelationship: string;

  emergencyPrimaryMobile: string;

  emergencyAlternateMobile: string;

  emergencyEmail: string;

  emergencyAddress: string;
  emergencyCity: string;
  emergencyState: string;
  emergencyPinCode: string;

  // ==========================================
  // Documents
  // ==========================================

  resumeUrl: string;

  aadhaarUrl: string;
  panUrl: string;

  // ==========================================
  // Audit
  // ==========================================

  createdAt?: unknown;
  updatedAt?: unknown;
}