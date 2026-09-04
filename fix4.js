const fs = require('fs');
let content = fs.readFileSync('apps/web/src/core/permissions/permissionService.ts', 'utf8');

// Insert getMatrixValue before canAccessModule
const matrixCode = `  getMatrixValue(role: RoleItem | string, moduleKey: string, action: 'View'|'Edit'|'Upload'|'Approve'): string {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active)) return 'All';
    
    // We hack the department into the description field in usePermissions.ts
    const deptRaw = active.description || '';
    const assignedRole = active.name || active.roleName || 'User';
    
    let dept = 'Other';
    const d = deptRaw.toLowerCase();
    if (d.includes('staffing')) dept = 'Staffing';
    else if (d.includes('hr') || d.includes('human')) dept = 'HR';
    else if (d.includes('finance')) dept = 'Finance';
    else if (d.includes('marketing')) dept = 'Marketing';

    const matrix: Record<string, Record<string, Record<string, Record<string, string>>>> = {
      'Staffing': {
        'User': {
          'Employees': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Attendance': { View: 'own', Edit: 'Apply / Mark', Upload: 'Yes' },
          'Leave': { View: 'own', Edit: 'Apply', Upload: 'Yes' },
          'Performance': { View: 'own', Edit: 'Restricted', Upload: 'Restricted' },
          'Profile': { View: 'own', Edit: 'Yes', Upload: 'Yes' },
          'Client': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Associate partner': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Openings': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'CRM': { View: 'own', Edit: 'Yes', Upload: 'Yes' },
          'Workforce': { View: 'own', Edit: 'Yes', Upload: 'Restricted' },
          'Campaign Hub': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Internal Payroll': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Transaction': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Invoice': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Credit Note': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Payout': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Management Control': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'calendar and Events': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Announcement': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
        },
        'Admin': {
          'Employees': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Attendance': { View: 'Team', Edit: 'Team', Upload: 'Own' },
          'Leave': { View: 'Team', Edit: 'Team', Upload: 'Own' },
          'Performance': { View: 'Own and Team', Edit: 'Restricted', Upload: 'Restricted' },
          'Profile': { View: 'Own', Edit: 'Own', Upload: 'Own' },
          'Client': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Associate partner': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Openings': { View: 'All', Edit: 'All', Upload: 'All' },
          'CRM': { View: 'Own and Team', Edit: 'Own and Team', Upload: 'Own and Team' },
          'Workforce': { View: 'Own and Team', Edit: 'Own and Team', Upload: 'Own and Team' },
          'Campaign Hub': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Internal Payroll': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Transaction': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Invoice': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Credit Note': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Payout': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Management Control': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'calendar and Events': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Announcement': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
        },
        'Master Admin': {
          'Employees': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Attendance': { View: 'Department', Edit: 'Department', Upload: 'Department' },
          'Leave': { View: 'Department', Edit: 'Department', Upload: 'Department' },
          'Performance': { View: 'Department', Edit: 'Department', Upload: 'Department' },
          'Profile': { View: 'Department', Edit: 'Department', Upload: 'Department' },
          'Client': { View: 'Department', Edit: 'Department', Upload: 'Department' },
          'Associate partner': { View: 'Department', Edit: 'Department', Upload: 'Department' },
          'Openings': { View: 'Department', Edit: 'Department', Upload: 'Department' },
          'CRM': { View: 'Department', Edit: 'Department', Upload: 'Department' },
          'Workforce': { View: 'Department', Edit: 'Department', Upload: 'Department' },
          'Campaign Hub': { View: 'Yes', Edit: 'Restricted', Upload: 'Restricted' },
          'Internal Payroll': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Transaction': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Invoice': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Credit Note': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Payout': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Management Control': { View: 'Only Big Day', Edit: 'Only Big Day', Upload: 'Only Big Day' },
          'calendar and Events': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Announcement': { View: 'Department', Edit: 'Department', Upload: 'Department' },
        }
      },
      'HR': {
        'User': {
          'Employees': { View: 'All', Edit: 'All', Upload: 'All' },
          'Attendance': { View: 'View', Edit: 'View', Upload: 'View' },
          'Leave': { View: 'View', Edit: 'View', Upload: 'View' },
          'Performance': { View: 'View', Edit: 'View', Upload: 'View' },
          'Profile': { View: 'View', Edit: 'View', Upload: 'View' },
          'Client': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Associate partner': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Openings': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'CRM': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Workforce': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Campaign Hub': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Internal Payroll': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Transaction': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Invoice': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Credit Note': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Payout': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Management Control': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'calendar and Events': { View: 'All', Edit: 'All', Upload: 'All' },
          'Announcement': { View: 'All', Edit: 'All', Upload: 'All' },
        }
      },
      'Finance': {
        'User': {
          'Employees': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Attendance': { View: 'own', Edit: 'Apply / Mark', Upload: 'Yes' },
          'Leave': { View: 'own', Edit: 'Apply', Upload: 'Yes' },
          'Performance': { View: 'View', Edit: 'Restricted', Upload: 'Restricted' },
          'Profile': { View: 'own', Edit: 'Yes', Upload: 'Yes' },
          'Client': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Associate partner': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Openings': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'CRM': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Workforce': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Campaign Hub': { View: 'View', Edit: 'Restricted', Upload: 'Restricted' },
          'Internal Payroll': { View: 'All', Edit: 'All', Upload: 'All' },
          'Transaction': { View: 'All', Edit: 'All', Upload: 'All' },
          'Invoice': { View: 'All', Edit: 'All', Upload: 'All' },
          'Credit Note': { View: 'All', Edit: 'All', Upload: 'All' },
          'Payout': { View: 'All', Edit: 'All', Upload: 'All' },
          'Management Control': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'calendar and Events': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Announcement': { View: 'All', Edit: 'All', Upload: 'All' },
        }
      },
      'Marketing': {
        'User': {
          'Employees': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Attendance': { View: 'own', Edit: 'Apply / Mark', Upload: 'Yes' },
          'Leave': { View: 'own', Edit: 'Apply', Upload: 'Yes' },
          'Performance': { View: 'own', Edit: 'Restricted', Upload: 'Restricted' },
          'Profile': { View: 'own', Edit: 'Yes', Upload: 'Yes' },
          'Client': { View: 'All', Edit: 'All', Upload: 'All' },
          'Associate partner': { View: 'All', Edit: 'All', Upload: 'All' },
          'Openings': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'CRM': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Workforce': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Campaign Hub': { View: 'All', Edit: 'All', Upload: 'All' },
          'Internal Payroll': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Transaction': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Invoice': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Credit Note': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Payout': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Management Control': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'calendar and Events': { View: 'Restricted', Edit: 'Restricted', Upload: 'Restricted' },
          'Announcement': { View: 'All', Edit: 'All', Upload: 'All' },
        }
      }
    };
    
    let mod = '';
    const k = moduleKey.toLowerCase();
    if (k.includes('employee')) mod = 'Employees';
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
    
    if (!mod) return 'Restricted';

    const deptMatrix = matrix[dept];
    if (!deptMatrix) return 'Restricted';

    let roleMatrix = deptMatrix[assignedRole];
    if (!roleMatrix && dept !== 'Staffing') {
      roleMatrix = deptMatrix['User'];
    }
    if (!roleMatrix) return 'Restricted';

    const moduleMatrix = roleMatrix[mod];
    if (!moduleMatrix) return 'Restricted';

    const value = moduleMatrix[action];
    if (!value) return 'Restricted';
    return value;
  }
`;

content = content.replace(
  /canAccessModule\(role: RoleItem \| string, moduleKey: string\): boolean \{/,
  matrixCode + "\n\n  canAccessModule(role: RoleItem | string, moduleKey: string): boolean {"
);

// Fix canAccessModule
content = content.replace(
  /canAccessModule\(role: RoleItem \| string, moduleKey: string\): boolean \{[\s\S]*?return this\.hasPermission\(active, `\$\{normKey\}:view`\) \|\| this\.hasPermission\(active, `\$\{normKey\}:read`\) \|\| this\.hasPermission\(active, normKey\);\s*\}/,
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
