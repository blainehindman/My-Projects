import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { useAuth } from '../contexts/AuthContext'
import Workspaces from './Workspaces'
import WorkspaceOverview from './WorkspaceOverview'
import WorkspaceProjects from './WorkspaceProjects'
import ProjectTasks from './ProjectTasks'
import ProjectContacts from './ProjectContacts'
import ProjectAccounts from './ProjectAccounts'
import ProjectDocuments from './ProjectDocuments'

const DashboardHome = () => {
  const { user } = useAuth()
  
  // Get current day of the week
  const today = new Date()
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' })
  
  // Get user's name from email (first part before @)
  const userName = user?.email ? user.email.split('@')[0] : 'there'
  
  return (
    <div className="container section">
      <div className="mb-8">
        <h1 className="text-title-1 text-primary mb-2">
          Happy {dayOfWeek}, {userName}!
        </h1>
      </div>
    </div>
  )
}

const Dashboard = () => {
  // Start with sidebar closed on mobile, open on desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024 // lg breakpoint
    }
    return true
  })

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  // Handle window resize to auto-close sidebar on mobile
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        // On mobile, don't force close but allow user preference
      } else {
        // On desktop, ensure sidebar is open
        setIsSidebarOpen(true)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--color-background-secondary)'}}>
      {/* Full-width Topbar */}
      <Topbar onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      
      {/* Layout container with sidebar and main content */}
      <div className="dashboard-layout">
        {/* Sidebar */}
        <div className={`sidebar-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <Sidebar isCollapsed={!isSidebarOpen} />
        </div>
        
        {/* Main content area */}
        <main className={`main-content ${isSidebarOpen ? 'with-sidebar' : 'full-width'}`}>
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/workspaces" element={<Workspaces />} />
            <Route path="/workspaces/:workspaceId/overview" element={<WorkspaceOverview />} />
            <Route path="/workspaces/:workspaceId/projects" element={<WorkspaceProjects />} />
            <Route path="/workspaces/:workspaceId/projects/:projectId/tasks" element={<ProjectTasks />} />
            <Route path="/workspaces/:workspaceId/projects/:projectId/contacts" element={<ProjectContacts />} />
            <Route path="/workspaces/:workspaceId/projects/:projectId/accounts" element={<ProjectAccounts />} />
            <Route path="/workspaces/:workspaceId/projects/:projectId/documents" element={<ProjectDocuments />} />
          </Routes>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

export default Dashboard 