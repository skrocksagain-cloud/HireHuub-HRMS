const fs = require('fs');
const filePath = '../apps/web/src/pages/Employee/pages/ProfilePage.tsx';
let text = fs.readFileSync(filePath, 'utf8');

// The strategy is to replace `onChange={(e) => setSomething(e.target.value)}` with `readOnly className="..."` 
// and add cursor-not-allowed / bg-slate-100 to the className for these fields.
const fields = [
  { state: 'address', setter: 'setAddress' },
  { state: 'fatherName', setter: 'setFatherName' },
  { state: 'motherName', setter: 'setMotherName' },
  { state: 'dateOfBirth', setter: 'setDateOfBirth' },
  { state: 'bankName', setter: 'setBankName' },
  { state: 'branchName', setter: 'setBranchName' },
  { state: 'ifscCode', setter: 'setIfscCode' }
];

fields.forEach(field => {
  const regex = new RegExp(`onChange=\\{\\(e\\) => ${field.setter}\\([^)]+\\)\\}`, 'g');
  text = text.replace(regex, 'readOnly');
});

// For inputs that might have bg-white, switch to bg-slate-100 cursor-not-allowed
// E.g., className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
const bgWhiteRegex = /bg-white(.*?)focus:border-emerald-500 focus:outline-none/g;

// Only apply to the ones we just made readOnly, or basically all inputs that are not email and mobile
// Since we can't easily parse AST here, let's just do a simple replacement for the specific components:
text = text.replace(
  /<textarea\s+value=\{address\}\s+readOnly\s+rows=\{3\}\s+className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"/g,
  '<textarea value={address} readOnly rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-xs text-slate-700 cursor-not-allowed outline-none"'
);

// We'll replace the others manually if needed, but let's just disable them all via an overarching script or let's not bother with CSS class if it's too risky. The `readOnly` attribute is sufficient to prevent edits.
// But wait! Aadhaar, PAN, and Account Number have toggles (mask/unmask).
text = text.replace(/onChange=\{\(e\) => setAadhaarNumber\(e.target.value\)\}/g, 'readOnly');
text = text.replace(/onChange=\{\(e\) => setPanNumber\(e.target.value.toUpperCase\(\)\)\}/g, 'readOnly');
text = text.replace(/onChange=\{\(e\) => setAccountNumber\(e.target.value\)\}/g, 'readOnly');

// Add disabled class to the inputs that are readOnly now (this regex is safe enough if we only target those specific values)
const stateVars = ['fatherName', 'motherName', 'dateOfBirth', 'aadhaarNumber', 'panNumber', 'bankName', 'branchName', 'accountNumber', 'ifscCode'];

stateVars.forEach(v => {
  text = text.replace(
    new RegExp(`value=\\{${v}\\}\\s+readOnly\\s+(placeholder="[^"]*")?\\s*className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs (font-mono )?(uppercase )?text-slate-800 focus:border-emerald-500 focus:outline-none"`, 'g'),
    `value={${v}} readOnly $1 className="w-full rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-xs $2$3text-slate-700 cursor-not-allowed outline-none"`
  );
});

fs.writeFileSync(filePath, text);
console.log('UI fields made read-only successfully.');
