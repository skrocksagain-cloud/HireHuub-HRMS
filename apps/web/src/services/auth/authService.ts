import type {
  AuthResponse,
  PasswordPolicyCriteria,
  PasswordPolicyResult,
} from '../../types/auth';
import { attendanceComplianceService } from './attendanceComplianceService';
import { authLogService } from './authLogService';
import { firebasePhoneAuthProvider } from './providers/firebasePhoneAuthProvider';
import { authRepository } from './repositories/authRepository';
import { userSessionRepository } from './repositories/userSessionRepository';
import { sessionService } from './sessionService';

/**
 * Secure SHA-256 Web Crypto Hashing with Salt
 */
export async function hashPassword(password: string, salt = 'HireHuubERP_Secure_Salt_2026'): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates password against enterprise policy
 */
export function validatePasswordPolicy(password: string): PasswordPolicyResult {
  const criteria: PasswordPolicyCriteria = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const errors: string[] = [];
  if (!criteria.minLength) errors.push('Password must be at least 8 characters long.');
  if (!criteria.hasUppercase) errors.push('Password must contain at least one uppercase letter (A-Z).');
  if (!criteria.hasLowercase) errors.push('Password must contain at least one lowercase letter (a-z).');
  if (!criteria.hasNumber) errors.push('Password must contain at least one number (0-9).');
  if (!criteria.hasSpecialChar) errors.push('Password must contain at least one special character (!@#$%^&*...).');

  const fulfilledCount = Object.values(criteria).filter(Boolean).length;
  const score = Math.round((fulfilledCount / 5) * 100);

  return {
    isValid: errors.length === 0,
    score,
    criteria,
    errors,
  };
}

export class AuthService {
  /**
   * Normal Login (Employee ID / Mobile + Password)
   */
  async login(identifier: string, passwordInput: string): Promise<AuthResponse> {
    const cleanId = identifier.trim();
    if (!cleanId || !passwordInput) {
      throw new Error('Please provide both Employee ID/Mobile and Password.');
    }

    const employee = await authRepository.getEmployeeByIdOrMobile(cleanId);
    if (!employee) {
      throw new Error('Account not found. Please verify your Employee ID or Mobile Number.');
    }

    // Account Status Validation
    if (employee.accountStatus === 'Pending Activation') {
      throw new Error('Account is pending activation. Please use the First Time Activation tab to set up your password.');
    }

    if (employee.accountStatus === 'Locked') {
      // Check 30-minute lockout auto-unlock for failed login attempts
      if (employee.lockReason === 'Failed Login Attempts' && employee.lockedUntil) {
        const lockExpiration = new Date(employee.lockedUntil).getTime();
        if (Date.now() >= lockExpiration) {
          // 30 minutes passed — auto unlock
          await authRepository.resetFailedLoginAttempts(employee.id);
          await authLogService.logEvent(employee.employeeId, 'Account Unlocked', 'success', {
            reason: 'Auto Unlock after 30 minutes lockout expiration',
          });
          employee.accountStatus = 'Active';
          employee.lockedUntil = null;
        } else {
          const remainingMinutes = Math.ceil((lockExpiration - Date.now()) / (60 * 1000));
          throw new Error(`Account is locked due to multiple failed login attempts. Try again in ${remainingMinutes} minute(s) or contact Super Admin.`);
        }
      } else if (employee.lockReason === 'Attendance Violation') {
        throw new Error('Account locked due to Attendance Compliance Violation (forgot to sign out for 3 consecutive days). Please request Department Admin / Super Admin unlock.');
      } else {
        throw new Error(`Account is locked (${employee.lockReason || 'Administrative Lock'}). Please contact HR or Super Admin.`);
      }
    }

    if (['Inactive', 'Suspended', 'Resigned', 'Terminated'].includes(employee.accountStatus)) {
      throw new Error(`Account status is '${employee.accountStatus}'. Login access is restricted.`);
    }

    // Password Verification
    const inputHash = await hashPassword(passwordInput);

    // If password hash is not yet set in database, allow default initial password matching
    const isPasswordValid = employee.passwordHash
      ? employee.passwordHash === inputHash
      : passwordInput === 'Password@123' || passwordInput === `${employee.employeeId}@123`;

    if (!isPasswordValid) {
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

      throw new Error(`Invalid password. You have ${remainingAttempts} attempt(s) remaining before account lockout.`);
    }

    // Reset failed attempts upon successful login
    await authRepository.resetFailedLoginAttempts(employee.id);

    // Enforce Single Active Session
    const { sessionId } = await sessionService.createSingleUserSession(employee.employeeId);

    // Log Login Event
    await authLogService.logEvent(employee.employeeId, 'Login', 'success', {
      sessionId,
    });

    // Evaluate Attendance Compliance in background
    void attendanceComplianceService.evaluateCompliance(employee.id, employee.employeeId);

    return {
      success: true,
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        name: employee.name,
        role: employee.role,
        department: employee.department,
        designation: employee.designation,
        email: employee.email,
        mobileNumber: employee.mobileNumber,
        accountStatus: 'Active',
      },
      sessionId,
    };
  }

  /**
   * Send Phone OTP for First-Time Activation or Forgot Password
   */
  async sendOtpForFlow(identifier: string, flow: 'activation' | 'forgot_password'): Promise<{ confirmationResult: unknown; mobileNumber: string; employee: { id: string; employeeId: string; name: string } }> {
    const cleanId = identifier.trim();
    if (!cleanId) {
      throw new Error('Please enter your Employee ID or Mobile Number.');
    }

    const employee = await authRepository.getEmployeeByIdOrMobile(cleanId);
    if (!employee) {
      throw new Error('Employee record not found. Please verify your Employee ID.');
    }

    const mobileNumber = employee.mobileNumber || employee.mobile;
    if (!mobileNumber) {
      throw new Error('No registered mobile number found for this employee. Please contact HR.');
    }

    if (flow === 'activation' && employee.accountStatus === 'Active' && employee.firstLoginCompleted) {
      throw new Error('Account is already activated. Please perform Normal Login.');
    }

    const { confirmationResult } = await firebasePhoneAuthProvider.sendOtp(mobileNumber);

    return {
      confirmationResult,
      mobileNumber,
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        name: employee.name,
      },
    };
  }

  /**
   * Complete First-Time Activation
   */
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

    // Verify Phone OTP
    const isOtpValid = await firebasePhoneAuthProvider.verifyOtp(confirmationResult, otpCode);
    if (!isOtpValid) {
      throw new Error('Invalid OTP code. Activation cannot be completed.');
    }

    await authLogService.logEvent(employee.employeeId, 'OTP Verification', 'success', { flow: 'activation' });

    // Validate Password Policy
    const policyResult = validatePasswordPolicy(newPasswordInput);
    if (!policyResult.isValid) {
      throw new Error(policyResult.errors.join(' '));
    }

    const passwordHash = await hashPassword(newPasswordInput);
    const now = new Date().toISOString();

    // Update Employee Firestore Document
    await authRepository.updateEmployeeAuthData(employee.id, {
      passwordHash,
      tempPasswordHash: null, // Temporary password permanently invalidated
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

    // Create Single Session & Log Login
    const { sessionId } = await sessionService.createSingleUserSession(employee.employeeId);
    await authLogService.logEvent(employee.employeeId, 'Login', 'success', { flow: 'first_time_activation', sessionId });

    return {
      success: true,
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        name: employee.name,
        role: employee.role,
        department: employee.department,
        designation: employee.designation,
        email: employee.email,
        mobileNumber: employee.mobileNumber || employee.mobile,
        accountStatus: 'Active',
      },
      sessionId,
    };
  }

  /**
   * Complete Forgot Password Reset
   */
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

    // Verify OTP
    const isOtpValid = await firebasePhoneAuthProvider.verifyOtp(confirmationResult, otpCode);
    if (!isOtpValid) {
      throw new Error('Invalid OTP verification code.');
    }

    await authLogService.logEvent(employee.employeeId, 'OTP Verification', 'success', { flow: 'forgot_password' });

    // Validate Password Policy
    const policyResult = validatePasswordPolicy(newPasswordInput);
    if (!policyResult.isValid) {
      throw new Error(policyResult.errors.join(' '));
    }

    const passwordHash = await hashPassword(newPasswordInput);
    const now = new Date().toISOString();

    // Terminate all existing sessions on password reset
    await userSessionRepository.terminateActiveSessions(employee.employeeId);

    // Update Employee Firestore Document
    await authRepository.updateEmployeeAuthData(employee.id, {
      passwordHash,
      lastPasswordChangedAt: now,
      failedLoginAttempts: 0,
      lockedUntil: null,
      lockReason: null,
      accountStatus: 'Active',
    });

    await authLogService.logEvent(employee.employeeId, 'Password Reset', 'success');

    // Create new single session
    const { sessionId } = await sessionService.createSingleUserSession(employee.employeeId);
    await authLogService.logEvent(employee.employeeId, 'Login', 'success', { flow: 'forgot_password_reset', sessionId });

    return {
      success: true,
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        name: employee.name,
        role: employee.role,
        department: employee.department,
        designation: employee.designation,
        email: employee.email,
        mobileNumber: employee.mobileNumber || employee.mobile,
        accountStatus: 'Active',
      },
      sessionId,
    };
  }

  /**
   * Logout
   */
  async logout(sessionId: string, employeeId: string): Promise<void> {
    if (sessionId) {
      await sessionService.terminateSession(sessionId);
    }
    if (employeeId) {
      await authLogService.logEvent(employeeId, 'Logout', 'success');
    }
  }
}

export const authService = new AuthService();