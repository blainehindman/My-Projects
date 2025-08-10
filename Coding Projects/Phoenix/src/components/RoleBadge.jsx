import React from 'react'
import { ROLE_NAMES, ROLES, WORKSPACE_ROLE_NAMES, WORKSPACE_ROLES, PROJECT_ROLE_NAMES, PROJECT_ROLES } from '../lib/roles'

const RoleBadge = ({ role, size = 'default' }) => {
  if (!role) return null

  const getRoleColor = (role) => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return 'var(--color-system-purple)'
      case ROLES.ADMIN:
        return 'var(--color-system-blue)'
      case ROLES.MEMBER:
        return 'var(--color-system-green)'
      case WORKSPACE_ROLES.ADMIN:
        return 'var(--color-system-blue)'
      case WORKSPACE_ROLES.MEMBER:
        return 'var(--color-system-green)'
      case PROJECT_ROLES.ADMIN:
        return 'var(--color-system-blue)'
      case PROJECT_ROLES.MEMBER:
        return 'var(--color-system-green)'
      default:
        return 'var(--color-gray-500)'
    }
  }

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 'text-caption-2'
      case 'large':
        return 'text-footnote'
      default:
        return 'text-caption-1'
    }
  }

  const roleColor = getRoleColor(role)
  const textSize = getTextSize()
  
  // Get the appropriate role name
  const getRoleName = (role) => {
    return ROLE_NAMES[role] || WORKSPACE_ROLE_NAMES[role] || PROJECT_ROLE_NAMES[role] || role
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-md font-medium ${textSize}`}
      style={{
        backgroundColor: `${roleColor}15`,
        color: roleColor,
        border: `1px solid ${roleColor}30`
      }}
    >
      {getRoleName(role)}
    </span>
  )
}

export default RoleBadge 