export type AccountStatus =
  | 'Pending Activation'
  | 'Active'
  | 'Inactive'
  | 'Suspended'
  | 'Locked'
  | 'Resigned'
  | 'Terminated';

export type LockReason =
  | 'Failed Login Attempts'
  | 'Attendance Violation'
  | 'Administrative Lock'
  | 'Security Policy';

export type SessionStatus = 'active' | 'terminated' | 'expired' | 'logged_out';

export type AuthEventType =
  | 'Login'
  | 'Logout'
  | 'Failed Login'
  | 'Password Created'
  | 'Password Reset'
  | 'Password Change'
  | 'OTP Verification'
  | 'Session Terminated'
  | 'Account Locked'
  | 'Account Unlocked'
  | 'Emergency Unlock';

export interface UserSession {
  id?: string;
  sessionId: string;
  employeeId: string;
  userId: string;
  loginAt: string;
  logoutAt: string | null;
  lastActivity: string;
  device: string;
  browser: string;
  platform: string;
  ipAddress?: string;
  sessionStatus: SessionStatus;
}

export interface AuthLog {
  id?: string;
  employeeId: string;
  eventType: AuthEventType;
  timestamp: string;
  status: 'success' | 'failure';
  details?: Record<string, string | number | boolean | null>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AdminAuditLog {
  id?: string;
  actorId: string;
  actorName: string;
  action: 'UNLOCK_REQUEST' | 'UNLOCK_APPROVE' | 'UNLOCK_REJECT' | 'UNLOCK_OVERRIDE';
  targetEmployeeId: string;
  targetEmployeeName: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  timestamp: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface PasswordPolicyCriteria {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export interface PasswordPolicyResult {
  isValid: boolean;
  score: number; // 0 to 100
  criteria: PasswordPolicyCriteria;
  errors: string[];
}

export interface DeviceInfo {
  device: string;
  browser: string;
  platform: string;
  ipAddress?: string;
}

export interface AuthCredentials {
  employeeId: string;
  password?: string;
  temporaryPassword?: string;
  mobileNumber?: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success: boolean;
  employee?: {
    id: string;
    employeeId: string;
    name: string;
    role: string;
    department?: string;
    designation: string;
    email?: string;
    mobileNumber?: string;
    accountStatus: AccountStatus;
  };
  sessionId?: string;
  errorMessage?: string;
  requiresOtp?: boolean;
  confirmationResult?: unknown;
}

/**
 * Extension Interfaces for Future-Ready Architecture
 * Supports future integration of MFA, Biometrics, SSO, Passkeys, Aadhaar eSign without breaking architecture.
 */
export interface IOtpAuthProvider {
  sendOtp(phoneNumber: string, recaptchaContainerId: string): Promise<{ confirmationResult: unknown; verificationId?: string }>;
  verifyOtp(confirmationResult: unknown, code: string): Promise<boolean>;
}

export interface ISsoAuthProvider {
  providerName: 'Google' | 'Microsoft';
  authenticate(): Promise<AuthResponse>;
}

export interface IMfaAuthProvider {
  sendMfaCode(method: 'SMS' | 'EMAIL' | 'TOTP', target: string): Promise<boolean>;
  verifyMfaCode(code: string): Promise<boolean>;
}

export interface IBiometricAuthProvider {
  isSupported(): Promise<boolean>;
  authenticateBiometric(): Promise<boolean>;
}

export interface IPasskeyAuthProvider {
  registerPasskey(employeeId: string): Promise<boolean>;
  verifyPasskey(employeeId: string): Promise<boolean>;
}

export interface IAadhaarEsignAuthProvider {
  initiateEsignTransaction(aadhaarId: string): Promise<{ transactionId: string }>;
  verifyEsignOtp(transactionId: string, otp: string): Promise<boolean>;
}
