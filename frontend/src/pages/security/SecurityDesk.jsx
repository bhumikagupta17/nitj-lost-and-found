import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

function AccessDenied() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0E8' }}>
      <div className="text-center">
        <p className="text-5xl mb-4">🚫</p>
        <h2 className="text-lg font-semibold mb-1" style={{ color: '#374151' }}>Access Denied</h2>
        <p className="text-sm mb-4" style={{ color: '#9CA3AF' }}>This page is only for security personnel.</p>
        <button onClick={() => navigate('/')} className="text-sm hover:underline" style={{ color: '#1C3829' }}>
          Go to Home
        </button>
      </div>
    </div>
  )
}

function daysSince(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ItemCard({ item, onStore, onReturn, actionLoading }) {
  const navigate = useNavigate()
  const days = daysSince(item.created_at)
  const isStored = item.status === 'stored'

  return (
    <div className="bg-white rounded-2xl border p-4 hover:shadow-sm transition-all" style={{ borderColor: '#E8E2D8' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: '#F5F0E8', color: '#374151' }}>
            {item.category}
          </span>
          {isStored ? (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: '#EEF9F4', color: '#2D6A4F' }}>📦 Stored</span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: '#FFF7ED', color: '#C2410C' }}>⚠️ Escalated</span>
          )}
        </div>
        <span className="text-xs" style={{ color: '#9CA3AF' }}>{days}d ago</span>
      </div>

      <h3 className="font-semibold text-sm mb-1" style={{ color: '#1C2B1E' }}>{item.title}</h3>
      {item.description && (
        <p className="text-xs mb-2 line-clamp-2" style={{ color: '#9CA3AF' }}>{item.description}</p>
      )}

      <div className="h-px my-2" style={{ backgroundColor: '#E8E2D8' }} />
      <div className="flex items-center justify-between text-xs mb-3" style={{ color: '#9CA3AF' }}>
        <span>📍 {item.location}</span>
        <span>Found {formatDate(item.created_at)}</span>
      </div>

      {item.users && (
        <div className="text-xs px-3 py-2 rounded-xl mb-3" style={{ backgroundColor: '#F5F0E8' }}>
          <span className="font-medium" style={{ color: '#374151' }}>Reported by: </span>
          <span style={{ color: '#6B7280' }}>
            {item.users.name}{item.users.department && ` · ${item.users.department}`}
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => navigate(`/item/${item.id}`)}
          className="flex-1 text-xs rounded-xl py-2 border hover:opacity-70 transition-opacity"
          style={{ borderColor: '#E8E2D8', color: '#374151' }}>
          View Details →
        </button>
        {!isStored ? (
          <button onClick={() => onStore(item.id)} disabled={actionLoading === item.id}
            className="flex-1 text-xs text-white rounded-xl py-2 hover:opacity-90 disabled:opacity-50 font-medium"
            style={{ backgroundColor: '#1C3829' }}>
            {actionLoading === item.id ? 'Saving...' : '📦 Mark Stored'}
          </button>
        ) : (
          <button onClick={() => onReturn(item.id)} disabled={actionLoading === item.id}
            className="flex-1 text-xs text-white rounded-xl py-2 hover:opacity-90 disabled:opacity-50 font-medium"
            style={{ backgroundColor: '#2D6A4F' }}>
            {actionLoading === item.id ? 'Saving...' : '✅ Mark Returned'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function SecurityDesk() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()

  const [tab, setTab] = useState('escalated')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [error, setError] = useState('')

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center text-sm" style={{ backgroundColor: '#F5F0E8', color: '#9CA3AF' }}>
      Loading...
    </div>
  )
  if (!user || (profile?.role !== 'security' && profile?.role !== 'admin')) return <AccessDenied />

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { fetchItems() }, [tab])

  async function fetchItems() {
    setLoading(true)
    setError('')
    const status = tab === 'escalated' ? 'escalated' : 'stored'
    const { data, error: err } = await supabase
      .from('found_items').select('*, users(name, department)')
      .eq('status', status).order('created_at', { ascending: true })
    if (err) setError(err.message)
    else setItems(data || [])
    setLoading(false)
  }

  async function handleStore(itemId) {
    setActionLoading(itemId)
    const { error: err } = await supabase.from('found_items').update({ status: 'stored' }).eq('id', itemId)
    if (err) setError(err.message)
    else setItems(prev => prev.filter(i => i.id !== itemId))
    setActionLoading(null)
  }

  async function handleReturn(itemId) {
    setActionLoading(itemId)
    const { error: err } = await supabase.from('found_items').update({ status: 'closed' }).eq('id', itemId)
    if (err) setError(err.message)
    else setItems(prev => prev.filter(i => i.id !== itemId))
    setActionLoading(null)
  }

  const tabs = [
    { key: 'escalated', label: '⚠️ Escalated', desc: 'Unclaimed 7+ days' },
    { key: 'stored',    label: '📦 In Storage', desc: 'Physically with you' },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>

      {/* Header */}
      <div className="bg-white border-b px-6 py-4" style={{ borderColor: '#E8E2D8' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#1C2B1E', fontFamily: "'Lora','Georgia',serif" }}>
              🚨 Security Desk
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              Manage escalated items and items in physical storage.
            </p>
          </div>
          <button onClick={() => navigate('/')} className="text-sm hover:opacity-70"
            style={{ color: '#6B7280' }}>← Home</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">

        {/* Stats */}
        <StatsRow />

        {/* Tab bar */}
        <div className="flex gap-1 rounded-2xl p-1 my-5 w-fit" style={{ backgroundColor: '#E8E2D8' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={tab === t.key
                ? { backgroundColor: '#FFFFFF', color: '#1C2B1E', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                : { color: '#6B7280' }
              }>
              {t.label}
              <span className="ml-1 text-xs hidden sm:inline" style={{ color: '#9CA3AF' }}>
                — {t.desc}
              </span>
            </button>
          ))}
        </div>

        {/* Info box */}
        {tab === 'escalated' && (
          <div className="rounded-2xl px-4 py-3 mb-5 text-xs" style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', color: '#C2410C' }}>
            <strong>What is this?</strong> Items posted but nobody claimed for 7+ days are escalated here.
            Once you physically collect an item, click <strong>Mark Stored</strong> to track it.
            When the owner picks it up, click <strong>Mark Returned</strong> to close the record.
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-4">{error}</div>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-20 text-sm" style={{ color: '#9CA3AF' }}>Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">{tab === 'escalated' ? '✅' : '📭'}</p>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              {tab === 'escalated' ? 'No escalated items right now.' : 'Nothing in storage right now.'}
            </p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
              {tab === 'escalated'
                ? 'All posted items have been claimed or closed.'
                : 'Items you mark as stored will appear here.'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
              {items.length} item{items.length !== 1 ? 's' : ''} —{' '}
              {tab === 'escalated' ? 'oldest first' : 'recently stored'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(item => (
                <ItemCard key={item.id} item={item}
                  onStore={handleStore} onReturn={handleReturn}
                  actionLoading={actionLoading} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatsRow() {
  const [stats, setStats] = useState({ escalated: '—', stored: '—' })

  useEffect(() => {
    async function load() {
      const [{ count: escalated }, { count: stored }] = await Promise.all([
        supabase.from('found_items').select('*', { count: 'exact', head: true }).eq('status', 'escalated'),
        supabase.from('found_items').select('*', { count: 'exact', head: true }).eq('status', 'stored'),
      ])
      setStats({ escalated: escalated ?? 0, stored: stored ?? 0 })
    }
    load()
  }, [])

  const tiles = [
    { icon: '⚠️', label: 'Escalated', value: stats.escalated, bg: '#FFF7ED', color: '#C2410C' },
    { icon: '📦', label: 'In Storage', value: stats.stored,    bg: '#EEF9F4', color: '#2D6A4F' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 mb-2">
      {tiles.map(t => (
        <div key={t.label} className="rounded-2xl p-4 border" style={{ backgroundColor: t.bg, borderColor: '#E8E2D8' }}>
          <span className="text-2xl block mb-2">{t.icon}</span>
          <p className="text-2xl font-bold" style={{ color: t.color }}>{t.value}</p>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{t.label}</p>
        </div>
      ))}
    </div>
  )
}