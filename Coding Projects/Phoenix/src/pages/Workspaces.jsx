import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { WORKSPACE_ROLE_NAMES, WORKSPACE_ROLES, hasWorkspacePermission, PERMISSIONS } from '../lib/roles'
import RoleBadge from '../components/RoleBadge'
import DropdownMenu, { DropdownItem } from '../components/DropdownMenu'
import EditWorkspaceModal from '../components/EditWorkspaceModal'

const Workspaces = () => {
  const { user, organization, activeWorkspace, setActiveWorkspaceById, clearActiveWorkspace } = useAuth()
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  
  // Form state for creating workspace
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceDescription, setWorkspaceDescription] = useState('')

  // Edit workspace modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState(null)

  // Fetch user's workspaces
  const fetchWorkspaces = async () => {
    if (!user) return

    try {
      console.log('Fetching workspaces for user:', user.id)
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
        .eq('user_id', user.id)
        .order('created_at', { foreignTable: 'workspaces', ascending: false })

      if (error) {
        console.error('Error fetching workspaces:', error)
        return
      }

      console.log('Fetched workspaces data:', data)
      setWorkspaces(data || [])
    } catch (error) {
      console.error('Error in fetchWorkspaces:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkspaces()
  }, [user])

  // Generate workspace slug
  const generateWorkspaceSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .trim() || 'workspace'
  }

  // Handle create workspace
  const handleCreateWorkspace = async (e) => {
    e.preventDefault()
    
    if (!workspaceName.trim()) {
      setCreateError('Workspace name is required')
      return
    }

    setCreateLoading(true)
    setCreateError('')

    try {
      const workspaceSlug = generateWorkspaceSlug(workspaceName)
      
      // Use the database function to create workspace and add user as admin
      const { data: result, error } = await supabase
        .rpc('create_workspace_with_admin', {
          p_name: workspaceName.trim(),
          p_slug: workspaceSlug,
          p_description: workspaceDescription.trim() || null,
          p_organization_id: organization.id,
          p_creator_id: user.id
        })

      if (error) {
        throw error
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to create workspace')
      }

      // Refresh workspaces list
      await fetchWorkspaces()
      
      // Reset form and close modal
      setWorkspaceName('')
      setWorkspaceDescription('')
      setShowCreateModal(false)
      
    } catch (error) {
      console.error('Error creating workspace:', error)
      setCreateError(error.message || 'Failed to create workspace')
    } finally {
      setCreateLoading(false)
    }
  }

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Handle workspace selection with toggle functionality
  const handleWorkspaceClick = (workspace, role) => {
    // If clicking the already active workspace, deactivate it
    if (activeWorkspace?.id === workspace.id) {
      clearActiveWorkspace() // This also clears active project via the context
      return
    }
    
    // Otherwise, set as active workspace
    const workspaceData = {
      ...workspace,
      userRole: role
    }
    setActiveWorkspaceById(workspace.id, workspaceData)
  }

  // Handle edit workspace
  const handleEditWorkspace = (workspace, role) => {
    setEditingWorkspace({ ...workspace, userRole: role })
    setShowEditModal(true)
  }

  // Handle workspace updated
  const handleWorkspaceUpdated = (updatedWorkspace) => {
    setWorkspaces(prevWorkspaces => 
      prevWorkspaces.map(item => 
        item.workspace.id === updatedWorkspace.id 
          ? { ...item, workspace: updatedWorkspace }
          : item
      )
    )
    
    // Update active workspace if it was the one edited
    if (activeWorkspace?.id === updatedWorkspace.id) {
      setActiveWorkspaceById(updatedWorkspace.id, {
        ...updatedWorkspace,
        userRole: activeWorkspace.userRole
      })
    }
  }

  // Check if user can edit workspace
  const canEditWorkspace = (role) => {
    return role === WORKSPACE_ROLES.ADMIN
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-body text-secondary">Loading workspaces...</div>
      </div>
    )
  }

  return (
    <div className="container section">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-title-1 text-primary mb-2">Workspaces</h1>
            <p className="text-body text-secondary">
              Manage and access your workspaces within {organization?.name}
            </p>
          </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-filled focus-visible"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Workspace
        </button>
      </div>

      {/* Workspaces Grid */}
      {workspaces.length === 0 ? (
        <div className="text-center py-12">
          <div className="card content-narrow mx-auto">
            <div className="mx-auto h-12 w-12 text-quaternary mb-6">
              <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" strokeWidth="1">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-title-3 text-primary mb-3">No Workspaces Yet</h3>
            <p className="text-body text-secondary mb-6">
              You haven't been added to any workspaces yet. Create your first workspace to get started.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-filled focus-visible"
            >
              Create Your First Workspace
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map(({ workspace, role }) => {
            const isActive = activeWorkspace?.id === workspace.id
            const canEdit = canEditWorkspace(role)
            
            return (
              <div 
                key={workspace.id} 
                className={`card-interactive hover-lift cursor-pointer relative group ${isActive ? 'ring-2' : ''}`}
                style={isActive ? {borderColor: 'var(--color-system-blue)'} : {}}
                onClick={() => handleWorkspaceClick(workspace, role)}
              >
                {/* 3-dot dropdown menu - top right only */}
                <div className="absolute top-3 right-3">
                  <DropdownMenu
                    trigger={
                      <button 
                        className="btn-plain btn-compact focus-visible opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                        aria-label="Workspace options"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    }
                    align="right"
                  >
                    <DropdownItem onClick={() => handleWorkspaceClick(workspace, role)}>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </div>
                    </DropdownItem>

                    {canEdit && (
                      <DropdownItem onClick={() => handleEditWorkspace(workspace, role)}>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </div>
                      </DropdownItem>
                    )}

                    {canEdit && (
                      <DropdownItem onClick={() => {}} disabled>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Settings
                        </div>
                      </DropdownItem>
                    )}
                  </DropdownMenu>
                </div>

                {/* Main content area */}
                <div className="mb-4">
                  {/* Title and description */}
                  <div className="mb-3">
                    <h3 className="text-headline text-primary font-medium mb-1">
                      {workspace.name}
                    </h3>
                    {workspace.description && (
                      <p className="text-subheadline text-secondary line-clamp-2 mb-2">
                        {workspace.description}
                      </p>
                    )}
                  </div>

                  {/* Status and Role column */}
                  <div className="flex flex-col gap-2">
                    {isActive && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 border border-green-200 w-fit">
                        Active
                      </span>
                    )}
                    <RoleBadge role={role} size="small" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-caption-1 text-tertiary">
                  <span>Created {formatDate(workspace.created_at)}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 fade-in"
            onClick={() => setShowCreateModal(false)}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-md mx-4 card scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-title-2 text-primary">Create New Workspace</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-plain btn-compact focus-visible"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-6">
              {createError && (
                <div style={{backgroundColor: 'rgba(255, 59, 48, 0.1)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius)', border: '1px solid rgba(255, 59, 48, 0.2)'}}>
                  <p className="text-footnote" style={{color: 'var(--color-system-red)'}}>
                    {createError}
                  </p>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="workspaceName" className="input-label">
                  Workspace Name
                </label>
                <input
                  id="workspaceName"
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="input-field"
                  placeholder="Enter workspace name"
                  required
                  disabled={createLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="workspaceDescription" className="input-label">
                  Description (Optional)
                </label>
                <textarea
                  id="workspaceDescription"
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                  className="input-field resize-none"
                  placeholder="Describe what this workspace is for..."
                  disabled={createLoading}
                  style={{
                    height: '80px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    overflowY: 'auto'
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-plain flex-1 focus-visible"
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-filled flex-1 focus-visible"
                  disabled={createLoading}
                >
                  {createLoading ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Workspace Modal */}
      <EditWorkspaceModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        workspace={editingWorkspace}
        onWorkspaceUpdated={handleWorkspaceUpdated}
      />
      </div>
    </div>
  )
}

export default Workspaces 