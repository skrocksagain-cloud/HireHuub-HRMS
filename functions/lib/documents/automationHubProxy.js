"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestAutomationDocument = exports.automationHubUrl = exports.automationHubAuthToken = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_1.getFirestore)();
// Define Firebase Secret Manager Secret for Automation Hub Auth Token
exports.automationHubAuthToken = (0, params_1.defineSecret)('AUTOMATION_HUB_AUTH_TOKEN');
exports.automationHubUrl = (0, params_1.defineSecret)('AUTOMATION_HUB_URL');
/**
 * Server-side Secure Cloud Function Callable Endpoint
 *
 * Authenticates callers via Firebase Auth (`request.auth`), resolves employee & role permissions,
 * and proxies document generation requests to the Google Apps Script Automation Hub.
 */
exports.requestAutomationDocument = (0, https_1.onCall)({
    cors: true,
    secrets: [exports.automationHubAuthToken, exports.automationHubUrl],
}, async (request) => {
    // Development Auth Bypass (Defaults to true during dev phase unless explicitly set to 'false')
    const isAuthDisabled = process.env.AUTH_DISABLED !== 'false';
    // 1. Mandatory Firebase Auth Check (Skipped when AUTH_DISABLED === 'true')
    if (!isAuthDisabled) {
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'Firebase authentication required. You must be signed in to Hire Huub ERP to perform this action.');
        }
        const authenticatedEmployeeId = request.auth.uid;
        if (!authenticatedEmployeeId) {
            throw new https_1.HttpsError('unauthenticated', 'Authenticated user UID is missing.');
        }
        // Server-side Employee Record & Status Validation
        const employeeQuery = await db
            .collection('employees')
            .where('employeeId', '==', authenticatedEmployeeId)
            .limit(1)
            .get();
        if (employeeQuery.empty) {
            throw new https_1.HttpsError('permission-denied', 'Authenticated employee record was not found.');
        }
        const employeeData = employeeQuery.docs[0].data();
        const activeStatuses = ['Active', 'Pending Activation'];
        const employeeStatus = employeeData.accountStatus || employeeData.status || 'Active';
        if (!activeStatuses.includes(employeeStatus) && employeeData.accountStatus === 'Locked') {
            throw new https_1.HttpsError('permission-denied', 'Your account is locked or inactive and cannot generate documents.');
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
                const permissions = roleData.permissions || [];
                const modules = roleData.modules || [];
                const hasSuperPermission = permissions.includes('*') || permissions.includes('super_admin');
                const hasRecruitmentModule = modules.includes('recruitment');
                const hasRecruitmentGenerate = permissions.includes('recruitment:generate');
                const hasDocumentsCreate = permissions.includes('documents:create') || permissions.includes('documents:generate');
                if (request.data?.documentType === 'OFFER_LETTER') {
                    isAuthorized = hasSuperPermission || hasRecruitmentModule || hasRecruitmentGenerate;
                }
                else {
                    isAuthorized = hasSuperPermission || hasDocumentsCreate;
                }
            }
        }
        if (!isAuthorized) {
            throw new https_1.HttpsError('permission-denied', 'You do not have permission to generate Offer Letters.');
        }
    }
    const payload = request.data;
    // 2. Validate generic payload fields
    if (!payload || !payload.brandId || !payload.documentType || !payload.entityId) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid payload. Required parameters: brandId, documentType, entityId.');
    }
    // 3. Resolve Secret Manager Secrets / Config
    const hubUrl = exports.automationHubUrl.value() || process.env.AUTOMATION_HUB_URL;
    const authToken = exports.automationHubAuthToken.value() || process.env.AUTOMATION_HUB_AUTH_TOKEN;
    if (!hubUrl) {
        throw new https_1.HttpsError('failed-precondition', 'AUTOMATION_HUB_URL secret or environment variable is not configured.');
    }
    const reqId = payload.requestId || `req_erp_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const outgoingPayload = {
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
        const headers = {
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
            throw new https_1.HttpsError('unavailable', `Automation Hub HTTP error: ${response.status} ${response.statusText}`);
        }
        const responseData = (await response.json());
        // 5. Return structured response contract to ERP caller
        return responseData;
    }
    catch (err) {
        if (err instanceof https_1.HttpsError) {
            throw err;
        }
        throw new https_1.HttpsError('internal', err instanceof Error
            ? `Failed to communicate with Automation Hub: ${err.message}`
            : 'Unknown error occurred while contacting Automation Hub.');
    }
});
//# sourceMappingURL=automationHubProxy.js.map