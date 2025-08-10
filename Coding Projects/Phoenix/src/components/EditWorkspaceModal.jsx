import React, { useState, useEffect } from 'react'
import Modal from './Modal'
import { supabase } from '../lib/supabase'

const EditWorkspaceModal = ({ isOpen, onClose, workspace, onWorkspaceUpdated }) => {
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceDescription, setWorkspaceDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && workspace) {
      setWorkspaceName(workspace.name || '')
      setWorkspaceDescription(workspace.description || '')
      setError('')
    }
  }, [isOpen, workspace])

  // Reset form when modal closes
  const handleClose = () => {
    setWorkspaceName('')
    setWorkspaceDescription('')
    setError('')
    setLoading(false)
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!workspaceName.trim()) {
      setError('Workspace name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .update({
          name: workspaceName.trim(),
          description: workspaceDescription.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', workspace.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Call the callback to refresh the workspace data
      if (onWorkspaceUpdated) {
        onWorkspaceUpdated(data)
      }

      handleClose()
    } catch (error) {
      console.error('Error updating workspace:', error)
      setError(error.message || 'Failed to update workspace')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Workspace"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="form-group">
          <label htmlFor="editWorkspaceName" className="input-label">
            Workspace Name
          </label>
          <input
            id="editWorkspaceName"
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="input-field"
            placeholder="Enter workspace name"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="editWorkspaceDescription" className="input-label">
            Description (Optional)
          </label>
          <textarea
            id="editWorkspaceDescription"
            value={workspaceDescription}
            onChange={(e) => setWorkspaceDescription(e.target.value)}
            className="input-field resize-none"
            placeholder="Describe what this workspace is for..."
            disabled={loading}
            style={{
              height: '80px',
              paddingTop: '12px',
              paddingBottom: '12px',
              overflowY: 'auto'
            }}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="btn-plain flex-1 focus-visible"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-filled flex-1 focus-visible"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default EditWorkspaceModal 