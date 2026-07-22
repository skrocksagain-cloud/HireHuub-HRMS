# Hire Huub ERP
# HRMS Business Specification
Version: 1.0
Status: Approved
Document Type: Business Specification
Module: Human Resource Management System (HRMS)

---

# PART 1
## Document Control, HRMS Overview, Roles & Permissions, Employee Module

---

# 1. Document Control

| Item | Value |
|------|-------|
| Project | Hire Huub ERP |
| Module | HRMS |
| Version | 1.0 |
| Status | Approved |
| Document Owner | Hire Huub |
| Prepared By | Business & Product Team |
| Implementation Status | Ready |
| Last Updated | July 2026 |

---

# 2. Purpose

This document defines the complete business requirements for the Human Resource Management System (HRMS).

The purpose of this document is to ensure every implementation follows the approved business rules without assumptions or undocumented functionality.

This specification is the single source of truth for the HRMS module.

---

# 3. Scope

This specification covers:

- Employee Management
- Attendance Management
- Leave Management
- Performance Management

Future modules such as Recruitment, Network, Workforce, Finance, Payroll, CRM and Settings are outside the scope of this document.

---

# 4. Business Objectives

The HRMS shall provide:

- Complete employee lifecycle management
- Centralized employee records
- Attendance tracking
- Leave management
- Recruiter performance management
- Role-based access control
- Audit trail
- Notifications
- Reporting
- Integration with Payroll
- Integration with Document Generation

---

# 5. User Roles

The HRMS supports five primary roles.

## 5.1 Employee

Employees can:

- View their own profile
- Update permitted personal information
- View attendance
- View leave balance
- Apply leave
- View performance
- View documents
- Download payslips

Employees cannot:

- Modify salary
- Modify employment details
- Approve leave
- Access other employee records

---

## 5.2 Team Leader

Team Leaders can:

- View assigned recruiters
- View team performance
- View attendance of assigned recruiters
- View leave status
- View yearly team achievement

They cannot:

- Change employee master data
- Modify salary
- Change billing status

---

## 5.3 Admin

Admin access is department-based.

Admin can:

- Manage employees of assigned departments
- Approve attendance
- Approve leave
- Upload employee documents
- Manage onboarding
- Generate reports
- Modify salary during increment
- View department dashboards

Admin cannot:

- Access other departments
- Change billing status
- Modify system settings

---

## 5.4 Finance

Finance users can:

- View payroll information
- Generate payslips
- Mark candidates as Billed / Non Billed
- View finance reports

Finance cannot:

- Edit employee master information
- Approve leave
- Modify attendance

---

## 5.5 Super Admin

Super Admin has unrestricted access.

Can perform:

- Employee management
- Attendance
- Leave
- Performance
- Reports
- Finance
- Billing
- System configuration
- Permission management

---

# 6. HRMS Navigation

The HRMS navigation consists of the following modules.

HRMS

- Employees
- Attendance
- Leave
- Performance

Future modules will integrate into the ERP but are not part of HRMS v1.0.

---

# 7. Employee Module

## Purpose

The Employee Module acts as the master record for every employee in the organization.

All other HRMS modules depend on Employee records.

---

# 8. Employee Directory

The Employee Directory shall display all employees based on user permissions.

Directory includes:

- Employee ID
- Employee Name
- Department
- Designation
- Reporting Manager
- Mobile Number
- Employment Status
- Joining Date
- Confirmation Date

---

## Summary Cards

Display:

- Total Employees
- Active Employees
- Notice Period Employees
- Relieved Employees

---

## Search

Search is limited to:

- Employee ID
- Employee Name
- Mobile Number

---

## Filters

Users can filter by:

- Department
- Designation
- Reporting Manager
- Employment Status
- Joining Month

---

## Sorting

Support sorting by:

- Employee ID
- Employee Name
- Joining Date
- Department
- Designation

---

# 9. Employee ID

Employee IDs are generated automatically.

Format

HH0001

HH0002

HH0003

Rules

- Immutable
- Sequential
- Auto-generated
- Never editable
- Firestore document ID remains unchanged

---

# 10. Employee Status

Allowed values

- Active
- Probation
- Confirmed
- Notice Period
- Relieved

No additional status values are permitted.

---

# 11. Confirmation Policy

Confirmation Date is automatically calculated.

Rule

Joining Date + 180 Days

Confirmation remains editable by Admin and Super Admin if required.

---

# 12. Employee Profile

The employee profile consists of:

## Left Profile Card

Displays:

- Photo
- Employee ID
- Name
- Department
- Designation
- Reporting Manager
- Employment Status

---

## Tabs

### Overview

Displays

- Employment Summary
- Attendance Summary
- Leave Summary
- Performance Summary
- Last Login
- Last Activity

If never logged in

Display

Never Logged In

If account locked

Display

Account Locked

---

### Personal

Contains

- Personal Details
- Contact Information
- Address
- Government IDs

---

### Official

Contains

- Employment Information
- Department
- Designation
- Reporting Manager
- Confirmation Date

---

### Bank

Contains

- Bank Name
- Account Number
- IFSC
- Branch

---

### Emergency

Contains

- Emergency Contact
- Relationship
- Mobile Number

---

# 13. Employee Documents

Employee documents are uploaded manually.

Generated automatically

- Offer Letter
- Payslip

Uploaded manually

- PAN
- Aadhaar
- Resume
- Education
- Experience
- Identity Proof
- Address Proof
- Other Documents

---

# 14. Employment History

Employment History maintains:

## Confirmation Events

Stores:

- Confirmation Date
- Updated By
- Updated On

---

## Salary Revisions

Stores:

- Revision Date
- Previous Salary
- New Salary
- Remarks

Salary can be modified only by:

- Admin (Assigned Department)
- Super Admin

---

## Exit Process

Stores

- Resignation Date
- Last Working Day
- Exit Reason
- Exit Status

---

## Service Duration

Automatically calculates

Joining Date

↓

Relieving Date

↓

Total Service Duration

---

# 15. Employee Permissions

Employee

Own profile only

Team Leader

Assigned recruiters only

Admin

Assigned departments only

Finance

Finance related information only

Super Admin

Complete access

---

# 16. Employee Audit

Every employee action creates an immutable audit record.

Audit events include:

- Create
- Update
- Archive
- Salary Revision
- Confirmation
- Exit
- Document Upload

---

# 17. Employee Notifications

Generate notifications for:

- New Employee Created
- Confirmation Due
- Confirmation Completed
- Salary Revision
- Document Upload
- Exit Initiated
- Exit Completed

---

# 18. Employee Integration

Employee module integrates with:

Attendance

Provides:

- Employee Master

Leave

Provides:

- Employee Details

Performance

Provides:

- Recruiter Information

Payroll

Provides:

- Salary Structure
- Bank Details

Document Generation

Provides:

- Employee Information
- Offer Letter
- Payslips

---

# End of Part 1

The next section (**Part 2**) covers the complete **Attendance Module Business Specification**, including dashboards, attendance workflow, regularization, Work From Home (WFH), reports, permissions, notifications, integrations, and all approved business rules.

# PART 2
## Attendance Module Business Specification

---

# 19. Attendance Module

## Purpose

The Attendance Module records daily employee attendance, login/logout activities, working hours, attendance status, Work From Home (WFH), attendance regularization and attendance reporting.

Attendance integrates with Employee, Leave and Payroll modules.

Attendance is the source of truth for employee presence.

---

# 20. Attendance Dashboard

The Attendance Dashboard varies according to user role.

---

## Employee Dashboard

Display

- Today's Attendance Status
- Login Time
- Logout Time
- Working Hours
- Current Attendance Status
- Monthly Attendance Summary
- Attendance Calendar
- Recent Attendance History
- Pending Regularization Requests
- Pending WFH Requests

---

## Admin Dashboard

Display

- Department Attendance Summary
- Present Employees
- Absent Employees
- Late Employees
- Half Day Employees
- Pending Regularization
- Pending WFH Requests
- Today's Attendance Trend

---

## Super Admin Dashboard

Display

- Organization Attendance
- Department-wise Attendance
- Monthly Attendance Trend
- Attendance Analytics
- Employee Attendance Summary
- Attendance Exceptions

---

# 21. Daily Attendance

Attendance shall be recorded daily.

Each attendance record stores

- Employee
- Date
- Login Time
- Logout Time
- Working Hours
- Attendance Status
- Device Information
- Browser Information
- Location
- Remarks

---

# 22. Attendance Status

Allowed attendance statuses

- Present
- Absent
- Late
- Half Day
- Holiday
- Week Off
- Leave
- Work From Home (WFH)
- Regularization Pending

No additional statuses are permitted.

---

# 23. Employee Login

Employees can login only once per working day.

Record

- Date
- Time
- Device
- Browser
- Location

System starts the attendance session.

Duplicate login is not permitted.

---

# 24. Employee Logout

Logout completes the attendance session.

System automatically calculates

- Working Hours
- Attendance Duration
- Logout Time

Attendance status is finalized after logout.

---

# 25. Working Hours

System calculates

Working Hours

=

Logout Time

-

Login Time

Working hours are displayed on

- Dashboard
- Attendance History
- Reports

Payroll uses working days only.

Payroll calculation is outside the Attendance module.

---

# 26. Attendance Calendar

Employees can view attendance in calendar format.

Calendar displays

- Present
- Leave
- Holiday
- Week Off
- Absent
- WFH
- Half Day

Selecting a date displays attendance details.

---

# 27. Attendance History

Employees can view complete attendance history.

History includes

- Date
- Login
- Logout
- Working Hours
- Attendance Status
- Remarks

---

# 28. Attendance Regularization

Employees can submit attendance regularization requests.

Examples

- Missed Login
- Missed Logout
- Incorrect Attendance
- System Error

Employee provides

- Date
- Reason
- Supporting Remarks

---

## Regularization Workflow

Employee

↓

Submit Request

↓

Admin Review

↓

Approve / Reject

↓

Super Admin (Escalation if required)

---

## Regularization Status

Allowed values

- Pending
- Approved
- Rejected

---

# 29. Work From Home (WFH)

WFH belongs ONLY to the Attendance Module.

WFH is NOT considered Leave.

Approved WFH

↓

Attendance Status

=

WFH

No Leave Balance deduction occurs.

---

## WFH Workflow

Employee

↓

Submit Request

↓

Admin Approval

↓

Attendance Updated

---

WFH does not affect Leave Balance.

---

# 30. Holiday Management

Attendance reads holidays from the Holiday Master.

Holiday records are maintained separately.

Attendance automatically marks

- Holiday
- Week Off

Employees cannot modify holidays.

---

# 31. Attendance Search

Search supports

- Employee ID
- Employee Name
- Attendance Date

---

# 32. Attendance Filters

Attendance supports filtering by

- Department
- Attendance Status
- Month
- Year
- Date Range

---

# 33. Attendance Reports

---

## Employee Reports

- Monthly Attendance
- Attendance Calendar
- Attendance History
- Working Hours Summary

---

## Admin Reports

- Department Attendance
- Daily Attendance
- Late Report
- Absent Report
- Half Day Report
- Regularization Report
- WFH Report

---

## Super Admin Reports

- Organization Attendance
- Department Summary
- Attendance Trends
- Attendance Analytics
- Monthly Summary

Reports support

- Excel Export
- PDF Export

---

# 34. Attendance Permissions

---

## Employee

Can

- View Own Attendance
- View Calendar
- View History
- Submit Regularization
- Submit WFH

Cannot

- Approve Requests
- Modify Attendance

---

## Team Leader

Can

- View Assigned Recruiters
- View Attendance

Cannot

- Approve Attendance

---

## Admin

Can

- View Assigned Department
- Approve Regularization
- Approve WFH
- Update Attendance (Manual Correction)

---

## Finance

Read Only

Can view attendance summary for payroll reference.

Cannot modify attendance.

---

## Super Admin

Full attendance access.

Can

- Approve
- Reject
- Modify
- View Reports
- Manage Attendance

---

# 35. Attendance Audit

Every attendance action creates an immutable audit record.

Audit includes

- Login
- Logout
- Regularization Submitted
- Regularization Approved
- Regularization Rejected
- WFH Submitted
- WFH Approved
- WFH Rejected
- Manual Attendance Update

---

# 36. Attendance Notifications

Employee receives

- Login Successful
- Logout Successful
- Regularization Approved
- Regularization Rejected
- WFH Approved
- WFH Rejected

Admin receives

- New Regularization Request
- New WFH Request
- Attendance Exceptions

Super Admin receives

- Escalated Attendance Requests

---

# 37. Attendance Integration

---

## Employee Module

Uses Employee Master.

Displays Attendance Summary inside Employee Profile.

---

## Leave Module

Approved Leave

↓

Attendance Status

=

Leave

Attendance does NOT manage Leave Balance.

---

## Payroll Module

Attendance provides

- Working Days
- Late Count
- Half Day Count
- LOP Days

Attendance NEVER calculates salary.

---

# 38. Attendance Business Rules

- Employee can login once per day.
- Duplicate login is not permitted.
- Logout finalizes attendance.
- WFH belongs only to Attendance.
- Approved Leave updates Attendance Status.
- Attendance never modifies Leave Balance.
- Attendance never performs payroll calculation.
- Attendance history is immutable except authorized manual correction.
- Every attendance change must create an audit record.

---

# End of Part 2

The next section (**Part 3**) covers the complete **Leave Module Business Specification**, including leave types, leave credit, carry forward, approval workflow, leave balance, reports, notifications, permissions, payroll integration and all approved business rules.

# PART 3
## Leave Module Business Specification

---

# 39. Leave Module

## Purpose

The Leave Module manages employee leave applications, leave balances,
approvals, carry forward, leave history and leave reporting.

The Leave Module integrates with Employee, Attendance and Payroll.

Leave is the single source of truth for employee leave records.

---

# 40. Leave Dashboard

The Leave Dashboard varies according to user role.

---

## Employee Dashboard

Display

- Leave Balance
- Upcoming Leave
- Pending Leave Requests
- Approved Leave
- Rejected Leave
- Leave Calendar
- Leave History
- Monthly Leave Summary

---

## Admin Dashboard

Display

- Department Leave Summary
- Pending Approvals
- Today's Employees on Leave
- Upcoming Leave
- Leave Trends

---

## Super Admin Dashboard

Display

- Organization Leave Summary
- Department Leave Summary
- Leave Analytics
- Leave Trends
- Leave Utilization

---

# 41. Leave Types

| Leave Type | Annual Limit |
|------------|-------------:|
| Casual Leave (CL) | 10 |
| Sick Leave (SL) | 14 |
| Earned Leave (EL) | 14 |
| Loss of Pay (LOP) | Unlimited |
| Work From Home (WFH) | Not counted as Leave |
| Compensatory Off (Comp Off) | As Earned |

---

## Leave Purpose

### Casual Leave

Personal work.

---

### Sick Leave

Medical illness.

---

### Earned Leave

Long leave.

---

### Loss of Pay

Applied when leave balance is unavailable.

Salary deduction occurs during payroll.

---

### Work From Home

Handled ONLY by Attendance Module.

WFH is NOT Leave.

---

### Comp Off

Granted when an employee works on

- Sunday
- Company Holiday

Comp Off is earned only after approval.

---

# 42. Leave Credit

Leave credit occurs

Monthly

Credit Timing

Option A

Annual entitlement divided by 12.

Leave credited every month.

Example

CL

10

↓

10 / 12

↓

0.83 per month

Same applies to

SL

EL

---

# 43. Leave Balance

Leave Balance displays

- Casual Leave
- Sick Leave
- Earned Leave
- Comp Off
- LOP
- Total Balance

---

# 44. Carry Forward

Carry Forward

Enabled

Maximum Carry Forward

30 Days

Expiry

As per applicable labour laws.

Leave Encashment

Not Allowed.

---

# 45. Probation Policy

During Probation

Employee

Cannot apply

- Casual Leave

Cannot apply

- Earned Leave

Allowed

- Sick Leave

If leave is not approved

Attendance becomes

LOP

---

# 46. Sandwich Rule

Weekend between leave

Does NOT count as leave.

Sandwich Rule

Disabled.

---

# 47. Half Day Leave

Not supported.

Employees may apply

Full Day Leave only.

---

# 48. Backdated Leave

Employee may apply leave

After returning.

Maximum

2 Days

Approval

Within limit

↓

Admin

More than limit

↓

Super Admin

---

# 49. Future Leave

Future leave may be applied

Maximum

One Day in Advance

Leave cannot exceed available balance.

---

# 50. Leave Application

Employee submits

- Leave Type
- Start Date
- End Date
- Reason
- Attachment (if required)

System validates

- Leave Balance
- Overlapping Leave
- Eligibility

---

# 51. Leave Validation

Before submission

System validates

- Leave Balance
- Leave Type
- Probation Policy
- Duplicate Leave
- Overlapping Leave

If overlapping leave exists

Warn Admin.

Do not automatically reject.

---

# 52. Medical Certificate

Medical Certificate required

When

Sick Leave

>= 3 Days

Certificate uploaded with leave request.

---

# 53. Leave Workflow

Employee

↓

Submit Leave

↓

Admin Approval

↓

Approved

or

Rejected

Escalation

↓

Super Admin

---

# 54. Leave Status

Allowed Status

- Draft
- Pending
- Approved
- Rejected
- Cancelled

No additional statuses permitted.

---

# 55. Approval SLA

Leave Approval SLA

3 Days

Pending requests must be resolved

One day before the last day of the month.

---

# 56. Leave Approval

Admin

Approves

Assigned Department

Super Admin

Approves

Escalated Requests

Organization-wide Requests

---

# 57. Leave Cancellation

Employee

Can cancel

Before Approval.

Approved Leave

Can be withdrawn only by

Admin

or

Super Admin

---

# 58. Leave Calendar

Displays

- Approved Leave
- Pending Leave
- Holidays
- Week Off

Supports

Monthly View

---

# 59. Leave History

Employee can view

Complete Leave History

Includes

- Leave Type
- Dates
- Status
- Approver
- Remarks

History is immutable.

---

# 60. Leave Reports

## Employee

- Leave Balance
- Leave History
- Leave Summary

---

## Admin

- Department Leave
- Pending Approvals
- Leave Utilization
- Leave Balance Report

---

## Super Admin

- Organization Leave
- Department Leave
- Leave Trends
- Carry Forward Report
- Leave Analytics

Reports support

- Excel
- PDF

---

# 61. Notifications

Employee

Receives

- Leave Submitted
- Leave Approved
- Leave Rejected
- Leave Cancelled
- Leave Balance Credited
- Carry Forward Completed

---

Admin

Receives

- New Leave Request
- Leave Cancellation
- Pending SLA Reminder

---

Super Admin

Receives

- Escalated Leave Requests
- SLA Breach Alerts

---

# 62. Permissions

## Employee

Can

- Apply Leave
- View Leave
- Cancel Pending Leave

Cannot

- Approve Leave
- Modify Balance

---

## Team Leader

Read Only

Assigned Recruiters

---

## Admin

Can

- Approve Leave
- Reject Leave
- Withdraw Approved Leave

Cannot

Modify Leave Balance

---

## Finance

Read Only

Leave Summary

Payroll Reference

---

## Super Admin

Full Access

Can

- Adjust Leave Balance
- Approve
- Reject
- Withdraw
- Manage Carry Forward

---

# 63. Audit Trail

Every leave action creates an immutable audit record.

Audit includes

- Apply
- Approve
- Reject
- Cancel
- Withdraw
- Balance Adjustment
- Carry Forward

---

# 64. Payroll Integration

Leave provides

- Approved Leave
- LOP Days
- Carry Forward

Payroll performs

Salary Calculation

Leave NEVER calculates salary.

---

# 65. Attendance Integration

Approved Leave

↓

Attendance Status

=

Leave

WFH remains under Attendance Module.

---

# 66. Employee Integration

Employee Profile displays

- Leave Balance
- Leave History
- Leave Summary

---

# 67. Business Rules

- Leave credited monthly.
- Carry Forward maximum 30 days.
- No Leave Encashment.
- Weekend does not count as leave.
- No Half-Day Leave.
- Backdated Leave maximum 2 days.
- Future Leave maximum one day in advance.
- Medical Certificate required for Sick Leave of 3 days or more.
- Leave overlaps generate warnings.
- Leave Balance adjustments only by Super Admin.
- WFH belongs only to Attendance.
- Payroll consumes Leave data but Leave never calculates payroll.
- Every leave action must be audited.

---

# End of Part 3

The next section (**Part 4**) covers the complete **Performance Module Business Specification**, including point calculation, targets, incentive policy, Big Day campaigns, leaderboards, Active Base integration, reports, dashboards, permissions, notifications, audit trail and all approved business rules.

# PART 4
## Performance Module Business Specification

---

# 68. Performance Module

## Purpose

The Performance Module measures recruiter productivity, target achievement,
performance points, incentives and organizational performance.

Performance integrates with

- Employee
- Active Base
- Payroll

Performance is the single source of truth for recruiter performance.

---

# 69. Performance Dashboard

Dashboard varies according to user role.

---

## Recruiter Dashboard

Display

- Monthly Target
- Points Achieved
- Remaining Target
- Active Candidates
- Incentive Earned
- Performance Trend
- Big Day Widget
- Top 10 Leaderboard
- Own Rank

---

## Team Leader Dashboard

Display

- Assigned Recruiters
- Team Target
- Team Achievement
- Team Trend
- Team Leaderboard
- Yearly Target vs Achievement

Only assigned recruiters are visible.

---

## Admin Dashboard

Display

- Department Target
- Department Achievement
- Department Trend
- Recruiter Ranking
- Yearly Target vs Achievement

---

## Super Admin Dashboard

Display

- Organization Target
- Organization Achievement
- Department Performance
- Big Day Performance
- Top Recruiters
- Top Departments
- Top Cities
- Monthly Trend
- Quarterly Trend
- Yearly Trend

---

# 70. Monthly Target

Targets are assigned every month.

Targets are assigned by

- Admin
- Super Admin

Target Types

- Recruiter Target
- Team Target
- Department Target

Target achievement is measured monthly.

---

# 71. Performance Ledger

Performance Ledger stores every point transaction.

Each entry includes

- Recruiter
- Client
- City
- Candidate
- Activation Date
- Points
- Incentive Status
- Ledger Date

Ledger entries are immutable.

---

# 72. Point Calculation

Points are awarded when

Recruiter marks Candidate

Active.

Points are calculated

ONLY

according to Client.

City is stored

for reporting only.

City NEVER changes point calculation.

---

# 73. Active Candidate Rule

Candidate becomes

Active

↓

Performance Ledger Entry Created

↓

Points Awarded

Performance is linked to Active Base.

Performance never modifies Active Base.

---

# 74. Incentive Policy

Incentive is NOT earned immediately.

Eligibility occurs only after

Candidate completes the client retention period.

After completion

↓

Incentive becomes

Earned

↓

Paid in the next month's salary.

---

# 75. Candidate Resignation Rule

If candidate resigns before retention period

Points remain.

Incentive becomes

Not Eligible.

Historical performance remains unchanged.

---

# 76. Incentive Status

Allowed values

- Pending
- Eligible
- Earned
- Paid
- Cancelled

No additional values permitted.

---

# 77. Client Point Matrix

Every Client has an approved point value.

Example

Client A

10 Points

Client B

20 Points

Client C

15 Points

Point values are configurable.

---

# 78. Active Base Integration

Performance integrates with

Active Base.

Active Base provides

- Candidate Activation
- Client
- City
- Recruiter

Performance creates

Performance Ledger Entry

Points

Performance Summary

Performance never edits Active Base.

---

# 79. Billing Status

Billing Status belongs to

Active Base.

Allowed values

- Non Billed
- Billed

Rules

Visible ONLY to

- Finance
- Super Admin

Editable ONLY by

- Finance
- Super Admin

Billing Status

Never changes automatically.

Performance module treats Billing Status as

Read Only.

---

# 80. Performance Summary

Displays

- Monthly Target
- Points Achieved
- Remaining Target
- Active Candidates
- Incentive Earned
- Incentive Pending
- Performance Trend

Displayed inside

Employee Profile.

---

# 81. Leaderboard

Display

Top 10 Recruiters

+

Current Recruiter's Own Rank

Leaderboard resets

Monthly.

Leaderboard History remains permanently available.

---

# 82. Big Day Campaigns

Big Day allows

Bonus Point Campaigns.

Only

Super Admin

can configure.

Campaign contains

- Start Date
- End Date
- Eligible Clients
- Bonus Points

---

# 83. Big Day History

Maintain complete history of

- Campaign
- Recruiters
- Bonus Points
- Results

History cannot be modified.

---

# 84. Reports

---

## Recruiter Reports

Display

- Monthly Performance
- Monthly Points
- Active Candidates
- Client Performance
- Monthly Target Achievement
- Big Day Performance

Do NOT display

- Incentive Eligible Candidates
- Incentive Pending Candidates

Recruiter can view

Own Incentive Amount only.

---

## Team Leader Reports

Display

- Team Performance
- Recruiter Comparison
- Team Target Achievement
- Active Candidates
- Yearly Target vs Achievement

Do NOT display

- Incentive Eligible Candidates
- Incentive Pending Candidates

---

## Admin Reports

Display

- Department Performance
- Recruiter Ranking
- Department Trend
- Yearly Target vs Achievement

---

## Super Admin Reports

Display

- Organization Performance
- Department Ranking
- Client Performance
- City Performance
- Monthly Trend
- Quarterly Trend
- Yearly Trend
- Big Day History
- Incentive Liability
- Performance Ledger

Reports support

- Excel Export
- PDF Export

---

# 85. Notifications

Recruiter receives

- Target Assigned
- Incentive Earned
- Big Day Started
- Big Day Completed

Do NOT notify

Eligible

Paid

Only notify

Earned Amount.

---

Team Leader receives

- Team Target Assigned
- Team Achievement

---

Admin receives

- Department Target Completed
- Big Day Results

---

Super Admin receives

- Organization Performance
- Big Day Summary
- Monthly Performance Summary

---

# 86. Permissions

---

## Recruiter

Can

- View Own Performance
- View Own Incentive
- View Own Reports

Cannot

Modify Performance

---

## Team Leader

Can

- View Assigned Recruiters
- View Team Reports

Cannot

Modify Performance Ledger

---

## Admin

Can

- Assign Targets
- View Department Reports
- Adjust Points

Cannot

Modify Billing Status

---

## Finance

Can

View

Billing Status

Modify

Billing Status

View

Payroll Incentives

Cannot

Modify Performance Points

---

## Super Admin

Full Access

Can

- Assign Targets
- Adjust Points
- Configure Big Day
- Modify Billing Status
- View All Reports

---

# 87. Audit Trail

Every performance action creates an immutable audit record.

Audit includes

- Target Assignment
- Point Adjustment
- Big Day Configuration
- Ledger Entry
- Incentive Status Change
- Manual Changes

---

# 88. Payroll Integration

Performance provides

- Points
- Incentive Status
- Incentive Amount

Payroll performs

Salary Calculation

Performance never calculates payroll.

---

# 89. Employee Integration

Employee Profile displays

- Performance Summary
- Monthly Target
- Points
- Incentive Earned

---

# 90. Business Rules

- Points awarded only when candidate becomes Active.
- Points depend only on Client.
- City never changes points.
- Targets assigned monthly.
- Performance Ledger is immutable.
- Candidate resignation retains points but removes incentive eligibility.
- Incentives paid with next month's salary.
- Billing Status belongs to Active Base.
- Billing Status visible/editable only by Finance and Super Admin.
- Billing Status never changes automatically.
- Recruiters see Top 10 leaderboard plus their own rank.
- Leaderboard resets monthly while preserving history.
- Big Day configured only by Super Admin.
- Recruiters and Team Leaders do not see Incentive Eligible or Incentive Pending reports.
- Every performance action must create an audit record.

---

# End of Part 4

The next section (**Part 5**) completes the HRMS Business Specification with:

- Cross Module Integration
- Notification Framework
- Audit Framework
- Reporting Standards
- Dashboard Standards
- Global Business Rules
- Acceptance Criteria
- Version History

This completes the **HRMS Business Specification v1.0**.

# PART 5
## Cross Module Integration, Notifications, Audit, Reports, Global Business Rules, Acceptance Criteria

---

# 91. Cross Module Integration

The HRMS modules are tightly integrated while maintaining clear ownership.

No module shall directly modify another module's business data.

Communication shall occur through approved services only.

---

## Employee → Attendance

Employee Module provides

- Employee Master
- Department
- Designation
- Reporting Manager
- Employment Status

Attendance consumes Employee information.

Attendance never modifies Employee records.

---

## Employee → Leave

Employee Module provides

- Employee Master
- Department
- Reporting Manager
- Employment Status

Leave consumes Employee information.

Leave never modifies Employee records.

---

## Employee → Performance

Employee Module provides

- Recruiter Information
- Department
- Reporting Manager

Performance consumes Employee information.

Performance never modifies Employee records.

---

## Attendance → Leave

Approved Leave automatically updates Attendance Status.

Attendance Status

=

Leave

Attendance remains responsible for attendance records.

Leave remains responsible for leave records.

---

## Attendance → Payroll

Attendance provides

- Working Days
- Late Count
- Half Day Count
- Loss of Pay Days

Payroll performs salary calculation.

Attendance never performs salary calculation.

---

## Leave → Payroll

Leave provides

- Approved Leave
- Carry Forward
- Loss of Pay

Payroll performs salary calculation.

Leave never performs payroll calculation.

---

## Performance → Payroll

Performance provides

- Incentive Amount
- Incentive Status
- Performance Points

Payroll performs incentive payment.

Performance never performs salary calculation.

---

## Performance → Active Base

Candidate Activated

↓

Performance Ledger

↓

Points Awarded

Performance never modifies Active Base.

---

## Finance → Active Base

Finance manages

Billing Status

Performance only reads Billing Status.

---

# 92. Notification Framework

Notifications are generated using a centralized Notification Service.

Notification Channels

- In-App
- Email

Future

- SMS
- WhatsApp

---

## Employee Notifications

Employee receives

- Employee Created
- Confirmation Due
- Confirmation Completed
- Attendance Login
- Attendance Logout
- Attendance Approval
- WFH Approval
- Leave Submitted
- Leave Approved
- Leave Rejected
- Leave Cancelled
- Leave Balance Credited
- Carry Forward Completed
- Incentive Earned
- Big Day Started
- Big Day Completed
- Payslip Generated
- Offer Letter Generated

---

## Team Leader Notifications

Receive

- Team Target Assigned
- Team Performance Updates
- Big Day Notifications

---

## Admin Notifications

Receive

- Attendance Exceptions
- New Leave Requests
- Pending Approval Reminders
- Department Performance
- Big Day Summary

---

## Finance Notifications

Receive

- Incentive Ready for Payroll
- Payslip Generation Complete

---

## Super Admin Notifications

Receive

- Escalated Attendance Requests
- Escalated Leave Requests
- Organization Performance
- Department Performance
- Monthly HRMS Summary

---

# 93. Audit Framework

Every business action creates an immutable audit record.

Audit Fields

- Module
- Action
- Record ID
- Previous Value
- New Value
- Performed By
- Role
- Department
- Timestamp
- Remarks

---

## Employee Audit

- Create
- Update
- Archive
- Confirmation
- Salary Revision
- Exit
- Document Upload

---

## Attendance Audit

- Login
- Logout
- Manual Update
- Regularization
- WFH
- Approval
- Rejection

---

## Leave Audit

- Apply
- Approve
- Reject
- Cancel
- Withdraw
- Balance Adjustment
- Carry Forward

---

## Performance Audit

- Target Assignment
- Point Adjustment
- Ledger Entry
- Big Day Configuration
- Incentive Status Change

Audit records are immutable.

---

# 94. Reporting Standards

Every module supports standardized reporting.

Reports support

- Screen View
- Excel Export
- PDF Export

Reports are permission-based.

---

## Employee Reports

- Employee Directory
- Employment History
- Document Status
- Confirmation Due
- Exit Report

---

## Attendance Reports

- Daily Attendance
- Monthly Attendance
- Late Report
- Absent Report
- WFH Report
- Regularization Report

---

## Leave Reports

- Leave Balance
- Leave History
- Carry Forward
- Leave Utilization
- Department Leave Summary

---

## Performance Reports

- Monthly Performance
- Team Performance
- Department Performance
- Organization Performance
- Leaderboard
- Big Day History
- Incentive Liability

---

# 95. Dashboard Standards

Every module follows a common dashboard pattern.

Dashboard Components

- Summary Cards
- Charts
- Recent Activities
- Quick Actions
- Search
- Filters
- Tables

Dashboards are role-based.

---

# 96. Search Standards

Every module supports search.

Search must be fast.

Search fields depend on module.

Global search is outside HRMS v1.0 scope.

---

# 97. Filter Standards

Every listing supports filters.

Common filters

- Department
- Status
- Month
- Year
- Date Range

Additional filters are module specific.

---

# 98. Global Business Rules

The following rules apply across the HRMS.

- Employee IDs are auto-generated and immutable.
- Firestore document IDs remain unchanged.
- Business records use Soft Delete.
- Offer Letters are generated automatically.
- Payslips are generated automatically.
- All other employee documents are uploaded manually.
- WFH belongs only to Attendance.
- Leave never calculates payroll.
- Attendance never calculates payroll.
- Performance never calculates payroll.
- Billing Status is manual only.
- Billing Status belongs to Active Base.
- Billing Status is visible only to Finance and Super Admin.
- Every business action creates an audit record.
- Every notification uses Notification Service.
- Every permission uses Permission Service.

---

# 99. Acceptance Criteria

The HRMS implementation is considered complete only when

Employee Module

✓ Complete

Attendance Module

✓ Complete

Leave Module

✓ Complete

Performance Module

✓ Complete

Cross Module Integration

✓ Complete

Notifications

✓ Complete

Audit

✓ Complete

Reports

✓ Complete

Permissions

✓ Complete

Build

✓ Passes

Review Checklist

✓ Passes

Architecture

✓ Preserved

No duplicate implementation exists.

No business rules are violated.

---

# 100. Future Scope

The following modules are outside HRMS v1.0.

- Recruitment
- Network
- Workforce
- Finance
- Payroll
- CRM
- Billing
- Transactions
- Admin Settings

These modules will integrate with HRMS in future releases.

---

# 101. Version History

| Version | Date | Description |
|----------|------|-------------|
| 1.0 | July 2026 | Initial Approved HRMS Business Specification |

---

# DOCUMENT STATUS

**Document:** HRMS Business Specification

**Version:** 1.0

**Status:** Approved

**Implementation Status:** Ready

**Document State:** Frozen

---

# END OF DOCUMENT

This completes the **HRMS Business Specification v1.0**.

This document serves as the authoritative business reference for the HRMS implementation and should be used together with:

- `.ai/developer.md`
- `.ai/architecture.md`
- `.ai/coding-standards.md`
- `.ai/review-checklist.md`
- `hrms-technical-specification-v1.md`
- `hrms-architecture-review-v1.md`