/**
 * Hire Huub Automation Hub - Offer Letter Generator Engine
 *
 * Handles Google Docs Master Template copying, placeholder substitution,
 * statutory PF/ESI formatting, Annexure A population, image insertions,
 * private PDF export, and Google Drive file storage.
 */

/**
 * Generates an Offer Letter document from a Google Docs master template.
 *
 * @param {Object} payload - Validated request payload containing template ID & structured data.
 * @param {string} requestId - Unique execution request ID.
 * @returns {Object} Standard Automation Hub response contract object.
 */
function generateOfferLetterDocument(payload, requestId) {
  var workingDoc = null;
  var workingDocFile = null;

  try {
    // 1. Validate Template ID & Data
    var templateObj = payload.template || {};
    var templateId = templateObj.templateId || payload.templateId;

    if (!templateId || typeof templateId !== "string" || templateId.trim() === "") {
      return createErrorResponse(requestId, payload.documentType, "TEMPLATE_NOT_FOUND", "Master Google Docs Template ID is missing in request payload.");
    }

    var data = payload.data || {};
    var personName = data.candidateName || data.personName || "Person";
    var offerRef = payload.entityId || data.offerReference || "OFFER";
    var offerDateStr = data.offerDate;

    // 2. Validate offerDate and Parse Year
    if (!offerDateStr || typeof offerDateStr !== "string" || offerDateStr.trim() === "") {
      return createErrorResponse(requestId, payload.documentType, "INVALID_OFFER_DATE", "Offer date is missing in request payload data.");
    }

    var offerDateMatch = offerDateStr.trim().match(/^(\d{4})/);
    if (!offerDateMatch) {
      return createErrorResponse(requestId, payload.documentType, "INVALID_OFFER_DATE", "Invalid offer date format '" + offerDateStr + "'. Expected YYYY-MM-DD format.");
    }
    var offerYear = offerDateMatch[1];

    // 3. Sanitize Output File Name (No Candidate terminology)
    var sanitizedRef = offerRef.replace(/[\/\\:*?"<>|]/g, "_");
    var sanitizedName = personName.trim().replace(/[\/\\:*?"<>|]/g, "_");
    var baseFileName = "Offer_Letter_" + sanitizedRef + "_" + sanitizedName;
    var pdfFileName = baseFileName + ".pdf";

    // 4. Resolve Target Parent Drive Folder (from payload folderId)
    var parentFolder = null;
    if (payload.folderId && typeof payload.folderId === "string" && payload.folderId.trim() !== "") {
      try {
        parentFolder = DriveApp.getFolderById(payload.folderId.trim());
      } catch (fErr) {
        parentFolder = null;
      }
    }

    if (!parentFolder) {
      return createErrorResponse(requestId, payload.documentType, "STORAGE_NOT_CONFIGURED", "Offer Letter storage folder ID is missing or invalid. Please configure Google Drive Folder ID in Company Settings.");
    }

    // 5. Resolve or Create Year Subfolder inside Parent Folder (with duplicate protection)
    var yearFolder = getOrCreateYearSubfolder(parentFolder, offerYear);
    if (!yearFolder) {
      return createErrorResponse(requestId, payload.documentType, "FOLDER_CREATION_FAILED", "Failed to resolve or create Year folder '" + offerYear + "' in Google Drive.");
    }

    // 6. Access Master Template File & Create Working Copy inside Year Folder
    var masterFile = null;
    try {
      masterFile = DriveApp.getFileById(templateId.trim());
    } catch (mErr) {
      return createErrorResponse(requestId, payload.documentType, "TEMPLATE_ACCESS_FAILED", "Failed to access Master Google Doc with ID '" + templateId + "': " + mErr.message);
    }

    try {
      workingDocFile = masterFile.makeCopy(baseFileName + "_TEMP", yearFolder);
    } catch (cErr) {
      return createErrorResponse(requestId, payload.documentType, "GOOGLE_DOC_COPY_FAILED", "Failed to create working copy of Master Template: " + cErr.message);
    }

    // 7. Open Working Copy with DocumentApp
    try {
      workingDoc = DocumentApp.openById(workingDocFile.getId());
    } catch (oErr) {
      if (workingDocFile) {
        try { workingDocFile.setTrashed(true); } catch (tErr) {}
      }
      return createErrorResponse(requestId, payload.documentType, "TEMPLATE_ACCESS_FAILED", "Failed to open working copy Google Doc: " + oErr.message);
    }

    var body = workingDoc.getBody();

    // 8. Perform Placeholder Replacements (Supports both PERSON_* and legacy CANDIDATE_*)
    var placeholders = buildOfferPlaceholderDictionary(payload, data);
    for (var key in placeholders) {
      if (placeholders.hasOwnProperty(key)) {
        var token = "{{" + key + "}}";
        var val = placeholders[key] !== undefined && placeholders[key] !== null ? String(placeholders[key]) : "";
        body.replaceText(token, val);
      }
    }

    // 9. Handle Conditional Statutory Sections (PF & ESI)
    handleConditionalStatutoryContent(body, data);

    // 10. Handle Brand Assets (Signature & Stamp)
    handleBrandAssetInsertions(body, data);

    // 11. Save and Close Working Google Doc
    workingDoc.saveAndClose();

    // 12. Export Private PDF & Store in Year Folder
    var pdfBlob = workingDocFile.getAs("application/pdf");
    pdfBlob.setName(pdfFileName);

    var pdfFile = yearFolder.createFile(pdfBlob);
    
    // Ensure PDF remains strictly private (DO NOT use ANYONE_WITH_LINK)
    pdfFile.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);

    // 13. Trash Temporary Working Copy
    try {
      workingDocFile.setTrashed(true);
    } catch (tErr) {
      // Non-fatal if trash fails
    }

    // 14. Return Standard Metadata Response
    return {
      success: true,
      requestId: requestId,
      documentId: "doc_" + sanitizedRef + "_" + new Date().getTime(),
      documentType: payload.documentType || "OFFER_LETTER",
      fileName: pdfFileName,
      fileUrl: pdfFile.getUrl(),
      driveFileId: pdfFile.getId(),
      version: CONFIG.VERSION,
      generatedAt: new Date().toISOString(),
      error: null
    };

  } catch (err) {
    if (workingDocFile) {
      try { workingDocFile.setTrashed(true); } catch (tErr) {}
    }
    return createErrorResponse(requestId, payload.documentType, "DOCUMENT_GENERATION_FAILED", "Offer Letter generation failed: " + err.message);
  }
}

/**
 * Builds standard placeholder dictionary for Offer Letter.
 * Supports both professional PERSON_* placeholders and legacy CANDIDATE_* placeholders.
 */
function buildOfferPlaceholderDictionary(payload, data) {
  var formatCurrency = function(num) {
    if (typeof num !== "number" || isNaN(num)) return "₹0";
    return "₹" + Math.round(num).toLocaleString("en-IN");
  };

  var pfApp = data.pfApplicable !== false;
  var esiApp = data.esiApplicable !== false;

  var personNameVal = data.candidateName || data.personName || "";
  var personAddrVal = data.candidateAddress || data.personAddress || "";
  var personEmailVal = data.candidateEmail || data.personEmail || "";
  var personPhoneVal = data.candidatePhone || data.personPhone || "";

  return {
    // Brand
    LEGAL_NAME: data.legalName || data.companyName || "Hire Huub People Solution Private Limited",
    BRAND_NAME: data.brandName || "Hire Huub",
    BRAND_ADDRESS: data.brandAddress || "Bangalore, Karnataka",
    BRAND_EMAIL: data.brandEmail || "hr@hirehuub.com",
    BRAND_PHONE: data.brandPhone || "+91 98765 43210",
    BRAND_WEBSITE: data.brandWebsite || "www.hirehuub.com",

    // Person Being Offered (Primary Standard)
    PERSON_NAME: personNameVal,
    PERSON_ADDRESS: personAddrVal,
    PERSON_EMAIL: personEmailVal,
    PERSON_PHONE: personPhoneVal,

    // Legacy Candidate Placeholders (Backwards Compatibility)
    CANDIDATE_NAME: personNameVal,
    CANDIDATE_ADDRESS: personAddrVal,
    CANDIDATE_EMAIL: personEmailVal,
    CANDIDATE_PHONE: personPhoneVal,

    // Offer
    OFFER_REFERENCE: payload.entityId || data.offerReference || "",
    OFFER_DATE: data.offerDate || new Date().toISOString().split("T")[0],
    JOINING_DATE: data.joiningDate || "",

    // Employment
    DESIGNATION: data.designation || "",
    DEPARTMENT: data.department || "",
    WORK_LOCATION: data.workLocation || "",
    REPORTING_MANAGER: data.reportingManager || "",

    // Compensation
    MONTHLY_GROSS: formatCurrency(data.monthlyGross),
    ANNUAL_GROSS: formatCurrency(data.annualGross || (data.monthlyGross ? data.monthlyGross * 12 : 0)),

    BASIC_MONTHLY: formatCurrency(data.basicMonthly),
    BASIC_ANNUAL: formatCurrency(data.basicAnnual),

    HRA_MONTHLY: formatCurrency(data.hraMonthly),
    HRA_ANNUAL: formatCurrency(data.hraAnnual),

    CONVEYANCE_MONTHLY: formatCurrency(data.conveyanceMonthly || 0),
    CONVEYANCE_ANNUAL: formatCurrency(data.conveyanceAnnual || 0),

    MOBILE_MONTHLY: formatCurrency(data.mobileMonthly || 0),
    MOBILE_ANNUAL: formatCurrency(data.mobileAnnual || 0),

    SPECIAL_MONTHLY: formatCurrency(data.specialMonthly),
    SPECIAL_ANNUAL: formatCurrency(data.specialAnnual),

    PROFESSIONAL_TAX_MONTHLY: formatCurrency(data.professionalTaxMonthly),
    PROFESSIONAL_TAX_ANNUAL: formatCurrency(data.professionalTaxAnnual),

    EMPLOYEE_PF_MONTHLY: pfApp ? formatCurrency(data.employeePfMonthly) : "Not Applicable",
    EMPLOYEE_PF_ANNUAL: pfApp ? formatCurrency(data.employeePfAnnual) : "Not Applicable",

    EMPLOYER_PF_MONTHLY: pfApp ? formatCurrency(data.employerPfMonthly) : "Not Applicable",
    EMPLOYER_PF_ANNUAL: pfApp ? formatCurrency(data.employerPfAnnual) : "Not Applicable",

    EMPLOYEE_ESI_MONTHLY: esiApp ? formatCurrency(data.employeeEsiMonthly) : "Not Applicable",
    EMPLOYEE_ESI_ANNUAL: esiApp ? formatCurrency(data.employeeEsiAnnual) : "Not Applicable",

    EMPLOYER_ESI_MONTHLY: esiApp ? formatCurrency(data.employerEsiMonthly) : "Not Applicable",
    EMPLOYER_ESI_ANNUAL: esiApp ? formatCurrency(data.employerEsiAnnual) : "Not Applicable",

    NET_TAKE_HOME_MONTHLY: formatCurrency(data.netTakeHomeMonthly),
    NET_TAKE_HOME_ANNUAL: formatCurrency(data.netTakeHomeAnnual)
  };
}

/**
 * Resolves or creates a Year subfolder inside the configured parent Drive folder.
 * Uses deterministic existing-folder strategy to prevent duplicate year subfolders.
 *
 * @param {GoogleAppsScript.Drive.Folder} parentFolder - Configured brand parent Drive folder.
 * @param {string} yearStr - Four-digit year string (e.g. "2026").
 * @returns {GoogleAppsScript.Drive.Folder} Resolved or newly created year Drive folder.
 */
function getOrCreateYearSubfolder(parentFolder, yearStr) {
  try {
    var folderIterator = parentFolder.getFoldersByName(yearStr);
    if (folderIterator.hasNext()) {
      return folderIterator.next(); // Deterministically reuses existing folder
    }
    return parentFolder.createFolder(yearStr);
  } catch (err) {
    return null;
  }
}

/**
 * Handles conditional statutory content (e.g. clearing N/A rows if needed).
 */
function handleConditionalStatutoryContent(body, data) {
  // Safe string replacements for statutory conditional flags
  if (data.pfApplicable === false) {
    body.replaceText("\\{\\{PF_SECTION\\}\\}", "PF: Not Applicable");
  } else {
    body.replaceText("\\{\\{PF_SECTION\\}\\}", "PF Applicable");
  }

  if (data.esiApplicable === false) {
    body.replaceText("\\{\\{ESI_SECTION\\}\\}", "ESI: Not Applicable");
  } else {
    body.replaceText("\\{\\{ESI_SECTION\\}\\}", "ESI Applicable");
  }
}

/**
 * Handles insertion of Brand Signature and Stamp images into Document body.
 */
function handleBrandAssetInsertions(body, data) {
  if (data.signatureUrl && typeof data.signatureUrl === "string") {
    try {
      var sigRange = body.findText("\\{\\{SIGNATURE_IMAGE\\}\\}");
      if (sigRange) {
        var sigResp = UrlFetchApp.fetch(data.signatureUrl, { muteHttpExceptions: true });
        if (sigResp.getResponseCode() === 200) {
          var sigBlob = sigResp.getBlob();
          var sigElement = sigRange.getElement();
          var sigPar = sigElement.getParent().asParagraph();
          sigElement.removeFromParent();
          var img = sigPar.appendInlineImage(sigBlob);
          img.setWidth(140).setHeight(50);
        } else {
          body.replaceText("\\{\\{SIGNATURE_IMAGE\\}\\}", data.reportingManager || "Authorized Signatory");
        }
      }
    } catch (sErr) {
      body.replaceText("\\{\\{SIGNATURE_IMAGE\\}\\}", data.reportingManager || "Authorized Signatory");
    }
  } else {
    body.replaceText("\\{\\{SIGNATURE_IMAGE\\}\\}", data.reportingManager || "Authorized Signatory");
  }

  if (data.stampUrl && typeof data.stampUrl === "string") {
    try {
      var stampRange = body.findText("\\{\\{STAMP_IMAGE\\}\\}");
      if (stampRange) {
        var stampResp = UrlFetchApp.fetch(data.stampUrl, { muteHttpExceptions: true });
        if (stampResp.getResponseCode() === 200) {
          var stampBlob = stampResp.getBlob();
          var stampElement = stampRange.getElement();
          var stampPar = stampElement.getParent().asParagraph();
          stampElement.removeFromParent();
          var sImg = stampPar.appendInlineImage(stampBlob);
          sImg.setWidth(80).setHeight(80);
        } else {
          body.replaceText("\\{\\{STAMP_IMAGE\\}\\}", "");
        }
      }
    } catch (stErr) {
      body.replaceText("\\{\\{STAMP_IMAGE\\}\\}", "");
    }
  } else {
    body.replaceText("\\{\\{STAMP_IMAGE\\}\\}", "");
  }
}

/**
 * Helper to generate structured error response.
 */
function createErrorResponse(requestId, documentType, errorCode, errorMessage) {
  return {
    success: false,
    requestId: requestId,
    documentId: null,
    documentType: documentType || "OFFER_LETTER",
    fileName: null,
    fileUrl: null,
    driveFileId: null,
    version: CONFIG.VERSION,
    generatedAt: new Date().toISOString(),
    error: {
      code: errorCode,
      message: errorMessage
    }
  };
}
