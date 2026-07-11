import type { Employee } from "../types/Employee";

export const DEFAULT_EMPLOYEE: Employee = {
  // ==================================================
  // Company Information
  // ==================================================

  companyId: "",

  branchId: "",
  branchName: "",

  // ==================================================
  // Employee Information
  // ==================================================

  employeeId: "",
  employeeSequence: 0,

  firstName: "",
  middleName: "",
  lastName: "",

  gender: "Male",

  dateOfBirth: "",

  bloodGroup: "",

  maritalStatus: "Single",

  photoUrl: "",

  // ==================================================
  // Contact Information
  // ==================================================

  officialEmail: "",
  personalEmail: "",

  mobile: "",
  alternateMobile: "",

  // ==================================================
  // Current Address
  // ==================================================

  currentAddress: "",
  currentCity: "",
  currentState: "",
  currentPinCode: "",
  currentCountry: "India",

  // ==================================================
  // Permanent Address
  // ==================================================

  sameAsCurrentAddress: true,

  permanentAddress: "",
  permanentCity: "",
  permanentState: "",
  permanentPinCode: "",
  permanentCountry: "India",

  // ==================================================
  // Employment
  // ==================================================

  departmentId: "",
  departmentName: "",

  designationId: "",
  designationName: "",

  roleId: "",
  roleName: "",

  reportingManagerId: "",
  reportingManager: "",

  dateOfJoining: "",

  probationEndDate: "",

  confirmationDate: "",

  employmentType: "Permanent",

  workLocation: "",

  shift: "General",

  status: "Active",

  employeeStatus: "Joining",

  // ==================================================
  // HR Permissions
  // ==================================================

  isRecruiter: false,

  isAttendanceEnabled: true,

  isCallTrackerEnabled: false,

  isPayrollEnabled: false,

  // ==================================================
  // Government IDs
  // ==================================================

  aadhaarNumber: "",

  panNumber: "",

  passportNumber: "",

  drivingLicenceNumber: "",

  voterId: "",

  uanNumber: "",

  pfNumber: "",

  esicNumber: "",

  taxRegime: "New",

  professionalTaxNumber: "",

  // ==================================================
  // Bank Details
  // ==================================================

  accountHolderName: "",

  bankName: "",

  bankBranchName: "",

  accountNumber: "",

  ifscCode: "",

  accountType: "Savings",

  paymentMode: "Bank Transfer",

  upiId: "",

  // ==================================================
  // Salary
  // ==================================================

  monthlyGrossSalary: "",

  annualCTC: "",

  basicSalary: "",

  hra: "",

  specialAllowance: "",

  conveyanceAllowance: "",

  medicalAllowance: "",

  bonus: "",

  variablePay: "",

  pfApplicable: "Yes",

  esiApplicable: "Yes",

  professionalTaxApplicable: "Yes",

  salaryEffectiveDate: "",

  // ==================================================
  // Emergency Contact
  // ==================================================

  emergencyContactName: "",

  emergencyRelationship: "",

  emergencyPrimaryMobile: "",

  emergencyAlternateMobile: "",

  emergencyEmail: "",

  emergencyAddress: "",

  emergencyCity: "",

  emergencyState: "",

  emergencyPinCode: "",

  // ==================================================
  // Documents
  // ==================================================

  resumeUrl: "",

  aadhaarUrl: "",

  panUrl: "",

  passportUrl: "",

  photoIdUrl: "",

  bankProofUrl: "",

  educationCertificateUrl: "",

  experienceLetterUrl: "",

  offerLetterUrl: "",

  joiningLetterUrl: "",

  // ==================================================
  // Authentication
  // ==================================================

  authUid: "",

  loginCreated: false,

  loginCreatedAt: undefined,

  lastLoginAt: undefined,

  lastPasswordChangedAt: undefined,

  // ==================================================
  // Audit
  // ==================================================

  remarks: "",

  createdBy: "",

  updatedBy: "",

  createdAt: undefined,

  updatedAt: undefined,

  deletedAt: undefined,

  deletedBy: "",
};