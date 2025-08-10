import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Sidebar = ({ isCollapsed = false }) => {
  const { userRole, organization, activeWorkspace, activeProject } = useAuth()
  const location = useLocation()
  
  return (
    <div className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Organization Header */}
      {organization && (
        <div className="organization-header px-3 py-3 border-b" style={{borderColor: 'var(--color-border-primary)'}}>
          <div className="text-caption-1 text-tertiary mb-1">Organization</div>
          <div className="text-footnote text-primary font-medium">{organization.name}</div>
        </div>
      )}

      {/* HOME Section */}
      <div className="sidebar-section">
        <div className="sidebar-header">HOME</div>
        <nav className="space-y-1">
          <Link 
            to="/dashboard" 
            className={location.pathname === '/dashboard' ? "nav-item-active" : "nav-item"}
          >
            <svg className="nav-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
            </svg>
            <span className="nav-item-text">Dashboard</span>
          </Link>
          
          <Link 
            to="/dashboard/workspaces" 
            className={location.pathname === '/dashboard/workspaces' ? "nav-item-active" : "nav-item"}
          >
            <svg className="nav-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="nav-item-text">Workspaces</span>
          </Link>
        </nav>
      </div>

      {/* ACTIVE WORKSPACE Section */}
      {activeWorkspace && (
        <div className="sidebar-section">
          <div className="sidebar-header">{activeWorkspace.name.toUpperCase()}</div>
          <nav className="space-y-1">
            <Link 
              to={`/dashboard/workspaces/${activeWorkspace.id}/overview`} 
              className={location.pathname === `/dashboard/workspaces/${activeWorkspace.id}/overview` ? "nav-item-active" : "nav-item"}
            >
              <svg className="nav-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="nav-item-text">Overview</span>
            </Link>
            
            <Link 
              to={`/dashboard/workspaces/${activeWorkspace.id}/projects`} 
              className={location.pathname === `/dashboard/workspaces/${activeWorkspace.id}/projects` ? "nav-item-active" : "nav-item"}
            >
              <svg className="nav-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="nav-item-text">Projects</span>
            </Link>
          </nav>
        </div>
      )}

      {/* ACTIVE PROJECT Section */}
      {activeWorkspace && activeProject && (
        <div className="sidebar-section">
          <div className="sidebar-header">{activeProject.name.toUpperCase()}</div>
          <nav className="space-y-1">
            <Link 
              to={`/dashboard/workspaces/${activeWorkspace.id}/projects/${activeProject.id}/tasks`} 
              className={location.pathname === `/dashboard/workspaces/${activeWorkspace.id}/projects/${activeProject.id}/tasks` ? "nav-item-active" : "nav-item"}
            >
              <svg className="nav-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="nav-item-text">Tasks</span>
            </Link>
            
            <Link 
              to={`/dashboard/workspaces/${activeWorkspace.id}/projects/${activeProject.id}/contacts`} 
              className={location.pathname === `/dashboard/workspaces/${activeWorkspace.id}/projects/${activeProject.id}/contacts` ? "nav-item-active" : "nav-item"}
            >
              <svg className="nav-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="nav-item-text">Contacts</span>
            </Link>
            
            <Link 
              to={`/dashboard/workspaces/${activeWorkspace.id}/projects/${activeProject.id}/accounts`} 
              className={location.pathname === `/dashboard/workspaces/${activeWorkspace.id}/projects/${activeProject.id}/accounts` ? "nav-item-active" : "nav-item"}
            >
              <svg className="nav-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="nav-item-text">Accounts</span>
            </Link>
            
            <Link 
              to={`/dashboard/workspaces/${activeWorkspace.id}/projects/${activeProject.id}/documents`} 
              className={location.pathname === `/dashboard/workspaces/${activeWorkspace.id}/projects/${activeProject.id}/documents` ? "nav-item-active" : "nav-item"}
            >
              <svg className="nav-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="nav-item-text">Documents</span>
            </Link>
          </nav>
        </div>
      )}
    </div>
  )
}

export default Sidebar 