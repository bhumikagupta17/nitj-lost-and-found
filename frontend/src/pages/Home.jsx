import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { CATEGORIES, LOCATIONS } from '../lib/constants'

export default function Home() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

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
      .in('status', ['active', 'claimed'])
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

      {/* ── Hero / Quick Actions ─────────────────────────────────── */}
      <div className="bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8">

          {/* Welcome line */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {profile ? `Hey, ${profile.name.split(' ')[0]} 👋` : '🏫 NITJ Lost & Found'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {profile
                ? 'What do you need help with today?'
                : 'Browse items found on campus or sign in to post.'}
            </p>
          </div>

          {/* Quick action cards — only shown to logged-in users */}
          {user && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

              {/* Dashboard */}
              <button
                onClick={() => navigate('/dashboard')}
                className="flex flex-col items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-4 hover:bg-blue-100 hover:border-blue-300 transition-all text-left"
              >
                <span className="text-2xl">📬</span>
                <div>
                  <p className="text-sm font-semibold text-blue-800">My Dashboard</p>
                  <p className="text-xs text-blue-500 mt-0.5">Claims &amp; activity</p>
                </div>
              </button>

              {/* Found something */}
              <button
                onClick={() => navigate('/report-found')}
                className="flex flex-col items-start gap-2 bg-green-50 border border-green-100 rounded-xl p-4 hover:bg-green-100 hover:border-green-300 transition-all text-left"
              >
                <span className="text-2xl">📦</span>
                <div>
                  <p className="text-sm font-semibold text-green-800">Found Item</p>
                  <p className="text-xs text-green-500 mt-0.5">Post what you found</p>
                </div>
              </button>

              {/* Lost something */}
              <button
                onClick={() => navigate('/report-lost')}
                className="flex flex-col items-start gap-2 bg-orange-50 border border-orange-100 rounded-xl p-4 hover:bg-orange-100 hover:border-orange-300 transition-all text-left"
              >
                <span className="text-2xl">🔍</span>
                <div>
                  <p className="text-sm font-semibold text-orange-800">Lost Item</p>
                  <p className="text-xs text-orange-500 mt-0.5">Report what you lost</p>
                </div>
              </button>

              {/* Admin — only for admin role */}
              {profile?.role === 'admin' ? (
                <button
                  onClick={() => navigate('/admin')}
                  className="flex flex-col items-start gap-2 bg-purple-50 border border-purple-100 rounded-xl p-4 hover:bg-purple-100 hover:border-purple-300 transition-all text-left"
                >
                  <span className="text-2xl">🛡️</span>
                  <div>
                    <p className="text-sm font-semibold text-purple-800">Admin Panel</p>
                    <p className="text-xs text-purple-500 mt-0.5">Manage portal</p>
                  </div>
                </button>
              ) : profile?.role === 'security' ? (
                <button
                  onClick={() => navigate('/security')}
                  className="flex flex-col items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-4 hover:bg-red-100 hover:border-red-300 transition-all text-left"
                >
                  <span className="text-2xl">🚨</span>
                  <div>
                    <p className="text-sm font-semibold text-red-800">Security Desk</p>
                    <p className="text-xs text-red-500 mt-0.5">Escalated items</p>
                  </div>
                </button>
              ) : (
                // Placeholder card for students — tips / info
                <div className="flex flex-col items-start gap-2 bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">How it works</p>
                    <p className="text-xs text-gray-400 mt-0.5">Find → Claim → Chat → Return</p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Not logged in — login nudge */}
          {!user && (
            <button
              onClick={() => navigate('/login')}
              className="mt-2 bg-blue-600 text-white text-sm px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Sign in to post or claim →
            </button>
          )}
        </div>
      </div>

      {/* ── Browse Section ───────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-6">

        {/* Section title + filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2 className="text-base font-bold text-gray-700">
            📋 Found items on campus
            {items.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({items.length} listed)
              </span>
            )}
          </h2>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={filterLocation}
              onChange={e => setFilterLocation(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Locations</option>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>

            {(filterCategory || filterLocation) && (
              <button
                onClick={() => { setFilterCategory(''); setFilterLocation('') }}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Items grid */}
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">Loading...</div>
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

                {/* Description snippet */}
                {item.description && (
                  <p className="text-gray-500 text-xs mb-2 line-clamp-2">{item.description}</p>
                )}

                {/* Divider */}
                <div className="h-px bg-gray-100 my-2" />

                {/* Location + date */}
                <div className="flex items-center justify-between text-xs text-gray-400">
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