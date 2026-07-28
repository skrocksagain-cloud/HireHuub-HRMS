# Sprint 04 — Billing Engine Foundation

Status: Complete

## Scope delivered

- Billing Company domain model and configuration.
- Firestore repository for Billing Company persistence and atomic invoice counters.
- Billing service for configuration validation, active-company checks, GST resolution, template resolution, and invoice-number generation.
- GST is determined exclusively by billing-company registered state versus the client billing state supplied by Workbench; no manual tax selection is exposed.
- Invoice templates are selected exclusively from the Billing Company configuration.

## Firestore collections

- `billingCompanies`: billing-company configuration.
- `billingCounters`: one atomic running sequence per billing company and financial year.

## Integration boundary

The billing layer accepts only the client billing state required for GST determination. It does not persist or duplicate client data; Workbench remains its owner.
