import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { guestAuthService, type GuestInvitation } from '../../../services/guest/guestAuthService';
import { useGuestAuth } from '../../../context/GuestAuthContext';
import { OneIcon } from '../../../components/OneIcon';
import OtpVerificationModal from '../../../components/auth/OtpVerificationModal';

export default function GuestLoginPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setGuestSession } = useGuestAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invitation, setInvitation] = useState<GuestInvitation | null>(null);

  const [sendingOtp, setSendingOtp] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchInvitation() {
      if (!token) {
        if (isMounted) {
          setError('No invitation token provided.');
          setLoading(false);
        }
        return;
      }
      try {
        const inv = await guestAuthService.getInvitation(token);
        if (isMounted) {
          if (!inv) {
            setError('Invitation invalid, expired, or revoked.');
          } else {
            setInvitation(inv);
          }
        }
      } catch {
        if (isMounted) setError('Failed to validate invitation.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchInvitation();
    return () => { isMounted = false; };
  }, [token]);

  const handleSendOtp = async () => {
    if (!token || !invitation) return;
    setSendingOtp(true);
    setError('');
    try {
      const res = await guestAuthService.sendGuestOtp(token, invitation.contactNumber);
      setConfirmationResult(res);
      setShowOtpModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!token) return;
    setVerifyingOtp(true);
    try {
      const session = await guestAuthService.verifyGuestOtp(token, confirmationResult, otpCode);
      setGuestSession(session);
      setShowOtpModal(false);
      // Route to guest portal
      navigate(`/guest/associate-partner/${token}`, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const maskContact = (phone: string) => {
    if (phone.length < 4) return phone;
    return `******${phone.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin text-emerald-600 rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden flex flex-col items-center p-8">
        {/* ONE Branding */}
        <div className="mb-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-md mb-4 border border-slate-800 relative">
            <OneIcon className="w-10 h-10 text-emerald-400" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white"></div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">ONE</h1>
          <p className="text-sm text-slate-500 font-medium">Guest Access Portal</p>
        </div>

        {error ? (
          <div className="w-full p-4 bg-rose-50 text-rose-700 text-sm font-semibold rounded-xl border border-rose-200 text-center">
            {error}
          </div>
        ) : (
          <div className="w-full space-y-6">
            <div className="text-center space-y-2">
              <p className="text-slate-600 text-sm font-medium">
                You have been securely invited to access ONE.
              </p>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
                  Registered Contact
                </span>
                <span className="text-lg font-mono font-bold text-slate-800">
                  {maskContact(invitation!.contactNumber)}
                </span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={sendingOtp}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
            >
              {sendingOtp ? 'Sending OTP...' : 'Send Verification OTP'}
            </button>
            <div id="recaptcha-container" className="hidden"></div>
          </div>
        )}
      </div>

      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
            <OtpVerificationModal
              otpCode={otpCode}
              setOtpCode={setOtpCode}
              timerSeconds={0}
              canResendOtp={true}
              onResendOtp={handleSendOtp}
              onVerifyNext={handleVerifyOtp}
              isLoading={verifyingOtp}
              targetMobileNumber={maskContact(invitation!.contactNumber)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
