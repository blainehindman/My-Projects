import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const TaskConfigModal = ({ isOpen, onClose, projectId, onConfigUpdated }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('workflow')
  const [config, setConfig] = useState({
    statuses: [],
    priorities: [],
    estimations: [],
    healths: [],
    sections: []
  })
  const [sections, setSections] = useState([])

  // Tab configuration
  const tabs = [
    { 
      id: 'workflow', 
      name: 'Workflow', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ), 
      description: 'Statuses & Priorities'
    },
    { 
      id: 'planning', 
      name: 'Planning', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ), 
      description: 'Estimations & Health'
    },
    { 
      id: 'structure', 
      name: 'Structure', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5m14 14H5" />
        </svg>
      ), 
      description: 'Board Sections'
    }
  ]

  // Load current configuration
  useEffect(() => {
    if (isOpen && projectId) {
      loadConfig()
    }
  }, [isOpen, projectId])

  const loadConfig = async () => {
    try {
      setLoading(true)
      
      // Load JSON config
      const { data: configData, error: configError } = await supabase
        .rpc('get_project_task_config', { p_project_id: projectId })

      if (configError) throw configError
      
      // Load sections from task_sections table
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('task_sections')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order')

      if (sectionsError) throw sectionsError

      setConfig(configData || getDefaultConfig())
      setSections(sectionsData || [])
    } catch (err) {
      console.error('Error loading task config:', err)
      setConfig(getDefaultConfig())
      setSections([])
    } finally {
      setLoading(false)
    }
  }

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
    ]
  })

  // Handle configuration updates
  const handleAddStatus = () => {
    const newStatus = {
      id: `status_${Date.now()}`,
      name: 'New Status',
      color: '#007AFF',
      order: config.statuses.length
    }
    setConfig(prev => ({
      ...prev,
      statuses: [...prev.statuses, newStatus]
    }))
  }

  const handleAddPriority = () => {
    const newPriority = {
      id: `priority_${Date.now()}`,
      name: 'New Priority',
      color: '#007AFF',
      order: config.priorities.length
    }
    setConfig(prev => ({
      ...prev,
      priorities: [...prev.priorities, newPriority]
    }))
  }

  const handleAddEstimation = () => {
    const newEstimation = {
      id: `estimation_${Date.now()}`,
      name: 'New Estimation',
      color: '#007AFF',
      order: config.estimations.length
    }
    setConfig(prev => ({
      ...prev,
      estimations: [...prev.estimations, newEstimation]
    }))
  }

  const handleAddHealth = () => {
    const newHealth = {
      id: `health_${Date.now()}`,
      name: 'New Health',
      color: '#007AFF',
      order: config.healths.length
    }
    setConfig(prev => ({
      ...prev,
      healths: [...prev.healths, newHealth]
    }))
  }

  const handleUpdateStatus = (index, field, value) => {
    setConfig(prev => ({
      ...prev,
      statuses: prev.statuses.map((status, i) => 
        i === index ? { ...status, [field]: value } : status
      )
    }))
  }

  const handleUpdatePriority = (index, field, value) => {
    setConfig(prev => ({
      ...prev,
      priorities: prev.priorities.map((priority, i) => 
        i === index ? { ...priority, [field]: value } : priority
      )
    }))
  }

  const handleDeleteStatus = (index) => {
    if (config.statuses.length <= 1) {
      alert('You must have at least one status')
      return
    }
    setConfig(prev => ({
      ...prev,
      statuses: prev.statuses.filter((_, i) => i !== index)
    }))
  }

  const handleDeletePriority = (index) => {
    if (config.priorities.length <= 1) {
      alert('You must have at least one priority')
      return
    }
    setConfig(prev => ({
      ...prev,
      priorities: prev.priorities.filter((_, i) => i !== index)
    }))
  }

  const handleUpdateEstimation = (index, field, value) => {
    setConfig(prev => ({
      ...prev,
      estimations: prev.estimations.map((estimation, i) => 
        i === index ? { ...estimation, [field]: value } : estimation
      )
    }))
  }

  const handleDeleteEstimation = (index) => {
    if (config.estimations.length <= 1) {
      alert('You must have at least one estimation')
      return
    }
    setConfig(prev => ({
      ...prev,
      estimations: prev.estimations.filter((_, i) => i !== index)
    }))
  }

  const handleUpdateHealth = (index, field, value) => {
    setConfig(prev => ({
      ...prev,
      healths: prev.healths.map((health, i) => 
        i === index ? { ...health, [field]: value } : health
      )
    }))
  }

  const handleDeleteHealth = (index) => {
    if (config.healths.length <= 1) {
      alert('You must have at least one health status')
      return
    }
    setConfig(prev => ({
      ...prev,
      healths: prev.healths.filter((_, i) => i !== index)
    }))
  }

  // Section management handlers
  const handleAddSection = () => {
    const newSection = {
      id: null, // Will be set by database
      name: 'New Section',
      color: '#007AFF',
      sort_order: sections.length,
      project_id: projectId,
      created_by: user.id
    }
    setSections(prev => [...prev, newSection])
  }

  const handleUpdateSection = (index, field, value) => {
    setSections(prev => 
      prev.map((section, i) => 
        i === index ? { ...section, [field]: value } : section
      )
    )
  }

  const handleDeleteSection = (index) => {
    if (sections.length <= 1) {
      alert('You must have at least one section')
      return
    }
    setSections(prev => prev.filter((_, i) => i !== index))
  }

  // Save configuration
  const handleSave = async () => {
    try {
      setLoading(true)
      setError('')

      // Save JSON config (statuses and priorities)
      const { error: configError } = await supabase
        .rpc('update_project_task_config', { 
          p_project_id: projectId, 
          p_config: config 
        })

      if (configError) throw configError

      // Save sections to task_sections table
      await saveSections()

      if (onConfigUpdated) {
        onConfigUpdated(config)
      }
      
      onClose()
    } catch (err) {
      console.error('Error saving config:', err)
      setError('Failed to save configuration')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to save sections
  const saveSections = async () => {
    // Get existing sections from database
    const { data: existingSections, error: fetchError } = await supabase
      .from('task_sections')
      .select('id')
      .eq('project_id', projectId)

    if (fetchError) throw fetchError

    const existingIds = existingSections.map(s => s.id)
    const sectionsToUpdate = sections.filter(s => s.id && existingIds.includes(s.id))
    const sectionsToCreate = sections.filter(s => !s.id || !existingIds.includes(s.id))
    const sectionsToDelete = existingIds.filter(id => !sections.find(s => s.id === id))

    // Delete removed sections
    if (sectionsToDelete.length > 0) {
      // First move tasks from deleted sections to the first remaining section that exists
      const firstExistingSection = sections.find(s => s.id && existingIds.includes(s.id))
      if (firstExistingSection) {
        for (const sectionId of sectionsToDelete) {
          await supabase
            .from('tasks')
            .update({ section_id: firstExistingSection.id })
            .eq('section_id', sectionId)
        }
      }

      // Then delete the sections
      const { error: deleteError } = await supabase
        .from('task_sections')
        .delete()
        .in('id', sectionsToDelete)

      if (deleteError) throw deleteError
    }

    // Update existing sections
    for (const section of sectionsToUpdate) {
      const { error: updateError } = await supabase
        .from('task_sections')
        .update({
          name: section.name,
          color: section.color,
          sort_order: section.sort_order
        })
        .eq('id', section.id)

      if (updateError) throw updateError
    }

    // Create new sections
    for (const section of sectionsToCreate) {
      const { error: createError } = await supabase
        .from('task_sections')
        .insert({
          project_id: projectId,
          name: section.name,
          color: section.color,
          sort_order: section.sort_order,
          created_by: user.id
        })

      if (createError) throw createError
    }
  }

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'workflow':
        return (
          <div className="space-y-8">
            {/* Statuses Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-title-3 text-primary">Task Statuses</h3>
                <button
                  onClick={handleAddStatus}
                  className="btn-tinted btn-compact focus-visible"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Status
                </button>
              </div>
              
              <div className="space-y-4">
                {config.statuses.map((status, index) => (
                  <div key={`${status.id}-${index}`} className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Color Picker */}
                      <div className="col-span-1">
                        <input
                          type="color"
                          value={status.color}
                          onChange={(e) => handleUpdateStatus(index, 'color', e.target.value)}
                          className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
                          title="Choose color"
                        />
                      </div>
                      
                      {/* Name Input */}
                      <div className="col-span-5">
                        <label className="block text-caption-1 text-tertiary mb-1">Name</label>
                        <input
                          type="text"
                          value={status.name}
                          onChange={(e) => handleUpdateStatus(index, 'name', e.target.value)}
                          className="input-field w-full"
                          placeholder="Status name"
                        />
                      </div>
                      
                      {/* ID Input */}
                      <div className="col-span-5">
                        <label className="block text-caption-1 text-tertiary mb-1">ID (no spaces)</label>
                        <input
                          type="text"
                          value={status.id}
                          onChange={(e) => {
                            // Remove spaces and special characters for clean IDs
                            const cleanId = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                            handleUpdateStatus(index, 'id', cleanId)
                          }}
                          className="input-field w-full"
                          placeholder="status_id"
                        />
                      </div>
                      
                      {/* Delete Button */}
                      <div className="col-span-1">
                        <button
                          onClick={() => handleDeleteStatus(index)}
                          className="btn-plain btn-compact text-red-600 hover:bg-red-50 focus-visible"
                          disabled={config.statuses.length <= 1}
                          title="Delete status"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Priorities Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-title-3 text-primary">Task Priorities</h3>
                <button
                  onClick={handleAddPriority}
                  className="btn-tinted btn-compact focus-visible"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Priority
                </button>
              </div>
              
              <div className="space-y-4">
                {config.priorities.map((priority, index) => (
                  <div key={`${priority.id}-${index}`} className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Color Picker */}
                      <div className="col-span-1">
                        <input
                          type="color"
                          value={priority.color}
                          onChange={(e) => handleUpdatePriority(index, 'color', e.target.value)}
                          className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
                          title="Choose color"
                        />
                      </div>
                      
                      {/* Name Input */}
                      <div className="col-span-5">
                        <label className="block text-caption-1 text-tertiary mb-1">Name</label>
                        <input
                          type="text"
                          value={priority.name}
                          onChange={(e) => handleUpdatePriority(index, 'name', e.target.value)}
                          className="input-field w-full"
                          placeholder="Priority name"
                        />
                      </div>
                      
                      {/* ID Input */}
                      <div className="col-span-5">
                        <label className="block text-caption-1 text-tertiary mb-1">ID (no spaces)</label>
                        <input
                          type="text"
                          value={priority.id}
                          onChange={(e) => {
                            // Remove spaces and special characters for clean IDs
                            const cleanId = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                            handleUpdatePriority(index, 'id', cleanId)
                          }}
                          className="input-field w-full"
                          placeholder="priority_id"
                        />
                      </div>
                      
                      {/* Delete Button */}
                      <div className="col-span-1">
                        <button
                          onClick={() => handleDeletePriority(index)}
                          className="btn-plain btn-compact text-red-600 hover:bg-red-50 focus-visible"
                          disabled={config.priorities.length <= 1}
                          title="Delete priority"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'planning':
        return (
          <div className="space-y-8">
            {/* Estimations Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-title-3 text-primary">Task Estimations</h3>
                <button
                  onClick={handleAddEstimation}
                  className="btn-tinted btn-compact focus-visible"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Estimation
                </button>
              </div>
              
              <div className="space-y-4">
                {config.estimations.map((estimation, index) => (
                  <div key={`${estimation.id}-${index}`} className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Color Picker */}
                      <div className="col-span-1">
                        <input
                          type="color"
                          value={estimation.color}
                          onChange={(e) => handleUpdateEstimation(index, 'color', e.target.value)}
                          className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
                          title="Choose color"
                        />
                      </div>
                      
                      {/* Name Input */}
                      <div className="col-span-5">
                        <label className="block text-caption-1 text-tertiary mb-1">Name</label>
                        <input
                          type="text"
                          value={estimation.name}
                          onChange={(e) => handleUpdateEstimation(index, 'name', e.target.value)}
                          className="input-field w-full"
                          placeholder="Estimation name"
                        />
                      </div>
                      
                      {/* ID Input */}
                      <div className="col-span-5">
                        <label className="block text-caption-1 text-tertiary mb-1">ID (no spaces)</label>
                        <input
                          type="text"
                          value={estimation.id}
                          onChange={(e) => {
                            const cleanId = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                            handleUpdateEstimation(index, 'id', cleanId)
                          }}
                          className="input-field w-full"
                          placeholder="estimation_id"
                        />
                      </div>
                      
                      {/* Delete Button */}
                      <div className="col-span-1">
                        <button
                          onClick={() => handleDeleteEstimation(index)}
                          className="btn-plain btn-compact text-red-600 hover:bg-red-50 focus-visible"
                          disabled={config.estimations.length <= 1}
                          title="Delete estimation"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Health Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-title-3 text-primary">Task Health</h3>
                <button
                  onClick={handleAddHealth}
                  className="btn-tinted btn-compact focus-visible"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Health Status
                </button>
              </div>
              
              <div className="space-y-4">
                {config.healths.map((health, index) => (
                  <div key={`${health.id}-${index}`} className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Color Picker */}
                      <div className="col-span-1">
                        <input
                          type="color"
                          value={health.color}
                          onChange={(e) => handleUpdateHealth(index, 'color', e.target.value)}
                          className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
                          title="Choose color"
                        />
                      </div>
                      
                      {/* Name Input */}
                      <div className="col-span-5">
                        <label className="block text-caption-1 text-tertiary mb-1">Name</label>
                        <input
                          type="text"
                          value={health.name}
                          onChange={(e) => handleUpdateHealth(index, 'name', e.target.value)}
                          className="input-field w-full"
                          placeholder="Health status name"
                        />
                      </div>
                      
                      {/* ID Input */}
                      <div className="col-span-5">
                        <label className="block text-caption-1 text-tertiary mb-1">ID (no spaces)</label>
                        <input
                          type="text"
                          value={health.id}
                          onChange={(e) => {
                            const cleanId = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                            handleUpdateHealth(index, 'id', cleanId)
                          }}
                          className="input-field w-full"
                          placeholder="health_id"
                        />
                      </div>
                      
                      {/* Delete Button */}
                      <div className="col-span-1">
                        <button
                          onClick={() => handleDeleteHealth(index)}
                          className="btn-plain btn-compact text-red-600 hover:bg-red-50 focus-visible"
                          disabled={config.healths.length <= 1}
                          title="Delete health status"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'structure':
        return (
          <div className="space-y-8">
            {/* Sections Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-title-3 text-primary">Task Sections</h3>
                <button
                  onClick={handleAddSection}
                  className="btn-tinted btn-compact focus-visible"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Section
                </button>
              </div>
              
              <div className="space-y-4">
                {sections.map((section, index) => (
                  <div key={`section-${section.id || index}`} className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Color Picker */}
                      <div className="col-span-1">
                        <input
                          type="color"
                          value={section.color || '#007AFF'}
                          onChange={(e) => handleUpdateSection(index, 'color', e.target.value)}
                          className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
                          title="Choose color"
                        />
                      </div>
                      
                      {/* Name Input */}
                      <div className="col-span-10">
                        <label className="block text-caption-1 text-tertiary mb-1">Section Name</label>
                        <input
                          type="text"
                          value={section.name}
                          onChange={(e) => handleUpdateSection(index, 'name', e.target.value)}
                          className="input-field w-full"
                          placeholder="Section name"
                        />
                      </div>
                      
                      {/* Delete Button */}
                      <div className="col-span-1">
                        <button
                          onClick={() => handleDeleteSection(index)}
                          className="btn-plain btn-compact text-red-600 hover:bg-red-50 focus-visible"
                          disabled={sections.length <= 1}
                          title="Delete section"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return <div>Tab not found</div>;
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

  if (!isOpen) return null

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
              <h2 className="text-title-2 text-primary font-medium">
                Task Configuration
              </h2>
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

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? ''
                        : 'border-transparent text-gray-500 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center space-x-2`}
                    style={activeTab === tab.id ? { 
                      borderBottomColor: '#ff2765', 
                      color: '#ff2765' 
                    } : {}}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab.id) {
                        e.target.closest('button').style.color = 'rgba(255, 39, 101, 0.7)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab.id) {
                        e.target.closest('button').style.color = ''
                      }
                    }}
                  >
                    {tab.icon}
                    <div className="text-left">
                      <div>{tab.name}</div>
                      <div className="text-xs opacity-60">{tab.description}</div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="p-6">
              {error && (
                <div className="mb-6" style={{
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

              {/* Tab Content */}
              <div className="max-h-96 overflow-y-auto">{renderTabContent()}</div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="btn-plain focus-visible"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="btn-filled focus-visible"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TaskConfigModal