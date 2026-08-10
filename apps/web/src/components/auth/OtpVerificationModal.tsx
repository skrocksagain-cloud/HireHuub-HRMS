import { KeyRound, RotateCcw } from 'lucide-react';

interface Props {
  otpCode: string;
  setOtpCode: (val: string) => void;
  timerSeconds: number;
  canResendOtp: boolean;
  onResendOtp: () => void;
  onVerifyNext: () => void;
  isLoading: boolean;
  targetMobileNumber?: string;
}

export default function OtpVerificationModal({
  otpCode,
  setOtpCode,
  timerSeconds,
  canResendOtp,
  onResendOtp,
  onVerifyNext,
  isLoading,
  targetMobileNumber,
}: Props) {
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-start gap-3">
        <div className="p-2 bg-emerald-600 text-white rounded-xl flex-shrink-0">
          <KeyRound size={20} />
        </div>
        <div className="text-xs space-y-1">
          <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
            Firebase Phone OTP Verification
          </h4>
          <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed">
            Enter the 6-digit security code sent via SMS to{' '}
            <strong className="font-semibold text-emerald-950 dark:text-emerald-100">
              {targetMobileNumber || 'your registered mobile number'}
            </strong>.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
          6-Digit Verification Code
        </label>
        <input
          type="text"
          maxLength={6}
          placeholder="000000"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
          className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-sm"
        />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div>
          {timerSeconds > 0 ? (
            <span>Resend OTP available in <strong className="font-mono text-emerald-600 dark:text-emerald-400">{timerSeconds}s</strong></span>
          ) : (
            <span>Didn&apos;t receive code?</span>
          )}
        </div>

        <button
          type="button"
          disabled={!canResendOtp || isLoading}
          onClick={onResendOtp}
          className={`flex items-center gap-1.5 font-bold transition ${
            canResendOtp && !isLoading
              ? 'text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer'
              : 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
          }`}
        >
          <RotateCcw size={14} /> Resend OTP
        </button>
      </div>

      <button
        type="button"
        disabled={otpCode.length < 6 || isLoading}
        onClick={onVerifyNext}
        className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
      >
        {isLoading ? 'Verifying OTP…' : 'Verify Code & Proceed'}
      </button>
    </div>
  );
}
