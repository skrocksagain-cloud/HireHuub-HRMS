# Hire Huub ERP
# HRMS Technical Specification
Version: 1.0
Status: Approved

======================================================================
DOCUMENT PURPOSE
======================================================================

This document defines the technical implementation standards for the
HRMS module.

The Business Specification defines WHAT the system should do.

This document defines HOW it should be implemented.

Every implementation must follow this specification.

======================================================================
TABLE OF CONTENTS
======================================================================

1. Document Control
2. Architecture Overview
3. Technology Stack
4. Project Structure
5. Module Structure
6. Routing
7. Firestore Architecture
8. Firestore Collections
9. Firestore Relationships
10. Repository Pattern
11. Service Layer
12. Hook Layer
13. Shared Components
14. Shared Services
15. Permission Architecture
16. Validation
17. State Management
18. File Storage
19. Audit Architecture
20. Notification Architecture
21. Search & Filter Standards
22. Pagination Standards
23. Table Standards
24. Form Standards
25. Error Handling
26. Performance Optimisation
27. Security
28. Build Standards
29. Testing Standards
30. Module Technical Specifications
31. Cross Module Integration
32. Definition of Done
33. Version History

======================================================================
ARCHITECTURE OVERVIEW
======================================================================

Architecture Pattern

UI

↓

Hook

↓

Service

↓

Repository

↓

Firestore

No component may bypass these layers.

======================================================================
TECHNOLOGY STACK
======================================================================

Frontend

React

TypeScript

Vite

TailwindCSS

Backend

Firebase Authentication

Firestore

Storage

Google Drive

Forms

React Hook Form

Validation

Zod

State

TanStack Query

======================================================================
PROJECT STRUCTURE
======================================================================

src/

pages/

components/

hooks/

core/

services/

repositories/

types/

utils/

validation/

constants/

layouts/

routes/

======================================================================
MODULE STRUCTURE
======================================================================

Every HRMS module must follow

components/

hooks/

services/

repositories/

types/

validation/

constants/

utils/

index.ts

======================================================================
ROUTING
======================================================================

/hrms

/hrms/employees

/hrms/employees/:employeeId

/hrms/attendance

/hrms/leave

/hrms/performance

Protected Routes

Lazy Loading

Route Guards

======================================================================
FIRESTORE COLLECTIONS
======================================================================

employees

attendance

leaveRequests

leaveBalances

performanceLedger

performanceTargets

bigDayCampaigns

departments

designations

holidays

notifications

auditLogs

users

roles

======================================================================
STANDARD DOCUMENT FIELDS
======================================================================

Every business document contains

id

createdAt

createdBy

updatedAt

updatedBy

isArchived

archivedAt

archivedBy

======================================================================
REPOSITORY PATTERN
======================================================================

Repositories perform

CRUD

Queries

Transactions

Pagination

Repositories never

Validate

Authorize

Notify

Audit

======================================================================
SERVICE LAYER
======================================================================

Services perform

Business Logic

Validation

Permission Checks

Audit

Notifications

Transactions

======================================================================
HOOK LAYER
======================================================================

Hooks manage

Loading

Error

Mutations

Caching

UI State

Hooks never access Firestore.

======================================================================
SHARED SERVICES
======================================================================

PermissionService

AuditService

NotificationService

DocumentService

EmployeeIdService

Every module must reuse these.

======================================================================
SHARED COMPONENTS
======================================================================

DataTable

SummaryCard

SearchBar

FilterBar

StatusBadge

Timeline

Avatar

Modal

Pagination

LoadingState

EmptyState

ErrorState

======================================================================
PERMISSION ARCHITECTURE
======================================================================

Roles

Employee

Team Leader

Admin

Finance

Super Admin

Centralized PermissionService

No permission logic inside UI.

======================================================================
VALIDATION
======================================================================

React Hook Form

Zod

Business Validation

Permission Validation

Duplicate Validation

======================================================================
STATE MANAGEMENT
======================================================================

Server State

TanStack Query

Client State

React Context

Local State

useState

======================================================================
FILE STORAGE
======================================================================

Google Drive

Employee Documents

Offer Letters

Payslips

Naming conventions follow the Business Specification.

======================================================================
AUDIT
======================================================================

AuditService

Immutable Records

All Create

Update

Archive

Approve

Reject

Manual Adjustments

======================================================================
NOTIFICATIONS
======================================================================

NotificationService

Channels

In-App

Email

Future

SMS

======================================================================
SEARCH STANDARD
======================================================================

Server-side search

Debounced search

Module-specific searchable fields only

======================================================================
FILTER STANDARD
======================================================================

Reusable FilterBar

URL-friendly filters where applicable

Reset support

======================================================================
PAGINATION
======================================================================

Server-side pagination

Default Page Size

25

Options

25

50

100

======================================================================
TABLE STANDARD
======================================================================

All tables support

Search

Filters

Sorting

Pagination

Bulk Actions

Export (if permitted)

======================================================================
FORM STANDARD
======================================================================

React Hook Form

Zod

Reusable Input Components

Field-level validation

Submission feedback

======================================================================
ERROR HANDLING
======================================================================

Pattern

try

↓

validate

↓

repository

↓

catch

↓

Audit

↓

User-friendly error

======================================================================
PERFORMANCE
======================================================================

Lazy Loading

Memoization

Code Splitting

Optimized Firestore Queries

Minimal Re-renders

======================================================================
SECURITY
======================================================================

Firebase Authentication

PermissionService

Firestore Security Rules

Never trust frontend authorization alone.

======================================================================
BUILD STANDARDS
======================================================================

Must pass

npm run build

No TypeScript errors

No ESLint errors

No duplicate code

======================================================================
TESTING
======================================================================

CRUD

Permissions

Validation

Search

Filters

Sorting

Pagination

Notifications

Audit

Integrations

Build

======================================================================
MODULE TECHNICAL SPECIFICATIONS
======================================================================

Employee Module

Attendance Module

Leave Module

Performance Module

Each module follows this document plus the
HRMS Business Specification.

======================================================================
CROSS MODULE INTEGRATION
======================================================================

Employees

↓

Attendance

↓

Leave

↓

Performance

↓

Payroll

Performance

↓

Active Base

↓

Finance

Communication occurs only through services.

======================================================================
DEFINITION OF DONE
======================================================================

Architecture Preserved

Repository Pattern Preserved

Shared Components Used

Shared Services Used

Permissions Verified

Audit Verified

Notifications Verified

Business Specification Implemented

Build Passed

No Scope Violations

======================================================================
VERSION HISTORY
======================================================================

v1.0

Initial Approved Version