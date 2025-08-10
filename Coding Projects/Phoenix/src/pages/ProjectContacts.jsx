import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useParams } from 'react-router-dom'

const ProjectContacts = () => {
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
            <h1 className="text-title-1 text-primary mb-2">{activeProject.name} Contacts</h1>
            <p className="text-body text-secondary">
              Manage contacts and stakeholders for this project
            </p>
          </div>
          <button className="btn-filled focus-visible">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Contact
          </button>
        </div>

        {/* Contacts Content */}
        <div className="text-center py-12">
          <div className="card content-narrow mx-auto">
            <div className="mx-auto h-12 w-12 text-quaternary mb-6">
              <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" strokeWidth="1">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="text-title-3 text-primary mb-3">No Contacts Yet</h3>
            <p className="text-body text-secondary mb-6">
              Start building your network by adding contacts to this project.
            </p>
            <button className="btn-filled focus-visible">
              Add Your First Contact
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectContacts 