import { useState, useEffect, useCallback, useMemo } from 'react';
import { crmRepository } from '../../crm/repositories/crmRepository';
import type { Candidate } from '../../crm/types/crm';
import type { CampaignMaster } from '../types/campaign';
import { useAuth } from '../../../../context/AuthContext';

export interface JobPortalMetrics {
  portalName: string;
  totalLeads: number;
  activeCandidates: number;
  conversionRatio: number;
}

export function useCampaignAnalytics(campaigns: CampaignMaster[]) {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [selectedPortal, setSelectedPortal] = useState<string>('ALL');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('ALL');
  const [selectedRecruiter, setSelectedRecruiter] = useState<string>('ALL');

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const sessionUser = user ? {
        id: (user as any).employeeId || 'HH0000',
        name: user.name || 'Admin',
        role: (user as any).role || 'Super Admin',
        teamId: (user as any).teamId,
        departmentId: (user as any).department
      } : undefined;

      const data = await crmRepository.getCandidates(sessionUser);
      setCandidates(data);
    } catch (err) {
      console.error('Failed to fetch candidates for analytics', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const normalizePortalName = (name?: string) => {
    if (!name) return 'Others';
    const lower = name.toLowerCase().trim();
    if (lower.includes('naukri')) return 'Naukri';
    if (lower.includes('indeed')) return 'Indeed';
    if (lower.includes('apna')) return 'Apna';
    if (lower.includes('workindia')) return 'WorkIndia';
    if (lower.includes('foundit')) return 'Foundit';
    if (lower.includes('linkedin')) return 'LinkedIn';
    // capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      // Basic check for job portal
      if (c.source?.category !== 'Job Portal') return false;

      // Date Range Filter
      if (dateRange.start && c.createdAt < dateRange.start) return false;
      // if dateRange.end is something like '2023-12-31', we append 'T23:59:59' for proper comparison
      if (dateRange.end && c.createdAt > dateRange.end + 'T23:59:59') return false;

      // Recruiter Filter
      if (selectedRecruiter !== 'ALL' && c.assignedRecruiterName !== selectedRecruiter) return false;

      // Portal Filter
      const portal = normalizePortalName(c.source?.detailOption || c.source?.detailText);
      if (selectedPortal !== 'ALL' && portal !== selectedPortal) return false;

      // Campaign Filter
      // Usually source.detailText contains Campaign Name. If strict matching is needed:
      if (selectedCampaign !== 'ALL' && c.source?.detailText !== selectedCampaign) return false;

      return true;
    });
  }, [candidates, dateRange, selectedRecruiter, selectedPortal, selectedCampaign]);

  const jobPortalMetrics = useMemo(() => {
    const metricsMap = new Map<string, JobPortalMetrics>();

    filteredCandidates.forEach(c => {
      const portal = normalizePortalName(c.source?.detailOption || c.source?.detailText);
      if (!metricsMap.has(portal)) {
        metricsMap.set(portal, { portalName: portal, totalLeads: 0, activeCandidates: 0, conversionRatio: 0 });
      }
      const metric = metricsMap.get(portal)!;
      metric.totalLeads += 1;
      if (c.currentCrmStatus === 'Active') {
        metric.activeCandidates += 1;
      }
    });

    const metricsArray = Array.from(metricsMap.values());
    metricsArray.forEach(m => {
      m.conversionRatio = m.totalLeads > 0 ? (m.activeCandidates / m.totalLeads) * 100 : 0;
    });

    return metricsArray.sort((a, b) => b.totalLeads - a.totalLeads);
  }, [filteredCandidates]);

  // KPIs
  const kpiData = useMemo(() => {
    const totalLeads = jobPortalMetrics.reduce((acc, curr) => acc + curr.totalLeads, 0);
    const activeCandidates = jobPortalMetrics.reduce((acc, curr) => acc + curr.activeCandidates, 0);
    const overallConversion = totalLeads > 0 ? (activeCandidates / totalLeads) * 100 : 0;
    
    const validPortals = jobPortalMetrics.filter(m => m.totalLeads >= 5); // threshold for "best" maybe? or just any?
    const bestPortalObj = (validPortals.length > 0 ? validPortals : jobPortalMetrics).reduce((best, curr) => {
      return curr.conversionRatio > (best?.conversionRatio || 0) ? curr : best;
    }, null as JobPortalMetrics | null);
    
    const bestPortal = bestPortalObj ? bestPortalObj.portalName : 'N/A';

    // To get cost, we need campaigns filtered by the same criteria maybe?
    // Cost/Lead = total spend / total leads
    // Cost/Active = total spend / active candidates
    const totalSpend = campaigns.reduce((acc, c) => acc + (c.actualSpend || 0), 0);
    const costPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;
    const costPerActive = activeCandidates > 0 ? totalSpend / activeCandidates : 0;

    return {
      totalLeads,
      activeCandidates,
      overallConversion,
      bestPortal,
      costPerLead,
      costPerActive
    };
  }, [jobPortalMetrics, campaigns]);

  // Unique lists for filters
  const uniquePortals = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach(c => {
      if (c.source?.category === 'Job Portal') {
        set.add(normalizePortalName(c.source?.detailOption || c.source?.detailText));
      }
    });
    return Array.from(set).sort();
  }, [candidates]);

  const uniqueRecruiters = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach(c => {
      if (c.assignedRecruiterName) set.add(c.assignedRecruiterName);
    });
    return Array.from(set).sort();
  }, [candidates]);

  const uniqueCampaigns = useMemo(() => {
    // Campaign names can come from source.detailText or existing campaigns
    const set = new Set<string>();
    campaigns.forEach(c => set.add(c.campaignName));
    return Array.from(set).sort();
  }, [campaigns]);

  return {
    jobPortalMetrics,
    kpiData,
    loadingAnalytics: loading,
    filters: {
      dateRange, setDateRange,
      selectedPortal, setSelectedPortal,
      selectedCampaign, setSelectedCampaign,
      selectedRecruiter, setSelectedRecruiter
    },
    uniquePortals,
    uniqueRecruiters,
    uniqueCampaigns
  };
}
