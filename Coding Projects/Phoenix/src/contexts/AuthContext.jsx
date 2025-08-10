import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ROLES, hasPermission } from '../lib/roles'

const AuthContext = createContext({})

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeWorkspace, setActiveWorkspace] = useState(null)
  const [activeProject, setActiveProject] = useState(null)

  // Function to fetch user's organization and role
  const fetchUserMembership = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('organization_memberships')
        .select(`
          role,
          organization:organizations(
            id,
            name,
            slug,
            created_at
          )
        `)
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching user membership:', error)
        return { role: null, organization: null }
      }

      return {
        role: data?.role || null,
        organization: data?.organization || null
      }
    } catch (error) {
      console.error('Error in fetchUserMembership:', error)
      return { role: null, organization: null }
    }
  }

  // Function to handle user session changes
  const handleUserSession = async (session) => {
    if (session?.user) {
      setUser(session.user)
      
      // Fetch user's organization and role
      const { role, organization } = await fetchUserMembership(session.user.id)
      setUserRole(role)
      setOrganization(organization)
      
      // Restore active workspace from localStorage if available
      const savedWorkspaceId = localStorage.getItem('activeWorkspaceId')
      if (savedWorkspaceId) {
        // Fetch workspace data to restore full workspace object
        try {
          const { data, error } = await supabase
            .from('workspace_memberships')
            .select(`
              role,
              workspace:workspaces (
                id,
                name,
                description,
                created_at,
                organization_id
              )
            `)
            .eq('user_id', session.user.id)
            .eq('workspace_id', savedWorkspaceId)
            .single()

          if (data && !error) {
            const restoredWorkspace = {
              ...data.workspace,
              userRole: data.role
            }
            setActiveWorkspace(restoredWorkspace)
            
            // Also restore active project if available and belongs to this workspace
            const savedProjectId = localStorage.getItem('activeProjectId')
            if (savedProjectId) {
              try {
                // First check if user has access to this project
                const { data: projectMembership, error: membershipError } = await supabase
                  .from('project_memberships')
                  .select(`
                    role,
                    project:projects (
                      id,
                      name,
                      description,
                      workspace_id,
                      organization_id,
                      created_at,
                      created_by
                    )
                  `)
                  .eq('user_id', session.user.id)
                  .eq('project_id', savedProjectId)
                  .single()

                if (projectMembership && !membershipError && 
                    projectMembership.project.workspace_id === restoredWorkspace.id) {
                  // Project exists, user has access, and it belongs to the active workspace
                  setActiveProject({
                    ...projectMembership.project,
                    userRole: projectMembership.role
                  })
                } else {
                  // Project doesn't exist, no access, or wrong workspace - clear it
                  localStorage.removeItem('activeProjectId')
                }
              } catch (projectError) {
                console.error('Error restoring active project:', projectError)
                localStorage.removeItem('activeProjectId')
              }
            }
          } else {
            // Workspace no longer exists or user doesn't have access
            localStorage.removeItem('activeWorkspaceId')
            localStorage.removeItem('activeProjectId') // Also clear project
          }
        } catch (error) {
          console.error('Error restoring active workspace:', error)
          localStorage.removeItem('activeWorkspaceId')
          localStorage.removeItem('activeProjectId') // Also clear project
        }
      }
    } else {
      setUser(null)
      setUserRole(null)
      setOrganization(null)
      setActiveWorkspace(null)
      setActiveProject(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserSession(session)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUserSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Helper function to check permissions
  const checkPermission = (permission) => {
    return hasPermission(userRole, permission)
  }

  // Helper function to check if user is Super Admin
  const isSuperAdmin = () => {
    return userRole === ROLES.SUPER_ADMIN
  }

  // Helper function to check if user is Admin or higher
  const isAdmin = () => {
    return userRole === ROLES.ADMIN || userRole === ROLES.SUPER_ADMIN
  }

  // Helper function to check if user is Member or higher
  const isMember = () => {
    return userRole === ROLES.MEMBER || userRole === ROLES.ADMIN || userRole === ROLES.SUPER_ADMIN
  }

  // Active workspace management
  const setActiveWorkspaceById = (workspaceId, workspaceData) => {
    setActiveWorkspace(workspaceData)
    // Clear active project when changing workspace
    clearActiveProject()
    // Store in localStorage for persistence across sessions
    localStorage.setItem('activeWorkspaceId', workspaceId)
  }

  const clearActiveWorkspace = () => {
    setActiveWorkspace(null)
    clearActiveProject()
    localStorage.removeItem('activeWorkspaceId')
  }

  // Active project management
  const setActiveProjectById = (projectId, projectData) => {
    setActiveProject(projectData)
    // Store in localStorage for persistence across sessions
    localStorage.setItem('activeProjectId', projectId)
  }

  const clearActiveProject = () => {
    setActiveProject(null)
    localStorage.removeItem('activeProjectId')
  }

  const value = {
    // Authentication methods
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    
    // User and organization data
    user,
    userRole,
    organization,
    loading,
    
    // Role checking helpers
    checkPermission,
    isSuperAdmin,
    isAdmin,
    isMember,
    
    // Active workspace management
    activeWorkspace,
    setActiveWorkspaceById,
    clearActiveWorkspace,
    
    // Active project management
    activeProject,
    setActiveProjectById,
    clearActiveProject,
    
    // Refresh user data
    refreshUserData: () => {
      if (user) {
        fetchUserMembership(user.id).then(({ role, organization }) => {
          setUserRole(role)
          setOrganization(organization)
        })
      }
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
} 