# HireHuub ERP Development Constitution

Version: 1.0
Status: Active
Effective From: Sprint 02

---

# Vision

HireHuub ERP is built as an Enterprise-grade Human Resource Management System focused on scalability, maintainability, consistency, performance, and developer experience.

Every module must follow the same architecture and coding standards.

We optimize for long-term maintainability rather than short-term speed.

---

# Core Principles

1. Consistency over Cleverness
2. Readability over Complexity
3. Reusable before Duplicate
4. Business Logic outside UI
5. Small Components
6. Single Responsibility
7. Type Safety First
8. Build Must Always Pass
9. Every Sprint Ends with Git Commit & Tag
10. Architecture is Frozen During Sprint

---

# Project Structure

src/

core/
firebase/
hooks/
layouts/
lib/
pages/
routes/
services/
templates/
types/
ui/

No additional top-level folders may be created without architectural approval.

---

# Module Architecture Standard

Every business module must follow the same structure.

Example:

Module/

components/

cards/

dialogs/

forms/

shared/

tables/

ModulePage.tsx

ModuleForm.tsx

ModuleProfile.tsx

ModuleTable.tsx

ModuleColumns.tsx

constants.ts

index.ts

useModule.ts

No module may introduce its own custom structure.

---

# UI Rules

UI components are responsible only for rendering.

UI must never:

- Call Firebase directly
- Calculate Salary
- Generate IDs
- Upload Files
- Generate PDF
- Validate Business Rules

UI may only call Hooks or Engines.

---

# Business Logic Rules

Business logic belongs inside:

core/

engine/

Examples:

Salary Engine

Document Engine

Attendance Engine

Payroll Engine

Offer Engine

Employee Engine

Never place business calculations inside React Components.

---

# Validation Rules

Every module has its own validator.

Example:

core/validation/

employeeValidation.ts

offerValidation.ts

payrollValidation.ts

Business validation must never exist inside Forms.

---

# Services Rules

Services communicate only with Firebase.

Example:

services/

employee/

offer/

document/

payroll/

Services may:

Create

Read

Update

Delete

Storage Upload

Authentication

Services may NOT:

Validate Business Rules

Calculate Salary

Generate Documents

Generate IDs

---

# Templates Rules

templates/

components/

documents/

Templates are presentation only.

Templates receive data.

Templates never fetch data.

Templates never call Firebase.

---

# Type Rules

Every business entity must have one Type.

Example:

Employee.ts

Offer.ts

Department.ts

Document.ts

Payroll.ts

No duplicate interfaces.

---

# Naming Convention

Components

PascalCase

EmployeeCard.tsx

OfferTable.tsx

DocumentDashboard.tsx

Hooks

camelCase

useEmployee.ts

useOffer.ts

useDocumentDashboard.ts

Services

camelCase

employeeService.ts

offerService.ts

documentService.ts

Types

PascalCase

Employee.ts

Offer.ts

Document.ts

---

# React Rules

Always use Functional Components.

Always use TypeScript.

Always type Props.

No anonymous exported functions.

Keep components focused.

Prefer composition over large files.

---

# Folder Responsibility

core

Business Rules

services

Firebase

pages

Module Pages

components

UI

templates

Documents

types

Interfaces

ui

Reusable UI Library

hooks

React Hooks

---

# Import Order

1. React

2. Third Party Libraries

3. Types

4. Constants

5. Hooks

6. Services

7. Components

8. CSS

Maintain this order in every file.

---

# Git Workflow

master

Stable Releases

develop

Integration Branch

feature/*

Feature Development

release/*

Release Preparation

hotfix/*

Production Fixes

Never develop directly on master after Version 1.

---

# Sprint Workflow

Sprint Planning

↓

Freeze Architecture

↓

Development

↓

npm run build

↓

Fix Errors

↓

Git Commit

↓

Git Tag

↓

Merge

↓

Next Sprint

No sprint is complete until build succeeds.

---

# Build Rules

Every Sprint must finish with:

npm run build

No TypeScript errors.

No ESLint errors.

Warnings should be documented.

---

# Documentation Rules

Every Sprint must update:

Roadmap.md

Architecture.md

DevelopmentConstitution.md

Sprint-x.md

Changelog.md

Documentation is part of development.

---

# Refactoring Rules

No architecture refactoring during an active sprint.

Structural changes happen only:

Before Sprint

After Sprint

Critical Bug

---

# Code Review Checklist

Before Commit verify:

Project builds

No duplicate code

Correct folder

Correct naming

Correct imports

Type safe

No console logs

Business logic outside UI

Documentation updated

Git status clean

---

# Performance Rules

Lazy load Pages.

Reuse Components.

Memoize expensive calculations.

Avoid unnecessary renders.

No duplicated Firestore queries.

---

# Security Rules

Never expose secrets.

Never hardcode Firebase credentials.

Validate user permissions.

Validate all writes.

Sanitize uploaded data.

---

# Future Architecture

Every future module must follow this constitution.

Employees

Attendance

Payroll

Recruitment

Finance

CRM

Assets

Leaves

Reports

Analytics

AI

No exceptions.

---

# Final Rule

If a new feature conflicts with this Constitution:

Do not modify the code first.

Update this Constitution.

Review the change.

Then implement the feature.

The Constitution is the single source of truth for HireHuub ERP.