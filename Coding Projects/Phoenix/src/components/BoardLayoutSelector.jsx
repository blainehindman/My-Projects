import React from 'react'

const BoardLayoutSelector = ({ currentLayout, onLayoutChange, taskConfig }) => {
  const layouts = [
    {
      id: 'sections',
      name: 'Sections',
      description: 'Group by custom sections',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5m14 14H5" />
        </svg>
      )
    },
    {
      id: 'statuses',
      name: 'Status',
      description: 'Group by task status',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'priorities',
      name: 'Priority',
      description: 'Group by task priority',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      )
    },
    {
      id: 'estimations',
      name: 'Estimation',
      description: 'Group by task estimation',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'healths',
      name: 'Health',
      description: 'Group by task health',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    }
  ]

  // Filter out layouts that have no configuration data
  const availableLayouts = layouts.filter(layout => {
    if (layout.id === 'sections') return true // Sections are always available
    if (layout.id === 'statuses') return taskConfig?.statuses?.length > 0
    if (layout.id === 'priorities') return taskConfig?.priorities?.length > 0
    if (layout.id === 'estimations') return taskConfig?.estimations?.length > 0
    if (layout.id === 'healths') return taskConfig?.healths?.length > 0
    return false
  })

  return (
    <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-1">
      <span className="text-caption-1 text-tertiary px-2">View:</span>
      {availableLayouts.map((layout) => (
        <button
          key={layout.id}
          onClick={() => onLayoutChange(layout.id)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 border ${
            currentLayout === layout.id
              ? 'bg-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-transparent'
          }`}
          style={currentLayout === layout.id ? {
            color: '#ff2765',
            borderColor: '#ff2765'
          } : {}}
          title={layout.description}
        >
          {layout.icon}
          <span>{layout.name}</span>
        </button>
      ))}
    </div>
  )
}

export default BoardLayoutSelector
