import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useParams } from 'react-router-dom'

const ProjectDocuments = () => {
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
            <h1 className="text-title-1 text-primary mb-2">{activeProject.name} Documents</h1>
            <p className="text-body text-secondary">
              Store and organize documents related to this project
            </p>
          </div>
          <button className="btn-filled focus-visible">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Upload Document
          </button>
        </div>

        {/* Documents Content */}
        <div className="text-center py-12">
          <div className="card content-narrow mx-auto">
            <div className="mx-auto h-12 w-12 text-quaternary mb-6">
              <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" strokeWidth="1">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-title-3 text-primary mb-3">No Documents Yet</h3>
            <p className="text-body text-secondary mb-6">
              Start organizing project materials by uploading your first document.
            </p>
            <button className="btn-filled focus-visible">
              Upload Your First Document
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectDocuments 