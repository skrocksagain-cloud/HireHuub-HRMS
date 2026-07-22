# Hire Huub ERP
# System Architecture
Version: 1.0
Status: Approved

======================================================================
PURPOSE
======================================================================

This document defines the architectural blueprint of the Hire Huub ERP.

Every implementation must follow this architecture.

No implementation may bypass these rules without explicit approval.

======================================================================
ARCHITECTURE PRINCIPLES
======================================================================

The ERP follows a layered architecture.

UI

↓

Hook

↓

Service

↓

Repository

↓

Firestore

Each layer has a single responsibility.

======================================================================
ARCHITECTURE GOALS
======================================================================

Maintainability

Scalability

Reusability

Consistency

Testability

Loose Coupling

High Cohesion

======================================================================
SYSTEM OVERVIEW
======================================================================

Frontend

React

TypeScript

Vite

TailwindCSS

Backend

Firebase Authentication

Firestore Database

Google Drive Integration

State Management

TanStack Query

Validation

React Hook Form

Zod

======================================================================
PROJECT STRUCTURE
======================================================================

src/

    components/

    core/

        audit/

        auth/

        config/

        firebase/

        notifications/

        permissions/

        repositories/

        services/

        types/

        utils/

    hooks/

    layouts/

    pages/

    routes/

    services/

    types/

    utils/

======================================================================
MODULE STRUCTURE
======================================================================

Every feature module follows

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

Example

pages/

    Employee/

        components/

        hooks/

        services/

        repositories/

        types/

        validation/

        constants/

        utils/

======================================================================
ERP NAVIGATION
======================================================================

Dashboard

HRMS

    Employees

    Attendance

    Leave

    Performance

Workbench

    Network

    Recruitment

    Workforce

    Finance

Admin / Settings

======================================================================
LAYER RESPONSIBILITIES
======================================================================

UI

Responsible for

Rendering

User Interaction

Calling Hooks

Never

Firestore

Business Logic

Permission Logic

======================================================================

HOOK

Responsible for

Managing page state

Calling services

Handling mutations

Handling loading state

Never

Firestore

======================================================================

SERVICE

Responsible for

Business Rules

Validation

Permission Check

Calling repositories

Audit

Notifications

Transactions

======================================================================

REPOSITORY

Responsible for

Firestore

Queries

CRUD

Transactions

No business logic.

======================================================================

DATABASE

Responsible for

Storage

Indexes

Security Rules

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

holidays

departments

designations

users

roles

notifications

auditLogs

Future

clients

subVendors

vacancies

crm

activeBase

billing

transactions

======================================================================
MASTER DATA
======================================================================

Master Collections

Departments

Designations

Roles

Users

Holidays

All modules read from these collections.

Never duplicate master data.

======================================================================
SERVICE ARCHITECTURE
======================================================================

Shared Services

PermissionService

NotificationService

AuditService

EmployeeIdService

DocumentService

Business Services

EmployeeService

AttendanceService

LeaveService

PerformanceService

Future

ClientService

RecruitmentService

PayrollService

BillingService

======================================================================
REPOSITORY ARCHITECTURE
======================================================================

Every Service owns one Repository.

EmployeeService

↓

EmployeeRepository

AttendanceService

↓

AttendanceRepository

LeaveService

↓

LeaveRepository

PerformanceService

↓

PerformanceRepository

Repositories never call other repositories.

======================================================================
STATE MANAGEMENT
======================================================================

Server State

TanStack Query

Client State

React Context

Component State

useState

Avoid unnecessary global state.

======================================================================
FORM ARCHITECTURE
======================================================================

React Hook Form

+

Zod

Validation Layers

Client Validation

Business Validation

Permission Validation

======================================================================
PERMISSION ARCHITECTURE
======================================================================

Single Source of Truth

PermissionService

Roles

Employee

Team Leader

Admin

Finance

Super Admin

Never implement permissions inside UI.

======================================================================
AUDIT ARCHITECTURE
======================================================================

Single AuditService.

Every important action records

Module

Action

Record ID

Previous Value

New Value

Performed By

Role

Department

Timestamp

Remarks

Audit records are immutable.

======================================================================
NOTIFICATION ARCHITECTURE
======================================================================

Single NotificationService.

Channels

In-App

Email

Future

SMS

WhatsApp

======================================================================
FILE STORAGE
======================================================================

Google Drive

Employee Documents

Offer Letters

Payslips

Generated Documents

Storage handled through DocumentService.

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

Every module communicates through Services.

Never directly update another module's data.

======================================================================
SOFT DELETE
======================================================================

Business records are archived.

Fields

isArchived

archivedAt

archivedBy

Archived records are hidden by default.

======================================================================
COMMON UI COMPONENTS
======================================================================

DataTable

SummaryCard

SearchBar

FilterBar

StatusBadge

Avatar

Timeline

Pagination

Modal

ConfirmationDialog

LoadingState

EmptyState

ErrorState

Every module must reuse these components.

======================================================================
ERROR HANDLING
======================================================================

Service Layer

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

Repositories never display errors.

======================================================================
SECURITY
======================================================================

Authentication

Firebase Authentication

Authorization

PermissionService

Data

Firestore Security Rules

Never rely solely on frontend validation.

======================================================================
PERFORMANCE
======================================================================

Lazy Loading

Code Splitting

Memoization

Pagination

Optimized Queries

Reusable Components

Minimize unnecessary renders.

======================================================================
BUILD REQUIREMENTS
======================================================================

Every sprint must

Pass TypeScript

Pass ESLint

Pass

npm run build

No broken imports.

No duplicate implementations.

======================================================================
ARCHITECTURE PRINCIPLES
======================================================================

Single Source of Truth

Reuse Before Create

No Business Logic in UI

Repository Pattern

Centralized Permissions

Centralized Audit

Centralized Notifications

Shared Components

Shared Services

Soft Delete First

Build Must Pass

======================================================================
FINAL RULE
======================================================================

Every implementation must preserve the architecture.

Architecture is considered stable.

Business rules may evolve.

Architecture should not.