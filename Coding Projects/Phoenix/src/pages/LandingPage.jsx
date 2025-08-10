import React from 'react'
import { Link } from 'react-router-dom'

const LandingPage = () => {
  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--color-background-primary)'}}>
      {/* Header */}
      <header style={{height: '44px', borderBottom: '1px solid var(--color-border-primary)', position: 'relative', zIndex: 10, backgroundColor: 'var(--color-background-primary)', display: 'flex', alignItems: 'center'}}>
        <div className="container" style={{height: '100%'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%'}}>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <h1 className="text-headline text-primary font-semibold">Phoenix</h1>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <Link to="/login" className="btn-plain btn-compact focus-visible">
                Sign In
              </Link>
              <Link to="/signup" className="btn-filled btn-compact focus-visible">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{padding: '80px 0 64px 0'}}>
        <div className="content-max text-center">
          <h1 className="text-large-title mb-6" style={{fontWeight: '700'}}>
            CRM & Project Management
            <span className="block mt-2" style={{color: 'var(--color-system-blue)'}}>Built for Modern Workspaces</span>
          </h1>
          <p className="text-body text-secondary content-narrow mx-auto" style={{marginBottom: '48px'}}>
            Phoenix organizes your business into workspaces, then breaks down projects with integrated CRM. 
            Manage contacts, companies, and project workflows in one unified platform designed for productivity.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup" className="btn-filled btn-large focus-visible">
              Start Free Trial
            </Link>
            <button className="btn-tinted btn-large focus-visible">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{backgroundColor: 'var(--color-background-secondary)', padding: '64px 0'}}>
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-title-1 mb-3" style={{fontWeight: '600'}}>
              Everything Your Business Needs
            </h2>
            <p className="text-body text-secondary content-narrow mx-auto">
              From workspace organization to customer relationship management, 
              Phoenix scales with your business and grows with your workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card-interactive text-center">
              <div className="w-12 h-12 rounded-md flex items-center justify-center mx-auto mb-4" style={{backgroundColor: 'var(--color-system-blue)'}}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-headline mb-2">Workspace Organization</h3>
              <p className="text-subheadline text-secondary">
                Create dedicated workspaces for different business units, departments, or client groups with clear boundaries and access control.
              </p>
            </div>

            <div className="card-interactive text-center">
              <div className="w-12 h-12 rounded-md flex items-center justify-center mx-auto mb-4" style={{backgroundColor: 'var(--color-system-orange)'}}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-headline mb-2">Smart Project Structure</h3>
              <p className="text-subheadline text-secondary">
                Projects with milestones, tasks, and deadlines. Each project connects to your CRM data for complete client context.
              </p>
            </div>

            <div className="card-interactive text-center">
              <div className="w-12 h-12 rounded-md flex items-center justify-center mx-auto mb-4" style={{backgroundColor: 'var(--color-system-green)'}}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 915 0z" />
                </svg>
              </div>
              <h3 className="text-headline mb-2">Integrated CRM</h3>
              <p className="text-subheadline text-secondary">
                Contact and company management built into every project. Track relationships, communication history, and business opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Structure Section */}
      <section style={{padding: '64px 0'}}>
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-title-1 mb-3" style={{fontWeight: '600'}}>
              Intuitive Business Structure
            </h2>
            <p className="text-body text-secondary content-narrow mx-auto">
              Our thoughtful hierarchy mirrors how your business actually works, keeping everything organized while remaining flexible.
            </p>
          </div>

          <div className="card content-max mx-auto">
            <div className="space-y-5">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-md flex items-center justify-center text-white font-semibold text-footnote mr-4 flex-shrink-0" style={{backgroundColor: 'var(--color-system-blue)'}}>
                  1
                </div>
                <div>
                  <h3 className="text-headline mb-1">Workspaces</h3>
                  <p className="text-subheadline text-secondary">Separate environments for different business units, clients, or departments</p>
                </div>
              </div>
              
              <div className="flex items-center ml-6">
                <div className="w-8 h-8 rounded-md flex items-center justify-center text-white font-semibold text-footnote mr-4 flex-shrink-0" style={{backgroundColor: 'var(--color-system-orange)'}}>
                  2
                </div>
                <div>
                  <h3 className="text-headline mb-1">Projects</h3>
                  <p className="text-subheadline text-secondary">Client work with integrated CRM data, milestones, tasks, and collaboration tools</p>
                </div>
              </div>
              
              <div className="flex items-center ml-12">
                <div className="w-8 h-8 rounded-md flex items-center justify-center text-white font-semibold text-footnote mr-4 flex-shrink-0" style={{backgroundColor: 'var(--color-system-green)'}}>
                  3
                </div>
                <div>
                  <h3 className="text-headline mb-1">CRM Integration</h3>
                  <p className="text-subheadline text-secondary">Contacts and companies linked to projects with communication history and business context</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{backgroundColor: 'var(--color-system-blue)', padding: '64px 0'}}>
        <div className="content-max text-center">
          <h2 className="text-title-1 text-white mb-3" style={{fontWeight: '600'}}>
            Ready to Organize Your Business?
          </h2>
          <p className="text-body mb-6 content-narrow mx-auto" style={{color: 'rgba(255, 255, 255, 0.8)'}}>
            Join growing businesses who've unified their workspace organization, project management, and CRM with Phoenix.
          </p>
          <Link 
            to="/signup" 
            className="inline-flex items-center bg-white px-6 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors focus-visible text-callout"
            style={{color: 'var(--color-system-blue)', fontWeight: '500'}}
          >
            Start Your Free Trial
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{borderTop: '1px solid var(--color-border-primary)', padding: '24px 0'}}>
        <div className="container">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <h3 className="text-callout font-semibold text-primary">Phoenix</h3>
              <span className="text-footnote text-secondary">
                © 2024 Phoenix Workspace & CRM Platform
              </span>
            </div>
            <div className="flex space-x-6 text-footnote text-secondary">
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-primary transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage 