import { useState, useEffect, useCallback } from 'react';
import type {
  AssociatePartner,
  CreateAssociatePartnerInput,
  CandidateSubmissionStatus,
  CandidateBillingStatus,
} from '../../../../../types/AssociatePartner';
import { associatePartnerService } from '../services/associatePartnerService';

export function useAssociatePartners() {
  const [partners, setPartners] = useState<AssociatePartner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await associatePartnerService.getPartners();
      setPartners(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load Associate Partners');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const createPartner = async (input: CreateAssociatePartnerInput): Promise<AssociatePartner> => {
    const created = await associatePartnerService.createPartner(input);
    await fetchPartners();
    return created;
  };

  return { partners, loading, error, refresh: fetchPartners, createPartner };
}

export function useAssociatePartnerProfile(id?: string) {
  const [partner, setPartner] = useState<AssociatePartner | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPartner = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await associatePartnerService.getPartnerById(id);
      setPartner(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load Partner profile');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPartner();
  }, [fetchPartner]);

  const toggleStatus = async () => {
    if (!id) return;
    const updated = await associatePartnerService.togglePartnerStatus(id);
    setPartner(updated);
  };

  const updateCandidateStatus = async (
    submissionId: string,
    status: CandidateSubmissionStatus,
    rejectionReason?: string,
    joiningDate?: string
  ) => {
    if (!id) return;
    const updated = await associatePartnerService.updateCandidateStatus(
      id,
      submissionId,
      status,
      rejectionReason,
      joiningDate
    );
    setPartner(updated);
  };

  const updateCandidateBillingStatus = async (
    submissionId: string,
    billingStatus: CandidateBillingStatus,
    userRole: string
  ) => {
    if (!id) return;
    const updated = await associatePartnerService.updateCandidateBillingStatus(
      id,
      submissionId,
      billingStatus,
      userRole
    );
    setPartner(updated);
  };

  const updateReportingTo = async (
    newEmployeeId: string,
    newEmployeeName: string,
    isSuperAdmin: boolean
  ) => {
    if (!id) return;
    const updated = await associatePartnerService.updateReportingTo(
      id,
      newEmployeeId,
      newEmployeeName,
      isSuperAdmin
    );
    setPartner(updated);
  };

  return {
    partner,
    loading,
    error,
    refresh: fetchPartner,
    toggleStatus,
    updateCandidateStatus,
    updateCandidateBillingStatus,
    updateReportingTo,
  };
}
