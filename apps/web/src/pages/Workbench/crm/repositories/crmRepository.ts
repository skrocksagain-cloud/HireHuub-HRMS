import type {
  Candidate,
  CreateCandidateInput,
  QuickUpdateInput,
  ImportHistoryItem,
  AssignmentHistoryRecord,
  InteractionTimelineRecord,
  PlacementRecord,
  SystemAuditRecord,
} from '../types/crm';
import { statusRuleEngine } from '../services/statusRuleEngine';
import { prepareWorkforceSync, preparePerformanceSync } from '../services/extensionContracts';

const SAMPLE_CANDIDATES: Candidate[] = [
  {
    id: 'HHCD0001',
    name: 'Ramesh Kumar',
    phone: '9876543210',
    area: 'Warje',
    city: 'Pune',
    role: 'Warehouse Executive',
    status: 'Active',
    assignedRecruiterId: 'user-001',
    assignedRecruiterName: 'Rahul Sharma',
    teamId: 'team-pune',
    teamName: 'Pune Staffing Team',
    source: { category: 'Job Portal', detailOption: 'Apna' },
    sourceHistory: [{ source: { category: 'Job Portal', detailOption: 'Apna' }, date: '2026-07-01' }],
    phoneHistory: [{ phone: '9876543210', changedAt: '2026-07-01T10:00:00.000Z' }],
    currentPlacement: {
      id: 'PL-001',
      clientId: 'client-001',
      clientName: 'Elastic Run',
      clientType: 'Payroll',
      openingId: 'HHOP0001',
      openingTitle: 'Warehouse Logistics Executive',
      activeDate: '2026-07-15',
      payrollEmployeeId: 'EMP-ER-9912',
      dateOfBirth: '1996-05-12',
      status: 'Active',
      createdAt: '2026-07-15T09:00:00.000Z',
    },
    placementHistory: [
      {
        id: 'PL-001',
        clientId: 'client-001',
        clientName: 'Elastic Run',
        clientType: 'Payroll',
        openingId: 'HHOP0001',
        openingTitle: 'Warehouse Logistics Executive',
        activeDate: '2026-07-15',
        payrollEmployeeId: 'EMP-ER-9912',
        dateOfBirth: '1996-05-12',
        status: 'Active',
        createdAt: '2026-07-15T09:00:00.000Z',
      },
    ],
    interactionTimeline: [
      {
        id: 'TL-001',
        candidateId: 'HHCD0001',
        recruiterId: 'user-001',
        recruiterName: 'Rahul Sharma',
        status: 'Active',
        clientId: 'client-001',
        clientName: 'Elastic Run',
        notes: 'Candidate joined Elastic Run today. Employee ID assigned.',
        createdAt: '2026-07-15T09:00:00.000Z',
      },
      {
        id: 'TL-000',
        candidateId: 'HHCD0001',
        recruiterId: 'user-001',
        recruiterName: 'Rahul Sharma',
        status: 'Line Up',
        clientId: 'client-001',
        clientName: 'Elastic Run',
        notes: 'Line up completed for Elastic Run warehouse role.',
        interviewDate: '2026-07-10',
        createdAt: '2026-07-08T11:00:00.000Z',
      },
    ],
    assignmentHistory: [
      {
        id: 'AH-001',
        candidateId: 'HHCD0001',
        fromRecruiterId: 'system',
        fromRecruiterName: 'System Import',
        toRecruiterId: 'user-001',
        toRecruiterName: 'Rahul Sharma',
        assignedByUserId: 'user-001',
        assignedByUserName: 'Rahul Sharma',
        assignedAt: '2026-07-01T10:00:00.000Z',
      },
    ],
    followUps: [],
    documents: [
      {
        id: 'DOC-001',
        documentType: 'Resume',
        fileName: 'Ramesh_Kumar_Resume.pdf',
        fileUrl: '#',
        uploadedAt: '2026-07-02T12:00:00.000Z',
        isVerified: true,
      },
      {
        id: 'DOC-002',
        documentType: 'Aadhaar Card',
        uploadedAt: '2026-07-15T10:00:00.000Z',
        isVerified: true,
        ocrPlaceholderText: 'Aadhaar OCR Integration Ready',
      },
      {
        id: 'DOC-003',
        documentType: 'Bank Details',
        accountNumber: '918237128391',
        ifscCode: 'HDFC0001234',
        uploadedAt: '2026-07-15T10:30:00.000Z',
        isVerified: true,
      },
    ],
    attachments: [],
    systemAudit: [
      {
        id: 'AUD-001',
        action: 'Created',
        performedBy: 'Rahul Sharma',
        timestamp: '2026-07-01T10:00:00.000Z',
        details: 'Candidate created via Single Drawer.',
      },
      {
        id: 'AUD-002',
        action: 'Status Changed',
        performedBy: 'Rahul Sharma',
        timestamp: '2026-07-15T09:00:00.000Z',
        details: 'Status updated to Active (Client: Elastic Run).',
      },
    ],
    payrollEmployeeId: 'EMP-ER-9912',
    dateOfBirth: '1996-05-12',
    activeDate: '2026-07-15',
    currentClientId: 'client-001',
    currentClientName: 'Elastic Run',
    isBlacklisted: false,
    callsCount: 4,
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-15T09:00:00.000Z',
  },
  {
    id: 'HHCD0002',
    name: 'Priya Sharma',
    phone: '9812345678',
    area: 'Peenya',
    city: 'Bengaluru',
    role: 'Delivery Supervisor',
    status: 'Line Up',
    assignedRecruiterId: 'user-002',
    assignedRecruiterName: 'Anita Roy',
    teamId: 'team-pune',
    teamName: 'Pune Staffing Team',
    source: { category: 'Reference', detailText: 'Vikram Singh' },
    sourceHistory: [{ source: { category: 'Reference', detailText: 'Vikram Singh' }, date: '2026-08-01' }],
    phoneHistory: [{ phone: '9812345678', changedAt: '2026-08-01T09:30:00.000Z' }],
    placementHistory: [],
    interactionTimeline: [
      {
        id: 'TL-002',
        candidateId: 'HHCD0002',
        recruiterId: 'user-002',
        recruiterName: 'Anita Roy',
        status: 'Line Up',
        clientId: 'client-001',
        clientName: 'Elastic Run',
        notes: 'Scheduled interview for Peenya hub supervisor position.',
        interviewDate: '2026-08-12',
        createdAt: '2026-08-03T11:00:00.000Z',
      },
    ],
    assignmentHistory: [
      {
        id: 'AH-002',
        candidateId: 'HHCD0002',
        fromRecruiterId: 'system',
        fromRecruiterName: 'System Assignment',
        toRecruiterId: 'user-002',
        toRecruiterName: 'Anita Roy',
        assignedByUserId: 'user-002',
        assignedByUserName: 'Anita Roy',
        assignedAt: '2026-08-01T09:30:00.000Z',
      },
    ],
    followUps: [
      {
        id: 'FU-001',
        candidateId: 'HHCD0002',
        candidateName: 'Priya Sharma',
        candidatePhone: '9812345678',
        recruiterId: 'user-002',
        recruiterName: 'Anita Roy',
        followUpDate: '2026-08-05',
        notes: 'Confirm interview attendance for Peenya hub.',
        status: 'Pending',
        createdAt: '2026-08-03T11:00:00.000Z',
      },
    ],
    documents: [],
    attachments: [],
    systemAudit: [
      {
        id: 'AUD-003',
        action: 'Created',
        performedBy: 'Anita Roy',
        timestamp: '2026-08-01T09:30:00.000Z',
        details: 'Candidate created via Reference.',
      },
    ],
    interviewDate: '2026-08-12',
    currentClientId: 'client-001',
    currentClientName: 'Elastic Run',
    isBlacklisted: false,
    callsCount: 2,
    createdAt: '2026-08-01T09:30:00.000Z',
    updatedAt: '2026-08-03T11:00:00.000Z',
  },
  {
    id: 'HHCD0003',
    name: 'Amit Patel',
    phone: '9988776655',
    area: 'Baner',
    city: 'Pune',
    role: 'Technical Support Associate',
    status: 'Interested',
    assignedRecruiterId: 'user-001',
    assignedRecruiterName: 'Rahul Sharma',
    teamId: 'team-pune',
    teamName: 'Pune Staffing Team',
    source: { category: 'Social Media', detailOption: 'LinkedIn' },
    sourceHistory: [{ source: { category: 'Social Media', detailOption: 'LinkedIn' }, date: '2026-08-02' }],
    phoneHistory: [{ phone: '9988776655', changedAt: '2026-08-02T14:00:00.000Z' }],
    placementHistory: [],
    interactionTimeline: [
      {
        id: 'TL-003',
        candidateId: 'HHCD0003',
        recruiterId: 'user-001',
        recruiterName: 'Rahul Sharma',
        status: 'Interested',
        notes: 'Expressed interest in Acme Tech support role.',
        followUpDate: '2026-08-05',
        createdAt: '2026-08-04T10:00:00.000Z',
      },
    ],
    assignmentHistory: [
      {
        id: 'AH-003',
        candidateId: 'HHCD0003',
        fromRecruiterId: 'system',
        fromRecruiterName: 'Direct Candidate',
        toRecruiterId: 'user-001',
        toRecruiterName: 'Rahul Sharma',
        assignedByUserId: 'user-001',
        assignedByUserName: 'Rahul Sharma',
        assignedAt: '2026-08-02T14:00:00.000Z',
      },
    ],
    followUps: [
      {
        id: 'FU-002',
        candidateId: 'HHCD0003',
        candidateName: 'Amit Patel',
        candidatePhone: '9988776655',
        recruiterId: 'user-001',
        recruiterName: 'Rahul Sharma',
        followUpDate: '2026-08-05',
        notes: 'Send Acme Tech job description and collect certificates.',
        status: 'Pending',
        createdAt: '2026-08-04T10:00:00.000Z',
      },
    ],
    documents: [],
    attachments: [],
    systemAudit: [
      {
        id: 'AUD-004',
        action: 'Created',
        performedBy: 'Rahul Sharma',
        timestamp: '2026-08-02T14:00:00.000Z',
        details: 'Candidate created via Social Media.',
      },
    ],
    followUpDate: '2026-08-05',
    isBlacklisted: false,
    callsCount: 1,
    createdAt: '2026-08-02T14:00:00.000Z',
    updatedAt: '2026-08-04T10:00:00.000Z',
  },
  {
    id: 'HHCD0004',
    name: 'Suresh Deshmukh',
    phone: '9123456789',
    area: 'Hadapsar',
    city: 'Pune',
    role: 'Warehouse Executive',
    status: 'Call Back Later',
    assignedRecruiterId: 'user-001',
    assignedRecruiterName: 'Rahul Sharma',
    teamId: 'team-pune',
    teamName: 'Pune Staffing Team',
    source: { category: 'Job Portal', detailOption: 'WorkIndia' },
    sourceHistory: [{ source: { category: 'Job Portal', detailOption: 'WorkIndia' }, date: '2026-07-28' }],
    phoneHistory: [{ phone: '9123456789', changedAt: '2026-07-28T16:00:00.000Z' }],
    placementHistory: [],
    interactionTimeline: [
      {
        id: 'TL-004',
        candidateId: 'HHCD0004',
        recruiterId: 'user-001',
        recruiterName: 'Rahul Sharma',
        status: 'Call Back Later',
        notes: 'Candidate busy with family emergency, requested callback on 5th August.',
        followUpDate: '2026-08-05',
        createdAt: '2026-08-02T15:00:00.000Z',
      },
    ],
    assignmentHistory: [
      {
        id: 'AH-004',
        candidateId: 'HHCD0004',
        fromRecruiterId: 'system',
        fromRecruiterName: 'System Import',
        toRecruiterId: 'user-001',
        toRecruiterName: 'Rahul Sharma',
        assignedByUserId: 'user-001',
        assignedByUserName: 'Rahul Sharma',
        assignedAt: '2026-07-28T16:00:00.000Z',
      },
    ],
    followUps: [
      {
        id: 'FU-003',
        candidateId: 'HHCD0004',
        candidateName: 'Suresh Deshmukh',
        candidatePhone: '9123456789',
        recruiterId: 'user-001',
        recruiterName: 'Rahul Sharma',
        followUpDate: '2026-08-05',
        notes: 'Requested callback regarding night shift openings.',
        status: 'Pending',
        createdAt: '2026-08-02T15:00:00.000Z',
      },
    ],
    documents: [],
    attachments: [],
    systemAudit: [],
    followUpDate: '2026-08-05',
    isBlacklisted: false,
    callsCount: 3,
    createdAt: '2026-07-28T16:00:00.000Z',
    updatedAt: '2026-08-02T15:00:00.000Z',
  },
  {
    id: 'HHCD0005',
    name: 'Kavita Joshi',
    phone: '9765432109',
    area: 'Kothrud',
    city: 'Pune',
    role: 'Customer Service Representative',
    status: 'Doc / Vehicle / Vacancy Issue',
    assignedRecruiterId: 'user-002',
    assignedRecruiterName: 'Anita Roy',
    teamId: 'team-pune',
    teamName: 'Pune Staffing Team',
    source: { category: 'Enquiry' },
    sourceHistory: [{ source: { category: 'Enquiry' }, date: '2026-07-20' }],
    phoneHistory: [{ phone: '9765432109', changedAt: '2026-07-20T11:00:00.000Z' }],
    placementHistory: [],
    interactionTimeline: [
      {
        id: 'TL-005',
        candidateId: 'HHCD0005',
        recruiterId: 'user-002',
        recruiterName: 'Anita Roy',
        status: 'Doc / Vehicle / Vacancy Issue',
        notes: 'Aadhaar name spelling mismatch with graduation marksheets.',
        issueDescription: 'Aadhaar name correction pending at Seva Kendra.',
        createdAt: '2026-08-01T14:30:00.000Z',
      },
    ],
    assignmentHistory: [
      {
        id: 'AH-005',
        candidateId: 'HHCD0005',
        fromRecruiterId: 'system',
        fromRecruiterName: 'System Assignment',
        toRecruiterId: 'user-002',
        toRecruiterName: 'Anita Roy',
        assignedByUserId: 'user-002',
        assignedByUserName: 'Anita Roy',
        assignedAt: '2026-07-20T11:00:00.000Z',
      },
    ],
    followUps: [],
    documents: [],
    attachments: [],
    systemAudit: [],
    issueDescription: 'Aadhaar name correction pending at Seva Kendra.',
    isBlacklisted: false,
    callsCount: 2,
    createdAt: '2026-07-20T11:00:00.000Z',
    updatedAt: '2026-08-01T14:30:00.000Z',
  },
];

const SAMPLE_IMPORT_HISTORY: ImportHistoryItem[] = [
  {
    id: 'IMP-001',
    fileName: 'Pune_Warehouse_Leads_Aug.xlsx',
    importedCount: 28,
    failedCount: 2,
    importedBy: 'Rahul Sharma',
    importedAt: '2026-08-01T10:00:00.000Z',
    source: { category: 'Job Portal', detailOption: 'Apna' },
  },
  {
    id: 'IMP-002',
    fileName: 'Bengaluru_Delivery_Campaign.csv',
    importedCount: 15,
    failedCount: 0,
    importedBy: 'Sanjay Gupta',
    importedAt: '2026-08-02T11:30:00.000Z',
    source: { category: 'Advertisement', detailText: 'Bengaluru H1 Campaign' },
  },
];

export class CrmRepository {
  private candidates: Candidate[] = [...SAMPLE_CANDIDATES];
  private importHistory: ImportHistoryItem[] = [...SAMPLE_IMPORT_HISTORY];

  async getCandidates(): Promise<Candidate[]> {
    return [...this.candidates];
  }

  async getCandidateById(id: string): Promise<Candidate | null> {
    const found = this.candidates.find((c) => c.id === id);
    return found ? { ...found } : null;
  }

  async findDuplicateByPhone(phone: string): Promise<Candidate | null> {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const found = this.candidates.find((c) => c.phone.trim().replace(/\D/g, '') === cleanPhone);
    return found ? { ...found } : null;
  }

  async createCandidate(input: CreateCandidateInput, actorUser: { id: string; name: string }): Promise<Candidate> {
    const nextIdNum = this.candidates.length + 1;
    const newId = `HHCD${String(nextIdNum).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const assignedId = input.assignedRecruiterId || actorUser.id;
    const assignedName = input.assignedRecruiterName || actorUser.name;

    const newCandidate: Candidate = {
      id: newId,
      name: input.name.trim(),
      phone: input.phone.trim(),
      area: input.area.trim(),
      city: input.city.trim(),
      role: input.role.trim(),
      status: 'Interested',
      assignedRecruiterId: assignedId,
      assignedRecruiterName: assignedName,
      teamId: 'team-pune',
      teamName: 'Pune Staffing Team',
      source: input.source,
      sourceHistory: [{ source: input.source, date: now.split('T')[0] }],
      phoneHistory: [{ phone: input.phone.trim(), changedAt: now }],
      placementHistory: [],
      interactionTimeline: [
        {
          id: `TL-${Date.now()}`,
          candidateId: newId,
          recruiterId: assignedId,
          recruiterName: assignedName,
          status: 'Interested',
          notes: 'Candidate record created in CRM.',
          createdAt: now,
        },
      ],
      assignmentHistory: [
        {
          id: `AH-${Date.now()}`,
          candidateId: newId,
          fromRecruiterId: 'system',
          fromRecruiterName: 'Creation',
          toRecruiterId: assignedId,
          toRecruiterName: assignedName,
          assignedByUserId: actorUser.id,
          assignedByUserName: actorUser.name,
          assignedAt: now,
        },
      ],
      followUps: [],
      documents: [],
      attachments: [],
      systemAudit: [
        {
          id: `AUD-${Date.now()}`,
          action: 'Created',
          performedBy: actorUser.name,
          timestamp: now,
          details: `Candidate created with source ${input.source.category}.`,
        },
      ],
      isBlacklisted: false,
      callsCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.candidates.unshift(newCandidate);
    return { ...newCandidate };
  }

  async quickUpdate(
    input: QuickUpdateInput,
    clientMeta: { name?: string; type?: 'Payroll' | 'OTS' },
    actorUser: { id: string; name: string }
  ): Promise<Candidate> {
    const index = this.candidates.findIndex((c) => c.id === input.candidateId);
    if (index === -1) throw new Error(`Candidate with ID ${input.candidateId} not found.`);

    const now = new Date().toISOString();
    const candidate = this.candidates[index];

    // Status Engine Validation
    const validation = statusRuleEngine.validateUpdateInput(input, clientMeta.type);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }

    const updatedTimeline: InteractionTimelineRecord = {
      id: `TL-${Date.now()}`,
      candidateId: candidate.id,
      recruiterId: actorUser.id,
      recruiterName: actorUser.name,
      status: input.status,
      clientId: input.clientId,
      clientName: input.clientName || clientMeta.name,
      notes: input.notes,
      issueDescription: input.issueDescription,
      followUpDate: input.followUpDate,
      interviewDate: input.interviewDate,
      createdAt: now,
    };

    const newAuditEntries: SystemAuditRecord[] = [
      {
        id: `AUD-${Date.now()}`,
        action: 'Status Changed',
        performedBy: actorUser.name,
        timestamp: now,
        details: `Status updated to ${input.status}.${input.clientName ? ` Client: ${input.clientName}` : ''}`,
      },
    ];

    let newCurrentPlacement = candidate.currentPlacement;
    const newPlacementHistory = [...candidate.placementHistory];

    // If status is Active, create new placement history entry
    if (input.status === 'Active' && input.clientId && clientMeta.name) {
      const placementId = `PL-${Date.now()}`;
      const activeDate = now.split('T')[0];
      const newPlacement: PlacementRecord = {
        id: placementId,
        clientId: input.clientId,
        clientName: input.clientName || clientMeta.name,
        clientType: clientMeta.type || 'OTS',
        openingId: input.openingId,
        activeDate,
        payrollEmployeeId: input.payrollEmployeeId,
        dateOfBirth: input.dateOfBirth,
        status: 'Active',
        createdAt: now,
      };

      newCurrentPlacement = newPlacement;
      newPlacementHistory.unshift(newPlacement);

      // Trigger Workforce extension contract
      prepareWorkforceSync({
        candidateId: candidate.id,
        candidateName: candidate.name,
        phone: candidate.phone,
        role: candidate.role,
        clientId: input.clientId,
        clientName: input.clientName || clientMeta.name,
        clientType: clientMeta.type || 'OTS',
        payrollEmployeeId: input.payrollEmployeeId,
        activeDate,
      });

      // Trigger Performance extension contract (Recruiter points)
      preparePerformanceSync({
        recruiterId: actorUser.id,
        candidateId: candidate.id,
        action: 'CANDIDATE_ACTIVATED',
        pointsEarned: 2, // 2 Recruiter points per activation
        timestamp: now,
      });
    }

    // Call logging performance sync
    preparePerformanceSync({
      recruiterId: actorUser.id,
      candidateId: candidate.id,
      action: 'CALL_COMPLETED',
      pointsEarned: 1,
      timestamp: now,
    });

    const updatedCandidate: Candidate = {
      ...candidate,
      status: input.status,
      currentClientId: input.clientId || candidate.currentClientId,
      currentClientName: input.clientName || clientMeta.name || candidate.currentClientName,
      interviewDate: input.interviewDate || candidate.interviewDate,
      followUpDate: input.followUpDate || candidate.followUpDate,
      issueDescription: input.issueDescription || candidate.issueDescription,
      payrollEmployeeId: input.payrollEmployeeId || candidate.payrollEmployeeId,
      dateOfBirth: input.dateOfBirth || candidate.dateOfBirth,
      currentPlacement: newCurrentPlacement,
      placementHistory: newPlacementHistory,
      interactionTimeline: [updatedTimeline, ...candidate.interactionTimeline],
      systemAudit: [...newAuditEntries, ...candidate.systemAudit],
      callsCount: candidate.callsCount + 1,
      updatedAt: now,
    };

    this.candidates[index] = updatedCandidate;
    return { ...updatedCandidate };
  }

  async updateCandidateProfile(id: string, updates: Partial<Candidate>, actorUser: { name: string }): Promise<Candidate> {
    const index = this.candidates.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Candidate with ID ${id} not found.`);
    const now = new Date().toISOString();
    const existing = this.candidates[index];

    const updated: Candidate = {
      ...existing,
      ...updates,
      updatedAt: now,
    };

    if (updates.payrollEmployeeId && updates.payrollEmployeeId !== existing.payrollEmployeeId) {
      updated.systemAudit.unshift({
        id: `AUD-${Date.now()}`,
        action: 'Employee ID Updated',
        performedBy: actorUser.name,
        timestamp: now,
        details: `Payroll Employee ID updated to ${updates.payrollEmployeeId}.`,
      });
    }

    this.candidates[index] = updated;
    return { ...updated };
  }

  async reassignCandidate(
    candidateId: string,
    toRecruiterId: string,
    toRecruiterName: string,
    actorUser: { id: string; name: string },
    reason?: string
  ): Promise<Candidate> {
    const index = this.candidates.findIndex((c) => c.id === candidateId);
    if (index === -1) throw new Error(`Candidate with ID ${candidateId} not found.`);
    const now = new Date().toISOString();
    const candidate = this.candidates[index];

    const assignmentRecord: AssignmentHistoryRecord = {
      id: `AH-${Date.now()}`,
      candidateId,
      fromRecruiterId: candidate.assignedRecruiterId,
      fromRecruiterName: candidate.assignedRecruiterName,
      toRecruiterId,
      toRecruiterName,
      assignedByUserId: actorUser.id,
      assignedByUserName: actorUser.name,
      assignedAt: now,
      reason,
    };

    const auditEntry: SystemAuditRecord = {
      id: `AUD-${Date.now()}`,
      action: 'Assigned',
      performedBy: actorUser.name,
      timestamp: now,
      details: `Reassigned from ${candidate.assignedRecruiterName} to ${toRecruiterName}.${reason ? ` Reason: ${reason}` : ''}`,
    };

    const updated: Candidate = {
      ...candidate,
      assignedRecruiterId: toRecruiterId,
      assignedRecruiterName: toRecruiterName,
      assignmentHistory: [assignmentRecord, ...candidate.assignmentHistory],
      systemAudit: [auditEntry, ...candidate.systemAudit],
      updatedAt: now,
    };

    this.candidates[index] = updated;
    return { ...updated };
  }

  async bulkAssignCandidates(
    candidateIds: string[],
    toRecruiterId: string,
    toRecruiterName: string,
    actorUser: { id: string; name: string }
  ): Promise<number> {
    let count = 0;
    for (const id of candidateIds) {
      await this.reassignCandidate(id, toRecruiterId, toRecruiterName, actorUser, 'Bulk Assignment');
      count++;
    }
    return count;
  }

  async bulkRecruiterTransfer(
    fromRecruiterId: string,
    toRecruiterId: string,
    toRecruiterName: string,
    actorUser: { id: string; name: string }
  ): Promise<number> {
    const matching = this.candidates.filter((c) => c.assignedRecruiterId === fromRecruiterId);
    let count = 0;
    for (const cand of matching) {
      await this.reassignCandidate(cand.id, toRecruiterId, toRecruiterName, actorUser, 'Recruiter Resignation / Portfolio Restructuring');
      count++;
    }
    return count;
  }

  async toggleBlacklist(candidateId: string, isBlacklisted: boolean, reason: string, actorUser: { name: string }): Promise<Candidate> {
    const index = this.candidates.findIndex((c) => c.id === candidateId);
    if (index === -1) throw new Error(`Candidate with ID ${candidateId} not found.`);
    const now = new Date().toISOString();
    const candidate = this.candidates[index];

    const updated: Candidate = {
      ...candidate,
      isBlacklisted,
      blacklistReason: isBlacklisted ? reason : undefined,
      blacklistedBy: isBlacklisted ? actorUser.name : undefined,
      blacklistedAt: isBlacklisted ? now : undefined,
      systemAudit: [
        {
          id: `AUD-${Date.now()}`,
          action: 'Blacklisted',
          performedBy: actorUser.name,
          timestamp: now,
          details: isBlacklisted ? `Blacklisted: ${reason}` : 'Removed from blacklist.',
        },
        ...candidate.systemAudit,
      ],
      updatedAt: now,
    };

    this.candidates[index] = updated;
    return { ...updated };
  }

  async getImportHistory(): Promise<ImportHistoryItem[]> {
    return [...this.importHistory];
  }

  async addImportHistory(item: Omit<ImportHistoryItem, 'id' | 'importedAt'>): Promise<ImportHistoryItem> {
    const newItem: ImportHistoryItem = {
      ...item,
      id: `IMP-${Date.now()}`,
      importedAt: new Date().toISOString(),
    };
    this.importHistory.unshift(newItem);
    return newItem;
  }
}

export const crmRepository = new CrmRepository();
