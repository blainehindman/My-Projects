import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import TaskCard from './TaskCard'
import TaskDetailModal from './TaskDetailModal'
import TaskConfigModal from './TaskConfigModal'
import BoardLayoutSelector from './BoardLayoutSelector'
import DropdownMenu, { DropdownItem } from './DropdownMenu'

const TaskBoard = ({ projectId, onTaskCreated, onTaskUpdated, onTaskDeleted }) => {
  const { user, activeProject, activeWorkspace } = useAuth()
  const [sections, setSections] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [draggedTask, setDraggedTask] = useState(null)
  const [draggedOverSection, setDraggedOverSection] = useState(null)

  const [taskConfig, setTaskConfig] = useState(null)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [boardLayout, setBoardLayout] = useState('sections')
  const dragCounter = useRef(0)

  // Fetch sections and tasks
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
        console.log('Using fallback task fetch:', basicTasks)
        setTasks(basicTasks || [])
      } else {
        setTasks(tasksData || [])
      }

      // Fetch task configuration
      const { data: configData, error: configError } = await supabase
        .rpc('get_project_task_config', { p_project_id: projectId })

      if (configError) console.warn('Error loading task config:', configError)

      setSections(sectionsData || [])
      // Note: tasks are set above in the RPC call or fallback
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

  // Listen for config modal open events
  useEffect(() => {
    const handleConfigEvent = () => {
      setIsConfigModalOpen(true)
    }

    document.addEventListener('openTaskConfig', handleConfigEvent)
    return () => {
      document.removeEventListener('openTaskConfig', handleConfigEvent)
    }
  }, [])

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

  // Get status/priority config by ID
  const getStatusConfig = (statusId) => {
    if (!taskConfig) return { name: statusId, color: '#8E8E93' }
    const status = taskConfig.statuses?.find(s => s.id === statusId)
    return status || { name: statusId, color: '#8E8E93' }
  }

  const getPriorityConfig = (priorityId) => {
    if (!taskConfig) return { name: priorityId, color: '#8E8E93' }
    const priority = taskConfig.priorities?.find(p => p.id === priorityId)
    return priority || { name: priorityId, color: '#8E8E93' }
  }

  const getEstimationConfig = (estimationId) => {
    if (!taskConfig) return { name: estimationId, color: '#8E8E93' }
    const estimation = taskConfig.estimations?.find(e => e.id === estimationId)
    return estimation || { name: estimationId, color: '#8E8E93' }
  }

  const getHealthConfig = (healthId) => {
    if (!taskConfig) return { name: healthId, color: '#8E8E93' }
    const health = taskConfig.healths?.find(h => h.id === healthId)
    return health || { name: healthId, color: '#8E8E93' }
  }

  // Group tasks by section
  const getTasksBySection = (sectionId) => {
    return tasks
      .filter(task => task.section_id === sectionId)
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  // Get dynamic columns based on current layout
  const getDynamicColumns = () => {
    switch (boardLayout) {
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
  const getTasksByColumn = (columnId, columnType) => {
    let filteredTasks = []
    
    switch (columnType) {
      case 'section':
        filteredTasks = tasks.filter(task => task.section_id === columnId)
        break
      case 'status':
        filteredTasks = tasks.filter(task => task.status === columnId)
        break
      case 'priority':
        filteredTasks = tasks.filter(task => task.priority === columnId)
        break
      case 'estimation':
        filteredTasks = tasks.filter(task => task.estimation === columnId)
        break
      case 'health':
        filteredTasks = tasks.filter(task => task.health === columnId)
        break
      default:
        filteredTasks = tasks.filter(task => task.section_id === columnId)
    }
    
    return filteredTasks.sort((a, b) => a.sort_order - b.sort_order)
  }

  // Create new section
  const handleCreateSection = async (name, position) => {
    try {
      const { data, error } = await supabase
        .from('task_sections')
        .insert({
          project_id: projectId,
          name: name.trim(),
          sort_order: position,
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error

      setSections(prev => [...prev, data].sort((a, b) => a.sort_order - b.sort_order))
      setIsAddingSectionTo(null)
      setNewSectionName('')
    } catch (err) {
      console.error('Error creating section:', err)
      alert('Failed to create section')
    }
  }

  // Update section
  const handleUpdateSection = async (sectionId, updates) => {
    try {
      const { error } = await supabase
        .from('task_sections')
        .update(updates)
        .eq('id', sectionId)

      if (error) throw error

      setSections(prev => 
        prev.map(section => 
          section.id === sectionId 
            ? { ...section, ...updates }
            : section
        )
      )
    } catch (err) {
      console.error('Error updating section:', err)
      alert('Failed to update section')
    }
  }

  // Delete section
  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this section? All tasks will be moved to the first section.')) {
      return
    }

    try {
      // Move all tasks to the first section
      const firstSection = sections.find(s => s.id !== sectionId)
      if (firstSection) {
        await supabase
          .from('tasks')
          .update({ section_id: firstSection.id })
          .eq('section_id', sectionId)
      }

      // Delete the section
      const { error } = await supabase
        .from('task_sections')
        .delete()
        .eq('id', sectionId)

      if (error) throw error

      setSections(prev => prev.filter(s => s.id !== sectionId))
      fetchData() // Refresh to get updated task positions
    } catch (err) {
      console.error('Error deleting section:', err)
      alert('Failed to delete section')
    }
  }



  // Update task
  const handleUpdateTask = async (taskId, updates, skipCallback = false) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)

      if (error) throw error

      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, ...updates } : task
        )
      )

      // Skip callback for drag and drop operations to prevent duplication
      if (!skipCallback && onTaskUpdated) {
        const updatedTask = tasks.find(t => t.id === taskId)
        if (updatedTask) {
          onTaskUpdated({ ...updatedTask, ...updates })
        }
      }
    } catch (err) {
      console.error('Error updating task:', err)
      alert('Failed to update task')
    }
  }

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      setTasks(prev => prev.filter(t => t.id !== taskId))
      if (onTaskDeleted) onTaskDeleted(taskId)
    } catch (err) {
      console.error('Error deleting task:', err)
      alert('Failed to delete task')
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e, task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e, sectionId) => {
    e.preventDefault()
    dragCounter.current++
    setDraggedOverSection(sectionId)
  }

  const handleDragLeave = (e) => {
    dragCounter.current--
    if (dragCounter.current === 0) {
      setDraggedOverSection(null)
    }
  }

  const handleDrop = async (e, targetColumnId, targetColumnType) => {
    e.preventDefault()
    dragCounter.current = 0
    setDraggedOverSection(null)

    if (!draggedTask) {
      setDraggedTask(null)
      return
    }

    // Check if the task is already in the target column
    let isSameColumn = false
    switch (targetColumnType) {
      case 'section':
        isSameColumn = draggedTask.section_id === targetColumnId
        break
      case 'status':
        isSameColumn = draggedTask.status === targetColumnId
        break
      case 'priority':
        isSameColumn = draggedTask.priority === targetColumnId
        break
      case 'estimation':
        isSameColumn = draggedTask.estimation === targetColumnId
        break
      case 'health':
        isSameColumn = draggedTask.health === targetColumnId
        break
      default:
        isSameColumn = draggedTask.section_id === targetColumnId
    }

    if (isSameColumn) {
      setDraggedTask(null)
      return
    }

    try {
      // Get tasks in target column to calculate new sort order
      const targetColumnTasks = getTasksByColumn(targetColumnId, targetColumnType)
      const maxSortOrder = Math.max(0, ...targetColumnTasks.map(t => t.sort_order))

      // Prepare updates based on column type
      const updates = {
        sort_order: maxSortOrder + 1
      }

      switch (targetColumnType) {
        case 'section':
          updates.section_id = targetColumnId
          // If moving to "Done" section, mark as completed
          const targetSection = sections.find(s => s.id === targetColumnId)
          if (targetSection?.name.toLowerCase() === 'done') {
            updates.status = 'completed'
            updates.completed_at = new Date().toISOString()
          }
          break
        case 'status':
          updates.status = targetColumnId
          if (targetColumnId === 'completed') {
            updates.completed_at = new Date().toISOString()
          } else {
            updates.completed_at = null
          }
          break
        case 'priority':
          updates.priority = targetColumnId
          break
        case 'estimation':
          updates.estimation = targetColumnId
          break
        case 'health':
          updates.health = targetColumnId
          break
      }

      await handleUpdateTask(draggedTask.id, updates, true) // Skip callback to prevent duplication
    } catch (err) {
      console.error('Error moving task:', err)
      alert('Failed to move task')
    } finally {
      setDraggedTask(null)
    }
  }

  // Open task detail modal
  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setIsDetailModalOpen(true)
  }

  // Handle task update from modal
  const handleTaskUpdateFromModal = (updatedTask) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      )
    )
    if (onTaskUpdated) onTaskUpdated(updatedTask)
  }

  if (loading) {
    return (
      <div className="flex space-x-6 overflow-x-auto pb-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex-shrink-0 w-80">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ))}
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

  const dynamicColumns = getDynamicColumns()

  return (
    <>
      {/* Board Layout Selector */}
      <div className="flex items-center justify-between mb-6">
        <BoardLayoutSelector
          currentLayout={boardLayout}
          onLayoutChange={setBoardLayout}
          taskConfig={taskConfig}
        />
        <div className="text-sm text-gray-500">
          {dynamicColumns.length} {boardLayout === 'sections' ? 'sections' : `${boardLayout} options`}
        </div>
      </div>

      <div className="flex space-x-6 overflow-x-auto pb-6 task-board-scroll">
        {dynamicColumns.map((column) => (
          <div
            key={`${column.type}-${column.id}`}
            className={`flex-shrink-0 w-80 ${
              draggedOverSection === column.id ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
            }`}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id, column.type)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: column.color || '#007AFF' }}
                />
                <h3 className="text-footnote font-medium text-primary">
                  {column.name}
                </h3>
                <span className="text-caption-2 text-tertiary">
                  {getTasksByColumn(column.id, column.type).length}
                </span>
              </div>
            </div>

            {/* Tasks */}
            <div className="space-y-3 min-h-24">
              {getTasksByColumn(column.id, column.type).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  taskConfig={taskConfig}
                  section={sections.find(s => s.id === task.section_id)}
                  boardLayout={boardLayout}
                  currentColumn={column}
                  onDragStart={handleDragStart}
                  onClick={() => handleTaskClick(task)}
                  onQuickUpdate={handleUpdateTask}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))}
              
              {/* Add task button */}
              <button
                onClick={() => {
                  // Trigger the new task modal with appropriate defaults based on current layout
                  const detail = {}
                  
                  if (boardLayout === 'sections') {
                    detail.sectionId = column.id
                  } else {
                    // For other layouts, set the appropriate field and use first section as default
                    detail.sectionId = sections[0]?.id
                    detail[boardLayout.slice(0, -1)] = column.id // Remove 's' from end (e.g., statuses -> status)
                  }
                  
                  const newTaskEvent = new CustomEvent('openNewTaskModal', { detail })
                  document.dispatchEvent(newTaskEvent)
                }}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-tertiary hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add task
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false)
            setSelectedTask(null)
          }}
          task={selectedTask}
          taskConfig={taskConfig}
          sections={sections}
          onTaskUpdated={handleTaskUpdateFromModal}
          onTaskDeleted={(taskId) => {
            handleDeleteTask(taskId)
            setIsDetailModalOpen(false)
            setSelectedTask(null)
          }}
        />
      )}

      {/* Task Configuration Modal */}
      <TaskConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        projectId={projectId}
        onConfigUpdated={(newConfig) => {
          setTaskConfig(newConfig)
          fetchData() // Refresh tasks to reflect new config
        }}
      />
    </>
  )
}

export default TaskBoard
