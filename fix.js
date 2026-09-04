const fs = require('fs');
let content = fs.readFileSync('apps/web/src/core/permissions/permissionService.ts', 'utf8');

// Replace evaluateMatrix with getMatrixValue and fix the methods
content = content.replace(
  /private evaluateMatrix\(role: RoleItem, moduleKey: string, action: 'View'\|'Edit'\|'Upload'\|'Approve'\): boolean \{/,
  "getMatrixValue(role: RoleItem | string, moduleKey: string, action: 'View'|'Edit'|'Upload'|'Approve'): string {"
);

// We need to fix the return values of getMatrixValue to return strings instead of booleans
content = content.replace(/if \(\!mod\) return false;/g, "if (!mod) return 'Restricted';");
content = content.replace(/if \(\!deptMatrix\) return false;/g, "if (!deptMatrix) return 'Restricted';");
content = content.replace(/if \(\!roleMatrix\) return false;/g, "if (!roleMatrix) return 'Restricted';");
content = content.replace(/if \(\!moduleMatrix\) return false;/g, "if (!moduleMatrix) return 'Restricted';");

content = content.replace(
  /if \(action === 'Approve'\) \{\s*return assignedRole !== 'User';\s*\}/,
  ""
);

content = content.replace(
  /const value = moduleMatrix\[action\];\s*if \(\!value\) return false;\s*const v = value\.toLowerCase\(\);\s*return v !== 'restricted' && v !== 'none';/,
  "const value = moduleMatrix[action];\n    if (!value) return 'Restricted';\n    return value;"
);

content = content.replace(
  /canAccessModule\(role: RoleItem \| string, moduleKey: string\): boolean \{[\s\S]*?return this\.evaluateMatrix\(active, moduleKey, 'View'\);\s*\}/,
  "canAccessModule(role: RoleItem | string, moduleKey: string): boolean {\n    if (moduleKey === 'dashboard' || moduleKey === 'dashboard-shell') return true;\n    const active = this.getEffectiveRole(role);\n    if (this.isSuperAdmin(active)) return true;\n    const val = this.getMatrixValue(active, moduleKey, 'View').toLowerCase();\n    return val !== 'restricted' && val !== 'none';\n  }"
);

const newMethods = `
  getApprovalScope(role: RoleItem | string): string {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active)) return 'All';
    const assignedRole = active.name || active.roleName || 'User';
    if (assignedRole === 'Master Admin') return 'Department';
    if (assignedRole === 'Admin') return 'Team';
    return 'None';
  }

  canView(role: RoleItem | string, moduleKey: string, recordDeptId?: string, recordOwnerId?: string, currentUserId?: string): boolean {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active)) return true;
    const val = this.getMatrixValue(active, moduleKey, 'View').toLowerCase();
    if (val === 'restricted' || val === 'none') return false;
    if (val === 'own' && recordOwnerId && currentUserId) return recordOwnerId === currentUserId;
    if (val === 'department' && recordDeptId) return recordDeptId === (active.description || '');
    return true;
  }

  canCreate(role: RoleItem | string, moduleKey: string): boolean {
    return this.canEdit(role, moduleKey);
  }

  canEdit(role: RoleItem | string, moduleKey: string, recordDeptId?: string, recordOwnerId?: string, currentUserId?: string): boolean {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active)) return true;
    const val = this.getMatrixValue(active, moduleKey, 'Edit').toLowerCase();
    if (val === 'restricted' || val === 'none' || val === 'view') return false;
    if (val === 'own' && recordOwnerId && currentUserId) return recordOwnerId === currentUserId;
    if (val === 'department' && recordDeptId) return recordDeptId === (active.description || '');
    return true;
  }

  canUpload(role: RoleItem | string, moduleKey: string, recordDeptId?: string, recordOwnerId?: string, currentUserId?: string): boolean {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active)) return true;
    const val = this.getMatrixValue(active, moduleKey, 'Upload').toLowerCase();
    if (val === 'restricted' || val === 'none' || val === 'view') return false;
    if (val === 'own' && recordOwnerId && currentUserId) return recordOwnerId === currentUserId;
    if (val === 'department' && recordDeptId) return recordDeptId === (active.description || '');
    return true;
  }

  canDelete(role: RoleItem | string, moduleKey: string): boolean {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active)) return true;
    const val = this.getMatrixValue(active, moduleKey, 'Edit').toLowerCase();
    return val !== 'restricted' && val !== 'none' && val !== 'view';
  }

  canApprove(role: RoleItem | string, moduleKey: string, targetDeptId?: string, targetEmployeeId?: string): boolean {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active)) return true;
    const scope = this.getApprovalScope(active);
    if (scope === 'None') return false;
    if (scope === 'Department' && targetDeptId) return targetDeptId === (active.description || '');
    return true;
  }

  canReject(role: RoleItem | string, moduleKey: string): boolean {
    return this.canApprove(role, moduleKey);
  }

  canExport(role: RoleItem | string, moduleKey: string): boolean {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active)) return true;
    const val = this.getMatrixValue(active, moduleKey, 'View').toLowerCase();
    return val !== 'restricted' && val !== 'none';
  }
`;

content = content.replace(
  /canView\(role: RoleItem \| string, moduleKey: string, recordDeptId\?: string, recordOwnerId\?: string, currentUserId\?: string\): boolean \{[\s\S]*?canGenerateDocument/g,
  newMethods + '\n\n  canGenerateDocument'
);

fs.writeFileSync('apps/web/src/core/permissions/permissionService.ts', content);
