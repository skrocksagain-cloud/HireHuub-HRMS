import type { Client, CreateClientInput } from '../../../../../types/Client';
import type { BillingAddress } from '../../../../../types/BillingCompany';
import { clientRepository } from '../repositories/clientRepository';

export interface ResolvedClientBilling {
  clientId: string;
  clientName: string;
  billingName: string;
  billingAddress: BillingAddress;
  gstin: string;
  billingState: string;
  isMultiGst: boolean;
  availableStates: Array<{ stateCode: string; stateName: string; gstin: string }>;
  templateReference: string;
  templateVersion: number;
}

const validateClientInput = (input: CreateClientInput): void => {
  if (!input.name.trim()) throw new Error('Client Name (Short/Common Name) is required.');
  if (!input.billingName.trim()) throw new Error('Billing Name (Legal Entity Name) is required.');
  if (!input.gstin.trim()) throw new Error('GSTIN is required.');
  if (!input.state.trim()) throw new Error('State is required.');
  if (!input.invoiceConfig.templateReference.trim()) throw new Error('Invoice Template Reference is required.');

  if (input.commercial?.type === 'OTS') {
    const tenure = input.commercial.tenureCondition;
    if (tenure === undefined || tenure === null || (typeof tenure === 'string' && (tenure as string).trim() === '')) {
      throw new Error('Tenure Condition is required for OTS clients.');
    }
    const num = typeof tenure === 'number' ? tenure : Number(tenure);
    if (isNaN(num) || !Number.isInteger(num) || num < 1) {
      throw new Error('Tenure Condition must be a valid whole number of at least 1 day.');
    }
  }
};

class ClientService {
  async getClients(): Promise<Client[]> {
    return clientRepository.getClients();
  }

  async getClientById(id: string): Promise<Client | null> {
    if (!id.trim()) throw new Error('Client ID is required.');
    return clientRepository.getClientById(id);
  }

  async createClient(input: CreateClientInput): Promise<Client> {
    validateClientInput(input);
    return clientRepository.createClient(input);
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    if (!id.trim()) throw new Error('Client ID is required.');
    return clientRepository.updateClient(id, updates);
  }

  async resolveClientBillingForState(clientId: string, selectedStateName?: string): Promise<ResolvedClientBilling> {
    const client = await this.getClientById(clientId);
    if (!client) throw new Error(`Client with ID ${clientId} was not found.`);

    const isMultiGst =
      (client.gstConfig.scopeChoice === 'IndividualStates' || client.gstConfig.gstMode === 'MultiState' || client.gstConfig.gstMode === 'IndividualStates') &&
      client.gstConfig.stateGstRecords.length > 1;

    const availableStates = client.gstConfig.stateGstRecords.map((r) => ({
      stateCode: r.stateCode,
      stateName: r.stateName,
      gstin: r.gstin,
    }));

    if (!isMultiGst) {
      const primaryRecord = client.gstConfig.stateGstRecords.find((r) => r.isPrimary) ?? client.gstConfig.stateGstRecords[0];
      return {
        clientId: client.id,
        clientName: client.name,
        billingName: primaryRecord?.billingName || client.billingName,
        billingAddress: primaryRecord?.billingAddress || client.billingAddress,
        gstin: primaryRecord?.gstin || client.gstin,
        billingState: primaryRecord?.stateName || client.state,
        isMultiGst: false,
        availableStates,
        templateReference: primaryRecord?.templateReference || client.invoiceConfig.templateReference,
        templateVersion: primaryRecord?.templateVersion || client.invoiceConfig.templateVersion,
      };
    }

    const matchedRecord = selectedStateName
      ? client.gstConfig.stateGstRecords.find((r) => r.stateName.toLowerCase() === selectedStateName.toLowerCase())
      : client.gstConfig.stateGstRecords.find((r) => r.isPrimary) ?? client.gstConfig.stateGstRecords[0];

    if (!matchedRecord) {
      throw new Error(`GST record for state '${selectedStateName}' not found for client ${client.name}.`);
    }

    return {
      clientId: client.id,
      clientName: client.name,
      billingName: matchedRecord.billingName || client.billingName,
      billingAddress: matchedRecord.billingAddress || client.billingAddress,
      gstin: matchedRecord.gstin,
      billingState: matchedRecord.stateName,
      isMultiGst: true,
      availableStates,
      templateReference: matchedRecord.templateReference || client.invoiceConfig.templateReference,
      templateVersion: matchedRecord.templateVersion || client.invoiceConfig.templateVersion,
    };
  }
}

export const clientService = new ClientService();
