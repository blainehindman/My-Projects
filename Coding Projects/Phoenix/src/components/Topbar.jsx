import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ROLE_NAMES, PERMISSIONS } from '../lib/roles'

const Topbar = ({ onToggleSidebar, isSidebarOpen }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { user, userRole, organization, signOut, checkPermission } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="topbar">
      <div className="topbar-content">
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            {/* Toggle button directly in front of Phoenix title */}
            <div className="flex items-center">
              <button
                type="button"
                className="btn-plain btn-compact focus-visible mr-2"
                onClick={onToggleSidebar}
                aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                <span className="sr-only">{isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}</span>
                {isSidebarOpen ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
              <h1 className="text-headline text-primary font-medium">
                Phoenix
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-x-3 lg:gap-x-4 ml-auto">
            {/* Profile dropdown */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-x-2 text-callout font-medium text-primary focus-visible p-2 rounded-lg"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="h-6 w-6 rounded-md flex items-center justify-center font-medium text-caption-2" style={{backgroundColor: 'var(--color-system-blue)', color: 'var(--color-white)'}}>
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden lg:flex lg:items-center">
                  <span className="ml-2 text-footnote font-medium text-secondary">{user?.email}</span>
                  <svg className="ml-2 h-3 w-3 text-quaternary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </span>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right card fade-in">
                  <div className="px-4 py-3" style={{borderBottom: '1px solid var(--color-border-primary)'}}>
                    <div className="text-footnote text-primary font-medium">
                      {user?.email}
                    </div>
                    {userRole && (
                      <div className="text-caption-2 text-tertiary mt-1">
                        {ROLE_NAMES[userRole]} • {organization?.name}
                      </div>
                    )}
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => setIsProfileOpen(false)}
                      className="block w-full text-left px-4 py-2 text-footnote text-primary hover:bg-background-secondary transition-colors"
                    >
                      Profile Settings
                    </button>
                    
                    {checkPermission(PERMISSIONS.MANAGE_WORKSPACE_SETTINGS) && (
                      <button
                        onClick={() => setIsProfileOpen(false)}
                        className="block w-full text-left px-4 py-2 text-footnote text-primary hover:bg-background-secondary transition-colors"
                      >
                        Workspace Settings
                      </button>
                    )}
                    
                    {checkPermission(PERMISSIONS.MANAGE_ORGANIZATION) && (
                      <button
                        onClick={() => setIsProfileOpen(false)}
                        className="block w-full text-left px-4 py-2 text-footnote text-primary hover:bg-background-secondary transition-colors"
                      >
                        Organization Settings
                      </button>
                    )}
                    
                    {checkPermission(PERMISSIONS.MANAGE_USER_ROLES) && (
                      <button
                        onClick={() => setIsProfileOpen(false)}
                        className="block w-full text-left px-4 py-2 text-footnote text-primary hover:bg-background-secondary transition-colors"
                      >
                        Manage Members
                      </button>
                    )}
                    
                    <hr style={{margin: '4px 0', borderColor: 'var(--color-border-primary)'}} />
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-footnote hover:bg-background-secondary transition-colors"
                      style={{color: 'var(--color-system-red)'}}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Topbar 