import type { DocumentTemplateConfig, OfferLetterBlock } from '../types/Admin';

export const INITIAL_HIRE_HUUB_OFFER_BLOCKS: OfferLetterBlock[] = [
  // --- Page 1: Formal Offer Header & Subject ---
  {
    id: 'block-1',
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
    id: 'block-2',
    type: 'heading',
    headingLevel: 'h1',
    title: 'Header Classification',
    isProtected: false,
    content: 'PRIVATE & CONFIDENTIAL',
    formatting: { fontSize: 16, fontWeight: 'bold', alignment: 'left', color: '#1e293b', marginBottom: 12 }
  },
  {
    id: 'block-3',
    type: 'paragraph',
    title: 'Candidate Information & Ref',
    isProtected: false,
    content: 'Date: {{OFFER_DATE}}\nRef: {{OFFER_REFERENCE}}\n\nTo,\n{{PERSON_NAME}}\n{{PERSON_ADDRESS}}\nEmail: {{PERSON_EMAIL}}\nPhone: {{PERSON_PHONE}}',
    formatting: { fontSize: 12, lineHeight: 1.5, marginBottom: 16 }
  },
  {
    id: 'block-4',
    type: 'heading',
    headingLevel: 'h2',
    title: 'Offer Subject Line',
    isProtected: false,
    content: 'Subject: Offer of Employment - {{DESIGNATION}}',
    formatting: { fontSize: 14, fontWeight: 'bold', alignment: 'left', color: '#0f172a', marginBottom: 12 }
  },
  {
    id: 'block-5',
    type: 'paragraph',
    title: 'Offer Welcome & Position',
    isProtected: false,
    content: 'Dear {{PERSON_NAME}},\n\nOn behalf of {{LEGAL_NAME}} ("{{BRAND_NAME}}"), we are pleased to extend an offer of employment for the position of {{DESIGNATION}} in our {{DEPARTMENT}} department at our {{WORK_LOCATION}} office.\n\nYour scheduled joining date will be {{JOINING_DATE}}. You will be reporting directly to {{REPORTING_MANAGER}} or as assigned by the company leadership.',
    formatting: { fontSize: 12, lineHeight: 1.6, marginBottom: 16 }
  },
  {
    id: 'block-6',
    type: 'divider',
    title: 'Section Divider',
    isProtected: false,
    formatting: { marginTop: 12, marginBottom: 16 }
  },
  {
    id: 'block-7',
    type: 'heading',
    headingLevel: 'h3',
    title: '1. Role & Responsibilities Heading',
    isProtected: false,
    content: '1. Role & Responsibilities',
    formatting: { fontSize: 13, fontWeight: 'bold', marginBottom: 8 }
  },
  {
    id: 'block-8',
    type: 'paragraph',
    title: 'Duties & Conduct Terms',
    isProtected: false,
    content: 'As {{DESIGNATION}}, your duties and responsibilities will align with company standards and objectives. You are expected to perform your duties diligently, maintain strict confidentiality regarding company affairs, and adhere to all internal policies and code of conduct.',
    formatting: { fontSize: 12, lineHeight: 1.5, marginBottom: 16 }
  },

  // --- Page Break to Page 2: Compensation & Terms ---
  {
    id: 'block-pb-1',
    type: 'page_break',
    title: '--- Page Break 1 ---',
    isProtected: false
  },
  {
    id: 'block-9',
    type: 'heading',
    headingLevel: 'h2',
    title: 'Annexure A: Compensation Heading',
    isProtected: false,
    content: 'Annexure A: Compensation Breakdown',
    formatting: { fontSize: 14, fontWeight: 'bold', alignment: 'left', marginBottom: 12 }
  },
  {
    id: 'block-10',
    type: 'paragraph',
    title: 'CTC Overview Text',
    isProtected: false,
    content: 'Your Total Annual Gross Cost to Company (CTC) will be {{ANNUAL_CTC}} ({{GROSS_CTC}} Monthly). The detailed salary component break-up is provided below:',
    formatting: { fontSize: 12, lineHeight: 1.5, marginBottom: 12 }
  },
  {
    id: 'block-11',
    type: 'table',
    title: 'Itemized Salary Table',
    isProtected: false,
    tableType: 'SALARY_BREAKDOWN',
    tableColumns: [
      { header: 'Salary Component', key: 'component', width: '40%', align: 'left' },
      { header: 'Monthly (₹)', key: 'monthly', width: '30%', align: 'right' },
      { header: 'Annual (₹)', key: 'annual', width: '30%', align: 'right' }
    ],
    tableRows: [
      { component: 'Basic Pay', monthly: '{{BASIC_MONTHLY}}', annual: '{{BASIC_ANNUAL}}' },
      { component: 'House Rent Allowance (HRA)', monthly: '{{HRA_MONTHLY}}', annual: '{{HRA_ANNUAL}}' },
      { component: 'Special Allowance', monthly: '{{SPECIAL_ALLOWANCE_MONTHLY}}', annual: '{{SPECIAL_ALLOWANCE_ANNUAL}}' },
      { component: 'Gross Salary', monthly: '{{GROSS_CTC}}', annual: '{{ANNUAL_CTC}}' },
      { component: 'Employer Provident Fund (PF)', monthly: '{{PF_EMPLOYER}}', annual: '-' },
      { component: 'Professional Tax (PT)', monthly: '{{PROFESSIONAL_TAX}}', annual: '-' },
      { component: 'Estimated Net Take-Home', monthly: '{{NET_TAKE_HOME}}', annual: '-' }
    ],
    formatting: { fontSize: 11, marginBottom: 16 }
  },

  // --- Page Break to Page 3: Terms, Acceptance & Signatures ---
  {
    id: 'block-pb-2',
    type: 'page_break',
    title: '--- Page Break 2 ---',
    isProtected: false
  },
  {
    id: 'block-12',
    type: 'heading',
    headingLevel: 'h3',
    title: '2. Terms & Acceptance Heading',
    isProtected: false,
    content: '2. Terms of Employment & Acceptance',
    formatting: { fontSize: 13, fontWeight: 'bold', marginBottom: 8 }
  },
  {
    id: 'block-13',
    type: 'paragraph',
    title: 'Onboarding & Verification Terms',
    isProtected: false,
    content: 'This offer is subject to satisfactory reference checks, background verification, and submission of required onboarding documents. Please sign and return the duplicate copy of this letter within 3 business days as confirmation of your acceptance.',
    formatting: { fontSize: 12, lineHeight: 1.5, marginBottom: 20 }
  },
  {
    id: 'block-14',
    type: 'paragraph',
    title: 'Company Signatory Title',
    isProtected: false,
    content: 'For {{LEGAL_NAME}} ({{BRAND_NAME}})',
    formatting: { fontSize: 12, fontWeight: 'bold', marginBottom: 12 }
  },
  {
    id: 'block-15',
    type: 'signature',
    title: 'Authorized Signature Block',
    isProtected: false,
    signatureSource: 'brandDefault',
    formatting: { marginBottom: 8 }
  },
  {
    id: 'block-16',
    type: 'stamp',
    title: 'Official Brand Stamp Block',
    isProtected: false,
    formatting: { marginBottom: 16 }
  },
  {
    id: 'block-17',
    type: 'paragraph',
    title: 'Signatory Name & Designation',
    isProtected: false,
    content: 'Authorized Signatory: {{SIGNATORY_NAME}}\nDesignation: {{SIGNATORY_DESIGNATION}}',
    formatting: { fontSize: 12, lineHeight: 1.4, marginBottom: 24 }
  },
  {
    id: 'block-18',
    type: 'divider',
    title: 'Acceptance Divider',
    isProtected: false,
    formatting: { marginBottom: 16 }
  },
  {
    id: 'block-19',
    type: 'paragraph',
    title: 'Candidate Acceptance Block',
    isProtected: false,
    content: 'ACCEPTANCE OF OFFER:\nI, {{PERSON_NAME}}, hereby accept the terms and conditions of employment stated in this offer letter.\n\nSignature: ______________________             Date: _______________',
    formatting: { fontSize: 11, lineHeight: 1.6 }
  },
  {
    id: 'block-20',
    type: 'footer',
    title: 'Footer & Confidentiality',
    isProtected: false,
    footerConfig: {
      showConfidentialityNotice: true,
      confidentialityText: '{{BRAND_NAME}} • Confidential Offer Letter',
      showWebsite: true,
      showEmail: false,
      showPageNumber: true,
      showTotalPages: true,
      layoutPlacement: 'left-right',
      alignment: 'left',
      fontSize: 10,
      marginTop: 16
    }
  }
];



export const createInitialOfferTemplateConfig = (
  brandId: string = 'brand-hirehuub',
  brandName: string = 'Hire Huub'
): DocumentTemplateConfig => ({
  id: `offer_letter_${brandId}`,
  templateId: `offer_letter_${brandId}`,
  templateName: `${brandName} Official Offer Letter`,
  type: 'OFFER_LETTER',
  category: 'HR',
  format: 'PDF',
  brandId,
  brandName,
  version: 1,
  activeVersion: 'v1.0',
  versionNumber: 1,
  status: 'Active',
  lifecycleState: 'Draft',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  previousVersions: [],
  offerSchema: {
    brandId,
    brandName,
    pageSize: 'A4',
    margins: { top: 20, bottom: 20, left: 20, right: 20 },
    blocks: INITIAL_HIRE_HUUB_OFFER_BLOCKS
  }
});
