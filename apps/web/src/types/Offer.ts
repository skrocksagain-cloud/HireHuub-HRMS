/**
 * ============================================================
 * HireHuub ERP
 * Offer Model
 * ============================================================
 */

export interface TimelineItem {
  id: string;

  title: string;

  description: string;

  status: "Completed" | "Current" | "Pending";

  createdBy: string;

  createdAt?: unknown;
}

export interface Offer {
  /**
   * Firestore Document ID
   */
  id?: string;

  // ============================================================
  // Offer Information
  // ============================================================

  offerId: string;

  status:
    | "Draft"
    | "Generated"
    | "Sent"
    | "Accepted"
    | "Rejected"
    | "Joined"
    | "Converted";

  offerDate: string;

  validTill: string;

  // ============================================================
  // Candidate Information
  // ============================================================

  firstName: string;

  middleName: string;

  lastName: string;

  fullName: string;

  gender:
    | "Male"
    | "Female"
    | "Other";

  mobile: string;

  personalEmail: string;

  currentAddress: string;

  // ============================================================
  // Employment Information
  // ============================================================

  departmentId: string;

  departmentName: string;

  designationId: string;

  designationName: string;

  reportingManagerId: string;

  reportingManager: string;

  employmentType:
    | "Permanent"
    | "Contract"
    | "Intern";

  workLocation: string;

  joiningDate: string;

  probationPeriod: number;

  // ============================================================
  // Salary Structure
  // ============================================================

  monthlyGrossSalary: number;

  annualCTC: number;

  basicSalary: number;

  hra: number;

  conveyanceAllowance: number;

  mobileAllowance: number;

  specialAllowance: number;

  professionalTax: number;

  netTakeHome: number;

  /**
   * Future Payroll Support
   */
  pfApplicable: boolean;

  esiApplicable: boolean;

  // ============================================================
  // Brand
  // ============================================================
  brandId?: string;

  // ============================================================
  // Additional Statutory & Annual Breakdown
  // ============================================================
  employeePf?: number;
  employerPf?: number;
  employeeEsi?: number;
  employerEsi?: number;
  annualGross?: number;
  annualNetTakeHome?: number;

  // ============================================================
  // Offer Remarks
  // ============================================================

  remarks: string;

  // ============================================================
  // Generated Document
  // ============================================================

  documentId: string;

  pdfUrl: string;

  // ============================================================
  // Offer Timeline
  // ============================================================

  timeline: TimelineItem[];

  // ============================================================
  // Employee Conversion
  // ============================================================

  employeeId: string;

  convertedAt?: unknown;

  // ============================================================
  // Audit
  // ============================================================

  createdBy: string;

  updatedBy: string;

  createdAt?: unknown;

  updatedAt?: unknown;
}