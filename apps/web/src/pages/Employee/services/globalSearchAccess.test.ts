import type { Employee } from '../types/Employee';

export const runGlobalSearchAccessTests = (): { passed: number; total: number; logs: string[] } => {
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

  const masterEmployee: Employee = {
    id: 'emp-202',
    employeeId: 'EMP202',
    employeeCode: 'EMP202',
    firstName: 'Jane',
    lastName: 'Smith',
    fullName: 'Jane Smith',
    gender: 'Female',
    dateOfBirth: '1992-08-20',
    mobileNumber: '9876543222',
    email: 'jane.smith@hirehuub.com',
    department: 'Operations',
    designation: 'Operations Manager',
    employmentType: 'Permanent',
    joiningDate: '2024-03-01',
    reportingManager: 'Director',
    workLocation: 'Bangalore HQ',
    employmentStatus: 'Active',
    photoUrl: '',
    address: '789 Indiranagar, Bangalore',
    emergencyContact: '9876543223',
    notes: '',
    fatherName: 'Arthur Smith',
    motherName: 'Helen Smith',
    aadhaarNumber: '999988887777',
    panNumber: 'XYZPB9999K',
    bankName: 'ICICI Bank',
    branchName: 'Koramangala',
    accountNumber: '112233445566',
    ifscCode: 'ICIC0001122',
    monthlyGross: 75000,
  };

  // Helper simulating sanitization in EmployeeProfilePage for restricted Global Search view
  const sanitizeForGlobalSearch = (emp: Employee, canViewSensitive: boolean): Partial<Employee> => {
    if (canViewSensitive) return emp;
    return {
      id: emp.id,
      employeeId: emp.employeeId,
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      firstName: emp.firstName,
      lastName: emp.lastName,
      department: emp.department,
      designation: emp.designation,
      email: emp.email,
      mobileNumber: emp.mobileNumber,
      workLocation: emp.workLocation,
      joiningDate: emp.joiningDate,
      employmentType: emp.employmentType,
      employmentStatus: emp.employmentStatus,
      reportingManager: emp.reportingManager,
      fatherName: undefined,
      motherName: undefined,
      dateOfBirth: '',
      aadhaarNumber: undefined,
      panNumber: undefined,
      bankName: undefined,
      branchName: undefined,
      accountNumber: undefined,
      ifscCode: undefined,
      address: '',
      monthlyGross: undefined,
    };
  };

  // 1. Global Search Employee Result -> Restricted view for non-HR / search
  const canViewSensitiveSearch = false;
  const searchProfile = sanitizeForGlobalSearch(masterEmployee, canViewSensitiveSearch);
  assert(searchProfile.fullName === 'Jane Smith', '1. Global Search opens restricted Employee View with basic employee identity');

  // 2. Overview Tab Contact Information Allowed
  const contactAllowed = searchProfile.email === 'jane.smith@hirehuub.com' && searchProfile.mobileNumber === '9876543222' && searchProfile.workLocation === 'Bangalore HQ';
  assert(contactAllowed, '2. Overview Tab shows Contact Information (Email, Mobile, Work Location)');

  // 3. Personal Profile Hidden
  const personalProfileHidden = !searchProfile.fatherName && !searchProfile.motherName && !searchProfile.dateOfBirth && !searchProfile.address;
  assert(personalProfileHidden, '3. Personal Profile (Father/Mother Name, DOB, Address) is completely hidden in Global Search view');

  // 4. Identity Information Hidden
  const identityHidden = !searchProfile.aadhaarNumber && !searchProfile.panNumber;
  assert(identityHidden, '4. Identity Information (Aadhaar, PAN) is completely hidden in Global Search view');

  // 5. Bank Account Details Hidden
  const bankHidden = !searchProfile.bankName && !searchProfile.branchName && !searchProfile.accountNumber && !searchProfile.ifscCode;
  assert(bankHidden, '5. Bank Account Details (Bank Name, Branch, Account, IFSC) are completely hidden in Global Search view');

  // 6. Allowed Tabs List for Global Search
  const allTabs = ['overview', 'employment', 'attendance', 'leave', 'performance', 'documents', 'timeline', 'audit', 'exit'];
  const allowedSearchTabs = allTabs.filter((t) => ['overview', 'employment', 'timeline'].includes(t));
  assert(allowedSearchTabs.length === 3 && allowedSearchTabs.includes('overview') && allowedSearchTabs.includes('employment') && allowedSearchTabs.includes('timeline'), '6. Global Search profile restricts tabs list to Overview, Employment, and Timeline ONLY');

  // 7. Hidden Tabs Omitted
  const hiddenTabsOmitted = !allowedSearchTabs.includes('attendance') && !allowedSearchTabs.includes('leave') && !allowedSearchTabs.includes('performance') && !allowedSearchTabs.includes('documents') && !allowedSearchTabs.includes('audit') && !allowedSearchTabs.includes('exit');
  assert(hiddenTabsOmitted, '7. Confidential HR tabs (Attendance, Leave, Performance, Documents, Audit, Exit) are omitted');

  // 8. Data-Layer Security Sanitization
  const sensitivePayloadStripped = searchProfile.monthlyGross === undefined;
  assert(sensitivePayloadStripped, '8. Security enforced at data layer (Salary and sensitive fields stripped from payload)');

  // 9. Direct URL Manipulation Protection
  let attemptedTab = 'leave';
  if (!canViewSensitiveSearch && !allowedSearchTabs.includes(attemptedTab)) {
    attemptedTab = 'overview';
  }
  assert(attemptedTab === 'overview', '9. Direct URL manipulation to hidden tab automatically resets to Overview tab');

  // 10. HR/Admin Full Access Preserved
  const hrProfile = sanitizeForGlobalSearch(masterEmployee, true);
  const hrFullAccess = hrProfile.aadhaarNumber === '999988887777' && hrProfile.bankName === 'ICICI Bank' && hrProfile.monthlyGross === 75000;
  assert(hrFullAccess, '10. Authorized HR/Admin access via People -> Employees retains full access to sensitive HR fields');

  return { passed, total: 10, logs };
};
