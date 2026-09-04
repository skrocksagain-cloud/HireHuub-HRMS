const fs = require('fs');

const filePath = '../apps/web/src/pages/Employee/pages/ProfilePage.tsx';
let text = fs.readFileSync(filePath, 'utf8');

// 1. Remove state variables
text = text.replace(
`  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [originalMobile, setOriginalMobile] = useState('');
  const [isMobileVerified, setIsMobileVerified] = useState(true);
  const [otpStep, setOtpStep] = useState<'idle' | 'sending' | 'verifying'>('idle');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);`,
`  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');`
);

// 2. Remove fetchProfile state setting for verified
text = text.replace(
`          setEmail(empRecord.email || '');
          setMobileNumber(empRecord.mobileNumber || '');
          setOriginalMobile(empRecord.mobileNumber || '');
          setIsMobileVerified(empRecord.mobileVerified ?? true);`,
`          setEmail(empRecord.email || '');
          setMobileNumber(empRecord.mobileNumber || '');`
);

// 3. Remove unmount cleanup
text = text.replace(
`    return () => {
      isMounted = false;
      firebasePhoneAuthProvider.clearVerifier();
    };`,
`    return () => {
      isMounted = false;
    };`
);

// 4. Remove handleSendOtp and handleVerifyOtp
text = text.replace(/const handleSendOtp = async \(\) => \{[\s\S]*?const handleVerifyOtp = async \(\) => \{[\s\S]*?setStatusMsg\('Mobile Number verified and updated successfully!'\);\n        setOtpStep\('idle'\);\n      \}\n    \} catch \(e: any\) \{\n      setErrorMsg\('Invalid OTP: ' \+ \(e\.message \|\| 'Error occurred'\)\);\n      setOtpStep\('verifying'\);\n    \}\n  \};\n/m, '');

// 5. Replace Contact Details UI
text = text.replace(/<div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">\s*<div className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">\s*<Mail size=\{16\} className="text-emerald-600" \/> Contact Details\s*<\/div>\s*<div className="grid grid-cols-1 md:grid-cols-2 gap-4">\s*<div>\s*<label className="block text-xs font-semibold text-slate-700 mb-1">Email Address \(Profile\)<\/label>\s*<input\s*type="email"\s*value=\{email\}\s*onChange=\{\(e\) => setEmail\(e\.target\.value\)\}\s*required\s*className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"\s*\/>\s*<\/div>\s*<div>\s*<label className="block text-xs font-semibold text-slate-700 mb-1">Verified Mobile Number<\/label>\s*<div className="flex gap-2">[\s\S]*?<div id="profile-recaptcha-container"><\/div>\s*<\/div>\s*<\/div>\s*<\/div>/m,
`<div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>`);

// 6. Fix handleSaveProfile payload
text = text.replace(
`const updatedPayload: Partial<Employee> = {
      email: email.trim(),
      address: address.trim(),`,
`const updatedPayload: Partial<Employee> = {
      email: email.trim(),
      mobileNumber: mobileNumber.trim(),
      address: address.trim(),`
);

// 7. Remove firebasePhoneAuthProvider import
text = text.replace(
  `import { firebasePhoneAuthProvider } from '../../../services/auth/providers/firebasePhoneAuthProvider';`,
  ``
);

fs.writeFileSync(filePath, text);
console.log('ProfilePage.tsx cleaned from OTP.');
