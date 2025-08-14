import React, { useState, useRef, useEffect } from 'react'
import DropdownMenu, { DropdownItem } from './DropdownMenu'

const TaskCard = ({ task, taskConfig, section, boardLayout, currentColumn, onDragStart, onClick, onQuickUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(null) // 'summary' or 'description'
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef(null)

  // Handle click to edit
  const handleEditStart = (field, currentValue) => {
    setIsEditing(field)
    setEditValue(currentValue || '')
  }

  // Handle edit save
  const handleEditSave = async () => {
    if (editValue.trim() !== (task[isEditing] || '')) {
      await onQuickUpdate(task.id, { [isEditing]: editValue.trim() })
    }
    setIsEditing(null)
    setEditValue('')
  }

  // Handle edit cancel
  const handleEditCancel = () => {
    setIsEditing(null)
    setEditValue('')
  }

  // Handle key press in edit mode
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEditSave()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
  }

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Get config functions
  const getPriorityConfig = (priorityId) => {
    if (!taskConfig) return { name: priorityId, color: '#8E8E93' }
    const priority = taskConfig.priorities?.find(p => p.id === priorityId)
    return priority || { name: priorityId, color: '#8E8E93' }
  }

  const getStatusConfig = (statusId) => {
    if (!taskConfig) return { name: statusId, color: '#8E8E93' }
    const status = taskConfig.statuses?.find(s => s.id === statusId)
    return status || { name: statusId, color: '#8E8E93' }
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

  // Get top border color based on current board layout
  const getTopBorderColor = () => {
    if (!boardLayout || !currentColumn) {
      return section?.color || '#8E8E93'
    }

    switch (boardLayout) {
      case 'sections':
        return section?.color || '#8E8E93'
      case 'statuses':
        return getStatusConfig(task.status).color
      case 'priorities':
        return getPriorityConfig(task.priority).color
      case 'estimations':
        return getEstimationConfig(task.estimation).color
      case 'healths':
        return getHealthConfig(task.health).color
      default:
        return section?.color || '#8E8E93'
    }
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return null
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

  const priority = getPriorityConfig(task.priority)
  const status = getStatusConfig(task.status)
  const estimation = getEstimationConfig(task.estimation)
  const health = getHealthConfig(task.health)
  const dueDate = formatDate(task.due_date)

  return (
    <div
      className="group task-card cursor-pointer"
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={(e) => {
        if (!isEditing) {
          e.stopPropagation()
          onClick(task)
        }
      }}
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.08), 0 3px 10px rgba(0, 0, 0, 0.06)'
        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)'
        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)'
      }}
    >
      {/* Dynamic Color Bar */}
      <div 
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ backgroundColor: getTopBorderColor() }}
      />

      {/* Header with Actions */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          {/* Status Badge */}
          <span 
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${status.color}15`,
              color: status.color,
              border: `1px solid ${status.color}30`
            }}
          >
            {status.name}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Priority Badge */}
          <span 
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${priority.color}15`,
              color: priority.color,
              border: `1px solid ${priority.color}30`
            }}
          >
            {priority.name}
          </span>

          <DropdownMenu
            trigger={
              <button 
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                </svg>
              </button>
            }
            align="right"
          >
          <DropdownItem onClick={() => onClick(task)}>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Details
            </div>
          </DropdownItem>
          <DropdownItem onClick={() => handleEditStart('summary', task.summary)}>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Title
            </div>
          </DropdownItem>
          <DropdownItem onClick={() => onQuickUpdate(task.id, { 
            status: task.status === 'completed' ? 'todo' : 'completed',
            completed_at: task.status === 'completed' ? null : new Date().toISOString()
          })}>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {task.status === 'completed' ? 'Mark Incomplete' : 'Mark Complete'}
            </div>
          </DropdownItem>
          <DropdownItem
            onClick={() => onDelete(task.id)}
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
        </div>
      </div>

      {/* Task Title */}
      <div className="mb-3">
        {isEditing === 'summary' ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditSave}
            onKeyDown={handleKeyPress}
            className="w-full bg-transparent border-none outline-none text-base font-semibold text-gray-900 p-0"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3 
            className="text-base font-semibold text-gray-900 leading-tight cursor-text"
            onDoubleClick={() => handleEditStart('summary', task.summary)}
            style={{
              textDecoration: task.status === 'completed' ? 'line-through' : 'none',
              opacity: task.status === 'completed' ? 0.6 : 1
            }}
          >
            {task.summary}
          </h3>
        )}
      </div>

      {/* Task Description */}
      {task.description && !isEditing && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        </div>
      )}

      {/* Estimation Badge */}
      <div className="mb-4">
        <span 
          className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium"
          style={{
            backgroundColor: `${estimation.color}10`,
            color: estimation.color,
            border: `1px solid ${estimation.color}25`
          }}
        >
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {estimation.name}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        {/* Left: Assignee */}
        <div className="flex items-center">
          {task.assignee_email ? (
            <div 
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium shadow-sm"
              style={{ backgroundColor: '#6366F1' }}
              title={`Assigned to: ${task.assignee_full_name || task.assignee_email}`}
            >
              {(task.assignee_full_name || task.assignee_email).charAt(0).toUpperCase()}
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>

        {/* Right: Due Date */}
        <div className="flex items-center">
          {dueDate && (
            <div 
              className={`flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-md ${
                dueDate.isOverdue 
                  ? 'text-red-600 bg-red-50' 
                  : 'text-gray-500 bg-gray-50'
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{dueDate.formatted}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-500">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default TaskCard
