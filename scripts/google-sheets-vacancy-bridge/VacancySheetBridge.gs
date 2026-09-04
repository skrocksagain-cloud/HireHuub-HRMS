/**
 * Hire Huub ERP — Approved Outsourced Vacancy Google Sheet Bridge
 *
 * Dedicated Google Apps Script Web App for synchronizing Outsourced Openings to:
 * Spreadsheet ID: 1gdxhmJXleW6eABxR_zRmDCb5eJ8nWyB3o1lNS1TEN5g
 * Tab Name: Vacancy
 */

var APPROVED_VACANCY_SPREADSHEET_ID = "1gdxhmJXleW6eABxR_zRmDCb5eJ8nWyB3o1lNS1TEN5g";
var APPROVED_VACANCY_TAB_NAME = "Vacancy";

/**
 * Primary Web App Request Handler
 * Supports POST requests with JSON payload:
 * { "action": "UPSERT" | "REMOVE", "spreadsheetId": "1gdxhm...", "tabName": "Vacancy", "data": { ... } }
 */
function doPost(e) {
  var response;
  try {
    var rawText = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    var payload = JSON.parse(rawText);
    response = handleVacancySyncRequest(payload);
  } catch (err) {
    response = {
      success: false,
      error: "Failed to process request: " + err.toString(),
      timestamp: new Date().toISOString()
    };
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    service: "Hire Huub Outsourced Vacancy Sync Gateway",
    targetSpreadsheetId: APPROVED_VACANCY_SPREADSHEET_ID,
    tabName: APPROVED_VACANCY_TAB_NAME,
    status: "ACTIVE",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Core Synchronization Logic (UPSERT / REMOVE)
 */
function handleVacancySyncRequest(payload) {
  var ss;
  try {
    ss = SpreadsheetApp.openById(APPROVED_VACANCY_SPREADSHEET_ID);
  } catch (err) {
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch (err2) {
      return {
        success: false,
        error: "Failed to open target Spreadsheet: " + err.toString()
      };
    }
  }

  if (!ss) {
    return { success: false, error: "Spreadsheet context could not be acquired." };
  }

  var sheet = ss.getSheetByName(APPROVED_VACANCY_TAB_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(APPROVED_VACANCY_TAB_NAME);
    var headers = [
      "Opening ID",
      "Client",
      "Role / Job Title",
      "City",
      "State",
      "Number of Vacancies",
      "Experience",
      "Qualification",
      "Salary",
      "Salary Period",
      "Employment Type",
      "Shift",
      "Job Description",
      "Skills / Requirements",
      "Last Updated"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");
  }

  var action = (payload.action || "").toUpperCase();

  if (action === "UPSERT") {
    var data = payload.data || {};
    var openingId = data.openingId || payload.openingId;
    if (!openingId) {
      return { success: false, error: "Opening ID (e.g. HHOP0001) is required for UPSERT action." };
    }

    var rowData = [
      openingId,
      data.clientName || "Client Master",
      data.roleTitle || "Requisition",
      data.city || "N/A",
      data.state || "Maharashtra",
      data.vacanciesCount || 1,
      data.experienceRange || "0 - 3 Yrs",
      data.qualification || "Any Qualification",
      data.salaryRange || "Negotiable",
      data.salaryPeriod || "Monthly",
      data.employmentType || "Outsourced Staffing",
      data.shift || "Rotational / Fixed",
      data.jobDescription || "N/A",
      data.skillsRequired || "",
      data.lastUpdated || new Date().toISOString().split("T")[0]
    ];

    var lastRow = sheet.getLastRow();
    var foundRowIndex = -1;

    if (lastRow >= 2) {
      var idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < idValues.length; i++) {
        if (String(idValues[i][0]).trim() === String(openingId).trim()) {
          foundRowIndex = i + 2; // 1-indexed including header
          break;
        }
      }
    }

    if (foundRowIndex > 0) {
      sheet.getRange(foundRowIndex, 1, 1, rowData.length).setValues([rowData]);
      return { success: true, action: "UPDATED", rowIndex: foundRowIndex, openingId: openingId };
    } else {
      sheet.appendRow(rowData);
      return { success: true, action: "CREATED", rowIndex: sheet.getLastRow(), openingId: openingId };
    }
  } else if (action === "REMOVE") {
    var openingId = payload.openingId || (payload.data && payload.data.openingId);
    if (!openingId) {
      return { success: true, action: "NO_OP", message: "No opening ID provided to remove." };
    }

    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      var idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < idValues.length; i++) {
        if (String(idValues[i][0]).trim() === String(openingId).trim()) {
          sheet.deleteRow(i + 2);
          return { success: true, action: "DELETED", rowIndex: i + 2, openingId: openingId };
        }
      }
    }
    return { success: true, action: "NOT_FOUND", openingId: openingId };
  }

  return { success: false, error: "Unsupported action '" + action + "'. Expected UPSERT or REMOVE." };
}
