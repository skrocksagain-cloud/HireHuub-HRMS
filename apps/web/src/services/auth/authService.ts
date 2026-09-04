import type {
  AuthResponse,
  PasswordPolicyCriteria,
  PasswordPolicyResult,
} from '../../types/auth';
import { attendanceComplianceService } from './attendanceComplianceService';
import { authLogService } from './authLogService';
import { firebasePhoneAuthProvider } from './providers/firebasePhoneAuthProvider';
import { authRepository } from './repositories/authRepository';

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
      throw new Error('Please provide both Employee ID and Password.');
    }

    const normalizedEmployeeId = cleanId.toLowerCase();
    const email = `${normalizedEmployeeId}@hirehuub.local`;

    const { signInWithEmailAndPassword, signOut } = await import('firebase/auth');
    const { auth } = await import('../../firebase/firebase');

    try {
      await signInWithEmailAndPassword(auth, email, passwordInput);
    } catch (error: any) {
      throw new Error('Invalid Employee ID or password. Please try again.');
    }

    const employee = await authRepository.getEmployeeByIdOrMobile(cleanId);
    if (!employee) {
      await signOut(auth);
      throw new Error('Account not found. Please verify your Employee ID.');
    }

    // Account Status Validation
    if (employee.accountStatus === 'Pending Activation') {
      await signOut(auth);
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
          await signOut(auth);
          const remainingMinutes = Math.ceil((lockExpiration - Date.now()) / (60 * 1000));
          throw new Error(`Account is locked due to multiple failed login attempts. Try again in ${remainingMinutes} minute(s) or contact Super Admin.`);
        }
      } else if (employee.lockReason === 'Attendance Violation') {
        await signOut(auth);
        throw new Error('Account locked due to Attendance Compliance Violation (forgot to sign out for 3 consecutive days). Please request Department Admin / Super Admin unlock.');
      } else {
        await signOut(auth);
        throw new Error(`Account is locked (${employee.lockReason || 'Administrative Lock'}). Please contact HR or Super Admin.`);
      }
    }

    if (['Inactive', 'Suspended', 'Resigned', 'Terminated'].includes(employee.accountStatus)) {
      await signOut(auth);
      throw new Error(`Account status is '${employee.accountStatus}'. Login access is restricted.`);
    }

    // Reset failed attempts upon successful login
    await authRepository.resetFailedLoginAttempts(employee.id);

    // Enforce Single Active Session
    const { sessionId } = await sessionService.createSingleUserSession(employee.employeeId);

    // Inject Custom Claims & Refresh Token
    await this.injectCustomClaims(sessionId);

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
   * Request Password Reset OTP via Email
   */
  async requestPasswordResetToken(identifier: string): Promise<{ success: boolean; message: string; employee: { id: string; employeeId: string; name: string } }> {
    const cleanId = identifier.trim();
    if (!cleanId) {
      throw new Error('Please enter your Employee ID or Mobile Number.');
    }

    const employee = await authRepository.getEmployeeByIdOrMobile(cleanId);
    if (!employee) {
      // Security: Do not expose existence. Return generic success.
      return { 
        success: true, 
        message: 'If the Employee ID exists, a recovery code has been sent to the registered profile email.',
        employee: { id: 'generic', employeeId: cleanId, name: 'Employee' }
      };
    }

    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('../../firebase/firebase');
    const requestResetFn = httpsCallable(functions, 'requestPasswordReset');
    
    await requestResetFn({ employeeId: employee.employeeId });

    return {
      success: true,
      message: 'If the Employee ID exists, a recovery code has been sent to the registered profile email.',
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

    // Skip OTP verification in first login (OTP removed per earlier steps)
    // If confirmationResult is passed, it means we are in a flow that still requires it
    if (confirmationResult) {
      const isOtpValid = await firebasePhoneAuthProvider.verifyOtp(confirmationResult, otpCode);
      if (!isOtpValid) {
        throw new Error('Invalid OTP code. Activation cannot be completed.');
      }
      await authLogService.logEvent(employee.employeeId, 'OTP Verification', 'success', { flow: 'activation' });
    }

    // Validate Password Policy
    const policyResult = validatePasswordPolicy(newPasswordInput);
    if (!policyResult.isValid) {
      throw new Error(policyResult.errors.join(' '));
    }

    const canonicalEmail = `${employee.employeeId.toLowerCase()}@hirehuub.local`;

    const { updatePassword } = await import('firebase/auth');
    const { auth } = await import('../../firebase/firebase');

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Please sign in again before changing your password.');
    }

    if (employee.firebaseUid && currentUser.uid !== employee.firebaseUid) {
      throw new Error('Authenticated user does not match the requested employee record.');
    } else if (!employee.firebaseUid && currentUser.email !== canonicalEmail) {
      throw new Error('Authenticated email does not match the canonical identity.');
    }

    try {
      await updatePassword(currentUser, newPasswordInput);
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') {
        throw new Error('Please sign in again before changing your password.');
      }
      throw new Error('Failed to securely update Firebase credentials: ' + (e.message || ''));
    }

    const now = new Date().toISOString();

    const authDataUpdates: Record<string, any> = {
      mobileVerified: true,
      firstLoginCompleted: true,
      activatedAt: now,
      lastPasswordChangedAt: now,
      accountStatus: 'Active',
      failedLoginAttempts: 0,
      lockedUntil: null,
      lockReason: null,
    };
    if (!employee.firebaseUid) {
      authDataUpdates.firebaseUid = currentUser.uid;
    }

    // Update Employee Firestore Document
    await authRepository.updateEmployeeAuthData(employee.id, authDataUpdates);

    await authLogService.logEvent(employee.employeeId, 'Password Created', 'success');

    // Create Single Session & Log Login
    const { sessionId } = await sessionService.createSingleUserSession(employee.employeeId);
    
    // Inject Custom Claims & Refresh Token
    await this.injectCustomClaims(sessionId);
    
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
    // @ts-ignore
    confirmationResult: unknown,
    otpCode: string,
    newPasswordInput: string
  ): Promise<AuthResponse> {
    const employee = await authRepository.getEmployeeByIdOrMobile(employeeId);
    if (!employee) {
      throw new Error('Employee record not found.');
    }

    // Validate Password Policy
    const policyResult = validatePasswordPolicy(newPasswordInput);
    if (!policyResult.isValid) {
      throw new Error(policyResult.errors.join(' '));
    }

    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('../../firebase/firebase');
    const completeResetFn = httpsCallable(functions, 'completePasswordReset');

    try {
      await completeResetFn({ employeeId: employee.employeeId, otp: otpCode, newPassword: newPasswordInput });
    } catch (e: any) {
      throw new Error('Password reset failed: ' + (e.message || 'Invalid code or expired.'));
    }

    await authLogService.logEvent(employee.employeeId, 'Password Reset', 'success');

    // Create new single session
    const { sessionId } = await sessionService.createSingleUserSession(employee.employeeId);
    
    // Inject Custom Claims & Refresh Token
    await this.injectCustomClaims(sessionId);
    
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
  
  private async injectCustomClaims(sessionId: string): Promise<void> {
    const { httpsCallable } = await import('firebase/functions');
    const { functions, auth } = await import('../../firebase/firebase');
    const createErpFirebaseTokenFn = httpsCallable(functions, 'createErpFirebaseToken');
    
    // Cloud function assigns claims to the native Firebase UID securely
    await createErpFirebaseTokenFn({ sessionId });
    
    // Force refresh token to apply the new claims to the current session immediately
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
    }
  }
}

export const authService = new AuthService();