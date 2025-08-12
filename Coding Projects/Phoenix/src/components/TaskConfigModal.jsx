import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const TaskConfigModal = ({ isOpen, onClose, projectId, onConfigUpdated }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [config, setConfig] = useState({
    statuses: [],
    priorities: []
  })

  // Load current configuration
  useEffect(() => {
    if (isOpen && projectId) {
      loadConfig()
    }
  }, [isOpen, projectId])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .rpc('get_project_task_config', { p_project_id: projectId })

      if (error) throw error
      setConfig(data || getDefaultConfig())
    } catch (err) {
      console.error('Error loading task config:', err)
      setConfig(getDefaultConfig())
    } finally {
      setLoading(false)
    }
  }

  const getDefaultConfig = () => ({
    statuses: [
      { id: 'todo', name: 'To Do', color: '#8E8E93', order: 0 },
      { id: 'in_progress', name: 'In Progress', color: '#FF9500', order: 1 },
      { id: 'completed', name: 'Completed', color: '#34C759', order: 2 }
    ],
    priorities: [
      { id: 'low', name: 'Low', color: '#8E8E93', order: 0 },
      { id: 'medium', name: 'Medium', color: '#FF9500', order: 1 },
      { id: 'high', name: 'High', color: '#FF3B30', order: 2 }
    ]
  })

  // Handle configuration updates
  const handleAddStatus = () => {
    const newStatus = {
      id: `status_${Date.now()}`,
      name: 'New Status',
      color: '#007AFF',
      order: config.statuses.length
    }
    setConfig(prev => ({
      ...prev,
      statuses: [...prev.statuses, newStatus]
    }))
  }

  const handleAddPriority = () => {
    const newPriority = {
      id: `priority_${Date.now()}`,
      name: 'New Priority',
      color: '#007AFF',
      order: config.priorities.length
    }
    setConfig(prev => ({
      ...prev,
      priorities: [...prev.priorities, newPriority]
    }))
  }

  const handleUpdateStatus = (index, field, value) => {
    setConfig(prev => ({
      ...prev,
      statuses: prev.statuses.map((status, i) => 
        i === index ? { ...status, [field]: value } : status
      )
    }))
  }

  const handleUpdatePriority = (index, field, value) => {
    setConfig(prev => ({
      ...prev,
      priorities: prev.priorities.map((priority, i) => 
        i === index ? { ...priority, [field]: value } : priority
      )
    }))
  }

  const handleDeleteStatus = (index) => {
    if (config.statuses.length <= 1) {
      alert('You must have at least one status')
      return
    }
    setConfig(prev => ({
      ...prev,
      statuses: prev.statuses.filter((_, i) => i !== index)
    }))
  }

  const handleDeletePriority = (index) => {
    if (config.priorities.length <= 1) {
      alert('You must have at least one priority')
      return
    }
    setConfig(prev => ({
      ...prev,
      priorities: prev.priorities.filter((_, i) => i !== index)
    }))
  }

  // Save configuration
  const handleSave = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .rpc('update_project_task_config', { 
          p_project_id: projectId, 
          p_config: config 
        })

      if (error) throw error

      if (onConfigUpdated) {
        onConfigUpdated(config)
      }
      
      onClose()
    } catch (err) {
      console.error('Error saving config:', err)
      setError('Failed to save configuration')
    } finally {
      setLoading(false)
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            className="w-full max-w-4xl bg-white rounded-xl shadow-xl slide-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-title-2 text-primary font-medium">
                Task Configuration
              </h2>
              <button
                onClick={onClose}
                className="btn-plain btn-compact focus-visible"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8 max-h-96 overflow-y-auto">
              {error && (
                <div style={{
                  backgroundColor: 'rgba(255, 59, 48, 0.1)',
                  padding: 'var(--spacing-3)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid rgba(255, 59, 48, 0.2)'
                }}>
                  <p className="text-footnote" style={{ color: 'var(--color-system-red)' }}>
                    {error}
                  </p>
                </div>
              )}

              {/* Statuses Section */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-title-3 text-primary">Task Statuses</h3>
                  <button
                    onClick={handleAddStatus}
                    className="btn-tinted btn-compact focus-visible"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Status
                  </button>
                </div>
                
                <div className="space-y-4">
                  {config.statuses.map((status, index) => (
                    <div key={`${status.id}-${index}`} className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Color Picker */}
                        <div className="col-span-1">
                          <input
                            type="color"
                            value={status.color}
                            onChange={(e) => handleUpdateStatus(index, 'color', e.target.value)}
                            className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
                            title="Choose color"
                          />
                        </div>
                        
                        {/* Name Input */}
                        <div className="col-span-5">
                          <label className="block text-caption-1 text-tertiary mb-1">Name</label>
                          <input
                            type="text"
                            value={status.name}
                            onChange={(e) => handleUpdateStatus(index, 'name', e.target.value)}
                            className="input-field w-full"
                            placeholder="Status name"
                          />
                        </div>
                        
                        {/* ID Input */}
                        <div className="col-span-5">
                          <label className="block text-caption-1 text-tertiary mb-1">ID (no spaces)</label>
                          <input
                            type="text"
                            value={status.id}
                            onChange={(e) => {
                              // Remove spaces and special characters for clean IDs
                              const cleanId = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                              handleUpdateStatus(index, 'id', cleanId)
                            }}
                            className="input-field w-full"
                            placeholder="status_id"
                          />
                        </div>
                        
                        {/* Delete Button */}
                        <div className="col-span-1">
                          <button
                            onClick={() => handleDeleteStatus(index)}
                            className="btn-plain btn-compact text-red-600 hover:bg-red-50 focus-visible"
                            disabled={config.statuses.length <= 1}
                            title="Delete status"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priorities Section */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-title-3 text-primary">Task Priorities</h3>
                  <button
                    onClick={handleAddPriority}
                    className="btn-tinted btn-compact focus-visible"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Priority
                  </button>
                </div>
                
                <div className="space-y-4">
                  {config.priorities.map((priority, index) => (
                    <div key={`${priority.id}-${index}`} className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Color Picker */}
                        <div className="col-span-1">
                          <input
                            type="color"
                            value={priority.color}
                            onChange={(e) => handleUpdatePriority(index, 'color', e.target.value)}
                            className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
                            title="Choose color"
                          />
                        </div>
                        
                        {/* Name Input */}
                        <div className="col-span-5">
                          <label className="block text-caption-1 text-tertiary mb-1">Name</label>
                          <input
                            type="text"
                            value={priority.name}
                            onChange={(e) => handleUpdatePriority(index, 'name', e.target.value)}
                            className="input-field w-full"
                            placeholder="Priority name"
                          />
                        </div>
                        
                        {/* ID Input */}
                        <div className="col-span-5">
                          <label className="block text-caption-1 text-tertiary mb-1">ID (no spaces)</label>
                          <input
                            type="text"
                            value={priority.id}
                            onChange={(e) => {
                              // Remove spaces and special characters for clean IDs
                              const cleanId = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                              handleUpdatePriority(index, 'id', cleanId)
                            }}
                            className="input-field w-full"
                            placeholder="priority_id"
                          />
                        </div>
                        
                        {/* Delete Button */}
                        <div className="col-span-1">
                          <button
                            onClick={() => handleDeletePriority(index)}
                            className="btn-plain btn-compact text-red-600 hover:bg-red-50 focus-visible"
                            disabled={config.priorities.length <= 1}
                            title="Delete priority"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="btn-plain focus-visible"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="btn-filled focus-visible"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TaskConfigModal