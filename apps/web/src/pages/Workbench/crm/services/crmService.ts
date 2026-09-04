import type { Candidate, CandidateStatus, DuplicateCheckResult } from '../types/crm';
import { crmRepository } from '../repositories/crmRepository';

export interface CrmFilterState {
  searchQuery: string;
  quickFilter: 'All' | 'Assigned' | 'Today\'s Follow Up' | 'Today\'s Interview' | 'Interested' | 'Call Back Later' | 'Active' | 'Overdue' | 'Not Contacted' | 'New Leads' | 'Calls Today';
  status?: CandidateStatus | 'All' | 'Not Contacted';
  clientId?: string;
  sourceCategory?: string;
  recruiterId?: string;
  city?: string;
  role?: string;
  followUpMonth?: string;
  interviewMonth?: string;
}

export interface KpiSummary {
  assignedCandidates: number;
  todaysFollowUp: number;
  todaysLineUp: number;
  callsToday: number;
  interested: number;
  activeThisMonth: number;
  callBackLater: number;
  overdueFollowUp: number;
  newLeads: number;
  waitingForUpdate?: number; // TL and above
}

export class CrmService {
  /**
   * Smart Free Text Role Normalizer
   * Converts to Proper Case, trims spaces, removes duplicate inner spaces, and suggests standard roles
   */
  normalizeRoleInput(input: string): { normalizedRole: string; suggestedRole?: string } {
    if (!input) return { normalizedRole: '' };

    // Trim & collapse multi-spaces
    const cleaned = input.trim().replace(/\s+/g, ' ');

    // Convert to Title Case / Proper Case
    const properCase = cleaned
      .split(' ')
      .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : ''))
      .join(' ');

    // Known standard role dictionary for spelling & auto-suggestions
    const dictionary: Record<string, string> = {
      'Superviser': 'Supervisor',
      'Delivery Boy': 'Delivery Executive',
      'Warehouse Exec': 'Warehouse Executive',
      'Warehouse Operator': 'Warehouse Executive',
      'Tech Support': 'Technical Support Associate',
      'Telecaller': 'Telecalling Executive',
      'Customer Care': 'Customer Service Representative',
      'Packer': 'Packing Associate',
      'Picker': 'Picking Associate',
    };

    const lower = properCase.toLowerCase();
    let suggestedRole: string | undefined = undefined;

    for (const [pattern, suggestion] of Object.entries(dictionary)) {
      if (pattern.toLowerCase() === lower || lower.includes(pattern.toLowerCase())) {
        suggestedRole = suggestion;
        break;
      }
    }

    return {
      normalizedRole: properCase,
      suggestedRole: suggestedRole !== properCase ? suggestedRole : undefined,
    };
  }

  /**
   * Filter candidate list based on permissions, search query, quick filters, and advanced filters
   */
  filterCandidates(
    candidates: Candidate[],
    filters: CrmFilterState,
    currentUser: { id: string; role: string; teamId?: string }
  ): Candidate[] {
    const today = new Date().toISOString().split('T')[0];

    return candidates.filter((c) => {
      // Authorization enforcement is disabled - bypass mode
      // All candidates are accessible

      // Business logic filtering follows below

      // 1. Global Search (Name & Phone number)
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const q = filters.searchQuery.trim().toLowerCase();
        const qDigits = q.replace(/\D/g, '');
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesPhone = qDigits.length > 0 && c.phone.replace(/\D/g, '').includes(qDigits);
        const matchesRole = c.role.toLowerCase().includes(q);
        const matchesCity = c.city.toLowerCase().includes(q);
        const matchesArea = c.area.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesRole && !matchesCity && !matchesArea) return false;
      }

      // 2. Quick Filters
      if (filters.quickFilter === 'Assigned') {
        if (c.assignedRecruiterId !== currentUser.id) return false;
      } else if (filters.quickFilter === 'Today\'s Follow Up') {
        if (c.followUpDate !== today) return false;
      } else if (filters.quickFilter === 'Today\'s Interview') {
        if (c.interviewDate !== today || c.currentCrmStatus !== 'Line Up') return false;
      } else if (filters.quickFilter === 'Interested') {
        if (c.currentCrmStatus !== 'Interested') return false;
      } else if (filters.quickFilter === 'Call Back Later') {
        if (c.currentCrmStatus !== 'Call Back Later') return false;
      } else if (filters.quickFilter === 'Active') {
        if (c.currentCrmStatus !== 'Active') return false;
      } else if (filters.quickFilter === 'Overdue') {
        if (!c.followUpDate || c.followUpDate >= today || c.currentCrmStatus === 'Active' || c.currentCrmStatus === 'Inactive') return false;
      } else if (filters.quickFilter === 'Not Contacted') {
        if (c.currentCrmStatus !== null) return false;
      } else if (filters.quickFilter === 'New Leads') {
        if (c.currentCrmStatus !== null || c.callsCount > 0) return false;
      } else if (filters.quickFilter === 'Calls Today') {
        if (!c.lastCalledAt || !c.lastCalledAt.startsWith(today)) return false;
      }

      // 3. Advanced Filters
      if (filters.status && filters.status !== 'All') {
         if (filters.status === 'Not Contacted') {
           if (c.currentCrmStatus !== null) return false;
         } else {
           if (c.currentCrmStatus !== filters.status) return false;
         }
      }
      if (filters.clientId && c.currentClientId !== filters.clientId) return false;
      if (filters.sourceCategory && c.source.category !== filters.sourceCategory) return false;
      if (filters.recruiterId && c.assignedRecruiterId !== filters.recruiterId) return false;
      if (filters.city && c.city.toLowerCase() !== filters.city.toLowerCase()) return false;
      if (filters.role && c.role.toLowerCase() !== filters.role.toLowerCase()) return false;

      if (filters.followUpMonth) {
        if (!c.followUpDate || !c.followUpDate.startsWith(filters.followUpMonth)) return false;
      }

      if (filters.interviewMonth) {
        if (!c.interviewDate || !c.interviewDate.startsWith(filters.interviewMonth)) return false;
      }

      return true;
    });
  }

  /**
   * Compute KPI metrics from candidate list
   */
  calculateKpiSummary(
    candidates: Candidate[],
    currentUser: { id: string; role: string; assignedRole?: string; teamId?: string },
    callsTodayMetric: number = 0
  ): KpiSummary {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.slice(0, 7); // YYYY-MM

    const accessible = candidates; // Authorization is now handled upstream in crmRepository

    // Display 'waitingForUpdate' for anyone above a basic User scope
    const isAboveUser = currentUser.assignedRole && currentUser.assignedRole !== 'User';

    let assignedCandidates = 0;
    let todaysFollowUp = 0;
    let todaysLineUp = 0;
    const callsToday = callsTodayMetric;
    let interested = 0;
    let activeThisMonth = 0;
    let callBackLater = 0;
    let overdueFollowUp = 0;
    let waitingForUpdate = 0;
    let newLeads = 0;

    for (const c of accessible) {
      if (c.assignedRecruiterId === currentUser.id) assignedCandidates++;

      if (c.followUpDate === today && c.currentCrmStatus !== 'Active') todaysFollowUp++;
      if (c.interviewDate === today && c.currentCrmStatus === 'Line Up') todaysLineUp++;
      if (c.currentCrmStatus === null && c.callsCount === 0) newLeads++;

      if (c.currentCrmStatus === 'Interested') interested++;
      if (c.currentCrmStatus === 'Active' && c.activeDate && c.activeDate.startsWith(currentMonth)) activeThisMonth++;
      if (c.currentCrmStatus === 'Call Back Later') callBackLater++;

      if (c.followUpDate && c.followUpDate < today && c.currentCrmStatus !== 'Active' && c.currentCrmStatus !== 'Inactive') {
        overdueFollowUp++;
      }

      const lastUpdateDate = c.updatedAt.split('T')[0];
      if (lastUpdateDate < today && c.currentCrmStatus !== 'Active' && c.currentCrmStatus !== 'Inactive') {
        waitingForUpdate++;
      }
    }

    return {
      assignedCandidates,
      todaysFollowUp,
      todaysLineUp,
      callsToday,
      interested,
      activeThisMonth,
      callBackLater,
      overdueFollowUp,
      newLeads,
      waitingForUpdate: isAboveUser ? waitingForUpdate : undefined,
    };
  }

  /**
   * Sort candidates for Today's Work Queue (Priority: Overdue -> Today's Follow Up -> Today's Interview -> New Lead)
   */
  getTodaysWorkQueue(
    candidates: Candidate[],
    _currentUser: { id: string; role: string; assignedRole?: string; teamId?: string }
  ): Candidate[] {
    const today = new Date().toISOString().split('T')[0];

    const userCandidates = candidates; // Authorization is now handled upstream in crmRepository

    const overdue = userCandidates.filter(
      (c) => c.followUpDate && c.followUpDate < today && c.currentCrmStatus !== 'Active' && c.currentCrmStatus !== 'Inactive'
    );
    const followUpToday = userCandidates.filter((c) => c.followUpDate === today && c.currentCrmStatus !== 'Active');
    const interviewToday = userCandidates.filter((c) => c.interviewDate === today && c.currentCrmStatus === 'Line Up');
    const newLeads = userCandidates.filter((c) => c.currentCrmStatus === null && c.callsCount === 0);

    // Combine avoiding duplicates
    const set = new Set<string>();
    const queue: Candidate[] = [];

    for (const list of [overdue, followUpToday, interviewToday, newLeads]) {
      for (const item of list) {
        if (!set.has(item.id)) {
          set.add(item.id);
          queue.push(item);
        }
      }
    }

    return queue;
  }

  /**
   * Role-masked Duplicate Phone Check
   */
  async checkDuplicatePhone(phone: string, _userSession: { id: string; role: string; assignedRole?: string; department?: string; teamId?: string; departmentId?: string }): Promise<DuplicateCheckResult> {
    const candidate = await crmRepository.findDuplicateByPhone(phone);
    if (!candidate) {
      return { isDuplicate: false, isRestrictedView: false };
    }

    // Authorization enforcement is disabled - bypass mode
    // All candidates are visible without restriction
    const isRestricted = false;

    return {
      isDuplicate: true,
      existingCandidate: candidate,
      isRestrictedView: isRestricted,
    };
  }
}

export const crmService = new CrmService();
