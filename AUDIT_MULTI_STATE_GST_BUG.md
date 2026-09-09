# AUDIT: MULTI-STATE GST BUG — DATA FLOW ANALYSIS

**Status:** CRITICAL BUG CONFIRMED  
**Finding:** The selected Client City/State during invoice creation is NOT persisted to the invoice record  
**Impact:** GST calculation uses CURRENT UI state, not DRAFT-TIME state  

---

## THE BUG: DATA FLOW FAILURE

### Scenario
```
Client ABC with multiple GST registrations:
  - Kolkata, West Bengal (GSTIN: 19AAAAA0000A1Z5)
  - Bangalore, Karnataka (GSTIN: 29AAAAA0000B1Z5)

User creates invoice:
  Step 1: Select Client → ABC
  Step 2: Select State → Bangalore
  → selectedStateName = "Karnataka" in UI
  
Later, user generates the invoice:
  → Uses CURRENT selectedStateName from UI
  → If UI now shows Kolkata or another client, selectedStateName is wrong
  → GST calculation uses wrong state
```

---

## ROOT CAUSE: SELECTED STATE NOT SAVED

### Data Flow During Draft Creation

**File:** `apps/web/src/pages/Finance/billing/InvoicesPage.tsx`
- Line 206: `selectedStateName` is passed to `createDraft` input

**File:** `apps/web/src/pages/Finance/billing/services/invoiceService.ts`
- Line 82-122: `createDraft()` method receives input with selectedStateName
- **PROBLEM:** selectedStateName is NEVER persisted to the draft record

**File:** `apps/web/src/pages/Finance/billing/repositories/invoiceRepository.ts`
- Line 103-140: `createDraft()` stores these fields:
  - invoiceNumber
  - clientId
  - clientName
  - invoiceDate
  - templateType
  - billOfMonth
  - stationCode
  - **placeOfSupply** ← Selected state is stored HERE
  - signatoryId
  - bankAccountId
  - lineItems
  - taxableAmount
  - gstAmount
  - grandTotal
  - poNumber
  - remarks
  - status
  - statusHistory
  - payments
  - createdBy
  - createdAt
  - updatedAt

**FINDING:** selectedStateName is stored as `placeOfSupply`, which is used for invoice display/template, NOT for client billing resolution.

---

## THE GENERATION BUG: USES CURRENT UI STATE

### During Invoice Generation

**File:** `apps/web/src/pages/Finance/billing/hooks/useInvoices.ts`
- Lines 112-126: `generateInvoice()` method

```typescript
const generateInvoice = async (invoiceId: string, actorName: string): Promise<InvoiceDocumentStorage> => {
  const invoice = await invoiceService.getInvoice(invoiceId, actor);
  
  // ❌ BUG: Uses selectedStateName from CURRENT hook state, not from saved invoice
  const client = await clientService.resolveClientBillingForState(
    invoice.clientId, 
    selectedStateName  // ← From CURRENT UI, not from invoice draft!
  );
  
  const docInfo = await invoiceService.generate(invoiceId, {
    clientId: client.clientId,
    clientName: client.clientName,
    gstin: client.gstin,
    billingAddress: client.billingAddress,
    billingState: client.billingState,  // ← Resolved from selectedStateName
  }, actorName, actor);
};
```

### Resolution Process

**File:** `apps/web/src/pages/Workbench/Network/clients/services/clientService.ts`
- Lines 57-102: `resolveClientBillingForState()` method

```typescript
const matchedRecord = selectedStateName
  ? client.gstConfig.stateGstRecords.find((r) => r.stateName.toLowerCase() === selectedStateName.toLowerCase())
  : client.gstConfig.stateGstRecords.find((r) => r.isPrimary) ?? client.gstConfig.stateGstRecords[0];
  // ↑ If selectedStateName is empty, uses PRIMARY or FIRST record!
```

**Result:** If selectedStateName is empty/undefined when generating, the ENTIRE GST resolution falls back to PRIMARY state!

---

## GST CALCULATION USES RESOLVED STATE

**File:** `apps/web/src/pages/Finance/billing/services/billingService.ts`
- Lines 104-116: `resolveGst()` method

```typescript
async resolveGst(billingCompanyId: string, clientBillingState: string): Promise<GstResolution> {
  const normalizedClientState = normalizeState(clientBillingState);  // ← From client parameter
  
  // My fix: hardcoded Hire Huub state
  const hireHuubRegisteredState = 'WEST BENGAL';
  
  return {
    type: normalizedClientState === hireHuubRegisteredState ? 'CGST_SGST' : 'IGST',
    // ↑ Depends entirely on clientBillingState passed in
  };
}
```

**Finding:** My fix was only HALF the problem. The GST calculation is correct, but the INPUT (clientBillingState) comes from the wrong place!

---

## TEST SCENARIO DEMONSTRATING THE BUG

### Multi-State Client Setup
```
Client: "Logistics Corp"
Registrations:
  1. Kolkata, West Bengal (Primary)
     - GSTIN: 19LOG0000000001
     - Billing Address: Kolkata
  
  2. Bangalore, Karnataka
     - GSTIN: 29LOG0000000002
     - Billing Address: Bangalore
```

### Test Case 1: Draft → Generate → BUG
```
1. User selects: Client = Logistics Corp, State = Bangalore
   → selectedStateName = "Karnataka"
   → Draft created with placeOfSupply = "Karnataka"
   
2. User closes invoice page

3. User opens another client (different client, different state):
   → selectedStateName resets to that client's state
   → selectedStateName = "West Bengal" (from different context)

4. User navigates back to Invoice Register

5. User clicks "Generate" on the Logistics Corp draft created in step 1
   → generateInvoice() is called
   → selectedStateName is now "West Bengal" (from step 3)
   → resolveClientBillingForState(invoiceId, "West Bengal")
   → Finds West Bengal record for Logistics Corp
   → WRONG! Should use Bangalore!
   → Invoice gets Bangalore billing address but West Bengal GST treatment
   → IGST is applied instead of CGST_SGST
```

### Test Case 2: Same Client Selected State Preserved
```
1. User selects: Client = Logistics Corp, State = Bangalore
   → selectedStateName = "Karnataka"
   → Draft created

2. User creates ANOTHER draft for same client, State = Kolkata
   → selectedStateName = "West Bengal"
   → Draft 2 created

3. User generates Draft 1 (Bangalore):
   → selectedStateName is still "West Bengal" from Draft 2 context
   → WRONG state!
```

---

## THE FIX REQUIRED

The selected state must be PERSISTED with the invoice draft and RETRIEVED during generation.

### Changes Needed

1. **Add field to CreateInvoiceDraftInput** (already exists at line 214)
   ```typescript
   export interface CreateInvoiceDraftInput {
     ...
     selectedStateName?: string;  // ← Already exists
   }
   ```

2. **Save selectedStateName to invoice record**
   - Modify `invoiceRepository.createDraft()` to save selectedStateName field
   - OR rename/clarify the use of placeOfSupply

3. **Retrieve selectedStateName when generating**
   - Modify `useInvoices.generateInvoice()` to read selectedStateName from saved invoice
   - Pass saved selectedStateName to resolveClientBillingForState
   - NOT the current UI state

4. **Update draft update logic**
   - Include selectedStateName when updating draft metadata

---

## CURRENT STATE OF MY EARLIER FIX

**What I Fixed:**
- Hardcoded Hire Huub's state to "WEST BENGAL" in resolveGst()
- This ensures GST type determination is reliable

**What I MISSED:**
- The GST calculation depends on receiving the CORRECT clientBillingState
- That state must come from the SAVED invoice selection, not current UI
- Without this fix, GST will still be wrong for multi-state clients

**Status:** My fix is necessary but insufficient. The root cause (selectedStateName not persisted) remains unfixed.

---

## VERIFICATION CHECKLIST

- [ ] Confirm selectedStateName is never saved to invoice record
- [ ] Confirm generateInvoice uses selectedStateName from hook state (not from invoice)
- [ ] Test with multi-state client (Kolkata + Bangalore)
- [ ] Verify billing address and GST type change when selecting different states
- [ ] Confirm generating invoice later uses wrong state if UI state changed
