import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useParams } from 'react-router-dom'

const WorkspaceOverview = () => {
  const { activeWorkspace } = useAuth()
  const { workspaceId } = useParams()

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

  return (
    <div className="container section">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-title-1 text-primary mb-2">{activeWorkspace.name} Overview</h1>
          <p className="text-body text-secondary">
            {activeWorkspace.description || 'Workspace overview and statistics'}
          </p>
        </div>

        {/* Overview Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder cards */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-headline text-primary font-medium">Projects</h3>
              <svg className="w-6 h-6 text-quaternary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-primary mb-2">0</div>
            <div className="text-caption-1 text-tertiary">Active projects</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-headline text-primary font-medium">Members</h3>
              <svg className="w-6 h-6 text-quaternary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 915 0z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-primary mb-2">1</div>
            <div className="text-caption-1 text-tertiary">Workspace members</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-headline text-primary font-medium">Activity</h3>
              <svg className="w-6 h-6 text-quaternary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-primary mb-2">0</div>
            <div className="text-caption-1 text-tertiary">Recent activities</div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="card">
          <h3 className="text-headline text-primary font-medium mb-4">Recent Activity</h3>
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 text-quaternary mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="text-subheadline text-secondary mb-2">No recent activity</h4>
            <p className="text-body text-tertiary">
              Activity in this workspace will appear here as projects are created and updated.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkspaceOverview 