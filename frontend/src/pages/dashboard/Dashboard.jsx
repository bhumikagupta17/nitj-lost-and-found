import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../hooks/useAuth.js'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()
  const [lostItems, setLostItems] = useState([])
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && user) {
      fetchData()
    }
  }, [user, authLoading])

  async function fetchData() {
    setLoading(true)

    // Fetch the user's own lost item reports
    const { data: lostData } = await supabase
      .from('lost_items')
      .select('*')
      .eq('reported_by', user.id)
      .order('created_at', { ascending: false })

    // Fetch the user's claims (joined with found_items details)
    const { data: claimsData } = await supabase
      .from('claims')
      .select('*, found_items(*)')
      .eq('claimed_by', user.id)
      .order('created_at', { ascending: false })

    setLostItems(lostData || [])
    setClaims(claimsData || [])
    setLoading(false)
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  function lostStatusBadge(status) {
    const map = {
      active: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Still Looking' },
      closed: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Closed' },
    }
    const s = map[status] || map.active
    return (
      <span className={`${s.bg} ${s.text} text-xs px-2 py-0.5 rounded-full font-medium`}>
        {s.label}
      </span>
    )
  }

  function claimStatusBadge(status) {
    const map = {
      pending:  { bg: 'bg-blue-100',   text: 'text-blue-700',   label: '⏳ Pending' },
      approved: { bg: 'bg-green-100',  text: 'text-green-700',  label: '✅ Approved' },
      rejected: { bg: 'bg-red-100',    text: 'text-red-600',    label: '❌ Rejected' },
    }
    const s = map[status] || map.pending
    return (
      <span className={`${s.bg} ${s.text} text-xs px-2 py-0.5 rounded-full font-medium`}>
        {s.label}
      </span>
    )
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">My Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {profile?.name ? `Welcome back, ${profile.name}` : 'Your reports and claims'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/')}
              className="border border-gray-300 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              ← Home
            </button>
            <button
              onClick={() => navigate('/report-lost')}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Report Lost
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">

        {/* ── Section 1: My Lost Reports ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">
              🔍 My Lost Reports
              <span className="ml-2 text-sm font-normal text-gray-400">({lostItems.length})</span>
            </h2>
          </div>

          {lostItems.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-gray-500 text-sm">You haven't reported any lost items yet.</p>
              <button
                onClick={() => navigate('/report-lost')}
                className="mt-3 text-blue-600 text-sm hover:underline"
              >
                Report something lost →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {lostItems.map(item => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                      {lostStatusBadge(item.status)}
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm">{item.title}</h3>
                    {item.description && (
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{item.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">{formatDate(item.created_at)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      📍 {item.location_last_seen || item.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Section 2: My Claims ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">
              🙋 My Claims
              <span className="ml-2 text-sm font-normal text-gray-400">({claims.length})</span>
            </h2>
          </div>

          {claims.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
              <p className="text-3xl mb-2">📦</p>
              <p className="text-gray-500 text-sm">You haven't claimed any found items yet.</p>
              <button
                onClick={() => navigate('/')}
                className="mt-3 text-blue-600 text-sm hover:underline"
              >
                Browse found items →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map(claim => (
                <div key={claim.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {claim.found_items?.category}
                      </span>
                      {claimStatusBadge(claim.status)}
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm">
                      {claim.found_items?.title}
                    </h3>
                    {claim.message && (
                      <p className="text-gray-500 text-xs mt-0.5 italic">"{claim.message}"</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">Claimed {formatDate(claim.created_at)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      📍 {claim.found_items?.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}