import { useCallback, useEffect, useState } from 'react';
import type { AuthResponse, PasswordPolicyResult } from '../types/auth';
import { authService, validatePasswordPolicy } from '../services/auth/authService';

export type AuthTabMode = 'login' | 'activation' | 'forgot';

export interface UseAuthEngineReturn {
  activeTab: AuthTabMode;
  setActiveTab: (tab: AuthTabMode) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  clearMessages: () => void;
  // Normal Login state
  loginId: string;
  setLoginId: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
  handleNormalLogin: () => Promise<AuthResponse | null>;
  // OTP state & timer
  otpStep: 'input' | 'verify' | 'new_password';
  otpCode: string;
  setOtpCode: (val: string) => void;
  targetMobileNumber: string;
  timerSeconds: number;
  canResendOtp: boolean;
  handleSendOtp: (identifier: string) => Promise<boolean>;
  handleResendOtp: () => Promise<boolean>;
  // Password creation & policy
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  passwordPolicy: PasswordPolicyResult;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  // Actions
  handleCompleteActivation: () => Promise<AuthResponse | null>;
  handleCompleteResetPassword: () => Promise<AuthResponse | null>;
  resetFlows: () => void;
}

export function useAuthEngine(): UseAuthEngineReturn {
  const [activeTab, setActiveTab] = useState<AuthTabMode>('login');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Normal Login
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // OTP Engine
  const [otpStep, setOtpStep] = useState<'input' | 'verify' | 'new_password'>('input');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<unknown>(null);
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [targetMobileNumber, setTargetMobileNumber] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(true);

  // Password Setup
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicyResult>(validatePasswordPolicy(''));

  // Update password policy live as user types
  useEffect(() => {
    setPasswordPolicy(validatePasswordPolicy(newPassword));
  }, [newPassword]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timerId: ReturnType<typeof setInterval>;
    if (timerSeconds > 0) {
      setCanResendOtp(false);
      timerId = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResendOtp(true);
    }
    return () => clearInterval(timerId);
  }, [timerSeconds]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const resetFlows = useCallback(() => {
    setLoginId('');
    setLoginPassword('');
    setOtpStep('input');
    setOtpCode('');
    setConfirmationResult(null);
    setTargetEmployeeId('');
    setTargetMobileNumber('');
    setNewPassword('');
    setConfirmPassword('');
    setTimerSeconds(0);
    setCanResendOtp(true);
    clearMessages();
  }, [clearMessages]);

  const handleNormalLogin = async (): Promise<AuthResponse | null> => {
    clearMessages();
    setIsLoading(true);
    try {
      const res = await authService.login(loginId, loginPassword);
      setIsLoading(false);
      return res;
    } catch (caught) {
      setIsLoading(false);
      const msg = caught instanceof Error ? caught.message : 'Login failed. Please check credentials.';
      setError(msg);
      return null;
    }
  };

  const handleSendOtp = async (identifier: string): Promise<boolean> => {
    clearMessages();
    setIsLoading(true);
    try {
      const flow = activeTab === 'activation' ? 'activation' : 'forgot_password';
      const { confirmationResult: conf, mobileNumber, employee } = await authService.sendOtpForFlow(identifier, flow);
      setConfirmationResult(conf);
      setTargetEmployeeId(employee.employeeId);
      setTargetMobileNumber(mobileNumber);
      setOtpStep('verify');
      setTimerSeconds(60);
      setSuccessMessage(`Verification OTP sent via SMS to registered mobile ${mobileNumber.slice(-4).padStart(mobileNumber.length, '*')}.`);
      setIsLoading(false);
      return true;
    } catch (caught) {
      setIsLoading(false);
      const msg = caught instanceof Error ? caught.message : 'Unable to send OTP via SMS. Please try again.';
      setError(msg);
      return false;
    }
  };

  const handleResendOtp = async (): Promise<boolean> => {
    if (!targetEmployeeId) return false;
    return handleSendOtp(targetEmployeeId);
  };

  const handleCompleteActivation = async (): Promise<AuthResponse | null> => {
    clearMessages();
    if (!newPassword || newPassword !== confirmPassword) {
      setError('Passwords do not match. Please ensure Password and Confirm Password match exactly.');
      return null;
    }

    if (!passwordPolicy.isValid) {
      setError(`Password policy violation: ${passwordPolicy.errors.join(' ')}`);
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
  };

  const handleCompleteResetPassword = async (): Promise<AuthResponse | null> => {
    clearMessages();
    if (!newPassword || newPassword !== confirmPassword) {
      setError('Passwords do not match. Please ensure Password and Confirm Password match exactly.');
      return null;
    }

    if (!passwordPolicy.isValid) {
      setError(`Password policy violation: ${passwordPolicy.errors.join(' ')}`);
      return null;
    }

    setIsLoading(true);
    try {
      const res = await authService.resetPassword(targetEmployeeId, confirmationResult, otpCode, newPassword);
      setIsLoading(false);
      setSuccessMessage('Password reset successfully! You are now logged in.');
      return res;
    } catch (caught) {
      setIsLoading(false);
      const msg = caught instanceof Error ? caught.message : 'Password reset failed. Please try again.';
      setError(msg);
      return null;
    }
  };

  return {
    activeTab,
    setActiveTab: (tab: AuthTabMode) => {
      setActiveTab(tab);
      resetFlows();
    },
    theme,
    toggleTheme,
    isLoading,
    error,
    successMessage,
    clearMessages,
    loginId,
    setLoginId,
    loginPassword,
    setLoginPassword,
    rememberMe,
    setRememberMe,
    handleNormalLogin,
    otpStep,
    otpCode,
    setOtpCode,
    targetMobileNumber,
    timerSeconds,
    canResendOtp,
    handleSendOtp,
    handleResendOtp,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordPolicy,
    showPassword,
    setShowPassword,
    handleCompleteActivation,
    handleCompleteResetPassword,
    resetFlows,
  };
}
