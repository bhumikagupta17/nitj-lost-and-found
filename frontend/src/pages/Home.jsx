import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { CATEGORIES, LOCATIONS } from '../lib/constants'

export default function Home() {
  const navigate = useNavigate()
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
      .in('status', ['active', 'claimed'])   // active = unclaimed, claimed = pending handover
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
    if (status === 'claimed') return (
      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">
        ⏳ Being Claimed
      </span>
    )
    return (
      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
        🟢 Available
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
              <button
                onClick={() => navigate('/report-lost')}
                className="bg-gray-100 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                Report Lost
              </button>
            )}
            {profile && (
              <button
                onClick={() => navigate('/report-found')}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                + Found Item
              </button>
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

        {/* Items grid */}
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
              <div
                key={item.id}
                onClick={() => navigate(`/item/${item.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
              >

                {/* Category tag + status */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {item.category}
                  </span>
                  {statusBadge(item.status)}
                </div>

                {/* Title */}
                <h3 className="font-semibold text-gray-800 text-sm mb-1">{item.title}</h3>

                {/* Description — blurred hint, real details only on ItemDetail */}
                {item.description && (
                  <p className="text-gray-500 text-xs mb-2 line-clamp-2">{item.description}</p>
                )}

                {/* Photo placeholder — always hidden on home */}
                <div className="h-1.5 bg-gray-100 rounded-full mb-3" />

                {/* Location + date */}
                <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                  <span>📍 {item.location}</span>
                  <span>{formatDate(item.created_at)}</span>
                </div>

                {/* CTA */}
                <div className="mt-3 text-xs text-blue-600 font-medium text-right">
                  {item.status === 'claimed' ? 'View details →' : 'Is this yours? →'}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}