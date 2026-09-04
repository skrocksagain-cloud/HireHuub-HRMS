const fs = require('fs');
let content = fs.readFileSync('apps/web/src/core/permissions/permissionService.ts', 'utf8');

// I will just add import type { RoleItem } from '../../types/Admin'; at the top.
// Also fix Sidebar.tsx unused canAccessModule by removing the unused import.

content = `import type { RoleItem } from '../../types/Admin';\nexport interface PermissionValidationResult { valid: boolean; warnings: string[]; }\n` + content;
fs.writeFileSync('apps/web/src/core/permissions/permissionService.ts', content);

let sidebar = fs.readFileSync('apps/web/src/components/layout/Sidebar.tsx', 'utf8');
sidebar = sidebar.replace(/canAccessModule,?/g, '');
fs.writeFileSync('apps/web/src/components/layout/Sidebar.tsx', sidebar);

// Also we have errors in announcementService.ts and calendarService.ts (parameter 'd' implicitly any).
// Let's fix them too.
let announce = fs.readFileSync('apps/web/src/services/announcement/announcementService.ts', 'utf8');
announce = announce.replace(/filter\(\(d\)/g, 'filter((d: any)');
fs.writeFileSync('apps/web/src/services/announcement/announcementService.ts', announce);

let cal = fs.readFileSync('apps/web/src/services/calendar/calendarService.ts', 'utf8');
cal = cal.replace(/filter\(\(d\)/g, 'filter((d: any)');
fs.writeFileSync('apps/web/src/services/calendar/calendarService.ts', cal);

// also in permissionService we need to prefix the unused parameters with _
content = content.replace(/targetEmployeeId\?/g, '_targetEmployeeId?');
content = content.replace(/documentType\?/g, '_documentType?');
fs.writeFileSync('apps/web/src/core/permissions/permissionService.ts', content);

