import type {
  AssociatePartner,
  CreateAssociatePartnerInput,
  AssociatePartnerCandidateSubmission,
  AssociatePartnerDashboardMetrics,
} from '../../../../../types/AssociatePartner';

const calculateMetrics = (submissions: AssociatePartnerCandidateSubmission[]): AssociatePartnerDashboardMetrics => {
  const totalSubmitted = submissions.length;
  const selected = submissions.filter((s) => s.status === 'Selected').length;
  const joined = submissions.filter((s) => s.status === 'Joined').length;
  const active = joined; // Joined candidates automatically become Active
  const eligible = submissions.filter((s) => s.eligibilityStatus === 'Eligible').length;
  const pendingBilling = submissions.filter((s) => s.eligibilityStatus === 'Eligible' && (s.billingStatus === 'Pending Billing' || !s.billingStatus)).length;

  return {
    totalSubmitted,
    selected,
    joined,
    active,
    eligible,
    pendingBilling,
  };
};

const SAMPLE_SUBMISSIONS_1: AssociatePartnerCandidateSubmission[] = [
  {
    id: 'sub-001',
    candidateName: 'Rahul Verma',
    mobileNumber: '+91 98765 11111',
    state: 'Maharashtra',
    clientName: 'Elastic Run',
    submissionDate: '2026-07-01',
    status: 'Joined',
    joiningDate: '2026-07-10',
    tenure: '90 Days',
    eligibilityStatus: 'Eligible',
    billingStatus: 'Pending Billing',
  },
  {
    id: 'sub-002',
    candidateName: 'Pooja Kulkarni',
    mobileNumber: '+91 98765 22222',
    state: 'Karnataka',
    clientName: 'Elastic Run',
    submissionDate: '2026-07-05',
    status: 'Selected',
  },
  {
    id: 'sub-003',
    candidateName: 'Amit Saxena',
    mobileNumber: '+91 98765 33333',
    state: 'Maharashtra',
    clientName: 'Acme Tech',
    submissionDate: '2026-06-15',
    status: 'Rejected',
    rejectionReason: 'Failed technical round 2 interview',
  },
];

const SAMPLE_SUBMISSIONS_2: AssociatePartnerCandidateSubmission[] = [
  {
    id: 'sub-004',
    candidateName: 'Deepak Thorat',
    mobileNumber: '+91 91234 44444',
    state: 'Karnataka',
    clientName: 'Infosys Workforce',
    submissionDate: '2026-06-20',
    status: 'Joined',
    joiningDate: '2026-07-01',
    tenure: '30 Days',
    eligibilityStatus: 'Eligible',
    billingStatus: 'Billed',
  },
];

const SAMPLE_ASSOCIATE_PARTNERS: AssociatePartner[] = [
  {
    id: 'ap-001',
    partnerCode: 'AP-2026-001',
    subVendorName: 'Apex Recruitment Solutions',
    name: 'Apex Recruitment Solutions',
    contactPerson: 'Vikramaditya Singh',
    email: 'vikram@apexrecruitment.in',
    phone: '+91 98220 11223',
    city: 'Pune',
    state: 'Maharashtra',
    status: 'Active',
    type: 'SME',
    reportingTo: {
      employeeId: 'emp-001',
      employeeName: 'Somnath (Account Exec)',
      designation: 'Account Manager',
    },
    bankDetails: {
      bankName: 'HDFC Bank',
      accountNumber: '50100234567890',
      ifscCode: 'HDFC0000123',
    },
    pan: 'ABCDE1234F',
    aadhaarOrTradeLicence: 'MH-PUN-2024-98765',
    syncMetadata: {
      sheetId: '1BxiMVs0XRm5nPyD-8B_1234567890',
      lastSyncedAt: '2026-08-01T10:30:00.000Z',
      syncStatus: 'Synced',
      databaseTabReady: true,
      requirementsTabReady: true,
    },
    submissions: SAMPLE_SUBMISSIONS_1,
    metrics: calculateMetrics(SAMPLE_SUBMISSIONS_1),
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-08-01T10:30:00.000Z',
  },
  {
    id: 'ap-002',
    partnerCode: 'AP-2026-002',
    subVendorName: 'TalentScout Freelance Network',
    name: 'TalentScout Freelance Network',
    contactPerson: 'Priya Nambiar',
    email: 'priya@talentscout.co.in',
    phone: '+91 98450 33445',
    city: 'Bengaluru',
    state: 'Karnataka',
    status: 'Active',
    type: 'Freelancer',
    reportingTo: {
      employeeId: 'emp-002',
      employeeName: 'Anil Kumar',
      designation: 'Staffing Lead',
    },
    bankDetails: {
      bankName: 'ICICI Bank',
      accountNumber: '000401567890',
      ifscCode: 'ICIC0000004',
    },
    pan: 'PQRSW5678G',
    aadhaarOrTradeLicence: '9876-5432-1098',
    syncMetadata: {
      sheetId: '1CxiMVs0XRm5nPyD-8C_9876543210',
      lastSyncedAt: '2026-07-28T14:15:00.000Z',
      syncStatus: 'Synced',
      databaseTabReady: true,
      requirementsTabReady: true,
    },
    submissions: SAMPLE_SUBMISSIONS_2,
    metrics: calculateMetrics(SAMPLE_SUBMISSIONS_2),
    createdAt: '2026-02-01T11:20:00.000Z',
    updatedAt: '2026-07-28T14:15:00.000Z',
  },
];

class AssociatePartnerRepository {
  private partners: AssociatePartner[] = [...SAMPLE_ASSOCIATE_PARTNERS];

  async getPartners(): Promise<AssociatePartner[]> {
    return [...this.partners];
  }

  async getPartnerById(id: string): Promise<AssociatePartner | null> {
    const found = this.partners.find((p) => p.id === id);
    return found ? { ...found } : null;
  }

  async createPartner(input: CreateAssociatePartnerInput): Promise<AssociatePartner> {
    const nextSeq = this.partners.length + 1;
    const newId = `ap-${String(nextSeq).padStart(3, '0')}`;
    const code = `AP-2026-${String(nextSeq).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const emptySubmissions: AssociatePartnerCandidateSubmission[] = [];

    const newPartner: AssociatePartner = {
      id: newId,
      partnerCode: code,
      subVendorName: input.subVendorName,
      name: input.subVendorName,
      contactPerson: input.contactPerson,
      email: input.email,
      phone: input.phone,
      city: input.city,
      state: input.state,
      type: input.type,
      status: 'Active',
      reportingTo: {
        employeeId: input.reportingToEmployeeId,
        employeeName: input.reportingToEmployeeName,
      },
      bankDetails: {
        bankName: input.bankName,
        accountNumber: input.accountNumber,
        ifscCode: input.ifscCode,
      },
      pan: input.pan,
      aadhaarOrTradeLicence: input.aadhaarOrTradeLicence,
      syncMetadata: {
        sheetId: input.sheetId || undefined,
        syncStatus: input.sheetId ? 'Synced' : 'Not Configured',
        lastSyncedAt: input.sheetId ? now : undefined,
        databaseTabReady: true,
        requirementsTabReady: true,
      },
      submissions: emptySubmissions,
      metrics: calculateMetrics(emptySubmissions),
      createdAt: now,
      updatedAt: now,
    };

    this.partners.push(newPartner);
    return { ...newPartner };
  }

  async updatePartner(id: string, updates: Partial<AssociatePartner>): Promise<AssociatePartner> {
    const index = this.clientsIndex(id);
    if (index === -1) throw new Error(`Associate Partner with ID ${id} not found.`);

    const current = this.partners[index];
    const updatedSubmissions = updates.submissions || current.submissions;
    const updatedMetrics = calculateMetrics(updatedSubmissions);

    const now = new Date().toISOString();
    const updated: AssociatePartner = {
      ...current,
      ...updates,
      metrics: updatedMetrics,
      updatedAt: now,
    };

    this.partners[index] = updated;
    return { ...updated };
  }

  private clientsIndex(id: string): number {
    return this.partners.findIndex((p) => p.id === id);
  }
}

export const associatePartnerRepository = new AssociatePartnerRepository();
