import { Check, X } from 'lucide-react';
import type { PasswordPolicyResult } from '../../types/auth';

interface Props {
  policy: PasswordPolicyResult;
}

export default function PasswordStrengthMeter({ policy }: Props) {
  const { criteria, score } = policy;

  const getMeterColor = (scoreValue: number) => {
    if (scoreValue <= 20) return 'bg-rose-500';
    if (scoreValue <= 60) return 'bg-amber-500';
    if (scoreValue <= 80) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getMeterText = (scoreValue: number) => {
    if (scoreValue <= 20) return 'Weak';
    if (scoreValue <= 60) return 'Fair';
    if (scoreValue <= 80) return 'Good';
    return 'Strong Enterprise Password';
  };

  const rules = [
    { key: 'minLength', label: 'Minimum 8 characters' },
    { key: 'hasUppercase', label: 'One uppercase letter (A-Z)' },
    { key: 'hasLowercase', label: 'One lowercase letter (a-z)' },
    { key: 'hasNumber', label: 'One number (0-9)' },
    { key: 'hasSpecialChar', label: 'One special character (!@#$%^&*)' },
  ] as const;

  return (
    <div className="space-y-3 mt-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-slate-600 dark:text-slate-300">Password Strength</span>
        <span className={`${score >= 100 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500'}`}>
          {getMeterText(score)} ({score}%)
        </span>
      </div>

      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getMeterColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs pt-1">
        {rules.map((rule) => {
          const isPassed = criteria[rule.key];
          return (
            <div
              key={rule.key}
              className={`flex items-center gap-1.5 ${
                isPassed
                  ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {isPassed ? (
                <Check size={14} className="text-emerald-500 flex-shrink-0" />
              ) : (
                <X size={14} className="text-slate-400 flex-shrink-0" />
              )}
              <span>{rule.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
