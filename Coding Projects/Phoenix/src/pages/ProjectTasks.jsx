import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import TaskTable from '../components/TaskTable'
import DynamicTaskTable from '../components/DynamicTaskTable'
import TaskBoard from '../components/TaskBoard'
import TaskModal from '../components/TaskModal'

const ProjectTasks = () => {
  const { activeWorkspace, activeProject, user } = useAuth()
  const { workspaceId, projectId } = useParams()
  
  // State management
  const [tasks, setTasks] = useState([])
  const [projectUsers, setProjectUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [preSelectedSectionId, setPreSelectedSectionId] = useState(null)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState('board') // 'board' or 'table'

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

  // Listen for new task modal events from TaskBoard and DynamicTaskTable
  useEffect(() => {
    const handleNewTaskEvent = (event) => {
      const sectionId = event.detail?.sectionId
      handleNewTask(sectionId)
    }

    const handleEditTaskEvent = (event) => {
      const task = event.detail?.task
      if (task) {
        handleEditTask(task)
      }
    }

    document.addEventListener('openNewTaskModal', handleNewTaskEvent)
    document.addEventListener('editTask', handleEditTaskEvent)
    return () => {
      document.removeEventListener('openNewTaskModal', handleNewTaskEvent)
      document.removeEventListener('editTask', handleEditTaskEvent)
    }
  }, [])

  // Handle task creation/editing
  const handleNewTask = (sectionId = null) => {
    setEditingTask(null)
    setPreSelectedSectionId(sectionId)
    setIsTaskModalOpen(true)
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setIsTaskModalOpen(true)
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

  const handleCloseModal = () => {
    setIsTaskModalOpen(false)
    setEditingTask(null)
    setPreSelectedSectionId(null)
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
          <div className="flex items-center space-x-3">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('board')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'board'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-tertiary hover:text-secondary'
                }`}
              >
                <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h2z" />
                </svg>
                Board
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-tertiary hover:text-secondary'
                }`}
              >
                <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Table
              </button>
            </div>
            
            <div className="flex space-x-2">
              <button 
                className="btn-tinted focus-visible"
                onClick={() => {
                  // Find the task board component and trigger its config modal
                  const configEvent = new CustomEvent('openTaskConfig')
                  document.dispatchEvent(configEvent)
                }}
                title="Configure Task Settings"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
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
          </div>
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

        {/* Tasks View */}
        {viewMode === 'board' ? (
          <TaskBoard
            projectId={activeProject.id}
            onTaskCreated={handleTaskSaved}
            onTaskUpdated={handleTaskSaved}
            onTaskDeleted={(taskId) => {
              setTasks(prev => prev.filter(t => t.id !== taskId))
            }}
          />
        ) : (
          <DynamicTaskTable
            projectId={activeProject.id}
            onTaskCreated={handleTaskSaved}
            onTaskUpdated={handleTaskSaved}
            onTaskDeleted={(taskId) => {
              setTasks(prev => prev.filter(t => t.id !== taskId))
            }}
          />
        )}

        {/* Task Modal */}
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={handleCloseModal}
          projectId={activeProject.id}
          task={editingTask}
          preSelectedSectionId={preSelectedSectionId}
          onTaskCreated={handleTaskSaved}
          onTaskUpdated={handleTaskSaved}
        />
      </div>
    </div>
  )
}

export default ProjectTasks 