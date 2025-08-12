import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const TaskSlideout = ({ isOpen, onClose, task = null, onTaskSaved, projectUsers = [] }) => {
  const { user, activeWorkspace, activeProject } = useAuth()
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    assignee: '',
    due_date: '',
    section_id: ''
  })

  const isEditing = !!task

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (task) {
        // Editing existing task
        setFormData({
          summary: task.summary || '',
          description: task.description || '',
          assignee: task.assignee || '',
          due_date: task.due_date || '',
          section_id: task.section_id || ''
        })
      } else {
        // Creating new task
        setFormData({
          summary: '',
          description: '',
          assignee: '',
          due_date: '',
          section_id: ''
        })
      }
      setError('')
    }
  }, [isOpen, task])

  // Fetch sections for the project
  useEffect(() => {
    if (isOpen && activeProject) {
      fetchSections()
    }
  }, [isOpen, activeProject])

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('task_sections')
        .select('*')
        .eq('project_id', activeProject.id)
        .order('sort_order', { ascending: true })

      if (error) throw error
      setSections(data || [])
      
      // Set default section if creating new task
      if (!task && data && data.length > 0) {
        setFormData(prev => ({ ...prev, section_id: data[0].id }))
      }
    } catch (err) {
      console.error('Error fetching sections:', err)
    }
  }

  // Handle form changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.summary.trim()) {
      setError('Task summary is required')
      return
    }

    if (!activeProject || !activeWorkspace) {
      setError('No active project selected')
      return
    }

    setLoading(true)
    setError('')

    try {
      const taskData = {
        summary: formData.summary.trim(),
        description: formData.description.trim() || null,
        assignee: formData.assignee || null,
        due_date: formData.due_date || null,
        section_id: formData.section_id || null,
        organization_id: activeWorkspace.organization_id,
        workspace_id: activeWorkspace.id,
        project_id: activeProject.id,
        created_by: user.id,
        status: 'todo',
        priority: 'medium',
        sort_order: 0
      }

      let result
      if (isEditing) {
        // Update existing task
        const { data, error } = await supabase
          .from('tasks')
          .update({
            ...taskData,
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id)
          .select('*')
          .single()

        if (error) throw error
        result = data
      } else {
        // Create new task
        const { data, error } = await supabase
          .from('tasks')
          .insert(taskData)
          .select('*')
          .single()

        if (error) throw error
        result = data
      }

      // Add user information to the result if needed
      result.assignee_user = null
      result.created_by_user = null

      // Call the callback to refresh task list
      if (onTaskSaved) {
        onTaskSaved(result)
      }

      handleClose()
    } catch (error) {
      console.error('Error saving task:', error)
      setError(error.message || `Failed to ${isEditing ? 'update' : 'create'} task`)
    } finally {
      setLoading(false)
    }
  }

  // Handle close
  const handleClose = () => {
    setFormData({
      summary: '',
      description: '',
      assignee: '',
      due_date: '',
      section_id: ''
    })
    setError('')
    setLoading(false)
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
      
      {/* Slideout Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg">
        <div className="h-full flex flex-col slide-in-right" style={{
          backgroundColor: 'var(--color-background-primary)',
          borderLeft: '1px solid var(--color-border-primary)'
        }}>
          {/* Header */}
          <div className="px-6 py-4 border-b" style={{borderColor: 'var(--color-border-primary)'}}>
            <div className="flex items-center justify-between">
              <h2 className="text-title-2 text-primary font-medium">
                {isEditing ? 'Edit Task' : 'New Task'}
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
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div style={{
                  backgroundColor: 'rgba(255, 59, 48, 0.1)', 
                  padding: 'var(--spacing-3)', 
                  borderRadius: 'var(--radius)', 
                  border: '1px solid rgba(255, 59, 48, 0.2)'
                }}>
                  <p className="text-footnote" style={{color: 'var(--color-system-red)'}}>
                    {error}
                  </p>
                </div>
              )}

              {/* Task Summary */}
              <div className="form-group">
                <label htmlFor="taskSummary" className="input-label">
                  Task Summary *
                </label>
                <input
                  id="taskSummary"
                  type="text"
                  value={formData.summary}
                  onChange={(e) => handleChange('summary', e.target.value)}
                  className="input-field"
                  placeholder="What needs to be done?"
                  required
                  disabled={loading}
                  maxLength={500}
                />
                <div className="text-caption-2 text-tertiary mt-1">
                  {formData.summary.length}/500 characters
                </div>
              </div>

              {/* Task Description */}
              <div className="form-group">
                <label htmlFor="taskDescription" className="input-label">
                  Description
                </label>
                <textarea
                  id="taskDescription"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="input-field resize-none"
                  placeholder="Add more details about this task..."
                  disabled={loading}
                  maxLength={5000}
                  rows={4}
                  style={{
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    overflowY: 'auto'
                  }}
                />
                <div className="text-caption-2 text-tertiary mt-1">
                  {formData.description.length}/5000 characters
                </div>
              </div>

              

              {/* Assignee */}
              <div className="form-group">
                <label htmlFor="taskAssignee" className="input-label">
                  Assignee
                </label>
                <select
                  id="taskAssignee"
                  value={formData.assignee}
                  onChange={(e) => handleChange('assignee', e.target.value)}
                  className="input-field"
                  disabled={loading}
                >
                  <option value="">Unassigned</option>
                  {projectUsers.map(user => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div className="form-group">
                <label htmlFor="taskSection" className="input-label">
                  Section
                </label>
                <select
                  id="taskSection"
                  value={formData.section_id}
                  onChange={(e) => handleChange('section_id', e.target.value)}
                  className="input-field"
                  disabled={loading}
                >
                  <option value="">Select a section</option>
                  {sections.map(section => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div className="form-group">
                <label htmlFor="taskDueDate" className="input-label">
                  Due Date
                </label>
                <input
                  id="taskDueDate"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleChange('due_date', e.target.value)}
                  className="input-field"
                  disabled={loading}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t" style={{borderColor: 'var(--color-border-primary)'}}>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="btn-plain flex-1 focus-visible"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="btn-filled flex-1 focus-visible"
                disabled={loading}
              >
                {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Task')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TaskSlideout 