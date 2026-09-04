export type AppraisalStatus = 'Draft' | 'Pending Approval' | 'Approved';
export type IncrementType = 'Percentage' | 'Fixed Amount';

export interface AppraisalRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  employmentStatus: string;

  // Current Compensation
  currentMonthlyGross: number;
  currentAnnualGross: number;

  // Appraisal Review Details
  reviewDate: string;
  performanceRating?: string;
  performanceRemarks: string;
  appraisalDecision: string;

  // Revised Compensation & Increment
  incrementType: IncrementType;
  incrementValue: number;
  revisedMonthlyGross: number;
  revisedAnnualGross: number;
  effectiveDate: string;

  // Approval Lifecycle
  status: AppraisalStatus;
  approverId?: string;
  approverName?: string;
  approvalDate?: string;
  approvalRemarks?: string;

  // Audit
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}
