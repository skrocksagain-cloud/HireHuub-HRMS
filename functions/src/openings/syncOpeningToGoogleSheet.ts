const SPREADSHEET_ID = '1gdxhmJXleW6eABxR_zRmDCb5eJ8nWyB3o1lNS1TEN5g';
const TAB_NAME = 'Vacancy';

export interface OpeningDocData {
  id?: string;
  clientName?: string;
  title?: string;
  city?: string;
  state?: string;
  openPositions?: number;
  minExperience?: number;
  maxExperience?: number;
  qualification?: string;
  minSalary?: number;
  maxSalary?: number;
  salaryType?: string;
  salaryPeriod?: string;
  employmentType?: string;
  shift?: string;
  description?: string;
  skills?: string[];
  status?: string;
  isOutsourced?: boolean;
  updatedAt?: string;
  [key: string]: unknown;
}

export function formatOpeningSheetRow(openingId: string, data: OpeningDocData): Array<string | number> {
  const minExp = data.minExperience ?? 0;
  const maxExp = data.maxExperience ?? 3;
  const expStr = `${minExp} - ${maxExp} Yrs`;

  const minSal = data.minSalary ? `₹${data.minSalary.toLocaleString()}` : '';
  const maxSal = data.maxSalary ? `₹${data.maxSalary.toLocaleString()}` : '';
  const salStr = minSal && maxSal ? `${minSal} - ${maxSal}` : minSal || maxSal || '';

  const skillsStr = Array.isArray(data.skills) ? data.skills.join(', ') : '';

  return [
    openingId,
    data.clientName ?? '',
    data.title ?? '',
    data.city ?? '',
    data.state ?? '',
    data.openPositions ?? 1,
    expStr,
    data.qualification ?? '',
    salStr,
    data.salaryType || data.salaryPeriod || 'Monthly',
    'Outsourced Staffing',
    'Rotational / Fixed',
    data.description ?? '',
    skillsStr,
    data.updatedAt ? new Date(data.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  ];
}

export async function syncOpeningToGoogleSheets(
  openingId: string,
  afterData: OpeningDocData | null
): Promise<void> {
  const shouldPublish = Boolean(
    afterData &&
      afterData.status === 'Active' &&
      afterData.isOutsourced === true
  );

  const { google } = await import('googleapis');

  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  let existingRowIndex = -1;
  try {
    const rangeRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TAB_NAME}!A:A`,
    });
    const rows = rangeRes.data.values || [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i] && String(rows[i][0]).trim() === openingId.trim()) {
        existingRowIndex = i + 1; // 1-indexed row number
        break;
      }
    }
  } catch {
    // Range fetch fallback
  }

  if (shouldPublish && afterData) {
    const rowValues = formatOpeningSheetRow(openingId, afterData);
    if (existingRowIndex > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${TAB_NAME}!A${existingRowIndex}:O${existingRowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowValues],
        },
      });
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${TAB_NAME}!A:O`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowValues],
        },
      });
    }
  } else {
    if (existingRowIndex > 0) {
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      });
      const sheet = spreadsheet.data.sheets?.find(
        (s) => s.properties?.title === TAB_NAME
      );
      const sheetId = sheet?.properties?.sheetId ?? 0;

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: 'ROWS',
                  startIndex: existingRowIndex - 1,
                  endIndex: existingRowIndex,
                },
              },
            },
          ],
        },
      });
    }
  }
}

import { firestore } from 'firebase-functions/v1';

export const syncOpeningToGoogleSheet = firestore
  .document('openings/{openingId}')
  .onWrite(async (change, context) => {
    const openingId = context.params.openingId;
    const afterData = change.after.exists ? (change.after.data() as OpeningDocData) : null;

    try {
      await syncOpeningToGoogleSheets(openingId, afterData);
    } catch {
      // Safe execution logging without crashing function trigger
    }
  });
