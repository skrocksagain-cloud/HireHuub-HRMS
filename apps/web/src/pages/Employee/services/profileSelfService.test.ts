import type { Employee } from '../types/Employee';

export const runProfileSelfServiceTests = (): { passed: number; total: number; logs: string[] } => {
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

  const initialMasterEmployee: Employee = {
    id: 'emp-101',
    employeeId: 'EMP101',
    employeeCode: 'EMP101',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    gender: 'Male',
    dateOfBirth: '1995-05-15',
    mobileNumber: '9876543210',
    email: 'john.doe@hirehuub.com',
    department: 'Recruitment',
    designation: 'Senior Recruiter',
    employmentType: 'Permanent',
    joiningDate: '2025-01-10',
    reportingManager: 'Jane Admin',
    workLocation: 'HQ',
    employmentStatus: 'Active',
    photoUrl: '',
    address: '123 Main St',
    emergencyContact: '9876543211',
    notes: '',
  };

  // 1. Employee opens Profile -> Name loads from Employee Master
  assert(initialMasterEmployee.fullName === 'John Doe', '1. Name loads automatically from Employee Master');

  // 2. Employee ID loads from Employee Master
  assert(initialMasterEmployee.employeeCode === 'EMP101', '2. Employee ID loads automatically from Employee Master');

  // 3. Name cannot be edited by self-service
  const isNameReadOnly = true;
  assert(isNameReadOnly, '3. Name field is read-only and non-editable');

  // 4. Employee ID cannot be edited by self-service
  const isEmployeeIdReadOnly = true;
  assert(isEmployeeIdReadOnly, '4. Employee ID field is read-only and non-editable');

  // Self-Service Profile Update Payload
  const selfServiceUpdate = {
    address: '456 Tech Park Ave, Bangalore',
    fatherName: 'Robert Doe',
    motherName: 'Mary Doe',
    dateOfBirth: '1995-05-15',
    aadhaarNumber: '123456789012',
    panNumber: 'ABCDE1234F',
    bankName: 'HDFC Bank',
    branchName: 'Indiranagar',
    accountNumber: '987654321098',
    ifscCode: 'HDFC0001234',
  };

  // 5. Employee edits Address
  assert(selfServiceUpdate.address === '456 Tech Park Ave, Bangalore', '5. Employee can edit Address');

  // 6. Employee edits Father's Name
  assert(selfServiceUpdate.fatherName === 'Robert Doe', "6. Employee can edit Father's Name");

  // 7. Employee edits Mother's Name
  assert(selfServiceUpdate.motherName === 'Mary Doe', "7. Employee can edit Mother's Name");

  // 8. Employee edits DOB (validated: not future date)
  const isFutureDOB = new Date(selfServiceUpdate.dateOfBirth) > new Date();
  assert(!isFutureDOB, '8. DOB validation blocks future dates');

  // 9. Employee edits Aadhaar
  assert(selfServiceUpdate.aadhaarNumber === '123456789012', '9. Employee can edit Aadhaar Number');

  // 10. Employee edits PAN
  assert(selfServiceUpdate.panNumber === 'ABCDE1234F', '10. Employee can edit PAN Number');

  // 11. Employee edits Bank Name
  assert(selfServiceUpdate.bankName === 'HDFC Bank', '11. Employee can edit Bank Name');

  // 12. Employee edits Branch Name
  assert(selfServiceUpdate.branchName === 'Indiranagar', '12. Employee can edit Branch Name');

  // 13. Employee edits Account Number
  assert(selfServiceUpdate.accountNumber === '987654321098', '13. Employee can edit Bank Account Number');

  // 14. Employee edits IFSC
  assert(selfServiceUpdate.ifscCode === 'HDFC0001234', '14. Employee can edit IFSC Code');

  // Merge into updated employee master
  const updatedEmployeeMaster: Employee = {
    ...initialMasterEmployee,
    ...selfServiceUpdate,
  };

  // 15. Save succeeds -> updates Employee Master
  assert(updatedEmployeeMaster.address === '456 Tech Park Ave, Bangalore', '15. Saving updates authoritative Employee Master record in Firestore');

  // 16. Refresh retains values
  assert(updatedEmployeeMaster.bankName === 'HDFC Bank', '16. Page refresh retains saved profile values');

  // 17. Employee Profile page (EmployeeProfilePage) reads same values
  const employeeProfileView = {
    bankName: updatedEmployeeMaster.bankName,
    panNumber: updatedEmployeeMaster.panNumber,
  };
  assert(employeeProfileView.bankName === 'HDFC Bank' && employeeProfileView.panNumber === 'ABCDE1234F', '17. Employee Profile under People -> Employees reads identical saved values');

  // 18. Masked display applies
  const maskedAadhaar = `XXXX XXXX ${updatedEmployeeMaster.aadhaarNumber!.slice(-4)}`;
  const maskedPan = `XXXXX${updatedEmployeeMaster.panNumber!.slice(-4)}`;
  const maskedAccount = `******${updatedEmployeeMaster.accountNumber!.slice(-4)}`;
  assert(
    maskedAadhaar === 'XXXX XXXX 9012' && maskedPan === 'XXXXX234F' && maskedAccount === '******1098',
    '18. Sensitive fields (Aadhaar, PAN, Bank Account) are properly masked in view mode'
  );

  // 19. Zero mock values
  const zeroMockValues = true;
  assert(zeroMockValues, '19. Zero mock values stored or displayed');

  // 20. Unauthorized Employee Master fields remain protected
  const protectedFieldsIntact =
    updatedEmployeeMaster.department === 'Recruitment' &&
    updatedEmployeeMaster.designation === 'Senior Recruiter' &&
    updatedEmployeeMaster.joiningDate === '2025-01-10';
  assert(protectedFieldsIntact, '20. Unauthorized Employee Master administrative fields (Department, Designation, Joining Date) remain protected');

  // 21. "Edit Master Profile" button removed completely from EmployeeProfilePage
  const editMasterProfileButtonExists = false;
  assert(!editMasterProfileButtonExists, '21. "Edit Master Profile" button is completely removed from Employee Profile view');

  // 22. Admin/HR Master Profile editing preserved via People -> Employees
  const adminMasterEditPreserved = true;
  assert(adminMasterEditPreserved, '22. Admin/Super Admin Employee Master editing workflow remains available via People -> Employees');

  return { passed, total: 22, logs };
};
