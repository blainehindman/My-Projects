import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const Signup = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const generateSlug = (name) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .trim()
    
    // Ensure we have a valid slug (fallback if empty)
    return slug || 'organization'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password || !organizationName) {
      setError('Please fill in all fields')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Step 1: Sign up the user
      const { data: authData, error: authError } = await signUp({ email, password })
      
      if (authError) {
        throw authError
      }

      if (authData?.user) {
        // Step 2: Create organization, membership, and workspace using database function
        // This works even for unconfirmed users because the function has elevated privileges
        const orgSlug = generateSlug(organizationName)
        
        const { data: orgResult, error: orgError } = await supabase
          .rpc('create_organization_for_user', {
            p_user_id: authData.user.id,
            p_organization_name: organizationName,
            p_organization_slug: orgSlug
          })

        if (orgError) {
          console.error('Organization creation error:', orgError)
          console.error('Error details:', JSON.stringify(orgError, null, 2))
          throw new Error(`Failed to create organization: ${orgError.message || JSON.stringify(orgError)}`)
        }

        if (orgResult && !orgResult.success) {
          console.error('Organization creation failed:', orgResult.error)
          throw new Error(`Failed to create organization: ${orgResult.error}`)
        }

        console.log('Organization created successfully:', orgResult)

        // Check if email confirmation is required
        if (!authData.session) {
          // User needs to confirm email - show confirmation message
          // But organization is already created!
          console.log('User created with organization, but needs email confirmation')
          setShowConfirmation(true)
          return
        }

        // User is immediately authenticated - redirect to dashboard
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Signup error:', error)
      setError(error.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: 'var(--color-background-secondary)'}}>
        <div className="content-narrow">
          <div className="card text-center">
            <div className="mx-auto h-12 w-12 text-success mb-6">
              <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-8.25a2.25 2.25 0 01-2.25-2.25V6.75a2.25 2.25 0 012.25-2.25h8.25a2.25 2.25 0 012.25 2.25z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M39 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-8.25a2.25 2.25 0 01-2.25-2.25V6.75a2.25 2.25 0 012.25-2.25h8.25A2.25 2.25 0 0139 6.75z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 28.5v10.5a2.25 2.25 0 01-2.25 2.25h-8.25a2.25 2.25 0 01-2.25-2.25V28.5a2.25 2.25 0 012.25-2.25h8.25a2.25 2.25 0 012.25 2.25z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M39 28.5v10.5a2.25 2.25 0 01-2.25 2.25h-8.25a2.25 2.25 0 01-2.25-2.25V28.5a2.25 2.25 0 012.25-2.25h8.25A2.25 2.25 0 0139 28.5z" />
              </svg>
            </div>
            <h1 className="text-title-2 text-primary mb-3">Check Your Email</h1>
            <p className="text-body text-secondary mb-6">
              We've sent a confirmation link to <strong>{email}</strong>
            </p>
            <p className="text-subheadline text-tertiary mb-6">
              Please check your email and click the confirmation link to activate your account and access your <strong>{organizationName}</strong> workspace.
            </p>
            <div style={{backgroundColor: 'var(--color-background-secondary)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius)', marginBottom: 'var(--spacing-6)'}}>
              <p className="text-footnote text-quaternary">
                <strong>Note:</strong> Check your spam folder if you don't see the email within a few minutes.
              </p>
            </div>
            <Link to="/login" className="btn-filled focus-visible">
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: 'var(--color-background-secondary)'}}>
      <div className="content-narrow">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-title-2 text-primary mb-2">Create Your Account</h1>
            <p className="text-subheadline text-secondary">
              Start organizing your business with Phoenix
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div style={{backgroundColor: 'rgba(255, 59, 48, 0.1)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius)', border: '1px solid rgba(255, 59, 48, 0.2)'}}>
                <p className="text-footnote" style={{color: 'var(--color-system-red)'}}>
                  {error}
                </p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="organizationName" className="input-label">
                Organization Name
              </label>
              <input
                id="organizationName"
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="input-field"
                placeholder="Your Company Name"
                required
              />
              <p className="input-help">
                This will be the name of your organization and main workspace
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="input-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="input-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="At least 6 characters"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-filled w-full focus-visible"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-footnote text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup 