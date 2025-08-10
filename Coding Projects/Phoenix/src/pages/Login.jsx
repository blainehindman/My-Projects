import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setError('')
      setLoading(true)
      const { error } = await signIn({ email, password })
      if (error) throw error
      navigate('/dashboard')
    } catch (error) {
      setError('Failed to log in')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center section" style={{backgroundColor: 'var(--color-background-secondary)'}}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-title-1 text-primary font-semibold mb-2">Phoenix</h1>
          <p className="text-body text-secondary">Welcome back to your workspace</p>
        </div>

        <div className="card">
          <h2 className="text-title-2 text-primary mb-6">Sign In</h2>
          
          {error && (
            <div className="mb-4 p-3 text-footnote rounded-lg" style={{backgroundColor: 'rgba(255, 59, 48, 0.1)', color: 'var(--color-system-red)', border: '0.5px solid rgba(255, 59, 48, 0.2)'}}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label htmlFor="email" className="input-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                className="input-field"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="input-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="input-field"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-filled w-full focus-visible"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-subheadline text-secondary">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-link hover:opacity-60">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login 