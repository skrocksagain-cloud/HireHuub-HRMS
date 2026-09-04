const fs = require('fs');
let code = fs.readFileSync('e:/Projects/HireHuub-HRMS/apps/web/src/services/auth/authService.ts', 'utf8');

// Restore Login
const loginMatch = code.match(/const inputHash = await hashPassword\\(passwordInput\\);[\\s\\S]*?if \\(!isPasswordValid\\) \\{/);
const newLoginLogic = \`
    const email = \\\`\$\\{employee.employeeId.toLowerCase()\\}@hirehuub.local\\\`;
    let isAuthenticated = false;

    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('../../firebase/firebase');
      await signInWithEmailAndPassword(auth, email, passwordInput);
      isAuthenticated = true;
    } catch (error: any) {
      if (!isAuthenticated) {
        const { isLocked, remainingAttempts } = await authRepository.recordFailedLoginAttempt(
          employee.id,
          employee.failedLoginAttempts
        );

        await authLogService.logEvent(employee.employeeId, 'Failed Login', 'failure', {
          attemptedId: cleanId,
          remainingAttempts,
        });

        if (isLocked) {
          await authLogService.logEvent(employee.employeeId, 'Account Locked', 'failure', {
            reason: 'Failed Login Protection — 5 consecutive failures',
          });
          throw new Error('Maximum failed login attempts reached (5). Account is locked for 30 minutes.');
        }

        throw new Error(\\\`Invalid password. You have \$\\{remainingAttempts\\} attempt(s) remaining before account lockout.\\\`);
      }
    }
\`;
code = code.replace(/const inputHash = await hashPassword\\(passwordInput\\);[\\s\\S]*?throw new Error\\(\\\`Invalid password\\. You have \\$\\{remainingAttempts\\} attempt\\(s\\) remaining before account lockout\\.\\\`\\);\\s*\\}/, newLoginLogic);

// Restore completeActivation
const newActivationLogic = \`
  async completeActivation(
    employeeId: string,
    confirmationResult: unknown,
    otpCode: string,
    newPasswordInput: string
  ): Promise<AuthResponse> {
    const employee = await authRepository.getEmployeeByIdOrMobile(employeeId);
    if (!employee) {
      throw new Error('Employee record not found.');
    }

    const policyResult = validatePasswordPolicy(newPasswordInput);
    if (!policyResult.isValid) {
      throw new Error(policyResult.errors.join(' '));
    }

    const email = \\\`\$\\{employee.employeeId.toLowerCase()\\}@hirehuub.local\\\`;

    try {
      const { signInWithEmailAndPassword, updatePassword } = await import('firebase/auth');
      const { auth } = await import('../../firebase/firebase');
      
      let signCred;
      try {
        signCred = await signInWithEmailAndPassword(auth, email, 'Password@123');
      } catch (fallbackError) {
        signCred = await signInWithEmailAndPassword(auth, email, \\\`\$\\{employee.employeeId\\}@123\\\`);
      }
      
      await updatePassword(signCred.user, newPasswordInput);
    } catch (e: any) {
      throw new Error('Failed to authenticate with temporary password for setup. If your temporary password was customized, you must sign in normally. ' + (e.message || ''));
    }

    const now = new Date().toISOString();
    await authRepository.updateEmployeeAuthData(employee.id, {
      passwordHash: null,
      tempPasswordHash: null,
      mobileVerified: true,
      firstLoginCompleted: true,
      activatedAt: now,
      lastPasswordChangedAt: now,
      accountStatus: 'Active',
      failedLoginAttempts: 0,
      lockedUntil: null,
      lockReason: null,
    });

    await authLogService.logEvent(employee.employeeId, 'Password Created', 'success');

    return {
\`;
code = code.replace(/async completeActivation\\([\\s\\S]*?Promise<AuthResponse> \\{[\\s\\S]*?return \\{/, newActivationLogic);

// Restore resetPassword
const newResetLogic = \`
  async resetPassword(
    employeeId: string,
    confirmationResult: unknown,
    otpCode: string,
    newPasswordInput: string
  ): Promise<AuthResponse> {
    const employee = await authRepository.getEmployeeByIdOrMobile(employeeId);
    if (!employee) {
      throw new Error('Employee record not found.');
    }

    const email = \\\`\$\\{employee.employeeId.toLowerCase()\\}@hirehuub.local\\\`;

    throw new Error('Secure password reset requires a backend Admin mechanism. Client SDK cannot reset unknown passwords for existing accounts.');

    return {
\`;
code = code.replace(/async resetPassword\\([\\s\\S]*?Promise<AuthResponse> \\{[\\s\\S]*?return \\{/, newResetLogic);

fs.writeFileSync('e:/Projects/HireHuub-HRMS/apps/web/src/services/auth/authService.ts', code);
console.log('Restored Firebase Auth logic properly.');
