import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { CATEGORIES, LOCATIONS } from '../lib/constants'

const CAT_STYLE = {
  'Mobile Phone':    { icon: '📱', bg: '#D1FAE5', color: '#065F46' },
  'Laptop':          { icon: '💻', bg: '#DBEAFE', color: '#1E40AF' },
  'Keys':            { icon: '🔑', bg: '#EDE9FE', color: '#5B21B6' },
  'Wallet':          { icon: '👛', bg: '#FEF3C7', color: '#92400E' },
  'Bags':            { icon: '🎒', bg: '#FFEDD5', color: '#9A3412' },
  'Spectacles':      { icon: '👓', bg: '#FCE7F3', color: '#9D174D' },
  'ID Card':         { icon: '🪪', bg: '#E0F2FE', color: '#0C4A6E' },
  'Stationery':      { icon: '✏️', bg: '#F0FDF4', color: '#14532D' },
  'Clothing':        { icon: '👕', bg: '#FFF7ED', color: '#7C2D12' },
  'Books':           { icon: '📚', bg: '#F5F3FF', color: '#4C1D95' },
  'Electronics':     { icon: '🔌', bg: '#ECFDF5', color: '#064E3B' },
  'Other':           { icon: '📦', bg: '#F3F4F6', color: '#374151' },
}
function getCatStyle(cat) { return CAT_STYLE[cat] || CAT_STYLE['Other'] }

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ActionCard({ icon, iconBg, iconColor, label, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        text-left bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#E8E2D8]
        transition-all duration-150
        ${onClick ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer active:scale-95' : 'opacity-60 cursor-default'}
      `}
    >
      <div
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg sm:text-xl mb-2 sm:mb-3"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <p className="text-xs sm:text-sm font-bold leading-snug" style={{ color: '#1C3829' }}>{label}</p>
      <p className="text-[10px] sm:text-xs mt-0.5 leading-snug" style={{ color: '#6B7280' }}>{sub}</p>
    </button>
  )
}

function ItemCard({ item, tab, onClick }) {
  const cs = getCatStyle(item.category)
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E2D8] cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] group"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: cs.bg }}
        >
          {cs.icon}
        </div>
        {tab === 'found' && (
          item.status === 'claimed'
            ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>⏳ Claimed</span>
            : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>✓ Available</span>
        )}
        {tab === 'lost' && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FFEDD5', color: '#9A3412' }}>🔍 Lost</span>
        )}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: cs.color }}>{item.category}</p>
      <h3 className="font-semibold text-sm mb-1 leading-snug" style={{ color: '#1C2B1E' }}>{item.title}</h3>
      {item.description && (
        <p className="text-xs line-clamp-2 mb-3" style={{ color: '#6B7280' }}>{item.description}</p>
      )}
      <div className="h-px mb-3" style={{ backgroundColor: '#F3F4F6' }} />
      <div className="flex items-center justify-between text-xs" style={{ color: '#9CA3AF' }}>
        <span className="truncate mr-2">📍 {item.location}</span>
        <span className="shrink-0">{formatDate(item.created_at)}</span>
      </div>
      <p className="mt-3 text-xs font-semibold text-right transition-colors group-hover:opacity-80" style={{ color: '#1C3829' }}>
        {tab === 'found' ? (item.status === 'claimed' ? 'View details →' : 'Is this yours? →') : 'See details →'}
      </p>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [tab, setTab] = useState('found')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ found: '—', available: '—', lost: '—' })

  useEffect(() => {
    async function loadStats() {
      const [{ count: found }, { count: available }, { count: lost }] = await Promise.all([
        supabase.from('found_items').select('*', { count: 'exact', head: true }).in('status', ['active', 'claimed', 'escalated', 'stored']),
        supabase.from('found_items').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('lost_items').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      ])
      setStats({ found: found ?? 0, available: available ?? 0, lost: lost ?? 0 })
    }
    loadStats()
  }, [])

  useEffect(() => { fetchItems() }, [tab, filterCategory, filterLocation])

  async function fetchItems() {
    setLoading(true)
    if (tab === 'found') {
      let q = supabase.from('found_items').select('*').in('status', ['active', 'claimed']).order('created_at', { ascending: false })
      if (filterCategory) q = q.eq('category', filterCategory)
      if (filterLocation) q = q.eq('location', filterLocation)
      const { data, error } = await q
      if (!error) setItems(data || [])
    } else {
      let q = supabase.from('lost_items').select('*').eq('status', 'active').order('created_at', { ascending: false })
      if (filterCategory) q = q.eq('category', filterCategory)
      if (filterLocation) q = q.eq('location', filterLocation)
      const { data, error } = await q
      if (!error) setItems(data || [])
    }
    setLoading(false)
  }

  const displayed = search.trim()
    ? items.filter(it =>
        (it.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (it.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (it.location || '').toLowerCase().includes(search.toLowerCase())
      )
    : items

  const actions = [
    { icon: '📬', iconBg: '#DBEAFE', iconColor: '#1E40AF', label: 'My Dashboard', sub: 'Claims & activity', onClick: () => navigate('/dashboard') },
    { icon: '📦', iconBg: '#D1FAE5', iconColor: '#065F46', label: 'Report Found', sub: 'Post what you found', onClick: () => navigate('/report-found') },
    { icon: '🔍', iconBg: '#FFEDD5', iconColor: '#9A3412', label: 'Report Lost', sub: 'Report what you lost', onClick: () => navigate('/report-lost') },
    profile?.role === 'admin'
      ? { icon: '🛡️', iconBg: '#EDE9FE', iconColor: '#5B21B6', label: 'Admin Panel', sub: 'Manage portal', onClick: () => navigate('/admin') }
      : profile?.role === 'security'
      ? { icon: '🚨', iconBg: '#FEE2E2', iconColor: '#991B1B', label: 'Security Desk', sub: 'Escalated items', onClick: () => navigate('/security') }
      : { icon: '💡', iconBg: '#FEF3C7', iconColor: '#92400E', label: 'How it works', sub: 'Find → Claim → Chat → Return', onClick: null },
  ]

  const chipCategories = CATEGORIES.slice(0, 5)
  const hasFilters = filterCategory || filterLocation || search

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>

      {/* ── Hero ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 sm:pt-6 pb-6 sm:pb-8">
        <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-8" style={{ backgroundColor: '#1C3829' }}>

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 sm:mb-3" style={{ color: '#52B788' }}>
            Campus Lost &amp; Found Board
          </p>

          <h1
            className="text-xl sm:text-3xl font-bold text-white mb-1"
            style={{ fontFamily: "'Lora', 'Georgia', serif" }}
          >
            {profile ? `Hey, ${profile.name.split(' ')[0]} 👋` : 'Something lost? Someone found it.'}
          </h1>
          <p className="text-xs sm:text-sm mb-4 sm:mb-6" style={{ color: '#95C4A5' }}>
            {profile ? 'Someone on campus might have found your stuff.' : 'Browse items found on campus or sign in to post.'}
          </p>

          {user ? (
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
              <button
                onClick={() => navigate('/report-found')}
                className="flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full transition-opacity hover:opacity-90 active:scale-95"
                style={{ backgroundColor: '#D4782A', color: '#fff' }}
              >
                <span>+</span> Post a found item
              </button>
              <button
                onClick={() => navigate('/report-lost')}
                className="flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border transition-all hover:bg-white/10 active:scale-95"
                style={{ borderColor: '#52B788', color: '#B7E4C7' }}
              >
                🔍 I lost something
              </button>
            </div>
          ) : (
            <div className="mb-4 sm:mb-6">
              <button
                onClick={() => navigate('/login')}
                className="text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#D4782A', color: '#fff' }}
              >
                Sign in to post or claim →
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: `${stats.found} on the board`, icon: '📋' },
              { label: `${stats.available} available now`, icon: '✅' },
              { label: `${stats.lost} reported lost`, icon: '🔍' },
            ].map(s => (
              <div
                key={s.label}
                className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#B7E4C7' }}
              >
                <span>{s.icon}</span>{s.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      {user && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {actions.map(a => <ActionCard key={a.label} {...a} />)}
          </div>
        </div>
      )}

      {/* ── Browse ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">

        {/* Heading + toggle */}
        <div className="flex items-center justify-between gap-4 mb-4 sm:mb-5">
          <h2
            className="text-lg sm:text-xl font-bold"
            style={{ fontFamily: "'Lora', 'Georgia', serif", color: '#1C2B1E' }}
          >
            Browse items
          </h2>
          <div className="flex bg-white border border-[#E8E2D8] rounded-xl p-1 shrink-0">
            {[{ key: 'found', label: '📦 Found' }, { key: 'lost', label: '🔍 Lost' }].map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setFilterCategory(''); setSearch('') }}
                className="px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all"
                style={tab === t.key ? { backgroundColor: '#1C3829', color: '#fff' } : { color: '#6B7280' }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#9CA3AF' }}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${tab === 'found' ? 'found' : 'lost'} items…`}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
            style={{ backgroundColor: '#fff', borderColor: '#E8E2D8', color: '#1C2B1E' }}
          />
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button
            onClick={() => setFilterCategory('')}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
            style={!filterCategory
              ? { backgroundColor: '#1C3829', color: '#fff', borderColor: '#1C3829' }
              : { backgroundColor: '#fff', color: '#374151', borderColor: '#E8E2D8' }}
          >
            All
          </button>
          {chipCategories.map(c => (
            <button
              key={c}
              onClick={() => setFilterCategory(filterCategory === c ? '' : c)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
              style={filterCategory === c
                ? { backgroundColor: '#1C3829', color: '#fff', borderColor: '#1C3829' }
                : { backgroundColor: '#fff', color: '#374151', borderColor: '#E8E2D8' }}
            >
              {getCatStyle(c).icon} {c}
            </button>
          ))}
          {CATEGORIES.length > 5 && (
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-full border bg-white focus:outline-none"
              style={{ borderColor: '#E8E2D8', color: '#374151' }}
            >
              <option value="">More…</option>
              {CATEGORIES.slice(5).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>

        {/* Location + clear — own row so it's not crammed on mobile */}
        <div className="flex items-center gap-2 mb-5">
          <select
            value={filterLocation}
            onChange={e => setFilterLocation(e.target.value)}
            className="flex-1 sm:flex-none text-xs px-3 py-1.5 rounded-full border bg-white focus:outline-none"
            style={{ borderColor: '#E8E2D8', color: '#374151' }}
          >
            <option value="">📍 All locations</option>
            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          {hasFilters && (
            <button
              onClick={() => { setFilterCategory(''); setFilterLocation(''); setSearch('') }}
              className="text-xs underline shrink-0"
              style={{ color: '#6B7280' }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Count */}
        {!loading && (
          <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
            {displayed.length} item{displayed.length !== 1 ? 's' : ''}
            {tab === 'found' ? ' found on campus' : ' reported lost'}
            {hasFilters ? ' · filtered' : ''}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="text-center py-16 sm:py-20 text-sm" style={{ color: '#9CA3AF' }}>Loading…</div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <p className="text-4xl mb-3">{tab === 'found' ? '📭' : '🔍'}</p>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              {tab === 'found' ? 'No found items match your filters.' : 'No lost items match your filters.'}
            </p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Try adjusting your search or clearing filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {displayed.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                tab={tab}
                onClick={() => navigate(`/item/${item.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}