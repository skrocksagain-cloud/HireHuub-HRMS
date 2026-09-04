export interface ClientIntegrationV2 {
  getClientConfig(clientId: string, transaction?: any, activeDate?: string): Promise<{
    clientName: string;
    commercialType: 'Payroll' | 'OTS';
    points: number;
    bigDayBonus: number;
    totalPoints: number;
    tenureDaysConfig?: number;
  }>;
}

export interface AssociatePartnerIntegrationV2 {
  getAssociatePartnerForCandidate(candidateId: string): Promise<{
    id: string;
    name?: string;
    status: 'Joined' | 'Not Joined' | 'Not Found';
  }>;
}
