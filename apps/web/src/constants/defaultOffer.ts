import type { Offer } from "../types/Offer";

export const DEFAULT_OFFER: Offer = {
  // ============================================================
  // Offer Information
  // ============================================================

  offerId: "",

  status: "Draft",

  offerDate: "",

  validTill: "",

  // ============================================================
  // Candidate Information
  // ============================================================

  firstName: "",

  middleName: "",

  lastName: "",

  fullName: "",

  gender: "Male",

  mobile: "",

  personalEmail: "",

  currentAddress: "",

  // ============================================================
  // Employment Information
  // ============================================================

  departmentId: "",

  departmentName: "",

  designationId: "",

  designationName: "",

  reportingManagerId: "",

  reportingManager: "",

  employmentType: "Permanent",

  workLocation: "Kolkata",

  joiningDate: "",

  probationPeriod: 180,

  // ============================================================
  // Salary
  // ============================================================

  monthlyGrossSalary: 0,

  annualCTC: 0,

  basicSalary: 0,

  hra: 0,

  conveyanceAllowance: 0,

  mobileAllowance: 0,

  specialAllowance: 0,

  professionalTax: 0,

  netTakeHome: 0,

  pfApplicable: false,

  esiApplicable: false,

  // ============================================================
  // Offer Details
  // ============================================================

  remarks: "",

  // ============================================================
  // Document
  // ============================================================

  documentId: "",

  pdfUrl: "",

  // ============================================================
  // Timeline
  // ============================================================

  timeline: [],

  // ============================================================
  // Employee Conversion
  // ============================================================

  employeeId: "",

  convertedAt: undefined,

  // ============================================================
  // Audit
  // ============================================================

  createdBy: "",

  updatedBy: "",

  createdAt: undefined,

  updatedAt: undefined,
};