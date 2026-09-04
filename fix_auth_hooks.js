import * as fs from 'fs';
import * as path from 'path';

const basePath = 'e:/Projects/HireHuub-HRMS/apps/web/src';

const authEnginePath = path.join(basePath, 'hooks/useAuthEngine.ts');
let authEngineContent = fs.readFileSync(authEnginePath, 'utf8');

// Modify useAuthEngine to support mustChangePassword
authEngineContent = authEngineContent.replace(
  `export type AuthTabMode = 'login' | 'activation' | 'forgot';`,
  `export type AuthTabMode = 'login' | 'change_password' | 'forgot';`
);

authEngineContent = authEngineContent.replace(
  `const handleNormalLogin = async (): Promise<AuthResponse | null> => {`,
  `const [targetEmployeeId, setTargetEmployeeId] = useState('');\n\n  const handleNormalLogin = async (): Promise<AuthResponse | null> => {`
);
// Remove the duplicate targetEmployeeId from original
authEngineContent = authEngineContent.replace(`const [targetEmployeeId, setTargetEmployeeId] = useState('');`, '');


authEngineContent = authEngineContent.replace(
  `      const res = await authService.login(loginId, loginPassword);
      setIsLoading(false);
      return res;`,
  `      const res = await authService.login(loginId, loginPassword);
      if (res && res.mustChangePassword && res.employee) {
        setTargetEmployeeId(res.employee.employeeId || res.employee.id); // store for password change
      }
      setIsLoading(false);
      return res;`
);

authEngineContent = authEngineContent.replace(
  `const flow = activeTab === 'activation' ? 'activation' : 'forgot_password';`,
  `const flow = 'forgot_password';`
);


// Change handleCompleteActivation to handle complete password change without OTP
authEngineContent = authEngineContent.replace(
  `  const handleCompleteActivation = async (): Promise<AuthResponse | null> => {
    clearMessages();
    if (!newPassword || newPassword !== confirmPassword) {
      setError('Passwords do not match. Please ensure Password and Confirm Password match exactly.');
      return null;
    }

    if (!passwordPolicy.isValid) {
      setError(\`Password policy violation: \${passwordPolicy.errors.join(' ')}\`);
      return null;
    }

    setIsLoading(true);
    try {
      const res = await authService.completeActivation(targetEmployeeId, confirmationResult, otpCode, newPassword);
      setIsLoading(false);
      setSuccessMessage('Account activated successfully!');
      return res;
    } catch (caught) {
      setIsLoading(false);
      const msg = caught instanceof Error ? caught.message : 'First activation failed. Please try again.';
      setError(msg);
      return null;
    }
  };`,
  `  const handleCompleteActivation = async (): Promise<AuthResponse | null> => {
    clearMessages();
    if (!newPassword || newPassword !== confirmPassword) {
      setError('Passwords do not match. Please ensure Password and Confirm Password match exactly.');
      return null;
    }

    if (!passwordPolicy.isValid) {
      setError(\`Password policy violation: \${passwordPolicy.errors.join(' ')}\`);
      return null;
    }

    setIsLoading(true);
    try {
      // For first login, we don't need OTP, we just set the new password directly
      const res = await authService.completeActivation(targetEmployeeId, null, '', newPassword);
      setIsLoading(false);
      setSuccessMessage('Password changed successfully!');
      return res;
    } catch (caught) {
      setIsLoading(false);
      const msg = caught instanceof Error ? caught.message : 'Password change failed. Please try again.';
      setError(msg);
      return null;
    }
  };`
);


fs.writeFileSync(authEnginePath, authEngineContent);


// Modify authService.ts to skip OTP check if confirmationResult is null in completeActivation
const authServicePath = path.join(basePath, 'services/auth/authService.ts');
let authServiceContent = fs.readFileSync(authServicePath, 'utf8');
authServiceContent = authServiceContent.replace(
  `    // Verify Phone OTP
    const isOtpValid = await firebasePhoneAuthProvider.verifyOtp(confirmationResult, otpCode);
    if (!isOtpValid) {
      throw new Error('Invalid OTP code. Activation cannot be completed.');
    }

    await authLogService.logEvent(employee.employeeId, 'OTP Verification', 'success', { flow: 'activation' });`,
  `    // Verify Phone OTP (Skip if no confirmationResult, used for first login direct password change)
    if (confirmationResult) {
      const isOtpValid = await firebasePhoneAuthProvider.verifyOtp(confirmationResult, otpCode);
      if (!isOtpValid) {
        throw new Error('Invalid OTP code. Activation cannot be completed.');
      }
      await authLogService.logEvent(employee.employeeId, 'OTP Verification', 'success', { flow: 'activation' });
    }`
);
fs.writeFileSync(authServicePath, authServiceContent);
