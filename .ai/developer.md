# Hire Huub ERP
# Developer Guidelines
Version: 1.0
Status: Approved

======================================================================
PROJECT OVERVIEW
======================================================================

Project Name

Hire Huub ERP

Tagline

The Right People. The Right Job.

Hire Huub ERP is an enterprise Human Resource and Workforce Management
system built using React, TypeScript, Firebase and Firestore.

This document defines the permanent engineering standards for the project.

These rules apply to every implementation sprint.

======================================================================
MISSION
======================================================================

Build a scalable, maintainable and enterprise-grade ERP.

Every implementation must:

- Preserve architecture
- Reuse existing code
- Avoid duplication
- Maintain consistency
- Pass production build

Never sacrifice long-term maintainability for short-term speed.

======================================================================
CORE PRINCIPLES
======================================================================

1. Existing architecture comes first.

2. Reuse before create.

3. Business logic never belongs in UI.

4. Shared services should be used whenever possible.

5. Shared components should be reused.

6. Repository Pattern is mandatory.

7. Every change must preserve build stability.

8. Every feature must respect permissions.

9. Every business action must be auditable.

10. Simplicity is preferred over cleverness.

======================================================================
PROJECT STACK
======================================================================

Frontend

React

TypeScript

Vite

TailwindCSS

State

TanStack Query

Forms

React Hook Form

Validation

Zod

Backend

Firebase Authentication

Firestore

Storage

Google Drive Integration

======================================================================
ARCHITECTURE
======================================================================

Every module follows

UI

↓

Hook

↓

Service

↓

Repository

↓

Firestore

Never bypass layers.

Never access Firestore directly from components.

======================================================================
REUSE POLICY
======================================================================

Before creating

Component

Hook

Repository

Service

Type

Utility

Search the project.

If existing implementation exists

Reuse it.

If partial implementation exists

Extend it.

Only create new code when absolutely necessary.

Avoid duplicate implementations.

======================================================================
MODULE STRUCTURE
======================================================================

Each module should contain

pages/

components/

hooks/

services/

repositories/

types/

validation/

constants/

utils/

index.ts

Maintain consistency across all modules.

======================================================================
NAMING CONVENTION
======================================================================

Pages

EmployeePage.tsx

Components

EmployeeTable.tsx

Hooks

useEmployee.ts

Repositories

employeeRepository.ts

Services

employeeService.ts

Types

Employee.ts

Validation

employeeValidation.ts

Utilities

employeeUtils.ts

Constants

employeeConstants.ts

======================================================================
CODING STANDARDS
======================================================================

Strict TypeScript

No any

No console.log

No TODO comments

Readable names

Small reusable functions

Single Responsibility Principle

SOLID Principles

Avoid deeply nested logic.

======================================================================
COMPONENT GUIDELINES
======================================================================

Components are responsible only for

Rendering

User interaction

Calling hooks

Components must never

Access Firestore

Contain business logic

Contain permission logic

======================================================================
HOOK GUIDELINES
======================================================================

Hooks coordinate UI.

Hooks call services.

Hooks never access Firestore directly.

======================================================================
SERVICE GUIDELINES
======================================================================

Services contain business rules.

Services

Validate

Authorize

Execute business logic

Call repositories

Trigger notifications

Trigger audit

======================================================================
REPOSITORY GUIDELINES
======================================================================

Repositories perform only data access.

Repositories never contain business logic.

Repositories return strongly typed data.

======================================================================
PERMISSION ARCHITECTURE
======================================================================

PermissionService is the single source of truth.

Never implement permission logic inside pages.

Roles

Employee

Team Leader

Admin

Finance

Super Admin

======================================================================
AUDIT
======================================================================

Every important business action must create
an immutable audit log.

Examples

Create

Update

Archive

Approve

Reject

Status Change

Manual Adjustment

======================================================================
NOTIFICATIONS
======================================================================

Always use NotificationService.

Never create module-specific notification implementations.

Channels

In-App

Email

======================================================================
SOFT DELETE
======================================================================

Business records are archived.

Never permanently delete business data.

Standard fields

isArchived

archivedAt

archivedBy

======================================================================
VALIDATION
======================================================================

Use

React Hook Form

Zod

Validate

Frontend

Business Rules

Permissions

======================================================================
ERROR HANDLING
======================================================================

Services

try

↓

validate

↓

repository

↓

catch

↓

log

↓

throw user-friendly error

Never expose Firestore errors directly to users.

======================================================================
GOOGLE DRIVE
======================================================================

Offer Letters

Payslips

Employee Documents

Use centralized document services.

Do not duplicate storage logic.

======================================================================
PERFORMANCE
======================================================================

Lazy loading

Memoization

Pagination

Optimized Firestore queries

Minimal re-renders

Reusable components

======================================================================
TESTING
======================================================================

Before completing any sprint verify

CRUD

Permissions

Validation

Search

Filters

Sorting

Audit

Notifications

Integrations

Build

======================================================================
BUILD
======================================================================

Every sprint must end with

npm run build

Fix all TypeScript errors.

Fix all build errors.

A sprint is never complete with a failing build.

======================================================================
IMPLEMENTATION RULES
======================================================================

Do not redesign existing UI unless requested.

Do not rename Firestore collections.

Do not modify authentication.

Do not change routing unless required.

Do not introduce breaking changes.

Preserve backwards compatibility.

======================================================================
COMPLETION REPORT
======================================================================

Every implementation must return

Task Status

Files Modified

Files Created

Files Deleted

Build Status

Warnings

Future Recommendations

Scope Violations

======================================================================
FINAL PRINCIPLE
======================================================================

Always prioritize

Correctness

Maintainability

Consistency

Scalability

over speed.

Build software that another developer can understand,
extend and maintain years from now.