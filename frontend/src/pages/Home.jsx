import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { CATEGORIES, LOCATIONS } from '../lib/constants'

export default function Home() {
  const { profile } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterLocation, setFilterLocation] = useState('')

  useEffect(() => {
    fetchItems()
  }, [filterCategory, filterLocation])

  async function fetchItems() {
    setLoading(true)

    let query = supabase
      .from('found_items')
      .select('*')
      .in('status', ['active', 'stored'])
      .order('created_at', { ascending: false })

    if (filterCategory) query = query.eq('category', filterCategory)
    if (filterLocation) query = query.eq('location', filterLocation)

    const { data, error } = await query

    if (error) {
      console.error(error)
    } else {
      setItems(data)
    }
    setLoading(false)
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  function statusBadge(status) {
    if (status === 'stored') return (
      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
        Stored at Security
      </span>
    )
    return (
      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
        Just Reported
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">NITJ Lost & Found</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {profile ? `Welcome, ${profile.name}` : 'Browse found items on campus'}
            </p>
          </div>
          <div className="flex gap-2">
            {profile && (
              <a
                href="/report-lost"
                className="bg-gray-100 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                Report Lost
              </a>
            )}
            {(profile?.role === 'security' || profile?.role === 'admin') && (
              <a
                href="/report-found"
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                + Found Item
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={filterLocation}
            onChange={e => setFilterLocation(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Locations</option>
            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          {(filterCategory || filterLocation) && (
            <button
              onClick={() => { setFilterCategory(''); setFilterLocation('') }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Items */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-500 text-sm">No found items yet.</p>
            <p className="text-gray-400 text-xs mt-1">Check back later or adjust your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">

                {/* Category tag + status */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {item.category}
                  </span>
                  {statusBadge(item.status)}
                </div>

                {/* Title */}
                <h3 className="font-semibold text-gray-800 text-sm mb-1">{item.title}</h3>

                {/* Description */}
                {item.description && (
                  <p className="text-gray-500 text-xs mb-2 line-clamp-2">{item.description}</p>
                )}

                {/* Location + date */}
                <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                  <span>📍 {item.location}</span>
                  <span>{formatDate(item.created_at)}</span>
                </div>

                {/* Claim button (students only) */}
                {profile && profile.role !== 'security' && profile.role !== 'admin' && item.status === 'stored' && (
                  <button className="mt-3 w-full bg-blue-50 text-blue-600 text-xs py-1.5 rounded-lg hover:bg-blue-100 font-medium">
                    This is mine →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}