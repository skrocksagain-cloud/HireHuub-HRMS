import { useState, useEffect, useCallback } from 'react';
import type { CampaignMaster, CreateCampaignInput } from '../types/campaign';
import { campaignService } from '../services/campaignService';

export function useCampaigns(role: string = 'Super Admin') {
  const [campaigns, setCampaigns] = useState<CampaignMaster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const canAccess = campaignService.canAccess(role);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await campaignService.getCampaigns();
      setCampaigns(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch campaigns.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccess) {
      fetchCampaigns();
    } else {
      setLoading(false);
    }
  }, [canAccess, fetchCampaigns]);

  const createCampaign = async (input: CreateCampaignInput, creatorName: string) => {
    try {
      const created = await campaignService.createCampaign(input, creatorName);
      await fetchCampaigns();
      return created;
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create campaign.', { cause: err });
    }
  };

  const archiveCampaign = async (id: string, actorName: string) => {
    try {
      await campaignService.archiveCampaign(id, actorName);
      await fetchCampaigns();
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Failed to archive campaign.', { cause: err });
    }
  };

  return {
    campaigns,
    loading,
    error,
    canAccess,
    refreshCampaigns: fetchCampaigns,
    createCampaign,
    archiveCampaign,
  };
}

export function useCampaignProfile(campaignId?: string) {
  const [campaign, setCampaign] = useState<CampaignMaster | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!campaignId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await campaignService.getCampaignById(campaignId);
      if (!data) {
        setError('Campaign record not found.');
      } else {
        setCampaign(data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load campaign profile.');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    campaign,
    loading,
    error,
    refreshProfile: fetchProfile,
  };
}
