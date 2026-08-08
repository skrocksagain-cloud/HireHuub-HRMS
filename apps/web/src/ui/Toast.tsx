import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  type?: 'success' | 'warning' | 'info' | 'danger';
}

export default function Toast({ isOpen, onClose, message, type = 'success' }: ToastProps) {
  if (!isOpen) return null;

  const styles = {
    success: {
      bg: 'bg-emerald-900/90 border-emerald-700 text-white',
      icon: <CheckCircle2 size={18} className="text-emerald-400" />,
    },
    warning: {
      bg: 'bg-amber-900/90 border-amber-700 text-white',
      icon: <AlertTriangle size={18} className="text-amber-400" />,
    },
    info: {
      bg: 'bg-slate-900/90 border-slate-700 text-white',
      icon: <Info size={18} className="text-cyan-400" />,
    },
    danger: {
      bg: 'bg-rose-900/90 border-rose-700 text-white',
      icon: <AlertTriangle size={18} className="text-rose-400" />,
    },
  }[type];

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md ${styles.bg} text-xs font-semibold`}
      >
        {styles.icon}
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-slate-400 hover:text-white transition">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
