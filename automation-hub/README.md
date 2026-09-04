# Hire Huub Automation Hub — Foundation Architecture

## 1. Purpose of Automation Hub
The **Hire Huub Automation Hub** is a single, centralized Google Apps Script project designed to handle all document generation, formatting, standard storage, and document cataloging across all document types for Hire Huub ERP.

It acts as a secure processing hub receiving standardized JSON requests from **Hire Huub One ERP**, resolving document definitions, binding payload data to brand templates, generating final artifacts (Google Docs / PDFs), storing them in Google Drive, and returning structured document metadata back to the ERP document library.

---

## 2. Architecture

```
Hire Huub One ERP
        ↓ (HTTPS POST JSON payload)
Automation Hub Web App (Code.gs Entry Point)
        ↓
Security & Authentication Validation (Security.gs)
        ↓
Request Validation (Validator.gs)
        ↓
Document Type Routing (Router.gs)
        ↓
Brand Configuration (Config.gs)
        ↓
[Future Handler] Template Mapping & Generation
        ↓
[Future Handler] Google Drive Storage
        ↓
Standardized Response JSON Contract → ERP Document Library
```

Currently, the architecture supports only the core `hirehuub` brand. Future brands will be added via simple configuration mapping in `Config.gs` without altering codebase architecture.

---

## 3. Project Structure

```
automation-hub/
├── appsscript.json   # Google Apps Script manifest & scope definitions
├── Code.gs           # Web App HTTP POST / GET entry points & JSON response formatters
├── Config.gs         # Centralized configuration (brands, doc types, versions, security keys)
├── Validator.gs      # Request payload validation against generic schema
├── Security.gs       # Security authentication checks (ScriptProperties token check)
├── Router.gs         # Generic document type routing dispatcher
├── Logger.gs         # Structured event logging without sensitive payload data leakage
├── Test.gs           # Verification test suite for Step 1 foundation
└── README.md         # Architecture and deployment documentation
```

---

## 4. Request Contract

The Automation Hub enforces a generic request contract suitable for all document types (Offer Letter, Payslip, Invoice, Purchase Order, Quotation, etc.):

```json
{
  "brandId": "hirehuub",
  "documentType": "OFFER_LETTER",
  "entityId": "EMP-1001",
  "requestId": "req_1234567890",
  "data": {
    "candidateName": "Jane Doe",
    "designation": "Senior Software Engineer"
  },
  "editableData": {
    "customNote": "Welcome to the team!"
  }
}
```

### Fields:
- `brandId` *(Required)*: Unique identifier of the brand (`"hirehuub"`).
- `documentType` *(Required)*: Document category code (`"OFFER_LETTER"`, `"PAYSLIP"`, `"INVOICE"`, etc.).
- `entityId` *(Required)*: Primary ERP record ID (e.g. Employee ID, Invoice Number).
- `requestId` *(Optional)*: Unique request tracking ID. Auto-generated as UUID v4 if omitted.
- `data` *(Optional)*: Core data payload required for template rendering.
- `editableData` *(Optional)*: Optional custom overrides or user-editable content blocks.

---

## 5. Response Contract

The Automation Hub always returns a standardized JSON response:

```json
{
  "success": false,
  "requestId": "req_1234567890",
  "documentId": null,
  "documentType": "OFFER_LETTER",
  "fileName": null,
  "fileUrl": null,
  "driveFileId": null,
  "version": "1.0.0-foundation",
  "generatedAt": "2026-08-16T01:18:40.000Z",
  "error": {
    "code": "DOCUMENT_TYPE_NOT_IMPLEMENTED",
    "message": "Document generation is not implemented for document type 'OFFER_LETTER' yet."
  }
}
```

---

## 6. Authentication & Security Plan

1. **Source Code Cleanliness**: Secrets and tokens are NEVER stored in source code repositories.
2. **Google Apps Script ScriptProperties**:
   - Set script property key: `AUTOMATION_HUB_AUTH_TOKEN` in Google Apps Script Settings > Script Properties.
3. **Request Authentication**:
   - Requests from Hire Huub One ERP must supply the secret token in HTTP Header `X-HireHuub-Auth-Token` or `Authorization: Bearer <token>`.
   - `Security.gs` compares incoming token with `ScriptProperties.getProperty("AUTOMATION_HUB_AUTH_TOKEN")`.
   - If not matched, returns `401 Unauthorized` with error code `UNAUTHORIZED`.

---

## 7. Configuration Approach

All system settings are maintained in `Config.gs`:
- `ACTIVE_BRANDS`: Array of registered brands (e.g. `["hirehuub"]`).
- `DOCUMENT_TYPES`: Central dictionary of all planned document types.
- `VERSION` & `ENVIRONMENT`: Release state metadata.
- **Future Extension**: Template mappings (Google Drive File IDs for Docs/Sheets templates) will be defined in `Config.gs` or loaded dynamically from a configuration sheet/ScriptProperties.

---

## 8. Logging Approach

- All request lifecycle events are logged cleanly using Apps Script built-in `Logger.log()` / StackDriver Logging.
- Logging contains: `timestamp`, `appName`, `version`, `requestId`, `brandId`, `documentType`, `status`, `durationMs`, `errorCode`.
- **Privacy & Security Guarantee**: Sensitive fields from `data` or `editableData` (salary, address, tax details, personal info) are strictly excluded from logging statements.

---

## 9. How to Deploy as a Google Apps Script Web App

1. Create a new Apps Script project at [script.google.com](https://script.google.com) named **Hire Huub Automation Hub**.
2. Copy files from `automation-hub/` into the Apps Script editor (`Code.gs`, `Config.gs`, `Security.gs`, `Validator.gs`, `Router.gs`, `Logger.gs`, `Test.gs`, `appsscript.json`).
3. (Optional Security Setup) Go to **Project Settings** > **Script Properties** and add:
   - Property: `AUTOMATION_HUB_AUTH_TOKEN`
   - Value: `<Your-Generated-ERP-Secret-Key>`
4. Click **Deploy** > **New deployment**.
5. Select type: **Web App**.
6. Configuration:
   - **Description**: `Hire Huub Automation Hub v1.0.0`
   - **Execute as**: `Me` (Your Google Account)
   - **Who has access**: `Anyone` (or `Anyone with Google account` based on ERP network strategy).
7. Click **Deploy** and copy the Web App URL (e.g. `https://script.google.com/macros/s/.../exec`).

---

## 10. How the ERP Will Eventually Communicate With It

1. Hire Huub One ERP triggers document creation (e.g. candidate hired → generate offer letter).
2. ERP Backend / Cloud Function sends HTTPS `POST` request to the Web App URL with headers:
   - `Content-Type: application/json`
   - `X-HireHuub-Auth-Token: <SECRET_TOKEN>`
3. ERP payload adheres to the generic request contract.
4. ERP receives the generic response contract and stores `fileUrl`, `driveFileId`, and `documentId` in ERP Document Library.

---

## 11. How Future Document Generators Will Be Added

When adding a new document generator (e.g. Offer Letter in Step 2):

1. Create handler script file in `automation-hub/generators/OfferLetterGenerator.gs`.
2. Register template ID in `Config.gs`.
3. In `Router.gs`, update routing switch to invoke `generateOfferLetter(payload, requestId)`.
4. Handler loads template, clones document, replaces variables, exports PDF to target Drive folder, and returns success response contract.

No architecture or base Web App changes required!

---

## 12. Testing Verification Procedure

Run `runFoundationTestSuite()` in `Test.gs` inside Apps Script editor to execute all 8 foundation tests:
1. Valid POST request (verifying `DOCUMENT_TYPE_NOT_IMPLEMENTED`)
2. Missing `brandId`
3. Missing `documentType`
4. Missing `entityId`
5. Invalid JSON syntax
6. Unknown document type
7. Auto Request ID generation
8. Response contract completeness
