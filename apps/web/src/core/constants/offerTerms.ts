export interface OfferTerm {
  id: string;
  title: string;
  description: string;
}

export const OFFER_TERMS: readonly OfferTerm[] = [
  {
    id: 'full-working-time',
    title: 'Full Working Time',
    description: 'Employee shall devote full working time to the Company.',
  },
  {
    id: 'professional-conduct-and-integrity',
    title: 'Professional Conduct and Integrity',
    description: 'Employee shall maintain professional conduct and integrity.',
  },
  {
    id: 'monthly-recruitment-targets',
    title: 'Monthly Recruitment Targets',
    description: 'Monthly recruitment targets are mandatory.',
  },
  {
    id: 'eligible-active-candidate-incentives',
    title: 'Eligible Active Candidate Incentives',
    description:
      'Incentives are payable only on eligible active candidates according to Company policy.',
  },
  {
    id: 'outside-employment-approval',
    title: 'Outside Employment Approval',
    description: 'Outside employment requires prior written approval.',
  },
  {
    id: 'probation-period',
    title: 'Probation Period',
    description: '180 Days.',
  },
  {
    id: 'notice-period',
    title: 'Notice Period',
    description: '30 Days.',
  },
  {
    id: 'termination-for-misconduct-or-poor-performance',
    title: 'Termination for Misconduct or Poor Performance',
    description: 'Company may terminate employment for misconduct or poor performance.',
  },
  {
    id: 'return-of-company-assets',
    title: 'Return of Company Assets',
    description: 'All Company assets must be returned before separation.',
  },
  {
    id: 'recovery-for-company-property',
    title: 'Recovery for Company Property',
    description: 'Recovery may be made for damaged or unreturned Company property.',
  },
  {
    id: 'salary-payroll-cycle',
    title: 'Salary Payroll Cycle',
    description: "Salary shall be processed according to the Company's payroll cycle.",
  },
  {
    id: 'confidentiality',
    title: 'Confidentiality',
    description: 'Confidentiality.',
  },
  {
    id: 'background-verification',
    title: 'Background Verification',
    description: 'Background Verification.',
  },
  {
    id: 'false-information',
    title: 'False Information',
    description: 'Providing false information may lead to termination.',
  },
  {
    id: 'company-policy-compliance',
    title: 'Company Policy Compliance',
    description: 'Compliance with Company policies.',
  },
  {
    id: 'professional-code-of-conduct',
    title: 'Professional Code of Conduct',
    description: 'Professional Code of Conduct.',
  },
  {
    id: 'conflict-of-interest-disclosure',
    title: 'Conflict of Interest Disclosure',
    description: 'Conflict of Interest disclosure.',
  },
  {
    id: 'supersedes-previous-discussions',
    title: 'Supersedes Previous Discussions',
    description: 'This Offer Letter supersedes previous discussions.',
  },
  {
    id: 'policy-amendment-right',
    title: 'Policy Amendment Right',
    description: 'The Company reserves the right to amend policies whenever required.',
  },
];
