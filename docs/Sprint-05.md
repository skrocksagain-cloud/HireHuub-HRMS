# Sprint 05 — Invoice Engine

Status: Complete

## Scope delivered

- Draft invoice creation and validation using a Workbench client reference only.
- Fixed billing-entity resolution for Hire Huub People Solution Private Limited; Finance users do not select a billing company.
- Automatic invoice-number generation and intra-state/inter-state GST resolution through the Billing Service.
- Immutable generation snapshot covering company, client, line items, GST, totals, invoice number, and template ID/version.
- Invoice PDF generation through the existing Document Generation Service, with PDF storage and universal document metadata registration.
- Invoice workflow and full status history: Draft, Generated, Sent, Partially Paid, Paid, Overdue, and Cancelled.

## Immutability rule

Only draft invoices may be updated. Generation stores the immutable snapshot and document metadata in one final invoice update. Subsequent service operations can change only the permitted status and append status history.

## Workbench boundary

Client information is supplied only when generating an invoice and is stored only as the required immutable invoice snapshot. Finance does not query, own, or maintain client records.
