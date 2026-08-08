export type SpocScope = 'Department' | 'State' | 'Zone' | 'All India';
export type SpocRole = 'HR' | 'Operations' | 'Accounts' | 'Hiring Manager';

export interface ClientSPOC {
  id: string;
  role: SpocRole;
  name: string;
  designation: string;
  email: string;
  phone: string;
  scope: SpocScope;
  scopeDetail?: string; // Department name, State name, or Zone name
  isPrimary: boolean;
  notes?: string;
}
