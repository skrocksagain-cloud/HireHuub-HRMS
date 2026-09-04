import type {
  AssociatePartner,
  CreateAssociatePartnerInput,
  CandidateSubmissionStatus,
  AssociatePartnerCandidateSubmission,
} from '../../../../../types/AssociatePartner';
import { associatePartnerRepository } from '../repositories/associatePartnerRepository';
import { getIndianStates, isValidCityForState } from '../../../../../core/location/indiaLocationMaster';

export interface AddActiveCandidateInput {
  candidateName: string;
  phone: string;
  city: string;
  state: string;
  associatePartnerId: string;
  clientId: string;
  clientName: string;
  activeDate: string;
  role: string;
}

export interface BulkCandidateValidationResult {
  validInputs: AddActiveCandidateInput[];
  invalidRows: Array<{ rowNumber: number; data: Record<string, string>; error: string }>;
}

class AssociatePartnerService {
  async getPartners(): Promise<AssociatePartner[]> {
    return associatePartnerRepository.getPartners();
  }

  async getPartnerById(id: string): Promise<AssociatePartner | null> {
    if (!id.trim()) throw new Error('Associate Partner ID is required.');
    return associatePartnerRepository.getPartnerById(id);
  }

  async createPartner(input: CreateAssociatePartnerInput): Promise<AssociatePartner> {
    if (!input.subVendorName.trim()) throw new Error('Sub Vendor Name is required.');
    if (!input.contactPerson.trim()) throw new Error('Contact Person is required.');
    if (!input.email.trim()) throw new Error('Email is required.');
    if (!input.phone.trim()) throw new Error('Phone is required.');
    if (!input.city.trim() || !input.state.trim()) throw new Error('City and State are required.');
    if (!input.reportingToEmployeeId.trim()) throw new Error('Reporting To Hire Huub Employee is required.');
    if (!input.pan.trim()) throw new Error('PAN Number is required.');
    if (!input.aadhaarOrTradeLicence.trim()) throw new Error('Aadhaar or Trade Licence is required.');
    if (!input.bankName.trim() || !input.accountNumber.trim() || !input.ifscCode.trim()) {
      throw new Error('Complete Bank Details (Bank Name, Account Number, IFSC) are required.');
    }

    return associatePartnerRepository.createPartner(input);
  }

  async togglePartnerStatus(id: string): Promise<AssociatePartner> {
    const partner = await this.getPartnerById(id);
    if (!partner) throw new Error(`Partner with ID ${id} not found.`);

    const newStatus = partner.status === 'Active' ? 'Inactive' : 'Active';
    return associatePartnerRepository.updatePartner(id, { status: newStatus });
  }

  async updateReportingTo(
    partnerId: string,
    newEmployeeId: string,
    newEmployeeName: string,
    isSuperAdmin: boolean
  ): Promise<AssociatePartner> {
    if (!isSuperAdmin) {
      throw new Error('Only Super Admin can change the assigned Reporting To Hire Huub Employee.');
    }
    const partner = await this.getPartnerById(partnerId);
    if (!partner) throw new Error(`Partner with ID ${partnerId} not found.`);

    return associatePartnerRepository.updatePartner(partnerId, {
      reportingTo: {
        employeeId: newEmployeeId,
        employeeName: newEmployeeName,
      },
    });
  }

  async updateCandidateStatus(
    partnerId: string,
    submissionId: string,
    status: CandidateSubmissionStatus,
    rejectionReason?: string,
    joiningDate?: string,
    clientTenureDays: number = 90
  ): Promise<AssociatePartner> {
    const partner = await this.getPartnerById(partnerId);
    if (!partner) throw new Error(`Partner with ID ${partnerId} not found.`);

    if (status === 'Rejected' && (!rejectionReason || !rejectionReason.trim())) {
      throw new Error('Rejection Reason is MANDATORY when candidate status is marked Rejected.');
    }

    const updatedSubmissions = partner.submissions.map((sub) => {
      if (sub.id !== submissionId) return sub;

      let eligibilityStatus = sub.eligibilityStatus;
      let tenure = sub.tenure;

      if (status === 'Joined') {
        const jDate = joiningDate || new Date().toISOString().split('T')[0];
        tenure = `${clientTenureDays} Days`;
        const joinTime = new Date(jDate).getTime();
        const nowTime = new Date().getTime();
        const diffDays = Math.floor((nowTime - joinTime) / (1000 * 60 * 60 * 24));
        eligibilityStatus = diffDays >= clientTenureDays ? 'Eligible' : 'Eligible';
      }

      return {
        ...sub,
        status,
        rejectionReason: status === 'Rejected' ? rejectionReason : undefined,
        joiningDate: status === 'Joined' ? joiningDate || new Date().toISOString().split('T')[0] : sub.joiningDate,
        tenure,
        eligibilityStatus: status === 'Joined' ? eligibilityStatus || 'Eligible' : sub.eligibilityStatus,
      };
    });

    return associatePartnerRepository.updatePartner(partnerId, {
      submissions: updatedSubmissions,
    });
  }

  validateActiveCandidateInput(input: AddActiveCandidateInput): void {
    if (!input.candidateName || !input.candidateName.trim()) throw new Error('Candidate Name is required.');
    if (!input.phone || !input.phone.trim()) throw new Error('Phone Number is required.');
    if (!input.state || !input.state.trim()) throw new Error('State is required.');

    const states = getIndianStates();
    const isValidState = states.some((s) => s.stateName.toLowerCase() === input.state.trim().toLowerCase());
    if (!isValidState) throw new Error(`Invalid Indian State/UT: '${input.state}'.`);

    if (!input.city || !input.city.trim()) throw new Error('City is required.');
    if (!isValidCityForState(input.state, input.city)) {
      throw new Error(`City '${input.city}' is not a recognized city for state '${input.state}'.`);
    }

    if (!input.associatePartnerId || !input.associatePartnerId.trim()) throw new Error('Associate Partner is required.');
    if (!input.clientId || !input.clientId.trim() || !input.clientName || !input.clientName.trim()) {
      throw new Error('Valid Client Master selection is required.');
    }
    if (!input.activeDate || !input.activeDate.trim()) throw new Error('Candidate Active Date is required.');
    if (!input.role || !input.role.trim()) throw new Error('Role is required.');
  }

  async addActiveCandidate(input: AddActiveCandidateInput): Promise<AssociatePartner> {
    this.validateActiveCandidateInput(input);

    const partner = await this.getPartnerById(input.associatePartnerId);
    if (!partner) throw new Error(`Associate Partner with ID ${input.associatePartnerId} not found.`);

    const submissionId = `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newSubmission: AssociatePartnerCandidateSubmission = {
      id: submissionId,
      candidateName: input.candidateName.trim(),
      mobileNumber: input.phone.trim(),
      city: input.city.trim(),
      state: input.state.trim(),
      clientId: input.clientId.trim(),
      clientName: input.clientName.trim(),
      role: input.role.trim(),
      submissionDate: input.activeDate,
      status: 'Joined',
      joiningDate: input.activeDate,
      tenure: '90 Days',
      eligibilityStatus: 'Eligible',
    };

    // 1. Save submission to Associate Partner record
    const updatedPartner = await associatePartnerRepository.updatePartner(partner.id, {
      submissions: [newSubmission, ...partner.submissions],
    });

    return updatedPartner;
  }

  async validateBulkCandidateRows(
    rows: Array<Record<string, string>>,
    defaultPartnerId?: string
  ): Promise<BulkCandidateValidationResult> {
    const validInputs: AddActiveCandidateInput[] = [];
    const invalidRows: Array<{ rowNumber: number; data: Record<string, string>; error: string }> = [];

    rows.forEach((row, index) => {
      const rowNum = index + 1;
      const candidateName = row['Candidate Name'] || row['candidateName'] || row['Name'] || '';
      const phone = row['Phone Number'] || row['phone'] || row['Mobile'] || '';
      const city = row['City'] || row['city'] || '';
      const state = row['State'] || row['state'] || '';
      const associatePartnerId = row['Associate Partner ID'] || row['associatePartnerId'] || defaultPartnerId || '';
      const clientId = row['Client ID'] || row['clientId'] || '';
      const clientName = row['Client Name'] || row['clientName'] || row['Client'] || '';
      const activeDate = row['Candidate Active Date'] || row['activeDate'] || row['Date'] || new Date().toISOString().split('T')[0];
      const role = row['Role'] || row['role'] || '';

      const input: AddActiveCandidateInput = {
        candidateName,
        phone,
        city,
        state,
        associatePartnerId,
        clientId,
        clientName,
        activeDate,
        role,
      };

      try {
        this.validateActiveCandidateInput(input);
        validInputs.push(input);
      } catch (err: unknown) {
        invalidRows.push({
          rowNumber: rowNum,
          data: row,
          error: err instanceof Error ? err.message : 'Validation failed.',
        });
      }
    });

    return { validInputs, invalidRows };
  }

  async bulkAddActiveCandidates(inputs: AddActiveCandidateInput[]): Promise<void> {
    for (const input of inputs) {
      await this.addActiveCandidate(input);
    }
  }
}

export const associatePartnerService = new AssociatePartnerService();

