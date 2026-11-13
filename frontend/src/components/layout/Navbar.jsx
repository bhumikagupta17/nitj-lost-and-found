import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { NotificationsBell } from '../NotificationsBell'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (!user) return null

  return (
    <nav
      className="sticky top-0 z-50 shadow-lg"
      style={{ background: 'linear-gradient(135deg, #0D3B6E 0%, #1565A7 60%, #1976D2 100%)' }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">

        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 sm:gap-3 shrink-0 active:opacity-80"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 border border-white/20"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          >
            🏫
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-bold leading-tight tracking-wide text-white drop-shadow-sm">
              NITJ Lost &amp; Found
            </p>
            <p className="text-[11px] leading-tight" style={{ color: '#93C6F0' }}>
              Dr B.R. Ambedkar NIT Jalandhar
            </p>
          </div>
          <p className="text-sm font-bold sm:hidden text-white">NITJ L&F</p>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Live badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border border-white/20"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#BFDBFE' }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-300" />
            </span>
            Live on campus
          </div>

          {/* Lost Items link */}
          <button
            onClick={() => navigate('/lost-items')}
            className="hidden sm:flex items-center gap-1 text-xs font-medium hover:text-white transition-colors active:scale-95"
            style={{ color: '#BFDBFE' }}
          >
            😟 Lost Items
          </button>

          {/* Report item — white pill */}
          <button
            onClick={() => navigate('/report-found')}
            className="flex items-center gap-1 sm:gap-1.5 font-semibold rounded-full hover:bg-opacity-90 active:scale-95 transition-all shrink-0 shadow-sm"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#1565A7',
              fontSize: '12px',
              paddingLeft: '12px',
              paddingRight: '12px',
              paddingTop: '7px',
              paddingBottom: '7px',
            }}
          >
            <span className="text-base leading-none">+</span>
            <span className="hidden sm:inline">Report item</span>
          </button>

          <NotificationsBell />

          {/* Avatar */}
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 active:scale-95 border border-white/30"
            style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: '#FFFFFF' }}
            title={profile?.name || 'Dashboard'}
            onClick={() => navigate('/dashboard')}
          >
            {profile?.name?.charAt(0)?.toUpperCase() || '?'}
          </button>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs font-medium active:scale-95 hover:text-white transition-colors"
            style={{ color: '#93C6F0' }}
            title="Sign out"
          >
            <span className="sm:hidden text-base leading-none">↪</span>
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </nav>
  )
}