import { google } from 'googleapis';

/**
 * Initializes Google OAuth2 / Service Account authorization client
 * using Application Default Credentials (ADC) provided automatically by Google Cloud / Firebase Functions environment.
 */
export function getGoogleAuthClient() {
  const auth = new google.auth.GoogleAuth({
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/documents',
    ],
  });
  return auth;
}

export function getDriveService() {
  const auth = getGoogleAuthClient();
  return google.drive({ version: 'v3', auth });
}

export function getDocsService() {
  const auth = getGoogleAuthClient();
  return google.docs({ version: 'v1', auth });
}
