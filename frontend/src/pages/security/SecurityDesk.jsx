import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

// ── Access denied fallback ───────────────────────────────────────────────────
function AccessDenied() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-5xl mb-4">🚫</p>
        <h2 className="text-lg font-semibold text-gray-700 mb-1">Access Denied</h2>
        <p className="text-gray-400 text-sm mb-4">This page is only for security personnel.</p>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-blue-500 hover:text-blue-700 underline"
        >
          Go to Home
        </button>
      </div>
    </div>
  )
}

// ── Days since a date ────────────────────────────────────────────────────────
function daysSince(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ── Item card (used in both tabs) ────────────────────────────────────────────
function ItemCard({ item, onStore, onReturn, actionLoading }) {
  const navigate = useNavigate()
  const days = daysSince(item.created_at)
  const isStored = item.status === 'stored'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-all">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {item.category}
          </span>
          {isStored ? (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
              📦 Stored
            </span>
          ) : (
            <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">
              ⚠️ Escalated
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">{days}d ago</span>
      </div>

      {/* Title + description */}
      <h3 className="font-semibold text-gray-800 text-sm mb-1">{item.title}</h3>
      {item.description && (
        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{item.description}</p>
      )}

      {/* Location + date */}
      <div className="h-px bg-gray-100 my-2" />
      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
        <span>📍 {item.location}</span>
        <span>Found {formatDate(item.created_at)}</span>
      </div>

      {/* Finder info (if available) */}
      {item.users && (
        <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 mb-3">
          <span className="font-medium text-gray-600">Reported by: </span>
          {item.users.name}
          {item.users.department && ` · ${item.users.department}`}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/item/${item.id}`)}
          className="flex-1 text-xs text-blue-500 border border-blue-100 rounded-xl py-2 hover:bg-blue-50 transition-colors"
        >
          View Details →
        </button>

        {!isStored ? (
          <button
            onClick={() => onStore(item.id)}
            disabled={actionLoading === item.id}
            className="flex-1 text-xs bg-blue-600 text-white rounded-xl py-2 hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
          >
            {actionLoading === item.id ? 'Saving...' : '📦 Mark Stored'}
          </button>
        ) : (
          <button
            onClick={() => onReturn(item.id)}
            disabled={actionLoading === item.id}
            className="flex-1 text-xs bg-green-600 text-white rounded-xl py-2 hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
          >
            {actionLoading === item.id ? 'Saving...' : '✅ Mark Returned'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function SecurityDesk() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()

  const [tab, setTab] = useState('escalated')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null) // item id currently processing
  const [error, setError] = useState('')

  // Auth guard
  if (authLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
      Loading...
    </div>
  )
  if (!user || (profile?.role !== 'security' && profile?.role !== 'admin')) {
    return <AccessDenied />
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    fetchItems()
  }, [tab])

  async function fetchItems() {
    setLoading(true)
    setError('')

    const status = tab === 'escalated' ? 'escalated' : 'stored'

    const { data, error: err } = await supabase
      .from('found_items')
      .select('*, users(name, department)')
      .eq('status', status)
      .order('created_at', { ascending: true }) // oldest first — most urgent at top

    if (err) setError(err.message)
    else setItems(data || [])

    setLoading(false)
  }

  // Mark item as physically stored in security room
  async function handleStore(itemId) {
    setActionLoading(itemId)
    const { error: err } = await supabase
      .from('found_items')
      .update({ status: 'stored' })
      .eq('id', itemId)

    if (err) {
      setError(err.message)
    } else {
      setItems(prev => prev.filter(i => i.id !== itemId))
    }
    setActionLoading(null)
  }

  // Mark item as returned (close it)
  async function handleReturn(itemId) {
    setActionLoading(itemId)
    const { error: err } = await supabase
      .from('found_items')
      .update({ status: 'closed' })
      .eq('id', itemId)

    if (err) {
      setError(err.message)
    } else {
      setItems(prev => prev.filter(i => i.id !== itemId))
    }
    setActionLoading(null)
  }

  const tabs = [
    { key: 'escalated', label: '⚠️ Escalated', desc: 'Unclaimed 7+ days' },
    { key: 'stored', label: '📦 In Storage', desc: 'Physically with you' },
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 pt-6 pb-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Security Desk 🚨
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Manage escalated items and items in physical storage.
          </p>
        </div>

        {/* Stats row */}
        <StatsRow />
      </div>

      {/* ── Divider ───────────────────────────────────────────── */}
      <div className="border-t border-gray-100" />

      {/* ── Tabs + content ────────────────────────────────────── */}
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-6">

          {/* Tab bar */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${tab === t.key
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'}
                `}
              >
                {t.label}
                <span className="ml-1 text-xs text-gray-400 hidden sm:inline">
                  — {t.desc}
                </span>
              </button>
            ))}
          </div>

          {/* How escalation works (info box, only on escalated tab) */}
          {tab === 'escalated' && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 mb-5 text-xs text-orange-700">
              <strong>What is this?</strong> Items that were posted but nobody claimed for 7+ days are escalated here.
              Once you physically collect an item, click <strong>Mark Stored</strong> to track it.
              When the owner picks it up, click <strong>Mark Returned</strong> to close the record.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="text-center py-20 text-gray-400 text-sm">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">{tab === 'escalated' ? '✅' : '📭'}</p>
              <p className="text-gray-500 text-sm">
                {tab === 'escalated'
                  ? 'No escalated items right now.'
                  : 'Nothing in storage right now.'}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {tab === 'escalated'
                  ? 'All posted items have been claimed or closed.'
                  : 'Items you mark as stored will appear here.'}
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-4">
                {items.length} item{items.length !== 1 ? 's' : ''} —{' '}
                {tab === 'escalated' ? 'oldest first' : 'recently stored'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onStore={handleStore}
                    onReturn={handleReturn}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Stats strip (escalated + stored counts) ──────────────────────────────────
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
    { icon: '⚠️', label: 'Escalated', value: stats.escalated, color: 'text-orange-600' },
    { icon: '📦', label: 'In Storage', value: stats.stored, color: 'text-blue-600' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {tiles.map(t => (
        <div key={t.label} className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
          <span className="text-2xl block mb-2">{t.icon}</span>
          <p className={`text-2xl font-bold ${t.color}`}>{t.value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{t.label}</p>
        </div>
      ))}
    </div>
  )
}