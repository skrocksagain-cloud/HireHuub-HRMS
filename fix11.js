const fs = require('fs');
let usePermissions = fs.readFileSync('apps/web/src/hooks/usePermissions.ts', 'utf8');

usePermissions = usePermissions.replace(/const employee = user as Employee \| null;/g, 'const employee = user as any;');

fs.writeFileSync('apps/web/src/hooks/usePermissions.ts', usePermissions);
console.log("Updated usePermissions.ts");
