import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Moon,
  ShieldCheck,
  Smartphone,
  Sun,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { permissionService } from '../../core/permissions/permissionService';
import { useAuthEngine } from '../../hooks/useAuthEngine';
import OtpVerificationModal from '../../components/auth/OtpVerificationModal';
import PasswordStrengthMeter from '../../components/auth/PasswordStrengthMeter';
import { OneIcon } from '../../components/OneIcon';
import type { AuthTabMode } from '../../hooks/useAuthEngine';

export default function Login({ forceTab }: { forceTab?: AuthTabMode }) {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const {
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
    isLoading,
    error,
    successMessage,
    loginId,
    setLoginId,
    loginPassword,
    setLoginPassword,
    handleNormalLogin,
    otpStep,
    otpCode,
    setOtpCode,
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
  } = useAuthEngine();

  const [forgotEmpId, setForgotEmpId] = useState('');

  useEffect(() => {
    if (forceTab) {
      setActiveTab(forceTab);
    }
  }, [forceTab, setActiveTab]);

  if (!authLoading && user) {
    if (!user.mustChangePassword && activeTab !== 'change_password') {
      const landingModule = permissionService.getLandingModule(user.role);
      return <Navigate to={landingModule || '/dashboard'} replace />;
    } else if (user.mustChangePassword && activeTab !== 'change_password') {
      return <Navigate to="/change-password" replace />;
    }
  }

  const onLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await handleNormalLogin();
    if (res && res.success) {
      if (res.mustChangePassword) {
        navigate('/change-password', { replace: true, state: { empId: res.employee?.employeeId } });
      } else if (res.employee) {
        const landingModule = permissionService.getLandingModule(res.employee.role);
        navigate(landingModule || '/dashboard');
      }
    }
  };

  const onSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSendOtp(forgotEmpId);
  };

  const { state } = useLocation();
  const fallbackEmpId = state?.empId || user?.employeeId;

  const onActivationPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await handleCompleteActivation(fallbackEmpId);
    if (res && res.success && res.employee) {
      const landingModule = permissionService.getLandingModule(res.employee.role);
      navigate(landingModule || '/dashboard');
    }
  };

  const onForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await handleCompleteResetPassword();
    if (res && res.success && res.employee) {
      const landingModule = permissionService.getLandingModule(res.employee.role);
      navigate(landingModule || '/dashboard');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-slate-950 text-white dark' : 'bg-slate-100 text-slate-900'
    }`}>
      <div id="recaptcha-container" />

      <div className="w-full max-w-lg flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-md">
            <OneIcon />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-emerald-700 dark:text-emerald-400">
              ONE
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-xs cursor-pointer"
          title="Toggle Light / Dark Theme"
        >
          {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
        </button>
      </div>

      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        
        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-medium flex items-start gap-3 animate-in fade-in duration-200">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-medium flex items-start gap-3 animate-in fade-in duration-200">
            <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">{successMessage}</div>
          </div>
        )}

        {/* TAB 1: NORMAL LOGIN */}
        {activeTab === 'login' && (
          <form onSubmit={onLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Employee ID
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Employee ID"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end text-xs pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('forgot')}
                className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck size={18} />
              {isLoading ? 'Authenticating…' : 'Sign In'}
            </button>
          </form>
        )}

        {/* TAB 2: FORCE PASSWORD CHANGE (FIRST LOGIN) */}
        {activeTab === 'change_password' && (
          <form onSubmit={onActivationPasswordSubmit} className="space-y-4">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-xs text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
              You must change your temporary password before accessing the system.
            </div>

            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Change Password
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <PasswordStrengthMeter policy={passwordPolicy} />

            <button
              type="submit"
              disabled={isLoading || !passwordPolicy.isValid || newPassword !== confirmPassword}
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound size={18} />
              {isLoading ? 'Saving Password…' : 'Change Password & Login'}
            </button>
            
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className="w-full py-3 text-slate-500 hover:text-slate-700 text-sm font-medium"
            >
              Cancel and Logout
            </button>
          </form>
        )}

        {/* TAB 3: FORGOT PASSWORD */}
        {activeTab === 'forgot' && (
          <div className="space-y-5">
            {otpStep === 'input' && (
              <form onSubmit={onSendForgotOtp} className="space-y-5">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Enter your Employee ID to receive a Phone OTP verification code for password reset on your registered mobile.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Employee ID
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Employee ID"
                      value={forgotEmpId}
                      onChange={(e) => setForgotEmpId(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !forgotEmpId.trim()}
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Smartphone size={18} />
                  {isLoading ? 'Sending Phone OTP…' : 'Send Password Reset Phone OTP'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="w-full py-3 text-slate-500 hover:text-slate-700 text-sm font-medium"
                >
                  Back to Login
                </button>
              </form>
            )}

            {otpStep === 'verify' && (
              <OtpVerificationModal
                otpCode={otpCode}
                setOtpCode={setOtpCode}
                timerSeconds={timerSeconds}
                canResendOtp={canResendOtp}
                onResendOtp={handleResendOtp}
                onVerifyNext={() => {}}
                isLoading={isLoading}
              />
            )}

            {(otpStep === 'verify' || otpStep === 'new_password') && (
              <form onSubmit={onForgotPasswordSubmit} className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Create New Password
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <PasswordStrengthMeter policy={passwordPolicy} />

                <button
                  type="submit"
                  disabled={isLoading || !passwordPolicy.isValid || newPassword !== confirmPassword || otpCode.length < 6}
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound size={18} />
                  {isLoading ? 'Resetting Password…' : 'Reset Password & Login'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="w-full py-3 text-slate-500 hover:text-slate-700 text-sm font-medium"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
