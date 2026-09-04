import type { DocumentTemplateConfig, OfferLetterBlock } from '../types/Admin';

export function createInitialIncrementTemplateConfig(brandId: string, brandName: string): DocumentTemplateConfig {
  return {
    id: `increment_letter_${brandId}`,
    templateId: `increment_letter_${brandId}`,
    brandId,
    brandName,
    templateName: `${brandName} Increment Letter`,
    category: 'HR',
    type: 'INCREMENT_LETTER',
    format: 'PDF',
    version: 1,
    versionNumber: 1,
    activeVersion: 'v1.0 (Draft)',
    lifecycleState: 'Draft',
    isActive: true,
    previousVersions: [],
    offerSchema: {
      brandId,
      brandName,
      pageSize: 'A4',
      margins: { top: 20, bottom: 20, left: 20, right: 20 },
      blocks: INITIAL_INCREMENT_LETTER_BLOCKS,
    },
    updatedAt: new Date().toISOString(),
  };
}

export const INITIAL_INCREMENT_LETTER_BLOCKS: OfferLetterBlock[] = [
  {
    id: 'inc-block-1',
    type: 'header',
    title: 'Header & Legal Details',
    isProtected: false,
    headerConfig: {
      preset: 'logo-left-details-right',
      showLogo: true,
      logoHeight: 50,
      showBrandName: false,
      showLegalName: true,
      showAddress: true,
      showPhone: true,
      showEmail: true,
      showWebsite: true,
      showCin: true,
      showPan: true,
      showGstin: true,
      legalFontSize: 10,
      legalAlignment: 'right',
    },
    formatting: { alignment: 'left', marginBottom: 16 }
  },
  {
    id: 'inc-block-2',
    type: 'paragraph',
    title: 'Reference & Date',
    isProtected: false,
    content: 'Ref: {{INCREMENT_REF}}\nDate: {{ISSUANCE_DATE}}',
    formatting: { fontSize: 12, lineHeight: 1.5, marginBottom: 16 }
  },
  {
    id: 'inc-block-3',
    type: 'paragraph',
    title: 'Employee Information',
    isProtected: false,
    content: 'To,\n\n{{PERSON_NAME}}\n\nEmployee Code: {{EMPLOYEE_CODE}}\n\nDesignation: {{DESIGNATION}}\n\nDepartment: {{DEPARTMENT}}\n\nWork Location: {{WORK_LOCATION}}',
    formatting: { fontSize: 12, lineHeight: 1.5, marginBottom: 16 }
  },
  {
    id: 'inc-block-4',
    type: 'paragraph',
    title: 'Subject',
    isProtected: false,
    content: 'Subject: Salary Revision & Increment Letter',
    formatting: { fontSize: 13, fontWeight: 'bold', marginBottom: 16 }
  },
  {
    id: 'inc-block-5',
    type: 'paragraph',
    title: 'Appraisal / Revision Statement',
    isProtected: false,
    content: 'Following the appraisal and performance review process, we are pleased to inform you that your compensation has been revised in recognition of your contribution and performance.',
    formatting: { fontSize: 12, lineHeight: 1.6, marginBottom: 16 }
  },
  {
    id: 'inc-block-6',
    type: 'paragraph',
    title: 'Previous Compensation',
    isProtected: false,
    content: 'Previous Monthly Gross: {{PREVIOUS_MONTHLY_GROSS}}\n\nPrevious Annual CTC: {{PREVIOUS_ANNUAL_CTC}}',
    formatting: { fontSize: 12, lineHeight: 1.5, marginBottom: 16 }
  },
  {
    id: 'inc-block-7',
    type: 'paragraph',
    title: 'Revised Compensation',
    isProtected: false,
    content: 'Revised Monthly Gross: {{REVISED_MONTHLY_GROSS}}\n\nRevised Annual CTC: {{REVISED_ANNUAL_CTC}}',
    formatting: { fontSize: 12, lineHeight: 1.5, fontWeight: 'bold', marginBottom: 16 }
  },
  {
    id: 'inc-block-8',
    type: 'paragraph',
    title: 'Increment Details',
    isProtected: false,
    content: 'Increment Type: {{INCREMENT_TYPE}}\n\nIncrement Percentage: {{INCREMENT_PERCENTAGE}}\n\nIncrement Amount: {{INCREMENT_AMOUNT}}',
    formatting: { fontSize: 12, lineHeight: 1.5, marginBottom: 16 }
  },
  {
    id: 'inc-block-9',
    type: 'paragraph',
    title: 'Effective Date',
    isProtected: false,
    content: 'Effective From: {{EFFECTIVE_DATE}}',
    formatting: { fontSize: 12, fontWeight: 'bold', marginBottom: 16 }
  },
  {
    id: 'inc-block-10',
    type: 'paragraph',
    title: 'Closing Statement',
    isProtected: false,
    content: 'We appreciate your continued contribution to the organization and look forward to your continued growth and success with the company.',
    formatting: { fontSize: 12, lineHeight: 1.6, marginBottom: 20 }
  },
  {
    id: 'inc-block-11',
    type: 'paragraph',
    title: 'Company Signatory Line',
    isProtected: false,
    content: 'For {{LEGAL_NAME}}\n({{BRAND_NAME}})',
    formatting: { fontSize: 12, fontWeight: 'bold', marginBottom: 12 }
  },
  {
    id: 'inc-block-12',
    type: 'signature',
    title: 'Authorized Signature',
    isProtected: false,
    signatureSource: 'brandDefault',
    formatting: { marginBottom: 8 }
  },
  {
    id: 'inc-block-13',
    type: 'stamp',
    title: 'Official Stamp',
    isProtected: false,
    formatting: { marginBottom: 16 }
  },
  {
    id: 'inc-block-14',
    type: 'footer',
    title: 'Footer & Confidentiality',
    isProtected: false,
    footerConfig: {
      showConfidentialityNotice: true,
      confidentialityText: '{{BRAND_NAME}} • Confidential Salary Revision Letter',
      showWebsite: true,
      showPageNumber: true,
      showTotalPages: true,
      fontSize: 9
    },
    formatting: { fontSize: 9, color: '#64748b', alignment: 'left' }
  }
];
