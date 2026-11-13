import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

// ── Helpers ─────────────────────────────────────────────────
function daysSince(d) { return Math.floor((Date.now() - new Date(d).getTime()) / 86400000) }
function formatDate(d) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }

// ── Access Denied ────────────────────────────────────────────
function AccessDenied() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0E8' }}>
      <div className="text-center">
        <p className="text-5xl mb-4">🚫</p>
        <h2 className="text-lg font-semibold mb-1" style={{ color: '#374151' }}>Access Denied</h2>
        <p className="text-sm mb-4" style={{ color: '#9CA3AF' }}>This page is for security personnel only.</p>
        <button onClick={() => navigate('/')} className="text-sm hover:underline" style={{ color: '#1C3829' }}>← Home</button>
      </div>
    </div>
  )
}

// ── Notify Modal ─────────────────────────────────────────────
function NotifyModal({ item, onClose }) {
  const [lostReports, setLostReports] = useState([])
  const [selected, setSelected] = useState(null)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    supabase.from('lost_reports').select('*, users(name, department)')
      .eq('status', 'open').order('created_at', { ascending: false })
      .then(({ data }) => setLostReports(data || []))
  }, [])

  async function sendNotification() {
    if (!selected) return
    setSending(true)
    await supabase.from('notifications').insert({
      user_id: selected.user_id,
      type: 'item_match',
      title: 'Your lost item may have been found! 🔍',
      body: `A "${item.title}" is at the Security Desk. Visit with your ID to verify and collect it.`,
      meta: { item_id: item.id, lost_report_id: selected.id },
    })
    setSending(false)
    setDone(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <p className="font-semibold text-sm mb-0.5" style={{ color: '#1C2B1E' }}>📣 Notify a Lost Student</p>
        <p className="text-xs mb-4 line-clamp-1" style={{ color: '#9CA3AF' }}>Item: {item.title}</p>

        {done ? (
          <div className="text-center py-4">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-sm font-medium" style={{ color: '#2D6A4F' }}>Notification sent!</p>
            <button onClick={onClose} className="mt-4 text-xs hover:underline" style={{ color: '#6B7280' }}>Close</button>
          </div>
        ) : (
          <>
            <p className="text-xs mb-2 font-medium" style={{ color: '#374151' }}>Select a lost report to notify:</p>
            <div className="max-h-52 overflow-y-auto space-y-2 mb-4">
              {lostReports.length === 0 && (
                <p className="text-xs text-center py-4" style={{ color: '#9CA3AF' }}>No open lost reports.</p>
              )}
              {lostReports.map(r => (
                <button key={r.id} onClick={() => setSelected(r)}
                  className="w-full text-left px-3 py-2.5 rounded-xl border text-xs transition-all"
                  style={selected?.id === r.id
                    ? { backgroundColor: '#EEF9F4', borderColor: '#2D6A4F' }
                    : { backgroundColor: '#F9FAFB', borderColor: '#E8E2D8' }
                  }>
                  <p className="font-medium" style={{ color: '#1C2B1E' }}>{r.title}</p>
                  <p style={{ color: '#6B7280' }}>{r.users?.name} · {r.category}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={onClose}
                className="flex-1 text-xs py-2 rounded-xl border hover:opacity-70 active:scale-95 transition-all"
                style={{ borderColor: '#E8E2D8', color: '#374151' }}>
                Cancel
              </button>
              <button onClick={sendNotification} disabled={!selected || sending}
                className="flex-1 text-xs py-2 rounded-xl text-white hover:opacity-90 disabled:opacity-50 active:scale-95 transition-all"
                style={{ backgroundColor: '#1C3829' }}>
                {sending ? '…' : 'Send Notification'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Item Card ────────────────────────────────────────────────
function ItemCard({ item, onCustody, onClose, actionLoading }) {
  const navigate = useNavigate()
  const [showNotify, setShowNotify] = useState(false)
  const days = daysSince(item.created_at)
  const status = item.status

  const statusBadge = {
    active:     { label: '🕐 Active',      bg: '#FFF7ED', color: '#C2410C' },
    in_custody: { label: '📦 In Custody',  bg: '#EEF9F4', color: '#2D6A4F' },
    escalated:  { label: '⚠️ Escalated',   bg: '#FFF7ED', color: '#C2410C' },
    closed:     { label: '✅ Closed',      bg: '#F0FDF4', color: '#166534' },
  }[status] || { label: status, bg: '#F5F0E8', color: '#374151' }

  return (
    <>
      {showNotify && <NotifyModal item={item} onClose={() => setShowNotify(false)} />}
      <div className="bg-white rounded-2xl border p-4 hover:shadow-sm transition-all" style={{ borderColor: '#E8E2D8' }}>

        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F5F0E8', color: '#374151' }}>
              {item.category}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: statusBadge.bg, color: statusBadge.color }}>
              {statusBadge.label}
            </span>
          </div>
          <span className="text-xs shrink-0" style={{ color: '#9CA3AF' }}>{days}d ago</span>
        </div>

        <h3 className="font-semibold text-sm mb-1 truncate" style={{ color: '#1C2B1E' }}>{item.title}</h3>
        {item.description && (
          <p className="text-xs mb-2 line-clamp-2" style={{ color: '#9CA3AF' }}>{item.description}</p>
        )}

        <div className="h-px my-2" style={{ backgroundColor: '#E8E2D8' }} />
        <div className="flex items-center justify-between text-xs mb-3" style={{ color: '#9CA3AF' }}>
          <span className="truncate mr-2">📍 {item.location}</span>
          <span className="shrink-0">Found {formatDate(item.created_at)}</span>
        </div>

        {/* Finder info — visible to security only */}
        {item.users && (
          <div className="text-xs px-3 py-2 rounded-xl mb-3" style={{ backgroundColor: '#F5F0E8' }}>
            <span className="font-medium" style={{ color: '#374151' }}>Reported by: </span>
            <span style={{ color: '#6B7280' }}>
              {item.users.name}{item.users.department && ` · ${item.users.department}`}
            </span>
            <span className="ml-1 text-xs" style={{ color: '#9CA3AF' }}>(only you can see this)</span>
          </div>
        )}

        {/* Interests / flags */}
        {item.interest_count > 0 && (
          <div className="text-xs px-3 py-2 rounded-xl mb-3" style={{ backgroundColor: '#FEFCE8', border: '1px solid #FDE047', color: '#713F12' }}>
            🙋 {item.interest_count} student{item.interest_count > 1 ? 's' : ''} flagged this as theirs
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => navigate(`/item/${item.id}`)}
            className="text-xs rounded-xl py-2 px-3 border hover:opacity-70 active:scale-95 transition-all"
            style={{ borderColor: '#E8E2D8', color: '#374151' }}>
            View →
          </button>
          <button onClick={() => setShowNotify(true)}
            className="text-xs rounded-xl py-2 px-3 border hover:opacity-70 active:scale-95 transition-all"
            style={{ borderColor: '#E8E2D8', color: '#374151' }}
            title="Manually notify a lost student">
            📣 Notify
          </button>

          {status !== 'in_custody' && status !== 'closed' && (
            <button onClick={() => onCustody(item.id)} disabled={actionLoading === item.id}
              className="flex-1 text-xs text-white rounded-xl py-2 hover:opacity-90 disabled:opacity-50 font-medium active:scale-95 transition-all"
              style={{ backgroundColor: '#2D6A4F' }}>
              {actionLoading === item.id ? '…' : '📦 Mark In Custody'}
            </button>
          )}

          {status === 'in_custody' && (
            <button onClick={() => onClose(item.id)} disabled={actionLoading === item.id}
              className="flex-1 text-xs text-white rounded-xl py-2 hover:opacity-90 disabled:opacity-50 font-medium active:scale-95 transition-all"
              style={{ backgroundColor: '#1C3829' }}>
              {actionLoading === item.id ? '…' : '✅ Mark Returned'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}

// ── Stats Row ────────────────────────────────────────────────
function StatsRow() {
  const [stats, setStats] = useState({ active: '—', in_custody: '—', closed_today: '—' })
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      supabase.from('found_items').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('found_items').select('*', { count: 'exact', head: true }).eq('status', 'in_custody'),
      supabase.from('found_items').select('*', { count: 'exact', head: true }).eq('status', 'closed').gte('updated_at', today),
    ]).then(([a, b, c]) => setStats({ active: a.count ?? 0, in_custody: b.count ?? 0, closed_today: c.count ?? 0 }))
  }, [])

  return (
    <div className="grid grid-cols-3 gap-3 mb-2">
      {[
        { icon: '🕐', label: 'Active',       value: stats.active,       bg: '#FFF7ED', color: '#C2410C' },
        { icon: '📦', label: 'In Custody',   value: stats.in_custody,   bg: '#EEF9F4', color: '#2D6A4F' },
        { icon: '✅', label: 'Returned Today',value: stats.closed_today, bg: '#F0FDF4', color: '#166534' },
      ].map(t => (
        <div key={t.label} className="rounded-2xl p-3 sm:p-4 border" style={{ backgroundColor: t.bg, borderColor: '#E8E2D8' }}>
          <span className="text-xl sm:text-2xl block mb-1">{t.icon}</span>
          <p className="text-xl sm:text-2xl font-bold" style={{ color: t.color }}>{t.value}</p>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{t.label}</p>
        </div>
      ))}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function SecurityDesk() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()
  const [tab, setTab] = useState('active')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [error, setError] = useState('')

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center text-sm" style={{ backgroundColor: '#F5F0E8', color: '#9CA3AF' }}>Loading…</div>
  )
  if (!user || (profile?.role !== 'security' && profile?.role !== 'admin')) return <AccessDenied />

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { fetchItems() }, [tab])

  async function fetchItems() {
    setLoading(true)
    setError('')
    const statusMap = {
      active:     ['active', 'escalated'],
      in_custody: ['in_custody'],
    }
    const statuses = statusMap[tab] || ['active']

    // Fetch items + count interests per item
    const { data, error: err } = await supabase
      .from('found_items')
      .select('*, users(name, department)')
      .in('status', statuses)
      .order('created_at', { ascending: true })

    if (err) { setError(err.message); setLoading(false); return }

    const ids = (data || []).map(i => i.id)
    let interestCounts = {}
    if (ids.length) {
      const { data: interests } = await supabase
        .from('interests').select('item_id').in('item_id', ids)
      ;(interests || []).forEach(({ item_id }) => {
        interestCounts[item_id] = (interestCounts[item_id] || 0) + 1
      })
    }

    setItems((data || []).map(i => ({ ...i, interest_count: interestCounts[i.id] || 0 })))
    setLoading(false)
  }

  async function handleCustody(itemId) {
    setActionLoading(itemId)
    const { error: err } = await supabase
      .from('found_items').update({ status: 'in_custody' }).eq('id', itemId)
    if (err) setError(err.message)
    else setItems(prev => prev.filter(i => i.id !== itemId))
    setActionLoading(null)
  }

  async function handleClose(itemId) {
    if (!window.confirm('Confirm the item has been returned to its owner?')) return
    setActionLoading(itemId)
    const { error: err } = await supabase
      .from('found_items').update({ status: 'closed' }).eq('id', itemId)
    if (err) setError(err.message)
    else setItems(prev => prev.filter(i => i.id !== itemId))
    setActionLoading(null)
  }

  const tabs = [
    { key: 'active',     label: '🕐 Needs Collection', desc: 'Not yet with security' },
    { key: 'in_custody', label: '📦 In Custody',       desc: 'Physically with you' },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>

      <div className="bg-white border-b px-4 sm:px-6 py-3 sm:py-4" style={{ borderColor: '#E8E2D8' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-bold" style={{ color: '#1C2B1E', fontFamily: "'Lora','Georgia',serif" }}>
              🛡️ Security Desk
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              Collect reported items, notify owners, and close cases.
            </p>
          </div>
          <button onClick={() => navigate('/')} className="text-sm hover:opacity-70 active:scale-95 transition-all"
            style={{ color: '#6B7280' }}>← Home</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
        <StatsRow />

        <div className="flex gap-1 rounded-2xl p-1 my-5 w-fit" style={{ backgroundColor: '#E8E2D8' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
              style={tab === t.key
                ? { backgroundColor: '#FFFFFF', color: '#1C2B1E', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                : { color: '#6B7280' }
              }>
              {t.label}
              <span className="ml-1 text-xs hidden sm:inline" style={{ color: '#9CA3AF' }}>— {t.desc}</span>
            </button>
          ))}
        </div>

        {tab === 'active' && (
          <div className="rounded-2xl px-4 py-3 mb-5 text-xs" style={{ backgroundColor: '#EEF9F4', border: '1px solid #B7DFC9', color: '#2D6A4F' }}>
            <strong>Workflow:</strong> Collect the physical item from the finder, then click <strong>Mark In Custody</strong>.
            This triggers auto-matching — any lost student with a matching report gets notified automatically.
            You can also manually notify a specific student using the <strong>📣 Notify</strong> button.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-4">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-20 text-sm" style={{ color: '#9CA3AF' }}>Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">{tab === 'active' ? '✅' : '📭'}</p>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              {tab === 'active' ? 'No items waiting for collection.' : 'Nothing in custody right now.'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
              {items.length} item{items.length !== 1 ? 's' : ''} — oldest first
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(item => (
                <ItemCard key={item.id} item={item}
                  onCustody={handleCustody} onClose={handleClose}
                  actionLoading={actionLoading} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}