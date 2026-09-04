const fs = require('fs');
const path = require('path');

const filePath = path.resolve('../apps/web/src/pages/Employee/pages/ProfilePage.tsx');
let text = fs.readFileSync(filePath, 'utf8');

text = text.replace(
  "import { User, ShieldCheck, CreditCard, MapPin, CheckCircle2, AlertCircle, Save, Eye, EyeOff, FileText, Download } from 'lucide-react';",
  "import { User, ShieldCheck, CreditCard, MapPin, CheckCircle2, AlertCircle, Save, Eye, EyeOff, FileText, Download, Phone, Mail, Check, X } from 'lucide-react';\nimport { firebasePhoneAuthProvider } from '../../../services/auth/providers/firebasePhoneAuthProvider';"
);

text = text.replace(
  "const [address, setAddress] = useState('');",
  "const [email, setEmail] = useState('');\n  const [mobileNumber, setMobileNumber] = useState('');\n  const [originalMobile, setOriginalMobile] = useState('');\n  const [isMobileVerified, setIsMobileVerified] = useState(true);\n  const [otpStep, setOtpStep] = useState<'idle' | 'sending' | 'verifying'>('idle');\n  const [otpCode, setOtpCode] = useState('');\n  const [confirmationResult, setConfirmationResult] = useState<any>(null);\n\n  const [address, setAddress] = useState('');"
);

text = text.replace(
  "setAddress(empRecord.address || '');",
  "setEmail(empRecord.email || '');\n          setMobileNumber(empRecord.mobileNumber || '');\n          setOriginalMobile(empRecord.mobileNumber || '');\n          setIsMobileVerified(empRecord.mobileVerified ?? true);\n          setAddress(empRecord.address || '');"
);

text = text.replace(
  "const updatedPayload: Partial<Employee> = {",
  "const updatedPayload: Partial<Employee> = {\n        email: email.trim(),"
);

const newMethods = `
  const handleSendOtp = async () => {
    if (!mobileNumber || mobileNumber === originalMobile) return;
    try {
      setOtpStep('sending');
      setErrorMsg(null);
      const { confirmationResult } = await firebasePhoneAuthProvider.linkPhoneOtp(mobileNumber, 'profile-recaptcha-container');
      setConfirmationResult(confirmationResult);
      setOtpStep('verifying');
      setStatusMsg('OTP Sent successfully. Please check your phone.');
    } catch (e: any) {
      setErrorMsg('Failed to send OTP: ' + (e.message || 'Error occurred'));
      setOtpStep('idle');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || !confirmationResult) return;
    try {
      setOtpStep('sending');
      setErrorMsg(null);
      const isValid = await firebasePhoneAuthProvider.verifyOtp(confirmationResult, otpCode);
      if (isValid) {
        setIsMobileVerified(true);
        setOriginalMobile(mobileNumber);
        if (employee?.id) {
          await employeeService.updateEmployeeFields(employee.id, { mobileNumber, mobileVerified: true });
        }
        setStatusMsg('Mobile Number verified and updated successfully!');
        setOtpStep('idle');
      }
    } catch (e: any) {
      setErrorMsg('Invalid OTP: ' + (e.message || 'Error occurred'));
      setOtpStep('verifying');
    }
  };
`;

text = text.replace(
  "const handleSaveProfile = async (e: React.FormEvent) => {",
  newMethods + "\n  const handleSaveProfile = async (e: React.FormEvent) => {"
);

const fieldsToInsert = `
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={employee?.joiningDate || ''}
                    readOnly
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-xs font-bold text-slate-700 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <Mail size={16} className="text-emerald-600" /> Contact Details
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address (Profile)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Verified Mobile Number</label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => {
                         setMobileNumber(e.target.value);
                         if (e.target.value !== originalMobile) {
                            setIsMobileVerified(false);
                            setOtpStep('idle');
                         } else {
                            setIsMobileVerified(true);
                         }
                      }}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                    />
                    {isMobileVerified ? (
                      <div className="flex items-center gap-1 text-emerald-600 text-[11px] font-bold bg-emerald-50 px-2 rounded-lg border border-emerald-100 shrink-0">
                        <Check size={14} /> Verified
                      </div>
                    ) : (
                      <button type="button" onClick={handleSendOtp} disabled={otpStep === 'sending'} className="shrink-0 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50">
                        {otpStep === 'sending' ? 'Sending...' : 'Send OTP'}
                      </button>
                    )}
                  </div>
                  {!isMobileVerified && otpStep === 'verifying' && (
                    <div className="mt-2 flex gap-2 items-center bg-blue-50 p-2 rounded-lg border border-blue-100">
                      <input type="text" placeholder="Enter OTP" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} className="w-full text-xs p-2 rounded border border-blue-200" />
                      <button type="button" onClick={handleVerifyOtp} className="px-3 py-2 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700">Verify</button>
                    </div>
                  )}
                  <div id="profile-recaptcha-container"></div>
                </div>
`;

text = text.replace(
  /<\/div>\s*<\/div>\s*\{\/\* Personal Details \*\/\}/,
  fieldsToInsert + "\n              </div>\n            </div>\n\n            {/* Personal Details */}"
);

fs.writeFileSync(filePath, text);
console.log('ProfilePage.tsx updated successfully.');
