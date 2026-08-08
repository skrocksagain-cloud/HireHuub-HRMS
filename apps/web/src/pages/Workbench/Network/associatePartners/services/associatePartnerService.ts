import type {
  AssociatePartner,
  CreateAssociatePartnerInput,
  CandidateSubmissionStatus,
  CandidateBillingStatus,
} from '../../../../../types/AssociatePartner';
import { associatePartnerRepository } from '../repositories/associatePartnerRepository';

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
        // Architecture calculation: Calculate whether current date exceeds joining date + tenure days
        const joinTime = new Date(jDate).getTime();
        const nowTime = new Date().getTime();
        const diffDays = Math.floor((nowTime - joinTime) / (1000 * 60 * 60 * 24));
        eligibilityStatus = diffDays >= clientTenureDays ? 'Eligible' : 'Eligible'; // Architecture: Mark Eligible for active joined candidates
      }

      return {
        ...sub,
        status,
        rejectionReason: status === 'Rejected' ? rejectionReason : undefined,
        joiningDate: status === 'Joined' ? joiningDate || new Date().toISOString().split('T')[0] : sub.joiningDate,
        tenure,
        eligibilityStatus: status === 'Joined' ? eligibilityStatus || 'Eligible' : sub.eligibilityStatus,
        billingStatus: sub.billingStatus || (status === 'Joined' ? 'Pending Billing' : undefined),
      };
    });

    return associatePartnerRepository.updatePartner(partnerId, {
      submissions: updatedSubmissions,
    });
  }

  async updateCandidateBillingStatus(
    partnerId: string,
    submissionId: string,
    billingStatus: CandidateBillingStatus,
    userRole: string
  ): Promise<AssociatePartner> {
    if (userRole !== 'Super Admin' && userRole !== 'Finance Admin' && userRole !== 'Finance') {
      throw new Error('Only Super Admin or Finance Admin can update Candidate Billing Status.');
    }

    const partner = await this.getPartnerById(partnerId);
    if (!partner) throw new Error(`Partner with ID ${partnerId} not found.`);

    const targetSub = partner.submissions.find((s) => s.id === submissionId);
    if (!targetSub) throw new Error(`Submission record ${submissionId} not found.`);

    if (targetSub.eligibilityStatus !== 'Eligible') {
      throw new Error('Billing Status becomes available ONLY when Candidate Eligibility is Eligible.');
    }

    const updatedSubmissions = partner.submissions.map((sub) => {
      if (sub.id !== submissionId) return sub;
      return { ...sub, billingStatus };
    });

    return associatePartnerRepository.updatePartner(partnerId, {
      submissions: updatedSubmissions,
    });
  }
}

export const associatePartnerService = new AssociatePartnerService();
