# Hire Huub ERP
# Review Checklist v1.0

---

# PURPOSE

This document defines the mandatory review process for every sprint.

Every implementation, whether written by a developer or an AI assistant,
must pass every review before it can be committed.

This document represents the Definition of Done (DoD) for Hire Huub ERP.

---

# REVIEW WORKFLOW

Every sprint follows this sequence

```
Architecture Review
        │
        ▼
Code Quality Review
        │
        ▼
Build Review
        │
        ▼
Business Review
        │
        ▼
Release Review
```

Never skip a review.

---

# REVIEW 1

ARCHITECTURE REVIEW

Goal

Verify that the implementation follows the project architecture.

Checklist

□ Correct folder

□ Correct module

□ Correct layer

□ No architecture violations

□ No duplicated components

□ No duplicated services

□ No duplicated hooks

□ Correct dependency direction

□ No circular dependencies

□ Reusable implementation

Pass

YES / NO

---

# REVIEW 2

CODE QUALITY REVIEW

Goal

Verify production quality.

Checklist

□ TypeScript Strict

□ No any

□ No unknown misuse

□ No console.log

□ No debugger

□ No alert()

□ No TODO left in code

□ No FIXMEs

□ No commented dead code

□ Proper naming

□ Small functions

□ Readable code

□ No duplicated logic

□ SOLID respected

Pass

YES / NO

---

# REVIEW 3

COMPONENT REVIEW

Checklist

□ Components are reusable

□ Components contain presentation only

□ No business logic

□ Proper props

□ Strong typing

□ Proper file naming

□ Proper folder

Pass

YES / NO

---

# REVIEW 4

HOOK REVIEW

Checklist

□ Hook orchestrates workflow

□ Loading handled

□ Error handled

□ No UI rendering

□ No business rules

□ Calls services correctly

Pass

YES / NO

---

# REVIEW 5

SERVICE REVIEW

Checklist

□ Promise based

□ Reusable

□ Testable

□ No React dependency

□ No JSX

□ Proper error handling

□ Strong typing

Pass

YES / NO

---

# REVIEW 6

TYPE REVIEW

Checklist

□ Interfaces only

□ Proper generics

□ No duplicated types

□ No business logic

□ Clear naming

Pass

YES / NO

---

# REVIEW 7

PDF REVIEW

Applies only to PDF templates.

Checklist

□ Uses @react-pdf/renderer

□ Uses Document

□ Uses Page

□ Uses View

□ Uses Text

□ Uses StyleSheet

□ No HTML

□ No Tailwind

□ Reusable layout

□ Correct page size

□ Correct margins

Pass

YES / NO

---

# REVIEW 8

PERFORMANCE REVIEW

Checklist

□ No unnecessary renders

□ No duplicated API calls

□ No unnecessary state

□ Proper memoization when needed

□ Lazy loading where appropriate

□ Reusable logic

Pass

YES / NO

---

# REVIEW 9

BUILD REVIEW

Mandatory

Run

```bash
npm run build
```

Checklist

□ Build passes

□ TypeScript passes

□ Vite passes

□ No compilation errors

Warnings

Warnings are acceptable.

Errors are not.

Pass

YES / NO

---

# REVIEW 10

BUSINESS REVIEW

Checklist

□ Sprint objective completed

□ Business requirements satisfied

□ Scope completed

□ No missing feature

□ No unauthorized feature

Pass

YES / NO

---

# REVIEW 11

SECURITY REVIEW

Checklist

□ No secrets committed

□ No API keys

□ No passwords

□ No credentials

□ No unsafe code

□ No unnecessary permissions

Pass

YES / NO

---

# REVIEW 12

GIT REVIEW

Checklist

□ Conventional Commit

□ Correct branch

□ No unrelated files

□ No temporary files

□ Build passed before commit

□ Commit message follows standard

Pass

YES / NO

---

# RELEASE CHECKLIST

Before release

□ Architecture approved

□ Code approved

□ Build successful

□ QA approved

□ Git committed

□ Git pushed

□ Ready for next sprint

---

# DEFINITION OF DONE

A sprint is Done only if

✅ Architecture Review passed

✅ Code Review passed

✅ Component Review passed

✅ Hook Review passed

✅ Service Review passed

✅ Type Review passed

✅ Performance Review passed

✅ Build Review passed

✅ Business Review passed

✅ Security Review passed

✅ Git Review passed

---

# FAILURE CONDITIONS

A sprint is NOT complete if

❌ Build fails

❌ TypeScript errors exist

❌ Architecture violated

❌ Scope incomplete

❌ Unauthorized files modified

❌ Business requirements incomplete

❌ Security issue exists

---

# AI REVIEW POLICY

Every AI-generated implementation

must be reviewed before commit.

Never commit AI-generated code without review.

Review first.

Build second.

Commit third.

---

# FINAL RULE

Every sprint must improve

Hire Huub ERP.

Never sacrifice quality for speed.

If any checklist item fails

STOP

Fix

Review again

Only then proceed to commit.