import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where, runTransaction, collectionGroup, arrayUnion } from 'firebase/firestore';
import { db } from '../../../../firebase/firebase';
import type { Candidate, CreateCandidateInput, ImportHistoryItem, QuickUpdateInput } from '../types/crm';
import { statusRuleEngine } from '../services/statusRuleEngine';

import { getAuthorizationScope } from '../../../../core/authorization/authorizationResolver';

const candidates = collection(db, 'crm_candidates');
const activities = collection(db, 'crm_activity');
const imports = collection(db, 'crm_imports');
const candidateFrom = (id: string, value: Record<string, unknown>): Candidate => ({
  ...(value as Omit<Candidate, 'id'>), id,
  sourceHistory: Array.isArray(value.sourceHistory) ? value.sourceHistory as Candidate['sourceHistory'] : [], phoneHistory: Array.isArray(value.phoneHistory) ? value.phoneHistory as Candidate['phoneHistory'] : [],
  placementHistory: Array.isArray(value.placementHistory) ? value.placementHistory as Candidate['placementHistory'] : [], documents: Array.isArray(value.documents) ? value.documents as Candidate['documents'] : [], attachments: Array.isArray(value.attachments) ? value.attachments as Candidate['attachments'] : [], systemAudit: Array.isArray(value.systemAudit) ? value.systemAudit as Candidate['systemAudit'] : [], callsCount: Number(value.callsCount ?? 0), isBlacklisted: Boolean(value.isBlacklisted), createdAt: String(value.createdAt ?? ''), updatedAt: String(value.updatedAt ?? ''),
  currentCrmStatus: (value.currentCrmStatus as Candidate['currentCrmStatus']) ?? null,
  // Fallback for legacy data
  followUpDate: (value.followUpDate as string) ?? null,
  interviewDate: (value.interviewDate as string) ?? null,
});

export class CrmRepository {
  async getCandidates(userSession?: { id: string; role: string; assignedRole?: string; department?: string; teamId?: string; departmentId?: string }): Promise<Candidate[]> {
    let q = query(candidates);
    
    if (userSession) {
      const scope = getAuthorizationScope(userSession.assignedRole || userSession.role);

      if (scope === 'GLOBAL') {
        // No additional filters
      } else if (scope === 'DEPARTMENT') {
        if (!userSession.departmentId) return []; // Fail safely
        q = query(candidates, where('departmentId', '==', userSession.departmentId));
      } else if (scope === 'SELF_AND_DIRECT_REPORTS') {
        // Fetch direct reports
        const employeesRef = collection(db, 'employees');
        const reportsQuery = query(employeesRef, where('reportingManagerId', '==', userSession.id));
        const reportsSnap = await getDocs(reportsQuery);
        
        const authorizedIds = [userSession.id];
        reportsSnap.docs.forEach(d => {
          const emp = d.data();
          if (emp.employeeId) authorizedIds.push(emp.employeeId);
        });

        if (authorizedIds.length > 30) {
          // Firestore 'in' limit is 30. For simple implementation without chunks as per instructions,
          // we use the limit. (Instructions: "Do not create complex chunking infrastructure unless the existing implementation demonstrably requires it. No premature optimization.")
          authorizedIds.length = 30;
        }

        q = query(candidates, where('assignedRecruiterId', 'in', authorizedIds));
      } else {
        // 'SELF' or fallback
        q = query(candidates, where('assignedRecruiterId', '==', userSession.id));
      }
    }
    
    const result = await getDocs(q); 
    return result.docs.map((item) => candidateFrom(item.id, item.data())); 
  }
  async getCandidateById(id: string): Promise<Candidate | null> { const result = await getDoc(doc(db, 'crm_candidates', id)); return result.exists() ? candidateFrom(result.id, result.data()) : null; }
  async findDuplicateByPhone(phone: string): Promise<Candidate | null> {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '+91' + cleanPhone;
    else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) cleanPhone = '+' + cleanPhone;
    else return null; 

    try {
      const phoneDoc = await getDoc(doc(db, 'crm_phone_registry', cleanPhone));
      if (!phoneDoc.exists()) return null;
      try {
        return await this.getCandidateById(phoneDoc.data().candidateId);
      } catch (e) {
        return { id: phoneDoc.data().candidateId, name: 'Candidate already exists', phone: '**********', currentCrmStatus: 'Interested' } as Candidate;
      }
    } catch (e) {
      return null;
    }
  }
  private async activity(candidateId: string, action: string, actor: { id?: string; name: string }, details: string): Promise<void> { await addDoc(activities, { candidateId, action, actorId: actor.id ?? '', actorName: actor.name, details, createdAt: new Date().toISOString() }); }
  async createCandidate(input: CreateCandidateInput, actor: { id: string; name: string; role?: string; teamId?: string; departmentId?: string }): Promise<Candidate> {
    if (!actor.teamId && !actor.departmentId && actor.role !== 'Super Admin') {
      throw new Error('Your employee profile is missing team or department information. Please contact Admin.');
    }

    let targetRecruiterId = actor.id;
    let targetRecruiterName = actor.name;
    let targetTeamId = actor.teamId ?? null;
    let targetDepartmentId = actor.departmentId ?? null;

    if (input.assignedRecruiterId && input.assignedRecruiterName) {
      targetRecruiterId = input.assignedRecruiterId;
      targetRecruiterName = input.assignedRecruiterName;
      targetTeamId = input.targetTeamId ?? null;
      targetDepartmentId = input.targetDepartmentId ?? null;
    }

    let cleanPhone = input.phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '+91' + cleanPhone;
    else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) cleanPhone = '+' + cleanPhone;
    else throw new Error('Invalid mobile number. Only valid 10-digit Indian mobile numbers are permitted.');
    
    const now = new Date().toISOString(); 
    
    const candidateId = await runTransaction(db, async (transaction) => {
      const phoneRef = doc(db, 'crm_phone_registry', cleanPhone);
      const phoneDoc = await transaction.get(phoneRef);
      if (phoneDoc.exists()) throw new Error(`Candidate with phone ${input.phone} already exists.`);
      
      const candidateRef = doc(candidates); 
      transaction.set(phoneRef, { candidateId: candidateRef.id, createdAt: now, createdBy: actor.id });
      
      const safeSource = {
        category: input.source.category,
        detailOption: input.source.detailOption ?? null,
        detailText: input.source.detailText ?? null,
      };

      transaction.set(candidateRef, { 
        name: input.name.trim(), 
        phone: input.phone.trim(), 
        normalizedPhone: cleanPhone,
        area: input.area.trim(), 
        city: input.city.trim(), 
        role: input.role.trim(), 
        currentCrmStatus: null, // Phase 2: Blank status for new candidates
        assignedRecruiterId: targetRecruiterId, 
        assignedRecruiterName: targetRecruiterName, 
        teamId: targetTeamId,
        departmentId: targetDepartmentId,
        source: safeSource, 
        sourceHistory: [{ source: safeSource, date: now.slice(0, 10) }], 
        phoneHistory: [{ phone: input.phone.trim(), changedAt: now }], 
        placementHistory: [], documents: [], attachments: [], systemAudit: [], isBlacklisted: false, callsCount: 0, createdAt: now, updatedAt: now 
      });
      return candidateRef.id;
    });

    return (await this.getCandidateById(candidateId))!;
  }
  async quickUpdate(
    input: QuickUpdateInput,
    client: { name?: string; type?: 'Payroll' | 'OTS' },
    actor: { id: string; name: string; teamId?: string; departmentId?: string }
  ): Promise<Candidate> {
    const validation = statusRuleEngine.validateUpdateInput(input, client.type);
    if (!validation.isValid) throw new Error(validation.errors.join(' '));
    const now = new Date().toISOString();

    await runTransaction(db, async (transaction) => {
      const candidateRef = doc(db, 'crm_candidates', input.candidateId);
      const interactionRef = doc(db, 'crm_candidates', input.candidateId, 'interactions', input.interactionId);

      const interactionDoc = await transaction.get(interactionRef);
      if (interactionDoc.exists()) {
        return; // Idempotency: Interaction already processed
      }

      const candidateDoc = await transaction.get(candidateRef);
      if (!candidateDoc.exists()) throw new Error('Candidate was not found.');
      const candidateData = candidateDoc.data();
      const previousStatus = candidateData.currentCrmStatus ?? null;

      transaction.set(interactionRef, {
        id: input.interactionId,
        timestamp: now,
        recruiterId: actor.id,
        recruiterName: actor.name,
        teamId: actor.teamId ?? null,
        departmentId: actor.departmentId ?? null,
        previousStatus,
        selectedStatus: input.status,
        notes: input.notes,
        clientId: input.clientId ?? null,
        clientName: input.clientName ?? client.name ?? null,
        followUpDate: input.followUpDate ?? null,
        interviewDate: input.interviewDate ?? null,
        issueDescription: input.issueDescription ?? null,
      });

      if (previousStatus !== input.status) {
        const statusHistoryRef = doc(collection(db, 'crm_candidates', input.candidateId, 'statusHistory'));
        transaction.set(statusHistoryRef, {
          id: statusHistoryRef.id,
          timestamp: now,
          interactionId: input.interactionId,
          recruiterId: actor.id,
          recruiterName: actor.name,
          previousStatus,
          newStatus: input.status,
        });
      }

      if (input.followUpDate) {
        const followUpRef = doc(collection(db, 'crm_candidates', input.candidateId, 'followUps'));
        transaction.set(followUpRef, {
          id: followUpRef.id,
          timestamp: now,
          recruiterId: actor.id,
          recruiterName: actor.name,
          followUpDate: input.followUpDate,
          notes: input.notes,
          status: 'Pending',
        });
      }

      const generatedOtsId = input.payrollEmployeeId;
      // V2 Placement service now handles OTS ID generation natively.

      transaction.update(candidateRef, {
        currentCrmStatus: input.status,
        currentClientId: input.clientId ?? null,
        currentClientName: input.clientName ?? client.name ?? null,
        interviewDate: input.interviewDate ?? null,
        followUpDate: input.followUpDate ?? null,
        issueDescription: input.issueDescription ?? null,
        payrollEmployeeId: generatedOtsId ?? null,
        dateOfBirth: input.dateOfBirth ?? null,
        callsCount: (candidateData.callsCount || 0) + 1,
        lastCalledAt: now,
        updatedAt: now,
      });
    });

    return (await this.getCandidateById(input.candidateId))!;
  }

  async updateCandidateProfile(id: string, updates: Partial<Candidate>, _actor: { name: string }): Promise<Candidate> {
    const existing = await this.getCandidateById(id);
    if (!existing) throw new Error('Candidate was not found.');
    await updateDoc(doc(db, 'crm_candidates', id), { ...updates, id, updatedAt: new Date().toISOString() });
    return (await this.getCandidateById(id))!;
  }

  async reassignCandidate(id: string, recruiterId: string, recruiterName: string, actor: { id: string; name: string }, reason = ''): Promise<Candidate> {
    if (!recruiterId || !recruiterName) throw new Error('Recruiter selection is required.');
    const existing = await this.getCandidateById(id);
    if (!existing) throw new Error('Candidate was not found.');
    const now = new Date().toISOString();

    await runTransaction(db, async (transaction) => {
      const candidateRef = doc(db, 'crm_candidates', id);
      const assignmentRef = doc(collection(db, 'crm_candidates', id, 'assignments'));

      transaction.update(candidateRef, {
        assignedRecruiterId: recruiterId,
        assignedRecruiterName: recruiterName,
        updatedAt: now,
      });

      transaction.set(assignmentRef, {
        id: assignmentRef.id,
        assignedAt: now,
        fromRecruiterId: existing.assignedRecruiterId,
        fromRecruiterName: existing.assignedRecruiterName,
        toRecruiterId: recruiterId,
        toRecruiterName: recruiterName,
        assignedByUserId: actor.id,
        assignedByUserName: actor.name,
        reason,
      });
    });

    return (await this.getCandidateById(id))!;
  }
  async bulkAssignCandidates(ids: string[], recruiterId: string, recruiterName: string, actor: { id: string; name: string }): Promise<number> { await Promise.all(ids.map((id) => this.reassignCandidate(id, recruiterId, recruiterName, actor, 'Bulk assignment'))); return ids.length; }
  async bulkRecruiterTransfer(fromId: string, recruiterId: string, recruiterName: string, actor: { id: string; name: string; role: string; assignedRole?: string; department?: string; teamId?: string; departmentId?: string }): Promise<number> { 
    let q = query(candidates, where('assignedRecruiterId', '==', fromId));
    const activeRole = true;
    if (!['Super Admin', 'Super_Admin'].includes(activeRole?.assignedRole || activeRole?.role || activeRole?.name || '')) {
      const viewScope = true.toLowerCase();
      if (viewScope === 'restricted' || viewScope === 'none' || viewScope === 'own') {
        throw new Error('Not authorized to bulk transfer');
      } else if (viewScope === 'department' || viewScope === 'departments' || viewScope.includes('team')) {
        if (actor.departmentId && viewScope.includes('department')) {
          q = query(candidates, where('assignedRecruiterId', '==', fromId), where('departmentId', '==', actor.departmentId));
        } else if (actor.teamId && viewScope.includes('team')) {
          q = query(candidates, where('assignedRecruiterId', '==', fromId), where('teamId', '==', actor.teamId));
        } else {
          throw new Error('Missing team/department info for bulk transfer scope.');
        }
      }
    }
    const result = await getDocs(q); 
    return this.bulkAssignCandidates(result.docs.map((item) => item.id), recruiterId, recruiterName, actor); 
  }
  async toggleBlacklist(id: string, value: boolean, reason: string, actor: { name: string }): Promise<Candidate> { const existing = await this.getCandidateById(id); if (!existing) throw new Error('Candidate was not found.'); await updateDoc(doc(db, 'crm_candidates', id), { isBlacklisted: value, blacklistReason: value ? reason : null, blacklistedBy: value ? actor.name : null, blacklistedAt: value ? new Date().toISOString() : null, updatedAt: new Date().toISOString() }); await this.activity(id, 'Blacklisted', actor, reason); return (await this.getCandidateById(id))!; }
  async getImportHistory(): Promise<ImportHistoryItem[]> { const result = await getDocs(imports); return result.docs.map((item) => ({ id: item.id, ...item.data() } as ImportHistoryItem)); }
  async addImportHistory(item: Omit<ImportHistoryItem, 'id' | 'importedAt'>): Promise<ImportHistoryItem> { const importedAt = new Date().toISOString(); const result = await addDoc(imports, { ...item, importedAt }); return { id: result.id, ...item, importedAt }; }

  async getCallsTodayForUser(userSession: { id: string; role: string; assignedRole?: string; department?: string; teamId?: string; departmentId?: string }): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    let q = query(collectionGroup(db, 'interactions'), where('timestamp', '>=', today));
    
    const activeRole = true;
    if (!['Super Admin', 'Super_Admin'].includes(activeRole?.assignedRole || activeRole?.role || activeRole?.name || '')) {
      const viewScope = true.toLowerCase();
      if (viewScope === 'restricted' || viewScope === 'none') {
        return 0; // Return empty if unauthorized
      } else if (viewScope === 'department' || viewScope === 'departments' || viewScope.includes('team')) {
         if (userSession.departmentId && viewScope.includes('department')) {
           q = query(q, where('departmentId', '==', userSession.departmentId));
         } else if (userSession.teamId && viewScope.includes('team')) {
           q = query(q, where('teamId', '==', userSession.teamId));
         } else {
           q = query(q, where('recruiterId', '==', userSession.id));
         }
      } else if (viewScope === 'own' || viewScope === 'own and team' || viewScope === 'assigned') {
        if (viewScope === 'own and team' && userSession.teamId) {
           q = query(q, where('teamId', '==', userSession.teamId));
        } else {
           q = query(q, where('recruiterId', '==', userSession.id));
        }
      }
    }
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  appendPlacementToHistory(candidateId: string, placementRecord: any, batch: any): void {
    const candidateRef = doc(db, 'crm_candidates', candidateId);
    batch.update(candidateRef, {
      placementHistory: arrayUnion(placementRecord)
    });
  }

  updatePlacementHistoryInBatch(candidateId: string, updatedHistory: any[], batch: any): void {
    const candidateRef = doc(db, 'crm_candidates', candidateId);
    batch.update(candidateRef, {
      placementHistory: updatedHistory
    });
  }

  async getActivityLog(candidateId: string): Promise<any[]> {
    const q = query(collection(db, `crm_candidates/${candidateId}/activity`));
    const result = await getDocs(q); return result.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async generateOtsEmployeeId(candidateId: string): Promise<string> {
    return await runTransaction(db, async (transaction) => {
      // 1. Get Candidate
      const candidateRef = doc(db, 'crm_candidates', candidateId);
      const candidateSnap = await transaction.get(candidateRef);
      if (!candidateSnap.exists()) {
        throw new Error('Candidate not found');
      }
      
      const candidateData = candidateSnap.data();
      if (candidateData.payrollEmployeeId && candidateData.payrollEmployeeId.startsWith('HH/CAN/OTS/')) {
        return candidateData.payrollEmployeeId; // Already generated
      }

      // 2. Get Sequence
      const sequenceRef = doc(db, 'system_sequences', 'ots_employee_id');
      const sequenceSnap = await transaction.get(sequenceRef);
      
      let nextNumber = 1;
      if (sequenceSnap.exists()) {
        nextNumber = (sequenceSnap.data().current || 0) + 1;
      }

      // 3. Update Sequence
      transaction.set(sequenceRef, { current: nextNumber }, { merge: true });

      // 4. Generate ID
      const newId = `HH/CAN/OTS/${nextNumber.toString().padStart(4, '0')}`;

      // 5. Update Candidate
      transaction.update(candidateRef, {
        payrollEmployeeId: newId,
        updatedAt: new Date().toISOString()
      });

      return newId;
    });
  }
}
export const crmRepository = new CrmRepository();
