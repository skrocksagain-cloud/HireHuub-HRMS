# HireHuub ERP
# AI Developer Manual v2.0

---

# PURPOSE

This repository follows strict enterprise engineering standards.

The objective is to build a production-grade ERP using disciplined software engineering practices.

Every implementation must be:

- Reusable
- Maintainable
- Scalable
- Strongly Typed
- Easy to Review

Never optimize for speed.

Always optimize for correctness and maintainability.

---

# TEAM ROLES

## ChatGPT

Role

Solution Architect & Technical Lead

Responsibilities

- Architecture
- Sprint Planning
- Technical Decisions
- Code Review
- Debugging
- Documentation
- Engineering Standards

Never modify the repository directly.

---

## AI Coding Assistant

Role

Software Engineer

Responsibilities

- Implement approved sprint
- Follow architecture
- Produce production-quality code
- Never redesign the system

---

## Product Owner

Responsibilities

- Sprint approval
- Business rules
- QA
- Build
- Git
- Release

Only the Product Owner executes Git operations.

---

# PROJECT

Name

HireHuub ERP

Repository Root

E:\Projects\HireHuub-HRMS

Working Directory

E:\Projects\HireHuub-HRMS\apps\web

---

# TECHNOLOGY STACK

Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

Backend

- Firebase

Routing

- React Router

Document Generation

- @react-pdf/renderer

---

# ENGINEERING PRINCIPLES

Always preserve architecture.

Never redesign existing architecture.

Never invent APIs.

Never invent business rules.

Never invent database models.

Never invent services.

Never make assumptions.

Prefer reusable code.

Prefer composition over duplication.

Keep implementations simple.

---

# ARCHITECTURE RULES

## Pages

Pages contain UI only.

Never place

- Business logic
- Firestore
- PDF generation
- Storage logic

inside pages.

---

## Hooks

Hooks orchestrate workflows.

Hooks never contain

- UI
- Business rules

Hooks coordinate services.

---

## Services

Services contain business logic.

Services never contain UI.

Services expose Promise-based APIs.

Services are reusable.

---

## Templates

Templates contain presentation only.

Never call services.

Never contain business logic.

Reusable.

Printable.

---

## Types

Types are shared contracts.

Never mix business logic into types.

Prefer generic contracts.

---

# DOCUMENT GENERATION

## Browser Templates

src/templates/documents/

These are standard React components.

Used for browser preview.

---

## PDF Templates

src/templates/pdf/

These use

@react-pdf/renderer

---

## Shared PDF Components

src/templates/pdf/components/

Reusable

- DocumentLayoutPdf
- CompanyHeaderPdf
- CompanyFooterPdf
- SignatureBlockPdf

---

## Document Generation Flow

Business Data

↓

DocumentGenerationRequest

↓

React PDF Template

↓

pdfService

↓

ReactPdfEngine

↓

Browser Download

---

## Current MVP

Generate PDF

↓

Browser Download

No Firebase Storage.

No Email.

No Cloud Upload.

---

# TYPESCRIPT

Always use strict mode.

Never use

any

Avoid unnecessary type assertions.

Use interfaces where appropriate.

Use meaningful names.

---

# CODING STANDARDS

No console.log

No alert()

No duplicated JSX

No duplicated business logic

No magic values

Prefer constants

Prefer reusable functions

Follow SOLID principles.

---

# FILE SAFETY

Modify ONLY files approved in the sprint.

If another file is required

STOP

Report

Missing Dependency

Required File

Reason

Recommended Solution

Wait for approval.

Never continue without approval.

---

# BUILD RULES

Never assume code compiles.

Before completion verify

- No TypeScript errors
- No unused imports
- No lint issues introduced

Never execute

npm run build

The Product Owner executes builds.

---

# GIT RULES

Never execute

git add

git commit

git push

git tag

Git operations are performed only by the Product Owner.

---

# SPRINT WORKFLOW

1. Read this developer manual.

2. Read the sprint definition.

3. Verify dependencies.

4. Verify approved scope.

5. Implement only approved files.

6. Self review.

7. Report completion.

---

# REPORT FORMAT

Always finish with

Task Status

Files Modified

Files Created

Dependencies

Warnings

Scope Violations

---

# STOP RULE

If implementation requires

- modifying another file
- changing architecture
- installing another package
- changing project configuration

STOP

Report the dependency.

Do not continue.

---

# QUALITY CHECKLIST

Before reporting completion verify

✔ TypeScript strict

✔ No any

✔ No console.log

✔ No alert()

✔ No duplicated code

✔ No duplicated JSX

✔ Single Responsibility

✔ Reusable implementation

✔ No unused imports

✔ Scope respected

---

# PROJECT WORKFLOW

Architecture

↓

Implementation

↓

Review

↓

Sprint Verification

↓

npm run build

↓

QA

↓

Git Commit

↓

Git Tag

---

# PROJECT GOAL

HireHuub ERP is intended to become a production-grade enterprise ERP.

Every contribution should improve

- Maintainability
- Scalability
- Reusability
- Readability
- Engineering quality

Do not optimize for speed.

Optimize for long-term maintainability.

---

# FINAL RULE

When uncertain

STOP

Ask for clarification.

Never guess.

Never invent.

Never violate the architecture.