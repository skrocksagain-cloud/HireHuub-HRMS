const fs = require('fs');

let sidebar = fs.readFileSync('apps/web/src/components/layout/Sidebar.tsx', 'utf8');

const newSidebarLogic = `  const isItemVisible = (path: string): boolean => {
    const p = path.toLowerCase();
    if (p === "/dashboard") return true;
    if (p.includes("/profile")) return canView("profile");
    if (p.includes("/attendance")) return canView("attendance");
    if (p.includes("/leave")) return canView("leave");
    if (p.includes("/performance")) return canView("performance");
    if (p.includes("/employees") || p.includes("/people")) return canView("employees");
    if (p.includes("/workbench/network/clients")) return canView("client");
    if (p.includes("/workbench/network/associate-partners")) return canView("associatePartner");
    if (p.includes("/workbench/staffing-hub/openings")) return canView("openings");
    if (p.includes("/workbench/crm")) return canView("crm");
    if (p.includes("/workbench/workforce")) return canView("workforce");
    if (p.includes("/workbench/campaign-hub")) return canView("campaignHub");
    if (p.includes("/finance/billing/invoices")) return canView("invoices");
    if (p.includes("/finance/billing/credit-notes")) return canView("creditNotes");
    if (p.includes("/finance/payroll")) return canView("internalPayroll");
    if (p.includes("/finance/transactions")) return canView("transactions");
    if (p.includes("/finance/payout")) return canView("payout");
    if (p.includes("/management") || p.includes("/settings")) return canView("managementControl");
    if (p.includes("/administration/calendar")) return canView("calendar");
    if (p.includes("/administration/announcements")) return canView("announcements");
    return true;
  };`;

sidebar = sidebar.replace(/const isItemVisible = \(path: string\): boolean => \{[\s\S]*?return true;\s*\};\n/, newSidebarLogic + '\n');
fs.writeFileSync('apps/web/src/components/layout/Sidebar.tsx', sidebar);

console.log("Updated Sidebar.tsx");
