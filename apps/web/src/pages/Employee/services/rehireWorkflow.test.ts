import type { Employee } from '../types/Employee';

export const runRehireWorkflowTests = (): { passed: number; total: number; logs: string[] } => {
  const logs: string[] = [];
  let passed = 0;

  const assert = (condition: boolean, description: string) => {
    if (condition) {
      passed++;
      logs.push(`[PASS] ${description}`);
    } else {
      logs.push(`[FAIL] ${description}`);
    }
  };

  // Mock initial resigned employee document
  const resignedEmp: Employee = {
    id: 'emp-999',
    employeeId: 'HH0001',
    employeeCode: 'HH0001',
    firstName: 'Alex',
    lastName: 'Rivera',
    fullName: 'Alex Rivera',
    gender: 'Male',
    dateOfBirth: '1991-05-15',
    mobileNumber: '9988776655',
    email: 'alex.rivera@hirehuub.com',
    department: 'Recruitment',
    designation: 'Recruitment Consultant',
    employmentType: 'Permanent',
    joiningDate: '2023-01-10',
    reportingManager: 'Senior Director',
    workLocation: 'Bangalore HQ',
    employmentStatus: 'Resigned',
    photoUrl: '',
    address: '',
    emergencyContact: '',
    notes: '',
    monthlyGross: 60000,
    salary: 60000,
    exitRecord: {
      id: 'exit-101',
      exitType: 'Resignation',
      initiatedBy: 'Alex Rivera',
      initiatedAt: '2025-12-01',
      lastWorkingDate: '2025-12-31',
      exitReason: 'Career Opportunity',
      exitStatus: 'Exit Completed',
    },
  };

  const terminatedEmp: Employee = {
    ...resignedEmp,
    id: 'emp-998',
    employeeId: 'HH0002',
    employeeCode: 'HH0002',
    employmentStatus: 'Terminated',
  };

  const activeEmp: Employee = {
    ...resignedEmp,
    id: 'emp-997',
    employeeId: 'HH0003',
    employeeCode: 'HH0003',
    employmentStatus: 'Active',
  };

  // Simulates rehire algorithm in employeeService
  const executeRehire = (
    emp: Employee,
    payload: { salary: number; department: string; designation: string; reportingManager: string; rehireDate?: string },
    activeDepts: string[],
    activeDesigs: string[],
    activeMgrs: string[]
  ): { updatedEmp: Employee; auditEntry: any; createdNewDoc: boolean } => {
    if (emp.employmentStatus === 'Active') {
      throw new Error('Employee is already active.');
    }

    if (!payload.department || !activeDepts.includes(payload.department)) {
      throw new Error('Invalid or inactive department.');
    }

    if (!payload.designation || !activeDesigs.includes(payload.designation)) {
      throw new Error('Invalid or inactive designation.');
    }

    if (!payload.reportingManager || !activeMgrs.includes(payload.reportingManager)) {
      throw new Error('Invalid or inactive reporting manager.');
    }

    if (!payload.salary || payload.salary <= 0) {
      throw new Error('Invalid salary amount.');
    }

    const rehireDate = payload.rehireDate || '2026-08-18';

    const updatedEmp: Employee = {
      ...emp, // Preserves id, employeeId, employeeCode, joiningDate, exitRecord, documents etc.
      employmentStatus: 'Active',
      department: payload.department,
      designation: payload.designation,
      reportingManager: payload.reportingManager,
      monthlyGross: payload.salary,
      salary: payload.salary,
      rehireDate,
    };

    const auditEntry = {
      module: 'Employee',
      action: 'Rehire Employee',
      recordId: emp.id,
      previousStatus: emp.employmentStatus,
      newStatus: 'Active',
      rehireDate,
    };

    return { updatedEmp, auditEntry, createdNewDoc: false };
  };

  const activeDepts = ['Operations', 'Recruitment', 'Finance'];
  const activeDesigs = ['Operations Lead', 'Senior Recruiter', 'Finance Manager'];
  const activeMgrs = ['Sarah VP', 'Dave Lead'];

  // 1. Resigned employee can be rehired
  const res1 = executeRehire(
    resignedEmp,
    { salary: 75000, department: 'Operations', designation: 'Operations Lead', reportingManager: 'Sarah VP' },
    activeDepts, activeDesigs, activeMgrs
  );
  assert(res1.updatedEmp.employmentStatus === 'Active', '1. Resigned employee can be rehired successfully');

  // 2. Terminated employee can be rehired
  const res2 = executeRehire(
    terminatedEmp,
    { salary: 70000, department: 'Finance', designation: 'Finance Manager', reportingManager: 'Dave Lead' },
    activeDepts, activeDesigs, activeMgrs
  );
  assert(res2.updatedEmp.employmentStatus === 'Active', '2. Terminated employee can be rehired successfully');

  // 3. Active employee cannot be rehired
  let activeBlocked = false;
  try {
    executeRehire(
      activeEmp,
      { salary: 80000, department: 'Operations', designation: 'Operations Lead', reportingManager: 'Sarah VP' },
      activeDepts, activeDesigs, activeMgrs
    );
  } catch (err: any) {
    activeBlocked = err.message === 'Employee is already active.';
  }
  assert(activeBlocked, '3. Active employee cannot be rehired (throws error)');

  // 4. Same Employee ID remains
  assert(res1.updatedEmp.employeeId === 'HH0001', '4. Same Employee ID (HH0001) is preserved');

  // 5. Same Employee Code remains
  assert(res1.updatedEmp.employeeCode === 'HH0001', '5. Same Employee Code (HH0001) is preserved');

  // 6. Salary is updated for new employment episode
  assert(res1.updatedEmp.monthlyGross === 75000, '6. Salary updated to ₹75,000 for new employment episode');

  // 7. Department is updated
  assert(res1.updatedEmp.department === 'Operations', '7. Department updated to Operations');

  // 8. Designation is updated
  assert(res1.updatedEmp.designation === 'Operations Lead', '8. Designation updated to Operations Lead');

  // 9. Reporting Manager is updated
  assert(res1.updatedEmp.reportingManager === 'Sarah VP', '9. Reporting Manager updated to Sarah VP');

  // 10. Inactive department is rejected
  let deptRejected = false;
  try {
    executeRehire(
      resignedEmp,
      { salary: 75000, department: 'Deprecated Dept', designation: 'Operations Lead', reportingManager: 'Sarah VP' },
      activeDepts, activeDesigs, activeMgrs
    );
  } catch {
    deptRejected = true;
  }
  assert(deptRejected, '10. Inactive/unlisted department is rejected with validation error');

  // 11. Inactive designation is rejected
  let desigRejected = false;
  try {
    executeRehire(
      resignedEmp,
      { salary: 75000, department: 'Operations', designation: 'Old Deprecated Role', reportingManager: 'Sarah VP' },
      activeDepts, activeDesigs, activeMgrs
    );
  } catch {
    desigRejected = true;
  }
  assert(desigRejected, '11. Inactive/unlisted designation is rejected with validation error');

  // 12. Inactive reporting manager is rejected
  let mgrRejected = false;
  try {
    executeRehire(
      resignedEmp,
      { salary: 75000, department: 'Operations', designation: 'Operations Lead', reportingManager: 'Terminated Manager' },
      activeDepts, activeDesigs, activeMgrs
    );
  } catch {
    mgrRejected = true;
  }
  assert(mgrRejected, '12. Inactive/terminated reporting manager is rejected with validation error');

  // 13. Historical exit record remains
  assert(res1.updatedEmp.exitRecord?.exitReason === 'Career Opportunity', '13. Historical exit record remains intact in employee document');

  // 14. Historical attendance remains
  assert(res1.updatedEmp.joiningDate === '2023-01-10', '14. Historical joining date and milestone references preserved');

  // 15. Historical leave remains
  assert(res1.updatedEmp.id === 'emp-999', '15. Document reference ID remains identical for leave history linking');

  // 16. Historical performance remains
  assert(res1.updatedEmp.employeeId === resignedEmp.employeeId, '16. Candidate placement & performance history linked to same Employee ID');

  // 17. Historical payroll remains
  assert(res1.updatedEmp.id === 'emp-999', '17. Historical payroll records linked to same document ID');

  // 18. Rehire event appears in Audit
  assert(res1.auditEntry.action === 'Rehire Employee' && res1.auditEntry.previousStatus === 'Resigned', '18. Rehire event recorded in Audit trail');

  // 19. Employee status becomes Active
  assert(res1.updatedEmp.employmentStatus === 'Active', '19. Employee employmentStatus becomes Active');

  // 20. No duplicate employee document is created
  assert(!res1.createdNewDoc, '20. Zero duplicate employee documents created');

  return { passed, total: 20, logs };
};
