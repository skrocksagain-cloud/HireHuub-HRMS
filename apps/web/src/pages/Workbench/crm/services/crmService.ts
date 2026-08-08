import type { Candidate, CandidateStatus, DuplicateCheckResult } from '../types/crm';
import { crmRepository } from '../repositories/crmRepository';

export interface CrmFilterState {
  searchQuery: string;
  quickFilter: 'All' | 'Assigned' | 'Today\'s Follow Up' | 'Today\'s Interview' | 'Interested' | 'Call Back Later' | 'Active' | 'Overdue';
  status?: CandidateStatus | 'All';
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
      // 1. Role-based Visibility Filter
      if (currentUser.role === 'Recruiter') {
        if (c.assignedRecruiterId !== currentUser.id) return false;
      } else if (currentUser.role === 'Team Leader') {
        if (c.assignedRecruiterId !== currentUser.id && c.teamId !== currentUser.teamId) return false;
      } else if (['HR', 'Finance', 'Marketing'].includes(currentUser.role)) {
        return false; // Zero CRM access
      }

      // 2. Global Search (Name & Phone number)
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const q = filters.searchQuery.trim().toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesPhone = c.phone.includes(q);
        const matchesRole = c.role.toLowerCase().includes(q);
        const matchesCity = c.city.toLowerCase().includes(q);
        const matchesArea = c.area.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesRole && !matchesCity && !matchesArea) return false;
      }

      // 3. Quick Filters
      if (filters.quickFilter === 'Assigned') {
        if (c.assignedRecruiterId !== currentUser.id) return false;
      } else if (filters.quickFilter === 'Today\'s Follow Up') {
        if (c.followUpDate !== today) return false;
      } else if (filters.quickFilter === 'Today\'s Interview') {
        if (c.interviewDate !== today || c.status !== 'Line Up') return false;
      } else if (filters.quickFilter === 'Interested') {
        if (c.status !== 'Interested') return false;
      } else if (filters.quickFilter === 'Call Back Later') {
        if (c.status !== 'Call Back Later') return false;
      } else if (filters.quickFilter === 'Active') {
        if (c.status !== 'Active') return false;
      } else if (filters.quickFilter === 'Overdue') {
        if (!c.followUpDate || c.followUpDate >= today || c.status === 'Active' || c.status === 'Inactive') return false;
      }

      // 4. Advanced Filters
      if (filters.status && filters.status !== 'All' && c.status !== filters.status) return false;
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
    currentUser: { id: string; role: string; teamId?: string }
  ): KpiSummary {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.slice(0, 7); // YYYY-MM

    // Filter accessible candidates first
    const accessible = candidates.filter((c) => {
      if (currentUser.role === 'Recruiter') return c.assignedRecruiterId === currentUser.id;
      if (currentUser.role === 'Team Leader') return c.assignedRecruiterId === currentUser.id || c.teamId === currentUser.teamId;
      return true;
    });

    const isTLOrAbove = ['Team Leader', 'Manager', 'Admin', 'Staffing', 'Super Admin'].includes(currentUser.role);

    let assignedCandidates = 0;
    let todaysFollowUp = 0;
    let todaysLineUp = 0;
    let callsToday = 0;
    let interested = 0;
    let activeThisMonth = 0;
    let callBackLater = 0;
    let overdueFollowUp = 0;
    let waitingForUpdate = 0;

    for (const c of accessible) {
      if (c.assignedRecruiterId === currentUser.id) assignedCandidates++;

      if (c.followUpDate === today && c.status !== 'Active') todaysFollowUp++;
      if (c.interviewDate === today && c.status === 'Line Up') todaysLineUp++;

      // Calls today from timeline
      const callsForToday = c.interactionTimeline.filter((t) => t.createdAt.startsWith(today)).length;
      callsToday += callsForToday;

      if (c.status === 'Interested') interested++;
      if (c.status === 'Active' && c.activeDate && c.activeDate.startsWith(currentMonth)) activeThisMonth++;
      if (c.status === 'Call Back Later') callBackLater++;

      if (c.followUpDate && c.followUpDate < today && c.status !== 'Active' && c.status !== 'Inactive') {
        overdueFollowUp++;
      }

      // Waiting for update: No interaction in last 3 days for non-active candidates
      const lastUpdateDate = c.updatedAt.split('T')[0];
      if (lastUpdateDate < today && c.status !== 'Active' && c.status !== 'Inactive') {
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
      waitingForUpdate: isTLOrAbove ? waitingForUpdate : undefined,
    };
  }

  /**
   * Sort candidates for Today's Work Queue (Priority: Overdue -> Today's Follow Up -> Today's Interview -> New Assignment)
   */
  getTodaysWorkQueue(
    candidates: Candidate[],
    currentUser: { id: string; role: string; teamId?: string }
  ): Candidate[] {
    const today = new Date().toISOString().split('T')[0];

    const userCandidates = candidates.filter((c) => {
      if (currentUser.role === 'Recruiter') return c.assignedRecruiterId === currentUser.id;
      if (currentUser.role === 'Team Leader') return c.assignedRecruiterId === currentUser.id || c.teamId === currentUser.teamId;
      return true;
    });

    const overdue = userCandidates.filter(
      (c) => c.followUpDate && c.followUpDate < today && c.status !== 'Active' && c.status !== 'Inactive'
    );
    const followUpToday = userCandidates.filter((c) => c.followUpDate === today && c.status !== 'Active');
    const interviewToday = userCandidates.filter((c) => c.interviewDate === today && c.status === 'Line Up');
    const newAssignments = userCandidates.filter((c) => c.interactionTimeline.length <= 1 && c.status === 'Interested');

    // Combine avoiding duplicates
    const set = new Set<string>();
    const queue: Candidate[] = [];

    for (const list of [overdue, followUpToday, interviewToday, newAssignments]) {
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
  async checkDuplicatePhone(phone: string, userRole: string): Promise<DuplicateCheckResult> {
    const candidate = await crmRepository.findDuplicateByPhone(phone);
    if (!candidate) {
      return { isDuplicate: false, isRestrictedView: false };
    }

    const isRestricted = userRole === 'Recruiter';
    return {
      isDuplicate: true,
      existingCandidate: isRestricted
        ? {
            // Masked candidate details for Recruiter
            id: candidate.id,
            name: 'Candidate already exists',
            phone: '**********',
            area: '***',
            city: '***',
            role: '***',
            status: 'Interested',
            assignedRecruiterId: '***',
            assignedRecruiterName: '***',
            source: candidate.source,
            sourceHistory: [],
            phoneHistory: [],
            placementHistory: [],
            interactionTimeline: [],
            assignmentHistory: [],
            followUps: [],
            documents: [],
            attachments: [],
            systemAudit: [],
            isBlacklisted: false,
            callsCount: 0,
            createdAt: candidate.createdAt,
            updatedAt: candidate.updatedAt,
          }
        : candidate,
      isRestrictedView: isRestricted,
    };
  }
}

export const crmService = new CrmService();
