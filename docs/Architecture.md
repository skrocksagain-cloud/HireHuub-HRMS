# Finance — Sprint 04

Finance billing follows the established service/repository separation:

`Billing UI → billingService → billingRepository → Firestore`

The service owns finance rules. The repository owns only Firestore reads, writes, and atomic counter access. Client records remain in Workbench; Finance receives only the client billing state needed to resolve GST.

## Finance — Sprint 05

`Finance UI → invoiceService → invoiceRepository → Firestore`

The Invoice Service invokes the existing Billing Service, Document Generation Service, document metadata service, and storage service. It alone validates drafts, calculates invoice totals, creates immutable snapshots, controls workflow transitions, and requests document generation and storage. The Invoice Repository contains Firestore persistence only.

## Finance — Sprint 06

`Finance UI → creditNoteService → creditNoteRepository → Firestore`

CreditNoteService obtains immutable source data through InvoiceService and requests numbering through BillingService. It does not update invoice records. Credit-note repository methods contain only Firestore data access.

## Finance — Sprint 07

`Finance UI → transactionService → transactionRepository → Firestore`

TransactionService owns expense validation, automatic numbering, configuration validation, status transitions, and expense-ledger requests. TransactionRepository performs only category, payment-source, transaction, and ledger persistence.

TransactionService also resolves associate partners from the Workbench Network collection, exposes only active partners, validates required partner references, and stores the immutable partner-name snapshot with the transaction.

## Finance — Sprint 08

`Finance Reports UI → reportService → BillingService / InvoiceService / CreditNoteService / TransactionService → repositories → Firestore`

Finance Reports are read-only. The report service applies approved filters, reuses BillingService for outstanding-balance calculations, and uses the shared Document Generation Service for PDF export. It does not access Firestore directly or replace the weekly Google Sheets to Looker Studio reporting pipeline.

## Finance — Sprint 09

The Finance module has been reviewed for service and repository boundaries, Firestore access, routing, type consistency, and document-generation integration. No Finance feature introduces direct UI-to-Firestore access or report-driven data mutation.
