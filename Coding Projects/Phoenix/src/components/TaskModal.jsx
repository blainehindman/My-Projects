import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const TaskModal = ({ isOpen, onClose, projectId, task = null, preSelectedSectionId = null, onTaskCreated, onTaskUpdated }) => {
  const { user, activeProject, activeWorkspace } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sections, setSections] = useState([])
  const [taskConfig, setTaskConfig] = useState(null)
  
  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    assignee: '',
    due_date: '',
    status: '',
    priority: '',
    estimation: '',
    health: '',
    section_id: ''
  })

  const isEditing = !!task

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && projectId) {
      loadData()
    }
  }, [isOpen, projectId])

  // Reset form when task changes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        // Editing existing task
        setFormData({
          summary: task.summary || '',
          description: task.description || '',
          assignee: task.assignee || '',
          due_date: task.due_date ? task.due_date.split('T')[0] : '',
          status: task.status || 'todo',
          priority: task.priority || 'medium',
          estimation: task.estimation || 'medium',
          health: task.health || 'good',
          section_id: task.section_id || ''
        })
      } else {
        // Creating new task
        const defaultSectionId = preSelectedSectionId || (sections.length > 0 ? sections[0].id : '')
        setFormData({
          summary: '',
          description: '',
          assignee: user?.id || '',
          due_date: '',
          status: 'todo',
          priority: 'medium',
          estimation: 'medium',
          health: 'good',
          section_id: defaultSectionId
        })
      }
    }
  }, [isOpen, task, sections, user, preSelectedSectionId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('task_sections')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order')

      if (sectionsError) throw sectionsError
      setSections(sectionsData || [])

      // Load task config
      const { data: configData, error: configError } = await supabase
        .rpc('get_project_task_config', { p_project_id: projectId })

      if (configError) {
        console.warn('Could not load task config:', configError)
        setTaskConfig(getDefaultConfig())
      } else {
        setTaskConfig(configData || getDefaultConfig())
      }

    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load task data')
      setTaskConfig(getDefaultConfig())
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.summary.trim()) {
      setError('Task title is required')
      return
    }

    try {
      setLoading(true)
      setError('')

      const taskData = {
        summary: formData.summary.trim(),
        description: formData.description.trim(),
        assignee: formData.assignee || null,
        due_date: formData.due_date || null,
        status: formData.status,
        priority: formData.priority,
        estimation: formData.estimation,
        health: formData.health,
        section_id: formData.section_id || null,
        project_id: projectId,
        organization_id: activeProject?.organization_id,
        workspace_id: activeWorkspace?.id,
        created_by: user?.id,
        sort_order: 0
      }

      if (isEditing) {
        // Update existing task
        const { data, error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', task.id)
          .select()

        if (error) throw error

        if (onTaskUpdated) {
          onTaskUpdated(data[0])
        }
      } else {
        // Create new task
        const { data, error } = await supabase
          .from('tasks')
          .insert(taskData)
          .select()

        if (error) throw error

        if (onTaskCreated) {
          onTaskCreated(data[0])
        }
      }

      onClose()
    } catch (err) {
      console.error('Error saving task:', err)
      setError('Failed to save task')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      summary: '',
      description: '',
      assignee: '',
      due_date: '',
      status: 'todo',
      priority: 'medium',
      estimation: 'medium',
      health: 'good',
      section_id: ''
    })
    setError('')
    onClose()
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose()
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
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            className="w-full max-w-2xl bg-white rounded-xl shadow-xl slide-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-title-2 text-primary font-medium">
                {isEditing ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button
                onClick={handleClose}
                className="btn-plain btn-compact focus-visible"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

              {/* Title */}
              <div>
                <label className="block text-body text-primary mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={formData.summary}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  className="input-field w-full"
                  placeholder="Enter task title"
                  required
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-body text-primary mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="input-field w-full h-72 resize-none"
                  placeholder="Enter task description"
                  style={{ padding: '12px', lineHeight: '1.5' }}
                />
              </div>

              {/* Row with Status, Priority, Section */}
              <div className="grid grid-cols-3 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-body text-primary mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="input-field w-full"
                    style={{ 
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236B7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")',
                      backgroundPosition: 'right 8px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '16px',
                      paddingRight: '32px',
                      fontSize: '15px !important',
                      fontWeight: '400 !important'
                    }}
                  >
                    {taskConfig?.statuses?.map((status) => (
                      <option key={status.id} value={status.id} style={{ fontSize: '15px', fontWeight: '400' }}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-body text-primary mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="input-field w-full"
                    style={{ 
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236B7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")',
                      backgroundPosition: 'right 8px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '16px',
                      paddingRight: '32px',
                      fontSize: '15px !important',
                      fontWeight: '400 !important'
                    }}
                  >
                    {taskConfig?.priorities?.map((priority) => (
                      <option key={priority.id} value={priority.id} style={{ fontSize: '15px', fontWeight: '400' }}>
                        {priority.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section */}
                <div>
                  <label className="block text-body text-primary mb-2">
                    Section
                  </label>
                  <select
                    value={formData.section_id}
                    onChange={(e) => handleInputChange('section_id', e.target.value)}
                    className="input-field w-full"
                    style={{ 
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236B7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")',
                      backgroundPosition: 'right 8px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '16px',
                      paddingRight: '32px',
                      fontSize: '15px !important',
                      fontWeight: '400 !important'
                    }}
                  >
                    {sections.map((section) => (
                      <option key={section.id} value={section.id} style={{ fontSize: '15px', fontWeight: '400' }}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row with Estimation and Health */}
              <div className="grid grid-cols-2 gap-4">
                {/* Estimation */}
                <div>
                  <label className="block text-body text-primary mb-2">
                    Estimation
                  </label>
                  <select
                    value={formData.estimation}
                    onChange={(e) => handleInputChange('estimation', e.target.value)}
                    className="input-field w-full"
                    style={{ 
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236B7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")',
                      backgroundPosition: 'right 8px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '16px',
                      paddingRight: '32px',
                      fontSize: '15px !important',
                      fontWeight: '400 !important'
                    }}
                  >
                    {taskConfig?.estimations?.map((estimation) => (
                      <option key={estimation.id} value={estimation.id} style={{ fontSize: '15px', fontWeight: '400' }}>
                        {estimation.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Health */}
                <div>
                  <label className="block text-body text-primary mb-2">
                    Health
                  </label>
                  <select
                    value={formData.health}
                    onChange={(e) => handleInputChange('health', e.target.value)}
                    className="input-field w-full"
                    style={{ 
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236B7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")',
                      backgroundPosition: 'right 8px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '16px',
                      paddingRight: '32px',
                      fontSize: '15px !important',
                      fontWeight: '400 !important'
                    }}
                  >
                    {taskConfig?.healths?.map((health) => (
                      <option key={health.id} value={health.id} style={{ fontSize: '15px', fontWeight: '400' }}>
                        {health.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due Date and Assignee */}
              <div className="grid grid-cols-2 gap-4">
                {/* Due Date */}
                <div>
                  <label className="block text-body text-primary mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                    className="input-field w-full"
                  />
                </div>

                {/* Assignee - For now just keep current user */}
                <div>
                  <label className="block text-body text-primary mb-2">
                    Assigned To
                  </label>
                  <div className="input-field w-full bg-gray-50 text-tertiary flex items-center">
                    <div className="flex items-center">
                      <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center mr-2 leading-none">
                        {user?.email?.charAt(0).toUpperCase()}
                      </span>
                      {user?.email}
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn-plain focus-visible"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="btn-filled focus-visible"
                  disabled={loading || !formData.summary.trim()}
                >
                  {loading ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TaskModal
