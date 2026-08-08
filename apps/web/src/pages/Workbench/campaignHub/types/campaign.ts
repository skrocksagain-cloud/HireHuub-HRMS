export type CampaignStatus = 'Draft' | 'Running' | 'Completed' | 'Cancelled' | 'Archived';
export type CampaignType = 'Online' | 'Offline';

export type CampaignSource =
  | 'Facebook'
  | 'Instagram'
  | 'WorkIndia'
  | 'Apna'
  | 'Indeed'
  | 'Referral'
  | 'Website'
  | 'Walk-in'
  | 'Advertisement'
  | 'Poster'
  | 'Pamphlet'
  | 'Job Fair'
  | 'College Drive'
  | 'Other';

export type OfflineMaterialType =
  | 'Poster'
  | 'Pamphlet'
  | 'Banner'
  | 'Advertisement'
  | 'Hoarding'
  | 'College Drive'
  | 'Job Fair'
  | 'Newspaper';

export interface CampaignLocation {
  state: string;
  city: string;
  areas: string[];
  leads?: number;
  joined?: number;
  active?: number;
  conversionRate?: number;
}

export interface CampaignSourceAnalytics {
  source: CampaignSource;
  leads: number;
  joined: number;
  active: number;
  conversionRate: number;
}

export type FunnelStage = 'Lead' | 'Interested' | 'Interview' | 'Selected' | 'Joined' | 'Active' | 'Retained';

export interface CampaignStagePerformance {
  stage: FunnelStage;
  count: number;
  percentage: number;
}

export interface CampaignAuditHistory {
  createdBy: string;
  createdDate: string;
  updatedBy?: string;
  updatedDate?: string;
  archivedBy?: string;
  archivedDate?: string;
}

export interface OfflineDetails {
  materialType: OfflineMaterialType;
  vendor?: string;
  quantity?: number;
}

export interface OnlineDetails {
  platform: string;
  campaignUrl?: string;
}

export interface CampaignMaster {
  id: string; // Document ID / Campaign Number e.g. HHCMP000001
  campaignNumber: string; // HHCMP000001
  campaignName: string;
  campaignType: CampaignType;
  campaignSource: CampaignSource;
  owner: string;
  description?: string;
  startDate: string;
  endDate: string;
  
  // Planned vs Actual
  plannedBudget: number;
  actualSpend: number;
  expectedLeads: number;
  actualLeads: number;
  expectedJoins: number;
  actualJoins: number;
  
  // Dynamic Derived Metrics
  activeCandidatesCount: number;
  retainedCandidatesCount: number; // ORBIT extension point
  conversionRate: number; // percentage
  costPerLead: number;
  costPerJoin: number;

  // Offline / Online conditional
  offlineDetails?: OfflineDetails;
  onlineDetails?: OnlineDetails;

  // Location Master references
  locations: CampaignLocation[];
  primaryState: string;
  primaryCity: string;
  primaryArea: string;

  // Marketing Notes & Outcome
  marketingNotes?: string;
  campaignOutcome?: string;

  // Document Center references only
  documentIds: string[];

  // Analytics breakdown arrays
  sourceAnalytics: CampaignSourceAnalytics[];
  stagePerformances: CampaignStagePerformance[];

  // Lifecycle & Status
  status: CampaignStatus;
  
  // Audit History
  auditHistory: CampaignAuditHistory;
}

export interface CreateCampaignInput {
  campaignName: string;
  campaignType: CampaignType;
  campaignSource: CampaignSource;
  owner: string;
  description?: string;
  startDate: string;
  endDate: string;
  plannedBudget: number;
  expectedLeads: number;
  expectedJoins: number;
  primaryState: string;
  primaryCity: string;
  areas: string[];
  platform?: string;
  campaignUrl?: string;
  materialType?: OfflineMaterialType;
  vendor?: string;
  quantity?: number;
}
