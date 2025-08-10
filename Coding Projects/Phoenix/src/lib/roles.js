// Role definitions for Phoenix organization membership
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin', 
  MEMBER: 'member'
}

// Workspace-level roles
export const WORKSPACE_ROLES = {
  ADMIN: 'workspace_admin',
  MEMBER: 'workspace_member'
}

// Project-level roles
export const PROJECT_ROLES = {
  ADMIN: 'project_admin',
  MEMBER: 'project_member'
}

// Role display names
export const ROLE_NAMES = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.MEMBER]: 'Member'
}

// Workspace role display names
export const WORKSPACE_ROLE_NAMES = {
  [WORKSPACE_ROLES.ADMIN]: 'Workspace Admin',
  [WORKSPACE_ROLES.MEMBER]: 'Workspace Member'
}

// Project role display names
export const PROJECT_ROLE_NAMES = {
  [PROJECT_ROLES.ADMIN]: 'Project Admin',
  [PROJECT_ROLES.MEMBER]: 'Project Member'
}

// Role permissions
export const PERMISSIONS = {
  // Organization management
  MANAGE_ORGANIZATION: 'manage_organization',
  DELETE_ORGANIZATION: 'delete_organization',
  
  // User management
  INVITE_USERS: 'invite_users',
  REMOVE_USERS: 'remove_users',
  MANAGE_USER_ROLES: 'manage_user_roles',
  
  // Workspace management
  CREATE_WORKSPACES: 'create_workspaces',
  DELETE_WORKSPACES: 'delete_workspaces',
  MANAGE_WORKSPACE_SETTINGS: 'manage_workspace_settings',
  
  // Workspace-level permissions
  WORKSPACE_MANAGE_MEMBERS: 'workspace_manage_members',
  WORKSPACE_MANAGE_PROJECTS: 'workspace_manage_projects',
  WORKSPACE_MANAGE_SETTINGS: 'workspace_manage_settings',
  WORKSPACE_VIEW_ANALYTICS: 'workspace_view_analytics',
  
  // Project management
  CREATE_PROJECTS: 'create_projects',
  DELETE_PROJECTS: 'delete_projects',
  MANAGE_PROJECT_SETTINGS: 'manage_project_settings',
  
  // Project-level permissions
  PROJECT_MANAGE_MEMBERS: 'project_manage_members',
  PROJECT_MANAGE_SETTINGS: 'project_manage_settings',
  PROJECT_VIEW_ANALYTICS: 'project_view_analytics',
  
  // CRM access
  MANAGE_CONTACTS: 'manage_contacts',
  MANAGE_COMPANIES: 'manage_companies',
  MANAGE_DEALS: 'manage_deals',
  
  // Basic access
  VIEW_ORGANIZATION: 'view_organization',
  VIEW_PROJECTS: 'view_projects',
  VIEW_CRM: 'view_crm'
}

// Role-based permissions mapping
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // Organization level (only super admin)
    PERMISSIONS.MANAGE_ORGANIZATION,
    PERMISSIONS.DELETE_ORGANIZATION,
    
    // User management
    PERMISSIONS.INVITE_USERS,
    PERMISSIONS.REMOVE_USERS,
    PERMISSIONS.MANAGE_USER_ROLES,
    
    // Workspace management
    PERMISSIONS.CREATE_WORKSPACES,
    PERMISSIONS.DELETE_WORKSPACES,
    PERMISSIONS.MANAGE_WORKSPACE_SETTINGS,
    
    // Project management
    PERMISSIONS.CREATE_PROJECTS,
    PERMISSIONS.DELETE_PROJECTS,
    PERMISSIONS.MANAGE_PROJECT_SETTINGS,
    
    // CRM management
    PERMISSIONS.MANAGE_CONTACTS,
    PERMISSIONS.MANAGE_COMPANIES,
    PERMISSIONS.MANAGE_DEALS,
    
    // Basic access
    PERMISSIONS.VIEW_ORGANIZATION,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.VIEW_CRM
  ],
  
  [ROLES.ADMIN]: [
    // User management (limited)
    PERMISSIONS.INVITE_USERS,
    
    // Workspace management
    PERMISSIONS.CREATE_WORKSPACES,
    PERMISSIONS.MANAGE_WORKSPACE_SETTINGS,
    
    // Project management
    PERMISSIONS.CREATE_PROJECTS,
    PERMISSIONS.DELETE_PROJECTS,
    PERMISSIONS.MANAGE_PROJECT_SETTINGS,
    
    // CRM management
    PERMISSIONS.MANAGE_CONTACTS,
    PERMISSIONS.MANAGE_COMPANIES,
    PERMISSIONS.MANAGE_DEALS,
    
    // Basic access
    PERMISSIONS.VIEW_ORGANIZATION,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.VIEW_CRM
  ],
  
  [ROLES.MEMBER]: [
    // Project management (limited)
    PERMISSIONS.CREATE_PROJECTS,
    
    // CRM access (limited)
    PERMISSIONS.MANAGE_CONTACTS,
    PERMISSIONS.MANAGE_COMPANIES,
    
    // Basic access
    PERMISSIONS.VIEW_ORGANIZATION,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.VIEW_CRM
  ]
}

/**
 * Check if a user with a specific role has a permission
 * @param {string} role - User's role
 * @param {string} permission - Permission to check
 * @returns {boolean} - Whether the user has the permission
 */
export const hasPermission = (role, permission) => {
  const rolePermissions = ROLE_PERMISSIONS[role] || []
  return rolePermissions.includes(permission)
}

/**
 * Get all permissions for a role
 * @param {string} role - User's role
 * @returns {string[]} - Array of permissions
 */
export const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Check if a role can manage another role
 * @param {string} userRole - Role of the user performing the action
 * @param {string} targetRole - Role being managed
 * @returns {boolean} - Whether the user can manage the target role
 */
export const canManageRole = (userRole, targetRole) => {
  // Super Admin can manage any role
  if (userRole === ROLES.SUPER_ADMIN) {
    return true
  }
  
  // Admin can only manage Members
  if (userRole === ROLES.ADMIN && targetRole === ROLES.MEMBER) {
    return true
  }
  
  // Members cannot manage other roles
  return false
}

/**
 * Get available roles that a user can assign to others
 * @param {string} userRole - Role of the user
 * @returns {string[]} - Array of roles that can be assigned
 */
export const getAssignableRoles = (userRole) => {
  switch (userRole) {
    case ROLES.SUPER_ADMIN:
      return [ROLES.ADMIN, ROLES.MEMBER]
    case ROLES.ADMIN:
      return [ROLES.MEMBER]
    default:
      return []
  }
}

// Workspace role-based permissions mapping
export const WORKSPACE_ROLE_PERMISSIONS = {
  [WORKSPACE_ROLES.ADMIN]: [
    PERMISSIONS.WORKSPACE_MANAGE_MEMBERS,
    PERMISSIONS.WORKSPACE_MANAGE_PROJECTS,
    PERMISSIONS.WORKSPACE_MANAGE_SETTINGS,
    PERMISSIONS.WORKSPACE_VIEW_ANALYTICS,
    PERMISSIONS.CREATE_PROJECTS,
    PERMISSIONS.DELETE_PROJECTS,
    PERMISSIONS.MANAGE_PROJECT_SETTINGS,
    PERMISSIONS.MANAGE_CONTACTS,
    PERMISSIONS.MANAGE_COMPANIES,
    PERMISSIONS.MANAGE_DEALS,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.VIEW_CRM
  ],
  
  [WORKSPACE_ROLES.MEMBER]: [
    PERMISSIONS.CREATE_PROJECTS,
    PERMISSIONS.MANAGE_CONTACTS,
    PERMISSIONS.MANAGE_COMPANIES,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.VIEW_CRM
  ]
}

/**
 * Check if a user with a specific workspace role has a permission
 * @param {string} workspaceRole - User's workspace role
 * @param {string} permission - Permission to check
 * @returns {boolean} - Whether the user has the permission
 */
export const hasWorkspacePermission = (workspaceRole, permission) => {
  const rolePermissions = WORKSPACE_ROLE_PERMISSIONS[workspaceRole] || []
  return rolePermissions.includes(permission)
}

/**
 * Get available workspace roles that a user can assign to others
 * @param {string} userWorkspaceRole - Workspace role of the user
 * @returns {string[]} - Array of workspace roles that can be assigned
 */
export const getAssignableWorkspaceRoles = (userWorkspaceRole) => {
  switch (userWorkspaceRole) {
    case WORKSPACE_ROLES.ADMIN:
      return [WORKSPACE_ROLES.MEMBER]
    default:
      return []
  }
}

// Project role-based permissions mapping
export const PROJECT_ROLE_PERMISSIONS = {
  [PROJECT_ROLES.ADMIN]: [
    PERMISSIONS.PROJECT_MANAGE_MEMBERS,
    PERMISSIONS.PROJECT_MANAGE_SETTINGS,
    PERMISSIONS.PROJECT_VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_CONTACTS,
    PERMISSIONS.MANAGE_COMPANIES,
    PERMISSIONS.MANAGE_DEALS,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.VIEW_CRM
  ],
  
  [PROJECT_ROLES.MEMBER]: [
    PERMISSIONS.MANAGE_CONTACTS,
    PERMISSIONS.MANAGE_COMPANIES,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.VIEW_CRM
  ]
}

/**
 * Check if a user with a specific project role has a permission
 * @param {string} projectRole - User's project role
 * @param {string} permission - Permission to check
 * @returns {boolean} - Whether the user has the permission
 */
export const hasProjectPermission = (projectRole, permission) => {
  const rolePermissions = PROJECT_ROLE_PERMISSIONS[projectRole] || []
  return rolePermissions.includes(permission)
}

/**
 * Get available project roles that a user can assign to others
 * @param {string} userProjectRole - Project role of the user
 * @returns {string[]} - Array of project roles that can be assigned
 */
export const getAssignableProjectRoles = (userProjectRole) => {
  switch (userProjectRole) {
    case PROJECT_ROLES.ADMIN:
      return [PROJECT_ROLES.MEMBER]
    default:
      return []
  }
} 