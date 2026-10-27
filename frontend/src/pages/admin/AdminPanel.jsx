import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

const TABS = [
  { key: 'overview', label: '📊 Overview'   },
  { key: 'items',    label: '📦 All Items'  },
  { key: 'claims',   label: '📋 All Claims' },
  { key: 'users',    label: '👥 Users'      },
  { key: 'guards',   label: '🔐 Guards'     },
]

const INPUT = 'border border-[#E8E2D8] rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1C3829]'

export default function AdminPanel() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()
  const [tab, setTab] = useState('overview')

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0E8' }}>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>Loading...</p>
      </div>
    )
  }

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="text-center">
          <p className="text-4xl mb-3">🚫</p>
          <p className="text-sm font-medium" style={{ color: '#374151' }}>Admin access only.</p>
          <button onClick={() => navigate('/')} className="mt-4 text-sm hover:underline active:scale-95 transition-all"
            style={{ color: '#1C3829' }}>← Back to home</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>

      {/* Header */}
      <div className="bg-white border-b px-4 sm:px-6 py-3 sm:py-4" style={{ borderColor: '#E8E2D8' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-bold" style={{ color: '#1C2B1E', fontFamily: "'Lora','Georgia',serif" }}>
              🛡️ Admin Panel
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>NITJ Lost &amp; Found — Admin Controls</p>
          </div>
          <button onClick={() => navigate('/')} className="text-sm hover:opacity-70 active:scale-95 transition-all"
            style={{ color: '#6B7280' }}>← Home</button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b px-4 sm:px-6" style={{ borderColor: '#E8E2D8' }}>
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-3 sm:px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors"
              style={{
                borderBottomColor: tab === t.key ? '#1C3829' : 'transparent',
                color: tab === t.key ? '#1C3829' : '#6B7280',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'items'    && <ItemsTab />}
        {tab === 'claims'   && <ClaimsTab />}
        {tab === 'users'    && <UsersTab />}
        {tab === 'guards'   && <GuardsTab />}
      </div>
    </div>
  )
}


// ── Overview ──────────────────────────────────────────────────────────────────
function OverviewTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    setLoading(true)
    const [
      { count: totalItems },
      { count: activeItems },
      { count: closedItems },
      { count: totalClaims },
      { count: pendingClaims },
      { count: totalUsers },
    ] = await Promise.all([
      supabase.from('found_items').select('*', { count: 'exact', head: true }),
      supabase.from('found_items').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('found_items').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
      supabase.from('claims').select('*', { count: 'exact', head: true }),
      supabase.from('claims').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('users').select('*', { count: 'exact', head: true }),
    ])
    setStats({ totalItems, activeItems, closedItems, totalClaims, pendingClaims, totalUsers })
    setLoading(false)
  }

  if (loading) return <Spinner />

  const cards = [
    { label: 'Total Items Posted', value: stats.totalItems,    bg: '#EEF9F4', color: '#1C3829', icon: '📦' },
    { label: 'Active (Unclaimed)', value: stats.activeItems,   bg: '#ECFDF5', color: '#059669', icon: '🟢' },
    { label: 'Returned (Closed)',  value: stats.closedItems,   bg: '#F5F0E8', color: '#374151', icon: '✅' },
    { label: 'Total Claims Filed', value: stats.totalClaims,   bg: '#FFFBEB', color: '#D97706', icon: '📋' },
    { label: 'Pending Claims',     value: stats.pendingClaims, bg: '#FFF7ED', color: '#C2410C', icon: '⏳' },
    { label: 'Registered Users',   value: stats.totalUsers,    bg: '#F5F3FF', color: '#7C3AED', icon: '👥' },
  ]

  return (
    <div>
      <h2 className="text-sm font-bold mb-4" style={{ color: '#374151' }}>Portal Statistics</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {cards.map(c => (
          <div key={c.label} className="rounded-2xl p-4 sm:p-5 border" style={{ backgroundColor: c.bg, borderColor: '#E8E2D8' }}>
            <p className="text-xl sm:text-2xl mb-1">{c.icon}</p>
            <p className="text-2xl sm:text-3xl font-bold" style={{ color: c.color }}>{c.value ?? '—'}</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{c.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-center" style={{ color: '#9CA3AF' }}>
        Stats refresh on tab open. Last updated: {new Date().toLocaleTimeString('en-IN')}
      </p>
    </div>
  )
}


// ── All Items ─────────────────────────────────────────────────────────────────
function ItemsTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => { fetchItems() }, [filterStatus])

  async function fetchItems() {
    setLoading(true)
    let query = supabase.from('found_items')
      .select('*, users(name, email, department)').order('created_at', { ascending: false })
    if (filterStatus) query = query.eq('status', filterStatus)
    const { data } = await query
    setItems(data || [])
    setLoading(false)
  }

  async function forceClose(itemId) {
    if (!window.confirm('Force-close this item? This marks it as returned.')) return
    setActionLoading(itemId)
    await supabase.from('found_items').update({ status: 'closed' }).eq('id', itemId)
    await fetchItems()
    setActionLoading(null)
  }

  async function deleteItem(itemId) {
    if (!window.confirm('Permanently delete this item? This cannot be undone.')) return
    setActionLoading(itemId)
    await supabase.from('found_items').delete().eq('id', itemId)
    setItems(prev => prev.filter(i => i.id !== itemId))
    setActionLoading(null)
  }

  function statusChip(status) {
    const map = {
      active:    { bg: '#ECFDF5', color: '#059669' },
      claimed:   { bg: '#FFFBEB', color: '#D97706' },
      accepted:  { bg: '#EEF9F4', color: '#2D6A4F' },
      closed:    { bg: '#F3F4F6', color: '#6B7280' },
      escalated: { bg: '#FEF2F2', color: '#DC2626' },
    }
    const s = map[status] || map.closed
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ backgroundColor: s.bg, color: s.color }}>{status}</span>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold" style={{ color: '#374151' }}>All Found Items</h2>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-[#E8E2D8] rounded-xl px-3 py-1.5 text-sm bg-white focus:outline-none">
          <option value="">All Statuses</option>
          {['active','claimed','closed','escalated'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {loading ? <Spinner /> : (
        <div className="space-y-3">
          {items.length === 0 && <p className="text-sm text-center py-10" style={{ color: '#9CA3AF' }}>No items found.</p>}
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border p-4" style={{ borderColor: '#E8E2D8' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate" style={{ color: '#1C2B1E' }}>{item.title}</p>
                    {statusChip(item.status)}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                    {item.category} · 📍 {item.location} · {new Date(item.created_at).toLocaleDateString('en-IN')}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                    Posted by: <span className="font-medium">{item.users?.name || 'Unknown'}</span>
                    {item.users?.department ? ` (${item.users.department})` : ''}
                    {item.users?.email ? ` · ${item.users.email}` : ''}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {item.status !== 'closed' && (
                    <button onClick={() => forceClose(item.id)} disabled={actionLoading === item.id}
                      className="text-xs px-3 py-1.5 rounded-xl disabled:opacity-50 hover:opacity-70 active:scale-95 transition-all"
                      style={{ backgroundColor: '#F5F0E8', color: '#374151' }}>
                      {actionLoading === item.id ? '...' : 'Force Close'}
                    </button>
                  )}
                  <button onClick={() => deleteItem(item.id)} disabled={actionLoading === item.id}
                    className="text-xs px-3 py-1.5 rounded-xl disabled:opacity-50 hover:opacity-70 active:scale-95 transition-all"
                    style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                    {actionLoading === item.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// ── All Claims ────────────────────────────────────────────────────────────────
function ClaimsTab() {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => { fetchClaims() }, [filterStatus])

  async function fetchClaims() {
    setLoading(true)
    let query = supabase.from('claims')
      .select('*, found_items(title, location, status), users(name, email, department)')
      .order('created_at', { ascending: false })
    if (filterStatus) query = query.eq('status', filterStatus)
    const { data } = await query
    setClaims(data || [])
    setLoading(false)
  }

  async function forceReject(claimId) {
    if (!window.confirm('Force-reject this claim?')) return
    setActionLoading(claimId)
    await supabase.from('claims').update({ status: 'rejected' }).eq('id', claimId)
    await fetchClaims()
    setActionLoading(null)
  }

  function claimChip(status) {
    const map = {
      pending:  { bg: '#FFFBEB', color: '#D97706' },
      accepted: { bg: '#ECFDF5', color: '#059669' },
      rejected: { bg: '#FEF2F2', color: '#DC2626' },
      closed:   { bg: '#F3F4F6', color: '#6B7280' },
    }
    const s = map[status] || map.closed
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ backgroundColor: s.bg, color: s.color }}>{status}</span>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold" style={{ color: '#374151' }}>All Claims</h2>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-[#E8E2D8] rounded-xl px-3 py-1.5 text-sm bg-white focus:outline-none">
          <option value="">All Statuses</option>
          {['pending','accepted','rejected','closed'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {loading ? <Spinner /> : (
        <div className="space-y-3">
          {claims.length === 0 && <p className="text-sm text-center py-10" style={{ color: '#9CA3AF' }}>No claims found.</p>}
          {claims.map(claim => (
            <div key={claim.id} className="bg-white rounded-2xl border p-4" style={{ borderColor: '#E8E2D8' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate" style={{ color: '#1C2B1E' }}>
                      {claim.found_items?.title || 'Unknown Item'}
                    </p>
                    {claimChip(claim.status)}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                    📍 {claim.found_items?.location || '—'} · Claimed {new Date(claim.created_at).toLocaleDateString('en-IN')}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                    Claimer: <span className="font-medium">{claim.users?.name || 'Unknown'}</span>
                    {claim.users?.email ? ` · ${claim.users.email}` : ''}
                  </p>
                  {claim.proof_description && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer hover:underline" style={{ color: '#1C3829' }}>
                        View description proof
                      </summary>
                      <p className="text-xs mt-1 p-2 rounded-xl leading-relaxed"
                        style={{ backgroundColor: '#F5F0E8', color: '#374151' }}>
                        {claim.proof_description}
                      </p>
                    </details>
                  )}
                </div>
                <div className="shrink-0">
                  {claim.status === 'pending' && (
                    <button onClick={() => forceReject(claim.id)} disabled={actionLoading === claim.id}
                      className="text-xs px-3 py-1.5 rounded-xl disabled:opacity-50 hover:opacity-70 active:scale-95 transition-all"
                      style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                      {actionLoading === claim.id ? '...' : 'Force Reject'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// ── Users ─────────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  async function changeRole(userId, newRole) {
    if (!window.confirm(`Change this user's role to "${newRole}"?`)) return
    setActionLoading(userId)
    await supabase.from('users').update({ role: newRole }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    setActionLoading(null)
  }

  const filtered = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  )

  function roleBadge(role) {
    const map = {
      admin:    { bg: '#F5F3FF', color: '#7C3AED' },
      security: { bg: '#FEF2F2', color: '#DC2626' },
      student:  { bg: '#F5F0E8', color: '#374151' },
      faculty:  { bg: '#EEF9F4', color: '#2D6A4F' },
    }
    const s = map[role] || map.student
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ backgroundColor: s.bg, color: s.color }}>{role}</span>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2 sm:gap-3">
        <h2 className="text-sm font-bold shrink-0" style={{ color: '#374151' }}>All Users ({users.length})</h2>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name / email / dept..."
          className="border border-[#E8E2D8] rounded-xl px-3 py-1.5 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#1C3829]" />
      </div>
      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {filtered.length === 0 && <p className="text-sm text-center py-10" style={{ color: '#9CA3AF' }}>No users found.</p>}
          {filtered.map(u => (
            <div key={u.id} className="bg-white rounded-2xl border p-4 flex items-center justify-between gap-3"
              style={{ borderColor: '#E8E2D8' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold" style={{ color: '#1C2B1E' }}>{u.name || 'Unnamed'}</p>
                  {roleBadge(u.role)}
                </div>
                <p className="text-xs mt-0.5 truncate" style={{ color: '#9CA3AF' }}>{u.email}</p>
                {u.department && (
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    {u.department}{u.roll_no ? ` · ${u.roll_no}` : ''}
                  </p>
                )}
              </div>
              <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                disabled={actionLoading === u.id}
                className="border border-[#E8E2D8] rounded-xl px-2 py-1.5 text-xs bg-white focus:outline-none disabled:opacity-50 shrink-0 active:scale-95 transition-all">
                {['student','faculty','security','admin'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// ── Guards ────────────────────────────────────────────────────────────────────
function GuardsTab() {
  const [guards, setGuards] = useState([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { fetchGuards() }, [])

  async function fetchGuards() {
    setLoading(true)
    const { data } = await supabase.from('security_guards').select('*').order('created_at', { ascending: false })
    setGuards(data || [])
    setLoading(false)
  }

  async function addGuard(e) {
    e.preventDefault()
    if (!newEmail.trim()) return
    setAddLoading(true)
    setError('')
    setSuccess('')

    const exists = guards.some(g => g.email === newEmail.trim().toLowerCase())
    if (exists) { setError('This email is already in the guard whitelist.'); setAddLoading(false); return }

    const { error: addErr } = await supabase.from('security_guards').insert({ email: newEmail.trim().toLowerCase() })
    if (addErr) {
      setError(addErr.message)
    } else {
      setSuccess(`${newEmail.trim()} added to guard whitelist.`)
      setNewEmail('')
      await fetchGuards()
    }
    setAddLoading(false)
  }

  async function removeGuard(guardId, email) {
    if (!window.confirm(`Remove ${email} from the guard whitelist?`)) return
    await supabase.from('security_guards').delete().eq('id', guardId)
    setGuards(prev => prev.filter(g => g.id !== guardId))
  }

  return (
    <div>
      <h2 className="text-sm font-bold mb-1" style={{ color: '#374151' }}>Security Guard Whitelist</h2>
      <p className="text-xs mb-5" style={{ color: '#9CA3AF' }}>
        Guards added here get the <code className="px-1 rounded" style={{ backgroundColor: '#F5F0E8' }}>security</code> role automatically
        when they sign up. After adding, also set their role in the Users tab if they've already signed up.
      </p>

      <form onSubmit={addGuard} className="flex flex-col sm:flex-row gap-2 mb-5">
        <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
          placeholder="guard@nitj.ac.in" required
          className="flex-1 border border-[#E8E2D8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3829]" />
        <button type="submit" disabled={addLoading}
          className="shrink-0 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 active:scale-95 transition-all"
          style={{ backgroundColor: '#1C3829' }}>
          {addLoading ? '...' : '+ Add Guard'}
        </button>
      </form>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
      {success && <p className="text-xs mb-3" style={{ color: '#2D6A4F' }}>{success}</p>}

      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {guards.length === 0 && <p className="text-sm text-center py-8" style={{ color: '#9CA3AF' }}>No guards added yet.</p>}
          {guards.map(g => (
            <div key={g.id} className="bg-white rounded-2xl border px-4 py-3 flex items-center justify-between gap-3"
              style={{ borderColor: '#E8E2D8' }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#1C2B1E' }}>{g.email}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                  Added {new Date(g.created_at).toLocaleDateString('en-IN')}
                </p>
              </div>
              <button onClick={() => removeGuard(g.id, g.email)}
                className="text-xs hover:underline active:scale-95 transition-all shrink-0" style={{ color: '#DC2626' }}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <p className="text-sm" style={{ color: '#9CA3AF' }}>Loading...</p>
    </div>
  )
}