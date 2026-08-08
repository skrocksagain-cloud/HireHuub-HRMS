import type { Client, CreateClientInput } from '../../../../../types/Client';

const SAMPLE_CLIENTS: Client[] = [
  {
    id: 'client-001',
    name: 'Elastic Run',
    billingName: 'Ntex Logistics Pvt Ltd',
    billingAddress: {
      line1: 'Bhadale Complex, Pune-Bangalore Highway',
      line2: 'Warje',
      city: 'Pune',
      state: 'Maharashtra',
      postalCode: '411058',
      country: 'India',
    },
    gstin: '27AABCN1234F1Z9',
    state: 'Maharashtra',
    type: 'Logistics Enterprise',
    status: 'Active',
    points: 2, // Recruiter Performance Points earned per candidate activation
    highlights: ['Weekly Payment', 'Free Accommodation', 'Transport Facility', 'Attendance Bonus'],
    payroll: {
      isEnabled: true,
      isActiveInLastMonth: true,
    },
    ownership: {
      ownerId: 'user-001',
      ownerName: 'Somnath (Account Exec)',
      createdById: 'user-admin',
    },
    commercial: {
      type: 'OTS',
      points: 2,
      payoutType: 'Amount',
      payoutAmount: 65000,
      tenureCondition: '90 Days', // Visible ONLY for OTS
      poRequired: true,
    },
    gstConfig: {
      gstMode: 'IndividualStates',
      scopeChoice: 'IndividualStates',
      oneGstForAllIndia: false,
      isGstOptional: false,
      stateGstRecords: [
        {
          id: 'gst-elastic-mh',
          stateCode: '27',
          stateName: 'Maharashtra',
          gstin: '27AABCN1234F1Z9',
          billingName: 'Ntex Logistics Pvt Ltd - MH Branch',
          billingAddress: {
            line1: 'Bhadale Complex, Warje',
            city: 'Pune',
            state: 'Maharashtra',
            postalCode: '411058',
            country: 'India',
          },
          templateReference: 'sheet-template-elastic-mh-v1',
          templateVersion: 1,
          isGstOptional: false,
          isPrimary: true,
          isActive: true,
        },
        {
          id: 'gst-elastic-ka',
          stateCode: '29',
          stateName: 'Karnataka',
          gstin: '29AABCN1234F2Z8',
          billingName: 'Ntex Logistics Pvt Ltd - KA Hub',
          billingAddress: {
            line1: 'Peenya Industrial Area',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560058',
            country: 'India',
          },
          templateReference: 'sheet-template-elastic-ka-v2',
          templateVersion: 2,
          isGstOptional: false,
          isPrimary: false,
          isActive: true,
        },
        {
          id: 'gst-elastic-ts',
          stateCode: '36',
          stateName: 'Telangana',
          gstin: '36AABCN1234F3Z7',
          billingName: 'Ntex Logistics Pvt Ltd - Telangana Logistics Park',
          billingAddress: {
            line1: 'Medchal Industrial Area',
            city: 'Hyderabad',
            state: 'Telangana',
            postalCode: '501401',
            country: 'India',
          },
          templateReference: 'sheet-template-elastic-ts-v1',
          templateVersion: 1,
          isGstOptional: false,
          isPrimary: false,
          isActive: true,
        },
        {
          id: 'gst-elastic-wb',
          stateCode: '19',
          stateName: 'West Bengal',
          gstin: '19AABCN1234F4Z6',
          billingName: 'Ntex Logistics Pvt Ltd - Kolkata Hub',
          billingAddress: {
            line1: 'Dankuni Logistics Park',
            city: 'Kolkata',
            state: 'West Bengal',
            postalCode: '712311',
            country: 'India',
          },
          templateReference: 'sheet-template-elastic-wb-v1',
          templateVersion: 1,
          isGstOptional: false,
          isPrimary: false,
          isActive: true,
        },
      ],
    },
    spocs: [
      {
        id: 'spoc-elastic-01',
        role: 'HR',
        name: 'Karan Sharma',
        designation: 'National Recruitment Manager',
        email: 'karan.sharma@elasticrun.in',
        phone: '+91 98111 22334',
        scope: 'All India',
        isPrimary: true,
      },
      {
        id: 'spoc-elastic-02',
        role: 'Operations',
        name: 'Siddharth Rao',
        designation: 'Operations Head',
        email: 'siddharth.rao@elasticrun.in',
        phone: '+91 98111 22335',
        scope: 'State',
        scopeDetail: 'Maharashtra',
        isPrimary: false,
      },
      {
        id: 'spoc-elastic-03',
        role: 'Accounts',
        name: 'Meenal Joshi',
        designation: 'Finance Executive',
        email: 'accounts@elasticrun.in',
        phone: '+91 98111 22336',
        scope: 'All India',
        isPrimary: false,
      },
      {
        id: 'spoc-elastic-04',
        role: 'Hiring Manager',
        name: 'Deepak Thorat',
        designation: 'Hub Lead',
        email: 'deepak.thorat@elasticrun.in',
        phone: '+91 98111 22337',
        scope: 'Department',
        scopeDetail: 'Supply Chain',
        isPrimary: false,
      },
    ],
    invoiceConfig: {
      templateReference: 'sheet-template-elastic-mh-v1',
      templateVersion: 1,
    },
    financeSummary: {
      totalInvoices: 5,
      outstandingAmount: 130000,
      totalCreditNotes: 1,
    },
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-07-30T12:00:00.000Z',
  },
  {
    id: 'client-002',
    name: 'Acme Tech',
    billingName: 'Acme Technologies Pvt Ltd',
    billingAddress: {
      line1: 'Baner Tech Park, Building B, 4th Floor',
      line2: 'Baner Road',
      city: 'Pune',
      state: 'Maharashtra',
      postalCode: '411045',
      country: 'India',
    },
    gstin: '27AAAAA0000A1Z5',
    state: 'Maharashtra',
    type: 'Software Enterprise',
    status: 'Active',
    points: 3,
    highlights: ['Fixed Shift', 'Medical Insurance', 'Incentive'],
    payroll: {
      isEnabled: true,
      isActiveInLastMonth: true,
    },
    ownership: {
      ownerId: 'user-001',
      ownerName: 'Somnath (Account Exec)',
      createdById: 'user-admin',
    },
    commercial: {
      type: 'Payroll',
      points: 3,
      payoutType: 'Percentage',
      percentageBasis: 'Annual CTC',
      percentageRate: 8.33,
      poRequired: true,
    },
    gstConfig: {
      gstMode: 'India',
      scopeChoice: 'India',
      oneGstForAllIndia: true,
      isGstOptional: false,
      stateGstRecords: [
        {
          id: 'gst-acme-01',
          stateCode: '27',
          stateName: 'Maharashtra',
          gstin: '27AAAAA0000A1Z5',
          billingName: 'Acme Technologies Pvt Ltd',
          billingAddress: {
            line1: 'Baner Tech Park, Building B',
            city: 'Pune',
            state: 'Maharashtra',
            postalCode: '411045',
            country: 'India',
          },
          templateReference: 'sheet-template-acme-v1',
          templateVersion: 1,
          isGstOptional: false,
          isPrimary: true,
          isActive: true,
        },
      ],
    },
    spocs: [
      {
        id: 'spoc-acme-01',
        role: 'HR',
        name: 'Rahul Sharma',
        designation: 'Senior HR Manager',
        email: 'rahul.sharma@acme.com',
        phone: '+91 98765 43210',
        scope: 'All India',
        isPrimary: true,
      },
      {
        id: 'spoc-acme-02',
        role: 'Accounts',
        name: 'Amit Verma',
        designation: 'Finance Controller',
        email: 'accounts@acme.com',
        phone: '+91 98765 43212',
        scope: 'All India',
        isPrimary: false,
      },
    ],
    invoiceConfig: {
      templateReference: 'sheet-template-acme-v1',
      templateVersion: 1,
    },
    financeSummary: {
      totalInvoices: 4,
      outstandingAmount: 100300,
      totalCreditNotes: 1,
    },
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-07-20T14:30:00.000Z',
  },
  {
    id: 'client-003',
    name: 'Infosys Workforce',
    billingName: 'Infosys Limited',
    billingAddress: {
      line1: 'Electronic City, Phase 1',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560100',
      country: 'India',
    },
    gstin: '29BBBBB1111B2Z6',
    state: 'Karnataka',
    type: 'IT Services',
    status: 'Active',
    points: 5,
    highlights: ['Growth Opportunity', 'Rotational Shift', 'Medical Insurance', 'Joining Bonus'],
    payroll: {
      isEnabled: true,
      isActiveInLastMonth: true,
    },
    ownership: {
      ownerId: 'user-002',
      ownerName: 'Anil Kumar',
      createdById: 'user-admin',
    },
    commercial: {
      type: 'Payroll',
      points: 5,
      payoutType: 'Percentage',
      percentageBasis: 'Monthly CTC',
      percentageRate: 10,
      poRequired: true,
    },
    gstConfig: {
      gstMode: 'IndividualStates',
      scopeChoice: 'IndividualStates',
      oneGstForAllIndia: false,
      isGstOptional: false,
      stateGstRecords: [
        {
          id: 'gst-infy-ka',
          stateCode: '29',
          stateName: 'Karnataka',
          gstin: '29BBBBB1111B2Z6',
          billingName: 'Infosys Limited - Karnataka',
          billingAddress: {
            line1: 'Electronic City, Phase 1',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560100',
            country: 'India',
          },
          templateReference: 'sheet-template-infy-ka-v1',
          templateVersion: 1,
          isGstOptional: false,
          isPrimary: true,
          isActive: true,
        },
        {
          id: 'gst-infy-mh',
          stateCode: '27',
          stateName: 'Maharashtra',
          gstin: '27BBBBB1111B2Z7',
          billingName: 'Infosys Limited - Pune Campus',
          billingAddress: {
            line1: 'Hinjawadi SEZ Phase 1',
            city: 'Pune',
            state: 'Maharashtra',
            postalCode: '411057',
            country: 'India',
          },
          templateReference: 'sheet-template-infy-mh-v2',
          templateVersion: 2,
          isGstOptional: false,
          isPrimary: false,
          isActive: true,
        },
      ],
    },
    spocs: [
      {
        id: 'spoc-infy-01',
        role: 'HR',
        name: 'Ananya Roy',
        designation: 'Head TA',
        email: 'ananya.roy@infosys.com',
        phone: '+91 91234 56789',
        scope: 'All India',
        isPrimary: true,
      },
      {
        id: 'spoc-infy-02',
        role: 'Accounts',
        name: 'Venkatesh Murthy',
        designation: 'Accounts Controller',
        email: 'accounts@infosys.com',
        phone: '+91 91234 56791',
        scope: 'All India',
        isPrimary: false,
      },
    ],
    invoiceConfig: {
      templateReference: 'sheet-template-infy-global-v1',
      templateVersion: 1,
    },
    financeSummary: {
      totalInvoices: 6,
      outstandingAmount: 283200,
      totalCreditNotes: 0,
    },
    createdAt: '2026-02-01T09:15:00.000Z',
    updatedAt: '2026-07-28T16:00:00.000Z',
  },
];

class ClientRepository {
  private clients: Client[] = [...SAMPLE_CLIENTS];

  async getClients(): Promise<Client[]> {
    return [...this.clients];
  }

  async getClientById(id: string): Promise<Client | null> {
    const found = this.clients.find((c) => c.id === id);
    return found ? { ...found } : null;
  }

  async createClient(input: CreateClientInput): Promise<Client> {
    const newId = `client-${String(this.clients.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();
    const newClient: Client = {
      ...input,
      id: newId,
      points: input.points ?? 2,
      highlights: input.highlights ?? [],
      payroll: input.payroll ?? { isEnabled: true, isActiveInLastMonth: true },
      ownership: input.ownership ?? { ownerId: 'user-001', ownerName: 'Somnath', createdById: 'user-001' },
      createdAt: now,
      updatedAt: now,
    };
    this.clients.push(newClient);
    return { ...newClient };
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    const index = this.clients.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Client with ID ${id} not found.`);
    const now = new Date().toISOString();
    const updated: Client = {
      ...this.clients[index],
      ...updates,
      updatedAt: now,
    };
    this.clients[index] = updated;
    return { ...updated };
  }
}

export const clientRepository = new ClientRepository();
