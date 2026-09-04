const fs = require('fs');
let content = fs.readFileSync('apps/web/src/core/permissions/permissionService.ts', 'utf8');

// Fix canAccessModule
content = content.replace(
  /canAccessModule\(role: RoleItem \| string, moduleKey: string\): boolean \{[\s\S]*?return this\.hasPermission\(active, normKey\);\s*\}/,
  `canAccessModule(role: RoleItem | string, moduleKey: string): boolean {
    if (moduleKey === 'dashboard' || moduleKey === 'dashboard-shell') return true;
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active)) return true;
    const val = this.getMatrixValue(active, moduleKey, 'View').toLowerCase();
    return val !== 'restricted' && val !== 'none';
  }`
);

// Delete everything from canView to canManage, and replace it
const methodsToReplace = /canView\(role: RoleItem \| string, moduleKey: string, recordDeptId\?: string, recordOwnerId\?: string, currentUserId\?: string\): boolean \{[\s\S]*?canGenerateDocument\(role: RoleItem \| string, documentType\?: string\): boolean \{[\s\S]*?documents:generate'\);\s*\}/;

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

  canGenerateDocument(role: RoleItem | string, documentType?: string): boolean {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active)) return true;
    const val = this.getMatrixValue(active, 'Documents', 'Upload').toLowerCase();
    return val !== 'restricted' && val !== 'none' && val !== 'view';
  }
`;

content = content.replace(methodsToReplace, newMethods);

fs.writeFileSync('apps/web/src/core/permissions/permissionService.ts', content);
