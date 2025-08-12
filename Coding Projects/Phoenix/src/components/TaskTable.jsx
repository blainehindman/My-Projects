import React from 'react'
import DropdownMenu, { DropdownItem } from './DropdownMenu'

const TaskTable = ({ tasks = [], onEditTask, onDeleteTask, onTaskUpdated, loading = false }) => {

  // Format date display
  const formatDate = (dateString) => {
    if (!dateString) return '-'
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

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="card content-narrow mx-auto">
          <div className="mx-auto h-12 w-12 text-quaternary mb-6">
            <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" strokeWidth="1">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-title-3 text-primary mb-3">No Tasks Yet</h3>
          <p className="text-body text-secondary mb-6">
            Start organizing your project by creating your first task.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{borderBottom: '1px solid var(--color-border-primary)'}}>
              <th className="text-left py-3 px-4 text-caption-1 font-medium text-tertiary">
                Task
              </th>
              <th className="text-left py-3 px-4 text-caption-1 font-medium text-tertiary">
                Assignee
              </th>
              <th className="text-left py-3 px-4 text-caption-1 font-medium text-tertiary">
                Due Date
              </th>
              <th className="text-left py-3 px-4 text-caption-1 font-medium text-tertiary">
                Created
              </th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, index) => {
              const dueDate = formatDate(task.due_date)
              const createdDate = formatDate(task.created_at)
              
              return (
                <tr 
                  key={task.id}
                  className="hover:bg-background-secondary transition-colors cursor-pointer"
                  style={{
                    borderBottom: index < tasks.length - 1 ? '1px solid var(--color-border-secondary)' : 'none'
                  }}
                  onClick={() => onEditTask(task)}
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

                  {/* Assignee */}
                  <td className="py-3 px-4">
                    <div className="text-footnote text-primary">
                      {task.assignee_user?.email ? formatUser(task.assignee_user.email) : '-'}
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
                        <span className="ml-1 text-caption-2" style={{color: 'var(--color-system-red)'}}>
                          (overdue)
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Created Date */}
                  <td className="py-3 px-4">
                    <div className="text-footnote text-tertiary">
                      {createdDate.formatted}
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
                      <DropdownItem onClick={() => onEditTask(task)}>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Task
                        </div>
                      </DropdownItem>
                      <DropdownItem 
                        onClick={() => onDeleteTask(task)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <div className="flex items-center" style={{color: 'var(--color-system-red)'}}>
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
    </div>
  )
}

export default TaskTable 