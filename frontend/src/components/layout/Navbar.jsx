import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

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

        {/* Right side — avatar chip + sign out */}
        <div className="flex items-center gap-3">

          {/* User chip */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-full pl-1 pr-3 py-1">
            {/* Avatar circle */}
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {profile?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold text-gray-800 leading-none">
                {profile?.name || profile?.email || '—'}
              </p>
              {profile?.role && profile.role !== 'student' && (
                <p className="text-xs text-purple-500 font-medium leading-none mt-0.5">
                  {profile.role}
                </p>
              )}
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium"
          >
            Sign out
          </button>

        </div>
      </div>
    </nav>
  )
}