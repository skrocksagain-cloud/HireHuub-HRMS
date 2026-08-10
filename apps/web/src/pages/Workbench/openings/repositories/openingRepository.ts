import type { Opening } from '../../../../types/Opening';
import { openingNumberService } from '../../../../services/numbering/openingNumberService';

const SAMPLE_OPENINGS: Opening[] = [
  {
    id: 'HHOP0001',
    clientId: 'client-001',
    clientName: 'Elastic Run',
    title: 'Warehouse Logistics Executive',
    description: 'Responsible for inventory tracking, inward/outward supply management, and hub dispatch operations.',
    location: 'Warje Hub, Pune',
    city: 'Pune',
    state: 'Maharashtra',
    openPositions: 15,
    status: 'Active',
    priority: 'High',
    interviewDate: '2026-08-10',
    isOutsourced: false,
    minExperience: 1,
    maxExperience: 3,
    qualification: 'Higher Secondary (12th Pass) / Graduate',
    genderPreference: 'Any',
    ageLimit: 32,
    skills: ['Inventory Management', 'Barcode Scanning', 'ERP Basics'],
    minSalary: 18000,
    maxSalary: 24000,
    salaryType: 'Monthly',
    benefits: ['Weekly Payment', 'Free Accommodation', 'Transport Facility', 'Attendance Bonus'],
    requiredDocuments: ['Aadhaar Card', 'PAN Card', 'Bank Passbook', 'Driving License'],
    assignedRecruiterIds: ['user-001'],
    attachments: [],
    createdAt: '2026-08-01T09:00:00.000Z',
    updatedAt: '2026-08-03T14:20:00.000Z',
  },
  {
    id: 'HHOP0002',
    clientId: 'client-001',
    clientName: 'Elastic Run',
    title: 'Hub Delivery Supervisor (Outsourced)',
    description: 'Overseeing last-mile delivery fleet and shift allocations in Peenya hub.',
    location: 'Peenya Industrial Area, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    openPositions: 8,
    status: 'Active',
    priority: 'Urgent',
    interviewDate: '2026-08-12',
    isOutsourced: true,
    outsourcedVendor: 'QuickStaff Solutions',
    minExperience: 2,
    maxExperience: 5,
    qualification: 'Graduate',
    genderPreference: 'Male',
    ageLimit: 35,
    skills: ['Fleet Dispatch', 'Team Handling', 'Route Optimization'],
    minSalary: 25000,
    maxSalary: 32000,
    salaryType: 'Monthly',
    benefits: ['Incentive', 'Overtime', 'Medical Insurance'],
    requiredDocuments: ['Aadhaar Card', 'PAN Card', 'Relieving Letter'],
    assignedRecruiterIds: ['user-002'],
    attachments: [],
    createdAt: '2026-08-02T10:30:00.000Z',
    updatedAt: '2026-08-03T16:00:00.000Z',
  },
  {
    id: 'HHOP0003',
    clientId: 'client-002',
    clientName: 'Acme Tech',
    title: 'Technical Support Associate',
    description: 'Providing L1 IT support, hardware troubleshooting, and ticketing resolution.',
    location: 'Baner Tech Park, Pune',
    city: 'Pune',
    state: 'Maharashtra',
    openPositions: 5,
    status: 'OnHold',
    priority: 'Medium',
    interviewDate: '2026-08-18',
    isOutsourced: false,
    minExperience: 0,
    maxExperience: 2,
    qualification: 'B.Sc IT / BCA / Diploma CS',
    genderPreference: 'Any',
    ageLimit: 28,
    skills: ['Windows OS', 'Networking Basics', 'Ticket Management'],
    minSalary: 22000,
    maxSalary: 28000,
    salaryType: 'Monthly',
    benefits: ['Fixed Shift', 'Medical Insurance', 'Incentive'],
    requiredDocuments: ['Aadhaar Card', 'PAN Card', 'Degree Certificate'],
    assignedRecruiterIds: ['user-001'],
    attachments: [],
    createdAt: '2026-07-28T11:00:00.000Z',
    updatedAt: '2026-08-02T11:00:00.000Z',
  },
  {
    id: 'HHOP0004',
    clientId: 'client-003',
    clientName: 'Infosys Workforce',
    title: 'Customer Service Representative',
    description: 'Handling inbound customer queries via call and chat support in 24/7 rotational shifts.',
    location: 'Electronic City, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    openPositions: 20,
    status: 'Closed',
    priority: 'Low',
    interviewDate: '2026-07-25',
    isOutsourced: false,
    minExperience: 0,
    maxExperience: 3,
    qualification: 'Any Graduate',
    genderPreference: 'Any',
    ageLimit: 30,
    skills: ['English Communication', 'Customer Handling', 'Keyboard Speed'],
    minSalary: 20000,
    maxSalary: 26000,
    salaryType: 'Monthly',
    benefits: ['Growth Opportunity', 'Rotational Shift', 'Medical Insurance', 'Joining Bonus'],
    requiredDocuments: ['Aadhaar Card', 'PAN Card', 'Educational Marksheets'],
    assignedRecruiterIds: ['user-002'],
    attachments: [],
    createdAt: '2026-07-15T08:00:00.000Z',
    updatedAt: '2026-07-26T18:00:00.000Z',
  },
];

export class OpeningRepository {
  private openings: Opening[] = [...SAMPLE_OPENINGS];

  async getOpenings(): Promise<Opening[]> {
    return [...this.openings];
  }

  async getOpeningById(id: string): Promise<Opening | null> {
    const found = this.openings.find((o) => o.id === id);
    return found ? { ...found } : null;
  }

  async createOpening(input: Omit<Opening, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Opening> {
    const newId = input.id || await openingNumberService.generateNextNumber(this.openings);
    const now = new Date().toISOString();
    const newOpening: Opening = {
      ...input,
      id: newId,
      assignedRecruiterIds: input.assignedRecruiterIds ?? [],
      attachments: input.attachments ?? [],
      createdAt: now,
      updatedAt: now,
    };
    this.openings.unshift(newOpening);
    return { ...newOpening };
  }

  async updateOpening(id: string, updates: Partial<Opening>): Promise<Opening> {
    const index = this.openings.findIndex((o) => o.id === id);
    if (index === -1) throw new Error(`Opening with ID ${id} not found.`);
    const now = new Date().toISOString();
    const updated: Opening = {
      ...this.openings[index],
      ...updates,
      updatedAt: now,
    };
    this.openings[index] = updated;
    return { ...updated };
  }

  async deleteOpening(id: string): Promise<boolean> {
    const index = this.openings.findIndex((o) => o.id === id);
    if (index === -1) return false;
    this.openings.splice(index, 1);
    return true;
  }
}

export const openingRepository = new OpeningRepository();
