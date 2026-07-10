import type { Employee } from "../types/Employee";

export const DEFAULT_EMPLOYEE: Employee = {
  // =========================
  // Employee Information
  // =========================
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

  // =========================
  // Contact
  // =========================
  officialEmail: "",
  personalEmail: "",

  mobile: "",
  alternateMobile: "",

  // =========================
  // Current Address
  // =========================
  currentAddress: "",
  currentCity: "",
  currentState: "",
  currentPinCode: "",
  currentCountry: "India",

  // =========================
  // Permanent Address
  // =========================
  sameAsCurrentAddress: true,

  permanentAddress: "",
  permanentCity: "",
  permanentState: "",
  permanentPinCode: "",
  permanentCountry: "India",

  // =========================
  // Employment
  // =========================
  departmentId: "",
  departmentName: "",

  designationId: "",
  designationName: "",

  roleId: "",
  roleName: "",

  dateOfJoining: "",

  employmentType: "Permanent",

  reportingManager: "",

  workLocation: "",

  shift: "General",

  status: "Active",

  // =========================
  // Government
  // =========================
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

  // =========================
  // Bank
  // =========================
  accountHolderName: "",

  bankName: "",
  branchName: "",

  accountNumber: "",
  ifscCode: "",

  accountType: "Savings",

  paymentMode: "Bank Transfer",

  upiId: "",

  // =========================
  // Salary
  // =========================
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

  // =========================
  // Emergency
  // =========================
  emergencyContactName: "",
  emergencyRelationship: "",

  emergencyPrimaryMobile: "",
  emergencyAlternateMobile: "",

  emergencyEmail: "",

  emergencyAddress: "",
  emergencyCity: "",
  emergencyState: "",
  emergencyPinCode: "",

  // =========================
  // Documents
  // =========================
  resumeUrl: "",

  aadhaarUrl: "",
  panUrl: "",
};