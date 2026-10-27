import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  // Highlight the active link
  function isActive(path) {
    return location.pathname === path
  }

  const linkClass = (path) =>
    `text-sm px-3 py-1.5 rounded-lg transition-colors ${
      isActive(path)
        ? 'bg-blue-50 text-blue-600 font-medium'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`

  // Don't show navbar on the login page
  if (!user) return null

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="font-bold text-gray-800 text-base hover:text-blue-600 transition-colors"
        >
          🏫 NITJ Lost &amp; Found
        </button>

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-1">
          <button onClick={() => navigate('/')} className={linkClass('/')}>
            Home
          </button>
          <button onClick={() => navigate('/dashboard')} className={linkClass('/dashboard')}>
            My Dashboard
          </button>
          <button onClick={() => navigate('/report-lost')} className={linkClass('/report-lost')}>
            Report Lost
          </button>
          <button onClick={() => navigate('/report-found')} className={linkClass('/report-found')}>
            Report Found
          </button>
          {profile?.role === 'admin' && (
            <button onClick={() => navigate('/admin')} className={linkClass('/admin')}>
              Admin
            </button>
          )}
        </div>

        {/* Right side — user info + logout */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {profile?.name || profile?.email}
            {profile?.role !== 'student' && (
              <span className="ml-1.5 bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded text-xs font-medium">
                {profile.role}
              </span>
            )}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden text-gray-600 hover:text-gray-900"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-100 px-6 py-3 space-y-1 bg-white">
          <button onClick={() => { navigate('/'); setMenuOpen(false) }} className={`block w-full text-left ${linkClass('/')}`}>
            Home
          </button>
          <button onClick={() => { navigate('/dashboard'); setMenuOpen(false) }} className={`block w-full text-left ${linkClass('/dashboard')}`}>
            My Dashboard
          </button>
          <button onClick={() => { navigate('/report-lost'); setMenuOpen(false) }} className={`block w-full text-left ${linkClass('/report-lost')}`}>
            Report Lost
          </button>
          <button onClick={() => { navigate('/report-found'); setMenuOpen(false) }} className={`block w-full text-left ${linkClass('/report-found')}`}>
            Report Found
          </button>
          {profile?.role === 'admin' && (
            <button onClick={() => { navigate('/admin'); setMenuOpen(false) }} className={`block w-full text-left ${linkClass('/admin')}`}>
              Admin
            </button>
          )}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">{profile?.name}</span>
            <button onClick={handleLogout} className="text-sm text-red-500">Sign out</button>
          </div>
        </div>
      )}
    </nav>
  )
}