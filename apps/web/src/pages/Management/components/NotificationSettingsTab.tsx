import { useState } from 'react';
import { Bell, Save, CheckCircle2, MessageSquare, Mail, Smartphone } from 'lucide-react';
import { useAdminNotificationSettings } from '../../../hooks/admin/useAdmin';
import type { NotificationSettings } from '../../../types/Admin';

export default function NotificationSettingsTab() {
  const { notifications, isLoading, updateNotifications } = useAdminNotificationSettings();
  const [statusMsg, setStatusMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState<NotificationSettings>(
    notifications || {
      channels: {
        inApp: true,
        email: false,
        whatsapp: false,
        sms: false,
        push: false,
      },
      triggers: {
        employeeOnboarding: true,
        leaveRequest: true,
        leaveApproval: true,
        offerGeneration: true,
        invoiceApproval: true,
        passwordResetRequest: true,
        bigDayActivation: true,
      },
    }
  );

  if (notifications && form.updatedAt !== notifications.updatedAt && !isSaving) {
    setForm(notifications);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateNotifications(form);
      setStatusMsg('Notification settings saved successfully!');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch {
      setStatusMsg('Failed to save notification settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleChannel = (ch: keyof NotificationSettings['channels']) => {
    setForm((prev) => ({
      ...prev,
      channels: { ...prev.channels, [ch]: !prev.channels[ch] },
    }));
  };

  const toggleTrigger = (tr: string) => {
    setForm((prev) => ({
      ...prev,
      triggers: { ...prev.triggers, [tr]: !prev.triggers[tr] },
    }));
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-medium text-xs">Loading Notification Settings…</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 text-xs text-slate-700">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Bell size={18} className="text-emerald-600" />
            Central Notification Settings
          </h3>
          <p className="text-slate-500">
            In-App notifications active. Email, WhatsApp, SMS, and Push channels are architecture-ready for multi-channel dispatch.
          </p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition"
        >
          <Save size={16} /> Save Settings
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span className="font-semibold">{statusMsg}</span>
        </div>
      )}

      {/* Channels Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400 border-b pb-2">
          Notification Dispatch Channels
        </div>

        <div className="grid grid-cols-5 gap-3">
          <div
            onClick={() => toggleChannel('inApp')}
            className={`p-4 rounded-2xl border cursor-pointer transition text-center space-y-2 ${
              form.channels.inApp
                ? 'bg-emerald-50/60 border-emerald-300 text-slate-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <Bell size={20} className="mx-auto text-emerald-600" />
            <div className="font-bold">In-App</div>
            <div className="text-[10px] font-bold text-emerald-700">Active (In Scope)</div>
          </div>

          <div
            onClick={() => toggleChannel('email')}
            className={`p-4 rounded-2xl border cursor-pointer transition text-center space-y-2 ${
              form.channels.email
                ? 'bg-emerald-50/60 border-emerald-300 text-slate-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <Mail size={20} className="mx-auto" />
            <div className="font-bold">Email</div>
            <div className="text-[10px] font-semibold text-slate-400">Architecture Ready</div>
          </div>

          <div
            onClick={() => toggleChannel('whatsapp')}
            className={`p-4 rounded-2xl border cursor-pointer transition text-center space-y-2 ${
              form.channels.whatsapp
                ? 'bg-emerald-50/60 border-emerald-300 text-slate-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <MessageSquare size={20} className="mx-auto" />
            <div className="font-bold">WhatsApp</div>
            <div className="text-[10px] font-semibold text-slate-400">Architecture Ready</div>
          </div>

          <div
            onClick={() => toggleChannel('sms')}
            className={`p-4 rounded-2xl border cursor-pointer transition text-center space-y-2 ${
              form.channels.sms
                ? 'bg-emerald-50/60 border-emerald-300 text-slate-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <Smartphone size={20} className="mx-auto" />
            <div className="font-bold">SMS</div>
            <div className="text-[10px] font-semibold text-slate-400">Architecture Ready</div>
          </div>

          <div
            onClick={() => toggleChannel('push')}
            className={`p-4 rounded-2xl border cursor-pointer transition text-center space-y-2 ${
              form.channels.push
                ? 'bg-emerald-50/60 border-emerald-300 text-slate-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <Bell size={20} className="mx-auto" />
            <div className="font-bold">Push</div>
            <div className="text-[10px] font-semibold text-slate-400">Architecture Ready</div>
          </div>
        </div>
      </div>

      {/* Triggers List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
        <div className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400 border-b pb-2">
          System Notification Triggers
        </div>

        <div className="grid grid-cols-2 gap-3">
          {Object.entries(form.triggers).map(([key, isEnabled]) => (
            <label
              key={key}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                isEnabled ? 'bg-slate-50 border-emerald-200 text-slate-900' : 'bg-slate-50/50 border-slate-200 text-slate-400'
              }`}
            >
              <span className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={() => toggleTrigger(key)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
            </label>
          ))}
        </div>
      </div>
    </form>
  );
}
