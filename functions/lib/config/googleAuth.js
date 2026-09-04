"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoogleAuthClient = getGoogleAuthClient;
exports.getDriveService = getDriveService;
exports.getDocsService = getDocsService;
const googleapis_1 = require("googleapis");
/**
 * Initializes Google OAuth2 / Service Account authorization client
 * using Application Default Credentials (ADC) provided automatically by Google Cloud / Firebase Functions environment.
 */
function getGoogleAuthClient() {
    const auth = new googleapis_1.google.auth.GoogleAuth({
        scopes: [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/documents',
        ],
    });
    return auth;
}
function getDriveService() {
    const auth = getGoogleAuthClient();
    return googleapis_1.google.drive({ version: 'v3', auth });
}
function getDocsService() {
    const auth = getGoogleAuthClient();
    return googleapis_1.google.docs({ version: 'v1', auth });
}
//# sourceMappingURL=googleAuth.js.map