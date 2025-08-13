import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const TaskDetailModal = ({ isOpen, onClose, task, taskConfig, sections, onTaskUpdated, onTaskDeleted }) => {
  const { user, activeProject } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    estimation: 'medium',
    health: 'good',
    assignee: '',
    due_date: '',
    tags: []
  })
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [projectUsers, setProjectUsers] = useState([])
  const [localSections, setLocalSections] = useState([])
  const [commentLoading, setCommentLoading] = useState(false)

  // Initialize form data
  useEffect(() => {
    if (isOpen && task) {
      setFormData({
        summary: task.summary || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        estimation: task.estimation || 'medium',
        health: task.health || 'good',
        assignee: task.assignee || '',
        due_date: task.due_date || '',
        tags: task.tags || []
      })
      fetchComments()
      fetchProjectUsers()
      // Use sections prop instead of fetching
    }
  }, [isOpen, task])

  // Fetch task comments
  const fetchComments = async () => {
    if (!task?.id) return

    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          id,
          content,
          created_at,
          updated_at,
          user_id,
          user_profiles:user_id (
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('task_id', task.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (err) {
      console.error('Error fetching comments:', err)
    }
  }

  // Fetch project users
  const fetchProjectUsers = async () => {
    if (!activeProject?.id) return

    try {
      const { data, error } = await supabase
        .rpc('get_project_users_with_emails', {
          p_project_id: activeProject.id
        })

      if (error) throw error
      setProjectUsers(data || [])
    } catch (err) {
      console.error('Error fetching project users:', err)
    }
  }

  // Fetch sections
  const fetchSections = async () => {
    if (!activeProject?.id) return

    try {
      const { data, error } = await supabase
        .from('task_sections')
        .select('*')
        .eq('project_id', activeProject.id)
        .order('sort_order', { ascending: true })

      if (error) throw error
      setLocalSections(data || [])
    } catch (err) {
      console.error('Error fetching sections:', err)
    }
  }

  // Handle form changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle tags
  const handleAddTag = (tagName) => {
    if (tagName.trim() && !formData.tags.includes(tagName.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagName.trim()]
      }))
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  // Save task changes
  const handleSave = async () => {
    try {
      setLoading(true)
      setError('')

      const updates = {
        ...formData,
        updated_at: new Date().toISOString()
      }

      // If status changed to completed, set completed_at
      if (formData.status === 'completed' && task.status !== 'completed') {
        updates.completed_at = new Date().toISOString()
      } else if (formData.status !== 'completed') {
        updates.completed_at = null
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', task.id)
        .select()
        .single()

      if (error) throw error

      // Fetch updated task with details
      const { data: taskDetails } = await supabase
        .rpc('get_project_tasks_with_details', { p_project_id: activeProject.id })

      if (taskDetails) {
        const updatedTask = taskDetails.find(t => t.id === task.id)
        if (updatedTask && onTaskUpdated) {
          onTaskUpdated(updatedTask)
        }
      }
    } catch (err) {
      console.error('Error updating task:', err)
      setError('Failed to update task')
    } finally {
      setLoading(false)
    }
  }

  // Add comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return

    try {
      setCommentLoading(true)
      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: task.id,
          user_id: user.id,
          content: newComment.trim()
        })
        .select(`
          id,
          content,
          created_at,
          updated_at,
          user_id,
          user_profiles:user_id (
            email,
            full_name,
            avatar_url
          )
        `)
        .single()

      if (error) throw error

      setComments(prev => [...prev, data])
      setNewComment('')
    } catch (err) {
      console.error('Error adding comment:', err)
      alert('Failed to add comment')
    } finally {
      setCommentLoading(false)
    }
  }

  // Delete task
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id)

      if (error) throw error

      if (onTaskDeleted) {
        onTaskDeleted(task.id)
      }
    } catch (err) {
      console.error('Error deleting task:', err)
      setError('Failed to delete task')
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

  if (!isOpen || !task) return null

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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
              <div className="flex items-center space-x-3">
                <div 
                  className="w-6 h-6 rounded-full" 
                  style={{ backgroundColor: sections?.find(s => s.id === task?.section_id)?.color || '#8E8E93' }}
                />
                <h2 className="text-title-2 text-primary font-medium">
                  Task Details
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="btn-filled focus-visible"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
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
            </div>

            <div className="flex">
              {/* Main Content */}
              <div className="flex-1 p-6 space-y-6">
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

                {/* Task Summary */}
                <div className="form-group">
                  <label className="input-label">
                    Task Summary *
                  </label>
                  <input
                    type="text"
                    value={formData.summary}
                    onChange={(e) => handleChange('summary', e.target.value)}
                    className="input-field text-title-3"
                    style={{ fontSize: '20px', fontWeight: '600' }}
                    placeholder="What needs to be done?"
                    disabled={loading}
                  />
                </div>

                {/* Task Description */}
                <div className="form-group">
                  <label className="input-label">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="input-field resize-none"
                    placeholder="Add more details about this task..."
                    disabled={loading}
                    rows={6}
                    style={{
                      padding: '12px',
                      lineHeight: '1.5'
                    }}
                  />
                </div>

                {/* Tags */}
                <div className="form-group">
                  <label className="input-label">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add a tag and press Enter"
                    className="input-field"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag(e.target.value)
                        e.target.value = ''
                      }
                    }}
                    disabled={loading}
                  />
                </div>

                {/* Comments Section */}
                <div className="form-group">
                  <label className="input-label">
                    Comments ({comments.length})
                  </label>
                  
                  {/* Add Comment */}
                  <div className="flex space-x-3 mb-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      <span className="leading-none">
                        {user?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="input-field resize-none"
                        rows={3}
                        disabled={commentLoading}
                        style={{
                          padding: '12px',
                          lineHeight: '1.5'
                        }}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || commentLoading}
                          className="btn-filled btn-compact focus-visible"
                        >
                          {commentLoading ? 'Adding...' : 'Add Comment'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex space-x-3">
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                          <span className="leading-none">
                            {(comment.user_profiles?.full_name || comment.user_profiles?.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-primary">
                                {comment.user_profiles?.full_name || comment.user_profiles?.email || 'Unknown User'}
                              </span>
                              <span className="text-xs text-tertiary">
                                {formatDate(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-secondary whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {comments.length === 0 && (
                      <p className="text-center text-tertiary py-4">
                        No comments yet. Start the conversation!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="w-80 border-l border-gray-200 p-6 space-y-6 bg-gray-50">
                {/* Status */}
                <div className="form-group">
                  <label className="input-label">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="input-field"
                    disabled={loading}
                  >
                    {taskConfig?.statuses?.map(status => (
                      <option key={status.id} value={status.id}>{status.name}</option>
                    )) || (
                      <>
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Priority */}
                <div className="form-group">
                  <label className="input-label">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    className="input-field"
                    disabled={loading}
                  >
                    {taskConfig?.priorities?.map(priority => (
                      <option key={priority.id} value={priority.id}>{priority.name}</option>
                    )) || (
                      <>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Estimation */}
                <div className="form-group">
                  <label className="input-label">
                    Estimation
                  </label>
                  <select
                    value={formData.estimation}
                    onChange={(e) => handleChange('estimation', e.target.value)}
                    className="input-field"
                    disabled={loading}
                  >
                    {taskConfig?.estimations?.map(estimation => (
                      <option key={estimation.id} value={estimation.id}>{estimation.name}</option>
                    )) || (
                      <>
                        <option value="xs">XS (1-2h)</option>
                        <option value="small">Small (3-5h)</option>
                        <option value="medium">Medium (1d)</option>
                        <option value="large">Large (2-3d)</option>
                        <option value="xl">XL (1w+)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Health */}
                <div className="form-group">
                  <label className="input-label">
                    Health
                  </label>
                  <select
                    value={formData.health}
                    onChange={(e) => handleChange('health', e.target.value)}
                    className="input-field"
                    disabled={loading}
                  >
                    {taskConfig?.healths?.map(health => (
                      <option key={health.id} value={health.id}>{health.name}</option>
                    )) || (
                      <>
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="at_risk">At Risk</option>
                        <option value="blocked">Blocked</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Section */}
                <div className="form-group">
                  <label className="input-label">
                    Section
                  </label>
                  <select
                    value={task.section_id || ''}
                    onChange={(e) => handleChange('section_id', e.target.value)}
                    className="input-field"
                    disabled={loading}
                  >
                    {sections.map(section => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assignee */}
                <div className="form-group">
                  <label className="input-label">
                    Assignee
                  </label>
                  <select
                    value={formData.assignee}
                    onChange={(e) => handleChange('assignee', e.target.value)}
                    className="input-field"
                    disabled={loading}
                  >
                    <option value="">Unassigned</option>
                    {projectUsers.map(user => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.full_name || user.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div className="form-group">
                  <label className="input-label">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleChange('due_date', e.target.value)}
                    className="input-field"
                    disabled={loading}
                  />
                </div>

                {/* Task Meta */}
                <div className="pt-4 border-t border-gray-300 space-y-3">
                  <div>
                    <span className="text-caption-1 text-tertiary">Created:</span>
                    <p className="text-footnote text-secondary">
                      {formatDate(task.created_at)}
                    </p>
                    <p className="text-caption-2 text-tertiary">
                      by {task.created_by_full_name || task.created_by_email || 'Unknown'}
                    </p>
                  </div>
                  
                  {task.updated_at !== task.created_at && (
                    <div>
                      <span className="text-caption-1 text-tertiary">Last Updated:</span>
                      <p className="text-footnote text-secondary">
                        {formatDate(task.updated_at)}
                      </p>
                    </div>
                  )}

                  {task.completed_at && (
                    <div>
                      <span className="text-caption-1 text-tertiary">Completed:</span>
                      <p className="text-footnote text-secondary">
                        {formatDate(task.completed_at)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Delete Button */}
                <div className="pt-4 border-t border-gray-300">
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="w-full btn-plain text-red-600 hover:bg-red-50 focus-visible"
                  >
                    <div className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Task
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TaskDetailModal
