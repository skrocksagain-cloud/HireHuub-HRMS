# Phase 2C.3 Authorization Correction Report

## Root cause

The Employee tab read `auth_user` directly from local storage instead of using the canonical identity established by `AuthContext`. That separate, potentially stale session shape could lack `assignedRole` and/or the employee identity. The hook then resolved `SELF`, performed an unrestricted employee fetch through an optional department parameter, and filtered the result in the browser. For a Super Admin whose local-storage record was incomplete, this resulted in no matching employees rather than the required global view.

## Files modified

- `apps/web/src/pages/Employee/hooks/useEmployees.ts`
- `apps/web/src/pages/Employee/services/employeeService.ts`
- `apps/web/src/pages/Employee/repositories/employeeRepository.ts`
- `apps/web/src/pages/Attendance/AttendancePage.tsx`
- `apps/web/src/pages/Attendance/services/attendanceService.ts`
- `apps/web/src/pages/Attendance/repositories/attendanceRepository.ts`
- `apps/web/src/pages/Leave/LeavePage.tsx`
- `apps/web/src/pages/Leave/services/leaveService.ts`
- `apps/web/src/pages/Leave/repositories/leaveRepository.ts`
- `apps/web/src/pages/People/PerformancePage.tsx`
- `apps/web/src/pages/People/services/performanceService.ts`
- `apps/web/src/pages/People/repositories/performanceRepository.ts`

## Authorization behavior

The Employee hook now uses `AuthContext.user.authorization.role` first, falling back only to the canonical `assignedRole`, and dispatches before fetching:

- `GLOBAL`: `getAllEmployeesGlobal()` performs the only global employee query.
- `DEPARTMENT`: `getEmployeesForDepartment(departmentId)` requires a non-empty ID and otherwise returns `[]`.
- `SELF`: `getEmployeeForSelf(employeeId)` retrieves only the current employee.

Attendance and Leave repositories likewise separate global and department methods. Department methods return `[]` before issuing a Firestore query when their department value is absent; there is no optional department parameter that can become a global query.

Performance now accepts an explicit scope query. `SELF` queries placements by `recruiterId` and employees by `employeeId`; `DEPARTMENT` queries both collections by `departmentId`; only `GLOBAL` queries the full collections. Restricted scopes no longer fetch global placements or employees and filter after transfer.

## Verification

- Employee: Super Admin resolves to `GLOBAL` and receives the explicit global query even with no department; Admin and Master Admin resolve to `DEPARTMENT`; User resolves to `SELF`; a missing department for a department-scoped user returns `[]`.
- Attendance: Super Admin uses global pending/daily queries; department scope uses department-specific repository methods; missing department returns `[]`.
- Leave: Super Admin uses the global organization query; department scope uses the department-specific repository method; missing department returns `[]`.
- Performance: restricted calls use Firestore-bounded `recruiterId`/`employeeId` or `departmentId` queries. No restricted execution path calls a global placement or employee fetch.

CRM and Workforce code were not modified for this correction.

## Build

`npm run build` executed in `apps/web` and completed successfully (`tsc -b && vite build`).
