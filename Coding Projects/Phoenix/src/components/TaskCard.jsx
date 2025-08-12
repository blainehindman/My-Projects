import React, { useState, useRef, useEffect } from 'react'
import DropdownMenu, { DropdownItem } from './DropdownMenu'

const TaskCard = ({ task, taskConfig, onDragStart, onClick, onQuickUpdate, onDelete }) => {
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

  // Get priority config from task configuration
  const getPriorityConfig = (priorityId) => {
    if (!taskConfig) return { name: priorityId, color: '#8E8E93' }
    const priority = taskConfig.priorities?.find(p => p.id === priorityId)
    return priority || { name: priorityId, color: '#8E8E93' }
  }

  // Get status config from task configuration
  const getStatusConfig = (statusId) => {
    if (!taskConfig) return { name: statusId, color: '#8E8E93' }
    const status = taskConfig.statuses?.find(s => s.id === statusId)
    return status || { name: statusId, color: '#8E8E93' }
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
  const dueDate = formatDate(task.due_date)

  return (
    <div
      className="group card task-card"
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      style={{
        backgroundColor: 'var(--color-background-primary)',
        border: '1px solid var(--color-border-secondary)'
      }}
    >
      {/* Header with status and actions */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div 
            className="w-2 h-2 rounded-full" 
            title={`Status: ${status.name}`}
            style={{ backgroundColor: status.color }}
          />
          <div 
            className="w-2 h-2 rounded-full" 
            title={`Priority: ${priority.name}`}
            style={{ backgroundColor: priority.color }}
          />
        </div>
        <DropdownMenu
          trigger={
            <button 
              className="btn-plain btn-compact focus-visible opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Task Summary */}
      <div 
        className="mb-3"
        onClick={(e) => {
          if (!isEditing) {
            e.stopPropagation()
            onClick(task)
          }
        }}
      >
        {isEditing === 'summary' ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditSave}
            onKeyDown={handleKeyPress}
            className="input-field text-footnote font-medium"
            style={{ minHeight: 'auto', padding: '4px 8px' }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h4 
            className="text-footnote font-medium text-primary leading-tight cursor-text hover:bg-gray-50 rounded px-1 py-1 -mx-1"
            onDoubleClick={() => handleEditStart('summary', task.summary)}
            style={{
              textDecoration: task.status === 'completed' ? 'line-through' : 'none',
              opacity: task.status === 'completed' ? 0.7 : 1
            }}
          >
            {task.summary}
          </h4>
        )}
      </div>

      {/* Task Description Preview */}
      {task.description && !isEditing && (
        <div className="mb-3">
          <p className="text-caption-1 text-secondary line-clamp-2 leading-tight">
            {task.description}
          </p>
        </div>
      )}

      {/* Task Meta Information */}
      <div className="flex items-center justify-between text-caption-2 text-tertiary">
        <div className="flex items-center space-x-3">
          {/* Assignee */}
          {task.assignee_email && (
            <div className="flex items-center space-x-1" title={`Assigned to: ${task.assignee_full_name || task.assignee_email}`}>
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                <span className="leading-none">
                  {(task.assignee_full_name || task.assignee_email).charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex space-x-1">
              {task.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 rounded text-xs"
                  style={{ fontSize: '10px' }}
                >
                  {tag}
                </span>
              ))}
              {task.tags.length > 2 && (
                <span className="text-xs text-tertiary">
                  +{task.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Due Date */}
        {dueDate && (
          <div 
            className={`text-xs ${dueDate.isOverdue ? 'text-red-600' : 'text-tertiary'}`}
            title={`Due: ${dueDate.formatted}`}
          >
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{dueDate.formatted}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskCard
