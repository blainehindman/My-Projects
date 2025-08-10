import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import TaskTable from '../components/TaskTable'
import TaskSlideout from '../components/TaskSlideout'

const ProjectTasks = () => {
  const { activeWorkspace, activeProject, user } = useAuth()
  const { workspaceId, projectId } = useParams()
  
  // State management
  const [tasks, setTasks] = useState([])
  const [projectUsers, setProjectUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSlideoutOpen, setIsSlideoutOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [error, setError] = useState('')

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

  // Fetch tasks for the project
  const fetchTasks = async () => {
    try {
      setLoading(true)
      
      // First fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', activeProject.id)
        .order('created_at', { ascending: false })

      if (tasksError) {
        throw tasksError
      }

      // For now, just use the task data without user emails
      // We'll get user emails from project memberships
      const tasksWithUsers = tasksData.map(task => ({
        ...task,
        assignee_user: null, // Will be populated when we fetch project users
        created_by_user: null
      }))

      setTasks(tasksWithUsers || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setError('Failed to load tasks. Make sure you have run the tasks_schema_clean.sql file in your Supabase dashboard.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch project users for assignment dropdown (only project members)
  const fetchProjectUsers = async () => {
    try {
      // Use the RPC function to get project users with emails
      const { data: projectUsers, error } = await supabase
        .rpc('get_project_users_with_emails', {
          p_project_id: activeProject.id
        })

      if (error) {
        console.error('Error fetching project users:', error)
        // Fallback to simple project memberships
        const { data: memberships, error: membershipsError } = await supabase
          .from('project_memberships')
          .select('user_id, role')
          .eq('project_id', activeProject.id)

        if (!membershipsError && memberships) {
          const fallbackUsers = memberships.map(membership => ({
            user_id: membership.user_id,
            email: `User ${membership.user_id.slice(0, 8)}...`,
            role: membership.role
          }))
          setProjectUsers(fallbackUsers)
        } else {
          setProjectUsers([])
        }
        return
      }

      setProjectUsers(projectUsers || [])

      // Also update tasks with assignee info from project users
      setTasks(prev => prev.map(task => ({
        ...task,
        assignee_user: task.assignee ? 
          { email: projectUsers?.find(u => u.user_id === task.assignee)?.email || 'Unknown User' } : 
          null,
        created_by_user: task.created_by ?
          { email: projectUsers?.find(u => u.user_id === task.created_by)?.email || 'Unknown User' } :
          null
      })))

    } catch (error) {
      console.error('Error fetching project users:', error)
      setProjectUsers([])
    }
  }

  // Load data on component mount
  useEffect(() => {
    if (activeProject) {
      fetchTasks()
      fetchProjectUsers()
    }
  }, [activeProject])

  // Handle task creation/editing
  const handleNewTask = () => {
    setEditingTask(null)
    setIsSlideoutOpen(true)
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setIsSlideoutOpen(true)
  }

  const handleDeleteTask = async (task) => {
    if (!window.confirm(`Are you sure you want to delete "${task.summary}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id)

      if (error) {
        throw error
      }

      // Remove from local state
      setTasks(prev => prev.filter(t => t.id !== task.id))
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Failed to delete task. Please try again.')
    }
  }

  const handleTaskSaved = (savedTask) => {
    if (editingTask) {
      // Update existing task
      setTasks(prev => prev.map(task => 
        task.id === savedTask.id ? savedTask : task
      ))
    } else {
      // Add new task
      setTasks(prev => [savedTask, ...prev])
    }
  }

  const handleCloseSlideout = () => {
    setIsSlideoutOpen(false)
    setEditingTask(null)
  }

  return (
    <div className="container section">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-title-1 text-primary mb-2">{activeProject.name} Tasks</h1>
            <p className="text-body text-secondary">
              Manage and track tasks for this project
            </p>
          </div>
          <button 
            className="btn-filled focus-visible"
            onClick={handleNewTask}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Task
          </button>
        </div>

        {/* Error Message */}
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

        {/* Tasks Table */}
        <TaskTable
          tasks={tasks}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          loading={loading}
        />

        {/* Task Slideout */}
        <TaskSlideout
          isOpen={isSlideoutOpen}
          onClose={handleCloseSlideout}
          task={editingTask}
          onTaskSaved={handleTaskSaved}
          projectUsers={projectUsers}
        />
      </div>
    </div>
  )
}

export default ProjectTasks 