# HIRE HUUB ERP
# ATTENDANCE IMPLEMENTATION SPRINT
Version: 1.0
Status: Approved
Sprint: A1 – Attendance Module

======================================================================
MISSION
======================================================================

You are the Lead Software Engineer for the Hire Huub ERP project.

Your responsibility is to COMPLETE the Attendance Module implementation.

The planning phase has already been completed.

The Business Specification, Technical Specification and Architecture have
been approved and frozen.

Employee Module has already been completed.

Do NOT modify the Employee module except where Attendance integration
requires it.

Do NOT redesign the application.

Do NOT invent business rules.

Do NOT change the architecture.

Do NOT modify unrelated modules.

======================================================================
MANDATORY READING
======================================================================

Before writing ANY code, read ALL of the following documents.

.ai/developer.md

.ai/architecture.md

.ai/coding-standards.md

.ai/review-checklist.md

.ai/specifications/hrms-business-specification-v1.md

.ai/specifications/hrms-technical-specification-v1.md

.ai/specifications/hrms-architecture-review-v1.md

Do NOT begin implementation until every document has been reviewed.

======================================================================
PROJECT ANALYSIS
======================================================================

Analyze the existing project before making changes.

Review

- Existing Attendance module
- Employee module integration
- Repository pattern
- Shared components
- Shared hooks
- Shared services
- Firestore collections
- Authentication
- PermissionService
- AuditService
- NotificationService

Reuse existing implementations wherever possible.

======================================================================
IMPLEMENTATION SCOPE
======================================================================

Implement ONLY the Attendance Module.

Complete

- Attendance Dashboard
- Daily Attendance
- Login
- Logout
- Attendance Calendar
- Attendance History
- Attendance Reports
- Regularization
- WFH
- Attendance Summary
- Attendance Integration

Do NOT implement

- Leave
- Performance
- Finance
- Payroll calculations
- Recruitment
- CRM
- Workforce
- Admin modules

Only integrate with Employee where required.

======================================================================
BUSINESS RULES
======================================================================

Implement EXACTLY according to the approved HRMS Business Specification.

Including

Attendance Status

- Present
- Absent
- Late
- Half Day
- Holiday
- Week Off
- Leave
- WFH
- Regularization Pending

Attendance Dashboard

Employee Dashboard

Today's Attendance

Login Time

Logout Time

Working Hours

Current Status

Attendance Calendar

Recent Attendance

Attendance Summary

Admin Dashboard

Department Attendance

Present

Absent

Late

Half Day

Pending Regularization

Pending WFH

Super Admin Dashboard

Organization Attendance

Department Summary

Attendance Trends

Monthly Attendance

======================================================================
LOGIN
======================================================================

Employee can login once per day.

Record

Date

Time

Device

Location

Browser

Start attendance session.

Prevent duplicate login.

======================================================================
LOGOUT
======================================================================

Employee logout

Automatically calculate

Working Hours

Attendance Status

Late

Early Logout

Complete attendance session.

======================================================================
REGULARIZATION
======================================================================

Employee can submit attendance regularization.

Workflow

Employee

↓

Admin

↓

Super Admin (Escalation)

Status

Pending

Approved

Rejected

======================================================================
WFH
======================================================================

WFH belongs ONLY to Attendance.

Employee

↓

Submit WFH

↓

Admin Approval

↓

Attendance marked Present

No leave deduction.

======================================================================
HOLIDAY INTEGRATION
======================================================================

Read holidays from Holiday collection.

Automatically mark

Holiday

Week Off

======================================================================
LEAVE INTEGRATION
======================================================================

Integrate with existing Leave module interfaces only.

Do NOT implement Leave functionality.

Attendance should support

Approved Leave

↓

Attendance Status = Leave

======================================================================
PAYROLL INTEGRATION
======================================================================

Attendance provides only

Working Days

LOP Days

Late Count

Half Day Count

Attendance NEVER calculates salary.

======================================================================
SEARCH
======================================================================

Support

Employee ID

Employee Name

Department

Attendance Date

======================================================================
FILTERS
======================================================================

Department

Attendance Status

Month

Year

Date Range

======================================================================
REPORTS
======================================================================

Employee

My Attendance

Monthly Attendance

Attendance Calendar

Admin

Department Attendance

Late Report

Absent Report

Regularization Report

Super Admin

Organization Attendance

Department Summary

Attendance Trends

Export

Excel

PDF

======================================================================
PERMISSIONS
======================================================================

Reuse PermissionService.

Employee

Own Attendance

Own Calendar

Own Reports

Own Regularization

Team Leader

Assigned Recruiters

Read Only

Admin

Assigned Department

Attendance Approval

WFH Approval

Regularization Approval

Finance

Read Only

Attendance Summary

Super Admin

Full Access

======================================================================
AUDIT
======================================================================

Reuse AuditService.

Audit

Login

Logout

Regularization

Approval

Rejection

Manual Update

======================================================================
NOTIFICATIONS
======================================================================

Reuse NotificationService.

Employee

Login Success

Logout Success

Regularization Approved

Regularization Rejected

WFH Approved

WFH Rejected

Admin

New Regularization

New WFH Request

Attendance Exceptions

Super Admin

Escalated Requests

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

No Firestore access inside UI.

No business logic inside components.

======================================================================
REUSE POLICY
======================================================================

Before creating

Component

Hook

Service

Repository

Utility

Search existing project.

Reuse

↓

Extend

↓

Create

Never duplicate code.

======================================================================
QUALITY GATE
======================================================================

After implementation

Review using

.ai/review-checklist.md

Fix every issue.

Run

npm run build

Continue until build passes.

======================================================================
DO NOT
======================================================================

Do NOT

Redesign UI

Modify Employee module unnecessarily

Change routing

Change authentication

Rename Firestore collections

Duplicate services

Duplicate repositories

Duplicate components

Invent business rules

======================================================================
EXPECTED OUTPUT
======================================================================

Return ONLY

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

Sprint is COMPLETE only when

✓ Attendance Dashboard Complete

✓ Daily Attendance Complete

✓ Login Complete

✓ Logout Complete

✓ Calendar Complete

✓ Regularization Complete

✓ WFH Complete

✓ Reports Complete

✓ Search Complete

✓ Filters Complete

✓ Employee Integration Complete

✓ Leave Integration Ready

✓ Payroll Integration Ready

✓ PermissionService Used

✓ AuditService Used

✓ NotificationService Used

✓ Review Checklist Passed

✓ npm run build Passed

✓ No Scope Violations