import type {
  CampaignMaster,
  CreateCampaignInput,
  CampaignStagePerformance,
  CampaignSourceAnalytics,
  CampaignLocation,
} from '../types/campaign';
import { campaignRepository } from '../repositories/campaignRepository';
import { campaignNumberService } from '../../../../services/numbering/campaignNumberService';
import { permissionService } from '../../../../core/permissions/permissionService';
import {
  calculateCostPerLead,
  calculateCostPerJoin,
  calculateConversionRate,
} from '../utils/campaignUtils';

export class CampaignService {
  /**
   * Checks if user has permission to manage Campaign Hub.
   */
  canAccess(role: string): boolean {
    return permissionService.canManageCampaignHub(role);
  }

  /**
   * Fetches all campaigns with calculated derived analytics metrics.
   */
  async getCampaigns(): Promise<CampaignMaster[]> {
    const list = await campaignRepository.getAllCampaigns();
    return list.map((c) => this.enrichCampaignMetrics(c));
  }

  /**
   * Fetches a single campaign by ID or Campaign Number.
   */
  async getCampaignById(id: string): Promise<CampaignMaster | null> {
    const campaign = await campaignRepository.getCampaignById(id);
    if (!campaign) return null;
    return this.enrichCampaignMetrics(campaign);
  }

  /**
   * Creates a new Campaign Master record with sequence-generated ID.
   */
  async createCampaign(input: CreateCampaignInput, creatorName: string): Promise<CampaignMaster> {
    const existing = await campaignRepository.getAllCampaigns();
    const campaignNumber = await campaignNumberService.generateNextNumber(existing);

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const costPerLead = calculateCostPerLead(input.plannedBudget, input.expectedLeads);
    const costPerJoin = calculateCostPerJoin(input.plannedBudget, input.expectedJoins);
    const conversionRate = calculateConversionRate(input.expectedJoins, input.expectedLeads);

    const initialStagePerformances: CampaignStagePerformance[] = [
      { stage: 'Lead', count: input.expectedLeads, percentage: 100 },
      { stage: 'Interested', count: Math.round(input.expectedLeads * 0.7), percentage: 70 },
      { stage: 'Interview', count: Math.round(input.expectedLeads * 0.4), percentage: 40 },
      { stage: 'Selected', count: Math.round(input.expectedJoins * 1.3), percentage: 26 },
      { stage: 'Joined', count: input.expectedJoins, percentage: conversionRate },
      { stage: 'Active', count: Math.round(input.expectedJoins * 0.9), percentage: conversionRate * 0.9 },
      { stage: 'Retained', count: Math.round(input.expectedJoins * 0.8), percentage: conversionRate * 0.8 },
    ];

    const initialLocations: CampaignLocation[] = [
      {
        state: input.primaryState,
        city: input.primaryCity,
        areas: input.areas,
        leads: input.expectedLeads,
        joined: input.expectedJoins,
        active: Math.round(input.expectedJoins * 0.9),
        conversionRate,
      },
    ];

    const initialSourceAnalytics: CampaignSourceAnalytics[] = [
      {
        source: input.campaignSource,
        leads: input.expectedLeads,
        joined: input.expectedJoins,
        active: Math.round(input.expectedJoins * 0.9),
        conversionRate,
      },
    ];

    const newCampaign: CampaignMaster = {
      id: campaignNumber,
      campaignNumber,
      campaignName: input.campaignName,
      campaignType: input.campaignType,
      campaignSource: input.campaignSource,
      owner: input.owner || creatorName,
      description: input.description || '',
      startDate: input.startDate,
      endDate: input.endDate,

      plannedBudget: input.plannedBudget,
      actualSpend: input.plannedBudget, // Initial actual spend equals planned budget
      expectedLeads: input.expectedLeads,
      actualLeads: input.expectedLeads,
      expectedJoins: input.expectedJoins,
      actualJoins: input.expectedJoins,

      activeCandidatesCount: Math.round(input.expectedJoins * 0.9),
      retainedCandidatesCount: Math.round(input.expectedJoins * 0.8),
      conversionRate,
      costPerLead,
      costPerJoin,

      onlineDetails:
        input.campaignType === 'Online'
          ? {
              platform: input.platform || 'Digital Media',
              campaignUrl: input.campaignUrl || '',
            }
          : undefined,

      offlineDetails:
        input.campaignType === 'Offline'
          ? {
              materialType: input.materialType || 'Poster',
              vendor: input.vendor || '',
              quantity: input.quantity || 1000,
            }
          : undefined,

      locations: initialLocations,
      primaryState: input.primaryState,
      primaryCity: input.primaryCity,
      primaryArea: input.areas[0] || 'Central',

      marketingNotes: input.description || 'Campaign initiated.',
      campaignOutcome: 'Campaign active and acquiring candidates.',
      documentIds: [],

      sourceAnalytics: initialSourceAnalytics,
      stagePerformances: initialStagePerformances,

      status: 'Running',
      auditHistory: {
        createdBy: creatorName,
        createdDate: nowStr,
      },
    };

    await campaignRepository.createCampaign(newCampaign);
    return newCampaign;
  }

  /**
   * Archives a campaign by setting status to 'Archived'.
   */
  async archiveCampaign(id: string, actorName: string): Promise<void> {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const existing = await campaignRepository.getCampaignById(id);
    if (!existing) return;

    await campaignRepository.updateCampaign(id, {
      status: 'Archived',
      auditHistory: {
        ...existing.auditHistory,
        archivedBy: actorName,
        archivedDate: nowStr,
      },
    });
  }

  /**
   * Recalculates cost per lead, cost per join, and conversion rate dynamically.
   */
  private enrichCampaignMetrics(c: CampaignMaster): CampaignMaster {
    const costPerLead = calculateCostPerLead(c.actualSpend, c.actualLeads);
    const costPerJoin = calculateCostPerJoin(c.actualSpend, c.actualJoins);
    const conversionRate = calculateConversionRate(c.actualJoins, c.actualLeads);

    return {
      ...c,
      costPerLead,
      costPerJoin,
      conversionRate,
    };
  }
}

export const campaignService = new CampaignService();
