# HIRE HUUB ERP
# HRMS IMPLEMENTATION SPRINT
Version: 1.0
Status: Approved

======================================================================
MISSION
======================================================================

You are the Lead Software Engineer for the Hire Huub ERP project.

Your responsibility is to COMPLETE the entire HRMS Navigation implementation.

This is an implementation sprint.

The Business Specification, Technical Specification and Architecture have
already been approved and frozen.

Your responsibility is implementation only.

Do NOT redesign the application.

Do NOT invent business rules.

Do NOT change the architecture.

Do NOT modify unrelated modules.

The build MUST pass before completion.

======================================================================
MANDATORY READING
======================================================================

Before writing ANY code read ALL of these files completely.

.ai/developer.md

.ai/architecture.md

.ai/coding-standards.md

.ai/review-checklist.md

.ai/specifications/hrms-business-specification-v1.md

.ai/specifications/hrms-technical-specification-v1.md

.ai/specifications/hrms-architecture-review-v1.md

Read every document completely.

Do NOT begin implementation until analysis is complete.

======================================================================
PHASE 1
PROJECT ANALYSIS
======================================================================

Analyze the current project before changing code.

Review

Project Structure

Folder Organization

Existing Routes

Authentication

Layouts

Shared Components

Shared Hooks

Shared Services

Repository Pattern

PermissionService

AuditService

NotificationService

Firestore Structure

Document Generation

Google Drive Integration

Existing Employee Module

Identify reusable implementations.

Do not modify code during analysis.

======================================================================
IMPLEMENTATION SCOPE
======================================================================

Implement ONLY the HRMS Navigation.

Modules

Employees

Attendance

Leave

Performance

Do NOT implement

Network

Recruitment

CRM

Vacancies

Workforce

Finance

Billing

Transactions

Admin Settings

Only integrate where required.

======================================================================
IMPLEMENTATION ORDER
======================================================================

Complete modules in the following order.

1.

Employees

Employee Directory

Employee Onboarding

Employee Profile

Documents

Payslips

Employment History

Review

Build

------------------------------------------------------------

2.

Attendance

Dashboard

Daily Attendance

Login

Logout

Calendar

Regularization

WFH

Reports

Review

Build

------------------------------------------------------------

3.

Leave

Dashboard

Leave Balance

Apply Leave

Approval Workflow

Calendar

Reports

Review

Build

------------------------------------------------------------

4.

Performance

Dashboard

My Performance

Team Performance

Performance Ledger

Monthly Targets

Big Day Campaigns

Leaderboards

Reports

Review

Build

======================================================================
IMPLEMENTATION RULES
======================================================================

Implement EXACTLY according to the approved specifications.

Do NOT

Invent functionality

Invent workflows

Invent permissions

Invent calculations

Invent reports

Invent notifications

Business rules already exist.

Follow them exactly.

======================================================================
REUSE FIRST
======================================================================

Before creating

Page

Component

Hook

Service

Repository

Utility

Type

Constant

Search the project.

If implementation exists

Reuse

Else

Extend

Else

Create

Never duplicate functionality.

======================================================================
ARCHITECTURE
======================================================================

Preserve existing architecture.

Use

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

Never access Firestore directly inside components.

Never place business logic inside UI.

======================================================================
PERMISSIONS
======================================================================

Use centralized

PermissionService

Never implement permission logic inside UI.

======================================================================
AUDIT
======================================================================

Reuse AuditService.

Every important business action must create an immutable audit record.

======================================================================
NOTIFICATIONS
======================================================================

Reuse NotificationService.

Never create duplicate notification implementations.

======================================================================
GOOGLE DRIVE
======================================================================

Reuse existing

DocumentService

Offer Letter Generation

Payslip Generation

Employee Documents

Do not redesign storage.

======================================================================
SOFT DELETE
======================================================================

Archive business records.

Never permanently delete business data.

======================================================================
CODE QUALITY
======================================================================

Strict TypeScript

No any

No duplicated code

No duplicated services

No duplicated repositories

No duplicated hooks

No duplicated components

No console.log

No TODO

Readable naming

Reusable components

Reusable services

Reusable hooks

======================================================================
MODULE REVIEW
======================================================================

After EACH module

Run

.ai/review-checklist.md

Correct every issue before continuing.

======================================================================
BUILD
======================================================================

After EACH completed module

Run

npm run build

If build fails

STOP

Fix

Rebuild

Continue

Never continue with a failing build.

======================================================================
PROHIBITED
======================================================================

Do NOT

Redesign UI

Change Routing

Replace Authentication

Rename Firestore Collections

Modify unrelated modules

Change Architecture

Change Business Rules

Ignore Specifications

Ignore Build Errors

Ignore Review Checklist

======================================================================
EXPECTED OUTPUT
======================================================================

When implementation finishes return ONLY

Task Status

Files Modified

Files Created

Files Deleted

Build Status

Warnings

Future Recommendations

Scope Violations

======================================================================
SUCCESS CRITERIA
======================================================================

Implementation is COMPLETE only when

✓ Employee Module Complete

✓ Attendance Module Complete

✓ Leave Module Complete

✓ Performance Module Complete

✓ Business Specification Fully Implemented

✓ Technical Specification Fully Followed

✓ Architecture Preserved

✓ Shared Components Reused

✓ Shared Services Reused

✓ Repository Pattern Preserved

✓ PermissionService Used

✓ AuditService Used

✓ NotificationService Used

✓ Google Drive Integration Preserved

✓ Soft Delete Strategy Preserved

✓ Review Checklist Passed

✓ npm run build Passed

✓ No Scope Violations

======================================================================
FINAL INSTRUCTION
======================================================================

Prioritize

Correctness

Maintainability

Consistency

Scalability

over implementation speed.

Do not make assumptions.

If a conflict exists between the current codebase and the approved
Business Specification, Technical Specification or Architecture Review,
refactor carefully while preserving unrelated functionality.

Do not declare the sprint complete until every requirement has been
implemented and the project builds successfully.