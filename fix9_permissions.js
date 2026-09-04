const fs = require('fs');

let usePermissions = fs.readFileSync('apps/web/src/hooks/usePermissions.ts', 'utf8');

const newRoleLogic = `  const activeRole = useMemo(() => {
    // We create a fake role item capturing the assigned role and department.
    if (simulatedRole) return simulatedRole;
    
    let finalRoleName = 'User';
    if (employee?.role === 'Super Admin' || employee?.assignedRole === 'Super Admin') {
       finalRoleName = 'Super Admin';
    } else {
       finalRoleName = employee?.assignedRole || employee?.role || 'User';
       if (!['User', 'Admin', 'Master Admin', 'Super Admin'].includes(finalRoleName)) {
          finalRoleName = 'User';
       }
    }

    return {
       id: employee?.id || 'dummy',
       name: finalRoleName,
       roleName: finalRoleName,
       description: employee?.department || 'Other',
       permissions: [],
       viewScope: 'Organization'
    } as unknown as RoleItem;
  }, [employee, simulatedRole]);`;

usePermissions = usePermissions.replace(/  const activeRole = useMemo\(\(\) => \{[\s\S]*?\}, \[employee, simulatedRole\]\);/, newRoleLogic);
fs.writeFileSync('apps/web/src/hooks/usePermissions.ts', usePermissions);

console.log("Updated usePermissions.ts");
