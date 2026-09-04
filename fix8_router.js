const fs = require('fs');
let router = fs.readFileSync('apps/web/src/routes/AppRouter.tsx', 'utf8');

router = router.replace(/moduleKey="employees"/g, 'moduleKey="employees"'); // baseline
router = router.replace(/path="\/profile" element=\{<ProtectedRoute moduleKey="employees"/g, 'path="/profile" element={<ProtectedRoute moduleKey="profile"');
router = router.replace(/path="\/people\/profile" element=\{<ProtectedRoute moduleKey="employees"/g, 'path="/people/profile" element={<ProtectedRoute moduleKey="profile"');
router = router.replace(/path="\/attendance" element=\{<ProtectedRoute moduleKey="employees"/g, 'path="/attendance" element={<ProtectedRoute moduleKey="attendance"');
router = router.replace(/path="\/leave" element=\{<ProtectedRoute moduleKey="employees"/g, 'path="/leave" element={<ProtectedRoute moduleKey="leave"');
router = router.replace(/path="\/performance" element=\{<ProtectedRoute moduleKey="employees"/g, 'path="/performance" element={<ProtectedRoute moduleKey="performance"');

router = router.replace(/path="\/organization" element=\{<ProtectedRoute moduleKey="management"/g, 'path="/organization" element={<ProtectedRoute moduleKey="managementControl"');
router = router.replace(/path="\/reports" element=\{<ProtectedRoute moduleKey="management"/g, 'path="/reports" element={<ProtectedRoute moduleKey="managementControl"');
router = router.replace(/path="\/settings" element=\{<ProtectedRoute moduleKey="management"/g, 'path="/settings" element={<ProtectedRoute moduleKey="managementControl"');
router = router.replace(/path="\/management" element=\{<ProtectedRoute moduleKey="management"/g, 'path="/management" element={<ProtectedRoute moduleKey="managementControl"');
router = router.replace(/path="\/administration\/calendar" element=\{<ProtectedRoute moduleKey="management"/g, 'path="/administration/calendar" element={<ProtectedRoute moduleKey="calendar"');
router = router.replace(/path="\/administration\/announcements" element=\{<ProtectedRoute moduleKey="management"/g, 'path="/administration/announcements" element={<ProtectedRoute moduleKey="announcements"');

router = router.replace(/path="\/workbench\/network\/clients" element=\{<ProtectedRoute moduleKey="recruitment"/g, 'path="/workbench/network/clients" element={<ProtectedRoute moduleKey="client"');
router = router.replace(/path="\/workbench\/network\/clients\/:id" element=\{<ProtectedRoute moduleKey="recruitment"/g, 'path="/workbench/network/clients/:id" element={<ProtectedRoute moduleKey="client"');
router = router.replace(/path="\/workbench\/network\/associate-partners" element=\{<ProtectedRoute path="\/workbench\/network\/associate-partners"/g, 'path="/workbench/network/associate-partners" element={<ProtectedRoute moduleKey="associatePartner"');
router = router.replace(/path="\/workbench\/network\/associate-partners\/:id" element=\{<ProtectedRoute path="\/workbench\/network\/associate-partners\/:id"/g, 'path="/workbench/network/associate-partners/:id" element={<ProtectedRoute moduleKey="associatePartner"');
router = router.replace(/path="\/workbench\/staffing-hub" element=\{<ProtectedRoute moduleKey="recruitment"/g, 'path="/workbench/staffing-hub" element={<ProtectedRoute moduleKey="openings"'); // generic hub
router = router.replace(/path="\/workbench\/staffing-hub\/openings" element=\{<ProtectedRoute moduleKey="recruitment"/g, 'path="/workbench/staffing-hub/openings" element={<ProtectedRoute moduleKey="openings"');
router = router.replace(/path="\/workbench\/staffing-hub\/openings\/:id" element=\{<ProtectedRoute moduleKey="recruitment"/g, 'path="/workbench/staffing-hub/openings/:id" element={<ProtectedRoute moduleKey="openings"');
router = router.replace(/path="\/workbench\/crm" element=\{<ProtectedRoute moduleKey="recruitment"/g, 'path="/workbench/crm" element={<ProtectedRoute moduleKey="crm"');
router = router.replace(/path="\/workbench\/workforce" element=\{<ProtectedRoute moduleKey="recruitment"/g, 'path="/workbench/workforce" element={<ProtectedRoute moduleKey="workforce"');
router = router.replace(/path="\/workbench\/campaign-hub" element=\{<ProtectedRoute moduleKey="recruitment"/g, 'path="/workbench/campaign-hub" element={<ProtectedRoute moduleKey="campaignHub"');
router = router.replace(/path="\/workbench\/campaign-hub\/:campaignId" element=\{<ProtectedRoute moduleKey="recruitment"/g, 'path="/workbench/campaign-hub/:campaignId" element={<ProtectedRoute moduleKey="campaignHub"');
router = router.replace(/path="\/finance\/payroll" element=\{<ProtectedRoute moduleKey="finance"/g, 'path="/finance/payroll" element={<ProtectedRoute moduleKey="internalPayroll"');
router = router.replace(/path="\/finance\/payout" element=\{<ProtectedRoute moduleKey="finance"/g, 'path="/finance/payout" element={<ProtectedRoute moduleKey="payout"');
router = router.replace(/path="\/finance\/billing\/invoices" element=\{<ProtectedRoute moduleKey="finance"/g, 'path="/finance/billing/invoices" element={<ProtectedRoute moduleKey="invoices"');
router = router.replace(/path="\/finance\/billing\/invoices\/:invoiceId" element=\{<ProtectedRoute moduleKey="finance"/g, 'path="/finance/billing/invoices/:invoiceId" element={<ProtectedRoute moduleKey="invoices"');
router = router.replace(/path="\/finance\/billing\/credit-notes" element=\{<ProtectedRoute moduleKey="finance"/g, 'path="/finance/billing/credit-notes" element={<ProtectedRoute moduleKey="creditNotes"');
router = router.replace(/path="\/finance\/transactions" element=\{<ProtectedRoute moduleKey="finance"/g, 'path="/finance/transactions" element={<ProtectedRoute moduleKey="transactions"');

fs.writeFileSync('apps/web/src/routes/AppRouter.tsx', router);
console.log("Updated AppRouter.tsx");
