import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

// ─── Tabs ──────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview',  label: '📊 Overview'   },
  { key: 'items',     label: '📦 All Items'  },
  { key: 'claims',    label: '📋 All Claims' },
  { key: 'users',     label: '👥 Users'      },
  { key: 'guards',    label: '🔐 Guards'     },
]

export default function AdminPanel() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()

  const [tab, setTab] = useState('overview')

  // ── Guard: only admin can see this ──────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">🚫</p>
          <p className="text-gray-600 text-sm font-medium">Admin access only.</p>
          <button onClick={() => navigate('/')} className="mt-4 text-blue-600 text-sm hover:underline">
            ← Back to home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">🛡️ Admin Panel</h1>
            <p className="text-xs text-gray-400 mt-0.5">NITJ Lost &amp; Found — Admin Controls</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            ← Home
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'items'    && <ItemsTab />}
        {tab === 'claims'   && <ClaimsTab />}
        {tab === 'users'    && <UsersTab />}
        {tab === 'guards'   && <GuardsTab />}
      </div>
    </div>
  )
}


// ════════════════════════════════════════════════════════════════════
// TAB: OVERVIEW — stat cards
// ════════════════════════════════════════════════════════════════════
function OverviewTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

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
    { label: 'Total Items Posted', value: stats.totalItems,    color: 'bg-blue-50   border-blue-100  text-blue-800',   icon: '📦' },
    { label: 'Active (Unclaimed)', value: stats.activeItems,   color: 'bg-green-50  border-green-100 text-green-800',  icon: '🟢' },
    { label: 'Returned (Closed)',  value: stats.closedItems,   color: 'bg-gray-50   border-gray-200  text-gray-700',   icon: '✅' },
    { label: 'Total Claims Filed', value: stats.totalClaims,   color: 'bg-yellow-50 border-yellow-100 text-yellow-800', icon: '📋' },
    { label: 'Pending Claims',     value: stats.pendingClaims, color: 'bg-orange-50 border-orange-100 text-orange-800', icon: '⏳' },
    { label: 'Registered Users',   value: stats.totalUsers,    color: 'bg-purple-50 border-purple-100 text-purple-800', icon: '👥' },
  ]

  return (
    <div>
      <h2 className="text-sm font-bold text-gray-700 mb-4">Portal Statistics</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.label} className={`border rounded-xl p-5 ${c.color}`}>
            <p className="text-2xl mb-1">{c.icon}</p>
            <p className="text-3xl font-bold">{c.value ?? '—'}</p>
            <p className="text-xs mt-1 opacity-70">{c.label}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-gray-400 text-center">
        Stats refresh on tab open. Last updated: {new Date().toLocaleTimeString('en-IN')}
      </p>
    </div>
  )
}


// ════════════════════════════════════════════════════════════════════
// TAB: ALL ITEMS
// ════════════════════════════════════════════════════════════════════
function ItemsTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    fetchItems()
  }, [filterStatus])

  async function fetchItems() {
    setLoading(true)
    let query = supabase
      .from('found_items')
      .select('*, users(name, email, department)')
      .order('created_at', { ascending: false })

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

  const statusColors = {
    active:    'bg-green-100 text-green-700',
    claimed:   'bg-yellow-100 text-yellow-700',
    accepted:  'bg-blue-100 text-blue-700',
    closed:    'bg-gray-100 text-gray-500',
    escalated: 'bg-red-100 text-red-600',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-700">All Found Items</h2>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="claimed">Claimed</option>
          <option value="closed">Closed</option>
          <option value="escalated">Escalated</option>
        </select>
      </div>

      {loading ? <Spinner /> : (
        <div className="space-y-3">
          {items.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-10">No items found.</p>
          )}
          {items.map(item => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[item.status] || 'bg-gray-100 text-gray-500'}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.category} · 📍 {item.location} · {new Date(item.created_at).toLocaleDateString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Posted by: <span className="font-medium">{item.users?.name || 'Unknown'}</span>
                    {item.users?.department ? ` (${item.users.department})` : ''}
                    {item.users?.email ? ` · ${item.users.email}` : ''}
                  </p>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  {item.status !== 'closed' && (
                    <button
                      onClick={() => forceClose(item.id)}
                      disabled={actionLoading === item.id}
                      className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                      {actionLoading === item.id ? '...' : 'Force Close'}
                    </button>
                  )}
                  <button
                    onClick={() => deleteItem(item.id)}
                    disabled={actionLoading === item.id}
                    className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 disabled:opacity-50"
                  >
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


// ════════════════════════════════════════════════════════════════════
// TAB: ALL CLAIMS
// ════════════════════════════════════════════════════════════════════
function ClaimsTab() {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    fetchClaims()
  }, [filterStatus])

  async function fetchClaims() {
    setLoading(true)
    let query = supabase
      .from('claims')
      .select('*, found_items(title, location, status), users(name, email, department)')
      .order('created_at', { ascending: false })

    if (filterStatus) query = query.eq('status', filterStatus)

    const { data } = await query
    setClaims(data || [])
    setLoading(false)
  }

  // Admin can force-reject a claim (dispute resolution)
  async function forceReject(claimId) {
    if (!window.confirm('Force-reject this claim?')) return
    setActionLoading(claimId)
    await supabase.from('claims').update({ status: 'rejected' }).eq('id', claimId)
    await fetchClaims()
    setActionLoading(null)
  }

  const claimStatusColors = {
    pending:  'bg-yellow-100 text-yellow-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600',
    closed:   'bg-gray-100 text-gray-500',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-700">All Claims</h2>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? <Spinner /> : (
        <div className="space-y-3">
          {claims.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-10">No claims found.</p>
          )}
          {claims.map(claim => (
            <div key={claim.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800">
                      {claim.found_items?.title || 'Unknown Item'}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${claimStatusColors[claim.status] || ''}`}>
                      {claim.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    📍 {claim.found_items?.location || '—'} · Claimed {new Date(claim.created_at).toLocaleDateString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Claimer: <span className="font-medium">{claim.users?.name || 'Unknown'}</span>
                    {claim.users?.email ? ` · ${claim.users.email}` : ''}
                  </p>
                  {claim.description_proof && (
                    <details className="mt-2">
                      <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                        View description proof
                      </summary>
                      <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded-lg leading-relaxed">
                        {claim.description_proof}
                      </p>
                    </details>
                  )}
                </div>

                <div className="shrink-0">
                  {claim.status === 'pending' && (
                    <button
                      onClick={() => forceReject(claim.id)}
                      disabled={actionLoading === claim.id}
                      className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 disabled:opacity-50"
                    >
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


// ════════════════════════════════════════════════════════════════════
// TAB: USERS
// ════════════════════════════════════════════════════════════════════
function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

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

  const roleBadge = (role) => {
    const map = {
      admin:    'bg-purple-100 text-purple-700',
      security: 'bg-red-100 text-red-600',
      student:  'bg-gray-100 text-gray-600',
      faculty:  'bg-blue-100 text-blue-600',
    }
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[role] || 'bg-gray-100 text-gray-500'}`}>
        {role}
      </span>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-sm font-bold text-gray-700">All Users ({users.length})</h2>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name / email / dept..."
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-10">No users found.</p>
          )}
          {filtered.map(u => (
            <div key={u.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-800">{u.name || 'Unnamed'}</p>
                  {roleBadge(u.role)}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
                {u.department && (
                  <p className="text-xs text-gray-400">{u.department}{u.roll_no ? ` · ${u.roll_no}` : ''}</p>
                )}
              </div>

              {/* Role change dropdown */}
              <select
                value={u.role}
                onChange={e => changeRole(u.id, e.target.value)}
                disabled={actionLoading === u.id}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none disabled:opacity-50 shrink-0"
              >
                <option value="student">student</option>
                <option value="faculty">faculty</option>
                <option value="security">security</option>
                <option value="admin">admin</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// ════════════════════════════════════════════════════════════════════
// TAB: SECURITY GUARDS WHITELIST
// ════════════════════════════════════════════════════════════════════
function GuardsTab() {
  const [guards, setGuards] = useState([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchGuards()
  }, [])

  async function fetchGuards() {
    setLoading(true)
    const { data } = await supabase
      .from('security_guards')
      .select('*')
      .order('created_at', { ascending: false })
    setGuards(data || [])
    setLoading(false)
  }

  async function addGuard(e) {
    e.preventDefault()
    if (!newEmail.trim()) return

    setAddLoading(true)
    setError('')
    setSuccess('')

    // Check if already in list
    const exists = guards.some(g => g.email === newEmail.trim().toLowerCase())
    if (exists) {
      setError('This email is already in the guard whitelist.')
      setAddLoading(false)
      return
    }

    const { error: addErr } = await supabase
      .from('security_guards')
      .insert({ email: newEmail.trim().toLowerCase() })

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
      <h2 className="text-sm font-bold text-gray-700 mb-1">Security Guard Whitelist</h2>
      <p className="text-xs text-gray-400 mb-5">
        Guards added here get the <code className="bg-gray-100 px-1 rounded">security</code> role automatically
        when they sign up with this email. After adding, also set their role in the Users tab if they've already signed up.
      </p>

      {/* Add guard form */}
      <form onSubmit={addGuard} className="flex gap-2 mb-5">
        <input
          type="email"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          placeholder="guard@nitj.ac.in"
          required
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={addLoading}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {addLoading ? '...' : '+ Add Guard'}
        </button>
      </form>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
      {success && <p className="text-xs text-green-600 mb-3">{success}</p>}

      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {guards.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">No guards added yet.</p>
          )}
          {guards.map(g => (
            <div key={g.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-800 font-medium">{g.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Added {new Date(g.created_at).toLocaleDateString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => removeGuard(g.id, g.email)}
                className="text-xs text-red-500 hover:text-red-700 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// ── Shared spinner ─────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  )
}