import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

// Define Firebase Secret Manager Secret for Automation Hub Auth Token
export const automationHubAuthToken = defineSecret('AUTOMATION_HUB_AUTH_TOKEN');
export const automationHubUrl = defineSecret('AUTOMATION_HUB_URL');

export interface ERPAutomationDocumentRequestPayload {
  brandId: string;
  documentType: string;
  entityId: string;
  requestId?: string;
  template?: {
    templateId: string;
    templateVersion?: string;
  };
  folderId?: string;
  data?: Record<string, unknown>;
  editableData?: Record<string, unknown>;
}

export interface AutomationHubRequestPayload {
  brandId: string;
  documentType: string;
  entityId: string;
  requestId?: string;
  template?: {
    templateId: string;
    templateVersion?: string;
  };
  folderId?: string;
  data?: Record<string, unknown>;
  editableData?: Record<string, unknown>;
}

export interface AutomationHubResponsePayload {
  success: boolean;
  requestId: string;
  documentId: string | null;
  documentType: string | null;
  fileName: string | null;
  fileUrl: string | null;
  driveFileId: string | null;
  version: string;
  generatedAt: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Server-side Secure Cloud Function Callable Endpoint
 *
 * Authenticates callers via Firebase Auth (`request.auth`), resolves employee & role permissions,
 * and proxies document generation requests to the Google Apps Script Automation Hub.
 */
export const requestAutomationDocument = onCall<ERPAutomationDocumentRequestPayload>(
  {
    cors: true,
    secrets: [automationHubAuthToken, automationHubUrl],
  },
  async (request): Promise<AutomationHubResponsePayload> => {
    // Development Auth Bypass (Defaults to true during dev phase unless explicitly set to 'false')
    const isAuthDisabled = process.env.AUTH_DISABLED !== 'false';

    // 1. Mandatory Firebase Auth Check (Skipped when AUTH_DISABLED === 'true')
    if (!isAuthDisabled) {
      if (!request.auth) {
        throw new HttpsError(
          'unauthenticated',
          'Firebase authentication required. You must be signed in to Hire Huub ERP to perform this action.'
        );
      }

      const authenticatedEmployeeId = request.auth.uid;
      if (!authenticatedEmployeeId) {
        throw new HttpsError(
          'unauthenticated',
          'Authenticated user UID is missing.'
        );
      }

      // Server-side Employee Record & Status Validation
      const employeeQuery = await db
        .collection('employees')
        .where('employeeId', '==', authenticatedEmployeeId)
        .limit(1)
        .get();

      if (employeeQuery.empty) {
        throw new HttpsError(
          'permission-denied',
          'Authenticated employee record was not found.'
        );
      }

      const employeeData = employeeQuery.docs[0].data();
      const activeStatuses = ['Active', 'Pending Activation'];
      const employeeStatus = employeeData.accountStatus || employeeData.status || 'Active';

      if (!activeStatuses.includes(employeeStatus) && employeeData.accountStatus === 'Locked') {
        throw new HttpsError(
          'permission-denied',
          'Your account is locked or inactive and cannot generate documents.'
        );
      }

      // Server-side Authorization Check (canGenerateDocument rule)
      const employeeRoleName = (employeeData.role || 'Super Admin').trim();
      const isSuper = employeeRoleName === 'Super Admin' || employeeRoleName === 'admin';

      let isAuthorized = isSuper;

      if (!isAuthorized) {
        // Query admin_roles collection for non-super roles
        const rolesQuery = await db
          .collection('admin_roles')
          .where('name', '==', employeeRoleName)
          .limit(1)
          .get();

        if (!rolesQuery.empty) {
          const roleData = rolesQuery.docs[0].data();
          const permissions: string[] = roleData.permissions || [];
          const modules: string[] = roleData.modules || [];

          const hasSuperPermission = permissions.includes('*') || permissions.includes('super_admin');
          const hasRecruitmentModule = modules.includes('recruitment');
          const hasRecruitmentGenerate = permissions.includes('recruitment:generate');
          const hasDocumentsCreate = permissions.includes('documents:create') || permissions.includes('documents:generate');

          if (request.data?.documentType === 'OFFER_LETTER') {
            isAuthorized = hasSuperPermission || hasRecruitmentModule || hasRecruitmentGenerate;
          } else {
            isAuthorized = hasSuperPermission || hasDocumentsCreate;
          }
        }
      }

      if (!isAuthorized) {
        throw new HttpsError(
          'permission-denied',
          'You do not have permission to generate Offer Letters.'
        );
      }
    }

    const payload = request.data;

    // 2. Validate generic payload fields
    if (!payload || !payload.brandId || !payload.documentType || !payload.entityId) {
      throw new HttpsError(
        'invalid-argument',
        'Invalid payload. Required parameters: brandId, documentType, entityId.'
      );
    }

    // 3. Resolve Secret Manager Secrets / Config
    const hubUrl = automationHubUrl.value() || process.env.AUTOMATION_HUB_URL;
    const authToken = automationHubAuthToken.value() || process.env.AUTOMATION_HUB_AUTH_TOKEN;

    if (!hubUrl) {
      throw new HttpsError(
        'failed-precondition',
        'AUTOMATION_HUB_URL secret or environment variable is not configured.'
      );
    }

    const reqId = payload.requestId || `req_erp_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const outgoingPayload: AutomationHubRequestPayload = {
      brandId: payload.brandId,
      documentType: payload.documentType,
      entityId: payload.entityId,
      requestId: reqId,
      template: payload.template,
      folderId: payload.folderId,
      data: payload.data || {},
      editableData: payload.editableData || {},
    };



    try {
      // 4. Secure Server-to-Server HTTPS Request to Apps Script Automation Hub
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['X-HireHuub-Auth-Token'] = authToken.trim();
      }

      const response = await fetch(hubUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(outgoingPayload),
      });

      if (!response.ok && response.status !== 200) {
        // Apps Script Web Apps may return 200 with error JSON or standard HTTP statuses
        throw new HttpsError(
          'unavailable',
          `Automation Hub HTTP error: ${response.status} ${response.statusText}`
        );
      }

      const responseData = (await response.json()) as AutomationHubResponsePayload;

      // 5. Return structured response contract to ERP caller
      return responseData;

    } catch (err) {
      if (err instanceof HttpsError) {
        throw err;
      }

      throw new HttpsError(
        'internal',
        err instanceof Error
          ? `Failed to communicate with Automation Hub: ${err.message}`
          : 'Unknown error occurred while contacting Automation Hub.'
      );
    }
  }
);
