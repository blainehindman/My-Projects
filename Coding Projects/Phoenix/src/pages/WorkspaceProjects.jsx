import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PROJECT_ROLE_NAMES, PROJECT_ROLES, hasProjectPermission, PERMISSIONS } from '../lib/roles'
import RoleBadge from '../components/RoleBadge'
import DropdownMenu, { DropdownItem } from '../components/DropdownMenu'

const WorkspaceProjects = () => {
  const { user, organization, activeWorkspace, activeProject, setActiveProjectById, clearActiveProject } = useAuth()
  const { workspaceId } = useParams()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  
  // Form state for creating project
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')

  // Check workspace access
  if (!activeWorkspace || activeWorkspace.id !== workspaceId) {
    return (
      <div className="container section">
        <div className="text-center py-12">
          <h1 className="text-title-1 text-primary mb-4">Workspace Not Found</h1>
          <p className="text-body text-secondary">
            The workspace you're looking for doesn't exist or you don't have access to it.
          </p>
        </div>
      </div>
    )
  }

  // Fetch user's projects in this workspace
  const fetchProjects = async () => {
    if (!user || !activeWorkspace) return

    try {
      console.log('Fetching projects for workspace:', activeWorkspace.id)
      
      // Simplified approach: Just get all projects in workspace first
      const { data: allProjectsData, error: allProjectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false })

      if (allProjectsError) {
        console.error('Error fetching projects:', allProjectsError)
        setLoading(false)
        return
      }

      console.log('All projects in workspace:', allProjectsData)

      // Then get user's project memberships separately
      const { data: membershipData, error: membershipError } = await supabase
        .from('project_memberships')
        .select('project_id, role')
        .eq('user_id', user.id)

      if (membershipError) {
        console.error('Error fetching project memberships:', membershipError)
        // Continue anyway - user might have workspace access
      }

      console.log('User project memberships:', membershipData)

      // Create membership map for easy lookup
      const membershipMap = new Map()
      membershipData?.forEach(membership => {
        membershipMap.set(membership.project_id, membership.role)
      })

      // Combine the data
      const projectsWithRoles = allProjectsData?.map(project => {
        const userRole = membershipMap.get(project.id)
        return {
          project: project,
          role: userRole || null,
          hasDirectMembership: !!userRole
        }
      }) || []

      console.log('Final projects data:', projectsWithRoles)
      setProjects(projectsWithRoles)
    } catch (error) {
      console.error('Error in fetchProjects:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [user, activeWorkspace])

  // Generate project slug
  const generateProjectSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .trim() || 'project'
  }

  // Handle create project
  const handleCreateProject = async (e) => {
    e.preventDefault()
    
    if (!projectName.trim()) {
      setCreateError('Project name is required')
      return
    }

    setCreateLoading(true)
    setCreateError('')

    try {
      const projectSlug = generateProjectSlug(projectName)
      
      // Use the database function to create project and add user as admin
      const { data: result, error } = await supabase
        .rpc('create_project_with_admin', {
          p_name: projectName.trim(),
          p_slug: projectSlug,
          p_description: projectDescription.trim() || null,
          p_workspace_id: activeWorkspace.id,
          p_organization_id: organization.id,
          p_creator_id: user.id
        })

      if (error) {
        throw error
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to create project')
      }

      // Refresh projects list
      await fetchProjects()
      
      // Reset form and close modal
      setProjectName('')
      setProjectDescription('')
      setShowCreateModal(false)
      
    } catch (error) {
      console.error('Error creating project:', error)
      setCreateError(error.message || 'Failed to create project')
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

  // Handle project selection with toggle functionality
  const handleProjectClick = (project, role) => {
    // If clicking the already active project, deactivate it
    if (activeProject?.id === project.id) {
      clearActiveProject()
      console.log('Deactivated project:', project.name)
      return
    }
    
    // Otherwise, set as active project
    const projectData = {
      ...project,
      userRole: role
    }
    setActiveProjectById(project.id, projectData)
    console.log('Selected project:', project.name, 'with role:', role)
  }

  // Handle edit project
  const handleEditProject = (project, role) => {
    console.log('Edit project:', project.name, 'with role:', role)
    // TODO: Implement edit functionality
  }

  // Check if user can edit project
  const canEditProject = (role) => {
    return role === PROJECT_ROLES.ADMIN
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-body text-secondary">Loading projects...</div>
      </div>
    )
  }

  return (
    <div className="container section">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-title-1 text-primary mb-2">{activeWorkspace.name} Projects</h1>
            <p className="text-body text-secondary">
              Manage and organize projects within this workspace
            </p>
          </div>
        
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-filled focus-visible"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Project
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="card content-narrow mx-auto">
              <div className="mx-auto h-12 w-12 text-quaternary mb-6">
                <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" strokeWidth="1">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 11H5a2 2 0 00-2 2v6a2 2 0 002 2h14m-14 0h14m-14 0V9a2 2 0 012-2h2a2 2 0 012 2m0 0V9a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-title-3 text-primary mb-3">No Projects Yet</h3>
              <p className="text-body text-secondary mb-6">
                Get started by creating your first project in this workspace.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-filled focus-visible"
              >
                Create Your First Project
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(({ project, role, hasDirectMembership }) => {
              const canEdit = canEditProject(role)
              
              const isActiveProject = activeProject?.id === project.id
              
              return (
                <div 
                  key={project.id} 
                  className={`card-interactive hover-lift cursor-pointer relative group ${isActiveProject ? 'ring-2' : ''}`}
                  style={isActiveProject ? {borderColor: 'var(--color-system-blue)'} : {}}
                  onClick={() => handleProjectClick(project, role)}
                >
                  {/* 3-dot dropdown menu - top right only */}
                  <div className="absolute top-3 right-3">
                    <DropdownMenu
                      trigger={
                        <button 
                          className="btn-plain btn-compact focus-visible opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                          aria-label="Project options"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      }
                      align="right"
                    >
                      <DropdownItem onClick={() => handleProjectClick(project, role)}>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </div>
                      </DropdownItem>

                      {canEdit && (
                        <DropdownItem onClick={() => handleEditProject(project, role)}>
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
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-subheadline text-secondary line-clamp-2 mb-2">
                          {project.description}
                        </p>
                      )}
                    </div>

                    {/* Role and access status */}
                    <div className="flex flex-col gap-2">
                      {isActiveProject && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 border border-green-200 w-fit">
                          Active
                        </span>
                      )}
                      {hasDirectMembership && role ? (
                        <RoleBadge role={role} size="small" />
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 w-fit">
                          Workspace Access
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-caption-1 text-tertiary">
                    <span>Created {formatDate(project.created_at)}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Create Project Modal */}
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
                <h2 className="text-title-2 text-primary">Create New Project</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-plain btn-compact focus-visible"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-6">
                {createError && (
                  <div style={{backgroundColor: 'rgba(255, 59, 48, 0.1)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius)', border: '1px solid rgba(255, 59, 48, 0.2)'}}>
                    <p className="text-footnote" style={{color: 'var(--color-system-red)'}}>
                      {createError}
                    </p>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="projectName" className="input-label">
                    Project Name
                  </label>
                  <input
                    id="projectName"
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="input-field"
                    placeholder="Enter project name"
                    required
                    disabled={createLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="projectDescription" className="input-label">
                    Description (Optional)
                  </label>
                  <textarea
                    id="projectDescription"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="input-field resize-none"
                    placeholder="Describe what this project is for..."
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
                    {createLoading ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkspaceProjects 