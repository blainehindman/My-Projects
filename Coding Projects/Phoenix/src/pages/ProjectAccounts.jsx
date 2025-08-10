import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useParams } from 'react-router-dom'

const ProjectAccounts = () => {
  const { activeWorkspace, activeProject } = useAuth()
  const { workspaceId, projectId } = useParams()

  // Check access
  if (!activeWorkspace || activeWorkspace.id !== workspaceId || !activeProject || activeProject.id !== projectId) {
    return (
      <div className="container section">
        <div className="text-center py-12">
          <h1 className="text-title-1 text-primary mb-4">Project Not Found</h1>
          <p className="text-body text-secondary">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container section">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-title-1 text-primary mb-2">{activeProject.name} Accounts</h1>
            <p className="text-body text-secondary">
              Manage companies and accounts associated with this project
            </p>
          </div>
          <button className="btn-filled focus-visible">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Account
          </button>
        </div>

        {/* Accounts Content */}
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
            <h3 className="text-title-3 text-primary mb-3">No Accounts Yet</h3>
            <p className="text-body text-secondary mb-6">
              Connect companies and business accounts to this project.
            </p>
            <button className="btn-filled focus-visible">
              Add Your First Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectAccounts 