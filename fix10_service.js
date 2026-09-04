const fs = require('fs');

let permissionService = fs.readFileSync('apps/web/src/core/permissions/permissionService.ts', 'utf8');

const newMatrixResolution = `    let mod = '';
    const k = moduleKey.toLowerCase();
    
    // Explicit Canonical Keys
    if (k === 'dashboard') mod = 'Dashboard'; // Always allowed later
    else if (k === 'profile') mod = 'Profile';
    else if (k === 'employees') mod = 'Employees';
    else if (k === 'attendance') mod = 'Attendance';
    else if (k === 'leave') mod = 'Leave';
    else if (k === 'performance') mod = 'Performance';
    else if (k === 'client') mod = 'Client';
    else if (k === 'associatepartner') mod = 'Associate partner';
    else if (k === 'openings') mod = 'Openings';
    else if (k === 'crm') mod = 'CRM';
    else if (k === 'workforce') mod = 'Workforce';
    else if (k === 'campaignhub') mod = 'Campaign Hub';
    else if (k === 'internalpayroll') mod = 'Internal Payroll';
    else if (k === 'transactions') mod = 'Transaction';
    else if (k === 'payout') mod = 'Payout';
    else if (k === 'invoices') mod = 'Invoice';
    else if (k === 'creditnotes') mod = 'Credit Note';
    else if (k === 'managementcontrol') mod = 'Management Control';
    else if (k === 'calendar') mod = 'calendar and Events';
    else if (k === 'announcements') mod = 'Announcement';
    
    // Fallbacks just in case
    else if (k.includes('employee')) mod = 'Employees';
    else if (k.includes('attendance')) mod = 'Attendance';
    else if (k.includes('leave')) mod = 'Leave';
    else if (k.includes('performance') || k.includes('appraisal')) mod = 'Performance';
    else if (k.includes('profile')) mod = 'Profile';
    else if (k.includes('client')) mod = 'Client';
    else if (k.includes('associate') || k.includes('ap')) mod = 'Associate partner';
    else if (k.includes('opening') || k.includes('recruitment')) mod = 'Openings';
    else if (k.includes('crm') || k.includes('candidate')) mod = 'CRM';
    else if (k.includes('workforce') || k.includes('staffing')) mod = 'Workforce';
    else if (k.includes('campaign')) mod = 'Campaign Hub';
    else if (k.includes('payroll')) mod = 'Internal Payroll';
    else if (k.includes('transaction') || k.includes('expense')) mod = 'Transaction';
    else if (k.includes('invoice')) mod = 'Invoice';
    else if (k.includes('credit')) mod = 'Credit Note';
    else if (k.includes('payout')) mod = 'Payout';
    else if (k.includes('management') || k.includes('admin') || k.includes('document')) mod = 'Management Control';
    else if (k.includes('calendar') || k.includes('event')) mod = 'calendar and Events';
    else if (k.includes('announcement') || k.includes('dashboard')) mod = 'Announcement';
    
    if (!mod) return 'Restricted';`;

permissionService = permissionService.replace(/    let mod = '';[\s\S]*?if \(!mod\) return 'Restricted';/, newMatrixResolution);

fs.writeFileSync('apps/web/src/core/permissions/permissionService.ts', permissionService);

console.log("Updated permissionService.ts");
