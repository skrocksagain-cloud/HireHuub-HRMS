# Hire Huub ERP
# Coding Standards
Version: 1.0
Status: Approved

======================================================================
PURPOSE
======================================================================

This document defines the coding standards for the Hire Huub ERP.

Every developer and AI coding agent must follow these standards.

The objective is to ensure consistency, readability, maintainability,
and long-term scalability.

======================================================================
GENERAL PRINCIPLES
======================================================================

Always write code that is:

- Simple
- Readable
- Reusable
- Testable
- Maintainable

Prefer clarity over cleverness.

Write code for future developers.

======================================================================
LANGUAGE
======================================================================

Use

TypeScript (Strict Mode)

Never disable strict mode.

Never bypass type safety.

======================================================================
TYPE SAFETY
======================================================================

Avoid

any

unknown

unless absolutely necessary.

Always prefer

Interfaces

Types

Generics

Enums where appropriate.

Every public function must have explicit parameter
and return types.

======================================================================
NAMING CONVENTIONS
======================================================================

Components

PascalCase

EmployeeProfile.tsx

Pages

PascalCase

EmployeePage.tsx

Hooks

camelCase

useEmployee.ts

Services

camelCase

employeeService.ts

Repositories

camelCase

employeeRepository.ts

Types

PascalCase

Employee.ts

Validation

camelCase

employeeValidation.ts

Utilities

camelCase

employeeUtils.ts

Constants

camelCase

employeeConstants.ts

Context

PascalCase

AuthContext.tsx

======================================================================
FILE ORGANIZATION
======================================================================

One responsibility per file.

Avoid large files.

Recommended size

Components

<300 lines

Services

<300 lines

Repositories

<250 lines

Hooks

<200 lines

Split files when they become difficult to understand.

======================================================================
FUNCTIONS
======================================================================

Functions should

Do one thing.

Return early.

Avoid deep nesting.

Prefer composition over large functions.

Maximum recommended function length

50 lines

======================================================================
COMPONENTS
======================================================================

Components are responsible only for

Rendering

User interaction

Calling hooks

Components must never

Access Firestore

Contain business logic

Contain permission logic

Contain data manipulation logic

======================================================================
HOOKS
======================================================================

Hooks

Manage UI state

Call services

Handle loading

Handle errors

Never access Firestore directly.

======================================================================
SERVICES
======================================================================

Services contain

Business rules

Validation

Permission checks

Transactions

Audit calls

Notification calls

Services must not know about UI.

======================================================================
REPOSITORIES
======================================================================

Repositories perform

CRUD

Queries

Transactions

Repositories must never

Contain business logic

Contain UI logic

======================================================================
STATE MANAGEMENT
======================================================================

Use

TanStack Query

for server state.

Use

React Context

only for shared application state.

Use

useState

for local component state.

Avoid unnecessary global state.

======================================================================
FORMS
======================================================================

Always use

React Hook Form

+

Zod

Never manually validate forms
unless unavoidable.

======================================================================
ERROR HANDLING
======================================================================

Every service should follow

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

Never expose raw Firestore errors.

======================================================================
ASYNC CODE
======================================================================

Use

async / await

Avoid nested promises.

Always handle errors.

Never ignore rejected promises.

======================================================================
FIRESTORE
======================================================================

Access Firestore only through repositories.

Always use server timestamps.

Use transactions when modifying
multiple related documents.

Optimize queries.

Avoid unnecessary reads.

======================================================================
COMMENTS
======================================================================

Comments should explain

Why

not

What.

Avoid obvious comments.

Remove outdated comments.

======================================================================
IMPORTS
======================================================================

Group imports

1. React

2. Third-party libraries

3. Internal modules

4. Relative imports

Remove unused imports.

======================================================================
CODE STYLE
======================================================================

Use

Early returns

Descriptive names

Small functions

Small components

Avoid nested ternaries.

Avoid deeply nested if statements.

Extract reusable logic.

======================================================================
MAGIC VALUES
======================================================================

Never hardcode

Status values

Limits

Configuration

URLs

Store them in constants.

======================================================================
PERMISSIONS
======================================================================

Never implement permissions inside UI.

Always use

PermissionService

======================================================================
AUDIT
======================================================================

Every business action must use

AuditService

Never write audit logic manually.

======================================================================
NOTIFICATIONS
======================================================================

Always use

NotificationService

Never duplicate notification logic.

======================================================================
SOFT DELETE
======================================================================

Archive business records.

Never permanently delete
unless explicitly required.

======================================================================
GOOGLE DRIVE
======================================================================

Always use centralized
DocumentService.

Never duplicate storage logic.

======================================================================
REUSABILITY
======================================================================

Before creating

Component

Hook

Service

Repository

Utility

Type

Search the project.

Reuse

↓

Extend

↓

Create

Never duplicate existing functionality.

======================================================================
PERFORMANCE
======================================================================

Prefer

Lazy Loading

Memoization

Pagination

Optimized Firestore Queries

Reusable Components

Minimize unnecessary renders.

======================================================================
TESTING CHECKLIST
======================================================================

Before completion verify

TypeScript

ESLint

CRUD

Validation

Permissions

Audit

Notifications

Search

Filters

Sorting

Pagination

Build

======================================================================
BUILD
======================================================================

Every implementation must pass

npm run build

Fix all build errors.

Fix all TypeScript errors.

Never submit a broken build.

======================================================================
PROHIBITED
======================================================================

Do NOT

Use any unnecessarily

Duplicate code

Duplicate components

Duplicate services

Duplicate repositories

Duplicate hooks

Access Firestore from UI

Write business logic in components

Disable TypeScript checks

Ignore lint warnings

Leave TODO comments

Leave console.log statements

======================================================================
DEFINITION OF DONE
======================================================================

Code is considered complete only when

✓ Readable

✓ Reusable

✓ Typed

✓ Validated

✓ Permission protected

✓ Audited

✓ Build passes

✓ No duplicated logic

✓ No scope violations

======================================================================
FINAL PRINCIPLE
======================================================================

Write code that another developer can
understand within five minutes.

Optimize for maintainability,
not cleverness.