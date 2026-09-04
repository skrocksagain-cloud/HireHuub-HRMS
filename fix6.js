const fs = require('fs');
let content = fs.readFileSync('apps/web/src/core/permissions/permissionService.ts', 'utf8');
content = content.replace(/canApprove\(role: RoleItem \| string, moduleKey: string,/g, 'canApprove(role: RoleItem | string, _moduleKey: string,');
fs.writeFileSync('apps/web/src/core/permissions/permissionService.ts', content);
