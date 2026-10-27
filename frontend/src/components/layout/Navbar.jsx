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
    <nav className="sticky top-0 z-50 border-b border-[#E8E2D8]" style={{ backgroundColor: '#F5F0E8' }}>
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 shrink-0 group"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
            style={{ backgroundColor: '#1C3829' }}
          >
            🏫
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-bold leading-tight" style={{ color: '#1C3829' }}>
              NITJ Lost &amp; Found
            </p>
            <p className="text-[12px] leading-tight" style={{ color: '#7A8C7E' }}>
              Dr B.R. Ambedkar NIT Jalandhar · campus board
            </p>
          </div>
          {/* Mobile: just the name */}
          <p className="text-sm font-bold sm:hidden" style={{ color: '#1C3829' }}>
            NITJ L&amp;F
          </p>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Live badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-white border border-[#E8E2D8] rounded-full px-3 py-1.5 text-xs font-medium" style={{ color: '#2D6A4F' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: '#52B788' }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: '#52B788' }} />
            </span>
            Live on campus
          </div>

          {/* Report item button */}
          <button
            onClick={() => navigate('/report-found')}
            className="flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-2 rounded-full transition-opacity hover:opacity-90 shrink-0"
            style={{ backgroundColor: '#1C3829' }}
          >
            <span className="text-base leading-none">+</span>
            <span className="hidden sm:inline">Report item</span>
          </button>

          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 cursor-pointer"
            style={{ backgroundColor: '#1C3829' }}
            title={profile?.name || ''}
            onClick={() => navigate('/dashboard')}
          >
            {profile?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="text-xs font-medium transition-colors hidden sm:block"
            style={{ color: '#9CA3AF' }}
            onMouseEnter={e => e.target.style.color = '#DC2626'}
            onMouseLeave={e => e.target.style.color = '#9CA3AF'}
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}