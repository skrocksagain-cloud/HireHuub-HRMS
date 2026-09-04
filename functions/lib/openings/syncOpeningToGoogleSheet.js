"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncOpeningToGoogleSheet = void 0;
exports.formatOpeningSheetRow = formatOpeningSheetRow;
exports.syncOpeningToGoogleSheets = syncOpeningToGoogleSheets;
const SPREADSHEET_ID = '1gdxhmJXleW6eABxR_zRmDCb5eJ8nWyB3o1lNS1TEN5g';
const TAB_NAME = 'Vacancy';
function formatOpeningSheetRow(openingId, data) {
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
async function syncOpeningToGoogleSheets(openingId, afterData) {
    const shouldPublish = Boolean(afterData &&
        afterData.status === 'Active' &&
        afterData.isOutsourced === true);
    const { google } = await Promise.resolve().then(() => __importStar(require('googleapis')));
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
    }
    catch {
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
        }
        else {
            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: `${TAB_NAME}!A:O`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [rowValues],
                },
            });
        }
    }
    else {
        if (existingRowIndex > 0) {
            const spreadsheet = await sheets.spreadsheets.get({
                spreadsheetId: SPREADSHEET_ID,
            });
            const sheet = spreadsheet.data.sheets?.find((s) => s.properties?.title === TAB_NAME);
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
const v1_1 = require("firebase-functions/v1");
exports.syncOpeningToGoogleSheet = v1_1.firestore
    .document('openings/{openingId}')
    .onWrite(async (change, context) => {
    const openingId = context.params.openingId;
    const afterData = change.after.exists ? change.after.data() : null;
    try {
        await syncOpeningToGoogleSheets(openingId, afterData);
    }
    catch {
        // Safe execution logging without crashing function trigger
    }
});
//# sourceMappingURL=syncOpeningToGoogleSheet.js.map