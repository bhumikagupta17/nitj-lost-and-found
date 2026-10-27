import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()

  const [lostItems, setLostItems] = useState([])
  const [myClaims, setMyClaims] = useState([])        // claims I submitted (as claimer)
  const [foundItems, setFoundItems] = useState([])    // items I posted (as finder)
  const [incomingClaims, setIncomingClaims] = useState([]) // claims on my found items
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null) // claimId being accepted/rejected

  useEffect(() => {
    if (!authLoading && user) fetchData()
  }, [user, authLoading])

  async function fetchData() {
    setLoading(true)

    // 1. My lost reports
    const { data: lostData } = await supabase
      .from('lost_items')
      .select('*')
      .eq('reported_by', user.id)
      .order('created_at', { ascending: false })

    // 2. My found item posts
    const { data: foundData } = await supabase
      .from('found_items')
      .select('*')
      .eq('reported_by', user.id)
      .order('created_at', { ascending: false })

    // 3. Incoming claims on my found items (with claimer info)
    const { data: incomingData } = await supabase
      .from('claims')
      .select('*, found_items!inner(title, location, reported_by), users(name, department, roll_no)')
      .eq('found_items.reported_by', user.id)
      .order('created_at', { ascending: false })

    // 4. Claims I submitted (as claimer)
    const { data: myClaimsData } = await supabase
      .from('claims')
      .select('*, found_items(title, location, category)')
      .eq('claimant_id', user.id)
      .order('created_at', { ascending: false })

    setLostItems(lostData || [])
    setFoundItems(foundData || [])
    setIncomingClaims(incomingData || [])
    setMyClaims(myClaimsData || [])
    setLoading(false)
  }

  // ── Accept a claim ───────────────────────────────────────────────
  async function acceptClaim(claim) {
    setActionLoading(claim.id)

    // Update claim status to accepted
    await supabase
      .from('claims')
      .update({ status: 'accepted' })
      .eq('id', claim.id)

    // Update found_item status to claimed
    await supabase
      .from('found_items')
      .update({ status: 'claimed' })
      .eq('id', claim.found_item_id)

    // Reject all other pending claims on this item
    await supabase
      .from('claims')
      .update({ status: 'rejected' })
      .eq('found_item_id', claim.found_item_id)
      .eq('status', 'pending')
      .neq('id', claim.id)

    setActionLoading(null)
    fetchData()
  }

  // ── Reject a claim ───────────────────────────────────────────────
  async function rejectClaim(claimId) {
    setActionLoading(claimId)
    await supabase
      .from('claims')
      .update({ status: 'rejected' })
      .eq('id', claimId)
    setActionLoading(null)
    fetchData()
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  function statusBadge(status, type = 'claim') {
    const claimMap = {
      pending:  { bg: 'bg-blue-100',   text: 'text-blue-700',   label: '⏳ Pending' },
      accepted: { bg: 'bg-green-100',  text: 'text-green-700',  label: '✅ Accepted' },
      rejected: { bg: 'bg-red-100',    text: 'text-red-600',    label: '❌ Rejected' },
      closed:   { bg: 'bg-gray-100',   text: 'text-gray-500',   label: '✔ Closed' },
    }
    const itemMap = {
      active:    { bg: 'bg-green-100',  text: 'text-green-700',  label: '🟢 Active' },
      claimed:   { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '⏳ Claimed' },
      accepted:  { bg: 'bg-blue-100',   text: 'text-blue-700',   label: '💬 In Chat' },
      closed:    { bg: 'bg-gray-100',   text: 'text-gray-500',   label: '✔ Closed' },
      escalated: { bg: 'bg-red-100',    text: 'text-red-600',    label: '🚨 Escalated' },
    }
    const map = type === 'item' ? itemMap : claimMap
    const s = map[status] || map.active || map.pending
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

  const pendingIncoming = incomingClaims.filter(c => c.status === 'pending')

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">My Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {profile?.name ? `Welcome back, ${profile.name}` : 'Your activity'}
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

        {/* ══ SECTION 1: Incoming claims on my found items ══ */}
        {foundItems.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              📬 Incoming Claims
              {pendingIncoming.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingIncoming.length} new
                </span>
              )}
            </h2>

            {incomingClaims.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-gray-500 text-sm">No one has claimed your found items yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incomingClaims.map(claim => (
                  <div
                    key={claim.id}
                    className={`bg-white rounded-xl border p-5 ${
                      claim.status === 'pending' ? 'border-blue-300 shadow-sm' : 'border-gray-200'
                    }`}
                  >
                    {/* Claim header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Claim on</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {claim.found_items?.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          by {claim.users?.name || 'a student'}
                          {claim.users?.roll_no ? ` · ${claim.users.roll_no}` : ''}
                          {claim.users?.department ? ` · ${claim.users.department}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {statusBadge(claim.status, 'claim')}
                        <p className="text-xs text-gray-400 mt-1">{formatDate(claim.created_at)}</p>
                      </div>
                    </div>

                    {/* Ownership proof */}
                    {claim.description_proof && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">
                          Their ownership description:
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          "{claim.description_proof}"
                        </p>
                      </div>
                    )}

                    {/* Action buttons */}
                    {claim.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptClaim(claim)}
                          disabled={actionLoading === claim.id}
                          className="flex-1 bg-green-600 text-white text-sm py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                        >
                          {actionLoading === claim.id ? '...' : '✅ Accept — sounds right'}
                        </button>
                        <button
                          onClick={() => rejectClaim(claim.id)}
                          disabled={actionLoading === claim.id}
                          className="flex-1 border border-red-200 text-red-600 text-sm py-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
                        >
                          ❌ Reject — doesn't match
                        </button>
                      </div>
                    )}

                    {/* Accepted — go to chat */}
                    {claim.status === 'accepted' && (
                      <button
                        onClick={() => navigate(`/chat/${claim.id}`)}
                        className="w-full bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 font-medium"
                      >
                        💬 Open Chat →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ══ SECTION 2: My Found Item Posts ══ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">
              📦 Items I Found & Posted
              <span className="ml-2 text-sm font-normal text-gray-400">({foundItems.length})</span>
            </h2>
            <button
              onClick={() => navigate('/report-found')}
              className="text-sm text-blue-600 hover:underline"
            >
              + Post found item
            </button>
          </div>

          {foundItems.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-gray-500 text-sm">You haven't posted any found items yet.</p>
              <button
                onClick={() => navigate('/report-found')}
                className="mt-3 text-blue-600 text-sm hover:underline"
              >
                Post a found item →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {foundItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/item/${item.id}`)}
                  className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                      {statusBadge(item.status, 'item')}
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm">{item.title}</h3>
                    {item.description && (
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{item.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">{formatDate(item.created_at)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">📍 {item.location}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ══ SECTION 3: My Claims (as claimer) ══ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">
              🙋 My Claims
              <span className="ml-2 text-sm font-normal text-gray-400">({myClaims.length})</span>
            </h2>
          </div>

          {myClaims.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
              <p className="text-3xl mb-2">📋</p>
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
              {myClaims.map(claim => (
                <div key={claim.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {claim.found_items?.category}
                        </span>
                        {statusBadge(claim.status, 'claim')}
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm">
                        {claim.found_items?.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        📍 {claim.found_items?.location}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 shrink-0">{formatDate(claim.created_at)}</p>
                  </div>

                  {/* Chat button for accepted claims */}
                  {claim.status === 'accepted' && (
                    <button
                      onClick={() => navigate(`/chat/${claim.id}`)}
                      className="w-full mt-2 bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 font-medium"
                    >
                      💬 Open Chat →
                    </button>
                  )}

                  {/* View item button for pending */}
                  {claim.status === 'pending' && (
                    <button
                      onClick={() => navigate(`/item/${claim.found_item_id}`)}
                      className="w-full mt-2 border border-gray-200 text-gray-500 text-sm py-2 rounded-lg hover:bg-gray-50"
                    >
                      View item →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ══ SECTION 4: My Lost Reports ══ */}
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
                      {statusBadge(item.status, 'item')}
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

      </div>
    </div>
  )
}