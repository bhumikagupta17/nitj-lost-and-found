import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

function daysSince(d) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function LostCard({ report }) {
  const days = daysSince(report.created_at)
  return (
    <div className="bg-white rounded-2xl border p-4 hover:shadow-sm transition-all" style={{ borderColor: '#E8E2D8' }}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F5F0E8', color: '#374151' }}>
            {report.category}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#FFF7ED', color: '#C2410C' }}>
            😟 Lost
          </span>
        </div>
        <span className="text-xs shrink-0" style={{ color: '#9CA3AF' }}>{days}d ago</span>
      </div>

      <h3 className="font-semibold text-sm mb-1 truncate" style={{ color: '#1C2B1E' }}>{report.title}</h3>
      {report.description && (
        <p className="text-xs mb-2 line-clamp-2" style={{ color: '#9CA3AF' }}>{report.description}</p>
      )}

      <div className="h-px my-2" style={{ backgroundColor: '#E8E2D8' }} />

      <div className="flex items-center justify-between text-xs mb-3" style={{ color: '#9CA3AF' }}>
        {report.last_seen_location
          ? <span className="truncate mr-2">📍 Last seen: {report.last_seen_location}</span>
          : <span className="truncate mr-2">📍 Location unknown</span>
        }
        {report.lost_date && (
          <span className="shrink-0">Lost {formatDate(report.lost_date)}</span>
        )}
      </div>

      {/* Owner info — shown publicly */}
      {report.users && (
        <div className="text-xs px-3 py-2 rounded-xl" style={{ backgroundColor: '#EEF9F4' }}>
          <span className="font-medium" style={{ color: '#374151' }}>Owner: </span>
          <span style={{ color: '#2D6A4F' }}>
            {report.users.name}
            {report.users.department && ` · ${report.users.department}`}
          </span>
        </div>
      )}
    </div>
  )
}

export default function LostItems() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  const CATEGORIES = ['All', 'Electronics', 'Bag / Backpack', 'Wallet / Purse', 'ID / Card',
    'Keys', 'Books / Notes', 'Clothing', 'Jewellery', 'Stationery', 'Other']

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      const { data } = await supabase
        .from('lost_reports')
        .select('*, users(name, department)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
      setReports(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const filtered = reports.filter(r => {
    const matchCat = category === 'All' || r.category === category
    const q = search.toLowerCase()
    const matchSearch = !q || r.title.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.last_seen_location?.toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>

      {/* Header */}
      <div className="bg-white border-b px-4 sm:px-6 py-3 sm:py-4" style={{ borderColor: '#E8E2D8' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-lg font-bold" style={{ color: '#1C2B1E', fontFamily: "'Lora','Georgia',serif" }}>
              😟 Lost Items
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              Students looking for their belongings. If you found something matching, report it and hand it to security.
            </p>
          </div>
          <button
            onClick={() => navigate('/report-lost')}
            className="shrink-0 text-white text-xs font-semibold px-3 py-2 rounded-full hover:opacity-90 active:scale-95 transition-all"
            style={{ backgroundColor: '#1C3829' }}
          >
            + Report Lost
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-6">

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search lost items…"
            className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            style={{ border: '1.5px solid #E8E2D8', backgroundColor: '#fff', color: '#1C2B1E' }}
          />
        </div>

        {/* Category chips */}
        <div className="flex gap-2 flex-wrap mb-5">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="text-xs px-3 py-1.5 rounded-full border transition-all active:scale-95"
              style={category === cat
                ? { backgroundColor: '#1C3829', color: '#fff', borderColor: '#1C3829' }
                : { backgroundColor: '#fff', color: '#374151', borderColor: '#E8E2D8' }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-sm" style={{ color: '#9CA3AF' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm" style={{ color: '#6B7280' }}>No lost reports match your search.</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Try a different category or search term.</p>
          </div>
        ) : (
          <>
            <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
              {filtered.length} open report{filtered.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(r => <LostCard key={r.id} report={r} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}