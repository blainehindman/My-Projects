import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import BoardLayoutSelector from './BoardLayoutSelector'
import DropdownMenu, { DropdownItem } from './DropdownMenu'

const DynamicTaskTable = ({ projectId, onTaskCreated, onTaskUpdated, onTaskDeleted }) => {
  const { user, activeProject, activeWorkspace } = useAuth()
  const [sections, setSections] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [taskConfig, setTaskConfig] = useState(null)
  const [tableLayout, setTableLayout] = useState('sections')

  // Fetch sections and tasks (similar to TaskBoard)
  const fetchData = async () => {
    if (!projectId) return

    try {
      setLoading(true)
      setError('')

      // Fetch sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('task_sections')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true })

      if (sectionsError) throw sectionsError

      // Fetch tasks with details using the new function
      const { data: tasksData, error: tasksError } = await supabase
        .rpc('get_project_tasks_with_details', { p_project_id: projectId })

      if (tasksError) {
        console.error('RPC function error:', tasksError)
        // Fallback to basic task fetch if RPC fails
        const { data: basicTasks, error: basicError } = await supabase
          .from('tasks')
          .select('*')
          .eq('project_id', projectId)
          .order('sort_order', { ascending: true })
        
        if (basicError) throw basicError
        setTasks(basicTasks || [])
      } else {
        setTasks(tasksData || [])
      }

      // Fetch task configuration
      const { data: configData, error: configError } = await supabase
        .rpc('get_project_task_config', { p_project_id: projectId })

      if (configError) console.warn('Error loading task config:', configError)

      setSections(sectionsData || [])
      setTaskConfig(configData || getDefaultConfig())
    } catch (err) {
      console.error('Error fetching task data:', err)
      setError('Failed to load tasks. Please make sure you have run the database_updates.sql file.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [projectId])

  // Default config helper
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
    ],
    estimations: [
      { id: 'xs', name: 'XS (1-2h)', color: '#34C759', order: 0 },
      { id: 'small', name: 'Small (3-5h)', color: '#8E8E93', order: 1 },
      { id: 'medium', name: 'Medium (1d)', color: '#FF9500', order: 2 },
      { id: 'large', name: 'Large (2-3d)', color: '#FF3B30', order: 3 },
      { id: 'xl', name: 'XL (1w+)', color: '#AF52DE', order: 4 }
    ],
    healths: [
      { id: 'excellent', name: 'Excellent', color: '#34C759', order: 0 },
      { id: 'good', name: 'Good', color: '#8E8E93', order: 1 },
      { id: 'at_risk', name: 'At Risk', color: '#FF9500', order: 2 },
      { id: 'blocked', name: 'Blocked', color: '#FF3B30', order: 3 }
    ],
    defaultSection: 'todo'
  })

  // Get dynamic table groups based on current layout
  const getDynamicGroups = () => {
    switch (tableLayout) {
      case 'sections':
        return sections.map(section => ({
          id: section.id,
          name: section.name,
          color: section.color || '#007AFF',
          type: 'section'
        }))
      
      case 'statuses':
        return (taskConfig?.statuses || []).map(status => ({
          id: status.id,
          name: status.name,
          color: status.color,
          type: 'status'
        }))
      
      case 'priorities':
        return (taskConfig?.priorities || []).map(priority => ({
          id: priority.id,
          name: priority.name,
          color: priority.color,
          type: 'priority'
        }))
      
      case 'estimations':
        return (taskConfig?.estimations || []).map(estimation => ({
          id: estimation.id,
          name: estimation.name,
          color: estimation.color,
          type: 'estimation'
        }))
      
      case 'healths':
        return (taskConfig?.healths || []).map(health => ({
          id: health.id,
          name: health.name,
          color: health.color,
          type: 'health'
        }))
      
      default:
        return sections.map(section => ({
          id: section.id,
          name: section.name,
          color: section.color || '#007AFF',
          type: 'section'
        }))
    }
  }

  // Group tasks by current layout
  const getTasksByGroup = (groupId, groupType) => {
    let filteredTasks = []
    
    switch (groupType) {
      case 'section':
        filteredTasks = tasks.filter(task => task.section_id === groupId)
        break
      case 'status':
        filteredTasks = tasks.filter(task => task.status === groupId)
        break
      case 'priority':
        filteredTasks = tasks.filter(task => task.priority === groupId)
        break
      case 'estimation':
        filteredTasks = tasks.filter(task => task.estimation === groupId)
        break
      case 'health':
        filteredTasks = tasks.filter(task => task.health === groupId)
        break
      default:
        filteredTasks = tasks.filter(task => task.section_id === groupId)
    }
    
    return filteredTasks.sort((a, b) => a.sort_order - b.sort_order)
  }

  // Format date display
  const formatDate = (dateString) => {
    if (!dateString) return { formatted: '-', isOverdue: false }
    const date = new Date(dateString)
    const today = new Date()
    const isOverdue = date < today && date.toDateString() !== today.toDateString()
    
    const formatted = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    })
    
    return { formatted, isOverdue }
  }

  // Format user display
  const formatUser = (userEmail) => {
    if (!userEmail) return '-'
    return userEmail.split('@')[0] // Show username part of email
  }

  // Handle task click (edit)
  const handleTaskClick = (task) => {
    // Trigger the edit task modal
    const editTaskEvent = new CustomEvent('editTask', { 
      detail: { task }
    })
    document.dispatchEvent(editTaskEvent)
  }

  // Handle task deletion
  const handleDeleteTask = async (task) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id)

      if (error) throw error

      setTasks(prev => prev.filter(t => t.id !== task.id))
      if (onTaskDeleted) onTaskDeleted(task.id)
    } catch (err) {
      console.error('Error deleting task:', err)
      alert('Failed to delete task')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
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
      </div>
    )
  }

  const dynamicGroups = getDynamicGroups()

  return (
    <div className="space-y-6">
      {/* Table Layout Selector */}
      <div className="flex items-center justify-between">
        <BoardLayoutSelector
          currentLayout={tableLayout}
          onLayoutChange={setTableLayout}
          taskConfig={taskConfig}
        />
        <div className="text-sm text-gray-500">
          {dynamicGroups.length} {tableLayout === 'sections' ? 'sections' : `${tableLayout} groups`}
        </div>
      </div>

      {/* Dynamic Tables */}
      <div className="space-y-6">
        {dynamicGroups.map((group) => {
          const groupTasks = getTasksByGroup(group.id, group.type)
          
          return (
            <div key={`${group.type}-${group.id}`} className="card">
              {/* Table Header */}
              <div 
                className="flex items-center justify-between p-4 border-b-2"
                style={{ borderBottomColor: group.color }}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <h3 className="text-title-3 font-semibold" style={{ color: group.color }}>
                    {group.name}
                  </h3>
                  <span className="text-caption-2 text-tertiary bg-gray-100 px-2 py-1 rounded-full">
                    {groupTasks.length} tasks
                  </span>
                </div>
                
                {/* Add Task Button */}
                <button
                  onClick={() => {
                    // Trigger the new task modal with appropriate defaults
                    const detail = {}
                    
                    if (tableLayout === 'sections') {
                      detail.sectionId = group.id
                    } else {
                      detail.sectionId = sections[0]?.id
                      detail[tableLayout.slice(0, -1)] = group.id
                    }
                    
                    const newTaskEvent = new CustomEvent('openNewTaskModal', { detail })
                    document.dispatchEvent(newTaskEvent)
                  }}
                  className="btn-filled btn-compact focus-visible"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Task
                </button>
              </div>

              {/* Table Content */}
              {groupTasks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-footnote text-tertiary">No tasks in this {group.type}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
                        <th className="text-left py-3 px-4 text-caption-1 font-medium text-tertiary">Task</th>
                        <th className="text-left py-3 px-4 text-caption-1 font-medium text-tertiary">Status</th>
                        <th className="text-left py-3 px-4 text-caption-1 font-medium text-tertiary">Priority</th>
                        <th className="text-left py-3 px-4 text-caption-1 font-medium text-tertiary">Estimation</th>
                        <th className="text-left py-3 px-4 text-caption-1 font-medium text-tertiary">Assignee</th>
                        <th className="text-left py-3 px-4 text-caption-1 font-medium text-tertiary">Due Date</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupTasks.map((task, index) => {
                        const dueDate = formatDate(task.due_date)
                        const createdDate = formatDate(task.created_at)

                        // Get configurations for this task
                        const statusConfig = taskConfig?.statuses?.find(s => s.id === task.status) || { name: task.status, color: '#8E8E93' }
                        const priorityConfig = taskConfig?.priorities?.find(p => p.id === task.priority) || { name: task.priority, color: '#8E8E93' }
                        const estimationConfig = taskConfig?.estimations?.find(e => e.id === task.estimation) || { name: task.estimation, color: '#8E8E93' }

                        return (
                          <tr 
                            key={task.id}
                            className="hover:bg-background-secondary transition-colors cursor-pointer"
                            style={{
                              borderBottom: index < groupTasks.length - 1 ? '1px solid var(--color-border-secondary)' : 'none'
                            }}
                            onClick={() => handleTaskClick(task)}
                          >
                            {/* Task Summary */}
                            <td className="py-3 px-4">
                              <div>
                                <div className="text-footnote text-primary font-medium mb-1 line-clamp-2">
                                  {task.summary}
                                </div>
                                {task.description && (
                                  <div className="text-caption-2 text-secondary line-clamp-1">
                                    {task.description}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              <span 
                                className="px-2 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: `${statusConfig.color}15`,
                                  color: statusConfig.color,
                                  border: `1px solid ${statusConfig.color}30`
                                }}
                              >
                                {statusConfig.name}
                              </span>
                            </td>

                            {/* Priority */}
                            <td className="py-3 px-4">
                              <span 
                                className="px-2 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: `${priorityConfig.color}15`,
                                  color: priorityConfig.color,
                                  border: `1px solid ${priorityConfig.color}30`
                                }}
                              >
                                {priorityConfig.name}
                              </span>
                            </td>

                            {/* Estimation */}
                            <td className="py-3 px-4">
                              <span 
                                className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium"
                                style={{
                                  backgroundColor: `${estimationConfig.color}10`,
                                  color: estimationConfig.color,
                                  border: `1px solid ${estimationConfig.color}25`
                                }}
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {estimationConfig.name}
                              </span>
                            </td>

                            {/* Assignee */}
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                {task.assignee_email ? (
                                  <div className="flex items-center space-x-2">
                                    <div 
                                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                      style={{ backgroundColor: '#6366F1' }}
                                      title={`Assigned to: ${task.assignee_full_name || task.assignee_email}`}
                                    >
                                      {(task.assignee_full_name || task.assignee_email).charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-footnote text-primary">
                                      {formatUser(task.assignee_email)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-footnote text-tertiary">Unassigned</span>
                                )}
                              </div>
                            </td>

                            {/* Due Date */}
                            <td className="py-3 px-4">
                              <div 
                                className="text-footnote"
                                style={{
                                  color: dueDate.isOverdue ? 'var(--color-system-red)' : 'var(--color-text-primary)'
                                }}
                              >
                                {dueDate.formatted}
                                {dueDate.isOverdue && (
                                  <span className="ml-1 text-caption-2" style={{ color: 'var(--color-system-red)' }}>
                                    (overdue)
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4">
                              <DropdownMenu
                                trigger={
                                  <button 
                                    className="btn-plain btn-compact focus-visible"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                                    </svg>
                                  </button>
                                }
                                align="right"
                              >
                                <DropdownItem onClick={() => handleTaskClick(task)}>
                                  <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit Task
                                  </div>
                                </DropdownItem>
                                <DropdownItem 
                                  onClick={() => handleDeleteTask(task)}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <div className="flex items-center" style={{ color: 'var(--color-system-red)' }}>
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete Task
                                  </div>
                                </DropdownItem>
                              </DropdownMenu>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DynamicTaskTable
