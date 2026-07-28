# Sprint 06 — Credit Note Engine

Status: Complete

## Scope delivered

- Draft and generated credit notes linked to an existing generated invoice.
- Full credits and partial per-line quantity credits.
- Credit-note numbering with a separate, atomic financial-year sequence.
- Immutable snapshots containing the original invoice snapshot, credited values, reason, date, generator, and template reference.
- Credit-note PDF generation through the existing Document Generation Service, with storage and universal document metadata.
- Status history and workflow: Draft, Generated, Issued, Applied, and Cancelled.

## Preservation rules

The Credit Note Service reads the generated invoice but never updates it. GST type and amounts are allocated from the original stored invoice snapshot; state comparison and GST-rate calculation are never repeated. Generated or issued non-cancelled notes are included in the per-line available-credit check.
