import type { CandidateStatus, QuickUpdateInput } from '../types/crm';

export interface StatusValidationResult {
  isValid: boolean;
  errors: string[];
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  isFollowUpRequired: boolean;
  isClientRequired: boolean;
  isInterviewDateRequired: boolean;
  isIssueDescriptionRequired: boolean;
  isActiveTransition: boolean;
  isPayrollCandidate: boolean;
}

export class StatusRuleEngine {
  /**
   * Analyze rules for a target candidate status
   */
  getRulesForStatus(status: CandidateStatus): {
    requiresClient: boolean;
    requiresInterviewDate: boolean;
    requiresFollowUpDate: boolean;
    requiresIssueDescription: boolean;
    requiresConfirmation: boolean;
    confirmationPrompt?: string;
    isPayrollFieldsVisible: boolean;
  } {
    switch (status) {
      case 'Line Up':
        return {
          requiresClient: true,
          requiresInterviewDate: true,
          requiresFollowUpDate: false,
          requiresIssueDescription: false,
          requiresConfirmation: false,
          isPayrollFieldsVisible: false,
        };

      case 'Active':
        return {
          requiresClient: true,
          requiresInterviewDate: false,
          requiresFollowUpDate: false,
          requiresIssueDescription: false,
          requiresConfirmation: false,
          isPayrollFieldsVisible: true,
        };

      case 'Doc / Vehicle / Vacancy Issue':
        return {
          requiresClient: false,
          requiresInterviewDate: false,
          requiresFollowUpDate: false, // Optional
          requiresIssueDescription: true,
          requiresConfirmation: false,
          isPayrollFieldsVisible: false,
        };

      case 'Wrong Number':
        return {
          requiresClient: false,
          requiresInterviewDate: false,
          requiresFollowUpDate: false,
          requiresIssueDescription: false,
          requiresConfirmation: true,
          confirmationPrompt: 'Are you sure you want to mark this candidate as Wrong Number? This will update candidate reachability status.',
          isPayrollFieldsVisible: false,
        };

      case 'Interested':
      case 'OB':
      case 'Call Back Later':
      case 'Ringing / Busy / Forward / Call Disconnected':
      case 'Inactive':
      case 'Number not in Service':
      case 'Not Eligible':
        return {
          requiresClient: false,
          requiresInterviewDate: false,
          requiresFollowUpDate: true,
          requiresIssueDescription: false,
          requiresConfirmation: false,
          isPayrollFieldsVisible: false,
        };

      case 'Not Interested':
      default:
        return {
          requiresClient: false,
          requiresInterviewDate: false,
          requiresFollowUpDate: false,
          requiresIssueDescription: false,
          requiresConfirmation: false,
          isPayrollFieldsVisible: false,
        };
    }
  }

  /**
   * Validate a quick update submission against centralized rules
   */
  validateUpdateInput(input: QuickUpdateInput, clientType?: 'Payroll' | 'OTS'): StatusValidationResult {
    const errors: string[] = [];
    const rules = this.getRulesForStatus(input.status);

    if (rules.requiresClient && !input.clientId) {
      errors.push('Selecting a Client is required for this status.');
    }

    if (rules.requiresInterviewDate && !input.interviewDate) {
      errors.push('Interview Date is required for Line Up status.');
    }

    if (rules.requiresFollowUpDate && !input.followUpDate) {
      errors.push('Follow Up Date is required for this status.');
    }

    if (rules.requiresIssueDescription && (!input.issueDescription || !input.issueDescription.trim())) {
      errors.push('Issue Description is required when marking Doc / Vehicle / Vacancy Issue.');
    }

    const isPayroll = input.status === 'Active' && clientType === 'Payroll';

    if (isPayroll && !input.payrollEmployeeId) {
      errors.push('Payroll Employee ID is required for active Payroll placements.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      requiresConfirmation: rules.requiresConfirmation,
      confirmationMessage: rules.confirmationPrompt,
      isFollowUpRequired: rules.requiresFollowUpDate,
      isClientRequired: rules.requiresClient,
      isInterviewDateRequired: rules.requiresInterviewDate,
      isIssueDescriptionRequired: rules.requiresIssueDescription,
      isActiveTransition: input.status === 'Active',
      isPayrollCandidate: isPayroll,
    };
  }
}

export const statusRuleEngine = new StatusRuleEngine();
