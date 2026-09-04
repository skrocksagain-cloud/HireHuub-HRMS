# Phase 2D.1 Finance & Document Download Architecture Audit

## A. Executive summary

**Overall health: high risk.** The active Finance UI has useful UI-level permission checks, but its canonical identity source is inconsistent and most sensitive repositories read whole collections. Firestore rules allow the Finance/business-role token as a peer to canonical admin roles. Generated-document metadata stores download URLs, and no Firebase Storage rules file is configured or deployed by `firebase.json`. Consequently, the application cannot establish that sensitive files remain protected after a URL is obtained.

This was a strictly read-only audit. No application, Rules, Functions, data, or Storage files were changed.

## B. Active finance architecture

| Area | Active UI flow | Authoritative collections / source |
|---|---|---|
| Internal payroll | `pages/Payroll/index.tsx` → `UniversalPayrollEnginePage.tsx` → `payrollEngineService` | `salaryComponents`, `salaryStructures`, `employeeSalaryProfiles`, `payrollRuns`, `generated_payslips` |
| Bank process | Payroll page → `BankProcessModal.tsx` → payroll engine / transaction service | `payrollRuns`, `generated_payslips`, `finance_transactions`, `expenseLedger`, Storage |
| Invoice register/profile | `InvoicesPage.tsx` / `InvoiceProfilePage.tsx` → hooks → `invoiceService` → `invoiceRepository` | `invoices`, `documents`, Firebase Storage |
| Credit notes | `CreditNotesPage.tsx` → `creditNoteService` → `creditNoteRepository` | `creditNotes`, `invoices`, `documents`, Firebase Storage |
| Transactions | `TransactionsPage.tsx` → `transactionService` → `transactionRepository` | `finance_transactions`, `expenseLedger`, payout collections, `paymentHistory` |
| Client payout | `PayoutPage.tsx` → `PayrollPayoutTab.tsx` / `OtsBillingTab.tsx` → payout/workforce services | workforce imports/items plus `placements`, `crm_candidates`, `finance_ots_billing`, `finance_payout_batches` |

`pages/Finance/index.ts` exposes invoices, invoice profiles, credit notes, and transactions. Payout is present at `pages/Finance/payout` but is not exported from that barrel; it is nevertheless active code and must be included in Phase 2D.2.

## C. Data visibility findings

| Finance area | Data source | Current visibility | Authorization location | Network-safe? | Download-safe? | Legacy dependency | Risk |
|---|---|---|---|---|---|---|---|
| Payroll runs/register | `payrollRuns` | Payroll page reads a selected document, then falls back to an unrestricted collection read | No role check in Payroll page/service; Firestore allows canonical admins **or token `Finance`** | No | N/A | Rule token `Finance` | High |
| Salary profiles/components/structures | `employeeSalaryProfiles`, `salaryComponents`, `salaryStructures` | Whole collections read; service filters brand in browser | No service authorization; no explicit matching Firestore rules | No / access may fail depending on unmatched-rule default | N/A | None in service | High |
| Payslip register | `generated_payslips` | Payroll page reads all records. Employee self-service queries own payslips by `employeeId`, then reads all `documents` payslip metadata to map paths | UI/service only; Rules grant whole collection read to canonical admins or token `Finance`, not the owner | No for register; self query is bounded but rules do not permit a normal User | No | Rule token `Finance` | Critical |
| Bank process / release | `payrollRuns`, `generated_payslips`, `finance_transactions`, `expenseLedger` | Full payroll result, bank account and employee data are made available to the caller | UI actions lack a canonical authorization gate; repository rules are broad role checks | No | Payslip link path is exposed to Finance UI | `Super Admin` hard-coded actor strings | Critical |
| Transactions | `finance_transactions`, `expenseLedger`, payout/payment collections | All records returned to finance client | `TransactionsPage` UI gate using `user.role`; no service/repository actor or scope | No | Payslip download is button-gated only | `user.role`, token `Finance` | Critical |
| Invoices | `invoices` | All invoices returned; individual ID can be read directly | Hooks UI-gate using `user.role`; repository has no actor/scope; Firestore rule currently permits any authenticated user | No | No | `user.role` | Critical |
| Credit notes | `creditNotes` | All notes returned; individual ID can be read directly | UI check runs after component's initial fetch; repository/service has no actor/scope; no matching Firestore rule | No / likely denied unless another rule is introduced | No | `user.role` | Critical |
| Invoice download | Invoice document metadata contains `storagePath` and `downloadUrl` | Invoice lists/profile expose URL to browser | UI hides link based on role only | No | No | `user.role` | Critical |
| Credit-note download | Credit-note document metadata contains `storagePath` and `downloadUrl` | Current page has no download control, but generated URL is stored in Firestore record | No retrieval authorization in service/repository | No | No | None | Critical |
| Client payout | workforce, placements, CRM candidates, payout collections | Finance payout loads all placements/candidates and filters client/date in browser | `PayoutPage` checks `user.role === 'Finance' || 'Super Admin'`; children do not repeat it | No | Export is client-created bank XLSX | `user.role` and Finance role | Critical |

### Ownership / boundary evidence

- A payslip record contains `employeeId`, `payrollRunId`, `storagePath`, and payroll snapshot data. This is an appropriate ownership field, but the current Firestore rule never allows a canonical User to read their own record and does not enforce ownership.
- Payroll runs have no department or employee boundary; their `employeeResults` array contains organization-wide salary and bank-adjacent information.
- Salary profiles are document-keyed by `employeeId` and include bank/account information; brand is filtered after a global fetch.
- Invoices use `clientId` and `createdBy`; no department/organization boundary is used in query or Rules. `invoices` is explicitly readable/writable by any authenticated user at `firestore.rules:22`.
- Credit notes use `originalInvoiceId` and `createdBy`; no visibility boundary is present.
- Transactions contain optional `employeeId`, `payrollRunId`, `payslipId`, `brandId`, and `createdBy`, but their repository uses global reads and does not use these fields to authorize.
- Payout records have `clientId`; active code nevertheless loads all placements and candidates, then filters in browser.

## D. Operational permission findings (separate from visibility)

| Operation | Current enforcement | Finding |
|---|---|---|
| Calculate/finalize/release payroll | UI exposes operations; `payrollEngineService` validates state transitions only | No canonical actor or operational permission is accepted by service. `actorName` is audit text, defaulting to `Super Admin`, not authorization. |
| Generate/release payslips | Payroll service checks run state; UI can call generation/release | No canonical permission at service/repository boundary. |
| Bank file / salary transaction creation | Bank modal provides confirmation; calls payroll/transaction flow | No canonical operation check; page includes hard-coded `Super Admin` actor values. |
| Create/edit/generate/approve invoice | `useInvoices` / `useInvoiceProfile` check `canWriteFinance(userRole)` | UI-only. Service and repository accept arbitrary actor names and no role/identity. |
| Create credit note | Page has view check only | Create button and service lack a distinct write/generate permission check. |
| Record/complete/cancel transaction | Transaction page UI gate | `transactionService` has workflow-state validation, but no actor permission. |
| Mark OTS billed | Payout UI gate | Direct `updateDoc` from component; no operation authorization in the call. |

## E. Document download findings

### Payslips

`payrollEngineService.generatePayslipSnapshotsForRun()` writes `generated_payslips`; `payslipService` resolves path from the payslip record or the `documents` collection. `openPayslipPDF` and `downloadPayslipPDF` call `storageService.exists()` and `getDownloadUrl()` then open a browser URL. The methods accept only a storage path—no actor, owner, or scope.

The self-service query is bounded by `employeeId`, but it also fetches **all** Payslip document metadata for path mapping. `getPayslipById()` reads an arbitrary record by ID. The generated-payslip rule has no self-owner exception, so it does not support the intended User-self model.

### Invoices and credit notes

`invoiceService.generate()` uploads to `finance/invoices/<invoice>/...`, verifies it, obtains a Firebase `getDownloadURL`, writes it into both the invoice document object and a `documents` record. `creditNoteService.generate()` does the equivalent at `finance/credit-notes/<id>/...`. Invoice pages render direct `<a href={downloadUrl}>` links. Credit-note URLs are persisted even though the current page does not render a download control.

`storageService.upload()` always calls `getDownloadURL()` and persists its result. Firebase download URLs are bearer URLs; after disclosure, application button hiding does not authorize subsequent retrieval. `DocumentGenerationService` additionally constructs a direct `alt=media` Firebase Storage URL before upload; it is a mock-PDF generator and not a secure retrieval mechanism.

No `storage.rules` exists in the repository, and `firebase.json` contains no Storage-rules deployment configuration. Storage authorization therefore cannot be verified and is absent from this project configuration.

## F. Global exposure findings

- **CRITICAL:** `invoiceRepository.getInvoices`, `creditNoteRepository.getCreditNotes`, transaction history/ledger/payout/payment-history methods, Payroll page register queries, and `DocumentCenterRepository.getDocuments` use unrestricted `getDocs(collection(...))`.
- **CRITICAL:** `PayrollPayoutTab` and `payoutService` fetch all `placements` and `crm_candidates`, then filter in client memory. This sends cross-client candidate and bank-related data to the browser.
- **CRITICAL:** Payroll service reads all employee salary profiles and employees before computing a run; no actor/scope is passed.
- **HIGH:** `payslipService.getPayslipsForEmployee` uses a bounded payslip query but separately retrieves all Payslip document metadata and maps paths locally.
- **HIGH:** Optional brand filters in payroll service are applied after global reads (`getBrandSalaryStructures`, `getEmployeeSalaryProfiles`).
- **HIGH:** `DocumentCenterRepository.getDocuments(filters)` fetches all documents then filters by module locally; finance document metadata and URLs can reach a caller authorized only by broad document access.

## G. Legacy authorization dependencies

| Dependency | Classification | Risk / evidence |
|---|---|---|
| `user.role` in Invoice, Invoice Profile, Credit Notes, Transactions, Payout pages | Authorization-critical | Uses legacy/business role rather than `assignedRole` / `user.authorization.role`; several pages default missing role to `Super Admin`. Critical. |
| `request.auth.token.role == 'Finance'` in finance Rules | Authorization-critical | Makes a business role an access-control role, contrary to canonical-role requirement. High. |
| `permissionService.canAccessFinance/canWriteFinance` | UI-only for these flows | Effective only if supplied canonical role; current callers pass `user.role`. High. |
| literal `role: 'Finance'` in audit records | Operational/audit metadata | Not itself visibility control. Low. |
| literal `Super Admin` actor defaults in payroll/bank code | Operational/audit metadata with misleading trust implication | State changes can be attributed to Super Admin without being authorized as such. High. |
| `PayoutPage` Finance-or-Super-Admin equality check | Authorization-critical UI-only | Excludes Master Admin/Admin even though Firestore finance Rules allow them. High inconsistency. |

## H. Firestore security findings

- `firestore.rules` does protect several finance collections from ordinary authenticated users, but grants read **and write** to every canonical Admin/Master Admin/Super Admin and to legacy token `Finance`; it does not encode self, department, record ownership, approve, release, or finalize boundaries.
- `generated_payslips` has no owner read clause, so an ordinary canonical User cannot read their own payslip through Rules.
- `invoices` explicitly allows `read, write` for all authenticated users, bypassing Finance UI checks entirely.
- `creditNotes`, `documents`, `expenseLedger`, salary master/profile collections, and some supporting collections have no explicit matching rules in the reviewed file. Under Firestore's default-deny semantics, their intended active behavior may fail; if permissive deployed rules differ, this repository cannot validate that. This is a configuration/reconciliation risk, not evidence of a safe boundary.
- The Rules still use legacy tokens such as `Finance`, `Department Admin`, `Recruiter`, and `Employee`, while the canonical resolver uses `User`, `Admin`, `Master Admin`, and `Super Admin`.

## I. Firebase Storage findings

- No Storage Rules source was found and no Storage Rules deployment is configured.
- `getDownloadURL()` is used on uploads and later retrieval, and the resulting URL is stored in invoice/credit-note/document metadata.
- Storage path knowledge is sufficient to ask the client SDK for a URL if Storage Rules permit it; after a download URL is returned, possession of that URL is not constrained by UI role checks.
- URL guessing alone is not the relevant risk for Firebase's tokenized URLs; metadata access, logging, browser inspection, sharing, and persisted URLs are the material disclosure paths.

## J. Super Admin verification

Super Admin is expected to be global. Actual results are inconsistent:

- Finance Rules allow global reads/writes for payroll/payslip/transaction/payout collections.
- Invoice Rules allow global access but also allow every authenticated user.
- Super Admin can reach invoice/transaction UI only if `user.role` resolves correctly; pages do not consistently use canonical authorization.
- Payout allows only literal `Finance` or literal `Super Admin`, excluding Master Admin/Admin despite Rules permitting them.
- Super Admin can access stored document URLs when metadata is readable, but this is not an authorization-checked retrieval path.

## K. Current and recommended boundaries

| Canonical role | Current practical behavior | Recommended data visibility | Recommended operations |
|---|---|---|---|
| User | Mostly denied Finance Rules; self-payslip service exists but Rules prevent it | Own generated payslip metadata and file only | No company-finance operations |
| Admin | Rules grant broad global finance reads/writes | Finance-specific decision: department payroll/transactions only if every record has immutable department; otherwise no payroll/invoice global access | Draft/review only where explicitly granted |
| Master Admin | Rules grant broad global finance reads/writes; Payout UI may deny | Department finance only where queryable; otherwise review without release | Review/approve according to explicit policy, not implicit role |
| Super Admin | Broad global visibility | Global | Explicitly granted calculate/finalize/release/generate/approve/process-bank operations |

Finance cannot safely inherit a generic department model until payroll runs, invoices, credit notes, transaction records, and document metadata have a durable scope/owner field. The decision required is whether a non-canonical Finance job function remains an **operational entitlement** in a separate claims/permission layer; it must not remain the authorization role or Rules shortcut.

## L. Required correction priority

1. **CRITICAL — Storage/document access:** define and deploy Storage Rules; stop persisting reusable download URLs as the access-control mechanism; retrieve URL only after server/Roles-validated metadata authorization.
2. **CRITICAL — Invoice Rules:** replace authenticated-user-wide invoice access with scoped Finance policy.
3. **CRITICAL — Canonical identity:** replace `user.role` and fallback `Super Admin` behavior in all Finance routes/hooks with `user.authorization.role` / `assignedRole`.
4. **CRITICAL — Network queries:** replace global fetch-and-filter flows for Finance, payroll documents, and client payouts with scope-specific repository methods and compatible Firestore fields/indexes.
5. **HIGH — Payslip self access:** add owner-based Firestore/Storage access and remove the all-documents path lookup.
6. **HIGH — Operational policy:** enforce Calculate, Finalize, Release, Generate, Approve, Record Payment, and Process Bank in services or trusted backend, not just UI.
7. **MEDIUM — Rule reconciliation:** add explicit intended Rules for active `documents`, `creditNotes`, salary configuration, and ledger collections; remove legacy role checks.

## M. Minimum Phase 2D.2 implementation plan

1. Create a Finance authorization policy/resolver using canonical roles plus a separately-defined Finance operational entitlement, then pass an explicit actor/scope to repositories.
2. Update `invoiceRepository`, `creditNoteRepository`, `transactionRepository`, `payrollEngineService`, `payslipService`, and `DocumentCenterRepository` with explicit SELF/DEPARTMENT/GLOBAL methods. Do not retain optional parameters whose omission becomes global.
3. Update Finance pages/hooks (`InvoicesPage`, `InvoiceProfilePage`, `CreditNotesPage`, `TransactionsPage`, `PayoutPage`, `useInvoices`, `useInvoiceProfile`) to source canonical role from AuthContext and to call only scoped service methods.
4. Split payroll register/admin workflows from employee payslip self-service. Query payslip metadata by `employeeId` for User; authorize finance-admin/global paths separately.
5. Move document URL issuance behind an authorized document-access service and configure corresponding Firestore plus Storage Rules. Existing URL-bearing document fields require a migration/compatibility decision before implementation.
6. Replace `PayrollPayoutTab` / `payoutService` global placement/candidate reads with Firestore queries bounded by client and authorized scope; coordinate only with Workforce owners and do not modify Workforce in Phase 2D.1.
7. Update `firestore.rules` and introduce a tracked Storage Rules file/configuration after the policy is approved; test direct SDK reads and direct Storage URL access for every role.

## File inventory

**Pages/components/hooks:**

- `apps/web/src/pages/Payroll/index.tsx`, `UniversalPayrollEnginePage.tsx`, `components/PayslipGeneratorDrawer.tsx`
- `apps/web/src/pages/Finance/billing/InvoicesPage.tsx`, `CreditNotesPage.tsx`, `pages/InvoiceProfilePage.tsx`, `hooks/useInvoices.ts`, `hooks/useInvoiceProfile.ts`, `hooks/useFinanceDashboard.ts`
- `apps/web/src/pages/Finance/transactions/TransactionsPage.tsx`, `components/BankProcessModal.tsx`
- `apps/web/src/pages/Finance/payout/pages/PayoutPage.tsx`, `components/PayrollPayoutTab.tsx`, `components/OtsBillingTab.tsx`, `components/PayoutExceptionsTable.tsx`

**Services/repositories/types:**

- `services/payroll/payrollEngineService.ts`, `services/payroll/payslipService.ts`
- `pages/Finance/billing/services/{invoiceService,creditNoteService,billingService,invoiceTemplateService}.ts`
- `pages/Finance/billing/repositories/{invoiceRepository,creditNoteRepository,billingRepository,invoiceTemplateRepository}.ts`
- `pages/Finance/transactions/services/transactionService.ts`, `repositories/transactionRepository.ts`
- `pages/Finance/payout/services/payoutService.ts`, `repositories/payoutRepository.ts`, `types/index.ts`
- `types/{Admin,Invoice,CreditNote,Transaction,FinanceReport}.ts`, `pages/Finance/shared/types/finance.ts`

**Document generation/storage/authorization dependencies:**

- `services/document/{documentService,storageService,pdfService,emailService}.ts`, `services/document/repositories/documentCenterRepository.ts`
- `services/documentGeneration/DocumentGenerationService.ts`, `components/DocumentPreviewModal.tsx`
- `templates/pdf/{PayslipPdf,InvoicePdf,CreditNotePdf,FinanceReportPdf}.tsx`
- `context/AuthContext.tsx`, `core/authorization/authorizationResolver.ts`, `core/permissions/permissionService.ts`, `firestore.rules`, `firebase.json`

**External dependencies mapped only (not changed):** Workforce repositories/services and `placements` / `crm_candidates`; Employee service/repository; Client service/repository; Attendance repository; Administration/company settings; Firebase Storage.

PHASE 2D.1 AUDIT: BLOCKED — ARCHITECTURAL DECISION REQUIRED
